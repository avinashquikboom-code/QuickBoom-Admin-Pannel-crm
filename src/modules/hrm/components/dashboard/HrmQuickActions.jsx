'use client';

import * as React from 'react';
import Link from 'next/link';
import { UserPlus, Clock, CalendarPlus, IndianRupee, ArrowRight } from 'lucide-react';
import { sessionCanAction, sessionCan } from '@/modules/hrm/hrm-api';

export function HrmQuickActions() {
  const canAddEmployee = sessionCanAction('EMPLOYEES', 'CREATE') || sessionCan('EMPLOYEES');
  const canMarkAttendance = sessionCanAction('ATTENDANCE', 'CREATE') || sessionCan('ATTENDANCE');
  const canCreateLeave = sessionCanAction('LEAVES', 'CREATE') || sessionCan('LEAVES');
  const canProcessPayroll = sessionCanAction('PAYROLL', 'CREATE') || sessionCan('PAYROLL');

  const actions = [
    {
      title: 'Add Employee',
      description: 'Register staff member',
      href: '/admin/hrm/employees?action=create',
      icon: UserPlus,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-[#163A2E]',
      borderHover: 'hover:border-emerald-600/30',
      allowed: canAddEmployee,
    },
    {
      title: 'Mark Attendance',
      description: 'Manual punch or override',
      href: '/admin/hrm/attendance?action=punch',
      icon: Clock,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-700',
      borderHover: 'hover:border-blue-600/30',
      allowed: canMarkAttendance,
    },
    {
      title: 'Apply Leave',
      description: 'Request or review time off',
      href: '/admin/hrm/leaves',
      icon: CalendarPlus,
      iconBg: 'bg-purple-50',
      iconColor: 'text-purple-700',
      borderHover: 'hover:border-purple-600/30',
      allowed: canCreateLeave,
    },
    {
      title: 'Process Payroll',
      description: 'Salary disbursement & slips',
      href: '/admin/hrm/payroll',
      icon: IndianRupee,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-700',
      borderHover: 'hover:border-amber-600/30',
      allowed: canProcessPayroll,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {actions.map((act) => {
        const Icon = act.icon;
        const Component = act.allowed ? Link : 'div';
        return (
          <Component
            key={act.title}
            href={act.allowed ? act.href : undefined}
            className={`group relative flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs transition-all duration-300 ${
              act.allowed
                ? `cursor-pointer hover:-translate-y-0.5 hover:shadow-md ${act.borderHover}`
                : 'opacity-60 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex size-10 items-center justify-center rounded-xl ${act.iconBg} ${act.iconColor} transition-transform duration-300 group-hover:scale-105`}
              >
                <Icon className="size-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-900 transition-colors">
                  {act.title}
                </p>
                <p className="text-[11px] text-slate-500 font-medium">
                  {act.description}
                </p>
              </div>
            </div>

            {act.allowed && (
              <div className="flex size-7 items-center justify-center rounded-lg bg-slate-50 text-slate-400 group-hover:bg-emerald-50 group-hover:text-[#163A2E] transition-all">
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </div>
            )}
          </Component>
        );
      })}
    </div>
  );
}
