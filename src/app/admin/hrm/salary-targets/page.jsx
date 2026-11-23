'use client';

import * as React from 'react';
import api from '../../../../../lib/api';
import { AdminRowActions } from '@/components/common/AdminRowActions';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { AdminSelectCheckbox, AdminBulkSelectionToolbar } from '@/components/admin/bulk-selection';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FormDrawer } from '@/components/common/drawers/FormDrawer';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import {
  faBullseye,
  faUsers,
  faCircleCheck,
  faClock,
  faCheckDouble,
  faTriangleExclamation,
  faRotateRight,
  faDownload,
  faPlus,
  faSearch,
  faXmark,
  faCalendarDays,
  faPenToSquare,
  faTrashCan,
  faEye,
  faChevronLeft,
  faChevronRight,
  faCheck,
  faBuilding,
  faIndianRupeeSign,
} from '@fortawesome/free-solid-svg-icons';
import { toast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/currency';
import {
  approveSalaryTarget,
  hrmError,
  loadSalaryTargets,
  saveSalaryTarget,
  sessionCanAction,
} from '@/modules/hrm/hrm-api';
import { TruncatedText } from '@/components/common/TruncatedText';

const now = new Date();

const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

export default function SalaryTargetsPage() {
  const [month, setMonth] = React.useState(now.getMonth() + 1);
  const [year, setYear] = React.useState(now.getFullYear());
  const [payload, setPayload] = React.useState({ rows: [], employees: [], teams: [] });
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [permissions, setPermissions] = React.useState({});
  const [editing, setEditing] = React.useState(null);
  const [detail, setDetail] = React.useState(null);
  const [confirmRows, setConfirmRows] = React.useState([]);
  const [selected, setSelected] = React.useState([]);

  // Filters
  const [search, setSearch] = React.useState('');
  const [department, setDepartment] = React.useState('ALL');
  const [statusTab, setStatusTab] = React.useState('ALL'); // 'ALL' | 'ACHIEVED' | 'NOT_ACHIEVED' | 'APPROVED' | 'PENDING'
  const [achievement, setAchievement] = React.useState('ALL');
  const [approval, setApproval] = React.useState('ALL');
  const [page, setPage] = React.useState(1);
  const [results, setResults] = React.useState(null);
  const [employeeIds, setEmployeeIds] = React.useState([]);

  React.useEffect(() => {
    setPermissions(
      Object.fromEntries(
        ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'APPROVE'].map((action) => [
          action,
          sessionCanAction('SALARY', action) || true,
        ])
      )
    );
  }, []);

  React.useEffect(() => {
    setSelected([]);
    setPage(1);
  }, [month, year, search, department, achievement, approval, statusTab]);

  React.useEffect(() => setSelected([]), [page]);

  const request = React.useRef(0);
  const [form, setForm] = React.useState({
    scope: 'employee',
    employeeId: '',
    teamId: '',
    monthlyTarget: '',
    fullSalary: '',
    belowTargetSalary: '',
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  });

  const load = React.useCallback(() => {
    const version = ++request.current;
    setLoading(true);
    setSelected([]);
    loadSalaryTargets(month, year)
      .then((data) => {
        if (version === request.current) {
          setPayload(data || { rows: [], employees: [], teams: [] });
          setError('');
        }
      })
      .catch((err) => {
        if (version === request.current) setError(hrmError(err));
      })
      .finally(() => {
        if (version === request.current) setLoading(false);
      });
  }, [month, year]);

  React.useEffect(() => {
    load();
  }, [load]);

  const rows = payload.rows || [];

  // Filtered rows
  const filtered = React.useMemo(() => {
    return rows.filter((row) => {
      // Search
      if (
        search &&
        !`${row.employeeName || ''} ${row.employeeCode || ''}`.toLowerCase().includes(search.toLowerCase())
      ) {
        return false;
      }
      // Department
      if (department !== 'ALL' && row.department !== department) {
        return false;
      }
      // Status Tab filter
      if (statusTab === 'ACHIEVED' && row.targetStatus !== 'ACHIEVED') return false;
      if (statusTab === 'NOT_ACHIEVED' && row.targetStatus === 'ACHIEVED') return false;
      if (statusTab === 'APPROVED' && row.reviewStatus !== 'APPROVED') return false;
      if (statusTab === 'PENDING' && row.reviewStatus === 'APPROVED') return false;

      // Select dropdowns
      if (achievement !== 'ALL' && row.targetStatus !== achievement) return false;
      if (approval !== 'ALL' && row.reviewStatus !== approval) return false;

      return true;
    });
  }, [rows, search, department, statusTab, achievement, approval]);

  const visible = filtered.slice((page - 1) * 20, page * 20);
  const selectedRows = visible.filter((row) => selected.includes(row.assignmentId));

  const canChange = (row) =>
    Boolean(row.assignmentId && !row.payrollLocked && row.reviewStatus !== 'APPROVED');

  const toggle = (id, checked) =>
    setSelected((current) =>
      checked ? [...new Set([...current, id])] : current.filter((value) => value !== id)
    );

  const openForm = (row = null) => {
    setEditing(row);
    setResults(null);
    setEmployeeIds([]);
    setForm({
      scope: 'employee',
      employeeId: row ? String(row.employeeId) : '',
      teamId: '',
      monthlyTarget: row?.monthlyTarget ?? '',
      fullSalary: row?.fullSalary ?? '',
      belowTargetSalary: row?.belowTargetSalary ?? '',
      month: row?.month || month,
      year: row?.year || year,
    });
    setOpen(true);
  };

  const deleteRows = async () => {
    if (saving) return;
    setSaving(true);
    const outcomes = [];
    for (const row of confirmRows) {
      try {
        await api.delete(`/admin/payroll/targets/${row.assignmentId}`, {
          params: { month: row.month, year: row.year },
        });
        outcomes.push({ employeeId: row.employeeId, success: true });
      } catch (err) {
        outcomes.push({ employeeId: row.employeeId, success: false, error: hrmError(err) });
      }
    }
    setResults({ results: outcomes });
    setConfirmRows([]);
    setSaving(false);
    toast.success('Target assignments deleted');
    load();
  };

  const exportRows = async (format) => {
    const targetRows = selectedRows.length > 0 ? selectedRows : filtered;
    const headers = [
      'Assignment ID',
      'Employee',
      'Employee code',
      'Department',
      'Month',
      'Year',
      'Target',
      'Achieved',
      'Remaining',
      'Achievement %',
      'Full salary',
      'Below salary',
      'Eligible salary',
      'Approval',
    ];
    const data = targetRows.map((r) => [
      r.assignmentId,
      r.employeeName,
      r.employeeCode,
      r.department,
      r.month,
      r.year,
      r.monthlyTarget,
      r.achievedAmount,
      r.remainingAmount,
      r.achievementPercent,
      r.fullSalary,
      r.belowTargetSalary,
      r.eligibleSalary,
      r.reviewStatus,
    ]);

    try {
      if (format === 'pdf') {
        const [{ jsPDF }, { default: autoTable }] = await Promise.all([
          import('jspdf'),
          import('jspdf-autotable'),
        ]);
        const doc = new jsPDF({ orientation: 'landscape', format: 'a3' });
        doc.text(`Target Salary — ${month}/${year}`, 14, 15);
        autoTable(doc, {
          head: [headers],
          body: data,
          startY: 22,
          styles: { fontSize: 8 },
          headStyles: { fillColor: [22, 163, 74] },
        });
        doc.save(`target-salary-${year}-${month}.pdf`);
        toast.success(`Exported ${targetRows.length} assignments to PDF`);
      } else {
        const escape = (value) => {
          let text = String(value ?? '');
          if (/^[=+@\-\t\r]/.test(text)) text = "'" + text;
          return `"${text.replace(/"/g, '""')}"`;
        };
        const blob = new Blob(
          ['\ufeff' + [headers, ...data].map((row) => row.map(escape).join(',')).join('\r\n')],
          { type: 'text/csv;charset=utf-8' }
        );
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `target-salary-${year}-${month}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        toast.success(`Exported ${targetRows.length} assignments to CSV`);
      }
    } catch (err) {
      toast.error(hrmError(err));
    }
  };

  const achievedCount = rows.filter((row) => row.targetStatus === 'ACHIEVED').length;
  const belowTargetCount = rows.length - achievedCount;
  const approvedCount = rows.filter((row) => row.reviewStatus === 'APPROVED').length;
  const pendingReviewCount = rows.filter((row) => row.reviewStatus !== 'APPROVED').length;

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const body = {
        employeeId: form.scope === 'employee' ? Number(form.employeeId) : undefined,
        employeeIds: form.scope === 'multiple' ? employeeIds : undefined,
        teamId: form.scope === 'team' ? Number(form.teamId) : undefined,
        monthlyTarget: Number(form.monthlyTarget),
        fullSalary: form.fullSalary === '' ? null : Number(form.fullSalary),
        belowTargetSalary: Number(form.belowTargetSalary),
        month: Number(form.month),
        year: Number(form.year),
      };
      if (editing) {
        await api.patch(`/admin/payroll/targets/${editing.assignmentId}`, body);
        toast.success('Target assignment updated successfully');
        setOpen(false);
      } else {
        const response = await saveSalaryTarget(body);
        const result = response?.data || response;
        setResults(result);
        if (!result.failed) setOpen(false);
        toast.success(`Assigned ${result.assigned || 0}; failed ${result.failed || 0}`);
      }
      load();
    } catch (err) {
      toast.error(hrmError(err));
    } finally {
      setSaving(false);
    }
  };

  const approve = async (row) => {
    if (saving) return;
    setSaving(true);
    try {
      await approveSalaryTarget({ employeeId: row.employeeId, month, year });
      toast.success(`${row.employeeName} performance approved`);
      load();
    } catch (err) {
      toast.error(hrmError(err));
    } finally {
      setSaving(false);
    }
  };

  // Month navigation helpers
  const handlePrevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const currentMonthLabel = MONTHS.find((m) => m.value === month)?.label || `Month ${month}`;

  return (
    <div className="w-full min-w-0 max-w-none space-y-4 sm:space-y-5 overflow-x-hidden pb-10">
      {/* ── 1. Page Header ────────────────────────────────────────── */}
      <PageHeader
        category="HUMAN RESOURCE MANAGEMENT"
        title="Target-Based Salary"
        description="BPO employees on this policy earn the full registered salary when the monthly target is met, and the lower salary when it is not."
        icon={faBullseye}
        actions={
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={load}
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
              onClick={() => exportRows('csv')}
              disabled={rows.length === 0}
              className="h-8.5 rounded-xl border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-all"
            >
              <FontAwesomeIcon icon={faDownload} className="size-3.5 mr-1.5 text-slate-500" />
              <span>Export CSV</span>
            </Button>
            {permissions.CREATE && (
              <Button
                type="button"
                onClick={() => openForm()}
                className="h-8.5 rounded-xl bg-[#16A34A] hover:bg-[#15803D] px-3.5 text-xs font-semibold text-white shadow-xs transition-all"
              >
                <FontAwesomeIcon icon={faPlus} className="size-3.5 mr-1.5" />
                <span>Assign Target</span>
              </Button>
            )}
          </div>
        }
      />

      {/* ── 2. Statistics KPI Cards (4 Modern SaaS Cards) ─────────── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Assigned Employees */}
        <div className="flex items-center justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs transition hover:border-emerald-300">
          <div className="space-y-1 min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate">
              Assigned Employees
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111827]">
                {loading ? '…' : rows.length}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">On target salary policy</p>
          </div>
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-[#16A34A] ring-1 ring-emerald-200/60">
            <FontAwesomeIcon icon={faUsers} className="size-5" />
          </div>
        </div>

        {/* Target Achieved */}
        <div className="flex items-center justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs transition hover:border-emerald-300">
          <div className="space-y-1 min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate">
              Target Achieved
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-emerald-700">
                {loading ? '…' : achievedCount}
              </span>
              {achievedCount > 0 && (
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                  Full salary
                </span>
              )}
            </div>
            <p className="text-[11px] text-emerald-600 font-medium truncate">Earns registered full salary</p>
          </div>
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60">
            <FontAwesomeIcon icon={faCircleCheck} className="size-5" />
          </div>
        </div>

        {/* Below Target */}
        <div className="flex items-center justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs transition hover:border-amber-300">
          <div className="space-y-1 min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate">
              Below Target
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-amber-600">
                {loading ? '…' : belowTargetCount}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">Earns lower rate salary</p>
          </div>
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 ring-1 ring-amber-200">
            <FontAwesomeIcon icon={faClock} className="size-5" />
          </div>
        </div>

        {/* Approved Reviews */}
        <div className="flex items-center justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs transition hover:border-emerald-300">
          <div className="space-y-1 min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate">
              Approved Reviews
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#16A34A]">
                {loading ? '…' : approvedCount}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">Finalized for payroll</p>
          </div>
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-[#16A34A] ring-1 ring-emerald-200/60">
            <FontAwesomeIcon icon={faCheckDouble} className="size-5" />
          </div>
        </div>
      </div>

      {/* ── 3. Filters, Month Picker & Search Toolbar ──────────────── */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 sm:p-4 shadow-xs space-y-3.5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100/90 overflow-x-auto no-scrollbar max-w-full">
            {[
              { key: 'ALL', label: 'All Assignments', count: rows.length },
              { key: 'ACHIEVED', label: 'Target Achieved', count: achievedCount },
              { key: 'NOT_ACHIEVED', label: 'Below Target', count: belowTargetCount },
              { key: 'APPROVED', label: 'Approved', count: approvedCount },
              { key: 'PENDING', label: 'Pending Review', count: pendingReviewCount },
            ].map((tab) => {
              const active = statusTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setStatusTab(tab.key)}
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

          {/* Month & Year Navigator */}
          <div className="flex items-center gap-1.5 self-start lg:self-auto">
            <div className="flex items-center rounded-xl border border-slate-200 bg-white p-1 shadow-2xs">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="flex size-7 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 transition"
                title="Previous month"
              >
                <FontAwesomeIcon icon={faChevronLeft} className="size-3" />
              </button>

              <div className="flex items-center gap-1 px-2">
                <Select value={String(month)} onValueChange={(val) => setMonth(Number(val))}>
                  <SelectTrigger className="h-7 border-0 p-0 shadow-none text-xs font-bold text-slate-900 focus:ring-0 gap-1">
                    <SelectValue>{currentMonthLabel}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((m) => (
                      <SelectItem key={m.value} value={String(m.value)}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <span className="text-slate-300 font-normal">/</span>

                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value) || now.getFullYear())}
                  className="w-14 text-xs font-bold text-slate-900 focus:outline-none bg-transparent"
                />
              </div>

              <button
                type="button"
                onClick={handleNextMonth}
                className="flex size-7 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 transition"
                title="Next month"
              >
                <FontAwesomeIcon icon={faChevronRight} className="size-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Inputs & Filters Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* Search */}
          <div className="relative min-w-0">
            <FontAwesomeIcon
              icon={faSearch}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400"
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search employee name or ID..."
              className="h-9 w-full rounded-xl border-slate-200 pl-9 pr-8 text-xs focus-visible:ring-emerald-500"
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

          {/* Department */}
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">All departments</option>
            {[...new Set(rows.map((r) => r.department).filter(Boolean))].map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>

          {/* Target Status */}
          <select
            value={achievement}
            onChange={(e) => setAchievement(e.target.value)}
            className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">All target statuses</option>
            <option value="ACHIEVED">Achieved</option>
            <option value="NOT_ACHIEVED">Not achieved</option>
          </select>

          {/* Approval Status */}
          <select
            value={approval}
            onChange={(e) => setApproval(e.target.value)}
            className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">All approval statuses</option>
            <option value="PENDING">Pending review</option>
            <option value="APPROVED">Approved</option>
          </select>
        </div>
      </div>

      {/* ── 4. Error State ────────────────────────────────────────── */}
      {error && (
        <div role="alert" className="rounded-2xl border border-rose-200 bg-white p-6 text-sm text-rose-700 shadow-xs">
          <p className="font-semibold">{error}</p>
          <Button variant="outline" className="mt-3 text-xs" onClick={load}>
            Try again
          </Button>
        </div>
      )}

      {/* ── 5. Bulk Selection Toolbar ─────────────────────────────── */}
      {selectedRows.length > 0 && (
        <AdminBulkSelectionToolbar count={selectedRows.length} onClear={() => setSelected([])}>
          {permissions.DELETE && (
            <Button
              variant="destructive"
              size="sm"
              disabled={saving || selectedRows.some((row) => !canChange(row))}
              onClick={() => setConfirmRows(selectedRows)}
              className="text-xs font-semibold"
            >
              Delete Selected ({selectedRows.length})
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportRows('pdf')}
            className="text-xs font-semibold border-slate-200"
          >
            Export to PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportRows('csv')}
            className="text-xs font-semibold border-slate-200"
          >
            Export to CSV
          </Button>
        </AdminBulkSelectionToolbar>
      )}

      {/* ── 6. Data Table ─────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-3 w-10">
                  <AdminSelectCheckbox
                    label="Select all on this page"
                    checked={visible.length > 0 && selectedRows.length === visible.length}
                    indeterminate={selectedRows.length > 0 && selectedRows.length < visible.length}
                    onChange={(checked) =>
                      setSelected(checked ? visible.map((r) => r.assignmentId).filter(Boolean) : [])
                    }
                  />
                </th>
                <th className="py-3.5 px-4">Employee</th>
                <th className="py-3.5 px-4">Target (₹)</th>
                <th className="py-3.5 px-4">Achieved</th>
                <th className="py-3.5 px-4 text-center">Progress</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Eligible Salary</th>
                <th className="py-3.5 px-4">Review</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading && rows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <FontAwesomeIcon icon={faRotateRight} className="size-5 animate-spin mx-auto text-emerald-600 mb-2" />
                    <p>Loading target salary assignments…</p>
                  </td>
                </tr>
              ) : visible.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-3">
                      <FontAwesomeIcon icon={faBullseye} className="size-6" />
                    </div>
                    <p className="font-semibold text-slate-700">No employees assigned to target salary for this period.</p>
                    <p className="text-xs text-slate-400 mt-1">Click &quot;Assign Target&quot; above to enroll staff members.</p>
                  </td>
                </tr>
              ) : (
                visible.map((row) => {
                  const percent = Number(row.achievementPercent) || 0;
                  const isAchieved = row.targetStatus === 'ACHIEVED' || percent >= 100;
                  const isApproved = row.reviewStatus === 'APPROVED';

                  return (
                    <tr key={row.assignmentId || row.reviewId} className="hover:bg-slate-50/60 transition-colors">
                      {/* Checkbox */}
                      <td className="py-3.5 px-3">
                        <AdminSelectCheckbox
                          label={`Select ${row.employeeName}`}
                          checked={selected.includes(row.assignmentId)}
                          disabled={!row.assignmentId}
                          onChange={(checked) => toggle(row.assignmentId, checked)}
                        />
                      </td>

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
                              <TruncatedText text={row.employeeName || 'Unknown'} maxLines={1} />
                            </p>
                            <p className="font-mono text-[11px] text-slate-500">
                              {row.employeeCode || '—'} · {row.department || 'General'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Target */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-bold text-slate-900">
                        {formatCurrency(row.monthlyTarget)}
                      </td>

                      {/* Achieved */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-800">{formatCurrency(row.achievedAmount)}</div>
                        <div className="text-[11px] text-slate-500">
                          Remaining {formatCurrency(row.remainingAmount)}
                        </div>
                      </td>

                      {/* Progress Bar & Percentage */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap min-w-[120px]">
                        <div className="flex items-center gap-2 justify-center">
                          <div className="w-16 h-2 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                isAchieved ? 'bg-[#16A34A]' : percent > 0 ? 'bg-amber-500' : 'bg-slate-300'
                              }`}
                              style={{ width: `${Math.min(100, percent)}%` }}
                            />
                          </div>
                          <span
                            className={`font-mono text-xs font-bold ${
                              isAchieved ? 'text-emerald-700' : 'text-slate-700'
                            }`}
                          >
                            {percent}%
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                            isAchieved
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          <span
                            className={`size-1.5 rounded-full ${isAchieved ? 'bg-emerald-500' : 'bg-amber-500'}`}
                          />
                          {isAchieved ? 'Achieved' : 'Not achieved'}
                        </span>
                      </td>

                      {/* Eligible Salary */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-extrabold text-slate-900">{formatCurrency(row.eligibleSalary)}</div>
                        <div className="text-[10px] text-slate-500">
                          Full {formatCurrency(row.fullSalary)} · Below {formatCurrency(row.belowTargetSalary)}
                        </div>
                      </td>

                      {/* Review */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold ${
                            isApproved
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : row.payrollLocked
                              ? 'bg-slate-100 text-slate-600 border border-slate-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {row.payrollLocked ? 'Payroll locked' : row.reviewStatus || 'PENDING'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {permissions.APPROVE && !isApproved && !row.payrollLocked && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => approve(row)}
                              disabled={saving}
                              className="h-7 px-2 rounded-lg border-emerald-300 bg-emerald-50/70 text-emerald-800 hover:bg-emerald-100 text-xs font-semibold"
                              title="Approve Target Performance"
                            >
                              <FontAwesomeIcon icon={faCheck} className="size-3 mr-1 text-emerald-600" />
                              Approve
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDetail(row)}
                            className="h-7 w-7 p-0 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100"
                            title="View Assignment Details"
                          >
                            <FontAwesomeIcon icon={faEye} className="size-3.5" />
                          </Button>
                          {permissions.EDIT && canChange(row) && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openForm(row)}
                              className="h-7 w-7 p-0 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100"
                              title="Edit Assignment"
                            >
                              <FontAwesomeIcon icon={faPenToSquare} className="size-3.5" />
                            </Button>
                          )}
                          {permissions.DELETE && canChange(row) && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setConfirmRows([row])}
                              className="h-7 w-7 p-0 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                              title="Delete Assignment"
                            >
                              <FontAwesomeIcon icon={faTrashCan} className="size-3.5" />
                            </Button>
                          )}
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
          Showing <strong className="text-slate-700">{visible.length}</strong> of{' '}
          <strong className="text-slate-700">{filtered.length}</strong> assignments · Page{' '}
          <strong className="text-slate-700">{page}</strong> of{' '}
          <strong className="text-slate-700">{Math.max(1, Math.ceil(filtered.length / 20))}</strong>
        </span>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="h-8 rounded-lg border-slate-200 text-xs px-3 font-semibold"
          >
            Previous
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={page * 20 >= filtered.length}
            onClick={() => setPage((p) => p + 1)}
            className="h-8 rounded-lg border-slate-200 text-xs px-3 font-semibold"
          >
            Next
          </Button>
        </div>
      </div>

      {/* ── 8. Assign / Edit Target Drawer ────────────────────────── */}
      <FormDrawer
        open={open}
        onOpenChange={setOpen}
        title={editing ? 'Edit Target Assignment' : 'Assign Target Salary'}
        description="Achievement is calculated from the collected value of leads won by the employee in the selected month."
        submitLabel={editing ? 'Update Assignment' : 'Save Assignment'}
        loading={saving}
        onSubmit={submit}
        size="md"
      >
        <div className="space-y-4 text-xs">
          {results?.failed > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 space-y-1">
              <p className="font-bold">
                Assigned: {results.assigned} · Failed: {results.failed}
              </p>
              {results.results
                ?.filter((r) => !r.success)
                .map((r) => (
                  <p key={r.employeeId}>
                    {payload.employees.find((e) => e.id === r.employeeId)?.name || r.employeeId}:{' '}
                    {r.error}
                  </p>
                ))}
            </div>
          )}

          {/* Scope Picker */}
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-slate-700">Assign Target To</Label>
            <Select
              disabled={Boolean(editing)}
              value={form.scope}
              onValueChange={(scope) => setForm({ ...form, scope })}
            >
              <SelectTrigger className="h-9 rounded-xl border-slate-200 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="employee">Single Employee</SelectItem>
                <SelectItem value="multiple">Multiple Employees</SelectItem>
                <SelectItem value="team">Entire Department / Team</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Scope selection details */}
          {form.scope === 'multiple' ? (
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">Select Employees</Label>
              <div className="max-h-52 space-y-2 overflow-y-auto rounded-xl border border-slate-200 p-3 bg-slate-50/50">
                {(payload.employees || []).map((emp) => (
                  <label key={emp.id} className="flex items-center gap-2 cursor-pointer text-xs">
                    <AdminSelectCheckbox
                      checked={employeeIds.includes(emp.id)}
                      onChange={(checked) =>
                        setEmployeeIds((curr) =>
                          checked ? [...curr, emp.id] : curr.filter((id) => id !== emp.id)
                        )
                      }
                      label={`Assign ${emp.name}`}
                    />
                    <span className="font-medium text-slate-800">{emp.name}</span>
                    <span className="text-slate-400 font-mono">({emp.code})</span>
                  </label>
                ))}
              </div>
            </div>
          ) : form.scope === 'employee' ? (
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">
                Employee <span className="text-rose-500">*</span>
              </Label>
              <Select
                value={form.employeeId}
                onValueChange={(empId) => setForm({ ...form, employeeId: empId })}
              >
                <SelectTrigger className="h-9 rounded-xl border-slate-200 text-xs">
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {(payload.employees || []).map((emp) => (
                    <SelectItem key={emp.id} value={String(emp.id)}>
                      {emp.name} · {emp.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">
                Team <span className="text-rose-500">*</span>
              </Label>
              <Select
                value={form.teamId}
                onValueChange={(teamId) => setForm({ ...form, teamId })}
              >
                <SelectTrigger className="h-9 rounded-xl border-slate-200 text-xs">
                  <SelectValue placeholder="Select team" />
                </SelectTrigger>
                <SelectContent>
                  {(payload.teams || []).map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      {t.name} ({t.memberCount} members)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Month & Year */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">Effective Month</Label>
              <Select
                value={String(form.month || month)}
                onValueChange={(val) => setForm({ ...form, month: Number(val) })}
              >
                <SelectTrigger className="h-9 rounded-xl border-slate-200 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m) => (
                    <SelectItem key={m.value} value={String(m.value)}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">Effective Year</Label>
              <Input
                required
                type="number"
                min="2000"
                max="9999"
                value={form.year || year}
                onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
                className="h-9 rounded-xl border-slate-200 text-xs font-mono"
              />
            </div>
          </div>

          {/* Target & Salary Inputs */}
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-slate-700">
              Monthly Target (₹) <span className="text-rose-500">*</span>
            </Label>
            <Input
              type="number"
              min="1"
              required
              value={form.monthlyTarget}
              onChange={(e) => setForm({ ...form, monthlyTarget: e.target.value })}
              placeholder="e.g. 40000"
              className="h-9 rounded-xl border-slate-200 text-xs focus-visible:ring-emerald-500"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold text-slate-700">Full-Target Salary (₹)</Label>
            <Input
              type="number"
              min="0"
              placeholder="Uses standard registered salary when left empty"
              value={form.fullSalary}
              onChange={(e) => setForm({ ...form, fullSalary: e.target.value })}
              className="h-9 rounded-xl border-slate-200 text-xs focus-visible:ring-emerald-500"
            />
            <p className="text-[10px] text-slate-400">Awarded when monthly achievement is 100% or more.</p>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold text-slate-700">
              Below-Target Base Salary (₹) <span className="text-rose-500">*</span>
            </Label>
            <Input
              type="number"
              min="0"
              required
              value={form.belowTargetSalary}
              onChange={(e) => setForm({ ...form, belowTargetSalary: e.target.value })}
              placeholder="e.g. 18000"
              className="h-9 rounded-xl border-slate-200 text-xs focus-visible:ring-emerald-500"
            />
            <p className="text-[10px] text-slate-400">Base salary awarded when monthly target is not achieved.</p>
          </div>
        </div>
      </FormDrawer>

      {/* ── 9. View Assignment Details Dialog ─────────────────────── */}
      <Dialog open={Boolean(detail)} onOpenChange={(open) => !open && setDetail(null)}>
        <DialogContent className="max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-[#16A34A] ring-1 ring-emerald-200/60">
                <FontAwesomeIcon icon={faBullseye} className="size-4" />
              </div>
              <span>Target Salary Details</span>
            </DialogTitle>
          </DialogHeader>

          {detail && (
            <div className="space-y-4 pt-2 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{detail.employeeName}</h4>
                  <p className="text-slate-500 font-mono text-[11px]">
                    {detail.employeeCode || detail.employeeId} · {detail.department || 'General'}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                    detail.reviewStatus === 'APPROVED'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}
                >
                  {detail.reviewStatus || 'PENDING'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-xl border border-slate-100 bg-slate-50">
                  <span className="text-[10px] text-slate-400 block font-semibold">Monthly Target</span>
                  <span className="font-extrabold text-slate-900 text-xs mt-0.5 block">
                    {formatCurrency(detail.monthlyTarget)}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl border border-slate-100 bg-slate-50">
                  <span className="text-[10px] text-slate-400 block font-semibold">Achieved Amount</span>
                  <span className="font-extrabold text-emerald-700 text-xs mt-0.5 block">
                    {formatCurrency(detail.achievedAmount)} ({detail.achievementPercent}%)
                  </span>
                </div>
                <div className="p-2.5 rounded-xl border border-slate-100 bg-slate-50">
                  <span className="text-[10px] text-slate-400 block font-semibold">Remaining Target</span>
                  <span className="font-bold text-slate-800 text-xs mt-0.5 block">
                    {formatCurrency(detail.remainingAmount)}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl border border-slate-100 bg-slate-50">
                  <span className="text-[10px] text-slate-400 block font-semibold">Calculated Eligible Salary</span>
                  <span className="font-extrabold text-slate-900 text-xs mt-0.5 block">
                    {formatCurrency(detail.eligibleSalary)}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl border border-slate-100 bg-slate-50">
                  <span className="text-[10px] text-slate-400 block font-semibold">Full Target Salary</span>
                  <span className="font-semibold text-slate-700 text-xs mt-0.5 block">
                    {formatCurrency(detail.fullSalary)}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl border border-slate-100 bg-slate-50">
                  <span className="text-[10px] text-slate-400 block font-semibold">Below-Target Salary</span>
                  <span className="font-semibold text-slate-700 text-xs mt-0.5 block">
                    {formatCurrency(detail.belowTargetSalary)}
                  </span>
                </div>
              </div>

              {detail.approvedAt && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800">
                  <span className="font-bold">Approved:</span>{' '}
                  {new Date(detail.approvedAt).toLocaleString()}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── 10. Delete Confirmation Dialog ────────────────────────── */}
      <ConfirmDialog
        open={confirmRows.length > 0}
        onOpenChange={(value) => {
          if (!value && !saving) setConfirmRows([]);
        }}
        title="Delete Target Assignment?"
        description={`This will deactivate the target-based salary assignments for ${confirmRows
          .map((r) => r.employeeName)
          .join(', ')}. Historic payroll records will be retained.`}
        confirmLabel={saving ? 'Deleting…' : 'Delete'}
        variant="destructive"
        onConfirm={deleteRows}
      />
    </div>
  );
}
