import api from './api';

const base = '/data-capture';
async function request(method: 'get' | 'post' | 'patch' | 'delete', path = '', data?: any) {
  const response: any = method === 'get'
    ? await api.get(`${base}${path}`, data)
    : method === 'delete' ? await api.delete(`${base}${path}`)
    : await api[method](`${base}${path}`, data);
  if (process.env.NODE_ENV !== 'production') {
    console.debug('[DATA_CAPTURE_API]', { method, API: `${base}${path}`,
      params: method === 'get' ? data?.params : undefined,
      requestFields: method === 'get' ? undefined : Object.keys(data || {}),
      statusCode: response?.statusCode,
      records: Array.isArray(response?.data) ? response.data.length : undefined });
  }
  return response;
}
// Production's established create-lead API returns `place`; newer builds return `record`.
// Accept both real response contracts, but never manufacture a conversion link.
export function normalizeLeadImportResponse(response: any) {
  const payload = response?.data ?? response;
  const lead = payload?.lead;
  const record = payload?.record ?? payload?.place;
  if (!Number.isInteger(lead?.id) || lead.id < 1 ||
      record?.importedLeadId !== lead.id || record?.isImported !== true ||
      String(record?.status ?? '').trim().toUpperCase() === 'REJECTED') {
    throw new Error('Import response is missing a verified Lead link. Refresh the record before retrying.');
  }
  return {
    lead,
    record: {
      ...record,
      provider: record.provider ?? record.source,
      capturedAt: record.capturedAt ?? record.createdAt,
    },
    alreadyImported: Boolean(payload?.alreadyImported ?? payload?.isDuplicate ?? response?.isDuplicate),
  };
}

export const dataCaptureApi = {
  list: (params: Record<string, unknown>) => request('get', '', { params }),
  detail: (id: number) => request('get', `/${id}`),
  usage: () => request('get', '/usage'),
  create: (data: Record<string, unknown>) => request('post', '', data),
  update: (id: number, data: Record<string, unknown>) => request('patch', `/${id}`, data),
  remove: (id: number) => request('delete', `/${id}`),
  importLead: async (id: number) => normalizeLeadImportResponse(await request('post', `/${id}/create-lead`, {})),
  validate: (id: number) => request('post', `/${id}/validate`),
  reject: (id: number, reason?: string) => request('post', `/${id}/reject`, { reason }),
  bulk: (ids: number[], action: string, reason?: string) => request('post', '/bulk', { ids, action, reason }),
  extract: (data: Record<string, unknown>) => request('post', '/extract', data),
};
