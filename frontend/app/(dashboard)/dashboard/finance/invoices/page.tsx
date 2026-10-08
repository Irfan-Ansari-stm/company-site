'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/app/(dashboard)/_components/layout/DashboardLayout';
import { Card, Button, SearchInput, Table, Tr, Td, StatusBadge, Pagination, Modal, Input, Select, StatCard, PageLoader, Alert } from '@/components/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financeApi } from '@/lib/api';
import { formatDate, formatCurrency, extractApiError } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Plus, DollarSign, AlertTriangle, CheckCircle2, Clock, Eye, Send } from 'lucide-react';
import Link from 'next/link';

const INVOICE_STATUSES = [
  { value: 'draft', label: 'Draft' }, { value: 'sent', label: 'Sent' },
  { value: 'viewed', label: 'Viewed' }, { value: 'partially_paid', label: 'Partially Paid' },
  { value: 'paid', label: 'Paid' }, { value: 'overdue', label: 'Overdue' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function InvoicesPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showOverdue, setShowOverdue] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['invoices', { page, status: statusFilter, overdue: showOverdue }],
    queryFn: () => financeApi.getInvoices({ page, limit: 20, status: statusFilter || undefined, overdue: showOverdue ? 'true' : undefined }).then(r => r.data),
  });

  const { data: summary } = useQuery({
    queryKey: ['invoice-summary'],
    queryFn: () => financeApi.getInvoiceSummary().then(r => r.data.data),
  });

  const { data: overdueList } = useQuery({
    queryKey: ['overdue-invoices'],
    queryFn: () => financeApi.getOverdueInvoices().then(r => r.data.data),
  });

  const sendMutation = useMutation({
    mutationFn: (id: string) => financeApi.sendInvoice(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['invoices'] }); toast.success('Invoice sent'); },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const invoices = data?.data || [];
  const totalPages = Math.ceil((data?.total || 0) / 20);

  return (
    <DashboardLayout title="Finance" breadcrumbs={[{ label: 'Finance' }, { label: 'Invoices' }]}>
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="Total Invoiced"
            value={formatCurrency(summary?.total_invoiced || 0)}
            icon={<DollarSign className="w-5 h-5" />}
            color="blue"
          />
          <StatCard
            title="Collected"
            value={formatCurrency(summary?.total_collected || 0)}
            icon={<CheckCircle2 className="w-5 h-5" />}
            color="green"
          />
          <StatCard
            title="Outstanding"
            value={formatCurrency((summary?.total_invoiced || 0) - (summary?.total_collected || 0))}
            icon={<Clock className="w-5 h-5" />}
            color="orange"
          />
          <StatCard
            title="Overdue"
            value={formatCurrency(summary?.overdue_amount || 0)}
            subtitle={`${overdueList?.length || 0} invoices`}
            icon={<AlertTriangle className="w-5 h-5" />}
            color="red"
          />
        </div>

        {overdueList?.length > 0 && (
          <Alert type="warning">
            <strong>{overdueList.length} overdue invoices</strong> totaling {formatCurrency(overdueList.reduce((a: number, i: any) => a + parseFloat(i.total_amount || 0), 0))}.
            <button onClick={() => setShowOverdue(!showOverdue)} className="ml-2 underline text-yellow-800">
              {showOverdue ? 'Show all' : 'View overdue'}
            </button>
          </Alert>
        )}

        <Card padding={false}>
          <div className="flex items-center gap-3 p-4 border-b border-slate-100">
            <Select
              options={[{ value: '', label: 'All statuses' }, ...INVOICE_STATUSES]}
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-44"
            />
            <div className="ml-auto flex gap-2">
              <Link href="/dashboard/finance/invoices/new">
                <Button size="sm" icon={<Plus className="w-4 h-4" />}>New Invoice</Button>
              </Link>
            </div>
          </div>

          <Table
            headers={['Invoice #', 'Client', 'Status', 'Issue Date', 'Due Date', 'Amount', 'Paid', '']}
            loading={isLoading}
            empty={!invoices.length}
            emptyMessage="No invoices found"
          >
            {invoices.map((inv: any) => (
              <Tr key={inv.id}>
                <Td>
                  <span className="font-mono text-sm font-medium text-slate-800">{inv.invoice_number}</span>
                </Td>
                <Td>{inv.client_name}</Td>
                <Td><StatusBadge status={inv.status} /></Td>
                <Td>{formatDate(inv.issue_date)}</Td>
                <Td className={inv.status === 'overdue' ? 'text-red-600 font-medium' : ''}>{formatDate(inv.due_date)}</Td>
                <Td className="font-semibold">{formatCurrency(inv.total_amount, inv.currency)}</Td>
                <Td className="text-green-700">{formatCurrency(inv.amount_paid || 0, inv.currency)}</Td>
                <Td>
                  <div className="flex items-center gap-1">
                    <Link href={`/dashboard/finance/invoices/${inv.id}`}>
                      <Button variant="ghost" size="sm" icon={<Eye className="w-4 h-4" />}/>
                    </Link>
                    {inv.status === 'draft' && (
                      <Button variant="ghost" size="sm" icon={<Send className="w-4 h-4" />}
                        onClick={() => sendMutation.mutate(inv.id)}
                        loading={sendMutation.isPending}
                      />
                    )}
                  </div>
                </Td>
              </Tr>
            ))}
          </Table>

          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} total={data?.total} limit={20} />
        </Card>

        {/* Finance Nav */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { href: '/finance/payments', label: 'Payments', icon: '💳' },
            { href: '/finance/expenses', label: 'Expenses', icon: '🧾' },
            { href: '/finance/subscriptions', label: 'Subscriptions', icon: '🔄' },
            { href: '/finance/reports', label: 'Reports', icon: '📊' },
          ].map(item => (
            <Link key={item.href} href={item.href}>
              <Card className="hover:shadow-md transition-all cursor-pointer text-center !p-4">
                <span className="text-3xl">{item.icon}</span>
                <p className="text-sm font-medium text-slate-700 mt-2">{item.label}</p>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
