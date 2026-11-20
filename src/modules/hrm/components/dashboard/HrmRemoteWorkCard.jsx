'use client';

import * as React from 'react';
import Link from 'next/link';
import { Laptop, Building2, ArrowUpRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

function getInitials(name = '') {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase() || 'EM';
}

export function HrmRemoteWorkCard({
  remoteWorkers = [],
  totalEmployees = 0,
  loading = false,
}) {
  const count = remoteWorkers.length;
  const workforceRate =
    totalEmployees > 0 ? Math.round((count / totalEmployees) * 100) : 0;

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
          <span className="flex size-8 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
            <Laptop className="size-4" />
          </span>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-bold text-slate-900">Remote Work</h3>
              {count > 0 && (
                <span className="rounded-full bg-teal-100 px-1.5 py-0.2 text-[10px] font-bold text-teal-800">
                  {count} ({workforceRate}%)
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">Working offsite today</p>
          </div>
        </div>

        <Link
          href="/admin/hrm/remote-work"
          className="group inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 hover:text-[#163A2E] transition-colors"
        >
          View All
          <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </div>

      {/* Content */}
      <div className="my-auto py-2">
        {count === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-teal-50/70 text-teal-600 mb-2">
              <Building2 className="size-6 stroke-[1.75]" />
            </div>
            <p className="text-xs font-semibold text-slate-700">No remote workers today</p>
            <p className="text-[11px] text-slate-400 max-w-[200px] mt-0.5">
              All active staff working from registered office locations.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
            {remoteWorkers.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-xl border border-teal-100/80 bg-teal-50/30 p-2.5 transition-all hover:bg-teal-50/70 hover:border-teal-200"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {item.avatar ? (
                    <img
                      src={item.avatar}
                      alt={item.name}
                      className="size-9 shrink-0 rounded-full object-cover ring-1 ring-teal-200"
                    />
                  ) : (
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-800">
                      {getInitials(item.name)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-slate-900">{item.name}</p>
                    <p className="truncate text-[11px] text-slate-500">
                      {item.department} &bull; {item.duration}
                    </p>
                  </div>
                </div>

                <span className="shrink-0 rounded-md bg-white border border-teal-200 px-2 py-0.5 text-[10px] font-bold text-teal-700 shadow-2xs">
                  Remote
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
