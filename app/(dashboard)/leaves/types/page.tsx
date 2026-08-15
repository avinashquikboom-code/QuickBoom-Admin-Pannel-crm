'use client';

import React from 'react';
import { Calendar, Plus } from 'lucide-react';

export default function LeaveTypesPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Leave Types & Quotas</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">Configure casual, sick, and earned annual leave policies.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-md">
          <Plus className="w-4 h-4" /> Add Leave Type
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <h3 className="font-bold text-slate-900 text-base">Casual Leave (CL)</h3>
          <p className="text-2xl font-black text-indigo-600 mt-2">12 Days / Year</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <h3 className="font-bold text-slate-900 text-base">Sick Leave (SL)</h3>
          <p className="text-2xl font-black text-emerald-600 mt-2">10 Days / Year</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <h3 className="font-bold text-slate-900 text-base">Earned Leave (EL)</h3>
          <p className="text-2xl font-black text-amber-600 mt-2">15 Days / Year</p>
        </div>
      </div>
    </div>
  );
}
