'use client';

import * as React from 'react';
import Link from 'next/link';
import { PageTitleCard } from '@/components/common/PageTitleCard';
import {
  Users,
  UsersRound,
  UserCheck,
  UserX,
  UserPlus,
  CreditCard,
  Clock,
  FileText,
  IndianRupee,
  AlertTriangle,
  CheckCircle2,
  RotateCw,
  Search,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  Calendar,
  X,
  Check,
  Eye,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { StatusBadge } from '@/components/common/StatusBadge';
import { billingError, loadBillingOverview } from '@/modules/customer/billing-api';
import { GlobalDashboardFilters, resolvePresetRange } from '@/components/dashboard/GlobalDashboardFilters';
import { cn } from '@/lib/utils';
import { CustomerGrowthCard } from './components/CustomerGrowthCard';
import { CustomerStatusCard } from './components/CustomerStatusCard';

// Currency formatter
const inr = (value) => {
  if (value == null) return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
};

// Date formatter
function formatDisplayDate(value) {
  if (!value) return '—';
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return String(value).slice(0, 10);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return String(value).slice(0, 10);
  }
}

// Extract Initials
function getInitials(name) {
  if (!name || typeof name !== 'string') return 'CU';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'CU';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Deterministic gradient avatar background
function getAvatarGradient(name) {
  const gradients = [
    'from-emerald-500 to-teal-600',
    'from-blue-500 to-indigo-600',
    'from-violet-500 to-purple-600',
    'from-amber-500 to-orange-600',
    'from-sky-500 to-blue-600',
    'from-rose-500 to-pink-600',
  ];
  if (!name || typeof name !== 'string') return gradients[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return gradients[Math.abs(hash) % gradients.length];
}

// Hook: Animated Count-up with prefers-reduced-motion support
function useCountUp(target, duration = 800) {
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setCount(Number(target) || 0);
      return;
    }

    const numTarget = Number(target) || 0;
    if (numTarget === 0) {
      setCount(0);
      return;
    }

    let start = 0;
    const startTime = performance.now();
    let animId;

    const step = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(easedProgress * numTarget);
      setCount(current);

      if (progress < 1) {
        animId = requestAnimationFrame(step);
      } else {
        setCount(numTarget);
      }
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [target, duration]);

  return count;
}

// Animated Decorative Header Artwork
function CustomerHeaderIllustration() {
  return (
    <div
      className="pointer-events-none absolute right-4 -top-3 h-full max-w-[45%] select-none hidden lg:flex items-center justify-end pr-4 overflow-hidden"
      aria-hidden="true"
    >
      <div className="relative flex items-center justify-center w-72 h-36">
        {/* Ambient Gradient Blobs */}
        <div className="absolute -top-4 -right-4 size-32 rounded-full bg-emerald-200/40 blur-2xl animate-pulse duration-1000" />
        <div className="absolute bottom-0 right-16 size-24 rounded-full bg-teal-200/30 blur-xl animate-pulse delay-300" />

        {/* Decorative Floating Card 1: Active Subscribers */}
        <div className="absolute top-2 right-12 z-20 flex items-center gap-2.5 rounded-xl border border-emerald-200/90 bg-white/95 px-3 py-1.5 shadow-md backdrop-blur-xs transition-transform duration-700 hover:scale-105 animate-in fade-in slide-in-from-right-4">
          <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500 text-white font-bold text-[10px] shadow-2xs">
            <Users className="size-3.5" />
          </div>
          <div>
            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              Subscribers
            </div>
            <div className="text-xs font-bold text-slate-900 flex items-center gap-1">
              <span>Active</span>
              <span className="flex size-1.5 rounded-full bg-emerald-500 animate-ping" />
            </div>
          </div>
        </div>

        {/* Decorative Floating Card 2: Revenue Pill */}
        <div className="absolute bottom-3 right-4 z-20 flex items-center gap-2 rounded-xl border border-teal-200/80 bg-white/95 px-3 py-1.5 shadow-md backdrop-blur-xs transition-transform duration-700 hover:scale-105 animate-in fade-in slide-in-from-right-8 delay-150">
          <div className="flex size-6 items-center justify-center rounded-full bg-teal-50 text-teal-700 border border-teal-200">
            <TrendingUp className="size-3" />
          </div>
          <span className="text-xs font-bold text-teal-950">Invoices & Billing</span>
        </div>

        {/* Decorative Circular Dashes */}
        <svg
          viewBox="0 0 200 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="absolute -right-4 top-2 w-52 h-28 text-emerald-600/15"
        >
          <path
            d="M20 100C60 40 120 20 190 20"
            stroke="currentColor"
            strokeWidth="3"
            strokeDasharray="4 4"
          />
          <circle cx="160" cy="50" r="32" stroke="currentColor" strokeWidth="2" strokeDasharray="6 6" />
        </svg>
      </div>
    </div>
  );
}

