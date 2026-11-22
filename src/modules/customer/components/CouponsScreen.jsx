'use client';

import * as React from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/common/Badge';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { SlideOverDrawer } from '@/components/common/Drawer';
import { cn } from '@/lib/utils';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import {
  faTags,
  faTicket,
  faPlus,
  faDownload,
  faRotate,
  faSearch,
  faFilter,
  faCheckCircle,
  faBan,
  faClock,
  faUsers,
  faEye,
  faPenToSquare,
  faTrashCan,
  faCopy,
  faCheck,
  faPercent,
  faIndianRupeeSign,
  faBoxesStacked,
  faChevronLeft,
  faChevronRight,
  faXmark,
  faPowerOff,
  faReceipt,
  faSliders,
} from '@fortawesome/free-solid-svg-icons';
import { toast } from '@/hooks/use-toast';
import {
  loadCoupons,
  loadCouponStats,
  getCoupon,
  createCoupon,
  updateCoupon,
  setCouponStatus,
  deleteCoupon,
  loadPlans,
  billingError,
} from '@/modules/customer/billing-api';

const DEFAULT_COLUMNS = {
  checkbox: true,
  code: true,
  name: true,
  discount: true,
  plan: true,
  usage: true,
  status: true,
  validity: true,
  actions: true,
};

const initialFormData = {
  name: '',
  code: '',
  description: '',
  discountType: 'PERCENTAGE',
  discountValue: '',
  maximumDiscountAmount: '',
  minimumAmount: '',
  appliesToAllPlans: true,
  planIds: [],
  usageLimit: 100,
  perCustomerLimit: 1,
  startDate: '',
  endDate: '',
  isActive: true,
};

function formatDate(val) {
  if (!val) return '—';
  try {
    const d = new Date(val);
    return isNaN(d.getTime())
      ? '—'
      : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return '—';
  }
}

function formatMoney(amount) {
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
    style: 'currency',
    currency: 'INR',
  }).format(Number(amount) || 0);
}

