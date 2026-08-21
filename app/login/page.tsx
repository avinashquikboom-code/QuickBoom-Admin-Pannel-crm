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
  Users,
  Building2,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { toast } from 'react-hot-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('admin@quikboom.com');
  const [password, setPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Backend API authentication
      const res: any = await api.post('/auth/login', { email, password });
      const payload = res?.data?.user ? res.data : (res?.user ? res : res?.data);
      const user = payload?.user;
      const tokens = payload?.tokens;

      if (!user || !tokens) {
        throw new Error('Invalid response structure received from authentication service');
      }

      // Map backend RoleType enum to UI role names if needed
      const roleMapping: Record<string, string> = {
        SUPER_ADMIN: 'Super Admin',
        CUSTOMER_ADMIN: 'Customer Owner',
        SALES_MANAGER: 'Manager',
        SALES_EXECUTIVE: 'Employee',
        SUPPORT_AGENT: 'Employee',
      };

      const mappedUser = {
        ...user,
        roles: (user.roles || []).map((r: string) => roleMapping[r] || r),
      };

      setAuth(mappedUser, tokens.accessToken, tokens.refreshToken);
      toast.success('Welcome back to QUIKBOOM CRM + HRM!');
      router.push('/dashboard');
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Authentication failed. Please check credentials.';
      toast.error(typeof errorMsg === 'string' ? errorMsg : 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const fillQuickDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('123456');
    toast.success(`Demo credentials filled for ${demoEmail}`);
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
              className="w-12 h-12 object-contain rounded-2xl shadow-md"
              priority
            />
          </div>
          <div>
            <span className="text-2xl font-black tracking-tight text-slate-900 block leading-none">
              QUIKBOOM
            </span>
            <span className="text-[11px] font-black tracking-widest text-[#1AA14D] uppercase">
              CRM + HRM SaaS Platform
            </span>
          </div>
        </div>

        {/* Hero Copy & Stats Cards */}
        <div className="relative z-10 my-auto max-w-xl space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#E8F9EE] border border-[#23C45E]/30 text-[#1AA14D] text-xs font-extrabold shadow-xs">
            <Sparkles className="w-4 h-4 text-[#23C45E]" />
            <span>All-In-One Enterprise CRM, Attendance & Payroll Suite</span>
          </div>

          <h1 className="text-4xl xl:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Empower Your Sales & Workforce Operations
          </h1>

          <p className="text-sm text-slate-600 leading-relaxed font-medium">
            Manage corporate client accounts, sales pipelines, live office attendance, employee visits, and consolidated payroll — in one secure multi-customer platform.
          </p>

          {/* Core Feature Highlights */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
              <div className="w-10 h-10 rounded-xl bg-[#E8F9EE] text-[#1AA14D] flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-sm text-slate-900">CRM & Field Visits</h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">Leads, contacts, sales pipeline, and client visit logs.</p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
              <div className="w-10 h-10 rounded-xl bg-[#E8F9EE] text-[#1AA14D] flex items-center justify-center font-bold">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-sm text-slate-900">HRM & Live Attendance</h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">Office punch-in stream, leave management & consolidated payroll.</p>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 flex items-center justify-between text-xs text-slate-500 font-bold pt-8 border-t border-slate-200">
          <span>© 2026 QUIKBOOM SaaS Inc.</span>
          <div className="flex items-center gap-2 text-[#1AA14D]">
            <ShieldCheck className="w-4 h-4" />
            <span>256-Bit SSL Encrypted Enterprise Gateway</span>
          </div>
        </div>
      </div>

      {/* Right Column: Authentication Card */}
      <div className="w-full lg:w-5/12 flex items-center justify-center p-6 sm:p-12 bg-white relative">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo Header */}
          <div className="flex lg:hidden items-center gap-3 justify-center mb-6">
            <div className="w-10 h-10 relative flex items-center justify-center">
              <Image
                src="/app_logo.png"
                alt="QuikBoom Logo"
                width={40}
                height={40}
                className="w-10 h-10 object-contain rounded-xl shadow-xs"
              />
            </div>
            <div className="text-left">
              <span className="text-xl font-black tracking-tight text-slate-900 block leading-none">
                QUIKBOOM
              </span>
              <span className="text-[10px] font-extrabold tracking-widest text-[#1AA14D] uppercase">
                CRM + HRM Platform
              </span>
            </div>
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Sign In to Admin Portal
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Enter your credentials to access customer administration services.
            </p>
          </div>

          {/* Quick Demo Fill Buttons */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">
                ⚡ Active Admin Role:
              </span>
              <span className="text-[9px] font-extrabold text-[#1AA14D] bg-[#E8F9EE] px-2 py-0.5 rounded border border-[#23C45E]/30">
                Super Admin Only
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => fillQuickDemo('admin@quikboom.com')}
                className="px-3.5 py-2 bg-[#E8F9EE] hover:bg-[#d4f5de] text-[#1AA14D] border border-[#23C45E]/30 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shadow-2xs w-full justify-center"
              >
                <UserCheck className="w-4 h-4 text-[#23C45E]" /> Fill Super Admin Credentials (admin@quikboom.com)
              </button>
            </div>
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
                  placeholder="admin@quikboom.com"
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
                  placeholder="••••••••••••"
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
              className="w-full py-3.5 px-4 bg-[#23C45E] hover:bg-[#1AA14D] text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-lg shadow-[#23C45E]/20 transition-all flex items-center justify-center gap-2 cursor-pointer group active:scale-[0.99]"
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
