'use client';

import * as React from 'react';
import {
  Building2,
  Users,
  CheckCircle2,
  MinusCircle,
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
  Archive,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  AlertCircle,
} from 'lucide-react';
import { PageTitleCard } from '@/components/common/PageTitleCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { DepartmentDrawer } from './DepartmentDrawer';
import {
  apiError,
  bulkDeleteDepartments,
  changeDepartmentStatus,
  deleteDepartment,
  exportDepartments,
  listDepartments,
  type Department,
} from './department-api';
import { PermanentDeleteDialog } from '@/components/common/PermanentDeleteDialog';
import { TruncatedText } from '@/components/common/TruncatedText';
import { cn } from '@/lib/utils';

// Cast components that have untyped JS props in shadcn
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

const MenuItem = DropdownMenuItem as unknown as React.ComponentType<{
  onClick?: () => void;
  className?: string;
  children: React.ReactNode;
}>;

const MenuCheckboxItem = DropdownMenuCheckboxItem as unknown as React.ComponentType<{
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
  children: React.ReactNode;
}>;

type FilterTab = 'all' | 'active' | 'inactive' | 'archived';
type SortField = 'name' | 'code' | 'employeesCount' | 'createdAt';
type SortOrder = 'asc' | 'desc';
type Confirmation = { record: Department; action: 'delete' | 'status' | 'archive' };

