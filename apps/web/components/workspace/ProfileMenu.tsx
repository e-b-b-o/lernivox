'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronDown,
  LogOut,
  BookOpen,
  Home,
  Settings,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface ProfileMenuProps {
  compact?: boolean;
}

export function ProfileMenu({ compact = false }: ProfileMenuProps) {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const mobileCardRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close dropdown on outside click (desktop & mobile)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        menuRef.current?.contains(target) ||
        mobileCardRef.current?.contains(target)
      ) {
        return;
      }
      setIsOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle mobile scroll locking and Escape key dismissal
  useEffect(() => {
    if (!isOpen) return;

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
    const originalOverflow = document.body.style.overflow;

    if (isMobile) {
      document.body.style.overflow = 'hidden';
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      if (isMobile) {
        document.body.style.overflow = originalOverflow;
      }
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSignOut = async () => {
    setIsOpen(false);
    try {
      await logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      // Mandatory requirement: redirect to public homepage '/', not /login
      window.location.href = '/';
    }
  };

  const getInitials = (name?: string | null, email?: string | null) => {
    if (name && name.trim()) {
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2 && parts[0] && parts[1]) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      }
      return name.slice(0, 2).toUpperCase();
    }
    if (email && email.trim()) {
      return email.slice(0, 2).toUpperCase();
    }
    return 'LV';
  };

  const initials = getInitials(user?.name, user?.email);
  const displayName = user?.name || 'Student';
  const displayEmail = user?.email || 'student@lernivox.com';
  const planTier = user?.planTier || 'FREE';

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      {/* Profile Trigger Button */}
      <button
        type="button"
        id="user-profile-menu-trigger"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-1.5 p-1 sm:px-2.5 sm:py-1 rounded-full bg-[#FAF8F4] border-[1.5px] border-[#1B3428] shadow-[0_2px_0_0_#1B3428] hover:-translate-y-0.5 hover:shadow-[0_3px_0_0_#1B3428] active:translate-y-0.5 active:shadow-none transition-all focus:outline-none shrink-0 cursor-pointer"
        aria-expanded={isOpen}
        aria-haspopup="true"
        title="Account Profile"
      >
        {/* Avatar Initials Pill */}
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#E2EBD8] text-[#497E64] font-display font-extrabold text-xs flex items-center justify-center border border-[#1B3428]/20 shrink-0">
          {initials}
        </div>

        {/* Short Name Label (Desktop only) */}
        {!compact && (
          <span className="hidden md:inline-block font-display font-bold text-xs text-[#14261D] max-w-[120px] truncate">
            {displayName}
          </span>
        )}

        {/* Subtle Dropdown Chevron */}
        <ChevronDown
          className={`w-3.5 h-3.5 text-[#14261D]/70 transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* =====================================================================
          DESKTOP: Accessible Anchored Dropdown Popover (sm: >= 640px)
          ===================================================================== */}
      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className="hidden sm:block absolute right-0 top-full mt-2 w-72 rounded-[20px] bg-[#FAF8F4] border-[2px] border-[#1B3428] shadow-[0_8px_0_0_#1B3428] p-4 z-50 animate-in fade-in zoom-in-95 duration-150"
        >
          {/* User Details Header */}
          <div className="flex items-center gap-3 pb-3 border-b border-[#1B3428]/10">
            <div className="w-10 h-10 rounded-full bg-[#E8722C] text-white font-display font-extrabold text-sm flex items-center justify-center border border-[#1B3428]/20 shrink-0 shadow-sm">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-display font-bold text-sm text-[#14261D] truncate leading-tight">
                  {displayName}
                </p>
                <span className="px-1.5 py-0.5 rounded-full bg-[#E2EBD8] text-[#497E64] font-mono font-bold text-[9px] uppercase tracking-wider shrink-0">
                  {planTier}
                </span>
              </div>
              <p className="font-mono text-[11px] text-[#14261D]/60 truncate mt-0.5 bg-[#1B3428]/5 px-1.5 py-0.5 rounded inline-block">
                {displayEmail}
              </p>
            </div>
          </div>

          {/* Account Navigation Links */}
          <div className="py-2 space-y-1">
            <Link
              href="/dashboard"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-display font-bold text-[#14261D] hover:bg-[#FBE8DC] hover:text-[#E8722C] transition-colors"
              role="menuitem"
            >
              <BookOpen className="w-4 h-4 text-[#E8722C]" />
              <span>My Books</span>
            </Link>

            <Link
              href="/dashboard/settings"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-display font-bold text-[#14261D] hover:bg-[#FBE8DC] hover:text-[#E8722C] transition-colors"
              role="menuitem"
            >
              <Settings className="w-4 h-4 text-[#14261D]/70" />
              <span>Profile & Settings</span>
            </Link>

            {/* Visit Homepage Link positioned directly above Sign Out */}
            <Link
              href="/"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-display font-bold text-[#14261D] hover:bg-[#FBE8DC] hover:text-[#E8722C] transition-colors"
              role="menuitem"
            >
              <Home className="w-4 h-4 text-[#497E64]" />
              <span>Visit Homepage</span>
            </Link>
          </div>

          {/* Visual Divider & Sign Out Button */}
          <div className="pt-2 border-t border-[#1B3428]/10">
            <button
              type="button"
              id="profile-sign-out-btn"
              onClick={handleSignOut}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-display font-bold text-red-600 hover:bg-red-50 transition-colors group cursor-pointer"
              role="menuitem"
            >
              <span className="flex items-center gap-2.5">
                <LogOut className="w-4 h-4 text-red-500 transition-transform group-hover:-translate-x-0.5" />
                Sign Out
              </span>
              <span className="text-[10px] font-mono text-red-400">Exit workspace</span>
            </button>
          </div>
        </div>
      )}

      {/* =====================================================================
          MOBILE: Floating Anchored Viewport-Bounded Profile Popover (< 640px)
          Anchored to top-right below avatar; subtle backdrop, never a centered modal dialog
          ===================================================================== */}
      {isOpen && mounted && typeof document !== 'undefined' && createPortal(
        <div className="sm:hidden">
          {/* Subtle Scrim Backdrop */}
          <div
            className="fixed inset-0 bg-black/20 z-40 sm:hidden"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Viewport-Bounded Mobile Profile Popover Card */}
          <div
            ref={mobileCardRef}
            role="dialog"
            aria-modal="true"
            aria-label="Account Profile and Navigation"
            className="fixed right-3 top-14 w-[calc(100vw-24px)] max-w-[300px] z-50 sm:hidden bg-[#FAF8F4] rounded-[20px] border-[2px] border-[#1B3428] shadow-[0_8px_24px_rgba(27,52,40,0.18)] p-4 animate-in fade-in zoom-in-95 duration-150 overflow-y-auto max-h-[calc(100dvh-70px)]"
          >
            {/* User Details Header with Close Button */}
            <div className="flex items-center justify-between pb-3.5 border-b border-[#1B3428]/10">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-full bg-[#E8722C] text-white font-display font-extrabold text-base flex items-center justify-center border border-[#1B3428]/20 shrink-0 shadow-sm">
                  {initials}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-display font-bold text-sm text-[#14261D] truncate leading-tight">
                      {displayName}
                    </p>
                    <span className="px-1.5 py-0.5 rounded-full bg-[#E2EBD8] text-[#497E64] font-mono font-bold text-[9px] uppercase tracking-wider shrink-0">
                      {planTier}
                    </span>
                  </div>
                  <p className="font-mono text-[11px] text-[#14261D]/60 truncate mt-0.5 bg-[#1B3428]/5 px-1.5 py-0.5 rounded inline-block">
                    {displayEmail}
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-[#1B3428]/5 text-[#14261D] flex items-center justify-center hover:bg-[#1B3428]/10 transition-colors shrink-0 ml-1.5 cursor-pointer"
                aria-label="Close profile menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Account Navigation Links (48px min touch target) */}
            <div className="py-2.5 space-y-1">
              <Link
                href="/dashboard"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3.5 py-2.5 min-h-[48px] rounded-xl text-xs font-display font-bold text-[#14261D] hover:bg-[#FBE8DC] hover:text-[#E8722C] transition-colors"
                role="menuitem"
              >
                <BookOpen className="w-4 h-4 text-[#E8722C] shrink-0" />
                <span>My Books</span>
              </Link>

              <Link
                href="/dashboard/settings"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3.5 py-2.5 min-h-[48px] rounded-xl text-xs font-display font-bold text-[#14261D] hover:bg-[#FBE8DC] hover:text-[#E8722C] transition-colors"
                role="menuitem"
              >
                <Settings className="w-4 h-4 text-[#14261D]/70 shrink-0" />
                <span>Profile & Settings</span>
              </Link>

              <Link
                href="/"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3.5 py-2.5 min-h-[48px] rounded-xl text-xs font-display font-bold text-[#14261D] hover:bg-[#FBE8DC] hover:text-[#E8722C] transition-colors"
                role="menuitem"
              >
                <Home className="w-4 h-4 text-[#497E64] shrink-0" />
                <span>Visit Homepage</span>
              </Link>
            </div>

            {/* Visual Divider & Sign Out Button (48px min touch target) */}
            <div className="pt-2 border-t border-[#1B3428]/10">
              <button
                type="button"
                id="profile-sign-out-btn-mobile"
                onClick={handleSignOut}
                className="w-full flex items-center justify-between px-3.5 py-2.5 min-h-[48px] rounded-xl text-xs font-display font-bold text-red-600 bg-red-50/60 hover:bg-red-50 border border-red-200/50 transition-colors group cursor-pointer"
                role="menuitem"
              >
                <span className="flex items-center gap-2.5">
                  <LogOut className="w-4 h-4 text-red-500 transition-transform group-hover:-translate-x-0.5 shrink-0" />
                  Sign Out
                </span>
                <span className="text-[10px] font-mono text-red-400">Exit workspace</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
