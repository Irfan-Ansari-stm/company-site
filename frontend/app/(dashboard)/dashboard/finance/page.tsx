'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/app/(dashboard)/_components/layout/DashboardLayout';
import {
  Card, Button, Table, Tr, Td, StatusBadge, StatCard, PageLoader, Alert
} from '@/components/ui';
import { useQuery } from '@tanstack/react-query';
import { financeApi } from '@/lib/api';
import { formatDate, formatCurrency } from '@/lib/utils';
import {
  DollarSign, CheckCircle2, Clock, AlertTriangle, FileText,
  CreditCard, ArrowUpRight, TrendingUp, Calendar
} from 'lucide-react';
import Link from 'next/link';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
  CartesianGrid, Legend
} from 'recharts';

export default function FinanceOverviewPage() {
  const { data: overview, isLoading, isError } = useQuery({
    queryKey: ['finance-overview'],
    queryFn: () => financeApi.getOverview().then(r => r.data.data),
  });

  const { data: overdueList } = useQuery({
    queryKey: ['overdue-invoices'],
    queryFn: () => financeApi.getOverdueInvoices().then(r => r.data.data),
  });

  if (isLoading) {
    return (
      <DashboardLayout title="Finance Overview" breadcrumbs={[{ label: 'Finance' }]}>
        <PageLoader />
      </DashboardLayout>
    );
  }

  const trends = overview?.monthly_trend || [];
  const recentInvoices = overview?.recent_invoices || [];
  const recentPayments = overview?.recent_payments || [];

  return (
    <DashboardLayout
      title="Finance Overview"
      breadcrumbs={[{ label: 'Finance' }, { label: 'Overview' }]}
    >
      <div className="space-y-6">
        {/* Top Header Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Financial Performance</h2>
            <p className="text-sm text-slate-500">
              Live invoicing, revenue collections, and cash flow tracking
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard/finance/invoices">
              <Button variant="outline" size="sm" icon={<FileText className="w-4 h-4" />}>
                All Invoices
              </Button>
            </Link>
          </div>
        </div>

        {/* Overdue Warning Alert */}
        {overdueList?.length > 0 && (
          <Alert type="warning">
            <strong>{overdueList.length} invoices are currently overdue</strong> totaling{' '}
            {formatCurrency(overview?.overdue_amount || 0)}. Review them promptly.
            <Link href="/dashboard/finance/invoices" className="ml-2 font-semibold underline text-amber-900">
              Go to Invoices &rarr;
            </Link>
          </Alert>
        )}

        {/* 4 Primary KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Invoiced"
            value={formatCurrency(overview?.total_invoiced || 0)}
            subtitle={`${overview?.total_invoices || 0} total invoices`}
            icon={<DollarSign className="w-5 h-5" />}
            color="blue"
          />
          <StatCard
            title="Collected Revenue"
            value={formatCurrency(overview?.total_collected || 0)}
            subtitle={`${overview?.paid_count || 0} paid in full`}
            icon={<CheckCircle2 className="w-5 h-5" />}
            color="green"
          />
          <StatCard
            title="Outstanding Balance"
            value={formatCurrency(overview?.outstanding_amount || 0)}
            subtitle={`${overview?.pending_count || 0} pending invoices`}
            icon={<Clock className="w-5 h-5" />}
            color="orange"
          />
          <StatCard
            title="Overdue Receivables"
            value={formatCurrency(overview?.overdue_amount || 0)}
            subtitle={`${overview?.overdue_count || 0} overdue`}
            icon={<AlertTriangle className="w-5 h-5" />}
            color="red"
          />
        </div>

        {/* Revenue Trend Chart */}
        <Card padding={true}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-800">Monthly Revenue & Collections</h3>
              <p className="text-xs text-slate-500">Invoiced vs Collected over the past 12 months</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Calendar className="w-3.5 h-3.5" />
              <span>Trailing 12 Months</span>
            </div>
          </div>

          <div className="h-72 w-full">
            {trends.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="invoicedGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="collectedGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} tickFormatter={(v) => `$${v >= 1000 ? `${v / 1000}k` : v}`} />
                  <Tooltip
                    formatter={(val: any) => formatCurrency(Number(val) || 0)}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="invoiced"
                    name="Invoiced Amount"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#invoicedGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="collected"
                    name="Collected Amount"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#collectedGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-slate-400">
                No revenue trend data recorded yet.
              </div>
            )}
          </div>
        </Card>

        {/* Dual Tables: Recent Invoices & Recent Payments */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Invoices */}
          <Card padding={false}>
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-500" />
                <h3 className="font-semibold text-slate-800">Recent Invoices</h3>
              </div>
              <Link
                href="/dashboard/finance/invoices"
                className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
              >
                View all <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <Table
              headers={['Invoice', 'Client', 'Amount', 'Status']}
              empty={recentInvoices.length === 0}
            >
              {recentInvoices.map((inv: any) => (
                <Tr key={inv.id}>
                  <Td>
                    <p className="font-mono text-xs font-medium text-slate-900">{inv.invoice_number}</p>
                    <p className="text-xs text-slate-400">{formatDate(inv.issue_date)}</p>
                  </Td>
                  <Td>
                    <span className="font-medium text-slate-700">{inv.client_name || '—'}</span>
                  </Td>
                  <Td>
                    <span className="font-medium text-slate-900">{formatCurrency(inv.total_amount)}</span>
                  </Td>
                  <Td>
                    <StatusBadge status={inv.status} />
                  </Td>
                </Tr>
              ))}
            </Table>
          </Card>

          {/* Recent Payments */}
          <Card padding={false}>
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-slate-500" />
                <h3 className="font-semibold text-slate-800">Recent Payments</h3>
              </div>
              <Link
                href="/dashboard/finance/invoices"
                className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
              >
                View invoices <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <Table
              headers={['Date', 'Invoice', 'Client', 'Amount']}
              empty={recentPayments.length === 0}
            >
              {recentPayments.map((pay: any) => (
                <Tr key={pay.id}>
                  <Td>
                    <p className="text-xs text-slate-600 font-medium">{formatDate(pay.paid_at || pay.created_at)}</p>
                    <p className="text-xs text-slate-400 capitalize">{pay.method?.replace(/_/g, ' ') || 'card'}</p>
                  </Td>
                  <Td>
                    <span className="font-mono text-xs font-medium text-slate-700">{pay.invoice_number || '—'}</span>
                  </Td>
                  <Td>
                    <span className="font-medium text-slate-700">{pay.client_name || '—'}</span>
                  </Td>
                  <Td>
                    <span className="font-semibold text-emerald-600">+{formatCurrency(pay.amount)}</span>
                  </Td>
                </Tr>
              ))}
            </Table>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
