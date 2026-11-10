import api from '../../../lib/api';

export const loadGeneralSettings = async () => {
  const response = await api.get('/admin/settings/general');
  return response?.data?.data || response?.data || response;
};

export const updateGeneralSettings = async (payload) => {
  const response = await api.put('/admin/settings/general', payload);
  return response?.data?.data || response?.data || response;
};

export const uploadGeneralLogo = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/admin/settings/general/logo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response?.data?.data || response?.data || response;
};

export const removeGeneralLogo = async () => {
  const response = await api.delete('/admin/settings/general/logo');
  return response?.data?.data || response?.data || response;
};

export const loadGeneralOptions = async () => {
  const response = await api.get('/admin/settings/general/options');
  return response?.data?.data || response?.data || response;
};

export const clearApplicationCache = async () => {
  const response = await api.post('/admin/settings/general/cache/clear');
  return response?.data?.data || response?.data || response;
};

export const syncSystemSettings = async () => {
  const response = await api.post('/admin/settings/general/sync');
  return response?.data?.data || response?.data || response;
};
