import axios, { AxiosInstance } from 'axios';
import { useAuthStore } from '../store';

export class AdminAuthService {
  private api: AxiosInstance;

  constructor(baseURL: string = process.env.NEXT_PUBLIC_API_URL || 'https://api.qbapp.online/api/v1') {
    this.api = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
        'x-client-type': 'admin',
      },
    });
  }

  /**
   * ✅ SUPER ADMIN LOGIN
   * POST /api/v1/admin/auth/login/super-admin
   */
  async loginSuperAdmin(email: string, password: string) {
    try {
      console.log('[ADMIN] Logging in as SUPER_ADMIN:', email);

      const response = await this.api.post(
        '/admin/auth/login/super-admin', // ✅ Dedicated Admin endpoint
        {
          email,
          password,
        }
      );

      if (response.data?.success || response.data?.data) {
        const payload = response.data?.data || response.data;
        const tokens = payload?.tokens || payload;
        const user = payload?.user;

        const accessToken = tokens?.accessToken || tokens?.token || payload?.accessToken;
        const refreshToken = tokens?.refreshToken || payload?.refreshToken;

        if (accessToken) {
          localStorage.setItem('accessToken', accessToken);
        }
        if (refreshToken) {
          localStorage.setItem('refreshToken', refreshToken);
        }
        if (user) {
          localStorage.setItem('user', JSON.stringify(user));
        }

        // Sync with primary Zustand Auth Store
        if (user && accessToken) {
          const mappedUser = {
            ...user,
            role: 'SUPER_ADMIN',
            roles: ['SUPER_ADMIN'],
          };
          useAuthStore.getState().setAuth(mappedUser, accessToken, refreshToken || '');
        }

        console.log('[ADMIN] SUPER_ADMIN login successful');
        return payload;
      }

      throw new Error('Login failed: Invalid server response');
    } catch (error: any) {
      console.error('[ADMIN] SUPER_ADMIN login error:', error.message);
      throw new Error(
        error.response?.data?.message || 'Login failed: ' + error.message
      );
    }
  }

  // Get stored user
  getStoredUser() {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  // Get access token
  getAccessToken() {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('accessToken');
  }

  // Logout
  logout() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    try {
      useAuthStore.getState().logout();
    } catch {}
  }
}
