'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  BookOpen,
  HelpCircle,
  Layers,
  List,
  Sparkles,
  TrendingUp,
  User,
  Users,
} from 'lucide-react';
import type { DocumentDto, WorkspaceType } from '@lernivox/contracts';
import { ProfileMenu } from './ProfileMenu';

export type WorkspaceViewMode = 'quizzes' | 'flashcards' | 'progress';
export type CompanionToolMode = 'ai-tutor' | 'quizzes' | 'flashcards' | 'progress';

interface TutorHeaderProps {
  document: DocumentDto | null;
  workspaceType?: WorkspaceType;
  isOwner?: boolean;
  memberCount?: number;
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
  document: doc,
  workspaceType = 'PERSONAL',
  isOwner = false,
  memberCount,
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
    <header className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] h-14 w-full px-3 sm:px-6 bg-[#FAF8F4] border-b-[2px] border-[#1B3428]/10 sticky top-0 z-30 select-none items-center">
      {/* =========================================================================
          ZONE 1: Brand & Document Identity (Left-aligned)
          ========================================================================= */}
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 justify-self-start">
        {/* Lernivox Brand Lockup */}
        <Link
          href="/dashboard"
          className="flex items-center gap-2 shrink-0 group hover:opacity-90 transition-opacity"
          title="Lernivox Dashboard"
        >
          <div className="w-6 h-6 rounded-md bg-[#E8722C] text-white flex items-center justify-center shadow-xs">
            <BookOpen className="w-3.5 h-3.5" />
          </div>
          <span className="font-display font-black text-sm tracking-tight text-[#14261D] hidden sm:inline">
            Lernivox
          </span>
        </Link>

        {/* Subtle Vertical Separator */}
        <div className="h-5 w-px bg-[#1B3428]/15 shrink-0" />

        {/* Outline Toggle Control */}
        <button
          type="button"
          onClick={onToggleOutline}
          className={`h-8 px-2.5 sm:px-3 rounded-full border-[1.5px] border-[#1B3428] font-display font-bold text-xs flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
            outlineOpen
              ? 'bg-[#1B3428] text-white shadow-xs'
              : 'bg-[#FAF8F4] text-[#14261D] shadow-[0_2px_0_0_#1B3428] hover:-translate-y-0.5'
          }`}
          title={outlineOpen ? 'Collapse Document Outline' : 'Open Document Outline'}
          aria-label="Outline"
        >
          <List className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Outline</span>
        </button>

        {/* Document Title (Hidden below lg on tablet to keep middle navigation centered) */}
        <div className="hidden lg:flex items-center gap-2 min-w-0">
          <h2
            className="font-display font-bold text-xs text-[#14261D] truncate max-w-[160px] xl:max-w-[260px] 2xl:max-w-[320px]"
            title={doc?.title || 'Study Textbook'}
          >
            {doc?.title || 'Study Textbook'}
          </h2>

          {/* Workspace Type Badge & Modal Actions */}
          {workspaceType === 'GROUP' ? (
            <div className="flex items-center gap-1.5 shrink-0">
              <span
                className="hidden xl:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#E8722C]/10 text-[#E8722C] text-[10px] font-mono font-bold tracking-wide uppercase border border-[#E8722C]/25 shrink-0"
                title="Shared Group Workspace"
              >
                <Users className="w-2.5 h-2.5" />
                Group
              </span>

              {onOpenManageGroupModal && (
                <button
                  type="button"
                  onClick={onOpenManageGroupModal}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-[#1B3428]/20 bg-[#FAF8F4] text-[#14261D] font-display font-bold text-[11px] hover:bg-[#F4F0E5] shadow-2xs hover:-translate-y-0.5 transition-all shrink-0 cursor-pointer"
                  title="Manage group members and invitations"
                >
                  <Users className="w-3 h-3 text-[#1B3428]" />
                  <span className="hidden 2xl:inline">{isOwner ? 'Manage' : 'Members'}</span>
                  {memberCount !== undefined && memberCount > 0 && (
                    <span className="font-mono text-[10px] text-[#14261D]/70 font-bold">
                      ({memberCount})
                    </span>
                  )}
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 shrink-0">
              <span
                className="hidden xl:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#1B3428]/10 text-[#1B3428] text-[10px] font-mono font-bold tracking-wide uppercase border border-[#1B3428]/20 shrink-0"
                title="Personal Workspace"
              >
                <User className="w-2.5 h-2.5" />
                Personal
              </span>

              {isOwner && onOpenConvertModal && (
                <button
                  type="button"
                  onClick={onOpenConvertModal}
                  className="hidden 2xl:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-[#1B3428]/25 bg-[#FAF8F4] text-[#14261D] font-display font-bold text-[11px] hover:bg-[#FBE8DC] hover:border-[#E8722C] shadow-2xs hover:-translate-y-0.5 transition-all shrink-0 cursor-pointer"
                  title="Convert to shared group workspace"
                >
                  <Users className="w-3 h-3 text-[#E8722C]" />
                  <span>Convert</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          ZONE 2: Mathematically Centered Study Navigation (True Center Grid)
          Segmented tabs: Quizzes | Flashcards | My Progress (NO READ TAB!)
          Dedicated AI Tutor action button
          ========================================================================= */}
      <div className="flex items-center gap-2 justify-self-center min-w-0">
        {onViewChange && (
          <nav className="flex items-center gap-1 bg-[#F4F0E5] p-1 rounded-full border border-[#1B3428]/15 shadow-2xs shrink-0">
            <button
              type="button"
              onClick={() => onViewChange('quizzes')}
              className={`px-3 sm:px-4 py-1.5 rounded-full font-display font-bold text-xs flex items-center gap-1.5 transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                activeView === 'quizzes' && copilotOpen
                  ? 'bg-[#14261D] text-white shadow-xs'
                  : 'text-[#14261D]/75 hover:text-[#14261D] hover:bg-[#1B3428]/5'
              }`}
              title="Quizzes & Assessments"
            >
              <HelpCircle className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">Quizzes</span>
            </button>

            <button
              type="button"
              onClick={() => onViewChange('flashcards')}
              className={`px-3 sm:px-4 py-1.5 rounded-full font-display font-bold text-xs flex items-center gap-1.5 transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                activeView === 'flashcards' && copilotOpen
                  ? 'bg-[#14261D] text-white shadow-xs'
                  : 'text-[#14261D]/75 hover:text-[#14261D] hover:bg-[#1B3428]/5'
              }`}
              title="Flashcard Decks"
            >
              <Layers className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">Flashcards</span>
            </button>

            <button
              type="button"
              onClick={() => onViewChange('progress')}
              className={`px-3 sm:px-4 py-1.5 rounded-full font-display font-bold text-xs flex items-center gap-1.5 transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                activeView === 'progress' && copilotOpen
                  ? 'bg-[#14261D] text-white shadow-xs'
                  : 'text-[#14261D]/75 hover:text-[#14261D] hover:bg-[#1B3428]/5'
              }`}
              title="Individual Learning Progress"
            >
              <TrendingUp className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">My Progress</span>
            </button>
          </nav>
        )}

        {/* Dedicated Separate AI Tutor Action */}
        <button
          type="button"
          onClick={onToggleAiTutor || onToggleCopilot}
          className={`h-8 px-2.5 sm:px-3 rounded-full border font-display font-bold text-xs flex items-center gap-1.5 transition-all shrink-0 cursor-pointer shadow-2xs hover:-translate-y-0.5 active:translate-y-0.5 ${
            activeView === 'ai-tutor' && copilotOpen
              ? 'bg-[#14261D] text-white border-[#14261D] shadow-xs'
              : 'bg-[#FAF8F4] text-[#14261D] border-[#1B3428]/20 hover:bg-[#FBE8DC] hover:border-[#E8722C]/40'
          }`}
          title="Open AI Tutor"
          aria-label="AI Tutor"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#E8722C] shrink-0" />
          <span className="hidden md:inline whitespace-nowrap">AI Tutor</span>
        </button>
      </div>

      {/* =========================================================================
          ZONE 3: Workspace & Profile Actions (Right-aligned)
          ========================================================================= */}
      <div className="flex items-center gap-2 sm:gap-2.5 justify-self-end shrink-0">
        {/* Back to Books Launcher */}
        <Link
          href="/dashboard"
          className="h-8 px-2 sm:px-2.5 lg:px-3 rounded-full bg-[#FAF8F4] border-[1.5px] border-[#1B3428] text-[#14261D] font-display font-bold text-xs shadow-[0_2px_0_0_#1B3428] hover:-translate-y-0.5 hover:shadow-[0_3px_0_0_#1B3428] active:translate-y-0.5 active:shadow-none transition-all flex items-center gap-1.5 shrink-0"
          title="Books"
          aria-label="Books"
        >
          <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden lg:inline whitespace-nowrap">Books</span>
        </Link>

        {/* User Profile Menu */}
        <ProfileMenu compact />
      </div>
    </header>
  );
}
