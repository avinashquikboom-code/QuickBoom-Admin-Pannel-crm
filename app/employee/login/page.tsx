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
  ShieldCheck,
  Building2,
  Sparkles,
  KeyRound,
  ArrowLeft
} from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';
import { useEmployeeAuthStore } from '@/lib/employee-store';
import { isBpoEmployee } from '@/lib/access-control';

export default function EmployeeLoginPage() {
  const [loginMode, setLoginMode] = useState<'password' | 'otp'>('password');
  const [otpStep, setOtpStep] = useState<'request' | 'verify'>('request');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const setAuth = useEmployeeAuthStore((state) => state.setAuth);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      toast.error('Email, Mobile No, or Emp Code is required.');
      return;
    }
    if (!password || password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      useEmployeeAuthStore.getState().logout();

      const res: any = await api.post('/auth/login/employee', {
        email: cleanEmail,
        password,
        appType: 'EMPLOYEE_WEB',
      });

      const payload = res?.data?.user ? res.data : (res?.user ? res : res?.data);
      const user = payload?.user;
      const tokens = payload?.tokens || payload;
      const accessToken = tokens?.accessToken || tokens?.token || payload?.accessToken;
      const refreshToken = tokens?.refreshToken || payload?.refreshToken;

      if (!user || !accessToken) {
        throw new Error('Invalid response structure received from authentication service');
      }

      if (!isBpoEmployee(user)) {
        useEmployeeAuthStore.getState().logout();
        toast.error('Employee Workspace is available only for BPO employees.');
        return;
      }

      setAuth(user, accessToken, refreshToken || '');

      // Fetch permissions from backend exactly like Employee Mobile
      try {
        const permsRes: any = await api.get('/works/my-permissions', {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        const rawData = permsRes?.data?.data || permsRes?.data || permsRes;
        const rawPerms = Array.isArray(rawData?.effectivePermissions) ? rawData.effectivePermissions : (Array.isArray(rawData?.permissions) ? rawData.permissions : []);
        const rawModules = Array.isArray(rawData?.modules) ? rawData.modules : [];
        
        const activePerms = [...rawPerms, ...rawModules];
        
        if (activePerms.length > 0) {
          useEmployeeAuthStore.getState().updateUser({ permissions: activePerms });
        }
      } catch (permErr) {
        console.error('Failed to fetch employee permissions during login:', permErr);
      }

      toast.success('Welcome back to the Employee Workspace!');
      router.push('/employee/dashboard');
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Authentication failed. Please check credentials.';
      toast.error(typeof errorMsg === 'string' ? errorMsg : 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      toast.error('Email, Mobile No, or Emp Code is required to send OTP.');
      return;
    }

    setLoading(true);
    try {
      const res: any = await api.post('/auth/send-otp', {
        email: cleanEmail,
      });
      toast.success(res?.data?.message || res?.message || 'OTP sent successfully!');
      setOtpStep('verify');
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Failed to send OTP. Please check your ID.';
      toast.error(typeof errorMsg === 'string' ? errorMsg : 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanOtp = otp.trim();
    if (cleanOtp.length < 4) {
      toast.error('Please enter a valid OTP code.');
      return;
    }

    setLoading(true);
    try {
      useEmployeeAuthStore.getState().logout();
      
      const res: any = await api.post('/auth/verify-otp', {
        email: email.trim().toLowerCase(),
        otp: cleanOtp,
        appType: 'EMPLOYEE_WEB',
      });

      const payload = res?.data?.user ? res.data : (res?.user ? res : res?.data);
      const user = payload?.user;
      const tokens = payload?.tokens || payload;
      const accessToken = tokens?.accessToken || tokens?.token || payload?.accessToken;
      const refreshToken = tokens?.refreshToken || payload?.refreshToken;

      if (!user || !accessToken) {
        throw new Error('Invalid response structure received from authentication service');
      }

      if (!isBpoEmployee(user)) {
        useEmployeeAuthStore.getState().logout();
        toast.error('Employee Workspace is available only for BPO employees.');
        return;
      }

      setAuth(user, accessToken, refreshToken || '');

      try {
        const permsRes: any = await api.get('/works/my-permissions', {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        const rawData = permsRes?.data?.data || permsRes?.data || permsRes;
        const rawPerms = Array.isArray(rawData?.effectivePermissions) ? rawData.effectivePermissions : (Array.isArray(rawData?.permissions) ? rawData.permissions : []);
        const rawModules = Array.isArray(rawData?.modules) ? rawData.modules : [];
        const activePerms = [...rawPerms, ...rawModules];
        
        if (activePerms.length > 0) {
          useEmployeeAuthStore.getState().updateUser({ permissions: activePerms });
        }
      } catch (permErr) {
        console.error('Failed to fetch employee permissions during login:', permErr);
      }

      toast.success('Welcome back to the Employee Workspace!');
      router.push('/employee/dashboard');
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Invalid or expired OTP code.';
      toast.error(typeof errorMsg === 'string' ? errorMsg : 'OTP verification failed.');
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

        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100/50 text-blue-700 text-xs font-bold mb-8 border border-blue-200/50">
            <Building2 className="w-4 h-4" />
            <span>Staff Portal</span>
          </div>
          
          <h1 className="text-5xl lg:text-6xl font-black text-slate-900 leading-[1.1] tracking-tight mb-6">
            Your Work, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2563EB] to-blue-400">
              Simplified.
            </span>
          </h1>
          
          <p className="text-base font-medium text-slate-600 leading-relaxed max-w-md">
            Access your schedule, manage attendance, request leaves, and review your performance from a centralized hub.
          </p>
        </div>

        <div className="relative z-10 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          © 2026 QB Suite Technologies Pvt Ltd. All rights reserved.
        </div>
      </div>

      {/* Right Login Form Column */}
      <div className="w-full lg:w-5/12 flex flex-col justify-center px-6 sm:px-12 lg:px-16 xl:px-24 relative">
        <div className="max-w-md w-full mx-auto space-y-8">
          
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
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
              {loginMode === 'password' ? 'Sign In' : (otpStep === 'request' ? 'Sign In with OTP' : 'Verify OTP')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              {loginMode === 'password' ? 'Enter your credentials to access your employee dashboard.' : 
               (otpStep === 'request' ? 'Enter your registered ID to receive a secure login code.' : 'Enter the OTP code sent to your registered contact.')}
            </p>
          </div>

          {/* Mode Toggle */}
          {otpStep === 'request' && (
            <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200/60">
              <button
                type="button"
                onClick={() => setLoginMode('password')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  loginMode === 'password' 
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Password
              </button>
              <button
                type="button"
                onClick={() => setLoginMode('otp')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  loginMode === 'otp' 
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                OTP Login
              </button>
            </div>
          )}

          {loginMode === 'password' ? (
            <form onSubmit={handlePasswordLogin} className="space-y-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                  Email / Mobile No / Emp Code
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email, mobile no, or emp code"
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
          ) : (
            otpStep === 'request' ? (
              <form onSubmit={handleSendOtp} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                    Email / Mobile No / Emp Code
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter email, mobile no, or emp code"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:bg-white transition-all font-semibold"
                    />
                  </div>
                </div>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-lg shadow-slate-900/20 transition-all flex items-center justify-center gap-2 cursor-pointer group active:scale-[0.99] disabled:opacity-50"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Sending OTP...</span>
                    </div>
                  ) : (
                    <>
                      <span>Send OTP</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                    Verification Code
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="Enter 6-digit OTP"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all font-semibold tracking-widest text-center"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    type="submit"
                    disabled={loading || otp.length < 4}
                    className="w-full py-3.5 px-4 bg-[#23C45E] hover:bg-[#1AA14D] text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-lg shadow-[#23C45E]/20 transition-all flex items-center justify-center gap-2 cursor-pointer group active:scale-[0.99] disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Verifying...</span>
                      </div>
                    ) : (
                      <>
                        <span>Verify & Login</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setOtpStep('request')}
                    className="w-full py-2.5 px-4 bg-transparent text-slate-500 hover:text-slate-700 font-bold text-xs sm:text-sm rounded-xl transition-colors flex items-center justify-center gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back to ID Input
                  </button>
                </div>
              </form>
            )
          )}

          {/* Registration Link */}
          <div className="pt-2 text-center">
            <span className="text-xs sm:text-sm font-medium text-slate-500">
              Don&apos;t have an account?{' '}
            </span>
            <Link
              href="/employee/register"
              className="text-xs sm:text-sm font-extrabold text-[#2563EB] hover:text-[#1d4ed8] transition-colors"
            >
              Register
            </Link>
          </div>

          {/* Bottom Back Button */}
          <div className="pt-4 border-t border-slate-200/80">
            <Link
              href="/login"
              className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Main Login</span>
            </Link>
          </div>
          
        </div>
      </div>
    </div>
  );
}
