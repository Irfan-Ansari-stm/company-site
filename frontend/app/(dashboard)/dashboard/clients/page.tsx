'use client';

import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/app/(dashboard)/_components/layout/DashboardLayout';
import {
  Card, Button, SearchInput, Table, Tr, Td, StatusBadge, Pagination,
  Modal, Input, Select, StatCard, Badge, Textarea
} from '@/components/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientsApi } from '@/lib/api';
import { formatDate, extractApiError } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Plus, Eye, Building2, UserCheck, Briefcase, Users, X,
  Edit2, Trash2, Download, ExternalLink, Mail, Phone,
  AlertCircle, ShieldAlert
} from 'lucide-react';
import Link from 'next/link';

export const CLIENT_TYPES = [
  { value: 'company', label: 'Company' },
  { value: 'individual', label: 'Individual' },
  { value: 'government', label: 'Government' },
  { value: 'non_profit', label: 'Non-Profit' },
];

export const INDUSTRIES = [
  { value: 'technology', label: 'Technology' },
  { value: 'finance', label: 'Finance' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'education', label: 'Education' },
  { value: 'retail', label: 'Retail' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'media', label: 'Media & Entertainment' },
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'other', label: 'Other' },
];

export const STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'churned', label: 'Churned' },
  { value: 'archived', label: 'Archived' },
];

const SORT_OPTIONS = [
  { value: 'created_at:DESC', label: 'Newest First' },
  { value: 'created_at:ASC', label: 'Oldest First' },
  { value: 'name:ASC', label: 'Name A–Z' },
  { value: 'name:DESC', label: 'Name Z–A' },
  { value: 'status:ASC', label: 'Status' },
];

