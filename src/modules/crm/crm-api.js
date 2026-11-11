import api from '../../../lib/api';
import { hrmError, listFrom, loadEmployees, sessionCan } from '@/modules/hrm/hrm-api';

export { hrmError as crmError, sessionCan, loadEmployees };

function bodyOf(payload) {
  if (payload?.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) return payload.data;
  return payload || {};
}

function pageOf(payload) {
  return payload?.pagination || payload?.meta || {};
}

export function personName(record) {
  if (!record) return '—';
  if (typeof record === 'string') return record;
  return record.name || `${record.firstName || ''} ${record.lastName || ''}`.trim() || record.employeeName || '—';
}

let capturePhotoIndex = null;
let capturePhotoIndexAt = 0;

function realCapturePhoto(item) {
  const url = typeof item === 'string' ? item : item?.url || '';
  const name = item && typeof item === 'object' ? String(item.name || item.photoReference || '') : '';
  if (/unsplash|pexels|placeholder|dummy|sample/i.test(`${url} ${name}`)) return '';
  if (url.startsWith('/api/v1/data-capture/photo')) return url;
  if (/^places\/[^/]+\/photos\/(?!\d{1,3}$)[^/?&]+$/.test(name)) return `/api/v1/data-capture/photo?ref=${encodeURIComponent(name)}`;
  if (/^https:\/\/lh3\.googleusercontent\.com\//.test(url)) return `/api/v1/data-capture/photo?ref=${encodeURIComponent(url)}`;
  return '';
}

function photosOf(place) {
  const raw = [...(Array.isArray(place?.googlePhotos) ? place.googlePhotos : []), ...(Array.isArray(place?.photos) ? place.photos : [])];
  return [...new Set(raw.map(realCapturePhoto).filter(Boolean))];
}

function hasLeadImage(row) {
  const images = Array.isArray(row?.images) ? row.images : [];
  return Boolean(row?.imageUrl || row?.imagePreview || images.some((image) => (typeof image === 'string' ? image : image?.url)));
}

async function capturePhotosByLead() {
  if (capturePhotoIndex && Date.now() - capturePhotoIndexAt < 120000) return capturePhotoIndex;
  const byLead = new Map();
  const byPlace = new Map();
  for (let page = 1; page <= 8; page += 1) {
    const payload = await api.get('/data-capture', { params: { page, limit: 100 } });
    const rows = listFrom(payload);
    rows.forEach((place) => {
      const photos = photosOf(place);
      if (!photos.length) return;
      if (place.importedLeadId) byLead.set(Number(place.importedLeadId), photos);
      if (place.googlePlaceId && !String(place.googlePlaceId).startsWith('custom_')) byPlace.set(place.googlePlaceId, photos);
    });
    const totalPages = Number(payload?.pagination?.totalPages || payload?.meta?.totalPages || 1);
    if (!rows.length || page >= totalPages) break;
  }
  capturePhotoIndex = { byLead, byPlace };
  capturePhotoIndexAt = Date.now();
  return capturePhotoIndex;
}

async function withCapturePhotos(rows) {
  if (!rows.some((row) => !hasLeadImage(row))) return rows;
  let index;
  try {
    index = await capturePhotosByLead();
  } catch {
    return rows;
  }
  return rows.map((row) => {
    if (hasLeadImage(row)) return row;
    const photos = index.byLead.get(Number(row.id)) || (row.googlePlaceId ? index.byPlace.get(row.googlePlaceId) : null);
    if (!photos?.length) return row;
    return {
      ...row,
      imageUrl: photos[0],
      images: photos.map((url, position) => ({ url, isPrimary: position === 0, source: 'GOOGLE_PLACES' })),
    };
  });
}

export async function listLeadPage(params = {}) {
  const list = await api.get('/leads', { params });
  return { rows: await withCapturePhotos(listFrom(list)), pagination: pageOf(list) };
}

export async function loadLeads(params = {}) {
  const [list, metrics, sources] = await Promise.all([
    api.get('/leads', { params }),
    api.get('/leads/metrics'),
    api.get('/master/lead-sources'),
  ]);
  return { rows: await withCapturePhotos(listFrom(list)), metrics: bodyOf(metrics), sources: listFrom(sources), pagination: pageOf(list) };
}

export function saveLead(values, id) {
  const body = {
    firstName: values.firstName,
    lastName: values.lastName,
    title: values.title || `${values.firstName || ''} ${values.lastName || ''}`.trim(),
    email: values.email || undefined,
    phone: values.phone || undefined,
    companyName: values.companyName || undefined,
    source: values.source || undefined,
    status: values.status || undefined,
    stageId: values.stageId ? Number(values.stageId) : undefined,
    priority: values.priority || undefined,
    assignedToId: values.assignedToId ? Number(values.assignedToId) : undefined,
    nextFollowUpDate: values.nextFollowUpDate || undefined,
    nextFollowUpTime: values.nextFollowUpTime || undefined,
    website: values.website || undefined,
    address: values.address || undefined,
    city: values.city || undefined,
    state: values.state || undefined,
    country: values.country || undefined,
    pincode: values.pincode || undefined,
    category: values.category || undefined,
    assignedTeam: values.assignedTeam || undefined,
    googlePlaceId: values.googlePlaceId || undefined,
    workNotes: values.workNotes || undefined,
    value: values.value === '' || values.value == null ? undefined : Number(values.value),
    socialMedia: values.socialMedia,
  };
  return id ? api.patch(`/leads/${id}`, body) : api.post('/leads', body);
}

export const checkLeadDuplicate = (values) => api.post('/leads/check-duplicate', {
  phone: values.phone || undefined,
  email: values.email || undefined,
  companyName: values.companyName || undefined,
  website: values.website || undefined,
  googlePlaceId: values.googlePlaceId || undefined,
});

export const searchGooglePlaces = (values) => api.post('/data-capture/extract', {
  categories: values.categories,
  searchLocation: values.searchLocation,
  keyword: Array.isArray(values.categories) ? values.categories.join(', ') : values.keyword,
  location: values.location || undefined,
  latitude: values.latitude ?? undefined,
  longitude: values.longitude ?? undefined,
  maxResults: values.maxResults ? Number(values.maxResults) : 20,
  strict: true,
});
export const suggestGoogleLocations = (input) => api.post('/data-capture/location-suggestions', { input });
export const resolveGoogleLocation = (placeId) => api.post('/data-capture/location-details', { placeId });

export const importGooglePlaces = (placeIds, jobId, places) => api.post('/data-capture/import-to-leads', { placeIds, jobId, places });
export const loadCapturedPlace = (id) => api.get(`/data-capture/${id}`);
export const bulkAssignLeads = (body) => api.post('/leads/bulk/assign', body);
export const bulkLeadStatus = (body) => api.post('/leads/bulk/status', body);
export const bulkLeadPriority = (body) => api.post('/leads/bulk/priority', body);
export const archiveLeads = (ids) => api.post('/leads/bulk-delete', { ids });

export const removeLead = (id) => api.delete(`/leads/${id}`);
export function uploadLeadImage(id, file) {
  const body = new FormData();
  body.append('image', file);
  return api.post(`/leads/${id}/images`, body);
}
export const convertLead = (id, values) => api.post(`/leads/${id}/convert`, values);
export const loadLeadNotes = async (id) => listFrom(await api.get(`/leads/${id}/notes`));
export const addLeadNote = (id, content) => api.post(`/leads/${id}/notes`, { content });
export const logFollowUp = (id, values) => api.post(`/leads/${id}/follow-ups`, values);

export async function loadCustomers(params = {}) {
  const [list, metrics] = await Promise.all([api.get('/customers', { params }), api.get('/customers/metrics')]);
  return { rows: listFrom(list), metrics: bodyOf(metrics), pagination: pageOf(list) };
}

export function saveCustomer(values, id) {
  const body = {
    name: values.name,
    companyName: values.companyName || undefined,
    email: values.email || undefined,
    phone: values.phone,
    customerType: values.customerType || undefined,
    industry: values.industry || undefined,
    status: values.status || undefined,
    assignedEmployeeId: values.assignedEmployeeId ? Number(values.assignedEmployeeId) : undefined,
    address: values.address || undefined,
    city: values.city || undefined,
    notes: values.notes || undefined,
  };
  return id ? api.patch(`/customers/${id}`, body) : api.post('/customers', body);
}

export const customerRelations = async (id) => {
  const [deals, visits, activities] = await Promise.all([
    api.get(`/customers/${id}/deals`),
    api.get(`/customers/${id}/visits`),
    api.get(`/customers/${id}/activities`),
  ]);
  return { deals: listFrom(deals), visits: listFrom(visits), activities: listFrom(activities) };
};

export async function loadDeals(params = {}) {
  const [list, metrics] = await Promise.all([api.get('/deals', { params }), api.get('/deals/metrics')]);
  return { rows: listFrom(list), metrics: bodyOf(metrics), pagination: pageOf(list), stages: list?.meta?.stages || pageOf(list)?.stages || [] };
}

export function saveDeal(values, id) {
  const body = {
    title: values.title,
    amount: Number(values.amount),
    leadId: values.leadId || undefined,
    contactId: values.contactId || undefined,
    companyId: values.companyId || undefined,
    assignedToId: values.assignedToId || undefined,
    expectedClosing: values.expectedClosing || undefined,
    probability: values.probability === '' ? undefined : Number(values.probability),
    source: values.source || undefined,
    currency: values.currency || 'INR',
    description: values.description || undefined,
    notes: values.notes || undefined,
    stageId: values.stageId ? String(values.stageId) : undefined,
    pipelineId: values.pipelineId ? String(values.pipelineId) : undefined,
    isWon: values.isWon,
    isLost: values.isLost,
  };
  return id ? api.patch(`/deals/${id}`, body) : api.post('/deals', body);
}

export async function loadLeadStages() {
  const payload = await api.get('/leads/stages', { params: { includeInactive: 'true' } });
  return listFrom(payload).map((stage) => ({ ...stage, type: 'Lead', order: stage.sortOrder ?? stage.order ?? 0 }));
}

export function saveLeadStage(values, id) {
  const body = {
    ...(values.name != null ? { name: String(values.name).trim() } : {}),
    ...(values.color ? { color: values.color } : {}),
    ...(values.bgColor ? { bgColor: values.bgColor } : {}),
    ...(values.borderColor ? { borderColor: values.borderColor } : {}),
    ...(values.order === '' || values.order == null ? {} : { sortOrder: Number(values.order) }),
    ...(values.isActive == null ? {} : { isActive: values.isActive !== false }),
    ...(values.emailEnabled == null ? {} : { emailEnabled: values.emailEnabled !== false }),
    ...(values.whatsappEnabled == null ? {} : { whatsappEnabled: values.whatsappEnabled !== false }),
    ...(values.emailTemplateId !== undefined ? { emailTemplateId: Number(values.emailTemplateId) || 0 } : {}),
    ...(values.whatsappTemplateId !== undefined ? { whatsappTemplateId: Number(values.whatsappTemplateId) || 0 } : {}),
  };
  return id ? api.patch(`/leads/stages/${id}`, body) : api.post('/leads/stages', body);
}

export async function loadLeadStage(id) {
  const payload = await api.get(`/leads/stages/${id}`);
  return payload?.data?.id ? payload.data : payload;
}
export const removeLeadStage = (id) => api.delete(`/leads/stages/${id}`);
export const reassignLeadStage = (id, targetStageId) => api.post(`/leads/stages/${id}/reassign`, { targetStageId: Number(targetStageId) });

export async function loadDealStages(activeOnly = false) {
  const payload = await api.get('/deals/stages', { params: activeOnly ? { active: 'true' } : {} });
  const body = bodyOf(payload);
  const stages = Array.isArray(body.stages) ? body.stages : Array.isArray(payload?.stages) ? payload.stages : [];
  return {
    pipelineId: body.pipelineId || payload?.pipelineId,
    stages: [...stages]
      .map((stage) => ({ ...stage, dealsCount: Number(stage.dealsCount ?? stage._count?.deals ?? 0) }))
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.id - b.id),
  };
}

