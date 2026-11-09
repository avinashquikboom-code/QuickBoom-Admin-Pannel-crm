import api from '../../../lib/api';
import { crmError, sessionCan } from '@/modules/crm/crm-api';

export { crmError as billingError, sessionCan };

export function rowsOf(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.items)) return payload.items;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.data?.items)) return payload.data.items;
  if (Array.isArray(payload.data?.data)) return payload.data.data;
  return [];
}

export function pageOf(payload) {
  return payload?.pagination || payload?.data?.pagination || payload?.meta || payload?.data?.meta || {};
}

export function summaryOf(payload) {
  if (!payload || typeof payload !== 'object') return {};
  if (payload.summary && typeof payload.summary === 'object') return payload.summary;
  if (payload.data?.summary && typeof payload.data.summary === 'object') return payload.data.summary;
  if (payload.counts && typeof payload.counts === 'object') return payload.counts;
  if (payload.data?.counts && typeof payload.data.counts === 'object') return payload.data.counts;
  if (payload.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) return payload.data;
  return {};
}

export async function loadCustomerMetrics() {
  return summaryOf(await api.get('/customers/metrics'));
}

export async function loadCustomers(params = {}) {
  const payload = await api.get('/customers', { params });
  return { rows: rowsOf(payload), pagination: pageOf(payload), summary: summaryOf(payload) };
}

export async function loadInvoices(params = {}) {
  const payload = await api.get('/invoices', { params });
  return { rows: rowsOf(payload), pagination: pageOf(payload), summary: summaryOf(payload) };
}

export function createInvoice(values) {
  return api.post('/invoices', {
    customerId: values.customerId ? Number(values.customerId) : undefined,
    invoiceNo: values.invoiceNo || undefined,
    issueDate: values.issueDate || undefined,
    dueDate: values.dueDate || undefined,
    subTotal: values.subTotal === '' ? undefined : Number(values.subTotal),
    taxAmount: values.taxAmount === '' ? undefined : Number(values.taxAmount),
    totalAmount: Number(values.totalAmount),
    status: values.status || undefined,
    notes: values.notes || undefined,
  });
}

export function updateInvoiceStatus(id, status) {
  return api.patch(`/invoices/${id}`, { status });
}

export const removeInvoice = (id) => api.delete(`/invoices/${id}`);

export async function downloadInvoice(id, invoiceNo) {
  const data = await api.get(`/invoices/${id}/download`, { responseType: 'blob' });
  const blob = data instanceof Blob ? data : new Blob([data], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${invoiceNo || `invoice-${id}`}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}

export async function loadSubscriptions(params = {}) {
  const payload = await api.get('/admin/subscriptions', { params });
  return { rows: rowsOf(payload), pagination: pageOf(payload), summary: payload?.counts || payload?.data?.counts || summaryOf(payload) };
}

export async function loadPlans() {
  const payload = await api.get('/admin/plans');
  return rowsOf(payload);
}

export const deactivateSubscription = (id) => api.post(`/admin/subscriptions/${id}/deactivate`);
export const renewSubscription = (id) => api.post(`/admin/subscriptions/${id}/renew`);
export const changeSubscriptionPlan = (id, newPlanId) => api.post(`/admin/subscriptions/${id}/change-plan`, { newPlanId: Number(newPlanId) });

export async function loadOfflineRequests(params = {}) {
  const payload = await api.get('/admin/offline-requests', { params });
  return { rows: rowsOf(payload), pagination: pageOf(payload), summary: payload?.counts || payload?.data?.counts || {} };
}

export const approveOfflineRequest = (id) => api.post(`/admin/offline-requests/${id}/approve`);
export const rejectOfflineRequest = (id, reason) => api.post(`/admin/offline-requests/${id}/reject`, { reason });

export async function loadResourceUsage(params = {}) {
  const payload = await api.get('/customers/usage', { params });
  return { rows: rowsOf(payload), pagination: pageOf(payload), summary: summaryOf(payload) };
}

export async function loadBillingOverview(params = {}) {
  const [customers, invoices, subscriptions, revenue] = await Promise.all([
    api.get('/customers/metrics'),
    api.get('/invoices', { params: { page: 1, limit: 8, ...params } }),
    api.get('/admin/subscriptions', { params: { page: 1, limit: 8 } }),
    api.get('/reports/summary', { params }),
  ]);
  const recentCustomers = await api.get('/customers', { params: { page: 1, limit: 8, sortBy: 'createdAt', sortOrder: 'desc', dateFrom: params.dateFrom, dateTo: params.dateTo, status: params.status } });
  return {
    customers: summaryOf(customers),
    invoices: summaryOf(invoices),
    recentInvoices: rowsOf(invoices),
    subscriptions: subscriptions?.counts || subscriptions?.data?.counts || {},
    revenue: (summaryOf(revenue).revenue) || {},
    recentCustomers: rowsOf(recentCustomers),
  };
}

export const billingGaps = {
  coupons: 'A coupon record exists in the database, but there is no coupon list, create, update, or delete API. Banner coupon codes are a different marketing feature.',
  invoiceTotals: 'Invoice totals are stored by the invoice API. This screen sends the amounts you enter and does not recalculate tax or balance.',
  invoicePayments: 'The invoice list returns status, subtotal, tax, and total. It does not return a separate paid amount, outstanding balance, or payment-history list.',
  usageApi: 'Resource usage returns employees, leads, and storage against plan limits. It does not return API request usage.',
  growthChart: 'There is no customer-growth or monthly revenue series endpoint. Charts are limited to the aggregate counts the APIs return.',
  paymentProof: 'Offline requests return the transaction reference, method, amount, and status. A separate uploaded proof file is not included in the list response.',
};
