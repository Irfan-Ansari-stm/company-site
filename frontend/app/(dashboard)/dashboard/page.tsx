'use client';

import { DashboardLayout } from '@/app/(dashboard)/_components/layout/DashboardLayout';
import { StatCard, Card, CardHeader, CardTitle, PageLoader, StatusBadge, Badge } from '@/components/ui';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi, projectsApi, financeApi, supportApi, crmApi } from '@/lib/api';
import { formatCurrency, formatDate, timeAgo } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, FolderKanban, Users, HeadphonesIcon, TrendingUp, Activity, AlertCircle } from 'lucide-react';
import Link from 'next/link';

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function DashboardPage() {
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['analytics-dashboard'],
    queryFn: () => analyticsApi.dashboard().then(r => r.data.data),
  });

  const { data: invoiceSummary } = useQuery({
    queryKey: ['invoice-summary'],
    queryFn: () => financeApi.getInvoiceSummary().then(r => r.data.data),
  });

  const { data: revenueData } = useQuery({
    queryKey: ['revenue-report'],
    queryFn: () => financeApi.getRevenueReport().then(r => r.data.data),
  });

  const { data: overdueInvoices } = useQuery({
    queryKey: ['overdue-invoices'],
    queryFn: () => financeApi.getOverdueInvoices().then(r => r.data.data),
  });

  const { data: projectsData } = useQuery({
    queryKey: ['projects-list', { limit: 5 }],
    queryFn: () => projectsApi.list({ limit: 5 }).then(r => r.data),
  });

  const { data: myTasks } = useQuery({
    queryKey: ['my-tasks'],
    queryFn: () => import('@/lib/api').then(m => m.tasksApi.myTasks()).then(r => r.data.data),
  });

  const { data: ticketStats } = useQuery({
    queryKey: ['ticket-stats'],
    queryFn: () => supportApi.getTicketStats().then(r => r.data.data),
  });

  const { data: realtimeData } = useQuery({
    queryKey: ['realtime'],
    queryFn: () => analyticsApi.realtime().then(r => r.data.data),
    refetchInterval: 30000,
  });

  if (analyticsLoading) return <DashboardLayout title="Dashboard"><PageLoader /></DashboardLayout>;

  const summary = analytics?.summary || {};
  const pageViewsByDate = analytics?.page_views_by_date || [];
  const topPages = analytics?.top_pages || [];
  const leadPipeline = analytics?.lead_pipeline || [];

  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-6">
        {/* KPI Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Revenue"
            value={formatCurrency(invoiceSummary?.total_collected || 0)}
            subtitle={`${invoiceSummary?.paid_count || 0} invoices paid`}
            icon={<DollarSign className="w-5 h-5" />}
            color="green"
            trend={{ value: 12, label: 'vs last month' }}
          />
          <StatCard
            title="Active Projects"
            value={projectsData?.total || 0}
            subtitle="In progress"
            icon={<FolderKanban className="w-5 h-5" />}
            color="blue"
          />
          <StatCard
            title="Open Tickets"
            value={ticketStats?.open_count || 0}
            subtitle={`${ticketStats?.resolved_today || 0} resolved today`}
            icon={<HeadphonesIcon className="w-5 h-5" />}
            color="orange"
          />
          <StatCard
            title="Page Views (30d)"
            value={summary?.page_views?.toLocaleString() || '0'}
            subtitle={`${summary?.unique_visitors || 0} unique visitors`}
            icon={<TrendingUp className="w-5 h-5" />}
            color="purple"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Page Views Chart */}
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

          {/* Lead Pipeline */}
          <Card padding={false}>
            <div className="p-6 pb-0">
              <CardTitle>Lead Pipeline</CardTitle>
            </div>
            <div className="px-2 pb-4 h-52 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={leadPipeline} dataKey="count" nameKey="stage" cx="50%" cy="50%" outerRadius={70} label={({ stage, count }: any) => `${stage}: ${count}`}>
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

        {/* Revenue Chart */}
        {revenueData && revenueData.length > 0 && (
          <Card padding={false}>
            <div className="p-6 pb-0">
              <CardTitle>Monthly Revenue</CardTitle>
            </div>
            <div className="px-2 pb-4 h-48 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData.slice(0, 12).reverse()}>
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} tickFormatter={(v) => v?.slice(0, 7)} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => '$' + (v/1000).toFixed(0) + 'k'} />
                  <Tooltip formatter={(v: any) => [formatCurrency(v), 'Revenue']} />
                  <Bar dataKey="invoiced" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Invoiced" />
                  <Bar dataKey="collected" fill="#22c55e" radius={[4, 4, 0, 0]} name="Collected" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        {/* Bottom row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Projects */}
          <Card padding={false}>
            <div className="p-4 pb-0">
              <CardHeader>
                <CardTitle>Recent Projects</CardTitle>
                <Link href="/dashboard/projects" className="text-xs text-blue-600 hover:underline">View all</Link>
              </CardHeader>
            </div>
            <div className="divide-y divide-slate-100">
              {projectsData?.data?.slice(0, 5).map((p: any) => (
                <Link key={p.id} href={`/dashboard/projects/${p.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
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

          {/* My Tasks */}
          <Card padding={false}>
            <div className="p-4 pb-0">
              <CardHeader>
                <CardTitle>My Tasks</CardTitle>
                <Link href="/dashboard/projects/tasks" className="text-xs text-blue-600 hover:underline">View all</Link>
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

          {/* Overdue Invoices */}
          <Card padding={false}>
            <div className="p-4 pb-0">
              <CardHeader>
                <CardTitle>
                  <span className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    Overdue Invoices
                  </span>
                </CardTitle>
                <Link href="/dashboard/finance/invoices?overdue=true" className="text-xs text-blue-600 hover:underline">View all</Link>
              </CardHeader>
            </div>
            <div className="divide-y divide-slate-100">
              {overdueInvoices?.slice(0, 5).map((inv: any) => (
                <Link key={inv.id} href={`/dashboard/finance/invoices/${inv.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800">{inv.invoice_number}</p>
                    <p className="text-xs text-slate-500">{inv.client_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-red-600">{formatCurrency(inv.total_amount)}</p>
                    <p className="text-xs text-slate-500">{formatDate(inv.due_date)}</p>
                  </div>
                </Link>
              ))}
              {!overdueInvoices?.length && (
                <p className="text-center text-slate-500 text-sm py-6">No overdue invoices 🎉</p>
              )}
            </div>
          </Card>
        </div>

        {/* Top Pages */}
        {topPages.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Top Pages</CardTitle>
            </CardHeader>
            <div className="space-y-2">
              {topPages.map((page: any, i: number) => {
                const maxViews = topPages[0]?.views || 1;
                const pct = Math.round((page.views / maxViews) * 100);
                return (
                  <div key={i} className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm text-slate-700 truncate max-w-xs">{page.page_title || page.page_url}</p>
                        <span className="text-sm font-medium text-slate-600 ml-2">{Number(page.views).toLocaleString()}</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full">
                        <div className="h-1.5 bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
