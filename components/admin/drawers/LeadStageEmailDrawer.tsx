'use client';

import React, { useMemo } from 'react';
import {
  Mail,
  ArrowRight,
  Send,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Info,
  Loader2,
  FileQuestion,
  User,
  Building,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { AdminFormDrawer } from '../dialogs/AdminFormDrawer';

export interface EmailTemplateItem {
  id: number;
  name: string;
  templateName?: string;
  key: string;
  identifierKey?: string;
  subject: string;
  body: string;
  description?: string | null;
  category?: string;
  supportedVariables: string[];
  isActive: boolean;
  isSystem?: boolean;
}

export interface LeadStageEmailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  lead: {
    id: number | string;
    firstName?: string | null;
    lastName?: string | null;
    title?: string | null;
    name?: string | null;
    email?: string | null;
    companyName?: string | null;
    stageId?: number | string | null;
    status?: string | null;
    stage?: any | null;
    customer?: any | null;
    nextFollowUpDate?: string | null;
    nextFollowUpTime?: string | null;
  } | null;
  previousStageName: string;
  newStage: {
    id: number | string;
    name: string;
    key?: string;
    color?: string;
    bgColor?: string;
    borderColor?: string;
  } | null;
  onConfirm: (options: {
    sendEmail: boolean;
    templateId?: number;
    customSubject?: string;
    customBody?: string;
  }) => Promise<void> | void;
  isSubmitting?: boolean;
}

// Map stage keys to predefined system template keys
const STAGE_KEY_TO_TEMPLATE_KEY: Record<string, string> = {
  NEW: 'QUIKBOOM_NEW_LEAD',
  CONTACTED: 'QUIKBOOM_CONTACTED',
  DETAILS_SENT: 'QUIKBOOM_DETAILS_SENT',
  FOLLOW_UP: 'QUIKBOOM_FOLLOW_UP',
  VISIT_SCHEDULED: 'QUIKBOOM_VISIT_SCHEDULED',
  VISIT: 'QUIKBOOM_VISIT_SCHEDULED',
  VISIT_DONE: 'QUIKBOOM_VISIT_DONE',
  PROPOSAL_SENT: 'QUIKBOOM_PROPOSAL_SENT',
  PROPOSAL: 'QUIKBOOM_PROPOSAL_SENT',
  NEGOTIATION: 'QUIKBOOM_NEGOTIATION',
  FINAL_CALL: 'QUIKBOOM_FINAL_CALL',
  WON: 'QUIKBOOM_WON',
  CONVERTED: 'QUIKBOOM_WON',
  LOST: 'QUIKBOOM_LOST',
  CANCELLED: 'QUIKBOOM_LOST',
  QUALIFIED: 'QUIKBOOM_QUALIFIED',
};

