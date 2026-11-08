'use client';

import * as React from 'react';
import { Database, Layers, ShieldAlert, Trash2, History, HardDrive } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/PageHeader';
import { KpiGrid } from '@/components/common/KpiCard';
import { DataTable } from '@/components/common/DataTable';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { SegmentedTabs } from '@/components/ui/segmented-tabs';
import { PermanentDeleteDialog } from '@/components/data-management/PermanentDeleteDialog';
import {
  UI_ONLY_NOTICE,
  buildLocalDeletionPreview,
  buildLocalExecuteResult,
  createLocalHistoryEntry,
  getLocalModules,
  getLocalOverview,
} from '@/lib/data-management/local-data-management';

const MODES = [
  { value: 'modules', label: 'Selected modules' },
  { value: 'all', label: 'All business data' },
  { value: 'date_range', label: 'By date range' },
];

export default function DataManagementPage() {
  const [customerId, setCustomerId] = React.useState('');
  const [mode, setMode] = React.useState('modules');
  const [modules, setModules] = React.useState([]);
  const [selected, setSelected] = React.useState(() => new Set());
  const [overview, setOverview] = React.useState(null);
  const [history, setHistory] = React.useState([]);
  const [preview, setPreview] = React.useState(null);
  const [previewLoading, setPreviewLoading] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [executing, setExecuting] = React.useState(false);
  const [fromDate, setFromDate] = React.useState('');
  const [toDate, setToDate] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('');
  const [moduleSearch, setModuleSearch] = React.useState('');

  const resolvedCustomer = customerId.trim() || undefined;

  const load = React.useCallback(() => {
    setLoading(true);
    const ov = getLocalOverview(resolvedCustomer);
    const mods = getLocalModules();
    setOverview(ov);
    setModules(mods.modules || []);
    if (!customerId && ov?.customerId) {
      setCustomerId(String(ov.customerId));
    }
    setLoading(false);
  }, [resolvedCustomer, customerId]);

  React.useEffect(() => {
    load();
  }, [load]);

  const filteredModules = React.useMemo(() => {
    const q = moduleSearch.trim().toLowerCase();
    if (!q) return modules;
    return modules.filter(
      (m) =>
        m.name?.toLowerCase().includes(q) ||
        m.key?.toLowerCase().includes(q) ||
        m.group?.toLowerCase().includes(q),
    );
  }, [modules, moduleSearch]);

  const selectedCount = React.useMemo(() => {
    if (mode === 'all') {
      return modules.reduce((sum, m) => sum + (m.totalRecords || 0), 0);
    }
    return modules
      .filter((m) => selected.has(m.key))
      .reduce((sum, m) => sum + (m.totalRecords || 0), 0);
  }, [mode, modules, selected]);

  const toggleModule = (key) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
    setPreview(null);
  };

  const runPreview = () => {
    const payload = {
      mode,
      modules: mode === 'all' ? undefined : [...selected],
      fromDate: mode === 'date_range' ? fromDate || undefined : undefined,
      toDate: mode === 'date_range' ? toDate || undefined : undefined,
      status: mode === 'date_range' ? statusFilter || undefined : undefined,
    };

    if (mode !== 'all' && !payload.modules?.length) {
      toast.error('Select at least one module.');
      return;
    }

    setPreviewLoading(true);
    setPreview(null);
    try {
      const result = buildLocalDeletionPreview(payload);
      setPreview(result);
      toast.info(UI_ONLY_NOTICE);
      toast.success('Deletion preview ready (UI only).');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Preview failed.');
    } finally {
      setPreviewLoading(false);
    }
  };

  const executeDelete = ({ acknowledgePermanent, confirmation }) => {
    if (!preview?.previewId) {
      toast.error('Valid preview required.');
      return;
    }
    if (!acknowledgePermanent || !confirmation) {
      return;
    }
    setExecuting(true);
    try {
      const result = buildLocalExecuteResult(preview);
      setHistory((prev) => [createLocalHistoryEntry(preview), ...prev]);
      toast.info(result.message);
      toast.success('Flow completed in UI only — no data was deleted.');
      setDeleteOpen(false);
      setPreview(null);
      setSelected(new Set());
      load();
    } finally {
      setExecuting(false);
    }
  };

  const kpis = [
    {
      title: 'Database records',
      value: overview?.totalDatabaseRecords?.toLocaleString() ?? (loading ? '…' : '—'),
      icon: Database,
      description: 'Eligible business rows (tenant scoped)',
    },
    {
      title: 'Business modules',
      value: overview?.totalBusinessModules ?? (loading ? '…' : '—'),
      icon: Layers,
    },
    {
      title: 'Selected for deletion',
      value: preview?.totalEstimated?.toLocaleString() ?? selectedCount.toLocaleString(),
      icon: Trash2,
      iconColor: 'text-rose-600',
      iconBg: 'bg-rose-50 border-rose-100',
    },
    {
      title: 'Backup status',
      value: overview?.backup?.available ? 'Verified' : 'Not verified',
      icon: HardDrive,
      description: overview?.backup?.lastBackupAt
        ? new Date(overview.backup.lastBackupAt).toLocaleString()
        : overview?.backup?.message,
    },
  ];

  const moduleColumns = [
    { id: 'select', header: '', enableSorting: false, cell: (row) => (
      <Checkbox
        checked={selected.has(row.key)}
        onCheckedChange={() => toggleModule(row.key)}
        disabled={mode === 'all'}
        aria-label={`Select ${row.name}`}
      />
    ) },
    { accessorKey: 'name', header: 'Module' },
    { accessorKey: 'group', header: 'Group' },
    { accessorKey: 'totalRecords', header: 'Records', cell: (row) => row.totalRecords?.toLocaleString() },
    { id: 'models', header: 'Models', cell: (row) => (row.prismaModels || []).join(', ') },
    { id: 'deps', header: 'Dependencies', cell: (row) => (row.dependencies || []).join(', ') || '—' },
    {
      id: 'eligible',
      header: 'Eligible',
      cell: (row) => (
        <span className={row.deletionEligible ? 'text-brand font-medium' : 'text-slate-400'}>
          {row.deletionEligible ? 'Yes' : 'No'}
        </span>
      ),
    },
  ];

  const previewColumns = [
    { accessorKey: 'moduleName', header: 'Module' },
    { accessorKey: 'directRecords', header: 'Direct' },
    { accessorKey: 'dependentRecords', header: 'Dependent' },
    { accessorKey: 'estimatedTotal', header: 'Estimated total' },
    { id: 'tables', header: 'Tables', cell: (row) => (row.relatedTables || []).join(', ') },
    { id: 'notes', header: 'Notes', cell: (row) => row.notes || (row.dateFilterApplied ? 'Date filter applied' : '—') },
  ];

  const historyColumns = [
    { accessorKey: 'id', header: 'ID' },
    { accessorKey: 'action', header: 'Action' },
    { accessorKey: 'module', header: 'Module' },
    { accessorKey: 'status', header: 'Status' },
    {
      id: 'when',
      header: 'Timestamp',
      cell: (row) => (row.timestamp ? new Date(row.timestamp).toLocaleString() : '—'),
    },
    { accessorKey: 'performedBy', header: 'Admin' },
  ];

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <PageHeader
        title="Data Management"
        description="Preview deletion scope and workflows (UI only). Backend connection for live counts and permanent delete is not enabled in this phase."
        category="DATA GOVERNANCE"
        badge="Destructive"
        badgeVariant="default"
        primaryAction={
          <Button
            className="bg-brand hover:bg-primary-hover text-primary-foreground"
            disabled={!preview?.canConfirm}
            onClick={() => setDeleteOpen(true)}
          >
            Execute deletion
          </Button>
        }
        secondaryAction={
          <Button variant="outline" onClick={load} disabled={loading}>
            Refresh
          </Button>
        }
      />

      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <div className="min-w-[180px] flex-1">
          <Label className="text-xs text-slate-600">Tenant (customer ID)</Label>
          <Input
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            placeholder="e.g. 1"
            className="mt-1 h-9"
          />
        </div>
        <Button variant="outline" className="h-9" onClick={load}>
          Apply tenant
        </Button>
      </div>

      <KpiGrid cards={kpis} />

      <p className="rounded-xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-xs text-amber-950">
        {UI_ONLY_NOTICE}
      </p>

      {overview?.lastDeletionOperation ? (
        <Card className="border-slate-200 p-4 text-sm text-slate-600">
          <span className="font-medium text-slate-800">Last deletion: </span>
          {overview.lastDeletionOperation.module} —{' '}
          {new Date(overview.lastDeletionOperation.timestamp).toLocaleString()} by{' '}
          {overview.lastDeletionOperation.performedBy}
        </Card>
      ) : null}

      <Card className="border-slate-200 p-4">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <SegmentedTabs tabs={MODES} value={mode} onChange={(v) => { setMode(v); setPreview(null); }} />
          <Button
            className="bg-brand hover:bg-primary-hover text-primary-foreground"
            onClick={runPreview}
            disabled={previewLoading}
          >
            {previewLoading ? 'Analyzing…' : 'Run deletion preview'}
          </Button>
        </div>

        {mode === 'date_range' ? (
          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            <div>
              <Label className="text-xs">From date</Label>
              <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="mt-1 h-9" />
            </div>
            <div>
              <Label className="text-xs">To date</Label>
              <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="mt-1 h-9" />
            </div>
            <div>
              <Label className="text-xs">Status (optional)</Label>
              <Input value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="mt-1 h-9" placeholder="APPROVED" />
            </div>
          </div>
        ) : null}

        <div className="mb-3">
          <Input
            placeholder="Search modules…"
            value={moduleSearch}
            onChange={(e) => setModuleSearch(e.target.value)}
            className="h-9 max-w-sm"
          />
        </div>

        <DataTable
          columns={moduleColumns}
          data={filteredModules}
          isLoading={loading}
          pageSize={12}
          label="Deletable modules"
        />
      </Card>

      {preview?.rows?.length ? (
        <Card className="border-brand/20 p-4">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
            <ShieldAlert className="size-4 text-brand" />
            Deletion preview
          </h3>
          <p className="mb-3 text-xs text-slate-600">
            Total estimated: <strong>{preview.totalEstimated?.toLocaleString()}</strong> — expires{' '}
            {preview.expiresAt ? new Date(preview.expiresAt).toLocaleTimeString() : 'soon'}
          </p>
          <DataTable columns={previewColumns} data={preview.rows} pageSize={10} label="Preview breakdown" />
        </Card>
      ) : null}

      <Card className="border-slate-200 p-4">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
          <History className="size-4 text-slate-500" />
          Deletion history
        </h3>
        <DataTable columns={historyColumns} data={history} isLoading={loading} pageSize={8} label="Audit history" />
      </Card>

      <PermanentDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        preview={preview}
        loading={executing}
        onConfirm={executeDelete}
      />
    </div>
  );
}
