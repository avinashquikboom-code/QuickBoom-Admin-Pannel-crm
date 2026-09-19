'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Mail,
  X,
  Send,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Settings,
  Eye,
  Edit3,
  FileText,
  ChevronDown,
  Search,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import api from '@/lib/api';

export interface EmailTemplateItem {
  id: number;
  name: string;
  key: string;
  subject: string;
  body: string;
  category?: string;
  description?: string;
  supportedVariables?: string[];
  isActive: boolean;
  isSystem?: boolean;
}

export interface SendEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientEmail: string;
  recipientName?: string;
  recordType?: string;
  recordId?: string | number;
  defaultSubject?: string;
  defaultBody?: string;
  recipientContext?: Record<string, any>;
  onSuccess?: (info: any) => void;
}

export function SendEmailModal({
  isOpen,
  onClose,
  recipientEmail,
  recipientName,
  recordType,
  recordId,
  defaultSubject = '',
  defaultBody = '',
  recipientContext,
  onSuccess,
}: SendEmailModalProps) {
  const [to, setTo] = useState(recipientEmail);
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [subject, setSubject] = useState(defaultSubject);
  const [body, setBody] = useState(defaultBody);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [templates, setTemplates] = useState<EmailTemplateItem[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [templateSearch, setTemplateSearch] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const [isSending, setIsSending] = useState(false);
  const [smtpStatus, setSmtpStatus] = useState<{
    isConfigured: boolean;
    isEnabled: boolean;
    fromEmail: string | null;
    fromName: string | null;
  } | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);

  // Compile context variables for interpolation
  const contextVariables = useMemo(() => {
    return {
      customerName: recipientName || 'Valued Customer',
      userName: recipientName || 'Valued Customer',
      recipientName: recipientName || 'Valued Contact',
      email: to || recipientEmail || '',
      companyName: 'QuickBoom',
      supportPhone: '+91 8000 123 456',
      contactEmail: 'support@quickboom.com',
      ...(recipientContext || {}),
    };
  }, [recipientName, to, recipientEmail, recipientContext]);

  // Interpolation helper
  const interpolate = (str: string, vars: Record<string, any>): string => {
    if (!str || typeof str !== 'string') return '';
    return str.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (match, varName) => {
      if (varName in vars && vars[varName] !== undefined && vars[varName] !== null) {
        return String(vars[varName]);
      }
      return match;
    });
  };

  useEffect(() => {
    if (isOpen) {
      setTo(recipientEmail);
      setCc('');
      setBcc('');
      setShowCcBcc(false);
      setSubject(defaultSubject);
      setBody(defaultBody);
      setSelectedTemplateId(null);
      setViewMode('edit');
      setIsDropdownOpen(false);
      setTemplateSearch('');

      // Fetch active templates
      async function fetchActiveTemplates() {
        try {
          setIsLoadingTemplates(true);
          const res: any = await api.get('/email/templates', {
            params: { isActive: 'true' },
          });
          const list = res?.data || res;
          if (Array.isArray(list)) {
            // Only active templates are selectable
            setTemplates(list.filter((t) => t.isActive));
          }
        } catch (err) {
          console.warn('[EMAIL_TEMPLATES_LOAD_WARN]', err);
        } finally {
          setIsLoadingTemplates(false);
        }
      }

      // Check SMTP status
      async function fetchStatus() {
        try {
          setIsLoadingStatus(true);
          const res: any = await api.get('/email/status');
          const data = res?.data || res;
          setSmtpStatus(data);
        } catch (err) {
          console.warn('[EMAIL_STATUS_WARN]', err);
        } finally {
          setIsLoadingStatus(false);
        }
      }

      fetchActiveTemplates();
      fetchStatus();
    }
  }, [isOpen, recipientEmail, defaultSubject, defaultBody]);

  if (!isOpen) return null;

  const handleSelectTemplate = (tpl: EmailTemplateItem) => {
    if (!tpl.isActive) {
      toast.error('The selected template is inactive and cannot be used.');
      return;
    }

    setSelectedTemplateId(tpl.id);
    setIsDropdownOpen(false);

    // Resolve variables into subject and body
    const resolvedSubject = interpolate(tpl.subject, contextVariables);
    const resolvedBody = interpolate(tpl.body, contextVariables);

    setSubject(resolvedSubject);
    setBody(resolvedBody);
  };

  const filteredTemplates = templates.filter((t) => {
    const q = templateSearch.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      (t.category && t.category.toLowerCase().includes(q)) ||
      t.subject.toLowerCase().includes(q)
    );
  });

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Requirement 7: If no template is selected, do not send the email
    if (!selectedTemplateId) {
      toast.error('Please select an email template.');
      return;
    }

    // Requirement 8: If the selected template is inactive/deleted, do not send
    if (selectedTemplate && !selectedTemplate.isActive) {
      toast.error('The selected template is inactive and cannot be sent.');
      return;
    }

    if (!to.trim()) {
      toast.error('Recipient email is required');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to.trim())) {
      toast.error('Please enter a valid recipient email address');
      return;
    }
    if (cc.trim() && !emailRegex.test(cc.trim())) {
      toast.error('Please enter a valid CC email address');
      return;
    }
    if (bcc.trim() && !emailRegex.test(bcc.trim())) {
      toast.error('Please enter a valid BCC email address');
      return;
    }
    if (!subject.trim()) {
      toast.error('Email subject is required');
      return;
    }
    if (!body.trim()) {
      toast.error('Email body cannot be empty');
      return;
    }

    setIsSending(true);
    try {
      const payload: any = {
        to: to.trim(),
        subject: subject.trim(),
        body: body.trim(),
        templateId: selectedTemplateId,
      };
      if (cc.trim()) payload.cc = cc.trim();
      if (bcc.trim()) payload.bcc = bcc.trim();
      if (recordType) payload.recordType = recordType;
      if (recordId !== undefined && recordId !== null) payload.recordId = recordId;

      const res: any = await api.post('/email/send', payload);
      const data = res?.data || res;

      if (data?.success) {
        toast.success(data?.message || `Email sent successfully to ${to}`);
        if (onSuccess) onSuccess(data);
        onClose();
      } else {
        toast.error(data?.message || 'Failed to send email');
      }
    } catch (err: any) {
      const errMsg =
        err?.response?.data?.message ||
        err?.message ||
        'Could not send email. Please check SMTP settings.';
      toast.error(errMsg);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-4 z-10 animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shrink-0 shadow-2xs">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Send Email via Corporate SMTP</h3>
              {recipientName ? (
                <p className="text-xs text-slate-500 font-medium">
                  Recipient: <span className="font-bold text-slate-800">{recipientName}</span>
                </p>
              ) : (
                <p className="text-xs text-slate-500 font-medium">
                  Select template, preview resolved placeholders, and send email
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SMTP Status Alert */}
        {smtpStatus && !smtpStatus.isConfigured && !isLoadingStatus && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-2.5 text-xs text-amber-800 shrink-0">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold">SMTP is not configured</p>
              <p className="text-[11px] text-amber-700 mt-0.5">
                Configure your SMTP server settings in Admin Settings before dispatching emails.
              </p>
              <Link
                href="/settings"
                className="inline-flex items-center gap-1 text-[11px] font-extrabold text-amber-900 underline mt-1 hover:text-amber-950"
              >
                <Settings className="w-3 h-3" /> Go to SMTP Email Integration
              </Link>
            </div>
          </div>
        )}

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
          {/* Template Selection Dropdown */}
          <div className="relative">
            <label className="block font-extrabold text-slate-700 mb-1">
              Select Email Template <span className="text-rose-500">*</span>
            </label>

            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full flex items-center justify-between px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 hover:bg-slate-100/70 transition-colors text-left"
            >
              {selectedTemplate ? (
                <div className="flex items-center gap-2 truncate">
                  <span className="font-bold text-slate-900">{selectedTemplate.name}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 uppercase">
                    {selectedTemplate.category || 'GENERAL'}
                  </span>
                  <span className="text-slate-400 text-xs truncate">— {selectedTemplate.subject}</span>
                </div>
              ) : (
                <span className="text-slate-400 font-normal">Choose an active email template...</span>
              )}
              <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
            </button>

            {isDropdownOpen && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl z-30 p-2 space-y-2 animate-in fade-in zoom-in-95 duration-100 max-h-64 overflow-y-auto">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={templateSearch}
                    onChange={(e) => setTemplateSearch(e.target.value)}
                    placeholder="Search templates by name, category, or subject..."
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    autoFocus
                  />
                </div>

                {isLoadingTemplates ? (
                  <div className="py-4 text-center text-slate-400 flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Loading active templates...
                  </div>
                ) : filteredTemplates.length === 0 ? (
                  <div className="py-4 text-center text-slate-400 text-xs">
                    No active templates found matching search
                  </div>
                ) : (
                  filteredTemplates.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => handleSelectTemplate(t)}
                      className={`p-2.5 rounded-xl cursor-pointer transition-colors border ${
                        selectedTemplateId === t.id
                          ? 'bg-blue-50 border-blue-200 text-blue-900'
                          : 'hover:bg-slate-50 border-transparent text-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-xs">{t.name}</span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-600 uppercase">
                          {t.category || 'GENERAL'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">Subject: {t.subject}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Recipients Section */}
          <div className="space-y-2 bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-extrabold text-slate-700">
                  Recipient Email (To) <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowCcBcc(!showCcBcc)}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-800 transition-colors"
                >
                  {showCcBcc ? 'Hide CC / BCC' : '+ Add CC / BCC'}
                </button>
              </div>
              <input
                type="email"
                required
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="client@example.com"
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-blue-400 focus:outline-none text-xs"
              />
            </div>

            {showCcBcc && (
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 animate-in fade-in duration-100">
                <div>
                  <label className="block font-bold text-slate-600 text-[11px] mb-1">CC</label>
                  <input
                    type="email"
                    value={cc}
                    onChange={(e) => setCc(e.target.value)}
                    placeholder="manager@example.com"
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-400 focus:outline-none text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 text-[11px] mb-1">BCC</label>
                  <input
                    type="email"
                    value={bcc}
                    onChange={(e) => setBcc(e.target.value)}
                    placeholder="archive@example.com"
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-400 focus:outline-none text-xs"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Subject Field */}
          <div>
            <label className="block font-extrabold text-slate-700 mb-1">
              Subject <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g., Welcome to QuickBoom"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-blue-400 focus:outline-none text-xs"
            />
          </div>

          {/* View Mode Toggle: Edit vs Preview */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-1">
            <label className="font-extrabold text-slate-700">
              Message Body {viewMode === 'preview' && <span className="text-blue-600 font-bold">(Rendered Live Preview)</span>}
            </label>
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[11px]">
              <button
                type="button"
                onClick={() => setViewMode('edit')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-bold transition-all ${
                  viewMode === 'edit' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Edit3 className="w-3 h-3" /> Edit
              </button>
              <button
                type="button"
                onClick={() => setViewMode('preview')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-bold transition-all ${
                  viewMode === 'preview' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Eye className="w-3 h-3" /> Preview
              </button>
            </div>
          </div>

          {viewMode === 'edit' ? (
            <div>
              <textarea
                required
                rows={7}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Select a template above to automatically populate content, or edit here..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:ring-2 focus:ring-blue-400 focus:outline-none text-xs resize-none"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                You can directly edit the template HTML or text before dispatching.
              </p>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/70 max-h-60 overflow-y-auto">
              {body.includes('<') && body.includes('>') ? (
                <div
                  className="prose prose-sm max-w-none text-xs"
                  dangerouslySetInnerHTML={{ __html: body }}
                />
              ) : (
                <pre className="whitespace-pre-wrap font-sans text-xs text-slate-800">{body}</pre>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-2.5 pt-3 border-t border-slate-100 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode(viewMode === 'edit' ? 'preview' : 'edit')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs transition-colors"
            >
              {viewMode === 'edit' ? (
                <>
                  <Eye className="w-3.5 h-3.5 text-slate-500" /> Preview
                </>
              ) : (
                <>
                  <Edit3 className="w-3.5 h-3.5 text-slate-500" /> Back to Edit
                </>
              )}
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSending}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSending || Boolean(smtpStatus && !smtpStatus.isConfigured)}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" /> Send Email
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

