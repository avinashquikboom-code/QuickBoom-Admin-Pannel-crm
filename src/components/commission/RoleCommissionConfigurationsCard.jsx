'use client';

import * as React from 'react';
import api from '../../../lib/api';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { StatusBadge } from '@/components/common/StatusBadge';
import { FormDrawer } from '@/components/common/drawers';
import { AdminRowActions } from '@/components/common/AdminRowActions';
import { sessionCanAction, hrmError } from '@/modules/hrm/hrm-api';
import { toast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/currency';
import {
  Search,
  SlidersHorizontal,
  Plus,
  RotateCw,
  Calendar,
  Layers,
  ChevronDown,
  Check,
  History,
  AlertTriangle,
  FileSpreadsheet,
  Trash2,
  ArrowUp,
} from 'lucide-react';

const unwrap = (value) => value?.data ?? value;

const blankSlab = () => ({
  name: '',
  minAmount: '',
  maxAmount: '',
  ratePercent: '',
  isActive: true,
});

const blank = () => ({
  name: '',
  description: '',
  roleId: '',
  status: 'ACTIVE',
  calculationBasis: 'FULL_PAYMENT_AMOUNT',
  startsAt: new Date().toISOString().slice(0, 10),
  endsAt: '',
  allowGaps: false,
  slabs: [blankSlab()],
});

function Field({ label, children, required = false }) {
  return (
    <Label className="grid min-w-0 gap-1.5 text-xs font-semibold text-slate-700">
      <span>
        {label} {required && <span className="text-rose-500">*</span>}
      </span>
      {children}
    </Label>
  );
}

const dateOnly = (value) => (value ? String(value).slice(0, 10) : '');

function activePeriodConflicts(rows, form) {
  if (!form || form.status !== 'ACTIVE' || !form.roleId || !form.startsAt) return [];
  const start = dateOnly(form.startsAt);
  const end = dateOnly(form.endsAt) || '9999-12-31';
  return rows.filter((row) => {
    if (
      row.status !== 'ACTIVE' ||
      Number(row.roleId) !== Number(form.roleId) ||
      (form.id && Number(row.id) === Number(form.id))
    )
      return false;
    const rowStart = dateOnly(row.startsAt) || '0000-01-01';
    const rowEnd = dateOnly(row.endsAt) || '9999-12-31';
    return rowStart <= end && rowEnd >= start;
  });
}

export function RoleCommissionConfigurationsCard({
  roles = [],
  onRolesLoaded,
  className = '',
}) {
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [manage, setManage] = React.useState(false);

  // Filters & Search
  const [search, setSearch] = React.useState('');
  const [roleFilter, setRoleFilter] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('');

  // Column Visibility Control
  const [columnVisibility, setColumnVisibility] = React.useState({
    name: true,
    role: true,
    status: true,
    effectiveDates: true,
    slabs: true,
    createdBy: true,
    updated: true,
    actions: true,
  });
  const [columnsDropdownOpen, setColumnsDropdownOpen] = React.useState(false);

  // Pagination
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);

  // Modals & Drawers
  const [form, setForm] = React.useState(null);
  const [saving, setSaving] = React.useState(false);
  const [history, setHistory] = React.useState(null);

  const periodConflicts = activePeriodConflicts(rows, form);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [configs, roleRows] = await Promise.all([
        api.get('/commissions/configs/rules'),
        api.get('/commissions/configs/roles'),
      ]);
      const loadedRows = unwrap(configs) || [];
      const loadedRoles = unwrap(roleRows) || [];
      setRows(loadedRows);
      if (onRolesLoaded) onRolesLoaded(loadedRoles);
    } catch (e) {
      setError(hrmError(e));
    } finally {
      setLoading(false);
    }
  }, [onRolesLoaded]);

  React.useEffect(() => {
    setManage(sessionCanAction('COMMISSION', 'MANAGE'));
    load();
  }, [load]);

  const set = (key, value) => setForm((curr) => ({ ...curr, [key]: value }));

  function edit(row) {
    setForm({
      ...row,
      startsAt: row.startsAt?.slice(0, 10) || '',
      endsAt: row.endsAt?.slice(0, 10) || '',
      allowGaps: false,
      slabs: (row.slabs || []).map((s) => ({ ...s, maxAmount: s.maxAmount ?? '' })),
    });
  }

  async function save() {
    if (periodConflicts.length) {
      toast.error('An active configuration already covers this role and effective period. Edit the existing rule or choose non-overlapping dates.');
      return;
    }
    setSaving(true);
    try {
      const body = {
        ...form,
        roleId: Number(form.roleId),
        endsAt: form.endsAt || null,
        slabs: (form.slabs || []).map((s) => ({
          ...s,
          minAmount: Number(s.minAmount),
          maxAmount: s.maxAmount === '' || s.maxAmount == null ? null : Number(s.maxAmount),
          ratePercent: Number(s.ratePercent),
        })),
      };
      if (form.id) {
        await api.patch(`/commissions/configs/rules/${form.id}`, body);
      } else {
        await api.post('/commissions/configs/rules', body);
      }
      setForm(null);
      toast.success('Commission configuration saved successfully');
      await load();
    } catch (e) {
      toast.error(hrmError(e));
    } finally {
      setSaving(false);
    }
  }

  // Filtered rows
  const filteredRows = React.useMemo(() => {
    return rows.filter((r) => {
      if (search) {
        const query = search.toLowerCase();
        const matchesName = (r.name || '').toLowerCase().includes(query);
        const matchesRole = (r.role?.name || '').toLowerCase().includes(query);
        const matchesDesc = (r.description || '').toLowerCase().includes(query);
        const matchesUser = String(r.createdById || '').toLowerCase().includes(query);
        if (!matchesName && !matchesRole && !matchesDesc && !matchesUser) return false;
      }
      if (roleFilter && String(r.roleId) !== String(roleFilter)) return false;
      if (statusFilter && String(r.status).toUpperCase() !== String(statusFilter).toUpperCase()) return false;
      return true;
    });
  }, [rows, search, roleFilter, statusFilter]);

  // Paginated rows
  const totalPages = Math.ceil(filteredRows.length / pageSize) || 1;
  const paginatedRows = React.useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    return filteredRows.slice(startIndex, startIndex + pageSize);
  }, [filteredRows, page, pageSize]);

  return (
    <div className={`rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-6 shadow-xs space-y-5 ${className}`}>
      {/* 1. Header with Title, Description, and Add Configuration Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            Role-based Commission Configurations
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            The selected percentage applies to the full confirmed payment. Saved commissions retain their original calculation.
          </p>
        </div>
        {manage && (
          <Button
            onClick={() => setForm(blank())}
            className="h-9 sm:h-10 px-4 bg-[#163A2E] hover:bg-[#204C3D] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-all cursor-pointer self-start sm:self-auto shrink-0 flex items-center gap-2"
          >
            <Plus className="size-4" />
            <span>Add Configuration</span>
          </Button>
        )}
      </div>

      {/* 2. Filters & Toolbar Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
        {/* Search */}
        <div className="sm:col-span-5 relative">
          <Search className="absolute left-3 top-3 size-4 text-slate-400 pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by name, role, or user..."
            className="pl-9 h-10 text-xs sm:text-sm rounded-xl border-slate-200 focus-visible:ring-[#163A2E]"
          />
        </div>

        {/* Role Filter */}
        <div className="sm:col-span-3">
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#163A2E] cursor-pointer"
          >
            <option value="">All Roles</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="sm:col-span-2">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#163A2E] cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>

        {/* Columns Visibility & Refresh */}
        <div className="sm:col-span-2 flex items-center gap-2 justify-end">
          {/* Columns Visibility Dropdown */}
          <div className="relative">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setColumnsDropdownOpen(!columnsDropdownOpen)}
              className="h-10 px-3 text-xs font-semibold border-slate-200 text-slate-700 hover:bg-[#E8F1EC] hover:text-[#163A2E] rounded-xl flex items-center gap-1.5"
            >
              <SlidersHorizontal className="size-3.5" />
              <span className="hidden xl:inline">Columns</span>
              <ChevronDown className="size-3 text-slate-400" />
            </Button>

            {columnsDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setColumnsDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-1 w-52 rounded-xl border border-slate-200 bg-white p-2 shadow-lg z-50 text-xs space-y-1">
                  <span className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 block border-b border-slate-100 mb-1">
                    Toggle Columns
                  </span>
                  {[
                    { key: 'name', label: 'Name' },
                    { key: 'role', label: 'Role' },
                    { key: 'status', label: 'Status' },
                    { key: 'effectiveDates', label: 'Effective Dates' },
                    { key: 'slabs', label: 'Slabs' },
                    { key: 'createdBy', label: 'Created By' },
                    { key: 'updated', label: 'Updated' },
                  ].map((col) => (
                    <label
                      key={col.key}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer select-none text-slate-700 font-medium"
                    >
                      <input
                        type="checkbox"
                        checked={columnVisibility[col.key]}
                        onChange={(e) =>
                          setColumnVisibility((prev) => ({
                            ...prev,
                            [col.key]: e.target.checked,
                          }))
                        }
                        className="rounded border-slate-300 text-[#163A2E] focus:ring-[#163A2E]"
                      />
                      <span>{col.label}</span>
                    </label>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Refresh Button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={load}
            disabled={loading}
            className="h-10 px-3 text-xs font-semibold border-slate-200 text-slate-700 hover:bg-[#E8F1EC] hover:text-[#163A2E] rounded-xl"
            title="Reload configurations"
          >
            <RotateCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div
          role="alert"
          className="rounded-xl bg-rose-50 border border-rose-200 p-4 text-xs sm:text-sm text-rose-700 flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
          <Button variant="outline" size="sm" onClick={load} className="h-8 text-xs border-rose-300">
            Retry
          </Button>
        </div>
      )}

      {/* 3. Table for Desktop/Laptop/Tablet and Responsive Cards for Mobile */}
      <div className="space-y-4">
        {/* Contained Horizontal Scroll Table (Tablet and Desktop) */}
        <div className="hidden sm:block w-full overflow-x-auto min-w-0 rounded-xl border border-slate-200/90 shadow-2xs">
          <table className="w-full text-left text-xs divide-y divide-slate-100">
            <thead className="bg-[#F7F9F8] text-[#527063] font-bold uppercase tracking-wider text-[11px]">
              <tr>
                {columnVisibility.name && <th className="px-4 py-3.5">Name</th>}
                {columnVisibility.role && <th className="px-4 py-3.5">Role</th>}
                {columnVisibility.status && <th className="px-4 py-3.5">Status</th>}
                {columnVisibility.effectiveDates && <th className="px-4 py-3.5">Effective Dates</th>}
                {columnVisibility.slabs && <th className="px-4 py-3.5">Slabs</th>}
                {columnVisibility.createdBy && <th className="px-4 py-3.5">Created By</th>}
                {columnVisibility.updated && <th className="px-4 py-3.5">Updated</th>}
                {columnVisibility.actions && <th className="px-4 py-3.5 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <RotateCw className="size-4 animate-spin text-[#163A2E]" />
                      <span>Loading commission configurations…</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <div className="max-w-xs mx-auto space-y-2">
                      <FileSpreadsheet className="size-8 mx-auto text-slate-300" />
                      <p className="font-semibold text-slate-700">No configurations found</p>
                      <p className="text-xs text-slate-400">
                        {search || roleFilter || statusFilter
                          ? 'No commission rules match your current filters.'
                          : 'No role-based commission configurations yet.'}
                      </p>
                      {manage && !search && !roleFilter && (
                        <Button
                          size="sm"
                          onClick={() => setForm(blank())}
                          className="mt-2 bg-[#163A2E] text-white text-xs"
                        >
                          Add first configuration
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedRows.map((r) => (
                  <tr key={r.id} className="hover:bg-[#F8FBF9] transition-colors">
                    {columnVisibility.name && (
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900 max-w-[200px] truncate" title={r.name}>
                          {r.name}
                        </div>
                        {r.description && (
                          <div className="text-[11px] text-slate-400 max-w-[200px] truncate" title={r.description}>
                            {r.description}
                          </div>
                        )}
                      </td>
                    )}
                    {columnVisibility.role && (
                      <td className="px-4 py-3">
                        <span className="font-medium text-slate-700">
                          {r.role?.name || `Role #${r.roleId}`}
                        </span>
                      </td>
                    )}
                    {columnVisibility.status && (
                      <td className="px-4 py-3">
                        <StatusBadge status={r.status === 'ACTIVE' ? 'active' : 'inactive'} />
                      </td>
                    )}
                    {columnVisibility.effectiveDates && (
                      <td className="px-4 py-3 whitespace-nowrap text-slate-600 font-mono text-[11px]">
                        {dateOnly(r.startsAt)} → {dateOnly(r.endsAt) || 'No end date'}
                      </td>
                    )}
                    {columnVisibility.slabs && (
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#E8F1EC] text-[#163A2E] border border-emerald-200">
                          {(r.slabs || []).filter((s) => s.isActive).length} Slabs
                        </span>
                      </td>
                    )}
                    {columnVisibility.createdBy && (
                      <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">
                        {r.createdById ?? '—'}
                      </td>
                    )}
                    {columnVisibility.updated && (
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap text-[11px]">
                        {new Date(r.updatedAt).toLocaleDateString()}
                      </td>
                    )}
                    {columnVisibility.actions && (
                      <td className="px-4 py-3 text-right">
                        <AdminRowActions
                          title={r.name}
                          rowActions={[
                            ...(manage
                              ? [
                                  {
                                    label: 'Edit configuration',
                                    onSelect: () => edit(r),
                                  },
                                ]
                              : []),
                            {
                              label: 'Configuration history',
                              onSelect: () => setHistory(r),
                            },
                          ]}
                        />
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View: Configuration Cards (sm:hidden) */}
        <div className="block sm:hidden space-y-3">
          {loading ? (
            <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-xs text-slate-500">
              <RotateCw className="size-4 animate-spin text-[#163A2E] mx-auto mb-2" />
              <span>Loading configurations…</span>
            </div>
          ) : paginatedRows.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-xs text-slate-500 space-y-2">
              <FileSpreadsheet className="size-6 mx-auto text-slate-300" />
              <p className="font-semibold text-slate-700">No configurations found</p>
            </div>
          ) : (
            paginatedRows.map((r) => (
              <div
                key={r.id}
                className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-2xs space-y-3"
              >
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{r.name}</h4>
                    <p className="text-xs text-slate-500 font-medium">{r.role?.name || `Role #${r.roleId}`}</p>
                  </div>
                  <StatusBadge status={r.status === 'ACTIVE' ? 'active' : 'inactive'} />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Dates</span>
                    <span className="font-mono text-[11px] text-slate-700">
                      {dateOnly(r.startsAt)} → {dateOnly(r.endsAt) || 'None'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Active Slabs</span>
                    <span className="font-semibold text-[#163A2E]">
                      {(r.slabs || []).filter((s) => s.isActive).length} Slabs
                    </span>
                  </div>
                </div>

                {r.description && (
                  <p className="text-xs text-slate-500 italic bg-slate-50 p-2 rounded-lg">
                    {r.description}
                  </p>
                )}

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-[10px] text-slate-400 font-mono">
                    Updated {new Date(r.updatedAt).toLocaleDateString()}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {manage && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => edit(r)}
                        className="h-7 text-xs border-slate-200 text-[#163A2E] hover:bg-[#E8F1EC]"
                      >
                        Edit
                      </Button>
                    )}
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setHistory(r)}
                      className="h-7 text-xs border-slate-200 text-slate-600 hover:bg-slate-50"
                    >
                      History
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 4. Pagination & Rows per page */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 pt-1">
          <div className="flex items-center gap-3 self-start sm:self-auto">
            <span>
              Showing {filteredRows.length === 0 ? 0 : (page - 1) * pageSize + 1} to{' '}
              {Math.min(page * pageSize, filteredRows.length)} of {filteredRows.length} configurations
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400">Rows:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="h-7 rounded-md border border-slate-200 bg-white px-1.5 text-xs text-slate-700 cursor-pointer"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="h-8 rounded-lg text-xs border-slate-200"
            >
              Previous
            </Button>
            <span className="text-xs font-semibold text-slate-700 px-2">
              Page {page} of {totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="h-8 rounded-lg text-xs border-slate-200"
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* 5. Add / Edit Configuration FormDrawer */}
      <FormDrawer
        open={Boolean(form)}
        onOpenChange={(v) => {
          if (!v && !saving) setForm(null);
        }}
        title={form?.id ? 'Edit Commission Configuration' : 'Add Commission Configuration'}
        description="Configure role slabs, eligible limits, and effective timeframes."
        size="xl"
        loading={saving}
        disabled={periodConflicts.length > 0}
        onSubmit={save}
        submitLabel="Save Configuration"
      >
        {form && (
          <div className="space-y-5 text-xs sm:text-sm">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Configuration Name" required>
                <Input
                  required
                  maxLength={120}
                  placeholder="e.g. Senior Sales Commission 2026"
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  className="h-10 rounded-xl"
                />
              </Field>

              <Field label="Eligible Role" required>
                <select
                  required
                  className="h-10 rounded-xl border border-slate-200 px-3 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#163A2E] cursor-pointer"
                  value={form.roleId}
                  onChange={(e) => set('roleId', e.target.value)}
                >
                  <option value="">Select eligible role...</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Description">
                <Input
                  placeholder="Optional notes or rule basis"
                  value={form.description || ''}
                  onChange={(e) => set('description', e.target.value)}
                  className="h-10 rounded-xl"
                />
              </Field>

              <Field label="Status">
                <select
                  className="h-10 rounded-xl border border-slate-200 px-3 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#163A2E] cursor-pointer"
                  value={form.status}
                  onChange={(e) => set('status', e.target.value)}
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </Field>

              <Field label="Effective Start Date" required>
                <Input
                  required
                  type="date"
                  value={form.startsAt}
                  onChange={(e) => set('startsAt', e.target.value)}
                  className="h-10 rounded-xl"
                />
              </Field>

              <Field label="Effective End Date (Optional)">
                <Input
                  type="date"
                  min={form.startsAt}
                  value={form.endsAt}
                  onChange={(e) => set('endsAt', e.target.value)}
                  className="h-10 rounded-xl"
                />
              </Field>
            </div>

            {/* Overlapping Period Conflicts Warning */}
            {periodConflicts.length > 0 && (
              <div
                role="alert"
                className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900 space-y-2"
              >
                <div className="flex items-center gap-2 font-bold text-amber-950">
                  <AlertTriangle className="size-4 shrink-0 text-amber-600" />
                  <span>An active rule already covers this role and date range.</span>
                </div>
                <p>
                  Add multiple slabs inside one role configuration. Open the active rule below and use “Add slab”; overlapping active configurations for the same role are not allowed.
                </p>
                <ul className="space-y-1.5 pt-1">
                  {periodConflicts.map((row) => (
                    <li
                      key={row.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-amber-100/80 p-2 text-xs"
                    >
                      <span>
                        #{row.id} <strong>{row.name}</strong> · {dateOnly(row.startsAt)} to{' '}
                        {dateOnly(row.endsAt) || 'No end date'}
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => edit(row)}
                        className="h-7 text-xs border-amber-300 bg-white hover:bg-amber-50"
                      >
                        Edit #{row.id} & Add Slabs
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="bg-[#F7FAF8] border border-emerald-100 p-3 rounded-xl text-xs text-[#204C3D]">
              <p>
                Calculation Basis: <strong>Full Confirmed Payment Amount × Selected Slab Rate %</strong>. Ranges include both minimum and maximum boundaries.
              </p>
            </div>

            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.allowGaps}
                onChange={(e) => set('allowGaps', e.target.checked)}
                className="rounded border-slate-300 text-[#163A2E] focus:ring-[#163A2E]"
              />
              <span className="font-medium">Allow intentional gaps between slabs</span>
            </label>

            {/* Slabs Section */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Commission Slabs ({form.slabs.length})
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => set('slabs', [...form.slabs, blankSlab()])}
                  className="h-7 text-xs border-slate-200 text-[#163A2E] hover:bg-[#E8F1EC]"
                >
                  <Plus className="size-3 mr-1" />
                  Add Slab
                </Button>
              </div>

              {form.slabs.map((s, index) => (
                <div
                  key={s.id || `new-${index}`}
                  className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                    <span className="text-xs font-bold text-slate-800">Slab {index + 1}</span>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={s.isActive}
                          onChange={(e) =>
                            set(
                              'slabs',
                              form.slabs.map((item, i) =>
                                i === index ? { ...item, isActive: e.target.checked } : item
                              )
                            )
                          }
                          className="rounded border-slate-300 text-[#163A2E] focus:ring-[#163A2E]"
                        />
                        <span>Active</span>
                      </label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={index === 0}
                        onClick={() => {
                          const items = [...form.slabs];
                          [items[index - 1], items[index]] = [items[index], items[index - 1]];
                          set('slabs', items);
                        }}
                        className="h-6 px-2 text-[11px] border-slate-200"
                      >
                        <ArrowUp className="size-3 mr-0.5" /> Up
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={form.slabs.length === 1}
                        onClick={() =>
                          set(
                            'slabs',
                            form.slabs.filter((_, i) => i !== index)
                          )
                        }
                        className="h-6 px-2 text-[11px] border-rose-200 text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 className="size-3 mr-0.5" /> Remove
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <Field label="Slab Name" required>
                      <Input
                        required
                        placeholder="e.g. Standard Tier"
                        value={s.name}
                        onChange={(e) =>
                          set(
                            'slabs',
                            form.slabs.map((item, i) =>
                              i === index ? { ...item, name: e.target.value } : item
                            )
                          )
                        }
                        className="h-9 rounded-lg"
                      />
                    </Field>

                    <Field label="Minimum Sale (₹)" required>
                      <Input
                        required
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0"
                        value={s.minAmount}
                        onChange={(e) =>
                          set(
                            'slabs',
                            form.slabs.map((item, i) =>
                              i === index ? { ...item, minAmount: e.target.value } : item
                            )
                          )
                        }
                        className="h-9 rounded-lg"
                      />
                    </Field>

                    <Field label="Maximum Sale (₹)">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Unlimited (blank)"
                        value={s.maxAmount}
                        onChange={(e) =>
                          set(
                            'slabs',
                            form.slabs.map((item, i) =>
                              i === index ? { ...item, maxAmount: e.target.value } : item
                            )
                          )
                        }
                        className="h-9 rounded-lg"
                      />
                    </Field>

                    <Field label="Commission Rate (%)" required>
                      <Input
                        required
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        placeholder="e.g. 5"
                        value={s.ratePercent}
                        onChange={(e) =>
                          set(
                            'slabs',
                            form.slabs.map((item, i) =>
                              i === index ? { ...item, ratePercent: e.target.value } : item
                            )
                          )
                        }
                        className="h-9 rounded-lg"
                      />
                    </Field>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-slate-400">
              Note: For paise-accurate continuous ranges, start the next slab at the previous maximum + ₹0.01. Existing confirmed commission earnings are never recalculated.
            </p>
          </div>
        )}
      </FormDrawer>

      {/* 6. Configuration History FormDrawer */}
      <FormDrawer
        open={Boolean(history)}
        onOpenChange={(v) => {
          if (!v) setHistory(null);
        }}
        title={`Configuration History: ${history?.name || ''}`}
        description="Audit record of all prior adjustments, authors, and slab variations."
        showFooter={false}
      >
        {history && (
          <div className="space-y-4 text-xs">
            <div className="bg-[#F7F9F8] border border-slate-200 p-3 rounded-xl flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800 block">{history.name}</span>
                <span className="text-slate-500">Created: {new Date(history.createdAt).toLocaleString()}</span>
              </div>
              <span className="font-mono text-slate-600">User ID: {history.createdById ?? '—'}</span>
            </div>

            {!(history.history || []).length ? (
              <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-slate-400">
                No prior versions found for this configuration.
              </div>
            ) : (
              (history.history || [])
                .slice()
                .reverse()
                .map((h, i) => (
                  <div key={i} className="rounded-xl border border-slate-200 bg-white p-4 space-y-2.5 shadow-2xs">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="font-bold text-slate-900">{h.name}</span>
                      <StatusBadge status={h.status === 'ACTIVE' ? 'active' : 'inactive'} />
                    </div>
                    <p className="text-slate-500 text-[11px]">
                      Changed on {new Date(h.changedAt).toLocaleString()} by User #{h.changedById}
                    </p>
                    <div className="space-y-1 pt-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Slabs in this version:</span>
                      {(h.slabs || []).map((s, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-slate-50 p-2 rounded-lg text-slate-700">
                          <span className="font-medium">{s.name}</span>
                          <span className="font-mono text-[11px]">
                            {formatCurrency(s.minAmount)} – {s.maxAmount == null ? 'Unlimited' : formatCurrency(s.maxAmount)} @ <strong>{s.ratePercent}%</strong>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
            )}
          </div>
        )}
      </FormDrawer>
    </div>
  );
}
