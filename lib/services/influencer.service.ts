import api from '../api';

export interface InfluencerItem {
  id: number;
  name: string;
  handle?: string | null;
  avatarUrl?: string | null;
  profileImage?: string | null;
  coverImage?: string | null;
  platform: string;
  categoryId?: number | null;
  categoryName?: string | null;
  location?: string | null;
  city?: string | null;
  localArea?: string | null;
  followers: number;
  followersCount?: string | null;
  engagementRate: number;
  isVerified: boolean;
  isFeatured: boolean;
  isActive: boolean;
  status: string;
  verificationStatus: string;
  topCreator: boolean;
  startingPrice?: number | null;
  bio?: string | null;
  languages?: string[];
  instagramHandle?: string | null;
  youtubeHandle?: string | null;
  gender?: string | null;
  ageRange?: string | null;
  bookingUrl?: string | null;
  rating?: number | null;
  sortOrder: number;
  createdAt: string;
  email?: string | null;
  phone?: string | null;
  rejectionReason?: string | null;
  approvedAt?: string | null;
  rejectedAt?: string | null;
  suspendedAt?: string | null;
  socialLinks?: Record<string, string> | null;
  category?: { id: number; name: string; slug: string };
  packages?: InfluencerPackageItem[];
  _count?: { bookings: number; packages: number };
}

export interface InfluencerApplicationsResponse {
  items: InfluencerItem[];
  counts: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    suspended: number;
  };
}

export interface InfluencerCategoryItem {
  id: number;
  name: string;
  slug: string;
  icon?: string | null;
  description?: string | null;
  sortOrder: number;
  isActive: boolean;
  _count?: { influencers: number };
}

export interface InfluencerPackageItem {
  id: number;
  influencerId: number;
  name: string;
  type: string;
  description?: string | null;
  duration?: string | null;
  price: number;
  isPopular: boolean;
  status: string;
  sortOrder: number;
}

export interface InfluencerAvailabilityItem {
  id: number;
  influencerId: number;
  date: string;
  isAvailable: boolean;
  isBooked?: boolean;
  startTime?: string | null;
  endTime?: string | null;
}

export interface InfluencerBookingItem {
  id: number;
  bookingId: string;
  customerId: number;
  influencerId: number;
  packageId?: number | null;
  campaignDate: string;
  brandName: string;
  contactPerson: string;
  mobileNumber: string;
  email: string;
  businessName: string;
  instagramId?: string | null;
  campaignObjective?: string | null;
  notes?: string | null;
  packageAmount: number;
  platformFee: number;
  gst: number;
  totalAmount: number;
  bookingStatus: string;
  paymentStatus: string;
  paymentMethod?: string | null;
  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  influencer?: { id: number; name: string; profileImage?: string | null; categoryName?: string | null };
  package?: InfluencerPackageItem | null;
  customer?: { id: number; name: string; email?: string | null; phone?: string | null };
}

export interface BookingStats {
  totalBookings: number;
  pendingApproval: number;
  totalRevenue: number;
}

function unwrapData<T = any>(res: any, fallback?: T): T {
  if (!res) return fallback as T;
  // If res has an outer .data (e.g. { statusCode: 200, success: true, data: ... })
  if (res.data !== undefined) {
    // If double-nested { data: { data: ... } }
    if (res.data && typeof res.data === 'object' && res.data.data !== undefined) {
      return res.data.data;
    }
    return res.data;
  }
  return res as T;
}

export class InfluencerAdminService {
  // Influencers
  static async getInfluencers(params?: { search?: string; category?: string; status?: string }): Promise<InfluencerItem[]> {
    const res = await api.get('/admin/influencers', { params });
    const data = unwrapData<any>(res, []);
    return Array.isArray(data) ? data : (data?.items || []);
  }

  static async getInfluencerById(id: number): Promise<InfluencerItem> {
    const res = await api.get(`/admin/influencers/${id}`);
    return unwrapData(res);
  }

  static async createInfluencer(data: Partial<InfluencerItem>): Promise<InfluencerItem> {
    const res = await api.post('/admin/influencers', data);
    return unwrapData(res);
  }

  static async updateInfluencer(id: number, data: Partial<InfluencerItem>): Promise<InfluencerItem> {
    const res = await api.patch(`/admin/influencers/${id}`, data);
    return unwrapData(res);
  }

  static async setFeatured(id: number, isFeatured: boolean): Promise<InfluencerItem> {
    const res = await api.patch(`/admin/influencers/${id}`, { isFeatured });
    return unwrapData(res);
  }

