'use client';

import React, { useState } from 'react';
import { Share2, X, Check, ShieldCheck, Loader2 } from 'lucide-react';

interface ShareConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (title: string) => Promise<void>;
  defaultTitle: string;
  isSharing: boolean;
}

export function ShareConversationModal({
  isOpen,
  onClose,
  onConfirm,
  defaultTitle,
  isSharing,
}: ShareConversationModalProps) {
  const [title, setTitle] = useState(defaultTitle || 'Shared AI Session');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSharing) return;
    await onConfirm(title.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-md bg-[#FAF8F4] rounded-3xl border-[2px] border-[#1B3428] shadow-[0_8px_0_0_#1B3428] p-6 relative flex flex-col gap-4 animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-modal-title"
      >
        <button
          type="button"
          onClick={onClose}
          disabled={isSharing}
          className="absolute top-5 right-5 w-8 h-8 rounded-full border border-[#1B3428]/20 flex items-center justify-center text-[#14261D]/70 hover:bg-[#FBE8DC] hover:text-[#14261D] transition-colors disabled:opacity-50"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3 pr-8">
          <div className="w-10 h-10 rounded-2xl bg-[#E8722C] text-white flex items-center justify-center shrink-0 shadow-xs">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <span className="font-mono text-[10px] uppercase font-bold tracking-wider text-[#E8722C]">
              Group Collaboration
            </span>
            <h2 id="share-modal-title" className="font-display font-extrabold text-lg text-[#14261D]">
              Share AI Conversation
            </h2>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-display font-bold text-[#14261D] mb-1.5">
              Snapshot Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Chapter 2 Theorem 3 Explanation"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#F4F0E5] border border-[#1B3428]/25 text-xs text-[#14261D] placeholder:text-[#14261D]/40 focus:outline-hidden focus:border-[#E8722C]"
              required
            />
          </div>

          <div className="space-y-2 p-3.5 rounded-2xl bg-[#F4F0E5] border border-[#1B3428]/15 text-xs text-[#14261D]">
            <div className="flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-[#1B3428] shrink-0 mt-0.5" />
              <p className="leading-relaxed text-[11px]">
                <strong>Immutable Snapshot:</strong> Creates a static copy of the current messages and verified citations.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <Check className="w-4 h-4 text-[#1B3428] shrink-0 mt-0.5" />
              <p className="leading-relaxed text-[11px]">
                <strong>Private Session Remains Yours:</strong> Your private AI tutor session continues independently. Future messages you type are NOT automatically shared.
              </p>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSharing}
              className="px-4 py-2 rounded-full border border-[#1B3428]/25 font-display font-bold text-xs text-[#14261D] hover:bg-[#F4F0E5] transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSharing || !title.trim()}
              className="px-5 py-2 rounded-full bg-[#E8722C] text-white font-display font-bold text-xs border-[1.5px] border-[#1B3428] shadow-[0_2px_0_0_#1B3428] hover:-translate-y-0.5 hover:shadow-[0_3px_0_0_#1B3428] active:translate-y-0.5 transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSharing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Sharing...</span>
                </>
              ) : (
                <>
                  <span>Share with Group</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
