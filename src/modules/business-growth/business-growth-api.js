import api from '../../../lib/api';

const handleApi = async (fn) => {
  const res = await fn();
  return res?.data?.data ?? res?.data ?? res;
};

export async function loadGrowthOverview() {
  return handleApi(() => api.get('/admin/business-growth/overview', { skipErrorToast: true }), null);
}

export async function loadGoogleAdsAccounts() {
  return handleApi(() => api.get('/admin/business-growth/google-ads/accounts'), null);
}

export async function loadGoogleAdsCampaigns(query = {}) {
  return handleApi(() => api.get('/admin/business-growth/google-ads/campaigns', { params: query }), null);
}

export async function createGoogleAdsCampaign(payload) {
  const res = await api.post('/admin/business-growth/google-ads/campaigns', payload);
  return res?.data?.data || res?.data || res;
}

export async function updateCampaignStatus(id, status) {
  const res = await api.patch(`/admin/business-growth/google-ads/campaigns/${id}/status`, { status });
  return res?.data?.data || res?.data || res;
}

export async function updateCampaignBudget(id, dailyBudget) {
  const res = await api.patch(`/admin/business-growth/google-ads/campaigns/${id}/budget`, { dailyBudget });
  return res?.data?.data || res?.data || res;
}

export async function syncGoogleAds() {
  const res = await api.post('/admin/business-growth/google-ads/sync');
  return res?.data?.data || res?.data || res;
}

export async function loadBusinessProfile(locationId = '') {
  return handleApi(
    () => api.get('/admin/business-growth/business-profile', { params: locationId ? { locationId } : {} }),
    null
  );
}

export async function updateBusinessProfile(payload) {
  const res = await api.patch('/admin/business-growth/business-profile', payload);
  return res?.data?.data || res?.data || res;
}

export async function addProfilePhoto(payload) {
  const res = await api.post('/admin/business-growth/business-profile/photos', payload);
  return res?.data?.data || res?.data || res;
}

export async function loadReviews(query = {}) {
  return handleApi(() => api.get('/admin/business-growth/reviews', { params: query }), null);
}

export async function replyToReview(reviewId, replyText, isAiGenerated = false) {
  const res = await api.post(`/admin/business-growth/reviews/${reviewId}/reply`, { replyText, isAiGenerated });
  return res?.data?.data || res?.data || res;
}

export async function generateAiReviewReply(reviewId, tone = 'PROFESSIONAL') {
  const res = await api.post(`/admin/business-growth/reviews/${reviewId}/generate-ai-reply`, { tone });
  return res?.data?.data || res?.data || res;
}

export async function loadGrowthAnalytics(dateRange = '30d') {
  return handleApi(() => api.get('/admin/business-growth/analytics', { params: { dateRange } }), null);
}

export async function loadGrowthSettings() {
  return handleApi(() => api.get('/admin/business-growth/settings'), null);
}

export async function updateGrowthSettings(payload) {
  const res = await api.patch('/admin/business-growth/settings', payload);
  return res?.data?.data || res?.data || res;
}

export async function connectGoogleOAuth(provider = 'ADS') {
  const res = await api.post('/admin/business-growth/google/oauth/connect', { provider });
  return res?.data?.data || res?.data || res;
}

export async function disconnectGoogleOAuth(provider = 'ADS') {
  const res = await api.post('/admin/business-growth/google/oauth/disconnect', { provider });
  return res?.data?.data || res?.data || res;
}
