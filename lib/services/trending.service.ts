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
  imageUrl?: string;
  videoUrl?: string;
  mediaType?: 'IMAGE' | 'VIDEO';
  mediaSource?: 'UPLOAD' | 'URL';
  file?: File | null;
  files?: File[];
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
  imageUrl?: string;
  videoUrl?: string;
  mediaType?: 'IMAGE' | 'VIDEO';
  mediaSource?: 'UPLOAD' | 'URL';
  file?: File | null;
  files?: File[];
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
  mediaType?: 'IMAGE' | 'VIDEO' | 'ALL';
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
  stats?: {
    total: number;
    reels: number;
    stories: number;
    offers: number;
    highRoi: number;
    images?: number;
    videos?: number;
  };
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
    const response: any = await api.get('/admin/trending', { params });
    return response;
  }

  /**
   * Fetch single trending item by ID
   */
  static async getTrendingById(id: number | string): Promise<{ success: boolean; data: TrendingContentItem }> {
    const response: any = await api.get(`/admin/trending/${id}`);
    return response;
  }

  /**
   * Create a new trending content item (supports single file, multiple files & URL)
   */
  static async createTrending(payload: CreateTrendingPayload | FormData): Promise<{ success: boolean; data: TrendingContentItem; message: string }> {
    if (payload instanceof FormData) {
      const response: any = await api.post('/admin/trending', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response;
    }

    if ((payload.files && payload.files.length > 0) || payload.file) {
      const formData = new FormData();
      if (payload.files && payload.files.length > 0) {
        payload.files.forEach((f) => formData.append('files', f));
      } else if (payload.file) {
        formData.append('file', payload.file);
      }

      Object.entries(payload).forEach(([key, val]) => {
        if (key !== 'file' && key !== 'files' && val !== undefined && val !== null) {
          if (typeof val === 'object') {
            formData.append(key, JSON.stringify(val));
          } else {
            formData.append(key, String(val));
          }
        }
      });
      const response: any = await api.post('/admin/trending', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response;
    }

    const response: any = await api.post('/admin/trending', payload);
    return response;
  }

  /**
   * Update an existing trending item (supports file replace & URL update)
   */
  static async updateTrending(id: number | string, payload: UpdateTrendingPayload | FormData): Promise<{ success: boolean; data: TrendingContentItem; message: string }> {
    if (payload instanceof FormData) {
      const response: any = await api.patch(`/admin/trending/${id}`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response;
    }

    if (payload.file) {
      const formData = new FormData();
      formData.append('file', payload.file);
      Object.entries(payload).forEach(([key, val]) => {
        if (key !== 'file' && val !== undefined && val !== null) {
          if (typeof val === 'object') {
            formData.append(key, JSON.stringify(val));
          } else {
            formData.append(key, String(val));
          }
        }
      });
      const response: any = await api.patch(`/admin/trending/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response;
    }

    const response: any = await api.patch(`/admin/trending/${id}`, payload);
    return response;
  }

  /**
   * Delete a trending item
   */
  static async deleteTrending(id: number | string): Promise<{ success: boolean; message: string }> {
    const response: any = await api.delete(`/admin/trending/${id}`);
    return response;
  }

  /**
   * Toggle or update published status
   */
  static async setPublished(id: number | string, isPublished: boolean): Promise<{ success: boolean; data: TrendingContentItem; message: string }> {
    const response: any = await api.patch(`/admin/trending/${id}/publish`, { isPublished });
    return response;
  }

  /**
   * Toggle or update active status
   */
  static async setActiveStatus(id: number | string, isActive: boolean): Promise<{ success: boolean; data: TrendingContentItem; message: string }> {
    const response: any = await api.patch(`/admin/trending/${id}/status`, { isActive });
    return response;
  }
}
