'use client';

import * as React from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SlideOverDrawer } from '@/components/common/Drawer';
import { toast } from '@/hooks/use-toast';
import {
  Users,
  CheckCircle2,
  Clock,
  Database,
  HardDrive,
  Search,
  RotateCw,
  Download,
  Eye,
  Layers,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  UserCheck,
  FileText,
  Sparkles,
  ShieldAlert,
  Building2,
  Mail,
  Phone,
  Activity,
  Check,
  X,
  AlertTriangle,
} from 'lucide-react';
import { loadResourceUsage, billingError } from '@/modules/customer/billing-api';

const STATUS_TABS = [
  { key: 'ALL', label: 'All Customers' },
  { key: 'ACTIVE', label: 'Active' },
  { key: 'UPCOMING', label: 'Upcoming' },
  { key: 'COMPLETED', label: 'Completed' },
];

const getStatusBadge = (status) => {
  const s = String(status || '').toUpperCase();
  switch (s) {
    case 'ACTIVE':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 border border-emerald-200">
          <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Active
        </span>
      );
    case 'UPCOMING':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800 border border-amber-200">
          <span className="size-1.5 rounded-full bg-amber-500" />
          Upcoming
        </span>
      );
    case 'COMPLETED':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700 border border-slate-200">
          <span className="size-1.5 rounded-full bg-slate-400" />
          Completed
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-0.5 text-xs font-semibold text-slate-600 border border-slate-200">
          {status || 'Unknown'}
        </span>
      );
  }
};

const getProgressBarColor = (pct) => {
  const p = Number(pct) || 0;
  if (p >= 100) return 'bg-rose-500';
  if (p >= 80) return 'bg-amber-500';
  return 'bg-[#107569]';
};

