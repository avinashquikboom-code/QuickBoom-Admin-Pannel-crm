'use client';

import * as React from 'react';
import {
  CheckSquare,
  ArrowUpRight,
  Clock,
  AlertTriangle,
  CheckCircle2,
  PlayCircle,
  ListTodo,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { AnimatedCounter } from './AnimatedCounter';

export function TasksOverviewCard({ tasks, loading }) {
  const pending = Number(tasks?.pending ?? 0);
  const inProgress = Number(tasks?.inProgress ?? 0);
  const completed = Number(tasks?.completed ?? 0);
  const overdue = Number(tasks?.overdue ?? 0);
  const total = Number(tasks?.total ?? (pending + inProgress + completed));

  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  if (loading) {
    return (
      <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs h-[370px]">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <Skeleton className="h-5 w-32 rounded-md" />
          <Skeleton className="h-4 w-16 rounded-md" />
        </div>
        <Skeleton className="h-14 w-full rounded-xl my-4" />
        <div className="grid grid-cols-2 gap-2.5">
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs hover:border-emerald-950/20 transition-all duration-300 h-full">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 h-11">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-purple-50 text-purple-700">
              <CheckSquare className="size-4" />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Tasks Overview
              </h2>
              <p className="text-xs text-slate-500">Operational workflow execution</p>
            </div>
          </div>
          <Link
            href="/admin/crm/tasks"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#163A2E] hover:underline"
          >
            View All <ArrowUpRight className="size-3.5" />
          </Link>
        </div>

        {/* Completion Rate Banner (Matches Attendance & Payroll) */}
        <div className="mt-4 rounded-xl border border-purple-100/80 bg-gradient-to-r from-purple-50/50 via-slate-50 to-purple-50/30 p-3 sm:p-3.5 min-h-[92px] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-purple-900">
                Completion Rate
              </p>
              <p className="mt-0.5 text-2xl font-extrabold text-purple-950">
                <AnimatedCounter value={completionRate} suffix="%" />
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-slate-700">
                <AnimatedCounter value={completed} /> / {total} Completed
              </span>
              <p className="mt-1 text-[11px] text-slate-400">Target progress</p>
            </div>
          </div>

          {/* Segmented Animated Progress Bar */}
          <div className="mt-2.5 flex h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full bg-[#163A2E] transition-all duration-700 ease-out"
              style={{ width: `${total > 0 ? (completed / total) * 100 : 0}%` }}
              title="Completed"
            />
            <div
              className="h-full bg-blue-500 transition-all duration-700 ease-out"
              style={{ width: `${total > 0 ? (inProgress / total) * 100 : 0}%` }}
              title="In Progress"
            />
            <div
              className="h-full bg-amber-400 transition-all duration-700 ease-out"
              style={{ width: `${total > 0 ? (pending / total) * 100 : 0}%` }}
              title="Pending"
            />
            <div
              className="h-full bg-rose-500 transition-all duration-700 ease-out"
              style={{ width: `${total > 0 ? (overdue / total) * 100 : 0}%` }}
              title="Overdue"
            />
          </div>
        </div>

        {/* 4 Task Stat Counters (Matches Attendance & Payroll) */}
        <div className="mt-3 grid grid-cols-2 gap-2.5 sm:gap-3">
          <div className="rounded-xl border border-amber-100/60 bg-amber-50/30 p-2.5 sm:p-3 h-[74px] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-amber-800">Pending</span>
              <Clock className="size-3.5 text-amber-600" />
            </div>
            <p className="mt-1 text-base sm:text-lg font-bold text-amber-950">
              <AnimatedCounter value={pending} />
            </p>
          </div>

          <div className="rounded-xl border border-blue-100/60 bg-blue-50/30 p-2.5 sm:p-3 h-[74px] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-blue-800">In Progress</span>
              <PlayCircle className="size-3.5 text-blue-600" />
            </div>
            <p className="mt-1 text-base sm:text-lg font-bold text-blue-950">
              <AnimatedCounter value={inProgress} />
            </p>
          </div>

          <div className="rounded-xl border border-emerald-100/60 bg-emerald-50/30 p-2.5 sm:p-3 h-[74px] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-emerald-800">Completed</span>
              <CheckCircle2 className="size-3.5 text-emerald-600" />
            </div>
            <p className="mt-1 text-base sm:text-lg font-bold text-emerald-950">
              <AnimatedCounter value={completed} />
            </p>
          </div>

          <div className="rounded-xl border border-rose-100/60 bg-rose-50/30 p-2.5 sm:p-3 h-[74px] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-rose-800">Overdue</span>
              <AlertTriangle className="size-3.5 text-rose-600" />
            </div>
            <p className="mt-1 text-base sm:text-lg font-bold text-rose-950">
              <AnimatedCounter value={overdue} />
            </p>
          </div>
        </div>
      </div>

      {/* Footer Info (Matches Attendance & Payroll) */}
      <div className="mt-3 border-t border-slate-100 pt-2.5 flex items-center justify-between text-[11px] text-slate-500 h-7">
        <span className="flex items-center gap-1 font-medium text-slate-600">
          <ListTodo className="size-3 text-purple-600" />
          {total} total assigned tasks
        </span>
        {overdue > 0 ? (
          <span className="font-semibold text-rose-600">{overdue} action required</span>
        ) : (
          <span className="text-emerald-700 font-medium">All deadlines on schedule</span>
        )}
      </div>
    </div>
  );
}
