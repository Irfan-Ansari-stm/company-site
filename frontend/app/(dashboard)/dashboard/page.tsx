'use client';

import { DashboardLayout } from '@/app/(dashboard)/_components/layout/DashboardLayout';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { StatCard, Card, CardHeader, CardTitle, PageLoader, StatusBadge, Badge, Button } from '@/components/ui';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi, projectsApi, financeApi, supportApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { formatCurrency, formatDate, timeAgo } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import {
  DollarSign, FolderKanban, HeadphonesIcon, TrendingUp, Activity,
  Briefcase, CheckCircle, Clock, ShieldAlert, ArrowRight, LifeBuoy, FileText
} from 'lucide-react';
import Link from 'next/link';

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function DashboardPage() {
  const { user, isSuperAdmin, hasPermission, isClientPreview, canAccessWidget } = useAuthStore();
  const isClient = user?.role === 'client' || isClientPreview;
  const canViewAnalytics = hasPermission('analytics.read');

  // Analytics dashboard query (only for staff / users with analytics.read)
  const {
    data: analytics,
    isLoading: analyticsLoading,
    isError: analyticsError,
    refetch: refetchAnalytics,
  } = useQuery({
    queryKey: ['analytics-dashboard'],
    queryFn: () => analyticsApi.dashboard().then((r) => r.data.data),
    enabled: canViewAnalytics,
  });

  // Invoice summary query (Clients see their own summary, admins see global)
  const {
    data: invoiceSummary,
    isLoading: invoiceLoading,
    isError: invoiceError,
    refetch: refetchInvoice,
  } = useQuery({
    queryKey: ['invoice-summary'],
    queryFn: () => financeApi.getInvoiceSummary().then((r) => r.data.data),
    enabled: hasPermission('invoice.read'),
  });

  // Revenue report (financial staff only)
  const {
    data: revenueData,
    isLoading: revenueLoading,
    isError: revenueError,
    refetch: refetchRevenue,
  } = useQuery({
    queryKey: ['revenue-report'],
    queryFn: () => financeApi.getRevenueReport().then((r) => r.data.data),
    enabled: hasPermission('billing.read') || isSuperAdmin(),
  });

  // Overdue invoices
  const {
    data: overdueInvoices,
    isLoading: overdueLoading,
    isError: overdueError,
    refetch: refetchOverdue,
  } = useQuery({
    queryKey: ['overdue-invoices'],
    queryFn: () => financeApi.getOverdueInvoices().then((r) => r.data.data),
    enabled: hasPermission('invoice.read'),
  });

  // Projects list
  const {
    data: projectsData,
    isLoading: projectsLoading,
    isError: projectsError,
    refetch: refetchProjects,
  } = useQuery({
    queryKey: ['projects-list', { limit: 5 }],
    queryFn: () => projectsApi.list({ limit: 5 }).then((r) => r.data),
    enabled: hasPermission('project.read'),
  });

  // My Tasks
  const {
    data: myTasks,
    isLoading: tasksLoading,
    isError: tasksError,
    refetch: refetchTasks,
  } = useQuery({
    queryKey: ['my-tasks'],
    queryFn: () => import('@/lib/api').then((m) => m.tasksApi.myTasks()).then((r) => r.data.data),
  });

  // Support Ticket Stats
  const {
    data: ticketStats,
    isLoading: ticketLoading,
    isError: ticketError,
    refetch: refetchTickets,
  } = useQuery({
    queryKey: ['ticket-stats'],
    queryFn: () => supportApi.getTicketStats().then((r) => r.data.data),
    enabled: hasPermission('ticket.read'),
  });

  // Realtime traffic (admin only)
  const { data: realtimeData } = useQuery({
    queryKey: ['realtime'],
    queryFn: () => analyticsApi.realtime().then((r) => r.data.data),
    enabled: canViewAnalytics,
    refetchInterval: 30000,
  });

  if (canViewAnalytics && analyticsLoading) {
    return (
      <DashboardLayout title="Dashboard">
        <PageLoader />
      </DashboardLayout>
    );
  }

  const summary = analytics?.summary || {};
  const pageViewsByDate = analytics?.page_views_by_date || [];
  const leadPipeline = analytics?.lead_pipeline || [];

  return (
    <DashboardLayout title={isClient ? 'Client Portal' : 'Dashboard'}>
      <div className="space-y-6">
        {/* Client Welcome Banner */}
        {isClient && (
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">
                Welcome back, {user?.first_name || user?.display_name || 'Client'}!
              </h2>
              <p className="text-blue-100 text-sm mt-1 max-w-xl">
                Track your ongoing projects, view invoices and payments, submit support tickets, and request new digital services.
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <Link href="/dashboard/support">
                <Button variant="secondary" size="sm" icon={<HeadphonesIcon className="w-4 h-4" />}>
                  Support Tickets
                </Button>
              </Link>
              <Link href="/dashboard/projects">
                <Button size="sm" className="bg-white/10 hover:bg-white/20 text-white border-white/20" icon={<FolderKanban className="w-4 h-4" />}>
                  My Projects
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* KPI Row (Permission & Role Adaptive) */}
        {canAccessWidget('overview', 'kpi_summary') && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* For Admin/SuperAdmin: Total Revenue. For Client: Total Invoiced/Paid */}
            {hasPermission('invoice.read') && (
              <StatCard
                title={isClient ? 'Paid Invoices' : 'Total Revenue'}
                value={invoiceError ? 'Unavailable' : invoiceLoading ? '...' : formatCurrency(invoiceSummary?.total_collected || 0)}
                subtitle={invoiceError ? 'Failed to load' : `${invoiceSummary?.paid_count || 0} invoices settled`}
                icon={<DollarSign className="w-5 h-5" />}
                color="green"
              />
            )}

            {/* Active Projects */}
            {hasPermission('project.read') && (
              <StatCard
                title={isClient ? 'My Projects' : 'Active Projects'}
                value={projectsError ? 'Unavailable' : projectsLoading ? '...' : projectsData?.total || 0}
                subtitle={projectsError ? 'Failed to load' : 'In progress'}
                icon={<FolderKanban className="w-5 h-5" />}
                color="blue"
              />
            )}

            {/* Support Tickets */}
            {hasPermission('ticket.read') && (
              <StatCard
                title={isClient ? 'My Tickets' : 'Open Tickets'}
                value={ticketError ? 'Unavailable' : ticketLoading ? '...' : ticketStats?.open_count || 0}
                subtitle={ticketError ? 'Failed to load' : (isClient ? 'Awaiting response' : `${ticketStats?.resolved_today || 0} resolved today`)}
                icon={<HeadphonesIcon className="w-5 h-5" />}
                color="orange"
              />
            )}

            {/* 4th KPI: Page Views for Staff / My Tasks for Client */}
            {!isClient && canViewAnalytics ? (
              <StatCard
                title="Page Views (30d)"
                value={analyticsError ? 'Unavailable' : analyticsLoading ? '...' : (summary?.page_views?.toLocaleString() || '0')}
                subtitle={analyticsError ? 'Failed to load' : `${summary?.unique_visitors || 0} unique visitors`}
                icon={<TrendingUp className="w-5 h-5" />}
                color="purple"
              />
            ) : (
              <StatCard
                title="Assigned Tasks"
                value={tasksError ? 'Unavailable' : tasksLoading ? '...' : (myTasks?.length || 0)}
                subtitle={tasksError ? 'Failed to load' : 'Active action items'}
                icon={<CheckCircle className="w-5 h-5" />}
                color="purple"
              />
            )}
          </div>
        )}

        {/* Analytics & Traffic Charts (Protected for Admin / Staff) */}
        <PermissionGate permission="analytics.read">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2" padding={false}>
              <div className="p-6 pb-0">
                <CardHeader>
                  <CardTitle>Website Traffic (30 days)</CardTitle>
                  {realtimeData && (
                    <Badge variant="success">
                      <Activity className="w-3 h-3 mr-1 inline" />
                      {realtimeData.active_sessions} live
                    </Badge>
                  )}
                </CardHeader>
              </div>
              <div className="px-2 pb-4 h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={pageViewsByDate.slice(-30)}>
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: any) => [Number(v).toLocaleString(), 'Views']} />
                    <Line type="monotone" dataKey="views" stroke="#3b82f6" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card padding={false}>
              <div className="p-6 pb-0">
                <CardTitle>Lead Pipeline</CardTitle>
              </div>
              <div className="px-2 pb-4 h-52 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={leadPipeline}
                      dataKey="count"
                      nameKey="stage"
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      label={({ stage, count }: any) => `${stage}: ${count}`}
                    >
                      {leadPipeline.map((_: any, i: number) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </PermissionGate>

        {/* Revenue Chart (Protected for Billing / Finance) */}
        <PermissionGate permission="billing.read">
          {revenueData && revenueData.length > 0 && (
            <Card padding={false}>
              <div className="p-6 pb-0">
                <CardTitle>Monthly Revenue</CardTitle>
              </div>
              <div className="px-2 pb-4 h-48 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueData.slice(0, 12).reverse()}>
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} tickFormatter={(v) => v?.slice(0, 7)} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => '$' + (v / 1000).toFixed(0) + 'k'} />
                    <Tooltip formatter={(v: any) => [formatCurrency(v), 'Revenue']} />
                    <Bar dataKey="invoiced" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Invoiced" />
                    <Bar dataKey="collected" fill="#22c55e" radius={[4, 4, 0, 0]} name="Collected" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}
        </PermissionGate>

        {/* Bottom row: Projects, Tasks, and Invoices */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Projects */}
          {hasPermission('project.read') && (
            <Card padding={false}>
              <div className="p-4 pb-0">
                <CardHeader>
                  <CardTitle>{isClient ? 'My Active Projects' : 'Recent Projects'}</CardTitle>
                  <Link href="/dashboard/projects" className="text-xs text-blue-600 hover:underline">
                    View all
                  </Link>
                </CardHeader>
              </div>
              <div className="divide-y divide-slate-100">
                {projectsData?.data?.slice(0, 5).map((p: any) => (
                  <Link
                    key={p.id}
                    href={`/dashboard/projects/${p.id}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{p.name}</p>
                      <p className="text-xs text-slate-500">{p.client_name}</p>
                    </div>
                    <div className="text-right">
                      <StatusBadge status={p.status} />
                      <p className="text-xs text-slate-500 mt-0.5">{p.progress_percent || 0}%</p>
                    </div>
                  </Link>
                ))}
                {!projectsData?.data?.length && (
                  <p className="text-center text-slate-500 text-sm py-6">No projects yet</p>
                )}
              </div>
            </Card>
          )}

          {/* My Tasks */}
          <Card padding={false}>
            <div className="p-4 pb-0">
              <CardHeader>
                <CardTitle>My Tasks</CardTitle>
                <Link href="/dashboard/projects/tasks" className="text-xs text-blue-600 hover:underline">
                  View all
                </Link>
              </CardHeader>
            </div>
            <div className="divide-y divide-slate-100">
              {myTasks?.slice(0, 5).map((t: any) => (
                <div key={t.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{t.title}</p>
                    <p className="text-xs text-slate-500">{t.project_code}</p>
                  </div>
                  <StatusBadge status={t.priority} />
                </div>
              ))}
              {!myTasks?.length && (
                <p className="text-center text-slate-500 text-sm py-6">No tasks assigned</p>
              )}
            </div>
          </Card>

          {/* Invoices List */}
          {hasPermission('invoice.read') && (
            <Card padding={false}>
              <div className="p-4 pb-0">
                <CardHeader>
                  <CardTitle>{isClient ? 'My Invoices' : 'Overdue Invoices'}</CardTitle>
                  <Link href="/dashboard/finance/invoices" className="text-xs text-blue-600 hover:underline">
                    View all
                  </Link>
                </CardHeader>
              </div>
              <div className="divide-y divide-slate-100">
                {overdueInvoices?.slice(0, 5).map((inv: any) => (
                  <div key={inv.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{inv.invoice_number}</p>
                      <p className="text-xs text-slate-500">{inv.client_name || 'Direct Billing'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-900">{formatCurrency(inv.total_amount)}</p>
                      <p className="text-xs text-red-500 font-medium">{formatDate(inv.due_date)}</p>
                    </div>
                  </div>
                ))}
                {!overdueInvoices?.length && (
                  <p className="text-center text-slate-500 text-sm py-6">No pending overdue invoices</p>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
