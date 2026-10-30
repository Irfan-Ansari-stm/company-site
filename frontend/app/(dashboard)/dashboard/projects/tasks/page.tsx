'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/app/(dashboard)/_components/layout/DashboardLayout';
import {
  Card, Button, SearchInput, Table, Tr, Td, StatusBadge, Pagination,
  Modal, Input, Select, Textarea, Avatar
} from '@/components/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi, projectsApi, usersApi } from '@/lib/api';
import { formatDate, extractApiError, truncate } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Plus, LayoutGrid, List, Calendar, Clock, Edit2, Trash2, X } from 'lucide-react';

const STATUSES = [
  { value: 'todo', label: 'To Do', color: 'bg-slate-50 border-slate-200', countBadge: 'bg-slate-200 text-slate-700' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-blue-50/60 border-blue-200', countBadge: 'bg-blue-200 text-blue-800' },
  { value: 'in_review', label: 'In Review', color: 'bg-purple-50/60 border-purple-200', countBadge: 'bg-purple-200 text-purple-800' },
  { value: 'done', label: 'Done', color: 'bg-green-50/60 border-green-200', countBadge: 'bg-green-200 text-green-800' },
  { value: 'blocked', label: 'Blocked', color: 'bg-red-50/60 border-red-200', countBadge: 'bg-red-200 text-red-800' },
];

const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

const PRIORITY_BORDER: Record<string, string> = {
  critical: 'border-l-4 border-l-red-500',
  high: 'border-l-4 border-l-orange-400',
  medium: 'border-l-4 border-l-yellow-400',
  low: 'border-l-4 border-l-slate-300',
};

export default function TasksPage() {
  const qc = useQueryClient();
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Drag-and-drop state
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  // Modals state
  const [showCreate, setShowCreate] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [deletingTask, setDeletingTask] = useState<any>(null);

  // Form state
  const [form, setForm] = useState({
    title: '',
    project_id: '',
    assignee_id: '',
    status: 'todo',
    priority: 'medium',
    estimated_hours: '',
    due_date: '',
    description: '',
  });

  const [editForm, setEditForm] = useState<any>({});

  // Queries
  const { data, isLoading } = useQuery({
    queryKey: ['all-tasks', { page, search, project_id: projectFilter, assignee_id: assigneeFilter, priority: priorityFilter, status: statusFilter, viewMode }],
    queryFn: () => tasksApi.list({
      page: viewMode === 'board' ? 1 : page,
      limit: viewMode === 'board' ? 250 : 20,
      search: search || undefined,
      project_id: projectFilter || undefined,
      assignee_id: assigneeFilter || undefined,
      priority: priorityFilter || undefined,
      status: (viewMode === 'list' && statusFilter) ? statusFilter : undefined,
    }).then(r => r.data),
  });

  const { data: projectsData } = useQuery({
    queryKey: ['projects-mini'],
    queryFn: () => projectsApi.list({ limit: 100 }).then(r => r.data.data),
    staleTime: 60000,
  });

  const { data: usersData } = useQuery({
    queryKey: ['staff-mini'],
    queryFn: () => usersApi.list({ limit: 100 }).then(r => r.data.data),
    staleTime: 60000,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: () => tasksApi.create(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['all-tasks'] });
      qc.invalidateQueries({ queryKey: ['projects'] });
      qc.invalidateQueries({ queryKey: ['projects-summary'] });
      setShowCreate(false);
      setForm({
        title: '', project_id: '', assignee_id: '', status: 'todo',
        priority: 'medium', estimated_hours: '', due_date: '', description: '',
      });
      toast.success('Task created successfully');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => tasksApi.update(editingTask.id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['all-tasks'] });
      qc.invalidateQueries({ queryKey: ['projects'] });
      qc.invalidateQueries({ queryKey: ['projects-summary'] });
      setEditingTask(null);
      toast.success('Task updated successfully');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => tasksApi.update(id, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['all-tasks'] });
      qc.invalidateQueries({ queryKey: ['projects'] });
      qc.invalidateQueries({ queryKey: ['projects-summary'] });
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => tasksApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['all-tasks'] });
      qc.invalidateQueries({ queryKey: ['projects'] });
      qc.invalidateQueries({ queryKey: ['projects-summary'] });
      setDeletingTask(null);
      toast.success('Task deleted successfully');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const tasks = data?.data || [];

  const tasksByStatus = STATUSES.reduce((acc, s) => {
    acc[s.value] = tasks.filter((t: any) => t.status === s.value);
    return acc;
  }, {} as Record<string, any[]>);

  const openEditModal = (t: any) => {
    setEditingTask(t);
    setEditForm({
      title: t.title || '',
      project_id: t.project_id || '',
      assignee_id: t.assignee_id || '',
      status: t.status || 'todo',
      priority: t.priority || 'medium',
      estimated_hours: t.estimated_hours || '',
      due_date: t.due_date ? t.due_date.split('T')[0] : '',
      description: t.description || '',
    });
  };

  const projectOptions = [
    { value: '', label: 'All projects' },
    ...(projectsData || []).map((p: any) => ({
      value: p.id,
      label: `${p.name} (${p.code || 'PRJ'})`,
    })),
  ];

  const assigneeOptions = [
    { value: '', label: 'All assignees' },
    ...(usersData || []).map((u: any) => ({
      value: u.id,
      label: `${u.display_name || u.email} (${u.role || 'Staff'})`,
    })),
  ];

  // Quick transition rules
  const getNextTransitions = (currentStatus: string) => {
    switch (currentStatus) {
      case 'todo':
        return [
          { status: 'in_progress', label: '→ In Progress' },
          { status: 'in_review', label: '→ In Review' },
        ];
      case 'in_progress':
        return [
          { status: 'todo', label: '← To Do' },
          { status: 'in_review', label: '→ In Review' },
          { status: 'done', label: '→ Done' },
        ];
      case 'in_review':
        return [
          { status: 'in_progress', label: '← In Progress' },
          { status: 'done', label: '→ Done' },
          { status: 'blocked', label: '→ Blocked' },
        ];
      case 'done':
        return [
          { status: 'in_progress', label: '← In Progress' },
        ];
      case 'blocked':
        return [
          { status: 'todo', label: '→ To Do' },
          { status: 'in_progress', label: '→ In Progress' },
        ];
      default:
        return [];
    }
  };

  return (
    <DashboardLayout
      title="Tasks"
      breadcrumbs={[{ label: 'Projects', href: '/dashboard/projects' }, { label: 'Tasks' }]}
    >
      <div className="space-y-4">
        {/* Compact Aligned Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <SearchInput
            value={search}
            onChange={(val) => { setSearch(val); setPage(1); }}
            placeholder="Search tasks..."
            className="w-60 sm:w-64"
          />

          <Select
            options={projectOptions}
            value={projectFilter}
            onChange={(e) => { setProjectFilter(e.target.value); setPage(1); }}
            containerClassName="w-44"
          />

          <Select
            options={assigneeOptions}
            value={assigneeFilter}
            onChange={(e) => { setAssigneeFilter(e.target.value); setPage(1); }}
            containerClassName="w-40"
          />

          <Select
            options={[{ value: '', label: 'All priorities' }, ...PRIORITIES]}
            value={priorityFilter}
            onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}
            containerClassName="w-36"
          />

          {viewMode === 'list' && (
            <Select
              options={[{ value: '', label: 'All statuses' }, ...STATUSES.map(s => ({ value: s.value, label: s.label }))]}
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              containerClassName="w-36"
            />
          )}

          {(search || projectFilter || assigneeFilter || priorityFilter || statusFilter) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch('');
                setProjectFilter('');
                setAssigneeFilter('');
                setPriorityFilter('');
                setStatusFilter('');
                setPage(1);
              }}
              icon={<X className="w-3.5 h-3.5 text-slate-400" />}
              className="text-slate-500 hover:text-slate-700"
            >
              Clear
            </Button>
          )}

          <div className="ml-auto flex items-center gap-2.5">
            {/* View Mode Toggle */}
            <div className="flex rounded-lg border border-slate-200 overflow-hidden bg-white shadow-xs">
              <button
                type="button"
                onClick={() => setViewMode('board')}
                className={`px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  viewMode === 'board' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                Board
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  viewMode === 'list' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                List
              </button>
            </div>

            <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setShowCreate(true)}>
              Add Task
            </Button>
          </div>
        </div>

        {/* Kanban Board View */}
        {viewMode === 'board' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-start" style={{ minHeight: '75vh' }}>
            {STATUSES.map(col => (
              <div
                key={col.value}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (draggedTaskId) {
                    updateStatusMutation.mutate({ id: draggedTaskId, status: col.value });
                    setDraggedTaskId(null);
                  }
                }}
                className={`${col.color} border rounded-2xl p-3 min-h-[500px] flex flex-col transition-colors`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between mb-3 px-1">
                  <h3 className="text-sm font-bold text-slate-800">{col.label}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold shadow-xs ${col.countBadge}`}>
                    {tasksByStatus[col.value]?.length || 0}
                  </span>
                </div>

                {/* Column Tasks */}
                <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[75vh] pr-0.5">
                  {tasksByStatus[col.value]?.map((task: any) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={() => setDraggedTaskId(task.id)}
                      onDragEnd={() => setDraggedTaskId(null)}
                      onClick={() => openEditModal(task)}
                      className={`bg-white rounded-xl p-3.5 shadow-xs hover:shadow-md border border-slate-100 transition-all cursor-pointer group ${
                        PRIORITY_BORDER[task.priority] || ''
                      }`}
                    >
                      {/* Task Code */}
                      <p className="text-xs font-mono font-medium text-slate-400 mb-1 tracking-wider">
                        {task.task_number}
                      </p>

                      {/* Title */}
                      <p className="text-sm font-semibold text-slate-900 leading-snug group-hover:text-blue-600 transition-colors">
                        {truncate(task.title, 55)}
                      </p>

                      {/* Project Tag */}
                      {task.project_name && (
                        <p className="text-xs text-blue-600 font-medium mt-1 truncate">
                          {task.project_name}
                        </p>
                      )}

                      {/* Priority & Assignee Avatar */}
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-50">
                        <StatusBadge status={task.priority} />
                        {task.assignee_avatar || task.assignee_name ? (
                          <div className="flex items-center gap-1.5" title={`Assigned to ${task.assignee_name}`}>
                            <Avatar src={task.assignee_avatar} name={task.assignee_name} size="xs" />
                          </div>
                        ) : null}
                      </div>

                      {/* Due Date */}
                      {task.due_date && (
                        <div className="flex items-center gap-1 text-xs text-slate-400 mt-2">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(task.due_date)}</span>
                        </div>
                      )}

                      {/* Quick Status Transitions */}
                      <div className="mt-2.5 pt-2 border-t border-slate-50 flex flex-wrap gap-1" onClick={e => e.stopPropagation()}>
                        {getNextTransitions(col.value).map(tr => (
                          <button
                            key={tr.status}
                            type="button"
                            onClick={() => updateStatusMutation.mutate({ id: task.id, status: tr.status })}
                            className="text-[11px] text-slate-500 hover:text-blue-600 hover:bg-blue-50 px-2 py-0.5 rounded transition-colors font-medium border border-slate-100"
                          >
                            {tr.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}

                  {!tasksByStatus[col.value]?.length && (
                    <div className="text-center text-slate-400 text-xs py-8 border-2 border-dashed border-slate-200/60 rounded-xl">
                      Drop tasks here
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <Card padding={false}>
            <Table
              headers={['TASK', 'PROJECT', 'STATUS', 'PRIORITY', 'ASSIGNEE', 'DUE DATE', 'ESTIMATED', 'ACTIONS']}
              loading={isLoading}
              empty={!tasks.length}
              emptyMessage="No tasks found matching the filter criteria"
            >
              {tasks.map((t: any) => (
                <Tr key={t.id}>
                  <Td>
                    <div>
                      <p
                        onClick={() => openEditModal(t)}
                        className="font-medium text-slate-900 cursor-pointer hover:text-blue-600 transition-colors"
                      >
                        {t.title}
                      </p>
                      <span className="font-mono text-xs text-slate-400 tracking-wider">{t.task_number}</span>
                    </div>
                  </Td>
                  <Td>
                    <span className="text-sm text-slate-700">{t.project_name || '—'}</span>
                  </Td>
                  <Td>
                    <StatusBadge status={t.status} />
                  </Td>
                  <Td>
                    <StatusBadge status={t.priority} />
                  </Td>
                  <Td>
                    {t.assignee_name ? (
                      <div className="flex items-center gap-2">
                        <Avatar src={t.assignee_avatar} name={t.assignee_name} size="xs" />
                        <span className="text-sm text-slate-700">{t.assignee_name}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-sm">Unassigned</span>
                    )}
                  </Td>
                  <Td>
                    <span className="text-xs text-slate-600 whitespace-nowrap">
                      {t.due_date ? formatDate(t.due_date) : '—'}
                    </span>
                  </Td>
                  <Td>
                    <span className="text-xs font-mono text-slate-600">
                      {t.estimated_hours ? `${t.estimated_hours}h` : '—'}
                    </span>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-1 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Edit2 className="w-3.5 h-3.5 text-slate-500" />}
                        onClick={() => openEditModal(t)}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Trash2 className="w-3.5 h-3.5 text-red-500" />}
                        onClick={() => setDeletingTask(t)}
                      />
                    </div>
                  </Td>
                </Tr>
              ))}
            </Table>

            <Pagination
              page={page}
              totalPages={Math.ceil((data?.total || 0) / 20)}
              onPageChange={setPage}
              total={data?.total}
              limit={20}
            />
          </Card>
        )}
      </div>

      {/* Add Task Modal */}
      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Add New Task"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button
              loading={createMutation.isPending}
              disabled={!form.title.trim() || !form.project_id}
              onClick={() => createMutation.mutate()}
            >
              Create Task
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Input
              label="Task Title *"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Implement authentication middleware and session handler"
            />
          </div>

          <Select
            label="Project *"
            options={projectOptions.filter(p => p.value !== '')}
            value={form.project_id}
            onChange={e => setForm(f => ({ ...f, project_id: e.target.value }))}
            placeholder="Select project"
          />

          <Select
            label="Assigned Employee"
            options={assigneeOptions}
            value={form.assignee_id}
            onChange={e => setForm(f => ({ ...f, assignee_id: e.target.value }))}
          />

          <Select
            label="Status"
            options={STATUSES.map(s => ({ value: s.value, label: s.label }))}
            value={form.status}
            onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
          />

          <Select
            label="Priority"
            options={PRIORITIES}
            value={form.priority}
            onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
          />

          <Input
            label="Estimated Hours"
            type="number"
            step="0.5"
            value={form.estimated_hours}
            onChange={e => setForm(f => ({ ...f, estimated_hours: e.target.value }))}
            placeholder="e.g. 8"
          />

          <Input
            label="Due Date"
            type="date"
            value={form.due_date}
            onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
          />

          <div className="col-span-2">
            <Textarea
              label="Task Description"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={3}
              placeholder="Detailed acceptance criteria, technical guidelines, or notes..."
            />
          </div>
        </div>
      </Modal>

      {/* Edit Task Modal */}
      {editingTask && (
        <Modal
          open={!!editingTask}
          onClose={() => setEditingTask(null)}
          title={`Edit Task — ${editingTask.task_number}`}
          size="lg"
          footer={
            <>
              <Button variant="outline" onClick={() => setEditingTask(null)}>Cancel</Button>
              <Button
                loading={updateMutation.isPending}
                onClick={() => updateMutation.mutate(editForm)}
              >
                Save Changes
              </Button>
            </>
          }
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Input
                label="Task Title *"
                value={editForm.title}
                onChange={e => setEditForm((f: any) => ({ ...f, title: e.target.value }))}
              />
            </div>

            <Select
              label="Project"
              options={projectOptions.filter(p => p.value !== '')}
              value={editForm.project_id || ''}
              onChange={e => setEditForm((f: any) => ({ ...f, project_id: e.target.value }))}
            />

            <Select
              label="Assigned Employee"
              options={assigneeOptions}
              value={editForm.assignee_id || ''}
              onChange={e => setEditForm((f: any) => ({ ...f, assignee_id: e.target.value }))}
            />

            <Select
              label="Status"
              options={STATUSES.map(s => ({ value: s.value, label: s.label }))}
              value={editForm.status || 'todo'}
              onChange={e => setEditForm((f: any) => ({ ...f, status: e.target.value }))}
            />

            <Select
              label="Priority"
              options={PRIORITIES}
              value={editForm.priority || 'medium'}
              onChange={e => setEditForm((f: any) => ({ ...f, priority: e.target.value }))}
            />

            <Input
              label="Estimated Hours"
              type="number"
              step="0.5"
              value={editForm.estimated_hours || ''}
              onChange={e => setEditForm((f: any) => ({ ...f, estimated_hours: e.target.value }))}
            />

            <Input
              label="Due Date"
              type="date"
              value={editForm.due_date || ''}
              onChange={e => setEditForm((f: any) => ({ ...f, due_date: e.target.value }))}
            />

            <div className="col-span-2">
              <Textarea
                label="Task Description"
                value={editForm.description || ''}
                onChange={e => setEditForm((f: any) => ({ ...f, description: e.target.value }))}
                rows={3}
              />
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Task Confirmation Modal */}
      {deletingTask && (
        <Modal
          open={!!deletingTask}
          onClose={() => setDeletingTask(null)}
          title="Delete Task"
          size="sm"
          footer={
            <>
              <Button variant="outline" onClick={() => setDeletingTask(null)}>Cancel</Button>
              <Button
                variant="danger"
                loading={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(deletingTask.id)}
              >
                Delete Task
              </Button>
            </>
          }
        >
          <p className="text-sm text-slate-600">
            Are you sure you want to delete task <strong className="text-slate-900">{deletingTask.title}</strong> ({deletingTask.task_number})?
            This will remove the task and update project progress accordingly.
          </p>
        </Modal>
      )}
    </DashboardLayout>
  );
}
