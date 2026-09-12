'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  Filter,
  Mail,
  Phone,
  Building,
  UserCheck,
  DollarSign,
  Calendar,
  Eye,
  Trash2,
  Edit,
  Globe,
  MapPin,
  Star,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Award,
  Layers,
  ArrowRight,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Users,
  ChevronRight,
  FileText,
  UserPlus,
  Check,
  X,
  Send,
  MessageSquare,
  History,
  User,
  Copy,
  Tag,
  AlertCircle,
} from 'lucide-react';
import api from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  AdminPageHero,
  AdminStatCard,
  AdminCard,
  AdminFormDrawer,
  AdminConfirmDialog,
  AdminSearchInput,
  AdminPagination,
} from '@/components/admin';
import { getErrorMessage } from '@/lib/utils';

type LeadTab =
  | 'ALL'
  | 'NEW'
  | 'FOLLOW_UP'
  | 'VISIT'
  | 'QUALIFIED'
  | 'PROPOSAL'
  | 'NEGOTIATION'
  | 'PAYMENT'
  | 'CONVERTED'
  | 'LOST';

export interface StageStatusConfig {
  label: string;
  bg: string;
  text: string;
  border: string;
  color?: string;
  stageIndex: number;
}

export type StageConfig = StageStatusConfig;

export interface LeadStage {
  id?: number | string;
  name?: string;
  label?: string;
  color?: string;
  bgColor?: string;
  borderColor?: string;
  sortOrder?: number;
}

