'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  MessageSquare,
  Lock,
  Users,
  PanelRightClose,
  X,
  Share2,
} from 'lucide-react';
import type {
  ConversationDetailDto,
  ConversationMessageDto,
  ConversationSummaryDto,
  DocumentDto,
  MessageCitationDto,
  WorkspaceType,
} from '@lernivox/contracts';
import { CopilotSidecar } from './CopilotSidecar';
import { GroupDiscussionPane } from './GroupDiscussionPane';
import { ShareConversationModal } from './ShareConversationModal';

interface RightWorkspacePanelProps {
  workspaceType: WorkspaceType;
  workspaceId: string;
  currentUserId: string;
  currentPage: number;
  currentChapter?: string;
  isOpen: boolean;
  onToggle: () => void;
  document: DocumentDto | null;
  conversations: ConversationSummaryDto[];
  activeConversationId: string | null;
  activeConversation: ConversationDetailDto | null;
  loadingConv: boolean;
  onSelectConversation: (id: string) => void;
  onNewSession: () => void;
  onRenameSession: (id: string, newTitle: string) => void;
  onDeleteSession: (id: string) => void;
  onSendMessage: (content: string) => Promise<void>;
  sendingMessage: boolean;
  sendError: string | null;
  onRetryMessage?: () => void;
  onCitationClick: (chunkId: string, pageNumber?: number | null) => void;
  onOpenCitationInspector: (citation: MessageCitationDto) => void;
  preparedQuestion?: string | null;
  onClearPreparedQuestion?: () => void;
  onShareConversation?: (conversationId: string, title: string) => Promise<void>;
  isSharingConversation?: boolean;
  isMobileDrawer?: boolean;
  onCloseMobileDrawer?: () => void;
  hideHeader?: boolean;
}

