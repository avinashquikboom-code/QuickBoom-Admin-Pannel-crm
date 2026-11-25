import api from '../../../lib/api';
import { downloadPdfFromEndpoint } from '../../../lib/pdf-download.util';
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

export async function loadCustomerMetrics(params = {}) {
  return summaryOf(await api.get('/customers/metrics', { params }));
}

export async function loadCustomers(params = {}) {
  const payload = await api.get('/customers', { params });
  return { rows: rowsOf(payload), pagination: pageOf(payload), summary: summaryOf(payload) };
}

export async function loadInvoices(params = {}) {
  const payload = await api.get('/invoices', { params });
  return {
    rows: rowsOf(payload),
    pagination: pageOf(payload),
    summary: summaryOf(payload),
    counts: payload?.counts || payload?.data?.counts || {},
  };
}

export async function loadUpcomingBilling(params = {}) {
  const payload = await api.get('/invoices/upcoming-billing', { params });
  return rowsOf(payload);
}

export async function recordInvoicePayment(id, values) {
  return api.post(`/invoices/${id}/record-payment`, values);
}

export async function getInvoicePayments(id) {
  const payload = await api.get(`/invoices/${id}/payments`);
  return rowsOf(payload);
}

export async function downloadPaymentReceipt(invoiceId, paymentId, receiptNo) {
  return downloadPdfFromEndpoint(`/invoices/${invoiceId}/payments/${paymentId}/receipt`, `${receiptNo || `QuikBoom_Payment_Receipt_${paymentId}`}.pdf`, { loadingMessage: 'Preparing receipt…', successMessage: 'Receipt downloaded' });
}

export async function rescheduleInvoiceInstallment(id, values) {
  return api.post(`/invoices/${id}/reschedule-installment`, values);
}

export async function generateInvoicePaymentLink(id, values) {
  return api.post(`/invoices/${id}/payment-link`, values);
}

export async function sendInvoiceCommunication(id, values) {
  return api.post(`/invoices/${id}/send-communication`, values);
}

