'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/app/(dashboard)/_components/layout/DashboardLayout';
import { Card, Button, Table, Tr, Td, Pagination, Modal, Input, Select, Textarea, StatCard } from '@/components/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { timeApi, projectsApi, tasksApi } from '@/lib/api';
import { formatDate, formatNumber, extractApiError } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Plus, Clock, Trash2, Edit2, Timer } from 'lucide-react';
import { useAuthStore } from '@/store/auth';

export default function TimeTrackingPage() {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const [page, setPage] = useState(1);
  const [showLog, setShowLog] = useState(false);
  const [editEntry, setEditEntry] = useState<any>(null);
  const [form, setForm] = useState({ project_id: '', task_id: '', description: '', hours: '', date: new Date().toISOString().split('T')[0], billable: true });
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);

  const { data: myEntries, isLoading } = useQuery({
    queryKey: ['my-time-entries', { page }],
    queryFn: () => timeApi.myEntries({ page, limit: 20 }).then(r => r.data),
  });

  const { data: summaryData } = useQuery({
    queryKey: ['time-summary'],
    queryFn: () => timeApi.summary().then(r => r.data.data),
  });

  const { data: projectsData } = useQuery({
    queryKey: ['projects-list-mini'],
    queryFn: () => projectsApi.list({ limit: 100 }).then(r => r.data.data),
  });

  const { data: tasksData } = useQuery({
    queryKey: ['tasks-mini', form.project_id],
    queryFn: () => tasksApi.list({ project_id: form.project_id, limit: 100 }).then(r => r.data.data),
    enabled: !!form.project_id,
  });

  const createMutation = useMutation({
    mutationFn: () => timeApi.create({ ...form, hours: parseFloat(form.hours) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['my-time-entries'] }); qc.invalidateQueries({ queryKey: ['time-summary'] }); setShowLog(false); toast.success('Time logged'); },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const updateMutation = useMutation({
    mutationFn: () => timeApi.update(editEntry.id, { description: editEntry.description, hours: parseFloat(editEntry.hours), billable: editEntry.billable }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['my-time-entries'] }); setEditEntry(null); toast.success('Entry updated'); },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => timeApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['my-time-entries'] }); toast.success('Entry deleted'); },
  });

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));
  const entries = myEntries?.data || [];
  const totalPages = Math.ceil((myEntries?.total || 0) / 20);

  // Timer logic (simple front-end timer)
  const startTimer = () => {
    setTimerRunning(true);
    const start = Date.now() - timerSeconds * 1000;
    const interval = setInterval(() => {
      setTimerSeconds(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    (window as any).__timerInterval = interval;
  };

  const stopTimer = () => {
    setTimerRunning(false);
    clearInterval((window as any).__timerInterval);
    const hours = (timerSeconds / 3600).toFixed(2);
    set('hours', hours);
    setShowLog(true);
    setTimerSeconds(0);
  };

  const formatTimer = (s: number) => {
    const h = Math.floor(s / 3600).toString().padStart(2, '0');
    const m = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${h}:${m}:${sec}`;
  };

  return (
    <DashboardLayout title="Time Tracking" breadcrumbs={[{ label: 'Projects', href: '/dashboard/projects' }, { label: 'Time Tracking' }]}>
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Hours This Week" value={`${(summaryData?.this_week || 0).toFixed(1)}h`} icon={<Clock className="w-5 h-5" />} color="blue" />
          <StatCard title="Hours This Month" value={`${(summaryData?.this_month || 0).toFixed(1)}h`} icon={<Clock className="w-5 h-5" />} color="green" />
          <StatCard title="Billable Hours" value={`${(summaryData?.billable_hours || 0).toFixed(1)}h`} icon={<Timer className="w-5 h-5" />} color="purple" />
          <StatCard title="Total Entries" value={myEntries?.total || 0} icon={<Clock className="w-5 h-5" />} color="orange" />
        </div>

        {/* Timer widget */}
        <Card>
          <div className="flex items-center gap-6">
            <div className="flex-1">
              <h3 className="font-semibold text-slate-800 mb-1">Live Timer</h3>
              <p className="text-xs text-slate-500">Start a timer and log it as a time entry when done</p>
            </div>
            <div className={`text-4xl font-mono font-bold ${timerRunning ? 'text-blue-600' : 'text-slate-300'}`}>
              {formatTimer(timerSeconds)}
            </div>
            <div className="flex gap-2">
              {!timerRunning ? (
                <Button icon={<Timer className="w-4 h-4" />} onClick={startTimer}>Start Timer</Button>
              ) : (
                <Button variant="danger" onClick={stopTimer}>Stop & Log</Button>
              )}
            </div>
          </div>
        </Card>

        {/* Time entries table */}
        <Card padding={false}>
          <div className="flex items-center justify-between p-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800">My Time Entries</h3>
            <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setShowLog(true)}>Log Time</Button>
          </div>
          <Table
            headers={['Date', 'Project', 'Task', 'Description', 'Hours', 'Billable', '']}
            loading={isLoading}
            empty={!entries.length}
            emptyMessage="No time entries yet"
          >
            {entries.map((e: any) => (
              <Tr key={e.id}>
                <Td>{formatDate(e.date)}</Td>
                <Td className="font-medium">{e.project_name}</Td>
                <Td>{e.task_title || '—'}</Td>
                <Td className="max-w-xs truncate">{e.description || '—'}</Td>
                <Td>
                  <span className="font-semibold text-blue-700">{parseFloat(e.hours).toFixed(2)}h</span>
                </Td>
                <Td>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${e.billable ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                    {e.billable ? 'Billable' : 'Non-billable'}
                  </span>
                </Td>
                <Td>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" icon={<Edit2 className="w-3.5 h-3.5" />}
                      onClick={() => setEditEntry({ ...e, hours: e.hours?.toString() })} />
                    <Button variant="ghost" size="sm" icon={<Trash2 className="w-3.5 h-3.5 text-red-500" />}
                      onClick={() => confirm('Delete entry?') && deleteMutation.mutate(e.id)} />
                  </div>
                </Td>
              </Tr>
            ))}
          </Table>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} total={myEntries?.total} limit={20} />
        </Card>
      </div>

      {/* Log Time Modal */}
      <Modal
        open={showLog}
        onClose={() => setShowLog(false)}
        title="Log Time"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowLog(false)}>Cancel</Button>
            <Button loading={createMutation.isPending} onClick={() => createMutation.mutate()}>Log Time</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            label="Project *"
            options={projectsData?.map((p: any) => ({ value: p.id, label: p.name })) || []}
            value={form.project_id}
            onChange={e => set('project_id', e.target.value)}
            placeholder="Select project"
          />
          {form.project_id && (
            <Select
              label="Task"
              options={tasksData?.map((t: any) => ({ value: t.id, label: t.title })) || []}
              value={form.task_id}
              onChange={e => set('task_id', e.target.value)}
              placeholder="Select task (optional)"
            />
          )}
          <div className="grid grid-cols-2 gap-3">
            <Input label="Date" type="date" value={form.date} onChange={e => set('date', e.target.value)} />
            <Input label="Hours *" type="number" step="0.25" min="0" value={form.hours} onChange={e => set('hours', e.target.value)} placeholder="e.g. 2.5" />
          </div>
          <Textarea label="Description" value={form.description} onChange={e => set('description', e.target.value)} rows={2} placeholder="What did you work on?" />
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.billable} onChange={e => set('billable', e.target.checked)} className="rounded" />
            <span className="text-sm text-slate-700">Billable hours</span>
          </label>
        </div>
      </Modal>

      {/* Edit Entry Modal */}
      {editEntry && (
        <Modal
          open={!!editEntry}
          onClose={() => setEditEntry(null)}
          title="Edit Time Entry"
          footer={
            <>
              <Button variant="outline" onClick={() => setEditEntry(null)}>Cancel</Button>
              <Button loading={updateMutation.isPending} onClick={() => updateMutation.mutate()}>Save</Button>
            </>
          }
        >
          <div className="space-y-4">
            <Input label="Hours" type="number" step="0.25" value={editEntry.hours} onChange={e => setEditEntry((en: any) => ({ ...en, hours: e.target.value }))} />
            <Textarea label="Description" value={editEntry.description || ''} onChange={e => setEditEntry((en: any) => ({ ...en, description: e.target.value }))} rows={2} />
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={editEntry.billable} onChange={e => setEditEntry((en: any) => ({ ...en, billable: e.target.checked }))} className="rounded" />
              <span className="text-sm text-slate-700">Billable</span>
            </label>
          </div>
        </Modal>
      )}
    </DashboardLayout>
  );
}