export function saveDealStage(values, id) {
  const body = {
    ...(values.name != null ? { name: String(values.name).trim() } : {}),
    ...(values.order === '' || values.order == null ? {} : { order: Number(values.order) }),
    ...(values.probability === '' || values.probability == null ? {} : { probability: Number(values.probability) }),
    ...(values.description == null ? {} : { description: values.description }),
    ...(values.color ? { color: values.color } : {}),
    ...(values.isActive == null ? {} : { isActive: values.isActive !== false }),
  };
  return id ? api.patch(`/deals/stages/${id}`, body) : api.post('/deals/stages', body);
}

export async function loadDealStage(id) {
  const payload = await api.get(`/deals/stages/${id}`);
  return payload?.data?.id ? payload.data : payload;
}
export const removeDealStage = (id) => api.delete(`/deals/stages/${id}`);
export const reassignDealStage = (id, targetStageId) => api.post(`/deals/stages/${id}/reassign`, { targetStageId: Number(targetStageId) });
export const bulkDealStages = (ids, action) => api.post('/deals/stages/bulk', { ids, action });
export const moveDealStage = (id, stageId) => api.patch(`/deals/${id}/stage`, { stageId: String(stageId) });
export const removeDeal = (id) => api.delete(`/deals/${id}`);
export const removeDeals = (ids) => api.post('/deals/bulk-delete', { ids });

