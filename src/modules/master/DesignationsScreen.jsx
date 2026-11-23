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
  faIdBadge,
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
  faLayerGroup,
  faChevronLeft,
  faChevronRight,
  faMobileScreen,
  faListCheck,
  faBuilding,
  faInbox,
} from '@fortawesome/free-solid-svg-icons';
import { toast } from '@/hooks/use-toast';
import {
  loadDesignations,
  loadDesignation,
  saveDesignation,
  removeDesignation,
  bulkDeleteDesignations,
  loadDepartments,
  downloadCsv,
  masterError,
} from './master-api';

function useDebounced(value, delay) {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function emptyDesignationForm() {
  return {
    name: '',
    code: '',
    departmentId: '',
    description: '',
    level: 1,
    isActive: true,
    crmMobileAccess: false,
  };
}

function designationForm(row) {
  return {
    name: row.name || '',
    code: row.code || '',
    departmentId: row.departmentId ? String(row.departmentId) : '',
    description: row.description || '',
    level: row.level ?? 1,
    isActive: row.isActive !== false,
    crmMobileAccess: row.crmMobileAccess === true,
  };
}

function getDepartmentBadge(deptName) {
  if (!deptName || deptName === 'All departments') {
    return {
      label: 'All Departments',
      className: 'bg-slate-100 text-slate-600 border-slate-200',
    };
  }
  const lower = deptName.toLowerCase();
  if (lower.includes('sales') || lower.includes('marketing') || lower.includes('bpo')) {
    return {
      label: deptName,
      className: 'bg-blue-50 text-blue-700 border-blue-200/80',
    };
  }
  if (lower.includes('prod') || lower.includes('ops') || lower.includes('operation')) {
    return {
      label: deptName,
      className: 'bg-purple-50 text-purple-700 border-purple-200/80',
    };
  }
  if (lower.includes('dev') || lower.includes('tech') || lower.includes('eng')) {
    return {
      label: deptName,
      className: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    };
  }
  if (lower.includes('hr') || lower.includes('human') || lower.includes('people')) {
    return {
      label: deptName,
      className: 'bg-amber-50 text-amber-700 border-amber-200/80',
    };
  }
  if (lower.includes('fin') || lower.includes('account')) {
    return {
      label: deptName,
      className: 'bg-cyan-50 text-cyan-700 border-cyan-200/80',
    };
  }
  return {
    label: deptName,
    className: 'bg-slate-100 text-slate-700 border-slate-200',
  };
}

export function DesignationsScreen({ config }) {
  const [rows, setRows] = React.useState([]);
  const [meta, setMeta] = React.useState({ total: 0, page: 1, totalPages: 1 });
  const [departments, setDepartments] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [tab, setTab] = React.useState('all');
  const [query, setQuery] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(20);
  const [refresh, setRefresh] = React.useState(0);

  // Drawers & Modals
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [editing, setEditing] = React.useState(null);
  const [viewing, setViewing] = React.useState(null);
  const [pendingDelete, setPendingDelete] = React.useState(null);
  const [selectedRows, setSelectedRows] = React.useState([]);
  const [selectionResetToken, setSelectionResetToken] = React.useState(0);
  const [bulkDeleteOpen, setBulkDeleteOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState(emptyDesignationForm());

  // Tap-to-view text modal for mobile & full text inspection
  const [textModal, setTextModal] = React.useState(null);

  const debouncedQuery = useDebounced(query, 350);

  React.useEffect(() => {
    setPage(1);
  }, [debouncedQuery, tab]);

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    if (tab === 'archived') {
      setRows([]);
      setMeta({ total: 0, page: 1, totalPages: 1 });
      setLoading(false);
      return undefined;
    }

    const params = { page, limit, search: debouncedQuery || undefined };
    if (tab === 'active') params.isActive = true;
    if (tab === 'inactive') params.isActive = false;

    loadDesignations(params)
      .then((result) => {
        if (!active) return;
        setRows(result.rows || []);
        setMeta(result.meta || { total: result.rows?.length || 0, page, totalPages: 1 });
      })
      .catch((err) => {
        if (active) setError(masterError(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [debouncedQuery, page, limit, refresh, tab]);

  React.useEffect(() => {
    loadDepartments().then(setDepartments).catch(() => setDepartments([]));
  }, []);

  const openEdit = async (row) => {
    setEditing(row);
    setForm(designationForm(row));
    setDrawerOpen(true);
    try {
      const detail = await loadDesignation(row.id);
      setForm(designationForm(detail));
      setViewing((current) =>
        current?.id === row.id
          ? { ...current, ...detail, status: detail.isActive === false ? 'Inactive' : 'Active' }
          : current
      );
    } catch (err) {
      toast.error(masterError(err));
    }
  };

  const save = async (event) => {
    event.preventDefault();
    if (saving) return;
    if (!form.name.trim()) {
      toast.error('Designation name is required');
      return;
    }
    setSaving(true);
    try {
      await saveDesignation(form, editing?.id);
      toast.success(editing ? 'Designation updated successfully' : 'Designation created successfully');
      setDrawerOpen(false);
      setRefresh((value) => value + 1);
    } catch (err) {
      toast.error(masterError(err));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete || saving) return;
    setSaving(true);
    try {
      await removeDesignation(pendingDelete.id);
      toast.success('Designation deleted successfully');
      setPendingDelete(null);
      setRefresh((value) => value + 1);
    } catch (err) {
      toast.error(masterError(err));
    } finally {
      setSaving(false);
    }
  };

  const confirmBulkDelete = async () => {
    if (!selectedRows.length || saving) return;
    setSaving(true);
    try {
      const ids = selectedRows.map((r) => r.id);
      const res = await bulkDeleteDesignations(ids);
      const count = res?.data?.deletedCount ?? res?.deletedCount ?? ids.length;
      toast.success(`${count} designation${count > 1 ? 's' : ''} deleted`);
      setSelectedRows([]);
      setSelectionResetToken((v) => v + 1);
      setBulkDeleteOpen(false);
      setRefresh((v) => v + 1);
    } catch (err) {
      toast.error(masterError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleExport = () => {
    if (!rows.length) {
      toast.error('There are no records to export');
      return;
    }
    downloadCsv(
      'designations.csv',
      rows.map((row) => ({
        name: row.name,
        code: row.code || '',
        department: row.departmentName || 'All departments',
        level: row.level ?? '—',
        employees: row.employeesCount ?? 0,
        status: row.status,
        crmMobileAccess: row.crmMobileAccess ? 'Yes' : 'No',
        description: row.description || '',
      }))
    );
    toast.success('Designations exported successfully');
  };

  // Selection handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows(rows);
    } else {
      setSelectedRows([]);
    }
  };

  const handleSelectRow = (row) => {
    const exists = selectedRows.some((r) => r.id === row.id);
    if (exists) {
      setSelectedRows(selectedRows.filter((r) => r.id !== row.id));
    } else {
      setSelectedRows([...selectedRows, row]);
    }
  };

  const isAllSelected = rows.length > 0 && selectedRows.length === rows.length;

  // KPI Calculations
  const total = Number(meta.total ?? rows.length);
  const totalPages = Number(meta.totalPages || Math.ceil(total / limit) || 1);
  const onPageCount = rows.length;
  const activeOnPage = rows.filter((r) => r.status === 'Active' || r.isActive).length;
  const employeesOnPage = rows.reduce((sum, r) => sum + (Number(r.employeesCount) || 0), 0);

  return (
    <div className="w-full min-w-0 max-w-none space-y-4 sm:space-y-5 overflow-x-hidden pb-12 font-sans text-slate-800">
      {/* ── 1. Page Header ──────────────────────────────────────────────────── */}
      <PageHeader
        category="MASTER MANAGEMENT"
        title="Designations"
        description="Configure job roles, hierarchy levels, seniority designations, and grade bands with employee assignments."
        icon={faIdBadge}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setRefresh((v) => v + 1)}
              disabled={loading}
              className="h-8.5 rounded-xl border-slate-200 text-xs font-semibold text-slate-700 hover:text-[#107569]"
            >
              <FontAwesomeIcon
                icon={faRotateRight}
                className={`size-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`}
              />
              <span>Refresh</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={!rows.length}
              className="h-8.5 rounded-xl border-slate-200 text-xs font-semibold text-slate-700 hover:text-[#107569]"
            >
              <FontAwesomeIcon icon={faDownload} className="size-3.5 mr-1.5" />
              <span>Export CSV</span>
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setEditing(null);
                setForm(emptyDesignationForm());
                setDrawerOpen(true);
              }}
              className="h-8.5 rounded-xl bg-[#107569] px-3.5 text-xs font-semibold text-white shadow-xs hover:bg-[#0e6359]"
            >
              <FontAwesomeIcon icon={faPlus} className="size-3.5 mr-1.5" />
              <span>Add Designation</span>
            </Button>
          </div>
        }
      />

      {/* ── 2. Statistics Cards (4 Compact Cards) ───────────────────────────── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Matching Designations */}
        <div className="flex items-center justify-between overflow-hidden rounded-xl border border-slate-200/90 bg-white p-4 shadow-2xs transition hover:border-emerald-300">
          <div className="space-y-0.5 min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate">
              Matching Designations
            </p>
            <p className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#163A2E]">
              {loading ? '…' : total}
            </p>
            <p className="text-[11px] text-slate-400 truncate">Count from master API</p>
          </div>
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-[#107569] ring-1 ring-emerald-200/60">
            <FontAwesomeIcon icon={faIdBadge} className="size-4.5" />
          </div>
        </div>

        {/* On This Page */}
        <div className="flex items-center justify-between overflow-hidden rounded-xl border border-slate-200/90 bg-white p-4 shadow-2xs transition hover:border-emerald-300">
          <div className="space-y-0.5 min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate">
              On This Page
            </p>
            <p className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
              {loading ? '…' : onPageCount}
            </p>
            <p className="text-[11px] text-slate-400 truncate">Page {page} of {totalPages}</p>
          </div>
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 ring-1 ring-slate-200">
            <FontAwesomeIcon icon={faListCheck} className="size-4.5" />
          </div>
        </div>

        {/* Active On This Page */}
        <div className="flex items-center justify-between overflow-hidden rounded-xl border border-slate-200/90 bg-white p-4 shadow-2xs transition hover:border-emerald-300">
          <div className="space-y-0.5 min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate">
              Active On This Page
            </p>
            <p className="text-xl sm:text-2xl font-extrabold tracking-tight text-emerald-700">
              {loading ? '…' : activeOnPage}
            </p>
            <p className="text-[11px] text-emerald-600 font-medium truncate">Current response</p>
          </div>
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60">
            <FontAwesomeIcon icon={faCircleCheck} className="size-4.5" />
          </div>
        </div>

        {/* Employees On This Page */}
        <div className="flex items-center justify-between overflow-hidden rounded-xl border border-slate-200/90 bg-white p-4 shadow-2xs transition hover:border-emerald-300">
          <div className="space-y-0.5 min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate">
              Employees On This Page
            </p>
            <p className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#163A2E]">
              {loading ? '…' : employeesOnPage}
            </p>
            <p className="text-[11px] text-slate-400 truncate">Assigned employee count</p>
          </div>
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-[#107569] ring-1 ring-emerald-200/60">
            <FontAwesomeIcon icon={faUsers} className="size-4.5" />
          </div>
        </div>
      </div>

      {/* ── 3. Filters, Tabs & Search Toolbar ───────────────────────────────── */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200/90 bg-white p-3 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
        {/* Segmented Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto">
          {[
            { id: 'all', label: 'All', count: tab === 'all' ? total : undefined },
            { id: 'active', label: 'Active', count: tab === 'active' ? total : undefined },
            { id: 'inactive', label: 'Inactive', count: tab === 'inactive' ? total : undefined },
            { id: 'archived', label: 'Archived', count: 0 },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setTab(item.id);
                setPage(1);
              }}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                tab === item.id
                  ? 'bg-[#107569] text-white shadow-2xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>{item.label}</span>
              {item.count !== undefined && (
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                    tab === item.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {item.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Compact Search Bar */}
        <div className="relative min-w-[220px] max-w-sm flex-1">
          <FontAwesomeIcon
            icon={faSearch}
            className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400"
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, code, or description..."
            className="h-8.5 w-full rounded-lg border-slate-200 bg-slate-50/50 pl-8.5 pr-8 text-xs focus:bg-white focus:border-[#107569]"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <FontAwesomeIcon icon={faXmark} className="size-3" />
            </button>
          )}
        </div>
      </div>

      {/* ── 4. Bulk Selection Toolbar ───────────────────────────────────────── */}
      {selectedRows.length > 0 && (
        <AdminBulkSelectionToolbar
          count={selectedRows.length}
          noun="designations"
          onClear={() => {
            setSelectedRows([]);
            setSelectionResetToken((v) => v + 1);
          }}
        >
          <AdminBulkDeleteButton
            count={selectedRows.length}
            onClick={() => setBulkDeleteOpen(true)}
            loading={saving}
          />
        </AdminBulkSelectionToolbar>
      )}

      {/* ── 5. Main Content: Compact Table & Cards ─────────────────────────── */}
      <div className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-2xs">
        {loading ? (
          <div className="py-16 text-center">
            <FontAwesomeIcon
              icon={faRotateRight}
              className="mx-auto size-7 animate-spin text-[#107569]"
            />
            <p className="mt-2.5 text-xs font-semibold text-slate-600">
              Loading designations...
            </p>
          </div>
        ) : error ? (
          <div className="py-14 text-center">
            <p className="text-xs font-semibold text-rose-600">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRefresh((v) => v + 1)}
              className="mt-3 h-8 text-xs font-semibold rounded-lg"
            >
              Retry
            </Button>
          </div>
        ) : rows.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
              <FontAwesomeIcon icon={faInbox} className="size-6" />
            </div>
            <h3 className="mt-3 text-sm font-bold text-slate-800">
              No designations found
            </h3>
            <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500">
              {query || tab !== 'all'
                ? 'No records match your active search or status filter.'
                : 'No designations have been configured yet. Add your first designation.'}
            </p>
            <Button
              size="sm"
              onClick={() => {
                setEditing(null);
                setForm(emptyDesignationForm());
                setDrawerOpen(true);
              }}
              className="mt-4 h-8 rounded-lg bg-[#107569] px-3.5 text-xs font-semibold text-white shadow-2xs hover:bg-[#0e6359]"
            >
              <FontAwesomeIcon icon={faPlus} className="size-3 mr-1" />
              <span>Add Designation</span>
            </Button>
          </div>
        ) : (
          <>
            {/* Desktop Compact Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E2E8E5] bg-[#F8FAFC] text-[11px] font-bold uppercase tracking-wider text-[#163A2E]">
                    <th className="w-10 py-3 pl-4 pr-2">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={handleSelectAll}
                        className="rounded border-slate-300 text-[#107569] focus:ring-[#107569] size-3.5 cursor-pointer"
                        title="Select all"
                      />
                    </th>
                    <th className="py-3 px-3 min-w-[160px] max-w-[220px]">Name</th>
                    <th className="py-3 px-3 min-w-[200px] max-w-[300px]">Description</th>
                    <th className="py-3 px-3 w-28">Code</th>
                    <th className="py-3 px-3 w-36">Department</th>
                    <th className="py-3 px-3 w-20">Level</th>
                    <th className="py-3 px-3 w-24">Employees</th>
                    <th className="py-3 pl-3 pr-4 text-right w-24">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((row) => {
                    const deptBadge = getDepartmentBadge(row.departmentName);
                    const isSelected = selectedRows.some((r) => r.id === row.id);

                    return (
                      <tr
                        key={row.id}
                        className={`h-[50px] transition-colors hover:bg-slate-50/70 ${
                          isSelected ? 'bg-emerald-50/40' : ''
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="py-2 pl-4 pr-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectRow(row)}
                            className="rounded border-slate-300 text-[#107569] focus:ring-[#107569] size-3.5 cursor-pointer"
                          />
                        </td>

                        {/* Name (Truncated with Ellipsis + Tooltip) */}
                        <td className="py-2 px-3 min-w-0 max-w-[220px]">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span
                              title={row.name}
                              onClick={() => setTextModal({ title: 'Designation Name', text: row.name })}
                              className="font-semibold text-slate-900 truncate block cursor-pointer hover:text-[#107569]"
                            >
                              {row.name}
                            </span>
                            {row.crmMobileAccess && (
                              <span
                                title="CRM Mobile Access Enabled"
                                className="inline-flex size-4 shrink-0 items-center justify-center rounded bg-emerald-50 text-[10px] text-[#107569]"
                              >
                                <FontAwesomeIcon icon={faMobileScreen} className="size-2.5" />
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Description (Truncated with Ellipsis + Tooltip + Tap-to-View) */}
                        <td className="py-2 px-3 min-w-0 max-w-[300px]">
                          {row.description ? (
                            <span
                              title={row.description}
                              onClick={() => setTextModal({ title: `${row.name} — Description`, text: row.description })}
                              className="block truncate text-slate-500 cursor-pointer hover:text-slate-800"
                            >
                              {row.description}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        {/* Code (Neutral outlined badge) */}
                        <td className="py-2 px-3 whitespace-nowrap">
                          {row.code ? (
                            <span className="font-mono text-[11px] font-semibold text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                              {row.code}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        {/* Department (Colored compact badge) */}
                        <td className="py-2 px-3 min-w-0 max-w-[150px]">
                          <span
                            title={deptBadge.label}
                            className={`inline-block max-w-full truncate rounded-md px-2 py-0.5 text-[11px] font-semibold border ${deptBadge.className}`}
                          >
                            {deptBadge.label}
                          </span>
                        </td>

                        {/* Level */}
                        <td className="py-2 px-3 whitespace-nowrap">
                          <span className="font-semibold text-slate-700 bg-slate-100/70 px-2 py-0.5 rounded text-[11px]">
                            L-{row.level ?? '—'}
                          </span>
                        </td>

                        {/* Employees Count */}
                        <td className="py-2 px-3 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 font-bold text-slate-700">
                            <FontAwesomeIcon icon={faUsers} className="size-2.5 text-slate-400" />
                            {row.employeesCount ?? 0}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-2 pl-3 pr-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => setViewing(row)}
                              title="View details"
                              className="inline-flex size-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                            >
                              <FontAwesomeIcon icon={faEye} className="size-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => openEdit(row)}
                              title="Edit designation"
                              className="inline-flex size-7 items-center justify-center rounded-lg text-slate-400 hover:bg-emerald-50 hover:text-[#107569]"
                            >
                              <FontAwesomeIcon icon={faPenToSquare} className="size-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setPendingDelete(row)}
                              title="Delete designation"
                              className="inline-flex size-7 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600"
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

            {/* Mobile Responsive Cards */}
            <div className="block md:hidden divide-y divide-slate-100 p-3 space-y-3">
              {rows.map((row) => {
                const deptBadge = getDepartmentBadge(row.departmentName);
                const isSelected = selectedRows.some((r) => r.id === row.id);

                return (
                  <div
                    key={row.id}
                    className={`rounded-xl border p-3.5 space-y-2.5 transition ${
                      isSelected ? 'border-emerald-300 bg-emerald-50/30' : 'border-slate-200/90 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectRow(row)}
                          className="mt-0.5 rounded border-slate-300 text-[#107569] size-3.5 cursor-pointer"
                        />
                        <div className="min-w-0">
                          <h4
                            onClick={() => setTextModal({ title: 'Designation Name', text: row.name })}
                            className="font-bold text-slate-900 text-xs truncate cursor-pointer hover:text-[#107569]"
                          >
                            {row.name}
                          </h4>
                          {row.code && (
                            <span className="font-mono text-[10px] text-slate-500 font-semibold mt-0.5 inline-block">
                              {row.code}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                            row.status === 'Active'
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                              : 'border-slate-200 bg-slate-100 text-slate-600'
                          }`}
                        >
                          <span
                            className={`size-1.5 rounded-full ${
                              row.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-400'
                            }`}
                          />
                          {row.status}
                        </span>
                      </div>
                    </div>

                    {/* Description truncated */}
                    {row.description && (
                      <p
                        onClick={() => setTextModal({ title: `${row.name} — Description`, text: row.description })}
                        className="text-[11px] text-slate-500 line-clamp-2 cursor-pointer hover:text-slate-800"
                        title="Tap to read full description"
                      >
                        {row.description}
                      </p>
                    )}

                    {/* Badges footer & actions */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2 text-[11px]">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold border ${deptBadge.className}`}>
                          {deptBadge.label}
                        </span>
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700">
                          L-{row.level ?? '—'}
                        </span>
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                          {row.employeesCount ?? 0} staff
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setViewing(row)}
                          className="size-7 rounded-lg text-slate-500 hover:bg-slate-100 flex items-center justify-center"
                        >
                          <FontAwesomeIcon icon={faEye} className="size-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEdit(row)}
                          className="size-7 rounded-lg text-slate-500 hover:bg-emerald-50 hover:text-[#107569] flex items-center justify-center"
                        >
                          <FontAwesomeIcon icon={faPenToSquare} className="size-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setPendingDelete(row)}
                          className="size-7 rounded-lg text-rose-500 hover:bg-rose-50 flex items-center justify-center"
                        >
                          <FontAwesomeIcon icon={faTrashCan} className="size-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── 6. Pagination Footer ────────────────────────────────────────── */}
            <div className="flex flex-col gap-2.5 border-t border-slate-200 px-4 py-3 bg-slate-50/50 sm:flex-row sm:items-center sm:justify-between text-xs">
              <p className="text-slate-500 font-medium">
                Showing{' '}
                <span className="font-bold text-slate-800">
                  {total > 0 ? (page - 1) * limit + 1 : 0}
                </span>{' '}
                to{' '}
                <span className="font-bold text-slate-800">
                  {Math.min(page * limit, total)}
                </span>{' '}
                of <span className="font-bold text-slate-800">{total}</span> designations
              </p>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <span>Rows:</span>
                  <select
                    value={limit}
                    onChange={(e) => {
                      setLimit(Number(e.target.value));
                      setPage(1);
                    }}
                    className="h-7.5 rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700 focus:outline-none"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page <= 1 || loading}
                    onClick={() => setPage((v) => Math.max(1, v - 1))}
                    className="h-7.5 px-2.5 rounded-lg border-slate-200 text-xs font-semibold text-slate-700 disabled:opacity-40"
                  >
                    <FontAwesomeIcon icon={faChevronLeft} className="size-2.5 mr-1" />
                    <span>Prev</span>
                  </Button>
                  <span className="px-2 text-xs font-bold text-slate-800">
                    {page} / {totalPages}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages || loading}
                    onClick={() => setPage((v) => Math.min(totalPages, v + 1))}
                    className="h-7.5 px-2.5 rounded-lg border-slate-200 text-xs font-semibold text-slate-700 disabled:opacity-40"
                  >
                    <span>Next</span>
                    <FontAwesomeIcon icon={faChevronRight} className="size-2.5 ml-1" />
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── 7. Add / Edit Designation Drawer ───────────────────────────────── */}
      <FormDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        size="simple"
        title={editing ? 'Edit Designation' : 'Create Designation'}
        description="Configure designation role details, department mappings, and hierarchy level."
        submitLabel={editing ? 'Save Changes' : 'Create Designation'}
        onSubmit={save}
        loading={saving}
        disabled={saving}
      >
        <div className="grid gap-3.5 text-xs">
          <div className="space-y-1">
            <Label className="text-xs font-bold text-slate-700">
              Name <span className="text-rose-500">*</span>
            </Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g., Senior Full Stack Engineer"
              className="h-9 text-xs"
              required
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-bold text-slate-700">
              Code <span className="text-rose-500">*</span>
            </Label>
            <Input
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              placeholder="e.g., L4-DEV"
              className="h-9 font-mono text-xs uppercase"
              required
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-bold text-slate-700">Department</Label>
            <Select
              value={form.departmentId || 'none'}
              onValueChange={(value) =>
                setForm({ ...form, departmentId: value === 'none' ? '' : value })
              }
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="All departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">All departments</SelectItem>
                {departments.map((department) => (
                  <SelectItem key={department.id} value={String(department.id)}>
                    {department.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-bold text-slate-700">Hierarchy Level</Label>
            <Input
              type="number"
              min="1"
              value={form.level}
              onChange={(e) => setForm({ ...form, level: e.target.value })}
              className="h-9 text-xs"
            />
            <p className="text-[11px] text-slate-400">Level 1 is highest in hierarchy.</p>
          </div>

          <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={form.crmMobileAccess}
              onChange={(e) => setForm({ ...form, crmMobileAccess: e.target.checked })}
              className="rounded border-slate-300 text-[#107569] focus:ring-[#107569] size-3.5"
            />
            <span>Enable CRM mobile access for this designation</span>
          </label>

          <div className="space-y-1 pt-1">
            <Label className="text-xs font-bold text-slate-700">Status</Label>
            <Select
              value={form.isActive === false ? 'inactive' : 'active'}
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

          <div className="space-y-1 pt-1">
            <Label className="text-xs font-bold text-slate-700">Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              placeholder="Responsibilities, qualification expectations, or scope of role..."
              className="resize-none text-xs"
            />
          </div>
        </div>
      </FormDrawer>

      {/* ── 8. View Designation Drawer ─────────────────────────────────────── */}
      <FormDrawer
        open={Boolean(viewing)}
        onOpenChange={(open) => !open && setViewing(null)}
        size="simple"
        title={viewing?.name || 'Designation Profile'}
        description={viewing?.code || ''}
        showFooter={false}
      >
        {viewing && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold border ${
                  viewing.status === 'Active'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 bg-slate-100 text-slate-600'
                }`}
              >
                <span
                  className={`size-1.5 rounded-full ${
                    viewing.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-400'
                  }`}
                />
                {viewing.status || 'Active'}
              </span>
              <span className="font-mono text-xs text-slate-400">ID: {viewing.id}</span>
            </div>

            <dl className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <dt className="text-slate-500">Designation Code</dt>
                <dd className="font-mono font-bold text-slate-800">{viewing.code || '—'}</dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="text-slate-500">Department</dt>
                <dd className="font-semibold text-slate-800">
                  {viewing.departmentName || 'All departments'}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="text-slate-500">Hierarchy Level</dt>
                <dd className="font-semibold text-slate-800">Level {viewing.level ?? '—'}</dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="text-slate-500">Employees Assigned</dt>
                <dd className="font-bold text-[#107569]">{viewing.employeesCount ?? 0} staff</dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="text-slate-500">CRM Mobile Access</dt>
                <dd className="font-semibold text-slate-800">
                  {viewing.crmMobileAccess ? 'Enabled' : 'Disabled'}
                </dd>
              </div>
            </dl>

            {viewing.description && (
              <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-1">
                <p className="font-bold text-slate-800">Description</p>
                <p className="leading-relaxed text-slate-600 whitespace-pre-wrap">
                  {viewing.description}
                </p>
              </div>
            )}

            <Button
              type="button"
              onClick={() => {
                const rec = viewing;
                setViewing(null);
                openEdit(rec);
              }}
              className="h-9 w-full rounded-xl bg-[#107569] text-xs font-semibold text-white shadow-xs hover:bg-[#0e6359]"
            >
              <FontAwesomeIcon icon={faPenToSquare} className="size-3 mr-1.5" />
              <span>Edit Designation</span>
            </Button>
          </div>
        )}
      </FormDrawer>

      {/* ── 9. Single & Bulk Delete Confirmation Dialogs ───────────────────── */}
      <PermanentDeleteDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        recordName={pendingDelete?.name || pendingDelete?.code}
        noun="designation"
        warningNote="Assigned employees will prevent permanent deletion and cause the server to deactivate it instead."
        loading={saving}
        onConfirm={confirmDelete}
      />
      <PermanentDeleteDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        count={selectedRows.length}
        noun="designation"
        warningNote="Designations with assigned employees will be deactivated to protect employee records."
        loading={saving}
        onConfirm={confirmBulkDelete}
      />

      {/* ── 10. Tap-to-View Full Text Dialog (for mobile & long text) ─────────── */}
      <Dialog open={Boolean(textModal)} onOpenChange={() => setTextModal(null)}>
        <DialogContent className="max-w-md bg-white rounded-2xl p-5 border border-slate-200 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-slate-900">
              {textModal?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto">
            {textModal?.text}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
