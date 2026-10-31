'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/app/(dashboard)/_components/layout/DashboardLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Card, Table, Tr, Td, Badge, Pagination, Modal, Button } from '@/components/ui';
import { useQuery } from '@tanstack/react-query';
import { systemApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  History,
  Shield,
  Filter,
  UserCheck,
  Clock,
  Terminal,
  Search,
  Copy,
  Check,
  ExternalLink,
  Eye,
  X,
  FileCode,
  Globe,
  Database,
} from 'lucide-react';

const ACTION_OPTIONS = [
  { value: '', label: 'All Action Types' },
  { value: 'LOGIN', label: 'LOGIN (Authentication)' },
  { value: 'REGISTER', label: 'REGISTER (New Account)' },
  { value: 'CREATE', label: 'CREATE (New Record)' },
  { value: 'UPDATE', label: 'UPDATE (Mutation)' },
  { value: 'DELETE', label: 'DELETE (Removal)' },
  { value: 'ASSIGN_ROLE', label: 'ASSIGN_ROLE (RBAC)' },
  { value: 'REVOKE_ROLE', label: 'REVOKE_ROLE (RBAC)' },
  { value: 'UPDATE_PERMISSIONS', label: 'UPDATE_PERMISSIONS (RBAC)' },
  { value: 'UPDATE_CLIENT_ACCESS', label: 'UPDATE_CLIENT_ACCESS (Portal)' },
  { value: 'BULK_UPDATE_CLIENT_ACCESS', label: 'BULK_UPDATE_CLIENT_ACCESS' },
  { value: 'TEST_EMAIL_SENT', label: 'TEST_EMAIL_SENT (Diagnostics)' },
];

// Helper to mask sensitive keys in payloads
function maskSensitiveData(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(maskSensitiveData);

  const sensitiveKeys = [
    'password',
    'password_hash',
    'token',
    'access_token',
    'refresh_token',
    'secret',
    'client_secret',
    'api_key',
    'key_hash',
    'private_key',
  ];

  const masked: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (sensitiveKeys.some((sk) => k.toLowerCase().includes(sk))) {
      masked[k] = '•••••••• (masked for security)';
    } else if (v && typeof v === 'object') {
      masked[k] = maskSensitiveData(v);
    } else {
      masked[k] = v;
    }
  }
  return masked;
}

