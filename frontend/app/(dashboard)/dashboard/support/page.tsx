'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/app/(dashboard)/_components/layout/DashboardLayout';
import {
  Card,
  Button,
  SearchInput,
  Table,
  Tr,
  Td,
  StatusBadge,
  Pagination,
  Modal,
  Input,
  Select,
  Textarea,
  StatCard,
  Badge,
  EmptyState,
} from '@/components/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supportApi, clientsApi, usersApi } from '@/lib/api';
import { formatDate, timeAgo, extractApiError } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Plus,
  Eye,
  CheckCircle2,
  Clock,
  AlertTriangle,
  MessageSquare,
  Trash2,
  Edit,
  UserCheck,
  RotateCcw,
  BookOpen,
} from 'lucide-react';
import Link from 'next/link';

const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

const TICKET_TYPES = [
  { value: 'support', label: 'Support' },
  { value: 'bug', label: 'Bug' },
  { value: 'feature_request', label: 'Feature Request' },
  { value: 'billing', label: 'Billing' },
  { value: 'general', label: 'General' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All status' },
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'pending_client', label: 'Pending Client' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

export default function SupportPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  // Modals state
  const [showCreate, setShowCreate] = useState(false);
  const [editingTicket, setEditingTicket] = useState<any | null>(null);
  const [deletingTicket, setDeletingTicket] = useState<any | null>(null);

  const [form, setForm] = useState({
    subject: '',
    description: '',
    type: 'support',
    priority: 'medium',
    client_id: '',
    assigned_to: '',
  });

  const [editForm, setEditForm] = useState({
    status: '',
    priority: '',
    assigned_to: '',
  });

  // Queries
  const { data, isLoading } = useQuery({
    queryKey: ['tickets', { page, search, status: statusFilter, priority: priorityFilter }],
    queryFn: () =>
      supportApi
        .getTickets({
          page,
          limit: 20,
          search: search || undefined,
          status: statusFilter || undefined,
          priority: priorityFilter || undefined,
        })
        .then((r) => r.data),
  });

  const { data: stats } = useQuery({
    queryKey: ['ticket-stats'],
    queryFn: () => supportApi.getTicketStats().then((r) => r.data.data),
  });

  const { data: clientsData } = useQuery({
    queryKey: ['clients-options'],
    queryFn: () => clientsApi.list({ limit: 100 }).then((r) => r.data.data),
  });
  const clients = clientsData || [];

  const { data: staffData } = useQuery({
    queryKey: ['staff-options'],
    queryFn: () => usersApi.list({ limit: 100 }).then((r) => r.data.data),
  });
  const staff = (staffData || []).filter((u: any) =>
    ['super_admin', 'admin', 'support', 'manager'].includes(u.role)
  );

  // Mutations
  const createMutation = useMutation({
    mutationFn: () =>
      supportApi.createTicket({
        subject: form.subject,
        description: form.description,
        type: form.type,
        priority: form.priority,
        client_id: form.client_id || null,
        assigned_to: form.assigned_to || null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tickets'] });
      qc.invalidateQueries({ queryKey: ['ticket-stats'] });
      setShowCreate(false);
      setForm({
        subject: '',
        description: '',
        type: 'support',
        priority: 'medium',
        client_id: '',
        assigned_to: '',
      });
      toast.success('Ticket created successfully');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      supportApi.updateTicket(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tickets'] });
      qc.invalidateQueries({ queryKey: ['ticket-stats'] });
      setEditingTicket(null);
      toast.success('Ticket updated successfully');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => supportApi.deleteTicket(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tickets'] });
      qc.invalidateQueries({ queryKey: ['ticket-stats'] });
      setDeletingTicket(null);
      toast.success('Ticket archived successfully');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const handleEditClick = (ticket: any) => {
    setEditForm({
      status: ticket.status || 'open',
      priority: ticket.priority || 'medium',
      assigned_to: ticket.assigned_to || '',
    });
    setEditingTicket(ticket);
  };

  const setF = (k: string, v: string) => setForm((prev) => ({ ...prev, [k]: v }));
  const setEF = (k: string, v: string) => setEditForm((prev) => ({ ...prev, [k]: v }));

  const tickets = data?.data || [];
  const totalPages = Math.ceil((data?.total || 0) / 20);

  return (
    <DashboardLayout title="Support" breadcrumbs={[{ label: 'Support' }]}>
      <div className="space-y-6">
        {/* ── Dashboard Statistics Cards ───────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Open"
            value={stats?.open_count ?? 0}
            icon={<MessageSquare className="w-5 h-5" />}
            color="blue"
          />
          <StatCard
            title="In Progress"
            value={stats?.in_progress_count ?? 0}
            icon={<Clock className="w-5 h-5" />}
            color="orange"
          />
          <StatCard
            title="Resolved Today"
            value={stats?.resolved_today ?? 0}
            icon={<CheckCircle2 className="w-5 h-5" />}
            color="green"
          />
          <StatCard
            title="Critical"
            value={stats?.critical_count ?? 0}
            icon={<AlertTriangle className="w-5 h-5" />}
            color="red"
          />
        </div>

        {/* ── Support Tickets Card & Table ─────────────────────── */}
        <Card padding={false} className="shadow-sm">
          {/* Filters Bar */}
          <div className="flex flex-wrap items-center gap-3 p-4 sm:p-5 border-b border-slate-100">
            <SearchInput
              value={search}
              onChange={(v) => {
                setSearch(v);
                setPage(1);
              }}
              placeholder="Search tickets, subject, client..."
              className="flex-1 min-w-[220px] max-w-sm"
            />
            <Select
              options={STATUS_OPTIONS}
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-36 text-sm"
            />
            <Select
              options={[{ value: '', label: 'All priority' }, ...PRIORITIES]}
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setPage(1);
              }}
              className="w-36 text-sm"
            />

            {(search || statusFilter || priorityFilter) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch('');
                  setStatusFilter('');
                  setPriorityFilter('');
                  setPage(1);
                }}
              >
                Clear
              </Button>
            )}

            <div className="ml-auto">
              <Button
                size="sm"
                icon={<Plus className="w-4 h-4" />}
                onClick={() => setShowCreate(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
              >
                + New Ticket
              </Button>
            </div>
          </div>

          {/* Responsive Table Container */}
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50">
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-32 whitespace-nowrap">
                    TICKET #
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-[220px] max-w-sm">
                    SUBJECT
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-36 whitespace-nowrap">
                    CLIENT
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-28 whitespace-nowrap">
                    STATUS
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-24 whitespace-nowrap">
                    PRIORITY
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-32 whitespace-nowrap">
                    ASSIGNED TO
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-20 text-center whitespace-nowrap">
                    REPLIES
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-28 whitespace-nowrap">
                    CREATED
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-28 text-right whitespace-nowrap">
                    ACTIONS
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-16 text-center text-slate-500">
                      <div className="flex justify-center items-center gap-2">
                        <Clock className="w-5 h-5 animate-spin text-blue-600" />
                        <span>Loading tickets...</span>
                      </div>
                    </td>
                  </tr>
                ) : !tickets.length ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-16 text-center">
                      <EmptyState
                        icon={<MessageSquare className="w-8 h-8" />}
                        title="No tickets found"
                        description="Try adjusting your search criteria or create a new ticket."
                      />
                    </td>
                  </tr>
                ) : (
                  tickets.map((t: any) => (
                    <tr
                      key={t.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Ticket # */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="font-mono text-xs font-medium text-slate-600">
                          {t.ticket_number}
                        </span>
                      </td>

                      {/* Subject + Reporter */}
                      <td className="px-4 py-3.5">
                        <div className="max-w-xs sm:max-w-sm">
                          <Link
                            href={`/dashboard/support/tickets/${t.id}`}
                            className="font-medium text-slate-900 hover:text-blue-600 transition-colors line-clamp-1"
                          >
                            {t.subject}
                          </Link>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {t.reporter_name || 'Direct Client'}
                          </p>
                        </div>
                      </td>

                      {/* Client */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="text-sm text-slate-700 font-medium">
                          {t.client_name || '—'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <StatusBadge status={t.status} />
                      </td>

                      {/* Priority */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <StatusBadge status={t.priority} />
                      </td>

                      {/* Assigned To */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {t.assigned_to_name ? (
                          <span className="text-sm font-medium text-slate-800">
                            {t.assigned_to_name}
                          </span>
                        ) : (
                          <span className="text-sm text-slate-400 italic">
                            Unassigned
                          </span>
                        )}
                      </td>

                      {/* Replies */}
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        <span className="text-sm font-medium text-slate-700">
                          {t.reply_count || 0}
                        </span>
                      </td>

                      {/* Created */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="text-xs text-slate-500">
                          {timeAgo(t.created_at)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/dashboard/support/tickets/${t.id}`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<Eye className="w-4 h-4 text-slate-500" />}
                            >
                              View
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<Edit className="w-4 h-4 text-slate-500" />}
                            onClick={() => handleEditClick(t)}
                            title="Edit / Reassign Ticket"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<Trash2 className="w-4 h-4 text-red-500" />}
                            onClick={() => setDeletingTicket(t)}
                            title="Archive Ticket"
                          />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            total={data?.total}
            limit={20}
          />
        </Card>

        {/* ── Knowledge Base Quick Access ──────────────────────── */}
        <Card className="shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Knowledge Base & Documentation
                </h3>
                <p className="text-xs sm:text-sm text-slate-500">
                  Quickly review standard operating procedures, resolved cases, and customer documentation.
                </p>
              </div>
            </div>
            <Link href="/dashboard/support/kb">
              <Button variant="outline" size="sm">
                Browse Articles
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* MODALS                                                 */}
      {/* ═══════════════════════════════════════════════════════ */}

      {/* 1. Create New Ticket Modal */}
      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="New Support Ticket"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button
              loading={createMutation.isPending}
              disabled={!form.subject.trim() || !form.description.trim()}
              onClick={() => createMutation.mutate()}
            >
              Submit Ticket
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Subject *"
            value={form.subject}
            onChange={(e) => setF('subject', e.target.value)}
            placeholder="e.g. Database connection latency spike inquiry"
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Client"
              options={[
                { value: '', label: 'Select client (optional)' },
                ...clients.map((c: any) => ({
                  value: c.id,
                  label: c.company_name || c.name || 'Unnamed Client',
                })),
              ]}
              value={form.client_id}
              onChange={(e) => setF('client_id', e.target.value)}
            />
            <Select
              label="Assign Staff Member"
              options={[
                { value: '', label: 'Unassigned' },
                ...staff.map((u: any) => ({
                  value: u.id,
                  label: `${u.display_name} (${u.role})`,
                })),
              ]}
              value={form.assigned_to}
              onChange={(e) => setF('assigned_to', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Type"
              options={TICKET_TYPES}
              value={form.type}
              onChange={(e) => setF('type', e.target.value)}
            />
            <Select
              label="Priority"
              options={PRIORITIES}
              value={form.priority}
              onChange={(e) => setF('priority', e.target.value)}
            />
          </div>

          <Textarea
            label="Description *"
            value={form.description}
            onChange={(e) => setF('description', e.target.value)}
            rows={5}
            placeholder="Detailed description of the problem, error logs, or request..."
          />
        </div>
      </Modal>

      {/* 2. Quick Edit / Reassign Ticket Modal */}
      <Modal
        open={!!editingTicket}
        onClose={() => setEditingTicket(null)}
        title={`Edit Ticket ${editingTicket?.ticket_number || ''}`}
        footer={
          <>
            <Button variant="outline" onClick={() => setEditingTicket(null)}>
              Cancel
            </Button>
            <Button
              loading={updateMutation.isPending}
              onClick={() =>
                updateMutation.mutate({
                  id: editingTicket.id,
                  data: editForm,
                })
              }
            >
              Save Changes
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-slate-800">
              {editingTicket?.subject}
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Client: {editingTicket?.client_name || 'Direct'}
            </p>
          </div>

          <Select
            label="Status"
            options={[
              { value: 'open', label: 'Open' },
              { value: 'in_progress', label: 'In Progress' },
              { value: 'pending_client', label: 'Pending Client' },
              { value: 'on_hold', label: 'On Hold' },
              { value: 'resolved', label: 'Resolved' },
              { value: 'closed', label: 'Closed' },
            ]}
            value={editForm.status}
            onChange={(e) => setEF('status', e.target.value)}
          />

          <Select
            label="Priority"
            options={PRIORITIES}
            value={editForm.priority}
            onChange={(e) => setEF('priority', e.target.value)}
          />

          <Select
            label="Assigned Agent"
            options={[
              { value: '', label: 'Unassigned' },
              ...staff.map((u: any) => ({
                value: u.id,
                label: `${u.display_name} (${u.role})`,
              })),
            ]}
            value={editForm.assigned_to}
            onChange={(e) => setEF('assigned_to', e.target.value)}
          />
        </div>
      </Modal>

      {/* 3. Archive Ticket Confirmation Modal */}
      <Modal
        open={!!deletingTicket}
        onClose={() => setDeletingTicket(null)}
        title="Archive Support Ticket"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeletingTicket(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate(deletingTicket.id)}
            >
              Archive Ticket
            </Button>
          </>
        }
      >
        <p className="text-slate-700 text-sm">
          Are you sure you want to archive ticket{' '}
          <strong>{deletingTicket?.ticket_number}</strong> ({deletingTicket?.subject})?
        </p>
      </Modal>
    </DashboardLayout>
  );
}
