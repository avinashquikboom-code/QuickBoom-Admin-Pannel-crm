'use client';

import * as React from 'react';
import { listFrom } from '@/modules/hrm/hrm-api';
import { Button } from '@/components/ui/button';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import { faDownload } from '@fortawesome/free-solid-svg-icons';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export const PAGE_SIZES = [10, 25, 50, 100];

export function rowsOf(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  return listFrom(payload);
}

export function pageOf(payload, fallback) {
  return payload?.pagination || payload?.meta || payload?.data?.pagination || fallback;
}

export function envelope(payload) {
  const nested = payload?.data;
  if (nested && !Array.isArray(nested) && (Array.isArray(nested.items) || nested.stats || nested.meta || nested.fetched !== undefined)) {
    return nested;
  }
  return payload || {};
}

export function downloadCsv(name, columns, rows) {
  const header = columns.map((column) => column.label).join(',');
  const body = rows
    .map((row) => columns.map((column) => `"${String(row[column.key] ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([`${header}\n${body}`], { type: 'text/csv' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = name;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function Pager({ page, pages, limit, total, onPage, onLimit }) {
  return (
    <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 text-sm text-[#718078]">
      <span className="min-w-0 truncate">{total} records</span>
      <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
        <select
          value={limit}
          onChange={(event) => onLimit(Number(event.target.value))}
          aria-label="Results per page"
          className="h-9 max-w-full rounded-md border border-[#E2E8E5] bg-white px-2 text-sm"
        >
          {PAGE_SIZES.map((size) => (
            <option key={size} value={size}>
              {size} / page
            </option>
          ))}
        </select>
        <Button type="button" variant="outline" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          Previous
        </Button>
        <span className="whitespace-nowrap">
          {page} / {pages}
        </span>
        <Button type="button" variant="outline" disabled={page >= pages} onClick={() => onPage(page + 1)}>
          Next
        </Button>
      </div>
    </div>
  );
}

export function Field({ label, hint, error, children, required }) {
  return (
    <div className="min-w-0 space-y-1">
      <Label className="text-xs font-semibold text-slate-700">
        {label}
        {required ? <span className="text-rose-500"> *</span> : null}
      </Label>
      {children}
      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
      {hint && !error ? <p className="text-[11px] text-slate-500">{hint}</p> : null}
    </div>
  );
}

export function TemplateTable({ loading, error, rows, empty, columns, render, className }) {
  return (
    <div className={cn('min-w-0 overflow-x-auto rounded-xl border border-[#E2E8E5] bg-white', className)}>
      <table className="min-w-full text-left text-sm text-[#172B24]">
        <thead className="bg-[#F7F9F8] text-[#718078]">
          <tr>
            {columns.map((column) => (
              <th key={column} className="px-3 py-3 text-xs font-medium">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td className="px-3 py-8 text-[#718078]" colSpan={columns.length}>
                Loading templates…
              </td>
            </tr>
          ) : null}
          {!loading && error ? (
            <tr>
              <td className="px-3 py-8 text-red-600" colSpan={columns.length}>
                {error}
              </td>
            </tr>
          ) : null}
          {!loading && !error && rows.length === 0 ? (
            <tr>
              <td className="px-3 py-8 text-[#718078]" colSpan={columns.length}>
                {empty}
              </td>
            </tr>
          ) : null}
          {!loading && !error ? rows.map(render) : null}
        </tbody>
      </table>
    </div>
  );
}

export function StatusBadge({ row }) {
  const archived = Boolean(row.deletedAt);
  const active = !archived && row.isActive !== false;
  const label = archived ? 'Archived' : active ? 'Active' : 'Inactive';
  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center rounded-full px-2.5 py-1 text-[11px] font-semibold',
        archived && 'bg-amber-50 text-amber-800',
        !archived && active && 'bg-emerald-50 text-emerald-700',
        !archived && !active && 'bg-slate-100 text-slate-600',
      )}
    >
      {label}
    </span>
  );
}

export function TemplateToolbar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  statuses,
  onExport,
  onClear,
  extra,
  searchPlaceholder = 'Search by name, code, or subject',
}) {
  return (
    <div className="flex min-w-0 w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <Input
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder={searchPlaceholder}
        className="h-10 w-full min-w-0 sm:max-w-md"
        aria-label="Search templates"
      />
      <div className="flex min-w-0 w-full flex-col gap-2 xs:flex-row sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
        <select
          value={status}
          onChange={(event) => onStatusChange(event.target.value)}
          aria-label="Status filter"
          className="h-10 w-full min-w-0 rounded-md border border-[#E2E8E5] bg-white px-3 text-sm text-[#172B24] sm:w-auto"
        >
          {statuses.map((item) => (
            <option key={item} value={item}>
              {item === 'ALL' ? 'All statuses' : item}
            </option>
          ))}
        </select>
        <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={onClear}>
          Clear filters
        </Button>
        <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={onExport}>
          <FontAwesomeIcon icon={faDownload} className="mr-2" />
          Export CSV
        </Button>
        {extra}
      </div>
    </div>
  );
}
