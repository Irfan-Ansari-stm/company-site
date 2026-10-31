'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/app/(dashboard)/_components/layout/DashboardLayout';
import {
  Card,
  Button,
  Input,
  Select,
  Textarea,
  TabBar,
  Badge,
  Table,
  Tr,
  Td,
  PageLoader,
  Alert,
  Modal,
  ConfirmDialog,
} from '@/components/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { systemApi } from '@/lib/api';
import { formatDate, timeAgo, extractApiError } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Save,
  Plus,
  Trash2,
  Webhook,
  Key,
  Flag,
  Mail,
  Activity,
  Eye,
  EyeOff,
  Copy,
  Check,
  Send,
  ExternalLink,
  Code,
  ShieldAlert,
} from 'lucide-react';

export default function SystemPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState('settings');

  // Modals & Forms
  const [showNewKey, setShowNewKey] = useState(false);
  const [viewingKey, setViewingKey] = useState<any>(null);
  const [deletingKey, setDeletingKey] = useState<any>(null);
  const [keyForm, setKeyForm] = useState({ name: '', permissions: [] as string[], rate_limit: 1000 });
  const [newKey, setNewKey] = useState('');

  const [showNewWebhook, setShowNewWebhook] = useState(false);
  const [viewingWebhook, setViewingWebhook] = useState<any>(null);
  const [deletingWebhook, setDeletingWebhook] = useState<any>(null);
  const [webhookForm, setWebhookForm] = useState({ url: '', events: [] as string[], secret: '' });

  const [settingsForm, setSettingsForm] = useState<Record<string, any>>({});
  const [revealedSecrets, setRevealedSecrets] = useState<Record<string, boolean>>({});

  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [templateForm, setTemplateForm] = useState({ subject: '', html_body: '', text_body: '', is_active: true });
  const [templateTab, setTemplateTab] = useState<'edit' | 'preview'>('edit');

  const [showNewFlag, setShowNewFlag] = useState(false);
  const [deletingFlag, setDeletingFlag] = useState<any>(null);
  const [flagForm, setFlagForm] = useState({ name: '', key: '', description: '', is_enabled: false });

  // ── Queries ───────────────────────────────────────────────
  const { data: settingsData, isLoading: settingsLoading } = useQuery({
    queryKey: ['system-settings'],
    queryFn: () => systemApi.getSettings().then((r) => r.data.data),
    enabled: tab === 'settings',
  });

  const { data: apiKeysData } = useQuery({
    queryKey: ['api-keys'],
    queryFn: () => systemApi.getApiKeys().then((r) => r.data.data),
    enabled: tab === 'api-keys',
  });

  const { data: webhooksData } = useQuery({
    queryKey: ['webhooks'],
    queryFn: () => systemApi.getWebhooks().then((r) => r.data.data),
    enabled: tab === 'webhooks',
  });

  const { data: auditLogsData } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => systemApi.getAuditLogs({ limit: 50 }).then((r) => r.data.data),
    enabled: tab === 'audit',
  });

  const { data: featureFlagsData } = useQuery({
    queryKey: ['feature-flags'],
    queryFn: () => systemApi.getAllFeatureFlags().then((r) => r.data.data),
    enabled: tab === 'flags',
  });

  const { data: emailTemplatesData } = useQuery({
    queryKey: ['email-templates'],
    queryFn: () => systemApi.getEmailTemplates().then((r) => r.data.data),
    enabled: tab === 'emails',
  });

  // ── Mutations ─────────────────────────────────────────────
  const saveSettingsMutation = useMutation({
    mutationFn: () => systemApi.updateSettings(settingsForm),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['system-settings'] });
      toast.success('System settings saved successfully');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const createApiKeyMutation = useMutation({
    mutationFn: () => systemApi.createApiKey(keyForm),
    onSuccess: (data) => {
      setNewKey(data.data.data?.key || '');
      qc.invalidateQueries({ queryKey: ['api-keys'] });
      setShowNewKey(false);
      setKeyForm({ name: '', permissions: [], rate_limit: 1000 });
      toast.success('API key generated successfully');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const deleteApiKeyMutation = useMutation({
    mutationFn: (id: string) => systemApi.deleteApiKey(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['api-keys'] });
      setDeletingKey(null);
      toast.success('API key revoked');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const createWebhookMutation = useMutation({
    mutationFn: () => systemApi.createWebhook(webhookForm),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['webhooks'] });
      setShowNewWebhook(false);
      setWebhookForm({ url: '', events: [], secret: '' });
      toast.success('Webhook registered successfully');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const deleteWebhookMutation = useMutation({
    mutationFn: (id: string) => systemApi.deleteWebhook(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['webhooks'] });
      setDeletingWebhook(null);
      toast.success('Webhook deleted');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const updateTemplateMutation = useMutation({
    mutationFn: () => systemApi.updateEmailTemplate(editingTemplate.id, templateForm),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['email-templates'] });
      setEditingTemplate(null);
      toast.success('Email template updated successfully');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const toggleFlagMutation = useMutation({
    mutationFn: ({ id, is_enabled }: any) => systemApi.updateFeatureFlag(id, { is_enabled }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feature-flags'] });
      toast.success('Feature flag updated');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const createFlagMutation = useMutation({
    mutationFn: () => systemApi.createFeatureFlag(flagForm),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feature-flags'] });
      setShowNewFlag(false);
      setFlagForm({ name: '', key: '', description: '', is_enabled: false });
      toast.success('Feature flag created');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const deleteFlagMutation = useMutation({
    mutationFn: (id: string) => systemApi.deleteFeatureFlag(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feature-flags'] });
      setDeletingFlag(null);
      toast.success('Feature flag removed');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  // Settings parsing
  const settingsList: any[] = Array.isArray(settingsData)
    ? settingsData
    : settingsData && typeof settingsData === 'object'
    ? Object.entries(settingsData).map(([k, v]: [string, any]) => ({
        key: k,
        ...(typeof v === 'object' ? v : { value: v }),
        group: v?.group || (k.includes('smtp') || k.includes('mail') ? 'email' : k.includes('stripe') || k.includes('pay') ? 'billing' : k.includes('jwt') || k.includes('auth') || k.includes('secret') ? 'security' : 'general'),
      }))
    : [];

  const settingsGroups: Record<string, any[]> = {};
  settingsList.forEach((s: any) => {
    const grp = s.group || 'general';
    if (!settingsGroups[grp]) settingsGroups[grp] = [];
    settingsGroups[grp].push(s);
  });

  const isSecretKey = (k: string) =>
    ['password', 'secret', 'token', 'private_key', 'api_key'].some((sk) => k.toLowerCase().includes(sk));

  const openEditTemplate = (t: any) => {
    setEditingTemplate(t);
    setTemplateForm({
      subject: t.subject || '',
      html_body: t.html_body || t.body_html || t.body_text || '',
      text_body: t.text_body || t.body_text || '',
      is_active: t.is_active !== false,
    });
    setTemplateTab('edit');
  };

  return (
    <DashboardLayout title="System Settings" breadcrumbs={[{ label: 'System' }]}>
      <div className="space-y-6 min-w-0">
        <TabBar
          tabs={[
            { id: 'settings', label: 'General Settings' },
            { id: 'api-keys', label: 'API Keys', count: apiKeysData?.length },
            { id: 'webhooks', label: 'Webhooks', count: webhooksData?.length },
            { id: 'emails', label: 'Email Templates', count: emailTemplatesData?.length },
            { id: 'flags', label: 'Feature Flags', count: featureFlagsData?.length },
            { id: 'audit', label: 'Audit Log' },
          ]}
          active={tab}
          onChange={setTab}
        />

        {/* ════════════════════════════════════════════════════════════ */}
        {/* 1. GENERAL SETTINGS                                         */}
        {/* ════════════════════════════════════════════════════════════ */}
        {tab === 'settings' &&
          (settingsLoading ? (
            <PageLoader />
          ) : (
            <div className="space-y-6">
              {Object.entries(settingsGroups).map(([group, settings]) => (
                <Card key={group}>
                  <h3 className="font-semibold text-slate-800 capitalize mb-4 text-base flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                    {group.replace(/_/g, ' ')} Configuration
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {settings.map((s: any) => {
                      const isSecret = isSecretKey(s.key);
                      const isRevealed = !!revealedSecrets[s.key];
                      const val = settingsForm[s.key] ?? s.value ?? '';

                      return (
                        <div key={s.key} className="space-y-1">
                          <label className="block text-sm font-medium text-slate-700">
                            {s.label || s.key.replace(/_/g, ' ')}
                          </label>
                          {s.type === 'boolean' ? (
                            <Select
                              options={[
                                { value: 'true', label: 'Enabled' },
                                { value: 'false', label: 'Disabled' },
                              ]}
                              value={String(settingsForm[s.key] ?? s.value)}
                              onChange={(e) =>
                                setSettingsForm((f) => ({ ...f, [s.key]: e.target.value === 'true' }))
                              }
                            />
                          ) : s.type === 'text' && String(val).length > 80 ? (
                            <Textarea
                              value={val}
                              onChange={(e) =>
                                setSettingsForm((f) => ({ ...f, [s.key]: e.target.value }))
                              }
                              rows={3}
                            />
                          ) : (
                            <div className="relative">
                              <input
                                type={isSecret && !isRevealed ? 'password' : 'text'}
                                value={val}
                                onChange={(e) =>
                                  setSettingsForm((f) => ({ ...f, [s.key]: e.target.value }))
                                }
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                              {isSecret && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setRevealedSecrets((prev) => ({
                                      ...prev,
                                      [s.key]: !prev[s.key],
                                    }))
                                  }
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                                  title={isRevealed ? 'Hide sensitive value' : 'Reveal sensitive value'}
                                >
                                  {isRevealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                              )}
                            </div>
                          )}
                          {s.description && (
                            <p className="text-xs text-slate-500 mt-1">{s.description}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </Card>
              ))}

              <div className="flex justify-end">
                <Button
                  loading={saveSettingsMutation.isPending}
                  icon={<Save className="w-4 h-4" />}
                  onClick={() => saveSettingsMutation.mutate()}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Save Settings
                </Button>
              </div>
            </div>
          ))}

        {/* ════════════════════════════════════════════════════════════ */}
        {/* 2. API KEYS                                                 */}
        {/* ════════════════════════════════════════════════════════════ */}
        {tab === 'api-keys' && (
          <div className="space-y-4">
            {newKey && (
              <Alert type="success">
                <div className="flex items-center justify-between">
                  <div>
                    <strong>New API Key Created:</strong>{' '}
                    <code className="ml-2 bg-green-100 px-2 py-0.5 rounded font-mono text-sm">{newKey}</code>
                    <p className="text-xs mt-1">Copy this secret key now. It will not be displayed again.</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      navigator.clipboard.writeText(newKey);
                      toast.success('Copied to clipboard');
                    }}
                  >
                    Copy Key
                  </Button>
                </div>
              </Alert>
            )}

            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200">
              <p className="text-sm text-slate-600">
                Manage backend REST and GraphQL authorization tokens for external services.
              </p>
              <Button
                size="sm"
                icon={<Plus className="w-4 h-4" />}
                onClick={() => setShowNewKey(true)}
              >
                New API Key
              </Button>
            </div>

            <Card padding={false} className="shadow-xs overflow-hidden">
              <Table headers={['Key Name', 'Prefix', 'Rate Limit', 'Requests', 'Last Used', 'Created', 'Actions']}>
                {apiKeysData?.map((k: any) => (
                  <Tr key={k.id}>
                    <Td className="whitespace-nowrap font-medium text-slate-900">
                      <div className="flex items-center gap-2">
                        <Key className="w-4 h-4 text-slate-400" />
                        <span>{k.name}</span>
                      </div>
                    </Td>
                    <Td className="whitespace-nowrap">
                      <code className="text-xs bg-slate-100 px-2 py-0.5 rounded font-mono">
                        {k.key_prefix}…
                      </code>
                    </Td>
                    <Td className="whitespace-nowrap text-xs text-slate-600">
                      {k.rate_limit ? `${k.rate_limit} req/min` : 'Standard'}
                    </Td>
                    <Td className="whitespace-nowrap text-xs font-semibold text-slate-700">
                      {k.request_count?.toLocaleString() || 0}
                    </Td>
                    <Td className="whitespace-nowrap text-xs text-slate-500">
                      {k.last_used_at ? timeAgo(k.last_used_at) : 'Never'}
                    </Td>
                    <Td className="whitespace-nowrap text-xs text-slate-500">
                      {formatDate(k.created_at)}
                    </Td>
                    <Td className="whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Eye className="w-3.5 h-3.5 text-slate-600" />}
                          onClick={() => setViewingKey(k)}
                          title="View Details"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
                          onClick={() => setDeletingKey(k)}
                          title="Revoke Key"
                        />
                      </div>
                    </Td>
                  </Tr>
                ))}
              </Table>
            </Card>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════ */}
        {/* 3. WEBHOOKS                                                 */}
        {/* ════════════════════════════════════════════════════════════ */}
        {tab === 'webhooks' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200">
              <p className="text-sm text-slate-600">
                Register webhook HTTP callbacks for asynchronous event streaming.
              </p>
              <Button
                size="sm"
                icon={<Plus className="w-4 h-4" />}
                onClick={() => setShowNewWebhook(true)}
              >
                New Webhook
              </Button>
            </div>

            <div className="space-y-3">
              {webhooksData?.map((w: any) => (
                <Card key={w.id} className="!p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 text-blue-600">
                        <Webhook className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-slate-900 text-sm truncate">{w.name || 'Webhook Endpoint'}</p>
                          <Badge variant={w.is_active ? 'success' : 'default'}>
                            {w.is_active ? 'Active' : 'Disabled'}
                          </Badge>
                        </div>
                        <code className="text-xs text-blue-600 block truncate mt-0.5 font-mono">{w.url}</code>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {w.events?.map((ev: string) => (
                            <Badge key={ev} className="text-[10px]">{ev}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Eye className="w-3.5 h-3.5 text-slate-600" />}
                        onClick={() => setViewingWebhook(w)}
                        title="View Webhook Details"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
                        onClick={() => setDeletingWebhook(w)}
                        title="Delete Webhook"
                      />
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>Deliveries: <strong className="text-slate-700">{w.delivery_count || 0}</strong></span>
                    <span>Last triggered: {w.last_triggered_at ? timeAgo(w.last_triggered_at) : 'Never'}</span>
                  </div>
                </Card>
              ))}
              {!webhooksData?.length && (
                <Card className="text-center py-12 text-slate-500">
                  <Webhook className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  <p className="font-medium">No webhooks configured</p>
                  <p className="text-xs text-slate-400 mt-1">Register endpoints to receive platform event payloads.</p>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════ */}
        {/* 4. EMAIL TEMPLATES                                          */}
        {/* ════════════════════════════════════════════════════════════ */}
        {tab === 'emails' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <p className="text-sm text-slate-600">
                System email templates with dynamic template variables and Markdown/HTML support.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {emailTemplatesData?.map((t: any) => (
                <Card
                  key={t.id}
                  className="hover:shadow-md transition-all !p-5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 text-blue-600">
                        <Mail className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-slate-900 text-sm truncate">{t.name}</h4>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{t.subject}</p>
                        <div className="flex items-center gap-1.5 mt-2">
                          <Badge className="text-[10px] capitalize">{t.category || t.event_type || 'General'}</Badge>
                          <Badge variant={t.is_active ? 'success' : 'default'} className="text-[10px]">
                            {t.is_active ? 'Active' : 'Disabled'}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {t.variables?.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {t.variables.slice(0, 3).map((v: string) => (
                          <code key={v} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                            {`{{${v}}}`}
                          </code>
                        ))}
                        {t.variables.length > 3 && (
                          <span className="text-[10px] text-slate-400">+{t.variables.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-4"
                    onClick={() => openEditTemplate(t)}
                  >
                    Edit / Preview Template
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════ */}
        {/* 5. FEATURE FLAGS                                            */}
        {/* ════════════════════════════════════════════════════════════ */}
        {tab === 'flags' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200">
              <p className="text-sm text-slate-600">
                Control runtime feature availability dynamically across platform environments.
              </p>
              <Button
                size="sm"
                icon={<Plus className="w-4 h-4" />}
                onClick={() => setShowNewFlag(true)}
              >
                Create Flag
              </Button>
            </div>

            <div className="space-y-3">
              {featureFlagsData?.map((flag: any) => (
                <Card key={flag.id} className="!p-4 hover:shadow-xs transition-shadow">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0 text-indigo-600">
                        <Flag className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-slate-900 text-sm truncate">{flag.name}</p>
                          {flag.is_system && <Badge>System Core</Badge>}
                        </div>
                        {flag.description && (
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{flag.description}</p>
                        )}
                        <code className="text-xs font-mono text-slate-400 block mt-1">{flag.slug || flag.key}</code>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          toggleFlagMutation.mutate({ id: flag.id, is_enabled: !flag.is_enabled })
                        }
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                          flag.is_enabled ? 'bg-blue-600' : 'bg-slate-200'
                        }`}
                        title={flag.is_enabled ? 'Disable flag' : 'Enable flag'}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                            flag.is_enabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>

                      {!flag.is_system && (
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
                          onClick={() => setDeletingFlag(flag)}
                          title="Delete Feature Flag"
                        />
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════ */}
        {/* 6. AUDIT LOG TAB                                            */}
        {/* ════════════════════════════════════════════════════════════ */}
        {tab === 'audit' && (
          <Card padding={false} className="shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white">
              <h3 className="font-semibold text-slate-800 text-sm">Recent System Events</h3>
              <a href="/dashboard/audit-logs" className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-medium">
                Full Security Audit Trail <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <Table headers={['Action', 'User / Actor', 'Resource', 'Client IP', 'Time']}>
              {auditLogsData?.map((log: any) => (
                <Tr key={log.id}>
                  <Td className="whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-slate-400" />
                      <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded font-mono font-bold text-slate-800">
                        {log.action}
                      </code>
                    </div>
                  </Td>
                  <Td className="whitespace-nowrap">
                    <p className="text-xs font-semibold text-slate-900">{log.user_name || log.actor_name || 'System'}</p>
                    <p className="text-[11px] text-slate-400">{log.user_email || log.actor_email}</p>
                  </Td>
                  <Td className="whitespace-nowrap">
                    <span className="text-xs capitalize text-slate-700">{log.resource_type}</span>
                  </Td>
                  <Td className="whitespace-nowrap font-mono text-xs text-slate-500">
                    {log.ip_address || '127.0.0.1'}
                  </Td>
                  <Td className="whitespace-nowrap text-xs text-slate-500">
                    {timeAgo(log.created_at)}
                  </Td>
                </Tr>
              ))}
            </Table>
          </Card>
        )}
      </div>

      {/* ─── MODAL: CREATE API KEY ─── */}
      <Modal
        open={showNewKey}
        onClose={() => setShowNewKey(false)}
        title="Generate New API Key"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowNewKey(false)}>
              Cancel
            </Button>
            <Button
              loading={createApiKeyMutation.isPending}
              disabled={!keyForm.name.trim()}
              onClick={() => createApiKeyMutation.mutate()}
            >
              Generate Key
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Key Identifier / Name *"
            value={keyForm.name}
            onChange={(e) => setKeyForm({ ...keyForm, name: e.target.value })}
            placeholder="e.g. Production Mobile App Integration"
          />
          <Input
            label="Rate Limit (Requests per minute)"
            type="number"
            value={String(keyForm.rate_limit)}
            onChange={(e) => setKeyForm({ ...keyForm, rate_limit: parseInt(e.target.value, 10) || 1000 })}
          />
        </div>
      </Modal>

      {/* ─── MODAL: VIEW API KEY DETAILS ─── */}
      {viewingKey && (
        <Modal
          open={!!viewingKey}
          onClose={() => setViewingKey(null)}
          title={`API Key: ${viewingKey.name}`}
          footer={<Button onClick={() => setViewingKey(null)}>Close</Button>}
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div>
                <span className="text-slate-400 font-medium block">Key Prefix</span>
                <code className="text-sm font-mono font-bold text-slate-800">{viewingKey.key_prefix}…</code>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                <div>
                  <span className="text-slate-400 block">Total Requests</span>
                  <span className="font-semibold text-slate-800">{viewingKey.request_count || 0}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Rate Limit</span>
                  <span className="font-semibold text-slate-800">{viewingKey.rate_limit || 1000} req/min</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Created At</span>
                  <span className="font-semibold text-slate-800">{formatDate(viewingKey.created_at)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Last Used</span>
                  <span className="font-semibold text-slate-800">{viewingKey.last_used_at ? timeAgo(viewingKey.last_used_at) : 'Never'}</span>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* ─── MODAL: CREATE WEBHOOK ─── */}
      <Modal
        open={showNewWebhook}
        onClose={() => setShowNewWebhook(false)}
        title="Register Webhook Endpoint"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowNewWebhook(false)}>
              Cancel
            </Button>
            <Button
              loading={createWebhookMutation.isPending}
              disabled={!webhookForm.url.trim()}
              onClick={() => createWebhookMutation.mutate()}
            >
              Register Webhook
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Payload URL *"
            type="url"
            value={webhookForm.url}
            onChange={(e) => setWebhookForm({ ...webhookForm, url: e.target.value })}
            placeholder="https://api.yourdomain.com/webhook"
          />
          <Input
            label="Signing Secret (Optional)"
            value={webhookForm.secret}
            onChange={(e) => setWebhookForm({ ...webhookForm, secret: e.target.value })}
            placeholder="HMAC SHA-256 signature secret"
          />
        </div>
      </Modal>

      {/* ─── MODAL: VIEW WEBHOOK DETAILS ─── */}
      {viewingWebhook && (
        <Modal
          open={!!viewingWebhook}
          onClose={() => setViewingWebhook(null)}
          title={`Webhook: ${viewingWebhook.name || 'Endpoint'}`}
          footer={
            <div className="flex justify-between w-full items-center">
              <span className="text-xs text-slate-500 font-mono">ID: {viewingWebhook.id}</span>
              <Button onClick={() => setViewingWebhook(null)}>Close</Button>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div>
                <span className="text-slate-400 font-medium block">Endpoint Target URL</span>
                <code className="text-sm font-mono text-blue-600 break-all">{viewingWebhook.url}</code>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                <div>
                  <span className="text-slate-400 block">Status</span>
                  <Badge variant={viewingWebhook.is_active ? 'success' : 'default'}>
                    {viewingWebhook.is_active ? 'Active' : 'Disabled'}
                  </Badge>
                </div>
                <div>
                  <span className="text-slate-400 block">Deliveries</span>
                  <span className="font-semibold text-slate-800">{viewingWebhook.delivery_count || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* ─── MODAL: EDIT & PREVIEW EMAIL TEMPLATE ─── */}
      {editingTemplate && (
        <Modal
          open={!!editingTemplate}
          onClose={() => setEditingTemplate(null)}
          title={`Email Template: ${editingTemplate.name}`}
          size="xl"
          footer={
            <div className="flex justify-between w-full items-center">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="tpl-active"
                  checked={templateForm.is_active}
                  onChange={(e) => setTemplateForm({ ...templateForm, is_active: e.target.checked })}
                  className="rounded border-slate-300 text-blue-600 w-4 h-4"
                />
                <label htmlFor="tpl-active" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Active in production
                </label>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setEditingTemplate(null)}>
                  Cancel
                </Button>
                <Button
                  loading={updateTemplateMutation.isPending}
                  onClick={() => updateTemplateMutation.mutate()}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="flex gap-2 border-b border-slate-200 pb-2">
              <button
                type="button"
                onClick={() => setTemplateTab('edit')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  templateTab === 'edit' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Template Editor
              </button>
              <button
                type="button"
                onClick={() => setTemplateTab('preview')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  templateTab === 'preview' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                HTML Preview
              </button>
            </div>

            {templateTab === 'edit' ? (
              <div className="space-y-4">
                <Input
                  label="Email Subject Line *"
                  value={templateForm.subject}
                  onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })}
                />

                {editingTemplate.variables?.length > 0 && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                      Available Template Variables
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {editingTemplate.variables.map((v: string) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => {
                            setTemplateForm((prev) => ({
                              ...prev,
                              html_body: prev.html_body + ` {{${v}}}`,
                            }));
                            toast.success(`Inserted {{${v}}}`);
                          }}
                          className="text-xs font-mono bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded hover:bg-blue-100 transition"
                        >
                          {`{{${v}}}`}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <Textarea
                  label="HTML & Markdown Email Body *"
                  rows={10}
                  value={templateForm.html_body}
                  onChange={(e) => setTemplateForm({ ...templateForm, html_body: e.target.value })}
                />
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 min-h-[300px]">
                <h4 className="text-sm font-bold text-slate-900 mb-2 border-b border-slate-200 pb-2">
                  Subject: {templateForm.subject}
                </h4>
                <div className="bg-white p-4 rounded-lg border border-slate-200 text-sm whitespace-pre-wrap leading-relaxed text-slate-800">
                  {templateForm.html_body}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* ─── MODAL: CREATE FEATURE FLAG ─── */}
      <Modal
        open={showNewFlag}
        onClose={() => setShowNewFlag(false)}
        title="Create Feature Flag"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowNewFlag(false)}>
              Cancel
            </Button>
            <Button
              loading={createFlagMutation.isPending}
              disabled={!flagForm.name.trim() || !flagForm.key.trim()}
              onClick={() => createFlagMutation.mutate()}
            >
              Create Flag
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Flag Name *"
            value={flagForm.name}
            onChange={(e) => setFlagForm({ ...flagForm, name: e.target.value })}
            placeholder="e.g. AI Workflow Automation"
          />
          <Input
            label="Flag Key / Slug *"
            value={flagForm.key}
            onChange={(e) => setFlagForm({ ...flagForm, key: e.target.value })}
            placeholder="e.g. ai_workflow_automation"
          />
          <Textarea
            label="Description"
            rows={3}
            value={flagForm.description}
            onChange={(e) => setFlagForm({ ...flagForm, description: e.target.value })}
            placeholder="Explain what this feature flag gates"
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="flag-enable"
              checked={flagForm.is_enabled}
              onChange={(e) => setFlagForm({ ...flagForm, is_enabled: e.target.checked })}
              className="rounded border-slate-300 text-blue-600 w-4 h-4"
            />
            <label htmlFor="flag-enable" className="text-sm font-medium text-slate-700 cursor-pointer">
              Enable immediately
            </label>
          </div>
        </div>
      </Modal>

      {/* ─── CONFIRMATION DIALOGS ─── */}
      <ConfirmDialog
        open={!!deletingKey}
        onClose={() => setDeletingKey(null)}
        onConfirm={() => {
          const id = deletingKey.id;
          setDeletingKey(null);
          deleteApiKeyMutation.mutate(id);
        }}
        title="Revoke API Key"
        description={
          <>
            Are you sure you want to revoke API key <strong>&quot;{deletingKey?.name}&quot;</strong>? Any application or script using this key will immediately lose access.
          </>
        }
        confirmText="Revoke Key"
        loading={deleteApiKeyMutation.isPending}
      />

      <ConfirmDialog
        open={!!deletingWebhook}
        onClose={() => setDeletingWebhook(null)}
        onConfirm={() => {
          const id = deletingWebhook.id;
          setDeletingWebhook(null);
          deleteWebhookMutation.mutate(id);
        }}
        title="Delete Webhook"
        description={
          <>
            Are you sure you want to delete webhook for <strong>&quot;{deletingWebhook?.url}&quot;</strong>?
          </>
        }
        loading={deleteWebhookMutation.isPending}
      />

      <ConfirmDialog
        open={!!deletingFlag}
        onClose={() => setDeletingFlag(null)}
        onConfirm={() => {
          const id = deletingFlag.id;
          setDeletingFlag(null);
          deleteFlagMutation.mutate(id);
        }}
        title="Delete Feature Flag"
        description={
          <>
            Are you sure you want to permanently delete custom feature flag <strong>&quot;{deletingFlag?.name}&quot;</strong>?
          </>
        }
        loading={deleteFlagMutation.isPending}
      />
    </DashboardLayout>
  );
}