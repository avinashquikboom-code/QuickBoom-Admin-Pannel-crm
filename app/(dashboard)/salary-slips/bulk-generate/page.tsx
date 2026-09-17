'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Zap, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { getErrorMessage } from '@/lib/utils';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function BulkGenerateSalarySlipsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const now = new Date();
  const currentMonthIdx = now.getMonth();
  const currentYearStr = String(now.getFullYear()) || '2026';

  const [selectedMonth, setSelectedMonth] = useState<string>(MONTH_NAMES[currentMonthIdx] || 'September');
  const [selectedYear, setSelectedYear] = useState<string>(currentYearStr);

  const selectedMonthNum = MONTH_NAMES.indexOf(selectedMonth) + 1;

  const bulkMutation = useMutation({
    mutationFn: async () => {
      return api.post('/admin/payroll/generate', {
        month: selectedMonthNum,
        year: Number(selectedYear),
      });
    },
    onSuccess: (res: any) => {
      const msg = res?.data?.message || `Salary slips bulk generated for ${selectedMonth} ${selectedYear}`;
      toast.success(msg);
      queryClient.invalidateQueries({ queryKey: ['admin-salary-slips'] });
      queryClient.invalidateQueries({ queryKey: ['admin-current-payroll'] });
      queryClient.invalidateQueries({ queryKey: ['admin-payroll-history'] });
      router.push('/payroll?tab=slips');
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err));
    },
  });

  const handleBulk = (e: React.FormEvent) => {
    e.preventDefault();
    bulkMutation.mutate();
  };

  return (
    <div className="space-y-8 max-w-xl">
      <div className="flex items-center gap-4">
        <Link href="/payroll?tab=slips" className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Bulk Generate Monthly Payslips</h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">Batch generate salary slips for all active employees for the selected period.</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-8">
        <form onSubmit={handleBulk} className="space-y-6 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">Salary Month</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-xl font-bold bg-slate-50 focus:bg-white"
              >
                {MONTH_NAMES.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">Salary Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-xl font-bold bg-slate-50 focus:bg-white"
              >
                {['2025', '2026', '2027'].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="p-4 bg-emerald-50/70 border border-emerald-100 rounded-2xl">
            <p className="font-bold text-emerald-900">Batch Target: All Active Company Employees</p>
            <p className="text-emerald-700 mt-0.5">
              Period: <span className="font-black">{selectedMonth} {selectedYear}</span>. Calculates dynamic working days from calendar, employee attendance, approved leave, and generates itemized slips.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Link href="/payroll?tab=slips" className="px-5 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={bulkMutation.isPending}
              className="px-5 py-2.5 bg-[#23C45E] hover:bg-[#1AA14D] text-slate-950 font-black rounded-xl shadow-md flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {bulkMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Start Bulk Generation
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
