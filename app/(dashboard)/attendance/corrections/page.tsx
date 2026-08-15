'use client';

import React from 'react';
import { FileCheck, Check, X } from 'lucide-react';

export default function AttendanceCorrectionsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Attendance Correction Requests</h1>
        <p className="text-xs text-slate-500 mt-1 font-medium">Review and resolve employee check-in/out adjustment applications.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2 text-xs">
          <div className="flex justify-between font-bold text-slate-900">
            <span>Vikram Mehta (EMP005)</span>
            <span className="text-amber-600">Pending Approval</span>
          </div>
          <p className="text-slate-600">Requested Check In: 09:00 AM (Reason: Network issue at entrance gate)</p>
          <div className="flex justify-end gap-2 pt-2">
            <button className="px-3 py-1 bg-rose-100 text-rose-700 font-bold rounded-lg flex items-center gap-1">
              <X className="w-3 h-3" /> Reject
            </button>
            <button className="px-3 py-1 bg-emerald-600 text-white font-bold rounded-lg flex items-center gap-1 shadow-2xs">
              <Check className="w-3 h-3" /> Approve Correction
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
