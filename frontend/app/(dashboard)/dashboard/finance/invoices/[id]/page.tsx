'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/app/(dashboard)/_components/layout/DashboardLayout';
import {
  Card, Button, StatusBadge, PageLoader, Alert, Tr, Td, Table, Modal, Input, Select
} from '@/components/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financeApi } from '@/lib/api';
import { formatDate, formatCurrency, extractApiError } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Printer, Send, CreditCard, DollarSign, Calendar,
  Building, Mail, Phone, FileText, CheckCircle2, Clock
} from 'lucide-react';
import Link from 'next/link';

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const invoiceId = resolvedParams.id;
  const router = useRouter();
  const qc = useQueryClient();

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('bank_transfer');
  const [payRef, setPayRef] = useState('');
  const [payNotes, setPayNotes] = useState('');

  const { data: invoice, isLoading, isError } = useQuery({
    queryKey: ['invoice-detail', invoiceId],
    queryFn: () => financeApi.getInvoice(invoiceId).then(r => r.data.data),
  });

  const sendMutation = useMutation({
    mutationFn: (id: string) => financeApi.sendInvoice(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invoice-detail', invoiceId] });
      qc.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Invoice sent to client successfully');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const paymentMutation = useMutation({
    mutationFn: (data: any) => financeApi.createPayment(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invoice-detail', invoiceId] });
      qc.invalidateQueries({ queryKey: ['invoices'] });
      qc.invalidateQueries({ queryKey: ['invoice-summary'] });
      qc.invalidateQueries({ queryKey: ['finance-overview'] });
      toast.success('Payment recorded and reconciled successfully');
      setPaymentModalOpen(false);
      setPayAmount('');
      setPayRef('');
      setPayNotes('');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  if (isLoading) {
    return (
      <DashboardLayout title="Invoice Details" breadcrumbs={[{ label: 'Finance' }, { label: 'Invoices', href: '/dashboard/finance/invoices' }, { label: 'Loading...' }]}>
        <PageLoader />
      </DashboardLayout>
    );
  }

  if (isError || !invoice) {
    return (
      <DashboardLayout title="Invoice Not Found" breadcrumbs={[{ label: 'Finance' }, { label: 'Invoices', href: '/dashboard/finance/invoices' }, { label: 'Error' }]}>
        <Alert type="error">Invoice not found or could not be loaded.</Alert>
        <div className="mt-4">
          <Link href="/dashboard/finance/invoices">
            <Button variant="outline" icon={<ArrowLeft className="w-4 h-4" />}>Back to Invoices</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const lineItems = Array.isArray(invoice.line_items) ? invoice.line_items : [];
  const payments = Array.isArray(invoice.payments) ? invoice.payments : [];
  const totalAmount = parseFloat(invoice.total_amount || 0);
  const amountPaid = parseFloat(invoice.amount_paid || 0);
  const amountDue = Math.max(0, totalAmount - amountPaid);

  const handleOpenPayment = () => {
    setPayAmount(amountDue > 0 ? amountDue.toFixed(2) : '');
    setPaymentModalOpen(true);
  };

  const handleRecordPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(payAmount);
    if (isNaN(val) || val <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }
    if (val > amountDue) {
      toast.error(`Payment amount cannot exceed remaining balance of ${formatCurrency(amountDue)}`);
      return;
    }
    paymentMutation.mutate({
      invoice_id: invoice.id,
      amount: val,
      currency: invoice.currency || 'USD',
      method: payMethod,
      transaction_id: payRef || undefined,
      notes: payNotes || undefined,
      payment_date: new Date().toISOString(),
    });
  };

  return (
    <DashboardLayout
      title={`Invoice ${invoice.invoice_number}`}
      breadcrumbs={[
        { label: 'Finance' },
        { label: 'Invoices', href: '/dashboard/finance/invoices' },
        { label: invoice.invoice_number },
      ]}
    >
      <div className="space-y-6 max-w-5xl mx-auto print:max-w-none print:m-0 print:p-0">
        {/* Top Action Bar (hidden when printing) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
          <Link href="/dashboard/finance/invoices">
            <Button variant="ghost" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
              Back to Invoices
            </Button>
          </Link>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={<Printer className="w-4 h-4" />}
              onClick={() => window.print()}
            >
              Print Invoice
            </Button>

            {invoice.status === 'draft' && (
              <Button
                variant="outline"
                size="sm"
                icon={<Send className="w-4 h-4" />}
                loading={sendMutation.isPending}
                onClick={() => sendMutation.mutate(invoice.id)}
              >
                Send Invoice
              </Button>
            )}

            {amountDue > 0 && invoice.status !== 'cancelled' && (
              <Button
                size="sm"
                icon={<CreditCard className="w-4 h-4" />}
                onClick={handleOpenPayment}
              >
                Record Payment
              </Button>
            )}
          </div>
        </div>

        {/* Invoice Document Card */}
        <Card padding={false} className="border border-slate-200 shadow-sm print:shadow-none print:border-none">
          {/* Header Banner */}
          <div className="p-6 sm:p-8 border-b border-slate-100 flex flex-col sm:flex-row sm:items-start justify-between gap-6">
            <div>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-black tracking-tight text-slate-900">SYSMAIRA</span>
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono font-semibold">
                  OFFICIAL INVOICE
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Enterprise Cloud & Digital Engineering Solutions</p>
              <p className="text-xs text-slate-400">billing@sysmaira.com | +1 (800) 555-0199</p>
            </div>

            <div className="sm:text-right">
              <h1 className="text-xl sm:text-2xl font-mono font-bold text-slate-900 tracking-tight">
                {invoice.invoice_number}
              </h1>
              <div className="mt-2 flex sm:justify-end">
                <StatusBadge status={invoice.status} />
              </div>
            </div>
          </div>

          {/* Invoice Meta Grid */}
          <div className="p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 border-b border-slate-100 bg-slate-50/50">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Billed To</p>
              <h3 className="font-semibold text-slate-900">{invoice.client_name || 'Client'}</h3>
              {invoice.client_email && (
                <p className="text-xs text-slate-600 flex items-center gap-1.5 mt-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" /> {invoice.client_email}
                </p>
              )}
              {invoice.client_phone && (
                <p className="text-xs text-slate-600 flex items-center gap-1.5 mt-0.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" /> {invoice.client_phone}
                </p>
              )}
              {invoice.billing_address ? (
                <p className="text-xs text-slate-500 mt-1">
                  {typeof invoice.billing_address === 'string' ? invoice.billing_address : JSON.stringify(invoice.billing_address)}
                </p>
              ) : (
                (invoice.city || invoice.country) && (
                  <p className="text-xs text-slate-500 mt-1">
                    {[invoice.city, invoice.country].filter(Boolean).join(', ')}
                  </p>
                )
              )}
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Invoice Details</p>
              <p className="text-xs text-slate-600">
                <span className="text-slate-400 font-medium">Issue Date:</span> {formatDate(invoice.issue_date)}
              </p>
              <p className="text-xs text-slate-600 mt-1">
                <span className="text-slate-400 font-medium">Due Date:</span>{' '}
                <span className={invoice.status === 'overdue' ? 'text-red-600 font-semibold' : ''}>
                  {formatDate(invoice.due_date)}
                </span>
              </p>
              {invoice.project_name && (
                <p className="text-xs text-slate-600 mt-1">
                  <span className="text-slate-400 font-medium">Project:</span> {invoice.project_name}
                </p>
              )}
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Payment Summary</p>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Billed:</span>
                  <span className="font-semibold text-slate-800">{formatCurrency(totalAmount, invoice.currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Amount Paid:</span>
                  <span className="font-semibold text-emerald-600">{formatCurrency(amountPaid, invoice.currency)}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200">
                  <span className="font-semibold text-slate-700">Remaining Balance:</span>
                  <span className={`font-bold ${amountDue > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
                    {formatCurrency(amountDue, invoice.currency)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="p-6 sm:p-8">
            <h4 className="text-sm font-semibold text-slate-800 mb-3">Line Items</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-2.5 px-3">Item Description</th>
                    <th className="py-2.5 px-3 text-right">Quantity</th>
                    <th className="py-2.5 px-3 text-right">Unit Price</th>
                    <th className="py-2.5 px-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lineItems.length > 0 ? (
                    lineItems.map((item: any, i: number) => {
                      const qty = Number(item.quantity || 1);
                      const rate = Number(item.unit_price || 0);
                      const total = qty * rate;
                      return (
                        <tr key={i} className="hover:bg-slate-50/50">
                          <td className="py-3 px-3">
                            <p className="font-medium text-slate-800">{item.description || item.name || `Service Item #${i + 1}`}</p>
                            {item.notes && <p className="text-xs text-slate-400">{item.notes}</p>}
                          </td>
                          <td className="py-3 px-3 text-right text-slate-600 font-mono">{qty}</td>
                          <td className="py-3 px-3 text-right text-slate-600 font-mono">{formatCurrency(rate, invoice.currency)}</td>
                          <td className="py-3 px-3 text-right font-semibold text-slate-900 font-mono">{formatCurrency(total, invoice.currency)}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-slate-400 text-xs">
                        No specific line items recorded. Single invoice contract.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Calculations Breakdown */}
            <div className="mt-6 flex justify-end">
              <div className="w-full max-w-xs space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-mono font-medium">{formatCurrency(invoice.subtotal || totalAmount, invoice.currency)}</span>
                </div>
                {Number(invoice.discount_amount || 0) > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Discount:</span>
                    <span className="font-mono text-emerald-600">-{formatCurrency(invoice.discount_amount, invoice.currency)}</span>
                  </div>
                )}
                {Number(invoice.tax_amount || 0) > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Tax:</span>
                    <span className="font-mono">+{formatCurrency(invoice.tax_amount, invoice.currency)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                  <span>Total Amount:</span>
                  <span className="font-mono">{formatCurrency(totalAmount, invoice.currency)}</span>
                </div>
                <div className="flex justify-between text-xs font-semibold text-emerald-700">
                  <span>Paid to Date:</span>
                  <span className="font-mono">-{formatCurrency(amountPaid, invoice.currency)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold pt-2 border-t border-slate-300">
                  <span>Amount Due:</span>
                  <span className={`font-mono ${amountDue > 0 ? 'text-blue-600' : 'text-slate-900'}`}>
                    {formatCurrency(amountDue, invoice.currency)}
                  </span>
                </div>
              </div>
            </div>

            {/* Notes & Terms */}
            {(invoice.notes || invoice.terms) && (
              <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-500">
                {invoice.notes && (
                  <div>
                    <span className="font-semibold text-slate-700 block mb-1">Notes:</span>
                    <p className="whitespace-pre-wrap">{invoice.notes}</p>
                  </div>
                )}
                {invoice.terms && (
                  <div>
                    <span className="font-semibold text-slate-700 block mb-1">Terms & Conditions:</span>
                    <p className="whitespace-pre-wrap">{invoice.terms}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Payment Receipts History */}
          {payments.length > 0 && (
            <div className="border-t border-slate-100 p-6 sm:p-8 bg-slate-50/30">
              <h4 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Payment History & Receipts
              </h4>
              <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white overflow-hidden text-xs">
                {payments.map((p: any) => (
                  <div key={p.id} className="p-3 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-800">{formatCurrency(p.amount, p.currency)}</p>
                      <p className="text-slate-400 mt-0.5">
                        {formatDate(p.paid_at || p.created_at)} • via <span className="capitalize">{p.method?.replace(/_/g, ' ') || 'transfer'}</span>
                        {p.gateway_txn_id && ` • Ref: ${p.gateway_txn_id}`}
                      </p>
                      {p.notes && <p className="text-slate-500 mt-0.5 italic">{p.notes}</p>}
                    </div>
                    <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Completed
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Record Payment Modal */}
        <Modal
          open={paymentModalOpen}
          onClose={() => setPaymentModalOpen(false)}
          title={`Record Payment for ${invoice.invoice_number}`}
          size="md"
        >
          <form onSubmit={handleRecordPaymentSubmit} className="space-y-4">
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-100 text-xs text-blue-800 flex justify-between items-center">
              <div>
                <p className="font-medium">Client: {invoice.client_name}</p>
                <p className="text-blue-600 mt-0.5">Invoice Total: {formatCurrency(totalAmount)}</p>
              </div>
              <div className="text-right">
                <p className="text-slate-500">Remaining Balance</p>
                <p className="font-bold text-base text-blue-900">{formatCurrency(amountDue)}</p>
              </div>
            </div>

            <Input
              label="Payment Amount ($ USD) *"
              type="number"
              step="0.01"
              min="0.01"
              max={amountDue}
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
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
              onChange={(e) => setPayMethod(e.target.value)}
            />

            <Input
              label="Transaction / Reference ID"
              value={payRef}
              onChange={(e) => setPayRef(e.target.value)}
              placeholder="e.g. TXN-984214, Wire Ref, etc."
            />

            <Input
              label="Notes"
              value={payNotes}
              onChange={(e) => setPayNotes(e.target.value)}
              placeholder="Internal reconciliation notes..."
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
        </Modal>
      </div>
    </DashboardLayout>
  );
}
