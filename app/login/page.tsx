'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Mail,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  ShieldCheck,
  Building2,
  Sparkles,
} from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { toast } from 'react-hot-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Backend API authentication via dedicated Super Admin login endpoint
      const res: any = await api.post('/admin/auth/login/super-admin', { email, password }).catch(() => {
        // Fallback to standard /auth/login with admin headers if needed
        return api.post('/auth/login', { email, password });
      });
      const payload = res?.data?.user ? res.data : (res?.user ? res : res?.data);
      const user = payload?.user;
      const tokens = payload?.tokens || payload;
      const accessToken = tokens?.accessToken || tokens?.token || payload?.accessToken;
      const refreshToken = tokens?.refreshToken || payload?.refreshToken;

      if (!user || !accessToken) {
        throw new Error('Invalid response structure received from authentication service');
      }

      // STRICT SUPER ADMIN ONLY CHECK: Inspect database/backend authenticated roles
      const userRoles: string[] = Array.isArray(user.roles) ? user.roles : (user.role ? [user.role] : []);
      const isSuperAdmin = userRoles.some(
        (r: string) => {
          const normalized = String(r).toUpperCase().replace(/\s+/g, '_');
          return normalized === 'SUPER_ADMIN';
        }
      );

      if (!isSuperAdmin) {
        throw new Error('Access Denied: The Admin Panel is strictly for SUPER_ADMIN only. Other roles must use the mobile application.');
      }

      const mappedUser = {
        ...user,
        role: 'SUPER_ADMIN',
        roles: ['SUPER_ADMIN'],
      };

      setAuth(mappedUser, accessToken, refreshToken || '');
      toast.success('Welcome back to QUIKBOOM Super Admin Portal!');
      router.push('/dashboard');
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Authentication failed. Please check credentials.';
      toast.error(typeof errorMsg === 'string' ? errorMsg : 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-[#F8FAFC] font-sans text-slate-900 selection:bg-[#23C45E] selection:text-white">
      {/* Left Showcase Banner Column (Hidden on Mobile) */}
      <div className="hidden lg:flex lg:w-7/12 relative flex-col justify-between p-12 overflow-hidden bg-gradient-to-br from-emerald-50/70 via-slate-50 to-emerald-100/40 border-r border-slate-200/80">
        {/* Ambient Glow Orbs */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#23C45E]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="relative z-10 flex items-center gap-3.5">
          <div className="w-12 h-12 relative flex items-center justify-center">
            <Image
              src="/app_logo.png"
              alt="QuikBoom Logo"
              width={48}
              height={48}
              className="object-contain drop-shadow-sm"
              priority
            />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-900 leading-none">
              QUIKBOOM
            </h1>
            <span className="text-[11px] font-bold text-[#1AA14D] tracking-wider uppercase">
              Super Admin Console
            </span>
          </div>
        </div>

        {/* Center Hero Content */}
        <div className="relative z-10 my-auto py-12 max-w-xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#23C45E]/20 text-[#1AA14D] text-xs font-extrabold shadow-sm">
            <Sparkles className="w-4 h-4 text-[#23C45E]" />
            Enterprise Multi-Tenant Platform
          </div>

          <h2 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-[1.1]">
            Global Workspace <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#23C45E] to-emerald-700">
              Command & Analytics
            </span>
          </h2>

          <p className="text-sm text-slate-600 font-medium leading-relaxed">
            Centralized administration hub for customer provisioning, multi-tenant subscription tiers, workforce GPS radar, and enterprise access governance.
          </p>

          {/* Quick Metrics Badge List */}
          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="p-4 rounded-2xl bg-white/80 backdrop-blur-sm border border-slate-200/80 shadow-xs">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-bold mb-1">
                <ShieldCheck className="w-4 h-4 text-[#23C45E]" /> Role Enforcement
              </div>
              <p className="text-sm font-black text-slate-900">SUPER_ADMIN Access</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/80 backdrop-blur-sm border border-slate-200/80 shadow-xs">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-bold mb-1">
                <Building2 className="w-4 h-4 text-[#23C45E]" /> Multi-Tenant
              </div>
              <p className="text-sm font-black text-slate-900">Provisioning & RBAC</p>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 text-xs font-medium text-slate-400">
          © {new Date().getFullYear()} QuikBoom Technologies Pvt Ltd. All rights reserved.
        </div>
      </div>

      {/* Right Login Column */}
      <div className="w-full lg:w-5/12 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo Header */}
          <div className="flex lg:hidden items-center gap-3">
            <Image
              src="/app_logo.png"
              alt="QuikBoom Logo"
              width={40}
              height={40}
              className="object-contain"
            />
            <div>
              <h1 className="text-lg font-black text-slate-900">QUIKBOOM</h1>
              <span className="text-[10px] font-bold text-[#1AA14D] tracking-wider uppercase">
                Super Admin Console
              </span>
            </div>
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Sign In to Admin Portal
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Enter your authorized Super Admin credentials to access administration services.
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                Corporate Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your corporate email address"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#23C45E] focus:bg-white transition-all font-semibold"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your account password"
                  className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#23C45E] focus:bg-white transition-all font-semibold"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 bg-white text-[#23C45E] focus:ring-[#23C45E] accent-[#23C45E]"
                />
                <span className="text-xs text-slate-600 font-semibold">Keep me signed in</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-[#23C45E] hover:bg-[#1AA14D] text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-lg shadow-[#23C45E]/20 transition-all flex items-center justify-center gap-2 cursor-pointer group active:scale-[0.99] disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </div>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
