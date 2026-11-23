'use client';

import * as React from 'react';
import {
  CalendarCheck,
  Clock,
  Users,
  CheckCircle2,
  AlertCircle,
  CalendarX,
  RefreshCw,
  Download,
  Filter,
  Check,
  Calendar,
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/common/Button';
import { toast } from '@/hooks/use-toast';
import { hrmError, loadLiveDashboard, loadOvertime } from '@/modules/hrm/hrm-api';
import { HrmNotice } from '@/modules/hrm/HrmNotice';
import { AttendanceFilters } from '@/modules/hrm/components/attendance/AttendanceFilters';
import { AttendanceTable } from '@/modules/hrm/components/attendance/AttendanceTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/common/Select';

function getTodayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr).slice(0, 10);
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return String(dateStr).slice(0, 10);
  }
}

function getInitials(name) {
  if (!name) return 'EM';
  const parts = String(name).trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return String(name).slice(0, 2).toUpperCase();
}

export default function AttendancePage() {
  const todayStr = React.useMemo(() => getTodayString(), []);

  // View tab: 'attendance' | 'overtime'
  const [activeTab, setActiveTab] = React.useState('attendance');

  // Main Attendance data
  const [records, setRecords] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [refresh, setRefresh] = React.useState(0);
  const [selectedDate, setSelectedDate] = React.useState(todayStr);

  // Overtime data
  const [overtime, setOvertime] = React.useState([]);
  const [otType, setOtType] = React.useState('');
  const [otStatus, setOtStatus] = React.useState('');
  const [otSearch, setOtSearch] = React.useState('');

  // Attendance Filters
  const [search, setSearch] = React.useState('');
  const [selectedDept, setSelectedDept] = React.useState('All Departments');
  const [selectedStatus, setSelectedStatus] = React.useState('all');

  // Load live attendance & overtime
  React.useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    Promise.all([
      loadLiveDashboard(selectedDate),
      loadOvertime({
        limit: 50,
        overtimeType: otType || undefined,
        status: otStatus || undefined,
      }),
    ])
      .then(([dashResult, otResult]) => {
        if (!active) return;
        setRecords(dashResult?.records || []);
        setOvertime(otResult?.rows || []);
      })
      .catch((err) => {
        if (!active) return;
        setError(hrmError(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [refresh, selectedDate, otType, otStatus]);

  // Derived filtered records for Attendance
  const filtered = React.useMemo(() => {
    return records.filter((rec) => {
      const matchSearch =
        !search.trim() ||
        (rec.employeeName && rec.employeeName.toLowerCase().includes(search.toLowerCase())) ||
        (rec.employeeId && rec.employeeId.toLowerCase().includes(search.toLowerCase())) ||
        (rec.department && rec.department.toLowerCase().includes(search.toLowerCase()));

      const matchDept = selectedDept === 'All Departments' || rec.department === selectedDept;
      const matchStatus = selectedStatus === 'all' || rec.status === selectedStatus;

      return matchSearch && matchDept && matchStatus;
    });
  }, [records, search, selectedDept, selectedStatus]);

  // Filtered Overtime
  const filteredOvertime = React.useMemo(() => {
    return overtime.filter((row) => {
      if (!otSearch.trim()) return true;
      const term = otSearch.toLowerCase();
      return (
        (row.employeeName && row.employeeName.toLowerCase().includes(term)) ||
        (row.employeeCode && row.employeeCode.toLowerCase().includes(term))
      );
    });
  }, [overtime, otSearch]);

  // Metrics
  const presentCount = records.filter((r) => r.status === 'present').length;
  const lateCount = records.filter((r) => r.status === 'late').length;
  const onLeaveCount = records.filter((r) => r.status === 'on_leave').length;
  const absentCount = records.filter((r) => r.status === 'absent').length;

  // Overtime Metrics
  const pendingOt = overtime.filter((r) => (r.sessionStatus || r.approvalStatus) === 'PENDING').length;
  const approvedOt = overtime.filter((r) => (r.sessionStatus || r.approvalStatus) === 'APPROVED').length;
  const totalOtHours = overtime.reduce((sum, r) => sum + (Number(r.actualHours) || 0), 0);

  const departments = React.useMemo(() => {
    const list = new Set(records.map((r) => r.department).filter(Boolean));
    return ['All Departments', ...Array.from(list).sort()];
  }, [records]);

  const hasActiveFilters =
    Boolean(search) || selectedDept !== 'All Departments' || selectedStatus !== 'all';

  const resetFilters = () => {
    setSearch('');
    setSelectedDept('All Departments');
    setSelectedStatus('all');
  };

  // CSV Export
  const handleExport = () => {
    if (activeTab === 'attendance') {
      if (!filtered.length) {
        toast.error('No attendance records to export');
        return;
      }
      const headers = [
        'Employee Name',
        'Employee ID',
        'Department',
        'Punch In',
        'Punch Out',
        'Break Duration',
        'Working Hours',
        'Late Duration',
        'Status',
      ];
      const rows = filtered.map((r) => [
        `"${(r.employeeName || '').replace(/"/g, '""')}"`,
        `"${(r.employeeId || '').replace(/"/g, '""')}"`,
        `"${(r.department || '').replace(/"/g, '""')}"`,
        `"${(r.punchIn || '').replace(/"/g, '""')}"`,
        `"${(r.punchOut || '').replace(/"/g, '""')}"`,
        `"${(r.breakDuration || '').replace(/"/g, '""')}"`,
        `"${(r.workingHours || '').replace(/"/g, '""')}"`,
        `"${(r.lateDuration || '').replace(/"/g, '""')}"`,
        `"${(r.status || '').replace(/"/g, '""')}"`,
      ]);
      const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `attendance_${selectedDate || 'today'}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Attendance Report Exported', {
        description: `Exported ${filtered.length} records to CSV.`,
      });
    } else {
      if (!filteredOvertime.length) {
        toast.error('No overtime records to export');
        return;
      }
      const headers = ['Employee Name', 'Employee Code', 'Date', 'Type', 'Start Time', 'End Time', 'Actual Hours', 'Status'];
      const rows = filteredOvertime.map((r) => [
        `"${(r.employeeName || '').replace(/"/g, '""')}"`,
        `"${(r.employeeCode || '').replace(/"/g, '""')}"`,
        `"${String(r.overtimeDate || '').slice(0, 10)}"`,
        `"${(r.overtimeType || '').replace(/"/g, '""')}"`,
        `"${(r.startTime || '').replace(/"/g, '""')}"`,
        `"${(r.endTime || '').replace(/"/g, '""')}"`,
        `"${r.actualHours ?? ''}"`,
        `"${(r.sessionStatus || r.approvalStatus || '').replace(/"/g, '""')}"`,
      ]);
      const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `overtime_records.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Overtime Report Exported', {
        description: `Exported ${filteredOvertime.length} records to CSV.`,
      });
    }
  };

  return (
    <div className="w-full min-w-0 max-w-none space-y-5 sm:space-y-6 overflow-x-hidden">
      {/* ── 1. Top View Switcher & Actions ───────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200/80 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('attendance')}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition shadow-xs ${
              activeTab === 'attendance'
                ? 'bg-[#107569] text-white shadow-xs'
                : 'border border-slate-200/90 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <CalendarCheck className="size-4" />
            <span>Daily Attendance</span>
            <span
              className={`ml-1 rounded-full px-2 py-0.5 text-xs font-bold ${
                activeTab === 'attendance' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {records.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('overtime')}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition shadow-xs ${
              activeTab === 'overtime'
                ? 'bg-[#107569] text-white shadow-xs'
                : 'border border-slate-200/90 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Clock className="size-4" />
            <span>Overtime Tracking</span>
            <span
              className={`ml-1 rounded-full px-2 py-0.5 text-xs font-bold ${
                activeTab === 'overtime' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {overtime.length}
            </span>
          </button>
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
        </div>
      </div>

      {/* ── 2. Page Header ──────────────────────────────────────────────────── */}
      <PageHeader
        category="WORKFORCE MANAGEMENT"
        title={activeTab === 'attendance' ? 'Attendance' : 'Overtime Tracking'}
        description={
          activeTab === 'attendance'
            ? 'Daily punch in/out timestamps, break tracking, working duration, and automated late arrival detection.'
            : 'Pre-shift and post-shift overtime requests, approved windows, actual hours, and session approvals.'
        }
        actions={
          <Button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#107569] px-4 py-2 text-sm font-semibold text-white shadow-xs transition hover:bg-[#0e6359]"
          >
            <Download className="size-4" />
            <span>Export CSV</span>
          </Button>
        }
      />

      {/* ── 3. Four Dashboard Statistics Cards (Primary Brand Theme) ─────────── */}
      {activeTab === 'attendance' ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Staff */}
          <div className="group relative flex items-center justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md">
            <div className="space-y-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Total Staff
              </p>
              <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#163A2E]">
                {records.length}
              </p>
              <p className="text-xs text-slate-400">Scheduled employees</p>
            </div>
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 ring-1 ring-slate-200/60">
              <Users className="size-6" />
            </div>
          </div>

          {/* Present Today */}
          <div className="group relative flex items-center justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md">
            <div className="space-y-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Present Today
              </p>
              <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#163A2E]">
                {presentCount}
              </p>
              <p className="text-xs text-emerald-600 font-medium">
                {records.length > 0 ? Math.round((presentCount / records.length) * 100) : 0}% on site
              </p>
            </div>
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60">
              <CheckCircle2 className="size-6" />
            </div>
          </div>

          {/* Late Arrivals */}
          <div className="group relative flex items-center justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md">
            <div className="space-y-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Late Arrivals
              </p>
              <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-amber-700">
                {lateCount}
              </p>
              <p className="text-xs text-amber-600 font-medium">
                {lateCount > 0 ? 'Delayed check-ins' : 'All on time'}
              </p>
            </div>
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 ring-1 ring-amber-200/60">
              <AlertCircle className="size-6" />
            </div>
          </div>

          {/* Absent & On Leave */}
          <div className="group relative flex items-center justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-rose-300 hover:shadow-md">
            <div className="space-y-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Absent & Leave
              </p>
              <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-rose-700">
                {absentCount + onLeaveCount}
              </p>
              <p className="text-xs text-rose-600 font-medium">
                {onLeaveCount} on leave, {absentCount} absent
              </p>
            </div>
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-700 ring-1 ring-rose-200/60">
              <CalendarX className="size-6" />
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Overtime */}
          <div className="group relative flex items-center justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md">
            <div className="space-y-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Total Overtime Records
              </p>
              <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#163A2E]">
                {overtime.length}
              </p>
              <p className="text-xs text-slate-400">All registered sessions</p>
            </div>
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60">
              <Clock className="size-6" />
            </div>
          </div>

          {/* Pending Approvals */}
          <div className="group relative flex items-center justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md">
            <div className="space-y-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Pending Approvals
              </p>
              <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-amber-700">
                {pendingOt}
              </p>
              <p className="text-xs text-amber-600 font-medium">Awaiting manager sign-off</p>
            </div>
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 ring-1 ring-amber-200/60">
              <AlertCircle className="size-6" />
            </div>
          </div>

          {/* Approved Sessions */}
          <div className="group relative flex items-center justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md">
            <div className="space-y-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Approved Sessions
              </p>
              <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#163A2E]">
                {approvedOt}
              </p>
              <p className="text-xs text-emerald-600 font-medium">Verified for payout</p>
            </div>
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60">
              <CheckCircle2 className="size-6" />
            </div>
          </div>

          {/* Completed Hours */}
          <div className="group relative flex items-center justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md">
            <div className="space-y-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Total Overtime Hours
              </p>
              <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#163A2E]">
                {Math.round(totalOtHours * 10) / 10} hrs
              </p>
              <p className="text-xs text-slate-400">Total recorded overtime duration</p>
            </div>
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 ring-1 ring-slate-200/60">
              <Check className="size-6" />
            </div>
          </div>
        </div>
      )}

      {/* ── 4. Main Content Area ─────────────────────────────────────────────── */}
      <HrmNotice
        loading={loading}
        error={error}
        onRetry={() => setRefresh((value) => value + 1)}
      />

      {activeTab === 'attendance' ? (
        <div className="space-y-4">
          {/* Filter Toolbar */}
          <AttendanceFilters
            search={search}
            onSearchChange={setSearch}
            selectedDept={selectedDept}
            onDeptChange={setSelectedDept}
            selectedStatus={selectedStatus}
            onStatusChange={setSelectedStatus}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            onResetDate={() => setSelectedDate(todayStr)}
            isToday={selectedDate === todayStr}
            departments={departments}
            hasActiveFilters={hasActiveFilters}
            onResetFilters={resetFilters}
          />

          {/* Attendance Table */}
          {!loading && !error && <AttendanceTable records={filtered} />}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Overtime Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
            <div className="relative flex-1 max-w-sm">
              <input
                type="text"
                value={otSearch}
                onChange={(e) => setOtSearch(e.target.value)}
                placeholder="Search overtime by employee or ID..."
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#107569]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="w-full sm:w-40">
                <Select value={otType || 'ALL'} onValueChange={(v) => setOtType(v === 'ALL' ? '' : v)}>
                  <SelectTrigger className="h-10 text-xs sm:text-sm rounded-xl border-slate-200 bg-slate-50/60">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Types</SelectItem>
                    <SelectItem value="BEFORE_SHIFT">Before Shift</SelectItem>
                    <SelectItem value="AFTER_SHIFT">After Shift</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full sm:w-40">
                <Select
                  value={otStatus || 'ALL'}
                  onValueChange={(v) => setOtStatus(v === 'ALL' ? '' : v)}
                >
                  <SelectTrigger className="h-10 text-xs sm:text-sm rounded-xl border-slate-200 bg-slate-50/60">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Statuses</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Overtime Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
            {filteredOvertime.length === 0 ? (
              <div className="p-16 text-center">
                <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-emerald-50 text-[#107569] ring-1 ring-emerald-200/60">
                  <Clock className="size-7" />
                </div>
                <h3 className="mt-4 text-base font-bold text-slate-800">
                  No overtime records found
                </h3>
                <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
                  No overtime attendance records match the selected type or status filters.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-[#E2E8E5] bg-[#F4F9F6] text-xs font-bold uppercase tracking-wider text-[#163A2E]">
                      <th className="py-3.5 pl-6 pr-4">Employee</th>
                      <th className="py-3.5 px-4">Date</th>
                      <th className="py-3.5 px-4">Type</th>
                      <th className="py-3.5 px-4">Approved Window</th>
                      <th className="py-3.5 px-4">Actual Hours</th>
                      <th className="py-3.5 pl-4 pr-6 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredOvertime.map((row) => (
                      <tr key={row.id} className="transition-colors hover:bg-slate-50/70">
                        {/* Employee */}
                        <td className="py-3.5 pl-6 pr-4">
                          <div className="flex items-center gap-3">
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100/70 text-xs font-bold text-[#107569] ring-1 ring-emerald-200/60">
                              {getInitials(row.employeeName)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900 truncate">
                                {row.employeeName}
                              </p>
                              <p className="text-[11px] font-mono text-slate-400">
                                {row.employeeCode}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Date */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-xs font-medium text-slate-700">
                          {formatDate(row.overtimeDate)}
                        </td>

                        {/* Type */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 border border-slate-200">
                            {row.overtimeType === 'BEFORE_SHIFT'
                              ? 'Before Shift'
                              : row.overtimeType === 'AFTER_SHIFT'
                              ? 'After Shift'
                              : row.overtimeType || '—'}
                          </span>
                        </td>

                        {/* Approved Window */}
                        <td className="py-3.5 px-4 whitespace-nowrap font-mono text-xs text-slate-700">
                          {row.startTime} – {row.endTime}
                        </td>

                        {/* Actual Hours */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="text-xs font-bold text-[#163A2E]">
                            {row.actualHours == null ? '—' : `${row.actualHours} h`}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 pl-4 pr-6 text-right whitespace-nowrap">
                          <StatusBadge status={row.sessionStatus || row.approvalStatus} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
