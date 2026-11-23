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
  CreditCard,
  Download,
  RotateCw,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Trash2,
  Eye,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Building2,
  User,
  Phone,
  Mail,
  ArrowUpDown,
  Layers,
  Receipt,
  Banknote,
  Landmark,
  Copy,
  FileText,
  CheckCheck,
  ExternalLink,
} from 'lucide-react';
import {
  loadOfflineRequests,
  approveOfflineRequest,
  rejectOfflineRequest,
  deleteOfflineRequest,
  bulkDeleteOfflineRequests,
  sessionCan,
  billingError,
} from '@/modules/customer/billing-api';

const STATUS_TABS = [
  { key: 'ALL', label: 'All Requests' },
  { key: 'PENDING', label: 'Pending Review' },
  { key: 'SUCCESS', label: 'Approved' },
  { key: 'REJECTED', label: 'Rejected' },
];

const inr = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
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
    case 'SUCCESS':
    case 'PAID':
    case 'APPROVED':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 border border-emerald-200">
          <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Success
        </span>
      );
    case 'PENDING':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800 border border-amber-200">
          <span className="size-1.5 rounded-full bg-amber-500" />
          Pending
        </span>
      );
    case 'REJECTED':
    case 'FAILED':
    case 'CANCELED':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-800 border border-rose-200">
          <span className="size-1.5 rounded-full bg-rose-500" />
          Rejected
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

const getMethodBadge = (method) => {
  const m = String(method || '').toUpperCase();
  if (m === 'CASH') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#F4F9F6] border border-[#E2E8E5] text-[11px] font-bold text-[#163A2E]">
        <Banknote className="size-3 text-[#107569]" />
        CASH
      </span>
    );
  }
  if (m.includes('BANK') || m.includes('TRANSFER') || m.includes('NEFT') || m.includes('RTGS')) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-[11px] font-bold text-slate-700">
        <Landmark className="size-3 text-slate-600" />
        BANK TRANSFER
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-[11px] font-bold text-slate-600">
      <CreditCard className="size-3 text-slate-500" />
      {method || 'OFFLINE'}
    </span>
  );
};

