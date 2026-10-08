'use client';

import { useState } from 'react';
import { use } from 'react';
import { DashboardLayout } from '@/app/(dashboard)/_components/layout/DashboardLayout';
import { Card, Button, StatusBadge, Modal, Select, Textarea, PageLoader, Badge, Avatar } from '@/components/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supportApi } from '@/lib/api';
import { formatDate, timeAgo, extractApiError } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Send, Lock } from 'lucide-react';
import { useAuthStore } from '@/store/auth';

export default function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const [replyContent, setReplyContent] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  const { data: ticket, isLoading } = useQuery({
    queryKey: ['ticket', id],
    queryFn: () => supportApi.getTicket(id).then(r => r.data.data),
  });

  const replyMutation = useMutation({
    mutationFn: () => supportApi.addReply(id, { content: replyContent, is_internal: isInternal }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['ticket', id] }); setReplyContent(''); toast.success('Reply sent'); },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status: string) => supportApi.updateTicket(id, { status }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['ticket', id] }); toast.success('Status updated'); },
  });

  if (isLoading) return <DashboardLayout title="Ticket"><PageLoader /></DashboardLayout>;
  if (!ticket) return <DashboardLayout title="Not Found"><p>Ticket not found</p></DashboardLayout>;

  return (
    <DashboardLayout breadcrumbs={[{ label: 'Support', href: '/dashboard/support' }, { label: ticket.ticket_number }]}>
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
                <p className="text-xs text-slate-500">{formatDate(ticket.created_at, 'MMM d, yyyy h:mm a')}</p>
              </div>
            </div>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">{ticket.subject}</h2>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{ticket.description}</p>
          </Card>

          {/* Replies */}
          {ticket.replies?.map((reply: any) => (
            <Card key={reply.id} className={reply.is_internal ? '!border-yellow-200 !bg-yellow-50' : ''}>
              <div className="flex items-start gap-3 mb-3">
                <Avatar src={reply.author_avatar} name={reply.author_name} size="md" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-900">{reply.author_name}</p>
                    <Badge className="capitalize">{reply.author_role}</Badge>
                    {reply.is_internal && <Badge variant="warning"><Lock className="w-2.5 h-2.5 mr-1" />Internal</Badge>}
                  </div>
                  <p className="text-xs text-slate-500">{timeAgo(reply.created_at)}</p>
                </div>
              </div>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{reply.content}</p>
            </Card>
          ))}

          {/* Reply Box */}
          <Card>
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Reply</h3>
            <Textarea
              value={replyContent}
              onChange={e => setReplyContent(e.target.value)}
              rows={4}
              placeholder="Type your reply..."
            />
            <div className="flex items-center justify-between mt-3">
              <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                <input type="checkbox" checked={isInternal} onChange={e => setIsInternal(e.target.checked)} className="rounded" />
                <Lock className="w-3.5 h-3.5" />
                Internal note (not visible to client)
              </label>
              <Button
                size="sm"
                loading={replyMutation.isPending}
                onClick={() => replyMutation.mutate()}
                disabled={!replyContent.trim()}
                icon={<Send className="w-4 h-4" />}
              >
                Send Reply
              </Button>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Ticket Info</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Status</span>
                <StatusBadge status={ticket.status} />
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Priority</span>
                <StatusBadge status={ticket.priority} />
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Type</span>
                <span className="capitalize">{ticket.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Client</span>
                <span>{ticket.client_name || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Assigned To</span>
                <span>{ticket.assigned_to_name || 'Unassigned'}</span>
              </div>
              {ticket.first_response_at && (
                <div className="flex justify-between">
                  <span className="text-slate-500">First Response</span>
                  <span>{timeAgo(ticket.first_response_at)}</span>
                </div>
              )}
              {ticket.resolved_at && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Resolved</span>
                  <span>{timeAgo(ticket.resolved_at)}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Update Status */}
          <Card>
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Update Status</h3>
            <div className="space-y-2">
              {[
                { status: 'in_progress', label: 'Mark In Progress', color: 'secondary' },
                { status: 'resolved', label: 'Mark Resolved', color: 'primary' },
                { status: 'closed', label: 'Close Ticket', color: 'ghost' },
              ].map(({ status, label, color }) => (
                <Button
                  key={status}
                  variant={color as any}
                  size="sm"
                  className="w-full"
                  disabled={ticket.status === status}
                  loading={updateStatusMutation.isPending}
                  onClick={() => updateStatusMutation.mutate(status)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </Card>

          {/* CSAT */}
          {ticket.status === 'resolved' && !ticket.csat_rating && (
            <Card>
              <h3 className="text-sm font-semibold text-slate-700 mb-2">Customer Satisfaction</h3>
              <p className="text-xs text-slate-500 mb-3">Rate this ticket resolution</p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(r => (
                  <button key={r} onClick={() => supportApi.rateTicket(id, r)} className="w-9 h-9 rounded-lg border border-slate-200 hover:bg-yellow-50 hover:border-yellow-300 text-lg">
                    {'⭐'.repeat(Math.min(r, 1))}{'☆'.repeat(0)}{r}
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
