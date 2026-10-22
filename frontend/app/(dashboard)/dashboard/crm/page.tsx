'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/app/(dashboard)/_components/layout/DashboardLayout';
import {
  Card, Button, SearchInput, Table, Tr, Td, StatusBadge, Pagination,
  Modal, Input, Select, Textarea, StatCard
} from '@/components/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { crmApi } from '@/lib/api';
import { formatDate, formatCurrency, extractApiError } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Plus, Users, TrendingUp, DollarSign, Eye, Calendar, Sparkles } from 'lucide-react';
import Link from 'next/link';

const STAGES = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'meeting_scheduled', label: 'Meeting' },
  { value: 'proposal_sent', label: 'Proposal' },
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
  { value: 'other', label: 'Other' },
];

export default function CRMPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company: '',
    source: 'website',
    stage: 'new',
    requirements: '',
    budget_range: '',
    expected_value: '',
    next_follow_up: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['leads', { page, search, stage: stageFilter }],
    queryFn: () => crmApi.getLeads({ page, limit: 20, search: search || undefined, stage: stageFilter || undefined }).then(r => r.data),
  });

  const { data: pipelineData } = useQuery({
    queryKey: ['pipeline'],
    queryFn: () => crmApi.getLeadPipeline().then(r => r.data.data),
  });

  const { data: overviewData } = useQuery({
    queryKey: ['crm-overview'],
    queryFn: () => crmApi.getOverview().then(r => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (formData: any) => {
      const payload: any = { ...formData };
      if (payload.expected_value) payload.expected_value = parseFloat(payload.expected_value);
      if (!payload.next_follow_up) delete payload.next_follow_up;
      return crmApi.createLead(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leads'] });
      qc.invalidateQueries({ queryKey: ['pipeline'] });
      qc.invalidateQueries({ queryKey: ['crm-overview'] });
      setShowCreate(false);
      setForm({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        company: '',
        source: 'website',
        stage: 'new',
        requirements: '',
        budget_range: '',
        expected_value: '',
        next_follow_up: '',
      });
      toast.success('Lead created successfully');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const leads = data?.data || [];
  const totalPages = Math.ceil((data?.total || 0) / 20);

  // Pipeline summary by stage
  const pipelineByStage = STAGES.map(s => {
    const row = pipelineData?.find((p: any) => p.stage === s.value || (s.value === 'proposal_sent' && p.stage === 'proposal'));
    return { ...s, count: row?.count || row?.lead_count || 0, value: row?.total_value || 0 };
  });

  return (
    <DashboardLayout title="CRM" breadcrumbs={[{ label: 'CRM' }]}>
      <div className="space-y-6">
        {/* CRM Overview Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="Total Leads"
            value={overviewData?.total_leads ?? data?.total ?? 0}
            subtitle={`${overviewData?.active_leads ?? 0} active in pipeline`}
            icon={<Users className="w-5 h-5" />}
            color="blue"
          />
          <StatCard
            title="Pipeline Value"
            value={formatCurrency(overviewData?.pipeline_value || 0, 'USD')}
            subtitle="Open opportunities"
            icon={<DollarSign className="w-5 h-5" />}
            color="purple"
          />
          <StatCard
            title="Won Deals"
            value={overviewData?.won_deals ?? 0}
            subtitle={`${overviewData?.win_rate ?? 0}% win rate (${formatCurrency(overviewData?.won_revenue || 0, 'USD')})`}
            icon={<TrendingUp className="w-5 h-5" />}
            color="green"
          />
          <StatCard
            title="Follow-ups Due"
            value={overviewData?.follow_ups_due ?? 0}
            subtitle={`${overviewData?.upcoming_follow_ups ?? 0} upcoming follow-ups`}
            icon={<Calendar className="w-5 h-5" />}
            color={Number(overviewData?.follow_ups_due) > 0 ? "orange" : "blue"}
          />
        </div>

        {/* Pipeline Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {pipelineByStage.map((stage) => (
            <button
              key={stage.value}
              onClick={() => {
                setStageFilter(stageFilter === stage.value ? '' : stage.value);
                setPage(1);
              }}
              className={`bg-white rounded-xl border p-3 text-left transition-all hover:shadow-md ${stageFilter === stage.value ? 'border-blue-500 ring-2 ring-blue-100 shadow-sm' : 'border-slate-200'}`}
            >
              <p className="text-xs text-slate-500 font-medium capitalize truncate">{stage.label}</p>
              <p className="text-xl font-bold text-slate-900 mt-0.5">{stage.count}</p>
              {stage.value !== 'lost' && stage.value !== 'won' && (
                <p className="text-xs text-slate-400 mt-0.5 truncate">{formatCurrency(stage.value || 0, 'USD')}</p>
              )}
            </button>
          ))}
        </div>

        {/* Table */}
        <Card padding={false}>
          <div className="flex flex-wrap items-center gap-3 p-4 border-b border-slate-100">
            <SearchInput
              value={search}
              onChange={(val) => { setSearch(val); setPage(1); }}
              placeholder="Search leads..."
              className="flex-1 min-w-[200px] max-w-xs"
            />
            <Select
              options={[{ value: '', label: 'All stages' }, ...STAGES]}
              value={stageFilter}
              onChange={(e) => { setStageFilter(e.target.value); setPage(1); }}
              className="w-40"
            />
            {stageFilter && (
              <Button variant="ghost" size="sm" onClick={() => { setStageFilter(''); setPage(1); }}>
                Clear filter
              </Button>
            )}
            <div className="ml-auto flex gap-2">
              <Button size="sm" onClick={() => setShowCreate(true)} icon={<Plus className="w-4 h-4" />}>
                Add Lead
              </Button>
            </div>
          </div>

          <Table
            headers={['Name', 'Company', 'Stage', 'Source', 'Score', 'Expected Value', 'Next Follow-up', 'Assigned To', '']}
            loading={isLoading}
            empty={!leads.length}
            emptyMessage="No leads found"
          >
            {leads.map((lead: any) => (
              <Tr key={lead.id}>
                <Td>
                  <div>
                    <p className="font-medium text-slate-900">{lead.full_name}</p>
                    <p className="text-xs text-slate-500">{lead.email}</p>
                  </div>
                </Td>
                <Td>{lead.company || '—'}</Td>
                <Td><StatusBadge status={lead.stage} /></Td>
                <Td className="capitalize">{lead.source?.replace(/_/g, ' ') || '—'}</Td>
                <Td>
                  <div className="flex items-center gap-1.5">
                    <div className="h-1.5 w-14 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-1.5 rounded-full ${
                          (lead.lead_score || 0) >= 70 ? 'bg-green-500' :
                          (lead.lead_score || 0) >= 40 ? 'bg-blue-500' : 'bg-slate-400'
                        }`}
                        style={{ width: `${Math.min(100, lead.lead_score || 0)}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-500 font-mono">{lead.lead_score || 0}</span>
                  </div>
                </Td>
                <Td>
                  {lead.expected_value ? (
                    <span className="font-medium text-slate-800">
                      {formatCurrency(Number(lead.expected_value), lead.currency || 'USD')}
                    </span>
                  ) : (
                    '—'
                  )}
                </Td>
                <Td>
                  {lead.next_follow_up ? (
                    <span className={`text-xs ${new Date(lead.next_follow_up) < new Date() && lead.stage !== 'won' && lead.stage !== 'lost' ? 'text-red-600 font-medium' : 'text-slate-600'}`}>
                      {formatDate(lead.next_follow_up)}
                    </span>
                  ) : (
                    '—'
                  )}
                </Td>
                <Td>{lead.assigned_to_name || <span className="text-slate-400">Unassigned</span>}</Td>
                <Td>
                  <Link href={`/dashboard/crm/leads/${lead.id}`}>
                    <Button variant="ghost" size="sm" icon={<Eye className="w-4 h-4" />}>View</Button>
                  </Link>
                </Td>
              </Tr>
            ))}
          </Table>

          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} total={data?.total} limit={20} />
        </Card>
      </div>

      {/* Create Modal */}
      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="New Lead"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button loading={createMutation.isPending} onClick={() => createMutation.mutate(form)}>Create Lead</Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <Input label="First Name *" value={form.first_name} onChange={e => set('first_name', e.target.value)} />
          <Input label="Last Name *" value={form.last_name} onChange={e => set('last_name', e.target.value)} />
          <Input label="Email *" type="email" value={form.email} onChange={e => set('email', e.target.value)} />
          <Input label="Phone" value={form.phone} onChange={e => set('phone', e.target.value)} />
          <Input label="Company" value={form.company} onChange={e => set('company', e.target.value)} />
          <Input label="Expected Value ($)" type="number" value={form.expected_value} onChange={e => set('expected_value', e.target.value)} placeholder="e.g. 25000" />
          <Input label="Budget Range" value={form.budget_range} onChange={e => set('budget_range', e.target.value)} placeholder="e.g. $10k–$50k" />
          <Input label="Next Follow-up" type="date" value={form.next_follow_up} onChange={e => set('next_follow_up', e.target.value)} />
          <Select label="Source" options={SOURCES} value={form.source} onChange={e => set('source', e.target.value)} />
          <Select label="Stage" options={STAGES} value={form.stage} onChange={e => set('stage', e.target.value)} />
          <div className="col-span-2">
            <Textarea label="Requirements" value={form.requirements} onChange={e => set('requirements', e.target.value)} rows={3} placeholder="Describe what the lead is looking for..." />
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