export default function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [activePayloadTab, setActivePayloadTab] = useState<'new' | 'old' | 'meta'>('new');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', { page, action: actionFilter, search }],
    queryFn: () =>
      systemApi
        .getAuditLogs({
          page,
          limit: 20,
          action: actionFilter || undefined,
          search: search.trim() || undefined,
        })
        .then((r) => r.data),
  });

  const logs = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 20);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case 'CREATE':
      case 'REGISTER':
        return 'success';
      case 'UPDATE':
      case 'UPDATE_PERMISSIONS':
      case 'UPDATE_CLIENT_ACCESS':
      case 'BULK_UPDATE_CLIENT_ACCESS':
      case 'ASSIGN_ROLE':
        return 'warning';
      case 'DELETE':
      case 'REVOKE_ROLE':
        return 'danger';
      case 'LOGIN':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <ProtectedRoute requireSuperAdmin>
      <DashboardLayout
        title="Administrative Audit Logs"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Audit Logs' }]}
      >
        <div className="space-y-6 min-w-0">
          {/* Header Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 rounded-2xl text-white shadow-xl">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <History className="w-6 h-6 text-indigo-400" />
                <h1 className="text-xl font-bold">System Security & Audit Trail</h1>
              </div>
              <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
                Tamper-evident log of administrative mutations, role updates, permission modifications,
                client access configurations, and account status updates.
              </p>
            </div>
            <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center p-3 sm:p-0 bg-white/5 sm:bg-transparent rounded-xl border border-white/10 sm:border-0 shrink-0">
              <span className="text-xs text-slate-400 uppercase tracking-wider block">Total Recorded Events</span>
              <span className="text-2xl font-bold text-white font-mono mt-0.5">{total.toLocaleString()}</span>
            </div>
          </div>

          {/* Filters & Table Card */}
          <Card padding={false} className="shadow-xs overflow-hidden">
            {/* Filter Bar */}
            <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white">
              <div className="flex flex-wrap sm:flex-nowrap gap-2 items-center flex-1 max-w-2xl">
                {/* Search input form */}
                <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-[200px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by actor, action, resource, IP…"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all text-slate-800 placeholder-slate-400"
                  />
                </form>

                {/* Action select filter */}
                <select
                  value={actionFilter}
                  onChange={(e) => {
                    setActionFilter(e.target.value);
                    setPage(1);
                  }}
                  className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-700 min-w-[160px]"
                >
                  {ACTION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>

                {(search || actionFilter) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearch('');
                      setSearchInput('');
                      setActionFilter('');
                      setPage(1);
                    }}
                    className="text-xs text-slate-500 hover:text-slate-800"
                  >
                    Reset
                  </Button>
                )}
              </div>

              <div className="text-xs text-slate-500 shrink-0 self-end md:self-auto">
                Displaying Page <span className="font-semibold text-slate-900">{page}</span> of{' '}
                <span className="font-semibold text-slate-900">{totalPages || 1}</span>{' '}
                <span className="text-slate-400">({total} total records)</span>
              </div>
            </div>

            {/* Responsive Table Container */}
            <div className="overflow-x-auto min-w-0">
              <Table
                headers={['Timestamp', 'Actor / User', 'Action', 'Target Resource', 'Client IP', 'Details']}
                loading={isLoading}
                empty={!logs.length}
                emptyMessage="No audit log entries recorded matching the current filter."
              >
                {logs.map((log: any) => (
                  <Tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <Td className="whitespace-nowrap text-xs text-slate-600 font-mono">
                      {formatDate(log.created_at, 'MMM d, yyyy HH:mm:ss')}
                    </Td>

                    <Td>
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-semibold text-xs shrink-0">
                          {(log.actor_name || log.actor_email || 'S')[0]?.toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-900 truncate">
                            {log.actor_name || log.actor_email || 'System / Automated'}
                          </p>
                          {log.actor_email && (
                            <p className="text-[11px] text-slate-400 truncate">{log.actor_email}</p>
                          )}
                        </div>
                      </div>
                    </Td>

                    <Td className="whitespace-nowrap">
                      <Badge variant={getActionBadgeVariant(log.action)} className="text-[10px] font-bold">
                        {log.action}
                      </Badge>
                    </Td>

                    <Td className="whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-mono text-xs text-slate-700">
                        <Terminal className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[140px]">{log.resource_type || '—'}</span>
                      </div>
                    </Td>

                    <Td className="text-xs text-slate-500 font-mono whitespace-nowrap">
                      {log.ip_address || '127.0.0.1'}
                    </Td>

                    <Td className="whitespace-nowrap text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<Eye className="w-3 h-3 text-indigo-600" />}
                        onClick={() => {
                          setSelectedLog(log);
                          setActivePayloadTab('new');
                        }}
                        className="text-xs py-1 px-2.5 h-7"
                      >
                        View Payload
                      </Button>
                    </Td>
                  </Tr>
                ))}
              </Table>
            </div>

            <div className="p-4 border-t border-slate-100 bg-white">
              <Pagination
                page={page}
                totalPages={totalPages}
                total={total}
                limit={20}
                onPageChange={setPage}
              />
            </div>
          </Card>

          {/* ─── AUDIT EVENT DETAILS MODAL ─── */}
          {selectedLog && (
            <Modal
              open={!!selectedLog}
              onClose={() => setSelectedLog(null)}
              title={`Audit Event: ${selectedLog.action} on ${selectedLog.resource_type}`}
              size="xl"
              footer={
                <div className="flex justify-between items-center w-full">
                  <span className="text-xs text-slate-400 font-mono">
                    ID: {selectedLog.id}
                  </span>
                  <Button onClick={() => setSelectedLog(null)}>Close</Button>
                </div>
              }
            >
              <div className="space-y-4">
                {/* Meta Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Action</span>
                    <Badge variant={getActionBadgeVariant(selectedLog.action)} className="mt-1 text-xs">
                      {selectedLog.action}
                    </Badge>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Resource</span>
                    <span className="text-xs font-mono font-bold text-slate-800 mt-1 block truncate">
                      {selectedLog.resource_type}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Client IP</span>
                    <span className="text-xs font-mono text-slate-700 mt-1 block">
                      {selectedLog.ip_address || '127.0.0.1'}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Timestamp</span>
                    <span className="text-xs text-slate-700 mt-1 block">
                      {formatDate(selectedLog.created_at, 'MMM d, yyyy HH:mm:ss')}
                    </span>
                  </div>
                </div>

                {/* Actor Info Banner */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                      {(selectedLog.actor_name || selectedLog.actor_email || 'S')[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-900">
                        {selectedLog.actor_name || selectedLog.actor_email || 'System Account'}
                      </p>
                      <p className="text-[11px] text-slate-500 font-mono">
                        Actor ID: {selectedLog.actor_id || 'System Bootstrap'}
                      </p>
                    </div>
                  </div>
                  {selectedLog.resource_id && (
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase block">Target Resource ID</span>
                      <span className="text-xs font-mono text-slate-700">{selectedLog.resource_id}</span>
                    </div>
                  )}
                </div>

                {/* Subtabs for Payload Content */}
                <div className="border-b border-slate-200 flex gap-4">
                  <button
                    type="button"
                    onClick={() => setActivePayloadTab('new')}
                    className={`pb-2 text-xs font-semibold border-b-2 transition-colors ${
                      activePayloadTab === 'new'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    New Data / Payload
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePayloadTab('old')}
                    className={`pb-2 text-xs font-semibold border-b-2 transition-colors ${
                      activePayloadTab === 'old'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Old Data / Previous State
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePayloadTab('meta')}
                    className={`pb-2 text-xs font-semibold border-b-2 transition-colors ${
                      activePayloadTab === 'meta'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Context & Metadata
                  </button>
                </div>

                {/* Tab 1: New Data */}
                {activePayloadTab === 'new' && (
                  <div className="relative">
                    <div className="flex justify-between items-center mb-1 text-xs text-slate-500">
                      <span>Mutated State Payload (Masked for Security):</span>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(
                            JSON.stringify(maskSensitiveData(selectedLog.new_data || selectedLog.metadata || {}), null, 2),
                            'new'
                          )
                        }
                        className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium"
                      >
                        {copiedKey === 'new' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedKey === 'new' ? 'Copied' : 'Copy Payload'}
                      </button>
                    </div>
                    <pre className="bg-slate-950 p-4 rounded-xl overflow-x-auto max-h-80 text-xs text-emerald-400 font-mono border border-slate-800 shadow-inner">
                      {JSON.stringify(maskSensitiveData(selectedLog.new_data || selectedLog.metadata || {}), null, 2)}
                    </pre>
                  </div>
                )}

                {/* Tab 2: Old Data */}
                {activePayloadTab === 'old' && (
                  <div className="relative">
                    <div className="flex justify-between items-center mb-1 text-xs text-slate-500">
                      <span>Previous State Before Mutation:</span>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(JSON.stringify(maskSensitiveData(selectedLog.old_data || {}), null, 2), 'old')
                        }
                        className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium"
                      >
                        {copiedKey === 'old' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedKey === 'old' ? 'Copied' : 'Copy Old Data'}
                      </button>
                    </div>
                    <pre className="bg-slate-950 p-4 rounded-xl overflow-x-auto max-h-80 text-xs text-slate-400 font-mono border border-slate-800 shadow-inner">
                      {JSON.stringify(maskSensitiveData(selectedLog.old_data || {}), null, 2)}
                    </pre>
                  </div>
                )}

                {/* Tab 3: Metadata */}
                {activePayloadTab === 'meta' && (
                  <div className="relative">
                    <div className="flex justify-between items-center mb-1 text-xs text-slate-500">
                      <span>Request Headers & System Metadata:</span>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(JSON.stringify(maskSensitiveData(selectedLog.metadata || {}), null, 2), 'meta')
                        }
                        className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium"
                      >
                        {copiedKey === 'meta' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedKey === 'meta' ? 'Copied' : 'Copy Metadata'}
                      </button>
                    </div>
                    <pre className="bg-slate-950 p-4 rounded-xl overflow-x-auto max-h-80 text-xs text-blue-300 font-mono border border-slate-800 shadow-inner">
                      {JSON.stringify(maskSensitiveData(selectedLog.metadata || {}), null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </Modal>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
