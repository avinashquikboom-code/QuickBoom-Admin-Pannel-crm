'use client';

import { Fragment, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  CalendarCheck,
  CalendarDays,
  CalendarX,
  Check,
  ChevronDown,
  Clock3,
  MapPin,
  RefreshCw,
  RotateCcw,
  Timer,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import api from '@/lib/api';
import { useEmployeeAuthStore } from '@/lib/employee-store';
import { hasPermission } from '@/lib/access-control';
import { formatTimeIST } from '@/lib/utils';

type StatusFilter = 'ALL' | 'PRESENT' | 'LATE' | 'HALF_DAY' | 'ABSENT';

interface LogItem {
  key: string;
  dateKey: string;
  date: Date | null;
  year: number | null;
  month: number | null;
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
  { value: 'HALF_DAY', label: 'Half Day', dot: '#A855F7' },
  { value: 'ABSENT', label: 'Absent', dot: '#EF4444' },
];

const isPresent = (l: LogItem) => ['PRESENT', 'ON_TIME'].includes(l.status) && !l.isLate;
const isLate = (l: LogItem) => l.isLate || l.status === 'LATE';
const isHalf = (l: LogItem) => l.status.includes('HALF');
const isAbsent = (l: LogItem) => l.status === 'ABSENT';

const formatTime = (value: unknown) => formatTimeIST(value, '--:--');

// Attendance dates are calendar days; read them in IST so ISO timestamps never shift the day.
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
function calendarParts(rawDate: string, date: Date | null) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(rawDate.trim());
  if (match) return { year: Number(match[1]), month: Number(match[2]) - 1, day: Number(match[3]) };
  if (!date) return null;
  const ist = new Date(date.getTime() + IST_OFFSET_MS);
  return { year: ist.getUTCFullYear(), month: ist.getUTCMonth(), day: ist.getUTCDate() };
}
const formatLogDate = (log: LogItem) => {
  if (log.year === null || log.month === null || !log.date) return log.dateKey || 'N/A';
  const parts = calendarParts(log.dateKey, log.date);
  if (!parts) return log.dateKey || 'N/A';
  return `${String(parts.day).padStart(2, '0')} ${MONTHS[parts.month].slice(0, 3)} ${parts.year}`;
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
  const dateKey = /^\d{4}-\d{2}-\d{2}$/.test(rawDate.trim()) ? rawDate.trim() : rawDate;
  const parts = calendarParts(dateKey, date);
  const weekday = parts
    ? new Date(Date.UTC(parts.year, parts.month, parts.day)).toLocaleDateString('en-US', {
        weekday: 'long',
        timeZone: 'UTC',
      })
    : '';
  return {
    key: String(raw.id ?? `${dateKey}-${index}`),
    dateKey: parts ? `${parts.year}-${String(parts.month + 1).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}` : dateKey,
    date,
    year: parts?.year ?? null,
    month: parts?.month ?? null,
    day: String(raw.day ?? '').trim() || weekday,
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
    b.dateKey.localeCompare(a.dateKey),
  );
}

