'use client';

import * as React from 'react';
import Link from 'next/link';
import api from '../../../../../lib/api';
import { PageTitleCard } from '@/components/common/PageTitleCard';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  MapPin,
  Compass,
  Settings,
  Activity,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Search,
  SlidersHorizontal,
  Layers,
  PieChart as PieChartIcon,
  TrendingUp,
  ShieldCheck,
  Check,
  X,
  Key,
  Clock,
  Calendar,
  ArrowUpRight,
  HelpCircle,
  Info,
  ChevronRight,
  Bell,
  Sparkles,
  Filter,
  RefreshCw,
  Zap,
  Globe,
  ExternalLink,
  ShieldAlert,
  Server,
  Save,
  Send,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const TABS = [
  'Overview',
  'API Usage',
  'Daily & Monthly Quotas',
  'Usage History',
  'API Configuration',
];

const KNOWN_APIS = [
  { name: 'Places API', description: 'Search, Autocomplete, Place Details', color: '#16A34A' },
  { name: 'Geocoding API', description: 'Address to coordinates & Reverse Geocode', color: '#3B82F6' },
  { name: 'Directions API', description: 'Routing, Distance matrix, Transit steps', color: '#F59E0B' },
  { name: 'Maps JavaScript API', description: 'Dynamic client map render & marker layers', color: '#8B5CF6' },
];

function unwrap(payload) {
  return payload?.data?.data || payload?.data || payload || {};
}

// Hook: Animated Count-up with prefers-reduced-motion
function useCountUp(target, duration = 800) {
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setCount(Number(target) || 0);
      return;
    }

    const numTarget = Number(target) || 0;
    if (numTarget === 0) {
      setCount(0);
      return;
    }

    let start = 0;
    const startTime = performance.now();
    let animId;

    const step = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(easedProgress * numTarget);
      setCount(current);

      if (progress < 1) {
        animId = requestAnimationFrame(step);
      } else {
        setCount(numTarget);
      }
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [target, duration]);

  return count;
}

// Decorative Header Artwork
function GoogleMapsHeaderIllustration() {
  return (
    <div
      className="pointer-events-none absolute right-4 -top-3 h-full max-w-[45%] select-none hidden lg:flex items-center justify-end pr-4 overflow-hidden"
      aria-hidden="true"
    >
      <div className="relative flex items-center justify-center w-72 h-36">
        {/* Ambient Gradient Blobs */}
        <div className="absolute -top-4 -right-4 size-32 rounded-full bg-emerald-200/40 blur-2xl animate-pulse duration-1000" />
        <div className="absolute bottom-0 right-16 size-24 rounded-full bg-teal-200/30 blur-xl animate-pulse delay-300" />

        {/* Floating Service Pill 1 */}
        <div className="absolute top-2 right-12 z-20 flex items-center gap-2.5 rounded-xl border border-emerald-200/90 bg-white/95 px-3 py-1.5 shadow-md backdrop-blur-xs transition-transform duration-700 hover:scale-105 animate-in fade-in slide-in-from-right-4">
          <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500 text-white font-bold text-[10px] shadow-2xs">
            <Compass className="size-3.5" />
          </div>
          <div>
            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              Google Maps
            </div>
            <div className="text-xs font-bold text-slate-900 flex items-center gap-1">
              <span>Places & Geocode</span>
              <span className="flex size-1.5 rounded-full bg-emerald-500 animate-ping" />
            </div>
          </div>
        </div>

        {/* Floating Quota Pill 2 */}
        <div className="absolute bottom-3 right-4 z-20 flex items-center gap-2 rounded-xl border border-teal-200/80 bg-white/95 px-3 py-1.5 shadow-md backdrop-blur-xs transition-transform duration-700 hover:scale-105 animate-in fade-in slide-in-from-right-8 delay-150">
          <div className="flex size-6 items-center justify-center rounded-full bg-teal-50 text-teal-700 border border-teal-200">
            <ShieldCheck className="size-3" />
          </div>
          <span className="text-xs font-bold text-teal-950">Quota Monitored</span>
        </div>

        {/* Decorative Map Grid SVG */}
        <svg
          viewBox="0 0 200 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="absolute -right-4 top-2 w-52 h-28 text-emerald-600/15"
        >
          <path
            d="M20 100C60 40 120 20 190 20"
            stroke="currentColor"
            strokeWidth="3"
            strokeDasharray="4 4"
          />
          <circle cx="160" cy="50" r="32" stroke="currentColor" strokeWidth="2" strokeDasharray="6 6" />
        </svg>
      </div>
    </div>
  );
}

