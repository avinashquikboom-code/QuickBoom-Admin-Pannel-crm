'use client';

import * as React from 'react';
import { Wallet, Banknote, ArrowUpRight, Receipt, MinusCircle, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export function PayrollSummaryCard({ summary, loading }) {
  const payroll = summary?.payroll || {};

  const grossSalary = Number(payroll.grossSalary ?? 0);
  const totalDeductions = Number(payroll.totalDeductions ?? 0);
  const netDisbursed = Number(payroll.netDisbursed ?? (grossSalary - totalDeductions));
  const slipsGenerated = Number(payroll.slipsGenerated ?? 0);

  if (loading) {
    return (
      <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs h-[320px]">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32 rounded-md" />
          <Skeleton className="h-4 w-16 rounded-md" />
        </div>
        <Skeleton className="h-16 w-full rounded-xl my-4" />
        <div className="space-y-2">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs hover:border-slate-300 transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
            <Wallet className="size-4" />
          </span>
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Payroll Summary
            </h2>
            <p className="text-xs text-slate-500">Current period payroll metrics</p>
          </div>
        </div>
        <Link
          href="/admin/hrm/payroll"
          className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:text-brand-dark transition-colors"
        >
          Manage
          <ArrowUpRight className="size-3.5" />
        </Link>
      </div>

      {/* Main Net Disbursed Highlight */}
      <div className="my-3.5 rounded-xl bg-gradient-to-r from-slate-900 to-[#163A2E] p-4 text-white shadow-xs">
        <div className="flex items-center justify-between text-slate-300 text-xs">
          <span className="font-semibold uppercase tracking-wider">Net Payable</span>
          <span className="flex items-center gap-1 rounded-md bg-white/10 px-2 py-0.5 text-[11px] font-medium text-emerald-300">
            <Receipt className="size-3" />
            {slipsGenerated} Slips
          </span>
        </div>
        <p className="mt-1.5 text-2xl font-extrabold tracking-tight text-white">
          ₹{netDisbursed.toLocaleString('en-IN')}
        </p>
      </div>

      {/* Detailed Gross & Deductions Rows */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-2.5">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Banknote className="size-3.5 text-slate-400" />
            Gross Salary
          </div>
          <p className="mt-1 text-sm font-bold text-slate-800">
            ₹{grossSalary.toLocaleString('en-IN')}
          </p>
        </div>

        <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-2.5">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <MinusCircle className="size-3.5 text-rose-400" />
            Total Deductions
          </div>
          <p className="mt-1 text-sm font-bold text-rose-600">
            - ₹{totalDeductions.toLocaleString('en-IN')}
          </p>
        </div>
      </div>
    </div>
  );
}
