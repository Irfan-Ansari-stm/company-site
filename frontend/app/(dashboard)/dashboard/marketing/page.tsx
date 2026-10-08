'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/app/(dashboard)/_components/layout/DashboardLayout';
import { Card, Button, SearchInput, Table, Tr, Td, StatusBadge, Pagination, Modal, Input, Select, Textarea, TabBar, StatCard, Badge } from '@/components/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { marketingApi } from '@/lib/api';
import { formatDate, timeAgo, extractApiError } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Plus, Send, Megaphone, Users, Mail, Tag } from 'lucide-react';

const CAMPAIGN_TYPES = [
  { value: 'newsletter', label: 'Newsletter' },
  { value: 'promotional', label: 'Promotional' },
  { value: 'announcement', label: 'Announcement' },
  { value: 'drip', label: 'Drip Campaign' },
];

export default function MarketingPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState('campaigns');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [createTarget, setCreateTarget] = useState<'campaign' | 'list' | 'coupon'>('campaign');
  const [form, setForm] = useState<any>({});

  const { data: campaignsData, isLoading: campLoading } = useQuery({
    queryKey: ['campaigns', { page }],
    queryFn: () => marketingApi.getCampaigns({ page, limit: 20 }).then(r => r.data),
    enabled: tab === 'campaigns',
  });

  const { data: subscribersData, isLoading: subLoading } = useQuery({
    queryKey: ['subscribers', { page, search }],
    queryFn: () => marketingApi.getSubscribers({ page, limit: 20, search: search || undefined }).then(r => r.data),
    enabled: tab === 'subscribers',
  });

  const { data: listsData } = useQuery({
    queryKey: ['marketing-lists'],
    queryFn: () => marketingApi.getLists().then(r => r.data.data),
    enabled: tab === 'lists',
  });

  const { data: couponsData } = useQuery({
    queryKey: ['coupons', { page }],
    queryFn: () => marketingApi.getCoupons({ page, limit: 20 }).then(r => r.data),
    enabled: tab === 'coupons',
  });

  const createCampaignMutation = useMutation({
    mutationFn: () => marketingApi.createCampaign(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['campaigns'] }); setShowCreate(false); toast.success('Campaign created'); },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const sendCampaignMutation = useMutation({
    mutationFn: (id: string) => marketingApi.sendCampaign(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['campaigns'] }); toast.success('Campaign sent!'); },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const createListMutation = useMutation({
    mutationFn: () => marketingApi.createList(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['marketing-lists'] }); setShowCreate(false); toast.success('List created'); },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const createCouponMutation = useMutation({
    mutationFn: () => marketingApi.createCoupon(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['coupons'] }); setShowCreate(false); toast.success('Coupon created'); },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const openCreate = (target: typeof createTarget) => {
    setCreateTarget(target);
    setForm({});
    setShowCreate(true);
  };

  const getCreateMutation = () => {
    if (createTarget === 'campaign') return createCampaignMutation;
    if (createTarget === 'list') return createListMutation;
    return createCouponMutation;
  };

  const campaigns = campaignsData?.data || [];
  const subscribers = subscribersData?.data || [];
  const coupons = couponsData?.data || [];

  return (
    <DashboardLayout title="Marketing" breadcrumbs={[{ label: 'Marketing' }]}>
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Total Subscribers" value={subscribersData?.total || 0} icon={<Users className="w-5 h-5" />} color="blue" />
          <StatCard title="Email Lists" value={listsData?.length || 0} icon={<Mail className="w-5 h-5" />} color="green" />
          <StatCard title="Campaigns" value={campaignsData?.total || 0} icon={<Megaphone className="w-5 h-5" />} color="purple" />
          <StatCard title="Active Coupons" value={coupons.filter((c: any) => c.is_active).length} icon={<Tag className="w-5 h-5" />} color="orange" />
        </div>

        <TabBar
          tabs={[
            { id: 'campaigns', label: 'Campaigns', count: campaignsData?.total },
            { id: 'subscribers', label: 'Subscribers', count: subscribersData?.total },
            { id: 'lists', label: 'Lists', count: listsData?.length },
            { id: 'coupons', label: 'Coupons', count: couponsData?.total },
          ]}
          active={tab}
          onChange={setTab}
        />

        {/* CAMPAIGNS */}
        {tab === 'campaigns' && (
          <Card padding={false}>
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800">Email Campaigns</h3>
              <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => openCreate('campaign')}>New Campaign</Button>
            </div>
            <Table
              headers={['Name', 'Type', 'Status', 'Recipients', 'Open Rate', 'Click Rate', 'Sent At', '']}
              loading={campLoading}
              empty={!campaigns.length}
              emptyMessage="No campaigns yet"
            >
              {campaigns.map((c: any) => (
                <Tr key={c.id}>
                  <Td>
                    <p className="font-medium text-slate-900">{c.name}</p>
                    <p className="text-xs text-slate-500 truncate max-w-[200px]">{c.subject}</p>
                  </Td>
                  <Td><Badge className="capitalize">{c.type}</Badge></Td>
                  <Td><StatusBadge status={c.status} /></Td>
                  <Td>{c.recipient_count || 0}</Td>
                  <Td>
                    {c.open_count && c.recipient_count ? (
                      <span className="text-green-700 font-medium">
                        {((c.open_count / c.recipient_count) * 100).toFixed(1)}%
                      </span>
                    ) : '—'}
                  </Td>
                  <Td>
                    {c.click_count && c.recipient_count ? (
                      <span className="text-blue-700 font-medium">
                        {((c.click_count / c.recipient_count) * 100).toFixed(1)}%
                      </span>
                    ) : '—'}
                  </Td>
                  <Td>{c.sent_at ? timeAgo(c.sent_at) : '—'}</Td>
                  <Td>
                    {c.status === 'draft' && (
                      <Button variant="ghost" size="sm" icon={<Send className="w-4 h-4" />}
                        onClick={() => confirm('Send this campaign now?') && sendCampaignMutation.mutate(c.id)}
                        loading={sendCampaignMutation.isPending}
                      >
                        Send
                      </Button>
                    )}
                  </Td>
                </Tr>
              ))}
            </Table>
            <Pagination page={page} totalPages={Math.ceil((campaignsData?.total || 0) / 20)} onPageChange={setPage} total={campaignsData?.total} limit={20} />
          </Card>
        )}

        {/* SUBSCRIBERS */}
        {tab === 'subscribers' && (
          <Card padding={false}>
            <div className="flex items-center gap-3 p-4 border-b border-slate-100">
              <SearchInput value={search} onChange={setSearch} placeholder="Search subscribers…" className="flex-1 max-w-xs" />
            </div>
            <Table
              headers={['Email', 'Name', 'Status', 'Lists', 'Subscribed', '']}
              loading={subLoading}
              empty={!subscribers.length}
              emptyMessage="No subscribers"
            >
              {subscribers.map((s: any) => (
                <Tr key={s.id}>
                  <Td className="font-medium">{s.email}</Td>
                  <Td>{[s.first_name, s.last_name].filter(Boolean).join(' ') || '—'}</Td>
                  <Td><StatusBadge status={s.status} /></Td>
                  <Td>{s.list_count || 0} lists</Td>
                  <Td>{timeAgo(s.subscribed_at || s.created_at)}</Td>
                  <Td>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500"
                      onClick={() => marketingApi.unsubscribe(s.email).then(() => { qc.invalidateQueries({ queryKey: ['subscribers'] }); toast.success('Unsubscribed'); })}
                    >
                      Unsub
                    </Button>
                  </Td>
                </Tr>
              ))}
            </Table>
            <Pagination page={page} totalPages={Math.ceil((subscribersData?.total || 0) / 20)} onPageChange={setPage} total={subscribersData?.total} limit={20} />
          </Card>
        )}

        {/* LISTS */}
        {tab === 'lists' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => openCreate('list')}>New List</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {listsData?.map((l: any) => (
                <Card key={l.id} className="!p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{l.name}</p>
                      {l.description && <p className="text-xs text-slate-500 mt-0.5">{l.description}</p>}
                    </div>
                    <Badge variant={l.is_active ? 'success' : 'default'}>{l.is_active ? 'Active' : 'Inactive'}</Badge>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="text-slate-500">{l.subscriber_count || 0} subscribers</span>
                    <span className="text-xs text-slate-400">{l.type}</span>
                  </div>
                </Card>
              ))}
              {!listsData?.length && <p className="col-span-full text-center text-slate-500 py-8">No lists created</p>}
            </div>
          </div>
        )}

        {/* COUPONS */}
        {tab === 'coupons' && (
          <Card padding={false}>
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800">Discount Coupons</h3>
              <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => openCreate('coupon')}>New Coupon</Button>
            </div>
            <Table
              headers={['Code', 'Type', 'Value', 'Uses', 'Limit', 'Expires', 'Status', '']}
              empty={!coupons.length}
              emptyMessage="No coupons yet"
            >
              {coupons.map((c: any) => (
                <Tr key={c.id}>
                  <Td><code className="bg-slate-100 px-2 py-0.5 rounded font-bold text-sm">{c.code}</code></Td>
                  <Td className="capitalize">{c.discount_type?.replace(/_/g, ' ')}</Td>
                  <Td className="font-semibold text-green-700">
                    {c.discount_type === 'percentage' ? `${c.discount_value}%` : `$${c.discount_value}`}
                  </Td>
                  <Td>{c.used_count || 0}</Td>
                  <Td>{c.usage_limit || '∞'}</Td>
                  <Td>{c.expires_at ? formatDate(c.expires_at) : '—'}</Td>
                  <Td><StatusBadge status={c.is_active ? 'active' : 'inactive'} /></Td>
                  <Td>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => marketingApi.updateCoupon(c.id, { is_active: !c.is_active }).then(() => { qc.invalidateQueries({ queryKey: ['coupons'] }); })}
                    >
                      {c.is_active ? 'Disable' : 'Enable'}
                    </Button>
                  </Td>
                </Tr>
              ))}
            </Table>
          </Card>
        )}
      </div>

      {/* Create Modal */}
      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title={createTarget === 'campaign' ? 'New Campaign' : createTarget === 'list' ? 'New List' : 'New Coupon'}
        footer={
          <>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button loading={getCreateMutation().isPending} onClick={() => getCreateMutation().mutate()}>Create</Button>
          </>
        }
      >
        {createTarget === 'campaign' && (
          <div className="space-y-4">
            <Input label="Campaign Name *" value={form.name || ''} onChange={e => set('name', e.target.value)} />
            <Input label="Subject Line *" value={form.subject || ''} onChange={e => set('subject', e.target.value)} />
            <Input label="From Name" value={form.from_name || ''} onChange={e => set('from_name', e.target.value)} />
            <Select label="Type" options={CAMPAIGN_TYPES} value={form.type || 'newsletter'} onChange={e => set('type', e.target.value)} />
            <Textarea label="Preview Text" value={form.preview_text || ''} onChange={e => set('preview_text', e.target.value)} rows={2} />
          </div>
        )}
        {createTarget === 'list' && (
          <div className="space-y-4">
            <Input label="List Name *" value={form.name || ''} onChange={e => set('name', e.target.value)} />
            <Textarea label="Description" value={form.description || ''} onChange={e => set('description', e.target.value)} rows={2} />
          </div>
        )}
        {createTarget === 'coupon' && (
          <div className="space-y-4">
            <Input label="Coupon Code *" value={form.code || ''} onChange={e => set('code', e.target.value.toUpperCase())} placeholder="SAVE20" />
            <Select label="Discount Type" options={[{ value: 'percentage', label: 'Percentage (%)' }, { value: 'fixed_amount', label: 'Fixed Amount ($)' }]} value={form.discount_type || 'percentage'} onChange={e => set('discount_type', e.target.value)} />
            <Input label="Discount Value" type="number" value={form.discount_value || ''} onChange={e => set('discount_value', e.target.value)} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Min Order Amount" type="number" value={form.min_order_amount || ''} onChange={e => set('min_order_amount', e.target.value)} />
              <Input label="Usage Limit" type="number" value={form.usage_limit || ''} onChange={e => set('usage_limit', e.target.value)} />
            </div>
            <Input label="Expires At" type="datetime-local" value={form.expires_at || ''} onChange={e => set('expires_at', e.target.value)} />
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
