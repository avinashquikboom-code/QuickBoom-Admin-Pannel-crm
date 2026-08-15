'use client';

import React from 'react';
import Link from 'next/link';
import { Banknote, FileSpreadsheet, Zap, Download } from 'lucide-react';

export default function PayrollPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Payroll Processing & Dispersal</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">Batch process monthly employee payroll, review deductions, and lock pay runs.</p>
        </div>

        <div className="flex gap-3">
          <Link href="/salary-slips/bulk-generate" className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-2">
            <Zap className="w-4 h-4" /> Run August Payroll
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 text-xs space-y-4">
        <div className="flex justify-between items-center pb-4 border-b border-slate-100">
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm">August 2026 Monthly Payroll Batch</h3>
            <p className="text-slate-500 font-medium">Processed for 250 Employees • Total Payout: ₹1,52,50,000</p>
          </div>
          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 font-bold rounded-full border border-emerald-200">
            COMPLETED & DISBURSED
          </span>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Link href="/payroll/batch-2026-08" className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold">
            View Batch Details
          </Link>
        </div>
      </div>
    </div>
  );
}
