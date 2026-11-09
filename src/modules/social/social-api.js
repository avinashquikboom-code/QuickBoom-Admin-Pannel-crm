import api from '../../../lib/api';
import { pageOf, rowsOf, sessionCan } from '@/modules/customer/billing-api';
import { crmError } from '@/modules/crm/crm-api';

export { crmError as socialError, sessionCan, rowsOf, pageOf };

function paged(payload, page, limit) {
  const rows = rowsOf(payload);
  const total = payload?.total ?? payload?.data?.total ?? payload?.pagination?.total ?? rows.length;
  const size = Number(limit) || rows.length || 1;
  return { rows, total, pagination: pageOf(payload).total ? pageOf(payload) : { page, limit: size, total, totalPages: Math.max(1, Math.ceil(total / size)) } };
}

export const loadInfluencers = (params = {}) => api.get('/admin/influencers', { params }).then((payload) => ({ rows: rowsOf(payload), counts: payload?.counts }));
export const loadInfluencerCategories = () => api.get('/admin/influencer-categories').then(rowsOf);
export const createInfluencer = (values) => api.post('/admin/influencers', cleanInfluencer(values));
export const updateInfluencer = (id, values) => api.patch(`/admin/influencers/${id}`, cleanInfluencer(values));
export const removeInfluencer = (id) => api.delete(`/admin/influencers/${id}`);

export const loadApplications = (params = {}) => api.get('/admin/influencers/applications', { params }).then((payload) => ({ rows: rowsOf(payload), counts: payload?.counts || {} }));
export const approveApplication = (id) => api.patch(`/admin/influencers/${id}/approve`);
export const rejectApplication = (id, reason) => api.patch(`/admin/influencers/${id}/reject`, { reason });
export const suspendInfluencer = (id) => api.patch(`/admin/influencers/${id}/suspend`);

export async function loadBookings(query = {}) {
  const limit = 20;
  const page = Number(query.page) || 1;
  const [payload, stats] = await Promise.all([
    api.get('/admin/influencer-bookings', { params: { search: query.search, status: query.status, limit, offset: (page - 1) * limit } }),
    api.get('/admin/influencer-bookings/stats'),
  ]);
  return { ...paged(payload, page, limit), stats: stats?.data || stats || {} };
}
export const approveBooking = (id) => api.post(`/admin/influencer-bookings/${id}/approve`);
export const rejectBooking = (id, reason) => api.post(`/admin/influencer-bookings/${id}/reject`, { reason });
export const cancelBooking = (id, reason) => api.post(`/admin/influencer-bookings/${id}/cancel`, { reason });
export const updateBookingStatus = (id, status) => api.patch(`/admin/influencer-bookings/${id}/status`, { status });

export async function loadGenerations(query = {}) {
  const limit = 20;
  const page = Number(query.page) || 1;
  const payload = await api.get('/admin/ai/generations', { params: { status: query.status, type: query.type, limit, offset: (page - 1) * limit } });
  return paged(payload, page, limit);
}
export const generateContent = (values) => api.post('/ai/generate', { type: values.type, prompt: values.prompt, product: values.product || values.prompt, platform: values.platform || undefined, objective: values.objective || undefined });
export const updateGeneration = (id, values) => api.patch(`/ai/generations/${id}`, { caption: values.caption, hashtags: values.hashtags });

export async function loadPublishes(query = {}) {
  const payload = await api.get('/admin/social/publishes', { params: { status: query.status, platform: query.platform, limit: 20, offset: 0 } });
  return rowsOf(payload);
}

export async function loadCreditTransactions(query = {}) {
  const limit = 20;
  const page = Number(query.page) || 1;
  const payload = await api.get('/admin/ai/transactions', { params: { type: query.type, limit, offset: (page - 1) * limit } });
  return paged(payload, page, limit);
}
export const loadCustomerCredits = (customerId) => api.get(`/admin/customers/${customerId}/ai-credits`);
export const addCredits = (customerId, amount, reason) => api.post(`/admin/customers/${customerId}/ai-credits/add`, { amount: Number(amount), reason });
export const reduceCredits = (customerId, amount, reason) => api.post(`/admin/customers/${customerId}/ai-credits/reduce`, { amount: Number(amount), reason });

export async function loadSocialAccounts(query = {}) {
  const payload = await api.get('/admin/social/accounts', { params: { platform: query.platform, limit: 50, offset: 0 } });
  return rowsOf(payload).map(stripSecrets);
}
export async function loadHandlers(query = {}) {
  const payload = await api.get('/admin/social-media-handlers', { params: { search: query.search, platform: query.platform, status: query.status, page: query.page || 1, limit: 20 } });
  return { rows: rowsOf(payload).map(stripSecrets), pagination: pageOf(payload) };
}
export const createHandler = (values) => api.post('/admin/social-media-handlers', handlerBody(values));
export const updateHandler = (id, values) => api.patch(`/admin/social-media-handlers/${id}`, handlerBody(values));
export const removeHandler = (id) => api.delete(`/admin/social-media-handlers/${id}`);

function cleanInfluencer(values) {
  return {
    name: values.name,
    handle: values.handle || undefined,
    platform: values.platform || undefined,
    categoryId: values.categoryId ? Number(values.categoryId) : undefined,
    city: values.city || undefined,
    email: values.email || undefined,
    phone: values.phone || undefined,
    followers: values.followers === '' || values.followers == null ? undefined : Number(values.followers),
    engagementRate: values.engagementRate === '' || values.engagementRate == null ? undefined : Number(values.engagementRate),
    instagramHandle: values.instagramHandle || undefined,
    youtubeHandle: values.youtubeHandle || undefined,
    bio: values.bio || undefined,
    status: values.status || undefined,
  };
}

function handlerBody(values) {
  return {
    platform: values.platform,
    accountName: values.accountName,
    accountUrl: values.accountUrl || undefined,
    socialMediaId: values.socialMediaId || undefined,
    handlerName: values.handlerName || undefined,
    handlerPhone: values.handlerPhone || undefined,
    handlerEmail: values.handlerEmail || undefined,
    workType: values.workType || undefined,
    status: values.status || undefined,
    notes: values.notes || undefined,
    customerId: values.customerId ? Number(values.customerId) : undefined,
    password: values.password && !String(values.password).includes('•') ? values.password : undefined,
  };
}

function stripSecrets(row) {
  if (!row || typeof row !== 'object') return row;
  const { accessTokenEncrypted, refreshTokenEncrypted, password, passwordHash, ...safe } = row;
  return { ...safe, passwordOnFile: Boolean(password || accessTokenEncrypted) };
}

export const socialGaps = {
  performance: 'Influencer records include follower count, engagement rate, and booking count. There is no campaign-performance history API.',
  calendar: 'Bookings return a campaign date. There is no calendar feed, duration, or assigned-employee field.',
  publish: 'This admin panel can list publish results from GET /admin/social/publishes. Publishing and scheduling stay on the customer social API and are not marked successful from the browser.',
  credits: 'Wallet balance, earned credits, and spent credits come from the customer wallet endpoint. They are not added up in the browser.',
  tokens: 'Connected-account tokens are removed before display. There is no admin disconnect route and no last-sync field.',
};
