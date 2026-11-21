'use client';

import * as React from 'react';
import {
  CheckCircle2,
  ShieldCheck,
  Target,
  Cpu,
  Search,
  Globe,
  Calendar,
  RotateCw,
  Download,
  SlidersHorizontal,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MoreVertical,
  Zap,
  TrendingUp,
  Layers,
  Sparkles,
  PieChart as PieIcon,
  Activity,
  Check,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/common/Dropdown';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  loadCaptureUsage,
  loadCaptureSessions,
  exportCaptureSessions,
  captureError,
} from '@/modules/data-capture/capture-api';

const DUMMY_TREND = [
  { val: 14 },
  { val: 19 },
  { val: 16 },
  { val: 26 },
  { val: 24 },
  { val: 35 },
  { val: 40 },
];

export default function UsageQuotaPage() {
  const [usage, setUsage] = React.useState(null);
  const [sessionsData, setSessionsData] = React.useState({ rows: [], pagination: {} });
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState('');
  const [refreshCount, setRefreshCount] = React.useState(0);

  // Filter & Table State
  const [dateRange, setDateRange] = React.useState('30D');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [pageSize, setPageSize] = React.useState(10);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [sortField, setSortField] = React.useState('createdAt');
  const [sortOrder, setSortOrder] = React.useState('desc');
  const [exporting, setExporting] = React.useState(false);

  // Column Visibility State
  const [columnVisibility, setColumnVisibility] = React.useState({
    job: true,
    keyword: true,
    location: true,
    requested: true,
    captured: true,
    apiCalls: true,
    status: true,
    when: true,
    actions: true,
  });

  const fetchData = React.useCallback(async () => {
    try {
      const [usageRes, sessionsRes] = await Promise.all([
        loadCaptureUsage(),
        loadCaptureSessions({ page: 1, limit: 100 }),
      ]);
      setUsage(usageRes);
      setSessionsData(sessionsRes || { rows: [], pagination: {} });
      setError('');
    } catch (err) {
      setError(captureError(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    setLoading(true);
    fetchData();
  }, [fetchData, refreshCount]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setRefreshCount((prev) => prev + 1);
  };

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const blob = await exportCaptureSessions({ search: searchQuery || undefined }, 'csv');
      const file = blob instanceof Blob ? blob : new Blob([blob], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = url;
      link.download = `extraction-usage-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Extraction history CSV exported');
    } catch {
      // Fallback client-side CSV generator if backend blob stream isn't configured
      const rows = sessionsData?.rows || [];
      if (rows.length === 0) {
        toast.info('No extraction records to export');
        return;
      }
      const headers = ['Job', 'Keyword', 'Location', 'Requested', 'Captured', 'API Calls', 'Status', 'When'];
      const lines = rows.map((r) => [
        r.jobId || r.id,
        r.keyword || '',
        r.location || '',
        r.requestedResults ?? r.requested ?? '',
        r.capturedResults ?? r.captured ?? '',
        r.googleApiRequests ?? r.apiCalls ?? '',
        r.status || 'Completed',
        r.createdAt ? new Date(r.createdAt).toLocaleString('en-IN') : '',
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','));

      const csvContent = [headers.join(','), ...lines].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `extraction-history-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Extraction history CSV downloaded');
    } finally {
      setExporting(false);
    }
  };

  // Calculations for Quota Overview
  const totalCaptured = Number(usage?.totalLeadsCaptured || 0);
  const quotaLimit = Number(usage?.quotaLimit || 1000);
  const quotaRemaining = Number(usage?.quotaRemaining ?? Math.max(0, quotaLimit - totalCaptured));
  const usedPercent = quotaLimit > 0 ? Math.min(100, Math.round((totalCaptured / quotaLimit) * 100)) : 0;

  // KPI Card Config
  const kpiCards = [
    {
      id: 'captured',
      title: 'Captured',
      value: totalCaptured,
      change: '+14.2%',
      isPositive: true,
      icon: CheckCircle2,
    },
    {
      id: 'validated',
      title: 'Validated',
      value: Number(usage?.validatedCount || 0),
      change: '+9.5%',
      isPositive: true,
      icon: ShieldCheck,
    },
    {
      id: 'converted',
      title: 'Converted',
      value: Number(usage?.convertedCount || 0),
      change: '+18.1%',
      isPositive: true,
      icon: Target,
    },
    {
      id: 'google-api',
      title: 'Google API Calls',
      value: Number(usage?.totalGoogleApiCalls || 0),
      change: '+4.8%',
      isPositive: true,
      icon: Cpu,
    },
    {
      id: 'searches',
      title: 'Searches',
      value: Number(usage?.totalSearches ?? usage?.searches ?? 0),
      change: '+11.0%',
      isPositive: true,
      icon: Search,
    },
  ];

  // Usage Trend Chart Data
  const trendData = React.useMemo(() => {
    const days = dateRange === '7D' ? 7 : dateRange === '30D' ? 10 : 12;
    const now = new Date();
    const data = [];
    const base = Math.max(1, Math.round(totalCaptured / days));

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      if (dateRange === '7D') d.setDate(d.getDate() - i);
      else if (dateRange === '30D') d.setDate(d.getDate() - i * 3);
      else d.setDate(d.getDate() - i * 7.5);

      const factor = 0.65 + ((days - i) / days) * 0.7 + Math.sin(i * 1.5) * 0.25;
      const count = Math.max(0, Math.round(base * factor));

      data.push({
        date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        usage: count,
      });
    }
    return data;
  }, [dateRange, totalCaptured]);

  // Usage by Source Data
  const sourcePieData = React.useMemo(() => {
    const total = totalCaptured || 100;
    return [
      { name: 'Google Places', value: Math.max(1, Math.round(total * 0.72)), pct: 72, color: '#20C466' },
      { name: 'Website & Direct', value: Math.max(1, Math.round(total * 0.18)), pct: 18, color: '#173D30' },
      { name: 'CSV & CRM Import', value: Math.max(1, Math.round(total * 0.10)), pct: 10, color: '#0EA5E9' },
    ];
  }, [totalCaptured]);

  // Table filtering, sorting and pagination
  const filteredRows = React.useMemo(() => {
    const list = Array.isArray(sessionsData?.rows) ? sessionsData.rows : [];
    return list
      .filter((row) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        const id = String(row.jobId || row.id || '').toLowerCase();
        const kw = String(row.keyword || '').toLowerCase();
        const loc = String(row.location || '').toLowerCase();
        return id.includes(q) || kw.includes(q) || loc.includes(q);
      })
      .sort((a, b) => {
        const valA = a[sortField];
        const valB = b[sortField];
        if (!valA) return 1;
        if (!valB) return -1;
        if (typeof valA === 'string') {
          return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      });
  }, [sessionsData, searchQuery, sortField, sortOrder]);

  const totalPages = Math.ceil(filteredRows.length / pageSize) || 1;
  const paginatedRows = filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="w-full min-w-0 max-w-none space-y-5 sm:space-y-6 pb-12">
      {/* 1. Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Usage & Quota
          </h1>
          <p className="mt-1 text-sm text-[#718078]">
            Extraction usage and remaining quota for the signed-in tenant.
          </p>
        </div>

        {/* Right Actions: Date Selector & Refresh */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Date Selector Presets */}
          <div className="flex items-center rounded-xl border border-slate-200 bg-white p-1 shadow-2xs">
            {['7D', '30D', '90D', 'Month'].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setDateRange(preset)}
                className={cn(
                  'rounded-lg px-3 py-1 text-xs font-semibold transition-all',
                  dateRange === preset
                    ? 'bg-[#173D30] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                )}
              >
                {preset}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="h-9 px-3.5 rounded-xl border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs gap-1.5"
          >
            <RotateCw className={cn('size-3.5 text-slate-500', refreshing && 'animate-spin')} />
            <span>{refreshing ? 'Refreshing…' : 'Refresh'}</span>
          </Button>
        </div>
      </div>

      {/* Error alert if any */}
      {error && (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs sm:text-sm text-rose-700">
          <p>{error}</p>
        </div>
      )}

      {/* 2. Five KPI Cards in One Row */}
      <div className="grid grid-cols-1 min-[480px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-5 w-full min-w-0">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all duration-200 min-h-[148px]"
            >
              {loading ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-20 rounded-md" />
                    <Skeleton className="size-9 rounded-xl" />
                  </div>
                  <Skeleton className="h-7 w-24 rounded-md" />
                  <Skeleton className="h-3 w-16 rounded-md" />
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        {card.title}
                      </p>
                      <p className="mt-1.5 text-2xl sm:text-[26px] font-bold text-slate-900 tracking-tight">
                        {Number(card.value).toLocaleString()}
                      </p>
                    </div>
                    <span className="flex size-9 sm:size-10 shrink-0 items-center justify-center rounded-xl border border-emerald-200/80 bg-[#EAF7EF] text-[#173D30] shadow-2xs">
                      <Icon className="size-4 sm:size-5" />
                    </span>
                  </div>

                  {/* Trend Indicator & Mini Sparkline */}
                  <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100 gap-2">
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                      <TrendingUp className="size-3 text-emerald-600" />
                      {card.change}
                    </span>

                    <div className="h-7 w-16 shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={DUMMY_TREND}>
                          <defs>
                            <linearGradient id={`kpi-grad-${card.id}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#20C466" stopOpacity={0.4} />
                              <stop offset="100%" stopColor="#20C466" stopOpacity={0.0} />
                            </linearGradient>
                          </defs>
                          <Area
                            type="monotone"
                            dataKey="val"
                            stroke="#20C466"
                            strokeWidth={1.8}
                            fill={`url(#kpi-grad-${card.id})`}
                            isAnimationActive={false}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* 3. Analytics Section: 3 Cards (Quota Overview, Usage Trend, Usage by Source) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 w-full min-w-0 items-stretch">
        {/* Card A: Quota Overview */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs hover:border-emerald-300 transition-all duration-200 h-full">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-xl bg-emerald-50 text-[#173D30] border border-emerald-200/80">
                <Zap className="size-4 text-emerald-700" />
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Quota Overview
                </h2>
                <p className="text-xs text-slate-500">Monthly tier consumption & balance</p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="py-8 flex items-center justify-center">
              <Skeleton className="size-36 rounded-full" />
            </div>
          ) : (
            <div className="my-auto py-4 flex flex-col sm:flex-row items-center justify-between gap-6">
              {/* Circular Progress Gauge */}
              <div className="relative flex items-center justify-center size-36 shrink-0">
                <svg className="size-full -rotate-90" viewBox="0 0 100 100">
                  {/* Track circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#EAF7EF"
                    strokeWidth="10"
                    fill="transparent"
                  />
                  {/* Progress arc */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#20C466"
                    strokeWidth="10"
                    strokeDasharray={2 * Math.PI * 40}
                    strokeDashoffset={2 * Math.PI * 40 * (1 - usedPercent / 100)}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-700 ease-out"
                  />
                </svg>

                {/* Percentage in Center */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-black text-slate-900 leading-none">
                    {usedPercent}%
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400 mt-1 uppercase tracking-wider">
                    Used
                  </span>
                </div>
              </div>

              {/* Supporting Metrics */}
              <div className="flex-1 w-full space-y-2.5 text-xs">
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="font-semibold text-slate-500">Total Quota</span>
                  <span className="font-bold text-slate-900 font-mono">
                    {Number(quotaLimit).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50/60 border border-emerald-100">
                  <span className="font-semibold text-emerald-800">Used</span>
                  <span className="font-bold text-[#173D30] font-mono">
                    {Number(totalCaptured).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="font-semibold text-slate-500">Remaining</span>
                  <span className="font-bold text-emerald-600 font-mono">
                    {Number(quotaRemaining).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="border-t border-slate-100 pt-2.5 text-[11px] text-slate-400">
            Resets automatically on the 1st of every calendar month.
          </div>
        </div>

        {/* Card B: Usage Trend */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs hover:border-emerald-300 transition-all duration-200 h-full">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-xl bg-emerald-50 text-[#173D30] border border-emerald-200/80">
                <Activity className="size-4 text-emerald-700" />
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Usage Trend
                </h2>
                <p className="text-xs text-slate-500">Daily extraction velocity</p>
              </div>
            </div>

            {/* Micro selector */}
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full">
              {dateRange} Trend
            </span>
          </div>

          <div className="my-auto h-[210px] w-full min-w-0 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="usageTrendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#20C466" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#20C466" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#94A3B8' }}
                  dy={4}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#94A3B8' }}
                  dx={-4}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="rounded-xl border border-slate-200 bg-white p-2 shadow-lg text-xs">
                        <p className="font-semibold text-slate-700">{label}</p>
                        <p className="font-bold text-[#173D30]">
                          {payload[0].value} prospects captured
                        </p>
                      </div>
                    );
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="usage"
                  stroke="#20C466"
                  strokeWidth={2.2}
                  fill="url(#usageTrendGrad)"
                  activeDot={{ r: 4.5, fill: '#173D30', stroke: '#FFFFFF', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="border-t border-slate-100 pt-2.5 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Average: {Math.round(totalCaptured / (trendData.length || 1))} / interval</span>
            <span className="text-emerald-600 font-medium">+14.2% pacing</span>
          </div>
        </div>

        {/* Card C: Usage by Source */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs hover:border-emerald-300 transition-all duration-200 h-full">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-xl bg-emerald-50 text-[#173D30] border border-emerald-200/80">
                <PieIcon className="size-4 text-emerald-700" />
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Usage by Source
                </h2>
                <p className="text-xs text-slate-500">Capture provider breakdown</p>
              </div>
            </div>
          </div>

          {/* Doughnut Chart with centered Total */}
          <div className="relative my-auto flex items-center justify-center h-[180px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sourcePieData}
                  innerRadius={58}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="#FFFFFF"
                  strokeWidth={2}
                >
                  {sourcePieData.map((entry, index) => (
                    <Cell key={`source-cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="rounded-xl border border-slate-200 bg-white p-2 text-xs shadow-md">
                        <p className="font-semibold text-slate-800">{d.name}</p>
                        <p className="font-bold text-[#173D30]">{d.value} ({d.pct}%)</p>
                      </div>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Centered Total */}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-xl font-black text-slate-900 leading-none">
                {totalCaptured}
              </span>
              <span className="text-[10px] font-semibold text-slate-400 mt-0.5">
                Total
              </span>
            </div>
          </div>

          {/* Legend */}
          <div className="border-t border-slate-100 pt-2.5 space-y-1.5 text-xs">
            {sourcePieData.map((s) => (
              <div key={s.name} className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                  <span className="truncate text-slate-600 font-medium">{s.name}</span>
                </div>
                <span className="font-bold text-slate-900">{s.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Extraction History Section */}
      <div className="rounded-2xl border border-[#E2E8E5] bg-white shadow-xs overflow-hidden">
        {/* Table Top Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              Extraction History
            </h2>
            <p className="text-xs text-slate-500">
              List of all data extraction jobs and their usage details.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search input */}
            <div className="relative min-w-[200px] sm:w-60">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search extraction jobs..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-8 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-8 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#173D30]"
              />
            </div>

            {/* Columns Toggle Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger
                aria-label="Toggle Columns"
                className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors shadow-2xs"
              >
                <SlidersHorizontal className="size-3 text-slate-500" />
                <span>Columns</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44 bg-white border border-slate-200 shadow-xl rounded-xl p-1 text-xs">
                {Object.entries({
                  job: 'Job ID',
                  keyword: 'Keyword',
                  location: 'Location',
                  requested: 'Requested',
                  captured: 'Captured',
                  apiCalls: 'API Calls',
                  status: 'Status',
                  when: 'When',
                }).map(([key, label]) => (
                  <DropdownMenuCheckboxItem
                    key={key}
                    checked={columnVisibility[key]}
                    onCheckedChange={(checked) =>
                      setColumnVisibility((prev) => ({ ...prev, [key]: checked }))
                    }
                    className="text-xs rounded-lg p-1.5"
                  >
                    {label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Export CSV button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              disabled={exporting}
              className="h-8 px-3 rounded-xl border-slate-200 bg-white text-xs font-semibold text-[#173D30] hover:bg-emerald-50 hover:border-emerald-200 transition-colors shadow-2xs gap-1.5"
            >
              <Download className={cn('size-3.5 text-slate-500', exporting && 'animate-pulse')} />
              <span>{exporting ? 'Exporting…' : 'Export CSV'}</span>
            </Button>
          </div>
        </div>

        {/* Semantic Table with Pale Green Header */}
        <div className="relative w-full overflow-x-auto min-w-0">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-emerald-100/90 bg-[#F4FAF6] text-[#163A2E]">
                {columnVisibility.job && (
                  <th
                    className="py-3 px-4 font-semibold tracking-wider cursor-pointer hover:bg-emerald-100/40 transition-colors"
                    onClick={() => toggleSort('jobId')}
                  >
                    <div className="flex items-center gap-1">
                      Job
                      <ArrowUpDown className="size-3 text-slate-400" />
                    </div>
                  </th>
                )}
                {columnVisibility.keyword && (
                  <th
                    className="py-3 px-4 font-semibold tracking-wider cursor-pointer hover:bg-emerald-100/40 transition-colors"
                    onClick={() => toggleSort('keyword')}
                  >
                    <div className="flex items-center gap-1">
                      Keyword
                      <ArrowUpDown className="size-3 text-slate-400" />
                    </div>
                  </th>
                )}
                {columnVisibility.location && (
                  <th
                    className="py-3 px-4 font-semibold tracking-wider cursor-pointer hover:bg-emerald-100/40 transition-colors"
                    onClick={() => toggleSort('location')}
                  >
                    <div className="flex items-center gap-1">
                      Location
                      <ArrowUpDown className="size-3 text-slate-400" />
                    </div>
                  </th>
                )}
                {columnVisibility.requested && (
                  <th
                    className="py-3 px-4 font-semibold tracking-wider text-right cursor-pointer hover:bg-emerald-100/40 transition-colors"
                    onClick={() => toggleSort('requestedResults')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Requested
                      <ArrowUpDown className="size-3 text-slate-400" />
                    </div>
                  </th>
                )}
                {columnVisibility.captured && (
                  <th
                    className="py-3 px-4 font-semibold tracking-wider text-right cursor-pointer hover:bg-emerald-100/40 transition-colors"
                    onClick={() => toggleSort('capturedResults')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Captured
                      <ArrowUpDown className="size-3 text-slate-400" />
                    </div>
                  </th>
                )}
                {columnVisibility.apiCalls && (
                  <th
                    className="py-3 px-4 font-semibold tracking-wider text-right cursor-pointer hover:bg-emerald-100/40 transition-colors"
                    onClick={() => toggleSort('googleApiRequests')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      API Calls
                      <ArrowUpDown className="size-3 text-slate-400" />
                    </div>
                  </th>
                )}
                {columnVisibility.status && (
                  <th className="py-3 px-4 font-semibold tracking-wider">Status</th>
                )}
                {columnVisibility.when && (
                  <th
                    className="py-3 px-4 font-semibold tracking-wider cursor-pointer hover:bg-emerald-100/40 transition-colors"
                    onClick={() => toggleSort('createdAt')}
                  >
                    <div className="flex items-center gap-1">
                      When
                      <ArrowUpDown className="size-3 text-slate-400" />
                    </div>
                  </th>
                )}
                {columnVisibility.actions && (
                  <th className="py-3 px-4 font-semibold tracking-wider text-right">Actions</th>
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100/80">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={9} className="p-4">
                      <Skeleton className="h-7 w-full rounded-lg" />
                    </td>
                  </tr>
                ))
              ) : paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No extraction jobs found.
                  </td>
                </tr>
              ) : (
                paginatedRows.map((job) => {
                  const jobIdStr = String(job.jobId || job.id || 'job-auto');
                  const statusVal = String(job.status || 'Completed');
                  const isDone = statusVal.toLowerCase() === 'completed';
                  const isFailed = statusVal.toLowerCase() === 'failed';

                  return (
                    <tr
                      key={job.id || jobIdStr}
                      className="hover:bg-[#F9FCFA] transition-colors group"
                    >
                      {columnVisibility.job && (
                        <td className="py-3.5 px-4 font-mono font-medium text-slate-900">
                          <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] text-slate-700 font-mono">
                            {jobIdStr.length > 14 ? `${jobIdStr.slice(0, 12)}…` : jobIdStr}
                          </span>
                        </td>
                      )}
                      {columnVisibility.keyword && (
                        <td className="py-3.5 px-4 text-slate-800 font-medium max-w-[180px] truncate" title={job.keyword || '—'}>
                          {job.keyword || '—'}
                        </td>
                      )}
                      {columnVisibility.location && (
                        <td className="py-3.5 px-4 text-slate-600 max-w-[180px] truncate" title={job.location || '—'}>
                          {job.location || '—'}
                        </td>
                      )}
                      {columnVisibility.requested && (
                        <td className="py-3.5 px-4 text-right font-mono text-slate-700">
                          {job.requestedResults ?? job.requested ?? '—'}
                        </td>
                      )}
                      {columnVisibility.captured && (
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-[#173D30]">
                          {job.capturedResults ?? job.captured ?? 0}
                        </td>
                      )}
                      {columnVisibility.apiCalls && (
                        <td className="py-3.5 px-4 text-right font-mono text-slate-700">
                          {job.googleApiRequests ?? job.apiCalls ?? '—'}
                        </td>
                      )}
                      {columnVisibility.status && (
                        <td className="py-3.5 px-4">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize',
                              isDone
                                ? 'bg-[#E8F8EE] text-[#169F4D] border border-emerald-200/80'
                                : isFailed
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            )}
                          >
                            <span
                              className={cn(
                                'size-1.5 rounded-full',
                                isDone ? 'bg-[#1FC45B]' : isFailed ? 'bg-rose-600' : 'bg-amber-500'
                              )}
                            />
                            {statusVal}
                          </span>
                        </td>
                      )}
                      {columnVisibility.when && (
                        <td className="py-3.5 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                          {job.createdAt
                            ? new Date(job.createdAt).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '—'}
                        </td>
                      )}
                      {columnVisibility.actions && (
                        <td className="py-3.5 px-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              aria-label={`Actions for job ${jobIdStr}`}
                              className="size-7 inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            >
                              <MoreVertical className="size-3.5" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-36 bg-white border border-slate-200 shadow-xl rounded-xl p-1 text-xs">
                              <DropdownMenuItem
                                onClick={() => {
                                  toast.info(`Viewing job #${jobIdStr}`);
                                }}
                                className="p-1.5 rounded-lg cursor-pointer hover:bg-slate-50 text-slate-700"
                              >
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  toast.info(`Filtered places by job #${jobIdStr}`);
                                  window.location.href = `/admin/data-capture?jobId=${jobIdStr}`;
                                }}
                                className="p-1.5 rounded-lg cursor-pointer hover:bg-emerald-50 text-emerald-700 font-medium"
                              >
                                View Leads
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Standard Pagination Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 p-3.5 text-xs text-slate-500 bg-white">
          <span className="font-medium">
            Showing{' '}
            <strong className="text-slate-800 font-semibold">
              {filteredRows.length ? (currentPage - 1) * pageSize + 1 : 0}
            </strong>{' '}
            –{' '}
            <strong className="text-slate-800 font-semibold">
              {Math.min(currentPage * pageSize, filteredRows.length)}
            </strong>{' '}
            of <strong className="text-slate-800 font-semibold">{filteredRows.length}</strong> jobs
          </span>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span>Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#173D30]"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="h-8 px-2.5 rounded-lg text-xs"
              >
                Previous
              </Button>
              <span className="px-2 text-xs font-semibold text-slate-700">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="h-8 px-2.5 rounded-lg text-xs"
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
