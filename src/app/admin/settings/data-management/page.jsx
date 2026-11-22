'use client';

import * as React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faClockRotateLeft,
  faDatabase,
  faDownload,
  faShieldHalved,
  faTriangleExclamation,
  faMagnifyingGlass,
  faRotateRight,
  faLayerGroup,
  faBuilding,
  faGlobe,
  faFilter,
  faUpload,
  faTrashCan,
  faArrowsRotate,
  faCheck,
  faCircleCheck,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { suiteError } from '@/modules/suite/suite-api';
import { AdminRowActions } from '@/components/common/AdminRowActions';
import {
  createDataBackup,
  downloadDataBackup,
  executeDataCleanup,
  executeDataImport,
  executeDataReset,
  executeDataRestore,
  exportDataModule,
  loadDataBackups,
  loadDataModules,
  loadDataOperations,
  loadDataOverview,
  previewDataCleanup,
  previewDataImport,
  previewDataReset,
  previewDataRestore,
  verifyDataBackup,
} from '@/modules/suite/suite-api';
import { toast } from '@/hooks/use-toast';
import { useAuthStore } from '../../../../../lib/store';
import { evaluateResetEligibility } from '@/lib/data-management/reset-eligibility.mjs';

// Modular Data Management Components
import { DataSummaryCards } from '@/components/data-management/DataSummaryCards';
import { ModuleCard } from '@/components/data-management/ModuleCard';
import { ProtectedRecordsCard } from '@/components/data-management/ProtectedRecordsCard';
import { ResetLevelsCard } from '@/components/data-management/ResetLevelsCard';
import { ResetConfirmationCard } from '@/components/data-management/ResetConfirmationCard';

const TABS = [
  { id: 'reset', label: 'Reset Data' },
  { id: 'backup', label: 'Backup & Restore' },
  { id: 'cleanup', label: 'Data Cleanup' },
  { id: 'transfer', label: 'Import / Export' },
];

const MODULE_CATEGORIES = [
  { id: 'all', label: 'All Categories' },
  { id: 'crm', label: 'CRM & Sales' },
  { id: 'hrm', label: 'HRM & Attendance' },
  { id: 'master', label: 'Master & Config' },
  { id: 'operations', label: 'Operations & Data' },
];

function classifyModule(id = '') {
  const lower = id.toLowerCase();
  if (lower.includes('lead') || lower.includes('crm') || lower.includes('deal') || lower.includes('customer') || lower.includes('contact') || lower.includes('proposal') || lower.includes('visit') || lower.includes('task') || lower.includes('activity')) return 'crm';
  if (lower.includes('attendance') || lower.includes('employee') || lower.includes('leave') || lower.includes('payroll') || lower.includes('shift') || lower.includes('loan') || lower.includes('expense') || lower.includes('commission') || lower.includes('salary')) return 'hrm';
  if (lower.includes('master') || lower.includes('department') || lower.includes('designation') || lower.includes('stage') || lower.includes('source')) return 'master';
  return 'operations';
}

