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

export type WorkspaceViewMode = 'read' | 'quizzes' | 'flashcards' | 'progress';

interface TutorHeaderProps {
  document: DocumentDto | null;
  workspaceType?: WorkspaceType;
  isOwner?: boolean;
  memberCount?: number;
  activeView?: WorkspaceViewMode;
  onViewChange?: (view: WorkspaceViewMode) => void;
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
  activeView = 'read',
  onViewChange,
  onOpenConvertModal,
  onOpenManageGroupModal,
  outlineOpen,
  onToggleOutline,
  copilotOpen,
  onToggleCopilot,
  onPractice,
}: TutorHeaderProps) {
  return (
    <header className="w-full h-14 bg-[#FAF8F4] border-b-[2px] border-[#1B3428]/15 px-3 sm:px-5 flex items-center justify-between shrink-0 select-none z-30 shadow-xs">
      {/* 1. LEFT ZONE: Outline Toggle, Document Identity & Workspace Controls */}
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        {/* Single Authoritative Contents Toggle Control */}
        <button
          type="button"
          onClick={onToggleOutline}
          className={`h-8 px-2.5 sm:px-3 rounded-full border-[1.5px] border-[#1B3428] font-display font-bold text-xs flex items-center gap-1.5 transition-all shrink-0 ${
            outlineOpen
              ? 'bg-[#1B3428] text-white shadow-xs'
              : 'bg-[#FAF8F4] text-[#14261D] shadow-[0_2px_0_0_#1B3428] hover:-translate-y-0.5'
          }`}
          title={outlineOpen ? 'Collapse Document Outline' : 'Open Document Outline'}
        >
          <List className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Contents</span>
        </button>

        {/* Document Icon & Title */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-md bg-[#E8722C] text-white flex items-center justify-center shrink-0 shadow-xs">
            <BookOpen className="w-3.5 h-3.5" />
          </div>
          <h2
            className="font-display font-bold text-xs sm:text-sm text-[#14261D] truncate max-w-[110px] sm:max-w-[180px] md:max-w-[260px]"
            title={doc?.title || 'Document Reader'}
          >
            {doc?.title || 'Study Textbook'}
          </h2>

          {/* Workspace Type Badge & Action */}
          {workspaceType === 'GROUP' ? (
            <div className="flex items-center gap-1.5 shrink-0">
              <span
                className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#E8722C]/10 text-[#E8722C] text-[10px] font-mono font-bold tracking-wide uppercase border border-[#E8722C]/25 shrink-0"
                title="Shared Group Workspace"
              >
                <Users className="w-2.5 h-2.5" />
                Group
              </span>

              {onOpenManageGroupModal && (
                <button
                  type="button"
                  onClick={onOpenManageGroupModal}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-[#1B3428]/20 bg-[#FAF8F4] text-[#14261D] font-display font-bold text-xs hover:bg-[#F4F0E5] shadow-2xs hover:-translate-y-0.5 transition-all shrink-0"
                  title="Manage group members and invitations"
                >
                  <Users className="w-3 h-3 text-[#1B3428]" />
                  <span className="hidden md:inline">{isOwner ? 'Manage Group' : 'Members'}</span>
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
                className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#1B3428]/10 text-[#1B3428] text-[10px] font-mono font-bold tracking-wide uppercase border border-[#1B3428]/20 shrink-0"
                title="Personal Workspace"
              >
                <User className="w-2.5 h-2.5" />
                Personal
              </span>

              {/* Owner Convert to Group Action */}
              {isOwner && onOpenConvertModal && (
                <button
                  type="button"
                  onClick={onOpenConvertModal}
                  className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[#1B3428]/25 bg-[#FAF8F4] text-[#14261D] font-display font-bold text-xs hover:bg-[#FBE8DC] hover:border-[#E8722C] shadow-2xs hover:-translate-y-0.5 transition-all shrink-0"
                  title="Convert this personal workspace to a shared group workspace"
                >
                  <Users className="w-3 h-3 text-[#E8722C]" />
                  <span>Convert to Group</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 2. CENTER ZONE: Workspace Views Navigation */}
      {onViewChange && (
        <nav className="flex items-center gap-1 bg-[#F4F0E5] p-1 rounded-full border border-[#1B3428]/15 shadow-2xs">
          <button
            type="button"
            onClick={() => onViewChange('read')}
            className={`px-2.5 sm:px-3 py-1 rounded-full font-display font-bold text-xs flex items-center gap-1.5 transition-all ${
              activeView === 'read'
                ? 'bg-[#1B3428] text-white shadow-xs'
                : 'text-[#14261D]/70 hover:text-[#14261D]'
            }`}
            title="Read Textbook"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Read</span>
          </button>

          <button
            type="button"
            onClick={() => onViewChange('quizzes')}
            className={`px-2.5 sm:px-3 py-1 rounded-full font-display font-bold text-xs flex items-center gap-1.5 transition-all ${
              activeView === 'quizzes'
                ? 'bg-[#1B3428] text-white shadow-xs'
                : 'text-[#14261D]/70 hover:text-[#14261D]'
            }`}
            title="Practice Quizzes"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Quizzes</span>
          </button>

          <button
            type="button"
            onClick={() => onViewChange('flashcards')}
            className={`px-2.5 sm:px-3 py-1 rounded-full font-display font-bold text-xs flex items-center gap-1.5 transition-all ${
              activeView === 'flashcards'
                ? 'bg-[#1B3428] text-white shadow-xs'
                : 'text-[#14261D]/70 hover:text-[#14261D]'
            }`}
            title="Flashcard Decks"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Flashcards</span>
          </button>

          <button
            type="button"
            onClick={() => onViewChange('progress')}
            className={`px-2.5 sm:px-3 py-1 rounded-full font-display font-bold text-xs flex items-center gap-1.5 transition-all ${
              activeView === 'progress'
                ? 'bg-[#1B3428] text-white shadow-xs'
                : 'text-[#14261D]/70 hover:text-[#14261D]'
            }`}
            title="Individual Learning Progress"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span className="hidden md:inline">My Progress</span>
          </button>
        </nav>
      )}

      {/* 3. RIGHT ZONE: Back to Books Link, Lernivox AI Toggle & Profile Menu */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        {/* Back to Books Button */}
        <Link
          href="/dashboard"
          className="h-8 px-2.5 sm:px-3 rounded-full bg-[#FAF8F4] border-[1.5px] border-[#1B3428] text-[#14261D] font-display font-bold text-xs shadow-[0_2px_0_0_#1B3428] hover:-translate-y-0.5 hover:shadow-[0_3px_0_0_#1B3428] active:translate-y-0.5 active:shadow-none transition-all flex items-center gap-1.5 shrink-0"
          title="Return to My Books"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Books</span>
        </Link>

        {/* Contextual Chapter Practice Button */}
        {onPractice && (
          <button
            type="button"
            onClick={onPractice}
            className="h-8 px-2.5 sm:px-3 rounded-full bg-[#FAF8F4] border-[1.5px] border-[#1B3428] text-[#14261D] font-display font-bold text-xs shadow-[0_2px_0_0_#1B3428] hover:-translate-y-0.5 hover:shadow-[0_3px_0_0_#1B3428] active:translate-y-0.5 transition-all flex items-center gap-1.5 shrink-0"
            title="Generate quiz from this chapter"
          >
            <HelpCircle className="w-3.5 h-3.5 text-[#E8722C]" />
            <span className="hidden sm:inline">Practice</span>
          </button>
        )}

        {/* Lernivox AI Sidecar Toggle */}
        <button
          type="button"
          onClick={onToggleCopilot}
          className={`h-8 px-2.5 sm:px-3 rounded-full border-[1.5px] border-[#1B3428] font-display font-bold text-xs flex items-center gap-1.5 transition-all ${
            copilotOpen
              ? 'bg-[#E8722C] text-white shadow-xs'
              : 'bg-[#FAF8F4] text-[#14261D] shadow-[0_2px_0_0_#1B3428] hover:-translate-y-0.5'
          }`}
          title={copilotOpen ? 'Dock Lernivox AI' : 'Open Lernivox AI'}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden md:inline">{copilotOpen ? 'Lernivox AI' : 'Ask Lernivox AI'}</span>
        </button>

        {/* Compact User Profile Menu */}
        <ProfileMenu compact />
      </div>
    </header>
  );
}

