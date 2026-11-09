'use client';

import * as React from 'react';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { toast } from '@/hooks/use-toast';
import { CrmScreen } from '@/modules/crm/CrmScreen';
import { createInfluencer, loadInfluencerCategories, loadInfluencers, removeInfluencer, sessionCan, socialError, socialGaps, suspendInfluencer, updateInfluencer } from '@/modules/social/social-api';

const blank = { name: '', handle: '', platform: 'INSTAGRAM', categoryId: '', city: '', email: '', phone: '', followers: '', engagementRate: '', instagramHandle: '', youtubeHandle: '', bio: '', status: 'PENDING' };

export default function InfluencerHubPage() {
  const [allowed, setAllowed] = React.useState(false);
  const [categories, setCategories] = React.useState([]);
  React.useEffect(() => setAllowed(sessionCan('INFLUENCER')), []);
  React.useEffect(() => { loadInfluencerCategories().then(setCategories).catch(() => setCategories([])); }, []);
  const load = React.useCallback((query) => loadInfluencers({ search: query.search || undefined, status: query.status || undefined, category: query.category || undefined }), []);

  return <CrmScreen title="Influencer Hub" description="Influencer profiles returned by the admin influencer list." actionLabel="Add influencer" canCreate={allowed} load={load} blank={blank}
    gap={{ title: 'Performance history', detail: socialGaps.performance }}
    stats={(payload) => [{ label: 'Listed', value: payload.rows?.length || 0 }, { label: 'Approved or active', value: (payload.rows || []).filter((row) => row.status === 'ACTIVE' || row.status === 'APPROVED').length }, { label: 'Pending', value: (payload.rows || []).filter((row) => row.status === 'PENDING').length }]}
    filters={[{ key: 'status', label: 'All statuses', options: ['PENDING', 'APPROVED', 'ACTIVE', 'REJECTED', 'SUSPENDED'].map((value) => ({ value, label: value })) }, { key: 'category', label: 'All categories', options: categories.map((item) => ({ value: String(item.id), label: item.name })) }]}
    columns={[
      { header: 'Name', cell: (row) => row.name },
      { header: 'Handle', cell: (row) => row.handle || '—' },
      { header: 'Platform', cell: (row) => row.platform || '—' },
      { header: 'Category', cell: (row) => row.categoryName || row.category?.name || '—' },
      { header: 'Followers', cell: (row) => row.followersCount || row.followers || 0 },
      { header: 'Engagement', cell: (row) => row.engagementRate ?? '—' },
      { header: 'Bookings', cell: (row) => row._count?.bookings ?? '—' },
      { header: 'Status', cell: (row) => <StatusBadge status={String(row.status || '').toLowerCase()} /> },
    ]}
    renderForm={(form, setForm) => <div className="grid gap-3 sm:grid-cols-2"><Field label="Name"><Input required value={form.name || ''} onChange={(event) => setForm({ ...form, name: event.target.value })} /></Field><Field label="Handle"><Input value={form.handle || ''} onChange={(event) => setForm({ ...form, handle: event.target.value })} /></Field><Field label="Platform"><select className="h-9 rounded-md border px-2 text-sm" value={form.platform || 'INSTAGRAM'} onChange={(event) => setForm({ ...form, platform: event.target.value })}><option value="INSTAGRAM">Instagram</option><option value="YOUTUBE">YouTube</option><option value="TIKTOK">TikTok</option><option value="SNAPCHAT">Snapchat</option></select></Field><Field label="Category"><select className="h-9 rounded-md border px-2 text-sm" value={String(form.categoryId || '')} onChange={(event) => setForm({ ...form, categoryId: event.target.value })}><option value="">None</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field><Field label="City"><Input value={form.city || ''} onChange={(event) => setForm({ ...form, city: event.target.value })} /></Field><Field label="Email"><Input value={form.email || ''} onChange={(event) => setForm({ ...form, email: event.target.value })} /></Field><Field label="Phone"><Input value={form.phone || ''} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></Field><Field label="Followers"><Input type="number" value={form.followers ?? ''} onChange={(event) => setForm({ ...form, followers: event.target.value })} /></Field><Field label="Engagement rate"><Input type="number" value={form.engagementRate ?? ''} onChange={(event) => setForm({ ...form, engagementRate: event.target.value })} /></Field><Field label="Instagram"><Input value={form.instagramHandle || ''} onChange={(event) => setForm({ ...form, instagramHandle: event.target.value })} /></Field><Field label="YouTube"><Input value={form.youtubeHandle || ''} onChange={(event) => setForm({ ...form, youtubeHandle: event.target.value })} /></Field><Field label="Bio"><Input value={form.bio || ''} onChange={(event) => setForm({ ...form, bio: event.target.value })} /></Field></div>}
    onSave={async (form, id) => { if (id) await updateInfluencer(id, form); else await createInfluencer(form); toast.success(id ? 'Influencer updated' : 'Influencer created'); }}
    rowActions={(reload) => allowed ? [{ label: 'Suspend', onSelect: async (row) => { try { await suspendInfluencer(row.id); reload((value) => value + 1); } catch (error) { toast.error(socialError(error)); } } }, { label: 'Delete', onSelect: async (row) => { try { await removeInfluencer(row.id); reload((value) => value + 1); } catch (error) { toast.error(socialError(error)); } } }] : []}
    detail={(row) => <div className="space-y-1 text-sm"><p className="font-medium">{row.name}</p><p>{row.email || 'No email'} · {row.phone || 'No phone'}</p><p>{row.city || row.location || 'No city'} · {row.platform}</p><p>Instagram {row.instagramHandle || '—'} · YouTube {row.youtubeHandle || '—'}</p><p>{row.bio || 'No bio'}</p></div>}
  />;
}

function Field({ label, children }) { return <Label className="grid gap-1 text-xs">{label}{children}</Label>; }
