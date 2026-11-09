'use client';

import * as React from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { DataTable } from '@/components/common/DataTable';
import { HrmNotice, HrmStats } from '@/modules/hrm/HrmNotice';
import { DATA_MODULES, loadDataHistory, loadDataSummary, resetAllData, resetModule, suiteError } from '@/modules/suite/suite-api';
import { toast } from '@/hooks/use-toast';

export default function DataManagementPage() {
  const [summary, setSummary] = React.useState(null);
  const [history, setHistory] = React.useState([]);
  const [moduleName, setModuleName] = React.useState('crm');
  const [confirmation, setConfirmation] = React.useState('');
  const [reason, setReason] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [refresh, setRefresh] = React.useState(0);
  const phrase = `RESET ${moduleName.toUpperCase()}`;
  const ready = Boolean(summary) && !error && confirmation.trim().toUpperCase() === phrase;
  const allReady = Boolean(summary) && !error && confirmation.trim().toUpperCase() === 'RESET ALL DATA';

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([loadDataSummary(), loadDataHistory()])
      .then(([counts, logs]) => { if (active) { setSummary(counts?.data || counts); setHistory(logs); setError(''); } })
      .catch((err) => { if (active) { setSummary(null); setError(suiteError(err)); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [refresh]);

  const transactional = summary?.transactional || {};
  const cards = [
    ['CRM', transactional.crm?.total],
    ['Attendance', transactional.attendance?.total],
    ['Payroll', transactional.payroll?.total],
    ['Operations', transactional.operations?.total],
    ['Employees kept', summary?.masterDataProtected?.employees],
    ['Users kept', summary?.masterDataProtected?.users],
  ];

  return <div className="mx-auto max-w-7xl space-y-6">
    <PageHeader title="Data Management" description="Record counts and reset actions for the signed-in tenant. Master data stays protected by the reset API." actions={<Button variant="outline" onClick={() => setRefresh((value) => value + 1)}>Refresh</Button>} />
    <HrmNotice loading={loading} error={error} onRetry={() => setRefresh((value) => value + 1)}>
      {summary && <HrmStats items={cards.map(([label, value]) => ({ label, value }))} />}
      <div className="mt-4 rounded-xl border bg-white p-4 text-sm">
        <p className="font-medium">Module reset preview</p>
        <p className="mt-1 text-slate-600">Module <span className="font-medium">{moduleName}</span> will delete that module’s transactional records for this tenant. Employees, departments, designations, and users stay in the protected counts above.</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <select className="h-9 rounded-md border px-2" value={moduleName} onChange={(event) => { setModuleName(event.target.value); setConfirmation(''); }}>{DATA_MODULES.map((item) => <option key={item}>{item}</option>)}</select>
          <Input placeholder={`Type ${phrase}`} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} />
          <Input placeholder="Reason" value={reason} onChange={(event) => setReason(event.target.value)} />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button disabled={!ready} onClick={() => run(async () => { await resetModule(moduleName, confirmation.trim(), reason); setConfirmation(''); })}>Reset module</Button>
          <Button variant="outline" disabled={!allReady} onClick={() => run(async () => { await resetAllData(confirmation.trim(), reason); setConfirmation(''); })}>Reset all transactional data</Button>
        </div>
        {!summary && <p className="mt-2 text-rose-700">Deletion stays disabled until the summary API succeeds.</p>}
      </div>
      <div className="mt-4 overflow-x-auto"><DataTable label="Reset history" data={history} columns={[
        { header: 'When', cell: (row) => String(row.timestamp || '').slice(0, 16).replace('T', ' ') },
        { header: 'Module', cell: (row) => row.module || '—' },
        { header: 'By', cell: (row) => row.performedBy || '—' },
        { header: 'Details', cell: (row) => typeof row.details === 'string' ? row.details : JSON.stringify(row.details || {}) },
      ]} /></div>
    </HrmNotice>
  </div>;
}

async function run(action) {
  try { await action(); toast.success('Reset completed'); window.location.reload(); } catch (error) { toast.error(suiteError(error)); }
}
