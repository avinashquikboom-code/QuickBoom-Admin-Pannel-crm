'use client';

import * as React from 'react';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { toast } from '@/hooks/use-toast';
import { CrmScreen } from '@/modules/crm/CrmScreen';
import { loadVideos, publishVideo, removeVideo, saveVideo, sessionCan, suiteError, suiteGaps } from '@/modules/suite/suite-api';

const blank = { title: '', description: '', videoUrl: '', thumbnailUrl: '', priority: 0, status: 'ACTIVE', isActive: true };

export default function VideosPage() {
  const [allowed, setAllowed] = React.useState(false);
  React.useEffect(() => setAllowed(sessionCan('MARKETING') || sessionCan('CONTENT')), []);
  const load = React.useCallback((query) => loadVideos(query), []);
  return <CrmScreen title="Marketing Videos" description="Videos returned by the marketing video API." actionLabel="Add video" canCreate={allowed} load={load} blank={blank}
    gap={{ title: 'Video files', detail: `${suiteGaps.upload} Duration is not a field on the video response.` }}
    columns={[
      { header: 'Title', cell: (row) => row.title || 'Untitled' },
      { header: 'Status', cell: (row) => <StatusBadge status={String(row.status || (row.isActive ? 'active' : 'inactive')).toLowerCase()} /> },
      { header: 'Priority', cell: (row) => row.priority ?? '—' },
      { header: 'Views', cell: (row) => row.views ?? row.viewCount ?? '—' },
    ]}
    renderForm={(form, setForm) => <div className="grid gap-3 sm:grid-cols-2"><Field label="Title"><Input value={form.title || ''} onChange={(event) => setForm({ ...form, title: event.target.value })} /></Field><Field label="Description"><Input value={form.description || ''} onChange={(event) => setForm({ ...form, description: event.target.value })} /></Field><Field label="Video URL"><Input value={form.videoUrl || ''} onChange={(event) => setForm({ ...form, videoUrl: event.target.value })} /></Field><Field label="Thumbnail URL"><Input value={form.thumbnailUrl || ''} onChange={(event) => setForm({ ...form, thumbnailUrl: event.target.value })} /></Field><Field label="Status"><select className="h-9 rounded-md border px-2 text-sm" value={form.status || 'ACTIVE'} onChange={(event) => setForm({ ...form, status: event.target.value })}>{['DRAFT', 'ACTIVE', 'INACTIVE', 'EXPIRED'].map((item) => <option key={item}>{item}</option>)}</select></Field><Field label="Priority"><Input type="number" min="0" value={form.priority ?? 0} onChange={(event) => setForm({ ...form, priority: event.target.value })} /></Field></div>}
    onSave={async (form, id) => { await saveVideo(form, id); toast.success(id ? 'Video updated' : 'Video created'); }}
    rowActions={(reload) => allowed ? [
      { label: 'Publish', onSelect: (row) => run(() => publishVideo(row.id, true), reload) },
      { label: 'Unpublish', onSelect: (row) => run(() => publishVideo(row.id, false), reload) },
      { label: 'Delete', onSelect: (row) => { if (!window.confirm(`Delete video ${row.title || row.id}?`)) return; return run(() => removeVideo(row.id), reload); } },
    ] : []}
    detail={(row) => <div className="space-y-2 text-sm">{row.thumbnailUrl && <img src={row.thumbnailUrl} alt="" className="max-h-40 rounded-md" />}{row.videoUrl && <video src={row.videoUrl} controls className="max-h-56 w-full rounded-md" />}<p>{row.description || 'No description'}</p></div>}
  />;
}
function Field({ label, children }) { return <Label className="grid gap-1 text-xs">{label}{children}</Label>; }
async function run(action, reload) { try { await action(); reload((value) => value + 1); } catch (error) { toast.error(suiteError(error)); } }
