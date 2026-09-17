'use client';

import React, { useState } from 'react';
import { Target, Search, CheckCircle, RefreshCw, Globe, Users, PhoneCall, Megaphone } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { AdminPageHero } from '@/components/admin';

export default function MasterLeadSourcesPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: resData, isLoading, refetch } = useQuery({
    queryKey: ['master-lead-sources'],
    queryFn: async () => {
      const res: any = await api.get('/master/lead-sources');
      return res?.data || res || [];
    },
  });

  const sources: any[] = Array.isArray(resData) ? resData : [];

  const filtered = sources.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSourceIcon = (code: string) => {
    switch (code) {
      case 'WEBSITE': return Globe;
      case 'REFERRAL': return Users;
      case 'COLD_CALL': return PhoneCall;
      case 'CAMPAIGN': return Megaphone;
      default: return Target;
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHero
        title="Lead Sources Master"
        description="Customer acquisition channels tracking origin, ROI attribution, and sales funnel entry points."
        badge={{ text: 'CRM Acquisition', icon: Target, variant: 'indigo' }}
      />

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search lead sources..."
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
          />
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((s) => {
          const Icon = getSourceIcon(s.code);
          return (
            <div
              key={s.code}
              className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                    <CheckCircle className="w-3 h-3" /> Active Channel
                  </span>
                </div>
                <h3 className="text-sm font-black text-slate-900 mt-3">{s.name}</h3>
                <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                  {s.description}
                </p>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Attributed Leads</span>
                  <span className="text-base font-black text-slate-900">{s.count} Leads</span>
                </div>
                <span className="text-[10px] font-mono font-bold text-slate-400 px-2 py-0.5 bg-slate-100 rounded-md">
                  {s.code}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
