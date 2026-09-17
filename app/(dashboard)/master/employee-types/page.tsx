'use client';

import React from 'react';
import { Users, CheckCircle, Briefcase, RefreshCw } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { AdminPageHero } from '@/components/admin';

export default function MasterEmployeeTypesPage() {
  const { data: resData, isLoading, refetch } = useQuery({
    queryKey: ['master-employee-types'],
    queryFn: async () => {
      const res: any = await api.get('/master/employee-types');
      return res?.data || res || [];
    },
  });

  const types: any[] = Array.isArray(resData) ? resData : [];

  return (
    <div className="space-y-6">
      <AdminPageHero
        title="Employee Types Master"
        description="Core workforce classifications defining employment relationship, payroll processing, and contract scope."
        badge={{ text: 'HRM Master', icon: Users, variant: 'indigo' }}
      />

      <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">
            System Workforce Types
          </span>
          <span className="text-xs text-slate-500 font-medium">
            Active classifications utilized during employee creation and contract management.
          </span>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="p-2 text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {types.map((t) => (
          <div
            key={t.id}
            className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-black tracking-wider uppercase border border-emerald-100">
                    {t.code}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                    <CheckCircle className="w-3.5 h-3.5" /> System Master
                  </span>
                </div>
              </div>

              <h3 className="text-lg font-black text-slate-900 mt-3">{t.name}</h3>
              <p className="text-xs text-slate-500 font-medium mt-1.5 leading-relaxed">
                {t.description}
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Enrolled Workforce</span>
                <span className="text-xl font-black text-slate-900">{t.employeeCount} Personnel</span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500">
                <Briefcase className="w-4 h-4" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
