'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  AlertCircle,
  Check,
  ChevronDown,
  Edit2,
  ExternalLink,
  HelpCircle,
  History,
  Loader2,
  MessageSquare,
  PanelRightClose,
  Plus,
  RotateCw,
  Send,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import type {
  ConversationDetailDto,
  ConversationMessageDto,
  ConversationSummaryDto,
  DocumentDto,
  MessageCitationDto,
  ConversationMessageMetadataDto,
} from '@lernivox/contracts';

interface CopilotSidecarProps {
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
  isMobileDrawer?: boolean;
  onCloseMobileDrawer?: () => void;
  hideHeader?: boolean;
}

export function CopilotSidecar({
  isOpen,
  onToggle,
  document: doc,
  conversations,
  activeConversationId,
  activeConversation,
  loadingConv,
  onSelectConversation,
  onNewSession,
  onRenameSession,
  onDeleteSession,
  onSendMessage,
  sendingMessage,
  sendError,
  onRetryMessage,
  onCitationClick,
  onOpenCitationInspector,
  preparedQuestion,
  onClearPreparedQuestion,
  isMobileDrawer = false,
  onCloseMobileDrawer,
  hideHeader = false,
}: CopilotSidecarProps) {
  const [inputText, setInputText] = useState('');
  const [showSessionsMenu, setShowSessionsMenu] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of messages (strictly container-scoped)
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [activeConversation?.messages, sendingMessage]);

  // Synchronize prepared question from text selection ("Explain this paragraph")
  useEffect(() => {
    if (preparedQuestion) {
      setInputText(preparedQuestion);
      textareaRef.current?.focus({ preventScroll: true });
      onClearPreparedQuestion?.();
    }
  }, [preparedQuestion, onClearPreparedQuestion]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || sendingMessage) return;

    setInputText('');
    await onSendMessage(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // 1. When collapsed on desktop/tablet, return null (floating triggers eliminated)
  if (!isOpen && !isMobileDrawer) {
    return null;
  }

  // 2. EXPANDED SIDECAR OR MOBILE SHEET OVERLAY
  const containerClasses = isMobileDrawer || hideHeader
    ? 'w-full h-full bg-[#FAF8F4] flex flex-col select-none'
    : 'hidden lg:flex w-[340px] xl:w-[380px] h-full bg-[#FAF8F4] border-l-[2px] border-[#1B3428]/15 flex-col shrink-0 select-none z-20';

  return (
    <aside className={containerClasses}>
      {/* 1. COPILOT SUB-TOOLBAR / HEADER */}
      <div className={`px-3 border-b border-[#1B3428]/10 flex items-center justify-between shrink-0 bg-[#FAF8F4] ${hideHeader ? 'h-10 bg-[#F4F0E5]/60' : 'h-12'}`}>
        {/* Left: Saved Sessions Dropdown Trigger */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowSessionsMenu((v) => !v)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[#1B3428]/20 bg-[#FAF8F4] font-display font-bold text-xs text-[#14261D] hover:bg-[#FBE8DC] transition-colors"
          >
            <History className="w-3.5 h-3.5 text-[#E8722C]" />
            <span className="max-w-[130px] truncate">
              {activeConversation?.title || 'Saved Sessions'}
            </span>
            <ChevronDown className="w-3 h-3 text-[#14261D]/60" />
          </button>

          {/* Sessions Dropdown Popover */}
          {showSessionsMenu && (
            <div className="absolute left-0 mt-2 w-72 rounded-2xl bg-[#FAF8F4] border-[2px] border-[#1B3428] shadow-[0_8px_0_0_#1B3428] p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#1B3428]/10">
                <span className="font-display font-bold text-xs text-[#14261D]">
                  Study Conversations
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setShowSessionsMenu(false);
                    onNewSession();
                  }}
                  className="px-2 py-0.5 rounded-md bg-[#E8722C] text-white font-display font-bold text-[10px] flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>New</span>
                </button>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-1">
                {conversations.length === 0 ? (
                  <p className="text-center py-4 text-xs text-[#14261D]/55 font-sans">
                    No saved sessions yet.
                  </p>
                ) : (
                  conversations.map((c) => {
                    const isActive = c.id === activeConversationId;
                    return (
                      <div
                        key={c.id}
                        className={`p-2 rounded-xl flex items-center justify-between gap-2 text-xs transition-colors ${
                          isActive ? 'bg-[#1B3428] text-white' : 'hover:bg-[#FBE8DC]/50 text-[#14261D]'
                        }`}
                      >
                        {editingId === c.id ? (
                          <div className="flex items-center gap-1 flex-1">
                            <input
                              type="text"
                              value={editingTitle}
                              onChange={(e) => setEditingTitle(e.target.value)}
                              className="w-full px-2 py-1 rounded bg-white text-[#14261D] text-xs font-sans"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (editingTitle.trim()) {
                                  onRenameSession(c.id, editingTitle.trim());
                                }
                                setEditingId(null);
                              }}
                              className="p-1 text-emerald-400 hover:text-emerald-300"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                onSelectConversation(c.id);
                                setShowSessionsMenu(false);
                              }}
                              className="flex-1 text-left truncate font-display font-bold text-xs"
                            >
                              {c.title}
                            </button>
                            <div className="flex items-center gap-1 opacity-70 hover:opacity-100">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingId(c.id);
                                  setEditingTitle(c.title);
                                }}
                                className="p-1 hover:text-[#E8722C]"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeleteSession(c.id)}
                                className="p-1 hover:text-red-400"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Header: Collapse Control (only when standalone header) */}
        {!hideHeader && (
          <div className="flex items-center gap-2">
            {isMobileDrawer ? (
              <button
                type="button"
                onClick={onCloseMobileDrawer}
                className="w-7 h-7 rounded-full bg-[#FAF8F4] border border-[#1B3428]/20 flex items-center justify-center text-[#14261D]/70 hover:bg-[#FBE8DC]"
                title="Collapse sidecar"
                aria-label="Collapse sidecar"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onToggle}
                className="w-7 h-7 rounded-full hover:bg-[#1B3428]/10 flex items-center justify-center text-[#14261D]/70 transition-colors"
                title="Collapse sidecar"
                aria-label="Collapse sidecar"
              >
                <PanelRightClose className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* 2. CONVERSATION STREAM */}
      <div
        id="chat-scroll-container"
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#FAF8F4]"
      >
        {loadingConv ? (
          <div className="p-12 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-[#E8722C] mx-auto mb-2" />
            <p className="font-display font-bold text-xs text-[#14261D]">
              Loading study conversation...
            </p>
          </div>
        ) : !activeConversation || activeConversation.messages.length === 0 ? (
          /* Empty State with Pedagogical Starter Cards */
          <div className="py-8 px-2 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#E8722C] text-white flex items-center justify-center mx-auto mb-3 shadow-[0_3px_0_0_#B26E45]">
              <Sparkles className="w-6 h-6" />
            </div>
            <h4 className="font-display font-extrabold text-base text-[#14261D] mb-1">
              Lernivox AI Tutor
            </h4>
            <p className="font-sans text-xs text-[#14261D]/70 max-w-xs mx-auto leading-relaxed mb-6">
              Ask anything about this document. Every explanation is strictly verified against your textbook.
            </p>

            {/* Suggested Starter Buttons */}
            <div className="space-y-2 text-left">
              {[
                'What is the core argument of this chapter?',
                'Explain the historical background of the Hellenistic world.',
                'Give me a worked example of how early texts were transmitted.',
                'What are 3 key takeaways for my upcoming exam?',
              ].map((starter, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => onSendMessage(starter)}
                  className="w-full p-2.5 rounded-xl bg-[#F4F0E5] border border-[#1B3428]/15 hover:border-[#1B3428] font-sans text-xs text-[#14261D] text-left transition-colors flex items-center justify-between group"
                >
                  <span className="line-clamp-1">{starter}</span>
                  <Plus className="w-3.5 h-3.5 text-[#E8722C] shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Render Messages */
          activeConversation.messages.map((msg) => {
            const isUser = msg.sender === 'USER';
            const meta = msg.metadata as ConversationMessageMetadataDto | undefined;

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
              >
                {/* Message Header Pill */}
                <div className="flex items-center gap-1.5 mb-1 text-[10px] font-mono text-[#14261D]/60 px-1">
                  <span>{isUser ? 'You' : 'Lernivox AI'}</span>
                </div>

                {/* Message Bubble */}
                <div
                  className={`rounded-2xl p-4 text-xs max-w-[95%] leading-relaxed ${
                    isUser
                      ? 'bg-[#1B3428] text-white shadow-xs'
                      : 'bg-[#F4F0E5] text-[#14261D] border border-[#1B3428]/15 shadow-2xs'
                  }`}
                >
                  {/* Assistant Structured Pedagogical Sections */}
                  {!isUser && (meta?.learningObjective || meta?.simpleExplanation || meta?.textbookMethod) ? (
                    <div className="space-y-3 font-sans">
                      {meta.learningObjective && (
                        <div className="p-2.5 rounded-xl bg-[#E2EBD8] border border-[#497E64]/20 text-[#14261D]">
                          <span className="font-mono font-bold text-[10px] text-[#497E64] uppercase tracking-wider block mb-0.5">
                            Target Objective
                          </span>
                          <p>{meta.learningObjective}</p>
                        </div>
                      )}

                      {meta.simpleExplanation && (
                        <div>
                          <p className="font-serif leading-relaxed text-[13px]">
                            {meta.simpleExplanation}
                          </p>
                        </div>
                      )}

                      {meta.textbookMethod && (
                        <div className="p-2.5 rounded-xl bg-white/80 border border-[#1B3428]/10">
                          <span className="font-mono font-bold text-[10px] text-[#1B3428] uppercase tracking-wider block mb-0.5">
                            Textbook Method
                          </span>
                          <p>{meta.textbookMethod}</p>
                        </div>
                      )}

                      {meta.workedExample && (
                        <div className="p-2.5 rounded-xl bg-[#FBE8DC] border border-[#E8722C]/20">
                          <span className="font-mono font-bold text-[10px] text-[#E8722C] uppercase tracking-wider block mb-0.5">
                            Worked Example
                          </span>
                          <p>{meta.workedExample}</p>
                        </div>
                      )}

                      {meta.understandingCheck && (
                        <div className="p-2.5 rounded-xl bg-white border border-[#1B3428]/15">
                          <span className="font-mono font-bold text-[10px] text-[#497E64] uppercase tracking-wider block mb-0.5">
                            Check Your Understanding
                          </span>
                          <p className="font-bold">{meta.understandingCheck}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Default text content */
                    <p className="whitespace-pre-wrap font-serif text-[13px] leading-relaxed">
                      {msg.content}
                    </p>
                  )}

                  {/* Inline Verified Citations */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-[#1B3428]/10 flex flex-wrap gap-1.5 items-center">
                      <span className="font-mono text-[9px] uppercase tracking-wider text-[#14261D]/60 mr-1">
                        Verified Sources:
                      </span>
                      {msg.citations.map((cite) => (
                        <button
                          key={cite.id}
                          type="button"
                          onClick={() => {
                            if (cite.chunkId) {
                              onCitationClick(cite.chunkId, cite.pageNumber);
                            }
                            onOpenCitationInspector(cite);
                          }}
                          className="px-2 py-0.5 rounded-md bg-[#FAF8F4] border border-[#1B3428]/25 text-[#1B3428] hover:bg-[#FBE8DC] hover:border-[#E8722C] font-mono text-[10px] font-bold transition-colors flex items-center gap-1 shadow-2xs"
                          title="Navigate to source chunk on textbook reader"
                        >
                          <span>{cite.sourceId}</span>
                          <ExternalLink className="w-2.5 h-2.5 text-[#E8722C]" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* In-Flight Sending Indicator */}
        {sendingMessage && (
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-[#F4F0E5] border border-[#1B3428]/15 text-xs text-[#14261D]">
            <Loader2 className="w-4 h-4 animate-spin text-[#E8722C] shrink-0" />
            <span className="font-sans">Grounding question in textbook passages...</span>
          </div>
        )}

        {/* Send Error Notice */}
        {sendError && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{sendError}</span>
            </div>
            {onRetryMessage && (
              <button
                type="button"
                onClick={onRetryMessage}
                className="px-2 py-1 rounded bg-red-600 text-white font-mono text-[10px] font-bold"
              >
                Retry
              </button>
            )}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 3. MESSAGE COMPOSER */}
      <div className="p-3 border-t border-[#1B3428]/10 bg-[#FAF8F4] shrink-0">
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <div className="w-full bg-[#FAF8F4] border-[1.5px] border-[#E8722C] rounded-[24px] p-3 shadow-sm focus-within:shadow-md transition-shadow">
            <textarea
              ref={textareaRef}
              rows={2}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Lernivox AI about this chapter... (Enter to send)"
              className="w-full bg-transparent resize-none px-2 py-1 text-sm font-sans text-[#14261D] placeholder:text-[#14261D]/60 focus:outline-none"
            />
            <div className="flex items-center justify-between pt-2 px-2 border-t border-[#1B3428]/10 text-xs font-mono">
              <span className="text-[#14261D]/75 font-medium">
                Shift + Enter for new line
              </span>
              <button
                type="submit"
                disabled={!inputText.trim() || sendingMessage}
                className="w-8 h-8 rounded-full bg-[#E8722C] text-white flex items-center justify-center hover:bg-[#d46221] active:translate-y-0.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
                title="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </aside>
  );
}
