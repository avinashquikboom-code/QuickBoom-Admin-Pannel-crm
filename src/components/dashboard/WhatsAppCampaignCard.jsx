'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  MessageSquare,
  ArrowUpRight,
  Send,
  CheckCheck,
  Eye,
  AlertCircle,
  PlayCircle,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { AnimatedCounter } from './AnimatedCounter';

export function WhatsAppCampaignCard({ stats, loading }) {
  const data = stats?.data || stats || {};

  const totalCampaigns = Number(data.total ?? 0);
  const sent = Number(data.sentCount ?? 0);
  const delivered = Number(data.deliveredCount ?? 0);
  const read = Number(data.readCount ?? 0);
  const failed = Number(data.failedCount ?? 0);

  // Status breakdown
  const running = Number(data.running ?? 0);
  const scheduled = Number(data.scheduled ?? 0);
  const completed = Number(data.completed ?? 0);
  const draft = Number(data.draft ?? 0);

  // Safe rates
  const deliveryRate = sent > 0 ? ((delivered / sent) * 100).toFixed(1) : 0;
  const readRate = delivered > 0 ? ((read / delivered) * 100).toFixed(1) : 0;

  if (loading) {
    return (
      <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs h-[360px]">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <Skeleton className="h-5 w-44 rounded-md" />
          <Skeleton className="h-4 w-16 rounded-md" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>
        <Skeleton className="h-14 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs hover:border-emerald-950/20 transition-all duration-300">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <MessageSquare className="size-4" />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                WhatsApp Marketing
              </h2>
              <p className="text-xs text-slate-500">
                Official Meta Cloud API broadcast performance
              </p>
            </div>
          </div>
          <Link
            href="/admin/crm/whatsapp"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#163A2E] hover:underline"
          >
            Campaigns <ArrowUpRight className="size-3.5" />
          </Link>
        </div>

        {/* 4 Metric Tiles (Sent, Delivered, Read, Failed) */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
            <p className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
              <Send className="size-3 text-slate-400" /> Sent
            </p>
            <p className="mt-1 text-lg sm:text-xl font-extrabold text-slate-900">
              <AnimatedCounter value={sent} />
            </p>
            <span className="mt-1 inline-flex text-[10px] text-slate-400">Total dispatched</span>
          </div>

          <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3">
            <p className="text-[11px] font-medium text-emerald-800 flex items-center gap-1">
              <CheckCheck className="size-3 text-emerald-600" /> Delivered
            </p>
            <p className="mt-1 text-lg sm:text-xl font-extrabold text-emerald-900">
              <AnimatedCounter value={delivered} />
            </p>
            <span className="mt-1 inline-flex text-[10px] text-emerald-700/80">Received on phone</span>
          </div>

          <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-3">
            <p className="text-[11px] font-medium text-blue-800 flex items-center gap-1">
              <Eye className="size-3 text-blue-600" /> Read
            </p>
            <p className="mt-1 text-lg sm:text-xl font-extrabold text-blue-900">
              <AnimatedCounter value={read} />
            </p>
            <span className="mt-1 inline-flex text-[10px] text-blue-700/80">Blue-ticked</span>
          </div>

          <div className="rounded-xl border border-rose-100 bg-rose-50/40 p-3">
            <p className="text-[11px] font-medium text-rose-800 flex items-center gap-1">
              <AlertCircle className="size-3 text-rose-600" /> Failed
            </p>
            <p className="mt-1 text-lg sm:text-xl font-extrabold text-rose-900">
              <AnimatedCounter value={failed} />
            </p>
            <span className="mt-1 inline-flex text-[10px] text-rose-700/80">Undelivered</span>
          </div>
        </div>

        {/* Dual Progress Bars for Delivery Rate & Read Rate */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-700">Delivery Rate</span>
              <span className="text-emerald-700 font-extrabold">{deliveryRate}%</span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-emerald-600 transition-all duration-700 ease-out"
                style={{ width: `${Math.min(100, Math.max(0, Number(deliveryRate)))}%` }}
              />
            </div>
            <p className="mt-1 text-[10px] text-slate-400">Delivered / Sent × 100</p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-700">Read Rate</span>
              <span className="text-blue-700 font-extrabold">{readRate}%</span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-blue-600 transition-all duration-700 ease-out"
                style={{ width: `${Math.min(100, Math.max(0, Number(readRate)))}%` }}
              />
            </div>
            <p className="mt-1 text-[10px] text-slate-400">Read / Delivered × 100</p>
          </div>
        </div>
      </div>

      {/* Campaign Status Footer */}
      <div className="mt-4 border-t border-slate-100 pt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-800">
            <AnimatedCounter value={totalCampaigns} /> Campaigns Total
          </span>
          <span className="text-slate-300">•</span>
          <span className="text-[11px] text-emerald-700">{completed} completed</span>
          {running > 0 && (
            <span className="text-[11px] text-blue-700 font-semibold">{running} running</span>
          )}
        </div>
        <p className="text-[10px] text-slate-400">
          Real Meta webhook receipts
        </p>
      </div>
    </div>
  );
}
