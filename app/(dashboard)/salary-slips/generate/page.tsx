'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Zap, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { getErrorMessage } from '@/lib/utils';
import { AdminPageHeader } from '@/components/admin';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function GenerateSalarySlipPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const now = new Date();
  const currentMonthIdx = now.getMonth();
  const currentYearStr = String(now.getFullYear()) || '2026';

  const [employeeId, setEmployeeId] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>(MONTH_NAMES[currentMonthIdx] || 'September');
  const [selectedYear, setSelectedYear] = useState<string>(currentYearStr);

  const selectedMonthNum = MONTH_NAMES.indexOf(selectedMonth) + 1;

  // Fetch real active employees
  const { data: employeesData, isLoading: isEmployeesLoading } = useQuery({
    queryKey: ['admin-employees-for-slip-gen'],
    queryFn: async () => {
      const res: any = await api.get('/employees?limit=200');
      const items = res.data?.data || res.data?.items || (Array.isArray(res.data) ? res.data : []);
      return Array.isArray(items) ? items : [];
    },
  });

  const employeesList = Array.isArray(employeesData) ? employeesData : [];

  const generateMutation = useMutation({
    mutationFn: async () => {
      if (!employeeId) {
        throw new Error('Please select an employee');
      }
      return api.post('/admin/payroll/generate', {
        employeeId: Number(employeeId),
        month: selectedMonthNum,
        year: Number(selectedYear),
      });
    },
    onSuccess: (res: any) => {
      const msg = res?.data?.message || `Salary slip generated for ${selectedMonth} ${selectedYear}`;
      toast.success(msg);
      queryClient.invalidateQueries({ queryKey: ['admin-salary-slips'] });
      queryClient.invalidateQueries({ queryKey: ['admin-current-payroll'] });
      router.push('/payroll?tab=slips');
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err));
    },
  });

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId) {
      toast.error('Please select an employee');
      return;
    }
    generateMutation.mutate();
  };

  return (
    <div className="space-y-6 max-w-xl">
      <AdminPageHeader
        title="Generate Individual Payslip"
        description="Create and reconcile a monthly salary slip for an employee."
        icon={Zap}
        breadcrumbs={[
          { label: 'Payroll', href: '/payroll' },
          { label: 'Salary Slips', href: '/payroll?tab=slips' },
          { label: 'Generate Slip' },
        ]}
      />

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-8">
        <form onSubmit={handleGenerate} className="space-y-6 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              Select Employee <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              disabled={isEmployeesLoading}
              className="w-full p-3 border border-slate-200 rounded-xl font-bold bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">-- Choose Employee --</option>
              {employeesList.map((emp: any) => (
                <option key={emp.id} value={emp.id}>
                  {emp.user?.name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || `Employee #${emp.id}`} ({emp.employeeCode || emp.id})
                </option>
              ))}
            </select>
          </div>

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
            <p className="font-bold text-emerald-900">Period: {selectedMonth} {selectedYear}</p>
            <p className="text-emerald-700 mt-0.5">
              Calculates actual calendar working days, present attendance, approved leaves, and generates official payslip.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
            <Link href="/payroll?tab=slips" className="px-5 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={generateMutation.isPending || isEmployeesLoading}
              className="px-5 py-2.5 bg-[#23C45E] hover:bg-[#1AA14D] text-slate-950 font-black rounded-xl shadow-md flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {generateMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Generate Payslip
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
