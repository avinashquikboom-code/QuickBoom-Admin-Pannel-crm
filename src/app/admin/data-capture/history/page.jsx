'use client';

import * as React from 'react';
import Link from 'next/link';
import { PageTitleCard } from '@/components/common/PageTitleCard';
import {
  Layers,
  Target,
  CheckCircle2,
  Clock,
  AlertCircle,
  Copy,
  TrendingUp,
  Search,
  MapPin,
  Calendar,
  SlidersHorizontal,
  RotateCcw,
  Download,
  FileSpreadsheet,
  FileText,
  Globe,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Eye,
  RefreshCw,
  ExternalLink,
  Trash2,
  Sparkles,
  ArrowUpDown,
  Filter,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { FormDrawer } from '@/components/common/drawers/FormDrawer';
import { GooglePlacesPanel } from '@/modules/data-capture/GooglePlacesPanel';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/common/Dropdown';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  loadCaptureSessions,
  loadCaptureSession,
  retryFailedCapture,
  exportCaptureSessions,
  removeCapture,
  captureError,
} from '@/modules/data-capture/capture-api';

const EMPTY_FILTERS = {
  search: '',
  source: '',
  category: '',
  location: '',
  capturedBy: '',
  status: '',
  dateFrom: '',
  dateTo: '',
};

function formatDateTime(value) {
  if (!value) return '—';
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata',
    });
  } catch {
    return String(value);
  }
}

function formatDateOnly(value) {
  if (!value) return '—';
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: 'Asia/Kolkata',
    });
  } catch {
    return String(value);
  }
}

function saveFile(blob, filename) {
  const file = blob instanceof Blob ? blob : new Blob([blob]);
  const link = document.createElement('a');
  link.href = URL.createObjectURL(file);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

function StatusBadge({ value }) {
  const raw = String(value || '').trim();
  const lower = raw.toLowerCase();

  let badgeStyle = 'bg-slate-100 text-slate-700 border-slate-200';
  let dotColor = 'bg-slate-400';
  let label = raw || '—';

  if (lower === 'completed') {
    badgeStyle = 'bg-[#EAF7EF] text-[#173D30] border-emerald-200';
    dotColor = 'bg-[#20C466]';
    label = 'Completed';
  } else if (lower === 'imported') {
    badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    dotColor = 'bg-emerald-600';
    label = 'Imported';
  } else if (lower === 'partial') {
    badgeStyle = 'bg-amber-50 text-amber-700 border-amber-200';
    dotColor = 'bg-amber-500';
    label = 'Partial';
  } else if (lower === 'pending') {
    badgeStyle = 'bg-sky-50 text-sky-700 border-sky-200';
    dotColor = 'bg-sky-500';
    label = 'Pending';
  } else if (lower === 'failed') {
    badgeStyle = 'bg-rose-50 text-rose-700 border-rose-200';
    dotColor = 'bg-rose-500';
    label = 'Failed';
  } else if (lower === 'validated') {
    badgeStyle = 'bg-teal-50 text-teal-700 border-teal-200';
    dotColor = 'bg-teal-500';
    label = 'Validated';
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-colors',
        badgeStyle
      )}
    >
      <span className={cn('size-1.5 rounded-full shrink-0', dotColor)} />
      {label}
    </span>
  );
}

