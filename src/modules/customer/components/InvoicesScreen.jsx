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
  FileText,
  Plus,
  Download,
  RotateCw,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileQuestion,
  Ban,
  Trash2,
  Eye,
  Check,
  ChevronLeft,
  ChevronRight,
  Calculator,
  Calendar,
  Building2,
  User,
  Phone,
  Mail,
  ArrowUpDown,
  ExternalLink,
  Sparkles,
  Receipt,
  Layers,
  X,
  CreditCard,
} from 'lucide-react';
import {
  loadInvoices,
  createInvoice,
  updateInvoiceStatus,
  removeInvoice,
  downloadInvoice,
  bulkDeleteInvoices,
  loadCustomers,
  sessionCan,
  billingError,
} from '@/modules/customer/billing-api';

const STATUS_TABS = [
  { key: 'ALL', label: 'All Invoices' },
  { key: 'PAID', label: 'Paid' },
  { key: 'PENDING', label: 'Pending' },
  { key: 'OVERDUE', label: 'Overdue' },
  { key: 'DRAFT', label: 'Draft' },
  { key: 'CANCELLED', label: 'Cancelled' },
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
    case 'PAID':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 border border-emerald-200">
          <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Paid
        </span>
      );
    case 'PENDING':
    case 'SENT':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800 border border-amber-200">
          <span className="size-1.5 rounded-full bg-amber-500" />
          Pending
        </span>
      );
    case 'OVERDUE':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-800 border border-rose-200">
          <span className="size-1.5 rounded-full bg-rose-500" />
          Overdue
        </span>
      );
    case 'DRAFT':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700 border border-slate-200">
          <span className="size-1.5 rounded-full bg-slate-400" />
          Draft
        </span>
      );
    case 'CANCELLED':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-500 border border-slate-200">
          <span className="size-1.5 rounded-full bg-slate-400" />
          Cancelled
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

const generateInvoiceNo = () => {
  const yr = new Date().getFullYear();
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `INV-${yr}-${rand}`;
};

