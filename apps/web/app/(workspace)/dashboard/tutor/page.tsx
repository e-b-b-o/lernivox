'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';
import { api } from '../../../../lib/api';

function TutorRedirectAdapterInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const documentId = searchParams.get('documentId');
  const { isAuthenticated, isLoading, accessToken } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace('/login?redirect=/dashboard');
      return;
    }

    if (!documentId) {
      router.replace('/dashboard');
      return;
    }

    if (!accessToken) return;

    let isMounted = true;

    // Resolve document ID to its canonical persistent Workspace ID
    api.workspaces
      .getByDocumentId(documentId, accessToken)
      .then((res) => {
        if (!isMounted) return;
        const pageParam = searchParams.get('page');
        const queryStr = pageParam ? `?page=${pageParam}` : '';
        router.replace(`/dashboard/workspaces/${res.workspaceId}${queryStr}`);
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        const msg = err instanceof Error ? err.message : 'Unable to resolve workspace for this document.';
        setError(msg);
      });

    return () => {
      isMounted = false;
    };
  }, [documentId, isAuthenticated, isLoading, accessToken, router]);

  if (error) {
    return (
      <div className="flex h-[100dvh] w-full flex-col items-center justify-center bg-[#F4F0E5] px-4">
        <div className="w-full max-w-md p-6 bg-[#FAF8F4] border-[2px] border-[#1B3428] rounded-2xl shadow-[0_4px_0_0_#1B3428] text-center">
          <div className="w-12 h-12 rounded-full bg-[#E8722C]/10 text-[#E8722C] flex items-center justify-center mx-auto mb-4 border border-[#E8722C]/20">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="font-display font-bold text-lg text-[#14261D] mb-2">
            Unable to Open Book Workspace
          </h2>
          <p className="text-xs text-[#14261D]/70 mb-6 leading-relaxed">
            {error}
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1B3428] text-white font-display font-bold text-xs shadow-[0_3px_0_0_#0D1B14] hover:-translate-y-0.5 transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to My Books</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] w-full flex-col items-center justify-center bg-[#F4F0E5]">
      <div className="w-12 h-12 rounded-2xl bg-[#E8722C] text-white flex items-center justify-center shadow-[0_4px_0_0_#B26E45] mb-4">
        <Loader2 className="h-6 w-6 animate-spin text-white" />
      </div>
      <p className="font-display font-bold text-sm text-[#14261D]">
        Resolving your book&apos;s workspace...
      </p>
    </div>
  );
}

export default function TutorCompatibilityPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-[#F4F0E5]">
          <Loader2 className="w-8 h-8 animate-spin text-[#E8722C]" />
        </div>
      }
    >
      <TutorRedirectAdapterInner />
    </Suspense>
  );
}
