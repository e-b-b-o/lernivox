import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { prisma, createPrismaClient, type PrismaClient } from '@lernivox/database';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  readonly client: PrismaClient = prisma ?? createPrismaClient();

  async onModuleInit(): Promise<void> {
    try {
      await this.client.$connect();
      this.logger.log('Prisma connected to PostgreSQL successfully');
    } catch (err) {
      this.logger.error('Failed to connect to PostgreSQL via Prisma', err);
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.$disconnect();
  }

  get user(): PrismaClient['user'] {
    return this.client.user;
  }

  get userIdentity(): PrismaClient['userIdentity'] {
    return this.client.userIdentity;
  }

  get userSession(): PrismaClient['userSession'] {
    return this.client.userSession;
  }

  get userPreference(): PrismaClient['userPreference'] {
    return this.client.userPreference;
  }

  get document(): PrismaClient['document'] {
    return this.client.document;
  }

  get documentSection(): PrismaClient['documentSection'] {
    return this.client.documentSection;
  }

  get documentChunk(): PrismaClient['documentChunk'] {
    return this.client.documentChunk;
  }

  get chunkEmbedding(): PrismaClient['chunkEmbedding'] {
    return this.client.chunkEmbedding;
  }

  get conversation(): PrismaClient['conversation'] {
    return this.client.conversation;
  }

  get conversationMessage(): PrismaClient['conversationMessage'] {
    return this.client.conversationMessage;
  }

  get messageCitation(): PrismaClient['messageCitation'] {
    return this.client.messageCitation;
  }

  get documentReadingProgress(): PrismaClient['documentReadingProgress'] {
    return this.client.documentReadingProgress;
  }

  get documentBookmark(): PrismaClient['documentBookmark'] {
    return this.client.documentBookmark;
  }

  get quiz(): PrismaClient['quiz'] {
    return this.client.quiz;
  }

  get quizQuestion(): PrismaClient['quizQuestion'] {
    return this.client.quizQuestion;
  }

  get questionOption(): PrismaClient['questionOption'] {
    return this.client.questionOption;
  }

  get quizAttempt(): PrismaClient['quizAttempt'] {
    return this.client.quizAttempt;
  }

  get quizAttemptAnswer(): PrismaClient['quizAttemptAnswer'] {
    return this.client.quizAttemptAnswer;
  }

  get workspace(): PrismaClient['workspace'] {
    return this.client.workspace;
  }

  get workspaceMember(): PrismaClient['workspaceMember'] {
    return this.client.workspaceMember;
  }

  get workspaceInvitation(): PrismaClient['workspaceInvitation'] {
    return this.client.workspaceInvitation;
  }

  get workspaceDiscussionMessage(): PrismaClient['workspaceDiscussionMessage'] {
    return this.client.workspaceDiscussionMessage;
  }

  get sharedConversationSnapshot(): PrismaClient['sharedConversationSnapshot'] {
    return this.client.sharedConversationSnapshot;
  }

  get $transaction(): PrismaClient['$transaction'] {
    return this.client.$transaction.bind(this.client);
  }
}
