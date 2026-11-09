import api from '../../../lib/api';
import { pageOf, rowsOf, sessionCan } from '@/modules/customer/billing-api';
import { crmError } from '@/modules/crm/crm-api';

export { crmError as suiteError, sessionCan, rowsOf, pageOf };

const list = (url, params) => api.get(url, { params }).then((payload) => ({ rows: rowsOf(payload), pagination: pageOf(payload), payload }));

export const loadTrending = (query = {}) => list('/admin/trending', { search: query.search, category: query.category, page: query.page, limit: 20 });
export const saveTrending = (values, id) => id ? api.patch(`/admin/trending/${id}`, trendingBody(values)) : api.post('/admin/trending', trendingBody(values));
export const removeTrending = (id) => api.delete(`/admin/trending/${id}`);
export const publishTrending = (id, isPublished) => api.patch(`/admin/trending/${id}/publish`, { isPublished });

export const loadBanners = (query = {}) => list('/admin/marketing/banners', { search: query.search, page: query.page, limit: 20 });
export const saveBanner = (values, id) => id ? api.patch(`/admin/marketing/banners/${id}`, bannerBody(values)) : api.post('/admin/marketing/banners', bannerBody(values));
export const removeBanner = (id) => api.delete(`/admin/marketing/banners/${id}`);
export const publishBanner = (id, isPublished) => api.patch(`/admin/marketing/banners/${id}/publish`, { isPublished });

export const loadVideos = (query = {}) => list('/admin/marketing/videos', { search: query.search, page: query.page, limit: 20 });
export const saveVideo = (values, id) => id ? api.patch(`/admin/marketing/videos/${id}`, videoBody(values)) : api.post('/admin/marketing/videos', videoBody(values));
export const removeVideo = (id) => api.delete(`/admin/marketing/videos/${id}`);
export const publishVideo = (id, isPublished) => api.patch(`/admin/marketing/videos/${id}/publish`, { isPublished });

export const loadDataSummary = () => api.get('/admin/data-management/summary');
export const loadDataHistory = () => api.get('/admin/data-management/history').then(rowsOf);
export const resetModule = (module, confirmation, reason) => api.post('/admin/data-management/reset/module', { module, confirmation, reason });
export const resetAllData = (confirmation, reason) => api.post('/admin/data-management/reset/all', { scope: 'transactional', confirmation, reason });

export const loadReportSummary = (params) => api.get('/reports/summary', { params });
export const loadReportData = (params) => api.get('/reports/data', { params }).then((payload) => ({ rows: rowsOf(payload), pagination: pageOf(payload) || payload?.pagination || payload?.data?.pagination || {} }));
export const exportReport = (body) => api.post('/reports/export', body);

export const loadIntegrations = () => api.get('/admin/settings/integrations').then(rowsOf);
export const setIntegrationEnabled = (provider, isEnabled) => api.patch(`/admin/settings/integrations/${provider}/toggle`, { isEnabled });
export const saveIntegration = (provider, body) => api.put(`/admin/settings/integrations/${provider}`, body);
export const testIntegration = (provider, body = {}) => api.post(`/admin/settings/integrations/${provider}/test`, body);
export const disconnectIntegration = (provider) => api.delete(`/admin/settings/integrations/${provider}`);

export const loadCampaigns = (query = {}) => list('/notifications/admin/campaigns', { page: query.page || 1, limit: 20, search: query.search || undefined, status: query.status && query.status !== 'ALL' ? query.status : undefined });
export const loadCampaignSummary = () => api.get('/notifications/admin/campaigns/summary');
export const saveCampaign = (values) => api.post('/notifications/admin/offer', values);
export const cancelCampaign = (id) => api.post(`/notifications/admin/campaigns/${id}/cancel`);
export const removeCampaign = (id) => api.delete(`/notifications/admin/campaigns/${id}`);
export const resendCampaign = (id) => api.post(`/notifications/admin/campaigns/${id}/resend`);
export const loadNotificationHistory = (query = {}) => list('/notifications/admin/history', { page: query.page || 1, limit: 20, search: query.search || undefined, status: query.status || undefined, from: query.from || undefined, to: query.to || undefined });
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
export const viewReport = (params) => api.get('/reports/view', { params });
export const downloadReportPdf = (body) => api.post('/reports/export/pdf', body, { responseType: 'blob' });

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
  return { title: values.title, description: values.description || undefined, imageUrl: values.imageUrl || undefined, ctaText: values.ctaText || undefined, ctaUrl: values.ctaUrl || undefined, priority: values.priority === '' ? undefined : Number(values.priority), isPublished: values.isPublished === true || values.isPublished === 'true', isActive: values.isActive !== false && values.isActive !== 'false', startDate: values.startDate || undefined, endDate: values.endDate || undefined };
}
function videoBody(values) {
  return { title: values.title, description: values.description || undefined, videoUrl: values.videoUrl || undefined, thumbnailUrl: values.thumbnailUrl || undefined, priority: values.priority === '' ? undefined : Number(values.priority), status: values.status || undefined, isActive: values.isActive !== false && values.isActive !== 'false' };
}
