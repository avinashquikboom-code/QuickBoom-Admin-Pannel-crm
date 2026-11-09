'use client';

import * as React from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SegmentedTabs } from '@/components/ui/segmented-tabs';
import { KpiGrid } from '@/components/common/KpiCard';
import { FormDrawer } from '@/components/common/drawers/FormDrawer';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { DataTable, DataTableColumnHeader, DataTableRowActions } from '@/components/data-table';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import { faDownload, faPlus, faRotateRight } from '@fortawesome/free-solid-svg-icons';
import { toast } from '@/hooks/use-toast';
import { getSectionConfig } from '@/config/admin-sections';
import { loadOffices } from '@/modules/hrm/hrm-api';
import {
  MASTER_MODULES,
  downloadCsv,
  loadDepartments,
  loadDesignation,
  loadDesignations,
  loadLeavePolicyScreen,
  loadMasterItems,
  masterError,
  removeDesignation,
  removeMasterItem,
  saveDesignation,
  saveLeavePolicy,
  saveMasterItem,
} from './master-api';

const LIVE = ['employee-types', 'designations', 'leave-policies', 'work-types', 'loan-types', 'payment-methods'];

export function isLiveMasterSlug(slug) {
  return LIVE.includes(slug);
}

export function MasterManagement({ slug }) {
  const config = getSectionConfig(slug);
  if (!config) return null;
  if (slug === 'designations') return <DesignationsScreen config={config} />;
  if (slug === 'leave-policies') return <LeavePolicyScreen config={config} />;
  return <MasterCatalog config={config} slug={slug} />;
}

function useDebounced(value, delay) {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function StatusBadge({ status }) {
  const active = status === 'Active';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${active ? 'border-emerald-200/80 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-100 text-slate-600'}`}>
      <span className={`size-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
      {status}
    </span>
  );
}

