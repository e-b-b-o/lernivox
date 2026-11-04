'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MessageSquare,
  Share2,
  Send,
  Loader2,
  Bookmark,
  Clock,
  Trash2,
  ChevronDown,
  ChevronUp,
  FileText,
  User,
  Sparkles,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import type {
  DiscussionMessageDto,
  SharedConversationSnapshotDto,
} from '@lernivox/contracts';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

interface GroupDiscussionPaneProps {
  workspaceId: string;
  currentUserId: string;
  currentPage?: number;
  currentChapter?: string;
  onPageClick?: (page: number) => void;
  onCitationClick?: (chunkId: string, pageNumber?: number | null) => void;
}

export function GroupDiscussionPane({
  workspaceId,
  currentUserId,
  currentPage,
  currentChapter,
  onPageClick,
  onCitationClick,
}: GroupDiscussionPaneProps) {
  const { accessToken } = useAuth();
  const [subTab, setSubTab] = useState<'chat' | 'snapshots'>('chat');

  // Discussion Messages State
  const [messages, setMessages] = useState<DiscussionMessageDto[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [inputText, setInputText] = useState('');
  const [anchorCurrentPage, setAnchorCurrentPage] = useState(false);

  // Shared Conversation Snapshots State
  const [snapshots, setSnapshots] = useState<SharedConversationSnapshotDto[]>([]);
  const [loadingSnapshots, setLoadingSnapshots] = useState(false);
  const [expandedSnapshotId, setExpandedSnapshotId] = useState<string | null>(null);
  const [revokingSnapshotId, setRevokingSnapshotId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Fetch Discussion Messages
  const fetchMessages = useCallback(async (isInitial = false) => {
    if (!accessToken || !workspaceId) return;
    if (isInitial) setLoadingMessages(true);
    try {
      const res = await api.workspaces.getDiscussions(workspaceId, accessToken, 50);
      setMessages(res.messages);
    } catch {
      // Ignore polling errors
    } finally {
      if (isInitial) setLoadingMessages(false);
    }
  }, [accessToken, workspaceId]);

  // Fetch Shared Snapshots
  const fetchSnapshots = useCallback(async () => {
    if (!accessToken || !workspaceId) return;
    setLoadingSnapshots(true);
    try {
      const res = await api.workspaces.listSharedConversations(workspaceId, accessToken);
      setSnapshots(res.shares);
    } catch {
      // Ignore errors
    } finally {
      setLoadingSnapshots(false);
    }
  }, [accessToken, workspaceId]);

  // Initial load
  useEffect(() => {
    fetchMessages(true);
    fetchSnapshots();
  }, [fetchMessages, fetchSnapshots]);

  // Periodic polling for discussion messages (every 6s)
  useEffect(() => {
    const timer = setInterval(() => {
      fetchMessages(false);
    }, 6000);
    return () => clearInterval(timer);
  }, [fetchMessages]);

  // Auto-scroll on initial load and new messages
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages.length]);

  // Send Discussion Message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || sendingMessage || !accessToken || !workspaceId) return;

    setSendingMessage(true);
    try {
      const payload = {
        content: inputText.trim(),
        pageNumber: anchorCurrentPage && currentPage ? currentPage : undefined,
        chapter: anchorCurrentPage && currentChapter ? currentChapter : undefined,
      };
      const created = await api.workspaces.createDiscussion(workspaceId, payload, accessToken);
      setMessages((prev) => [...prev, created]);
      setInputText('');
      setAnchorCurrentPage(false);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to send group message');
    } finally {
      setSendingMessage(false);
    }
  };

  // Revoke Shared Snapshot
  const handleRevokeSnapshot = async (shareId: string) => {
    if (!accessToken || !workspaceId || revokingSnapshotId) return;
    const confirmed = window.confirm('Revoke this shared conversation from the group?');
    if (!confirmed) return;

    setRevokingSnapshotId(shareId);
    try {
      await api.workspaces.revokeSharedConversation(workspaceId, shareId, accessToken);
      setSnapshots((prev) => prev.filter((s) => s.id !== shareId));
      if (expandedSnapshotId === shareId) setExpandedSnapshotId(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to revoke shared conversation');
    } finally {
      setRevokingSnapshotId(null);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#FAF8F4] overflow-hidden">
      {/* Subtab Bar */}
      <div className="shrink-0 px-4 py-2 border-b border-[#1B3428]/15 bg-[#F4F0E5] flex items-center justify-between">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setSubTab('chat')}
            className={`px-3 py-1 rounded-full text-xs font-display font-bold flex items-center gap-1.5 transition-all ${
              subTab === 'chat'
                ? 'bg-[#1B3428] text-white shadow-xs'
                : 'bg-transparent text-[#14261D]/70 hover:bg-[#FAF8F4]'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Discussion</span>
            {messages.length > 0 && (
              <span className={`text-[10px] font-mono px-1 rounded-full ${
                subTab === 'chat' ? 'bg-white/20 text-white' : 'bg-[#1B3428]/10 text-[#1B3428]'
              }`}>
                {messages.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setSubTab('snapshots')}
            className={`px-3 py-1 rounded-full text-xs font-display font-bold flex items-center gap-1.5 transition-all ${
              subTab === 'snapshots'
                ? 'bg-[#1B3428] text-white shadow-xs'
                : 'bg-transparent text-[#14261D]/70 hover:bg-[#FAF8F4]'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Shared AI Chats</span>
            {snapshots.length > 0 && (
              <span className={`text-[10px] font-mono px-1 rounded-full ${
                subTab === 'snapshots' ? 'bg-white/20 text-white' : 'bg-[#1B3428]/10 text-[#1B3428]'
              }`}>
                {snapshots.length}
              </span>
            )}
          </button>
        </div>

        <button
          type="button"
          onClick={() => (subTab === 'chat' ? fetchMessages(true) : fetchSnapshots())}
          className="p-1 rounded-full hover:bg-[#FAF8F4] text-[#14261D]/60 hover:text-[#14261D] transition-colors"
          title="Refresh messages"
        >
          <RefreshCw className="w-3 h-3" />
        </button>
      </div>

      {/* Subtab 1: Group Chat (People <-> People) */}
      {subTab === 'chat' && (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Messages Feed */}
          <div
            ref={scrollContainerRef}
            className="flex-1 p-4 overflow-y-auto space-y-3.5 pr-2"
          >
            {loadingMessages ? (
              <div className="h-full flex items-center justify-center text-xs text-[#14261D]/60 gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#E8722C]" />
                <span>Loading group messages...</span>
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-6 text-center text-xs text-[#14261D]/60 space-y-2">
                <div className="w-10 h-10 rounded-2xl bg-[#1B3428]/10 text-[#1B3428] flex items-center justify-center">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <h4 className="font-display font-bold text-sm text-[#14261D]">
                  No group messages yet
                </h4>
                <p className="max-w-xs leading-relaxed text-[11px]">
                  Start a discussion about tricky textbook problems, ask questions, or share helpful observations with your peers.
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.userId === currentUserId;
                const timeStr = new Date(msg.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={msg.id}
                    className={`flex gap-2.5 items-start ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    {/* User Avatar */}
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-display font-bold text-[10px] shrink-0 ${
                        isMe
                          ? 'bg-[#E8722C] text-white shadow-xs'
                          : 'bg-[#1B3428] text-white shadow-xs'
                      }`}
                      title={msg.userName}
                    >
                      {msg.userInitials || 'U'}
                    </div>

                    {/* Message Bubble */}
                    <div className={`max-w-[82%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-center gap-1.5 mb-1 px-1">
                        <span className="font-display font-bold text-[11px] text-[#14261D]">
                          {isMe ? 'You' : msg.userName}
                        </span>
                        <span className="text-[10px] font-mono text-[#14261D]/50">
                          {timeStr}
                        </span>
                      </div>

                      <div
                        className={`p-3 rounded-2xl text-xs leading-relaxed break-words shadow-2xs border select-text cursor-text ${
                          isMe
                            ? 'bg-[#1B3428] text-white border-[#1B3428] rounded-tr-xs'
                            : 'bg-[#F4F0E5] text-[#14261D] border-[#1B3428]/15 rounded-tl-xs'
                        }`}
                      >
                        {/* Optional Attached Page Anchor */}
                        {msg.pageNumber && (
                          <button
                            type="button"
                            onClick={() => onPageClick?.(msg.pageNumber!)}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold mb-1.5 transition-colors ${
                              isMe
                                ? 'bg-white/20 text-white hover:bg-white/30'
                                : 'bg-[#E8722C]/15 text-[#E8722C] hover:bg-[#E8722C]/25'
                            }`}
                            title={`Jump to Page ${msg.pageNumber}`}
                          >
                            <Bookmark className="w-2.5 h-2.5" />
                            <span>Page {msg.pageNumber}</span>
                            {msg.chapter && <span className="truncate max-w-[120px]">({msg.chapter})</span>}
                          </button>
                        )}
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Bar */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 border-t border-[#1B3428]/15 bg-[#FAF8F4] flex flex-col gap-2 shrink-0"
          >
            {/* Page anchoring tag indicator */}
            <div className="flex items-center justify-between text-[11px]">
              <label className="flex items-center gap-1.5 cursor-pointer text-[#14261D]/70 hover:text-[#14261D]">
                <input
                  type="checkbox"
                  checked={anchorCurrentPage}
                  onChange={(e) => setAnchorCurrentPage(e.target.checked)}
                  className="rounded border-[#1B3428]/30 text-[#E8722C] focus:ring-[#E8722C]"
                />
                <span>Anchor to Page {currentPage || 1}</span>
              </label>

              <span className="text-[10px] text-[#14261D]/50 font-mono">
                Shared with group
              </span>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Discuss with workspace members..."
                className="flex-1 px-3 py-2 rounded-xl bg-[#F4F0E5] border border-[#1B3428]/25 text-xs text-[#14261D] placeholder:text-[#14261D]/40 focus:outline-hidden focus:border-[#1B3428]"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || sendingMessage}
                className="px-3.5 py-2 rounded-xl bg-[#1B3428] text-white font-display font-bold text-xs shadow-xs hover:bg-[#14261D] disabled:opacity-50 transition-colors flex items-center justify-center shrink-0"
              >
                {sendingMessage ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Subtab 2: Shared AI Conversation Snapshots */}
      {subTab === 'snapshots' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-3 pr-2">
          {loadingSnapshots ? (
            <div className="h-full flex items-center justify-center text-xs text-[#14261D]/60 gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[#E8722C]" />
              <span>Loading shared conversations...</span>
            </div>
          ) : snapshots.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-6 text-center text-xs text-[#14261D]/60 space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-[#E8722C]/10 text-[#E8722C] flex items-center justify-center">
                <Share2 className="w-5 h-5" />
              </div>
              <h4 className="font-display font-bold text-sm text-[#14261D]">
                No shared AI conversations
              </h4>
              <p className="max-w-xs leading-relaxed text-[11px]">
                Members can share insightful AI tutor exchanges with the group. Use the &quot;Share with Group&quot; action inside your private AI tutor session.
              </p>
            </div>
          ) : (
            snapshots.map((snap) => {
              const isOwnerOfShare = snap.sharedById === currentUserId;
              const isExpanded = expandedSnapshotId === snap.id;
              const messagesCount = snap.snapshotData?.messages?.length || 0;

              return (
                <div
                  key={snap.id}
                  className="rounded-2xl bg-[#F4F0E5] border border-[#1B3428]/15 overflow-hidden transition-all shadow-2xs"
                >
                  {/* Snapshot Header */}
                  <div
                    onClick={() => setExpandedSnapshotId(isExpanded ? null : snap.id)}
                    className="p-3.5 cursor-pointer hover:bg-[#ECE6D8] transition-colors flex items-start justify-between gap-3"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-[#E8722C] text-white flex items-center justify-center shrink-0 mt-0.5">
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-display font-bold text-xs text-[#14261D] truncate">
                          {snap.title || snap.snapshotData?.title || 'Shared AI Session'}
                        </h4>
                        <div className="flex items-center gap-2 text-[10px] text-[#14261D]/60 font-mono mt-0.5">
                          <span>By {isOwnerOfShare ? 'You' : snap.sharedByName}</span>
                          <span>&bull;</span>
                          <span>{messagesCount} messages</span>
                          <span>&bull;</span>
                          <span>{new Date(snap.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {isOwnerOfShare && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRevokeSnapshot(snap.id);
                          }}
                          disabled={revokingSnapshotId === snap.id}
                          className="p-1 rounded text-red-600 hover:bg-red-50 transition-colors"
                          title="Revoke shared snapshot"
                        >
                          {revokingSnapshotId === snap.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Trash2 className="w-3 h-3" />
                          )}
                        </button>
                      )}
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-[#14261D]/50" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-[#14261D]/50" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Snapshot Messages View */}
                  {isExpanded && (
                    <div className="p-4 border-t border-[#1B3428]/15 bg-[#FAF8F4] space-y-3">
                      <div className="p-2 rounded-lg bg-[#FBE8DC] text-[11px] text-[#E8722C] font-mono">
                        Static snapshot captured on {new Date(snap.createdAt).toLocaleString()}. Original private conversation continues independently.
                      </div>

                      {snap.snapshotData?.messages?.map((m, idx) => (
                        <div
                          key={idx}
                          className={`p-3 rounded-xl text-xs leading-relaxed ${
                            m.sender === 'USER'
                              ? 'bg-[#1B3428] text-white ml-4 rounded-tr-xs'
                              : 'bg-[#F4F0E5] text-[#14261D] mr-4 rounded-tl-xs border border-[#1B3428]/10'
                          }`}
                        >
                          <div className="text-[10px] font-mono font-bold mb-1 opacity-70">
                            {m.sender === 'USER' ? 'Student' : 'Lernivox AI'}
                          </div>
                          <p className="whitespace-pre-wrap">{m.content}</p>

                          {/* Citations if any */}
                          {m.citations && m.citations.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-current/20 flex flex-wrap gap-1.5">
                              {m.citations.map((c, cIdx) => (
                                <button
                                  key={cIdx}
                                  type="button"
                                  onClick={() => onCitationClick?.(c.chunkId || '', c.pageNumber)}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white/20 hover:bg-white/30 text-current transition-colors"
                                >
                                  <span>Citation {c.sourceId}</span>
                                  {c.pageNumber && <span>(p.{c.pageNumber})</span>}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
