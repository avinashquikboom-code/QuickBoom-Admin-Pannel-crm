'use client';

import * as React from 'react';
import { Calendar, Download, Filter, RotateCcw, RotateCw, Search, X } from 'lucide-react';
import api from '../../../lib/api';
import { cn } from '@/lib/utils';

export const BUSINESS_TIMEZONE = 'Asia/Kolkata';

export const DATE_PRESETS = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: 'last_7_days', label: 'Last 7 Days' },
  { id: 'last_30_days', label: 'Last 30 Days' },
  { id: 'this_week', label: 'This Week' },
  { id: 'this_month', label: 'This Month' },
  { id: 'last_month', label: 'Last Month' },
  { id: 'this_quarter', label: 'This Quarter' },
  { id: 'this_year', label: 'This Year' },
  { id: 'all_time', label: 'All Time' },
  { id: 'custom', label: 'Custom Range' },
];

export function formatIstDateKey(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: BUSINESS_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function addDaysToKey(dateKey, deltaDays) {
  const [y, m, d] = dateKey.split('-').map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d + deltaDays));
  return utc.toISOString().slice(0, 10);
}

export function resolvePresetRange(preset, customFrom = '', customTo = '') {
  const today = formatIstDateKey(new Date());
  const [y, m, d] = today.split('-').map(Number);

  switch (preset) {
    case 'today':
      return { fromDate: today, toDate: today };
    case 'yesterday': {
      const yest = addDaysToKey(today, -1);
      return { fromDate: yest, toDate: yest };
    }
    case 'last_7_days':
      return { fromDate: addDaysToKey(today, -6), toDate: today };
    case 'last_30_days':
      return { fromDate: addDaysToKey(today, -29), toDate: today };
    case 'this_week': {
      const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
      const diffToMonday = dow === 0 ? 6 : dow - 1;
      return { fromDate: addDaysToKey(today, -diffToMonday), toDate: today };
    }
    case 'this_month':
      return { fromDate: `${y}-${String(m).padStart(2, '0')}-01`, toDate: today };
    case 'last_month': {
      const prevMonthEnd = new Date(Date.UTC(y, m - 1, 0));
      const py = prevMonthEnd.getUTCFullYear();
      const pm = prevMonthEnd.getUTCMonth() + 1;
      const pd = prevMonthEnd.getUTCDate();
      return {
        fromDate: `${py}-${String(pm).padStart(2, '0')}-01`,
        toDate: `${py}-${String(pm).padStart(2, '0')}-${String(pd).padStart(2, '0')}`,
      };
    }
    case 'this_quarter': {
      const qStartMonth = Math.floor((m - 1) / 3) * 3 + 1;
      return { fromDate: `${y}-${String(qStartMonth).padStart(2, '0')}-01`, toDate: today };
    }
    case 'this_year':
      return { fromDate: `${y}-01-01`, toDate: today };
    case 'custom':
      return { fromDate: customFrom || '', toDate: customTo || '' };
    case 'all_time':
    default:
      return { fromDate: '', toDate: '' };
  }
}

