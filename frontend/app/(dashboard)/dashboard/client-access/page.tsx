'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/app/(dashboard)/_components/layout/DashboardLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Card, Button, Badge, PageLoader, StatCard } from '@/components/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { systemApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { extractApiError } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Sliders, Save, Eye, EyeOff, CheckCircle, XCircle, LayoutDashboard,
  FolderKanban, DollarSign, HeadphonesIcon, Briefcase, Bot, Shield,
  Check, Lock, Activity, RefreshCw
} from 'lucide-react';

const ICON_MAP: Record<string, any> = {
  LayoutDashboard,
  FolderKanban,
  DollarSign,
  HeadphonesIcon,
  Briefcase,
  Bot,
  Shield,
};

export default function ClientDashboardAccessPage() {
  const qc = useQueryClient();
  const { isClientPreview, setClientPreview } = useAuthStore();
  const [modulesState, setModulesState] = useState<any[]>([]);

  // Fetch all modules
  const { data: rawModules = [], isLoading } = useQuery({
    queryKey: ['client-modules-list'],
    queryFn: () => systemApi.getClientModules().then((r) => r.data.data),
  });

  useEffect(() => {
    if (rawModules && rawModules.length > 0) {
      setModulesState(JSON.parse(JSON.stringify(rawModules)));
    }
  }, [rawModules]);

  // Bulk save mutation
  const saveMutation = useMutation({
    mutationFn: (modules: any[]) => systemApi.saveBulkClientModules(modules),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['client-modules-list'] });
      toast.success('Client dashboard configuration saved successfully');
    },
    onError: (err: any) => toast.error(extractApiError(err)),
  });

  // Toggle module enabled/disabled for Client
  const handleToggleModule = (key: string) => {
    setModulesState((prev) =>
      prev.map((m) => (m.key === key ? { ...m, is_client_enabled: !m.is_client_enabled } : m))
    );
  };

  // Toggle individual widget inside module
  const handleToggleWidget = (moduleKey: string, widgetKey: string) => {
    setModulesState((prev) =>
      prev.map((m) => {
        if (m.key !== moduleKey) return m;
        const widgets = (m.widgets || []).map((w: any) =>
          w.key === widgetKey ? { ...w, enabled: !w.enabled } : w
        );
        return { ...m, widgets };
      })
    );
  };

  // Toggle action permission
  const handleToggleAction = (moduleKey: string, actionName: string) => {
    setModulesState((prev) =>
      prev.map((m) => {
        if (m.key !== moduleKey) return m;
        const currentActions: string[] = m.actions || [];
        const actions = currentActions.includes(actionName)
          ? currentActions.filter((a) => a !== actionName)
          : [...currentActions, actionName];
        return { ...m, actions };
      })
    );
  };

  const enabledCount = modulesState.filter((m) => m.is_client_enabled).length;
  const totalCount = modulesState.length;

  if (isLoading) {
    return (
      <DashboardLayout title="Client Access Control">
        <PageLoader />
      </DashboardLayout>
    );
  }

  return (
    <ProtectedRoute requireSuperAdmin>
      <DashboardLayout
        title="Client Dashboard Access Control"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Client Access' }]}
      >
        <div className="space-y-6">
          {/* Header Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 to-blue-950 p-6 rounded-2xl text-white shadow-xl">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sliders className="w-6 h-6 text-blue-400" />
                <h1 className="text-xl font-bold">Client Dashboard Access Control</h1>
              </div>
              <p className="text-slate-300 text-sm max-w-2xl">
                Configure exactly what registered Clients can see and do upon logging into their portal.
                Enable or disable entire modules, individual widgets, and authorized action buttons.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {/* Preview Button */}
              <Button
                variant={isClientPreview ? 'outline' : 'secondary'}
                icon={isClientPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                onClick={() => setClientPreview(!isClientPreview)}
                className={isClientPreview ? 'bg-amber-400 text-slate-900 border-none' : ''}
              >
                {isClientPreview ? 'Exit Client Preview' : 'Preview as Client'}
              </Button>

              {/* Save Button */}
              <Button
                icon={<Save className="w-4 h-4" />}
                onClick={() => saveMutation.mutate(modulesState)}
                loading={saveMutation.isPending}
                className="bg-blue-600 hover:bg-blue-500 shadow-md"
              >
                Save Configuration
              </Button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              title="Active Client Modules"
              value={`${enabledCount} / ${totalCount}`}
              subtitle="Accessible by Clients"
              icon={<Activity className="w-5 h-5" />}
              color="blue"
            />
            <StatCard
              title="Default Role"
              value="Client"
              subtitle="Enforced on all registrations"
              icon={<Shield className="w-5 h-5" />}
              color="green"
            />
            <StatCard
              title="Preview Simulation"
              value={isClientPreview ? 'Active' : 'Disabled'}
              subtitle={isClientPreview ? 'Navigating as Client' : 'Super Admin Mode'}
              icon={<Eye className="w-5 h-5" />}
              color={isClientPreview ? 'orange' : 'purple'}
            />
          </div>

          {/* Modules List */}
          <div className="space-y-4">
            {modulesState.map((mod) => {
              const Icon = ICON_MAP[mod.icon] || LayoutDashboard;
              const isEnabled = mod.is_client_enabled;

              return (
                <div
                  key={mod.key}
                  className={`rounded-2xl border transition-all duration-200 overflow-hidden bg-white shadow-xs ${
                    isEnabled
                      ? 'border-blue-200/80 ring-1 ring-blue-500/10'
                      : 'border-slate-200 opacity-80'
                  }`}
                >
                  {/* Module Header */}
                  <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100">
                    <div className="flex items-start gap-3.5">
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                          isEnabled
                            ? 'bg-blue-50 text-blue-600'
                            : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2.5">
                          <h3 className="font-bold text-slate-900 text-base">{mod.name}</h3>
                          <Badge variant={isEnabled ? 'success' : 'default'} className="text-xs">
                            {isEnabled ? 'Client Enabled' : 'Disabled for Client'}
                          </Badge>
                          {!mod.is_client_available && (
                            <Badge variant="warning" className="text-[10px]">
                              Admin Exclusive
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{mod.description}</p>
                      </div>
                    </div>

                    {/* Enable/Disable Toggle */}
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleToggleModule(mod.key)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          isEnabled ? 'bg-blue-600' : 'bg-slate-300'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            isEnabled ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Sub-Components & Widgets configuration */}
                  {isEnabled && (
                    <div className="p-5 bg-slate-50/50 space-y-4">
                      {/* Widgets Visibility */}
                      {mod.widgets && mod.widgets.length > 0 && (
                        <div>
                          <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                            Component & Widget Visibility
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                            {mod.widgets.map((w: any) => (
                              <label
                                key={w.key}
                                onClick={() => handleToggleWidget(mod.key, w.key)}
                                className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs font-medium cursor-pointer transition select-none ${
                                  w.enabled
                                    ? 'bg-white border-blue-200 text-slate-900 shadow-xs'
                                    : 'bg-slate-100/60 border-slate-200 text-slate-400 line-through'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={w.enabled}
                                  onChange={() => {}}
                                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="truncate">{w.name}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Permitted Actions */}
                      {mod.actions && mod.actions.length > 0 && (
                        <div>
                          <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                            Authorized Client Actions
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {['view', 'create', 'update', 'delete', 'download', 'pay', 'reply', 'close', 'request', 'export'].map(
                              (act) => {
                                const isPermitted = mod.actions.includes(act);
                                return (
                                  <button
                                    key={act}
                                    type="button"
                                    onClick={() => handleToggleAction(mod.key, act)}
                                    className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition flex items-center gap-1.5 ${
                                      isPermitted
                                        ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                        : 'bg-slate-200 text-slate-600 border border-slate-300'
                                    }`}
                                  >
                                    {isPermitted ? <Check className="w-3 h-3" /> : null}
                                    {act}
                                  </button>
                                );
                              }
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Sticky Bottom Actions */}
          <div className="sticky bottom-4 bg-white/95 backdrop-blur p-4 rounded-2xl border border-slate-200 shadow-xl flex items-center justify-between">
            <div className="text-xs text-slate-600">
              <span className="font-semibold text-slate-900">{enabledCount} modules</span> enabled for clients.
              Changes update immediately on all client dashboards without deploying code.
            </div>
            <Button
              icon={<Save className="w-4 h-4" />}
              onClick={() => saveMutation.mutate(modulesState)}
              loading={saveMutation.isPending}
            >
              Save Configuration
            </Button>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
