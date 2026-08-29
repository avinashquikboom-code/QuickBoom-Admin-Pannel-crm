import api from '@/lib/api';

export interface SocialMediaHandlerItem {
  id: number;
  customerId: number;
  customer?: {
    id: number;
    name: string;
    companyName?: string | null;
    email?: string | null;
    phone?: string | null;
  };
  platform: string;
  accountName: string;
  accountUrl?: string | null;
  handlerName?: string | null;
  handlerPhone?: string | null;
  handlerEmail?: string | null;
  workType?: string | null;
  status: string;
  notes?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  durationDays?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSocialMediaHandlerPayload {
  customerId?: number | string;
  platform: string;
  accountName: string;
  accountUrl?: string;
  handlerName?: string;
  handlerPhone?: string;
  handlerEmail?: string;
  workType?: string;
  status?: string;
  notes?: string;
  startDate?: string | null;
  endDate?: string | null;
  durationDays?: number;
}

export interface UpdateSocialMediaHandlerPayload extends Partial<CreateSocialMediaHandlerPayload> {}

export interface QuerySocialMediaHandlerParams {
  search?: string;
  platform?: string;
  status?: string;
  customerId?: number | string;
  page?: number;
  limit?: number;
}

export class SocialMediaService {
  /**
   * List all social media handlers across customers (Admin)
   */
  static async getHandlers(params?: QuerySocialMediaHandlerParams): Promise<{
    items: SocialMediaHandlerItem[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const res: any = await api.get('/admin/social-media-handler', { params });
    const items = res?.data?.items || res?.data?.data || res?.items || res?.data || (Array.isArray(res) ? res : []);
    const pagination = res?.pagination || res?.data?.pagination || {
      page: params?.page || 1,
      limit: params?.limit || 20,
      total: Array.isArray(items) ? items.length : 0,
      totalPages: 1,
    };
    return {
      items: Array.isArray(items) ? items : [],
      pagination: {
        page: Number(pagination.page) || 1,
        limit: Number(pagination.limit || pagination.pageSize) || 20,
        total: Number(pagination.total) || (Array.isArray(items) ? items.length : 0),
        totalPages: Number(pagination.totalPages) || 1,
      },
    };
  }

  /**
   * Get social media handlers for a specific customer
   */
  static async getCustomerHandlers(
    customerId: number | string,
    params?: QuerySocialMediaHandlerParams,
  ): Promise<SocialMediaHandlerItem[]> {
    const res: any = await api.get(`/admin/customers/${customerId}/social-media-handler`, { params });
    const items = res?.data?.items || res?.data?.data || res?.items || res?.data || (Array.isArray(res) ? res : []);
    return Array.isArray(items) ? items : [];
  }

  /**
   * Create a new social media handler record
   */
  static async createHandler(payload: CreateSocialMediaHandlerPayload): Promise<SocialMediaHandlerItem> {
    const res: any = await api.post('/admin/social-media-handler', payload);
    return res?.data?.data || res?.data || res;
  }

  /**
   * Update a social media handler record
   */
  static async updateHandler(id: number | string, payload: UpdateSocialMediaHandlerPayload): Promise<SocialMediaHandlerItem> {
    const res: any = await api.patch(`/admin/social-media-handler/${id}`, payload);
    return res?.data?.data || res?.data || res;
  }

  /**
   * Delete a social media handler record
   */
  static async deleteHandler(id: number | string): Promise<{ success: boolean }> {
    const res: any = await api.delete(`/admin/social-media-handler/${id}`);
    return res?.data || res;
  }
}
