'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BookOpen,
  PlusCircle,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ProfileMenu } from '../../components/workspace/ProfileMenu';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  exact?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { name: 'My Books', href: '/dashboard', icon: BookOpen, exact: true },
];

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile drawer when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

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

  // Mode A: Minimal Application Shell (My Books Library)
  const isNavActive = (item: NavItem) => {
    if (item.exact) {
      return pathname === item.href;
    }
    return pathname.startsWith(item.href);
  };

  return (
    <div className="min-h-screen bg-[#F4F0E5] text-[#14261D] flex flex-col font-sans selection:bg-[#F9D8C0] selection:text-[#14261D]">
      {/* Persistent Authenticated Navigation Header */}
      <header className="sticky top-0 z-40 w-full bg-[#FAF8F4]/95 backdrop-blur-md border-b-[2px] border-[#1B3428]/15 shadow-xs transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-18">
            {/* Left Zone: Brand Logo & Wordmark */}
            <div className="flex items-center gap-6 sm:gap-8">
              <Link
                href="/dashboard"
                className="flex items-center gap-2.5 group focus:outline-none"
                aria-label="Lernivox My Books"
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

              {/* Minimal Desktop Nav Items */}
              <nav
                className="hidden sm:flex items-center gap-1.5"
                aria-label="Primary Workspace Navigation"
              >
                {NAV_ITEMS.map((item) => {
                  const active = isNavActive(item);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-display font-bold transition-all ${
                        active
                          ? 'bg-[#14261D] text-white shadow-xs'
                          : 'text-[#14261D]/75 hover:text-[#14261D] hover:bg-[#1B3428]/5'
                      }`}
                    >
                      <Icon
                        className={`w-3.5 h-3.5 ${
                          active ? 'text-[#E8722C]' : 'text-[#14261D]/60'
                        }`}
                      />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Right Zone: Add Material Button + Profile Menu */}
            <div className="flex items-center gap-3">
              {/* Quick Action: Add Material */}
              <Link
                href="/dashboard?action=upload"
                className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full bg-[#FAF8F4] border-[1.5px] border-[#1B3428] text-[#14261D] font-display font-bold text-xs shadow-[0_2px_0_0_#1B3428] hover:-translate-y-0.5 hover:shadow-[0_3px_0_0_#1B3428] active:translate-y-0.5 active:shadow-none transition-all"
                title="Add Study Material"
              >
                <PlusCircle className="w-4 h-4 text-[#E8722C]" />
                <span className="hidden xs:inline">Add Material</span>
              </Link>

              {/* Profile Menu Dropdown */}
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
