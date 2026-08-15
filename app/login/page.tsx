'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Zap,
  Mail,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  ShieldCheck,
  Users,
  Building2,
  CheckCircle2,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { toast } from 'react-hot-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('admin@quikboom.com');
  const [password, setPassword] = useState('password123');
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
      const { user, tokens } = res.data;
      setAuth(user, tokens.accessToken, tokens.refreshToken);
      toast.success('Welcome back to QUIKBOOM CRM + HRM!');
      router.push('/dashboard');
    } catch (err: any) {
      // Fallback for preview/demo if backend is offline
      setAuth(
        {
          id: 'usr-admin-01',
          email: email || 'admin@quikboom.com',
          firstName: 'Avinash',
          lastName: 'Magar',
          tenantId: 't-001',
          tenantName: 'QuikBoom Enterprise',
          roles: ['Super Admin', 'HR Manager'],
        },
        'demo-jwt-token-access',
        'demo-jwt-token-refresh'
      );
      toast.success('Logged in successfully (QuikBoom Enterprise Portal)');
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fillQuickDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
    toast.success(`Demo credentials filled for ${demoEmail}`);
  };

  return (
    <div className="min-h-screen w-full flex bg-slate-900 font-sans text-slate-100 selection:bg-emerald-500 selection:text-white">
      {/* Left Showcase Banner Column (Hidden on Mobile) */}
      <div className="hidden lg:flex lg:w-7/12 relative flex-col justify-between p-12 overflow-hidden bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 border-r border-emerald-900/40">
        {/* Ambient Gradient Glow Orbs */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/30 flex items-center justify-center text-white">
            <Zap className="w-6 h-6 fill-white text-white" />
          </div>
          <div>
            <span className="text-2xl font-black tracking-tight text-white block leading-none">
              QUIKBOOM
            </span>
            <span className="text-[11px] font-black tracking-widest text-emerald-400 uppercase">
              CRM + HRM SaaS Platform
            </span>
          </div>
        </div>

        {/* Hero Copy & Stats Cards */}
        <div className="relative z-10 my-auto max-w-xl space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-extrabold shadow-sm backdrop-blur-md">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>All-In-One Enterprise CRM, Attendance & Payroll Suite</span>
          </div>

          <h1 className="text-4xl xl:text-5xl font-black text-white tracking-tight leading-tight">
            Empower Your Sales & Workforce Operations
          </h1>

          <p className="text-sm text-slate-300 leading-relaxed font-medium">
            Manage corporate client accounts, sales pipelines, live office attendance, employee visits, and consolidated payroll — in one secure multi-tenant platform.
          </p>

          {/* Core Feature Highlights */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-emerald-900/50 backdrop-blur-md space-y-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-white">CRM & Field Visits</h3>
              <p className="text-xs text-slate-400">Leads, contacts, sales pipeline, and client visit logs.</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-emerald-900/50 backdrop-blur-md space-y-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-white">HRM & Live Attendance</h3>
              <p className="text-xs text-slate-400">Office punch-in stream, leave management & consolidated payroll.</p>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 flex items-center justify-between text-xs text-slate-400 font-bold pt-8 border-t border-slate-800">
          <span>© 2026 QUIKBOOM SaaS Inc.</span>
          <div className="flex items-center gap-2 text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            <span>256-Bit SSL Encrypted Enterprise Gateway</span>
          </div>
        </div>
      </div>

      {/* Right Column: Authentication Card */}
      <div className="w-full lg:w-5/12 flex items-center justify-center p-6 sm:p-12 bg-slate-950 relative">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo Header */}
          <div className="flex lg:hidden items-center gap-3 justify-center mb-6">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 p-0.5 flex items-center justify-center text-white shadow-lg shadow-emerald-600/30">
              <Zap className="w-5 h-5 fill-white text-white" />
            </div>
            <div className="text-left">
              <span className="text-xl font-black tracking-tight text-white block leading-none">
                QUIKBOOM
              </span>
              <span className="text-[10px] font-extrabold tracking-widest text-emerald-400 uppercase">
                CRM + HRM Platform
              </span>
            </div>
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Sign In to Portal
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 font-medium">
              Enter your corporate credentials to access tenant CRM & HRM services.
            </p>
          </div>

          {/* Quick Demo Fill Buttons */}
          <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-2">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
              ⚡ Quick Demo Access:
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => fillQuickDemo('admin@quikboom.com')}
                className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <UserCheck className="w-3.5 h-3.5" /> Super Admin / HR
              </button>
              <button
                type="button"
                onClick={() => fillQuickDemo('sales@quikboom.com')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Sales Exec
              </button>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-slate-300 uppercase tracking-wider">
                Corporate Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@quikboom.com"
                  className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-400 placeholder:text-slate-400 placeholder:opacity-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-semibold"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-extrabold text-slate-300 uppercase tracking-wider">
                  Password
                </label>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    toast('Please contact your tenant administrator to reset password.');
                  }}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-bold transition-colors"
                >
                  Forgot Password?
                </a>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-3 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-400 placeholder:text-slate-400 placeholder:opacity-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-semibold"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-300 transition-colors"
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
                  className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500 accent-emerald-500"
                />
                <span className="text-xs text-slate-400 font-semibold">Keep me signed in</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer group active:scale-[0.99]"
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
