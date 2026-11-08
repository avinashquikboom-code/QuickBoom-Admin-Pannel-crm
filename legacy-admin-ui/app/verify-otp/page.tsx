'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Key, ArrowRight, ArrowLeft, Mail, Loader2, RefreshCw, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';

function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth } = useAuthStore();

  const emailParam = searchParams?.get('email') || '';
  const modeParam = searchParams?.get('mode') || 'login'; // 'login' | 'reset'

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    let targetEmail = emailParam;
    if (!targetEmail && typeof window !== 'undefined') {
      targetEmail = sessionStorage.getItem('auth_email') || '';
    }
    setEmail(targetEmail);
  }, [emailParam]);

  // Countdown timer for resend cooldown (60 seconds)
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanOtp = otp.trim();
    if (cleanOtp.length !== 6) {
      toast.error('Please enter the complete 6-digit OTP code');
      return;
    }

    setLoading(true);
    try {
      if (modeParam === 'reset') {
        // Password reset flow: verify code and forward to reset password
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('reset_otp', cleanOtp);
          sessionStorage.setItem('reset_email', email);
        }
        toast.success('Code verified. Set your new password.');
        router.push(`/reset-password?token=${encodeURIComponent(cleanOtp)}&email=${encodeURIComponent(email)}`);
        return;
      }

      // Login / verification flow
      const res: any = await api.post('/auth/verify-email-otp', {
        email: email.trim(),
        otp: cleanOtp,
      });

      const data = res?.data || res;
      if (data?.tokens || data?.user) {
        const user = data.user;
        const token = data.tokens?.accessToken || data.token;
        const refreshToken = data.tokens?.refreshToken || '';
        if (user && token) {
          setAuth(user, token, refreshToken);
        }
        toast.success('Verification successful! Welcome back.');
        router.push('/dashboard');
      } else {
        toast.success('Code verified successfully.');
        router.push('/login');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Invalid or expired OTP code';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || isResending) return;
    if (!email.trim()) {
      toast.error('Registered email address is required to resend OTP');
      return;
    }

    setIsResending(true);
    try {
      const res: any = await api.post('/auth/resend-email-otp', {
        email: email.trim(),
      });
      toast.success(res?.message || res?.data?.message || 'New 6-digit OTP sent to your email');
      setCooldown(60);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to resend OTP';
      toast.error(msg);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-8 shadow-xl space-y-6">
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
        <h1 className="text-2xl font-black text-slate-900">Email OTP Verification</h1>
        <p className="text-xs text-slate-500 font-medium leading-relaxed">
          {email ? (
            <>
              Enter the 6-digit code sent to <strong className="text-slate-800">{email}</strong>.
            </>
          ) : (
            'Enter the 6-digit verification code sent to your registered email.'
          )}
        </p>
      </div>

      <form onSubmit={handleVerify} className="space-y-4 text-xs">
        {!email && (
          <div>
            <label className="block font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@quickboom.com"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium text-xs focus:outline-none focus:ring-2 focus:ring-[#23C45E] focus:bg-white transition-all"
              />
            </div>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block font-extrabold text-slate-700 uppercase tracking-wider">
              Verification Code (OTP)
            </label>
            <span className="text-[10px] text-slate-400 font-semibold">Valid for 5 minutes</span>
          </div>
          <div className="relative">
            <Key className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              required
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="••••••"
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono tracking-widest text-center font-bold text-lg focus:outline-none focus:ring-2 focus:ring-[#23C45E] focus:bg-white transition-all"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || otp.trim().length !== 6}
          className="w-full py-3.5 bg-[#23C45E] hover:bg-[#1AA14D] text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-lg shadow-[#23C45E]/20 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Verifying Code...
            </>
          ) : (
            <>
              Verify & Continue
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="text-center text-xs text-slate-500">
        Didn't receive the email code?{' '}
        {cooldown > 0 ? (
          <span className="text-slate-400 font-bold">Resend available in {cooldown}s</span>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending}
            className="text-[#1AA14D] hover:underline font-extrabold cursor-pointer inline-flex items-center gap-1"
          >
            {isResending ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            Resend OTP
          </button>
        )}
      </div>

      <div className="text-center pt-2">
        <Link
          href="/login"
          className="text-xs text-slate-500 hover:text-[#1AA14D] font-bold inline-flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
        </Link>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#F8FAFC] p-4 font-sans text-slate-900 selection:bg-[#23C45E] selection:text-white">
      <Suspense
        fallback={
          <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 shadow-xl">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-500">Loading verification session...</p>
          </div>
        }
      >
        <VerifyOtpContent />
      </Suspense>
    </div>
  );
}
