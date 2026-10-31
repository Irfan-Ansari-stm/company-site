'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/app/(dashboard)/_components/layout/DashboardLayout';
import {
  Card,
  Button,
  SearchInput,
  Table,
  Tr,
  Td,
  StatusBadge,
  Pagination,
  Modal,
  Input,
  Select,
  Textarea,
  TabBar,
  StatCard,
  Badge,
  EmptyState,
} from '@/components/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { marketingApi } from '@/lib/api';
import { formatDate, timeAgo, extractApiError } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Plus,
  Send,
  Megaphone,
  Users,
  Mail,
  Tag,
  Eye,
  Edit2,
  Trash2,
  Copy,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
} from 'lucide-react';

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

  // Filters
  const [campaignSearch, setCampaignSearch] = useState('');
  const [campaignStatus, setCampaignStatus] = useState('');
  const [campaignType, setCampaignType] = useState('');

  const [subscriberSearch, setSubscriberSearch] = useState('');
  const [subscriberStatus, setSubscriberStatus] = useState('');

  const [couponSearch, setCouponSearch] = useState('');

  // Modals
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<any | null>(null);
  const [viewingCampaign, setViewingCampaign] = useState<any | null>(null);
  const [deletingCampaign, setDeletingCampaign] = useState<any | null>(null);
  const [sendingCampaign, setSendingCampaign] = useState<any | null>(null);

  const [showAddSubscriber, setShowAddSubscriber] = useState(false);
  const [deletingSubscriber, setDeletingSubscriber] = useState<any | null>(null);

  const [showCreateList, setShowCreateList] = useState(false);
  const [editingList, setEditingList] = useState<any | null>(null);
  const [deletingList, setDeletingList] = useState<any | null>(null);

  const [showCreateCoupon, setShowCreateCoupon] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<any | null>(null);
  const [deletingCoupon, setDeletingCoupon] = useState<any | null>(null);

  // Forms
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    subject: '',
    type: 'newsletter',
    from_name: 'Sysmaira Team',
    from_email: 'marketing@sysmaira.com',
    preview_text: '',
    html_content: '',
  });

  const [subscriberForm, setSubscriberForm] = useState({
    email: '',
    first_name: '',
    last_name: '',
    source: 'dashboard',
  });

  const [listForm, setListForm] = useState({
    name: '',
    description: '',
  });

  const [couponForm, setCouponForm] = useState({
    code: '',
    discount_type: 'percentage',
    discount_value: '',
    min_order_amount: '',
    usage_limit: '',
    expires_at: '',
  });

  // ── Queries ────────────────────────────────────────────────
  const { data: stats } = useQuery({
    queryKey: ['marketing-stats'],
    queryFn: () => marketingApi.getStats().then((r) => r.data.data),
  });

  const { data: campaignsData, isLoading: campLoading } = useQuery({
    queryKey: ['campaigns', { page, search: campaignSearch, status: campaignStatus, type: campaignType }],
    queryFn: () =>
      marketingApi
        .getCampaigns({
          page,
          limit: 20,
          search: campaignSearch || undefined,
          status: campaignStatus || undefined,
          type: campaignType || undefined,
        })
        .then((r) => r.data),
  });

  const { data: subscribersData, isLoading: subLoading } = useQuery({
    queryKey: ['subscribers', { page, search: subscriberSearch, status: subscriberStatus }],
    queryFn: () =>
      marketingApi
        .getSubscribers({
          page,
          limit: 20,
          search: subscriberSearch || undefined,
          status: subscriberStatus || undefined,
        })
        .then((r) => r.data),
  });

  const { data: listsData, isLoading: listsLoading } = useQuery({
    queryKey: ['marketing-lists'],
    queryFn: () => marketingApi.getLists().then((r) => r.data.data),
  });

  const { data: couponsData, isLoading: coupLoading } = useQuery({
    queryKey: ['coupons', { page }],
    queryFn: () => marketingApi.getCoupons({ page, limit: 20 }).then((r) => r.data),
  });

  // ── Mutations ──────────────────────────────────────────────
  const createCampaignMutation = useMutation({
    mutationFn: () => marketingApi.createCampaign(campaignForm),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campaigns'] });
      qc.invalidateQueries({ queryKey: ['marketing-stats'] });
      setShowCreateCampaign(false);
      resetCampaignForm();
      toast.success('Campaign created successfully');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const updateCampaignMutation = useMutation({
    mutationFn: (id: string) => marketingApi.updateCampaign(id, campaignForm),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campaigns'] });
      setEditingCampaign(null);
      resetCampaignForm();
      toast.success('Campaign updated');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const duplicateCampaignMutation = useMutation({
    mutationFn: (id: string) => marketingApi.duplicateCampaign(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campaigns'] });
      qc.invalidateQueries({ queryKey: ['marketing-stats'] });
      toast.success('Campaign duplicated as draft');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const sendCampaignMutation = useMutation({
    mutationFn: (id: string) => marketingApi.sendCampaign(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campaigns'] });
      qc.invalidateQueries({ queryKey: ['marketing-stats'] });
      toast.success('Campaign dispatched successfully!');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const deleteCampaignMutation = useMutation({
    mutationFn: (id: string) => marketingApi.deleteCampaign(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campaigns'] });
      qc.invalidateQueries({ queryKey: ['marketing-stats'] });
      setDeletingCampaign(null);
      toast.success('Campaign deleted');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const addSubscriberMutation = useMutation({
    mutationFn: () => marketingApi.subscribe(subscriberForm),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subscribers'] });
      qc.invalidateQueries({ queryKey: ['marketing-stats'] });
      setShowAddSubscriber(false);
      setSubscriberForm({ email: '', first_name: '', last_name: '', source: 'dashboard' });
      toast.success('Subscriber added');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const deleteSubscriberMutation = useMutation({
    mutationFn: (id: string) => marketingApi.deleteSubscriber(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subscribers'] });
      qc.invalidateQueries({ queryKey: ['marketing-stats'] });
      setDeletingSubscriber(null);
      toast.success('Subscriber removed');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const createListMutation = useMutation({
    mutationFn: () => marketingApi.createList(listForm),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['marketing-lists'] });
      qc.invalidateQueries({ queryKey: ['marketing-stats'] });
      setShowCreateList(false);
      setListForm({ name: '', description: '' });
      toast.success('List created');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const updateListMutation = useMutation({
    mutationFn: (id: string) => marketingApi.updateList(id, listForm),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['marketing-lists'] });
      setEditingList(null);
      toast.success('List updated');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const deleteListMutation = useMutation({
    mutationFn: (id: string) => marketingApi.deleteList(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['marketing-lists'] });
      qc.invalidateQueries({ queryKey: ['marketing-stats'] });
      setDeletingList(null);
      toast.success('List deleted');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const createCouponMutation = useMutation({
    mutationFn: () =>
      marketingApi.createCoupon({
        ...couponForm,
        discount_value: parseFloat(couponForm.discount_value) || 0,
        min_order_amount: parseFloat(couponForm.min_order_amount) || 0,
        max_uses: couponForm.usage_limit ? parseInt(couponForm.usage_limit) : null,
        expires_at: couponForm.expires_at || null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['coupons'] });
      qc.invalidateQueries({ queryKey: ['marketing-stats'] });
      setShowCreateCoupon(false);
      resetCouponForm();
      toast.success('Coupon created');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const deleteCouponMutation = useMutation({
    mutationFn: (id: string) => marketingApi.deleteCoupon(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['coupons'] });
      qc.invalidateQueries({ queryKey: ['marketing-stats'] });
      setDeletingCoupon(null);
      toast.success('Coupon deleted');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const resetCampaignForm = () => {
    setCampaignForm({
      name: '',
      subject: '',
      type: 'newsletter',
      from_name: 'Sysmaira Team',
      from_email: 'marketing@sysmaira.com',
      preview_text: '',
      html_content: '',
    });
  };

  const resetCouponForm = () => {
    setCouponForm({
      code: '',
      discount_type: 'percentage',
      discount_value: '',
      min_order_amount: '',
      usage_limit: '',
      expires_at: '',
    });
  };

  const handleEditCampaign = (c: any) => {
    setCampaignForm({
      name: c.name || '',
      subject: c.subject || '',
      type: c.type || 'newsletter',
      from_name: c.from_name || '',
      from_email: c.from_email || '',
      preview_text: c.preview_text || '',
      html_content: c.html_content || '',
    });
    setEditingCampaign(c);
  };

  const campaigns = campaignsData?.data || [];
  const subscribers = subscribersData?.data || [];
  const lists = listsData || [];
  const coupons = (couponsData?.data || []).filter((c: any) =>
    couponSearch ? c.code?.toLowerCase().includes(couponSearch.toLowerCase()) : true
  );

  const totalSubsCount = stats?.total_subscribers ?? subscribersData?.total ?? 0;
  const totalListsCount = stats?.email_lists ?? lists.length;
  const totalCampsCount = stats?.campaigns ?? campaignsData?.total ?? 0;
  const activeCouponsCount = stats?.active_coupons ?? coupons.filter((c: any) => c.is_active).length;

  return (
    <DashboardLayout title="Marketing" breadcrumbs={[{ label: 'Marketing' }]}>
      <div className="space-y-6">
        {/* ── Summary Cards ────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Subscribers"
            value={totalSubsCount}
            icon={<Users className="w-5 h-5" />}
            color="blue"
          />
          <StatCard
            title="Email Lists"
            value={totalListsCount}
            icon={<Mail className="w-5 h-5" />}
            color="green"
          />
          <StatCard
            title="Campaigns"
            value={totalCampsCount}
            icon={<Megaphone className="w-5 h-5" />}
            color="purple"
          />
          <StatCard
            title="Active Coupons"
            value={activeCouponsCount}
            icon={<Tag className="w-5 h-5" />}
            color="orange"
          />
        </div>

        {/* ── Tabs Navigation ──────────────────────────────────── */}
        <TabBar
          tabs={[
            { id: 'campaigns', label: 'Campaigns', count: totalCampsCount },
            { id: 'subscribers', label: 'Subscribers', count: totalSubsCount },
            { id: 'lists', label: 'Lists', count: totalListsCount },
            { id: 'coupons', label: 'Coupons', count: activeCouponsCount },
          ]}
          active={tab}
          onChange={(t) => {
            setTab(t);
            setPage(1);
          }}
        />

        {/* ═══════════════════════════════════════════════════════ */}
        {/* TAB 1: CAMPAIGNS                                       */}
        {/* ═══════════════════════════════════════════════════════ */}
        {tab === 'campaigns' && (
          <Card padding={false} className="shadow-sm">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between p-4 sm:p-5 border-b border-slate-100 gap-3">
              <div className="flex flex-wrap items-center gap-3 flex-1">
                <SearchInput
                  value={campaignSearch}
                  onChange={(v) => {
                    setCampaignSearch(v);
                    setPage(1);
                  }}
                  placeholder="Search campaigns..."
                  className="w-48 sm:w-64"
                />
                <Select
                  options={[
                    { value: '', label: 'All status' },
                    { value: 'draft', label: 'Draft' },
                    { value: 'scheduled', label: 'Scheduled' },
                    { value: 'sent', label: 'Sent' },
                  ]}
                  value={campaignStatus}
                  onChange={(e) => {
                    setCampaignStatus(e.target.value);
                    setPage(1);
                  }}
                  className="w-36 text-sm"
                />
                <Select
                  options={[{ value: '', label: 'All types' }, ...CAMPAIGN_TYPES]}
                  value={campaignType}
                  onChange={(e) => {
                    setCampaignType(e.target.value);
                    setPage(1);
                  }}
                  className="w-36 text-sm"
                />
                {(campaignSearch || campaignStatus || campaignType) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setCampaignSearch('');
                      setCampaignStatus('');
                      setCampaignType('');
                      setPage(1);
                    }}
                  >
                    Clear
                  </Button>
                )}
              </div>

              <Button
                size="sm"
                icon={<Plus className="w-4 h-4" />}
                onClick={() => {
                  resetCampaignForm();
                  setShowCreateCampaign(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
              >
                New Campaign
              </Button>
            </div>

            {/* Table */}
            <Table
              headers={[
                'CAMPAIGN NAME',
                'TYPE',
                'STATUS',
                'RECIPIENTS',
                'OPEN RATE',
                'CLICK RATE',
                'SENT AT',
                'ACTIONS',
              ]}
              loading={campLoading}
              empty={!campaigns.length}
              emptyMessage="No email campaigns found"
            >
              {campaigns.map((c: any) => (
                <Tr key={c.id}>
                  <Td className="min-w-[180px]">
                    <div className="max-w-xs">
                      <p className="font-semibold text-slate-900 leading-snug">{c.name}</p>
                      <p className="text-xs text-slate-500 truncate mt-0.5">{c.subject}</p>
                    </div>
                  </Td>
                  <Td className="whitespace-nowrap">
                    <Badge className="capitalize">{c.type || 'newsletter'}</Badge>
                  </Td>
                  <Td className="whitespace-nowrap">
                    <StatusBadge status={c.status} />
                  </Td>
                  <Td className="whitespace-nowrap">
                    <span className="font-medium text-slate-700">
                      {c.recipient_count?.toLocaleString() || 0}
                    </span>
                  </Td>
                  <Td className="whitespace-nowrap">
                    {c.open_count && c.recipient_count ? (
                      <span className="text-emerald-700 font-semibold text-xs">
                        {((c.open_count / c.recipient_count) * 100).toFixed(1)}%
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs">—</span>
                    )}
                  </Td>
                  <Td className="whitespace-nowrap">
                    {c.click_count && c.recipient_count ? (
                      <span className="text-blue-700 font-semibold text-xs">
                        {((c.click_count / c.recipient_count) * 100).toFixed(1)}%
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs">—</span>
                    )}
                  </Td>
                  <Td className="whitespace-nowrap">
                    <span className="text-slate-500 text-xs">
                      {c.sent_at ? timeAgo(c.sent_at) : '—'}
                    </span>
                  </Td>
                  <Td className="whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Eye className="w-3.5 h-3.5 text-slate-500" />}
                        onClick={() => setViewingCampaign(c)}
                        title="View details"
                      />
                      {c.status === 'draft' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Edit2 className="w-3.5 h-3.5 text-slate-500" />}
                          onClick={() => handleEditCampaign(c)}
                          title="Edit campaign"
                        />
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Copy className="w-3.5 h-3.5 text-slate-500" />}
                        onClick={() => duplicateCampaignMutation.mutate(c.id)}
                        title="Duplicate as draft"
                      />
                      {c.status === 'draft' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Send className="w-3.5 h-3.5 text-blue-600" />}
                          onClick={() => setSendingCampaign(c)}
                          title="Send campaign"
                        />
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Trash2 className="w-3.5 h-3.5 text-red-500" />}
                        onClick={() => setDeletingCampaign(c)}
                        title="Delete campaign"
                      />
                    </div>
                  </Td>
                </Tr>
              ))}
            </Table>

            <Pagination
              page={page}
              totalPages={Math.ceil((campaignsData?.total || 0) / 20)}
              onPageChange={setPage}
              total={campaignsData?.total}
              limit={20}
            />
          </Card>
        )}

        {/* ═══════════════════════════════════════════════════════ */}
        {/* TAB 2: SUBSCRIBERS                                     */}
        {/* ═══════════════════════════════════════════════════════ */}
        {tab === 'subscribers' && (
          <Card padding={false} className="shadow-sm">
            <div className="flex flex-wrap items-center justify-between p-4 sm:p-5 border-b border-slate-100 gap-3">
              <div className="flex items-center gap-3 flex-1">
                <SearchInput
                  value={subscriberSearch}
                  onChange={(v) => {
                    setSubscriberSearch(v);
                    setPage(1);
                  }}
                  placeholder="Search subscribers by name or email…"
                  className="w-64"
                />
                <Select
                  options={[
                    { value: '', label: 'All status' },
                    { value: 'active', label: 'Active' },
                    { value: 'unsubscribed', label: 'Unsubscribed' },
                  ]}
                  value={subscriberStatus}
                  onChange={(e) => {
                    setSubscriberStatus(e.target.value);
                    setPage(1);
                  }}
                  className="w-36 text-sm"
                />
              </div>

              <Button
                size="sm"
                icon={<Plus className="w-4 h-4" />}
                onClick={() => setShowAddSubscriber(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
              >
                Add Subscriber
              </Button>
            </div>

            <Table
              headers={['EMAIL', 'NAME', 'STATUS', 'SOURCE', 'SUBSCRIBED', 'ACTIONS']}
              loading={subLoading}
              empty={!subscribers.length}
              emptyMessage="No subscribers found"
            >
              {subscribers.map((s: any) => (
                <Tr key={s.id}>
                  <Td className="font-semibold text-slate-900">{s.email}</Td>
                  <Td>
                    {[s.first_name, s.last_name].filter(Boolean).join(' ') || (
                      <span className="text-slate-400">—</span>
                    )}
                  </Td>
                  <Td>
                    <StatusBadge status={s.status} />
                  </Td>
                  <Td>
                    <span className="capitalize text-slate-600 text-xs font-medium">
                      {s.source || 'website'}
                    </span>
                  </Td>
                  <Td>
                    <span className="text-slate-500 text-xs whitespace-nowrap">
                      {timeAgo(s.subscribed_at || s.created_at)}
                    </span>
                  </Td>
                  <Td>
                    <div className="flex items-center justify-end gap-1">
                      {s.status === 'active' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-amber-600 text-xs"
                          onClick={() =>
                            marketingApi.unsubscribe(s.email).then(() => {
                              qc.invalidateQueries({ queryKey: ['subscribers'] });
                              qc.invalidateQueries({ queryKey: ['marketing-stats'] });
                              toast.success('Subscriber marked unsubscribed');
                            })
                          }
                        >
                          Unsub
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Trash2 className="w-3.5 h-3.5 text-red-500" />}
                        onClick={() => setDeletingSubscriber(s)}
                      />
                    </div>
                  </Td>
                </Tr>
              ))}
            </Table>

            <Pagination
              page={page}
              totalPages={Math.ceil((subscribersData?.total || 0) / 20)}
              onPageChange={setPage}
              total={subscribersData?.total}
              limit={20}
            />
          </Card>
        )}

        {/* ═══════════════════════════════════════════════════════ */}
        {/* TAB 3: LISTS                                           */}
        {/* ═══════════════════════════════════════════════════════ */}
        {tab === 'lists' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-sm text-slate-600">
                Manage segmented recipient lists for targeted campaigns.
              </p>
              <Button
                size="sm"
                icon={<Plus className="w-4 h-4" />}
                onClick={() => {
                  setListForm({ name: '', description: '' });
                  setShowCreateList(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
              >
                New List
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {lists.map((l: any) => (
                <Card key={l.id} className="p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-semibold text-slate-900 text-base">{l.name}</h4>
                      <Badge variant={l.is_active ? 'success' : 'default'}>
                        {l.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {l.description || 'General mailing segment.'}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700">
                      {l.subscriber_count || 0} subscribers
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Edit2 className="w-3.5 h-3.5 text-slate-600" />}
                        onClick={() => {
                          setListForm({ name: l.name, description: l.description || '' });
                          setEditingList(l);
                        }}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Trash2 className="w-3.5 h-3.5 text-red-500" />}
                        onClick={() => setDeletingList(l)}
                      />
                    </div>
                  </div>
                </Card>
              ))}

              {!lists.length && !listsLoading && (
                <div className="col-span-full py-12">
                  <EmptyState
                    icon={<Mail className="w-8 h-8" />}
                    title="No mailing lists created"
                    description="Create a segmented list to send targeted updates."
                    action={
                      <Button size="sm" onClick={() => setShowCreateList(true)}>
                        Create List
                      </Button>
                    }
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════ */}
        {/* TAB 4: COUPONS                                         */}
        {/* ═══════════════════════════════════════════════════════ */}
        {tab === 'coupons' && (
          <Card padding={false} className="shadow-sm">
            <div className="flex flex-wrap items-center justify-between p-4 sm:p-5 border-b border-slate-100 gap-3">
              <SearchInput
                value={couponSearch}
                onChange={setCouponSearch}
                placeholder="Search coupons by code…"
                className="w-64"
              />
              <Button
                size="sm"
                icon={<Plus className="w-4 h-4" />}
                onClick={() => {
                  resetCouponForm();
                  setShowCreateCoupon(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
              >
                New Coupon
              </Button>
            </div>

            <Table
              headers={['CODE', 'TYPE', 'VALUE', 'USED', 'LIMIT', 'EXPIRES', 'STATUS', 'ACTIONS']}
              loading={coupLoading}
              empty={!coupons.length}
              emptyMessage="No discount coupons found"
            >
              {coupons.map((c: any) => (
                <Tr key={c.id}>
                  <Td>
                    <code className="bg-slate-100 px-2.5 py-1 rounded font-mono font-bold text-xs text-blue-700 border border-slate-200">
                      {c.code}
                    </code>
                  </Td>
                  <Td className="capitalize text-xs font-medium">
                    {c.discount_type?.replace(/_/g, ' ')}
                  </Td>
                  <Td className="font-semibold text-emerald-700 text-sm">
                    {c.discount_type === 'percentage' ? `${c.discount_value}%` : `$${c.discount_value}`}
                  </Td>
                  <Td>{c.used_count || 0}</Td>
                  <Td>{c.max_uses || c.usage_limit || '∞'}</Td>
                  <Td>
                    <span className="text-slate-500 text-xs whitespace-nowrap">
                      {c.expires_at || c.valid_until ? formatDate(c.expires_at || c.valid_until) : 'Never'}
                    </span>
                  </Td>
                  <Td>
                    <StatusBadge status={c.is_active ? 'active' : 'inactive'} />
                  </Td>
                  <Td>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs"
                        onClick={() =>
                          marketingApi
                            .updateCoupon(c.id, { is_active: !c.is_active })
                            .then(() => {
                              qc.invalidateQueries({ queryKey: ['coupons'] });
                              qc.invalidateQueries({ queryKey: ['marketing-stats'] });
                              toast.success(`Coupon ${c.is_active ? 'disabled' : 'enabled'}`);
                            })
                        }
                      >
                        {c.is_active ? 'Disable' : 'Enable'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Trash2 className="w-3.5 h-3.5 text-red-500" />}
                        onClick={() => setDeletingCoupon(c)}
                      />
                    </div>
                  </Td>
                </Tr>
              ))}
            </Table>
          </Card>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* MODALS                                                 */}
      {/* ═══════════════════════════════════════════════════════ */}

      {/* 1. Create Campaign Modal */}
      <Modal
        open={showCreateCampaign}
        onClose={() => setShowCreateCampaign(false)}
        title="Create Email Campaign"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowCreateCampaign(false)}>
              Cancel
            </Button>
            <Button
              loading={createCampaignMutation.isPending}
              disabled={!campaignForm.name.trim() || !campaignForm.subject.trim()}
              onClick={() => createCampaignMutation.mutate()}
            >
              Create Campaign
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Campaign Name *"
            value={campaignForm.name}
            onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
            placeholder="e.g. Q4 Platform Innovations Announcement"
          />
          <Input
            label="Subject Line *"
            value={campaignForm.subject}
            onChange={(e) => setCampaignForm({ ...campaignForm, subject: e.target.value })}
            placeholder="e.g. Discover our latest enterprise capabilities"
          />
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Campaign Type"
              options={CAMPAIGN_TYPES}
              value={campaignForm.type}
              onChange={(e) => setCampaignForm({ ...campaignForm, type: e.target.value })}
            />
            <Input
              label="Sender Name"
              value={campaignForm.from_name}
              onChange={(e) => setCampaignForm({ ...campaignForm, from_name: e.target.value })}
            />
          </div>
          <Input
            label="Preview Subheader"
            value={campaignForm.preview_text}
            onChange={(e) => setCampaignForm({ ...campaignForm, preview_text: e.target.value })}
            placeholder="Short snippet visible before opening email..."
          />
          <Textarea
            label="Email Content (HTML or Markdown supported)"
            value={campaignForm.html_content}
            onChange={(e) => setCampaignForm({ ...campaignForm, html_content: e.target.value })}
            rows={6}
            placeholder="Write your email body copy..."
          />
        </div>
      </Modal>

      {/* 2. Edit Campaign Modal */}
      <Modal
        open={!!editingCampaign}
        onClose={() => setEditingCampaign(null)}
        title="Edit Campaign"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setEditingCampaign(null)}>
              Cancel
            </Button>
            <Button
              loading={updateCampaignMutation.isPending}
              disabled={!campaignForm.name.trim() || !campaignForm.subject.trim()}
              onClick={() => updateCampaignMutation.mutate(editingCampaign.id)}
            >
              Save Changes
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Campaign Name *"
            value={campaignForm.name}
            onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
          />
          <Input
            label="Subject Line *"
            value={campaignForm.subject}
            onChange={(e) => setCampaignForm({ ...campaignForm, subject: e.target.value })}
          />
          <Textarea
            label="Email Body Content"
            value={campaignForm.html_content}
            onChange={(e) => setCampaignForm({ ...campaignForm, html_content: e.target.value })}
            rows={6}
          />
        </div>
      </Modal>

      {/* 3. View Campaign Details Modal */}
      <Modal
        open={!!viewingCampaign}
        onClose={() => setViewingCampaign(null)}
        title={viewingCampaign?.name || 'Campaign Overview'}
        size="lg"
        footer={
          <Button variant="outline" onClick={() => setViewingCampaign(null)}>
            Close
          </Button>
        }
      >
        {viewingCampaign && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <StatusBadge status={viewingCampaign.status} />
              <Badge className="capitalize">{viewingCampaign.type}</Badge>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-slate-500 block text-xs">Subject Line</span>
                <span className="font-semibold text-slate-900">{viewingCampaign.subject}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-xs">Sender</span>
                <span className="font-semibold text-slate-900">
                  {viewingCampaign.from_name} ({viewingCampaign.from_email})
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-xs">Recipients Dispatched</span>
                <span className="font-semibold text-slate-900">
                  {viewingCampaign.recipient_count || 0}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-xs">Sent At</span>
                <span className="font-semibold text-slate-900">
                  {viewingCampaign.sent_at ? formatDate(viewingCampaign.sent_at) : 'Not sent yet'}
                </span>
              </div>
            </div>
            {viewingCampaign.preview_text && (
              <div>
                <h5 className="text-xs font-semibold text-slate-500">Preview Text</h5>
                <p className="text-sm text-slate-700 bg-white p-3 rounded-lg border border-slate-200">
                  {viewingCampaign.preview_text}
                </p>
              </div>
            )}
            <div>
              <h5 className="text-xs font-semibold text-slate-500 mb-1">Message Content</h5>
              <div className="text-sm text-slate-800 bg-white p-4 rounded-lg border border-slate-200 max-h-64 overflow-y-auto whitespace-pre-wrap">
                {viewingCampaign.html_content || viewingCampaign.text_content || 'No content drafted.'}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* 4a. Send Campaign Confirmation */}
      <Modal
        open={!!sendingCampaign}
        onClose={() => setSendingCampaign(null)}
        title="Send Campaign Now"
        footer={
          <>
            <Button variant="outline" onClick={() => setSendingCampaign(null)}>
              Cancel
            </Button>
            <Button
              loading={sendCampaignMutation.isPending}
              onClick={() => {
                const id = sendingCampaign.id;
                setSendingCampaign(null);
                sendCampaignMutation.mutate(id);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Confirm & Dispatch
            </Button>
          </>
        }
      >
        <p className="text-slate-700 text-sm">
          Are you sure you want to dispatch campaign <strong>&quot;{sendingCampaign?.name}&quot;</strong> now?
          This will send emails to all subscribed recipients in the target list.
        </p>
      </Modal>

      {/* 4b. Delete Campaign Confirmation */}
      <Modal
        open={!!deletingCampaign}
        onClose={() => setDeletingCampaign(null)}
        title="Delete Campaign"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeletingCampaign(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={deleteCampaignMutation.isPending}
              onClick={() => deleteCampaignMutation.mutate(deletingCampaign.id)}
            >
              Delete Campaign
            </Button>
          </>
        }
      >
        <p className="text-slate-700 text-sm">
          Are you sure you want to delete campaign <strong>{deletingCampaign?.name}</strong>?
        </p>
      </Modal>

      {/* 5. Add Subscriber Modal */}
      <Modal
        open={showAddSubscriber}
        onClose={() => setShowAddSubscriber(false)}
        title="Add Subscriber"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowAddSubscriber(false)}>
              Cancel
            </Button>
            <Button
              loading={addSubscriberMutation.isPending}
              disabled={!subscriberForm.email.trim()}
              onClick={() => addSubscriberMutation.mutate()}
            >
              Add Subscriber
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Email Address *"
            type="email"
            value={subscriberForm.email}
            onChange={(e) => setSubscriberForm({ ...subscriberForm, email: e.target.value })}
            placeholder="user@example.com"
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First Name"
              value={subscriberForm.first_name}
              onChange={(e) => setSubscriberForm({ ...subscriberForm, first_name: e.target.value })}
            />
            <Input
              label="Last Name"
              value={subscriberForm.last_name}
              onChange={(e) => setSubscriberForm({ ...subscriberForm, last_name: e.target.value })}
            />
          </div>
        </div>
      </Modal>

      {/* 6. Delete Subscriber Confirmation */}
      <Modal
        open={!!deletingSubscriber}
        onClose={() => setDeletingSubscriber(null)}
        title="Remove Subscriber"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeletingSubscriber(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={deleteSubscriberMutation.isPending}
              onClick={() => deleteSubscriberMutation.mutate(deletingSubscriber.id)}
            >
              Remove
            </Button>
          </>
        }
      >
        <p className="text-slate-700 text-sm">
          Remove <strong>{deletingSubscriber?.email}</strong> from your subscriber list?
        </p>
      </Modal>

      {/* 7. Create/Edit List Modal */}
      <Modal
        open={showCreateList || !!editingList}
        onClose={() => {
          setShowCreateList(false);
          setEditingList(null);
        }}
        title={editingList ? 'Edit Mailing List' : 'New Mailing List'}
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateList(false);
                setEditingList(null);
              }}
            >
              Cancel
            </Button>
            <Button
              loading={createListMutation.isPending || updateListMutation.isPending}
              disabled={!listForm.name.trim()}
              onClick={() => {
                if (editingList) {
                  updateListMutation.mutate(editingList.id);
                } else {
                  createListMutation.mutate();
                }
              }}
            >
              {editingList ? 'Save Changes' : 'Create List'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="List Name *"
            value={listForm.name}
            onChange={(e) => setListForm({ ...listForm, name: e.target.value })}
            placeholder="e.g. Enterprise Partners"
          />
          <Textarea
            label="Description"
            value={listForm.description}
            onChange={(e) => setListForm({ ...listForm, description: e.target.value })}
            rows={3}
            placeholder="Purpose and segmentation criteria..."
          />
        </div>
      </Modal>

      {/* 8. Delete List Confirmation */}
      <Modal
        open={!!deletingList}
        onClose={() => setDeletingList(null)}
        title="Delete Mailing List"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeletingList(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={deleteListMutation.isPending}
              onClick={() => deleteListMutation.mutate(deletingList.id)}
            >
              Delete List
            </Button>
          </>
        }
      >
        <p className="text-slate-700 text-sm">
          Delete list <strong>{deletingList?.name}</strong>? Subscribers will remain intact.
        </p>
      </Modal>

      {/* 9. Create Coupon Modal */}
      <Modal
        open={showCreateCoupon}
        onClose={() => setShowCreateCoupon(false)}
        title="Create Discount Coupon"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowCreateCoupon(false)}>
              Cancel
            </Button>
            <Button
              loading={createCouponMutation.isPending}
              disabled={!couponForm.code.trim() || !couponForm.discount_value}
              onClick={() => createCouponMutation.mutate()}
            >
              Create Coupon
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Coupon Code *"
            value={couponForm.code}
            onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
            placeholder="e.g. SUMMER25"
          />
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Discount Type"
              options={[
                { value: 'percentage', label: 'Percentage (%)' },
                { value: 'fixed_amount', label: 'Fixed Amount ($)' },
              ]}
              value={couponForm.discount_type}
              onChange={(e) => setCouponForm({ ...couponForm, discount_type: e.target.value })}
            />
            <Input
              label="Discount Value *"
              type="number"
              value={couponForm.discount_value}
              onChange={(e) => setCouponForm({ ...couponForm, discount_value: e.target.value })}
              placeholder="e.g. 20"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Min Order Amount ($)"
              type="number"
              value={couponForm.min_order_amount}
              onChange={(e) => setCouponForm({ ...couponForm, min_order_amount: e.target.value })}
              placeholder="0"
            />
            <Input
              label="Usage Limit"
              type="number"
              value={couponForm.usage_limit}
              onChange={(e) => setCouponForm({ ...couponForm, usage_limit: e.target.value })}
              placeholder="Leave empty for unlimited"
            />
          </div>
          <Input
            label="Expires At"
            type="date"
            value={couponForm.expires_at}
            onChange={(e) => setCouponForm({ ...couponForm, expires_at: e.target.value })}
          />
        </div>
      </Modal>

      {/* 10. Delete Coupon Confirmation */}
      <Modal
        open={!!deletingCoupon}
        onClose={() => setDeletingCoupon(null)}
        title="Delete Coupon"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeletingCoupon(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={deleteCouponMutation.isPending}
              onClick={() => deleteCouponMutation.mutate(deletingCoupon.id)}
            >
              Delete Coupon
            </Button>
          </>
        }
      >
        <p className="text-slate-700 text-sm">
          Are you sure you want to delete coupon <strong>{deletingCoupon?.code}</strong>?
        </p>
      </Modal>
    </DashboardLayout>
  );
}
