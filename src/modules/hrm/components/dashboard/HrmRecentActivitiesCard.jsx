'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Activity,
  CalendarCheck,
  UserCheck,
  Receipt,
  IndianRupee,
  ShieldCheck,
  ArrowUpRight,
  UserPlus,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

function formatRelativeTime(isoStr) {
  if (!isoStr) return '';
  const date = new Date(isoStr);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
}

function getActivityIcon(type = '', module = '') {
  const t = String(type).toUpperCase();
  const m = String(module).toUpperCase();

  if (m.includes('LEAVE') || t.includes('LEAVE')) {
    return { icon: CalendarCheck, bg: 'bg-purple-50', text: 'text-purple-600' };
  }
  if (m.includes('ATTENDANCE') || t.includes('ATTENDANCE') || t.includes('PUNCH')) {
    return { icon: UserCheck, bg: 'bg-emerald-50', text: 'text-emerald-700' };
  }
  if (m.includes('CLAIM') || m.includes('EXPENSE') || t.includes('CLAIM')) {
    return { icon: Receipt, bg: 'bg-blue-50', text: 'text-blue-600' };
  }
  if (m.includes('PAYROLL') || t.includes('PAYROLL') || t.includes('SALARY')) {
    return { icon: IndianRupee, bg: 'bg-teal-50', text: 'text-teal-700' };
  }
  if (m.includes('EMPLOYEE') || t.includes('EMPLOYEE') || t.includes('USER')) {
    return { icon: UserPlus, bg: 'bg-emerald-50', text: 'text-[#163A2E]' };
  }
  return { icon: ShieldCheck, bg: 'bg-slate-100', text: 'text-slate-600' };
}

export function HrmRecentActivitiesCard({ activities = [], loading = false }) {
  if (loading) {
    return (
      <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs h-[380px]">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 min-h-[52px]">
          <div className="space-y-1">
            <Skeleton className="h-5 w-40 rounded-md" />
            <Skeleton className="h-3.5 w-48 rounded-md" />
          </div>
          <Skeleton className="h-4 w-20 rounded-md" />
        </div>
        <div className="space-y-4 my-auto">
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs hover:border-emerald-950/20 transition-all duration-300 h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 min-h-[52px]">
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-xl bg-emerald-50 text-[#163A2E]">
            <Activity className="size-4" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recent HR Activities</h3>
            <p className="text-xs text-slate-500">Live operational audit trail</p>
          </div>
        </div>

        <Link
          href="/admin/hrm/attendance"
          className="group inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 hover:text-[#163A2E] transition-colors"
        >
          View All
          <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </div>

      {/* Activities Timeline */}
      <div className="my-auto py-3">
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-2">
              <Activity className="size-6 stroke-[1.75]" />
            </div>
            <p className="text-xs font-semibold text-slate-700">No recent activities logged</p>
            <p className="text-[11px] text-slate-400 max-w-[220px] mt-0.5">
              HR transactions and attendance events will automatically appear here.
            </p>
          </div>
        ) : (
          <div className="relative pl-6 space-y-4 max-h-72 overflow-y-auto pr-2 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
            {activities.slice(0, 8).map((act) => {
              const { icon: Icon, bg, text } = getActivityIcon(act.type, act.module);
              return (
                <div key={act.id} className="relative group">
                  {/* Timeline Icon Pin */}
                  <div
                    className={`absolute -left-6 top-0.5 flex size-5 items-center justify-center rounded-full ${bg} ${text} ring-4 ring-white transition-transform group-hover:scale-110`}
                  >
                    <Icon className="size-3" />
                  </div>

                  {/* Activity Details */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate group-hover:text-emerald-900">
                        {act.title}
                      </p>
                      <p className="text-[11px] text-slate-500 line-clamp-1">
                        {act.description}
                      </p>
                    </div>
                    <span className="shrink-0 text-[10px] font-semibold text-slate-400">
                      {formatRelativeTime(act.timestamp)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
