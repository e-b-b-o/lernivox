'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { api, ApiError } from '../../../lib/api';
import { AuthShowcase } from '../../../components/auth/AuthShowcase';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated } = useAuth();

  const redirectUrl = searchParams.get('redirect') || '/dashboard';
  const urlError = searchParams.get('error');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (urlError === 'GoogleAuthFailed') {
      setErrorMessage('Google sign-in was canceled or failed. Please try again.');
    } else if (urlError === 'AccountLinkingFailed') {
      setErrorMessage('Unable to link Google account. Please sign in with email first.');
    }
  }, [urlError]);

  // If already authenticated, redirect to destination
  useEffect(() => {
    if (isAuthenticated) {
      router.push(redirectUrl);
    }
  }, [isAuthenticated, redirectUrl, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('Please enter both your email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login({ email: email.trim(), password });
      router.push(redirectUrl);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to sign in. Please verify your connection and credentials.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = () => {
    window.location.href = api.auth.getGoogleAuthUrl();
  };

  return (
    <div className="w-full max-w-[420px] flex flex-col pt-2 sm:pt-4">
      {/* Header */}
      <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-[#14261D] tracking-tight leading-[1.1] mb-2.5">
        Welcome{' '}
        <span
          className="relative inline-block text-[#497E64] select-none"
          style={{
            transform: 'translateY(-2px) rotate(2deg)',
            transformOrigin: 'bottom right',
            display: 'inline-block'
          }}
        >
          back.
          <svg
            className="absolute -bottom-2 left-0 w-[105%] h-[12px] text-[#E8722C] pointer-events-none overflow-visible"
            viewBox="0 0 120 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
          >
            <path d="M 3 6 C 30 2, 80 3, 115 5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 8 9 C 40 4, 90 7, 110 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" opacity="0.8" />
          </svg>
        </span>
      </h1>
      <p className="font-sans text-sm text-[#14261D]/70 leading-relaxed mb-8">
        Turn dense textbooks, lecture slides, and syllabi into active recall and verifiable mastery.
      </p>

      {/* Google Continue Button */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        className="flex w-full items-center justify-center gap-3 rounded-2xl border-[1.5px] border-[#1B3428]/20 bg-white px-5 py-3.5 text-sm font-semibold text-[#14261D] shadow-[0_2px_0_0_#1B3428]/10 hover:bg-[#FAF8F4] active:translate-y-0.5 transition-all"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24">
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
        Continue with Google
      </button>

      {/* Divider */}
      <div className="my-6 flex items-center">
        <div className="flex-grow border-t border-[#14261D]/15" />
        <span className="px-4 text-xs font-semibold text-[#14261D]/50 uppercase tracking-wider">
          or continue with email
        </span>
        <div className="flex-grow border-t border-[#14261D]/15" />
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div
          role="alert"
          className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50/90 p-4 text-sm text-red-800 animate-fadeIn"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
          <span className="flex-1 leading-relaxed">{errorMessage}</span>
        </div>
      )}

      {/* Form Fields */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-xs font-bold text-[#14261D] uppercase tracking-wider mb-1.5"
          >
            Email Address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="student@university.edu"
            disabled={isSubmitting}
            className="w-full bg-[#FAF8F4] border-[1.5px] border-[#1B3428]/20 rounded-2xl px-4 py-3.5 text-sm text-[#14261D] placeholder-[#14261D]/40 focus:outline-none focus:border-[#497E64] focus:ring-2 focus:ring-[#497E64]/20 shadow-sm transition-all disabled:opacity-50"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="password"
              className="block text-xs font-bold text-[#14261D] uppercase tracking-wider"
            >
              Password
            </label>
          </div>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={isSubmitting}
              className="w-full bg-[#FAF8F4] border-[1.5px] border-[#1B3428]/20 rounded-2xl px-4 py-3.5 pr-11 text-sm text-[#14261D] placeholder-[#14261D]/40 focus:outline-none focus:border-[#497E64] focus:ring-2 focus:ring-[#497E64]/20 shadow-sm transition-all disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#14261D]/40 hover:text-[#14261D] transition-colors p-1"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Tactile Terracotta Sign In Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full mt-6 py-4 rounded-full bg-[#E8722C] text-white font-display font-bold text-base shadow-[0_4px_0_0_#B26E45] hover:-translate-y-0.5 hover:shadow-[0_6px_0_0_#B26E45] active:translate-y-1 active:shadow-[0_1px_0_0_#B26E45] transition-all flex items-center justify-center disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Signing in...
            </>
          ) : (
            'Sign In'
          )}
        </button>
      </form>

      {/* Switch Auth Mode Link */}
      <div className="mt-6 text-center">
        <p className="font-sans text-sm text-[#14261D]/70">
          Don&apos;t have an account?{' '}
          <Link
            href={`/register${redirectUrl !== '/dashboard' ? `?redirect=${encodeURIComponent(redirectUrl)}` : ''}`}
            className="font-bold text-[#E8722C] hover:underline"
          >
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-[#FAF8F4]">
      {/* LEFT COLUMN: Perfectly Centered Form Container */}
      <div className="relative flex flex-col items-center justify-center min-h-screen w-full px-6 py-12 lg:col-span-6 bg-[#FAF8F4]">
        {/* Absolute Nav Link (Does not impact vertical centering) */}
        <Link
          href="/"
          className="absolute top-6 sm:top-8 left-6 sm:left-8 text-xs font-semibold text-[#14261D]/60 hover:text-[#14261D] flex items-center gap-1.5 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to homepage
        </Link>

        <Suspense
          fallback={
            <div className="flex flex-1 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-[#14261D]" />
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </div>

      {/* Right Column: Cleaned & Decluttered Visual Showcase */}
      <AuthShowcase />
    </div>
  );
}


