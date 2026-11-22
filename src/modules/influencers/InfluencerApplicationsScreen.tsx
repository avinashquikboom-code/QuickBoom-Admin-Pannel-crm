// @ts-nocheck
'use client';

import * as React from 'react';
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  RotateCw,
  SlidersHorizontal,
  MoreHorizontal,
  Eye,
  Check,
  X,
  UserX,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  Calendar,
} from 'lucide-react';
import { Instagram, Youtube } from './SocialIcons';
import { PageTitleCard } from '@/components/common/PageTitleCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { readSession } from '@/lib/auth/admin-session';
import { useAuthStore } from '../../../lib/store';
import { isUserAdmin } from '../../../lib/access-control';
import {
  InfluencerAdminService,
  type InfluencerItem,
  type InfluencerCategoryItem,
} from '../../../lib/services/influencer.service';
import { ApplicationDrawer } from './ApplicationDrawer';
import { RejectionDialog } from './RejectionDialog';
import { cn } from '@/lib/utils';

const TitleCard = PageTitleCard as unknown as React.ComponentType<{
  category?: string;
  moduleName?: string;
  title: string;
  description?: string;
  icon?: unknown;
  actions?: React.ReactNode;
  badge?: React.ReactNode;
  className?: string;
}>;

type AppStatusTab = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
type SortField = 'name' | 'followers' | 'createdAt';
type SortOrder = 'asc' | 'desc';

