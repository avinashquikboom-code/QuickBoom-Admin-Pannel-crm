import api from './api';

export const LEAD_STATUSES = ['NEW', 'CONTACTED', 'QUALIFIED', 'FOLLOW_UP', 'WON', 'LOST'] as const;
export type LeadStatus = typeof LEAD_STATUSES[number];
export interface Lead {
  id: number;
  companyName: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  pincode?: string | null;
  category?: string | null;
  googlePlaceId?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  source: string;
  createdFrom: string;
  status: LeadStatus;
  notes?: string | null;
  assignedToId?: number | null;
  createdById: number;
  deletedAt?: string | null;
  createdAt: string;
}
export interface LeadList {
  data: Lead[];
  total: number;
  page: number;
  totalPages: number;
}
export interface CreateLeadInput {
  companyName: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  category?: string;
  notes?: string;
}
const unwrap = <T,>(response: any): T => response?.data ?? response;
// The shared Axios interceptor already returns the HTTP body. The Nest
// transform interceptor puts the rows in data and keeps pagination beside it.
export function normalizeLeadList(response: any): LeadList {
  if (response?.success === false) throw new Error(response.message || 'Unable to load Leads');
  const payload = Array.isArray(response?.data) ? response : response?.data ?? response;
  if (!payload || !Array.isArray(payload.data)) {
    throw new Error('Invalid Lead list response: expected a records array');
  }
  const pagination = payload.pagination ?? response?.pagination;
  const total = payload.total ?? pagination?.total;
  const page = payload.page ?? pagination?.page;
  const totalPages = payload.totalPages ?? pagination?.totalPages;
  if (![total, page, totalPages].every(Number.isSafeInteger) || total < 0 || page < 1 || totalPages < 0) {
    throw new Error('Invalid Lead list response: missing pagination');
  }
  return { data: payload.data, total, page, totalPages: Math.max(1, totalPages) };
}
export const leadsApi = {
  list: async (params: Record<string, unknown>) => {
    if (process.env.NODE_ENV !== 'production') console.debug('[LEAD_LIST_REQUEST]', { endpoint: '/leads', method: 'GET', queryParams: params });
    const response = await api.get('/leads', { params });
    const result = normalizeLeadList(response);
    if (process.env.NODE_ENV !== 'production') console.debug('[LEAD_FRONTEND_MAPPING]', {
      recordsPathUsed: Array.isArray((response as any)?.data) ? 'data' : 'data.data',
      recordsLength: result.data.length, total: result.total, page: result.page,
      returnedIds: result.data.map((lead) => lead.id),
    });
    return result;
  },
  detail: async (id: number) => unwrap<Lead>(await api.get(`/leads/${id}`)),
  create: async (data: CreateLeadInput) => unwrap<Lead>(await api.post('/leads', { ...data, source: 'MANUAL', createdFrom: 'ADMIN_PANEL' })),
};
