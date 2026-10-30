'use client';

import { useState } from 'react';
import { authApi } from '@/lib/api';
import { Alert } from '@/components/ui';
import { extractApiError } from '@/lib/utils';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Sun, Moon, Mail, Sparkles, Loader2, CheckCircle2 } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

export default function ForgotPasswordPage() {
  const { theme, toggleTheme } = useTheme();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || !email) return;
    setLoading(true);
    setError('');

    try {
      await authApi.forgotPassword(email.trim().toLowerCase());
      setSubmitted(true);
    } catch (err: any) {
      setError(extractApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors duration-200 dark:bg-slate-950 dark:text-slate-100 flex flex-col justify-center items-center p-4 relative selection:bg-cyan-500 selection:text-black">
      {/* Background glow effects */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_70%_60%_at_50%_0%,rgba(14,165,233,0.12),transparent)]" />

      {/* Top utility row: Back to public site & theme toggle */}
      <header className="absolute top-4 left-4 right-4 max-w-5xl mx-auto flex items-center justify-between pointer-events-auto">
        <Link
          href="/auth/login"
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white/80 px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur transition hover:border-slate-300 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Sign In</span>
        </Link>

        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white/80 text-slate-700 shadow-sm backdrop-blur transition hover:border-slate-300 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
        >
          {theme === 'dark' ? (
            <Sun aria-hidden="true" className="h-4 w-4 text-amber-400" />
          ) : (
            <Moon aria-hidden="true" className="h-4 w-4 text-cyan-600" />
          )}
        </button>
      </header>

      <div className="w-full max-w-md my-12">
        {/* Brand header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-3 group focus:outline-none">
            <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform duration-200">
              <Image
                src="/images/logo.webp"
                alt="SysMaira Logo"
                fill
                sizes="40px"
                className="object-cover"
                priority
              />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              SysMaira<span className="text-cyan-500">.</span>
            </span>
          </Link>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-3 h-3 text-cyan-500" />
            <span>Account Security</span>
          </div>

          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Reset Password
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Enter your registered email address and we'll send you a secure recovery link
          </p>
        </div>

        {/* Card form */}
        <div className="rounded-2xl border border-slate-200 bg-white/90 p-8 shadow-xl backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90">
          {error && (
            <div className="mb-6">
              <Alert type="error">{error}</Alert>
            </div>
          )}

          {submitted ? (
            <div className="text-center py-4 space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Check Your Inbox</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                If an account exists for <span className="font-semibold text-slate-800 dark:text-slate-200">{email}</span>, a secure password reset link has been dispatched.
              </p>
              <div className="pt-4">
                <Link
                  href="/auth/login"
                  className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700"
                >
                  Return to Sign In
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm transition focus:border-cyan-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:bg-slate-900 pl-10"
                  />
                  <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 py-3 text-sm font-bold text-slate-950 shadow-md shadow-cyan-500/20 transition hover:from-cyan-400 hover:to-teal-400 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending Recovery Link...</span>
                  </>
                ) : (
                  <span>Send Reset Link</span>
                )}
              </button>

              <div className="text-center pt-3 text-xs text-slate-500">
                Remember your password?{' '}
                <Link href="/auth/login" className="font-semibold text-cyan-600 dark:text-cyan-400 hover:underline">
                  Sign in
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
