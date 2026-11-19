'use client';

import * as React from 'react';
import {
  Clock,
  UserCheck,
  UserX,
  AlertCircle,
  CalendarOff,
  ArrowUpRight,
  Radio,
  MapPin,
  Laptop,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { AnimatedCounter } from './AnimatedCounter';

export function AttendanceCard({ summary, liveAttendance, loading }) {
  const att = summary?.attendance || {};
  const live = liveAttendance?.summary || liveAttendance?.data?.summary || liveAttendance || {};

  const present = Number(live.present ?? att.present ?? 0);
  const absent = Number(live.absent ?? att.absent ?? 0);
  const onLeave = Number(live.onLeave ?? att.onLeave ?? 0);
  const late = Number(live.late ?? att.late ?? 0);
  const working = Number(live.working ?? present);
  const remote = Number(live.remote ?? 0);

  const total = present + absent + onLeave;
  const attendanceRate =
    total > 0
      ? Math.round((present / total) * 100)
      : att.presentRate
      ? Math.round(Number(String(att.presentRate).replace('%', '')))
      : 0;

  if (loading) {
    return (
      <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs h-[360px]">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <Skeleton className="h-5 w-36 rounded-md" />
          <Skeleton className="h-4 w-16 rounded-md" />
        </div>
        <Skeleton className="h-14 w-full rounded-xl my-4" />
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
        </div>
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
              <Clock className="size-4" />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Attendance Overview
              </h2>
              <p className="text-xs text-slate-500">Live workforce shift status</p>
            </div>
          </div>
          <Link
            href="/admin/hrm/attendance"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#163A2E] hover:underline"
          >
            Live Logs <ArrowUpRight className="size-3.5" />
          </Link>
        </div>

        {/* Big Percentage Bar Banner */}
        <div className="mt-4 rounded-xl border border-emerald-100/80 bg-gradient-to-r from-emerald-50/50 via-teal-50/30 to-emerald-50/20 p-3 sm:p-3.5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800">
                Attendance Rate
              </p>
              <p className="mt-0.5 text-2xl font-extrabold text-[#163A2E]">
                <AnimatedCounter value={attendanceRate} suffix="%" />
              </p>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-900">
                <span className="size-1.5 rounded-full bg-emerald-600 animate-pulse" /> Live Today
              </span>
              <p className="mt-1 text-[11px] text-slate-500">
                {present} of {total > 0 ? total : present + absent} staff present
              </p>
            </div>
          </div>

          <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-emerald-200/60">
            <div
              className="h-full rounded-full bg-[#163A2E] transition-all duration-700 ease-out"
              style={{ width: `${Math.min(100, Math.max(0, attendanceRate))}%` }}
            />
          </div>
        </div>

        {/* 4 Attendance Stat Blocks */}
        <div className="mt-3 grid grid-cols-2 gap-2.5 sm:gap-3">
          <div className="rounded-xl border border-emerald-100/60 bg-emerald-50/30 p-2.5 sm:p-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-emerald-800">Present</span>
              <UserCheck className="size-3.5 text-emerald-600" />
            </div>
            <p className="mt-1 text-lg sm:text-xl font-bold text-emerald-950">
              <AnimatedCounter value={present} />
            </p>
          </div>

          <div className="rounded-xl border border-amber-100/60 bg-amber-50/30 p-2.5 sm:p-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-amber-800">On Leave</span>
              <CalendarOff className="size-3.5 text-amber-600" />
            </div>
            <p className="mt-1 text-lg sm:text-xl font-bold text-amber-950">
              <AnimatedCounter value={onLeave} />
            </p>
          </div>

          <div className="rounded-xl border border-rose-100/60 bg-rose-50/30 p-2.5 sm:p-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-rose-800">Absent</span>
              <UserX className="size-3.5 text-rose-600" />
            </div>
            <p className="mt-1 text-lg sm:text-xl font-bold text-rose-950">
              <AnimatedCounter value={absent} />
            </p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-2.5 sm:p-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-600">Late Punch-ins</span>
              <AlertCircle className="size-3.5 text-slate-400" />
            </div>
            <p className="mt-1 text-lg sm:text-xl font-bold text-slate-900">
              <AnimatedCounter value={late} />
            </p>
          </div>
        </div>
      </div>

      {/* Live Active Workforce Footnote */}
      <div className="mt-3 border-t border-slate-100 pt-2.5 flex items-center justify-between text-[11px] text-slate-500">
        <span className="flex items-center gap-1 font-medium text-[#163A2E]">
          <Radio className="size-3 text-emerald-600 animate-pulse" />
          {working} currently clocked in
        </span>
        {remote > 0 && (
          <span className="flex items-center gap-1 text-slate-400">
            <Laptop className="size-3" />
            {remote} remote
          </span>
        )}
      </div>
    </div>
  );
}
