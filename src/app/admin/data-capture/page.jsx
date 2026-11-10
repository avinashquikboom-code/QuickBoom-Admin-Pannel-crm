'use client';

import * as React from 'react';
import { ManualLeadDrawer } from '@/modules/crm/ManualLeadDrawer';
import { GooglePlacesPanel } from '@/modules/data-capture/GooglePlacesPanel';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { Button } from '@/components/common/Button';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import { faMagnifyingGlass, faTrashCan } from '@fortawesome/free-solid-svg-icons';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { AdminBulkSelectionToolbar } from '@/components/admin/bulk-selection';
import { sessionCanAction } from '@/modules/hrm/hrm-api';
import { toast } from '@/hooks/use-toast';
import { CrmScreen } from '@/modules/crm/CrmScreen';
import { captureError, captureGaps, createCapture, loadCaptureUsage, loadCaptures, rejectCapture, removeCapture, deleteCaptures, sessionCan, updateCapture, validateCapture } from '@/modules/data-capture/capture-api';

const STATUSES = ['CAPTURED', 'VALIDATED', 'REJECTED', 'DUPLICATE', 'LEAD_CREATED'];
const blank = { businessName: '', category: '', phone: '', email: '', website: '', address: '', source: 'GOOGLE_PLACES', notes: '' };