export function LeadStageEmailDrawer({
  isOpen,
  onClose,
  lead,
  previousStageName,
  newStage,
  onConfirm,
  isSubmitting = false,
}: LeadStageEmailDrawerProps) {
  const { user } = useAuthStore();

  // 1. Fetch available email templates from existing CRM API
  const {
    data: templates = [],
    isLoading: isLoadingTemplates,
    isError: isTemplatesError,
  } = useQuery<EmailTemplateItem[]>({
    queryKey: ['crm-email-templates', 'ALL'],
    enabled: isOpen && !!newStage,
    queryFn: async () => {
      const res: any = await api.get('/email/templates');
      return Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
    },
  });

  // 2. Resolve matching template for the newly selected stage
  const matchedTemplate = useMemo(() => {
    if (!newStage || !templates.length) return null;

    const normKey = (newStage.key || '').trim().toUpperCase().replace(/[\s-]+/g, '_');
    const normName = (newStage.name || '').trim().toUpperCase().replace(/[\s-]+/g, '_');

    // Priority 1: Match by mapped system key
    const mappedSystemKey = STAGE_KEY_TO_TEMPLATE_KEY[normKey] || STAGE_KEY_TO_TEMPLATE_KEY[normName];
    if (mappedSystemKey) {
      const found = templates.find(
        (t) =>
          (t.identifierKey?.toUpperCase() === mappedSystemKey ||
            t.key?.toUpperCase() === mappedSystemKey) &&
          t.isActive !== false
      );
      if (found) return found;
    }

    // Priority 2: Direct key match (e.g. QUALIFIED, LEAD_QUALIFIED)
    const directKeyMatch = templates.find((t) => {
      const tKey = (t.identifierKey || t.key || '').toUpperCase();
      return (
        (tKey === normKey ||
          tKey === normName ||
          tKey === `QUIKBOOM_${normKey}` ||
          tKey === `QUIKBOOM_${normName}`) &&
        t.isActive !== false
      );
    });
    if (directKeyMatch) return directKeyMatch;

    // Priority 3: Name match (case-insensitive substring or exact match)
    const nameMatch = templates.find((t) => {
      const tName = (t.templateName || t.name || '').toLowerCase();
      const sName = (newStage.name || '').toLowerCase();
      return (tName === sName || tName.includes(sName)) && t.isActive !== false;
    });

    return nameMatch || null;
  }, [newStage, templates]);

  // 3. Prepare Lead Context Variables for interpolation
  const leadFullName = useMemo(() => {
    if (!lead) return 'Valued Client';
    const combined = `${lead.firstName || ''} ${lead.lastName || ''}`.trim();
    return combined || lead.name || lead.title || lead.companyName || 'Valued Client';
  }, [lead]);

  const recipientEmail = (lead?.email || '').trim();
  const hasValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail);

  // 4. Interpolate variables in Subject and Body
  const { renderedSubject, renderedBodyHtml, renderedVariables } = useMemo(() => {
    if (!matchedTemplate || !lead || !newStage) {
      return { renderedSubject: '', renderedBodyHtml: '', renderedVariables: [] };
    }

    const currentUserName =
      `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'QuickBoom Team';
    const currentUserEmail = user?.email || 'sales@quikboom.com';
    const companyName =
      lead.customer?.companyName || lead.customer?.name || 'QUIKBOOM Digital Marketing Agency';

    // Values for variables supported by existing CRM template system
    const variableMap: Record<string, string> = {
      leadTitle: leadFullName,
      leadName: leadFullName,
      leadEmail: recipientEmail || 'No email specified',
      email: currentUserEmail,
      userName: currentUserName,
      stage: newStage.name,
      newStage: newStage.name,
      previousStage: previousStageName || 'New',
      companyName,
      startDate: lead.nextFollowUpDate
        ? new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }).format(
            new Date(lead.nextFollowUpDate)
          )
        : 'To be scheduled',
      startTime: lead.nextFollowUpTime || '',
    };

    const interpolate = (text: string) => {
      if (!text) return '';
      return text.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (match, key) => {
        return variableMap[key] !== undefined ? variableMap[key] : match;
      });
    };

    const subject = interpolate(matchedTemplate.subject || 'Your Lead Status Has Been Updated');
    const interpolatedBody = interpolate(matchedTemplate.body || '');

    // Format body for preview (convert newlines or keep HTML)
    let bodyHtml = interpolatedBody;
    if (!bodyHtml.includes('<html') && !bodyHtml.includes('<body') && !bodyHtml.includes('<div')) {
      const lines = bodyHtml.split('\n');
      bodyHtml = lines
        .map((line) => {
          const trimmed = line.trim();
          if (!trimmed) return '<br />';
          if (trimmed === 'Visit QUIKBOOM Website') {
            return '<div style="margin: 14px 0; text-align: center;"><a href="https://quikboom.com" target="_blank" style="display: inline-block; padding: 10px 22px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 13px;">Visit QUIKBOOM Website &rarr;</a></div>';
          }
          return `<p style="margin: 0 0 10px; font-size: 13.5px; line-height: 1.6; color: #334155;">${trimmed}</p>`;
        })
        .join('\n');
    }

    // Replace CID images with logo for browser rendering
    bodyHtml = bodyHtml.replace(/cid:quikboom-logo/g, '/logo.png');

    const injectedVars = Object.entries(variableMap)
      .filter(([key]) => matchedTemplate.body.includes(`{{${key}}}`) || matchedTemplate.subject.includes(`{{${key}}}`))
      .map(([key, val]) => ({ key: `{{${key}}}`, value: val }));

    return {
      renderedSubject: subject,
      renderedBodyHtml: bodyHtml,
      renderedVariables: injectedVars,
    };
  }, [matchedTemplate, lead, newStage, leadFullName, recipientEmail, previousStageName, user]);

  if (!isOpen || !lead || !newStage) return null;

  return (
    <AdminFormDrawer
      isOpen={isOpen}
      onClose={onClose}
      title="Stage Change Email Notification"
      description="Review the email template and recipient before confirming this stage transition."
      icon={Mail}
      maxWidth="sm:max-w-[620px]"
      isSubmitting={isSubmitting}
      footer={
        <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => onConfirm({ sendEmail: false })}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs transition-all cursor-pointer disabled:opacity-50"
            >
              Update Without Email
            </button>

            {matchedTemplate && hasValidEmail && (
              <button
                type="button"
                onClick={() =>
                  onConfirm({
                    sendEmail: true,
                    templateId: matchedTemplate.id,
                    customSubject: renderedSubject,
                  })
                }
                disabled={isSubmitting}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#23C45E] hover:bg-[#1AA14D] text-white font-black rounded-xl text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Sending & Updating...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Email & Update Stage</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-5 text-slate-800">
        {/* 1. Lead Context Banner */}
        <div className="bg-slate-50/80 rounded-2xl border border-slate-200 p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Lead</span>
                <span className="text-sm font-black text-slate-900">{leadFullName}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                {hasValidEmail ? (
                  <span className="font-semibold text-slate-800">{recipientEmail}</span>
                ) : (
                  <span className="font-semibold text-amber-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    No valid email address recorded
                  </span>
                )}
              </div>
            </div>

            {lead.companyName && (
              <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 bg-white rounded-lg border border-slate-200 text-[11px] font-bold text-slate-600">
                <Building className="w-3 h-3 text-slate-400" />
                <span className="truncate max-w-[140px]">{lead.companyName}</span>
              </div>
            )}
          </div>

          {/* Stage Transition Step Indicator */}
          <div className="pt-2 border-t border-slate-200/80 flex items-center gap-2 text-xs font-bold">
            <span className="text-slate-400 font-medium">Transition:</span>
            <span className="px-2.5 py-0.5 bg-white border border-slate-300 rounded-lg text-slate-700 font-bold">
              {previousStageName || 'Current Stage'}
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span
              className="px-2.5 py-0.5 rounded-lg font-black border"
              style={{
                backgroundColor: newStage.bgColor || '#ECFDF5',
                borderColor: newStage.borderColor || '#A7F3D0',
                color: newStage.color || '#15803D',
              }}
            >
              {newStage.name}
            </span>
          </div>
        </div>

        {/* 2. Loading State */}
        {isLoadingTemplates && (
          <div className="py-16 flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-3 border-[#23C45E] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-bold text-slate-400">Locating matching email template for {newStage.name}...</p>
          </div>
        )}

        {/* 3. Error State */}
        {!isLoadingTemplates && isTemplatesError && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs space-y-1">
            <p className="font-bold text-rose-800 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              Unable to load email templates from server
            </p>
            <p className="text-rose-600">
              You can still proceed with updating the stage without sending an email.
            </p>
          </div>
        )}

        {/* 4. Missing Lead Email Notice */}
        {!isLoadingTemplates && !hasValidEmail && (
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs space-y-1">
            <p className="font-bold text-amber-900 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              No email recipient available
            </p>
            <p className="text-amber-700">
              This lead does not have an email address stored. You can update the stage, but no email can be sent.
            </p>
          </div>
        )}

        {/* 5. Empty State: No Template Configured for this Stage */}
        {!isLoadingTemplates && !isTemplatesError && !matchedTemplate && (
          <div className="py-12 px-6 bg-slate-50 border border-dashed border-slate-300 rounded-3xl text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto border border-slate-200">
              <FileQuestion className="w-6 h-6 text-slate-400" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-black text-slate-900">
                No email template is configured for this stage.
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No automatic email will be dispatched for stage{' '}
                <strong className="text-slate-800 font-bold">"{newStage.name}"</strong>. Click below to update the
                stage directly.
              </p>
            </div>
          </div>
        )}

        {/* 6. Template Found & Rendered Email Preview */}
        {!isLoadingTemplates && !isTemplatesError && matchedTemplate && (
          <div className="space-y-4">
            {/* Template Header Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 bg-emerald-50 text-[#1AA14D] border border-emerald-200 rounded-md text-[10px] font-black uppercase tracking-wider">
                    Selected Template
                  </span>
                  <span className="text-xs font-black text-slate-900 truncate">
                    {matchedTemplate.templateName || matchedTemplate.name}
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold text-slate-400 shrink-0">
                  {matchedTemplate.identifierKey || matchedTemplate.key}
                </span>
              </div>

              {/* Envelope Recipient & Subject Header */}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-16 font-bold text-slate-400 shrink-0">To:</span>
                  <span className="font-bold text-slate-900 truncate">{recipientEmail || '—'}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-16 font-bold text-slate-400 shrink-0 mt-0.5">Subject:</span>
                  <span className="font-black text-slate-900">{renderedSubject}</span>
                </div>
              </div>
            </div>

            {/* Email Body Card */}
            <div className="border border-slate-200 rounded-2xl p-5 bg-white shadow-xs space-y-4">
              {/* Agency Branding Header */}
              <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-slate-900 tracking-tight">QUIKBOOM</h4>
                  <p className="text-[10px] text-slate-400 font-medium">Digital Marketing Agency</p>
                </div>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold">
                  Lead Notification
                </span>
              </div>

              {/* Rendered HTML Email Content */}
              <div
                className="text-xs text-slate-700 leading-relaxed font-sans overflow-x-auto"
                dangerouslySetInnerHTML={{ __html: renderedBodyHtml }}
              />

              {/* Email Footer Banner */}
              <div className="pt-4 border-t border-slate-100 text-center text-[10px] text-slate-400">
                Sent via <strong>QUIKBOOM Digital Marketing Agency</strong> • CRM
              </div>
            </div>

            {/* Injected Variables Inspector */}
            {renderedVariables.length > 0 && (
              <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-200 text-xs space-y-2">
                <p className="text-[11px] font-black text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  Injected Lead Variables
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
                  {renderedVariables.map((v) => (
                    <div key={v.key} className="bg-white p-2 rounded-xl border border-slate-200 truncate">
                      <span className="text-emerald-700 font-bold">{v.key}</span>
                      <span className="text-slate-400 mx-1.5">&rarr;</span>
                      <span className="text-slate-900 font-semibold">{v.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminFormDrawer>
  );
}
