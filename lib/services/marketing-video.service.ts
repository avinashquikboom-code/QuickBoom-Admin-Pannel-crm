import api from '@/lib/api';

export interface MarketingVideoItem {
  id: number;
  customerId?: number | null;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  videoUrl: string;
  videoKey?: string | null;
  thumbnailUrl?: string | null;
  thumbnailKey?: string | null;
  ctaText?: string | null;
  ctaUrl?: string | null;
  status: 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | string;
  priority: number;
  isActive: boolean;
  isPublished: boolean;
  showOnHome: boolean;
  showInIntroduction: boolean;
  startAt?: string | null;
  endAt?: string | null;
  createdBy?: number | null;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVideoPayload {
  title: string;
  subtitle?: string;
  description?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  ctaText?: string;
  ctaUrl?: string;
  status?: string;
  priority?: number;
  isActive?: boolean;
  isPublished?: boolean;
  showOnHome?: boolean;
  showInIntroduction?: boolean;
  startAt?: string | null;
  endAt?: string | null;
  customerId?: number | string;
}

export interface UpdateVideoPayload {
  title?: string;
  subtitle?: string;
  description?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  ctaText?: string;
  ctaUrl?: string;
  status?: string;
  priority?: number;
  isActive?: boolean;
  isPublished?: boolean;
  showOnHome?: boolean;
  showInIntroduction?: boolean;
  startAt?: string | null;
  endAt?: string | null;
}

export interface QueryVideoParams {
  search?: string;
  status?: string;
  isPublished?: boolean | string;
  isActive?: boolean | string;
  page?: number;
  limit?: number;
  customerId?: number | string;
}

export interface VideoListResponse {
  data: MarketingVideoItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class MarketingVideoService {
  /**
   * Fetch paginated list of videos for Admin
   */
  static async getVideos(params?: QueryVideoParams): Promise<VideoListResponse> {
    const response: any = await api.get('/admin/marketing/videos', { params });
    const res = response?.data || response;
    // Normalize format
    if (Array.isArray(res?.data)) {
      return {
        data: res.data,
        total: res.total ?? res.data.length,
        page: res.page ?? 1,
        limit: res.limit ?? 20,
        totalPages: res.totalPages ?? 1,
      };
    }
    if (Array.isArray(res)) {
      return {
        data: res,
        total: res.length,
        page: 1,
        limit: res.length,
        totalPages: 1,
      };
    }
    return {
      data: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 1,
    };
  }

  /**
   * Fetch single video by ID
   */
  static async getVideoById(id: number | string): Promise<MarketingVideoItem> {
    const response: any = await api.get(`/admin/marketing/videos/${id}`);
    return response?.data || response;
  }

  /**
   * Create a new marketing video (supports FormData for video & thumbnail files)
   */
  static async createVideo(
    payload: CreateVideoPayload | FormData,
  ): Promise<MarketingVideoItem> {
    const isFormData = typeof FormData !== 'undefined' && payload instanceof FormData;
    const response: any = await api.post(
      '/admin/marketing/videos',
      payload,
      isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined,
    );
    return response?.data || response;
  }

  /**
   * Update an existing marketing video
   */
  static async updateVideo(
    id: number | string,
    payload: UpdateVideoPayload | FormData,
  ): Promise<MarketingVideoItem> {
    const isFormData = typeof FormData !== 'undefined' && payload instanceof FormData;
    const response: any = await api.patch(
      `/admin/marketing/videos/${id}`,
      payload,
      isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined,
    );
    return response?.data || response;
  }

  /**
   * Soft delete a marketing video
   */
  static async deleteVideo(id: number | string): Promise<{ success: boolean; message: string }> {
    const response: any = await api.delete(`/admin/marketing/videos/${id}`);
    return response?.data || response;
  }

  /**
   * Toggle or update active status
   */
  static async setStatus(
    id: number | string,
    isActive: boolean,
    status?: string,
  ): Promise<MarketingVideoItem> {
    const response: any = await api.patch(`/admin/marketing/videos/${id}/status`, {
      isActive,
      status,
    });
    return response?.data || response;
  }

  /**
   * Toggle or update published status
   */
  static async setPublished(id: number | string, isPublished: boolean): Promise<MarketingVideoItem> {
    const response: any = await api.patch(`/admin/marketing/videos/${id}/publish`, { isPublished });
    return response?.data || response;
  }

  /**
   * Reset customer view records for a specific marketing video so eligible customers can see it again
   */
  static async resetViews(id: number | string): Promise<{ success: boolean; message: string }> {
    const response: any = await api.post(`/admin/marketing/videos/${id}/reset-views`);
    return response?.data || response;
  }
}
