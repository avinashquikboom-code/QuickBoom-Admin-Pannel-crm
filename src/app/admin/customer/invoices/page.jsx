'use client';

import * as React from 'react';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { toast } from '@/hooks/use-toast';
import { CrmScreen } from '@/modules/crm/CrmScreen';
import { billingError, billingGaps, createInvoice, downloadInvoice, loadInvoices, removeInvoice, sessionCan, updateInvoiceStatus } from '@/modules/customer/billing-api';

const STATUSES = ['DRAFT', 'SENT', 'PENDING', 'PAID', 'OVERDUE', 'CANCELLED'];
const inr = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(value) || 0);
const blank = { customerId: '', invoiceNo: '', issueDate: '', dueDate: '', subTotal: '', taxAmount: '', totalAmount: '', status: 'PENDING', notes: '' };

export default function InvoicesPage() {
  const [allowed, setAllowed] = React.useState(false);
  React.useEffect(() => setAllowed(sessionCan('CUSTOMER_INVOICES') || sessionCan('INVOICE') || sessionCan('CRM')), []);
  const load = React.useCallback((query) => loadInvoices({ page: query.page, limit: 20, search: query.search || undefined, status: query.status || undefined }), []);
  return <CrmScreen title="Invoices & Billing" description="Invoices returned by the invoice API. Totals are saved as entered." actionLabel="Create invoice" canCreate={allowed} load={load} blank={blank}
    gap={{ title: 'Invoice balances', detail: `${billingGaps.invoiceTotals} ${billingGaps.invoicePayments}` }}
    stats={(result) => [{ label: 'Total', value: result.summary?.totalInvoices ?? result.summary?.total }, { label: 'Paid', value: result.summary?.paidInvoices ?? result.summary?.paid }, { label: 'Pending', value: result.summary?.pendingPayments ?? result.summary?.pending }, { label: 'Overdue', value: result.summary?.overdueInvoices ?? result.summary?.overdue }]}
    filters={[{ key: 'status', label: 'All statuses', options: STATUSES.map((value) => ({ value, label: value })) }]}
    columns={[
      { header: 'Invoice', cell: (row) => row.invoiceNo || row.invoiceNumber },
      { header: 'Customer', cell: (row) => row.customerName || row.clientName },
      { header: 'Plan', cell: (row) => row.planName || '—' },
      { header: 'Issued', cell: (row) => String(row.issueDate || '').slice(0, 10) },
      { header: 'Due', cell: (row) => String(row.dueDate || '').slice(0, 10) || '—' },
      { header: 'Subtotal', cell: (row) => inr(row.subTotal) },
      { header: 'Tax', cell: (row) => inr(row.taxAmount) },
      { header: 'Total', cell: (row) => inr(row.totalAmount) },
      { header: 'Status', cell: (row) => <StatusBadge status={String(row.status || '').toLowerCase()} /> },
    ]}
    renderForm={(form, setForm) => <div className="grid gap-3 sm:grid-cols-2">
      <Field label="Customer id"><Input value={form.customerId || ''} onChange={(event) => setForm({ ...form, customerId: event.target.value })} /></Field>
      <Field label="Invoice number"><Input value={form.invoiceNo || ''} onChange={(event) => setForm({ ...form, invoiceNo: event.target.value })} /></Field>
      <Field label="Issue date"><Input type="date" value={String(form.issueDate || '').slice(0, 10)} onChange={(event) => setForm({ ...form, issueDate: event.target.value })} /></Field>
      <Field label="Due date"><Input type="date" value={String(form.dueDate || '').slice(0, 10)} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} /></Field>
      <Field label="Subtotal"><Input type="number" value={form.subTotal || ''} onChange={(event) => setForm({ ...form, subTotal: event.target.value })} /></Field>
      <Field label="Tax"><Input type="number" value={form.taxAmount || ''} onChange={(event) => setForm({ ...form, taxAmount: event.target.value })} /></Field>
      <Field label="Total"><Input required type="number" value={form.totalAmount || ''} onChange={(event) => setForm({ ...form, totalAmount: event.target.value })} /></Field>
      <Field label="Status"><select className="h-9 rounded-md border px-2 text-sm" value={form.status || 'PENDING'} onChange={(event) => setForm({ ...form, status: event.target.value })}>{STATUSES.map((status) => <option key={status}>{status}</option>)}</select></Field>
    </div>}
    onSave={async (form, id) => { if (id) await updateInvoiceStatus(id, form.status); else await createInvoice(form); toast.success(id ? 'Invoice status updated' : 'Invoice created'); }}
    rowActions={(reload) => [
      { label: 'Download PDF', onSelect: async (row) => { try { await downloadInvoice(row.id, row.invoiceNo); } catch (error) { toast.error(billingError(error)); } } },
      ...(allowed ? [{ label: 'Delete', onSelect: async (row) => { try { await removeInvoice(row.id); reload((value) => value + 1); } catch (error) { toast.error(billingError(error)); } } }] : []),
    ]}
    detail={(row) => <div className="space-y-1 text-sm"><p>{row.invoiceNo} · {row.customerName}</p><p>Subtotal {inr(row.subTotal)} · Tax {inr(row.taxAmount)} · Total {inr(row.totalAmount)}</p><p>Status {row.status} · Plan {row.planName || '—'}</p><p>{row.notes || 'No notes'}</p></div>}
  />;
}
function Field({ label, children }) { return <Label className="grid gap-1 text-xs">{label}{children}</Label>; }
