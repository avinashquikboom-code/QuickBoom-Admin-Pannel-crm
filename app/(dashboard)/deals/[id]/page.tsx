'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Kanban, DollarSign, Building2 } from 'lucide-react';

export default function DealDetailPage() {
  const params = useParams();
  const id = params?.id || '1';

  return (
    <div className="space-y-8 max-w-2xl">
      <div className="flex items-center gap-4">
        <Link href="/crm" className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Deal Stage Details (#{id})</h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">Pipeline stage and revenue parameters.</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-8 space-y-6 text-xs">
        <div className="flex justify-between items-center pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">Acme Corp Enterprise License</h2>
            <p className="text-slate-500 font-medium">Acme Technologies Inc.</p>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200">
            CLOSED WON
          </span>
        </div>

        <div className="p-4 bg-slate-50 rounded-2xl flex items-center justify-between">
          <span className="text-slate-500 font-bold">Contract Value</span>
          <span className="text-xl font-black text-emerald-600">₹6,50,000</span>
        </div>
      </div>
    </div>
  );
}
