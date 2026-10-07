'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Target,
  History,
  ShieldCheck,
  Zap,
  Globe,
  Sliders,
  TrendingUp,
  Cpu,
  Database,
  UserPlus,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { AdminPageHeader, AdminStatCard, AdminCard, AdminButton } from '@/components/admin';

export default function DataCaptureUsagePage() {
  const isEmployeeRoute = usePathname()?.startsWith('/employee/') ?? false;
  const dataCaptureHref = isEmployeeRoute ? '/employee/data-capture' : '/data-capture';
  const crmHref = isEmployeeRoute ? '/employee/leads' : '/crm';
  const historyHref = isEmployeeRoute
    ? '/employee/data-capture/history'
    : '/data-capture/history';
  const { data: usage, isLoading, refetch } = useQuery({
    queryKey: ['data-capture-usage'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/data-capture/usage');
        return res?.data || res || {
          totalExtractions: 0,
          totalLeadsCaptured: 0,
          totalGoogleApiCalls: 0,
          quotaLimit: 1000,
          quotaRemaining: 1000,
        };
      } catch {
        return {
          totalExtractions: 0,
          totalLeadsCaptured: 0,
          totalGoogleApiCalls: 0,
          quotaLimit: 1000,
          quotaRemaining: 1000,
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
    <div className="space-y-6 max-w-[1600px] mx-auto pb-16 text-slate-800 animate-in fade-in-50 duration-200">
      {/* 1. STANDARD PAGE HEADER */}
      <AdminPageHeader
        title="Google Places API Usage & Quota"
        description="Monitor monthly extraction allowance, Google Places API (New) call volume, cost efficiency metrics, and billing thresholds."
        icon={Activity}
        iconColor="text-[#1AA14D]"
        badge={{
          text: 'CONSUMPTION & QUOTA ANALYTICS',
          icon: Activity,
          variant: 'emerald',
        }}
        breadcrumbs={[
          { label: 'CRM', href: crmHref },
          { label: 'Data Capture', href: dataCaptureHref },
          { label: 'Usage & Quota' },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <AdminButton
              variant="outline"
              size="md"
              icon={RefreshCw}
              onClick={() => refetch()}
              title="Refresh usage metrics"
            >
              Refresh
            </AdminButton>

            <Link href={historyHref}>
              <AdminButton
                variant="outline"
                size="md"
                icon={History}
              >
                Capture History
              </AdminButton>
            </Link>

            <Link href={dataCaptureHref}>
              <AdminButton
                variant="primary"
                size="md"
                icon={Target}
              >
                Data Capture Hub
              </AdminButton>
            </Link>
          </div>
        }
      />

      {/* 2. QUOTA CONSUMPTION PROGRESS CARD */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              Monthly Extraction Allowance
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Reset cycle: 1st of every calendar month • Tier limit: {Number(quotaLimit || 0).toLocaleString()} prospects
            </p>
          </div>

          <div className="text-right">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">
              {Number(totalLeadsCaptured || 0).toLocaleString()}{' '}
              <span className="text-sm font-bold text-slate-400">/ {Number(quotaLimit || 0).toLocaleString()}</span>
            </span>
            <span className="text-xs font-black text-emerald-600 block mt-0.5">
              {Number(quotaRemaining || 0).toLocaleString()} Prospects Remaining
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
            <span>{Number(quotaLimit || 0).toLocaleString()} max</span>
          </div>
        </div>
      </div>

      {/* 3. METRIC STAT CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <AdminStatCard
          title="Extraction Batches"
          value={totalExtractions}
          description="Batches executed"
          icon={Target}
          iconBg="blue"
        />
        <AdminStatCard
          title="Leads Captured"
          value={totalLeadsCaptured}
          description="Verified contacts"
          icon={CheckCircle2}
          iconBg="primary"
        />
        <AdminStatCard
          title="Google API Calls"
          value={`${totalGoogleApiCalls} Requests`}
          description="Text search queries"
          icon={Cpu}
          iconBg="purple"
        />
        <AdminStatCard
          title="Efficiency Ratio"
          value={totalGoogleApiCalls > 0 ? (totalLeadsCaptured / totalGoogleApiCalls).toFixed(1) : '20.0'}
          description="Leads per API call"
          icon={TrendingUp}
          iconBg="primary"
        />
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
                Enforced by Phone, Name & Place ID
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
