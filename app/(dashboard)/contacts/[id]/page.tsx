'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Mail, Phone, Building2 } from 'lucide-react';

export default function ContactDetailPage() {
  const params = useParams();
  const id = params?.id || '1';

  return (
    <div className="space-y-8 max-w-2xl">
      <div className="flex items-center gap-4">
        <Link href="/contacts" className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Contact Entry Details (#{id})</h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">Viewing client contact details.</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-8 space-y-6 text-xs">
        <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
          <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-500 to-teal-400 text-white font-bold text-lg flex items-center justify-center">
            AC
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900">Ankit Kulkarni</h2>
            <p className="text-slate-500 font-medium">Apex Tech Solutions</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="p-3 bg-slate-50 rounded-xl flex items-center gap-2">
            <Mail className="w-4 h-4 text-indigo-500" />
            <span className="font-bold text-slate-900">Email:</span>
            <span className="text-slate-700">ankit@apextech.com</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl flex items-center gap-2">
            <Phone className="w-4 h-4 text-emerald-500" />
            <span className="font-bold text-slate-900">Phone:</span>
            <span className="text-slate-700">9876543210</span>
          </div>
        </div>
      </div>
    </div>
  );
}
