'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Users,
  ShieldCheck,
  AlertCircle,
  Loader2,
  ArrowRight,
  BookOpen,
  CheckCircle,
  Lock,
} from 'lucide-react';
import type { PublicInvitationDetailsDto } from '@lernivox/contracts';
import { api } from '../../../lib/api';
import { useAuth } from '../../../context/AuthContext';

function InviteAcceptInner() {
  const router = useRouter();
  const params = useParams();
  const rawToken = typeof params?.token === 'string' ? params.token : '';
  const { user, isAuthenticated, isLoading: authLoading, accessToken } = useAuth();

  const [invitation, setInvitation] = useState<PublicInvitationDetailsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);

  // Fetch public invitation details
  const fetchDetails = useCallback(async () => {
    if (!rawToken) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.invitations.getPublicDetails(rawToken);
      setInvitation(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid or expired invitation link');
    } finally {
      setLoading(false);
    }
  }, [rawToken]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  // Handle invitation acceptance
  const handleAccept = async () => {
    if (!accessToken || !rawToken || accepting) return;
    setAccepting(true);
    setAcceptError(null);
    try {
      const res = await api.invitations.accept(rawToken, accessToken);
      router.replace(`/dashboard/workspaces/${res.workspaceId}`);
    } catch (err: unknown) {
      setAcceptError(err instanceof Error ? err.message : 'Failed to accept invitation');
      setAccepting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F0E5] flex items-center justify-center p-4 selection:bg-[#FBE8DC]">
      <div className="w-full max-w-md bg-[#FAF8F4] rounded-3xl border-[2px] border-[#1B3428] shadow-[0_8px_0_0_#1B3428] p-6 sm:p-8 flex flex-col gap-6 animate-in zoom-in-95 duration-200">
        {/* Brand Header */}
        <div className="flex items-center justify-between border-b border-[#1B3428]/15 pb-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="font-display font-extrabold text-lg text-[#14261D] tracking-tight">
              Lernivox
            </span>
          </Link>
          <span className="px-2.5 py-0.5 rounded-full bg-[#E8722C]/10 text-[#E8722C] font-mono font-bold text-[10px] uppercase border border-[#E8722C]/25">
            Group Invitation
          </span>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="py-12 text-center flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#E8722C]" />
            <p className="font-display font-bold text-xs text-[#14261D]">
              Verifying secure invitation...
            </p>
          </div>
        ) : error || !invitation || !invitation.isValid ? (
          /* Invalid / Expired / Revoked State */
          <div className="py-6 flex flex-col items-center text-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-display font-bold text-base text-[#14261D]">
                Invitation Unavailable
              </h2>
              <p className="text-xs text-[#14261D]/70 mt-1 max-w-xs leading-relaxed">
                {error ||
                  (invitation?.status === 'EXPIRED'
                    ? 'This invitation link has expired. Please ask the group owner for a new invite.'
                    : invitation?.status === 'REVOKED'
                    ? 'This invitation has been revoked by the workspace owner.'
                    : 'This invitation is no longer valid or has already been used.')}
              </p>
            </div>
            <Link
              href="/dashboard"
              className="mt-2 px-5 py-2.5 rounded-full bg-[#1B3428] text-white font-display font-bold text-xs shadow-xs hover:bg-[#14261D] transition-colors"
            >
              Return to My Books
            </Link>
          </div>
        ) : (
          /* Valid Invitation Details */
          <div className="flex flex-col gap-5">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#E8722C] text-white flex items-center justify-center shrink-0 shadow-xs">
                <BookOpen className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <span className="font-mono text-[10px] uppercase font-bold text-[#E8722C] tracking-wider">
                  You are invited to join
                </span>
                <h1 className="font-display font-extrabold text-lg text-[#14261D] truncate">
                  {invitation.workspaceTitle}
                </h1>
                <p className="text-xs text-[#14261D]/70 mt-0.5">
                  Invited by <strong className="text-[#14261D]">{invitation.inviterName}</strong>
                </p>
              </div>
            </div>

            {/* Privacy & Collaboration Guarantees */}
            <div className="p-4 rounded-2xl bg-[#F4F0E5] border border-[#1B3428]/15 space-y-2 text-xs text-[#14261D]">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-[#1B3428] shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Access the shared textbook reader and collaborate in group discussions.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <Lock className="w-3.5 h-3.5 text-[#E8722C] shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Your reading bookmarks and AI conversations remain <em>private to you</em>.
                </p>
              </div>
            </div>

            {acceptError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{acceptError}</span>
              </div>
            )}

            {/* Authenticated vs Unauthenticated actions */}
            {authLoading ? (
              <div className="py-4 text-center">
                <Loader2 className="w-5 h-5 animate-spin text-[#E8722C] mx-auto" />
              </div>
            ) : isAuthenticated ? (
              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={handleAccept}
                  disabled={accepting}
                  className="w-full py-3 rounded-full bg-[#1B3428] text-white font-display font-bold text-xs border-[1.5px] border-[#1B3428] shadow-[0_3px_0_0_#0D1B14] hover:-translate-y-0.5 hover:shadow-[0_4px_0_0_#0D1B14] active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {accepting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Joining Workspace...</span>
                    </>
                  ) : (
                    <>
                      <span>Accept Invitation & Open Workspace</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
                <p className="text-[11px] text-[#14261D]/50 text-center font-mono">
                  Signed in as {user?.email}
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                <Link
                  href={`/login?redirect=/invite/${rawToken}`}
                  className="w-full py-3 rounded-full bg-[#1B3428] text-white font-display font-bold text-xs border-[1.5px] border-[#1B3428] shadow-[0_3px_0_0_#0D1B14] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                >
                  <span>Sign In to Accept</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  href={`/register?redirect=/invite/${rawToken}`}
                  className="w-full py-2.5 rounded-full bg-[#FAF8F4] text-[#14261D] font-display font-bold text-xs border border-[#1B3428]/25 hover:bg-[#F4F0E5] transition-colors flex items-center justify-center"
                >
                  <span>Create an Account</span>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function InvitePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F4F0E5] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#E8722C]" />
        </div>
      }
    >
      <InviteAcceptInner />
    </Suspense>
  );
}
