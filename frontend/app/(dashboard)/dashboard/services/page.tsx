'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/app/(dashboard)/_components/layout/DashboardLayout';
import { Card, Button, StatusBadge, Pagination, Modal, Input, Select, Textarea, TabBar, Badge, ConfirmDialog } from '@/components/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { servicesApi } from '@/lib/api';
import { formatCurrency, extractApiError } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Plus,
  Eye,
  Edit,
  Trash2,
  Briefcase,
  Star,
  DollarSign,
  Search,
  Layers,
  Package,
  CheckCircle,
  XCircle,
  Check,
} from 'lucide-react';

export default function ServicesPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState('services');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Modals
  const [showCreate, setShowCreate] = useState(false);
  const [createTarget, setCreateTarget] = useState<'service' | 'category' | 'industry' | 'solution'>('service');
  const [createForm, setCreateForm] = useState<any>({});

  // Edit / Detail modals
  const [selectedService, setSelectedService] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [activeServiceSubTab, setActiveServiceSubTab] = useState<'details' | 'features' | 'packages'>('details');

  const [editCategory, setEditCategory] = useState<any>(null);
  const [editIndustry, setEditIndustry] = useState<any>(null);
  const [editSolution, setEditSolution] = useState<any>(null);

  // Deleting confirmation states
  const [deletingService, setDeletingService] = useState<any>(null);
  const [deletingCategory, setDeletingCategory] = useState<any>(null);
  const [deletingIndustry, setDeletingIndustry] = useState<any>(null);
  const [deletingSolution, setDeletingSolution] = useState<any>(null);

  // New feature / package form state
  const [newFeatureTitle, setNewFeatureTitle] = useState('');
  const [newFeatureDesc, setNewFeatureDesc] = useState('');
  const [newPkgName, setNewPkgName] = useState('');
  const [newPkgPrice, setNewPkgPrice] = useState('');
  const [newPkgTier, setNewPkgTier] = useState('standard');

  // Queries
  const { data: servicesData, isLoading: servicesLoading } = useQuery({
    queryKey: ['services', { page, search, category_id: selectedCategory }],
    queryFn: () =>
      servicesApi
        .getServices({
          page,
          limit: 12,
          search: search.trim() || undefined,
          category_id: selectedCategory || undefined,
        })
        .then((r) => r.data),
    enabled: tab === 'services',
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['service-categories'],
    queryFn: () => servicesApi.getCategories().then((r) => r.data.data),
  });

  const { data: industriesData } = useQuery({
    queryKey: ['industries'],
    queryFn: () => servicesApi.getIndustries().then((r) => r.data.data),
    enabled: tab === 'industries',
  });

  const { data: solutionsData } = useQuery({
    queryKey: ['solutions'],
    queryFn: () => servicesApi.getSolutions().then((r) => r.data.data),
    enabled: tab === 'solutions',
  });

  // Detailed query for selected service
  const { data: serviceDetail, refetch: refetchDetail } = useQuery({
    queryKey: ['service-detail', selectedService?.id],
    queryFn: () => servicesApi.getService(selectedService.id).then((r) => r.data.data),
    enabled: !!selectedService?.id,
  });

  // Create mutations
  const createServiceMutation = useMutation({
    mutationFn: () => servicesApi.createService(createForm),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['services'] });
      setShowCreate(false);
      setCreateForm({});
      toast.success('Service created successfully');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const createCategoryMutation = useMutation({
    mutationFn: () => servicesApi.createCategory(createForm),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['service-categories'] });
      setShowCreate(false);
      setCreateForm({});
      toast.success('Category created');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const createIndustryMutation = useMutation({
    mutationFn: () => servicesApi.createIndustry(createForm),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['industries'] });
      setShowCreate(false);
      setCreateForm({});
      toast.success('Industry created');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const createSolutionMutation = useMutation({
    mutationFn: () => servicesApi.createSolution(createForm),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['solutions'] });
      setShowCreate(false);
      setCreateForm({});
      toast.success('Solution created');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  // Update mutations
  const updateServiceMutation = useMutation({
    mutationFn: () => servicesApi.updateService(selectedService.id, editForm),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['services'] });
      qc.invalidateQueries({ queryKey: ['service-detail', selectedService?.id] });
      toast.success('Service updated successfully');
      setSelectedService(null);
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const toggleFeaturedMutation = useMutation({
    mutationFn: ({ id, is_featured }: { id: string; is_featured: boolean }) =>
      servicesApi.updateService(id, { is_featured }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['services'] });
      toast.success('Featured status updated');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      servicesApi.updateService(id, { is_active }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['services'] });
      toast.success('Status updated');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const deleteServiceMutation = useMutation({
    mutationFn: (id: string) => servicesApi.deleteService(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['services'] });
      if (selectedService?.id) setSelectedService(null);
      toast.success('Service deleted');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  // Categories CRUD
  const updateCategoryMutation = useMutation({
    mutationFn: () => servicesApi.updateCategory(editCategory.id, editCategory),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['service-categories'] });
      setEditCategory(null);
      toast.success('Category updated');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => servicesApi.deleteCategory(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['service-categories'] });
      toast.success('Category deactivated');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  // Industries CRUD
  const updateIndustryMutation = useMutation({
    mutationFn: () => servicesApi.updateIndustry(editIndustry.id, editIndustry),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['industries'] });
      setEditIndustry(null);
      toast.success('Industry updated');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const deleteIndustryMutation = useMutation({
    mutationFn: (id: string) => servicesApi.deleteIndustry(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['industries'] });
      toast.success('Industry deleted');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  // Solutions CRUD
  const updateSolutionMutation = useMutation({
    mutationFn: () => servicesApi.updateSolution(editSolution.id, editSolution),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['solutions'] });
      setEditSolution(null);
      toast.success('Solution updated');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const deleteSolutionMutation = useMutation({
    mutationFn: (id: string) => servicesApi.deleteSolution(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['solutions'] });
      toast.success('Solution deactivated');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  // Sub-features & packages mutations
  const addFeatureMutation = useMutation({
    mutationFn: () =>
      servicesApi.addFeature(selectedService.id, {
        title: newFeatureTitle,
        description: newFeatureDesc,
      }),
    onSuccess: () => {
      refetchDetail();
      setNewFeatureTitle('');
      setNewFeatureDesc('');
      toast.success('Feature added');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const removeFeatureMutation = useMutation({
    mutationFn: (featureId: string) => servicesApi.removeFeature(selectedService.id, featureId),
    onSuccess: () => {
      refetchDetail();
      toast.success('Feature removed');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const addPackageMutation = useMutation({
    mutationFn: () =>
      servicesApi.addPackage(selectedService.id, {
        name: newPkgName,
        price: parseFloat(newPkgPrice) || 0,
        tier: newPkgTier,
      }),
    onSuccess: () => {
      refetchDetail();
      setNewPkgName('');
      setNewPkgPrice('');
      toast.success('Package added');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const removePackageMutation = useMutation({
    mutationFn: (pkgId: string) => servicesApi.deletePackage(selectedService.id, pkgId),
    onSuccess: () => {
      refetchDetail();
      toast.success('Package removed');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const openCreate = (target: typeof createTarget) => {
    setCreateTarget(target);
    setCreateForm({
      pricing_type: 'fixed',
      currency: 'USD',
      is_active: true,
      is_featured: false,
    });
    setShowCreate(true);
  };

  const openManageService = (s: any) => {
    setSelectedService(s);
    setEditForm({
      title: s.title || s.name || '',
      tagline: s.tagline || '',
      summary: s.summary || s.short_description || '',
      description: s.description || '',
      starting_price: s.starting_price || s.base_price || '',
      pricing_type: s.pricing_type || 'fixed',
      is_active: s.is_active !== false,
      is_featured: !!s.is_featured,
      category_id: s.category_id || '',
    });
    setActiveServiceSubTab('details');
  };

  const getCreateMutation = () => {
    if (createTarget === 'service') return createServiceMutation;
    if (createTarget === 'category') return createCategoryMutation;
    if (createTarget === 'industry') return createIndustryMutation;
    return createSolutionMutation;
  };

  const services = servicesData?.data || [];

  const PRICING_TYPES = [
    { value: 'fixed', label: 'Fixed Price' },
    { value: 'hourly', label: 'Hourly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'custom', label: 'Custom' },
  ];

  return (
    <DashboardLayout title="Services" breadcrumbs={[{ label: 'Services' }]}>
      <div className="space-y-6 min-w-0">
        {/* Header Tabs */}
        <TabBar
          tabs={[
            { id: 'services', label: 'Services', count: servicesData?.total },
            { id: 'categories', label: 'Categories', count: categoriesData?.length },
            { id: 'industries', label: 'Industries', count: industriesData?.length },
            { id: 'solutions', label: 'Solutions', count: solutionsData?.length },
          ]}
          active={tab}
          onChange={(t) => {
            setTab(t);
            setPage(1);
          }}
        />

        {/* ─── SERVICES TAB ─── */}
        {tab === 'services' && (
          <div className="space-y-5">
            {/* Search & Action Bar */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <div className="flex flex-wrap sm:flex-nowrap gap-2 items-center flex-1 max-w-xl">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search services..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
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
                onClick={() => openCreate('service')}
                className="whitespace-nowrap flex-shrink-0"
              >
                New Service
              </Button>
            </div>

            {/* Services Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((s: any) => {
                const serviceTitle = s.title || s.name;
                const price = s.starting_price ?? s.base_price;
                const isActive = s.is_active !== false;

                return (
                  <div
                    key={s.id}
                    className="bg-white rounded-2xl border border-slate-200 hover:shadow-lg transition-all flex flex-col overflow-hidden"
                  >
                    {/* Visual Banner */}
                    <div className="h-32 bg-gradient-to-br from-blue-50 via-indigo-50 to-slate-100 flex items-center justify-center relative p-4 border-b border-slate-100">
                      {s.icon_url || s.icon ? (
                        <div className="w-14 h-14 rounded-xl bg-white shadow-sm border border-slate-200/80 flex items-center justify-center text-2xl font-bold text-blue-600">
                          {s.icon?.length <= 4 ? s.icon : <Briefcase className="w-7 h-7 text-blue-600" />}
                        </div>
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-white shadow-sm border border-slate-200/80 flex items-center justify-center">
                          <Briefcase className="w-7 h-7 text-blue-500" />
                        </div>
                      )}

                      <div className="absolute top-3 right-3 flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => toggleFeaturedMutation.mutate({ id: s.id, is_featured: !s.is_featured })}
                          title={s.is_featured ? 'Featured Service' : 'Mark as Featured'}
                          className="p-1 rounded-full bg-white/80 hover:bg-white backdrop-blur shadow-xs transition-colors"
                        >
                          <Star
                            className={`w-4 h-4 ${
                              s.is_featured ? 'text-amber-500 fill-amber-500' : 'text-slate-300 hover:text-amber-400'
                            }`}
                          />
                        </button>
                        <StatusBadge status={isActive ? 'active' : 'inactive'} />
                      </div>
                    </div>

                    {/* Content Body */}
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <div>
                            <h3 className="font-semibold text-slate-900 line-clamp-1">{serviceTitle}</h3>
                            <p className="text-xs text-blue-600 font-medium mt-0.5">
                              {s.category_name || 'Uncategorized'}
                            </p>
                          </div>
                        </div>

                        {s.summary || s.short_description ? (
                          <p className="text-xs text-slate-500 line-clamp-2 mt-2 leading-relaxed">
                            {s.summary || s.short_description}
                          </p>
                        ) : null}

                        {/* Pricing */}
                        {price !== undefined && price !== null && (
                          <div className="flex items-center gap-1.5 mt-3 text-emerald-700 font-semibold text-sm">
                            <DollarSign className="w-4 h-4 text-emerald-600" />
                            <span>{formatCurrency(price, s.currency || 'USD')}</span>
                            <span className="text-xs text-slate-400 font-normal">
                              / {(s.pricing_type || 'fixed').replace(/_/g, ' ')}
                            </span>
                          </div>
                        )}

                        {/* Packages badge */}
                        {s.package_count !== undefined && parseInt(s.package_count, 10) > 0 && (
                          <div className="mt-3 flex items-center gap-1 text-xs text-slate-600">
                            <Package className="w-3.5 h-3.5 text-slate-400" />
                            <span>{s.package_count} active package(s)</span>
                          </div>
                        )}
                      </div>

                      {/* Card Footer Actions */}
                      <div className="flex items-center gap-2 mt-5 pt-3 border-t border-slate-100">
                        <Button
                          variant="outline"
                          size="sm"
                          icon={<Edit className="w-3.5 h-3.5" />}
                          onClick={() => openManageService(s)}
                          className="flex-1"
                        >
                          Manage
                        </Button>

                        <button
                          type="button"
                          onClick={() => toggleActiveMutation.mutate({ id: s.id, is_active: !isActive })}
                          className={`p-2 rounded-lg border text-xs transition-colors ${
                            isActive
                              ? 'border-slate-200 text-slate-600 hover:bg-slate-50'
                              : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={isActive ? 'Deactivate service' : 'Activate service'}
                        >
                          {isActive ? <XCircle className="w-4 h-4 text-slate-400" /> : <CheckCircle className="w-4 h-4 text-emerald-600" />}
                        </button>

                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
                          onClick={() => setDeletingService(s)}
                          title="Delete service"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}

              {!services.length && !servicesLoading && (
                <div className="col-span-full text-center py-16 text-slate-500 bg-white rounded-2xl border border-slate-200">
                  <Briefcase className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p className="font-medium text-slate-700">No services found</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {search || selectedCategory ? 'Try adjusting your search filters' : 'Create your first service to get started'}
                  </p>
                </div>
              )}
            </div>

            <Pagination
              page={page}
              totalPages={Math.ceil((servicesData?.total || 0) / 12)}
              onPageChange={setPage}
              total={servicesData?.total}
              limit={12}
            />
          </div>
        )}

        {/* ─── CATEGORIES TAB ─── */}
        {tab === 'categories' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-slate-500">Manage categories to organize services and portfolio works.</p>
              <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => openCreate('category')}>
                New Category
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {categoriesData?.map((cat: any) => (
                <Card key={cat.id} className="!p-4 hover:shadow-md transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      {cat.icon ? (
                        <span className="text-2xl">{cat.icon}</span>
                      ) : (
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-xs"
                          style={{ backgroundColor: cat.color || '#3b82f6' }}
                        >
                          {cat.name?.[0]?.toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 truncate">{cat.name}</p>
                        <p className="text-xs text-slate-400">{cat.service_count || 0} services</p>
                      </div>
                    </div>
                    {cat.description && (
                      <p className="text-xs text-slate-500 mt-2.5 line-clamp-2 leading-relaxed">{cat.description}</p>
                    )}
                  </div>
                  <div className="flex items-center justify-end gap-1 mt-4 pt-3 border-t border-slate-100">
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Edit className="w-3.5 h-3.5 text-slate-600" />}
                      onClick={() => setEditCategory({ ...cat })}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
                      onClick={() => setDeletingCategory(cat)}
                      title="Deactivate category"
                    />
                  </div>
                </Card>
              ))}
              {!categoriesData?.length && (
                <p className="col-span-full text-center text-slate-500 py-12">No categories defined yet.</p>
              )}
            </div>
          </div>
        )}

        {/* ─── INDUSTRIES TAB ─── */}
        {tab === 'industries' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-slate-500">Specialized industry solutions and domain-specific offerings.</p>
              <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => openCreate('industry')}>
                New Industry
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {industriesData?.map((ind: any) => (
                <Card key={ind.id} className="!p-5 hover:shadow-md transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-slate-900">{ind.name}</h3>
                      {ind.icon && <span className="text-xl">{ind.icon}</span>}
                    </div>
                    {ind.description && (
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-3">{ind.description}</p>
                    )}
                  </div>
                  <div className="flex items-center justify-end gap-1 mt-4 pt-3 border-t border-slate-100">
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Edit className="w-3.5 h-3.5 text-slate-600" />}
                      onClick={() => setEditIndustry({ ...ind })}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
                      onClick={() => setDeletingIndustry(ind)}
                      title="Delete industry"
                    />
                  </div>
                </Card>
              ))}
              {!industriesData?.length && (
                <p className="col-span-full text-center text-slate-500 py-12">No industries defined yet.</p>
              )}
            </div>
          </div>
        )}

        {/* ─── SOLUTIONS TAB ─── */}
        {tab === 'solutions' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-slate-500">Cross-cutting solutions and architectural blueprints.</p>
              <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => openCreate('solution')}>
                New Solution
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {solutionsData?.map((sol: any) => (
                <Card key={sol.id} className="!p-5 hover:shadow-md transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 text-blue-600">
                        <Briefcase className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-slate-900 truncate">{sol.name}</h3>
                          {sol.is_featured && <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />}
                        </div>
                        {sol.tagline && <p className="text-xs font-medium text-blue-600 mt-0.5">{sol.tagline}</p>}
                        {sol.description && (
                          <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed">{sol.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-1 mt-4 pt-3 border-t border-slate-100">
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Edit className="w-3.5 h-3.5 text-slate-600" />}
                      onClick={() => setEditSolution({ ...sol })}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
                      onClick={() => setDeletingSolution(sol)}
                      title="Deactivate solution"
                    />
                  </div>
                </Card>
              ))}
              {!solutionsData?.length && (
                <p className="col-span-full text-center text-slate-500 py-12">No solutions defined yet.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ─── CREATE MODAL (Unified) ─── */}
      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title={
          createTarget === 'service'
            ? 'New Service'
            : createTarget === 'category'
            ? 'New Category'
            : createTarget === 'industry'
            ? 'New Industry'
            : 'New Solution'
        }
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button loading={getCreateMutation().isPending} onClick={() => getCreateMutation().mutate()}>
              Create
            </Button>
          </>
        }
      >
        {createTarget === 'service' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Input
                  label="Service Title *"
                  value={createForm.title || ''}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  placeholder="e.g. Full-Stack Web App Development"
                />
              </div>
              <div>
                <Select
                  label="Category"
                  options={categoriesData?.map((c: any) => ({ value: c.id, label: c.name })) || []}
                  value={createForm.category_id || ''}
                  onChange={(e) => setCreateForm({ ...createForm, category_id: e.target.value })}
                  placeholder="Select category"
                />
              </div>
              <div>
                <Select
                  label="Pricing Type"
                  options={PRICING_TYPES}
                  value={createForm.pricing_type || 'fixed'}
                  onChange={(e) => setCreateForm({ ...createForm, pricing_type: e.target.value })}
                />
              </div>
              <div>
                <Input
                  label="Starting Price"
                  type="number"
                  value={createForm.starting_price || ''}
                  onChange={(e) => setCreateForm({ ...createForm, starting_price: e.target.value })}
                  placeholder="e.g. 5000"
                />
              </div>
              <div>
                <Select
                  label="Currency"
                  options={[
                    { value: 'USD', label: 'USD ($)' },
                    { value: 'EUR', label: 'EUR (€)' },
                    { value: 'GBP', label: 'GBP (£)' },
                  ]}
                  value={createForm.currency || 'USD'}
                  onChange={(e) => setCreateForm({ ...createForm, currency: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <Input
                  label="Tagline / Short Summary"
                  value={createForm.summary || ''}
                  onChange={(e) => setCreateForm({ ...createForm, summary: e.target.value })}
                  placeholder="One sentence describing the value proposition"
                />
              </div>
              <div className="col-span-2">
                <Textarea
                  label="Full Description"
                  value={createForm.description || ''}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  rows={3}
                  placeholder="Describe the service in detail..."
                />
              </div>
            </div>
          </div>
        )}

        {createTarget === 'category' && (
          <div className="space-y-4">
            <Input
              label="Category Name *"
              value={createForm.name || ''}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              placeholder="e.g. Cloud & DevOps"
            />
            <Input
              label="Slug (optional)"
              value={createForm.slug || ''}
              onChange={(e) => setCreateForm({ ...createForm, slug: e.target.value })}
              placeholder="e.g. cloud-devops"
            />
            <Input
              label="Color (Hex or Tailwind)"
              value={createForm.color || ''}
              onChange={(e) => setCreateForm({ ...createForm, color: e.target.value })}
              placeholder="#3b82f6"
            />
            <Textarea
              label="Description"
              value={createForm.description || ''}
              onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
              rows={3}
            />
          </div>
        )}

        {createTarget === 'industry' && (
          <div className="space-y-4">
            <Input
              label="Industry Name *"
              value={createForm.name || ''}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              placeholder="e.g. Fintech & Banking"
            />
            <Input
              label="Slug (optional)"
              value={createForm.slug || ''}
              onChange={(e) => setCreateForm({ ...createForm, slug: e.target.value })}
              placeholder="fintech-banking"
            />
            <Textarea
              label="Description"
              value={createForm.description || ''}
              onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
              rows={3}
            />
          </div>
        )}

        {createTarget === 'solution' && (
          <div className="space-y-4">
            <Input
              label="Solution Name *"
              value={createForm.name || ''}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              placeholder="e.g. AI-Powered Customer Analytics"
            />
            <Input
              label="Slug (optional)"
              value={createForm.slug || ''}
              onChange={(e) => setCreateForm({ ...createForm, slug: e.target.value })}
              placeholder="ai-customer-analytics"
            />
            <Input
              label="Tagline"
              value={createForm.tagline || ''}
              onChange={(e) => setCreateForm({ ...createForm, tagline: e.target.value })}
              placeholder="Turn enterprise data into actionable customer insights"
            />
            <Textarea
              label="Description"
              value={createForm.description || ''}
              onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
              rows={3}
            />
          </div>
        )}
      </Modal>

      {/* ─── SERVICE MANAGE / EDIT MODAL ─── */}
      {selectedService && (
        <Modal
          open={!!selectedService}
          onClose={() => setSelectedService(null)}
          title={`Manage Service: ${selectedService.title || selectedService.name}`}
          size="xl"
          footer={
            <div className="flex justify-between w-full items-center">
              <Button
                variant="ghost"
                size="sm"
                className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                onClick={() => setDeletingService(selectedService)}
              >
                Delete Service
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setSelectedService(null)}>
                  Cancel
                </Button>
                <Button loading={updateServiceMutation.isPending} onClick={() => updateServiceMutation.mutate()}>
                  Save Changes
                </Button>
              </div>
            </div>
          }
        >
          <div className="space-y-5">
            {/* Sub-tabs */}
            <div className="flex border-b border-slate-200">
              <button
                type="button"
                onClick={() => setActiveServiceSubTab('details')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeServiceSubTab === 'details'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Service Details
              </button>
              <button
                type="button"
                onClick={() => setActiveServiceSubTab('features')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeServiceSubTab === 'features'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Features ({serviceDetail?.features?.length || 0})
              </button>
              <button
                type="button"
                onClick={() => setActiveServiceSubTab('packages')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeServiceSubTab === 'packages'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Packages ({serviceDetail?.packages?.length || 0})
              </button>
            </div>

            {/* Subtab 1: Details */}
            {activeServiceSubTab === 'details' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Input
                    label="Title *"
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
                  <Select
                    label="Pricing Type"
                    options={PRICING_TYPES}
                    value={editForm.pricing_type || 'fixed'}
                    onChange={(e) => setEditForm({ ...editForm, pricing_type: e.target.value })}
                  />
                </div>
                <div>
                  <Input
                    label="Starting Price"
                    type="number"
                    value={editForm.starting_price || ''}
                    onChange={(e) => setEditForm({ ...editForm, starting_price: e.target.value })}
                  />
                </div>
                <div className="flex items-center gap-6 pt-6">
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={editForm.is_active}
                      onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    Active / Published
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
                <div className="col-span-2">
                  <Input
                    label="Summary / Tagline"
                    value={editForm.summary || ''}
                    onChange={(e) => setEditForm({ ...editForm, summary: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <Textarea
                    label="Full Description"
                    value={editForm.description || ''}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    rows={4}
                  />
                </div>
              </div>
            )}

            {/* Subtab 2: Features */}
            {activeServiceSubTab === 'features' && (
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">Add New Feature</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      placeholder="Feature Title (e.g. Automated CI/CD)"
                      value={newFeatureTitle}
                      onChange={(e) => setNewFeatureTitle(e.target.value)}
                    />
                    <Input
                      placeholder="Description (optional)"
                      value={newFeatureDesc}
                      onChange={(e) => setNewFeatureDesc(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      disabled={!newFeatureTitle.trim()}
                      loading={addFeatureMutation.isPending}
                      onClick={() => addFeatureMutation.mutate()}
                    >
                      Add Feature
                    </Button>
                  </div>
                </div>

                <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
                  {serviceDetail?.features?.map((f: any) => (
                    <div key={f.id} className="py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-slate-800">{f.title}</p>
                          {f.description && <p className="text-xs text-slate-500">{f.description}</p>}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
                        onClick={() => removeFeatureMutation.mutate(f.id)}
                      />
                    </div>
                  ))}
                  {!serviceDetail?.features?.length && (
                    <p className="text-xs text-slate-400 py-4 text-center">No features configured yet.</p>
                  )}
                </div>
              </div>
            )}

            {/* Subtab 3: Packages */}
            {activeServiceSubTab === 'packages' && (
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">Add Service Tier</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Input
                      placeholder="Package Name (e.g. Pro)"
                      value={newPkgName}
                      onChange={(e) => setNewPkgName(e.target.value)}
                    />
                    <Input
                      placeholder="Price"
                      type="number"
                      value={newPkgPrice}
                      onChange={(e) => setNewPkgPrice(e.target.value)}
                    />
                    <Select
                      options={[
                        { value: 'basic', label: 'Basic Tier' },
                        { value: 'standard', label: 'Standard Tier' },
                        { value: 'enterprise', label: 'Enterprise Tier' },
                      ]}
                      value={newPkgTier}
                      onChange={(e) => setNewPkgTier(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      disabled={!newPkgName.trim()}
                      loading={addPackageMutation.isPending}
                      onClick={() => addPackageMutation.mutate()}
                    >
                      Add Package
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                  {serviceDetail?.packages?.map((pkg: any) => (
                    <div key={pkg.id} className="p-3 bg-white border border-slate-200 rounded-xl flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-slate-900 text-sm">{pkg.name}</p>
                          <Badge className="text-xs capitalize">{pkg.tier || 'Standard'}</Badge>
                        </div>
                        <p className="text-sm font-bold text-emerald-600 mt-1">{formatCurrency(pkg.price, 'USD')}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
                        onClick={() => removePackageMutation.mutate(pkg.id)}
                      />
                    </div>
                  ))}
                  {!serviceDetail?.packages?.length && (
                    <p className="col-span-full text-xs text-slate-400 py-4 text-center">No packages configured yet.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* ─── EDIT CATEGORY MODAL ─── */}
      {editCategory && (
        <Modal
          open={!!editCategory}
          onClose={() => setEditCategory(null)}
          title={`Edit Category: ${editCategory.name}`}
          footer={
            <>
              <Button variant="outline" onClick={() => setEditCategory(null)}>
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
              value={editCategory.name || ''}
              onChange={(e) => setEditCategory({ ...editCategory, name: e.target.value })}
            />
            <Input
              label="Color (Hex or Tailwind)"
              value={editCategory.color || ''}
              onChange={(e) => setEditCategory({ ...editCategory, color: e.target.value })}
            />
            <Textarea
              label="Description"
              value={editCategory.description || ''}
              onChange={(e) => setEditCategory({ ...editCategory, description: e.target.value })}
              rows={3}
            />
          </div>
        </Modal>
      )}

      {/* ─── EDIT INDUSTRY MODAL ─── */}
      {editIndustry && (
        <Modal
          open={!!editIndustry}
          onClose={() => setEditIndustry(null)}
          title={`Edit Industry: ${editIndustry.name}`}
          footer={
            <>
              <Button variant="outline" onClick={() => setEditIndustry(null)}>
                Cancel
              </Button>
              <Button loading={updateIndustryMutation.isPending} onClick={() => updateIndustryMutation.mutate()}>
                Save
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <Input
              label="Name *"
              value={editIndustry.name || ''}
              onChange={(e) => setEditIndustry({ ...editIndustry, name: e.target.value })}
            />
            <Textarea
              label="Description"
              value={editIndustry.description || ''}
              onChange={(e) => setEditIndustry({ ...editIndustry, description: e.target.value })}
              rows={3}
            />
          </div>
        </Modal>
      )}

      {/* ─── EDIT SOLUTION MODAL ─── */}
      {editSolution && (
        <Modal
          open={!!editSolution}
          onClose={() => setEditSolution(null)}
          title={`Edit Solution: ${editSolution.name}`}
          footer={
            <>
              <Button variant="outline" onClick={() => setEditSolution(null)}>
                Cancel
              </Button>
              <Button loading={updateSolutionMutation.isPending} onClick={() => updateSolutionMutation.mutate()}>
                Save
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <Input
              label="Name *"
              value={editSolution.name || ''}
              onChange={(e) => setEditSolution({ ...editSolution, name: e.target.value })}
            />
            <Input
              label="Tagline"
              value={editSolution.tagline || ''}
              onChange={(e) => setEditSolution({ ...editSolution, tagline: e.target.value })}
            />
            <Textarea
              label="Description"
              value={editSolution.description || ''}
              onChange={(e) => setEditSolution({ ...editSolution, description: e.target.value })}
              rows={3}
            />
          </div>
        </Modal>
      )}

      {/* Confirmation Dialogs */}
      <ConfirmDialog
        open={!!deletingService}
        onClose={() => setDeletingService(null)}
        onConfirm={() => {
          const id = deletingService.id;
          setDeletingService(null);
          setSelectedService(null);
          deleteServiceMutation.mutate(id);
        }}
        title="Delete Service"
        description={
          <>
            Are you sure you want to permanently delete service{' '}
            <strong>&quot;{deletingService?.title || deletingService?.name}&quot;</strong>? This will remove its associated packages and features.
          </>
        }
        loading={deleteServiceMutation.isPending}
      />

      <ConfirmDialog
        open={!!deletingCategory}
        onClose={() => setDeletingCategory(null)}
        onConfirm={() => {
          const id = deletingCategory.id;
          setDeletingCategory(null);
          deleteCategoryMutation.mutate(id);
        }}
        title="Deactivate Category"
        description={
          <>
            Deactivate category <strong>&quot;{deletingCategory?.name}&quot;</strong>? Services belonging to this category will become uncategorized.
          </>
        }
        loading={deleteCategoryMutation.isPending}
      />

      <ConfirmDialog
        open={!!deletingIndustry}
        onClose={() => setDeletingIndustry(null)}
        onConfirm={() => {
          const id = deletingIndustry.id;
          setDeletingIndustry(null);
          deleteIndustryMutation.mutate(id);
        }}
        title="Delete Industry"
        description={
          <>
            Permanently delete industry vertical <strong>&quot;{deletingIndustry?.name}&quot;</strong>?
          </>
        }
        loading={deleteIndustryMutation.isPending}
      />

      <ConfirmDialog
        open={!!deletingSolution}
        onClose={() => setDeletingSolution(null)}
        onConfirm={() => {
          const id = deletingSolution.id;
          setDeletingSolution(null);
          deleteSolutionMutation.mutate(id);
        }}
        title="Deactivate Solution"
        description={
          <>
            Deactivate architecture solution <strong>&quot;{deletingSolution?.name}&quot;</strong>?
          </>
        }
        loading={deleteSolutionMutation.isPending}
      />
    </DashboardLayout>
  );
}
