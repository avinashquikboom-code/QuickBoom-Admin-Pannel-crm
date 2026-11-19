'use client';

import * as React from 'react';
import Link from 'next/link';
import { Database, ArrowUpRight, CheckCircle2, Clock, XCircle, MapPin, Globe, Sparkles } from 'lucide-react';
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

  const successRate = captured > 0 ? Math.round((processed / captured) * 100) : 0;
  const sources = sessionsMeta.sources?.length ? sessionsMeta.sources : ['Google Maps', 'Google Places API'];

  if (loading) {
    return (
      <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs h-[360px]">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <Skeleton className="h-5 w-36 rounded-md" />
          <Skeleton className="h-4 w-16 rounded-md" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs hover:border-emerald-950/20 transition-all duration-300">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
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

        {/* 4 Metric Tiles */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
            <p className="text-[11px] font-medium text-slate-500">Total Captured</p>
            <p className="mt-1 text-lg sm:text-xl font-extrabold text-slate-900">
              <AnimatedCounter value={captured} />
            </p>
            <span className="mt-1 inline-flex text-[10px] text-slate-400">All discovery runs</span>
          </div>

          <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3">
            <p className="text-[11px] font-medium text-emerald-800 flex items-center gap-1">
              <CheckCircle2 className="size-3 text-emerald-600" /> Processed
            </p>
            <p className="mt-1 text-lg sm:text-xl font-extrabold text-emerald-900">
              <AnimatedCounter value={processed} />
            </p>
            <span className="mt-1 inline-flex text-[10px] text-emerald-700/80">Imported to leads</span>
          </div>

          <div className="rounded-xl border border-amber-100 bg-amber-50/40 p-3">
            <p className="text-[11px] font-medium text-amber-800 flex items-center gap-1">
              <Clock className="size-3 text-amber-600" /> Pending
            </p>
            <p className="mt-1 text-lg sm:text-xl font-extrabold text-amber-900">
              <AnimatedCounter value={pending} />
            </p>
            <span className="mt-1 inline-flex text-[10px] text-amber-700/80">Awaiting validation</span>
          </div>

          <div className="rounded-xl border border-rose-100 bg-rose-50/40 p-3">
            <p className="text-[11px] font-medium text-rose-800 flex items-center gap-1">
              <XCircle className="size-3 text-rose-600" /> Rejected
            </p>
            <p className="mt-1 text-lg sm:text-xl font-extrabold text-rose-900">
              <AnimatedCounter value={rejected} />
            </p>
            <span className="mt-1 inline-flex text-[10px] text-rose-700/80">Filtered out</span>
          </div>
        </div>

        {/* Processing Success Rate Progress Bar */}
        <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/50 p-3">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-700 flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-emerald-600" />
              Processing Success Rate
            </span>
            <span className="text-[#163A2E] font-extrabold">{successRate}%</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-[#163A2E] transition-all duration-700 ease-out"
              style={{ width: `${Math.min(100, Math.max(0, successRate))}%` }}
            />
          </div>
          <p className="mt-1 text-[10px] text-slate-500">
            {processed} of {captured} records verified and converted into active CRM leads.
          </p>
        </div>
      </div>

      {/* Sources & Extraction Activity Footer */}
      <div className="mt-4 border-t border-slate-100 pt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-medium text-slate-400">Sources:</span>
          {sources.map((s) => (
            <span
              key={s}
              className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700"
            >
              <MapPin className="size-2.5 text-emerald-600" />
              {String(s).replace(/_/g, ' ')}
            </span>
          ))}
        </div>
        {usage.totalExtractions != null && (
          <span className="text-[11px] font-medium text-slate-500">
            {usage.totalExtractions} extraction jobs completed
          </span>
        )}
      </div>
    </div>
  );
}