export default function DataCapturePage() {
  const [leadOpen, setLeadOpen] = React.useState(false);
  const [canAddLead, setCanAddLead] = React.useState(false);
  const [canDelete, setCanDelete] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const deleteBusy = React.useRef(false);
  const [confirmation, setConfirmation] = React.useState(null);
  const [deletionResult, setDeletionResult] = React.useState(null);
  const [allowed, setAllowed] = React.useState(false);
  const [usage, setUsage] = React.useState({});
  const [extractOpen, setExtractOpen] = React.useState(false);
  const [selectedPlaces, setSelectedPlaces] = React.useState(null);
  const [refresh, setRefresh] = React.useState(0);
  React.useEffect(() => { setAllowed(sessionCan('DATA_CAPTURE')); setCanAddLead(sessionCan('LEADS') || sessionCan('CRM')); setCanDelete(sessionCanAction('DATA_CAPTURE', 'DELETE')); }, []);
  React.useEffect(() => { loadCaptureUsage().then(setUsage).catch(() => setUsage({})); }, [refresh]);
  const load = React.useCallback((query) => loadCaptures({ page: query.page, limit: 20, search: query.search || undefined, status: query.status || undefined, source: query.source || undefined, category: query.category || undefined }), []);

  const eligible = (row) => !row.isImported && !row.importedLeadId && !['LEAD_CREATED', 'DUPLICATE', 'REJECTED'].includes(row.status);
  const confirmDelete = async () => {
    if (deleteBusy.current || !confirmation) return;
    deleteBusy.current = true; setDeleting(true);
    try {
      const payload = confirmation.single ? await removeCapture(confirmation.rows[0].id) : await deleteCaptures(confirmation.rows.map((row) => row.id));
      const result = payload?.data?.records ? payload.data : payload;
      setDeletionResult(result); setConfirmation(null); setRefresh((value) => value + 1);
      toast.success(result.message || `Deleted ${result.deleted || 0} captured records`);
    } catch (error) { toast.error(captureError(error)); }
    finally { deleteBusy.current = false; setDeleting(false); }
  };

  return <>
    <CrmScreen hideTitleCard title="Data Capture" description="Captured business records for this tenant, with validation and lead conversion." refreshToken={refresh} enableSelection toolbar={({ selected, clearSelection }) => <AdminBulkSelectionToolbar count={selected.length} onClear={clearSelection}>
        {canDelete && <Button variant="destructive" disabled={deleting} onClick={() => setConfirmation({ rows: selected, single: false })}><FontAwesomeIcon icon={faTrashCan} className="mr-2 size-4" />Delete Selected</Button>}
        {allowed && selected.some(eligible) && <Button disabled={deleting} onClick={() => { setSelectedPlaces(selected.filter(eligible)); setExtractOpen(true); }}>Import Selected ({selected.filter(eligible).length})</Button>}
        <span className="text-xs">Selection applies to the current page.</span>
      </AdminBulkSelectionToolbar>} canCreate={false} load={load} blank={blank}
      extraHeaderActions={<>{canAddLead && <Button onClick={() => setLeadOpen(true)}>Add Lead</Button>}{allowed && <Button onClick={() => { setSelectedPlaces(null); setExtractOpen(true); }}><FontAwesomeIcon icon={faMagnifyingGlass} className="mr-2 size-4" />Find Leads from Google</Button>}</>}
      gap={{ title: 'Dates, sources, and export', detail: `${captureGaps.dates} ${captureGaps.sources} ${captureGaps.export}` }}
      stats={() => [{ label: 'Captured records', value: usage.totalLeadsCaptured }, { label: 'Validated', value: usage.validatedCount }, { label: 'Converted to leads', value: usage.convertedCount }, { label: 'Extractions', value: usage.totalExtractions }]}
      filters={[{ key: 'status', label: 'All statuses', options: STATUSES.map((value) => ({ value, label: value })) }, { key: 'source', label: 'All sources', options: [{ value: 'GOOGLE_PLACES', label: 'Google Places' }] }]}
      below={(rows) => <SourceCounts rows={rows} />}
      columns={[
        { header: 'Business', className: 'min-w-0 max-w-[260px]', cell: (row) => <span className="flex min-w-0 items-center gap-2"><BusinessAvatar name={row.businessName} src={businessImage(row)} /><span className="min-w-0 truncate">{row.businessName || 'Incomplete record'}</span></span> },
        { header: 'Category', cell: (row) => row.category || '—' },
        { header: 'Phone', cell: (row) => row.phone || '—' },
        { header: 'Location', className: 'max-w-[240px]', cell: (row) => <span className="block max-w-[240px] truncate">{row.address || '—'}</span> },
        { header: 'Website', cell: (row) => safeHttp(row.website) ? <a href={safeHttp(row.website)} target="_blank" rel="noopener noreferrer" className="text-[#163A2E] underline">{row.website}</a> : '—' },
        { header: 'Source', cell: (row) => row.source || row.provider || '—' },
        { header: 'Import Status', cell: (row) => <StatusBadge status={importStatus(row)} /> },
      ]}
      renderForm={(form, setForm) => <div className="grid gap-3 sm:grid-cols-2"><Field label="Business name"><Input required value={form.businessName || ''} onChange={(event) => setForm({ ...form, businessName: event.target.value })} /></Field><Field label="Category"><Input value={form.category || ''} onChange={(event) => setForm({ ...form, category: event.target.value })} /></Field><Field label="Phone"><Input value={form.phone || ''} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></Field><Field label="Email"><Input value={form.email || ''} onChange={(event) => setForm({ ...form, email: event.target.value })} /></Field><Field label="Website"><Input value={form.website || ''} onChange={(event) => setForm({ ...form, website: event.target.value })} /></Field><Field label="Address"><Input value={form.address || ''} onChange={(event) => setForm({ ...form, address: event.target.value })} /></Field><Field label="Source"><Input value={form.source || ''} onChange={(event) => setForm({ ...form, source: event.target.value })} /></Field></div>}
      onSave={async (form, id) => { if (id) await updateCapture(id, form); else await createCapture(form); setRefresh((value) => value + 1); toast.success(id ? 'Record updated' : 'Record created'); }}
      rowActions={(reload) => [
        ...(allowed ? [
        { label: 'Validate', onSelect: async (row) => { try { await validateCapture(row.id); reload((value) => value + 1); } catch (error) { toast.error(captureError(error)); } } },
        { label: 'Reject', onSelect: async (row) => { const reason = window.prompt('Rejection reason'); if (reason === null) return; try { await rejectCapture(row.id, reason); reload((value) => value + 1); } catch (error) { toast.error(captureError(error)); } } },
        { label: 'Import lead', onSelect: (row) => { setSelectedPlaces([row]); setExtractOpen(true); } },
        ] : []),
        ...(canDelete ? [{ label: 'Delete', variant: 'destructive', confirm: false, disabled: deleting, onSelect: (row) => setConfirmation({ rows: [row], single: true }) }] : []),
      ]}
      detail={(row) => <div className="space-y-1 text-sm"><p className="font-medium">{row.businessName}</p><p>{row.category || 'No category'} · {row.source}</p><p>{row.phone || 'No phone'} · {row.email || 'No email'}</p><p>{row.address || 'No address'}</p><p>Website {row.website || '—'} · Lead {row.importedLeadId || 'Not imported'}</p><p>{row.notes || ''}</p></div>}
    />
    {deletionResult && <div role="status" className="max-w-none min-w-0 w-full mt-3 rounded-lg border p-3 text-sm"><p>Selected: {deletionResult.totalSelected} · Deleted: {deletionResult.deleted} · Skipped: {deletionResult.skipped} · Failed: {deletionResult.failed}</p>{deletionResult.records?.filter((record) => record.status !== 'deleted').map((record) => <p key={record.id}>Capture #{record.id}: {record.message}</p>)}</div>}
    <ConfirmDialog open={Boolean(confirmation)} onOpenChange={(open) => { if (!open && !deleteBusy.current) setConfirmation(null); }} title={confirmation?.single ? 'Delete captured record?' : `Delete ${confirmation?.rows.length || 0} selected captured records?`} description={`${confirmation?.single ? confirmation.rows[0].businessName || `Capture #${confirmation.rows[0].id}` : `${confirmation?.rows.length || 0} captured records selected`}. Imported or protected captures will be skipped. CRM Leads will remain untouched.`} variant="destructive" confirmLabel={deleting ? 'Deleting…' : 'Delete'} onConfirm={confirmDelete} />
    <ManualLeadDrawer open={leadOpen} onOpenChange={setLeadOpen} />
    <GooglePlacesPanel open={extractOpen} onOpenChange={setExtractOpen} initialPlaces={selectedPlaces} onImported={() => setRefresh((value) => value + 1)} />
  </>;
}

function SourceCounts({ rows }) {
  const counts = rows.reduce((groups, row) => { const key = row.source || 'Unknown'; groups[key] = (groups[key] || 0) + 1; return groups; }, {});
  const entries = Object.entries(counts);
  if (!entries.length) return null;
  return <div className="grid grid-cols-1 min-[440px]:grid-cols-2 gap-2 sm:grid-cols-2 xl:grid-cols-4">{entries.map(([source, count]) => <div key={source} className="rounded-xl border bg-white p-3"><p className="text-xs text-slate-500">{source}</p><p className="text-lg font-semibold">{count}</p><p className="text-[11px] text-slate-400">On this page</p></div>)}</div>;
}

function importStatus(row) {
  if (row.status === 'IMPORT_FAILED') return 'failed';
  if (row.status === 'DUPLICATE') return 'already imported';
  if (row.isImported || row.importedLeadId || row.status === 'LEAD_CREATED') return 'imported';
  return 'pending';
}

function safeHttp(value) {
  try {
    const url = new URL(String(value || ''));
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : '';
  } catch { return ''; }
}

function businessImage(row) {
  const photo = Array.isArray(row.photos) ? row.photos.find((item) => safeHttp(typeof item === 'string' ? item : item?.url)) : '';
  return safeHttp(typeof photo === 'string' ? photo : photo?.url);
}

function BusinessAvatar({ name, src }) {
  const [failed, setFailed] = React.useState(false);
  const words = String(name || '').trim().split(/\s+/).filter(Boolean);
  const initials = words.length === 0 ? '' : words.length === 1 ? words[0].slice(0, 2).toUpperCase() : `${words[0][0]}${words[1][0]}`.toUpperCase();
  if (src && !failed) return <img src={src} alt="" width={40} height={40} className="size-10 shrink-0 rounded-lg border border-[#E2E8E5] object-cover" onError={() => setFailed(true)} />;
  return <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-[#E2E8E5] bg-[#E8F1EC] text-xs font-bold text-[#163A2E]">{initials || '—'}</span>;
}

function Field({ label, children }) { return <Label className="grid gap-1 text-xs">{label}{children}</Label>; }