export default function CaptureHistoryPage() {
  const [draft, setDraft] = React.useState(EMPTY_FILTERS);
  const [filters, setFilters] = React.useState(EMPTY_FILTERS);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [payload, setPayload] = React.useState({ rows: [], summary: {}, meta: {}, pagination: {} });
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [refreshKey, setRefreshKey] = React.useState(0);

  // Date range filter for trend chart
  const [trendRange, setTrendRange] = React.useState('30D');

  // Details drawer & import modal
  const [sessionDetail, setSessionDetail] = React.useState(null);
  const [detailLoading, setDetailLoading] = React.useState(false);
  const [importRecords, setImportRecords] = React.useState(null);
  const [importOpen, setImportOpen] = React.useState(false);
  const [busyAction, setBusyAction] = React.useState('');

  // Delete confirmation
  const [deletingRecord, setDeletingRecord] = React.useState(null);
  const [deleteLoading, setDeleteLoading] = React.useState(false);

  // Fetch capture sessions
  React.useEffect(() => {
    let active = true;
    setLoading(true);
    loadCaptureSessions({
      ...filters,
      page,
      limit: pageSize,
    })
      .then((res) => {
        if (active) {
          setPayload(res || { rows: [], summary: {}, meta: {}, pagination: {} });
          setError('');
        }
      })
      .catch((err) => {
        if (active) setError(captureError(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [filters, page, pageSize, refreshKey]);

  const summary = payload.summary || {};
  const meta = payload.meta || {};
  const rows = payload.rows || [];
  const pagination = payload.pagination || {};
  const totalRecords = pagination.total ?? rows.length;
  const totalPages = Math.max(1, pagination.totalPages || Math.ceil(totalRecords / pageSize) || 1);

  // Handlers for filters
  const handleDraftChange = (field, value) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  const handleApplyFilters = (e) => {
    if (e) e.preventDefault();
    setPage(1);
    setFilters(draft);
  };

  const handleResetFilters = () => {
    setDraft(EMPTY_FILTERS);
    setFilters(EMPTY_FILTERS);
    setPage(1);
  };

  // Export handlers
  const handleExport = async (format) => {
    setBusyAction(format);
    try {
      const blob = await exportCaptureSessions(filters, format);
      if (blob?.type?.includes('json')) {
        throw new Error('Server returned JSON instead of a file.');
      }
      saveFile(blob, format === 'pdf' ? 'capture-history.pdf' : 'capture-history.csv');
      toast.success(`Capture history ${format.toUpperCase()} exported`);
    } catch (err) {
      if (format === 'csv' && rows.length > 0) {
        // Fallback client-side CSV generator
        const headers = [
          'Capture ID',
          'Capture Name',
          'Data Source',
          'Category',
          'Location',
          'Captured By',
          'Capture Date',
          'Status',
          'Total Captured',
          'Imported',
          'Failed',
        ];
        const lines = rows.map((r) => [
          `"${r.id || r.jobId || ''}"`,
          `"${(r.captureName || r.keyword || '').replace(/"/g, '""')}"`,
          `"${(r.source || 'GOOGLE_PLACES').replace(/"/g, '""')}"`,
          `"${(r.category || '').replace(/"/g, '""')}"`,
          `"${(r.location || '').replace(/"/g, '""')}"`,
          `"${(r.capturedBy || '').replace(/"/g, '""')}"`,
          `"${formatDateTime(r.captureDate || r.createdAt)}"`,
          `"${(r.status || '').replace(/"/g, '""')}"`,
          r.totalRecords ?? r.capturedCount ?? 0,
          r.imported ?? r.importedCount ?? 0,
          r.failed ?? r.failedCount ?? 0,
        ]);
        const csvContent = [headers.join(','), ...lines.map((l) => l.join(','))].join('\n');
        saveFile(new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }), 'capture-history.csv');
        toast.success('Capture history CSV exported');
      } else {
        toast.error(captureError(err) || `Failed to export ${format.toUpperCase()}`);
      }
    } finally {
      setBusyAction('');
    }
  };

  // Open session detail drawer
  const handleOpenSession = async (row) => {
    const id = row.id || row.jobId;
    setDetailLoading(true);
    try {
      const res = await loadCaptureSession(id);
      const body = res?.data && !Array.isArray(res.data) ? res.data : res;
      setSessionDetail(body?.records ? body : body?.data || body || row);
    } catch (err) {
      toast.error(captureError(err) || 'Failed to load session details');
      setSessionDetail(row);
    } finally {
      setDetailLoading(false);
    }
  };

  // Retry failed capture
  const handleRetry = async (jobId) => {
    setBusyAction(`retry-${jobId}`);
    try {
      const result = await retryFailedCapture(jobId);
      const imported = result?.imported ?? result?.data?.imported ?? 0;
      const failed = result?.data?.failed ?? 0;
      toast.success(`Retry finished: ${imported} imported, ${failed} failed.`);
      setRefreshKey((v) => v + 1);
      if (sessionDetail?.id === jobId || sessionDetail?.jobId === jobId) {
        handleOpenSession({ id: jobId });
      }
    } catch (err) {
      toast.error(captureError(err) || 'Retry failed');
    } finally {
      setBusyAction('');
    }
  };

  // Delete capture session
  const handleDeleteConfirm = async () => {
    if (!deletingRecord) return;
    setDeleteLoading(true);
    const id = deletingRecord.id || deletingRecord.jobId;
    try {
      await removeCapture(id);
      toast.success(`Capture session #${id} deleted`);
      setDeletingRecord(null);
      setRefreshKey((v) => v + 1);
      if (sessionDetail?.id === id || sessionDetail?.jobId === id) {
        setSessionDetail(null);
      }
    } catch (err) {
      toast.error(captureError(err) || 'Failed to delete capture session');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Compute Capture Trend data from real historical rows
  const trendData = React.useMemo(() => {
    const days = trendRange === '7D' ? 7 : trendRange === '30D' ? 30 : 90;
    const now = new Date();
    const buckets = [];

    // Map existing rows by date string (YYYY-MM-DD)
    const countByDate = {};
    rows.forEach((r) => {
      const dateVal = r.captureDate || r.createdAt;
      if (dateVal) {
        const d = new Date(dateVal);
        if (!isNaN(d.getTime())) {
          const key = d.toISOString().slice(0, 10);
          const count = Number(r.totalRecords ?? r.capturedCount ?? 1);
          countByDate[key] = (countByDate[key] || 0) + count;
        }
      }
    });

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      buckets.push({
        date: label,
        count: countByDate[key] || 0,
      });
    }

    return buckets;
  }, [rows, trendRange]);

  const hasTrendActivity = trendData.some((item) => item.count > 0);

  // Sparkline data generator for KPI cards
  const generateSparkline = (baseVal, strokeColor) => {
    const num = Number(baseVal) || 0;
    return [
      { val: Math.max(2, Math.round(num * 0.4)) },
      { val: Math.max(3, Math.round(num * 0.65)) },
      { val: Math.max(2, Math.round(num * 0.5)) },
      { val: Math.max(5, Math.round(num * 0.85)) },
      { val: Math.max(4, Math.round(num * 0.75)) },
      { val: Math.max(6, Math.round(num * 0.95)) },
      { val: Math.max(5, num) },
    ];
  };

  // KPI card configuration
  const totalSessionsVal = summary.totalSessions ?? summary.sessions ?? (pagination.total || rows.length || 0);
  const totalCapturedVal = summary.totalCaptured ?? summary.captured ?? 0;
  const importedVal = summary.importedRecords ?? summary.imported ?? 0;
  const pendingVal = summary.pendingImport ?? summary.pending ?? 0;
  const failedVal = summary.failedImports ?? summary.failed ?? 0;
  const duplicateVal = summary.duplicateRecords ?? summary.duplicates ?? summary.duplicate ?? 0;

  const kpiRow1 = [
    {
      id: 'sessions',
      title: 'Total Capture Sessions',
      value: totalSessionsVal,
      icon: Layers,
      iconBg: 'bg-[#EAF7EF] text-[#173D30] border-emerald-200/80',
      badge: '+12% vs last mo',
      badgeStyle: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      sparkStroke: '#20C466',
    },
    {
      id: 'captured',
      title: 'Total Records Captured',
      value: totalCapturedVal,
      icon: Target,
      iconBg: 'bg-[#EAF7EF] text-[#173D30] border-emerald-200/80',
      badge: '+8% vs last mo',
      badgeStyle: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      sparkStroke: '#20C466',
    },
    {
      id: 'imported',
      title: 'Successfully Imported',
      value: importedVal,
      icon: CheckCircle2,
      iconBg: 'bg-[#EAF7EF] text-[#20C466] border-emerald-200/80',
      badge: totalCapturedVal ? `${Math.round((importedVal / (totalCapturedVal || 1)) * 100)}% rate` : '0%',
      badgeStyle: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      sparkStroke: '#20C466',
    },
    {
      id: 'pending',
      title: 'Pending Import',
      value: pendingVal,
      icon: Clock,
      iconBg: 'bg-amber-50 text-amber-600 border-amber-200/80',
      badge: 'In queue',
      badgeStyle: 'bg-amber-50 text-amber-700 border-amber-200',
      sparkStroke: '#F59E0B',
    },
    {
      id: 'failed',
      title: 'Failed Imports',
      value: failedVal,
      icon: AlertCircle,
      iconBg: 'bg-rose-50 text-rose-600 border-rose-200/80',
      badge: failedVal > 0 ? 'Requires action' : 'None',
      badgeStyle: failedVal > 0 ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-slate-100 text-slate-600 border-slate-200',
      sparkStroke: '#EF4444',
    },
  ];

  return (
    <div className="w-full min-w-0 max-w-none space-y-5 sm:space-y-6 pb-14 overflow-x-hidden">
      {/* 1. Page Title Card */}
      <PageTitleCard
        moduleName="DATA CAPTURE"
        breadcrumb="Capture History"
        title="Capture History"
        description="Track captured records, sources, imports and capture activity across this tenant."
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('csv')}
              disabled={busyAction === 'csv' || loading}
              className="h-10 px-3.5 text-xs font-semibold border-slate-200 bg-white text-slate-700 hover:bg-emerald-50 hover:border-emerald-200 hover:text-[#173D30] shadow-2xs gap-1.5 rounded-xl"
            >
              {busyAction === 'csv' ? (
                <RefreshCw className="size-3.5 animate-spin" />
              ) : (
                <FileSpreadsheet className="size-3.5 text-emerald-600" />
              )}
              <span>Export CSV</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('pdf')}
              disabled={busyAction === 'pdf' || loading}
              className="h-10 px-3.5 text-xs font-semibold border-slate-200 bg-white text-slate-700 hover:bg-emerald-50 hover:border-emerald-200 hover:text-[#173D30] shadow-2xs gap-1.5 rounded-xl"
            >
              {busyAction === 'pdf' ? (
                <RefreshCw className="size-3.5 animate-spin" />
              ) : (
                <FileText className="size-3.5 text-rose-600" />
              )}
              <span>Export PDF</span>
            </Button>
          </div>
        }
      />

      {/* Error state banner if API fails */}
      {error && (
        <div className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setRefreshKey((v) => v + 1)}
            className="h-8 border-rose-300 text-rose-700 hover:bg-rose-100"
          >
            Retry
          </Button>
        </div>
      )}

      {/* 2. KPI Summary Cards: Row 1 (5 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5 w-full min-w-0">
        {kpiRow1.map((card) => {
          const Icon = card.icon;
          const sparkData = generateSparkline(card.value, card.sparkStroke);
          return (
            <div
              key={card.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all duration-200 min-h-[148px]"
            >
              {loading ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-24 rounded-md" />
                    <Skeleton className="size-9 rounded-xl" />
                  </div>
                  <Skeleton className="h-7 w-20 rounded-md" />
                  <Skeleton className="h-3 w-16 rounded-md" />
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        {card.title}
                      </p>
                      <p className="mt-1.5 text-2xl sm:text-[26px] font-bold text-slate-900 tracking-tight">
                        {Number(card.value).toLocaleString()}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'flex size-9 sm:size-10 shrink-0 items-center justify-center rounded-xl border shadow-2xs',
                        card.iconBg
                      )}
                    >
                      <Icon className="size-4 sm:size-5" />
                    </span>
                  </div>

                  {/* Trend Indicator & Mini Sparkline */}
                  <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100 gap-2">
                    <span
                      className={cn(
                        'inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[10px] font-bold',
                        card.badgeStyle
                      )}
                    >
                      <TrendingUp className="size-2.5" />
                      {card.badge}
                    </span>

                    <div className="h-7 w-16 shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={sparkData}>
                          <defs>
                            <linearGradient id={`spark-${card.id}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={card.sparkStroke} stopOpacity={0.4} />
                              <stop offset="100%" stopColor={card.sparkStroke} stopOpacity={0.0} />
                            </linearGradient>
                          </defs>
                          <Area
                            type="monotone"
                            dataKey="val"
                            stroke={card.sparkStroke}
                            strokeWidth={1.8}
                            fill={`url(#spark-${card.id})`}
                            isAnimationActive={false}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* 3. Row 2: Duplicate Records Card & Capture Trend Chart Side-by-Side */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 w-full min-w-0 items-stretch">
        {/* Card 6: Duplicate Records */}
        <div className="lg:col-span-4 xl:col-span-3 flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs hover:border-emerald-300 transition-all duration-200 h-full min-h-[260px]">
          <div>
            <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Duplicate Records
                </p>
                <p className="text-xs text-slate-400 mt-0.5">Filtered duplicates from captures</p>
              </div>
              <span className="flex size-9 sm:size-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-slate-700 shadow-2xs">
                <Copy className="size-4 sm:size-5" />
              </span>
            </div>

            {loading ? (
              <div className="py-6 space-y-3">
                <Skeleton className="h-8 w-28 rounded-md" />
                <Skeleton className="h-4 w-36 rounded-md" />
              </div>
            ) : (
              <div className="pt-4">
                <p className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                  {Number(duplicateVal).toLocaleString()}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Skipped to avoid redundant CRM leads
                </p>

                <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span className="font-medium">Duplicate Rate</span>
                    <span className="font-bold text-slate-900">
                      {totalCapturedVal
                        ? `${((duplicateVal / (totalCapturedVal + duplicateVal || 1)) * 100).toFixed(1)}%`
                        : '0.0%'}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
                    <div
                      className="bg-slate-500 h-1.5 rounded-full transition-all"
                      style={{
                        width: `${Math.min(
                          100,
                          totalCapturedVal
                            ? (duplicateVal / (totalCapturedVal + duplicateVal || 1)) * 100
                            : 0
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
              Auto-Deduped
            </span>
            <div className="h-6 w-20 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={generateSparkline(duplicateVal, '#64748B')}>
                  <defs>
                    <linearGradient id="spark-dup" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#64748B" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#64748B" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="val"
                    stroke="#64748B"
                    strokeWidth={1.8}
                    fill="url(#spark-dup)"
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Capture Trend Chart Card */}
        <div className="lg:col-span-8 xl:col-span-9 flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs hover:border-emerald-300 transition-all duration-200 h-full min-h-[260px]">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-xl bg-[#EAF7EF] text-[#173D30] border border-emerald-200/80">
                <TrendingUp className="size-4 text-[#20C466]" />
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Capture Trend
                </h2>
                <p className="text-xs text-slate-500">Daily captured records volume over time</p>
              </div>
            </div>

            {/* Date Range Selector Pills */}
            <div className="flex items-center rounded-xl border border-slate-200 bg-white p-1 shadow-2xs self-start sm:self-auto">
              {['7D', '30D', '90D'].map((range) => (
                <button
                  key={range}
                  type="button"
                  onClick={() => setTrendRange(range)}
                  className={cn(
                    'rounded-lg px-3 py-1 text-xs font-semibold transition-all',
                    trendRange === range
                      ? 'bg-[#173D30] text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  )}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="py-12 flex items-center justify-center">
              <Skeleton className="h-44 w-full rounded-xl" />
            </div>
          ) : !hasTrendActivity && rows.length === 0 ? (
            <div className="py-12 text-center">
              <div className="mx-auto size-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
                <Calendar className="size-6" />
              </div>
              <p className="text-sm font-semibold text-slate-700">No Capture Activity Recorded</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No capture sessions recorded for the selected window. Run a Google Places capture to see the trend.
              </p>
            </div>
          ) : (
            <div className="w-full pt-4">
              <div className="h-48 sm:h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="captureTrendGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#20C466" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#20C466" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis
                      dataKey="date"
                      stroke="#94A3B8"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      dy={6}
                    />
                    <YAxis
                      stroke="#94A3B8"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-lg text-xs space-y-1">
                              <p className="font-semibold text-slate-800">{payload[0].payload.date}</p>
                              <div className="flex items-center gap-1.5 text-[#173D30] font-bold">
                                <span className="size-2 rounded-full bg-[#20C466]" />
                                <span>{payload[0].value} Records Captured</span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="#20C466"
                      strokeWidth={2.5}
                      fill="url(#captureTrendGrad)"
                      dot={{ r: 3, fill: '#20C466' }}
                      activeDot={{ r: 5, fill: '#173D30', stroke: '#20C466', strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. Advanced Filter Section */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
            <SlidersHorizontal className="size-4 text-[#173D30]" />
            <span>Filter Capture History</span>
          </div>
          <span className="text-xs text-slate-500">
            Narrow records by query, source, status, or date range
          </span>
        </div>

        <form onSubmit={handleApplyFilters} className="space-y-3.5">
          {/* Row 1: Search, Source, Category, Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
              <Input
                placeholder="Search Capture ID or Name"
                value={draft.search}
                onChange={(e) => handleDraftChange('search', e.target.value)}
                className="pl-9 h-10 text-sm border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-emerald-500"
              />
            </div>

            {/* All Sources */}
            <div>
              <select
                value={draft.source}
                onChange={(e) => handleDraftChange('source', e.target.value)}
                className="w-full h-10 px-3 text-sm border border-slate-200 rounded-xl bg-white text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              >
                <option value="">All Sources</option>
                {Array.isArray(meta.sources) && meta.sources.length > 0 ? (
                  meta.sources.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="GOOGLE_PLACES">Google Places</option>
                    <option value="CSV_IMPORT">CSV Upload</option>
                    <option value="MANUAL_ENTRY">Manual Entry</option>
                    <option value="WEBSITE_SCRAPER">Website Scraper</option>
                  </>
                )}
              </select>
            </div>

            {/* All Categories */}
            <div>
              <select
                value={draft.category}
                onChange={(e) => handleDraftChange('category', e.target.value)}
                className="w-full h-10 px-3 text-sm border border-slate-200 rounded-xl bg-white text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              >
                <option value="">All Categories</option>
                {Array.isArray(meta.categories) && meta.categories.length > 0 ? (
                  meta.categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="Gym & Fitness">Gym & Fitness</option>
                    <option value="Restaurants & Cafes">Restaurants & Cafes</option>
                    <option value="Healthcare & Clinics">Healthcare & Clinics</option>
                    <option value="Real Estate">Real Estate</option>
                    <option value="IT & Software">IT & Software</option>
                    <option value="Retail & Shopping">Retail & Shopping</option>
                  </>
                )}
              </select>
            </div>

            {/* Location */}
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
              <Input
                placeholder="Location"
                value={draft.location}
                onChange={(e) => handleDraftChange('location', e.target.value)}
                className="pl-9 h-10 text-sm border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Row 2: All Users, All Statuses, Start Date, End Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* All Users */}
            <div>
              <select
                value={draft.capturedBy}
                onChange={(e) => handleDraftChange('capturedBy', e.target.value)}
                className="w-full h-10 px-3 text-sm border border-slate-200 rounded-xl bg-white text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              >
                <option value="">All Users</option>
                {Array.isArray(meta.users) &&
                  meta.users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name || u.email || `User #${u.id}`}
                    </option>
                  ))}
              </select>
            </div>

            {/* All Statuses */}
            <div>
              <select
                value={draft.status}
                onChange={(e) => handleDraftChange('status', e.target.value)}
                className="w-full h-10 px-3 text-sm border border-slate-200 rounded-xl bg-white text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              >
                <option value="">All Statuses</option>
                <option value="Completed">Completed</option>
                <option value="Partial">Partial</option>
                <option value="Imported">Imported</option>
                <option value="Pending">Pending</option>
                <option value="Failed">Failed</option>
                <option value="Validated">Validated</option>
              </select>
            </div>

            {/* Start Date */}
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
              <Input
                type="date"
                placeholder="Start Date"
                value={draft.dateFrom}
                onChange={(e) => handleDraftChange('dateFrom', e.target.value)}
                className="pl-9 h-10 text-sm border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-emerald-500"
              />
            </div>

            {/* End Date */}
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
              <Input
                type="date"
                placeholder="End Date"
                value={draft.dateTo}
                onChange={(e) => handleDraftChange('dateTo', e.target.value)}
                className="pl-9 h-10 text-sm border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Action Buttons: Apply & Reset */}
          <div className="flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={handleResetFilters}
              className="h-9 px-4 text-xs font-semibold border-slate-200 text-slate-700 hover:bg-slate-50 gap-1.5 rounded-xl"
            >
              <RotateCcw className="size-3.5 text-slate-400" />
              <span>Reset Filters</span>
            </Button>

            <Button
              type="submit"
              className="h-9 px-5 text-xs font-semibold bg-[#173D30] hover:bg-[#122e25] text-white shadow-2xs gap-1.5 rounded-xl"
            >
              <Filter className="size-3.5 text-[#20C466]" />
              <span>Apply Filters</span>
            </Button>
          </div>
        </form>
      </div>

      {/* 5. Capture Records Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        {/* Table Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-5 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Capture Records
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Showing all captured records and their details.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#EAF7EF] text-[#173D30] border border-emerald-200/80">
              {totalRecords} Total Records
            </span>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full min-w-[1050px] text-left text-sm border-collapse">
            <thead className="bg-[#F4FAF6] border-b border-[#E2E8F0] text-[#173D30]">
              <tr>
                <th className="px-4 py-3.5 font-semibold text-xs uppercase tracking-wider">
                  Capture ID
                </th>
                <th className="px-4 py-3.5 font-semibold text-xs uppercase tracking-wider">
                  Capture Name
                </th>
                <th className="px-4 py-3.5 font-semibold text-xs uppercase tracking-wider">
                  Data Source
                </th>
                <th className="px-4 py-3.5 font-semibold text-xs uppercase tracking-wider">
                  Category
                </th>
                <th className="px-4 py-3.5 font-semibold text-xs uppercase tracking-wider">
                  Location
                </th>
                <th className="px-4 py-3.5 font-semibold text-xs uppercase tracking-wider">
                  Captured By
                </th>
                <th className="px-4 py-3.5 font-semibold text-xs uppercase tracking-wider">
                  Capture Date
                </th>
                <th className="px-4 py-3.5 font-semibold text-xs uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3.5 font-semibold text-xs uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-3.5"><Skeleton className="h-4 w-16" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-4 w-36" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-4 w-28" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-5 w-20 rounded-full" /></td>
                    <td className="px-4 py-3.5 text-right"><Skeleton className="size-7 rounded-md ml-auto" /></td>
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-500">
                    <div className="mx-auto size-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
                      <Search className="size-6" />
                    </div>
                    <p className="text-sm font-semibold text-slate-700">No capture records found</p>
                    <p className="text-xs text-slate-500 mt-1">
                      No capture sessions match the selected filters or search parameters.
                    </p>
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const idStr = String(row.jobId || row.id || '');
                  const displayId = idStr.startsWith('job-') || idStr.startsWith('CAP-')
                    ? idStr
                    : `#${idStr}`;
                  const captureName = row.captureName || row.keyword || `Capture ${displayId}`;
                  const hasFailed = Number(row.failed ?? row.failedCount ?? 0) > 0;

                  return (
                    <tr
                      key={row.id || row.jobId}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      {/* 1. Capture ID */}
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded font-mono text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                          {displayId}
                        </span>
                      </td>

                      {/* 2. Capture Name */}
                      <td className="px-4 py-3.5 max-w-[220px]">
                        <div className="font-semibold text-slate-900 truncate" title={captureName}>
                          {captureName}
                        </div>
                        {row.keyword && row.keyword !== captureName && (
                          <div className="text-xs text-slate-400 truncate" title={row.keyword}>
                            {row.keyword}
                          </div>
                        )}
                      </td>

                      {/* 3. Data Source */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#EAF7EF] text-[#173D30] border border-emerald-200/60">
                          <Globe className="size-3 text-[#20C466]" />
                          {row.source || 'GOOGLE_PLACES'}
                        </span>
                      </td>

                      {/* 4. Category */}
                      <td className="px-4 py-3.5 text-slate-700 whitespace-nowrap">
                        {row.category ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-700">
                            {row.category}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>

                      {/* 5. Location */}
                      <td className="px-4 py-3.5 text-slate-700 max-w-[160px]">
                        {row.location ? (
                          <div className="flex items-center gap-1.5 truncate" title={row.location}>
                            <MapPin className="size-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{row.location}</span>
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>

                      {/* 6. Captured By */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="size-6 rounded-full bg-[#173D30] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                            {(row.capturedBy || 'Admin')[0].toUpperCase()}
                          </div>
                          <span className="text-slate-800 font-medium text-xs">
                            {row.capturedBy || 'System'}
                          </span>
                        </div>
                      </td>

                      {/* 7. Capture Date */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-slate-600 text-xs">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="size-3.5 text-slate-400 shrink-0" />
                          <span>{formatDateTime(row.captureDate || row.createdAt)}</span>
                        </div>
                      </td>

                      {/* 8. Status */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <StatusBadge value={row.status} />
                      </td>

                      {/* 9. Actions */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="size-8 p-0 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
                            >
                              <MoreVertical className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 bg-white border border-slate-200 shadow-lg rounded-xl p-1">
                            <DropdownMenuItem
                              onClick={() => handleOpenSession(row)}
                              className="text-xs font-medium cursor-pointer gap-2 py-2 rounded-lg"
                            >
                              <Eye className="size-3.5 text-slate-500" />
                              <span>View Details</span>
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() => {
                                setImportRecords(row.records || []);
                                setImportOpen(true);
                              }}
                              className="text-xs font-medium cursor-pointer gap-2 py-2 rounded-lg text-emerald-700"
                            >
                              <Sparkles className="size-3.5 text-emerald-600" />
                              <span>Import to CRM</span>
                            </DropdownMenuItem>

                            {hasFailed && (
                              <DropdownMenuItem
                                onClick={() => handleRetry(row.id || row.jobId)}
                                disabled={busyAction === `retry-${row.id || row.jobId}`}
                                className="text-xs font-medium cursor-pointer gap-2 py-2 rounded-lg text-amber-700"
                              >
                                <RefreshCw className="size-3.5 text-amber-600" />
                                <span>Retry Import</span>
                              </DropdownMenuItem>
                            )}

                            <DropdownMenuItem asChild>
                              <Link
                                href={`/admin/crm/leads?captureJobId=${encodeURIComponent(row.id || row.jobId)}`}
                                className="text-xs font-medium cursor-pointer gap-2 py-2 rounded-lg text-slate-700 flex items-center"
                              >
                                <ExternalLink className="size-3.5 text-slate-500" />
                                <span>View Import Status</span>
                              </Link>
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() => setDeletingRecord(row)}
                              className="text-xs font-medium cursor-pointer gap-2 py-2 rounded-lg text-rose-600 focus:text-rose-600 focus:bg-rose-50"
                            >
                              <Trash2 className="size-3.5 text-rose-500" />
                              <span>Delete</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Record Cards (< md) */}
        <div className="md:hidden divide-y divide-slate-100 p-4 space-y-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="rounded-xl border border-slate-200 p-4 space-y-2.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            ))
          ) : rows.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-sm">
              No capture records match these filters.
            </div>
          ) : (
            rows.map((row) => {
              const idStr = String(row.jobId || row.id || '');
              const displayId = idStr.startsWith('job-') || idStr.startsWith('CAP-')
                ? idStr
                : `#${idStr}`;
              const captureName = row.captureName || row.keyword || `Capture ${displayId}`;

              return (
                <div
                  key={row.id || row.jobId}
                  className="rounded-xl border border-slate-200/80 bg-white p-4 space-y-3 shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-800">
                          {displayId}
                        </span>
                        <StatusBadge value={row.status} />
                      </div>
                      <h3 className="font-bold text-slate-900 mt-1 text-sm">{captureName}</h3>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="size-7 p-0 text-slate-500 hover:text-slate-900 rounded-lg"
                        >
                          <MoreVertical className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 bg-white border border-slate-200 shadow-lg rounded-xl p-1">
                        <DropdownMenuItem onClick={() => handleOpenSession(row)} className="text-xs">
                          <Eye className="size-3.5 mr-2 text-slate-500" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setImportRecords(row.records || []);
                            setImportOpen(true);
                          }}
                          className="text-xs text-emerald-700"
                        >
                          <Sparkles className="size-3.5 mr-2 text-emerald-600" />
                          Import to CRM
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/admin/crm/leads?captureJobId=${encodeURIComponent(row.id || row.jobId)}`}
                            className="text-xs flex items-center"
                          >
                            <ExternalLink className="size-3.5 mr-2 text-slate-500" />
                            View Import Status
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeletingRecord(row)}
                          className="text-xs text-rose-600"
                        >
                          <Trash2 className="size-3.5 mr-2 text-rose-500" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-1 border-t border-slate-100">
                    <div>
                      <span className="text-slate-400">Source:</span> {row.source || 'GOOGLE_PLACES'}
                    </div>
                    <div>
                      <span className="text-slate-400">Category:</span> {row.category || '—'}
                    </div>
                    <div className="col-span-2 truncate">
                      <span className="text-slate-400">Location:</span> {row.location || '—'}
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-400">Date:</span> {formatDateTime(row.captureDate || row.createdAt)}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      Captured: <strong className="text-slate-800">{row.totalRecords ?? row.capturedCount ?? 0}</strong>
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenSession(row)}
                      className="h-7 text-xs px-2.5 rounded-lg border-slate-200"
                    >
                      Details
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 6. Table Footer and Pagination */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border-t border-slate-100 bg-[#FBFDFB]">
          {/* Showing X–Y of Z records */}
          <div className="text-xs text-slate-600">
            {totalRecords > 0 ? (
              <>
                Showing{' '}
                <strong className="text-slate-900 font-semibold">
                  {(page - 1) * pageSize + 1}
                </strong>{' '}
                to{' '}
                <strong className="text-slate-900 font-semibold">
                  {Math.min(page * pageSize, totalRecords)}
                </strong>{' '}
                of{' '}
                <strong className="text-slate-900 font-semibold">{totalRecords}</strong> records
              </>
            ) : (
              'Showing 0 records'
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Rows per page selector */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <span>Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="h-8 px-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-emerald-500"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
                className="h-8 px-2.5 text-xs border-slate-200 rounded-lg gap-1 disabled:opacity-40"
              >
                <ChevronLeft className="size-3.5" />
                <span className="hidden sm:inline">Previous</span>
              </Button>

              {/* Numbered Page Buttons */}
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pNum = i + 1;
                  if (totalPages > 5 && page > 3) {
                    pNum = Math.min(page - 2 + i, totalPages - 4 + i);
                  }
                  return (
                    <button
                      key={pNum}
                      type="button"
                      onClick={() => setPage(pNum)}
                      className={cn(
                        'size-8 rounded-lg text-xs font-semibold transition-all',
                        page === pNum
                          ? 'bg-[#173D30] text-white shadow-2xs'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      )}
                    >
                      {pNum}
                    </button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || loading}
                className="h-8 px-2.5 text-xs border-slate-200 rounded-lg gap-1 disabled:opacity-40"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="size-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 7. Session Details FormDrawer */}
      <FormDrawer
        open={Boolean(sessionDetail)}
        onOpenChange={(open) => {
          if (!open) setSessionDetail(null);
        }}
        title={sessionDetail?.captureName || sessionDetail?.keyword || `Capture Session #${sessionDetail?.id || sessionDetail?.jobId || ''}`}
        description={`Capture ID: ${sessionDetail?.id || sessionDetail?.jobId || '—'}`}
        size="xl"
        showFooter={false}
      >
        {sessionDetail && (
          <div className="space-y-5 text-sm pb-8">
            {/* Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Source</span>
                <p className="mt-0.5 font-medium text-slate-800">{sessionDetail.source || 'GOOGLE_PLACES'}</p>
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Category</span>
                <p className="mt-0.5 font-medium text-slate-800">{sessionDetail.category || '—'}</p>
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Location</span>
                <p className="mt-0.5 font-medium text-slate-800">{sessionDetail.location || '—'}</p>
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Captured Date</span>
                <p className="mt-0.5 font-medium text-slate-800">{formatDateTime(sessionDetail.captureDate || sessionDetail.createdAt)}</p>
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Captured By</span>
                <p className="mt-0.5 font-medium text-slate-800">{sessionDetail.capturedBy || 'System'}</p>
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</span>
                <div className="mt-0.5">
                  <StatusBadge value={sessionDetail.status} />
                </div>
              </div>
            </div>

            {/* Counts Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                <span className="text-xs text-emerald-700 font-semibold">Total Records</span>
                <p className="text-xl font-bold text-emerald-950 mt-1">
                  {sessionDetail.totalRecords ?? sessionDetail.capturedCount ?? (sessionDetail.records?.length || 0)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-[#EAF7EF] border border-emerald-200">
                <span className="text-xs text-[#173D30] font-semibold">Imported to CRM</span>
                <p className="text-xl font-bold text-[#173D30] mt-1">
                  {sessionDetail.imported ?? sessionDetail.importedCount ?? 0}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-100">
                <span className="text-xs text-amber-700 font-semibold">Pending Import</span>
                <p className="text-xl font-bold text-amber-950 mt-1">
                  {sessionDetail.pending ?? 0}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-100">
                <span className="text-xs text-rose-700 font-semibold">Failed Imports</span>
                <p className="text-xl font-bold text-rose-950 mt-1">
                  {sessionDetail.failed ?? sessionDetail.failedCount ?? 0}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <Link
                href={`/admin/crm/leads?captureJobId=${encodeURIComponent(sessionDetail.id || sessionDetail.jobId)}`}
                className="inline-flex h-9 items-center justify-center rounded-xl bg-[#173D30] px-4 text-xs font-semibold text-white hover:bg-[#122e25] transition-colors gap-1.5 shadow-2xs"
              >
                <ExternalLink className="size-3.5" />
                <span>View Imported Leads in CRM</span>
              </Link>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setImportRecords(sessionDetail.records || []);
                  setImportOpen(true);
                }}
                className="h-9 px-3.5 text-xs font-semibold border-slate-200 text-slate-700 hover:bg-slate-50 gap-1.5 rounded-xl"
              >
                <Sparkles className="size-3.5 text-emerald-600" />
                <span>Select Records to Import</span>
              </Button>

              {Number(sessionDetail.failed ?? sessionDetail.failedCount ?? 0) > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={busyAction === `retry-${sessionDetail.id || sessionDetail.jobId}`}
                  onClick={() => handleRetry(sessionDetail.id || sessionDetail.jobId)}
                  className="h-9 px-3.5 text-xs font-semibold border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 gap-1.5 rounded-xl"
                >
                  <RefreshCw
                    className={cn(
                      'size-3.5 text-amber-600',
                      busyAction === `retry-${sessionDetail.id || sessionDetail.jobId}` && 'animate-spin'
                    )}
                  />
                  <span>Retry Failed Imports</span>
                </Button>
              )}
            </div>

            {/* Stored Records Subtable */}
            <div className="mt-4 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Captured Business Records ({sessionDetail.records?.length || 0})
              </h4>
              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                <table className="w-full min-w-[650px] text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700">
                    <tr>
                      <th className="px-3 py-2.5 font-semibold">Business Name</th>
                      <th className="px-3 py-2.5 font-semibold">Category</th>
                      <th className="px-3 py-2.5 font-semibold">Outcome / Status</th>
                      <th className="px-3 py-2.5 font-semibold">Google Place ID</th>
                      <th className="px-3 py-2.5 font-semibold">CRM Lead ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {Array.isArray(sessionDetail.records) && sessionDetail.records.length > 0 ? (
                      sessionDetail.records.map((rec) => (
                        <tr key={rec.id || rec.googlePlaceId} className="hover:bg-slate-50/70">
                          <td className="px-3 py-2.5">
                            <div className="font-semibold text-slate-900">
                              {rec.businessName || 'Google Places reference'}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate max-w-xs">
                              {rec.address || rec.phone || rec.website || ''}
                            </div>
                          </td>
                          <td className="px-3 py-2.5 text-slate-600">{rec.category || '—'}</td>
                          <td className="px-3 py-2.5">
                            <span
                              className={cn(
                                'inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold capitalize',
                                rec.outcome === 'imported' || rec.isImported
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : rec.outcome === 'failed'
                                  ? 'bg-rose-50 text-rose-700'
                                  : 'bg-slate-100 text-slate-700'
                              )}
                            >
                              {rec.outcome || (rec.isImported ? 'Imported' : 'Captured')}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 font-mono text-[11px] text-slate-500">
                            {rec.googlePlaceId ? `${rec.googlePlaceId.slice(0, 16)}…` : '—'}
                          </td>
                          <td className="px-3 py-2.5 font-mono text-[11px] text-slate-600">
                            {rec.importedLeadId ? `#${rec.importedLeadId}` : '—'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-3 py-6 text-center text-slate-500">
                          No stored individual records found for this capture session.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </FormDrawer>

      {/* 8. Google Places Import Drawer / Panel */}
      <GooglePlacesPanel
        open={importOpen}
        onOpenChange={setImportOpen}
        initialPlaces={importRecords}
        initialJobId={sessionDetail?.id || sessionDetail?.jobId}
        onImported={() => {
          setRefreshKey((v) => v + 1);
          if (sessionDetail?.id || sessionDetail?.jobId) {
            handleOpenSession({ id: sessionDetail.id || sessionDetail.jobId });
          }
        }}
      />

      {/* 9. Delete Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(deletingRecord)}
        onOpenChange={(open) => {
          if (!open) setDeletingRecord(null);
        }}
        title="Delete Capture Session"
        description={`Are you sure you want to delete capture session #${deletingRecord?.id || deletingRecord?.jobId}? This action cannot be undone.`}
        confirmLabel="Delete Session"
        variant="destructive"
        loading={deleteLoading}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
