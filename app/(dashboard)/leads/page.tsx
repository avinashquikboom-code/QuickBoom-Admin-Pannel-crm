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

const LEAD_STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string; stageIndex: number }
> = {
  NEW: { label: 'New', bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', stageIndex: 0 },
  FOLLOW_UP: { label: 'Follow-up', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', stageIndex: 1 },
  CONTACTED: { label: 'Contacted', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', stageIndex: 1 },
  VISIT: { label: 'Visit', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', stageIndex: 2 },
  QUALIFIED: { label: 'Qualified', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', stageIndex: 3 },
  PROPOSAL: { label: 'Proposal', bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', stageIndex: 4 },
  PROPOSAL_SENT: { label: 'Proposal Sent', bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', stageIndex: 4 },
  FINAL_CALL: { label: 'Final Call', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', stageIndex: 5 },
  NEGOTIATION: { label: 'Negotiation', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', stageIndex: 5 },
  PAYMENT: { label: 'Payment', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', stageIndex: 6 },
  WORK_STARTED: { label: 'Work Started', bg: 'bg-emerald-100', text: 'text-[#1AA14D]', border: 'border-emerald-300', stageIndex: 7 },
  WON: { label: 'Won', bg: 'bg-emerald-100', text: 'text-[#1AA14D]', border: 'border-emerald-300', stageIndex: 7 },
  CONVERTED: { label: 'Converted', bg: 'bg-emerald-100', text: 'text-[#1AA14D]', border: 'border-emerald-300', stageIndex: 7 },
  LOST: { label: 'Lost', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', stageIndex: -1 },
  CANCELLED: { label: 'Cancelled', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', stageIndex: -1 },
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

function getLeadStatusConfig(status?: string | null) {
  const s = (status || 'NEW').toUpperCase();
  return (
    LEAD_STATUS_CONFIG[s] || {
      label: status || 'Unknown',
      bg: 'bg-slate-100',
      text: 'text-slate-700',
      border: 'border-slate-200',
      stageIndex: 0,
    }
  );
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

interface GooglePlaceResult {
  provider: string;
  googlePlaceId: string;
  businessName: string;
  category?: string;
  address?: string;
  phone?: string;
  website?: string;
  rating?: number;
  reviewCount?: number;
  latitude?: number;
  longitude?: number;
  googleMapsUrl?: string;
  businessStatus?: string;
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
  const [isPlacesDrawerOpen, setIsPlacesDrawerOpen] = useState(false);
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
    priority: 'MEDIUM',
    value: '50000',
    nextFollowUpDate: '',
    nextFollowUpTime: '',
    notes: '',
  });

  // Google Places Search State
  const [placeKeyword, setPlaceKeyword] = useState('Restaurants');
  const [placeLocation, setPlaceLocation] = useState('Navi Mumbai');
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);
  const [placesResults, setPlacesResults] = useState<GooglePlaceResult[]>([]);
  const [duplicateCheckedPlaces, setDuplicateCheckedPlaces] = useState<Record<string, any>>({});

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
        status: leadForm.status,
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
      toast.success(leadForm.id ? 'Lead details updated successfully!' : 'New Lead created successfully!');
      setIsAddDrawerOpen(false);
      resetLeadForm();
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
    mutationFn: async ({ status, notes }: { status: string; notes?: string }) => {
      if (!selectedLeadId) return;
      return api.patch(`/leads/${selectedLeadId}/status`, { status, notes });
    },
    onSuccess: () => {
      toast.success('Lead status updated!');
      queryClient.invalidateQueries({ queryKey: ['admin-lead-detail', selectedLeadId] });
      queryClient.invalidateQueries({ queryKey: ['admin-leads-list'] });
      queryClient.invalidateQueries({ queryKey: ['admin-leads-metrics'] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
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
      status: lead.status || 'NEW',
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

  // Google Places Search Handler
  const handleSearchGooglePlaces = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!placeKeyword.trim() || !placeLocation.trim()) {
      toast.error('Please enter search keyword and location');
      return;
    }
    setIsSearchingPlaces(true);
    try {
      const res: any = await api.post('/data-capture/extract', {
        keyword: placeKeyword.trim(),
        location: placeLocation.trim(),
        maxResults: 20,
      });

      const extractedItems: GooglePlaceResult[] = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
        ? res
        : [];
      setPlacesResults(extractedItems);

      // Check duplicates for results
      const dupMap: Record<string, any> = {};
      for (const item of extractedItems.slice(0, 10)) {
        try {
          const dupRes: any = await api.post('/leads/check-duplicate', {
            googlePlaceId: item.googlePlaceId,
            phone: item.phone,
            companyName: item.businessName,
            website: item.website,
          });
          if (dupRes?.isDuplicate || dupRes?.data?.isDuplicate) {
            dupMap[item.googlePlaceId] = dupRes?.data || dupRes;
          }
        } catch {
          // ignore duplicate check errors on bulk
        }
      }
      setDuplicateCheckedPlaces(dupMap);
      toast.success(`Discovered ${extractedItems.length} verified businesses!`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsSearchingPlaces(false);
    }
  };

  // Import Google Place into Lead directly
  const handleImportGooglePlace = async (place: GooglePlaceResult) => {
    try {
      const payload = {
        title: place.businessName,
        companyName: place.businessName,
        category: place.category || 'Local Business',
        source: 'GOOGLE_PLACES',
        firstName: place.businessName.split(' ')[0] || 'Manager',
        lastName: place.businessName.split(' ').slice(1).join(' ') || 'Team',
        phone: place.phone || undefined,
        website: place.website || undefined,
        address: place.address || undefined,
        latitude: place.latitude,
        longitude: place.longitude,
        googlePlaceId: place.googlePlaceId,
        rating: place.rating,
        reviewCount: place.reviewCount,
        status: 'NEW',
        priority: (place.rating && place.rating >= 4.5 ? 'HIGH' : 'MEDIUM') as any,
        value: 75000,
      };

      await api.post('/leads', payload);
      toast.success(`Imported "${place.businessName}" as a CRM Lead!`);
      queryClient.invalidateQueries({ queryKey: ['admin-leads-list'] });
      queryClient.invalidateQueries({ queryKey: ['admin-leads-metrics'] });
    } catch (err) {
      toast.error(getErrorMessage(err));
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
                          const conf = getLeadStatusConfig(lead.status);
                          return (
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${conf.bg} ${conf.text} ${conf.border}`}
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
                          const conf = getLeadStatusConfig(leadDetail.status);
                          return (
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span
                                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${conf.bg} ${conf.text} ${conf.border}`}
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
                          value={leadDetail.status}
                          onChange={(e) => updateStatusMutation.mutate({ status: e.target.value })}
                          disabled={updateStatusMutation.isPending || leadDetail.status === 'CONVERTED'}
                          className="px-3 py-1.5 bg-white border border-emerald-300 rounded-xl text-xs font-bold text-slate-900 shadow-xs focus:ring-2 focus:ring-[#23C45E] disabled:opacity-50"
                        >
                          <option value="NEW">New (NEW)</option>
                          <option value="FOLLOW_UP">Follow-up (FOLLOW_UP)</option>
                          <option value="CONTACTED">Contacted (CONTACTED)</option>
                          <option value="VISIT">Visit Scheduled (VISIT)</option>
                          <option value="QUALIFIED">Qualified (QUALIFIED)</option>
                          <option value="PROPOSAL_SENT">Proposal Sent (PROPOSAL_SENT)</option>
                          <option value="NEGOTIATION">Negotiation (NEGOTIATION)</option>
                          <option value="PAYMENT">Payment Pending (PAYMENT)</option>
                          <option value="CONVERTED">Won / Converted (CONVERTED)</option>
                          <option value="LOST">Lost (LOST)</option>
                          <option value="CANCELLED">Cancelled (CANCELLED)</option>
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
                        value={leadDetail.assignedToId || ''}
                        onChange={(e) => assignEmployeeMutation.mutate(e.target.value || null)}
                        disabled={assignEmployeeMutation.isPending}
                        className="px-3 py-1 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 shadow-2xs"
                      >
                        <option value="">-- Assign Employee --</option>
                        {employees.map((emp) => (
                          <option key={emp.id} value={String(emp.id)}>
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
          6. GOOGLE PLACES SEARCH DRAWER (INTEGRATED)
          ========================================================================= */}
      <AdminFormDrawer
        isOpen={isPlacesDrawerOpen}
        onClose={() => setIsPlacesDrawerOpen(false)}
        title="Google Places Prospect Search"
        subtitle="Search verified local businesses using existing Google Maps Platform Places API"
        size="lg"
      >
        <div className="space-y-6">
          {/* Search Bar */}
          <form onSubmit={handleSearchGooglePlaces} className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                Keyword / Industry
              </label>
              <input
                type="text"
                value={placeKeyword}
                onChange={(e) => setPlaceKeyword(e.target.value)}
                placeholder="e.g. Restaurants, Hospitals"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                Target City / Area
              </label>
              <input
                type="text"
                value={placeLocation}
                onChange={(e) => setPlaceLocation(e.target.value)}
                placeholder="e.g. Navi Mumbai, Bangalore"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={isSearchingPlaces}
                className="w-full py-2 bg-[#23C45E] hover:bg-[#1AA14D] text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md shadow-[#23C45E]/20 cursor-pointer disabled:opacity-50"
              >
                {isSearchingPlaces ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Globe className="w-4 h-4" />
                )}
                <span>Search Places</span>
              </button>
            </div>
          </form>

          {/* Results Stream */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-black text-slate-800 uppercase tracking-wider">
                Extracted Businesses ({placesResults.length})
              </p>
              {placesResults.length > 0 && (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                  Grounded live via Places API
                </span>
              )}
            </div>

            {isSearchingPlaces ? (
              <div className="p-12 text-center text-slate-400 font-bold text-xs animate-pulse">
                Extracting local business profiles from Google Places...
              </div>
            ) : placesResults.length > 0 ? (
              <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                {placesResults.map((p) => {
                  const isDup = duplicateCheckedPlaces[p.googlePlaceId]?.isDuplicate;

                  return (
                    <div
                      key={p.googlePlaceId}
                      className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-emerald-300 transition-colors"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-slate-900 text-sm truncate">{p.businessName}</h4>
                          {isDup && (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-black text-[9px] uppercase rounded">
                              Already in CRM
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                          {p.rating && (
                            <span className="font-extrabold text-amber-600 flex items-center gap-1">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              {p.rating} ({p.reviewCount || 0})
                            </span>
                          )}
                          {p.category && <span>• {p.category}</span>}
                          {p.phone && <span>• {p.phone}</span>}
                        </div>

                        {p.address && <p className="text-[11px] text-slate-400 truncate">{p.address}</p>}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleImportGooglePlace(p)}
                          className="px-3.5 py-1.5 bg-[#23C45E] hover:bg-[#1AA14D] text-slate-950 font-black text-xs rounded-xl flex items-center gap-1 transition-all shadow-xs cursor-pointer active:scale-95"
                        >
                          <Plus className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Import Lead</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs font-bold border border-dashed border-slate-200 rounded-2xl">
                Enter keyword and location above to discover high-value business leads.
              </div>
            )}
          </div>
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
                value={leadForm.status}
                onChange={(e) => setLeadForm({ ...leadForm, status: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
              >
                <option value="NEW">NEW</option>
                <option value="CONTACTED">CONTACTED</option>
                <option value="QUALIFIED">QUALIFIED</option>
                <option value="CONVERTED">CONVERTED</option>
                <option value="LOST">LOST</option>
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
                {employees.map((emp) => (
                  <option key={emp.id} value={String(emp.id)}>
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
    </div>
  );
}