// Usage Summary Card with Animated Progress
function UsageSummaryCard({
  title,
  used = 0,
  limit = 0,
  remaining = 0,
  percent = 0,
  icon: Icon,
  subtitle,
}) {
  const animatedUsed = useCountUp(used, 800);
  const animatedRemaining = useCountUp(remaining, 800);
  const numericPercent = Number(percent) || 0;

  // Tone determination
  const isDanger = numericPercent >= 95;
  const isWarning = numericPercent >= 80 && numericPercent < 95;

  const barColor = isDanger
    ? 'bg-rose-500'
    : isWarning
    ? 'bg-amber-500'
    : 'bg-[#16A34A]';

  const badgeColor = isDanger
    ? 'border-rose-200 bg-rose-50 text-rose-700'
    : isWarning
    ? 'border-amber-200 bg-amber-50 text-amber-700'
    : 'border-emerald-200 bg-emerald-50 text-[#16A34A]';

  return (
    <div className="group relative rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs transition-all duration-300 hover:border-emerald-200 hover:shadow-md flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 truncate">
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              {animatedUsed.toLocaleString('en-IN')}
            </span>
            <span className="text-xs font-semibold text-slate-400">
              / {Number(limit).toLocaleString('en-IN')} quota
            </span>
          </div>
        </div>

        <div
          className={cn(
            'flex size-10 items-center justify-center rounded-xl border shrink-0 transition-transform duration-300 group-hover:scale-105 shadow-2xs',
            badgeColor
          )}
        >
          <Icon className="size-5" />
        </div>
      </div>

      {/* Progress Section */}
      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">
            <strong className="text-slate-700">{animatedRemaining.toLocaleString('en-IN')}</strong> remaining
          </span>
          <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-bold border', badgeColor)}>
            {numericPercent}% Used
          </span>
        </div>

        {/* Animated Progress Bar */}
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className={cn('h-full rounded-full transition-all duration-1000 ease-out', barColor)}
            style={{ width: `${Math.min(100, Math.max(0, numericPercent))}%` }}
          />
        </div>

        {subtitle && (
          <p className="text-[11px] text-slate-400 pt-0.5">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

// Request Summary Card
function RequestSummaryCard({ selected = {} }) {
  const total = Number(selected.requests || 0);
  const success = Number(selected.success || 0);
  const failed = Number(selected.failed || 0);

  const animatedTotal = useCountUp(total, 800);
  const animatedSuccess = useCountUp(success, 800);
  const animatedFailed = useCountUp(failed, 800);

  const successRate = total > 0 ? ((success / total) * 100).toFixed(1) : '100.0';

  return (
    <div className="group relative rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs transition-all duration-300 hover:border-emerald-200 hover:shadow-md flex flex-col justify-between">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 truncate">
            Request Summary
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              {animatedTotal.toLocaleString('en-IN')}
            </span>
            <span className="text-xs font-semibold text-emerald-700">
              {successRate}% Success
            </span>
          </div>
        </div>

        <div className="flex size-10 items-center justify-center rounded-xl border border-teal-200 bg-teal-50 text-teal-700 shrink-0 shadow-2xs transition-transform duration-300 group-hover:scale-105">
          <Activity className="size-5" />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-2 text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#16A34A] block">
            Success
          </span>
          <span className="text-sm font-bold text-emerald-950 mt-0.5 block">
            {animatedSuccess.toLocaleString('en-IN')}
          </span>
        </div>
        <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-2 text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 block">
            Failed
          </span>
          <span className="text-sm font-bold text-rose-950 mt-0.5 block">
            {animatedFailed.toLocaleString('en-IN')}
          </span>
        </div>
      </div>
    </div>
  );
}

// Chart 1: API Usage Trend Area Chart
function ApiUsageTrendChart({ history = [] }) {
  const [reducedMotion, setReducedMotion] = React.useState(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      setReducedMotion(mq.matches);
    }
  }, []);

  // Aggregate daily history rows into date series
  const chartData = React.useMemo(() => {
    if (!Array.isArray(history) || history.length === 0) return [];

    const map = new Map();
    history.forEach((row) => {
      const day = row.day || '—';
      if (!map.has(day)) {
        map.set(day, { day, requests: 0, success: 0, failed: 0 });
      }
      const entry = map.get(day);
      entry.requests += Number(row.requests || 0);
      entry.success += Number(row.success || 0);
      entry.failed += Number(row.failed || 0);
    });

    return Array.from(map.values())
      .sort((a, b) => a.day.localeCompare(b.day))
      .map((item) => ({
        ...item,
        label: item.day.length > 5 ? item.day.slice(5) : item.day,
      }));
  }, [history]);

  const hasData = chartData.length > 0 && chartData.some((d) => d.requests > 0);

  return (
    <div className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs transition-all duration-300 hover:border-emerald-200 hover:shadow-md h-full min-h-[380px]">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 min-h-[50px] gap-2">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-[#16A34A] border border-emerald-100 shrink-0">
            <TrendingUp className="size-4.5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 leading-tight">API Usage Trend</h2>
            <p className="text-[11px] text-slate-500 mt-0.5">Daily request volume and completion status</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50/70 px-2.5 py-1 text-[11px] font-bold text-[#16A34A] shrink-0">
          <Activity className="size-3" />
          <span>Timeline</span>
        </div>
      </div>

      <div className="relative mt-3 flex-1 min-h-[220px] w-full flex items-center justify-center">
        {!hasData ? (
          <div className="flex flex-col items-center justify-center text-center p-6 space-y-2">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-50 text-[#16A34A] border border-emerald-100">
              <Compass className="size-6" />
            </div>
            <p className="text-xs font-semibold text-slate-800">No Request Data</p>
            <p className="text-[11px] text-slate-500 max-w-xs">
              No backend Google Maps requests were logged during this range.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={230}>
            <AreaChart data={chartData} margin={{ top: 12, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="mapsUsageFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16A34A" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="#16A34A" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={{ stroke: '#E2E8F0' }}
                tick={{ fontSize: 11, fill: '#64748B' }}
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: '#64748B' }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const item = payload[0]?.payload;
                  return (
                    <div className="rounded-xl border border-slate-200 bg-white/95 px-3 py-2 shadow-lg backdrop-blur-xs text-xs space-y-1">
                      <p className="font-bold text-slate-800 border-b border-slate-100 pb-1">{item.day}</p>
                      <div className="flex items-center justify-between gap-4 text-emerald-700 font-semibold">
                        <span>Total:</span>
                        <span>{item.requests} calls</span>
                      </div>
                      <div className="flex items-center justify-between gap-4 text-slate-600">
                        <span>Success:</span>
                        <span>{item.success}</span>
                      </div>
                      {item.failed > 0 && (
                        <div className="flex items-center justify-between gap-4 text-rose-600 font-medium">
                          <span>Failed:</span>
                          <span>{item.failed}</span>
                        </div>
                      )}
                    </div>
                  );
                }}
              />
              <Area
                type="monotone"
                dataKey="requests"
                name="Requests"
                stroke="#16A34A"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#mapsUsageFill)"
                isAnimationActive={!reducedMotion}
                animationDuration={900}
                dot={{ r: 3, fill: '#16A34A', stroke: '#fff', strokeWidth: 2 }}
                activeDot={{ r: 5, fill: '#16A34A', stroke: '#fff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
        <span>X: Timeline (Days)</span>
        <span>Y: Requests</span>
      </div>
    </div>
  );
}

// Chart 2: API Usage by Type Donut Chart
function ApiUsageByTypeChart({ breakdown = [] }) {
  const [reducedMotion, setReducedMotion] = React.useState(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      setReducedMotion(mq.matches);
    }
  }, []);

  // Compute segments
  const { chartSegments, totalCalls } = React.useMemo(() => {
    const list = Array.isArray(breakdown) ? breakdown : [];
    let sum = 0;

    const segments = list
      .map((item, idx) => {
        const count = Number(item.requests || 0);
        sum += count;
        const color =
          KNOWN_APIS.find((k) => k.name.toLowerCase() === item.apiName?.toLowerCase())?.color ||
          ['#16A34A', '#3B82F6', '#F59E0B', '#8B5CF6'][idx % 4];

        return {
          name: item.apiName || 'API',
          value: count,
          color,
        };
      })
      .filter((s) => s.value > 0);

    return {
      chartSegments:
        segments.length > 0
          ? segments
          : [{ name: 'No Requests', value: 1, color: '#E2E8F0', isEmpty: true }],
      totalCalls: sum,
    };
  }, [breakdown]);

  const animatedTotal = useCountUp(totalCalls, 800);

  return (
    <div className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs transition-all duration-300 hover:border-emerald-200 hover:shadow-md h-full min-h-[380px]">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 min-h-[50px] gap-2">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-[#16A34A] border border-emerald-100 shrink-0">
            <PieChartIcon className="size-4.5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 leading-tight">API Usage by Type</h2>
            <p className="text-[11px] text-slate-500 mt-0.5">Distribution across Google Maps endpoints</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-700 shrink-0">
          <ShieldCheck className="size-3 text-[#16A34A]" />
          <span>{animatedTotal.toLocaleString('en-IN')} Total</span>
        </div>
      </div>

      <div className="relative mt-2 flex-1 min-h-[200px] w-full flex items-center justify-center">
        <ResponsiveContainer width="100%" height={210}>
          <PieChart>
            <Pie
              data={chartSegments}
              cx="50%"
              cy="50%"
              innerRadius={56}
              outerRadius={76}
              paddingAngle={totalCalls > 0 ? 3 : 0}
              dataKey="value"
              isAnimationActive={!reducedMotion}
              animationDuration={900}
            >
              {chartSegments.map((entry, index) => (
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
                const pct = totalCalls > 0 ? ((item.value / totalCalls) * 100).toFixed(1) : 0;
                return (
                  <div className="rounded-xl border border-slate-200/90 bg-white/95 px-3 py-2 shadow-lg backdrop-blur-xs text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800">
                      <span className="size-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span>{item.name}</span>
                    </div>
                    <p className="mt-1 font-extrabold text-slate-900">
                      {item.value.toLocaleString('en-IN')} requests ({pct}%)
                    </p>
                  </div>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Total</span>
          <span className="text-xl font-black text-[#173D30]">{animatedTotal.toLocaleString('en-IN')}</span>
          <span className="text-[10px] text-slate-400">Calls</span>
        </div>
      </div>

      {/* Symmetrical Legend */}
      <div className="mt-2 pt-3 border-t border-slate-100">
        <div className="grid grid-cols-2 gap-2">
          {KNOWN_APIS.map((api) => {
            const row = (breakdown || []).find((b) => b.apiName?.toLowerCase() === api.name.toLowerCase());
            const calls = row?.requests || 0;
            const pct = totalCalls > 0 ? ((calls / totalCalls) * 100).toFixed(1) : '0.0';

            return (
              <div key={api.name} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/60 px-2.5 py-1.5 text-xs">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: api.color }} />
                  <span className="truncate text-slate-700 font-medium">{api.name}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 pl-1">
                  <span className="font-bold text-slate-900">{calls.toLocaleString('en-IN')}</span>
                  <span className="text-[10px] text-slate-400">({pct}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Operational Alerts Section
function OperationalAlertsSection({ alerts = [] }) {
  // Filter out dummy/test alerts as required by Rule 8
  const realAlerts = React.useMemo(() => {
    if (!Array.isArray(alerts)) return [];
    return alerts.filter((a) => {
      const msg = String(a.message || '').toLowerCase();
      const isTest = msg.includes('test alert') || a.apiName === 'TEST';
      return !isTest;
    });
  }, [alerts]);

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs space-y-3">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-50 text-[#16A34A] border border-emerald-100">
            <Bell className="size-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Operational Quota Alerts</h3>
            <p className="text-[11px] text-slate-500">Live monitoring notifications from quota thresholds</p>
          </div>
        </div>
        <span className="text-xs font-semibold text-slate-500">
          {realAlerts.length} Active
        </span>
      </div>

      {realAlerts.length === 0 ? (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50/60 p-3.5 text-xs text-emerald-800">
          <CheckCircle2 className="size-5 shrink-0 text-emerald-600" />
          <div>
            <p className="font-semibold text-emerald-950">No active quota alerts</p>
            <p className="text-emerald-700 mt-0.5">
              All backend Google Maps endpoints are operating normally within assigned daily and monthly limits.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {realAlerts.slice(0, 8).map((alert) => {
            const isDanger = (alert.threshold || 0) >= 95;
            return (
              <div
                key={alert.id || alert.message}
                className={cn(
                  'flex items-start gap-2.5 rounded-xl border p-3 text-xs transition-colors',
                  isDanger
                    ? 'border-rose-200 bg-rose-50/70 text-rose-900'
                    : 'border-amber-200 bg-amber-50/70 text-amber-900'
                )}
              >
                {isDanger ? (
                  <AlertTriangle className="size-4 shrink-0 text-rose-600 mt-0.5" />
                ) : (
                  <Info className="size-4 shrink-0 text-amber-600 mt-0.5" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{alert.message}</p>
                  <p className="text-[10px] opacity-75 mt-0.5">
                    Scope: {alert.scope || 'DAILY'} · Threshold: {alert.threshold || 80}%
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function GoogleMapsManagementPage() {
  const [tab, setTab] = React.useState(TABS[0]);
  const [from, setFrom] = React.useState('');
  const [to, setTo] = React.useState('');
  const [apiName, setApiName] = React.useState('');
  const [overview, setOverview] = React.useState(null);
  const [breakdown, setBreakdown] = React.useState([]);
  const [history, setHistory] = React.useState([]);
  const [alerts, setAlerts] = React.useState([]);
  const [quota, setQuota] = React.useState({
    dailyLimit: 1000,
    monthlyLimit: 20000,
    alertsEnabled: true,
    enforcementEnabled: false,
    recipients: '',
    timezone: 'Asia/Kolkata',
    warningThresholds: [80, 90, 95],
  });
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    const params = { from: from || undefined, to: to || undefined, api: apiName || undefined };
    try {
      const [overviewRes, breakdownRes, historyRes, quotaRes, alertsRes] = await Promise.all([
        api.get('/admin/google-maps/usage/overview', { params }),
        api.get('/admin/google-maps/usage/breakdown', { params }),
        api.get('/admin/google-maps/usage/history', { params }),
        api.get('/admin/google-maps/quotas'),
        api.get('/admin/google-maps/alerts'),
      ]);
      setOverview(unwrap(overviewRes));
      const rows = unwrap(breakdownRes);
      setBreakdown(rows.apis || []);
      setHistory(unwrap(historyRes).rows || []);
      setQuota(unwrap(quotaRes));
      setAlerts(unwrap(alertsRes).data || unwrap(alertsRes) || []);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Google Maps usage could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [from, to, apiName]);

  React.useEffect(() => {
    load();
  }, [load]);

  const handleResetFilters = () => {
    setFrom('');
    setTo('');
    setApiName('');
  };

  async function handleSaveQuota(event) {
    event.preventDefault();
    setSaving(true);
    try {
      await api.put('/admin/google-maps/quotas', {
        ...quota,
        dailyLimit: Number(quota.dailyLimit),
        monthlyLimit: Number(quota.monthlyLimit),
        warningThresholds: [80, 90, 95],
      });
      toast.success('Google Maps quota saved successfully');
      load();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Quota was not saved.');
    } finally {
      setSaving(false);
    }
  }

  const today = overview?.today || {};
  const month = overview?.month || {};
  const selected = overview?.selected || {};
  const hasActiveFilters = Boolean(from || to || apiName);

  return (
    <div className="w-full min-w-0 max-w-none space-y-5 sm:space-y-6 pb-24 overflow-x-hidden">
      {/* 1. Redesigned Page Header matching QB Suite PageTitleCard */}
      <PageTitleCard
        module="SYSTEM GOVERNANCE"
        title="Google Maps Management"
        description="Monitor Google Maps API consumption, quotas, and request activity."
        icon={MapPin}
        illustration={<GoogleMapsHeaderIllustration />}
      />

      {/* 2. Navigation Tabs (Horizontally scrollable on mobile) */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {TABS.map((item) => {
          const isActive = tab === item;
          return (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              className={cn(
                'whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-semibold transition-all shrink-0',
                isActive
                  ? 'bg-[#16A34A] text-white shadow-xs font-bold'
                  : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50 hover:text-slate-900'
              )}
            >
              {item}
            </button>
          );
        })}
      </div>

      {/* 3. Responsive Filters Panel */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 items-end">
          {/* From Date */}
          <div className="min-w-0">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
              From Date
            </label>
            <Input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              aria-label="From date"
              className="h-9 w-full rounded-xl text-xs bg-white"
            />
          </div>

          {/* To Date */}
          <div className="min-w-0">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
              To Date
            </label>
            <Input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              aria-label="To date"
              className="h-9 w-full rounded-xl text-xs bg-white"
            />
          </div>

          {/* API Filter */}
          <div className="min-w-0">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
              API Endpoint
            </label>
            <Input
              value={apiName}
              onChange={(e) => setApiName(e.target.value)}
              placeholder="e.g. Places, Geocode"
              className="h-9 w-full rounded-xl text-xs bg-white"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={load}
              disabled={loading}
              className="h-9 flex-1 rounded-xl border-slate-200/90 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <RotateCw className={cn('mr-1.5 size-3.5', loading && 'animate-spin text-[#16A34A]')} />
              <span>Apply</span>
            </Button>
            {hasActiveFilters && (
              <Button
                type="button"
                variant="ghost"
                onClick={handleResetFilters}
                className="h-9 rounded-xl px-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                title="Reset filters"
              >
                <X className="size-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* NOTE: Yellow Warning Banner has been completely removed from this UI per Requirement 1 */}

      {/* Tab Content: OVERVIEW or API USAGE Summary Cards */}
      {(tab === 'Overview' || tab === 'API Usage') && (
        <div className="grid grid-cols-1 min-[640px]:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4 w-full">
          <UsageSummaryCard
            title="Today's Consumption"
            used={today.requests || 0}
            limit={today.limit || 0}
            remaining={today.remaining || 0}
            percent={today.percent || 0}
            icon={Compass}
            subtitle="Resets at midnight Asia/Kolkata"
          />
          <UsageSummaryCard
            title="This Month's Consumption"
            used={month.requests || 0}
            limit={month.limit || 0}
            remaining={month.remaining || 0}
            percent={month.percent || 0}
            icon={Calendar}
            subtitle="Monthly cumulative calls"
          />
          <RequestSummaryCard selected={selected} />
        </div>
      )}

      {/* Tab Content: OVERVIEW (Charts + Alerts) */}
      {tab === 'Overview' && (
        <div className="space-y-5 sm:space-y-6">
          {/* Animated Analytics: Trend & Donut Charts */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 sm:gap-6 w-full items-stretch">
            <ApiUsageTrendChart history={history} />
            <ApiUsageByTypeChart breakdown={breakdown} />
          </div>

          {/* Operational Alerts */}
          <OperationalAlertsSection alerts={alerts} />
        </div>
      )}

      {/* Tab Content: API USAGE TABLE */}
      {tab === 'API Usage' && (
        <div className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-xs">
          <div className="border-b border-slate-100 p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-50 text-[#16A34A] border border-emerald-100">
                <Layers className="size-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">API Endpoint Breakdown</h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">{breakdown.length} Services</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-[#F8FBF9] text-[11px] font-bold uppercase tracking-wider text-slate-600 text-left">
                  <th className="py-3 px-4">API Name</th>
                  <th className="py-3 px-4 text-right">Requests</th>
                  <th className="py-3 px-4 text-right">Success</th>
                  <th className="py-3 px-4 text-right">Failed</th>
                  <th className="py-3 px-4 text-right">Daily Limit</th>
                  <th className="py-3 px-4 text-right">Monthly Limit</th>
                  <th className="py-3 px-4 text-right">Usage %</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {breakdown.map((row) => (
                  <tr key={row.apiName} className="hover:bg-[#F9FCFA] transition-colors h-[48px]">
                    <td className="py-2.5 px-4 font-semibold text-slate-900 flex items-center gap-2">
                      <span className="size-2 rounded-full bg-emerald-500 shrink-0" />
                      <span>{row.apiName}</span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-bold text-slate-900">
                      {row.requests.toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 px-4 text-right text-emerald-700 font-semibold">
                      {row.success.toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 px-4 text-right text-rose-600 font-semibold">
                      {row.failed.toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 px-4 text-right text-slate-500">
                      {row.dailyQuota.toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 px-4 text-right text-slate-500">
                      {row.monthlyQuota.toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <span className="font-semibold text-slate-700">{row.percent}%</span>
                    </td>
                    <td className="py-2.5 px-4">
                      <span
                        className={cn(
                          'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border',
                          row.requests > 0
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                            : 'bg-slate-100 border-slate-200 text-slate-600'
                        )}
                      >
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {breakdown.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No APIs matching the filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Content: USAGE HISTORY */}
      {tab === 'Usage History' && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-50 text-[#16A34A] border border-emerald-100">
                <Clock className="size-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Request Audit History</h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">{history.length} Entries</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-[#F8FBF9] text-[11px] font-bold uppercase tracking-wider text-slate-600 text-left">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">API Name</th>
                  <th className="py-3 px-4 text-right">Success</th>
                  <th className="py-3 px-4 text-right">Failed</th>
                  <th className="py-3 px-4 text-right">Total Requests</th>
                  <th className="py-3 px-4">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {history.map((row) => (
                  <tr key={`${row.day}-${row.apiName}`} className="hover:bg-[#F9FCFA] transition-colors h-[48px]">
                    <td className="py-2.5 px-4 font-medium text-slate-900">{row.day}</td>
                    <td className="py-2.5 px-4 font-semibold text-slate-800">{row.apiName}</td>
                    <td className="py-2.5 px-4 text-right text-emerald-700 font-semibold">{row.success}</td>
                    <td className="py-2.5 px-4 text-right text-rose-600 font-semibold">{row.failed}</td>
                    <td className="py-2.5 px-4 text-right font-bold text-slate-900">{row.requests}</td>
                    <td className="py-2.5 px-4">
                      {row.failed === 0 ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                          <Check className="size-3" /> All OK
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-700 font-semibold">
                          <AlertTriangle className="size-3" /> Errors noted
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {history.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No tracked Google Maps requests in this period.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Content: DAILY & MONTHLY QUOTAS */}
      {tab === 'Daily & Monthly Quotas' && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs max-w-2xl space-y-5">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Quota Limits & Notification Thresholds</h3>
              <p className="text-xs text-slate-500 mt-0.5">Control daily/monthly maximums and early warning triggers</p>
            </div>
            <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-[#16A34A] border border-emerald-100">
              <ShieldCheck className="size-5" />
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleSaveQuota}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Daily Limit (Calls)</label>
                <Input
                  type="number"
                  min="0"
                  value={quota.dailyLimit}
                  onChange={(e) => setQuota({ ...quota, dailyLimit: e.target.value })}
                  className="h-10 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Monthly Limit (Calls)</label>
                <Input
                  type="number"
                  min="0"
                  value={quota.monthlyLimit}
                  onChange={(e) => setQuota({ ...quota, monthlyLimit: e.target.value })}
                  className="h-10 rounded-xl"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Alert Recipients (Email)</label>
              <Input
                value={quota.recipients || ''}
                onChange={(e) => setQuota({ ...quota, recipients: e.target.value })}
                placeholder="ops@company.com, tech@company.com"
                className="h-10 rounded-xl"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">Comma-separated email addresses to receive threshold alerts</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Timezone for Daily Reset</label>
              <Input
                value={quota.timezone || 'Asia/Kolkata'}
                onChange={(e) => setQuota({ ...quota, timezone: e.target.value })}
                className="h-10 rounded-xl"
              />
            </div>

            <div className="space-y-2.5 rounded-xl border border-slate-200/90 bg-slate-50/60 p-4">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={Boolean(quota.alertsEnabled)}
                  onChange={(e) => setQuota({ ...quota, alertsEnabled: e.target.checked })}
                  className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 size-4"
                />
                <div className="text-xs">
                  <span className="font-bold text-slate-800">Enable usage alerts</span>
                  <p className="text-slate-500 mt-0.5">Sends automated operational notices when usage hits 80%, 90%, 95%, and 100% of limits.</p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer select-none pt-2 border-t border-slate-200">
                <input
                  type="checkbox"
                  checked={Boolean(quota.enforcementEnabled)}
                  onChange={(e) => setQuota({ ...quota, enforcementEnabled: e.target.checked })}
                  className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 size-4"
                />
                <div className="text-xs">
                  <span className="font-bold text-slate-800">Enforce hard limits (Auto-pause)</span>
                  <p className="text-slate-500 mt-0.5">Stop new backend Google Maps requests when the internal quota is exhausted to prevent runaway usage.</p>
                </div>
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2">
              <Button
                type="submit"
                disabled={saving}
                className="h-10 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-semibold"
              >
                <Save className="mr-1.5 size-3.5" />
                <span>{saving ? 'Saving...' : 'Save Quotas'}</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setQuota({ ...quota, dailyLimit: 1000, monthlyLimit: 20000, enforcementEnabled: false })}
                className="h-10 rounded-xl text-xs font-semibold"
              >
                Reset to Default
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={async () => {
                  try {
                    await api.post('/admin/google-maps/alerts/test');
                    toast.success('Test alert signal dispatched successfully');
                    load();
                  } catch (e) {
                    toast.error('Could not send test alert');
                  }
                }}
                className="h-10 rounded-xl text-xs font-semibold text-slate-600"
              >
                <Send className="mr-1.5 size-3.5" />
                <span>Send Test Alert</span>
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Tab Content: API CONFIGURATION */}
      {tab === 'API Configuration' && (
        <div className="space-y-5 max-w-2xl">
          {/* Status Card */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-[#16A34A] border border-emerald-100">
                  <Key className="size-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Google Maps Platform Integration</h3>
                  <p className="text-xs text-slate-500">API credentials and secure backend connector</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Configured
              </span>
            </div>

            {/* Masked Key Display */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-600">Active API Key:</span>
                <span className="font-mono text-slate-500 text-[11px]">AIzaSy••••••••••••••••••••••••••••</span>
              </div>
              <p className="text-[11px] text-slate-400">
                API Key is stored securely in environment configuration and decrypted on the server.
              </p>
            </div>

            {/* Configured APIs Checklist */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Enabled Services Checklist
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {KNOWN_APIS.map((apiItem) => (
                  <div key={apiItem.name} className="flex items-start gap-2 rounded-xl border border-slate-100 bg-slate-50/50 p-2.5">
                    <CheckCircle2 className="size-4 shrink-0 text-emerald-600 mt-0.5" />
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-slate-800 block">{apiItem.name}</span>
                      <span className="text-[10px] text-slate-400 block">{apiItem.description}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex flex-wrap gap-2">
              <Link href="/admin/settings/integrations">
                <Button variant="outline" className="h-9 rounded-xl text-xs font-semibold gap-1.5">
                  <Settings className="size-3.5" />
                  <span>Manage in Integrations</span>
                  <ExternalLink className="size-3" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
