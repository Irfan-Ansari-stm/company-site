'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/app/(dashboard)/_components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, StatCard, PageLoader, Button, EmptyState } from '@/components/ui';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/lib/api';
import { formatNumber } from '@/lib/utils';
import { useAuthStore } from '@/store/auth';
import Link from 'next/link';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, AreaChart, Area
} from 'recharts';
import { TrendingUp, Users, Eye, MousePointer, Clock, Globe, Zap, ShieldAlert, RotateCw } from 'lucide-react';

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const DATE_RANGES = [
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
  { value: 'this_month', label: 'This month' },
  { value: 'prev_month', label: 'Previous month' },
];

export default function AnalyticsPage() {
  const [range, setRange] = useState('30');
  const { user, isSuperAdmin, hasPermission } = useAuthStore();
  const canViewAnalytics = hasPermission('analytics.read') || isSuperAdmin();

  const queryParams = range.includes('month') ? { preset: range } : { days: range };

  const {
    data: dashData,
    isLoading,
    isError: isDashError,
    refetch: refetchDash,
  } = useQuery({
    queryKey: ['analytics-dashboard', range],
    queryFn: () => analyticsApi.dashboard(queryParams).then(r => r.data.data),
    enabled: canViewAnalytics,
  });

  const {
    data: trafficData,
    isLoading: isTrafficLoading,
    isError: isTrafficError,
    refetch: refetchTraffic,
  } = useQuery({
    queryKey: ['traffic-sources', range],
    queryFn: () => analyticsApi.trafficSources(queryParams).then(r => r.data.data),
    enabled: canViewAnalytics,
  });

  const {
    data: conversionData,
    isLoading: isConversionLoading,
    isError: isConversionError,
    refetch: refetchConversion,
  } = useQuery({
    queryKey: ['conversion'],
    queryFn: () => analyticsApi.conversion().then(r => r.data.data),
    enabled: canViewAnalytics,
  });

  const { data: realtimeData } = useQuery({
    queryKey: ['realtime'],
    queryFn: () => analyticsApi.realtime().then(r => r.data.data),
    enabled: canViewAnalytics,
    refetchInterval: 30000,
  });

  // Client / Unauthorized Role Guard
  if (!canViewAnalytics) {
    return (
      <DashboardLayout title="Analytics" breadcrumbs={[{ label: 'Analytics' }]}>
        <div className="py-12">
          <EmptyState
            icon={<ShieldAlert className="w-10 h-10 text-red-500" />}
            title="Access Restricted"
            description="You do not have administrative permission to view organization-wide website analytics."
            action={
              <Link href="/dashboard">
                <Button variant="primary" size="sm">Back to Dashboard</Button>
              </Link>
            }
          />
        </div>
      </DashboardLayout>
    );
  }

  if (isLoading) return <DashboardLayout title="Analytics"><PageLoader /></DashboardLayout>;

  if (isDashError) {
    return (
      <DashboardLayout title="Analytics" breadcrumbs={[{ label: 'Analytics' }]}>
        <div className="py-12">
          <EmptyState
            icon={<ShieldAlert className="w-10 h-10 text-orange-500" />}
            title="Failed to Load Analytics"
            description="We encountered an issue fetching live analytics data from the server."
            action={
              <Button variant="primary" size="sm" icon={<RotateCw className="w-4 h-4" />} onClick={() => refetchDash()}>
                Retry Now
              </Button>
            }
          />
        </div>
      </DashboardLayout>
    );
  }

  const summary = dashData?.summary || {};
  const pageViewsByDate = dashData?.page_views_by_date || [];
  const topPages = dashData?.top_pages || [];
  const topReferrers = dashData?.top_referrers || [];
  const deviceBreakdown = dashData?.device_breakdown || [];
  const countryBreakdown = dashData?.country_breakdown || [];
  const trafficSources = trafficData || [];

  return (
    <DashboardLayout title="Analytics" breadcrumbs={[{ label: 'Analytics' }]}>
      <div className="space-y-6">
        {/* Range selector + realtime */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex flex-wrap gap-2">
            {DATE_RANGES.map(d => (
              <button
                key={d.value}
                onClick={() => setRange(d.value)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-all ${
                  range === d.value
                    ? 'bg-blue-600 text-white font-medium shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
          {realtimeData && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm text-green-800 font-medium">{realtimeData.active_sessions || 0} live visitors</span>
            </div>
          )}
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="Page Views"
            value={formatNumber(summary.page_views || 0)}
            icon={<Eye className="w-5 h-5" />}
            color="blue"
            trend={{ value: summary.page_views_growth || 0, label: 'vs prev' }}
          />
          <StatCard
            title="Unique Visitors"
            value={formatNumber(summary.unique_visitors || 0)}
            icon={<Users className="w-5 h-5" />}
            color="green"
            trend={{ value: summary.visitors_growth || 0, label: 'vs prev' }}
          />
          <StatCard
            title="Avg. Session"
            value={summary.avg_session_duration ? `${Math.floor(summary.avg_session_duration / 60)}m ${summary.avg_session_duration % 60}s` : '—'}
            icon={<Clock className="w-5 h-5" />}
            color="orange"
          />
          <StatCard
            title="Bounce Rate"
            value={summary.bounce_rate !== undefined ? `${summary.bounce_rate.toFixed(1)}%` : '—'}
            icon={<MousePointer className="w-5 h-5" />}
            color="purple"
          />
        </div>

        {/* Page Views Over Time */}
        <Card padding={false}>
          <div className="p-6 pb-0">
            <CardHeader>
              <CardTitle>Page Views Over Time</CardTitle>
            </CardHeader>
          </div>
          {pageViewsByDate.length > 0 ? (
            <div className="px-2 pb-4 h-64 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={pageViewsByDate}>
                  <defs>
                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={v => (v ? v.slice(5) : '')} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: any) => [Number(v).toLocaleString()]} />
                  <Legend />
                  <Area type="monotone" dataKey="views" stroke="#3b82f6" fill="url(#colorViews)" strokeWidth={2} name="Page Views" />
                  <Area type="monotone" dataKey="unique_visitors" stroke="#22c55e" fill="url(#colorVisitors)" strokeWidth={2} name="Unique Visitors" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-slate-400">
              No page view records found for this time period.
            </div>
          )}
        </Card>

        {/* Traffic + Devices row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Traffic Sources */}
          <Card>
            <CardTitle className="mb-4">Traffic Sources</CardTitle>
            {trafficSources.length > 0 ? (
              <div className="space-y-3">
                {trafficSources.map((source: any, i: number) => {
                  const total = trafficSources.reduce((a: number, s: any) => a + (parseInt(s.sessions, 10) || 0), 0);
                  const sSessions = parseInt(source.sessions, 10) || 0;
                  const pct = total > 0 ? ((sSessions / total) * 100).toFixed(1) : 0;
                  return (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-700 capitalize">{source.source || source.channel}</span>
                        <span className="text-slate-500">{pct}%</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full">
                        <div className="h-2 rounded-full" style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{formatNumber(sSessions)} sessions</p>
                    </div>
                  );
                })}
              </div>
            ) : <p className="text-slate-400 text-sm">No traffic sources recorded</p>}
          </Card>

          {/* Device Breakdown */}
          <Card>
            <CardTitle className="mb-4">Devices</CardTitle>
            {deviceBreakdown.length > 0 ? (
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={deviceBreakdown}
                      dataKey="count"
                      nameKey="device_type"
                      cx="50%"
                      cy="50%"
                      outerRadius={60}
                      label={({ device_type, percent }: any) => `${device_type} ${((percent || 0) * 100).toFixed(0)}%`}
                    >
                      {deviceBreakdown.map((_: any, i: number) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : <p className="text-slate-400 text-sm">No device data</p>}
          </Card>

          {/* Top Countries */}
          <Card>
            <CardTitle className="mb-4">
              <Globe className="w-4 h-4 inline mr-2" />
              Top Countries
            </CardTitle>
            {countryBreakdown.length > 0 ? (
              <div className="space-y-2">
                {countryBreakdown.slice(0, 7).map((c: any, i: number) => {
                  const maxSessions = countryBreakdown[0]?.sessions || 1;
                  const pct = Math.round(((parseInt(c.sessions, 10) || 0) / maxSessions) * 100);
                  return (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-sm text-slate-600 w-28 truncate">{c.country || 'Unknown'}</span>
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full">
                        <div className="h-1.5 bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-slate-500 w-12 text-right">{formatNumber(c.sessions || 0)}</span>
                    </div>
                  );
                })}
              </div>
            ) : <p className="text-slate-400 text-sm">No country data</p>}
          </Card>
        </div>

        {/* Top Pages + Referrers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card padding={false}>
            <div className="p-4 border-b border-slate-100">
              <CardTitle>Top Pages</CardTitle>
            </div>
            <div className="divide-y divide-slate-100">
              {topPages.slice(0, 10).map((page: any, i: number) => (
                <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="text-xs text-slate-400 w-4">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-800 truncate">{page.page_title || page.page_url}</p>
                    <p className="text-xs text-slate-400 truncate">{page.page_url}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-700">{formatNumber(page.views)}</p>
                    <p className="text-xs text-slate-400">views</p>
                  </div>
                </div>
              ))}
              {!topPages.length && <p className="text-center text-slate-500 text-sm py-6">No page data</p>}
            </div>
          </Card>

          <Card padding={false}>
            <div className="p-4 border-b border-slate-100">
              <CardTitle>Top Referrers</CardTitle>
            </div>
            <div className="divide-y divide-slate-100">
              {topReferrers.slice(0, 10).map((ref: any, i: number) => (
                <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="text-xs text-slate-400 w-4">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-800 truncate">{ref.referrer || ref.source || 'Direct'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-700">{formatNumber(ref.sessions || ref.visits)}</p>
                    <p className="text-xs text-slate-400">sessions</p>
                  </div>
                </div>
              ))}
              {!topReferrers.length && <p className="text-center text-slate-500 text-sm py-6">No referrer data</p>}
            </div>
          </Card>
        </div>

        {/* Conversion Funnel */}
        {conversionData && (
          <Card>
            <CardTitle className="mb-4">
              <Zap className="w-4 h-4 inline mr-2" />
              Conversion Funnel
            </CardTitle>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Visitors', value: conversionData.visitors, color: 'bg-blue-100 text-blue-700' },
                { label: 'Leads', value: conversionData.leads, color: 'bg-yellow-100 text-yellow-700' },
                { label: 'Proposals', value: conversionData.proposals, color: 'bg-orange-100 text-orange-700' },
                { label: 'Clients', value: conversionData.clients, color: 'bg-green-100 text-green-700' },
              ].map((step, i) => (
                <div key={i} className={`rounded-xl p-4 text-center ${step.color}`}>
                  <p className="text-2xl font-bold">{formatNumber(step.value || 0)}</p>
                  <p className="text-sm font-medium mt-1">{step.label}</p>
                  {i > 0 && conversionData.visitors > 0 && (
                    <p className="text-xs opacity-70 mt-0.5">
                      {((step.value / conversionData.visitors) * 100).toFixed(2)}% conversion
                    </p>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