export function OfflinePaymentsScreen() {
  const [allowed, setAllowed] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [requests, setRequests] = React.useState([]);
  const [summary, setSummary] = React.useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });

  const [activeTab, setActiveTab] = React.useState('ALL');
  const [search, setSearch] = React.useState('');
  const [methodFilter, setMethodFilter] = React.useState('ALL');
  const [sortBy, setSortBy] = React.useState('newest');
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(10);
  const [totalCount, setTotalCount] = React.useState(0);
  const [selectedIds, setSelectedIds] = React.useState([]);

  // Modals & Drawers
  const [detailDrawerOpen, setDetailDrawerOpen] = React.useState(false);
  const [selectedReq, setSelectedReq] = React.useState(null);
  const [approveConfirmOpen, setApproveConfirmOpen] = React.useState(false);
  const [reqToApprove, setReqToApprove] = React.useState(null);
  const [rejectDrawerOpen, setRejectDrawerOpen] = React.useState(false);
  const [reqToReject, setReqToReject] = React.useState(null);
  const [rejectReason, setRejectReason] = React.useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);
  const [reqToDelete, setReqToDelete] = React.useState(null);
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = React.useState(false);
  const [actionLoading, setActionLoading] = React.useState(false);

  React.useEffect(() => {
    setAllowed(
      sessionCan('PAYMENT') ||
      sessionCan('SUBSCRIPTION') ||
      sessionCan('CRM')
    );
  }, []);

  const fetchRequests = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await loadOfflineRequests({
        page,
        limit,
        status: activeTab === 'ALL' ? undefined : activeTab,
        search: search.trim() || undefined,
      });

      let items = res.rows || [];

      // Filter by payment method if chosen
      if (methodFilter !== 'ALL') {
        items = items.filter((r) => {
          const m = String(r.paymentMethodDetail || r.paymentMethod || '').toUpperCase();
          if (methodFilter === 'CASH') return m === 'CASH';
          if (methodFilter === 'BANK_TRANSFER') return m.includes('BANK') || m.includes('TRANSFER');
          return m === methodFilter;
        });
      }

      // Sort items
      if (sortBy === 'newest') {
        items.sort((a, b) => new Date(b.requestDate || b.createdAt || 0) - new Date(a.requestDate || a.createdAt || 0));
      } else if (sortBy === 'oldest') {
        items.sort((a, b) => new Date(a.requestDate || a.createdAt || 0) - new Date(b.requestDate || b.createdAt || 0));
      } else if (sortBy === 'amount_high') {
        items.sort((a, b) => (Number(b.totalAmount) || 0) - (Number(a.totalAmount) || 0));
      } else if (sortBy === 'amount_low') {
        items.sort((a, b) => (Number(a.totalAmount) || 0) - (Number(b.totalAmount) || 0));
      }

      setRequests(items);
      setTotalCount(res.pagination?.total || items.length);

      if (res.summary) {
        setSummary({
          total: res.summary.total ?? items.length,
          pending: res.summary.pending ?? 0,
          approved: res.summary.approved ?? 0,
          rejected: res.summary.rejected ?? 0,
        });
      }
    } catch (err) {
      toast.error(billingError(err) || 'Failed to load offline payment requests');
    } finally {
      setLoading(false);
    }
  }, [page, limit, activeTab, search, methodFilter, sortBy]);

  React.useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Handle Approve
  const handleApprove = async () => {
    if (!reqToApprove?.id) return;
    setActionLoading(true);
    try {
      await approveOfflineRequest(reqToApprove.id);
      toast.success(
        `Offline payment approved for ${reqToApprove.customerName}. Subscription activated.`
      );
      setApproveConfirmOpen(false);
      setReqToApprove(null);
      if (detailDrawerOpen && selectedReq?.id === reqToApprove.id) {
        setSelectedReq((prev) => ({ ...prev, paymentStatus: 'SUCCESS' }));
      }
      fetchRequests();
    } catch (err) {
      toast.error(billingError(err) || 'Failed to approve offline payment');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Reject
  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!reqToReject?.id) return;
    if (!rejectReason.trim()) {
      toast.error('Please enter a rejection reason');
      return;
    }
    setActionLoading(true);
    try {
      await rejectOfflineRequest(reqToReject.id, rejectReason.trim());
      toast.success(`Offline payment rejected for ${reqToReject.customerName}`);
      setRejectDrawerOpen(false);
      setReqToReject(null);
      setRejectReason('');
      if (detailDrawerOpen && selectedReq?.id === reqToReject.id) {
        setSelectedReq((prev) => ({ ...prev, paymentStatus: 'REJECTED' }));
      }
      fetchRequests();
    } catch (err) {
      toast.error(billingError(err) || 'Failed to reject offline payment');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Delete
  const handleDelete = async () => {
    if (!reqToDelete?.id) return;
    setActionLoading(true);
    try {
      await deleteOfflineRequest(reqToDelete.id);
      toast.success(`Offline payment request removed`);
      setDeleteConfirmOpen(false);
      setReqToDelete(null);
      if (detailDrawerOpen && selectedReq?.id === reqToDelete.id) {
        setDetailDrawerOpen(false);
      }
      setSelectedIds((prev) => prev.filter((id) => id !== reqToDelete.id));
      fetchRequests();
    } catch (err) {
      toast.error(billingError(err) || 'Failed to delete offline payment request');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Bulk Delete
  const handleBulkDelete = async () => {
    if (!selectedIds.length) return;
    setActionLoading(true);
    try {
      await bulkDeleteOfflineRequests(selectedIds);
      toast.success(`${selectedIds.length} request(s) deleted`);
      setBulkDeleteConfirmOpen(false);
      setSelectedIds([]);
      fetchRequests();
    } catch (err) {
      toast.error(billingError(err) || 'Failed to bulk delete requests');
    } finally {
      setActionLoading(false);
    }
  };

  // Export CSV
  const exportCsv = () => {
    if (!requests.length) {
      toast.info('No offline payment records to export');
      return;
    }
    const headers = [
      'Customer Name',
      'Business Name',
      'Plan Name',
      'Base Amount',
      'GST (18%)',
      'Total Amount',
      'Payment Method',
      'Transaction Reference',
      'Order Number',
      'Requested Date',
      'Status',
    ];
    const csvRows = [
      headers.join(','),
      ...requests.map((r) =>
        [
          `"${(r.customerName || '').replace(/"/g, '""')}"`,
          `"${(r.businessName || '').replace(/"/g, '""')}"`,
          `"${(r.planName || '').replace(/"/g, '""')}"`,
          `"${r.baseAmount || 0}"`,
          `"${r.gst || 0}"`,
          `"${r.totalAmount || 0}"`,
          `"${r.paymentMethodDetail || r.paymentMethod || ''}"`,
          `"${(r.transactionId || '').replace(/"/g, '""')}"`,
          `"${(r.orderNumber || '').replace(/"/g, '""')}"`,
          `"${String(r.requestDate || '').slice(0, 10)}"`,
          `"${r.paymentStatus || ''}"`,
        ].join(',')
      ),
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `crm_offline_payments_${activeTab.toLowerCase()}_export.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Offline payment records exported successfully');
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedIds(requests.map((r) => r.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const copyToClipboard = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`Copied ${label} to clipboard`);
  };

  const totalPages = Math.ceil(totalCount / limit) || 1;

  return (
    <div className="w-full min-w-0 max-w-none space-y-6 pb-28">
      {/* ── 1. Page Header ────────────────────────────────────────── */}
      <PageHeader
        title="Offline Payment Requests"
        description="Bank transfer, cash, and offline remittance verification. Review proof and approve customer subscriptions."
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={exportCsv}
              disabled={loading || !requests.length}
              className="h-10 rounded-xl border-[#E2E8E5] text-[#163A2E] hover:bg-slate-50 transition"
            >
              <Download className="mr-1.5 size-4 text-[#107569]" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchRequests}
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
            else if (tab.key === 'PENDING') countBadge = summary.pending;
            else if (tab.key === 'SUCCESS') countBadge = summary.approved;
            else if (tab.key === 'REJECTED') countBadge = summary.rejected;

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
        {/* Pending Requests */}
        <div className="group relative overflow-hidden rounded-2xl border border-[#E2E8E5] bg-white p-5 shadow-xs transition hover:border-amber-500/40 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
              Pending Review
            </span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
              <Clock className="size-4.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-amber-800">
              {summary.pending}
            </span>
            <span className="text-xs text-amber-700 font-medium">Awaiting action</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-amber-700">
            <span className="inline-block size-1.5 rounded-full bg-amber-500" />
            Requires bank/cash confirmation
          </div>
        </div>

        {/* Approved Requests */}
        <div className="group relative overflow-hidden rounded-2xl border border-[#E2E8E5] bg-white p-5 shadow-xs transition hover:border-emerald-500/40 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
              Approved / Cleared
            </span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="size-4.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-emerald-800">
              {summary.approved}
            </span>
            <span className="text-xs text-emerald-700 font-medium">Subscriptions active</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-emerald-700">
            <span className="inline-block size-1.5 rounded-full bg-emerald-500" />
            Verified & reconciled in ledger
          </div>
        </div>

        {/* Rejected Requests */}
        <div className="group relative overflow-hidden rounded-2xl border border-[#E2E8E5] bg-white p-5 shadow-xs transition hover:border-rose-500/40 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
              Rejected Requests
            </span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-rose-50 text-rose-700 border border-rose-200">
              <XCircle className="size-4.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-rose-800">
              {summary.rejected}
            </span>
            <span className="text-xs text-rose-700 font-medium">Declined</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-rose-700">
            <span className="inline-block size-1.5 rounded-full bg-rose-500" />
            Unverified proof or unpaid
          </div>
        </div>

        {/* Total Requests */}
        <div className="group relative overflow-hidden rounded-2xl border border-[#E2E8E5] bg-white p-5 shadow-xs transition hover:border-[#107569]/40 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
              Total Offline Remittances
            </span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-[#107569] border border-emerald-100">
              <Receipt className="size-4.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-[#163A2E]">
              {summary.total}
            </span>
            <span className="text-xs text-slate-500 font-medium">Total submissions</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-500">
            <span className="inline-block size-1.5 rounded-full bg-[#107569]" />
            Historical offline payments
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
              placeholder="Search by customer name, order #, reference ID, plan..."
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
            {/* Method Filter */}
            <div className="flex items-center gap-2 bg-[#F4F9F6] border border-[#E2E8E5] px-3 py-1.5 rounded-xl">
              <Banknote className="size-3.5 text-[#107569]" />
              <span className="text-xs font-semibold text-[#163A2E]">Method:</span>
              <select
                value={methodFilter}
                onChange={(e) => {
                  setMethodFilter(e.target.value);
                  setPage(1);
                }}
                className="bg-transparent text-xs font-semibold text-[#163A2E] focus:outline-hidden cursor-pointer"
              >
                <option value="ALL">All Methods</option>
                <option value="CASH">Cash</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
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
                <option value="amount_high">Amount: High to Low</option>
                <option value="amount_low">Amount: Low to High</option>
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
              <span className="text-xs font-medium">request(s) selected</span>
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

      {/* ── 5. Modern Offline Payments Table ───────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-[#E2E8E5] bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F4F9F6] border-b border-[#E2E8E5] text-[#163A2E]">
                <th className="py-3.5 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={
                      requests.length > 0 &&
                      selectedIds.length === requests.length
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
                  Amount
                </th>
                <th className="py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider text-center">
                  Method
                </th>
                <th className="py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider">
                  Reference & Order
                </th>
                <th className="py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider">
                  Requested Date
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
                  <td colSpan={9} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RotateCw className="size-6 text-[#107569] animate-spin" />
                      <span className="text-sm font-semibold text-slate-600">
                        Loading offline payment requests...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto text-center gap-2">
                      <div className="flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                        <CreditCard className="size-6" />
                      </div>
                      <h4 className="text-base font-bold text-[#163A2E]">
                        No Offline Requests Found
                      </h4>
                      <p className="text-xs text-slate-500">
                        {search
                          ? `No records matched "${search}". Try clearing search or tab filters.`
                          : 'No offline remittance requests are currently awaiting review.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                requests.map((row) => {
                  const isSelected = selectedIds.includes(row.id);
                  const custName = row.customerName || 'General Customer';
                  const busName = row.businessName || '';
                  const initial = custName.trim()[0]?.toUpperCase() || 'C';
                  const isPending = String(row.paymentStatus).toUpperCase() === 'PENDING';

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

                      {/* Customer (Deduplicated Clean Layout) */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-200 text-[#107569] font-bold text-xs shrink-0">
                            {initial}
                          </div>
                          <div className="min-w-0">
                            <button
                              onClick={() => {
                                setSelectedReq(row);
                                setDetailDrawerOpen(true);
                              }}
                              className="font-bold text-[#163A2E] hover:text-[#107569] hover:underline text-left block truncate max-w-[170px]"
                            >
                              {custName}
                            </button>
                            {busName && busName !== custName && (
                              <p className="text-[11px] text-slate-500 truncate max-w-[170px]">
                                {busName}
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

                      {/* Amount */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-[#163A2E]">
                        {inr(row.totalAmount)}
                      </td>

                      {/* Method */}
                      <td className="py-3.5 px-4 text-center">
                        {getMethodBadge(row.paymentMethodDetail || row.paymentMethod)}
                      </td>

                      {/* Reference / Order */}
                      <td className="py-3.5 px-4">
                        <div className="max-w-[210px]">
                          <p className="font-mono text-xs font-semibold text-[#163A2E] truncate">
                            {row.orderNumber || `#QB-OFFLINE-${row.id}`}
                          </p>
                          {row.transactionId && row.transactionId !== row.orderNumber && (
                            <p className="text-[11px] text-slate-500 truncate font-mono">
                              Ref: {row.transactionId}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Requested Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 font-medium">
                        {formatDate(row.requestDate)}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {getStatusBadge(row.paymentStatus)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {/* Approve (For Pending) */}
                          {allowed && isPending && (
                            <button
                              title="Approve & Activate Subscription"
                              onClick={() => {
                                setReqToApprove(row);
                                setApproveConfirmOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 transition font-semibold"
                            >
                              <Check className="size-4 text-emerald-600" />
                            </button>
                          )}

                          {/* Reject (For Pending) */}
                          {allowed && isPending && (
                            <button
                              title="Reject Request"
                              onClick={() => {
                                setReqToReject(row);
                                setRejectReason('');
                                setRejectDrawerOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition font-semibold"
                            >
                              <X className="size-4 text-rose-600" />
                            </button>
                          )}

                          {/* View Detail */}
                          <button
                            title="View Remittance Details"
                            onClick={() => {
                              setSelectedReq(row);
                              setDetailDrawerOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-[#107569] hover:bg-emerald-50 transition"
                          >
                            <Eye className="size-4" />
                          </button>

                          {/* Delete */}
                          {allowed && (
                            <button
                              title="Delete Request"
                              onClick={() => {
                                setReqToDelete(row);
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
              Showing {requests.length > 0 ? (page - 1) * limit + 1 : 0}–
              {Math.min(page * limit, totalCount)} of {totalCount} requests
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

      {/* ── 7. SlideOver Drawer: View Request Details ──────────────── */}
      <SlideOverDrawer
        open={detailDrawerOpen}
        onOpenChange={setDetailDrawerOpen}
        title={selectedReq?.orderNumber || 'Offline Payment Request'}
        description="Comprehensive offline remittance verification and subscription activation details."
      >
        {selectedReq && (
          <div className="space-y-5 p-1 text-xs">
            {/* Header Status Card */}
            <div className="p-4 rounded-2xl bg-[#F4F9F6] border border-[#E2E8E5] space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm font-bold text-[#163A2E]">
                  {selectedReq.orderNumber || `#QB-OFFLINE-${selectedReq.id}`}
                </span>
                {getStatusBadge(selectedReq.paymentStatus)}
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-600">
                <div>
                  <span className="text-[11px] text-slate-400 block font-semibold">PAYMENT METHOD</span>
                  <div className="pt-0.5">{getMethodBadge(selectedReq.paymentMethodDetail || selectedReq.paymentMethod)}</div>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block font-semibold">REQUEST DATE</span>
                  <span className="font-semibold text-[#163A2E]">{formatDate(selectedReq.requestDate)}</span>
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
                <p className="text-sm font-bold text-[#163A2E]">{selectedReq.customerName}</p>
                {selectedReq.businessName && selectedReq.businessName !== selectedReq.customerName && (
                  <p className="text-slate-500">Business: {selectedReq.businessName}</p>
                )}
                {selectedReq.planName && (
                  <div className="pt-1">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold text-[11px]">
                      <Layers className="size-3" />
                      Plan: {selectedReq.planName} ({selectedReq.billingCycle || 'MONTHLY'})
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Financial Breakdown */}
            <div className="p-4 rounded-2xl border border-[#E2E8E5] bg-white space-y-3">
              <h5 className="font-bold text-[#163A2E] flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                <Receipt className="size-3.5 text-[#107569]" />
                Amount Breakdown
              </h5>
              <div className="space-y-2 border-b border-[#E2E8E5] pb-3 text-slate-600">
                <div className="flex justify-between">
                  <span>Base Amount:</span>
                  <span className="font-mono">{inr(selectedReq.baseAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST (18%):</span>
                  <span className="font-mono">{inr(selectedReq.gst)}</span>
                </div>
              </div>
              <div className="flex justify-between text-sm font-bold text-[#163A2E] pt-1">
                <span>Total Payable:</span>
                <span className="font-mono text-base text-[#107569]">{inr(selectedReq.totalAmount)}</span>
              </div>
            </div>

            {/* Reference & Transaction Details */}
            <div className="p-4 rounded-2xl border border-[#E2E8E5] bg-white space-y-2">
              <h5 className="font-bold text-[#163A2E] uppercase text-[11px] tracking-wider flex items-center justify-between">
                <span>Remittance Reference</span>
                {selectedReq.transactionId && (
                  <button
                    onClick={() => copyToClipboard(selectedReq.transactionId, 'Reference ID')}
                    className="text-[#107569] hover:underline flex items-center gap-1 normal-case text-xs font-semibold"
                  >
                    <Copy className="size-3" /> Copy
                  </button>
                )}
              </h5>
              <div className="p-2.5 rounded-xl bg-slate-50 font-mono text-xs text-slate-700 break-all border border-slate-200">
                {selectedReq.transactionId || selectedReq.orderNumber || 'No reference recorded'}
              </div>
              {selectedReq.invoiceNumber && String(selectedReq.invoiceNumber).startsWith('http') && (
                <div className="pt-1">
                  <a
                    href={selectedReq.invoiceNumber}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#107569] hover:underline"
                  >
                    <ExternalLink className="size-3.5" />
                    Open Uploaded Proof Document
                  </a>
                </div>
              )}
            </div>

            {/* Actions */}
            {allowed && String(selectedReq.paymentStatus).toUpperCase() === 'PENDING' && (
              <div className="flex items-center gap-2 pt-2">
                <Button
                  onClick={() => {
                    setReqToApprove(selectedReq);
                    setApproveConfirmOpen(true);
                  }}
                  className="flex-1 h-10 rounded-xl bg-[#107569] text-white hover:bg-[#0e6359] text-xs font-semibold gap-1.5"
                >
                  <Check className="size-4" />
                  Approve & Activate Plan
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setReqToReject(selectedReq);
                    setRejectReason('');
                    setRejectDrawerOpen(true);
                  }}
                  className="h-10 rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold px-4"
                >
                  Reject
                </Button>
              </div>
            )}
          </div>
        )}
      </SlideOverDrawer>

      {/* ── 8. SlideOver Drawer: Reject Request ────────────────────── */}
      <SlideOverDrawer
        open={rejectDrawerOpen}
        onOpenChange={setRejectDrawerOpen}
        title="Reject Offline Payment"
        description={reqToReject ? `Rejecting request for ${reqToReject.customerName} (${inr(reqToReject.totalAmount)})` : ''}
      >
        {reqToReject && (
          <form onSubmit={handleRejectSubmit} className="space-y-4 p-1 text-xs">
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 space-y-1">
              <span className="font-bold text-[11px] uppercase tracking-wider block">Customer & Amount</span>
              <p className="text-sm font-bold text-rose-950">{reqToReject.customerName}</p>
              <p className="text-xs font-mono font-semibold text-rose-800">
                Amount: {inr(reqToReject.totalAmount)} • Method: {reqToReject.paymentMethodDetail || reqToReject.paymentMethod}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-[#163A2E]">
                Rejection Reason <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={4}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="State clearly why this remittance was not approved (e.g. Transaction UTR not credited, amount mismatch)..."
                className="w-full rounded-xl border border-[#E2E8E5] bg-white p-3 text-xs text-slate-700 focus:border-[#107569] focus:outline-hidden"
              />
            </div>

            {/* Quick Reason Presets */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-500">Quick Reason Presets:</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Payment not received in bank account',
                  'Invalid transaction reference / UTR',
                  'Incorrect deposited amount',
                  'Duplicate payment submission',
                ].map((preset) => (
                  <button
                    type="button"
                    key={preset}
                    onClick={() => setRejectReason(preset)}
                    className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10.5px] font-medium transition"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#E2E8E5]">
              <Button
                type="button"
                variant="outline"
                onClick={() => setRejectDrawerOpen(false)}
                className="h-10 rounded-xl border-[#E2E8E5] text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={actionLoading || !rejectReason.trim()}
                className="h-10 rounded-xl bg-rose-600 px-5 text-xs font-semibold text-white hover:bg-rose-700 shadow-xs"
              >
                {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
              </Button>
            </div>
          </form>
        )}
      </SlideOverDrawer>

      {/* ── 9. Confirmation Dialogs ───────────────────────────────── */}
      <ConfirmDialog
        open={approveConfirmOpen}
        onOpenChange={setApproveConfirmOpen}
        title="Approve Offline Payment?"
        description={`Approve offline payment of ${inr(reqToApprove?.totalAmount)} for ${
          reqToApprove?.customerName
        }? This will immediately activate their ${reqToApprove?.planName || 'subscription'} plan.`}
        confirmLabel={actionLoading ? 'Approving...' : 'Approve & Activate'}
        variant="success"
        onConfirm={handleApprove}
      />

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Permanently Delete Request?"
        description={`You are about to permanently delete this offline payment request for ${
          reqToDelete?.customerName || reqToDelete?.id
        }. This action cannot be undone.`}
        confirmLabel={actionLoading ? 'Deleting...' : 'Permanently Delete'}
        variant="destructive"
        onConfirm={handleDelete}
      />

      <ConfirmDialog
        open={bulkDeleteConfirmOpen}
        onOpenChange={setBulkDeleteConfirmOpen}
        title="Permanently Delete Requests?"
        description={`You are about to permanently delete ${selectedIds.length} selected offline payment request(s). This action cannot be undone.`}
        confirmLabel={actionLoading ? 'Deleting...' : 'Delete Selected'}
        variant="destructive"
        onConfirm={handleBulkDelete}
      />
    </div>
  );
}
