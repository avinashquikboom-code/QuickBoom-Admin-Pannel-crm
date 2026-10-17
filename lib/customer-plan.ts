export interface CustomerSubscription {
  id: number;
  status: string;
  plan?: { name: string };
  createdAt?: string;
  activationDate?: string | null;
  startDate?: string;
  endDate?: string;
  checkout?: {
    billingCycle?: string;
    basePaise?: number;
    discountPaise?: number;
    taxablePaise?: number;
    gstPaise?: number;
    totalPaise?: number;
    taxRateBps?: number;
    status?: string;
    createdAt?: string;
    paymentId?: string | null;
    orderId?: string | null;
    paymentHistoryId?: number | null;
  };
}

export function subscriptionStatus(subscription: CustomerSubscription, now = Date.now()): string {
  if (subscription.status === 'CANCELLED') return 'Cancelled';
  if (subscription.status === 'EXPIRED' || (subscription.endDate && Date.parse(subscription.endDate) <= now)) return 'Expired';
  if (subscription.status === 'PENDING_ACTIVATION') return 'Pending Activation';
  if (subscription.status === 'ACTIVE') return 'Active';
  return subscription.status?.replace(/_/g, ' ').toLowerCase() || 'Unknown';
}

export function customerPlanSummary(subscriptions: CustomerSubscription[], now = Date.now()) {
  const paid = (s: CustomerSubscription) => s.checkout?.status === 'PAID';
  const active = subscriptions.find(s => paid(s) && subscriptionStatus(s, now) === 'Active' && !!s.startDate && Date.parse(s.startDate) <= now);
  const pending = subscriptions.find(s => paid(s) && subscriptionStatus(s, now) === 'Pending Activation');
  const latest = [...subscriptions].sort((a, b) => b.id - a.id)[0];
  return { active, pending, displayed: active || pending || latest, hasPlan: Boolean(active || pending) };
}

export function planMoney(paise?: number): string {
  return typeof paise === 'number' && Number.isFinite(paise)
    ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(paise / 100)
    : 'Not available';
}
