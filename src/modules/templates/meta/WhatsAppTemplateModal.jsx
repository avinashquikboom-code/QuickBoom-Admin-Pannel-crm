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
import { confirmedTemplateOf, templateRecordOf } from './template-response.mjs';

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
        return raw.split('|')[0].trim();
      })
    )
  ).filter(Boolean);
}

function getBlankForm() {
  return {
    name: '',
    templateName: '',
    key: '',
    category: 'UTILITY',
    language: 'en_US',
    headerType: 'NONE',
    headerContent: '',
    body: '',
    footer: '',
    buttons: [],
  };
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

  // Initialize form cleanly: 100% blank for Create Mode, populated for Edit Mode
  const [form, setForm] = React.useState(() => {
    if (isEdit && template) {
      return {
        name: template.name || '',
        templateName: template.templateName || '',
        key: template.key || '',
        category: template.category || 'UTILITY',
        language: template.language || 'en_US',
        headerType: template.headerType || 'NONE',
        headerContent: template.headerContent || '',
        body: template.body || '',
        footer: template.footer || '',
        buttons: Array.isArray(template.buttons) ? template.buttons : [],
      };
    }
    if (duplicate && template) {
      return {
        name: template.name ? `${template.name} copy` : '',
        templateName: '',
        key: '',
        category: template.category || 'UTILITY',
        language: template.language || 'en_US',
        headerType: template.headerType || 'NONE',
        headerContent: template.headerContent || '',
        body: template.body || '',
        footer: template.footer || '',
        buttons: Array.isArray(template.buttons) ? [...template.buttons] : [],
      };
    }
    return getBlankForm();
  });

  const [saving, setSaving] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [mediaMode, setMediaMode] = React.useState('upload');
  const [mediaUploading, setMediaUploading] = React.useState(false);
  const [mediaProgress, setMediaProgress] = React.useState(0);
  const [mediaError, setMediaError] = React.useState('');
  const [mediaFile, setMediaFile] = React.useState(null);
  const [mediaPreview, setMediaPreview] = React.useState('');
  const [previewError, setPreviewError] = React.useState('');
  const mediaRequest = React.useRef(0);
  const mediaInput = React.useRef(null);

  async function uploadImage(file) {
    if (!file) return;
    const request = ++mediaRequest.current;
    setMediaFile(file); setMediaError(''); setMediaProgress(0);
    patch('headerContent', '');
    if (!['image/jpeg', 'image/png'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setMediaError('Choose a JPG or PNG image no larger than 5 MB.'); return;
    }
    setMediaUploading(true);
    try {
      const data = new FormData(); data.append('file', file);
      const response = await api.post('/templates/meta/media/image', data, { headers: { 'Content-Type': 'multipart/form-data' }, onUploadProgress: (event) => { if (request === mediaRequest.current && event.total) setMediaProgress(Math.round(event.loaded * 100 / event.total)); } });
      if (request !== mediaRequest.current) return;
      const result = response?.data?.url ? response.data : response;
      if (!result?.reference?.startsWith('s3key:') || !/^https:\/\//i.test(result.previewUrl || '')) throw new Error('Storage did not return a valid image reference.');
      setMediaPreview(result.previewUrl);
      patch('headerContent', result.reference);
    } catch (error) {
      if (request === mediaRequest.current) setMediaError(error?.response?.data?.message || error?.message || 'Upload failed. Please retry.');
    } finally { if (request === mediaRequest.current) setMediaUploading(false); }
  }


  React.useEffect(() => {
    let active = true;
    setPreviewError('');
    const reference = form.headerType === 'IMAGE' ? String(form.headerContent || '').trim() : '';
    if (!isOpen || !reference) { setMediaPreview(''); return () => { active = false; }; }
    if (!reference.startsWith('s3key:') && !reference.includes('/meta-templates/')) { setMediaPreview(reference); return () => { active = false; }; }
    const refreshPreview = async () => {
      try {
        const payload = await api.post('/templates/meta/media/preview', { reference });
        const body = payload?.data?.url ? payload.data : payload;
        if (!body?.url) throw new Error('Image preview is unavailable.');
        if (active) { setMediaPreview(body.url); setPreviewError(''); }
      } catch (error) { if (active) { setMediaPreview(''); setPreviewError(error?.response?.data?.message || 'Image preview could not be loaded.'); } }
    };
    refreshPreview();
    const timer = window.setInterval(refreshPreview, 45 * 60 * 1000);
    return () => { active = false; window.clearInterval(timer); };
  }, [form.headerContent, form.headerType, isOpen]);

  // Dynamic variable sample map for realistic preview - starts empty in Create Mode
  const [sampleVariables, setSampleVariables] = React.useState(() => template?.sampleValues || {});

  // Variables search & category filter
  const [varSearch, setVarSearch] = React.useState('');
  const [activeCategory, setActiveCategory] = React.useState('All');
  const [copiedKey, setCopiedKey] = React.useState('');

  // Lock background scroll when drawer is open
  React.useEffect(() => {
    if (isOpen && !isPageMode) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen, isPageMode]);

  // Sync form state whenever modal opens or target template changes
  React.useEffect(() => {
    if (isOpen) {
      mediaRequest.current += 1; setMediaUploading(false); setMediaError(''); setMediaFile(null); setMediaMode(template?.headerContent && !String(template.headerContent).startsWith('s3key:') && !String(template.headerContent).includes('/meta-templates/') ? 'url' : 'upload');
      if (isEdit && template) {
        setSampleVariables(template.sampleValues || {});
        setForm({
          name: template.name || '',
          templateName: template.templateName || '',
          key: template.key || '',
          category: template.category || 'UTILITY',
          language: template.language || 'en_US',
          headerType: template.headerType || 'NONE',
          headerContent: template.headerContent || '',
          body: template.body || '',
          footer: template.footer || '',
          buttons: Array.isArray(template.buttons) ? template.buttons : [],
        });
      } else if (duplicate && template) {
        setForm({
          name: template.name ? `${template.name} copy` : '',
          templateName: '',
          key: '',
          category: template.category || 'UTILITY',
          language: template.language || 'en_US',
          headerType: template.headerType || 'NONE',
          headerContent: template.headerContent || '',
          body: template.body || '',
          footer: template.footer || '',
          buttons: Array.isArray(template.buttons) ? [...template.buttons] : [],
        });
      } else {
        // Completely blank state for new Create session
        setForm(getBlankForm());
        setSampleVariables({});
      }
    }
  }, [isOpen, template?.id, isEdit, duplicate]);

  // Extract detected variables from body
  const detectedVariables = React.useMemo(() => Array.from(new Set([...extractVariables(form.body), ...(form.headerType === 'TEXT' ? extractVariables(form.headerContent) : [])])), [form.body, form.headerType, form.headerContent]);

  // Keep sample variables synchronized ONLY with currently detected variables
  React.useEffect(() => {
    setSampleVariables((prev) => {
      const next = {};
      detectedVariables.forEach((v) => {
        if (prev[v]) {
          next[v] = prev[v];
        } else {
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

  // Insert variable into message body at current cursor position (never duplicated)
  function insertVariable(variableKey) {
    const textarea = textareaRef.current;
    const token = `{{${variableKey}}}`;

    if (textarea) {
      const start = textarea.selectionStart ?? (form.body || '').length;
      const end = textarea.selectionEnd ?? (form.body || '').length;
      const currentText = form.body || '';

      const newBody = currentText.substring(0, start) + token + currentText.substring(end);
      patch('body', newBody);

      setTimeout(() => {
        textarea.focus();
        const nextPos = start + token.length;
        textarea.setSelectionRange(nextPos, nextPos);
      }, 15);
    } else {
      patch('body', form.body ? `${form.body} ${token}` : token);
    }

    toast.success(`Inserted {{${variableKey}}}`);
  }

  // Copy variable to clipboard only (does not insert into body)
  function handleCopyVariable(variableKey, e) {
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    navigator.clipboard.writeText(`{{${variableKey}}}`);
    setCopiedKey(variableKey);
    toast.success(`Copied {{${variableKey}}} to clipboard`);
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
    if (mediaUploading) return 'Wait for the image upload to finish.';
    if (form.headerType === 'IMAGE' && mediaError && mediaMode === 'upload') return 'Fix the image upload or retry before saving.';
    if (form.headerType === 'IMAGE' && !/^(https:\/\/|s3key:meta-templates\/)/i.test(form.headerContent.trim())) return 'Upload an image or enter an HTTPS image URL.';
    if (!form.name.trim()) return 'Template Name is required.';
    if (!form.templateName.trim()) return 'Meta Template Name is required.';
    if (!/^[a-z0-9_]+$/.test(form.templateName.trim())) {
      return 'Meta Template Name must contain only lowercase letters, numbers, and underscores.';
    }
    if (!form.body.trim()) return 'Message Body is required.';
    if (form.headerType === 'TEXT' && !form.headerContent.trim()) {
      return 'Header Text is required when Header Type is Text.';
    }
    if (form.headerType === 'TEXT' && (/[\p{Extended_Pictographic}\p{Emoji_Presentation}\p{Cc}\p{Cf}\uFE0F*~`]/u.test(form.headerContent) || /_[^_]+_/.test(form.headerContent.replace(/\{\{[^{}]+\}\}/g, '')))) {
      return 'Use one line of plain text without emojis, asterisks or formatting characters in the header.';
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

    if (submitToMeta && detectedVariables.some((v) => !sampleVariables[v]?.trim() || sampleVariables[v].trim() === `[${v}]`)) {
      toast.error('Provide a sample value for every variable before submitting to Meta.');
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
        sampleValues: sampleVariables,
        ...(!isEdit ? { submitToMeta: Boolean(submitToMeta) } : {}),
        isLocalActive: true,
      };

      if (isEdit) {
        await api.put(`/templates/meta/${template.id}`, payload);
        if (submitToMeta) {
          const result = confirmedTemplateOf(await api.post(`/templates/meta/${template.id}/submit`, {}));
          toast.success(`Meta template ${result.metaTemplateId}: ${result.status || 'UNKNOWN'}`);
        } else {
          toast.success('Template saved locally.');
        }
      } else {
        const response = await api.post('/templates/meta', payload);
        const res = submitToMeta ? confirmedTemplateOf(response) : templateRecordOf(response);
        const status = res?.status || res?.metaStatus || 'UNKNOWN';
        toast.success(
          submitToMeta
            ? `Meta template ${res.metaTemplateId}: ${status}`
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
          : 'fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs transition-opacity duration-300 overflow-hidden'
      }
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving && !submitting && !isPageMode) {
          handleClose();
        }
      }}
    >
      {/* ── Slide-Over Drawer Container (Anchored to Right Edge) ──── */}
      <div
        className={
          isPageMode
            ? 'relative w-full max-w-7xl rounded-2xl bg-white shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col'
            : 'relative flex h-full w-full sm:w-[94vw] md:w-[90vw] lg:w-[84vw] xl:w-[80vw] max-w-7xl flex-col bg-white shadow-2xl border-l border-slate-200/90 overflow-hidden animate-in slide-in-from-right duration-300'
        }
      >
        {/* ── 1. Sticky Header ───────────────────────────────────── */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#16A34A] text-white shadow-sm shrink-0">
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
            aria-label="Close drawer"
          >
            <FontAwesomeIcon icon={faXmark} className="text-lg" />
          </button>
        </div>

        {/* ── 2. Scrollable 3-Column Content Body ────────────────── */}
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar min-h-0 bg-slate-50/30">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* ── Column 1: Template Form (5 cols) ───────────────── */}
            <div className="lg:col-span-5 space-y-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
              {/* Row 1: Template Name & Meta Template Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">
                    Template Name <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    value={form.name}
                    onChange={(e) => patch('name', e.target.value)}
                    placeholder="e.g. Order Confirmation"
                    className="h-9 text-xs sm:text-sm border-slate-200 focus-visible:ring-emerald-500 rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">
                    Meta Template Name <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    value={form.templateName}
                    onChange={(e) => patch('templateName', slugTemplateName(e.target.value))}
                    placeholder="e.g. order_confirmation_v1"
                    className="h-9 text-xs sm:text-sm font-mono border-slate-200 focus-visible:ring-emerald-500 rounded-xl"
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
                    className="h-9 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                    className="h-9 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                    onChange={(e) => { mediaRequest.current += 1; setMediaUploading(false); setMediaError(''); setMediaFile(null); setMediaMode('upload'); setForm((prev) => ({ ...prev, headerType: e.target.value, headerContent: '' })); }}
                    className="h-9 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
              {form.headerType !== 'NONE' && form.headerType !== 'IMAGE' && (
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
                        ? 'e.g. Important Account Notification'
                        : form.headerType === 'IMAGE' ? 'https://example.com/image.jpg' : form.headerType === 'VIDEO' ? 'https://example.com/video.mp4' : 'https://example.com/document.pdf'
                    }
                    className="h-9 text-xs border-slate-200 focus-visible:ring-emerald-500 rounded-xl"
                  />
                </div>
              )}

              {form.headerType === 'IMAGE' && <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-700">Image attachment <span className="text-rose-500">*</span></Label>
                <div className="flex gap-2">{[['upload', 'Upload File'], ['url', 'Paste Media URL']].map(([mode, label]) => <button key={mode} type="button" onClick={() => { mediaRequest.current += 1; setMediaUploading(false); setMediaError(''); setMediaFile(null); setMediaMode(mode); patch('headerContent', ''); }} className={`rounded-lg border px-3 py-2 text-xs font-semibold ${mediaMode === mode ? 'border-emerald-500 bg-emerald-50 text-emerald-800' : 'border-slate-200 text-slate-600'}`}>{label}</button>)}</div>
                {mediaMode === 'upload' ? <div onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); uploadImage(e.dataTransfer.files?.[0]); }} className="rounded-xl border border-dashed border-emerald-300 bg-emerald-50/40 p-4 text-center text-xs text-slate-600">
                  <input ref={mediaInput} type="file" accept="image/jpeg,image/png" className="sr-only" onChange={(e) => { uploadImage(e.target.files?.[0]); e.target.value = ''; }} />
                  <p>Drag an image here, or <button type="button" className="font-semibold text-emerald-700 underline" onClick={() => mediaInput.current?.click()}>Browse Files</button></p><p className="mt-1">JPG or PNG · maximum 5 MB</p>
                  {mediaFile && <p className="mt-2">{mediaFile.name} · {(mediaFile.size / 1024 / 1024).toFixed(2)} MB</p>}
                  {mediaUploading && <div className="mt-2"><progress max="100" value={mediaProgress} className="w-full" /><p>Uploading {mediaProgress}%</p></div>}
                  {mediaError && <p role="alert" className="mt-2 text-rose-700">{String(mediaError)} {mediaFile && <button type="button" className="underline" onClick={() => uploadImage(mediaFile)}>Retry</button>}</p>}
                  {form.headerContent && !mediaUploading && <button type="button" className="mt-2 text-rose-700 underline" onClick={() => { setMediaFile(null); patch('headerContent', ''); }}>Remove image</button>}
                </div> : <Input value={form.headerContent} onChange={(e) => patch('headerContent', e.target.value)} placeholder="https://example.com/image.jpg" className="h-9 text-xs" />}
                {mediaPreview && <img src={mediaPreview} alt="Header image preview" onError={() => setPreviewError('Image preview could not be loaded. Check storage access or try uploading again.')} className="max-h-40 max-w-full rounded-lg object-contain" />}{previewError && <p role="alert" className="text-xs text-rose-700">{String(previewError)}</p>}
              </div>}

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
                  placeholder="Enter message text or click dynamic variables on the right to insert..."
                  rows={6}
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed custom-scrollbar"
                />
              </div>

              {/* Row 4: Footer Text */}
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">Footer Text (Optional)</Label>
                <Input
                  value={form.footer}
                  onChange={(e) => patch('footer', e.target.value)}
                  placeholder="e.g. Reply STOP to unsubscribe"
                  className="h-9 text-xs border-slate-200 focus-visible:ring-emerald-500 rounded-xl"
                />
              </div>

              {/* Row 5: Dynamic Example inputs for detected variables ONLY */}
              {detectedVariables.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Sample Variable Values (for preview & Meta review)
                  </span>
                  {detectedVariables.map((v) => (
                    <div key={v} className="space-y-1">
                      <Label className="text-[11px] font-medium text-slate-600">
                        Example for <span className="font-mono text-emerald-700 font-bold">{`{{${v}}}`}</span>
                      </Label>
                      <Input
                        value={sampleVariables[v] || ''}
                        onChange={(e) =>
                          setSampleVariables((prev) => ({
                            ...prev,
                            [v]: e.target.value,
                          }))
                        }
                        placeholder={`e.g. Sample ${v}`}
                        className="h-8 text-xs border-slate-200 focus-visible:ring-emerald-500 rounded-lg"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Row 6: Interactive Buttons Configurator */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-xs font-semibold text-slate-700">Action Buttons (Optional)</Label>
                    <p className="text-[10px] text-slate-400">Add up to 3 interactive CTA or quick reply buttons</p>
                  </div>
                  {form.buttons.length < 3 && (
                    <button
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          buttons: [...prev.buttons, { type: 'URL', text: 'Visit Website', url: 'https://' }],
                        }))
                      }
                      className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200"
                    >
                      <FontAwesomeIcon icon={faPlus} className="text-[10px]" /> Add Button
                    </button>
                  )}
                </div>

                {form.buttons.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic py-1">No action buttons added.</p>
                ) : (
                  <div className="space-y-2">
                    {form.buttons.map((btn, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 rounded-xl border border-slate-200/90 bg-slate-50/60 p-2 text-xs"
                      >
                        <select
                          value={btn.type}
                          onChange={(e) => {
                            const next = [...form.buttons];
                            next[idx] = { ...next[idx], type: e.target.value };
                            setForm((prev) => ({ ...prev, buttons: next }));
                          }}
                          className="h-7 rounded-lg border border-slate-200 bg-white px-1.5 text-[11px] text-slate-700 font-medium"
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
                          className="h-7 text-xs grow border-slate-200 bg-white rounded-lg"
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
                            className="h-7 text-xs grow border-slate-200 bg-white rounded-lg"
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
                          className="text-slate-400 hover:text-rose-600 px-1.5"
                          title="Remove button"
                        >
                          <FontAwesomeIcon icon={faTrash} className="text-xs" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── Column 2: Dynamic Variables (3 cols) ───────────── */}
            <div className="lg:col-span-3 rounded-2xl border border-slate-200/90 bg-white p-4 flex flex-col h-full space-y-3 shadow-2xs">
              {/* Header */}
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold tracking-wider text-slate-800 uppercase">DYNAMIC VARIABLES</span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Click to Insert
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-slate-500 leading-tight">
                  Click <strong className="text-emerald-700">Insert</strong> to add at cursor position, or <strong className="text-slate-700">Copy</strong> to clipboard.
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
                  className="h-8 pl-8 text-xs border-slate-200 bg-slate-50/50 focus-visible:ring-emerald-500 rounded-xl"
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

              {/* Category Pills */}
              <div className="flex flex-wrap gap-1 border-b border-slate-100 pb-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    className={`rounded-lg px-2 py-0.5 text-[10px] font-semibold transition-all ${
                      activeCategory === cat
                        ? 'bg-[#16A34A] text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Scrollable Variable Cards */}
              <div className="space-y-2 overflow-y-auto grow max-h-[520px] pr-1 custom-scrollbar">
                {filteredVariables.map((variable) => (
                  <div
                    key={variable.key}
                    className="group relative rounded-xl border border-slate-200/80 bg-slate-50/50 p-2.5 shadow-2xs transition-all hover:border-emerald-300 hover:bg-white"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="inline-block rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono text-[11px] font-bold text-emerald-800 truncate">
                        {`{{${variable.key}}}`}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => insertVariable(variable.key)}
                          className="inline-flex items-center gap-1 rounded-md bg-[#16A34A] text-white hover:bg-[#15803D] font-semibold px-2 py-0.5 text-[10px] shadow-2xs transition-colors"
                          title="Insert into message body"
                        >
                          <FontAwesomeIcon icon={faPlus} className="text-[9px]" />
                          <span>Insert</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleCopyVariable(variable.key, e)}
                          className="inline-flex items-center gap-1 rounded-md bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold px-1.5 py-0.5 text-[10px] transition-colors"
                          title="Copy to clipboard"
                        >
                          {copiedKey === variable.key ? (
                            <FontAwesomeIcon icon={faCheck} className="text-emerald-600 text-[10px]" />
                          ) : (
                            <FontAwesomeIcon icon={faCopy} className="text-slate-400 text-[10px]" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="mt-1 flex items-baseline justify-between text-[11px]">
                      <span className="font-semibold text-slate-800">{variable.label}</span>
                      <span className="text-[10px] uppercase font-bold text-slate-400">{variable.category}</span>
                    </div>
                    <p className="mt-0.5 text-[10px] text-slate-500 leading-normal line-clamp-2">
                      {variable.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Column 3: Real-Time Mobile Mockup (4 cols) ─────── */}
            <div className="lg:col-span-4 flex flex-col items-center justify-start rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs">
              <div className="w-full flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faMobileScreen} className="text-[#16A34A]" />
                  Real-Time Mobile Mockup
                </span>
                <span className="rounded-md bg-emerald-50 text-[#16A34A] border border-emerald-200 px-2 py-0.5 text-[10px] font-bold">
                  WhatsApp Preview
                </span>
              </div>

              {/* Mobile Phone Mockup Frame */}
              <div className="mt-4 w-full max-w-[320px] rounded-[36px] bg-black p-3.5 shadow-2xl ring-1 ring-slate-800/80">
                {/* Phone Speaker & Notch */}
                <div className="flex items-center justify-center pb-2">
                  <div className="h-1.5 w-16 rounded-full bg-slate-800" />
                </div>

                {/* WhatsApp App Inner Frame */}
                <div className="flex flex-col h-[520px] rounded-[26px] bg-[#EFEAE2] overflow-hidden shadow-inner text-slate-800">
                  {/* WhatsApp Top App Bar */}
                  <div className="flex items-center gap-2 bg-[#075E54] px-3 py-2.5 text-white shrink-0">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-700 font-bold text-xs">
                      QB
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold leading-none truncate">QB Unify Official</span>
                        <FontAwesomeIcon icon={faCircleCheck} className="text-[10px] text-emerald-400" />
                      </div>
                      <span className="text-[9px] text-emerald-200 leading-none">Official Business Account</span>
                    </div>
                  </div>

                  {/* WhatsApp Chat Conversation Canvas */}
                  <div className="flex-1 p-3 overflow-y-auto custom-scrollbar flex flex-col justify-start">
                    {/* Date Pill */}
                    <div className="flex justify-center mb-2">
                      <span className="rounded-md bg-white/80 px-2.5 py-0.5 text-[10px] font-bold text-slate-500 shadow-2xs">
                        TODAY
                      </span>
                    </div>

                    {/* WhatsApp Incoming Message Bubble */}
                    <div className="relative max-w-[95%] rounded-2xl rounded-tl-xs bg-white p-3 shadow-xs space-y-1.5">
                      {/* Optional Header Attachment */}
                      {form.headerType !== 'NONE' && (
                        <div className="pb-1">
                          {form.headerType === 'TEXT' && (
                            <h4 className="font-bold text-slate-900 text-xs leading-snug">
                              {form.headerContent || '[Header Text]'}
                            </h4>
                          )}
                          {form.headerType === 'IMAGE' && (
                            <div className="h-28 w-full rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200 text-slate-400 text-xs">
                              {mediaPreview ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={mediaPreview}
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

                {/* Home Indicator Bar */}
                <div className="bg-black py-1 flex justify-center shrink-0">
                  <div className="h-1 w-24 rounded-full bg-slate-700" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── 3. Sticky Drawer Footer ────────────────────────────── */}
        <div className="sticky bottom-0 z-20 flex flex-wrap items-center justify-between gap-3 px-6 py-3.5 border-t border-slate-100 bg-white shrink-0 shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
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
              disabled={saving || submitting || mediaUploading}
              className="text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={saving || submitting || mediaUploading}
              onClick={() => handleSave(true)}
              className="border-emerald-300 bg-emerald-50/70 text-emerald-800 hover:bg-emerald-100 text-xs font-semibold gap-1.5 rounded-xl"
            >
              <FontAwesomeIcon icon={faCheck} className="text-emerald-600 text-xs" />
              {submitting ? 'Submitting…' : 'Submit to Meta for Approval'}
            </Button>
            <Button
              type="button"
              disabled={saving || submitting || mediaUploading}
              onClick={() => handleSave(false)}
              className="bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-semibold shadow-sm px-4 rounded-xl"
            >
              {saving ? 'Saving…' : 'Save Template'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WhatsAppTemplateModal;
