'use client';

import * as React from 'react';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { Button } from '@/components/common/Button';
import { FormDrawer } from '@/components/common/drawers/FormDrawer';
import { toast } from '@/hooks/use-toast';
import { CrmScreen } from '@/modules/crm/CrmScreen';
import { captureError, captureGaps, createCapture, createLeadFromCapture, extractPlaces, loadCaptureUsage, loadCaptures, rejectCapture, removeCapture, sessionCan, updateCapture, validateCapture } from '@/modules/data-capture/capture-api';

const STATUSES = ['CAPTURED', 'VALIDATED', 'REJECTED', 'DUPLICATE', 'LEAD_CREATED'];
const blank = { businessName: '', category: '', phone: '', email: '', website: '', address: '', source: 'GOOGLE_PLACES', notes: '' };

export default function DataCapturePage() {
  const [allowed, setAllowed] = React.useState(false);
  const [usage, setUsage] = React.useState({});
  const [extractOpen, setExtractOpen] = React.useState(false);
  const [extractForm, setExtractForm] = React.useState({ keyword: '', location: '', category: '', city: '', maxResults: 20 });
  const [refresh, setRefresh] = React.useState(0);
  React.useEffect(() => setAllowed(sessionCan('DATA_CAPTURE')), []);
  React.useEffect(() => { loadCaptureUsage().then(setUsage).catch(() => setUsage({})); }, [refresh]);
  const load = React.useCallback((query) => loadCaptures({ page: query.page, limit: 20, search: query.search || undefined, status: query.status || undefined, source: query.source || undefined, category: query.category || undefined }), []);

  return <>
    <CrmScreen title="Data Capture" description="Captured business records for this tenant, with validation and lead conversion." actionLabel="Add record" canCreate={allowed} load={load} blank={blank}
      gap={{ title: 'Dates, sources, and export', detail: `${captureGaps.dates} ${captureGaps.sources} ${captureGaps.export}` }}
      stats={() => [{ label: 'Captured records', value: usage.totalLeadsCaptured }, { label: 'Validated', value: usage.validatedCount }, { label: 'Converted to leads', value: usage.convertedCount }, { label: 'Extractions', value: usage.totalExtractions }]}
      filters={[{ key: 'status', label: 'All statuses', options: STATUSES.map((value) => ({ value, label: value })) }, { key: 'source', label: 'All sources', options: [{ value: 'GOOGLE_PLACES', label: 'Google Places' }] }]}
      below={(rows) => <SourceCounts rows={rows} />}
      columns={[
        { header: 'Business', cell: (row) => row.businessName },
        { header: 'Category', cell: (row) => row.category || '—' },
        { header: 'Phone', cell: (row) => row.phone || '—' },
        { header: 'Source', cell: (row) => row.source || row.provider || '—' },
        { header: 'Lead', cell: (row) => row.importedLeadId || (row.isImported ? 'Imported' : '—') },
        { header: 'Captured', cell: (row) => String(row.capturedAt || '').slice(0, 16).replace('T', ' ') },
        { header: 'Status', cell: (row) => <StatusBadge status={String(row.status || '').toLowerCase()} /> },
      ]}
      renderForm={(form, setForm) => <div className="grid gap-3 sm:grid-cols-2"><Field label="Business name"><Input required value={form.businessName || ''} onChange={(event) => setForm({ ...form, businessName: event.target.value })} /></Field><Field label="Category"><Input value={form.category || ''} onChange={(event) => setForm({ ...form, category: event.target.value })} /></Field><Field label="Phone"><Input value={form.phone || ''} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></Field><Field label="Email"><Input value={form.email || ''} onChange={(event) => setForm({ ...form, email: event.target.value })} /></Field><Field label="Website"><Input value={form.website || ''} onChange={(event) => setForm({ ...form, website: event.target.value })} /></Field><Field label="Address"><Input value={form.address || ''} onChange={(event) => setForm({ ...form, address: event.target.value })} /></Field><Field label="Source"><Input value={form.source || ''} onChange={(event) => setForm({ ...form, source: event.target.value })} /></Field></div>}
      onSave={async (form, id) => { if (id) await updateCapture(id, form); else await createCapture(form); setRefresh((value) => value + 1); toast.success(id ? 'Record updated' : 'Record created'); }}
      rowActions={(reload) => allowed ? [
        { label: 'Validate', onSelect: async (row) => { try { await validateCapture(row.id); reload((value) => value + 1); } catch (error) { toast.error(captureError(error)); } } },
        { label: 'Reject', onSelect: async (row) => { const reason = window.prompt('Rejection reason'); if (reason === null) return; try { await rejectCapture(row.id, reason); reload((value) => value + 1); } catch (error) { toast.error(captureError(error)); } } },
        { label: 'Create lead', onSelect: async (row) => { try { await createLeadFromCapture(row.id); reload((value) => value + 1); toast.success('Lead conversion requested'); } catch (error) { toast.error(captureError(error)); } } },
        { label: 'Delete', onSelect: async (row) => { try { await removeCapture(row.id); reload((value) => value + 1); } catch (error) { toast.error(captureError(error)); } } },
      ] : []}
      detail={(row) => <div className="space-y-1 text-sm"><p className="font-medium">{row.businessName}</p><p>{row.category || 'No category'} · {row.source}</p><p>{row.phone || 'No phone'} · {row.email || 'No email'}</p><p>{row.address || 'No address'}</p><p>Website {row.website || '—'} · Lead {row.importedLeadId || 'Not imported'}</p><p>{row.notes || ''}</p></div>}
    />
    {allowed && <div className="mx-auto mt-4 max-w-7xl"><Button variant="outline" onClick={() => setExtractOpen(true)}>Extract from Google Places</Button></div>}
    <FormDrawer open={extractOpen} onOpenChange={setExtractOpen} title="Extract places" description="Runs the existing Google Places extraction. Quota enforcement stays on the server." onSubmit={async (event) => { event.preventDefault(); try { await extractPlaces(extractForm); setExtractOpen(false); setRefresh((value) => value + 1); toast.success('Extraction requested'); } catch (error) { toast.error(captureError(error)); } }}>
      <div className="grid gap-3"><Field label="Keyword"><Input value={extractForm.keyword} onChange={(event) => setExtractForm({ ...extractForm, keyword: event.target.value })} /></Field><Field label="Location"><Input value={extractForm.location} onChange={(event) => setExtractForm({ ...extractForm, location: event.target.value })} /></Field><Field label="City"><Input value={extractForm.city} onChange={(event) => setExtractForm({ ...extractForm, city: event.target.value })} /></Field><Field label="Category"><Input value={extractForm.category} onChange={(event) => setExtractForm({ ...extractForm, category: event.target.value })} /></Field><Field label="Maximum results"><Input type="number" min="1" max="60" value={extractForm.maxResults} onChange={(event) => setExtractForm({ ...extractForm, maxResults: event.target.value })} /></Field></div>
    </FormDrawer>
  </>;
}

function SourceCounts({ rows }) {
  const counts = rows.reduce((groups, row) => { const key = row.source || 'Unknown'; groups[key] = (groups[key] || 0) + 1; return groups; }, {});
  const entries = Object.entries(counts);
  if (!entries.length) return null;
  return <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{entries.map(([source, count]) => <div key={source} className="rounded-xl border bg-white p-3"><p className="text-xs text-slate-500">{source}</p><p className="text-lg font-semibold">{count}</p><p className="text-[11px] text-slate-400">On this page</p></div>)}</div>;
}

function Field({ label, children }) { return <Label className="grid gap-1 text-xs">{label}{children}</Label>; }
