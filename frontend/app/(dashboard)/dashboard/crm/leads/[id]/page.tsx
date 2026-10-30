'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/app/(dashboard)/_components/layout/DashboardLayout';
import {
  Card, Button, StatusBadge, Modal, Input, Select, Textarea,
  TabBar, PageLoader, Badge, Alert
} from '@/components/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { crmApi } from '@/lib/api';
import { formatDate, formatCurrency, timeAgo, extractApiError } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Mail, Phone, Globe, Building2, Calendar, MessageSquare, Activity,
  FileText, Video, ArrowRight, Edit2, Trash2, CheckCircle2, AlertCircle,
  Clock, Check
} from 'lucide-react';
import Link from 'next/link';

const STAGES = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'meeting_scheduled', label: 'Meeting Scheduled' },
  { value: 'proposal_sent', label: 'Proposal Sent' },
  { value: 'negotiation', label: 'Negotiation' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
];

const SOURCES = [
  { value: 'website', label: 'Website' },
  { value: 'referral', label: 'Referral' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'google_ads', label: 'Google Ads' },
  { value: 'meta_ads', label: 'Meta Ads' },
  { value: 'cold_outreach', label: 'Cold Outreach' },
  { value: 'partner', label: 'Partner' },
  { value: 'event', label: 'Event' },
  { value: 'other', label: 'Other' },
];

const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

const ACTIVITY_TYPES = [
  { value: 'call', label: 'Phone Call' },
  { value: 'email', label: 'Email' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'note', label: 'Internal Note' },
  { value: 'task', label: 'Task' },
  { value: 'demo', label: 'Product Demo' },
];

