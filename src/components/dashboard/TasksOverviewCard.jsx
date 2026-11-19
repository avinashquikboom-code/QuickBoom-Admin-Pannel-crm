'use client';

import * as React from 'react';
import { CheckSquare, ArrowUpRight, Clock, AlertTriangle, CheckCircle2, PlayCircle } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export function TasksOverviewCard({ tasks, loading }) {
  const pending = Number(tasks?.pending ?? 0);
  const inProgress = Number(tasks?.inProgress ?? 0);
  const completed = Number(tasks?.completed ?? 0);
  const overdue = Number(tasks?.overdue ?? 0);
  const total = Number(tasks?.total ?? (pending + inProgress + completed));

  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  if (loading) {
    return (
      <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs h-[320px]">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32 rounded-md" />
          <Skeleton className="h-4 w-16 rounded-md" />
        </div>
        <Skeleton className="h-14 w-full rounded-xl my-4" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs hover:border-slate-300 transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-purple-50 text-purple-700">
            <CheckSquare className="size-4" />
          </span>
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Tasks Overview
            </h2>
            <p className="text-xs text-slate-500">Task workflow progress</p>
          </div>
        </div>
        <Link
          href="/admin/crm/tasks"
          className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:text-brand-dark transition-colors"
        >
          View All
          <ArrowUpRight className="size-3.5" />
        </Link>
      </div>

      {/* Progress banner */}
      <div className="my-3.5 rounded-xl bg-gradient-to-r from-purple-50/60 to-indigo-50/40 p-3.5 border border-purple-100/80">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-purple-800">
            Completion Rate
          </span>
          <span className="text-xl font-extrabold text-purple-700">
            {completionRate}%
          </span>
        </div>
        <div className="mt-2 h-2 w-full rounded-full bg-purple-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-purple-600 transition-all duration-500"
            style={{ width: `${Math.min(100, completionRate)}%` }}
          />
        </div>
      </div>

      {/* Breakdown Rows */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs py-1 border-b border-slate-100">
          <span className="flex items-center gap-1.5 text-slate-600 font-medium">
            <Clock className="size-3.5 text-amber-500" />
            Pending Tasks
          </span>
          <span className="font-bold text-slate-900">{pending}</span>
        </div>

        <div className="flex items-center justify-between text-xs py-1 border-b border-slate-100">
          <span className="flex items-center gap-1.5 text-slate-600 font-medium">
            <PlayCircle className="size-3.5 text-blue-500" />
            In Progress
          </span>
          <span className="font-bold text-slate-900">{inProgress}</span>
        </div>

        <div className="flex items-center justify-between text-xs py-1 border-b border-slate-100">
          <span className="flex items-center gap-1.5 text-slate-600 font-medium">
            <CheckCircle2 className="size-3.5 text-emerald-500" />
            Completed
          </span>
          <span className="font-bold text-emerald-700">{completed}</span>
        </div>

        <div className="flex items-center justify-between text-xs py-1">
          <span className="flex items-center gap-1.5 text-slate-600 font-medium">
            <AlertTriangle className="size-3.5 text-rose-500" />
            Overdue
          </span>
          <span className="font-bold text-rose-600">{overdue}</span>
        </div>
      </div>
    </div>
  );
}
