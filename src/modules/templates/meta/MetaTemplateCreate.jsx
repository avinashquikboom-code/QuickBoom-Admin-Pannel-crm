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
import {
  faArrowLeft,
  faMessage,
  faCheck,
  faChevronRight,
  faChevronLeft,
  faFileLines,
  faEye,
  faPaperPlane,
  faFloppyDisk,
  faCircleExclamation,
  faInfoCircle,
  faMobileScreen,
  faDesktop,
  faPlus,
  faTrash,
} from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { toast } from '@/hooks/use-toast';
import { Field } from '../template-shared';
import { confirmedTemplateOf, templateRecordOf } from './template-response.mjs';
import { WhatsAppPreview } from './meta-shared';

const WIZARD_STEPS = [
  { id: 'details', label: 'Template Details', short: 'Details', step: 1, icon: faFileLines },
  { id: 'content', label: 'Message Content', short: 'Content', step: 2, icon: faMessage },
  { id: 'preview', label: 'Preview', short: 'Preview', step: 3, icon: faEye },
  { id: 'review', label: 'Review & Submit', short: 'Submit', step: 4, icon: faPaperPlane },
];

const CATEGORIES = [
  { value: 'UTILITY', label: 'Utility', desc: 'Account updates, order tracking, alerts' },
  { value: 'MARKETING', label: 'Marketing', desc: 'Promotions, product offers, announcements' },
  { value: 'AUTHENTICATION', label: 'Authentication', desc: 'One-time passwords, login codes' },
];

const LANGUAGES = [
  { value: 'en_US', label: 'English (US)' },
  { value: 'en_GB', label: 'English (UK)' },
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'Hindi' },
  { value: 'mr', label: 'Marathi' },
  { value: 'es', label: 'Spanish' },
  { value: 'pt_BR', label: 'Portuguese (BR)' },
  { value: 'ar', label: 'Arabic' },
];

const HEADER_TYPES = [
  { value: 'NONE', label: 'None' },
  { value: 'TEXT', label: 'Text' },
  { value: 'IMAGE', label: 'Image' },
  { value: 'VIDEO', label: 'Video' },
  { value: 'DOCUMENT', label: 'Document (PDF)' },
];

function slugTemplateName(name) {
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 64);
}

function extractVariables(body) {
  const matches = [...String(body || '').matchAll(/\{\{([a-zA-Z0-9_| ]+)\}\}/g)];
  return Array.from(new Set(matches.map((match) => match[1].trim().split('|')[0].trim()))).filter(Boolean);
}

