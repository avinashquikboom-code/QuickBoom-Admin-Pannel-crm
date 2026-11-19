'use client';

import * as React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Layers, ArrowUpRight, Target, Trophy, TrendingUp } from 'lucide-react';
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
  const converted = Number(leads?.converted ?? 0);
  const winRate = totalLeads > 0 ? ((converted / totalLeads) * 100).toFixed(1) : 0;

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
      <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs h-[460px]">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 min-h-[56px]">
          <div className="space-y-1">
            <Skeleton className="h-5 w-32 rounded-md" />
            <Skeleton className="h-3.5 w-40 rounded-md" />
          </div>
          <Skeleton className="h-4 w-16 rounded-md" />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3 border-b border-slate-100 pb-4">
          <Skeleton className="h-[74px] rounded-xl" />
          <Skeleton className="h-[74px] rounded-xl" />
          <Skeleton className="h-[74px] rounded-xl" />
        </div>
        <div className="flex justify-center my-auto">
          <Skeleton className="size-36 rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs hover:border-emerald-950/20 transition-all duration-300 h-full">
      {/* Header (min-h-[56px] matching RevenueChartCard) */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 min-h-[56px]">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-50 text-[#163A2E]">
            <Layers className="size-4" />
          </span>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              Leads by Stage
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">Pipeline conversion distribution</p>
          </div>
        </div>

        <Link
          href="/admin/crm/leads"
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#163A2E] hover:underline"
        >
          View all <ArrowUpRight className="size-3.5" />
        </Link>
      </div>

      {/* 3 Metrics Boxes (h-[74px] matching RevenueChartCard) */}
      <div className="mt-4 grid grid-cols-3 gap-2.5 sm:gap-3 border-b border-slate-100 pb-4">
        <div className="rounded-xl bg-slate-50/70 border border-slate-100 p-2.5 sm:p-3 h-[74px] flex flex-col justify-between">
          <p className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
            <Target className="size-3 text-slate-400" /> Total Leads
          </p>
          <p className="mt-0.5 text-base sm:text-lg font-bold text-slate-900">
            <AnimatedCounter value={totalLeads} />
          </p>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-2.5 sm:p-3 h-[74px] flex flex-col justify-between">
          <p className="text-[11px] font-medium text-emerald-800 flex items-center gap-1">
            <Trophy className="size-3 text-emerald-600" /> Won Leads
          </p>
          <p className="mt-0.5 text-base sm:text-lg font-bold text-emerald-950">
            <AnimatedCounter value={converted} />
          </p>
        </div>
        <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-2.5 sm:p-3 h-[74px] flex flex-col justify-between">
          <p className="text-[11px] font-medium text-blue-800 flex items-center gap-1">
            <TrendingUp className="size-3 text-blue-600" /> Win Rate
          </p>
          <p className="mt-0.5 text-base sm:text-lg font-bold text-blue-950">
            {winRate}%
          </p>
        </div>
      </div>

      {/* Donut Chart with Center Total Counter */}
      <div className="relative my-2 flex flex-1 min-h-[170px] w-full items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={displayData}
              cx="50%"
              cy="50%"
              innerRadius={58}
              outerRadius={78}
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
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Total Leads
          </p>
          <p className="text-xl sm:text-2xl font-extrabold text-[#163A2E]">
            <AnimatedCounter value={totalLeads} />
          </p>
        </div>
      </div>

      {/* Interactive Legend with counts & percentages */}
      <div className="mt-2 grid grid-cols-2 gap-1.5 border-t border-slate-100 pt-3">
        {chartData.map((stage) => {
          const pct = totalLeads > 0 ? Math.round((stage.count / totalLeads) * 100) : 0;
          return (
            <div
              key={stage.name}
              className="flex items-center justify-between rounded-lg px-2 py-1 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: stage.color }}
                />
                <span className="truncate text-[11px] font-medium text-slate-600">
                  {stage.name}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px]">
                <span className="font-bold text-slate-900">{stage.count}</span>
                <span className="text-[9px] text-slate-400">({pct}%)</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
