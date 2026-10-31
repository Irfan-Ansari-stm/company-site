'use client';

import { useState } from 'react';
import { use } from 'react';
import { DashboardLayout } from '@/app/(dashboard)/_components/layout/DashboardLayout';
import {
  Card,
  Button,
  StatusBadge,
  Modal,
  Select,
  Textarea,
  PageLoader,
  Badge,
  Avatar,
} from '@/components/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supportApi, usersApi } from '@/lib/api';
import { formatDate, timeAgo, extractApiError } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Send, Lock, ArrowLeft, CheckCircle2, RotateCcw } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import Link from 'next/link';

export default function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const [replyContent, setReplyContent] = useState('');
  const [isInternal, setIsInternal] = useState(false);

  const { data: ticket, isLoading } = useQuery({
    queryKey: ['ticket', id],
    queryFn: () => supportApi.getTicket(id).then((r) => r.data.data),
  });

  const { data: staffData } = useQuery({
    queryKey: ['staff-options'],
    queryFn: () => usersApi.list({ limit: 100 }).then((r) => r.data.data),
  });
  const staff = (staffData || []).filter((u: any) =>
    ['super_admin', 'admin', 'support', 'manager'].includes(u.role)
  );

  const replyMutation = useMutation({
    mutationFn: () =>
      supportApi.addReply(id, { content: replyContent, is_internal: isInternal }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ticket', id] });
      qc.invalidateQueries({ queryKey: ['tickets'] });
      qc.invalidateQueries({ queryKey: ['ticket-stats'] });
      setReplyContent('');
      toast.success('Reply sent successfully');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => supportApi.updateTicket(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ticket', id] });
      qc.invalidateQueries({ queryKey: ['tickets'] });
      qc.invalidateQueries({ queryKey: ['ticket-stats'] });
      toast.success('Ticket updated');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  if (isLoading)
    return (
      <DashboardLayout title="Support" breadcrumbs={[{ label: 'Support', href: '/dashboard/support' }]}>
        <PageLoader />
      </DashboardLayout>
    );

  if (!ticket)
    return (
      <DashboardLayout title="Support" breadcrumbs={[{ label: 'Support', href: '/dashboard/support' }]}>
        <div className="py-12 text-center">
          <p className="text-slate-600 mb-4">Ticket not found or has been removed.</p>
          <Link href="/dashboard/support">
            <Button variant="outline">Back to Support</Button>
          </Link>
        </div>
      </DashboardLayout>
    );

  const isStaff = user?.role !== 'client' && user?.role !== 'candidate';

  return (
    <DashboardLayout
      title="Support"
      breadcrumbs={[
        { label: 'Support', href: '/dashboard/support' },
        { label: ticket.ticket_number },
      ]}
    >
      <div className="mb-4">
        <Link
          href="/dashboard/support"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Tickets</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversation Thread */}
        <div className="lg:col-span-2 space-y-4">
          {/* Original message */}
          <Card>
            <div className="flex items-start gap-3 mb-4">
              <Avatar name={ticket.reporter_name} size="md" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-slate-900">{ticket.reporter_name}</p>
                  <Badge variant="info">Reporter</Badge>
                </div>
                <p className="text-xs text-slate-500">
                  {formatDate(ticket.created_at, 'MMM d, yyyy h:mm a')}
                </p>
              </div>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-2 leading-snug">
              {ticket.subject}
            </h2>
            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
              {ticket.description}
            </p>
          </Card>

          {/* Replies */}
          {ticket.replies?.map((reply: any) => (
            <Card
              key={reply.id}
              className={
                reply.is_internal
                  ? '!border-yellow-300 !bg-yellow-50/70'
                  : '!border-slate-200'
              }
            >
              <div className="flex items-start gap-3 mb-3">
                <Avatar src={reply.author_avatar} name={reply.author_name} size="md" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-900">{reply.author_name}</p>
                    <Badge className="capitalize">{reply.author_role}</Badge>
                    {reply.is_internal && (
                      <Badge variant="warning">
                        <Lock className="w-2.5 h-2.5 mr-1" />
                        Internal note
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">{timeAgo(reply.created_at)}</p>
                </div>
              </div>
              <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                {reply.content}
              </p>
            </Card>
          ))}

          {/* Reply Box */}
          <Card>
            <h3 className="text-sm font-semibold text-slate-800 mb-3">Add Response</h3>
            <Textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              rows={4}
              placeholder="Type your reply to this ticket..."
            />
            <div className="flex items-center justify-between mt-3">
              {isStaff ? (
                <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isInternal}
                    onChange={(e) => setIsInternal(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <Lock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Internal note (staff only, hidden from client)</span>
                </label>
              ) : (
                <div />
              )}
              <Button
                size="sm"
                loading={replyMutation.isPending}
                onClick={() => replyMutation.mutate()}
                disabled={!replyContent.trim()}
                icon={<Send className="w-4 h-4" />}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
              >
                Send Reply
              </Button>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <h3 className="text-sm font-semibold text-slate-800 mb-3">Ticket Information</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Ticket #</span>
                <span className="font-mono text-xs font-semibold text-slate-800">
                  {ticket.ticket_number}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Status</span>
                <StatusBadge status={ticket.status} />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Priority</span>
                <StatusBadge status={ticket.priority} />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Type</span>
                <span className="capitalize font-medium text-slate-800">{ticket.type}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Client</span>
                <span className="font-medium text-slate-800">{ticket.client_name || '—'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Assigned To</span>
                <span className="font-medium text-slate-800">
                  {ticket.assigned_to_name || 'Unassigned'}
                </span>
              </div>
              {ticket.first_response_at && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">First Response</span>
                  <span>{timeAgo(ticket.first_response_at)}</span>
                </div>
              )}
              {ticket.resolved_at && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Resolved</span>
                  <span>{timeAgo(ticket.resolved_at)}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Quick Management for Staff */}
          {isStaff && (
            <Card>
              <h3 className="text-sm font-semibold text-slate-800 mb-3">Manage Ticket</h3>
              <div className="space-y-3">
                <Select
                  label="Reassign Agent"
                  options={[
                    { value: '', label: 'Unassigned' },
                    ...staff.map((u: any) => ({
                      value: u.id,
                      label: `${u.display_name} (${u.role})`,
                    })),
                  ]}
                  value={ticket.assigned_to || ''}
                  onChange={(e) =>
                    updateMutation.mutate({ assigned_to: e.target.value || null })
                  }
                  className="text-xs"
                />

                <Select
                  label="Change Priority"
                  options={[
                    { value: 'low', label: 'Low' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'high', label: 'High' },
                    { value: 'critical', label: 'Critical' },
                  ]}
                  value={ticket.priority}
                  onChange={(e) => updateMutation.mutate({ priority: e.target.value })}
                  className="text-xs"
                />
              </div>
            </Card>
          )}

          {/* Update Status Buttons */}
          <Card>
            <h3 className="text-sm font-semibold text-slate-800 mb-3">Update Status</h3>
            <div className="space-y-2">
              <Button
                variant="secondary"
                size="sm"
                className="w-full justify-start"
                disabled={ticket.status === 'in_progress'}
                loading={updateMutation.isPending}
                onClick={() => updateMutation.mutate({ status: 'in_progress' })}
              >
                Mark In Progress
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="w-full justify-start"
                disabled={ticket.status === 'resolved'}
                loading={updateMutation.isPending}
                onClick={() => updateMutation.mutate({ status: 'resolved' })}
              >
                Mark Resolved
              </Button>
              {ticket.status !== 'closed' ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  loading={updateMutation.isPending}
                  onClick={() => updateMutation.mutate({ status: 'closed' })}
                >
                  Close Ticket
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  loading={updateMutation.isPending}
                  onClick={() => updateMutation.mutate({ status: 'open' })}
                  icon={<RotateCcw className="w-3.5 h-3.5" />}
                >
                  Reopen Ticket
                </Button>
              )}
            </div>
          </Card>

          {/* Customer Satisfaction */}
          {ticket.status === 'resolved' && !ticket.satisfaction && (
            <Card>
              <h3 className="text-sm font-semibold text-slate-800 mb-1">
                Customer Satisfaction
              </h3>
              <p className="text-xs text-slate-500 mb-3">
                Rate this resolution from 1 (poor) to 5 (excellent):
              </p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((r) => (
                  <button
                    key={r}
                    onClick={() =>
                      supportApi.rateTicket(id, r).then(() => {
                        qc.invalidateQueries({ queryKey: ['ticket', id] });
                        toast.success('Thank you for your rating!');
                      })
                    }
                    className="w-9 h-9 rounded-lg border border-slate-200 hover:bg-amber-50 hover:border-amber-300 text-sm font-bold transition-colors flex items-center justify-center text-amber-500"
                  >
                    ★{r}
                  </button>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
