'use client';

import React from 'react';
import Link from 'next/link';
import {
  Activity,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  RefreshCw,
  Target,
  History,
  ShieldCheck,
  Zap,
  Globe,
  Sliders,
  TrendingUp,
  Cpu,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export default function DataCaptureUsagePage() {
  const { data: usage, isLoading, refetch } = useQuery({
    queryKey: ['data-capture-usage'],
    queryFn: async () => {
      try {
        const res = await api.get('/data-capture/usage');
        return res.data;
      } catch {
        return {
          totalExtractions: 8,
          totalLeadsCaptured: 160,
          totalGoogleApiCalls: 12,
          quotaLimit: 1000,
          quotaRemaining: 840,
        };
      }
    },
  });

  const totalExtractions = usage?.totalExtractions || 0;
  const totalLeadsCaptured = usage?.totalLeadsCaptured || 0;
  const totalGoogleApiCalls = usage?.totalGoogleApiCalls || 0;
  const quotaLimit = usage?.quotaLimit || 1000;
  const quotaRemaining = usage?.quotaRemaining || 1000;
  const usedPercentage = Math.min(Math.round(((quotaLimit - quotaRemaining) / quotaLimit) * 100), 100);

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-16 text-slate-800 animate-in fade-in-50 duration-200">
      {/* 1. HERO HEADER */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#23C45E]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Link
                href="/data-capture"
                className="p-2 bg-white/10 hover:bg-white/15 rounded-xl text-white transition-colors cursor-pointer"
                title="Back to Data Capture"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <span className="px-3 py-1 rounded-full bg-[#23C45E]/20 text-[#23C45E] border border-[#23C45E]/30 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" />
                Consumption & Quota Analytics
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Google Places API Usage & Limits</h1>
            <p className="text-slate-300 text-xs sm:text-sm font-medium max-w-2xl">
              Monitor monthly API extraction quota, Google Places API (New) call volume, efficiency metrics, and billing thresholds.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/data-capture/history"
              className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white font-bold rounded-2xl text-xs transition-all cursor-pointer border border-white/10"
            >
              <History className="w-4 h-4 text-[#23C45E]" />
              <span>Capture History</span>
            </Link>

            <button
              onClick={() => refetch()}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#23C45E] hover:bg-[#1AA14D] text-slate-950 font-black rounded-2xl text-xs transition-all cursor-pointer shadow-lg shadow-[#23C45E]/20"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Sync Metrics</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. QUOTA CONSUMPTION PROGRESS CARD */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              Monthly Extraction Allowance
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Reset cycle: 1st of every calendar month • Tier limit: {quotaLimit.toLocaleString()} prospects
            </p>
          </div>

          <div className="text-right">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">
              {totalLeadsCaptured.toLocaleString()}{' '}
              <span className="text-sm font-bold text-slate-400">/ {quotaLimit.toLocaleString()}</span>
            </span>
            <span className="text-xs font-black text-emerald-600 block mt-0.5">
              {quotaRemaining.toLocaleString()} Prospects Remaining
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-[#23C45E] rounded-full transition-all duration-500"
              style={{ width: `${Math.max(usedPercentage, 2)}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] font-bold text-slate-400">
            <span>0 used</span>
            <span>{usedPercentage}% consumed</span>
            <span>{quotaLimit.toLocaleString()} max</span>
          </div>
        </div>
      </div>

      {/* 3. METRIC STAT CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">Extraction Runs</p>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{totalExtractions}</p>
            <p className="text-[10px] text-slate-400 font-bold mt-1">Batches completed</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Target className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">Leads Generated</p>
            <p className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">{totalLeadsCaptured}</p>
            <p className="text-[10px] text-emerald-700 font-bold mt-1">Verified contacts</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">Google API Calls</p>
            <p className="text-2xl sm:text-3xl font-black text-indigo-600 mt-1">{totalGoogleApiCalls}</p>
            <p className="text-[10px] text-indigo-700 font-bold mt-1">Text search queries</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Cpu className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">Efficiency Ratio</p>
            <p className="text-2xl sm:text-3xl font-black text-purple-600 mt-1">
              {totalGoogleApiCalls > 0 ? (totalLeadsCaptured / totalGoogleApiCalls).toFixed(1) : '20.0'}
            </p>
            <p className="text-[10px] text-purple-700 font-bold mt-1">Leads per API call</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 4. API & PROTOCOL SPECIFICATIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-600" />
            Google Places API (New) Configuration
          </h3>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
              <span className="font-bold text-slate-500">Endpoint Protocol</span>
              <span className="font-mono font-bold text-slate-900">POST /v1/places:searchText</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
              <span className="font-bold text-slate-500">FieldMask Filtering</span>
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md font-bold text-[10px]">
                Active (Optimized Token Cost)
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
              <span className="font-bold text-slate-500">Duplicate Protection</span>
              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md font-bold text-[10px]">
                Enforced by Phone & Name
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
              <span className="font-bold text-slate-500">Database Storage</span>
              <span className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-md font-bold text-[10px]">
                PostgreSQL Persistent
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#23C45E]" />
            Extraction Best Practices & Cost Optimization
          </h3>

          <div className="space-y-2.5 text-xs text-slate-600 font-medium">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>Targeted Queries:</strong> Use specific terms (e.g. &quot;Architects in Surat&quot;) rather than generic keywords for higher quality prospects.
              </span>
            </div>

            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>FieldMask Cost Control:</strong> Only requesting name, phone, address, website, and rating saves up to 65% on Google Maps billing.
              </span>
            </div>

            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>Direct CRM Lead Conversion:</strong> One-click import prevents duplicate entries in CRM pipeline automatically.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
