'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Layers,
  Plus,
  ShieldCheck,
  CheckCircle2,
  Users,
  DollarSign,
  Zap,
  Sparkles,
  ArrowLeft,
  RefreshCw,
  Building2,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export default function CustomerPlansPage() {
  const { data: plans = [], isLoading, refetch } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      try {
        const res = await api.get('/plans');
        return Array.isArray(res.data) ? res.data : [];
      } catch {
        return [
          {
            id: 1,
            name: 'Starter Plan',
            monthlyPrice: 2999,
            yearlyPrice: 29990,
            userLimit: 5,
            leadLimit: 1000,
            description: 'Essential CRM & HRM tools for boutique agencies and startups.',
            features: ['Customer Management', 'Calendar', 'Tasks', 'HRM Attendance', 'Reports'],
            activeCustomers: 4,
          },
          {
            id: 2,
            name: 'Professional Pro',
            monthlyPrice: 7999,
            yearlyPrice: 79990,
            userLimit: 20,
            leadLimit: 5000,
            description: 'Full-featured suite with automated payroll, visits, and Google Places data capture.',
            features: [
              'Customer Management',
              'Calendar',
              'Works',
              'Tasks',
              'Reports',
              'HRM Attendance',
              'Payroll Automation',
              'Data Capture',
            ],
            activeCustomers: 12,
            isPopular: true,
          },
          {
            id: 3,
            name: 'Enterprise SaaS',
            monthlyPrice: 14999,
            yearlyPrice: 149990,
            userLimit: 50,
            leadLimit: 25000,
            description: 'Unlimited scalability with custom subdomain, dedicated storage, and 24/7 SLA.',
            features: [
              'Customer Management',
              'Calendar',
              'Works',
              'Tasks',
              'Reports',
              'HRM Attendance',
              'Payroll Automation',
              'Data Capture',
              'Geo Tracking',
              'WhatsApp Integration',
              'Custom Domain',
            ],
            activeCustomers: 8,
          },
        ];
      }
    },
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
                <Layers className="w-3.5 h-3.5" />
                Subscription Tiers
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">SaaS Subscription Plans</h1>
            <p className="text-slate-300 text-xs sm:text-sm font-medium max-w-2xl">
              Configure product tiers, seat quotas, monthly and yearly pricing, and module entitlements.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/customers"
              className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white font-bold rounded-2xl text-xs transition-all cursor-pointer border border-white/10"
            >
              <Building2 className="w-4 h-4 text-[#23C45E]" />
              <span>Customer Accounts</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. PLANS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan: any) => (
          <div
            key={plan.id}
            className={`bg-white rounded-3xl p-6 sm:p-8 border shadow-xs flex flex-col justify-between relative transition-all ${
              plan.isPopular ? 'border-emerald-400 ring-2 ring-emerald-400/20' : 'border-slate-200/80'
            }`}
          >
            {plan.isPopular && (
              <span className="absolute -top-3 right-6 px-3 py-1 rounded-full bg-[#23C45E] text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-sm">
                Most Popular
              </span>
            )}

            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-black text-slate-900">{plan.name}</h3>
                <p className="text-xs text-slate-500 font-medium mt-1">{plan.description}</p>
              </div>

              <div>
                <span className="text-3xl font-black text-slate-900">
                  ₹{Number(plan.monthlyPrice).toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-slate-400 font-bold"> / month</span>
                <p className="text-[11px] text-emerald-600 font-bold mt-0.5">
                  ₹{Number(plan.yearlyPrice).toLocaleString('en-IN')} billed annually
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1 text-xs font-bold text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-400">User Seats:</span>
                  <span>Up to {plan.userLimit} Users</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">CRM Leads:</span>
                  <span>Up to {Number(plan.leadLimit).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Subscribed Tenants:</span>
                  <span className="text-emerald-600 font-black">{plan.activeCustomers || 0} active</span>
                </div>
              </div>

              {/* Features List */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <p className="text-xs font-black uppercase text-slate-400">Included Modules</p>
                {(plan.features || []).map((f: string) => (
                  <div key={f} className="flex items-center gap-2 text-xs font-medium text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-100">
              <Link
                href="/customers"
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs flex items-center justify-center transition-colors cursor-pointer"
              >
                Assign to Customer
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
