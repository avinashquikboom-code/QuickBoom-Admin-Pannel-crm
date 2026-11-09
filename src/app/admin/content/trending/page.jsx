'use client';

import * as React from 'react';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { toast } from '@/hooks/use-toast';
import { CrmScreen } from '@/modules/crm/CrmScreen';
import { loadTrending, publishTrending, removeTrending, saveTrending, sessionCan, suiteError, suiteGaps } from '@/modules/suite/suite-api';

const blank = { title: '', description: '', category: 'REEL', thumbnailUrl: '', mediaUrl: '', mediaType: 'IMAGE', ctaText: '', ctaUrl: '', platform: 'INSTAGRAM', priority: 0, isPublished: true };

export default function TrendingPage() {
  const [allowed, setAllowed] = React.useState(false);
  React.useEffect(() => setAllowed(sessionCan('MARKETING') || sessionCan('CONTENT')), []);
  const load = React.useCallback((query) => loadTrending(query), []);
  return <CrmScreen title="Trending Content" description="Marketing content returned by the trending API." actionLabel="Add content" canCreate={allowed} load={load} blank={blank}
    gap={{ title: 'Media', detail: suiteGaps.upload }}
    filters={[{ key: 'category', label: 'All categories', options: ['REEL', 'STORY', 'OFFER', 'HIGH_ROI_AD'].map((value) => ({ value, label: value })) }]}
    columns={[
      { header: 'Title', cell: (row) => row.title },
      { header: 'Category', cell: (row) => row.category || '—' },
      { header: 'Priority', cell: (row) => row.priority ?? '—' },
      { header: 'Media', cell: (row) => row.mediaType || '—' },
      { header: 'Status', cell: (row) => <StatusBadge status={row.isPublished ? 'published' : 'draft'} /> },
    ]}
    renderForm={(form, setForm) => <div className="grid gap-3 sm:grid-cols-2"><Field label="Title"><Input required value={form.title || ''} onChange={(event) => setForm({ ...form, title: event.target.value })} /></Field><Field label="Category"><select className="h-9 rounded-md border px-2 text-sm" value={form.category || 'REEL'} onChange={(event) => setForm({ ...form, category: event.target.value })}>{['REEL', 'STORY', 'OFFER', 'HIGH_ROI_AD'].map((item) => <option key={item}>{item}</option>)}</select></Field><Field label="Description"><Input value={form.description || ''} onChange={(event) => setForm({ ...form, description: event.target.value })} /></Field><Field label="Thumbnail URL"><Input value={form.thumbnailUrl || ''} onChange={(event) => setForm({ ...form, thumbnailUrl: event.target.value })} /></Field><Field label="Media URL"><Input value={form.mediaUrl || ''} onChange={(event) => setForm({ ...form, mediaUrl: event.target.value })} /></Field><Field label="Priority"><Input type="number" min="0" value={form.priority ?? 0} onChange={(event) => setForm({ ...form, priority: event.target.value })} /></Field></div>}
    onSave={async (form, id) => { await saveTrending(form, id); toast.success(id ? 'Content updated' : 'Content created'); }}
    rowActions={(reload) => allowed ? [
      { label: 'Publish', onSelect: (row) => run(() => publishTrending(row.id, true), reload) },
      { label: 'Unpublish', onSelect: (row) => run(() => publishTrending(row.id, false), reload) },
      { label: 'Delete', onSelect: (row) => { if (!window.confirm(`Delete ${row.title}?`)) return; return run(() => removeTrending(row.id), reload); } },
    ] : []}
    detail={(row) => <div className="space-y-2 text-sm">{row.thumbnailUrl && <img src={row.thumbnailUrl} alt="" className="max-h-40 rounded-md" />}{row.mediaUrl && <a className="text-brand" href={row.mediaUrl} target="_blank" rel="noreferrer">Open media</a>}<p>{row.description || 'No description'}</p><p>CTA {row.ctaText || '—'} · {row.ctaUrl || '—'}</p></div>}
  />;
}
function Field({ label, children }) { return <Label className="grid gap-1 text-xs">{label}{children}</Label>; }
async function run(action, reload) { try { await action(); reload((value) => value + 1); } catch (error) { toast.error(suiteError(error)); } }
