'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, MapPin, Building2, Clock, CheckCircle2 } from 'lucide-react';

export default function VisitDetailPage() {
  const params = useParams();
  const id = params?.id || '1';

  return (
    <div className="space-y-8 max-w-2xl">
      <div className="flex items-center gap-4">
        <Link href="/visits" className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Field Visit Details (#{id})</h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">GPS location details and client meeting report.</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-8 space-y-6 text-xs">
        <div className="flex justify-between items-center pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">Sneha Gupta</h2>
            <p className="text-slate-500 font-medium">Acme Enterprises Client Meeting</p>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200">
            COMPLETED
          </span>
        </div>

        <div className="space-y-3">
          <div className="p-3 bg-slate-50 rounded-xl flex items-center gap-2">
            <MapPin className="w-4 h-4 text-rose-500" />
            <span className="font-bold text-slate-900">Location:</span>
            <span className="text-slate-700">Bandra Kurla Complex, Mumbai</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-500" />
            <span className="font-bold text-slate-900">Time & Duration:</span>
            <span className="text-slate-700">10:15 AM - 11:45 AM (1h 30m)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
