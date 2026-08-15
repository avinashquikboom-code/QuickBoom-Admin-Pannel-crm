'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Zap } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function GenerateSalarySlipPage() {
  const router = useRouter();
  const [employeeId, setEmployeeId] = useState('EMP001');

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(`Salary slip generated for ${employeeId}`);
    router.push('/salary-slips');
  };

  return (
    <div className="space-y-8 max-w-xl">
      <div className="flex items-center gap-4">
        <Link href="/salary-slips" className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Generate Individual Payslip</h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">Create a monthly salary slip for an employee.</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-8">
        <form onSubmit={handleGenerate} className="space-y-6 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">Select Employee</label>
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-xl font-bold"
            >
              <option value="EMP001">Rahul Sharma (EMP001)</option>
              <option value="EMP002">Priya Singh (EMP002)</option>
              <option value="EMP003">Amit Verma (EMP003)</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
            <Link href="/salary-slips" className="px-5 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl">
              Cancel
            </Link>
            <button type="submit" className="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl shadow-md flex items-center gap-2">
              <Zap className="w-4 h-4" /> Generate Payslip
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
