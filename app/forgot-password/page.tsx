'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Zap,
  Mail,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      toast.success('Password reset instructions sent to your corporate email');
    }, 800);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 p-4 font-sans text-slate-100 selection:bg-emerald-500 selection:text-white">
      {/* Background ambient glow */}
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 mb-2 shadow-lg shadow-emerald-600/30">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Zap className="w-6 h-6 text-emerald-400 fill-emerald-400" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Forgot Password</h1>
          <p className="text-xs text-slate-400 font-medium leading-relaxed">
            Enter your registered corporate email address to receive a secure password reset link and OTP code.
          </p>
        </div>

        {submitted ? (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 text-center space-y-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
            <div className="space-y-1">
              <h2 className="text-base font-extrabold text-white">Instructions Dispatched</h2>
              <p className="text-xs text-slate-300">
                We sent a password reset link to <span className="font-bold text-emerald-400">{email}</span>.
              </p>
            </div>

            <div className="pt-2 space-y-2">
              <button
                onClick={() => router.push('/verify-otp')}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <KeyRound className="w-4 h-4" /> Enter Verification OTP
              </button>

              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
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
                  className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-semibold"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
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
                className="text-xs text-slate-400 hover:text-emerald-400 font-bold inline-flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
              </Link>
            </div>
          </form>
        )}

        <div className="pt-4 border-t border-slate-800 text-center text-[10px] text-slate-500 font-bold flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>256-Bit SSL Encrypted Enterprise Auth</span>
        </div>
      </div>
    </div>
  );
}
