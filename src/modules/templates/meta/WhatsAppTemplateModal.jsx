'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import api from '../../../../lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import {
  faMobileScreen,
  faMagnifyingGlass,
  faCopy,
  faArrowUpRightFromSquare,
  faPhone,
  faCircleInfo,
  faCheck,
  faXmark,
  faPlus,
  faTrash,
  faCircleCheck,
} from '@fortawesome/free-solid-svg-icons';
import { toast } from '@/hooks/use-toast';
import { envelope } from '../template-shared';

const CATEGORIES = [
  { value: 'UTILITY', label: 'UTILITY' },
  { value: 'MARKETING', label: 'MARKETING' },
  { value: 'AUTHENTICATION', label: 'AUTHENTICATION' },
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
  { value: 'DOCUMENT', label: 'Document' },
  { value: 'VIDEO', label: 'Video' },
];

const SYSTEM_VARIABLES = [
  // Customer
  { key: 'customer_name', category: 'Customer', label: 'Customer Full Name', desc: 'Customer verified display name', sample: 'John Doe' },
  { key: 'customer_id', category: 'Customer', label: 'Customer ID', desc: 'Unique account identifier for customer', sample: 'CUST-84920' },
  { key: 'customer_email', category: 'Customer', label: 'Recipient Email', desc: 'Registered primary email address', sample: 'customer@example.com' },
  { key: 'customer_phone', category: 'Customer', label: 'Contact Phone', desc: 'WhatsApp contact phone number', sample: '+91 98765 43210' },
  { key: 'company_name', category: 'Customer', label: 'Organization Name', desc: 'Business or enterprise client name', sample: 'Acme Corp' },
  { key: 'city', category: 'Customer', label: 'City / Territory', desc: 'Customer registered location or territory', sample: 'Mumbai' },

  // Investor
  { key: 'investor_name', category: 'Investor', label: 'Investor Full Name', desc: 'Investor verified display name', sample: 'Sarah Jenkins' },
  { key: 'portfolio_id', category: 'Investor', label: 'Portfolio Reference', desc: 'Unique investment portfolio reference ID', sample: 'INV-2026-99' },
  { key: 'investment_amount', category: 'Investor', label: 'Investment Amount', desc: 'Capital allocated or confirmed amount', sample: '₹5,00,000' },
  { key: 'plan_name', category: 'Investor', label: 'Active Plan Tier', desc: 'Active subscription tier or package', sample: 'Standard Package' },

  // Project
  { key: 'project_name', category: 'Project', label: 'Project Name', desc: 'Active project or development campaign', sample: 'Alpha Horizon' },
  { key: 'project_code', category: 'Project', label: 'Project Code', desc: 'Unique project code reference', sample: 'PRJ-402' },
  { key: 'delivery_date', category: 'Project', label: 'Milestone Target Date', desc: 'Scheduled delivery or completion date', sample: '2026-12-15' },

  // Lead
  { key: 'lead_name', category: 'Lead', label: 'Lead Contact Name', desc: 'Prospective lead or enquiry contact name', sample: 'Rahul Sharma' },
  { key: 'lead_id', category: 'Lead', label: 'Lead ID', desc: 'Unique tracking reference for lead', sample: 'LD-7721' },
  { key: 'lead_phone', category: 'Lead', label: 'Lead Phone', desc: 'Contact mobile number for the lead', sample: '+91 91234 56789' },
  { key: 'lead_status', category: 'Lead', label: 'Pipeline Stage', desc: 'Current pipeline or workflow stage name', sample: 'Qualified Lead' },
  { key: 'sales_owner', category: 'Lead', label: 'Sales Representative', desc: 'Assigned sales representative name', sample: 'Avinash Magar' },

  // Deal
  { key: 'deal_title', category: 'Deal', label: 'Deal Name', desc: 'Title of the business deal / proposal', sample: 'Enterprise License' },
  { key: 'deal_amount', category: 'Deal', label: 'Deal Valuation', desc: 'Agreed commercial valuation of deal', sample: '₹1,50,000' },
  { key: 'deal_stage', category: 'Deal', label: 'Deal Stage', desc: 'Contract negotiation or closing phase', sample: 'Closing' },

  // Employee
  { key: 'employee_name', category: 'Employee', label: 'Staff Full Name', desc: 'Assigned employee or team member', sample: 'Pooja Patil' },
  { key: 'employee_id', category: 'Employee', label: 'Staff Code', desc: 'Internal employee ID code', sample: 'EMP-005' },
  { key: 'designation', category: 'Employee', label: 'Designation', desc: 'Official designation or job title', sample: 'Senior Developer' },
  { key: 'department', category: 'Employee', label: 'Department', desc: 'Operating department or division', sample: 'Development' },

  // Company / System
  { key: 'business_name', category: 'Company', label: 'Brand Name', desc: 'Official trading business / brand name', sample: 'QB Unify' },
  { key: 'support_phone', category: 'Company', label: 'Support Helpline', desc: 'Customer support hotline number', sample: '+91 80000 12345' },
  { key: 'support_email', category: 'Company', label: 'Support Email', desc: 'Customer care email address', sample: 'support@qbunify.online' },
  { key: 'portal_url', category: 'Company', label: 'Portal Link', desc: 'Customer self-service portal URL', sample: 'https://qbunify.online' },
  { key: 'current_date', category: 'Company', label: 'Today Date', desc: 'Current formatted date string', sample: 'Nov 23, 2026' },
];

