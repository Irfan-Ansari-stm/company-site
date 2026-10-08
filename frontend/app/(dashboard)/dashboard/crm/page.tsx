'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/app/(dashboard)/_components/layout/DashboardLayout';
import {
  Card, Button, SearchInput, Table, Tr, Td, StatusBadge, Pagination,
  Modal, Input, Select, Textarea, PageLoader, EmptyState, StatCard
} from '@/components/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { crmApi } from '@/lib/api';
import { formatDate, formatCurrency, extractApiError, getStatusColor } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Plus, Users, TrendingUp, DollarSign, Eye, Phone, Mail } from 'lucide-react';
import Link from 'next/link';

const STAGES = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'proposal', label: 'Proposal' },
  { value: 'negotiation', label: 'Negotiation' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
];

const SOURCES = [
  { value: 'website', label: 'Website' },
  { value: 'referral', label: 'Referral' },
  { value: 'social_media', label: 'Social Media' },
  { value: 'email_campaign', label: 'Email Campaign' },
  { value: 'google_ads', label: 'Google Ads' },
  { value: 'direct', label: 'Direct' },
  { value: 'other', label: 'Other' },
];

export default function CRMPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', phone: '', company: '', source: 'website', stage: 'new', requirements: '', budget_range: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['leads', { page, search, stage: stageFilter }],
    queryFn: () => crmApi.getLeads({ page, limit: 20, search, stage: stageFilter || undefined }).then(r => r.data),
  });

  const { data: pipelineData } = useQuery({
    queryKey: ['pipeline'],
    queryFn: () => crmApi.getLeadPipeline().then(r => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: crmApi.createLead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leads'] });
      setShowCreate(false);
      setForm({ first_name: '', last_name: '', email: '', phone: '', company: '', source: 'website', stage: 'new', requirements: '', budget_range: '' });
      toast.success('Lead created');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const leads = data?.data || [];
  const totalPages = Math.ceil((data?.total || 0) / 20);

  // Pipeline summary by stage
  const pipelineByStage = STAGES.map(s => {
    const row = pipelineData?.find((p: any) => p.stage === s.value);
    return { ...s, count: row?.count || 0, value: row?.total_value || 0 };
  });

  return (
    <DashboardLayout title="CRM" breadcrumbs={[{ label: 'CRM' }]}>
      <div className="space-y-6">
        {/* Pipeline Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {pipelineByStage.map((stage) => (
            <button
              key={stage.value}
              onClick={() => setStageFilter(stageFilter === stage.value ? '' : stage.value)}
              className={`bg-white rounded-xl border p-3 text-left transition-all hover:shadow-md ${stageFilter === stage.value ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200'}`}
            >
              <p className="text-xs text-slate-500 font-medium capitalize">{stage.label}</p>
              <p className="text-xl font-bold text-slate-900 mt-0.5">{stage.count}</p>
              {stage.value !== 'lost' && stage.value !== 'won' && (
                <p className="text-xs text-slate-400 mt-0.5">{formatCurrency(stage.value || 0, 'USD')}</p>
              )}
            </button>
          ))}
        </div>

        {/* Table */}
        <Card padding={false}>
          <div className="flex items-center gap-3 p-4 border-b border-slate-100">
            <SearchInput value={search} onChange={setSearch} placeholder="Search leads..." className="flex-1 max-w-xs" />
            <Select
              options={[{ value: '', label: 'All stages' }, ...STAGES]}
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="w-40"
            />
            <div className="ml-auto flex gap-2">
              <Button size="sm" onClick={() => setShowCreate(true)} icon={<Plus className="w-4 h-4" />}>
                Add Lead
              </Button>
            </div>
          </div>

          <Table
            headers={['Name', 'Company', 'Stage', 'Source', 'Score', 'Next Follow-up', 'Assigned To', '']}
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
                <Td className="capitalize">{lead.source?.replace(/_/g, ' ')}</Td>
                <Td>
                  <div className="flex items-center gap-1.5">
                    <div className="h-1.5 w-16 bg-slate-100 rounded-full">
                      <div className="h-1.5 bg-blue-500 rounded-full" style={{ width: `${lead.lead_score || 0}%` }} />
                    </div>
                    <span className="text-xs text-slate-500">{lead.lead_score || 0}</span>
                  </div>
                </Td>
                <Td>{lead.next_follow_up ? formatDate(lead.next_follow_up) : '—'}</Td>
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
          <Input label="Budget Range" value={form.budget_range} onChange={e => set('budget_range', e.target.value)} placeholder="e.g. $10k–$50k" />
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
