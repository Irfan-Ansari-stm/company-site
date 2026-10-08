'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/app/(dashboard)/_components/layout/DashboardLayout';
import { Card, Button, SearchInput, Table, Tr, Td, StatusBadge, Pagination, Modal, Input, Select, Textarea, TabBar, Badge } from '@/components/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cmsApi } from '@/lib/api';
import { formatDate, timeAgo, extractApiError } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Plus, Eye, Edit2, Trash2, Globe, Menu, MessageSquare, Star, Zap, FileText } from 'lucide-react';
import Link from 'next/link';

export default function CMSPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState('pages');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [createType, setCreateType] = useState<'page' | 'menu' | 'testimonial' | 'form' | 'redirect'>('page');
  const [form, setForm] = useState<any>({ title: '', slug: '', status: 'draft', template: 'default' });

  const { data: pagesData, isLoading: pagesLoading } = useQuery({
    queryKey: ['cms-pages', { page, search }],
    queryFn: () => cmsApi.getPages({ page, limit: 20, search: search || undefined }).then(r => r.data),
    enabled: tab === 'pages',
  });

  const { data: menusData } = useQuery({
    queryKey: ['cms-menus'],
    queryFn: () => cmsApi.getMenus().then(r => r.data.data),
    enabled: tab === 'menus',
  });

  const { data: testimonialsData } = useQuery({
    queryKey: ['cms-testimonials', { page }],
    queryFn: () => cmsApi.getTestimonials({ page, limit: 20 }).then(r => r.data),
    enabled: tab === 'testimonials',
  });

  const { data: formsData } = useQuery({
    queryKey: ['cms-forms'],
    queryFn: () => cmsApi.getForms().then(r => r.data.data),
    enabled: tab === 'forms',
  });

  const { data: redirectsData } = useQuery({
    queryKey: ['cms-redirects'],
    queryFn: () => cmsApi.getRedirects({ page: 1, limit: 50 }).then(r => r.data.data),
    enabled: tab === 'redirects',
  });

  const { data: popupsData } = useQuery({
    queryKey: ['cms-popups'],
    queryFn: () => cmsApi.getPopups().then(r => r.data.data),
    enabled: tab === 'popups',
  });

  const createPageMutation = useMutation({
    mutationFn: () => cmsApi.createPage(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cms-pages'] }); setShowCreate(false); toast.success('Page created'); },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const deletePageMutation = useMutation({
    mutationFn: (id: string) => cmsApi.deletePage(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cms-pages'] }); toast.success('Page deleted'); },
  });

  const createTestimonialMutation = useMutation({
    mutationFn: () => cmsApi.createTestimonial(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cms-testimonials'] }); setShowCreate(false); toast.success('Testimonial created'); },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const createMenuMutation = useMutation({
    mutationFn: () => cmsApi.createMenu(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cms-menus'] }); setShowCreate(false); toast.success('Menu created'); },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const createRedirectMutation = useMutation({
    mutationFn: () => cmsApi.createRedirect(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cms-redirects'] }); setShowCreate(false); toast.success('Redirect created'); },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const set = (k: string, v: string) => setForm((f: any) => ({ ...f, [k]: v }));

  const openCreate = (type: typeof createType) => {
    setCreateType(type);
    setForm({});
    setShowCreate(true);
  };

  const pages = pagesData?.data || [];
  const testimonials = testimonialsData?.data || [];

  const getCreateMutation = () => {
    switch (createType) {
      case 'page': return createPageMutation;
      case 'testimonial': return createTestimonialMutation;
      case 'menu': return createMenuMutation;
      case 'redirect': return createRedirectMutation;
      default: return createPageMutation;
    }
  };

  const TEMPLATES = [
    { value: 'default', label: 'Default' },
    { value: 'landing', label: 'Landing Page' },
    { value: 'full_width', label: 'Full Width' },
    { value: 'sidebar', label: 'With Sidebar' },
    { value: 'blank', label: 'Blank' },
  ];

  const MENU_LOCATIONS = [
    { value: 'header', label: 'Header' },
    { value: 'footer', label: 'Footer' },
    { value: 'sidebar', label: 'Sidebar' },
  ];

  return (
    <DashboardLayout title="CMS" breadcrumbs={[{ label: 'CMS' }]}>
      <div className="space-y-6">
        <TabBar
          tabs={[
            { id: 'pages', label: 'Pages', count: pagesData?.total },
            { id: 'menus', label: 'Menus', count: menusData?.length },
            { id: 'testimonials', label: 'Testimonials', count: testimonialsData?.total },
            { id: 'forms', label: 'Forms', count: formsData?.length },
            { id: 'popups', label: 'Popups', count: popupsData?.length },
            { id: 'redirects', label: 'Redirects', count: redirectsData?.length },
          ]}
          active={tab}
          onChange={setTab}
        />

        {/* ── PAGES ── */}
        {tab === 'pages' && (
          <Card padding={false}>
            <div className="flex items-center gap-3 p-4 border-b border-slate-100">
              <SearchInput value={search} onChange={setSearch} placeholder="Search pages…" className="flex-1 max-w-xs" />
              <div className="ml-auto">
                <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => openCreate('page')}>New Page</Button>
              </div>
            </div>
            <Table
              headers={['Title', 'Slug', 'Template', 'Status', 'Updated', '']}
              loading={pagesLoading}
              empty={!pages.length}
              emptyMessage="No pages yet"
            >
              {pages.map((p: any) => (
                <Tr key={p.id}>
                  <Td>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-400" />
                      <p className="font-medium text-slate-900">{p.title}</p>
                    </div>
                  </Td>
                  <Td><code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">/{p.slug}</code></Td>
                  <Td className="capitalize">{p.template}</Td>
                  <Td><StatusBadge status={p.status} /></Td>
                  <Td>{timeAgo(p.updated_at)}</Td>
                  <Td>
                    <div className="flex gap-1">
                      <Link href={`/dashboard/cms/pages/${p.id}`}>
                        <Button variant="ghost" size="sm" icon={<Edit2 className="w-3.5 h-3.5" />} />
                      </Link>
                      <Button variant="ghost" size="sm" icon={<Trash2 className="w-3.5 h-3.5 text-red-500" />}
                        onClick={() => confirm('Delete this page?') && deletePageMutation.mutate(p.id)} />
                    </div>
                  </Td>
                </Tr>
              ))}
            </Table>
            <Pagination page={page} totalPages={Math.ceil((pagesData?.total || 0) / 20)} onPageChange={setPage} total={pagesData?.total} limit={20} />
          </Card>
        )}

        {/* ── MENUS ── */}
        {tab === 'menus' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => openCreate('menu')}>New Menu</Button>
            </div>
            {menusData?.map((menu: any) => (
              <Card key={menu.id} className="!p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Menu className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="font-semibold text-slate-900">{menu.name}</p>
                      <p className="text-xs text-slate-500 capitalize">{menu.location} · {menu.items?.length || 0} items</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/dashboard/cms/menus/${menu.id}`}>
                      <Button variant="outline" size="sm">Edit</Button>
                    </Link>
                  </div>
                </div>
                {/* Items preview */}
                {menu.items?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {menu.items.map((item: any) => (
                      <span key={item.id} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">{item.label}</span>
                    ))}
                  </div>
                )}
              </Card>
            ))}
            {!menusData?.length && <p className="text-center text-slate-500 py-8">No menus created</p>}
          </div>
        )}

        {/* ── TESTIMONIALS ── */}
        {tab === 'testimonials' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => openCreate('testimonial')}>Add Testimonial</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {testimonials.map((t: any) => (
                <Card key={t.id} className="!p-4">
                  <div className="flex items-start gap-3">
                    {t.avatar_url ? (
                      <img src={t.avatar_url} className="w-12 h-12 rounded-full object-cover" alt={t.client_name} />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white font-bold">
                        {t.client_name?.[0]}
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-slate-900">{t.client_name}</p>
                        {t.is_featured && <Badge variant="info">Featured</Badge>}
                      </div>
                      <p className="text-xs text-slate-500">{t.client_title} {t.company && `· ${t.company}`}</p>
                      <div className="flex mt-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`w-3.5 h-3.5 ${i < (t.rating || 5) ? 'text-yellow-400 fill-yellow-400' : 'text-slate-200'}`} />
                        ))}
                      </div>
                      <p className="text-sm text-slate-600 mt-2 line-clamp-3">"{t.content}"</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            {!testimonials.length && <p className="text-center text-slate-500 py-8">No testimonials yet</p>}
          </div>
        )}

        {/* ── FORMS ── */}
        {tab === 'forms' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {formsData?.map((f: any) => (
                <Card key={f.id} className="hover:shadow-md transition-all !p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-slate-900">{f.name}</p>
                      <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{f.slug}</code>
                    </div>
                    <StatusBadge status={f.status || 'active'} />
                  </div>
                  <p className="text-xs text-slate-500">{f.fields?.length || 0} fields · {f.submission_count || 0} submissions</p>
                  <Link href={`/dashboard/cms/forms/${f.id}`} className="block mt-3">
                    <Button variant="outline" size="sm" className="w-full">View Submissions</Button>
                  </Link>
                </Card>
              ))}
            </div>
            {!formsData?.length && <p className="text-center text-slate-500 py-8">No forms created</p>}
          </div>
        )}

        {/* ── POPUPS ── */}
        {tab === 'popups' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button size="sm" icon={<Plus className="w-4 h-4" />}>New Popup</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {popupsData?.map((p: any) => (
                <Card key={p.id} className="!p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-yellow-500" />
                        <p className="font-semibold text-slate-900">{p.name}</p>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 capitalize">{p.type} · {p.trigger_type?.replace(/_/g, ' ')}</p>
                    </div>
                    <StatusBadge status={p.is_active ? 'active' : 'inactive'} />
                  </div>
                </Card>
              ))}
              {!popupsData?.length && <p className="text-center text-slate-500 py-6">No popups configured</p>}
            </div>
          </div>
        )}

        {/* ── REDIRECTS ── */}
        {tab === 'redirects' && (
          <Card padding={false}>
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800">URL Redirects</h3>
              <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => openCreate('redirect')}>Add Redirect</Button>
            </div>
            <Table
              headers={['From', 'To', 'Type', 'Hits', '']}
              empty={!redirectsData?.length}
            >
              {redirectsData?.map((r: any) => (
                <Tr key={r.id}>
                  <Td><code className="text-xs">{r.source_path}</code></Td>
                  <Td><code className="text-xs text-blue-600">{r.destination_path}</code></Td>
                  <Td><Badge>{r.redirect_type}</Badge></Td>
                  <Td>{r.hit_count || 0}</Td>
                  <Td>
                    <Button variant="ghost" size="sm" icon={<Trash2 className="w-3.5 h-3.5 text-red-500" />}
                      onClick={() => cmsApi.deleteRedirect(r.id).then(() => { qc.invalidateQueries({ queryKey: ['cms-redirects'] }); toast.success('Deleted'); })} />
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
        title={createType === 'page' ? 'New Page' : createType === 'testimonial' ? 'Add Testimonial' : createType === 'menu' ? 'New Menu' : createType === 'redirect' ? 'Add Redirect' : 'New'}
        footer={
          <>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button loading={getCreateMutation().isPending} onClick={() => getCreateMutation().mutate()}>Create</Button>
          </>
        }
      >
        {createType === 'page' && (
          <div className="space-y-4">
            <Input label="Title *" value={form.title || ''} onChange={e => set('title', e.target.value)} />
            <Input label="Slug" value={form.slug || ''} onChange={e => set('slug', e.target.value)} placeholder="auto-generated if empty" />
            <Select label="Template" options={TEMPLATES} value={form.template || 'default'} onChange={e => set('template', e.target.value)} />
            <Select label="Status" options={[{ value: 'draft', label: 'Draft' }, { value: 'published', label: 'Published' }]} value={form.status || 'draft'} onChange={e => set('status', e.target.value)} />
            <Textarea label="Meta Description" value={form.meta_description || ''} onChange={e => set('meta_description', e.target.value)} rows={2} />
          </div>
        )}
        {createType === 'testimonial' && (
          <div className="space-y-4">
            <Input label="Client Name *" value={form.client_name || ''} onChange={e => set('client_name', e.target.value)} />
            <Input label="Title / Position" value={form.client_title || ''} onChange={e => set('client_title', e.target.value)} />
            <Input label="Company" value={form.company || ''} onChange={e => set('company', e.target.value)} />
            <Select label="Rating" options={[5, 4, 3, 2, 1].map(n => ({ value: String(n), label: '★'.repeat(n) + ' ' + n }))} value={String(form.rating || 5)} onChange={e => set('rating', e.target.value)} />
            <Textarea label="Testimonial *" value={form.content || ''} onChange={e => set('content', e.target.value)} rows={4} />
          </div>
        )}
        {createType === 'menu' && (
          <div className="space-y-4">
            <Input label="Menu Name *" value={form.name || ''} onChange={e => set('name', e.target.value)} />
            <Select label="Location" options={MENU_LOCATIONS} value={form.location || 'header'} onChange={e => set('location', e.target.value)} />
          </div>
        )}
        {createType === 'redirect' && (
          <div className="space-y-4">
            <Input label="From (source path)" value={form.source_path || ''} onChange={e => set('source_path', e.target.value)} placeholder="/old-url" />
            <Input label="To (destination)" value={form.destination_path || ''} onChange={e => set('destination_path', e.target.value)} placeholder="/new-url or https://..." />
            <Select label="Redirect Type" options={[{ value: '301', label: '301 Permanent' }, { value: '302', label: '302 Temporary' }]} value={form.redirect_type || '301'} onChange={e => set('redirect_type', e.target.value)} />
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
