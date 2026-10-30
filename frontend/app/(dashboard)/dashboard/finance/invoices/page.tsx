'use client';

import { useState, useTransition, Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/app/(dashboard)/_components/layout/DashboardLayout';
import {
  Card, Button, SearchInput, Table, Tr, Td, StatusBadge, Pagination,
  Modal, Input, Select, StatCard, PageLoader, Alert
} from '@/components/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financeApi, clientsApi, projectsApi } from '@/lib/api';
import { formatDate, formatCurrency, extractApiError } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Plus, DollarSign, AlertTriangle, CheckCircle2, Clock, Eye,
  Send, CreditCard, Trash2, Printer, ExternalLink
} from 'lucide-react';
import Link from 'next/link';

const INVOICE_STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'viewed', label: 'Viewed' },
  { value: 'partial', label: 'Partially Paid' },
  { value: 'paid', label: 'Paid' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'cancelled', label: 'Cancelled' },
];

function InvoicesContent() {
  const qc = useQueryClient();
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialStatus = searchParams.get('status') || '';
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [showOverdue, setShowOverdue] = useState(initialStatus === 'overdue');

  useEffect(() => {
    const s = searchParams.get('status');
    if (s) {
      setStatusFilter(s);
      setShowOverdue(s === 'overdue');
    }
  }, [searchParams]);

  // Modals state
  const [newInvoiceModalOpen, setNewInvoiceModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  // New Invoice Form State
  const [newClient, setNewClient] = useState('');
  const [newProject, setNewProject] = useState('');
  const [newIssueDate, setNewIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [newDueDate, setNewDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });
  const [newCurrency, setNewCurrency] = useState('USD');
  const [newTaxPercent, setNewTaxPercent] = useState('0');
  const [newDiscountPercent, setNewDiscountPercent] = useState('0');
  const [newNotes, setNewNotes] = useState('');
  const [newTerms, setNewTerms] = useState('Payment is due within 14 days of invoice date.');
  const [newLineItems, setNewLineItems] = useState([
    { description: 'Cloud Engineering & Architecture Consulting', quantity: 1, unit_price: 5000 },
  ]);

  // Payment Form State
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('bank_transfer');
  const [payRef, setPayRef] = useState('');
  const [payNotes, setPayNotes] = useState('');

  // Queries
  const { data, isLoading } = useQuery({
    queryKey: ['invoices', { page, status: statusFilter, overdue: showOverdue, search }],
    queryFn: () =>
      financeApi.getInvoices({
        page,
        limit: 20,
        status: statusFilter || undefined,
        overdue: showOverdue ? 'true' : undefined,
        search: search.trim() || undefined,
      }).then(r => r.data),
  });

  const { data: summary } = useQuery({
    queryKey: ['invoice-summary'],
    queryFn: () => financeApi.getInvoiceSummary().then(r => r.data.data),
  });

  const { data: overdueList } = useQuery({
    queryKey: ['overdue-invoices'],
    queryFn: () => financeApi.getOverdueInvoices().then(r => r.data.data),
  });

  // Clients & Projects for dropdowns
  const { data: clientsData } = useQuery({
    queryKey: ['clients-lookup'],
    queryFn: () => clientsApi.list({ limit: 100 }).then(r => r.data.data || []),
    enabled: newInvoiceModalOpen,
  });

  const { data: projectsData } = useQuery({
    queryKey: ['projects-lookup'],
    queryFn: () => projectsApi.list({ limit: 100 }).then(r => r.data.data || []),
    enabled: newInvoiceModalOpen,
  });

  // Mutations
  const sendMutation = useMutation({
    mutationFn: (id: string) => financeApi.sendInvoice(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invoices'] });
      qc.invalidateQueries({ queryKey: ['invoice-summary'] });
      toast.success('Invoice marked as sent');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const createInvoiceMutation = useMutation({
    mutationFn: (payload: any) => financeApi.createInvoice(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invoices'] });
      qc.invalidateQueries({ queryKey: ['invoice-summary'] });
      qc.invalidateQueries({ queryKey: ['finance-overview'] });
      toast.success('New invoice created successfully');
      setNewInvoiceModalOpen(false);
      resetInvoiceForm();
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const paymentMutation = useMutation({
    mutationFn: (payload: any) => financeApi.createPayment(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invoices'] });
      qc.invalidateQueries({ queryKey: ['invoice-summary'] });
      qc.invalidateQueries({ queryKey: ['finance-overview'] });
      toast.success('Payment recorded & balance reconciled');
      setPaymentModalOpen(false);
      setSelectedInvoice(null);
      setPayAmount('');
      setPayRef('');
      setPayNotes('');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const resetInvoiceForm = () => {
    setNewClient('');
    setNewProject('');
    setNewTaxPercent('0');
    setNewDiscountPercent('0');
    setNewNotes('');
    setNewLineItems([{ description: 'Cloud Engineering & Consulting', quantity: 1, unit_price: 5000 }]);
  };

  const invoices = data?.data || [];
  const totalPages = Math.ceil((data?.total || 0) / 20);

  // Calculations for New Invoice Modal
  const calculatedSubtotal = newLineItems.reduce(
    (acc, item) => acc + (Number(item.quantity || 1) * Number(item.unit_price || 0)),
    0
  );
  const discountAmount = calculatedSubtotal * (Number(newDiscountPercent || 0) / 100);
  const taxableAmount = calculatedSubtotal - discountAmount;
  const taxAmount = taxableAmount * (Number(newTaxPercent || 0) / 100);
  const calculatedTotal = taxableAmount + taxAmount;

  const handleCreateInvoiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClient) {
      toast.error('Please select a client');
      return;
    }
    if (!newLineItems.length || newLineItems.some(item => !item.description || Number(item.unit_price) <= 0)) {
      toast.error('Please fill in all line items with a valid description and unit price');
      return;
    }

    createInvoiceMutation.mutate({
      client_id: newClient,
      project_id: newProject || null,
      issue_date: newIssueDate,
      due_date: newDueDate,
      currency: newCurrency,
      line_items: newLineItems,
      tax_percent: Number(newTaxPercent || 0),
      discount_percent: Number(newDiscountPercent || 0),
      notes: newNotes || undefined,
      terms: newTerms || undefined,
    });
  };

  const handleOpenPaymentModal = (inv: any) => {
    setSelectedInvoice(inv);
    const due = Math.max(0, parseFloat(inv.total_amount || 0) - parseFloat(inv.amount_paid || 0));
    setPayAmount(due > 0 ? due.toFixed(2) : '');
    setPaymentModalOpen(true);
  };

  const handleRecordPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    const amountVal = parseFloat(payAmount);
    const due = Math.max(0, parseFloat(selectedInvoice.total_amount || 0) - parseFloat(selectedInvoice.amount_paid || 0));
    if (isNaN(amountVal) || amountVal <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }
    if (amountVal > due) {
      toast.error(`Payment amount cannot exceed remaining balance of ${formatCurrency(due)}`);
      return;
    }

    paymentMutation.mutate({
      invoice_id: selectedInvoice.id,
      amount: amountVal,
      currency: selectedInvoice.currency || 'USD',
      method: payMethod,
      transaction_id: payRef || undefined,
      notes: payNotes || undefined,
      payment_date: new Date().toISOString(),
    });
  };

  const handleOpenViewModal = (inv: any) => {
    setSelectedInvoice(inv);
    setViewModalOpen(true);
  };

  return (
    <DashboardLayout title="Finance" breadcrumbs={[{ label: 'Finance' }, { label: 'Invoices' }]}>
      <div className="space-y-6">
        {/* 4 Summary Cards matching visual design */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="Total Invoiced"
            value={formatCurrency(summary?.total_invoiced || 0)}
            icon={<DollarSign className="w-5 h-5" />}
            color="blue"
          />
          <StatCard
            title="Collected"
            value={formatCurrency(summary?.total_collected || 0)}
            icon={<CheckCircle2 className="w-5 h-5" />}
            color="green"
          />
          <StatCard
            title="Outstanding"
            value={formatCurrency(summary?.outstanding_amount ?? Math.max(0, (summary?.total_invoiced || 0) - (summary?.total_collected || 0)))}
            icon={<Clock className="w-5 h-5" />}
            color="orange"
          />
          <StatCard
            title="Overdue"
            value={formatCurrency(summary?.overdue_amount || 0)}
            subtitle={`${summary?.overdue_count ?? overdueList?.length ?? 0} invoices`}
            icon={<AlertTriangle className="w-5 h-5" />}
            color="red"
          />
        </div>

        {/* Overdue Alert Banner */}
        {overdueList?.length > 0 && (
          <Alert type="warning">
            <strong>{overdueList.length} overdue invoices</strong> totaling{' '}
            {formatCurrency(overdueList.reduce((a: number, i: any) => a + parseFloat(i.total_amount || 0), 0))}.
            <button
              onClick={() => {
                if (showOverdue) {
                  setShowOverdue(false);
                  setStatusFilter('');
                } else {
                  setShowOverdue(true);
                  setStatusFilter('overdue');
                }
              }}
              className="ml-2 font-semibold underline text-amber-900 cursor-pointer"
            >
              {showOverdue ? 'Show all' : 'View overdue'}
            </button>
          </Alert>
        )}

        {/* Main Invoices Table Card */}
        <Card padding={false}>
          {/* Card Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 border-b border-slate-100">
            <div className="flex items-center gap-3 flex-wrap">
              <Select
                options={[{ value: '', label: 'All statuses' }, ...INVOICE_STATUSES]}
                value={statusFilter}
                onChange={e => {
                  setStatusFilter(e.target.value);
                  setShowOverdue(e.target.value === 'overdue');
                  setPage(1);
                }}
                containerClassName="w-40"
              />
              <div className="w-56">
                <SearchInput
                  placeholder="Search invoices..."
                  value={search}
                  onChange={v => {
                    setSearch(v);
                    setPage(1);
                  }}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                icon={<Plus className="w-4 h-4" />}
                onClick={() => setNewInvoiceModalOpen(true)}
              >
                New Invoice
              </Button>
            </div>
          </div>

          {/* Invoices Table */}
          <Table
            headers={['INVOICE #', 'CLIENT', 'STATUS', 'ISSUE DATE', 'DUE DATE', 'AMOUNT', 'PAID', 'ACTIONS']}
            loading={isLoading}
            empty={!invoices.length}
            emptyMessage="No invoices found matching your filters"
          >
            {invoices.map((inv: any) => {
              const due = Math.max(0, parseFloat(inv.total_amount || 0) - parseFloat(inv.amount_paid || 0));
              return (
                <Tr key={inv.id}>
                  <Td>
                    <Link
                      href={`/dashboard/finance/invoices/${inv.id}`}
                      className="font-mono text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {inv.invoice_number}
                    </Link>
                  </Td>
                  <Td>
                    <span className="font-medium text-slate-800">{inv.client_name || 'Acme Corporation'}</span>
                  </Td>
                  <Td>
                    <StatusBadge status={inv.status} />
                  </Td>
                  <Td>{formatDate(inv.issue_date)}</Td>
                  <Td className={inv.status === 'overdue' ? 'text-red-600 font-semibold' : 'text-slate-600'}>
                    {formatDate(inv.due_date)}
                  </Td>
                  <Td className="font-semibold text-slate-900">{formatCurrency(inv.total_amount, inv.currency)}</Td>
                  <Td className="font-semibold text-emerald-600">{formatCurrency(inv.amount_paid || 0, inv.currency)}</Td>
                  <Td>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Eye className="w-4 h-4 text-slate-500 hover:text-slate-700" />}
                        onClick={() => handleOpenViewModal(inv)}
                        title="Quick View"
                      />

                      {inv.status === 'draft' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Send className="w-4 h-4 text-blue-500 hover:text-blue-700" />}
                          onClick={() => sendMutation.mutate(inv.id)}
                          loading={sendMutation.isPending}
                          title="Send to Client"
                        />
                      )}

                      {due > 0 && inv.status !== 'cancelled' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<CreditCard className="w-4 h-4 text-emerald-600 hover:text-emerald-700" />}
                          onClick={() => handleOpenPaymentModal(inv)}
                          title="Record Payment"
                        />
                      )}
                    </div>
                  </Td>
                </Tr>
              );
            })}
          </Table>

          {/* Pagination */}
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} total={data?.total} limit={20} />
        </Card>

        {/* ─── CREATE NEW INVOICE MODAL ─── */}
        <Modal
          open={newInvoiceModalOpen}
          onClose={() => setNewInvoiceModalOpen(false)}
          title="Create New Invoice"
          size="lg"
        >
          <form onSubmit={handleCreateInvoiceSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Client *"
                options={[
                  { value: '', label: 'Select client...' },
                  ...(clientsData || []).map((c: any) => ({
                    value: c.id,
                    label: c.company_name || c.contact_name || 'Client',
                  })),
                ]}
                value={newClient}
                onChange={e => setNewClient(e.target.value)}
                required
              />

              <Select
                label="Project (Optional)"
                options={[
                  { value: '', label: 'None / Standalone' },
                  ...(projectsData || []).map((p: any) => ({
                    value: p.id,
                    label: p.name,
                  })),
                ]}
                value={newProject}
                onChange={e => setNewProject(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Issue Date *"
                type="date"
                value={newIssueDate}
                onChange={e => setNewIssueDate(e.target.value)}
                required
              />
              <Input
                label="Due Date *"
                type="date"
                value={newDueDate}
                onChange={e => setNewDueDate(e.target.value)}
                required
              />
              <Select
                label="Currency"
                options={[
                  { value: 'USD', label: 'USD ($)' },
                  { value: 'EUR', label: 'EUR (€)' },
                  { value: 'GBP', label: 'GBP (£)' },
                ]}
                value={newCurrency}
                onChange={e => setNewCurrency(e.target.value)}
              />
            </div>

            {/* Line items editor */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">Line Items</label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  icon={<Plus className="w-3.5 h-3.5" />}
                  onClick={() =>
                    setNewLineItems([
                      ...newLineItems,
                      { description: '', quantity: 1, unit_price: 1000 },
                    ])
                  }
                >
                  Add Item
                </Button>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {newLineItems.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="flex-1">
                      <Input
                        placeholder="Service / item description"
                        value={item.description}
                        onChange={e => {
                          const copy = [...newLineItems];
                          copy[idx].description = e.target.value;
                          setNewLineItems(copy);
                        }}
                      />
                    </div>
                    <div className="w-20">
                      <Input
                        type="number"
                        placeholder="Qty"
                        min="1"
                        value={item.quantity}
                        onChange={e => {
                          const copy = [...newLineItems];
                          copy[idx].quantity = Number(e.target.value);
                          setNewLineItems(copy);
                        }}
                      />
                    </div>
                    <div className="w-28">
                      <Input
                        type="number"
                        placeholder="Price"
                        min="0"
                        step="0.01"
                        value={item.unit_price}
                        onChange={e => {
                          const copy = [...newLineItems];
                          copy[idx].unit_price = Number(e.target.value);
                          setNewLineItems(copy);
                        }}
                      />
                    </div>
                    {newLineItems.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        icon={<Trash2 className="w-4 h-4 text-red-500" />}
                        onClick={() => {
                          const copy = newLineItems.filter((_, i) => i !== idx);
                          setNewLineItems(copy);
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Calculations breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    label="Discount (%)"
                    type="number"
                    min="0"
                    max="100"
                    value={newDiscountPercent}
                    onChange={e => setNewDiscountPercent(e.target.value)}
                  />
                  <Input
                    label="Tax (%)"
                    type="number"
                    min="0"
                    max="100"
                    value={newTaxPercent}
                    onChange={e => setNewTaxPercent(e.target.value)}
                  />
                </div>
                <Input
                  label="Internal Notes"
                  value={newNotes}
                  onChange={e => setNewNotes(e.target.value)}
                  placeholder="Optional internal notes"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1.5 self-end">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-mono font-medium">{formatCurrency(calculatedSubtotal, newCurrency)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount ({newDiscountPercent}%):</span>
                    <span className="font-mono font-medium">-{formatCurrency(discountAmount, newCurrency)}</span>
                  </div>
                )}
                {taxAmount > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Tax ({newTaxPercent}%):</span>
                    <span className="font-mono font-medium">+{formatCurrency(taxAmount, newCurrency)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-slate-900 pt-1.5 border-t border-slate-200">
                  <span>Total Amount:</span>
                  <span className="font-mono">{formatCurrency(calculatedTotal, newCurrency)}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setNewInvoiceModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" loading={createInvoiceMutation.isPending}>
                Create Invoice
              </Button>
            </div>
          </form>
        </Modal>

        {/* ─── RECORD PAYMENT MODAL ─── */}
        <Modal
          open={paymentModalOpen}
          onClose={() => {
            setPaymentModalOpen(false);
            setSelectedInvoice(null);
          }}
          title={selectedInvoice ? `Record Payment • ${selectedInvoice.invoice_number}` : 'Record Payment'}
          size="md"
        >
          {selectedInvoice && (
            <form onSubmit={handleRecordPaymentSubmit} className="space-y-4">
              <div className="p-3 rounded-lg bg-blue-50 border border-blue-100 text-xs text-blue-900 flex justify-between items-center">
                <div>
                  <p className="font-medium text-slate-900">{selectedInvoice.client_name}</p>
                  <p className="text-blue-700 mt-0.5">Total: {formatCurrency(selectedInvoice.total_amount)}</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-500">Remaining Balance</p>
                  <p className="font-bold text-base text-blue-900">
                    {formatCurrency(
                      Math.max(0, parseFloat(selectedInvoice.total_amount || 0) - parseFloat(selectedInvoice.amount_paid || 0))
                    )}
                  </p>
                </div>
              </div>

              <Input
                label="Payment Amount ($ USD) *"
                type="number"
                step="0.01"
                min="0.01"
                max={Math.max(0, parseFloat(selectedInvoice.total_amount || 0) - parseFloat(selectedInvoice.amount_paid || 0))}
                value={payAmount}
                onChange={e => setPayAmount(e.target.value)}
                placeholder="0.00"
                required
              />

              <Select
                label="Payment Method *"
                options={[
                  { value: 'bank_transfer', label: 'Bank Transfer / Wire' },
                  { value: 'credit_card', label: 'Credit Card' },
                  { value: 'stripe', label: 'Stripe' },
                  { value: 'paypal', label: 'PayPal' },
                  { value: 'cash', label: 'Cash' },
                  { value: 'other', label: 'Other' },
                ]}
                value={payMethod}
                onChange={e => setPayMethod(e.target.value)}
              />

              <Input
                label="Transaction / Reference ID"
                value={payRef}
                onChange={e => setPayRef(e.target.value)}
                placeholder="e.g. TXN-10928, Wire Ref #, etc."
              />

              <Input
                label="Reconciliation Notes"
                value={payNotes}
                onChange={e => setPayNotes(e.target.value)}
                placeholder="Optional payment notes..."
              />

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button type="button" variant="outline" size="sm" onClick={() => setPaymentModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" loading={paymentMutation.isPending}>
                  Confirm Payment & Reconcile
                </Button>
              </div>
            </form>
          )}
        </Modal>

        {/* ─── QUICK VIEW INVOICE MODAL ─── */}
        <Modal
          open={viewModalOpen}
          onClose={() => {
            setViewModalOpen(false);
            setSelectedInvoice(null);
          }}
          title={selectedInvoice ? `Invoice ${selectedInvoice.invoice_number}` : 'Invoice Details'}
          size="lg"
        >
          {selectedInvoice && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-semibold text-slate-900">{selectedInvoice.client_name}</h3>
                  <p className="text-xs text-slate-500">
                    Issued: {formatDate(selectedInvoice.issue_date)} • Due: {formatDate(selectedInvoice.due_date)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={selectedInvoice.status} />
                  <Link href={`/dashboard/finance/invoices/${selectedInvoice.id}`}>
                    <Button variant="outline" size="sm" icon={<ExternalLink className="w-3.5 h-3.5" />}>
                      Full Page View
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-lg text-xs">
                <div>
                  <span className="text-slate-400 font-medium">Total Billed:</span>
                  <p className="font-bold text-slate-900 text-sm">{formatCurrency(selectedInvoice.total_amount)}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Collected:</span>
                  <p className="font-bold text-emerald-600 text-sm">{formatCurrency(selectedInvoice.amount_paid || 0)}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Remaining Balance:</span>
                  <p className="font-bold text-blue-600 text-sm">
                    {formatCurrency(Math.max(0, parseFloat(selectedInvoice.total_amount || 0) - parseFloat(selectedInvoice.amount_paid || 0)))}
                  </p>
                </div>
              </div>

              {Math.max(0, parseFloat(selectedInvoice.total_amount || 0) - parseFloat(selectedInvoice.amount_paid || 0)) > 0 && (
                <div className="flex justify-end pt-2">
                  <Button
                    size="sm"
                    icon={<CreditCard className="w-4 h-4" />}
                    onClick={() => {
                      setViewModalOpen(false);
                      handleOpenPaymentModal(selectedInvoice);
                    }}
                  >
                    Record Payment
                  </Button>
                </div>
              )}
            </div>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  );
}

export default function InvoicesPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <InvoicesContent />
    </Suspense>
  );
}
