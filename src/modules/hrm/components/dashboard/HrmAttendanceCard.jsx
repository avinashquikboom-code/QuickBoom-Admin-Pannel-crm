'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { UserCheck, ArrowUpRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { AnimatedCounter } from '@/components/dashboard/AnimatedCounter';

const ATTENDANCE_COLORS = {
  present: '#10B981', // Vibrant Emerald
  absent: '#EF4444',  // Rose / Red
  late: '#F59E0B',    // Amber
  onBreak: '#06B6D4', // Cyan
  onLeave: '#8B5CF6', // Purple
};

function CustomTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    if (data.isEmpty) return null;
    return (
      <div className="rounded-xl border border-slate-200/90 bg-white/95 px-3 py-2 shadow-lg backdrop-blur-xs">
        <p className="text-xs font-semibold text-slate-800">{data.name}</p>
        <p className="text-xs font-medium text-slate-500">
          <span className="font-bold text-slate-900">{data.count}</span> records ({data.percentage}%)
        </p>
      </div>
    );
  }
  return null;
}

export function HrmAttendanceCard({
  summary,
  periodAttendance,
  selectedPeriod = 'today',
  onPeriodChange,
  loading = false,
}) {
  const router = useRouter();

  // Use periodAttendance when period !== 'today' and available, otherwise fallback to live summary
  const metrics = React.useMemo(() => {
    if (selectedPeriod !== 'today' && periodAttendance) {
      return {
        present: Number(periodAttendance.present || 0),
        absent: Number(periodAttendance.absent || 0),
        late: Number(periodAttendance.late || 0),
        onBreak: Number(periodAttendance.onBreak || 0),
        onLeave: Number(periodAttendance.onLeave || 0),
      };
    }
    return {
      present: Number(summary?.present || 0),
      absent: Number(summary?.absent || 0),
      late: Number(summary?.late || 0),
      onBreak: Number(summary?.onBreak || 0),
      onLeave: Number(summary?.onLeave || 0),
    };
  }, [selectedPeriod, periodAttendance, summary]);

  const total = metrics.present + metrics.absent + metrics.late + metrics.onBreak + metrics.onLeave;
  const attendanceRate = total > 0 ? Math.round((metrics.present / total) * 100) : 0;

  const chartData = React.useMemo(() => {
    if (total === 0) {
      return [{ name: 'No Records', count: 1, color: '#E2E8F0', isEmpty: true }];
    }
    return [
      {
        name: 'Present',
        count: metrics.present,
        percentage: Math.round((metrics.present / total) * 100),
        color: ATTENDANCE_COLORS.present,
        filter: 'present',
      },
      {
        name: 'Absent',
        count: metrics.absent,
        percentage: Math.round((metrics.absent / total) * 100),
        color: ATTENDANCE_COLORS.absent,
        filter: 'absent',
      },
      {
        name: 'Late',
        count: metrics.late,
        percentage: Math.round((metrics.late / total) * 100),
        color: ATTENDANCE_COLORS.late,
        filter: 'late',
      },
      {
        name: 'On Break',
        count: metrics.onBreak,
        percentage: Math.round((metrics.onBreak / total) * 100),
        color: ATTENDANCE_COLORS.onBreak,
        filter: 'on_break',
      },
      {
        name: 'On Leave',
        count: metrics.onLeave,
        percentage: Math.round((metrics.onLeave / total) * 100),
        color: ATTENDANCE_COLORS.onLeave,
        filter: 'leave',
      },
    ].filter((item) => item.count > 0);
  }, [metrics, total]);

  const handleCategoryClick = (category) => {
    if (!category || category === 'No Records') return;
    router.push('/admin/hrm/attendance');
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs h-[440px]">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 min-h-[52px]">
          <div className="space-y-1">
            <Skeleton className="h-5 w-40 rounded-md" />
            <Skeleton className="h-3.5 w-48 rounded-md" />
          </div>
          <Skeleton className="h-7 w-32 rounded-lg" />
        </div>
        <div className="flex justify-center my-auto">
          <Skeleton className="size-44 rounded-full" />
        </div>
        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100">
          <Skeleton className="h-6 rounded-md" />
          <Skeleton className="h-6 rounded-md" />
          <Skeleton className="h-6 rounded-md" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs hover:border-emerald-950/20 transition-all duration-300 h-full">
      {/* Header with Period Filters */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 min-h-[52px]">
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-xl bg-emerald-50 text-[#163A2E]">
            <UserCheck className="size-4" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Attendance Overview</h3>
            <p className="text-xs text-slate-500">Live operational status</p>
          </div>
        </div>

        {/* Period Selector Pills: Today | Week | Month */}
        <div className="flex items-center rounded-lg bg-slate-100 p-0.5">
          {['today', 'week', 'month'].map((p) => {
            const active = selectedPeriod === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => onPeriodChange?.(p)}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold capitalize transition-all ${
                  active
                    ? 'bg-white text-[#163A2E] shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>
      </div>

      {/* Donut Chart with Center Percentage */}
      <div className="relative my-4 flex h-48 w-full items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip content={<CustomTooltip />} />
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={75}
              paddingAngle={chartData.length > 1 ? 3 : 0}
              dataKey="count"
              animationDuration={800}
              onClick={(entry) => handleCategoryClick(entry.name)}
              className="cursor-pointer outline-none focus:outline-none"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  stroke="#ffffff"
                  strokeWidth={2}
                  className="transition-opacity hover:opacity-85"
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center Rate Overlay */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <div className="text-2xl font-black tracking-tight text-slate-900">
            <AnimatedCounter value={attendanceRate} suffix="%" showIndicator={false} />
          </div>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Present Rate
          </span>
        </div>
      </div>

      {/* Breakdown Legend Buttons */}
      <div className="border-t border-slate-100 pt-3">
        <div className="grid grid-cols-2 gap-x-3 gap-y-2 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => handleCategoryClick('Present')}
            className="flex items-center justify-between rounded-lg p-1.5 text-xs hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-500" />
              <span className="text-slate-600 font-medium">Present</span>
            </div>
            <span className="font-bold text-slate-900">{metrics.present}</span>
          </button>

          <button
            type="button"
            onClick={() => handleCategoryClick('Absent')}
            className="flex items-center justify-between rounded-lg p-1.5 text-xs hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-rose-500" />
              <span className="text-slate-600 font-medium">Absent</span>
            </div>
            <span className="font-bold text-slate-900">{metrics.absent}</span>
          </button>

          <button
            type="button"
            onClick={() => handleCategoryClick('Late')}
            className="flex items-center justify-between rounded-lg p-1.5 text-xs hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-amber-500" />
              <span className="text-slate-600 font-medium">Late</span>
            </div>
            <span className="font-bold text-slate-900">{metrics.late}</span>
          </button>

          <button
            type="button"
            onClick={() => handleCategoryClick('On Break')}
            className="flex items-center justify-between rounded-lg p-1.5 text-xs hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-cyan-500" />
              <span className="text-slate-600 font-medium">Break</span>
            </div>
            <span className="font-bold text-slate-900">{metrics.onBreak}</span>
          </button>

          <button
            type="button"
            onClick={() => handleCategoryClick('On Leave')}
            className="flex items-center justify-between rounded-lg p-1.5 text-xs hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-purple-500" />
              <span className="text-slate-600 font-medium">Leave</span>
            </div>
            <span className="font-bold text-slate-900">{metrics.onLeave}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
