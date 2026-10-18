'use client';

import React, { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CreditCard } from 'lucide-react';
import api from '@/lib/api';
import { customersApi } from '@/lib/customers-api';
import { getErrorMessage } from '@/lib/utils';
import { customerPlanSummary, CustomerSubscription, planMoney, subscriptionStatus } from '@/lib/customer-plan';
import { AdminFormDrawer } from '../dialogs/AdminFormDrawer';

interface Props {
  customer: { id: number; companyName: string };
  onClose: () => void;
  canAssignPlan: boolean;
}
const date = (value?: string | null) => value && Number.isFinite(Date.parse(value))
  ? new Date(value).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })
  : 'Not available';

function SubscriptionCard({ subscription }: { subscription: CustomerSubscription }) {
  const checkout = subscription.checkout;
  const status = subscriptionStatus(subscription);
  const interval = checkout?.billingCycle === 'MONTHLY' ? 'Monthly' : checkout?.billingCycle === 'YEARLY' ? 'Yearly' : 'Not available';
  const fields = [
    ['Billing interval', interval],
    ['Base price', planMoney(checkout?.basePaise)],
    ...(checkout?.discountPaise ? [['Discount', `−${planMoney(checkout.discountPaise)}`]] : []),
    ['Taxable amount', planMoney(checkout?.taxablePaise)],
    [`GST${typeof checkout?.taxRateBps === 'number' ? ` (${checkout.taxRateBps / 100}%)` : ''}`, planMoney(checkout?.gstPaise)],
    ['Final payable amount', planMoney(checkout?.totalPaise)],
    ['Purchase date', date(checkout?.createdAt || subscription.createdAt)],
    ['Scheduled activation date', date(subscription.activationDate || subscription.startDate)],
    ['Activation date', ['Active', 'Expired'].includes(status) ? date(subscription.startDate) : 'Not activated / not available'],
    ['Expiry date', date(subscription.endDate)],
    ['Payment status', checkout?.status?.replace(/_/g, ' ') || 'Not available'],
    ['Transaction reference', checkout?.paymentId || (checkout?.paymentHistoryId ? `Payment #${checkout.paymentHistoryId}` : 'Not available')],
    ['Order reference', checkout?.orderId || 'Not available'],
  ];
  return <section className="space-y-4 rounded-2xl border border-emerald-200 bg-white p-4">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h3 className="font-bold text-slate-900">{subscription.plan?.name || 'Plan name unavailable'}</h3>
      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">{status}</span>
    </div>
    <dl className="divide-y divide-slate-100 text-sm">{fields.map(([label, value]) => <div key={label} className="grid grid-cols-2 gap-4 py-2.5">
      <dt className="text-slate-500">{label}</dt><dd className="break-words text-right font-medium text-slate-900">{value}</dd>
    </div>)}</dl>
    <p className="text-xs text-slate-500">Amounts are from the saved checkout. Dates are shown in India Standard Time.</p>
  </section>;
}

export function CustomerPlanDrawer({ customer, onClose, canAssignPlan }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const isValidId = Number.isSafeInteger(Number(customer?.id)) && Number(customer?.id) > 0;
  const query = useQuery({
    queryKey: ['customer-plan', customer?.id],
    enabled: isValidId,
    queryFn: async ({ signal }) => {
      const result = await customersApi.getDetails(customer.id, signal);
      if (result?.id !== customer.id || !Array.isArray(result?.subscriptions)) throw new Error('Customer plan details could not be verified.');
      return result as { id: number; companyName: string; subscriptions: CustomerSubscription[] };
    },
    staleTime: 0,
    retry: false,
  });
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    root.current?.querySelector<HTMLButtonElement>('button')?.focus();
    const trapFocus = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const items = Array.from(root.current?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], [tabindex="0"]') || []);
      const first = items[0], last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', trapFocus);
    return () => { document.removeEventListener('keydown', trapFocus); previous?.focus({ preventScroll: true }); };
  }, []);
  const summary = customerPlanSummary(query.data?.subscriptions || []);
  return <div ref={root} role="dialog" aria-modal="true" aria-label={`Subscription plan for ${customer.companyName}`}>
    <AdminFormDrawer isOpen onClose={onClose} title="Customer Plan" description={`${query.data?.companyName || customer.companyName} · ${isValidId ? `CUST-${String(customer.id).padStart(4, '0')} (ID: ${customer.id})` : 'Invalid Identifier'}`} icon={CreditCard} size="xl" hideFooter>
      {!isValidId ? (
        <div role="alert" className="space-y-3 rounded-2xl bg-amber-50 p-6 text-center text-sm text-amber-900">
          <p className="font-bold">Invalid Customer Identifier</p>
          <p className="text-xs text-amber-700">Customer ID &quot;{String(customer?.id)}&quot; is not a valid customer identifier. Customer IDs must be positive integers.</p>
        </div>
      ) : query.isLoading ? <p role="status" className="py-12 text-center text-sm text-slate-500">Loading subscription details…</p>
        : query.isError ? <div role="alert" className="space-y-3 rounded-2xl bg-rose-50 p-4 text-sm text-rose-800">
          <p>{getErrorMessage(query.error)}</p><button type="button" onClick={() => query.refetch()} className="rounded-lg border border-rose-200 bg-white px-3 py-2 font-semibold">Retry</button>
        </div> : <div className="space-y-4">
          <div className="break-words"><p className="font-bold">{query.data?.companyName}</p><p className="text-xs text-slate-500">Customer ID: {customer.id}</p></div>
          {!summary.hasPlan && <div role="status" className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-center">
            <h3 className="font-bold">No Active Plan</h3><p className="mt-1 text-sm text-slate-500">{summary.displayed ? 'The latest subscription is shown below for reference.' : 'No subscription has been purchased for this customer.'}</p>
          </div>}
          {summary.displayed && <SubscriptionCard subscription={summary.displayed} />}
          {summary.active && summary.pending && <div className="space-y-2"><h3 className="font-semibold text-slate-800">Upcoming subscription</h3><SubscriptionCard subscription={summary.pending} /></div>}
        </div>}
    </AdminFormDrawer>
  </div>;
}
