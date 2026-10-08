'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/app/(dashboard)/_components/layout/DashboardLayout';
import { Card, Button, SearchInput, Table, Tr, Td, StatusBadge, Pagination, Modal, Input, Select, Textarea, Badge } from '@/components/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { portfolioApi } from '@/lib/api';
import { formatDate, extractApiError } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Plus, Eye, Edit2, Trash2, ExternalLink } from 'lucide-react';
import Link from 'next/link';

const CATEGORIES = [
  { value: 'web_development', label: 'Web Development' },
  { value: 'mobile_app', label: 'Mobile App' },
  { value: 'ui_ux_design', label: 'UI/UX Design' },
  { value: 'branding', label: 'Branding' },
  { value: 'ecommerce', label: 'E-Commerce' },
  { value: 'saas', label: 'SaaS' },
  { value: 'other', label: 'Other' },
];

export default function PortfolioPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [form, setForm] = useState({
    title: '', slug: '', category: 'web_development', client_name: '', description: '',
    short_description: '', project_url: '', github_url: '', status: 'draft',
    completion_date: '', is_featured: false,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['portfolio', { page, search, category: categoryFilter }],
    queryFn: () => portfolioApi.list({ page, limit: 20, search: search || undefined, category: categoryFilter || undefined }).then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: () => portfolioApi.create(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['portfolio'] }); setShowCreate(false); toast.success('Portfolio item created'); },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => portfolioApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['portfolio'] }); toast.success('Item deleted'); },
  });

  const updateFeaturedMutation = useMutation({
    mutationFn: ({ id, is_featured }: any) => portfolioApi.update(id, { is_featured }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['portfolio'] }),
  });

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));
  const items = data?.data || [];
  const totalPages = Math.ceil((data?.total || 0) / 20);

  return (
    <DashboardLayout title="Portfolio" breadcrumbs={[{ label: 'Portfolio' }]}>
      <div className="space-y-6">
        {/* Toolbar */}
        <div className="flex items-center gap-3 flex-wrap">
          <SearchInput value={search} onChange={setSearch} placeholder="Search portfolio…" className="flex-1 max-w-xs" />
          <Select
            options={[{ value: '', label: 'All categories' }, ...CATEGORIES]}
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="w-44"
          />
          <div className="ml-auto flex gap-2">
            <div className="flex rounded-lg border border-slate-200 overflow-hidden">
              {(['grid', 'list'] as const).map(m => (
                <button key={m} onClick={() => setViewMode(m)}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === m ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
                  {m === 'grid' ? '⊞' : '☰'}
                </button>
              ))}
            </div>
            <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setShowCreate(true)}>Add Project</Button>
          </div>
        </div>

        {/* Category pills */}
        <div className="flex flex-wrap gap-2">
          {[{ value: '', label: 'All' }, ...CATEGORIES].map(cat => (
            <button key={cat.value} onClick={() => setCategoryFilter(cat.value)}
              className={`px-3 py-1 text-sm rounded-full transition-all ${categoryFilter === cat.value ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-300'}`}>
              {cat.label}
            </button>
          ))}
        </div>

        {/* Grid view */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              Array(6).fill(0).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-200 overflow-hidden animate-pulse">
                  <div className="h-48 bg-slate-100" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-slate-100 rounded w-3/4" />
                    <div className="h-3 bg-slate-100 rounded w-1/2" />
                  </div>
                </div>
              ))
            ) : items.map((item: any) => (
              <div key={item.id} className="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all">
                {/* Thumbnail */}
                <div className="relative h-48 bg-gradient-to-br from-blue-50 to-indigo-100 overflow-hidden">
                  {item.thumbnail_url ? (
                    <img src={item.thumbnail_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl opacity-30">🖼️</div>
                  )}
                  {/* Overlay actions */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Link href={`/dashboard/portfolio/${item.id}`}>
                      <Button size="sm" variant="secondary" icon={<Eye className="w-4 h-4" />}>View</Button>
                    </Link>
                    {item.project_url && (
                      <a href={item.project_url} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="secondary" icon={<ExternalLink className="w-4 h-4" />} />
                      </a>
                    )}
                  </div>
                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex gap-1.5">
                    {item.is_featured && <Badge variant="info">Featured</Badge>}
                    <StatusBadge status={item.status} />
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 truncate">{item.title}</h3>
                      <p className="text-sm text-slate-500 mt-0.5">{item.client_name}</p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => updateFeaturedMutation.mutate({ id: item.id, is_featured: !item.is_featured })}
                        className={`text-lg ${item.is_featured ? 'text-yellow-400' : 'text-slate-300 hover:text-yellow-400'}`}>★</button>
                      <button onClick={() => confirm('Delete this portfolio item?') && deleteMutation.mutate(item.id)}
                        className="text-slate-300 hover:text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {item.short_description && (
                    <p className="text-xs text-slate-500 mt-2 line-clamp-2">{item.short_description}</p>
                  )}
                  {/* Technologies */}
                  {item.technologies?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {item.technologies.slice(0, 4).map((tech: string) => (
                        <span key={tech} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{tech}</span>
                      ))}
                      {item.technologies.length > 4 && <span className="text-xs text-slate-400">+{item.technologies.length - 4}</span>}
                    </div>
                  )}
                  {/* Metrics */}
                  {item.metrics?.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2">
                      {item.metrics.slice(0, 3).map((m: any) => (
                        <div key={m.id} className="text-center">
                          <p className="text-base font-bold text-blue-600">{m.value}</p>
                          <p className="text-xs text-slate-400">{m.label}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {!isLoading && !items.length && (
              <div className="col-span-full text-center py-16 text-slate-500">
                <p className="text-4xl mb-3">🖼️</p>
                <p className="font-medium">No portfolio items yet</p>
                <p className="text-sm mt-1">Add your first project to showcase your work</p>
              </div>
            )}
          </div>
        )}

        {/* List view */}
        {viewMode === 'list' && (
          <Card padding={false}>
            <Table
              headers={['Project', 'Category', 'Client', 'Status', 'Featured', 'Completed', '']}
              loading={isLoading}
              empty={!items.length}
            >
              {items.map((item: any) => (
                <Tr key={item.id}>
                  <Td>
                    <div className="flex items-center gap-3">
                      {item.thumbnail_url ? (
                        <img src={item.thumbnail_url} alt="" className="w-10 h-8 rounded object-cover" />
                      ) : (
                        <div className="w-10 h-8 bg-slate-100 rounded flex items-center justify-center text-lg">🖼️</div>
                      )}
                      <div>
                        <p className="font-medium text-slate-900">{item.title}</p>
                        {item.short_description && <p className="text-xs text-slate-500 truncate max-w-xs">{item.short_description}</p>}
                      </div>
                    </div>
                  </Td>
                  <Td><Badge className="capitalize">{item.category?.replace(/_/g, ' ')}</Badge></Td>
                  <Td>{item.client_name || '—'}</Td>
                  <Td><StatusBadge status={item.status} /></Td>
                  <Td>{item.is_featured ? '⭐' : '—'}</Td>
                  <Td>{item.completion_date ? formatDate(item.completion_date) : '—'}</Td>
                  <Td>
                    <div className="flex gap-1">
                      <Link href={`/dashboard/portfolio/${item.id}`}>
                        <Button variant="ghost" size="sm" icon={<Eye className="w-3.5 h-3.5" />} />
                      </Link>
                      <Button variant="ghost" size="sm" icon={<Trash2 className="w-3.5 h-3.5 text-red-500" />}
                        onClick={() => confirm('Delete?') && deleteMutation.mutate(item.id)} />
                    </div>
                  </Td>
                </Tr>
              ))}
            </Table>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} total={data?.total} limit={20} />
          </Card>
        )}
      </div>

      {/* Create Modal */}
      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Add Portfolio Item"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button loading={createMutation.isPending} onClick={() => createMutation.mutate()}>Create</Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Input label="Title *" value={form.title} onChange={e => set('title', e.target.value)} />
          </div>
          <Select label="Category" options={CATEGORIES} value={form.category} onChange={e => set('category', e.target.value)} />
          <Select label="Status" options={[{ value: 'draft', label: 'Draft' }, { value: 'published', label: 'Published' }]} value={form.status} onChange={e => set('status', e.target.value)} />
          <Input label="Client Name" value={form.client_name} onChange={e => set('client_name', e.target.value)} />
          <Input label="Completion Date" type="date" value={form.completion_date} onChange={e => set('completion_date', e.target.value)} />
          <Input label="Live URL" type="url" value={form.project_url} onChange={e => set('project_url', e.target.value)} placeholder="https://…" />
          <Input label="GitHub URL" type="url" value={form.github_url} onChange={e => set('github_url', e.target.value)} placeholder="https://github.com/…" />
          <div className="col-span-2">
            <Input label="Short Description" value={form.short_description} onChange={e => set('short_description', e.target.value)} />
          </div>
          <div className="col-span-2">
            <Textarea label="Full Description" value={form.description} onChange={e => set('description', e.target.value)} rows={4} />
          </div>
          <div className="col-span-2 flex items-center gap-2">
            <input type="checkbox" id="featured" checked={form.is_featured} onChange={e => set('is_featured', e.target.checked as any)} className="rounded" />
            <label htmlFor="featured" className="text-sm text-slate-700 cursor-pointer">Mark as featured</label>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