export async function cancelInvoice(id, reason) {
  return api.post(`/invoices/${id}/cancel`, { reason });
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
export const bulkDeleteInvoices = (ids) => api.post('/invoices/bulk-delete', { ids });

export async function downloadInvoice(id, invoiceNo) {
  return downloadPdfFromEndpoint(`/invoices/${id}/download`, `QuikBoom_Invoice_${invoiceNo || id}.pdf`, { loadingMessage: 'Preparing invoice…', successMessage: 'Invoice downloaded' });
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
export const activateSubscription = (id) => api.post(`/admin/subscriptions/${id}/activate`);
export const renewSubscription = (id) => api.post(`/admin/subscriptions/${id}/renew`);
export const changeSubscriptionPlan = (id, newPlanId) => api.post(`/admin/subscriptions/${id}/change-plan`, { newPlanId: Number(newPlanId) });
export const deleteSubscription = (id) => api.delete(`/admin/subscriptions/${id}`);
export const bulkDeleteSubscriptions = (ids) => api.post('/admin/subscriptions/bulk-delete', { ids });

export async function loadOfflineRequests(params = {}) {
  const payload = await api.get('/admin/offline-requests', { params });
  return { rows: rowsOf(payload), pagination: pageOf(payload), summary: payload?.counts || payload?.data?.counts || {} };
}

export const approveOfflineRequest = (id) => api.post(`/admin/offline-requests/${id}/approve`);
export const rejectOfflineRequest = (id, reason) => api.post(`/admin/offline-requests/${id}/reject`, { reason });
export const deleteOfflineRequest = (id) => api.delete(`/admin/subscriptions/offline-requests/${id}`);
export const bulkDeleteOfflineRequests = (ids) => api.post('/admin/subscriptions/offline-requests/bulk-delete', { ids });

export async function loadResourceUsage(params = {}) {
  try {
    const payload = await api.get('/customers/usage', { params });
    return { rows: rowsOf(payload), pagination: pageOf(payload), summary: summaryOf(payload) };
  } catch (err) {
    if (err?.response?.status === 404 || err?.status === 404) {
      try {
        const payload = await api.get('/customers/resource-consumption', { params });
        return { rows: rowsOf(payload), pagination: pageOf(payload), summary: summaryOf(payload) };
      } catch {
        throw err;
      }
    }
    throw err;
  }
}

export async function loadBillingOverview(params = {}) {
  const queryParams = {
    ...params,
    fromDate: params.fromDate || params.dateFrom || undefined,
    toDate: params.toDate || params.dateTo || undefined,
    dateFrom: params.dateFrom || params.fromDate || undefined,
    dateTo: params.dateTo || params.toDate || undefined,
  };
  const [customers, invoices, subscriptions, revenue] = await Promise.all([
    api.get('/customers/metrics', { params: queryParams }),
    api.get('/invoices', { params: { page: 1, limit: 8, ...queryParams } }),
    api.get('/admin/subscriptions', { params: { page: 1, limit: 8, ...queryParams } }),
    api.get('/reports/summary', { params: { dateFrom: queryParams.dateFrom, dateTo: queryParams.dateTo } }),
  ]);
  const recentCustomers = await api.get('/customers', {
    params: { page: 1, limit: 50, sortBy: 'createdAt', sortOrder: 'desc', dateFrom: queryParams.dateFrom, dateTo: queryParams.dateTo, status: queryParams.status, wonOnly: true },
  });
  const customerSummary = summaryOf(customers);
  const invoiceSummary = summaryOf(invoices);
  const reportRevenue = summaryOf(revenue)?.revenue || revenue?.revenue || revenue?.data?.revenue || {};
  return {
    customers: customerSummary,
    monthlyGrowth: customerSummary?.monthlyGrowth || customers?.data?.monthlyGrowth || customers?.monthlyGrowth || [],
    invoices: invoiceSummary,
    invoiceCounts: invoices?.counts || invoices?.data?.counts || {},
    recentInvoices: rowsOf(invoices),
    subscriptions: subscriptions?.counts || subscriptions?.data?.counts || {},
    revenue: {
      ...reportRevenue,
      totalCollectedAmount: invoiceSummary?.totalCollectedAmount ?? reportRevenue?.totalCollectedAmount ?? reportRevenue?.totalRevenue ?? 0,
      totalBilledAmount: invoiceSummary?.totalBilledAmount ?? reportRevenue?.totalBilledAmount ?? 0,
      outstandingBalance: invoiceSummary?.outstandingBalance ?? reportRevenue?.outstandingBalance ?? 0,
      onlineCollections: invoiceSummary?.onlineCollections ?? reportRevenue?.onlineCollections ?? 0,
      offlineCollections: invoiceSummary?.offlineCollections ?? reportRevenue?.offlineCollections ?? 0,
      upcomingBillingAmount: invoiceSummary?.upcomingBillingAmount ?? reportRevenue?.upcomingBillingAmount ?? 0,
    },
    recentCustomers: rowsOf(recentCustomers),
  };
}

export async function loadCoupons(params = {}) {
  const payload = await api.get('/admin/coupons', { params });
  return {
    rows: rowsOf(payload),
    pagination: pageOf(payload),
    summary: summaryOf(payload),
  };
}

export async function loadCouponStats() {
  const payload = await api.get('/admin/coupons/stats');
  const stats = payload?.data || payload;
  if (!stats || typeof stats !== 'object') {
    throw new Error('Coupon statistics response was empty or invalid.');
  }
  return stats;
}

export async function getCoupon(id) {
  const payload = await api.get(`/admin/coupons/${id}`);
  return payload?.data || payload;
}

export function createCoupon(data) {
  return api.post('/admin/coupons', data);
}

export function updateCoupon(id, data) {
  return api.patch(`/admin/coupons/${id}`, data);
}

export function setCouponStatus(id, isActive) {
  return api.patch(`/admin/coupons/${id}/status`, { isActive });
}

export function deleteCoupon(id) {
  return api.delete(`/admin/coupons/${id}`);
}

export const billingGaps = {
  coupons: 'A coupon record exists in the database, but there is no coupon list, create, update, or delete API. Banner coupon codes are a different marketing feature.',
  invoiceTotals: 'Invoice totals are stored by the invoice API. This screen sends the amounts you enter and does not recalculate tax or balance.',
  invoicePayments: 'The invoice list returns status, subtotal, tax, and total. It does not return a separate paid amount, outstanding balance, or payment-history list.',
  usageApi: 'Resource usage returns employees, leads, and storage against plan limits. It does not return API request usage.',
  growthChart: 'There is no customer-growth or monthly revenue series endpoint. Charts are limited to the aggregate counts the APIs return.',
  paymentProof: 'Offline requests return the transaction reference, method, amount, and status. A separate uploaded proof file is not included in the list response.',
};
