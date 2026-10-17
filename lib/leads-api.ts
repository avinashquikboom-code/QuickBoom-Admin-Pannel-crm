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
export const leadsApi = {
  list: async (params: Record<string, unknown>) => unwrap<LeadList>(await api.get('/leads', { params })),
  detail: async (id: number) => unwrap<Lead>(await api.get(`/leads/${id}`)),
  create: async (data: CreateLeadInput) => unwrap<Lead>(await api.post('/leads', { ...data, source: 'MANUAL', createdFrom: 'ADMIN_PANEL' })),
};
