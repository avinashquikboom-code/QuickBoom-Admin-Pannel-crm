import api from '@/lib/api';

export interface MarketingBannerItem {
  id: number;
  customerId?: number | null;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  imageUrl: string;
  mobileImageUrl?: string | null;
  ctaText?: string | null;
  ctaUrl?: string | null;
  priority: number;
  isActive: boolean;
  isPublished: boolean;
  startAt?: string | null;
  endAt?: string | null;
  createdBy?: number | null;
  createdByUser?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBannerPayload {
  title: string;
  subtitle?: string;
  description?: string;
  imageUrl?: string;
  ctaText?: string;
  ctaUrl?: string;
  priority?: number;
  isActive?: boolean;
  isPublished?: boolean;
  startAt?: string | null;
  endAt?: string | null;
  customerId?: number | string;
}

export interface UpdateBannerPayload {
  title?: string;
  subtitle?: string;
  description?: string;
  imageUrl?: string;
  ctaText?: string;
  ctaUrl?: string;
  priority?: number;
  isActive?: boolean;
  isPublished?: boolean;
  startAt?: string | null;
  endAt?: string | null;
}

export interface QueryBannerParams {
  search?: string;
  isPublished?: boolean | string;
  isActive?: boolean | string;
  page?: number;
  limit?: number;
  customerId?: number | string;
}

export interface BannerListResponse {
  success: boolean;
  data?: {
    items: MarketingBannerItem[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  } | MarketingBannerItem[];
  items?: MarketingBannerItem[];
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export class BannerService {
  /**
   * Fetch paginated list of banners for Admin
   */
  static async getBanners(params?: QueryBannerParams): Promise<BannerListResponse> {
    const response = await api.get('/admin/marketing/banners', { params });
    return response.data;
  }

  /**
   * Fetch single banner by ID
   */
  static async getBannerById(id: number | string): Promise<{ success: boolean; data: MarketingBannerItem }> {
    const response = await api.get(`/admin/marketing/banners/${id}`);
    return response.data;
  }

  /**
   * Create a new marketing banner (supports FormData for image file upload)
   */
  static async createBanner(
    payload: CreateBannerPayload | FormData,
  ): Promise<{ success: boolean; data: MarketingBannerItem; message: string }> {
    const isFormData = typeof FormData !== 'undefined' && payload instanceof FormData;
    const response = await api.post('/admin/marketing/banners', payload, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
    });
    return response.data;
  }

  /**
   * Update an existing marketing banner (supports FormData for image file upload)
   */
  static async updateBanner(
    id: number | string,
    payload: UpdateBannerPayload | FormData,
  ): Promise<{ success: boolean; data: MarketingBannerItem; message: string }> {
    const isFormData = typeof FormData !== 'undefined' && payload instanceof FormData;
    const response = await api.patch(`/admin/marketing/banners/${id}`, payload, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
    });
    return response.data;
  }

  /**
   * Soft delete a marketing banner
   */
  static async deleteBanner(id: number | string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/admin/marketing/banners/${id}`);
    return response.data;
  }

  /**
   * Toggle or update published status
   */
  static async setPublished(id: number | string, isPublished: boolean): Promise<{ success: boolean; data: MarketingBannerItem; message: string }> {
    const response = await api.patch(`/admin/marketing/banners/${id}/publish`, { isPublished });
    return response.data;
  }

  /**
   * Toggle or update active status
   */
  static async setActiveStatus(id: number | string, isActive: boolean): Promise<{ success: boolean; data: MarketingBannerItem; message: string }> {
    const response = await api.patch(`/admin/marketing/banners/${id}/status`, { isActive });
    return response.data;
  }
}
