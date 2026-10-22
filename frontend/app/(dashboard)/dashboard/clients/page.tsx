'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/app/(dashboard)/_components/layout/DashboardLayout';
import { Card, Button, SearchInput, Table, Tr, Td, StatusBadge, Pagination, Modal, Input, Select, StatCard } from '@/components/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientsApi } from '@/lib/api';
import { formatDate, extractApiError } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Plus, Eye, Building2, UserCheck, Briefcase, Users, X } from 'lucide-react';
import Link from 'next/link';

const CLIENT_TYPES = [
  { value: 'company', label: 'Company' },
  { value: 'individual', label: 'Individual' },
  { value: 'government', label: 'Government' },
  { value: 'non_profit', label: 'Non-Profit' },
];

const INDUSTRIES = [
  { value: 'technology', label: 'Technology' },
  { value: 'finance', label: 'Finance' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'education', label: 'Education' },
  { value: 'retail', label: 'Retail' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'other', label: 'Other' },
];

const STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'churned', label: 'Churned' },
  { value: 'archived', label: 'Archived' },
];

export default function ClientsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    name: '',
    type: 'company',
    email: '',
    phone: '',
    website: '',
    industry: 'technology',
    country: '',
    city: ''
  });

  const { data, isLoading } = useQuery({
    queryKey: ['clients', { page, search, type: typeFilter, status: statusFilter }],
    queryFn: () => clientsApi.list({
      page,
      limit: 20,
      search: search || undefined,
      type: typeFilter || undefined,
      status: statusFilter || undefined,
    }).then(r => r.data),
  });

  const { data: overviewData } = useQuery({
    queryKey: ['clients-overview'],
    queryFn: () => clientsApi.getOverview().then(r => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: () => clientsApi.create(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients'] });
      qc.invalidateQueries({ queryKey: ['clients-overview'] });
      setShowCreate(false);
      setForm({ name: '', type: 'company', email: '', phone: '', website: '', industry: 'technology', country: '', city: '' });
      toast.success('Client created successfully');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const clients = data?.data || [];
  const totalPages = Math.ceil((data?.total || 0) / 20);

  const totalCount = overviewData?.total ?? data?.total ?? 0;
  const activeCount = overviewData?.active ?? data?.summary?.active ?? clients.filter((c: any) => c.status === 'active').length;
  const companiesCount = overviewData?.companies ?? data?.summary?.companies ?? clients.filter((c: any) => c.type === 'company').length;
  const individualsCount = overviewData?.individuals ?? data?.summary?.individuals ?? clients.filter((c: any) => c.type === 'individual').length;

  return (
    <DashboardLayout title="Clients" breadcrumbs={[{ label: 'Clients' }]}>
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="Total Clients"
            value={totalCount}
            subtitle={`${overviewData?.new_this_month ?? 0} new this month`}
            icon={<Building2 className="w-5 h-5" />}
            color="blue"
          />
          <StatCard
            title="Active"
            value={activeCount}
            subtitle="In good standing"
            icon={<UserCheck className="w-5 h-5" />}
            color="green"
          />
          <StatCard
            title="Companies"
            value={companiesCount}
            subtitle="Corporate entities"
            icon={<Briefcase className="w-5 h-5" />}
            color="purple"
          />
          <StatCard
            title="Individuals"
            value={individualsCount}
            subtitle="Private accounts"
            icon={<Users className="w-5 h-5" />}
            color="orange"
          />
        </div>

        <Card padding={false}>
          <div className="flex flex-wrap items-center gap-3 p-4 border-b border-slate-100">
            <SearchInput
              value={search}
              onChange={(val) => { setSearch(val); setPage(1); }}
              placeholder="Search clients…"
              className="flex-1 min-w-[200px] max-w-xs"
            />
            <Select
              options={[{ value: '', label: 'All types' }, ...CLIENT_TYPES]}
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
              className="w-36"
            />
            <Select
              options={[{ value: '', label: 'All statuses' }, ...STATUSES]}
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="w-36"
            />
            {(typeFilter || statusFilter || search) && (
              <Button
                variant="ghost"
                size="sm"
                icon={<X className="w-3.5 h-3.5" />}
                onClick={() => { setTypeFilter(''); setStatusFilter(''); setSearch(''); setPage(1); }}
              >
                Clear
              </Button>
            )}
            <div className="ml-auto">
              <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setShowCreate(true)}>
                New Client
              </Button>
            </div>
          </div>
          <Table
            headers={['Client', 'Type', 'Industry', 'Email', 'Phone', 'Status', 'Projects', 'Since', '']}
            loading={isLoading}
            empty={!clients.length}
            emptyMessage="No clients found"
          >
            {clients.map((c: any) => (
              <Tr key={c.id}>
                <Td>
                  <div className="flex items-center gap-3">
                    {c.logo_url ? (
                      <img src={c.logo_url} className="w-8 h-8 rounded object-contain border border-slate-100" alt="" />
                    ) : (
                      <div className="w-8 h-8 rounded bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center text-blue-700 font-bold text-sm border border-blue-200">
                        {c.name?.[0] || 'C'}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-slate-900">{c.name}</p>
                      {c.website && (
                        <a href={c.website} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                          {c.website.replace(/^https?:\/\//, '')}
                        </a>
                      )}
                    </div>
                  </div>
                </Td>
                <Td className="capitalize">{c.type?.replace(/_/g, ' ') || 'Company'}</Td>
                <Td className="capitalize">{c.industry || '—'}</Td>
                <Td>
                  <span className="text-slate-700">{c.email || c.billing_email || '—'}</span>
                </Td>
                <Td>{c.phone || '—'}</Td>
                <Td><StatusBadge status={c.status || (c.is_active ? 'active' : 'inactive')} /></Td>
                <Td>
                  <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                    {c.project_count || 0}
                  </span>
                </Td>
                <Td>{formatDate(c.created_at)}</Td>
                <Td>
                  <Link href={`/dashboard/clients/${c.id}`}>
                    <Button variant="ghost" size="sm" icon={<Eye className="w-4 h-4" />}>View</Button>
                  </Link>
                </Td>
              </Tr>
            ))}
          </Table>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} total={data?.total} limit={20} />
        </Card>
      </div>

      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="New Client"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button loading={createMutation.isPending} onClick={() => createMutation.mutate()}>Create Client</Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Input label="Client Name *" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Acme Corporation" />
          </div>
          <Select label="Type" options={CLIENT_TYPES} value={form.type} onChange={e => set('type', e.target.value)} />
          <Select label="Industry" options={INDUSTRIES} value={form.industry} onChange={e => set('industry', e.target.value)} />
          <Input label="Email" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="billing@client.com" />
          <Input label="Phone" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+1 (555) 000-0000" />
          <Input label="Website" type="url" value={form.website} onChange={e => set('website', e.target.value)} placeholder="https://..." />
          <Input label="Country" value={form.country} onChange={e => set('country', e.target.value)} placeholder="United States" />
          <Input label="City" value={form.city} onChange={e => set('city', e.target.value)} placeholder="San Francisco" />
        </div>
      </Modal>
    </DashboardLayout>
  );
}
