'use client';

import * as React from 'react';
import {
  Clock,
  Users,
  Moon,
  Sun,
  Calendar,
  Search,
  RefreshCw,
  Plus,
  History,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Trash2,
  Edit3,
  Eye,
  UserCheck,
  UserMinus,
  ArrowRight,
  Filter,
  Check,
  ShieldCheck,
  X,
  CalendarDays,
} from 'lucide-react';

import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { FormDrawer } from '@/components/common/drawers/FormDrawer';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/common/Select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import {
  assignShift,
  unassignShift,
  hrmError,
  loadEmployees,
  loadShift,
  loadShifts,
  loadShiftHistory,
  removeShift,
  saveShift,
  sessionCan,
} from '@/modules/hrm/hrm-api';

const DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const emptyForm = {
  name: '',
  code: '',
  startTime: '09:30 AM',
  endTime: '06:30 PM',
  durationHours: 8,
  breakDurationMinutes: 60,
  gracePeriodMinutes: 15,
  status: 'ACTIVE',
  isNightShift: false,
  isRotational: false,
  workingDays: DAYS.slice(0, 6),
  notes: '',
};

// ── Time parsing and working hours calculation (overnight supported) ─────────
function parseTimeToMinutes(timeStr) {
  if (!timeStr) return null;
  const str = String(timeStr).trim();
  const match12 = str.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (match12) {
    let hours = parseInt(match12[1], 10);
    const minutes = parseInt(match12[2], 10);
    const meridian = match12[3]?.toUpperCase();
    if (meridian === 'PM' && hours < 12) hours += 12;
    if (meridian === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  }
  return null;
}

function calculateWorkingHours(startTime, endTime, breakMinutes = 0) {
  const startMin = parseTimeToMinutes(startTime);
  const endMin = parseTimeToMinutes(endTime);
  if (startMin === null || endMin === null) return null;

  let diffMinutes = endMin - startMin;
  if (diffMinutes <= 0) {
    // Overnight shift: crosses midnight, e.g. 09:00 PM (1260) to 01:00 AM (60) => 240 mins (4 hours)
    diffMinutes += 24 * 60;
  }
  const netMinutes = Math.max(0, diffMinutes - (Number(breakMinutes) || 0));
  return Math.round((netMinutes / 60) * 10) / 10;
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return String(dateStr);
  }
}

