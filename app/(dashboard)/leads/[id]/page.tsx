'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Edit,
  Building,
  Mail,
  Phone,
  DollarSign,
  Calendar,
  MapPin,
  Tag,
  Globe,
  Star,
  CheckCircle2,
  Clock,
  Send,
  UserCheck,
  Award,
  Layers,
  Trash2,
  AlertCircle,
  ExternalLink,
  MessageSquare,
  Plus,
  RefreshCw,
  Loader2,
  X,
  Share2,
  Compass,
  Navigation,
  Instagram,
  Facebook,
  Linkedin,
  Youtube,
  Twitter,
  Eye,
} from 'lucide-react';
import api from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { AdminPageHeader, AdminButton, AdminFormDrawer, LeadStageEmailDrawer, WhatsAppIcon } from '@/components/admin';

const TikTokIcon = ({ className = 'w-3.5 h-3.5' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 2.89 3.5 2.75 1.57-.04 2.89-1.2 3.12-2.74.07-.5.08-1.01.08-1.51V.02z" />
  </svg>
);
import { SendEmailModal } from '@/components/admin/dialogs/SendEmailModal';
import { getErrorMessage } from '@/lib/utils';

function getStageConfigFromApi(
  lead: { stageId?: number | string | null; status?: string | null; stage?: any | null },
  apiStages: any[]
): { label: string; color?: string; bgColor: string; borderColor: string } {
  // 1. Try to match by stageId
  if (lead.stageId && apiStages.length > 0) {
    const found = apiStages.find((s: any) => String(s.id) === String(lead.stageId));
    if (found) {
      return {
        label: found.name || found.label || 'Stage',
        color: found.color,
        bgColor: found.bgColor || '#F1F5F9',
        borderColor: found.borderColor || '#E2E8F0',
      };
    }
  }
  // 2. Try to match by nested stage relation
  if (lead.stage && (lead.stage.name || lead.stage.label)) {
    return {
      label: lead.stage.name || lead.stage.label || 'Stage',
      color: lead.stage.color,
      bgColor: lead.stage.bgColor || '#F1F5F9',
      borderColor: lead.stage.borderColor || '#E2E8F0',
    };
  }
  // 3. Match by status key in apiStages
  if (lead.status && apiStages.length > 0) {
    const foundByKey = apiStages.find((s: any) => s.key === lead.status);
    if (foundByKey) {
      return {
        label: foundByKey.name || foundByKey.label || foundByKey.key,
        color: foundByKey.color,
        bgColor: foundByKey.bgColor || '#F1F5F9',
        borderColor: foundByKey.borderColor || '#E2E8F0',
      };
    }
  }
  // 4. Generic fallback
  return {
    label: lead.status || 'Unknown',
    bgColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  };
}

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = (params?.id as string) || '';

  const [activeTab, setActiveTab] = useState<'TIMELINE' | 'NOTES' | 'FOLLOW_UPS' | 'VISITS'>('TIMELINE');
  const [newNote, setNewNote] = useState('');
  const [isFollowUpOpen, setIsFollowUpOpen] = useState(false);
  const [isConvertOpen, setIsConvertOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isSendingDetails, setIsSendingDetails] = useState(false);

  // Lead Stage Email / Communication Drawer state
  const [stageEmailDrawerState, setStageEmailDrawerState] = useState<{
    isOpen: boolean;
    lead: any;
    previousStageName?: string;
    newStage?: any;
    initialChannel?: 'EMAIL' | 'WHATSAPP';
    isDirectSend?: boolean;
  } | null>(null);

  // Follow-up form
  const [followUpOutcome, setFollowUpOutcome] = useState('Interested');
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpTime, setFollowUpTime] = useState('11:00');
  const [followUpNotes, setFollowUpNotes] = useState('');

  // Conversion form
  const [convertCompanyName, setConvertCompanyName] = useState('');
  const [convertDealTitle, setConvertDealTitle] = useState('');
  const [convertDealValue, setConvertDealValue] = useState('150000');
  const [convertNotes, setConvertNotes] = useState('');

  // Schedule Field Visit form
  const [isScheduleVisitOpen, setIsScheduleVisitOpen] = useState(false);
  const [visitPurpose, setVisitPurpose] = useState('Product Demo & Architecture Review');
  const [visitLocation, setVisitLocation] = useState('');
  const [visitDate, setVisitDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [visitTime, setVisitTime] = useState('11:00 AM');
  const [visitNotes, setVisitNotes] = useState('');
  const [visitEmployeeId, setVisitEmployeeId] = useState<number | string>('');

  // Social Media state
  const [isSocialModalOpen, setIsSocialModalOpen] = useState(false);
  const [socialForm, setSocialForm] = useState({
    instagram: '',
    facebook: '',
    linkedin: '',
    youtube: '',
    twitter: '',
    tiktok: '',
    pinterest: '',
    website: '',
  });

  const openSocialModal = () => {
    const social = (lead?.socialMedia && typeof lead.socialMedia === 'object') ? lead.socialMedia : {};
    setSocialForm({
      instagram: social.instagram || lead?.instagram || '',
      facebook: social.facebook || lead?.facebook || '',
      linkedin: social.linkedin || lead?.linkedin || '',
      youtube: social.youtube || lead?.youtube || '',
      twitter: social.twitter || social.x || lead?.twitter || '',
      tiktok: social.tiktok || lead?.tiktok || '',
      pinterest: social.pinterest || lead?.pinterest || '',
      website: lead?.website || social.website || '',
    });
    setIsSocialModalOpen(true);
  };

  // Fetch Full Lead Details
  const { data: lead, isLoading, isError, refetch } = useQuery({
    queryKey: ['lead-detail', id],
    queryFn: async () => {
      const res: any = await api.get(`/leads/${id}`);
      return res?.data || res;
    },
    enabled: Boolean(id),
  });

function isDetailsSendStage(lead: any): boolean {
  if (!lead) return false;
  const stageKey = String(lead.stage?.key || lead.stageKey || lead.status || '').toUpperCase().replace(/[\s-]+/g, '_');
  const stageName = String(lead.stage?.name || lead.stageName || '').toUpperCase().trim();
  return (
    stageKey === 'DETAILS_SENT' ||
    stageKey === 'DETAILS_SEND' ||
    stageKey === 'DETAIL_SENT' ||
    stageKey === 'DETAIL_SEND' ||
    stageName === 'DETAILS SENT' ||
    stageName === 'DETAILS SEND' ||
    stageName === 'DETAIL SENT' ||
    stageName === 'DETAIL SEND' ||
    stageName.includes('DETAILS SEND') ||
    stageName.includes('DETAILS SENT')
  );
}

  const handleSendLeadDetails = async () => {
    const email = lead?.email?.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      toast.error('This lead does not have an email address configured. Please add an email address first.');
      return;
    }
    if (!emailRegex.test(email)) {
      toast.error(`Invalid email address "${email}". Please update with a valid email address.`);
      return;
    }

    setIsSendingDetails(true);
    try {
      const res: any = await api.post(`/leads/${id}/send-details`);
      const data = res?.data || res;
      if (data?.success) {
        toast.success(data?.message || `Lead details sent successfully to ${email}!`);
        refetch();
      } else {
        toast.error(data?.message || 'Failed to send lead details');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to send lead details via SMTP';
      toast.error(msg);
    } finally {
      setIsSendingDetails(false);
    }
  };

  // Fetch active stages from Stage Management API
  const {
    data: stagesData,
    isLoading: isLoadingStages,
    isError: isStagesError,
    refetch: refetchStages,
  } = useQuery({
    queryKey: ['lead-stages'],
    queryFn: async () => {
      const res: any = await api.get('/leads/stages?includeInactive=false');
      return Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
    },
    retry: 1,
  });

  const allStages = React.useMemo(() => {
    if (!Array.isArray(stagesData)) return [];
    return [...stagesData].sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }, [stagesData]);

  // Update Status / Stage Mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({
      stageId,
      status,
      notes,
      sendEmail,
      templateId,
      customSubject,
      customBody,
      sendWhatsapp,
      whatsappMessage,
      whatsappTemplateName,
    }: {
      stageId?: number;
      status?: string;
      notes?: string;
      sendEmail?: boolean;
      templateId?: number;
      customSubject?: string;
      customBody?: string;
      sendWhatsapp?: boolean;
      whatsappMessage?: string;
      whatsappTemplateName?: string;
    }) => {
      return api.patch(`/leads/${id}/status`, {
        stageId,
        status,
        notes,
        sendEmail,
        templateId,
        customSubject,
        customBody,
        sendWhatsapp,
        whatsappMessage,
        whatsappTemplateName,
      });
    },
    onSuccess: (res: any) => {
      const emailNotif = res?.data?.emailNotification || res?.emailNotification;
      const whatsappNotif = res?.data?.whatsappNotification || res?.whatsappNotification;

      const emailSent = Boolean(emailNotif?.sent);
      const whatsappSent = Boolean(whatsappNotif?.sent);
      const emailFailed = Boolean(emailNotif && emailNotif.sent === false && emailNotif.status === 'FAILED');
      const whatsappFailed = Boolean(whatsappNotif && whatsappNotif.sent === false && whatsappNotif.status === 'FAILED');

      if (emailSent && whatsappSent) {
        toast.success('Lead stage updated! Customer email & WhatsApp message sent.');
      } else if (emailSent && whatsappFailed) {
        toast.success(`Lead stage updated! Customer email sent (WhatsApp failed: ${whatsappNotif.error || 'Check WhatsApp configuration'}).`);
      } else if (whatsappSent && emailFailed) {
        toast.success(`Lead stage updated! WhatsApp message sent (Email failed: ${emailNotif.error || 'Check SMTP configuration'}).`);
      } else if (emailSent) {
        toast.success(`Lead stage updated! Customer email sent to ${emailNotif.recipient || 'customer'}.`);
      } else if (whatsappSent) {
        toast.success(`Lead stage updated! WhatsApp message sent to ${whatsappNotif.recipient || 'customer'}.`);
      } else if (emailFailed && whatsappFailed) {
        toast.error('Lead stage updated, but email & WhatsApp dispatches failed.');
      } else if (emailFailed) {
        toast.error(`Lead stage updated, but customer email failed: ${emailNotif.error || 'Check SMTP configuration'}.`);
      } else if (whatsappFailed) {
        toast.error(`Lead stage updated, but WhatsApp message failed: ${whatsappNotif.message || whatsappNotif.error || 'Check WhatsApp configuration'}.`);
      } else {
        toast.success('Lead stage updated successfully.');
      }
      queryClient.invalidateQueries({ queryKey: ['lead-detail', id] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  // Update Social Media Mutation
  const updateSocialMutation = useMutation({
    mutationFn: async () => {
      const trimmedWebsite = socialForm.website.trim();
      return api.patch(`/leads/${id}`, {
        socialMedia: {
          instagram: socialForm.instagram.trim(),
          facebook: socialForm.facebook.trim(),
          linkedin: socialForm.linkedin.trim(),
          youtube: socialForm.youtube.trim(),
          twitter: socialForm.twitter.trim(),
          tiktok: socialForm.tiktok.trim(),
          pinterest: socialForm.pinterest.trim(),
          website: trimmedWebsite,
        },
        ...(trimmedWebsite ? { website: trimmedWebsite } : {}),
      });
    },
    onSuccess: () => {
      toast.success('Social media channels updated!');
      setIsSocialModalOpen(false);
      refetch();
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err));
    },
  });

  const normalizeSocialLink = (platform: string, rawVal: string): string => {
    if (!rawVal) return '#';
    const val = rawVal.trim();
    if (val.startsWith('http://') || val.startsWith('https://')) return val;
    const clean = val.replace(/^@/, '');
    switch (platform) {
      case 'instagram': return `https://instagram.com/${clean}`;
      case 'facebook': return `https://facebook.com/${clean}`;
      case 'linkedin': return clean.includes('/') ? `https://linkedin.com/${clean}` : `https://linkedin.com/in/${clean}`;
      case 'youtube': return `https://youtube.com/@${clean}`;
      case 'twitter':
      case 'x': return `https://x.com/${clean}`;
      case 'tiktok': return `https://tiktok.com/@${clean}`;
      case 'pinterest': return `https://pinterest.com/${clean}`;
      case 'website':
      default: return `https://${clean}`;
    }
  };

  // Add Note Mutation
  const addNoteMutation = useMutation({
    mutationFn: async (content: string) => {
      return api.post(`/leads/${id}/notes`, { content });
    },
    onSuccess: () => {
      toast.success('Note added successfully');
      setNewNote('');
      queryClient.invalidateQueries({ queryKey: ['lead-detail', id] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  // Log Follow-up Mutation
  const followUpMutation = useMutation({
    mutationFn: async () => {
      return api.post(`/leads/${id}/follow-ups`, {
        outcome: followUpOutcome,
        notes: followUpNotes || undefined,
        nextFollowUpDate: followUpDate ? new Date(followUpDate) : undefined,
        nextFollowUpTime: followUpTime || undefined,
      });
    },
    onSuccess: () => {
      toast.success('Follow-up recorded successfully');
      setIsFollowUpOpen(false);
      queryClient.invalidateQueries({ queryKey: ['lead-detail', id] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  // Convert Lead Mutation
  const convertMutation = useMutation({
    mutationFn: async () => {
      return api.post(`/leads/${id}/convert`, {
        companyName: convertCompanyName.trim() || lead?.companyName || lead?.title,
        dealTitle: convertDealTitle.trim() || `${lead?.companyName || lead?.title} - Enterprise Deal`,
        dealValue: convertDealValue ? parseFloat(convertDealValue) : (lead?.value || 0),
        notes: convertNotes.trim() || undefined,
      });
    },
    onSuccess: (res: any) => {
      const msg = res?.data?.message || res?.message || 'Lead converted successfully!';
      toast.success(typeof msg === 'string' ? msg : 'Lead converted.');
      setIsConvertOpen(false);
      queryClient.invalidateQueries({ queryKey: ['lead-detail', id] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      return api.delete(`/leads/${id}`);
    },
    onSuccess: () => {
      toast.success('Lead deleted');
      router.push('/leads');
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  // Fetch Employees for visitor assignment
  const { data: employeesData } = useQuery({
    queryKey: ['admin-employees-dropdown'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/employees');
        return Array.isArray(res?.data) ? res.data : Array.isArray(res?.items) ? res.items : Array.isArray(res) ? res : [];
      } catch {
        return [];
      }
    },
  });
  const employees: any[] = Array.isArray(employeesData) ? employeesData : [];

  // Only Visitor / Field employees for Schedule Visit assignment
  const visitorEmployees: any[] = useMemo(() => {
    return employees.filter((emp: any) => {
      const desigName = (emp.designation?.name || emp.designationName || '').toUpperCase();
      const desigCode = (emp.designation?.code || emp.designationCode || '').toUpperCase();
      const desigId = emp.designationId || emp.designation?.id;
      const roleName = (emp.role?.name || emp.role || '').toString().toUpperCase();
      const roleTypeName = (emp.roleType || '').toString().toUpperCase();
      return (
        desigId === 11 ||
        desigName.includes('VISIT') ||
        desigName.includes('FIELD') ||
        desigName.includes('VISITOR') ||
        desigCode.includes('VISIT') ||
        desigCode.includes('FIELD') ||
        roleName.includes('VISITOR') ||
        roleName.includes('VISIT') ||
        roleTypeName.includes('VISITOR') ||
        roleTypeName.includes('VISIT')
      );
    });
  }, [employees]);

  // Schedule Field Visit Mutation
  const scheduleVisitMutation = useMutation({
    mutationFn: async () => {
      const targetEmpId = visitEmployeeId
        ? Number(visitEmployeeId)
        : (lead?.employeeId ? Number(lead.employeeId) : (visitorEmployees[0]?.id ? Number(visitorEmployees[0].id) : undefined));

      if (!targetEmpId) {
        throw new Error('Please select a visitor/field employee to assign the visit');
      }

      return api.post(`/leads/${id}/visits`, {
        action: 'SCHEDULE',
        purpose: visitPurpose.trim() || 'Product Demo & Architecture Review',
        location: visitLocation.trim() || lead?.address || lead?.city || 'Client Site',
        date: visitDate,
        time: visitTime,
        notes: visitNotes.trim() || undefined,
        employeeId: targetEmpId,
      });
    },
    onSuccess: () => {
      toast.success('Field Visit Scheduled Successfully!');
      queryClient.invalidateQueries({ queryKey: ['lead-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['visits'] });
      setIsScheduleVisitOpen(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to schedule field visit.');
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto py-24 text-center">
        <div className="w-10 h-10 border-4 border-[#23C45E] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-500 font-bold text-sm">Loading lead profile...</p>
      </div>
    );
  }

  if (isError || !lead) {
    return (
      <div className="max-w-xl mx-auto py-24 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-black text-slate-900">Lead Record Not Found</h2>
        <p className="text-xs text-slate-500">The requested CRM lead does not exist or has been deleted.</p>
        <Link
          href="/leads"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-2xl text-xs font-black"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Leads
        </Link>
      </div>
    );
  }

  const name = `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || 'Direct Prospect';
  const company = lead.companyName || lead.title || 'Client Company';
  const isConverted = lead.status === 'CONVERTED' || lead.status === 'WON';

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-16 text-slate-800 animate-in fade-in-50 duration-200">
      {/* Top Header */}
      <AdminPageHeader
        title={company}
        description={`Contact: ${name}${lead.city || lead.location ? ` • ${lead.city || lead.location}, ${lead.state || lead.country || ''}` : ''}`}
        icon={Building}
        iconColor="text-emerald-600"
        badge={{
          text: `Lead #${lead.id} • ${lead.stage?.name || lead.status}`,
          icon: Building,
          variant: isConverted ? 'emerald' : 'slate',
        }}
        breadcrumbs={[
          { label: 'CRM', href: '/crm' },
          { label: 'Leads', href: '/leads' },
          { label: company || `Lead #${lead.id}` },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            {isDetailsSendStage(lead) && (
              <AdminButton
                variant="outline"
                size="md"
                icon={Mail}
                onClick={handleSendLeadDetails}
                disabled={isSendingDetails}
              >
                {isSendingDetails ? 'Sending...' : 'Send Details'}
              </AdminButton>
            )}

            <AdminButton
              variant="outline"
              size="md"
              icon={Clock}
              onClick={() => {
                setFollowUpOutcome('Interested');
                setFollowUpDate('');
                setFollowUpTime('11:00');
                setFollowUpNotes('');
                setIsFollowUpOpen(true);
              }}
            >
              Log Follow-up
            </AdminButton>

            <AdminButton
              variant="outline"
              size="md"
              icon={Calendar}
              onClick={() => {
                setVisitPurpose('Product Demo & Architecture Review');
                setVisitLocation(lead?.address || lead?.city || 'Client Site');
                setVisitEmployeeId(lead?.employeeId || (employees[0]?.id ?? ''));
                setIsScheduleVisitOpen(true);
              }}
            >
              Schedule Field Visit
            </AdminButton>

            {!isConverted && (
              <AdminButton
                variant="primary"
                size="md"
                icon={CheckCircle2}
                onClick={() => {
                  setConvertCompanyName(company);
                  setConvertDealTitle(`${company} - Enterprise Deal`);
                  setConvertDealValue(String(lead.value || 150000));
                  setConvertNotes('Lead qualified and converted from admin profile.');
                  setIsConvertOpen(true);
                }}
              >
                Convert to Customer
              </AdminButton>
            )}

            <AdminButton
              variant="danger"
              size="md"
              icon={Trash2}
              onClick={() => {
                if (confirm(`Are you sure you want to delete lead "${company}"?`)) {
                  deleteMutation.mutate();
                }
              }}
            >
              Delete
            </AdminButton>
          </div>
        }
      />

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-400">Deal Value</span>
          <p className="text-xl font-black text-slate-900">₹{Number(lead.value || 0).toLocaleString('en-IN')}</p>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-400">Priority Level</span>
          <p className="text-xl font-black text-slate-900">{lead.priority || 'MEDIUM'}</p>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-400">Lead Source</span>
          <p className="text-xl font-black text-slate-900">{lead.source || 'WEBSITE'}</p>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-400">Created From</span>
          <div className="mt-1">
            {lead.createdFrom === 'MOBILE_APP' ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-extrabold bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
                <span>📱</span>
                <span>Mobile App</span>
              </span>
            ) : lead.createdFrom === 'ADMIN_PANEL' ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-extrabold bg-purple-50 text-purple-700 border border-purple-200 shadow-2xs">
                <span>🖥</span>
                <span>Admin Panel</span>
              </span>
            ) : (
              <span className="text-xl font-black text-slate-400">—</span>
            )}
          </div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-400">Assigned Rep</span>
          <p className="text-sm font-black text-slate-900 truncate">
            {lead.assignedTo ? `${lead.assignedTo.firstName} ${lead.assignedTo.lastName}` : 'Unassigned'}
          </p>
        </div>
      </div>

      {/* Dynamic Lifecycle Pipeline Progress Bar — 100% from Stage Management API */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between text-xs font-black text-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-sm font-black">Lifecycle Pipeline Stage</span>
            {isDetailsSendStage(lead) && (
              <button
                type="button"
                onClick={handleSendLeadDetails}
                disabled={isSendingDetails}
                className="p-1 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-all cursor-pointer border border-blue-200/80 shadow-2xs active:scale-95 disabled:opacity-50 inline-flex items-center justify-center"
                title="Send Details"
                aria-label="Send Details"
              >
                {isSendingDetails ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                ) : (
                  <Mail className="w-3.5 h-3.5 text-blue-600" />
                )}
              </button>
            )}
          </div>
          <span className="text-xs font-bold text-slate-500">
            {(() => {
              if (isLoadingStages) return 'Loading stages...';
              if (isStagesError) return 'Error loading stages';
              if (!allStages.length) return '—';
              const currentIdx = allStages.findIndex((s: any) =>
                (lead.stageId && String(s.id) === String(lead.stageId)) ||
                (!lead.stageId && s.key === lead.status)
              );
              return currentIdx >= 0
                ? `Stage ${currentIdx + 1} of ${allStages.length}`
                : `— of ${allStages.length}`;
            })()}
          </span>
        </div>

        {/* Loading State Skeleton */}
        {isLoadingStages && (
          <div className="flex items-center gap-2 py-3 overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex-1 space-y-1.5 animate-pulse">
                <div className="h-2 bg-slate-200 rounded-full" />
                <div className="h-2.5 w-12 bg-slate-200 rounded mx-auto" />
              </div>
            ))}
          </div>
        )}

        {/* Error State with Retry */}
        {isStagesError && (
          <div className="flex items-center justify-between p-3 bg-rose-50 rounded-2xl border border-rose-200 text-xs">
            <span className="text-rose-700 font-bold">Failed to load stages from Stage Management.</span>
            <button
              type="button"
              onClick={() => refetchStages()}
              className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoadingStages && !isStagesError && allStages.length === 0 && (
          <div className="text-center py-3 text-xs text-slate-400 font-medium">
            No active pipeline stages configured in Stage Management.
          </div>
        )}

        {/* Dynamic Responsive Pipeline Display */}
        {!isLoadingStages && !isStagesError && allStages.length > 0 && (() => {
          const currentIdx = allStages.findIndex((s: any) =>
            (lead.stageId && String(s.id) === String(lead.stageId)) ||
            (!lead.stageId && s.key === lead.status)
          );

          return (
            <div className="overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin">
              <div className="flex items-start min-w-max gap-3 py-1">
                {allStages.map((st: any, idx: number) => {
                  const isCompleted = currentIdx >= 0 && idx < currentIdx;
                  const isCurrent = currentIdx >= 0 && idx === currentIdx;
                  const stageColor = st.color || '#23C45E';

                  return (
                    <div
                      key={st.id}
                      className="flex flex-col items-center min-w-[80px] sm:min-w-[92px] max-w-[110px] space-y-2"
                    >
                      {/* Progress Segment Bar */}
                      <div className="w-full flex items-center">
                        <div
                          className={`w-full h-2 rounded-full transition-all ${
                            isCurrent
                              ? 'ring-2 ring-offset-1'
                              : isCompleted
                              ? 'opacity-90'
                              : 'bg-slate-200'
                          }`}
                          style={{
                            backgroundColor: isCurrent || isCompleted ? stageColor : undefined,
                            boxShadow: isCurrent ? `0 0 0 2px ${stageColor}` : undefined,
                          }}
                        />
                      </div>

                      {/* Step Circle with Number or Check */}
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black transition-all border ${
                          isCurrent
                            ? 'text-white'
                            : isCompleted
                            ? 'border-transparent'
                            : 'bg-white border-slate-200 text-slate-400'
                        }`}
                        style={{
                          backgroundColor: isCurrent ? stageColor : isCompleted ? (st.bgColor || '#DCFCE7') : undefined,
                          borderColor: isCurrent ? stageColor : isCompleted ? (st.borderColor || stageColor) : undefined,
                          color: isCurrent ? '#FFFFFF' : isCompleted ? stageColor : undefined,
                        }}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <span>{idx + 1}</span>
                        )}
                      </div>

                      {/* Stage Name — Legible with 2-line wrap */}
                      <span
                        className={`text-[11px] text-center leading-tight line-clamp-2 ${
                          isCurrent ? 'font-black' : isCompleted ? 'font-bold' : 'font-medium'
                        }`}
                        style={{
                          color: isCurrent ? stageColor : isCompleted ? '#334155' : '#94A3B8',
                        }}
                        title={st.name || st.label}
                      >
                        {st.name || st.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* Stage Status Switcher Banner */}
        <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200/80 flex flex-wrap items-center justify-between gap-3 mt-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-emerald-800">
              Current Stage Status
            </p>
            {(() => {
              const conf = getStageConfigFromApi(lead, allStages);
              return (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border"
                    style={{
                      backgroundColor: conf.bgColor,
                      borderColor: conf.borderColor,
                      color: conf.color || '#334155',
                    }}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{conf.label}</span>
                  </span>
                </div>
              );
            })()}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={(() => {
                if (lead.stageId) {
                  const found = allStages.find((s: any) => String(s.id) === String(lead.stageId));
                  if (found) return String(found.id);
                  if (lead.stage?.id) return String(lead.stage.id);
                }
                const foundByKey = allStages.find((s: any) => s.key === lead.status);
                return foundByKey ? String(foundByKey.id) : '';
              })()}
              onChange={async (e) => {
                const selectedId = e.target.value;
                const matchedStage = allStages.find((s: any) => String(s.id) === String(selectedId));
                if (matchedStage) {
                  const currentStageId = lead.stageId ? String(lead.stageId) : lead.stage?.id ? String(lead.stage.id) : null;
                  if (currentStageId && String(currentStageId) === String(matchedStage.id)) return;

                  // If VISIT_SCHEDULED stage selected → open Schedule Visit modal instead of direct update
                  const stageKey = (matchedStage.key || '').toUpperCase().replace(/[\s-]+/g, '_');
                  const stageName = (matchedStage.name || '').toLowerCase();
                  const isVisitScheduledStage = stageKey === 'VISIT_SCHEDULED' || stageKey === 'VISIT' || stageName.includes('visit scheduled');
                  if (isVisitScheduledStage) {
                    setVisitPurpose('Product Demo & Architecture Review');
                    setVisitLocation(lead?.address || lead?.city || 'Client Site');
                    setVisitEmployeeId(lead?.employeeId || (employees[0]?.id ?? ''));
                    setIsScheduleVisitOpen(true);
                    // Reset dropdown to current value (visit modal handles stage change on confirm)
                    e.target.value = currentStageId || '';
                    return;
                  }

                  try {
                    await updateStatusMutation.mutateAsync({
                      stageId: Number(matchedStage.id),
                    });
                  } catch {
                    // Handled by mutation onError
                  }
                }
              }}
              disabled={updateStatusMutation.isPending || isLoadingStages}
              className="px-3 py-1.5 bg-white border border-emerald-300 rounded-xl text-xs font-bold text-slate-900 shadow-xs focus:ring-2 focus:ring-[#23C45E] disabled:opacity-50 cursor-pointer"
            >
              {isLoadingStages && (
                <option value="" disabled>Loading stages...</option>
              )}
              {isStagesError && (
                <option value="" disabled>Failed to load stages</option>
              )}
              {!isLoadingStages && !isStagesError && allStages.length === 0 && (
                <option value="" disabled>No stages configured</option>
              )}
              {lead.stageId && !allStages.some((s: any) => String(s.id) === String(lead.stageId)) && (
                <option value={String(lead.stageId)} disabled>
                  {lead.stage?.name || lead.status || 'Current Stage'} (Inactive)
                </option>
              )}
              {allStages.map((st: any) => (
                <option key={st.id} value={String(st.id)}>
                  {st.name || st.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Business & Contact Information */}
        <div className="lg:col-span-1 space-y-6">
          {/* Contact Details Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-[#23C45E]" /> Contact Information
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] font-bold uppercase block">Full Name</span>
                <p className="font-extrabold text-slate-900 text-sm mt-0.5">{name}</p>
              </div>

              {lead.phone && (
                <div>
                  <span className="text-slate-400 text-[10px] font-bold uppercase block">Phone</span>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <a
                      href={`tel:${lead.phone}`}
                      className="font-bold text-slate-800 hover:text-[#1AA14D] flex items-center gap-1.5 truncate"
                    >
                      <Phone className="w-3.5 h-3.5 text-[#23C45E] shrink-0" /> {lead.phone}
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        setStageEmailDrawerState({
                          isOpen: true,
                          lead,
                          previousStageName: lead.stage?.name || lead.status || 'Current Stage',
                          newStage: lead.stage || { id: lead.stageId || 0, name: lead.status || 'Current Stage' },
                          initialChannel: 'WHATSAPP',
                          isDirectSend: true,
                        });
                      }}
                      className="p-1.5 hover:bg-emerald-50 text-emerald-600 hover:text-emerald-700 rounded-lg transition-colors cursor-pointer shrink-0"
                      title="Send WhatsApp Message"
                      aria-label="Send WhatsApp Message"
                    >
                      <WhatsAppIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {lead.email && (
                <div>
                  <span className="text-slate-400 text-[10px] font-bold uppercase block">Email</span>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5 truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {lead.email}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setStageEmailDrawerState({
                          isOpen: true,
                          lead,
                          previousStageName: lead.stage?.name || lead.status || 'Current Stage',
                          newStage: lead.stage || { id: lead.stageId || 0, name: lead.status || 'Current Stage' },
                          initialChannel: 'EMAIL',
                          isDirectSend: true,
                        });
                      }}
                      className="p-1.5 hover:bg-blue-50 text-blue-600 hover:text-blue-700 rounded-lg transition-colors cursor-pointer shrink-0"
                      title="Send Email"
                      aria-label="Send Email"
                    >
                      <Mail className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {lead.website && (
                <div>
                  <span className="text-slate-400 text-[10px] font-bold uppercase block">Website</span>
                  <a
                    href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold text-blue-600 hover:underline flex items-center gap-1.5 mt-0.5"
                  >
                    <Globe className="w-3.5 h-3.5 text-blue-500" /> {lead.website}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Source & Platform Information Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#23C45E]" /> Source Information
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[10px] font-bold uppercase">Source</span>
                <span className="font-extrabold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-[11px] uppercase">
                  {lead.source || 'WEBSITE'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[10px] font-bold uppercase">Created From</span>
                <div>
                  {lead.createdFrom === 'MOBILE_APP' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
                      <span>📱</span>
                      <span>Mobile App</span>
                    </span>
                  ) : lead.createdFrom === 'ADMIN_PANEL' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-purple-50 text-purple-700 border border-purple-200 shadow-2xs">
                      <span>🖥</span>
                      <span>Admin Panel</span>
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-slate-400">—</span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[10px] font-bold uppercase">Created By</span>
                <span className="font-bold text-slate-800">
                  {lead.createdBy
                    ? `${lead.createdBy.firstName || ''} ${lead.createdBy.lastName || ''}`.trim()
                    : lead.createdByName || '—'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[10px] font-bold uppercase">Assigned To</span>
                <span className="font-bold text-slate-800">
                  {lead.assignedTo
                    ? `${lead.assignedTo.firstName || ''} ${lead.assignedTo.lastName || ''}`.trim()
                    : 'Unassigned'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[10px] font-bold uppercase">Created At</span>
                <span className="font-medium text-slate-600">
                  {lead.createdAt ? new Date(lead.createdAt).toLocaleString() : '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Location & Geographic Coordinates Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" /> Location & Geographic Data
              </h3>
              <Link
                href={`/leads/${id}/edit`}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <Edit className="w-3 h-3" /> Edit
              </Link>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] font-bold uppercase block">Street Address</span>
                <p className="font-bold text-slate-800 mt-0.5">{lead.address || 'Address not specified'}</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400 text-[10px] font-bold uppercase block">City</span>
                  <p className="font-bold text-slate-800">{lead.city || lead.location || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] font-bold uppercase block">State / Country</span>
                  <p className="font-bold text-slate-800">{lead.state || 'N/A'}, {lead.country || 'India'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400 text-[10px] font-bold uppercase block">Pincode</span>
                  <p className="font-bold text-slate-800">{lead.pincode || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] font-bold uppercase block">GPS Coordinates</span>
                  <p className="font-mono text-[11px] text-slate-700">
                    {lead.latitude && lead.longitude
                      ? `${lead.latitude}, ${lead.longitude}`
                      : 'Not set'}
                  </p>
                </div>
              </div>

              {/* Open in Google Maps Action */}
              {((lead.latitude && lead.longitude) || lead.address || lead.city) ? (
                <div className="pt-1">
                  <a
                    href={
                      lead.latitude && lead.longitude
                        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lead.latitude},${lead.longitude}`)}`
                        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([lead.address, lead.city, lead.state, lead.pincode].filter(Boolean).join(', '))}`
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 transition"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    Open in Google Maps
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              ) : null}

              {lead.googlePlaceId && (
                <div className="p-3 bg-blue-50/80 rounded-2xl border border-blue-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-blue-900 uppercase">Google Place Verified</span>
                    {lead.rating && (
                      <span className="text-[11px] font-black text-amber-600 flex items-center gap-1">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {lead.rating}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] font-mono text-blue-800 truncate">{lead.googlePlaceId}</p>
                </div>
              )}
            </div>
          </div>

          {/* Social Media Channels Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <Share2 className="w-4 h-4 text-emerald-600" /> Social Media
              </h3>
              <button
                type="button"
                onClick={openSocialModal}
                className="text-[11px] font-bold text-emerald-600 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
              >
                <Edit className="w-3 h-3" /> Edit
              </button>
            </div>

            {(() => {
              const social = (lead.socialMedia && typeof lead.socialMedia === 'object') ? lead.socialMedia : {};
              const platforms = [
                { key: 'instagram', label: 'Instagram', val: social.instagram || lead.instagram, icon: Instagram, color: 'text-pink-600 bg-pink-50 border-pink-200' },
                { key: 'facebook', label: 'Facebook', val: social.facebook || lead.facebook, icon: Facebook, color: 'text-blue-600 bg-blue-50 border-blue-200' },
                { key: 'linkedin', label: 'LinkedIn', val: social.linkedin || lead.linkedin, icon: Linkedin, color: 'text-sky-600 bg-sky-50 border-sky-200' },
                { key: 'youtube', label: 'YouTube', val: social.youtube || lead.youtube, icon: Youtube, color: 'text-red-600 bg-red-50 border-red-200' },
                { key: 'twitter', label: 'X (Twitter)', val: social.twitter || social.x || lead.twitter, icon: Twitter, color: 'text-slate-800 bg-slate-100 border-slate-200' },
                { key: 'tiktok', label: 'TikTok', val: social.tiktok || lead.tiktok, icon: TikTokIcon, color: 'text-black bg-slate-100 border-slate-200' },
                { key: 'pinterest', label: 'Pinterest', val: social.pinterest || lead.pinterest, icon: Share2, color: 'text-red-600 bg-red-50 border-red-200' },
                { key: 'website', label: 'Website', val: lead.website || social.website, icon: Globe, color: 'text-teal-600 bg-teal-50 border-teal-200' },
              ].filter(p => Boolean(p.val && String(p.val).trim() !== '' && String(p.val).trim() !== 'N/A' && String(p.val).trim() !== 'null'));

              if (platforms.length === 0) {
                return (
                  <div className="p-4 rounded-2xl border border-dashed border-slate-200 text-center space-y-2">
                    <p className="text-xs font-bold text-slate-600">No social media details available</p>
                    <button
                      type="button"
                      onClick={openSocialModal}
                      className="px-3 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-bold inline-flex items-center gap-1 cursor-pointer transition"
                    >
                      <Plus className="w-3 h-3" /> Add Social Handles
                    </button>
                  </div>
                );
              }

              return (
                <div className="space-y-2">
                  {platforms.map((p) => {
                    const IconComponent = p.icon;
                    const targetUrl = normalizeSocialLink(p.key, p.val);
                    return (
                      <a
                        key={p.key}
                        href={targetUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 border border-slate-100 transition group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`p-1.5 rounded-xl border ${p.color}`}>
                            <IconComponent className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{p.label}</p>
                            <p className="text-xs font-bold text-slate-800 truncate group-hover:text-blue-600 transition">
                              {p.val}
                            </p>
                          </div>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition shrink-0 ml-2" />
                      </a>
                    );
                  })}
                </div>
              );
            })()}
          </div>

          {/* Customer Conversion Card if Converted */}
          {isConverted && (
            <div className="bg-emerald-50/80 p-6 rounded-3xl border border-emerald-200 shadow-xs space-y-3 text-emerald-950 text-xs">
              <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-2 text-[#1AA14D]">
                <CheckCircle2 className="w-4 h-4" /> Converted Customer Account
              </h3>
              <p className="text-[11px] text-emerald-900/80">
                This lead was successfully converted on{' '}
                <strong>{lead.convertedAt ? new Date(lead.convertedAt).toLocaleDateString() : 'recently'}</strong>.
              </p>
              {lead.convertedToCompanyId && (
                <Link
                  href={`/customers`}
                  className="inline-flex items-center gap-1.5 font-bold text-emerald-800 hover:text-emerald-950 underline"
                >
                  <span>View Customer Record</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Interactive Tabs (Timeline, Notes, Follow-ups, Visits) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tab Navigation Header */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-2 flex items-center gap-2 overflow-x-auto">
            {(
              [
                { key: 'TIMELINE', label: 'Activity Timeline', count: lead.timeline?.length || 0 },
                { key: 'NOTES', label: 'Internal Notes', count: lead.notes?.length || 0 },
                { key: 'FOLLOW_UPS', label: 'Status Audit', count: lead.statusHistory?.length || 0 },
                { key: 'VISITS', label: 'Field Visits', count: lead.visits?.length || 0 },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                  activeTab === tab.key
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                    activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* TAB 1: TIMELINE */}
          {activeTab === 'TIMELINE' && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                Full Lead Engagement History
              </h3>

              {lead.timeline && lead.timeline.length > 0 ? (
                <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {lead.timeline.map((item: any) => (
                    <div key={item.id} className="relative">
                      <div className="absolute -left-6 mt-1 w-4 h-4 rounded-full bg-[#23C45E] border-2 border-white shadow-xs" />
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-black text-slate-900 text-xs">{item.action}</span>
                          <span className="text-[10px] text-slate-400 font-bold">
                            {item.createdAt && !isNaN(new Date(item.createdAt).getTime()) ? new Date(item.createdAt).toLocaleString() : 'Recent'}
                          </span>
                        </div>
                        <p className="text-slate-600 font-medium">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-8 text-center font-bold">No timeline events recorded yet.</p>
              )}
            </div>
          )}

          {/* TAB 2: NOTES */}
          {activeTab === 'NOTES' && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
              {/* Add Note Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newNote.trim()) return;
                  addNoteMutation.mutate(newNote.trim());
                }}
                className="space-y-3"
              >
                <label className="text-xs font-black uppercase tracking-wider text-slate-800 block">
                  Add Internal Note
                </label>
                <textarea
                  rows={3}
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Record customer preferences, deal progress, or special instructions..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={addNoteMutation.isPending || !newNote.trim()}
                    className="px-5 py-2 bg-[#23C45E] hover:bg-[#1AA14D] text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{addNoteMutation.isPending ? 'Posting...' : 'Post Note'}</span>
                  </button>
                </div>
              </form>

              {/* Notes List */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                {lead.notes && lead.notes.length > 0 ? (
                  lead.notes.map((note: any) => (
                    <div key={note.id} className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">
                          {note.user ? `${note.user.firstName} ${note.user.lastName}` : 'CRM User'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold">
                          {note.createdAt && !isNaN(new Date(note.createdAt).getTime()) ? new Date(note.createdAt).toLocaleString() : 'Recent'}
                        </span>
                      </div>
                      <p className="text-slate-700 whitespace-pre-line leading-relaxed font-medium">{note.content}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 py-6 text-center font-bold">No internal notes added yet.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: STATUS AUDIT HISTORY */}
          {activeTab === 'FOLLOW_UPS' && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                Pipeline Stage Transition Log
              </h3>

              {lead.statusHistory && lead.statusHistory.length > 0 ? (
                <div className="space-y-3">
                  {lead.statusHistory.map((hist: any) => (
                    <div key={hist.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-slate-900">
                          {hist.fromStatus || 'START'} → {hist.toStatus}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold">
                          {hist.createdAt && !isNaN(new Date(hist.createdAt).getTime()) ? new Date(hist.createdAt).toLocaleString() : 'Recent'}
                        </span>
                      </div>
                      {hist.notes && <p className="text-slate-600 font-medium">{hist.notes}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-8 text-center font-bold">No stage transitions logged.</p>
              )}
            </div>
          )}

          {/* TAB 4: FIELD VISITS */}
          {activeTab === 'VISITS' && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                  Field Visits & Client Demonstrations
                </h3>
                <AdminButton
                  variant="outline"
                  size="sm"
                  icon={Calendar}
                  onClick={() => {
                    setVisitPurpose('Product Demo & Architecture Review');
                    setVisitLocation(lead?.address || lead?.city || 'Client Site');
                    setVisitEmployeeId(lead?.employeeId || (employees[0]?.id ?? ''));
                    setIsScheduleVisitOpen(true);
                  }}
                >
                  Schedule Field Visit
                </AdminButton>
              </div>

              {lead.visits && lead.visits.length > 0 ? (
                <div className="space-y-3">
                  {lead.visits.map((v: any) => {
                    const visitorName = v.completedBy ||
                      v.assignedEmployee ||
                      (v.employee ? `${v.employee.firstName || ''} ${v.employee.lastName || ''}`.trim() : null) ||
                      (lead as any).visitedByName ||
                      ((lead as any).visitedBy ? `${(lead as any).visitedBy.firstName || ''} ${(lead as any).visitedBy.lastName || ''}`.trim() : null) ||
                      (lead.employee ? `${lead.employee.firstName || ''} ${lead.employee.lastName || ''}`.trim() : null) ||
                      (lead as any).employeeName;
                    return (
                      <div key={v.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-black text-slate-900">{v.purpose || 'Client Visit'}</span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            {v.status || 'SCHEDULED'}
                          </span>
                        </div>
                        <p className="text-slate-600 font-medium">
                          Scheduled Date: {v.visitDate || v.date ? new Date(v.visitDate || v.date).toLocaleDateString() : 'N/A'} {v.time ? `• ${v.time}` : ''} {v.location ? `• ${v.location}` : ''}
                        </p>
                        {visitorName && (
                          <div className="flex items-center gap-1.5 pt-1 border-t border-slate-200/60">
                            <span className="text-[10px] font-black uppercase text-slate-400">
                              {v.status === 'COMPLETED' || lead.status === 'VISIT_DONE' ? 'Visited By:' : 'Field Officer:'}
                            </span>
                            <span className="text-xs font-bold text-blue-700">
                              {visitorName}
                            </span>
                          </div>
                        )}
                        {v.outcome && (
                          <p className="text-slate-600 text-[11px]">
                            <span className="font-bold text-slate-500">Outcome:</span> {v.outcome}
                          </p>
                        )}
                        {v.notes && (
                          <p className="text-slate-500 text-[11px] italic">
                            {v.notes}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-8 text-center font-bold">No field visits scheduled yet.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* FOLLOW-UP DRAWER */}
      <AdminFormDrawer
        isOpen={isFollowUpOpen}
        onClose={() => setIsFollowUpOpen(false)}
        title="Log Follow-up Outcome"
        subtitle={`Lead: ${company}`}
        size="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            followUpMutation.mutate();
          }}
          className="space-y-4"
        >
          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">Call Outcome *</label>
            <select
              value={followUpOutcome}
              onChange={(e) => setFollowUpOutcome(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
            >
              <option value="Interested">Interested in Demo</option>
              <option value="Call Later">Busy - Requested Call Later</option>
              <option value="Quotation Requested">Requested Proposal / Quotation</option>
              <option value="Negotiation">Commercial Negotiation</option>
              <option value="Not Interested">Not Interested</option>
              <option value="Wrong Number">Invalid Number</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Next Follow-up Date</label>
              <input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Time</label>
              <input
                type="time"
                value={followUpTime}
                onChange={(e) => setFollowUpTime(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">Interaction Notes</label>
            <textarea
              rows={3}
              value={followUpNotes}
              onChange={(e) => setFollowUpNotes(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsFollowUpOpen(false)}
              className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={followUpMutation.isPending}
              className="px-5 py-2 bg-[#23C45E] hover:bg-[#1AA14D] text-slate-950 font-black rounded-xl text-xs cursor-pointer"
            >
              {followUpMutation.isPending ? 'Saving...' : 'Save Follow-up'}
            </button>
          </div>
        </form>
      </AdminFormDrawer>

      {/* CONVERT TO CUSTOMER DRAWER */}
      <AdminFormDrawer
        isOpen={isConvertOpen}
        onClose={() => setIsConvertOpen(false)}
        title="Convert Lead to Customer Account"
        subtitle={`Creating Customer Company & Deal for ${company}`}
        size="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            convertMutation.mutate();
          }}
          className="space-y-4"
        >
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900">
            <p className="font-extrabold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#1AA14D]" /> Lead Qualification
            </p>
            <p className="mt-1 text-[11px]">
              This action will link a verified Customer Company record, create a primary Contact, and add a Deal into the active Sales Pipeline.
            </p>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">Company Account Name *</label>
            <input
              type="text"
              required
              value={convertCompanyName}
              onChange={(e) => setConvertCompanyName(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">Deal Title *</label>
            <input
              type="text"
              required
              value={convertDealTitle}
              onChange={(e) => setConvertDealTitle(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">Deal Value (₹) *</label>
            <input
              type="number"
              required
              value={convertDealValue}
              onChange={(e) => setConvertDealValue(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsConvertOpen(false)}
              className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={convertMutation.isPending}
              className="px-5 py-2 bg-[#23C45E] hover:bg-[#1AA14D] text-slate-950 font-black rounded-xl text-xs cursor-pointer shadow-md shadow-[#23C45E]/20"
            >
              {convertMutation.isPending ? 'Converting...' : 'Confirm Conversion'}
            </button>
          </div>
        </form>
      </AdminFormDrawer>

      <SendEmailModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        recipientEmail={lead.email || ''}
        recipientName={name}
        recordType="lead"
        recordId={lead.id}
        defaultSubject={`Following up: ${company}`}
        onSuccess={() => {
          refetch();
        }}
      />

      <LeadStageEmailDrawer
        isOpen={Boolean(stageEmailDrawerState?.isOpen)}
        onClose={() => setStageEmailDrawerState(null)}
        lead={stageEmailDrawerState?.lead || null}
        previousStageName={stageEmailDrawerState?.previousStageName || 'Current Stage'}
        newStage={stageEmailDrawerState?.newStage || null}
        initialChannel={stageEmailDrawerState?.initialChannel || 'EMAIL'}
        isDirectSend={Boolean(stageEmailDrawerState?.isDirectSend)}
        isSubmitting={updateStatusMutation.isPending}
        onConfirm={async ({
          sendEmail,
          templateId,
          customSubject,
          customBody,
          sendWhatsapp,
          whatsappMessage,
          whatsappTemplateName,
        }) => {
          if (!stageEmailDrawerState?.newStage) return;
          try {
            await updateStatusMutation.mutateAsync({
              stageId: Number(stageEmailDrawerState.newStage.id),
              sendEmail,
              templateId,
              customSubject,
              customBody,
              sendWhatsapp,
              whatsappMessage,
              whatsappTemplateName,
            });
            setStageEmailDrawerState(null);
          } catch {
            // error handled by mutation onError
          }
        }}
      />

      {/* EDIT SOCIAL MEDIA DRAWER */}
      <AdminFormDrawer
        isOpen={isSocialModalOpen}
        onClose={() => setIsSocialModalOpen(false)}
        title="Edit Social Media Channels"
        subtitle={`Configure public social links for ${company}`}
        size="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            updateSocialMutation.mutate();
          }}
          className="space-y-3"
        >
          <div>
            <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5 mb-1">
              <Instagram className="w-3.5 h-3.5 text-pink-600" /> Instagram Handle or URL
            </label>
            <input
              type="text"
              placeholder="https://instagram.com/business or @business"
              value={socialForm.instagram}
              onChange={(e) => setSocialForm({ ...socialForm, instagram: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5 mb-1">
              <Facebook className="w-3.5 h-3.5 text-blue-600" /> Facebook Page URL
            </label>
            <input
              type="text"
              placeholder="https://facebook.com/business"
              value={socialForm.facebook}
              onChange={(e) => setSocialForm({ ...socialForm, facebook: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5 mb-1">
              <Linkedin className="w-3.5 h-3.5 text-sky-600" /> LinkedIn Profile / Company
            </label>
            <input
              type="text"
              placeholder="https://linkedin.com/company/business"
              value={socialForm.linkedin}
              onChange={(e) => setSocialForm({ ...socialForm, linkedin: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5 mb-1">
              <Youtube className="w-3.5 h-3.5 text-red-600" /> YouTube Channel
            </label>
            <input
              type="text"
              placeholder="https://youtube.com/@channel"
              value={socialForm.youtube}
              onChange={(e) => setSocialForm({ ...socialForm, youtube: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5 mb-1">
              <Twitter className="w-3.5 h-3.5 text-slate-800" /> X (Twitter) Profile
            </label>
            <input
              type="text"
              placeholder="https://x.com/business or @business"
              value={socialForm.twitter}
              onChange={(e) => setSocialForm({ ...socialForm, twitter: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5 mb-1">
              <TikTokIcon className="w-3.5 h-3.5 text-slate-900" /> TikTok Profile
            </label>
            <input
              type="text"
              placeholder="https://tiktok.com/@profile or @profile"
              value={socialForm.tiktok}
              onChange={(e) => setSocialForm({ ...socialForm, tiktok: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5 mb-1">
              <Share2 className="w-3.5 h-3.5 text-red-600" /> Pinterest Profile
            </label>
            <input
              type="text"
              placeholder="https://pinterest.com/profile or username"
              value={socialForm.pinterest}
              onChange={(e) => setSocialForm({ ...socialForm, pinterest: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5 mb-1">
              <Globe className="w-3.5 h-3.5 text-teal-600" /> Website URL
            </label>
            <input
              type="text"
              placeholder="https://example.com"
              value={socialForm.website}
              onChange={(e) => setSocialForm({ ...socialForm, website: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900"
            />
          </div>

          <div className="pt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsSocialModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateSocialMutation.isPending}
              className="px-5 py-2 bg-[#23C45E] hover:bg-[#1AA14D] text-slate-950 font-black rounded-xl text-xs cursor-pointer shadow-md shadow-[#23C45E]/20 transition flex items-center gap-1.5"
            >
              {updateSocialMutation.isPending ? 'Saving...' : 'Save Handles'}
            </button>
          </div>
        </form>
      </AdminFormDrawer>

      {/* SCHEDULE FIELD VISIT DRAWER */}
      <AdminFormDrawer
        isOpen={isScheduleVisitOpen}
        onClose={() => setIsScheduleVisitOpen(false)}
        title="Schedule Field Visit"
        subtitle={`Lead: ${company}`}
        size="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            scheduleVisitMutation.mutate();
          }}
          className="space-y-4"
        >
          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">Visit Purpose *</label>
            <input
              type="text"
              required
              value={visitPurpose}
              onChange={(e) => setVisitPurpose(e.target.value)}
              placeholder="Product Demo & Architecture Review"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">Visit Location *</label>
            <input
              type="text"
              required
              value={visitLocation}
              onChange={(e) => setVisitLocation(e.target.value)}
              placeholder="e.g. Shankheshwar Parshwanath Mar"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Date</label>
              <input
                type="date"
                required
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Time</label>
              <input
                type="text"
                value={visitTime}
                onChange={(e) => setVisitTime(e.target.value)}
                placeholder="11:00 AM"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">Preparation Notes</label>
            <textarea
              rows={3}
              value={visitNotes}
              onChange={(e) => setVisitNotes(e.target.value)}
              placeholder="Key stakeholder names or presentation items"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 resize-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">Visitor / Employee Assignment *</label>
            <select
              required
              value={visitEmployeeId}
              onChange={(e) => setVisitEmployeeId(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
            >
              <option value="">Select Field Officer / Visitor</option>
              {visitorEmployees.length === 0 && (
                <option value="" disabled>No visitor/field employees found</option>
              )}
              {visitorEmployees.map((emp: any) => {
                const name = `${emp.firstName || ''} ${emp.lastName || ''}`.trim();
                const code = emp.employeeCode ? ` (${emp.employeeCode})` : '';
                const desig = emp.designation?.name ? ` — ${emp.designation.name}` : '';
                return (
                  <option key={emp.id} value={emp.id}>
                    {name || `Employee #${emp.id}`}{code}{desig}
                  </option>
                );
              })}
            </select>
            {visitorEmployees.length === 0 && (
              <p className="mt-1.5 text-[11px] text-amber-600 font-medium">
                No visitor or field officers found. Please assign "Visitor" or "Field Officer" designation in Employee Settings.
              </p>
            )}
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
            <AdminButton variant="outline" type="button" onClick={() => setIsScheduleVisitOpen(false)}>
              Cancel
            </AdminButton>
            <AdminButton type="submit" loading={scheduleVisitMutation.isPending}>
              CONFIRM VISIT SCHEDULE
            </AdminButton>
          </div>
        </form>
      </AdminFormDrawer>

    </div>
  );
}
