'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { authApi } from '@/lib/api';
import { Alert } from '@/components/ui';
import { extractApiError } from '@/lib/utils';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { ArrowLeft, Sun, Moon, Lock, ShieldCheck, Sparkles, Loader2 } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, hasHydrated, setAuth } = useAuthStore();
  const { theme, toggleTheme } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [twoFA, setTwoFA] = useState<{ partialToken: string } | null>(null);
  const [code2FA, setCode2FA] = useState('');

  // Auto-redirect if user already has an active authenticated session
  useEffect(() => {
    if (hasHydrated && isAuthenticated) {
      const redirect = searchParams.get('redirect') || '/dashboard';
      router.replace(redirect);
    }
  }, [hasHydrated, isAuthenticated, router, searchParams]);

  if (hasHydrated && isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
            Redirecting to your dashboard...
          </p>
        </div>
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await authApi.login(email.trim().toLowerCase(), password);
      const result = data.data;

      if (result.requires2FA) {
        setTwoFA({ partialToken: result.partialToken });
        return;
      }

      setAuth(result.user, result.accessToken, result.refreshToken);
      toast.success('Welcome back!');
      const redirect = searchParams.get('redirect') || '/dashboard';
      router.push(redirect);
    } catch (err: any) {
      setError(extractApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handle2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await authApi.verify2FA(twoFA!.partialToken, code2FA);
      const result = data.data;
      const meRes = await authApi.me();
      setAuth(meRes.data.data, result.accessToken, result.refreshToken);
      toast.success('Welcome back!');
      const redirect = searchParams.get('redirect') || '/dashboard';
      router.push(redirect);
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
          href="/"
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white/80 px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur transition hover:border-slate-300 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to SysMaira</span>
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
          <Link href="/" className="inline-flex items-center justify-center mb-4 group" aria-label="SysMaira Home">
            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-900/5 dark:bg-white/5 border border-slate-200/50 dark:border-white/10 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform p-1">
              <Image
                src="/images/Sysmaira AI Solutions Logo.webp"
                alt="SysMaira AI Solutions"
                width={64}
                height={64}
                className="w-full h-full object-contain"
                priority
              />
            </div>
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            SysMaira Console
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Enterprise Client &amp; Engineering Portal
          </p>
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900/90 dark:shadow-2xl">
          {!twoFA ? (
            <>
              {error && <Alert type="error" className="mb-4">{error}</Alert>}
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label htmlFor="login-email" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Email Address
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    required
                    autoFocus
                    className="w-full rounded-xl border border-slate-300 bg-slate-50/60 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-1 focus:ring-cyan-500 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:bg-slate-900"
                  />
                </div>

                <div>
                  <label htmlFor="login-password" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Password
                  </label>
                  <input
                    id="login-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full rounded-xl border border-slate-300 bg-slate-50/60 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-1 focus:ring-cyan-500 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:bg-slate-900"
                  />
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600 dark:text-slate-400">
                    <input type="checkbox" className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500" />
                    <span>Remember this device</span>
                  </label>
                  <Link
                    href="/auth/forgot-password"
                    className="font-semibold text-cyan-600 hover:text-cyan-500 dark:text-cyan-400 dark:hover:text-cyan-300 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  aria-busy={loading}
                  className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 py-3 text-sm font-bold text-slate-950 shadow-md shadow-cyan-500/20 transition hover:from-cyan-400 hover:to-teal-400 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{loading ? 'Signing in...' : 'Sign In to Console'}</span>
                </button>
              </form>

              <div className="mt-6 border-t border-slate-100 pt-5 text-center text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
                Need an enterprise account?{' '}
                <Link href="/auth/register" className="font-semibold text-cyan-600 hover:underline dark:text-cyan-400">
                  Register Organization
                </Link>
              </div>
            </>
          ) : (
            <>
              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-2xl bg-cyan-100 text-cyan-700 border border-cyan-300 flex items-center justify-center mx-auto mb-3 dark:bg-cyan-950/80 dark:text-cyan-400 dark:border-cyan-500/30">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Two-Factor Authentication</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Enter the 6-digit code from your authenticator app</p>
              </div>

              {error && <Alert type="error" className="mb-4">{error}</Alert>}

              <form onSubmit={handle2FA} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Authentication Code
                  </label>
                  <input
                    value={code2FA}
                    onChange={(e) => setCode2FA(e.target.value)}
                    placeholder="000000"
                    maxLength={6}
                    autoFocus
                    className="w-full rounded-xl border border-slate-300 bg-slate-50/60 px-4 py-2.5 text-center font-mono text-lg tracking-widest text-slate-900 placeholder-slate-400 outline-none transition focus:border-cyan-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100 dark:focus:bg-slate-900"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 py-3 text-sm font-bold text-slate-950 shadow-md transition hover:from-cyan-400 hover:to-teal-400 disabled:opacity-50 cursor-pointer"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Verify Credentials</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTwoFA(null)}
                  className="w-full text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition cursor-pointer"
                >
                  &larr; Back to login
                </button>
              </form>
            </>
          )}
        </div>

        {/* Security badge footer */}
        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Lock className="w-3.5 h-3.5 text-emerald-500" />
          <span>TLS 1.3 256-bit Encrypted Session • SOC2 Audited</span>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="w-8 h-8 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
