'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/app/(dashboard)/_components/layout/DashboardLayout';
import {
  Card, Button, SearchInput, Table, Tr, Td, StatusBadge, Pagination,
  Modal, Input, Select, Textarea, StatCard
} from '@/components/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi, clientsApi, usersApi } from '@/lib/api';
import { formatDate, formatCurrency, extractApiError } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Plus, Eye, Edit2, Trash2, FolderKanban, Clock, CheckCircle2, AlertTriangle, X } from 'lucide-react';
import Link from 'next/link';

const STATUSES = [
  { value: 'planning', label: 'Planning' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'development', label: 'Development' },
  { value: 'testing', label: 'Testing' },
  { value: 'review', label: 'Review' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'completed', label: 'Completed' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

const TYPES = [
  { value: 'fixed_price', label: 'Fixed Price' },
  { value: 'time_material', label: 'Time & Material' },
  { value: 'retainer', label: 'Retainer' },
  { value: 'milestone', label: 'Milestone' },
];

export default function ProjectsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  // Modals
  const [showCreate, setShowCreate] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [deletingProject, setDeletingProject] = useState<any>(null);

  // Form state
  const [form, setForm] = useState({
    name: '',
    code: '',
    client_id: '',
    project_manager: '',
    description: '',
    type: 'fixed_price',
    priority: 'medium',
    start_date: '',
    end_date: '',
    budget: '',
    currency: 'USD',
  });

  const [editForm, setEditForm] = useState<any>({});

  // Queries
  const { data, isLoading } = useQuery({
    queryKey: ['projects', { page, search, status: statusFilter, priority: priorityFilter }],
    queryFn: () => projectsApi.list({
      page,
      limit: 20,
      search: search || undefined,
      status: statusFilter || undefined,
      priority: priorityFilter || undefined
    }).then(r => r.data),
  });

  const { data: summaryData } = useQuery({
    queryKey: ['projects-summary'],
    queryFn: () => projectsApi.summary().then(r => r.data.data),
  });

  const { data: clientsData } = useQuery({
    queryKey: ['clients-mini-list'],
    queryFn: () => clientsApi.list({ limit: 100 }).then(r => r.data.data),
    staleTime: 60000,
  });

  const { data: usersData } = useQuery({
    queryKey: ['staff-users-mini'],
    queryFn: () => usersApi.list({ limit: 100 }).then(r => r.data.data),
    staleTime: 60000,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: () => projectsApi.create(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      qc.invalidateQueries({ queryKey: ['projects-summary'] });
      setShowCreate(false);
      setForm({
        name: '', code: '', client_id: '', project_manager: '',
        description: '', type: 'fixed_price', priority: 'medium',
        start_date: '', end_date: '', budget: '', currency: 'USD'
      });
      toast.success('Project created successfully');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => projectsApi.update(editingProject.id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      qc.invalidateQueries({ queryKey: ['projects-summary'] });
      setEditingProject(null);
      toast.success('Project updated successfully');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => projectsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      qc.invalidateQueries({ queryKey: ['projects-summary'] });
      setDeletingProject(null);
      toast.success('Project archived successfully');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const projects = data?.data || [];
  const totalPages = Math.ceil((data?.total || 0) / 20);

  const openEditModal = (p: any) => {
    setEditingProject(p);
    setEditForm({
      name: p.name || '',
      client_id: p.client_id || '',
      project_manager: p.manager_id || '',
      status: p.status || 'planning',
      priority: p.priority || 'medium',
      progress_percent: p.progress_percent ?? 0,
      budget: p.budget || '',
      currency: p.currency || 'USD',
      start_date: p.start_date ? p.start_date.split('T')[0] : '',
      end_date: p.end_date ? p.end_date.split('T')[0] : '',
      description: p.description || '',
    });
  };

  const clientOptions = [
    { value: '', label: 'Select client (optional)' },
    ...(clientsData || []).map((c: any) => ({
      value: c.id,
      label: c.name || c.company_name,
    })),
  ];

  const managerOptions = [
    { value: '', label: 'Select project manager' },
    ...(usersData || []).map((u: any) => ({
      value: u.id,
      label: `${u.display_name || u.email} (${u.role || 'Staff'})`,
    })),
  ];

  return (
    <DashboardLayout title="Projects" breadcrumbs={[{ label: 'Projects' }]}>
      <div className="space-y-6">
        {/* Responsive 4-StatCard Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div onClick={() => { setStatusFilter(''); setPage(1); }} className="cursor-pointer">
            <StatCard
              title="Total Projects"
              value={summaryData?.total ?? data?.total ?? 0}
              icon={<FolderKanban className="w-5 h-5" />}
              color="blue"
            />
          </div>
          <div onClick={() => { setStatusFilter('in_progress'); setPage(1); }} className="cursor-pointer">
            <StatCard
              title="In Progress"
              value={summaryData?.in_progress ?? 0}
              icon={<Clock className="w-5 h-5" />}
              color="orange"
            />
          </div>
          <div onClick={() => { setStatusFilter('completed'); setPage(1); }} className="cursor-pointer">
            <StatCard
              title="Completed"
              value={summaryData?.completed ?? 0}
              icon={<CheckCircle2 className="w-5 h-5" />}
              color="green"
            />
          </div>
          <div onClick={() => { setStatusFilter('overdue'); setPage(1); }} className="cursor-pointer">
            <StatCard
              title="Overdue"
              value={summaryData?.overdue ?? 0}
              icon={<AlertTriangle className="w-5 h-5" />}
              color="red"
            />
          </div>
        </div>

        {/* Projects Listing Card */}
        <Card padding={false}>
          {/* Compact Single-Row Toolbar */}
          <div className="p-4 border-b border-slate-100 flex flex-wrap items-center gap-3">
            <SearchInput
              value={search}
              onChange={(val) => { setSearch(val); setPage(1); }}
              placeholder="Search projects..."
              className="w-64 sm:w-72"
            />

            <Select
              options={[{ value: '', label: 'All statuses' }, ...STATUSES]}
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              containerClassName="w-40"
            />

            <Select
              options={[{ value: '', label: 'All priorities' }, ...PRIORITIES]}
              value={priorityFilter}
              onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}
              containerClassName="w-36"
            />

            {(search || statusFilter || priorityFilter) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setSearch(''); setStatusFilter(''); setPriorityFilter(''); setPage(1); }}
                icon={<X className="w-3.5 h-3.5 text-slate-400" />}
                className="text-slate-500 hover:text-slate-700"
              >
                Clear
              </Button>
            )}

            <div className="ml-auto">
              <Button size="sm" onClick={() => setShowCreate(true)} icon={<Plus className="w-4 h-4" />}>
                New Project
              </Button>
            </div>
          </div>

          {/* Clean Aligned Projects Table */}
          <Table
            headers={['PROJECT', 'CLIENT', 'STATUS', 'PRIORITY', 'PROGRESS', 'BUDGET', 'DEADLINE', 'MANAGER', 'ACTIONS']}
            loading={isLoading}
            empty={!projects.length}
            emptyMessage="No projects found matching the filter criteria"
          >
            {projects.map((p: any) => (
              <Tr key={p.id}>
                <Td>
                  <div>
                    <Link
                      href={`/dashboard/projects/${p.id}`}
                      className="font-medium text-slate-900 hover:text-blue-600 transition-colors"
                    >
                      {p.name}
                    </Link>
                    <p className="text-xs text-slate-400 font-mono tracking-wider mt-0.5">{p.code}</p>
                  </div>
                </Td>
                <Td>
                  <span className="text-sm text-slate-700">{p.client_name || '—'}</span>
                </Td>
                <Td>
                  <StatusBadge status={p.status} />
                </Td>
                <Td>
                  <StatusBadge status={p.priority} />
                </Td>
                <Td>
                  <div className="flex items-center gap-2.5 min-w-[120px]">
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          (p.progress_percent || 0) >= 100
                            ? 'bg-green-500'
                            : (p.progress_percent || 0) >= 50
                            ? 'bg-blue-500'
                            : 'bg-indigo-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(0, p.progress_percent || 0))}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono text-slate-500 w-9 text-right">
                      {p.progress_percent || 0}%
                    </span>
                  </div>
                </Td>
                <Td>
                  <span className="text-sm font-medium text-slate-800">
                    {p.budget ? formatCurrency(p.budget, p.currency) : '—'}
                  </span>
                </Td>
                <Td>
                  <span className="text-xs text-slate-600 whitespace-nowrap">
                    {p.end_date ? formatDate(p.end_date) : '—'}
                  </span>
                </Td>
                <Td>
                  <span className="text-sm text-slate-700">{p.manager_name || 'Unassigned'}</span>
                </Td>
                <Td>
                  <div className="flex items-center gap-1 justify-end">
                    <Link href={`/dashboard/projects/${p.id}`}>
                      <Button variant="ghost" size="sm" icon={<Eye className="w-3.5 h-3.5 text-blue-600" />}>
                        View
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Edit2 className="w-3.5 h-3.5 text-slate-500" />}
                      onClick={() => openEditModal(p)}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Trash2 className="w-3.5 h-3.5 text-red-500" />}
                      onClick={() => setDeletingProject(p)}
                    />
                  </div>
                </Td>
              </Tr>
            ))}
          </Table>

          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} total={data?.total} limit={20} />
        </Card>
      </div>

      {/* New Project Modal */}
      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Create New Project"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button
              loading={createMutation.isPending}
              disabled={!form.name.trim()}
              onClick={() => createMutation.mutate()}
            >
              Create Project
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Input
              label="Project Name *"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. NextGen Web Platform Replatforming"
            />
          </div>

          <Select
            label="Client"
            options={clientOptions}
            value={form.client_id}
            onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))}
          />

          <Select
            label="Project Manager"
            options={managerOptions}
            value={form.project_manager}
            onChange={e => setForm(f => ({ ...f, project_manager: e.target.value }))}
          />

          <Input
            label="Project Code (Optional)"
            value={form.code}
            onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
            placeholder="e.g. PRJ-PORTAL"
          />

          <Select
            label="Billing Type"
            options={TYPES}
            value={form.type}
            onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
          />

          <Select
            label="Priority"
            options={PRIORITIES}
            value={form.priority}
            onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
          />

          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Budget"
              type="number"
              value={form.budget}
              onChange={e => setForm(f => ({ ...f, budget: e.target.value }))}
              placeholder="0"
            />
            <Select
              label="Currency"
              options={[{ value: 'USD', label: 'USD' }, { value: 'EUR', label: 'EUR' }, { value: 'GBP', label: 'GBP' }]}
              value={form.currency}
              onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
            />
          </div>

          <Input
            label="Start Date"
            type="date"
            value={form.start_date}
            onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
          />

          <Input
            label="Deadline / Target End Date"
            type="date"
            value={form.end_date}
            onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
          />

          <div className="col-span-2">
            <Textarea
              label="Project Description"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={3}
              placeholder="Key project goals, deliverables, and scope summary..."
            />
          </div>
        </div>
      </Modal>

      {/* Edit Project Modal */}
      {editingProject && (
        <Modal
          open={!!editingProject}
          onClose={() => setEditingProject(null)}
          title={`Edit Project — ${editingProject.code || editingProject.name}`}
          size="lg"
          footer={
            <>
              <Button variant="outline" onClick={() => setEditingProject(null)}>Cancel</Button>
              <Button loading={updateMutation.isPending} onClick={() => updateMutation.mutate(editForm)}>
                Save Changes
              </Button>
            </>
          }
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Input
                label="Project Name *"
                value={editForm.name}
                onChange={e => setEditForm((f: any) => ({ ...f, name: e.target.value }))}
              />
            </div>

            <Select
              label="Client"
              options={clientOptions}
              value={editForm.client_id || ''}
              onChange={e => setEditForm((f: any) => ({ ...f, client_id: e.target.value }))}
            />

            <Select
              label="Project Manager"
              options={managerOptions}
              value={editForm.project_manager || ''}
              onChange={e => setEditForm((f: any) => ({ ...f, project_manager: e.target.value }))}
            />

            <Select
              label="Status"
              options={STATUSES}
              value={editForm.status || 'planning'}
              onChange={e => setEditForm((f: any) => ({ ...f, status: e.target.value }))}
            />

            <Select
              label="Priority"
              options={PRIORITIES}
              value={editForm.priority || 'medium'}
              onChange={e => setEditForm((f: any) => ({ ...f, priority: e.target.value }))}
            />

            <Input
              label="Progress (%)"
              type="number"
              min="0"
              max="100"
              value={editForm.progress_percent}
              onChange={e => setEditForm((f: any) => ({ ...f, progress_percent: e.target.value }))}
            />

            <div className="grid grid-cols-2 gap-2">
              <Input
                label="Budget"
                type="number"
                value={editForm.budget || ''}
                onChange={e => setEditForm((f: any) => ({ ...f, budget: e.target.value }))}
              />
              <Select
                label="Currency"
                options={[{ value: 'USD', label: 'USD' }, { value: 'EUR', label: 'EUR' }, { value: 'GBP', label: 'GBP' }]}
                value={editForm.currency || 'USD'}
                onChange={e => setEditForm((f: any) => ({ ...f, currency: e.target.value }))}
              />
            </div>

            <Input
              label="Start Date"
              type="date"
              value={editForm.start_date || ''}
              onChange={e => setEditForm((f: any) => ({ ...f, start_date: e.target.value }))}
            />

            <Input
              label="Deadline"
              type="date"
              value={editForm.end_date || ''}
              onChange={e => setEditForm((f: any) => ({ ...f, end_date: e.target.value }))}
            />

            <div className="col-span-2">
              <Textarea
                label="Description"
                value={editForm.description || ''}
                onChange={e => setEditForm((f: any) => ({ ...f, description: e.target.value }))}
                rows={3}
              />
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deletingProject && (
        <Modal
          open={!!deletingProject}
          onClose={() => setDeletingProject(null)}
          title="Archive Project"
          size="sm"
          footer={
            <>
              <Button variant="outline" onClick={() => setDeletingProject(null)}>Cancel</Button>
              <Button
                variant="danger"
                loading={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(deletingProject.id)}
              >
                Archive Project
              </Button>
            </>
          }
        >
          <p className="text-sm text-slate-600">
            Are you sure you want to archive project <strong className="text-slate-900">{deletingProject.name}</strong> ({deletingProject.code})?
            All associated tasks and time logs will remain preserved.
          </p>
        </Modal>
      )}
    </DashboardLayout>
  );
}
