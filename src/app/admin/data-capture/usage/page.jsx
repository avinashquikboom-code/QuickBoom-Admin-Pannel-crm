'use client';

import * as React from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/common/Button';
import { DataTable } from '@/components/common/DataTable';
import { HrmGap, HrmNotice, HrmStats } from '@/modules/hrm/HrmNotice';
import { captureError, captureGaps, loadCaptureHistory, loadCaptureUsage } from '@/modules/data-capture/capture-api';

export default function UsageQuotaPage() {
  const [usage, setUsage] = React.useState(null);
  const [history, setHistory] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [refresh, setRefresh] = React.useState(0);

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([loadCaptureUsage(), loadCaptureHistory()])
      .then(([summary, jobs]) => { if (active) { setUsage(summary); setHistory(jobs); setError(''); } })
      .catch((err) => { if (active) setError(captureError(err)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [refresh]);

  const limit = Number(usage?.quotaLimit);
  const captured = Number(usage?.totalLeadsCaptured);
  const remaining = usage?.quotaRemaining;
  const percent = Number.isFinite(limit) && limit > 0 && Number.isFinite(captured) ? Math.min(100, Math.round((captured / limit) * 100)) : null;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader title="Usage & Quota" description="Extraction usage and remaining quota for the signed-in tenant." actions={<Button variant="outline" onClick={() => setRefresh((value) => value + 1)}>Refresh</Button>} />
      <HrmGap title="Quota source" detail={`${captureGaps.quota} ${captureGaps.history}`} />
      <HrmNotice loading={loading} error={error} onRetry={() => setRefresh((value) => value + 1)}>
        {usage && <>
          <HrmStats items={[
            { label: 'Captured', value: usage.totalLeadsCaptured },
            { label: 'Quota', value: usage.quotaLimit },
            { label: 'Remaining', value: remaining },
            { label: 'Google API calls', value: usage.totalGoogleApiCalls },
            { label: 'Searches', value: usage.totalSearches },
            { label: 'Validated', value: usage.validatedCount },
            { label: 'Converted', value: usage.convertedCount },
            { label: 'Tenant', value: usage.customerId },
          ]} />
          <div className="mt-4 rounded-xl border bg-white p-4">
            <div className="flex justify-between text-sm"><span>Quota used</span><span>{percent == null ? '—' : `${percent}%`}</span></div>
            <div className="mt-2 h-3 rounded-full bg-slate-100"><div className="h-3 rounded-full bg-brand" style={{ width: `${percent || 0}%` }} /></div>
            {Number(remaining) <= 0 && <p className="mt-2 text-sm text-rose-700">The usage API reports no remaining quota.</p>}
            {Number(remaining) > 0 && percent != null && percent >= 80 && <p className="mt-2 text-sm text-amber-700">More than 80% of the returned quota is used.</p>}
          </div>
          <div className="mt-4 grid grid-cols-1 min-[440px]:grid-cols-2 gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {(() => {
              const bars = [
                ['Captured', usage.totalLeadsCaptured],
                ['Validated', usage.validatedCount],
                ['Converted', usage.convertedCount],
                ['API calls', usage.totalGoogleApiCalls],
              ];
              const max = Math.max(1, ...bars.map(([, value]) => Number(value) || 0));
              return bars.map(([label, value]) => <div key={label} className="rounded-xl border bg-white p-3"><p className="text-xs text-slate-500">{label}</p><div className="mt-2 flex h-16 items-end"><div className="w-full rounded-md bg-brand-light" style={{ height: `${Math.max(8, Math.round(((Number(value) || 0) / max) * 64))}px` }} /></div><p className="mt-1 text-sm font-semibold">{value ?? '—'}</p></div>);
            })()}
          </div>
          <div className="mt-4 overflow-x-auto">
            <h2 className="mb-2 text-sm font-semibold">Extraction history</h2>
            <DataTable label="Extraction jobs" data={history} columns={[
              { header: 'Job', cell: (row) => row.jobId },
              { header: 'Keyword', cell: (row) => row.keyword || '—' },
              { header: 'Location', cell: (row) => row.location || '—' },
              { header: 'Requested', cell: (row) => row.requestedResults ?? '—' },
              { header: 'Captured', cell: (row) => row.capturedResults ?? '—' },
              { header: 'API calls', cell: (row) => row.googleApiRequests ?? '—' },
              { header: 'When', cell: (row) => String(row.createdAt || '').slice(0, 16).replace('T', ' ') },
            ]} />
          </div>
        </>}
      </HrmNotice>
    </div>
  );
}