function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return `${d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })} · ${d.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  } catch {
    return String(dateStr);
  }
}

export default function ShiftsPage() {
  // ── State ────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = React.useState('directory'); // 'directory' | 'history'
  const [rows, setRows] = React.useState([]);
  const [metrics, setMetrics] = React.useState({});
  const [employees, setEmployees] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');
  const [status, setStatus] = React.useState('ALL');
  const [timingType, setTimingType] = React.useState('ALL');
  const [refresh, setRefresh] = React.useState(0);

  // History state
  const [historyRows, setHistoryRows] = React.useState([]);
  const [historyLoading, setHistoryLoading] = React.useState(false);
  const [historySearch, setHistorySearch] = React.useState('');
  const [debouncedHistorySearch, setDebouncedHistorySearch] = React.useState('');
  const [historyShiftFilter, setHistoryShiftFilter] = React.useState('ALL');
  const [historyDateFrom, setHistoryDateFrom] = React.useState('');
  const [historyDateTo, setHistoryDateTo] = React.useState('');
  const [historyTotal, setHistoryTotal] = React.useState(0);

  // Create / Edit Shift Form state
  const [formOpen, setFormOpen] = React.useState(false);
  const [form, setForm] = React.useState(emptyForm);
  const [editingId, setEditingId] = React.useState(null);
  const [saving, setSaving] = React.useState(false);

  // Manage Assigned Employees Drawer state
  const [detailOpen, setDetailOpen] = React.useState(false);
  const [detail, setDetail] = React.useState(null);
  const [selectedEmployees, setSelectedEmployees] = React.useState([]);
  const [assignmentReason, setAssignmentReason] = React.useState('');
  const [employeeSearch, setEmployeeSearch] = React.useState('');
  const [assignmentTab, setAssignmentTab] = React.useState('assigned'); // 'assigned' | 'assign_more'

  // Deactivate confirmation dialog
  const [deactivateTarget, setDeactivateTarget] = React.useState(null);
  const [deactivating, setDeactivating] = React.useState(false);

  // Unassign confirmation dialog
  const [unassignTarget, setUnassignTarget] = React.useState(null);
  const [unassigning, setUnassigning] = React.useState(false);

  const [canManage, setCanManage] = React.useState(false);
  React.useEffect(() => {
    setCanManage(sessionCan('SHIFT') || sessionCan('HRM'));
  }, []);

  // Debounce main search
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 350);
    return () => clearTimeout(handler);
  }, [search]);

  // Debounce history search
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedHistorySearch(historySearch);
    }, 350);
    return () => clearTimeout(handler);
  }, [historySearch]);

  // ── Load Shifts & Employees ───────────────────────────────────────────────
  React.useEffect(() => {
    let active = true;
    setLoading(true);
    const query = {
      search: debouncedSearch.trim() || undefined,
      status: status !== 'ALL' ? status : undefined,
      type: timingType !== 'ALL' ? timingType : undefined,
    };

    Promise.all([loadShifts(query), loadEmployees()])
      .then(([shifts, people]) => {
        if (!active) return;
        setRows(shifts.rows || []);
        setMetrics(shifts.metrics || {});
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
  }, [refresh, debouncedSearch, status, timingType]);

  // ── Load Shift History ────────────────────────────────────────────────────
  const fetchHistory = React.useCallback(async () => {
    setHistoryLoading(true);
    try {
      const params = {
        search: debouncedHistorySearch.trim() || undefined,
        shiftId: historyShiftFilter !== 'ALL' ? historyShiftFilter : undefined,
        startDate: historyDateFrom || undefined,
        endDate: historyDateTo || undefined,
        limit: 50,
      };
      const res = await loadShiftHistory(params);
      setHistoryRows(res.rows || []);
      setHistoryTotal(res.pagination?.total ?? (res.rows || []).length);
    } catch (err) {
      toast.error('Failed to load shift history', {
        description: hrmError(err),
      });
    } finally {
      setHistoryLoading(false);
    }
  }, [debouncedHistorySearch, historyShiftFilter, historyDateFrom, historyDateTo]);

  React.useEffect(() => {
    fetchHistory();
  }, [fetchHistory, refresh]);

  // ── Auto-update duration hours when timing or break changes ───────────────
  const updateTimesAndHours = (field, value) => {
    setForm((prev) => {
      const updated = { ...prev, [field]: value };
      const hours = calculateWorkingHours(
        updated.startTime,
        updated.endTime,
        updated.breakDurationMinutes
      );
      if (hours !== null) {
        updated.durationHours = hours;
      }
      return updated;
    });
  };

  // ── Actions ───────────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (row) => {
    setEditingId(row.id);
    setForm({
      name: row.name || '',
      code: row.code || '',
      startTime: row.startTime || '09:30 AM',
      endTime: row.endTime || '06:30 PM',
      durationHours: row.durationHours ?? 8,
      breakDurationMinutes: row.breakDurationMinutes ?? 60,
      gracePeriodMinutes: row.gracePeriodMinutes ?? 15,
      status: row.status || 'ACTIVE',
      isNightShift: Boolean(row.isNightShift),
      isRotational: Boolean(row.isRotational),
      workingDays:
        row.workingDays && row.workingDays.length > 0
          ? row.workingDays
          : DAYS.slice(0, 6),
      notes: row.notes || '',
    });
    setFormOpen(true);
  };

  const openDetail = async (row) => {
    try {
      const shift = await loadShift(row.id);
      setDetail(shift);
      setSelectedEmployees((shift.employees || []).map((emp) => emp.id));
      setAssignmentTab('assigned');
      setAssignmentReason('');
      setEmployeeSearch('');
      setDetailOpen(true);
    } catch (err) {
      toast.error(hrmError(err));
    }
  };

  const submit = async (event) => {
    if (event?.preventDefault) event.preventDefault();
    if (!form.name.trim() || !form.code.trim()) {
      toast.error('Please enter Shift Name and Shift Code');
      return;
    }
    setSaving(true);
    try {
      await saveShift(form, editingId);
      setFormOpen(false);
      setRefresh((v) => v + 1);
      toast.success(
        editingId ? 'Shift updated successfully' : 'Shift created successfully'
      );
    } catch (err) {
      toast.error(hrmError(err));
    } finally {
      setSaving(false);
    }
  };

  const confirmDeactivate = async () => {
    if (!deactivateTarget) return;
    setDeactivating(true);
    try {
      await removeShift(deactivateTarget.id);
      setDeactivateTarget(null);
      setRefresh((v) => v + 1);
      toast.success('Shift deactivated successfully');
    } catch (err) {
      toast.error(hrmError(err));
    } finally {
      setDeactivating(false);
    }
  };

  const handleSaveAssignments = async () => {
    if (!detail) return;
    setSaving(true);
    try {
      await assignShift(detail.id, selectedEmployees, {
        reason: assignmentReason.trim() || undefined,
      });
      const updated = await loadShift(detail.id);
      setDetail(updated);
      setSelectedEmployees((updated.employees || []).map((emp) => emp.id));
      setRefresh((v) => v + 1);
      fetchHistory();
      toast.success('Employee assignments updated successfully');
      setAssignmentTab('assigned');
      setAssignmentReason('');
    } catch (err) {
      toast.error(hrmError(err));
    } finally {
      setSaving(false);
    }
  };

  const confirmUnassign = async () => {
    if (!unassignTarget || !detail) return;
    setUnassigning(true);
    try {
      await unassignShift(
        detail.id,
        [unassignTarget.id],
        'Removed from shift by administrator'
      );
      const updated = await loadShift(detail.id);
      setDetail(updated);
      setSelectedEmployees((updated.employees || []).map((emp) => emp.id));
      setUnassignTarget(null);
      setRefresh((v) => v + 1);
      fetchHistory();
      toast.success(`${unassignTarget.name} unassigned from shift`);
    } catch (err) {
      toast.error(hrmError(err));
    } finally {
      setUnassigning(false);
    }
  };

  // Filter employees for "Assign More" view
  const availableEmployees = React.useMemo(() => {
    if (!employeeSearch.trim()) return employees;
    const q = employeeSearch.toLowerCase();
    return employees.filter(
      (emp) =>
        (emp.name && emp.name.toLowerCase().includes(q)) ||
        (emp.id && String(emp.id).toLowerCase().includes(q)) ||
        (emp.email && emp.email.toLowerCase().includes(q)) ||
        (emp.department && emp.department.toLowerCase().includes(q))
    );
  }, [employees, employeeSearch]);

  return (
    <div className="w-full min-w-0 max-w-none space-y-6 overflow-x-hidden pb-12 font-sans text-slate-800">
      {/* ── 1. Page Header ──────────────────────────────────────────────────── */}
      <PageHeader
        category="WORKFORCE MANAGEMENT"
        title="Shifts"
        description="Manage company shifts, working hours, break duration and employee assignments."
        actions={
          canManage ? (
            <Button
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-xl bg-[#107569] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#0e6359] hover:shadow-md"
            >
              <Plus className="size-4" />
              <span>Add Shift</span>
            </Button>
          ) : null
        }
      />

      {/* ── 2. Dashboard Statistics (4 Responsive Cards) ────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Shifts */}
        <div className="group relative flex items-center justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md">
          <div className="space-y-1.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Shifts
            </p>
            <p className="text-3xl font-extrabold tracking-tight text-[#163A2E]">
              {metrics.total ?? rows.length}
            </p>
            <p className="text-xs text-slate-400">Configured in workspace</p>
          </div>
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60">
            <Clock className="size-6" />
          </div>
        </div>

        {/* Active Shifts */}
        <div className="group relative flex items-center justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md">
          <div className="space-y-1.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Active Shifts
            </p>
            <p className="text-3xl font-extrabold tracking-tight text-emerald-700">
              {metrics.active ?? rows.filter((r) => r.status === 'ACTIVE').length}
            </p>
            <p className="text-xs text-emerald-600 font-medium">Currently operational</p>
          </div>
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60">
            <ShieldCheck className="size-6" />
          </div>
        </div>

        {/* Night Shifts */}
        <div className="group relative flex items-center justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md">
          <div className="space-y-1.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Night Shifts
            </p>
            <p className="text-3xl font-extrabold tracking-tight text-indigo-900">
              {metrics.nightShifts ?? rows.filter((r) => r.isNightShift).length}
            </p>
            <p className="text-xs text-indigo-600 font-medium">Overnight schedules</p>
          </div>
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200/60">
            <Moon className="size-6" />
          </div>
        </div>

        {/* Assigned Employees */}
        <div className="group relative flex items-center justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-md">
          <div className="space-y-1.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Assigned Employees
            </p>
            <p className="text-3xl font-extrabold tracking-tight text-[#107569]">
              {metrics.assignedEmployees ?? 0}
            </p>
            <p className="text-xs text-slate-400">Total rostered staff</p>
          </div>
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-[#107569] ring-1 ring-teal-200/60">
            <Users className="size-6" />
          </div>
        </div>
      </div>

      {/* ── 3. Tab Switcher (Directory vs Shift History) ────────────────────── */}
      <div className="flex items-center justify-between border-b border-slate-200">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('directory')}
            className={`relative flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-all ${
              activeTab === 'directory'
                ? 'border-[#107569] text-[#107569]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock className="size-4" />
            <span>Shifts Directory</span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                activeTab === 'directory'
                  ? 'bg-emerald-100 text-[#107569]'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {rows.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`relative flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-all ${
              activeTab === 'history'
                ? 'border-[#107569] text-[#107569]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="size-4" />
            <span>Shift Assignment History</span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                activeTab === 'history'
                  ? 'bg-emerald-100 text-[#107569]'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {historyTotal}
            </span>
          </button>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setRefresh((v) => v + 1)}
          disabled={loading || historyLoading}
          className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-[#107569]"
        >
          <RefreshCw
            className={`size-3.5 ${loading || historyLoading ? 'animate-spin' : ''}`}
          />
          <span>Refresh</span>
        </Button>
      </div>

      {/* ── 4. TAB 1: SHIFTS DIRECTORY ─────────────────────────────────────── */}
      {activeTab === 'directory' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-xs sm:flex-row sm:items-center sm:flex-wrap">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search shift name or code..."
                className="pl-9 pr-8 h-10 w-full rounded-xl border-slate-200 bg-slate-50/50 text-sm focus:bg-white"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Status Filter */}
              <div className="w-full sm:w-40">
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="h-10 rounded-xl border-slate-200 text-sm bg-white">
                    <SelectValue placeholder="Status: All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Statuses</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Timing Filter */}
              <div className="w-full sm:w-40">
                <Select value={timingType} onValueChange={setTimingType}>
                  <SelectTrigger className="h-10 rounded-xl border-slate-200 text-sm bg-white">
                    <SelectValue placeholder="Timing: All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Shift Types</SelectItem>
                    <SelectItem value="NIGHT">Night Shift</SelectItem>
                    <SelectItem value="ROTATIONAL">Rotational</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Refresh on mobile */}
              <Button
                variant="outline"
                onClick={() => setRefresh((v) => v + 1)}
                disabled={loading}
                className="sm:hidden h-10 w-full inline-flex items-center justify-center gap-2 rounded-xl text-sm font-medium"
              >
                <RefreshCw
                  className={`size-4 ${loading ? 'animate-spin' : ''}`}
                />
                <span>Refresh Shifts</span>
              </Button>
            </div>
          </div>

          {/* Shifts Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
            {loading ? (
              <div className="p-12 text-center">
                <RefreshCw className="mx-auto size-8 animate-spin text-[#107569]" />
                <p className="mt-3 text-sm font-medium text-slate-600">
                  Loading workforce shifts...
                </p>
              </div>
            ) : error ? (
              <div className="p-8 text-center">
                <AlertCircle className="mx-auto size-8 text-rose-500" />
                <p className="mt-2 text-sm font-semibold text-rose-700">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRefresh((v) => v + 1)}
                  className="mt-4"
                >
                  Try Again
                </Button>
              </div>
            ) : rows.length === 0 ? (
              <div className="p-16 text-center">
                <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-emerald-50 text-[#107569]">
                  <Clock className="size-7" />
                </div>
                <h3 className="mt-4 text-base font-bold text-slate-800">
                  No shifts found
                </h3>
                <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
                  {debouncedSearch || status !== 'ALL' || timingType !== 'ALL'
                    ? 'No shifts match your search criteria. Try resetting the filters.'
                    : 'Get started by creating your company’s first shift schedule.'}
                </p>
                {canManage && (
                  <Button
                    onClick={openCreate}
                    className="mt-5 rounded-xl bg-[#107569] text-white hover:bg-[#0e6359]"
                  >
                    <Plus className="size-4 mr-1.5" />
                    Create Shift
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-[#E2E8E5] bg-[#F4F9F6] text-xs font-bold uppercase tracking-wider text-[#163A2E]">
                      <th className="py-3.5 pl-6 pr-4">Shift</th>
                      <th className="py-3.5 px-4">Timing</th>
                      <th className="py-3.5 px-4">Hours</th>
                      <th className="py-3.5 px-4">Break</th>
                      <th className="py-3.5 px-4">Assigned</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 pl-4 pr-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rows.map((row) => (
                      <tr
                        key={row.id}
                        className="transition-colors hover:bg-slate-50/70"
                      >
                        {/* Shift Name & Code */}
                        <td className="py-4 pl-6 pr-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex size-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
                                row.isNightShift
                                  ? 'bg-indigo-100 text-indigo-700'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {row.isNightShift ? (
                                <Moon className="size-4" />
                              ) : (
                                <Sun className="size-4" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-slate-900 truncate">
                                  {row.name}
                                </p>
                                <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-mono font-medium text-slate-600">
                                  {row.code}
                                </span>
                              </div>
                              <div className="mt-1 flex flex-wrap gap-1.5 text-xs text-slate-500">
                                {row.isNightShift && (
                                  <span className="inline-flex items-center rounded-sm bg-indigo-50 px-1.5 py-0.2 text-[10px] font-semibold text-indigo-700">
                                    Night Shift
                                  </span>
                                )}
                                {row.isRotational && (
                                  <span className="inline-flex items-center rounded-sm bg-amber-50 px-1.5 py-0.2 text-[10px] font-semibold text-amber-700">
                                    Rotational
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Timing */}
                        <td className="py-4 px-4 whitespace-nowrap text-slate-700 font-medium">
                          <div className="flex items-center gap-1.5">
                            <Clock className="size-3.5 text-slate-400" />
                            <span>
                              {row.startTime || '—'} – {row.endTime || '—'}
                            </span>
                          </div>
                        </td>

                        {/* Hours */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span className="inline-flex items-center rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-800">
                            {row.durationHours ?? '—'} hrs
                          </span>
                        </td>

                        {/* Break */}
                        <td className="py-4 px-4 whitespace-nowrap text-slate-600">
                          {row.breakDurationMinutes ?? 0} min
                        </td>

                        {/* Assigned Employees */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => openDetail(row)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-bold text-[#107569] transition hover:bg-teal-100"
                          >
                            <Users className="size-3.5" />
                            <span>{row.employeeCount ?? 0} staff</span>
                          </button>
                        </td>

                        {/* Status */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          {row.status === 'ACTIVE' ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                              <span className="size-1.5 rounded-full bg-emerald-600" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                              <span className="size-1.5 rounded-full bg-slate-400" />
                              Inactive
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-4 pl-4 pr-6 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDetail(row)}
                              className="h-8 w-8 p-0 text-slate-600 hover:text-[#107569] hover:bg-slate-100"
                              title="View and manage assigned staff"
                            >
                              <Users className="size-4" />
                            </Button>
                            {canManage && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openEdit(row)}
                                  className="h-8 w-8 p-0 text-slate-600 hover:text-emerald-700 hover:bg-slate-100"
                                  title="Edit Shift details"
                                >
                                  <Edit3 className="size-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setDeactivateTarget(row)}
                                  className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                  title="Deactivate Shift"
                                >
                                  <Trash2 className="size-4" />
                                </Button>
                              </>
                            )}
                          </div>
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

      {/* ── 5. TAB 2: SHIFT ASSIGNMENT HISTORY ──────────────────────────────── */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {/* History Header & Filters */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <History className="size-4 text-[#107569]" />
                  <span>Shift Assignment Audit Log</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Track when employees are assigned to shifts, rotated, or unassigned.
                </p>
              </div>
              <div className="text-xs font-semibold text-slate-500">
                Total Logs:{' '}
                <span className="font-bold text-[#107569]">{historyTotal}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {/* Search History */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
                <Input
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder="Search employee, shift, reason..."
                  className="pl-8 h-9 text-xs rounded-xl bg-slate-50 border-slate-200"
                />
              </div>

              {/* Shift Filter */}
              <div>
                <Select
                  value={historyShiftFilter}
                  onValueChange={setHistoryShiftFilter}
                >
                  <SelectTrigger className="h-9 rounded-xl border-slate-200 text-xs bg-white">
                    <SelectValue placeholder="All Shifts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Shifts</SelectItem>
                    {rows.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.name} ({s.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date From */}
              <div className="relative">
                <Input
                  type="date"
                  value={historyDateFrom}
                  onChange={(e) => setHistoryDateFrom(e.target.value)}
                  className="h-9 text-xs rounded-xl bg-white border-slate-200"
                  placeholder="From date"
                />
              </div>

              {/* Date To */}
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={historyDateTo}
                  onChange={(e) => setHistoryDateTo(e.target.value)}
                  className="h-9 text-xs rounded-xl bg-white border-slate-200"
                  placeholder="To date"
                />
                {(historySearch ||
                  historyShiftFilter !== 'ALL' ||
                  historyDateFrom ||
                  historyDateTo) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setHistorySearch('');
                      setHistoryShiftFilter('ALL');
                      setHistoryDateFrom('');
                      setHistoryDateTo('');
                    }}
                    className="h-9 px-2 text-xs text-rose-600 hover:bg-rose-50"
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* History Data Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
            {historyLoading ? (
              <div className="p-12 text-center">
                <RefreshCw className="mx-auto size-8 animate-spin text-[#107569]" />
                <p className="mt-3 text-sm font-medium text-slate-600">
                  Loading shift change history...
                </p>
              </div>
            ) : historyRows.length === 0 ? (
              <div className="p-16 text-center">
                <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                  <CalendarDays className="size-7" />
                </div>
                <h3 className="mt-4 text-base font-bold text-slate-800">
                  No shift changes recorded yet.
                </h3>
                <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
                  Whenever an administrator assigns staff to a shift, modifies schedules,
                  or removes assignments, an audit entry will be safely logged here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-[#E2E8E5] bg-[#F4F9F6] text-xs font-bold uppercase tracking-wider text-[#163A2E]">
                      <th className="py-3.5 pl-6 pr-4">Employee</th>
                      <th className="py-3.5 px-4">Previous Shift</th>
                      <th className="py-3.5 px-4">New Shift</th>
                      <th className="py-3.5 px-4">Effective Date</th>
                      <th className="py-3.5 px-4">Changed By</th>
                      <th className="py-3.5 px-4">Reason</th>
                      <th className="py-3.5 pl-4 pr-6 text-right">Recorded At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {historyRows.map((h) => {
                      const empName = h.employee
                        ? `${h.employee.firstName || ''} ${h.employee.lastName || ''}`.trim() ||
                          h.employee.employeeCode ||
                          `Employee #${h.employeeId}`
                        : `Employee #${h.employeeId}`;

                      return (
                        <tr
                          key={h.id}
                          className="transition-colors hover:bg-slate-50/70"
                        >
                          {/* Employee info */}
                          <td className="py-3.5 pl-6 pr-4">
                            <div className="font-semibold text-slate-900">
                              {empName}
                            </div>
                            <div className="text-xs text-slate-500 font-mono">
                              {h.employee?.employeeCode || `ID: ${h.employeeId}`}
                              {h.employee?.department?.name && (
                                <span className="text-slate-400 font-sans ml-1.5">
                                  · {h.employee.department.name}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Previous Shift */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {h.previousShift ? (
                              <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-700">
                                <Clock className="size-3 text-slate-400" />
                                <span className="font-medium">
                                  {h.previousShift.name}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  ({h.previousShift.code})
                                </span>
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400 italic">
                                None (Unassigned)
                              </span>
                            )}
                          </td>

                          {/* New Shift */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {h.newShift ? (
                              <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                                <Clock className="size-3 text-emerald-600" />
                                <span>{h.newShift.name}</span>
                                <span className="text-[10px] text-emerald-600 font-mono">
                                  ({h.newShift.code})
                                </span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-700">
                                <UserMinus className="size-3" />
                                <span>Unassigned</span>
                              </span>
                            )}
                          </td>

                          {/* Effective Date */}
                          <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-700 font-medium">
                            {formatDate(h.effectiveFrom)}
                          </td>

                          {/* Changed By */}
                          <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-600">
                            <span className="inline-flex items-center gap-1">
                              <span className="size-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-bold">
                                {(h.changedByName || 'A')[0]}
                              </span>
                              <span>{h.changedByName || 'Administrator'}</span>
                            </span>
                          </td>

                          {/* Reason */}
                          <td className="py-3.5 px-4 max-w-xs text-xs text-slate-600 truncate">
                            {h.reason || 'Shift assignment update'}
                          </td>

                          {/* Recorded Timestamp */}
                          <td className="py-3.5 pl-4 pr-6 text-right whitespace-nowrap text-xs text-slate-400">
                            {formatDateTime(h.createdAt)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 6. CREATE / EDIT SHIFT DRAWER ───────────────────────────────────── */}
      <FormDrawer
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editingId ? 'Edit Shift Schedule' : 'Create New Shift'}
        description="Configure shift timings, break policy, working hours and weekly days."
        onSubmit={submit}
        loading={saving}
        submitLabel={editingId ? 'Update Shift' : 'Create Shift'}
        size="medium"
      >
        <div className="space-y-4 text-sm">
          {/* Shift Name and Code */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <Label className="text-xs font-bold text-slate-700">
                Shift Name <span className="text-rose-500">*</span>
              </Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. General Day Shift"
                className="mt-1 h-9 rounded-xl text-sm"
                required
              />
            </div>
            <div>
              <Label className="text-xs font-bold text-slate-700">
                Shift Code <span className="text-rose-500">*</span>
              </Label>
              <Input
                value={form.code}
                onChange={(e) =>
                  setForm({ ...form, code: e.target.value.toUpperCase() })
                }
                placeholder="e.g. GDS-01"
                className="mt-1 h-9 rounded-xl text-sm uppercase font-mono"
                required
              />
            </div>
          </div>

          {/* Timings: Start & End */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <Label className="text-xs font-bold text-slate-700">
                Start Time <span className="text-rose-500">*</span>
              </Label>
              <Input
                value={form.startTime}
                onChange={(e) => updateTimesAndHours('startTime', e.target.value)}
                placeholder="09:30 AM"
                className="mt-1 h-9 rounded-xl text-sm font-medium"
                required
              />
              <p className="mt-1 text-[11px] text-slate-400">
                Format: HH:MM AM/PM (e.g. 09:30 AM)
              </p>
            </div>
            <div>
              <Label className="text-xs font-bold text-slate-700">
                End Time <span className="text-rose-500">*</span>
              </Label>
              <Input
                value={form.endTime}
                onChange={(e) => updateTimesAndHours('endTime', e.target.value)}
                placeholder="06:30 PM"
                className="mt-1 h-9 rounded-xl text-sm font-medium"
                required
              />
              <p className="mt-1 text-[11px] text-slate-400">
                Overnight shifts supported (e.g. 09:00 PM to 01:00 AM)
              </p>
            </div>
          </div>

          {/* Break and Hours */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <Label className="text-xs font-bold text-slate-700">
                Break Duration (mins)
              </Label>
              <Input
                type="number"
                min="0"
                step="5"
                value={form.breakDurationMinutes}
                onChange={(e) =>
                  updateTimesAndHours('breakDurationMinutes', e.target.value)
                }
                className="mt-1 h-9 rounded-xl text-sm"
              />
            </div>
            <div>
              <Label className="text-xs font-bold text-slate-700">
                Grace Period (mins)
              </Label>
              <Input
                type="number"
                min="0"
                step="5"
                value={form.gracePeriodMinutes}
                onChange={(e) =>
                  setForm({ ...form, gracePeriodMinutes: e.target.value })
                }
                className="mt-1 h-9 rounded-xl text-sm"
              />
            </div>
            <div>
              <Label className="text-xs font-bold text-slate-700">
                Net Working Hours
              </Label>
              <div className="relative mt-1">
                <Input
                  type="number"
                  step="0.1"
                  value={form.durationHours}
                  onChange={(e) =>
                    setForm({ ...form, durationHours: e.target.value })
                  }
                  className="h-9 rounded-xl text-sm font-bold text-[#107569] bg-emerald-50/50 border-emerald-200"
                />
              </div>
            </div>
          </div>

          {/* Working Days Chips */}
          <div>
            <Label className="text-xs font-bold text-slate-700">
              Working Days Schedule
            </Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {DAYS.map((day) => {
                const isSelected = form.workingDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => {
                      setForm((prev) => ({
                        ...prev,
                        workingDays: isSelected
                          ? prev.workingDays.filter((d) => d !== day)
                          : [...prev.workingDays, day],
                      }));
                    }}
                    className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-[#107569] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {day.slice(0, 3)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Shift Type Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
            <label className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 cursor-pointer hover:bg-slate-50">
              <input
                type="checkbox"
                checked={form.isNightShift}
                onChange={(e) =>
                  setForm({ ...form, isNightShift: e.target.checked })
                }
                className="size-4 rounded text-[#107569] focus:ring-[#107569]"
              />
              <div>
                <p className="font-bold text-xs text-slate-800">Night Shift</p>
                <p className="text-[11px] text-slate-500">
                  Operates overnight across midnight hours
                </p>
              </div>
            </label>

            <label className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 cursor-pointer hover:bg-slate-50">
              <input
                type="checkbox"
                checked={form.isRotational}
                onChange={(e) =>
                  setForm({ ...form, isRotational: e.target.checked })
                }
                className="size-4 rounded text-[#107569] focus:ring-[#107569]"
              />
              <div>
                <p className="font-bold text-xs text-slate-800">
                  Rotational Shift
                </p>
                <p className="text-[11px] text-slate-500">
                  Assigned employees rotate on schedules
                </p>
              </div>
            </label>
          </div>

          {/* Status & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <Label className="text-xs font-bold text-slate-700">Status</Label>
              <Select
                value={form.status}
                onValueChange={(val) => setForm({ ...form, status: val })}
              >
                <SelectTrigger className="mt-1 h-9 rounded-xl text-sm bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active (Operational)</SelectItem>
                  <SelectItem value="INACTIVE">Inactive (Archived)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-bold text-slate-700">
                Notes / Internal Description
              </Label>
              <Input
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Optional shift guidelines or remarks"
                className="mt-1 h-9 rounded-xl text-sm"
              />
            </div>
          </div>
        </div>
      </FormDrawer>

      {/* ── 7. VIEW DETAILS & MANAGE EMPLOYEES DRAWER ───────────────────────── */}
      <FormDrawer
        open={detailOpen}
        onOpenChange={setDetailOpen}
        title={detail?.name || 'Shift Details'}
        description={
          detail
            ? `${detail.code} · ${detail.startTime} – ${detail.endTime} (${detail.durationHours ?? 8} hrs)`
            : ''
        }
        showFooter={false}
        size="medium"
      >
        {detail && (
          <div className="space-y-5 text-sm">
            {/* Shift Summary Card */}
            <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/40 p-4 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-emerald-950 text-base">
                    {detail.name}
                  </span>
                  <span className="rounded bg-emerald-100 px-1.5 py-0.5 font-mono text-xs font-bold text-emerald-800">
                    {detail.code}
                  </span>
                </div>
                <span className="rounded-full bg-emerald-200/80 px-2.5 py-0.5 text-xs font-bold text-emerald-900">
                  {detail.status}
                </span>
              </div>
              <div className="flex flex-wrap gap-4 text-xs text-slate-600">
                <span>
                  ⏰ {detail.startTime} – {detail.endTime}
                </span>
                <span>⏱️ {detail.durationHours ?? '—'} working hours</span>
                <span>☕ {detail.breakDurationMinutes ?? 0} min break</span>
                <span>
                  👥 {detail.employees?.length ?? 0} employees assigned
                </span>
              </div>
            </div>

            {/* Sub-tabs: Currently Assigned vs Assign More Staff */}
            <div className="flex border-b border-slate-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => setAssignmentTab('assigned')}
                className={`border-b-2 pb-2.5 px-3 transition-colors ${
                  assignmentTab === 'assigned'
                    ? 'border-[#107569] text-[#107569]'
                    : 'border-transparent text-slate-400 hover:text-slate-700'
                }`}
              >
                Assigned Staff ({detail.employees?.length ?? 0})
              </button>
              {canManage && (
                <button
                  type="button"
                  onClick={() => setAssignmentTab('assign_more')}
                  className={`border-b-2 pb-2.5 px-3 transition-colors ${
                    assignmentTab === 'assign_more'
                      ? 'border-[#107569] text-[#107569]'
                      : 'border-transparent text-slate-400 hover:text-slate-700'
                  }`}
                >
                  + Assign Employees
                </button>
              )}
            </div>

            {/* Tab: Assigned Employees */}
            {assignmentTab === 'assigned' && (
              <div className="space-y-3">
                {(!detail.employees || detail.employees.length === 0) ? (
                  <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-slate-500">
                    <Users className="mx-auto size-8 text-slate-400" />
                    <p className="mt-2 text-sm font-semibold">
                      No employees assigned to this shift yet.
                    </p>
                    {canManage && (
                      <Button
                        size="sm"
                        onClick={() => setAssignmentTab('assign_more')}
                        className="mt-3 bg-[#107569] text-white hover:bg-[#0e6359]"
                      >
                        Assign Employees
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
                    {detail.employees.map((emp) => {
                      const name = `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.employeeCode || `Employee #${emp.id}`;
                      return (
                        <div
                          key={emp.id}
                          className="flex items-center justify-between p-3 transition hover:bg-slate-50"
                        >
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 text-sm">
                              {name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {emp.employeeCode} · {emp.department?.name || 'General'}{' '}
                              {emp.designation?.name ? `(${emp.designation.name})` : ''}
                            </p>
                          </div>
                          {canManage && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setUnassignTarget({ id: emp.id, name })
                              }
                              className="text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                            >
                              <UserMinus className="size-3.5 mr-1" />
                              Remove
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Tab: Assign More Staff */}
            {assignmentTab === 'assign_more' && canManage && (
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
                  <Input
                    value={employeeSearch}
                    onChange={(e) => setEmployeeSearch(e.target.value)}
                    placeholder="Search employees to assign..."
                    className="pl-8 h-9 text-xs rounded-xl"
                  />
                </div>

                <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100">
                  {availableEmployees.map((emp) => {
                    const empId = Number(emp.recordId || emp.id);
                    const isChecked = selectedEmployees.includes(empId);
                    return (
                      <label
                        key={empId}
                        className="flex items-center gap-3 p-2.5 cursor-pointer hover:bg-slate-50"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedEmployees((prev) => [...prev, empId]);
                            } else {
                              setSelectedEmployees((prev) =>
                                prev.filter((id) => id !== empId)
                              );
                            }
                          }}
                          className="size-4 rounded text-[#107569] focus:ring-[#107569]"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-xs text-slate-900">
                            {emp.name}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            ID: {emp.id} · {emp.department || 'Employee'}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>

                <div>
                  <Label className="text-xs font-bold text-slate-700">
                    Reason for Assignment / Shift Change (Optional)
                  </Label>
                  <Input
                    value={assignmentReason}
                    onChange={(e) => setAssignmentReason(e.target.value)}
                    placeholder="e.g. Scheduled rotation or project transfer"
                    className="mt-1 h-9 text-xs rounded-xl"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAssignmentTab('assigned')}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveAssignments}
                    disabled={saving}
                    className="bg-[#107569] text-white hover:bg-[#0e6359]"
                  >
                    {saving ? 'Saving...' : 'Save Assignments'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </FormDrawer>

      {/* ── 8. CONFIRMATION DIALOG: DEACTIVATE SHIFT ────────────────────────── */}
      <Dialog
        open={Boolean(deactivateTarget)}
        onOpenChange={(open) => !open && setDeactivateTarget(null)}
      >
        <DialogContent className="sm:max-w-md bg-white rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Deactivate Shift
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-600 mt-2">
              Are you sure you want to deactivate{' '}
              <span className="font-semibold text-slate-900">
                {deactivateTarget?.name} ({deactivateTarget?.code})
              </span>
              ? The shift will be marked as inactive and archived.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex gap-2 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setDeactivateTarget(null)}
              disabled={deactivating}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeactivate}
              disabled={deactivating}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              {deactivating ? 'Deactivating...' : 'Deactivate Shift'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── 9. CONFIRMATION DIALOG: UNASSIGN EMPLOYEE ───────────────────────── */}
      <Dialog
        open={Boolean(unassignTarget)}
        onOpenChange={(open) => !open && setUnassignTarget(null)}
      >
        <DialogContent className="sm:max-w-md bg-white rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Remove Employee from Shift
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-600 mt-2">
              Are you sure you want to unassign{' '}
              <span className="font-semibold text-slate-900">
                {unassignTarget?.name}
              </span>{' '}
              from {detail?.name}? An entry will be recorded in the shift assignment
              audit history.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex gap-2 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setUnassignTarget(null)}
              disabled={unassigning}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmUnassign}
              disabled={unassigning}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              {unassigning ? 'Removing...' : 'Unassign Staff'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
