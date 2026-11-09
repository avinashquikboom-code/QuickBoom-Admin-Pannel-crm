'use client';

import * as React from 'react';
import { StatusBadge } from '@/components/common/StatusBadge';
import { toast } from '@/hooks/use-toast';
import { CrmScreen } from '@/modules/crm/CrmScreen';
import { billingError, changeSubscriptionPlan, deactivateSubscription, loadPlans, loadSubscriptions, renewSubscription, sessionCan } from '@/modules/customer/billing-api';

const inr = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value) || 0);

export default function SubscriptionsPage() {
  const [allowed, setAllowed] = React.useState(false);
  const [plans, setPlans] = React.useState([]);
  React.useEffect(() => { setAllowed(sessionCan('SUBSCRIPTION') || sessionCan('CUSTOMER_PLANS') || sessionCan('CRM')); loadPlans().then(setPlans).catch(() => setPlans([])); }, []);
  const load = React.useCallback((query) => loadSubscriptions({ page: query.page, limit: 20, search: query.search || undefined, status: query.status || undefined }), []);
  return <CrmScreen title="Active Subscriptions" description="Customer subscriptions, plan, billing cycle, and expiry from the subscription API." canCreate={false} load={load}
    stats={(result) => [{ label: 'Listed total', value: result.summary?.total }, { label: 'Active', value: result.summary?.totalActive }, { label: 'Expired', value: result.summary?.expired }, { label: 'Expiring in 10 days', value: result.summary?.expiring10 }]}
    filters={[{ key: 'status', label: 'All statuses', options: ['ACTIVE', 'EXPIRED', 'PENDING', 'CANCELLED'].map((value) => ({ value, label: value })) }]}
    columns={[
      { header: 'Customer', cell: (row) => <div><p className="font-medium">{row.customerName}</p><p className="text-xs text-slate-500">{row.customerEmail}</p></div> },
      { header: 'Plan', accessorKey: 'planName' },
      { header: 'Price', cell: (row) => inr(row.price) },
      { header: 'Cycle', cell: (row) => row.billingCycle || '—' },
      { header: 'Start', cell: (row) => String(row.startDate || '').slice(0, 10) },
      { header: 'Expiry', cell: (row) => String(row.expiryDate || '').slice(0, 10) },
      { header: 'Days left', cell: (row) => row.daysRemaining ?? '—' },
      { header: 'Status', cell: (row) => <StatusBadge status={String(row.status || '').toLowerCase()} /> },
    ]}
    rowActions={(reload) => allowed ? [
      { label: 'Renew', onSelect: async (row) => { try { await renewSubscription(row.id); reload((value) => value + 1); toast.success('Renewal requested'); } catch (error) { toast.error(billingError(error)); } } },
      { label: 'Change plan', onSelect: async (row) => { const planId = window.prompt(`New plan id. Available: ${plans.map((plan) => `${plan.id} ${plan.name}`).join(', ')}`, String(row.planId || '')); if (!planId) return; try { await changeSubscriptionPlan(row.id, planId); reload((value) => value + 1); } catch (error) { toast.error(billingError(error)); } } },
      { label: 'Deactivate', onSelect: async (row) => { try { await deactivateSubscription(row.id); reload((value) => value + 1); } catch (error) { toast.error(billingError(error)); } } },
    ] : []}
    detail={(row) => <p className="text-sm">{row.customerName} · {row.planName} · {row.billingCycle || 'No billing cycle'} · {inr(row.price)} · {row.duration} {row.durationUnit} · Assigned {row.assignedEmployee || '—'}</p>}
  />;
}
