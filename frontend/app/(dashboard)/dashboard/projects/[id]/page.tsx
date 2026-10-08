'use client';

import { useState } from 'react';
import { use } from 'react';
import { DashboardLayout } from '@/app/(dashboard)/_components/layout/DashboardLayout';
import { Card, Button, StatusBadge, Modal, Input, Select, Textarea, TabBar, PageLoader, Badge, Avatar, Table, Tr, Td } from '@/components/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi, tasksApi } from '@/lib/api';
import { formatDate, formatCurrency, timeAgo, extractApiError } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Plus, CheckSquare, Clock, Users, Paperclip, Flag, Calendar } from 'lucide-react';
import Link from 'next/link';

const TASK_STATUSES = [
  { value: 'todo', label: 'To Do' }, { value: 'in_progress', label: 'In Progress' },
  { value: 'in_review', label: 'In Review' }, { value: 'done', label: 'Done' }, { value: 'blocked', label: 'Blocked' },
];
const PRIORITIES = [
  { value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' }, { value: 'critical', label: 'Critical' },
];

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const qc = useQueryClient();
  const [tab, setTab] = useState('overview');
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', type: 'task', priority: 'medium', status: 'todo', estimated_hours: '', due_date: '' });
  const [memberForm, setMemberForm] = useState({ user_id: '', role: 'member' });

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectsApi.get(id).then(r => r.data.data),
  });

  const { data: tasksData } = useQuery({
    queryKey: ['project-tasks', id],
    queryFn: () => tasksApi.list({ project_id: id, limit: 50 }).then(r => r.data),
    enabled: tab === 'tasks' || tab === 'overview',
  });

  const addTaskMutation = useMutation({
    mutationFn: () => tasksApi.create({ ...taskForm, project_id: id }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['project-tasks', id] }); setShowAddTask(false); toast.success('Task created'); },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ status }: { status: string }) => projectsApi.update(id, { status }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['project', id] }); toast.success('Status updated'); },
  });

  if (isLoading) return <DashboardLayout title="Project"><PageLoader /></DashboardLayout>;
  if (!project) return <DashboardLayout title="Not Found"><p>Project not found</p></DashboardLayout>;

  const tasks = tasksData?.data || [];
  const taskSummary = project.task_summary || [];
  const totalTasks = taskSummary.reduce((a: number, t: any) => a + Number(t.count), 0);
  const doneTasks = taskSummary.find((t: any) => t.status === 'done')?.count || 0;

  return (
    <DashboardLayout breadcrumbs={[{ label: 'Projects', href: '/dashboard/projects' }, { label: project.name }]}>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <div className="mb-4">
              <span className="font-mono text-xs text-slate-400">{project.code}</span>
              <h2 className="text-lg font-semibold text-slate-900 mt-1">{project.name}</h2>
              {project.description && <p className="text-sm text-slate-500 mt-1">{project.description}</p>}
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Status</span>
                <StatusBadge status={project.status} />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Priority</span>
                <StatusBadge status={project.priority} />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Health</span>
                <StatusBadge status={project.health_status || 'on_track'} />
              </div>
              {project.client_name && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Client</span>
                  <span className="text-slate-800 font-medium">{project.client_name}</span>
                </div>
              )}
              {project.budget && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Budget</span>
                  <span className="text-slate-800 font-medium">{formatCurrency(project.budget, project.currency)}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Start</span>
                <span className="text-slate-800">{formatDate(project.start_date)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">End</span>
                <span className="text-slate-800">{formatDate(project.end_date)}</span>
              </div>
            </div>

            {/* Progress */}
            <div className="mt-4">
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>Progress</span>
                <span>{project.progress_percent || 0}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full">
                <div className="h-2 bg-blue-600 rounded-full transition-all" style={{ width: `${project.progress_percent || 0}%` }} />
              </div>
            </div>

            {/* Update Status */}
            <div className="mt-4">
              <Select
                options={[
                  { value: 'planning', label: 'Planning' }, { value: 'in_progress', label: 'In Progress' },
                  { value: 'on_hold', label: 'On Hold' }, { value: 'completed', label: 'Completed' },
                ]}
                value={project.status}
                onChange={e => updateStatusMutation.mutate({ status: e.target.value })}
                label="Update Status"
              />
            </div>
          </Card>

          {/* Team */}
          <Card>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-700">Team</h3>
              <Button variant="ghost" size="sm" icon={<Plus className="w-3 h-3" />} onClick={() => setShowAddMember(true)}>Add</Button>
            </div>
            <div className="space-y-2">
              {project.members?.map((m: any) => (
                <div key={m.user_id} className="flex items-center gap-2">
                  <Avatar src={m.avatar_url} name={m.display_name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-800 truncate">{m.display_name}</p>
                    <p className="text-xs text-slate-500 capitalize">{m.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Main content */}
        <div className="lg:col-span-3 space-y-4">
          <TabBar
            tabs={[
              { id: 'overview', label: 'Overview' },
              { id: 'tasks', label: 'Tasks', count: totalTasks },
              { id: 'milestones', label: 'Milestones', count: project.milestones?.length },
              { id: 'files', label: 'Files', count: 0 },
            ]}
            active={tab}
            onChange={setTab}
          />

          {tab === 'overview' && (
            <div className="space-y-4">
              {/* Task Status Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {TASK_STATUSES.map(s => {
                  const count = taskSummary.find((t: any) => t.status === s.value)?.count || 0;
                  return (
                    <div key={s.value} className="bg-white rounded-xl border border-slate-200 p-3 text-center">
                      <p className="text-2xl font-bold text-slate-900">{count}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
                    </div>
                  );
                })}
              </div>

              {/* Recent Activity */}
              <Card padding={false}>
                <div className="p-4 border-b border-slate-100">
                  <h3 className="text-sm font-semibold text-slate-700">Recent Activity</h3>
                </div>
                <div className="divide-y divide-slate-100">
                  {project.recent_activity?.map((a: any) => (
                    <div key={a.id} className="px-4 py-3 text-sm">
                      <span className="text-slate-800">{a.action}</span>
                      <span className="text-slate-400 ml-2">{timeAgo(a.created_at)}</span>
                    </div>
                  ))}
                  {!project.recent_activity?.length && (
                    <p className="text-center text-slate-500 text-sm py-6">No activity yet</p>
                  )}
                </div>
              </Card>
            </div>
          )}

          {tab === 'tasks' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setShowAddTask(true)}>Add Task</Button>
              </div>
              <Card padding={false}>
                <Table
                  headers={['Task', 'Status', 'Priority', 'Assignee', 'Due Date', 'Hours']}
                  empty={!tasks.length}
                  emptyMessage="No tasks yet"
                >
                  {tasks.map((t: any) => (
                    <Tr key={t.id}>
                      <Td>
                        <div>
                          <p className="font-medium text-slate-800">{t.title}</p>
                          <p className="text-xs text-slate-400 font-mono">{t.task_number}</p>
                        </div>
                      </Td>
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
              </Card>
            </div>
          )}

          {tab === 'milestones' && (
            <div className="space-y-3">
              {project.milestones?.map((m: any) => (
                <Card key={m.id} className="!p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${m.status === 'completed' ? 'bg-green-500' : m.status === 'overdue' ? 'bg-red-500' : 'bg-blue-500'}`} />
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{m.name}</p>
                      {m.description && <p className="text-sm text-slate-500">{m.description}</p>}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-600">{formatDate(m.due_date)}</p>
                      {m.amount > 0 && <p className="text-sm font-medium text-green-700">{formatCurrency(m.amount)}</p>}
                    </div>
                    <StatusBadge status={m.status} />
                  </div>
                </Card>
              ))}
              {!project.milestones?.length && (
                <p className="text-center text-slate-500 text-sm py-8">No milestones defined</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add Task Modal */}
      <Modal open={showAddTask} onClose={() => setShowAddTask(false)} title="Add Task" size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowAddTask(false)}>Cancel</Button>
            <Button loading={addTaskMutation.isPending} onClick={() => addTaskMutation.mutate()}>Create Task</Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Input label="Title *" value={taskForm.title} onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))} />
          </div>
          <Select label="Priority" options={PRIORITIES} value={taskForm.priority} onChange={e => setTaskForm(f => ({ ...f, priority: e.target.value }))} />
          <Select label="Status" options={TASK_STATUSES} value={taskForm.status} onChange={e => setTaskForm(f => ({ ...f, status: e.target.value }))} />
          <Input label="Estimated Hours" type="number" value={taskForm.estimated_hours} onChange={e => setTaskForm(f => ({ ...f, estimated_hours: e.target.value }))} />
          <Input label="Due Date" type="date" value={taskForm.due_date} onChange={e => setTaskForm(f => ({ ...f, due_date: e.target.value }))} />
          <div className="col-span-2">
            <Textarea label="Description" value={taskForm.description} onChange={e => setTaskForm(f => ({ ...f, description: e.target.value }))} rows={3} />
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
