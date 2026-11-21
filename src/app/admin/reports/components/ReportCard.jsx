'use client';

import * as React from 'react';
import {
  FileText,
  Star,
  Eye,
  Download,
  RefreshCw,
  Users,
  CheckCircle2,
  TrendingUp,
  MapPin,
  Calendar,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  LineChart,
  Line,
} from 'recharts';
import { Button } from '@/components/common/Button';
import { cn } from '@/lib/utils';

export function ReportVisualIndicator({ reportId }) {
  // 1. Leads Summary: mini bar chart
  if (reportId === 'leads-summary') {
    return (
      <div className="h-9 w-full mt-2.5 pt-1.5 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-[#20C466]" />
          <span className="text-[11px] font-medium text-slate-500">Volume distribution</span>
        </div>
        <div className="h-5 w-16">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={[{ v: 12 }, { v: 24 }, { v: 18 }, { v: 32 }]}>
              <Bar dataKey="v" fill="#20C466" radius={[2, 2, 0, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  // 2. Leads by Status: doughnut chart
  if (reportId === 'leads-status') {
    return (
      <div className="h-9 w-full mt-2.5 pt-1.5 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-sky-500" />
          <span className="text-[11px] font-medium text-slate-500">Status breakdown</span>
        </div>
        <div className="size-6">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={[{ v: 40 }, { v: 30 }, { v: 30 }]} dataKey="v" innerRadius={5} outerRadius={11} stroke="none">
                <Cell fill="#20C466" />
                <Cell fill="#0EA5E9" />
                <Cell fill="#F59E0B" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  // 3. Leads by Source: source distribution chart (stacked horizontal bar)
  if (reportId === 'leads-source') {
    return (
      <div className="h-9 w-full mt-2.5 pt-1.5 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-emerald-600" />
          <span className="text-[11px] font-medium text-slate-500">Channels</span>
        </div>
        <div className="w-20 h-2 bg-slate-100 rounded-full flex overflow-hidden">
          <span className="h-full bg-[#20C466]" style={{ width: '50%' }} />
          <span className="h-full bg-[#173D30]" style={{ width: '25%' }} />
          <span className="h-full bg-[#E1306C]" style={{ width: '15%' }} />
          <span className="h-full bg-slate-400" style={{ width: '10%' }} />
        </div>
      </div>
    );
  }

  // 4. Leads by Category: bar chart
  if (reportId === 'leads-category') {
    return (
      <div className="h-9 w-full mt-2.5 pt-1.5 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-indigo-500" />
          <span className="text-[11px] font-medium text-slate-500">Industry sectors</span>
        </div>
        <div className="h-5 w-16">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={[{ v: 14 }, { v: 22 }, { v: 28 }, { v: 19 }]}>
              <Bar dataKey="v" fill="#6366F1" radius={[2, 2, 0, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  // 5. Lead Conversion Report: conversion trend
  if (reportId === 'lead-conversion') {
    return (
      <div className="h-9 w-full mt-2.5 pt-1.5 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-emerald-600" />
          <span className="text-[11px] font-medium text-slate-500">Won conversion</span>
        </div>
        <div className="h-5 w-16">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={[{ v: 8 }, { v: 16 }, { v: 14 }, { v: 25 }]}>
              <Area type="monotone" dataKey="v" stroke="#20C466" strokeWidth={1.5} fill="#EAF7EF" isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  // 6. Employee-wise Leads: employee performance bars
  if (reportId === 'employee-leads') {
    return (
      <div className="h-9 w-full mt-2.5 pt-1.5 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-teal-500" />
          <span className="text-[11px] font-medium text-slate-500">Rep workload</span>
        </div>
        <div className="flex flex-col gap-0.5 w-16">
          <div className="h-1 bg-[#20C466] rounded-full w-full" />
          <div className="h-1 bg-emerald-400 rounded-full w-3/4" />
          <div className="h-1 bg-emerald-300 rounded-full w-1/2" />
        </div>
      </div>
    );
  }

  // 7. Customer Report: customer metrics
  if (reportId === 'customer-report') {
    return (
      <div className="h-9 w-full mt-2.5 pt-1.5 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          <span className="text-[11px] font-medium text-slate-500">Active accounts</span>
        </div>
        <span className="text-[10px] font-bold text-[#173D30] bg-[#EAF7EF] px-1.5 py-0.5 rounded border border-emerald-200">
          98.5% Active
        </span>
      </div>
    );
  }

  // 8. Visits Report: visit trend
  if (reportId === 'visits') {
    return (
      <div className="h-9 w-full mt-2.5 pt-1.5 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-amber-500" />
          <span className="text-[11px] font-medium text-slate-500">Field visits</span>
        </div>
        <div className="h-5 w-16">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={[{ v: 5 }, { v: 9 }, { v: 7 }, { v: 14 }]}>
              <Line type="monotone" dataKey="v" stroke="#F59E0B" strokeWidth={1.8} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  // 9. Tasks Report: task completion indicators
  if (reportId === 'tasks') {
    return (
      <div className="h-9 w-full mt-2.5 pt-1.5 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          <span className="text-[11px] font-medium text-slate-500">Completion</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-[#20C466] rounded-full" style={{ width: '82%' }} />
          </div>
          <span className="text-[10px] font-bold text-slate-700">82%</span>
        </div>
      </div>
    );
  }

  // 10. Sales Activity Report: activity trend
  if (reportId === 'sales-activity') {
    return (
      <div className="h-9 w-full mt-2.5 pt-1.5 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-[#20C466]" />
          <span className="text-[11px] font-medium text-slate-500">Audit logs</span>
        </div>
        <div className="h-5 w-16">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={[{ v: 15 }, { v: 22 }, { v: 19 }, { v: 34 }]}>
              <Area type="monotone" dataKey="v" stroke="#20C466" strokeWidth={1.5} fill="#EAF7EF" isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  // Default indicator for other reports
  return (
    <div className="h-9 w-full mt-2.5 pt-1.5 border-t border-slate-100 flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        <span className="size-1.5 rounded-full bg-slate-400" />
        <span className="text-[11px] font-medium text-slate-500">Structured feed</span>
      </div>
      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
        Live Query
      </span>
    </div>
  );
}

export function ReportCard({
  report,
  isFavourite,
  onToggleFavourite,
  onViewReport,
  onDownloadPdf,
  isDownloading,
}) {
  return (
    <article
      className={cn(
        'flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all duration-200 hover:border-emerald-300 hover:shadow-md min-h-[250px]',
        !report.available && 'opacity-80 bg-slate-50/50'
      )}
    >
      <div>
        {/* Top: Icon + Favourite Star */}
        <div className="flex items-start justify-between gap-2">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-emerald-200/80 bg-[#EAF7EF] text-[#173D30] shadow-2xs">
            <FileText className="size-5 text-[#173D30]" />
          </span>

          <button
            type="button"
            aria-label={isFavourite ? 'Remove favourite' : 'Add favourite'}
            onClick={(e) => onToggleFavourite(report.id, e)}
            className="size-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-amber-500 hover:bg-slate-50 transition-colors"
          >
            <Star
              className={cn(
                'size-4.5 transition-colors',
                isFavourite ? 'text-amber-500 fill-amber-500' : 'text-slate-300 hover:text-amber-400'
              )}
            />
          </button>
        </div>

        {/* Title & Description */}
        <h3 className="text-base font-bold text-slate-900 mt-3 tracking-tight">
          {report.name}
        </h3>
        <p className="text-xs text-slate-500 mt-1 line-clamp-2 min-h-[32px]">
          {report.description}
        </p>

        {/* Contextual Visual Indicator */}
        <ReportVisualIndicator reportId={report.id} />
      </div>

      {/* Bottom Action Buttons */}
      <div className="mt-4 pt-3 flex flex-wrap items-center gap-2">
        <Button
          onClick={() => onViewReport(report)}
          disabled={!report.available}
          className="flex-1 h-9 px-3.5 text-xs font-semibold bg-[#173D30] hover:bg-[#122e25] text-white shadow-2xs gap-1.5 rounded-xl disabled:opacity-50"
        >
          <Eye className="size-3.5 text-[#20C466]" />
          <span>{report.available ? 'View Report' : 'Unavailable'}</span>
        </Button>

        <Button
          variant="outline"
          onClick={(e) => onDownloadPdf(report, e)}
          disabled={!report.available || isDownloading}
          className="h-9 px-3 text-xs font-semibold border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs gap-1.5 rounded-xl disabled:opacity-50"
        >
          {isDownloading ? (
            <RefreshCw className="size-3.5 animate-spin text-emerald-600" />
          ) : (
            <Download className="size-3.5 text-emerald-600" />
          )}
          <span>PDF</span>
        </Button>
      </div>
    </article>
  );
}
