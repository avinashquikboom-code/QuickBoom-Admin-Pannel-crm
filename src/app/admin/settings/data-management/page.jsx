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

const TABS = [
  ['database', 'Database Management'],
  ['reset', 'Reset Data'],
  ['backup', 'Backup & Restore'],
  ['cleanup', 'Data Cleanup'],
  ['transfer', 'Import / Export'],
];

export default function DataManagementPage() {
  const [tab, setTab] = React.useState('database');
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
  const [backupId, setBackupId] = React.useState('');
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

  const reload = React.useCallback(async () => {
    setLoading(true);
    try {
      const [overviewResponse, moduleResponse, backupResponse, historyResponse] = await Promise.all([
        loadDataOverview(),
        loadDataModules(),
        loadDataBackups(),
        loadDataOperations(),
      ]);
      setOverview(dataOf(overviewResponse));
      const modulePayload = dataOf(moduleResponse);
      setModules(modulePayload.modules || []);
      setProtectedRecords(modulePayload.protected || []);
      setBackups(listOf(backupResponse));
      setHistory(listOf(historyResponse));
      setError('');
    } catch (err) {
      setOverview(null);
      setError(suiteError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { reload(); }, [reload]);

  const verifiedBackups = backups.filter((item) => item.status === 'VERIFIED');
  const latestBackup = verifiedBackups[0];

  async function run(label, action) {
    setBusy(label);
    try {
      const response = await action();
      setResult(dataOf(response));
      toast.success('Operation completed');
      await reload();
      return dataOf(response);
    } catch (err) {
      toast.error(suiteError(err));
      return null;
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

  return (
    <div className="mx-auto min-w-0 max-w-7xl space-y-5">
      <PageHeader
        category="SYSTEM MANAGEMENT"
        title="Data Management"
        description="Manage, reset and restore application database data from the admin panel."
        rightContent={(
          <div className="flex size-16 items-center justify-center rounded-2xl bg-[#E8F1EC] text-[#163A2E] sm:size-20">
            <FontAwesomeIcon icon={faDatabase} className="size-7 sm:size-9" />
          </div>
        )}
      />
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
      {!loading && !error && tab === 'database' && (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="grid gap-3 sm:grid-cols-2">
            <Stat label="Total Records" value={overview?.tenantRecords ?? '—'} />
            <Stat label="Total Tables" value={overview?.totalTables ?? '—'} />
            <Stat label="Database Size" value={overview?.databaseSize || '—'} />
            <Stat label="Last Backup" value={stamp(overview?.lastBackup)} />
            <div className="rounded-2xl border border-[#E2E8E5] bg-white p-4 shadow-sm sm:col-span-2">
              <h2 className="font-semibold text-[#172B24]">Database information</h2>
              <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                <Info label="Database type" value={overview?.databaseType} />
                <Info label="Database name" value={overview?.databaseName} />
                <Info label="Health" value={overview?.health} />
                <Info label="Last reset" value={stamp(overview?.lastReset)} />
              </dl>
            </div>
          </div>
          <QuickActions
            busy={busy}
            latest={latestBackup}
            onBackup={() => run('backup', () => createDataBackup({ name: 'Manual backup', modules: modules.filter((item) => item.available).map((item) => item.id) }))}
            onDownload={() => latestBackup && saveFile(() => downloadDataBackup(latestBackup.id), `qb-backup-${latestBackup.id}.json.gz`)}
            onHistory={() => setHistoryOpen(true)}
          />
        </div>
      )}
      {!loading && !error && tab === 'reset' && (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            <Panel>
              <h2 className="font-semibold text-[#172B24]">Reset selected modules</h2>
              <p className="mt-1 text-sm text-[#718078]">The preview lists the real tables and record counts. Nothing is deleted until a verified backup and the confirmation both succeed.</p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {modules.map((item) => (
                  <label key={item.id} className={`flex min-h-11 items-start gap-2 rounded-xl border p-3 text-sm ${item.available ? 'border-[#E2E8E5]' : 'border-dashed border-[#E2E8E5] text-[#718078]'}`}>
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
              <p className="mt-1 text-sm text-[#718078]">This deletes every approved business module for the signed-in tenant. Accounts, roles, employees, salary structures, integrations, audit logs, and migration history stay.</p>
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
                <p className="mt-1 text-[#718078]">A global reset needs a verified global backup and three confirmations. It still does not drop the schema or remove protected records.</p>
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
                <p className="mt-1 text-sm text-[#718078]">{preview.estimatedRecords} records across {preview.tables?.length || 0} tables. Backup: {preview.backupStatus?.verified ? preview.backupStatus.backupId : 'not verified'}</p>
                <ul className="mt-3 max-h-48 space-y-1 overflow-auto text-sm">
                  {(preview.tables || []).map((table) => <li key={table.model} className="flex justify-between gap-3"><span>{table.label}</span><span>{table.records}</span></li>)}
                </ul>
                <p className="mt-3 text-xs text-[#718078]">{(preview.dependencies || []).join(' ')}</p>
              </Panel>
            )}
            <Panel>
              <label className="block text-sm font-medium">Verified backup</label>
              <select className="mt-1 h-10 w-full rounded-lg border border-[#E2E8E5] px-3 text-sm" value={backupId} onChange={(event) => setBackupId(event.target.value)}>
                <option value="">Select a backup</option>
                {verifiedBackups.map((item) => <option key={item.id} value={item.id}>{item.name} · {stamp(item.createdAt)}</option>)}
              </select>
              <Input className="mt-3" placeholder="Reason" value={reason} onChange={(event) => setReason(event.target.value)} />
              <Input className="mt-3" placeholder="Type RESET" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} />
              {scope !== 'selected' && <Input className="mt-3" placeholder="Type RESET ALL DATA" value={acknowledgement} onChange={(event) => setAcknowledgement(event.target.value)} />}
              {scope === 'global' && <Input className="mt-3" placeholder="Type RESET GLOBAL" value={globalConfirmation} onChange={(event) => setGlobalConfirmation(event.target.value)} />}
              <p className="mt-3 text-sm text-[#DC2626]">This operation will permanently delete the selected application data. This action cannot be undone.</p>
              <Button className="mt-3 w-full sm:w-auto" disabled={Boolean(busy) || !preview || confirmation !== 'RESET'} onClick={() => run('reset', () => executeDataReset({
                modules: selected,
                scope,
                previewToken: preview.previewToken,
                backupId,
                confirmation,
                acknowledgement,
                globalConfirmation,
                idempotencyKey: crypto.randomUUID(),
                reason,
              }))}>Execute reset</Button>
            </Panel>
            {result?.operationId && <Result result={result} />}
          </div>
          <ProtectedList records={protectedRecords} />
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
                <thead className="text-xs uppercase text-[#718078]"><tr><th className="py-2">Name</th><th>Status</th><th>Size</th><th>Created</th><th>By</th><th></th></tr></thead>
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
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="text-xs uppercase text-[#718078]"><tr><th>Operation</th><th>Status</th><th>Records</th><th>When</th><th>By</th></tr></thead>
                <tbody>
                  {history.map((item) => (
                    <tr key={`${item.id}-${item.createdAt}`} className="border-t border-[#E2E8E5]">
                      <td className="py-2 pr-2">{item.operationType}<div className="text-xs text-[#718078]">{Array.isArray(item.modules) ? item.modules.join(', ') : item.modules}</div></td>
                      <td>{item.status}{item.failureReason ? <div className="text-xs text-[#DC2626]">{item.failureReason}</div> : null}</td>
                      <td>{item.recordsAffected}</td>
                      <td>{stamp(item.createdAt)}</td>
                      <td>{item.requestedBy}</td>
                    </tr>
                  ))}
                  {!history.length && <tr><td className="py-3 text-[#718078]" colSpan={5}>No operations recorded.</td></tr>}
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
function ProtectedList({ records }) {
  return (
    <Panel>
      <h2 className="flex items-center gap-2 font-semibold"><FontAwesomeIcon icon={faShieldHalved} className="text-[#163A2E]" /> Protected records</h2>
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
      {!latest && <p className="mt-3 flex items-start gap-2 text-xs text-[#D97706]"><FontAwesomeIcon icon={faTriangleExclamation} className="mt-0.5" /> A reset stays disabled until a backup verifies.</p>}
    </Panel>
  );
}
function Result({ result }) {
  return <Panel><h2 className="font-semibold">Operation {result.operationId}</h2><p className="mt-1 text-sm">Status: {result.status}. Records: {result.recordsDeleted ?? result.recordsRestored ?? result.recordsCreated ?? 0}. Backup: {result.backupId || result.preRestoreBackupId || '—'}</p>{result.failures?.length ? <p className="mt-2 text-sm text-[#DC2626]">{result.failures.join(' ')}</p> : null}</Panel>;
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
