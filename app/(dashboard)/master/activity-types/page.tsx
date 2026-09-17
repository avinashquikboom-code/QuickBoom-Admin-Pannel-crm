'use client';

import React from 'react';
import { Activity, RefreshCw } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { AdminPageHero } from '@/components/admin';

export default function MasterActivityTypesPage() {
  const { data: resData, isLoading, refetch } = useQuery({
    queryKey: ['master-activity-types'],
    queryFn: async () => {
      const res: any = await api.get('/master/activity-types');
      return res?.data || res || [];
    },
  });

  const activityTypes: any[] = Array.isArray(resData) ? resData : [];

  return (
    <div className="space-y-6">
      <AdminPageHero
        title="Activity Types Master"
        description="Reference types for calendar schedules, client review touchpoints, and CRM activity timelines."
        badge={{ text: 'Calendar & CRM', icon: Activity, variant: 'emerald' }}
      />

      <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">
            Application Activity Catalog
          </span>
          <span className="text-xs text-slate-500 font-medium">
            Standard event categories supported by the mobile calendar and agency dashboard.
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {activityTypes.map((act) => (
          <div
            key={act.code}
            className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span
                  className="w-3.5 h-3.5 rounded-full"
                  style={{ backgroundColor: act.color }}
                />
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                  {act.target}
                </span>
              </div>
              <h3 className="text-sm font-black text-slate-900">{act.name}</h3>
              <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                {act.description}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-slate-400">
                {act.code}
              </span>
              <span
                className="text-[10px] font-extrabold px-2 py-0.5 rounded-md text-white"
                style={{ backgroundColor: act.color }}
              >
                Supported
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
