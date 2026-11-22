'use client';

import * as React from 'react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { StatusBadge } from '@/components/common/StatusBadge';
import { FormDrawer } from '@/components/common/drawers';
import { toast } from '@/hooks/use-toast';
import { loadCommissionSettings, saveCommissionSetting, suiteError } from '@/modules/suite/suite-api';
import {
  Search,
  RotateCw,
  Edit2,
  Building,
  CheckCircle2,
  AlertTriangle,
  BadgePercent,
  SlidersHorizontal,
} from 'lucide-react';

export function DesignationCommissionSettingsCard({ className = '' }) {
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  // Filters
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('');
  const [typeFilter, setTypeFilter] = React.useState('');

  // Edit Drawer
  const [editing, setEditing] = React.useState(null);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({
    designationId: '',
    designationName: '',
    commissionRate: '',
    commissionType: 'PERCENTAGE',
    commissionEnabled: true,
  });

  // Pagination
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await loadCommissionSettings();
      setRows(data || []);
    } catch (err) {
      setError(suiteError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const handleEdit = (row) => {
    setEditing(row);
    setForm({
      designationId: row.designationId || row.id,
      designationName: row.designationName || row.name || `Designation #${row.designationId || row.id}`,
      commissionRate: row.commissionRate ?? '',
      commissionType: row.commissionType || 'PERCENTAGE',
      commissionEnabled: row.commissionEnabled ?? true,
    });
  };

  const handleSave = async () => {
    if (form.commissionRate === '' || form.commissionRate == null || Number(form.commissionRate) < 0) {
      toast.warning('Please enter a valid commission rate.');
      return;
    }
    setSaving(true);
    try {
      await saveCommissionSetting({
        designationId: form.designationId,
        commissionRate: form.commissionRate,
        commissionType: form.commissionType,
        commissionEnabled: form.commissionEnabled,
      });
      toast.success('Designation commission setting saved successfully');
      setEditing(null);
      await load();
    } catch (err) {
      toast.error(suiteError(err));
    } finally {
      setSaving(false);
    }
  };

  // Filtered rows
  const filteredRows = React.useMemo(() => {
    return rows.filter((r) => {
      const designationTitle = r.designationName || r.name || String(r.designationId || '');
      if (search && !designationTitle.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      if (statusFilter) {
        const isEnabled = r.commissionEnabled === true;
        if (statusFilter === 'ACTIVE' && !isEnabled) return false;
        if (statusFilter === 'INACTIVE' && isEnabled) return false;
      }
      if (typeFilter && String(r.commissionType).toUpperCase() !== typeFilter.toUpperCase()) {
        return false;
      }
      return true;
    });
  }, [rows, search, statusFilter, typeFilter]);

  // Paginated rows
  const totalPages = Math.ceil(filteredRows.length / pageSize) || 1;
  const paginatedRows = React.useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    return filteredRows.slice(startIndex, startIndex + pageSize);
  }, [filteredRows, page, pageSize]);

  return (
    <div className={`rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-6 shadow-xs space-y-5 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            Designation Commission Settings
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Configure default commission rate, calculation basis, and active status for each company designation.
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
        <div className="sm:col-span-6 relative">
          <Search className="absolute left-3 top-3 size-4 text-slate-400 pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search designations by title or ID..."
            className="pl-9 h-10 text-xs sm:text-sm rounded-xl border-slate-200 focus-visible:ring-[#163A2E]"
          />
        </div>

        <div className="sm:col-span-3">
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#163A2E] cursor-pointer"
          >
            <option value="">All Calculation Types</option>
            <option value="PERCENTAGE">Percentage (%)</option>
            <option value="FIXED">Fixed Amount (₹)</option>
          </select>
        </div>

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

        <div className="sm:col-span-1 flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={load}
            disabled={loading}
            className="h-10 px-3 text-xs font-semibold border-slate-200 text-slate-700 hover:bg-[#E8F1EC] hover:text-[#163A2E] rounded-xl"
            title="Reload settings"
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

      {/* Table (Desktop/Tablet) and Cards (Mobile) */}
      <div className="space-y-4">
        {/* Contained Horizontal Scroll Table */}
        <div className="hidden sm:block w-full overflow-x-auto min-w-0 rounded-xl border border-slate-200/90 shadow-2xs">
          <table className="w-full text-left text-xs divide-y divide-slate-100">
            <thead className="bg-[#F7F9F8] text-[#527063] font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3.5">Designation</th>
                <th className="px-4 py-3.5">Calculation Type</th>
                <th className="px-4 py-3.5">Default Rate</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <RotateCw className="size-4 animate-spin text-[#163A2E]" />
                      <span>Loading designation commission settings…</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    <div className="max-w-xs mx-auto space-y-2">
                      <BadgePercent className="size-8 mx-auto text-slate-300" />
                      <p className="font-semibold text-slate-700">No designations found</p>
                      <p className="text-xs text-slate-400">
                        {search || statusFilter || typeFilter
                          ? 'No designations match your search filters.'
                          : 'No designation commission settings configured.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedRows.map((r) => {
                  const designationName = r.designationName || r.name || `Designation #${r.designationId || r.id}`;
                  const isEnabled = r.commissionEnabled === true;
                  return (
                    <tr key={r.designationId || r.id} className="hover:bg-[#F8FBF9] transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-[#163A2E]">
                            <Building className="size-3.5" />
                          </span>
                          <span className="font-semibold text-slate-900">{designationName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
                          {r.commissionType || 'PERCENTAGE'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {r.commissionRate != null
                          ? r.commissionType === 'FIXED'
                            ? `₹${r.commissionRate}`
                            : `${r.commissionRate}%`
                          : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={isEnabled ? 'active' : 'inactive'} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(r)}
                          className="h-7 text-xs border-slate-200 text-[#163A2E] hover:bg-[#E8F1EC]"
                        >
                          <Edit2 className="size-3 mr-1" /> Edit
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View: Designation Cards (sm:hidden) */}
        <div className="block sm:hidden space-y-3">
          {loading ? (
            <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-xs text-slate-500">
              <RotateCw className="size-4 animate-spin text-[#163A2E] mx-auto mb-2" />
              <span>Loading designation settings…</span>
            </div>
          ) : paginatedRows.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-xs text-slate-500 space-y-2">
              <BadgePercent className="size-6 mx-auto text-slate-300" />
              <p className="font-semibold text-slate-700">No designations found</p>
            </div>
          ) : (
            paginatedRows.map((r) => {
              const designationName = r.designationName || r.name || `Designation #${r.designationId || r.id}`;
              const isEnabled = r.commissionEnabled === true;
              return (
                <div
                  key={r.designationId || r.id}
                  className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-2xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-[#163A2E]">
                        <Building className="size-3.5" />
                      </span>
                      <h4 className="text-sm font-bold text-slate-900">{designationName}</h4>
                    </div>
                    <StatusBadge status={isEnabled ? 'active' : 'inactive'} />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Type</span>
                      <span className="font-medium text-slate-700">{r.commissionType || 'PERCENTAGE'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Rate</span>
                      <span className="font-bold text-[#163A2E]">
                        {r.commissionRate != null
                          ? r.commissionType === 'FIXED'
                            ? `₹${r.commissionRate}`
                            : `${r.commissionRate}%`
                          : '—'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(r)}
                      className="h-7 text-xs border-slate-200 text-[#163A2E] hover:bg-[#E8F1EC]"
                    >
                      <Edit2 className="size-3 mr-1" /> Edit Configuration
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 pt-1">
          <div className="flex items-center gap-3 self-start sm:self-auto">
            <span>
              Showing {filteredRows.length === 0 ? 0 : (page - 1) * pageSize + 1} to{' '}
              {Math.min(page * pageSize, filteredRows.length)} of {filteredRows.length} designations
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

      {/* Edit FormDrawer */}
      <FormDrawer
        open={Boolean(editing)}
        onOpenChange={(open) => {
          if (!open && !saving) setEditing(null);
        }}
        title={`Edit Commission: ${form.designationName}`}
        description="Configure standard payout rate, calculation method, and active state."
        loading={saving}
        onSubmit={handleSave}
        submitLabel="Save Setting"
      >
        <div className="space-y-4 text-xs sm:text-sm">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">Designation</Label>
            <Input disabled value={form.designationName} className="h-10 rounded-xl bg-slate-50" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">
              Calculation Type <span className="text-rose-500">*</span>
            </Label>
            <select
              value={form.commissionType}
              onChange={(e) => setForm((curr) => ({ ...curr, commissionType: e.target.value }))}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#163A2E] cursor-pointer"
            >
              <option value="PERCENTAGE">PERCENTAGE (%)</option>
              <option value="FIXED">FIXED (₹)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">
              Commission Rate ({form.commissionType === 'FIXED' ? '₹' : '%'}) <span className="text-rose-500">*</span>
            </Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              required
              value={form.commissionRate}
              onChange={(e) => setForm((curr) => ({ ...curr, commissionRate: e.target.value }))}
              placeholder="e.g. 5"
              className="h-10 rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">Status</Label>
            <select
              value={form.commissionEnabled ? 'ACTIVE' : 'INACTIVE'}
              onChange={(e) =>
                setForm((curr) => ({
                  ...curr,
                  commissionEnabled: e.target.value === 'ACTIVE',
                }))
              }
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#163A2E] cursor-pointer"
            >
              <option value="ACTIVE">Active (Commission enabled)</option>
              <option value="INACTIVE">Inactive (Commission disabled)</option>
            </select>
          </div>
        </div>
      </FormDrawer>
    </div>
  );
}
