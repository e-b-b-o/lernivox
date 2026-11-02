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
      />
    );
  }

  // GROUP WORKSPACE: Collapsed Floating Trigger
  if (!isOpen && !isMobileDrawer) {
    return (
      <div className="hidden lg:flex fixed bottom-6 right-6 z-40 items-center gap-2 animate-in fade-in zoom-in-90 duration-200">
        <button
          type="button"
          onClick={() => {
            setActiveTab('discussion');
            onToggle();
          }}
          className="h-12 px-4 rounded-full bg-[#1B3428] text-white font-display font-extrabold text-xs shadow-[0_5px_0_0_#0D1B14] hover:-translate-y-1 hover:shadow-[0_7px_0_0_#0D1B14] active:translate-y-1 active:shadow-[0_2px_0_0_#0D1B14] transition-all flex items-center gap-2 border-[2px] border-[#1B3428]"
          title="Open Group Discussion"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Group Discussion</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('ai');
            onToggle();
          }}
          className="h-12 px-5 rounded-full bg-[#E8722C] text-white font-display font-extrabold text-sm shadow-[0_6px_0_0_#B26E45] hover:-translate-y-1 hover:shadow-[0_8px_0_0_#B26E45] active:translate-y-1 active:shadow-[0_2px_0_0_#B26E45] transition-all flex items-center gap-2.5 border-[2px] border-[#1B3428]"
          title="Open Private Lernivox AI"
        >
          <Sparkles className="w-4 h-4 stroke-[2.5]" />
          <span>Private AI Tutor</span>
        </button>
      </div>
    );
  }

  // GROUP WORKSPACE: Expanded Panel (Desktop or Mobile Drawer)
  const containerClasses = isMobileDrawer
    ? 'w-full h-full bg-[#FAF8F4] flex flex-col select-none'
    : 'hidden lg:flex w-[350px] xl:w-[410px] h-full bg-[#FAF8F4] border-l-[2px] border-[#1B3428]/15 flex-col shrink-0 select-none z-20 shadow-xs';

  return (
    <aside className={containerClasses}>
      {/* 1. TOP DUAL-CHAT TAB SWITCHER */}
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
            <span>Lernivox AI</span>
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
            <span>Discussion</span>
            <Users className="w-2.5 h-2.5 opacity-80" />
          </button>
        </div>

        {/* Right Action: Close/Collapse */}
        <div className="flex items-center gap-1.5 shrink-0">
          {isMobileDrawer ? (
            <button
              type="button"
              onClick={onCloseMobileDrawer}
              className="w-7 h-7 rounded-full bg-[#FAF8F4] border border-[#1B3428]/20 flex items-center justify-center text-[#14261D]/70 hover:bg-[#FBE8DC]"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onToggle}
              className="w-7 h-7 rounded-full hover:bg-[#1B3428]/10 flex items-center justify-center text-[#14261D]/70 transition-colors"
              title="Minimize panel"
            >
              <PanelRightClose className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

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