export async function loadContacts(params = {}) {
  const [list, metrics] = await Promise.all([api.get('/contacts', { params }), api.get('/contacts/metrics')]);
  return { rows: listFrom(list), metrics: bodyOf(metrics), pagination: pageOf(list) };
}

export function saveContact(values, id) {
  const body = {
    firstName: values.firstName,
    lastName: values.lastName,
    email: values.email || undefined,
    phone: values.phone || undefined,
    designation: values.designation || undefined,
    companyId: values.companyId || undefined,
    type: values.type || undefined,
    status: values.status || undefined,
    assignedToId: values.assignedToId || undefined,
    notes: values.notes || undefined,
  };
  return id ? api.patch(`/contacts/${id}`, body) : api.post('/contacts', body);
}

export const removeContact = (id) => api.delete(`/contacts/${id}`);

export async function loadCompanies(params = {}) {
  const [list, metrics] = await Promise.all([api.get('/companies', { params }), api.get('/companies/metrics')]);
  return { rows: listFrom(list), metrics: bodyOf(metrics), pagination: pageOf(list) };
}

export function saveCompany(values, id) {
  const body = {
    name: values.name,
    industry: values.industry || undefined,
    website: values.website || undefined,
    email: values.email || undefined,
    phone: values.phone || undefined,
    address: values.address || undefined,
    city: values.city || undefined,
    state: values.state || undefined,
    status: values.status || undefined,
    notes: values.notes || undefined,
  };
  return id ? api.patch(`/companies/${id}`, body) : api.post('/companies', body);
}

