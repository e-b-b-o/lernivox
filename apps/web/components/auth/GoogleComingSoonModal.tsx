'use client';

import React, { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { X, ArrowRight, Mail } from 'lucide-react';

interface GoogleComingSoonModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'login' | 'register';
  onEmailAuth: () => void;
}

export function GoogleComingSoonModal({
  isOpen,
  onClose,
  mode,
  onEmailAuth,
}: GoogleComingSoonModalProps) {
  const router = useRouter();
  const primaryButtonRef = useRef<HTMLButtonElement | null>(null);

  // Close on Escape & trap scroll
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Focus primary button when modal opens
    const timer = setTimeout(() => {
      primaryButtonRef.current?.focus();
    }, 50);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timer);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isLogin = mode === 'login';

  const handleSecondaryAction = () => {
    onClose();
    if (isLogin) {
      router.push('/register');
    } else {
      router.push('/login');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="google-modal-title"
      aria-describedby="google-modal-desc"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="w-full sm:max-w-md bg-[#FAF8F4] border-t-2 sm:border-2 border-[#1B3428] rounded-t-[28px] sm:rounded-[28px] shadow-[0_12px_0_0_#1B3428] p-6 sm:p-7 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Pull-bar indicator */}
        <div className="sm:hidden w-10 h-1 bg-[#1B3428]/20 rounded-full mx-auto mb-4" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-4 right-4 sm:top-5 sm:right-5 p-1.5 rounded-full text-[#14261D]/60 hover:text-[#14261D] hover:bg-[#1B3428]/10 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon & Badge Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-white border-[1.5px] border-[#1B3428]/15 shadow-xs flex items-center justify-center shrink-0">
            <svg className="w-6 h-6" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          </div>
          <div>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[#E8722C]/10 text-[#E8722C] border border-[#E8722C]/25">
              Coming Soon
            </span>
          </div>
        </div>

        {/* Heading & Description */}
        <h2
          id="google-modal-title"
          className="font-display font-extrabold text-xl sm:text-2xl text-[#14261D] tracking-tight leading-snug mb-2"
        >
          Google sign-in is on the way
        </h2>
        <p
          id="google-modal-desc"
          className="font-sans text-sm text-[#14261D]/70 leading-relaxed mb-6"
        >
          {isLogin
            ? "We're still getting Google sign-in ready. In the meantime, you can log in directly with your email and password below."
            : "We're still getting Google sign-in ready. In the meantime, you can create your account directly with your email and password below."}
        </p>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          <button
            ref={primaryButtonRef}
            type="button"
            onClick={onEmailAuth}
            className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-2xl bg-[#E8722C] hover:bg-[#D65E1E] text-white font-display font-bold text-sm shadow-[0_3px_0_0_#B26E45] active:translate-y-0.5 transition-all cursor-pointer"
          >
            <Mail className="w-4 h-4" />
            <span>{isLogin ? 'Log in with email' : 'Create account with email'}</span>
          </button>

          <button
            type="button"
            onClick={handleSecondaryAction}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs sm:text-sm text-[#14261D]/80 hover:text-[#14261D] font-display font-bold hover:bg-[#1B3428]/5 transition-colors cursor-pointer text-center"
          >
            <span>{isLogin ? 'Need an account? Create one' : 'Already have an account? Log in'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

