'use client';

import React from 'react';
import { Users, X, ShieldAlert, Check, Loader2, ArrowRight } from 'lucide-react';

interface ConvertToGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isConverting: boolean;
  workspaceName: string;
}

export function ConvertToGroupModal({
  isOpen,
  onClose,
  onConfirm,
  isConverting,
  workspaceName,
}: ConvertToGroupModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg bg-[#FAF8F4] rounded-3xl border-[2px] border-[#1B3428] shadow-[0_8px_0_0_#1B3428] p-6 sm:p-7 relative flex flex-col gap-5 animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="convert-modal-title"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isConverting}
          className="absolute top-5 right-5 w-8 h-8 rounded-full border border-[#1B3428]/20 flex items-center justify-center text-[#14261D]/70 hover:bg-[#FBE8DC] hover:text-[#14261D] transition-colors disabled:opacity-50"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start gap-3.5 pr-8">
          <div className="w-11 h-11 rounded-2xl bg-[#E8722C] text-white flex items-center justify-center shrink-0 shadow-xs border border-[#1B3428]/15">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="font-mono text-[10px] uppercase font-bold tracking-wider text-[#E8722C]">
              Workspace Transformation
            </span>
            <h2 id="convert-modal-title" className="font-display font-extrabold text-lg sm:text-xl text-[#14261D]">
              Convert to Group Workspace
            </h2>
          </div>
        </div>

        {/* Target Workspace Info */}
        <div className="p-3.5 rounded-2xl bg-[#F4F0E5] border border-[#1B3428]/15 text-xs text-[#14261D]">
          <span className="text-[#14261D]/60 font-medium">Target book: </span>
          <strong className="font-display font-bold text-[#14261D]">{workspaceName}</strong>
        </div>

        {/* Key Rules & Guarantees */}
        <div className="space-y-2.5 text-xs text-[#14261D]">
          <div className="flex items-start gap-2.5">
            <div className="w-4 h-4 rounded-full bg-[#1B3428] text-white flex items-center justify-center shrink-0 mt-0.5">
              <Check className="w-2.5 h-2.5" />
            </div>
            <p className="leading-relaxed">
              <strong>Shared Book & Discussion:</strong> Collaborators will access the exact same indexed document reader, outline, and shared group discussion channel.
            </p>
          </div>

          <div className="flex items-start gap-2.5">
            <div className="w-4 h-4 rounded-full bg-[#1B3428] text-white flex items-center justify-center shrink-0 mt-0.5">
              <Check className="w-2.5 h-2.5" />
            </div>
            <p className="leading-relaxed">
              <strong>Private AI Tutor & Reading State:</strong> Your existing and future AI conversations, reading position, and bookmarks remain <em>strictly confidential</em> to you.
            </p>
          </div>

          <div className="flex items-start gap-2.5">
            <div className="w-4 h-4 rounded-full bg-[#1B3428] text-white flex items-center justify-center shrink-0 mt-0.5">
              <Check className="w-2.5 h-2.5" />
            </div>
            <p className="leading-relaxed">
              <strong>Owner Controls:</strong> You become the workspace <strong>OWNER</strong> with full privileges to invite students via link or email and remove members.
            </p>
          </div>

          {/* Warning: Irreversible */}
          <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-[#FBE8DC] border border-[#E8722C]/40 text-[#14261D]">
            <ShieldAlert className="w-4 h-4 text-[#E8722C] shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              <strong className="text-[#E8722C]">Permanent Change:</strong> Once converted to a Group Workspace, this workspace <strong>cannot be reverted</strong> back to a Personal Workspace.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isConverting}
            className="w-full sm:w-auto px-5 py-2.5 rounded-full border border-[#1B3428]/25 font-display font-bold text-xs text-[#14261D] hover:bg-[#F4F0E5] transition-colors disabled:opacity-50"
          >
            Keep as Personal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isConverting}
            className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-[#E8722C] text-white font-display font-bold text-xs border-[1.5px] border-[#1B3428] shadow-[0_3px_0_0_#1B3428] hover:-translate-y-0.5 hover:shadow-[0_4px_0_0_#1B3428] active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:transform-none"
          >
            {isConverting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Converting Workspace...</span>
              </>
            ) : (
              <>
                <span>Confirm & Convert to Group</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
