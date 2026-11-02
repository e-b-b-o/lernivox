/**
 * Shared contracts and DTO interfaces for the AI Tutor and conversation domain.
 */

export interface CreateConversationDto {
  documentId: string;
  title?: string;
}

export interface RenameConversationDto {
  title: string;
}

export interface SendTutorMessageDto {
  message: string;
  allowGeneralKnowledge?: boolean;
}

export interface MessageCitationDto {
  id: string;
  sourceId: string;
  chunkId: string | null;
  documentId: string;
  quoteSnippet: string;
  pageNumber: number | null;
  chapter: string | null;
  relevanceScore: number | null;
}

export interface StructuredSectionsDto {
  learningObjective?: string;
  simpleExplanation?: string;
  textbookMethod?: string;
  workedExample?: string;
  understandingCheck?: string;
  recap?: string;
}

export interface ConversationMessageMetadataDto {
  learningObjective?: string;
  simpleExplanation?: string;
  textbookMethod?: string;
  workedExample?: string;
  understandingCheck?: string;
  recap?: string;
  isUnsupportedQuestion?: boolean;
  confidenceScore?: number;
}

export interface ConversationMessageDto {
  id: string;
  conversationId: string;
  sender: 'USER' | 'ASSISTANT' | 'SYSTEM';
  content: string;
  tokenCount: number | null;
  metadata?: ConversationMessageMetadataDto | null;
  citations: MessageCitationDto[];
  createdAt: string;
}

export interface ConversationSummaryDto {
  id: string;
  userId: string;
  documentId: string | null;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  lastMessagePreview?: string;
}

export interface ConversationDetailDto {
  id: string;
  userId: string;
  documentId: string | null;
  documentTitle?: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ConversationMessageDto[];
}

export interface TutorChunkDetailDto {
  chunkId: string;
  documentId: string;
  documentTitle: string;
  chunkIndex: number;
  content: string;
  pageNumber: number | null;
  chapter: string | null;
  sectionTitle: string | null;
}
