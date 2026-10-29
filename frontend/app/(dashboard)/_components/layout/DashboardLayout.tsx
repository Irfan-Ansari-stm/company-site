'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAuthStore } from '@/store/auth';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { Loader2 } from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}

export function DashboardLayout({ children, title, breadcrumbs }: DashboardLayoutProps) {
  const { user, isAuthenticated, hasHydrated, setHasHydrated, setUser, logout } = useAuthStore();
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    // 1. Strict Dashboard Isolation: clean public dark theme classes from root/body
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }

    // 2. Ensure Zustand hydration is marked
    if (!hasHydrated) {
      setHasHydrated(true);
    }

    // 3. Check authentication status
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

    if (!token && !isAuthenticated) {
      setCheckingAuth(false);
      router.replace('/auth/login');
      return;
    }

    // If token exists but user state is pending, verify session with backend
    if (token && !user) {
      authApi.me()
        .then((res) => {
          if (res.data?.data) {
            setUser(res.data.data);
            useAuthStore.setState({ isAuthenticated: true, accessToken: token });
          } else {
            logout();
            router.replace('/auth/login');
          }
        })
        .catch(() => {
          logout();
          router.replace('/auth/login');
        })
        .finally(() => {
          setCheckingAuth(false);
        });
      return;
    }

    setCheckingAuth(false);
  }, [hasHydrated, isAuthenticated, user, setHasHydrated, setUser, logout, router]);

  // Prevent blank screen while auth is verifying or redirecting
  if (checkingAuth || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-sm font-semibold text-slate-600">
            {isAuthenticated ? 'Loading dashboard...' : 'Redirecting to sign in...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <Header title={title} breadcrumbs={breadcrumbs} />
      <main className="ml-64 pt-16 min-h-screen">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
