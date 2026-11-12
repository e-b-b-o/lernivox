'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { api, ApiError } from '../../../lib/api';
import { AuthSplitShell } from '../../../components/auth/AuthSplitShell';
import { GoogleComingSoonModal } from '../../../components/auth/GoogleComingSoonModal';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register, isAuthenticated } = useAuth();

  const redirectUrl = searchParams.get('redirect') || '/dashboard';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isConflict, setIsConflict] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);

  // Field-level error & touched states
  const [nameTouched, setNameTouched] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validateName = (val: string): string | null => {
    const trimmed = val.trim();
    if (!trimmed) {
      return 'Enter your full name to continue.';
    }
    return null;
  };

  const validateEmail = (val: string): string | null => {
    const trimmed = val.trim();
    if (!trimmed) {
      return 'Enter your email address.';
    }
    if (!EMAIL_REGEX.test(trimmed)) {
      return 'Enter a valid email address.';
    }
    return null;
  };

  const validatePassword = (val: string): string | null => {
    if (!val) {
      return 'Password is required.';
    }
    if (val.length < 8) {
      return 'Your password must be at least 8 characters.';
    }
    return null;
  };

  const validateConfirmPassword = (val: string, pass: string): string | null => {
    if (!val) {
      return 'Confirm your password.';
    }
    if (val !== pass) {
      return 'Passwords do not match.';
    }
    return null;
  };

  // If already authenticated, redirect to destination
  useEffect(() => {
    if (isAuthenticated) {
      router.push(redirectUrl);
    }
  }, [isAuthenticated, redirectUrl, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsConflict(false);

    // Mark all fields touched
    setNameTouched(true);
    setEmailTouched(true);
    setPasswordTouched(true);
    setConfirmPasswordTouched(true);

    const nameErr = validateName(name);
    const emailErr = validateEmail(email);
    const passErr = validatePassword(password);
    const confErr = validateConfirmPassword(confirmPassword, password);

    setNameError(nameErr);
    setEmailError(emailErr);
    setPasswordError(passErr);
    setConfirmPasswordError(confErr);

    if (nameErr) {
      document.getElementById('name')?.focus();
      return;
    }

    if (emailErr) {
      document.getElementById('email')?.focus();
      return;
    }

    if (passErr) {
      document.getElementById('password')?.focus();
      return;
    }

    if (confErr) {
      document.getElementById('confirmPassword')?.focus();
      return;
    }

    setIsSubmitting(true);
    try {
      await register({
        email: email.trim(),
        password,
        name: name.trim(),
      });
      router.push(redirectUrl);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (
          err.statusCode === 409 ||
          err.message?.toLowerCase().includes('already exists')
        ) {
          setIsConflict(true);
          setErrorMessage(
            'An account with this email already exists. Try logging in instead.'
          );
        } else if (err.statusCode >= 500) {
          setErrorMessage(
            'Something went wrong on our side. Please try again shortly.'
          );
        } else if (
          err.statusCode === 0 ||
          err.message?.toLowerCase().includes('network') ||
          err.message?.toLowerCase().includes('failed to fetch')
        ) {
          setErrorMessage(
            "We couldn't connect. Check your internet connection and try again."
          );
        } else {
          setErrorMessage(
            err.message || "Your account couldn't be created. Please try again."
          );
        }
      } else if (err instanceof TypeError || String(err).includes('fetch')) {
        setErrorMessage(
          "We couldn't connect. Check your internet connection and try again."
        );
      } else {
        setErrorMessage(
          "Your account couldn't be created. Please try again."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = () => {
    setShowGoogleModal(true);
  };

  const handleEmailAuth = () => {
    setShowGoogleModal(false);
    setTimeout(() => {
      (document.getElementById('name') || document.getElementById('email'))?.focus();
    }, 50);
  };

  return (
    <div className="w-full max-w-[420px] flex flex-col pt-2 sm:pt-4">
      {/* Header */}
      <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-[#14261D] tracking-tight leading-[1.1] mb-2.5">
        Create your{' '}
        <span
          className="relative inline-block text-[#497E64] select-none"
          style={{
            transform: 'translateY(-2px) rotate(2deg)',
            transformOrigin: 'bottom right',
            display: 'inline-block',
          }}
        >
          account.
          <svg
            className="absolute -bottom-2 left-0 w-[105%] h-[12px] text-[#E8722C] pointer-events-none overflow-visible"
            viewBox="0 0 160 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
          >
            <path d="M 3 6 C 40 2, 110 3, 155 5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 8 9 C 50 4, 120 7, 150 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" opacity="0.8" />
          </svg>
        </span>
      </h1>
      <p className="font-sans text-sm text-[#14261D]/70 leading-relaxed mb-6">
        Enter your details to get started.
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
      <div className="my-5 flex items-center">
        <div className="flex-grow border-t border-[#14261D]/15" />
        <span className="px-4 text-xs font-semibold text-[#14261D]/50 uppercase tracking-wider">
          or register with email
        </span>
        <div className="flex-grow border-t border-[#14261D]/15" />
      </div>

      {/* Error Alert with context-aware action */}
      {errorMessage && (
        <div
          role="alert"
          className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50/90 p-4 text-sm text-red-800 animate-fadeIn"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
          <div className="flex-1 leading-relaxed">
            <span>{errorMessage}</span>
            {isConflict && (
              <div className="mt-1.5">
                <Link
                  href={`/login${redirectUrl !== '/dashboard' ? `?redirect=${encodeURIComponent(redirectUrl)}` : ''}`}
                  className="font-bold text-[#E8722C] hover:underline inline-flex items-center gap-1"
                >
                  Log in to your account →
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Form Fields */}
      <form onSubmit={handleSubmit} noValidate className="space-y-3.5">
        <div>
          <label
            htmlFor="name"
            className="block text-xs font-bold text-[#14261D] uppercase tracking-wider mb-1"
          >
            Full name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (nameTouched) {
                setNameError(validateName(e.target.value));
              }
            }}
            onBlur={() => {
              setNameTouched(true);
              setNameError(validateName(name));
            }}
            placeholder="Enter your full name"
            disabled={isSubmitting}
            className={`w-full bg-[#FAF8F4] border-[1.5px] rounded-2xl px-4 py-3 text-sm text-[#14261D] placeholder-[#14261D]/40 focus:outline-none focus:ring-2 shadow-sm transition-all disabled:opacity-50 ${
              nameError
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                : 'border-[#1B3428]/20 focus:border-[#497E64] focus:ring-[#497E64]/20'
            }`}
          />
          {nameError && (
            <p className="mt-1 text-xs text-red-600 font-medium">{nameError}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-xs font-bold text-[#14261D] uppercase tracking-wider mb-1"
          >
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (emailTouched) {
                setEmailError(validateEmail(e.target.value));
              }
            }}
            onBlur={() => {
              setEmailTouched(true);
              setEmailError(validateEmail(email));
            }}
            placeholder="you@example.com"
            disabled={isSubmitting}
            aria-invalid={Boolean(emailTouched && emailError)}
            aria-describedby={emailTouched && emailError ? 'register-email-error' : undefined}
            className={`w-full bg-[#FAF8F4] border-[1.5px] rounded-2xl px-4 py-3 text-sm text-[#14261D] placeholder-[#14261D]/40 focus:outline-none shadow-sm transition-all disabled:opacity-50 ${
              emailTouched && emailError
                ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                : 'border-[#1B3428]/20 focus:border-[#497E64] focus:ring-2 focus:ring-[#497E64]/20'
            }`}
          />
          {emailTouched && emailError && (
            <p
              id="register-email-error"
              role="alert"
              className="text-xs text-red-600 mt-1 flex items-center gap-1 font-sans animate-fadeIn"
            >
              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-500" />
              <span>{emailError}</span>
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-xs font-bold text-[#14261D] uppercase tracking-wider mb-1"
          >
            Password (min. 8 characters)
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={password}
              onChange={(e) => {
                const newPass = e.target.value;
                setPassword(newPass);
                if (passwordTouched) {
                  setPasswordError(validatePassword(newPass));
                }
                if (confirmPasswordTouched) {
                  setConfirmPasswordError(validateConfirmPassword(confirmPassword, newPass));
                }
              }}
              onBlur={() => {
                setPasswordTouched(true);
                setPasswordError(validatePassword(password));
              }}
              placeholder="••••••••"
              disabled={isSubmitting}
              aria-invalid={Boolean(passwordTouched && passwordError)}
              aria-describedby={passwordTouched && passwordError ? 'register-password-error' : undefined}
              className={`w-full bg-[#FAF8F4] border-[1.5px] rounded-2xl px-4 py-3 pr-11 text-sm text-[#14261D] placeholder-[#14261D]/40 focus:outline-none shadow-sm transition-all disabled:opacity-50 ${
                passwordTouched && passwordError
                  ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                  : 'border-[#1B3428]/20 focus:border-[#497E64] focus:ring-2 focus:ring-[#497E64]/20'
              }`}
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
          {passwordTouched && passwordError && (
            <p
              id="register-password-error"
              role="alert"
              className="text-xs text-red-600 mt-1 flex items-center gap-1 font-sans animate-fadeIn"
            >
              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-500" />
              <span>{passwordError}</span>
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-xs font-bold text-[#14261D] uppercase tracking-wider mb-1"
          >
            Confirm Password
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => {
                const newConf = e.target.value;
                setConfirmPassword(newConf);
                if (confirmPasswordTouched) {
                  setConfirmPasswordError(validateConfirmPassword(newConf, password));
                }
              }}
              onBlur={() => {
                setConfirmPasswordTouched(true);
                setConfirmPasswordError(validateConfirmPassword(confirmPassword, password));
              }}
              placeholder="••••••••"
              disabled={isSubmitting}
              aria-invalid={Boolean(confirmPasswordTouched && confirmPasswordError)}
              aria-describedby={
                confirmPasswordTouched && confirmPasswordError
                  ? 'register-confirm-password-error'
                  : undefined
              }
              className={`w-full bg-[#FAF8F4] border-[1.5px] rounded-2xl px-4 py-3 pr-11 text-sm text-[#14261D] placeholder-[#14261D]/40 focus:outline-none shadow-sm transition-all disabled:opacity-50 ${
                confirmPasswordTouched && confirmPasswordError
                  ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                  : 'border-[#1B3428]/20 focus:border-[#497E64] focus:ring-2 focus:ring-[#497E64]/20'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#14261D]/40 hover:text-[#14261D] transition-colors p-1"
              aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {confirmPasswordTouched && confirmPasswordError && (
            <p
              id="register-confirm-password-error"
              role="alert"
              className="text-xs text-red-600 mt-1 flex items-center gap-1 font-sans animate-fadeIn"
            >
              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-500" />
              <span>{confirmPasswordError}</span>
            </p>
          )}
        </div>

        {/* Tactile Terracotta Sign Up Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full mt-5 py-4 rounded-full bg-[#E8722C] text-white font-display font-bold text-base shadow-[0_4px_0_0_#B26E45] hover:-translate-y-0.5 hover:shadow-[0_6px_0_0_#B26E45] active:translate-y-1 active:shadow-[0_1px_0_0_#B26E45] transition-all flex items-center justify-center disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Creating account...
            </>
          ) : (
            'Sign up'
          )}
        </button>
      </form>

      {/* Switch Mode Link */}
      <div className="mt-5 text-center">
        <p className="font-sans text-sm text-[#14261D]/70">
          Already have an account?{' '}
          <Link
            href={`/login${redirectUrl !== '/dashboard' ? `?redirect=${encodeURIComponent(redirectUrl)}` : ''}`}
            className="font-bold text-[#E8722C] hover:underline"
          >
            Log in
          </Link>
        </p>
      </div>

      <GoogleComingSoonModal
        isOpen={showGoogleModal}
        onClose={() => setShowGoogleModal(false)}
        mode="register"
        onEmailAuth={handleEmailAuth}
      />
    </div>
  );
}

export default function RegisterPage() {
  return (
    <AuthSplitShell mode="register">
      <Suspense
        fallback={
          <div className="flex flex-1 items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#14261D]" />
          </div>
        }
      >
        <RegisterForm />
      </Suspense>
    </AuthSplitShell>
  );
}



