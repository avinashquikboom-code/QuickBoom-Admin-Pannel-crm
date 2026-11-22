// @ts-nocheck
'use client';

import * as React from 'react';
import {
  Users,
  UserCheck,
  Clock,
  Plus,
  Download,
  RotateCw,
  Search,
  SlidersHorizontal,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  UserX,
  X,
  AlertCircle,
  Star,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Building2,
  ExternalLink,
} from 'lucide-react';
import { Instagram, Youtube } from './SocialIcons';
import { PageTitleCard } from '@/components/common/PageTitleCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
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
import { PermanentDeleteDialog } from '@/components/common/PermanentDeleteDialog';
import { InfluencerDrawer } from './InfluencerDrawer';
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

const DeleteDialog = PermanentDeleteDialog as unknown as React.ComponentType<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  recordName?: string;
  count?: number;
  noun?: string;
  warningNote?: string;
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
}>;

type StatusTab = 'ALL' | 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'REJECTED';
type SortField = 'name' | 'followers' | 'engagementRate' | 'createdAt';
type SortOrder = 'asc' | 'desc';

export function InfluencerHubScreen() {
  const [mounted, setMounted] = React.useState(false);
  const [influencers, setInfluencers] = React.useState<InfluencerItem[]>([]);
  const [categories, setCategories] = React.useState<InfluencerCategoryItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [refresh, setRefresh] = React.useState(0);

  // Filters & Search
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<StatusTab>('ALL');
  const [categoryFilter, setCategoryFilter] = React.useState('ALL');
  const [sortField, setSortField] = React.useState<SortField>('name');
  const [sortOrder, setSortOrder] = React.useState<SortOrder>('asc');

  // Pagination
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);

  // Selection
  const [selectedIds, setSelectedIds] = React.useState<Set<number>>(new Set());

  // Drawers & Modals
  const [drawerState, setDrawerState] = React.useState<{
    id: number | null;
    mode: 'create' | 'edit' | 'view';
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<InfluencerItem | null>(null);
  const [rejectTarget, setRejectTarget] = React.useState<InfluencerItem | null>(null);
  const [mutating, setMutating] = React.useState(false);

  // Columns visibility
  const [visibleColumns, setVisibleColumns] = React.useState({
    handle: true,
    platform: true,
    category: true,
    followers: true,
    engagement: true,
    bookings: true,
    status: true,
  });

  const authUser = useAuthStore((state) => state.user);
  const [sessionUser, setSessionUser] = React.useState<unknown>(null);

  React.useEffect(() => {
    setMounted(true);
    setSessionUser(readSession()?.user ?? null);
  }, [authUser]);

  const canManage = isUserAdmin(authUser) || isUserAdmin(sessionUser);

  // Load categories once
  React.useEffect(() => {
    InfluencerAdminService.getCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  // Fetch influencers
  React.useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    InfluencerAdminService.getInfluencers()
      .then((data) => {
        if (!active) return;
        setInfluencers(data);
      })
      .catch((err: any) => {
        if (!active) return;
        setError(err?.response?.data?.message || 'Failed to load influencers list.');
        setInfluencers([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [refresh]);

  // Derived KPI counts
  const stats = React.useMemo(() => {
    const total = influencers.length;
    const active = influencers.filter((i) => i.status === 'ACTIVE' || i.status === 'APPROVED').length;
    const pending = influencers.filter((i) => i.status === 'PENDING').length;
    return { total, active, pending };
  }, [influencers]);

  // Filtered & Searched List
  const filteredList = React.useMemo(() => {
    let list = influencers.filter((item) => {
      // Status
      if (statusFilter === 'ACTIVE' && item.status !== 'ACTIVE' && item.status !== 'APPROVED') {
        return false;
      }
      if (statusFilter !== 'ALL' && statusFilter !== 'ACTIVE' && item.status !== statusFilter) {
        return false;
      }
      // Category
      if (categoryFilter !== 'ALL') {
        const catIdMatch = String(item.categoryId) === categoryFilter;
        const catNameMatch = item.categoryName?.toLowerCase() === categoryFilter.toLowerCase();
        if (!catIdMatch && !catNameMatch) return false;
      }
      return true;
    });

    // Search query
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          (i.handle && i.handle.toLowerCase().includes(q)) ||
          (i.city && i.city.toLowerCase().includes(q)) ||
          (i.location && i.location.toLowerCase().includes(q)) ||
          (i.categoryName && i.categoryName.toLowerCase().includes(q))
      );
    }

    // Sort
    return list.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortField === 'followers') {
        comparison = (a.followers || 0) - (b.followers || 0);
      } else if (sortField === 'engagementRate') {
        comparison = (a.engagementRate || 0) - (b.engagementRate || 0);
      } else if (sortField === 'createdAt') {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [influencers, statusFilter, categoryFilter, search, sortField, sortOrder]);

  // Reset pagination on filter change
  React.useEffect(() => {
    setPage(1);
  }, [statusFilter, categoryFilter, search, pageSize]);

  // Paginated records
  const totalPages = Math.max(1, Math.ceil(filteredList.length / pageSize));
  const paginatedList = React.useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredList.slice(start, start + pageSize);
  }, [filteredList, page, pageSize]);

  // Selection handlers
  const isAllPageSelected =
    paginatedList.length > 0 && paginatedList.every((item) => selectedIds.has(item.id));
  const isSomePageSelected =
    paginatedList.some((item) => selectedIds.has(item.id)) && !isAllPageSelected;

  const handleToggleSelectAll = (checked: boolean) => {
    const next = new Set(selectedIds);
    if (checked) {
      paginatedList.forEach((item) => next.add(item.id));
    } else {
      paginatedList.forEach((item) => next.delete(item.id));
    }
    setSelectedIds(next);
  };

  const handleToggleSelectRow = (id: number, checked: boolean) => {
    const next = new Set(selectedIds);
    if (checked) {
      next.add(id);
    } else {
      next.delete(id);
    }
    setSelectedIds(next);
  };

  // Sort toggle
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Approve action
  const handleApprove = async (id: number) => {
    try {
      await InfluencerAdminService.approveInfluencer(id);
      toast.success('Influencer approved and published to hub');
      setRefresh((v) => v + 1);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to approve influencer');
    }
  };

  // Suspend action
  const handleSuspend = async (id: number) => {
    try {
      await InfluencerAdminService.suspendInfluencer(id);
      toast.success('Influencer suspended');
      setRefresh((v) => v + 1);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to suspend influencer');
    }
  };

  // Reject confirm
  const handleConfirmReject = async (reason: string) => {
    if (!rejectTarget) return;
    setMutating(true);
    try {
      await InfluencerAdminService.rejectInfluencer(rejectTarget.id, reason);
      toast.success('Influencer rejected');
      setRejectTarget(null);
      setRefresh((v) => v + 1);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to reject influencer');
    } finally {
      setMutating(false);
    }
  };

  // Delete confirm
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setMutating(true);
    try {
      await InfluencerAdminService.deleteInfluencer(deleteTarget.id);
      toast.success('Influencer removed successfully');
      setDeleteTarget(null);
      setRefresh((v) => v + 1);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to delete influencer');
    } finally {
      setMutating(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const listToExport = filteredList.length > 0 ? filteredList : influencers;
    if (listToExport.length === 0) {
      toast.error('No influencer records to export');
      return;
    }
    const cell = (val: unknown) => {
      const text = String(val ?? '');
      const safe = /^[=+\-@\t\r\n]/.test(text) ? `'${text}` : text;
      return `"${safe.replaceAll('"', '""')}"`;
    };
    const rows = [
      ['Name', 'Handle', 'Platform', 'Category', 'Followers', 'Engagement Rate', 'City', 'Starting Price', 'Status', 'Email', 'Phone'],
      ...listToExport.map((i) => [
        i.name,
        i.handle || '',
        i.platform,
        i.categoryName || '',
        i.followersCount || i.followers,
        `${i.engagementRate || 0}%`,
        i.city || i.location || '',
        i.startingPrice || 0,
        i.status,
        i.email || '',
        i.phone || '',
      ]),
    ];
    const blob = new Blob(['\uFEFF' + rows.map((r) => r.map(cell).join(',')).join('\r\n')], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'influencers-hub.csv';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast.success(`Exported ${listToExport.length} influencers to CSV`);
  };

  const statusTabs: Array<{ key: StatusTab; label: string; count?: number }> = [
    { key: 'ALL', label: 'All', count: stats.total },
    { key: 'ACTIVE', label: 'Active / Approved', count: stats.active },
    { key: 'PENDING', label: 'Pending', count: stats.pending },
    { key: 'SUSPENDED', label: 'Suspended' },
    { key: 'REJECTED', label: 'Rejected' },
  ];

  return (
    <div className="w-full min-w-0 space-y-5 sm:space-y-6 pb-20 overflow-x-hidden">
      {/* 1. Header / Page Banner */}
      <TitleCard
        category="INFLUENCER MANAGEMENT"
        title="Influencer Hub"
        description="Manage influencer profiles, performance information, and account status."
        icon={Users}
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              type="button"
              variant="outline"
              disabled={loading || influencers.length === 0}
              onClick={handleExportCSV}
              className="h-10 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs gap-2 transition-colors cursor-pointer"
            >
              <Download className="size-4 text-slate-500" />
              <span>Export CSV</span>
            </Button>
            {canManage && (
              <Button
                type="button"
                onClick={() => setDrawerState({ id: null, mode: 'create' })}
                className="h-10 px-4 rounded-xl bg-[#20C466] hover:bg-[#1ab35c] text-white text-xs font-bold shadow-2xs gap-2 transition-colors cursor-pointer"
              >
                <Plus className="size-4" />
                <span>Add Influencer</span>
              </Button>
            )}
          </div>
        }
      />

      {/* 2. Statistics KPI Cards (3 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Listed */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs flex items-center justify-between gap-3 min-w-0 transition-all hover:border-slate-300">
          <div className="space-y-1 min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block truncate">
              Total Listed Influencers
            </span>
            <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              {loading ? (
                <span className="inline-block h-7 w-14 animate-pulse rounded bg-slate-100" />
              ) : (
                Number(stats.total).toLocaleString()
              )}
            </p>
            <p className="text-[11px] text-slate-400 truncate">Total creators registered</p>
          </div>
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-100 bg-[#E8F1EC] text-[#163A2E] shadow-2xs">
            <Users className="size-6 text-[#163A2E]" />
          </div>
        </div>

        {/* Approved / Active */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs flex items-center justify-between gap-3 min-w-0 transition-all hover:border-slate-300">
          <div className="space-y-1 min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block truncate">
              Approved / Active
            </span>
            <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-emerald-700">
              {loading ? (
                <span className="inline-block h-7 w-14 animate-pulse rounded bg-slate-100" />
              ) : (
                Number(stats.active).toLocaleString()
              )}
            </p>
            <p className="text-[11px] text-slate-400 truncate">Live & bookable by customers</p>
          </div>
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-200/80 bg-emerald-50 text-emerald-700 shadow-2xs">
            <UserCheck className="size-6 text-emerald-700" />
          </div>
        </div>

        {/* Pending */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs flex items-center justify-between gap-3 min-w-0 transition-all hover:border-slate-300">
          <div className="space-y-1 min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block truncate">
              Pending Verification
            </span>
            <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-amber-600">
              {loading ? (
                <span className="inline-block h-7 w-14 animate-pulse rounded bg-slate-100" />
              ) : (
                Number(stats.pending).toLocaleString()
              )}
            </p>
            <p className="text-[11px] text-slate-400 truncate">Awaiting review in applications</p>
          </div>
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-amber-200/80 bg-amber-50 text-amber-600 shadow-2xs">
            <Clock className="size-6 text-amber-600" />
          </div>
        </div>
      </div>

      {/* 3. Search, Status Tabs, Category & Columns Toolbar */}
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
                  {tab.count !== undefined && (
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
                  )}
                </button>
              );
            })}
          </div>

          {/* Right Controls: Category Filter, Search, Columns & Refresh */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Category Dropdown */}
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

            {/* Search Input */}
            <div className="relative flex-1 sm:w-60 sm:flex-initial min-w-[180px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
              <Input
                type="text"
                placeholder="Search creator or handle..."
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

            {/* Columns Toggle */}
            <DropdownMenu>
              <DropdownMenuTrigger className="h-9.5 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-2 shadow-2xs">
                <SlidersHorizontal className="size-3.5 text-slate-500" />
                <span className="hidden sm:inline">Columns</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-white border border-slate-200 rounded-xl p-1.5 shadow-xl">
                <div className="px-2 py-1 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Columns
                </div>
                <DropdownMenuSeparator className="bg-slate-100" />
                <DropdownMenuCheckboxItem
                  checked={visibleColumns.handle}
                  onCheckedChange={(c) => setVisibleColumns((p) => ({ ...p, handle: Boolean(c) }))}
                  className="text-xs p-2 rounded-lg"
                >
                  Handle / Username
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={visibleColumns.category}
                  onCheckedChange={(c) => setVisibleColumns((p) => ({ ...p, category: Boolean(c) }))}
                  className="text-xs p-2 rounded-lg"
                >
                  Category
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={visibleColumns.followers}
                  onCheckedChange={(c) => setVisibleColumns((p) => ({ ...p, followers: Boolean(c) }))}
                  className="text-xs p-2 rounded-lg"
                >
                  Followers
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={visibleColumns.engagement}
                  onCheckedChange={(c) => setVisibleColumns((p) => ({ ...p, engagement: Boolean(c) }))}
                  className="text-xs p-2 rounded-lg"
                >
                  Engagement Rate
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={visibleColumns.bookings}
                  onCheckedChange={(c) => setVisibleColumns((p) => ({ ...p, bookings: Boolean(c) }))}
                  className="text-xs p-2 rounded-lg"
                >
                  Bookings
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={visibleColumns.status}
                  onCheckedChange={(c) => setVisibleColumns((p) => ({ ...p, status: Boolean(c) }))}
                  className="text-xs p-2 rounded-lg"
                >
                  Status
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Refresh */}
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

      {/* 4. Influencer Directory Table Card */}
      <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
        {error ? (
          <div role="alert" className="p-8 text-center space-y-3">
            <div className="size-12 rounded-full bg-rose-50 text-rose-600 mx-auto flex items-center justify-center border border-rose-100">
              <AlertCircle className="size-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Unable to load creators</h3>
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
                    {/* Checkbox */}
                    <th scope="col" className="w-12 px-4 py-3.5 text-center">
                      <Checkbox
                        aria-label="Select all creators"
                        checked={isAllPageSelected}
                        indeterminate={isSomePageSelected}
                        onCheckedChange={(checked) => handleToggleSelectAll(Boolean(checked))}
                        className="border-slate-300"
                      />
                    </th>

                    {/* Influencer Name & Avatar */}
                    <th scope="col" className="px-4 py-3.5 min-w-[220px]">
                      <button
                        type="button"
                        onClick={() => handleSort('name')}
                        className="group flex items-center gap-1.5 text-slate-600 hover:text-slate-900 uppercase cursor-pointer"
                      >
                        <span>Creator Name</span>
                        {sortField === 'name' ? (
                          sortOrder === 'asc' ? <ArrowUp className="size-3.5 text-[#163A2E]" /> : <ArrowDown className="size-3.5 text-[#163A2E]" />
                        ) : (
                          <ArrowUpDown className="size-3 text-slate-400 group-hover:text-slate-600" />
                        )}
                      </button>
                    </th>

                    {/* Handle */}
                    {visibleColumns.handle && (
                      <th scope="col" className="px-4 py-3.5 min-w-[140px]">
                        Handle
                      </th>
                    )}

                    {/* Category */}
                    {visibleColumns.category && (
                      <th scope="col" className="px-4 py-3.5 min-w-[130px]">
                        Category
                      </th>
                    )}

                    {/* Followers */}
                    {visibleColumns.followers && (
                      <th scope="col" className="px-4 py-3.5 min-w-[120px]">
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
                    )}

                    {/* Engagement Rate */}
                    {visibleColumns.engagement && (
                      <th scope="col" className="px-4 py-3.5 min-w-[120px]">
                        <button
                          type="button"
                          onClick={() => handleSort('engagementRate')}
                          className="group flex items-center gap-1.5 text-slate-600 hover:text-slate-900 uppercase cursor-pointer"
                        >
                          <span>Engagement</span>
                          {sortField === 'engagementRate' ? (
                            sortOrder === 'asc' ? <ArrowUp className="size-3.5 text-[#163A2E]" /> : <ArrowDown className="size-3.5 text-[#163A2E]" />
                          ) : (
                            <ArrowUpDown className="size-3 text-slate-400 group-hover:text-slate-600" />
                          )}
                        </button>
                      </th>
                    )}

                    {/* Bookings */}
                    {visibleColumns.bookings && (
                      <th scope="col" className="px-4 py-3.5 min-w-[100px]">
                        Bookings
                      </th>
                    )}

                    {/* Status */}
                    {visibleColumns.status && (
                      <th scope="col" className="px-4 py-3.5 min-w-[110px]">
                        Status
                      </th>
                    )}

                    {/* Actions */}
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
                          <td className="px-4 py-3.5 text-center">
                            <div className="size-4 bg-slate-200 rounded mx-auto" />
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="size-10 rounded-xl bg-slate-200 shrink-0" />
                              <div className="space-y-1.5 flex-1">
                                <div className="h-4 bg-slate-200 rounded w-32" />
                                <div className="h-3 bg-slate-100 rounded w-20" />
                              </div>
                            </div>
                          </td>
                          {visibleColumns.handle && (
                            <td className="px-4 py-3.5">
                              <div className="h-4 bg-slate-100 rounded w-24" />
                            </td>
                          )}
                          {visibleColumns.category && (
                            <td className="px-4 py-3.5">
                              <div className="h-4 bg-slate-100 rounded w-20" />
                            </td>
                          )}
                          {visibleColumns.followers && (
                            <td className="px-4 py-3.5">
                              <div className="h-4 bg-slate-100 rounded w-16" />
                            </td>
                          )}
                          {visibleColumns.engagement && (
                            <td className="px-4 py-3.5">
                              <div className="h-4 bg-slate-100 rounded w-12" />
                            </td>
                          )}
                          {visibleColumns.bookings && (
                            <td className="px-4 py-3.5">
                              <div className="h-4 bg-slate-100 rounded w-8" />
                            </td>
                          )}
                          {visibleColumns.status && (
                            <td className="px-4 py-3.5">
                              <div className="h-5 bg-slate-100 rounded-full w-20" />
                            </td>
                          )}
                          <td className="px-4 py-3.5 text-right">
                            <div className="size-7 bg-slate-100 rounded-lg ml-auto" />
                          </td>
                        </tr>
                      ))}
                    </>
                  )}

                  {!loading && paginatedList.length === 0 && (
                    <tr>
                      <td colSpan={10} className="py-12 text-center">
                        <div className="size-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
                          <Users className="size-6" />
                        </div>
                        <p className="font-bold text-slate-800 text-sm">No creators found</p>
                        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                          {search
                            ? `No creators matching "${search}". Try another query.`
                            : 'No creators registered under this status category.'}
                        </p>
                        {search && (
                          <Button
                            variant="outline"
                            onClick={() => setSearch('')}
                            className="mt-3 text-xs rounded-xl"
                          >
                            Clear search
                          </Button>
                        )}
                      </td>
                    </tr>
                  )}

                  {!loading &&
                    paginatedList.map((influencer) => {
                      const isSelected = selectedIds.has(influencer.id);
                      const isApproved =
                        influencer.status === 'ACTIVE' || influencer.status === 'APPROVED';
                      const isPending = influencer.status === 'PENDING';
                      const isSuspended = influencer.status === 'SUSPENDED';

                      return (
                        <tr
                          key={influencer.id}
                          className={cn(
                            'transition-colors hover:bg-slate-50/80',
                            isSelected && 'bg-emerald-50/40'
                          )}
                        >
                          {/* Checkbox */}
                          <td className="px-4 py-3.5 text-center">
                            <Checkbox
                              aria-label={`Select ${influencer.name}`}
                              checked={isSelected}
                              onCheckedChange={(checked) =>
                                handleToggleSelectRow(influencer.id, Boolean(checked))
                              }
                              className="border-slate-300"
                            />
                          </td>

                          {/* Creator Avatar & Name */}
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="size-10 rounded-xl bg-emerald-50 border border-emerald-100 shrink-0 overflow-hidden flex items-center justify-center">
                                {influencer.profileImage || influencer.avatarUrl ? (
                                  <img
                                    src={influencer.profileImage || influencer.avatarUrl || ''}
                                    alt={influencer.name}
                                    className="size-full object-cover"
                                  />
                                ) : (
                                  <span className="font-bold text-[#163A2E] text-xs">
                                    {influencer.name.slice(0, 2).toUpperCase()}
                                  </span>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setDrawerState({ id: influencer.id, mode: 'view' })
                                  }
                                  className="font-bold text-sm text-slate-900 hover:text-emerald-700 transition-colors truncate block text-left cursor-pointer"
                                  title={`View details for ${influencer.name}`}
                                >
                                  {influencer.name}
                                </button>
                                <span className="text-xs text-slate-400 block truncate">
                                  {influencer.city || influencer.location || 'India'}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Handle */}
                          {visibleColumns.handle && (
                            <td className="px-4 py-3.5 text-xs font-semibold text-emerald-800">
                              {influencer.handle ? (
                                <span className="truncate block max-w-[120px]">
                                  @{influencer.handle.replace(/^@/, '')}
                                </span>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                          )}

                          {/* Category */}
                          {visibleColumns.category && (
                            <td className="px-4 py-3.5">
                              <Badge className="bg-slate-100 text-slate-700 text-[11px] font-semibold border border-slate-200/80 shadow-none px-2 py-0.5 rounded-md">
                                {influencer.categoryName || influencer.category?.name || 'General'}
                              </Badge>
                            </td>
                          )}

                          {/* Followers */}
                          {visibleColumns.followers && (
                            <td className="px-4 py-3.5 text-xs font-extrabold text-slate-900">
                              {influencer.followersCount ||
                                Number(influencer.followers || 0).toLocaleString()}
                            </td>
                          )}

                          {/* Engagement Rate */}
                          {visibleColumns.engagement && (
                            <td className="px-4 py-3.5 text-xs font-bold text-emerald-700">
                              {influencer.engagementRate || 0}%
                            </td>
                          )}

                          {/* Bookings Count */}
                          {visibleColumns.bookings && (
                            <td className="px-4 py-3.5 text-xs font-semibold text-slate-700">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-bold">
                                {influencer._count?.bookings ?? 0}
                              </span>
                            </td>
                          )}

                          {/* Status */}
                          {visibleColumns.status && (
                            <td className="px-4 py-3.5">
                              {isApproved ? (
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-[#E8F8EE] text-[#169F4D] text-[11px] font-semibold px-2.5 py-0.5">
                                  <span className="size-1.5 rounded-full bg-[#1FC45B]" />
                                  <span>Active</span>
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
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 text-rose-700 text-[11px] font-semibold px-2.5 py-0.5">
                                  <span className="size-1.5 rounded-full bg-rose-500" />
                                  <span>Rejected</span>
                                </span>
                              )}
                            </td>
                          )}

                          {/* Actions Menu */}
                          <td className="px-4 py-3.5 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors ml-auto cursor-pointer shadow-2xs"
                                aria-label="Open influencer actions menu"
                              >
                                <MoreHorizontal className="size-4" />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                className="w-48 bg-white border border-slate-200 shadow-xl rounded-xl p-1.5"
                              >
                                <DropdownMenuItem
                                  onClick={() =>
                                    setDrawerState({ id: influencer.id, mode: 'view' })
                                  }
                                  className="text-xs p-2 rounded-lg cursor-pointer text-slate-700 hover:bg-emerald-50 hover:text-[#173D30] flex items-center gap-2"
                                >
                                  <Eye className="size-3.5 text-slate-500" />
                                  <span>View Profile</span>
                                </DropdownMenuItem>

                                {canManage && (
                                  <>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        setDrawerState({ id: influencer.id, mode: 'edit' })
                                      }
                                      className="text-xs p-2 rounded-lg cursor-pointer text-slate-700 hover:bg-emerald-50 hover:text-[#173D30] flex items-center gap-2"
                                    >
                                      <Pencil className="size-3.5 text-blue-600" />
                                      <span>Edit Influencer</span>
                                    </DropdownMenuItem>

                                    {isPending && (
                                      <DropdownMenuItem
                                        onClick={() => handleApprove(influencer.id)}
                                        className="text-xs p-2 rounded-lg cursor-pointer text-emerald-700 hover:bg-emerald-50 flex items-center gap-2"
                                      >
                                        <ToggleRight className="size-3.5 text-emerald-600" />
                                        <span>Approve Influencer</span>
                                      </DropdownMenuItem>
                                    )}

                                    {isApproved && (
                                      <DropdownMenuItem
                                        onClick={() => handleSuspend(influencer.id)}
                                        className="text-xs p-2 rounded-lg cursor-pointer text-amber-700 hover:bg-amber-50 flex items-center gap-2"
                                      >
                                        <ToggleLeft className="size-3.5 text-amber-600" />
                                        <span>Suspend</span>
                                      </DropdownMenuItem>
                                    )}

                                    {isSuspended && (
                                      <DropdownMenuItem
                                        onClick={() => handleApprove(influencer.id)}
                                        className="text-xs p-2 rounded-lg cursor-pointer text-emerald-700 hover:bg-emerald-50 flex items-center gap-2"
                                      >
                                        <ToggleRight className="size-3.5 text-emerald-600" />
                                        <span>Reactivate</span>
                                      </DropdownMenuItem>
                                    )}

                                    <DropdownMenuSeparator className="bg-slate-100" />

                                    <DropdownMenuItem
                                      onClick={() => setDeleteTarget(influencer)}
                                      className="text-xs p-2 rounded-lg cursor-pointer text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                                    >
                                      <Trash2 className="size-3.5 text-rose-600" />
                                      <span>Delete</span>
                                    </DropdownMenuItem>
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

            {/* Pagination Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3.5 border-t border-slate-200/80 bg-slate-50/50 text-xs text-slate-600">
              <div className="flex items-center gap-2 text-slate-500">
                <span>
                  Showing{' '}
                  <strong className="text-slate-900 font-bold">
                    {filteredList.length === 0 ? 0 : (page - 1) * pageSize + 1}
                  </strong>{' '}
                  to{' '}
                  <strong className="text-slate-900 font-bold">
                    {Math.min(page * pageSize, filteredList.length)}
                  </strong>{' '}
                  of{' '}
                  <strong className="text-slate-900 font-bold">
                    {filteredList.length}
                  </strong>{' '}
                  creators
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

      {/* 5. Create / Edit / View Drawer */}
      {drawerState && (
        <InfluencerDrawer
          id={drawerState.id}
          mode={drawerState.mode}
          categories={categories}
          onClose={() => setDrawerState(null)}
          onSaved={() => {
            setDrawerState(null);
            setRefresh((v) => v + 1);
          }}
        />
      )}

      {/* 6. Delete Confirmation Dialog */}
      <DeleteDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        recordName={deleteTarget?.name}
        noun="creator"
        warningNote="This will permanently delete this creator profile and any unbooked packages."
        loading={mutating}
        onConfirm={handleConfirmDelete}
      />

      {/* 7. Rejection Reason Dialog */}
      <RejectionDialog
        open={Boolean(rejectTarget)}
        onOpenChange={(open) => !open && setRejectTarget(null)}
        title="Reject Influencer"
        description="Provide a note or reason for rejecting this creator's profile."
        targetName={rejectTarget?.name}
        actionLabel="Reject Profile"
        loading={mutating}
        onConfirm={handleConfirmReject}
      />
    </div>
  );
}