function RecordCards({ rows, config, metric, onView, onEdit, onDelete }) {
  if (!rows.length) return null;
  return (
    <div className="grid gap-3 md:hidden">
      {rows.map((row) => (
        <article key={row.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">{row.name}</p>
              <p className="mt-1 font-mono text-[11px] text-slate-500">{row.code || '—'}</p>
            </div>
            <StatusBadge status={row.status} />
          </div>
          <p className="mt-2 line-clamp-2 text-xs text-slate-500">{row.description || 'No description'}</p>
          <p className="mt-2 text-xs text-slate-600">{metric(row)}</p>
          <div className="mt-3 flex gap-2">
            <Button type="button" variant="outline" className="h-9 flex-1 text-xs" onClick={() => onView(row)}>View</Button>
            <Button type="button" variant="outline" className="h-9 flex-1 text-xs" onClick={() => onEdit(row)}>Edit</Button>
            <Button type="button" variant="outline" className="h-9 flex-1 text-xs text-rose-600" onClick={() => onDelete(row)}>Delete</Button>
          </div>
        </article>
      ))}
    </div>
  );
}

function MasterCatalog({ slug, config }) {
  const module = MASTER_MODULES[slug];
  const [rows, setRows] = React.useState([]);
  const [extra, setExtra] = React.useState({});
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [tab, setTab] = React.useState('all');
  const [query, setQuery] = React.useState('');
  const [refresh, setRefresh] = React.useState(0);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [editing, setEditing] = React.useState(null);
  const [viewing, setViewing] = React.useState(null);
  const [pendingDelete, setPendingDelete] = React.useState(null);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState(emptyMasterForm());
  const debouncedQuery = useDebounced(query, 300);

  const load = React.useCallback(() => {
    let active = true;
    setLoading(true);
    setError('');
    loadMasterItems(slug)
      .then((result) => {
        if (!active) return;
        setRows(result.rows);
        setExtra(result.extra);
      })
      .catch((err) => { if (active) setError(masterError(err)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [slug]);

  React.useEffect(() => load(), [load, refresh]);

  const filtered = React.useMemo(() => {
    const needle = debouncedQuery.trim().toLowerCase();
    return rows.filter((row) => {
      if (tab === 'active' && row.status !== 'Active') return false;
      if (tab === 'inactive' && row.status !== 'Inactive') return false;
      if (tab === 'archived') return false;
      if (!needle) return true;
      return [row.name, row.code, row.category, row.description].join(' ').toLowerCase().includes(needle);
    });
  }, [rows, tab, debouncedQuery]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyMasterForm());
    setDrawerOpen(true);
  };
  const openEdit = React.useCallback((row) => {
    setEditing(row);
    setForm({
      name: row.name || '',
      code: row.code || '',
      category: row.category || '',
      description: row.description || '',
      sortOrder: row.sortOrder ?? 0,
      isActive: row.isActive !== false,
      maxMonths: row.maxMonths ?? 12,
      interestRate: row.interestRate ?? 0,
      requiresApproval: row.requiresApproval !== false,
      mode: row.mode || 'LIVE',
    });
    setDrawerOpen(true);
  }, []);

  const save = async (event) => {
    event.preventDefault();
    if (saving) return;
    if (!form.name.trim() || !form.code.trim()) {
      toast.error('Name and code are required');
      return;
    }
    setSaving(true);
    try {
      await saveMasterItem(slug, form, editing);
      toast.success(editing ? `${config.singular} updated` : `${config.singular} created`);
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
      await removeMasterItem(pendingDelete.id);
      toast.success(`${config.singular} deleted`);
      setPendingDelete(null);
      setRefresh((value) => value + 1);
    } catch (err) {
      toast.error(masterError(err));
    } finally {
      setSaving(false);
    }
  };

  const exportRows = () => {
    if (!filtered.length) {
      toast.error('There are no records to export');
      return;
    }
    downloadCsv(`${slug}.csv`, filtered.map((row) => ({
      name: row.name,
      code: row.code,
      category: row.category,
      description: row.description || '',
      status: row.status,
      count: module.metricKey ? row[module.metricKey] : '',
      interestRate: row.interestRate,
      maxMonths: row.maxMonths,
      mode: row.mode,
      transactions: row.transactionsCount ?? '',
    })));
  };

  const columns = React.useMemo(() => [
    nameColumn(config),
    codeColumn(),
    {
      accessorKey: 'category',
      header: ({ column }) => <DataTableColumnHeader column={column} title={module.categoryLabel} />,
      cell: ({ row }) => <span className="text-xs text-slate-700">{row.original.category || '—'}</span>,
    },
    metricColumn(slug, module),
    statusColumn(),
    actionsColumn(setViewing, openEdit, setPendingDelete),
  ], [config, module, openEdit, slug]);

  return (
    <ScreenFrame
      config={config}
      onRefresh={() => setRefresh((value) => value + 1)}
      onExport={exportRows}
      onCreate={openCreate}
      createLabel={`Add ${config.singular}`}
      kpis={[
        { title: `Total ${config.title}`, value: rows.length, description: 'Returned by the master API' },
        { title: 'Active', value: rows.filter((row) => row.status === 'Active').length, description: 'isActive true' },
        { title: 'Inactive', value: rows.filter((row) => row.status === 'Inactive').length, description: 'isActive false' },
        { title: module.metricLabel, value: metricTotal(slug, rows, extra), description: 'From the list response' },
      ]}
      tab={tab}
      onTab={setTab}
      counts={{ all: rows.length, active: rows.filter((row) => row.status === 'Active').length, inactive: rows.filter((row) => row.status === 'Inactive').length }}
      query={query}
      onQuery={setQuery}
      placeholder={`Search ${config.title.toLowerCase()}`}
      notice={catalogNotice(slug)}
    >
      {error ? <ErrorState message={error} onRetry={() => setRefresh((value) => value + 1)} /> : null}
      {!error && !loading && filtered.length === 0 ? <EmptyState query={debouncedQuery} tab={tab} title={config.title} /> : null}
      <RecordCards rows={filtered} config={config} metric={(row) => catalogMetricText(slug, row)} onView={setViewing} onEdit={openEdit} onDelete={setPendingDelete} />
      <div className={filtered.length ? 'hidden md:block' : 'hidden'}>
        <DataTable columns={columns} data={filtered} hideSearch isLoading={loading} emptyState="" pageSize={10} />
      </div>
      <ItemDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title={editing ? `Edit ${config.singular}` : `Create ${config.singular}`}
        description="Code must be unique for this master type. Counts are calculated by the server."
        saving={saving}
        onSubmit={save}
        submitLabel={editing ? 'Save changes' : `Create ${config.singular}`}
      >
        <NameCodeFields form={form} setForm={setForm} />
        <Field label={module.categoryLabel}>
          <Input value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className="h-9 text-xs" />
        </Field>
        {slug === 'loan-types' ? <LoanFields form={form} setForm={setForm} /> : null}
        {slug === 'payment-methods' ? <PaymentFields form={form} setForm={setForm} /> : null}
        <Field label="Sort order">
          <Input type="number" value={form.sortOrder} onChange={(event) => setForm({ ...form, sortOrder: event.target.value })} className="h-9 text-xs" />
        </Field>
        <StatusField form={form} setForm={setForm} />
        <DescriptionField form={form} setForm={setForm} />
      </ItemDrawer>
      <ViewDrawer record={viewing} onClose={() => setViewing(null)} onEdit={openEdit} config={config} lines={viewing ? catalogViewLines(slug, viewing) : []} />
      <ConfirmDialog open={Boolean(pendingDelete)} onOpenChange={(open) => { if (!open) setPendingDelete(null); }} title={`Delete ${config.singular}?`} description={`Delete “${pendingDelete?.name || ''}”? This calls the master delete endpoint.`} confirmLabel="Delete" variant="destructive" onConfirm={confirmDelete} />
    </ScreenFrame>
  );
}

function DesignationsScreen({ config }) {
  const [rows, setRows] = React.useState([]);
  const [meta, setMeta] = React.useState({ total: 0, page: 1, totalPages: 1 });
  const [departments, setDepartments] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [tab, setTab] = React.useState('all');
  const [query, setQuery] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [refresh, setRefresh] = React.useState(0);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [editing, setEditing] = React.useState(null);
  const [viewing, setViewing] = React.useState(null);
  const [pendingDelete, setPendingDelete] = React.useState(null);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState(emptyDesignationForm());
  const debouncedQuery = useDebounced(query, 350);

  React.useEffect(() => { setPage(1); }, [debouncedQuery, tab]);

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    if (tab === 'archived') {
      setRows([]);
      setMeta({ total: 0, page: 1, totalPages: 1 });
      setLoading(false);
      setError('');
      return undefined;
    }
    const params = { page, limit: 20, search: debouncedQuery || undefined };
    if (tab === 'active') params.isActive = true;
    if (tab === 'inactive') params.isActive = false;
    loadDesignations(params)
      .then((result) => {
        if (!active) return;
        setRows(result.rows);
        setMeta(result.meta);
      })
      .catch((err) => { if (active) setError(masterError(err)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [debouncedQuery, page, refresh, tab]);

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
      setViewing((current) => (current?.id === row.id ? { ...current, ...detail, status: detail.isActive === false ? 'Inactive' : 'Active' } : current));
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
      toast.success(editing ? 'Designation updated' : 'Designation created');
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
      toast.success('Designation deleted');
      setPendingDelete(null);
      setRefresh((value) => value + 1);
    } catch (err) {
      toast.error(masterError(err));
    } finally {
      setSaving(false);
    }
  };

  const columns = React.useMemo(() => [
    nameColumn(config),
    codeColumn(),
    {
      accessorKey: 'departmentName',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Department" />,
      cell: ({ row }) => <span className="text-xs">{row.original.departmentName || 'All departments'}</span>,
    },
    {
      accessorKey: 'level',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Level" />,
      cell: ({ row }) => <span className="text-xs font-semibold">{row.original.level ?? '—'}</span>,
    },
    {
      accessorKey: 'employeesCount',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Employees" />,
      cell: ({ row }) => <span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-bold">{row.original.employeesCount ?? 0}</span>,
    },
    statusColumn(),
    actionsColumn(setViewing, openEdit, setPendingDelete),
  ], [config]);

  const total = Number(meta.total ?? rows.length);
  const totalPages = Number(meta.totalPages || 1);

  return (
    <ScreenFrame
      config={config}
      loading={loading}
      error={error}
      onRefresh={() => setRefresh((value) => value + 1)}
      onExport={() => rows.length ? downloadCsv('designations.csv', rows.map((row) => ({
        name: row.name, code: row.code, department: row.departmentName, level: row.level, employees: row.employeesCount, status: row.status, description: row.description || '',
      }))) : toast.error('There are no records to export')}
      onCreate={() => { setEditing(null); setForm(emptyDesignationForm()); setDrawerOpen(true); }}
      createLabel="Add Designation"
      kpis={[
        { title: 'Matching designations', value: total, description: 'Count from the designations API' },
        { title: 'On this page', value: rows.length, description: `Page ${page}` },
        { title: 'Active on this page', value: rows.filter((row) => row.status === 'Active').length, description: 'Current response' },
        { title: 'Employees on this page', value: rows.reduce((sum, row) => sum + (Number(row.employeesCount) || 0), 0), description: 'Assigned employee counts' },
      ]}
      tab={tab}
      onTab={setTab}
      counts={{ all: tab === 'all' ? total : '—', active: tab === 'active' ? total : '—', inactive: tab === 'inactive' ? total : '—' }}
      query={query}
      onQuery={setQuery}
      placeholder="Search name, code, or description"
      notice="Hierarchy level is the designation level field. There is no separate grade band, and the API has no archive state. Sorting is level, then name. Export downloads the current page."
    >
      {error ? <ErrorState message={error} onRetry={() => setRefresh((value) => value + 1)} /> : null}
      {!error && !loading && rows.length === 0 ? <EmptyState query={debouncedQuery} tab={tab} title="Designations" /> : null}
      <RecordCards
        rows={rows}
        config={config}
        metric={(row) => `${row.departmentName || 'All departments'} · level ${row.level ?? '—'} · ${row.employeesCount ?? 0} employees`}
        onView={setViewing}
        onEdit={openEdit}
        onDelete={setPendingDelete}
      />
      <div className={rows.length ? 'hidden md:block' : 'hidden'}>
        <DataTable columns={columns} data={rows} hideSearch isLoading={loading} emptyState="" pageSize={20} />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
        <span>Page {page} of {totalPages} · {total} records</span>
        <div className="flex gap-2">
          <Button type="button" variant="outline" className="h-9" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</Button>
          <Button type="button" variant="outline" className="h-9" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)}>Next</Button>
        </div>
      </div>
      <ItemDrawer open={drawerOpen} onOpenChange={setDrawerOpen} title={editing ? 'Edit designation' : 'Create designation'} description="Department options come from the departments API." saving={saving} onSubmit={save} submitLabel={editing ? 'Save changes' : 'Create designation'}>
        <NameCodeFields form={form} setForm={setForm} />
        <Field label="Department">
          <Select value={form.departmentId || 'none'} onValueChange={(value) => setForm({ ...form, departmentId: value === 'none' ? '' : value })}>
            <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="All departments" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">All departments</SelectItem>
              {departments.map((department) => <SelectItem key={department.id} value={String(department.id)}>{department.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Hierarchy level">
          <Input type="number" min="1" value={form.level} onChange={(event) => setForm({ ...form, level: event.target.value })} className="h-9 text-xs" />
        </Field>
        <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
          <input type="checkbox" checked={form.crmMobileAccess} onChange={(event) => setForm({ ...form, crmMobileAccess: event.target.checked })} />
          CRM mobile access
        </label>
        <StatusField form={form} setForm={setForm} />
        <DescriptionField form={form} setForm={setForm} />
      </ItemDrawer>
      <ViewDrawer record={viewing} onClose={() => setViewing(null)} onEdit={openEdit} config={config} lines={viewing ? [
        ['Code', viewing.code],
        ['Department', viewing.departmentName || 'All departments'],
        ['Level', viewing.level],
        ['Employees', viewing.employeesCount],
        ['CRM mobile', viewing.crmMobileAccess ? 'Yes' : 'No'],
        ['Status', viewing.status],
      ] : []} />
      <ConfirmDialog open={Boolean(pendingDelete)} onOpenChange={(open) => { if (!open) setPendingDelete(null); }} title="Delete designation?" description={`Delete “${pendingDelete?.name || ''}”? Assigned employees may cause the server to deactivate it instead.`} confirmLabel="Delete" variant="destructive" onConfirm={confirmDelete} />
    </ScreenFrame>
  );
}

function LeavePolicyScreen({ config }) {
  const [policy, setPolicy] = React.useState(null);
  const [persisted, setPersisted] = React.useState(false);
  const [types, setTypes] = React.useState([]);
  const [offices, setOffices] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [query, setQuery] = React.useState('');
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState(emptyLeaveForm());
  const [refresh, setRefresh] = React.useState(0);
  const debouncedQuery = useDebounced(query, 300);

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    loadLeavePolicyScreen()
      .then((result) => {
        if (!active) return;
        setPolicy(result.policy);
        setPersisted(result.persisted);
        setTypes(result.types || result.leaveTypes || []);
      })
      .catch((err) => { if (active) setError(masterError(err)); })
      .finally(() => { if (active) setLoading(false); });
    loadOffices().then(setOffices).catch(() => setOffices([]));
    return () => { active = false; };
  }, [refresh]);

  const visibleTypes = types.filter((type) => {
    const needle = debouncedQuery.trim().toLowerCase();
    if (!needle) return true;
    return `${type.name} ${type.code}`.toLowerCase().includes(needle);
  });

  const edit = () => {
    setForm(leaveForm(policy));
    setDrawerOpen(true);
  };

  const save = async (event) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      await saveLeavePolicy(form);
      toast.success(persisted ? 'Leave policy updated' : 'Leave policy saved');
      setDrawerOpen(false);
      setRefresh((value) => value + 1);
    } catch (err) {
      toast.error(masterError(err));
    } finally {
      setSaving(false);
    }
  };

  const columns = React.useMemo(() => [
    { accessorKey: 'name', header: ({ column }) => <DataTableColumnHeader column={column} title="Leave type" />, cell: ({ row }) => <span className="font-semibold">{row.original.name}</span> },
    codeColumn(),
    { accessorKey: 'daysAllowedPerYear', header: ({ column }) => <DataTableColumnHeader column={column} title="Annual allowance" />, cell: ({ row }) => row.original.daysAllowedPerYear },
    { accessorKey: 'isCarryForward', header: ({ column }) => <DataTableColumnHeader column={column} title="Carry forward" />, cell: ({ row }) => (row.original.isCarryForward ? 'Yes' : 'No') },
    statusColumn(),
  ], []);

  const typeRows = visibleTypes.map((type) => ({ ...type, status: type.isActive === false ? 'Inactive' : 'Active' }));

  return (
    <ScreenFrame
      config={config}
      loading={loading}
      error={error}
      onRefresh={() => setRefresh((value) => value + 1)}
      onExport={() => policy ? downloadCsv('leave-policy.csv', [{ name: policy.name, persisted, ...flattenPolicy(policy) }, ...typeRows.map((type) => ({ leaveType: type.name, code: type.code, daysAllowedPerYear: type.daysAllowedPerYear, carryForward: type.isCarryForward }))]) : toast.error('No policy to export')}
      onCreate={edit}
      createLabel={persisted ? 'Edit leave policy' : 'Save leave policy'}
      kpis={[
        { title: 'Policy', value: policy?.name || '—', description: persisted ? 'Stored leave policy' : 'Default returned until saved' },
        { title: 'Notice days', value: policy?.minNoticePeriodDays ?? '—', description: 'Minimum notice' },
        { title: 'Consecutive days', value: policy?.maxConsecutiveDays ?? '—', description: 'Maximum consecutive leave' },
        { title: 'Leave types', value: types.length, description: 'Active leave types for this tenant' },
      ]}
      query={query}
      onQuery={setQuery}
      placeholder="Search leave types"
      notice="The leave policy API stores one policy per customer and office. It does not provide a policy code, employee class, accrual, encashment, or delete. Leave types are listed from the leave-types API and are not linked as policy mappings. Carry-forward exists on each leave type. Archived policies are not returned."
    >
      {error ? <ErrorState message={error} onRetry={() => setRefresh((value) => value + 1)} /> : null}
      {policy && !error ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">{policy.name || 'Leave policy'}</h2>
              <p className="mt-1 text-xs text-slate-500">{persisted ? `Record #${policy.id}` : 'This response has no id yet. Saving creates the tenant policy.'}</p>
            </div>
            <StatusBadge status={policy.isActive === false ? 'Inactive' : 'Active'} />
          </div>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {leaveLines(policy).map(([label, value]) => (
              <div key={label} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                <dt className="text-[11px] font-medium text-slate-500">{label}</dt>
                <dd className="mt-1 text-xs font-semibold text-slate-800">{String(value)}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}
      {!error && !loading && typeRows.length === 0 ? <EmptyState query={debouncedQuery} tab="all" title="Leave types" /> : null}
      <div className="grid gap-3 md:hidden">
        {typeRows.map((type) => (
          <article key={type.id || type.code} className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-semibold">{type.name}</p>
            <p className="mt-1 text-xs text-slate-500">{type.code} · {type.daysAllowedPerYear} days · carry forward {type.isCarryForward ? 'yes' : 'no'}</p>
          </article>
        ))}
      </div>
      <div className={typeRows.length ? 'hidden md:block' : 'hidden'}>
        <DataTable columns={columns} data={typeRows} hideSearch isLoading={loading} emptyState="" pageSize={10} />
      </div>
      <ItemDrawer open={drawerOpen} onOpenChange={setDrawerOpen} title="Leave policy" description="Values are sent to the leave policy upsert endpoint." saving={saving} onSubmit={save} submitLabel="Save policy" size="medium">
        <Field label="Policy name"><Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="h-9 text-xs" required /></Field>
        <Field label="Office">
          <Select value={form.officeId || 'company'} onValueChange={(value) => setForm({ ...form, officeId: value === 'company' ? '' : value })}>
            <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="company">Company-wide</SelectItem>
              {offices.map((office) => <SelectItem key={office.id} value={String(office.id)}>{office.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <NumberField label="Max backdated days" value={form.maxBackdatedDays} onChange={(value) => setForm({ ...form, maxBackdatedDays: value })} />
          <NumberField label="Max future days" value={form.maxFutureDays} onChange={(value) => setForm({ ...form, maxFutureDays: value })} />
          <NumberField label="Minimum notice days" value={form.minNoticePeriodDays} onChange={(value) => setForm({ ...form, minNoticePeriodDays: value })} />
          <NumberField label="Max consecutive days" value={form.maxConsecutiveDays} onChange={(value) => setForm({ ...form, maxConsecutiveDays: value })} />
          <NumberField label="Attachment required above days" value={form.requiresAttachmentAboveDays} onChange={(value) => setForm({ ...form, requiresAttachmentAboveDays: value })} />
        </div>
        {[
          ['allowHalfDay', 'Allow half day'],
          ['allowBackdatedLeave', 'Allow backdated leave'],
          ['allowFutureLeave', 'Allow future leave'],
          ['allowProbationLeave', 'Allow leave during probation'],
          ['includeHolidaysInLeave', 'Count holidays'],
          ['includeWeekendsInLeave', 'Count weekends'],
          ['requiresManagerApproval', 'Manager approval'],
          ['requiresHrApproval', 'HR approval'],
          ['isActive', 'Active'],
        ].map(([key, label]) => (
          <label key={key} className="flex items-center gap-2 text-xs font-medium text-slate-700">
            <input type="checkbox" checked={form[key] === true} onChange={(event) => setForm({ ...form, [key]: event.target.checked })} />
            {label}
          </label>
        ))}
      </ItemDrawer>
    </ScreenFrame>
  );
}

function ScreenFrame({ config, kpis, tab, onTab, counts, query, onQuery, placeholder, notice, onRefresh, onExport, onCreate, createLabel, children }) {
  return (
    <div className="space-y-6 overflow-x-hidden">
      <PageHeader
        category={config.category}
        title={config.title}
        description={config.description}
        icon={config.icon}
        actions={(
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Button type="button" variant="outline" onClick={onRefresh} className="h-9 text-xs"><FontAwesomeIcon icon={faRotateRight} className="size-3.5" /> Refresh</Button>
            <Button type="button" variant="outline" onClick={onExport} className="h-9 text-xs"><FontAwesomeIcon icon={faDownload} className="size-3.5" /> Export CSV</Button>
            <Button type="button" onClick={onCreate} className="h-9 bg-brand text-xs font-bold text-primary-foreground hover:bg-brand-dark"><FontAwesomeIcon icon={faPlus} className="size-3.5" /> {createLabel}</Button>
          </div>
        )}
      />
      <KpiGrid cards={kpis.map((item) => ({ ...item, icon: config.icon }))} />
      {notice ? <p className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs leading-relaxed text-slate-600">{notice}</p> : null}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {onTab ? (
          <SegmentedTabs
            tabs={[
              { label: 'All', value: 'all', count: counts.all },
              { label: 'Active', value: 'active', count: counts.active },
              { label: 'Inactive', value: 'inactive', count: counts.inactive },
              { label: 'Archived', value: 'archived', count: 0 },
            ]}
            value={tab}
            onChange={onTab}
          />
        ) : <span />}
        {onQuery ? <Input value={query} onChange={(event) => onQuery(event.target.value)} placeholder={placeholder} className="h-9 w-full text-xs lg:max-w-xs" /> : null}
      </div>
      {children}
    </div>
  );
}

function ItemDrawer({ open, onOpenChange, title, description, children, onSubmit, submitLabel, saving, size = 'simple' }) {
  return (
    <FormDrawer open={open} onOpenChange={onOpenChange} size={size} title={title} description={description} submitLabel={submitLabel} onSubmit={onSubmit} loading={saving} disabled={saving}>
      <div className="grid gap-4">{children}</div>
    </FormDrawer>
  );
}

function ViewDrawer({ record, onClose, onEdit, config, lines }) {
  return (
    <FormDrawer open={Boolean(record)} onOpenChange={(open) => { if (!open) onClose(); }} size="simple" title={record?.name || config.singular} description={record?.code || ''} showFooter={false}>
      {record ? (
        <div className="space-y-4">
          <StatusBadge status={record.status || (record.isActive === false ? 'Inactive' : 'Active')} />
          <dl className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
            {lines.map(([label, value]) => (
              <div key={label} className="flex items-start justify-between gap-3 text-xs">
                <dt className="text-slate-500">{label}</dt>
                <dd className="text-right font-semibold text-slate-800">{value === '' || value == null ? '—' : String(value)}</dd>
              </div>
            ))}
          </dl>
          {record.description ? <p className="rounded-lg border border-slate-200 p-3 text-xs leading-relaxed text-slate-600">{record.description}</p> : null}
          <Button type="button" className="h-9 w-full bg-brand text-xs text-primary-foreground hover:bg-brand-dark" onClick={() => { onClose(); onEdit(record); }}>Edit</Button>
        </div>
      ) : null}
    </FormDrawer>
  );
}

function Field({ label, children }) {
  return <div className="space-y-1.5"><Label className="text-xs font-semibold text-slate-700">{label}</Label>{children}</div>;
}

function NameCodeFields({ form, setForm }) {
  return (
    <>
      <Field label="Name"><Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="h-9 text-xs" required /></Field>
      <Field label="Code"><Input value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value.toUpperCase() })} className="h-9 font-mono text-xs uppercase" required /></Field>
    </>
  );
}

function StatusField({ form, setForm }) {
  return (
    <Field label="Status">
      <Select value={form.isActive === false ? 'inactive' : 'active'} onValueChange={(value) => setForm({ ...form, isActive: value === 'active' })}>
        <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="inactive">Inactive</SelectItem>
        </SelectContent>
      </Select>
    </Field>
  );
}

function DescriptionField({ form, setForm }) {
  return <Field label="Description"><Textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={3} className="resize-none text-xs" /></Field>;
}

function LoanFields({ form, setForm }) {
  return (
    <>
      <Field label="Interest rate (%)"><Input type="number" min="0" step="0.01" value={form.interestRate} onChange={(event) => setForm({ ...form, interestRate: event.target.value })} className="h-9 text-xs" /></Field>
      <Field label="Maximum repayment months"><Input type="number" min="1" value={form.maxMonths} onChange={(event) => setForm({ ...form, maxMonths: event.target.value })} className="h-9 text-xs" /></Field>
      <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
        <input type="checkbox" checked={form.requiresApproval === true} onChange={(event) => setForm({ ...form, requiresApproval: event.target.checked })} />
        Requires approval
      </label>
    </>
  );
}

function PaymentFields({ form, setForm }) {
  return (
    <Field label="Mode">
      <Select value={form.mode || 'LIVE'} onValueChange={(value) => setForm({ ...form, mode: value })}>
        <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="LIVE">LIVE</SelectItem>
          <SelectItem value="TEST">TEST</SelectItem>
        </SelectContent>
      </Select>
    </Field>
  );
}

function NumberField({ label, value, onChange }) {
  return <Field label={label}><Input type="number" value={value} onChange={(event) => onChange(event.target.value)} className="h-9 text-xs" /></Field>;
}

function ErrorState({ message, onRetry }) {
  return (
    <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
      <p>{message}</p>
      <Button type="button" variant="outline" className="mt-3 h-9 text-xs" onClick={onRetry}>Try again</Button>
    </div>
  );
}

function EmptyState({ query, tab, title }) {
  const message = tab === 'archived'
    ? 'Archived records are not available from this API.'
    : query
      ? `No ${title.toLowerCase()} match “${query}”.`
      : `No ${title.toLowerCase()} were returned.`;
  return <div className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500">{message}</div>;
}

function nameColumn(config) {
  return {
    accessorKey: 'name',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-brand/20 bg-brand/10">
          <FontAwesomeIcon icon={config.icon} className="size-4 text-brand" />
        </div>
        <div className="min-w-0">
          <p className="truncate font-semibold text-slate-900">{row.original.name}</p>
          <p className="mt-0.5 line-clamp-1 text-[11px] text-slate-400">{row.original.description || '—'}</p>
        </div>
      </div>
    ),
  };
}

function codeColumn() {
  return {
    accessorKey: 'code',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Code" />,
    cell: ({ row }) => <Badge variant="outline" className="font-mono text-[11px]">{row.original.code || '—'}</Badge>,
  };
}

function statusColumn() {
  return {
    accessorKey: 'status',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  };
}

function metricColumn(slug, module) {
  if (slug === 'loan-types') {
    return {
      id: 'terms',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Terms" />,
      cell: ({ row }) => <span className="text-xs">{row.original.interestRate}% · {row.original.maxMonths} months</span>,
    };
  }
  return {
    accessorKey: module.metricKey,
    header: ({ column }) => <DataTableColumnHeader column={column} title={module.metricLabel} />,
    cell: ({ row }) => <span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-bold">{row.original[module.metricKey] ?? 0}</span>,
  };
}

function actionsColumn(onView, onEdit, onDelete) {
  return {
    id: 'actions',
    cell: ({ row }) => <DataTableRowActions row={row} onView={onView} onEdit={onEdit} onDelete={onDelete} confirmDelete={false} />,
  };
}

function emptyMasterForm() {
  return { name: '', code: '', category: '', description: '', sortOrder: 0, isActive: true, maxMonths: 12, interestRate: 0, requiresApproval: true, mode: 'LIVE' };
}

function emptyDesignationForm() {
  return { name: '', code: '', departmentId: '', description: '', level: 1, isActive: true, crmMobileAccess: false };
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

function emptyLeaveForm() {
  return leaveForm({});
}

function leaveForm(policy = {}) {
  return {
    name: policy.name || 'Standard Leave Policy',
    officeId: policy.officeId ? String(policy.officeId) : '',
    allowHalfDay: policy.allowHalfDay !== false,
    allowBackdatedLeave: policy.allowBackdatedLeave === true,
    maxBackdatedDays: policy.maxBackdatedDays ?? 3,
    allowFutureLeave: policy.allowFutureLeave !== false,
    maxFutureDays: policy.maxFutureDays ?? 90,
    allowProbationLeave: policy.allowProbationLeave === true,
    includeHolidaysInLeave: policy.includeHolidaysInLeave === true,
    includeWeekendsInLeave: policy.includeWeekendsInLeave === true,
    minNoticePeriodDays: policy.minNoticePeriodDays ?? 2,
    maxConsecutiveDays: policy.maxConsecutiveDays ?? 10,
    requiresManagerApproval: policy.requiresManagerApproval !== false,
    requiresHrApproval: policy.requiresHrApproval !== false,
    requiresAttachmentAboveDays: policy.requiresAttachmentAboveDays ?? 3,
    isActive: policy.isActive !== false,
  };
}

function leaveLines(policy) {
  return [
    ['Half day', yesNo(policy.allowHalfDay)],
    ['Backdated leave', yesNo(policy.allowBackdatedLeave)],
    ['Max backdated days', policy.maxBackdatedDays],
    ['Future leave', yesNo(policy.allowFutureLeave)],
    ['Max future days', policy.maxFutureDays],
    ['Probation leave', yesNo(policy.allowProbationLeave)],
    ['Holidays count', yesNo(policy.includeHolidaysInLeave)],
    ['Weekends count', yesNo(policy.includeWeekendsInLeave)],
    ['Manager approval', yesNo(policy.requiresManagerApproval)],
    ['HR approval', yesNo(policy.requiresHrApproval)],
    ['Attachment above days', policy.requiresAttachmentAboveDays],
    ['Updated by', policy.updatedByName || '—'],
  ];
}

function flattenPolicy(policy) {
  return Object.fromEntries(leaveLines(policy));
}

function yesNo(value) {
  return value ? 'Yes' : 'No';
}

function catalogNotice(slug) {
  if (slug === 'employee-types') return 'Employee types use master items of type EMPLOYEE_TYPE. Classification is the category field. Benefits tier and a separate employment class are not stored. Staff count is grouped from employees by code. Search, status, and sort run on the returned list. There is no archive or bulk API.';
  if (slug === 'work-types') return 'Work types use master items of type WORK_TYPE. Category is the stored category. Location model, schedule, and attendance settings are not separate fields. Item count comes from work records. There is no archive or bulk API.';
  if (slug === 'loan-types') return 'Interest, repayment months, and approval are stored in the loan type meta object. Maximum amount and eligibility rules are not fields on this API. Active borrower count is a tenant total, not a count per loan type. There is no archive or bulk API.';
  return 'Settlement type is the category. Mode is stored in meta. Razorpay and bank-transfer enabled state shown by the API can also follow payment settings, so a master status change does not reconfigure the gateway. There is no provider credential form, archive, or bulk API here.';
}

function catalogMetricText(slug, row) {
  if (slug === 'loan-types') return `${row.interestRate}% interest · ${row.maxMonths} months · approval ${row.requiresApproval ? 'required' : 'not required'}`;
  if (slug === 'payment-methods') return `${row.category || '—'} · ${row.mode || '—'} · ${row.transactionsCount ?? 0} transactions`;
  if (slug === 'work-types') return `${row.category || '—'} · ${row.itemCount ?? 0} work items`;
  return `${row.category || '—'} · ${row.employeeCount ?? 0} employees`;
}

function catalogViewLines(slug, row) {
  const lines = [['Code', row.code], ['Category', row.category], ['Status', row.status], ['System record', row.isSystem ? 'Yes' : 'No']];
  if (slug === 'employee-types') lines.push(['Staff count', row.employeeCount]);
  if (slug === 'work-types') lines.push(['Work items', row.itemCount]);
  if (slug === 'loan-types') lines.push(['Interest %', row.interestRate], ['Max months', row.maxMonths], ['Approval', row.requiresApproval ? 'Required' : 'Not required']);
  if (slug === 'payment-methods') lines.push(['Mode', row.mode], ['Enabled by API', row.isEnabled ? 'Yes' : 'No'], ['Transactions', row.transactionsCount]);
  return lines;
}

function metricTotal(slug, rows, extra) {
  if (slug === 'loan-types') return extra.activeLoansCount ?? '—';
  if (slug === 'payment-methods') return rows.reduce((sum, row) => sum + (Number(row.transactionsCount) || 0), 0);
  if (slug === 'work-types') return rows.reduce((sum, row) => sum + (Number(row.itemCount) || 0), 0);
  return rows.reduce((sum, row) => sum + (Number(row.employeeCount) || 0), 0);
}
