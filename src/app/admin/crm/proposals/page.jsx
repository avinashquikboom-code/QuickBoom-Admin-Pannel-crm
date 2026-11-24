'use client';

import * as React from 'react';
import Link from 'next/link';
import api from '../../../../../lib/api';
import { PageTitleCard } from '@/components/common/PageTitleCard';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Badge } from '@/components/common/Badge';
import { toast } from '@/hooks/use-toast';
import { crmError } from '@/modules/crm/crm-api';
import {
  FileText,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Search,
  Download,
  RefreshCw,
  Eye,
  ExternalLink,
  Mail,
  MessageSquare,
  Calendar,
  X,
  IndianRupee,
  Layers,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Filter,
  Check,
  Send,
  Building2,
  User,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';

const STATUS_CONFIG = {
  SENT: { label: 'Sent', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  DELIVERED: { label: 'Delivered', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  DRAFT: { label: 'Draft', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  PENDING: { label: 'Pending', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  PARTIAL: { label: 'Partial', bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
  FAILED: { label: 'Failed', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  ACCEPTED: { label: 'Accepted', bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-300' },
  REJECTED: { label: 'Rejected', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
};

function formatCurrency(amount) {
  if (amount == null || isNaN(amount)) return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ProposalHistoryPage() {
  const [rows, setRows] = React.useState([]);
  const [meta, setMeta] = React.useState({ page: 1, total: 0, limit: 20 });
  const [filters, setFilters] = React.useState({
    search: '',
    type: '',
    status: '',
    startDate: '',
    endDate: '',
  });
  const [page, setPage] = React.useState(1);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState('');
  const [selectedProposal, setSelectedProposal] = React.useState(null);
  const [downloadingId, setDownloadingId] = React.useState(null);

  const fetchProposals = React.useCallback(
    async (isManualRefresh = false) => {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);
      setError('');

      try {
        const params = {
          page,
          limit: 20,
        };
        if (filters.search?.trim()) params.search = filters.search.trim();
        if (filters.type) params.type = filters.type;
        if (filters.status) params.status = filters.status;
        if (filters.startDate) params.startDate = filters.startDate;
        if (filters.endDate) params.endDate = filters.endDate;

        const result = await api.get('/admin/leads/plan-proposals', { params });
        const body =
          result?.data && !Array.isArray(result.data) && result.data.data
            ? result.data
            : result?.data || result;

        const list = Array.isArray(body?.data) ? body.data : Array.isArray(body) ? body : [];
        setRows(list);
        setMeta(body?.meta || { page, total: list.length, limit: 20 });
      } catch (err) {
        setError(crmError(err));
        toast.error('Failed to load proposals history.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [filters, page]
  );

  React.useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  const updateFilter = (field, value) => {
    setPage(1);
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleResetFilters = () => {
    setPage(1);
    setFilters({
      search: '',
      type: '',
      status: '',
      startDate: '',
      endDate: '',
    });
  };

  const hasActiveFilters = Boolean(
    filters.search || filters.type || filters.status || filters.startDate || filters.endDate
  );

  const handleDownloadPdf = async (row, event) => {
    if (event) event.stopPropagation();
    setDownloadingId(row.id);
    try {
      const blob = await api.get(`/admin/leads/${row.leadId}/plan-proposals/${row.id}/pdf`, {
        responseType: 'blob',
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `proposal-${row.leadId}-v${row.version || 1}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      toast.success(`Proposal PDF (v${row.version || 1}) downloaded successfully.`);
    } catch (err) {
      toast.error(crmError(err) || 'Unable to download proposal PDF.');
    } finally {
      setDownloadingId(null);
    }
  };

  // KPI Calculations
  const stats = React.useMemo(() => {
    const total = meta.total || rows.length;
    let sentCount = 0;
    let draftCount = 0;
    let failedCount = 0;

    rows.forEach((r) => {
      const s = String(r.status || '').toUpperCase();
      const es = String(r.emailStatus || '').toUpperCase();
      const ws = String(r.whatsappStatus || '').toUpperCase();

      if (s === 'SENT' || es === 'SENT' || ws === 'SENT' || s === 'DELIVERED') {
        sentCount += 1;
      } else if (s === 'DRAFT' || s === 'PENDING') {
        draftCount += 1;
      } else if (s === 'FAILED' || es === 'FAILED' || ws === 'FAILED' || s === 'PARTIAL') {
        failedCount += 1;
      }
    });

    return {
      total,
      sentCount,
      draftCount,
      failedCount,
    };
  }, [rows, meta.total]);

  const totalPages = Math.max(1, Math.ceil((meta.total || 0) / (meta.limit || 20)));

  return (
    <div className="w-full space-y-6 pb-20">
      {/* ── 1. Page Title Header ────────────────────────────────────────── */}
      <PageTitleCard
        moduleName="CRM"
        breadcrumb="Proposals"
        title="Proposal History"
        description="Audit, inspect, and download client business proposals and multi-channel delivery logs."
        icon={FileText}
        badge={`${meta.total || 0} Total Proposals`}
        badgeVariant="green"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin/crm/leads"
              className="inline-flex items-center gap-1.5 h-9 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:border-emerald-200 hover:text-[#173D30] transition-colors shadow-2xs"
            >
              <Users className="size-3.5 text-slate-500" />
              <span>View Leads</span>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchProposals(true)}
              disabled={refreshing}
              className="h-9 gap-1.5 rounded-xl border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50"
            >
              <RefreshCw className={`size-3.5 text-slate-500 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
          </div>
        }
      />

      {/* ── 2. KPI Summary Cards ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Proposals */}
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-xs transition-all hover:border-emerald-300 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Proposals
            </span>
            <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-50 text-[#16A34A] ring-1 ring-emerald-200/60">
              <FileText className="size-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black tracking-tight text-slate-900">
              {stats.total}
            </span>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md">
              Catalog
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Generated client proposal records</p>
        </div>

        {/* Successfully Sent */}
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-xs transition-all hover:border-emerald-300 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Delivered Proposals
            </span>
            <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/60">
              <CheckCircle2 className="size-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black tracking-tight text-emerald-700">
              {stats.sentCount}
            </span>
            <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">
              Delivered
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Dispatched via Email or WhatsApp</p>
        </div>

        {/* Drafts */}
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-xs transition-all hover:border-amber-300 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Draft Proposals
            </span>
            <div className="flex size-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600 ring-1 ring-amber-200/60">
              <Clock className="size-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black tracking-tight text-slate-900">
              {stats.draftCount}
            </span>
            <span className="text-[11px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md">
              In Draft
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Pending review or client sending</p>
        </div>

        {/* Action Needed / Failed */}
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-xs transition-all hover:border-rose-300 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Delivery Issues
            </span>
            <div className="flex size-8 items-center justify-center rounded-xl bg-rose-50 text-rose-600 ring-1 ring-rose-200/60">
              <AlertTriangle className="size-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black tracking-tight text-slate-900">
              {stats.failedCount}
            </span>
            <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-md">
              Attention
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Failed delivery or partial dispatch</p>
        </div>
      </div>

      {/* ── 3. Filters Toolbar ──────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs">
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-5">
          {/* Search Input */}
          <div className="relative md:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              aria-label="Search proposals"
              placeholder="Search plan, company, or lead name…"
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="h-9 rounded-xl border-slate-200 bg-slate-50/70 pl-9 text-xs focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-[#16A34A]"
            />
            {filters.search && (
              <button
                type="button"
                onClick={() => updateFilter('search', '')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Type Filter */}
          <div>
            <select
              aria-label="Proposal type"
              value={filters.type}
              onChange={(e) => updateFilter('type', e.target.value)}
              className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-xs font-medium text-slate-700 outline-none transition focus:border-[#16A34A] focus:bg-white focus:ring-1 focus:ring-[#16A34A]"
            >
              <option value="">All Types</option>
              <option value="DEFAULT">Standard Plan</option>
              <option value="CUSTOM">Custom Proposal</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              aria-label="Proposal status"
              value={filters.status}
              onChange={(e) => updateFilter('status', e.target.value)}
              className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-xs font-medium text-slate-700 outline-none transition focus:border-[#16A34A] focus:bg-white focus:ring-1 focus:ring-[#16A34A]"
            >
              <option value="">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="SENT">Sent / Delivered</option>
              <option value="PARTIAL">Partial Delivery</option>
              <option value="FAILED">Failed</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          {/* Reset Filters / Date range toggle */}
          <div className="flex items-center gap-2">
            {hasActiveFilters ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetFilters}
                className="h-9 w-full gap-1.5 rounded-xl border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                <RotateCcw className="size-3" />
                <span>Reset Filters</span>
              </Button>
            ) : (
              <div className="flex w-full items-center justify-center text-xs text-slate-400 font-medium">
                {meta.total} result{meta.total === 1 ? '' : 's'}
              </div>
            )}
          </div>
        </div>

        {/* Date Filters Row */}
        <div className="mt-2.5 flex flex-wrap items-center gap-2 pt-2.5 border-t border-slate-100">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Created Date:
          </span>
          <div className="flex items-center gap-1.5">
            <Input
              type="date"
              aria-label="Start date"
              value={filters.startDate}
              onChange={(e) => updateFilter('startDate', e.target.value)}
              className="h-8 w-36 rounded-lg border-slate-200 text-xs text-slate-700"
            />
            <span className="text-xs text-slate-400">to</span>
            <Input
              type="date"
              aria-label="End date"
              value={filters.endDate}
              onChange={(e) => updateFilter('endDate', e.target.value)}
              className="h-8 w-36 rounded-lg border-slate-200 text-xs text-slate-700"
            />
          </div>
          {(filters.startDate || filters.endDate) && (
            <button
              type="button"
              onClick={() => {
                updateFilter('startDate', '');
                updateFilter('endDate', '');
              }}
              className="text-xs text-slate-500 hover:text-slate-800 underline ml-1"
            >
              Clear dates
            </button>
          )}
        </div>
      </div>

      {/* ── 4. Proposals Table Card ─────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        {error && (
          <div className="border-b border-rose-100 bg-rose-50/80 p-3 text-xs font-medium text-rose-700">
            {error}
          </div>
        )}

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                <th className="py-3 pl-4 pr-3">Proposal & Version</th>
                <th className="py-3 px-3">Lead / Client</th>
                <th className="py-3 px-3">Plan Amount</th>
                <th className="py-3 px-3">Delivery Status</th>
                <th className="py-3 px-3">Created</th>
                <th className="py-3 pl-3 pr-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-slate-400">
                    <RefreshCw className="mx-auto mb-2 size-5 animate-spin text-emerald-600" />
                    Loading proposal records…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 mb-3">
                      <FileText className="size-6" />
                    </div>
                    <p className="text-sm font-semibold text-slate-800">No proposals found</p>
                    <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                      {hasActiveFilters
                        ? 'Try clearing search filters or adjusting the date range.'
                        : 'No proposal records have been created yet. Open any Lead in the CRM to generate proposals.'}
                    </p>
                    {hasActiveFilters ? (
                      <Button
                        size="sm"
                        onClick={handleResetFilters}
                        className="mt-3.5 h-8 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200"
                      >
                        Reset Filters
                      </Button>
                    ) : (
                      <Link
                        href="/admin/crm/leads"
                        className="inline-flex items-center gap-1.5 mt-3.5 h-8 rounded-xl bg-[#16A34A] px-3.5 text-xs font-semibold text-white shadow-xs hover:bg-[#15803D]"
                      >
                        <Users className="size-3.5" />
                        <span>Go to Leads</span>
                      </Link>
                    )}
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const statusKey = String(row.status || 'DRAFT').toUpperCase();
                  const statusStyle = STATUS_CONFIG[statusKey] || STATUS_CONFIG.DRAFT;
                  const emailKey = String(row.emailStatus || 'PENDING').toUpperCase();
                  const emailStyle = STATUS_CONFIG[emailKey] || STATUS_CONFIG.PENDING;
                  const waKey = String(row.whatsappStatus || 'PENDING').toUpperCase();
                  const waStyle = STATUS_CONFIG[waKey] || STATUS_CONFIG.PENDING;

                  const clientName =
                    row.lead?.companyName ||
                    [row.lead?.firstName, row.lead?.lastName].filter(Boolean).join(' ') ||
                    `Lead #${row.leadId}`;

                  const createdByName =
                    [row.createdBy?.firstName, row.createdBy?.lastName].filter(Boolean).join(' ') ||
                    'System';

                  return (
                    <tr
                      key={row.id}
                      onClick={() => setSelectedProposal(row)}
                      className="transition-colors hover:bg-slate-50/80 cursor-pointer"
                    >
                      {/* Proposal & Version */}
                      <td className="py-3 pl-4 pr-3">
                        <div className="flex items-center gap-2">
                          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-[#16A34A] border border-emerald-100">
                            <FileText className="size-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 hover:text-[#16A34A] transition-colors">
                                {row.planName || 'Plan Proposal'}
                              </span>
                              <span className="rounded-md bg-slate-100 px-1.5 py-0.2 text-[10px] font-bold text-slate-600">
                                v{row.version || 1}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span
                                className={`rounded px-1.5 py-0.2 text-[10px] font-semibold border ${
                                  row.proposalType === 'CUSTOM'
                                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                                    : 'bg-blue-50 text-blue-700 border-blue-200'
                                }`}
                              >
                                {row.proposalType === 'CUSTOM' ? 'Custom' : 'Standard'}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                ID #{row.id}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Lead / Client */}
                      <td className="py-3 px-3">
                        <div>
                          <p className="font-semibold text-slate-900">{clientName}</p>
                          <Link
                            href={`/admin/crm/leads`}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-[11px] text-[#16A34A] hover:underline"
                          >
                            <span>Lead #{row.leadId}</span>
                            <ExternalLink className="size-2.5" />
                          </Link>
                        </div>
                      </td>

                      {/* Plan Amount */}
                      <td className="py-3 px-3">
                        <div>
                          <p className="font-black text-slate-900">
                            {formatCurrency(row.planPrice)}
                          </p>
                          {Boolean(row.discount && Number(row.discount) > 0) && (
                            <span className="text-[10px] text-emerald-600 font-semibold">
                              Disc: {formatCurrency(row.discount)}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Delivery Status */}
                      <td className="py-3 px-3">
                        <div className="space-y-1">
                          {/* Overall Status */}
                          <span
                            className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-bold border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
                          >
                            {statusStyle.label}
                          </span>

                          {/* Channel indicators */}
                          <div className="flex items-center gap-2 text-[10px] text-slate-500">
                            <span
                              className={`flex items-center gap-0.5 ${
                                emailKey === 'SENT' || emailKey === 'DELIVERED'
                                  ? 'text-emerald-600 font-semibold'
                                  : emailKey === 'FAILED'
                                  ? 'text-rose-600 font-semibold'
                                  : 'text-slate-400'
                              }`}
                              title={`Email: ${emailKey}`}
                            >
                              <Mail className="size-3" />
                              <span>{emailKey}</span>
                            </span>
                            <span>·</span>
                            <span
                              className={`flex items-center gap-0.5 ${
                                waKey === 'SENT' || waKey === 'DELIVERED'
                                  ? 'text-emerald-600 font-semibold'
                                  : waKey === 'FAILED'
                                  ? 'text-rose-600 font-semibold'
                                  : 'text-slate-400'
                              }`}
                              title={`WhatsApp: ${waKey}`}
                            >
                              <MessageSquare className="size-3" />
                              <span>{waKey}</span>
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Created By & Date */}
                      <td className="py-3 px-3">
                        <div>
                          <p className="text-slate-800 font-medium">{formatDate(row.createdAt)}</p>
                          <p className="text-[11px] text-slate-400">By: {createdByName}</p>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 pl-3 pr-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedProposal(row);
                            }}
                            className="h-8 gap-1 rounded-xl border-slate-200 px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            <Eye className="size-3" />
                            <span>Details</span>
                          </Button>
                          <Button
                            size="sm"
                            disabled={downloadingId === row.id}
                            onClick={(e) => handleDownloadPdf(row, e)}
                            className="h-8 gap-1 rounded-xl bg-[#16A34A] px-2.5 text-xs font-semibold text-white hover:bg-[#15803D]"
                          >
                            <Download
                              className={`size-3 ${
                                downloadingId === row.id ? 'animate-spin' : ''
                              }`}
                            />
                            <span>PDF</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards View (< 768px) */}
        <div className="block md:hidden divide-y divide-slate-100">
          {loading ? (
            <div className="py-10 text-center text-xs text-slate-400">
              <RefreshCw className="mx-auto mb-2 size-5 animate-spin text-emerald-600" />
              Loading proposals…
            </div>
          ) : rows.length === 0 ? (
            <div className="py-10 text-center px-4">
              <FileText className="mx-auto mb-2 size-6 text-slate-400" />
              <p className="text-sm font-semibold text-slate-800">No proposals found</p>
              <p className="mt-1 text-xs text-slate-500">Try adjusting your filters.</p>
            </div>
          ) : (
            rows.map((row) => {
              const statusKey = String(row.status || 'DRAFT').toUpperCase();
              const statusStyle = STATUS_CONFIG[statusKey] || STATUS_CONFIG.DRAFT;
              const clientName =
                row.lead?.companyName ||
                [row.lead?.firstName, row.lead?.lastName].filter(Boolean).join(' ') ||
                `Lead #${row.leadId}`;

              return (
                <div
                  key={row.id}
                  onClick={() => setSelectedProposal(row)}
                  className="p-4 space-y-3 active:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-slate-900">
                          {row.planName || 'Plan Proposal'}
                        </span>
                        <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[10px] font-bold text-slate-600">
                          v{row.version || 1}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">{clientName}</p>
                    </div>
                    <span
                      className={`rounded-md px-2 py-0.5 text-[10px] font-bold border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
                    >
                      {statusStyle.label}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                    <div>
                      <span className="text-slate-400 text-[11px]">Investment: </span>
                      <span className="font-black text-slate-900">{formatCurrency(row.planPrice)}</span>
                    </div>
                    <div className="text-slate-500 text-[11px]">
                      {formatDate(row.createdAt)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProposal(row);
                      }}
                      className="flex-1 h-8 text-xs font-semibold"
                    >
                      <Eye className="size-3 mr-1" />
                      Details
                    </Button>
                    <Button
                      size="sm"
                      disabled={downloadingId === row.id}
                      onClick={(e) => handleDownloadPdf(row, e)}
                      className="flex-1 h-8 bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-semibold"
                    >
                      <Download className={`size-3 mr-1 ${downloadingId === row.id ? 'animate-spin' : ''}`} />
                      PDF
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ── 5. Pagination Footer ────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/60 px-4 py-3 text-xs text-slate-600">
          <div>
            Showing{' '}
            <span className="font-semibold text-slate-900">
              {rows.length > 0 ? (page - 1) * meta.limit + 1 : 0}
            </span>{' '}
            to{' '}
            <span className="font-semibold text-slate-900">
              {Math.min(page * meta.limit, meta.total || 0)}
            </span>{' '}
            of <span className="font-semibold text-slate-900">{meta.total || 0}</span> proposals
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="h-8 gap-1 rounded-xl border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50"
            >
              <ChevronLeft className="size-3.5" />
              <span>Previous</span>
            </Button>
            <span className="px-2 font-medium text-slate-700">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
              className="h-8 gap-1 rounded-xl border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50"
            >
              <span>Next</span>
              <ChevronRight className="size-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* ── 6. Proposal Details Slide-Over Drawer ────────────────────────── */}
      {selectedProposal && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in">
          <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
            <div className="w-screen max-w-xl bg-white shadow-2xl flex flex-col">
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50/70">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-100 text-[#16A34A]">
                    <FileText className="size-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-slate-900">
                        {selectedProposal.planName || 'Proposal Details'}
                      </h2>
                      <span className="rounded-md bg-slate-200 px-1.5 py-0.5 text-xs font-bold text-slate-700">
                        v{selectedProposal.version || 1}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Proposal ID #{selectedProposal.id} · Created {formatDate(selectedProposal.createdAt)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedProposal(null)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
                >
                  <X className="size-5" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* 1. Client / Lead Info */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Client Information
                    </span>
                    <Link
                      href="/admin/crm/leads"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#16A34A] hover:underline"
                    >
                      <span>View Lead #{selectedProposal.leadId}</span>
                      <ExternalLink className="size-3" />
                    </Link>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400">Company / Account</span>
                      <p className="font-semibold text-slate-900 mt-0.5">
                        {selectedProposal.lead?.companyName || '—'}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400">Contact Person</span>
                      <p className="font-semibold text-slate-900 mt-0.5">
                        {[selectedProposal.lead?.firstName, selectedProposal.lead?.lastName]
                          .filter(Boolean)
                          .join(' ') || '—'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2. Proposal Financials & Configuration */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Pricing & Commercials
                  </span>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400">Plan Name</span>
                      <p className="font-bold text-slate-900 mt-0.5">
                        {selectedProposal.planName || 'Standard Package'}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400">Proposal Type</span>
                      <p className="font-bold text-slate-900 mt-0.5">
                        {selectedProposal.proposalType === 'CUSTOM' ? 'Custom Scope' : 'Standard Catalog'}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400">Investment Amount</span>
                      <p className="text-base font-black text-slate-900 mt-0.5">
                        {formatCurrency(selectedProposal.planPrice)}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400">Discount Offered</span>
                      <p className="font-bold text-emerald-700 mt-0.5">
                        {selectedProposal.discount ? formatCurrency(selectedProposal.discount) : 'None'}
                      </p>
                    </div>
                    {selectedProposal.validUntil && (
                      <div className="col-span-2">
                        <span className="text-slate-400">Validity Period</span>
                        <p className="font-medium text-slate-700 mt-0.5">
                          Valid until {formatDate(selectedProposal.validUntil)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Delivery Channels Logs */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Multi-Channel Delivery Status
                  </span>
                  <div className="space-y-3 text-xs">
                    {/* Email Delivery */}
                    <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Mail className="size-4 text-slate-600" />
                          <span className="font-semibold text-slate-900">Email Delivery</span>
                        </div>
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-bold border ${
                            STATUS_CONFIG[selectedProposal.emailStatus]?.bg || 'bg-slate-100'
                          } ${STATUS_CONFIG[selectedProposal.emailStatus]?.text || 'text-slate-700'}`}
                        >
                          {selectedProposal.emailStatus || 'PENDING'}
                        </span>
                      </div>
                      {selectedProposal.emailSentAt && (
                        <p className="text-[11px] text-slate-500 mt-1.5">
                          Sent: {formatDateTime(selectedProposal.emailSentAt)}
                        </p>
                      )}
                      {selectedProposal.emailError && (
                        <div className="mt-2 rounded bg-rose-50 border border-rose-200 p-2 text-rose-700 text-[11px]">
                          <strong>Error: </strong> {selectedProposal.emailError}
                        </div>
                      )}
                    </div>

                    {/* WhatsApp Delivery */}
                    <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="size-4 text-emerald-600" />
                          <span className="font-semibold text-slate-900">WhatsApp Delivery</span>
                        </div>
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-bold border ${
                            STATUS_CONFIG[selectedProposal.whatsappStatus]?.bg || 'bg-slate-100'
                          } ${STATUS_CONFIG[selectedProposal.whatsappStatus]?.text || 'text-slate-700'}`}
                        >
                          {selectedProposal.whatsappStatus || 'PENDING'}
                        </span>
                      </div>
                      {selectedProposal.whatsappSentAt && (
                        <p className="text-[11px] text-slate-500 mt-1.5">
                          Sent: {formatDateTime(selectedProposal.whatsappSentAt)}
                        </p>
                      )}
                      {selectedProposal.whatsappError && (
                        <div className="mt-2 rounded bg-rose-50 border border-rose-200 p-2 text-rose-700 text-[11px]">
                          <strong>Error: </strong> {selectedProposal.whatsappError}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 4. Requirements & Scope */}
                {selectedProposal.customerRequirements && (
                  <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Customer Requirements & Notes
                    </span>
                    <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed bg-slate-50 rounded-lg p-3">
                      {selectedProposal.customerRequirements}
                    </p>
                  </div>
                )}
              </div>

              {/* Drawer Footer */}
              <div className="border-t border-slate-200 p-4 bg-slate-50/70 flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedProposal(null)}
                  className="h-9 rounded-xl border-slate-200 text-xs font-semibold text-slate-700"
                >
                  Close
                </Button>
                <Button
                  size="sm"
                  disabled={downloadingId === selectedProposal.id}
                  onClick={(e) => handleDownloadPdf(selectedProposal, e)}
                  className="h-9 gap-1.5 rounded-xl bg-[#16A34A] px-4 text-xs font-semibold text-white hover:bg-[#15803D]"
                >
                  <Download
                    className={`size-3.5 ${
                      downloadingId === selectedProposal.id ? 'animate-spin' : ''
                    }`}
                  />
                  <span>Download Proposal PDF</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
