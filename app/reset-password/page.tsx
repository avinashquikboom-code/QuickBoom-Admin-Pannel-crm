'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Lock, ArrowRight, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '@/lib/api';

function ResetPasswordContent() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    const token =
      searchParams.get('token') ||
      (typeof window !== 'undefined' ? sessionStorage.getItem('reset_otp') : null) ||
      '';

    if (!token) {
      toast.error('No reset verification token found. Please start from forgot password.');
      router.push('/forgot-password');
      return;
    }

    setLoading(true);
    try {
      const res: any = await api.post('/auth/reset-password', {
        token,
        newPassword: password,
      });
      const message = res?.message || res?.data?.message || 'Password updated successfully! Please sign in.';
      toast.success(message);
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('reset_otp');
        sessionStorage.removeItem('reset_email');
      }
      router.push('/login');
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Password reset failed';
      toast.error(typeof errorMsg === 'string' ? errorMsg : 'Password reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#F8FAFC] p-4 font-sans text-slate-900 selection:bg-[#23C45E] selection:text-white">
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#23C45E]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 relative mb-2">
            <Image
              src="/app_logo.png"
              alt="QuikBoom Logo"
              width={56}
              height={56}
              className="w-14 h-14 object-contain rounded-2xl shadow-md"
              priority
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Create New Password</h1>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            Your new password must be at least 8 characters long with uppercase and numbers.
          </p>
        </div>

        <form onSubmit={handleReset} className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="block font-extrabold text-slate-700 uppercase tracking-wider">New Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#23C45E] focus:bg-white font-semibold transition-all"
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

          <div className="space-y-1.5">
            <label className="block font-extrabold text-slate-700 uppercase tracking-wider">Confirm New Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#23C45E] focus:bg-white font-semibold transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#23C45E] hover:bg-[#1AA14D] text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-lg shadow-[#23C45E]/20 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 active:scale-[0.99]"
          >
            {loading ? 'Saving Password...' : 'Save New Password & Sign In'}
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="text-center pt-2">
            <Link
              href="/login"
              className="text-xs text-slate-500 hover:text-[#1AA14D] font-bold inline-flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
