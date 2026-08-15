'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Edit, Building, Mail, Phone, DollarSign } from 'lucide-react';

export default function LeadDetailPage() {
  const params = useParams();
  const id = params?.id || '1';

  return (
    <div className="space-y-8 max-w-3xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/leads" className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Lead Overview (#{id})</h1>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">Detailed lead opportunity record.</p>
          </div>
        </div>

        <Link href={`/leads/${id}/edit`} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5">
          <Edit className="w-4 h-4" /> Edit Lead
        </Link>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-8 space-y-6 text-xs">
        <div className="flex justify-between items-center pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">Ankit Kulkarni</h2>
            <p className="text-slate-500 font-medium">Apex Tech Solutions</p>
          </div>
          <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 font-bold text-xs border border-indigo-200">
            QUALIFIED
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 font-bold">Est. Value</span>
            <p className="font-extrabold text-emerald-600 text-base mt-0.5">₹4,50,000</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 font-bold">Source</span>
            <p className="font-bold text-slate-900 mt-0.5">WEBSITE</p>
          </div>
        </div>
      </div>
    </div>
  );
}
