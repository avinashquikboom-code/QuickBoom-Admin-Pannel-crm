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
  ArrowUpRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function QuickActionsCard() {
  const actions = [
    {
      title: 'Add Employee',
      desc: 'Onboard new workforce member',
      href: '/admin/hrm/employees',
      icon: UserPlus,
      color: 'bg-emerald-50/70 text-emerald-800 border-emerald-200/60 hover:border-emerald-400',
      iconColor: 'bg-[#163A2E] text-white',
    },
    {
      title: 'Add Lead',
      desc: 'Create new CRM prospect',
      href: '/admin/crm/leads',
      icon: UserCheck,
      color: 'bg-blue-50/70 text-blue-800 border-blue-200/60 hover:border-blue-400',
      iconColor: 'bg-blue-700 text-white',
    },
    {
      title: 'Create Task',
      desc: 'Assign actionable work item',
      href: '/admin/crm/tasks',
      icon: ListPlus,
      color: 'bg-purple-50/70 text-purple-800 border-purple-200/60 hover:border-purple-400',
      iconColor: 'bg-purple-700 text-white',
    },
    {
      title: 'Review Leave',
      desc: 'Approve pending leave requests',
      href: '/admin/hrm/leaves',
      icon: CalendarCheck,
      color: 'bg-amber-50/70 text-amber-800 border-amber-200/60 hover:border-amber-400',
      iconColor: 'bg-amber-600 text-white',
    },
    {
      title: 'Salary Slips',
      desc: 'Generate monthly payroll slips',
      href: '/admin/hrm/payroll',
      icon: Receipt,
      color: 'bg-teal-50/70 text-teal-800 border-teal-200/60 hover:border-teal-400',
      iconColor: 'bg-teal-700 text-white',
    },
  ];

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs hover:border-emerald-950/20 transition-all duration-300">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
              <Zap className="size-4" />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Quick Actions
              </h2>
              <p className="text-xs text-slate-500">Instant workflow shortcuts</p>
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
                    <p className="truncate text-xs font-bold text-slate-900 group-hover:text-[#163A2E]">
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
      </div>

      {/* Footer Info */}
      <div className="border-t border-slate-100 pt-3 text-[11px] text-slate-400">
        Direct workflow shortcuts for daily operations.
      </div>
    </div>
  );
}
