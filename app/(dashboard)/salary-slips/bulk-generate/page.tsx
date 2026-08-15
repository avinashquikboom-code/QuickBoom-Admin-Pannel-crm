'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Zap } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function BulkGenerateSalarySlipsPage() {
  const router = useRouter();
  const [month, setMonth] = useState('August 2026');

  const handleBulk = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(`Bulk generated payslips for all 250 employees (${month})`);
    router.push('/salary-slips');
  };

  return (
    <div className="space-y-8 max-w-xl">
      <div className="flex items-center gap-4">
        <Link href="/salary-slips" className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Bulk Generate Monthly Payslips</h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">Batch generate salary slips for all active employees.</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-8">
        <form onSubmit={handleBulk} className="space-y-6 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">Pay Period Month</label>
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-xl font-bold"
            >
              <option value="August 2026">August 2026</option>
              <option value="July 2026">July 2026</option>
            </select>
          </div>

          <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
            <p className="font-bold text-indigo-900">Batch Target: 250 Employees</p>
            <p className="text-indigo-700 mt-0.5">Calculates base salary, HRA, PF, TDS deductions, and generates printable PDF slips.</p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Link href="/salary-slips" className="px-5 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl">
              Cancel
            </Link>
            <button type="submit" className="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl shadow-md flex items-center gap-2">
              <Zap className="w-4 h-4" /> Start Bulk Generation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
