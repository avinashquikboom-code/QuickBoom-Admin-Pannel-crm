import api from '../api';

export interface AiServiceConfigItem {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  creditCost: number;
  pricePerCredit: number;
  packPrice?: number | null;
  isActive: boolean;
  sortOrder: number;
}

export interface AiGenerationItem {
  id: number;
  generationId: string;
  customerId: number;
  type: string;
  status: string;
  product: string;
  objective?: string | null;
  platform?: string | null;
  language?: string | null;
  tone?: string | null;
  cta?: string | null;
  creditsSpent: number;
  caption?: string | null;
  hashtags: string[];
  mediaUrl?: string | null;
  mediaType?: string | null;
  errorMessage?: string | null;
  createdAt: string;
  customer?: { id: number; name: string; email?: string | null; companyName?: string | null };
}

export interface AiCreditTransactionItem {
  id: number;
  walletId: number;
  customerId: number;
  amount: number;
  balanceAfter: number;
  type: string;
  serviceCode?: string | null;
  notes?: string | null;
  createdAt: string;
  customer?: { id: number; name: string; email?: string | null };
}

export interface ConnectedSocialAccountItem {
  id: number;
  customerId: number;
  platform: string;
  accountName: string;
  username?: string | null;
  profilePic?: string | null;
  externalAccountId: string;
  isConnected: boolean;
  createdAt: string;
  customer?: { id: number; name: string; email?: string | null };
}

export interface SocialPublishItem {
  id: number;
  publishId: string;
  customerId: number;
  socialAccountId: number;
  platform: string;
  content?: string | null;
  mediaUrls: string[];
  status: string;
  scheduledFor?: string | null;
  publishedAt?: string | null;
  externalPostId?: string | null;
  externalPostUrl?: string | null;
  errorMessage?: string | null;
  createdAt: string;
  customer?: { id: number; name: string; email?: string | null };
  socialAccount?: { id: number; platform: string; accountName: string; username?: string | null };
}

export class AiSocialAdminService {
  static async getAiServices(): Promise<AiServiceConfigItem[]> {
    const res = await api.get('/admin/ai/services');
    return res.data?.data || [];
  }

  static async updateAiService(code: string, data: Partial<AiServiceConfigItem>): Promise<AiServiceConfigItem> {
    const res = await api.patch(`/admin/ai/services/${code}`, data);
    return res.data?.data;
  }

  static async getGenerations(params?: { type?: string; status?: string; limit?: number; offset?: number }): Promise<{ items: AiGenerationItem[]; total: number }> {
    const res = await api.get('/admin/ai/generations', { params });
    return res.data?.data || { items: [], total: 0 };
  }

  static async getCreditTransactions(params?: { type?: string; limit?: number; offset?: number }): Promise<{ items: AiCreditTransactionItem[]; total: number }> {
    const res = await api.get('/admin/ai/transactions', { params });
    return res.data?.data || { items: [], total: 0 };
  }

  static async getSocialAccounts(params?: { platform?: string; limit?: number; offset?: number }): Promise<{ items: ConnectedSocialAccountItem[]; total: number }> {
    const res = await api.get('/admin/social/accounts', { params });
    return res.data?.data || { items: [], total: 0 };
  }

  static async getSocialPublishes(params?: { status?: string; platform?: string; limit?: number; offset?: number }): Promise<{ items: SocialPublishItem[]; total: number }> {
    const res = await api.get('/admin/social/publishes', { params });
    return res.data?.data || { items: [], total: 0 };
  }
}
