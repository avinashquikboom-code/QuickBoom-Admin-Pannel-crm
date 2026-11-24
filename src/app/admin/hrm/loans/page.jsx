'use client';

import * as React from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { FormDrawer } from '@/components/common/drawers/FormDrawer';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Coins,
  IndianRupee,
  Search,
  Filter,
  RefreshCw,
  Download,
  Plus,
  Eye,
  Check,
  X,
  Trash2,
  Building2,
  User,
  AlertCircle,
  Calendar,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import {
  approveLoan,
  hrmError,
  loadEmployees,
  loadLoans,
  rejectLoan,
  removeLoan,
  sessionCan,
  submitLoan,
} from '@/modules/hrm/hrm-api';
import { TruncatedText } from '@/components/common/TruncatedText';

const inr = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const STATUS_TABS = [
  { id: 'ALL', label: 'All Loans' },
  { id: 'PENDING', label: 'Pending' },
  { id: 'ACTIVE', label: 'Active' },
  { id: 'APPROVED', label: 'Approved' },
  { id: 'REJECTED', label: 'Rejected' },
  { id: 'PAID', label: 'Paid' },
];

const STATUS_CONFIG = {
  PENDING: { label: 'Pending', color: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500 animate-pulse' },
  ACTIVE: { label: 'Active', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  APPROVED: { label: 'Approved', color: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  REJECTED: { label: 'Rejected', color: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
  PAID: { label: 'Paid', color: 'bg-slate-100 text-slate-700 border-slate-200', dot: 'bg-slate-500' },
};

const emptyForm = {
  employeeId: '',
  loanTypeId: '',
  loanAmount: '',
  reason: '',
  termMonths: 12,
  interestRate: 0,
  monthlyEmi: '',
  notes: '',
};

export default function LoansPage() {
  const [rows, setRows] = React.useState([]);
  const [metrics, setMetrics] = React.useState({});
  const [types, setTypes] = React.useState([]);
  const [employees, setEmployees] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState('');

  // Filters
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('ALL');
  const [employeeIdFilter, setEmployeeIdFilter] = React.useState('ALL');
  const [page, setPage] = React.useState(1);
  const [pagination, setPagination] = React.useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [refresh, setRefresh] = React.useState(0);

  // Drawers & Modals
  const [formOpen, setFormOpen] = React.useState(false);
  const [submittingLoan, setSubmittingLoan] = React.useState(false);
  const [form, setForm] = React.useState(emptyForm);

  const [selectedLoan, setSelectedLoan] = React.useState(null);
  const [deletingLoan, setDeletingLoan] = React.useState(null);
  const [deleteBusy, setDeleteBusy] = React.useState(false);

  // Review states
  const [approvalAmount, setApprovalAmount] = React.useState('');
  const [approvalEmi, setApprovalEmi] = React.useState('');
  const [approvalTenure, setApprovalTenure] = React.useState('');
  const [rejectReason, setRejectReason] = React.useState('');
  const [reviewBusy, setReviewBusy] = React.useState(false);

  const [canManage, setCanManage] = React.useState(false);
  React.useEffect(() => {
    setCanManage(sessionCan('LOAN') || sessionCan('HRM'));
  }, []);

  // Fetch loans & employees safely
  React.useEffect(() => {
    let active = true;
    setLoading(true);

    Promise.allSettled([
      loadLoans({
        page,
        limit: 20,
        search: search.trim() || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        employeeId: employeeIdFilter !== 'ALL' ? employeeIdFilter : undefined,
      }),
      loadEmployees().catch(() => []),
    ])
      .then(([loansRes, empRes]) => {
        if (!active) return;

        if (loansRes.status === 'fulfilled' && loansRes.value) {
          setRows(loansRes.value.rows || []);
          setMetrics(loansRes.value.metrics || {});
          setTypes(loansRes.value.types || []);
          if (loansRes.value.pagination) {
            setPagination(loansRes.value.pagination);
          } else {
            setPagination({
              page,
              limit: 20,
              total: loansRes.value.rows?.length || 0,
              totalPages: Math.max(1, Math.ceil((loansRes.value.rows?.length || 0) / 20)),
            });
          }
          setError('');
        } else {
          setRows([]);
          setError(hrmError(loansRes.reason));
        }

        if (empRes.status === 'fulfilled' && Array.isArray(empRes.value)) {
          setEmployees(empRes.value);
        } else {
          setEmployees([]);
        }
      })
      .catch((err) => {
        if (active) setError(hrmError(err));
      })
      .finally(() => {
        if (active) {
          setLoading(false);
          setRefreshing(false);
        }
      });

    return () => {
      active = false;
    };
  }, [refresh, page, search, statusFilter, employeeIdFilter]);

  // Handle Refresh
  const handleRefresh = () => {
    setRefreshing(true);
    setRefresh((v) => v + 1);
  };

  // Client-side search & filtering fallback
  const filteredRows = React.useMemo(() => {
    let result = rows;
    if (statusFilter !== 'ALL') {
      result = result.filter((r) => String(r.status || '').toUpperCase() === statusFilter);
    }
    if (employeeIdFilter !== 'ALL') {
      result = result.filter(
        (r) =>
          String(r.employeeId) === employeeIdFilter ||
          String(r.employee?.id) === employeeIdFilter ||
          String(r.employee?.recordId) === employeeIdFilter
      );
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((r) => {
        const name = String(r.employeeName || '').toLowerCase();
        const code = String(r.employee?.employeeCode || '').toLowerCase();
        const dept = String(r.department || '').toLowerCase();
        const reason = String(r.reason || '').toLowerCase();
        const id = String(r.id || '').toLowerCase();
        return name.includes(q) || code.includes(q) || dept.includes(q) || reason.includes(q) || id.includes(q);
      });
    }
    return result;
  }, [rows, statusFilter, employeeIdFilter, search]);

  // Aggregate stats
  const stats = React.useMemo(() => {
    const totalCount = metrics.totalLoans ?? pagination.total ?? rows.length;
    const pendingCount =
      metrics.pendingLoans ?? rows.filter((r) => String(r.status || '').toUpperCase() === 'PENDING').length;
    const activeCount =
      metrics.activeLoans ??
      rows.filter((r) => ['ACTIVE', 'APPROVED'].includes(String(r.status || '').toUpperCase())).length;
    const totalOutstanding =
      metrics.totalOutstanding ??
      rows.reduce(
        (sum, r) => sum + (Number(r.remainingBalance) || Number(r.approvedAmount) || Number(r.loanAmount) || 0),
        0
      );

    return {
      totalLoans: totalCount,
      pendingLoans: pendingCount,
      activeLoans: activeCount,
      totalOutstanding,
    };
  }, [metrics, pagination.total, rows]);

  // Export CSV
  const handleExportCSV = () => {
    if (filteredRows.length === 0) {
      toast.error('No loans available to export');
      return;
    }
    const headers = [
      'Loan ID',
      'Employee Code',
      'Employee Name',
      'Department',
      'Requested Amount',
      'Approved Amount',
      'Monthly EMI',
      'Tenure (Months)',
      'Interest Rate (%)',
      'Remaining Balance',
      'Status',
      'Reason',
      'Created Date',
    ];

    const csvRows = filteredRows.map((r) => [
      `"${r.id}"`,
      `"${r.employee?.employeeCode || ''}"`,
      `"${r.employeeName || ''}"`,
      `"${r.department || ''}"`,
      r.loanAmount || 0,
      r.approvedAmount ?? '',
      r.monthlyEmi || 0,
      r.termMonths || 12,
      r.interestRate ?? 0,
      r.remainingBalance ?? '',
      `"${r.status || ''}"`,
      `"${(r.reason || '').replace(/"/g, '""')}"`,
      `"${r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ''}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...csvRows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `hrm_loans_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Loans exported to CSV');
  };

  // Choose loan scheme
  const chooseType = (id) => {
    const type = types.find((item) => String(item.id) === id);
    setForm((prev) => {
      const termMonths = type?.maxMonths || prev.termMonths || 12;
      const interestRate = type?.interestRate ?? prev.interestRate ?? 0;
      const amt = Number(prev.loanAmount) || 0;
      const monthlyEmi = amt > 0 ? Math.round((amt / termMonths) * 100) / 100 : '';

      return {
        ...prev,
        loanTypeId: id,
        termMonths,
        interestRate,
        monthlyEmi: monthlyEmi ? String(monthlyEmi) : prev.monthlyEmi,
      };
    });
  };

  // Auto calculate EMI when amount or tenure changes in form
  const handleAmountChange = (val) => {
    const num = Number(val) || 0;
    const months = Number(form.termMonths) || 12;
    const calcEmi = num > 0 && months > 0 ? Math.round((num / months) * 100) / 100 : '';
    setForm((prev) => ({
      ...prev,
      loanAmount: val,
      monthlyEmi: calcEmi ? String(calcEmi) : '',
    }));
  };

  const handleTenureChange = (val) => {
    const months = Number(val) || 1;
    const num = Number(form.loanAmount) || 0;
    const calcEmi = num > 0 && months > 0 ? Math.round((num / months) * 100) / 100 : '';
    setForm((prev) => ({
      ...prev,
      termMonths: val,
      monthlyEmi: calcEmi ? String(calcEmi) : '',
    }));
  };

  // Submit Loan Request
  const handleSubmitLoan = async (event) => {
    event.preventDefault();
    const empId = Number(form.employeeId);
    if (!empId || isNaN(empId)) {
      toast.error('Please select an employee');
      return;
    }
    const amt = Number(form.loanAmount);
    if (!amt || isNaN(amt) || amt <= 0) {
      toast.error('Please enter a valid loan amount');
      return;
    }
    if (!form.reason.trim()) {
      toast.error('Please specify the loan purpose / reason');
      return;
    }

    setSubmittingLoan(true);
    const type = types.find((item) => String(item.id) === String(form.loanTypeId));

    try {
      await submitLoan({
        employeeId: empId,
        loanAmount: amt,
        reason: form.reason.trim(),
        termMonths: Number(form.termMonths) || 12,
        interestRate: Number(form.interestRate) || 0,
        monthlyEmi: form.monthlyEmi ? Number(form.monthlyEmi) : undefined,
        notes: type ? `Scheme: ${type.code || type.name}` : form.notes || undefined,
      });

      setFormOpen(false);
      setForm(emptyForm);
      setRefresh((v) => v + 1);
      toast.success('Loan request submitted successfully!');
    } catch (err) {
      toast.error(hrmError(err) || 'Failed to submit loan request');
    } finally {
      setSubmittingLoan(false);
    }
  };

  // Approve Loan
  const handleApprove = async (row, customValues = null) => {
    setReviewBusy(true);
    try {
      const payload = {
        approvedAmount: customValues?.approvedAmount ? Number(customValues.approvedAmount) : row.loanAmount,
        monthlyEmi: customValues?.monthlyEmi
          ? Number(customValues.monthlyEmi)
          : row.monthlyEmi || Math.round((row.loanAmount / (row.termMonths || 12)) * 100) / 100,
        termMonths: customValues?.termMonths ? Number(customValues.termMonths) : row.termMonths || 12,
      };

      await approveLoan(row.id, payload);
      setRefresh((v) => v + 1);
      setSelectedLoan(null);
      toast.success(`Loan #${row.id} approved successfully!`);
    } catch (err) {
      toast.error(hrmError(err) || 'Could not approve loan');
    } finally {
      setReviewBusy(false);
    }
  };

  // Reject Loan
  const handleReject = async (e) => {
    if (e) e.preventDefault();
    if (!selectedLoan) return;
    if (!rejectReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    setReviewBusy(true);
    try {
      await rejectLoan(selectedLoan.id, rejectReason.trim());
      setSelectedLoan(null);
      setRejectReason('');
      setRefresh((v) => v + 1);
      toast.success(`Loan #${selectedLoan.id} rejected.`);
    } catch (err) {
      toast.error(hrmError(err) || 'Could not reject loan');
    } finally {
      setReviewBusy(false);
    }
  };

  // Delete Loan
  const handleDeleteLoan = async () => {
    if (!deletingLoan) return;
    setDeleteBusy(true);
    try {
      await removeLoan(deletingLoan.id);
      setDeletingLoan(null);
      setRefresh((v) => v + 1);
      toast.success('Loan record deleted');
    } catch (err) {
      toast.error(hrmError(err) || 'Failed to delete loan');
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <div className="w-full space-y-6 pb-20">
      {/* ── 1. Page Header ────────────────────────────────────────────── */}
      <PageHeader
        title="Loans"
        category="HUMAN RESOURCE MANAGEMENT"
        description="Employee loan requests, approvals, monthly EMI deductions, and remaining balance tracking."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="h-9 gap-1.5 rounded-xl border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50"
            >
              <Download className="size-3.5 text-slate-500" />
              <span>Export CSV</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="h-9 gap-1.5 rounded-xl border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50"
            >
              <RefreshCw className={`size-3.5 text-slate-500 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
            {canManage && (
              <Button
                size="sm"
                onClick={() => {
                  setForm(emptyForm);
                  setFormOpen(true);
                }}
                className="h-9 gap-1.5 rounded-xl bg-[#16A34A] px-3.5 text-xs font-semibold text-white shadow-xs hover:bg-[#15803D]"
              >
                <Plus className="size-3.5" />
                <span>Apply For Loan</span>
              </Button>
            )}
          </div>
        }
      />

      {/* ── 2. Compact 4 KPI Statistics Cards ────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Total Loans */}
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-xs transition-all hover:border-emerald-300 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Loans
            </span>
            <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-50 text-[#16A34A] ring-1 ring-emerald-200/60">
              <FileText className="size-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black tracking-tight text-slate-900">
              {stats.totalLoans}
            </span>
            <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">
              On File
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Lifetime staff loan records</p>
        </div>

        {/* Card 2: Pending Approval */}
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-xs transition-all hover:border-amber-300 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Pending Approval
            </span>
            <div className="flex size-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600 ring-1 ring-amber-200/60">
              <Clock className="size-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black tracking-tight text-slate-900">
              {stats.pendingLoans}
            </span>
            <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md">
              Requires Review
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Awaiting management authorization</p>
        </div>

        {/* Card 3: Active Loans */}
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-xs transition-all hover:border-blue-300 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Active Loans
            </span>
            <div className="flex size-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-200/60">
              <CheckCircle2 className="size-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black tracking-tight text-slate-900">
              {stats.activeLoans}
            </span>
            <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded-md">
              Deducting EMI
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Active payroll deduction schemes</p>
        </div>

        {/* Card 4: Total Outstanding */}
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-xs transition-all hover:border-emerald-300 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Outstanding
            </span>
            <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-50 text-[#16A34A] ring-1 ring-emerald-200/60">
              <IndianRupee className="size-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black tracking-tight text-[#16A34A]">
              {inr(stats.totalOutstanding)}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Remaining workforce loan balance</p>
        </div>
      </div>

      {/* ── 3. Status Filter Tabs ─────────────────────────────────────── */}
      <div className="flex items-center border-b border-slate-200 pb-px overflow-x-auto no-scrollbar">
        <div className="flex space-x-1.5">
          {STATUS_TABS.map((tab) => {
            const isSelected = statusFilter === tab.id;
            const count =
              tab.id === 'ALL'
                ? rows.length
                : rows.filter((r) => String(r.status || '').toUpperCase() === tab.id).length;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`flex items-center gap-1.5 border-b-2 px-3.5 py-2 text-xs font-bold transition-all whitespace-nowrap ${
                  isSelected
                    ? 'border-[#16A34A] text-[#16A34A]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                    isSelected ? 'bg-emerald-100 text-[#16A34A]' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 4. Search & Controls Filter Bar ──────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 bg-white p-3 shadow-xs">
        {/* Search Input */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by employee name, code, department, or reason..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-9 text-xs text-slate-800 placeholder-slate-400 transition-all focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
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

        {/* Employee Filter Dropdown */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Filter by Employee"
            value={employeeIdFilter}
            onChange={(e) => setEmployeeIdFilter(e.target.value)}
            className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-xs hover:border-slate-300 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 max-w-[200px]"
          >
            <option value="ALL">All Employees</option>
            {employees.map((emp) => (
              <option key={emp.recordId || emp.id} value={String(emp.recordId || emp.id)}>
                {emp.name} ({emp.employeeCode || emp.id})
              </option>
            ))}
          </select>

          {(statusFilter !== 'ALL' || employeeIdFilter !== 'ALL' || search) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStatusFilter('ALL');
                setEmployeeIdFilter('ALL');
                setSearch('');
              }}
              className="h-9 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700 rounded-xl"
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* ── 5. Compact Modern Loans Table ────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="border-b border-slate-200 bg-slate-50/80 font-bold uppercase tracking-wider text-slate-600">
              <tr>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Tenure & Interest</th>
                <th className="px-4 py-3">Monthly EMI</th>
                <th className="px-4 py-3">Remaining Balance</th>
                <th className="px-4 py-3">Purpose / Reason</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-slate-400">
                    <RefreshCw className="mx-auto mb-2 size-5 animate-spin text-emerald-600" />
                    Loading employee loans…
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-14 text-center">
                    <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-3">
                      <IndianRupee className="size-6" />
                    </div>
                    <p className="text-sm font-semibold text-slate-800">No loans match these filters</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {search || statusFilter !== 'ALL' || employeeIdFilter !== 'ALL'
                        ? 'Try adjusting your search criteria.'
                        : 'Submit a new employee loan request to get started.'}
                    </p>
                    {canManage && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setForm(emptyForm);
                          setFormOpen(true);
                        }}
                        className="mt-4 h-8 gap-1 rounded-xl bg-[#16A34A] px-3 text-xs text-white hover:bg-[#15803D]"
                      >
                        <Plus className="size-3" />
                        <span>Apply For Loan</span>
                      </Button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => {
                  const statusKey = String(row.status || 'PENDING').toUpperCase();
                  const statusObj = STATUS_CONFIG[statusKey] || STATUS_CONFIG.PENDING;
                  const isPending = statusKey === 'PENDING';
                  const dateStr = row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '—';

                  return (
                    <tr
                      key={row.id}
                      className="transition-colors hover:bg-slate-50/70 cursor-pointer"
                      onClick={() => {
                        setSelectedLoan(row);
                        setApprovalAmount(String(row.loanAmount || ''));
                        setApprovalTenure(String(row.termMonths || 12));
                        setApprovalEmi(String(row.monthlyEmi || ''));
                        setRejectReason('');
                      }}
                    >
                      {/* Employee Column */}
                      <td className="px-4 py-3 max-w-[200px]" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-700 text-xs">
                            {(row.employeeName || 'E')[0]}
                          </div>
                          <div className="min-w-0">
                            <TruncatedText
                              value={row.employeeName || 'Staff Member'}
                              maxWidth="max-w-[150px]"
                              label="Employee"
                              className="font-bold text-slate-900"
                            />
                            <div className="text-[11px] text-slate-400 truncate">
                              {row.employee?.employeeCode || `ID #${row.employeeId}`} · {row.department || 'General'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-bold text-slate-900">{inr(row.loanAmount)}</div>
                        {row.approvedAmount != null && (
                          <div className="text-[10px] text-emerald-700 font-medium">
                            Approved: {inr(row.approvedAmount)}
                          </div>
                        )}
                      </td>

                      {/* Tenure & Interest */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-medium text-slate-800">{row.termMonths || 12} Months</span>
                        <div className="text-[10px] text-slate-400">{row.interestRate ?? 0}% Interest</div>
                      </td>

                      {/* Monthly EMI */}
                      <td className="px-4 py-3 whitespace-nowrap font-mono font-bold text-slate-700">
                        {row.monthlyEmi ? `${inr(row.monthlyEmi)}/mo` : '—'}
                      </td>

                      {/* Remaining Balance */}
                      <td className="px-4 py-3 whitespace-nowrap font-bold text-slate-900">
                        {row.remainingBalance != null ? inr(row.remainingBalance) : '—'}
                      </td>

                      {/* Reason */}
                      <td className="px-4 py-3 max-w-[220px]" onClick={(e) => e.stopPropagation()}>
                        <TruncatedText
                          value={row.reason || 'No description provided'}
                          maxWidth="max-w-[200px]"
                          label="Loan Reason"
                          className="text-slate-600 text-[11px]"
                        />
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${statusObj.color}`}
                        >
                          <span className={`size-1.5 rounded-full ${statusObj.dot}`} />
                          {statusObj.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedLoan(row);
                              setApprovalAmount(String(row.loanAmount || ''));
                              setApprovalTenure(String(row.termMonths || 12));
                              setApprovalEmi(String(row.monthlyEmi || ''));
                              setRejectReason('');
                            }}
                            className="h-8 gap-1 rounded-lg px-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                          >
                            <Eye className="size-3.5" />
                            <span>View</span>
                          </Button>

                          {canManage && isPending && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleApprove(row)}
                              className="h-8 gap-1 rounded-lg px-2 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                              title="Quick Approve"
                            >
                              <Check className="size-3.5" />
                              <span>Approve</span>
                            </Button>
                          )}

                          {canManage && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-slate-400 hover:text-slate-700 rounded-lg"
                                >
                                  <span className="sr-only">Actions</span>
                                  •••
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-40 rounded-xl bg-white shadow-xl">
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedLoan(row);
                                    setApprovalAmount(String(row.loanAmount || ''));
                                    setApprovalTenure(String(row.termMonths || 12));
                                    setApprovalEmi(String(row.monthlyEmi || ''));
                                    setRejectReason('');
                                  }}
                                  className="cursor-pointer text-xs font-medium text-slate-700"
                                >
                                  <Eye className="mr-2 size-3.5 text-slate-500" />
                                  Inspect Details
                                </DropdownMenuItem>

                                {isPending && (
                                  <>
                                    <DropdownMenuItem
                                      onClick={() => handleApprove(row)}
                                      className="cursor-pointer text-xs font-medium text-emerald-700 hover:bg-emerald-50"
                                    >
                                      <Check className="mr-2 size-3.5 text-emerald-600" />
                                      Approve Loan
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setSelectedLoan(row);
                                        setRejectReason('');
                                      }}
                                      className="cursor-pointer text-xs font-medium text-rose-700 hover:bg-rose-50"
                                    >
                                      <X className="mr-2 size-3.5 text-rose-600" />
                                      Reject Loan
                                    </DropdownMenuItem>
                                  </>
                                )}

                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => setDeletingLoan(row)}
                                  className="cursor-pointer text-xs font-medium text-rose-600 hover:bg-rose-50"
                                >
                                  <Trash2 className="mr-2 size-3.5 text-rose-500" />
                                  Delete Record
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
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

        {/* Mobile Responsive Cards View (< 768px) */}
        <div className="block md:hidden divide-y divide-slate-100">
          {loading ? (
            <div className="py-10 text-center text-xs text-slate-400">
              <RefreshCw className="mx-auto mb-2 size-5 animate-spin text-emerald-600" />
              Loading employee loans…
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="py-10 text-center px-4">
              <IndianRupee className="mx-auto mb-2 size-6 text-slate-400" />
              <p className="text-sm font-semibold text-slate-800">No loans match these filters</p>
              <p className="mt-1 text-xs text-slate-500">Try adjusting your filters.</p>
            </div>
          ) : (
            filteredRows.map((row) => {
              const statusKey = String(row.status || 'PENDING').toUpperCase();
              const statusObj = STATUS_CONFIG[statusKey] || STATUS_CONFIG.PENDING;
              const isPending = statusKey === 'PENDING';

              return (
                <div
                  key={row.id}
                  onClick={() => {
                    setSelectedLoan(row);
                    setApprovalAmount(String(row.loanAmount || ''));
                    setApprovalTenure(String(row.termMonths || 12));
                    setApprovalEmi(String(row.monthlyEmi || ''));
                    setRejectReason('');
                  }}
                  className="p-4 space-y-3 transition-colors hover:bg-slate-50/70 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-700 text-xs">
                        {(row.employeeName || 'E')[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 text-xs truncate">{row.employeeName}</p>
                        <p className="text-[10px] text-slate-400">
                          {row.employee?.employeeCode || `ID #${row.employeeId}`} · {row.department || 'General'}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${statusObj.color}`}
                    >
                      <span className={`size-1.5 rounded-full ${statusObj.dot}`} />
                      {statusObj.label}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Requested</span>
                      <span className="font-bold text-slate-900">{inr(row.loanAmount)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Monthly EMI</span>
                      <span className="font-bold text-[#16A34A]">{row.monthlyEmi ? `${inr(row.monthlyEmi)}/mo` : '—'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Tenure</span>
                      <span className="text-slate-700">{row.termMonths || 12} Mos ({row.interestRate ?? 0}%)</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Remaining</span>
                      <span className="font-bold text-slate-800">{row.remainingBalance != null ? inr(row.remainingBalance) : '—'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <span className="text-slate-500 truncate max-w-[180px]">{row.reason || 'No description'}</span>
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedLoan(row);
                          setApprovalAmount(String(row.loanAmount || ''));
                          setApprovalTenure(String(row.termMonths || 12));
                          setApprovalEmi(String(row.monthlyEmi || ''));
                          setRejectReason('');
                        }}
                        className="h-7 px-2 text-xs text-emerald-700 font-semibold"
                      >
                        Inspect
                      </Button>
                      {canManage && isPending && (
                        <Button
                          size="sm"
                          onClick={() => handleApprove(row)}
                          className="h-7 px-2 text-xs bg-blue-600 text-white rounded-lg font-semibold"
                        >
                          Approve
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {!loading && filteredRows.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 bg-slate-50/50 text-xs text-slate-500">
            <div>
              Showing <span className="font-semibold text-slate-800">{filteredRows.length}</span> of{' '}
              <span className="font-semibold text-slate-800">{pagination.total || filteredRows.length}</span> loans
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((v) => v - 1)}
                className="h-8 rounded-xl px-2.5 text-xs font-semibold"
              >
                Previous
              </Button>
              <span className="font-semibold text-slate-700 px-2">
                Page {page} of {pagination.totalPages || 1}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= (pagination.totalPages || 1)}
                onClick={() => setPage((v) => v + 1)}
                className="h-8 rounded-xl px-2.5 text-xs font-semibold"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── 6. New Loan Request Drawer ────────────────────────────────── */}
      <FormDrawer
        open={formOpen}
        onOpenChange={setFormOpen}
        title="Apply For Loan Request"
        description="Submit an employee loan or salary advance request with automatic EMI calculation."
        onSubmit={handleSubmitLoan}
        submitLabel={submittingLoan ? 'Submitting…' : 'Submit Loan'}
        loading={submittingLoan}
        disabled={submittingLoan}
        size="standard"
      >
        <div className="space-y-4">
          {/* Employee Selection */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-800">
              Employee <span className="text-rose-500">*</span>
            </Label>
            <select
              value={form.employeeId}
              onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
              required
              className="w-full h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">Select Employee</option>
              {employees.map((emp) => (
                <option key={emp.recordId || emp.id} value={String(emp.recordId || emp.id)}>
                  {emp.name} ({emp.employeeCode || emp.id}) — {emp.department || 'General'}
                </option>
              ))}
            </select>
          </div>

          {/* Loan Scheme / Type */}
          {types.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-800">Loan Scheme / Policy</Label>
              <select
                value={form.loanTypeId}
                onChange={(e) => chooseType(e.target.value)}
                className="w-full h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="">Standard General Loan</option>
                {types.map((type) => (
                  <option key={type.id} value={String(type.id)}>
                    {type.name} ({type.interestRate ?? 0}% Interest • Max {type.maxMonths || 12} Mos)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Amount & Tenure */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-800">
                Loan Amount (₹) <span className="text-rose-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  type="number"
                  min="1"
                  required
                  placeholder="e.g. 50000"
                  value={form.loanAmount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  className="h-9 rounded-xl border-slate-200 text-xs pl-8 focus:border-emerald-500 focus:ring-emerald-500 font-semibold"
                />
                <IndianRupee className="size-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>
              {/* Quick Amount Chips */}
              <div className="flex flex-wrap items-center gap-1 pt-1">
                {['25000', '50000', '100000', '200000'].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handleAmountChange(amt)}
                    className="rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 transition-colors"
                  >
                    ₹{Number(amt) / 1000}k
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-800">Tenure (Months)</Label>
              <Input
                type="number"
                min="1"
                max="120"
                placeholder="12"
                value={form.termMonths}
                onChange={(e) => handleTenureChange(e.target.value)}
                className="h-9 rounded-xl border-slate-200 text-xs focus:border-emerald-500 focus:ring-emerald-500 font-semibold"
              />
              {/* Quick Tenure Chips */}
              <div className="flex flex-wrap items-center gap-1 pt-1">
                {['6', '12', '18', '24', '36'].map((mos) => (
                  <button
                    key={mos}
                    type="button"
                    onClick={() => handleTenureChange(mos)}
                    className="rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 transition-colors"
                  >
                    {mos}m
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Interest & Calculated Monthly EMI */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-800">Annual Interest Rate (%)</Label>
              <Input
                type="number"
                step="0.1"
                min="0"
                placeholder="0.0"
                value={form.interestRate}
                onChange={(e) => setForm({ ...form, interestRate: e.target.value })}
                className="h-9 rounded-xl border-slate-200 text-xs focus:border-emerald-500 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-800">Monthly EMI (Calculated)</Label>
              <Input
                type="number"
                placeholder="Auto-calculated"
                value={form.monthlyEmi}
                onChange={(e) => setForm({ ...form, monthlyEmi: e.target.value })}
                className="h-9 rounded-xl border-slate-200 text-xs bg-slate-50/50 font-mono font-bold text-slate-700"
              />
            </div>
          </div>

          {/* Live Loan Calculation Summary Card */}
          {Number(form.loanAmount) > 0 && (
            <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/50 p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-[#16A34A]">
                <span>Repayment Schedule Preview</span>
                <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.2 rounded-full">
                  {form.termMonths || 12} Installments
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs pt-1">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Principal</span>
                  <span className="font-bold text-slate-900">{inr(form.loanAmount)}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Monthly EMI</span>
                  <span className="font-black text-[#16A34A]">{inr(form.monthlyEmi || 0)}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Repayable</span>
                  <span className="font-bold text-slate-800">
                    {inr((Number(form.monthlyEmi) || 0) * (Number(form.termMonths) || 12))}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Reason / Purpose */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-800">
              Loan Reason / Purpose <span className="text-rose-500">*</span>
            </Label>
            <Input
              required
              placeholder="e.g. Medical emergency, personal advance, education fee"
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              className="h-9 rounded-xl border-slate-200 text-xs focus:border-emerald-500 focus:ring-emerald-500"
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-800">Internal Notes (Optional)</Label>
            <Input
              placeholder="Optional notes or reference numbers"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="h-9 rounded-xl border-slate-200 text-xs focus:border-emerald-500 focus:ring-emerald-500"
            />
          </div>
        </div>
      </FormDrawer>

      {/* ── 7. Loan Detail & Review Drawer ────────────────────────────── */}
      <FormDrawer
        open={Boolean(selectedLoan)}
        onOpenChange={(open) => !open && setSelectedLoan(null)}
        title={selectedLoan ? `Loan #${selectedLoan.id} Details` : 'Loan Details'}
        description={`Requested by ${selectedLoan?.employeeName || 'Staff Member'}`}
        showFooter={false}
        size="standard"
      >
        {selectedLoan && (
          <div className="space-y-5 text-xs text-slate-700">
            {/* Header metadata card */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Staff Member</span>
                  <p className="text-sm font-bold text-slate-900">{selectedLoan.employeeName}</p>
                  <p className="text-xs text-slate-500">
                    {selectedLoan.employee?.employeeCode || `ID #${selectedLoan.employeeId}`} ·{' '}
                    {selectedLoan.department || 'General'}
                  </p>
                </div>
                <div>
                  {(() => {
                    const statusKey = String(selectedLoan.status || 'PENDING').toUpperCase();
                    const statusObj = STATUS_CONFIG[statusKey] || STATUS_CONFIG.PENDING;
                    return (
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${statusObj.color}`}
                      >
                        <span className={`size-1.5 rounded-full ${statusObj.dot}`} />
                        {statusObj.label}
                      </span>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Financial Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Requested Amount
                </span>
                <p className="text-base font-black text-slate-900">{inr(selectedLoan.loanAmount)}</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Approved Amount
                </span>
                <p className="text-base font-black text-emerald-700">
                  {selectedLoan.approvedAmount != null ? inr(selectedLoan.approvedAmount) : 'Pending Review'}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Monthly EMI & Tenure
                </span>
                <p className="text-sm font-bold text-slate-800">
                  {selectedLoan.monthlyEmi ? inr(selectedLoan.monthlyEmi) : '—'} / month
                </p>
                <p className="text-[11px] text-slate-500">
                  {selectedLoan.termMonths || 12} Months ({selectedLoan.interestRate ?? 0}% Interest)
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Remaining Balance
                </span>
                <p className="text-sm font-bold text-slate-900">
                  {selectedLoan.remainingBalance != null ? inr(selectedLoan.remainingBalance) : inr(selectedLoan.loanAmount)}
                </p>
              </div>
            </div>

            {/* Purpose */}
            <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Reason / Purpose
              </span>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                {selectedLoan.reason || 'No specific reason provided.'}
              </p>
            </div>

            {/* Notes if present */}
            {selectedLoan.notes && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Internal Notes
                </span>
                <p className="text-xs text-slate-600">{selectedLoan.notes}</p>
              </div>
            )}

            {/* Rejection reason if rejected */}
            {selectedLoan.rejectionReason && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500 block">
                  Rejection Reason
                </span>
                <p className="text-xs text-rose-800">{selectedLoan.rejectionReason}</p>
              </div>
            )}

            {/* Pending Approval / Rejection Action Panel */}
            {canManage && selectedLoan.status === 'PENDING' && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-4 pt-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Management Decision
                </h4>

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-slate-700">Approved (₹)</Label>
                    <Input
                      type="number"
                      value={approvalAmount}
                      onChange={(e) => setApprovalAmount(e.target.value)}
                      className="h-8 text-xs bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-slate-700">Tenure (Mos)</Label>
                    <Input
                      type="number"
                      value={approvalTenure}
                      onChange={(e) => setApprovalTenure(e.target.value)}
                      className="h-8 text-xs bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-slate-700">EMI (₹)</Label>
                    <Input
                      type="number"
                      value={approvalEmi}
                      onChange={(e) => setApprovalEmi(e.target.value)}
                      className="h-8 text-xs bg-white"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    disabled={reviewBusy}
                    onClick={() =>
                      handleApprove(selectedLoan, {
                        approvedAmount: approvalAmount,
                        termMonths: approvalTenure,
                        monthlyEmi: approvalEmi,
                      })
                    }
                    className="flex-1 h-9 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white font-semibold text-xs"
                  >
                    <Check className="size-3.5 mr-1" />
                    {reviewBusy ? 'Processing…' : 'Approve Loan'}
                  </Button>
                </div>

                <div className="pt-2 border-t border-slate-200 space-y-2">
                  <Label className="text-[11px] font-semibold text-slate-700">
                    Or Reject with Reason
                  </Label>
                  <Input
                    placeholder="Enter rejection reason..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="h-8 text-xs bg-white"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={reviewBusy || !rejectReason.trim()}
                    onClick={handleReject}
                    className="w-full h-8 rounded-xl border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold"
                  >
                    <X className="size-3.5 mr-1" />
                    {reviewBusy ? 'Processing…' : 'Reject Loan'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </FormDrawer>

      {/* ── 8. Delete Confirmation Dialog ─────────────────────────────── */}
      <ConfirmDialog
        open={Boolean(deletingLoan)}
        onOpenChange={(open) => !open && setDeletingLoan(null)}
        title={`Delete Loan #${deletingLoan?.id}?`}
        description={`This will permanently remove the loan record for ${deletingLoan?.employeeName || 'this staff member'}.`}
        confirmLabel={deleteBusy ? 'Deleting…' : 'Delete Loan'}
        variant="destructive"
        onConfirm={handleDeleteLoan}
      />
    </div>
  );
}