function slugTemplateName(name) {
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 64);
}

function extractVariables(text) {
  const matches = [...String(text || '').matchAll(/\{\{([a-zA-Z0-9_| ]+)\}\}/g)];
  return Array.from(
    new Set(
      matches.map((m) => {
        const raw = m[1].trim();
        // Support {{key | fallback}}
        return raw.split('|')[0].trim();
      })
    )
  ).filter(Boolean);
}

export function WhatsAppTemplateModal({
  template = null,
  duplicate = false,
  isOpen = true,
  onClose,
  onSaved,
  isPageMode = false,
}) {
  const router = useRouter();
  const textareaRef = React.useRef(null);

  const isEdit = Boolean(template && !duplicate);

  // Form State
  const [form, setForm] = React.useState(() => {
    let initialButtons = [
      { type: 'URL', text: 'View Portfolio', url: 'https://qbunify.online/portfolio' },
      { type: 'URL', text: 'Support Portal', url: 'https://qbunify.online/support' },
    ];

    if (template?.buttons && Array.isArray(template.buttons) && template.buttons.length > 0) {
      initialButtons = template.buttons;
    }

    return {
      name: duplicate ? `${template?.name || ''} copy` : template?.name || 'Investment Confirmed',
      templateName: duplicate ? '' : template?.templateName || (isEdit ? '' : 'investment_confirmed_v1'),
      key: duplicate ? '' : template?.key || '',
      category: template?.category || 'UTILITY',
      language: template?.language || 'en_US',
      headerType: template?.headerType || 'NONE',
      headerContent: template?.headerContent || '',
      body:
        template?.body ||
        `Hello {{customer_name}},\nWelcome to QB Unify!\n\nCustomer ID: {{customer_id}}\n\nTeam QB Unify`,
      footer: template?.footer || 'Team QB Unify · Secure Fintech',
      buttons: initialButtons,
    };
  });

  const [saving, setSaving] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  // Dynamic variable sample map for realistic preview
  const [sampleVariables, setSampleVariables] = React.useState({
    customer_name: 'John Doe',
    customer_id: 'CUST-84920',
  });

  // Variables search & category filter
  const [varSearch, setVarSearch] = React.useState('');
  const [activeCategory, setActiveCategory] = React.useState('All');
  const [copiedKey, setCopiedKey] = React.useState('');

  // Extract detected variables from body
  const detectedVariables = React.useMemo(() => extractVariables(form.body), [form.body]);

  // Keep sample variables populated with defaults
  React.useEffect(() => {
    setSampleVariables((prev) => {
      const next = { ...prev };
      detectedVariables.forEach((v) => {
        if (!next[v]) {
          const sys = SYSTEM_VARIABLES.find((sv) => sv.key === v);
          next[v] = sys?.sample || `[${v}]`;
        }
      });
      return next;
    });
  }, [detectedVariables]);

  function patch(field, value) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'name' && !isEdit && !prev.templateName) {
        next.templateName = slugTemplateName(value);
      }
      return next;
    });
  }

  // Insert variable into message body at current cursor position
  function insertVariable(variableKey) {
    const textarea = textareaRef.current;
    const token = `{{${variableKey}}}`;

    if (textarea) {
      const start = textarea.selectionStart ?? form.body.length;
      const end = textarea.selectionEnd ?? form.body.length;
      const text = form.body;
      const newBody = text.substring(0, start) + token + text.substring(end);
      patch('body', newBody);

      setTimeout(() => {
        textarea.focus();
        const nextPos = start + token.length;
        textarea.setSelectionRange(nextPos, nextPos);
      }, 0);
    } else {
      patch('body', form.body ? `${form.body} ${token}` : token);
    }

    // Copy indicator feedback
    setCopiedKey(variableKey);
    setTimeout(() => setCopiedKey(''), 1500);
  }

  // Filtered variables for middle column
  const filteredVariables = React.useMemo(() => {
    let list = SYSTEM_VARIABLES;
    if (activeCategory !== 'All') {
      list = list.filter((v) => v.category.toLowerCase() === activeCategory.toLowerCase());
    }
    if (varSearch.trim()) {
      const query = varSearch.trim().toLowerCase();
      list = list.filter(
        (v) =>
          v.key.toLowerCase().includes(query) ||
          v.label.toLowerCase().includes(query) ||
          v.desc.toLowerCase().includes(query) ||
          v.category.toLowerCase().includes(query)
      );
    }
    return list;
  }, [activeCategory, varSearch]);

  const categories = ['All', 'Customer', 'Investor', 'Project', 'Lead', 'Deal', 'Employee', 'Company'];

  // Interpolated body for the WhatsApp phone mockup
  const previewBody = React.useMemo(() => {
    if (!form.body.trim()) return '';
    return form.body.replace(/\{\{([a-zA-Z0-9_| ]+)\}\}/g, (_, match) => {
      const raw = match.trim();
      const parts = raw.split('|').map((s) => s.trim());
      const key = parts[0];
      const fallback = parts[1] || `[${key}]`;
      const val = sampleVariables[key];
      return val && val !== `[${key}]` ? val : fallback;
    });
  }, [form.body, sampleVariables]);

  // Validation
  function validate() {
    if (!form.name.trim()) return 'Template Name is required.';
    if (!form.templateName.trim()) return 'Meta Template Name is required.';
    if (!/^[a-z0-9_]+$/.test(form.templateName.trim())) {
      return 'Meta Template Name must contain only lowercase letters, numbers, and underscores.';
    }
    if (!form.body.trim()) return 'Message Body is required.';
    if (form.headerType === 'TEXT' && !form.headerContent.trim()) {
      return 'Header Text is required when Header Type is Text.';
    }
    return '';
  }

  // Save handler
  async function handleSave(submitToMeta = false) {
    const errorMsg = validate();
    if (errorMsg) {
      toast.error(errorMsg);
      return;
    }

    if (submitToMeta) {
      setSubmitting(true);
    } else {
      setSaving(true);
    }

    try {
      const normalizedTemplateName = form.templateName
        .trim()
        .toLowerCase()
        .replace(/[\s-]+/g, '_')
        .replace(/[^a-z0-9_]/g, '');

      const payload = {
        name: form.name.trim(),
        key: form.key.trim() || null,
        templateName: normalizedTemplateName,
        category: form.category,
        language: form.language,
        headerType: form.headerType,
        headerContent: form.headerType === 'NONE' ? undefined : form.headerContent.trim() || undefined,
        body: form.body.trim(),
        footer: form.footer.trim() || undefined,
        variables: detectedVariables,
        buttons: form.buttons.filter((b) => b.text?.trim()),
        submitToMeta: Boolean(submitToMeta),
        isLocalActive: true,
      };

      if (isEdit) {
        await api.put(`/templates/meta/${template.id}`, payload);
        if (submitToMeta) {
          await api.post(`/templates/meta/${template.id}/submit`, {});
        }
        toast.success(submitToMeta ? 'Template submitted to Meta for approval!' : 'Template saved successfully.');
      } else {
        const res = envelope(await api.post('/templates/meta', payload));
        const status = res?.status || res?.metaStatus || (submitToMeta ? 'PENDING' : 'DRAFT');
        toast.success(
          submitToMeta
            ? `Template submitted to Meta successfully! Status: ${status}`
            : 'Template saved locally as draft.'
        );
      }

      if (onSaved) onSaved();
      else if (onClose) onClose();
      else router.push('/admin/sections/meta-templates');
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || 'Could not save Meta template.';
      toast.error(Array.isArray(message) ? message.join(', ') : message);
    } finally {
      setSaving(false);
      setSubmitting(false);
    }
  }

  function handleClose() {
    if (onClose) {
      onClose();
    } else {
      router.push('/admin/sections/meta-templates');
    }
  }

  if (!isOpen) return null;

  return (
    <div
      className={
        isPageMode
          ? 'w-full min-h-screen bg-slate-100/70 p-2 sm:p-4 md:p-6 flex items-start justify-center'
          : 'fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto'
      }
    >
      <div className="relative w-full max-w-7xl rounded-2xl bg-white shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col max-h-[96vh]">
        {/* ── Top Header ────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#16A34A] text-white shadow-sm shrink-0">
              <FontAwesomeIcon icon={faWhatsapp} className="text-xl" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                {isEdit ? 'Edit WhatsApp Template' : 'Create WhatsApp Template'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 hidden sm:block">
                Configure Meta WhatsApp Cloud API template components, header attachments, buttons, and preview live on mobile mockup.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
            aria-label="Close"
          >
            <FontAwesomeIcon icon={faXmark} className="text-lg" />
          </button>
        </div>

        {/* ── Main 3-Column Body ──────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 p-5 overflow-y-auto grow custom-scrollbar">
          {/* ── Column 1: Template Form (approx 42% / 5 cols) ─────── */}
          <div className="lg:col-span-5 space-y-4">
            {/* Row 1: Template Name & Meta Template Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">
                  Template Name <span className="text-rose-500">*</span>
                </Label>
                <Input
                  value={form.name}
                  onChange={(e) => patch('name', e.target.value)}
                  placeholder="e.g. Investment Confirmed"
                  className="h-9 text-xs sm:text-sm border-slate-200 focus-visible:ring-emerald-500"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">
                  Meta Template Name <span className="text-rose-500">*</span>
                </Label>
                <Input
                  value={form.templateName}
                  onChange={(e) => patch('templateName', slugTemplateName(e.target.value))}
                  placeholder="investment_confirmed_v1"
                  className="h-9 text-xs sm:text-sm font-mono border-slate-200 focus-visible:ring-emerald-500"
                />
              </div>
            </div>

            {/* Row 2: Category, Language, Header Type */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">Category</Label>
                <select
                  value={form.category}
                  onChange={(e) => patch('category', e.target.value)}
                  className="h-9 w-full rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">Language</Label>
                <select
                  value={form.language}
                  onChange={(e) => patch('language', e.target.value)}
                  className="h-9 w-full rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.value} value={l.value}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">Header Type</Label>
                <select
                  value={form.headerType}
                  onChange={(e) => patch('headerType', e.target.value)}
                  className="h-9 w-full rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {HEADER_TYPES.map((h) => (
                    <option key={h.value} value={h.value}>
                      {h.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Header Content Input if HeaderType !== NONE */}
            {form.headerType !== 'NONE' && (
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">
                  {form.headerType === 'TEXT' ? 'Header Text (max 60 chars)' : 'Media / Document Attachment URL'}
                  <span className="text-rose-500"> *</span>
                </Label>
                <Input
                  value={form.headerContent}
                  onChange={(e) => patch('headerContent', e.target.value)}
                  placeholder={
                    form.headerType === 'TEXT'
                      ? 'e.g. Important Investment Update'
                      : 'https://example.com/assets/sample-brochure.pdf'
                  }
                  className="h-9 text-xs border-slate-200 focus-visible:ring-emerald-500"
                />
              </div>
            )}

            {/* Row 3: Message Body */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-slate-700">
                  Message Body <span className="text-rose-500">*</span>
                </Label>
                <span className="text-[11px] text-slate-400">Meta allows text + dynamic parameters</span>
              </div>
              <textarea
                ref={textareaRef}
                value={form.body}
                onChange={(e) => patch('body', e.target.value)}
                placeholder="Hello {{customer_name}}, welcome to our platform..."
                rows={6}
                className="w-full rounded-lg border border-slate-200 bg-white p-3 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed custom-scrollbar"
              />
            </div>

            {/* Row 4: Footer Text */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">Footer Text (Optional)</Label>
              <Input
                value={form.footer}
                onChange={(e) => patch('footer', e.target.value)}
                placeholder="Team QB Unify · Secure Fintech"
                className="h-9 text-xs border-slate-200 focus-visible:ring-emerald-500"
              />
            </div>

            {/* Row 5: Dynamic Example inputs for detected variables */}
            {detectedVariables.length > 0 && (
              <div className="space-y-2 pt-1 border-t border-slate-100">
                {detectedVariables.map((v) => (
                  <div key={v} className="space-y-1">
                    <Label className="text-[11px] font-medium text-slate-600">
                      Example for Body <span className="font-mono text-emerald-700">{`{{${v}}}`}</span> (optional for draft)
                    </Label>
                    <Input
                      value={sampleVariables[v] || ''}
                      onChange={(e) =>
                        setSampleVariables((prev) => ({
                          ...prev,
                          [v]: e.target.value,
                        }))
                      }
                      placeholder={`e.g. ${v === 'customer_name' ? 'John Doe' : v === 'customer_id' ? 'CUST-84920' : v}`}
                      className="h-8 text-xs border-slate-200 focus-visible:ring-emerald-500"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Row 6: Interactive Buttons Configurator */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-slate-700">Interactive Action Buttons</Label>
                {form.buttons.length < 3 && (
                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        buttons: [...prev.buttons, { type: 'URL', text: 'New Button', url: 'https://' }],
                      }))
                    }
                    className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                  >
                    <FontAwesomeIcon icon={faPlus} className="text-[10px]" /> Add Button
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {form.buttons.map((btn, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 rounded-lg border border-slate-200/90 bg-slate-50/60 p-2 text-xs"
                  >
                    <select
                      value={btn.type}
                      onChange={(e) => {
                        const next = [...form.buttons];
                        next[idx] = { ...next[idx], type: e.target.value };
                        setForm((prev) => ({ ...prev, buttons: next }));
                      }}
                      className="h-7 rounded border border-slate-200 bg-white px-1.5 text-[11px] text-slate-700"
                    >
                      <option value="URL">URL</option>
                      <option value="QUICK_REPLY">Quick Reply</option>
                      <option value="PHONE_NUMBER">Phone</option>
                    </select>
                    <Input
                      value={btn.text}
                      onChange={(e) => {
                        const next = [...form.buttons];
                        next[idx] = { ...next[idx], text: e.target.value };
                        setForm((prev) => ({ ...prev, buttons: next }));
                      }}
                      placeholder="Button Label"
                      className="h-7 text-xs grow border-slate-200 bg-white"
                    />
                    {btn.type !== 'QUICK_REPLY' && (
                      <Input
                        value={btn.url || btn.phoneNumber || ''}
                        onChange={(e) => {
                          const next = [...form.buttons];
                          if (btn.type === 'PHONE_NUMBER') {
                            next[idx] = { ...next[idx], phoneNumber: e.target.value };
                          } else {
                            next[idx] = { ...next[idx], url: e.target.value };
                          }
                          setForm((prev) => ({ ...prev, buttons: next }));
                        }}
                        placeholder={btn.type === 'PHONE_NUMBER' ? '+91...' : 'https://...'}
                        className="h-7 text-xs grow border-slate-200 bg-white"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setForm((prev) => ({
                          ...prev,
                          buttons: prev.buttons.filter((_, i) => i !== idx),
                        }));
                      }}
                      className="text-slate-400 hover:text-rose-600 px-1"
                    >
                      <FontAwesomeIcon icon={faTrash} className="text-xs" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Column 2: DYNAMIC VARIABLES (approx 28% / 3 cols) ─── */}
          <div className="lg:col-span-3 rounded-2xl border border-slate-200/90 bg-[#F8FAFC] p-3.5 flex flex-col h-full space-y-3">
            {/* Header */}
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold tracking-wider text-slate-800 uppercase">DYNAMIC VARIABLES</span>
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Real-time values
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500 leading-tight">
                Click to insert <code className="font-mono text-emerald-700">{`{{key}}`}</code> into the template. For an optional value, use <code className="font-mono text-emerald-700">{`{{key | fallback}}`}</code>.
              </p>
            </div>

            {/* Search Input */}
            <div className="relative">
              <FontAwesomeIcon
                icon={faMagnifyingGlass}
                className="absolute left-2.5 top-2.5 text-xs text-slate-400"
              />
              <Input
                value={varSearch}
                onChange={(e) => setVarSearch(e.target.value)}
                placeholder="Search variables (name, key, d...)"
                className="h-8 pl-8 text-xs border-slate-200 bg-white focus-visible:ring-emerald-500"
              />
              {varSearch && (
                <button
                  type="button"
                  onClick={() => setVarSearch('')}
                  className="absolute right-2 top-2 text-xs text-slate-400 hover:text-slate-600"
                >
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-all ${
                    activeCategory === cat
                      ? 'bg-[#16A34A] text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Scrollable Variable Cards */}
            <div className="space-y-2 overflow-y-auto grow max-h-[480px] pr-1 custom-scrollbar">
              {filteredVariables.map((variable) => (
                <div
                  key={variable.key}
                  onClick={() => insertVariable(variable.key)}
                  className="group relative cursor-pointer rounded-xl border border-slate-200/80 bg-white p-2.5 shadow-2xs transition-all hover:border-emerald-400 hover:shadow-xs active:scale-[0.99]"
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-block rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono text-xs font-semibold text-emerald-800">
                      {`{{${variable.key}}}`}
                    </span>
                    <span className="text-slate-400 group-hover:text-emerald-600 transition-colors">
                      {copiedKey === variable.key ? (
                        <FontAwesomeIcon icon={faCheck} className="text-xs text-emerald-600" />
                      ) : (
                        <FontAwesomeIcon icon={faCopy} className="text-xs" />
                      )}
                    </span>
                  </div>
                  <div className="mt-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      {variable.category}
                    </span>
                    <p className="text-xs font-semibold text-slate-800 leading-tight">{variable.label}</p>
                    <p className="mt-0.5 text-[11px] text-slate-500 leading-snug line-clamp-1">{variable.desc}</p>
                  </div>
                </div>
              ))}

              {filteredVariables.length === 0 && (
                <div className="py-8 text-center text-xs text-slate-400">
                  No dynamic variables match &quot;{varSearch}&quot;.
                </div>
              )}
            </div>
          </div>

          {/* ── Column 3: Real-Time Mobile Mockup (approx 30% / 4 cols) */}
          <div className="lg:col-span-4 flex flex-col items-center">
            {/* Column Title */}
            <div className="w-full flex items-center justify-center gap-2 mb-3">
              <FontAwesomeIcon icon={faMobileScreen} className="text-slate-600 text-sm" />
              <span className="text-sm font-semibold text-slate-800">Real-Time Mobile Mockup</span>
            </div>

            {/* Authentic Smartphone Chassis */}
            <div className="relative w-full max-w-[310px] rounded-[40px] border-[10px] border-slate-900 bg-black shadow-2xl overflow-hidden flex flex-col min-h-[540px]">
              {/* Phone Speaker Slit & Front Camera */}
              <div className="w-full bg-black pt-2 pb-1.5 flex items-center justify-center relative shrink-0">
                <div className="h-1.5 w-14 rounded-full bg-slate-800" />
                <div className="absolute right-14 h-2 w-2 rounded-full bg-slate-900 border border-slate-800" />
              </div>

              {/* Phone Inside Screen Area */}
              <div className="w-full grow flex flex-col bg-[#ECE5DD] overflow-hidden">
                {/* WhatsApp Top Green Header Bar */}
                <div className="bg-[#075E54] text-white px-3 py-2.5 flex items-center gap-2.5 shadow-sm shrink-0">
                  <span className="text-xs text-white/90">←</span>
                  <div className="h-7 w-7 rounded-full bg-emerald-700 border border-emerald-500 flex items-center justify-center font-bold text-xs text-white shrink-0">
                    QB
                  </div>
                  <div className="min-w-0 grow">
                    <div className="flex items-center gap-1 leading-tight">
                      <span className="font-semibold text-xs text-white truncate">QB Unify Official</span>
                      <FontAwesomeIcon icon={faCircleCheck} className="text-emerald-300 text-[10px] shrink-0" />
                    </div>
                    <span className="text-[9px] text-emerald-100/80 leading-tight block truncate">
                      Official Business Account
                    </span>
                  </div>
                </div>

                {/* WhatsApp Chat Background Body */}
                <div className="grow p-3 flex flex-col justify-between overflow-y-auto custom-scrollbar">
                  <div>
                    {/* Centered Date Badge */}
                    <div className="text-center my-1.5">
                      <span className="inline-block rounded-md bg-white/80 px-2 py-0.5 text-[10px] font-semibold text-slate-600 shadow-2xs backdrop-blur-xs">
                        TODAY
                      </span>
                    </div>

                    {/* WhatsApp Message Bubble */}
                    <div className="relative rounded-2xl rounded-tl-xs bg-white p-3 text-xs text-slate-800 shadow-sm border border-slate-100 max-w-[95%] space-y-1.5">
                      {/* Optional Header Rendering */}
                      {form.headerType !== 'NONE' && (
                        <div className="mb-1">
                          {form.headerType === 'TEXT' && (
                            <p className="font-bold text-slate-900 leading-snug">
                              {form.headerContent || 'Sample Header Title'}
                            </p>
                          )}
                          {form.headerType === 'IMAGE' && (
                            <div className="flex h-28 w-full items-center justify-center rounded-lg bg-slate-100 text-slate-400 text-[11px] overflow-hidden border border-slate-200">
                              {form.headerContent?.startsWith('http') ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={form.headerContent}
                                  alt="Header media"
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <span>📷 [Image Attachment]</span>
                              )}
                            </div>
                          )}
                          {form.headerType === 'DOCUMENT' && (
                            <div className="flex items-center gap-2 rounded-lg bg-slate-100 p-2 text-[11px] text-slate-600 border border-slate-200">
                              <span>📄 [PDF Document]</span>
                            </div>
                          )}
                          {form.headerType === 'VIDEO' && (
                            <div className="flex h-24 w-full items-center justify-center rounded-lg bg-slate-100 p-2 text-[11px] text-slate-500 border border-slate-200">
                              <span>🎬 [Video Preview]</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Message Body Content */}
                      <p className="whitespace-pre-wrap leading-relaxed text-slate-800 text-[12px]">
                        {previewBody || (
                          <span className="text-slate-400 italic">
                            Save the template to preview resolved variables.
                          </span>
                        )}
                      </p>

                      {/* Footer Text */}
                      {form.footer && (
                        <p className="text-[10px] text-slate-400 pt-1 border-t border-slate-100 leading-tight">
                          {form.footer}
                        </p>
                      )}

                      {/* Timestamp & Double Check */}
                      <div className="flex items-center justify-end gap-1 text-[9px] text-slate-400 pt-0.5">
                        <span>11:42 AM</span>
                        <span className="text-[#53BDEB] font-bold">✓✓</span>
                      </div>
                    </div>

                    {/* WhatsApp Action Buttons (Cards beneath message bubble) */}
                    {form.buttons.length > 0 && (
                      <div className="mt-1.5 space-y-1 max-w-[95%]">
                        {form.buttons.map((btn, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-center gap-1.5 rounded-lg bg-white py-2 px-3 text-center text-xs font-semibold text-[#00A884] shadow-xs border border-slate-100/90 hover:bg-slate-50 transition-colors"
                          >
                            {btn.type === 'URL' && (
                              <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="text-[10px]" />
                            )}
                            {btn.type === 'PHONE_NUMBER' && <FontAwesomeIcon icon={faPhone} className="text-[10px]" />}
                            <span>{btn.text || 'Action Button'}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Fake Home Indicator Bar */}
                <div className="bg-black py-1 flex justify-center shrink-0">
                  <div className="h-1 w-24 rounded-full bg-slate-700" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Bottom Modal Footer ───────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3.5 border-t border-slate-100 bg-white shrink-0">
          {/* Status Label on Left */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Meta Status:</span>
            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700">
              {template?.status || 'DRAFT'}
            </span>
          </div>

          {/* Action Buttons on Right */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              disabled={saving || submitting}
              className="text-xs font-medium text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={saving || submitting}
              onClick={() => handleSave(true)}
              className="border-emerald-300 bg-emerald-50/70 text-emerald-800 hover:bg-emerald-100 text-xs font-semibold gap-1.5"
            >
              <FontAwesomeIcon icon={faCheck} className="text-emerald-600 text-xs" />
              {submitting ? 'Submitting…' : 'Submit to Meta for Approval'}
            </Button>
            <Button
              type="button"
              disabled={saving || submitting}
              onClick={() => handleSave(false)}
              className="bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-semibold shadow-sm px-4"
            >
              {saving ? 'Saving…' : 'Save Template'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
