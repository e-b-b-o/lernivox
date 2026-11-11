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
      {/* Persistent Authenticated Navigation Header (Aligned with Homepage Navbar) */}
      <header className="w-full bg-[#F4EFE4]/95 backdrop-blur-sm sticky top-0 z-50 border-b-[1.5px] border-[#1B3428]/10 transition-colors px-4 sm:px-6 md:px-10">
        <div className="w-full max-w-[1380px] mx-auto h-16 md:h-20 flex items-center justify-between">
          {/* Left Zone: Brand Logo & Wordmark (Returns to /dashboard) */}
          <div className="flex items-center justify-start shrink-0">
            <Link
              href="/dashboard"
              className="h-8 inline-flex items-center gap-2.5 group focus:outline-none"
              aria-label="Lernivox Dashboard"
            >
              <div className="w-8 h-8 rounded-lg bg-[#E8722C] text-white flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105 shadow-sm">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.2"
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-display font-bold text-xl sm:text-[22px] leading-none tracking-tight text-[#14261D]">
                  Lernivox
                </span>
              </div>
            </Link>
          </div>

          {/* Right Zone: Profile Menu */}
          <div className="flex items-center gap-3">
            <ProfileMenu />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  );
}

