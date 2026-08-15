'use client';

import React from 'react';
import { Calendar, Clock, Download, Filter } from 'lucide-react';

export default function MonthlyAttendancePage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Monthly Attendance Matrix</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">Monthly working days, leave counts, and overtime summary per employee.</p>
        </div>

        <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold shadow-2xs">
          <Download className="w-4 h-4" /> Export Matrix
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
        <p className="text-xs font-bold text-slate-500">Monthly breakdown matrix view (August 2026)</p>
      </div>
    </div>
  );
}
