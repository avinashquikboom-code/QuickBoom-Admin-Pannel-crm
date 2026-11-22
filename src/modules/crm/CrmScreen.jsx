'use client';

import * as React from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/common/DataTable';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { FormDrawer } from '@/components/common/drawers/FormDrawer';
import { HrmGap, HrmNotice, HrmStats } from '@/modules/hrm/HrmNotice';
import { crmError } from './crm-api';
import { RotateCw, Search, SlidersHorizontal } from 'lucide-react';

export function CrmScreen({ hideTitleCard = false, title, description, actionLabel, canCreate = true, load, columns, stats, filters = [], blank, renderForm, onSave, rowActions, detail, gap, below, headerActions, extraHeaderActions, enableSelection = false, onSelectionChange, toolbar, refreshToken = 0, toForm, appearance = 'default', collapsibleFilters = false, emptyState }) {
  const [rows, setRows] = React.useState([]);
  const [payload, setPayload] = React.useState({});
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [query, setQuery] = React.useState({ search: '', page: 1 });
  const [refresh, setRefresh] = React.useState(0);
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState(blank || {});
  const [editing, setEditing] = React.useState(null);
  const [selected, setSelected] = React.useState(null);
  const [saving, setSaving] = React.useState(false);
  const [selectionResetToken, setSelectionResetToken] = React.useState(0);
  const [selectedRows, setSelectedRows] = React.useState([]);
  const isCustomerAppearance = appearance === 'customers';
  const isContactAppearance = appearance === 'contacts';
  const isCompaniesAppearance = appearance === 'companies';
  const isVisitsAppearance = appearance === 'visits';
  const isCaptureAppearance = appearance === 'data-capture';
  const isStyledAppearance = isCustomerAppearance || isContactAppearance || isCompaniesAppearance || isVisitsAppearance || isCaptureAppearance;
  const [filtersExpanded, setFiltersExpanded] = React.useState(false);

  const loadRef = React.useRef(load);
  loadRef.current = load;
  const rowsRef = React.useRef(rows);
  rowsRef.current = rows;
  React.useEffect(() => {
    let active = true;
    if (rowsRef.current.length === 0) setLoading(true);
    setSelectedRows([]);
    setSelectionResetToken((value) => value + 1);
    loadRef.current(query).then((result) => {
      if (!active) return;
      setRows(result.rows || []);
      setPayload(result);
      setError('');
    }).catch((err) => { if (active) setError(crmError(err)); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [query, refresh, refreshToken]);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await onSave(form, editing);
      setOpen(false);
      setRefresh((value) => value + 1);
    } catch (err) {
      setError(crmError(err));
    } finally {
      setSaving(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm(blank || {});
    setOpen(true);
  };
  const resolvedEmptyState = typeof emptyState === 'function'
    ? emptyState({ onAdd: openCreate })
    : emptyState;

  return (
    <div className={`max-w-none w-full min-w-0 pb-28 overflow-x-hidden ${isCustomerAppearance ? 'space-y-5 sm:space-y-6' : 'space-y-4 sm:space-y-6'}`}>
      {hideTitleCard ? <div className="flex flex-wrap justify-end gap-2">{headerActions || <div className="flex flex-wrap gap-2">{canCreate && onSave ? <Button onClick={() => { setEditing(null); setForm(blank || {}); setOpen(true); }}>{actionLabel || 'Create'}</Button> : null}{extraHeaderActions}</div>}</div> : <PageHeader title={title} description={description} actions={headerActions || <div className="flex flex-wrap gap-2">{canCreate && onSave ? <Button onClick={() => { setEditing(null); setForm(blank || {}); setOpen(true); }}>{actionLabel || 'Create'}</Button> : null}{extraHeaderActions}</div>} />}
      {stats && <HrmStats items={stats(payload)} layout={isContactAppearance || isCompaniesAppearance || isVisitsAppearance || isCaptureAppearance ? 'mobile-stack' : 'default'} />}
      {(() => { const item = typeof gap === 'function' ? gap(rows) : gap; return item ? <HrmGap title={item.title} detail={item.detail} /> : null; })()}
      <div className={`grid w-full min-w-0 grid-cols-1 gap-2.5 border bg-white sm:grid-cols-2 ${isStyledAppearance ? 'rounded-2xl border-[#E2E8E5] p-3.5 shadow-sm' : 'rounded-xl border-slate-200 p-3 lg:grid-cols-4'} ${isCustomerAppearance ? 'lg:grid-cols-[minmax(0,1fr)_240px_auto] lg:items-center' : ''} ${isContactAppearance ? 'lg:grid-cols-[minmax(0,1fr)_200px_200px_auto] lg:items-center' : ''} ${isCompaniesAppearance ? 'lg:grid-cols-[minmax(0,1fr)_220px_auto] lg:items-center' : ''} ${isVisitsAppearance ? 'lg:grid-cols-[minmax(0,1fr)_180px_180px_auto] lg:items-center' : ''} ${isCaptureAppearance ? 'lg:grid-cols-[minmax(0,1fr)_180px_180px_auto] lg:items-center' : ''}`}>
        <div className={isStyledAppearance ? 'relative min-w-0' : 'min-w-0'}>
          {isStyledAppearance && <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />}
          <Input className={isStyledAppearance ? 'h-10 rounded-xl border-slate-200 bg-slate-50/70 pl-10 text-sm focus-visible:bg-white' : undefined} value={query.search} onChange={(event) => setQuery({ ...query, search: event.target.value, page: 1 })} placeholder={`Search ${title.toLowerCase()}${isContactAppearance ? ' by name, email, phone or company' : isCompaniesAppearance ? ' by name, domain, email or phone' : isVisitsAppearance ? ' by customer, company or location' : isCaptureAppearance ? ' by business name, phone, website or Place ID' : ''}`} />
        </div>
        {collapsibleFilters && <Button type="button" variant="outline" className="h-10 rounded-xl border-slate-200 md:hidden" onClick={() => setFiltersExpanded((value) => !value)}><SlidersHorizontal className="mr-2 size-4" />{filtersExpanded ? 'Hide filters' : 'Filters'}</Button>}
        <div className={collapsibleFilters ? `grid min-w-0 grid-cols-1 gap-2.5 sm:grid-cols-2 ${filtersExpanded ? '' : 'hidden'} md:contents` : 'contents'}>
          {filters.map((filter) => filter.type === 'date' ? <Input key={filter.key} type="date" aria-label={filter.label} className={isStyledAppearance ? 'h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100' : undefined} value={query[filter.key] || ''} onChange={(event) => setQuery({ ...query, [filter.key]: event.target.value, page: 1 })} /> : <select key={filter.key} aria-label={filter.label} className={isStyledAppearance ? 'h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100' : 'h-9 rounded-md border border-slate-200 bg-white px-2 text-sm'} value={query[filter.key] || ''} onChange={(event) => setQuery({ ...query, [filter.key]: event.target.value, page: 1 })}><option value="">{filter.label}</option>{(filter.options || []).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>)}
        </div>
        <Button variant="outline" className={isStyledAppearance ? 'h-10 rounded-xl border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 hover:border-emerald-200 hover:bg-emerald-50' : undefined} onClick={() => setRefresh((value) => value + 1)}>{isStyledAppearance && <RotateCw className="mr-2 size-4" aria-hidden="true" />}Refresh</Button>
      </div>
      <HrmNotice loading={loading} error={error} empty={!loading && !error && rows.length === 0 ? (resolvedEmptyState || `No ${title.toLowerCase()} match these filters.`) : ''} onRetry={() => setRefresh((value) => value + 1)}>
        {below && <div className="mb-4">{below(rows, payload)}</div>}
        {toolbar && <div className="mb-4">{toolbar({ query, selected: selectedRows, clearSelection: () => { setSelectedRows([]); setSelectionResetToken((value) => value + 1); }, reload: () => setRefresh((value) => value + 1), payload })}</div>}
        <div className="w-full overflow-x-auto min-w-0">
          <DataTable
            hideToolbar
            selectionResetToken={selectionResetToken}
            enableRowSelection={enableSelection}
            onSelectionChange={(rows) => {
              setSelectedRows((current) => {
                const next = rows.map((row) => row.id).join(',');
                const previous = current.map((row) => row.id).join(',');
                return next === previous ? current : rows;
              });
              onSelectionChange?.(rows);
            }}
            pageSize={Math.max(rows.length, 1)}
            columns={typeof columns === 'function' ? columns({ open: setSelected }) : columns}
            data={rows}
            label={title}
            className={isStyledAppearance ? 'rounded-2xl border-[#E2E8E5] shadow-sm [&_thead_tr]:bg-[#F3F8F5] [&_tbody_tr:hover]:bg-[#F8FBF9]' : undefined}
            rowActions={[
              ...(detail ? [{ label: 'View', onSelect: setSelected }] : []),
              ...(onSave
                ? [
                    {
                      label: 'Edit',
                      onSelect: (row) => {
                        setEditing(row.id);
                        setForm({ ...(blank || {}), ...row, ...(toForm ? toForm(row) : {}) });
                        setOpen(true);
                      },
                    },
                  ]
                : []),
              ...(rowActions ? rowActions(setRefresh) : []),
            ]}
          />
        </div>
      </HrmNotice>
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
        <div>
          {payload.pagination?.total !== undefined && (
            <span>
              Showing {rows.length === 0 ? 0 : ((payload.pagination?.page || query.page || 1) - 1) * (payload.pagination?.limit || 20) + 1} to {Math.min((payload.pagination?.page || query.page || 1) * (payload.pagination?.limit || 20), payload.pagination?.total || 0)} of {payload.pagination?.total} records
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 rounded-lg" disabled={(query.page || 1) <= 1} onClick={() => setQuery({ ...query, page: (query.page || 1) - 1 })}>Previous</Button>
          <span className="text-xs font-medium text-slate-600">Page {payload.pagination?.page || query.page || 1} of {payload.pagination?.totalPages || 1}</span>
          <Button variant="outline" size="sm" className="h-8 rounded-lg" disabled={(query.page || 1) >= (payload.pagination?.totalPages || 1)} onClick={() => setQuery({ ...query, page: (query.page || 1) + 1 })}>Next</Button>
        </div>
      </div>
      <FormDrawer open={open} onOpenChange={setOpen} title={editing ? `Edit ${title}` : actionLabel || `Create ${title}`} description="Fields match the existing API." onSubmit={submit} loading={saving}>
        {renderForm && renderForm(form, setForm)}
      </FormDrawer>
      <FormDrawer open={Boolean(selected)} onOpenChange={(next) => { if (!next) setSelected(null); }} title={title} description="Record returned by the API" showFooter={false}>
        {selected && detail ? detail(selected) : selected && <pre className="whitespace-pre-wrap text-xs">{JSON.stringify(selected, null, 2)}</pre>}
      </FormDrawer>
    </div>
  );
}
