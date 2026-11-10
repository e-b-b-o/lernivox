'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { BookOpen } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ProfileMenu } from '../../components/workspace/ProfileMenu';

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect to login if unauthenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname || '/dashboard')}`);
    }
  }, [isLoading, isAuthenticated, router, pathname]);

  // Mode B: Focused Study Mode (Canonical Workspace at /dashboard/workspaces or compatibility /dashboard/tutor)
  // Preserve full viewport, distraction-free document reading experience.
  if (pathname.startsWith('/dashboard/workspaces') || pathname.startsWith('/dashboard/tutor')) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#F4F0E5] text-[#14261D] flex flex-col font-sans selection:bg-[#F9D8C0] selection:text-[#14261D]">
      {/* Persistent Authenticated Navigation Header */}
      <header className="sticky top-0 z-30 w-full bg-[#FAF8F4]/95 backdrop-blur-md border-b-[2px] border-[#1B3428]/15 shadow-xs transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-18">
            {/* Left Zone: Brand Logo & Wordmark (Returns to /dashboard) */}
            <div className="flex items-center gap-6 sm:gap-8">
              <Link
                href="/dashboard"
                className="flex items-center gap-2.5 group focus:outline-none"
                aria-label="Lernivox Dashboard"
              >
                <div className="w-9 h-9 rounded-[10px] bg-[#E8722C] text-white flex items-center justify-center border border-[#1B3428]/20 shadow-[0_2px_0_0_#1B3428] group-hover:-translate-y-0.5 group-hover:shadow-[0_3px_0_0_#1B3428] transition-all">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="font-display font-black text-lg sm:text-xl text-[#14261D] tracking-tight leading-none">
                    Lernivox
                  </span>
                  <span className="font-mono text-[9px] text-[#497E64] font-bold tracking-widest uppercase mt-0.5">
                    Study Workspaces
                  </span>
                </div>
              </Link>
            </div>

            {/* Right Zone: Profile Menu */}
            <div className="flex items-center gap-3">
              <ProfileMenu />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  );
}

