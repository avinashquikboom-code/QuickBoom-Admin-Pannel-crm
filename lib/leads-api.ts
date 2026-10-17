import api from './api';

export const LEAD_STATUSES = [
  'NEW',
  'CONTACTED',
  'DETAILS_SEND',
  'FOLLOW_UP',
  'VISIT_SCHEDULED',
  'VISIT_DONE',
  'PROPOSAL_SENT',
  'NEGOTIATION',
  'FINAL_CALL',
  'WON',
  'LOST',
] as const;
export type LeadStatus = typeof LEAD_STATUSES[number] | (string & {});

export interface LeadStage {
  id: number;
  key: string;
  name: string;
  sortOrder: number;
  color: string;
  bgColor: string;
  borderColor: string;
  isActive: boolean;
  isDefault: boolean;
}

export const CRM_LEAD_STAGES: LeadStage[] = [
  { id: 1, key: 'NEW', name: 'New', sortOrder: 1, color: '#0284C7', bgColor: '#E0F2FE', borderColor: '#BAE6FD', isActive: true, isDefault: true },
  { id: 2, key: 'CONTACTED', name: 'Contacted', sortOrder: 2, color: '#D97706', bgColor: '#FEF3C7', borderColor: '#FDE68A', isActive: true, isDefault: false },
  { id: 3, key: 'DETAILS_SEND', name: 'Details send', sortOrder: 3, color: '#4F46E5', bgColor: '#EEF2FF', borderColor: '#C7D2FE', isActive: true, isDefault: false },
  { id: 4, key: 'FOLLOW_UP', name: 'Follow-up', sortOrder: 4, color: '#7C3AED', bgColor: '#F5F3FF', borderColor: '#DDD6FE', isActive: true, isDefault: false },
  { id: 5, key: 'VISIT_SCHEDULED', name: 'Visit Scheduled', sortOrder: 5, color: '#0891B2', bgColor: '#ECFEFF', borderColor: '#A5F3FC', isActive: true, isDefault: false },
  { id: 6, key: 'VISIT_DONE', name: 'Visit Done', sortOrder: 6, color: '#0D9488', bgColor: '#F0FDFA', borderColor: '#99F6E4', isActive: true, isDefault: false },
  { id: 7, key: 'PROPOSAL_SENT', name: 'Proposal Sent', sortOrder: 7, color: '#2563EB', bgColor: '#EFF6FF', borderColor: '#BFDBFE', isActive: true, isDefault: false },
  { id: 8, key: 'NEGOTIATION', name: 'Negotiation', sortOrder: 8, color: '#F59E0B', bgColor: '#FFFBEB', borderColor: '#FDE68A', isActive: true, isDefault: false },
  { id: 9, key: 'FINAL_CALL', name: 'Final Call', sortOrder: 9, color: '#EA580C', bgColor: '#FFF7ED', borderColor: '#FFEDD5', isActive: true, isDefault: false },
  { id: 10, key: 'WON', name: 'Won', sortOrder: 10, color: '#16A34A', bgColor: '#DCFCE7', borderColor: '#BBF7D0', isActive: true, isDefault: false },
  { id: 11, key: 'LOST', name: 'Lost', sortOrder: 11, color: '#DC2626', bgColor: '#FFE4E6', borderColor: '#FECDD3', isActive: true, isDefault: false },
];

export function getStageDetails(statusOrKey?: string | null): LeadStage {
  const clean = String(statusOrKey || '').trim().toUpperCase().replace(/[\s-]+/g, '_');
  const direct = CRM_LEAD_STAGES.find((s) => s.key === clean);
  if (direct) return direct;
  if (clean === 'DETAILS_SENT') return CRM_LEAD_STAGES[2];
  if (clean === 'VISIT') return CRM_LEAD_STAGES[4];
  if (clean === 'PROPOSAL') return CRM_LEAD_STAGES[6];
  if (clean === 'CONVERTED') return CRM_LEAD_STAGES[9];
  if (clean === 'CANCELLED') return CRM_LEAD_STAGES[10];
  return CRM_LEAD_STAGES[0];
}

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
  stageId?: number;
  stage?: LeadStage;
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
export type UpdateLeadInput = Omit<Partial<CreateLeadInput>, 'email'> & { email?: string | null };

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
  update: async (id: number, data: UpdateLeadInput) => unwrap<Lead>(await api.patch(`/leads/${id}`, data)),
  stages: async (): Promise<LeadStage[]> => {
    try {
      const res = await api.get('/leads/stages');
      const data = unwrap<any>(res);
      const list = Array.isArray(data) ? data : (data?.data ?? CRM_LEAD_STAGES);
      return Array.isArray(list) && list.length > 0 ? list : CRM_LEAD_STAGES;
    } catch {
      return CRM_LEAD_STAGES;
    }
  },
  updateStage: async (id: number, data: { status?: string; stageId?: number; notes?: string }): Promise<Lead> => {
    const res = await api.patch(`/leads/${id}/status`, data);
    return unwrap<Lead>(res);
  },
};
