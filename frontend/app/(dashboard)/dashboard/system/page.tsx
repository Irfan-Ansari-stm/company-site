'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/app/(dashboard)/_components/layout/DashboardLayout';
import { Card, Button, Input, Select, Textarea, TabBar, Badge, Table, Tr, Td, PageLoader, Alert } from '@/components/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { systemApi } from '@/lib/api';
import { formatDate, timeAgo, extractApiError } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Save, Plus, Trash2, Webhook, Key, Flag, Mail, FileText, Activity } from 'lucide-react';

export default function SystemPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState('settings');
  const [showNewKey, setShowNewKey] = useState(false);
  const [showNewWebhook, setShowNewWebhook] = useState(false);
  const [keyForm, setKeyForm] = useState({ name: '', permissions: [] as string[], rate_limit: 1000 });
  const [webhookForm, setWebhookForm] = useState({ url: '', events: [] as string[], secret: '' });
  const [settingsForm, setSettingsForm] = useState<Record<string, any>>({});
  const [newKey, setNewKey] = useState('');

  const { data: settingsData, isLoading: settingsLoading } = useQuery({
    queryKey: ['system-settings'],
    queryFn: () => systemApi.getSettings().then(r => r.data.data),
    enabled: tab === 'settings',
  });

  const { data: apiKeysData } = useQuery({
    queryKey: ['api-keys'],
    queryFn: () => systemApi.getApiKeys().then(r => r.data.data),
    enabled: tab === 'api-keys',
  });

  const { data: webhooksData } = useQuery({
    queryKey: ['webhooks'],
    queryFn: () => systemApi.getWebhooks().then(r => r.data.data),
    enabled: tab === 'webhooks',
  });

  const { data: auditLogsData } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => systemApi.getAuditLogs({ limit: 50 }).then(r => r.data.data),
    enabled: tab === 'audit',
  });

  const { data: featureFlagsData } = useQuery({
    queryKey: ['feature-flags'],
    queryFn: () => systemApi.getAllFeatureFlags().then(r => r.data.data),
    enabled: tab === 'flags',
  });

  const { data: emailTemplatesData } = useQuery({
    queryKey: ['email-templates'],
    queryFn: () => systemApi.getEmailTemplates().then(r => r.data.data),
    enabled: tab === 'emails',
  });

  const saveSettingsMutation = useMutation({
    mutationFn: () => systemApi.updateSettings(settingsForm),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['system-settings'] }); toast.success('Settings saved'); },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const createApiKeyMutation = useMutation({
    mutationFn: () => systemApi.createApiKey(keyForm),
    onSuccess: (data) => {
      setNewKey(data.data.data?.key || '');
      qc.invalidateQueries({ queryKey: ['api-keys'] });
      setShowNewKey(false);
      toast.success('API key created');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const deleteApiKeyMutation = useMutation({
    mutationFn: (id: string) => systemApi.deleteApiKey(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['api-keys'] }); toast.success('API key deleted'); },
  });

  const createWebhookMutation = useMutation({
    mutationFn: () => systemApi.createWebhook(webhookForm),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['webhooks'] }); setShowNewWebhook(false); toast.success('Webhook created'); },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const toggleFlagMutation = useMutation({
    mutationFn: ({ id, is_enabled }: any) => systemApi.updateFeatureFlag(id, { is_enabled }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['feature-flags'] }); },
  });

  // Flatten settings into groups
  const settingsGroups: Record<string, any[]> = {};
  settingsData?.forEach((s: any) => {
    if (!settingsGroups[s.group]) settingsGroups[s.group] = [];
    settingsGroups[s.group].push(s);
  });

  return (
    <DashboardLayout title="System Settings" breadcrumbs={[{ label: 'System' }]}>
      <div className="space-y-6">
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

        {/* SETTINGS */}
        {tab === 'settings' && (
          settingsLoading ? <PageLoader /> : (
            <div className="space-y-6">
              {Object.entries(settingsGroups).map(([group, settings]) => (
                <Card key={group}>
                  <h3 className="font-semibold text-slate-800 capitalize mb-4">{group.replace(/_/g, ' ')}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {settings.map((s: any) => (
                      <div key={s.key}>
                        <label className="block text-sm font-medium text-slate-700 mb-1">{s.label || s.key}</label>
                        {s.type === 'boolean' ? (
                          <Select
                            options={[{ value: 'true', label: 'Enabled' }, { value: 'false', label: 'Disabled' }]}
                            value={String(settingsForm[s.key] ?? s.value)}
                            onChange={e => setSettingsForm(f => ({ ...f, [s.key]: e.target.value === 'true' }))}
                          />
                        ) : s.type === 'text' && (s.value?.length > 100) ? (
                          <Textarea
                            value={settingsForm[s.key] ?? s.value ?? ''}
                            onChange={e => setSettingsForm(f => ({ ...f, [s.key]: e.target.value }))}
                            rows={3}
                          />
                        ) : (
                          <Input
                            type={s.type === 'number' ? 'number' : s.type === 'email' ? 'email' : 'text'}
                            value={settingsForm[s.key] ?? s.value ?? ''}
                            onChange={e => setSettingsForm(f => ({ ...f, [s.key]: e.target.value }))}
                          />
                        )}
                        {s.description && <p className="text-xs text-slate-500 mt-1">{s.description}</p>}
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
              <div className="flex justify-end">
                <Button loading={saveSettingsMutation.isPending} icon={<Save className="w-4 h-4" />} onClick={() => saveSettingsMutation.mutate()}>
                  Save Settings
                </Button>
              </div>
            </div>
          )
        )}

        {/* API KEYS */}
        {tab === 'api-keys' && (
          <div className="space-y-4">
            {newKey && (
              <Alert type="success">
                <strong>New API Key:</strong> <code className="ml-2 bg-green-100 px-2 py-0.5 rounded font-mono text-sm">{newKey}</code>
                <p className="text-xs mt-1">Copy this key now — it won't be shown again.</p>
                <Button size="sm" variant="ghost" className="mt-2" onClick={() => { navigator.clipboard.writeText(newKey); toast.success('Copied!'); }}>Copy</Button>
              </Alert>
            )}
            <div className="flex justify-end">
              <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setShowNewKey(!showNewKey)}>New API Key</Button>
            </div>
            {showNewKey && (
              <Card>
                <h3 className="font-semibold text-slate-800 mb-4">Create API Key</h3>
                <div className="space-y-3">
                  <Input label="Key Name *" value={keyForm.name} onChange={e => setKeyForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Production Integration" />
                  <Input label="Rate Limit (req/min)" type="number" value={String(keyForm.rate_limit)} onChange={e => setKeyForm(f => ({ ...f, rate_limit: parseInt(e.target.value) }))} />
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => setShowNewKey(false)}>Cancel</Button>
                    <Button size="sm" loading={createApiKeyMutation.isPending} onClick={() => createApiKeyMutation.mutate()}>Generate Key</Button>
                  </div>
                </div>
              </Card>
            )}
            <Card padding={false}>
              <Table headers={['Name', 'Key Prefix', 'Requests', 'Last Used', 'Created', '']}>
                {apiKeysData?.map((k: any) => (
                  <Tr key={k.id}>
                    <Td>
                      <div className="flex items-center gap-2">
                        <Key className="w-4 h-4 text-slate-400" />
                        <p className="font-medium text-slate-900">{k.name}</p>
                      </div>
                    </Td>
                    <Td><code className="text-xs bg-slate-100 px-2 py-0.5 rounded">{k.key_prefix}…</code></Td>
                    <Td>{k.request_count?.toLocaleString() || 0}</Td>
                    <Td>{k.last_used_at ? timeAgo(k.last_used_at) : 'Never'}</Td>
                    <Td>{formatDate(k.created_at)}</Td>
                    <Td>
                      <Button variant="ghost" size="sm" icon={<Trash2 className="w-3.5 h-3.5 text-red-500" />}
                        onClick={() => confirm('Revoke this API key?') && deleteApiKeyMutation.mutate(k.id)} />
                    </Td>
                  </Tr>
                ))}
              </Table>
            </Card>
          </div>
        )}

        {/* WEBHOOKS */}
        {tab === 'webhooks' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setShowNewWebhook(!showNewWebhook)}>New Webhook</Button>
            </div>
            {showNewWebhook && (
              <Card>
                <h3 className="font-semibold text-slate-800 mb-4">Create Webhook</h3>
                <div className="space-y-3">
                  <Input label="URL *" type="url" value={webhookForm.url} onChange={e => setWebhookForm(f => ({ ...f, url: e.target.value }))} placeholder="https://your-server.com/webhook" />
                  <Input label="Secret (optional)" value={webhookForm.secret} onChange={e => setWebhookForm(f => ({ ...f, secret: e.target.value }))} placeholder="Signing secret" />
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => setShowNewWebhook(false)}>Cancel</Button>
                    <Button size="sm" loading={createWebhookMutation.isPending} onClick={() => createWebhookMutation.mutate()}>Create</Button>
                  </div>
                </div>
              </Card>
            )}
            <div className="space-y-3">
              {webhooksData?.map((w: any) => (
                <Card key={w.id} className="!p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <Webhook className="w-5 h-5 text-slate-400 mt-0.5" />
                      <div>
                        <p className="font-medium text-slate-900">{w.name || 'Unnamed Webhook'}</p>
                        <code className="text-xs text-blue-600">{w.url}</code>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {w.events?.slice(0, 5).map((ev: string) => (
                            <Badge key={ev} className="text-xs">{ev}</Badge>
                          ))}
                          {w.events?.length > 5 && <Badge>+{w.events.length - 5}</Badge>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={w.is_active ? 'success' : 'default'}>{w.is_active ? 'Active' : 'Disabled'}</Badge>
                      <Button variant="ghost" size="sm" icon={<Trash2 className="w-3.5 h-3.5 text-red-500" />}
                        onClick={() => systemApi.deleteWebhook(w.id).then(() => { qc.invalidateQueries({ queryKey: ['webhooks'] }); toast.success('Webhook deleted'); })} />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                    <span>{w.delivery_count || 0} deliveries</span>
                    {w.last_triggered_at && <span>Last: {timeAgo(w.last_triggered_at)}</span>}
                  </div>
                </Card>
              ))}
              {!webhooksData?.length && <p className="text-center text-slate-500 py-8">No webhooks configured</p>}
            </div>
          </div>
        )}

        {/* EMAIL TEMPLATES */}
        {tab === 'emails' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {emailTemplatesData?.map((t: any) => (
              <Card key={t.id} className="hover:shadow-md transition-all cursor-pointer !p-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">{t.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{t.subject}</p>
                    <Badge className="mt-1 text-xs capitalize">{t.category}</Badge>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-3">Edit Template</Button>
              </Card>
            ))}
          </div>
        )}

        {/* FEATURE FLAGS */}
        {tab === 'flags' && (
          <div className="space-y-3">
            {featureFlagsData?.map((flag: any) => (
              <Card key={flag.id} className="!p-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Flag className="w-4 h-4 text-slate-400" />
                      <p className="font-semibold text-slate-900">{flag.name}</p>
                      {flag.is_system && <Badge>System</Badge>}
                    </div>
                    {flag.description && <p className="text-xs text-slate-500 mt-1">{flag.description}</p>}
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                      <code>{flag.key}</code>
                      {flag.environment && <span className="capitalize">{flag.environment}</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => toggleFlagMutation.mutate({ id: flag.id, is_enabled: !flag.is_enabled })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${flag.is_enabled ? 'bg-blue-600' : 'bg-slate-200'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${flag.is_enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* AUDIT LOG */}
        {tab === 'audit' && (
          <Card padding={false}>
            <Table headers={['Action', 'User', 'Resource', 'IP', 'Time']}>
              {auditLogsData?.map((log: any) => (
                <Tr key={log.id}>
                  <Td>
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-slate-400" />
                      <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">{log.action}</code>
                    </div>
                  </Td>
                  <Td>
                    <p className="text-sm text-slate-800">{log.user_name}</p>
                    <p className="text-xs text-slate-500">{log.user_email}</p>
                  </Td>
                  <Td>
                    <p className="text-sm capitalize">{log.resource_type}</p>
                    {log.resource_id && <code className="text-xs text-slate-400">{log.resource_id}</code>}
                  </Td>
                  <Td><code className="text-xs">{log.ip_address}</code></Td>
                  <Td>{timeAgo(log.created_at)}</Td>
                </Tr>
              ))}
            </Table>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
