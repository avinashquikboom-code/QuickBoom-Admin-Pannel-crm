'use client';

import React, { useState, useEffect } from 'react';
import { Mail, X, Send, Loader2, AlertCircle, CheckCircle2, Settings } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import api from '@/lib/api';

export interface SendEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientEmail: string;
  recipientName?: string;
  recordType?: string;
  recordId?: string | number;
  defaultSubject?: string;
  defaultBody?: string;
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
  onSuccess,
}: SendEmailModalProps) {
  const [to, setTo] = useState(recipientEmail);
  const [subject, setSubject] = useState(defaultSubject);
  const [body, setBody] = useState(defaultBody);
  const [isSending, setIsSending] = useState(false);
  const [smtpStatus, setSmtpStatus] = useState<{
    isConfigured: boolean;
    isEnabled: boolean;
    fromEmail: string | null;
    fromName: string | null;
  } | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTo(recipientEmail);
      setSubject(defaultSubject);
      setBody(defaultBody);

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
      fetchStatus();
    }
  }, [isOpen, recipientEmail, defaultSubject, defaultBody]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!to.trim()) {
      toast.error('Recipient email is required');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to.trim())) {
      toast.error('Please enter a valid recipient email address');
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
      };
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

      <div className="relative bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-5 z-10 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shrink-0 shadow-2xs">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Send Email via SMTP</h3>
              {recipientName ? (
                <p className="text-xs text-slate-500 font-medium">
                  To: <span className="font-bold text-slate-800">{recipientName}</span>
                </p>
              ) : (
                <p className="text-xs text-slate-500 font-medium">
                  Dispatch email via configured corporate mail server
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

        {/* SMTP Status Banner */}
        {smtpStatus && !smtpStatus.isConfigured && !isLoadingStatus && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-2.5 text-xs text-amber-800">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold">SMTP is not configured</p>
              <p className="text-[11px] text-amber-700 mt-0.5">
                Configure your SMTP server settings in Admin Settings before sending emails.
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

        {smtpStatus?.isConfigured && smtpStatus?.fromEmail && (
          <div className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs text-slate-600">
            <div className="flex items-center gap-1.5 truncate">
              <span className="text-[11px] text-slate-400 font-bold uppercase">From:</span>
              <span className="font-bold text-slate-800 truncate">
                {smtpStatus.fromName ? `${smtpStatus.fromName} <${smtpStatus.fromEmail}>` : smtpStatus.fromEmail}
              </span>
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 shrink-0">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Active
            </span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-extrabold text-slate-700 mb-1">
              Recipient Email <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              required
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="client@example.com"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-blue-400 focus:border-transparent focus:outline-none text-xs"
            />
          </div>

          <div>
            <label className="block font-extrabold text-slate-700 mb-1">
              Subject <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g., Quotation Follow-up / Welcome to QuickBoom"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-blue-400 focus:border-transparent focus:outline-none text-xs"
            />
          </div>

          <div>
            <label className="block font-extrabold text-slate-700 mb-1">
              Message Body <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={6}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Type your email message here..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-blue-400 focus:border-transparent focus:outline-none text-xs resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSending}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSending || Boolean(smtpStatus && !smtpStatus.isConfigured)}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Sending via SMTP...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" /> Send Email
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