// KPI Card Component with Animated Count-up
function DashboardKpiCard({ title, value, isCurrency = false, icon: Icon, tone, description, delay = 0 }) {
  const animatedValue = useCountUp(value, 800);

  const formattedDisplay = isCurrency
    ? inr(animatedValue)
    : animatedValue.toLocaleString('en-IN');

  return (
    <div
      className={cn(
        'group relative rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs transition-all duration-300',
        'hover:-translate-y-1 hover:shadow-md hover:border-slate-300',
        'min-w-0 min-h-[126px] flex flex-col justify-between overflow-hidden',
        'animate-in fade-in slide-in-from-bottom-2 duration-500'
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 truncate">
            {title}
          </p>
          <span className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 block truncate transition-transform duration-200 group-hover:scale-[1.02] origin-left">
            {formattedDisplay}
          </span>
          {description && (
            <p className="text-xs text-slate-500 truncate">{description}</p>
          )}
        </div>

        <div
          className={cn(
            'flex size-10 sm:size-11 items-center justify-center rounded-xl border shrink-0 transition-transform duration-300 group-hover:scale-110 shadow-2xs',
            tone
          )}
        >
          <Icon className="size-5" />
        </div>
      </div>
    </div>
  );
}

// Invoice Summary Card
function InvoiceSummaryCard({ title, count, status, icon: Icon, tone, subtext }) {
  const animatedCount = useCountUp(count, 800);

  return (
    <div
      className={cn(
        'group relative rounded-2xl border p-4 sm:p-4.5 shadow-xs transition-all duration-300',
        'hover:-translate-y-0.5 hover:shadow-md',
        'flex items-center justify-between gap-3 min-w-0',
        tone.border,
        tone.bg
      )}
    >
      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
            {title}
          </span>
          <span className={cn('px-1.5 py-0.2 rounded text-[10px] font-bold border', tone.badge)}>
            {status}
          </span>
        </div>
        <div className="text-2xl font-bold tracking-tight text-slate-900">
          {animatedCount.toLocaleString('en-IN')}
        </div>
        {subtext && <p className="text-xs text-slate-500">{subtext}</p>}
      </div>

      <div
        className={cn(
          'flex size-11 items-center justify-center rounded-xl border shrink-0 shadow-2xs transition-transform duration-200 group-hover:scale-105',
          tone.iconBg,
          tone.iconColor
        )}
      >
        <Icon className="size-5" />
      </div>
    </div>
  );
}

// Customer Plan Badge Component
function CustomerPlanBadge({ row }) {
  const planName = row.planName || row.plan || row.currentSubscription?.plan?.name;
  const status = String(row.subscriptionStatus || row.currentSubscription?.status || '').toUpperCase();
  const startDate = row.subscriptionStartDate || row.startDate || row.currentSubscription?.startDate;
  const endDate = row.subscriptionEndDate || row.endDate || row.currentSubscription?.endDate;
  const hasInconsistency = Boolean(row.isMultipleActiveDetected);

  const isNotPurchased = !planName || planName === 'Not Purchased' || status === 'NOT_PURCHASED';

  if (isNotPurchased) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-medium text-slate-500">
        <span className="size-1.5 rounded-full bg-slate-400" />
        Not Purchased
      </span>
    );
  }

  const isExpired = status === 'EXPIRED';
  const isCancelled = status === 'CANCELLED';
  const isActive = status === 'ACTIVE';

  let badgeClasses = 'bg-slate-50 text-slate-700 border-slate-200';
  let dotColor = 'bg-slate-400';
  let statusSuffix = '';

  if (isActive) {
    badgeClasses = 'bg-emerald-50 text-emerald-800 border-emerald-200';
    dotColor = 'bg-emerald-500';
  } else if (isExpired) {
    badgeClasses = 'bg-amber-50 text-amber-800 border-amber-200';
    dotColor = 'bg-amber-500';
    statusSuffix = ' (Expired)';
  } else if (isCancelled) {
    badgeClasses = 'bg-rose-50 text-rose-800 border-rose-200';
    dotColor = 'bg-rose-500';
    statusSuffix = ' (Cancelled)';
  } else if (status) {
    badgeClasses = 'bg-sky-50 text-sky-800 border-sky-200';
    dotColor = 'bg-sky-500';
    statusSuffix = ` (${status.toLowerCase()})`;
  }

  const dateTooltip = [
    startDate ? `Started: ${formatDisplayDate(startDate)}` : null,
    endDate ? `Ends: ${formatDisplayDate(endDate)}` : null,
  ].filter(Boolean).join(' • ');

  return (
    <div className="inline-flex flex-col gap-0.5">
      <div className="flex items-center gap-1.5">
        <span
          title={dateTooltip || planName}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold max-w-[180px] truncate',
            badgeClasses
          )}
        >
          <span className={cn('size-1.5 rounded-full shrink-0', dotColor)} />
          <span className="truncate">{planName}{statusSuffix}</span>
        </span>
        {hasInconsistency && (
          <span
            title="Warning: Multiple active subscriptions detected in database for this customer"
            className="text-amber-500 hover:text-amber-600 inline-flex items-center"
          >
            <AlertTriangle className="size-3.5" />
          </span>
        )}
      </div>
      {endDate && (
        <span className="text-[10px] text-slate-400 pl-1">
          {isActive ? `Exp: ${formatDisplayDate(endDate)}` : isExpired ? `Expired ${formatDisplayDate(endDate)}` : ''}
        </span>
      )}
    </div>
  );
}

