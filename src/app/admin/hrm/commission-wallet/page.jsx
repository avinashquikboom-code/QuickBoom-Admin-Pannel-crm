'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Wallet,
  Percent,
  BadgePercent,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  SlidersHorizontal,
  Users,
  CreditCard,
  TrendingUp,
  UserCheck,
  Target,
  IndianRupee,
  Search,
  X,
  Building,
  Check,
  ShieldCheck,
} from 'lucide-react';

import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
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
  decideWithdrawal,
  hrmError,
  loadCommissionWallet,
  sessionCan,
} from '@/modules/hrm/hrm-api';

const inr = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

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

export default function CommissionWalletPage() {
  const [dashboard, setDashboard] = React.useState({});
  const [employees, setEmployees] = React.useState([]);
  const [withdrawals, setWithdrawals] = React.useState([]);
  const [rules, setRules] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [canManage, setCanManage] = React.useState(false);

  // Table View Tab: 'wallets' | 'withdrawals'
  const [viewTab, setViewTab] = React.useState('wallets');

  // Employee Wallets Search & Filters
  const [walletSearch, setWalletSearch] = React.useState('');
  const [walletDepartmentFilter, setWalletDepartmentFilter] = React.useState('ALL');
  const [walletPage, setWalletPage] = React.useState(1);
  const [walletPageSize, setWalletPageSize] = React.useState(10);

  // Withdrawals Search & Filters
  const [withdrawalSearch, setWithdrawalSearch] = React.useState('');
  const [withdrawalStatusFilter, setWithdrawalStatusFilter] = React.useState('ALL');
  const [withdrawalPage, setWithdrawalPage] = React.useState(1);
  const [withdrawalPageSize, setWithdrawalPageSize] = React.useState(10);

  // Confirm Payment Dialog
  const [paymentRow, setPaymentRow] = React.useState(null);
  const [paymentReference, setPaymentReference] = React.useState('');
  const [paymentBusy, setPaymentBusy] = React.useState(false);

  // Reject Dialog
  const [rejectRow, setRejectRow] = React.useState(null);
  const [rejectReason, setRejectReason] = React.useState('');
  const [rejectBusy, setRejectBusy] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await loadCommissionWallet();
      const summary =
        data.dashboard?.data && !data.dashboard.totalGenerated
          ? data.dashboard.data
          : data.dashboard;
      setDashboard(summary || {});
      setEmployees(data.employees || []);
      setWithdrawals(data.withdrawals || []);
      setRules(data.rules || []);
    } catch (error) {
      toast.error(hrmError(error));
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    setCanManage(sessionCan('COMMISSION') || sessionCan('HRM'));
    load();
  }, [load]);

  // Handle Withdrawal Decision
  async function act(row, action, body = {}) {
    if (action === 'paid' && !body.processingConfirmed) {
      if (row.status !== 'APPROVED') {
        toast.error('Please approve the withdrawal request before recording payment.');
        return;
      }
      setPaymentReference('');
      setPaymentRow(row);
      return;
    }

    if (action === 'reject' && !body.reason) {
      setRejectReason('');
      setRejectRow(row);
      return;
    }

    try {
      await decideWithdrawal(row.id, action, body);
      toast.success(
        `Withdrawal ${
          action === 'approve'
            ? 'approved'
            : action === 'reject'
            ? 'rejected'
            : 'marked paid'
        }.`
      );
      load();
    } catch (error) {
      toast.error(hrmError(error));
    }
  }

  // Confirm Payment Submission
  const handleConfirmPayment = async (e) => {
    e.preventDefault();
    const reference = paymentReference.trim();
    if (!reference || paymentBusy || !paymentRow) return;
    setPaymentBusy(true);
    try {
      await decideWithdrawal(paymentRow.id, 'paid', {
        paymentReference: reference,
        processingConfirmed: true,
      });
      toast.success(`Withdrawal payment of ${inr(paymentRow.amount)} recorded.`);
      setPaymentRow(null);
      setPaymentReference('');
      await load();
    } catch (error) {
      toast.error(hrmError(error));
    } finally {
      setPaymentBusy(false);
    }
  };

  // Confirm Rejection Submission
  const handleConfirmReject = async (e) => {
    e.preventDefault();
    if (!rejectRow || rejectBusy) return;
    setRejectBusy(true);
    try {
      await decideWithdrawal(rejectRow.id, 'reject', {
        reason: rejectReason.trim() || undefined,
      });
      toast.success('Withdrawal request rejected.');
      setRejectRow(null);
      setRejectReason('');
      await load();
    } catch (error) {
      toast.error(hrmError(error));
    } finally {
      setRejectBusy(false);
    }
  };

  // Distinct departments for wallet filter
  const departments = React.useMemo(() => {
    const set = new Set();
    employees.forEach((emp) => {
      if (emp.department) set.add(emp.department);
    });
    return Array.from(set).sort();
  }, [employees]);

  // Filtered employee wallets
  const filteredEmployees = React.useMemo(() => {
    return employees.filter((emp) => {
      if (walletSearch.trim()) {
        const q = walletSearch.toLowerCase();
        const matchesName = emp.name && emp.name.toLowerCase().includes(q);
        const matchesCode =
          emp.employeeCode && emp.employeeCode.toLowerCase().includes(q);
        const matchesDept =
          emp.department && emp.department.toLowerCase().includes(q);
        if (!matchesName && !matchesCode && !matchesDept) return false;
      }
      if (
        walletDepartmentFilter !== 'ALL' &&
        emp.department !== walletDepartmentFilter
      ) {
        return false;
      }
      return true;
    });
  }, [employees, walletSearch, walletDepartmentFilter]);

  // Paginated employee wallets
  const paginatedEmployees = React.useMemo(() => {
    const start = (walletPage - 1) * walletPageSize;
    return filteredEmployees.slice(start, start + walletPageSize);
  }, [filteredEmployees, walletPage, walletPageSize]);

  // Filtered withdrawals
  const filteredWithdrawals = React.useMemo(() => {
    return withdrawals.filter((w) => {
      if (withdrawalSearch.trim()) {
        const q = withdrawalSearch.toLowerCase();
        const empName = `${w.employee?.firstName || ''} ${
          w.employee?.lastName || ''
        }`.toLowerCase();
        const empCode = String(
          w.employee?.employeeCode || w.employeeId || ''
        ).toLowerCase();
        const account = String(w.accountRef || '').toLowerCase();
        const method = String(w.method || '').toLowerCase();
        if (
          !empName.includes(q) &&
          !empCode.includes(q) &&
          !account.includes(q) &&
          !method.includes(q)
        ) {
          return false;
        }
      }
      if (
        withdrawalStatusFilter !== 'ALL' &&
        String(w.status).toUpperCase() !== withdrawalStatusFilter.toUpperCase()
      ) {
        return false;
      }
      return true;
    });
  }, [withdrawals, withdrawalSearch, withdrawalStatusFilter]);

  // Paginated withdrawals
  const paginatedWithdrawals = React.useMemo(() => {
    const start = (withdrawalPage - 1) * withdrawalPageSize;
    return filteredWithdrawals.slice(start, start + withdrawalPageSize);
  }, [filteredWithdrawals, withdrawalPage, withdrawalPageSize]);

  // Pending withdrawals count
  const pendingCount = React.useMemo(() => {
    return (
      dashboard.pendingWithdrawals ??
      withdrawals.filter((w) => String(w.status).toUpperCase() === 'PENDING').length
    );
  }, [dashboard.pendingWithdrawals, withdrawals]);

  // 6 Metric Cards definition
  const statCards = [
    {
      label: 'Generated',
      value: inr(dashboard.totalGenerated),
      subtext: 'Total commissions earned',
      icon: TrendingUp,
      tone: 'bg-emerald-50 text-[#107569] ring-emerald-200/60',
      valueClass: 'text-[#163A2E]',
    },
    {
      label: 'Paid',
      value: inr(dashboard.totalPaid),
      subtext: 'Disbursed to employees',
      icon: CheckCircle2,
      tone: 'bg-teal-50 text-teal-700 ring-teal-200/60',
      valueClass: 'text-[#107569]',
    },
    {
      label: 'Pending Withdrawals',
      value: dashboard.pendingWithdrawals ?? 0,
      subtext: 'Awaiting admin review',
      icon: Clock,
      tone: 'bg-amber-50 text-amber-700 ring-amber-200/60',
      valueClass: 'text-amber-700',
    },
    {
      label: 'Liability',
      value: inr(dashboard.availableLiability),
      subtext: 'Available in active wallets',
      icon: Wallet,
      tone: 'bg-emerald-50 text-[#107569] ring-emerald-200/60',
      valueClass: 'text-[#163A2E]',
    },
    {
      label: 'Closed Leads',
      value: dashboard.totalClosedLeads ?? 0,
      subtext: 'Commissionable conversions',
      icon: UserCheck,
      tone: 'bg-indigo-50 text-indigo-700 ring-indigo-200/60',
      valueClass: 'text-indigo-900',
    },
    {
      label: 'Sales',
      value: inr(dashboard.totalSalesValue),
      subtext: 'Total generated deal volume',
      icon: BadgePercent,
      tone: 'bg-violet-50 text-violet-700 ring-violet-200/60',
      valueClass: 'text-violet-900',
    },
  ];

  return (
    <div className="w-full min-w-0 max-w-none space-y-6 overflow-x-hidden font-sans text-slate-800 pb-16">
      {/* ── 1. Page Header ──────────────────────────────────────────────────── */}
      <PageHeader
        category="COMPENSATION & PAYROLL"
        title="Commission Wallet"
        description="Balances use approved and paid commission records. Withdrawals reserve the available balance until they are paid or rejected."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={load}
              disabled={loading}
              className="rounded-xl border-slate-200 text-xs font-semibold text-slate-700 hover:text-[#107569]"
            >
              <RefreshCw
                className={`size-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`}
              />
              <span>Refresh</span>
            </Button>
            <Link href="/admin/settings/commissions">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl border-slate-200 text-xs font-semibold text-slate-700 hover:text-[#107569]"
              >
                <SlidersHorizontal className="size-3.5 mr-1.5" />
                <span>Rules</span>
              </Button>
            </Link>
          </div>
        }
      />

      {/* ── 2. Dashboard Statistics (6 Modern Cards) ────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="group relative flex items-center justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md"
          >
            <div className="space-y-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                {card.label}
              </p>
              <p
                className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${card.valueClass}`}
              >
                {loading ? '…' : card.value}
              </p>
              <p className="text-xs text-slate-400">{card.subtext}</p>
            </div>
            <div
              className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ring-1 ${card.tone}`}
            >
              <card.icon className="size-6" />
            </div>
          </div>
        ))}
      </div>

      {/* ── 3. Table View Toggle (Employee Wallets vs Withdrawals) ───────────── */}
      <div className="flex items-center justify-between border-b border-slate-200">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViewTab('wallets')}
            className={`relative flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-all ${
              viewTab === 'wallets'
                ? 'border-[#107569] text-[#107569]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="size-4" />
            <span>Employee Wallets</span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                viewTab === 'wallets'
                  ? 'bg-emerald-100 text-[#107569]'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {employees.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setViewTab('withdrawals')}
            className={`relative flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-all ${
              viewTab === 'withdrawals'
                ? 'border-[#107569] text-[#107569]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CreditCard className="size-4" />
            <span>Withdrawal Requests</span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                pendingCount > 0
                  ? 'bg-amber-100 text-amber-800 font-extrabold'
                  : viewTab === 'withdrawals'
                  ? 'bg-emerald-100 text-[#107569]'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {pendingCount > 0
                ? `${pendingCount} pending`
                : withdrawals.length}
            </span>
          </button>
        </div>
      </div>

      {/* ── 4. VIEW 1: EMPLOYEE WALLETS ─────────────────────────────────────── */}
      {viewTab === 'wallets' && (
        <div className="space-y-4">
          {/* Wallets Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-xs">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <Input
                value={walletSearch}
                onChange={(e) => {
                  setWalletSearch(e.target.value);
                  setWalletPage(1);
                }}
                placeholder="Search employee wallets by name, ID, or role..."
                className="pl-9 pr-8 h-10 w-full rounded-xl border-slate-200 bg-slate-50/50 text-sm focus:bg-white"
              />
              {walletSearch && (
                <button
                  type="button"
                  onClick={() => {
                    setWalletSearch('');
                    setWalletPage(1);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-full sm:w-44">
                <Select
                  value={walletDepartmentFilter}
                  onValueChange={(val) => {
                    setWalletDepartmentFilter(val);
                    setWalletPage(1);
                  }}
                >
                  <SelectTrigger className="h-10 rounded-xl border-slate-200 text-xs sm:text-sm bg-white">
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Departments</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {(walletSearch || walletDepartmentFilter !== 'ALL') && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setWalletSearch('');
                    setWalletDepartmentFilter('ALL');
                    setWalletPage(1);
                  }}
                  className="h-10 px-2.5 text-xs text-rose-600 hover:bg-rose-50 rounded-xl"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Wallets Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
            {loading ? (
              <div className="p-12 text-center">
                <RefreshCw className="mx-auto size-8 animate-spin text-[#107569]" />
                <p className="mt-3 text-sm font-medium text-slate-600">
                  Loading employee wallets...
                </p>
              </div>
            ) : filteredEmployees.length === 0 ? (
              <div className="p-16 text-center">
                <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-emerald-50 text-[#107569]">
                  <Wallet className="size-7" />
                </div>
                <h3 className="mt-4 text-base font-bold text-slate-800">
                  No employee wallets found
                </h3>
                <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
                  {walletSearch || walletDepartmentFilter !== 'ALL'
                    ? 'No employees match your search criteria.'
                    : 'Employee wallets will appear here as staff earn commissions.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-[#E2E8E5] bg-[#F4F9F6] text-xs font-bold uppercase tracking-wider text-[#163A2E]">
                      <th className="py-3.5 pl-6 pr-4">Employee</th>
                      <th className="py-3.5 px-4">Employee ID</th>
                      <th className="py-3.5 px-4">Department</th>
                      <th className="py-3.5 px-4">Earned</th>
                      <th className="py-3.5 px-4">Withdrawn</th>
                      <th className="py-3.5 px-4">Available Balance</th>
                      <th className="py-3.5 px-4">Pending</th>
                      <th className="py-3.5 pl-4 pr-6 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedEmployees.map((emp) => (
                      <tr
                        key={emp.employeeId || emp.id}
                        className="transition-colors hover:bg-slate-50/70"
                      >
                        {/* Employee Name */}
                        <td className="py-3.5 pl-6 pr-4">
                          <div className="flex items-center gap-2.5">
                            <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-emerald-100/70 text-xs font-bold text-[#107569]">
                              {(emp.name || 'E')[0].toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 truncate">
                                {emp.name || '—'}
                              </p>
                              {emp.designation && (
                                <p className="text-[11px] text-slate-400">
                                  {emp.designation}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* ID */}
                        <td className="py-3.5 px-4 whitespace-nowrap font-mono text-xs text-slate-600">
                          {emp.employeeCode || `EMP-${emp.employeeId || emp.id}`}
                        </td>

                        {/* Department */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                            {emp.department || 'General'}
                          </span>
                        </td>

                        {/* Earned */}
                        <td className="py-3.5 px-4 whitespace-nowrap font-semibold text-slate-800">
                          {inr(emp.totalEarned)}
                        </td>

                        {/* Withdrawn */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                          {inr(emp.totalWithdrawn)}
                        </td>

                        {/* Available Balance */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="inline-flex items-center rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-extrabold text-[#107569] border border-emerald-200/60">
                            {inr(emp.availableBalance)}
                          </span>
                        </td>

                        {/* Pending */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {Number(emp.pendingWithdrawal) > 0 ? (
                            <span className="inline-flex items-center rounded-lg bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700">
                              {inr(emp.pendingWithdrawal)}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">₹0</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 pl-4 pr-6 text-right whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                            <span className="size-1.5 rounded-full bg-emerald-600" />
                            {emp.walletStatus || 'AVAILABLE'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-200 px-6 py-3.5 bg-slate-50/50">
              <div className="text-xs text-slate-500 font-medium">
                Showing{' '}
                <span className="font-semibold text-slate-900">
                  {filteredEmployees.length > 0
                    ? (walletPage - 1) * walletPageSize + 1
                    : 0}
                </span>{' '}
                to{' '}
                <span className="font-semibold text-slate-900">
                  {Math.min(
                    walletPage * walletPageSize,
                    filteredEmployees.length
                  )}
                </span>{' '}
                of{' '}
                <span className="font-semibold text-slate-900">
                  {filteredEmployees.length}
                </span>{' '}
                employee wallets
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={walletPage <= 1}
                  onClick={() => setWalletPage((v) => v - 1)}
                  className="h-8 px-2.5 rounded-lg text-xs font-semibold"
                >
                  Previous
                </Button>
                <span className="px-2 text-xs font-bold text-[#107569]">
                  {walletPage}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={
                    walletPage >=
                    Math.ceil(filteredEmployees.length / walletPageSize)
                  }
                  onClick={() => setWalletPage((v) => v + 1)}
                  className="h-8 px-2.5 rounded-lg text-xs font-semibold"
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 5. VIEW 2: WITHDRAWAL REQUESTS ──────────────────────────────────── */}
      {viewTab === 'withdrawals' && (
        <div className="space-y-4">
          {/* Withdrawals Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-xs">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <Input
                value={withdrawalSearch}
                onChange={(e) => {
                  setWithdrawalSearch(e.target.value);
                  setWithdrawalPage(1);
                }}
                placeholder="Search by employee, account, or method..."
                className="pl-9 pr-8 h-10 w-full rounded-xl border-slate-200 bg-slate-50/50 text-sm focus:bg-white"
              />
              {withdrawalSearch && (
                <button
                  type="button"
                  onClick={() => {
                    setWithdrawalSearch('');
                    setWithdrawalPage(1);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-full sm:w-40">
                <Select
                  value={withdrawalStatusFilter}
                  onValueChange={(val) => {
                    setWithdrawalStatusFilter(val);
                    setWithdrawalPage(1);
                  }}
                >
                  <SelectTrigger className="h-10 rounded-xl border-slate-200 text-xs sm:text-sm bg-white">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Statuses</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="PAID">Paid</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(withdrawalSearch || withdrawalStatusFilter !== 'ALL') && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setWithdrawalSearch('');
                    setWithdrawalStatusFilter('ALL');
                    setWithdrawalPage(1);
                  }}
                  className="h-10 px-2.5 text-xs text-rose-600 hover:bg-rose-50 rounded-xl"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Withdrawals Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
            {loading ? (
              <div className="p-12 text-center">
                <RefreshCw className="mx-auto size-8 animate-spin text-[#107569]" />
                <p className="mt-3 text-sm font-medium text-slate-600">
                  Loading withdrawal requests...
                </p>
              </div>
            ) : filteredWithdrawals.length === 0 ? (
              <div className="p-16 text-center">
                <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                  <CreditCard className="size-7" />
                </div>
                <h3 className="mt-4 text-base font-bold text-slate-800">
                  No withdrawal requests found
                </h3>
                <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
                  {withdrawalSearch || withdrawalStatusFilter !== 'ALL'
                    ? 'No requests match the selected filters.'
                    : 'Employees can submit commission withdrawal requests from their mobile app or portal.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-[#E2E8E5] bg-[#F4F9F6] text-xs font-bold uppercase tracking-wider text-[#163A2E]">
                      <th className="py-3.5 pl-6 pr-4">Employee</th>
                      <th className="py-3.5 px-4">Amount</th>
                      <th className="py-3.5 px-4">Method</th>
                      <th className="py-3.5 px-4">Account Reference</th>
                      <th className="py-3.5 px-4">Requested Date</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 pl-4 pr-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedWithdrawals.map((row) => {
                      const empName = `${row.employee?.firstName || ''} ${
                        row.employee?.lastName || ''
                      }`.trim() || row.employee?.name || `Employee #${row.employeeId}`;

                      const statusStr = String(row.status || '').toUpperCase();

                      return (
                        <tr
                          key={row.id}
                          className="transition-colors hover:bg-slate-50/70"
                        >
                          {/* Employee */}
                          <td className="py-3.5 pl-6 pr-4">
                            <p className="font-bold text-slate-900">{empName}</p>
                            <p className="text-xs text-slate-400 font-mono">
                              {row.employee?.employeeCode || `ID: ${row.employeeId}`}
                            </p>
                          </td>

                          {/* Amount */}
                          <td className="py-3.5 px-4 whitespace-nowrap font-extrabold text-base text-[#107569]">
                            {inr(row.amount)}
                          </td>

                          {/* Method */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700 uppercase">
                              {row.method || 'BANK'}
                            </span>
                          </td>

                          {/* Account */}
                          <td className="py-3.5 px-4 whitespace-nowrap font-mono text-xs text-slate-600">
                            {row.accountRef || '—'}
                          </td>

                          {/* Date */}
                          <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-500 font-medium">
                            {formatDate(row.createdAt)}
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <StatusBadge status={statusStr.toLowerCase()} />
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 pl-4 pr-6 text-right whitespace-nowrap">
                            {canManage && (
                              <div className="flex items-center justify-end gap-1.5">
                                {statusStr === 'PENDING' && (
                                  <>
                                    <Button
                                      size="sm"
                                      onClick={() => act(row, 'approve')}
                                      className="h-7 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                                    >
                                      Approve
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => act(row, 'reject')}
                                      className="h-7 px-2 rounded-lg text-rose-600 hover:bg-rose-50 text-xs font-semibold"
                                    >
                                      Reject
                                    </Button>
                                  </>
                                )}

                                {statusStr === 'APPROVED' && (
                                  <Button
                                    size="sm"
                                    onClick={() => act(row, 'paid')}
                                    className="h-7 px-2.5 rounded-lg bg-[#107569] hover:bg-[#0e6359] text-white text-xs font-semibold"
                                  >
                                    Record Payment
                                  </Button>
                                )}

                                {statusStr === 'PAID' && (
                                  <span className="inline-flex items-center gap-1 text-xs font-bold text-teal-700">
                                    <Check className="size-3.5" />
                                    <span>Paid</span>
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-200 px-6 py-3.5 bg-slate-50/50">
              <div className="text-xs text-slate-500 font-medium">
                Showing{' '}
                <span className="font-semibold text-slate-900">
                  {filteredWithdrawals.length > 0
                    ? (withdrawalPage - 1) * withdrawalPageSize + 1
                    : 0}
                </span>{' '}
                to{' '}
                <span className="font-semibold text-slate-900">
                  {Math.min(
                    withdrawalPage * withdrawalPageSize,
                    filteredWithdrawals.length
                  )}
                </span>{' '}
                of{' '}
                <span className="font-semibold text-slate-900">
                  {filteredWithdrawals.length}
                </span>{' '}
                withdrawals
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={withdrawalPage <= 1}
                  onClick={() => setWithdrawalPage((v) => v - 1)}
                  className="h-8 px-2.5 rounded-lg text-xs font-semibold"
                >
                  Previous
                </Button>
                <span className="px-2 text-xs font-bold text-[#107569]">
                  {withdrawalPage}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={
                    withdrawalPage >=
                    Math.ceil(filteredWithdrawals.length / withdrawalPageSize)
                  }
                  onClick={() => setWithdrawalPage((v) => v + 1)}
                  className="h-8 px-2.5 rounded-lg text-xs font-semibold"
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 6. Bottom Info Card: Commission Configurations Banner ────────────── */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-[#107569] ring-1 ring-emerald-200/60 mt-0.5">
              <SlidersHorizontal className="size-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Commission Configurations & Slabs
              </h3>
              <p className="mt-1 text-xs text-slate-500 max-w-2xl leading-relaxed">
                Manage role-specific commission slabs, effective dates, and real-time calculation previews in Commission Settings. Slabs directly automate payroll calculations.
              </p>
            </div>
          </div>

          <Link href="/admin/settings/commissions" className="shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="inline-flex items-center gap-2 rounded-xl border-emerald-200 bg-emerald-50/50 px-4 py-2 text-xs font-bold text-[#107569] hover:bg-emerald-100 hover:text-emerald-900"
            >
              <span>Manage Configurations</span>
              <ArrowRight className="size-3.5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* ── 7. DIALOG: CONFIRM WITHDRAWAL PAYMENT ────────────────────────────── */}
      <Dialog
        open={Boolean(paymentRow)}
        onOpenChange={(open) => !open && setPaymentRow(null)}
      >
        <DialogContent className="sm:max-w-md bg-white rounded-2xl p-6">
          <form onSubmit={handleConfirmPayment}>
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="size-5 text-[#107569]" />
                <span>Confirm Withdrawal Payment</span>
              </DialogTitle>
              <DialogDescription className="text-sm text-slate-600 mt-2">
                Record the bank reference, UTR, or transaction ID once payout has been disbursed.
              </DialogDescription>
            </DialogHeader>

            {paymentRow && (
              <div className="my-4 rounded-xl border border-emerald-200/80 bg-emerald-50/50 p-3.5 space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">Employee:</span>
                  <span className="font-bold text-slate-900">
                    {paymentRow.employee?.firstName} {paymentRow.employee?.lastName}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">Payout Amount:</span>
                  <span className="font-extrabold text-[#107569] text-sm">
                    {inr(paymentRow.amount)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">Account:</span>
                  <span className="font-mono text-slate-700">
                    {paymentRow.accountRef || paymentRow.method || 'Bank Transfer'}
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700">
                Payment Reference / Transaction ID <span className="text-rose-500">*</span>
              </Label>
              <Input
                required
                placeholder="e.g. UTR1234567890 / IMPS / NEFT Ref"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                className="h-10 text-sm rounded-xl font-mono"
              />
            </div>

            <DialogFooter className="mt-5 flex gap-2 sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPaymentRow(null)}
                disabled={paymentBusy}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={paymentBusy || !paymentReference.trim()}
                className="bg-[#107569] hover:bg-[#0e6359] text-white"
              >
                {paymentBusy ? 'Recording...' : 'Confirm Payment'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── 8. DIALOG: REJECT WITHDRAWAL REQUEST ─────────────────────────────── */}
      <Dialog
        open={Boolean(rejectRow)}
        onOpenChange={(open) => !open && setRejectRow(null)}
      >
        <DialogContent className="sm:max-w-md bg-white rounded-2xl p-6">
          <form onSubmit={handleConfirmReject}>
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <AlertCircle className="size-5 text-rose-600" />
                <span>Reject Withdrawal Request</span>
              </DialogTitle>
              <DialogDescription className="text-sm text-slate-600 mt-2">
                Rejecting this request will release the reserved balance back to the employee's available commission wallet.
              </DialogDescription>
            </DialogHeader>

            {rejectRow && (
              <div className="my-4 rounded-xl border border-rose-200 bg-rose-50/40 p-3 text-xs space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Employee:</span>
                  <span className="font-bold text-slate-900">
                    {rejectRow.employee?.firstName} {rejectRow.employee?.lastName}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Amount:</span>
                  <span className="font-bold text-rose-700">
                    {inr(rejectRow.amount)}
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700">
                Reason for Rejection (Optional)
              </Label>
              <Input
                placeholder="e.g. Account number mismatch or pending approval"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="h-10 text-sm rounded-xl"
              />
            </div>

            <DialogFooter className="mt-5 flex gap-2 sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setRejectRow(null)}
                disabled={rejectBusy}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={rejectBusy}
                className="bg-rose-600 hover:bg-rose-700 text-white"
              >
                {rejectBusy ? 'Rejecting...' : 'Reject Request'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
