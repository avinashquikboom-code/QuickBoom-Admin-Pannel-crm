'use client';

import * as React from 'react';
import {
  Percent,
  Clock,
  CheckCircle2,
  Wallet,
  Search,
  RefreshCw,
  Plus,
  Edit3,
  Trash2,
  Users,
  Briefcase,
  Layers,
  ArrowRight,
  ChevronRight,
  Filter,
  Check,
  X,
  AlertCircle,
  ShieldCheck,
  SlidersHorizontal,
  BadgePercent,
  CheckCircle,
  Save,
} from 'lucide-react';

import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
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
import { toast } from '@/hooks/use-toast';
import {
  hrmError,
  loadCommissionConfigs,
  loadCommissions,
  loadEmployees,
  saveDesignationCommission,
  saveEmployeeCommission,
  sessionCan,
  updateCommissionStatus,
} from '@/modules/hrm/hrm-api';
import CommissionWalletPage from '@/app/admin/hrm/commission-wallet/page';

const inr = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

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

export default function CommissionsPage() {
  // Main Tab: 'commissions' | 'wallet'
  const [tab, setTab] = React.useState('commissions');

  // Ledger state
  const [rows, setRows] = React.useState([]);
  const [summary, setSummary] = React.useState({});
  const [configs, setConfigs] = React.useState({
    designations: [],
    employees: [],
  });
  const [employees, setEmployees] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  // Ledger Filters
  const [search, setSearch] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [employeeId, setEmployeeId] = React.useState('');
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [pagination, setPagination] = React.useState({});
  const [refresh, setRefresh] = React.useState(0);

  // Designation Rates state & inline edits
  const [designationSearch, setDesignationSearch] = React.useState('');
  const [designationRates, setDesignationRates] = React.useState({});
  const [savingDesignationId, setSavingDesignationId] = React.useState(null);

  // Employee Override Drawer state
  const [configOpen, setConfigOpen] = React.useState(false);
  const [configSaving, setConfigSaving] = React.useState(false);
  const [config, setConfig] = React.useState({
    employeeId: '',
    commissionType: 'PERCENTAGE',
    commissionValue: '',
    status: 'ACTIVE',
  });

  const [canManage, setCanManage] = React.useState(false);
  React.useEffect(() => {
    setCanManage(sessionCan('COMMISSION') || sessionCan('HRM'));
  }, []);

  // Debounce search
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 350);
    return () => clearTimeout(handler);
  }, [search]);

  // Load Commissions & Configs
  React.useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([
      loadCommissions({
        page,
        limit: pageSize,
        search: debouncedSearch.trim() || undefined,
        status: status || undefined,
        employeeId: employeeId || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      }),
      loadCommissionConfigs(),
      loadEmployees(),
    ])
      .then(([result, settings, people]) => {
        if (!active) return;
        setRows(result.rows || []);
        setSummary(result.summary || {});
        setPagination(result.pagination || {});
        setConfigs(settings || { designations: [], employees: [] });
        setEmployees(people || []);

        // Initialize local designation rates for inline editing
        const ratesMap = {};
        (settings?.designations || []).forEach((d) => {
          ratesMap[d.id] = {
            rate: d.commissionRate ?? 0,
            enabled: d.commissionEnabled !== false,
            type: d.commissionType || 'PERCENTAGE',
          };
        });
        setDesignationRates(ratesMap);
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
  }, [
    refresh,
    page,
    pageSize,
    debouncedSearch,
    status,
    employeeId,
    startDate,
    endDate,
  ]);

  // Handle Action Status Change
  const setStatusFor = async (row, next) => {
    try {
      await updateCommissionStatus(row.id, next);
      setRefresh((v) => v + 1);
      toast.success(`Commission marked ${next.toLowerCase()}`);
    } catch (err) {
      toast.error(hrmError(err));
    }
  };

  // Save Designation Commission
  const handleSaveDesignationRate = async (designation) => {
    const current = designationRates[designation.id] || {
      rate: designation.commissionRate ?? 0,
      enabled: designation.commissionEnabled !== false,
      type: designation.commissionType || 'PERCENTAGE',
    };

    setSavingDesignationId(designation.id);
    try {
      await saveDesignationCommission({
        designationId: designation.id,
        commissionEnabled: Boolean(current.enabled),
        commissionType: current.type || 'PERCENTAGE',
        commissionRate: Number(current.rate) || 0,
      });
      setRefresh((v) => v + 1);
      toast.success(`${designation.name} commission rate updated`);
    } catch (err) {
      toast.error(hrmError(err));
    } finally {
      setSavingDesignationId(null);
    }
  };

  // Save Employee Override
  const saveOverride = async (event) => {
    if (event?.preventDefault) event.preventDefault();
    if (!config.employeeId) {
      toast.error('Please select an employee');
      return;
    }
    if (config.commissionValue === '' || Number(config.commissionValue) < 0) {
      toast.error('Please enter a valid commission rate or amount');
      return;
    }

    setConfigSaving(true);
    try {
      await saveEmployeeCommission(config);
      setConfigOpen(false);
      setConfig({
        employeeId: '',
        commissionType: 'PERCENTAGE',
        commissionValue: '',
        status: 'ACTIVE',
      });
      setRefresh((v) => v + 1);
      toast.success('Employee commission override saved successfully');
    } catch (err) {
      toast.error(hrmError(err));
    } finally {
      setConfigSaving(false);
    }
  };

  // Filtered designations
  const filteredDesignations = React.useMemo(() => {
    if (!designationSearch.trim()) return configs.designations || [];
    const q = designationSearch.toLowerCase();
    return (configs.designations || []).filter(
      (d) =>
        (d.name && d.name.toLowerCase().includes(q)) ||
        (d.code && d.code.toLowerCase().includes(q))
    );
  }, [configs.designations, designationSearch]);

  // If Wallet tab is active
  if (tab === 'wallet') {
    return (
      <div className="space-y-6 max-w-none w-full min-w-0 font-sans text-slate-800 pb-12">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <Button
            variant="outline"
            onClick={() => setTab('commissions')}
            className="rounded-xl px-4 py-2 text-sm font-semibold border-slate-200 text-slate-600 hover:text-slate-900"
          >
            <Percent className="size-4 mr-1.5" />
            Commissions
          </Button>
          <Button
            onClick={() => setTab('wallet')}
            className="rounded-xl px-4 py-2 text-sm font-semibold bg-[#107569] text-white shadow-sm hover:bg-[#0e6359]"
          >
            <Wallet className="size-4 mr-1.5" />
            Commission Wallet
          </Button>
        </div>
        <CommissionWalletPage />
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 max-w-none space-y-6 overflow-x-hidden pb-16 font-sans text-slate-800">
      {/* ── 1. Navigation Tabs at Top ───────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setTab('commissions')}
            className="inline-flex items-center gap-2 rounded-xl bg-[#107569] px-4 py-2 text-sm font-semibold text-white shadow-xs transition hover:bg-[#0e6359]"
          >
            <Percent className="size-4" />
            <span>Commissions</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('wallet')}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200/90 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-2xs transition hover:bg-slate-50 hover:text-slate-900"
          >
            <Wallet className="size-4 text-slate-400" />
            <span>Commission Wallet</span>
          </button>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setRefresh((v) => v + 1)}
          disabled={loading}
          className="hidden sm:inline-flex items-center gap-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-[#107569]"
        >
          <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </Button>
      </div>

      {/* ── 2. Page Header ──────────────────────────────────────────────────── */}
      <PageHeader
        category="COMPENSATION & PAYROLL"
        title="Commissions"
        description="Commission records and rates are read from the commission service. Amounts are not calculated in the browser."
        actions={
          canManage ? (
            <div className="flex items-center gap-2.5">
              <Button
                onClick={() => setConfigOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#107569] px-4 py-2 text-sm font-semibold text-white shadow-xs transition hover:bg-[#0e6359]"
              >
                <Plus className="size-4" />
                <span>Employee Rate</span>
              </Button>
            </div>
          ) : null
        }
      />

      {/* ── 3. Four Dashboard Statistics Cards ──────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Commission */}
        <div className="group relative flex items-center justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md">
          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Commission
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#163A2E]">
              {inr(summary.totalCommission)}
            </p>
            <p className="text-xs text-slate-400">All recorded transactions</p>
          </div>
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60">
            <BadgePercent className="size-6" />
          </div>
        </div>

        {/* Pending Commission */}
        <div className="group relative flex items-center justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md">
          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Pending
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-amber-700">
              {inr(summary.pendingCommission)}
            </p>
            <p className="text-xs text-amber-600 font-medium">Awaiting approval</p>
          </div>
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 ring-1 ring-amber-200/60">
            <Clock className="size-6" />
          </div>
        </div>

        {/* Approved Commission */}
        <div className="group relative flex items-center justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md">
          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Approved
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-emerald-700">
              {inr(summary.approvedCommission)}
            </p>
            <p className="text-xs text-emerald-600 font-medium">Ready for payout</p>
          </div>
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60">
            <CheckCircle2 className="size-6" />
          </div>
        </div>

        {/* Paid Commission */}
        <div className="group relative flex items-center justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-md">
          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Paid
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#107569]">
              {inr(summary.paidCommission)}
            </p>
            <p className="text-xs text-slate-400">Successfully disbursed</p>
          </div>
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-[#107569] ring-1 ring-teal-200/60">
            <Wallet className="size-6" />
          </div>
        </div>
      </div>

      {/* ── 4. Main Commissions Ledger Table & Filters ─────────────────────── */}
      <div className="space-y-4">
        {/* Filters Bar */}
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search employee, lead, or order..."
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

            {/* Dropdown Filters */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
              {/* Status Filter */}
              <div className="w-full sm:w-36">
                <Select
                  value={status || 'ALL'}
                  onValueChange={(val) => setStatus(val === 'ALL' ? '' : val)}
                >
                  <SelectTrigger className="h-10 rounded-xl border-slate-200 text-xs sm:text-sm bg-white">
                    <SelectValue placeholder="Status: All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Statuses</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="PAID">Paid</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Employee Filter */}
              <div className="w-full sm:w-44">
                <Select
                  value={employeeId || 'ALL'}
                  onValueChange={(val) => setEmployeeId(val === 'ALL' ? '' : val)}
                >
                  <SelectTrigger className="h-10 rounded-xl border-slate-200 text-xs sm:text-sm bg-white">
                    <SelectValue placeholder="All Employees" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Employees</SelectItem>
                    {employees.map((emp) => (
                      <SelectItem
                        key={emp.recordId || emp.id}
                        value={String(emp.recordId || emp.id)}
                      >
                        {emp.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Pickers */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-10 text-xs rounded-xl border-slate-200 bg-white"
                  aria-label="From date"
                  title="From Date"
                />
                <span className="text-slate-400 text-xs">to</span>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-10 text-xs rounded-xl border-slate-200 bg-white"
                  aria-label="To date"
                  title="To Date"
                />
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setRefresh((v) => v + 1)}
                  disabled={loading}
                  className="h-10 px-3 rounded-xl border-slate-200 text-slate-700 hover:text-[#107569]"
                >
                  <RefreshCw
                    className={`size-4 ${loading ? 'animate-spin' : ''}`}
                  />
                  <span className="ml-1.5 text-xs font-semibold">Refresh</span>
                </Button>

                {(search || status || employeeId || startDate || endDate) && (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setSearch('');
                      setStatus('');
                      setEmployeeId('');
                      setStartDate('');
                      setEndDate('');
                      setPage(1);
                    }}
                    className="h-10 text-xs text-rose-600 hover:bg-rose-50 px-2.5 rounded-xl"
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Commissions Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
          {loading ? (
            <div className="p-12 text-center">
              <RefreshCw className="mx-auto size-8 animate-spin text-[#107569]" />
              <p className="mt-3 text-sm font-medium text-slate-600">
                Loading commission transactions...
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
                <Percent className="size-7" />
              </div>
              <h3 className="mt-4 text-base font-bold text-slate-800">
                No commission records found
              </h3>
              <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
                {search || status || employeeId || startDate || endDate
                  ? 'No commission transactions match the specified filters.'
                  : 'Commission records will be automatically logged here as sales and deals close.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[#E2E8E5] bg-[#F4F9F6] text-xs font-bold uppercase tracking-wider text-[#163A2E]">
                    <th className="py-3.5 pl-6 pr-4">Employee</th>
                    <th className="py-3.5 px-4">Type</th>
                    <th className="py-3.5 px-4">Rate</th>
                    <th className="py-3.5 px-4">Purchase</th>
                    <th className="py-3.5 px-4">Commission</th>
                    <th className="py-3.5 px-4">Order / Lead</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 pl-4 pr-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((row) => {
                    const empName = `${row.employee?.firstName || ''} ${row.employee?.lastName || ''}`.trim() || row.employee?.name || '—';
                    return (
                      <tr
                        key={row.id}
                        className="transition-colors hover:bg-slate-50/70"
                      >
                        {/* Employee */}
                        <td className="py-3.5 pl-6 pr-4">
                          <div className="flex items-center gap-2.5">
                            <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-emerald-100/70 text-xs font-bold text-[#107569]">
                              {(empName[0] || 'E').toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900 truncate">
                                {empName}
                              </p>
                              {row.employee?.employeeCode && (
                                <p className="text-[11px] font-mono text-slate-400">
                                  {row.employee.employeeCode}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Type */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700 uppercase">
                            {row.commissionType || 'PERCENTAGE'}
                          </span>
                        </td>

                        {/* Rate */}
                        <td className="py-3.5 px-4 whitespace-nowrap font-medium text-slate-800">
                          {row.commissionRate != null
                            ? row.commissionType === 'FIXED'
                              ? inr(row.commissionRate)
                              : `${row.commissionRate}%`
                            : '—'}
                        </td>

                        {/* Purchase Amount */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                          {inr(row.purchaseAmount)}
                        </td>

                        {/* Commission Amount */}
                        <td className="py-3.5 px-4 whitespace-nowrap font-bold text-[#107569]">
                          {inr(row.commissionAmount)}
                        </td>

                        {/* Order / Lead */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="inline-block max-w-[140px] truncate rounded bg-slate-100/80 px-2 py-0.5 font-mono text-xs text-slate-700">
                            {row.orderId || row.purchase?.orderNumber || '—'}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <StatusBadge
                            status={String(row.status || '').toLowerCase()}
                          />
                        </td>

                        {/* Date */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-500 font-medium">
                          {formatDate(row.createdAt)}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 pl-4 pr-6 text-right whitespace-nowrap">
                          {canManage && (
                            <div className="flex items-center justify-end gap-1.5">
                              {row.status === 'PENDING' && (
                                <Button
                                  size="sm"
                                  onClick={() => setStatusFor(row, 'APPROVED')}
                                  className="h-7 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                                >
                                  Approve
                                </Button>
                              )}
                              {row.status === 'APPROVED' && (
                                <Button
                                  size="sm"
                                  onClick={() => setStatusFor(row, 'PAID')}
                                  className="h-7 px-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold"
                                >
                                  Mark Paid
                                </Button>
                              )}
                              {row.status !== 'CANCELLED' && row.status !== 'PAID' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setStatusFor(row, 'CANCELLED')}
                                  className="h-7 px-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 text-xs"
                                >
                                  Cancel
                                </Button>
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

          {/* Pagination Footer */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-200 px-6 py-3.5 bg-slate-50/50">
            <div className="text-xs text-slate-500 font-medium">
              Showing{' '}
              <span className="font-semibold text-slate-900">
                {rows.length > 0 ? (page - 1) * pageSize + 1 : 0}
              </span>{' '}
              to{' '}
              <span className="font-semibold text-slate-900">
                {Math.min(page * pageSize, pagination.total || rows.length)}
              </span>{' '}
              of{' '}
              <span className="font-semibold text-slate-900">
                {pagination.total || rows.length}
              </span>{' '}
              commissions
            </div>

            <div className="flex items-center gap-3 self-end sm:self-auto">
              {/* Page size */}
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <span>Rows:</span>
                <Select
                  value={String(pageSize)}
                  onValueChange={(val) => {
                    setPageSize(Number(val));
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="h-8 w-16 rounded-lg text-xs bg-white border-slate-200">
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
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((v) => v - 1)}
                  className="h-8 px-2.5 rounded-lg text-xs font-semibold"
                >
                  Previous
                </Button>
                <span className="px-2 text-xs font-bold text-[#107569]">
                  {page}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= (pagination.totalPages || 1)}
                  onClick={() => setPage((v) => v + 1)}
                  className="h-8 px-2.5 rounded-lg text-xs font-semibold"
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 5. Redesigned Section: Designation Rates & Employee Overrides ───── */}
      <div className="space-y-4 pt-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Rules & Overrides
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-900">
            Commission Rates & Employee Overrides
          </h2>
          <p className="text-xs text-slate-500">
            Configure default baseline commission rates by job designation and define employee-specific commission overrides.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* ── CARD A: Designation Rates ───────────────────────────────────── */}
          <div className="flex flex-col rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
            {/* Card Header */}
            <div className="border-b border-slate-100 p-5 bg-gradient-to-r from-slate-50/50 to-white">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-[#107569] ring-1 ring-emerald-200/60">
                    <Briefcase className="size-4.5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Designation Rates
                    </h3>
                    <p className="text-xs text-slate-500">
                      Baseline rates by company designation
                    </p>
                  </div>
                </div>

                <div className="relative w-full sm:w-44">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
                  <Input
                    value={designationSearch}
                    onChange={(e) => setDesignationSearch(e.target.value)}
                    placeholder="Search roles..."
                    className="pl-8 h-8 text-xs rounded-xl border-slate-200 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* List of Designation Rates */}
            <div className="divide-y divide-slate-100 max-h-[520px] overflow-y-auto p-2">
              {filteredDesignations.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  No designations match your search.
                </div>
              ) : (
                filteredDesignations.map((item) => {
                  const current = designationRates[item.id] || {
                    rate: item.commissionRate ?? 0,
                    enabled: item.commissionEnabled !== false,
                    type: item.commissionType || 'PERCENTAGE',
                  };
                  const isSaving = savingDesignationId === item.id;

                  return (
                    <div
                      key={item.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl transition hover:bg-slate-50/70"
                    >
                      {/* Designation Title & Metadata */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                            {item.name}
                          </p>
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 uppercase font-mono">
                            {current.type}
                          </span>
                        </div>
                        {item.employeeCount != null && (
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {item.employeeCount} active staff in this role
                          </p>
                        )}
                      </div>

                      {/* Controls: Enable toggle, Rate input, Save button */}
                      {canManage ? (
                        <div className="flex items-center gap-2.5 self-end sm:self-auto shrink-0">
                          {/* Enable Toggle Switch */}
                          <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-600 select-none">
                            <input
                              type="checkbox"
                              checked={current.enabled}
                              onChange={(e) => {
                                setDesignationRates((prev) => ({
                                  ...prev,
                                  [item.id]: {
                                    ...prev[item.id],
                                    enabled: e.target.checked,
                                  },
                                }));
                              }}
                              className="size-4 rounded text-[#107569] focus:ring-[#107569]"
                            />
                            <span className="text-[11px]">Enabled</span>
                          </label>

                          {/* Rate Input */}
                          <div className="relative w-24">
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={current.rate}
                              onChange={(e) => {
                                const val = e.target.value;
                                setDesignationRates((prev) => ({
                                  ...prev,
                                  [item.id]: {
                                    ...prev[item.id],
                                    rate: val,
                                  },
                                }));
                              }}
                              className="h-8 pr-6 text-xs font-bold text-slate-800 rounded-lg text-right"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400 pointer-events-none">
                              {current.type === 'FIXED' ? '₹' : '%'}
                            </span>
                          </div>

                          {/* Save Button */}
                          <Button
                            size="sm"
                            onClick={() => handleSaveDesignationRate(item)}
                            disabled={isSaving}
                            className="h-8 px-3 rounded-lg bg-[#107569] hover:bg-[#0e6359] text-white text-xs font-semibold"
                          >
                            {isSaving ? (
                              <RefreshCw className="size-3.5 animate-spin" />
                            ) : (
                              <span>Save</span>
                            )}
                          </Button>
                        </div>
                      ) : (
                        <span className="font-bold text-sm text-[#107569]">
                          {current.rate}
                          {current.type === 'FIXED' ? ' ₹' : '%'}
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ── CARD B: Employee Overrides ──────────────────────────────────── */}
          <div className="flex flex-col rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
            {/* Card Header */}
            <div className="border-b border-slate-100 p-5 bg-gradient-to-r from-slate-50/50 to-white">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-teal-50 text-[#107569] ring-1 ring-teal-200/60">
                    <Users className="size-4.5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Employee Overrides
                    </h3>
                    <p className="text-xs text-slate-500">
                      Custom rates superseding designation defaults
                    </p>
                  </div>
                </div>

                {canManage && (
                  <Button
                    size="sm"
                    onClick={() => setConfigOpen(true)}
                    className="inline-flex items-center gap-1.5 h-8 rounded-xl bg-[#107569] hover:bg-[#0e6359] text-white text-xs font-semibold shadow-2xs"
                  >
                    <Plus className="size-3.5" />
                    <span>Add Override</span>
                  </Button>
                )}
              </div>
            </div>

            {/* Overrides Content */}
            <div className="flex-1 p-3 divide-y divide-slate-100 max-h-[520px] overflow-y-auto">
              {configs.employees.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
                    <Users className="size-6" />
                  </div>
                  <h4 className="mt-3 text-sm font-bold text-slate-800">
                    No employee overrides configured
                  </h4>
                  <p className="mx-auto mt-1 max-w-xs text-xs text-slate-500">
                    All employees currently inherit their designation baseline commission rate. You can set individual overrides when special arrangements apply.
                  </p>
                  {canManage && (
                    <Button
                      size="sm"
                      onClick={() => setConfigOpen(true)}
                      className="mt-4 rounded-xl bg-[#107569] text-white hover:bg-[#0e6359] text-xs font-semibold"
                    >
                      <Plus className="size-3.5 mr-1" />
                      Set Employee Override
                    </Button>
                  )}
                </div>
              ) : (
                configs.employees.map((item) => {
                  const empName = `${item.employee?.firstName || ''} ${item.employee?.lastName || ''}`.trim() || item.employee?.employeeCode || `Employee #${item.employeeId}`;
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 p-3 rounded-xl transition hover:bg-slate-50"
                    >
                      {/* Employee details */}
                      <div className="min-w-0">
                        <p className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                          {empName}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {item.employee?.employeeCode}
                          {item.employee?.designation?.name && (
                            <span className="ml-1 text-slate-400">
                              · {item.employee.designation.name}
                            </span>
                          )}
                        </p>
                      </div>

                      {/* Override details */}
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-[#107569] border border-emerald-200/60">
                          {item.commissionType === 'FIXED'
                            ? inr(item.commissionValue)
                            : `${item.commissionValue}%`}
                        </span>

                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            item.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {item.status || 'ACTIVE'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── 6. Employee Commission Override Drawer ─────────────────────────── */}
      <FormDrawer
        open={configOpen}
        onOpenChange={setConfigOpen}
        title="Employee Commission Override"
        description="Set a custom commission rule for a specific employee. This overrides the default designation rate."
        onSubmit={saveOverride}
        loading={configSaving}
        submitLabel="Save Override"
        size="standard"
      >
        <div className="space-y-4 text-sm">
          <div>
            <Label className="text-xs font-bold text-slate-700">
              Select Employee <span className="text-rose-500">*</span>
            </Label>
            <Select
              value={String(config.employeeId)}
              onValueChange={(val) => setConfig({ ...config, employeeId: val })}
            >
              <SelectTrigger className="mt-1 h-9 rounded-xl text-sm bg-white">
                <SelectValue placeholder="Select an employee..." />
              </SelectTrigger>
              <SelectContent>
                {employees.map((emp) => (
                  <SelectItem
                    key={emp.recordId || emp.id}
                    value={String(emp.recordId || emp.id)}
                  >
                    {emp.name} ({emp.id})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <Label className="text-xs font-bold text-slate-700">
                Commission Type
              </Label>
              <Select
                value={config.commissionType}
                onValueChange={(val) =>
                  setConfig({ ...config, commissionType: val })
                }
              >
                <SelectTrigger className="mt-1 h-9 rounded-xl text-sm bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
                  <SelectItem value="FIXED">Fixed Amount (₹)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-bold text-slate-700">
                Rate / Value <span className="text-rose-500">*</span>
              </Label>
              <div className="relative mt-1">
                <Input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder={
                    config.commissionType === 'FIXED' ? '1000' : '5.0'
                  }
                  value={config.commissionValue}
                  onChange={(e) =>
                    setConfig({ ...config, commissionValue: e.target.value })
                  }
                  className="h-9 rounded-xl text-sm pr-7 font-bold text-[#107569]"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                  {config.commissionType === 'FIXED' ? '₹' : '%'}
                </span>
              </div>
            </div>
          </div>

          <div>
            <Label className="text-xs font-bold text-slate-700">Status</Label>
            <Select
              value={config.status}
              onValueChange={(val) => setConfig({ ...config, status: val })}
            >
              <SelectTrigger className="mt-1 h-9 rounded-xl text-sm bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </FormDrawer>
    </div>
  );
}
