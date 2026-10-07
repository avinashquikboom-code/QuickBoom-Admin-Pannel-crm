'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, Clock3, LoaderCircle, MapPin, RefreshCw, RotateCcw } from 'lucide-react';
import api from '@/lib/api';
import { useEmployeeAuthStore } from '@/lib/employee-store';
import { hasPermission } from '@/lib/access-control';

type StatusFilter = 'ALL' | 'PRESENT' | 'LATE' | 'HALF_DAY' | 'ABSENT';

interface LogItem {
  key: string;
  dateKey: string;
  date: Date | null;
  day: string;
  checkIn: string;
  checkOut: string;
  workingHours: string;
  breakDuration: string;
  breaksCount: number;
  status: string;
  isLate: boolean;
  location: string;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const STATUS_TABS: { value: StatusFilter; label: string; dot?: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'PRESENT', label: 'Present', dot: '#10B981' },
  { value: 'LATE', label: 'Late', dot: '#F59E0B' },
  { value: 'HALF_DAY', label: 'Half Day', dot: '#3B82F6' },
  { value: 'ABSENT', label: 'Absent', dot: '#EF4444' },
];

const isPresent = (l: LogItem) => ['PRESENT', 'ON_TIME'].includes(l.status) && !l.isLate;
const isLate = (l: LogItem) => l.isLate || l.status === 'LATE';
const isHalf = (l: LogItem) => l.status.includes('HALF');
const isAbsent = (l: LogItem) => l.status === 'ABSENT';

const formatTime = (value: unknown) => {
  if (value === null || value === undefined || value === '') return '—';
  const raw = String(value);
  const date = new Date(raw);
  if (/^\d{4}-\d{2}-\d{2}T/.test(raw) && !Number.isNaN(date.getTime())) {
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  }
  return raw;
};

const formatDuration = (value: unknown) => {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'number') {
    return `${Math.floor(value / 60)}h ${Math.round(value % 60)}m`;
  }
  return String(value);
};

const hasTime = (value: string) => value !== '—' && value !== '--:--' && value !== '';

function mapLog(raw: any, index: number): LogItem {
  const status = String(raw.status ?? 'PRESENT').toUpperCase();
  const rawDate = String(raw.date ?? raw.attendanceDate ?? '');
  const parsed = rawDate ? new Date(rawDate) : null;
  const date = parsed && !Number.isNaN(parsed.getTime()) ? parsed : null;
  const dateKey = /^\d{4}-\d{2}-\d{2}/.test(rawDate) ? rawDate.slice(0, 10) : rawDate;
  return {
    key: String(raw.id ?? `${dateKey}-${index}`),
    dateKey,
    date,
    day: String(raw.day ?? '').trim() || (date ? date.toLocaleDateString('en-US', { weekday: 'long' }) : ''),
    checkIn: formatTime(raw.punchIn ?? raw.punchInAt ?? raw.checkIn),
    checkOut: formatTime(raw.punchOut ?? raw.punchOutAt ?? raw.checkOut),
    workingHours: formatDuration(raw.workingMinutes ?? raw.workingHours),
    breakDuration: formatDuration(raw.totalBreakMinutes ?? raw.totalBreak ?? raw.breakDuration),
    breaksCount: Number(raw.breaksCount) || 0,
    status,
    isLate: status.includes('LATE'),
    location: String(raw.location ?? raw.branch ?? '').trim(),
  };
}