export const removeCompany = (id) => api.delete(`/companies/${id}`);

export async function loadVisits(params = {}) {
  const [list, metrics] = await Promise.all([api.get('/visits', { params }), api.get('/visits/metrics')]);
  return { rows: listFrom(list), metrics: bodyOf(metrics), pagination: pageOf(list) };
}

export function saveVisit(values, id) {
  const body = {
    employeeId: values.employeeId || undefined,
    companyId: values.companyId || undefined,
    leadId: values.leadId || undefined,
    dealId: values.dealId || undefined,
    customerName: values.customerName,
    purpose: values.purpose,
    visitType: values.visitType || undefined,
    date: values.date,
    time: values.time || undefined,
    location: values.location,
    status: values.status || undefined,
    notes: values.notes || undefined,
    latitude: values.latitude === '' ? undefined : Number(values.latitude),
    longitude: values.longitude === '' ? undefined : Number(values.longitude),
  };
  return id ? api.patch(`/visits/${id}`, body) : api.post('/visits', body);
}

export const removeVisit = (id) => api.delete(`/visits/${id}`);

export async function loadTasks(params = {}) {
  const [list, metrics, statuses, types] = await Promise.all([
    api.get('/tasks', { params }),
    api.get('/tasks/metrics'),
    api.get('/master/task-statuses'),
    api.get('/master/activity-types'),
  ]);
  return { rows: listFrom(list), metrics: bodyOf(metrics), statuses: listFrom(statuses), types: listFrom(types), pagination: pageOf(list) };
}

export function saveTask(values, id) {
  const body = id
    ? { title: values.title, description: values.description, priority: values.priority, status: values.status, employeeId: values.employeeId || undefined, dueDate: values.dueDate, dueTime: values.dueTime, notes: values.notes || undefined }
    : { title: values.title, description: values.description, priority: values.priority, employeeId: values.employeeId || undefined, dueDate: values.dueDate, dueTime: values.dueTime, category: values.category || undefined, notes: values.notes || undefined };
  return id ? api.patch(`/tasks/${id}`, body) : api.post('/tasks', body);
}

export const taskHistory = async (id) => listFrom(await api.get(`/tasks/${id}/history`));
export const removeTask = (id) => api.delete(`/tasks/${id}`);

export async function loadLeadLimits() {
  const [employees, roles] = await Promise.all([
    api.get('/lead-generation-limits/employees'),
    api.get('/lead-generation-limits/roles'),
  ]);
  return { employees: listFrom(employees), roles: listFrom(roles) };
}

