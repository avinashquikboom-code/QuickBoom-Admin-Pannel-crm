'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '../../../../lib/api';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import { faArrowLeft, faMessage } from '@fortawesome/free-solid-svg-icons';
import { toast } from '@/hooks/use-toast';
import { envelope, Field } from '../template-shared';
import { WhatsAppPreview } from './meta-shared';

const STEPS = ['Template details', 'Message content', 'Preview', 'Review & submit'];

function slugTemplateName(name) {
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 64);
}

function extractVariables(body) {
  const matches = [...String(body || '').matchAll(/\{\{(\w+)\}\}/g)];
  return Array.from(new Set(matches.map((match) => match[1])));
}

export function MetaTemplateCreate() {
  const router = useRouter();
  const [step, setStep] = React.useState(0);
  const [submitting, setSubmitting] = React.useState(false);
  const [form, setForm] = React.useState({
    name: '',
    templateName: '',
    category: 'UTILITY',
    language: 'en_US',
    description: '',
    headerType: 'NONE',
    headerContent: '',
    body: '',
    footer: '',
    buttonsJson: '',
  });

  const variables = extractVariables(form.body);
  const previewBody = form.body.replace(/\{\{(\w+)\}\}/g, (_, key) => `[${key}]`);

  function patch(field, value) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'name' && !prev.templateName) next.templateName = slugTemplateName(value);
      return next;
    });
  }

  function validateStep(index) {
    if (index === 0) {
      if (!form.name.trim()) return 'Template name is required.';
      if (!form.templateName.trim()) return 'Template code is required.';
    }
    if (index === 1) {
      if (!form.body.trim()) return 'Message body is required.';
      if (form.headerType === 'TEXT' && !form.headerContent.trim()) return 'Header text is required for TEXT headers.';
    }
    return '';
  }

  function next() {
    const message = validateStep(step);
    if (message) {
      toast.error(message);
      return;
    }
    setStep((value) => Math.min(STEPS.length - 1, value + 1));
  }

  async function submit() {
    for (let index = 0; index < STEPS.length - 1; index += 1) {
      const message = validateStep(index);
      if (message) {
        toast.error(message);
        setStep(index);
        return;
      }
    }
    let buttons;
    if (form.buttonsJson.trim()) {
      try {
        buttons = JSON.parse(form.buttonsJson);
        if (!Array.isArray(buttons)) throw new Error('Buttons must be a JSON array.');
      } catch (err) {
        toast.error(err?.message || 'Invalid buttons JSON.');
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        templateName: form.templateName.trim(),
        category: form.category,
        language: form.language,
        headerType: form.headerType,
        headerContent: form.headerType === 'NONE' ? undefined : form.headerContent.trim() || undefined,
        body: form.body.trim(),
        footer: form.footer.trim() || undefined,
        variables,
        buttons,
        submitToMeta: true,
        isLocalActive: true,
      };
      const result = envelope(await api.post('/templates/meta', payload));
      const status = result?.status || result?.metaStatus || 'PENDING';
      toast.success(`Template submitted to Meta. Current status: ${status}`);
      router.push('/admin/sections/meta-templates');
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || 'Could not create Meta template.';
      toast.error(Array.isArray(message) ? message.join(', ') : message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-w-0 w-full max-w-full space-y-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <PageHeader
        category="TEMPLATES & ASSETS"
        title="Add Single Template"
        icon={faMessage}
        description="Create a WhatsApp Business template and submit it to Meta for approval."
        actions={
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href="/admin/sections/meta-templates">
              <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
              Back to All Templates
            </Link>
          </Button>
        }
      />

      <ol className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide text-[#718078]">
        {STEPS.map((label, index) => (
          <li
            key={label}
            className={`rounded-full px-3 py-1 ${index === step ? 'bg-[#163A2E] text-white' : index < step ? 'bg-[#E8F1EC] text-[#163A2E]' : 'border border-[#E2E8E5]'}`}
          >
            {index + 1}. {label}
          </li>
        ))}
      </ol>

      <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,380px)]">
        <div className="min-w-0 space-y-4 rounded-2xl border border-[#E2E8E5] bg-white p-4 sm:p-6">
          {step === 0 ? (
            <>
              <Field label="Template name" required>
                <Input value={form.name} onChange={(e) => patch('name', e.target.value)} placeholder="Lead contacted notice" />
              </Field>
              <Field label="Template code (Meta name)" required hint="Lowercase with underscores">
                <Input value={form.templateName} onChange={(e) => patch('templateName', slugTemplateName(e.target.value))} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Category">
                  <select value={form.category} onChange={(e) => patch('category', e.target.value)} className="h-10 w-full rounded-md border px-3 text-sm">
                    {['UTILITY', 'MARKETING', 'AUTHENTICATION'].map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Language">
                  <Input value={form.language} onChange={(e) => patch('language', e.target.value)} placeholder="en_US" />
                </Field>
              </div>
              <Field label="Description (internal)">
                <textarea value={form.description} onChange={(e) => patch('description', e.target.value)} rows={3} className="w-full rounded-md border px-3 py-2 text-sm" />
              </Field>
            </>
          ) : null}

          {step === 1 ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Header type">
                  <select value={form.headerType} onChange={(e) => patch('headerType', e.target.value)} className="h-10 w-full rounded-md border px-3 text-sm">
                    {['NONE', 'TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT'].map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </Field>
                {form.headerType !== 'NONE' ? (
                  <Field label="Header content / media URL">
                    <Input value={form.headerContent} onChange={(e) => patch('headerContent', e.target.value)} />
                  </Field>
                ) : null}
              </div>
              <Field label="Message body" required hint="Use {{variableName}} for dynamic fields">
                <textarea value={form.body} onChange={(e) => patch('body', e.target.value)} rows={8} className="w-full rounded-md border px-3 py-2 text-sm font-mono" placeholder="Hi {{leadName}}, thanks for connecting with {{companyName}}." />
              </Field>
              {variables.length ? (
                <p className="text-sm text-[#718078]">Detected variables: {variables.map((item) => `{{${item}}}`).join(', ')}</p>
              ) : null}
              <Field label="Footer (optional)">
                <Input value={form.footer} onChange={(e) => patch('footer', e.target.value)} maxLength={60} />
              </Field>
              <Field label="Buttons JSON (optional)" hint='Example: [{"type":"URL","text":"Visit","url":"https://example.com"}]'>
                <textarea value={form.buttonsJson} onChange={(e) => patch('buttonsJson', e.target.value)} rows={4} className="w-full rounded-md border px-3 py-2 font-mono text-xs" />
              </Field>
            </>
          ) : null}

          {step === 2 ? (
            <div className="space-y-3">
              <p className="text-sm text-[#718078]">Mobile and desktop previews use sample placeholder values for variables.</p>
              <div className="grid gap-6 md:grid-cols-2">
                <motionPreview label="Mobile">
                  <WhatsAppPreview compact header={form.headerType === 'TEXT' ? form.headerContent : form.headerType !== 'NONE' ? `[${form.headerType} header]` : ''} body={previewBody} footer={form.footer} />
                </motionPreview>
                <motionPreview label="Desktop">
                  <WhatsAppPreview header={form.headerType === 'TEXT' ? form.headerContent : form.headerType !== 'NONE' ? `[${form.headerType} header]` : ''} body={previewBody} footer={form.footer} />
                </motionPreview>
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <dl className="grid gap-3 text-sm">
              <Row label="Name" value={form.name} />
              <Row label="Code" value={form.templateName} />
              <Row label="Category" value={form.category} />
              <Row label="Language" value={form.language} />
              <Row label="Header" value={form.headerType === 'NONE' ? 'None' : `${form.headerType}: ${form.headerContent || '—'}`} />
              <Row label="Body" value={form.body} multiline />
              <Row label="Footer" value={form.footer || '—'} />
              <Row label="Variables" value={variables.join(', ') || '—'} />
              <Row label="Meta submission" value="Will submit to WhatsApp Cloud API (approval typically PENDING)" />
            </dl>
          ) : null}

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-between">
            <Button type="button" variant="outline" disabled={step === 0 || submitting} onClick={() => setStep((value) => Math.max(0, value - 1))}>
              Back
            </Button>
            {step < STEPS.length - 1 ? (
              <Button type="button" onClick={next}>Continue</Button>
            ) : (
              <Button type="button" disabled={submitting} onClick={submit}>
                {submitting ? 'Submitting to Meta…' : 'Submit to Meta'}
              </Button>
            )}
          </div>
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-4 space-y-2 rounded-2xl border bg-white p-4">
            <Label className="text-xs uppercase text-[#718078]">Live preview</Label>
            <WhatsAppPreview header={form.headerType === 'TEXT' ? form.headerContent : ''} body={previewBody || 'Start typing your message…'} footer={form.footer} />
          </div>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value, multiline }) {
  return (
    <div className="border-b border-[#E2E8E5] pb-2">
      <dt className="text-xs font-semibold uppercase text-[#718078]">{label}</dt>
      <dd className={`mt-1 text-[#172B24] ${multiline ? 'whitespace-pre-wrap break-words' : ''}`}>{value}</dd>
    </div>
  );
}

function motionPreview({ label, children }) {
  return (
    <div>
      <p className="mb-2 text-center text-xs font-semibold uppercase text-[#718078]">{label}</p>
      {children}
    </div>
  );
}
