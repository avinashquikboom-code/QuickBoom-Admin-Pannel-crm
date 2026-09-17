'use client';

import React from 'react';
import { CheckSquare, RefreshCw, Smartphone, Laptop } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { AdminPageHero } from '@/components/admin';

export default function MasterTaskStatusPage() {
  const { data: resData, isLoading, refetch } = useQuery({
    queryKey: ['master-task-statuses'],
    queryFn: async () => {
      const res: any = await api.get('/master/task-statuses');
      return res?.data || res || [];
    },
  });

  const statuses: any[] = Array.isArray(resData) ? resData : [];

  return (
    <div className="space-y-6">
      <AdminPageHero
        title="Task & Work Status Master"
        description="Lifecycle statuses controlling task progression and live synchronization between Employee and Customer Mobile applications."
        badge={{ text: 'Sync & Lifecycle', icon: CheckSquare, variant: 'indigo' }}
      />

      <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div>
          <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">
            End-to-End Status Synchronization
          </span>
          <span className="text-xs text-slate-500 font-medium">
            Statuses mapped directly to Employee task boards and Customer real-time approval cards.
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statuses.map((st) => (
          <div
            key={st.code}
            className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span
                  className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase text-white tracking-wider"
                  style={{ backgroundColor: st.color }}
                >
                  {st.code}
                </span>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                  {st.type}
                </span>
              </div>
              <h3 className="text-base font-black text-slate-900 mt-2">{st.name}</h3>
              <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                {st.description}
              </p>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Active In System</span>
                <span className="text-base font-black text-slate-900">{st.count} Items</span>
              </div>

              <div className="flex items-center gap-1.5 text-slate-400">
                <span title="Synced to Mobile App"><Smartphone className="w-3.5 h-3.5" /></span>
                <span title="Synced to Admin Panel"><Laptop className="w-3.5 h-3.5" /></span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
