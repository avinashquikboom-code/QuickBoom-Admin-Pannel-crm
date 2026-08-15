'use client';

import React from 'react';
import { Calendar } from 'lucide-react';

export default function LeaveBalancePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Employee Leave Balances</h1>
        <p className="text-xs text-slate-500 mt-1 font-medium">Real-time breakdown of remaining vs availed leave quotas per staff member.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 text-xs">
        <p className="font-bold text-slate-900">Rahul Sharma (EMP001) - Leave Balance 2026</p>
        <div className="grid grid-cols-3 gap-4 mt-3">
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-500 font-medium">Casual Leave</span>
            <p className="text-lg font-black text-indigo-600">10 Remaining / 12</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-500 font-medium">Sick Leave</span>
            <p className="text-lg font-black text-emerald-600">8 Remaining / 10</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-500 font-medium">Earned Leave</span>
            <p className="text-lg font-black text-amber-600">15 Remaining / 15</p>
          </div>
        </div>
      </div>
    </div>
  );
}
