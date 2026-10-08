'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { authApi } from '@/lib/api';
import { Button, Input, Alert } from '@/components/ui';
import { extractApiError } from '@/lib/utils';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [twoFA, setTwoFA] = useState<{ partialToken: string } | null>(null);
  const [code2FA, setCode2FA] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await authApi.login(email, password);
      const result = data.data;

      if (result.requires2FA) {
        setTwoFA({ partialToken: result.partialToken });
        return;
      }

      setAuth(result.user, result.accessToken, result.refreshToken);
      toast.success('Welcome back!');
      router.push('/dashboard');
    } catch (err: any) {
      setError(extractApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handle2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await authApi.verify2FA(twoFA!.partialToken, code2FA);
      const result = data.data;
      const meRes = await authApi.me();
      setAuth(meRes.data.data, result.accessToken, result.refreshToken);
      toast.success('Welcome back!');
      router.push('/dashboard');
    } catch (err: any) {
      setError(extractApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-2xl">
            <span className="text-white font-bold text-2xl">E</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Enterprise Platform</h1>
          <p className="text-slate-400 mt-2">Sign in to your account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {!twoFA ? (
            <>
              {error && <Alert type="error" className="mb-4">{error}</Alert>}
              <form onSubmit={handleLogin} className="space-y-4">
                <Input
                  label="Email address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  autoFocus
                />
                <Input
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded" />
                    <span className="text-slate-600">Remember me</span>
                  </label>
                  <Link href="/auth/forgot-password" className="text-blue-600 hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <Button type="submit" className="w-full" loading={loading}>
                  Sign In
                </Button>
              </form>
              <p className="text-center text-sm text-slate-500 mt-6">
                Don&apos;t have an account?{' '}
                <Link href="/auth/register" className="text-blue-600 hover:underline font-medium">
                  Register
                </Link>
              </p>
            </>
          ) : (
            <>
              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-slate-900">Two-Factor Authentication</h2>
                <p className="text-sm text-slate-500">Enter the code from your authenticator app</p>
              </div>
              {error && <Alert type="error" className="mb-4">{error}</Alert>}
              <form onSubmit={handle2FA} className="space-y-4">
                <Input
                  label="6-digit code"
                  value={code2FA}
                  onChange={(e) => setCode2FA(e.target.value)}
                  placeholder="000000"
                  maxLength={6}
                  autoFocus
                />
                <Button type="submit" className="w-full" loading={loading}>Verify</Button>
                <button type="button" onClick={() => setTwoFA(null)} className="w-full text-sm text-slate-500 hover:text-slate-700">← Back to login</button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
