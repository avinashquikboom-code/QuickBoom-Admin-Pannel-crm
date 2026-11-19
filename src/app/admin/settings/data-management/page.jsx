'use client';

import * as React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClockRotateLeft, faDatabase, faDownload, faShieldHalved, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { suiteError } from '@/modules/suite/suite-api';
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

const TABS = [
  ['reset', 'Reset Data'],
  ['backup', 'Backup & Restore'],
  ['cleanup', 'Data Cleanup'],
  ['transfer', 'Import / Export'],
];

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
      } catch (err) {
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
        previewToken: preview.previewToken,
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
        toast.error('The reset was verified by the backend, but the refreshed database counts could not be loaded. Reload Data Management to confirm zero counts.');
        return;
      }
      const nonzeroModules = selected
        .map((id) => refreshedOverview.modules?.find((item) => item.id === id) || { id, name: id, records: null })
        .filter((item) => item.records !== (item.id === 'designations' ? Number(resetResult.preservedCounts?.designation || 0) : 0));
      if (nonzeroModules.length) {
        toast.error(`The reset committed, but fresh module counts are not zero for: ${nonzeroModules.map((item) => item.name).join(', ')}. Review the table counts and history.`);
        return;
      }
      toast.success(`Reset complete: ${resetResult.recordsDeleted} deleted; ${resetResult.recordsPreserved || 0} protected records preserved. Counts verified after commit.`);
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
  const resetEligibility = evaluateResetEligibility({
    busy: Boolean(busy),
    authorized: roles.includes('SUPER_ADMIN'),
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
    previewExpired,
    warnings,
    blockers,
    resolvedDependencies,
    unresolvedDependencies,
    confirmationValid,
    acknowledgementValid,
    globalConfirmationValid,
    disableReasons,
  } = resetEligibility;
  const resetDisabled = resetEligibility.disabled;

  return (
    <div className="max-w-none w-full min-w-0 space-y-5">
      <PageHeader
        category="SYSTEM MANAGEMENT"
        title="Data Management"
        description="Backup, reset or clean application data safely."
        rightContent={(
          <div className="flex size-16 items-center justify-center rounded-2xl bg-[#E8F1EC] text-[#163A2E] sm:size-20">
            <FontAwesomeIcon icon={faDatabase} className="size-7 sm:size-9" />
          </div>
        )}
      />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Stat label="Last Backup" value={stamp(overview?.lastBackup)} />
        <Stat label="Total Data" value={Number(overview?.tenantRecords || 0).toLocaleString()} />
        <Stat label="Database Size" value={overview?.databaseSize || '—'} />
        <Stat label="Database Health" value={overview?.health || '—'} />
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map(([id, label]) => (
          <button key={id} type="button" onClick={() => setTab(id)} className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${tab === id ? 'bg-[#163A2E] text-white' : 'bg-white text-[#172B24] border border-[#E2E8E5]'}`}>{label}</button>
        ))}
      </div>
      {loading && <Panel>Loading database information…</Panel>}
      {error && (
        <Panel>
          <p className="font-semibold text-[#DC2626]">Database information could not be loaded.</p>
          <p className="mt-1 text-sm text-[#718078]">{error}</p>
          <Button className="mt-3" onClick={reload}>Retry</Button>
        </Panel>
      )}
      {!loading && !error && tab === 'reset' && (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            <Panel>
              <h2 className="font-semibold text-[#172B24]">Reset selected modules</h2>
              <p className="mt-1 text-sm text-[#718078]">The preview lists the real tables and record counts. Reset requires a current preview, no unresolved blocking dependencies, and the exact confirmation phrases.</p>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-[#718078]">{selected.length} selected · {Number(preview?.estimatedRecords || 0).toLocaleString()} records in current preview</p>
                <div className="flex gap-2"><Button variant="outline" disabled={Boolean(busy)} onClick={() => { setSelected(modules.filter((item) => item.available).map((item) => item.id)); setPreview(null); }}>Select all</Button><Button variant="outline" disabled={Boolean(busy)} onClick={() => { setSelected([]); setPreview(null); }}>Clear</Button></div>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {modules.map((item) => (
                  <label key={item.id} className={`flex min-h-28 cursor-pointer items-start gap-3 rounded-2xl border p-4 text-sm transition-colors hover:border-[#9FB9AA] ${selected.includes(item.id) ? 'border-[#3C775B] bg-[#F1F7F3]' : 'border-[#E2E8E5] bg-white'} ${item.available ? '' : 'cursor-not-allowed opacity-60'}`}>
                    <input
                      type="checkbox"
                      className="mt-1"
                      disabled={!item.available}
                      checked={selected.includes(item.id)}
                      onChange={() => {
                        setScope('selected');
                        setPreview(null);
                        setSelected((current) => current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current, item.id]);
                      }}
                    />
                    <span>
                      <span className="font-medium text-[#172B24]">{item.name}</span>
                      <span className="mt-1 block text-xs font-semibold text-[#3C775B]">{Number(overview?.modules?.find((entry) => entry.id === item.id)?.records || 0).toLocaleString()} records · {item.tables?.length || 0} tables</span>
                      <span className="mt-0.5 block text-xs text-[#718078]">{item.available ? item.description : item.reason}</span>
                    </span>
                  </label>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button disabled={Boolean(busy) || !selected.length} onClick={() => run('preview', async () => {
                  const response = await previewDataReset({ modules: selected, scope: 'selected' });
                  setPreview(dataOf(response));
                  return response;
                })}>Preview selected reset</Button>
              </div>
            </Panel>
            <Panel>
              <h2 className="font-semibold text-[#DC2626]">Reset entire application data</h2>
              <p className="mt-1 text-sm text-[#718078]">This deletes every approved business module for the signed-in tenant. Accounts, roles, integrations, audit logs, and migration history stay.</p>
              <Button className="mt-3" variant="outline" disabled={Boolean(busy)} onClick={() => {
                const ids = modules.filter((item) => item.available).map((item) => item.id);
                setSelected(ids);
                setScope('application');
                setPreview(null);
                run('preview', async () => {
                  const response = await previewDataReset({ modules: ids, scope: 'application' });
                  setPreview(dataOf(response));
                  return response;
                });
              }}>Preview full tenant reset</Button>
              <div className="mt-4 rounded-xl bg-[#F7F9F8] p-3 text-sm">
                <p className="font-medium">Every tenant</p>
                <p className="mt-1 text-[#718078]">A global reset requires three confirmations. It does not drop the schema or remove protected records.</p>
                <Button className="mt-3" variant="outline" disabled={Boolean(busy)} onClick={() => {
                  setScope('global');
                  setPreview(null);
                  run('preview', async () => {
                    const response = await previewDataReset({ scope: 'global' });
                    setPreview(dataOf(response));
                    return response;
                  });
                }}>Preview global reset</Button>
              </div>
            </Panel>
            {preview && (
              <Panel>
                <h2 className="font-semibold">Reset preview</h2>
                <p className="mt-1 text-sm text-[#718078]">{Number(preview.totalEligibleRecords ?? preview.estimatedRecords ?? 0).toLocaleString()} eligible for deletion · {Number(preview.totalPreservedRecords || 0).toLocaleString()} preserved · {preview.tables?.length || 0} unique tables.</p>
                <p className="mt-3 text-sm font-medium">Selected modules</p>
                <ul className="mt-1 space-y-1 text-sm">{(preview.modules || []).map((item) => <li key={item.id} className="flex justify-between gap-3"><span>{item.name}</span><span>{Number(item.records || 0).toLocaleString()} module records</span></li>)}</ul>
                <p className="mt-3 text-xs text-[#718078]">The eligible total below counts each selected table once; module subtotals can overlap.</p>
                <ul className="mt-3 max-h-48 space-y-1 overflow-auto text-sm">
                  {(preview.tables || []).map((table) => <li key={table.model} className="flex justify-between gap-3"><span>{table.label}{table.preservedRecords ? ` (${table.preservedRecords} preserved)` : ''}</span><span>{Number(table.eligibleRecords ?? table.records).toLocaleString()} eligible · {Number(table.records).toLocaleString()} total</span></li>)}
                </ul>
                <p className="mt-3 text-xs text-[#718078]">{(preview.dependencies || []).join(' ')}</p>
                {preview.customerBreakdown && (selected.includes('customers') || selected.includes('sales-crm')) && (
                  <div className="mt-4 rounded-xl border border-[#B7DCC4] bg-[#F7FAF8] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-[#163A2E]">Customer Data Reset Breakdown</p>
                        <p className="text-xs text-[#527063]">Detailed record breakdown across customer business entities and lifecycle stages</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCustomerBreakdownOpen((open) => !open)}
                        className="rounded-lg border border-[#C5D8CD] bg-white px-3 py-1 text-xs font-semibold text-[#163A2E] shadow-sm hover:bg-[#EEF5F1]"
                      >
                        {customerBreakdownOpen ? 'Collapse breakdown ▲' : 'Expand breakdown ▼'}
                      </button>
                    </div>
                    {customerBreakdownOpen && (
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        {Object.entries(preview.customerBreakdown).map(([key, category]) => (
                          <div key={key} className="rounded-lg border border-[#DCE8E1] bg-white p-3 text-xs shadow-sm">
                            <div className="flex items-center justify-between border-b border-[#E8F0EC] pb-2">
                              <span className="font-semibold text-[#172B24]">{category.label}</span>
                              <span className="rounded-full bg-[#EBF3EE] px-2 py-0.5 text-[11px] font-medium text-[#2E6047]">
                                {Number(category.eligible || 0).toLocaleString()} eligible
                              </span>
                            </div>
                            <p className="mt-1 text-[11px] text-[#718078]">{category.description}</p>
                            <div className="mt-2 grid grid-cols-3 gap-2 text-center text-[#475467]">
                              <div className="rounded bg-[#F8FAF9] p-1.5">
                                <span className="block text-[10px] text-[#718078]">Total</span>
                                <span className="font-semibold text-[#172B24]">{Number(category.total || 0).toLocaleString()}</span>
                              </div>
                              <div className="rounded bg-[#F0FDF4] p-1.5">
                                <span className="block text-[10px] text-[#16A34A]">Eligible</span>
                                <span className="font-semibold text-[#16A34A]">{Number(category.eligible || 0).toLocaleString()}</span>
                              </div>
                              <div className="rounded bg-[#FEF2F2] p-1.5">
                                <span className="block text-[10px] text-[#DC2626]">Preserved</span>
                                <span className="font-semibold text-[#DC2626]">{Number(category.preserved || 0).toLocaleString()}</span>
                              </div>
                            </div>
                            {category.details && (
                              <p className="mt-2 text-[11px] font-medium text-[#527063]">{category.details}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {!!preview.preservation?.length && <div className="mt-3 rounded-xl border border-[#D8DEE8] bg-[#F7F8FA] p-3">
                  <p className="text-sm font-semibold text-[#344054]">Preserved records</p>
                  <ul className="mt-1 space-y-2 text-xs text-[#475467]">{preview.preservation.map((item) => <li key={`preserved-${item.model}`}><span className="font-semibold">{item.label}: {Number(item.records).toLocaleString()} protected records remain.</span> {item.reason}{item.roleOwnership ? <><span className="block">Ownership: {item.roleOwnership.system} system, {item.roleOwnership.tenant} current tenant, {item.roleOwnership.otherTenant} other tenant. Types: {Object.entries(item.roleTypes || {}).map(([type, count]) => `${type} ${count}`).join(', ') || 'not classified'}.</span><ul className="mt-1 list-inside list-disc">{(item.roles || []).map((role) => <li key={role.id}>#{role.id} {role.name} · {role.type} · {role.owner}</li>)}</ul></> : null}</li>)}</ul>
                </div>}
                {!!preview.dependencyWarnings?.length && <div className="mt-3 space-y-3">
                  {resolvedDependencies.length > 0 && <div className="rounded-xl border border-[#B7DCC4] bg-[#F1F8F3] p-3">
                    <p className="text-sm font-semibold text-[#24613D]">Same-tenant dependencies handled by this reset</p>
                    <ul className="mt-1 space-y-1 text-xs text-[#315B40]">{resolvedDependencies.map((item) => (
                      <li key={`resolved-${item.module}-${item.model}`} className="flex flex-wrap items-center justify-between gap-2 border-b border-[#D4EBDC] py-1 last:border-0">
                        <span>
                          <strong className="font-semibold">{item.label}</strong> ({item.resolutionModule?.name || item.module}): {Number(item.resolvedRecords || (!item.blocking ? item.records : 0)).toLocaleString()} same-tenant references
                        </span>
                        <span className="rounded-full bg-[#E3F2E9] px-2 py-0.5 font-medium text-[#1E5636]">
                          {item.willSetNull ? 'Cleared (Set Null) · Records Intact' : item.includedInSelectedModule ? 'Deleted with Selected Module' : 'Safe for Reset'}
                        </span>
                        {item.diagnosticRecordIds?.length > 0 && <span className="w-full text-[11px] text-[#718078]">Same-tenant Salary Structure IDs: {item.diagnosticRecordIds.map((id) => `#${id}`).join(', ')}</span>}
                      </li>
                    ))}</ul>
                  </div>}
                  {unresolvedDependencies.length > 0 && <div className="rounded-xl border border-[#F3D4A6] bg-[#FFFAF0] p-4">
                    <div className="flex items-center gap-2">
                      <FontAwesomeIcon icon={faTriangleExclamation} className="size-4 text-[#92400E]" />
                      <p className="text-sm font-semibold text-[#92400E]">Unresolved blockers ({unresolvedDependencies.length})</p>
                    </div>
                    <p className="mt-1 text-xs text-[#78350F]">The following dependencies prevent data reset. Resolve all blocking items to enable execution.</p>
                    <div className="mt-3 space-y-3">{unresolvedDependencies.map((item) => {
                      const total = Number(item.records || 0);
                      const crossTenant = Number(item.crossTenantRecords || 0);
                      const sameTenant = Number(item.sameTenantRecords ?? Math.max(0, total - crossTenant));
                      const resolved = Number(item.resolvedRecords || 0);
                      const unresolved = Number(item.unresolvedRecords ?? (crossTenant || Math.max(0, total - resolved)));
                      const moduleName = item.resolutionModule?.name || item.module || item.parent || 'System';
                      const isProtected = item.policy === 'protected' || /protected/i.test(item.label || '');
                      const reason = item.reason || (isProtected
                        ? 'Protected system record; excluded from deletion to prevent orphaned data or security violations.'
                        : crossTenant > 0
                          ? `${crossTenant.toLocaleString()} cross-tenant reference${crossTenant === 1 ? '' : 's'} belong to other tenant-owned records.`
                          : item.policy === 'cascade' && !item.includedInSelectedModule
                            ? `Dependent records in ${moduleName} are not selected for deletion.`
                            : 'Unresolved dependency requires administrative action.');
                      const action = item.recommendedAction || (isProtected
                        ? 'Leave the protected module out of this reset or manage references through authorized administrative tools.'
                        : crossTenant > 0
                          ? 'The administrator of each owning tenant must reassign or remove the employee reference; this reset will leave those records unchanged.'
                          : item.policy === 'cascade' && !item.includedInSelectedModule
                            ? `Select the checkbox for ${item.resolutionModule?.name || moduleName} to include and delete these dependent records together.`
                            : 'Resolve all dependent references before executing reset.');
                      const owningTenantInfo = item.owningTenantInfo || (crossTenant > 0 ? 'Other Tenant Accounts' : null);

                      return (
                        <div key={`blocked-${item.module}-${item.model}`} className="rounded-lg border border-[#E5C38E] bg-white p-3 text-xs shadow-sm">
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#F0E4D2] pb-2">
                            <span className="font-semibold text-[#172B24]">{item.label}</span>
                            <span className="rounded-full bg-[#FEF3C7] px-2.5 py-0.5 font-medium text-[#92400E]">
                              Module: {moduleName}
                            </span>
                          </div>
                          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-5 text-[#475467]">
                            <div><span className="block text-[11px] text-[#718078]">Total References</span><span className="font-semibold text-[#172B24]">{total.toLocaleString()}</span></div>
                            <div><span className="block text-[11px] text-[#718078]">Same-Tenant</span><span className="font-medium text-[#163A2E]">{sameTenant.toLocaleString()}</span></div>
                            <div><span className="block text-[11px] text-[#718078]">Cross-Tenant</span><span className="font-medium text-[#DC2626]">{crossTenant.toLocaleString()}</span></div>
                            <div><span className="block text-[11px] text-[#718078]">Resolved</span><span className="font-medium text-[#16A34A]">{resolved.toLocaleString()}</span></div>
                            <div><span className="block text-[11px] text-[#718078]">Unresolved</span><span className="font-semibold text-[#DC2626]">{unresolved.toLocaleString()}</span></div>
                          </div>
                          <div className="mt-2 space-y-1 border-t border-[#F0E4D2] pt-2">
                            {item.diagnosticRecordIds?.length > 0 && <p><strong className="text-[#78350F]">Same-tenant Salary Structure IDs:</strong> {item.diagnosticRecordIds.map((id) => `#${id}`).join(', ')}</p>}
                            <p><strong className="text-[#78350F]">Reason:</strong> {reason}</p>
                            {owningTenantInfo && <p><strong className="text-[#78350F]">Owning Tenant:</strong> {owningTenantInfo}</p>}
                            <p><strong className="text-[#163A2E]">Recommended Action:</strong> {action}</p>
                          </div>
                        </div>
                      );
                    })}</div>
                  </div>}
                </div>}
              </Panel>
            )}
            <Panel>
              <label className="block text-sm font-medium">Reset reason (optional)</label>
              <Input className="mt-1" placeholder="Reason" value={reason} onChange={(event) => setReason(event.target.value)} />
              <label className="mt-3 block text-sm font-medium">Type <code>RESET</code> to confirm</label>
              <Input className="mt-1" aria-label="Type RESET to confirm" placeholder="RESET" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} />
              {scope !== 'selected' && <><label className="mt-3 block text-sm font-medium">Type <code>RESET ALL DATA</code> for a full reset</label><Input className="mt-1" aria-label="Type RESET ALL DATA" placeholder="RESET ALL DATA" value={acknowledgement} onChange={(event) => setAcknowledgement(event.target.value)} /></>}
              {scope === 'global' && <><label className="mt-3 block text-sm font-medium">Type <code>RESET GLOBAL</code> for every tenant</label><Input className="mt-1" aria-label="Type RESET GLOBAL" placeholder="RESET GLOBAL" value={globalConfirmation} onChange={(event) => setGlobalConfirmation(event.target.value)} /></>}
              <p className="mt-3 text-sm text-[#DC2626]">This operation will permanently delete the selected application data. This action cannot be undone.</p>
              {disableReasons.length > 0 && <ul className="mt-3 space-y-1 text-xs text-[#718078]">{disableReasons.map((item) => <li key={item}>{item}</li>)}</ul>}
              <Button className="mt-3 w-full sm:w-auto" disabled={resetDisabled} onClick={runVerifiedReset}>Execute reset</Button>
            </Panel>
            {result?.operationId && <Result result={result} />}
          </div>
          <ProtectedList records={protectedRecords} counts={preview?.protectedCounts} />
        </div>
      )}
      {!loading && !error && tab === 'backup' && (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <Panel>
            <h2 className="font-semibold">Create backup</h2>
            <p className="mt-1 text-sm text-[#718078]">A backup is a checksum-verified snapshot of the selected tenant tables. It does not include passwords, integration secrets, or the migration history.</p>
            <Input className="mt-3" placeholder="Backup name" value={backupName} onChange={(event) => setBackupName(event.target.value)} />
            <Input className="mt-3" placeholder="Description" value={backupDescription} onChange={(event) => setBackupDescription(event.target.value)} />
            <div className="mt-3 flex flex-wrap gap-2">
              <Button disabled={Boolean(busy)} onClick={() => run('backup', () => createDataBackup({
                name: backupName || 'Manual backup',
                description: backupDescription,
                modules: selected.length ? selected : modules.filter((item) => item.available).map((item) => item.id),
              }))}>Create Backup Now</Button>
              <Button variant="outline" disabled={Boolean(busy)} onClick={() => run('backup', () => createDataBackup({
                name: backupName || 'Global backup',
                description: backupDescription || 'Every tenant',
                scope: 'global',
              }))}>Create global backup</Button>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="text-xs uppercase text-[#718078]"><tr><th className="py-2">Name</th><th>Status</th><th>Size</th><th>Created</th><th>By</th><th className="text-right">Actions</th></tr></thead>
                <tbody>
                  {backups.map((item) => (
                    <tr key={item.id} className="border-t border-[#E2E8E5]">
                      <td className="py-2 pr-3">{item.name}</td>
                      <td>{item.status}</td>
                      <td>{formatBytes(item.size)}</td>
                      <td>{stamp(item.createdAt)}</td>
                      <td>{item.createdBy}</td>
                      <td className="space-x-2 py-2 text-right">
                        <button type="button" className="font-medium text-[#163A2E]" onClick={() => run('verify', () => verifyDataBackup(item.id))}>Verify</button>
                        <button type="button" className="font-medium text-[#163A2E]" onClick={() => saveFile(() => downloadDataBackup(item.id), `qb-backup-${item.id}.json.gz`)}>Download</button>
                        <button type="button" className="font-medium text-[#163A2E]" onClick={() => run('restore-preview', async () => {
                          const response = await previewDataRestore(item.id);
                          setRestoreId(item.id);
                          setRestorePreview(dataOf(response));
                          return response;
                        })}>Restore</button>
                      </td>
                    </tr>
                  ))}
                  {!backups.length && <tr><td className="py-3 text-[#718078]" colSpan={6}>No backups yet.</td></tr>}
                </tbody>
              </table>
            </div>
            {restorePreview && (
              <div className="mt-4 rounded-xl border border-[#E2E8E5] p-3">
                <p className="font-medium">Restore {restorePreview.estimatedRecords} records from {restoreId}</p>
                <p className="mt-1 text-sm text-[#718078]">A new backup is created before any current rows are replaced. Type RESTORE to continue.</p>
                <Input className="mt-3" placeholder="Type RESTORE" value={restoreConfirmation} onChange={(event) => setRestoreConfirmation(event.target.value)} />
                <Button className="mt-3" disabled={restoreConfirmation !== 'RESTORE' || Boolean(busy)} onClick={() => run('restore', () => executeDataRestore(restoreId, { confirmation: restoreConfirmation, idempotencyKey: crypto.randomUUID() }))}>Execute restore</Button>
              </div>
            )}
          </Panel>
          <QuickActions busy={busy} latest={latestBackup} onBackup={() => run('backup', () => createDataBackup({ name: backupName || 'Manual backup' }))} onDownload={() => latestBackup && saveFile(() => downloadDataBackup(latestBackup.id), `qb-backup-${latestBackup.id}.json.gz`)} onHistory={() => setHistoryOpen(true)} />
        </div>
      )}
      {!loading && !error && tab === 'cleanup' && (
        <div className="grid gap-3">
          {[
            ['expired-refresh-tokens', 'Expired refresh tokens'],
            ['stale-sessions', 'Stale sessions'],
            ['stale-failed-captures', 'Expired failed captures'],
            ['old-email-logs', 'Email logs older than 180 days'],
            ['duplicate-leads', 'Duplicate leads for review'],
          ].map(([id, label]) => (
            <Panel key={id}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-semibold">{label}</h2>
                  <p className="text-sm text-[#718078]">{cleanup[id]?.records ?? 'Preview to see the record count.'} {id === 'duplicate-leads' ? 'matching leads. They are not deleted.' : ''}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" disabled={Boolean(busy)} onClick={() => run('cleanup-preview', async () => {
                    const response = await previewDataCleanup(id);
                    setCleanup((current) => ({ ...current, [id]: dataOf(response) }));
                    return response;
                  })}>Preview</Button>
                  {id !== 'duplicate-leads' && <Button disabled={Boolean(busy) || cleanupConfirmation !== 'CLEANUP'} onClick={() => run('cleanup', () => executeDataCleanup({ operation: id, confirmation: 'CLEANUP', idempotencyKey: crypto.randomUUID() }))}>Clean up</Button>}
                </div>
              </div>
            </Panel>
          ))}
          <Input placeholder="Type CLEANUP to enable cleanup" value={cleanupConfirmation} onChange={(event) => setCleanupConfirmation(event.target.value)} />
          <p className="text-sm text-[#718078]">Payroll, invoices, claims, loans, and audit logs are not removed by cleanup.</p>
        </div>
      )}
      {!loading && !error && tab === 'transfer' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel>
            <h2 className="font-semibold">Export</h2>
            <p className="mt-1 text-sm text-[#718078]">Exports use the live tenant records for leads, attendance, leave, expenses, notifications, and data capture.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {['leads', 'attendance', 'leave', 'expenses', 'notifications', 'data-capture'].map((module) => (
                <div key={module} className="flex flex-wrap gap-2 rounded-xl border border-[#E2E8E5] p-2">
                  <span className="px-1 py-1 text-sm font-medium capitalize">{module.replace('-', ' ')}</span>
                  {['csv', 'excel', 'json'].map((format) => (
                    <button key={format} type="button" className="rounded-lg bg-[#E8F1EC] px-2 py-1 text-xs font-semibold text-[#163A2E]" onClick={() => saveFile(() => exportDataModule(module, format), `${module}.${format === 'excel' ? 'xls' : format}`)}>{format.toUpperCase()}</button>
                  ))}
                </div>
              ))}
            </div>
          </Panel>
          <Panel>
            <h2 className="font-semibold">Import leads</h2>
            <p className="mt-1 text-sm text-[#718078]">CSV columns: title, firstName, lastName, email, phone. Invalid and duplicate rows are skipped. Other modules are not imported.</p>
            <textarea className="mt-3 min-h-32 w-full rounded-xl border border-[#E2E8E5] p-3 text-sm" placeholder="title,firstName,lastName,email,phone" value={importCsv} onChange={(event) => { setImportCsv(event.target.value); setImportPreview(null); }} />
            <input className="mt-3 block w-full text-sm" type="file" accept=".csv,text/csv" onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              setImportCsv(await file.text());
              setImportPreview(null);
            }} />
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="outline" disabled={!importCsv || Boolean(busy)} onClick={() => run('import-preview', async () => {
                const response = await previewDataImport(importCsv);
                setImportPreview(dataOf(response));
                return response;
              })}>Preview import</Button>
            </div>
            {importPreview && <p className="mt-3 text-sm">{importPreview.valid} valid, {importPreview.invalid} rejected. {importPreview.unsupported}</p>}
            {importPreview && (
              <ul className="mt-2 max-h-40 overflow-auto text-xs text-[#718078]">
                {importPreview.rows.filter((row) => row.errors.length).slice(0, 20).map((row) => <li key={row.row}>Row {row.row}: {row.errors.join(', ')}</li>)}
              </ul>
            )}
            <Input className="mt-3" placeholder="Type IMPORT" value={importConfirmation} onChange={(event) => setImportConfirmation(event.target.value)} />
            <Button className="mt-3" disabled={!importPreview?.valid || importConfirmation !== 'IMPORT' || Boolean(busy)} onClick={() => run('import', () => executeDataImport({ csv: importCsv, confirmation: importConfirmation, idempotencyKey: crypto.randomUUID() }))}>Import valid leads</Button>
          </Panel>
        </div>
      )}
      {historyOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={() => setHistoryOpen(false)}>
          <aside className="h-full w-full max-w-xl overflow-auto bg-white p-4 shadow-xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 font-semibold"><FontAwesomeIcon icon={faClockRotateLeft} /> Reset history</h2>
              <button type="button" onClick={() => setHistoryOpen(false)}>Close</button>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="text-xs uppercase text-[#718078]"><tr><th>Operation</th><th>Status</th><th>Records</th><th>Backup</th><th>When</th><th>By</th></tr></thead>
                <tbody>
                  {history.map((item) => (
                    <tr key={`${item.id}-${item.createdAt}`} className="border-t border-[#E2E8E5]">
                      <td className="py-2 pr-2">{item.operationType}<div className="text-xs text-[#718078]">{Array.isArray(item.modules) && item.modules.length ? item.modules.map((id) => modules.find((module) => module.id === id)?.name || id).join(', ') : 'Module details unavailable'}</div></td>
                      <td>{item.status}{item.failureReason ? <div className="text-xs text-[#DC2626]">{item.failureReason}</div> : null}</td>
                      <td>{item.operationType === 'DATA_RESET' ? (item.verified ? item.recordsAffected ?? 0 : 'Unverified') : item.recordsAffected ?? '—'}</td>
                      <td>{item.backupId || 'No backup recorded'}</td>
                      <td>{stamp(item.createdAt)}</td>
                      <td>{item.requestedBy}</td>
                    </tr>
                  ))}
                  {!history.length && <tr><td className="py-3 text-[#718078]" colSpan={6}>No operations recorded.</td></tr>}
                </tbody>
              </table>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

function Panel({ children }) {
  return <section className="min-w-0 rounded-2xl border border-[#E2E8E5] bg-white p-4 shadow-sm">{children}</section>;
}
function Stat({ label, value }) {
  return <div className="rounded-2xl border border-[#E2E8E5] bg-white p-4 shadow-sm"><p className="text-xs font-semibold uppercase tracking-wide text-[#718078]">{label}</p><p className="mt-2 text-2xl font-bold text-[#163A2E]">{value}</p></div>;
}
function Info({ label, value }) {
  return <div><dt className="text-[#718078]">{label}</dt><dd className="font-medium text-[#172B24]">{value || 'Not available'}</dd></div>;
}
function ProtectedList({ records, counts }) {
  return (
    <Panel>
      <h2 className="flex items-center gap-2 font-semibold"><FontAwesomeIcon icon={faShieldHalved} className="text-[#163A2E]" /> Protected records</h2>
      {counts && <div className="mt-3 space-y-3 text-sm">
        {[['System-critical', counts.systemCritical], ['Remaining tenant configuration', counts.remainingTenantConfiguration]].map(([label, group]) => (
          <div key={label} className="rounded-xl bg-[#F1F7F3] p-3">
            <div className="flex justify-between gap-3 font-semibold"><span>{label}</span><span>{Number(group?.records || 0).toLocaleString()} protected rows</span></div>
            <ul className="mt-2 space-y-1 text-xs text-[#718078]">{Object.entries(group?.tables || {}).map(([table, value]) => <li key={table} className="flex justify-between gap-3"><span>{table}</span><span>{Number(value).toLocaleString()}</span></li>)}</ul>
          </div>
        ))}
        <p className="text-xs text-[#718078]">{counts.note}</p>
      </div>}
      <ul className="mt-3 space-y-2 text-sm text-[#172B24]">{records.map((item) => <li key={item}>{item}</li>)}</ul>
    </Panel>
  );
}
function QuickActions({ busy, latest, onBackup, onDownload, onHistory }) {
  return (
    <Panel>
      <h2 className="font-semibold">Quick actions</h2>
      <div className="mt-3 grid gap-2">
        <Button disabled={Boolean(busy)} onClick={onBackup}>{busy === 'backup' ? 'Creating backup…' : 'Create Backup Now'}</Button>
        <Button variant="outline" disabled={!latest || Boolean(busy)} onClick={onDownload}><FontAwesomeIcon icon={faDownload} /> Download Latest Backup</Button>
        <Button variant="outline" onClick={onHistory}><FontAwesomeIcon icon={faClockRotateLeft} /> View Reset History</Button>
      </div>
      {!latest && <p className="mt-3 flex items-start gap-2 text-xs text-[#D97706]"><FontAwesomeIcon icon={faTriangleExclamation} className="mt-0.5" /> No verified backups are available yet.</p>}
    </Panel>
  );
}
function Result({ result }) {
  return (
    <Panel>
      <h2 className="font-semibold text-[#172B24]">Operation {result.operationId}</h2>
      <p className="mt-1 text-sm text-[#475467]">
        Status: <span className="font-semibold text-[#16A34A]">{result.status}</span>
        {result.verified ? ' · Database verification passed' : ''}. Deleted: {Number(result.recordsDeleted ?? result.recordsRestored ?? result.recordsCreated ?? 0).toLocaleString()} records
        {result.recordsPreserved ? ` · Preserved: ${Number(result.recordsPreserved).toLocaleString()}` : ''}
        {result.preRestoreBackupId ? ` · Pre-restore backup: ${result.preRestoreBackupId}` : ''}
      </p>
      {result.verified && result.countsAfter ? (
        <div className="mt-3">
          <p className="text-sm font-medium text-[#172B24]">Remaining records after commit</p>
          <ul className="mt-1 grid gap-1 text-sm text-[#718078] sm:grid-cols-2">
            {Object.entries(result.countsAfter).map(([table, count]) => {
              const expectedPreserved = table === 'designation' ? Number(result.preservedCounts?.designation || 0) : 0;
              const verifiedCount = count === expectedPreserved;
              return (
                <li key={table} className="flex justify-between gap-3">
                  <span>{table}{table === 'designation' && count > 0 ? ' (protected links preserved)' : ''}</span>
                  <span className={verifiedCount ? 'font-semibold text-[#247047]' : 'font-semibold text-[#DC2626]'}>{count}</span>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
      {result.failures?.length ? <p className="mt-2 text-sm text-[#DC2626]">{result.failures.join(' ')}</p> : null}
    </Panel>
  );
}
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
