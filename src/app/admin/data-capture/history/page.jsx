'use client';

import * as React from 'react';
import { GooglePlacesPanel } from '@/modules/data-capture/GooglePlacesPanel';
import Link from 'next/link';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/common/Button';
import { FormDrawer } from '@/components/common/drawers/FormDrawer';
import { HrmNotice, HrmStats } from '@/modules/hrm/HrmNotice';
import {
  captureError,
  exportCaptureSessions,
  loadCaptureSession,
  loadCaptureSessions,
  retryFailedCapture,
} from '@/modules/data-capture/capture-api';
import { toast } from '@/hooks/use-toast';

const EMPTY = { search: '', source: '', category: '', location: '', capturedBy: '', status: '', dateFrom: '', dateTo: '' };

function when(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
}

function saveFile(blob, filename) {
  const file = blob instanceof Blob ? blob : new Blob([blob]);
  const link = document.createElement('a');
  link.href = URL.createObjectURL(file);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

function Status({ value }) {
  const tone = value === 'Completed' ? 'bg-[#E8F1EC] text-[#163A2E]' : value === 'Failed' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-800';
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${tone}`}>{value || '—'}</span>;
}

export default function CaptureHistoryPage() {
  const [draft, setDraft] = React.useState(EMPTY);
  const [filters, setFilters] = React.useState(EMPTY);
  const [page, setPage] = React.useState(1);
  const [payload, setPayload] = React.useState({ rows: [], summary: {}, meta: {}, pagination: {} });
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [refresh, setRefresh] = React.useState(0);
  const [session, setSession] = React.useState(null);
  const [importRecords, setImportRecords] = React.useState(null);
  const [importOpen, setImportOpen] = React.useState(false);
  const [busy, setBusy] = React.useState('');

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    loadCaptureSessions({ ...filters, page, limit: 20 })
      .then((result) => { if (active) { setPayload(result); setError(''); } })
      .catch((err) => { if (active) setError(captureError(err)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [filters, page, refresh]);

  const summary = payload.summary || {};
  const meta = payload.meta || {};
  const rows = payload.rows || [];

  function setField(key, value) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function openSession(row) {
    try {
      const result = await loadCaptureSession(row.id);
      const body = result?.data && !Array.isArray(result.data) ? result.data : result;
      setSession(body?.records ? body : body?.data || body);
    } catch (err) {
      toast.error(captureError(err));
    }
  }

  async function download(format) {
    setBusy(format);
    try {
      const blob = await exportCaptureSessions(filters, format);
      if (blob?.type?.includes('json')) throw new Error('The export did not return a file.');
      saveFile(blob, format === 'pdf' ? 'capture-history.pdf' : 'capture-history.csv');
    } catch (err) {
      toast.error(captureError(err));
    } finally {
      setBusy('');
    }
  }

  async function retry(jobId) {
    setBusy(jobId);
    try {
      const result = await retryFailedCapture(jobId);
      const imported = result?.imported ?? result?.data?.imported;
      const failed = result?.data?.failed;
      toast.success(`Retry finished. Imported ${imported ?? 0}. Failed ${failed ?? 0}.`);
      setRefresh((value) => value + 1);
      if (session?.id === jobId) openSession({ id: jobId });
    } catch (err) {
      toast.error(captureError(err));
    } finally {
      setBusy('');
    }
  }

  const detail = session;

  return (
    <div className="mx-auto max-w-7xl space-y-5 overflow-x-hidden">
      <PageHeader
        title="Capture History"
        description="Track captured records, sources, imports and capture activity."
        actions={(
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => download('csv')} disabled={busy === 'csv'}>CSV</Button>
            <Button variant="outline" onClick={() => download('pdf')} disabled={busy === 'pdf'}>PDF</Button>
          </div>
        )}
      />
      <HrmNotice loading={loading && !rows.length} error={error} onRetry={() => setRefresh((value) => value + 1)}>
        <HrmStats items={[
          { label: 'Total Capture Sessions', value: summary.sessions ?? 0 },
          { label: 'Total Records Captured', value: summary.captured ?? 0 },
          { label: 'Successfully Imported', value: summary.imported ?? 0 },
          { label: 'Pending Import', value: summary.pending ?? 0 },
          { label: 'Failed Imports', value: summary.failed ?? 0 },
          { label: 'Duplicate Records', value: summary.duplicates ?? 0 },
        ]} />
        <form className="mt-4 grid grid-cols-1 gap-3 rounded-xl border border-[#E2E8E5] bg-white p-4 sm:grid-cols-2 lg:grid-cols-4" onSubmit={(event) => { event.preventDefault(); setPage(1); setFilters(draft); }}>
          <input className="rounded-lg border border-[#E2E8E5] px-3 py-2 text-sm" placeholder="Search capture ID or name" value={draft.search} onChange={(event) => setField('search', event.target.value)} />
          <select className="rounded-lg border border-[#E2E8E5] px-3 py-2 text-sm" value={draft.source} onChange={(event) => setField('source', event.target.value)}>
            <option value="">All sources</option>
            {(meta.sources || []).map((source) => <option key={source} value={source}>{source}</option>)}
          </select>
          <select className="rounded-lg border border-[#E2E8E5] px-3 py-2 text-sm" value={draft.category} onChange={(event) => setField('category', event.target.value)}>
            <option value="">All categories</option>
            {(meta.categories || []).map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
          <input className="rounded-lg border border-[#E2E8E5] px-3 py-2 text-sm" placeholder="Location" value={draft.location} onChange={(event) => setField('location', event.target.value)} />
          <select className="rounded-lg border border-[#E2E8E5] px-3 py-2 text-sm" value={draft.capturedBy} onChange={(event) => setField('capturedBy', event.target.value)}>
            <option value="">All users</option>
            {(meta.users || []).map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
          </select>
          <select className="rounded-lg border border-[#E2E8E5] px-3 py-2 text-sm" value={draft.status} onChange={(event) => setField('status', event.target.value)}>
            <option value="">All statuses</option>
            <option>Completed</option>
            <option>Partial</option>
            <option>Failed</option>
          </select>
          <input type="date" className="rounded-lg border border-[#E2E8E5] px-3 py-2 text-sm" value={draft.dateFrom} onChange={(event) => setField('dateFrom', event.target.value)} />
          <input type="date" className="rounded-lg border border-[#E2E8E5] px-3 py-2 text-sm" value={draft.dateTo} onChange={(event) => setField('dateTo', event.target.value)} />
          <div className="flex gap-2 sm:col-span-2 lg:col-span-4">
            <Button type="submit">Apply Filters</Button>
            <Button type="button" variant="outline" onClick={() => { setDraft(EMPTY); setFilters(EMPTY); setPage(1); }}>Reset Filters</Button>
          </div>
        </form>
        <div className="mt-4 hidden overflow-x-auto rounded-xl border border-[#E2E8E5] bg-white md:block">
          <table className="min-w-[1100px] w-full text-left text-sm">
            <thead className="bg-[#E8F1EC] text-[#163A2E]">
              <tr>
                {['Capture ID', 'Capture Name', 'Data Source', 'Category', 'Location', 'Total', 'Selected', 'Imported', 'Already Exists', 'Pending', 'Failed', 'Captured By', 'Capture Date', 'Status', ''].map((heading) => (
                  <th key={heading} className="px-3 py-2 font-semibold">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-[#E2E8E5]">
                  <td className="px-3 py-2 font-medium">{row.id}</td>
                  <td className="px-3 py-2">{row.captureName || '—'}</td>
                  <td className="px-3 py-2">{row.source || '—'}</td>
                  <td className="px-3 py-2">{row.category || '—'}</td>
                  <td className="px-3 py-2">{row.location || '—'}</td>
                  <td className="px-3 py-2">{row.totalRecords ?? 0}</td>
                  <td className="px-3 py-2">{row.selected ?? 0}</td><td className="px-3 py-2">{row.imported ?? 0}</td><td className="px-3 py-2">{row.duplicate ?? 0}</td>
                  <td className="px-3 py-2">{row.pending ?? 0}</td>
                  <td className="px-3 py-2">{row.failed ?? 0}</td>
                  <td className="px-3 py-2">{row.capturedBy || '—'}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{when(row.captureDate)}</td>
                  <td className="px-3 py-2"><Status value={row.status} /></td>
                  <td className="px-3 py-2"><button type="button" className="font-semibold text-[#163A2E]" onClick={() => openSession(row)}>View Details</button></td>
                </tr>
              ))}
              {!rows.length && <tr><td colSpan={15} className="px-3 py-8 text-center text-slate-500">No capture sessions match these filters.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="mt-4 space-y-3 md:hidden">
          {rows.map((row) => (
            <button key={row.id} type="button" className="w-full rounded-xl border border-[#E2E8E5] bg-white p-4 text-left" onClick={() => openSession(row)}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-[#172B24]">{row.captureName || row.id}</p>
                  <p className="text-xs text-slate-500">{row.location || '—'} · {when(row.captureDate)}</p>
                </div>
                <Status value={row.status} />
              </div>
              <p className="mt-2 text-sm text-slate-600">Captured {row.totalRecords ?? 0} · Imported {row.imported ?? 0} · Pending {row.pending ?? 0} · Failed {row.failed ?? 0}</p>
            </button>
          ))}
          {!rows.length && <p className="rounded-xl border border-dashed p-6 text-sm text-slate-500">No capture sessions match these filters.</p>}
        </div>
        <div className="mt-3 flex items-center justify-between text-sm">
          <span>{payload.pagination?.total ?? rows.length} sessions</span>
          <div className="flex gap-2">
            <Button variant="outline" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</Button>
            <Button variant="outline" disabled={page >= (payload.pagination?.totalPages || 1)} onClick={() => setPage((value) => value + 1)}>Next</Button>
          </div>
        </div>
      </HrmNotice>
      <FormDrawer open={Boolean(detail)} onOpenChange={(open) => { if (!open) setSession(null); }} title={detail?.captureName || 'Capture session'} description={detail?.id} size="xl" showFooter={false}>
        {detail && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <p><span className="text-slate-500">Source</span><br />{detail.source}</p>
              <p><span className="text-slate-500">Category</span><br />{detail.category}</p>
              <p><span className="text-slate-500">Location</span><br />{detail.location || '—'}</p>
              <p><span className="text-slate-500">Requested / returned</span><br />{detail.requestedCount ?? '—'} / {detail.totalRecords ?? 0}</p>
              <p><span className="text-slate-500">Captured</span><br />{when(detail.captureDate)}</p>
              <p><span className="text-slate-500">Captured by</span><br />{detail.capturedBy}</p>
              <p><span className="text-slate-500">Selected</span><br />{detail.selected ?? 0}</p><p><span className="text-slate-500">Imported</span><br />{detail.imported ?? 0}</p>
              <p><span className="text-slate-500">Pending</span><br />{detail.pending ?? 0}</p>
              <p><span className="text-slate-500">Failed</span><br />{detail.failed ?? 0}</p>
              <p><span className="text-slate-500">Duplicates</span><br />{detail.duplicate ?? 0}</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link href={`/admin/crm/leads?captureJobId=${encodeURIComponent(detail.id)}`} className="inline-flex h-10 items-center justify-center rounded-lg bg-[#163A2E] px-4 text-sm font-semibold text-white">View Imported Leads</Link>
              <Button type="button" variant="outline" onClick={() => { setImportRecords(detail.records); setImportOpen(true); }}>Select records to import</Button>
              <Button type="button" variant="outline" disabled={!detail.failed || busy === detail.id} onClick={() => retry(detail.id)}>Retry Failed Imports</Button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead><tr className="text-slate-500">{['Record', 'Category', 'Outcome', 'Place ID', 'Lead'].map((heading) => <th key={heading} className="py-2 pr-3">{heading}</th>)}</tr></thead>
                <tbody>
                  {(detail.records || []).map((record) => (
                    <tr key={record.id} className="border-t">
                      <td className="py-2 pr-3">{record.businessName || 'Google Maps reference'}<div className="text-xs text-slate-500">{record.address || record.phone || ''}</div></td>
                      <td className="py-2 pr-3">{record.category || '—'}</td>
                      <td className="py-2 pr-3 capitalize">{record.outcome}</td>
                      <td className="py-2 pr-3">{record.googlePlaceId || '—'}</td>
                      <td className="py-2 pr-3">{record.importedLeadId || '—'}</td>
                    </tr>
                  ))}
                  {!detail.records?.length && <tr><td colSpan={5} className="py-4 text-slate-500">No stored records remain for this session.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </FormDrawer>
      <GooglePlacesPanel open={importOpen} onOpenChange={setImportOpen} initialPlaces={importRecords} initialJobId={detail?.id} onImported={() => { setRefresh((value) => value + 1); if (detail?.id) loadCaptureSession(detail.id).then((payload) => { const body = payload?.data || payload; setSession(body?.records ? body : body?.data || body); }).catch((error) => toast.error(captureError(error))); }} />
    </div>
  );
}
