'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Zap,
  UserPlus,
  UserCheck,
  ListPlus,
  CalendarCheck,
  Receipt,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function QuickActionsCard() {
  const actions = [
    {
      title: 'Add Employee',
      desc: 'Onboard workforce member',
      href: '/admin/hrm/employees',
      icon: UserPlus,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200/50',
      iconColor: 'bg-emerald-100 text-emerald-800',
    },
    {
      title: 'Add Lead',
      desc: 'Create new CRM prospect',
      href: '/admin/crm/leads',
      icon: UserCheck,
      color: 'bg-blue-50 text-blue-700 border-blue-200/50',
      iconColor: 'bg-blue-100 text-blue-800',
    },
    {
      title: 'Create Task',
      desc: 'Assign actionable work item',
      href: '/admin/crm/tasks',
      icon: ListPlus,
      color: 'bg-purple-50 text-purple-700 border-purple-200/50',
      iconColor: 'bg-purple-100 text-purple-800',
    },
    {
      title: 'Review Leave',
      desc: 'Approve pending leave requests',
      href: '/admin/hrm/leaves',
      icon: CalendarCheck,
      color: 'bg-amber-50 text-amber-700 border-amber-200/50',
      iconColor: 'bg-amber-100 text-amber-800',
    },
    {
      title: 'Salary Slips',
      desc: 'Generate monthly payroll slips',
      href: '/admin/hrm/salary-slips',
      icon: Receipt,
      color: 'bg-teal-50 text-teal-700 border-teal-200/50',
      iconColor: 'bg-teal-100 text-teal-800',
    },
  ];

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs hover:border-slate-300 transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
            <Zap className="size-4" />
          </span>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              Quick Actions
            </h2>
            <p className="text-xs text-slate-500">Fast platform shortcuts</p>
          </div>
        </div>
      </div>

      {/* Action Buttons List */}
      <div className="my-3 space-y-2.5">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <Link
              key={act.title}
              href={act.href}
              className={cn(
                'group flex items-center justify-between rounded-xl border p-2.5 sm:p-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs active:scale-[0.98]',
                act.color
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={cn(
                    'flex size-8 shrink-0 items-center justify-center rounded-lg shadow-2xs transition-transform group-hover:scale-105',
                    act.iconColor
                  )}
                >
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-slate-900 group-hover:text-brand-dark">
                    {act.title}
                  </p>
                  <p className="truncate text-[11px] text-slate-500">
                    {act.desc}
                  </p>
                </div>
              </div>
              <ChevronRight className="size-4 text-slate-400 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-700" />
            </Link>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="border-t border-slate-100 pt-3 text-[11px] text-slate-400">
        Direct workflow shortcuts for daily operations.
      </div>
    </div>
  );
}