export const saveEmployeeLimit = (employeeId, values) => api.put(`/lead-generation-limits/employees/${employeeId}`, {
  dailyLimit: values.dailyLimit === '' ? null : Number(values.dailyLimit),
  monthlyLimit: values.monthlyLimit === '' ? null : Number(values.monthlyLimit),
});

export const saveRoleLimit = (values) => api.post('/lead-generation-limits/roles', {
  roleName: values.roleName,
  dailyLimit: Number(values.dailyLimit),
  monthlyLimit: Number(values.monthlyLimit),
  isActive: values.isActive !== false,
});

export async function loadActivities(params = {}) {
  const [list, stats] = await Promise.all([api.get('/audit-logs', { params }), api.get('/audit-logs/stats')]);
  return { rows: listFrom(list), metrics: bodyOf(stats), pagination: pageOf(list) };
}

export async function loadSalesReports(params = {}) {
  const [summary, leads, deals, customers, revenueRows, visitRows] = await Promise.all([
    api.get('/reports/summary', { params }),
    api.get('/leads/metrics'),
    api.get('/deals/metrics'),
    api.get('/customers/metrics'),
    api.get('/reports/data', { params: { ...params, type: 'REVENUE' } }),
    api.get('/reports/data', { params: { ...params, type: 'VISITS' } }),
  ]);
  return {
    summary: bodyOf(summary),
    leads: bodyOf(leads),
    deals: bodyOf(deals),
    customers: bodyOf(customers),
    revenueRows: listFrom(revenueRows),
    visitRows: listFrom(visitRows),
  };
}

export async function loadCrmLookups() {
  const [employees, companies, contacts, leads] = await Promise.all([
    loadEmployees().catch(() => []),
    loadCompanies({ page: 1, limit: 100 }).then((result) => result.rows).catch(() => []),
    loadContacts({ page: 1, limit: 100 }).then((result) => result.rows).catch(() => []),
    loadLeads({ page: 1, limit: 100 }).then((result) => result.rows).catch(() => []),
  ]);
  return { employees, companies, contacts, leads };
}

export const crmGaps = {
  followUps: 'Follow-ups are stored on leads. There is no separate follow-up collection, reminder, or calendar API. This page lists leads that include a next follow-up date and logs outcomes through POST /leads/:id/follow-ups.',
  activities: 'CRM activity history is the audit log. There is no separate create-activity endpoint. Tasks, visits, and lead follow-ups are the records that can be created.',
  leadImport: 'The lead API has no import or export route.',
  salesEmployee: 'There is no sales-employee performance or lead-source report endpoint. Source and employee charts are not shown unless those aggregates are returned.',
  dealHistory: 'Deal records include stage, value, and status. There is no separate deal-history endpoint.',
};

// ==========================================
// SEND DETAILS API
// ==========================================

export async function loadSendDetailsDocuments() {
  const res = await api.get('/admin/send-details/documents');
  return res.data || res;
}

export async function createSendDetailsDocument(payload) {
  const res = await api.post('/admin/send-details/documents', payload);
  return res.data || res;
}

export async function updateSendDetailsDocument(id, payload) {
  const res = await api.patch(`/admin/send-details/documents/${id}`, payload);
  return res.data || res;
}

export async function deleteSendDetailsDocument(id) {
  const res = await api.delete(`/admin/send-details/documents/${id}`);
  return res.data || res;
}

export async function uploadSendDetailsFile(file) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.post('/admin/send-details/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data || res;
}

export async function loadSendDetailsConfig() {
  const res = await api.get('/admin/send-details/config');
  return res.data || res;
}

export async function updateSendDetailsConfig(payload) {
  const res = await api.patch('/admin/send-details/config', payload);
  return res.data || res;
}

export async function loadSendDetailsHistory(leadId) {
  const url = leadId ? `/admin/send-details/leads/${leadId}/history` : '/admin/send-details/history';
  const res = await api.get(url);
  return res.data || res;
}

export async function manualSendDetails(leadId, payload) {
  const res = await api.post(`/admin/send-details/leads/${leadId}/send`, payload);
  return res.data || res;
}

export async function retrySendDetails(deliveryId, payload = { channel: 'ALL' }) {
  const res = await api.post(`/admin/send-details/deliveries/${deliveryId}/retry`, payload);
  return res.data || res;
}