// Column Visibility Dropdown Component
function ColumnVisibilityToggle({ columns, visibility, onToggle }) {
  const [open, setOpen] = React.useState(false);
  const dropdownRef = React.useRef(null);

  React.useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div className="relative shrink-0" ref={dropdownRef}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen((prev) => !prev)}
        className="h-9 rounded-xl border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
      >
        <SlidersHorizontal className="mr-1.5 size-3.5 text-slate-500" />
        <span>Columns</span>
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-30 w-44 rounded-xl border border-slate-200 bg-white p-2 shadow-lg animate-in fade-in zoom-in-95 duration-150">
          <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Toggle Columns
          </div>
          <div className="space-y-1">
            {columns.map((col) => (
              <label
                key={col.key}
                className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-slate-50 cursor-pointer text-xs text-slate-700 select-none"
              >
                <input
                  type="checkbox"
                  checked={visibility[col.key] !== false}
                  onChange={() => onToggle(col.key)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 size-3.5"
                />
                <span className="font-medium">{col.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CustomerDashboardPage() {
  const [data, setData] = React.useState(null);
  const [filters, setFilters] = React.useState({ dateFrom: '', dateTo: '', status: '' });
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState('');
  const [refresh, setRefresh] = React.useState(0);

  // Recent Customers Section State
  const [customerSearch, setCustomerSearch] = React.useState('');
  const [customerStatusFilter, setCustomerStatusFilter] = React.useState('');
  const [customerPage, setCustomerPage] = React.useState(1);
  const [customerPageSize, setCustomerPageSize] = React.useState(5);
  const [customerColVisibility, setCustomerColVisibility] = React.useState({
    name: true,
    email: true,
    plan: true,
    status: true,
    created: true,
  });

  // Recent Invoices Section State
  const [invoiceSearch, setInvoiceSearch] = React.useState('');
  const [invoiceStatusFilter, setInvoiceStatusFilter] = React.useState('');
  const [invoiceColVisibility, setInvoiceColVisibility] = React.useState({
    invoiceNo: true,
    customer: true,
    total: true,
    status: true,
  });
  const [invoicePage, setInvoicePage] = React.useState(1);
  const [invoicePageSize, setInvoicePageSize] = React.useState(5);

  // Fetch Dashboard Data
  React.useEffect(() => {
    let active = true;
    if (refresh > 0) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    loadBillingOverview({
      dateFrom: filters.dateFrom || undefined,
      dateTo: filters.dateTo || undefined,
      status: filters.status || undefined,
    })
      .then((result) => {
        if (active) {
          setData(result);
          setError('');
        }
      })
      .catch((err) => {
        if (active) setError(billingError(err));
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
  }, [filters.dateFrom, filters.dateTo, filters.status, refresh]);

  // Derived metrics
  const customers = data?.customers || {};
  const invoices = data?.invoices || {};
  const subscriptions = data?.subscriptions || {};
  const revenueTotal = data?.revenue?.totalCollectedAmount ?? data?.revenue?.totalRevenue ?? invoices?.totalCollectedAmount ?? 0;

  // Recent Customers Filtering & Pagination
  const rawCustomers = React.useMemo(() => data?.recentCustomers || [], [data]);
  const filteredCustomers = React.useMemo(() => {
    return rawCustomers.filter((c) => {
      const q = customerSearch.trim().toLowerCase();
      const name = (c.name || c.companyName || '').toLowerCase();
      const email = (c.email || '').toLowerCase();
      const plan = (c.planName || c.plan || c.currentSubscription?.planName || '').toLowerCase();
      const matchesSearch = !q || name.includes(q) || email.includes(q) || plan.includes(q);

      const status = String(c.status || (c.isActive === false ? 'INACTIVE' : 'ACTIVE')).toUpperCase();
      const matchesStatus = !customerStatusFilter || status === customerStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [rawCustomers, customerSearch, customerStatusFilter]);

  const customerTotalPages = Math.ceil(filteredCustomers.length / customerPageSize) || 1;
  const paginatedCustomers = React.useMemo(() => {
    const start = (customerPage - 1) * customerPageSize;
    return filteredCustomers.slice(start, start + customerPageSize);
  }, [filteredCustomers, customerPage, customerPageSize]);

  // Recent Invoices Filtering & Pagination
  const rawInvoices = React.useMemo(() => data?.recentInvoices || [], [data]);
  const filteredInvoices = React.useMemo(() => {
    return rawInvoices.filter((inv) => {
      const q = invoiceSearch.trim().toLowerCase();
      const no = (inv.invoiceNo || inv.invoiceNumber || '').toLowerCase();
      const client = (inv.customerName || inv.clientName || '').toLowerCase();
      const matchesSearch = !q || no.includes(q) || client.includes(q);

      const status = String(inv.status || 'PENDING').toUpperCase();
      const matchesStatus = !invoiceStatusFilter || status === invoiceStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [rawInvoices, invoiceSearch, invoiceStatusFilter]);

  const invoiceTotalPages = Math.ceil(filteredInvoices.length / invoicePageSize) || 1;
  const paginatedInvoices = React.useMemo(() => {
    const start = (invoicePage - 1) * invoicePageSize;
    return filteredInvoices.slice(start, start + invoicePageSize);
  }, [filteredInvoices, invoicePage, invoicePageSize]);

  // Clear top filters
  const handleClearFilters = () => {
    setFilters({ dateFrom: '', dateTo: '', status: '' });
  };

  const hasActiveFilters = Boolean(filters.dateFrom || filters.dateTo || filters.status);

  return (
    <div className="w-full min-w-0 max-w-none space-y-5 sm:space-y-6 pb-24 overflow-x-hidden">
      {/* A. Dashboard Header */}
      <PageTitleCard
        module="CRM"
        title="Dashboard"
        description="Customer, subscription, invoice, and revenue totals from the existing APIs."
        icon={Users}
        illustration={<CustomerHeaderIllustration />}
      />

      <GlobalDashboardFilters
        filters={{
          preset: 'custom',
          fromDate: filters.dateFrom,
          toDate: filters.dateTo,
        }}
        showDepartment={false}
        showEmployee={false}
        showBranch={false}
        onApply={(next) =>
          setFilters((prev) => ({
            ...prev,
            dateFrom: next.fromDate || '',
            dateTo: next.toDate || '',
          }))
        }
        onReset={() => setFilters({ dateFrom: '', dateTo: '', status: '' })}
        onRefresh={() => setRefresh((r) => r + 1)}
        refreshing={refreshing}
        storageKey="qb_customer_dashboard_filters"
      />

      {/* B. Date and Status Filters Panel */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-4.5 shadow-xs transition-all">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 items-center">
          {/* From Date */}
          <div className="min-w-0">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
              From Date
            </label>
            <input
              type="date"
              aria-label="From date"
              value={filters.dateFrom}
              onChange={(e) => setFilters((prev) => ({ ...prev, dateFrom: e.target.value }))}
              className="h-9 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          {/* To Date */}
          <div className="min-w-0">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
              To Date
            </label>
            <input
              type="date"
              aria-label="To date"
              value={filters.dateTo}
              onChange={(e) => setFilters((prev) => ({ ...prev, dateTo: e.target.value }))}
              className="h-9 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          {/* Customer Status */}
          <div className="min-w-0">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Customer Status
            </label>
            <select
              aria-label="Customer status"
              value={filters.status}
              onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
              className="h-9 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            >
              <option value="">All customer statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex items-end gap-2 pt-5 sm:pt-0">
            <Button
              type="button"
              variant="outline"
              disabled={refreshing}
              onClick={() => setRefresh((v) => v + 1)}
              className="h-9 flex-1 rounded-xl border-slate-200/90 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <RotateCw className={cn('mr-1.5 size-3.5', refreshing && 'animate-spin text-[#16A34A]')} />
              <span>Refresh</span>
            </Button>
            {hasActiveFilters && (
              <Button
                type="button"
                variant="ghost"
                onClick={handleClearFilters}
                className="h-9 rounded-xl px-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                title="Clear filters"
              >
                <X className="size-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Error Notice */}
      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/90 p-5 text-center space-y-2">
          <div className="inline-flex size-10 items-center justify-center rounded-xl bg-rose-100 text-rose-600 mb-1">
            <AlertTriangle className="size-5" />
          </div>
          <h3 className="text-sm font-bold text-rose-950">Failed to load customer metrics</h3>
          <p className="text-xs text-rose-700 max-w-md mx-auto">{error}</p>
          <Button
            size="sm"
            onClick={() => setRefresh((v) => v + 1)}
            className="rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white text-xs mt-1"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && !data && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 min-[440px]:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl border border-slate-200 bg-white" />
            ))}
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 sm:gap-6 w-full">
            <div className="h-[420px] animate-pulse rounded-2xl border border-slate-200 bg-white" />
            <div className="h-[420px] animate-pulse rounded-2xl border border-slate-200 bg-white" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 w-full">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl border border-slate-200 bg-white" />
            ))}
          </div>
        </div>
      )}

      {/* Loaded Dashboard Content */}
      {data && (
        <>
          {/* C. 8 Animated KPI Cards */}
          <div className="grid grid-cols-1 min-[440px]:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full">
            {/* 1. Total Customers */}
            <DashboardKpiCard
              title="Total Customers"
              value={customers.totalCustomers ?? 0}
              icon={Users}
              tone="border-emerald-200 bg-emerald-50 text-[#16A34A]"
              description="Platform registered accounts"
              delay={0}
            />

            {/* 2. Active Customers */}
            <DashboardKpiCard
              title="Active Customers"
              value={customers.activeCustomers ?? 0}
              icon={UserCheck}
              tone="border-blue-200 bg-blue-50 text-blue-600"
              description="Active account status"
              delay={50}
            />

            {/* 3. Inactive Customers */}
            <DashboardKpiCard
              title="Inactive Customers"
              value={customers.inactiveCustomers ?? 0}
              icon={UserX}
              tone="border-slate-200 bg-slate-100 text-slate-700"
              description="Dormant or paused accounts"
              delay={100}
            />

            {/* 4. New Customers */}
            <DashboardKpiCard
              title="New Customers"
              value={customers.newCustomers ?? 0}
              icon={UserPlus}
              tone="border-indigo-200 bg-indigo-50 text-indigo-600"
              description="Registered in past 30 days"
              delay={150}
            />

            {/* 5. Active Subscriptions */}
            <DashboardKpiCard
              title="Active Subscriptions"
              value={subscriptions.totalActive ?? subscriptions.active ?? 0}
              icon={CreditCard}
              tone="border-teal-200 bg-teal-50 text-teal-700"
              description="Live recurring plans"
              delay={200}
            />

            {/* 6. Expired Subscriptions */}
            <DashboardKpiCard
              title="Expired Subscriptions"
              value={subscriptions.expired ?? 0}
              icon={Clock}
              tone="border-amber-200 bg-amber-50 text-amber-700"
              description="Renewals pending"
              delay={250}
            />

            {/* 7. Pending Invoices */}
            <DashboardKpiCard
              title="Pending Invoices"
              value={invoices.pendingPayments ?? invoices.pendingInvoices ?? invoices.pending ?? 0}
              icon={FileText}
              tone="border-rose-200 bg-rose-50 text-rose-600"
              description="Awaiting collection"
              delay={300}
            />

            {/* 8. Total Revenue */}
            <DashboardKpiCard
              title="Total Revenue"
              value={revenueTotal}
              isCurrency={true}
              icon={IndianRupee}
              tone="border-emerald-300 bg-emerald-100/80 text-[#173D30]"
              description="Settled invoice totals"
              delay={350}
            />
          </div>

          {/* Dedicated Customer Analytics Section: 2 Animated Graphs */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 sm:gap-6 w-full items-stretch">
            {/* Graph 1: Customer Growth */}
            <CustomerGrowthCard
              monthlyGrowth={data?.monthlyGrowth || data?.customers?.monthlyGrowth || []}
              totalCustomers={customers.totalCustomers ?? 0}
              newCustomers={customers.newCustomers ?? 0}
              loading={loading && !data}
            />

            {/* Graph 2: Customers by Status */}
            <CustomerStatusCard
              customers={customers}
              loading={loading && !data}
            />
          </div>

          {/* D. Invoice Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 w-full">
            {/* Paid Invoices */}
            <InvoiceSummaryCard
              title="Paid Invoices"
              count={invoices.paidInvoices ?? invoices.paid ?? 0}
              status="Settled"
              icon={CheckCircle2}
              tone={{
                border: 'border-emerald-200/90',
                bg: 'bg-emerald-50/50',
                badge: 'border-emerald-300 bg-emerald-100 text-emerald-800',
                iconBg: 'bg-emerald-100 border-emerald-200',
                iconColor: 'text-emerald-700',
              }}
              subtext="Completed collections"
            />

            {/* Pending Invoices */}
            <InvoiceSummaryCard
              title="Pending Invoices"
              count={invoices.pendingPayments ?? invoices.pendingInvoices ?? invoices.pending ?? 0}
              status="Pending"
              icon={Clock}
              tone={{
                border: 'border-amber-200/90',
                bg: 'bg-amber-50/50',
                badge: 'border-amber-300 bg-amber-100 text-amber-800',
                iconBg: 'bg-amber-100 border-amber-200',
                iconColor: 'text-amber-700',
              }}
              subtext="Awaiting client payment"
            />

            {/* Overdue Invoices */}
            <InvoiceSummaryCard
              title="Overdue Invoices"
              count={invoices.overdueInvoices ?? invoices.overdue ?? 0}
              status="Overdue"
              icon={AlertTriangle}
              tone={{
                border: 'border-rose-200/90',
                bg: 'bg-rose-50/50',
                badge: 'border-rose-300 bg-rose-100 text-rose-800',
                iconBg: 'bg-rose-100 border-rose-200',
                iconColor: 'text-rose-700',
              }}
              subtext="Exceeded payment due date"
            />
          </div>

          {/* E & F. Two-Column Layout: Recent Customers & Recent Invoices (Equally stretched and aligned) */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 w-full items-stretch">
            {/* Section E: Recent Customers */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs flex flex-col justify-between h-full space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-[#16A34A] border border-emerald-100 shrink-0">
                    <UsersRound className="size-4.5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 leading-tight">Recent Customers</h2>
                    <p className="text-[11px] text-slate-500 mt-0.5">Latest customers from won leads</p>
                  </div>
                </div>

                <Link
                  href="/admin/crm/customers"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#16A34A] hover:underline shrink-0"
                >
                  <span>View all</span>
                  <ArrowUpRight className="size-3" />
                </Link>
              </div>

              {/* Toolbar */}
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                {/* Search */}
                <div className="relative flex-1 min-w-[160px]">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
                  <Input
                    type="text"
                    value={customerSearch}
                    onChange={(e) => {
                      setCustomerSearch(e.target.value);
                      setCustomerPage(1);
                    }}
                    placeholder="Search customers..."
                    className="h-9 w-full rounded-xl border-slate-200 bg-slate-50/70 pl-8.5 pr-7 text-xs focus-visible:bg-white focus-visible:border-emerald-400 focus-visible:ring-emerald-100"
                  />
                  {customerSearch && (
                    <button
                      onClick={() => setCustomerSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="size-3" />
                    </button>
                  )}
                </div>

                {/* Status Filter */}
                <select
                  value={customerStatusFilter}
                  onChange={(e) => {
                    setCustomerStatusFilter(e.target.value);
                    setCustomerPage(1);
                  }}
                  className="h-9 w-[130px] shrink-0 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                >
                  <option value="">All Statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>

                {/* Column Visibility */}
                <ColumnVisibilityToggle
                  columns={[
                    { key: 'name', label: 'Customer' },
                    { key: 'email', label: 'Email' },
                    { key: 'plan', label: 'Plan' },
                    { key: 'status', label: 'Status' },
                    { key: 'created', label: 'Created Date' },
                  ]}
                  visibility={customerColVisibility}
                  onToggle={(key) =>
                    setCustomerColVisibility((prev) => ({ ...prev, [key]: !prev[key] }))
                  }
                />
              </div>

              {/* Table / List Container */}
              <div className="overflow-x-auto min-w-0 flex-1 flex flex-col justify-between">
                {filteredCustomers.length === 0 ? (
                  <div className="min-h-[260px] flex-1 flex flex-col items-center justify-center text-center space-y-2 py-8">
                    <div className="inline-flex size-11 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 border border-slate-100">
                      <Users className="size-5" />
                    </div>
                    <p className="text-xs font-bold text-slate-800">No customers found</p>
                    <p className="text-[11px] text-slate-500 max-w-xs">
                      {customerSearch || customerStatusFilter
                        ? 'Try clearing your search or status query'
                        : 'No customer accounts available in the database'}
                    </p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-[#F8FBF9] text-[10px] font-bold uppercase tracking-wider text-slate-600">
                        {customerColVisibility.name && <th className="py-2.5 px-3">Customer</th>}
                        {customerColVisibility.email && <th className="py-2.5 px-3">Email</th>}
                        {customerColVisibility.plan && <th className="py-2.5 px-3">Plan</th>}
                        {customerColVisibility.status && <th className="py-2.5 px-3">Status</th>}
                        {customerColVisibility.created && (
                          <th className="py-2.5 px-3 text-right">Created</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {paginatedCustomers.map((row) => {
                        const displayName = row.name || row.companyName || 'Unnamed Customer';
                        const statusStr = String(
                          row.status || (row.isActive === false ? 'INACTIVE' : 'ACTIVE')
                        ).toUpperCase();

                        return (
                          <tr
                            key={row.id || row.email}
                            className="hover:bg-[#F8FBF9] transition-colors h-[52px]"
                          >
                            {customerColVisibility.name && (
                              <td className="py-2 px-3 whitespace-nowrap">
                                <div className="flex items-center gap-2.5">
                                  <div
                                    className={cn(
                                      'flex size-7.5 items-center justify-center rounded-full bg-linear-to-br text-white font-bold text-[10px] shrink-0 shadow-2xs',
                                      getAvatarGradient(displayName)
                                    )}
                                  >
                                    {getInitials(displayName)}
                                  </div>
                                  <span
                                    title={displayName}
                                    className="font-semibold text-slate-900 truncate max-w-[130px]"
                                  >
                                    {displayName}
                                  </span>
                                </div>
                              </td>
                            )}

                            {customerColVisibility.email && (
                              <td className="py-2 px-3 whitespace-nowrap text-slate-500 truncate max-w-[140px]">
                                {row.email || 'N/A'}
                              </td>
                            )}

                            {customerColVisibility.plan && (
                              <td className="py-2 px-3 whitespace-nowrap">
                                <CustomerPlanBadge row={row} />
                              </td>
                            )}

                            {customerColVisibility.status && (
                              <td className="py-2 px-3 whitespace-nowrap">
                                <span
                                  className={cn(
                                    'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border',
                                    statusStr === 'ACTIVE'
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      : 'bg-slate-100 text-slate-600 border-slate-200'
                                  )}
                                >
                                  {statusStr}
                                </span>
                              </td>
                            )}

                            {customerColVisibility.created && (
                              <td className="py-2 px-3 text-right whitespace-nowrap text-slate-500 text-[11px]">
                                {formatDisplayDate(row.createdAt)}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Customer Pagination (Always present to anchor baseline) */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500 mt-auto">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-medium text-slate-500">Rows:</span>
                  <select
                    value={customerPageSize}
                    onChange={(e) => {
                      setCustomerPageSize(Number(e.target.value));
                      setCustomerPage(1);
                    }}
                    disabled={filteredCustomers.length === 0}
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 outline-none disabled:opacity-50"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-medium text-slate-600">
                    {filteredCustomers.length === 0 ? '0 / 0' : `${customerPage} / ${customerTotalPages}`}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={customerPage <= 1 || filteredCustomers.length === 0}
                      onClick={() => setCustomerPage((p) => Math.max(1, p - 1))}
                      className="h-7 size-7 p-0 rounded-lg border-slate-200"
                    >
                      <ChevronLeft className="size-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={customerPage >= customerTotalPages || filteredCustomers.length === 0}
                      onClick={() => setCustomerPage((p) => Math.min(customerTotalPages, p + 1))}
                      className="h-7 size-7 p-0 rounded-lg border-slate-200"
                    >
                      <ChevronRight className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Section F: Recent Invoices */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs flex flex-col justify-between h-full space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-[#16A34A] border border-emerald-100 shrink-0">
                    <FileText className="size-4.5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 leading-tight">Recent Invoices</h2>
                    <p className="text-[11px] text-slate-500 mt-0.5">Billing records and payment statuses</p>
                  </div>
                </div>

                <Link
                  href="/admin/customer/invoices"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#16A34A] hover:underline shrink-0"
                >
                  <span>View all</span>
                  <ArrowUpRight className="size-3" />
                </Link>
              </div>

              {/* Toolbar */}
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                {/* Search */}
                <div className="relative flex-1 min-w-[160px]">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
                  <Input
                    type="text"
                    value={invoiceSearch}
                    onChange={(e) => {
                      setInvoiceSearch(e.target.value);
                      setInvoicePage(1);
                    }}
                    placeholder="Search invoices by number or client..."
                    className="h-9 w-full rounded-xl border-slate-200 bg-slate-50/70 pl-8.5 pr-7 text-xs focus-visible:bg-white focus-visible:border-emerald-400 focus-visible:ring-emerald-100"
                  />
                  {invoiceSearch && (
                    <button
                      onClick={() => setInvoiceSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="size-3" />
                    </button>
                  )}
                </div>

                {/* Status Filter */}
                <select
                  value={invoiceStatusFilter}
                  onChange={(e) => {
                    setInvoiceStatusFilter(e.target.value);
                    setInvoicePage(1);
                  }}
                  className="h-9 w-[130px] shrink-0 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                >
                  <option value="">All Statuses</option>
                  <option value="PAID">Paid</option>
                  <option value="PENDING">Pending</option>
                  <option value="OVERDUE">Overdue</option>
                </select>

                {/* Column Visibility */}
                <ColumnVisibilityToggle
                  columns={[
                    { key: 'invoiceNo', label: 'Invoice No' },
                    { key: 'customer', label: 'Customer' },
                    { key: 'total', label: 'Total Amount' },
                    { key: 'status', label: 'Status' },
                  ]}
                  visibility={invoiceColVisibility}
                  onToggle={(key) =>
                    setInvoiceColVisibility((prev) => ({ ...prev, [key]: !prev[key] }))
                  }
                />
              </div>

              {/* Table / List Container */}
              <div className="overflow-x-auto min-w-0 flex-1 flex flex-col justify-between">
                {filteredInvoices.length === 0 ? (
                  <div className="min-h-[260px] flex-1 flex flex-col items-center justify-center text-center space-y-2 py-8">
                    <div className="inline-flex size-11 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 border border-slate-100">
                      <FileText className="size-5" />
                    </div>
                    <p className="text-xs font-bold text-slate-800">No invoices found</p>
                    <p className="text-[11px] text-slate-500 max-w-xs">
                      {invoiceSearch || invoiceStatusFilter
                        ? 'Try clearing your search or status query'
                        : 'No recent billing invoices in the database'}
                    </p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-[#F8FBF9] text-[10px] font-bold uppercase tracking-wider text-slate-600">
                        {invoiceColVisibility.invoiceNo && (
                          <th className="py-2.5 px-3">Invoice No</th>
                        )}
                        {invoiceColVisibility.customer && (
                          <th className="py-2.5 px-3">Customer</th>
                        )}
                        {invoiceColVisibility.total && (
                          <th className="py-2.5 px-3">Total Amount</th>
                        )}
                        {invoiceColVisibility.status && (
                          <th className="py-2.5 px-3 text-right">Status</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {paginatedInvoices.map((inv) => {
                        const invoiceNum = inv.invoiceNo || inv.invoiceNumber || 'INV-—';
                        const clientName = inv.customerName || inv.clientName || 'General Client';
                        const statusStr = String(inv.status || 'PENDING').toUpperCase();

                        return (
                          <tr
                            key={inv.id || invoiceNum}
                            className="hover:bg-[#F8FBF9] transition-colors h-[52px]"
                          >
                            {invoiceColVisibility.invoiceNo && (
                              <td className="py-2 px-3 whitespace-nowrap font-mono font-semibold text-slate-900">
                                {invoiceNum}
                              </td>
                            )}

                            {invoiceColVisibility.customer && (
                              <td className="py-2 px-3 whitespace-nowrap font-medium text-slate-800 truncate max-w-[140px]">
                                {clientName}
                              </td>
                            )}

                            {invoiceColVisibility.total && (
                              <td className="py-2 px-3 whitespace-nowrap font-semibold text-slate-900">
                                {inr(inv.totalAmount)}
                              </td>
                            )}

                            {invoiceColVisibility.status && (
                              <td className="py-2 px-3 text-right whitespace-nowrap">
                                <span
                                  className={cn(
                                    'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border',
                                    statusStr === 'PAID' &&
                                      'bg-emerald-50 text-emerald-700 border-emerald-200',
                                    statusStr === 'PENDING' &&
                                      'bg-amber-50 text-amber-700 border-amber-200',
                                    statusStr === 'OVERDUE' &&
                                      'bg-rose-50 text-rose-700 border-rose-200',
                                    !['PAID', 'PENDING', 'OVERDUE'].includes(statusStr) &&
                                      'bg-slate-100 text-slate-700 border-slate-200'
                                  )}
                                >
                                  {statusStr}
                                </span>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Invoice Pagination (Always present to anchor baseline) */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500 mt-auto">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-medium text-slate-500">Rows:</span>
                  <select
                    value={invoicePageSize}
                    onChange={(e) => {
                      setInvoicePageSize(Number(e.target.value));
                      setInvoicePage(1);
                    }}
                    disabled={filteredInvoices.length === 0}
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 outline-none disabled:opacity-50"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-medium text-slate-600">
                    {filteredInvoices.length === 0 ? '0 / 0' : `${invoicePage} / ${invoiceTotalPages}`}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={invoicePage <= 1 || filteredInvoices.length === 0}
                      onClick={() => setInvoicePage((p) => Math.max(1, p - 1))}
                      className="h-7 size-7 p-0 rounded-lg border-slate-200"
                    >
                      <ChevronLeft className="size-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={invoicePage >= invoiceTotalPages || filteredInvoices.length === 0}
                      onClick={() => setInvoicePage((p) => Math.min(invoiceTotalPages, p + 1))}
                      className="h-7 size-7 p-0 rounded-lg border-slate-200"
                    >
                      <ChevronRight className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