// One record per calendar date, newest first (same consolidation as mobile).
function consolidate(items: LogItem[]): LogItem[] {
  const map = new Map<string, LogItem>();
  for (const item of items) {
    const existing = map.get(item.dateKey);
    if (!existing) {
      map.set(item.dateKey, item);
      continue;
    }
    map.set(item.dateKey, {
      ...existing,
      checkIn: hasTime(existing.checkIn) ? existing.checkIn : item.checkIn,
      checkOut: hasTime(item.checkOut) ? item.checkOut : existing.checkOut,
      status:
        existing.status === 'PRESENT' || item.status === 'PRESENT'
          ? 'PRESENT'
          : existing.status.includes('LATE') || item.status.includes('LATE')
            ? 'LATE'
            : existing.status,
      isLate: existing.isLate || item.isLate,
      workingHours: !['0h 0m', '—'].includes(existing.workingHours) ? existing.workingHours : item.workingHours,
      breakDuration: !['0h 0m', '—'].includes(existing.breakDuration) ? existing.breakDuration : item.breakDuration,
      breaksCount: Math.max(existing.breaksCount, item.breaksCount),
      location: existing.location || item.location,
    });
  }
  return Array.from(map.values()).sort((a, b) =>
    a.date && b.date ? b.date.getTime() - a.date.getTime() : b.dateKey.localeCompare(a.dateKey),
  );
}

