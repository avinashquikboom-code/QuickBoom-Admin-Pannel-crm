'use client';

import * as React from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/common/Badge';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { SlideOverDrawer } from '@/components/common/Drawer';
import { toast } from '@/hooks/use-toast';
import {
  ShieldCheck,
  Plus,
  Download,
  RotateCw,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Ban,
  Trash2,
  Eye,
  Check,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Building2,
  User,
  Phone,
  Mail,
  ArrowUpDown,
  Layers,
  X,
  CreditCard,
  RefreshCw,
  SlidersHorizontal,
  CalendarCheck,
  CalendarClock,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import {
  loadSubscriptions,
  loadPlans,
  renewSubscription,
  deactivateSubscription,
  activateSubscription,
  changeSubscriptionPlan,
  deleteSubscription,
  bulkDeleteSubscriptions,
  sessionCan,
  billingError,
} from '@/modules/customer/billing-api';

const STATUS_TABS = [
  { key: 'ALL', label: 'All Subscriptions' },
  { key: 'ACTIVE', label: 'Active' },
  { key: 'EXPIRING', label: 'Expiring Soon (10d)' },
  { key: 'EXPIRED', label: 'Expired' },
  { key: 'CANCELLED', label: 'Cancelled' },
];

const inr = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const formatDate = (dateStr) => {
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
    return String(dateStr).slice(0, 10) || '—';
  }
};

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
    case 'EXPIRED':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-800 border border-rose-200">
          <span className="size-1.5 rounded-full bg-rose-500" />
          Expired
        </span>
      );
    case 'CANCELLED':
    case 'INACTIVE':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700 border border-slate-200">
          <span className="size-1.5 rounded-full bg-slate-400" />
          Cancelled
        </span>
      );
    case 'PENDING':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800 border border-amber-200">
          <span className="size-1.5 rounded-full bg-amber-500" />
          Pending
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

const getDaysLeftBadge = (daysRemaining, status) => {
  if (status === 'EXPIRED' || daysRemaining === 0) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
        Expired
      </span>
    );
  }
  if (typeof daysRemaining !== 'number' || isNaN(daysRemaining)) {
    return <span className="text-slate-400">—</span>;
  }
  if (daysRemaining < 0) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
        {Math.abs(daysRemaining)}d overdue
      </span>
    );
  }
  if (daysRemaining <= 5) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
        {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'}
      </span>
    );
  }
  if (daysRemaining <= 15) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
        {daysRemaining} days
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
      {daysRemaining} days
    </span>
  );
};

