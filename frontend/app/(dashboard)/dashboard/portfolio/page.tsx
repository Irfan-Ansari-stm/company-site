'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/app/(dashboard)/_components/layout/DashboardLayout';
import { Card, Button, StatusBadge, Pagination, Modal, Input, Select, Textarea, Badge, ConfirmDialog } from '@/components/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { portfolioApi, servicesApi } from '@/lib/api';
import { formatDate, extractApiError } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Plus,
  Eye,
  Edit2,
  Trash2,
  ExternalLink,
  Code,
  Search,
  Star,
  Globe,
  Calendar,
  Layers,
  FolderGit2,
  CheckCircle,
  XCircle,
} from 'lucide-react';

export default function PortfolioPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Modals
  const [showCreate, setShowCreate] = useState(false);
  const [viewingProject, setViewingProject] = useState<any>(null);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [deletingProject, setDeletingProject] = useState<any>(null);

  // Forms
  const [createForm, setCreateForm] = useState({
    title: '',
    slug: '',
    client_name: '',
    client_url: '',
    category_id: '',
    summary: '',
    challenge: '',
    solution: '',
    result: '',
    project_url: '',
    github_url: '',
    cover_image: '',
    budget_range: '',
    duration_weeks: '',
    is_published: true,
    is_featured: false,
    tech_stack: '',
  });

  const [editForm, setEditForm] = useState<any>({});

  // Metric creation inside View Modal
  const [newMetricName, setNewMetricName] = useState('');
  const [newMetricValue, setNewMetricValue] = useState('');
  const [newMetricPrefix, setNewMetricPrefix] = useState('');
  const [newMetricSuffix, setNewMetricSuffix] = useState('');

  // Categories for filter & form
  const { data: categoriesData } = useQuery({
    queryKey: ['service-categories'],
    queryFn: () => servicesApi.getCategories().then((r) => r.data.data),
  });

  // Project List Query
  const { data, isLoading } = useQuery({
    queryKey: ['portfolio', { page, search, category_id: categoryFilter }],
    queryFn: () =>
      portfolioApi
        .list({
          page,
          limit: 12,
          search: search.trim() || undefined,
          category_id: categoryFilter || undefined,
        })
        .then((r) => r.data),
  });

  // Viewing Project Detailed Query
  const { data: projectDetail, refetch: refetchDetail } = useQuery({
    queryKey: ['portfolio-detail', viewingProject?.id],
    queryFn: () => portfolioApi.get(viewingProject.id).then((r) => r.data.data),
    enabled: !!viewingProject?.id,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: () =>
      portfolioApi.create({
        ...createForm,
        duration_weeks: createForm.duration_weeks ? parseInt(createForm.duration_weeks, 10) : undefined,
        tech_stack: createForm.tech_stack
          ? createForm.tech_stack.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['portfolio'] });
      setShowCreate(false);
      setCreateForm({
        title: '',
        slug: '',
        client_name: '',
        client_url: '',
        category_id: '',
        summary: '',
        challenge: '',
        solution: '',
        result: '',
        project_url: '',
        github_url: '',
        cover_image: '',
        budget_range: '',
        duration_weeks: '',
        is_published: true,
        is_featured: false,
        tech_stack: '',
      });
      toast.success('Project created successfully');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      portfolioApi.update(editingProject.id, {
        ...editForm,
        duration_weeks: editForm.duration_weeks ? parseInt(editForm.duration_weeks, 10) : undefined,
        tech_stack:
          typeof editForm.tech_stack === 'string'
            ? editForm.tech_stack.split(',').map((s: string) => s.trim()).filter(Boolean)
            : editForm.tech_stack,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['portfolio'] });
      setEditingProject(null);
      toast.success('Project updated successfully');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => portfolioApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['portfolio'] });
      if (viewingProject?.id) setViewingProject(null);
      toast.success('Project deleted');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const toggleFeaturedMutation = useMutation({
    mutationFn: ({ id, is_featured }: { id: string; is_featured: boolean }) =>
      portfolioApi.update(id, { is_featured }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['portfolio'] });
      toast.success('Featured status updated');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const togglePublishedMutation = useMutation({
    mutationFn: ({ id, is_published }: { id: string; is_published: boolean }) =>
      portfolioApi.update(id, { is_published }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['portfolio'] });
      toast.success('Publication status updated');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const addMetricMutation = useMutation({
    mutationFn: () =>
      portfolioApi.addMetric(viewingProject.id, {
        metric_name: newMetricName,
        value: newMetricValue,
        prefix: newMetricPrefix,
        suffix: newMetricSuffix,
      }),
    onSuccess: () => {
      refetchDetail();
      setNewMetricName('');
      setNewMetricValue('');
      setNewMetricPrefix('');
      setNewMetricSuffix('');
      toast.success('Metric added');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const removeMetricMutation = useMutation({
    mutationFn: (metricId: string) => portfolioApi.removeMetric(viewingProject.id, metricId),
    onSuccess: () => {
      refetchDetail();
      toast.success('Metric removed');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const openEdit = (p: any) => {
    setEditingProject(p);
    setEditForm({
      title: p.title || '',
      client_name: p.client_name || '',
      client_url: p.client_url || '',
      category_id: p.category_id || '',
      summary: p.summary || '',
      challenge: p.challenge || '',
      solution: p.solution || '',
      result: p.result || '',
      project_url: p.project_url || '',
      github_url: p.github_url || '',
      cover_image: p.cover_image || '',
      budget_range: p.budget_range || '',
      duration_weeks: p.duration_weeks ? String(p.duration_weeks) : '',
      is_published: p.is_published !== false,
      is_featured: !!p.is_featured,
      tech_stack: Array.isArray(p.tech_stack) ? p.tech_stack.join(', ') : p.tech_stack || '',
    });
  };

  const items = data?.data || [];
  const totalPages = Math.ceil((data?.total || 0) / 12);

  return (
    <DashboardLayout title="Portfolio" breadcrumbs={[{ label: 'Portfolio' }]}>
      <div className="space-y-6 min-w-0">
        {/* Top Filter and Action Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="flex flex-wrap sm:flex-nowrap gap-2 items-center flex-1 max-w-xl">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search projects..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
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

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <div className="flex rounded-lg border border-slate-200 overflow-hidden bg-white">
              {(['grid', 'list'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setViewMode(m)}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                    viewMode === m ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {m === 'grid' ? 'Grid' : 'List'}
                </button>
              ))}
            </div>
            <Button
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => setShowCreate(true)}
              className="whitespace-nowrap"
            >
              Add Project
            </Button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => {
              setCategoryFilter('');
              setPage(1);
            }}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-all whitespace-nowrap ${
              categoryFilter === ''
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-300'
            }`}
          >
            All Projects
          </button>
          {categoriesData?.map((cat: any) => (
            <button
              key={cat.id}
              onClick={() => {
                setCategoryFilter(cat.id);
                setPage(1);
              }}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-all whitespace-nowrap ${
                categoryFilter === cat.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-300'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* ─── GRID VIEW ─── */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading
              ? Array(6)
                  .fill(0)
                  .map((_, i) => (
                    <div
                      key={i}
                      className="bg-white rounded-2xl border border-slate-200 overflow-hidden animate-pulse h-80"
                    >
                      <div className="h-44 bg-slate-100" />
                      <div className="p-4 space-y-3">
                        <div className="h-4 bg-slate-100 rounded w-3/4" />
                        <div className="h-3 bg-slate-100 rounded w-1/2" />
                      </div>
                    </div>
                  ))
              : items.map((item: any) => {
                  const isPublished = item.is_published !== false;
                  return (
                    <div
                      key={item.id}
                      className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all flex flex-col justify-between"
                    >
                      {/* Image Thumbnail Banner */}
                      <div className="relative h-44 bg-gradient-to-br from-slate-100 to-indigo-50 overflow-hidden group">
                        {item.cover_image ? (
                          <img
                            src={item.cover_image}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                            <Layers className="w-10 h-10 opacity-30 mb-1" />
                            <span className="text-xs font-medium opacity-60">Portfolio Case</span>
                          </div>
                        )}

                        {/* Top Badges */}
                        <div className="absolute top-3 left-3 flex gap-1.5 items-center">
                          {item.is_featured && (
                            <span className="px-2 py-0.5 bg-amber-500 text-white text-[11px] font-semibold rounded-md shadow-xs flex items-center gap-1">
                              <Star className="w-3 h-3 fill-white" /> Featured
                            </span>
                          )}
                          <StatusBadge status={isPublished ? 'published' : 'draft'} />
                        </div>

                        {/* Quick Action Overlay */}
                        <div className="absolute top-3 right-3 flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              toggleFeaturedMutation.mutate({ id: item.id, is_featured: !item.is_featured })
                            }
                            className="p-1.5 rounded-full bg-white/90 hover:bg-white text-slate-600 hover:text-amber-500 shadow-xs transition-colors"
                            title="Toggle featured"
                          >
                            <Star
                              className={`w-3.5 h-3.5 ${
                                item.is_featured ? 'text-amber-500 fill-amber-500' : 'text-slate-400'
                              }`}
                            />
                          </button>
                        </div>
                      </div>

                      {/* Project Content */}
                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-slate-900 line-clamp-1">{item.title}</h3>
                              <p className="text-xs text-blue-600 font-medium mt-0.5">
                                {item.client_name ? `${item.client_name} • ` : ''}
                                {item.category_name || 'General'}
                              </p>
                            </div>
                          </div>

                          {item.summary && (
                            <p className="text-xs text-slate-500 mt-2.5 line-clamp-2 leading-relaxed">
                              {item.summary}
                            </p>
                          )}

                          {/* Tech Stack Pills */}
                          {item.tech_stack?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-3">
                              {item.tech_stack.slice(0, 3).map((tech: string) => (
                                <span
                                  key={tech}
                                  className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium"
                                >
                                  {tech}
                                </span>
                              ))}
                              {item.tech_stack.length > 3 && (
                                <span className="text-[11px] text-slate-400 px-1 py-0.5">
                                  +{item.tech_stack.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Card Actions */}
                        <div className="flex items-center gap-2 mt-5 pt-3 border-t border-slate-100">
                          <Button
                            variant="outline"
                            size="sm"
                            icon={<Eye className="w-3.5 h-3.5" />}
                            onClick={() => setViewingProject(item)}
                            className="flex-1"
                          >
                            View
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<Edit2 className="w-3.5 h-3.5 text-slate-600" />}
                            onClick={() => openEdit(item)}
                          />
                          <button
                            type="button"
                            onClick={() =>
                              togglePublishedMutation.mutate({ id: item.id, is_published: !isPublished })
                            }
                            className={`p-2 rounded-lg border text-xs transition-colors ${
                              isPublished
                                ? 'border-slate-200 text-slate-500 hover:bg-slate-50'
                                : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title={isPublished ? 'Unpublish' : 'Publish'}
                          >
                            {isPublished ? (
                              <XCircle className="w-4 h-4 text-slate-400" />
                            ) : (
                              <CheckCircle className="w-4 h-4 text-emerald-600" />
                            )}
                          </button>
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
                            onClick={() => setDeletingProject(item)}
                            title="Delete project"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}

            {!isLoading && !items.length && (
              <div className="col-span-full text-center py-16 text-slate-500 bg-white rounded-2xl border border-slate-200">
                <FolderGit2 className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="font-medium text-slate-700">No portfolio projects found</p>
                <p className="text-xs text-slate-400 mt-1">
                  {search || categoryFilter ? 'Try clearing your filters' : 'Add your first project to showcase your work'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* ─── LIST VIEW ─── */}
        {viewMode === 'list' && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Project</th>
                    <th className="px-4 py-3">Client</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Tech Stack</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item: any) => {
                    const isPublished = item.is_published !== false;
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {item.cover_image ? (
                              <img src={item.cover_image} alt="" className="w-10 h-8 rounded object-cover flex-shrink-0" />
                            ) : (
                              <div className="w-10 h-8 bg-slate-100 rounded flex items-center justify-center text-xs text-slate-400 flex-shrink-0">
                                🖼️
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-medium text-slate-900 truncate max-w-xs">{item.title}</p>
                              {item.summary && <p className="text-xs text-slate-400 truncate max-w-xs">{item.summary}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs">{item.client_name || '—'}</td>
                        <td className="px-4 py-3 text-xs">
                          <Badge className="capitalize">{item.category_name || 'General'}</Badge>
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {item.tech_stack?.slice(0, 2).join(', ') || '—'}
                          {item.tech_stack?.length > 2 ? ` +${item.tech_stack.length - 2}` : ''}
                        </td>
                        <td className="px-4 py-3 text-xs">
                          <div className="flex items-center gap-1.5">
                            {item.is_featured && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
                            <StatusBadge status={isPublished ? 'published' : 'draft'} />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<Eye className="w-3.5 h-3.5 text-slate-600" />}
                              onClick={() => setViewingProject(item)}
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<Edit2 className="w-3.5 h-3.5 text-slate-600" />}
                              onClick={() => openEdit(item)}
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
                              onClick={() => setDeletingProject(item)}
                              title="Delete project"
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {!items.length && !isLoading && (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-400 text-xs">
                        No projects found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          total={data?.total}
          limit={12}
        />
      </div>

      {/* ─── CREATE PROJECT MODAL ─── */}
      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Add New Portfolio Project"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button loading={createMutation.isPending} onClick={() => createMutation.mutate()}>
              Create Project
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Input
              label="Project Title *"
              value={createForm.title}
              onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
              placeholder="e.g. NextGen FinTech Platform"
            />
          </div>
          <div>
            <Select
              label="Category"
              options={categoriesData?.map((c: any) => ({ value: c.id, label: c.name })) || []}
              value={createForm.category_id}
              onChange={(e) => setCreateForm({ ...createForm, category_id: e.target.value })}
              placeholder="Select category"
            />
          </div>
          <div>
            <Input
              label="Client Name"
              value={createForm.client_name}
              onChange={(e) => setCreateForm({ ...createForm, client_name: e.target.value })}
              placeholder="e.g. Acme Corp"
            />
          </div>
          <div>
            <Input
              label="Live Project URL"
              type="url"
              value={createForm.project_url}
              onChange={(e) => setCreateForm({ ...createForm, project_url: e.target.value })}
              placeholder="https://acme.com"
            />
          </div>
          <div>
            <Input
              label="GitHub Repository URL"
              type="url"
              value={createForm.github_url}
              onChange={(e) => setCreateForm({ ...createForm, github_url: e.target.value })}
              placeholder="https://github.com/org/repo"
            />
          </div>
          <div className="col-span-2">
            <Input
              label="Cover Image URL"
              value={createForm.cover_image}
              onChange={(e) => setCreateForm({ ...createForm, cover_image: e.target.value })}
              placeholder="https://images.unsplash.com/..."
            />
          </div>
          <div className="col-span-2">
            <Input
              label="Tech Stack (comma-separated)"
              value={createForm.tech_stack}
              onChange={(e) => setCreateForm({ ...createForm, tech_stack: e.target.value })}
              placeholder="React, Next.js, Node.js, PostgreSQL, AWS"
            />
          </div>
          <div className="col-span-2">
            <Input
              label="Short Summary"
              value={createForm.summary}
              onChange={(e) => setCreateForm({ ...createForm, summary: e.target.value })}
              placeholder="One or two sentences highlighting the client results"
            />
          </div>
          <div className="col-span-2">
            <Textarea
              label="Case Study / Description"
              value={createForm.solution}
              onChange={(e) => setCreateForm({ ...createForm, solution: e.target.value })}
              rows={3}
              placeholder="Explain the solution built and technological architecture..."
            />
          </div>
          <div className="col-span-2 flex items-center gap-6 pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={createForm.is_published}
                onChange={(e) => setCreateForm({ ...createForm, is_published: e.target.checked })}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
              Publish immediately
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={createForm.is_featured}
                onChange={(e) => setCreateForm({ ...createForm, is_featured: e.target.checked })}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
              Mark as featured
            </label>
          </div>
        </div>
      </Modal>

      {/* ─── VIEW PROJECT DETAILS MODAL ─── */}
      {viewingProject && (
        <Modal
          open={!!viewingProject}
          onClose={() => setViewingProject(null)}
          title={projectDetail?.title || viewingProject.title}
          size="lg"
          footer={
            <div className="flex justify-between w-full items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const p = projectDetail || viewingProject;
                  setViewingProject(null);
                  openEdit(p);
                }}
              >
                Edit Project
              </Button>
              <Button onClick={() => setViewingProject(null)}>Close</Button>
            </div>
          }
        >
          <div className="space-y-5">
            {/* Cover Banner */}
            {(projectDetail?.cover_image || viewingProject.cover_image) && (
              <div className="h-48 w-full rounded-xl overflow-hidden bg-slate-100">
                <img
                  src={projectDetail?.cover_image || viewingProject.cover_image}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Client & Category Meta */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <p className="text-xs text-slate-400">Client</p>
                <p className="text-sm font-semibold text-slate-800">
                  {projectDetail?.client_name || viewingProject.client_name || 'Internal / Confidential'}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Category</p>
                <p className="text-sm font-semibold text-slate-800">
                  {projectDetail?.category_name || viewingProject.category_name || 'General'}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Status</p>
                <StatusBadge status={viewingProject.is_published !== false ? 'published' : 'draft'} />
              </div>
              {/* Links */}
              <div className="flex items-center gap-2">
                {viewingProject.project_url && (
                  <a
                    href={viewingProject.project_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                    title="Live Site"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
                {viewingProject.github_url && (
                  <a
                    href={viewingProject.github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                    title="GitHub Code"
                  >
                    <Code className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>

            {/* Summary */}
            {projectDetail?.summary && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Executive Summary</p>
                <p className="text-sm text-slate-700 leading-relaxed">{projectDetail.summary}</p>
              </div>
            )}

            {/* Solution & Challenge */}
            {projectDetail?.challenge && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">The Challenge</p>
                <p className="text-sm text-slate-700 leading-relaxed">{projectDetail.challenge}</p>
              </div>
            )}
            {projectDetail?.solution && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Our Solution</p>
                <p className="text-sm text-slate-700 leading-relaxed">{projectDetail.solution}</p>
              </div>
            )}

            {/* Tech Stack */}
            {projectDetail?.tech_stack?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Technologies Used</p>
                <div className="flex flex-wrap gap-1.5">
                  {projectDetail.tech_stack.map((t: string) => (
                    <Badge key={t} className="text-xs font-medium">
                      {t}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Metrics Section */}
            <div className="pt-3 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Project Impact & Metrics</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                {projectDetail?.metrics?.map((m: any) => (
                  <div key={m.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center relative group">
                    <p className="text-lg font-bold text-blue-600">
                      {m.prefix}
                      {m.value}
                      {m.suffix}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">{m.metric_name}</p>
                    <button
                      type="button"
                      onClick={() => removeMetricMutation.mutate(m.id)}
                      className="absolute top-1.5 right-1.5 text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Metric Form */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap gap-2 items-center">
                <input
                  type="text"
                  placeholder="Metric Name (e.g. Speed)"
                  value={newMetricName}
                  onChange={(e) => setNewMetricName(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg flex-1 min-w-[120px]"
                />
                <input
                  type="text"
                  placeholder="Value (e.g. 50)"
                  value={newMetricValue}
                  onChange={(e) => setNewMetricValue(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg w-20"
                />
                <input
                  type="text"
                  placeholder="Suffix (e.g. %)"
                  value={newMetricSuffix}
                  onChange={(e) => setNewMetricSuffix(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg w-16"
                />
                <Button
                  size="sm"
                  disabled={!newMetricName || !newMetricValue}
                  loading={addMetricMutation.isPending}
                  onClick={() => addMetricMutation.mutate()}
                >
                  Add
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* ─── EDIT PROJECT MODAL ─── */}
      {editingProject && (
        <Modal
          open={!!editingProject}
          onClose={() => setEditingProject(null)}
          title={`Edit Project: ${editingProject.title}`}
          size="lg"
          footer={
            <>
              <Button variant="outline" onClick={() => setEditingProject(null)}>
                Cancel
              </Button>
              <Button loading={updateMutation.isPending} onClick={() => updateMutation.mutate()}>
                Save Changes
              </Button>
            </>
          }
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Input
                label="Project Title *"
                value={editForm.title || ''}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              />
            </div>
            <div>
              <Select
                label="Category"
                options={categoriesData?.map((c: any) => ({ value: c.id, label: c.name })) || []}
                value={editForm.category_id || ''}
                onChange={(e) => setEditForm({ ...editForm, category_id: e.target.value })}
              />
            </div>
            <div>
              <Input
                label="Client Name"
                value={editForm.client_name || ''}
                onChange={(e) => setEditForm({ ...editForm, client_name: e.target.value })}
              />
            </div>
            <div>
              <Input
                label="Live Project URL"
                value={editForm.project_url || ''}
                onChange={(e) => setEditForm({ ...editForm, project_url: e.target.value })}
              />
            </div>
            <div>
              <Input
                label="GitHub URL"
                value={editForm.github_url || ''}
                onChange={(e) => setEditForm({ ...editForm, github_url: e.target.value })}
              />
            </div>
            <div className="col-span-2">
              <Input
                label="Cover Image URL"
                value={editForm.cover_image || ''}
                onChange={(e) => setEditForm({ ...editForm, cover_image: e.target.value })}
              />
            </div>
            <div className="col-span-2">
              <Input
                label="Tech Stack (comma-separated)"
                value={editForm.tech_stack || ''}
                onChange={(e) => setEditForm({ ...editForm, tech_stack: e.target.value })}
              />
            </div>
            <div className="col-span-2">
              <Input
                label="Short Summary"
                value={editForm.summary || ''}
                onChange={(e) => setEditForm({ ...editForm, summary: e.target.value })}
              />
            </div>
            <div className="col-span-2">
              <Textarea
                label="Case Study / Description"
                value={editForm.solution || ''}
                onChange={(e) => setEditForm({ ...editForm, solution: e.target.value })}
                rows={4}
              />
            </div>
            <div className="col-span-2 flex items-center gap-6 pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={editForm.is_published}
                  onChange={(e) => setEditForm({ ...editForm, is_published: e.target.checked })}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                Published
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={editForm.is_featured}
                  onChange={(e) => setEditForm({ ...editForm, is_featured: e.target.checked })}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                Featured
              </label>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deletingProject}
        onClose={() => setDeletingProject(null)}
        onConfirm={() => {
          const id = deletingProject.id;
          setDeletingProject(null);
          deleteMutation.mutate(id);
        }}
        title="Delete Portfolio Project"
        description={
          <>
            Are you sure you want to permanently delete case study{' '}
            <strong>&quot;{deletingProject?.title}&quot;</strong>? This action cannot be undone.
          </>
        }
        loading={deleteMutation.isPending}
      />
    </DashboardLayout>
  );
}
