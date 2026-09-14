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
  category?: { id: number; name: string; slug: string };
  packages?: InfluencerPackageItem[];
  _count?: { bookings: number; packages: number };
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

export class InfluencerAdminService {
  // Influencers
  static async getInfluencers(params?: { search?: string; category?: string; status?: string }): Promise<InfluencerItem[]> {
    const res = await api.get('/admin/influencers', { params });
    return res.data?.data || [];
  }

  static async getInfluencerById(id: number): Promise<InfluencerItem> {
    const res = await api.get(`/admin/influencers/${id}`);
    return res.data?.data;
  }

  static async createInfluencer(data: Partial<InfluencerItem>): Promise<InfluencerItem> {
    const res = await api.post('/admin/influencers', data);
    return res.data?.data;
  }

  static async updateInfluencer(id: number, data: Partial<InfluencerItem>): Promise<InfluencerItem> {
    const res = await api.patch(`/admin/influencers/${id}`, data);
    return res.data?.data;
  }

  static async deleteInfluencer(id: number): Promise<void> {
    await api.delete(`/admin/influencers/${id}`);
  }

  // Categories
  static async getCategories(): Promise<InfluencerCategoryItem[]> {
    const res = await api.get('/admin/influencer-categories');
    return res.data?.data || [];
  }

  static async createCategory(data: Partial<InfluencerCategoryItem>): Promise<InfluencerCategoryItem> {
    const res = await api.post('/admin/influencer-categories', data);
    return res.data?.data;
  }

  static async updateCategory(id: number, data: Partial<InfluencerCategoryItem>): Promise<InfluencerCategoryItem> {
    const res = await api.patch(`/admin/influencer-categories/${id}`, data);
    return res.data?.data;
  }

  static async deleteCategory(id: number): Promise<void> {
    await api.delete(`/admin/influencer-categories/${id}`);
  }

  // Packages
  static async getPackages(influencerId: number): Promise<InfluencerPackageItem[]> {
    const res = await api.get(`/admin/influencers/${influencerId}/packages`);
    return res.data?.data || [];
  }

  static async createPackage(influencerId: number, data: Partial<InfluencerPackageItem>): Promise<InfluencerPackageItem> {
    const res = await api.post(`/admin/influencers/${influencerId}/packages`, data);
    return res.data?.data;
  }

  static async updatePackage(id: number, data: Partial<InfluencerPackageItem>): Promise<InfluencerPackageItem> {
    const res = await api.patch(`/admin/influencer-packages/${id}`, data);
    return res.data?.data;
  }

  static async deletePackage(id: number): Promise<void> {
    await api.delete(`/admin/influencer-packages/${id}`);
  }

  // Availability
  static async getAvailability(influencerId: number, startDate?: string, endDate?: string): Promise<InfluencerAvailabilityItem[]> {
    const res = await api.get(`/admin/influencers/${influencerId}/availability`, {
      params: { startDate, endDate },
    });
    return res.data?.data || [];
  }

  static async setAvailability(influencerId: number, data: { date: string; isAvailable?: boolean; startTime?: string; endTime?: string }): Promise<InfluencerAvailabilityItem> {
    const res = await api.post(`/admin/influencers/${influencerId}/availability`, data);
    return res.data?.data;
  }

  static async deleteAvailability(id: number): Promise<void> {
    await api.delete(`/admin/influencer-availability/${id}`);
  }

  // Bookings
  static async getBookings(params?: { search?: string; status?: string; paymentStatus?: string; limit?: number; offset?: number }): Promise<{ items: InfluencerBookingItem[]; total: number }> {
    const res = await api.get('/admin/influencer-bookings', { params });
    return res.data?.data || { items: [], total: 0 };
  }

  static async getBookingStats(): Promise<BookingStats> {
    const res = await api.get('/admin/influencer-bookings/stats');
    return res.data?.data || { totalBookings: 0, pendingApproval: 0, totalRevenue: 0 };
  }

  static async getBookingById(id: string | number): Promise<InfluencerBookingItem> {
    const res = await api.get(`/admin/influencer-bookings/${id}`);
    return res.data?.data;
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
