'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/app/(dashboard)/_components/layout/DashboardLayout';
import {
  Card, Button, Table, Tr, Td, Pagination, Modal, Input, Select, Textarea, StatCard
} from '@/components/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { timeApi, projectsApi, tasksApi } from '@/lib/api';
import { formatDate, extractApiError } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Plus, Clock, Trash2, Edit2, Timer } from 'lucide-react';

export default function TimeTrackingPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);

  // Modals state
  const [showLog, setShowLog] = useState(false);
  const [showStartModal, setShowStartModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [deletingEntry, setDeletingEntry] = useState<any>(null);

  // Manual log form
  const [form, setForm] = useState({
    project_id: '',
    task_id: '',
    description: '',
    hours: '',
    date: new Date().toISOString().split('T')[0],
    billable: true,
  });

  // Live timer form & state
  const [timerForm, setTimerForm] = useState({
    project_id: '',
    task_id: '',
    description: '',
    billable: true,
  });

  const [editForm, setEditForm] = useState<any>({});
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);

  // Queries
  const { data: myEntries, isLoading } = useQuery({
    queryKey: ['my-time-entries', { page }],
    queryFn: () => timeApi.myEntries({ page, limit: 20 }).then(r => r.data),
  });

  const { data: summaryData } = useQuery({
    queryKey: ['time-summary'],
    queryFn: () => timeApi.summary().then(r => r.data.data),
  });

  const { data: activeTimerData } = useQuery({
    queryKey: ['active-timer'],
    queryFn: () => timeApi.active().then(r => r.data.data),
    refetchInterval: 15000,
  });

  const activeTimer = activeTimerData?.active_timer;

  const { data: projectsData } = useQuery({
    queryKey: ['projects-list-mini'],
    queryFn: () => projectsApi.list({ limit: 100 }).then(r => r.data.data),
    staleTime: 60000,
  });

  // Tasks for manual log
  const { data: logTasksData } = useQuery({
    queryKey: ['tasks-mini-log', form.project_id],
    queryFn: () => tasksApi.list({ project_id: form.project_id, limit: 100 }).then(r => r.data.data),
    enabled: !!form.project_id,
  });

  // Tasks for timer
  const { data: timerTasksData } = useQuery({
    queryKey: ['timer-tasks-mini', timerForm.project_id],
    queryFn: () => tasksApi.list({ project_id: timerForm.project_id, limit: 100 }).then(r => r.data.data),
    enabled: !!timerForm.project_id,
  });

  // Tasks for edit modal
  const { data: editTasksData } = useQuery({
    queryKey: ['tasks-mini-edit', editForm.project_id],
    queryFn: () => tasksApi.list({ project_id: editForm.project_id, limit: 100 }).then(r => r.data.data),
    enabled: !!editForm.project_id,
  });

  // Authoritative server timer synchronization
  useEffect(() => {
    if (activeTimer) {
      setTimerRunning(true);
      const serverStarted = new Date(activeTimer.started_at).getTime();
      const currentServer = activeTimerData?.server_time
        ? new Date(activeTimerData.server_time).getTime()
        : Date.now();
      const initialSeconds = Math.max(0, Math.floor((currentServer - serverStarted) / 1000));
      setTimerSeconds(initialSeconds);

      const interval = setInterval(() => {
        setTimerSeconds(s => s + 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setTimerRunning(false);
      setTimerSeconds(0);
    }
  }, [activeTimer, activeTimerData?.server_time]);

  // Mutations
  const startTimerMutation = useMutation({
    mutationFn: (data: any) => timeApi.start(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['active-timer'] });
      setShowStartModal(false);
      setTimerForm({ project_id: '', task_id: '', description: '', billable: true });
      toast.success('Live timer started');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const stopTimerMutation = useMutation({
    mutationFn: () => timeApi.stop(),
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ['active-timer'] });
      qc.invalidateQueries({ queryKey: ['my-time-entries'] });
      qc.invalidateQueries({ queryKey: ['time-summary'] });
      qc.invalidateQueries({ queryKey: ['projects'] });
      setTimerRunning(false);
      setTimerSeconds(0);
      toast.success(`Logged ${res.data?.data?.hours || ''} hours successfully`);
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const createMutation = useMutation({
    mutationFn: () => timeApi.create({ ...form, hours: parseFloat(form.hours) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-time-entries'] });
      qc.invalidateQueries({ queryKey: ['time-summary'] });
      qc.invalidateQueries({ queryKey: ['projects'] });
      setShowLog(false);
      setForm({
        project_id: '', task_id: '', description: '', hours: '',
        date: new Date().toISOString().split('T')[0], billable: true,
      });
      toast.success('Time entry logged successfully');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => timeApi.update(editingEntry.id, {
      description: data.description,
      hours: parseFloat(data.hours),
      billable: data.billable,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-time-entries'] });
      qc.invalidateQueries({ queryKey: ['time-summary'] });
      qc.invalidateQueries({ queryKey: ['projects'] });
      setEditingEntry(null);
      toast.success('Time entry updated successfully');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => timeApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-time-entries'] });
      qc.invalidateQueries({ queryKey: ['time-summary'] });
      qc.invalidateQueries({ queryKey: ['projects'] });
      setDeletingEntry(null);
      toast.success('Time entry deleted successfully');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const entries = myEntries?.data || [];
  const totalPages = Math.ceil((myEntries?.total || 0) / 20);

  const formatTimer = (s: number) => {
    const h = Math.floor(s / 3600).toString().padStart(2, '0');
    const m = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${h}:${m}:${sec}`;
  };

  const openEditModal = (entry: any) => {
    setEditingEntry(entry);
    setEditForm({
      project_id: entry.project_id || '',
      task_id: entry.task_id || '',
      hours: entry.hours ? entry.hours.toString() : '',
      description: entry.description || '',
      billable: entry.billable !== undefined ? entry.billable : entry.is_billable,
    });
  };

  const projectOptions = (projectsData || []).map((p: any) => ({
    value: p.id,
    label: `${p.name} (${p.code || 'PRJ'})`,
  }));

  return (
    <DashboardLayout
      title="Time Tracking"
      breadcrumbs={[{ label: 'Projects', href: '/dashboard/projects' }, { label: 'Time Tracking' }]}
    >
      <div className="space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="Hours This Week"
            value={`${(summaryData?.this_week || 0).toFixed(1)}h`}
            icon={<Clock className="w-5 h-5" />}
            color="blue"
          />
          <StatCard
            title="Hours This Month"
            value={`${(summaryData?.this_month || 0).toFixed(1)}h`}
            icon={<Clock className="w-5 h-5" />}
            color="green"
          />
          <StatCard
            title="Billable Hours"
            value={`${(summaryData?.billable_hours || 0).toFixed(1)}h`}
            icon={<Timer className="w-5 h-5" />}
            color="purple"
          />
          <StatCard
            title="Total Entries"
            value={summaryData?.total_entries ?? myEntries?.total ?? 0}
            icon={<Clock className="w-5 h-5" />}
            color="orange"
          />
        </div>

        {/* Live Timer Card */}
        <Card>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Live Timer {activeTimer?.project_name ? `— ${activeTimer.project_name}` : ''}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {activeTimer
                  ? `Tracking: ${activeTimer.description || activeTimer.task_title || 'Active Session'}`
                  : 'Start a timer and log it as a time entry when done'}
              </p>
            </div>

            <div className="flex items-center gap-6">
              <div
                className={`text-4xl font-mono font-bold tracking-wider ${
                  timerRunning ? 'text-blue-600 animate-pulse' : 'text-slate-300'
                }`}
              >
                {formatTimer(timerSeconds)}
              </div>

              <div>
                {!timerRunning ? (
                  <Button
                    icon={<Timer className="w-4 h-4" />}
                    onClick={() => setShowStartModal(true)}
                  >
                    Start Timer
                  </Button>
                ) : (
                  <Button
                    variant="danger"
                    loading={stopTimerMutation.isPending}
                    onClick={() => stopTimerMutation.mutate()}
                  >
                    Stop & Log
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* My Time Entries Table */}
        <Card padding={false}>
          <div className="flex items-center justify-between p-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-base">My Time Entries</h3>
            <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setShowLog(true)}>
              Log Time
            </Button>
          </div>

          <Table
            headers={['DATE', 'PROJECT', 'TASK', 'DESCRIPTION', 'HOURS', 'BILLABLE', 'ACTIONS']}
            loading={isLoading}
            empty={!entries.length}
            emptyMessage="No time entries logged yet. Click 'Log Time' or start a Live Timer above."
          >
            {entries.map((e: any) => (
              <Tr key={e.id}>
                <Td>
                  <span className="text-xs text-slate-700 font-medium whitespace-nowrap">
                    {formatDate(e.date || e.started_at)}
                  </span>
                </Td>
                <Td>
                  <div>
                    <span className="font-medium text-slate-900 text-sm">{e.project_name}</span>
                    {e.project_code && (
                      <p className="text-[11px] font-mono text-slate-400">{e.project_code}</p>
                    )}
                  </div>
                </Td>
                <Td>
                  <span className="text-sm text-slate-700">{e.task_title || '—'}</span>
                </Td>
                <Td>
                  <span className="text-sm text-slate-600 max-w-xs truncate block" title={e.description || ''}>
                    {e.description || '—'}
                  </span>
                </Td>
                <Td>
                  <span className="font-bold text-blue-600 text-sm font-mono">
                    {parseFloat(e.hours).toFixed(2)}h
                  </span>
                </Td>
                <Td>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-medium inline-block ${
                      e.billable
                        ? 'bg-green-100 text-green-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {e.billable ? 'Billable' : 'Non-billable'}
                  </span>
                </Td>
                <Td>
                  <div className="flex items-center gap-1 justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Edit2 className="w-3.5 h-3.5 text-slate-500" />}
                      onClick={() => openEditModal(e)}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Trash2 className="w-3.5 h-3.5 text-red-500" />}
                      onClick={() => setDeletingEntry(e)}
                    />
                  </div>
                </Td>
              </Tr>
            ))}
          </Table>

          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            total={myEntries?.total}
            limit={20}
          />
        </Card>
      </div>

      {/* Start Timer Modal */}
      <Modal
        open={showStartModal}
        onClose={() => setShowStartModal(false)}
        title="Start Live Timer"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowStartModal(false)}>Cancel</Button>
            <Button
              loading={startTimerMutation.isPending}
              disabled={!timerForm.project_id}
              onClick={() => startTimerMutation.mutate(timerForm)}
            >
              Start Timer
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            label="Project *"
            options={[{ value: '', label: 'Select project' }, ...projectOptions]}
            value={timerForm.project_id}
            onChange={e => setTimerForm(f => ({ ...f, project_id: e.target.value, task_id: '' }))}
          />

          {timerForm.project_id && (
            <Select
              label="Task (Optional)"
              options={[
                { value: '', label: 'Select task (optional)' },
                ...(timerTasksData || []).map((t: any) => ({ value: t.id, label: t.title }))
              ]}
              value={timerForm.task_id}
              onChange={e => setTimerForm(f => ({ ...f, task_id: e.target.value }))}
            />
          )}

          <Input
            label="Description (Optional)"
            value={timerForm.description}
            onChange={e => setTimerForm(f => ({ ...f, description: e.target.value }))}
            placeholder="What will you work on during this session?"
          />

          <label className="flex items-center gap-2 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={timerForm.billable}
              onChange={e => setTimerForm(f => ({ ...f, billable: e.target.checked }))}
              className="rounded text-blue-600 border-slate-300"
            />
            <span className="text-sm font-medium text-slate-700">Mark session as billable hours</span>
          </label>
        </div>
      </Modal>

      {/* Log Time Modal */}
      <Modal
        open={showLog}
        onClose={() => setShowLog(false)}
        title="Log Time Entry"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowLog(false)}>Cancel</Button>
            <Button
              loading={createMutation.isPending}
              disabled={!form.project_id || !form.hours || parseFloat(form.hours) <= 0}
              onClick={() => createMutation.mutate()}
            >
              Log Time
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            label="Project *"
            options={[{ value: '', label: 'Select project' }, ...projectOptions]}
            value={form.project_id}
            onChange={e => setForm(f => ({ ...f, project_id: e.target.value, task_id: '' }))}
          />

          {form.project_id && (
            <Select
              label="Task (Optional)"
              options={[
                { value: '', label: 'Select task (optional)' },
                ...(logTasksData || []).map((t: any) => ({ value: t.id, label: t.title }))
              ]}
              value={form.task_id}
              onChange={e => setForm(f => ({ ...f, task_id: e.target.value }))}
            />
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Date *"
              type="date"
              value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            />
            <Input
              label="Hours *"
              type="number"
              step="0.25"
              min="0.1"
              value={form.hours}
              onChange={e => setForm(f => ({ ...f, hours: e.target.value }))}
              placeholder="e.g. 2.5"
            />
          </div>

          <Textarea
            label="Description"
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            rows={2}
            placeholder="Summary of work completed..."
          />

          <label className="flex items-center gap-2 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={form.billable}
              onChange={e => setForm(f => ({ ...f, billable: e.target.checked }))}
              className="rounded text-blue-600 border-slate-300"
            />
            <span className="text-sm font-medium text-slate-700">Mark as billable hours</span>
          </label>
        </div>
      </Modal>

      {/* Edit Entry Modal */}
      {editingEntry && (
        <Modal
          open={!!editingEntry}
          onClose={() => setEditingEntry(null)}
          title={`Edit Time Entry — ${editingEntry.project_name || 'Project'}`}
          footer={
            <>
              <Button variant="outline" onClick={() => setEditingEntry(null)}>Cancel</Button>
              <Button
                loading={updateMutation.isPending}
                disabled={!editForm.hours || parseFloat(editForm.hours) <= 0}
                onClick={() => updateMutation.mutate(editForm)}
              >
                Save Changes
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <Input
              label="Hours *"
              type="number"
              step="0.25"
              min="0.1"
              value={editForm.hours}
              onChange={e => setEditForm((f: any) => ({ ...f, hours: e.target.value }))}
            />

            <Textarea
              label="Description"
              value={editForm.description || ''}
              onChange={e => setEditForm((f: any) => ({ ...f, description: e.target.value }))}
              rows={2}
            />

            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={editForm.billable}
                onChange={e => setEditForm((f: any) => ({ ...f, billable: e.target.checked }))}
                className="rounded text-blue-600 border-slate-300"
              />
              <span className="text-sm font-medium text-slate-700">Billable hours</span>
            </label>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deletingEntry && (
        <Modal
          open={!!deletingEntry}
          onClose={() => setDeletingEntry(null)}
          title="Delete Time Entry"
          size="sm"
          footer={
            <>
              <Button variant="outline" onClick={() => setDeletingEntry(null)}>Cancel</Button>
              <Button
                variant="danger"
                loading={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(deletingEntry.id)}
              >
                Delete Entry
              </Button>
            </>
          }
        >
          <p className="text-sm text-slate-600">
            Are you sure you want to delete this {parseFloat(deletingEntry.hours).toFixed(2)}h time entry for{' '}
            <strong className="text-slate-900">{deletingEntry.project_name}</strong>?
            Project hour balances will be recalculated automatically.
          </p>
        </Modal>
      )}
    </DashboardLayout>
  );
}
