'use client';

import * as React from 'react';
import api from '../../../lib/api';
import { rowsOf, pageOf, summaryOf, billingError } from '@/modules/customer/billing-api';
import { PageHeader } from '@/components/layout/PageHeader';
import { FormDrawer } from '@/components/common/drawers/FormDrawer';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import {
  faLayerGroup,
  faCircleCheck,
  faCirclePause,
  faUsers,
  faCheck,
  faPlus,
  faDownload,
  faRotateRight,
  faSearch,
  faXmark,
  faEllipsisVertical,
  faEye,
  faPenToSquare,
  faTrashCan,
  faPowerOff,
  faTableCellsLarge,
  faList,
  faDatabase,
  faUserGroup,
  faBullseye,
} from '@fortawesome/free-solid-svg-icons';
import { toast } from '@/hooks/use-toast';
import { TruncatedText } from '@/components/common/TruncatedText';

const initialForm = {
  name: '',
  code: '',
  description: '',
  monthlyPrice: '',
  yearlyPrice: '',
  userLimit: '',
  leadLimit: '',
  storageLimitBytes: '',
  features: '',
  isActive: true,
};

const money = (amount) => {
  const num = Number(amount || 0);
  return '₹' + new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(num);
};

const dateStr = (value) => (value ? new Date(value).toLocaleDateString() : '—');

const featuresOf = (plan) =>
  Array.isArray(plan?.features)
    ? plan.features.filter((f) => typeof f === 'string' && f.trim().length > 0)
    : [];

const formatStorage = (bytes) => {
  const n = Number(bytes);
  if (!n || n <= 0) return '0 MB';
  if (n >= 1024 * 1024 * 1024) return `${(n / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  if (n >= 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(0)} MB`;
  return `${(n / 1024).toFixed(0)} KB`;
};

const csvCell = (value) =>
  `"${String(value ?? '').replace(/^[=+@\-\t\r]/, "'$&").replaceAll('"', '""')}"`;

