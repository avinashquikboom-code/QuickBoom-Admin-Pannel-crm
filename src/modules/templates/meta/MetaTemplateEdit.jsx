'use client';

import * as React from 'react';
import api from '../../../../lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '../template-shared';
import { WhatsAppPreview } from './meta-shared';
import { toast } from '@/hooks/use-toast';

const input = 'h-10 w-full rounded-md border border-[#E2E8E5] bg-white px-3 text-sm text-[#172B24] disabled:bg-slate-50 disabled:text-slate-500';
const card = 'min-w-0 space-y-4 rounded-xl border border-[#E2E8E5] bg-white p-4 sm:p-5';

export function MetaTemplateEdit({ template, duplicate = false, onClose, onSaved }) {
  const locked = !duplicate && Boolean(template.metaTemplateId && !String(template.metaTemplateId).startsWith('seed_'));
  const [form, setForm] = React.useState(() => ({ ...template, name: duplicate ? `${template.name} copy` : template.name, templateName: duplicate ? '' : template.templateName, key: duplicate ? '' : template.key || '', headerType: template.headerType || 'NONE', headerContent: template.headerContent || '', body: template.body || '', footer: template.footer || '', buttonsJson: JSON.stringify(template.buttons || [], null, 2) }));
  const [samples, setSamples] = React.useState({});
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');
  const patch = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const variables = React.useMemo(() => Array.from(new Set([...`${form.headerContent} ${form.body}`.matchAll(/\{\{\s*(\w+)\s*\}\}/g)].map((m) => m[1]))), [form.headerContent, form.body]);
  const sample = (value) => String(value || '').replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => samples[key] || `[${key}]`);
  let buttons = [];
  try { buttons = JSON.parse(form.buttonsJson || '[]'); if (!Array.isArray(buttons)) buttons = []; } catch { /* Validation is shown on save. */ }
  async function save(submitToMeta = false) {
    setError('');
    if (!form.name?.trim() || !form.templateName?.trim() || !form.body?.trim()) { setError('Name, Meta template name and message body are required.'); return; }
    let parsedButtons;
    try { parsedButtons = JSON.parse(form.buttonsJson || '[]'); if (!Array.isArray(parsedButtons)) throw new Error(); } catch { setError('Buttons must be a valid JSON array.'); return; }
    setSaving(true);
    try {
      if (locked) {
        await api.put(`/templates/meta/${template.id}`, { name: form.name.trim(), key: form.key.trim() || null });
      } else {
        const payload = { name: form.name.trim(), key: form.key.trim() || undefined, templateName: form.templateName.trim(), language: form.language, category: form.category, headerType: form.headerType, headerContent: form.headerContent || '', body: form.body, footer: form.footer || '', buttons: parsedButtons, variables };
        if (duplicate) await api.post('/templates/meta', { ...payload, submitToMeta });
        else await api.put(`/templates/meta/${template.id}`, { ...payload, status: 'PENDING', metaTemplateId: '' });
      }
      toast.success(submitToMeta ? 'Template submitted to Meta' : 'Template saved');
      onSaved();
    } catch (e) { setError(e?.response?.data?.message || 'Could not save the template.'); } finally { setSaving(false); }
  }
  return <div className="min-w-0 space-y-4 pb-8">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><button type="button" onClick={onClose} className="mb-2 text-sm font-medium text-[#376b55]">← Back to WhatsApp templates</button><h1 className="text-2xl font-semibold text-[#172B24]">{duplicate ? 'Duplicate WhatsApp Template' : 'Edit WhatsApp Template'}</h1><p className="mt-1 break-all text-sm text-[#718078]">{template.name} · {template.key || template.templateName}</p></div><span className="rounded-full border border-[#d7e8de] bg-[#edf7f0] px-3 py-1 text-xs font-semibold text-[#287247]">{duplicate ? 'New template' : template.status || 'Unknown'}</span></div>
    {locked && <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Meta-synced content is read-only. You can edit the internal name and key, or duplicate this template to submit a revision under a new Meta name.</p>}
    {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_380px]"><div className="min-w-0 space-y-4">
      <section className={card}><div><h2 className="font-semibold text-[#172B24]">Template Details</h2><p className="text-xs text-[#718078]">Internal details and the exact Meta template mapping.</p></div><div className="grid gap-4 sm:grid-cols-2">
        <Field label="Internal Template Name" required><Input value={form.name || ''} onChange={(e) => patch('name', e.target.value)} /></Field>
        <Field label="Internal Template Key"><Input value={form.key || ''} onChange={(e) => patch('key', e.target.value)} /></Field>
        <Field label="Meta Template Name" required><Input disabled={locked} value={form.templateName || ''} onChange={(e) => patch('templateName', e.target.value)} placeholder="new_meta_template_name" /></Field>
        <Field label="Category"><select className={input} disabled={locked} value={form.category || 'UTILITY'} onChange={(e) => patch('category', e.target.value)}>{['UTILITY','MARKETING','AUTHENTICATION'].map(x => <option key={x}>{x}</option>)}</select></Field>
        <Field label="Language"><Input disabled={locked} value={form.language || ''} onChange={(e) => patch('language', e.target.value)} /></Field>
        <Field label="Current Meta Approval Status"><div className={`${input} flex items-center bg-slate-50`}>{duplicate ? 'Not submitted' : locked ? template.status : 'Not synced with Meta'}</div></Field>
      </div></section>
      <section className={card}><div><h2 className="font-semibold text-[#172B24]">Message Content</h2><p className="text-xs text-[#718078]">Use the variables defined in the template. Preview samples are never saved.</p></div>
        <Field label="Header Type"><select className={input} disabled={locked} value={form.headerType} onChange={(e) => patch('headerType', e.target.value)}>{['NONE','TEXT','IMAGE','VIDEO','DOCUMENT'].map(x => <option key={x}>{x}</option>)}</select></Field>
        {form.headerType !== 'NONE' && <Field label={form.headerType === 'TEXT' ? 'Header Text' : 'Media / document URL'}><Input disabled={locked} value={form.headerContent} onChange={(e) => patch('headerContent', e.target.value)} /></Field>}
        <Field label="Body Message" required><textarea disabled={locked} className={`${input} min-h-36 py-3`} value={form.body} onChange={(e) => patch('body', e.target.value)} /></Field>
        <Field label="Dynamic Variables" hint="Sample values are used only in the preview.">{variables.length ? <div className="grid gap-2 sm:grid-cols-2">{variables.map(v => <label key={v} className="text-xs text-slate-600"><span className="font-mono">{`{{${v}}}`}</span><Input value={samples[v] || ''} placeholder={`Sample for ${v}`} onChange={e => setSamples({ ...samples, [v]: e.target.value })} /></label>)}</div> : <p className="text-sm text-slate-500">Add variables such as {'{{1}}'} to the message.</p>}</Field>
        <Field label="Footer Text"><Input disabled={locked} value={form.footer} onChange={(e) => patch('footer', e.target.value)} /></Field>
        <Field label="Interactive Buttons" hint='JSON array, for example [{"type":"URL","text":"Visit","url":"https://example.com"}].'><textarea disabled={locked} className={`${input} min-h-24 py-3 font-mono`} value={form.buttonsJson} onChange={(e) => patch('buttonsJson', e.target.value)} /></Field>
      </section>
    </div><aside className={`${card} h-fit lg:sticky lg:top-4`}><h2 className="font-semibold text-[#172B24]">Live WhatsApp Preview</h2><p className="text-xs text-[#718078]">Sample values are shown only here.</p><WhatsAppPreview body={sample(form.body)} header={sample(form.headerContent)} headerType={form.headerType} footer={sample(form.footer)} buttons={buttons.map(b => ({ ...b, text: sample(b.text) }))} /></aside></div>
    <div className="flex flex-wrap justify-end gap-2"><Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button><Button onClick={() => save(false)} disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</Button>{duplicate && <Button variant="outline" onClick={() => save(true)} disabled={saving}>Submit for Meta Approval</Button>}</div>
  </div>;
}
