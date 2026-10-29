'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, ArrowLeft, BookOpen, Loader2 } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { useAuth } from '../../../context/AuthContext';
import { api, ApiError } from '../../../lib/api';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register, isAuthenticated } = useAuth();

  const redirectUrl = searchParams.get('redirect') || '/dashboard';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
      setErrorMessage('Please provide a valid email and password.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify your password confirmation.');
      return;
    }

    setIsSubmitting(true);
    try {
      await register({
        email: email.trim(),
        password,
        name: name.trim() || undefined,
      });
      router.push(redirectUrl);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to create account. Please check your network and try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = () => {
    window.location.href = api.auth.getGoogleAuthUrl();
  };

  return (
    <div className="w-full max-w-xl rounded-[2.5rem] border border-stone-200/80 bg-white/90 backdrop-blur-md p-8 sm:p-12 shadow-card hover:shadow-card-hover transition-all duration-300">
      <div className="text-center mb-8">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-lernivox-forest text-lernivox-peach shadow-sm">
          <BookOpen className="h-7 w-7" />
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-extrabold tracking-tight text-lernivox-forest">
          Create your account
        </h1>
        <p className="text-base text-stone-600 mt-2">
          Transform textbooks and lecture slides into verifiable study plans
        </p>
      </div>

      <div>
        {/* Google Sign-in Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="flex w-full items-center justify-center gap-3.5 rounded-full border border-stone-300 bg-white px-6 py-3.5 text-base font-semibold text-stone-700 shadow-subtle transition-all hover:bg-stone-50 hover:shadow-card focus:outline-none focus:ring-2 focus:ring-lernivox-forest/20 active:scale-[0.99]"
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
          <div className="flex-grow border-t border-stone-200" />
          <span className="px-4 text-xs font-semibold text-stone-500 uppercase tracking-wider">
            or register with email
          </span>
          <div className="flex-grow border-t border-stone-200" />
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

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="name"
              className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2"
            >
              Full Name (Optional)
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Alex Johnson"
              disabled={isSubmitting}
              className="w-full rounded-2xl border border-stone-300 bg-white px-5 py-3.5 text-base text-stone-900 placeholder:text-stone-400 transition-colors focus:border-lernivox-forest focus:outline-none focus:ring-1 focus:ring-lernivox-forest disabled:opacity-50"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2"
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
              placeholder="alex@university.edu"
              disabled={isSubmitting}
              className="w-full rounded-2xl border border-stone-300 bg-white px-5 py-3.5 text-base text-stone-900 placeholder:text-stone-400 transition-colors focus:border-lernivox-forest focus:outline-none focus:ring-1 focus:ring-lernivox-forest disabled:opacity-50"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2"
            >
              Password (min. 8 characters)
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={isSubmitting}
              className="w-full rounded-2xl border border-stone-300 bg-white px-5 py-3.5 text-base text-stone-900 placeholder:text-stone-400 transition-colors focus:border-lernivox-forest focus:outline-none focus:ring-1 focus:ring-lernivox-forest disabled:opacity-50"
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2"
            >
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              disabled={isSubmitting}
              className="w-full rounded-2xl border border-stone-300 bg-white px-5 py-3.5 text-base text-stone-900 placeholder:text-stone-400 transition-colors focus:border-lernivox-forest focus:outline-none focus:ring-1 focus:ring-lernivox-forest disabled:opacity-50"
            />
          </div>

          <Button
            type="submit"
            variant="secondary"
            size="lg"
            className="w-full text-base font-semibold shadow-glow-terracotta"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Creating account...
              </>
            ) : (
              'Create Account'
            )}
          </Button>

          <div className="flex items-center justify-between pt-4 text-sm text-stone-500">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 hover:text-lernivox-forest transition hover:underline"
            >
              <ArrowLeft className="h-4 w-4" />
              Homepage
            </Link>
            <p>
              Already have an account?{' '}
              <Link
                href={`/login${redirectUrl !== '/dashboard' ? `?redirect=${encodeURIComponent(redirectUrl)}` : ''}`}
                className="font-semibold text-lernivox-forest hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-16 bg-lernivox-cream">
      <Suspense
        fallback={
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-lernivox-forest" />
          </div>
        }
      >
        <RegisterForm />
      </Suspense>
    </div>
  );
}

