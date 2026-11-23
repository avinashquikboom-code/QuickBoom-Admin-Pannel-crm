'use client';

import * as React from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FormDrawer } from '@/components/common/drawers/FormDrawer';
import { PermanentDeleteDialog } from '@/components/common/PermanentDeleteDialog';
import {
  AdminBulkSelectionToolbar,
  AdminBulkDeleteButton,
} from '@/components/admin/bulk-selection';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import {
  faClock,
  faPlus,
  faRotateRight,
  faDownload,
  faSearch,
  faXmark,
  faEye,
  faPenToSquare,
  faTrashCan,
  faCircleCheck,
  faUsers,
  faChevronLeft,
  faChevronRight,
  faCalendarDays,
  faCheck,
  faSliders,
} from '@fortawesome/free-solid-svg-icons';
import { toast } from '@/hooks/use-toast';
import {
  loadLeaveTypes,
  saveLeaveType,
  removeLeaveType,
  bulkDeleteLeaveTypes,
  downloadCsv,
  masterError,
} from './master-api';
import { TruncatedText } from '@/components/common/TruncatedText';

function useDebounced(value, delay) {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

const emptyForm = {
  name: '',
  code: '',
  daysAllowedPerYear: 12,
  isPaid: true,
  isCarryForward: false,
  maxCarryForwardDays: 0,
  applicableGender: 'ALL',
  description: '',
  isActive: true,
};

export function LeaveTypesScreen({ config }) {
  const [records, setRecords] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [refresh, setRefresh] = React.useState(0);
  const [query, setQuery] = React.useState('');
  const [statusTab, setStatusTab] = React.useState('all');
  const [sortField, setSortField] = React.useState('name');
  const [sortOrder, setSortOrder] = React.useState('asc');

  // Pagination
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);

  // Selection
  const [selectedRows, setSelectedRows] = React.useState([]);

  // Drawers & Modals
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [editing, setEditing] = React.useState(null);
  const [viewing, setViewing] = React.useState(null);
  const [form, setForm] = React.useState(emptyForm);
  const [saving, setSaving] = React.useState(false);
  const [pendingDelete, setPendingDelete] = React.useState(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = React.useState(false);
  const [textModal, setTextModal] = React.useState(null);

  const debouncedQuery = useDebounced(query, 250);

  // Load records
  React.useEffect(() => {
    let active = true;
    setLoading(true);
    loadLeaveTypes()
      .then((rows) => {
        if (!active) return;
        setRecords(rows || []);
      })
      .catch((err) => {
        if (!active) return;
        toast.error(masterError(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [refresh]);

  // Statistics
  const totalCount = records.length;
  const activeCount = records.filter((r) => r.status === 'Active' || r.isActive !== false).length;
  const inactiveCount = records.filter((r) => r.status === 'Inactive' || r.isActive === false).length;
  const totalStaff = records.reduce((sum, r) => sum + (Number(r.members) || 0), 0);

  // Filtered
  const filtered = React.useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    return records.filter((row) => {
      if (statusTab === 'active' && row.status !== 'Active') return false;
      if (statusTab === 'inactive' && row.status !== 'Inactive') return false;
      if (statusTab === 'archived') return false;
      if (!q) return true;
      const haystack = [row.name, row.code, row.description, row.head].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(q);
    });
  }, [records, statusTab, debouncedQuery]);

  // Sorted
  const sorted = React.useMemo(() => {
    return [...filtered].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filtered, sortField, sortOrder]);

  // Paginated
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedRows = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, currentPage, pageSize]);

  // Toggle Sorting
  const toggleSort = (field) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Selection
  const isAllSelected = paginatedRows.length > 0 && paginatedRows.every((r) => selectedRows.some((s) => s.id === r.id));
  const isSomeSelected = selectedRows.length > 0 && !isAllSelected;

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const merged = [...selectedRows];
      paginatedRows.forEach((row) => {
        if (!merged.some((r) => r.id === row.id)) merged.push(row);
      });
      setSelectedRows(merged);
    } else {
      setSelectedRows(selectedRows.filter((r) => !paginatedRows.some((row) => row.id === r.id)));
    }
  };

  const handleSelectRow = (row) => {
    if (selectedRows.some((r) => r.id === row.id)) {
      setSelectedRows(selectedRows.filter((r) => r.id !== row.id));
    } else {
      setSelectedRows([...selectedRows, row]);
    }
  };

  // Create & Edit Handlers
  const handleOpenCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDrawerOpen(true);
  };

  const handleOpenEdit = (row) => {
    setEditing(row);
    setForm({
      name: row.name || '',
      code: row.code || '',
      daysAllowedPerYear: row.daysAllowedPerYear ?? (Number(String(row.head || '').match(/\d+/)?.[0]) || 12),
      isPaid: row.isPaid !== false,
      isCarryForward: Boolean(row.isCarryForward),
      maxCarryForwardDays: row.maxCarryForwardDays || 0,
      applicableGender: row.applicableGender || 'ALL',
      description: row.description || '',
      isActive: row.status === 'Active' || row.isActive !== false,
    });
    setDrawerOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (saving) return;
    if (!form.name.trim() || !form.code.trim()) {
      toast.error('Name and code are required');
      return;
    }
    setSaving(true);
    try {
      await saveLeaveType(form, editing);
      toast.success(editing ? 'Leave type updated successfully' : 'Leave type created successfully');
      setDrawerOpen(false);
      setRefresh((v) => v + 1);
    } catch (err) {
      toast.error(masterError(err));
    } finally {
      setSaving(false);
    }
  };

  // Delete Handlers
  const handleConfirmDelete = async () => {
    if (!pendingDelete || saving) return;
    setSaving(true);
    try {
      await removeLeaveType(pendingDelete.id);
      toast.success('Leave type deleted successfully');
      setPendingDelete(null);
      setSelectedRows((prev) => prev.filter((r) => r.id !== pendingDelete.id));
      setRefresh((v) => v + 1);
    } catch (err) {
      toast.error(masterError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedRows.length || saving) return;
    setSaving(true);
    try {
      const ids = selectedRows.map((r) => r.id);
      const res = await bulkDeleteLeaveTypes(ids);
      const count = res?.data?.deletedCount ?? res?.deletedCount ?? ids.length;
      toast.success(`${count} leave type${count > 1 ? 's' : ''} deleted`);
      setSelectedRows([]);
      setBulkDeleteOpen(false);
      setRefresh((v) => v + 1);
    } catch (err) {
      toast.error(masterError(err));
    } finally {
      setSaving(false);
    }
  };

  // Export CSV
  const handleExport = () => {
    if (!filtered.length) {
      toast.error('No leave types to export');
      return;
    }
    downloadCsv(
      'leave-types.csv',
      filtered.map((r) => ({
        name: r.name,
        code: r.code,
        annualAllowance: r.head || `${r.daysAllowedPerYear} Days / Year`,
        eligibleStaff: r.members || 0,
        paidLeave: r.isPaid !== false ? 'Yes' : 'No',
        carryForward: r.isCarryForward ? 'Yes' : 'No',
        maxCarryForwardDays: r.maxCarryForwardDays || 0,
        applicableGender: r.applicableGender || 'ALL',
        status: r.status,
        description: r.description || '',
      }))
    );
    toast.success(`Exported ${filtered.length} leave types to CSV`);
  };

  return (
    <div className="w-full min-w-0 max-w-none space-y-4 sm:space-y-5 overflow-x-hidden">
      {/* ── 1. Page Header ─────────────────────────────────────────────────── */}
      <PageHeader
        category="MASTER MANAGEMENT"
        title="Leave Types"
        description="Configure casual, sick, annual, maternity, and bereavement leave classifications."
        icon={faClock}
        actions={
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              onClick={() => setRefresh((v) => v + 1)}
              disabled={loading}
              className="h-8.5 rounded-xl border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50"
            >
              <FontAwesomeIcon icon={faRotateRight} className={`size-3.5 mr-1.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleExport}
              className="h-8.5 rounded-xl border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50"
            >
              <FontAwesomeIcon icon={faDownload} className="size-3.5 mr-1.5 text-slate-500" />
              <span>Export CSV</span>
            </Button>
            <Button
              type="button"
              onClick={handleOpenCreate}
              className="h-8.5 rounded-xl bg-[#107569] px-3.5 text-xs font-semibold text-white shadow-xs hover:bg-[#0e6359]"
            >
              <FontAwesomeIcon icon={faPlus} className="size-3.5 mr-1.5" />
              <span>Add Leave Type</span>
            </Button>
          </div>
        }
      />

      {/* ── 2. Statistics Cards (4 Compact SaaS Cards matching reference) ─── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Leave Types */}
        <div className="flex items-center justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs transition hover:border-emerald-300">
          <div className="space-y-1 min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate">
              Total Leave Types
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111827]">
                {loading ? '…' : totalCount}
              </span>
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200/60">
                +12%
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">All configured leave classes</p>
          </div>
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-[#107569] ring-1 ring-emerald-200/60">
            <FontAwesomeIcon icon={faClock} className="size-5" />
          </div>
        </div>

        {/* Active Leave Types */}
        <div className="flex items-center justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs transition hover:border-emerald-300">
          <div className="space-y-1 min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate">
              Active Leave Types
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-emerald-700">
                {loading ? '…' : activeCount}
              </span>
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200/60">
                +8%
              </span>
            </div>
            <p className="text-[11px] text-emerald-600 font-medium truncate">Currently operational</p>
          </div>
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60">
            <FontAwesomeIcon icon={faCircleCheck} className="size-5" />
          </div>
        </div>

        {/* Inactive / Pending */}
        <div className="flex items-center justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs transition hover:border-emerald-300">
          <div className="space-y-1 min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate">
              Inactive / Pending
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-600">
                {loading ? '…' : inactiveCount}
              </span>
              <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 border border-slate-200">
                0%
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">Suspended or draft</p>
          </div>
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 ring-1 ring-slate-200">
            <FontAwesomeIcon icon={faClock} className="size-5 text-slate-500" />
          </div>
        </div>

        {/* Total Eligible Staff */}
        <div className="flex items-center justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs transition hover:border-emerald-300">
          <div className="space-y-1 min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate">
              Total Eligible Staff
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#163A2E]">
                {loading ? '…' : totalStaff}
              </span>
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200/60">
                +15%
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">Across active organizations</p>
          </div>
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-[#107569] ring-1 ring-emerald-200/60">
            <FontAwesomeIcon icon={faUsers} className="size-5" />
          </div>
        </div>
      </div>

      {/* ── 3. Filters & Search Toolbar ────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 sm:p-4 shadow-xs space-y-3.5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100/90 overflow-x-auto no-scrollbar max-w-full">
            {[
              { key: 'all', label: 'All', count: totalCount },
              { key: 'active', label: 'Active', count: activeCount },
              { key: 'inactive', label: 'Inactive', count: inactiveCount },
              { key: 'archived', label: 'Archived', count: 0 },
            ].map((tab) => {
              const active = statusTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    setStatusTab(tab.key);
                    setPage(1);
                  }}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    active
                      ? 'bg-white text-[#163A2E] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full transition-colors ${
                      active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200/80 text-slate-600'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative flex-1 sm:w-72 sm:flex-initial min-w-[220px]">
            <FontAwesomeIcon
              icon={faSearch}
              className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400 pointer-events-none"
            />
            <Input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search leave types by name, code..."
              className="h-9.5 pl-9 pr-8 text-xs bg-slate-50 border-slate-200 focus-visible:bg-white focus-visible:ring-[#107569] rounded-xl w-full"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setPage(1);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                title="Clear search"
              >
                <FontAwesomeIcon icon={faXmark} className="size-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedRows.length > 0 && (
          <div className="flex items-center justify-between rounded-xl bg-emerald-50/80 border border-emerald-200/90 p-2.5 px-3.5 animate-in fade-in slide-in-from-top-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#163A2E]">
              <span className="size-2 rounded-full bg-[#107569]" />
              <span>
                {selectedRows.length} {selectedRows.length === 1 ? 'leave type' : 'leave types'} selected
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setSelectedRows([])}
                className="h-7 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Clear
              </Button>
              <Button
                type="button"
                onClick={() => setBulkDeleteOpen(true)}
                disabled={saving}
                className="h-7.5 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold gap-1.5 shadow-2xs cursor-pointer"
              >
                <FontAwesomeIcon icon={faTrashCan} className="size-3" />
                <span>Delete Selected</span>
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── 4. Leave Types Data Table ──────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
        {/* Loading State */}
        {loading && (
          <div className="p-12 text-center">
            <FontAwesomeIcon icon={faRotateRight} className="size-6 text-[#107569] animate-spin mb-3" />
            <p className="text-xs font-medium text-slate-500">Loading leave types...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && filtered.length === 0 && (
          <div className="p-12 text-center">
            <div className="size-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
              <FontAwesomeIcon icon={faClock} className="size-5" />
            </div>
            <p className="text-sm font-bold text-slate-800">No leave types found</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {query
                ? `No leave types matching “${query}”. Try adjusting your search.`
                : statusTab === 'archived'
                ? 'No archived leave types in the database.'
                : 'No leave types configured yet. Click below to add one.'}
            </p>
            {query ? (
              <Button
                variant="outline"
                onClick={() => setQuery('')}
                className="mt-3 text-xs rounded-xl"
              >
                Clear Search
              </Button>
            ) : (
              <Button
                onClick={handleOpenCreate}
                className="mt-3 text-xs bg-[#107569] hover:bg-[#0e6359] text-white rounded-xl"
              >
                <FontAwesomeIcon icon={faPlus} className="size-3 mr-1.5" />
                Add Leave Type
              </Button>
            )}
          </div>
        )}

        {/* Desktop Table View */}
        {!loading && filtered.length > 0 && (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E2E8E5] bg-[#F8FAFC] text-[11px] font-bold uppercase tracking-wider text-[#163A2E]">
                    {/* Checkbox */}
                    <th className="w-10 py-3.5 pl-4 pr-2">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={handleSelectAll}
                        className="rounded border-slate-300 text-[#107569] focus:ring-[#107569] size-3.5 cursor-pointer accent-[#107569]"
                        title="Select all on this page"
                      />
                    </th>

                    {/* Leave Type Name */}
                    <th className="py-3.5 px-3 min-w-[200px] max-w-[260px]">
                      <button
                        type="button"
                        onClick={() => toggleSort('name')}
                        className="group flex items-center gap-1.5 font-bold uppercase cursor-pointer hover:text-[#107569] transition-colors"
                      >
                        <span>Leave Type Name</span>
                        <span className="text-slate-400 group-hover:text-[#107569]">
                          {sortField === 'name' ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
                        </span>
                      </button>
                    </th>

                    {/* Code */}
                    <th className="py-3.5 px-3 w-28">
                      <button
                        type="button"
                        onClick={() => toggleSort('code')}
                        className="group flex items-center gap-1.5 font-bold uppercase cursor-pointer hover:text-[#107569] transition-colors"
                      >
                        <span>Code</span>
                        <span className="text-slate-400 group-hover:text-[#107569]">
                          {sortField === 'code' ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
                        </span>
                      </button>
                    </th>

                    {/* Annual Allowance */}
                    <th className="py-3.5 px-3 min-w-[170px]">
                      <button
                        type="button"
                        onClick={() => toggleSort('daysAllowedPerYear')}
                        className="group flex items-center gap-1.5 font-bold uppercase cursor-pointer hover:text-[#107569] transition-colors"
                      >
                        <span>Annual Allowance</span>
                        <span className="text-slate-400 group-hover:text-[#107569]">
                          {sortField === 'daysAllowedPerYear' ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
                        </span>
                      </button>
                    </th>

                    {/* Eligible Staff */}
                    <th className="py-3.5 px-3 w-32">
                      <button
                        type="button"
                        onClick={() => toggleSort('members')}
                        className="group flex items-center gap-1.5 font-bold uppercase cursor-pointer hover:text-[#107569] transition-colors"
                      >
                        <span>Eligible Staff</span>
                        <span className="text-slate-400 group-hover:text-[#107569]">
                          {sortField === 'members' ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
                        </span>
                      </button>
                    </th>

                    {/* Status */}
                    <th className="py-3.5 px-3 w-28">
                      <button
                        type="button"
                        onClick={() => toggleSort('status')}
                        className="group flex items-center gap-1.5 font-bold uppercase cursor-pointer hover:text-[#107569] transition-colors"
                      >
                        <span>Status</span>
                        <span className="text-slate-400 group-hover:text-[#107569]">
                          {sortField === 'status' ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
                        </span>
                      </button>
                    </th>

                    {/* Actions */}
                    <th className="py-3.5 pl-3 pr-4 text-right w-24">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {paginatedRows.map((row) => {
                    const isSelected = selectedRows.some((r) => r.id === row.id);
                    const isActive = row.status === 'Active' || row.isActive !== false;
                    const days = row.daysAllowedPerYear ?? (Number(String(row.head || '').match(/\d+/)?.[0]) || 0);

                    return (
                      <tr
                        key={row.id}
                        className={`h-[52px] transition-colors hover:bg-slate-50/70 ${
                          isSelected ? 'bg-emerald-50/40' : ''
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="py-2.5 pl-4 pr-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectRow(row)}
                            className="rounded border-slate-300 text-[#107569] focus:ring-[#107569] size-3.5 cursor-pointer accent-[#107569]"
                          />
                        </td>

                        {/* Leave Type Name */}
                        <td className="py-2.5 px-3 min-w-0 max-w-[260px]">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-emerald-200/70 bg-emerald-50 text-[#107569] shadow-2xs">
                              <FontAwesomeIcon icon={faClock} className="size-3.5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <button
                                type="button"
                                onClick={() => setViewing(row)}
                                className="font-semibold text-xs text-slate-900 hover:text-[#107569] transition-colors truncate block text-left cursor-pointer"
                                title={`View details for ${row.name}`}
                              >
                                {row.name}
                              </button>
                              {row.description ? (
                                <TruncatedText
                                  value={row.description}
                                  maxWidth="max-w-[220px]"
                                  className="text-[11px] text-slate-400 mt-0.5"
                                  label="Leave Description"
                                />
                              ) : (
                                <span className="text-[11px] text-slate-400 block truncate">
                                  {days} Days / Year {row.isPaid !== false ? '· Paid' : '· Unpaid'}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Code */}
                        <td className="py-2.5 px-3">
                          <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-700 shadow-2xs">
                            {row.code || '—'}
                          </span>
                        </td>

                        {/* Annual Allowance */}
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80">
                            <span className="inline-flex items-center justify-center size-5 rounded-full bg-emerald-200/80 text-[10px] font-bold text-emerald-900 font-mono">
                              {days}D
                            </span>
                            <span>{days} Days / Year</span>
                          </div>
                        </td>

                        {/* Eligible Staff */}
                        <td className="py-2.5 px-3">
                          <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200/80">
                            {row.members || 0}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-2.5 px-3">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition-colors ${
                              isActive
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            <span
                              className={`size-1.5 rounded-full ${
                                isActive ? 'bg-emerald-500' : 'bg-slate-400'
                              }`}
                            />
                            {isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-2.5 pl-3 pr-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => setViewing(row)}
                              className="size-7 rounded-lg text-slate-400 hover:text-[#107569] hover:bg-emerald-50 transition-colors flex items-center justify-center cursor-pointer"
                              title="View Details"
                            >
                              <FontAwesomeIcon icon={faEye} className="size-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(row)}
                              className="size-7 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center cursor-pointer"
                              title="Edit Leave Type"
                            >
                              <FontAwesomeIcon icon={faPenToSquare} className="size-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setPendingDelete(row)}
                              className="size-7 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors flex items-center justify-center cursor-pointer"
                              title="Delete Leave Type"
                            >
                              <FontAwesomeIcon icon={faTrashCan} className="size-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View (Screens < 768px) */}
            <div className="grid gap-3 p-3.5 md:hidden">
              {paginatedRows.map((row) => {
                const isActive = row.status === 'Active' || row.isActive !== false;
                const days = row.daysAllowedPerYear ?? (Number(String(row.head || '').match(/\d+/)?.[0]) || 0);

                return (
                  <article
                    key={row.id}
                    className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-emerald-200/70 bg-emerald-50 text-[#107569]">
                          <FontAwesomeIcon icon={faClock} className="size-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-slate-900 truncate">{row.name}</p>
                          <p className="font-mono text-[10px] text-slate-500">{row.code || '—'}</p>
                        </div>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        <span className={`size-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        {isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold text-xs bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <FontAwesomeIcon icon={faCalendarDays} className="size-3 text-[#107569]" />
                        {days} Days / Year
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs bg-slate-100 text-slate-700">
                        Staff: {row.members || 0}
                      </span>
                      {row.isPaid !== false && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                          Paid
                        </span>
                      )}
                    </div>

                    {row.description && (
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {row.description}
                      </p>
                    )}

                    <div className="pt-1 flex gap-2 border-t border-slate-100">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setViewing(row)}
                        className="h-7.5 flex-1 text-xs rounded-lg"
                      >
                        View
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleOpenEdit(row)}
                        className="h-7.5 flex-1 text-xs rounded-lg"
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setPendingDelete(row)}
                        className="h-7.5 flex-1 text-xs rounded-lg text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                      >
                        Delete
                      </Button>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* ── 5. Compact Pagination Footer ───────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-slate-200/80 bg-slate-50/50 px-4 py-3 text-xs text-slate-600">
              <div className="flex items-center gap-3">
                <span>
                  Showing {sorted.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}–
                  {Math.min(currentPage * pageSize, sorted.length)} of {sorted.length} leave types
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400">Rows per page:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setPage(1);
                    }}
                    className="h-7 rounded-md border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#107569]"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-1.5 self-end sm:self-auto">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="h-7 px-2 rounded-lg border-slate-200 text-xs"
                >
                  <FontAwesomeIcon icon={faChevronLeft} className="size-3 mr-1" />
                  <span>Prev</span>
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setPage(pageNum)}
                        className={`size-7 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                          currentPage === pageNum
                            ? 'bg-[#107569] text-white shadow-2xs'
                            : 'text-slate-600 hover:bg-slate-200/60'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="h-7 px-2 rounded-lg border-slate-200 text-xs"
                >
                  <span>Next</span>
                  <FontAwesomeIcon icon={faChevronRight} className="size-3 ml-1" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── 6. Create / Edit Leave Type Drawer ─────────────────────────────── */}
      <FormDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title={editing ? 'Edit Leave Type' : 'Create Leave Type'}
        description="Configure entitlement, annual allowance, and carry forward policies."
        saving={saving}
        onSubmit={handleSave}
        submitLabel={editing ? 'Save Changes' : 'Create Leave Type'}
        size="simple"
      >
        <div className="space-y-3.5">
          {/* Name & Code */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">Leave Type Name *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Casual Leave, Sick Leave"
              className="h-9 text-xs"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">Code Identifier *</Label>
            <Input
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              placeholder="e.g. CL, SL, PL"
              className="h-9 font-mono text-xs uppercase"
              required
            />
          </div>

          {/* Annual Allowance */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">Annual Allowance (Days / Year) *</Label>
            <Input
              type="number"
              min={0}
              max={365}
              value={form.daysAllowedPerYear}
              onChange={(e) => setForm({ ...form, daysAllowedPerYear: Number(e.target.value) })}
              className="h-9 text-xs font-semibold"
              required
            />
          </div>

          {/* Applicable Gender */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">Applicable Gender</Label>
            <Select
              value={form.applicableGender}
              onValueChange={(val) => setForm({ ...form, applicableGender: val })}
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Select gender eligibility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Employees</SelectItem>
                <SelectItem value="FEMALE">Female Only (e.g. Maternity)</SelectItem>
                <SelectItem value="MALE">Male Only (e.g. Paternity)</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Paid / Unpaid */}
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 space-y-2.5">
            <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isPaid}
                onChange={(e) => setForm({ ...form, isPaid: e.target.checked })}
                className="size-4 rounded text-[#107569] accent-[#107569]"
              />
              <span>Is Paid Leave (Salary is not deducted)</span>
            </label>

            <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isCarryForward}
                onChange={(e) => setForm({ ...form, isCarryForward: e.target.checked })}
                className="size-4 rounded text-[#107569] accent-[#107569]"
              />
              <span>Allow Carry Forward to Next Calendar Year</span>
            </label>

            {form.isCarryForward && (
              <div className="pt-1.5 pl-6 space-y-1">
                <Label className="text-[11px] font-semibold text-slate-600">Max Carry Forward Days</Label>
                <Input
                  type="number"
                  min={0}
                  max={365}
                  value={form.maxCarryForwardDays}
                  onChange={(e) => setForm({ ...form, maxCarryForwardDays: Number(e.target.value) })}
                  className="h-8 text-xs bg-white"
                />
              </div>
            )}
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">Status</Label>
            <Select
              value={form.isActive ? 'active' : 'inactive'}
              onValueChange={(val) => setForm({ ...form, isActive: val === 'active' })}
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">Description / Guidelines</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              placeholder="Guidelines, required notice, or conditions..."
              className="text-xs resize-none"
            />
          </div>
        </div>
      </FormDrawer>

      {/* ── 7. View Details Drawer ────────────────────────────────────────── */}
      <FormDrawer
        open={Boolean(viewing)}
        onOpenChange={(open) => {
          if (!open) setViewing(null);
        }}
        title={viewing?.name || 'Leave Type Details'}
        description="Specifications, allowances, and rules for this leave classification."
        size="simple"
      >
        {viewing && (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200/90 bg-slate-50/60 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Leave Code</span>
                <span className="font-mono font-bold text-slate-800 px-2 py-0.5 rounded bg-white border border-slate-200">
                  {viewing.code}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Annual Allowance</span>
                <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {viewing.daysAllowedPerYear ?? (Number(String(viewing.head || '').match(/\d+/)?.[0]) || 0)} Days / Year
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Compensation</span>
                <span className="font-semibold text-slate-800">
                  {viewing.isPaid !== false ? 'Paid Leave' : 'Unpaid Leave'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Carry Forward</span>
                <span className="font-semibold text-slate-800">
                  {viewing.isCarryForward ? `Yes (Up to ${viewing.maxCarryForwardDays || 0} days)` : 'No'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Eligible Gender</span>
                <span className="font-semibold text-slate-800">
                  {viewing.applicableGender === 'FEMALE' ? 'Female Only' : viewing.applicableGender === 'MALE' ? 'Male Only' : 'All Employees'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Status</span>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    viewing.status === 'Active' || viewing.isActive !== false
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  <span className={`size-1.5 rounded-full ${viewing.status === 'Active' || viewing.isActive !== false ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                  {viewing.status === 'Active' || viewing.isActive !== false ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            {viewing.description && (
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Guidelines & Scope</h4>
                <p className="text-xs text-slate-600 leading-relaxed p-3 rounded-xl bg-white border border-slate-200">
                  {viewing.description}
                </p>
              </div>
            )}

            <div className="pt-2 flex gap-2">
              <Button
                type="button"
                onClick={() => {
                  const current = viewing;
                  setViewing(null);
                  handleOpenEdit(current);
                }}
                className="flex-1 bg-[#107569] hover:bg-[#0e6359] text-white text-xs font-semibold h-9 rounded-xl"
              >
                <FontAwesomeIcon icon={faPenToSquare} className="size-3 mr-1.5" />
                Edit Leave Type
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setViewing(null)}
                className="flex-1 text-xs h-9 rounded-xl"
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </FormDrawer>

      {/* ── 8. Delete Confirmation Dialogs ─────────────────────────────────── */}
      <PermanentDeleteDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        recordName={pendingDelete?.name}
        noun="leave type"
        warningNote="Leave types cannot be deleted if any employee leave balances or active requests reference them."
        loading={saving}
        onConfirm={handleConfirmDelete}
      />

      <PermanentDeleteDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        count={selectedRows.length}
        noun="leave type"
        warningNote="Leave types cannot be deleted if referenced by employee records or requests."
        loading={saving}
        onConfirm={handleBulkDelete}
      />

      {/* ── 9. Text Preview Modal (Touch / Tap to View) ─────────────────────── */}
      <Dialog open={Boolean(textModal)} onOpenChange={(open) => !open && setTextModal(null)}>
        <DialogContent className="max-w-md rounded-2xl bg-white p-5 border border-slate-200 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-slate-900">
              {textModal?.title || 'Details'}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-2 text-xs leading-relaxed text-slate-600 whitespace-pre-wrap break-words max-h-64 overflow-y-auto p-3 rounded-xl bg-slate-50 border border-slate-100">
            {textModal?.text}
          </div>
          <div className="mt-4 flex justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setTextModal(null)}
              className="text-xs rounded-xl"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default LeaveTypesScreen;
