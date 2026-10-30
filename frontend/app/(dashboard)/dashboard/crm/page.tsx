'use client';

import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/app/(dashboard)/_components/layout/DashboardLayout';
import {
  Card, Button, SearchInput, Table, Tr, Td, StatusBadge, Pagination,
  Modal, Input, Select, Textarea, StatCard, Badge, EmptyState
} from '@/components/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { crmApi } from '@/lib/api';
import { formatDate, formatCurrency, extractApiError } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Plus, Users, TrendingUp, DollarSign, Eye, Calendar, Sparkles,
  Edit2, Trash2, ArrowRight, Download, Kanban, ListFilter,
  CheckCircle2, Clock, AlertCircle, Phone, Mail, Building
} from 'lucide-react';
import Link from 'next/link';

export const CRM_STAGES = [
  { key: 'new', label: 'New', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { key: 'contacted', label: 'Contacted', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  { key: 'qualified', label: 'Qualified', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { key: 'meeting_scheduled', label: 'Meeting', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { key: 'proposal_sent', label: 'Proposal', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { key: 'negotiation', label: 'Negotiation', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  { key: 'won', label: 'Won', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { key: 'lost', label: 'Lost', color: 'bg-rose-50 text-rose-700 border-rose-200' },
];

export const CRM_SOURCES = [
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

export const CRM_PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

export default function CRMPage() {
  const qc = useQueryClient();
  const [viewMode, setViewMode] = useState<'table' | 'kanban' | 'followups'>('table');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('');

  // Modals state
  const [showCreate, setShowCreate] = useState(false);
  const [editingLead, setEditingLead] = useState<any>(null);
  const [deletingLead, setDeletingLead] = useState<any>(null);
  const [stageUpdatingLead, setStageUpdatingLead] = useState<any>(null);
  const [newStageValue, setNewStageValue] = useState('');
  const [lostReasonValue, setLostReasonValue] = useState('');
  const [completingFollowUpLead, setCompletingFollowUpLead] = useState<any>(null);
  const [followUpActivity, setFollowUpActivity] = useState({
    activity_type: 'call',
    subject: 'Follow-up Call Completed',
    outcome: '',
    next_follow_up: '',
  });

  // Create Form State
  const initialForm = {
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company: '',
    source: 'website',
    stage: 'new',
    urgency: 'medium',
    expected_value: '',
    budget_range: '',
    assigned_to: '',
    next_follow_up: '',
    requirements: '',
    initial_note: '',
  };
  const [form, setForm] = useState(initialForm);

  // Queries
  const { data: leadsData, isLoading: isLeadsLoading } = useQuery({
    queryKey: ['leads', { page, search, stage: stageFilter }],
    queryFn: () => crmApi.getLeads({
      page,
      limit: 20,
      search: search || undefined,
      stage: stageFilter || undefined
    }).then(r => r.data),
  });

  const { data: overviewData } = useQuery({
    queryKey: ['crm-overview'],
    queryFn: () => crmApi.getOverview().then(r => r.data.data),
  });

  const { data: pipelineData } = useQuery({
    queryKey: ['pipeline'],
    queryFn: () => crmApi.getLeadPipeline().then(r => r.data.data),
  });

  const { data: assigneesData } = useQuery({
    queryKey: ['crm-assignees'],
    queryFn: () => crmApi.getAssignees().then(r => r.data.data).catch(() => []),
  });

  const { data: followUpsData, isLoading: isFollowUpsLoading } = useQuery({
    queryKey: ['crm-follow-ups'],
    queryFn: () => crmApi.getFollowUps().then(r => r.data.data),
    enabled: viewMode === 'followups',
  });

  // Assignee options
  const assigneeOptions = useMemo(() => {
    const list = [{ value: '', label: 'Unassigned' }];
    if (Array.isArray(assigneesData)) {
      assigneesData.forEach((u: any) => {
        list.push({
          value: u.id,
          label: `${u.display_name || `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email} (${u.role})`
        });
      });
    }
    return list;
  }, [assigneesData]);

  // Stage select options for filters and dropdowns
  const stageSelectOptions = useMemo(() => {
    return CRM_STAGES.map(s => ({ value: s.key, label: s.label }));
  }, []);

  // Compute 8 Canonical Pipeline Cards accurately from database
  const pipelineByStage = useMemo(() => {
    const pSource = pipelineData || overviewData?.pipeline || [];
    return CRM_STAGES.map(s => {
      const row = pSource.find((p: any) =>
        p.stage === s.key ||
        (s.key === 'proposal_sent' && p.stage === 'proposal') ||
        (s.key === 'meeting_scheduled' && p.stage === 'meeting')
      );
      return {
        key: s.key,
        label: s.label,
        color: s.color,
        count: parseInt(row?.count || row?.lead_count || 0, 10),
        totalValue: parseFloat(row?.total_value || 0),
        overdueFollowups: parseInt(row?.overdue_followups || 0, 10),
      };
    });
  }, [pipelineData, overviewData]);

  // Helper to refresh all CRM queries
  const invalidateAllCrm = () => {
    qc.invalidateQueries({ queryKey: ['leads'] });
    qc.invalidateQueries({ queryKey: ['pipeline'] });
    qc.invalidateQueries({ queryKey: ['crm-overview'] });
    qc.invalidateQueries({ queryKey: ['crm-follow-ups'] });
  };

  // Mutations
  const createMutation = useMutation({
    mutationFn: (formData: any) => {
      const payload: any = { ...formData };
      if (payload.expected_value) payload.expected_value = parseFloat(payload.expected_value);
      if (!payload.next_follow_up) delete payload.next_follow_up;
      if (!payload.assigned_to) delete payload.assigned_to;
      return crmApi.createLead(payload);
    },
    onSuccess: () => {
      invalidateAllCrm();
      setShowCreate(false);
      setForm(initialForm);
      toast.success('Lead created successfully');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => {
      const payload: any = { ...data };
      if (payload.expected_value !== undefined && payload.expected_value !== '') {
        payload.expected_value = parseFloat(payload.expected_value);
      }
      return crmApi.updateLead(id, payload);
    },
    onSuccess: () => {
      invalidateAllCrm();
      setEditingLead(null);
      setStageUpdatingLead(null);
      toast.success('Lead updated successfully');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => crmApi.deleteLead(id),
    onSuccess: () => {
      invalidateAllCrm();
      setDeletingLead(null);
      toast.success('Lead deleted successfully');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const followUpMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => crmApi.manageFollowUp(id, data),
    onSuccess: () => {
      invalidateAllCrm();
      setCompletingFollowUpLead(null);
      setFollowUpActivity({
        activity_type: 'call',
        subject: 'Follow-up Call Completed',
        outcome: '',
        next_follow_up: '',
      });
      toast.success('Follow-up recorded');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  // CSV Export
  const handleExport = async () => {
    try {
      toast.loading('Exporting leads...', { id: 'csv-export' });
      const res = await crmApi.exportLeads({ stage: stageFilter || undefined, search: search || undefined });
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `leads-export-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Leads exported successfully', { id: 'csv-export' });
    } catch (err: any) {
      toast.error('Export failed: ' + extractApiError(err), { id: 'csv-export' });
    }
  };

  const leads = leadsData?.data || [];
  const totalPages = Math.ceil((leadsData?.total || 0) / 20);

  const setField = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <DashboardLayout title="CRM" breadcrumbs={[{ label: 'CRM' }]}>
      <div className="space-y-6">
        {/* 1. Main Metrics Overview (4 dynamic cards from actual database aggregations) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => { setStageFilter(''); setViewMode('table'); setPage(1); }}
            className="text-left w-full focus:outline-none transition-transform hover:scale-[1.01]"
          >
            <StatCard
              title="Total Leads"
              value={overviewData?.total_leads ?? leadsData?.total ?? 0}
              subtitle={`${overviewData?.active_leads ?? 0} active in pipeline`}
              icon={<Users className="w-5 h-5 text-blue-600" />}
              color="blue"
            />
          </button>

          <button
            onClick={() => { setStageFilter(''); setViewMode('kanban'); }}
            className="text-left w-full focus:outline-none transition-transform hover:scale-[1.01]"
          >
            <StatCard
              title="Pipeline Value"
              value={formatCurrency(overviewData?.pipeline_value || 0, 'USD')}
              subtitle="Open opportunities"
              icon={<DollarSign className="w-5 h-5 text-purple-600" />}
              color="purple"
            />
          </button>

          <button
            onClick={() => { setStageFilter('won'); setViewMode('table'); setPage(1); }}
            className="text-left w-full focus:outline-none transition-transform hover:scale-[1.01]"
          >
            <StatCard
              title="Won Deals"
              value={overviewData?.won_deals ?? 0}
              subtitle={`${overviewData?.win_rate ?? 0}% win rate (${formatCurrency(overviewData?.won_revenue || 0, 'USD')})`}
              icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
              color="green"
            />
          </button>

          <button
            onClick={() => { setViewMode('followups'); }}
            className="text-left w-full focus:outline-none transition-transform hover:scale-[1.01]"
          >
            <StatCard
              title="Follow-ups Due"
              value={overviewData?.follow_ups_due ?? 0}
              subtitle={`${overviewData?.upcoming_follow_ups ?? 0} upcoming follow-ups`}
              icon={<Calendar className="w-5 h-5 text-amber-600" />}
              color={Number(overviewData?.follow_ups_due) > 0 ? "orange" : "blue"}
            />
          </button>
        </div>

        {/* 2. Pipeline Stage Summary (8 Canonical Cards: New, Contacted, Qualified, Meeting, Proposal, Negotiation, Won, Lost) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {pipelineByStage.map((stage) => {
            const isSelected = stageFilter === stage.key;
            return (
              <button
                key={stage.key}
                type="button"
                onClick={() => {
                  setStageFilter(isSelected ? '' : stage.key);
                  setPage(1);
                  if (viewMode === 'followups') setViewMode('table');
                }}
                className={`bg-white rounded-xl border p-3 text-left transition-all hover:shadow-md cursor-pointer ${
                  isSelected
                    ? 'border-blue-500 ring-2 ring-blue-100 shadow-sm bg-blue-50/20'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500 font-semibold tracking-wide capitalize truncate">
                    {stage.label}
                  </p>
                  {stage.overdueFollowups > 0 && (
                    <span className="w-2 h-2 rounded-full bg-red-500" title={`${stage.overdueFollowups} overdue follow-up(s)`} />
                  )}
                </div>
                <p className="text-xl font-bold text-slate-900 mt-1">{stage.count}</p>
                <p className="text-xs text-slate-400 mt-0.5 truncate font-mono">
                  {formatCurrency(stage.totalValue || 0, 'USD')}
                </p>
              </button>
            );
          })}
        </div>

        {/* 3. Main CRM Container with View Switcher, Search, Filter & Actions */}
        <Card padding={false}>
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-slate-100 bg-slate-50/50 rounded-t-xl">
            {/* Left Controls: Search + Stage Filter */}
            <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
              <SearchInput
                value={search}
                onChange={(val) => { setSearch(val); setPage(1); }}
                placeholder="Search leads..."
                className="w-full sm:w-64"
              />

              <Select
                options={[{ value: '', label: 'All stages' }, ...stageSelectOptions]}
                value={stageFilter}
                onChange={(e) => { setStageFilter(e.target.value); setPage(1); }}
                className="w-40"
              />

              {(stageFilter || search) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setStageFilter(''); setSearch(''); setPage(1); }}
                  className="text-slate-500 hover:text-slate-800"
                >
                  Clear filter
                </Button>
              )}
            </div>

            {/* Right Controls: View Switcher + Export + Add Lead */}
            <div className="flex items-center gap-2">
              <div className="flex bg-slate-200/80 p-0.5 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
                    viewMode === 'table' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ListFilter className="w-3.5 h-3.5" />
                  Table
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('kanban')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
                    viewMode === 'kanban' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Kanban className="w-3.5 h-3.5" />
                  Pipeline Board
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('followups')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
                    viewMode === 'followups' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  Follow-ups
                </button>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                icon={<Download className="w-4 h-4" />}
                className="hidden sm:inline-flex"
              >
                Export CSV
              </Button>

              <Button
                size="sm"
                onClick={() => setShowCreate(true)}
                icon={<Plus className="w-4 h-4" />}
              >
                Add Lead
              </Button>
            </div>
          </div>

          {/* VIEW 1: Table View */}
          {viewMode === 'table' && (
            <>
              <Table
                headers={[
                  'Lead Contact',
                  'Company',
                  'Stage',
                  'Source',
                  'Score',
                  'Value',
                  'Next Follow-up',
                  'Assigned To',
                  'Actions'
                ]}
                loading={isLeadsLoading}
                empty={!leads.length}
                emptyMessage="No leads found matching your criteria"
              >
                {leads.map((lead: any) => {
                  const isOverdue = lead.next_follow_up &&
                    new Date(lead.next_follow_up) < new Date() &&
                    lead.stage !== 'won' && lead.stage !== 'lost';

                  return (
                    <Tr key={lead.id}>
                      <Td>
                        <div>
                          <Link
                            href={`/dashboard/crm/leads/${lead.id}`}
                            className="font-semibold text-slate-900 hover:text-blue-600 transition-colors"
                          >
                            {lead.full_name}
                          </Link>
                          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                            <span className="truncate max-w-[180px]">{lead.email}</span>
                            {lead.phone && <span className="text-slate-400">· {lead.phone}</span>}
                          </div>
                        </div>
                      </Td>

                      <Td>
                        <span className="text-sm font-medium text-slate-700">
                          {lead.company || '—'}
                        </span>
                      </Td>

                      <Td>
                        <button
                          type="button"
                          onClick={() => {
                            setStageUpdatingLead(lead);
                            setNewStageValue(lead.stage);
                            setLostReasonValue(lead.lost_reason || '');
                          }}
                          className="focus:outline-none hover:opacity-80 transition-opacity"
                          title="Click to change stage"
                        >
                          <StatusBadge status={lead.stage} />
                        </button>
                      </Td>

                      <Td>
                        <span className="capitalize text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          {lead.source?.replace(/_/g, ' ') || '—'}
                        </span>
                      </Td>

                      <Td>
                        <div className="flex items-center gap-1.5">
                          <div className="h-1.5 w-14 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-1.5 rounded-full ${
                                (lead.lead_score || 0) >= 70 ? 'bg-emerald-500' :
                                (lead.lead_score || 0) >= 40 ? 'bg-blue-500' : 'bg-slate-400'
                              }`}
                              style={{ width: `${Math.min(100, Math.max(0, lead.lead_score || 0))}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-600 font-mono font-medium">
                            {lead.lead_score || 0}
                          </span>
                        </div>
                      </Td>

                      <Td>
                        <span className="font-semibold text-slate-900 font-mono text-sm">
                          {formatCurrency(Number(lead.deal_value || lead.expected_value || 0), lead.currency || 'USD')}
                        </span>
                      </Td>

                      <Td>
                        {lead.next_follow_up ? (
                          <div className="flex items-center gap-1.5">
                            <span className={`text-xs ${isOverdue ? 'text-rose-600 font-semibold' : 'text-slate-600'}`}>
                              {formatDate(lead.next_follow_up)}
                            </span>
                            {isOverdue && (
                              <Badge variant="danger" className="text-[10px] py-0 px-1">Due</Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </Td>

                      <Td>
                        <div className="text-xs">
                          {lead.assigned_to_name ? (
                            <span className="text-slate-700 font-medium">{lead.assigned_to_name}</span>
                          ) : (
                            <span className="text-slate-400 italic">Unassigned</span>
                          )}
                        </div>
                      </Td>

                      <Td>
                        <div className="flex items-center gap-1">
                          <Link href={`/dashboard/crm/leads/${lead.id}`}>
                            <Button variant="ghost" size="sm" icon={<Eye className="w-3.5 h-3.5" />}>
                              View
                            </Button>
                          </Link>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingLead({
                                id: lead.id,
                                first_name: lead.first_name || lead.full_name?.split(' ')[0] || '',
                                last_name: lead.last_name || lead.full_name?.split(' ').slice(1).join(' ') || '',
                                email: lead.email || '',
                                phone: lead.phone || '',
                                company: lead.company || '',
                                expected_value: lead.expected_value || '',
                                budget_range: lead.budget_range || '',
                                source: lead.source || 'website',
                                stage: lead.stage || 'new',
                                urgency: lead.urgency || 'medium',
                                assigned_to: lead.assigned_to || '',
                                next_follow_up: lead.next_follow_up ? lead.next_follow_up.split('T')[0] : '',
                                requirements: lead.requirements || '',
                              });
                            }}
                            icon={<Edit2 className="w-3.5 h-3.5 text-slate-500" />}
                          />

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingLead(lead)}
                            icon={<Trash2 className="w-3.5 h-3.5 text-rose-500 hover:text-rose-700" />}
                          />
                        </div>
                      </Td>
                    </Tr>
                  );
                })}
              </Table>

              <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
                total={leadsData?.total}
                limit={20}
              />
            </>
          )}

          {/* VIEW 2: Pipeline Kanban Board */}
          {viewMode === 'kanban' && (
            <div className="p-4 overflow-x-auto">
              <div className="flex gap-4 min-w-[1280px] pb-4">
                {CRM_STAGES.map((col) => {
                  const stageLeads = leads.filter((l: any) => l.stage === col.key);
                  const stageTotalVal = stageLeads.reduce((acc: number, l: any) =>
                    acc + Number(l.deal_value || l.expected_value || 0), 0
                  );

                  return (
                    <div
                      key={col.key}
                      className="flex-1 bg-slate-50 rounded-xl p-3 border border-slate-200 min-w-[200px] flex flex-col"
                    >
                      {/* Column Header */}
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${
                            col.key === 'won' ? 'bg-emerald-500' :
                            col.key === 'lost' ? 'bg-rose-500' : 'bg-blue-500'
                          }`} />
                          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                            {col.label}
                          </h4>
                          <span className="text-xs text-slate-500 font-mono">
                            ({stageLeads.length})
                          </span>
                        </div>
                        <span className="text-[11px] font-semibold text-slate-500 font-mono">
                          {formatCurrency(stageTotalVal, 'USD')}
                        </span>
                      </div>

                      {/* Column Cards */}
                      <div className="space-y-2.5 flex-1 min-h-[300px]">
                        {stageLeads.map((lead: any) => (
                          <div
                            key={lead.id}
                            className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm hover:shadow-md transition-shadow group relative"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <Link
                                href={`/dashboard/crm/leads/${lead.id}`}
                                className="font-semibold text-xs text-slate-900 hover:text-blue-600 line-clamp-1"
                              >
                                {lead.full_name}
                              </Link>
                              <span className="text-xs font-bold font-mono text-slate-700 whitespace-nowrap">
                                {formatCurrency(Number(lead.deal_value || lead.expected_value || 0), 'USD')}
                              </span>
                            </div>

                            {lead.company && (
                              <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-1 truncate">
                                <Building className="w-3 h-3 text-slate-400" />
                                {lead.company}
                              </p>
                            )}

                            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2.5 pt-2 border-t border-slate-100">
                              <span>Score: {lead.lead_score || 0}</span>
                              <div className="flex items-center gap-1">
                                <select
                                  value={lead.stage}
                                  onChange={(e) => {
                                    const nextSt = e.target.value;
                                    if (nextSt === 'lost') {
                                      setStageUpdatingLead(lead);
                                      setNewStageValue('lost');
                                    } else {
                                      updateMutation.mutate({ id: lead.id, data: { stage: nextSt } });
                                    }
                                  }}
                                  className="text-[10px] bg-slate-100 border-none rounded px-1.5 py-0.5 text-slate-700 cursor-pointer"
                                  title="Move to stage"
                                >
                                  {CRM_STAGES.map(s => (
                                    <option key={s.key} value={s.key}>{s.label}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </div>
                        ))}

                        {!stageLeads.length && (
                          <div className="h-24 border border-dashed border-slate-200 rounded-lg flex items-center justify-center text-xs text-slate-400 italic">
                            No leads in this stage
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEW 3: Follow-ups Schedule View */}
          {viewMode === 'followups' && (
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">Follow-up Schedule</h3>
                  <p className="text-xs text-slate-500">Upcoming and overdue lead communications</p>
                </div>
                <Badge variant={Number(overviewData?.follow_ups_due) > 0 ? "danger" : "info"}>
                  {overviewData?.follow_ups_due || 0} Overdue Follow-ups
                </Badge>
              </div>

              {isFollowUpsLoading ? (
                <div className="py-12 text-center text-slate-500 text-sm">Loading follow-ups...</div>
              ) : !followUpsData?.length ? (
                <div className="py-12 text-center text-slate-500 text-sm">
                  No upcoming or overdue follow-ups scheduled
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {followUpsData.map((lead: any) => {
                    const isOverdue = new Date(lead.next_follow_up) < new Date();
                    return (
                      <div key={lead.id} className="py-3 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                            isOverdue ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'
                          }`}>
                            <Calendar className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/dashboard/crm/leads/${lead.id}`}
                                className="font-semibold text-sm text-slate-900 hover:text-blue-600"
                              >
                                {lead.full_name}
                              </Link>
                              {lead.company && (
                                <span className="text-xs text-slate-500">({lead.company})</span>
                              )}
                              <StatusBadge status={lead.stage} />
                            </div>
                            <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                              <span className={isOverdue ? 'text-rose-600 font-bold' : 'text-slate-600'}>
                                {isOverdue ? 'Overdue: ' : 'Scheduled: '}
                                {formatDate(lead.next_follow_up, 'MMM d, yyyy h:mm a')}
                              </span>
                              <span>·</span>
                              <span>Assigned: {lead.assigned_to_name || 'Unassigned'}</span>
                              <span>·</span>
                              <span>Value: {formatCurrency(lead.expected_value || 0, 'USD')}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setCompletingFollowUpLead(lead);
                              setFollowUpActivity({
                                activity_type: 'call',
                                subject: 'Follow-up Call Completed',
                                outcome: 'Spoke with client, discussed requirements',
                                next_follow_up: '',
                              });
                            }}
                            icon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                          >
                            Complete
                          </Button>
                          <Link href={`/dashboard/crm/leads/${lead.id}`}>
                            <Button size="sm" variant="ghost">View Details</Button>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* MODAL 1: Create Lead */}
      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Add New Lead"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button
              loading={createMutation.isPending}
              onClick={() => {
                if (!form.first_name || !form.last_name || !form.email) {
                  toast.error('First name, last name, and email are required');
                  return;
                }
                createMutation.mutate(form);
              }}
            >
              Create Lead
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="First Name *"
            value={form.first_name}
            onChange={e => setField('first_name', e.target.value)}
            placeholder="John"
          />
          <Input
            label="Last Name *"
            value={form.last_name}
            onChange={e => setField('last_name', e.target.value)}
            placeholder="Doe"
          />
          <Input
            label="Email Address *"
            type="email"
            value={form.email}
            onChange={e => setField('email', e.target.value)}
            placeholder="john.doe@company.com"
          />
          <Input
            label="Phone"
            value={form.phone}
            onChange={e => setField('phone', e.target.value)}
            placeholder="+1 (555) 000-0000"
          />
          <Input
            label="Company Name"
            value={form.company}
            onChange={e => setField('company', e.target.value)}
            placeholder="Acme Corp"
          />
          <Input
            label="Deal Value ($)"
            type="number"
            value={form.expected_value}
            onChange={e => setField('expected_value', e.target.value)}
            placeholder="e.g. 25000"
          />
          <Input
            label="Budget Range"
            value={form.budget_range}
            onChange={e => setField('budget_range', e.target.value)}
            placeholder="e.g. $10k–$50k"
          />
          <Input
            label="Next Follow-up"
            type="date"
            value={form.next_follow_up}
            onChange={e => setField('next_follow_up', e.target.value)}
          />
          <Select
            label="Source"
            options={CRM_SOURCES}
            value={form.source}
            onChange={e => setField('source', e.target.value)}
          />
          <Select
            label="Stage"
            options={stageSelectOptions}
            value={form.stage}
            onChange={e => setField('stage', e.target.value)}
          />
          <Select
            label="Priority / Urgency"
            options={CRM_PRIORITIES}
            value={form.urgency}
            onChange={e => setField('urgency', e.target.value)}
          />
          <Select
            label="Assigned To"
            options={assigneeOptions}
            value={form.assigned_to}
            onChange={e => setField('assigned_to', e.target.value)}
          />
          <div className="col-span-2">
            <Textarea
              label="Requirements / Notes"
              value={form.requirements}
              onChange={e => setField('requirements', e.target.value)}
              rows={3}
              placeholder="Describe project requirements, tech stack, or customer background..."
            />
          </div>
        </div>
      </Modal>

      {/* MODAL 2: Edit Lead */}
      <Modal
        open={!!editingLead}
        onClose={() => setEditingLead(null)}
        title="Edit Lead Record"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setEditingLead(null)}>Cancel</Button>
            <Button
              loading={updateMutation.isPending}
              onClick={() => {
                if (!editingLead.first_name || !editingLead.last_name || !editingLead.email) {
                  toast.error('First name, last name, and email are required');
                  return;
                }
                updateMutation.mutate({ id: editingLead.id, data: editingLead });
              }}
            >
              Save Changes
            </Button>
          </>
        }
      >
        {editingLead && (
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name *"
              value={editingLead.first_name}
              onChange={e => setEditingLead({ ...editingLead, first_name: e.target.value })}
            />
            <Input
              label="Last Name *"
              value={editingLead.last_name}
              onChange={e => setEditingLead({ ...editingLead, last_name: e.target.value })}
            />
            <Input
              label="Email *"
              type="email"
              value={editingLead.email}
              onChange={e => setEditingLead({ ...editingLead, email: e.target.value })}
            />
            <Input
              label="Phone"
              value={editingLead.phone}
              onChange={e => setEditingLead({ ...editingLead, phone: e.target.value })}
            />
            <Input
              label="Company"
              value={editingLead.company}
              onChange={e => setEditingLead({ ...editingLead, company: e.target.value })}
            />
            <Input
              label="Expected Value ($)"
              type="number"
              value={editingLead.expected_value}
              onChange={e => setEditingLead({ ...editingLead, expected_value: e.target.value })}
            />
            <Input
              label="Budget Range"
              value={editingLead.budget_range}
              onChange={e => setEditingLead({ ...editingLead, budget_range: e.target.value })}
            />
            <Input
              label="Next Follow-up"
              type="date"
              value={editingLead.next_follow_up || ''}
              onChange={e => setEditingLead({ ...editingLead, next_follow_up: e.target.value })}
            />
            <Select
              label="Source"
              options={CRM_SOURCES}
              value={editingLead.source}
              onChange={e => setEditingLead({ ...editingLead, source: e.target.value })}
            />
            <Select
              label="Stage"
              options={stageSelectOptions}
              value={editingLead.stage}
              onChange={e => setEditingLead({ ...editingLead, stage: e.target.value })}
            />
            <Select
              label="Priority"
              options={CRM_PRIORITIES}
              value={editingLead.urgency || 'medium'}
              onChange={e => setEditingLead({ ...editingLead, urgency: e.target.value })}
            />
            <Select
              label="Assigned To"
              options={assigneeOptions}
              value={editingLead.assigned_to || ''}
              onChange={e => setEditingLead({ ...editingLead, assigned_to: e.target.value })}
            />
            <div className="col-span-2">
              <Textarea
                label="Requirements"
                value={editingLead.requirements || ''}
                onChange={e => setEditingLead({ ...editingLead, requirements: e.target.value })}
                rows={3}
              />
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL 3: Update Stage Dialog */}
      <Modal
        open={!!stageUpdatingLead}
        onClose={() => setStageUpdatingLead(null)}
        title="Update Pipeline Stage"
        footer={
          <>
            <Button variant="outline" onClick={() => setStageUpdatingLead(null)}>Cancel</Button>
            <Button
              loading={updateMutation.isPending}
              onClick={() => {
                updateMutation.mutate({
                  id: stageUpdatingLead.id,
                  data: {
                    stage: newStageValue,
                    lost_reason: newStageValue === 'lost' ? lostReasonValue : undefined,
                  }
                });
              }}
            >
              Update Stage
            </Button>
          </>
        }
      >
        {stageUpdatingLead && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Moving lead <strong className="text-slate-900">{stageUpdatingLead.full_name}</strong> to:
            </p>
            <Select
              label="New Stage"
              options={stageSelectOptions}
              value={newStageValue}
              onChange={e => setNewStageValue(e.target.value)}
            />
            {newStageValue === 'lost' && (
              <Textarea
                label="Reason for losing deal *"
                placeholder="Why was this opportunity lost? (e.g. Budget constraints, chose competitor, timing...)"
                value={lostReasonValue}
                onChange={e => setLostReasonValue(e.target.value)}
                rows={3}
              />
            )}
          </div>
        )}
      </Modal>

      {/* MODAL 4: Delete Confirmation */}
      <Modal
        open={!!deletingLead}
        onClose={() => setDeletingLead(null)}
        title="Delete Lead"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeletingLead(null)}>Cancel</Button>
            <Button
              variant="danger"
              loading={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate(deletingLead.id)}
            >
              Delete Lead
            </Button>
          </>
        }
      >
        {deletingLead && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertCircle className="w-6 h-6 flex-shrink-0" />
              <p className="font-semibold text-slate-900">
                Are you sure you want to delete this lead?
              </p>
            </div>
            <p className="text-sm text-slate-600">
              Lead <strong>{deletingLead.full_name}</strong> ({deletingLead.email}) will be safely soft-deleted from the pipeline. Historical interactions will be archived.
            </p>
          </div>
        )}
      </Modal>

      {/* MODAL 5: Complete Follow-up */}
      <Modal
        open={!!completingFollowUpLead}
        onClose={() => setCompletingFollowUpLead(null)}
        title="Complete Follow-up"
        footer={
          <>
            <Button variant="outline" onClick={() => setCompletingFollowUpLead(null)}>Cancel</Button>
            <Button
              loading={followUpMutation.isPending}
              onClick={() => {
                followUpMutation.mutate({
                  id: completingFollowUpLead.id,
                  data: {
                    action: 'complete',
                    activity_type: followUpActivity.activity_type,
                    subject: followUpActivity.subject,
                    outcome: followUpActivity.outcome,
                    next_follow_up: followUpActivity.next_follow_up || null,
                  }
                });
              }}
            >
              Mark Done
            </Button>
          </>
        }
      >
        {completingFollowUpLead && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Logging completed follow-up for <strong className="text-slate-900">{completingFollowUpLead.full_name}</strong>:
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Communication Type"
                options={[
                  { value: 'call', label: 'Phone Call' },
                  { value: 'email', label: 'Email' },
                  { value: 'meeting', label: 'Meeting' },
                  { value: 'demo', label: 'Product Demo' },
                ]}
                value={followUpActivity.activity_type}
                onChange={e => setFollowUpActivity({ ...followUpActivity, activity_type: e.target.value })}
              />
              <Input
                label="Subject"
                value={followUpActivity.subject}
                onChange={e => setFollowUpActivity({ ...followUpActivity, subject: e.target.value })}
              />
            </div>
            <Textarea
              label="Call / Meeting Outcome Notes"
              value={followUpActivity.outcome}
              onChange={e => setFollowUpActivity({ ...followUpActivity, outcome: e.target.value })}
              rows={2}
              placeholder="What was discussed? Next steps agreed?"
            />
            <Input
              label="Schedule Next Follow-up (optional)"
              type="date"
              value={followUpActivity.next_follow_up}
              onChange={e => setFollowUpActivity({ ...followUpActivity, next_follow_up: e.target.value })}
            />
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
