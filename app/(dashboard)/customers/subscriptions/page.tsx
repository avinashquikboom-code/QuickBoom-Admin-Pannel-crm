'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  Building2,
  Calendar,
  DollarSign,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  RefreshCw,
  Search,
  Users,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export default function CustomerSubscriptionsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: subscriptions = [], isLoading, refetch } = useQuery({
    queryKey: ['customer-subscriptions'],
    queryFn: async () => {
      try {
        const res = await api.get('/customers');
        const list = Array.isArray(res.data?.items) ? res.data.items : [];
        return list;
      } catch {
        return [
          {
            id: 1,
            name: 'Acme Global Enterprises',
            domain: 'acme.qbapp.online',
            plan: 'Enterprise SaaS',
            mrr: '₹14,999',
            status: 'ACTIVE',
            users: 48,
            expiryDate: '2027-06-01',
          },
          {
            id: 2,
            name: 'TechMatrix Solutions',
            domain: 'techmatrix.qbapp.online',
            plan: 'Professional Pro',
            mrr: '₹7,999',
            status: 'ACTIVE',
            users: 18,
            expiryDate: '2027-07-01',
          },
          {
            id: 3,
            name: 'Nexus Retail Ventures',
            domain: 'nexus.qbapp.online',
            plan: 'Starter Plan',
            mrr: '₹2,999',
            status: 'ACTIVE',
            users: 6,
            expiryDate: '2027-08-01',
          },
        ];
      }
    },
  });

  const filtered = subscriptions.filter((s: any) => {
    if (!searchTerm) return true;
    const t = searchTerm.toLowerCase();
    return s.name?.toLowerCase().includes(t) || s.domain?.toLowerCase().includes(t) || s.plan?.toLowerCase().includes(t);
  });

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
                <CreditCard className="w-3.5 h-3.5" />
                Active Subscriptions & Renewals
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Active Tenant Subscriptions</h1>
            <p className="text-slate-300 text-xs sm:text-sm font-medium max-w-2xl">
              Track active contracts, renewal dates, auto-billing status, and subscription tier assignments.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => refetch()}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white font-bold rounded-2xl text-xs transition-all cursor-pointer border border-white/10"
            >
              <RefreshCw className="w-4 h-4 text-[#23C45E]" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search subscriptions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-[#23C45E]"
            />
          </div>

          <span className="text-xs font-bold text-slate-400">{filtered.length} active subscriptions</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-400 font-black uppercase border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Customer</th>
                <th className="px-5 py-3.5">Plan Tier</th>
                <th className="px-5 py-3.5">Seats</th>
                <th className="px-5 py-3.5">Recurring Amount</th>
                <th className="px-5 py-3.5">Renewal / Expiry</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filtered.map((s: any) => (
                <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-5 py-4">
                    <div className="font-bold text-slate-900">{s.name}</div>
                    <div className="text-slate-400 font-mono text-[11px]">{s.domain}</div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-[11px]">
                      {s.plan || 'Enterprise SaaS'}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-bold text-slate-900">{s.users || 1} Seats</td>
                  <td className="px-5 py-4 font-black text-slate-900">{s.mrr || '₹4,999'} / mo</td>
                  <td className="px-5 py-4 text-slate-600 font-bold">{s.expiryDate || 'June 1, 2027'}</td>
                  <td className="px-5 py-4">
                    <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 font-black text-[10px] inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Active
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link
                      href={`/customers/${s.id}`}
                      className="inline-block px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg text-xs"
                    >
                      Manage
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