function formatReadableDate(key) {
  if (!key) return '';
  const [y, m, d] = key.split('-').map(Number);
  if (!y || !m || !d) return key;
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

function SearchableSelect({ label, value, onChange, options, placeholder = 'All', className }) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const ref = React.useRef(null);

  React.useEffect(() => {
    const onOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  const selected = options.find((o) => String(o.value) === String(value));
  const filtered = query.trim()
    ? options.filter((o) => String(o.label).toLowerCase().includes(query.trim().toLowerCase()))
    : options;

  return (
    <div ref={ref} className={cn('relative min-w-[155px]', className)}>
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="flex h-9 w-full items-center justify-between gap-2 rounded-xl border border-[#E2E8E5] bg-white px-3 text-xs font-medium text-[#142D25] transition hover:border-[#123D32]"
      >
        <span className="truncate">
          <span className="text-[#64748B]">{label}: </span>
          {selected ? selected.label : placeholder}
        </span>
        {value ? (
          <X
            className="size-3.5 shrink-0 text-[#64748B] hover:text-[#142D25]"
            onClick={(e) => {
              e.stopPropagation();
              onChange('');
              setOpen(false);
            }}
          />
        ) : (
          <Search className="size-3 shrink-0 text-[#94A3B8]" />
        )}
      </button>

      {open ? (
        <div className="absolute left-0 z-50 mt-1.5 w-60 rounded-xl border border-[#E2E8E5] bg-white p-2 shadow-xl">
          <div className="relative mb-1.5">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-[#94A3B8]" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${label.toLowerCase()}...`}
              className="h-8 w-full rounded-lg border border-[#E2E8E5] bg-[#F8FAF9] pr-2 pl-8 text-xs text-[#142D25] outline-none focus:border-[#123D32]"
              autoFocus
            />
          </div>
          <div className="max-h-52 overflow-y-auto">
            <button
              type="button"
              onClick={() => {
                onChange('');
                setQuery('');
                setOpen(false);
              }}
              className={cn(
                'flex w-full items-center rounded-lg px-2.5 py-1.5 text-left text-xs transition',
                !value ? 'bg-[#E8F1EC] font-semibold text-[#123D32]' : 'text-[#475569] hover:bg-slate-50',
              )}
            >
              {placeholder}
            </button>
            {filtered.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(String(opt.value));
                  setQuery('');
                  setOpen(false);
                }}
                className={cn(
                  'flex w-full items-center rounded-lg px-2.5 py-1.5 text-left text-xs transition',
                  String(value) === String(opt.value)
                    ? 'bg-[#E8F1EC] font-semibold text-[#123D32]'
                    : 'text-[#142D25] hover:bg-slate-50',
                )}
              >
                <span className="truncate">{opt.label}</span>
              </button>
            ))}
            {filtered.length === 0 ? (
              <p className="px-2.5 py-2 text-center text-xs text-[#94A3B8]">No matching options</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function GlobalDashboardFilters({
  filters,
  onApply,
  onReset,
  onRefresh,
  onExportCsv,
  refreshing = false,
  lastSyncedAt = null,
  showDepartment = true,
  showEmployee = true,
  showBranch = true,
  extraFilters = null,
  storageKey = 'qb_dashboard_filters',
}) {
  const [draft, setDraft] = React.useState(() => ({
    preset: filters?.preset || 'this_month',
    fromDate: filters?.fromDate || '',
    toDate: filters?.toDate || '',
    departmentId: filters?.departmentId || '',
    employeeId: filters?.employeeId || '',
    branchId: filters?.branchId || '',
  }));

  const [departments, setDepartments] = React.useState([]);
  const [employees, setEmployees] = React.useState([]);
  const [branches, setBranches] = React.useState([]);

  React.useEffect(() => {
    if (filters) {
      setDraft((prev) => ({ ...prev, ...filters }));
    }
  }, [filters]);

  React.useEffect(() => {
    let active = true;
    async function loadOptions() {
      const [deptRes, empRes, branchRes] = await Promise.allSettled([
        showDepartment ? api.get('/departments', { params: { limit: 200 } }) : Promise.resolve(null),
        showEmployee ? api.get('/employees', { params: { limit: 500, status: 'ACTIVE' } }) : Promise.resolve(null),
        showBranch ? api.get('/admin/dashboard/offices') : Promise.resolve(null),
      ]);
      if (!active) return;

      if (deptRes.status === 'fulfilled' && deptRes.value) {
        const list = deptRes.value?.data?.items || deptRes.value?.data || deptRes.value?.items || deptRes.value || [];
        if (Array.isArray(list)) {
          setDepartments(list.map((d) => ({ value: String(d.id), label: d.name })));
        }
      }
      if (empRes.status === 'fulfilled' && empRes.value) {
        const list = empRes.value?.data?.items || empRes.value?.data || empRes.value?.items || empRes.value || [];
        if (Array.isArray(list)) {
          setEmployees(
            list.map((e) => ({
              value: String(e.id),
              label: `${e.firstName || ''} ${e.lastName || ''}`.trim() || e.email || `EMP-${e.id}`,
              departmentId: e.departmentId ? String(e.departmentId) : '',
            })),
          );
        }
      }
      if (branchRes.status === 'fulfilled' && branchRes.value) {
        const list = branchRes.value?.data || branchRes.value || [];
        if (Array.isArray(list)) {
          setBranches(
            list
              .filter((b) => b.id && String(b.id) !== 'all')
              .map((b) => ({ value: String(b.id), label: b.name })),
          );
        }
      }
    }
    loadOptions();
    return () => {
      active = false;
    };
  }, [showDepartment, showEmployee, showBranch]);

  const scopedEmployees = React.useMemo(() => {
    if (!draft.departmentId) return employees;
    return employees.filter((e) => e.departmentId === String(draft.departmentId));
  }, [employees, draft.departmentId]);

  const handlePresetChange = (presetId) => {
    const resolved = resolvePresetRange(presetId, draft.fromDate, draft.toDate);
    const next = { ...draft, preset: presetId, ...resolved };
    setDraft(next);
    if (presetId !== 'custom') {
      try {
        window.sessionStorage?.setItem(storageKey, JSON.stringify(next));
      } catch {}
      onApply?.(next);
    }
  };

  const handleApply = () => {
    try {
      window.sessionStorage?.setItem(storageKey, JSON.stringify(draft));
    } catch {}
    onApply?.(draft);
  };

  const handleReset = () => {
    const defaultRange = resolvePresetRange('this_month');
    const resetState = {
      preset: 'this_month',
      ...defaultRange,
      departmentId: '',
      employeeId: '',
      branchId: '',
    };
    setDraft(resetState);
    try {
      window.sessionStorage?.removeItem(storageKey);
    } catch {}
    onReset ? onReset(resetState) : onApply?.(resetState);
  };

  const activeRangeLabel =
    filters?.preset === 'all_time' || (!filters?.fromDate && !filters?.toDate)
      ? 'All Time (IST)'
      : filters?.fromDate === filters?.toDate
        ? `${formatReadableDate(filters.fromDate)} (IST)`
        : `${formatReadableDate(filters?.fromDate || '...')} – ${formatReadableDate(filters?.toDate || '...')} (IST)`;

  return (
    <div className="rounded-2xl border border-[#E2E8E5] bg-white p-3.5 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-1.5 rounded-xl bg-[#E8F1EC] px-2.5 py-1.5 text-xs font-semibold text-[#123D32]">
            <Filter className="size-3.5" />
            <span>Filters</span>
          </div>

          <div className="relative">
            <Calendar className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-[#64748B]" />
            <select
              aria-label="Date range preset"
              value={draft.preset}
              onChange={(e) => handlePresetChange(e.target.value)}
              className="h-9 rounded-xl border border-[#E2E8E5] bg-white pr-7 pl-8 text-xs font-semibold text-[#142D25] outline-none focus:border-[#123D32]"
            >
              {DATE_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {draft.preset === 'custom' ? (
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                aria-label="From date"
                value={draft.fromDate}
                onChange={(e) => setDraft((p) => ({ ...p, fromDate: e.target.value }))}
                className="h-9 rounded-xl border border-[#E2E8E5] bg-white px-2.5 text-xs text-[#142D25] outline-none focus:border-[#123D32]"
              />
              <span className="text-xs text-[#64748B]">to</span>
              <input
                type="date"
                aria-label="To date"
                value={draft.toDate}
                onChange={(e) => setDraft((p) => ({ ...p, toDate: e.target.value }))}
                className="h-9 rounded-xl border border-[#E2E8E5] bg-white px-2.5 text-xs text-[#142D25] outline-none focus:border-[#123D32]"
              />
            </div>
          ) : null}

          {showDepartment && departments.length > 0 ? (
            <SearchableSelect
              label="Dept"
              value={draft.departmentId}
              onChange={(val) =>
                setDraft((p) => ({
                  ...p,
                  departmentId: val,
                  employeeId: val ? '' : p.employeeId,
                }))
              }
              options={departments}
              placeholder="All Departments"
            />
          ) : null}

          {showEmployee && scopedEmployees.length > 0 ? (
            <SearchableSelect
              label="Employee"
              value={draft.employeeId}
              onChange={(val) => setDraft((p) => ({ ...p, employeeId: val }))}
              options={scopedEmployees}
              placeholder="All Employees"
            />
          ) : null}

          {showBranch && branches.length > 0 ? (
            <SearchableSelect
              label="Branch"
              value={draft.branchId}
              onChange={(val) => setDraft((p) => ({ ...p, branchId: val }))}
              options={branches}
              placeholder="All Branches"
            />
          ) : null}

          {extraFilters}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleApply}
            className="h-9 rounded-xl bg-[#123D32] px-3.5 text-xs font-semibold text-white transition hover:bg-[#176B50]"
          >
            Apply Filters
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#E2E8E5] bg-white px-3 text-xs font-semibold text-[#475569] transition hover:bg-slate-50"
          >
            <RotateCcw className="size-3.5" />
            Reset
          </button>
          {onRefresh ? (
            <button
              type="button"
              onClick={onRefresh}
              disabled={refreshing}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#E2E8E5] bg-white px-3 text-xs font-semibold text-[#123D32] transition hover:bg-[#F3F8F5] disabled:opacity-60"
            >
              <RotateCw className={cn('size-3.5', refreshing && 'animate-spin')} />
              Refresh
            </button>
          ) : null}
          {onExportCsv ? (
            <button
              type="button"
              onClick={onExportCsv}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#E2E8E5] bg-white px-3 text-xs font-semibold text-[#142D25] transition hover:bg-[#F3F8F5]"
            >
              <Download className="size-3.5" />
              Export CSV
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-[#F1F5F9] pt-2 text-[11px] text-[#64748B]">
        <span>
          Active Period: <strong className="text-[#142D25]">{activeRangeLabel}</strong>
        </span>
        {lastSyncedAt ? (
          <span>
            Last synced:{' '}
            <strong className="text-[#123D32]">
              {new Date(lastSyncedAt).toLocaleTimeString('en-IN', {
                timeZone: BUSINESS_TIMEZONE,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </strong>
          </span>
        ) : null}
      </div>
    </div>
  );
}
