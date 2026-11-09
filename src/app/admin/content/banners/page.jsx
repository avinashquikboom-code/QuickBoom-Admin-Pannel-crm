'use client';

import * as React from 'react';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { toast } from '@/hooks/use-toast';
import { CrmScreen } from '@/modules/crm/CrmScreen';
import { loadBanners, publishBanner, removeBanner, saveBanner, sessionCan, suiteError, suiteGaps } from '@/modules/suite/suite-api';

const blank = { title: '', description: '', imageUrl: '', ctaText: '', ctaUrl: '', priority: 0, isPublished: true, isActive: true, startDate: '', endDate: '' };

export default function BannersPage() {
  const [allowed, setAllowed] = React.useState(false);
  React.useEffect(() => setAllowed(sessionCan('MARKETING') || sessionCan('CONTENT')), []);
  const load = React.useCallback((query) => loadBanners(query), []);
  return <CrmScreen title="Home Banners" description="Banners stored by the marketing banner API. One image URL is supported." actionLabel="Add banner" canCreate={allowed} load={load} blank={blank}
    gap={{ title: 'Images', detail: `${suiteGaps.upload} Separate desktop and mobile image fields are not in the banner contract.` }}
    columns={[
      { header: 'Title', cell: (row) => row.title || 'Untitled' },
      { header: 'CTA', cell: (row) => row.ctaText || '—' },
      { header: 'Order', cell: (row) => row.priority ?? '—' },
      { header: 'Window', cell: (row) => `${String(row.startDate || '').slice(0, 10) || '—'} to ${String(row.endDate || '').slice(0, 10) || '—'}` },
      { header: 'Status', cell: (row) => <StatusBadge status={row.isPublished ? 'published' : row.isActive ? 'active' : 'inactive'} /> },
    ]}
    renderForm={(form, setForm) => <div className="grid gap-3 sm:grid-cols-2"><Field label="Title"><Input value={form.title || ''} onChange={(event) => setForm({ ...form, title: event.target.value })} /></Field><Field label="Description"><Input value={form.description || ''} onChange={(event) => setForm({ ...form, description: event.target.value })} /></Field><Field label="Image URL"><Input value={form.imageUrl || ''} onChange={(event) => setForm({ ...form, imageUrl: event.target.value })} /></Field><Field label="CTA text"><Input value={form.ctaText || ''} onChange={(event) => setForm({ ...form, ctaText: event.target.value })} /></Field><Field label="Destination URL"><Input value={form.ctaUrl || ''} onChange={(event) => setForm({ ...form, ctaUrl: event.target.value })} /></Field><Field label="Priority"><Input type="number" min="0" value={form.priority ?? 0} onChange={(event) => setForm({ ...form, priority: event.target.value })} /></Field><Field label="Start"><Input type="date" value={String(form.startDate || '').slice(0, 10)} onChange={(event) => setForm({ ...form, startDate: event.target.value })} /></Field><Field label="End"><Input type="date" value={String(form.endDate || '').slice(0, 10)} onChange={(event) => setForm({ ...form, endDate: event.target.value })} /></Field></div>}
    onSave={async (form, id) => { await saveBanner(form, id); toast.success(id ? 'Banner updated' : 'Banner created'); }}
    rowActions={(reload) => allowed ? [
      { label: 'Publish', onSelect: (row) => run(() => publishBanner(row.id, true), reload) },
      { label: 'Unpublish', onSelect: (row) => run(() => publishBanner(row.id, false), reload) },
      { label: 'Delete', onSelect: (row) => { if (!window.confirm(`Delete banner ${row.title || row.id}?`)) return; return run(() => removeBanner(row.id), reload); } },
    ] : []}
    detail={(row) => <div className="space-y-2 text-sm">{(row.imageUrl || row.image) && <img src={row.imageUrl || row.image} alt="" className="max-h-48 w-full rounded-md object-cover" />}<p>{row.description || row.subtitle || 'No description'}</p><p>{row.ctaUrl || 'No destination'}</p></div>}
  />;
}
function Field({ label, children }) { return <Label className="grid gap-1 text-xs">{label}{children}</Label>; }
async function run(action, reload) { try { await action(); reload((value) => value + 1); } catch (error) { toast.error(suiteError(error)); } }