export default function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const qc = useQueryClient();

  const [tab, setTab] = useState('overview');
  const [noteContent, setNoteContent] = useState('');
  const [isNotePinned, setIsNotePinned] = useState(false);
  const [activityForm, setActivityForm] = useState({
    activity_type: 'call',
    subject: '',
    description: '',
    outcome: '',
    duration_min: 15,
  });

  // Modal states
  const [showUpdateStage, setShowUpdateStage] = useState(false);
  const [newStage, setNewStage] = useState('');
  const [lostReason, setLostReason] = useState('');
  const [showEditLead, setShowEditLead] = useState(false);
  const [editForm, setEditForm] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [followUpActionForm, setFollowUpActionForm] = useState({
    action: 'complete',
    activity_type: 'call',
    subject: 'Follow-up Call Completed',
    outcome: '',
    next_follow_up: '',
  });

  // Load Lead details
  const { data: lead, isLoading } = useQuery({
    queryKey: ['lead', id],
    queryFn: () => crmApi.getLead(id).then(r => r.data.data),
  });

  // Load Assignees
  const { data: assigneesData } = useQuery({
    queryKey: ['crm-assignees'],
    queryFn: () => crmApi.getAssignees().then(r => r.data.data).catch(() => []),
  });

  const assigneeOptions = [
    { value: '', label: 'Unassigned' },
    ...((assigneesData || []).map((u: any) => ({
      value: u.id,
      label: `${u.display_name || `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email} (${u.role})`
    })))
  ];

  const invalidateLeadData = () => {
    qc.invalidateQueries({ queryKey: ['lead', id] });
    qc.invalidateQueries({ queryKey: ['leads'] });
    qc.invalidateQueries({ queryKey: ['pipeline'] });
    qc.invalidateQueries({ queryKey: ['crm-overview'] });
  };

  // Mutations
  const addNoteMutation = useMutation({
    mutationFn: () => crmApi.addLeadNote(id, { content: noteContent, is_pinned: isNotePinned }),
    onSuccess: () => {
      invalidateLeadData();
      setNoteContent('');
      setIsNotePinned(false);
      toast.success('Note added');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const deleteNoteMutation = useMutation({
    mutationFn: (noteId: string) => crmApi.deleteLeadNote(id, noteId),
    onSuccess: () => {
      invalidateLeadData();
      toast.success('Note deleted');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const addActivityMutation = useMutation({
    mutationFn: () => crmApi.addLeadActivity(id, activityForm),
    onSuccess: () => {
      invalidateLeadData();
      setActivityForm({ activity_type: 'call', subject: '', description: '', outcome: '', duration_min: 15 });
      toast.success('Activity logged');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const updateStageMutation = useMutation({
    mutationFn: () => crmApi.updateLead(id, {
      stage: newStage,
      lost_reason: newStage === 'lost' ? lostReason : undefined,
    }),
    onSuccess: () => {
      invalidateLeadData();
      setShowUpdateStage(false);
      setLostReason('');
      toast.success('Stage updated successfully');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const editLeadMutation = useMutation({
    mutationFn: (payload: any) => {
      const data = { ...payload };
      if (data.expected_value) data.expected_value = parseFloat(data.expected_value);
      return crmApi.updateLead(id, data);
    },
    onSuccess: () => {
      invalidateLeadData();
      setShowEditLead(false);
      toast.success('Lead updated successfully');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const deleteLeadMutation = useMutation({
    mutationFn: () => crmApi.deleteLead(id),
    onSuccess: () => {
      invalidateLeadData();
      toast.success('Lead deleted successfully');
      router.push('/dashboard/crm');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const convertMutation = useMutation({
    mutationFn: () => crmApi.convertLead(id),
    onSuccess: (res) => {
      invalidateLeadData();
      toast.success('Lead successfully converted to Client account!');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const followUpMutation = useMutation({
    mutationFn: (data: any) => crmApi.manageFollowUp(id, data),
    onSuccess: () => {
      invalidateLeadData();
      setShowFollowUpModal(false);
      toast.success('Follow-up updated');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  if (isLoading) return <DashboardLayout title="Lead"><PageLoader /></DashboardLayout>;
  if (!lead) {
    return (
      <DashboardLayout title="Lead Not Found">
        <div className="py-12 text-center">
          <p className="text-slate-500 mb-4">Lead not found or has been removed.</p>
          <Link href="/dashboard/crm">
            <Button variant="outline">Back to CRM Dashboard</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const isOverdue = lead.next_follow_up &&
    new Date(lead.next_follow_up) < new Date() &&
    lead.stage !== 'won' && lead.stage !== 'lost';

  return (
    <DashboardLayout
      breadcrumbs={[{ label: 'CRM', href: '/dashboard/crm' }, { label: lead.full_name }]}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Lead Profile & Quick Actions */}
        <div className="lg:col-span-1 space-y-4">
          {/* Main Lead Card */}
          <Card>
            <div className="flex justify-end mb-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditForm({
                    first_name: lead.first_name || lead.full_name?.split(' ')[0] || '',
                    last_name: lead.last_name || lead.full_name?.split(' ').slice(1).join(' ') || '',
                    email: lead.email || '',
                    phone: lead.phone || '',
                    company: lead.company || '',
                    designation: lead.designation || '',
                    website: lead.website || '',
                    expected_value: lead.expected_value || '',
                    budget_range: lead.budget_range || '',
                    source: lead.source || 'website',
                    stage: lead.stage || 'new',
                    urgency: lead.urgency || 'medium',
                    assigned_to: lead.assigned_to || '',
                    next_follow_up: lead.next_follow_up ? lead.next_follow_up.split('T')[0] : '',
                    requirements: lead.requirements || '',
                  });
                  setShowEditLead(true);
                }}
                icon={<Edit2 className="w-3.5 h-3.5" />}
              >
                Edit
              </Button>
            </div>

            <div className="text-center mb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold mx-auto mb-3 shadow-md">
                {lead.full_name?.charAt(0) || 'L'}
              </div>
              <h2 className="text-lg font-bold text-slate-900">{lead.full_name}</h2>
              {lead.designation && <p className="text-sm text-slate-500">{lead.designation}</p>}
              {lead.company && <p className="text-sm font-semibold text-slate-700 mt-0.5">{lead.company}</p>}
            </div>

            <div className="space-y-2.5 text-sm pt-2 border-t border-slate-100">
              {lead.email && (
                <a href={`mailto:${lead.email}`} className="flex items-center gap-2 text-slate-600 hover:text-blue-600 truncate">
                  <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span className="truncate">{lead.email}</span>
                </a>
              )}
              {lead.phone && (
                <a href={`tel:${lead.phone}`} className="flex items-center gap-2 text-slate-600 hover:text-blue-600">
                  <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span>{lead.phone}</span>
                </a>
              )}
              {lead.website && (
                <a href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-slate-600 hover:text-blue-600 truncate">
                  <Globe className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span className="truncate">{lead.website}</span>
                </a>
              )}
            </div>
          </Card>

          {/* Stage & Pipeline Workflow */}
          <Card>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Pipeline Stage</span>
              <StatusBadge status={lead.stage} />
            </div>

            {lead.stage === 'lost' && lead.lost_reason && (
              <div className="mb-3 p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800">
                <strong>Lost Reason:</strong> {lead.lost_reason}
              </div>
            )}

            {lead.converted_at && (
              <div className="mb-3 p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Converted to client on {formatDate(lead.converted_at)}</span>
              </div>
            )}

            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-center"
                onClick={() => {
                  setNewStage(lead.stage);
                  setLostReason(lead.lost_reason || '');
                  setShowUpdateStage(true);
                }}
              >
                Change Stage
              </Button>

              {lead.stage !== 'won' && !lead.converted_at && (
                <Button
                  size="sm"
                  className="w-full justify-center"
                  loading={convertMutation.isPending}
                  onClick={() => convertMutation.mutate()}
                  icon={<ArrowRight className="w-4 h-4" />}
                >
                  Convert to Client
                </Button>
              )}
            </div>
          </Card>

          {/* Follow-up Status */}
          <Card>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Next Follow-up</h3>
              {isOverdue && <Badge variant="danger">Overdue</Badge>}
            </div>

            {lead.next_follow_up ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className={`w-4 h-4 ${isOverdue ? 'text-rose-500' : 'text-blue-500'}`} />
                  <span className={`font-semibold ${isOverdue ? 'text-rose-600' : 'text-slate-800'}`}>
                    {formatDate(lead.next_follow_up, 'MMM d, yyyy h:mm a')}
                  </span>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 justify-center"
                    onClick={() => {
                      setFollowUpActionForm({
                        action: 'complete',
                        activity_type: 'call',
                        subject: 'Follow-up Call Completed',
                        outcome: '',
                        next_follow_up: '',
                      });
                      setShowFollowUpModal(true);
                    }}
                    icon={<Check className="w-3.5 h-3.5" />}
                  >
                    Mark Done
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="flex-1 justify-center"
                    onClick={() => {
                      setFollowUpActionForm({
                        action: 'reschedule',
                        activity_type: 'call',
                        subject: 'Follow-up Rescheduled',
                        outcome: '',
                        next_follow_up: lead.next_follow_up ? lead.next_follow_up.split('T')[0] : '',
                      });
                      setShowFollowUpModal(true);
                    }}
                    icon={<Clock className="w-3.5 h-3.5" />}
                  >
                    Reschedule
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-slate-400 italic">No follow-up currently scheduled</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full justify-center"
                  onClick={() => {
                    setFollowUpActionForm({
                      action: 'schedule',
                      activity_type: 'call',
                      subject: 'Next Follow-up Scheduled',
                      outcome: '',
                      next_follow_up: '',
                    });
                    setShowFollowUpModal(true);
                  }}
                  icon={<Calendar className="w-3.5 h-3.5" />}
                >
                  Schedule Follow-up
                </Button>
              </div>
            )}
          </Card>

          {/* Lead Details */}
          <Card>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Lead Details</h3>
            <div className="space-y-2 text-sm divide-y divide-slate-50">
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Source</span>
                <span className="text-slate-800 font-medium capitalize">{lead.source?.replace(/_/g, ' ') || '—'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Priority</span>
                <span className="text-slate-800 font-medium capitalize">{lead.urgency || 'Medium'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Deal Value</span>
                <span className="text-slate-900 font-mono font-bold">
                  {formatCurrency(Number(lead.deal_value || lead.expected_value || 0), lead.currency || 'USD')}
                </span>
              </div>
              {lead.budget_range && (
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Budget Range</span>
                  <span className="text-slate-800 font-medium">{lead.budget_range}</span>
                </div>
              )}
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Lead Score</span>
                <span className="text-slate-800 font-mono font-medium">{lead.lead_score || 0} / 100</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Assigned To</span>
                <span className="text-slate-800 font-medium">{lead.assigned_to_name || 'Unassigned'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Follow-up Count</span>
                <span className="text-slate-800 font-medium">{lead.follow_up_count || 0}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Created At</span>
                <span className="text-slate-700">{formatDate(lead.created_at)}</span>
              </div>
            </div>
          </Card>

          {/* Delete Danger Zone */}
          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-center text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
              onClick={() => setShowDeleteModal(true)}
              icon={<Trash2 className="w-3.5 h-3.5" />}
            >
              Delete Lead
            </Button>
          </div>
        </div>

        {/* Right Column: Content Tabs (Overview, Notes, Activities, Proposals, Meetings) */}
        <div className="lg:col-span-2 space-y-4">
          <TabBar
            tabs={[
              { id: 'overview', label: 'Overview' },
              { id: 'notes', label: 'Notes', count: lead.notes?.length || 0 },
              { id: 'activities', label: 'Activity Log', count: lead.activities?.length || 0 },
              { id: 'proposals', label: 'Proposals', count: lead.proposals?.length || 0 },
              { id: 'meetings', label: 'Meetings', count: lead.meetings?.length || 0 },
            ]}
            active={tab}
            onChange={setTab}
          />

          {/* TAB 1: Overview */}
          {tab === 'overview' && (
            <div className="space-y-4">
              {lead.requirements && (
                <Card>
                  <h3 className="text-sm font-semibold text-slate-800 mb-2">Requirements & Notes</h3>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">{lead.requirements}</p>
                </Card>
              )}

              {lead.services_needed && lead.services_needed.length > 0 && (
                <Card>
                  <h3 className="text-sm font-semibold text-slate-800 mb-2">Requested Services</h3>
                  <div className="flex flex-wrap gap-2">
                    {lead.services_needed.map((s: string) => (
                      <Badge key={s} className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </Card>
              )}

              {/* Recent Activities Timeline */}
              <Card padding={false}>
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-800">Recent Activity Timeline</h3>
                  <Button size="sm" variant="ghost" onClick={() => setTab('activities')}>
                    View All Log
                  </Button>
                </div>
                <div className="divide-y divide-slate-100">
                  {lead.activities?.slice(0, 8).map((a: any) => (
                    <div key={a.id} className="p-4 flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Activity className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-slate-900">{a.subject || 'Activity logged'}</p>
                          <Badge className="text-[10px] capitalize font-medium">{a.activity_type}</Badge>
                        </div>
                        {a.description && <p className="text-xs text-slate-600 mt-1">{a.description}</p>}
                        {a.outcome && (
                          <p className="text-xs text-emerald-700 mt-1 font-medium bg-emerald-50 px-2 py-0.5 rounded inline-block">
                            Outcome: {a.outcome}
                          </p>
                        )}
                        <p className="text-[11px] text-slate-400 mt-1.5 font-mono">
                          {timeAgo(a.occurred_at)} {a.actor_name ? `· by ${a.actor_name}` : ''}
                        </p>
                      </div>
                    </div>
                  ))}
                  {!lead.activities?.length && (
                    <p className="text-center text-slate-400 text-sm py-10 italic">No activities logged yet</p>
                  )}
                </div>
              </Card>
            </div>
          )}

          {/* TAB 2: Notes */}
          {tab === 'notes' && (
            <div className="space-y-4">
              <Card>
                <h3 className="text-sm font-semibold text-slate-800 mb-2">Add Internal Note</h3>
                <Textarea
                  placeholder="Type an internal note regarding this prospect..."
                  value={noteContent}
                  onChange={e => setNoteContent(e.target.value)}
                  rows={3}
                />
                <div className="flex items-center justify-between mt-3">
                  <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isNotePinned}
                      onChange={e => setIsNotePinned(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    Pin note to top
                  </label>
                  <Button
                    size="sm"
                    loading={addNoteMutation.isPending}
                    onClick={() => addNoteMutation.mutate()}
                    disabled={!noteContent.trim()}
                  >
                    Post Note
                  </Button>
                </div>
              </Card>

              {lead.notes?.map((note: any) => (
                <Card key={note.id} className="relative">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">{note.content}</p>
                      <p className="text-xs text-slate-400 mt-2 font-mono">
                        {note.author_name || 'Staff'} · {timeAgo(note.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {note.is_pinned && <Badge variant="info">Pinned</Badge>}
                      <button
                        onClick={() => deleteNoteMutation.mutate(note.id)}
                        className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                        title="Delete note"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
              {!lead.notes?.length && (
                <div className="text-center py-10 text-slate-400 text-sm italic">
                  No notes attached to this lead yet
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Activities */}
          {tab === 'activities' && (
            <div className="space-y-4">
              <Card>
                <h3 className="text-sm font-semibold text-slate-800 mb-3">Log Interaction</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Select
                    options={ACTIVITY_TYPES}
                    value={activityForm.activity_type}
                    onChange={e => setActivityForm(f => ({ ...f, activity_type: e.target.value }))}
                    label="Activity Type"
                  />
                  <Input
                    label="Subject *"
                    placeholder="e.g. Discussed proposal timeline"
                    value={activityForm.subject}
                    onChange={e => setActivityForm(f => ({ ...f, subject: e.target.value }))}
                  />
                  <div className="col-span-2">
                    <Textarea
                      label="Description / Summary"
                      placeholder="Key details of the conversation..."
                      value={activityForm.description}
                      onChange={e => setActivityForm(f => ({ ...f, description: e.target.value }))}
                      rows={2}
                    />
                  </div>
                  <Input
                    label="Outcome / Next Action"
                    placeholder="e.g. Client requested contract draft"
                    value={activityForm.outcome}
                    onChange={e => setActivityForm(f => ({ ...f, outcome: e.target.value }))}
                  />
                  <Input
                    label="Duration (minutes)"
                    type="number"
                    value={activityForm.duration_min}
                    onChange={e => setActivityForm(f => ({ ...f, duration_min: parseInt(e.target.value, 10) || 0 }))}
                  />
                </div>
                <div className="flex justify-end mt-4">
                  <Button
                    size="sm"
                    loading={addActivityMutation.isPending}
                    onClick={() => {
                      if (!activityForm.subject) {
                        toast.error('Subject is required');
                        return;
                      }
                      addActivityMutation.mutate();
                    }}
                  >
                    Save Activity
                  </Button>
                </div>
              </Card>

              {/* Full Activity List */}
              <div className="space-y-3">
                {lead.activities?.map((a: any) => (
                  <Card key={a.id} className="!p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Activity className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-slate-900">{a.subject}</p>
                          <Badge className="capitalize text-[10px]">{a.activity_type}</Badge>
                          {a.duration_min ? <span className="text-xs text-slate-400">({a.duration_min}m)</span> : null}
                        </div>
                        {a.description && <p className="text-xs text-slate-600 mt-1 leading-relaxed">{a.description}</p>}
                        {a.outcome && (
                          <div className="mt-1.5 p-1.5 bg-emerald-50 rounded text-xs text-emerald-800 font-medium inline-block">
                            Outcome: {a.outcome}
                          </div>
                        )}
                        <p className="text-[11px] text-slate-400 mt-2 font-mono">
                          {formatDate(a.occurred_at, 'MMM d, yyyy h:mm a')} {a.actor_name ? `· ${a.actor_name}` : ''}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: Proposals */}
          {tab === 'proposals' && (
            <div className="space-y-4">
              {lead.proposals?.map((p: any) => (
                <Card key={p.id} className="!p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{p.title}</p>
                      <p className="text-sm font-mono text-slate-600 font-bold mt-0.5">
                        {formatCurrency(p.total_amount, p.currency)}
                      </p>
                    </div>
                    <StatusBadge status={p.status} />
                  </div>
                  {p.sent_at && <p className="text-xs text-slate-400 mt-2">Sent: {formatDate(p.sent_at)}</p>}
                </Card>
              ))}
              {!lead.proposals?.length && (
                <div className="text-center py-12 text-slate-400 text-sm italic">
                  No proposals generated for this lead
                </div>
              )}
            </div>
          )}

          {/* TAB 5: Meetings */}
          {tab === 'meetings' && (
            <div className="space-y-4">
              {lead.meetings?.map((m: any) => (
                <Card key={m.id} className="!p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                      <Video className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900">{m.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {formatDate(m.scheduled_at, 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                    <StatusBadge status={m.status} />
                  </div>
                </Card>
              ))}
              {!lead.meetings?.length && (
                <div className="text-center py-12 text-slate-400 text-sm italic">
                  No meetings scheduled for this lead
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: Update Stage */}
      <Modal
        open={showUpdateStage}
        onClose={() => setShowUpdateStage(false)}
        title="Update Pipeline Stage"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowUpdateStage(false)}>Cancel</Button>
            <Button
              loading={updateStageMutation.isPending}
              onClick={() => updateStageMutation.mutate()}
            >
              Confirm Update
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Select
            label="Stage"
            options={STAGES}
            value={newStage}
            onChange={e => setNewStage(e.target.value)}
          />
          {newStage === 'lost' && (
            <Textarea
              label="Reason for losing this opportunity *"
              placeholder="Why was this lead marked as lost?"
              value={lostReason}
              onChange={e => setLostReason(e.target.value)}
              rows={3}
            />
          )}
        </div>
      </Modal>

      {/* MODAL 2: Edit Lead Details */}
      <Modal
        open={showEditLead}
        onClose={() => setShowEditLead(false)}
        title="Edit Lead Information"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowEditLead(false)}>Cancel</Button>
            <Button
              loading={editLeadMutation.isPending}
              onClick={() => {
                if (!editForm.first_name || !editForm.last_name || !editForm.email) {
                  toast.error('First name, last name, and email are required');
                  return;
                }
                editLeadMutation.mutate(editForm);
              }}
            >
              Save Changes
            </Button>
          </>
        }
      >
        {editForm && (
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name *"
              value={editForm.first_name}
              onChange={e => setEditForm({ ...editForm, first_name: e.target.value })}
            />
            <Input
              label="Last Name *"
              value={editForm.last_name}
              onChange={e => setEditForm({ ...editForm, last_name: e.target.value })}
            />
            <Input
              label="Email *"
              type="email"
              value={editForm.email}
              onChange={e => setEditForm({ ...editForm, email: e.target.value })}
            />
            <Input
              label="Phone"
              value={editForm.phone}
              onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
            />
            <Input
              label="Company"
              value={editForm.company}
              onChange={e => setEditForm({ ...editForm, company: e.target.value })}
            />
            <Input
              label="Designation / Role"
              value={editForm.designation}
              onChange={e => setEditForm({ ...editForm, designation: e.target.value })}
            />
            <Input
              label="Expected Value ($)"
              type="number"
              value={editForm.expected_value}
              onChange={e => setEditForm({ ...editForm, expected_value: e.target.value })}
            />
            <Input
              label="Budget Range"
              value={editForm.budget_range}
              onChange={e => setEditForm({ ...editForm, budget_range: e.target.value })}
            />
            <Select
              label="Lead Source"
              options={SOURCES}
              value={editForm.source}
              onChange={e => setEditForm({ ...editForm, source: e.target.value })}
            />
            <Select
              label="Priority"
              options={PRIORITIES}
              value={editForm.urgency}
              onChange={e => setEditForm({ ...editForm, urgency: e.target.value })}
            />
            <Select
              label="Assigned Staff"
              options={assigneeOptions}
              value={editForm.assigned_to || ''}
              onChange={e => setEditForm({ ...editForm, assigned_to: e.target.value })}
            />
            <Input
              label="Next Follow-up"
              type="date"
              value={editForm.next_follow_up || ''}
              onChange={e => setEditForm({ ...editForm, next_follow_up: e.target.value })}
            />
            <div className="col-span-2">
              <Textarea
                label="Requirements / Notes"
                value={editForm.requirements || ''}
                onChange={e => setEditForm({ ...editForm, requirements: e.target.value })}
                rows={3}
              />
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL 3: Delete Confirmation */}
      <Modal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Lead Record"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
            <Button
              variant="danger"
              loading={deleteLeadMutation.isPending}
              onClick={() => deleteLeadMutation.mutate()}
            >
              Confirm Delete
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-rose-600">
            <AlertCircle className="w-6 h-6 flex-shrink-0" />
            <p className="font-semibold text-slate-900">
              Are you sure you want to delete this lead?
            </p>
          </div>
          <p className="text-sm text-slate-600">
            Lead <strong>{lead.full_name}</strong> will be safely archived and removed from your active sales pipeline.
          </p>
        </div>
      </Modal>

      {/* MODAL 4: Follow-up Management */}
      <Modal
        open={showFollowUpModal}
        onClose={() => setShowFollowUpModal(false)}
        title={followUpActionForm.action === 'complete' ? 'Mark Follow-up Complete' : 'Schedule Follow-up'}
        footer={
          <>
            <Button variant="outline" onClick={() => setShowFollowUpModal(false)}>Cancel</Button>
            <Button
              loading={followUpMutation.isPending}
              onClick={() => {
                followUpMutation.mutate({
                  action: followUpActionForm.action,
                  activity_type: followUpActionForm.activity_type,
                  subject: followUpActionForm.subject,
                  outcome: followUpActionForm.outcome,
                  next_follow_up: followUpActionForm.next_follow_up || null,
                });
              }}
            >
              Save Follow-up
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {followUpActionForm.action === 'complete' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Activity Type"
                  options={[
                    { value: 'call', label: 'Phone Call' },
                    { value: 'email', label: 'Email' },
                    { value: 'meeting', label: 'Meeting' },
                  ]}
                  value={followUpActionForm.activity_type}
                  onChange={e => setFollowUpActionForm({ ...followUpActionForm, activity_type: e.target.value })}
                />
                <Input
                  label="Subject"
                  value={followUpActionForm.subject}
                  onChange={e => setFollowUpActionForm({ ...followUpActionForm, subject: e.target.value })}
                />
              </div>
              <Textarea
                label="Conversation Outcome"
                placeholder="What was discussed?"
                value={followUpActionForm.outcome}
                onChange={e => setFollowUpActionForm({ ...followUpActionForm, outcome: e.target.value })}
                rows={2}
              />
              <Input
                label="Schedule Subsequent Follow-up (optional)"
                type="date"
                value={followUpActionForm.next_follow_up}
                onChange={e => setFollowUpActionForm({ ...followUpActionForm, next_follow_up: e.target.value })}
              />
            </>
          )}

          {followUpActionForm.action !== 'complete' && (
            <div>
              <Input
                label="Next Follow-up Date *"
                type="date"
                value={followUpActionForm.next_follow_up}
                onChange={e => setFollowUpActionForm({ ...followUpActionForm, next_follow_up: e.target.value })}
              />
            </div>
          )}
        </div>
      </Modal>
    </DashboardLayout>
  );
}
