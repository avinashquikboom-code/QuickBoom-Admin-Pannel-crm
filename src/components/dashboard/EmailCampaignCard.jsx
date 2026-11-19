'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Mail,
  ArrowUpRight,
  Send,
  CheckCircle2,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { AnimatedCounter } from './AnimatedCounter';

export function EmailCampaignCard({ stats, loading }) {
  const data = stats?.data || stats || {};

  const totalCampaigns = Number(data.totalTemplates ?? data.total ?? 0);
  const activeTemplates = Number(data.activeTemplates ?? 0);
  const sent = Number(data.totalSent ?? 0);
  const delivered = Number(data.totalDelivered ?? sent);
  const failed = Number(data.totalFailed ?? 0);

  // Delivery Rate calculation
  const deliveryRate = sent > 0 ? ((delivered / sent) * 100).toFixed(1) : 0;
  const hasOpenTracking = Boolean(data.trackingSupported?.opened);

  if (loading) {
    return (
      <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs h-[370px]">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <Skeleton className="h-5 w-44 rounded-md" />
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
            <span className="flex size-7 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
              <Mail className="size-4" />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Email Marketing
              </h2>
              <p className="text-xs text-slate-500">SMTP broadcast & notification logs</p>
            </div>
          </div>
          <Link
            href="/admin/content/email-templates"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#163A2E] hover:underline"
          >
            Templates <ArrowUpRight className="size-3.5" />
          </Link>
        </div>

        {/* 4 Metric Tiles (1x4 grid on desktop) */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 sm:p-3 h-[76px] flex flex-col justify-between">
            <p className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
              <Send className="size-3 text-slate-400" /> Sent
            </p>
            <p className="mt-0.5 text-lg sm:text-xl font-extrabold text-slate-900">
              <AnimatedCounter value={sent} />
            </p>
            <span className="text-[10px] text-slate-400 truncate">SMTP dispatched</span>
          </div>

          <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-2.5 sm:p-3 h-[76px] flex flex-col justify-between">
            <p className="text-[11px] font-medium text-emerald-800 flex items-center gap-1">
              <CheckCircle2 className="size-3 text-emerald-600" /> Delivered
            </p>
            <p className="mt-0.5 text-lg sm:text-xl font-extrabold text-emerald-900">
              <AnimatedCounter value={delivered} />
            </p>
            <span className="text-[10px] text-emerald-700/80 truncate">Accepted by relay</span>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/40 p-2.5 sm:p-3 h-[76px] flex flex-col justify-between">
            <p className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
              <Eye className="size-3 text-slate-400" /> Opened
            </p>
            <p className="mt-0.5 text-lg sm:text-xl font-extrabold text-slate-900">
              {hasOpenTracking ? <AnimatedCounter value={data.totalOpened ?? 0} /> : '—'}
            </p>
            <span className="text-[10px] text-slate-400 truncate">Pixel needed</span>
          </div>

          <div className="rounded-xl border border-rose-100 bg-rose-50/40 p-2.5 sm:p-3 h-[76px] flex flex-col justify-between">
            <p className="text-[11px] font-medium text-rose-800 flex items-center gap-1">
              <AlertCircle className="size-3 text-rose-600" /> Failed
            </p>
            <p className="mt-0.5 text-lg sm:text-xl font-extrabold text-rose-900">
              <AnimatedCounter value={failed} />
            </p>
            <span className="text-[10px] text-rose-700/80 truncate">SMTP rejected</span>
          </div>
        </div>

        {/* Dual Progress / Rate Section (Matches Data Capture & WhatsApp) */}
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 min-h-[78px]">
          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-2.5 sm:p-3 h-full flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-700">Delivery Rate</span>
              <span className="text-emerald-700 font-extrabold">{deliveryRate}%</span>
            </div>
            <div className="my-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-[#163A2E] transition-all duration-700 ease-out"
                style={{ width: `${Math.min(100, Math.max(0, Number(deliveryRate)))}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-400 truncate">Delivered / Sent × 100</p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-2.5 sm:p-3 h-full flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-700">Open & Click Tracking</span>
              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-600">
                Gap Identified
              </span>
            </div>
            <div className="my-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-slate-400"
                style={{ width: '0%' }}
              />
            </div>
            <p className="text-[10px] text-slate-400 truncate">Pixel tracking webhook required</p>
          </div>
        </div>
      </div>

      {/* Footer Info (Matches Data Capture & WhatsApp) */}
      <div className="mt-3 border-t border-slate-100 pt-2.5 flex items-center justify-between text-[11px] text-slate-500 h-7">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-semibold text-slate-800 shrink-0">
            <AnimatedCounter value={totalCampaigns} /> Email Templates
          </span>
          {activeTemplates > 0 && (
            <>
              <span className="text-slate-300">•</span>
              <span className="text-[11px] text-emerald-700 truncate">{activeTemplates} active</span>
            </>
          )}
        </div>
        <p className="shrink-0 text-[10px] text-slate-400">Verified database records</p>
      </div>
    </div>
  );
}
