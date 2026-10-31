'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/app/(dashboard)/_components/layout/DashboardLayout';
import { Card, Button, StatusBadge, Pagination, Modal, Input, Select, Textarea, TabBar, StatCard, Badge, ConfirmDialog } from '@/components/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { blogApi } from '@/lib/api';
import { formatDate, extractApiError } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Plus,
  Eye,
  Edit2,
  Trash2,
  FileText,
  Tag,
  BookOpen,
  Search,
  Star,
  CheckCircle,
  XCircle,
  ExternalLink,
  Layers,
  Heart,
} from 'lucide-react';

export default function BlogPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState('posts');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Modals
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [viewingPost, setViewingPost] = useState<any>(null);
  const [editingPost, setEditingPost] = useState<any>(null);

  const [showCreateCat, setShowCreateCat] = useState(false);
  const [editingCat, setEditingCat] = useState<any>(null);
  const [deletingCat, setDeletingCat] = useState<any>(null);
  const [deletingPost, setDeletingPost] = useState<any>(null);
  const [catForm, setCatForm] = useState({ name: '', slug: '', description: '', color: '#3b82f6' });

  const [showCreateTag, setShowCreateTag] = useState(false);
  const [tagForm, setTagForm] = useState({ name: '', slug: '' });

  // Post form states
  const [postForm, setPostForm] = useState({
    title: '',
    slug: '',
    category_id: '',
    excerpt: '',
    content: '',
    cover_image_url: '',
    status: 'draft',
    is_featured: false,
  });

  const [editPostForm, setEditPostForm] = useState<any>({});

  // Queries
  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: ['blog-posts', { page, search, status: statusFilter, category_id: categoryFilter }],
    queryFn: () =>
      blogApi
        .getPosts({
          page,
          limit: 15,
          search: search.trim() || undefined,
          status: statusFilter || undefined,
          category_id: categoryFilter || undefined,
        })
        .then((r) => r.data),
    enabled: tab === 'posts',
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['blog-categories'],
    queryFn: () => blogApi.getCategories().then((r) => r.data.data),
  });

  const { data: tagsData } = useQuery({
    queryKey: ['blog-tags'],
    queryFn: () => blogApi.getTags().then((r) => r.data.data),
  });

  const { data: resourcesData } = useQuery({
    queryKey: ['blog-resources', { page }],
    queryFn: () => blogApi.getResources({ page, limit: 15 }).then((r) => r.data),
    enabled: tab === 'resources',
  });

  // Post Mutations
  const createPostMutation = useMutation({
    mutationFn: () => blogApi.createPost(postForm),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['blog-posts'] });
      setShowCreatePost(false);
      setPostForm({
        title: '',
        slug: '',
        category_id: '',
        excerpt: '',
        content: '',
        cover_image_url: '',
        status: 'draft',
        is_featured: false,
      });
      toast.success('Blog post created');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const updatePostMutation = useMutation({
    mutationFn: () => blogApi.updatePost(editingPost.id, editPostForm),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['blog-posts'] });
      setEditingPost(null);
      toast.success('Post updated successfully');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const deletePostMutation = useMutation({
    mutationFn: (id: string) => blogApi.deletePost(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['blog-posts'] });
      if (viewingPost?.id) setViewingPost(null);
      toast.success('Post archived');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const togglePublishMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      blogApi.updatePost(id, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['blog-posts'] });
      toast.success('Post status updated');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  // Category Mutations
  const createCategoryMutation = useMutation({
    mutationFn: () => blogApi.createCategory(catForm),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['blog-categories'] });
      setShowCreateCat(false);
      setCatForm({ name: '', slug: '', description: '', color: '#3b82f6' });
      toast.success('Category created');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const updateCategoryMutation = useMutation({
    mutationFn: () => blogApi.updateCategory(editingCat.id, editingCat),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['blog-categories'] });
      setEditingCat(null);
      toast.success('Category updated');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => blogApi.deleteCategory(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['blog-categories'] });
      toast.success('Category deleted');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  // Tag Mutation
  const createTagMutation = useMutation({
    mutationFn: () => blogApi.createTag(tagForm),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['blog-tags'] });
      setShowCreateTag(false);
      setTagForm({ name: '', slug: '' });
      toast.success('Tag created');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const openEditPost = (p: any) => {
    setEditingPost(p);
    setEditPostForm({
      title: p.title || '',
      slug: p.slug || '',
      category_id: p.category_id || '',
      excerpt: p.excerpt || '',
      content: p.content || '',
      cover_image_url: p.cover_image_url || p.cover_image || '',
      status: p.status || 'draft',
      is_featured: !!p.is_featured,
    });
  };

  const posts = postsData?.data || [];
  const resources = resourcesData?.data || [];
  const publishedCount = posts.filter((p: any) => p.status === 'published').length;

  return (
    <DashboardLayout title="Blog" breadcrumbs={[{ label: 'Blog' }]}>
      <div className="space-y-6 min-w-0">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Posts"
            value={postsData?.total || 0}
            icon={<FileText className="w-5 h-5 text-blue-600" />}
            color="blue"
          />
          <StatCard
            title="Published"
            value={publishedCount}
            icon={<CheckCircle className="w-5 h-5 text-emerald-600" />}
            color="green"
          />
          <StatCard
            title="Categories"
            value={categoriesData?.length || 0}
            icon={<BookOpen className="w-5 h-5 text-purple-600" />}
            color="purple"
          />
          <StatCard
            title="Tags"
            value={tagsData?.length || 0}
            icon={<Tag className="w-5 h-5 text-amber-600" />}
            color="orange"
          />
        </div>

        {/* Tab Bar */}
        <TabBar
          tabs={[
            { id: 'posts', label: 'Posts', count: postsData?.total },
            { id: 'categories', label: 'Categories', count: categoriesData?.length },
            { id: 'tags', label: 'Tags', count: tagsData?.length },
            { id: 'resources', label: 'Resources', count: resourcesData?.total },
          ]}
          active={tab}
          onChange={(t) => {
            setTab(t);
            setPage(1);
          }}
        />

        {/* ─── POSTS TAB ─── */}
        {tab === 'posts' && (
          <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <div className="flex flex-wrap sm:flex-nowrap gap-2 items-center flex-1 max-w-2xl">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search posts..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700"
                >
                  <option value="">All Statuses</option>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
                <select
                  value={categoryFilter}
                  onChange={(e) => {
                    setCategoryFilter(e.target.value);
                    setPage(1);
                  }}
                  className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700"
                >
                  <option value="">All Categories</option>
                  {categoriesData?.map((cat: any) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <Button
                size="sm"
                icon={<Plus className="w-4 h-4" />}
                onClick={() => setShowCreatePost(true)}
                className="whitespace-nowrap flex-shrink-0"
              >
                New Post
              </Button>
            </div>

            {/* Posts Table */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Article</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Author</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Views</th>
                      <th className="px-4 py-3">Likes</th>
                      <th className="px-4 py-3">Published</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {posts.map((p: any) => {
                      const isPublished = p.status === 'published';
                      const cover = p.cover_image_url || p.cover_image;

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              {cover ? (
                                <img
                                  src={cover}
                                  alt=""
                                  className="w-12 h-9 rounded-lg object-cover flex-shrink-0 border border-slate-200"
                                />
                              ) : (
                                <div className="w-12 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 text-xs flex-shrink-0">
                                  <FileText className="w-4 h-4 text-slate-400" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <p className="font-semibold text-slate-900 truncate max-w-xs">{p.title}</p>
                                  {p.is_featured && (
                                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 flex-shrink-0" />
                                  )}
                                </div>
                                {p.excerpt && (
                                  <p className="text-xs text-slate-400 truncate max-w-xs mt-0.5">{p.excerpt}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs whitespace-nowrap">
                            <Badge className="font-normal">{p.category_name || 'Uncategorized'}</Badge>
                          </td>
                          <td className="px-4 py-3 text-xs font-medium text-slate-700 whitespace-nowrap">
                            {p.author_name || 'Sysmaira Team'}
                          </td>
                          <td className="px-4 py-3 text-xs whitespace-nowrap">
                            <StatusBadge status={p.status} />
                          </td>
                          <td className="px-4 py-3 text-xs whitespace-nowrap">{p.view_count?.toLocaleString() || 0}</td>
                          <td className="px-4 py-3 text-xs whitespace-nowrap">
                            <span className="flex items-center gap-1 text-slate-600">
                              <Heart className="w-3 h-3 text-rose-500" />
                              {p.like_count || 0}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                            {p.published_at ? formatDate(p.published_at) : '—'}
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                icon={<Eye className="w-3.5 h-3.5 text-slate-600" />}
                                onClick={() => setViewingPost(p)}
                                title="View preview"
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                icon={<Edit2 className="w-3.5 h-3.5 text-slate-600" />}
                                onClick={() => openEditPost(p)}
                                title="Edit post"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  togglePublishMutation.mutate({
                                    id: p.id,
                                    status: isPublished ? 'draft' : 'published',
                                  })
                                }
                                className={`p-1.5 rounded-lg border text-xs transition-colors ${
                                  isPublished
                                    ? 'border-slate-200 text-slate-500 hover:bg-slate-50'
                                    : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                                }`}
                                title={isPublished ? 'Unpublish to draft' : 'Publish post'}
                              >
                                {isPublished ? (
                                  <XCircle className="w-3.5 h-3.5 text-slate-400" />
                                ) : (
                                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                                )}
                              </button>
                              <Button
                                variant="ghost"
                                size="sm"
                                icon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
                                onClick={() => setDeletingPost(p)}
                                title="Archive post"
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {!posts.length && !postsLoading && (
                      <tr>
                        <td colSpan={8} className="text-center py-12 text-slate-400 text-xs">
                          No blog posts found matching criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="p-4 border-t border-slate-100">
                <Pagination
                  page={page}
                  totalPages={Math.ceil((postsData?.total || 0) / 15)}
                  onPageChange={setPage}
                  total={postsData?.total}
                  limit={15}
                />
              </div>
            </div>
          </div>
        )}

        {/* ─── CATEGORIES TAB ─── */}
        {tab === 'categories' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-slate-500">Organize articles and topics across the blog.</p>
              <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setShowCreateCat(true)}>
                New Category
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {categoriesData?.map((cat: any) => (
                <Card key={cat.id} className="!p-4 hover:shadow-md transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: cat.color || '#3b82f6' }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 truncate">{cat.name}</p>
                        <p className="text-xs text-slate-400">{cat.post_count || 0} articles published</p>
                      </div>
                    </div>
                    {cat.description && (
                      <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">{cat.description}</p>
                    )}
                  </div>
                  <div className="flex items-center justify-end gap-1 mt-4 pt-3 border-t border-slate-100">
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Edit2 className="w-3.5 h-3.5 text-slate-600" />}
                      onClick={() => setEditingCat({ ...cat })}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
                      onClick={() => setDeletingCat(cat)}
                      title="Delete category"
                    />
                  </div>
                </Card>
              ))}
              {!categoriesData?.length && (
                <p className="col-span-full text-center text-slate-400 py-12">No categories defined yet.</p>
              )}
            </div>
          </div>
        )}

        {/* ─── TAGS TAB ─── */}
        {tab === 'tags' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-slate-500">Tags allow cross-linking articles by topics, tools, and ideas.</p>
              <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setShowCreateTag(true)}>
                New Tag
              </Button>
            </div>
            <Card>
              <div className="flex flex-wrap gap-2.5">
                {tagsData?.map((tag: any) => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-medium text-slate-700 transition-colors"
                  >
                    <Tag className="w-3 h-3 text-slate-400" />
                    {tag.name}
                    <span className="text-[10px] text-slate-500 bg-white px-1.5 py-0.5 rounded-full border border-slate-200">
                      {tag.usage_count || 0}
                    </span>
                  </span>
                ))}
                {!tagsData?.length && (
                  <p className="text-xs text-slate-400 py-4">No tags created yet.</p>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* ─── RESOURCES TAB ─── */}
        {tab === 'resources' && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900 text-sm">Downloadable Whitepapers & Guides</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Title</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Downloads</th>
                    <th className="px-4 py-3">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {resources.map((r: any) => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">{r.title}</td>
                      <td className="px-4 py-3">
                        <Badge className="capitalize">{r.type || 'PDF'}</Badge>
                      </td>
                      <td className="px-4 py-3 text-xs">{r.download_count || 0}</td>
                      <td className="px-4 py-3 text-xs text-slate-400">{formatDate(r.created_at)}</td>
                    </tr>
                  ))}
                  {!resources.length && (
                    <tr>
                      <td colSpan={4} className="text-center py-12 text-slate-400 text-xs">
                        No downloadable resources published yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ─── CREATE POST MODAL ─── */}
      <Modal
        open={showCreatePost}
        onClose={() => setShowCreatePost(false)}
        title="Create New Blog Article"
        size="xl"
        footer={
          <div className="flex justify-between w-full items-center">
            <Button variant="outline" onClick={() => setShowCreatePost(false)}>
              Cancel
            </Button>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setPostForm({ ...postForm, status: 'draft' });
                  createPostMutation.mutate();
                }}
                loading={createPostMutation.isPending && postForm.status === 'draft'}
              >
                Save as Draft
              </Button>
              <Button
                onClick={() => {
                  setPostForm({ ...postForm, status: 'published' });
                  createPostMutation.mutate();
                }}
                loading={createPostMutation.isPending && postForm.status === 'published'}
              >
                Publish Article
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Input
                label="Article Title *"
                value={postForm.title}
                onChange={(e) => setPostForm({ ...postForm, title: e.target.value })}
                placeholder="e.g. Architecting Scalable Cloud Microservices in 2026"
              />
            </div>
            <div>
              <Select
                label="Category"
                options={categoriesData?.map((c: any) => ({ value: c.id, label: c.name })) || []}
                value={postForm.category_id}
                onChange={(e) => setPostForm({ ...postForm, category_id: e.target.value })}
                placeholder="Select category"
              />
            </div>
            <div>
              <Input
                label="Cover Image URL"
                value={postForm.cover_image_url}
                onChange={(e) => setPostForm({ ...postForm, cover_image_url: e.target.value })}
                placeholder="https://images.unsplash.com/..."
              />
            </div>
            <div className="col-span-2">
              <Input
                label="Excerpt / Summary"
                value={postForm.excerpt}
                onChange={(e) => setPostForm({ ...postForm, excerpt: e.target.value })}
                placeholder="Short summary for social previews and search listings"
              />
            </div>
            <div className="col-span-2">
              <Textarea
                label="Article Content (Markdown supported) *"
                value={postForm.content}
                onChange={(e) => setPostForm({ ...postForm, content: e.target.value })}
                rows={10}
                placeholder="Write your article body here in Markdown format..."
              />
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <input
                type="checkbox"
                id="post-feat"
                checked={postForm.is_featured}
                onChange={(e) => setPostForm({ ...postForm, is_featured: e.target.checked })}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
              <label htmlFor="post-feat" className="text-sm font-medium text-slate-700 cursor-pointer">
                Feature on blog homepage
              </label>
            </div>
          </div>
        </div>
      </Modal>

      {/* ─── EDIT POST MODAL ─── */}
      {editingPost && (
        <Modal
          open={!!editingPost}
          onClose={() => setEditingPost(null)}
          title={`Edit Article: ${editingPost.title}`}
          size="xl"
          footer={
            <>
              <Button variant="outline" onClick={() => setEditingPost(null)}>
                Cancel
              </Button>
              <Button loading={updatePostMutation.isPending} onClick={() => updatePostMutation.mutate()}>
                Save Changes
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Input
                  label="Title *"
                  value={editPostForm.title || ''}
                  onChange={(e) => setEditPostForm({ ...editPostForm, title: e.target.value })}
                />
              </div>
              <div>
                <Select
                  label="Category"
                  options={categoriesData?.map((c: any) => ({ value: c.id, label: c.name })) || []}
                  value={editPostForm.category_id || ''}
                  onChange={(e) => setEditPostForm({ ...editPostForm, category_id: e.target.value })}
                />
              </div>
              <div>
                <Select
                  label="Status"
                  options={[
                    { value: 'draft', label: 'Draft' },
                    { value: 'published', label: 'Published' },
                    { value: 'archived', label: 'Archived' },
                  ]}
                  value={editPostForm.status || 'draft'}
                  onChange={(e) => setEditPostForm({ ...editPostForm, status: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <Input
                  label="Cover Image URL"
                  value={editPostForm.cover_image_url || ''}
                  onChange={(e) => setEditPostForm({ ...editPostForm, cover_image_url: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <Input
                  label="Excerpt"
                  value={editPostForm.excerpt || ''}
                  onChange={(e) => setEditPostForm({ ...editPostForm, excerpt: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <Textarea
                  label="Article Content (Markdown)"
                  value={editPostForm.content || ''}
                  onChange={(e) => setEditPostForm({ ...editPostForm, content: e.target.value })}
                  rows={10}
                />
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit-feat"
                  checked={editPostForm.is_featured}
                  onChange={(e) => setEditPostForm({ ...editPostForm, is_featured: e.target.checked })}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <label htmlFor="edit-feat" className="text-sm font-medium text-slate-700 cursor-pointer">
                  Featured Article
                </label>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* ─── VIEW POST PREVIEW MODAL ─── */}
      {viewingPost && (
        <Modal
          open={!!viewingPost}
          onClose={() => setViewingPost(null)}
          title={viewingPost.title}
          size="lg"
          footer={
            <div className="flex justify-between w-full items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const p = viewingPost;
                  setViewingPost(null);
                  openEditPost(p);
                }}
              >
                Edit Post
              </Button>
              <Button onClick={() => setViewingPost(null)}>Close</Button>
            </div>
          }
        >
          <div className="space-y-4">
            {(viewingPost.cover_image_url || viewingPost.cover_image) && (
              <div className="h-48 w-full rounded-xl overflow-hidden bg-slate-100">
                <img
                  src={viewingPost.cover_image_url || viewingPost.cover_image}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <Badge>{viewingPost.category_name || 'Blog'}</Badge>
                <span>By {viewingPost.author_name || 'Sysmaira Team'}</span>
              </div>
              <div className="flex items-center gap-3">
                <span>{viewingPost.view_count || 0} views</span>
                <span>{viewingPost.like_count || 0} likes</span>
                <StatusBadge status={viewingPost.status} />
              </div>
            </div>
            {viewingPost.excerpt && (
              <p className="text-sm font-medium text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200">
                {viewingPost.excerpt}
              </p>
            )}
            <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto p-2 bg-slate-50/50 rounded-lg">
              {viewingPost.content || 'No content provided.'}
            </div>
          </div>
        </Modal>
      )}

      {/* ─── CREATE CATEGORY MODAL ─── */}
      <Modal
        open={showCreateCat}
        onClose={() => setShowCreateCat(false)}
        title="New Blog Category"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowCreateCat(false)}>
              Cancel
            </Button>
            <Button loading={createCategoryMutation.isPending} onClick={() => createCategoryMutation.mutate()}>
              Create
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Category Name *"
            value={catForm.name}
            onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
            placeholder="e.g. Engineering & Architecture"
          />
          <Input
            label="Slug (optional)"
            value={catForm.slug}
            onChange={(e) => setCatForm({ ...catForm, slug: e.target.value })}
            placeholder="engineering-architecture"
          />
          <Input
            label="Color (Hex)"
            value={catForm.color}
            onChange={(e) => setCatForm({ ...catForm, color: e.target.value })}
            placeholder="#3b82f6"
          />
          <Textarea
            label="Description"
            value={catForm.description}
            onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
            rows={3}
          />
        </div>
      </Modal>

      {/* ─── EDIT CATEGORY MODAL ─── */}
      {editingCat && (
        <Modal
          open={!!editingCat}
          onClose={() => setEditingCat(null)}
          title={`Edit Category: ${editingCat.name}`}
          footer={
            <>
              <Button variant="outline" onClick={() => setEditingCat(null)}>
                Cancel
              </Button>
              <Button loading={updateCategoryMutation.isPending} onClick={() => updateCategoryMutation.mutate()}>
                Save
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <Input
              label="Name *"
              value={editingCat.name || ''}
              onChange={(e) => setEditingCat({ ...editingCat, name: e.target.value })}
            />
            <Input
              label="Color (Hex)"
              value={editingCat.color || ''}
              onChange={(e) => setEditingCat({ ...editingCat, color: e.target.value })}
            />
            <Textarea
              label="Description"
              value={editingCat.description || ''}
              onChange={(e) => setEditingCat({ ...editingCat, description: e.target.value })}
              rows={3}
            />
          </div>
        </Modal>
      )}

      {/* ─── CREATE TAG MODAL ─── */}
      <Modal
        open={showCreateTag}
        onClose={() => setShowCreateTag(false)}
        title="New Blog Tag"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowCreateTag(false)}>
              Cancel
            </Button>
            <Button loading={createTagMutation.isPending} onClick={() => createTagMutation.mutate()}>
              Create Tag
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Tag Name *"
            value={tagForm.name}
            onChange={(e) => setTagForm({ ...tagForm, name: e.target.value })}
            placeholder="e.g. Next.js 16"
          />
          <Input
            label="Slug (optional)"
            value={tagForm.slug}
            onChange={(e) => setTagForm({ ...tagForm, slug: e.target.value })}
            placeholder="nextjs-16"
          />
        </div>
      </Modal>

      {/* Confirmation Dialogs */}
      <ConfirmDialog
        open={!!deletingPost}
        onClose={() => setDeletingPost(null)}
        onConfirm={() => {
          const id = deletingPost.id;
          setDeletingPost(null);
          deletePostMutation.mutate(id);
        }}
        title="Archive Blog Post"
        description={
          <>
            Are you sure you want to archive article <strong>&quot;{deletingPost?.title}&quot;</strong>? It will be removed from the public blog.
          </>
        }
        confirmText="Archive Post"
        loading={deletePostMutation.isPending}
      />

      <ConfirmDialog
        open={!!deletingCat}
        onClose={() => setDeletingCat(null)}
        onConfirm={() => {
          const id = deletingCat.id;
          setDeletingCat(null);
          deleteCategoryMutation.mutate(id);
        }}
        title="Delete Category"
        description={
          <>
            Delete category <strong>&quot;{deletingCat?.name}&quot;</strong>? Existing posts in this category will become uncategorized.
          </>
        }
        loading={deleteCategoryMutation.isPending}
      />
    </DashboardLayout>
  );
}
