'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  HelpCircle,
  Layers,
  Sparkles,
  TrendingUp,
  User,
  Users,
} from 'lucide-react';
import type { DocumentDto, WorkspaceType } from '@lernivox/contracts';
import { ProfileMenu } from './ProfileMenu';

export type WorkspaceViewMode = 'read' | 'quizzes' | 'flashcards' | 'plan' | 'progress';
export type CompanionToolMode = 'read' | 'ai-tutor' | 'quizzes' | 'flashcards' | 'plan' | 'progress';

interface TutorHeaderProps {
  document: DocumentDto | null;
  workspaceType?: WorkspaceType;
  isOwner?: boolean;
  memberCount?: number;
  unreadDiscussionCount?: number;
  activeView?: CompanionToolMode;
  onViewChange?: (view: WorkspaceViewMode) => void;
  onToggleAiTutor?: () => void;
  onOpenConvertModal?: () => void;
  onOpenManageGroupModal?: () => void;
  outlineOpen: boolean;
  onToggleOutline: () => void;
  copilotOpen: boolean;
  onToggleCopilot: () => void;
  onPractice?: () => void;
}

export function TutorHeader({
  document: _doc,
  workspaceType = 'PERSONAL',
  isOwner = false,
  memberCount,
  unreadDiscussionCount = 0,
  activeView,
  onViewChange,
  onToggleAiTutor,
  onOpenConvertModal,
  onOpenManageGroupModal,
  outlineOpen,
  onToggleOutline,
  copilotOpen,
  onToggleCopilot,
}: TutorHeaderProps) {
  return (
    <header className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] h-14 w-full px-3 sm:px-6 bg-[#FAF8F4] border-b border-[#1B3428]/10 sticky top-0 z-30 select-none items-center">
      {/* =========================================================================
          ZONE 1: Brand & Outline Toggle (Left-aligned)
          Kept compact on laptop/tablet to prevent center navigation collisions
          ========================================================================= */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 justify-self-start">
        {/* Lernivox Brand Lockup */}
        <Link
          href="/dashboard"
          className="flex items-center gap-2 shrink-0 group hover:opacity-90 transition-opacity"
          title="Lernivox Dashboard"
        >
          <div className="w-6 h-6 rounded-md bg-[#E8722C] text-white flex items-center justify-center shadow-xs">
            <BookOpen className="w-3.5 h-3.5" />
          </div>
          <span className="font-display font-black text-sm tracking-tight text-[#14261D] hidden xl:inline">
            Lernivox
          </span>
        </Link>

        {/* Subtle Vertical Separator */}
        <div className="h-5 w-px bg-[#1B3428]/15 shrink-0 hidden sm:block" />

        {/* Outline Toggle Control (Clean text-only pill) */}
        <button
          type="button"
          onClick={onToggleOutline}
          className={`h-9 px-3.5 rounded-full border-[1.5px] font-display font-bold text-xs flex items-center justify-center transition-all shrink-0 cursor-pointer ${
            outlineOpen
              ? 'bg-[#1B3428] text-white border-[#1B3428] shadow-xs'
              : 'bg-[#FAF8F4] text-[#14261D] border-[#1B3428]/20 shadow-2xs hover:border-[#1B3428] hover:-translate-y-0.5'
          }`}
          title={outlineOpen ? 'Collapse Document Outline' : 'Open Document Outline'}
          aria-label="Outline"
        >
          <span className="hidden xl:inline">Outline</span>
          <span className="xl:hidden">Outline</span>
        </button>
      </div>

      {/* =========================================================================
          ZONE 2: Mathematically Centered Study Navigation (True Center Grid)
          Segmented tabs: Read | Quizzes | Flashcards | My Progress
          Responsive labels prevent tablet & small-desktop header collisions
          ========================================================================= */}
      <div className="flex items-center justify-self-center min-w-0">
        {onViewChange && (
          <nav className="flex items-center gap-1 bg-[#F4F0E5] p-1 rounded-full border border-[#1B3428]/15 shadow-2xs shrink-0">
            {/* 1. Read Mode (AI Tutor & Reading Companion) */}
            <button
              type="button"
              onClick={() => onViewChange('read')}
              className={`px-2.5 sm:px-3 xl:px-4 py-1.5 rounded-full font-display font-bold text-xs flex items-center gap-1.5 transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                (activeView === 'read' || activeView === 'ai-tutor') && copilotOpen
                  ? 'bg-[#14261D] text-white shadow-xs'
                  : 'text-[#14261D]/75 hover:text-[#14261D] hover:bg-[#1B3428]/5'
              }`}
              title="Read & AI Companion"
              aria-label="Read"
            >
              <BookOpen className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">Read</span>
            </button>

            {/* 2. Quizzes Mode */}
            <button
              type="button"
              onClick={() => onViewChange('quizzes')}
              className={`px-2.5 sm:px-3 xl:px-4 py-1.5 rounded-full font-display font-bold text-xs flex items-center gap-1.5 transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                activeView === 'quizzes' && copilotOpen
                  ? 'bg-[#14261D] text-white shadow-xs'
                  : 'text-[#14261D]/75 hover:text-[#14261D] hover:bg-[#1B3428]/5'
              }`}
              title="Quizzes & Assessments"
              aria-label="Quizzes"
            >
              <HelpCircle className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">Quizzes</span>
            </button>

            {/* 3. Flashcards Mode */}
            <button
              type="button"
              onClick={() => onViewChange('flashcards')}
              className={`px-2.5 sm:px-3 xl:px-4 py-1.5 rounded-full font-display font-bold text-xs flex items-center gap-1.5 transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                activeView === 'flashcards' && copilotOpen
                  ? 'bg-[#14261D] text-white shadow-xs'
                  : 'text-[#14261D]/75 hover:text-[#14261D] hover:bg-[#1B3428]/5'
              }`}
              title="Flashcard Decks"
              aria-label="Flashcards"
            >
              <Layers className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden xl:inline whitespace-nowrap">Flashcards</span>
              <span className="xl:hidden whitespace-nowrap">Cards</span>
            </button>

            {/* 4. Study Plan Mode */}
            <button
              type="button"
              onClick={() => onViewChange('plan')}
              className={`px-2.5 sm:px-3 xl:px-4 py-1.5 rounded-full font-display font-bold text-xs flex items-center gap-1.5 transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                activeView === 'plan' && copilotOpen
                  ? 'bg-[#14261D] text-white shadow-xs'
                  : 'text-[#14261D]/75 hover:text-[#14261D] hover:bg-[#1B3428]/5'
              }`}
              title="Adaptive Study Plan"
              aria-label="Study Plan"
            >
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden xl:inline whitespace-nowrap">Study Plan</span>
              <span className="xl:hidden whitespace-nowrap">Plan</span>
            </button>

            {/* 5. My Progress Mode */}
            <button
              type="button"
              onClick={() => onViewChange('progress')}
              className={`px-2.5 sm:px-3 xl:px-4 py-1.5 rounded-full font-display font-bold text-xs flex items-center gap-1.5 transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                activeView === 'progress' && copilotOpen
                  ? 'bg-[#14261D] text-white shadow-xs'
                  : 'text-[#14261D]/75 hover:text-[#14261D] hover:bg-[#1B3428]/5'
              }`}
              title="Individual Learning Progress"
              aria-label="My Progress"
            >
              <TrendingUp className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden xl:inline whitespace-nowrap">My Progress</span>
              <span className="xl:hidden whitespace-nowrap">Progress</span>
            </button>
          </nav>
        )}
      </div>

      {/* =========================================================================
          ZONE 3: Workspace & Profile Actions (Right-aligned)
          Includes compact Group Collaborator pill accessible on desktop & tablet
          ========================================================================= */}
      <div className="flex items-center gap-2 sm:gap-2.5 justify-self-end shrink-0">
        {/* Compact Collaborator Pill for GROUP Workspaces */}
        {workspaceType === 'GROUP' && onOpenManageGroupModal && (
          <button
            type="button"
            onClick={onOpenManageGroupModal}
            className="relative h-9 px-3 rounded-full border-[1.5px] border-[#1B3428]/20 bg-[#FAF8F4] text-[#14261D] font-display font-bold text-xs hover:border-[#E8722C] hover:text-[#E8722C] shadow-2xs hover:-translate-y-0.5 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
            title={`Manage workspace members (${memberCount || 1})${unreadDiscussionCount > 0 ? ` • ${unreadDiscussionCount} unread message${unreadDiscussionCount > 1 ? 's' : ''}` : ''}`}
            aria-label={`Manage workspace members (${memberCount || 1})${unreadDiscussionCount > 0 ? `, ${unreadDiscussionCount} unread messages` : ''}`}
          >
            <Users className="w-3.5 h-3.5 text-[#E8722C]" />
            <span className="font-mono text-xs font-bold text-[#14261D]">{memberCount || 1}</span>
            {unreadDiscussionCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 bg-[#E8722C] text-white text-[10px] font-mono font-bold rounded-full border-2 border-[#FAF8F4] flex items-center justify-center shadow-xs">
                {unreadDiscussionCount > 99 ? '99+' : unreadDiscussionCount}
              </span>
            )}
          </button>
        )}

        {/* Convert to Group action for Personal Workspaces (Owners only, wide screens) */}
        {workspaceType !== 'GROUP' && isOwner && onOpenConvertModal && (
          <button
            type="button"
            onClick={onOpenConvertModal}
            className="hidden 2xl:inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full border-[1.5px] border-[#1B3428]/20 bg-[#FAF8F4] text-[#14261D] font-display font-bold text-xs hover:border-[#E8722C] hover:text-[#E8722C] shadow-2xs hover:-translate-y-0.5 transition-all shrink-0 cursor-pointer"
            title="Convert to shared group workspace"
          >
            <Users className="w-3.5 h-3.5 text-[#E8722C]" />
            <span>Convert</span>
          </button>
        )}

        {/* Back to Books Launcher */}
        <Link
          href="/dashboard"
          className="h-9 px-3.5 rounded-full border-[1.5px] border-[#1B3428]/20 bg-[#FAF8F4] text-[#14261D] font-display font-bold text-xs hover:border-[#1B3428] shadow-2xs hover:-translate-y-0.5 active:translate-y-0.5 transition-all flex items-center gap-1.5 shrink-0"
          title="Books"
          aria-label="Books"
        >
          <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden xl:inline whitespace-nowrap">Books</span>
        </Link>

        {/* User Profile Menu */}
        <ProfileMenu compact />
      </div>
    </header>
  );
}
