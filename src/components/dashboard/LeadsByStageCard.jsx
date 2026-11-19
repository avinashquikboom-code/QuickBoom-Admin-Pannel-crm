'use client';

import * as React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Target, Layers, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { AnimatedCounter } from './AnimatedCounter';

const STAGE_CONFIG = [
  { key: 'new', name: 'New', color: '#3B82F6' },
  { key: 'contacted', name: 'Connected', color: '#10B981' },
  { key: 'qualified', name: 'Follow-up', color: '#F59E0B' },
  { key: 'negotiation', name: 'Negotiation', color: '#8B5CF6' },
  { key: 'converted', name: 'Won', color: '#163A2E' },
  { key: 'lost', name: 'Lost', color: '#EF4444' },
];

export function LeadsByStageCard({ leads, loading }) {
  const totalLeads = Number(leads?.total ?? 0);

  // Map backend stages or fallback to status breakdown
  const chartData = React.useMemo(() => {
    if (Array.isArray(leads?.stages) && leads.stages.length > 0) {
      return leads.stages.map((st, idx) => ({
        name: st.name || 'Stage',
        count: Number(st.count || 0),
        color: st.color || STAGE_CONFIG[idx % STAGE_CONFIG.length].color,
      }));
    }

    return [
      { name: 'New', count: Number(leads?.new ?? 0), color: '#3B82F6' },
      { name: 'Connected', count: Number(leads?.contacted ?? 0), color: '#10B981' },
      { name: 'Follow-up', count: Number(leads?.qualified ?? 0), color: '#F59E0B' },
      { name: 'Negotiation', count: Number(leads?.negotiation ?? 0), color: '#8B5CF6' },
      { name: 'Won', count: Number(leads?.converted ?? 0), color: '#163A2E' },
      { name: 'Lost', count: Number(leads?.lost ?? 0), color: '#EF4444' },
    ];
  }, [leads]);

  const displayData = React.useMemo(() => {
    if (totalLeads === 0) {
      return [{ name: 'No Active Leads', count: 1, color: '#E2E8F0', isEmpty: true }];
    }
    return chartData.filter((item) => item.count > 0);
  }, [totalLeads, chartData]);

  if (loading) {
    return (
      <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs h-[420px]">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32 rounded-md" />
          <Skeleton className="h-4 w-16 rounded-md" />
        </div>
        <div className="flex justify-center my-auto">
          <Skeleton className="size-48 rounded-full" />
        </div>
        <div className="grid grid-cols-2 gap-2 mt-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs hover:border-emerald-950/20 transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-50 text-[#163A2E]">
            <Layers className="size-4" />
          </span>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              Leads by Stage
            </h2>
            <p className="text-xs text-slate-500">Pipeline conversion distribution</p>
          </div>
        </div>

        <Link
          href="/admin/crm/leads"
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#163A2E] hover:underline"
        >
          View all <ArrowUpRight className="size-3.5" />
        </Link>
      </div>

      {/* Donut Chart with Center Total Counter */}
      <div className="relative my-2 flex h-48 sm:h-52 w-full items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={displayData}
              cx="50%"
              cy="50%"
              innerRadius={65}
              outerRadius={88}
              paddingAngle={totalLeads > 0 ? 3 : 0}
              dataKey="count"
              isAnimationActive={true}
              animationDuration={800}
            >
              {displayData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  className="transition-all duration-300 hover:opacity-85 focus:outline-none"
                />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const item = payload[0]?.payload;
                if (item?.isEmpty) return null;
                const percentage =
                  totalLeads > 0 ? ((item.count / totalLeads) * 100).toFixed(1) : 0;
                return (
                  <div className="rounded-xl border border-slate-200/90 bg-white/95 backdrop-blur-xs p-2.5 shadow-md">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="size-2.5 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-xs font-bold text-slate-800">{item.name}</span>
                    </div>
                    <p className="mt-1 text-sm font-extrabold text-slate-900">
                      {item.count} leads ({percentage}%)
                    </p>
                  </div>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Center Total Counter */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Total Leads
          </p>
          <p className="text-2xl sm:text-3xl font-extrabold text-[#163A2E]">
            <AnimatedCounter value={totalLeads} />
          </p>
        </div>
      </div>

      {/* Interactive Legend with counts & percentages */}
      <div className="mt-2 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
        {chartData.map((stage) => {
          const pct = totalLeads > 0 ? Math.round((stage.count / totalLeads) * 100) : 0;
          return (
            <div
              key={stage.name}
              className="flex items-center justify-between rounded-lg p-1.5 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: stage.color }}
                />
                <span className="truncate text-xs font-medium text-slate-600">
                  {stage.name}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <span className="font-bold text-slate-900">{stage.count}</span>
                <span className="text-[10px] text-slate-400">({pct}%)</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