export function InvoicesScreen() {
  const [allowed, setAllowed] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [invoices, setInvoices] = React.useState([]);
  const [customers, setCustomers] = React.useState([]);
  const [loadingCustomers, setLoadingCustomers] = React.useState(false);
  const [summary, setSummary] = React.useState({
    totalInvoices: 0,
    paidInvoices: 0,
    pendingPayments: 0,
    overdueInvoices: 0,
  });

  const [activeTab, setActiveTab] = React.useState('ALL');
  const [search, setSearch] = React.useState('');
  const [sortBy, setSortBy] = React.useState('newest');
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(10);
  const [totalCount, setTotalCount] = React.useState(0);
  const [selectedIds, setSelectedIds] = React.useState([]);

  // Drawers & Modals
  const [createDrawerOpen, setCreateDrawerOpen] = React.useState(false);
  const [detailDrawerOpen, setDetailDrawerOpen] = React.useState(false);
  const [selectedInvoice, setSelectedInvoice] = React.useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = React.useState(null);
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = React.useState(false);
  const [actionLoading, setActionLoading] = React.useState(false);

  // Form State
  const todayStr = new Date().toISOString().slice(0, 10);
  const due30Str = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const [form, setForm] = React.useState({
    customerId: '',
    customerSearch: '',
    invoiceNo: generateInvoiceNo(),
    issueDate: todayStr,
    dueDate: due30Str,
    subTotal: '',
    taxAmount: '',
    totalAmount: '',
    status: 'PENDING',
    notes: '',
  });

  React.useEffect(() => {
    setAllowed(
      sessionCan('CUSTOMER_INVOICES') ||
      sessionCan('INVOICE') ||
      sessionCan('CRM')
    );
  }, []);

  // Fetch customers once for create drawer dropdown
  React.useEffect(() => {
    let active = true;
    setLoadingCustomers(true);
    loadCustomers({ limit: 150 })
      .then((res) => {
        if (!active) return;
        setCustomers(res.rows || []);
      })
      .catch((err) => {
        console.error('Failed to load customers for selector', err);
      })
      .finally(() => {
        if (active) setLoadingCustomers(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const fetchInvoices = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await loadInvoices({
        page,
        limit,
        status: activeTab === 'ALL' ? undefined : activeTab,
        search: search.trim() || undefined,
      });

      let items = res.rows || [];

      // Client-side sort if desired
      if (sortBy === 'newest') {
        items.sort((a, b) => new Date(b.issueDate || 0) - new Date(a.issueDate || 0));
      } else if (sortBy === 'oldest') {
        items.sort((a, b) => new Date(a.issueDate || 0) - new Date(b.issueDate || 0));
      } else if (sortBy === 'highest') {
        items.sort((a, b) => (Number(b.totalAmount) || 0) - (Number(a.totalAmount) || 0));
      } else if (sortBy === 'lowest') {
        items.sort((a, b) => (Number(a.totalAmount) || 0) - (Number(b.totalAmount) || 0));
      }

      setInvoices(items);
      setTotalCount(res.pagination?.total || items.length);

      if (res.summary) {
        setSummary({
          totalInvoices: res.summary.totalInvoices ?? res.summary.total ?? items.length,
          paidInvoices: res.summary.paidInvoices ?? res.summary.paid ?? 0,
          pendingPayments: res.summary.pendingPayments ?? res.summary.pending ?? 0,
          overdueInvoices: res.summary.overdueInvoices ?? res.summary.overdue ?? 0,
        });
      }
    } catch (err) {
      toast.error(billingError(err) || 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  }, [page, limit, activeTab, search, sortBy]);

  React.useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // Handle single delete
  const handleDeleteInvoice = async () => {
    if (!invoiceToDelete?.id) return;
    setActionLoading(true);
    try {
      await removeInvoice(invoiceToDelete.id);
      toast.success(`Invoice ${invoiceToDelete.invoiceNo || invoiceToDelete.id} deleted successfully`);
      setDeleteConfirmOpen(false);
      setInvoiceToDelete(null);
      if (detailDrawerOpen && selectedInvoice?.id === invoiceToDelete.id) {
        setDetailDrawerOpen(false);
      }
      setSelectedIds((prev) => prev.filter((id) => id !== invoiceToDelete.id));
      fetchInvoices();
    } catch (err) {
      toast.error(billingError(err) || 'Failed to delete invoice');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (!selectedIds.length) return;
    setActionLoading(true);
    try {
      await bulkDeleteInvoices(selectedIds);
      toast.success(`${selectedIds.length} invoice(s) permanently deleted`);
      setBulkDeleteConfirmOpen(false);
      setSelectedIds([]);
      fetchInvoices();
    } catch (err) {
      toast.error(billingError(err) || 'Failed to bulk delete invoices');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle download PDF
  const handleDownloadPdf = async (row) => {
    try {
      toast.info(`Preparing ${row.invoiceNo || 'invoice'} PDF...`);
      await downloadInvoice(row.id, row.invoiceNo);
      toast.success('Invoice downloaded successfully');
    } catch (err) {
      toast.error(billingError(err) || 'Failed to download invoice PDF');
    }
  };

  // Handle quick status update
  const handleStatusChange = async (row, newStatus) => {
    try {
      await updateInvoiceStatus(row.id, newStatus);
      toast.success(`Invoice status updated to ${newStatus}`);
      if (selectedInvoice?.id === row.id) {
        setSelectedInvoice((prev) => ({ ...prev, status: newStatus }));
      }
      fetchInvoices();
    } catch (err) {
      toast.error(billingError(err) || 'Failed to update invoice status');
    }
  };

  // Handle form submission
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!form.customerId) {
      toast.error('Please select a customer for this invoice.');
      return;
    }
    if (!form.totalAmount || Number(form.totalAmount) <= 0) {
      toast.error('Please enter a valid invoice total amount.');
      return;
    }

    setActionLoading(true);
    try {
      await createInvoice({
        customerId: Number(form.customerId),
        invoiceNo: form.invoiceNo.trim() || undefined,
        issueDate: form.issueDate || undefined,
        dueDate: form.dueDate || undefined,
        subTotal: form.subTotal ? Number(form.subTotal) : undefined,
        taxAmount: form.taxAmount ? Number(form.taxAmount) : undefined,
        totalAmount: Number(form.totalAmount),
        status: form.status || 'PENDING',
        notes: form.notes.trim() || undefined,
      });

      toast.success('Invoice created successfully');
      setCreateDrawerOpen(false);
      // Reset form
      setForm({
        customerId: '',
        customerSearch: '',
        invoiceNo: generateInvoiceNo(),
        issueDate: todayStr,
        dueDate: due30Str,
        subTotal: '',
        taxAmount: '',
        totalAmount: '',
        status: 'PENDING',
        notes: '',
      });
      fetchInvoices();
    } catch (err) {
      toast.error(billingError(err) || 'Failed to create invoice');
    } finally {
      setActionLoading(false);
    }
  };

  // GST 18% calculation shortcut
  const applyGst = () => {
    const sub = Number(form.subTotal) || 0;
    if (sub <= 0) {
      toast.error('Please enter a subtotal amount first.');
      return;
    }
    const tax = Math.round(sub * 0.18 * 100) / 100;
    const total = Math.round((sub + tax) * 100) / 100;
    setForm((prev) => ({
      ...prev,
      taxAmount: String(tax),
      totalAmount: String(total),
    }));
    toast.success('Applied 18% GST (Tax: ₹' + tax + ', Total: ₹' + total + ')');
  };

  // Export CSV
  const exportCsv = () => {
    if (!invoices.length) {
      toast.info('No invoice records to export');
      return;
    }
    const headers = [
      'Invoice No',
      'Customer Name',
      'Client Name',
      'Plan',
      'Issue Date',
      'Due Date',
      'Subtotal',
      'Tax Amount',
      'Total Amount',
      'Status',
      'Notes',
    ];
    const csvRows = [
      headers.join(','),
      ...invoices.map((inv) =>
        [
          `"${inv.invoiceNo || inv.invoiceNumber || ''}"`,
          `"${(inv.customerName || '').replace(/"/g, '""')}"`,
          `"${(inv.clientName || '').replace(/"/g, '""')}"`,
          `"${(inv.planName || '').replace(/"/g, '""')}"`,
          `"${String(inv.issueDate || '').slice(0, 10)}"`,
          `"${String(inv.dueDate || '').slice(0, 10)}"`,
          `"${inv.subTotal || 0}"`,
          `"${inv.taxAmount || 0}"`,
          `"${inv.totalAmount || 0}"`,
          `"${inv.status || ''}"`,
          `"${(inv.notes || '').replace(/"/g, '""')}"`,
        ].join(',')
      ),
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `crm_invoices_${activeTab.toLowerCase()}_export.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Invoice data exported successfully');
  };

  // Selection handlers
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedIds(invoices.map((i) => i.id));
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

  // Filtered customer list for the customer search picker
  const filteredCustomers = React.useMemo(() => {
    const q = (form.customerSearch || '').trim().toLowerCase();
    if (!q) return customers.slice(0, 20);
    return customers.filter(
      (c) =>
        (c.name || '').toLowerCase().includes(q) ||
        (c.companyName || '').toLowerCase().includes(q) ||
        (c.phone || '').includes(q) ||
        (c.email || '').toLowerCase().includes(q)
    ).slice(0, 30);
  }, [customers, form.customerSearch]);

  const selectedCustomerObj = customers.find((c) => String(c.id) === String(form.customerId));

  return (
    <div className="w-full min-w-0 max-w-none space-y-6 pb-28">
      {/* ── 1. Page Header ────────────────────────────────────────── */}
      <PageHeader
        title="Invoices & Billing"
        description="Invoices returned by the invoice API. Track customer billing, GST compliance, and payment settlement lifecycles."
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={exportCsv}
              disabled={loading || !invoices.length}
              className="h-10 rounded-xl border-[#E2E8E5] text-[#163A2E] hover:bg-slate-50 transition"
            >
              <Download className="mr-1.5 size-4 text-[#107569]" />
              Export CSV
            </Button>
            {allowed && (
              <Button
                onClick={() => {
                  setForm({
                    customerId: '',
                    customerSearch: '',
                    invoiceNo: generateInvoiceNo(),
                    issueDate: todayStr,
                    dueDate: due30Str,
                    subTotal: '',
                    taxAmount: '',
                    totalAmount: '',
                    status: 'PENDING',
                    notes: '',
                  });
                  setCreateDrawerOpen(true);
                }}
                className="h-10 rounded-xl bg-[#107569] px-4 text-sm font-semibold text-white shadow-xs transition hover:bg-[#0e6359]"
              >
                <Plus className="mr-1.5 size-4" />
                Create Invoice
              </Button>
            )}
          </div>
        }
      />

      {/* ── 2. Top Segmented Status Switcher ──────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-2.5 rounded-2xl border border-[#E2E8E5] shadow-xs">
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto">
          {STATUS_TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            let countBadge = null;
            if (tab.key === 'ALL') countBadge = summary.totalInvoices;
            else if (tab.key === 'PAID') countBadge = summary.paidInvoices;
            else if (tab.key === 'PENDING') countBadge = summary.pendingPayments;
            else if (tab.key === 'OVERDUE') countBadge = summary.overdueInvoices;

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

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchInvoices}
            disabled={loading}
            className="h-8 rounded-lg text-slate-600 hover:text-[#107569] hover:bg-emerald-50 px-2.5 text-xs font-medium"
          >
            <RotateCw className={`size-3.5 mr-1.5 text-[#107569] ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* ── 3. Four Modern KPI Stat Cards ─────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Invoices */}
        <div className="group relative overflow-hidden rounded-2xl border border-[#E2E8E5] bg-white p-5 shadow-xs transition hover:border-[#107569]/40 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
              Total Invoices
            </span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-[#107569] border border-emerald-100">
              <Receipt className="size-4.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-[#163A2E]">
              {summary.totalInvoices}
            </span>
            <span className="text-xs text-slate-500 font-medium">Billed entries</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-500">
            <span className="inline-block size-1.5 rounded-full bg-[#107569]" />
            Active platform invoicing
          </div>
        </div>

        {/* Paid Invoices */}
        <div className="group relative overflow-hidden rounded-2xl border border-[#E2E8E5] bg-white p-5 shadow-xs transition hover:border-emerald-500/40 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
              Paid Invoices
            </span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="size-4.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-emerald-800">
              {summary.paidInvoices}
            </span>
            <span className="text-xs text-emerald-700 font-medium">Fully settled</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-emerald-700">
            <span className="inline-block size-1.5 rounded-full bg-emerald-500" />
            Cleared via payment gateways
          </div>
        </div>

        {/* Pending Invoices */}
        <div className="group relative overflow-hidden rounded-2xl border border-[#E2E8E5] bg-white p-5 shadow-xs transition hover:border-amber-500/40 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
              Pending Invoices
            </span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
              <Clock className="size-4.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-amber-800">
              {summary.pendingPayments}
            </span>
            <span className="text-xs text-amber-700 font-medium">Awaiting payment</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-amber-700">
            <span className="inline-block size-1.5 rounded-full bg-amber-500" />
            Due within billing cycle
          </div>
        </div>

        {/* Overdue Invoices */}
        <div className="group relative overflow-hidden rounded-2xl border border-[#E2E8E5] bg-white p-5 shadow-xs transition hover:border-rose-500/40 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
              Overdue Invoices
            </span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-rose-50 text-rose-700 border border-rose-200">
              <AlertTriangle className="size-4.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-rose-800">
              {summary.overdueInvoices}
            </span>
            <span className="text-xs text-rose-700 font-medium">Grace expired</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-rose-700">
            <span className="inline-block size-1.5 rounded-full bg-rose-500" />
            Requires follow-up reminder
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
              placeholder="Search by invoice #, customer name, plan, notes..."
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

          {/* Right Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
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
                <option value="highest">Amount: High to Low</option>
                <option value="lowest">Amount: Low to High</option>
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
              <span className="text-xs font-medium">invoice(s) selected</span>
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

      {/* ── 5. Modern Invoices Table ───────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-[#E2E8E5] bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F4F9F6] border-b border-[#E2E8E5] text-[#163A2E]">
                <th className="py-3.5 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={
                      invoices.length > 0 &&
                      selectedIds.length === invoices.length
                    }
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="size-4 rounded border-slate-300 text-[#107569] focus:ring-[#107569] cursor-pointer"
                  />
                </th>
                <th className="py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider">
                  Invoice
                </th>
                <th className="py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider">
                  Customer
                </th>
                <th className="py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider">
                  Plan
                </th>
                <th className="py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider">
                  Issued
                </th>
                <th className="py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider">
                  Due
                </th>
                <th className="py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider text-right">
                  Subtotal
                </th>
                <th className="py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider text-right">
                  Tax
                </th>
                <th className="py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider text-right">
                  Total
                </th>
                <th className="py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider text-right whitespace-nowrap">
                  Next Payment Amount
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
                  <td colSpan={12} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RotateCw className="size-6 text-[#107569] animate-spin" />
                      <span className="text-sm font-semibold text-slate-600">
                        Loading invoices...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto text-center gap-2">
                      <div className="flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                        <FileText className="size-6" />
                      </div>
                      <h4 className="text-base font-bold text-[#163A2E]">
                        No Invoices Found
                      </h4>
                      <p className="text-xs text-slate-500">
                        {search
                          ? `No invoices matched "${search}". Try clearing search filters.`
                          : 'No invoice records currently exist for this category.'}
                      </p>
                      {allowed && (
                        <Button
                          onClick={() => setCreateDrawerOpen(true)}
                          size="sm"
                          className="mt-2 bg-[#107569] hover:bg-[#0e6359] text-white rounded-xl"
                        >
                          <Plus className="size-3.5 mr-1" />
                          Create First Invoice
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                invoices.map((row) => {
                  const isSelected = selectedIds.includes(row.id);
                  const clientTitle = row.customerName || row.clientName || 'General Customer';
                  const initial = clientTitle.trim()[0]?.toUpperCase() || 'C';

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

                      {/* Invoice Number */}
                      <td className="py-3.5 px-4 font-semibold text-[#163A2E]">
                        <button
                          onClick={() => {
                            setSelectedInvoice(row);
                            setDetailDrawerOpen(true);
                          }}
                          className="flex items-center gap-1.5 font-mono text-xs font-bold text-[#107569] hover:underline"
                        >
                          <Receipt className="size-3.5 text-slate-400" />
                          <span>{row.invoiceNo || row.invoiceNumber}</span>
                        </button>
                      </td>

                      {/* Customer */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-50 border border-emerald-200 text-[#107569] font-bold text-xs shrink-0">
                            {initial}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-[#163A2E] truncate max-w-[160px]">
                              {clientTitle}
                            </p>
                            {row.clientName && row.clientName !== clientTitle && (
                              <p className="text-[11px] text-slate-500 truncate max-w-[160px]">
                                {row.clientName}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Plan */}
                      <td className="py-3.5 px-4">
                        {row.planName && row.planName !== '—' ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-[#F4F9F6] border border-[#E2E8E5] px-2 py-0.5 text-[11px] font-semibold text-[#163A2E]">
                            <Layers className="size-3 text-[#107569]" />
                            {row.planName.split(/\.\s*(?:Total Paid|Purchase|Plan activation|Payment Method|Order):/i)[0].trim()}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Issued Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 font-medium">
                        {formatDate(row.issueDate)}
                      </td>

                      {/* Due Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 font-medium">
                        {formatDate(row.dueDate)}
                      </td>

                      {/* Subtotal */}
                      <td className="py-3.5 px-4 text-right font-mono text-slate-600">
                        {inr(row.subTotal)}
                      </td>

                      {/* Tax */}
                      <td className="py-3.5 px-4 text-right font-mono text-slate-600">
                        {inr(row.taxAmount)}
                      </td>

                      {/* Total */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-[#163A2E]">
                        {inr(row.totalAmount)}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono whitespace-nowrap">
                        {row.status === 'PARTIALLY_PAID' && row.nextInstallmentAmount != null
                          ? inr(row.nextInstallmentAmount)
                          : '—'}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {getStatusBadge(row.status)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {/* Download PDF */}
                          <button
                            title="Download Invoice PDF"
                            onClick={() => handleDownloadPdf(row)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-[#107569] hover:bg-emerald-50 transition"
                          >
                            <Download className="size-4" />
                          </button>

                          {/* View Detail */}
                          <button
                            title="View Invoice Details"
                            onClick={() => {
                              setSelectedInvoice(row);
                              setDetailDrawerOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-[#107569] hover:bg-emerald-50 transition"
                          >
                            <Eye className="size-4" />
                          </button>

                          {/* Delete */}
                          {allowed && (
                            <button
                              title="Delete Invoice"
                              onClick={() => {
                                setInvoiceToDelete(row);
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

        {/* ── 6. Pagination Footer ─────────────────────────────────── */}
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
              Showing {invoices.length > 0 ? (page - 1) * limit + 1 : 0}–
              {Math.min(page * limit, totalCount)} of {totalCount} invoices
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

      {/* ── 7. SlideOver Drawer: Create Invoice ─────────────────────── */}
      <SlideOverDrawer
        open={createDrawerOpen}
        onOpenChange={setCreateDrawerOpen}
        title="Create Invoice"
        description="Generate and issue a customer tax invoice. Totals & GST are validated upon creation."
      >
        <form onSubmit={handleCreateSubmit} className="space-y-5 p-1">
          {/* Customer Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#163A2E] flex items-center justify-between">
              <span>Customer <span className="text-rose-500">*</span></span>
              {loadingCustomers && (
                <span className="text-[10px] text-slate-400 font-normal">Loading list...</span>
              )}
            </label>
            <div className="space-y-2">
              <Input
                placeholder="Type to search customer by name or phone..."
                value={form.customerSearch}
                onChange={(e) => setForm((prev) => ({ ...prev, customerSearch: e.target.value }))}
                className="h-9 text-xs rounded-xl border-[#E2E8E5]"
              />
              <select
                required
                value={form.customerId}
                onChange={(e) => {
                  const val = e.target.value;
                  const c = customers.find((item) => String(item.id) === String(val));
                  setForm((prev) => ({
                    ...prev,
                    customerId: val,
                    notes: c ? `Invoice for ${c.companyName || c.name}` : prev.notes,
                  }));
                }}
                className="w-full h-10 rounded-xl border border-[#E2E8E5] bg-white px-3 text-xs font-semibold text-[#163A2E] focus:border-[#107569] focus:outline-hidden"
              >
                <option value="">-- Select Customer Account --</option>
                {filteredCustomers.map((cust) => (
                  <option key={cust.id} value={cust.id}>
                    {cust.companyName || cust.name} {cust.phone ? `(${cust.phone})` : ''} - #{cust.id}
                  </option>
                ))}
              </select>
            </div>
            {selectedCustomerObj && (
              <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-200 text-xs space-y-0.5 text-emerald-900">
                <p className="font-bold flex items-center gap-1.5">
                  <Building2 className="size-3.5 text-[#107569]" />
                  {selectedCustomerObj.companyName || selectedCustomerObj.name}
                </p>
                <p className="text-[11px] text-slate-600">
                  Contact: {selectedCustomerObj.name || 'Primary'} • {selectedCustomerObj.phone || 'No phone'}
                </p>
              </div>
            )}
          </div>

          {/* Invoice Number */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#163A2E]">
                Invoice Number <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, invoiceNo: generateInvoiceNo() }))}
                className="text-[11px] font-semibold text-[#107569] hover:underline flex items-center gap-1"
              >
                <Sparkles className="size-3" /> Auto-generate
              </button>
            </div>
            <Input
              required
              value={form.invoiceNo}
              onChange={(e) => setForm((prev) => ({ ...prev, invoiceNo: e.target.value }))}
              placeholder="e.g. INV-2026-102938"
              className="h-10 text-xs font-mono font-semibold rounded-xl border-[#E2E8E5]"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#163A2E]">Issue Date</label>
              <Input
                type="date"
                required
                value={form.issueDate}
                onChange={(e) => setForm((prev) => ({ ...prev, issueDate: e.target.value }))}
                className="h-10 text-xs rounded-xl border-[#E2E8E5]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#163A2E]">Due Date</label>
              <Input
                type="date"
                required
                value={form.dueDate}
                onChange={(e) => setForm((prev) => ({ ...prev, dueDate: e.target.value }))}
                className="h-10 text-xs rounded-xl border-[#E2E8E5]"
              />
            </div>
          </div>

          {/* Financials & GST Auto-Calculator */}
          <div className="space-y-3 p-3.5 rounded-2xl bg-[#F4F9F6] border border-[#E2E8E5]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#163A2E] flex items-center gap-1.5">
                <Calculator className="size-3.5 text-[#107569]" />
                Amounts & Tax Breakdown
              </span>
              <button
                type="button"
                onClick={applyGst}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#107569] text-white text-[11px] font-semibold hover:bg-[#0e6359] transition shadow-2xs"
              >
                + Apply 18% GST
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Subtotal (₹)</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={form.subTotal}
                  onChange={(e) => {
                    const sub = e.target.value;
                    const tax = form.taxAmount ? Number(form.taxAmount) : 0;
                    setForm((prev) => ({
                      ...prev,
                      subTotal: sub,
                      totalAmount: sub ? String(Number(sub) + tax) : '',
                    }));
                  }}
                  className="h-9 text-xs rounded-xl border-[#E2E8E5] bg-white font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Tax Amount (₹)</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={form.taxAmount}
                  onChange={(e) => {
                    const tax = e.target.value;
                    const sub = form.subTotal ? Number(form.subTotal) : 0;
                    setForm((prev) => ({
                      ...prev,
                      taxAmount: tax,
                      totalAmount: tax ? String(sub + Number(tax)) : String(sub),
                    }));
                  }}
                  className="h-9 text-xs rounded-xl border-[#E2E8E5] bg-white font-mono"
                />
              </div>
            </div>

            <div className="space-y-1 pt-1">
              <label className="text-xs font-bold text-[#163A2E]">
                Total Amount (₹) <span className="text-rose-500">*</span>
              </label>
              <Input
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                value={form.totalAmount}
                onChange={(e) => setForm((prev) => ({ ...prev, totalAmount: e.target.value }))}
                className="h-10 text-sm font-bold font-mono rounded-xl border-[#107569] bg-white text-[#163A2E]"
              />
            </div>
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#163A2E]">Invoice Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
              className="w-full h-10 rounded-xl border border-[#E2E8E5] bg-white px-3 text-xs font-semibold text-[#163A2E] focus:outline-hidden"
            >
              <option value="PENDING">PENDING - Awaiting Payment</option>
              <option value="PAID">PAID - Fully Cleared</option>
              <option value="DRAFT">DRAFT - Unissued</option>
              <option value="OVERDUE">OVERDUE - Grace Expired</option>
              <option value="CANCELLED">CANCELLED - Voided</option>
            </select>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#163A2E]">Notes / Payment Remarks</label>
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="e.g. Monthly subscription payment for Standard Plan..."
              className="w-full rounded-xl border border-[#E2E8E5] bg-white p-3 text-xs text-slate-700 focus:border-[#107569] focus:outline-hidden"
            />
          </div>

          {/* Drawer Actions */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#E2E8E5]">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateDrawerOpen(false)}
              className="h-10 rounded-xl border-[#E2E8E5] text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={actionLoading}
              className="h-10 rounded-xl bg-[#107569] px-5 text-xs font-semibold text-white hover:bg-[#0e6359] shadow-xs"
            >
              {actionLoading ? 'Creating...' : 'Save & Issue Invoice'}
            </Button>
          </div>
        </form>
      </SlideOverDrawer>

      {/* ── 8. SlideOver Drawer: View Invoice Details ──────────────── */}
      <SlideOverDrawer
        open={detailDrawerOpen}
        onOpenChange={setDetailDrawerOpen}
        title={selectedInvoice?.invoiceNo || 'Invoice Details'}
        description="Detailed billing ledger and payment metadata."
      >
        {selectedInvoice && (
          <div className="space-y-5 p-1 text-xs">
            {/* Header Card */}
            <div className="p-4 rounded-2xl bg-[#F4F9F6] border border-[#E2E8E5] space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm font-bold text-[#163A2E]">
                  {selectedInvoice.invoiceNo || selectedInvoice.invoiceNumber}
                </span>
                {getStatusBadge(selectedInvoice.status)}
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-600">
                <div>
                  <span className="text-[11px] text-slate-400 block font-semibold">ISSUE DATE</span>
                  <span className="font-medium text-[#163A2E]">{formatDate(selectedInvoice.issueDate)}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block font-semibold">DUE DATE</span>
                  <span className="font-medium text-[#163A2E]">{formatDate(selectedInvoice.dueDate)}</span>
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
                <p className="text-sm font-bold text-[#163A2E]">
                  {selectedInvoice.customerName || selectedInvoice.clientName || 'General Customer'}
                </p>
                {selectedInvoice.clientName && (
                  <p className="text-slate-500">Contact: {selectedInvoice.clientName}</p>
                )}
                {selectedInvoice.planName && (
                  <div className="pt-1">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold text-[11px]">
                      <Layers className="size-3" />
                      Plan: {selectedInvoice.planName}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Financial Breakdown */}
            <div className="p-4 rounded-2xl border border-[#E2E8E5] bg-white space-y-3">
              <h5 className="font-bold text-[#163A2E] flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                <Receipt className="size-3.5 text-[#107569]" />
                Financial Breakdown
              </h5>
              <div className="space-y-2 border-b border-[#E2E8E5] pb-3 text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-mono">{inr(selectedInvoice.subTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (GST 18%):</span>
                  <span className="font-mono">{inr(selectedInvoice.taxAmount)}</span>
                </div>
              </div>
              <div className="flex justify-between text-sm font-bold text-[#163A2E] pt-1">
                <span>Total Amount:</span>
                <span className="font-mono text-base text-[#107569]">{inr(selectedInvoice.totalAmount)}</span>
              </div>
            </div>

            {/* Notes / Details */}
            {selectedInvoice.notes && (
              <div className="p-4 rounded-2xl border border-[#E2E8E5] bg-white space-y-1">
                <h5 className="font-bold text-[#163A2E] uppercase text-[11px] tracking-wider">
                  Remarks & Notes
                </h5>
                <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {selectedInvoice.notes}
                </p>
              </div>
            )}

            {/* Quick Status Toggle */}
            <div className="p-4 rounded-2xl border border-[#E2E8E5] bg-[#F4F9F6] space-y-2">
              <label className="font-bold text-[#163A2E] block text-[11px] uppercase tracking-wider">
                Update Status
              </label>
              <div className="flex flex-wrap gap-1.5">
                {['PAID', 'PENDING', 'OVERDUE', 'DRAFT', 'CANCELLED'].map((st) => (
                  <button
                    key={st}
                    onClick={() => handleStatusChange(selectedInvoice, st)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                      selectedInvoice.status === st
                        ? 'bg-[#107569] text-white shadow-2xs'
                        : 'bg-white border border-[#E2E8E5] text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-3">
              <Button
                onClick={() => handleDownloadPdf(selectedInvoice)}
                className="flex-1 h-10 rounded-xl bg-[#107569] text-white hover:bg-[#0e6359] font-semibold text-xs gap-1.5"
              >
                <Download className="size-3.5" />
                Download Tax Invoice
              </Button>
              {allowed && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setInvoiceToDelete(selectedInvoice);
                    setDeleteConfirmOpen(true);
                  }}
                  className="h-10 rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold px-3"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              )}
            </div>
          </div>
        )}
      </SlideOverDrawer>

      {/* ── 9. Confirmation Dialogs ───────────────────────────────── */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Permanently Delete Invoice?"
        description={`You are about to permanently delete invoice ${
          invoiceToDelete?.invoiceNo || invoiceToDelete?.id
        }. This action removes the billing record and cannot be undone.`}
        confirmLabel={actionLoading ? 'Deleting...' : 'Permanently Delete'}
        variant="destructive"
        onConfirm={handleDeleteInvoice}
      />

      <ConfirmDialog
        open={bulkDeleteConfirmOpen}
        onOpenChange={setBulkDeleteConfirmOpen}
        title="Permanently Delete Invoices?"
        description={`You are about to permanently delete ${selectedIds.length} selected invoice(s). This action cannot be undone.`}
        confirmLabel={actionLoading ? 'Deleting...' : 'Delete Selected'}
        variant="destructive"
        onConfirm={handleBulkDelete}
      />
    </div>
  );
}
