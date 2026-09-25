'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Banknote, Download, CheckCircle2 } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin';

export default function PayrollBatchDetailPage() {
  const params = useParams();
  const id = params?.id || 'batch-2026-08';

  return (
    <div className="space-y-6 max-w-4xl">
      <AdminPageHeader
        title={`Payroll Batch Audit (#${id})`}
        description="Detailed bank disbursement statement & tax deductions."
        icon={Banknote}
        breadcrumbs={[
          { label: 'Payroll', href: '/payroll' },
          { label: `Batch #${id}` },
        ]}
      />

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-8 space-y-6 text-xs">
        <div className="flex justify-between items-center pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">August 2026 Pay Run Summary</h2>
            <p className="text-slate-500 font-medium">Direct Deposit to HDFC Bank Accounts</p>
          </div>
          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 font-bold rounded-full border border-emerald-200">
            LOCKED & AUDITED
          </span>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-slate-50 rounded-2xl">
            <span className="text-slate-400 font-bold">Total Gross Earnings</span>
            <p className="text-lg font-black text-slate-900 mt-1">₹1,75,00,000</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl">
            <span className="text-slate-400 font-bold">Total Deductions</span>
            <p className="text-lg font-black text-rose-600 mt-1">₹22,50,000</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl">
            <span className="text-slate-400 font-bold">Net Salary Paid</span>
            <p className="text-lg font-black text-emerald-600 mt-1">₹1,52,50,000</p>
          </div>
        </div>
      </div>
    </div>
  );
}
