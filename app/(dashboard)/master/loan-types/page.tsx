'use client';

import React from 'react';
import { DollarSign, CheckCircle, RefreshCw, ShieldCheck } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { AdminPageHero } from '@/components/admin';

export default function MasterLoanTypesPage() {
  const { data: resData, isLoading, refetch } = useQuery({
    queryKey: ['master-loan-types'],
    queryFn: async () => {
      const res: any = await api.get('/master/loan-types');
      return res?.data || res || {};
    },
  });

  const loanTypes: any[] = Array.isArray(resData?.data) ? resData.data : Array.isArray(resData) ? resData : [];
  const activeLoansCount = resData?.activeLoansCount || 0;

  return (
    <div className="space-y-6">
      <AdminPageHero
        title="Loan Types Master"
        description="Company-sponsored workforce loan programs, maximum repayment tenures, interest percentages, and automated payroll EMI deductions."
        badge={{ text: 'Payroll & Benefits', icon: DollarSign, variant: 'indigo' }}
      />

      <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">
            Workforce Loan Programs
          </span>
          <span className="text-xs text-slate-500 font-medium">
            Active company loan accounts currently under automated EMI deduction: {activeLoansCount}
          </span>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="p-2 text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors self-end sm:self-auto"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loanTypes.map((lt) => (
          <div
            key={lt.code}
            className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 text-xs font-black uppercase tracking-wider border border-amber-100">
                  {lt.code}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                  <CheckCircle className="w-3.5 h-3.5" /> Approved Program
                </span>
              </div>
              <h3 className="text-base font-black text-slate-900 mt-3">{lt.name}</h3>
              <p className="text-xs text-slate-500 font-medium mt-1.5 leading-relaxed">
                {lt.description}
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Max Repayment Tenure</span>
                <span className="text-sm font-black text-slate-900">{lt.maxMonths} Months</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Annual Interest</span>
                <span className="text-sm font-black text-emerald-600">
                  {lt.interestRate === 0 ? '0% (Interest-Free)' : `${lt.interestRate}% p.a.`}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
