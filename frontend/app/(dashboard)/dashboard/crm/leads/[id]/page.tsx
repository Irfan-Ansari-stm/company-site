'use client';

import { useState } from 'react';
import { use } from 'react';
import { DashboardLayout } from '@/app/(dashboard)/_components/layout/DashboardLayout';
import { Card, Button, StatusBadge, Modal, Input, Select, Textarea, TabBar, PageLoader, Badge } from '@/components/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { crmApi } from '@/lib/api';
import { formatDate, formatCurrency, timeAgo, extractApiError } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Mail, Phone, Globe, Building2, Calendar, MessageSquare, Activity, FileText, Video, ArrowRight } from 'lucide-react';

const STAGES = [
  { value: 'new', label: 'New' }, { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' }, { value: 'proposal', label: 'Proposal' },
  { value: 'negotiation', label: 'Negotiation' }, { value: 'won', label: 'Won' }, { value: 'lost', label: 'Lost' },
];

const ACTIVITY_TYPES = [
  { value: 'call', label: 'Call' }, { value: 'email', label: 'Email' },
  { value: 'meeting', label: 'Meeting' }, { value: 'note', label: 'Note' },
  { value: 'task', label: 'Task' }, { value: 'demo', label: 'Demo' },
];

export default function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const qc = useQueryClient();
  const [tab, setTab] = useState('overview');
  const [noteContent, setNoteContent] = useState('');
  const [activityForm, setActivityForm] = useState({ activity_type: 'call', subject: '', description: '', outcome: '' });
  const [showUpdateStage, setShowUpdateStage] = useState(false);
  const [newStage, setNewStage] = useState('');

  const { data: lead, isLoading } = useQuery({
    queryKey: ['lead', id],
    queryFn: () => crmApi.getLead(id).then(r => r.data.data),
  });

  const addNoteMutation = useMutation({
    mutationFn: () => crmApi.addLeadNote(id, { content: noteContent }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['lead', id] }); setNoteContent(''); toast.success('Note added'); },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const addActivityMutation = useMutation({
    mutationFn: () => crmApi.addLeadActivity(id, activityForm),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['lead', id] }); setActivityForm({ activity_type: 'call', subject: '', description: '', outcome: '' }); toast.success('Activity logged'); },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const updateStageMutation = useMutation({
    mutationFn: () => crmApi.updateLead(id, { stage: newStage }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['lead', id] }); setShowUpdateStage(false); toast.success('Stage updated'); },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const convertMutation = useMutation({
    mutationFn: () => crmApi.convertLead(id),
    onSuccess: (data) => { toast.success('Lead converted to client!'); qc.invalidateQueries({ queryKey: ['lead', id] }); },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  if (isLoading) return <DashboardLayout title="Lead"><PageLoader /></DashboardLayout>;
  if (!lead) return <DashboardLayout title="Not Found"><p className="text-slate-500">Lead not found</p></DashboardLayout>;

  return (
    <DashboardLayout
      breadcrumbs={[{ label: 'CRM', href: '/dashboard/crm' }, { label: lead.full_name }]}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-1 space-y-4">
          {/* Lead Card */}
          <Card>
            <div className="text-center mb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold mx-auto mb-3">
                {lead.full_name?.charAt(0)}
              </div>
              <h2 className="text-lg font-semibold text-slate-900">{lead.full_name}</h2>
              {lead.designation && <p className="text-sm text-slate-500">{lead.designation}</p>}
              {lead.company && <p className="text-sm text-slate-600 font-medium">{lead.company}</p>}
            </div>
            <div className="space-y-2 text-sm">
              {lead.email && (
                <a href={`mailto:${lead.email}`} className="flex items-center gap-2 text-slate-600 hover:text-blue-600">
                  <Mail className="w-4 h-4" />{lead.email}
                </a>
              )}
              {lead.phone && (
                <a href={`tel:${lead.phone}`} className="flex items-center gap-2 text-slate-600 hover:text-blue-600">
                  <Phone className="w-4 h-4" />{lead.phone}
                </a>
              )}
              {lead.website && (
                <a href={lead.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-slate-600 hover:text-blue-600">
                  <Globe className="w-4 h-4" />{lead.website}
                </a>
              )}
            </div>
          </Card>

          {/* Stage + Actions */}
          <Card>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-700">Stage</h3>
              <StatusBadge status={lead.stage} />
            </div>
            <div className="space-y-2">
              <Button variant="outline" size="sm" className="w-full" onClick={() => { setNewStage(lead.stage); setShowUpdateStage(true); }}>
                Update Stage
              </Button>
              {lead.stage !== 'won' && lead.stage !== 'lost' && (
                <Button size="sm" className="w-full" loading={convertMutation.isPending} onClick={() => convertMutation.mutate()}>
                  <ArrowRight className="w-4 h-4" />
                  Convert to Client
                </Button>
              )}
            </div>
          </Card>

          {/* Details */}
          <Card>
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Details</h3>
            <div className="space-y-2 text-sm">
              {[
                ['Source', lead.source?.replace(/_/g, ' ')],
                ['Budget', lead.budget_range],
                ['Expected Value', lead.expected_value ? formatCurrency(lead.expected_value, lead.currency) : '—'],
                ['Urgency', lead.urgency],
                ['Score', lead.lead_score],
                ['Assigned To', lead.assigned_to_name || 'Unassigned'],
                ['Next Follow-up', lead.next_follow_up ? formatDate(lead.next_follow_up) : '—'],
                ['Last Contact', lead.last_contact_at ? timeAgo(lead.last_contact_at) : '—'],
                ['Created', formatDate(lead.created_at)],
              ].filter(([, v]) => v).map(([label, value]) => (
                <div key={label as string} className="flex justify-between">
                  <span className="text-slate-500">{label}</span>
                  <span className="text-slate-800 font-medium capitalize">{value}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Services */}
          {lead.services_needed?.length > 0 && (
            <Card>
              <h3 className="text-sm font-semibold text-slate-700 mb-2">Services Needed</h3>
              <div className="flex flex-wrap gap-1.5">
                {lead.services_needed.map((s: string) => (
                  <Badge key={s} className="text-xs">{s}</Badge>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-4">
          <TabBar
            tabs={[
              { id: 'overview', label: 'Overview' },
              { id: 'notes', label: 'Notes', count: lead.notes?.length },
              { id: 'activities', label: 'Activities', count: lead.activities?.length },
              { id: 'proposals', label: 'Proposals', count: lead.proposals?.length },
              { id: 'meetings', label: 'Meetings', count: lead.meetings?.length },
            ]}
            active={tab}
            onChange={setTab}
          />

          {tab === 'overview' && (
            <div className="space-y-4">
              {lead.requirements && (
                <Card>
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">Requirements</h3>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap">{lead.requirements}</p>
                </Card>
              )}
              {/* Recent Activity */}
              <Card padding={false}>
                <div className="p-4 border-b border-slate-100">
                  <h3 className="text-sm font-semibold text-slate-700">Recent Activity</h3>
                </div>
                <div className="divide-y divide-slate-100">
                  {lead.activities?.slice(0, 10).map((a: any) => (
                    <div key={a.id} className="px-4 py-3 flex items-start gap-3">
                      <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Activity className="w-3.5 h-3.5 text-slate-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-slate-800">{a.subject}</p>
                        {a.description && <p className="text-xs text-slate-500 mt-0.5">{a.description}</p>}
                        <p className="text-xs text-slate-400 mt-1">{timeAgo(a.occurred_at)} · {a.actor_name}</p>
                      </div>
                      <Badge className="text-xs capitalize">{a.activity_type}</Badge>
                    </div>
                  ))}
                  {!lead.activities?.length && (
                    <p className="text-center text-slate-500 text-sm py-8">No activities yet</p>
                  )}
                </div>
              </Card>
            </div>
          )}

          {tab === 'notes' && (
            <div className="space-y-4">
              <Card>
                <Textarea
                  placeholder="Add a note..."
                  value={noteContent}
                  onChange={e => setNoteContent(e.target.value)}
                  rows={3}
                />
                <div className="flex justify-end mt-3">
                  <Button size="sm" loading={addNoteMutation.isPending} onClick={() => addNoteMutation.mutate()} disabled={!noteContent.trim()}>
                    Add Note
                  </Button>
                </div>
              </Card>
              {lead.notes?.map((note: any) => (
                <Card key={note.id}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-slate-800 whitespace-pre-wrap">{note.content}</p>
                      <p className="text-xs text-slate-500 mt-2">{note.author_name} · {timeAgo(note.created_at)}</p>
                    </div>
                    {note.is_pinned && <Badge variant="info">Pinned</Badge>}
                  </div>
                </Card>
              ))}
            </div>
          )}

          {tab === 'activities' && (
            <div className="space-y-4">
              <Card>
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Log Activity</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Select
                    options={ACTIVITY_TYPES}
                    value={activityForm.activity_type}
                    onChange={e => setActivityForm(f => ({ ...f, activity_type: e.target.value }))}
                    label="Type"
                  />
                  <Input label="Subject" value={activityForm.subject} onChange={e => setActivityForm(f => ({ ...f, subject: e.target.value }))} />
                  <div className="col-span-2">
                    <Textarea label="Description" value={activityForm.description} onChange={e => setActivityForm(f => ({ ...f, description: e.target.value }))} rows={2} />
                  </div>
                  <Input label="Outcome" value={activityForm.outcome} onChange={e => setActivityForm(f => ({ ...f, outcome: e.target.value }))} />
                </div>
                <div className="flex justify-end mt-3">
                  <Button size="sm" loading={addActivityMutation.isPending} onClick={() => addActivityMutation.mutate()}>Log Activity</Button>
                </div>
              </Card>
              {lead.activities?.map((a: any) => (
                <Card key={a.id} className="!p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <Activity className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-slate-800">{a.subject}</p>
                        <Badge className="capitalize text-xs">{a.activity_type}</Badge>
                      </div>
                      {a.description && <p className="text-xs text-slate-600 mt-1">{a.description}</p>}
                      {a.outcome && <p className="text-xs text-green-700 mt-1">Outcome: {a.outcome}</p>}
                      <p className="text-xs text-slate-400 mt-1">{a.actor_name} · {timeAgo(a.occurred_at)}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {tab === 'proposals' && (
            <div className="space-y-4">
              {lead.proposals?.map((p: any) => (
                <Card key={p.id} className="!p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900">{p.title}</p>
                      <p className="text-sm text-slate-500">{formatCurrency(p.total_amount, p.currency)}</p>
                    </div>
                    <StatusBadge status={p.status} />
                  </div>
                  {p.sent_at && <p className="text-xs text-slate-400 mt-2">Sent: {formatDate(p.sent_at)}</p>}
                </Card>
              ))}
              {!lead.proposals?.length && <p className="text-center text-slate-500 text-sm py-8">No proposals yet</p>}
            </div>
          )}

          {tab === 'meetings' && (
            <div className="space-y-4">
              {lead.meetings?.map((m: any) => (
                <Card key={m.id} className="!p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                      <Video className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{m.title}</p>
                      <p className="text-sm text-slate-500">{formatDate(m.scheduled_at, 'MMM d, yyyy h:mm a')}</p>
                    </div>
                    <StatusBadge status={m.status} />
                  </div>
                </Card>
              ))}
              {!lead.meetings?.length && <p className="text-center text-slate-500 text-sm py-8">No meetings scheduled</p>}
            </div>
          )}
        </div>
      </div>

      {/* Update Stage Modal */}
      <Modal
        open={showUpdateStage}
        onClose={() => setShowUpdateStage(false)}
        title="Update Stage"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowUpdateStage(false)}>Cancel</Button>
            <Button loading={updateStageMutation.isPending} onClick={() => updateStageMutation.mutate()}>Update</Button>
          </>
        }
      >
        <Select
          label="Stage"
          options={STAGES}
          value={newStage}
          onChange={e => setNewStage(e.target.value)}
        />
        {newStage === 'lost' && (
          <Textarea label="Reason for losing" className="mt-3" rows={2} placeholder="Why was this lead lost?" />
        )}
      </Modal>
    </DashboardLayout>
  );
}