const LEAD_STATUS_CONFIG: Record<string, StageStatusConfig> = {
  NEW: { label: 'New', bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', color: undefined, stageIndex: 0 },
  FOLLOW_UP: { label: 'Follow-up', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', color: undefined, stageIndex: 1 },
  CONTACTED: { label: 'Contacted', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', color: undefined, stageIndex: 1 },
  VISIT: { label: 'Visit', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', color: undefined, stageIndex: 2 },
  QUALIFIED: { label: 'Qualified', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', color: undefined, stageIndex: 3 },
  PROPOSAL: { label: 'Proposal', bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', color: undefined, stageIndex: 4 },
  PROPOSAL_SENT: { label: 'Proposal Sent', bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', color: undefined, stageIndex: 4 },
  FINAL_CALL: { label: 'Final Call', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', color: undefined, stageIndex: 5 },
  NEGOTIATION: { label: 'Negotiation', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', color: undefined, stageIndex: 5 },
  PAYMENT: { label: 'Payment', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', color: undefined, stageIndex: 6 },
  WORK_STARTED: { label: 'Work Started', bg: 'bg-emerald-100', text: 'text-[#1AA14D]', border: 'border-emerald-300', color: undefined, stageIndex: 7 },
  WON: { label: 'Won', bg: 'bg-emerald-100', text: 'text-[#1AA14D]', border: 'border-emerald-300', color: undefined, stageIndex: 7 },
  CONVERTED: { label: 'Converted', bg: 'bg-emerald-100', text: 'text-[#1AA14D]', border: 'border-emerald-300', color: undefined, stageIndex: 7 },
  LOST: { label: 'Lost', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', color: undefined, stageIndex: -1 },
  CANCELLED: { label: 'Cancelled', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', color: undefined, stageIndex: -1 },
};

const LEAD_LIFECYCLE_STAGES = [
  { key: 'NEW', label: 'New' },
  { key: 'FOLLOW_UP', label: 'Follow-up' },
  { key: 'VISIT', label: 'Visit' },
  { key: 'PROPOSAL', label: 'Proposal' },
  { key: 'NEGOTIATION', label: 'Negotiation' },
  { key: 'PAYMENT', label: 'Payment' },
  { key: 'CONVERTED', label: 'Won / Converted' },
];

const CANONICAL_LEAD_STAGES = [
  { key: 'NEW', label: 'New' },
  { key: 'FOLLOW_UP', label: 'Follow-up' },
  { key: 'CONTACTED', label: 'Contacted' },
  { key: 'VISIT', label: 'Visit Scheduled' },
  { key: 'QUALIFIED', label: 'Qualified' },
  { key: 'PROPOSAL', label: 'Proposal' },
  { key: 'PROPOSAL_SENT', label: 'Proposal Sent' },
  { key: 'NEGOTIATION', label: 'Negotiation' },
  { key: 'FINAL_CALL', label: 'Final Call' },
  { key: 'PAYMENT', label: 'Payment Pending' },
  { key: 'WORK_STARTED', label: 'Work Started' },
  { key: 'WON', label: 'Won' },
  { key: 'CONVERTED', label: 'Won / Converted' },
  { key: 'LOST', label: 'Lost' },
  { key: 'CANCELLED', label: 'Cancelled' },
];

// All valid backend LeadStatus enum values
const VALID_LEAD_STATUS_KEYS = new Set([
  'NEW', 'FOLLOW_UP', 'CONTACTED', 'VISIT', 'QUALIFIED', 'PROPOSAL',
  'PROPOSAL_SENT', 'FINAL_CALL', 'NEGOTIATION', 'PAYMENT',
  'WORK_STARTED', 'WON', 'LOST', 'CANCELLED', 'CONVERTED',
]);

function toCanonicalLeadStatus(val?: string | null): string {
  if (!val || typeof val !== 'string') return 'NEW';
  let str = val.trim();
  const parenMatch = str.match(/\(([^)]+)\)$/);
  if (parenMatch && parenMatch[1]) {
    str = parenMatch[1].trim();
  }
  const normalized = str.toUpperCase().replace(/[\s-]+/g, '_');
  const mapping: Record<string, string> = {
    FOLLOWUP: 'FOLLOW_UP',
    FOLLOW_UP: 'FOLLOW_UP',
    VISIT_SCHEDULED: 'VISIT',
    VISITSCHEDULED: 'VISIT',
    VISIT: 'VISIT',
    FINALCALL: 'FINAL_CALL',
    FINAL_CALL: 'FINAL_CALL',
    PROPOSALSENT: 'PROPOSAL_SENT',
    PROPOSAL_SENT: 'PROPOSAL_SENT',
    PAYMENT_PENDING: 'PAYMENT',
    PAYMENTPENDING: 'PAYMENT',
    PAYMENT: 'PAYMENT',
    WORKSTARTED: 'WORK_STARTED',
    WORK_STARTED: 'WORK_STARTED',
    WONCONVERTED: 'CONVERTED',
    WON_CONVERTED: 'CONVERTED',
    CONVERT: 'CONVERTED',
  };
  if (mapping[normalized]) return mapping[normalized];
  if (LEAD_STATUS_CONFIG[normalized]) return normalized;
  return normalized;
}

function getLeadStatusConfig(status?: string | null, stage?: LeadStage | null): StageStatusConfig {
  if (stage && (stage.name || stage.label)) {
    return {
      label: stage.name || stage.label || '',
      bg: stage.bgColor || 'bg-slate-100',
      text: stage.color ? '' : 'text-slate-700',
      color: stage.color || undefined,
      border: stage.borderColor || 'border-slate-200',
      stageIndex: stage.sortOrder ?? 0,
    };
  }
  const s = toCanonicalLeadStatus(status);
  const fallback: StageStatusConfig = {
    label: status || 'Unknown',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    color: undefined,
    stageIndex: 0,
  };
  return LEAD_STATUS_CONFIG[s] || fallback;
}

interface LeadItem {
  id: number | string;
  title: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  companyName?: string | null;
  website?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  category?: string | null;
  source: string;
  status: string;
  stageId?: number | null;
  stage?: LeadStage | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  value: number;
  assignedToId?: number | null;
  assignedTo?: { id: number; firstName: string; lastName: string; email: string } | null;
  latitude?: number | null;
  longitude?: number | null;
  googlePlaceId?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  nextFollowUpDate?: string | null;
  nextFollowUpTime?: string | null;
  convertedAt?: string | null;
  convertedToCompanyId?: number | null;
  convertedToContactId?: number | null;
  convertedToDealId?: number | null;
  createdAt: string;
}



export default function LeadsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<LeadTab>('ALL');
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [assignedFilter, setAssignedFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Drawer / Modals states
  const [selectedLeadId, setSelectedLeadId] = useState<number | string | null>(null);
  const [drawerActiveTab, setDrawerActiveTab] = useState<'OVERVIEW' | 'TIMELINE' | 'NOTES' | 'VISITS'>('OVERVIEW');
  const [drawerNewNote, setDrawerNewNote] = useState('');

  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);

  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [selectedLeadForAction, setSelectedLeadForAction] = useState<LeadItem | null>(null);

  // Form states
  const [leadForm, setLeadForm] = useState({
    id: '',
    title: '',
    businessName: '',
    category: '',
    source: 'WEBSITE',
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    website: '',
    address: '',
    city: '',
    state: '',
    country: 'India',
    latitude: '',
    longitude: '',
    googlePlaceId: '',
    rating: '',
    reviewCount: '',
    assignedToId: '',
    status: 'NEW',
    stageId: '',
    priority: 'MEDIUM',
    value: '50000',
    nextFollowUpDate: '',
    nextFollowUpTime: '',
    notes: '',
  });

  

  // Follow-up form
  const [followUpOutcome, setFollowUpOutcome] = useState('Interested');
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpTime, setFollowUpTime] = useState('11:00');
  const [followUpNotes, setFollowUpNotes] = useState('');

  // Conversion form
  const [convertCompanyName, setConvertCompanyName] = useState('');
  const [convertDealTitle, setConvertDealTitle] = useState('');
  const [convertDealValue, setConvertDealValue] = useState('100000');
  const [convertNotes, setConvertNotes] = useState('');

  // Google Places Discovery state
  const [isPlacesDrawerOpen, setIsPlacesDrawerOpen] = useState(false);
  const [googleQuery, setGoogleQuery] = useState('');
  const [googleLocation, setGoogleLocation] = useState('');
  const [placesResults, setPlaceResults] = useState<any[]>([]);
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);

  // 1. Fetch Real Leads List
  const { data: leadsResponse, isLoading: isLoadingLeads, refetch } = useQuery({
    queryKey: ['admin-leads-list', search, activeTab, sourceFilter, priorityFilter, assignedFilter, page, pageSize],
    queryFn: async () => {
      try {
        const res: any = await api.get('/leads', {
          params: {
            search: search || undefined,
            status: activeTab !== 'ALL' ? activeTab : undefined,
            page,
            limit: pageSize,
          },
        });
        const items = res?.data?.data || res?.data?.items || res?.data || res?.items || (Array.isArray(res) ? res : []);
        const pagination = res?.pagination || res?.meta || res?.data?.pagination || res?.data?.meta || {
          page,
          pageSize,
          total: Array.isArray(items) ? items.length : 0,
          totalPages: 1,
        };
        return {
          items: Array.isArray(items) ? items : [],
          pagination: {
            page: Number(pagination.page) || page,
            pageSize: Number(pagination.pageSize || pagination.limit) || pageSize,
            total: Number(pagination.total) || (Array.isArray(items) ? items.length : 0),
            totalPages: Number(pagination.totalPages) || 1,
          },
        };
      } catch {
        return { items: [], pagination: { page: 1, pageSize, total: 0, totalPages: 1 } };
      }
    },
  });

  const rawLeads: LeadItem[] = leadsResponse?.items || [];
  const pagination = leadsResponse?.pagination || { page: 1, pageSize: 20, total: 0, totalPages: 1 };

  // 2. Fetch Selected Lead Details for Right-Side Drawer
  const {
    data: leadDetail,
    isLoading: isLoadingDetail,
    isError: isDetailError,
    refetch: refetchDetail,
  } = useQuery({
    queryKey: ['admin-lead-detail', selectedLeadId],
    queryFn: async () => {
      if (!selectedLeadId) return null;
      const res: any = await api.get(`/leads/${selectedLeadId}`);
      return res?.data || res;
    },
    enabled: Boolean(selectedLeadId),
  });

  // 3. Fetch Real Metrics
  const { data: metricsData } = useQuery({
    queryKey: ['admin-leads-metrics'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/leads/metrics');
        return res?.data || res;
      } catch {
        return null;
      }
    },
  });

  // 4. Fetch Active Employees for assignment
  const { data: employeesData } = useQuery({
    queryKey: ['admin-active-employees'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/employees');
        return Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      } catch {
        return [];
      }
    },
  });

  const employees: any[] = Array.isArray(employeesData) ? employeesData : [];

  // Fetch dynamic stages from backend
  const { data: stagesData } = useQuery({
    queryKey: ['lead-stages'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/leads/stages?includeInactive=false');
        return Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      } catch {
        return [];
      }
    },
  });

  const dynamicStages: any[] = Array.isArray(stagesData) ? stagesData : [];

  // Build merged dropdown list: canonical system stages (in order) + any custom stages from DB
  const allStagesForDropdown = useMemo(() => {
    if (dynamicStages.length === 0) {
      return CANONICAL_LEAD_STAGES.map(s => ({ key: s.key, label: s.label, id: null }));
    }
    // System stages: use canonical order; override label from dynamic when key matches
    const systemMerged = CANONICAL_LEAD_STAGES.map(cs => {
      const dyn = dynamicStages.find((d: any) => d.key === cs.key);
      return { key: cs.key, label: dyn ? (dyn.name || dyn.label || cs.label) : cs.label, id: dyn ? dyn.id : null };
    });
    // Custom stages: dynamic stages whose key is NOT in canonical list
    const customExtras = dynamicStages
      .filter((d: any) => !CANONICAL_LEAD_STAGES.some(cs => cs.key === d.key))
      .map((d: any) => ({ key: d.key, label: d.name || d.label || d.key, id: d.id }));
    return [...systemMerged, ...customExtras];
  }, [dynamicStages]);

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return rawLeads.filter((l) => {
      const s = (l.status || '').toUpperCase();
      if (activeTab === 'NEW' && s !== 'NEW') return false;
      if (activeTab === 'FOLLOW_UP' && s !== 'FOLLOW_UP' && s !== 'CONTACTED') return false;
      if (activeTab === 'VISIT' && s !== 'VISIT') return false;
      if (activeTab === 'QUALIFIED' && s !== 'QUALIFIED') return false;
      if (activeTab === 'PROPOSAL' && s !== 'PROPOSAL' && s !== 'PROPOSAL_SENT') return false;
      if (activeTab === 'NEGOTIATION' && s !== 'NEGOTIATION' && s !== 'FINAL_CALL') return false;
      if (activeTab === 'PAYMENT' && s !== 'PAYMENT') return false;
      if (activeTab === 'CONVERTED' && s !== 'CONVERTED' && s !== 'WON' && s !== 'WORK_STARTED') return false;
      if (activeTab === 'LOST' && s !== 'LOST' && s !== 'CANCELLED') return false;

      if (sourceFilter !== 'ALL' && l.source !== sourceFilter) return false;
      if (priorityFilter !== 'ALL' && l.priority !== priorityFilter) return false;
      if (assignedFilter !== 'ALL' && String(l.assignedToId) !== assignedFilter) return false;

      return true;
    });
  }, [rawLeads, activeTab, sourceFilter, priorityFilter, assignedFilter]);

  // Metrics numbers matching Mobile App statuses
  const metrics = {
    total: metricsData?.total ?? rawLeads.length,
    new: metricsData?.new ?? rawLeads.filter((l) => (l.status || '').toUpperCase() === 'NEW').length,
    followUp: rawLeads.filter((l) => ['FOLLOW_UP', 'CONTACTED'].includes((l.status || '').toUpperCase())).length,
    visit: rawLeads.filter((l) => (l.status || '').toUpperCase() === 'VISIT').length,
    qualified: metricsData?.qualified ?? rawLeads.filter((l) => (l.status || '').toUpperCase() === 'QUALIFIED').length,
    proposal: rawLeads.filter((l) => ['PROPOSAL', 'PROPOSAL_SENT'].includes((l.status || '').toUpperCase())).length,
    converted: metricsData?.converted ?? rawLeads.filter((l) => ['CONVERTED', 'WON', 'WORK_STARTED'].includes((l.status || '').toUpperCase())).length,
    lost: metricsData?.lost ?? rawLeads.filter((l) => ['LOST', 'CANCELLED'].includes((l.status || '').toUpperCase())).length,
  };

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string | number) => {
      return api.delete(`/leads/${id}`);
    },
    onSuccess: () => {
      toast.success('Lead removed successfully');
      if (selectedLeadId) setSelectedLeadId(null);
      queryClient.invalidateQueries({ queryKey: ['admin-leads-list'] });
      queryClient.invalidateQueries({ queryKey: ['admin-leads-metrics'] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  // Save Lead Mutation (Create or Update)
  const saveLeadMutation = useMutation({
    mutationFn: async () => {
      const canonicalStatus = toCanonicalLeadStatus(leadForm.status);
      // Only send status to backend if it is a valid LeadStatus enum value
      const validStatus = VALID_LEAD_STATUS_KEYS.has(canonicalStatus) ? canonicalStatus : 'NEW';
      const payload: any = {
        title: leadForm.title.trim() || leadForm.businessName.trim() || `${leadForm.firstName} ${leadForm.lastName}`.trim() || 'Direct Lead',
        companyName: leadForm.businessName.trim() || leadForm.title.trim() || undefined,
        category: leadForm.category.trim() || undefined,
        source: leadForm.source || 'WEBSITE',
        firstName: leadForm.firstName.trim() || leadForm.businessName.split(' ')[0] || 'Prospective',
        lastName: leadForm.lastName.trim() || leadForm.businessName.split(' ').slice(1).join(' ') || 'Client',
        phone: leadForm.phone.trim() || undefined,
        email: leadForm.email.trim() || undefined,
        website: leadForm.website.trim() || undefined,
        address: leadForm.address.trim() || undefined,
        city: leadForm.city.trim() || undefined,
        state: leadForm.state.trim() || undefined,
        country: leadForm.country.trim() || 'India',
        latitude: leadForm.latitude ? parseFloat(leadForm.latitude) : undefined,
        longitude: leadForm.longitude ? parseFloat(leadForm.longitude) : undefined,
        googlePlaceId: leadForm.googlePlaceId.trim() || undefined,
        rating: leadForm.rating ? parseFloat(leadForm.rating) : undefined,
        reviewCount: leadForm.reviewCount ? parseInt(leadForm.reviewCount, 10) : undefined,
        assignedToId: leadForm.assignedToId ? leadForm.assignedToId : undefined,
        status: validStatus,
        stageId: leadForm.stageId ? Number(leadForm.stageId) : undefined,
        priority: leadForm.priority,
        value: leadForm.value ? parseFloat(leadForm.value) : 0,
        nextFollowUpDate: leadForm.nextFollowUpDate ? new Date(leadForm.nextFollowUpDate) : undefined,
        nextFollowUpTime: leadForm.nextFollowUpTime || undefined,
      };

      if (leadForm.id) {
        return api.patch(`/leads/${leadForm.id}`, payload);
      } else {
        return api.post('/leads', payload);
      }
    },
    onSuccess: () => {
      toast.success(leadForm.id ? 'Lead details updated successfully!' : 'New Lead created successfully!', {
        id: 'lead-save-success',
      });
      setIsAddDrawerOpen(false);
      resetLeadForm();
      if (selectedLeadId) {
        queryClient.invalidateQueries({ queryKey: ['admin-lead-detail', selectedLeadId] });
      }
      queryClient.invalidateQueries({ queryKey: ['admin-leads-list'] });
      queryClient.invalidateQueries({ queryKey: ['admin-leads-metrics'] });
    },
    onError: (err) => {
      const msg = getErrorMessage(err);
      if (msg) toast.error(msg, { id: msg });
    },
  });

  // Follow-up Mutation
  const followUpMutation = useMutation({
    mutationFn: async () => {
      const targetId = selectedLeadForAction?.id || selectedLeadId;
      if (!targetId) return;
      return api.post(`/leads/${targetId}/follow-ups`, {
        outcome: followUpOutcome,
        notes: followUpNotes || undefined,
        nextFollowUpDate: followUpDate ? new Date(followUpDate) : undefined,
        nextFollowUpTime: followUpTime || undefined,
      });
    },
    onSuccess: () => {
      toast.success('Follow-up logged successfully!');
      setIsFollowUpModalOpen(false);
      if (selectedLeadId) {
        queryClient.invalidateQueries({ queryKey: ['admin-lead-detail', selectedLeadId] });
      }
      queryClient.invalidateQueries({ queryKey: ['admin-leads-list'] });
      queryClient.invalidateQueries({ queryKey: ['admin-leads-metrics'] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  // Convert Lead Mutation
  const convertMutation = useMutation({
    mutationFn: async () => {
      const target = selectedLeadForAction || leadDetail;
      if (!target?.id) return;
      return api.post(`/leads/${target.id}/convert`, {
        companyName: convertCompanyName.trim() || target.companyName || target.title,
        dealTitle: convertDealTitle.trim() || `${target.companyName || target.title} - Enterprise Deal`,
        dealValue: convertDealValue ? parseFloat(convertDealValue) : (target.value || 0),
        notes: convertNotes.trim() || undefined,
      });
    },
    onSuccess: (res: any) => {
      const msg = res?.data?.message || res?.message || 'Lead converted to Customer, Contact & Deal!';
      toast.success(typeof msg === 'string' ? msg : 'Lead converted successfully.');
      setIsConvertModalOpen(false);
      if (selectedLeadId) {
        queryClient.invalidateQueries({ queryKey: ['admin-lead-detail', selectedLeadId] });
      }
      queryClient.invalidateQueries({ queryKey: ['admin-leads-list'] });
      queryClient.invalidateQueries({ queryKey: ['admin-leads-metrics'] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  // Add Note Mutation
  const addNoteMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!selectedLeadId) return;
      return api.post(`/leads/${selectedLeadId}/notes`, { content });
    },
    onSuccess: () => {
      toast.success('Note added successfully');
      setDrawerNewNote('');
      queryClient.invalidateQueries({ queryKey: ['admin-lead-detail', selectedLeadId] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  // Status Change Mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ status, stageId, notes }: { status: string; stageId?: number; notes?: string }) => {
      if (!selectedLeadId) return;
      const canonicalStatus = toCanonicalLeadStatus(status);
      // Only send status when it is a valid backend enum value (custom stages just send stageId)
      const isValidStatus = VALID_LEAD_STATUS_KEYS.has(canonicalStatus);
      return api.patch(`/leads/${selectedLeadId}/status`, {
        status: isValidStatus ? canonicalStatus : undefined,
        stageId,
        notes,
      });
    },
    onSuccess: (res: any) => {
      toast.success('Lead status updated!', { id: 'lead-status-update' });
      const updatedLead = res?.data || res;
      if (updatedLead && updatedLead.id) {
        queryClient.setQueryData(['admin-lead-detail', selectedLeadId], updatedLead);
      }
      queryClient.invalidateQueries({ queryKey: ['admin-lead-detail', selectedLeadId] });
      queryClient.invalidateQueries({ queryKey: ['admin-leads-list'] });
      queryClient.invalidateQueries({ queryKey: ['admin-leads-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['admin-lead-stages'] });
    },
    onError: (err) => {
      const msg = getErrorMessage(err);
      if (msg) toast.error(msg, { id: msg });
    },
  });

  // Assign Employee Mutation
  const assignEmployeeMutation = useMutation({
    mutationFn: async (assignedToId: number | string | null) => {
      if (!selectedLeadId) return;
      return api.patch(`/leads/${selectedLeadId}`, {
        assignedToId: assignedToId ? String(assignedToId) : undefined,
      });
    },
    onSuccess: () => {
      toast.success('Assigned employee updated');
      queryClient.invalidateQueries({ queryKey: ['admin-lead-detail', selectedLeadId] });
      queryClient.invalidateQueries({ queryKey: ['admin-leads-list'] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  const resetLeadForm = () => {
    setLeadForm({
      id: '',
      title: '',
      businessName: '',
      category: '',
      source: 'WEBSITE',
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      website: '',
      address: '',
      city: '',
      state: '',
      country: 'India',
      latitude: '',
      longitude: '',
      googlePlaceId: '',
      rating: '',
      reviewCount: '',
      assignedToId: '',
      status: 'NEW',
      stageId: '',
      priority: 'MEDIUM',
      value: '50000',
      nextFollowUpDate: '',
      nextFollowUpTime: '',
      notes: '',
    });
  };

  const handleOpenCreate = () => {
    resetLeadForm();
    setIsAddDrawerOpen(true);
  };

  const handleOpenEdit = (lead: any) => {
    setSelectedLeadForAction(lead);
    setLeadForm({
      id: String(lead.id),
      title: lead.title || '',
      businessName: lead.companyName || lead.title || '',
      category: lead.category || '',
      source: lead.source || 'WEBSITE',
      firstName: lead.firstName || '',
      lastName: lead.lastName || '',
      phone: lead.phone || '',
      email: lead.email || '',
      website: lead.website || '',
      address: lead.address || '',
      city: lead.city || '',
      state: lead.state || '',
      country: lead.country || 'India',
      latitude: lead.latitude ? String(lead.latitude) : '',
      longitude: lead.longitude ? String(lead.longitude) : '',
      googlePlaceId: lead.googlePlaceId || '',
      rating: lead.rating ? String(lead.rating) : '',
      reviewCount: lead.reviewCount ? String(lead.reviewCount) : '',
      assignedToId: lead.assignedToId ? String(lead.assignedToId) : '',
      status: lead.status ? toCanonicalLeadStatus(lead.status) : 'NEW',
      stageId: lead.stageId ? String(lead.stageId) : '',
      priority: lead.priority || 'MEDIUM',
      value: String(lead.value || 0),
      nextFollowUpDate: lead.nextFollowUpDate ? lead.nextFollowUpDate.split('T')[0] : '',
      nextFollowUpTime: lead.nextFollowUpTime || '',
      notes: '',
    });
    setIsAddDrawerOpen(true);
  };

  const handleOpenFollowUp = (lead: any) => {
    setSelectedLeadForAction(lead);
    setFollowUpOutcome('Interested');
    setFollowUpDate('');
    setFollowUpTime('11:00');
    setFollowUpNotes('');
    setIsFollowUpModalOpen(true);
  };

  const handleOpenConvert = (lead: any) => {
    setSelectedLeadForAction(lead);
    setConvertCompanyName(lead.companyName || lead.title || 'Client Company');
    setConvertDealTitle(`${lead.companyName || lead.title || 'Enterprise'} - Deal`);
    setConvertDealValue(String(lead.value || 100000));
    setConvertNotes('Lead qualified and ready for contract deal closing.');
    setIsConvertModalOpen(true);
  };

  // Google Places Search handler
  const handleSearchGooglePlaces = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!googleQuery.trim()) return;

    setIsSearchingPlaces(true);
    try {
      const res: any = await api.post('/data-capture/extract', {
        keyword: googleQuery.trim(),
        location: (googleLocation || '').trim(),
        query: `${googleQuery} in ${googleLocation}`,
        source: 'GOOGLE_MAPS',
        limit: 10,
        maxResults: 10,
      });
      const records =
        res?.data?.records ||
        res?.records ||
        res?.data?.places ||
        res?.places ||
        [];
      setPlaceResults(records);
      if (records.length === 0) {
        toast('No matching places found. Try another search query.');
      }
    } catch (err) {
      toast.error('Failed to query Google Places API');
    } finally {
      setIsSearchingPlaces(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. HERO BANNER */}
      <AdminPageHero
        badge="CRM & Pipeline"
        title="Leads Management"
        description="Discover, assign, track and convert potential customers into sales deals."
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/leads/limits"
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl text-xs flex items-center gap-2 transition-all border border-white/20 cursor-pointer active:scale-95"
            >
              <ShieldCheck className="w-4 h-4 text-sky-300" />
              <span>Lead Limits</span>
            </Link>

            <button
              onClick={() => {
                setIsPlacesDrawerOpen(true);
                if (placesResults.length === 0) handleSearchGooglePlaces();
              }}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl text-xs flex items-center gap-2 transition-all border border-white/20 cursor-pointer active:scale-95"
            >
              <Globe className="w-4 h-4 text-emerald-300" />
              <span>Google Places Discovery</span>
            </button>

            <button
              onClick={handleOpenCreate}
              className="px-5 py-2 bg-[#23C45E] hover:bg-[#1AA14D] text-slate-950 font-black rounded-2xl text-xs flex items-center gap-2 transition-all shadow-md shadow-[#23C45E]/20 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add New Lead</span>
            </button>
          </div>
        }
      />

      {/* 2. SUMMARY METRICS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <AdminStatCard
          title="Total Leads"
          value={isLoadingLeads ? '...' : metrics.total}
          icon={Layers}
          iconBg="slate"
        />
        <AdminStatCard
          title="New Inquiries"
          value={isLoadingLeads ? '...' : metrics.new}
          icon={Sparkles}
          iconBg="primary"
        />
        <AdminStatCard
          title="Follow-up"
          value={isLoadingLeads ? '...' : metrics.followUp}
          icon={Phone}
          iconBg="blue"
        />
        <AdminStatCard
          title="Qualified"
          value={isLoadingLeads ? '...' : metrics.qualified}
          icon={Award}
          iconBg="purple"
        />
        <AdminStatCard
          title="Converted"
          value={isLoadingLeads ? '...' : metrics.converted}
          icon={TrendingUp}
          iconBg="primary"
        />
        <AdminStatCard
          title="Lost / Closed"
          value={isLoadingLeads ? '...' : metrics.lost}
          icon={XCircle}
          iconBg="rose"
        />
      </div>

      {/* 3. TABS & FILTER BAR */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-3">
          {[
            { key: 'ALL', label: 'All Leads', count: metrics.total },
            { key: 'NEW', label: 'New', count: metrics.new },
            { key: 'FOLLOW_UP', label: 'Follow-up', count: metrics.followUp },
            { key: 'VISIT', label: 'Visit', count: metrics.visit },
            { key: 'QUALIFIED', label: 'Qualified', count: metrics.qualified },
            { key: 'PROPOSAL', label: 'Proposal', count: metrics.proposal },
            { key: 'CONVERTED', label: 'Converted', count: metrics.converted },
            { key: 'LOST', label: 'Lost', count: metrics.lost },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key as LeadTab);
                setPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === tab.key
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                  activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-slate-200/70 text-slate-700'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by name, company, email..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
            />
          </div>

          <select
            value={sourceFilter}
            onChange={(e) => {
              setSourceFilter(e.target.value);
              setPage(1);
            }}
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
          >
            <option value="ALL">All Sources</option>
            <option value="WEBSITE">Website</option>
            <option value="GOOGLE_PLACES">Google Places</option>
            <option value="REFERRAL">Referral</option>
            <option value="LINKEDIN">LinkedIn</option>
            <option value="COLD_CALL">Cold Call</option>
            <option value="CAMPAIGN">Marketing Campaign</option>
            <option value="OTHER">Other</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value);
              setPage(1);
            }}
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
          >
            <option value="ALL">All Priorities</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High Priority</option>
            <option value="MEDIUM">Medium Priority</option>
            <option value="LOW">Low Priority</option>
          </select>

          <select
            value={assignedFilter}
            onChange={(e) => {
              setAssignedFilter(e.target.value);
              setPage(1);
            }}
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
          >
            <option value="ALL">All Assigned Employees</option>
            {employees.map((emp) => (
              <option key={emp.id} value={String(emp.id)}>
                {emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`} ({emp.employeeCode})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 4. MAIN LEADS TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[950px]">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-black text-slate-500 uppercase tracking-wider">
                <th className="py-4 px-5">Lead / Business</th>
                <th className="py-4 px-4">Contact Info</th>
                <th className="py-4 px-4">Source & Place</th>
                <th className="py-4 px-4">Stage Status</th>
                <th className="py-4 px-4">Est. Value</th>
                <th className="py-4 px-4">Assigned To</th>
                <th className="py-4 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {isLoadingLeads ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400 font-bold animate-pulse">
                    Loading CRM leads from database...
                  </td>
                </tr>
              ) : filteredLeads.length > 0 ? (
                filteredLeads.map((lead) => {
                  const leadName = `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || 'Contact';
                  const compName = lead.companyName || lead.title || 'Direct Prospect';
                  const isConverted = lead.status === 'CONVERTED' || lead.status === 'WON';
                  const isSelected = String(selectedLeadId) === String(lead.id);

                  return (
                    <tr
                      key={lead.id}
                      onClick={() => setSelectedLeadId(lead.id)}
                      className={`hover:bg-slate-50/90 transition-colors cursor-pointer group ${
                        isSelected ? 'bg-emerald-50/50 border-l-4 border-l-[#1AA14D]' : ''
                      }`}
                    >
                      {/* Lead & Business Name */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#1AA14D] border border-emerald-200/60 flex items-center justify-center font-black shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                            {lead.googlePlaceId ? <Globe className="w-4 h-4 text-blue-600" /> : <Building className="w-4 h-4" />}
                          </div>
                          <div className="min-w-0">
                            <span className="font-extrabold text-slate-900 group-hover:text-[#1AA14D] text-sm truncate block transition-colors">
                              {compName}
                            </span>
                            <p className="text-slate-500 font-medium text-[11px] truncate flex items-center gap-1.5 mt-0.5">
                              <span className="font-bold text-slate-700">{leadName}</span>
                              {lead.city && <span>• {lead.city}</span>}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Contact Info */}
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          {lead.phone ? (
                            <p className="font-bold text-slate-800 flex items-center gap-1.5">
                              <Phone className="w-3 h-3 text-[#23C45E]" />
                              <span>{lead.phone}</span>
                            </p>
                          ) : (
                            <span className="text-slate-400 font-mono text-[11px]">-</span>
                          )}
                          {lead.email && (
                            <p className="text-slate-500 font-medium text-[11px] truncate max-w-[180px] flex items-center gap-1.5">
                              <Mail className="w-3 h-3 text-slate-400" />
                              <span>{lead.email}</span>
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Source & Place ID */}
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              lead.source === 'GOOGLE_PLACES'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {lead.source === 'GOOGLE_PLACES' && <Globe className="w-2.5 h-2.5" />}
                            {lead.source}
                          </span>
                          {lead.rating && (
                            <p className="text-[11px] font-extrabold text-amber-600 flex items-center gap-1">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              <span>{lead.rating}</span>
                              {lead.reviewCount && <span className="text-slate-400 font-normal">({lead.reviewCount})</span>}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Stage Status */}
                      <td className="py-4 px-4">
                        {(() => {
                          const conf = getLeadStatusConfig(lead.status, lead.stage);
                          const isCustomBg = conf.bg?.startsWith('#') || conf.bg?.startsWith('rgb');
                          const isCustomBorder = conf.border?.startsWith('#') || conf.border?.startsWith('rgb');
                          return (
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                                isCustomBg ? '' : conf.bg
                              } ${conf.text || ''} ${isCustomBorder ? '' : conf.border}`}
                              style={{
                                ...(conf.color ? { color: conf.color } : {}),
                                ...(isCustomBg ? { backgroundColor: conf.bg } : {}),
                                ...(isCustomBorder ? { borderColor: conf.border } : {}),
                              }}
                            >
                              {conf.label}
                            </span>
                          );
                        })()}
                      </td>

                      {/* Estimated Value & Priority */}
                      <td className="py-4 px-4">
                        <p className="font-black text-slate-900 text-sm">
                          ₹{Number(lead.value || 0).toLocaleString('en-IN')}
                        </p>
                        <span
                          className={`inline-block text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded mt-0.5 ${
                            lead.priority === 'HIGH' || lead.priority === 'URGENT'
                              ? 'bg-rose-100 text-rose-700'
                              : lead.priority === 'LOW'
                              ? 'bg-slate-100 text-slate-600'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {lead.priority}
                        </span>
                      </td>

                      {/* Assigned To */}
                      <td className="py-4 px-4">
                        {lead.assignedTo ? (
                          <div className="flex items-center gap-1.5">
                            <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 text-[10px] font-black flex items-center justify-center">
                              {lead.assignedTo.firstName?.[0] || 'U'}
                            </div>
                            <span className="font-bold text-slate-800 text-xs">
                              {lead.assignedTo.firstName} {lead.assignedTo.lastName}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-bold text-xs italic">Unassigned</span>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setSelectedLeadId(lead.id)}
                            className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 hover:text-[#1AA14D] transition-colors cursor-pointer"
                            title="Open Detail Drawer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleOpenFollowUp(lead)}
                            className="p-2 hover:bg-emerald-50 rounded-xl text-slate-500 hover:text-[#1AA14D] transition-colors cursor-pointer"
                            title="Log Follow-up"
                          >
                            <Clock className="w-4 h-4" />
                          </button>

                          {!isConverted && (
                            <button
                              onClick={() => handleOpenConvert(lead)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase rounded-xl transition-all shadow-xs cursor-pointer active:scale-95"
                              title="Convert to Customer Deal"
                            >
                              Convert
                            </button>
                          )}

                          <button
                            onClick={() => handleOpenEdit(lead)}
                            className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
                            title="Edit Lead"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              if (confirm(`Permanently delete lead "${compName}"?`)) {
                                deleteMutation.mutate(lead.id);
                              }
                            }}
                            className="p-2 hover:bg-rose-50 rounded-xl text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Delete Lead"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    <p className="font-bold text-sm text-slate-600">No leads found in this view</p>
                    <p className="text-xs text-slate-400 mt-1">Try switching filters or search using Google Places</p>
                    <button
                      onClick={() => {
                        setIsPlacesDrawerOpen(true);
                        handleSearchGooglePlaces();
                      }}
                      className="mt-4 px-4 py-2 bg-blue-50 text-blue-700 font-bold rounded-xl text-xs hover:bg-blue-100 transition-all cursor-pointer"
                    >
                      Extract Local Businesses via Google Places
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Server-Side Pagination Footer */}
        <AdminPagination
          page={page}
          pageSize={pageSize}
          total={pagination.total}
          totalPages={pagination.totalPages}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
          disabled={isLoadingLeads}
        />
      </div>

      {/* =========================================================================
          5. RIGHT-SIDE LEAD DETAIL DRAWER (SLIDE-OVER PANEL)
          ========================================================================= */}
      {selectedLeadId && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
            onClick={() => setSelectedLeadId(null)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-xl md:max-w-2xl bg-white shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-300">
              {/* Drawer Top Bar */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-[#1AA14D] font-black flex items-center justify-center shrink-0 shadow-2xs">
                    {leadDetail?.googlePlaceId ? <Globe className="w-5 h-5 text-blue-600" /> : <Building className="w-5 h-5" />}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-black text-slate-900 truncate">
                      {leadDetail?.companyName || leadDetail?.title || 'Lead Details'}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium truncate">
                      {leadDetail?.firstName} {leadDetail?.lastName} {leadDetail?.city ? `• ${leadDetail.city}` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {leadDetail && (
                    <button
                      onClick={() => handleOpenEdit(leadDetail)}
                      className="p-2 hover:bg-slate-200/70 rounded-xl text-slate-600 hover:text-blue-600 transition-colors"
                      title="Edit Lead"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedLeadId(null)}
                    className="p-2 hover:bg-slate-200/70 rounded-xl text-slate-400 hover:text-slate-700 transition-colors"
                    title="Close Drawer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Drawer Body (Scrollable) */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {isLoadingDetail ? (
                  <div className="space-y-4 animate-pulse">
                    <div className="h-10 bg-slate-100 rounded-2xl w-3/4" />
                    <div className="grid grid-cols-2 gap-3">
                      <div className="h-20 bg-slate-100 rounded-2xl" />
                      <div className="h-20 bg-slate-100 rounded-2xl" />
                    </div>
                    <div className="h-40 bg-slate-100 rounded-2xl" />
                    <div className="h-32 bg-slate-100 rounded-2xl" />
                  </div>
                ) : isDetailError || !leadDetail ? (
                  <div className="p-8 text-center bg-rose-50 rounded-3xl border border-rose-200 space-y-3">
                    <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
                    <h4 className="font-black text-rose-900 text-sm">Failed to Load Lead Details</h4>
                    <p className="text-xs text-rose-700">The requested lead record could not be retrieved.</p>
                    <button
                      onClick={() => refetchDetail()}
                      className="px-4 py-2 bg-rose-600 text-white font-bold rounded-xl text-xs hover:bg-rose-700 transition-all cursor-pointer"
                    >
                      Retry Loading
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Status & Highlights Row */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Deal Value</p>
                        <p className="text-base font-black text-slate-900 mt-0.5">
                          ₹{Number(leadDetail.value || 0).toLocaleString('en-IN')}
                        </p>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Priority</p>
                        <span
                          className={`inline-block text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md mt-1 ${
                            leadDetail.priority === 'HIGH' || leadDetail.priority === 'URGENT'
                              ? 'bg-rose-100 text-rose-700'
                              : leadDetail.priority === 'LOW'
                              ? 'bg-slate-100 text-slate-700'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {leadDetail.priority || 'MEDIUM'}
                        </span>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Source</p>
                        <p className="text-xs font-black text-slate-800 mt-1 truncate">
                          {leadDetail.source || 'WEBSITE'}
                        </p>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Created</p>
                        <p className="text-xs font-bold text-slate-700 mt-1">
                          {new Date(leadDetail.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Lifecycle Stage Progress Bar (Matching Mobile App) */}
                    <div className="p-4 bg-slate-50/90 rounded-3xl border border-slate-200/80 space-y-2.5">
                      <div className="flex items-center justify-between text-xs font-black text-slate-800">
                        <span>Lifecycle Pipeline Stage</span>
                        <span className="text-[11px] font-bold text-slate-500">
                          {leadDetail.status === 'LOST' || leadDetail.status === 'CANCELLED'
                            ? 'Lead Closed / Lost'
                            : `Stage ${Math.min(7, getLeadStatusConfig(leadDetail.status).stageIndex + 1)} of 7`}
                        </span>
                      </div>
                      <div className="grid grid-cols-7 gap-1">
                        {LEAD_LIFECYCLE_STAGES.map((st, idx) => {
                          const currentStageIdx = getLeadStatusConfig(leadDetail.status).stageIndex;
                          const isCompleted = currentStageIdx >= idx && currentStageIdx >= 0;
                          const isCurrent = currentStageIdx === idx;
                          return (
                            <div key={st.key} className="space-y-1">
                              <div
                                className={`h-1.5 rounded-full transition-all ${
                                  isCurrent
                                    ? 'bg-[#23C45E] ring-2 ring-[#23C45E]/30'
                                    : isCompleted
                                    ? 'bg-emerald-300'
                                    : 'bg-slate-200'
                                }`}
                              />
                              <p className={`text-[9px] font-bold text-center truncate ${isCurrent ? 'text-[#1AA14D]' : 'text-slate-400'}`}>
                                {st.label}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Stage Status Switcher Banner */}
                    <div className="p-4 bg-emerald-50/60 rounded-3xl border border-emerald-200/80 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-wider text-emerald-800">
                          Current Stage Status
                        </p>
                        {(() => {
                          const conf = getLeadStatusConfig(leadDetail.status, leadDetail.stage);
                          const isCustomBg = conf.bg?.startsWith('#') || conf.bg?.startsWith('rgb');
                          const isCustomBorder = conf.border?.startsWith('#') || conf.border?.startsWith('rgb');
                          return (
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span
                                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${
                                  isCustomBg ? '' : conf.bg
                                } ${conf.text || ''} ${isCustomBorder ? '' : conf.border}`}
                                style={{
                                  ...(conf.color ? { color: conf.color } : {}),
                                  ...(isCustomBg ? { backgroundColor: conf.bg } : {}),
                                  ...(isCustomBorder ? { borderColor: conf.border } : {}),
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
                          value={leadDetail.stageId
                            ? (allStagesForDropdown.find(s => s.id === leadDetail.stageId)?.key || toCanonicalLeadStatus(leadDetail.status))
                            : toCanonicalLeadStatus(leadDetail.status)
                          }
                          onChange={(e) => {
                            const selectedKey = e.target.value;
                            const matchedStage = allStagesForDropdown.find(s => s.key === selectedKey);
                            const isValid = VALID_LEAD_STATUS_KEYS.has(selectedKey);
                            updateStatusMutation.mutate({
                              status: isValid ? selectedKey : (leadDetail.status || 'NEW'),
                              stageId: matchedStage?.id ? Number(matchedStage.id) : undefined,
                            });
                          }}
                          disabled={updateStatusMutation.isPending}
                          className="px-3 py-1.5 bg-white border border-emerald-300 rounded-xl text-xs font-bold text-slate-900 shadow-xs focus:ring-2 focus:ring-[#23C45E] disabled:opacity-50 cursor-pointer"
                        >
                          {allStagesForDropdown.map((st) => (
                            <option key={st.key} value={st.key}>
                              {st.label} ({st.key})
                            </option>
                          ))}
                        </select>

                        {leadDetail.status !== 'CONVERTED' && leadDetail.status !== 'WON' && (
                          <button
                            onClick={() => handleOpenConvert(leadDetail)}
                            className="px-3 py-1.5 bg-[#23C45E] hover:bg-[#1AA14D] text-slate-950 font-black rounded-xl text-xs transition-all shadow-xs cursor-pointer active:scale-95"
                          >
                            Convert Deal
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Contact & Organization Card */}
                    <div className="p-4 bg-slate-50/70 rounded-3xl border border-slate-200/80 space-y-3">
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                        <Building className="w-4 h-4 text-slate-500" />
                        <span>Contact & Organization</span>
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        {leadDetail.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5 text-[#23C45E] shrink-0" />
                            <a
                              href={`tel:${leadDetail.phone}`}
                              className="font-bold text-slate-800 hover:text-[#1AA14D] hover:underline"
                            >
                              {leadDetail.phone}
                            </a>
                          </div>
                        )}

                        {leadDetail.email && (
                          <div className="flex items-center gap-2 min-w-0">
                            <Mail className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                            <a
                              href={`mailto:${leadDetail.email}`}
                              className="font-bold text-slate-800 hover:text-blue-600 hover:underline truncate"
                            >
                              {leadDetail.email}
                            </a>
                          </div>
                        )}

                        {leadDetail.website && (
                          <div className="flex items-center gap-2 min-w-0">
                            <Globe className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                            <a
                              href={leadDetail.website.startsWith('http') ? leadDetail.website : `https://${leadDetail.website}`}
                              target="_blank"
                              rel="noreferrer"
                              className="font-bold text-purple-700 hover:underline truncate flex items-center gap-1"
                            >
                              <span>{leadDetail.website.replace(/^https?:\/\//, '')}</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        )}

                        {leadDetail.address && (
                          <div className="flex items-start gap-2 col-span-full">
                            <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                            <span className="font-semibold text-slate-700">
                              {leadDetail.address} {leadDetail.city ? `, ${leadDetail.city}` : ''}{' '}
                              {leadDetail.state ? `, ${leadDetail.state}` : ''}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Assigned Representative */}
                    <div className="p-4 bg-slate-50/70 rounded-3xl border border-slate-200/80 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-black text-xs flex items-center justify-center shrink-0">
                          {leadDetail.assignedTo?.firstName?.[0] || 'U'}
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Assigned To</p>
                          <p className="text-xs font-black text-slate-800">
                            {leadDetail.assignedTo
                              ? `${leadDetail.assignedTo.firstName} ${leadDetail.assignedTo.lastName}`
                              : 'Unassigned Representative'}
                          </p>
                        </div>
                      </div>

                      <select
                        value={String(leadDetail.assignedToId || '')}
                        onChange={(e) => assignEmployeeMutation.mutate(e.target.value || null)}
                        disabled={assignEmployeeMutation.isPending}
                        className="px-3 py-1 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 shadow-2xs"
                      >
                        <option value="">-- Assign Employee --</option>
                        {employees
                          .filter((emp) => emp.userId)
                          .map((emp) => (
                            <option key={emp.id} value={String(emp.userId)}>
                              {emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`}
                            </option>
                          ))}
                      </select>
                    </div>

                    {/* Interactive Tabs inside Drawer */}
                    <div className="space-y-4 pt-2">
                      <div className="flex border-b border-slate-200">
                        {[
                          { key: 'OVERVIEW', label: 'Overview', icon: FileText },
                          { key: 'TIMELINE', label: `Timeline (${leadDetail.timeline?.length || 0})`, icon: History },
                          { key: 'NOTES', label: `Notes (${leadDetail.notes?.length || 0})`, icon: MessageSquare },
                          { key: 'VISITS', label: `Visits (${leadDetail.visits?.length || 0})`, icon: Calendar },
                        ].map((t) => {
                          const IconComp = t.icon;
                          const isActive = drawerActiveTab === t.key;
                          return (
                            <button
                              key={t.key}
                              onClick={() => setDrawerActiveTab(t.key as any)}
                              className={`pb-3 px-3.5 text-xs font-black flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                                isActive
                                  ? 'border-[#23C45E] text-[#1AA14D]'
                                  : 'border-transparent text-slate-500 hover:text-slate-800'
                              }`}
                            >
                              <IconComp className="w-3.5 h-3.5" />
                              <span>{t.label}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* TAB 1: OVERVIEW */}
                      {drawerActiveTab === 'OVERVIEW' && (
                        <div className="space-y-4">
                          {leadDetail.nextFollowUpDate && (
                            <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-xs flex items-center justify-between">
                              <div className="flex items-center gap-2 text-amber-900 font-bold">
                                <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                                <span>
                                  Next Follow-up scheduled for{' '}
                                  {new Date(leadDetail.nextFollowUpDate).toLocaleDateString('en-IN', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                  })}{' '}
                                  {leadDetail.nextFollowUpTime || ''}
                                </span>
                              </div>
                              <button
                                onClick={() => handleOpenFollowUp(leadDetail)}
                                className="px-2.5 py-1 bg-amber-200 hover:bg-amber-300 text-amber-900 font-extrabold rounded-lg text-[10px] uppercase cursor-pointer"
                              >
                                Reschedule
                              </button>
                            </div>
                          )}

                          {leadDetail.rating && (
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
                              <p className="font-black text-slate-900 flex items-center gap-1.5">
                                <Globe className="w-4 h-4 text-blue-600" />
                                <span>Google Places Intelligence</span>
                              </p>
                              <p className="text-slate-600 font-medium">
                                Rating: <strong>{leadDetail.rating} / 5.0</strong> ({leadDetail.reviewCount || 0} customer reviews)
                              </p>
                              {leadDetail.googlePlaceId && (
                                <p className="font-mono text-[10px] text-slate-400 truncate">
                                  Place ID: {leadDetail.googlePlaceId}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* TAB 2: TIMELINE & STATUS HISTORY */}
                      {drawerActiveTab === 'TIMELINE' && (
                        <div className="space-y-4">
                          {/* Status Transition History Section */}
                          {leadDetail.statusHistory && leadDetail.statusHistory.length > 0 && (
                            <div className="space-y-2">
                              <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                <History className="w-3 h-3 text-[#1AA14D]" />
                                <span>Status Lifecycle Transitions ({leadDetail.statusHistory.length})</span>
                              </h5>
                              <div className="space-y-2">
                                {leadDetail.statusHistory.map((hist: any) => {
                                  const fromConf = hist.fromStatus ? getLeadStatusConfig(hist.fromStatus) : null;
                                  const toConf = getLeadStatusConfig(hist.toStatus);
                                  return (
                                    <div
                                      key={hist.id}
                                      className="p-3 bg-slate-50/90 rounded-2xl border border-slate-200/80 text-xs space-y-1.5"
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          {fromConf ? (
                                            <>
                                              <span
                                                className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${fromConf.bg} ${fromConf.text} ${fromConf.border}`}
                                              >
                                                {fromConf.label}
                                              </span>
                                              <ArrowRight className="w-3 h-3 text-slate-400" />
                                            </>
                                          ) : (
                                            <span className="text-[10px] text-slate-400 font-bold">Initial:</span>
                                          )}
                                          <span
                                            className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${toConf.bg} ${toConf.text} ${toConf.border}`}
                                          >
                                            {toConf.label}
                                          </span>
                                        </div>
                                        <span className="text-[10px] text-slate-400 font-bold shrink-0">
                                          {new Date(hist.createdAt).toLocaleDateString('en-IN', {
                                            day: 'numeric',
                                            month: 'short',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                          })}
                                        </span>
                                      </div>
                                      {hist.notes && (
                                        <p className="text-[11px] text-slate-600 font-medium">{hist.notes}</p>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Activity Timeline Events */}
                          <div className="space-y-2">
                            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                              <Clock className="w-3 h-3 text-blue-500" />
                              <span>Activity Log ({leadDetail.timeline?.length || 0})</span>
                            </h5>
                            {leadDetail.timeline && leadDetail.timeline.length > 0 ? (
                              leadDetail.timeline.map((item: any) => (
                                <div
                                  key={item.id}
                                  className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs space-y-1"
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="font-black text-slate-800 text-[11px] uppercase tracking-wider">
                                      {item.action.replace(/_/g, ' ')}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-bold">
                                      {item.createdAt && !isNaN(new Date(item.createdAt).getTime())
                                        ? new Date(item.createdAt).toLocaleString('en-IN', {
                                            day: 'numeric',
                                            month: 'short',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                          })
                                        : 'Recent'}
                                    </span>
                                  </div>
                                  <p className="text-slate-600 font-medium">{item.description}</p>
                                </div>
                              ))
                            ) : (
                              <p className="text-center py-4 text-slate-400 text-xs font-bold">
                                No activity timeline recorded yet
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* TAB 3: NOTES */}
                      {drawerActiveTab === 'NOTES' && (
                        <div className="space-y-4">
                          {/* Add Note Form */}
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={drawerNewNote}
                              onChange={(e) => setDrawerNewNote(e.target.value)}
                              placeholder="Write a quick lead note..."
                              className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
                            />
                            <button
                              onClick={() => {
                                if (!drawerNewNote.trim()) return;
                                addNoteMutation.mutate(drawerNewNote.trim());
                              }}
                              disabled={addNoteMutation.isPending || !drawerNewNote.trim()}
                              className="px-4 py-2 bg-[#23C45E] hover:bg-[#1AA14D] text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>Add</span>
                            </button>
                          </div>

                          {/* Notes Stream */}
                          <div className="space-y-2.5">
                            {leadDetail.notes && leadDetail.notes.length > 0 ? (
                              leadDetail.notes.map((note: any) => (
                                <div
                                  key={note.id}
                                  className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs space-y-1"
                                >
                                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold">
                                    <span>
                                      {note.user ? `${note.user.firstName} ${note.user.lastName}` : 'Admin'}
                                    </span>
                                    <span>
                                      {new Date(note.createdAt).toLocaleDateString('en-IN', {
                                        day: 'numeric',
                                        month: 'short',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })}
                                    </span>
                                  </div>
                                  <p className="text-slate-800 font-semibold">{note.content}</p>
                                </div>
                              ))
                            ) : (
                              <p className="text-center py-6 text-slate-400 text-xs font-bold">
                                No notes added to this lead yet
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* TAB 4: VISITS */}
                      {drawerActiveTab === 'VISITS' && (
                        <div className="space-y-3">
                          {leadDetail.visits && leadDetail.visits.length > 0 ? (
                            leadDetail.visits.map((v: any) => (
                              <div
                                key={v.id}
                                className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs space-y-1"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-black text-slate-900">{v.purpose || 'Client Visit'}</span>
                                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-full text-[10px]">
                                    {v.status}
                                  </span>
                                </div>
                                <p className="text-slate-500 text-[11px]">
                                  {new Date(v.date).toLocaleDateString('en-IN')} {v.time ? `• ${v.time}` : ''} • {v.location}
                                </p>
                              </div>
                            ))
                          ) : (
                            <p className="text-center py-6 text-slate-400 text-xs font-bold">
                              No field visits logged for this lead
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Drawer Bottom Actions */}
              {leadDetail && (
                <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      if (confirm(`Permanently delete lead "${leadDetail.companyName || leadDetail.title}"?`)) {
                        deleteMutation.mutate(leadDetail.id);
                      }
                    }}
                    className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Lead</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenFollowUp(leadDetail)}
                      className="px-3.5 py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-100 transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Clock className="w-4 h-4 text-slate-500" />
                      <span>Follow-up</span>
                    </button>

                    <button
                      onClick={() => handleOpenEdit(leadDetail)}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <Edit className="w-4 h-4" />
                      <span>Edit Lead</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
        </div>
      </AdminFormDrawer>

      {/* =========================================================================
          7. CREATE / EDIT LEAD DRAWER
          ========================================================================= */}
      <AdminFormDrawer
        isOpen={isAddDrawerOpen}
        onClose={() => setIsAddDrawerOpen(false)}
        title={leadForm.id ? 'Edit Lead Profile' : 'Create New CRM Lead'}
        subtitle={leadForm.id ? 'Modify lead contact parameters, value, and stage' : 'Add prospective customer to CRM pipeline'}
        size="lg"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveLeadMutation.mutate();
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                Lead Title / Opportunity *
              </label>
              <input
                type="text"
                required
                value={leadForm.title}
                onChange={(e) => setLeadForm({ ...leadForm, title: e.target.value })}
                placeholder="e.g. Enterprise Cloud Deployment"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                Company / Business Name
              </label>
              <input
                type="text"
                value={leadForm.businessName}
                onChange={(e) => setLeadForm({ ...leadForm, businessName: e.target.value })}
                placeholder="e.g. Apex Technologies"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                Industry / Category
              </label>
              <input
                type="text"
                value={leadForm.category}
                onChange={(e) => setLeadForm({ ...leadForm, category: e.target.value })}
                placeholder="e.g. Information Technology"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                Contact First Name *
              </label>
              <input
                type="text"
                required
                value={leadForm.firstName}
                onChange={(e) => setLeadForm({ ...leadForm, firstName: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                Contact Last Name *
              </label>
              <input
                type="text"
                required
                value={leadForm.lastName}
                onChange={(e) => setLeadForm({ ...leadForm, lastName: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                Direct Phone
              </label>
              <input
                type="text"
                value={leadForm.phone}
                onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                placeholder="+91 98200 12345"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={leadForm.email}
                onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                placeholder="contact@company.com"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                Estimated Deal Value (₹)
              </label>
              <input
                type="number"
                value={leadForm.value}
                onChange={(e) => setLeadForm({ ...leadForm, value: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                Lead Source
              </label>
              <select
                value={leadForm.source}
                onChange={(e) => setLeadForm({ ...leadForm, source: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
              >
                <option value="WEBSITE">Website</option>
                <option value="GOOGLE_PLACES">Google Places</option>
                <option value="REFERRAL">Referral</option>
                <option value="LINKEDIN">LinkedIn</option>
                <option value="COLD_CALL">Cold Call</option>
                <option value="CAMPAIGN">Campaign</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                Stage Status
              </label>
              <select
                value={leadForm.stageId
                  ? (allStagesForDropdown.find(s => s.id !== null && String(s.id) === leadForm.stageId)?.key || leadForm.status)
                  : leadForm.status
                }
                onChange={(e) => {
                  const selectedKey = e.target.value;
                  const matchedStage = allStagesForDropdown.find(s => s.key === selectedKey);
                  const isValid = VALID_LEAD_STATUS_KEYS.has(selectedKey);
                  setLeadForm({
                    ...leadForm,
                    status: isValid ? selectedKey : leadForm.status || 'NEW',
                    stageId: matchedStage?.id ? String(matchedStage.id) : '',
                  });
                }}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 cursor-pointer"
              >
                {allStagesForDropdown.map((st) => (
                  <option key={st.key} value={st.key}>
                    {st.label} ({st.key})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                Priority
              </label>
              <select
                value={leadForm.priority}
                onChange={(e) => setLeadForm({ ...leadForm, priority: e.target.value as any })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="URGENT">URGENT</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                Assign Representative
              </label>
              <select
                value={leadForm.assignedToId}
                onChange={(e) => setLeadForm({ ...leadForm, assignedToId: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
              >
                <option value="">-- Select Employee --</option>
                {employees
                  .filter((emp) => emp.userId)
                  .map((emp) => (
                    <option key={emp.id} value={String(emp.userId)}>
                      {emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`} ({emp.employeeCode})
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                City / Location
              </label>
              <input
                type="text"
                value={leadForm.city}
                onChange={(e) => setLeadForm({ ...leadForm, city: e.target.value })}
                placeholder="e.g. Mumbai"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsAddDrawerOpen(false)}
              className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saveLeadMutation.isPending}
              className="px-5 py-2 bg-[#23C45E] hover:bg-[#1AA14D] text-slate-950 font-black rounded-xl text-xs cursor-pointer shadow-md shadow-[#23C45E]/20"
            >
              {saveLeadMutation.isPending ? 'Saving...' : leadForm.id ? 'Save Changes' : 'Create Lead'}
            </button>
          </div>
        </form>
      </AdminFormDrawer>

      {/* =========================================================================
          8. LOG FOLLOW-UP MODAL
          ========================================================================= */}
      <AdminFormDrawer
        isOpen={isFollowUpModalOpen}
        onClose={() => setIsFollowUpModalOpen(false)}
        title="Schedule / Log Follow-up"
        subtitle="Record communication outcomes and set future reminders"
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
            <label className="text-[11px] font-bold text-slate-600 block mb-1">
              Communication Outcome *
            </label>
            <select
              value={followUpOutcome}
              onChange={(e) => setFollowUpOutcome(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
            >
              <option value="Interested">Interested in Demo / Proposal</option>
              <option value="Follow-up Required">Follow-up Call Required</option>
              <option value="Meeting Scheduled">In-person Meeting Scheduled</option>
              <option value="Quotation Sent">Quotation / Pricing Shared</option>
              <option value="Not Interested">Not Interested at this time</option>
              <option value="No Answer">No Answer / Left Voicemail</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                Next Follow-up Date
              </label>
              <input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                Time
              </label>
              <input
                type="time"
                value={followUpTime}
                onChange={(e) => setFollowUpTime(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">
              Call / Discussion Notes
            </label>
            <textarea
              rows={3}
              value={followUpNotes}
              onChange={(e) => setFollowUpNotes(e.target.value)}
              placeholder="Summary of conversation and customer requirements..."
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsFollowUpModalOpen(false)}
              className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={followUpMutation.isPending}
              className="px-5 py-2 bg-[#23C45E] hover:bg-[#1AA14D] text-slate-950 font-black rounded-xl text-xs cursor-pointer"
            >
              {followUpMutation.isPending ? 'Logging...' : 'Save Follow-up'}
            </button>
          </div>
        </form>
      </AdminFormDrawer>

      {/* =========================================================================
          9. CONVERT LEAD TO CUSTOMER MODAL
          ========================================================================= */}
      <AdminFormDrawer
        isOpen={isConvertModalOpen}
        onClose={() => setIsConvertModalOpen(false)}
        title="Convert Lead to Enterprise Customer"
        subtitle="Creates Customer Account, Primary Contact, and Deal in Sales Pipeline"
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
              <CheckCircle2 className="w-4 h-4 text-[#1AA14D]" /> Lead Qualification Confirmed
            </p>
            <p className="mt-1 text-[11px] text-emerald-800/90">
              Converting this lead will update status to <strong>CONVERTED</strong>, provision a verified Customer Company record, create a Customer Contact, and start a Pipeline Deal.
            </p>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">
              Customer Company Name *
            </label>
            <input
              type="text"
              required
              value={convertCompanyName}
              onChange={(e) => setConvertCompanyName(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">
              Deal Title *
            </label>
            <input
              type="text"
              required
              value={convertDealTitle}
              onChange={(e) => setConvertDealTitle(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">
              Deal Contract Value (₹) *
            </label>
            <input
              type="number"
              required
              value={convertDealValue}
              onChange={(e) => setConvertDealValue(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">
              Conversion Notes
            </label>
            <textarea
              rows={2}
              value={convertNotes}
              onChange={(e) => setConvertNotes(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsConvertModalOpen(false)}
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

      {/* Google Places Discovery Drawer — Right-Side Sheet */}
      <AdminFormDrawer
        isOpen={isPlacesDrawerOpen}
        onClose={() => setIsPlacesDrawerOpen(false)}
        title="Google Places Discovery"
        description="Search businesses and import as leads"
        icon={Globe}
        size="md"
        hideFooter
      >
        {/* Search form */}
        <form onSubmit={handleSearchGooglePlaces} className="-mx-5 sm:-mx-6 px-5 sm:px-6 pb-4 border-b border-slate-100 space-y-2">
          <div className="flex flex-col gap-2">
            <input
              type="text"
              placeholder="e.g. Gym, Restaurants, IT companies..."
              value={googleQuery}
              onChange={(e) => setGoogleQuery(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300"
            />
            <input
              type="text"
              placeholder="Location (e.g. Mumbai)"
              value={googleLocation}
              onChange={(e) => setGoogleLocation(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300"
            />
          </div>
          <button
            type="submit"
            disabled={isSearchingPlaces || !googleQuery.trim()}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-all cursor-pointer"
          >
            {isSearchingPlaces ? 'Searching...' : 'Search Google Places'}
          </button>
        </form>

        {/* Results */}
        <div className="-mx-5 sm:-mx-6 -mb-5 sm:-mb-6 divide-y divide-slate-100">
          {placesResults.length === 0 && !isSearchingPlaces && (
            <div className="py-16 text-center text-slate-400 px-5">
              <Globe className="w-10 h-10 mx-auto mb-3 text-slate-200" />
              <p className="text-sm font-bold text-slate-500">Discover Local Businesses</p>
              <p className="text-xs text-slate-400 mt-1">Enter a keyword and location above to search</p>
            </div>
          )}
          {isSearchingPlaces && (
            <div className="py-16 text-center px-5">
              <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs font-bold text-slate-400">Searching Google Places...</p>
            </div>
          )}
          {!isSearchingPlaces && placesResults.map((place: any, i: number) => {
            const displayName = place.businessName || place.title || place.name || null;
            return (
              <div
                key={i}
                className="flex items-start gap-3 px-5 sm:px-6 py-3.5 hover:bg-emerald-50/60 cursor-pointer transition-colors group"
                onClick={() => {
                  setLeadForm((prev) => ({
                    ...prev,
                    title: displayName || prev.title,
                    businessName: displayName || prev.businessName,
                    phone: place.phone || prev.phone,
                    email: place.email || prev.email,
                    website: place.website || prev.website,
                    address: place.address || prev.address,
                    city: place.city || prev.city,
                    state: place.state || prev.state,
                    country: place.country || prev.country,
                    latitude: place.latitude ? String(place.latitude) : prev.latitude,
                    longitude: place.longitude ? String(place.longitude) : prev.longitude,
                    googlePlaceId: place.googlePlaceId || place.placeId || prev.googlePlaceId,
                    rating: place.rating ? String(place.rating) : prev.rating,
                    reviewCount: place.reviewCount ? String(place.reviewCount) : prev.reviewCount,
                    source: 'GOOGLE_PLACES',
                  }));
                  setIsPlacesDrawerOpen(false);
                  setIsAddDrawerOpen(true);
                }}
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-100 transition-colors">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-xs text-slate-900 group-hover:text-emerald-700 truncate">
                    {displayName ?? 'Business'}
                  </p>
                  {place.address && (
                    <p className="text-xs text-slate-500 truncate mt-0.5">{place.address}</p>
                  )}
                  {(place.rating || place.reviewCount) && (
                    <p className="text-xs text-amber-600 font-semibold mt-0.5">
                      {place.rating && `⭐ ${place.rating}`}
                      {place.reviewCount && ` (${place.reviewCount} reviews)`}
                    </p>
                  )}
                  {place.category && (
                    <p className="text-xs text-slate-400 mt-0.5">{place.category}</p>
                  )}
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-500 flex-shrink-0 mt-1 transition-colors" />
              </div>
            );
          })}
        </div>
      </AdminFormDrawer>
    </div>
  );
}
