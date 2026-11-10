'use client';

import * as React from 'react';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { Button } from '@/components/common/Button';
import { FormDrawer } from '@/components/common/drawers/FormDrawer';
import { DataTable } from '@/components/common/DataTable';
import { toast } from '@/hooks/use-toast';
import { CrmScreen } from '@/modules/crm/CrmScreen';
import { generateContent, loadGenerations, loadPublishes, sessionCan, socialError, socialGaps } from '@/modules/social/social-api';

export default function AiStudioPage() {
  const [allowed, setAllowed] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({ type: 'CAPTION', prompt: '', platform: 'INSTAGRAM', objective: '' });
  const [publishes, setPublishes] = React.useState([]);
  const [refresh, setRefresh] = React.useState(0);
  React.useEffect(() => setAllowed(sessionCan('AI') || sessionCan('SOCIAL')), []);
  React.useEffect(() => { loadPublishes().then(setPublishes).catch(() => setPublishes([])); }, [refresh]);
  const load = React.useCallback((query) => loadGenerations(query), []);

  return <>
    <CrmScreen key={refresh} title="AI Studio & Social" description="Generated content and the publish results stored by the backend." actionLabel="Generate" canCreate={false} load={load}
      gap={{ title: 'Publishing', detail: socialGaps.publish }}
      filters={[{ key: 'type', label: 'All types', options: ['POST', 'POSTER', 'VIDEO', 'CAPTION', 'HASHTAGS'].map((value) => ({ value, label: value })) }, { key: 'status', label: 'All statuses', options: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'].map((value) => ({ value, label: value })) }]}
      columns={[
        { header: 'ID', cell: (row) => row.generationId || row.id },
        { header: 'Customer', cell: (row) => row.customer?.companyName || row.customer?.name || row.customerId },
        { header: 'Type', cell: (row) => row.type },
        { header: 'Platform', cell: (row) => row.platform || '—' },
        { header: 'Credits', cell: (row) => row.creditsSpent ?? '—' },
        { header: 'Status', cell: (row) => <StatusBadge status={String(row.status || '').toLowerCase()} /> },
      ]}
      detail={(row) => <div className="space-y-2 text-sm"><p>{row.caption || 'No caption returned'}</p><p>{(row.hashtags || []).join(' ') || 'No hashtags returned'}</p>{row.mediaUrl && <a className="text-brand" href={row.mediaUrl} target="_blank" rel="noreferrer">Open media</a>}{row.errorMessage && <p className="text-rose-700">{row.errorMessage}</p>}</div>}
    />
    <div className="max-w-none min-w-0 w-full mt-4 space-y-4">
      {allowed && <Button onClick={() => setOpen(true)}>Generate content</Button>}
      <h2 className="text-sm font-semibold">Publishing history</h2>
      <div className="overflow-x-auto"><DataTable label="Published posts" data={publishes} columns={[
        { header: 'Publish', cell: (row) => row.publishId || row.id },
        { header: 'Customer', cell: (row) => row.customer?.companyName || row.customer?.name || '—' },
        { header: 'Account', cell: (row) => row.socialAccount?.accountName || '—' },
        { header: 'Platform', cell: (row) => row.platform },
        { header: 'Scheduled', cell: (row) => String(row.scheduledFor || '').slice(0, 16).replace('T', ' ') || '—' },
        { header: 'Status', cell: (row) => <StatusBadge status={String(row.status || '').toLowerCase()} /> },
        { header: 'Error', cell: (row) => row.errorMessage || '—' },
      ]} /></div>
    </div>
    <FormDrawer open={open} onOpenChange={setOpen} title="Generate content" description="Sends the prompt to the existing AI generate endpoint. Credit limits are enforced by the server." onSubmit={async (event) => { event.preventDefault(); try { const result = await generateContent(form); setOpen(false); setRefresh((value) => value + 1); toast.success(result?.message || 'Generation requested'); } catch (error) { toast.error(socialError(error)); } }}>
      <div className="grid gap-3"><Field label="Type"><select className="h-9 rounded-md border px-2 text-sm" value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}>{['POST', 'POSTER', 'VIDEO', 'CAPTION', 'HASHTAGS'].map((type) => <option key={type}>{type}</option>)}</select></Field><Field label="Prompt"><Input required value={form.prompt} onChange={(event) => setForm({ ...form, prompt: event.target.value })} /></Field><Field label="Platform"><select className="h-9 rounded-md border px-2 text-sm" value={form.platform} onChange={(event) => setForm({ ...form, platform: event.target.value })}>{['INSTAGRAM', 'FACEBOOK', 'YOUTUBE', 'TIKTOK', 'LINKEDIN'].map((platform) => <option key={platform}>{platform}</option>)}</select></Field><Field label="Objective"><Input value={form.objective} onChange={(event) => setForm({ ...form, objective: event.target.value })} /></Field></div>
    </FormDrawer>
  </>;
}

function Field({ label, children }) { return <Label className="grid gap-1 text-xs">{label}{children}</Label>; }