export function ResourceUsageScreen() {
  const [loading, setLoading] = React.useState(true);
  const [customers, setCustomers] = React.useState([]);
  const [summary, setSummary] = React.useState({
    totalCustomers: 0,
    activeCustomers: 0,
    overallSeatUtilization: '0.0%',
    totalStorage: '0 MB',
    totalAllocatedSeats: 0,
    totalMaxSeats: 0,
    totalLeads: 0,
  });

  const [activeTab, setActiveTab] = React.useState('ALL');
  const [search, setSearch] = React.useState('');
  const [quotaFilter, setQuotaFilter] = React.useState('ALL');
  const [sortBy, setSortBy] = React.useState('name');
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(10);
  const [totalCount, setTotalCount] = React.useState(0);

  // Drawer
  const [detailDrawerOpen, setDetailDrawerOpen] = React.useState(false);
  const [selectedCust, setSelectedCust] = React.useState(null);

  const fetchUsage = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await loadResourceUsage({
        page,
        limit,
        status: activeTab === 'ALL' ? undefined : activeTab,
        search: search.trim() || undefined,
      });

      let items = res.rows || [];

      // Filter by quota condition if requested
      if (quotaFilter === 'REACHED') {
        items = items.filter(
          (c) =>
            (c.seatUtilization != null && c.seatUtilization >= 100) ||
            (c.leadUtilization != null && c.leadUtilization >= 100)
        );
      } else if (quotaFilter === 'NEAR') {
        items = items.filter(
          (c) =>
            (c.seatUtilization != null && c.seatUtilization >= 80 && c.seatUtilization < 100) ||
            (c.leadUtilization != null && c.leadUtilization >= 80 && c.leadUtilization < 100)
        );
      } else if (quotaFilter === 'HEALTHY') {
        items = items.filter(
          (c) =>
            (c.seatUtilization == null || c.seatUtilization < 80) &&
            (c.leadUtilization == null || c.leadUtilization < 80)
        );
      }

      // Sort items
      if (sortBy === 'name') {
        items.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      } else if (sortBy === 'seats_high') {
        items.sort((a, b) => (Number(b.seatUtilization) || 0) - (Number(a.seatUtilization) || 0));
      } else if (sortBy === 'storage_high') {
        items.sort((a, b) => (Number(b.storageBytes) || 0) - (Number(a.storageBytes) || 0));
      } else if (sortBy === 'newest') {
        items.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      }

      setCustomers(items);
      setTotalCount(res.pagination?.total || items.length);

      if (res.summary) {
        setSummary({
          totalCustomers: res.summary.totalCustomers ?? items.length,
          activeCustomers: res.summary.activeCustomers ?? 0,
          overallSeatUtilization: res.summary.overallSeatUtilization ?? '0.0%',
          totalStorage: res.summary.totalStorage ?? '0 MB',
          totalAllocatedSeats: res.summary.totalAllocatedSeats ?? 0,
          totalMaxSeats: res.summary.totalMaxSeats ?? 0,
          totalLeads: res.summary.totalLeads ?? 0,
        });
      }
    } catch (err) {
      toast.error(billingError(err) || 'Failed to load resource usage analytics');
    } finally {
      setLoading(false);
    }
  }, [page, limit, activeTab, search, quotaFilter, sortBy]);

  React.useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  // Export CSV
  const exportCsv = () => {
    if (!customers.length) {
      toast.info('No resource usage records to export');
      return;
    }
    const headers = [
      'Customer ID',
      'Customer Name',
      'Company Name',
      'Plan Name',
      'Employees Used',
      'Max Employees',
      'Seat Utilization %',
      'Leads Captured',
      'Max Leads',
      'Storage Used',
      'Max Storage',
      'Account Status',
    ];
    const csvRows = [
      headers.join(','),
      ...customers.map((c) =>
        [
          `"${c.customerId || c.id}"`,
          `"${(c.name || '').replace(/"/g, '""')}"`,
          `"${(c.companyName || '').replace(/"/g, '""')}"`,
          `"${(c.planName || '').replace(/"/g, '""')}"`,
          `"${c.users ?? 0}"`,
          `"${c.maxUsers ?? ''}"`,
          `"${c.seatUtilization != null ? c.seatUtilization + '%' : ''}"`,
          `"${c.leads ?? 0}"`,
          `"${c.maxLeads ?? ''}"`,
          `"${c.storage || ''}"`,
          `"${c.maxStorage || ''}"`,
          `"${c.customerStatus || c.status || ''}"`,
        ].join(',')
      ),
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `crm_resource_usage_${activeTab.toLowerCase()}_export.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Resource usage records exported successfully');
  };

  const totalPages = Math.ceil(totalCount / limit) || 1;

  return (
    <div className="w-full min-w-0 max-w-none space-y-6 pb-28">
      {/* ── 1. Page Header ────────────────────────────────────────── */}
      <PageHeader
        title="Resource Usage"
        description="Employee seats, lead volume, and cloud storage allocation monitoring against customer plan limits."
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={exportCsv}
              disabled={loading || !customers.length}
              className="h-10 rounded-xl border-[#E2E8E5] text-[#163A2E] hover:bg-slate-50 transition"
            >
              <Download className="mr-1.5 size-4 text-[#107569]" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchUsage}
              disabled={loading}
              className="h-10 rounded-xl border-[#E2E8E5] text-[#163A2E] hover:bg-slate-50 transition"
            >
              <RotateCw className={`size-4 text-[#107569] mr-1.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        }
      />

      {/* ── 2. Top Segmented Status Switcher ──────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-2.5 rounded-2xl border border-[#E2E8E5] shadow-xs">
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto">
          {STATUS_TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            let countBadge = null;
            if (tab.key === 'ALL') countBadge = summary.totalCustomers;
            else if (tab.key === 'ACTIVE') countBadge = summary.activeCustomers;

            return (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key);
                  setPage(1);
                }}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-[#107569] text-white shadow-xs'
                    : 'text-slate-600 hover:text-[#163A2E] hover:bg-slate-50'
                }`}
              >
                <span>{tab.label}</span>
                {countBadge !== null && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {countBadge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 3. Four Modern KPI Stat Cards ─────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Customers */}
        <div className="group relative overflow-hidden rounded-2xl border border-[#E2E8E5] bg-white p-5 shadow-xs transition hover:border-[#107569]/40 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
              Monitored Customers
            </span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-[#107569] border border-emerald-100">
              <Users className="size-4.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-[#163A2E]">
              {summary.totalCustomers}
            </span>
            <span className="text-xs text-slate-500 font-medium">Tenant accounts</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-500">
            <span className="inline-block size-1.5 rounded-full bg-[#107569]" />
            Active platform registry
          </div>
        </div>

        {/* Active Subscriptions */}
        <div className="group relative overflow-hidden rounded-2xl border border-[#E2E8E5] bg-white p-5 shadow-xs transition hover:border-emerald-500/40 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
              Active Licenses
            </span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="size-4.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-emerald-800">
              {summary.activeCustomers}
            </span>
            <span className="text-xs text-emerald-700 font-medium">Fully licensed</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-emerald-700">
            <span className="inline-block size-1.5 rounded-full bg-emerald-500" />
            Within current subscription period
          </div>
        </div>

        {/* Overall Seat Utilization */}
        <div className="group relative overflow-hidden rounded-2xl border border-[#E2E8E5] bg-white p-5 shadow-xs transition hover:border-emerald-500/40 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
              Overall Seat Use
            </span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              <UserCheck className="size-4.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-emerald-800">
              {summary.overallSeatUtilization}
            </span>
            <span className="text-xs text-emerald-700 font-medium">
              {summary.totalAllocatedSeats} / {summary.totalMaxSeats} seats
            </span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-emerald-700">
            <span className="inline-block size-1.5 rounded-full bg-emerald-500" />
            Employee seat allocation
          </div>
        </div>

        {/* Storage Allocated */}
        <div className="group relative overflow-hidden rounded-2xl border border-[#E2E8E5] bg-white p-5 shadow-xs transition hover:border-[#107569]/40 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
              Cloud Storage
            </span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-[#107569] border border-emerald-100">
              <HardDrive className="size-4.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-[#163A2E]">
              {summary.totalStorage}
            </span>
            <span className="text-xs text-slate-500 font-medium">Assets & documents</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-500">
            <span className="inline-block size-1.5 rounded-full bg-[#107569]" />
            Aggregate tenant storage
          </div>
        </div>
      </div>

      {/* ── 4. Unified Search, Filter & Sorting Bar ────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-[#E2E8E5] shadow-xs">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by customer name, company, domain, plan..."
            className="h-10 pl-10 rounded-xl border-[#E2E8E5] text-sm focus:border-[#107569] focus:ring-[#107569]"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Right Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Quota Threshold Filter */}
          <div className="flex items-center gap-2 bg-[#F4F9F6] border border-[#E2E8E5] px-3 py-1.5 rounded-xl">
            <ShieldAlert className="size-3.5 text-[#107569]" />
            <span className="text-xs font-semibold text-[#163A2E]">Quota:</span>
            <select
              value={quotaFilter}
              onChange={(e) => {
                setQuotaFilter(e.target.value);
                setPage(1);
              }}
              className="bg-transparent text-xs font-semibold text-[#163A2E] focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">All Customers</option>
              <option value="REACHED">Limit Reached (≥100%)</option>
              <option value="NEAR">Near Limit (≥80%)</option>
              <option value="HEALTHY">Healthy (&lt;80%)</option>
            </select>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 bg-[#F4F9F6] border border-[#E2E8E5] px-3 py-1.5 rounded-xl">
            <ArrowUpDown className="size-3.5 text-[#107569]" />
            <span className="text-xs font-semibold text-[#163A2E]">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-xs font-semibold text-[#163A2E] focus:outline-hidden cursor-pointer"
            >
              <option value="name">Name (A–Z)</option>
              <option value="seats_high">Highest Seat Usage</option>
              <option value="storage_high">Highest Storage</option>
              <option value="newest">Newest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── 5. Modern Resource Usage Table ─────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-[#E2E8E5] bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F4F9F6] border-b border-[#E2E8E5] text-[#163A2E]">
                <th className="py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider">
                  Customer
                </th>
                <th className="py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider">
                  Plan Tier
                </th>
                <th className="py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider">
                  Employee Seats
                </th>
                <th className="py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider">
                  Leads Captured
                </th>
                <th className="py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider">
                  Cloud Storage
                </th>
                <th className="py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider text-center">
                  Seat %
                </th>
                <th className="py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider text-center">
                  Status
                </th>
                <th className="py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8E5]/70 text-xs text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RotateCw className="size-6 text-[#107569] animate-spin" />
                      <span className="text-sm font-semibold text-slate-600">
                        Loading resource analytics...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto text-center gap-2">
                      <div className="flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                        <Activity className="size-6" />
                      </div>
                      <h4 className="text-base font-bold text-[#163A2E]">
                        No Resource Data Found
                      </h4>
                      <p className="text-xs text-slate-500">
                        {search
                          ? `No customers matched "${search}". Try adjusting search filters.`
                          : 'No resource consumption metrics are currently registered.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                customers.map((row) => {
                  const custName = row.name || row.companyName || `Customer #${row.id}`;
                  const initial = custName.trim()[0]?.toUpperCase() || 'C';
                  const seatPct = row.seatUtilization;
                  const leadPct = row.leadUtilization;

                  return (
                    <tr
                      key={row.id}
                      className="transition-colors hover:bg-slate-50/70"
                    >
                      {/* Customer */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-200 text-[#107569] font-bold text-xs shrink-0">
                            {initial}
                          </div>
                          <div className="min-w-0">
                            <button
                              onClick={() => {
                                setSelectedCust(row);
                                setDetailDrawerOpen(true);
                              }}
                              className="font-bold text-[#163A2E] hover:text-[#107569] hover:underline text-left block truncate max-w-[170px]"
                            >
                              {custName}
                            </button>
                            {row.contactPerson && row.contactPerson !== custName && (
                              <p className="text-[11px] text-slate-500 truncate max-w-[170px]">
                                {row.contactPerson}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Plan Tier */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50/80 border border-emerald-200 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                          <Layers className="size-3 text-[#107569]" />
                          {row.planName || 'Standard Package'}
                        </span>
                      </td>

                      {/* Employees (With mini meter) */}
                      <td className="py-3.5 px-4 min-w-[130px]">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] font-semibold text-slate-700">
                            <span>{row.users ?? 0}</span>
                            <span className="text-slate-400">/ {row.maxUsers ?? '∞'}</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${getProgressBarColor(seatPct)}`}
                              style={{ width: `${Math.min(100, Math.max(5, seatPct || 0))}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Leads (With mini meter) */}
                      <td className="py-3.5 px-4 min-w-[130px]">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] font-semibold text-slate-700">
                            <span>{row.leads ?? 0}</span>
                            <span className="text-slate-400">/ {row.maxLeads ?? '∞'}</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${getProgressBarColor(leadPct)}`}
                              style={{ width: `${Math.min(100, Math.max(5, leadPct || 0))}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Storage */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                          <HardDrive className="size-3 text-slate-400" />
                          <span>{row.storage || '0 MB'}</span>
                          <span className="text-slate-400 font-normal">/ {row.maxStorage || '∞'}</span>
                        </div>
                      </td>

                      {/* Seat Utilization % */}
                      <td className="py-3.5 px-4 text-center">
                        {seatPct != null ? (
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-md text-[11px] font-mono font-bold ${
                              seatPct >= 100
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : seatPct >= 80
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-[#F4F9F6] text-[#107569] border border-[#E2E8E5]'
                            }`}
                          >
                            {seatPct}%
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {getStatusBadge(row.customerStatus || row.status)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          title="View Quota Breakdown"
                          onClick={() => {
                            setSelectedCust(row);
                            setDetailDrawerOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-[#107569] hover:bg-emerald-50 transition"
                        >
                          <Eye className="size-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── 6. Pagination Footer (Single Unified Clean Footer) ────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3.5 border-t border-[#E2E8E5] bg-white">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Rows per page:</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="rounded-lg border border-[#E2E8E5] bg-white px-2 py-1 text-xs font-semibold text-[#163A2E] focus:outline-hidden"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <span className="ml-2 font-medium">
              Showing {customers.length > 0 ? (page - 1) * limit + 1 : 0}–
              {Math.min(page * limit, totalCount)} of {totalCount} customers
            </span>
          </div>

          <div className="flex items-center gap-1.5 self-center sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              className="h-8 rounded-lg border-[#E2E8E5] px-2.5 text-xs text-slate-600 hover:bg-slate-50"
            >
              <ChevronLeft className="size-3.5 mr-1" />
              Prev
            </Button>
            <span className="px-2.5 py-1 text-xs font-bold text-[#107569] bg-emerald-50 rounded-lg border border-emerald-200">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              className="h-8 rounded-lg border-[#E2E8E5] px-2.5 text-xs text-slate-600 hover:bg-slate-50"
            >
              Next
              <ChevronRight className="size-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </div>

      {/* ── 7. SlideOver Drawer: View Resource Quota Diagnostics ───── */}
      <SlideOverDrawer
        open={detailDrawerOpen}
        onOpenChange={setDetailDrawerOpen}
        title={selectedCust?.name || 'Resource Quota Diagnostics'}
        description="Comprehensive employee seat, lead volume, and storage metrics."
      >
        {selectedCust && (
          <div className="space-y-5 p-1 text-xs">
            {/* Header Card */}
            <div className="p-4 rounded-2xl bg-[#F4F9F6] border border-[#E2E8E5] space-y-3">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-sm font-bold text-[#163A2E]">
                  <Building2 className="size-4 text-[#107569]" />
                  {selectedCust.name || selectedCust.companyName}
                </span>
                {getStatusBadge(selectedCust.customerStatus || selectedCust.status)}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold text-xs">
                  <Layers className="size-3 inline mr-1 text-[#107569]" />
                  Plan: {selectedCust.planName}
                </span>
              </div>
            </div>

            {/* Quota Diagnostics Cards */}
            <div className="p-4 rounded-2xl border border-[#E2E8E5] bg-white space-y-4">
              <h5 className="font-bold text-[#163A2E] flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                <Activity className="size-3.5 text-[#107569]" />
                Resource Utilization Gauges
              </h5>

              {/* Employee Seats Gauge */}
              <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-[#163A2E] flex items-center gap-1.5">
                    <Users className="size-3.5 text-[#107569]" /> Employee Seats
                  </span>
                  <span className="font-bold text-[#107569]">
                    {selectedCust.users ?? 0} / {selectedCust.maxUsers ?? '∞'} ({selectedCust.seatUtilization ?? 0}%)
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${getProgressBarColor(selectedCust.seatUtilization)}`}
                    style={{ width: `${Math.min(100, Math.max(5, selectedCust.seatUtilization || 0))}%` }}
                  />
                </div>
                {selectedCust.seatUtilization >= 100 ? (
                  <p className="text-[11px] font-semibold text-rose-600">Seat limit reached. Additional user creation blocked.</p>
                ) : selectedCust.seatUtilization >= 80 ? (
                  <p className="text-[11px] font-semibold text-amber-700">Seat quota near limit (&ge;80%).</p>
                ) : (
                  <p className="text-[11px] text-slate-500">Seat utilization within licensed parameters.</p>
                )}
              </div>

              {/* Leads Gauge */}
              <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-[#163A2E] flex items-center gap-1.5">
                    <Database className="size-3.5 text-[#107569]" /> Lead Capacity
                  </span>
                  <span className="font-bold text-[#107569]">
                    {selectedCust.leads ?? 0} / {selectedCust.maxLeads ?? '∞'} ({selectedCust.leadUtilization ?? 0}%)
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${getProgressBarColor(selectedCust.leadUtilization)}`}
                    style={{ width: `${Math.min(100, Math.max(5, selectedCust.leadUtilization || 0))}%` }}
                  />
                </div>
              </div>

              {/* Storage Gauge */}
              <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-[#163A2E] flex items-center gap-1.5">
                    <HardDrive className="size-3.5 text-[#107569]" /> Cloud Storage
                  </span>
                  <span className="font-bold text-[#107569]">
                    {selectedCust.storage || '0 MB'} / {selectedCust.maxStorage || '∞'}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                  <div className="h-full rounded-full bg-[#107569]" style={{ width: '15%' }} />
                </div>
              </div>
            </div>

            {/* Account Metadata */}
            <div className="p-4 rounded-2xl border border-[#E2E8E5] bg-white space-y-2.5">
              <h5 className="font-bold text-[#163A2E] uppercase text-[11px] tracking-wider">
                Account Details
              </h5>
              <div className="space-y-1.5 text-slate-600">
                {selectedCust.email && (
                  <p className="flex items-center gap-2">
                    <Mail className="size-3.5 text-slate-400" />
                    <span>{selectedCust.email}</span>
                  </p>
                )}
                {selectedCust.phone && (
                  <p className="flex items-center gap-2">
                    <Phone className="size-3.5 text-slate-400" />
                    <span>{selectedCust.phone}</span>
                  </p>
                )}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#E2E8E5] text-[11px]">
                  <div>
                    <span className="text-slate-400 block">PRODUCTION TASKS</span>
                    <span className="font-bold text-[#163A2E]">{selectedCust.worksCount ?? 0}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">DATA CAPTURE PLACES</span>
                    <span className="font-bold text-[#163A2E]">{selectedCust.dataCapturePlacesCount ?? 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </SlideOverDrawer>
    </div>
  );
}
