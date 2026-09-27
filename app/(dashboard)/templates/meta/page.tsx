'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MessageSquare,
  Search,
  Plus,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Sparkles,
  Layers,
  Code2,
  Info,
  X,
  Send,
  ExternalLink,
  Clock,
  Check,
  CheckCheck,
  Globe,
  Tag,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { AdminPageHeader, AdminButton } from '@/components/admin';

function WhatsAppIcon({ className = 'w-4 h-4' }: { className?: string }) {
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

interface MetaTemplate {
  id: number;
  customerId?: number | null;
  name: string;
  displayName: string;
  category: string;
  language: string;
  metaTemplateId?: string | null;
  metaStatus: string;
  rejectionReason?: string | null;
  headerType: string;
  headerContent?: string | null;
  bodyText: string;
  footerText?: string | null;
  buttons?: any;
  variables: string[];
  sampleValues?: Record<string, string>;
  isSystem: boolean;
  isActive: boolean;
  lastSyncedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MetaTemplateFormValues {
  id: number;
  name: string;
  displayName: string;
  category: string;
  language: string;
  headerType: string;
  headerContent: string;
  bodyText: string;
  footerText: string;
  buttons: any[];
  variables: string[];
  isActive: boolean;
}

export interface CreateMetaTemplatePayload {
  name: string;
  templateName: string;
  body: string;
  category?: string;
  language?: string;
  headerType?: string;
  headerContent?: string;
  footer?: string;
  buttons?: any[];
  variables?: string[];
  isLocalActive?: boolean;
}

export interface UpdateMetaTemplatePayload {
  name?: string;
  templateName?: string;
  body?: string;
  category?: string;
  language?: string;
  headerType?: string;
  headerContent?: string;
  footer?: string;
  buttons?: any[];
  variables?: string[];
  isLocalActive?: boolean;
}

const CATEGORIES = [
  { id: 'ALL', label: 'All Categories' },
  { id: 'MARKETING', label: 'Marketing' },
  { id: 'UTILITY', label: 'Utility' },
  { id: 'AUTHENTICATION', label: 'Authentication' },
];

const META_STATUSES = [
  { id: 'ALL', label: 'All Meta Statuses' },
  { id: 'APPROVED', label: 'Approved' },
  { id: 'PENDING', label: 'Pending / In Review' },
  { id: 'REJECTED', label: 'Rejected' },
  { id: 'PAUSED', label: 'Paused' },
];

const SAMPLE_VARIABLES: Record<string, string> = {
  leadName: 'Mr. Raj Sharma',
  leadTitle: 'Mr. Raj Sharma',
  companyName: 'QUIKBOOM Digital Marketing',
  customerName: 'Madhuban Hotel',
  agentName: 'Avinash',
  userName: 'Avinash',
  meetingDate: '25 September 2026',
  meetingTime: '11:30 AM',
  dealValue: '₹1,50,000',
  proposalUrl: 'https://quikboom.com/proposal/QB-9821',
  serviceName: 'SEO & Performance Marketing',
  1: 'Mr. Raj Sharma',
  2: 'QUIKBOOM Digital Marketing',
  3: '25 September 2026',
  4: '11:30 AM',
};

const POPULAR_VARIABLES = [
  { key: 'leadName', label: '{{leadName}}', desc: 'Lead / Client Name' },
  { key: 'companyName', label: '{{companyName}}', desc: 'Agency / Customer Name' },
  { key: 'agentName', label: '{{agentName}}', desc: 'Assigned Sales Agent' },
  { key: 'meetingDate', label: '{{meetingDate}}', desc: 'Scheduled Visit / Meeting Date' },
  { key: 'meetingTime', label: '{{meetingTime}}', desc: 'Scheduled Visit Time' },
  { key: 'dealValue', label: '{{dealValue}}', desc: 'Deal / Quotation Amount' },
  { key: 'serviceName', label: '{{serviceName}}', desc: 'Interested Service' },
];

export default function TemplatesMetaPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  // Filters
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedMetaStatus, setSelectedMetaStatus] = useState('ALL');
  const [selectedLocalStatus, setSelectedLocalStatus] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Drawers
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isTestSendModalOpen, setIsTestSendModalOpen] = useState(false);

  // Selected item
  const [selectedTemplate, setSelectedTemplate] = useState<MetaTemplate | null>(null);
  const [templateToDelete, setTemplateToDelete] = useState<MetaTemplate | null>(null);
  const [selectedTemplateForTest, setSelectedTemplateForTest] = useState<MetaTemplate | null>(null);

  // Test Send State
  const [testRecipientPhone, setTestRecipientPhone] = useState((user as any)?.phone || '');
  const [testVariables, setTestVariables] = useState<Record<string, string>>({});
  const [isSendingTest, setIsSendingTest] = useState(false);

  // Form State
  const [formData, setFormData] = useState<MetaTemplateFormValues>({
    id: 0,
    name: '',
    displayName: '',
    category: 'UTILITY',
    language: 'en_US',
    headerType: 'NONE',
    headerContent: '',
    bodyText: '',
    footerText: '',
    buttons: [] as any[],
    variables: [] as string[],
    isActive: true,
  });

  // Query templates
  const {
    data: templates = [],
    isLoading,
    isRefetching,
    isError,
    error,
    refetch,
  } = useQuery<MetaTemplate[]>({
    queryKey: ['meta-templates', selectedCategory, selectedMetaStatus, selectedLocalStatus, searchQuery],
    queryFn: async () => {
      const cleanParams: Record<string, string> = {};
      if (selectedCategory && selectedCategory !== 'ALL' && selectedCategory !== 'undefined') {
        cleanParams.category = selectedCategory.trim();
      }
      if (selectedMetaStatus && selectedMetaStatus !== 'ALL' && selectedMetaStatus !== 'undefined') {
        cleanParams.status = selectedMetaStatus.trim();
      }
      if (selectedLocalStatus === 'ACTIVE') {
        cleanParams.isLocalActive = 'true';
      } else if (selectedLocalStatus === 'INACTIVE') {
        cleanParams.isLocalActive = 'false';
      }
      if (searchQuery && searchQuery.trim() && searchQuery.trim() !== 'undefined') {
        cleanParams.search = searchQuery.trim();
      }

      const res: any = await api.get('/templates/meta', {
        params: Object.keys(cleanParams).length > 0 ? cleanParams : undefined,
      });
      const rawList = res?.data?.items || res?.items || res?.data?.data || res?.data || res;
      if (!Array.isArray(rawList)) return [];

      return rawList.map((tpl: any) => ({
        ...tpl,
        displayName: tpl.displayName || tpl.name,
        metaStatus: tpl.metaStatus || tpl.status || 'APPROVED',
        status: tpl.status || tpl.metaStatus || 'APPROVED',
        bodyText: tpl.bodyText || tpl.body || '',
        body: tpl.body || tpl.bodyText || '',
        footerText: tpl.footerText || tpl.footer || '',
        footer: tpl.footer || tpl.footerText || '',
        isActive: tpl.isActive !== undefined ? Boolean(tpl.isActive) : Boolean(tpl.isLocalActive),
        isLocalActive: tpl.isLocalActive !== undefined ? Boolean(tpl.isLocalActive) : Boolean(tpl.isActive),
      }));
    },
    retry: (failureCount, err: any) => {
      const status = err?.response?.status;
      if (status && status >= 400 && status < 500) return false;
      return failureCount < 2;
    },
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });

  const templateErrorStatus = (error as any)?.response?.status;
  const templateErrorMessage =
    (error as any)?.response?.data?.message ||
    (error as any)?.message ||
    'Failed to fetch Meta WhatsApp templates';

  const handleResetFilters = () => {
    setSelectedCategory('ALL');
    setSelectedMetaStatus('ALL');
    setSelectedLocalStatus('ALL');
    setSearchQuery('');
  };

  // Query statistics with loop prevention and safe debug logging
  const {
    data: statsData,
    isError: isStatsError,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ['meta-templates-stats'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/templates/meta/stats');
        const data = res?.data || res || { total: 0, active: 0, approved: 0, pending: 0, rejected: 0 };
        console.log('[META TEMPLATE STATS DEBUG]', {
          URL: '/templates/meta/stats',
          QueryParams: 'none',
          TenantCustomerId: user?.customerId ?? 'auto-from-auth',
          HttpStatus: 200,
          Response: data,
        });
        return data;
      } catch (err: any) {
        console.error('[META TEMPLATE STATS DEBUG]', {
          URL: '/templates/meta/stats',
          QueryParams: 'none',
          TenantCustomerId: user?.customerId ?? 'auto-from-auth',
          HttpStatus: err?.response?.status || 'network-error',
          Response: err?.response?.data || err?.message,
        });
        throw err;
      }
    },
    retry: (failureCount, error: any) => {
      const status = error?.response?.status;
      if (status && status >= 400 && status < 500) return false;
      return failureCount < 2;
    },
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const stats = statsData || { total: 0, active: 0, approved: 0, pending: 0, rejected: 0 };



  // Sync from Meta mutation
  const syncFromMetaMutation = useMutation({
    mutationFn: async () => {
      return api.post('/templates/meta/sync-meta');
    },
    onSuccess: (res: any) => {
      const data = res?.data || res;
      toast.success(
        data?.message || `Successfully synced ${data?.count ?? 0} templates from Meta WhatsApp Business!`
      );
      queryClient.invalidateQueries({ queryKey: ['meta-templates'] });
      queryClient.invalidateQueries({ queryKey: ['meta-templates-stats'] });
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to sync templates from Meta. Please check your WhatsApp Business credentials in Settings → Integrations.';
      toast.error(msg, { duration: 5000 });
    },
  });

  // Toggle active status
  const toggleMutation = useMutation({
    mutationFn: async (id: number) => {
      return api.patch(`/templates/meta/${id}/toggle`);
    },
    onSuccess: () => {
      toast.success('Meta template status toggled');
      queryClient.invalidateQueries({ queryKey: ['meta-templates'] });
      queryClient.invalidateQueries({ queryKey: ['meta-templates-stats'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to toggle status');
    },
  });

/**
 * Maps local UI form values to the strict backend CreateMetaTemplateDto contract.
 * Strips UI-only properties (displayName, bodyText, footerText, isActive) and maps:
 * - displayName / name -> name
 * - bodyText -> body
 * - footerText -> footer
 * - isActive -> isLocalActive
 */
function mapFormToCreatePayload(data: MetaTemplateFormValues): CreateMetaTemplatePayload {
  const templateName = (data.name || data.displayName || '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')
    .replace(/[^a-z0-9_]/g, '');

  const payload: CreateMetaTemplatePayload = {
    name: (data.displayName?.trim() || data.name?.trim() || ''),
    templateName,
    body: data.bodyText.trim(),
    category: data.category,
    language: data.language,
    headerType: data.headerType || 'NONE',
    isLocalActive: data.isActive,
  };

  if (data.headerContent?.trim()) {
    payload.headerContent = data.headerContent.trim();
  }
  if (data.footerText?.trim()) {
    payload.footer = data.footerText.trim();
  }
  if (data.buttons && data.buttons.length > 0) {
    payload.buttons = data.buttons;
  }
  if (data.variables && data.variables.length > 0) {
    payload.variables = data.variables;
  }

  return payload;
}

/**
 * Maps local UI form values to the strict backend UpdateMetaTemplateDto contract.
 * Strips UI-only properties (displayName, bodyText, footerText, isActive) and maps:
 * - displayName / name -> name
 * - bodyText -> body
 * - footerText -> footer
 * - isActive -> isLocalActive
 */
function mapFormToUpdatePayload(data: MetaTemplateFormValues): UpdateMetaTemplatePayload {
  const templateName = (data.name || data.displayName || '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')
    .replace(/[^a-z0-9_]/g, '');

  const payload: UpdateMetaTemplatePayload = {
    name: (data.displayName?.trim() || data.name?.trim() || undefined),
    templateName: templateName || undefined,
    body: data.bodyText !== undefined ? data.bodyText.trim() : undefined,
    category: data.category || undefined,
    language: data.language || undefined,
    headerType: data.headerType || undefined,
    isLocalActive: data.isActive,
  };

  if (data.headerContent !== undefined) {
    payload.headerContent = data.headerContent.trim() || undefined;
  }
  if (data.footerText !== undefined) {
    payload.footer = data.footerText.trim() || undefined;
  }
  if (data.buttons !== undefined) {
    payload.buttons = data.buttons.length > 0 ? data.buttons : undefined;
  }
  if (data.variables !== undefined) {
    payload.variables = data.variables;
  }

  return payload;
}

  // Save template (Create / Update)
  const saveMutation = useMutation({
    mutationFn: async (data: MetaTemplateFormValues) => {
      if (data.id && data.id > 0) {
        const payload = mapFormToUpdatePayload(data);
        console.log('[TEMPLATE_API_DEBUG]', {
          method: 'PUT',
          url: `/templates/meta/${data.id}`,
          payloadKeys: Object.keys(payload),
        });
        return api.put(`/templates/meta/${data.id}`, payload);
      } else {
        const payload = mapFormToCreatePayload(data);
        console.log('[TEMPLATE_API_DEBUG]', {
          method: 'POST',
          url: '/templates/meta',
          payloadKeys: Object.keys(payload),
        });
        return api.post('/templates/meta', payload);
      }
    },
    onSuccess: () => {
      toast.success(formData.id > 0 ? 'Meta template updated' : 'Meta template registered');
      setIsEditModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['meta-templates'] });
      queryClient.invalidateQueries({ queryKey: ['meta-templates-stats'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to save template');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return api.delete(`/templates/meta/${id}`);
    },
    onSuccess: () => {
      toast.success('Meta template deleted successfully');
      setIsDeleteModalOpen(false);
      setTemplateToDelete(null);
      queryClient.invalidateQueries({ queryKey: ['meta-templates'] });
      queryClient.invalidateQueries({ queryKey: ['meta-templates-stats'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to delete template');
    },
  });

  // Open Create
  const handleOpenCreate = () => {
    setSelectedTemplate(null);
    setFormData({
      id: 0,
      name: '',
      displayName: '',
      category: 'UTILITY',
      language: 'en_US',
      headerType: 'NONE',
      headerContent: '',
      bodyText:
        'Hello {{leadName}},\n\nThank you for reaching out to {{companyName}}! Our team has received your inquiry and our consultant {{agentName}} will connect with you shortly.\n\nBest regards,\n{{companyName}}',
      footerText: 'Reply STOP to unsubscribe',
      buttons: [],
      variables: ['leadName', 'companyName', 'agentName'],
      isActive: true,
    });
    setIsEditModalOpen(true);
  };

  // Open Edit
  const handleOpenEdit = (t: MetaTemplate) => {
    setSelectedTemplate(t);
    setFormData({
      id: t.id,
      name: t.name,
      displayName: t.displayName || t.name,
      category: t.category || 'UTILITY',
      language: t.language || 'en_US',
      headerType: t.headerType || 'NONE',
      headerContent: t.headerContent || '',
      bodyText: t.bodyText,
      footerText: t.footerText || '',
      buttons: Array.isArray(t.buttons) ? t.buttons : [],
      variables: t.variables || [],
      isActive: t.isActive,
    });
    setIsEditModalOpen(true);
  };

  // Open Preview
  const handleOpenPreview = (t: MetaTemplate) => {
    setSelectedTemplate(t);
    setIsPreviewModalOpen(true);
  };

  // Open View Details
  const handleOpenView = (t: MetaTemplate) => {
    setSelectedTemplate(t);
    setIsViewModalOpen(true);
  };

  // Open Delete
  const handleConfirmDelete = (t: MetaTemplate) => {
    setTemplateToDelete(t);
    setIsDeleteModalOpen(true);
  };

  // Open Test Send Modal
  const handleOpenTestSend = (t: MetaTemplate) => {
    setSelectedTemplateForTest(t);
    const text = `${t.headerContent || ''} ${t.bodyText || ''}`;
    const matches = text.match(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g);
    const initialVars: Record<string, string> = {};
    if (matches) {
      let idx = 1;
      for (const m of matches) {
        const v = m.replace(/[\{\}\s]/g, '');
        if (!initialVars[v]) {
          initialVars[v] =
            t.sampleValues?.[v] ||
            SAMPLE_VARIABLES[v] ||
            SAMPLE_VARIABLES[String(idx)] ||
            (v === '1' ? 'Mr. Raj Sharma' : v === '2' ? 'QUIKBOOM' : `Sample ${v}`);
          idx++;
        }
      }
    }
    setTestVariables(initialVars);
    if (!testRecipientPhone && (user as any)?.phone) {
      setTestRecipientPhone((user as any).phone);
    }
    setIsTestSendModalOpen(true);
  };

  // Dynamically detected variables in exact order of appearance in body & header
  const detectedTestVariables = useMemo(() => {
    if (!selectedTemplateForTest) return [];
    const text = `${selectedTemplateForTest.headerContent || ''} ${selectedTemplateForTest.bodyText || ''}`;
    const matches = text.match(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g);
    if (!matches) return [];
    const ordered: string[] = [];
    const seen = new Set<string>();
    for (const m of matches) {
      const v = m.replace(/[\{\}\s]/g, '');
      if (!seen.has(v)) {
        seen.add(v);
        ordered.push(v);
      }
    }
    return ordered;
  }, [selectedTemplateForTest]);

  // Live body preview rendered with test variables
  const renderedLiveBodyPreview = useMemo(() => {
    if (!selectedTemplateForTest) return '';
    let preview = selectedTemplateForTest.bodyText || '';
    for (const v of detectedTestVariables) {
      const val = testVariables[v] !== undefined && testVariables[v] !== '' ? testVariables[v] : `{{${v}}}`;
      const reg = new RegExp(`\\{\\{\\s*${v}\\s*\\}\\}`, 'gi');
      preview = preview.replace(reg, val);
    }
    return preview;
  }, [selectedTemplateForTest, detectedTestVariables, testVariables]);

  // Execute Test Send
  const handleSendTestWhatsApp = async () => {
    if (!testRecipientPhone.trim()) {
      toast.error('Please enter a recipient WhatsApp number');
      return;
    }
    if (!selectedTemplateForTest) return;

    if (selectedTemplateForTest.metaStatus !== 'APPROVED') {
      toast.error(
        `This WhatsApp template is currently "${selectedTemplateForTest.metaStatus}" on Meta and cannot be tested. Only APPROVED templates can be sent.`,
      );
      return;
    }

    setIsSendingTest(true);
    try {
      const res: any = await api.post('/templates/meta/test-send', {
        templateId: selectedTemplateForTest.id,
        templateName: selectedTemplateForTest.name,
        language: selectedTemplateForTest.language,
        to: testRecipientPhone.trim(),
        variables: testVariables,
      });

      const messageId = res?.messageId || res?.data?.messageId;
      toast.success(
        res?.message ||
        res?.data?.message ||
        `✓ Test WhatsApp message sent successfully${messageId ? ` (${messageId})` : ''}!`,
      );
      setIsTestSendModalOpen(false);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to send test WhatsApp message';
      toast.error(msg);
    } finally {
      setIsSendingTest(false);
    }
  };

  // Insert variable into Body
  const handleInsertVariable = (varName: string) => {
    const token = `{{${varName}}}`;
    setFormData((prev) => ({
      ...prev,
      bodyText: prev.bodyText + (prev.bodyText.endsWith(' ') || prev.bodyText.endsWith('\n') ? '' : ' ') + token,
      variables: prev.variables.includes(varName) ? prev.variables : [...prev.variables, varName],
    }));
    toast.success(`Inserted ${token}`);
  };

  // Helper to interpolate WhatsApp text with sample values
  const interpolateSampleText = (text: string) => {
    if (!text) return '';
    return text.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (match, v) => {
      return SAMPLE_VARIABLES[v] || `[${v}]`;
    });
  };

  // Badge renderers
  const renderMetaStatusBadge = (status: string) => {
    const s = (status || '').toUpperCase();
    if (s === 'APPROVED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> APPROVED
        </span>
      );
    }
    if (s === 'PENDING' || s === 'IN_REVIEW') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-200">
          <Clock className="w-3 h-3 text-amber-600" /> IN REVIEW
        </span>
      );
    }
    if (s === 'REJECTED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-200">
          <XCircle className="w-3 h-3 text-rose-600" /> REJECTED
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-slate-100 text-slate-600 border border-slate-200">
        {s || 'LOCAL'}
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-16 text-slate-800 animate-in fade-in duration-200">
      {/* Header */}
      <AdminPageHeader
        title="Meta / WhatsApp Templates"
        description="Manage WhatsApp Business message templates synchronized with Meta Cloud API. Automatically dispatched as leads advance through your CRM pipeline."
        icon={MessageSquare}
        iconColor="text-[#25D366]"
        badge={{
          text: 'META CLOUD API',
          icon: MessageSquare,
          variant: 'emerald',
        }}
        breadcrumbs={[
          { label: 'Templates', href: '/templates/email' },
          { label: 'Meta Templates' },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <AdminButton
              variant="outline"
              size="md"
              icon={RefreshCw}
              loading={syncFromMetaMutation.isPending}
              onClick={() => syncFromMetaMutation.mutate()}
              title="Pull latest approved templates directly from Meta WhatsApp Business Account"
            >
              {syncFromMetaMutation.isPending ? 'Syncing...' : 'Sync from Meta'}
            </AdminButton>

            <AdminButton
              variant="outline"
              size="md"
              icon={RefreshCw}
              loading={isRefetching}
              onClick={() => refetch()}
              title="Refresh Templates"
            >
              Refresh
            </AdminButton>

            <AdminButton
              variant="primary"
              size="md"
              icon={Plus}
              onClick={handleOpenCreate}
            >
              Create Meta Template
            </AdminButton>
          </div>
        }
      />


      {/* Error state if templates list endpoint fails */}
      {isError && (
        <div
          className={`p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-semibold border ${
            templateErrorStatus === 401
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : templateErrorStatus === 403
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : templateErrorStatus === 400
              ? 'bg-orange-50 border-orange-200 text-orange-900'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <AlertTriangle
              className={`w-5 h-5 shrink-0 ${
                templateErrorStatus === 401
                  ? 'text-amber-600'
                  : templateErrorStatus === 403
                  ? 'text-rose-600'
                  : templateErrorStatus === 400
                  ? 'text-orange-600'
                  : 'text-rose-600'
              }`}
            />
            <div>
              <span className="font-extrabold block">
                {templateErrorStatus === 401 && 'Authentication Error (401): Session expired or invalid authentication token'}
                {templateErrorStatus === 403 && 'Access Denied (403): Insufficient permissions to view Meta Templates'}
                {templateErrorStatus === 400 && 'Bad Request (400): Invalid template query parameters'}
                {(!templateErrorStatus || templateErrorStatus >= 500) && 'Server Error: Failed to retrieve Meta WhatsApp templates'}
              </span>
              <span className="font-medium opacity-90">
                {Array.isArray(templateErrorMessage) ? templateErrorMessage.join(', ') : String(templateErrorMessage)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {templateErrorStatus === 401 && (
              <button
                onClick={() => {
                  window.location.href = '/login';
                }}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold cursor-pointer transition-all shadow-xs"
              >
                Log In Again
              </button>
            )}
            {templateErrorStatus === 400 && (
              <button
                onClick={handleResetFilters}
                className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold cursor-pointer transition-all shadow-xs"
              >
                Reset Filters
              </button>
            )}
            <button
              onClick={() => refetch()}
              className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl font-bold cursor-pointer transition-all shadow-2xs"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Error state if stats endpoint fails */}
      {isStatsError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Unable to load Meta template statistics. Please verify backend connection.</span>
          </div>
          <button
            onClick={() => refetchStats()}
            className="px-3 py-1.5 bg-white hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold cursor-pointer transition-all"
          >
            Retry
          </button>
        </div>
      )}

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Templates</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{stats.total}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold">
            <Layers className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Local Active</p>
            <p className="text-2xl font-black text-emerald-700 mt-1">{stats.active}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Meta Approved</p>
            <p className="text-2xl font-black text-emerald-700 mt-1">{stats.approved}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-[#25D366]/10 text-[#25D366] flex items-center justify-center font-bold">
            <CheckCheck className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">In Review</p>
            <p className="text-2xl font-black text-amber-600 mt-1">{stats.pending}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between col-span-2 sm:col-span-1">
          <div>
            <p className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">Rejected</p>
            <p className="text-2xl font-black text-rose-600 mt-1">{stats.rejected}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <XCircle className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Meta API Credential Info Banner */}
      <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <MessageSquare className="w-4 h-4 text-[#25D366]" />
          </div>
          <div>
            <span className="font-extrabold text-slate-900 block">
              Meta WhatsApp Business Connection
            </span>
            <span className="text-slate-600 font-medium">
              Templates sync with Meta WABA via configured WhatsApp credentials. Need to update Phone ID or Meta Access Token?
            </span>
          </div>
        </div>
        <Link
          href="/settings"
          className="inline-flex items-center gap-1 font-bold text-emerald-700 hover:text-emerald-800 bg-white px-3 py-1.5 rounded-xl border border-emerald-200 shadow-2xs hover:shadow-xs transition-all shrink-0"
        >
          <span>Open Settings → Integrations</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search template name, body text..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Category */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedCategory === c.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Meta Status */}
          <select
            value={selectedMetaStatus}
            onChange={(e) => setSelectedMetaStatus(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            {META_STATUSES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>

          {/* Local Active Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setSelectedLocalStatus(st)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedLocalStatus === st
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st === 'ALL' ? 'All' : st === 'ACTIVE' ? 'Active' : 'Inactive'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Templates Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider font-bold">
              <tr>
                <th className="py-3.5 px-4">Template Name</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Language</th>
                <th className="py-3.5 px-4 text-center">Meta Status</th>
                <th className="py-3.5 px-4 text-center">Local Status</th>
                <th className="py-3.5 px-4">Message Snippet</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#25D366]" />
                    Loading Meta WhatsApp templates...
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <div className="max-w-md mx-auto space-y-2">
                      <AlertTriangle className="w-8 h-8 mx-auto text-rose-500 mb-1" />
                      <p className="font-bold text-slate-900 text-sm">
                        {templateErrorStatus === 401 && 'Session Expired (401)'}
                        {templateErrorStatus === 403 && 'Access Restricted (403)'}
                        {templateErrorStatus === 400 && 'Bad Request (400)'}
                        {(!templateErrorStatus || templateErrorStatus >= 500) && 'Unable to Load Meta Templates'}
                      </p>
                      <p className="text-xs text-slate-500 font-medium leading-relaxed">
                        {Array.isArray(templateErrorMessage) ? templateErrorMessage.join(', ') : String(templateErrorMessage)}
                      </p>
                      <div className="pt-2 flex items-center justify-center gap-2">
                        {templateErrorStatus === 401 ? (
                          <button
                            onClick={() => (window.location.href = '/login')}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs cursor-pointer transition-all shadow-xs"
                          >
                            Sign In Again
                          </button>
                        ) : templateErrorStatus === 400 ? (
                          <button
                            onClick={handleResetFilters}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs cursor-pointer transition-all shadow-xs"
                          >
                            Reset Filters
                          </button>
                        ) : (
                          <button
                            onClick={() => refetch()}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs cursor-pointer transition-all shadow-xs"
                          >
                            Retry Request
                          </button>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : templates.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    No Meta templates found. Click <strong>Sync from Meta</strong> or <strong>Create Meta Template</strong>.
                  </td>
                </tr>
              ) : (
                templates.map((tpl) => (
                  <tr key={tpl.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Template Name & Display */}
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-900">{tpl.displayName || tpl.name}</span>
                        {tpl.isSystem && (
                          <span
                            title="System Managed Stage Template"
                            className="p-1 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-wider"
                          >
                            CRM
                          </span>
                        )}
                      </div>
                      <p className="font-mono text-[11px] text-slate-400 font-semibold mt-0.5">
                        {tpl.name}
                      </p>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[11px]">
                        {tpl.category}
                      </span>
                    </td>

                    {/* Language */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 font-mono text-[11px] text-slate-600 font-semibold">
                        <Globe className="w-3 h-3 text-slate-400" /> {tpl.language}
                      </span>
                    </td>

                    {/* Meta Status */}
                    <td className="py-3.5 px-4 text-center">
                      {renderMetaStatusBadge(tpl.metaStatus)}
                    </td>

                    {/* Local Status Toggle */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => toggleMutation.mutate(tpl.id)}
                        disabled={toggleMutation.isPending}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black cursor-pointer transition-all ${
                          tpl.isActive
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200 border border-slate-200'
                        }`}
                        title="Click to toggle Local Active/Inactive"
                      >
                        {tpl.isActive ? (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
                          </>
                        ) : (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" /> Inactive
                          </>
                        )}
                      </button>
                    </td>

                    {/* Message Snippet */}
                    <td className="py-3.5 px-4 text-slate-600 max-w-xs font-medium">
                      <p className="line-clamp-2 text-[11px] leading-relaxed">
                        {tpl.bodyText}
                      </p>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        {/* WhatsApp Preview Drawer */}
                        <button
                          onClick={() => handleOpenPreview(tpl)}
                          className="p-1.5 rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors cursor-pointer"
                          title="Interactive WhatsApp Bubble Preview"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* View Details */}
                        <button
                          onClick={() => handleOpenView(tpl)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                          title="View Details"
                        >
                          <Info className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => handleOpenEdit(tpl)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                          title="Edit Template"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Test WhatsApp Template */}
                        <button
                          onClick={() => handleOpenTestSend(tpl)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                          title="Send Test WhatsApp Message"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete */}
                        {!tpl.isSystem && (
                          <button
                            onClick={() => handleConfirmDelete(tpl)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Delete Template"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= INTERACTIVE WHATSAPP PREVIEW MODAL ================= */}
      {isPreviewModalOpen && selectedTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-[#25D366]/10 text-[#25D366]">
                  <MessageSquare className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-black text-slate-900">WhatsApp Message Preview</h3>
                  <p className="text-[11px] text-slate-400">Live render with lead variables injected</p>
                </div>
              </div>
              <button
                onClick={() => setIsPreviewModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* WhatsApp App Mockup Container */}
            <div className="flex-1 overflow-y-auto p-4 bg-slate-100/80">
              {/* WhatsApp Phone Chat Frame */}
              <div className="rounded-2xl overflow-hidden shadow-lg border border-slate-300/80 bg-[#EFEAE2]">
                {/* Chat Top Bar */}
                <div className="bg-[#075E54] text-white px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#128C7E] flex items-center justify-center text-xs font-black border border-white/30">
                      QB
                    </div>
                    <div>
                      <h4 className="text-xs font-black tracking-tight leading-tight">QUIKBOOM Agency</h4>
                      <p className="text-[10px] text-emerald-200 leading-tight">Official Business Account</p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold">
                    WhatsApp
                  </span>
                </div>

                {/* Chat Body */}
                <div className="p-4 space-y-3 min-h-[300px] flex flex-col justify-end">
                  {/* WhatsApp Message Bubble */}
                  <div className="max-w-[92%] ml-auto bg-[#D9FDD3] rounded-2xl rounded-tr-xs p-3.5 shadow-xs border border-emerald-200/50 space-y-2">
                    {/* Optional Header */}
                    {selectedTemplate.headerType !== 'NONE' && selectedTemplate.headerContent && (
                      <div className="font-black text-xs text-slate-900 border-b border-emerald-300/40 pb-1.5">
                        {interpolateSampleText(selectedTemplate.headerContent)}
                      </div>
                    )}

                    {/* Body Text */}
                    <div className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed font-sans font-normal">
                      {interpolateSampleText(selectedTemplate.bodyText)}
                    </div>

                    {/* Footer text */}
                    {selectedTemplate.footerText && (
                      <div className="text-[10px] text-slate-500 font-medium italic pt-1">
                        {selectedTemplate.footerText}
                      </div>
                    )}

                    {/* Timestamp & double checks */}
                    <div className="flex items-center justify-end gap-1 text-[10px] text-slate-500 pt-0.5">
                      <span>11:30 AM</span>
                      <CheckCheck className="w-3.5 h-3.5 text-blue-500 inline" />
                    </div>
                  </div>

                  {/* Buttons (if any) */}
                  {Array.isArray(selectedTemplate.buttons) && selectedTemplate.buttons.length > 0 && (
                    <div className="space-y-1 max-w-[92%] ml-auto w-full">
                      {selectedTemplate.buttons.map((btn: any, idx: number) => (
                        <div
                          key={idx}
                          className="bg-white hover:bg-slate-50 text-[#00A884] font-bold text-center py-2 px-3 rounded-xl shadow-xs text-xs border border-slate-200 flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Send className="w-3 h-3 text-[#00A884]" />
                          <span>{btn.text || btn.label || 'Quick Action'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Sample Variables Injected */}
              <div className="mt-4 bg-white p-3.5 rounded-2xl border border-slate-200 text-xs space-y-2">
                <span className="font-bold text-slate-700 block text-[11px] uppercase tracking-wider">
                  Sample Variables Injected
                </span>
                <div className="grid grid-cols-2 gap-1.5 font-mono text-[10px] text-slate-600">
                  <div>leadName = Mr. Raj Sharma</div>
                  <div>companyName = QUIKBOOM</div>
                  <div>agentName = Avinash</div>
                  <div>meetingDate = 25 Sep 2026</div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-3.5 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50">
              <button
                onClick={() => setIsPreviewModalOpen(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl cursor-pointer"
              >
                Close Preview
              </button>
              <button
                onClick={() => {
                  setIsPreviewModalOpen(false);
                  if (selectedTemplate) handleOpenTestSend(selectedTemplate);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl cursor-pointer transition-all shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                Send Test
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= VIEW DETAILS MODAL ================= */}
      {isViewModalOpen && selectedTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-slate-100 text-slate-700">
                  <Info className="w-4 h-4" />
                </span>
                <h3 className="text-base font-black text-slate-900">Meta Template Details</h3>
              </div>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 overflow-y-auto space-y-3.5 text-xs flex-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400 font-bold block mb-0.5">Template Name</span>
                  <span className="font-bold text-slate-900 text-sm">{selectedTemplate.displayName || selectedTemplate.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block mb-0.5">Meta Key / ID</span>
                  <span className="font-mono font-bold text-emerald-700">{selectedTemplate.name}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <span className="text-slate-400 font-bold block mb-0.5">Category</span>
                  <span className="font-bold text-slate-800">{selectedTemplate.category}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block mb-0.5">Language</span>
                  <span className="font-mono font-bold text-slate-800">{selectedTemplate.language}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block mb-0.5">Meta Status</span>
                  <div>{renderMetaStatusBadge(selectedTemplate.metaStatus)}</div>
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-bold block mb-1">Body Text</span>
                <pre className="p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px] whitespace-pre-wrap text-slate-700">
                  {selectedTemplate.bodyText}
                </pre>
              </div>

              {selectedTemplate.footerText && (
                <div>
                  <span className="text-slate-400 font-bold block mb-0.5">Footer</span>
                  <span className="text-slate-700">{selectedTemplate.footerText}</span>
                </div>
              )}

              {selectedTemplate.variables && selectedTemplate.variables.length > 0 && (
                <div>
                  <span className="text-slate-400 font-bold block mb-1">Mapped Variables</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedTemplate.variables.map((v) => (
                      <span
                        key={v}
                        className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md font-mono text-[10px] font-bold"
                      >
                        {`{{${v}}}`}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setIsViewModalOpen(false);
                  handleOpenTestSend(selectedTemplate);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl cursor-pointer transition-all shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                Send Test
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= CREATE / EDIT MODAL ================= */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  {formData.id > 0 ? 'Edit Meta WhatsApp Template' : 'Create Meta WhatsApp Template'}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {formData.id > 0
                    ? `Update template "${formData.displayName || formData.name}"`
                    : 'Register a WhatsApp message template compliant with Meta Cloud API guidelines.'}
                </p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="py-4 overflow-y-auto space-y-4 flex-1 pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Meta Template Name (lowercase snake_case) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Meta Template Identifier <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
                      })
                    }
                    placeholder="e.g. lead_contacted_v1"
                    className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Lowercase letters, numbers, and underscores only.
                  </p>
                </div>

                {/* Display Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Display Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    placeholder="e.g. Lead Contacted Confirmation"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Category */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="UTILITY">Utility</option>
                    <option value="MARKETING">Marketing</option>
                    <option value="AUTHENTICATION">Authentication</option>
                  </select>
                </div>

                {/* Language */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Language</label>
                  <select
                    value={formData.language}
                    onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="en_US">English (US) - en_US</option>
                    <option value="en">English - en</option>
                    <option value="hi">Hindi - hi</option>
                    <option value="mr">Marathi - mr</option>
                  </select>
                </div>

                {/* Status Toggle */}
                <div className="flex items-center gap-3 pt-6">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                  <span className="text-xs font-bold text-slate-700">
                    {formData.isActive ? 'Local Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              {/* Quick CRM Variable Inserters */}
              <div className="p-3 bg-emerald-50/60 border border-emerald-200/80 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Code2 className="w-3.5 h-3.5 text-emerald-600" /> Insert CRM Variables
                  </span>
                  <span className="text-[10px] text-slate-500">Click to append placeholder</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_VARIABLES.map((v) => (
                    <button
                      key={v.key}
                      type="button"
                      onClick={() => handleInsertVariable(v.key)}
                      title={v.desc}
                      className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-700 border border-slate-200 hover:border-emerald-300 rounded-lg text-xs font-mono font-bold transition-all shadow-2xs active:scale-95 cursor-pointer"
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Body Text */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Message Body Text <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={6}
                  value={formData.bodyText}
                  onChange={(e) => setFormData({ ...formData, bodyText: e.target.value })}
                  placeholder="Enter WhatsApp message text. Use {{leadName}}, {{companyName}}, etc."
                  className="w-full p-3 text-xs font-sans border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 leading-relaxed font-medium"
                />
              </div>

              {/* Footer Text */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Footer Text (Optional)
                </label>
                <input
                  type="text"
                  value={formData.footerText}
                  onChange={(e) => setFormData({ ...formData, footerText: e.target.value })}
                  placeholder="e.g. Reply STOP to opt out"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => saveMutation.mutate(formData)}
                disabled={saveMutation.isPending || !formData.name.trim() || !formData.bodyText.trim()}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1AA14D] hover:bg-[#168940] text-white rounded-xl text-xs font-black shadow-sm transition-all disabled:opacity-50 cursor-pointer"
              >
                {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {formData.id > 0 ? 'Save Changes' : 'Create Template'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= DELETE CONFIRMATION MODAL ================= */}
      {isDeleteModalOpen && templateToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-base font-black text-slate-900 text-center mb-1">
              Delete Meta Template?
            </h3>
            <p className="text-xs text-slate-500 text-center mb-6">
              Are you sure you want to delete <strong>{templateToDelete.displayName || templateToDelete.name}</strong>? Templates actively configured on CRM lead pipeline stages cannot be deleted.
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setTemplateToDelete(null);
                }}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(templateToDelete.id)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 text-xs font-black text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ================= TEST SEND MODAL ================= */}
      {isTestSendModalOpen && selectedTemplateForTest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <WhatsAppIcon className="w-4 h-4" />
                </span>
                <h3 className="text-base font-black text-slate-900">Send Test WhatsApp Message</h3>
              </div>
              <button
                onClick={() => {
                  setIsTestSendModalOpen(false);
                  setTestVariables({});
                }}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="py-4 space-y-3 text-xs overflow-y-auto pr-1">
              <p className="text-slate-600 font-medium">
                Dispatches a live test WhatsApp message using the selected Meta/WhatsApp template.
              </p>

              {/* Status Warning if not APPROVED */}
              {selectedTemplateForTest.metaStatus !== 'APPROVED' && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <p className="text-xs font-semibold">
                    This template is not approved and cannot be tested.
                  </p>
                </div>
              )}

              {/* Recipient WhatsApp Phone Number */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Recipient WhatsApp Number
                </label>
                <input
                  type="tel"
                  required
                  value={testRecipientPhone}
                  onChange={(e) => setTestRecipientPhone(e.target.value)}
                  placeholder="+91 98200 10000"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium font-mono"
                />
              </div>

              {/* Dynamic Variables Section (Only if template contains variables) */}
              {detectedTestVariables.length > 0 && (
                <div className="space-y-2 pt-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Template Variables
                  </label>
                  <div className="space-y-2">
                    {detectedTestVariables.map((varKey) => (
                      <div key={varKey}>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          Variable {`{{${varKey}}}`}
                        </label>
                        <input
                          type="text"
                          value={testVariables[varKey] ?? ''}
                          onChange={(e) =>
                            setTestVariables((prev) => ({
                              ...prev,
                              [varKey]: e.target.value,
                            }))
                          }
                          placeholder={`Value for {{${varKey}}}`}
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Compact Message Preview (Only when variables are present) */}
              {detectedTestVariables.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Message Preview
                  </label>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 whitespace-pre-wrap leading-relaxed font-medium">
                    {renderedLiveBodyPreview}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsTestSendModalOpen(false);
                  setTestVariables({});
                }}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendTestWhatsApp}
                disabled={
                  isSendingTest ||
                  !testRecipientPhone.trim() ||
                  selectedTemplateForTest.metaStatus !== 'APPROVED'
                }
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {isSendingTest ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                {isSendingTest ? 'Sending...' : 'Send Test'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

