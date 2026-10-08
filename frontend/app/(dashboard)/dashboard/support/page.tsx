'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/app/(dashboard)/_components/layout/DashboardLayout';
import { Card, Button, SearchInput, Table, Tr, Td, StatusBadge, Pagination, Modal, Input, Select, Textarea, StatCard, PageLoader } from '@/components/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supportApi } from '@/lib/api';
import { formatDate, timeAgo, extractApiError } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Plus, Eye, CheckCircle2, Clock, AlertTriangle, XCircle, MessageSquare } from 'lucide-react';
import Link from 'next/link';

const PRIORITIES = [
  { value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' }, { value: 'critical', label: 'Critical' },
];

const TICKET_TYPES = [
  { value: 'support', label: 'Support' }, { value: 'bug', label: 'Bug' },
  { value: 'feature_request', label: 'Feature Request' }, { value: 'billing', label: 'Billing' },
  { value: 'general', label: 'General' },
];

export default function SupportPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ subject: '', description: '', type: 'support', priority: 'medium' });

  const { data, isLoading } = useQuery({
    queryKey: ['tickets', { page, search, status: statusFilter, priority: priorityFilter }],
    queryFn: () => supportApi.getTickets({ page, limit: 20, search: search || undefined, status: statusFilter || undefined, priority: priorityFilter || undefined }).then(r => r.data),
  });

  const { data: stats } = useQuery({
    queryKey: ['ticket-stats'],
    queryFn: () => supportApi.getTicketStats().then(r => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: () => supportApi.createTicket(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tickets'] }); setShowCreate(false); toast.success('Ticket created'); },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const tickets = data?.data || [];
  const totalPages = Math.ceil((data?.total || 0) / 20);

  return (
    <DashboardLayout title="Support" breadcrumbs={[{ label: 'Support' }]}>
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Open" value={stats?.open_count || 0} icon={<MessageSquare className="w-5 h-5" />} color="blue" />
          <StatCard title="In Progress" value={stats?.in_progress_count || 0} icon={<Clock className="w-5 h-5" />} color="orange" />
          <StatCard title="Resolved Today" value={stats?.resolved_today || 0} icon={<CheckCircle2 className="w-5 h-5" />} color="green" />
          <StatCard title="Critical" value={stats?.critical_count || 0} icon={<AlertTriangle className="w-5 h-5" />} color="red" />
        </div>

        <Card padding={false}>
          <div className="flex items-center gap-3 p-4 border-b border-slate-100">
            <SearchInput value={search} onChange={setSearch} placeholder="Search tickets..." className="flex-1 max-w-xs" />
            <Select options={[{ value: '', label: 'All status' }, { value: 'open', label: 'Open' }, { value: 'in_progress', label: 'In Progress' }, { value: 'resolved', label: 'Resolved' }, { value: 'closed', label: 'Closed' }]} value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-40" />
            <Select options={[{ value: '', label: 'All priority' }, ...PRIORITIES]} value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} className="w-36" />
            <div className="ml-auto">
              <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setShowCreate(true)}>New Ticket</Button>
            </div>
          </div>

          <Table
            headers={['Ticket #', 'Subject', 'Client', 'Status', 'Priority', 'Assigned To', 'Replies', 'Created', '']}
            loading={isLoading}
            empty={!tickets.length}
            emptyMessage="No tickets found"
          >
            {tickets.map((t: any) => (
              <Tr key={t.id}>
                <Td><span className="font-mono text-xs">{t.ticket_number}</span></Td>
                <Td>
                  <p className="font-medium text-slate-800 max-w-xs truncate">{t.subject}</p>
                  <p className="text-xs text-slate-500">{t.reporter_name}</p>
                </Td>
                <Td>{t.client_name || '—'}</Td>
                <Td><StatusBadge status={t.status} /></Td>
                <Td><StatusBadge status={t.priority} /></Td>
                <Td>{t.assigned_to_name || <span className="text-slate-400">Unassigned</span>}</Td>
                <Td>{t.reply_count || 0}</Td>
                <Td>{timeAgo(t.created_at)}</Td>
                <Td>
                  <Link href={`/dashboard/support/tickets/${t.id}`}>
                    <Button variant="ghost" size="sm" icon={<Eye className="w-4 h-4" />}>View</Button>
                  </Link>
                </Td>
              </Tr>
            ))}
          </Table>

          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} total={data?.total} limit={20} />
        </Card>

        {/* Knowledge Base */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-slate-900">Knowledge Base</h3>
            <Link href="/dashboard/support/kb"><Button variant="outline" size="sm">Browse Articles</Button></Link>
          </div>
          <p className="text-sm text-slate-500">Browse help articles, FAQs, and documentation to find quick answers.</p>
        </Card>
      </div>

      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="New Support Ticket"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button loading={createMutation.isPending} onClick={() => createMutation.mutate()}>Submit Ticket</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Subject *" value={form.subject} onChange={e => set('subject', e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Type" options={TICKET_TYPES} value={form.type} onChange={e => set('type', e.target.value)} />
            <Select label="Priority" options={PRIORITIES} value={form.priority} onChange={e => set('priority', e.target.value)} />
          </div>
          <Textarea label="Description *" value={form.description} onChange={e => set('description', e.target.value)} rows={4} />
        </div>
      </Modal>
    </DashboardLayout>
  );
}
