'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/app/(dashboard)/_components/layout/DashboardLayout';
import { Card, Button, SearchInput, Table, Tr, Td, StatusBadge, Pagination, Modal, Input, Select, Textarea, Badge, Avatar } from '@/components/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi, projectsApi, usersApi } from '@/lib/api';
import { formatDate, extractApiError, truncate } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Plus, LayoutGrid, List } from 'lucide-react';

const STATUSES = [
  { value: 'todo', label: 'To Do', color: 'bg-slate-100' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-blue-50' },
  { value: 'in_review', label: 'In Review', color: 'bg-purple-50' },
  { value: 'done', label: 'Done', color: 'bg-green-50' },
  { value: 'blocked', label: 'Blocked', color: 'bg-red-50' },
];

const PRIORITIES = [
  { value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' }, { value: 'critical', label: 'Critical' },
];

const PRIORITY_COLORS: Record<string, string> = {
  critical: 'border-l-4 border-l-red-500',
  high: 'border-l-4 border-l-orange-400',
  medium: 'border-l-4 border-l-yellow-400',
  low: 'border-l-4 border-l-slate-200',
};

export default function TasksPage() {
  const qc = useQueryClient();
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', project_id: '', priority: 'medium', status: 'todo', estimated_hours: '', due_date: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['all-tasks', { page, search, status: statusFilter }],
    queryFn: () => tasksApi.list({ page, limit: viewMode === 'board' ? 200 : 20, search: search || undefined, status: statusFilter || undefined }).then(r => r.data),
  });

  const { data: projectsData } = useQuery({
    queryKey: ['projects-mini'],
    queryFn: () => projectsApi.list({ limit: 100 }).then(r => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: () => tasksApi.create(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['all-tasks'] }); setShowCreate(false); toast.success('Task created'); },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: any) => tasksApi.update(id, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['all-tasks'] }),
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const tasks = data?.data || [];

  const tasksByStatus = STATUSES.reduce((acc, s) => {
    acc[s.value] = tasks.filter((t: any) => t.status === s.value);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <DashboardLayout title="Tasks" breadcrumbs={[{ label: 'Projects', href: '/dashboard/projects' }, { label: 'Tasks' }]}>
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex items-center gap-3 flex-wrap">
          <SearchInput value={search} onChange={setSearch} placeholder="Search tasks…" className="flex-1 max-w-xs" />
          {viewMode === 'list' && (
            <Select
              options={[{ value: '', label: 'All statuses' }, ...STATUSES.map(s => ({ value: s.value, label: s.label }))]}
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-40"
            />
          )}
          <div className="ml-auto flex gap-2">
            <div className="flex rounded-lg border border-slate-200 overflow-hidden">
              <button onClick={() => setViewMode('board')} className={`px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1 ${viewMode === 'board' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
                <LayoutGrid className="w-3.5 h-3.5" />Board
              </button>
              <button onClick={() => setViewMode('list')} className={`px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1 ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
                <List className="w-3.5 h-3.5" />List
              </button>
            </div>
            <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setShowCreate(true)}>Add Task</Button>
          </div>
        </div>

        {/* Board view */}
        {viewMode === 'board' && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4" style={{ minHeight: '70vh' }}>
            {STATUSES.map(col => (
              <div key={col.value} className={`${col.color} rounded-2xl p-3 min-h-[400px]`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-slate-700">{col.label}</h3>
                  <span className="w-5 h-5 rounded-full bg-white text-xs flex items-center justify-center text-slate-600 font-medium shadow-sm">
                    {tasksByStatus[col.value]?.length || 0}
                  </span>
                </div>
                <div className="space-y-2">
                  {tasksByStatus[col.value]?.map((task: any) => (
                    <div
                      key={task.id}
                      className={`bg-white rounded-xl p-3 shadow-sm hover:shadow-md transition-all cursor-pointer ${PRIORITY_COLORS[task.priority] || ''}`}
                      draggable
                      onDragEnd={() => {}}
                    >
                      <p className="text-xs font-mono text-slate-400 mb-1">{task.task_number}</p>
                      <p className="text-sm font-medium text-slate-800 leading-snug">{truncate(task.title, 60)}</p>
                      {task.project_name && (
                        <p className="text-xs text-blue-600 mt-1 truncate">{task.project_name}</p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <StatusBadge status={task.priority} />
                        {task.assignee_avatar || task.assignee_name ? (
                          <Avatar src={task.assignee_avatar} name={task.assignee_name} size="xs" />
                        ) : null}
                      </div>
                      {task.due_date && (
                        <p className="text-xs text-slate-400 mt-1">{formatDate(task.due_date)}</p>
                      )}
                      {/* Move to next status */}
                      {col.value !== 'done' && (
                        <div className="mt-2 flex gap-1">
                          {STATUSES.filter(s => s.value !== col.value).slice(0, 2).map(s => (
                            <button
                              key={s.value}
                              onClick={() => updateStatusMutation.mutate({ id: task.id, status: s.value })}
                              className="text-xs text-slate-400 hover:text-blue-600 hover:bg-blue-50 px-1.5 py-0.5 rounded transition-colors"
                            >
                              → {s.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  {!tasksByStatus[col.value]?.length && (
                    <p className="text-center text-slate-400 text-xs py-4">No tasks</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* List view */}
        {viewMode === 'list' && (
          <Card padding={false}>
            <Table
              headers={['#', 'Title', 'Project', 'Status', 'Priority', 'Assignee', 'Due Date', 'Est.']}
              loading={isLoading}
              empty={!tasks.length}
            >
              {tasks.map((t: any) => (
                <Tr key={t.id}>
                  <Td><span className="font-mono text-xs text-slate-400">{t.task_number}</span></Td>
                  <Td>
                    <p className="font-medium text-slate-900 max-w-xs truncate">{t.title}</p>
                  </Td>
                  <Td>{t.project_name || '—'}</Td>
                  <Td><StatusBadge status={t.status} /></Td>
                  <Td><StatusBadge status={t.priority} /></Td>
                  <Td>
                    {t.assignee_name ? (
                      <div className="flex items-center gap-2">
                        <Avatar src={t.assignee_avatar} name={t.assignee_name} size="xs" />
                        <span className="text-sm">{t.assignee_name}</span>
                      </div>
                    ) : <span className="text-slate-400">—</span>}
                  </Td>
                  <Td>{t.due_date ? formatDate(t.due_date) : '—'}</Td>
                  <Td>{t.estimated_hours ? `${t.estimated_hours}h` : '—'}</Td>
                </Tr>
              ))}
            </Table>
            <Pagination page={page} totalPages={Math.ceil((data?.total || 0) / 20)} onPageChange={setPage} total={data?.total} limit={20} />
          </Card>
        )}
      </div>

      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Add Task"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button loading={createMutation.isPending} onClick={() => createMutation.mutate()}>Create Task</Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Input label="Title *" value={form.title} onChange={e => set('title', e.target.value)} />
          </div>
          <Select
            label="Project"
            options={projectsData?.map((p: any) => ({ value: p.id, label: p.name })) || []}
            value={form.project_id}
            onChange={e => set('project_id', e.target.value)}
            placeholder="Select project"
          />
          <Select label="Status" options={STATUSES.map(s => ({ value: s.value, label: s.label }))} value={form.status} onChange={e => set('status', e.target.value)} />
          <Select label="Priority" options={PRIORITIES} value={form.priority} onChange={e => set('priority', e.target.value)} />
          <Input label="Estimated Hours" type="number" value={form.estimated_hours} onChange={e => set('estimated_hours', e.target.value)} placeholder="e.g. 4" />
          <Input label="Due Date" type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)} className="col-span-2" />
          <div className="col-span-2">
            <Textarea label="Description" value={form.description} onChange={e => set('description', e.target.value)} rows={3} />
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
