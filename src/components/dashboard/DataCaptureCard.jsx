'use client';

import * as React from 'react';
import Link from 'next/link';
import { Database, ArrowUpRight, CheckCircle2, Clock, XCircle, MapPin, Sparkles, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { AnimatedCounter } from './AnimatedCounter';

export function DataCaptureCard({ data, loading }) {
  const usage = data?.usage || {};
  const sessionsSummary = data?.sessionsSummary || {};
  const sessionsMeta = data?.sessionsMeta || {};

  const captured = Number(usage.totalLeadsCaptured ?? sessionsSummary.captured ?? 0);
  const processed = Number(usage.validatedCount ?? sessionsSummary.imported ?? 0);
  const pending = Number(data?.pending ?? sessionsSummary.pending ?? 0);
  const rejected = Number(data?.rejected ?? sessionsSummary.failed ?? 0);
  const quotaLimit = Number(usage.quotaLimit || 1000);

  const successRate = captured > 0 ? Math.round((processed / captured) * 100) : 0;
  const quotaUsageRate = quotaLimit > 0 ? Math.min(100, Math.round((captured / quotaLimit) * 100)) : 0;
  const sources = sessionsMeta.sources?.length ? sessionsMeta.sources : ['Google Maps', 'Google Places'];

  if (loading) {
    return (
      <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs h-[370px]">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <Skeleton className="h-5 w-36 rounded-md" />
          <Skeleton className="h-4 w-16 rounded-md" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-4">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs hover:border-emerald-950/20 transition-all duration-300 h-full">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 h-11">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-50 text-[#163A2E]">
              <Database className="size-4" />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Data Capture Overview
              </h2>
              <p className="text-xs text-slate-500">Automated lead discovery & extraction</p>
            </div>
          </div>
          <Link
            href="/admin/data-capture"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#163A2E] hover:underline"
          >
            View all <ArrowUpRight className="size-3.5" />
          </Link>
        </div>

        {/* 4 Metric Tiles (1x4 grid on desktop) */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 sm:p-3 h-[76px] flex flex-col justify-between">
            <p className="text-[11px] font-medium text-slate-500 flex items-center gap-1 min-w-0">
              <Database className="size-3 text-slate-400 shrink-0" />
              <span className="truncate" title="Total Captured">Captured</span>
            </p>
            <p className="mt-0.5 text-lg sm:text-xl font-extrabold text-slate-900 leading-tight">
              <AnimatedCounter value={captured} />
            </p>
            <span className="text-[10px] text-slate-400 truncate">All discovery runs</span>
          </div>

          <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-2.5 sm:p-3 h-[76px] flex flex-col justify-between">
            <p className="text-[11px] font-medium text-emerald-800 flex items-center gap-1 min-w-0">
              <CheckCircle2 className="size-3 text-emerald-600 shrink-0" />
              <span className="truncate">Processed</span>
            </p>
            <p className="mt-0.5 text-lg sm:text-xl font-extrabold text-emerald-900 leading-tight">
              <AnimatedCounter value={processed} />
            </p>
            <span className="text-[10px] text-emerald-700/80 truncate">Imported to leads</span>
          </div>

          <div className="rounded-xl border border-amber-100 bg-amber-50/40 p-2.5 sm:p-3 h-[76px] flex flex-col justify-between">
            <p className="text-[11px] font-medium text-amber-800 flex items-center gap-1 min-w-0">
              <Clock className="size-3 text-amber-600 shrink-0" />
              <span className="truncate">Pending</span>
            </p>
            <p className="mt-0.5 text-lg sm:text-xl font-extrabold text-amber-900 leading-tight">
              <AnimatedCounter value={pending} />
            </p>
            <span className="text-[10px] text-amber-700/80 truncate">Awaiting validation</span>
          </div>

          <div className="rounded-xl border border-rose-100 bg-rose-50/40 p-2.5 sm:p-3 h-[76px] flex flex-col justify-between">
            <p className="text-[11px] font-medium text-rose-800 flex items-center gap-1 min-w-0">
              <XCircle className="size-3 text-rose-600 shrink-0" />
              <span className="truncate">Rejected</span>
            </p>
            <p className="mt-0.5 text-lg sm:text-xl font-extrabold text-rose-900 leading-tight">
              <AnimatedCounter value={rejected} />
            </p>
            <span className="text-[10px] text-rose-700/80 truncate">Filtered out</span>
          </div>
        </div>

        {/* Dual Progress / Rate Section (Matches WhatsApp & Email) */}
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 min-h-[78px]">
          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-2.5 sm:p-3 h-full flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-700">Processing Success</span>
              <span className="text-emerald-700 font-extrabold">{successRate}%</span>
            </div>
            <div className="my-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-[#163A2E] transition-all duration-700 ease-out"
                style={{ width: `${Math.min(100, Math.max(0, successRate))}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-400 truncate">Imported / Captured records</p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-2.5 sm:p-3 h-full flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-700">Quota Utilization</span>
              <span className="text-blue-700 font-extrabold">{quotaUsageRate}%</span>
            </div>
            <div className="my-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-blue-600 transition-all duration-700 ease-out"
                style={{ width: `${Math.min(100, Math.max(0, quotaUsageRate))}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-400 truncate">{captured} of {quotaLimit} limit</p>
          </div>
        </div>
      </div>

      {/* Footer Info (Matches WhatsApp & Email) */}
      <div className="mt-3 border-t border-slate-100 pt-2.5 flex items-center justify-between text-[11px] text-slate-500 h-7">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[11px] font-medium text-slate-400">Sources:</span>
          <span className="truncate font-medium text-slate-600">
            {sources.map((s) => String(s).replace(/_/g, ' ')).join(', ')}
          </span>
        </div>
        {usage.totalExtractions != null && (
          <span className="shrink-0 text-[11px] text-slate-400">
            {usage.totalExtractions} jobs
          </span>
        )}
      </div>
    </div>
  );
}
