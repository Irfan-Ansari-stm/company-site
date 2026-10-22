'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { Alert } from '@/components/ui';
import { extractApiError } from '@/lib/utils';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { ArrowLeft, Sun, Moon, Lock, ShieldCheck, Sparkles, Loader2 } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

export default function RegisterPage() {
  const router = useRouter();
  const { isAuthenticated, hasHydrated, setAuth } = useAuthStore();
  const { theme, toggleTheme } = useTheme();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    phone: '',
  });

  // Auto-redirect if user already has an active authenticated session
  useEffect(() => {
    if (hasHydrated && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [hasHydrated, isAuthenticated, router]);

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

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await authApi.register(form);
      const result = data.data;
      setAuth(result.user, result.accessToken, result.refreshToken);
      toast.success('Account created!');
      router.push('/dashboard');
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
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 via-teal-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
              <span className="text-slate-950 font-black text-2xl tracking-tighter">S</span>
            </div>
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Register Organization
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Create your SysMaira Enterprise credentials
          </p>
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900/90 dark:shadow-2xl">
          {error && <Alert type="error" className="mb-4">{error}</Alert>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="reg-first-name" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  First Name
                </label>
                <input
                  id="reg-first-name"
                  type="text"
                  required
                  value={form.first_name}
                  onChange={(e) => set('first_name', e.target.value)}
                  placeholder="Alexander"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50/60 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-1 focus:ring-cyan-500 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:bg-slate-900"
                />
              </div>

              <div>
                <label htmlFor="reg-last-name" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Last Name
                </label>
                <input
                  id="reg-last-name"
                  type="text"
                  required
                  value={form.last_name}
                  onChange={(e) => set('last_name', e.target.value)}
                  placeholder="Vance"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50/60 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-1 focus:ring-cyan-500 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:bg-slate-900"
                />
              </div>
            </div>

            <div>
              <label htmlFor="reg-email" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Work Email Address
              </label>
              <input
                id="reg-email"
                type="email"
                required
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                placeholder="alex@enterprise.com"
                className="w-full rounded-xl border border-slate-300 bg-slate-50/60 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-1 focus:ring-cyan-500 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:bg-slate-900"
              />
            </div>

            <div>
              <label htmlFor="reg-phone" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Phone Number (Optional)
              </label>
              <input
                id="reg-phone"
                type="tel"
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full rounded-xl border border-slate-300 bg-slate-50/60 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-1 focus:ring-cyan-500 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:bg-slate-900"
              />
            </div>

            <div>
              <label htmlFor="reg-password" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Password
              </label>
              <input
                id="reg-password"
                type="password"
                required
                value={form.password}
                onChange={(e) => set('password', e.target.value)}
                placeholder="Minimum 8 characters"
                className="w-full rounded-xl border border-slate-300 bg-slate-50/60 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-1 focus:ring-cyan-500 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:bg-slate-900"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 py-3 text-sm font-bold text-slate-950 shadow-md shadow-cyan-500/20 transition hover:from-cyan-400 hover:to-teal-400 disabled:opacity-50 cursor-pointer"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Create Enterprise Account</span>
            </button>
          </form>

          <div className="mt-6 border-t border-slate-100 pt-5 text-center text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
            Already have an account?{' '}
            <Link href="/auth/login" className="font-semibold text-cyan-600 hover:underline dark:text-cyan-400">
              Sign In
            </Link>
          </div>
        </div>

        {/* Security badge footer */}
        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Lock className="w-3.5 h-3.5 text-emerald-500" />
          <span>Strict NDA Protection • Zero Vendor Lock-In</span>
        </div>
      </div>
    </div>
  );
}
