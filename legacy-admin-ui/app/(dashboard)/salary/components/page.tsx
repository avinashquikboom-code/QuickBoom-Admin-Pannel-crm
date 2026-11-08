'use client';

import React from 'react';
import Link from 'next/link';
import { Banknote } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin';

export default function SalaryComponentsPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <AdminPageHeader
        title="Salary Components"
        description="Manage earnings & deduction component rules (Basic, HRA, PF, ESI, TDS)."
        icon={Banknote}
        breadcrumbs={[
          { label: 'Payroll', href: '/payroll' },
          { label: 'Salary Components' },
        ]}
      />

      <div className="grid grid-cols-2 gap-4 text-xs">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <span className="font-extrabold text-emerald-600 uppercase text-[10px]">Earning Component</span>
          <h3 className="font-bold text-slate-900 text-sm">Basic Salary (BASIC)</h3>
          <p className="text-slate-500">Core fixed earning component (50% of CTC)</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <span className="font-extrabold text-rose-600 uppercase text-[10px]">Deduction Component</span>
          <h3 className="font-bold text-slate-900 text-sm">Provident Fund (PF)</h3>
          <p className="text-slate-500">Statutory employee provident fund deduction (12% of basic)</p>
        </div>
      </div>
    </div>
  );
}