export function SubscriptionsScreen() {
  const [allowed, setAllowed] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [subscriptions, setSubscriptions] = React.useState([]);
  const [plans, setPlans] = React.useState([]);
  const [summary, setSummary] = React.useState({
    total: 0,
    totalActive: 0,
    expiring10: 0,
    expired: 0,
  });

  const [activeTab, setActiveTab] = React.useState('ALL');
  const [search, setSearch] = React.useState('');
  const [cycleFilter, setCycleFilter] = React.useState('ALL');
  const [sortBy, setSortBy] = React.useState('newest');
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(10);
  const [totalCount, setTotalCount] = React.useState(0);
  const [selectedIds, setSelectedIds] = React.useState([]);

  // Modals & Drawers
  const [detailDrawerOpen, setDetailDrawerOpen] = React.useState(false);
  const [selectedSub, setSelectedSub] = React.useState(null);
  const [planModalOpen, setPlanModalOpen] = React.useState(false);
  const [subToChangePlan, setSubToChangePlan] = React.useState(null);
  const [selectedNewPlanId, setSelectedNewPlanId] = React.useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);
  const [subToDelete, setSubToDelete] = React.useState(null);
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = React.useState(false);
  const [actionLoading, setActionLoading] = React.useState(false);

  React.useEffect(() => {
    setAllowed(
      sessionCan('SUBSCRIPTION') ||
      sessionCan('CUSTOMER_PLANS') ||
      sessionCan('CRM')
    );
    loadPlans()
      .then(setPlans)
      .catch((err) => {
        console.error('Failed to load subscription plans', err);
        setPlans([]);
      });
  }, []);

  const fetchSubscriptions = React.useCallback(async () => {
    setLoading(true);
    try {
      let queryStatus = activeTab === 'ALL' ? undefined : activeTab;
      if (activeTab === 'EXPIRING') queryStatus = undefined;

      const res = await loadSubscriptions({
        page,
        limit,
        status: queryStatus,
        search: search.trim() || undefined,
      });

      let items = res.rows || [];

      // If activeTab is EXPIRING, filter locally by daysRemaining <= 10
      if (activeTab === 'EXPIRING') {
        items = items.filter(
          (s) =>
            s.status === 'ACTIVE' &&
            typeof s.daysRemaining === 'number' &&
            s.daysRemaining >= 0 &&
            s.daysRemaining <= 10
        );
      }

      // Filter by billing cycle if selected
      if (cycleFilter !== 'ALL') {
        items = items.filter(
          (s) => String(s.billingCycle || '').toUpperCase() === cycleFilter
        );
      }

      // Sort items
      if (sortBy === 'newest') {
        items.sort((a, b) => new Date(b.startDate || b.createdAt || 0) - new Date(a.startDate || a.createdAt || 0));
      } else if (sortBy === 'oldest') {
        items.sort((a, b) => new Date(a.startDate || a.createdAt || 0) - new Date(b.startDate || b.createdAt || 0));
      } else if (sortBy === 'price_high') {
        items.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
      } else if (sortBy === 'days_left') {
        items.sort((a, b) => (Number(a.daysRemaining) || 0) - (Number(b.daysRemaining) || 0));
      }

      setSubscriptions(items);
      setTotalCount(res.pagination?.total || items.length);

      if (res.summary) {
        setSummary({
          total: res.summary.total ?? items.length,
          totalActive: res.summary.totalActive ?? 0,
          expiring10: res.summary.expiring10 ?? 0,
          expired: res.summary.expired ?? 0,
        });
      }
    } catch (err) {
      toast.error(billingError(err) || 'Failed to load customer subscriptions');
    } finally {
      setLoading(false);
    }
  }, [page, limit, activeTab, search, cycleFilter, sortBy]);

  React.useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  // Handle single renew
  const handleRenew = async (row) => {
    try {
      await renewSubscription(row.id);
      toast.success(`Subscription renewed for ${row.customerName}`);
      fetchSubscriptions();
    } catch (err) {
      toast.error(billingError(err) || 'Failed to renew subscription');
    }
  };

  // Handle deactivate / activate
  const handleToggleActive = async (row) => {
    try {
      if (row.status === 'ACTIVE') {
        await deactivateSubscription(row.id);
        toast.success(`Subscription deactivated for ${row.customerName}`);
      } else {
        await activateSubscription(row.id);
        toast.success(`Subscription activated for ${row.customerName}`);
      }
      if (selectedSub?.id === row.id) {
        setSelectedSub((prev) => ({
          ...prev,
          status: prev.status === 'ACTIVE' ? 'CANCELLED' : 'ACTIVE',
        }));
      }
      fetchSubscriptions();
    } catch (err) {
      toast.error(billingError(err) || 'Failed to update subscription status');
    }
  };

  // Handle plan change
  const handleChangePlanSubmit = async (e) => {
    e.preventDefault();
    if (!subToChangePlan || !selectedNewPlanId) {
      toast.error('Please select a new subscription plan');
      return;
    }
    setActionLoading(true);
    try {
      await changeSubscriptionPlan(subToChangePlan.id, selectedNewPlanId);
      toast.success('Subscription plan changed successfully');
      setPlanModalOpen(false);
      setSubToChangePlan(null);
      setSelectedNewPlanId('');
      fetchSubscriptions();
    } catch (err) {
      toast.error(billingError(err) || 'Failed to change subscription plan');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle single delete
  const handleDeleteSubscription = async () => {
    if (!subToDelete?.id) return;
    setActionLoading(true);
    try {
      await deleteSubscription(subToDelete.id);
      toast.success(`Subscription for ${subToDelete.customerName} removed`);
      setDeleteConfirmOpen(false);
      setSubToDelete(null);
      if (detailDrawerOpen && selectedSub?.id === subToDelete.id) {
        setDetailDrawerOpen(false);
      }
      setSelectedIds((prev) => prev.filter((id) => id !== subToDelete.id));
      fetchSubscriptions();
    } catch (err) {
      toast.error(billingError(err) || 'Failed to delete subscription');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (!selectedIds.length) return;
    setActionLoading(true);
    try {
      await bulkDeleteSubscriptions(selectedIds);
      toast.success(`${selectedIds.length} subscription(s) deleted`);
      setBulkDeleteConfirmOpen(false);
      setSelectedIds([]);
      fetchSubscriptions();
    } catch (err) {
      toast.error(billingError(err) || 'Failed to bulk delete subscriptions');
    } finally {
      setActionLoading(false);
    }
  };

  // Export CSV
  const exportCsv = () => {
    if (!subscriptions.length) {
      toast.info('No subscription records to export');
      return;
    }
    const headers = [
      'Customer Name',
      'Customer Email',
      'Assigned Employee',
      'Plan Name',
      'Price',
      'Billing Cycle',
      'Start Date',
      'Expiry Date',
      'Days Left',
      'Status',
    ];
    const csvRows = [
      headers.join(','),
      ...subscriptions.map((s) =>
        [
          `"${(s.customerName || '').replace(/"/g, '""')}"`,
          `"${(s.customerEmail || '').replace(/"/g, '""')}"`,
          `"${(s.assignedEmployee || '').replace(/"/g, '""')}"`,
          `"${(s.planName || '').replace(/"/g, '""')}"`,
          `"${s.price || 0}"`,
          `"${s.billingCycle || ''}"`,
          `"${String(s.startDate || '').slice(0, 10)}"`,
          `"${String(s.expiryDate || '').slice(0, 10)}"`,
          `"${s.daysRemaining ?? ''}"`,
          `"${s.status || ''}"`,
        ].join(',')
      ),
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `crm_subscriptions_${activeTab.toLowerCase()}_export.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Subscription data exported successfully');
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedIds(subscriptions.map((s) => s.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const totalPages = Math.ceil(totalCount / limit) || 1;

  return (
    <div className="w-full min-w-0 max-w-none space-y-6 pb-28">
      {/* ── 1. Page Header ────────────────────────────────────────── */}
      <PageHeader
        title="Active Subscriptions"
        description="Customer subscriptions, plan quotas, billing cycles, and automated expiration monitoring."
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={exportCsv}
              disabled={loading || !subscriptions.length}
              className="h-10 rounded-xl border-[#E2E8E5] text-[#163A2E] hover:bg-slate-50 transition"
            >
              <Download className="mr-1.5 size-4 text-[#107569]" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchSubscriptions}
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
            if (tab.key === 'ALL') countBadge = summary.total;
            else if (tab.key === 'ACTIVE') countBadge = summary.totalActive;
            else if (tab.key === 'EXPIRING') countBadge = summary.expiring10;
            else if (tab.key === 'EXPIRED') countBadge = summary.expired;

            return (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key);
                  setPage(1);
                  setSelectedIds([]);
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
        {/* Total Subscriptions */}
        <div className="group relative overflow-hidden rounded-2xl border border-[#E2E8E5] bg-white p-5 shadow-xs transition hover:border-[#107569]/40 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
              Total Subscriptions
            </span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-[#107569] border border-emerald-100">
              <ShieldCheck className="size-4.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-[#163A2E]">
              {summary.total}
            </span>
            <span className="text-xs text-slate-500 font-medium">Tracked customer plans</span>
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
              Active Plans
            </span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="size-4.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-emerald-800">
              {summary.totalActive}
            </span>
            <span className="text-xs text-emerald-700 font-medium">Live customer licenses</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-emerald-700">
            <span className="inline-block size-1.5 rounded-full bg-emerald-500" />
            Within valid term window
          </div>
        </div>

        {/* Expiring in 10 Days */}
        <div className="group relative overflow-hidden rounded-2xl border border-[#E2E8E5] bg-white p-5 shadow-xs transition hover:border-amber-500/40 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
              Expiring in 10 Days
            </span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
              <Clock className="size-4.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-amber-800">
              {summary.expiring10}
            </span>
            <span className="text-xs text-amber-700 font-medium">Renewal candidates</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-amber-700">
            <span className="inline-block size-1.5 rounded-full bg-amber-500" />
            Automated reminders scheduled
          </div>
        </div>

        {/* Expired Subscriptions */}
        <div className="group relative overflow-hidden rounded-2xl border border-[#E2E8E5] bg-white p-5 shadow-xs transition hover:border-rose-500/40 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
              Expired Subscriptions
            </span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-rose-50 text-rose-700 border border-rose-200">
              <AlertTriangle className="size-4.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-rose-800">
              {summary.expired}
            </span>
            <span className="text-xs text-rose-700 font-medium">Lapsed memberships</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-rose-700">
            <span className="inline-block size-1.5 rounded-full bg-rose-500" />
            Eligible for reactivation
          </div>
        </div>
      </div>

      {/* ── 4. Unified Search, Filter & Bulk Actions Bar ───────────── */}
      <div className="space-y-3">
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
              placeholder="Search by customer name, email, plan..."
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
            {/* Billing Cycle Filter */}
            <div className="flex items-center gap-2 bg-[#F4F9F6] border border-[#E2E8E5] px-3 py-1.5 rounded-xl">
              <Calendar className="size-3.5 text-[#107569]" />
              <span className="text-xs font-semibold text-[#163A2E]">Cycle:</span>
              <select
                value={cycleFilter}
                onChange={(e) => {
                  setCycleFilter(e.target.value);
                  setPage(1);
                }}
                className="bg-transparent text-xs font-semibold text-[#163A2E] focus:outline-hidden cursor-pointer"
              >
                <option value="ALL">All Cycles</option>
                <option value="MONTHLY">Monthly</option>
                <option value="YEARLY">Yearly</option>
                <option value="QUARTERLY">Quarterly</option>
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
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="price_high">Price: High to Low</option>
                <option value="days_left">Days Left: Low to High</option>
              </select>
            </div>
          </div>
        </div>

        {/* Floating Bulk Action Bar (When rows selected) */}
        {selectedIds.length > 0 && (
          <div className="flex items-center justify-between bg-[#163A2E] text-white px-4 py-2.5 rounded-xl shadow-md animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2.5">
              <span className="flex size-6 items-center justify-center rounded-full bg-[#107569] text-xs font-bold text-white">
                {selectedIds.length}
              </span>
              <span className="text-xs font-medium">subscription(s) selected</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedIds([])}
                className="h-7 text-xs text-white/80 hover:text-white hover:bg-white/10 rounded-lg px-2"
              >
                Clear
              </Button>
              {allowed && (
                <Button
                  size="sm"
                  onClick={() => setBulkDeleteConfirmOpen(true)}
                  className="h-7 text-xs bg-rose-600 hover:bg-rose-700 text-white rounded-lg px-2.5 gap-1.5 font-semibold"
                >
                  <Trash2 className="size-3.5" />
                  Delete Selected
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── 5. Modern Subscriptions Table ─────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-[#E2E8E5] bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F4F9F6] border-b border-[#E2E8E5] text-[#163A2E]">
                <th className="py-3.5 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={
                      subscriptions.length > 0 &&
                      selectedIds.length === subscriptions.length
                    }
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="size-4 rounded border-slate-300 text-[#107569] focus:ring-[#107569] cursor-pointer"
                  />
                </th>
                <th className="py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider">
                  Customer
                </th>
                <th className="py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider">
                  Plan
                </th>
                <th className="py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider text-right">
                  Price
                </th>
                <th className="py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider text-center">
                  Cycle
                </th>
                <th className="py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider">
                  Start Date
                </th>
                <th className="py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider">
                  Expiry Date
                </th>
                <th className="py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider text-center">
                  Days Left
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
                  <td colSpan={10} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RotateCw className="size-6 text-[#107569] animate-spin" />
                      <span className="text-sm font-semibold text-slate-600">
                        Loading subscriptions...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto text-center gap-2">
                      <div className="flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                        <ShieldCheck className="size-6" />
                      </div>
                      <h4 className="text-base font-bold text-[#163A2E]">
                        No Subscriptions Found
                      </h4>
                      <p className="text-xs text-slate-500">
                        {search
                          ? `No subscriptions matched "${search}". Try adjusting search or tab filter.`
                          : 'No subscription records currently registered in this view.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                subscriptions.map((row) => {
                  const isSelected = selectedIds.includes(row.id);
                  const custName = row.customerName || 'General Customer';
                  const initial = custName.trim()[0]?.toUpperCase() || 'C';

                  return (
                    <tr
                      key={row.id}
                      className={`transition-colors hover:bg-slate-50/70 ${
                        isSelected ? 'bg-emerald-50/40' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 px-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectRow(row.id)}
                          className="size-4 rounded border-slate-300 text-[#107569] focus:ring-[#107569] cursor-pointer"
                        />
                      </td>

                      {/* Customer */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-200 text-[#107569] font-bold text-xs shrink-0">
                            {initial}
                          </div>
                          <div className="min-w-0">
                            <button
                              onClick={() => {
                                setSelectedSub(row);
                                setDetailDrawerOpen(true);
                              }}
                              className="font-bold text-[#163A2E] hover:text-[#107569] hover:underline text-left block truncate max-w-[180px]"
                            >
                              {custName}
                            </button>
                            {row.customerEmail && (
                              <p className="text-[11px] text-slate-500 truncate max-w-[180px]">
                                {row.customerEmail}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Plan */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50/80 border border-emerald-200 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                          <Layers className="size-3 text-[#107569]" />
                          {row.planName || 'Standard Package'}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-[#163A2E]">
                        {inr(row.price)}
                      </td>

                      {/* Billing Cycle */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex rounded-md bg-[#F4F9F6] border border-[#E2E8E5] px-2 py-0.5 text-[10px] font-bold text-[#163A2E] uppercase">
                          {row.billingCycle || 'MONTHLY'}
                        </span>
                      </td>

                      {/* Start Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 font-medium">
                        {formatDate(row.startDate)}
                      </td>

                      {/* Expiry Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 font-medium">
                        {formatDate(row.expiryDate)}
                      </td>

                      {/* Days Left */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {getDaysLeftBadge(row.daysRemaining, row.status)}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {getStatusBadge(row.status)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {/* View Detail */}
                          <button
                            title="View Subscription Details"
                            onClick={() => {
                              setSelectedSub(row);
                              setDetailDrawerOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-[#107569] hover:bg-emerald-50 transition"
                          >
                            <Eye className="size-4" />
                          </button>

                          {/* Change Plan */}
                          {allowed && (
                            <button
                              title="Change Plan"
                              onClick={() => {
                                setSubToChangePlan(row);
                                setSelectedNewPlanId(String(row.planId || ''));
                                setPlanModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-[#107569] hover:bg-emerald-50 transition"
                            >
                              <RefreshCw className="size-4" />
                            </button>
                          )}

                          {/* Delete */}
                          {allowed && (
                            <button
                              title="Delete Subscription"
                              onClick={() => {
                                setSubToDelete(row);
                                setDeleteConfirmOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                            >
                              <Trash2 className="size-4" />
                            </button>
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
              Showing {subscriptions.length > 0 ? (page - 1) * limit + 1 : 0}–
              {Math.min(page * limit, totalCount)} of {totalCount} subscriptions
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

      {/* ── 7. SlideOver Drawer: View Subscription Details ─────────── */}
      <SlideOverDrawer
        open={detailDrawerOpen}
        onOpenChange={setDetailDrawerOpen}
        title={selectedSub?.customerName ? `${selectedSub.customerName}'s Subscription` : 'Subscription Details'}
        description="Comprehensive customer plan, billing lifecycle, and license quotas."
      >
        {selectedSub && (
          <div className="space-y-5 p-1 text-xs">
            {/* Header Status Card */}
            <div className="p-4 rounded-2xl bg-[#F4F9F6] border border-[#E2E8E5] space-y-3">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-sm font-bold text-[#163A2E]">
                  <Layers className="size-4 text-[#107569]" />
                  {selectedSub.planName}
                </span>
                {getStatusBadge(selectedSub.status)}
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-600">
                <div>
                  <span className="text-[11px] text-slate-400 block font-semibold">PRICE & CYCLE</span>
                  <span className="font-bold text-[#107569] text-sm">{inr(selectedSub.price)}</span>
                  <span className="text-[11px] text-slate-500 ml-1 font-medium">/{selectedSub.billingCycle || 'mo'}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block font-semibold">REMAINING DAYS</span>
                  <div className="pt-0.5">{getDaysLeftBadge(selectedSub.daysRemaining, selectedSub.status)}</div>
                </div>
              </div>
            </div>

            {/* Customer Details */}
            <div className="p-4 rounded-2xl border border-[#E2E8E5] bg-white space-y-2.5">
              <h5 className="font-bold text-[#163A2E] flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                <Building2 className="size-3.5 text-[#107569]" />
                Customer Account
              </h5>
              <div className="space-y-1">
                <p className="text-sm font-bold text-[#163A2E]">{selectedSub.customerName}</p>
                {selectedSub.customerEmail && (
                  <p className="text-slate-500 flex items-center gap-1.5">
                    <Mail className="size-3 text-slate-400" />
                    {selectedSub.customerEmail}
                  </p>
                )}
                {selectedSub.assignedEmployee && selectedSub.assignedEmployee !== 'Unassigned' && (
                  <p className="text-slate-600 flex items-center gap-1.5 pt-1">
                    <User className="size-3 text-[#107569]" />
                    Assigned Agent: <span className="font-semibold text-[#163A2E]">{selectedSub.assignedEmployee}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Dates & Schedule */}
            <div className="p-4 rounded-2xl border border-[#E2E8E5] bg-white space-y-3">
              <h5 className="font-bold text-[#163A2E] flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                <CalendarCheck className="size-3.5 text-[#107569]" />
                Subscription Dates
              </h5>
              <div className="space-y-2 text-slate-600">
                <div className="flex justify-between items-center py-1 border-b border-[#E2E8E5]">
                  <span>Activation / Start:</span>
                  <span className="font-semibold text-[#163A2E]">{formatDate(selectedSub.startDate)}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-[#E2E8E5]">
                  <span>Renewal / Expiry:</span>
                  <span className="font-semibold text-[#163A2E]">{formatDate(selectedSub.expiryDate)}</span>
                </div>
                <div className="flex justify-between items-center py-1 text-slate-600">
                  <span>Duration Term:</span>
                  <span className="font-semibold text-[#163A2E]">{selectedSub.duration} {selectedSub.durationUnit || 'MONTH'}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="p-4 rounded-2xl border border-[#E2E8E5] bg-[#F4F9F6] space-y-2.5">
              <label className="font-bold text-[#163A2E] block text-[11px] uppercase tracking-wider">
                Subscription Operations
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => handleRenew(selectedSub)}
                  className="h-9 rounded-xl bg-[#107569] text-white hover:bg-[#0e6359] text-xs font-semibold"
                >
                  <RotateCw className="size-3.5 mr-1" />
                  Renew Term
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSubToChangePlan(selectedSub);
                    setSelectedNewPlanId(String(selectedSub.planId || ''));
                    setPlanModalOpen(true);
                  }}
                  className="h-9 rounded-xl border-[#E2E8E5] text-[#163A2E] hover:bg-slate-50 text-xs font-semibold"
                >
                  <RefreshCw className="size-3.5 mr-1 text-[#107569]" />
                  Change Plan
                </Button>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <Button
                  variant="outline"
                  onClick={() => handleToggleActive(selectedSub)}
                  className="flex-1 h-9 rounded-xl border-[#E2E8E5] text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  {selectedSub.status === 'ACTIVE' ? 'Deactivate Subscription' : 'Reactivate Subscription'}
                </Button>
                {allowed && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSubToDelete(selectedSub);
                      setDeleteConfirmOpen(true);
                    }}
                    className="h-9 rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold px-3"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </SlideOverDrawer>

      {/* ── 8. SlideOver / Modal: Change Plan ─────────────────────── */}
      <SlideOverDrawer
        open={planModalOpen}
        onOpenChange={setPlanModalOpen}
        title="Change Subscription Plan"
        description="Switch customer plan tier and adjust feature limits."
      >
        {subToChangePlan && (
          <form onSubmit={handleChangePlanSubmit} className="space-y-5 p-1 text-xs">
            <div className="p-3.5 rounded-2xl bg-[#F4F9F6] border border-[#E2E8E5] space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Current Customer</span>
              <p className="text-sm font-bold text-[#163A2E]">{subToChangePlan.customerName}</p>
              <p className="text-xs text-[#107569] font-semibold">
                Current Plan: {subToChangePlan.planName} ({inr(subToChangePlan.price)}/{subToChangePlan.billingCycle || 'mo'})
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#163A2E]">
                Select New Plan Tier <span className="text-rose-500">*</span>
              </label>
              <div className="space-y-2">
                {plans.map((p) => {
                  const isCur = String(p.id) === String(subToChangePlan.planId);
                  const isSel = String(p.id) === String(selectedNewPlanId);
                  return (
                    <label
                      key={p.id}
                      onClick={() => setSelectedNewPlanId(String(p.id))}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                        isSel
                          ? 'border-[#107569] bg-emerald-50/50 shadow-2xs'
                          : 'border-[#E2E8E5] bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="radio"
                          name="newPlan"
                          value={p.id}
                          checked={isSel}
                          onChange={() => setSelectedNewPlanId(String(p.id))}
                          className="size-4 text-[#107569] focus:ring-[#107569]"
                        />
                        <div>
                          <p className="font-bold text-[#163A2E]">{p.name}</p>
                          <p className="text-[11px] text-slate-500">Plan Code: {p.code || `PLAN-${p.id}`}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-[#107569] text-xs font-mono">{inr(p.monthlyPrice)}</span>
                        <span className="text-[10px] text-slate-500 block">/month</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#E2E8E5]">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPlanModalOpen(false)}
                className="h-10 rounded-xl border-[#E2E8E5] text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={actionLoading || !selectedNewPlanId}
                className="h-10 rounded-xl bg-[#107569] px-5 text-xs font-semibold text-white hover:bg-[#0e6359] shadow-xs"
              >
                {actionLoading ? 'Updating Plan...' : 'Confirm Plan Change'}
              </Button>
            </div>
          </form>
        )}
      </SlideOverDrawer>

      {/* ── 9. Confirmation Dialogs ───────────────────────────────── */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Permanently Delete Subscription?"
        description={`You are about to permanently delete the subscription for ${
          subToDelete?.customerName || subToDelete?.id
        }. This action removes the customer license and cannot be undone.`}
        confirmLabel={actionLoading ? 'Deleting...' : 'Permanently Delete'}
        variant="destructive"
        onConfirm={handleDeleteSubscription}
      />

      <ConfirmDialog
        open={bulkDeleteConfirmOpen}
        onOpenChange={setBulkDeleteConfirmOpen}
        title="Permanently Delete Subscriptions?"
        description={`You are about to permanently delete ${selectedIds.length} selected subscription(s). This action cannot be undone.`}
        confirmLabel={actionLoading ? 'Deleting...' : 'Delete Selected'}
        variant="destructive"
        onConfirm={handleBulkDelete}
      />
    </div>
  );
}