export default function ClientsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortOption, setSortOption] = useState('created_at:DESC');

  // Modals state
  const [showCreate, setShowCreate] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [deletingClient, setDeletingClient] = useState<any>(null);

  // Form State
  const initialForm = {
    name: '',
    type: 'company',
    email: '',
    phone: '',
    website: '',
    industry: 'technology',
    country: '',
    city: '',
    status: 'active',
    account_manager: '',
    contact_person: '',
    description: '',
  };
  const [form, setForm] = useState(initialForm);

  // Parse sorting
  const [sortBy, sortDir] = sortOption.split(':');

  // Queries
  const { data, isLoading } = useQuery({
    queryKey: ['clients', { page, search, type: typeFilter, status: statusFilter, sortBy, sortDir }],
    queryFn: () => clientsApi.list({
      page,
      limit: 20,
      search: search || undefined,
      type: typeFilter || undefined,
      status: statusFilter || undefined,
      sort_by: sortBy,
      sort_dir: sortDir,
    }).then(r => r.data),
  });

  const { data: overviewData } = useQuery({
    queryKey: ['clients-overview'],
    queryFn: () => clientsApi.getOverview().then(r => r.data.data),
  });

  const { data: managersData } = useQuery({
    queryKey: ['client-account-managers'],
    queryFn: () => clientsApi.getAccountManagers().then(r => r.data.data).catch(() => []),
  });

  const managerOptions = useMemo(() => {
    const list = [{ value: '', label: 'Unassigned Account Manager' }];
    if (Array.isArray(managersData)) {
      managersData.forEach((u: any) => {
        list.push({
          value: u.id,
          label: `${u.display_name || `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email} (${u.role})`
        });
      });
    }
    return list;
  }, [managersData]);

  const invalidateAllClients = () => {
    qc.invalidateQueries({ queryKey: ['clients'] });
    qc.invalidateQueries({ queryKey: ['clients-overview'] });
  };

  // Mutations
  const createMutation = useMutation({
    mutationFn: () => {
      const payload: any = { ...form };
      if (!payload.account_manager) delete payload.account_manager;
      return clientsApi.create(payload);
    },
    onSuccess: () => {
      invalidateAllClients();
      setShowCreate(false);
      setForm(initialForm);
      toast.success('Client created successfully');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => {
      const payload: any = { ...data };
      if (!payload.account_manager) payload.account_manager = null;
      return clientsApi.update(id, payload);
    },
    onSuccess: () => {
      invalidateAllClients();
      setEditingClient(null);
      toast.success('Client updated successfully');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => clientsApi.delete(id),
    onSuccess: () => {
      invalidateAllClients();
      setDeletingClient(null);
      toast.success('Client archived successfully');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  // CSV Export
  const handleExport = async () => {
    try {
      toast.loading('Exporting client directory...', { id: 'client-export' });
      const res = await clientsApi.exportClients({
        search: search || undefined,
        type: typeFilter || undefined,
        status: statusFilter || undefined,
      });
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `clients-export-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Clients exported successfully', { id: 'client-export' });
    } catch (err: any) {
      toast.error('Export failed: ' + extractApiError(err), { id: 'client-export' });
    }
  };

  const setFormField = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const clients = data?.data || [];
  const totalPages = Math.ceil((data?.total || 0) / 20);

  const totalCount = overviewData?.total ?? data?.total ?? 0;
  const activeCount = overviewData?.active ?? data?.summary?.active ?? clients.filter((c: any) => c.status === 'active').length;
  const companiesCount = overviewData?.companies ?? data?.summary?.companies ?? clients.filter((c: any) => c.type === 'company').length;
  const individualsCount = overviewData?.individuals ?? data?.summary?.individuals ?? clients.filter((c: any) => c.type === 'individual').length;

  return (
    <DashboardLayout title="Clients" breadcrumbs={[{ label: 'Clients' }]}>
      <div className="space-y-6">
        {/* 1. Statistics Cards (Equal heights, responsive 4-column grid, dynamic database aggregations) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            type="button"
            onClick={() => { setTypeFilter(''); setStatusFilter(''); setSearch(''); setPage(1); }}
            className="text-left w-full focus:outline-none transition-transform hover:scale-[1.01]"
          >
            <StatCard
              title="Total Clients"
              value={totalCount}
              subtitle={`${overviewData?.new_this_month ?? 0} new this month`}
              icon={<Building2 className="w-5 h-5 text-blue-600" />}
              color="blue"
            />
          </button>

          <button
            type="button"
            onClick={() => { setStatusFilter(statusFilter === 'active' ? '' : 'active'); setPage(1); }}
            className="text-left w-full focus:outline-none transition-transform hover:scale-[1.01]"
          >
            <StatCard
              title="Active"
              value={activeCount}
              subtitle="In good standing"
              icon={<UserCheck className="w-5 h-5 text-emerald-600" />}
              color="green"
            />
          </button>

          <button
            type="button"
            onClick={() => { setTypeFilter(typeFilter === 'company' ? '' : 'company'); setPage(1); }}
            className="text-left w-full focus:outline-none transition-transform hover:scale-[1.01]"
          >
            <StatCard
              title="Companies"
              value={companiesCount}
              subtitle="Corporate entities"
              icon={<Briefcase className="w-5 h-5 text-purple-600" />}
              color="purple"
            />
          </button>

          <button
            type="button"
            onClick={() => { setTypeFilter(typeFilter === 'individual' ? '' : 'individual'); setPage(1); }}
            className="text-left w-full focus:outline-none transition-transform hover:scale-[1.01]"
          >
            <StatCard
              title="Individuals"
              value={individualsCount}
              subtitle="Private accounts"
              icon={<Users className="w-5 h-5 text-amber-600" />}
              color="orange"
            />
          </button>
        </div>

        {/* 2. Compact, Professional Toolbar & Client Directory Table */}
        <Card padding={false} className="overflow-hidden">
          {/* Organized, Non-Wrapping Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-slate-100 bg-slate-50/50">
            {/* Search + Dropdowns in one compact row */}
            <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
              <div className="w-full sm:w-60 lg:w-72">
                <SearchInput
                  value={search}
                  onChange={(val) => { setSearch(val); setPage(1); }}
                  placeholder="Search clients..."
                  className="w-full"
                />
              </div>

              <div className="w-32 sm:w-36">
                <Select
                  options={[{ value: '', label: 'All types' }, ...CLIENT_TYPES]}
                  value={typeFilter}
                  onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
                  containerClassName="w-full"
                />
              </div>

              <div className="w-32 sm:w-36">
                <Select
                  options={[{ value: '', label: 'All statuses' }, ...STATUSES]}
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                  containerClassName="w-full"
                />
              </div>

              <div className="w-36 sm:w-40 hidden md:block">
                <Select
                  options={SORT_OPTIONS}
                  value={sortOption}
                  onChange={(e) => { setSortOption(e.target.value); setPage(1); }}
                  containerClassName="w-full"
                />
              </div>

              {(typeFilter || statusFilter || search) && (
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<X className="w-3.5 h-3.5" />}
                  onClick={() => { setTypeFilter(''); setStatusFilter(''); setSearch(''); setPage(1); }}
                  className="text-slate-500 hover:text-slate-800"
                >
                  Clear
                </Button>
              )}
            </div>

            {/* Actions: Export + New Client */}
            <div className="flex items-center gap-2 ml-auto">
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
                icon={<Plus className="w-4 h-4" />}
                onClick={() => setShowCreate(true)}
              >
                New Client
              </Button>
            </div>
          </div>

          {/* 3. Clients Table with Precise Column Alignment */}
          <Table
            headers={[
              'Client',
              'Type',
              'Industry',
              'Email',
              'Phone',
              'Status',
              'Projects',
              'Since',
              'Actions'
            ]}
            loading={isLoading}
            empty={!clients.length}
            emptyMessage="No clients found matching your search criteria"
          >
            {clients.map((c: any) => (
              <Tr key={c.id}>
                <Td>
                  <div className="flex items-center gap-3 min-w-[200px]">
                    {c.logo_url ? (
                      <img
                        src={c.logo_url}
                        className="w-9 h-9 rounded-lg object-contain border border-slate-200 bg-white p-0.5 flex-shrink-0"
                        alt=""
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm">
                        {c.name?.[0]?.toUpperCase() || 'C'}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/dashboard/clients/${c.id}`}
                        className="font-semibold text-slate-900 hover:text-blue-600 transition-colors block truncate"
                        title={c.name}
                      >
                        {c.name}
                      </Link>
                      {c.website ? (
                        <a
                          href={c.website.startsWith('http') ? c.website : `https://${c.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-500 hover:text-blue-700 hover:underline flex items-center gap-1 truncate"
                        >
                          <span className="truncate">{c.website.replace(/^https?:\/\//, '')}</span>
                          <ExternalLink className="w-2.5 h-2.5 flex-shrink-0 opacity-70" />
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400 capitalize">{c.city || c.country || 'Corporate'}</span>
                      )}
                    </div>
                  </div>
                </Td>

                <Td>
                  <Badge variant="default" className="capitalize text-xs font-medium">
                    {c.type?.replace(/_/g, ' ') || 'Company'}
                  </Badge>
                </Td>

                <Td>
                  <span className="text-sm text-slate-600 capitalize">
                    {c.industry || '—'}
                  </span>
                </Td>

                <Td>
                  {c.email || c.billing_email ? (
                    <a
                      href={`mailto:${c.email || c.billing_email}`}
                      className="text-sm text-slate-700 hover:text-blue-600 flex items-center gap-1.5 truncate max-w-[200px]"
                      title={c.email || c.billing_email}
                    >
                      <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{c.email || c.billing_email}</span>
                    </a>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </Td>

                <Td>
                  {c.phone ? (
                    <span className="text-sm text-slate-700 font-mono whitespace-nowrap">
                      {c.phone}
                    </span>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </Td>

                <Td>
                  <StatusBadge status={c.status || (c.is_active ? 'active' : 'inactive')} />
                </Td>

                <Td>
                  <span className="inline-flex items-center justify-center min-w-[24px] px-2 py-0.5 rounded-full text-xs font-bold font-mono bg-slate-100 text-slate-700 border border-slate-200">
                    {c.project_count || 0}
                  </span>
                </Td>

                <Td>
                  <span className="text-xs text-slate-500 whitespace-nowrap">
                    {formatDate(c.created_at)}
                  </span>
                </Td>

                <Td>
                  <div className="flex items-center gap-1">
                    <Link href={`/dashboard/clients/${c.id}`}>
                      <Button variant="ghost" size="sm" icon={<Eye className="w-3.5 h-3.5" />}>
                        View
                      </Button>
                    </Link>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingClient({
                          id: c.id,
                          name: c.name || c.company_name || '',
                          type: c.type || 'company',
                          email: c.email || c.billing_email || '',
                          phone: c.phone || '',
                          website: c.website || '',
                          industry: c.industry || 'technology',
                          country: c.country || '',
                          city: c.city || '',
                          status: c.status || 'active',
                          account_manager: c.account_manager || '',
                          description: c.notes || '',
                        });
                      }}
                      icon={<Edit2 className="w-3.5 h-3.5 text-slate-500" />}
                    />

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeletingClient(c)}
                      icon={<Trash2 className="w-3.5 h-3.5 text-rose-500 hover:text-rose-700" />}
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
            total={data?.total}
            limit={20}
          />
        </Card>
      </div>

      {/* MODAL 1: Create Client Modal */}
      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Add New Client"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button
              loading={createMutation.isPending}
              onClick={() => {
                if (!form.name.trim()) {
                  toast.error('Client name is required');
                  return;
                }
                if (!form.email.trim()) {
                  toast.error('Email address is required');
                  return;
                }
                createMutation.mutate();
              }}
            >
              Create Client
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 sm:col-span-1">
            <Select
              label="Client Type"
              options={CLIENT_TYPES}
              value={form.type}
              onChange={e => setFormField('type', e.target.value)}
            />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <Select
              label="Industry"
              options={INDUSTRIES}
              value={form.industry}
              onChange={e => setFormField('industry', e.target.value)}
            />
          </div>

          <div className="col-span-2">
            <Input
              label={form.type === 'individual' ? "Full Name *" : "Company / Client Name *"}
              value={form.name}
              onChange={e => setFormField('name', e.target.value)}
              placeholder={form.type === 'individual' ? "e.g. Jane Smith" : "e.g. Acme Corporation"}
            />
          </div>

          {form.type !== 'individual' && (
            <div className="col-span-2">
              <Input
                label="Primary Contact Person"
                value={form.contact_person}
                onChange={e => setFormField('contact_person', e.target.value)}
                placeholder="e.g. Robert Vance (VP of Operations)"
              />
            </div>
          )}

          <Input
            label="Official / Billing Email *"
            type="email"
            value={form.email}
            onChange={e => setFormField('email', e.target.value)}
            placeholder="billing@client.com"
          />

          <Input
            label="Phone Number"
            value={form.phone}
            onChange={e => setFormField('phone', e.target.value)}
            placeholder="+1 (555) 000-0000"
          />

          <Input
            label="Website"
            type="url"
            value={form.website}
            onChange={e => setFormField('website', e.target.value)}
            placeholder="https://company.com"
          />

          <Select
            label="Initial Status"
            options={STATUSES}
            value={form.status}
            onChange={e => setFormField('status', e.target.value)}
          />

          <Input
            label="Country"
            value={form.country}
            onChange={e => setFormField('country', e.target.value)}
            placeholder="United States"
          />

          <Input
            label="City"
            value={form.city}
            onChange={e => setFormField('city', e.target.value)}
            placeholder="San Francisco"
          />

          <div className="col-span-2">
            <Select
              label="Assigned Account Manager"
              options={managerOptions}
              value={form.account_manager}
              onChange={e => setFormField('account_manager', e.target.value)}
            />
          </div>

          <div className="col-span-2">
            <Textarea
              label="Internal Notes / Description"
              value={form.description}
              onChange={e => setFormField('description', e.target.value)}
              rows={2}
              placeholder="Key notes, service agreements, or background context..."
            />
          </div>
        </div>
      </Modal>

      {/* MODAL 2: Edit Client Modal */}
      <Modal
        open={!!editingClient}
        onClose={() => setEditingClient(null)}
        title="Edit Client Information"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setEditingClient(null)}>Cancel</Button>
            <Button
              loading={updateMutation.isPending}
              onClick={() => {
                if (!editingClient.name?.trim()) {
                  toast.error('Client name is required');
                  return;
                }
                updateMutation.mutate({ id: editingClient.id, data: editingClient });
              }}
            >
              Save Changes
            </Button>
          </>
        }
      >
        {editingClient && (
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <Select
                label="Client Type"
                options={CLIENT_TYPES}
                value={editingClient.type}
                onChange={e => setEditingClient({ ...editingClient, type: e.target.value })}
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <Select
                label="Industry"
                options={INDUSTRIES}
                value={editingClient.industry || 'technology'}
                onChange={e => setEditingClient({ ...editingClient, industry: e.target.value })}
              />
            </div>

            <div className="col-span-2">
              <Input
                label="Client / Company Name *"
                value={editingClient.name}
                onChange={e => setEditingClient({ ...editingClient, name: e.target.value })}
              />
            </div>

            <Input
              label="Email Address *"
              type="email"
              value={editingClient.email}
              onChange={e => setEditingClient({ ...editingClient, email: e.target.value })}
            />

            <Input
              label="Phone Number"
              value={editingClient.phone || ''}
              onChange={e => setEditingClient({ ...editingClient, phone: e.target.value })}
            />

            <Input
              label="Website"
              type="url"
              value={editingClient.website || ''}
              onChange={e => setEditingClient({ ...editingClient, website: e.target.value })}
            />

            <Select
              label="Status"
              options={STATUSES}
              value={editingClient.status}
              onChange={e => setEditingClient({ ...editingClient, status: e.target.value })}
            />

            <Input
              label="Country"
              value={editingClient.country || ''}
              onChange={e => setEditingClient({ ...editingClient, country: e.target.value })}
            />

            <Input
              label="City"
              value={editingClient.city || ''}
              onChange={e => setEditingClient({ ...editingClient, city: e.target.value })}
            />

            <div className="col-span-2">
              <Select
                label="Assigned Account Manager"
                options={managerOptions}
                value={editingClient.account_manager || ''}
                onChange={e => setEditingClient({ ...editingClient, account_manager: e.target.value })}
              />
            </div>

            <div className="col-span-2">
              <Textarea
                label="Notes"
                value={editingClient.description || ''}
                onChange={e => setEditingClient({ ...editingClient, description: e.target.value })}
                rows={2}
              />
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL 3: Delete / Archive Client Modal */}
      <Modal
        open={!!deletingClient}
        onClose={() => setDeletingClient(null)}
        title="Archive Client"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeletingClient(null)}>Cancel</Button>
            <Button
              variant="danger"
              loading={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate(deletingClient.id)}
            >
              Confirm Archive
            </Button>
          </>
        }
      >
        {deletingClient && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertCircle className="w-6 h-6 flex-shrink-0" />
              <p className="font-semibold text-slate-900">
                Are you sure you want to archive this client?
              </p>
            </div>
            <p className="text-sm text-slate-600">
              Client <strong>{deletingClient.name}</strong> will be safely soft-deleted and marked as archived. All linked projects, invoices, and activity history will be preserved for compliance.
            </p>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
