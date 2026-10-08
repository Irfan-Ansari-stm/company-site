'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/app/(dashboard)/_components/layout/DashboardLayout';
import { Card, Button, SearchInput, Table, Tr, Td, StatusBadge, Pagination, Modal, Input, Select, Textarea, TabBar, StatCard, Badge } from '@/components/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { blogApi } from '@/lib/api';
import { formatDate, timeAgo, extractApiError } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Plus, Eye, Edit2, Trash2, FileText, Tag, BookOpen } from 'lucide-react';
import Link from 'next/link';

export default function BlogPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState('posts');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', excerpt: '', content: '', status: 'draft' });

  const { data, isLoading } = useQuery({
    queryKey: ['blog-posts', { page, search, status: statusFilter }],
    queryFn: () => blogApi.getPosts({ page, limit: 20, search: search || undefined, status: statusFilter || undefined }).then(r => r.data),
    enabled: tab === 'posts',
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['blog-categories'],
    queryFn: () => blogApi.getCategories().then(r => r.data.data),
  });

  const { data: tagsData } = useQuery({
    queryKey: ['blog-tags'],
    queryFn: () => blogApi.getTags().then(r => r.data.data),
    enabled: tab === 'tags',
  });

  const { data: resourcesData } = useQuery({
    queryKey: ['blog-resources', { page }],
    queryFn: () => blogApi.getResources({ page, limit: 20 }).then(r => r.data),
    enabled: tab === 'resources',
  });

  const createMutation = useMutation({
    mutationFn: () => blogApi.createPost(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['blog-posts'] }); setShowCreate(false); toast.success('Post created'); },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => blogApi.deletePost(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['blog-posts'] }); toast.success('Post deleted'); },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const posts = data?.data || [];
  const resources = resourcesData?.data || [];

  return (
    <DashboardLayout title="Blog" breadcrumbs={[{ label: 'Blog' }]}>
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <StatCard title="Total Posts" value={data?.total || 0} icon={<FileText className="w-5 h-5" />} color="blue" />
          <StatCard title="Categories" value={categoriesData?.length || 0} icon={<BookOpen className="w-5 h-5" />} color="green" />
          <StatCard title="Tags" value={tagsData?.length || 0} icon={<Tag className="w-5 h-5" />} color="purple" />
        </div>

        <TabBar
          tabs={[
            { id: 'posts', label: 'Posts', count: data?.total },
            { id: 'categories', label: 'Categories', count: categoriesData?.length },
            { id: 'tags', label: 'Tags', count: tagsData?.length },
            { id: 'resources', label: 'Resources', count: resourcesData?.total },
          ]}
          active={tab}
          onChange={setTab}
        />

        {tab === 'posts' && (
          <Card padding={false}>
            <div className="flex items-center gap-3 p-4 border-b border-slate-100">
              <SearchInput value={search} onChange={setSearch} placeholder="Search posts..." className="flex-1 max-w-xs" />
              <Select
                options={[{ value: '', label: 'All status' }, { value: 'draft', label: 'Draft' }, { value: 'published', label: 'Published' }, { value: 'archived', label: 'Archived' }]}
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="w-36"
              />
              <div className="ml-auto flex gap-2">
                <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setShowCreate(true)}>New Post</Button>
              </div>
            </div>
            <Table
              headers={['Title', 'Category', 'Author', 'Status', 'Views', 'Likes', 'Published', '']}
              loading={isLoading}
              empty={!posts.length}
            >
              {posts.map((p: any) => (
                <Tr key={p.id}>
                  <Td>
                    <div className="flex items-start gap-3">
                      {p.cover_image && <img src={p.cover_image} alt="" className="w-12 h-8 rounded object-cover flex-shrink-0" />}
                      <div>
                        <p className="font-medium text-slate-900 max-w-xs">{p.title}</p>
                        {p.is_featured && <Badge variant="info">Featured</Badge>}
                      </div>
                    </div>
                  </Td>
                  <Td>{p.category_name || '—'}</Td>
                  <Td>{p.author_name}</Td>
                  <Td><StatusBadge status={p.status} /></Td>
                  <Td>{p.view_count?.toLocaleString() || 0}</Td>
                  <Td>{p.like_count || 0}</Td>
                  <Td>{p.published_at ? formatDate(p.published_at) : '—'}</Td>
                  <Td>
                    <div className="flex items-center gap-1">
                      <Link href={`/dashboard/blog/posts/${p.id}`}>
                        <Button variant="ghost" size="sm" icon={<Edit2 className="w-3.5 h-3.5" />} />
                      </Link>
                      <Button variant="ghost" size="sm" icon={<Trash2 className="w-3.5 h-3.5 text-red-500" />}
                        onClick={() => confirm('Delete this post?') && deleteMutation.mutate(p.id)} />
                    </div>
                  </Td>
                </Tr>
              ))}
            </Table>
            <Pagination page={page} totalPages={Math.ceil((data?.total || 0) / 20)} onPageChange={setPage} total={data?.total} limit={20} />
          </Card>
        )}

        {tab === 'categories' && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {categoriesData?.map((cat: any) => (
              <Card key={cat.id} className="!p-4">
                <div className="flex items-center gap-3">
                  {cat.color && <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />}
                  <div>
                    <p className="font-medium text-slate-900">{cat.name}</p>
                    <p className="text-xs text-slate-500">{cat.post_count} posts</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {tab === 'tags' && (
          <Card>
            <div className="flex flex-wrap gap-2">
              {tagsData?.map((tag: any) => (
                <span key={tag.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-full text-sm text-slate-700 hover:bg-slate-200 cursor-pointer">
                  <Tag className="w-3 h-3" />
                  {tag.name}
                  <span className="text-xs text-slate-400">({tag.usage_count})</span>
                </span>
              ))}
            </div>
          </Card>
        )}

        {tab === 'resources' && (
          <Card padding={false}>
            <Table
              headers={['Title', 'Type', 'Downloads', 'Created']}
              empty={!resources.length}
            >
              {resources.map((r: any) => (
                <Tr key={r.id}>
                  <Td className="font-medium text-slate-900">{r.title}</Td>
                  <Td><Badge className="capitalize">{r.type}</Badge></Td>
                  <Td>{r.download_count || 0}</Td>
                  <Td>{formatDate(r.created_at)}</Td>
                </Tr>
              ))}
            </Table>
          </Card>
        )}
      </div>

      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="New Blog Post"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button variant="secondary" onClick={() => { set('status', 'draft'); createMutation.mutate(); }}>Save Draft</Button>
            <Button onClick={() => { set('status', 'published'); createMutation.mutate(); }} loading={createMutation.isPending}>Publish</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Title *" value={form.title} onChange={e => set('title', e.target.value)} />
          <Textarea label="Excerpt" value={form.excerpt} onChange={e => set('excerpt', e.target.value)} rows={2} />
          <Textarea label="Content *" value={form.content} onChange={e => set('content', e.target.value)} rows={8} placeholder="Write your blog content (Markdown supported)..." />
        </div>
      </Modal>
    </DashboardLayout>
  );
}
