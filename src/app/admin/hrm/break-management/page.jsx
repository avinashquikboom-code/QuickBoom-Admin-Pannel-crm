'use client';

import * as React from 'react';
import {
  Coffee,
  Clock,
  AlertCircle,
  CheckCircle2,
  Search,
  RefreshCw,
  Download,
  ChevronLeft,
  ChevronRight,
  X,
  RotateCcw,
  User,
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/common/Select';
import { toast } from '@/hooks/use-toast';
import { hrmError, loadBreaks } from '@/modules/hrm/hrm-api';
import { HrmNotice } from '@/modules/hrm/HrmNotice';

function getTodayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getInitials(name) {
  if (!name) return 'EM';
  const parts = String(name).trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return String(name).slice(0, 2).toUpperCase();
}

export default function BreakManagementPage() {
  const todayStr = React.useMemo(() => getTodayString(), []);

  const [breaks, setBreaks] = React.useState([]);
  const [activeCount, setActiveCount] = React.useState(0);
  const [activeBreaks, setActiveBreaks] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [refresh, setRefresh] = React.useState(0);
  const [selectedDate, setSelectedDate] = React.useState(todayStr);

  // Filters
  const [search, setSearch] = React.useState('');
  const [selectedType, setSelectedType] = React.useState('all');
  const [selectedStatus, setSelectedStatus] = React.useState('all');

  // Pagination
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);

  // Load live breaks
  React.useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    loadBreaks(selectedDate)
      .then((result) => {
        if (!active) return;
        setBreaks(result.records || []);
        setActiveCount(result.active || 0);
        setActiveBreaks(result.activeBreaks || []);
      })
      .catch((err) => {
        if (!active) return;
        setError(hrmError(err));
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [refresh, selectedDate]);

  // Derived filtered records
  const filtered = React.useMemo(() => {
    return breaks.filter((b) => {
      const matchSearch =
        !search.trim() ||
        (b.employeeName && b.employeeName.toLowerCase().includes(search.toLowerCase())) ||
        (b.employeeId && b.employeeId.toLowerCase().includes(search.toLowerCase())) ||
        (b.department && b.department.toLowerCase().includes(search.toLowerCase()));

      const matchType = selectedType === 'all' || b.breakType === selectedType;

      const matchStatus =
        selectedStatus === 'all' ||
        (selectedStatus === 'active' && b.status === 'active') ||
        (selectedStatus === 'exceeded' && b.status === 'exceeded') ||
        (selectedStatus === 'completed' && b.status === 'completed');

      return matchSearch && matchType && matchStatus;
    });
  }, [breaks, search, selectedType, selectedStatus]);

  // Reset pagination on filter change
  React.useEffect(() => {
    setPage(1);
  }, [search, selectedType, selectedStatus, selectedDate]);

  // Derived metrics
  const overstayCount = React.useMemo(
    () => breaks.filter((b) => b.status === 'exceeded').length,
    [breaks]
  );

  const activeEmployeeLabel = React.useMemo(() => {
    if (activeBreaks.length > 0) {
      const first = activeBreaks[0];
      const dept = first.department ? ` (${first.department})` : '';
      return `${first.name || '1 Employee'}${dept}`;
    }
    const activeRec = breaks.find((b) => b.status === 'active');
    if (activeRec) {
      const dept = activeRec.department ? ` (${activeRec.department})` : '';
      return `${activeRec.employeeName}${dept}`;
    }
    return activeCount > 0 ? `${activeCount} currently active` : 'None currently on break';
  }, [activeBreaks, breaks, activeCount]);

  const hasActiveFilters = Boolean(search) || selectedType !== 'all' || selectedStatus !== 'all';

  const resetFilters = () => {
    setSearch('');
    setSelectedType('all');
    setSelectedStatus('all');
  };

  // Pagination bounds
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filtered.length);
  const currentRows = filtered.slice(startIndex, endIndex);

  // CSV Export handler
  const handleExport = () => {
    if (!filtered.length) {
      toast.error('No break records to export');
      return;
    }
    const headers = [
      'Employee Name',
      'Employee ID',
      'Department',
      'Break Type',
      'Start Time',
      'End Time',
      'Duration',
      'Policy Status',
      'Overstay (Minutes)',
    ];
    const rows = filtered.map((b) => [
      `"${(b.employeeName || '').replace(/"/g, '""')}"`,
      `"${(b.employeeId || '').replace(/"/g, '""')}"`,
      `"${(b.department || '').replace(/"/g, '""')}"`,
      `"${(b.breakType || '').replace(/"/g, '""')}"`,
      `"${(b.startTime || '').replace(/"/g, '""')}"`,
      `"${(b.endTime || (b.status === 'active' ? 'Active Now' : '')).replace(/"/g, '""')}"`,
      `"${(b.duration || '').replace(/"/g, '""')}"`,
      `"${(b.status === 'exceeded' ? 'Overstay' : b.status === 'active' ? 'Active Now' : 'Within Policy').replace(/"/g, '""')}"`,
      `"${b.overstayMinutes || 0}"`,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `break_management_${selectedDate || 'today'}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Break Report Exported', {
      description: `Exported ${filtered.length} records to CSV.`,
    });
  };

  return (
    <div className="w-full min-w-0 max-w-none space-y-5 sm:space-y-6 overflow-x-hidden">
      {/* ── 1. Top Controls Bar ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-[#107569] ring-1 ring-emerald-200/60">
            <Coffee className="size-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">Live Break Monitor</h2>
            <p className="text-xs text-slate-400">Real-time employee break compliance tracking</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRefresh((v) => v + 1)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl border-slate-200 text-xs font-semibold text-slate-600 hover:text-[#107569]"
          >
            <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>

          <Button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#107569] px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-[#0e6359]"
          >
            <Download className="size-3.5" />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      {/* ── 2. Page Header ──────────────────────────────────────────────────── */}
      <PageHeader
        category="WORKFORCE MANAGEMENT"
        title="Break & Interval Management"
        description="Monitor lunch and short break durations in compliance with workplace time policies."
      />

      {/* ── 3. Four Dashboard Statistics Cards (Strictly Primary Brand Theme) ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Active on Break Now */}
        <div className="group relative flex items-center justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md">
          <div className="space-y-1 min-w-0 pr-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Active On Break Now
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#163A2E]">
              {activeCount} {activeCount === 1 ? 'Employee' : 'Employees'}
            </p>
            <p className="text-xs font-medium text-emerald-700 truncate" title={activeEmployeeLabel}>
              {activeEmployeeLabel}
            </p>
          </div>
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60">
            <Coffee className="size-6" />
          </div>
        </div>

        {/* Standard Lunch Policy */}
        <div className="group relative flex items-center justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md">
          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Standard Lunch Policy
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              60 Minutes
            </p>
            <p className="text-xs text-slate-400">Default allocated midday window</p>
          </div>
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 ring-1 ring-slate-200/60">
            <Clock className="size-6" />
          </div>
        </div>

        {/* Policy Overstay Flags */}
        <div className="group relative flex items-center justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md">
          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Policy Overstay Flags
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-amber-700">
              {overstayCount} {overstayCount === 1 ? 'Flag' : 'Flags'} Today
            </p>
            <p className="text-xs text-amber-600 font-medium">
              {overstayCount > 0 ? 'Automatically flagged for review' : 'Zero violations recorded'}
            </p>
          </div>
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 ring-1 ring-amber-200/60">
            <AlertCircle className="size-6" />
          </div>
        </div>

        {/* Total Break Sessions */}
        <div className="group relative flex items-center justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md">
          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Logged Breaks
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#163A2E]">
              {breaks.length} {breaks.length === 1 ? 'Session' : 'Sessions'}
            </p>
            <p className="text-xs text-slate-400">All registered breaks today</p>
          </div>
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60">
            <CheckCircle2 className="size-6" />
          </div>
        </div>
      </div>

      {/* ── 4. Unified Filter Bar ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Left: Search + Date Selector */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 min-w-0">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[220px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by employee name, code, or department..."
                className="h-10 pl-9 pr-3 text-xs sm:text-sm rounded-xl border-slate-200 bg-slate-50/60 focus-visible:bg-white focus-visible:ring-[#107569] w-full"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {/* Date Navigator */}
            <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/70 p-1">
              <button
                type="button"
                onClick={() => {
                  const prev = new Date(selectedDate);
                  prev.setDate(prev.getDate() - 1);
                  setSelectedDate(prev.toISOString().split('T')[0]);
                }}
                className="flex size-8 items-center justify-center rounded-lg text-slate-500 hover:bg-white hover:text-[#107569] transition shadow-2xs"
                title="Previous Day"
              >
                <ChevronLeft className="size-4" />
              </button>

              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-[#163A2E] focus:outline-none focus:ring-1 focus:ring-[#107569]"
              />

              <button
                type="button"
                onClick={() => {
                  const next = new Date(selectedDate);
                  next.setDate(next.getDate() + 1);
                  setSelectedDate(next.toISOString().split('T')[0]);
                }}
                className="flex size-8 items-center justify-center rounded-lg text-slate-500 hover:bg-white hover:text-[#107569] transition shadow-2xs"
                title="Next Day"
              >
                <ChevronRight className="size-4" />
              </button>

              {selectedDate !== todayStr && (
                <button
                  type="button"
                  onClick={() => setSelectedDate(todayStr)}
                  className="h-8 rounded-lg border border-emerald-200/80 bg-emerald-50 px-2.5 text-[11px] font-bold text-[#107569] hover:bg-emerald-100 transition"
                >
                  Today
                </button>
              )}
            </div>
          </div>

          {/* Right: Dropdowns + Reset */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Break Type Filter */}
            <div className="w-full sm:w-44">
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="h-10 text-xs sm:text-sm rounded-xl border-slate-200 bg-slate-50/60 focus:ring-[#107569]">
                  <SelectValue placeholder="Break Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">
                    All Break Types
                  </SelectItem>
                  <SelectItem value="Lunch Break" className="text-xs">
                    Lunch Break
                  </SelectItem>
                  <SelectItem value="Coffee Break" className="text-xs">
                    Coffee Break
                  </SelectItem>
                  <SelectItem value="Personal Break" className="text-xs">
                    Personal Break
                  </SelectItem>
                  <SelectItem value="Recorded break" className="text-xs">
                    Recorded Break
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Compliance Filter */}
            <div className="w-full sm:w-40">
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="h-10 text-xs sm:text-sm rounded-xl border-slate-200 bg-slate-50/60 focus:ring-[#107569]">
                  <SelectValue placeholder="Policy Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">
                    All Compliance
                  </SelectItem>
                  <SelectItem value="active" className="text-xs">
                    Active Now
                  </SelectItem>
                  <SelectItem value="completed" className="text-xs">
                    Within Policy
                  </SelectItem>
                  <SelectItem value="exceeded" className="text-xs">
                    Overstay
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Reset Filters */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="h-10 rounded-xl px-2.5 text-xs text-slate-500 hover:text-slate-800"
                title="Reset filters"
              >
                <RotateCcw className="size-3.5 mr-1" />
                Reset
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ── 5. Main Table ────────────────────────────────────────────────────── */}
      <HrmNotice loading={loading} error={error} onRetry={() => setRefresh((v) => v + 1)} />

      {!loading && !error && (
        <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
          {filtered.length === 0 ? (
            <div className="p-16 text-center">
              <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-emerald-50 text-[#107569] ring-1 ring-emerald-200/60">
                <Coffee className="size-7" />
              </div>
              <h3 className="mt-4 text-base font-bold text-slate-800">No break logs recorded</h3>
              <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
                {hasActiveFilters
                  ? 'No employee break records match the specified filters.'
                  : 'Break sessions will appear here as employees punch in and out of breaks.'}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-[#E2E8E5] bg-[#F4F9F6] text-xs font-bold uppercase tracking-wider text-[#163A2E]">
                      <th className="py-3.5 pl-6 pr-4">Employee</th>
                      <th className="py-3.5 px-4">Break Type</th>
                      <th className="py-3.5 px-4">Start Time</th>
                      <th className="py-3.5 px-4">End Time</th>
                      <th className="py-3.5 px-4">Duration</th>
                      <th className="py-3.5 pl-4 pr-6 text-right">Policy Compliance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {currentRows.map((rec, index) => {
                      const initials = getInitials(rec.employeeName);
                      return (
                        <tr
                          key={rec.id || `break-${index}`}
                          className="transition-colors hover:bg-slate-50/70"
                        >
                          {/* Employee Info */}
                          <td className="py-3.5 pl-6 pr-4">
                            <div className="flex items-center gap-3">
                              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100/70 text-xs font-bold text-[#107569] ring-1 ring-emerald-200/60">
                                {initials}
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-slate-900 truncate">
                                  {rec.employeeName}
                                </p>
                                <p className="text-[11px] font-mono text-slate-400">
                                  {rec.employeeId} {rec.department ? `• ${rec.department}` : ''}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Break Type */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 border border-slate-200">
                              {rec.breakType}
                            </span>
                          </td>

                          {/* Start Time */}
                          <td className="py-3.5 px-4 whitespace-nowrap font-mono text-xs font-medium text-slate-800">
                            {rec.startTime || '—'}
                          </td>

                          {/* End Time */}
                          <td className="py-3.5 px-4 whitespace-nowrap font-mono text-xs">
                            {rec.endTime ? (
                              <span className="text-slate-800 font-medium">{rec.endTime}</span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-[#107569] border border-emerald-200/80 animate-pulse">
                                <span className="size-1.5 rounded-full bg-[#107569]" />
                                Active Now
                              </span>
                            )}
                          </td>

                          {/* Duration */}
                          <td className="py-3.5 px-4 whitespace-nowrap text-xs font-bold text-[#163A2E]">
                            {rec.duration || '0m'}
                          </td>

                          {/* Policy Compliance */}
                          <td className="py-3.5 pl-4 pr-6 text-right whitespace-nowrap">
                            {rec.status === 'exceeded' ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                                <AlertCircle className="size-3 text-amber-600" />
                                Overstay (+{rec.overstayMinutes}m)
                              </span>
                            ) : rec.status === 'active' ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                                <Clock className="size-3 text-emerald-600" />
                                Active Now
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                                <CheckCircle2 className="size-3 text-emerald-600" />
                                Within Policy
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Table Footer with Pagination */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200/90 px-6 py-3.5 bg-slate-50/50 text-xs text-slate-500">
                <div>
                  Showing{' '}
                  <span className="font-semibold text-slate-700">
                    {filtered.length > 0 ? startIndex + 1 : 0}
                  </span>{' '}
                  to <span className="font-semibold text-slate-700">{endIndex}</span> of{' '}
                  <span className="font-semibold text-slate-700">{filtered.length}</span> records
                </div>

                <div className="flex items-center gap-3">
                  {/* Rows per page */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500">Rows per page:</span>
                    <Select
                      value={String(pageSize)}
                      onValueChange={(val) => {
                        setPageSize(Number(val));
                        setPage(1);
                      }}
                    >
                      <SelectTrigger className="h-8 w-16 text-xs rounded-lg border-slate-200 bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Prev / Next buttons */}
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage <= 1}
                      className="h-8 px-2 rounded-lg border-slate-200 text-slate-600 hover:text-[#107569] disabled:opacity-40"
                    >
                      <ChevronLeft className="size-3.5" />
                      <span className="sr-only">Previous</span>
                    </Button>

                    <div className="flex items-center px-2 font-medium text-slate-700">
                      <span className="flex size-7 items-center justify-center rounded-lg bg-[#107569] text-white text-xs font-bold">
                        {currentPage}
                      </span>
                      <span className="mx-1 text-slate-400">/</span>
                      <span className="text-slate-600 font-semibold">{totalPages}</span>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage >= totalPages}
                      className="h-8 px-2 rounded-lg border-slate-200 text-slate-600 hover:text-[#107569] disabled:opacity-40"
                    >
                      <ChevronRight className="size-3.5" />
                      <span className="sr-only">Next</span>
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
