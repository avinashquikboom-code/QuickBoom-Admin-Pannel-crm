'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Key, ArrowRight, ArrowLeft } from 'lucide-react';
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
          email: 'admin@quikboom.com',
          firstName: 'Demo',
          lastName: 'User',
          customerId: 't-001',
          customerName: 'QuikBoom Enterprise',
          roles: ['Super Admin', 'HR Manager'],
        },
        'token-access',
        'token-refresh'
      );
      toast.success('Phone verified successfully!');
      router.push('/dashboard');
    }, 800);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#F8FAFC] p-4 font-sans text-slate-900 selection:bg-[#23C45E] selection:text-white">
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
          <h1 className="text-2xl font-black text-slate-900">Verify Phone OTP</h1>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            Enter the 6-digit verification code sent to your registered mobile number.
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-4 text-xs">
          <div>
            <label className="block font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">Verification Code (OTP)</label>
            <div className="relative">
              <Key className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="text"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono tracking-widest text-center font-bold text-base focus:outline-none focus:ring-2 focus:ring-[#23C45E] focus:bg-white transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#23C45E] hover:bg-[#1AA14D] text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-lg shadow-[#23C45E]/20 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            {loading ? 'Verifying Code...' : 'Verify & Sign In'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-center text-xs text-slate-500">
          Didn't receive code?{' '}
          <button
            onClick={() => toast.success('New OTP sent to your phone!')}
            className="text-[#1AA14D] hover:underline font-extrabold cursor-pointer"
          >
            Resend OTP
          </button>
        </p>

        <div className="text-center pt-2">
          <Link
            href="/login"
            className="text-xs text-slate-500 hover:text-[#1AA14D] font-bold inline-flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
