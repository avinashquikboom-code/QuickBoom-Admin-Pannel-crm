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
  Users,
  Briefcase,
  ChevronRight,
  Filter,
  Check,
  X,
  AlertCircle,
  ShieldCheck,
  BadgePercent,
  Save,
  Info,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  ArrowUpDown,
  Calendar,
  Building,
  Coins,
} from 'lucide-react';

import { PageHeader } from '@/components/layout/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { TruncatedText } from '@/components/common/TruncatedText';
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
  // Navigation Tabs: 'ledger' | 'rules' | 'wallet'
  const [activeTab, setActiveTab] = React.useState('ledger');

  // Commissions Data State
  const [rows, setRows] = React.useState([]);
  const [summary, setSummary] = React.useState({
    totalCommission: 0,
    pendingCommission: 0,
    approvedCommission: 0,
    paidCommission: 0,
  });
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
  const [statusFilter, setStatusFilter] = React.useState('');
  const [employeeFilter, setEmployeeFilter] = React.useState('');
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [pagination, setPagination] = React.useState({ total: 0, totalPages: 1 });
  const [refresh, setRefresh] = React.useState(0);

  // Designation Rates state & inline edits
  const [designationSearch, setDesignationSearch] = React.useState('');
  const [designationFilter, setDesignationFilter] = React.useState('ALL'); // 'ALL' | 'ENABLED' | 'DISABLED'
  const [designationRates, setDesignationRates] = React.useState({});
  const [savingDesignationId, setSavingDesignationId] = React.useState(null);
  const [savedDesignationId, setSavedDesignationId] = React.useState(null);

  // Employee Overrides search
  const [overrideSearch, setOverrideSearch] = React.useState('');

  // Employee Override Drawer state
  const [overrideDrawerOpen, setOverrideDrawerOpen] = React.useState(false);
  const [overrideSaving, setOverrideSaving] = React.useState(false);
  const [editingOverride, setEditingOverride] = React.useState(null);
  const [overrideForm, setOverrideForm] = React.useState({
    employeeId: '',
    commissionType: 'PERCENTAGE',
    commissionValue: '5.0',
    status: 'ACTIVE',
  });

  const [canManage, setCanManage] = React.useState(false);
  React.useEffect(() => {
    setCanManage(sessionCan('COMMISSION') || sessionCan('HRM'));
  }, []);

  // Debounce search input
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Load Data with Promise.allSettled Resilience
  React.useEffect(() => {
    let isMounted = true;
    setLoading(true);

    Promise.allSettled([
      loadCommissions({
        page,
        limit: pageSize,
        search: debouncedSearch.trim() || undefined,
        status: statusFilter || undefined,
        employeeId: employeeFilter || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      }),
      loadCommissionConfigs(),
      loadEmployees(),
    ])
      .then(([commissionsRes, configsRes, employeesRes]) => {
        if (!isMounted) return;

        if (commissionsRes.status === 'fulfilled') {
          const res = commissionsRes.value;
          setRows(res.rows || []);
          setSummary({
            totalCommission: Number(res.summary?.totalCommission) || 0,
            pendingCommission: Number(res.summary?.pendingCommission) || 0,
            approvedCommission: Number(res.summary?.approvedCommission) || 0,
            paidCommission: Number(res.summary?.paidCommission) || 0,
          });
          setPagination(res.pagination || { total: res.rows?.length || 0, totalPages: 1 });
        }

        if (configsRes.status === 'fulfilled') {
          const conf = configsRes.value;
          setConfigs({
            designations: conf.designations || [],
            employees: conf.employees || [],
          });

          // Initialize designation rates map
          const ratesMap = {};
          (conf.designations || []).forEach((d) => {
            ratesMap[d.id] = {
              rate: d.commissionRate ?? 0,
              enabled: d.commissionEnabled !== false,
              type: d.commissionType || 'PERCENTAGE',
            };
          });
          setDesignationRates(ratesMap);
        }

        if (employeesRes.status === 'fulfilled') {
          setEmployees(employeesRes.value || []);
        }

        setError('');
      })
      .catch((err) => {
        if (isMounted) setError(hrmError(err));
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [
    refresh,
    page,
    pageSize,
    debouncedSearch,
    statusFilter,
    employeeFilter,
    startDate,
    endDate,
  ]);

  // Handle Status Update (Approve, Mark Paid, Cancel)
  const handleUpdateStatus = async (row, nextStatus) => {
    try {
      await updateCommissionStatus(row.id, nextStatus);
      toast.success(`Commission #${row.id} marked as ${nextStatus.toLowerCase()}`);
      setRefresh((v) => v + 1);
    } catch (err) {
      toast.error(hrmError(err));
    }
  };

  // Save Designation Baseline Rate
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
      setSavedDesignationId(designation.id);
      setTimeout(() => setSavedDesignationId(null), 2500);
      toast.success(`${designation.name} baseline rate updated`);
      setRefresh((v) => v + 1);
    } catch (err) {
      toast.error(hrmError(err));
    } finally {
      setSavingDesignationId(null);
    }
  };

  // Open Drawer for New Override
  const handleOpenNewOverride = () => {
    setEditingOverride(null);
    setOverrideForm({
      employeeId: '',
      commissionType: 'PERCENTAGE',
      commissionValue: '5.0',
      status: 'ACTIVE',
    });
    setOverrideDrawerOpen(true);
  };

  // Open Drawer to Edit Existing Override
  const handleOpenEditOverride = (item) => {
    setEditingOverride(item);
    setOverrideForm({
      employeeId: String(item.employeeId),
      commissionType: item.commissionType || 'PERCENTAGE',
      commissionValue: String(item.commissionValue ?? '5.0'),
      status: item.status || 'ACTIVE',
    });
    setOverrideDrawerOpen(true);
  };

  // Save Employee Override
  const handleSaveOverride = async (e) => {
    if (e?.preventDefault) e.preventDefault();

    if (!overrideForm.employeeId) {
      toast.error('Please select an employee');
      return;
    }

    if (overrideForm.commissionValue === '' || Number(overrideForm.commissionValue) < 0) {
      toast.error('Please enter a valid commission rate or amount');
      return;
    }

    setOverrideSaving(true);
    try {
      await saveEmployeeCommission({
        employeeId: Number(overrideForm.employeeId),
        commissionType: overrideForm.commissionType,
        commissionValue: Number(overrideForm.commissionValue),
        status: overrideForm.status || 'ACTIVE',
      });
      toast.success(
        editingOverride
          ? 'Employee commission override updated'
          : 'Employee commission override added successfully'
      );
      setOverrideDrawerOpen(false);
      setRefresh((v) => v + 1);
    } catch (err) {
      toast.error(hrmError(err));
    } finally {
      setOverrideSaving(false);
    }
  };

  // Quick Toggle Status of Existing Override
  const handleToggleOverrideStatus = async (item) => {
    const nextStatus = item.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await saveEmployeeCommission({
        employeeId: Number(item.employeeId),
        commissionType: item.commissionType || 'PERCENTAGE',
        commissionValue: Number(item.commissionValue) || 0,
        status: nextStatus,
      });
      toast.success(`Override set to ${nextStatus.toLowerCase()}`);
      setRefresh((v) => v + 1);
    } catch (err) {
      toast.error(hrmError(err));
    }
  };

  // Filtered Designations for Search & Filter
  const filteredDesignations = React.useMemo(() => {
    return (configs.designations || []).filter((d) => {
      const q = designationSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (d.name && d.name.toLowerCase().includes(q)) ||
        (d.code && d.code.toLowerCase().includes(q));

      const current = designationRates[d.id] || { enabled: d.commissionEnabled !== false };
      const matchesFilter =
        designationFilter === 'ALL' ||
        (designationFilter === 'ENABLED' && current.enabled) ||
        (designationFilter === 'DISABLED' && !current.enabled);

      return matchesSearch && matchesFilter;
    });
  }, [configs.designations, designationSearch, designationFilter, designationRates]);

  // Filtered Employee Overrides
  const filteredOverrides = React.useMemo(() => {
    if (!overrideSearch.trim()) return configs.employees || [];
    const q = overrideSearch.toLowerCase().trim();
    return (configs.employees || []).filter((item) => {
      const empName = `${item.employee?.firstName || ''} ${item.employee?.lastName || ''}`.toLowerCase();
      const empCode = String(item.employee?.employeeCode || '').toLowerCase();
      const designationName = String(item.employee?.designation?.name || '').toLowerCase();
      return empName.includes(q) || empCode.includes(q) || designationName.includes(q);
    });
  }, [configs.employees, overrideSearch]);

  // Selected Employee Details for Drawer Preview
  const selectedEmployeeData = React.useMemo(() => {
    if (!overrideForm.employeeId) return null;
    const emp = employees.find(
      (e) => String(e.recordId || e.id) === String(overrideForm.employeeId)
    );
    if (!emp) return null;

    // Find their designation baseline
    const desId = emp.designation?.id || emp.designationId;
    const baseline = (configs.designations || []).find((d) => d.id === desId);
    const existingOverride = (configs.employees || []).find(
      (ov) => String(ov.employeeId) === String(emp.recordId || emp.id)
    );

    return {
      emp,
      baseline,
      existingOverride,
    };
  }, [overrideForm.employeeId, employees, configs.designations, configs.employees]);

  // Calculate Example Commission Preview for Drawer
  const [simulatedDealSize, setSimulatedDealSize] = React.useState(50000);
  const simulatedExample = React.useMemo(() => {
    const sampleDeal = simulatedDealSize || 50000;
    const val = Number(overrideForm.commissionValue) || 0;
    let earned = 0;
    if (overrideForm.commissionType === 'FIXED') {
      earned = val;
    } else {
      earned = Math.round(((sampleDeal * val) / 100) * 100) / 100;
    }
    return { sampleDeal, earned };
  }, [overrideForm.commissionType, overrideForm.commissionValue, simulatedDealSize]);

  // Status Counts for Pill Filters
  const statusCounts = React.useMemo(() => {
    return {
      all: rows.length,
      pending: rows.filter((r) => r.status === 'PENDING').length,
      approved: rows.filter((r) => r.status === 'APPROVED').length,
      paid: rows.filter((r) => r.status === 'PAID').length,
      cancelled: rows.filter((r) => r.status === 'CANCELLED').length,
    };
  }, [rows]);

  // If Wallet tab is active, show the CommissionWalletPage
  if (activeTab === 'wallet') {
    return (
      <div className="space-y-6 max-w-none w-full min-w-0 font-sans text-slate-800 pb-16">
        <PageHeader
          category="COMPENSATION & PAYROLL"
          title="Commissions"
          description="Manage sales commissions, quota accelerators, and revenue incentive schemes."
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab('ledger')}
                className="h-9 rounded-xl border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50"
              >
                Back to Commissions
              </Button>
            </div>
          }
        />

        {/* Tab switcher */}
        <div className="flex items-center gap-1.5 border-b border-slate-200 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab('ledger')}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200/90 bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-2xs hover:bg-slate-50"
          >
            <Percent className="size-3.5 text-slate-400" />
            <span>Ledger & Payouts</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('rules')}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200/90 bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-2xs hover:bg-slate-50"
          >
            <Briefcase className="size-3.5 text-slate-400" />
            <span>Rates & Overrides</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('wallet')}
            className="inline-flex items-center gap-2 rounded-xl bg-[#16A34A] px-4 py-2 text-xs font-semibold text-white shadow-xs"
          >
            <Wallet className="size-3.5" />
            <span>Commission Wallet</span>
          </button>
        </div>

        <CommissionWalletPage />
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 max-w-none space-y-6 overflow-x-hidden pb-16 font-sans text-slate-800">
      {/* ── 1. Page Header (Modern Green SaaS Hero Banner) ────────────────── */}
      <PageHeader
        category="COMPENSATION & PAYROLL"
        title="Commissions"
        description="Track employee commission records, configure designation baseline rates, and manage custom employee overrides."
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRefresh((v) => v + 1)}
              disabled={loading}
              className="h-9 px-3.5 rounded-xl border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50"
            >
              <RefreshCw className={`size-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>

            {canManage && (
              <Button
                size="sm"
                onClick={handleOpenNewOverride}
                className="h-9 px-4 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <Plus className="size-3.5 mr-1.5" />
                <span>Add Override</span>
              </Button>
            )}
          </div>
        }
      />

      {/* ── 2. Top Navigation Tabs ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('ledger')}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer ${
              activeTab === 'ledger'
                ? 'bg-[#16A34A] text-white shadow-xs'
                : 'border border-slate-200/90 bg-white text-slate-600 shadow-2xs hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Percent className="size-3.5" />
            <span>Ledger & Payouts</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                activeTab === 'ledger'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {pagination.total || rows.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('rules')}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer ${
              activeTab === 'rules'
                ? 'bg-[#16A34A] text-white shadow-xs'
                : 'border border-slate-200/90 bg-white text-slate-600 shadow-2xs hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Briefcase className="size-3.5" />
            <span>Rates & Overrides</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                activeTab === 'rules'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {(configs.designations?.length || 0) + (configs.employees?.length || 0)}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('wallet')}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer ${
              activeTab === 'wallet'
                ? 'bg-[#16A34A] text-white shadow-xs'
                : 'border border-slate-200/90 bg-white text-slate-600 shadow-2xs hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Wallet className="size-3.5" />
            <span>Commission Wallet</span>
          </button>
        </div>
      </div>

      {/* ── 3. Four Dashboard KPI Statistic Cards ──────────────────────────── */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Commission */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4.5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-start justify-between">
            <div className="space-y-1 min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Total Commission
              </p>
              <p className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 truncate">
                {inr(summary.totalCommission)}
              </p>
              <p className="text-xs text-slate-400">All recorded transactions</p>
            </div>
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60">
              <BadgePercent className="size-5.5" />
            </div>
          </div>
        </div>

        {/* Pending Approval */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4.5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-start justify-between">
            <div className="space-y-1 min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Pending Approval
              </p>
              <p className="text-xl sm:text-2xl font-extrabold tracking-tight text-amber-700 truncate">
                {inr(summary.pendingCommission)}
              </p>
              <p className="text-xs text-amber-600 font-medium">Awaiting manager review</p>
            </div>
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700 ring-1 ring-amber-200/60">
              <Clock className="size-5.5" />
            </div>
          </div>
        </div>

        {/* Approved Commission */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4.5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-start justify-between">
            <div className="space-y-1 min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Approved (Payout Ready)
              </p>
              <p className="text-xl sm:text-2xl font-extrabold tracking-tight text-emerald-700 truncate">
                {inr(summary.approvedCommission)}
              </p>
              <p className="text-xs text-emerald-600 font-medium">Ready for payroll batch</p>
            </div>
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60">
              <CheckCircle2 className="size-5.5" />
            </div>
          </div>
        </div>

        {/* Paid Commission */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4.5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-start justify-between">
            <div className="space-y-1 min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Disbursed / Paid
              </p>
              <p className="text-xl sm:text-2xl font-extrabold tracking-tight text-teal-800 truncate">
                {inr(summary.paidCommission)}
              </p>
              <p className="text-xs text-slate-400">Successfully disbursed</p>
            </div>
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 ring-1 ring-teal-200/60">
              <Wallet className="size-5.5" />
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. TAB 1: TRANSACTIONS LEDGER & FILTERS ─────────────────────────── */}
      {activeTab === 'ledger' && (
        <div className="space-y-4">
          {/* Segmented Status Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: '', label: 'All Statuses', count: statusCounts.all },
              { id: 'PENDING', label: 'Pending', count: statusCounts.pending, color: 'text-amber-700 bg-amber-50 border-amber-200' },
              { id: 'APPROVED', label: 'Approved', count: statusCounts.approved, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
              { id: 'PAID', label: 'Paid', count: statusCounts.paid, color: 'text-teal-700 bg-teal-50 border-teal-200' },
              { id: 'CANCELLED', label: 'Cancelled', count: statusCounts.cancelled, color: 'text-slate-600 bg-slate-50 border-slate-200' },
            ].map((tab) => {
              const isSelected = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setStatusFilter(tab.id);
                    setPage(1);
                  }}
                  className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all shrink-0 cursor-pointer border ${
                    isSelected
                      ? 'bg-[#16A34A] text-white border-[#16A34A] shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <span
                      className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Search and Dropdown Controls */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-xs">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search employee name, code, order or lead..."
                className="pl-9 pr-8 h-9.5 w-full rounded-xl border-slate-200 bg-slate-50/50 text-xs sm:text-sm focus:bg-white"
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
              {/* Employee Filter */}
              <div className="w-full sm:w-48">
                <Select
                  value={employeeFilter || 'ALL'}
                  onValueChange={(val) => {
                    setEmployeeFilter(val === 'ALL' ? '' : val);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="h-9.5 rounded-xl border-slate-200 text-xs bg-white">
                    <SelectValue placeholder="All Employees" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Employees</SelectItem>
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

              {/* Date Filters */}
              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setPage(1);
                  }}
                  className="h-9.5 text-xs rounded-xl border-slate-200 bg-white"
                  title="From Date"
                />
                <span className="text-slate-400 text-xs">to</span>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setPage(1);
                  }}
                  className="h-9.5 text-xs rounded-xl border-slate-200 bg-white"
                  title="To Date"
                />
              </div>

              {/* Clear button */}
              {(search || statusFilter || employeeFilter || startDate || endDate) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearch('');
                    setStatusFilter('');
                    setEmployeeFilter('');
                    setStartDate('');
                    setEndDate('');
                    setPage(1);
                  }}
                  className="h-9.5 text-xs text-rose-600 hover:bg-rose-50 px-2.5 rounded-xl"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </div>

          {/* Data Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
            {loading ? (
              <div className="p-12 text-center">
                <RefreshCw className="mx-auto size-7 animate-spin text-[#16A34A]" />
                <p className="mt-3 text-xs font-semibold text-slate-600">
                  Loading commission records...
                </p>
              </div>
            ) : error ? (
              <div className="p-8 text-center">
                <AlertCircle className="mx-auto size-8 text-rose-500" />
                <p className="mt-2 text-xs font-semibold text-rose-700">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRefresh((v) => v + 1)}
                  className="mt-3"
                >
                  Retry
                </Button>
              </div>
            ) : rows.length === 0 ? (
              <div className="p-16 text-center">
                <div className="mx-auto flex size-13 items-center justify-center rounded-2xl bg-emerald-50 text-[#16A34A]">
                  <Percent className="size-6" />
                </div>
                <h3 className="mt-4 text-sm font-bold text-slate-800">
                  No commission transactions found
                </h3>
                <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500">
                  {search || statusFilter || employeeFilter || startDate || endDate
                    ? 'No records match the active filter criteria. Try adjusting or clearing your filters.'
                    : 'Commission records will be logged automatically as client deals and orders close.'}
                </p>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-[#E2E8E5] bg-[#F4F9F6] text-[11px] font-bold uppercase tracking-wider text-[#163A2E]">
                        <th className="py-3 pl-5 pr-3">Employee</th>
                        <th className="py-3 px-3">Type & Rate</th>
                        <th className="py-3 px-3">Order / Lead</th>
                        <th className="py-3 px-3 text-right">Deal Amount</th>
                        <th className="py-3 px-3 text-right">Commission</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3">Date</th>
                        <th className="py-3 pl-3 pr-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rows.map((row) => {
                        const empName = `${row.employee?.firstName || ''} ${row.employee?.lastName || ''}`.trim() || row.employee?.name || 'Staff Member';
                        const initial = (empName[0] || 'E').toUpperCase();
                        const orderRef = row.orderId || row.purchase?.orderNumber || (row.leadId ? `LEAD-${row.leadId}` : '—');

                        return (
                          <tr
                            key={row.id}
                            className="transition-colors hover:bg-slate-50/70"
                          >
                            {/* Employee */}
                            <td className="py-3 pl-5 pr-3">
                              <div className="flex items-center gap-2.5">
                                <div className="flex size-7.5 shrink-0 items-center justify-center rounded-lg bg-emerald-100/80 text-xs font-bold text-[#16A34A]">
                                  {initial}
                                </div>
                                <div className="min-w-0 max-w-[180px]">
                                  <TruncatedText className="font-semibold text-slate-900">
                                    {empName}
                                  </TruncatedText>
                                  {row.employee?.employeeCode && (
                                    <p className="text-[10px] font-mono text-slate-400">
                                      {row.employee.employeeCode}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Type & Rate */}
                            <td className="py-3 px-3 whitespace-nowrap">
                              <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700">
                                {row.commissionType === 'FIXED'
                                  ? `Fixed · ${inr(row.commissionRate || row.commissionAmount)}`
                                  : `${row.commissionRate ?? 0}%`}
                              </span>
                            </td>

                            {/* Order / Lead */}
                            <td className="py-3 px-3 whitespace-nowrap">
                              <span className="inline-block max-w-[130px] font-mono text-[11px] text-slate-600 bg-slate-100/70 rounded px-1.5 py-0.5">
                                <TruncatedText>{orderRef}</TruncatedText>
                              </span>
                            </td>

                            {/* Purchase Amount */}
                            <td className="py-3 px-3 whitespace-nowrap text-right font-medium text-slate-600">
                              {inr(row.purchaseAmount)}
                            </td>

                            {/* Commission Amount */}
                            <td className="py-3 px-3 whitespace-nowrap text-right font-bold text-[#16A34A]">
                              {inr(row.commissionAmount)}
                            </td>

                            {/* Status */}
                            <td className="py-3 px-3 whitespace-nowrap">
                              <StatusBadge status={String(row.status || '').toLowerCase()} />
                            </td>

                            {/* Date */}
                            <td className="py-3 px-3 whitespace-nowrap text-slate-500 font-medium">
                              {formatDate(row.createdAt)}
                            </td>

                            {/* Actions */}
                            <td className="py-3 pl-3 pr-5 text-right whitespace-nowrap">
                              {canManage && (
                                <div className="flex items-center justify-end gap-1.5">
                                  {row.status === 'PENDING' && (
                                    <Button
                                      size="sm"
                                      onClick={() => handleUpdateStatus(row, 'APPROVED')}
                                      className="h-7 px-2.5 rounded-lg bg-[#16A34A] hover:bg-[#15803D] text-white text-[11px] font-semibold shadow-2xs"
                                    >
                                      Approve
                                    </Button>
                                  )}
                                  {row.status === 'APPROVED' && (
                                    <Button
                                      size="sm"
                                      onClick={() => handleUpdateStatus(row, 'PAID')}
                                      className="h-7 px-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-semibold shadow-2xs"
                                    >
                                      Mark Paid
                                    </Button>
                                  )}
                                  {row.status !== 'CANCELLED' && row.status !== 'PAID' && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleUpdateStatus(row, 'CANCELLED')}
                                      className="h-7 px-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 text-[11px]"
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

                {/* Mobile Responsive Cards View (< 768px) */}
                <div className="block md:hidden divide-y divide-slate-100">
                  {rows.map((row) => {
                    const empName = `${row.employee?.firstName || ''} ${row.employee?.lastName || ''}`.trim() || row.employee?.name || 'Staff Member';
                    const initial = (empName[0] || 'E').toUpperCase();
                    const orderRef = row.orderId || row.purchase?.orderNumber || (row.leadId ? `LEAD-${row.leadId}` : '—');

                    return (
                      <div key={row.id} className="p-4 space-y-2.5 transition hover:bg-slate-50/70">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-emerald-100/80 text-xs font-bold text-[#16A34A]">
                              {initial}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 text-xs">{empName}</p>
                              {row.employee?.employeeCode && (
                                <p className="text-[10px] font-mono text-slate-400">{row.employee.employeeCode}</p>
                              )}
                            </div>
                          </div>
                          <StatusBadge status={String(row.status || '').toLowerCase()} />
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Rate / Type</span>
                            <span className="font-semibold text-slate-700">
                              {row.commissionType === 'FIXED' ? `Fixed · ${inr(row.commissionRate || row.commissionAmount)}` : `${row.commissionRate ?? 0}%`}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Commission</span>
                            <span className="font-black text-[#16A34A]">{inr(row.commissionAmount)}</span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Deal Ref</span>
                            <span className="font-mono text-[11px] text-slate-600 truncate">{orderRef}</span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Deal Size</span>
                            <span className="font-semibold text-slate-700">{inr(row.purchaseAmount)}</span>
                          </div>
                        </div>

                        {canManage && (row.status === 'PENDING' || row.status === 'APPROVED') && (
                          <div className="flex items-center justify-end gap-2 pt-1">
                            {row.status === 'PENDING' && (
                              <Button
                                size="sm"
                                onClick={() => handleUpdateStatus(row, 'APPROVED')}
                                className="h-7 px-3 rounded-lg bg-[#16A34A] text-white text-xs font-semibold"
                              >
                                Approve
                              </Button>
                            )}
                            {row.status === 'APPROVED' && (
                              <Button
                                size="sm"
                                onClick={() => handleUpdateStatus(row, 'PAID')}
                                className="h-7 px-3 rounded-lg bg-teal-600 text-white text-xs font-semibold"
                              >
                                Mark Paid
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-200 px-5 py-3 bg-slate-50/50">
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
                records
              </div>

              <div className="flex items-center gap-3 self-end sm:self-auto">
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
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

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
                  <span className="px-2 text-xs font-bold text-[#16A34A]">
                    {page} / {pagination.totalPages || 1}
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
      )}

      {/* ── 5. TAB 2: RATES & OVERRIDES (DESIGNATION & EMPLOYEE RULES) ──────── */}
      {activeTab === 'rules' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* ── CARD A: Designation Baseline Rates ─────────────────────────── */}
            <div className="flex flex-col rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
              {/* Header */}
              <div className="border-b border-slate-100 p-4.5 bg-gradient-to-r from-slate-50/70 to-white">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-[#16A34A] ring-1 ring-emerald-200/60">
                      <Briefcase className="size-4.5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        Designation Baseline Rates
                      </h3>
                      <p className="text-xs text-slate-500">
                        Default rules applied automatically by job role
                      </p>
                    </div>
                  </div>

                  <div className="relative w-full sm:w-48">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
                    <Input
                      value={designationSearch}
                      onChange={(e) => setDesignationSearch(e.target.value)}
                      placeholder="Search roles..."
                      className="pl-8 h-8 text-xs rounded-xl border-slate-200 bg-white"
                    />
                    {designationSearch && (
                      <button
                        type="button"
                        onClick={() => setDesignationSearch('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="size-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-slate-100 text-xs">
                  <span className="text-[11px] font-semibold text-slate-400 mr-1">Filter:</span>
                  {[
                    { id: 'ALL', label: 'All Roles' },
                    { id: 'ENABLED', label: 'Enabled Only' },
                    { id: 'DISABLED', label: 'Disabled' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setDesignationFilter(f.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                        designationFilter === f.id
                          ? 'bg-[#16A34A] text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Designation List */}
              <div className="divide-y divide-slate-100 max-h-[560px] overflow-y-auto p-2">
                {filteredDesignations.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    No designation rules match your search.
                  </div>
                ) : (
                  filteredDesignations.map((item) => {
                    const current = designationRates[item.id] || {
                      rate: item.commissionRate ?? 0,
                      enabled: item.commissionEnabled !== false,
                      type: item.commissionType || 'PERCENTAGE',
                    };
                    const isSaving = savingDesignationId === item.id;
                    const isJustSaved = savedDesignationId === item.id;

                    return (
                      <div
                        key={item.id}
                        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl transition-all ${
                          current.enabled ? 'hover:bg-slate-50/80' : 'bg-slate-50/40 opacity-75'
                        }`}
                      >
                        {/* Designation Title & Metadata */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                              {item.name}
                            </p>
                            {item.code && (
                              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-slate-600">
                                {item.code}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                            {item.employeeCount != null && (
                              <span>{item.employeeCount} active staff</span>
                            )}
                            <span>·</span>
                            <span className="font-semibold text-slate-500 uppercase">
                              {current.type}
                            </span>
                          </div>
                        </div>

                        {/* Controls */}
                        {canManage ? (
                          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                            {/* Enabled Toggle */}
                            <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-600 select-none mr-1">
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
                                className="size-4 rounded text-[#16A34A] focus:ring-[#16A34A]"
                              />
                              <span className="text-[11px] text-slate-500">
                                {current.enabled ? 'Active' : 'Off'}
                              </span>
                            </label>

                            {/* Type selector */}
                            <div className="w-20">
                              <Select
                                value={current.type}
                                onValueChange={(val) => {
                                  setDesignationRates((prev) => ({
                                    ...prev,
                                    [item.id]: {
                                      ...prev[item.id],
                                      type: val,
                                    },
                                  }));
                                }}
                              >
                                <SelectTrigger className="h-8 text-[11px] font-bold rounded-lg bg-white border-slate-200">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="PERCENTAGE">% Rate</SelectItem>
                                  <SelectItem value="FIXED">₹ Fixed</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Rate Input */}
                            <div className="relative w-22">
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
                              className={`h-8 px-3 rounded-lg text-xs font-semibold shadow-2xs transition-all ${
                                isJustSaved
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-[#16A34A] hover:bg-[#15803D] text-white'
                              }`}
                            >
                              {isSaving ? (
                                <RefreshCw className="size-3.5 animate-spin" />
                              ) : isJustSaved ? (
                                <span className="inline-flex items-center gap-1">
                                  <Check className="size-3" />
                                  <span>Saved</span>
                                </span>
                              ) : (
                                <span>Save</span>
                              )}
                            </Button>
                          </div>
                        ) : (
                          <span className="font-bold text-xs text-[#16A34A] bg-emerald-50 px-2 py-1 rounded-lg">
                            {current.type === 'FIXED' ? inr(current.rate) : `${current.rate}%`}
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* ── CARD B: Employee Overrides ─────────────────────────────────── */}
            <div className="flex flex-col rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
              {/* Header */}
              <div className="border-b border-slate-100 p-4.5 bg-gradient-to-r from-slate-50/70 to-white">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-teal-50 text-[#16A34A] ring-1 ring-teal-200/60">
                      <Users className="size-4.5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        Employee Overrides
                      </h3>
                      <p className="text-xs text-slate-500">
                        Custom employee terms superseding baseline designation rates
                      </p>
                    </div>
                  </div>

                  {canManage && (
                    <Button
                      size="sm"
                      onClick={handleOpenNewOverride}
                      className="inline-flex items-center gap-1.5 h-8 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-semibold shadow-2xs"
                    >
                      <Plus className="size-3.5" />
                      <span>Add Override</span>
                    </Button>
                  )}
                </div>

                {/* Override Search */}
                <div className="relative mt-3">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
                  <Input
                    value={overrideSearch}
                    onChange={(e) => setOverrideSearch(e.target.value)}
                    placeholder="Search overrides by employee name, code..."
                    className="pl-8 h-8 text-xs rounded-xl border-slate-200 bg-white"
                  />
                  {overrideSearch && (
                    <button
                      type="button"
                      onClick={() => setOverrideSearch('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="size-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Overrides Content List */}
              <div className="flex-1 p-2 divide-y divide-slate-100 max-h-[560px] overflow-y-auto">
                {filteredOverrides.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
                      <Users className="size-6" />
                    </div>
                    <h4 className="mt-3 text-sm font-bold text-slate-800">
                      No employee overrides configured
                    </h4>
                    <p className="mx-auto mt-1 max-w-xs text-xs text-slate-500">
                      All employees currently inherit their designation baseline rate. Set individual custom rates when special incentive agreements apply.
                    </p>
                    {canManage && (
                      <Button
                        size="sm"
                        onClick={handleOpenNewOverride}
                        className="mt-4 rounded-xl bg-[#16A34A] text-white hover:bg-[#15803D] text-xs font-semibold shadow-xs"
                      >
                        <Plus className="size-3.5 mr-1" />
                        <span>Set Employee Override</span>
                      </Button>
                    )}
                  </div>
                ) : (
                  filteredOverrides.map((item) => {
                    const empName = `${item.employee?.firstName || ''} ${item.employee?.lastName || ''}`.trim() || item.employee?.employeeCode || `Employee #${item.employeeId}`;
                    const initial = (empName[0] || 'E').toUpperCase();
                    const isActive = item.status === 'ACTIVE';

                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-3 p-3 rounded-xl transition hover:bg-slate-50"
                      >
                        {/* Employee Avatar & Details */}
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-emerald-100/70 text-xs font-bold text-[#16A34A]">
                            {initial}
                          </div>
                          <div className="min-w-0">
                            <TruncatedText className="font-bold text-xs sm:text-sm text-slate-900">
                              {empName}
                            </TruncatedText>
                            <p className="text-[11px] text-slate-500">
                              <span className="font-mono text-slate-400">
                                {item.employee?.employeeCode}
                              </span>
                              {item.employee?.designation?.name && (
                                <span className="ml-1 text-slate-500">
                                  · {item.employee.designation.name}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Override Rate & Action Buttons */}
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="inline-flex items-center rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-[#16A34A] border border-emerald-200/60">
                            {item.commissionType === 'FIXED'
                              ? inr(item.commissionValue)
                              : `${item.commissionValue}%`}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleToggleOverrideStatus(item)}
                            title="Click to toggle status"
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold transition-all cursor-pointer ${
                              isActive
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                            }`}
                          >
                            {item.status || 'ACTIVE'}
                          </button>

                          {canManage && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenEditOverride(item)}
                              className="size-7 p-0 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                              title="Edit override"
                            >
                              <Edit3 className="size-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 6. REDESIGNED SLIDE-OVER DRAWER: EMPLOYEE COMMISSION OVERRIDE ───── */}
      <FormDrawer
        open={overrideDrawerOpen}
        onOpenChange={setOverrideDrawerOpen}
        title={editingOverride ? 'Edit Commission Override' : 'Employee Commission Override'}
        description="Set a custom commission rule for a specific employee. This overrides the default designation rate."
        onSubmit={handleSaveOverride}
        loading={overrideSaving}
        submitLabel={editingOverride ? 'Update Override' : 'Save Override'}
        size="standard"
      >
        <div className="space-y-4.5 text-xs text-slate-700">
          {/* Select Employee */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-800">
              Select Employee <span className="text-rose-500">*</span>
            </Label>
            <Select
              value={String(overrideForm.employeeId)}
              onValueChange={(val) => setOverrideForm({ ...overrideForm, employeeId: val })}
              disabled={Boolean(editingOverride)}
            >
              <SelectTrigger className="h-10 rounded-xl text-xs sm:text-sm bg-white border-slate-200">
                <SelectValue placeholder="Select an employee..." />
              </SelectTrigger>
              <SelectContent>
                {employees.map((emp) => (
                  <SelectItem
                    key={emp.recordId || emp.id}
                    value={String(emp.recordId || emp.id)}
                  >
                    {emp.name} ({emp.id}) — {emp.designation?.name || 'Staff'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-slate-400">
              Select the employee who will receive this custom commission structure.
            </p>
          </div>

          {/* Current Baseline Comparison Card (if employee selected) */}
          {selectedEmployeeData?.baseline && (
            <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/50 p-3.5 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#16A34A]">
                <Info className="size-4 text-[#16A34A] shrink-0" />
                <span>Current Designation Baseline</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Company Role</p>
                  <p className="font-semibold text-slate-800">
                    {selectedEmployeeData.baseline.name}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Default Baseline</p>
                  <p className="font-bold text-slate-900">
                    {selectedEmployeeData.baseline.commissionType === 'FIXED'
                      ? inr(selectedEmployeeData.baseline.commissionRate)
                      : `${selectedEmployeeData.baseline.commissionRate ?? 0}%`}
                  </p>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 pt-1 border-t border-emerald-200/60">
                Setting this override replaces the baseline rate on all future deals and sales credits.
              </p>
            </div>
          )}

          {/* Commission Type Segmented Toggle */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-800">
              Commission Type
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setOverrideForm({ ...overrideForm, commissionType: 'PERCENTAGE' })}
                className={`flex items-center justify-center gap-2 rounded-xl p-2.5 text-xs font-bold border transition-all cursor-pointer ${
                  overrideForm.commissionType === 'PERCENTAGE'
                    ? 'border-[#16A34A] bg-emerald-50/60 text-[#16A34A] shadow-2xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Percent className="size-4" />
                <span>Percentage (%)</span>
              </button>
              <button
                type="button"
                onClick={() => setOverrideForm({ ...overrideForm, commissionType: 'FIXED' })}
                className={`flex items-center justify-center gap-2 rounded-xl p-2.5 text-xs font-bold border transition-all cursor-pointer ${
                  overrideForm.commissionType === 'FIXED'
                    ? 'border-[#16A34A] bg-emerald-50/60 text-[#16A34A] shadow-2xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Coins className="size-4" />
                <span>Fixed Amount (₹)</span>
              </button>
            </div>
          </div>

          {/* Rate / Value Input with Presets */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-800">
              Rate / Value <span className="text-rose-500">*</span>
            </Label>
            <div className="relative">
              <Input
                required
                type="number"
                min="0"
                step="0.01"
                placeholder={overrideForm.commissionType === 'FIXED' ? '1000' : '5.0'}
                value={overrideForm.commissionValue}
                onChange={(e) =>
                  setOverrideForm({ ...overrideForm, commissionValue: e.target.value })
                }
                className="h-10 rounded-xl text-sm pr-9 font-bold text-[#16A34A] border-slate-200"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                {overrideForm.commissionType === 'FIXED' ? '₹' : '%'}
              </span>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">
                Presets:
              </span>
              {(overrideForm.commissionType === 'FIXED'
                ? ['500', '1000', '2500', '5000']
                : ['2.5', '5.0', '7.5', '10.0', '15.0']
              ).map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setOverrideForm({ ...overrideForm, commissionValue: preset })}
                  className="rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600"
                >
                  {overrideForm.commissionType === 'FIXED' ? `₹${preset}` : `${preset}%`}
                </button>
              ))}
            </div>
          </div>

          {/* Live Payout Example Simulation Card */}
          <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-3.5 space-y-2 text-xs shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-slate-800 font-bold">
                <Sparkles className="size-3.5 text-amber-500" />
                <span>Live Commission Simulator</span>
              </div>
              <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.2 rounded-full">
                Interactive Preview
              </span>
            </div>

            {/* Test Deal Size Chips */}
            <div className="flex items-center gap-1.5 pt-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Test Deal:</span>
              {[10000, 25000, 50000, 100000, 250000].map((deal) => (
                <button
                  key={deal}
                  type="button"
                  onClick={() => setSimulatedDealSize(deal)}
                  className={`rounded-lg border px-2 py-0.5 text-[10px] font-semibold transition-colors ${
                    simulatedDealSize === deal
                      ? 'border-[#16A34A] bg-emerald-50 text-[#16A34A]'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  ₹{deal >= 100000 ? `${deal / 100000}L` : `${deal / 1000}k`}
                </button>
              ))}
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-semibold block uppercase">Deal Amount</span>
                <span className="font-bold text-slate-800 text-xs">{inr(simulatedExample.sampleDeal)}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-semibold block uppercase">Employee Commission</span>
                <span className="font-black text-sm text-[#16A34A]">{inr(simulatedExample.earned)}</span>
              </div>
            </div>
          </div>

          {/* Status Selection */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-800">Status</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setOverrideForm({ ...overrideForm, status: 'ACTIVE' })}
                className={`flex items-center justify-center gap-2 rounded-xl p-2.5 text-xs font-bold border transition-all cursor-pointer ${
                  overrideForm.status === 'ACTIVE'
                    ? 'border-[#16A34A] bg-emerald-50/60 text-[#16A34A]'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Check className="size-3.5" />
                <span>Active (Enforced)</span>
              </button>
              <button
                type="button"
                onClick={() => setOverrideForm({ ...overrideForm, status: 'INACTIVE' })}
                className={`flex items-center justify-center gap-2 rounded-xl p-2.5 text-xs font-bold border transition-all cursor-pointer ${
                  overrideForm.status === 'INACTIVE'
                    ? 'border-slate-400 bg-slate-100 text-slate-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <X className="size-3.5" />
                <span>Inactive (Paused)</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              When Inactive, the employee automatically falls back to their designation baseline rate.
            </p>
          </div>
        </div>
      </FormDrawer>
    </div>
  );
}
