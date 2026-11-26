import api from '../../../lib/api';
import { pageOf, rowsOf, sessionCan } from '@/modules/customer/billing-api';
import { crmError } from '@/modules/crm/crm-api';

export { crmError as suiteError, sessionCan, rowsOf, pageOf };

const list = (url, params) => api.get(url, { params }).then((payload) => ({ rows: rowsOf(payload), pagination: pageOf(payload), payload }));

export const loadTrending = (query = {}) => list('/admin/trending', { search: query.search, category: query.category, page: query.page, limit: 20 });
export const saveTrending = (values, id) => id ? api.patch(`/admin/trending/${id}`, trendingBody(values)) : api.post('/admin/trending', trendingBody(values));
export const removeTrending = (id) => api.delete(`/admin/trending/${id}`);
export const publishTrending = (id, isPublished) => api.patch(`/admin/trending/${id}/publish`, { isPublished });

async function requestWithFallback(paths, caller) {
  let lastError;
  for (const path of paths) {
    try {
      return await caller(path);
    } catch (err) {
      lastError = err;
      if (err?.response?.status === 404 || err?.code === 'ERR_BLOCKED_BY_CLIENT' || !err?.response) {
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

function bannerListRows(payload) {
  const candidates = [
    payload,
    payload?.items,
    payload?.banners,
    payload?.data,
    payload?.data?.items,
    payload?.data?.banners,
    payload?.data?.data,
    payload?.data?.data?.items,
  ];
  const rows = candidates.find(Array.isArray);
  return rows || [];
}

export const loadBanners = async (query = {}) => {
  let isActive = undefined;
  let isPublished = undefined;
  if (query.status === 'ACTIVE') isActive = true;
  else if (query.status === 'INACTIVE') isActive = false;
  else if (query.status === 'PUBLISHED') isPublished = true;
  else if (query.status === 'UNPUBLISHED') isPublished = false;

  const params = {
    search: query.search || undefined,
    isActive: query.isActive !== undefined ? query.isActive : isActive,
    isPublished: query.isPublished !== undefined ? query.isPublished : isPublished,
    page: query.page || 1,
    limit: query.limit || 20,
  };

  const payload = await requestWithFallback(
    ['/admin/marketing/banners', '/admin/content/banners', '/admin/banners'],
    (url) => api.get(url, { params })
  );

  return {
    rows: bannerListRows(payload),
    pagination: pageOf(payload),
    payload,
  };
};

export const loadBannerStats = async () => {
  const response = await requestWithFallback(
    ['/admin/marketing/banners/stats', '/admin/content/banners/stats', '/admin/banners/stats'],
    (url) => api.get(url)
  );
  const stats = response?.data?.stats || response?.data || response?.stats || response;
  return {
    total: typeof stats?.total === 'number' ? stats.total : Number(stats?.total) || 0,
    active: typeof stats?.active === 'number' ? stats.active : Number(stats?.active) || 0,
    inactive: typeof stats?.inactive === 'number' ? stats.inactive : Number(stats?.inactive) || 0,
    lastUpdated: stats?.lastUpdated || null,
  };
};

export const getBanner = (id) =>
  requestWithFallback(
    [`/admin/marketing/banners/${id}`, `/admin/content/banners/${id}`, `/admin/banners/${id}`],
    (url) => api.get(url).then((res) => res?.data || res)
  );

export const saveBanner = (values, id, file = null) => {
  if (file instanceof File) {
    const formData = new FormData();
    formData.append('image', file);
    if (values.title !== undefined) formData.append('title', values.title?.trim() || '');
    if (values.subtitle !== undefined) formData.append('subtitle', values.subtitle?.trim() || '');
    if (values.description !== undefined) formData.append('description', values.description?.trim() || '');
    if (values.ctaText !== undefined) formData.append('ctaText', values.ctaText?.trim() || '');
    if (values.ctaUrl !== undefined) formData.append('ctaUrl', values.ctaUrl?.trim() || '');
    if (values.actionType !== undefined) formData.append('actionType', values.actionType?.trim() || '');
    formData.append(
      'priority',
      String(values.priority !== undefined && values.priority !== '' ? Number(values.priority) || 0 : 0),
    );
    if (values.isActive !== undefined)
      formData.append('isActive', String(Boolean(values.isActive)));
    if (values.isPublished !== undefined)
      formData.append('isPublished', String(Boolean(values.isPublished)));
    formData.append(
      'startAt',
      values.startAt || values.startDate ? new Date(values.startAt || values.startDate).toISOString() : '',
    );
    formData.append(
      'endAt',
      values.endAt || values.endDate ? new Date(values.endAt || values.endDate).toISOString() : '',
    );
    if (values.couponCode !== undefined) formData.append('couponCode', values.couponCode?.trim() || '');
    if (values.discount !== undefined) formData.append('discount', values.discount?.trim() || '');

    return requestWithFallback(
      id
        ? [`/admin/marketing/banners/${id}`, `/admin/content/banners/${id}`, `/admin/banners/${id}`]
        : ['/admin/marketing/banners', '/admin/content/banners', '/admin/banners'],
      (url) => id ? api.patch(url, formData) : api.post(url, formData)
    );
  }

  const payload = bannerBody(values);
  return requestWithFallback(
    id
      ? [`/admin/marketing/banners/${id}`, `/admin/content/banners/${id}`, `/admin/banners/${id}`]
      : ['/admin/marketing/banners', '/admin/content/banners', '/admin/banners'],
    (url) => id ? api.patch(url, payload) : api.post(url, payload)
  );
};

export const setBannerStatus = (id, isActive) =>
  requestWithFallback(
    [`/admin/marketing/banners/${id}/status`, `/admin/content/banners/${id}/status`, `/admin/banners/${id}/status`],
    (url) => api.patch(url, { isActive })
  );

export const removeBanner = (id) =>
  requestWithFallback(
    [`/admin/marketing/banners/${id}`, `/admin/content/banners/${id}`, `/admin/banners/${id}`],
    (url) => api.delete(url)
  );

export const publishBanner = (id, isPublished) =>
  requestWithFallback(
    [`/admin/marketing/banners/${id}/publish`, `/admin/content/banners/${id}/publish`, `/admin/banners/${id}/publish`],
    (url) => api.patch(url, { isPublished })
  );

export const loadVideos = async (query = {}) => {
  const params = {
    search: query.search?.trim() || undefined,
    status: query.status && query.status !== 'ALL' ? query.status : undefined,
    page: query.page || 1,
    limit: query.limit || 10,
  };
  const res = await api.get('/admin/marketing/videos', { params });
  const payload = res?.data || res;
  const rows = rowsOf(payload);
  const total = typeof payload?.total === 'number' ? payload.total : (typeof payload?.data?.total === 'number' ? payload.data.total : rows.length);
  const page = payload?.page || query.page || 1;
  const limit = payload?.limit || query.limit || 10;
  const totalPages = payload?.totalPages || Math.ceil(total / limit) || 1;
  return {
    rows,
    pagination: { total, page, limit, totalPages },
    payload,
  };
};

export const saveVideo = async (values, id, files = {}) => {
  const videoFile = files?.video instanceof File ? files.video : null;
  const thumbFile = files?.thumbnail instanceof File ? files.thumbnail : null;
  if (videoFile || thumbFile) {
    const formData = new FormData();
    if (videoFile) formData.append('video', videoFile);
    if (thumbFile) formData.append('thumbnail', thumbFile);
    if (values.title !== undefined) formData.append('title', values.title?.trim() || '');
    if (values.subtitle !== undefined) formData.append('subtitle', values.subtitle?.trim() || '');
    if (values.description !== undefined) formData.append('description', values.description?.trim() || '');
    if (values.videoUrl !== undefined && !videoFile) formData.append('videoUrl', values.videoUrl?.trim() || '');
    if (values.thumbnailUrl !== undefined && !thumbFile) formData.append('thumbnailUrl', values.thumbnailUrl?.trim() || '');
    formData.append('priority', String(values.priority !== undefined && values.priority !== '' ? Number(values.priority) || 0 : 0));
    if (values.status) formData.append('status', values.status);
    if (values.isActive !== undefined) formData.append('isActive', String(Boolean(values.isActive)));
    if (values.isPublished !== undefined) formData.append('isPublished', String(Boolean(values.isPublished)));
    return id ? api.patch(`/admin/marketing/videos/${id}`, formData) : api.post('/admin/marketing/videos', formData);
  }
  const body = videoBody(values);
  return id ? api.patch(`/admin/marketing/videos/${id}`, body) : api.post('/admin/marketing/videos', body);
};

export const removeVideo = (id) => api.delete(`/admin/marketing/videos/${id}`);
export const publishVideo = (id, isPublished) => api.patch(`/admin/marketing/videos/${id}/publish`, { isPublished });
export const updateVideoStatus = (id, status) => api.patch(`/admin/marketing/videos/${id}/status`, { status });

export const loadDataSummary = () => api.get('/admin/data-management/summary');
export const loadDataHistory = () => api.get('/admin/data-management/history').then(rowsOf);
export const loadDataOverview = () => api.get('/admin/data-management/overview');
export const loadDataModules = () => api.get('/admin/data-management/modules');
export const loadDataOperations = () => api.get('/admin/data-management/reset/history');
export const previewDataReset = (body) => api.post('/admin/data-management/reset/preview', body);
export const executeDataReset = (body) => api.post('/admin/data-management/reset', body);
export const createDataBackup = (body) => api.post('/admin/data-management/backups', body);
export const loadDataBackups = () => api.get('/admin/data-management/backups');
export const verifyDataBackup = (id) => api.post(`/admin/data-management/backups/${id}/verify`);
export const previewDataRestore = (id) => api.post(`/admin/data-management/backups/${id}/restore/preview`);
export const executeDataRestore = (id, body) => api.post(`/admin/data-management/backups/${id}/restore`, body);
export const downloadDataBackup = (id) => api.get(`/admin/data-management/backups/${id}/download`, { responseType: 'blob' });
export const previewDataCleanup = (operation) => api.post('/admin/data-management/cleanup/preview', { operation });
export const executeDataCleanup = (body) => api.post('/admin/data-management/cleanup', body);
export const exportDataModule = (module, format) => api.get('/admin/data-management/export', { params: { module, format }, responseType: 'blob' });
export const previewDataImport = (csv) => api.post('/admin/data-management/import/preview', { csv });
export const executeDataImport = (body) => api.post('/admin/data-management/import', body);

export const loadReportSummary = (params) => api.get('/reports/summary', { params });
export const loadReportData = (params) => api.get('/reports/data', { params }).then((payload) => ({ rows: rowsOf(payload), pagination: pageOf(payload) || payload?.pagination || payload?.data?.pagination || {} }));
export const exportReport = (body) => api.post('/reports/export', body);

export const loadIntegrations = () => api.get('/admin/settings/integrations').then(rowsOf);
export const setIntegrationEnabled = (provider, isEnabled) => api.patch(`/admin/settings/integrations/${provider}/toggle`, { isEnabled });
export const saveIntegration = (provider, body) => api.put(`/admin/settings/integrations/${provider}`, body);
export const testIntegration = (provider, body = {}) => {
  // isEnabled belongs to the update/toggle endpoints; TestIntegrationDto rejects it.
  const testPayload = { ...(body || {}) };
  delete testPayload.isEnabled;
  return api.post(`/admin/settings/integrations/${encodeURIComponent(provider)}/test`, testPayload);
};
export const loadIntegrationModels = (provider) => api.get(`/admin/settings/integrations/${encodeURIComponent(provider)}/models`).then(rowsOf);
export const disconnectIntegration = (provider) => api.delete(`/admin/settings/integrations/${provider}`);

export const loadCampaigns = (query = {}) => list('/notifications/admin/campaigns', { page: query.page || 1, limit: 20, search: query.search || undefined, status: query.status && query.status !== 'ALL' ? query.status : undefined });
export const loadCampaignSummary = () => api.get('/notifications/admin/campaigns/summary');
export const saveCampaign = (values) => api.post('/notifications/admin/offer', values);
export const cancelCampaign = (id) => api.post(`/notifications/admin/campaigns/${id}/cancel`);
export const removeCampaign = (id) => api.delete(`/notifications/admin/campaigns/${id}`);
export const resendCampaign = (id) => api.post(`/notifications/admin/campaigns/${id}/resend`);
export const loadNotificationHistory = (query = {}) => list('/notifications/admin/history', { page: query.page || 1, limit: 20, search: query.search || undefined, status: query.status || undefined, from: query.from || undefined, to: query.to || undefined });
export const deleteNotificationHistory = (id) => api.delete(`/notifications/admin/history/${id}`);
export function uploadCampaignImage(file) {
  const form = new FormData();
  form.append('image', file);
  return api.post('/notifications/admin/upload-image', form, { headers: { 'Content-Type': 'multipart/form-data' } });
}
export const loadAuditLogs = (query = {}) => list('/audit-logs', { search: query.search, page: query.page, limit: 20 });
export const loadRoles = () => api.get('/auth/roles').then(rowsOf);
export const loadPermissions = () => api.get('/auth/permissions').then(rowsOf);
export const createRole = (values) => api.post('/auth/roles', { name: values.name, description: values.description || undefined });
export const saveRolePermissions = (id, permissions) => api.put(`/auth/roles/${id}/permissions`, { permissions });
export const removeRole = (id) => api.delete(`/auth/roles/${id}`);
export const loadCommissionSettings = () => api.get('/commissions/configs/designations').then(rowsOf);
export const saveCommissionSetting = (values) => api.patch(`/commissions/configs/designations/${values.designationId}`, { designationId: Number(values.designationId), commissionEnabled: values.commissionEnabled === true || values.commissionEnabled === 'true', commissionType: values.commissionType || undefined, commissionRate: Number(values.commissionRate) });

export const DATA_MODULES = ['crm', 'attendance', 'leave', 'remote', 'visits', 'payroll', 'notifications', 'location', 'claims', 'loans', 'works'];
export const loadReportCatalog = () => api.get('/reports/catalog');
export const viewReport = (params) => api.get('/reports/view', { params, timeout: 60000 });
export const downloadReportPdf = (body) => api.post('/reports/export/pdf', body, { responseType: 'blob', timeout: 120000 });

export const suiteGaps = {
  general: 'There is no general-settings API for application name, logo, language, currency, timezone, or date format.',
  company: 'There is no company-profile settings API for address, tax, or registration details. CRM companies are a separate record type.',
  users: 'There is no admin user list, create, edit, or deactivate API. Roles can be managed separately.',
  notifications: '',
  reports: 'Report data is limited to attendance, payroll, leaves, employees, visits, and revenue. Commission, subscription, and AI-usage reports are not report types.',
  upload: 'Create and edit accept media URLs. File upload stays on the same endpoints when a file is sent as multipart form data.',
};

function trendingBody(values) {
  return { title: values.title, description: values.description || undefined, category: values.category || undefined, thumbnailUrl: values.thumbnailUrl || undefined, mediaUrl: values.mediaUrl || undefined, mediaType: values.mediaType || undefined, ctaText: values.ctaText || undefined, ctaUrl: values.ctaUrl || undefined, platform: values.platform || undefined, priority: values.priority === '' ? undefined : Number(values.priority), isPublished: values.isPublished === true || values.isPublished === 'true' };
}
function bannerBody(values) {
  const startAt = values.startAt || values.startDate;
  const endAt = values.endAt || values.endDate;
  return {
    title: values.title !== undefined ? (values.title?.trim() || '') : undefined,
    subtitle: values.subtitle !== undefined ? (values.subtitle?.trim() || '') : undefined,
    description: values.description !== undefined ? (values.description?.trim() || '') : undefined,
    imageUrl: values.imageUrl?.trim() || values.image?.trim() || undefined,
    ctaText: values.ctaText !== undefined ? (values.ctaText?.trim() || '') : undefined,
    ctaUrl: values.ctaUrl !== undefined ? (values.ctaUrl?.trim() || '') : undefined,
    actionType: values.actionType !== undefined ? (values.actionType?.trim() || '') : undefined,
    priority: values.priority !== undefined && values.priority !== '' ? Number(values.priority) || 0 : 0,
    isActive: values.isActive !== false && values.isActive !== 'false',
    isPublished: values.isPublished !== false && values.isPublished !== 'false',
    startAt: startAt ? new Date(startAt).toISOString() : null,
    endAt: endAt ? new Date(endAt).toISOString() : null,
    couponCode: values.couponCode !== undefined ? (values.couponCode?.trim() || '') : undefined,
    discount: values.discount !== undefined ? (values.discount?.trim() || '') : undefined,
  };
}
function videoBody(values) {
  return {
    title: values.title?.trim() || '',
    subtitle: values.subtitle?.trim() || undefined,
    description: values.description?.trim() || undefined,
    videoUrl: values.videoUrl?.trim() || undefined,
    thumbnailUrl: values.thumbnailUrl?.trim() || undefined,
    priority: values.priority === '' || values.priority === undefined ? 0 : Number(values.priority) || 0,
    status: values.status || 'ACTIVE',
    isActive: values.isActive !== false && values.isActive !== 'false',
    isPublished: values.isPublished !== false && values.isPublished !== 'false',
  };
}