export function RightWorkspacePanel(props: RightWorkspacePanelProps) {
  const {
    workspaceType,
    workspaceId,
    currentUserId,
    currentPage,
    currentChapter,
    isOpen,
    onToggle,
    activeConversation,
    onShareConversation,
    isSharingConversation,
    isMobileDrawer = false,
    onCloseMobileDrawer,
    hideHeader = false,
  } = props;

  const [activeTab, setActiveTab] = useState<'ai' | 'discussion'>('ai');
  const [shareModalOpen, setShareModalOpen] = useState(false);

  // If PERSONAL workspace, render pure CopilotSidecar without any group elements
  if (workspaceType === 'PERSONAL') {
    return (
      <CopilotSidecar
        isOpen={isOpen}
        onToggle={onToggle}
        document={props.document}
        conversations={props.conversations}
        activeConversationId={props.activeConversationId}
        activeConversation={props.activeConversation}
        loadingConv={props.loadingConv}
        onSelectConversation={props.onSelectConversation}
        onNewSession={props.onNewSession}
        onRenameSession={props.onRenameSession}
        onDeleteSession={props.onDeleteSession}
        onSendMessage={props.onSendMessage}
        sendingMessage={props.sendingMessage}
        sendError={props.sendError}
        onRetryMessage={props.onRetryMessage}
        onCitationClick={props.onCitationClick}
        onOpenCitationInspector={props.onOpenCitationInspector}
        preparedQuestion={props.preparedQuestion}
        onClearPreparedQuestion={props.onClearPreparedQuestion}
        isMobileDrawer={isMobileDrawer}
        onCloseMobileDrawer={onCloseMobileDrawer}
        hideHeader={hideHeader}
      />
    );
  }

  // When collapsed and not a mobile drawer, return null (floating triggers eliminated)
  if (!isOpen && !isMobileDrawer) {
    return null;
  }

  // GROUP WORKSPACE: Expanded Panel (Desktop or Mobile Drawer)
  const containerClasses = isMobileDrawer || hideHeader
    ? 'w-full h-full bg-[#FAF8F4] flex flex-col select-none'
    : 'hidden lg:flex w-[350px] xl:w-[410px] h-full bg-[#FAF8F4] border-l-[2px] border-[#1B3428]/15 flex-col shrink-0 select-none z-20 shadow-xs';

  return (
    <aside className={containerClasses}>
      {/* 1. TOP DUAL-CHAT TAB SWITCHER */}
      {hideHeader ? (
        <div className="h-10 px-3 border-b border-[#1B3428]/10 bg-[#F4F0E5] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 p-0.5 rounded-lg bg-[#FAF8F4] border border-[#1B3428]/15">
            <button
              type="button"
              onClick={() => setActiveTab('ai')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-display font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'ai'
                  ? 'bg-[#1B3428] text-white shadow-2xs'
                  : 'text-[#14261D]/70 hover:text-[#14261D]'
              }`}
              title="Private AI Tutor (strictly confidential to you)"
            >
              <Sparkles className="w-3 h-3 text-[#E8722C]" />
              <span>Private Tutor</span>
              <Lock className="w-2.5 h-2.5 opacity-80" />
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('discussion')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-display font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'discussion'
                  ? 'bg-[#1B3428] text-white shadow-2xs'
                  : 'text-[#14261D]/70 hover:text-[#14261D]'
              }`}
              title="Shared Group Discussion (visible to workspace members)"
            >
              <MessageSquare className="w-3 h-3 text-[#497E64]" />
              <span>Group Discussion</span>
              <Users className="w-2.5 h-2.5 opacity-80" />
            </button>
          </div>
        </div>
      ) : (
        <div className="h-12 px-3 border-b border-[#1B3428]/15 bg-[#F4F0E5] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5">
            {/* Tab 1: Private AI */}
            <button
              type="button"
              onClick={() => setActiveTab('ai')}
              className={`h-8 px-3 rounded-full text-xs font-display font-bold flex items-center gap-1.5 transition-all ${
                activeTab === 'ai'
                  ? 'bg-[#E8722C] text-white shadow-xs'
                  : 'bg-transparent text-[#14261D]/70 hover:bg-[#FAF8F4]'
              }`}
              title="Private AI Tutor (strictly confidential to you)"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Private Tutor</span>
              <Lock className="w-2.5 h-2.5 opacity-80" />
            </button>

            {/* Tab 2: Group Discussion */}
            <button
              type="button"
              onClick={() => setActiveTab('discussion')}
              className={`h-8 px-3 rounded-full text-xs font-display font-bold flex items-center gap-1.5 transition-all ${
                activeTab === 'discussion'
                  ? 'bg-[#1B3428] text-white shadow-xs'
                  : 'bg-transparent text-[#14261D]/70 hover:bg-[#FAF8F4]'
              }`}
              title="Shared Group Discussion (visible to workspace members)"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Group Discussion</span>
              <Users className="w-2.5 h-2.5 opacity-80" />
            </button>
          </div>

          {/* Right Action: Close/Collapse */}
          <div className="flex items-center gap-1.5 shrink-0">
            {isMobileDrawer ? (
              <button
                type="button"
                onClick={onCloseMobileDrawer}
                className="w-7 h-7 rounded-full bg-[#FAF8F4] border border-[#1B3428]/20 flex items-center justify-center text-[#14261D]/70 hover:bg-[#FBE8DC] cursor-pointer"
                title="Collapse sidecar"
                aria-label="Collapse sidecar"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onToggle}
                className="w-7 h-7 rounded-full hover:bg-[#1B3428]/10 flex items-center justify-center text-[#14261D]/70 transition-colors cursor-pointer"
                title="Collapse sidecar"
                aria-label="Collapse sidecar"
              >
                <PanelRightClose className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* 2. SUBTLE PRIVACY EXPLANATION BANNER */}
      <div className="px-3.5 py-1.5 border-b border-[#1B3428]/10 bg-[#FAF8F4] flex items-center justify-between text-[11px]">
        {activeTab === 'ai' ? (
          <div className="flex items-center justify-between w-full">
            <span className="flex items-center gap-1.5 font-mono text-[10px] text-[#14261D]/70">
              <Lock className="w-3 h-3 text-[#E8722C]" />
              <span>Private Tutor &bull; Grounded in shared book</span>
            </span>

            {/* Share AI Conversation Button */}
            {activeConversation && activeConversation.messages.length > 0 && onShareConversation && (
              <button
                type="button"
                onClick={() => setShareModalOpen(true)}
                className="px-2 py-0.5 rounded-md bg-[#FAF8F4] border border-[#1B3428]/20 text-[#14261D] font-display font-bold text-[10px] flex items-center gap-1 hover:bg-[#FBE8DC] transition-colors"
                title="Share immutable snapshot of this conversation with group"
              >
                <Share2 className="w-2.5 h-2.5 text-[#E8722C]" />
                <span>Share with Group</span>
              </button>
            )}
          </div>
        ) : (
          <span className="flex items-center gap-1.5 font-mono text-[10px] text-[#14261D]/70">
            <Users className="w-3 h-3 text-[#1B3428]" />
            <span>Group Discussion &bull; Shared with workspace members</span>
          </span>
        )}
      </div>

      {/* 3. CONTENT AREA */}
      <div className="flex-1 min-h-0 relative flex flex-col overflow-hidden">
        {activeTab === 'ai' ? (
          <CopilotSidecar
            isOpen={true}
            onToggle={onToggle}
            document={props.document}
            conversations={props.conversations}
            activeConversationId={props.activeConversationId}
            activeConversation={props.activeConversation}
            loadingConv={props.loadingConv}
            onSelectConversation={props.onSelectConversation}
            onNewSession={props.onNewSession}
            onRenameSession={props.onRenameSession}
            onDeleteSession={props.onDeleteSession}
            onSendMessage={props.onSendMessage}
            sendingMessage={props.sendingMessage}
            sendError={props.sendError}
            onRetryMessage={props.onRetryMessage}
            onCitationClick={props.onCitationClick}
            onOpenCitationInspector={props.onOpenCitationInspector}
            preparedQuestion={props.preparedQuestion}
            onClearPreparedQuestion={props.onClearPreparedQuestion}
            isMobileDrawer={true} // Embedded inside our container
            onCloseMobileDrawer={onCloseMobileDrawer}
            hideHeader={true}
          />
        ) : (
          <GroupDiscussionPane
            workspaceId={workspaceId}
            currentUserId={currentUserId}
            currentPage={currentPage}
            currentChapter={currentChapter}
            onPageClick={(p) => props.onCitationClick('', p)}
            onCitationClick={props.onCitationClick}
          />
        )}
      </div>

      {/* Share Conversation Confirmation Modal */}
      {shareModalOpen && activeConversation && onShareConversation && (
        <ShareConversationModal
          isOpen={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          defaultTitle={activeConversation.title}
          isSharing={Boolean(isSharingConversation)}
          onConfirm={async (snapshotTitle) => {
            await onShareConversation(activeConversation.id, snapshotTitle);
            setShareModalOpen(false);
          }}
        />
      )}
    </aside>
  );
}
