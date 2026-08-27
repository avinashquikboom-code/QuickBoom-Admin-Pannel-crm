import api from '@/lib/api';

export type TrendingCategory = 'REEL' | 'STORY' | 'OFFER' | 'HIGH_ROI_AD';

export interface TrendingContentItem {
  id: number;
  customerId?: number | null;
  title: string;
  description?: string | null;
  category: TrendingCategory;
  thumbnailUrl?: string | null;
  mediaUrl?: string | null;
  ctaText?: string | null;
  ctaUrl?: string | null;
  platform?: string | null;
  objective?: string | null;
  priority: number;
  isPublished: boolean;
  isActive: boolean;
  startAt?: string | null;
  endAt?: string | null;
  createdBy?: number | null;
  createdByUser?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  customer?: {
    id: number;
    name: string;
    domain?: string | null;
  } | null;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTrendingPayload {
  title: string;
  description?: string;
  category: TrendingCategory;
  thumbnailUrl?: string;
  mediaUrl?: string;
  ctaText?: string;
  ctaUrl?: string;
  platform?: string;
  objective?: string;
  priority?: number;
  isPublished?: boolean;
  isActive?: boolean;
  startAt?: string | null;
  endAt?: string | null;
  customerId?: number | string;
  metadata?: any;
}

export interface UpdateTrendingPayload {
  title?: string;
  description?: string;
  category?: TrendingCategory;
  thumbnailUrl?: string;
  mediaUrl?: string;
  ctaText?: string;
  ctaUrl?: string;
  platform?: string;
  objective?: string;
  priority?: number;
  isPublished?: boolean;
  isActive?: boolean;
  startAt?: string | null;
  endAt?: string | null;
  metadata?: any;
}

export interface QueryTrendingParams {
  category?: TrendingCategory;
  search?: string;
  isPublished?: boolean | string;
  isActive?: boolean | string;
  page?: number;
  limit?: number;
  customerId?: number | string;
}

export interface TrendingListResponse {
  success: boolean;
  data: TrendingContentItem[];
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export class TrendingService {
  /**
   * Fetch paginated list of trending items with filters
   */
  static async getTrendingList(params?: QueryTrendingParams): Promise<TrendingListResponse> {
    const response = await api.get('/admin/trending', { params });
    return response.data;
  }

  /**
   * Fetch single trending item by ID
   */
  static async getTrendingById(id: number | string): Promise<{ success: boolean; data: TrendingContentItem }> {
    const response = await api.get(`/admin/trending/${id}`);
    return response.data;
  }

  /**
   * Create a new trending content item
   */
  static async createTrending(payload: CreateTrendingPayload): Promise<{ success: boolean; data: TrendingContentItem; message: string }> {
    const response = await api.post('/admin/trending', payload);
    return response.data;
  }

  /**
   * Update an existing trending item
   */
  static async updateTrending(id: number | string, payload: UpdateTrendingPayload): Promise<{ success: boolean; data: TrendingContentItem; message: string }> {
    const response = await api.patch(`/admin/trending/${id}`, payload);
    return response.data;
  }

  /**
   * Delete a trending item
   */
  static async deleteTrending(id: number | string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/admin/trending/${id}`);
    return response.data;
  }

  /**
   * Toggle or update published status
   */
  static async setPublished(id: number | string, isPublished: boolean): Promise<{ success: boolean; data: TrendingContentItem; message: string }> {
    const response = await api.patch(`/admin/trending/${id}/publish`, { isPublished });
    return response.data;
  }

  /**
   * Toggle or update active status
   */
  static async setActiveStatus(id: number | string, isActive: boolean): Promise<{ success: boolean; data: TrendingContentItem; message: string }> {
    const response = await api.patch(`/admin/trending/${id}/status`, { isActive });
    return response.data;
  }
}
