'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Check, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function LeaveDetailPage() {
  const params = useParams();
  const id = params?.id || '1';

  return (
    <div className="space-y-8 max-w-2xl">
      <div className="flex items-center gap-4">
        <Link href="/leaves" className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Leave Application Details (#{id})</h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">Review leave request parameters and approval actions.</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-8 space-y-6 text-xs">
        <div className="flex justify-between items-center pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">Rahul Sharma (EMP001)</h2>
            <p className="text-slate-500 font-medium">Sales Department • Sales Manager</p>
          </div>
          <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 font-bold text-xs border border-amber-200">
            PENDING APPROVAL
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 font-bold">Leave Type</span>
            <p className="font-bold text-slate-900 mt-0.5">Casual Leave</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 font-bold">Duration</span>
            <p className="font-bold text-slate-900 mt-0.5">3 Days (20-Aug to 22-Aug)</p>
          </div>
        </div>

        <div className="p-3 bg-slate-50 rounded-xl space-y-1">
          <span className="text-slate-400 font-bold">Reason</span>
          <p className="text-slate-700 font-medium">Family function in hometown</p>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            onClick={() => toast.error('Leave rejected')}
            className="px-4 py-2 bg-rose-100 text-rose-700 font-bold rounded-xl flex items-center gap-1"
          >
            <X className="w-4 h-4" /> Reject
          </button>
          <button
            onClick={() => toast.success('Leave approved')}
            className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl flex items-center gap-1 shadow-md"
          >
            <Check className="w-4 h-4" /> Approve Leave
          </button>
        </div>
      </div>
    </div>
  );
}
