'use client';

import React from 'react';
import { CreditCard, CheckCircle, RefreshCw, ShieldCheck } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { AdminPageHero } from '@/components/admin';

export default function MasterExpenseCategoriesPage() {
  const { data: resData, isLoading, refetch } = useQuery({
    queryKey: ['master-expense-categories'],
    queryFn: async () => {
      const res: any = await api.get('/master/expense-categories');
      return res?.data || res || {};
    },
  });

  const categories: any[] = Array.isArray(resData?.data) ? resData.data : Array.isArray(resData) ? resData : [];
  const monthlyCeiling = resData?.policyLimit || 100000;

  return (
    <div className="space-y-6">
      <AdminPageHero
        title="Expense Categories Master"
        description="Eligible reimbursement categories configured under HRM claim policies for travel, fuel, and business supplies."
        badge={{ text: 'HRM & Claims', icon: CreditCard, variant: 'indigo' }}
      />

      <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">
            HRM Claim Policy Allocation
          </span>
          <span className="text-xs text-slate-500 font-medium">
            Monthly employee reimbursement threshold: ₹{monthlyCeiling.toLocaleString()}
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {categories.map((cat) => (
          <div
            key={cat.code}
            className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-wider border border-emerald-100">
                  {cat.code}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                  <CheckCircle className="w-3 h-3" /> Allowed
                </span>
              </div>
              <h3 className="text-sm font-black text-slate-900 mt-2.5">{cat.name}</h3>
              <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                {cat.description}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400">Total Claims</span>
              <span className="font-black text-slate-900">{cat.count} Processed</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
