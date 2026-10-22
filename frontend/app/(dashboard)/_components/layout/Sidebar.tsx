'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth';
import { authApi } from '@/lib/api';
import { Avatar } from '@/components/ui';
import {
  LayoutDashboard, Users, Briefcase, FolderKanban, DollarSign,
  HeadphonesIcon, UserCheck, FileText, Globe, Image, BarChart3,
  Settings, Megaphone, Bot, LogOut, Building2, Shield,
  PieChart, Clock, FileSpreadsheet, Sliders, History, EyeOff
} from 'lucide-react';

interface NavItem {
  href: string;
  icon: any;
  label: string;
  moduleKey?: string;
  permission?: string;
  superAdminOnly?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Main',
    items: [
      { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', moduleKey: 'overview', permission: 'dashboard.view' },
      { href: '/dashboard/analytics', icon: BarChart3, label: 'Analytics', moduleKey: 'analytics', permission: 'analytics.read' },
    ],
  },
  {
    label: 'Sales & CRM',
    items: [
      { href: '/dashboard/crm', icon: PieChart, label: 'CRM', moduleKey: 'crm', permission: 'lead.read' },
      { href: '/dashboard/clients', icon: Building2, label: 'Clients', moduleKey: 'clients', permission: 'client.read' },
    ],
  },
  {
    label: 'Work',
    items: [
      { href: '/dashboard/projects', icon: FolderKanban, label: 'Projects', moduleKey: 'projects', permission: 'project.read' },
      { href: '/dashboard/projects/tasks', icon: Briefcase, label: 'Tasks', moduleKey: 'projects', permission: 'task.read' },
      { href: '/dashboard/projects/time', icon: Clock, label: 'Time Tracking', moduleKey: 'projects', permission: 'project.read' },
    ],
  },
  {
    label: 'Finance',
    items: [
      { href: '/dashboard/finance', icon: DollarSign, label: 'Finance', moduleKey: 'finance', permission: 'invoice.read' },
      { href: '/dashboard/finance/invoices', icon: FileSpreadsheet, label: 'Invoices', moduleKey: 'finance', permission: 'invoice.read' },
    ],
  },
  {
    label: 'Support & HR',
    items: [
      { href: '/dashboard/support', icon: HeadphonesIcon, label: 'Support', moduleKey: 'support', permission: 'ticket.read' },
      { href: '/dashboard/hr', icon: UserCheck, label: 'HR & Recruitment', moduleKey: 'hr', permission: 'application.read' },
    ],
  },
  {
    label: 'Content',
    items: [
      { href: '/dashboard/blog', icon: FileText, label: 'Blog', moduleKey: 'blog', permission: 'post.write' },
      { href: '/dashboard/cms', icon: Globe, label: 'CMS', moduleKey: 'cms', permission: 'page.edit' },
      { href: '/dashboard/portfolio', icon: Image, label: 'Portfolio', moduleKey: 'portfolio', permission: 'portfolio.manage' },
      { href: '/dashboard/services', icon: Briefcase, label: 'Services', moduleKey: 'services', permission: 'service.manage' },
      { href: '/dashboard/marketing', icon: Megaphone, label: 'Marketing', moduleKey: 'marketing', permission: 'campaign.manage' },
    ],
  },
  {
    label: 'Access & Control',
    items: [
      { href: '/dashboard/roles', icon: Shield, label: 'Roles & Permissions', moduleKey: 'roles', permission: 'role.manage', superAdminOnly: true },
      { href: '/dashboard/client-access', icon: Sliders, label: 'Client Access Control', moduleKey: 'system', permission: 'client.access.manage', superAdminOnly: true },
      { href: '/dashboard/audit-logs', icon: History, label: 'Audit Logs', moduleKey: 'system', permission: 'audit.read', superAdminOnly: true },
    ],
  },
  {
    label: 'Tools & Settings',
    items: [
      { href: '/dashboard/ai', icon: Bot, label: 'AI Assistant', moduleKey: 'ai', permission: 'ai.manage' },
      { href: '/dashboard/media', icon: Image, label: 'Media Library', moduleKey: 'media', permission: 'media.manage' },
      { href: '/dashboard/users', icon: Users, label: 'Users', moduleKey: 'users', permission: 'user.read' },
      { href: '/dashboard/system', icon: Settings, label: 'System Settings', moduleKey: 'system', permission: 'settings.manage' },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const {
    user,
    logout,
    isSuperAdmin,
    hasPermission,
    canAccessModule,
    clientModules,
    setClientModules,
    isClientPreview,
    setClientPreview,
  } = useAuthStore();

  // Load client modules configuration to keep client navigation fresh
  useEffect(() => {
    authApi
      .getClientConfig()
      .then((res) => {
        if (res.data?.data) {
          setClientModules(res.data.data);
        }
      })
      .catch(() => {});
  }, [setClientModules]);

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href);

  // Check if a navigation item is permitted for current user / preview state
  const isItemVisible = (item: NavItem): boolean => {
    // If in preview mode, simulate client view strictly
    if (isClientPreview) {
      if (item.superAdminOnly) return false;
      if (item.moduleKey) {
        const mod = clientModules.find((m) => m.key === item.moduleKey);
        return mod?.is_client_enabled ?? false;
      }
      return false;
    }

    // Sole Super Admin sees all navigation items
    if (isSuperAdmin()) {
      return true;
    }

    // Super Admin only routes are hidden for all other users
    if (item.superAdminOnly) {
      return false;
    }

    // Client user view: check enabled client modules
    if (user?.role === 'client') {
      if (item.moduleKey) {
        const mod = clientModules.find((m) => m.key === item.moduleKey);
        return mod?.is_client_enabled ?? false;
      }
      return false;
    }

    // Other staff / custom roles: check permission or module access
    if (item.permission && !hasPermission(item.permission)) {
      return false;
    }

    if (item.moduleKey && !canAccessModule(item.moduleKey)) {
      return false;
    }

    return true;
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-slate-900 flex flex-col z-30 overflow-hidden border-r border-slate-800">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-sm">E</span>
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">Enterprise</p>
            <p className="text-slate-400 text-xs">
              {isClientPreview
                ? 'Client Preview'
                : isSuperAdmin()
                ? 'Super Admin Portal'
                : user?.role === 'client'
                ? 'Client Portal'
                : 'Workspace'}
            </p>
          </div>
        </div>
      </div>

      {/* Client Preview Mode Warning Banner */}
      {isClientPreview && (
        <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2.5 flex items-center justify-between text-xs text-amber-300">
          <div className="flex items-center gap-2">
            <EyeOff className="w-3.5 h-3.5 flex-shrink-0 text-amber-400" />
            <span className="font-semibold">Client Preview</span>
          </div>
          <button
            onClick={() => setClientPreview(false)}
            className="px-2 py-0.5 bg-amber-500 text-slate-900 rounded font-bold hover:bg-amber-400 transition"
          >
            Exit
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-4">
        {NAV_GROUPS.map((group) => {
          const visibleItems = group.items.filter(isItemVisible);
          if (!visibleItems.length) return null;

          return (
            <div key={group.label}>
              <p className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider px-3 mb-1.5">
                {group.label}
              </p>
              {visibleItems.map((item) => {
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
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* User Card */}
      {user && (
        <div className="border-t border-slate-800 p-4 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <Avatar src={user.avatar_url} name={user.display_name} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{user.display_name}</p>
              <div className="flex items-center gap-1.5">
                <span
                  className={cn(
                    'text-[10px] px-1.5 py-0.2 rounded font-semibold uppercase',
                    isSuperAdmin()
                      ? 'bg-amber-400/20 text-amber-300'
                      : user.role === 'client'
                      ? 'bg-emerald-400/20 text-emerald-300'
                      : 'bg-blue-400/20 text-blue-300'
                  )}
                >
                  {isClientPreview ? 'Client (Preview)' : user.role.replace('_', ' ')}
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                logout();
                window.location.href = '/auth/login';
              }}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
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

export default Sidebar;
