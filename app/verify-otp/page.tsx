'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Zap, Key, ArrowRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '@/lib/store';

export default function VerifyOtpPage() {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 4) {
      toast.error('Please enter a valid OTP code');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setAuth(
        {
          id: 'usr-new-01',
          email: 'user@quikboom.com',
          firstName: 'Registered',
          lastName: 'User',
          tenantId: 't-001',
          tenantName: 'QuikBoom Enterprise',
          roles: ['Employee'],
        },
        'token-access',
        'token-refresh'
      );
      toast.success('Phone verified successfully!');
      router.push('/dashboard');
    }, 800);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 p-4 font-sans text-slate-100">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-emerald-400 p-0.5 mb-2 shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Zap className="w-6 h-6 text-emerald-400 fill-emerald-400" />
            </div>
          </div>
          <h1 className="text-2xl font-black text-white">Verify Phone OTP</h1>
          <p className="text-xs text-slate-400 font-medium">
            Enter the 6-digit verification code sent to your registered mobile number.
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1.5">Verification Code (OTP)</label>
            <div className="relative">
              <Key className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
              <input
                type="text"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-mono tracking-widest text-center font-bold text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            {loading ? 'Verifying Code...' : 'Verify & Sign In'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-center text-xs text-slate-400">
          Didn't receive code?{' '}
          <button
            onClick={() => toast.success('New OTP sent to your phone!')}
            className="text-indigo-400 hover:underline font-bold"
          >
            Resend OTP
          </button>
        </p>
      </div>
    </div>
  );
}
