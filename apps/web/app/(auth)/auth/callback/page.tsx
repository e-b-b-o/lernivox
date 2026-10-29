'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, Loader2 } from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';

export default function AuthCallbackPage() {
  const router = useRouter();
  const { refreshSession } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function completeAuthentication() {
      try {
        const success = await refreshSession();
        if (isMounted) {
          if (success) {
            router.replace('/dashboard');
          } else {
            setError('Authentication session could not be established.');
            router.replace('/login?error=GoogleAuthFailed');
          }
        }
      } catch {
        if (isMounted) {
          setError('Failed to finalize authentication.');
          router.replace('/login?error=GoogleAuthFailed');
        }
      }
    }

    void completeAuthentication();

    return () => {
      isMounted = false;
    };
  }, [refreshSession, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-lernivox-cream px-4 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-lernivox-forest text-lernivox-peach shadow-md">
        <BookOpen className="h-7 w-7" />
      </div>

      <div className="flex items-center gap-3 text-lernivox-forest">
        <Loader2 className="h-5 w-5 animate-spin text-lernivox-terracotta" />
        <h2 className="text-lg font-semibold tracking-tight">
          Authenticating with Lernivox...
        </h2>
      </div>

      <p className="mt-2 text-xs text-lernivox-forest-muted">
        {error ? error : 'Setting up your secure session and preparing your workspace.'}
      </p>
    </div>
  );
}
