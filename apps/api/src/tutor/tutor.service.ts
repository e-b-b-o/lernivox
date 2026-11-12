import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  buildTutorPrompt,
  parseTutorResponse,
  type AiProvider,
  type CompletionMessage,
  type RetrievedPassage,
} from '@lernivox/ai-core';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateConversationRequestDto } from './dto/create-conversation.dto';
import { SendTutorMessageRequestDto } from './dto/send-message.dto';
import {
  ConversationDetailResponseDto,
  ConversationMessageResponseDto,
  ConversationSummaryResponseDto,
  TutorChunkDetailResponseDto,
} from './dto/tutor-response.dto';
import { RetrievalService } from './retrieval.service';
import { AI_PROVIDER_TOKEN } from './tutor.constants';
import { WorkspacesService } from '../workspaces/workspaces.service';

@Injectable()
export class TutorService {
  private readonly logger = new Logger(TutorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly retrievalService: RetrievalService,
    private readonly workspacesService: WorkspacesService,
    @Inject(AI_PROVIDER_TOKEN) private readonly aiProvider: AiProvider,
  ) {}

  /**
   * Creates a new conversation scoped to a document and its workspace.
   */
  async createConversation(
    userId: string,
    dto: CreateConversationRequestDto,
  ): Promise<ConversationSummaryResponseDto> {
    const { document: doc } = await this.workspacesService.verifyDocumentAccess(
      userId,
      dto.documentId,
    );

    if (doc.status !== 'READY') {
      throw new BadRequestException(
        `Document is currently in ${doc.status} status. It must be READY before studying.`,
      );
    }

    const title = dto.title?.trim() || 'New Study Session';

    const conversation = await this.prisma.conversation.create({
      data: {
        userId,
        documentId: doc.id,
        workspaceId: doc.workspaceId,
        title,
      },
    });

    return {
      id: conversation.id,
      userId: conversation.userId,
      documentId: conversation.documentId,
      title: conversation.title,
      createdAt: conversation.createdAt.toISOString(),
      updatedAt: conversation.updatedAt.toISOString(),
      messageCount: 0,
    };
  }