export function CouponsScreen() {
  // Stats
  const [stats, setStats] = React.useState({ total: 0, active: 0, inactive: 0, used: 0 });
  const [statsLoading, setStatsLoading] = React.useState(true);
  const [statsError, setStatsError] = React.useState('');

  // Filter state
  const [activeTab, setActiveTab] = React.useState('ALL'); // ALL, ACTIVE, INACTIVE
  const [search, setSearch] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');
  const [planFilter, setPlanFilter] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('ALL');
  const [dateFilterPreset, setDateFilterPreset] = React.useState('ALL');
  const [startDateFilter, setStartDateFilter] = React.useState('');
  const [endDateFilter, setEndDateFilter] = React.useState('');

  // Table & Pagination state
  const [coupons, setCoupons] = React.useState([]);
  const [pagination, setPagination] = React.useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(10);
  const [sortBy, setSortBy] = React.useState('createdAt');
  const [sortOrder, setSortOrder] = React.useState('desc');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [refreshKey, setRefreshKey] = React.useState(0);

  // Available plans for dropdown / selector
  const [availablePlans, setAvailablePlans] = React.useState([]);

  // Selection
  const [selectedIds, setSelectedIds] = React.useState(new Set());

  // Columns visibility
  const [columns, setColumns] = React.useState(DEFAULT_COLUMNS);
  const [showColPicker, setShowColPicker] = React.useState(false);

  // Modals & Drawers
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingCoupon, setEditingCoupon] = React.useState(null);
  const [form, setForm] = React.useState(initialFormData);
  const [formBusy, setFormBusy] = React.useState(false);

  // View Details Modal
  const [viewCoupon, setViewCoupon] = React.useState(null);
  const [viewDetailsLoading, setViewDetailsLoading] = React.useState(false);

  // Delete Confirmation
  const [deletingCoupon, setDeletingCoupon] = React.useState(null);
  const [deleteBusy, setDeleteBusy] = React.useState(false);

  // Copied code feedback
  const [copiedCode, setCopiedCode] = React.useState('');

  // Debounce search
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Load available plans once
  React.useEffect(() => {
    loadPlans()
      .then((plans) => {
        if (Array.isArray(plans)) setAvailablePlans(plans);
      })
      .catch(() => {});
  }, []);

  // Fetch KPI stats
  const fetchStats = React.useCallback(async () => {
    try {
      setStatsLoading(true);
      setStatsError('');
      const data = await loadCouponStats();
      setStats({
        total: Number(data?.total ?? 0),
        active: Number(data?.active ?? 0),
        inactive: Number(data?.inactive ?? 0),
        used: Number(data?.used ?? 0),
      });
    } catch (err) {
      setStatsError(billingError(err) || 'Failed to load coupon statistics. Please try again.');
    } finally {
      setStatsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchStats();
  }, [fetchStats, refreshKey]);

  // Fetch coupons list
  const fetchCoupons = React.useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      // Status resolution (Tabs take priority if not ALL, otherwise status filter)
      let resolvedStatus = activeTab !== 'ALL' ? activeTab : statusFilter;
      if (resolvedStatus === 'ALL') resolvedStatus = undefined;

      const params = {
        page,
        limit,
        search: debouncedSearch.trim() || undefined,
        status: resolvedStatus,
        planId: planFilter || undefined,
        startDate: startDateFilter || undefined,
        endDate: endDateFilter || undefined,
        sortBy,
        sortOrder,
      };

      const result = await loadCoupons(params);
      const rows = Array.isArray(result?.rows) ? result.rows : [];
      setCoupons(rows);
      setPagination({
        page: result?.pagination?.page || page,
        limit: result?.pagination?.limit || limit,
        total: result?.pagination?.total ?? rows.length,
        totalPages: result?.pagination?.totalPages || 1,
      });
    } catch (err) {
      setError(billingError(err) || 'Failed to load coupons. Please try again.');
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, activeTab, statusFilter, planFilter, startDateFilter, endDateFilter, sortBy, sortOrder, refreshKey]);

  React.useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  // Copy code to clipboard
  const handleCopyCode = (code) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Coupon code ${code} copied to clipboard!`);
    setTimeout(() => setCopiedCode(''), 2000);
  };

  // Selection handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(new Set(coupons.map((c) => c.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectRow = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  // Form Open: Create or Edit & Unsaved Changes Tracking
  const initialValuesRef = React.useRef(null);

  const openCreateModal = () => {
    setEditingCoupon(null);
    setForm(initialFormData);
    initialValuesRef.current = JSON.stringify(initialFormData);
    setIsFormOpen(true);
  };

  const openEditModal = (coupon) => {
    const editData = {
      name: coupon.name || '',
      code: coupon.code || '',
      description: coupon.description || '',
      discountType: coupon.discountType || 'PERCENTAGE',
      discountValue: coupon.discountValue ?? coupon.discountPct ?? '',
      maximumDiscountAmount: coupon.maximumDiscountAmount ?? '',
      minimumAmount: coupon.minimumAmount ?? '',
      appliesToAllPlans: coupon.appliesToAllPlans !== false,
      planIds: Array.isArray(coupon.planIds) ? coupon.planIds : [],
      usageLimit: coupon.usageLimit ?? coupon.maxRedemptions ?? 100,
      perCustomerLimit: coupon.perCustomerLimit ?? 1,
      startDate: coupon.startsAt ? new Date(coupon.startsAt).toISOString().split('T')[0] : (coupon.startDate ? String(coupon.startDate).slice(0, 10) : ''),
      endDate: coupon.expiresAt ? new Date(coupon.expiresAt).toISOString().split('T')[0] : (coupon.endDate ? String(coupon.endDate).slice(0, 10) : ''),
      isActive: coupon.isActive !== false,
    };
    setEditingCoupon(coupon);
    setForm(editData);
    initialValuesRef.current = JSON.stringify(editData);
    setIsFormOpen(true);
  };

  const isFormDirty = React.useMemo(() => {
    if (!isFormOpen || !initialValuesRef.current) return false;
    return JSON.stringify(form) !== initialValuesRef.current;
  }, [form, isFormOpen]);

  // Form Submit
  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.error('Coupon display name is required.');
      return;
    }
    if (!form.code.trim()) {
      toast.error('Coupon code is required.');
      return;
    }
    const val = Number(form.discountValue);
    if (!Number.isFinite(val) || val <= 0) {
      toast.error('Discount value must be greater than zero.');
      return;
    }
    if (form.discountType === 'PERCENTAGE' && val > 100) {
      toast.error('Percentage discount cannot exceed 100%.');
      return;
    }
    if (!form.appliesToAllPlans && (!form.planIds || !form.planIds.length)) {
      toast.error('Please select at least one subscription plan or enable Applies to All Plans.');
      return;
    }
    if (form.startDate && form.endDate && new Date(form.startDate) > new Date(form.endDate)) {
      toast.error('Expiry date cannot precede start date.');
      return;
    }

    setFormBusy(true);
    try {
      const payload = {
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        description: form.description.trim() || undefined,
        discountType: form.discountType,
        discountValue: val,
        discountPct: form.discountType === 'PERCENTAGE' ? val : 0,
        maximumDiscountAmount:
          form.discountType === 'PERCENTAGE' && form.maximumDiscountAmount !== ''
            ? Number(form.maximumDiscountAmount)
            : undefined,
        minimumAmount: form.minimumAmount !== '' ? Number(form.minimumAmount) : undefined,
        appliesToAllPlans: Boolean(form.appliesToAllPlans),
        planIds: form.appliesToAllPlans ? [] : form.planIds.map(Number),
        usageLimit: Math.max(1, Number(form.usageLimit) || 100),
        perCustomerLimit: Math.max(1, Number(form.perCustomerLimit) || 1),
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        isActive: Boolean(form.isActive),
      };

      if (editingCoupon) {
        await updateCoupon(editingCoupon.id, payload);
        toast.success(`Coupon ${payload.code} updated successfully.`);
      } else {
        await createCoupon(payload);
        toast.success(`Coupon ${payload.code} created successfully.`);
      }

      initialValuesRef.current = null;
      setIsFormOpen(false);
      setEditingCoupon(null);
      setForm(initialFormData);
      setRefreshKey((k) => k + 1);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(billingError(err) || 'Failed to save coupon. Please verify all fields.');
    } finally {
      setFormBusy(false);
    }
  };

  // Toggle active/inactive
  const handleToggleStatus = async (coupon) => {
    try {
      const newStatus = !coupon.isActive;
      await setCouponStatus(coupon.id, newStatus);
      toast.success(`Coupon ${coupon.code} is now ${newStatus ? 'Active' : 'Inactive'}.`);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(billingError(err) || 'Failed to update status.');
    }
  };

  // Delete coupon
  const handleDeleteConfirm = async () => {
    if (!deletingCoupon) return;
    setDeleteBusy(true);
    try {
      await deleteCoupon(deletingCoupon.id);
      toast.success(`Coupon ${deletingCoupon.code} has been deleted.`);
      setDeletingCoupon(null);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(billingError(err) || 'Failed to delete coupon.');
    } finally {
      setDeleteBusy(false);
    }
  };

  // View details
  const handleOpenView = async (coupon) => {
    setViewCoupon(coupon);
    setViewDetailsLoading(true);
    try {
      const details = await getCoupon(coupon.id);
      if (details) setViewCoupon(details);
    } catch {
      // Keep basic data
    } finally {
      setViewDetailsLoading(false);
    }
  };

  // Export CSV
  const handleExportCsv = (selectedOnly = false) => {
    const listToExport = selectedOnly
      ? coupons.filter((c) => selectedIds.has(c.id))
      : coupons;

    if (!listToExport.length) {
      toast.error('No coupons to export.');
      return;
    }

    const headers = [
      'Coupon Code',
      'Name',
      'Discount Type',
      'Discount Value',
      'Applicable Plans',
      'Used Count',
      'Usage Limit',
      'Per Customer Limit',
      'Status',
      'Start Date',
      'Expiry Date',
      'Created At',
    ];

    const csvEscape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

    const rows = listToExport.map((c) => [
      c.code,
      c.name,
      c.discountType,
      c.discountType === 'FIXED' ? `₹${c.discountValue}` : `${c.discountValue}%`,
      c.appliesToAllPlans ? 'All Plans' : (c.planNames || []).join(', '),
      c.usedCount ?? 0,
      c.usageLimit ?? 100,
      c.perCustomerLimit ?? 1,
      c.status,
      formatDate(c.startsAt),
      c.expiresAt ? formatDate(c.expiresAt) : 'Never',
      formatDate(c.createdAt),
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\ufeff' +
      [headers.map(csvEscape).join(','), ...rows.map((r) => r.map(csvEscape).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `coupons_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${listToExport.length} coupon(s) to CSV.`);
  };

  // Date preset handler
  const handleDatePresetChange = (preset) => {
    setDateFilterPreset(preset);
    const now = new Date();
    if (preset === 'ALL') {
      setStartDateFilter('');
      setEndDateFilter('');
    } else if (preset === 'THIS_MONTH') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      setStartDateFilter(firstDay);
      setEndDateFilter(lastDay);
    } else if (preset === 'EXPIRING_30') {
      setStartDateFilter(now.toISOString().split('T')[0]);
      const next30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      setEndDateFilter(next30);
    }
    setPage(1);
  };

  return (
    <div className="min-w-0 w-full max-w-full space-y-6 pb-12">
      {/* ── Page Header ────────────────────────────────────────────── */}
      <PageHeader
        category="CUSTOMER SUCCESS"
        title="Coupons"
        icon={faTags}
        description="Create, manage, and track subscription discount coupons for your customers."
        actions={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleExportCsv(false)}
              disabled={loading || !coupons.length}
              className="border-slate-200 text-slate-700 hover:bg-slate-50 transition-all font-medium text-sm rounded-xl"
            >
              <FontAwesomeIcon icon={faDownload} className="mr-2 text-xs" />
              Export CSV
            </Button>
            <Button
              type="button"
              onClick={openCreateModal}
              className="bg-[#16A34A] hover:bg-[#15803D] text-white shadow-sm transition-all font-semibold text-sm rounded-xl"
            >
              <FontAwesomeIcon icon={faPlus} className="mr-2 text-xs" />
              Create Coupon
            </Button>
          </div>
        }
      />

      {/* ── Statistics Cards Grid (4 KPI Cards) ────────────────────── */}
      {statsError && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <span>{statsError}</span>
          <Button type="button" variant="outline" size="sm" onClick={fetchStats} className="border-rose-200 text-rose-700 hover:bg-rose-100">
            Retry statistics
          </Button>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Coupons */}
        <div className="relative overflow-hidden rounded-2xl border border-[#E2E8E5] bg-white p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Coupons
            </span>
            <div className="flex size-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <FontAwesomeIcon icon={faTicket} className="text-sm" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-slate-900">
              {statsLoading ? '—' : stats.total}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">All configured promotional & discount codes</p>
        </div>

        {/* Active Coupons */}
        <div className="relative overflow-hidden rounded-2xl border border-[#E2E8E5] bg-white p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              Active
            </span>
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <FontAwesomeIcon icon={faCheckCircle} className="text-sm" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-emerald-600">
              {statsLoading ? '—' : stats.active}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Currently valid & redeemable by customers</p>
        </div>

        {/* Inactive Coupons */}
        <div className="relative overflow-hidden rounded-2xl border border-[#E2E8E5] bg-white p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Inactive
            </span>
            <div className="flex size-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
              <FontAwesomeIcon icon={faBan} className="text-sm" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-slate-700">
              {statsLoading ? '—' : stats.inactive}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Disabled and not expired</p>
        </div>

        {/* Total Redemptions */}
        <div className="relative overflow-hidden rounded-2xl border border-[#E2E8E5] bg-white p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
              Used
            </span>
            <div className="flex size-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
              <FontAwesomeIcon icon={faReceipt} className="text-sm" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-teal-700">
              {statsLoading ? '—' : stats.used}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Total redemptions applied to subscriptions</p>
        </div>
      </div>

      {/* ── Status Tabs ────────────────────────────────────────────── */}
      <div className="flex border-b border-slate-200 gap-6 overflow-x-auto">
        {[
          { key: 'ALL', label: 'All Coupons', count: stats.total },
          { key: 'ACTIVE', label: 'Active', count: stats.active },
          { key: 'INACTIVE', label: 'Inactive', count: stats.inactive },
        ].map((tab) => {
          const isSelected = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setActiveTab(tab.key);
                setPage(1);
              }}
              className={`flex items-center gap-2 pb-3.5 pt-1 text-sm font-semibold transition-all border-b-2 whitespace-nowrap ${
                isSelected
                  ? 'border-[#16A34A] text-[#16A34A]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                  isSelected ? 'bg-emerald-100 text-[#16A34A]' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Search & Filter Toolbar ─────────────────────────────────── */}
      <div className="flex flex-col gap-3 rounded-2xl border border-[#E2E8E5] bg-white p-3.5 sm:p-4 shadow-xs">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Search Input */}
          <div className="relative min-w-0 flex-1">
            <FontAwesomeIcon
              icon={faSearch}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"
            />
            <Input
              type="text"
              placeholder="Search by coupon code, name, or plan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 pl-9 pr-8 text-sm rounded-xl border-slate-200 focus-visible:ring-1 focus-visible:ring-emerald-500"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <FontAwesomeIcon icon={faXmark} className="text-xs" />
              </button>
            )}
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            {/* Plan Filter */}
            <select
              value={planFilter}
              onChange={(e) => {
                setPlanFilter(e.target.value);
                setPage(1);
              }}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs sm:text-sm font-medium text-slate-700 shadow-2xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">All Subscription Plans</option>
              {availablePlans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            {/* Status Filter (when on All Coupons tab) */}
            {activeTab === 'ALL' && (
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs sm:text-sm font-medium text-slate-700 shadow-2xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="EXPIRED">Expired</option>
              </select>
            )}

            {/* Date Range Preset */}
            <select
              value={dateFilterPreset}
              onChange={(e) => handleDatePresetChange(e.target.value)}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs sm:text-sm font-medium text-slate-700 shadow-2xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="ALL">All Dates</option>
              <option value="THIS_MONTH">This Month</option>
              <option value="EXPIRING_30">Expiring in 30 Days</option>
            </select>

            {/* Columns Visibility Dropdown */}
            <div className="relative">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowColPicker(!showColPicker)}
                className="h-10 border-slate-200 rounded-xl px-3 text-slate-700 hover:bg-slate-50 text-xs sm:text-sm font-medium"
              >
                <FontAwesomeIcon icon={faSliders} className="mr-1.5 text-xs text-slate-500" />
                Columns
              </Button>

              {showColPicker && (
                <div className="absolute right-0 top-12 z-20 w-48 rounded-xl border border-slate-200 bg-white p-2.5 shadow-lg text-xs space-y-1.5 animate-in fade-in zoom-in-95">
                  <div className="font-bold text-slate-800 pb-1 border-b border-slate-100">
                    Visible Columns
                  </div>
                  {Object.entries({
                    code: 'Coupon Code',
                    name: 'Name',
                    discount: 'Discount',
                    plan: 'Applicable Plan',
                    usage: 'Usage Limit',
                    status: 'Status',
                    validity: 'Validity Date',
                    actions: 'Actions',
                  }).map(([key, label]) => (
                    <label
                      key={key}
                      className="flex items-center gap-2 cursor-pointer p-1 rounded hover:bg-slate-50 text-slate-700"
                    >
                      <input
                        type="checkbox"
                        checked={columns[key]}
                        onChange={(e) =>
                          setColumns((prev) => ({ ...prev, [key]: e.target.checked }))
                        }
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Refresh Button */}
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => {
                setRefreshKey((k) => k + 1);
                fetchStats();
              }}
              disabled={loading}
              title="Refresh Coupons"
              className="h-10 w-10 border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50"
            >
              <FontAwesomeIcon icon={faRotate} className={loading ? 'animate-spin' : ''} />
            </Button>
          </div>
        </div>

        {/* Bulk Actions Banner (When items are selected) */}
        {selectedIds.size > 0 && (
          <div className="flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-xs sm:text-sm text-emerald-900 animate-in fade-in">
            <span className="font-semibold">
              {selectedIds.size} coupon{selectedIds.size === 1 ? '' : 's'} selected
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => handleExportCsv(true)}
                className="bg-white border-emerald-300 text-emerald-800 hover:bg-emerald-100/60 h-8 text-xs font-semibold rounded-lg"
              >
                <FontAwesomeIcon icon={faDownload} className="mr-1.5" />
                Export Selected
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setSelectedIds(new Set())}
                className="text-slate-600 hover:text-slate-900 h-8 text-xs font-medium"
              >
                Deselect All
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── Coupons Table Container ─────────────────────────────────── */}
      <div className="rounded-2xl border border-[#E2E8E5] bg-white shadow-xs overflow-hidden">
        {error ? (
          <div role="alert" className="p-8 text-center text-sm text-rose-700 space-y-3">
            <p className="font-medium">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRefreshKey((k) => k + 1)}
              className="border-rose-200 text-rose-700 hover:bg-rose-50"
            >
              Retry Loading
            </Button>
          </div>
        ) : loading && !coupons.length ? (
          <div className="p-12 text-center text-sm text-slate-500 space-y-3">
            <div className="inline-flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-[#16A34A] animate-spin">
              <FontAwesomeIcon icon={faRotate} />
            </div>
            <p className="font-medium">Loading coupons data...</p>
          </div>
        ) : coupons.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-emerald-50 text-[#16A34A] border border-emerald-100">
              <FontAwesomeIcon icon={faTicket} className="text-xl" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">No coupons found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {debouncedSearch || planFilter || statusFilter !== 'ALL' || activeTab !== 'ALL'
                  ? 'No coupons match the current search criteria or status filters.'
                  : 'Get started by creating your first promotional coupon for subscription discounts.'}
              </p>
            </div>
            {debouncedSearch || planFilter || statusFilter !== 'ALL' || activeTab !== 'ALL' ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearch('');
                  setPlanFilter('');
                  setStatusFilter('ALL');
                  setActiveTab('ALL');
                  setDateFilterPreset('ALL');
                  setStartDateFilter('');
                  setEndDateFilter('');
                }}
                className="border-slate-200 text-slate-700"
              >
                Clear Filters
              </Button>
            ) : (
              <Button
                onClick={openCreateModal}
                className="bg-[#16A34A] hover:bg-[#15803D] text-white rounded-xl shadow-xs"
              >
                <FontAwesomeIcon icon={faPlus} className="mr-2" />
                Create Coupon
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-xs font-semibold text-slate-600">
                  {columns.checkbox && (
                    <th className="py-3.5 pl-4 pr-2 w-10">
                      <input
                        type="checkbox"
                        checked={
                          coupons.length > 0 && coupons.every((c) => selectedIds.has(c.id))
                        }
                        onChange={handleSelectAll}
                        aria-label="Select all coupons"
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                    </th>
                  )}
                  {columns.code && (
                    <th className="py-3.5 px-3 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => {
                          setSortBy('code');
                          setSortOrder(sortBy === 'code' && sortOrder === 'asc' ? 'desc' : 'asc');
                        }}
                        className="inline-flex items-center gap-1 font-semibold hover:text-slate-900"
                      >
                        <span>COUPON CODE</span>
                        {sortBy === 'code' && (
                          <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </button>
                    </th>
                  )}
                  {columns.name && <th className="py-3.5 px-3 whitespace-nowrap">NAME</th>}
                  {columns.discount && (
                    <th className="py-3.5 px-3 whitespace-nowrap">DISCOUNT</th>
                  )}
                  {columns.plan && <th className="py-3.5 px-3 whitespace-nowrap">PLAN</th>}
                  {columns.usage && (
                    <th className="py-3.5 px-3 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => {
                          setSortBy('timesRedeemed');
                          setSortOrder(
                            sortBy === 'timesRedeemed' && sortOrder === 'asc' ? 'desc' : 'asc'
                          );
                        }}
                        className="inline-flex items-center gap-1 font-semibold hover:text-slate-900"
                      >
                        <span>USAGE</span>
                        {sortBy === 'timesRedeemed' && (
                          <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </button>
                    </th>
                  )}
                  {columns.status && <th className="py-3.5 px-3 whitespace-nowrap">STATUS</th>}
                  {columns.validity && (
                    <th className="py-3.5 px-3 whitespace-nowrap">VALIDITY</th>
                  )}
                  {columns.actions && (
                    <th className="py-3.5 px-4 text-right whitespace-nowrap">ACTIONS</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {coupons.map((coupon) => {
                  const isChecked = selectedIds.has(coupon.id);
                  const isPercentage = coupon.discountType === 'PERCENTAGE';
                  const usagePct = Math.min(
                    100,
                    Math.round(((coupon.usedCount || 0) / (coupon.usageLimit || 1)) * 100)
                  );

                  return (
                    <tr
                      key={coupon.id}
                      className={`transition-colors hover:bg-slate-50/70 ${
                        isChecked ? 'bg-emerald-50/30' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      {columns.checkbox && (
                        <td className="py-3.5 pl-4 pr-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleSelectRow(coupon.id)}
                            aria-label={`Select coupon ${coupon.code}`}
                            className="rounded text-emerald-600 focus:ring-emerald-500"
                          />
                        </td>
                      )}

                      {/* Coupon Code */}
                      {columns.code && (
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-900 bg-slate-100 border border-slate-200/90 px-2.5 py-1 rounded-md text-xs tracking-wider">
                              {coupon.code}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyCode(coupon.code)}
                              title="Copy code"
                              className="text-slate-400 hover:text-slate-600 transition-colors p-1"
                            >
                              <FontAwesomeIcon
                                icon={copiedCode === coupon.code ? faCheck : faCopy}
                                className={`text-xs ${
                                  copiedCode === coupon.code ? 'text-emerald-600' : ''
                                }`}
                              />
                            </button>
                          </div>
                        </td>
                      )}

                      {/* Name & Subtitle */}
                      {columns.name && (
                        <td className="py-3.5 px-3 max-w-[220px]">
                          <div className="font-semibold text-slate-900 truncate">
                            {coupon.name}
                          </div>
                          {coupon.description && (
                            <div className="text-xs text-slate-500 truncate" title={coupon.description}>
                              {coupon.description}
                            </div>
                          )}
                        </td>
                      )}

                      {/* Discount Badge */}
                      {columns.discount && (
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-[#16A34A] border border-emerald-100">
                            <FontAwesomeIcon
                              icon={isPercentage ? faPercent : faIndianRupeeSign}
                              className="text-[10px]"
                            />
                            <span>
                              {isPercentage
                                ? `${coupon.discountValue}% OFF`
                                : `₹${coupon.discountValue} OFF`}
                            </span>
                          </div>
                          {coupon.minimumAmount && (
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              Min: ₹{coupon.minimumAmount}
                            </div>
                          )}
                        </td>
                      )}

                      {/* Applicable Plan */}
                      {columns.plan && (
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          {coupon.appliesToAllPlans ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 border border-blue-100">
                              <FontAwesomeIcon icon={faBoxesStacked} className="text-[10px]" />
                              All Plans
                            </span>
                          ) : coupon.planNames && coupon.planNames.length > 0 ? (
                            <div className="flex flex-wrap gap-1 max-w-[180px]">
                              {coupon.planNames.slice(0, 2).map((pName, i) => (
                                <span
                                  key={i}
                                  className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 truncate max-w-[120px]"
                                >
                                  {pName}
                                </span>
                              ))}
                              {coupon.planNames.length > 2 && (
                                <span className="inline-block rounded-md bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">
                                  +{coupon.planNames.length - 2}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">Custom selection</span>
                          )}
                        </td>
                      )}

                      {/* Usage Progress */}
                      {columns.usage && (
                        <td className="py-3.5 px-3 whitespace-nowrap min-w-[130px]">
                          <div className="flex items-center justify-between text-xs font-semibold mb-1">
                            <span className="text-slate-800">
                              {coupon.usedCount || 0} / {coupon.usageLimit || 100}
                            </span>
                            <span className="text-slate-400 text-[11px]">
                              {coupon.remainingUsage} left
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                usagePct >= 90
                                  ? 'bg-rose-500'
                                  : usagePct >= 60
                                  ? 'bg-amber-500'
                                  : 'bg-[#16A34A]'
                              }`}
                              style={{ width: `${usagePct}%` }}
                            />
                          </div>
                        </td>
                      )}

                      {/* Status */}
                      {columns.status && (
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          {coupon.status === 'ACTIVE' ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Active
                            </span>
                          ) : coupon.status === 'EXPIRED' ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700 border border-rose-200">
                              <span className="size-1.5 rounded-full bg-rose-400" />
                              Expired
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 border border-slate-200">
                              <span className="size-1.5 rounded-full bg-slate-400" />
                              Inactive
                            </span>
                          )}
                        </td>
                      )}

                      {/* Validity */}
                      {columns.validity && (
                        <td className="py-3.5 px-3 whitespace-nowrap text-xs text-slate-600">
                          <div>
                            <span className="text-slate-400">From: </span>
                            <span className="font-medium text-slate-800">
                              {coupon.startsAt ? formatDate(coupon.startsAt) : 'Immediate'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400">Until: </span>
                            <span className="font-medium text-slate-800">
                              {coupon.expiresAt ? formatDate(coupon.expiresAt) : 'Never'}
                            </span>
                          </div>
                        </td>
                      )}

                      {/* Actions */}
                      {columns.actions && (
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            {/* View */}
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenView(coupon)}
                              title="View details & redemptions"
                              className="size-8 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
                            >
                              <FontAwesomeIcon icon={faEye} className="text-xs" />
                            </Button>

                            {/* Edit */}
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditModal(coupon)}
                              title="Edit coupon"
                              className="size-8 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
                            >
                              <FontAwesomeIcon icon={faPenToSquare} className="text-xs" />
                            </Button>

                            {/* Activate / Deactivate Toggle */}
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleToggleStatus(coupon)}
                              title={coupon.isActive ? 'Deactivate coupon' : 'Activate coupon'}
                              className={`size-8 rounded-lg ${
                                coupon.isActive
                                  ? 'text-emerald-600 hover:bg-emerald-50'
                                  : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
                              }`}
                            >
                              <FontAwesomeIcon icon={faPowerOff} className="text-xs" />
                            </Button>

                            {/* Delete */}
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeletingCoupon(coupon)}
                              title="Delete coupon"
                              className="size-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                            >
                              <FontAwesomeIcon icon={faTrashCan} className="text-xs" />
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Table Footer & Pagination ─────────────────────────────── */}
        {!error && coupons.length > 0 && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-slate-200 px-4 py-3 text-xs sm:text-sm text-slate-600 bg-slate-50/50">
            {/* Range info */}
            <div>
              Showing{' '}
              <span className="font-semibold text-slate-900">
                {(pagination.page - 1) * pagination.limit + 1}
              </span>{' '}
              to{' '}
              <span className="font-semibold text-slate-900">
                {Math.min(pagination.page * pagination.limit, pagination.total)}
              </span>{' '}
              of <span className="font-semibold text-slate-900">{pagination.total}</span> coupons
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-3">
              {/* Rows Per Page */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500">Rows:</span>
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                  className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              {/* Prev / Next buttons */}
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={pagination.page <= 1 || loading}
                  className="h-8 w-8 p-0 rounded-lg border-slate-200 text-slate-600"
                >
                  <FontAwesomeIcon icon={faChevronLeft} className="text-xs" />
                </Button>
                <span className="px-2 font-medium text-xs text-slate-700">
                  {pagination.page} / {pagination.totalPages}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={pagination.page >= pagination.totalPages || loading}
                  className="h-8 w-8 p-0 rounded-lg border-slate-200 text-slate-600"
                >
                  <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Create / Edit Coupon Right-Side Slide-Over Drawer ────── */}
      <SlideOverDrawer
        open={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingCoupon(null);
          setForm(initialFormData);
          initialValuesRef.current = null;
        }}
        title={editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
        subtitle="Configure promotional discount code and plan eligibility"
        icon={
          <FontAwesomeIcon
            icon={editingCoupon ? faPenToSquare : faPlus}
            className="text-base text-[#16A34A]"
          />
        }
        iconBg="bg-emerald-50 border-emerald-100"
        iconColor="text-[#16A34A]"
        isDirty={isFormDirty}
        discardTitle="Discard Unsaved Changes?"
        discardDescription="You have unsaved changes in this coupon configuration. If you close now, your changes will be lost."
        confirmLabel="Discard Changes"
        cancelLabel="Keep Editing"
        loading={formBusy}
        widthClass="w-full md:w-[80vw] md:max-w-[750px] lg:w-[720px] lg:max-w-[750px]"
        footer={({ attemptClose, loading: isSubmitting }) => (
          <>
            <Button
              type="button"
              variant="outline"
              onClick={attemptClose}
              disabled={isSubmitting}
              className="border-slate-200 rounded-xl px-4 text-xs font-semibold text-slate-700 hover:bg-slate-100 h-10 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="coupon-slideover-form"
              disabled={isSubmitting}
              className="bg-[#16A34A] hover:bg-[#15803D] text-white rounded-xl font-semibold shadow-xs h-10 px-5 text-xs transition-colors cursor-pointer"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faRotate} className="animate-spin text-xs" />
                  Saving...
                </span>
              ) : editingCoupon ? (
                'Save Changes'
              ) : (
                'Create Coupon'
              )}
            </Button>
          </>
        )}
      >
        <form id="coupon-slideover-form" onSubmit={handleFormSubmit} className="space-y-5">
          {/* ── Section 1: Coupon Information ── */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <span className="flex size-6 items-center justify-center rounded-lg bg-emerald-50 text-[#16A34A] text-xs font-bold">
                1
              </span>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Coupon Information
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                  <span>
                    Coupon Code <span className="text-rose-500">*</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">Alphanumeric</span>
                </label>
                <Input
                  required
                  placeholder="e.g. SUMMER20"
                  value={form.code}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      code: e.target.value.toUpperCase().replace(/\s+/g, ''),
                    }))
                  }
                  className="h-10 font-mono uppercase font-bold tracking-wider rounded-xl border-slate-200 focus-visible:ring-emerald-500 focus-visible:border-emerald-500 text-sm"
                />
                <p className="text-[11px] text-slate-400">
                  Unique promotional code entered by customers at checkout.
                </p>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Display Name <span className="text-rose-500">*</span>
                </label>
                <Input
                  required
                  placeholder="e.g. Summer Special 20%"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="h-10 rounded-xl border-slate-200 focus-visible:ring-emerald-500 focus-visible:border-emerald-500 text-sm"
                />
                <p className="text-[11px] text-slate-400">
                  Internal marketing title shown across coupons table and invoices.
                </p>
              </div>
            </div>
          </div>

          {/* ── Section 2: Discount Configuration ── */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <span className="flex size-6 items-center justify-center rounded-lg bg-emerald-50 text-[#16A34A] text-xs font-bold">
                2
              </span>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Discount Configuration
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Discount Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, discountType: 'PERCENTAGE' }))}
                    className={cn(
                      'h-10 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 cursor-pointer select-none',
                      form.discountType === 'PERCENTAGE'
                        ? 'bg-[#EAF7EF] border-[#16A34A] text-[#173D30] shadow-2xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    )}
                  >
                    <FontAwesomeIcon icon={faPercent} className="text-xs text-emerald-600" />
                    Percentage (%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, discountType: 'FIXED' }))}
                    className={cn(
                      'h-10 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 cursor-pointer select-none',
                      form.discountType === 'FIXED'
                        ? 'bg-[#EAF7EF] border-[#16A34A] text-[#173D30] shadow-2xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    )}
                  >
                    <FontAwesomeIcon icon={faIndianRupeeSign} className="text-xs text-emerald-600" />
                    Fixed Amount (₹)
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Discount Value <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Input
                    type="number"
                    min="1"
                    max={form.discountType === 'PERCENTAGE' ? '100' : '999999'}
                    required
                    placeholder={form.discountType === 'PERCENTAGE' ? 'e.g. 20' : 'e.g. 500'}
                    value={form.discountValue}
                    onChange={(e) => setForm((prev) => ({ ...prev, discountValue: e.target.value }))}
                    className="h-10 rounded-xl border-slate-200 pr-9 font-semibold text-sm"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    {form.discountType === 'PERCENTAGE' ? '%' : '₹'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  {form.discountType === 'PERCENTAGE'
                    ? 'Enter percentage value between 1% and 100%.'
                    : 'Enter rupee deduction applied directly to invoice.'}
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Maximum Discount Cap (₹)
                </label>
                <Input
                  type="number"
                  min="0"
                  placeholder={form.discountType === 'PERCENTAGE' ? 'Optional, e.g. 1000' : 'N/A for fixed amount'}
                  disabled={form.discountType === 'FIXED'}
                  value={form.discountType === 'FIXED' ? '' : form.maximumDiscountAmount}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, maximumDiscountAmount: e.target.value }))
                  }
                  className="h-10 rounded-xl border-slate-200 text-sm disabled:bg-slate-50 disabled:text-slate-400"
                />
                <p className="text-[11px] text-slate-400">
                  Upper rupee ceiling for percentage discounts (optional).
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Minimum Package Amount (₹)
                </label>
                <Input
                  type="number"
                  min="0"
                  placeholder="Optional, e.g. 1999"
                  value={form.minimumAmount}
                  onChange={(e) => setForm((prev) => ({ ...prev, minimumAmount: e.target.value }))}
                  className="h-10 rounded-xl border-slate-200 text-sm"
                />
                <p className="text-[11px] text-slate-400">
                  Minimum subscription amount required before discount applies.
                </p>
              </div>
            </div>
          </div>

          {/* ── Section 3: Plan Eligibility ── */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <span className="flex size-6 items-center justify-center rounded-lg bg-emerald-50 text-[#16A34A] text-xs font-bold">
                3
              </span>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Plan Eligibility
              </h3>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-slate-50/70 border border-slate-200 p-3.5">
              <div>
                <span className="text-xs font-bold text-slate-800">
                  Applies to all subscription plans
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Toggle off to restrict this discount coupon to specific subscription plans.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-3">
                <input
                  type="checkbox"
                  checked={form.appliesToAllPlans}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, appliesToAllPlans: e.target.checked }))
                  }
                  className="sr-only peer"
                />
                <div className="w-10 h-5.5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-[#16A34A]" />
              </label>
            </div>

            {!form.appliesToAllPlans && (
              <div className="pt-2 space-y-2 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">
                    Select Eligible Plans <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {form.planIds.length} of {availablePlans.length} selected
                  </span>
                </div>

                {availablePlans.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3 text-center">
                    Loading subscription plans...
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto p-1.5 bg-slate-50/50 rounded-xl border border-slate-200">
                    {availablePlans.map((plan) => {
                      const isSelected = form.planIds.includes(plan.id);
                      return (
                        <label
                          key={plan.id}
                          className={cn(
                            'flex items-center gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition-all',
                            isSelected
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-semibold shadow-2xs'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              const next = e.target.checked
                                ? [...form.planIds, plan.id]
                                : form.planIds.filter((id) => id !== plan.id);
                              setForm((prev) => ({ ...prev, planIds: next }));
                            }}
                            className="size-4 rounded border-slate-300 text-[#16A34A] focus:ring-emerald-500 cursor-pointer"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-slate-800 truncate">{plan.name}</div>
                            <div className="text-[10px] text-slate-500 truncate">
                              {plan.code ? `${plan.code} • ` : ''}
                              {plan.monthlyPrice ? `₹${Number(plan.monthlyPrice).toLocaleString()}/mo` : ''}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
                {!form.appliesToAllPlans && form.planIds.length === 0 && (
                  <p className="text-[11px] text-rose-500 font-medium">
                    Please select at least one eligible plan.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* ── Section 4: Redemption Limits ── */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <span className="flex size-6 items-center justify-center rounded-lg bg-emerald-50 text-[#16A34A] text-xs font-bold">
                4
              </span>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Redemption Limits
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Total Redemption Limit <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="number"
                  min="1"
                  required
                  placeholder="e.g. 100"
                  value={form.usageLimit}
                  onChange={(e) => setForm((prev) => ({ ...prev, usageLimit: e.target.value }))}
                  className="h-10 rounded-xl border-slate-200 text-sm"
                />
                <p className="text-[11px] text-slate-400">
                  Maximum total redemptions permitted across all customer checkouts.
                </p>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Per Customer Limit <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="number"
                  min="1"
                  required
                  placeholder="e.g. 1"
                  value={form.perCustomerLimit}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, perCustomerLimit: e.target.value }))
                  }
                  className="h-10 rounded-xl border-slate-200 text-sm"
                />
                <p className="text-[11px] text-slate-400">
                  Maximum redemptions allowed per tenant customer account.
                </p>
              </div>
            </div>
          </div>

          {/* ── Section 5: Validity ── */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <span className="flex size-6 items-center justify-center rounded-lg bg-emerald-50 text-[#16A34A] text-xs font-bold">
                5
              </span>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Validity & Schedule
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Start Date</label>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))}
                  className="h-10 rounded-xl border-slate-200 text-sm"
                />
                <p className="text-[11px] text-slate-400">
                  Coupon becomes redeemable starting from this date (optional).
                </p>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Expiry Date</label>
                <Input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))}
                  className="h-10 rounded-xl border-slate-200 text-sm"
                />
                <p className="text-[11px] text-slate-400">
                  Coupon ceases to be valid after 23:59 on this date (optional).
                </p>
              </div>
            </div>
          </div>

          {/* ── Section 6: Additional Information ── */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <span className="flex size-6 items-center justify-center rounded-lg bg-emerald-50 text-[#16A34A] text-xs font-bold">
                6
              </span>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Additional Information
              </h3>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Description / Internal Notes
                </label>
                <Textarea
                  rows={3}
                  placeholder="Optional internal notes, campaign promotion details, or special terms..."
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  className="rounded-xl border-slate-200 text-sm resize-none"
                />
              </div>

              <div className="flex items-center justify-between rounded-xl bg-slate-50/70 border border-slate-200 p-3.5">
                <div>
                  <span className="text-xs font-bold text-slate-800">Coupon Active Status</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    When active, customers can enter and redeem this code during checkout.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-3">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5.5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-[#16A34A]" />
                </label>
              </div>
            </div>
          </div>
        </form>
      </SlideOverDrawer>

      {/* ── View Details Modal ─────────────────────────────────────── */}
      {viewCoupon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-8">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-[#16A34A] border border-emerald-100">
                  <FontAwesomeIcon icon={faTicket} className="text-base" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-extrabold text-slate-900 font-mono">
                      {viewCoupon.code}
                    </h2>
                    {viewCoupon.status === 'ACTIVE' ? (
                      <span className="rounded-full bg-emerald-100 text-[#16A34A] px-2 py-0.5 text-[11px] font-bold">
                        Active
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-100 text-slate-600 px-2 py-0.5 text-[11px] font-bold">
                        {viewCoupon.status}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">{viewCoupon.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewCoupon(null)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1"
              >
                <FontAwesomeIcon icon={faXmark} className="text-base" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Configuration Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Discount
                  </span>
                  <div className="mt-1 text-base font-bold text-emerald-600">
                    {viewCoupon.discountType === 'FIXED'
                      ? `₹${viewCoupon.discountValue}`
                      : `${viewCoupon.discountValue}%`}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Redemptions
                  </span>
                  <div className="mt-1 text-base font-bold text-slate-800">
                    {viewCoupon.usedCount || 0} / {viewCoupon.usageLimit || 100}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Per Customer
                  </span>
                  <div className="mt-1 text-base font-bold text-slate-800">
                    Max {viewCoupon.perCustomerLimit || 1}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Applicable
                  </span>
                  <div className="mt-1 text-xs font-bold text-slate-800 truncate">
                    {viewCoupon.appliesToAllPlans
                      ? 'All Plans'
                      : (viewCoupon.planNames || []).join(', ') || 'Selected Plans'}
                  </div>
                </div>
              </div>

              {/* Description */}
              {viewCoupon.description && (
                <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-100 text-xs text-slate-600 leading-relaxed">
                  <span className="font-bold text-slate-800">Note: </span>
                  {viewCoupon.description}
                </div>
              )}

              {/* Validity timeline */}
              <div className="rounded-xl border border-slate-200 p-3.5 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-slate-400">Starts: </span>
                  <span className="font-semibold text-slate-800">
                    {viewCoupon.startsAt ? formatDate(viewCoupon.startsAt) : 'Immediate'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Expires: </span>
                  <span className="font-semibold text-slate-800">
                    {viewCoupon.expiresAt ? formatDate(viewCoupon.expiresAt) : 'Never (No Expiration)'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Created: </span>
                  <span className="font-semibold text-slate-800">
                    {formatDate(viewCoupon.createdAt)}
                  </span>
                </div>
              </div>

              {/* Redemptions List */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                  <span>Customer Redemption History</span>
                  <span className="text-slate-400 font-normal">
                    {viewCoupon.redemptions?.length || 0} recorded
                  </span>
                </h4>

                {viewDetailsLoading ? (
                  <div className="p-4 text-center text-xs text-slate-400 animate-pulse">
                    Loading redemption records...
                  </div>
                ) : !viewCoupon.redemptions || !viewCoupon.redemptions.length ? (
                  <div className="p-6 text-center text-xs text-slate-400 rounded-xl bg-slate-50 border border-slate-100">
                    No customers have redeemed this coupon yet.
                  </div>
                ) : (
                  <div className="rounded-xl border border-slate-200 overflow-hidden text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                        <tr>
                          <th className="p-2.5">Customer</th>
                          <th className="p-2.5">Package</th>
                          <th className="p-2.5">Discount Saved</th>
                          <th className="p-2.5">Final Paid</th>
                          <th className="p-2.5">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {viewCoupon.redemptions.map((r) => (
                          <tr key={r.id} className="hover:bg-slate-50">
                            <td className="p-2.5 font-medium text-slate-900">
                              {r.customerName || `Customer #${r.customerId}`}
                              {r.customerEmail && (
                                <div className="text-[10px] text-slate-400">{r.customerEmail}</div>
                              )}
                            </td>
                            <td className="p-2.5 text-slate-700">{r.planName}</td>
                            <td className="p-2.5 text-emerald-600 font-semibold">
                              {formatMoney(r.discountAmount)}
                            </td>
                            <td className="p-2.5 font-medium text-slate-900">
                              {formatMoney(r.finalAmount)}
                            </td>
                            <td className="p-2.5 text-slate-500">{formatDate(r.redeemedAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 px-6 py-3.5 bg-slate-50/50 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const c = viewCoupon;
                  setViewCoupon(null);
                  openEditModal(c);
                }}
                className="border-slate-200 rounded-xl"
              >
                <FontAwesomeIcon icon={faPenToSquare} className="mr-1.5" />
                Edit Coupon
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => setViewCoupon(null)}
                className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Dialog ─────────────────────────────── */}
      <ConfirmDialog
        open={Boolean(deletingCoupon)}
        onOpenChange={(open) => !open && setDeletingCoupon(null)}
        title={`Delete Coupon ${deletingCoupon?.code || ''}?`}
        description={`Are you sure you want to delete "${deletingCoupon?.name || ''}"? The coupon will be deactivated and archived. Customers will no longer be able to apply it, while past subscription redemptions remain preserved.`}
        confirmLabel={deleteBusy ? 'Deleting...' : 'Delete Coupon'}
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