export function SubscriptionPlans() {
  const [search, setSearch] = React.useState('');
  const [query, setQuery] = React.useState('');
  const [status, setStatus] = React.useState('all');
  const [sort, setSort] = React.useState('name');
  const [viewMode, setViewMode] = React.useState('grid'); // 'grid' | 'table'
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(12);

  const [result, setResult] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [revision, setRevision] = React.useState(0);

  // Drawers & Modals
  const [form, setForm] = React.useState(null);
  const [editing, setEditing] = React.useState(null);
  const [detail, setDetail] = React.useState(null);
  const [detailLoading, setDetailLoading] = React.useState(false);
  const [deleting, setDeleting] = React.useState(null);
  const [busy, setBusy] = React.useState(false);

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setQuery(search);
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  // Load plans from API
  React.useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    api
      .get('/admin/plans', {
        params: {
          management: true,
          search: query,
          status,
          sort,
          page,
          limit,
        },
      })
      .then((payload) => {
        if (!active) return;
        const meta = pageOf(payload);
        if (page > 1 && meta.total != null && (page - 1) * limit >= meta.total) {
          setPage(Math.max(1, Math.ceil(meta.total / limit)));
          return;
        }
        setResult({
          rows: rowsOf(payload),
          meta,
          summary: summaryOf(payload),
        });
      })
      .catch((err) => {
        if (active) {
          setResult(null);
          setError(billingError(err));
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [query, status, sort, page, limit, revision]);

  const refresh = () => setRevision((n) => n + 1);

  const updateField = (key, value) => setForm((old) => ({ ...old, [key]: value }));

  const openForm = (plan) => {
    setEditing(plan || null);
    setForm(
      plan
        ? {
            ...initialForm,
            ...plan,
            features: featuresOf(plan).join('\n'),
            isActive: plan.isActive !== false,
          }
        : { ...initialForm }
    );
  };

  const save = async (e) => {
    if (e) e.preventDefault();
    if (!form.name.trim() || !form.code.trim()) {
      toast.error('Plan name and code are required.');
      return;
    }
    for (const key of ['monthlyPrice', 'yearlyPrice', 'userLimit', 'leadLimit', 'storageLimitBytes']) {
      if (
        form[key] === '' ||
        !Number.isFinite(Number(form[key])) ||
        Number(form[key]) < 0 ||
        (['userLimit', 'leadLimit', 'storageLimitBytes'].includes(key) &&
          (!Number.isSafeInteger(Number(form[key])) || Number(form[key]) < 1))
      ) {
        toast.error('Enter valid prices and positive whole-number limits.');
        return;
      }
    }

    const payload = {
      name: form.name.trim(),
      code: form.code.trim(),
      description: form.description.trim(),
      monthlyPrice: Number(form.monthlyPrice),
      yearlyPrice: Number(form.yearlyPrice),
      userLimit: Number(form.userLimit),
      leadLimit: Number(form.leadLimit),
      storageLimitBytes: Number(form.storageLimitBytes),
      features: form.features
        .split('\n')
        .map((x) => x.trim())
        .filter(Boolean),
    };

    setBusy(true);
    try {
      if (editing) {
        await api.patch(`/admin/plans/${editing.id}`, payload);
      } else {
        await api.post('/admin/plans', payload);
      }
      setForm(null);
      toast.success(editing ? 'Plan updated successfully' : 'Plan created successfully');
      refresh();
    } catch (err) {
      toast.error(billingError(err));
    } finally {
      setBusy(false);
    }
  };

  const view = async (plan) => {
    setDetail(plan);
    setDetailLoading(true);
    if (plan.deletedAt) {
      setDetailLoading(false);
      return;
    }
    try {
      const payload = await api.get(`/admin/plans/${plan.id}`);
      setDetail((current) =>
        current?.id === plan.id
          ? { ...current, ...(payload?.data && !Array.isArray(payload.data) ? payload.data : payload) }
          : current
      );
    } catch (err) {
      toast.error(billingError(err));
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const toggle = async (plan) => {
    setBusy(true);
    try {
      await api.patch(`/admin/plans/${plan.id}/status`, { isActive: !plan.isActive });
      toast.success(`Plan ${plan.isActive ? 'deactivated' : 'activated'} successfully`);
      refresh();
    } catch (err) {
      toast.error(billingError(err));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await api.delete(`/admin/plans/${deleting.id}`);
      setDeleting(null);
      toast.success('Plan archived successfully');
      refresh();
    } catch (err) {
      toast.error(billingError(err));
    } finally {
      setBusy(false);
    }
  };

  const exportCsv = async () => {
    setBusy(true);
    try {
      let all = [];
      let current = 1;
      let total = 0;
      do {
        const response = await api.get('/admin/plans', {
          params: { management: true, search: query, status, sort, page: current, limit: 100 },
        });
        const rows = rowsOf(response);
        all = all.concat(rows);
        total = pageOf(response).total ?? all.length;
        if (!rows.length) break;
        current++;
      } while (all.length < total);

      const lines = [
        [
          'Name',
          'Code',
          'Description',
          'Status',
          'Subscribers',
          'Seat capacity',
          'Monthly price',
          'Yearly price',
          'Lead limit',
          'Storage bytes',
          'Features',
          'Created',
        ],
        ...all.map((p) => [
          p.name,
          p.code,
          p.description,
          p.deletedAt ? 'Archived' : p.isActive ? 'Active' : 'Inactive',
          p.subscriberCount,
          p.userLimit,
          p.monthlyPrice,
          p.yearlyPrice,
          p.leadLimit,
          p.storageLimitBytes,
          featuresOf(p).join('; '),
          p.createdAt,
        ]),
      ].map((row) => row.map(csvCell).join(','));

      const url = URL.createObjectURL(
        new Blob(['\ufeff' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' })
      );
      const link = document.createElement('a');
      link.href = url;
      link.download = 'subscription-plans.csv';
      link.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${all.length} subscription plans to CSV`);
    } catch (err) {
      toast.error(billingError(err));
    } finally {
      setBusy(false);
    }
  };

  const rows = result?.rows || [];
  const meta = result?.meta || {};
  const summary = result?.summary || {};
  const pages = Math.max(1, Math.ceil((meta.total || 0) / limit));

  // Counts for tabs
  const totalPlansCount = summary.totalPlans ?? meta.total ?? rows.length;
  const activePlansCount = summary.activePlans ?? rows.filter((r) => r.isActive).length;
  const inactivePlansCount = summary.inactivePlans ?? rows.filter((r) => !r.isActive && !r.deletedAt).length;

  return (
    <div className="w-full min-w-0 max-w-none space-y-4 sm:space-y-5 overflow-x-hidden pb-10">
      {/* ── 1. Page Header ────────────────────────────────────────── */}
      <PageHeader
        category="MASTER MANAGEMENT → SUBSCRIPTION PLANS"
        title="Subscription Plans"
        description="Manage enterprise tier quotas, feature gates, seat licenses and billing cycles."
        icon={faLayerGroup}
        actions={
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              disabled={busy || loading}
              onClick={refresh}
              className="h-8.5 rounded-xl border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-all"
            >
              <FontAwesomeIcon
                icon={faRotateRight}
                className={`size-3.5 mr-1.5 text-slate-500 ${loading ? 'animate-spin' : ''}`}
              />
              <span>Refresh</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={busy || !result}
              onClick={exportCsv}
              className="h-8.5 rounded-xl border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-all"
            >
              <FontAwesomeIcon icon={faDownload} className="size-3.5 mr-1.5 text-slate-500" />
              <span>Export CSV</span>
            </Button>
            <Button
              type="button"
              disabled={busy}
              onClick={() => openForm(null)}
              className="h-8.5 rounded-xl bg-[#16A34A] hover:bg-[#15803D] px-3.5 text-xs font-semibold text-white shadow-xs transition-all"
            >
              <FontAwesomeIcon icon={faPlus} className="size-3.5 mr-1.5" />
              <span>Add Subscription Plan</span>
            </Button>
          </div>
        }
      />

      {/* ── 2. Statistics Cards (4 Modern SaaS Cards) ─────────────── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Subscription Plans */}
        <div className="flex items-center justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs transition hover:border-emerald-300">
          <div className="space-y-1 min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate">
              Total Subscription Plans
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111827]">
                {loading && !result ? '…' : summary.totalPlans ?? '—'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">Configured pricing tiers</p>
          </div>
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-[#16A34A] ring-1 ring-emerald-200/60">
            <FontAwesomeIcon icon={faLayerGroup} className="size-5" />
          </div>
        </div>

        {/* Active Subscription Plans */}
        <div className="flex items-center justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs transition hover:border-emerald-300">
          <div className="space-y-1 min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate">
              Active Subscription Plans
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-emerald-700">
                {loading && !result ? '…' : summary.activePlans ?? '—'}
              </span>
            </div>
            <p className="text-[11px] text-emerald-600 font-medium truncate">Publicly selectable</p>
          </div>
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60">
            <FontAwesomeIcon icon={faCircleCheck} className="size-5" />
          </div>
        </div>

        {/* Inactive Plans */}
        <div className="flex items-center justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs transition hover:border-emerald-300">
          <div className="space-y-1 min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate">
              Inactive Plans
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-600">
                {loading && !result ? '…' : summary.inactivePlans ?? '—'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">Hidden or draft</p>
          </div>
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 ring-1 ring-slate-200">
            <FontAwesomeIcon icon={faCirclePause} className="size-5 text-slate-500" />
          </div>
        </div>

        {/* Total Subscribers */}
        <div className="flex items-center justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs transition hover:border-emerald-300">
          <div className="space-y-1 min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate">
              Total Subscribers
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111827]">
                {loading && !result ? '…' : summary.subscribers ?? '—'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">Active paid tenant accounts</p>
          </div>
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-[#16A34A] ring-1 ring-emerald-200/60">
            <FontAwesomeIcon icon={faUsers} className="size-5" />
          </div>
        </div>
      </div>

      {/* ── 3. Filters & Search Toolbar ────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 sm:p-4 shadow-xs space-y-3.5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100/90 overflow-x-auto no-scrollbar max-w-full">
            {[
              { key: 'all', label: 'All', count: totalPlansCount },
              { key: 'active', label: 'Active', count: activePlansCount },
              { key: 'inactive', label: 'Inactive', count: inactivePlansCount },
              { key: 'archived', label: 'Archived', count: 0 },
            ].map((tab) => {
              const active = status === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    setStatus(tab.key);
                    setPage(1);
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all shrink-0 ${
                    active
                      ? 'bg-white text-emerald-800 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                      active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200/70 text-slate-600'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* View Mode Toggle */}
          <div className="hidden sm:flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                viewMode === 'grid'
                  ? 'bg-white text-emerald-700 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Cards Grid View"
            >
              <FontAwesomeIcon icon={faTableCellsLarge} className="text-xs" />
              <span>Cards</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-emerald-700 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Compact Table View"
            >
              <FontAwesomeIcon icon={faList} className="text-xs" />
              <span>Table</span>
            </button>
          </div>
        </div>

        {/* Search & Sort Controls Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative flex-1 min-w-0">
            <FontAwesomeIcon
              icon={faSearch}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400"
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, code or description..."
              className="h-9 w-full rounded-xl border-slate-200 pl-9 pr-8 text-xs placeholder:text-slate-400 focus-visible:ring-emerald-500"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                aria-label="Clear search"
              >
                <FontAwesomeIcon icon={faXmark} className="size-3" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setPage(1);
              }}
              aria-label="Sort plans"
              className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="name">Sort: Plan name</option>
              <option value="subscribers">Sort: Subscriber count</option>
              <option value="seats">Sort: Seat capacity</option>
              <option value="created">Sort: Created date</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── 4. Error State ────────────────────────────────────────── */}
      {error && (
        <div role="alert" className="rounded-2xl border border-rose-200 bg-white p-6 text-sm text-rose-700">
          <p className="font-semibold">{error}</p>
          <Button variant="outline" className="mt-3 text-xs" onClick={refresh}>
            Try again
          </Button>
        </div>
      )}

      {/* ── 5. Loading Skeletons ───────────────────────────────────── */}
      {loading && (
        <div
          aria-label="Loading plans"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-80 animate-pulse rounded-2xl border border-slate-100 bg-white p-5 shadow-xs"
            >
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-slate-100" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-4 w-32 rounded bg-slate-100" />
                  <div className="h-3 w-16 rounded bg-slate-100" />
                </div>
              </div>
              <div className="mt-4 h-10 rounded bg-slate-100" />
              <div className="mt-4 h-16 rounded-xl bg-slate-100" />
              <div className="mt-4 h-12 rounded bg-slate-100" />
            </div>
          ))}
        </div>
      )}

      {/* ── 6. Empty State ────────────────────────────────────────── */}
      {!loading && !error && rows.length === 0 && (
        <div className="rounded-2xl border border-slate-200/90 bg-white p-12 text-center shadow-xs">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-3">
            <FontAwesomeIcon icon={faLayerGroup} className="size-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No subscription plans found</h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            {query || status !== 'all'
              ? 'No subscription plans match your search and filter criteria.'
              : 'Get started by creating your first tier subscription plan.'}
          </p>
          <Button
            type="button"
            onClick={() => openForm(null)}
            className="mt-4 h-8.5 rounded-xl bg-[#16A34A] hover:bg-[#15803D] px-4 text-xs font-semibold text-white shadow-xs"
          >
            <FontAwesomeIcon icon={faPlus} className="mr-1.5" />
            Create Subscription Plan
          </Button>
        </div>
      )}

      {/* ── 7. Grid Cards View ────────────────────────────────────── */}
      {!loading && !error && rows.length > 0 && viewMode === 'grid' && (
        <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((plan) => {
            const features = featuresOf(plan);
            const isArchived = Boolean(plan.deletedAt);
            const isActive = plan.isActive && !isArchived;

            return (
              <article
                key={plan.id}
                className="group relative flex min-w-0 flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all duration-200 hover:border-emerald-300 hover:shadow-md"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-[#16A34A] ring-1 ring-emerald-200/60 font-bold">
                        <FontAwesomeIcon icon={faLayerGroup} className="size-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-base font-bold text-slate-900 truncate">
                            <TruncatedText text={plan.name} maxLines={1} />
                          </h3>
                        </div>
                        <span className="inline-block font-mono text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                          {plan.code}
                        </span>
                      </div>
                    </div>

                    {/* Status Pill Badge */}
                    <span
                      className={`shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                        isArchived
                          ? 'bg-slate-100 text-slate-600 border-slate-200'
                          : isActive
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                          : 'bg-amber-50 text-amber-700 border-amber-200/80'
                      }`}
                    >
                      {isArchived ? 'Archived' : isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {/* Plan Description */}
                  <div className="mt-3 text-xs text-slate-500 min-h-8">
                    <TruncatedText
                      text={plan.description || 'No description provided.'}
                      maxLines={2}
                      fallback="No description provided."
                    />
                  </div>

                  {/* Quotas & Capacity Grid */}
                  <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-slate-50/90 p-3 border border-slate-100">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Subscribers
                      </span>
                      <p className="mt-0.5 text-sm font-extrabold text-slate-800">
                        {plan.subscriberCount ?? 0}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Seat capacity
                      </span>
                      <p className="mt-0.5 text-sm font-extrabold text-slate-800">
                        {plan.userLimit ?? '—'}
                      </p>
                    </div>
                    <div className="pt-2 border-t border-slate-200/60">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Lead limit
                      </span>
                      <p className="mt-0.5 text-xs font-bold text-slate-700">
                        {plan.leadLimit ? Number(plan.leadLimit).toLocaleString('en-IN') : 'Unlimited'}
                      </p>
                    </div>
                    <div className="pt-2 border-t border-slate-200/60">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Storage
                      </span>
                      <p className="mt-0.5 text-xs font-bold text-slate-700">
                        {formatStorage(plan.storageLimitBytes)}
                      </p>
                    </div>
                  </div>

                  {/* Included Features Section */}
                  <div className="mt-4">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                      INCLUDED FEATURES
                    </span>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {features.slice(0, 4).map((feature, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-50/70 border border-emerald-200/60 px-2 py-1 text-[11px] font-medium text-emerald-900 max-w-full truncate"
                        >
                          <FontAwesomeIcon icon={faCheck} className="text-emerald-600 text-[10px]" />
                          <TruncatedText text={feature} maxLines={1} />
                        </span>
                      ))}

                      {features.length === 0 && (
                        <span className="text-xs text-slate-400 italic">No features configured</span>
                      )}
                    </div>

                    {features.length > 4 && (
                      <button
                        type="button"
                        onClick={() => view(plan)}
                        className="mt-2 inline-flex items-center text-xs font-bold text-[#16A34A] hover:text-[#15803D] hover:underline"
                      >
                        View all {features.length} features →
                      </button>
                    )}
                  </div>
                </div>

                {/* Pricing & Footer Actions */}
                <div className="mt-5 pt-4 border-t border-slate-100">
                  <div className="flex items-baseline justify-between mb-4">
                    <div>
                      <span className="text-xl font-extrabold text-slate-900">
                        {money(plan.monthlyPrice)}
                      </span>
                      <span className="text-xs font-medium text-slate-500 ml-1">/ month</span>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {money(plan.yearlyPrice)} / year
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => view(plan)}
                      className="flex-1 h-8 rounded-xl border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <FontAwesomeIcon icon={faEye} className="mr-1.5 size-3 text-slate-400" />
                      View Details
                    </Button>

                    {!isArchived && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openForm(plan)}
                          className="h-8 rounded-xl border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 px-3"
                        >
                          <FontAwesomeIcon icon={faPenToSquare} className="mr-1.5 size-3 text-slate-400" />
                          Edit
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 p-0 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50"
                              aria-label="More options"
                            >
                              <FontAwesomeIcon icon={faEllipsisVertical} className="size-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44 rounded-xl shadow-lg border-slate-200">
                            <DropdownMenuItem
                              onClick={() => toggle(plan)}
                              disabled={busy}
                              className="text-xs font-medium cursor-pointer"
                            >
                              <FontAwesomeIcon
                                icon={faPowerOff}
                                className={`mr-2 size-3.5 ${plan.isActive ? 'text-amber-500' : 'text-emerald-600'}`}
                              />
                              {plan.isActive ? 'Deactivate Plan' : 'Activate Plan'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setDeleting(plan)}
                              disabled={busy}
                              className="text-xs font-medium text-rose-600 hover:text-rose-700 focus:text-rose-700 cursor-pointer"
                            >
                              <FontAwesomeIcon icon={faTrashCan} className="mr-2 size-3.5" />
                              Delete Plan
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* ── 8. Table View ─────────────────────────────────────────── */}
      {!loading && !error && rows.length > 0 && viewMode === 'table' && (
        <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Plan Name & Code</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Monthly</th>
                  <th className="py-3 px-4">Yearly</th>
                  <th className="py-3 px-4">Quotas (Seats / Leads)</th>
                  <th className="py-3 px-4 text-center">Subscribers</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {rows.map((plan) => {
                  const isArchived = Boolean(plan.deletedAt);
                  const isActive = plan.isActive && !isArchived;

                  return (
                    <tr key={plan.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{plan.name}</div>
                        <span className="font-mono text-[10px] text-slate-500 uppercase">{plan.code}</span>
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <TruncatedText
                          text={plan.description || '—'}
                          maxLines={1}
                          fallback="—"
                        />
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {money(plan.monthlyPrice)}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {money(plan.yearlyPrice)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800">{plan.userLimit} seats</span>
                        <span className="text-slate-400 mx-1">·</span>
                        <span className="text-slate-600">
                          {plan.leadLimit ? `${Number(plan.leadLimit).toLocaleString()} leads` : 'Unlimited'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-800">
                        {plan.subscriberCount ?? 0}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold border ${
                            isArchived
                              ? 'bg-slate-100 text-slate-600 border-slate-200'
                              : isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                              : 'bg-amber-50 text-amber-700 border-amber-200/80'
                          }`}
                        >
                          {isArchived ? 'Archived' : isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => view(plan)}
                            className="h-7 w-7 p-0 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                            title="View Details"
                          >
                            <FontAwesomeIcon icon={faEye} className="size-3.5" />
                          </Button>
                          {!isArchived && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => openForm(plan)}
                                className="h-7 w-7 p-0 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                                title="Edit Plan"
                              >
                                <FontAwesomeIcon icon={faPenToSquare} className="size-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setDeleting(plan)}
                                className="h-7 w-7 p-0 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                                title="Delete Plan"
                              >
                                <FontAwesomeIcon icon={faTrashCan} className="size-3.5" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── 9. Pagination Footer ──────────────────────────────────── */}
      {!error && !loading && rows.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 pt-2">
          <span>
            Showing <strong className="text-slate-700">{rows.length}</strong> of{' '}
            <strong className="text-slate-700">{meta.total ?? rows.length}</strong> plans · Page{' '}
            <strong className="text-slate-700">{page}</strong> of{' '}
            <strong className="text-slate-700">{pages}</strong>
          </span>
          <div className="flex items-center gap-2">
            <label htmlFor="plan-limit" className="font-medium text-slate-600">
              Rows per page:
            </label>
            <select
              id="plan-limit"
              className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
            >
              {[12, 24, 48, 100].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="h-8 rounded-lg border-slate-200 text-xs px-3 font-semibold"
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= pages}
              onClick={() => setPage((p) => p + 1)}
              className="h-8 rounded-lg border-slate-200 text-xs px-3 font-semibold"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* ── 10. Add / Edit Subscription Plan Drawer ───────────────── */}
      <FormDrawer
        open={!!form}
        onOpenChange={(open) => {
          if (!open && !busy) setForm(null);
        }}
        title={editing ? 'Edit Subscription Plan' : 'Add Subscription Plan'}
        description="Configure tier quotas, billing cycle pricing, and feature permissions."
        onSubmit={save}
        loading={busy}
        size="md"
      >
        {form && (
          <div className="space-y-6">
            {/* Section 1: Basic Information */}
            <section className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 border-b border-emerald-100 pb-1">
                Basic Information
              </h4>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">
                    Plan Name <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    required
                    value={form.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    placeholder="e.g. Enterprise Plus"
                    className="h-9 text-xs border-slate-200 focus-visible:ring-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">
                    Plan Code <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    required
                    value={form.code}
                    onChange={(e) => updateField('code', e.target.value.toUpperCase())}
                    placeholder="e.g. ENT-001"
                    className="h-9 text-xs font-mono uppercase border-slate-200 focus-visible:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">Description</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  placeholder="Short summary of this subscription tier..."
                  rows={2}
                  className="text-xs border-slate-200 focus-visible:ring-emerald-500"
                />
              </div>
            </section>

            {/* Section 2: Billing Configuration */}
            <section className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 border-b border-emerald-100 pb-1">
                Billing Configuration (INR ₹)
              </h4>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">
                    Monthly Price (₹) <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    required
                    type="number"
                    min="0"
                    step="any"
                    value={form.monthlyPrice}
                    onChange={(e) => updateField('monthlyPrice', e.target.value)}
                    placeholder="9999"
                    className="h-9 text-xs border-slate-200 focus-visible:ring-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">
                    Yearly Price (₹) <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    required
                    type="number"
                    min="0"
                    step="any"
                    value={form.yearlyPrice}
                    onChange={(e) => updateField('yearlyPrice', e.target.value)}
                    placeholder="95990"
                    className="h-9 text-xs border-slate-200 focus-visible:ring-emerald-500"
                  />
                </div>
              </div>
            </section>

            {/* Section 3: Quotas & Capacity Limits */}
            <section className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 border-b border-emerald-100 pb-1">
                Quotas and Limits
              </h4>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">
                    Seat Capacity <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    required
                    type="number"
                    min="1"
                    step="1"
                    value={form.userLimit}
                    onChange={(e) => updateField('userLimit', e.target.value)}
                    placeholder="5"
                    className="h-9 text-xs border-slate-200 focus-visible:ring-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">
                    Lead Limit <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    required
                    type="number"
                    min="1"
                    step="1"
                    value={form.leadLimit}
                    onChange={(e) => updateField('leadLimit', e.target.value)}
                    placeholder="1000"
                    className="h-9 text-xs border-slate-200 focus-visible:ring-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">
                    Storage (Bytes) <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    required
                    type="number"
                    min="1"
                    step="1"
                    value={form.storageLimitBytes}
                    onChange={(e) => updateField('storageLimitBytes', e.target.value)}
                    placeholder="1073741824"
                    className="h-9 text-xs border-slate-200 focus-visible:ring-emerald-500"
                  />
                  <p className="text-[10px] text-slate-400">
                    {formatStorage(form.storageLimitBytes)}
                  </p>
                </div>
              </div>
            </section>

            {/* Section 4: Included Features */}
            <section className="space-y-2">
              <div className="flex items-center justify-between border-b border-emerald-100 pb-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                  Included Features
                </h4>
                <span className="text-[10px] text-slate-400">One feature per line</span>
              </div>
              <Textarea
                rows={5}
                value={form.features}
                onChange={(e) => updateField('features', e.target.value)}
                placeholder={'4 Reels\n3 Creative Posts\n1 Influencer Promotion\n3 Stories\nPriority 24/7 Support'}
                className="text-xs border-slate-200 focus-visible:ring-emerald-500 leading-relaxed font-mono"
              />
            </section>
          </div>
        )}
      </FormDrawer>

      {/* ── 11. View Details Modal ────────────────────────────────── */}
      <Dialog open={!!detail} onOpenChange={(open) => !open && setDetail(null)}>
        <DialogContent className="max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-[#16A34A] ring-1 ring-emerald-200">
                <FontAwesomeIcon icon={faLayerGroup} className="size-4" />
              </div>
              <span>{detail?.name}</span>
              <span className="font-mono text-xs text-slate-500 font-normal">({detail?.code})</span>
            </DialogTitle>
          </DialogHeader>

          {detailLoading ? (
            <div className="py-8 text-center text-xs text-slate-500">Loading plan details…</div>
          ) : detail ? (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Status
                  </span>
                  <span
                    className={`inline-block mt-0.5 rounded-full px-2 py-0.5 text-xs font-semibold ${
                      detail.deletedAt
                        ? 'bg-slate-200 text-slate-700'
                        : detail.isActive
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {detail.deletedAt ? 'Archived' : detail.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Active Subscribers
                  </span>
                  <span className="text-sm font-extrabold text-slate-900 mt-0.5 block">
                    {detail.subscriberCount ?? 0}
                  </span>
                </div>
              </div>

              {detail.description && (
                <p className="text-xs text-slate-600 bg-slate-50/60 p-3 rounded-xl border border-slate-100 leading-relaxed">
                  {detail.description}
                </p>
              )}

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl border border-slate-100 bg-slate-50">
                  <span className="text-[10px] text-slate-400 block font-semibold">Monthly Price</span>
                  <span className="font-extrabold text-slate-900 text-sm mt-0.5 block">
                    {money(detail.monthlyPrice)}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl border border-slate-100 bg-slate-50">
                  <span className="text-[10px] text-slate-400 block font-semibold">Yearly Price</span>
                  <span className="font-extrabold text-slate-900 text-sm mt-0.5 block">
                    {money(detail.yearlyPrice)}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl border border-slate-100 bg-slate-50">
                  <span className="text-[10px] text-slate-400 block font-semibold">Seat Limit</span>
                  <span className="font-bold text-slate-800 text-xs mt-0.5 block">
                    {detail.userLimit} Seats
                  </span>
                </div>
                <div className="p-2.5 rounded-xl border border-slate-100 bg-slate-50">
                  <span className="text-[10px] text-slate-400 block font-semibold">Lead Quota</span>
                  <span className="font-bold text-slate-800 text-xs mt-0.5 block">
                    {detail.leadLimit ? Number(detail.leadLimit).toLocaleString() : 'Unlimited'}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl border border-slate-100 bg-slate-50">
                  <span className="text-[10px] text-slate-400 block font-semibold">Storage Limit</span>
                  <span className="font-bold text-slate-800 text-xs mt-0.5 block">
                    {formatStorage(detail.storageLimitBytes)}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl border border-slate-100 bg-slate-50">
                  <span className="text-[10px] text-slate-400 block font-semibold">Created On</span>
                  <span className="font-medium text-slate-700 text-xs mt-0.5 block">
                    {dateStr(detail.createdAt)}
                  </span>
                </div>
              </div>

              {/* Included Features */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
                  All Included Features ({featuresOf(detail).length})
                </span>
                <ul className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {featuresOf(detail).map((feature, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-2 rounded-lg bg-emerald-50/60 border border-emerald-100 px-2.5 py-1.5 text-xs font-medium text-emerald-900"
                    >
                      <FontAwesomeIcon icon={faCheck} className="text-emerald-600 size-3" />
                      <span>{feature}</span>
                    </li>
                  ))}
                  {!featuresOf(detail).length && (
                    <li className="text-xs text-slate-400 italic">No features configured</li>
                  )}
                </ul>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* ── 12. Delete Confirmation Dialog ────────────────────────── */}
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open && !busy) setDeleting(null);
        }}
        title={`Archive Subscription Plan "${deleting?.name || ''}"?`}
        description="The plan will be archived. Plans with active subscribers cannot be removed until all subscribers migrate to another plan."
        confirmLabel="Archive Plan"
        variant="destructive"
        loading={busy}
        closeOnConfirm={false}
        onConfirm={remove}
      />
    </div>
  );
}

export default SubscriptionPlans;
