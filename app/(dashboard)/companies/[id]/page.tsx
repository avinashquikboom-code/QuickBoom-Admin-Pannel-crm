'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Building2, MapPin } from 'lucide-react';

export default function CompanyDetailPage() {
  const params = useParams();
  const id = params?.id || '1';

  return (
    <div className="space-y-8 max-w-3xl">
      <div className="flex items-center gap-4">
        <Link href="/companies" className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Company Account Overview (#{id})</h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">Corporate account details.</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-8 space-y-6 text-xs">
        <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xl">
            <Building2 className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">Acme Enterprises</h2>
            <p className="text-slate-500 font-medium">Software & Technology • Mumbai, MH</p>
          </div>
        </div>

        <div className="p-4 bg-slate-50 rounded-2xl">
          <span className="font-bold text-slate-400 uppercase text-[10px]">Active Opportunities</span>
          <p className="font-bold text-slate-900 text-sm mt-1">3 Deals in sales pipeline (₹12,50,000 Total Pipeline Value)</p>
        </div>
      </div>
    </div>
  );
}