export function InfluencerApplicationsScreen() {
  const [mounted, setMounted] = React.useState(false);
  const [applications, setApplications] = React.useState<InfluencerItem[]>([]);
  const [categories, setCategories] = React.useState<InfluencerCategoryItem[]>([]);
  const [counts, setCounts] = React.useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    suspended: 0,
  });
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [refresh, setRefresh] = React.useState(0);

  // Filters & Search
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<AppStatusTab>('ALL');
  const [categoryFilter, setCategoryFilter] = React.useState('ALL');
  const [sortField, setSortField] = React.useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = React.useState<SortOrder>('desc');

  // Pagination
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);

  // Drawers & Dialogs
  const [selectedApp, setSelectedApp] = React.useState<InfluencerItem | null>(null);
  const [rejectTarget, setRejectTarget] = React.useState<InfluencerItem | null>(null);
  const [mutating, setMutating] = React.useState(false);

  const authUser = useAuthStore((state) => state.user);
  const [sessionUser, setSessionUser] = React.useState<unknown>(null);

  React.useEffect(() => {
    setMounted(true);
    setSessionUser(readSession()?.user ?? null);
  }, [authUser]);

  const canManage = isUserAdmin(authUser) || isUserAdmin(sessionUser);

  // Load categories
  React.useEffect(() => {
    InfluencerAdminService.getCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  // Fetch applications
  React.useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    InfluencerAdminService.getApplications({
      search: search.trim() || undefined,
      category: categoryFilter !== 'ALL' ? categoryFilter : undefined,
      status: statusFilter !== 'ALL' ? statusFilter : undefined,
    })
      .then((res) => {
        if (!active) return;
        setApplications(res.items || []);
        if (res.counts) {
          setCounts(res.counts);
        }
      })
      .catch((err: any) => {
        if (!active) return;
        setError(err?.response?.data?.message || 'Failed to load influencer applications.');
        setApplications([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [refresh, search, statusFilter, categoryFilter]);

  // Sort applications client side
  const sortedApplications = React.useMemo(() => {
    return [...applications].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortField === 'followers') {
        comparison = (a.followers || 0) - (b.followers || 0);
      } else if (sortField === 'createdAt') {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [applications, sortField, sortOrder]);

  // Reset page
  React.useEffect(() => {
    setPage(1);
  }, [statusFilter, categoryFilter, search, pageSize]);

  // Paginated records
  const totalPages = Math.max(1, Math.ceil(sortedApplications.length / pageSize));
  const paginatedList = React.useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedApplications.slice(start, start + pageSize);
  }, [sortedApplications, page, pageSize]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Status Actions
  const handleApprove = async (app: InfluencerItem) => {
    try {
      await InfluencerAdminService.approveInfluencer(app.id);
      toast.success(`Application approved for ${app.name}`);
      setRefresh((v) => v + 1);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to approve application');
    }
  };

  const handleSuspend = async (app: InfluencerItem) => {
    try {
      await InfluencerAdminService.suspendInfluencer(app.id);
      toast.success(`Application suspended for ${app.name}`);
      setRefresh((v) => v + 1);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to suspend application');
    }
  };

  const handleConfirmReject = async (reason: string) => {
    if (!rejectTarget) return;
    setMutating(true);
    try {
      await InfluencerAdminService.rejectInfluencer(rejectTarget.id, reason);
      toast.success(`Application rejected for ${rejectTarget.name}`);
      setRejectTarget(null);
      setRefresh((v) => v + 1);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to reject application');
    } finally {
      setMutating(false);
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    if (applications.length === 0) {
      toast.error('No applications to export');
      return;
    }
    const cell = (val: unknown) => {
      const text = String(val ?? '');
      const safe = /^[=+\-@\t\r\n]/.test(text) ? `'${text}` : text;
      return `"${safe.replaceAll('"', '""')}"`;
    };
    const rows = [
      ['Applicant Name', 'Handle', 'Platform', 'Category', 'Followers', 'Status', 'Email', 'Phone', 'Applied Date', 'Rejection Reason'],
      ...applications.map((a) => [
        a.name,
        a.handle || '',
        a.platform,
        a.categoryName || '',
        a.followersCount || a.followers,
        a.status,
        a.email || '',
        a.phone || '',
        a.createdAt ? new Date(a.createdAt).toLocaleDateString() : '',
        a.rejectionReason || '',
      ]),
    ];
    const blob = new Blob(['\uFEFF' + rows.map((r) => r.map(cell).join(',')).join('\r\n')], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'influencer-applications.csv';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast.success(`Exported ${applications.length} applications to CSV`);
  };

  const statusTabs: Array<{ key: AppStatusTab; label: string; count: number }> = [
    { key: 'ALL', label: 'All', count: counts.total },
    { key: 'PENDING', label: 'Pending', count: counts.pending },
    { key: 'APPROVED', label: 'Approved', count: counts.approved },
    { key: 'REJECTED', label: 'Rejected', count: counts.rejected },
    { key: 'SUSPENDED', label: 'Suspended', count: counts.suspended },
  ];

  return (
    <div className="w-full min-w-0 space-y-5 sm:space-y-6 pb-20 overflow-x-hidden">
      {/* 1. Header / Page Banner */}
      <TitleCard
        category="INFLUENCER MANAGEMENT"
        title="Influencer Applications"
        description="Review influencer applications and manage approval decisions."
        icon={FileText}
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              type="button"
              variant="outline"
              disabled={loading || applications.length === 0}
              onClick={handleExportCSV}
              className="h-10 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs gap-2 transition-colors cursor-pointer"
            >
              <Download className="size-4 text-slate-500" />
              <span>Export CSV</span>
            </Button>
          </div>
        }
      />

      {/* 2. Statistics KPI Cards (5 Cards matching real API counts) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Total Applications */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs flex items-center justify-between gap-2 min-w-0">
          <div className="space-y-1 min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block truncate">
              Total Applications
            </span>
            <p className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
              {loading ? <span className="inline-block h-6 w-12 animate-pulse rounded bg-slate-100" /> : Number(counts.total).toLocaleString()}
            </p>
          </div>
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-emerald-100 bg-[#E8F1EC] text-[#163A2E] shadow-2xs">
            <FileText className="size-5 text-[#163A2E]" />
          </div>
        </div>

        {/* Pending */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs flex items-center justify-between gap-2 min-w-0">
          <div className="space-y-1 min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block truncate">
              Pending
            </span>
            <p className="text-xl sm:text-2xl font-extrabold tracking-tight text-amber-600">
              {loading ? <span className="inline-block h-6 w-12 animate-pulse rounded bg-slate-100" /> : Number(counts.pending).toLocaleString()}
            </p>
          </div>
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-amber-200/80 bg-amber-50 text-amber-600 shadow-2xs">
            <Clock className="size-5 text-amber-600" />
          </div>
        </div>

        {/* Approved */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs flex items-center justify-between gap-2 min-w-0">
          <div className="space-y-1 min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block truncate">
              Approved
            </span>
            <p className="text-xl sm:text-2xl font-extrabold tracking-tight text-emerald-700">
              {loading ? <span className="inline-block h-6 w-12 animate-pulse rounded bg-slate-100" /> : Number(counts.approved).toLocaleString()}
            </p>
          </div>
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-emerald-200/80 bg-emerald-50 text-emerald-700 shadow-2xs">
            <CheckCircle2 className="size-5 text-emerald-700" />
          </div>
        </div>

        {/* Rejected */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs flex items-center justify-between gap-2 min-w-0">
          <div className="space-y-1 min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block truncate">
              Rejected
            </span>
            <p className="text-xl sm:text-2xl font-extrabold tracking-tight text-rose-600">
              {loading ? <span className="inline-block h-6 w-12 animate-pulse rounded bg-slate-100" /> : Number(counts.rejected).toLocaleString()}
            </p>
          </div>
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-rose-200/80 bg-rose-50 text-rose-600 shadow-2xs">
            <XCircle className="size-5 text-rose-600" />
          </div>
        </div>

        {/* Suspended */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs flex items-center justify-between gap-2 min-w-0 col-span-2 sm:col-span-1">
          <div className="space-y-1 min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block truncate">
              Suspended
            </span>
            <p className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-600">
              {loading ? <span className="inline-block h-6 w-12 animate-pulse rounded bg-slate-100" /> : Number(counts.suspended).toLocaleString()}
            </p>
          </div>
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-slate-200/80 bg-slate-50 text-slate-500 shadow-2xs">
            <AlertCircle className="size-5 text-slate-500" />
          </div>
        </div>
      </div>

      {/* 3. Filters Toolbar */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 sm:p-4 shadow-xs space-y-3.5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100/90 overflow-x-auto no-scrollbar max-w-full">
            {statusTabs.map((tab) => {
              const active = statusFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setStatusFilter(tab.key)}
                  className={cn(
                    'flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer',
                    active
                      ? 'bg-white text-[#163A2E] shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  )}
                >
                  <span>{tab.label}</span>
                  <span
                    className={cn(
                      'text-[10px] font-bold px-1.5 py-0.5 rounded-full transition-colors',
                      active
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-200/80 text-slate-600'
                    )}
                  >
                    {loading ? '—' : tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right: Search, Category & Refresh */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Select
              value={categoryFilter}
              onValueChange={(val) => setCategoryFilter(val || 'ALL')}
            >
              <SelectTrigger className="h-9.5 w-36 text-xs bg-slate-50 border-slate-200 rounded-xl">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="ALL" className="text-xs">All Categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)} className="text-xs">
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative flex-1 sm:w-60 sm:flex-initial min-w-[180px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
              <Input
                type="text"
                placeholder="Search applicant or handle..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9.5 pl-9 pr-8 text-xs bg-slate-50 border-slate-200 focus-visible:bg-white focus-visible:ring-brand rounded-xl w-full"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => setRefresh((v) => v + 1)}
              className="h-9.5 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-2 shadow-2xs"
            >
              <RotateCw className={cn('size-3.5 text-slate-500', loading && 'animate-spin')} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>
      </div>

      {/* 4. Applications Table Card */}
      <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
        {error ? (
          <div role="alert" className="p-8 text-center space-y-3">
            <div className="size-12 rounded-full bg-rose-50 text-rose-600 mx-auto flex items-center justify-center border border-rose-100">
              <AlertCircle className="size-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Unable to load applications</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">{error}</p>
            <Button
              variant="outline"
              onClick={() => setRefresh((v) => v + 1)}
              className="mt-2 text-xs font-semibold border-slate-200 rounded-xl"
            >
              Try again
            </Button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th scope="col" className="px-4 py-3.5 min-w-[220px]">
                      <button
                        type="button"
                        onClick={() => handleSort('name')}
                        className="group flex items-center gap-1.5 text-slate-600 hover:text-slate-900 uppercase cursor-pointer"
                      >
                        <span>Applicant</span>
                        {sortField === 'name' ? (
                          sortOrder === 'asc' ? <ArrowUp className="size-3.5 text-[#163A2E]" /> : <ArrowDown className="size-3.5 text-[#163A2E]" />
                        ) : (
                          <ArrowUpDown className="size-3 text-slate-400 group-hover:text-slate-600" />
                        )}
                      </button>
                    </th>
                    <th scope="col" className="px-4 py-3.5 min-w-[140px]">
                      Social Handle
                    </th>
                    <th scope="col" className="px-4 py-3.5 min-w-[120px]">
                      Category
                    </th>
                    <th scope="col" className="px-4 py-3.5 min-w-[110px]">
                      <button
                        type="button"
                        onClick={() => handleSort('followers')}
                        className="group flex items-center gap-1.5 text-slate-600 hover:text-slate-900 uppercase cursor-pointer"
                      >
                        <span>Followers</span>
                        {sortField === 'followers' ? (
                          sortOrder === 'asc' ? <ArrowUp className="size-3.5 text-[#163A2E]" /> : <ArrowDown className="size-3.5 text-[#163A2E]" />
                        ) : (
                          <ArrowUpDown className="size-3 text-slate-400 group-hover:text-slate-600" />
                        )}
                      </button>
                    </th>
                    <th scope="col" className="px-4 py-3.5 min-w-[120px]">
                      <button
                        type="button"
                        onClick={() => handleSort('createdAt')}
                        className="group flex items-center gap-1.5 text-slate-600 hover:text-slate-900 uppercase cursor-pointer"
                      >
                        <span>Applied Date</span>
                        {sortField === 'createdAt' ? (
                          sortOrder === 'asc' ? <ArrowUp className="size-3.5 text-[#163A2E]" /> : <ArrowDown className="size-3.5 text-[#163A2E]" />
                        ) : (
                          <ArrowUpDown className="size-3 text-slate-400 group-hover:text-slate-600" />
                        )}
                      </button>
                    </th>
                    <th scope="col" className="px-4 py-3.5 min-w-[110px]">
                      Status
                    </th>
                    <th scope="col" className="w-16 px-4 py-3.5 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {loading && (
                    <>
                      {[1, 2, 3, 4, 5].map((idx) => (
                        <tr key={idx} className="animate-pulse">
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="size-10 rounded-xl bg-slate-200 shrink-0" />
                              <div className="space-y-1.5 flex-1">
                                <div className="h-4 bg-slate-200 rounded w-28" />
                                <div className="h-3 bg-slate-100 rounded w-36" />
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5"><div className="h-4 bg-slate-100 rounded w-20" /></td>
                          <td className="px-4 py-3.5"><div className="h-4 bg-slate-100 rounded w-16" /></td>
                          <td className="px-4 py-3.5"><div className="h-4 bg-slate-100 rounded w-12" /></td>
                          <td className="px-4 py-3.5"><div className="h-3 bg-slate-100 rounded w-20" /></td>
                          <td className="px-4 py-3.5"><div className="h-5 bg-slate-100 rounded-full w-16" /></td>
                          <td className="px-4 py-3.5 text-right"><div className="size-7 bg-slate-100 rounded-lg ml-auto" /></td>
                        </tr>
                      ))}
                    </>
                  )}

                  {!loading && paginatedList.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center">
                        <div className="size-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
                          <FileText className="size-6" />
                        </div>
                        <p className="font-bold text-slate-800 text-sm">No applications found</p>
                        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                          {search
                            ? `No applications matching "${search}". Try another filter.`
                            : 'No creator applications in this status category.'}
                        </p>
                      </td>
                    </tr>
                  )}

                  {!loading &&
                    paginatedList.map((app) => {
                      const isApproved = app.status === 'APPROVED' || app.status === 'ACTIVE';
                      const isPending = app.status === 'PENDING';
                      const isRejected = app.status === 'REJECTED';
                      const isSuspended = app.status === 'SUSPENDED';

                      return (
                        <tr key={app.id} className="transition-colors hover:bg-slate-50/80">
                          {/* Applicant */}
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="size-10 rounded-xl bg-emerald-50 border border-emerald-100 shrink-0 overflow-hidden flex items-center justify-center">
                                {app.profileImage || app.avatarUrl ? (
                                  <img
                                    src={app.profileImage || app.avatarUrl || ''}
                                    alt={app.name}
                                    className="size-full object-cover"
                                  />
                                ) : (
                                  <span className="font-bold text-[#163A2E] text-xs">
                                    {app.name.slice(0, 2).toUpperCase()}
                                  </span>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <button
                                  type="button"
                                  onClick={() => setSelectedApp(app)}
                                  className="font-bold text-sm text-slate-900 hover:text-emerald-700 transition-colors truncate block text-left cursor-pointer"
                                >
                                  {app.name}
                                </button>
                                <span className="text-xs text-slate-400 block truncate">
                                  {app.email || app.phone || 'No direct contact'}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Social Handle */}
                          <td className="px-4 py-3.5 text-xs">
                            <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                              {app.platform === 'YOUTUBE' ? (
                                <Youtube className="size-3.5 text-red-500 shrink-0" />
                              ) : (
                                <Instagram className="size-3.5 text-pink-500 shrink-0" />
                              )}
                              <span className="truncate max-w-[120px]">
                                {app.handle ? `@${app.handle.replace(/^@/, '')}` : '—'}
                              </span>
                            </div>
                          </td>

                          {/* Category */}
                          <td className="px-4 py-3.5">
                            <Badge className="bg-slate-100 text-slate-700 text-[11px] font-semibold border border-slate-200/80 shadow-none px-2 py-0.5 rounded-md">
                              {app.categoryName || app.category?.name || 'General'}
                            </Badge>
                          </td>

                          {/* Followers */}
                          <td className="px-4 py-3.5 text-xs font-extrabold text-slate-900">
                            {app.followersCount || Number(app.followers || 0).toLocaleString()}
                          </td>

                          {/* Applied Date */}
                          <td className="px-4 py-3.5 text-xs text-slate-600 whitespace-nowrap">
                            {app.createdAt
                              ? new Date(app.createdAt).toLocaleDateString(undefined, {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })
                              : '—'}
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3.5">
                            {isApproved ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-[#E8F8EE] text-[#169F4D] text-[11px] font-semibold px-2.5 py-0.5">
                                <span className="size-1.5 rounded-full bg-[#1FC45B]" />
                                <span>Approved</span>
                              </span>
                            ) : isPending ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200/80 bg-amber-50 text-amber-700 text-[11px] font-semibold px-2.5 py-0.5">
                                <span className="size-1.5 rounded-full bg-amber-500" />
                                <span>Pending</span>
                              </span>
                            ) : isSuspended ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 text-slate-600 text-[11px] font-semibold px-2.5 py-0.5">
                                <span className="size-1.5 rounded-full bg-slate-400" />
                                <span>Suspended</span>
                              </span>
                            ) : (
                              <span
                                className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 text-rose-700 text-[11px] font-semibold px-2.5 py-0.5"
                                title={app.rejectionReason || 'Rejected'}
                              >
                                <span className="size-1.5 rounded-full bg-rose-500" />
                                <span>Rejected</span>
                              </span>
                            )}
                          </td>

                          {/* Row Actions */}
                          <td className="px-4 py-3.5 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors ml-auto cursor-pointer shadow-2xs"
                                aria-label="Open application action menu"
                              >
                                <MoreHorizontal className="size-4" />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                className="w-48 bg-white border border-slate-200 shadow-xl rounded-xl p-1.5"
                              >
                                <DropdownMenuItem
                                  onClick={() => setSelectedApp(app)}
                                  className="text-xs p-2 rounded-lg cursor-pointer text-slate-700 hover:bg-emerald-50 hover:text-[#173D30] flex items-center gap-2"
                                >
                                  <Eye className="size-3.5 text-slate-500" />
                                  <span>View Details</span>
                                </DropdownMenuItem>

                                {canManage && (
                                  <>
                                    {!isApproved && (
                                      <DropdownMenuItem
                                        onClick={() => handleApprove(app)}
                                        className="text-xs p-2 rounded-lg cursor-pointer text-emerald-700 hover:bg-emerald-50 flex items-center gap-2"
                                      >
                                        <Check className="size-3.5 text-emerald-600" />
                                        <span>Approve Application</span>
                                      </DropdownMenuItem>
                                    )}

                                    {!isRejected && (
                                      <DropdownMenuItem
                                        onClick={() => setRejectTarget(app)}
                                        className="text-xs p-2 rounded-lg cursor-pointer text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                                      >
                                        <X className="size-3.5 text-rose-600" />
                                        <span>Reject with Reason</span>
                                      </DropdownMenuItem>
                                    )}

                                    {!isSuspended && !isPending && (
                                      <DropdownMenuItem
                                        onClick={() => handleSuspend(app)}
                                        className="text-xs p-2 rounded-lg cursor-pointer text-amber-700 hover:bg-amber-50 flex items-center gap-2"
                                      >
                                        <UserX className="size-3.5 text-amber-600" />
                                        <span>Suspend Creator</span>
                                      </DropdownMenuItem>
                                    )}
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3.5 border-t border-slate-200/80 bg-slate-50/50 text-xs text-slate-600">
              <div className="flex items-center gap-2 text-slate-500">
                <span>
                  Showing{' '}
                  <strong className="text-slate-900 font-bold">
                    {sortedApplications.length === 0 ? 0 : (page - 1) * pageSize + 1}
                  </strong>{' '}
                  to{' '}
                  <strong className="text-slate-900 font-bold">
                    {Math.min(page * pageSize, sortedApplications.length)}
                  </strong>{' '}
                  of{' '}
                  <strong className="text-slate-900 font-bold">
                    {sortedApplications.length}
                  </strong>{' '}
                  applications
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 hidden sm:inline">Rows:</span>
                  <Select
                    value={String(pageSize)}
                    onValueChange={(val) => {
                      if (val) setPageSize(Number(val));
                    }}
                  >
                    <SelectTrigger className="h-8 w-16 bg-white text-xs border-slate-200 rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="5" className="text-xs">5</SelectItem>
                      <SelectItem value="10" className="text-xs">10</SelectItem>
                      <SelectItem value="25" className="text-xs">25</SelectItem>
                      <SelectItem value="50" className="text-xs">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 px-1">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="size-8 p-0 rounded-lg bg-white border-slate-200 cursor-pointer disabled:opacity-40"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="size-8 p-0 rounded-lg bg-white border-slate-200 cursor-pointer disabled:opacity-40"
                    aria-label="Next page"
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 5. Application Detail Drawer */}
      <ApplicationDrawer
        application={selectedApp}
        open={Boolean(selectedApp)}
        onClose={() => setSelectedApp(null)}
        onApprove={handleApprove}
        onReject={(app) => setRejectTarget(app)}
        onSuspend={handleSuspend}
      />

      {/* 6. Rejection Reason Dialog */}
      <RejectionDialog
        open={Boolean(rejectTarget)}
        onOpenChange={(open) => !open && setRejectTarget(null)}
        title="Reject Influencer Application"
        description="Please provide a clear reason for rejecting this creator application."
        targetName={rejectTarget?.name}
        actionLabel="Reject Application"
        loading={mutating}
        onConfirm={handleConfirmReject}
      />
    </div>
  );
}
