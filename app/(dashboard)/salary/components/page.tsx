'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus } from 'lucide-react';

export default function SalaryComponentsPage() {
  return (
    <div className="space-y-8 max-w-3xl">
      <div className="flex items-center gap-4">
        <Link href="/salary" className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Salary Components</h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">Manage earnings & deduction component rules (Basic, HRA, PF, ESI, TDS).</p>
        </div>
      </div>

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
