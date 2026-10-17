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
export interface LeadPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
export interface LeadList {
  pagination: LeadPagination;
  data: Lead[];
  items?: Lead[];
  total: number;
  page: number;
  limit: number;
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
export function normalizeLeadList(response: any, request: { page?: unknown; limit?: unknown } = {}): LeadList {
  if (response?.success === false) throw new Error(response.message || 'Unable to load Leads');
  const payload = Array.isArray(response?.data) ? response : response?.data ?? response;
  const records = Array.isArray(payload?.data)
    ? payload.data
    : Array.isArray(payload?.items)
    ? payload.items
    : Array.isArray(response?.items)
    ? response.items
    : Array.isArray(payload)
    ? payload
    : null;
  if (!records || !Array.isArray(records)) {
    throw new Error('Invalid Lead list response: expected a records array');
  }
  const pagination = payload.pagination ?? response?.pagination ?? payload.meta ?? response?.meta;
  const total = payload.total ?? pagination?.total;
  // Older envelopes lose top-level page/limit in the global interceptor.
  // Use the actual request only for these values; never invent a record total.
  const page = pagination?.page ?? payload.page ?? request.page;
  const limit = pagination?.limit ?? pagination?.pageSize ?? payload.limit ?? request.limit;
  if (typeof total !== 'number' || !Number.isSafeInteger(total) || total < 0 ||
      typeof page !== 'number' || !Number.isSafeInteger(page) || page < 1 ||
      typeof limit !== 'number' || !Number.isSafeInteger(limit) || limit < 1) {
    throw new Error('Invalid Lead list response: missing pagination');
  }
  const calculatedPages = Math.max(1, Math.ceil(total / limit));
  const rawTotalPages = pagination?.totalPages ?? payload.totalPages;
  const totalPages = rawTotalPages === 0 && total === 0 ? 1 : (rawTotalPages ?? calculatedPages);
  if (!Number.isSafeInteger(totalPages) || totalPages < 0 ||
      Math.max(1, totalPages) !== calculatedPages || records.length > limit ||
      records.length > Math.max(0, total - (page - 1) * limit)) {
    throw new Error('Invalid Lead list response: inconsistent pagination');
  }
  const normalized: LeadPagination = { page, limit, total, totalPages: calculatedPages };
  return { data: records, items: records, ...normalized, pagination: normalized };
}
export const leadsApi = {
  list: async (params: Record<string, unknown>) => {
    if (process.env.NODE_ENV !== 'production') console.debug('[LEAD_LIST_REQUEST]', { endpoint: '/leads', method: 'GET', queryParams: params });
    const response = await api.get('/leads', { params });
    const result = normalizeLeadList(response, params);
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
