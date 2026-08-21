'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Mail,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res: any = await api.post('/auth/forgot-password', { email });
      const message = res?.message || res?.data?.message || 'Password reset instructions sent to your corporate email';
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('reset_email', email);
      }
      setSubmitted(true);
      toast.success(message);
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Failed to request password reset';
      toast.error(typeof errorMsg === 'string' ? errorMsg : 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#F8FAFC] p-4 font-sans text-slate-900 selection:bg-[#23C45E] selection:text-white">
      {/* Background ambient glow */}
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#23C45E]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        {/* Brand Header */}
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
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Forgot Password</h1>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            Enter your registered corporate email address to receive a secure password reset link and OTP code.
          </p>
        </div>

        {submitted ? (
          <div className="bg-[#E8F9EE] border border-[#23C45E]/30 rounded-2xl p-6 text-center space-y-4">
            <CheckCircle2 className="w-12 h-12 text-[#23C45E] mx-auto animate-bounce" />
            <div className="space-y-1">
              <h2 className="text-base font-extrabold text-slate-900">Instructions Dispatched</h2>
              <p className="text-xs text-slate-600">
                We sent a password reset link to <span className="font-bold text-[#1AA14D]">{email}</span>.
              </p>
            </div>

            <div className="pt-2 space-y-2">
              <button
                onClick={() => router.push('/verify-otp')}
                className="w-full py-3 bg-[#23C45E] hover:bg-[#1AA14D] text-white rounded-xl text-xs font-black transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <KeyRound className="w-4 h-4" /> Enter Verification OTP
              </button>

              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
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
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#23C45E] focus:bg-white font-semibold transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#23C45E] hover:bg-[#1AA14D] text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-lg shadow-[#23C45E]/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
            >
              {loading ? (
                <span>Dispatching Reset Link...</span>
              ) : (
                <>
                  <span>Send Reset Link & OTP</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
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
        )}

        <div className="pt-4 border-t border-slate-100 text-center text-[10px] text-slate-400 font-bold flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-[#23C45E]" />
          <span>256-Bit SSL Encrypted Enterprise Auth</span>
        </div>
      </div>
    </div>
  );
}
