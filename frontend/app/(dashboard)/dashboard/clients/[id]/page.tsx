'use client';

import { useState } from 'react';
import { use } from 'react';
import { DashboardLayout } from '@/app/(dashboard)/_components/layout/DashboardLayout';
import {
  Card, Button, StatusBadge, Modal, Input, Select, Textarea,
  TabBar, PageLoader, Badge, Table, Tr, Td, StatCard
} from '@/components/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientsApi } from '@/lib/api';
import { formatDate, formatCurrency, timeAgo, extractApiError } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Building2, Mail, Phone, Globe, MapPin, User, Calendar,
  Briefcase, Receipt, LifeBuoy, MessageSquare, Plus, Edit, Trash2, ArrowLeft, CheckCircle2
} from 'lucide-react';
import Link from 'next/link';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'churned', label: 'Churned' },
  { value: 'archived', label: 'Archived' },
];

const CLIENT_TYPES = [
  { value: 'company', label: 'Company' },
  { value: 'individual', label: 'Individual' },
  { value: 'government', label: 'Government' },
  { value: 'non_profit', label: 'Non-Profit' },
];

const INDUSTRIES = [
  { value: 'technology', label: 'Technology' },
  { value: 'finance', label: 'Finance' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'education', label: 'Education' },
  { value: 'retail', label: 'Retail' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'other', label: 'Other' },
];

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const qc = useQueryClient();
  const [tab, setTab] = useState('overview');

  // Modals state
  const [showEdit, setShowEdit] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [isPinned, setIsPinned] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState<any>({});
  // Contact form state
  const [contactForm, setContactForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    designation: '',
    is_primary: false,
  });

  const { data: client, isLoading } = useQuery({
    queryKey: ['client', id],
    queryFn: () => clientsApi.get(id).then(r => r.data.data),
  });

  const updateMutation = useMutation({
    mutationFn: (formData: any) => clientsApi.update(id, formData),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['client', id] });
      qc.invalidateQueries({ queryKey: ['clients'] });
      setShowEdit(false);
      toast.success('Client updated successfully');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const addContactMutation = useMutation({
    mutationFn: (data: any) => clientsApi.addContact(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['client', id] });
      setShowAddContact(false);
      setContactForm({ first_name: '', last_name: '', email: '', phone: '', designation: '', is_primary: false });
      toast.success('Contact added');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const removeContactMutation = useMutation({
    mutationFn: (contactId: string) => clientsApi.removeContact(id, contactId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['client', id] });
      toast.success('Contact removed');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const addNoteMutation = useMutation({
    mutationFn: () => clientsApi.addNote(id, { content: noteContent, is_pinned: isPinned }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['client', id] });
      setNoteContent('');
      setIsPinned(false);
      toast.success('Note added');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  if (isLoading) {
    return (
      <DashboardLayout title="Client Details">
        <PageLoader />
      </DashboardLayout>
    );
  }

  if (!client) {
    return (
      <DashboardLayout title="Client Not Found">
        <div className="text-center py-12">
          <p className="text-slate-500 mb-4">The requested client could not be found.</p>
          <Link href="/dashboard/clients">
            <Button variant="outline" icon={<ArrowLeft className="w-4 h-4" />}>Back to Clients</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const openEditModal = () => {
    setEditForm({
      name: client.name || client.company_name,
      type: client.type || 'company',
      industry: client.industry || '',
      email: client.email || client.billing_email || '',
      phone: client.phone || '',
      website: client.website || '',
      status: client.status || 'active',
      country: client.country || '',
      city: client.city || '',
      description: client.notes || '',
    });
    setShowEdit(true);
  };

  const tabs = [
    { id: 'overview', label: 'Overview & Projects' },
    { id: 'contacts', label: `Contacts (${client.contacts?.length || 0})` },
    { id: 'invoices', label: `Invoices (${client.recent_invoices?.length || 0})` },
    { id: 'tickets', label: `Support Tickets (${client.recent_tickets?.length || 0})` },
    { id: 'notes', label: `Notes (${client.notes?.length || 0})` },
  ];

  return (
    <DashboardLayout
      title={client.name || client.company_name}
      breadcrumbs={[
        { label: 'Clients', href: '/dashboard/clients' },
        { label: client.name || client.company_name },
      ]}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Client Profile & Quick Info */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <div className="text-center mb-5 pb-5 border-b border-slate-100">
              {client.logo_url ? (
                <img src={client.logo_url} className="w-16 h-16 rounded-2xl object-contain mx-auto mb-3 border border-slate-200" alt="" />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3 shadow-md">
                  {(client.name || client.company_name || 'C').charAt(0)}
                </div>
              )}
              <h2 className="text-lg font-bold text-slate-900">{client.name || client.company_name}</h2>
              <div className="flex items-center justify-center gap-2 mt-2">
                <StatusBadge status={client.status || 'active'} />
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium capitalize">
                  {client.type || 'Company'}
                </span>
              </div>
            </div>

            {/* Quick Details List */}
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2.5 text-slate-700">
                <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span className="truncate">{client.email || client.billing_email || '—'}</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-700">
                <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span>{client.phone || '—'}</span>
              </div>
              {client.website && (
                <div className="flex items-center gap-2.5 text-slate-700">
                  <Globe className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <a href={client.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate">
                    {client.website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}
              {(client.city || client.country) && (
                <div className="flex items-center gap-2.5 text-slate-700">
                  <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span>{[client.city, client.country].filter(Boolean).join(', ')}</span>
                </div>
              )}
              <div className="flex items-center gap-2.5 text-slate-700">
                <User className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span>Account Manager: <strong className="text-slate-900">{client.account_manager_name || 'Unassigned'}</strong></span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-700">
                <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span>Client Since: <strong className="text-slate-900">{formatDate(client.created_at)}</strong></span>
              </div>
            </div>

            {/* Health Score */}
            <div className="mt-5 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs font-medium mb-1">
                <span className="text-slate-500">Account Health Score</span>
                <span className="font-bold text-slate-900">{client.health_score || 90}/100</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-2 rounded-full ${(client.health_score || 90) >= 80 ? 'bg-green-500' : (client.health_score || 90) >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                  style={{ width: `${Math.min(100, client.health_score || 90)}%` }}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="mt-5 pt-4 border-t border-slate-100 flex gap-2">
              <Button size="sm" variant="outline" className="flex-1" icon={<Edit className="w-4 h-4" />} onClick={openEditModal}>
                Edit Profile
              </Button>
            </div>
          </Card>
        </div>

        {/* Right Column: Tabbed Sections */}
        <div className="lg:col-span-2 space-y-4">
          <TabBar tabs={tabs} active={tab} onChange={setTab} />

          {/* Tab 1: Overview & Associated Projects */}
          {tab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <StatCard
                  title="Projects"
                  value={client.projects?.length || 0}
                  icon={<Briefcase className="w-4 h-4" />}
                  color="blue"
                />
                <StatCard
                  title="Invoices"
                  value={client.recent_invoices?.length || 0}
                  icon={<Receipt className="w-4 h-4" />}
                  color="green"
                />
                <StatCard
                  title="Support Tickets"
                  value={client.recent_tickets?.length || 0}
                  icon={<LifeBuoy className="w-4 h-4" />}
                  color="purple"
                />
              </div>

              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-blue-600" />
                    Associated Projects
                  </h3>
                </div>
                {!client.projects?.length ? (
                  <p className="text-sm text-slate-500 py-4 text-center">No associated projects yet.</p>
                ) : (
                  <Table headers={['Project Title', 'Status', 'Progress', 'Budget', 'Timeline']}>
                    {client.projects.map((p: any) => (
                      <Tr key={p.id}>
                        <Td className="font-medium text-slate-900">{p.title || p.name}</Td>
                        <Td><StatusBadge status={p.status} /></Td>
                        <Td>
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-1.5 bg-blue-500 rounded-full" style={{ width: `${p.progress_percent || 0}%` }} />
                            </div>
                            <span className="text-xs text-slate-500 font-mono">{p.progress_percent || 0}%</span>
                          </div>
                        </Td>
                        <Td>{p.budget ? formatCurrency(Number(p.budget), 'USD') : '—'}</Td>
                        <Td className="text-xs text-slate-500">
                          {p.start_date ? formatDate(p.start_date) : '—'}
                        </Td>
                      </Tr>
                    ))}
                  </Table>
                )}
              </Card>
            </div>
          )}

          {/* Tab 2: Contacts */}
          {tab === 'contacts' && (
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-900">Client Contacts</h3>
                <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setShowAddContact(true)}>
                  Add Contact
                </Button>
              </div>

              {!client.contacts?.length ? (
                <p className="text-sm text-slate-500 py-6 text-center">No contacts listed. Click "Add Contact" to record a point of contact.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {client.contacts.map((ct: any) => (
                    <div key={ct.id} className="py-3 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-slate-900">{ct.first_name} {ct.last_name}</p>
                          {ct.is_primary && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">Primary</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">{ct.designation || 'Contact'}</p>
                        <div className="flex items-center gap-4 text-xs text-slate-600 mt-1">
                          {ct.email && <span>{ct.email}</span>}
                          {ct.phone && <span>{ct.phone}</span>}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Trash2 className="w-4 h-4 text-red-500" />}
                        onClick={() => removeContactMutation.mutate(ct.id)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Tab 3: Invoices */}
          {tab === 'invoices' && (
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-900">Recent Invoices</h3>
              </div>
              {!client.recent_invoices?.length ? (
                <p className="text-sm text-slate-500 py-6 text-center">No invoices recorded for this client.</p>
              ) : (
                <Table headers={['Invoice #', 'Status', 'Amount', 'Amount Paid', 'Due Date']}>
                  {client.recent_invoices.map((inv: any) => (
                    <Tr key={inv.id}>
                      <Td className="font-medium text-slate-900">{inv.invoice_number}</Td>
                      <Td><StatusBadge status={inv.status} /></Td>
                      <Td className="font-semibold text-slate-900">{formatCurrency(Number(inv.total_amount || 0), 'USD')}</Td>
                      <Td className="text-slate-600">{formatCurrency(Number(inv.amount_paid || 0), 'USD')}</Td>
                      <Td className="text-xs text-slate-500">{formatDate(inv.due_date)}</Td>
                    </Tr>
                  ))}
                </Table>
              )}
            </Card>
          )}

          {/* Tab 4: Support Tickets */}
          {tab === 'tickets' && (
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-900">Support Tickets</h3>
              </div>
              {!client.recent_tickets?.length ? (
                <p className="text-sm text-slate-500 py-6 text-center">No support tickets found for this client.</p>
              ) : (
                <Table headers={['Ticket #', 'Subject', 'Priority', 'Status', 'Created']}>
                  {client.recent_tickets.map((t: any) => (
                    <Tr key={t.id}>
                      <Td className="font-mono text-xs text-slate-600">{t.ticket_number}</Td>
                      <Td className="font-medium text-slate-900">{t.subject}</Td>
                      <Td><span className="capitalize text-xs font-medium">{t.priority}</span></Td>
                      <Td><StatusBadge status={t.status} /></Td>
                      <Td className="text-xs text-slate-500">{formatDate(t.created_at)}</Td>
                    </Tr>
                  ))}
                </Table>
              )}
            </Card>
          )}

          {/* Tab 5: Notes */}
          {tab === 'notes' && (
            <Card>
              <div className="mb-4">
                <h3 className="font-semibold text-slate-900 mb-2">Account Notes</h3>
                <div className="space-y-2">
                  <Textarea
                    placeholder="Add an internal note about this client..."
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    rows={3}
                  />
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isPinned}
                        onChange={(e) => setIsPinned(e.target.checked)}
                        className="rounded border-slate-300 text-blue-600"
                      />
                      Pin this note to the top
                    </label>
                    <Button
                      size="sm"
                      loading={addNoteMutation.isPending}
                      disabled={!noteContent.trim()}
                      onClick={() => addNoteMutation.mutate()}
                    >
                      Post Note
                    </Button>
                  </div>
                </div>
              </div>

              {!client.notes?.length ? (
                <p className="text-sm text-slate-500 py-4 text-center border-t border-slate-100">No notes posted yet.</p>
              ) : (
                <div className="divide-y divide-slate-100 border-t border-slate-100 mt-4">
                  {client.notes.map((n: any) => (
                    <div key={n.id} className="py-3">
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                        <span className="font-medium text-slate-900">{n.author_name || 'Staff Member'}</span>
                        <div className="flex items-center gap-2">
                          {n.is_pinned && (
                            <span className="bg-yellow-50 text-yellow-700 text-xs px-2 py-0.5 rounded font-medium">Pinned</span>
                          )}
                          <span>{timeAgo(n.created_at)}</span>
                        </div>
                      </div>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">{n.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}
        </div>
      </div>

      {/* Edit Client Modal */}
      <Modal
        open={showEdit}
        onClose={() => setShowEdit(false)}
        title="Edit Client Information"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowEdit(false)}>Cancel</Button>
            <Button loading={updateMutation.isPending} onClick={() => updateMutation.mutate(editForm)}>Save Changes</Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Input label="Client Name *" value={editForm.name || ''} onChange={e => setEditForm((f: any) => ({ ...f, name: e.target.value }))} />
          </div>
          <Select label="Type" options={CLIENT_TYPES} value={editForm.type || 'company'} onChange={e => setEditForm((f: any) => ({ ...f, type: e.target.value }))} />
          <Select label="Status" options={STATUS_OPTIONS} value={editForm.status || 'active'} onChange={e => setEditForm((f: any) => ({ ...f, status: e.target.value }))} />
          <Select label="Industry" options={INDUSTRIES} value={editForm.industry || ''} onChange={e => setEditForm((f: any) => ({ ...f, industry: e.target.value }))} />
          <Input label="Email" type="email" value={editForm.email || ''} onChange={e => setEditForm((f: any) => ({ ...f, email: e.target.value }))} />
          <Input label="Phone" value={editForm.phone || ''} onChange={e => setEditForm((f: any) => ({ ...f, phone: e.target.value }))} />
          <Input label="Website" value={editForm.website || ''} onChange={e => setEditForm((f: any) => ({ ...f, website: e.target.value }))} />
          <Input label="Country" value={editForm.country || ''} onChange={e => setEditForm((f: any) => ({ ...f, country: e.target.value }))} />
          <Input label="City" value={editForm.city || ''} onChange={e => setEditForm((f: any) => ({ ...f, city: e.target.value }))} />
          <div className="col-span-2">
            <Textarea label="Internal Description" value={editForm.description || ''} onChange={e => setEditForm((f: any) => ({ ...f, description: e.target.value }))} rows={2} />
          </div>
        </div>
      </Modal>

      {/* Add Contact Modal */}
      <Modal
        open={showAddContact}
        onClose={() => setShowAddContact(false)}
        title="Add Client Contact"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowAddContact(false)}>Cancel</Button>
            <Button
              loading={addContactMutation.isPending}
              disabled={!contactForm.first_name || !contactForm.last_name}
              onClick={() => addContactMutation.mutate(contactForm)}
            >
              Add Contact
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input label="First Name *" value={contactForm.first_name} onChange={e => setContactForm(f => ({ ...f, first_name: e.target.value }))} />
            <Input label="Last Name *" value={contactForm.last_name} onChange={e => setContactForm(f => ({ ...f, last_name: e.target.value }))} />
          </div>
          <Input label="Email" type="email" value={contactForm.email} onChange={e => setContactForm(f => ({ ...f, email: e.target.value }))} />
          <Input label="Phone" value={contactForm.phone} onChange={e => setContactForm(f => ({ ...f, phone: e.target.value }))} />
          <Input label="Designation / Role" value={contactForm.designation} onChange={e => setContactForm(f => ({ ...f, designation: e.target.value }))} placeholder="e.g. Chief Technology Officer" />
          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={contactForm.is_primary}
              onChange={e => setContactForm(f => ({ ...f, is_primary: e.target.checked }))}
              className="rounded border-slate-300 text-blue-600"
            />
            Set as Primary Contact for this client
          </label>
        </div>
      </Modal>
    </DashboardLayout>
  );
}

