'use client';

import { useAuthStore } from '@/store/auth';
import { notificationsApi } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { Bell, Search, Menu } from 'lucide-react';
import { Avatar } from '@/components/ui';
import Link from 'next/link';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface HeaderProps {
  title?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  onMenuClick?: () => void;
}

export function Header({ title, breadcrumbs, onMenuClick }: HeaderProps) {
  const { user } = useAuthStore();
  const [showNotifs, setShowNotifs] = useState(false);

  const { data: countData } = useQuery({
    queryKey: ['notif-count'],
    queryFn: () => notificationsApi.count().then(r => r.data.data),
    refetchInterval: 30000,
    enabled: !!user,
  });

  const { data: notifsData } = useQuery({
    queryKey: ['notifs-preview'],
    queryFn: () => notificationsApi.list({ limit: 5, is_read: false }).then(r => r.data),
    enabled: showNotifs && !!user,
  });

  return (
    <header className="fixed top-0 left-0 lg:left-64 right-0 h-16 bg-white border-b border-slate-200 flex items-center px-4 sm:px-6 z-20 gap-3 sm:gap-4 transition-all">
      {/* Mobile Hamburger Menu Toggle */}
      {onMenuClick && (
        <button
          type="button"
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors -ml-1"
          aria-label="Open navigation sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}

      {/* Breadcrumb / Title */}
      <div className="flex-1 min-w-0">
        {breadcrumbs ? (
          <nav className="flex items-center gap-1 text-sm text-slate-500">
            {breadcrumbs.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <span>/</span>}
                {crumb.href ? (
                  <Link href={crumb.href} className="hover:text-slate-800">{crumb.label}</Link>
                ) : (
                  <span className={cn(i === breadcrumbs.length - 1 && 'text-slate-900 font-medium')}>{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>
        ) : (
          <h1 className="text-lg font-semibold text-slate-900 truncate">{title}</h1>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="relative w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-600"
          >
            <Bell className="w-5 h-5" />
            {countData?.count > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
                {countData.count > 9 ? '9+' : countData.count}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 top-12 w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-50">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <p className="font-semibold text-slate-900 text-sm">Notifications</p>
                <Link href="/dashboard/notifications" className="text-blue-600 text-xs hover:underline">View all</Link>
              </div>
              <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                {notifsData?.data?.length === 0 ? (
                  <p className="text-center text-slate-500 text-sm py-6">No new notifications</p>
                ) : notifsData?.data?.map((n: any) => (
                  <div key={n.id} className={cn('px-4 py-3 hover:bg-slate-50', !n.is_read && 'bg-blue-50/30')}>
                    <p className="text-sm text-slate-800 font-medium">{n.title || n.message}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{n.created_at}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <Link href="/dashboard/profile" className="flex items-center gap-2 hover:bg-slate-50 rounded-lg px-2 py-1 transition-colors">
          <Avatar src={user?.avatar_url} name={user?.display_name} size="sm" />
          <div className="hidden md:block">
            <p className="text-sm font-medium text-slate-900 leading-tight">{user?.display_name}</p>
            <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
          </div>
        </Link>
      </div>
    </header>
  );
}
