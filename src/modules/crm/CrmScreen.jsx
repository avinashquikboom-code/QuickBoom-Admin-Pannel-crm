'use client';

import * as React from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/common/DataTable';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { FormDrawer } from '@/components/common/drawers/FormDrawer';
import { HrmGap, HrmNotice, HrmStats } from '@/modules/hrm/HrmNotice';
import { crmError } from './crm-api';

export function CrmScreen({ title, description, actionLabel, canCreate = true, load, columns, stats, filters = [], blank, renderForm, onSave, rowActions, detail, gap, below, headerActions, extraHeaderActions, enableSelection = false, onSelectionChange, toolbar, refreshToken = 0, toForm }) {
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
  const [selectedRows, setSelectedRows] = React.useState([]);

  const loadRef = React.useRef(load);
  loadRef.current = load;
  React.useEffect(() => {
    let active = true;
    setLoading(true);
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

  return (
    <div className="mx-auto w-full max-w-7xl min-w-0 space-y-4 sm:space-y-6 overflow-x-hidden">
      <PageHeader title={title} description={description} actions={headerActions || <div className="flex flex-wrap gap-2">{canCreate && onSave ? <Button onClick={() => { setEditing(null); setForm(blank || {}); setOpen(true); }}>{actionLabel || 'Create'}</Button> : null}{extraHeaderActions}</div>} />
      {stats && <HrmStats items={stats(payload)} />}
      {gap && <HrmGap title={gap.title} detail={gap.detail} />}
      <div className="grid grid-cols-1 gap-2.5 rounded-xl border border-slate-200 bg-white p-3 sm:grid-cols-2 lg:grid-cols-4 w-full min-w-0">
        <Input value={query.search} onChange={(event) => setQuery({ ...query, search: event.target.value, page: 1 })} placeholder={`Search ${title.toLowerCase()}`} />
        {filters.map((filter) => filter.type === 'date' ? <Input key={filter.key} type="date" aria-label={filter.label} value={query[filter.key] || ''} onChange={(event) => setQuery({ ...query, [filter.key]: event.target.value, page: 1 })} /> : <select key={filter.key} aria-label={filter.label} className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm" value={query[filter.key] || ''} onChange={(event) => setQuery({ ...query, [filter.key]: event.target.value, page: 1 })}><option value="">{filter.label}</option>{(filter.options || []).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>)}
        <Button variant="outline" onClick={() => setRefresh((value) => value + 1)}>Refresh</Button>
      </div>
      <HrmNotice loading={loading} error={error} empty={!loading && !error && rows.length === 0 ? `No ${title.toLowerCase()} match these filters.` : ''} onRetry={() => setRefresh((value) => value + 1)}>
        {below && <div className="mb-4">{below(rows, payload)}</div>}
        {toolbar && <div className="mb-4">{toolbar({ query, selected: selectedRows, reload: () => setRefresh((value) => value + 1), payload })}</div>}
        <div className="w-full overflow-x-auto min-w-0">
          <DataTable
            hideToolbar
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
            columns={columns}
            data={rows}
            label={title}
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
      <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2"><Button variant="outline" size="sm" disabled={(query.page || 1) <= 1} onClick={() => setQuery({ ...query, page: query.page - 1 })}>Previous</Button><span className="self-center text-xs text-slate-500">Page {payload.pagination?.page || query.page}</span><Button variant="outline" size="sm" disabled={(query.page || 1) >= (payload.pagination?.totalPages || 1)} onClick={() => setQuery({ ...query, page: (query.page || 1) + 1 })}>Next</Button></div>
      <FormDrawer open={open} onOpenChange={setOpen} title={editing ? `Edit ${title}` : actionLabel || `Create ${title}`} description="Fields match the existing API." onSubmit={submit} loading={saving}>
        {renderForm && renderForm(form, setForm)}
      </FormDrawer>
      <FormDrawer open={Boolean(selected)} onOpenChange={(next) => { if (!next) setSelected(null); }} title={title} description="Record returned by the API" showFooter={false}>
        {selected && detail ? detail(selected) : selected && <pre className="whitespace-pre-wrap text-xs">{JSON.stringify(selected, null, 2)}</pre>}
      </FormDrawer>
    </div>
  );
}
