'use client';

import * as React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Target, Layers, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

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

    // Map from default lead metrics keys
    return [
      { name: 'New', count: Number(leads?.new ?? 0), color: '#3B82F6' },
      { name: 'Connected', count: Number(leads?.contacted ?? 0), color: '#10B981' },
      { name: 'Follow-up', count: Number(leads?.qualified ?? 0), color: '#F59E0B' },
      { name: 'Negotiation', count: Number(leads?.negotiation ?? 0), color: '#8B5CF6' },
      { name: 'Won', count: Number(leads?.converted ?? 0), color: '#163A2E' },
      { name: 'Lost', count: Number(leads?.lost ?? 0), color: '#EF4444' },
    ];
  }, [leads]);

  // If total is 0, provide placeholder slice for clean donut rendering
  const displayData = React.useMemo(() => {
    if (totalLeads === 0) {
      return [{ name: 'No Active Leads', count: 1, color: '#E2E8F0' }];
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
        <Skeleton className="size-48 rounded-full mx-auto my-auto" />
        <div className="space-y-2 mt-4">
          <Skeleton className="h-3 w-full rounded-md" />
          <Skeleton className="h-3 w-4/5 rounded-md" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs hover:border-slate-300 transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
              <Target className="size-4" />
            </span>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              Leads by Stage
            </h2>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Pipeline conversion distribution
          </p>
        </div>
        <Link
          href="/admin/crm/leads"
          className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:text-brand-dark transition-colors"
        >
          View Leads
          <ArrowUpRight className="size-3.5" />
        </Link>
      </div>

      {/* Donut Chart with Center Counter */}
      <div className="relative my-3 flex items-center justify-center h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length && totalLeads > 0) {
                  const data = payload[0].payload;
                  const pct = totalLeads > 0 ? Math.round((data.count / totalLeads) * 100) : 0;
                  return (
                    <div className="rounded-xl border border-slate-200/90 bg-white/95 p-2.5 shadow-lg backdrop-blur-md">
                      <div className="flex items-center gap-2">
                        <span
                          className="size-2.5 rounded-full"
                          style={{ backgroundColor: data.color }}
                        />
                        <p className="text-xs font-bold text-slate-800">{data.name}</p>
                      </div>
                      <p className="text-xs font-semibold text-slate-600 mt-1">
                        {data.count} Leads ({pct}%)
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Pie
              data={displayData}
              cx="50%"
              cy="50%"
              innerRadius={58}
              outerRadius={86}
              paddingAngle={totalLeads > 0 ? 3 : 0}
              dataKey="count"
              animationDuration={800}
            >
              {displayData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center Text Overlay */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-none">
            {totalLeads}
          </span>
          <span className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Total Leads
          </span>
        </div>
      </div>

      {/* Stage Progress Legend List */}
      <div className="space-y-2 border-t border-slate-100 pt-3">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {chartData.map((item) => {
            const count = item.count;
            const pct = totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0;
            return (
              <div
                key={item.name}
                className="flex flex-col rounded-lg bg-slate-50/80 p-2 border border-slate-100"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 truncate">
                    <span
                      className="size-2 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="truncate font-medium text-slate-700">
                      {item.name}
                    </span>
                  </div>
                  <span className="font-bold text-slate-900 shrink-0 ml-1">
                    {count}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 w-full rounded-full bg-slate-200/70 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