export function MetaTemplateCreate() {
  const router = useRouter();
  const [step, setStep] = React.useState(0);
  const [submitting, setSubmitting] = React.useState(false);
  const [savingDraft, setSavingDraft] = React.useState(false);

  // Form state
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

  // Dynamic variable sample map for realistic preview
  const [sampleVariables, setSampleVariables] = React.useState({});

  const variables = React.useMemo(() => Array.from(new Set([...extractVariables(form.body), ...(form.headerType === 'TEXT' ? extractVariables(form.headerContent) : [])])), [form.body, form.headerType, form.headerContent]);

  // Keep sample variables populated
  React.useEffect(() => {
    setSampleVariables((prev) => {
      const next = { ...prev };
      variables.forEach((v) => {
        if (!next[v]) {
          next[v] = `[${v}]`;
        }
      });
      return next;
    });
  }, [variables]);

  // Interpolated body for the WhatsApp Preview
  const previewBody = React.useMemo(() => {
    if (!form.body) return '';
    return form.body.replace(/\{\{([a-zA-Z0-9_| ]+)\}\}/g, (_, match) => {
      const [key, fallback] = match.trim().split('|').map((part) => part.trim());
      const val = sampleVariables[key];
      return val && val !== `[${key}]` ? `*${val}*` : fallback || `[${key}]`;
    });
  }, [form.body, sampleVariables]);

  // Parse buttons safely
  const parsedButtons = React.useMemo(() => {
    if (!form.buttonsJson.trim()) return [];
    try {
      const parsed = JSON.parse(form.buttonsJson);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [form.buttonsJson]);

  function patch(field, value) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'name' && !prev.templateName) {
        next.templateName = slugTemplateName(value);
      }
      return next;
    });
  }

  function validateStep(index) {
    if (index === 0) {
      if (!form.name.trim()) return 'Template name is required.';
      if (form.name.trim().length > 100) return 'Template name cannot exceed 100 characters.';
      if (!form.templateName.trim()) return 'Template code (Meta name) is required.';
      if (!/^[a-z0-9_]+$/.test(form.templateName.trim())) {
        return 'Template code must contain only lowercase letters, numbers, and underscores.';
      }
      if (!form.language.trim()) return 'Language is required.';
    }
    if (index === 1) {
      if (!form.body.trim()) return 'Message body is required.';
      if (form.body.trim().length > 1024) return 'Message body cannot exceed 1024 characters.';
      if (form.headerType === 'TEXT') {
        if (!form.headerContent.trim()) return 'Header text is required when header type is TEXT.';
        if (form.headerContent.trim().length > 60) return 'Header text cannot exceed 60 characters.';
        if (/[\p{Extended_Pictographic}\p{Emoji_Presentation}\p{Cc}\p{Cf}\uFE0F*~`]/u.test(form.headerContent) || /_[^_]+_/.test(form.headerContent.replace(/\{\{[^{}]+\}\}/g, ''))) return 'Use one line of plain text without emojis, asterisks or formatting characters in the header.';
      }
      if (form.footer.trim().length > 60) return 'Footer text cannot exceed 60 characters.';
      if (form.buttonsJson.trim()) {
        try {
          const parsed = JSON.parse(form.buttonsJson);
          if (!Array.isArray(parsed)) return 'Buttons must be a JSON array of objects.';
        } catch {
          return 'Buttons JSON contains invalid syntax.';
        }
      }
    }
    return '';
  }

  function handleNext() {
    const errorMsg = validateStep(step);
    if (errorMsg) {
      toast.error(errorMsg);
      return;
    }
    setStep((prev) => Math.min(WIZARD_STEPS.length - 1, prev + 1));
  }

  function handleBack() {
    setStep((prev) => Math.max(0, prev - 1));
  }

  async function handleSave(submitToMeta = true) {
    for (let i = 0; i <= 1; i += 1) {
      const msg = validateStep(i);
      if (msg) {
        toast.error(msg);
        setStep(i);
        return;
      }
    }

    if (submitToMeta && variables.some((v) => !sampleVariables[v]?.trim() || sampleVariables[v].trim() === `[${v}]`)) {
      toast.error('Provide a sample value for every variable before submitting to Meta.');
      return;
    }

    if (submitToMeta) {
      setSubmitting(true);
    } else {
      setSavingDraft(true);
    }

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
        buttons: parsedButtons.length ? parsedButtons : undefined,
        sampleValues: sampleVariables,
        submitToMeta: Boolean(submitToMeta),
        isLocalActive: true,
      };

      const response = await api.post('/templates/meta', payload);
      const result = submitToMeta ? confirmedTemplateOf(response) : templateRecordOf(response);
      const status = result?.status || result?.metaStatus || 'UNKNOWN';

      toast.success(
        submitToMeta
          ? `Meta template ${result.metaTemplateId}: ${status}`
          : 'Template saved locally as draft.',
      );
      router.push('/admin/sections/meta-templates');
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || 'Could not save Meta template.';
      toast.error(Array.isArray(message) ? message.join(', ') : message);
    } finally {
      setSubmitting(false);
      setSavingDraft(false);
    }
  }

  return (
    <div className="min-w-0 w-full max-w-full space-y-6 pb-[max(2rem,env(safe-area-inset-bottom))]">
      {/* ── Page Header ────────────────────────────────────────────── */}
      <PageHeader
        category="TEMPLATES & ASSETS"
        title="Add Single Template"
        icon={faMessage}
        description="Create a WhatsApp Business template and submit it to Meta for approval."
        actions={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Button asChild variant="outline" className="w-full sm:w-auto border-slate-200">
              <Link href="/admin/sections/meta-templates">
                <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
                Back to All Templates
              </Link>
            </Button>
          </div>
        }
      />

      {/* ── Top Wizard Stepper ─────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
          {WIZARD_STEPS.map((s, idx) => {
            const isCurrent = idx === step;
            const isDone = idx < step;

            return (
              <div key={s.id} className="flex items-center shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    if (idx < step) setStep(idx);
                  }}
                  disabled={idx > step || submitting || savingDraft}
                  className={`group flex items-center gap-2 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold transition-all ${
                    isCurrent
                      ? 'bg-[#16A34A] text-white shadow-sm'
                      : isDone
                      ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                      : 'text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full text-xs font-bold ${
                      isCurrent
                        ? 'bg-white text-emerald-700'
                        : isDone
                        ? 'bg-emerald-200 text-emerald-800'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {isDone ? <FontAwesomeIcon icon={faCheck} className="text-[10px]" /> : s.step}
                  </span>
                  <span className="hidden sm:inline">{s.label}</span>
                  <span className="sm:hidden">{s.short}</span>
                </button>
                {idx < WIZARD_STEPS.length - 1 && (
                  <div
                    className={`mx-2 sm:mx-3 h-0.5 w-6 sm:w-12 shrink-0 ${
                      idx < step ? 'bg-emerald-400' : 'bg-slate-200'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Main Two-Column Layout ─────────────────────────────────── */}
      <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,400px)]">
        {/* Form Container */}
        <div className="min-w-0 rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-7 shadow-sm space-y-6">
          {/* STEP 1: Template Details */}
          {step === 0 && (
            <div className="space-y-4">
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3.5 text-xs text-emerald-800">
                <p className="font-semibold text-emerald-900">Template Meta Information</p>
                <p className="mt-0.5 text-emerald-700">
                  Meta requires template names to be lowercase with underscores. This name cannot be changed once submitted.
                </p>
              </div>

              <Field label="Template Display Name" required hint="e.g. Lead Follow Up Alert">
                <Input
                  value={form.name}
                  onChange={(e) => patch('name', e.target.value)}
                  placeholder="e.g. Lead Follow Up Alert"
                  className="border-slate-300 focus-visible:ring-emerald-500"
                />
              </Field>

              <Field
                label="Template Code (Meta Name)"
                required
                hint="Lowercase letters, numbers and underscores only (max 64 chars)"
              >
                <Input
                  value={form.templateName}
                  onChange={(e) => patch('templateName', slugTemplateName(e.target.value))}
                  placeholder="lead_follow_up_alert"
                  className="font-mono text-xs sm:text-sm border-slate-300 focus-visible:ring-emerald-500"
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Category" required>
                  <select
                    value={form.category}
                    onChange={(e) => patch('category', e.target.value)}
                    className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label} ({cat.desc})
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Language" required>
                  <select
                    value={form.language}
                    onChange={(e) => patch('language', e.target.value)}
                    className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    {LANGUAGES.map((lang) => (
                      <option key={lang.value} value={lang.value}>
                        {lang.label} [{lang.value}]
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field label="Internal Description (Optional)" hint="For team reference only; not sent to Meta">
                <textarea
                  value={form.description}
                  onChange={(e) => patch('description', e.target.value)}
                  rows={3}
                  placeholder="Explain when and by whom this template should be used..."
                  className="w-full rounded-md border border-slate-300 p-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </Field>
            </div>
          )}

          {/* STEP 2: Message Content */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Header Type">
                  <select
                    value={form.headerType}
                    onChange={(e) => patch('headerType', e.target.value)}
                    className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-emerald-500"
                  >
                    {HEADER_TYPES.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </Field>

                {form.headerType !== 'NONE' && (
                  <Field
                    label={
                      form.headerType === 'TEXT'
                        ? 'Header Text'
                        : `${form.headerType} Sample / Media URL`
                    }
                    required={form.headerType === 'TEXT'}
                    hint={form.headerType === 'TEXT' ? 'Max 60 characters' : 'Public HTTPS link'}
                  >
                    <Input
                      value={form.headerContent}
                      onChange={(e) => patch('headerContent', e.target.value)}
                      placeholder={
                        form.headerType === 'TEXT'
                          ? 'Important Update'
                          : form.headerType === 'IMAGE' ? 'https://example.com/image.jpg' : form.headerType === 'VIDEO' ? 'https://example.com/video.mp4' : 'https://example.com/document.pdf'
                      }
                      maxLength={form.headerType === 'TEXT' ? 60 : undefined}
                      className="border-slate-300 focus-visible:ring-emerald-500"
                    />
                  </Field>
                )}
              </div>

              <Field
                label="Message Body"
                required
                hint="Use {{variableName}} or {{1}} for dynamic fields. Max 1024 characters."
              >
                <div className="relative">
                  <textarea
                    value={form.body}
                    onChange={(e) => patch('body', e.target.value)}
                    rows={7}
                    maxLength={1024}
                    placeholder="Hello {{customerName}}, thank you for contacting {{companyName}}. Your appointment is confirmed for {{appointmentTime}}."
                    className="w-full rounded-md border border-slate-300 p-3 font-mono text-xs sm:text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <span className="absolute bottom-2.5 right-3 text-[11px] text-slate-400">
                    {form.body.length}/1024
                  </span>
                </div>
              </Field>

              {variables.length > 0 && (
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3 text-xs text-emerald-900">
                  <p className="font-semibold">Detected Variables ({variables.length}):</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {variables.map((item) => (
                      <span
                        key={item}
                        className="rounded-md bg-white border border-emerald-200 px-2 py-0.5 font-mono text-emerald-800 font-bold"
                      >
                        {`{{${item}}}`}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <Field label="Footer Text (Optional)" hint="Small muted text at the bottom. Max 60 characters.">
                <Input
                  value={form.footer}
                  onChange={(e) => patch('footer', e.target.value)}
                  maxLength={60}
                  placeholder="e.g. Reply STOP to unsubscribe"
                  className="border-slate-300 focus-visible:ring-emerald-500"
                />
              </Field>

              <Field
                label="Buttons / Call-to-Actions (Optional JSON)"
                hint='Example: [{"type":"URL","text":"Visit Website","url":"https://quikboom.com"}] or [{"type":"QUICK_REPLY","text":"Call Us"}]'
              >
                <textarea
                  value={form.buttonsJson}
                  onChange={(e) => patch('buttonsJson', e.target.value)}
                  rows={3}
                  placeholder='[{"type":"URL","text":"Visit","url":"https://example.com"}]'
                  className="w-full rounded-md border border-slate-300 p-2.5 font-mono text-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </Field>
            </div>
          )}

          {/* STEP 3: Preview */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3.5 text-xs text-blue-900">
                <p className="font-semibold text-blue-950">Realistic WhatsApp Message Simulation</p>
                <p className="mt-0.5 text-blue-700">
                  Test sample replacement values for dynamic variables to ensure formatting and line wraps look natural before submitting to Meta.
                </p>
              </div>

              {variables.length > 0 && (
                <div className="space-y-2 border-b border-slate-100 pb-4">
                  <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Sample Replacement Values:
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {variables.map((key) => (
                      <div key={key} className="flex items-center gap-2">
                        <span className="w-24 shrink-0 font-mono text-xs text-slate-600 truncate">{`{{${key}}}`}:</span>
                        <Input
                          value={sampleVariables[key] === `[${key}]` ? '' : sampleVariables[key] || ''}
                          onChange={(e) =>
                            setSampleVariables((prev) => ({
                              ...prev,
                              [key]: e.target.value || `[${key}]`,
                            }))
                          }
                          placeholder={`Value for ${key}`}
                          className="h-8 text-xs border-slate-300"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Responsive comparison previews */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-700 block">WhatsApp Client Preview:</span>
                <WhatsAppPreview
                  headerType={form.headerType}
                  header={form.headerContent}
                  body={previewBody || 'No message body provided'}
                  footer={form.footer}
                  buttons={parsedButtons}
                />
              </div>
            </div>
          )}

          {/* STEP 4: Review & Submit */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4">
                <h3 className="font-bold text-slate-900 text-sm mb-3">Review Template Payload</h3>

                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 text-xs">
                  <div>
                    <dt className="text-slate-500 font-medium uppercase">Template Name</dt>
                    <dd className="font-semibold text-slate-900 mt-0.5">{form.name}</dd>
                  </div>

                  <div>
                    <dt className="text-slate-500 font-medium uppercase">Meta Template Code</dt>
                    <dd className="font-mono font-semibold text-emerald-800 mt-0.5">{form.templateName}</dd>
                  </div>

                  <div>
                    <dt className="text-slate-500 font-medium uppercase">Category</dt>
                    <dd className="font-semibold text-slate-900 mt-0.5">{form.category}</dd>
                  </div>

                  <div>
                    <dt className="text-slate-500 font-medium uppercase">Language</dt>
                    <dd className="font-semibold text-slate-900 mt-0.5">{form.language}</dd>
                  </div>

                  <div>
                    <dt className="text-slate-500 font-medium uppercase">Header</dt>
                    <dd className="font-semibold text-slate-900 mt-0.5">
                      {form.headerType === 'NONE' ? 'None' : `${form.headerType}: ${form.headerContent || '—'}`}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-slate-500 font-medium uppercase">Footer</dt>
                    <dd className="font-semibold text-slate-900 mt-0.5">{form.footer || '—'}</dd>
                  </div>

                  <div className="col-span-1 sm:col-span-2">
                    <dt className="text-slate-500 font-medium uppercase">Internal Description</dt>
                    <dd className="text-slate-900 mt-0.5 whitespace-pre-wrap break-words">{form.description || '—'}</dd>
                  </div>

                  <div className="col-span-1 sm:col-span-2">
                    <dt className="text-slate-500 font-medium uppercase">Buttons</dt>
                    <dd className="text-slate-900 mt-0.5 whitespace-pre-wrap break-words">{parsedButtons.length ? JSON.stringify(parsedButtons, null, 2) : 'None'}</dd>
                  </div>

                  <div className="col-span-1 sm:col-span-2">
                    <dt className="text-slate-500 font-medium uppercase">Variables</dt>
                    <dd className="font-mono text-emerald-700 mt-0.5">
                      {variables.length ? variables.map((v) => `{{${v}}}`).join(', ') : 'None'}
                    </dd>
                  </div>

                  <div className="col-span-1 sm:col-span-2 border-t border-emerald-200/60 pt-2.5">
                    <dt className="text-slate-500 font-medium uppercase">Body Content</dt>
                    <dd className="whitespace-pre-wrap break-words font-mono text-xs text-slate-800 mt-1 bg-white p-2.5 rounded-lg border border-emerald-100">
                      {form.body}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 text-xs text-slate-600 space-y-1">
                <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faInfoCircle} className="text-emerald-600" />
                  Meta Cloud API Submission Policy:
                </p>
                <p>
                  Upon submission, your template is instantly synced to Meta&apos;s WhatsApp Cloud API. Approval status typically enters <strong>PENDING</strong> and resolves to <strong>APPROVED</strong> or <strong>REJECTED</strong> within minutes.
                </p>
              </div>
            </div>
          )}

          {/* Wizard Footer Controls */}
          <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-2.5 pt-4 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              disabled={step === 0 || submitting || savingDraft}
              onClick={handleBack}
              className="w-full sm:w-auto border-slate-300 text-slate-700"
            >
              <FontAwesomeIcon icon={faChevronLeft} className="mr-2 text-xs" />
              Back
            </Button>

            <div className="flex w-full sm:w-auto flex-col sm:flex-row items-center gap-2">
              {step === 3 && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={submitting || savingDraft}
                  onClick={() => handleSave(false)}
                  className="w-full sm:w-auto border-slate-300 text-slate-700"
                >
                  <FontAwesomeIcon icon={faFloppyDisk} className="mr-2 text-xs" />
                  {savingDraft ? 'Saving Draft…' : 'Save Local Draft'}
                </Button>
              )}

              {step < WIZARD_STEPS.length - 1 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  className="w-full sm:w-auto bg-[#16A34A] hover:bg-[#15803D] text-white font-semibold shadow-sm"
                >
                  Continue
                  <FontAwesomeIcon icon={faChevronRight} className="ml-2 text-xs" />
                </Button>
              ) : (
                <Button
                  type="button"
                  disabled={submitting || savingDraft}
                  onClick={() => handleSave(true)}
                  className="w-full sm:w-auto bg-[#16A34A] hover:bg-[#15803D] text-white font-semibold shadow-md"
                >
                  <FontAwesomeIcon icon={faPaperPlane} className="mr-2 text-xs" />
                  {submitting ? 'Submitting to Meta…' : 'Submit to Meta'}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Desktop Sticky Live Preview Column */}
        <aside className="min-w-0">
          <div className="sticky top-6 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Live WhatsApp Preview</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                <FontAwesomeIcon icon={faWhatsapp} className="text-emerald-600" />
                Auto-Updating
              </span>
            </div>

            <WhatsAppPreview
              headerType={form.headerType}
              header={form.headerContent}
              body={previewBody || 'Start typing your template message body...'}
              footer={form.footer}
              buttons={parsedButtons}
            />

            <div className="rounded-xl bg-slate-50 p-3 text-[11px] text-slate-500 leading-relaxed border border-slate-100">
              💡 <strong>Tip:</strong> Variables wrapped in <code>{'{{variableName}}'}</code> will show as bold test values in this preview.
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
