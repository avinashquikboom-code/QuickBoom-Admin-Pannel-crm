'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Building2, ArrowUpRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { AnimatedCounter } from '@/components/dashboard/AnimatedCounter';

const DEPT_COLORS = [
  '#163A2E', // Deep Forest Green
  '#10B981', // Emerald
  '#059669', // Dark Emerald
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#F59E0B', // Amber
  '#06B6D4', // Cyan
  '#EC4899', // Pink
  '#6366F1', // Indigo
];

function CustomTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    if (data.isEmpty) return null;
    return (
      <div className="rounded-xl border border-slate-200/90 bg-white/95 px-3 py-2 shadow-lg backdrop-blur-xs">
        <p className="text-xs font-semibold text-slate-800">{data.name}</p>
        <p className="text-xs font-medium text-slate-500">
          <span className="font-bold text-slate-900">{data.count}</span> employees ({data.percentage}%)
        </p>
      </div>
    );
  }
  return null;
}

export function HrmDepartmentCard({ departments = [], totalEmployees = 0, loading = false }) {
  const router = useRouter();

  const total = Number(totalEmployees || departments.reduce((acc, d) => acc + (d.count || 0), 0));

  const chartData = React.useMemo(() => {
    if (!departments || departments.length === 0 || total === 0) {
      return [{ name: 'No Departments', count: 1, color: '#E2E8F0', isEmpty: true }];
    }
    return departments.map((d, idx) => ({
      name: d.name,
      count: d.count,
      percentage: d.percentage ?? (total > 0 ? Math.round((d.count / total) * 1000) / 10 : 0),
      color: DEPT_COLORS[idx % DEPT_COLORS.length],
    }));
  }, [departments, total]);

  const handleDepartmentClick = (deptName) => {
    if (!deptName || deptName === 'No Departments') return;
    router.push(`/admin/hrm/employees?department=${encodeURIComponent(deptName)}`);
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs h-[440px]">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 min-h-[52px]">
          <div className="space-y-1">
            <Skeleton className="h-5 w-40 rounded-md" />
            <Skeleton className="h-3.5 w-48 rounded-md" />
          </div>
          <Skeleton className="h-4 w-20 rounded-md" />
        </div>
        <div className="flex justify-center my-auto">
          <Skeleton className="size-44 rounded-full" />
        </div>
        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100">
          <Skeleton className="h-6 rounded-md" />
          <Skeleton className="h-6 rounded-md" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs hover:border-emerald-950/20 transition-all duration-300 h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 min-h-[52px]">
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-xl bg-emerald-50 text-[#163A2E]">
            <Building2 className="size-4" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Department Distribution</h3>
            <p className="text-xs text-slate-500">Headcount allocation by team</p>
          </div>
        </div>
        <Link
          href="/admin/hrm/departments"
          className="group inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 hover:text-[#163A2E] transition-colors"
        >
          View Details
          <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </div>

      {/* Donut Chart with Center Total */}
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
              onClick={(entry) => handleDepartmentClick(entry.name)}
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

        {/* Center Total Count Overlay */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <div className="text-2xl font-black tracking-tight text-slate-900">
            <AnimatedCounter value={total} showIndicator={false} />
          </div>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Total Staff
          </span>
        </div>
      </div>

      {/* Department Breakdown Listing */}
      <div className="border-t border-slate-100 pt-3">
        {departments.length === 0 ? (
          <p className="text-center text-xs text-slate-400 py-2">No departments assigned yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 max-h-36 overflow-y-auto pr-1">
            {departments.slice(0, 6).map((dept, idx) => {
              const color = DEPT_COLORS[idx % DEPT_COLORS.length];
              return (
                <button
                  key={dept.name}
                  type="button"
                  onClick={() => handleDepartmentClick(dept.name)}
                  className="group flex items-center justify-between rounded-lg px-2 py-1 text-left text-xs transition-colors hover:bg-slate-50"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <span className="truncate font-medium text-slate-700 group-hover:text-slate-900">
                      {dept.name}
                    </span>
                  </div>
                  <span className="shrink-0 text-slate-400 font-semibold group-hover:text-emerald-700">
                    {dept.count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
