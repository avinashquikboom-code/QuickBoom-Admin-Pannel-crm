'use client';

import React, { useState, useMemo } from 'react';
import {
  Mail,
  ArrowRight,
  Send,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Loader2,
  FileQuestion,
  Building,
  Phone,
  Check,
  Clock,
  ExternalLink,
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

export interface WhatsAppStageTemplate {
  key: string;
  templateName: string;
  title: string;
  body: string;
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
    phone?: string | null;
    mobile?: string | null;
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
    sendWhatsapp?: boolean;
    templateId?: number;
    customSubject?: string;
    customBody?: string;
    whatsappMessage?: string;
    whatsappTemplateName?: string;
  }) => Promise<void> | void;
  isSubmitting?: boolean;
}

// Map stage keys to predefined system email template keys
const STAGE_KEY_TO_EMAIL_TEMPLATE_KEY: Record<string, string> = {
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

// Standard WhatsApp templates for lead stages
export const WHATSAPP_STAGE_TEMPLATES: Record<string, WhatsAppStageTemplate> = {
  NEW: {
    key: 'NEW',
    templateName: 'lead_stage_new',
    title: 'New Lead Welcome WhatsApp',
    body: 'Hi {{leadName}}, thank you for contacting {{companyName}}! We have received your inquiry regarding {{leadTitle}} and our team has been assigned to assist you.',
  },
  CONTACTED: {
    key: 'CONTACTED',
    templateName: 'lead_stage_contacted',
    title: 'Contacted Stage WhatsApp',
    body: 'Hi {{leadName}}, this is {{userName}} from {{companyName}}. It was great speaking with you regarding {{leadTitle}}. Please feel free to reply if you have any questions.',
  },
  QUALIFIED: {
    key: 'QUALIFIED',
    templateName: 'lead_stage_qualified',
    title: 'Qualified Stage WhatsApp',
    body: 'Hi {{leadName}}, we are pleased to inform you that your requirements for {{leadTitle}} have been qualified! Our team at {{companyName}} is now preparing the ideal solution for you.',
  },
  PROPOSAL: {
    key: 'PROPOSAL',
    templateName: 'lead_stage_proposal',
    title: 'Proposal Stage WhatsApp',
    body: 'Hi {{leadName}}, the customized proposal for {{leadTitle}} from {{companyName}} is ready. Please review it and let us know when we can discuss next steps.',
  },
  PROPOSAL_SENT: {
    key: 'PROPOSAL_SENT',
    templateName: 'lead_stage_proposal',
    title: 'Proposal Sent Stage WhatsApp',
    body: 'Hi {{leadName}}, the customized proposal for {{leadTitle}} from {{companyName}} is ready. Please review it and let us know when we can discuss next steps.',
  },
  NEGOTIATION: {
    key: 'NEGOTIATION',
    templateName: 'lead_stage_negotiation',
    title: 'Negotiation Stage WhatsApp',
    body: 'Hi {{leadName}}, following our discussion regarding {{leadTitle}}, we are finalizing the tailored scope and terms. Let us know if you need any adjustments.',
  },
  FINAL_CALL: {
    key: 'FINAL_CALL',
    templateName: 'lead_stage_final_call',
    title: 'Final Call Stage WhatsApp',
    body: 'Hi {{leadName}}, we are preparing the final confirmation for {{leadTitle}} from {{companyName}}. Looking forward to finalizing our collaboration!',
  },
  WON: {
    key: 'WON',
    templateName: 'lead_stage_won',
    title: 'Won / Deal Closed WhatsApp',
    body: 'Congratulations {{leadName}}! 🎉 We are delighted to confirm our partnership for {{leadTitle}}. Welcome to {{companyName}}!',
  },
  CONVERTED: {
    key: 'CONVERTED',
    templateName: 'lead_stage_won',
    title: 'Converted Stage WhatsApp',
    body: 'Congratulations {{leadName}}! 🎉 We are delighted to confirm our partnership for {{leadTitle}}. Welcome to {{companyName}}!',
  },
  LOST: {
    key: 'LOST',
    templateName: 'lead_stage_lost',
    title: 'Lost Stage WhatsApp',
    body: 'Hi {{leadName}}, thank you for considering {{companyName}} for {{leadTitle}}. While we could not move forward right now, we hope to collaborate in the future!',
  },
  CANCELLED: {
    key: 'CANCELLED',
    templateName: 'lead_stage_lost',
    title: 'Cancelled Stage WhatsApp',
    body: 'Hi {{leadName}}, thank you for considering {{companyName}} for {{leadTitle}}. While we could not move forward right now, we hope to collaborate in the future!',
  },
  DETAILS_SENT: {
    key: 'DETAILS_SENT',
    templateName: 'lead_stage_details_sent',
    title: 'Details Sent Stage WhatsApp',
    body: 'Hi {{leadName}}, we have sent the complete details and brochure for {{leadTitle}} to your email. Please review them at your convenience.',
  },
  FOLLOW_UP: {
    key: 'FOLLOW_UP',
    templateName: 'lead_stage_follow_up',
    title: 'Follow Up Stage WhatsApp',
    body: 'Hi {{leadName}}, following up on our recent discussion regarding {{leadTitle}}. Please let us know when you would be available for a quick catch-up.',
  },
  VISIT_SCHEDULED: {
    key: 'VISIT_SCHEDULED',
    templateName: 'lead_stage_visit_scheduled',
    title: 'Visit Scheduled Stage WhatsApp',
    body: 'Hi {{leadName}}, your appointment with {{companyName}} regarding {{leadTitle}} has been scheduled. We look forward to meeting with you!',
  },
  VISIT: {
    key: 'VISIT',
    templateName: 'lead_stage_visit_scheduled',
    title: 'Visit Stage WhatsApp',
    body: 'Hi {{leadName}}, your appointment with {{companyName}} regarding {{leadTitle}} has been scheduled. We look forward to meeting with you!',
  },
  VISIT_DONE: {
    key: 'VISIT_DONE',
    templateName: 'lead_stage_visit_done',
    title: 'Visit Done Stage WhatsApp',
    body: 'Hi {{leadName}}, thank you for meeting with {{companyName}} regarding {{leadTitle}}. We are compiling the action items discussed and will follow up shortly.',
  },
};

export function WhatsAppIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
    </svg>
  );
}

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
  const [activeTab, setActiveTab] = useState<'EMAIL' | 'WHATSAPP'>('EMAIL');

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

  // 2. Resolve matching email template for newly selected stage
  const matchedEmailTemplate = useMemo(() => {
    if (!newStage || !templates.length) return null;

    const normKey = (newStage.key || '').trim().toUpperCase().replace(/[\s-]+/g, '_');
    const normName = (newStage.name || '').trim().toUpperCase().replace(/[\s-]+/g, '_');

    // Priority 1: Match by mapped system key
    const mappedSystemKey = STAGE_KEY_TO_EMAIL_TEMPLATE_KEY[normKey] || STAGE_KEY_TO_EMAIL_TEMPLATE_KEY[normName];
    if (mappedSystemKey) {
      const found = templates.find(
        (t) =>
          (t.identifierKey?.toUpperCase() === mappedSystemKey ||
            t.key?.toUpperCase() === mappedSystemKey) &&
          t.isActive !== false
      );
      if (found) return found;
    }

    // Priority 2: Direct key match
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

    // Priority 3: Name match
    const nameMatch = templates.find((t) => {
      const tName = (t.templateName || t.name || '').toLowerCase();
      const sName = (newStage.name || '').toLowerCase();
      return (tName === sName || tName.includes(sName)) && t.isActive !== false;
    });

    return nameMatch || null;
  }, [newStage, templates]);

  // 3. Resolve matching WhatsApp template for newly selected stage
  const matchedWhatsAppTemplate = useMemo(() => {
    if (!newStage) return null;
    const normKey = (newStage.key || '').trim().toUpperCase().replace(/[\s-]+/g, '_');
    const normName = (newStage.name || '').trim().toUpperCase().replace(/[\s-]+/g, '_');
    return WHATSAPP_STAGE_TEMPLATES[normKey] || WHATSAPP_STAGE_TEMPLATES[normName] || null;
  }, [newStage]);

  // 4. Lead context variables
  const leadFullName = useMemo(() => {
    if (!lead) return 'Valued Client';
    const combined = `${lead.firstName || ''} ${lead.lastName || ''}`.trim();
    return combined || lead.name || lead.title || lead.companyName || 'Valued Client';
  }, [lead]);

  const recipientEmail = (lead?.email || '').trim();
  const hasValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail);

  const rawPhone = (lead?.phone || lead?.mobile || '').trim();
  const cleanPhoneDigits = rawPhone.replace(/\D/g, '');
  const hasValidPhone = cleanPhoneDigits.length >= 10;
  const formattedPhone = cleanPhoneDigits.length === 10
    ? `+91 ${cleanPhoneDigits.slice(0, 5)} ${cleanPhoneDigits.slice(5)}`
    : rawPhone;

  // 5. Interpolate variables for Email & WhatsApp
  const { renderedSubject, renderedBodyHtml, renderedWhatsAppText, renderedVariables } = useMemo(() => {
    if (!lead || !newStage) {
      return { renderedSubject: '', renderedBodyHtml: '', renderedWhatsAppText: '', renderedVariables: [] };
    }

    const currentUserName =
      `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'QuickBoom Team';
    const currentUserEmail = user?.email || 'sales@quikboom.com';
    const companyName =
      lead.customer?.companyName || lead.customer?.name || 'QUIKBOOM Digital Marketing Agency';

    const variableMap: Record<string, string> = {
      leadTitle: leadFullName,
      leadName: leadFullName,
      leadEmail: recipientEmail || 'No email specified',
      leadPhone: formattedPhone || 'No phone specified',
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

    // Email rendering
    let subject = '';
    let bodyHtml = '';
    if (matchedEmailTemplate) {
      subject = interpolate(matchedEmailTemplate.subject || 'Your Lead Status Has Been Updated');
      const interpolatedBody = interpolate(matchedEmailTemplate.body || '');

      bodyHtml = interpolatedBody;
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
      bodyHtml = bodyHtml.replace(/cid:quikboom-logo/g, '/logo.png');
    }

    // WhatsApp rendering
    let whatsAppText = '';
    if (matchedWhatsAppTemplate) {
      whatsAppText = interpolate(matchedWhatsAppTemplate.body);
    }

    const injectedVars = Object.entries(variableMap)
      .filter(([key]) =>
        (matchedEmailTemplate?.body.includes(`{{${key}}}`) || matchedEmailTemplate?.subject.includes(`{{${key}}}`)) ||
        matchedWhatsAppTemplate?.body.includes(`{{${key}}}`)
      )
      .map(([key, val]) => ({ key: `{{${key}}}`, value: val }));

    return {
      renderedSubject: subject,
      renderedBodyHtml: bodyHtml,
      renderedWhatsAppText: whatsAppText,
      renderedVariables: injectedVars,
    };
  }, [matchedEmailTemplate, matchedWhatsAppTemplate, lead, newStage, leadFullName, recipientEmail, formattedPhone, previousStageName, user]);

  if (!isOpen || !lead || !newStage) return null;

  return (
    <AdminFormDrawer
      isOpen={isOpen}
      onClose={onClose}
      title="Lead Stage Communication"
      description="Select and review communication channels for this stage transition."
      icon={Mail}
      maxWidth="sm:max-w-[640px]"
      isSubmitting={isSubmitting}
      footer={
        <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all cursor-pointer disabled:opacity-50"
          >
            Close
          </button>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => onConfirm({ sendEmail: false, sendWhatsapp: false })}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-3.5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs transition-all cursor-pointer disabled:opacity-50"
            >
              Skip Communication
            </button>

            {/* Tab specific Send button */}
            {activeTab === 'EMAIL' && matchedEmailTemplate && hasValidEmail && (
              <button
                type="button"
                onClick={() =>
                  onConfirm({
                    sendEmail: true,
                    sendWhatsapp: false,
                    templateId: matchedEmailTemplate.id,
                    customSubject: renderedSubject,
                    customBody: renderedBodyHtml,
                  })
                }
                disabled={isSubmitting}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Sending Email...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Email</span>
                  </>
                )}
              </button>
            )}

            {activeTab === 'WHATSAPP' && matchedWhatsAppTemplate && hasValidPhone && (
              <button
                type="button"
                onClick={() =>
                  onConfirm({
                    sendEmail: false,
                    sendWhatsapp: true,
                    whatsappMessage: renderedWhatsAppText,
                    whatsappTemplateName: matchedWhatsAppTemplate.templateName,
                  })
                }
                disabled={isSubmitting}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#25D366] hover:bg-[#1EBE5D] text-slate-950 font-black rounded-xl text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Sending WhatsApp...</span>
                  </>
                ) : (
                  <>
                    <WhatsAppIcon className="w-3.5 h-3.5" />
                    <span>Send WhatsApp</span>
                  </>
                )}
              </button>
            )}

            {/* Combined Send Both button if both channels available */}
            {hasValidEmail && hasValidPhone && matchedEmailTemplate && matchedWhatsAppTemplate && (
              <button
                type="button"
                onClick={() =>
                  onConfirm({
                    sendEmail: true,
                    sendWhatsapp: true,
                    templateId: matchedEmailTemplate.id,
                    customSubject: renderedSubject,
                    customBody: renderedBodyHtml,
                    whatsappMessage: renderedWhatsAppText,
                    whatsappTemplateName: matchedWhatsAppTemplate.templateName,
                  })
                }
                disabled={isSubmitting}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white font-black rounded-xl text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Dispatching Both...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Send Email & WhatsApp</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-5 text-slate-800">
        {/* 1. Lead Context Card */}
        <div className="bg-slate-50/90 rounded-2xl border border-slate-200 p-4 space-y-3 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Lead</span>
                <span className="text-sm font-black text-slate-900">{leadFullName}</span>
                {lead.companyName && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white rounded-md border border-slate-200 text-[10px] font-bold text-slate-600">
                    <Building className="w-3 h-3 text-slate-400" />
                    <span className="truncate max-w-[120px]">{lead.companyName}</span>
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                {/* Email Address */}
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  {hasValidEmail ? (
                    <span className="font-semibold text-slate-800 truncate">{recipientEmail}</span>
                  ) : (
                    <span className="font-semibold text-amber-600 flex items-center gap-1 text-[11px]">
                      <AlertCircle className="w-3 h-3" />
                      No email registered
                    </span>
                  )}
                </div>

                {/* Phone Number */}
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  {hasValidPhone ? (
                    <span className="font-semibold text-slate-800">{formattedPhone}</span>
                  ) : (
                    <span className="font-semibold text-amber-600 flex items-center gap-1 text-[11px]">
                      <AlertCircle className="w-3 h-3" />
                      No phone registered
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Stage Transition Badge */}
            <div className="flex items-center gap-1.5 text-xs font-bold shrink-0 self-start">
              <span className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-slate-700 font-bold text-[11px]">
                {previousStageName || 'Current Stage'}
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span
                className="px-2.5 py-1 rounded-lg font-black border text-[11px]"
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
        </div>

        {/* 2. Visual Channel Switcher Bar */}
        <div className="bg-slate-100 p-1.5 rounded-2xl flex items-center gap-1.5 border border-slate-200/80">
          <button
            type="button"
            onClick={() => setActiveTab('EMAIL')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              activeTab === 'EMAIL'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Mail className={`w-4 h-4 ${activeTab === 'EMAIL' ? 'text-blue-600' : 'text-slate-400'}`} />
            <span>Email Notification</span>
            {hasValidEmail ? (
              <span className="w-2 h-2 rounded-full bg-emerald-500" title="Email recipient available" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-amber-400" title="Email recipient missing" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('WHATSAPP')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              activeTab === 'WHATSAPP'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <WhatsAppIcon className={`w-4 h-4 ${activeTab === 'WHATSAPP' ? 'text-[#25D366]' : 'text-slate-400'}`} />
            <span>WhatsApp Message</span>
            {hasValidPhone ? (
              <span className="w-2 h-2 rounded-full bg-emerald-500" title="Phone number available" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-amber-400" title="Phone number missing" />
            )}
          </button>
        </div>

        {/* ======================= EMAIL TAB ======================= */}
        {activeTab === 'EMAIL' && (
          <div className="space-y-4 animate-in fade-in-50 duration-150">
            {isLoadingTemplates && (
              <div className="py-16 flex flex-col items-center justify-center space-y-3">
                <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-bold text-slate-400">Locating matching email template for {newStage.name}...</p>
              </div>
            )}

            {!isLoadingTemplates && isTemplatesError && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs space-y-1">
                <p className="font-bold text-rose-800 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  Unable to load email templates from server
                </p>
                <p className="text-rose-600">You can still proceed with WhatsApp or skip communication.</p>
              </div>
            )}

            {!isLoadingTemplates && !hasValidEmail && (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs space-y-1">
                <p className="font-bold text-amber-900 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  No email address recorded for this lead
                </p>
                <p className="text-amber-700">
                  You can update the lead's email first, or use the WhatsApp option to contact them.
                </p>
              </div>
            )}

            {!isLoadingTemplates && !isTemplatesError && !matchedEmailTemplate && (
              <div className="py-12 px-6 bg-slate-50 border border-dashed border-slate-300 rounded-3xl text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto border border-slate-200">
                  <FileQuestion className="w-6 h-6 text-slate-400" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-slate-900">No email template configured for this stage.</h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    No automatic email will be dispatched for stage{' '}
                    <strong className="text-slate-800 font-bold">"{newStage.name}"</strong>.
                  </p>
                </div>
              </div>
            )}

            {!isLoadingTemplates && !isTemplatesError && matchedEmailTemplate && (
              <div className="space-y-4">
                {/* Template Envelope Header */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-[10px] font-black uppercase tracking-wider">
                        Selected Template
                      </span>
                      <span className="text-xs font-black text-slate-900 truncate">
                        {matchedEmailTemplate.templateName || matchedEmailTemplate.name}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-slate-400 shrink-0">
                      {matchedEmailTemplate.identifierKey || matchedEmailTemplate.key}
                    </span>
                  </div>

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
                  <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-black text-slate-900 tracking-tight">QUIKBOOM</h4>
                      <p className="text-[10px] text-slate-400 font-medium">Digital Marketing Agency</p>
                    </div>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold">
                      Lead Notification
                    </span>
                  </div>

                  <div
                    className="text-xs text-slate-700 leading-relaxed font-sans overflow-x-auto"
                    dangerouslySetInnerHTML={{ __html: renderedBodyHtml }}
                  />

                  <div className="pt-4 border-t border-slate-100 text-center text-[10px] text-slate-400">
                    Sent via <strong>QUIKBOOM Digital Marketing Agency</strong> • CRM
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================= WHATSAPP TAB ======================= */}
        {activeTab === 'WHATSAPP' && (
          <div className="space-y-4 animate-in fade-in-50 duration-150">
            {!hasValidPhone && (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs space-y-1">
                <p className="font-bold text-amber-900 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  No valid phone number recorded for this lead
                </p>
                <p className="text-amber-700">
                  WhatsApp messages require an E.164 phone number. Please update the lead profile with a 10-digit mobile number.
                </p>
              </div>
            )}

            {!matchedWhatsAppTemplate && (
              <div className="py-12 px-6 bg-slate-50 border border-dashed border-slate-300 rounded-3xl text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto border border-slate-200">
                  <FileQuestion className="w-6 h-6 text-slate-400" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-slate-900">No WhatsApp template configured for this stage.</h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    No automatic WhatsApp message is registered for stage{' '}
                    <strong className="text-slate-800 font-bold">"{newStage.name}"</strong>.
                  </p>
                </div>
              </div>
            )}

            {matchedWhatsAppTemplate && (
              <div className="space-y-4">
                {/* Template Info Card */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[10px] font-black uppercase tracking-wider">
                        WhatsApp Template
                      </span>
                      <span className="text-xs font-black text-slate-900 truncate">
                        {matchedWhatsAppTemplate.title}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-slate-400 shrink-0">
                      {matchedWhatsAppTemplate.templateName}
                    </span>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-20 font-bold text-slate-400 shrink-0">Recipient:</span>
                      <span className="font-bold text-slate-900">{formattedPhone || '—'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-20 font-bold text-slate-400 shrink-0">Target Stage:</span>
                      <span className="font-black text-emerald-700">{newStage.name}</span>
                    </div>
                  </div>
                </div>

                {/* WhatsApp Chat Preview Simulation */}
                <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-xs">
                  {/* WhatsApp App Header */}
                  <div className="bg-[#075E54] text-white px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center font-bold text-xs">
                        {leadFullName[0] || 'L'}
                      </div>
                      <div>
                        <p className="text-xs font-bold leading-tight truncate max-w-[200px]">{leadFullName}</p>
                        <p className="text-[10px] text-emerald-200/80 leading-none mt-0.5">Online via WhatsApp</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-emerald-100">
                      <WhatsAppIcon className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Chat Area with Background Texture */}
                  <div className="bg-[#ECE5DD] p-4 min-h-[160px] flex flex-col justify-end space-y-2">
                    <div className="text-center">
                      <span className="px-2.5 py-0.5 bg-white/80 rounded-md text-[10px] font-bold text-slate-500 shadow-2xs">
                        TODAY
                      </span>
                    </div>

                    {/* WhatsApp Speech Bubble */}
                    <div className="self-end max-w-[85%] bg-[#DCF8C6] text-slate-900 rounded-2xl rounded-tr-xs p-3 shadow-xs space-y-1.5">
                      <p className="text-xs whitespace-pre-wrap leading-relaxed">
                        {renderedWhatsAppText}
                      </p>
                      <div className="flex items-center justify-end gap-1 text-[10px] text-slate-500 font-medium">
                        <span>Just now</span>
                        <span className="text-sky-500 font-bold">✓✓</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white px-4 py-2 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
                    <span>Delivered via <strong>Meta WhatsApp Cloud API</strong></span>
                    <span className="text-emerald-700 font-bold">End-to-end encrypted</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. Injected Variables Inspector */}
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
    </AdminFormDrawer>
  );
}

// Re-export with both names for backwards compatibility
export const LeadStageCommunicationDrawer = LeadStageEmailDrawer;
