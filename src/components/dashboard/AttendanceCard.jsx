'use client';

import * as React from 'react';
import { Clock, UserCheck, UserX, AlertCircle, CalendarOff, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export function AttendanceCard({ summary, liveAttendance, loading }) {
  const att = summary?.attendance || {};
  const live = liveAttendance?.summary || liveAttendance || {};

  const present = Number(live.present ?? att.present ?? 0);
  const absent = Number(live.absent ?? att.absent ?? 0);
  const onLeave = Number(live.onLeave ?? att.onLeave ?? 0);
  const late = Number(live.late ?? att.late ?? 0);

  const total = present + absent + onLeave;
  const attendanceRate =
    total > 0
      ? Math.round((present / total) * 100)
      : att.attendanceRate
      ? Math.round(Number(att.attendanceRate))
      : 100;

  if (loading) {
    return (
      <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs h-[320px]">
        <div className="flex items-center justify-between">
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
    <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs hover:border-slate-300 transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
            <Clock className="size-4" />
          </span>
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Attendance Overview
            </h2>
            <p className="text-xs text-slate-500">Live workforce attendance</p>
          </div>
        </div>
        <Link
          href="/admin/hrm/attendance"
          className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:text-brand-dark transition-colors"
        >
          View Live
          <ArrowUpRight className="size-3.5" />
        </Link>
      </div>

      {/* Progress banner */}
      <div className="my-3.5 rounded-xl bg-gradient-to-r from-emerald-50/60 to-teal-50/40 p-3.5 border border-emerald-100/80">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
            Attendance Rate
          </span>
          <span className="text-xl font-extrabold text-emerald-700">
            {attendanceRate}%
          </span>
        </div>
        <div className="mt-2 h-2 w-full rounded-full bg-emerald-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-emerald-600 transition-all duration-500"
            style={{ width: `${Math.min(100, attendanceRate)}%` }}
          />
        </div>
      </div>

      {/* Metric Breakdown Grid */}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50/70 p-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100/70 text-emerald-700">
            <UserCheck className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-slate-500">Present</p>
            <p className="text-base font-bold text-slate-900">{present}</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50/70 p-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-rose-100/70 text-rose-700">
            <UserX className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-slate-500">Absent</p>
            <p className="text-base font-bold text-slate-900">{absent}</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50/70 p-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-100/70 text-blue-700">
            <CalendarOff className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-slate-500">On Leave</p>
            <p className="text-base font-bold text-slate-900">{onLeave}</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50/70 p-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-100/70 text-amber-700">
            <AlertCircle className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-slate-500">Late Mark</p>
            <p className="text-base font-bold text-slate-900">{late}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
