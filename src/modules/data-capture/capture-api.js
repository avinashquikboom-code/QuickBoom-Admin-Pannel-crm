import api from '../../../lib/api';
import { pageOf, rowsOf, sessionCan } from '@/modules/customer/billing-api';
import { crmError } from '@/modules/crm/crm-api';

export { crmError as captureError, sessionCan, rowsOf, pageOf };

export async function loadCaptures(params = {}) {
  const payload = await api.get('/data-capture', { params });
  return { rows: rowsOf(payload), pagination: pageOf(payload), total: payload?.total ?? payload?.pagination?.total ?? payload?.data?.pagination?.total };
}

export async function loadCaptureUsage() {
  const payload = await api.get('/data-capture/usage');
  const body = payload?.data && !Array.isArray(payload.data) && payload.data.totalLeadsCaptured != null ? payload.data : payload;
  return body || {};
}

export async function loadCaptureHistory() {
  const payload = await api.get('/data-capture/history');
  return rowsOf(payload);
}

export async function loadCaptureSessions(params = {}) {
  const payload = await api.get('/data-capture/sessions', { params });
  const body = payload?.data && !Array.isArray(payload.data) ? payload.data : payload;
  return {
    rows: Array.isArray(payload?.data) ? payload.data : rowsOf(payload),
    summary: payload?.summary || body?.summary || {},
    meta: payload?.meta || body?.meta || {},
    pagination: payload?.pagination || body?.pagination || {},
  };
}

export const loadCaptureSession = (jobId) => api.get(`/data-capture/sessions/${encodeURIComponent(jobId)}`);
export const retryFailedCapture = (jobId) => api.post(`/data-capture/sessions/${encodeURIComponent(jobId)}/retry-failed`, {});

export function exportCaptureSessions(params = {}, format = 'csv') {
  return api.get('/data-capture/sessions/export', { params: { ...params, format }, responseType: 'blob' });
}

export function createCapture(values) {
  return api.post('/data-capture', {
    businessName: values.businessName,
    category: values.category || undefined,
    address: values.address || undefined,
    phone: values.phone || undefined,
    email: values.email || undefined,
    website: values.website || undefined,
    source: values.source || undefined,
    notes: values.notes || undefined,
  });
}

export function updateCapture(id, values) {
  return api.patch(`/data-capture/${id}`, {
    businessName: values.businessName,
    category: values.category || undefined,
    address: values.address || undefined,
    phone: values.phone || undefined,
    email: values.email || undefined,
    website: values.website || undefined,
    source: values.source || undefined,
    status: values.status || undefined,
    notes: values.notes || undefined,
  });
}

export const removeCapture = (id) => api.delete(`/data-capture/${id}`);
export const validateCapture = (id) => api.post(`/data-capture/${id}/validate`);
export const rejectCapture = (id, reason) => api.post(`/data-capture/${id}/reject`, { reason });
export const createLeadFromCapture = (id) => api.post(`/data-capture/${id}/create-lead`, {});

export function extractPlaces(values) {
  return api.post('/data-capture/extract', {
    keyword: values.keyword || undefined,
    location: values.location || undefined,
    category: values.category || undefined,
    city: values.city || undefined,
    maxResults: values.maxResults === '' ? undefined : Number(values.maxResults),
  });
}

export const captureGaps = {
  dates: 'The capture list can be filtered by status, source, category, and job. It does not accept a date range, so today and monthly totals are not shown separately.',
  sources: 'Capture source is a field on each record, usually GOOGLE_PLACES. There is no separate source directory to create, activate, or delete.',
  export: 'The data-capture API has no export endpoint.',
  quota: 'Quota, remaining allowance, captured records, and Google API calls come from GET /data-capture/usage. This screen does not replace those numbers with subscription math.',
  history: 'Usage history is the extraction job list. There is no separate daily usage series.',
};
