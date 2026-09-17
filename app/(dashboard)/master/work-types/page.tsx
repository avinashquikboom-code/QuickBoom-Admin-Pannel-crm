'use client';

import React, { useState } from 'react';
import { Briefcase, Search, CheckCircle, RefreshCw, Layers } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { AdminPageHero } from '@/components/admin';

export default function MasterWorkTypesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const { data: resData, isLoading, refetch } = useQuery({
    queryKey: ['master-work-types'],
    queryFn: async () => {
      const res: any = await api.get('/master/work-types');
      return res?.data || res || [];
    },
  });

  const workTypes: any[] = Array.isArray(resData) ? resData : [];

  const filtered = workTypes.filter((wt) => {
    const matchesSearch =
      wt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      wt.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = categoryFilter === 'ALL' || wt.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6">
      <AdminPageHero
        title="Work Types Master"
        description="Deliverable and task categories utilized across Employee My Work, creative production, and client delivery."
        badge={{ text: 'Creative & Operations', icon: Briefcase, variant: 'indigo' }}
      />

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search work types..."
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
          >
            <option value="ALL">All Categories</option>
            <option value="Production">Production</option>
            <option value="Design">Design</option>
            <option value="Marketing">Marketing</option>
            <option value="Management">Management</option>
          </select>

          <button
            type="button"
            onClick={() => refetch()}
            className="p-2 text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((wt) => (
          <div
            key={wt.code}
            className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-wider border border-blue-100">
                  {wt.category}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                  <CheckCircle className="w-3 h-3" /> Active
                </span>
              </div>
              <h3 className="text-sm font-black text-slate-900 mt-2">{wt.name}</h3>
              <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                {wt.description}
              </p>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Active Works</span>
                <span className="text-base font-black text-slate-900">{wt.itemCount} Items</span>
              </div>
              <span className="text-[10px] font-mono font-bold text-slate-400 px-2 py-0.5 bg-slate-100 rounded-md">
                {wt.code}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
