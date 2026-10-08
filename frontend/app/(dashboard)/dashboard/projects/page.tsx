'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/app/(dashboard)/_components/layout/DashboardLayout';
import { Card, Button, SearchInput, Table, Tr, Td, StatusBadge, Pagination, Modal, Input, Select, Textarea, PageLoader, StatCard } from '@/components/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi } from '@/lib/api';
import { formatDate, formatCurrency, extractApiError } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Plus, Eye, FolderKanban, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

const STATUSES = [
  { value: 'planning', label: 'Planning' }, { value: 'in_progress', label: 'In Progress' },
  { value: 'on_hold', label: 'On Hold' }, { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const PRIORITIES = [
  { value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' }, { value: 'critical', label: 'Critical' },
];

const TYPES = [
  { value: 'fixed_price', label: 'Fixed Price' }, { value: 'time_material', label: 'Time & Material' },
  { value: 'retainer', label: 'Retainer' }, { value: 'milestone', label: 'Milestone' },
];

export default function ProjectsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', type: 'fixed_price', priority: 'medium', start_date: '', end_date: '', budget: '', currency: 'USD' });

  const { data, isLoading } = useQuery({
    queryKey: ['projects', { page, search, status: statusFilter }],
    queryFn: () => projectsApi.list({ page, limit: 20, search: search || undefined, status: statusFilter || undefined }).then(r => r.data),
  });

  const { data: overdueData } = useQuery({
    queryKey: ['projects-overdue'],
    queryFn: () => projectsApi.overdue().then(r => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: () => projectsApi.create(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['projects'] }); setShowCreate(false); toast.success('Project created'); },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const projects = data?.data || [];
  const totalPages = Math.ceil((data?.total || 0) / 20);

  const statusCounts = STATUSES.reduce((acc, s) => {
    acc[s.value] = projects.filter((p: any) => p.status === s.value).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <DashboardLayout title="Projects" breadcrumbs={[{ label: 'Projects' }]}>
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Total Projects" value={data?.total || 0} icon={<FolderKanban className="w-5 h-5" />} color="blue" />
          <StatCard title="In Progress" value={projects.filter((p: any) => p.status === 'in_progress').length} icon={<Clock className="w-5 h-5" />} color="orange" />
          <StatCard title="Completed" value={projects.filter((p: any) => p.status === 'completed').length} icon={<CheckCircle2 className="w-5 h-5" />} color="green" />
          <StatCard title="Overdue" value={overdueData?.length || 0} icon={<AlertTriangle className="w-5 h-5" />} color="red" />
        </div>

        {/* Table */}
        <Card padding={false}>
          <div className="flex items-center gap-3 p-4 border-b border-slate-100">
            <SearchInput value={search} onChange={setSearch} placeholder="Search projects..." className="flex-1 max-w-xs" />
            <Select
              options={[{ value: '', label: 'All statuses' }, ...STATUSES]}
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-44"
            />
            <div className="ml-auto">
              <Button size="sm" onClick={() => setShowCreate(true)} icon={<Plus className="w-4 h-4" />}>
                New Project
              </Button>
            </div>
          </div>

          <Table
            headers={['Project', 'Client', 'Status', 'Priority', 'Progress', 'Budget', 'Deadline', 'Manager', '']}
            loading={isLoading}
            empty={!projects.length}
            emptyMessage="No projects found"
          >
            {projects.map((p: any) => (
              <Tr key={p.id}>
                <Td>
                  <div>
                    <p className="font-medium text-slate-900">{p.name}</p>
                    <p className="text-xs text-slate-400 font-mono">{p.code}</p>
                  </div>
                </Td>
                <Td>{p.client_name || '—'}</Td>
                <Td><StatusBadge status={p.status} /></Td>
                <Td><StatusBadge status={p.priority} /></Td>
                <Td>
                  <div className="flex items-center gap-2 min-w-[100px]">
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full">
                      <div className="h-1.5 bg-blue-500 rounded-full" style={{ width: `${p.progress_percent || 0}%` }} />
                    </div>
                    <span className="text-xs text-slate-500 w-8">{p.progress_percent || 0}%</span>
                  </div>
                </Td>
                <Td>{p.budget ? formatCurrency(p.budget, p.currency) : '—'}</Td>
                <Td>{p.end_date ? formatDate(p.end_date) : '—'}</Td>
                <Td>{p.manager_name}</Td>
                <Td>
                  <Link href={`/dashboard/projects/${p.id}`}>
                    <Button variant="ghost" size="sm" icon={<Eye className="w-4 h-4" />}>View</Button>
                  </Link>
                </Td>
              </Tr>
            ))}
          </Table>

          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} total={data?.total} limit={20} />
        </Card>
      </div>

      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="New Project"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button loading={createMutation.isPending} onClick={() => createMutation.mutate()}>Create Project</Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Input label="Project Name *" value={form.name} onChange={e => set('name', e.target.value)} />
          </div>
          <Select label="Type" options={TYPES} value={form.type} onChange={e => set('type', e.target.value)} />
          <Select label="Priority" options={PRIORITIES} value={form.priority} onChange={e => set('priority', e.target.value)} />
          <Input label="Start Date" type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} />
          <Input label="End Date" type="date" value={form.end_date} onChange={e => set('end_date', e.target.value)} />
          <Input label="Budget" type="number" value={form.budget} onChange={e => set('budget', e.target.value)} placeholder="0" />
          <Select label="Currency" options={[{ value: 'USD', label: 'USD' }, { value: 'EUR', label: 'EUR' }, { value: 'GBP', label: 'GBP' }]} value={form.currency} onChange={e => set('currency', e.target.value)} />
          <div className="col-span-2">
            <Textarea label="Description" value={form.description} onChange={e => set('description', e.target.value)} rows={3} />
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