function statusStyle(log: LogItem) {
  if (isAbsent(log)) return { label: 'Absent', cls: 'bg-red-50 text-red-700 border-red-200' };
  if (isHalf(log)) return { label: 'Half Day', cls: 'bg-blue-50 text-blue-700 border-blue-200' };
  if (isLate(log)) return { label: 'Late', cls: 'bg-amber-50 text-amber-700 border-amber-200' };
  if (isPresent(log)) return { label: 'Present', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  return { label: log.status.replace(/_/g, ' '), cls: 'bg-slate-50 text-slate-700 border-slate-200' };
}

export default function EmployeeAttendancePage() {
  const user = useEmployeeAuthStore((state) => state.user);
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [status, setStatus] = useState<StatusFilter>('ALL');

  const canView = hasPermission(user, ['employee.attendance.view', 'attendance.view_own', 'attendance.view']);

  const query = useQuery<LogItem[]>({
    queryKey: ['employee-attendance-log'],
    enabled: canView,
    queryFn: async () => {
      const response: any = await api.get('/employees/hrm/attendance', { params: { page: 1, limit: 100 } });
      const list = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response?.items)
            ? response.items
            : Array.isArray(response?.data?.items)
              ? response.data.items
              : null;
      if (!list) throw new Error('The attendance response was invalid.');
      return consolidate(list.map(mapLog));
    },
  });

  const monthLogs = useMemo(
    () =>
      (query.data ?? []).filter((l) => l.date && l.date.getMonth() === month && l.date.getFullYear() === year),
    [query.data, month, year],
  );

  const workingDays = useMemo(() => {
    const days = new Date(year, month + 1, 0).getDate();
    let count = 0;
    for (let d = 1; d <= days; d++) if (new Date(year, month, d).getDay() !== 0) count++;
    return Math.max(count, monthLogs.length);
  }, [month, year, monthLogs.length]);

  const counts: Record<StatusFilter, number> = {
    ALL: monthLogs.length,
    PRESENT: monthLogs.filter(isPresent).length,
    LATE: monthLogs.filter(isLate).length,
    HALF_DAY: monthLogs.filter(isHalf).length,
    ABSENT: monthLogs.filter(isAbsent).length,
  };

  const filtered = useMemo(() => {
    const predicate = { ALL: () => true, PRESENT: isPresent, LATE: isLate, HALF_DAY: isHalf, ABSENT: isAbsent }[status];
    return monthLogs.filter(predicate);
  }, [monthLogs, status]);

  const years = useMemo(() => {
    const set = new Set<number>([now.getFullYear(), year]);
    (query.data ?? []).forEach((l) => l.date && set.add(l.date.getFullYear()));
    return Array.from(set).sort((a, b) => b - a);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.data, year]);

  const filterActive = status !== 'ALL' || month !== now.getMonth() || year !== now.getFullYear();
  const reset = () => {
    setStatus('ALL');
    setMonth(now.getMonth());
    setYear(now.getFullYear());
  };

  if (!canView) {
    return (
      <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-10 text-center">
        <h1 className="text-xl font-bold text-slate-900">Access denied</h1>
        <p className="mt-2 text-sm text-slate-500">You do not have permission to view attendance.</p>
      </div>
    );
  }

  const summary = [
    { label: 'Working Days', value: workingDays, cls: 'text-slate-900' },
    { label: 'Present', value: counts.PRESENT, cls: 'text-emerald-600' },
    { label: 'Late', value: counts.LATE, cls: 'text-amber-600' },
    { label: 'Half Day', value: counts.HALF_DAY, cls: 'text-blue-600' },
    { label: 'Absent', value: counts.ABSENT, cls: 'text-red-600' },
  ];

  const selectCls =
    'h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none focus:border-[#23C45E]';

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-1 pb-10 sm:px-2">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Attendance Log</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">Your daily punch-in and punch-out history</p>
        </div>
        <button
          type="button"
          onClick={() => query.refetch()}
          disabled={query.isFetching}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${query.isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {summary.map((item) => (
          <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{item.label}</p>
            <p className={`mt-1 text-2xl font-black ${item.cls}`}>{item.value}</p>
          </div>
        ))}
      </div>

      <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-3">
          <select className={selectCls} value={month} onChange={(e) => setMonth(Number(e.target.value))} aria-label="Month">
            {MONTHS.map((name, i) => (
              <option key={name} value={i}>{name}</option>
            ))}
          </select>
          <select className={selectCls} value={year} onChange={(e) => setYear(Number(e.target.value))} aria-label="Year">
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={reset}
            disabled={!filterActive}
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
          >
            <RotateCcw className="h-4 w-4" /> Reset
          </button>
          <span className="ml-auto text-sm font-semibold text-slate-500">
            {filtered.length} {filtered.length === 1 ? 'Record' : 'Records'}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUS_TABS.map((tab) => {
            const selected = status === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setStatus(tab.value)}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition-colors ${
                  selected
                    ? 'border-[#23C45E] bg-[#23C45E] text-white'
                    : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50'
                }`}
              >
                {tab.dot && !selected && <span className="h-2 w-2 rounded-full" style={{ backgroundColor: tab.dot }} />}
                {tab.label} ({counts[tab.value]})
              </button>
            );
          })}
        </div>
      </div>

      {query.isLoading ? (
        <div className="flex items-center justify-center gap-3 rounded-3xl border border-slate-200 bg-white py-20 text-slate-500">
          <LoaderCircle className="h-5 w-5 animate-spin" /> Loading attendance...
        </div>
      ) : query.isError ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center">
          <p className="font-semibold text-red-800">Unable to load attendance log.</p>
          <button
            type="button"
            onClick={() => query.refetch()}
            className="mt-3 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Try again
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-3xl border border-dashed border-slate-300 bg-white py-20 text-center">
          <CalendarDays className="h-10 w-10 text-slate-300" />
          <p className="font-semibold text-slate-700">No attendance records</p>
          <p className="text-sm text-slate-500">Nothing found for the selected month and status.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((log) => {
            const badge = statusStyle(log);
            return (
              <article key={log.key} className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-bold text-slate-900">
                      {log.date
                        ? log.date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                        : log.dateKey || 'N/A'}
                    </h2>
                    {log.day && <p className="text-sm text-slate-500">{log.day}</p>}
                  </div>
                  <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-bold ${badge.cls}`}>
                    {badge.label}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-4 sm:grid-cols-4">
                  {[
                    ['Check In', log.checkIn],
                    ['Check Out', log.checkOut],
                    ['Working', log.workingHours],
                    [`Break${log.breaksCount ? ` (${log.breaksCount})` : ''}`, log.breakDuration],
                  ].map(([label, value]) => (
                    <div key={label} className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
                      <p className="mt-0.5 truncate text-sm font-bold text-slate-900">{value}</p>
                    </div>
                  ))}
                </div>
                {log.location && (
                  <p className="mt-3 flex items-center gap-2 text-sm text-slate-600">
                    <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
                    <span className="truncate">{log.location}</span>
                    <Clock3 className="ml-auto h-4 w-4 shrink-0 text-slate-300" />
                  </p>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
