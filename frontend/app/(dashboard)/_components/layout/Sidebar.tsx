'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth';
import { Avatar } from '@/components/ui';
import {
  LayoutDashboard, Users, Briefcase, FolderKanban, DollarSign,
  HeadphonesIcon, UserCheck, FileText, Globe, Image, BarChart3,
  Settings, Megaphone, Bot, LogOut, Building2, ChevronRight,
  PieChart, Clock, FileSpreadsheet
} from 'lucide-react';

const NAV_GROUPS = [
  {
    label: 'Main',
    items: [
      { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { href: '/dashboard/analytics', icon: BarChart3, label: 'Analytics' },
    ],
  },
  {
    label: 'Sales & CRM',
    items: [
      { href: '/dashboard/crm', icon: PieChart, label: 'CRM' },
      { href: '/dashboard/clients', icon: Building2, label: 'Clients' },
    ],
  },
  {
    label: 'Work',
    items: [
      { href: '/dashboard/projects', icon: FolderKanban, label: 'Projects' },
      { href: '/dashboard/projects/tasks', icon: Briefcase, label: 'Tasks' },
      { href: '/dashboard/projects/time', icon: Clock, label: 'Time Tracking' },
    ],
  },
  {
    label: 'Finance',
    items: [
      { href: '/dashboard/finance', icon: DollarSign, label: 'Finance' },
      { href: '/dashboard/finance/invoices', icon: FileSpreadsheet, label: 'Invoices' },
    ],
  },
  {
    label: 'Support & HR',
    items: [
      { href: '/dashboard/support', icon: HeadphonesIcon, label: 'Support' },
      { href: '/dashboard/hr', icon: UserCheck, label: 'HR & Recruitment' },
    ],
  },
  {
    label: 'Content',
    items: [
      { href: '/dashboard/blog', icon: FileText, label: 'Blog' },
      { href: '/dashboard/cms', icon: Globe, label: 'CMS' },
      { href: '/dashboard/portfolio', icon: Image, label: 'Portfolio' },
      { href: '/dashboard/services', icon: Briefcase, label: 'Services' },
      { href: '/dashboard/marketing', icon: Megaphone, label: 'Marketing' },
    ],
  },
  {
    label: 'Tools',
    items: [
      { href: '/dashboard/ai', icon: Bot, label: 'AI Assistant' },
      { href: '/dashboard/media', icon: Image, label: 'Media Library' },
      { href: '/dashboard/users', icon: Users, label: 'Users' },
      { href: '/dashboard/system', icon: Settings, label: 'System' },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  const isActive = (href: string) =>
    href === '/dashboard'
      ? pathname === '/dashboard'
      : pathname.startsWith(href);

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-slate-900 flex flex-col z-30 overflow-hidden">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">E</span>
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">Enterprise</p>
            <p className="text-slate-400 text-xs">Platform</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-4">
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider px-3 mb-1">
              {group.label}
            </p>
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all mb-0.5',
                    active
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  )}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User */}
      {user && (
        <div className="border-t border-slate-700/50 p-4">
          <div className="flex items-center gap-3">
            <Avatar src={user.avatar_url} name={user.display_name} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{user.display_name}</p>
              <p className="text-slate-400 text-xs capitalize">{user.role}</p>
            </div>
            <button
              onClick={() => { logout(); window.location.href = '/auth/login'; }}
              className="text-slate-400 hover:text-white p-1 rounded"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
