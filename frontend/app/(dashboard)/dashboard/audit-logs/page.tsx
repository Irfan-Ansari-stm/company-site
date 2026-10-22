'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/app/(dashboard)/_components/layout/DashboardLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Card, Table, Tr, Td, Badge, Pagination, SearchInput, Select } from '@/components/ui';
import { useQuery } from '@tanstack/react-query';
import { systemApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { History, Shield, Filter, UserCheck, Clock, Terminal } from 'lucide-react';

const ACTION_OPTIONS = [
  { value: '', label: 'All Actions' },
  { value: 'LOGIN', label: 'Login' },
  { value: 'REGISTER', label: 'Register' },
  { value: 'CREATE', label: 'Create' },
  { value: 'UPDATE', label: 'Update' },
  { value: 'DELETE', label: 'Delete' },
  { value: 'ASSIGN_ROLE', label: 'Assign Role' },
  { value: 'REVOKE_ROLE', label: 'Revoke Role' },
  { value: 'UPDATE_PERMISSIONS', label: 'Update Permissions' },
  { value: 'UPDATE_CLIENT_ACCESS', label: 'Update Client Access' },
];

export default function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selectedLog, setSelectedLog] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', { page, action: actionFilter }],
    queryFn: () =>
      systemApi
        .getAuditLogs({
          page,
          limit: 20,
          action: actionFilter || undefined,
        })
        .then((r) => r.data),
  });

  const logs = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 20);

  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case 'CREATE':
      case 'REGISTER':
        return 'success';
      case 'UPDATE':
      case 'UPDATE_PERMISSIONS':
      case 'UPDATE_CLIENT_ACCESS':
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
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 to-slate-800 p-6 rounded-2xl text-white shadow-xl">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <History className="w-6 h-6 text-indigo-400" />
                <h1 className="text-xl font-bold">System Security & Audit Trail</h1>
              </div>
              <p className="text-slate-300 text-sm max-w-2xl">
                Tamper-evident log of administrative mutations, role updates, permission modifications,
                client access configurations, and account status updates.
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Total Recorded Events</span>
              <span className="text-2xl font-bold text-white font-mono">{total}</span>
            </div>
          </div>

          {/* Filters & Table */}
          <Card padding={false}>
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Select
                  options={ACTION_OPTIONS}
                  value={actionFilter}
                  onChange={(e) => {
                    setActionFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-48 text-xs"
                />
              </div>
              <div className="text-xs text-slate-500">
                Displaying Page <span className="font-semibold text-slate-900">{page}</span> of{' '}
                <span className="font-semibold text-slate-900">{totalPages || 1}</span>
              </div>
            </div>

            <Table
              headers={['Timestamp', 'Actor / User', 'Action', 'Target Resource', 'Client IP', 'Details']}
              loading={isLoading}
              empty={!logs.length}
              emptyMessage="No audit log entries recorded for this filter."
            >
              {logs.map((log: any) => (
                <Tr key={log.id}>
                  <Td className="whitespace-nowrap text-xs text-slate-600 font-mono">
                    {formatDate(log.created_at, 'MMM d, yyyy HH:mm:ss')}
                  </Td>

                  <Td>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-semibold text-xs">
                        {(log.actor_name || log.actor_email || 'S')[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-900">
                          {log.actor_name || log.actor_email || 'System / Bootstrap'}
                        </p>
                        {log.actor_email && (
                          <p className="text-[11px] text-slate-400">{log.actor_email}</p>
                        )}
                      </div>
                    </div>
                  </Td>

                  <Td>
                    <Badge variant={getActionBadgeVariant(log.action)} className="text-[11px] font-bold">
                      {log.action}
                    </Badge>
                  </Td>

                  <Td>
                    <div className="flex items-center gap-1.5 font-mono text-xs text-slate-700">
                      <Terminal className="w-3.5 h-3.5 text-slate-400" />
                      <span>{log.resource_type}</span>
                    </div>
                  </Td>

                  <Td className="text-xs text-slate-500 font-mono">
                    {log.ip_address || '127.0.0.1'}
                  </Td>

                  <Td>
                    <button
                      type="button"
                      onClick={() => setSelectedLog(selectedLog?.id === log.id ? null : log)}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-medium underline cursor-pointer"
                    >
                      {selectedLog?.id === log.id ? 'Close' : 'View Payload'}
                    </button>
                  </Td>
                </Tr>
              ))}
            </Table>

            {/* Expanded Payload Viewer */}
            {selectedLog && (
              <div className="p-4 bg-slate-900 text-slate-200 border-t border-slate-800 text-xs font-mono">
                <div className="flex justify-between items-center mb-2 pb-1 border-b border-slate-800">
                  <span className="font-bold text-amber-400">
                    Audit Event Details: {selectedLog.action} on {selectedLog.resource_type}
                  </span>
                  <button
                    onClick={() => setSelectedLog(null)}
                    className="text-slate-400 hover:text-white"
                  >
                    Close [x]
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-[11px] text-slate-400 uppercase mb-1">New Data / Payload:</p>
                    <pre className="bg-slate-950 p-3 rounded-lg overflow-x-auto text-[11px] border border-slate-800 text-emerald-400">
                      {JSON.stringify(selectedLog.new_data || selectedLog.metadata || {}, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400 uppercase mb-1">Old Data / State:</p>
                    <pre className="bg-slate-950 p-3 rounded-lg overflow-x-auto text-[11px] border border-slate-800 text-slate-400">
                      {JSON.stringify(selectedLog.old_data || {}, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            )}

            <Pagination
              page={page}
              totalPages={totalPages}
              total={total}
              limit={20}
              onPageChange={setPage}
            />
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

