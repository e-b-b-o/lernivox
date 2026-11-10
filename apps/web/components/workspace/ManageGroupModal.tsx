'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Users,
  UserPlus,
  X,
  Copy,
  Check,
  Trash2,
  LogOut,
  Mail,
  Link as LinkIcon,
  Loader2,
  ShieldCheck,
  AlertCircle,
  Clock,
} from 'lucide-react';
import type {
  WorkspaceMemberDto,
  WorkspaceInvitationDto,
} from '@lernivox/contracts';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

interface ManageGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  workspaceTitle: string;
  isOwner: boolean;
  currentUserId: string;
  onWorkspaceUpdated?: () => void;
  onLeaveSuccess?: () => void;
}

export function ManageGroupModal({
  isOpen,
  onClose,
  workspaceId,
  workspaceTitle,
  isOwner,
  currentUserId,
  onWorkspaceUpdated,
  onLeaveSuccess,
}: ManageGroupModalProps) {
  const { accessToken } = useAuth();
  const [activeTab, setActiveTab] = useState<'members' | 'invites'>('members');

  // Members state
  const [members, setMembers] = useState<WorkspaceMemberDto[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [memberError, setMemberError] = useState<string | null>(null);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);

  // Invitations state
  const [invitations, setInvitations] = useState<WorkspaceInvitationDto[]>([]);
  const [loadingInvites, setLoadingInvites] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [creatingInvite, setCreatingInvite] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [lastCreatedUrl, setLastCreatedUrl] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Leaving workspace state
  const [leaving, setLeaving] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll and listen for Escape key
  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Load members
  const fetchMembers = useCallback(async () => {
    if (!accessToken || !workspaceId) return;
    setLoadingMembers(true);
    setMemberError(null);
    try {
      const res = await api.workspaces.getMembers(workspaceId, accessToken);
      setMembers(res.members);
    } catch (err: unknown) {
      setMemberError(err instanceof Error ? err.message : 'Failed to load group members');
    } finally {
      setLoadingMembers(false);
    }
  }, [accessToken, workspaceId]);

  // Load invitations (if owner)
  const fetchInvitations = useCallback(async () => {
    if (!accessToken || !workspaceId || !isOwner) return;
    setLoadingInvites(true);
    try {
      const res = await api.workspaces.listInvitations(workspaceId, accessToken);
      setInvitations(res);
    } catch {
      // Non-owners cannot fetch invitations
    } finally {
      setLoadingInvites(false);
    }
  }, [accessToken, workspaceId, isOwner]);

  useEffect(() => {
    if (isOpen) {
      fetchMembers();
      if (isOwner) fetchInvitations();
    }
  }, [isOpen, fetchMembers, fetchInvitations, isOwner]);

  // Create Invitation (Email or Link)
  const handleCreateInvitation = async (byEmail: boolean) => {
    if (!accessToken || !workspaceId || creatingInvite) return;
    setCreatingInvite(true);
    setMemberError(null);
    try {
      const payload = byEmail && inviteEmail.trim() ? { email: inviteEmail.trim() } : {};
      const inv = await api.workspaces.createInvitation(workspaceId, payload, accessToken);
      
      const fullUrl = inv.inviteToken
        ? `${typeof window !== 'undefined' ? window.location.origin : ''}/invite/${inv.inviteToken}`
        : inv.inviteUrl || '';
      
      setLastCreatedUrl(fullUrl);
      if (byEmail) setInviteEmail('');
      await fetchInvitations();
    } catch (err: unknown) {
      setMemberError(err instanceof Error ? err.message : 'Failed to create invitation');
    } finally {
      setCreatingInvite(false);
    }
  };

  // Revoke Invitation
  const handleRevokeInvitation = async (invitationId: string) => {
    if (!accessToken || !workspaceId || revokingId) return;
    setRevokingId(invitationId);
    try {
      await api.workspaces.revokeInvitation(workspaceId, invitationId, accessToken);
      setInvitations((prev) => prev.filter((i) => i.id !== invitationId));
    } catch (err: unknown) {
      setMemberError(err instanceof Error ? err.message : 'Failed to revoke invitation');
    } finally {
      setRevokingId(null);
    }
  };

  // Remove Member
  const handleRemoveMember = async (memberUserId: string) => {
    if (!accessToken || !workspaceId || removingMemberId) return;
    const confirmed = window.confirm('Are you sure you want to remove this member from the group?');
    if (!confirmed) return;

    setRemovingMemberId(memberUserId);
    try {
      await api.workspaces.removeMember(workspaceId, memberUserId, accessToken);
      setMembers((prev) => prev.filter((m) => m.userId !== memberUserId));
      onWorkspaceUpdated?.();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to remove member');
    } finally {
      setRemovingMemberId(null);
    }
  };

  // Leave Workspace (for non-owners)
  const handleLeaveWorkspace = async () => {
    if (!accessToken || !workspaceId || leaving) return;
    const confirmed = window.confirm('Are you sure you want to leave this group workspace?');
    if (!confirmed) return;

    setLeaving(true);
    try {
      await api.workspaces.leave(workspaceId, accessToken);
      onLeaveSuccess?.();
      onClose();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to leave workspace');
    } finally {
      setLeaving(false);
    }
  };

  // Copy URL to clipboard
  const handleCopyLink = () => {
    if (!lastCreatedUrl) return;
    navigator.clipboard.writeText(lastCreatedUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-[#FAF8F4] rounded-t-[28px] sm:rounded-3xl border-t-[2px] sm:border-[2px] border-[#1B3428] shadow-[0_-8px_24px_rgba(20,38,29,0.15)] sm:shadow-[0_8px_0_0_#1B3428] p-5 sm:p-7 relative flex flex-col gap-4 sm:gap-5 max-h-[85vh] sm:max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom duration-200 sm:zoom-in-95 sm:slide-in-from-bottom-0 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:pb-7"
        role="dialog"
        aria-modal="true"
        aria-labelledby="group-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Tactile Drag Handle */}
        <div className="sm:hidden w-12 h-1.5 bg-[#1B3428]/20 rounded-full mx-auto -mt-1 mb-1 shrink-0" />

        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full border border-[#1B3428]/20 flex items-center justify-center text-[#14261D]/70 hover:bg-[#FBE8DC] hover:text-[#14261D] transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start gap-3.5 pr-8">
          <div className="w-11 h-11 rounded-2xl bg-[#1B3428] text-white flex items-center justify-center shrink-0 shadow-xs">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="font-mono text-[10px] uppercase font-bold tracking-wider text-[#E8722C]">
              Collaboration Hub
            </span>
            <h2 id="group-modal-title" className="font-display font-extrabold text-lg sm:text-xl text-[#14261D]">
              Group Workspace Members
            </h2>
            <p className="text-xs text-[#14261D]/70 truncate max-w-sm">
              {workspaceTitle}
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-[#1B3428]/15 gap-4">
          <button
            type="button"
            onClick={() => setActiveTab('members')}
            className={`pb-2 text-xs font-display font-bold transition-colors flex items-center gap-1.5 relative ${
              activeTab === 'members'
                ? 'text-[#1B3428]'
                : 'text-[#14261D]/50 hover:text-[#14261D]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Members ({members.length})</span>
            {activeTab === 'members' && (
              <span className="absolute bottom-0 inset-x-0 h-0.5 bg-[#1B3428]" />
            )}
          </button>

          {isOwner && (
            <button
              type="button"
              onClick={() => setActiveTab('invites')}
              className={`pb-2 text-xs font-display font-bold transition-colors flex items-center gap-1.5 relative ${
                activeTab === 'invites'
                  ? 'text-[#1B3428]'
                  : 'text-[#14261D]/50 hover:text-[#14261D]'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Invite Collaborators</span>
              {activeTab === 'invites' && (
                <span className="absolute bottom-0 inset-x-0 h-0.5 bg-[#1B3428]" />
              )}
            </button>
          )}
        </div>

        {/* Error notification */}
        {memberError && (
          <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{memberError}</span>
          </div>
        )}

        {/* Tab 1: Members List */}
        {activeTab === 'members' && (
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {loadingMembers ? (
              <div className="p-8 text-center text-xs text-[#14261D]/60 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#E8722C]" />
                <span>Loading workspace members...</span>
              </div>
            ) : members.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#14261D]/60">
                No members found in this workspace.
              </div>
            ) : (
              members.map((member) => {
                const isMemberOwner = member.role === 'OWNER';
                const isCurrent = member.userId === currentUserId;
                const initials = (member.userName || member.userEmail || 'U')
                  .slice(0, 2)
                  .toUpperCase();

                return (
                  <div
                    key={member.id}
                    className="p-3.5 rounded-2xl bg-[#F4F0E5] border border-[#1B3428]/15 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-[#1B3428] text-white flex items-center justify-center font-display font-bold text-xs shrink-0">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-display font-bold text-xs text-[#14261D] truncate">
                            {member.userName || member.userEmail || 'Collaborator'}
                          </span>
                          {isCurrent && (
                            <span className="text-[10px] font-mono px-1.5 py-0.2 bg-[#1B3428]/10 text-[#1B3428] rounded font-bold">
                              You
                            </span>
                          )}
                        </div>
                        {member.userEmail && (
                          <p className="text-[11px] text-[#14261D]/60 truncate font-mono">
                            {member.userEmail}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isMemberOwner ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-[#E8722C]/10 text-[#E8722C] font-mono font-bold text-[10px] uppercase border border-[#E8722C]/30 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" />
                          Owner
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-[#1B3428]/10 text-[#1B3428] font-mono font-bold text-[10px] uppercase border border-[#1B3428]/20">
                          Member
                        </span>
                      )}

                      {/* Owner can remove non-owner members */}
                      {isOwner && !isMemberOwner && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(member.userId)}
                          disabled={removingMemberId === member.userId}
                          className="w-7 h-7 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors disabled:opacity-50"
                          title="Remove member from group"
                        >
                          {removingMemberId === member.userId ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {/* Non-owner can leave workspace */}
            {!isOwner && (
              <div className="pt-4 border-t border-[#1B3428]/15 flex justify-end">
                <button
                  type="button"
                  onClick={handleLeaveWorkspace}
                  disabled={leaving}
                  className="px-4 py-2 rounded-full border border-red-300 text-red-700 font-display font-bold text-xs hover:bg-red-50 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {leaving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <LogOut className="w-3.5 h-3.5" />
                  )}
                  <span>Leave Workspace</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Invitations (Owner Only) */}
        {activeTab === 'invites' && isOwner && (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {/* Quick Link Invite Generator */}
            <div className="p-4 rounded-2xl bg-[#F4F0E5] border border-[#1B3428]/15 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display font-bold text-xs text-[#14261D]">
                    Invite via Secure Link
                  </h3>
                  <p className="text-[11px] text-[#14261D]/70">
                    Anyone with this unique link can join this group workspace. Valid for 7 days.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCreateInvitation(false)}
                  disabled={creatingInvite}
                  className="px-3.5 py-1.5 rounded-full bg-[#1B3428] text-white font-display font-bold text-xs shadow-xs hover:bg-[#14261D] transition-colors flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                >
                  {creatingInvite ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <LinkIcon className="w-3.5 h-3.5" />
                  )}
                  <span>Generate Link</span>
                </button>
              </div>

              {lastCreatedUrl && (
                <div className="p-2.5 rounded-xl bg-[#FAF8F4] border border-[#1B3428]/20 flex items-center justify-between gap-2">
                  <span className="font-mono text-xs text-[#14261D] truncate">
                    {lastCreatedUrl}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="px-3 py-1 rounded-lg bg-[#E8722C] text-white font-display font-bold text-xs flex items-center gap-1 shrink-0 hover:bg-[#d46524] transition-colors"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Email Invite Box */}
            <div className="p-4 rounded-2xl bg-[#F4F0E5] border border-[#1B3428]/15 space-y-2.5">
              <h3 className="font-display font-bold text-xs text-[#14261D]">
                Invite by Email
              </h3>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="collaborator@example.com"
                  className="flex-1 px-3 py-2 rounded-xl bg-[#FAF8F4] border border-[#1B3428]/25 text-xs text-[#14261D] placeholder:text-[#14261D]/40 focus:outline-hidden focus:border-[#E8722C]"
                />
                <button
                  type="button"
                  onClick={() => handleCreateInvitation(true)}
                  disabled={creatingInvite || !inviteEmail.trim()}
                  className="px-4 py-2 rounded-xl bg-[#E8722C] text-white font-display font-bold text-xs shadow-xs hover:bg-[#d46524] transition-colors flex items-center gap-1.5 disabled:opacity-50 shrink-0"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Send Invite</span>
                </button>
              </div>
            </div>

            {/* Active Invitations List */}
            <div>
              <h3 className="font-display font-bold text-xs text-[#14261D] mb-2">
                Active Invitations
              </h3>
              {loadingInvites ? (
                <div className="p-4 text-center text-xs text-[#14261D]/60 flex items-center justify-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Loading invitations...</span>
                </div>
              ) : invitations.length === 0 ? (
                <p className="text-xs text-[#14261D]/50 italic">
                  No active pending invitations.
                </p>
              ) : (
                <div className="space-y-2">
                  {invitations.map((inv) => (
                    <div
                      key={inv.id}
                      className="p-3 rounded-xl bg-[#F4F0E5] border border-[#1B3428]/15 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="font-display font-bold text-[#14261D] truncate">
                          {inv.email ? `Email: ${inv.email}` : 'Direct Link Invitation'}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-[#14261D]/60 font-mono mt-0.5">
                          <Clock className="w-3 h-3" />
                          <span>Expires: {new Date(inv.expiresAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRevokeInvitation(inv.id)}
                        disabled={revokingId === inv.id}
                        className="px-2.5 py-1 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 font-display font-bold text-[11px] flex items-center gap-1 transition-colors disabled:opacity-50 shrink-0"
                      >
                        {revokingId === inv.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Trash2 className="w-3 h-3" />
                        )}
                        <span>Revoke</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
