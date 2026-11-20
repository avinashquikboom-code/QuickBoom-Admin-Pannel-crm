'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Cake, Sparkles, ArrowUpRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

function getInitials(name = '') {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase() || 'EM';
}

export function HrmBirthdaysCard({ birthdays = [], loading = false }) {
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs h-[360px]">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Skeleton className="size-8 rounded-xl" />
            <Skeleton className="h-5 w-32 rounded-md" />
          </div>
          <Skeleton className="h-4 w-16 rounded-md" />
        </div>
        <div className="space-y-3 my-auto">
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs hover:border-emerald-950/20 transition-all duration-300 h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <Cake className="size-4" />
          </span>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-bold text-slate-900">Today&apos;s Birthdays</h3>
              {birthdays.length > 0 && (
                <span className="rounded-full bg-amber-100 px-1.5 py-0.2 text-[10px] font-bold text-amber-800">
                  {birthdays.length}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">Celebrations today</p>
          </div>
        </div>

        <Link
          href="/admin/hrm/employees"
          className="group inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 hover:text-[#163A2E] transition-colors"
        >
          View All
          <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </div>

      {/* Content */}
      <div className="my-auto py-2">
        {birthdays.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-amber-50/70 text-amber-500 mb-2">
              <Cake className="size-6 stroke-[1.75]" />
            </div>
            <p className="text-xs font-semibold text-slate-700">No birthdays today</p>
            <p className="text-[11px] text-slate-400 max-w-[200px] mt-0.5">
              No employee birthdays celebrated on this selected date.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
            {birthdays.map((emp) => (
              <div
                key={emp.id}
                onClick={() => router.push(`/admin/hrm/employees?search=${encodeURIComponent(emp.name)}`)}
                className="group flex items-center justify-between rounded-xl border border-amber-100/80 bg-amber-50/40 p-2.5 transition-all hover:bg-amber-50 hover:border-amber-200 cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {emp.avatar ? (
                    <img
                      src={emp.avatar}
                      alt={emp.name}
                      className="size-9 shrink-0 rounded-full object-cover ring-2 ring-amber-200"
                    />
                  ) : (
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-200/80 text-xs font-bold text-amber-900">
                      {getInitials(emp.name)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-slate-900 group-hover:text-amber-900">
                      {emp.name}
                    </p>
                    <p className="truncate text-[11px] text-slate-500">
                      {emp.designation} &bull; {emp.department}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0 rounded-lg bg-white px-2 py-1 shadow-2xs border border-amber-100">
                  <Sparkles className="size-3 text-amber-500" />
                  <span className="text-[11px] font-bold text-amber-700">Birthday</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