function statusStyle(log: LogItem): { label: string; cls: string; Icon: LucideIcon | null } {
  if (isAbsent(log)) return { label: 'ABSENT', cls: 'bg-red-50 text-red-700 border-red-200', Icon: X };
  if (isHalf(log)) return { label: 'HALF DAY', cls: 'bg-purple-50 text-purple-700 border-purple-200', Icon: null };
  if (isLate(log)) return { label: 'LATE', cls: 'bg-amber-50 text-amber-700 border-amber-200', Icon: null };
  if (isPresent(log)) return { label: 'PRESENT', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', Icon: Check };
  return { label: log.status.replace(/_/g, ' '), cls: 'bg-slate-50 text-slate-700 border-slate-200', Icon: null };
}

export default function EmployeeAttendancePage() {
  const user = useEmployeeAuthStore((state) => state.user);
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [status, setStatus] = useState<StatusFilter>('ALL');
  const [expanded, setExpanded] = useState<string | null>(null);

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
      (query.data ?? []).filter((l) => l.month === month && l.year === year),
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
    (query.data ?? []).forEach((l) => l.year !== null && set.add(l.year));
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

  const summary: { label: string; value: number; Icon: LucideIcon; tone: string }[] = [
    { label: 'Total Working Days', value: workingDays, Icon: CalendarDays, tone: 'bg-blue-50 text-blue-600' },
    { label: 'Present', value: counts.PRESENT, Icon: CalendarCheck, tone: 'bg-emerald-50 text-emerald-600' },
    { label: 'Late', value: counts.LATE, Icon: Clock3, tone: 'bg-amber-50 text-amber-600' },
    { label: 'Half Day', value: counts.HALF_DAY, Icon: Timer, tone: 'bg-purple-50 text-purple-600' },
    { label: 'Absent', value: counts.ABSENT, Icon: CalendarX, tone: 'bg-red-50 text-red-600' },
  ];
  const showData = !query.isLoading && !query.isError;

  const selectCls =
    'h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none focus:border-[#23C45E]';

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-1 pb-10 sm:px-2">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Attendance Log</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">View your attendance records and working hours</p>
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

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {summary.map((item) => (
          <div key={item.label} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${item.tone}`}>
              <item.Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-slate-500">{item.label}</p>
              {showData ? (
                <p className="text-xl font-black text-slate-900">
                  {item.value} <span className="text-xs font-semibold text-slate-400">Days</span>
                </p>
              ) : (
                <div className="mt-1 h-6 w-16 animate-pulse rounded bg-slate-100" />
              )}
            </div>
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
                {tab.label} {showData ? counts[tab.value] : '–'}
              </button>
            );
          })}
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-lg font-bold text-slate-900">Attendance Records</h2>
          {showData && (
            <span className="text-sm font-semibold text-slate-500">
              {filtered.length} {filtered.length === 1 ? 'Record' : 'Records'}
            </span>
          )}
        </div>

        {query.isLoading ? (
          <div className="space-y-3 p-5" aria-busy="true">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100" />
            ))}
          </div>
        ) : query.isError ? (
          <div className="p-10 text-center">
            <p className="font-semibold text-red-800">Unable to load attendance records.</p>
            <button
              type="button"
              onClick={() => query.refetch()}
              className="mt-3 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Try Again
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <CalendarDays className="h-10 w-10 text-slate-300" />
            <p className="font-semibold text-slate-700">No Attendance Records</p>
            <p className="text-sm text-slate-500">No attendance records found for the selected month.</p>
            <button
              type="button"
              onClick={reset}
              className="mt-2 rounded-xl bg-[#23C45E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1AA14D]"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
                <tr>
                  {['Date', 'Day', 'Status', 'Check In', 'Check Out', 'Work Hours', 'Break', 'Location', 'Actions'].map((h) => (
                    <th key={h} className="whitespace-nowrap px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((log) => {
                  const badge = statusStyle(log);
                  const open = expanded === log.key;
                  return (
                    <Fragment key={log.key}>
                      <tr className="hover:bg-slate-50/70">
                        <td className="whitespace-nowrap px-4 py-3.5 font-bold text-slate-900">{formatLogDate(log)}</td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-slate-600">{log.day || '—'}</td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${badge.cls}`}>
                            {badge.Icon && <badge.Icon className="h-3 w-3" strokeWidth={3} />}
                            {badge.label}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-slate-700">{log.checkIn}</td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-slate-700">{log.checkOut}</td>
                        <td className="whitespace-nowrap px-4 py-3.5 font-semibold text-slate-900">{log.workingHours}</td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-slate-700">{log.breakDuration}</td>
                        <td className="max-w-[220px] px-4 py-3.5">
                          {log.location ? (
                            <span className="flex items-center gap-1.5 text-slate-700" title={log.location}>
                              <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
                              <span className="truncate">{log.location}</span>
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <button
                            type="button"
                            onClick={() => setExpanded(open ? null : log.key)}
                            aria-expanded={open}
                            aria-label="Toggle details"
                            className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-100"
                          >
                            <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
                          </button>
                        </td>
                      </tr>
                      {open && (
                        <tr className="bg-slate-50/60">
                          <td colSpan={9} className="px-4 py-3 text-sm text-slate-600">
                            <span className="mr-6">Breaks taken: <b className="text-slate-900">{log.breaksCount}</b></span>
                            <span className="mr-6">Break time: <b className="text-slate-900">{log.breakDuration}</b></span>
                            <span>Location: <b className="text-slate-900">{log.location || '—'}</b></span>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
