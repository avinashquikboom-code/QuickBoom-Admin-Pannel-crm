'use client';

import React, { useState, useMemo, useEffect } from 'react';
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
  RotateCcw,
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
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
  name?: string;
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
    assignedTo?: { firstName?: string | null; lastName?: string | null; [key: string]: any } | null;
    [key: string]: any;
  } | null;
  previousStageName?: string;
  newStage?: {
    id: number | string;
    name: string;
    key?: string;
    color?: string;
    bgColor?: string;
    borderColor?: string;
  } | null;
  initialChannel?: 'EMAIL' | 'WHATSAPP';
  isDirectSend?: boolean;
  onConfirm?: (options: {
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
export const STAGE_KEY_TO_EMAIL_TEMPLATE_KEY: Record<string, string> = {
  NEW: 'QUIKBOOM_NEW_LEAD',
  NEW_LEAD: 'QUIKBOOM_NEW_LEAD',
  CONTACTED: 'QUIKBOOM_CONTACTED',
  QUALIFIED: 'QUIKBOOM_QUALIFIED',
  PROPOSAL: 'QUIKBOOM_PROPOSAL_SENT',
  PROPOSAL_SENT: 'QUIKBOOM_PROPOSAL_SENT',
  NEGOTIATION: 'QUIKBOOM_NEGOTIATION',
  FINAL_CALL: 'QUIKBOOM_FINAL_CALL',
  FINAL_DISCUSSION: 'QUIKBOOM_FINAL_CALL',
  WON: 'QUIKBOOM_WON',
  CLOSED_WON: 'QUIKBOOM_WON',
  CONVERTED: 'QUIKBOOM_WON',
  DEAL_WON: 'QUIKBOOM_WON',
  LOST: 'QUIKBOOM_LOST',
  CLOSED_LOST: 'QUIKBOOM_LOST',
  CANCELLED: 'QUIKBOOM_LOST',
  DEAL_LOST: 'QUIKBOOM_LOST',
  DETAILS_SENT: 'QUIKBOOM_DETAILS_SENT',
  COMPANY_DETAILS_SENT: 'QUIKBOOM_DETAILS_SENT',
  FOLLOW_UP: 'QUIKBOOM_FOLLOW_UP',
  FOLLOWUP: 'QUIKBOOM_FOLLOW_UP',
  VISIT_SCHEDULED: 'QUIKBOOM_VISIT_SCHEDULED',
  VISIT: 'QUIKBOOM_VISIT_SCHEDULED',
  VISIT_DONE: 'QUIKBOOM_VISIT_DONE',
  VISIT_COMPLETED: 'QUIKBOOM_VISIT_DONE',
};

// Map stage keys to WhatsApp template keys
export const STAGE_KEY_TO_WHATSAPP_KEY: Record<string, string> = {
  NEW: 'NEW',
  NEW_LEAD: 'NEW',
  CONTACTED: 'CONTACTED',
  QUALIFIED: 'QUALIFIED',
  PROPOSAL: 'PROPOSAL',
  PROPOSAL_SENT: 'PROPOSAL_SENT',
  NEGOTIATION: 'NEGOTIATION',
  FINAL_CALL: 'FINAL_CALL',
  FINAL_DISCUSSION: 'FINAL_CALL',
  WON: 'WON',
  CLOSED_WON: 'WON',
  CONVERTED: 'CONVERTED',
  DEAL_WON: 'WON',
  LOST: 'LOST',
  CLOSED_LOST: 'LOST',
  CANCELLED: 'CANCELLED',
  DEAL_LOST: 'LOST',
  DETAILS_SENT: 'DETAILS_SENT',
  COMPANY_DETAILS_SENT: 'DETAILS_SENT',
  FOLLOW_UP: 'FOLLOW_UP',
  FOLLOWUP: 'FOLLOW_UP',
  VISIT_SCHEDULED: 'VISIT_SCHEDULED',
  VISIT: 'VISIT',
  VISIT_DONE: 'VISIT_DONE',
  VISIT_COMPLETED: 'VISIT_DONE',
};

export function normalizeStageKey(keyOrName?: string | null): string {
  if (!keyOrName) return '';
  return keyOrName
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_');
}

/**
 * Dynamically find the Email Template configured for a given lead stage.
 * NEVER defaults to templates[0] or a random template.
 * Returns null if no template matches.
 */
export function findMatchingEmailTemplate(
  templates: EmailTemplateItem[],
  stage?: { id?: number | string; name?: string; key?: string } | null,
  leadStatus?: string | null
): EmailTemplateItem | null {
  if (!templates || templates.length === 0) return null;

  const stageKey = normalizeStageKey(stage?.key);
  const stageName = normalizeStageKey(stage?.name);
  const statusKey = normalizeStageKey(leadStatus);

  const candidateKeys = Array.from(new Set([stageKey, stageName, statusKey].filter(Boolean)));
  if (candidateKeys.length === 0) return null;

  // 1. Check mapped system keys
  for (const cKey of candidateKeys) {
    const targetKey = STAGE_KEY_TO_EMAIL_TEMPLATE_KEY[cKey];
    if (targetKey) {
      const match = templates.find((t) => {
        const idKey = (t.identifierKey || t.key || '').toUpperCase();
        return (
          (idKey === targetKey ||
            (targetKey === 'QUIKBOOM_WON' && (idKey === 'QUIKBOOM_DEAL_WON' || idKey === 'QUIKBOOM_WON')) ||
            (targetKey === 'QUIKBOOM_LOST' && (idKey === 'QUIKBOOM_DEAL_LOST' || idKey === 'QUIKBOOM_LOST'))) &&
          t.isActive !== false
        );
      });
      if (match) return match;
    }
  }

  // 2. Direct key match on identifierKey or key
  for (const cKey of candidateKeys) {
    const match = templates.find((t) => {
      const idKey = (t.identifierKey || t.key || '').toUpperCase();
      return (
        (idKey === cKey ||
          idKey === `QUIKBOOM_${cKey}` ||
          idKey.replace('QUIKBOOM_', '') === cKey) &&
        t.isActive !== false
      );
    });
    if (match) return match;
  }

  // 3. Match by stage name keywords
  const rawStageName = (stage?.name || leadStatus || '').trim().toLowerCase();
  if (rawStageName) {
    const match = templates.find((t) => {
      if (t.isActive === false) return false;
      const tplName = (t.templateName || t.name || '').toLowerCase();
      if (tplName === rawStageName) return true;
      if (
        tplName.startsWith(`${rawStageName} `) ||
        tplName.startsWith(`${rawStageName} –`) ||
        tplName.startsWith(`${rawStageName} -`)
      ) {
        return true;
      }
      if (candidateKeys.includes('FOLLOW_UP')) {
        return tplName.includes('follow-up') || tplName.includes('follow up');
      }
      if (candidateKeys.includes('DETAILS_SENT')) {
        return tplName.includes('details sent') || tplName.includes('company details');
      }
      if (candidateKeys.includes('QUALIFIED')) {
        return tplName.includes('qualified');
      }
      if (candidateKeys.includes('CONTACTED')) {
        return tplName.includes('contacted');
      }
      if (candidateKeys.includes('NEW') || candidateKeys.includes('NEW_LEAD')) {
        return tplName.includes('new lead') || (tplName.includes('new') && !tplName.includes('news'));
      }
      if (candidateKeys.includes('PROPOSAL') || candidateKeys.includes('PROPOSAL_SENT')) {
        return tplName.includes('proposal');
      }
      if (candidateKeys.includes('NEGOTIATION')) {
        return tplName.includes('negotiat') || tplName.includes('proposal discussion');
      }
      if (candidateKeys.includes('FINAL_CALL')) {
        return tplName.includes('final call') || tplName.includes('final discussion');
      }
      if (candidateKeys.includes('WON') || candidateKeys.includes('CLOSED_WON') || candidateKeys.includes('CONVERTED')) {
        return tplName.includes('won') || tplName.includes('onboarding');
      }
      if (candidateKeys.includes('LOST') || candidateKeys.includes('CLOSED_LOST') || candidateKeys.includes('CANCELLED')) {
        return tplName.includes('lost') || tplName.includes('closed');
      }
      if (candidateKeys.includes('VISIT_SCHEDULED') || candidateKeys.includes('VISIT')) {
        return tplName.includes('visit scheduled') || (tplName.includes('meeting') && tplName.includes('scheduled'));
      }
      if (candidateKeys.includes('VISIT_DONE')) {
        return tplName.includes('visit completed') || tplName.includes('visit done');
      }
      return false;
    });
    if (match) return match;
  }

  // IMPORTANT: Return null if no template matches this stage. NEVER return templates[0]!
  return null;
}

/**
 * Dynamically find the WhatsApp Template configured for a given lead stage.
 * NEVER defaults to templates[0] or a random template.
 * Returns null if no template matches.
 */
export function findMatchingWhatsAppTemplate(
  templates: WhatsAppStageTemplate[],
  stage?: { id?: number | string; name?: string; key?: string } | null,
  leadStatus?: string | null
): WhatsAppStageTemplate | null {
  if (!templates || templates.length === 0) return null;

  const stageKey = normalizeStageKey(stage?.key);
  const stageName = normalizeStageKey(stage?.name);
  const statusKey = normalizeStageKey(leadStatus);

  const candidateKeys = Array.from(new Set([stageKey, stageName, statusKey].filter(Boolean)));
  if (candidateKeys.length === 0) return null;

  // 1. Direct or mapped key match
  for (const cKey of candidateKeys) {
    const targetKey = STAGE_KEY_TO_WHATSAPP_KEY[cKey] || cKey;
    const match = templates.find((t) => {
      const tKey = t.key.toUpperCase();
      return (
        tKey === targetKey ||
        tKey === cKey ||
        (targetKey === 'WON' && (tKey === 'WON' || tKey === 'CONVERTED')) ||
        (targetKey === 'LOST' && (tKey === 'LOST' || tKey === 'CANCELLED')) ||
        (targetKey === 'PROPOSAL' && (tKey === 'PROPOSAL' || tKey === 'PROPOSAL_SENT')) ||
        (targetKey === 'VISIT_SCHEDULED' && (tKey === 'VISIT_SCHEDULED' || tKey === 'VISIT'))
      );
    });
    if (match) return match;
  }

  // 2. Title/Name keyword match
  const rawStageName = (stage?.name || leadStatus || '').trim().toLowerCase();
  if (rawStageName) {
    const match = templates.find((t) => {
      const title = (t.title || t.name || '').toLowerCase();
      if (candidateKeys.includes('FOLLOW_UP')) {
        return title.includes('follow up') || title.includes('follow-up');
      }
      if (candidateKeys.includes('DETAILS_SENT')) {
        return title.includes('details sent');
      }
      if (candidateKeys.includes('QUALIFIED')) {
        return title.includes('qualified');
      }
      if (candidateKeys.includes('CONTACTED')) {
        return title.includes('contacted');
      }
      if (candidateKeys.includes('NEW') || candidateKeys.includes('NEW_LEAD')) {
        return title.includes('new lead') || title.includes('welcome');
      }
      if (candidateKeys.includes('PROPOSAL') || candidateKeys.includes('PROPOSAL_SENT')) {
        return title.includes('proposal');
      }
      if (candidateKeys.includes('NEGOTIATION')) {
        return title.includes('negotiation');
      }
      if (candidateKeys.includes('FINAL_CALL')) {
        return title.includes('final call');
      }
      if (candidateKeys.includes('WON') || candidateKeys.includes('CLOSED_WON') || candidateKeys.includes('CONVERTED')) {
        return title.includes('won') || title.includes('deal closed');
      }
      if (candidateKeys.includes('LOST') || candidateKeys.includes('CLOSED_LOST') || candidateKeys.includes('CANCELLED')) {
        return title.includes('lost') || title.includes('cancelled');
      }
      if (candidateKeys.includes('VISIT_SCHEDULED') || candidateKeys.includes('VISIT')) {
        return title.includes('visit scheduled') || title.includes('visit stage');
      }
      if (candidateKeys.includes('VISIT_DONE')) {
        return title.includes('visit done');
      }
      return title.includes(rawStageName);
    });
    if (match) return match;
  }

  // IMPORTANT: Return null if no template matches this stage. NEVER return templates[0]!
  return null;
}

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
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.456 5.711 1.457h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export function LeadStageEmailDrawer({
  isOpen,
  onClose,
  lead,
  previousStageName = 'Current Stage',
  newStage,
  initialChannel = 'EMAIL',
  isDirectSend = false,
  onConfirm,
  isSubmitting = false,
}: LeadStageEmailDrawerProps) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'EMAIL' | 'WHATSAPP'>('EMAIL');
  const [isDirectSending, setIsDirectSending] = useState(false);

  // Template selection state
  const [selectedEmailTemplateId, setSelectedEmailTemplateId] = useState<number | string | null>(null);
  const [selectedWhatsAppTemplateKey, setSelectedWhatsAppTemplateKey] = useState<string | null>(null);

  // User customization overrides
  const [customSubject, setCustomSubject] = useState<string>('');
  const [hasUserEditedSubject, setHasUserEditedSubject] = useState<boolean>(false);
  const [customBodyHtml, setCustomBodyHtml] = useState<string>('');
  const [hasUserEditedBody, setHasUserEditedBody] = useState<boolean>(false);
  const [customWhatsAppText, setCustomWhatsAppText] = useState<string>('');
  const [hasUserEditedWhatsApp, setHasUserEditedWhatsApp] = useState<boolean>(false);

  // Automatically switch tab when initialChannel changes or modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialChannel) {
        setActiveTab(initialChannel);
      }
      setHasUserEditedSubject(false);
      setHasUserEditedBody(false);
      setHasUserEditedWhatsApp(false);
    }
  }, [isOpen, initialChannel]);

  // Fallback effective stage when newStage is not passed (e.g. direct send from contact card)
  const effectiveStage = useMemo(() => {
    if (newStage) return newStage;
    if (lead?.stage) {
      return {
        id: lead.stage.id,
        name: lead.stage.name || lead.stage.label || lead.status || 'Current Stage',
        key: lead.stage.key || lead.status,
        color: lead.stage.color || '#15803D',
        bgColor: lead.stage.bgColor || '#ECFDF5',
        borderColor: lead.stage.borderColor || '#A7F3D0',
      };
    }
    return {
      id: lead?.stageId || 0,
      name: lead?.status || 'Current Stage',
      key: lead?.status,
      color: '#15803D',
      bgColor: '#ECFDF5',
      borderColor: '#A7F3D0',
    };
  }, [newStage, lead]);

  // 1. Fetch available email templates from existing CRM API
  const {
    data: emailTemplates = [],
    isLoading: isLoadingEmailTemplates,
    isError: isEmailTemplatesError,
    refetch: refetchEmailTemplates,
  } = useQuery<EmailTemplateItem[]>({
    queryKey: ['crm-email-templates', 'ALL'],
    enabled: isOpen,
    queryFn: async () => {
      const res: any = await api.get('/email/templates');
      const list = res?.data || res;
      if (!Array.isArray(list)) return [];
      return list.filter((t) => t.isActive !== false);
    },
  });

  // 2. Fetch available WhatsApp templates (from backend /leads/whatsapp-templates with fallback)
  const {
    data: whatsAppTemplates = [],
    isLoading: isLoadingWhatsAppTemplates,
    isError: isWhatsAppTemplatesError,
  } = useQuery<WhatsAppStageTemplate[]>({
    queryKey: ['crm-whatsapp-templates'],
    enabled: isOpen,
    queryFn: async () => {
      try {
        const res: any = await api.get('/leads/whatsapp-templates');
        const list = res?.data || res;
        if (Array.isArray(list) && list.length > 0) return list;
      } catch {
        // graceful fallback to predefined templates
      }
      return Object.values(WHATSAPP_STAGE_TEMPLATES);
    },
    initialData: Object.values(WHATSAPP_STAGE_TEMPLATES),
  });

  // 3. Resolve stage-matching email template (dynamically matched to Lead's current/new stage)
  const stageMatchedEmailTemplate = useMemo(() => {
    return findMatchingEmailTemplate(emailTemplates, effectiveStage, lead?.status);
  }, [emailTemplates, effectiveStage, lead?.status]);

  // 4. Resolve stage-matching WhatsApp template (dynamically matched to Lead's current/new stage)
  const stageMatchedWhatsAppTemplate = useMemo(() => {
    return findMatchingWhatsAppTemplate(whatsAppTemplates, effectiveStage, lead?.status);
  }, [whatsAppTemplates, effectiveStage, lead?.status]);

  // Automatically select stage-configured Email & WhatsApp templates whenever the drawer opens or stage changes
  useEffect(() => {
    if (!isOpen) return;

    // Reset user-edited states so fresh stage template content is shown
    setHasUserEditedSubject(false);
    setCustomSubject('');
    setHasUserEditedBody(false);
    setCustomBodyHtml('');
    setHasUserEditedWhatsApp(false);
    setCustomWhatsAppText('');

    // Automatically select the template configured for the CURRENT/NEW stage
    setSelectedEmailTemplateId(stageMatchedEmailTemplate ? stageMatchedEmailTemplate.id : null);
    setSelectedWhatsAppTemplateKey(stageMatchedWhatsAppTemplate ? stageMatchedWhatsAppTemplate.key : null);
  }, [
    isOpen,
    lead?.id,
    effectiveStage.id,
    effectiveStage.name,
    effectiveStage.key,
    stageMatchedEmailTemplate?.id,
    stageMatchedWhatsAppTemplate?.key,
  ]);

  // Active email template (selected by user or stage matched, NEVER defaults to templates[0])
  const activeEmailTemplate = useMemo(() => {
    if (!emailTemplates.length) return null;
    if (selectedEmailTemplateId) {
      const found = emailTemplates.find((t) => String(t.id) === String(selectedEmailTemplateId));
      if (found) return found;
    }
    return stageMatchedEmailTemplate || null;
  }, [emailTemplates, selectedEmailTemplateId, stageMatchedEmailTemplate]);

  // Active WhatsApp template (selected by user or stage matched, NEVER defaults to templates[0])
  const activeWhatsAppTemplate = useMemo(() => {
    if (!whatsAppTemplates.length) return null;
    if (selectedWhatsAppTemplateKey) {
      const found = whatsAppTemplates.find((t) => t.key === selectedWhatsAppTemplateKey);
      if (found) return found;
    }
    return stageMatchedWhatsAppTemplate || null;
  }, [whatsAppTemplates, selectedWhatsAppTemplateKey, stageMatchedWhatsAppTemplate]);

  // 5. Lead context & formatted variables
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

  // 6. Interpolation logic
  const { defaultRenderedSubject, defaultRenderedBodyHtml, defaultRenderedWhatsAppText, renderedVariables } = useMemo(() => {
    if (!lead) {
      return { defaultRenderedSubject: '', defaultRenderedBodyHtml: '', defaultRenderedWhatsAppText: '', renderedVariables: [] };
    }

    // Resolve assigned employee details for signature (or fallback to creator/company)
    const assignedEmpName = lead.assignedTo
      ? (`${lead.assignedTo.firstName || ''} ${lead.assignedTo.lastName || ''}`.trim() || lead.assignedTo.name || '')
      : (lead.user?.name || (lead.user?.firstName ? `${lead.user.firstName || ''} ${lead.user.lastName || ''}`.trim() : ''));
    const assignedEmpEmail = lead.assignedTo?.email?.trim() || lead.user?.email?.trim() || 'sales@quikboom.com';
    const repName = assignedEmpName || 'QuickBoom Team';

    const variableMap: Record<string, string> = {
      leadName: leadFullName,
      leadFirstName: (lead.firstName || '').trim() || leadFullName,
      name: leadFullName,
      customerName: leadFullName,
      recipientName: leadFullName,
      leadTitle: (lead.title || lead.companyName || 'your requirements').trim(),
      leadEmail: recipientEmail,
      leadPhone: formattedPhone || rawPhone,
      phone: formattedPhone || rawPhone,
      company: lead.companyName || 'your company',
      companyName: lead.customer?.companyName || lead.customer?.name || lead.companyName || 'QUIKBOOM Digital Marketing Agency',
      userName: repName,
      senderName: repName,
      assignedUser: repName,
      assignedEmployee: repName,
      assignedEmployeeName: repName,
      assignedEmployeeEmail: assignedEmpEmail,
      senderEmail: assignedEmpEmail,
      email: assignedEmpEmail,
      stage: effectiveStage.name || 'Current Stage',
      stageName: effectiveStage.name || 'Updated Stage',
      newStage: effectiveStage.name || 'Updated Stage',
      previousStage: previousStageName || 'Previous Stage',
      followUpDate: lead.nextFollowUpDate || 'as scheduled',
      followUpTime: lead.nextFollowUpTime || 'soon',
      startDate: lead.nextFollowUpDate || 'as scheduled',
      startTime: lead.nextFollowUpTime || 'soon',
      loginUrl: 'https://quikboom.com/login',
    };

    const interpolate = (text: string) => {
      if (!text) return '';
      return text.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
        return variableMap[key] !== undefined ? variableMap[key] : `{{${key}}}`;
      });
    };

    let subject = '';
    let bodyHtml = '';
    if (activeEmailTemplate) {
      subject = interpolate(activeEmailTemplate.subject || 'Your Lead Status Has Been Updated');
      const interpolatedBody = interpolate(activeEmailTemplate.body || '');

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

    let whatsAppText = '';
    if (activeWhatsAppTemplate) {
      whatsAppText = interpolate(activeWhatsAppTemplate.body);
    }

    const injectedVars = Object.entries(variableMap)
      .filter(([key]) =>
        (activeEmailTemplate?.body.includes(`{{${key}}}`) || activeEmailTemplate?.subject.includes(`{{${key}}}`)) ||
        activeWhatsAppTemplate?.body.includes(`{{${key}}}`)
      )
      .map(([key, val]) => ({ key: `{{${key}}}`, value: val }));

    return {
      defaultRenderedSubject: subject,
      defaultRenderedBodyHtml: bodyHtml,
      defaultRenderedWhatsAppText: whatsAppText,
      renderedVariables: injectedVars,
    };
  }, [activeEmailTemplate, activeWhatsAppTemplate, lead, effectiveStage, leadFullName, recipientEmail, formattedPhone, rawPhone, previousStageName]);

  const finalSubject = hasUserEditedSubject ? customSubject : defaultRenderedSubject;
  const finalBodyHtml = hasUserEditedBody ? customBodyHtml : defaultRenderedBodyHtml;
  const finalWhatsAppText = hasUserEditedWhatsApp ? customWhatsAppText : defaultRenderedWhatsAppText;

  // Direct Send Handlers
  const handleDirectSendEmail = async () => {
    if (!lead?.id) return;
    if (!hasValidEmail) {
      toast.error('No valid recipient email address is available for this lead.');
      return;
    }
    if (!finalSubject.trim()) {
      toast.error('Subject line is required.');
      return;
    }
    setIsDirectSending(true);
    try {
      const res: any = await api.post('/email/send', {
        to: recipientEmail,
        subject: finalSubject.trim(),
        body: finalBodyHtml.trim(),
        templateId: activeEmailTemplate?.id,
        recordType: 'lead',
        recordId: lead.id,
      });
      const data = res?.data || res;
      if (data?.success !== false) {
        toast.success(data?.message || `Email sent successfully to ${recipientEmail}`);
        queryClient.invalidateQueries({ queryKey: ['lead-detail', String(lead.id)] });
        queryClient.invalidateQueries({ queryKey: ['admin-lead-detail', String(lead.id)] });
        onClose();
      } else {
        toast.error(data?.message || 'Failed to send email.');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Could not send email.');
    } finally {
      setIsDirectSending(false);
    }
  };

  const handleDirectSendWhatsApp = async () => {
    if (!lead?.id) return;
    if (!hasValidPhone) {
      toast.error('No WhatsApp number is available for this lead.');
      return;
    }
    if (!finalWhatsAppText.trim()) {
      toast.error('WhatsApp message cannot be empty.');
      return;
    }
    setIsDirectSending(true);
    try {
      const res: any = await api.post(`/leads/${lead.id}/send-whatsapp`, {
        message: finalWhatsAppText.trim(),
        templateName: activeWhatsAppTemplate?.templateName,
        stageName: effectiveStage.name,
      });
      const data = res?.data || res;
      if (data?.success !== false) {
        toast.success(data?.message || `WhatsApp message sent successfully to ${formattedPhone}`);
        queryClient.invalidateQueries({ queryKey: ['lead-detail', String(lead.id)] });
        queryClient.invalidateQueries({ queryKey: ['admin-lead-detail', String(lead.id)] });
        onClose();
      } else {
        toast.error(data?.message || 'Failed to send WhatsApp message.');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Could not send WhatsApp message.');
    } finally {
      setIsDirectSending(false);
    }
  };

  const handleDirectSendBoth = async () => {
    if (!lead?.id) return;
    setIsDirectSending(true);
    try {
      if (hasValidEmail && activeEmailTemplate) {
        await api.post('/email/send', {
          to: recipientEmail,
          subject: finalSubject.trim(),
          body: finalBodyHtml.trim(),
          templateId: activeEmailTemplate.id,
          recordType: 'lead',
          recordId: lead.id,
        }).catch((err) => console.warn('Email dispatch warning:', err));
      }
      if (hasValidPhone && activeWhatsAppTemplate) {
        await api.post(`/leads/${lead.id}/send-whatsapp`, {
          message: finalWhatsAppText.trim(),
          templateName: activeWhatsAppTemplate.templateName,
          stageName: effectiveStage.name,
        }).catch((err) => console.warn('WhatsApp dispatch warning:', err));
      }
      toast.success('Communication dispatched via Email & WhatsApp!');
      queryClient.invalidateQueries({ queryKey: ['lead-detail', String(lead.id)] });
      queryClient.invalidateQueries({ queryKey: ['admin-lead-detail', String(lead.id)] });
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to send communication.');
    } finally {
      setIsDirectSending(false);
    }
  };

  if (!isOpen || !lead) return null;

  const isBusy = isSubmitting || isDirectSending;

  return (
    <AdminFormDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={isDirectSend ? 'Lead Communication' : 'Lead Stage Communication'}
      description={
        isDirectSend
          ? `Select template and communicate with ${leadFullName} via Email or WhatsApp.`
          : 'Select and review communication channels for this stage transition.'
      }
      icon={Mail}
      maxWidth="sm:max-w-[640px]"
      isSubmitting={isBusy}
      footer={
        <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
            className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all cursor-pointer disabled:opacity-50"
          >
            Close
          </button>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            {/* Stage Change Workflow Actions */}
            {!isDirectSend && onConfirm && (
              <>
                <button
                  type="button"
                  onClick={() => onConfirm({ sendEmail: false, sendWhatsapp: false })}
                  disabled={isBusy}
                  className="w-full sm:w-auto px-3.5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  Skip Communication
                </button>

                {activeTab === 'EMAIL' && activeEmailTemplate && hasValidEmail && (
                  <button
                    type="button"
                    onClick={() =>
                      onConfirm({
                        sendEmail: true,
                        sendWhatsapp: false,
                        templateId: activeEmailTemplate.id,
                        customSubject: finalSubject,
                        customBody: finalBodyHtml,
                      })
                    }
                    disabled={isBusy}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isBusy ? (
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

                {activeTab === 'WHATSAPP' && activeWhatsAppTemplate && hasValidPhone && (
                  <button
                    type="button"
                    onClick={() =>
                      onConfirm({
                        sendEmail: false,
                        sendWhatsapp: true,
                        whatsappMessage: finalWhatsAppText,
                        whatsappTemplateName: activeWhatsAppTemplate.templateName,
                      })
                    }
                    disabled={isBusy}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#128C7E] hover:bg-[#075E54] text-white font-black rounded-xl text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isBusy ? (
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

                {hasValidEmail && hasValidPhone && activeEmailTemplate && activeWhatsAppTemplate && (
                  <button
                    type="button"
                    onClick={() =>
                      onConfirm({
                        sendEmail: true,
                        sendWhatsapp: true,
                        templateId: activeEmailTemplate.id,
                        customSubject: finalSubject,
                        customBody: finalBodyHtml,
                        whatsappMessage: finalWhatsAppText,
                        whatsappTemplateName: activeWhatsAppTemplate.templateName,
                      })
                    }
                    disabled={isBusy}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-[#128C7E] hover:from-blue-700 hover:to-[#075E54] text-white font-black rounded-xl text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isBusy ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Send Email & WhatsApp</span>
                      </>
                    )}
                  </button>
                )}
              </>
            )}

            {/* Direct Send Workflow Actions (from Contact Card click) */}
            {isDirectSend && (
              <>
                {activeTab === 'EMAIL' && (
                  <button
                    type="button"
                    onClick={handleDirectSendEmail}
                    disabled={isBusy || !hasValidEmail || !activeEmailTemplate}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isBusy ? (
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

                {activeTab === 'WHATSAPP' && (
                  <button
                    type="button"
                    onClick={handleDirectSendWhatsApp}
                    disabled={isBusy || !hasValidPhone || !activeWhatsAppTemplate}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#128C7E] hover:bg-[#075E54] text-white font-black rounded-xl text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isBusy ? (
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

                {hasValidEmail && hasValidPhone && activeEmailTemplate && activeWhatsAppTemplate && (
                  <button
                    type="button"
                    onClick={handleDirectSendBoth}
                    disabled={isBusy}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-[#128C7E] hover:from-blue-700 hover:to-[#075E54] text-white font-black rounded-xl text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isBusy ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Send Email & WhatsApp</span>
                      </>
                    )}
                  </button>
                )}
              </>
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

            {/* Stage Badge */}
            <div className="flex items-center gap-1.5 text-xs font-bold shrink-0 self-start">
              {!isDirectSend && (
                <>
                  <span className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-slate-700 font-bold text-[11px]">
                    {previousStageName || 'Current Stage'}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </>
              )}
              <span
                className="px-2.5 py-1 rounded-lg font-black border text-[11px]"
                style={{
                  backgroundColor: effectiveStage.bgColor || '#ECFDF5',
                  borderColor: effectiveStage.borderColor || '#A7F3D0',
                  color: effectiveStage.color || '#15803D',
                }}
              >
                {effectiveStage.name}
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
            <span>Email</span>
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
            <span>WhatsApp</span>
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
            {/* Missing email warning */}
            {!hasValidEmail && (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs space-y-1">
                <p className="font-bold text-amber-900 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  No valid email address recorded for this lead
                </p>
                <p className="text-amber-700">
                  Please update the lead's email address in their profile to send emails.
                </p>
              </div>
            )}

            {/* Error Loading Templates */}
            {isEmailTemplatesError && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs space-y-2">
                <p className="font-bold text-rose-800 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  Failed to load email templates from server
                </p>
                <button
                  type="button"
                  onClick={() => refetchEmailTemplates()}
                  className="px-3 py-1 bg-white border border-rose-300 rounded-lg text-rose-700 font-bold hover:bg-rose-50"
                >
                  Retry Loading
                </button>
              </div>
            )}

            {/* Template Selector Control */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-blue-600" />
                  <span>Select Email Template</span>
                </label>
                {activeEmailTemplate?.category && (
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md border border-blue-200">
                    {activeEmailTemplate.category}
                  </span>
                )}
              </div>

              <select
                value={selectedEmailTemplateId ? String(selectedEmailTemplateId) : ''}
                onChange={(e) => {
                  setSelectedEmailTemplateId(e.target.value || null);
                  setHasUserEditedSubject(false);
                  setHasUserEditedBody(false);
                }}
                disabled={isLoadingEmailTemplates || emailTemplates.length === 0}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#23C45E] transition-all cursor-pointer disabled:opacity-50"
              >
                {isLoadingEmailTemplates && <option value="">Loading email templates...</option>}
                {!isLoadingEmailTemplates && (
                  <option value="">
                    {stageMatchedEmailTemplate
                      ? '-- Select Email Template --'
                      : 'No email template configured for this stage'}
                  </option>
                )}
                {emailTemplates.map((tpl) => (
                  <option key={tpl.id} value={String(tpl.id)}>
                    {tpl.templateName || tpl.name} {tpl.subject ? `— "${tpl.subject}"` : ''}
                  </option>
                ))}
              </select>

              {/* Recipient Details */}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-20 font-bold text-slate-400 shrink-0">Recipient:</span>
                  <span className="font-bold text-slate-900">{recipientEmail || '—'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-20 font-bold text-slate-400 shrink-0">Subject:</span>
                  <input
                    type="text"
                    value={finalSubject}
                    onChange={(e) => {
                      setCustomSubject(e.target.value);
                      setHasUserEditedSubject(true);
                    }}
                    placeholder="Enter email subject"
                    className="flex-1 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500"
                  />
                  {hasUserEditedSubject && (
                    <button
                      type="button"
                      onClick={() => {
                        setHasUserEditedSubject(false);
                        setCustomSubject('');
                      }}
                      title="Reset to template subject"
                      className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-200"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Email Preview Section */}
            {activeEmailTemplate && (
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs bg-white">
                <div className="bg-slate-100/80 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between text-xs">
                  <span className="font-black text-slate-700 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                    Email Rendered Preview
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    Template #{activeEmailTemplate.id}
                  </span>
                </div>

                <div className="p-4 sm:p-5 space-y-4 max-h-[300px] overflow-y-auto">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
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
                    dangerouslySetInnerHTML={{ __html: finalBodyHtml }}
                  />

                  <div className="pt-4 border-t border-slate-100 text-center text-[10px] text-slate-400">
                    Sent via <strong>QUIKBOOM Digital Marketing Agency</strong> • CRM
                  </div>
                </div>
              </div>
            )}

            {!isLoadingEmailTemplates && !activeEmailTemplate && (
              <div className="py-10 px-6 bg-slate-50 border border-dashed border-slate-300 rounded-3xl text-center space-y-2">
                <FileQuestion className="w-8 h-8 text-slate-400 mx-auto" />
                <h4 className="text-sm font-black text-slate-800">No email template configured for this stage.</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  No email template matches the &ldquo;{effectiveStage.name}&rdquo; stage. You can manually select an existing template from the dropdown above if desired, or proceed without sending an email.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ======================= WHATSAPP TAB ======================= */}
        {activeTab === 'WHATSAPP' && (
          <div className="space-y-4 animate-in fade-in-50 duration-150">
            {/* Missing phone warning */}
            {!hasValidPhone && (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs space-y-1">
                <p className="font-bold text-amber-900 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  No WhatsApp number is available for this lead.
                </p>
                <p className="text-amber-700">
                  Please update the lead profile with a valid 10-digit mobile number before sending.
                </p>
              </div>
            )}

            {/* Template Selector Control */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <WhatsAppIcon className="w-3.5 h-3.5 text-[#25D366]" />
                  <span>Select WhatsApp Template</span>
                </label>
                {activeWhatsAppTemplate && (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-200">
                    {activeWhatsAppTemplate.templateName}
                  </span>
                )}
              </div>

              <select
                value={selectedWhatsAppTemplateKey || ''}
                onChange={(e) => {
                  setSelectedWhatsAppTemplateKey(e.target.value || null);
                  setHasUserEditedWhatsApp(false);
                }}
                disabled={isLoadingWhatsAppTemplates || whatsAppTemplates.length === 0}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#23C45E] transition-all cursor-pointer disabled:opacity-50"
              >
                {isLoadingWhatsAppTemplates && <option value="">Loading WhatsApp templates...</option>}
                {!isLoadingWhatsAppTemplates && (
                  <option value="">
                    {stageMatchedWhatsAppTemplate
                      ? '-- Select WhatsApp Template --'
                      : 'No WhatsApp template configured for this stage'}
                  </option>
                )}
                {whatsAppTemplates.map((t) => (
                  <option key={t.key} value={t.key}>
                    {t.title || t.name || t.key}
                  </option>
                ))}
              </select>

              {/* Recipient Details & Editable Message Area */}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-20 font-bold text-slate-400 shrink-0">Recipient:</span>
                  <span className="font-bold text-slate-900">{formattedPhone || '—'}</span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-500">Customize WhatsApp Message:</span>
                    {hasUserEditedWhatsApp && (
                      <button
                        type="button"
                        onClick={() => {
                          setHasUserEditedWhatsApp(false);
                          setCustomWhatsAppText('');
                        }}
                        className="text-[10px] text-emerald-600 hover:text-emerald-800 font-bold flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Reset
                      </button>
                    )}
                  </div>
                  <textarea
                    rows={3}
                    value={finalWhatsAppText}
                    onChange={(e) => {
                      setCustomWhatsAppText(e.target.value);
                      setHasUserEditedWhatsApp(true);
                    }}
                    placeholder="Enter WhatsApp message text"
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-[#23C45E] shadow-2xs resize-none"
                  />
                </div>
              </div>
            </div>

            {/* WhatsApp Chat Preview Simulation */}
            {activeWhatsAppTemplate && (
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

                {/* Chat Area with WhatsApp Texture */}
                <div className="bg-[#ECE5DD] p-4 min-h-[160px] flex flex-col justify-end space-y-2">
                  <div className="text-center">
                    <span className="px-2.5 py-0.5 bg-white/80 rounded-md text-[10px] font-bold text-slate-500 shadow-2xs">
                      TODAY
                    </span>
                  </div>

                  {/* WhatsApp Speech Bubble */}
                  <div className="self-end max-w-[85%] bg-[#DCF8C6] text-slate-900 rounded-2xl rounded-tr-xs p-3 shadow-xs space-y-1.5">
                    <p className="text-xs whitespace-pre-wrap leading-relaxed">
                      {finalWhatsAppText}
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
            )}

            {!isLoadingWhatsAppTemplates && !activeWhatsAppTemplate && (
              <div className="py-10 px-6 bg-slate-50 border border-dashed border-slate-300 rounded-3xl text-center space-y-2">
                <FileQuestion className="w-8 h-8 text-slate-400 mx-auto" />
                <h4 className="text-sm font-black text-slate-800">No WhatsApp template configured for this stage.</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  No WhatsApp template matches the &ldquo;{effectiveStage.name}&rdquo; stage. You can manually select an existing template from the dropdown above if desired, or proceed without sending a WhatsApp message.
                </p>
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