export default function DataManagementPage() {
  const authUser = useAuthStore((state) => state.user);
  const [tab, setTab] = React.useState('reset');
  const [overview, setOverview] = React.useState(null);
  const [modules, setModules] = React.useState([]);
  const [protectedRecords, setProtectedRecords] = React.useState([]);
  const [backups, setBackups] = React.useState([]);
  const [history, setHistory] = React.useState([]);
  const [historyOpen, setHistoryOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [selected, setSelected] = React.useState([]);
  const [preview, setPreview] = React.useState(null);
  const [scope, setScope] = React.useState('selected');
  const [confirmation, setConfirmation] = React.useState('');
  const [acknowledgement, setAcknowledgement] = React.useState('');
  const [globalConfirmation, setGlobalConfirmation] = React.useState('');
  const [reason, setReason] = React.useState('');
  const [result, setResult] = React.useState(null);
  const [busy, setBusy] = React.useState('');
  const [backupName, setBackupName] = React.useState('');
  const [backupDescription, setBackupDescription] = React.useState('');
  const [restoreId, setRestoreId] = React.useState('');
  const [restorePreview, setRestorePreview] = React.useState(null);
  const [restoreConfirmation, setRestoreConfirmation] = React.useState('');
  const [cleanup, setCleanup] = React.useState({});
  const [cleanupConfirmation, setCleanupConfirmation] = React.useState('');
  const [importPreview, setImportPreview] = React.useState(null);
  const [importCsv, setImportCsv] = React.useState('');
  const [importConfirmation, setImportConfirmation] = React.useState('');
  const [customerBreakdownOpen, setCustomerBreakdownOpen] = React.useState(true);

  // Module filtering & search states
  const [moduleSearch, setModuleSearch] = React.useState('');
  const [moduleCategory, setModuleCategory] = React.useState('all');
  const [showAllModules, setShowAllModules] = React.useState(false);

  const reload = React.useCallback(async () => {
    setLoading(true);
    try {
      const [overviewResponse, moduleResponse, backupResponse, historyResponse] = await Promise.all([
        loadDataOverview(),
        loadDataModules(),
        loadDataBackups(),
        loadDataOperations(),
      ]);
      const freshOverview = dataOf(overviewResponse);
      setOverview(freshOverview);
      const modulePayload = dataOf(moduleResponse);
      setModules(modulePayload.modules || []);
      setProtectedRecords(modulePayload.protected || []);
      setBackups(listOf(backupResponse));
      setHistory(listOf(historyResponse));
      setError('');
      return freshOverview;
    } catch (err) {
      setOverview(null);
      setError(suiteError(err));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { reload(); }, [reload]);

  // Automatic preview for selected modules
  React.useEffect(() => {
    if (!selected.length || scope !== 'selected' || loading || error) {
      if (!selected.length && scope === 'selected') setPreview(null);
      return;
    }
    let active = true;
    const timer = setTimeout(async () => {
      try {
        const response = await previewDataReset({ modules: selected, scope: 'selected' });
        if (active) setPreview(dataOf(response));
      } catch {
        if (active) setPreview(null);
      }
    }, 250);
    return () => { active = false; clearTimeout(timer); };
  }, [selected, scope, loading, error]);

  const verifiedBackups = backups.filter((item) => item.status === 'VERIFIED');
  const latestBackup = verifiedBackups[0];

  async function run(label, action) {
    setBusy(label);
    try {
      const response = await action();
      const payload = dataOf(response);
      setResult(payload);
      toast.success('Operation completed');
      await reload();
      return payload;
    } catch (err) {
      toast.error(suiteError(err));
      return null;
    } finally {
      setBusy('');
    }
  }

  async function runVerifiedReset() {
    setBusy('reset');
    try {
      const response = await executeDataReset({
        modules: selected,
        scope,
        previewToken: preview?.previewToken,
        confirmation,
        acknowledgement,
        globalConfirmation,
        idempotencyKey: crypto.randomUUID(),
        reason,
      });
      const resetResult = dataOf(response);
      if (resetResult.success !== true || resetResult.status !== 'SUCCESS' || resetResult.verified !== true) {
        throw new Error('The reset was not verified by the database. Review reset history before retrying.');
      }
      setResult(resetResult);
      setPreview(null);
      setConfirmation('');
      const refreshedOverview = await reload();
      if (!refreshedOverview) {
        toast.error('The reset was verified by the backend, but refreshed counts could not be loaded. Reload page.');
        return;
      }
      const nonzeroModules = selected
        .map((id) => refreshedOverview.modules?.find((item) => item.id === id) || { id, name: id, records: null })
        .filter((item) => item.records !== (item.id === 'designations' ? Number(resetResult.preservedCounts?.designation || 0) : 0));
      if (nonzeroModules.length) {
        toast.error(`The reset committed, but fresh module counts are not zero for: ${nonzeroModules.map((item) => item.name).join(', ')}.`);
        return;
      }
      toast.success(`Reset complete: ${resetResult.recordsDeleted} deleted; ${resetResult.recordsPreserved || 0} protected records preserved.`);
    } catch (err) {
      const message = suiteError(err);
      toast.error(message);
      if (/preview/i.test(message)) {
        setPreview(null);
        setConfirmation('');
        setAcknowledgement('');
        setGlobalConfirmation('');
      }
    } finally {
      setBusy('');
    }
  }

  async function saveFile(loader, fallback) {
    setBusy('download');
    try {
      const blob = await loader();
      const file = blob instanceof Blob ? blob : new Blob([blob]);
      const link = document.createElement('a');
      link.href = URL.createObjectURL(file);
      link.download = file.__contentDisposition?.match(/filename="([^"]+)"/)?.[1] || fallback;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (err) {
      toast.error(suiteError(err));
    } finally {
      setBusy('');
    }
  }

  const [clock, setClock] = React.useState(Date.now());
  React.useEffect(() => {
    const timer = setInterval(() => setClock(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const roles = [authUser?.role, authUser?.accountType, ...(Array.isArray(authUser?.roles) ? authUser.roles : [])]
    .map((role) => String(role || '').trim().toUpperCase().replace(/[\s-]+/g, '_'));
  const isSuperAdmin = roles.includes('SUPER_ADMIN');

  const resetEligibility = evaluateResetEligibility({
    busy: Boolean(busy),
    authorized: isSuperAdmin,
    authenticated: Boolean(authUser),
    preview,
    selected,
    modules,
    scope,
    confirmation,
    acknowledgement,
    globalConfirmation,
    now: clock,
  });

  const {
    resolvedDependencies,
    unresolvedDependencies,
    disableReasons,
  } = resetEligibility;
  const resetDisabled = resetEligibility.disabled;

  // Filtered modules based on search and category
  const filteredModules = React.useMemo(() => {
    return modules.filter((mod) => {
      const matchesSearch =
        !moduleSearch ||
        mod.name?.toLowerCase().includes(moduleSearch.toLowerCase()) ||
        mod.id?.toLowerCase().includes(moduleSearch.toLowerCase()) ||
        (mod.description && mod.description.toLowerCase().includes(moduleSearch.toLowerCase()));
      const matchesCategory =
        moduleCategory === 'all' || classifyModule(mod.id) === moduleCategory;
      return matchesSearch && matchesCategory;
    });
  }, [modules, moduleSearch, moduleCategory]);

  const displayedModules = showAllModules || filteredModules.length <= 6
    ? filteredModules
    : filteredModules.slice(0, 6);

  // Handle scope selection
  const handleSelectScope = (newScope) => {
    setScope(newScope);
    setPreview(null);
    if (newScope === 'application') {
      const ids = modules.filter((item) => item.available).map((item) => item.id);
      setSelected(ids);
      run('preview', async () => {
        const response = await previewDataReset({ modules: ids, scope: 'application' });
        setPreview(dataOf(response));
        return response;
      });
    } else if (newScope === 'global') {
      run('preview', async () => {
        const response = await previewDataReset({ scope: 'global' });
        setPreview(dataOf(response));
        return response;
      });
    }
  };

  const handleIncludeModule = (moduleId) => {
    setScope('selected');
    setPreview(null);
    setSelected((curr) => [...new Set([...curr, moduleId])]);
  };

  return (
    <div className="max-w-none w-full min-w-0 space-y-5 sm:space-y-6 pb-12 overflow-x-hidden">
      {/* 1. Page Header with SYSTEM MANAGEMENT and Database Illustration */}
      <PageHeader
        category="SYSTEM MANAGEMENT"
        title="Data Management"
        description="Backup, reset or clean application data safely."
        rightContent={(
          <div className="flex size-14 sm:size-16 items-center justify-center rounded-2xl bg-[#E8F1EC] text-[#163A2E] shadow-2xs border border-emerald-100">
            <FontAwesomeIcon icon={faDatabase} className="size-6 sm:size-8" />
          </div>
        )}
      />

      {/* 2. Summary KPI Cards (Last Backup, Total Data, DB Size, DB Health) */}
      <DataSummaryCards overview={overview} />

      {/* 3. Navigation Tabs (Horizontally scrollable on mobile) */}
      <div className="relative border-b border-[#E2E8E5] bg-white rounded-xl shadow-2xs p-1.5 sm:p-2">
        <nav
          className="flex items-center gap-1 sm:gap-2 overflow-x-auto scrollbar-none"
          aria-label="Data Management Tabs"
        >
          {TABS.map((t) => {
            const isActive = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-[#163A2E] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-[#E8F1EC] hover:text-[#163A2E]'
                }`}
              >
                <span>{t.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Loading & Error States */}
      {loading && (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-xs flex items-center justify-center gap-3">
          <FontAwesomeIcon icon={faArrowsRotate} className="size-4 animate-spin text-[#163A2E]" />
          <span className="text-sm font-medium">Loading database telemetry and modules…</span>
        </div>
      )}

      {error && !loading && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-5 shadow-xs space-y-2">
          <p className="font-bold text-rose-900 text-sm">Database information could not be loaded.</p>
          <p className="text-xs text-rose-700">{error}</p>
          <Button size="sm" onClick={reload} className="mt-2 bg-rose-600 hover:bg-rose-700 text-white text-xs">
            Retry Connection
          </Button>
        </div>
      )}

      {/* TAB 1: RESET DATA */}
      {!loading && !error && tab === 'reset' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 items-start gap-5 sm:gap-6 min-w-0">
          {/* Left Column: Reset Selected Modules, Previews & Confirmation (70%) */}
          <div className="lg:col-span-8 space-y-5 sm:space-y-6 min-w-0">
            {/* Module Selection Card */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-6 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">Reset Selected Modules</h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    Select specific modules to purge while preserving protected system accounts and tenant configuration.
                  </p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={Boolean(busy)}
                    onClick={() => {
                      setSelected(modules.filter((item) => item.available).map((item) => item.id));
                      setPreview(null);
                    }}
                    className="h-8 text-xs border-slate-200 text-slate-700 hover:bg-[#E8F1EC] hover:text-[#163A2E]"
                  >
                    Select All
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={Boolean(busy) || !selected.length}
                    onClick={() => {
                      setSelected([]);
                      setPreview(null);
                    }}
                    className="h-8 text-xs border-slate-200 text-slate-700 hover:bg-slate-100"
                  >
                    Clear
                  </Button>
                </div>
              </div>

              {/* Filter & Search Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-8 relative">
                  <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3 top-3 size-3.5 text-slate-400" />
                  <Input
                    value={moduleSearch}
                    onChange={(e) => setModuleSearch(e.target.value)}
                    placeholder="Search modules by name, ID or description..."
                    className="pl-9 h-9.5 text-xs sm:text-sm border-slate-200 focus-visible:ring-[#163A2E]"
                  />
                </div>
                <div className="sm:col-span-4">
                  <select
                    value={moduleCategory}
                    onChange={(e) => setModuleCategory(e.target.value)}
                    className="w-full h-9.5 rounded-md border border-slate-200 bg-white px-3 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#163A2E]"
                  >
                    {MODULE_CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status counter bar */}
              <div className="flex items-center justify-between text-xs text-slate-500 bg-[#F7F9F8] p-2.5 rounded-xl border border-slate-100">
                <span className="font-semibold text-slate-700">
                  {selected.length} of {modules.length} modules selected
                </span>
                <span className="font-medium text-[#163A2E]">
                  {Number(preview?.totalEligibleRecords ?? preview?.estimatedRecords ?? 0).toLocaleString()} eligible records in preview
                </span>
              </div>

              {/* Module Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {displayedModules.map((item) => (
                  <ModuleCard
                    key={item.id}
                    module={item}
                    recordsCount={overview?.modules?.find((entry) => entry.id === item.id)?.records || 0}
                    isSelected={selected.includes(item.id)}
                    disabled={!item.available}
                    onToggle={() => {
                      setScope('selected');
                      setPreview(null);
                      setSelected((current) =>
                        current.includes(item.id)
                          ? current.filter((id) => id !== item.id)
                          : [...current, item.id]
                      );
                    }}
                  />
                ))}
              </div>

              {/* Show More / Show Less Button */}
              {filteredModules.length > 6 && (
                <div className="pt-2 flex justify-center">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAllModules(!showAllModules)}
                    className="text-xs font-semibold text-[#163A2E] border-slate-300 hover:bg-[#E8F1EC] h-8"
                  >
                    {showAllModules ? 'Show Less' : `Show More Modules (${filteredModules.length - 6} more)`}
                  </Button>
                </div>
              )}

              {/* Manual Preview Action Button if needed */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
                <p className="text-[11px] text-slate-400">
                  Database safety guarantees strict schema integrity before execution.
                </p>
                <Button
                  type="button"
                  size="sm"
                  disabled={Boolean(busy) || !selected.length}
                  onClick={() => run('preview', async () => {
                    const response = await previewDataReset({ modules: selected, scope: 'selected' });
                    setPreview(dataOf(response));
                    return response;
                  })}
                  className="bg-[#163A2E] hover:bg-[#204C3D] text-white text-xs font-semibold h-8"
                >
                  <FontAwesomeIcon icon={busy === 'preview' ? faArrowsRotate : faRotateRight} className={`size-3 mr-1.5 ${busy === 'preview' ? 'animate-spin' : ''}`} />
                  Refresh Selected Preview
                </Button>
              </div>
            </div>

            {/* Reset Preview Card (When Preview is Active) */}
            {preview && (
              <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-6 shadow-xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Reset Preview Inspection</h3>
                    <p className="text-xs text-slate-500">
                      Eligible tables and dependency validation before database commit.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full">
                      {Number(preview.totalEligibleRecords ?? preview.estimatedRecords ?? 0).toLocaleString()} eligible to delete
                    </span>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                      {Number(preview.totalPreservedRecords || 0).toLocaleString()} preserved
                    </span>
                  </div>
                </div>

                {/* Selected Tables Breakdown */}
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                    Tables Targeted for Reset ({preview.tables?.length || 0})
                  </span>
                  <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100 text-xs">
                    {(preview.tables || []).map((table) => (
                      <div key={table.model} className="flex items-center justify-between p-2.5 hover:bg-slate-50">
                        <span className="font-semibold text-slate-800">
                          {table.label}
                          {table.preservedRecords ? (
                            <span className="text-slate-400 font-normal ml-1.5">
                              ({table.preservedRecords} preserved)
                            </span>
                          ) : null}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-500">
                            {Number(table.eligibleRecords ?? table.records).toLocaleString()} eligible
                          </span>
                          <span className="font-mono text-slate-400">
                            / {Number(table.records).toLocaleString()} total
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Customer Data Reset Breakdown Accordion */}
                {preview.customerBreakdown && (selected.includes('customers') || selected.includes('sales-crm')) && (
                  <div className="rounded-xl border border-emerald-200 bg-[#F7FAF8] p-4 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <p className="text-xs sm:text-sm font-bold text-[#163A2E]">Customer Data Breakdown</p>
                        <p className="text-[11px] text-[#527063]">Detailed lifecycle record count for tenant customer models</p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setCustomerBreakdownOpen(!customerBreakdownOpen)}
                        className="h-7 text-xs border-emerald-300 text-[#163A2E] hover:bg-emerald-100"
                      >
                        {customerBreakdownOpen ? 'Collapse Details' : 'Expand Details'}
                      </Button>
                    </div>

                    {customerBreakdownOpen && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        {Object.entries(preview.customerBreakdown).map(([key, category]) => (
                          <div key={key} className="rounded-lg border border-[#DCE8E1] bg-white p-3 text-xs shadow-2xs space-y-1.5">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                              <span className="font-bold text-slate-800">{category.label}</span>
                              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                                {Number(category.eligible || 0).toLocaleString()} eligible
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500">{category.description}</p>
                            <div className="grid grid-cols-3 gap-1.5 pt-1 text-center font-mono text-[11px]">
                              <div className="bg-slate-50 p-1 rounded">
                                <span className="text-[10px] text-slate-400 block font-sans">Total</span>
                                <span className="font-bold text-slate-800">{Number(category.total || 0).toLocaleString()}</span>
                              </div>
                              <div className="bg-emerald-50 p-1 rounded">
                                <span className="text-[10px] text-emerald-600 block font-sans">Eligible</span>
                                <span className="font-bold text-emerald-700">{Number(category.eligible || 0).toLocaleString()}</span>
                              </div>
                              <div className="bg-rose-50 p-1 rounded">
                                <span className="text-[10px] text-rose-600 block font-sans">Preserved</span>
                                <span className="font-bold text-rose-700">{Number(category.preserved || 0).toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Reset Confirmation Card */}
            <ResetConfirmationCard
              scope={scope}
              reason={reason}
              onReasonChange={setReason}
              confirmation={confirmation}
              onConfirmationChange={setConfirmation}
              acknowledgement={acknowledgement}
              onAcknowledgementChange={setAcknowledgement}
              globalConfirmation={globalConfirmation}
              onGlobalConfirmationChange={setGlobalConfirmation}
              disableReasons={disableReasons}
              unresolvedDependencies={unresolvedDependencies}
              onIncludeModule={handleIncludeModule}
              resetDisabled={resetDisabled}
              busy={busy === 'reset'}
              onExecuteReset={runVerifiedReset}
              estimatedRecords={preview?.totalEligibleRecords ?? preview?.estimatedRecords ?? 0}
            />

            {/* Operation Result Report */}
            {result?.operationId && (
              <div className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-xs space-y-3">
                <div className="flex items-center gap-2.5 text-emerald-900 font-bold text-sm">
                  <FontAwesomeIcon icon={faCircleCheck} className="size-5 text-emerald-600" />
                  <span>Operation #{result.operationId} Completed Successfully</span>
                </div>
                <p className="text-xs text-slate-600">
                  Status: <strong className="text-emerald-700">{result.status}</strong> · Verified: <strong className="text-emerald-700">{result.verified ? 'Passed' : 'Failed'}</strong> · Deleted: <strong>{Number(result.recordsDeleted || 0).toLocaleString()} records</strong>
                  {result.recordsPreserved ? ` · Preserved: ${Number(result.recordsPreserved).toLocaleString()} records` : ''}
                </p>
              </div>
            )}
          </div>

          {/* Right Column: Reset Levels, Protected Records & Quick Actions (30%) */}
          <div className="lg:col-span-4 space-y-5 sm:space-y-6 min-w-0">
            {/* 1. Reset Levels Selector */}
            <ResetLevelsCard
              scope={scope}
              onSelectScope={handleSelectScope}
              isSuperAdmin={isSuperAdmin}
              busy={Boolean(busy)}
            />

            {/* 2. Protected Records Information */}
            <ProtectedRecordsCard
              counts={preview?.protectedCounts}
              dynamicRecords={protectedRecords}
            />

            {/* 3. Quick Actions Card */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">Quick Actions</h3>
                <p className="text-[11px] text-slate-500">Backup and reset operation telemetry</p>
              </div>

              <div className="space-y-2.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={Boolean(busy)}
                  onClick={() => run('backup', () => createDataBackup({ name: 'Manual Quick Backup' }))}
                  className="w-full justify-start text-xs font-semibold border-slate-200 text-slate-700 hover:bg-[#E8F1EC] hover:text-[#163A2E] h-9"
                >
                  <FontAwesomeIcon icon={faDatabase} className="size-3.5 mr-2 text-slate-400" />
                  Create Backup Now
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!latestBackup || Boolean(busy)}
                  onClick={() => latestBackup && saveFile(() => downloadDataBackup(latestBackup.id), `qb-backup-${latestBackup.id}.json.gz`)}
                  className="w-full justify-start text-xs font-semibold border-slate-200 text-slate-700 hover:bg-[#E8F1EC] hover:text-[#163A2E] h-9"
                >
                  <FontAwesomeIcon icon={faDownload} className="size-3.5 mr-2 text-slate-400" />
                  Download Latest Backup
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setHistoryOpen(true)}
                  className="w-full justify-start text-xs font-semibold border-slate-200 text-slate-700 hover:bg-[#E8F1EC] hover:text-[#163A2E] h-9"
                >
                  <FontAwesomeIcon icon={faClockRotateLeft} className="size-3.5 mr-2 text-slate-400" />
                  View Reset History
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BACKUP & RESTORE */}
      {!loading && !error && tab === 'backup' && (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.8fr)_minmax(300px,1fr)] xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)] items-start gap-6 min-w-0">
          {/* Left Column: Create Verified Database Backup Card */}
          <div className="min-w-0 w-full rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-5">
            <div className="space-y-1">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">Create Verified Database Backup</h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Backups are checksum-verified snapshots of tenant tables. Integration secrets and passwords are excluded.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                placeholder="Backup name (e.g. Pre-Q4 Reset Snapshot)"
                value={backupName}
                onChange={(e) => setBackupName(e.target.value)}
                className="h-10 text-xs sm:text-sm"
              />
              <Input
                placeholder="Description or notes"
                value={backupDescription}
                onChange={(e) => setBackupDescription(e.target.value)}
                className="h-10 text-xs sm:text-sm"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Button
                type="button"
                size="sm"
                disabled={Boolean(busy)}
                onClick={() => run('backup', () => createDataBackup({
                  name: backupName || 'Manual backup',
                  description: backupDescription,
                  modules: selected.length ? selected : modules.filter((item) => item.available).map((item) => item.id),
                }))}
                className="bg-[#163A2E] hover:bg-[#204C3D] text-white text-xs font-semibold h-9"
              >
                Create Backup Now
              </Button>
              {isSuperAdmin && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={Boolean(busy)}
                  onClick={() => run('backup', () => createDataBackup({
                    name: backupName || 'Global backup',
                    description: backupDescription || 'Every tenant snapshot',
                    scope: 'global',
                  }))}
                  className="border-slate-300 text-xs font-semibold h-9"
                >
                  Create Global Backup
                </Button>
              )}
            </div>

            {/* Backups Table */}
            <div className="pt-4 border-t border-slate-100 overflow-x-auto min-w-0">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-2">
                Existing Backups ({backups.length})
              </span>
              <table className="w-full min-w-[580px] text-left text-xs">
                <thead className="text-[11px] uppercase text-slate-500 bg-slate-50 border-y border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Name</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Size</th>
                    <th className="py-2.5 px-3">Created</th>
                    <th className="py-2.5 px-3">By</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {backups.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{item.name}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${item.status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono">{formatBytes(item.size)}</td>
                      <td className="py-2.5 px-3 text-slate-500">{stamp(item.createdAt)}</td>
                      <td className="py-2.5 px-3 text-slate-600">{item.createdBy}</td>
                      <td className="py-2.5 px-3 text-right">
                        <AdminRowActions
                          record={item}
                          recordName={item.name}
                          actions={[
                            {
                              id: 'verify',
                              label: 'Verify Backup',
                              onClick: () => run('verify', () => verifyDataBackup(item.id)),
                            },
                            {
                              id: 'download',
                              label: 'Download Backup',
                              onClick: () => saveFile(() => downloadDataBackup(item.id), `qb-backup-${item.id}.json.gz`),
                            },
                            {
                              id: 'restore',
                              label: 'Restore from Backup',
                              onClick: () =>
                                run('restore-preview', async () => {
                                  const response = await previewDataRestore(item.id);
                                  setRestoreId(item.id);
                                  setRestorePreview(dataOf(response));
                                  return response;
                                }),
                            },
                          ]}
                        />
                      </td>
                    </tr>
                  ))}
                  {!backups.length && (
                    <tr>
                      <td className="py-8 text-center text-slate-400" colSpan={6}>
                        <div className="flex flex-col items-center justify-center gap-1.5">
                          <FontAwesomeIcon icon={faDatabase} className="size-5 text-slate-300" />
                          <span className="font-medium text-slate-500">No backups recorded yet.</span>
                          <span className="text-[11px] text-slate-400">Created backups will be listed here with verification status and restore options.</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Restore Confirmation Box */}
            {restorePreview && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/80 p-4 space-y-3">
                <p className="font-bold text-amber-950 text-sm">
                  Restore {restorePreview.estimatedRecords} records from backup #{restoreId}
                </p>
                <p className="text-xs text-amber-800">
                  A safety snapshot is taken automatically before restore. Type <code className="font-bold">RESTORE</code> to proceed.
                </p>
                <Input
                  placeholder="Type RESTORE"
                  value={restoreConfirmation}
                  onChange={(e) => setRestoreConfirmation(e.target.value)}
                  className="h-9 text-xs font-mono bg-white"
                />
                <Button
                  type="button"
                  size="sm"
                  disabled={restoreConfirmation !== 'RESTORE' || Boolean(busy)}
                  onClick={() => run('restore', () => executeDataRestore(restoreId, { confirmation: restoreConfirmation, idempotencyKey: crypto.randomUUID() }))}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs h-9"
                >
                  Execute Restore
                </Button>
              </div>
            )}
          </div>

          {/* Right Column: Protected Records Card */}
          <div className="min-w-0 w-full">
            <ProtectedRecordsCard dynamicRecords={protectedRecords} />
          </div>
        </div>
      )}

      {/* TAB 3: DATA CLEANUP */}
      {!loading && !error && tab === 'cleanup' && (
        <div className="space-y-4 max-w-4xl">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-6 shadow-xs space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">Periodic Data Cleanup</h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Clean stale transient sessions, expired tokens, and obsolete failed capture records safely.
            </p>
          </div>

          <div className="grid gap-3">
            {[
              ['expired-refresh-tokens', 'Expired Refresh Tokens', 'Purges revoked and expired authentication refresh tokens.'],
              ['stale-sessions', 'Stale User Sessions', 'Invalidates abandoned web and mobile sessions.'],
              ['stale-failed-captures', 'Expired Failed Captures', 'Cleans unretryable failed data capture payloads.'],
              ['old-email-logs', 'Email Logs Older Than 180 Days', 'Archives historic notification dispatch logs.'],
              ['duplicate-leads', 'Duplicate Leads for Review', 'Surfaces identical lead entries without deleting them.'],
            ].map(([id, label, desc]) => (
              <div key={id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-bold text-slate-900">{label}</h3>
                  <p className="text-xs text-slate-500">{desc}</p>
                  {cleanup[id]?.records !== undefined && (
                    <span className="inline-block mt-1 text-xs font-semibold text-[#163A2E] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                      {cleanup[id].records} matching records
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={Boolean(busy)}
                    onClick={() => run('cleanup-preview', async () => {
                      const response = await previewDataCleanup(id);
                      setCleanup((current) => ({ ...current, [id]: dataOf(response) }));
                      return response;
                    })}
                    className="h-8 text-xs border-slate-200"
                  >
                    Preview
                  </Button>
                  {id !== 'duplicate-leads' && (
                    <Button
                      type="button"
                      size="sm"
                      disabled={Boolean(busy) || cleanupConfirmation !== 'CLEANUP'}
                      onClick={() => run('cleanup', () => executeDataCleanup({ operation: id, confirmation: 'CLEANUP', idempotencyKey: crypto.randomUUID() }))}
                      className="h-8 text-xs bg-rose-600 hover:bg-rose-700 text-white font-semibold"
                    >
                      Clean up
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-slate-200 bg-[#F7F9F8] p-4 space-y-2">
            <label className="block text-xs font-semibold text-slate-800">
              Type <code className="font-mono text-rose-600 font-bold bg-rose-50 px-1 py-0.5 rounded border border-rose-200">CLEANUP</code> to enable cleanup buttons
            </label>
            <Input
              placeholder="Type CLEANUP"
              value={cleanupConfirmation}
              onChange={(e) => setCleanupConfirmation(e.target.value)}
              className="h-9 text-xs font-mono max-w-xs bg-white"
            />
            <p className="text-[11px] text-slate-400">
              Payroll, invoices, expense claims, and system audit logs are never modified or purged by cleanup.
            </p>
          </div>
        </div>
      )}

      {/* TAB 4: IMPORT / EXPORT */}
      {!loading && !error && tab === 'transfer' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 min-w-0">
          {/* Export Modules Card */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-6 shadow-xs space-y-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">Export Application Data</h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Download live tenant data in CSV, Excel, or JSON formats.
              </p>
            </div>

            <div className="space-y-2.5">
              {['leads', 'attendance', 'leave', 'expenses', 'notifications', 'data-capture'].map((module) => (
                <div key={module} className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-[#F7F9F8]">
                  <span className="text-xs sm:text-sm font-bold text-slate-800 capitalize">
                    {module.replace('-', ' ')}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {['csv', 'excel', 'json'].map((format) => (
                      <button
                        key={format}
                        type="button"
                        onClick={() => saveFile(() => exportDataModule(module, format), `${module}.${format === 'excel' ? 'xls' : format}`)}
                        className="rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-xs font-bold text-[#163A2E] hover:bg-[#E8F1EC] transition-colors"
                      >
                        {format.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Import Leads Card */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-6 shadow-xs space-y-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">Import CRM Leads</h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                CSV header format: <code>title, firstName, lastName, email, phone</code>.
              </p>
            </div>

            <textarea
              className="w-full min-h-28 rounded-xl border border-slate-200 p-3 text-xs sm:text-sm font-mono focus:outline-none focus:ring-1 focus:ring-[#163A2E]"
              placeholder="title,firstName,lastName,email,phone"
              value={importCsv}
              onChange={(e) => {
                setImportCsv(e.target.value);
                setImportPreview(null);
              }}
            />

            <input
              type="file"
              accept=".csv,text/csv"
              className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#E8F1EC] file:text-[#163A2E] hover:file:bg-[#d9ece1] cursor-pointer"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setImportCsv(await file.text());
                setImportPreview(null);
              }}
            />

            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!importCsv || Boolean(busy)}
                onClick={() => run('import-preview', async () => {
                  const response = await previewDataImport(importCsv);
                  setImportPreview(dataOf(response));
                  return response;
                })}
                className="text-xs h-9"
              >
                Preview Import
              </Button>
            </div>

            {importPreview && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-xs space-y-1">
                <span className="font-bold text-emerald-950">
                  {importPreview.valid} rows valid, {importPreview.invalid} rejected.
                </span>
                {importPreview.unsupported && <p className="text-[11px] text-emerald-800">{importPreview.unsupported}</p>}
              </div>
            )}

            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="block text-xs font-semibold text-slate-800">
                Type <code className="font-mono text-emerald-700 font-bold bg-emerald-50 px-1 py-0.5 rounded border border-emerald-200">IMPORT</code> to confirm
              </label>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Type IMPORT"
                  value={importConfirmation}
                  onChange={(e) => setImportConfirmation(e.target.value)}
                  className="h-9 text-xs font-mono max-w-xs"
                />
                <Button
                  type="button"
                  size="sm"
                  disabled={!importPreview?.valid || importConfirmation !== 'IMPORT' || Boolean(busy)}
                  onClick={() => run('import', () => executeDataImport({ csv: importCsv, confirmation: importConfirmation, idempotencyKey: crypto.randomUUID() }))}
                  className="bg-[#163A2E] hover:bg-[#204C3D] text-white text-xs font-semibold h-9 shrink-0"
                >
                  Import Leads
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset Operations History Drawer */}
      {historyOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs"
          onClick={() => setHistoryOpen(false)}
        >
          <aside
            className="h-full w-full max-w-2xl overflow-y-auto bg-white p-5 sm:p-6 shadow-2xl space-y-4 animate-in slide-in-from-right duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-slate-100 text-[#163A2E] flex items-center justify-center">
                  <FontAwesomeIcon icon={faClockRotateLeft} className="size-4" />
                </div>
                <h2 className="text-base font-bold text-slate-900">Reset & Operations History</h2>
              </div>
              <button
                type="button"
                onClick={() => setHistoryOpen(false)}
                className="size-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                aria-label="Close history"
              >
                <FontAwesomeIcon icon={faXmark} className="size-4" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-xs">
                <thead className="text-[11px] uppercase text-slate-500 bg-slate-50 border-y border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Operation</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Records</th>
                    <th className="py-2.5 px-3">Backup ID</th>
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {history.map((item) => (
                    <tr key={`${item.id}-${item.createdAt}`} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-slate-900 block">{item.operationType}</span>
                        <span className="text-[10px] text-slate-400 line-clamp-1">
                          {Array.isArray(item.modules) && item.modules.length
                            ? item.modules.map((id) => modules.find((m) => m.id === id)?.name || id).join(', ')
                            : 'All modules'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${item.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono">
                        {item.operationType === 'DATA_RESET'
                          ? (item.verified ? item.recordsAffected ?? 0 : 'Unverified')
                          : item.recordsAffected ?? '—'}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                        {item.backupId || 'None'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">{stamp(item.createdAt)}</td>
                      <td className="py-2.5 px-3 text-slate-700">{item.requestedBy}</td>
                    </tr>
                  ))}
                  {!history.length && (
                    <tr>
                      <td className="py-6 text-center text-slate-400" colSpan={6}>
                        No administrative operations recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

// Helpers
function dataOf(response) {
  if (response && typeof response === 'object' && response.data && !Array.isArray(response.data)) return response.data;
  return response || {};
}

function listOf(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  return [];
}

function stamp(value) {
  if (!value) return 'Not available';
  return String(value).slice(0, 16).replace('T', ' ');
}

function formatBytes(bytes) {
  const size = Number(bytes || 0);
  if (!size) return '0 B';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}
