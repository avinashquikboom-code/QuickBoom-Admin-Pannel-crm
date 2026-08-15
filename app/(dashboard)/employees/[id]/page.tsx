'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Edit, Mail, Phone, Building2, Calendar, ShieldCheck, CheckCircle } from 'lucide-react';

export default function EmployeeDetailPage() {
  const params = useParams();
  const id = params?.id || 'EMP001';

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/employees" className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Employee Details</h1>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">Viewing record for ID: {id}</p>
          </div>
        </div>

        <Link
          href={`/employees/${id}/edit`}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md"
        >
          <Edit className="w-4 h-4" /> Edit Profile
        </Link>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-8 space-y-6">
        <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-500 to-teal-400 text-white font-bold text-xl flex items-center justify-center shadow-md">
            RS
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">Rahul Sharma</h2>
            <p className="text-xs text-indigo-600 font-bold">EMP001 • Sales Manager</p>
            <span className="inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle className="w-3 h-3 text-emerald-600" /> ACTIVE
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-2xl space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Department</span>
            <p className="font-bold text-slate-900">Sales</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Role</span>
            <p className="font-bold text-slate-900">HR Manager</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Email</span>
            <p className="font-bold text-slate-900">rahul.sharma@quikboom.com</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Phone</span>
            <p className="font-bold text-slate-900">9876543210</p>
          </div>
        </div>
      </div>
    </div>
  );
}
