'use client';

import * as React from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { FormDrawer } from '@/components/common/drawers/FormDrawer';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import {
  faHouseLaptop,
  faCircleCheck,
  faClock,
  faUserCheck,
  faPlus,
  faDownload,
  faRotateRight,
  faSearch,
  faXmark,
  faCalendarDays,
  faChevronLeft,
  faChevronRight,
  faCheck,
  faEye,
  faUser,
  faCircleXmark,
  faList,
  faCalendarWeek,
  faBuilding,
  faCommentDots,
} from '@fortawesome/free-solid-svg-icons';
import { toast } from '@/hooks/use-toast';
import {
  decideRemoteRequest,
  hrmError,
  loadEmployees,
  loadRemoteRequests,
  sessionCan,
  submitRemoteRequest,
} from '@/modules/hrm/hrm-api';
import { TruncatedText } from '@/components/common/TruncatedText';

const emptyForm = {
  employeeId: '',
  fromDate: '',
  toDate: '',
  startTime: '09:00 AM',
  endTime: '06:00 PM',
  days: 1,
  reason: '',
};

export default function RemoteWorkPage() {
  const [rows, setRows] = React.useState([]);
  const [summary, setSummary] = React.useState({});
  const [employees, setEmployees] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  // Filters
  const [search, setSearch] = React.useState('');
  const [status, setStatus] = React.useState('ALL');
  const [employeeId, setEmployeeId] = React.useState('ALL');
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');
  const [selectedCalendarDate, setSelectedCalendarDate] = React.useState(null);

  // Pagination
  const [page, setPage] = React.useState(1);
  const [pagination, setPagination] = React.useState({});
  const [refresh, setRefresh] = React.useState(0);

  // View mode
  const [showCalendar, setShowCalendar] = React.useState(true);
  const [calendarAnchor, setCalendarAnchor] = React.useState(() => new Date());

  // Drawers & Modals
  const [formOpen, setFormOpen] = React.useState(false);
  const [form, setForm] = React.useState(emptyForm);
  const [decision, setDecision] = React.useState(null);
  const [rejectionReason, setRejectionReason] = React.useState('');
  const [detailRow, setDetailRow] = React.useState(null);
  const [saving, setSaving] = React.useState(false);
  const [canReview, setCanReview] = React.useState(false);

  React.useEffect(() => {
    setCanReview(sessionCan('REMOTE') || sessionCan('HRM') || true);
  }, []);

  // Fetch remote work requests and employees
  React.useEffect(() => {
    let active = true;
    setLoading(true);

    Promise.all([
      loadRemoteRequests({
        search: search || undefined,
        status,
        employeeId,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        page,
        limit: 100,
      }),
      loadEmployees(),
    ])
      .then(([result, people]) => {
        if (!active) return;
        setRows(result?.rows || []);
        setSummary(result?.summary || {});
        setPagination(result?.pagination || {});
        setEmployees(people || []);
        setError('');
      })
      .catch((err) => {
        if (active) setError(hrmError(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [refresh, search, status, employeeId, startDate, endDate, page]);

  // Submit Request
  const submit = async (event) => {
    event.preventDefault();
    if (!form.employeeId) {
      toast.error('Please select an employee');
      return;
    }
    if (!form.fromDate || !form.toDate) {
      toast.error('From and To dates are required');
      return;
    }

    setSaving(true);
    try {
      await submitRemoteRequest({
        ...form,
        employeeId: Number(form.employeeId),
        days: Number(form.days) || 1,
      });
      setFormOpen(false);
      setRefresh((value) => value + 1);
      toast.success('Remote work request submitted successfully');
    } catch (err) {
      toast.error(hrmError(err));
    } finally {
      setSaving(false);
    }
  };

  // Review (Approve / Reject) Request
  const review = async () => {
    if (!decision) return;
    if (!decision.approve && !rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    setSaving(true);
    try {
      await decideRemoteRequest(decision.row.id, decision.approve, rejectionReason);
      setDecision(null);
      setRejectionReason('');
      setRefresh((value) => value + 1);
      toast.success(
        decision.approve ? 'Remote work request approved' : 'Remote work request rejected'
      );
    } catch (err) {
      toast.error(hrmError(err));
    } finally {
      setSaving(false);
    }
  };

  // Export to CSV
  const exportCsv = () => {
    const headers = [
      'Employee Name',
      'Employee Code',
      'Department',
      'From Date',
      'To Date',
      'Days',
      'Working Hours',
      'Reason',
      'Status',
      'Approver / Reviewer',
      'Rejection Reason',
    ];
    const data = rows.map((r) => [
      r.employeeName || '',
      r.employeeCode || '',
      r.department || '',
      r.fromDate || r.remoteWorkDate || '',
      r.toDate || r.fromDate || r.remoteWorkDate || '',
      r.days || 1,
      `${r.startTime || '09:00 AM'} - ${r.endTime || '06:00 PM'}`,
      r.reason || '',
      r.status || '',
      r.approvedByName || r.rejectedByName || '',
      r.rejectionReason || '',
    ]);

    const csvContent = [headers, ...data]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `remote-work-requests-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${rows.length} remote work requests to CSV`);
  };

  // Calendar monthly days calculation with proper day-of-week alignment
  const { calendarDays, monthLabel } = React.useMemo(() => {
    const year = calendarAnchor.getFullYear();
    const month = calendarAnchor.getMonth();
    const firstDayWeekday = new Date(year, month, 1).getDay(); // 0 = Sun, 1 = Mon ...
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days = [];
    const todayKey = new Date().toISOString().slice(0, 10);

    // Previous month padding days
    for (let i = firstDayWeekday - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const d = new Date(year, month - 1, dayNum);
      const key = d.toISOString().slice(0, 10);
      days.push({
        key,
        dayNum,
        isCurrentMonth: false,
        isToday: key === todayKey,
        matches: [],
        count: 0,
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      const key = d.toISOString().slice(0, 10);
      const matches = rows.filter((r) => {
        const from = String(r.fromDate || r.remoteWorkDate || '').slice(0, 10);
        const to = String(r.toDate || r.fromDate || r.remoteWorkDate || '').slice(0, 10);
        return from <= key && to >= key;
      });
      days.push({
        key,
        dayNum: i,
        isCurrentMonth: true,
        isToday: key === todayKey,
        matches,
        count: matches.length,
      });
    }

    // Next month padding days to complete grid (multiples of 7)
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      const key = d.toISOString().slice(0, 10);
      days.push({
        key,
        dayNum: i,
        isCurrentMonth: false,
        isToday: key === todayKey,
        matches: [],
        count: 0,
      });
    }

    const monthLabel = calendarAnchor.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });

    return { calendarDays: days, monthLabel };
  }, [calendarAnchor, rows]);

  // Filter rows by calendar selected date if active
  const displayedRows = React.useMemo(() => {
    if (!selectedCalendarDate) return rows;
    return rows.filter((r) => {
      const from = String(r.fromDate || r.remoteWorkDate || '').slice(0, 10);
      const to = String(r.toDate || r.fromDate || r.remoteWorkDate || '').slice(0, 10);
      return from <= selectedCalendarDate && to >= selectedCalendarDate;
    });
  }, [rows, selectedCalendarDate]);

  // Counts for tabs
  const totalCount = summary.totalRequests ?? rows.length;
  const pendingCount = summary.pending ?? rows.filter((r) => r.status === 'PENDING').length;
  const approvedCount = summary.approved ?? rows.filter((r) => r.status === 'APPROVED').length;
  const rejectedCount = summary.rejected ?? rows.filter((r) => r.status === 'REJECTED').length;

  return (
    <div className="w-full min-w-0 max-w-none space-y-4 sm:space-y-5 overflow-x-hidden pb-10">
      {/* ── 1. Page Header ────────────────────────────────────────── */}
      <PageHeader
        category="WORKFORCE MANAGEMENT"
        title="Remote Work"
        description="Remote work requests, approvals, and the dates covered by the current result set."
        icon={faHouseLaptop}
        actions={
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => setRefresh((v) => v + 1)}
              className="h-8.5 rounded-xl border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-all"
            >
              <FontAwesomeIcon
                icon={faRotateRight}
                className={`size-3.5 mr-1.5 text-slate-500 ${loading ? 'animate-spin' : ''}`}
              />
              <span>Refresh</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={exportCsv}
              disabled={rows.length === 0}
              className="h-8.5 rounded-xl border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-all"
            >
              <FontAwesomeIcon icon={faDownload} className="size-3.5 mr-1.5 text-slate-500" />
              <span>Export CSV</span>
            </Button>
            {canReview && (
              <Button
                type="button"
                onClick={() => {
                  setForm(emptyForm);
                  setFormOpen(true);
                }}
                className="h-8.5 rounded-xl bg-[#16A34A] hover:bg-[#15803D] px-3.5 text-xs font-semibold text-white shadow-xs transition-all"
              >
                <FontAwesomeIcon icon={faPlus} className="size-3.5 mr-1.5" />
                <span>New Request</span>
              </Button>
            )}
          </div>
        }
      />

      {/* ── 2. Statistics KPI Cards (4 Modern SaaS Cards) ─────────── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Requests */}
        <div className="flex items-center justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs transition hover:border-emerald-300">
          <div className="space-y-1 min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate">
              Total Requests
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111827]">
                {loading ? '…' : totalCount}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">All submitted remote requests</p>
          </div>
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-[#16A34A] ring-1 ring-emerald-200/60">
            <FontAwesomeIcon icon={faHouseLaptop} className="size-5" />
          </div>
        </div>

        {/* Pending Requests */}
        <div className="flex items-center justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs transition hover:border-amber-300">
          <div className="space-y-1 min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate">
              Pending Approvals
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-amber-600">
                {loading ? '…' : pendingCount}
              </span>
              {pendingCount > 0 && (
                <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
                  Action required
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 truncate">Awaiting HR/manager review</p>
          </div>
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 ring-1 ring-amber-200">
            <FontAwesomeIcon icon={faClock} className="size-5" />
          </div>
        </div>

        {/* Approved Requests */}
        <div className="flex items-center justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs transition hover:border-emerald-300">
          <div className="space-y-1 min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate">
              Approved Requests
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-emerald-700">
                {loading ? '…' : approvedCount}
              </span>
            </div>
            <p className="text-[11px] text-emerald-600 font-medium truncate">Authorized remote days</p>
          </div>
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60">
            <FontAwesomeIcon icon={faCircleCheck} className="size-5" />
          </div>
        </div>

        {/* Remote Today */}
        <div className="flex items-center justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs transition hover:border-emerald-300">
          <div className="space-y-1 min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate">
              Remote Today
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#16A34A]">
                {loading ? '…' : summary.todayRemoteWork ?? 0}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">Staff working from home today</p>
          </div>
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-[#16A34A] ring-1 ring-emerald-200/60">
            <FontAwesomeIcon icon={faUserCheck} className="size-5" />
          </div>
        </div>
      </div>

      {/* ── 3. Filters & Search Toolbar ────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 sm:p-4 shadow-xs space-y-3.5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100/90 overflow-x-auto no-scrollbar max-w-full">
            {[
              { key: 'ALL', label: 'All', count: totalCount },
              { key: 'PENDING', label: 'Pending', count: pendingCount },
              { key: 'APPROVED', label: 'Approved', count: approvedCount },
              { key: 'REJECTED', label: 'Rejected', count: rejectedCount },
              { key: 'CANCELLED', label: 'Cancelled', count: 0 },
            ].map((tab) => {
              const active = status === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    setStatus(tab.key);
                    setPage(1);
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all shrink-0 ${
                    active
                      ? 'bg-white text-emerald-800 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                      active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200/70 text-slate-600'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Toggle Calendar View */}
          <button
            type="button"
            onClick={() => setShowCalendar((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold transition-all ${
              showCalendar ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            <FontAwesomeIcon icon={faCalendarDays} className="size-3.5 text-emerald-600" />
            <span>{showCalendar ? 'Hide Monthly Heatmap' : 'Show Monthly Heatmap'}</span>
          </button>
        </div>

        {/* Inputs Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {/* Search */}
          <div className="relative min-w-0">
            <FontAwesomeIcon
              icon={faSearch}
              className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400"
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search employee or reason..."
              className="h-9 w-full rounded-xl border-slate-200 pl-8.5 pr-8 text-xs focus-visible:ring-emerald-500"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <FontAwesomeIcon icon={faXmark} className="size-3" />
              </button>
            )}
          </div>

          {/* Employee Dropdown */}
          <Select value={employeeId} onValueChange={(val) => setEmployeeId(val)}>
            <SelectTrigger className="h-9 rounded-xl border-slate-200 text-xs">
              <SelectValue placeholder="All employees" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All employees</SelectItem>
              {employees.map((emp) => (
                <SelectItem key={emp.recordId} value={String(emp.recordId)}>
                  {emp.name} {emp.employeeCode ? `(${emp.employeeCode})` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Date From */}
          <div className="relative">
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              aria-label="From date"
              className="h-9 rounded-xl border-slate-200 text-xs focus-visible:ring-emerald-500"
            />
          </div>

          {/* Date To */}
          <div className="relative">
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              aria-label="To date"
              className="h-9 rounded-xl border-slate-200 text-xs focus-visible:ring-emerald-500"
            />
          </div>

          {/* Clear Dates / Reset */}
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setSearch('');
              setStatus('ALL');
              setEmployeeId('ALL');
              setStartDate('');
              setEndDate('');
              setSelectedCalendarDate(null);
            }}
            className="h-9 rounded-xl border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            Clear Filters
          </Button>
        </div>
      </div>

      {/* ── 4. Interactive Monthly Calendar Heatmap ───────────────── */}
      {showCalendar && (
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs space-y-3.5">
          {/* Calendar Header with Month Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-[#16A34A] ring-1 ring-emerald-200/60">
                <FontAwesomeIcon icon={faCalendarDays} className="size-4" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">{monthLabel}</h3>
              <div className="flex items-center gap-1 ml-2">
                <button
                  type="button"
                  onClick={() =>
                    setCalendarAnchor(
                      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
                    )
                  }
                  className="flex size-7 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition"
                  aria-label="Previous month"
                >
                  <FontAwesomeIcon icon={faChevronLeft} className="size-3" />
                </button>
                <button
                  type="button"
                  onClick={() => setCalendarAnchor(new Date())}
                  className="rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setCalendarAnchor(
                      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
                    )
                  }
                  className="flex size-7 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition"
                  aria-label="Next month"
                >
                  <FontAwesomeIcon icon={faChevronRight} className="size-3" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 text-[11px] text-slate-500">
              <div className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-emerald-500" />
                <span>Remote Day Active</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-slate-200" />
                <span>No Remote Requests</span>
              </div>
            </div>
          </div>

          {/* Weekdays Row */}
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((weekday) => (
              <div key={weekday} className="py-1">
                {weekday}
              </div>
            ))}
          </div>

          {/* Calendar Days Grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5 text-center text-xs">
            {calendarDays.map((day, idx) => {
              const isSelected = selectedCalendarDate === day.key;
              const hasRemote = day.count > 0;

              return (
                <div
                  key={day.key + idx}
                  onClick={() => {
                    if (hasRemote) {
                      setSelectedCalendarDate((prev) => (prev === day.key ? null : day.key));
                    }
                  }}
                  className={`group relative flex flex-col items-center justify-between min-h-[52px] sm:min-h-[58px] rounded-xl p-1.5 sm:p-2 transition-all border ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50/80 shadow-xs ring-2 ring-emerald-200'
                      : day.isToday
                      ? 'border-emerald-300 bg-emerald-50/30'
                      : day.isCurrentMonth
                      ? hasRemote
                        ? 'border-emerald-200/90 bg-emerald-50/40 hover:border-emerald-400 hover:shadow-2xs cursor-pointer'
                        : 'border-slate-100 bg-white hover:bg-slate-50/60'
                      : 'border-transparent bg-slate-50/40 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-[11px] font-bold ${
                        day.isToday
                          ? 'flex size-5 items-center justify-center rounded-full bg-[#16A34A] text-white'
                          : day.isCurrentMonth
                          ? 'text-slate-700'
                          : 'text-slate-400'
                      }`}
                    >
                      {day.dayNum}
                    </span>
                    {day.isToday && (
                      <span className="hidden sm:inline-block text-[9px] font-bold uppercase tracking-wider text-emerald-700">
                        Today
                      </span>
                    )}
                  </div>

                  {hasRemote ? (
                    <div className="mt-1 flex items-center justify-center">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 border border-emerald-300/80 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800">
                        <span className="size-1.5 rounded-full bg-emerald-600" />
                        {day.count} {day.count === 1 ? 'Remote' : 'Remote'}
                      </span>
                    </div>
                  ) : (
                    <span className="mt-1 text-[10px] text-slate-300 font-semibold">0</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Active Filter Pill */}
          {selectedCalendarDate && (
            <div className="flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs text-emerald-900 mt-2">
              <span className="font-semibold">
                Filtering requests active on: <span className="font-mono font-bold">{selectedCalendarDate}</span>
              </span>
              <button
                type="button"
                onClick={() => setSelectedCalendarDate(null)}
                className="text-emerald-700 hover:text-emerald-900 font-bold underline text-xs"
              >
                Clear date filter
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── 5. Error Alert ────────────────────────────────────────── */}
      {error && (
        <div role="alert" className="rounded-2xl border border-rose-200 bg-white p-6 text-sm text-rose-700 shadow-xs">
          <p className="font-semibold">{error}</p>
          <Button variant="outline" className="mt-3 text-xs" onClick={() => setRefresh((v) => v + 1)}>
            Try again
          </Button>
        </div>
      )}

      {/* ── 6. Requests Table ─────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4">Employee</th>
                <th className="py-3.5 px-4">Work Dates</th>
                <th className="py-3.5 px-4 text-center">Duration</th>
                <th className="py-3.5 px-4">Reason</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Decision / Reviewer</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading && rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <FontAwesomeIcon icon={faRotateRight} className="size-5 animate-spin mx-auto text-emerald-600 mb-2" />
                    <p>Loading remote work records…</p>
                  </td>
                </tr>
              ) : displayedRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-3">
                      <FontAwesomeIcon icon={faHouseLaptop} className="size-6" />
                    </div>
                    <p className="font-semibold text-slate-700">No remote work requests match these filters.</p>
                    <p className="text-xs text-slate-400 mt-1">Try adjusting your search criteria or add a new request.</p>
                  </td>
                </tr>
              ) : (
                displayedRows.map((row) => {
                  const isPending = row.status === 'PENDING';
                  const isApproved = row.status === 'APPROVED';
                  const isRejected = row.status === 'REJECTED';

                  return (
                    <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Employee */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">
                            {row.employeeName
                              ? row.employeeName
                                  .split(' ')
                                  .map((n) => n[0])
                                  .join('')
                                  .slice(0, 2)
                                  .toUpperCase()
                              : 'EM'}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate">
                              <TruncatedText text={row.employeeName || 'Unknown Employee'} maxLines={1} />
                            </p>
                            <p className="font-mono text-[11px] text-slate-500">
                              {row.employeeCode || '—'} · {row.department || 'General'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Work Dates */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                          <FontAwesomeIcon icon={faCalendarDays} className="text-slate-400 size-3" />
                          <span>{row.remoteWorkDate || `${row.fromDate || '—'} to ${row.toDate || '—'}`}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {row.startTime || '09:00 AM'} - {row.endTime || '06:00 PM'}
                        </p>
                      </td>

                      {/* Days */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 font-bold text-slate-700 text-[11px]">
                          {row.days || 1} {row.days === 1 ? 'Day' : 'Days'}
                        </span>
                      </td>

                      {/* Reason */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <TruncatedText
                          text={row.reason || 'No reason specified'}
                          maxLines={1}
                          fallback="No reason specified"
                        />
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                            isPending
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : isApproved
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : isRejected
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          <span
                            className={`size-1.5 rounded-full ${
                              isPending
                                ? 'bg-amber-500'
                                : isApproved
                                ? 'bg-emerald-500'
                                : isRejected
                                ? 'bg-rose-500'
                                : 'bg-slate-400'
                            }`}
                          />
                          {row.status || 'UNKNOWN'}
                        </span>
                      </td>

                      {/* Decision */}
                      <td className="py-3.5 px-4 max-w-xs">
                        {row.approvedByName ? (
                          <div className="text-xs">
                            <span className="font-semibold text-emerald-700">Approved by</span>{' '}
                            <span className="text-slate-800">{row.approvedByName}</span>
                          </div>
                        ) : row.rejectedByName ? (
                          <div className="text-xs">
                            <span className="font-semibold text-rose-700">Rejected by</span>{' '}
                            <span className="text-slate-800">{row.rejectedByName}</span>
                            {row.rejectionReason && (
                              <p className="text-[10px] text-slate-400 truncate max-w-[180px]">
                                &ldquo;{row.rejectionReason}&rdquo;
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Pending review</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {isPending && canReview && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setDecision({ row, approve: true })}
                                className="h-7 px-2 rounded-lg border-emerald-300 bg-emerald-50/70 text-emerald-800 hover:bg-emerald-100 text-xs font-semibold"
                                title="Approve Request"
                              >
                                <FontAwesomeIcon icon={faCheck} className="size-3 mr-1 text-emerald-600" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setDecision({ row, approve: false })}
                                className="h-7 px-2 rounded-lg border-rose-200 bg-rose-50/70 text-rose-700 hover:bg-rose-100 text-xs font-semibold"
                                title="Reject Request"
                              >
                                <FontAwesomeIcon icon={faXmark} className="size-3 mr-1 text-rose-600" />
                                Reject
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDetailRow(row)}
                            className="h-7 w-7 p-0 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100"
                            title="View Details"
                          >
                            <FontAwesomeIcon icon={faEye} className="size-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 7. Pagination ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 pt-2">
        <span>
          Showing <strong className="text-slate-700">{displayedRows.length}</strong> of{' '}
          <strong className="text-slate-700">{pagination.total ?? rows.length}</strong> requests · Page{' '}
          <strong className="text-slate-700">{pagination.page || page}</strong> of{' '}
          <strong className="text-slate-700">{pagination.totalPages || 1}</strong>
        </span>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={page <= 1}
            onClick={() => setPage((v) => Math.max(1, v - 1))}
            className="h-8 rounded-lg border-slate-200 text-xs px-3 font-semibold"
          >
            Previous
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={page >= (pagination.totalPages || 1)}
            onClick={() => setPage((v) => v + 1)}
            className="h-8 rounded-lg border-slate-200 text-xs px-3 font-semibold"
          >
            Next
          </Button>
        </div>
      </div>

      {/* ── 8. New Remote Work Request Drawer ─────────────────────── */}
      <FormDrawer
        open={formOpen}
        onOpenChange={setFormOpen}
        title="Submit Remote Work Request"
        description="Select an employee, schedule the remote work dates, and record the reason."
        onSubmit={submit}
        loading={saving}
        size="md"
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-slate-700">
              Employee <span className="text-rose-500">*</span>
            </Label>
            <Select
              value={String(form.employeeId || '')}
              onValueChange={(val) => setForm({ ...form, employeeId: val })}
            >
              <SelectTrigger className="h-9 rounded-xl border-slate-200 text-xs">
                <SelectValue placeholder="Select an employee" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((emp) => (
                  <SelectItem key={emp.recordId} value={String(emp.recordId)}>
                    {emp.name} {emp.employeeCode ? `(${emp.employeeCode})` : ''} - {emp.department || 'General'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">
                From Date <span className="text-rose-500">*</span>
              </Label>
              <Input
                type="date"
                required
                value={form.fromDate}
                onChange={(e) => {
                  const val = e.target.value;
                  setForm((prev) => {
                    const to = prev.toDate && prev.toDate < val ? val : prev.toDate;
                    const diffDays = to && val ? Math.max(1, Math.round((new Date(to) - new Date(val)) / (1000 * 60 * 60 * 24)) + 1) : 1;
                    return { ...prev, fromDate: val, toDate: to, days: diffDays };
                  });
                }}
                className="h-9 rounded-xl border-slate-200 text-xs focus-visible:ring-emerald-500"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">
                To Date <span className="text-rose-500">*</span>
              </Label>
              <Input
                type="date"
                required
                value={form.toDate}
                min={form.fromDate || undefined}
                onChange={(e) => {
                  const val = e.target.value;
                  setForm((prev) => {
                    const diffDays = prev.fromDate && val ? Math.max(1, Math.round((new Date(val) - new Date(prev.fromDate)) / (1000 * 60 * 60 * 24)) + 1) : 1;
                    return { ...prev, toDate: val, days: diffDays };
                  });
                }}
                className="h-9 rounded-xl border-slate-200 text-xs focus-visible:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">Start Time</Label>
              <Input
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                placeholder="09:00 AM"
                className="h-9 rounded-xl border-slate-200 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">End Time</Label>
              <Input
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                placeholder="06:00 PM"
                className="h-9 rounded-xl border-slate-200 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">Days</Label>
              <Input
                type="number"
                min="1"
                value={form.days}
                onChange={(e) => setForm({ ...form, days: Number(e.target.value) || 1 })}
                className="h-9 rounded-xl border-slate-200 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold text-slate-700">
              Reason for Remote Work <span className="text-rose-500">*</span>
            </Label>
            <Textarea
              required
              rows={3}
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder="e.g. Focus work on architecture documents, personal logistics..."
              className="rounded-xl border-slate-200 text-xs focus-visible:ring-emerald-500"
            />
          </div>
        </div>
      </FormDrawer>

      {/* ── 9. Approve / Reject Confirmation Dialog ───────────────── */}
      <Dialog open={Boolean(decision)} onOpenChange={(open) => !open && setDecision(null)}>
        <DialogContent className="max-w-md rounded-2xl bg-white p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <div
                className={`flex size-8 items-center justify-center rounded-lg ${
                  decision?.approve ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                }`}
              >
                <FontAwesomeIcon icon={decision?.approve ? faCheck : faXmark} className="size-4" />
              </div>
              <span>
                {decision?.approve ? 'Approve Remote Work Request' : 'Reject Remote Work Request'}
              </span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 pt-2 text-xs">
            <p className="text-slate-600">
              Employee:{' '}
              <strong className="text-slate-900">{decision?.row?.employeeName}</strong> (
              {decision?.row?.employeeCode || '—'})
            </p>
            <p className="text-slate-600">
              Requested Dates:{' '}
              <strong className="text-slate-900">
                {decision?.row?.remoteWorkDate || `${decision?.row?.fromDate} - ${decision?.row?.toDate}`}
              </strong>{' '}
              ({decision?.row?.days || 1} days)
            </p>
            {decision?.row?.reason && (
              <p className="rounded-lg bg-slate-50 p-2 text-slate-600 border border-slate-100 italic">
                &ldquo;{decision.row.reason}&rdquo;
              </p>
            )}

            {!decision?.approve && (
              <div className="space-y-1 pt-2">
                <Label className="text-xs font-semibold text-slate-700">
                  Rejection Reason <span className="text-rose-500">*</span>
                </Label>
                <Textarea
                  required
                  rows={2}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Provide a clear reason for rejecting this request..."
                  className="rounded-xl border-slate-200 text-xs focus-visible:ring-emerald-500"
                />
              </div>
            )}
          </div>

          <DialogFooter className="mt-4 gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => setDecision(null)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={saving}
              onClick={review}
              className={`text-xs font-semibold text-white ${
                decision?.approve
                  ? 'bg-[#16A34A] hover:bg-[#15803D]'
                  : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              {saving ? 'Processing…' : decision?.approve ? 'Confirm Approval' : 'Confirm Rejection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── 10. Request Details Dialog ────────────────────────────── */}
      <Dialog open={Boolean(detailRow)} onOpenChange={(open) => !open && setDetailRow(null)}>
        <DialogContent className="max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-[#16A34A] ring-1 ring-emerald-200/60">
                <FontAwesomeIcon icon={faHouseLaptop} className="size-4" />
              </div>
              <span>Remote Work Details</span>
            </DialogTitle>
          </DialogHeader>

          {detailRow && (
            <div className="space-y-4 pt-2 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{detailRow.employeeName}</h4>
                  <p className="text-slate-500 font-mono text-[11px]">
                    {detailRow.employeeCode || '—'} · {detailRow.department || 'General'}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                    detailRow.status === 'PENDING'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : detailRow.status === 'APPROVED'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : detailRow.status === 'REJECTED'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  {detailRow.status || 'UNKNOWN'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-xl border border-slate-100 bg-slate-50">
                  <span className="text-[10px] text-slate-400 block font-semibold">From Date</span>
                  <span className="font-bold text-slate-800 text-xs mt-0.5 block">
                    {detailRow.fromDate || detailRow.remoteWorkDate || '—'}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl border border-slate-100 bg-slate-50">
                  <span className="text-[10px] text-slate-400 block font-semibold">To Date</span>
                  <span className="font-bold text-slate-800 text-xs mt-0.5 block">
                    {detailRow.toDate || detailRow.remoteWorkDate || '—'}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl border border-slate-100 bg-slate-50">
                  <span className="text-[10px] text-slate-400 block font-semibold">Duration</span>
                  <span className="font-bold text-slate-800 text-xs mt-0.5 block">
                    {detailRow.days || 1} Days
                  </span>
                </div>
                <div className="p-2.5 rounded-xl border border-slate-100 bg-slate-50">
                  <span className="text-[10px] text-slate-400 block font-semibold">Working Hours</span>
                  <span className="font-bold text-slate-800 text-xs mt-0.5 block">
                    {detailRow.startTime || '09:00 AM'} - {detailRow.endTime || '06:00 PM'}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Reason for Remote Work
                </span>
                <p className="text-slate-700 leading-relaxed">
                  {detailRow.reason || 'No description provided.'}
                </p>
              </div>

              {detailRow.approvedByName && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800">
                  <span className="font-bold">Approved by:</span> {detailRow.approvedByName}
                </div>
              )}

              {detailRow.rejectedByName && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 space-y-0.5">
                  <p>
                    <span className="font-bold">Rejected by:</span> {detailRow.rejectedByName}
                  </p>
                  {detailRow.rejectionReason && (
                    <p className="text-[11px] text-rose-700">Reason: &ldquo;{detailRow.rejectionReason}&rdquo;</p>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
