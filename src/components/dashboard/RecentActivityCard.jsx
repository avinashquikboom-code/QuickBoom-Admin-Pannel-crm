'use client';

import * as React from 'react';
import { Activity, ArrowUpRight, User, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export function RecentActivityCard({ activity = [], loading }) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs h-full min-h-[460px] flex flex-col justify-between">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 min-h-[56px]">
          <Skeleton className="h-5 w-32 rounded-md" />
          <Skeleton className="h-4 w-16 rounded-md" />
        </div>
        <div className="space-y-3 my-auto">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="size-8 rounded-full" />
              <div className="space-y-1 flex-1">
                <Skeleton className="h-4 w-3/4 rounded-md" />
                <Skeleton className="h-3 w-1/2 rounded-md" />
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-slate-100 pt-3 h-10 flex items-center justify-between">
          <Skeleton className="h-4 w-40 rounded-md" />
          <Skeleton className="h-4 w-20 rounded-md" />
        </div>
      </div>
    );
  }

  const getActionBadgeColor = (action = '') => {
    const act = action.toUpperCase();
    if (act.includes('CREATE') || act.includes('ADD') || act.includes('REGISTER'))
      return 'bg-emerald-50 text-emerald-800 border-emerald-200/60';
    if (act.includes('DELETE') || act.includes('REMOVE') || act.includes('CANCEL'))
      return 'bg-rose-50 text-rose-800 border-rose-200/60';
    if (act.includes('UPDATE') || act.includes('EDIT') || act.includes('MODIFY'))
      return 'bg-blue-50 text-blue-800 border-blue-200/60';
    if (act.includes('LOGIN') || act.includes('AUTH'))
      return 'bg-purple-50 text-purple-800 border-purple-200/60';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs hover:border-emerald-950/20 transition-all duration-300 h-full">
      {/* Header (min-h-[56px] matching QuickActionsCard) */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 min-h-[56px]">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-50 text-[#163A2E]">
            <Activity className="size-4" />
          </span>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              Recent Activity
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">Live system audit logs & security</p>
          </div>
        </div>
        <Link
          href="/admin/settings/activity-logs"
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#163A2E] hover:underline transition-colors"
        >
          All Logs
          <ArrowUpRight className="size-3.5" />
        </Link>
      </div>

      {/* Activity Timeline (5 entries) */}
      <div className="my-3 flex-1 flex flex-col justify-center space-y-2.5 overflow-hidden">
        {activity.length === 0 ? (
          <p className="py-8 text-center text-xs text-slate-400">
            No recent activity recorded yet.
          </p>
        ) : (
          activity.slice(0, 5).map((log, idx) => {
            const actor =
              log.userName ||
              (log.user ? `${log.user.firstName || ''} ${log.user.lastName || ''}`.trim() : '') ||
              'Super Admin';
            const action = log.action || 'Activity';
            const moduleName = log.module || 'HRM';
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
                  <div className="mt-1 flex items-center gap-1.5">
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

      {/* Footer Info (h-10 matching QuickActionsCard) */}
      <div className="border-t border-slate-100 pt-3 h-10 text-xs text-slate-400 flex items-center justify-between">
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
