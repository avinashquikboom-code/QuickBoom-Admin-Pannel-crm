'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShieldAlert, ArrowLeft, Lock } from 'lucide-react';

export default function RegisterPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 p-4 font-sans text-slate-100">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6 text-center">
        <div className="space-y-2">
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
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-black uppercase">
            <Lock className="w-3.5 h-3.5" />
            <span>Restricted Access</span>
          </div>
          <h1 className="text-2xl font-black text-white">Direct Registration Disabled</h1>
          <p className="text-xs text-slate-400 font-medium leading-relaxed">
            Employee and Administrative accounts are provisioned exclusively by the Organization Super Administrator. Customer self-registration is available exclusively on the Customer Mobile Portal.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-left space-y-2 text-xs">
          <div className="font-black text-slate-200 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-emerald-400" />
            Security & Provisioning Policy
          </div>
          <ul className="text-slate-400 space-y-1 text-[11px] list-disc list-inside">
            <li>Customer users: Self-register via Customer Mobile App.</li>
            <li>Employees & Admins: Account created by Admin in Console.</li>
          </ul>
        </div>

        <Link
          href="/login"
          className="w-full py-3.5 bg-[#23C45E] hover:bg-[#1AA14D] text-white font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Sign In</span>
        </Link>
      </div>
    </div>
  );
}