  /**
   * Lists all study conversations belonging to the user, optionally filtered by document.
   */
  async listConversations(
    userId: string,
    documentId?: string,
  ): Promise<ConversationSummaryResponseDto[]> {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        userId,
        ...(documentId ? { documentId } : {}),
      },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { content: true },
        },
        _count: {
          select: { messages: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return conversations.map((c) => ({
      id: c.id,
      userId: c.userId,
      documentId: c.documentId,
      title: c.title,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
      messageCount: c._count.messages,
      lastMessagePreview: c.messages[0]?.content?.slice(0, 80),
    }));
  }

  /**
   * Retrieves a single conversation with its full message history and citations.
   */
  async getConversation(
    userId: string,
    conversationId: string,
  ): Promise<ConversationDetailResponseDto> {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        document: { select: { id: true, title: true } },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            citations: true,
          },
        },
      },
    });

    if (!conversation || conversation.userId !== userId) {
      throw new NotFoundException('Study conversation not found or access denied');
    }

    return {
      id: conversation.id,
      userId: conversation.userId,
      documentId: conversation.documentId,
      documentTitle: conversation.document?.title,
      title: conversation.title,
      createdAt: conversation.createdAt.toISOString(),
      updatedAt: conversation.updatedAt.toISOString(),
      messages: conversation.messages.map((m) => ({
        id: m.id,
        conversationId: m.conversationId,
        sender: m.sender,
        content: m.content,
        tokenCount: m.tokenCount,
        metadata: (m.metadata as Record<string, unknown>) || null,
        citations: m.citations.map((c) => ({
          id: c.id,
          sourceId: c.chunkId ? `S${c.chunkId.slice(-2)}` : 'S1',
          chunkId: c.chunkId,
          documentId: c.documentId,
          quoteSnippet: c.quoteSnippet,
          pageNumber: c.pageNumber,
          chapter: c.chapter,
          relevanceScore: c.relevanceScore,
        })),
        createdAt: m.createdAt.toISOString(),
      })),
    };
  }

  /**
   * Renames a study conversation.
   */
  async renameConversation(
    userId: string,
    conversationId: string,
    title: string,
  ): Promise<ConversationSummaryResponseDto> {
    const existing = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!existing || existing.userId !== userId) {
      throw new NotFoundException('Conversation not found or access denied');
    }

    const updated = await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { title: title.trim() },
      include: {
        _count: { select: { messages: true } },
      },
    });

    return {
      id: updated.id,
      userId: updated.userId,
      documentId: updated.documentId,
      title: updated.title,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
      messageCount: updated._count.messages,
    };
  }

  /**
   * Deletes a study conversation and all its messages.
   */
  async deleteConversation(userId: string, conversationId: string): Promise<{ success: boolean }> {
    const existing = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!existing || existing.userId !== userId) {
      throw new NotFoundException('Conversation not found or access denied');
    }

    await this.prisma.conversation.delete({
      where: { id: conversationId },
    });

    return { success: true };
  }

  /**
   * Submits a student question, performs RAG retrieval, invokes the grounded AI model,
   * validates citations, and persists both user and assistant messages with citations.
   */
  async sendMessage(
    userId: string,
    conversationId: string,
    dto: SendTutorMessageRequestDto,
  ): Promise<ConversationMessageResponseDto> {
    const overallStartTime = Date.now();

    // 1. Verify conversation access and ownership
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        document: true,
      },
    });

    if (!conversation || conversation.userId !== userId) {
      throw new NotFoundException('Conversation not found or access denied');
    }

    if (!conversation.documentId || !conversation.document) {
      throw new BadRequestException('This conversation is not associated with an active document');
    }

    const document = conversation.document;
    if (document.status !== 'READY') {
      throw new BadRequestException('The textbook is still processing. Please wait until status is READY.');
    }

    // 2. Persist the student's question
    const userMessage = await this.prisma.conversationMessage.create({
      data: {
        conversationId,
        sender: 'USER',
        content: dto.message.trim(),
      },
    });

    // 3. Update conversation title if still default
    if (conversation.title === 'New Study Session' || !conversation.title) {
      const derivedTitle =
        dto.message.trim().slice(0, 38) + (dto.message.trim().length > 38 ? '...' : '');
      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: { title: derivedTitle },
      });
    }

    // 4. Retrieve recent message history (up to last 6 turns)
    const recentMessages = await this.prisma.conversationMessage.findMany({
      where: { conversationId, id: { not: userMessage.id } },
      orderBy: { createdAt: 'desc' },
      take: 6,
    });
    // Reverse to chronological order
    recentMessages.reverse();

    const historyForPrompt: CompletionMessage[] = recentMessages.map((m) => ({
      role: m.sender === 'USER' ? 'user' : 'assistant',
      content: m.content,
    }));

    // 5. Perform semantic retrieval against pgvector
    let passages: RetrievedPassage[] = [];
    try {
      passages = await this.retrievalService.retrieveRelevantChunks(
        document.id,
        document.title,
        dto.message.trim(),
        6,
        0.1,
      );
      this.logger.log(
        `[RAG Retrieval] Document: ${document.id} | Query: "${dto.message.trim()}" | Retrieved: ${passages.length} chunks`,
      );
    } catch (retrievalErr: unknown) {
      const errMsg =
        retrievalErr instanceof Error ? retrievalErr.message : 'Retrieval pipeline error';
      this.logger.error(
        `[RAG Retrieval CRITICAL FAILURE]: Document: ${document.id} | Query: "${dto.message.trim()}" | Error: ${errMsg}`,
        retrievalErr instanceof Error ? retrievalErr.stack : undefined,
      );
      throw new InternalServerErrorException(
        `Semantic retrieval failed: ${errMsg}`,
      );
    }

    // 6. Build grounded system prompt & contextual messages
    const prompt = buildTutorPrompt({
      documentTitle: document.title,
      studentQuestion: dto.message.trim(),
      recentHistory: historyForPrompt,
      retrievedPassages: passages,
      allowGeneralKnowledge: dto.allowGeneralKnowledge,
    });

    // 7. Invoke AI provider with prompt
    let completionText = '';
    let completionTokens = 0;
    try {
      const completion = await this.aiProvider.generateCompletion({
        messages: prompt.messages,
        systemPrompt: prompt.systemPrompt,
        temperature: 0.3,
      });
      completionText = completion.content;
      completionTokens = completion.completionTokens ?? 0;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'AI completion failed';
      this.logger.error(`AI completion failed for conversation ${conversationId}: ${errMsg}`);

      if (errMsg.includes('quota') || errMsg.includes('429') || errMsg.includes('rate limit')) {
        throw new ServiceUnavailableException(
          'The AI tutor service is currently experiencing high demand. Please try again in a moment.',
        );
      }
      throw new InternalServerErrorException(
        'Unable to generate grounded response. Please try asking again.',
      );
    }

    // 8. Parse response, validate citations against supplied passages
    const parsed = parseTutorResponse(completionText, passages);

    // 9. Persist assistant message and verified citations
    const assistantMessage = await this.prisma.conversationMessage.create({
      data: {
        conversationId,
        sender: 'ASSISTANT',
        content: parsed.content,
        tokenCount: completionTokens || null,
        metadata: {
          ...(parsed.structuredSections || {}),
          isUnsupportedQuestion: parsed.isUnsupportedQuestion,
          confidenceScore: parsed.confidenceScore,
        },
        citations: {
          create: parsed.citations.map((c) => ({
            documentId: c.documentId,
            chunkId: c.chunkId,
            quoteSnippet: c.quoteSnippet,
            pageNumber: c.pageNumber,
            chapter: c.chapter,
            relevanceScore: c.relevanceScore,
          })),
        },
      },
      include: {
        citations: true,
      },
    });

    // 10. Update conversation updatedAt timestamp
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    const totalDuration = Date.now() - overallStartTime;
    this.logger.log(
      `Tutor message completed in ${totalDuration}ms (citations: ${assistantMessage.citations.length}, unsupported: ${parsed.isUnsupportedQuestion})`,
    );

    // Map into DTO
    return {
      id: assistantMessage.id,
      conversationId: assistantMessage.conversationId,
      sender: assistantMessage.sender,
      content: assistantMessage.content,
      tokenCount: assistantMessage.tokenCount,
      metadata: (assistantMessage.metadata as Record<string, unknown>) || null,
      citations: assistantMessage.citations.map((c, index) => ({
        id: c.id,
        sourceId: `S${index + 1}`,
        chunkId: c.chunkId,
        documentId: c.documentId,
        quoteSnippet: c.quoteSnippet,
        pageNumber: c.pageNumber,
        chapter: c.chapter,
        relevanceScore: c.relevanceScore,
      })),
      createdAt: assistantMessage.createdAt.toISOString(),
    };
  }

  /**
   * Retrieves verified chunk passage details for citation inspection.
   * Enforces document ownership or group workspace membership via WorkspacesService.
   */
  async getChunkDetail(userId: string, chunkId: string): Promise<TutorChunkDetailResponseDto> {
    const chunk = await this.prisma.documentChunk.findUnique({
      where: { id: chunkId },
      include: {
        document: {
          select: { id: true, title: true, ownerId: true },
        },
      },
    });

    if (!chunk) {
      throw new NotFoundException('Source passage not found');
    }

    await this.workspacesService.verifyDocumentAccess(userId, chunk.documentId);

    return {
      chunkId: chunk.id,
      documentId: chunk.documentId,
      documentTitle: chunk.document.title,
      chunkIndex: chunk.chunkIndex,
      content: chunk.content,
      pageNumber: chunk.pageNumber,
      chapter: chunk.chapter,
      sectionTitle: chunk.sectionTitle,
    };
  }
}