export function DepartmentsScreen() {
  const [mounted, setMounted] = React.useState(false);
  const [records, setRecords] = React.useState<Department[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [refresh, setRefresh] = React.useState(0);
  const [filter, setFilter] = React.useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [sortField, setSortField] = React.useState<SortField>('name');
  const [sortOrder, setSortOrder] = React.useState<SortOrder>('asc');
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);

  const authUser = useAuthStore((state) => state.user);
  const [sessionUser, setSessionUser] = React.useState<unknown>(null);
  const [drawer, setDrawer] = React.useState<{ id: number | null; mode: 'create' | 'edit' | 'view' } | null>(null);
  const [confirmation, setConfirmation] = React.useState<Confirmation | null>(null);
  const [selectedIds, setSelectedIds] = React.useState<Set<number>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = React.useState(false);
  const [mutating, setMutating] = React.useState(false);
  const mutationLock = React.useRef(false);
  const [actionError, setActionError] = React.useState('');

  const [visibleColumns, setVisibleColumns] = React.useState({
    description: true,
    code: true,
    employeesCount: true,
    isActive: true,
    createdAt: true,
  });

  React.useEffect(() => {
    setMounted(true);
    setSessionUser(readSession()?.user ?? null);
  }, [authUser]);

  const canManage = isUserAdmin(authUser) || isUserAdmin(sessionUser);

  // Fetch departments on refresh trigger
  React.useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    listDepartments(controller.signal)
      .then((data) => {
        setRecords(data);
      })
      .catch((err: unknown) => {
        if (!controller.signal.aborted) {
          setRecords([]);
          setError(apiError(err));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [refresh]);

  // Metric counts
  const counts = React.useMemo(() => {
    const all = records.length;
    const active = records.filter((d) => d.isActive).length;
    const inactive = records.filter((d) => !d.isActive).length;
    const archived = 0; // Backend supports Active & Inactive
    const employees = records.reduce((sum, d) => sum + (d.employeesCount || 0), 0);
    return { all, active, inactive, archived, employees };
  }, [records]);

  // Filtered & Searched records
  const filteredRecords = React.useMemo(() => {
    let list = records.filter((d) => {
      if (filter === 'active') return d.isActive;
      if (filter === 'inactive') return !d.isActive;
      if (filter === 'archived') return false;
      return true;
    });

    const query = searchQuery.trim().toLowerCase();
    if (query) {
      list = list.filter(
        (d) =>
          d.name.toLowerCase().includes(query) ||
          d.code.toLowerCase().includes(query) ||
          (d.description && d.description.toLowerCase().includes(query))
      );
    }

    return list.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortField === 'code') {
        comparison = a.code.localeCompare(b.code);
      } else if (sortField === 'employeesCount') {
        comparison = (a.employeesCount || 0) - (b.employeesCount || 0);
      } else if (sortField === 'createdAt') {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [records, filter, searchQuery, sortField, sortOrder]);

  // Reset page when filter or search changes
  React.useEffect(() => {
    setPage(1);
  }, [filter, searchQuery, pageSize]);

  // Paginated records
  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
  const paginatedRecords = React.useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, page, pageSize]);

  // Selection handlers
  const isAllPageSelected =
    paginatedRecords.length > 0 && paginatedRecords.every((d) => selectedIds.has(d.id));
  const isSomePageSelected =
    paginatedRecords.some((d) => selectedIds.has(d.id)) && !isAllPageSelected;

  const handleToggleSelectAll = (checked: boolean) => {
    const next = new Set(selectedIds);
    if (checked) {
      paginatedRecords.forEach((d) => next.add(d.id));
    } else {
      paginatedRecords.forEach((d) => next.delete(d.id));
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

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  // Sorting handler
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Actions
  const ask = React.useCallback((record: Department, action: Confirmation['action']) => {
    setActionError('');
    setConfirmation({ record, action });
  }, []);

  async function confirmAction() {
    if (!confirmation || confirmation.action === 'archive' || mutationLock.current || !canManage)
      return;
    mutationLock.current = true;
    setMutating(true);
    setActionError('');
    try {
      if (confirmation.action === 'delete') {
        const msg = await deleteDepartment(confirmation.record.id);
        toast.success(msg || 'Department deleted');
      } else {
        await changeDepartmentStatus(confirmation.record.id, !confirmation.record.isActive);
        toast.success(
          `Department ${confirmation.record.isActive ? 'deactivated' : 'activated'} successfully`
        );
      }
      setConfirmation(null);
      setRefresh((v) => v + 1);
    } catch (err) {
      setActionError(apiError(err));
    } finally {
      mutationLock.current = false;
      setMutating(false);
    }
  }

  async function confirmBulkDelete() {
    if (!selectedIds.size || mutationLock.current || !canManage) return;
    mutationLock.current = true;
    setMutating(true);
    setActionError('');
    try {
      const ids = Array.from(selectedIds);
      const res = await bulkDeleteDepartments(ids);
      toast.success(res.message || 'Department deletion completed.');
      if (res.blockedDetails?.length) {
        toast.error(res.blockedDetails.map((item) => `#${item.id}: ${item.reason}`).join('\n'));
      }
      setSelectedIds(new Set());
      setBulkDeleteOpen(false);
      setRefresh((v) => v + 1);
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      mutationLock.current = false;
      setMutating(false);
    }
  }

  const handleExport = () => {
    const dataToExport = filteredRecords.length > 0 ? filteredRecords : records;
    if (dataToExport.length === 0) {
      toast.error('No department records available to export.');
      return;
    }
    exportDepartments(dataToExport);
    toast.success(`Exported ${dataToExport.length} departments to CSV`);
  };

  const tabs: Array<{ key: FilterTab; label: string; count: number }> = [
    { key: 'all', label: 'All', count: counts.all },
    { key: 'active', label: 'Active', count: counts.active },
    { key: 'inactive', label: 'Inactive', count: counts.inactive },
    { key: 'archived', label: 'Archived', count: counts.archived },
  ];

  return (
    <div className="w-full min-w-0 space-y-5 sm:space-y-6 pb-20 overflow-x-hidden">
      {/* 1. Header / Page Banner */}
      <TitleCard
        category="MASTER MANAGEMENT"
        title="Departments"
        description="Manage departments, organize teams and configure organizational structure."
        icon={Building2}
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              type="button"
              variant="outline"
              disabled={loading || records.length === 0}
              onClick={handleExport}
              className="h-10 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs gap-2 transition-colors cursor-pointer"
            >
              <Download className="size-4 text-slate-500" />
              <span>Export CSV</span>
            </Button>
            {canManage && (
              <Button
                type="button"
                onClick={() => setDrawer({ id: null, mode: 'create' })}
                className="h-10 px-4 rounded-xl bg-[#20C466] hover:bg-[#1ab35c] text-white text-xs font-bold shadow-2xs gap-2 transition-colors cursor-pointer"
              >
                <Plus className="size-4" />
                <span>Add Department</span>
              </Button>
            )}
          </div>
        }
      />

      {/* 2. Statistics KPI Cards (4 columns on desktop, 2 on tablet, 1 on mobile) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Departments */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs flex items-center justify-between gap-3 min-w-0 transition-all hover:border-slate-300">
          <div className="space-y-1 min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block truncate">
              Total Departments
            </span>
            <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              {loading ? (
                <span className="inline-block h-7 w-14 animate-pulse rounded bg-slate-100" />
              ) : (
                Number(counts.all).toLocaleString()
              )}
            </p>
            <p className="text-[11px] text-slate-400 truncate">All registered departments</p>
          </div>
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-100 bg-[#E8F1EC] text-[#163A2E] shadow-2xs">
            <Building2 className="size-6 text-[#163A2E]" />
          </div>
        </div>

        {/* Card 2: Active Departments */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs flex items-center justify-between gap-3 min-w-0 transition-all hover:border-slate-300">
          <div className="space-y-1 min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block truncate">
              Active Departments
            </span>
            <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-emerald-700">
              {loading ? (
                <span className="inline-block h-7 w-14 animate-pulse rounded bg-slate-100" />
              ) : (
                Number(counts.active).toLocaleString()
              )}
            </p>
            <p className="text-[11px] text-slate-400 truncate">Currently operational</p>
          </div>
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-200/80 bg-emerald-50 text-emerald-700 shadow-2xs">
            <CheckCircle2 className="size-6 text-emerald-700" />
          </div>
        </div>

        {/* Card 3: Inactive Departments */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs flex items-center justify-between gap-3 min-w-0 transition-all hover:border-slate-300">
          <div className="space-y-1 min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block truncate">
              Inactive Departments
            </span>
            <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-600">
              {loading ? (
                <span className="inline-block h-7 w-14 animate-pulse rounded bg-slate-100" />
              ) : (
                Number(counts.inactive).toLocaleString()
              )}
            </p>
            <p className="text-[11px] text-slate-400 truncate">Disabled or suspended</p>
          </div>
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-slate-200/80 bg-slate-50 text-slate-600 shadow-2xs">
            <MinusCircle className="size-6 text-slate-500" />
          </div>
        </div>

        {/* Card 4: Total Assigned Employees */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs flex items-center justify-between gap-3 min-w-0 transition-all hover:border-slate-300">
          <div className="space-y-1 min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block truncate">
              Total Assigned Employees
            </span>
            <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#163A2E]">
              {loading ? (
                <span className="inline-block h-7 w-14 animate-pulse rounded bg-slate-100" />
              ) : (
                Number(counts.employees).toLocaleString()
              )}
            </p>
            <p className="text-[11px] text-slate-400 truncate">Assigned across departments</p>
          </div>
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-100 bg-[#EAF7EF] text-[#173D30] shadow-2xs">
            <Users className="size-6 text-[#173D30]" />
          </div>
        </div>
      </div>

      {/* 3. Status Filters, Search, Columns & Refresh Toolbar */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 sm:p-4 shadow-xs space-y-3.5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100/90 overflow-x-auto no-scrollbar max-w-full">
            {tabs.map((tab) => {
              const active = filter === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setFilter(tab.key)}
                  className={cn(
                    'flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer',
                    active
                      ? 'bg-white text-[#163A2E] shadow-xs'
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

          {/* Right Controls: Search, Columns & Refresh */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64 sm:flex-initial min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
              <Input
                type="text"
                placeholder="Search departments or codes..."
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                className="h-9.5 pl-9 pr-8 text-xs bg-slate-50 border-slate-200 focus-visible:bg-white focus-visible:ring-brand rounded-xl w-full"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 hover:text-slate-600 cursor-pointer"
                  title="Clear search"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {/* Columns Visibility Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger
                className="h-9.5 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-2 transition-colors cursor-pointer shadow-2xs"
                title="Toggle visible table columns"
              >
                <SlidersHorizontal className="size-3.5 text-slate-500" />
                <span className="hidden sm:inline">Columns</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 bg-white border border-slate-200 shadow-xl rounded-xl p-1.5">
                <div className="px-2 py-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Toggle Columns
                </div>
                <DropdownMenuSeparator className="bg-slate-100" />
                <MenuCheckboxItem
                  checked={visibleColumns.description}
                  onCheckedChange={(checked: boolean) =>
                    setVisibleColumns((prev) => ({ ...prev, description: Boolean(checked) }))
                  }
                  className="text-xs p-2 rounded-lg cursor-pointer text-slate-700"
                >
                  Description
                </MenuCheckboxItem>
                <MenuCheckboxItem
                  checked={visibleColumns.code}
                  onCheckedChange={(checked: boolean) =>
                    setVisibleColumns((prev) => ({ ...prev, code: Boolean(checked) }))
                  }
                  className="text-xs p-2 rounded-lg cursor-pointer text-slate-700"
                >
                  Department Code
                </MenuCheckboxItem>
                <MenuCheckboxItem
                  checked={visibleColumns.employeesCount}
                  onCheckedChange={(checked: boolean) =>
                    setVisibleColumns((prev) => ({ ...prev, employeesCount: Boolean(checked) }))
                  }
                  className="text-xs p-2 rounded-lg cursor-pointer text-slate-700"
                >
                  Employees Count
                </MenuCheckboxItem>
                <MenuCheckboxItem
                  checked={visibleColumns.isActive}
                  onCheckedChange={(checked: boolean) =>
                    setVisibleColumns((prev) => ({ ...prev, isActive: Boolean(checked) }))
                  }
                  className="text-xs p-2 rounded-lg cursor-pointer text-slate-700"
                >
                  Status
                </MenuCheckboxItem>
                <MenuCheckboxItem
                  checked={visibleColumns.createdAt}
                  onCheckedChange={(checked: boolean) =>
                    setVisibleColumns((prev) => ({ ...prev, createdAt: Boolean(checked) }))
                  }
                  className="text-xs p-2 rounded-lg cursor-pointer text-slate-700"
                >
                  Created Date
                </MenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Refresh Button */}
            <Button
              type="button"
              variant="outline"
              disabled={loading || mutating}
              onClick={() => setRefresh((v) => v + 1)}
              className="h-9.5 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-2 transition-colors cursor-pointer shadow-2xs"
              title="Refresh department list"
            >
              <RotateCw className={cn('size-3.5 text-slate-500', loading && 'animate-spin')} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>

        {/* Bulk Action Bar (if selected) */}
        {selectedIds.size > 0 && canManage && (
          <div className="flex items-center justify-between rounded-xl bg-emerald-50/80 border border-emerald-200/90 p-2.5 px-3.5 animate-in fade-in slide-in-from-top-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#163A2E]">
              <span className="size-2 rounded-full bg-[#20C466]" />
              <span>
                {selectedIds.size} {selectedIds.size === 1 ? 'department' : 'departments'} selected
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={handleClearSelection}
                className="h-7 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Clear
              </Button>
              <Button
                type="button"
                onClick={() => setBulkDeleteOpen(true)}
                disabled={mutating}
                className="h-7.5 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold gap-1.5 shadow-2xs cursor-pointer"
              >
                <Trash2 className="size-3.5" />
                <span>Delete Selected</span>
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Departments Table Card */}
      <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
        {error ? (
          <div role="alert" className="p-8 text-center space-y-3">
            <div className="size-12 rounded-full bg-rose-50 text-rose-600 mx-auto flex items-center justify-center border border-rose-100">
              <AlertCircle className="size-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Unable to load departments</h3>
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
            {/* Table Container with Horizontal Scroll */}
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    {/* Checkbox Column */}
                    <th scope="col" className="w-12 px-4 py-3.5 text-center">
                      <Checkbox
                        aria-label="Select all departments on this page"
                        checked={isAllPageSelected}
                        indeterminate={isSomePageSelected}
                        onCheckedChange={(checked: boolean) => handleToggleSelectAll(Boolean(checked))}
                        className="border-slate-300"
                      />
                    </th>

                    {/* Department Name */}
                    <th scope="col" className="px-4 py-3.5 min-w-[200px]">
                      <button
                        type="button"
                        onClick={() => handleSort('name')}
                        className="group flex items-center gap-1.5 text-slate-600 hover:text-slate-900 transition-colors uppercase cursor-pointer"
                      >
                        <span>Department Name</span>
                        {sortField === 'name' ? (
                          sortOrder === 'asc' ? (
                            <ArrowUp className="size-3.5 text-[#163A2E]" />
                          ) : (
                            <ArrowDown className="size-3.5 text-[#163A2E]" />
                          )
                        ) : (
                          <ArrowUpDown className="size-3 text-slate-400 group-hover:text-slate-600" />
                        )}
                      </button>
                    </th>

                    {/* Description */}
                    {visibleColumns.description && (
                      <th scope="col" className="px-4 py-3.5 min-w-[200px] max-w-[320px]">
                        Description
                      </th>
                    )}

                    {/* Department Code */}
                    {visibleColumns.code && (
                      <th scope="col" className="px-4 py-3.5 min-w-[140px]">
                        <button
                          type="button"
                          onClick={() => handleSort('code')}
                          className="group flex items-center gap-1.5 text-slate-600 hover:text-slate-900 transition-colors uppercase cursor-pointer"
                        >
                          <span>Department Code</span>
                          {sortField === 'code' ? (
                            sortOrder === 'asc' ? (
                              <ArrowUp className="size-3.5 text-[#163A2E]" />
                            ) : (
                              <ArrowDown className="size-3.5 text-[#163A2E]" />
                            )
                          ) : (
                            <ArrowUpDown className="size-3 text-slate-400 group-hover:text-slate-600" />
                          )}
                        </button>
                      </th>
                    )}

                    {/* Employees */}
                    {visibleColumns.employeesCount && (
                      <th scope="col" className="px-4 py-3.5 min-w-[120px]">
                        <button
                          type="button"
                          onClick={() => handleSort('employeesCount')}
                          className="group flex items-center gap-1.5 text-slate-600 hover:text-slate-900 transition-colors uppercase cursor-pointer"
                        >
                          <span>Employees</span>
                          {sortField === 'employeesCount' ? (
                            sortOrder === 'asc' ? (
                              <ArrowUp className="size-3.5 text-[#163A2E]" />
                            ) : (
                              <ArrowDown className="size-3.5 text-[#163A2E]" />
                            )
                          ) : (
                            <ArrowUpDown className="size-3 text-slate-400 group-hover:text-slate-600" />
                          )}
                        </button>
                      </th>
                    )}

                    {/* Status */}
                    {visibleColumns.isActive && (
                      <th scope="col" className="px-4 py-3.5 min-w-[110px]">
                        Status
                      </th>
                    )}

                    {/* Created Date */}
                    {visibleColumns.createdAt && (
                      <th scope="col" className="px-4 py-3.5 min-w-[130px]">
                        <button
                          type="button"
                          onClick={() => handleSort('createdAt')}
                          className="group flex items-center gap-1.5 text-slate-600 hover:text-slate-900 transition-colors uppercase cursor-pointer"
                        >
                          <span>Created Date</span>
                          {sortField === 'createdAt' ? (
                            sortOrder === 'asc' ? (
                              <ArrowUp className="size-3.5 text-[#163A2E]" />
                            ) : (
                              <ArrowDown className="size-3.5 text-[#163A2E]" />
                            )
                          ) : (
                            <ArrowUpDown className="size-3 text-slate-400 group-hover:text-slate-600" />
                          )}
                        </button>
                      </th>
                    )}

                    {/* Actions */}
                    <th scope="col" className="w-16 px-4 py-3.5 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {/* Loading State */}
                  {loading && (
                    <>
                      {[1, 2, 3, 4, 5].map((idx) => (
                        <tr key={idx} className="animate-pulse">
                          <td className="px-4 py-3.5 text-center">
                            <div className="size-4 bg-slate-200 rounded mx-auto" />
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="size-9 rounded-xl bg-slate-200 shrink-0" />
                              <div className="space-y-1.5 flex-1 min-w-0">
                                <div className="h-3.5 bg-slate-200 rounded w-36" />
                              </div>
                            </div>
                          </td>
                          {visibleColumns.description && (
                            <td className="px-4 py-3.5">
                              <div className="h-3.5 bg-slate-100 rounded w-44" />
                            </td>
                          )}
                          {visibleColumns.code && (
                            <td className="px-4 py-3.5">
                              <div className="h-5 bg-slate-100 rounded w-16" />
                            </td>
                          )}
                          {visibleColumns.employeesCount && (
                            <td className="px-4 py-3.5">
                              <div className="h-5 bg-slate-100 rounded w-12" />
                            </td>
                          )}
                          {visibleColumns.isActive && (
                            <td className="px-4 py-3.5">
                              <div className="h-5 bg-slate-100 rounded-full w-20" />
                            </td>
                          )}
                          {visibleColumns.createdAt && (
                            <td className="px-4 py-3.5">
                              <div className="h-3 bg-slate-100 rounded w-20" />
                            </td>
                          )}
                          <td className="px-4 py-3.5 text-right">
                            <div className="size-7 bg-slate-100 rounded-lg ml-auto" />
                          </td>
                        </tr>
                      ))}
                    </>
                  )}

                  {/* Empty State */}
                  {!loading && paginatedRecords.length === 0 && (
                    <tr>
                      <td
                        colSpan={
                          3 +
                          (visibleColumns.description ? 1 : 0) +
                          (visibleColumns.code ? 1 : 0) +
                          (visibleColumns.employeesCount ? 1 : 0) +
                          (visibleColumns.isActive ? 1 : 0) +
                          (visibleColumns.createdAt ? 1 : 0)
                        }
                        className="py-12 text-center"
                      >
                        <div className="size-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
                          <Building2 className="size-6" />
                        </div>
                        <p className="font-bold text-slate-800 text-sm">No departments found</p>
                        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                          {searchQuery
                            ? `No departments matching "${searchQuery}". Try a different keyword.`
                            : filter === 'archived'
                            ? 'No archived departments in the database.'
                            : 'No department records registered in this category.'}
                        </p>
                        {searchQuery && (
                          <Button
                            variant="outline"
                            onClick={() => setSearchQuery('')}
                            className="mt-3 text-xs rounded-xl"
                          >
                            Clear search filter
                          </Button>
                        )}
                      </td>
                    </tr>
                  )}

                  {/* Rows */}
                  {!loading &&
                    paginatedRecords.map((department) => {
                      const isSelected = selectedIds.has(department.id);
                      return (
                        <tr
                          key={department.id}
                          className={cn(
                            'transition-colors hover:bg-slate-50/80',
                            isSelected && 'bg-emerald-50/40'
                          )}
                        >
                          {/* Checkbox */}
                          <td className="px-4 py-3.5 text-center">
                            <Checkbox
                              aria-label={`Select ${department.name}`}
                              checked={isSelected}
                              onCheckedChange={(checked: boolean) =>
                                handleToggleSelectRow(department.id, Boolean(checked))
                              }
                              className="border-slate-300"
                            />
                          </td>

                          {/* Department Name */}
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2.5 min-w-0 max-w-[220px]">
                              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-emerald-100 bg-[#E8F8EE] text-[#163A2E] shadow-2xs">
                                <Building2 className="size-4 text-[#163A2E]" />
                              </div>
                              <button
                                type="button"
                                onClick={() => setDrawer({ id: department.id, mode: 'view' })}
                                className="font-semibold text-xs text-slate-900 hover:text-emerald-700 transition-colors truncate block text-left cursor-pointer"
                                title={`View details for ${department.name}`}
                              >
                                {department.name}
                              </button>
                            </div>
                          </td>

                          {/* Description */}
                          {visibleColumns.description && (
                            <td className="px-4 py-3.5 min-w-[200px] max-w-[320px]">
                              <TruncatedText
                                value={department.description}
                                maxWidth="max-w-[300px]"
                                className="text-xs text-slate-500"
                                label="Department Description"
                              />
                            </td>
                          )}

                          {/* Department Code */}
                          {visibleColumns.code && (
                            <td className="px-4 py-3.5">
                              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200/80 shadow-2xs">
                                {department.code || '—'}
                              </span>
                            </td>
                          )}

                          {/* Employees Count */}
                          {visibleColumns.employeesCount && (
                            <td className="px-4 py-3.5">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200/80">
                                <Users className="size-3 text-slate-500" />
                                {Number(department.employeesCount || 0).toLocaleString()}
                              </span>
                            </td>
                          )}

                          {/* Status */}
                          {visibleColumns.isActive && (
                            <td className="px-4 py-3.5">
                              {department.isActive ? (
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-[#E8F8EE] text-[#169F4D] text-[11px] font-semibold px-2.5 py-0.5">
                                  <span className="size-1.5 rounded-full bg-[#1FC45B]" />
                                  <span>Active</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 text-slate-600 text-[11px] font-semibold px-2.5 py-0.5">
                                  <span className="size-1.5 rounded-full bg-slate-400" />
                                  <span>Inactive</span>
                                </span>
                              )}
                            </td>
                          )}

                          {/* Created Date */}
                          {visibleColumns.createdAt && (
                            <td className="px-4 py-3.5 text-xs text-slate-600 whitespace-nowrap">
                              {department.createdAt
                                ? new Date(department.createdAt).toLocaleDateString(undefined, {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                  })
                                : '—'}
                            </td>
                          )}

                          {/* Row Actions Menu */}
                          <td className="px-4 py-3.5 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors ml-auto cursor-pointer shadow-2xs"
                                aria-label="Open department action menu"
                              >
                                <MoreHorizontal className="size-4" />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                className="w-48 bg-white border border-slate-200 shadow-xl rounded-xl p-1.5"
                              >
                                <MenuItem
                                  onClick={() => setDrawer({ id: department.id, mode: 'view' })}
                                  className="text-xs p-2 rounded-lg cursor-pointer text-slate-700 hover:bg-emerald-50 hover:text-[#173D30] flex items-center gap-2"
                                >
                                  <Eye className="size-3.5 text-slate-500" />
                                  <span>View Details</span>
                                </MenuItem>

                                {canManage && (
                                  <>
                                    <MenuItem
                                      onClick={() =>
                                        setDrawer({ id: department.id, mode: 'edit' })
                                      }
                                      className="text-xs p-2 rounded-lg cursor-pointer text-slate-700 hover:bg-emerald-50 hover:text-[#173D30] flex items-center gap-2"
                                    >
                                      <Pencil className="size-3.5 text-blue-600" />
                                      <span>Edit Department</span>
                                    </MenuItem>

                                    <MenuItem
                                      onClick={() => ask(department, 'status')}
                                      className="text-xs p-2 rounded-lg cursor-pointer text-slate-700 hover:bg-emerald-50 hover:text-[#173D30] flex items-center gap-2"
                                    >
                                      {department.isActive ? (
                                        <>
                                          <ToggleLeft className="size-3.5 text-amber-600" />
                                          <span>Deactivate</span>
                                        </>
                                      ) : (
                                        <>
                                          <ToggleRight className="size-3.5 text-emerald-600" />
                                          <span>Activate</span>
                                        </>
                                      )}
                                    </MenuItem>

                                    <MenuItem
                                      onClick={() => ask(department, 'archive')}
                                      className="text-xs p-2 rounded-lg cursor-pointer text-slate-700 hover:bg-emerald-50 hover:text-[#173D30] flex items-center gap-2"
                                    >
                                      <Archive className="size-3.5 text-purple-600" />
                                      <span>Archive Department</span>
                                    </MenuItem>

                                    <DropdownMenuSeparator className="bg-slate-100" />

                                    <MenuItem
                                      onClick={() => ask(department, 'delete')}
                                      className="text-xs p-2 rounded-lg cursor-pointer text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                                    >
                                      <Trash2 className="size-3.5 text-rose-600" />
                                      <span>Delete Department</span>
                                    </MenuItem>
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

            {/* Pagination & Rows Per Page Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3.5 border-t border-slate-200/80 bg-slate-50/50 text-xs text-slate-600">
              {/* Left: Showing range */}
              <div className="flex items-center gap-2 text-slate-500">
                <span>
                  Showing{' '}
                  <strong className="text-slate-900 font-bold">
                    {filteredRecords.length === 0 ? 0 : (page - 1) * pageSize + 1}
                  </strong>{' '}
                  to{' '}
                  <strong className="text-slate-900 font-bold">
                    {Math.min(page * pageSize, filteredRecords.length)}
                  </strong>{' '}
                  of{' '}
                  <strong className="text-slate-900 font-bold">
                    {filteredRecords.length}
                  </strong>{' '}
                  departments
                </span>
              </div>

              {/* Right: Page Size & Navigation Buttons */}
              <div className="flex items-center gap-3">
                {/* Rows per page selector */}
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 hidden sm:inline">Rows:</span>
                  <Select
                    value={String(pageSize)}
                    onValueChange={(val: string | null) => {
                      if (val) setPageSize(Number(val));
                    }}
                  >
                    <SelectTrigger className="h-8 w-16 bg-white text-xs border-slate-200 rounded-lg">
                      <SelectValue className="text-xs" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="5" className="text-xs">5</SelectItem>
                      <SelectItem value="10" className="text-xs">10</SelectItem>
                      <SelectItem value="25" className="text-xs">25</SelectItem>
                      <SelectItem value="50" className="text-xs">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Page info & Prev/Next buttons */}
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

      {/* 5. Create / Edit / View Drawer Modal */}
      {drawer && (
        <DepartmentDrawer
          key={`${drawer.mode}-${drawer.id}`}
          {...drawer}
          onClose={() => setDrawer(null)}
          onSaved={() => {
            setDrawer(null);
            setRefresh((v) => v + 1);
          }}
        />
      )}

      {/* 6. Single Department Permanent Delete Dialog */}
      <DeleteDialog
        open={Boolean(confirmation && confirmation.action === 'delete')}
        onOpenChange={(open: boolean) => {
          if (!open && !mutationLock.current) setConfirmation(null);
        }}
        recordName={confirmation?.record?.name}
        noun="department"
        warningNote="If employees are assigned, the department will be set to Inactive instead. Otherwise it will be permanently deleted and linked designations will be unassigned."
        loading={mutating}
        onConfirm={confirmAction}
      />

      {/* 7. Bulk Delete Dialog */}
      <DeleteDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        count={selectedIds.size}
        noun="department"
        warningNote="Departments with active employees will be set to Inactive to preserve organizational history."
        loading={mutating}
        onConfirm={confirmBulkDelete}
      />

      {/* 8. Status Change & Archive Dialog */}
      <Dialog
        open={Boolean(confirmation && confirmation.action !== 'delete')}
        onOpenChange={(open: boolean) => {
          if (!open && !mutationLock.current) setConfirmation(null);
        }}
      >
        <DialogContent className="sm:max-w-md bg-white border-slate-200 rounded-2xl" showCloseButton={!mutating}>
          <DialogHeader className="pr-5">
            <DialogTitle className="text-lg font-bold text-slate-900">
              {confirmation?.action === 'archive'
                ? 'Archive department?'
                : 'Change department status?'}
            </DialogTitle>
            <DialogDescription className="leading-relaxed text-sm text-slate-500 mt-1">
              {confirmation?.action === 'archive'
                ? `“${confirmation.record.name}” cannot be archived. The department API only supports Active and Inactive.`
                : `Set “${confirmation?.record.name}” to ${
                    confirmation?.record.isActive ? 'Inactive' : 'Active'
                  }?`}
            </DialogDescription>
          </DialogHeader>
          {actionError && (
            <p role="alert" className="text-sm font-semibold text-rose-600">
              {actionError}
            </p>
          )}
          <DialogFooter className="gap-2 sm:gap-0 mt-2">
            <Button
              type="button"
              variant="outline"
              disabled={mutating}
              onClick={() => setConfirmation(null)}
              className="rounded-xl border-slate-200 text-xs font-semibold"
            >
              {confirmation?.action === 'archive' ? 'Close' : 'Cancel'}
            </Button>
            {confirmation?.action !== 'archive' && (
              <Button
                type="button"
                className="bg-[#20C466] text-white hover:bg-[#1ab35c] rounded-xl text-xs font-bold"
                disabled={mutating}
                onClick={confirmAction}
              >
                {mutating ? 'Saving…' : 'Confirm'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
