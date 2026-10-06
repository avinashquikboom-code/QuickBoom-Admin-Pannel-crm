'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  Mail,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  UserCheck,
  Building2,
  Briefcase
} from 'lucide-react';
import api from '@/lib/api';
import { useEmployeeAuthStore } from '@/lib/employee-store';
import { toast } from 'react-hot-toast';

export default function EmployeeLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const setAuth = useEmployeeAuthStore((state) => state.setAuth);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      toast.error('Email address or Employee ID is required.');
      return;
    }
    if (!password || password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      useEmployeeAuthStore.getState().logout();

      // Uses the same API endpoint used by Employee Mobile application
      const res: any = await api.post('/auth/login/employee', {
        email: cleanEmail,
        password,
      });

      const payload = res?.data?.user ? res.data : (res?.user ? res : res?.data);
      const user = payload?.user;
      const tokens = payload?.tokens || payload;
      const accessToken = tokens?.accessToken || tokens?.token || payload?.accessToken;
      const refreshToken = tokens?.refreshToken || payload?.refreshToken;

      if (!user || !accessToken) {
        throw new Error('Invalid response structure received from authentication service');
      }

      setAuth(user, accessToken, refreshToken || '');
      toast.success('Welcome back to the Employee Workspace!');
      router.push('/employee/dashboard');
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Authentication failed. Please check credentials.';
      toast.error(typeof errorMsg === 'string' ? errorMsg : 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-[#F8FAFC] font-sans text-slate-900 selection:bg-[#2563EB] selection:text-white">
      {/* Left Showcase Banner Column (Hidden on Mobile) */}
      <div className="hidden lg:flex lg:w-7/12 relative flex-col justify-between p-12 overflow-hidden bg-gradient-to-br from-blue-50/70 via-slate-50 to-blue-100/40 border-r border-slate-200/80">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#2563EB]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex items-center gap-3">
          <div className="bg-white p-2.5 rounded-2xl shadow-sm border border-slate-200/60">
            <Image
              src="/app_logo.png"
              alt="QuikBoom Logo"
              width={32}
              height={32}
              className="object-contain"
            />
          </div>
          <div>
            <span className="text-xl font-black text-slate-900 tracking-tight block leading-none mb-1">
              QB SUITE
            </span>
            <span className="text-[10px] font-bold text-[#2563EB] tracking-wider uppercase">
              Employee Workspace
            </span>
          </div>
        </div>

        <div className="relative z-10 max-w-xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100/50 border border-blue-200/50 text-blue-700 text-xs font-bold mb-4">
            <Briefcase className="w-4 h-4" />
            <span>Staff Portal</span>
          </div>
          
          <h2 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-[1.1]">
            Your Work,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              Simplified.
            </span>
          </h2>

          <p className="text-sm text-slate-600 font-medium leading-relaxed">
            Access your schedule, manage attendance, request leaves, and review your performance from a centralized hub.
          </p>
        </div>

        <div className="relative z-10 text-xs font-medium text-slate-400">
          © {new Date().getFullYear()} QB Suite Technologies Pvt Ltd. All rights reserved.
        </div>
      </div>

      {/* Right Login Column */}
      <div className="w-full lg:w-5/12 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="flex lg:hidden items-center gap-3">
            <Image
              src="/app_logo.png"
              alt="QuikBoom Logo"
              width={40}
              height={40}
              className="object-contain"
            />
            <div>
              <h1 className="text-lg font-black text-slate-900">QB SUITE</h1>
              <span className="text-[10px] font-bold text-[#2563EB] tracking-wider uppercase">
                Employee Workspace
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Sign In
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Enter your credentials to access your employee dashboard.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                Email / ID
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email or employee ID"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:bg-white transition-all font-semibold"
                />
              </div>
            </div>

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
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:bg-white transition-all font-semibold"
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

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 bg-white text-[#2563EB] focus:ring-[#2563EB] accent-[#2563EB]"
                />
                <span className="text-xs text-slate-600 font-semibold">Keep me signed in</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-lg shadow-[#2563EB]/20 transition-all flex items-center justify-center gap-2 cursor-pointer group active:scale-[0.99] disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </div>
              ) : (
                <>
                  <span>Sign In as Employee</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="pt-6 border-t border-slate-200/80 text-center space-y-4">
            <Link 
              href="/login" 
              className="inline-flex items-center justify-center w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs sm:text-sm rounded-xl transition-all gap-2 cursor-pointer active:scale-[0.99] border border-slate-200 shadow-sm"
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
              <span>Back to Main Login</span>
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
