'use client';

import * as React from 'react';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { toast } from '@/hooks/use-toast';
import { FormDrawer } from '@/components/common/drawers/FormDrawer';
import { CrmScreen } from '@/modules/crm/CrmScreen';
import { approveOfflineRequest, billingError, billingGaps, loadOfflineRequests, rejectOfflineRequest, sessionCan } from '@/modules/customer/billing-api';

const inr = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(value) || 0);

export default function OfflinePaymentsPage() {
  const [allowed, setAllowed] = React.useState(false);
  const [rejecting, setRejecting] = React.useState(null);
  const [reason, setReason] = React.useState('');
  React.useEffect(() => setAllowed(sessionCan('PAYMENT') || sessionCan('SUBSCRIPTION') || sessionCan('CRM')), []);
  const load = React.useCallback((query) => loadOfflineRequests({ page: query.page, limit: 20, search: query.search || undefined, status: query.status || undefined }), []);
  return <>
    <CrmScreen title="Offline Payment Requests" description="Bank transfer, cash, and other offline requests. Approval uses the subscription service and does not mark an invoice paid from the browser." actionLabel="" canCreate={false} load={load}
      gap={{ title: 'Payment proof', detail: billingGaps.paymentProof }}
      stats={(result) => [{ label: 'Pending', value: result.summary?.pending }, { label: 'Approved', value: result.summary?.approved }, { label: 'Rejected', value: result.summary?.rejected }, { label: 'Total', value: result.summary?.total }]}
      filters={[{ key: 'status', label: 'All statuses', options: ['PENDING', 'SUCCESS', 'REJECTED', 'FAILED'].map((value) => ({ value, label: value })) }]}
      columns={[
        { header: 'Customer', cell: (row) => <div><p className="font-medium">{row.customerName}</p><p className="text-xs text-slate-500">{row.businessName}</p></div> },
        { header: 'Plan', accessorKey: 'planName' },
        { header: 'Amount', cell: (row) => inr(row.totalAmount) },
        { header: 'Method', cell: (row) => row.paymentMethodDetail || row.paymentMethod },
        { header: 'Reference', cell: (row) => row.transactionId || row.orderNumber },
        { header: 'Requested', cell: (row) => String(row.requestDate || '').slice(0, 10) },
        { header: 'Status', cell: (row) => <StatusBadge status={String(row.paymentStatus || '').toLowerCase()} /> },
      ]}
      rowActions={(reload) => allowed ? [
        { label: 'Approve', onSelect: async (row) => { try { await approveOfflineRequest(row.id); reload((value) => value + 1); toast.success('Offline payment approved'); } catch (error) { toast.error(billingError(error)); } } },
        { label: 'Reject', onSelect: (row) => { setRejecting({ row, reload }); setReason(''); } },
      ] : []}
      detail={(row) => <div className="space-y-1 text-sm"><p>{row.customerName} · {row.planName}</p><p>Base {inr(row.baseAmount)} · Tax {inr(row.gst)} · Total {inr(row.totalAmount)}</p><p>Reference {row.transactionId || '—'} · Order {row.orderNumber}</p><p>Subscription {row.subscriptionStatus} · Payment {row.paymentStatus}</p>{String(row.invoiceNumber || '').startsWith('http') && <a className="text-brand-dark underline" href={row.invoiceNumber} target="_blank" rel="noreferrer">Open attached reference</a>}</div>}
    />
    <FormDrawer open={Boolean(rejecting)} onOpenChange={(open) => { if (!open) setRejecting(null); }} title="Reject offline payment" description={rejecting?.row?.customerName || ''} onSubmit={async (event) => { event.preventDefault(); try { await rejectOfflineRequest(rejecting.row.id, reason); rejecting.reload((value) => value + 1); setRejecting(null); toast.success('Offline payment rejected'); } catch (error) { toast.error(billingError(error)); } }}>
      <Label className="grid gap-1 text-xs">Rejection reason<Input required value={reason} onChange={(event) => setReason(event.target.value)} /></Label>
    </FormDrawer>
  </>;
}
