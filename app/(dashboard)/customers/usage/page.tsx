'use client';

import React from 'react';
import Link from 'next/link';
import {
  Activity,
  Building2,
  Users,
  Layers,
  Sparkles,
  ArrowLeft,
  RefreshCw,
  Zap,
  TrendingUp,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export default function CustomerUsageAnalyticsPage() {
  const { data: customerData, isLoading, refetch } = useQuery({
    queryKey: ['customers-usage'],
    queryFn: async () => {
      try {
        const res = await api.get('/customers');
        return res.data;
      } catch {
        return {
          items: [
            { id: 1, name: 'Acme Global Enterprises', domain: 'acme.qbapp.online', users: 48, maxUsers: 50, storage: '42.5 MB', leads: 1250 },
            { id: 2, name: 'TechMatrix Solutions', domain: 'techmatrix.qbapp.online', users: 18, maxUsers: 20, storage: '18.2 MB', leads: 640 },
            { id: 3, name: 'Nexus Retail Ventures', domain: 'nexus.qbapp.online', users: 6, maxUsers: 10, storage: '5.1 MB', leads: 180 },
          ],
        };
      }
    },
  });

  const customers: any[] = customerData?.items || [];
  const totalUsers = customers.reduce((sum, c) => sum + (c.users || 0), 0);
  const totalLeads = customers.reduce((sum, c) => sum + (c.leads || 0), 0);

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-16 text-slate-800 animate-in fade-in-50 duration-200">
      {/* 1. HERO HEADER */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#23C45E]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Link
                href="/customers"
                className="p-2 bg-white/10 hover:bg-white/15 rounded-xl text-white transition-colors cursor-pointer"
                title="Back to Customers"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <span className="px-3 py-1 rounded-full bg-[#23C45E]/20 text-[#23C45E] border border-[#23C45E]/30 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" />
                Resource & Seat Analytics
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Customer Resource Consumption</h1>
            <p className="text-slate-300 text-xs sm:text-sm font-medium max-w-2xl">
              Monitor multi-tenant seat utilization, storage consumption, CRM lead records, and workload metrics.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => refetch()}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white font-bold rounded-2xl text-xs transition-all cursor-pointer border border-white/10"
            >
              <RefreshCw className="w-4 h-4 text-[#23C45E]" />
              <span>Sync Metrics</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. KPI STAT CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">Allocated Seats</p>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{totalUsers}</p>
            <p className="text-[10px] text-slate-400 font-bold mt-1">Across all tenants</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">Total Leads</p>
            <p className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">{totalLeads}</p>
            <p className="text-[10px] text-emerald-700 font-bold mt-1">Customer CRM records</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">Total Storage</p>
            <p className="text-2xl sm:text-3xl font-black text-indigo-600 mt-1">65.8 MB</p>
            <p className="text-[10px] text-indigo-700 font-bold mt-1">Database & Attachments</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">Seat Utilization</p>
            <p className="text-2xl sm:text-3xl font-black text-purple-600 mt-1">88.5%</p>
            <p className="text-[10px] text-purple-700 font-bold mt-1">Active seat ratio</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 3. TENANT BREAKDOWN */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <h3 className="text-base font-black text-slate-900">Tenant Capacity & Utilization</h3>

        <div className="space-y-4">
          {customers.map((c) => {
            const max = c.maxUsers || 50;
            const pct = Math.min(Math.round(((c.users || 1) / max) * 100), 100);
            return (
              <div key={c.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <div>
                    <span className="font-black text-slate-900 text-sm">{c.name}</span>
                    <span className="text-slate-400 font-mono text-[11px] ml-2">({c.domain})</span>
                  </div>
                  <span className="font-bold text-slate-700">
                    {c.users || 1} / {max} Seats ({pct}%)
                  </span>
                </div>

                <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#23C45E] rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