  static async uploadImage(file: File): Promise<{ imageUrl: string; imageKey: string }> {
    const formData = new FormData();
    formData.append('image', file);
    const res = await api.post('/admin/influencers/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return unwrapData(res);
  }

  static async deleteInfluencer(id: number): Promise<void> {
    await api.delete(`/admin/influencers/${id}`);
  }

  // Applications & Verification
  static async getApplications(params?: { search?: string; category?: string; status?: string }): Promise<InfluencerApplicationsResponse> {
    const res = await api.get('/admin/influencers/applications', { params });
    const raw: any = res;
    return {
      items: unwrapData(raw, []),
      counts: raw?.counts || raw?.data?.counts || { total: 0, pending: 0, approved: 0, rejected: 0, suspended: 0 },
    };
  }

  static async getApplicationById(id: number): Promise<InfluencerItem> {
    const res = await api.get(`/admin/influencers/applications/${id}`);
    return unwrapData(res);
  }

  static async approveInfluencer(id: number): Promise<InfluencerItem> {
    const res = await api.patch(`/admin/influencers/${id}/approve`);
    return unwrapData(res);
  }

  static async rejectInfluencer(id: number, reason: string): Promise<InfluencerItem> {
    const res = await api.patch(`/admin/influencers/${id}/reject`, { reason });
    return unwrapData(res);
  }

  static async suspendInfluencer(id: number): Promise<InfluencerItem> {
    const res = await api.patch(`/admin/influencers/${id}/suspend`);
    return unwrapData(res);
  }

  // Categories
  static async getCategories(): Promise<InfluencerCategoryItem[]> {
    const res = await api.get('/admin/influencer-categories');
    const data = unwrapData(res, []);
    return Array.isArray(data) ? data : [];
  }

  static async createCategory(data: Partial<InfluencerCategoryItem>): Promise<InfluencerCategoryItem> {
    const res = await api.post('/admin/influencer-categories', data);
    return unwrapData(res);
  }

  static async updateCategory(id: number, data: Partial<InfluencerCategoryItem>): Promise<InfluencerCategoryItem> {
    const res = await api.patch(`/admin/influencer-categories/${id}`, data);
    return unwrapData(res);
  }

  static async deleteCategory(id: number): Promise<void> {
    await api.delete(`/admin/influencer-categories/${id}`);
  }

  // Packages
  static async getPackages(influencerId: number): Promise<InfluencerPackageItem[]> {
    const res = await api.get(`/admin/influencers/${influencerId}/packages`);
    const data = unwrapData(res, []);
    return Array.isArray(data) ? data : [];
  }

  static async createPackage(influencerId: number, data: Partial<InfluencerPackageItem>): Promise<InfluencerPackageItem> {
    const res = await api.post(`/admin/influencers/${influencerId}/packages`, data);
    return unwrapData(res);
  }

  static async updatePackage(id: number, data: Partial<InfluencerPackageItem>): Promise<InfluencerPackageItem> {
    const res = await api.patch(`/admin/influencer-packages/${id}`, data);
    return unwrapData(res);
  }

  static async deletePackage(id: number): Promise<void> {
    await api.delete(`/admin/influencer-packages/${id}`);
  }

  // Availability
  static async getAvailability(influencerId: number, startDate?: string, endDate?: string): Promise<InfluencerAvailabilityItem[]> {
    const res = await api.get(`/admin/influencers/${influencerId}/availability`, {
      params: { startDate, endDate },
    });
    const data = unwrapData(res, []);
    return Array.isArray(data) ? data : [];
  }

  static async setAvailability(influencerId: number, data: { date: string; isAvailable?: boolean; startTime?: string; endTime?: string }): Promise<InfluencerAvailabilityItem> {
    const res = await api.post(`/admin/influencers/${influencerId}/availability`, data);
    return unwrapData(res);
  }

  static async deleteAvailability(id: number): Promise<void> {
    await api.delete(`/admin/influencer-availability/${id}`);
  }

  // Bookings
  static async getBookings(params?: { search?: string; status?: string; paymentStatus?: string; limit?: number; offset?: number }): Promise<{ items: InfluencerBookingItem[]; total: number }> {
    const res = await api.get('/admin/influencer-bookings', { params });
    const data = unwrapData(res, { items: [], total: 0 });
    return data;
  }

  static async getBookingStats(): Promise<BookingStats> {
    const res = await api.get('/admin/influencer-bookings/stats');
    const data = unwrapData(res, { totalBookings: 0, pendingApproval: 0, totalRevenue: 0 });
    return data;
  }

  static async getBookingById(id: string | number): Promise<InfluencerBookingItem> {
    const res = await api.get(`/admin/influencer-bookings/${id}`);
    return unwrapData(res);
  }

  static async approveBooking(id: number): Promise<void> {
    await api.post(`/admin/influencer-bookings/${id}/approve`);
  }

  static async rejectBooking(id: number, reason?: string): Promise<void> {
    await api.post(`/admin/influencer-bookings/${id}/reject`, { reason });
  }

  static async cancelBooking(id: number, reason?: string): Promise<void> {
    await api.post(`/admin/influencer-bookings/${id}/cancel`, { reason });
  }

  static async updatePaymentStatus(id: number, paymentStatus: string): Promise<void> {
    await api.patch(`/admin/influencer-bookings/${id}/payment-status`, { paymentStatus });
  }
}
