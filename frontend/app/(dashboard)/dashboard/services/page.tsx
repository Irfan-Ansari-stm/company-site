'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/app/(dashboard)/_components/layout/DashboardLayout';
import { Card, Button, Table, Tr, Td, StatusBadge, Pagination, Modal, Input, Select, Textarea, TabBar, Badge } from '@/components/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { servicesApi } from '@/lib/api';
import { formatCurrency, extractApiError } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Plus, Eye, Trash2, Briefcase, Star, DollarSign } from 'lucide-react';
import Link from 'next/link';

export default function ServicesPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState('services');
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [createTarget, setCreateTarget] = useState<'service' | 'category' | 'industry' | 'solution'>('service');
  const [form, setForm] = useState<any>({});

  const { data: servicesData, isLoading } = useQuery({
    queryKey: ['services', { page }],
    queryFn: () => servicesApi.getServices({ page, limit: 20 }).then(r => r.data),
    enabled: tab === 'services',
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['service-categories'],
    queryFn: () => servicesApi.getCategories().then(r => r.data.data),
  });

  const { data: industriesData } = useQuery({
    queryKey: ['industries'],
    queryFn: () => servicesApi.getIndustries().then(r => r.data.data),
    enabled: tab === 'industries',
  });

  const { data: solutionsData } = useQuery({
    queryKey: ['solutions'],
    queryFn: () => servicesApi.getSolutions().then(r => r.data.data),
    enabled: tab === 'solutions',
  });

  const createServiceMutation = useMutation({
    mutationFn: () => servicesApi.createService(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['services'] }); setShowCreate(false); toast.success('Service created'); },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const createCategoryMutation = useMutation({
    mutationFn: () => servicesApi.createCategory(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['service-categories'] }); setShowCreate(false); toast.success('Category created'); },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const createIndustryMutation = useMutation({
    mutationFn: () => servicesApi.createIndustry(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['industries'] }); setShowCreate(false); toast.success('Industry created'); },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const createSolutionMutation = useMutation({
    mutationFn: () => servicesApi.createSolution(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['solutions'] }); setShowCreate(false); toast.success('Solution created'); },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const deleteServiceMutation = useMutation({
    mutationFn: (id: string) => servicesApi.deleteService(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['services'] }); toast.success('Service deleted'); },
  });

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const openCreate = (target: typeof createTarget) => {
    setCreateTarget(target);
    setForm({});
    setShowCreate(true);
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
      <div className="space-y-6">
        <TabBar
          tabs={[
            { id: 'services', label: 'Services', count: servicesData?.total },
            { id: 'categories', label: 'Categories', count: categoriesData?.length },
            { id: 'industries', label: 'Industries', count: industriesData?.length },
            { id: 'solutions', label: 'Solutions', count: solutionsData?.length },
          ]}
          active={tab}
          onChange={setTab}
        />

        {/* SERVICES */}
        {tab === 'services' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => openCreate('service')}>New Service</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((s: any) => (
                <div key={s.id} className="bg-white rounded-2xl border border-slate-200 hover:shadow-lg transition-all overflow-hidden">
                  {s.icon_url && (
                    <div className="h-32 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                      <img src={s.icon_url} alt="" className="h-16 object-contain" />
                    </div>
                  )}
                  {!s.icon_url && (
                    <div className="h-32 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center text-4xl">
                      <Briefcase className="w-12 h-12 text-blue-300" />
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-slate-900">{s.name}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">{s.category_name}</p>
                      </div>
                      <div className="flex gap-1">
                        {s.is_featured && <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />}
                        <StatusBadge status={s.status || 'active'} />
                      </div>
                    </div>
                    {s.short_description && (
                      <p className="text-sm text-slate-500 line-clamp-2">{s.short_description}</p>
                    )}
                    {/* Pricing */}
                    {s.base_price && (
                      <div className="flex items-center gap-1 mt-3 text-green-700 font-semibold">
                        <DollarSign className="w-4 h-4" />
                        <span>{formatCurrency(s.base_price, s.currency)}</span>
                        <span className="text-xs text-slate-400 font-normal">/ {s.pricing_type?.replace(/_/g, ' ')}</span>
                      </div>
                    )}
                    {/* Features */}
                    {s.features?.length > 0 && (
                      <div className="mt-3 space-y-1">
                        {s.features.slice(0, 3).map((f: any) => (
                          <div key={f.id} className="flex items-center gap-2 text-xs text-slate-600">
                            <span className="text-green-500">✓</span>
                            {f.name}
                          </div>
                        ))}
                        {s.features.length > 3 && (
                          <p className="text-xs text-slate-400">+{s.features.length - 3} more features</p>
                        )}
                      </div>
                    )}
                    <div className="flex gap-2 mt-4">
                      <Link href={`/dashboard/services/${s.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">Manage</Button>
                      </Link>
                      <Button variant="ghost" size="sm" icon={<Trash2 className="w-3.5 h-3.5 text-red-500" />}
                        onClick={() => confirm('Delete service?') && deleteServiceMutation.mutate(s.id)} />
                    </div>
                  </div>
                </div>
              ))}
              {!services.length && !isLoading && (
                <div className="col-span-full text-center py-16 text-slate-500">
                  <Briefcase className="w-12 h-12 mx-auto mb-3 text-slate-200" />
                  <p className="font-medium">No services yet</p>
                </div>
              )}
            </div>
            <Pagination page={page} totalPages={Math.ceil((servicesData?.total || 0) / 20)} onPageChange={setPage} total={servicesData?.total} limit={20} />
          </div>
        )}

        {/* CATEGORIES */}
        {tab === 'categories' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => openCreate('category')}>New Category</Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {categoriesData?.map((cat: any) => (
                <Card key={cat.id} className="!p-4 hover:shadow-md transition-all">
                  <div className="flex items-center gap-3">
                    {cat.icon && <span className="text-2xl">{cat.icon}</span>}
                    {cat.color && <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 truncate">{cat.name}</p>
                      <p className="text-xs text-slate-400">{cat.service_count || 0} services</p>
                    </div>
                  </div>
                  {cat.description && <p className="text-xs text-slate-500 mt-2">{cat.description}</p>}
                </Card>
              ))}
              {!categoriesData?.length && <p className="col-span-full text-center text-slate-500 py-8">No categories</p>}
            </div>
          </div>
        )}

        {/* INDUSTRIES */}
        {tab === 'industries' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => openCreate('industry')}>New Industry</Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {industriesData?.map((ind: any) => (
                <Card key={ind.id} className="!p-4 hover:shadow-md transition-all">
                  <h3 className="font-semibold text-slate-900">{ind.name}</h3>
                  {ind.description && <p className="text-sm text-slate-500 mt-1">{ind.description}</p>}
                  {ind.services?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {ind.services.slice(0, 3).map((s: any) => (
                        <Badge key={s} className="text-xs">{s}</Badge>
                      ))}
                    </div>
                  )}
                </Card>
              ))}
              {!industriesData?.length && <p className="col-span-full text-center text-slate-500 py-8">No industries</p>}
            </div>
          </div>
        )}

        {/* SOLUTIONS */}
        {tab === 'solutions' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => openCreate('solution')}>New Solution</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {solutionsData?.map((sol: any) => (
                <Card key={sol.id} className="!p-4 hover:shadow-md transition-all">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <Briefcase className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-900">{sol.name}</h3>
                        {sol.is_featured && <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />}
                      </div>
                      {sol.tagline && <p className="text-sm text-blue-600 mt-0.5">{sol.tagline}</p>}
                      {sol.description && <p className="text-sm text-slate-500 mt-1 line-clamp-2">{sol.description}</p>}
                      {sol.target_industries?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {sol.target_industries.map((ind: string) => (
                            <Badge key={ind} className="text-xs capitalize">{ind}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
              {!solutionsData?.length && <p className="col-span-full text-center text-slate-500 py-8">No solutions defined</p>}
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title={createTarget === 'service' ? 'New Service' : createTarget === 'category' ? 'New Category' : createTarget === 'industry' ? 'New Industry' : 'New Solution'}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button loading={getCreateMutation().isPending} onClick={() => getCreateMutation().mutate()}>Create</Button>
          </>
        }
      >
        {createTarget === 'service' && (
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Input label="Service Name *" value={form.name || ''} onChange={e => set('name', e.target.value)} />
            </div>
            <Select label="Category" options={categoriesData?.map((c: any) => ({ value: c.id, label: c.name })) || []} value={form.category_id || ''} onChange={e => set('category_id', e.target.value)} placeholder="Select category" />
            <Select label="Pricing Type" options={PRICING_TYPES} value={form.pricing_type || 'fixed'} onChange={e => set('pricing_type', e.target.value)} />
            <Input label="Base Price" type="number" value={form.base_price || ''} onChange={e => set('base_price', e.target.value)} />
            <Select label="Currency" options={[{ value: 'USD', label: 'USD' }, { value: 'EUR', label: 'EUR' }]} value={form.currency || 'USD'} onChange={e => set('currency', e.target.value)} />
            <div className="col-span-2">
              <Input label="Short Description" value={form.short_description || ''} onChange={e => set('short_description', e.target.value)} />
            </div>
            <div className="col-span-2">
              <Textarea label="Description" value={form.description || ''} onChange={e => set('description', e.target.value)} rows={3} />
            </div>
          </div>
        )}
        {(createTarget === 'category' || createTarget === 'industry') && (
          <div className="space-y-4">
            <Input label="Name *" value={form.name || ''} onChange={e => set('name', e.target.value)} />
            <Textarea label="Description" value={form.description || ''} onChange={e => set('description', e.target.value)} rows={3} />
          </div>
        )}
        {createTarget === 'solution' && (
          <div className="space-y-4">
            <Input label="Solution Name *" value={form.name || ''} onChange={e => set('name', e.target.value)} />
            <Input label="Tagline" value={form.tagline || ''} onChange={e => set('tagline', e.target.value)} />
            <Textarea label="Description" value={form.description || ''} onChange={e => set('description', e.target.value)} rows={3} />
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
