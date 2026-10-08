'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/app/(dashboard)/_components/layout/DashboardLayout';
import { Card, Button, SearchInput, Table, Tr, Td, StatusBadge, Pagination, Modal, Input, Select, Textarea, StatCard } from '@/components/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientsApi } from '@/lib/api';
import { formatDate, timeAgo, extractApiError } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Plus, Eye, Building2 } from 'lucide-react';
import Link from 'next/link';

const CLIENT_TYPES = [
  { value: 'company', label: 'Company' },
  { value: 'individual', label: 'Individual' },
  { value: 'government', label: 'Government' },
  { value: 'non_profit', label: 'Non-Profit' },
];

const INDUSTRIES = [
  { value: 'technology', label: 'Technology' }, { value: 'finance', label: 'Finance' },
  { value: 'healthcare', label: 'Healthcare' }, { value: 'education', label: 'Education' },
  { value: 'retail', label: 'Retail' }, { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'other', label: 'Other' },
];

export default function ClientsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'company', email: '', phone: '', website: '', industry: '', country: '', city: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['clients', { page, search }],
    queryFn: () => clientsApi.list({ page, limit: 20, search: search || undefined }).then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: () => clientsApi.create(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['clients'] }); setShowCreate(false); toast.success('Client created'); },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const clients = data?.data || [];
  const totalPages = Math.ceil((data?.total || 0) / 20);

  return (
    <DashboardLayout title="Clients" breadcrumbs={[{ label: 'Clients' }]}>
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Total Clients" value={data?.total || 0} icon={<Building2 className="w-5 h-5" />} color="blue" />
          <StatCard title="Active" value={clients.filter((c: any) => c.status === 'active').length} icon={<Building2 className="w-5 h-5" />} color="green" />
          <StatCard title="Companies" value={clients.filter((c: any) => c.type === 'company').length} icon={<Building2 className="w-5 h-5" />} color="purple" />
          <StatCard title="Individuals" value={clients.filter((c: any) => c.type === 'individual').length} icon={<Building2 className="w-5 h-5" />} color="orange" />
        </div>

        <Card padding={false}>
          <div className="flex items-center gap-3 p-4 border-b border-slate-100">
            <SearchInput value={search} onChange={setSearch} placeholder="Search clients…" className="flex-1 max-w-xs" />
            <div className="ml-auto">
              <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setShowCreate(true)}>New Client</Button>
            </div>
          </div>
          <Table
            headers={['Client', 'Type', 'Industry', 'Email', 'Phone', 'Status', 'Since', '']}
            loading={isLoading}
            empty={!clients.length}
            emptyMessage="No clients found"
          >
            {clients.map((c: any) => (
              <Tr key={c.id}>
                <Td>
                  <div className="flex items-center gap-3">
                    {c.logo_url ? (
                      <img src={c.logo_url} className="w-8 h-8 rounded object-contain" alt="" />
                    ) : (
                      <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-sm">
                        {c.name?.[0]}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-slate-900">{c.name}</p>
                      {c.website && <p className="text-xs text-blue-600">{c.website}</p>}
                    </div>
                  </div>
                </Td>
                <Td className="capitalize">{c.type?.replace(/_/g, ' ')}</Td>
                <Td className="capitalize">{c.industry || '—'}</Td>
                <Td>{c.email}</Td>
                <Td>{c.phone || '—'}</Td>
                <Td><StatusBadge status={c.status || 'active'} /></Td>
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
            <Input label="Client Name *" value={form.name} onChange={e => set('name', e.target.value)} />
          </div>
          <Select label="Type" options={CLIENT_TYPES} value={form.type} onChange={e => set('type', e.target.value)} />
          <Select label="Industry" options={INDUSTRIES} value={form.industry} onChange={e => set('industry', e.target.value)} />
          <Input label="Email" type="email" value={form.email} onChange={e => set('email', e.target.value)} />
          <Input label="Phone" value={form.phone} onChange={e => set('phone', e.target.value)} />
          <Input label="Website" type="url" value={form.website} onChange={e => set('website', e.target.value)} placeholder="https://..." />
          <Input label="Country" value={form.country} onChange={e => set('country', e.target.value)} />
        </div>
      </Modal>
    </DashboardLayout>
  );
}
