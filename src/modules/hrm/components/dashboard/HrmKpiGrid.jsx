'use client';

import * as React from 'react';
import {
  Users,
  UserCheck,
  UserX,
  ClockAlert,
  Coffee,
  CalendarClock,
  Receipt,
  IndianRupee,
} from 'lucide-react';
import { HrmKpiCard } from './HrmKpiCard';

export function HrmKpiGrid({ summary, loading = false, onNavigate, periodLabel = 'Today' }) {
  const totalEmployees = Number(summary?.totalEmployees ?? 0);
  const present = Number(summary?.present ?? 0);
  const absent = Number(summary?.absent ?? 0);
  const late = Number(summary?.late ?? 0);
  const onBreak = Number(summary?.onBreak ?? 0);
  const pendingLeaves = Number(summary?.pendingLeaves ?? 0);
  const pendingClaims = Number(summary?.pendingClaims ?? 0);
  const payrollNet = Number(summary?.payrollNet ?? 0);

  const presentRate = totalEmployees > 0 ? Math.round((present / totalEmployees) * 100) : 0;
  const absentRate = totalEmployees > 0 ? Math.round((absent / totalEmployees) * 100) : 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* 1. Total Workforce */}
      <HrmKpiCard
        title="Total Workforce"
        value={totalEmployees}
        subtitle="Active team members"
        icon={Users}
        iconColor="text-[#163A2E]"
        iconBg="bg-emerald-50"
        accentBorder="from-[#163A2E] to-emerald-600"
        loading={loading}
        onClick={() => onNavigate?.('/admin/hrm/employees')}
      />

      {/* 2. Present Today */}
      <HrmKpiCard
        title={`Present ${periodLabel}`}
        value={present}
        subtitle={`${presentRate}% workforce attendance`}
        icon={UserCheck}
        iconColor="text-emerald-700"
        iconBg="bg-emerald-50"
        accentBorder="from-emerald-500 to-teal-500"
        progressPercent={presentRate}
        progressColor="bg-emerald-500"
        loading={loading}
        onClick={() => onNavigate?.('/admin/hrm/attendance')}
      />

      {/* 3. Absent Today */}
      <HrmKpiCard
        title={`Absent ${periodLabel}`}
        value={absent}
        subtitle={`${absentRate}% absence rate`}
        icon={UserX}
        iconColor="text-rose-600"
        iconBg="bg-rose-50"
        accentBorder="from-rose-500 to-amber-500"
        progressPercent={absentRate}
        progressColor="bg-rose-500"
        loading={loading}
        onClick={() => onNavigate?.('/admin/hrm/attendance')}
      />

      {/* 4. Late Today */}
      <HrmKpiCard
        title={`Late ${periodLabel}`}
        value={late}
        subtitle="Punch-in delay recorded"
        icon={ClockAlert}
        iconColor="text-amber-600"
        iconBg="bg-amber-50"
        accentBorder="from-amber-500 to-orange-500"
        loading={loading}
        onClick={() => onNavigate?.('/admin/hrm/attendance')}
      />

      {/* 5. On Break */}
      <HrmKpiCard
        title="On Break"
        value={onBreak}
        subtitle="Staff currently on break"
        icon={Coffee}
        iconColor="text-teal-700"
        iconBg="bg-teal-50"
        accentBorder="from-teal-500 to-emerald-500"
        loading={loading}
        onClick={() => onNavigate?.('/admin/hrm/attendance')}
      />

      {/* 6. Pending Leave */}
      <HrmKpiCard
        title="Pending Leave"
        value={pendingLeaves}
        subtitle="Requests awaiting review"
        icon={CalendarClock}
        iconColor="text-purple-600"
        iconBg="bg-purple-50"
        accentBorder="from-purple-500 to-indigo-500"
        loading={loading}
        onClick={() => onNavigate?.('/admin/hrm/leaves')}
      />

      {/* 7. Pending Claims */}
      <HrmKpiCard
        title="Pending Claims"
        value={pendingClaims}
        subtitle="Expense claims in queue"
        icon={Receipt}
        iconColor="text-blue-600"
        iconBg="bg-blue-50"
        accentBorder="from-blue-500 to-cyan-500"
        loading={loading}
        onClick={() => onNavigate?.('/admin/hrm/claims')}
      />

      {/* 8. Payroll Net */}
      <HrmKpiCard
        title="Payroll Net"
        value={payrollNet}
        prefix="₹"
        subtitle="Approved monthly net"
        icon={IndianRupee}
        iconColor="text-[#163A2E]"
        iconBg="bg-emerald-100/70"
        accentBorder="from-emerald-600 to-[#163A2E]"
        loading={loading}
        onClick={() => onNavigate?.('/admin/hrm/payroll')}
      />
    </div>
  );
}
