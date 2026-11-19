'use client';

import * as React from 'react';
import { Activity, ArrowUpRight, User, Clock, ShieldCheck, Tag } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export function RecentActivityCard({ activity = [], loading }) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs h-[360px] flex flex-col justify-between">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <Skeleton className="h-5 w-32 rounded-md" />
          <Skeleton className="h-4 w-16 rounded-md" />
        </div>
        <div className="space-y-3 my-auto">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="size-8 rounded-full" />
              <div className="space-y-1 flex-1">
                <Skeleton className="h-4 w-3/4 rounded-md" />
                <Skeleton className="h-3 w-1/2 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const getActionBadgeColor = (action = '') => {
    const act = action.toUpperCase();
    if (act.includes('CREATE') || act.includes('ADD') || act.includes('REGISTER'))
      return 'bg-emerald-50 text-emerald-700 border-emerald-200/60';
    if (act.includes('DELETE') || act.includes('REMOVE') || act.includes('CANCEL'))
      return 'bg-rose-50 text-rose-700 border-rose-200/60';
    if (act.includes('UPDATE') || act.includes('EDIT') || act.includes('MODIFY'))
      return 'bg-blue-50 text-blue-700 border-blue-200/60';
    if (act.includes('LOGIN') || act.includes('AUTH'))
      return 'bg-purple-50 text-purple-700 border-purple-200/60';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs hover:border-slate-300 transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
            <Activity className="size-4" />
          </span>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              Recent Activity
            </h2>
            <p className="text-xs text-slate-500">Live system audit logs & security</p>
          </div>
        </div>
        <Link
          href="/admin/settings/activity-logs"
          className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:text-brand-dark transition-colors"
        >
          All Logs
          <ArrowUpRight className="size-3.5" />
        </Link>
      </div>

      {/* Activity Timeline */}
      <div className="my-3 space-y-3 overflow-hidden">
        {activity.length === 0 ? (
          <p className="py-8 text-center text-xs text-slate-400">
            No recent activity recorded yet.
          </p>
        ) : (
          activity.slice(0, 5).map((log, idx) => {
            const actor =
              log.userName ||
              (log.user ? `${log.user.firstName || ''} ${log.user.lastName || ''}`.trim() : '') ||
              'System Administrator';
            const action = log.action || 'Activity';
            const moduleName = log.module || 'Platform';
            const timeStr = log.createdAt
              ? new Date(log.createdAt).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true,
                })
              : 'Just now';

            return (
              <div
                key={log.id || idx}
                className="flex items-start gap-3 rounded-xl p-2 hover:bg-slate-50/80 transition-colors"
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 mt-0.5">
                  <User className="size-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-xs font-semibold text-slate-800">
                      {actor}
                    </p>
                    <span className="shrink-0 text-[11px] text-slate-400">
                      {timeStr}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                    {log.description || `Performed ${action} in ${moduleName}`}
                  </p>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <span
                      className={cn(
                        'rounded-md border px-1.5 py-0.5 text-[9px] font-bold tracking-wider uppercase',
                        getActionBadgeColor(action)
                      )}
                    >
                      {action}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {moduleName}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer info */}
      <div className="border-t border-slate-100 pt-3 text-xs text-slate-400 flex items-center justify-between">
        <span className="flex items-center gap-1">
          <ShieldCheck className="size-3.5 text-emerald-600" />
          Tamper-evident audit trail active
        </span>
        <span className="font-semibold text-slate-600">
          {activity.length} Logged Events
        </span>
      </div>
    </div>
  );
}
