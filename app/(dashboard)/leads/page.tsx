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
} from '@/components/admin';
import { getErrorMessage } from '@/lib/utils';

type LeadTab = 'ALL' | 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'CONVERTED' | 'LOST';

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

  // Modals & Drawers state
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [isPlacesDrawerOpen, setIsPlacesDrawerOpen] = useState(false);
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<LeadItem | null>(null);

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
  const { data: leadsData, isLoading: isLoadingLeads, isFetching, refetch } = useQuery({
    queryKey: ['admin-leads-list', search, activeTab, sourceFilter, priorityFilter, assignedFilter],
    queryFn: async () => {
      try {
        const res: any = await api.get('/leads', {
          params: {
            search: search || undefined,
            status: activeTab !== 'ALL' ? (activeTab === 'CONVERTED' ? 'CONVERTED' : activeTab) : undefined,
          },
        });
        const items = res?.data?.data || res?.data?.items || res?.data || res?.items || res;
        return Array.isArray(items) ? items : [];
      } catch {
        return [];
      }
    },
  });

  // 2. Fetch Real Metrics
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

  // 3. Fetch Active Employees for assignment
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
  const rawLeads: LeadItem[] = Array.isArray(leadsData) ? leadsData : [];

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return rawLeads.filter((l) => {
      if (activeTab === 'NEW' && l.status !== 'NEW') return false;
      if (activeTab === 'CONTACTED' && l.status !== 'CONTACTED' && l.status !== 'FOLLOW_UP') return false;
      if (activeTab === 'QUALIFIED' && l.status !== 'QUALIFIED') return false;
      if (activeTab === 'CONVERTED' && l.status !== 'CONVERTED' && l.status !== 'WON') return false;
      if (activeTab === 'LOST' && l.status !== 'LOST' && l.status !== 'CANCELLED') return false;

      if (sourceFilter !== 'ALL' && l.source !== sourceFilter) return false;
      if (priorityFilter !== 'ALL' && l.priority !== priorityFilter) return false;
      if (assignedFilter !== 'ALL' && String(l.assignedToId) !== assignedFilter) return false;

      return true;
    });
  }, [rawLeads, activeTab, sourceFilter, priorityFilter, assignedFilter]);

  // Compute or read metrics
  const metrics = {
    total: metricsData?.total ?? rawLeads.length,
    new: metricsData?.new ?? rawLeads.filter((l) => l.status === 'NEW').length,
    contacted: metricsData?.contacted ?? rawLeads.filter((l) => l.status === 'CONTACTED' || l.status === 'FOLLOW_UP').length,
    qualified: metricsData?.qualified ?? rawLeads.filter((l) => l.status === 'QUALIFIED').length,
    converted: metricsData?.converted ?? rawLeads.filter((l) => l.status === 'CONVERTED' || l.status === 'WON').length,
    lost: metricsData?.lost ?? rawLeads.filter((l) => l.status === 'LOST' || l.status === 'CANCELLED').length,
  };

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string | number) => {
      return api.delete(`/leads/${id}`);
    },
    onSuccess: () => {
      toast.success('Lead removed successfully');
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
      if (!selectedLead) return;
      return api.post(`/leads/${selectedLead.id}/follow-ups`, {
        outcome: followUpOutcome,
        notes: followUpNotes || undefined,
        nextFollowUpDate: followUpDate ? new Date(followUpDate) : undefined,
        nextFollowUpTime: followUpTime || undefined,
      });
    },
    onSuccess: () => {
      toast.success('Follow-up logged successfully!');
      setIsFollowUpModalOpen(false);
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
      if (!selectedLead) return;
      return api.post(`/leads/${selectedLead.id}/convert`, {
        companyName: convertCompanyName.trim() || selectedLead.companyName || selectedLead.title,
        dealTitle: convertDealTitle.trim() || `${selectedLead.companyName || selectedLead.title} - Enterprise Deal`,
        dealValue: convertDealValue ? parseFloat(convertDealValue) : (selectedLead.value || 0),
        notes: convertNotes.trim() || undefined,
      });
    },
    onSuccess: (res: any) => {
      const msg = res?.data?.message || res?.message || 'Lead converted to Customer, Contact & Deal!';
      toast.success(typeof msg === 'string' ? msg : 'Lead converted successfully.');
      setIsConvertModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-leads-list'] });
      queryClient.invalidateQueries({ queryKey: ['admin-leads-metrics'] });
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

  const handleOpenEdit = (lead: LeadItem) => {
    setSelectedLead(lead);
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

  const handleOpenFollowUp = (lead: LeadItem) => {
    setSelectedLead(lead);
    setFollowUpOutcome('Interested');
    setFollowUpDate('');
    setFollowUpTime('11:00');
    setFollowUpNotes('');
    setIsFollowUpModalOpen(true);
  };

  const handleOpenConvert = (lead: LeadItem) => {
    setSelectedLead(lead);
    setConvertCompanyName(lead.companyName || lead.title || 'Client Company');
    setConvertDealTitle(`${lead.companyName || lead.title || 'Enterprise'} - Deal`);
    setConvertDealValue(String(lead.value || 100000));
    setConvertNotes('Lead qualified and ready for contract deal closing.');
    setIsConvertModalOpen(true);
  };

  // Google Places Search Handler using existing backend integration
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

      const places: GooglePlaceResult[] = res?.data?.places || res?.places || [];
      setPlacesResults(places);

      // Check duplicates for each extracted place
      const duplicateMap: Record<string, any> = {};
      for (const p of places) {
        try {
          const dupRes: any = await api.post('/leads/check-duplicate', {
            googlePlaceId: p.googlePlaceId,
            companyName: p.businessName,
            phone: p.phone !== 'N/A' ? p.phone : undefined,
          });
          const dupData = dupRes?.data || dupRes;
          if (dupData?.isDuplicate) {
            duplicateMap[p.googlePlaceId] = dupData;
          }
        } catch {
          // ignore individual check errors
        }
      }
      setDuplicateCheckedPlaces(duplicateMap);
      toast.success(`Extracted ${places.length} verified Google Places`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsSearchingPlaces(false);
    }
  };

  // Handle "Add as Lead" from Google Places Result
  const handleSelectPlaceAsLead = (place: GooglePlaceResult) => {
    const isDup = duplicateCheckedPlaces[place.googlePlaceId];
    if (isDup?.isDuplicate) {
      toast.error(`Lead already exists! Matching: ${isDup.matchReason}`);
      return;
    }

    const nameParts = place.businessName.split(' ');
    const firstName = nameParts[0] || 'Manager';
    const lastName = nameParts.slice(1).join(' ') || 'Office';

    // Parse address for city/state/country
    let city = placeLocation.split(',')[0]?.trim() || '';
    let state = 'Maharashtra';
    let country = 'India';

    setLeadForm({
      id: '',
      title: place.businessName,
      businessName: place.businessName,
      category: place.category || 'Local Business',
      source: 'GOOGLE_PLACES',
      firstName,
      lastName,
      phone: place.phone !== 'N/A' ? (place.phone || '') : '',
      email: '',
      website: place.website !== 'N/A' ? (place.website || '') : '',
      address: place.address !== 'N/A' ? (place.address || '') : '',
      city,
      state,
      country,
      latitude: place.latitude ? String(place.latitude) : '',
      longitude: place.longitude ? String(place.longitude) : '',
      googlePlaceId: place.googlePlaceId,
      rating: place.rating ? String(place.rating) : '',
      reviewCount: place.reviewCount ? String(place.reviewCount) : '',
      assignedToId: '',
      status: 'NEW',
      priority: place.rating && place.rating >= 4.5 ? 'HIGH' : 'MEDIUM',
      value: '75000',
      nextFollowUpDate: '',
      nextFollowUpTime: '',
      notes: `Captured via Google Places API Text Search. Address: ${place.address || 'N/A'}`,
    });

    setIsPlacesDrawerOpen(false);
    setIsAddDrawerOpen(true);
    toast.success('Google Places business information pre-filled!');
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-16 text-slate-800 animate-in fade-in-50 duration-200">
      {/* 1. HERO CARD */}
      <AdminPageHero
        badge={{
          text: 'LEAD MANAGEMENT',
          icon: UserCheck,
          variant: 'emerald',
        }}
        title="Leads"
        description="Discover, assign, track and convert potential customers."
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="p-2.5 bg-white/10 hover:bg-white/15 text-white rounded-2xl border border-white/10 text-xs font-black transition-all cursor-pointer backdrop-blur-xs disabled:opacity-50 active:scale-95"
              title="Refresh leads list"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin text-[#23C45E]' : ''}`} />
            </button>

            <button
              onClick={() => {
                setIsPlacesDrawerOpen(true);
                if (placesResults.length === 0) {
                  handleSearchGooglePlaces();
                }
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600/30 hover:bg-blue-600/40 text-blue-200 border border-blue-500/40 font-black rounded-2xl text-xs transition-all cursor-pointer active:scale-95 shadow-sm"
            >
              <Globe className="w-4 h-4 text-blue-400" />
              <span>Google Places</span>
            </button>

            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#23C45E] hover:bg-[#1AA14D] text-slate-950 font-black rounded-2xl text-xs shadow-md shadow-[#23C45E]/20 transition-all cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Lead</span>
            </button>
          </div>
        }
      />

      {/* 2. KPI SUMMARY CARDS (REAL BACKEND METRICS) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <AdminStatCard
          title="Total Leads"
          value={isLoadingLeads ? '...' : metrics.total}
          description="In Active CRM Pipeline"
          icon={UserCheck}
          iconBg="primary"
          onClick={() => setActiveTab('ALL')}
        />
        <AdminStatCard
          title="New Leads"
          value={isLoadingLeads ? '...' : metrics.new}
          description="Uncontacted prospects"
          icon={Sparkles}
          iconBg="blue"
          onClick={() => setActiveTab('NEW')}
        />
        <AdminStatCard
          title="Contacted"
          value={isLoadingLeads ? '...' : metrics.contacted}
          description="Discovery in progress"
          icon={Phone}
          iconBg="purple"
          onClick={() => setActiveTab('CONTACTED')}
        />
        <AdminStatCard
          title="Qualified"
          value={isLoadingLeads ? '...' : metrics.qualified}
          description="High budget intent"
          icon={Award}
          iconBg="amber"
          onClick={() => setActiveTab('QUALIFIED')}
        />
        <AdminStatCard
          title="Converted"
          value={isLoadingLeads ? '...' : metrics.converted}
          description="Active customer accounts"
          icon={CheckCircle2}
          iconBg="primary"
          onClick={() => setActiveTab('CONVERTED')}
        />
        <AdminStatCard
          title="Lost / Closed"
          value={isLoadingLeads ? '...' : metrics.lost}
          description="Disqualified or lost"
          icon={XCircle}
          iconBg="slate"
          onClick={() => setActiveTab('LOST')}
        />
      </div>

      {/* 3. TABS & FILTER TOOLBAR */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-4 sm:p-5 space-y-4">
        {/* Top Status Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1 border-b border-slate-100">
          {(
            [
              { key: 'ALL', label: 'All Leads', count: metrics.total },
              { key: 'NEW', label: 'New', count: metrics.new },
              { key: 'CONTACTED', label: 'Contacted', count: metrics.contacted },
              { key: 'QUALIFIED', label: 'Qualified', count: metrics.qualified },
              { key: 'CONVERTED', label: 'Converted', count: metrics.converted },
              { key: 'LOST', label: 'Lost', count: metrics.lost },
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
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, company, email..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
            />
          </div>

          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
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
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
          >
            <option value="ALL">All Priorities</option>
            <option value="URGENT">Urgent Priority</option>
            <option value="HIGH">High Priority</option>
            <option value="MEDIUM">Medium Priority</option>
            <option value="LOW">Low Priority</option>
          </select>

          <select
            value={assignedFilter}
            onChange={(e) => setAssignedFilter(e.target.value)}
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

                  return (
                    <tr key={lead.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Lead & Business Name */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#1AA14D] border border-emerald-200/60 flex items-center justify-center font-black shrink-0 shadow-2xs">
                            {lead.googlePlaceId ? <Globe className="w-4 h-4 text-blue-600" /> : <Building className="w-4 h-4" />}
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={`/leads/${lead.id}`}
                              className="font-extrabold text-slate-900 hover:text-[#1AA14D] text-sm truncate block transition-colors"
                            >
                              {compName}
                            </Link>
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
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            isConverted
                              ? 'bg-emerald-100 text-[#1AA14D] border border-emerald-300'
                              : lead.status === 'QUALIFIED'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : lead.status === 'CONTACTED' || lead.status === 'FOLLOW_UP'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : lead.status === 'LOST'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {lead.status}
                        </span>
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
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/leads/${lead.id}`}
                            className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 hover:text-[#1AA14D] transition-colors"
                            title="View Lead Profile"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>

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
      </div>

      {/* =========================================================================
          5. GOOGLE PLACES SEARCH DRAWER (INTEGRATED)
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
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                Extracted Results ({placesResults.length})
              </span>
              <span className="text-[10px] font-bold text-slate-400">
                Click "Add as Lead" to prefill the CRM form
              </span>
            </div>

            {isSearchingPlaces ? (
              <div className="py-12 text-center text-slate-400 text-xs font-bold animate-pulse">
                Querying Google Places API (New)...
              </div>
            ) : placesResults.length > 0 ? (
              placesResults.map((place) => {
                const dupInfo = duplicateCheckedPlaces[place.googlePlaceId];
                const isDup = Boolean(dupInfo?.isDuplicate);

                return (
                  <div
                    key={place.googlePlaceId}
                    className={`p-4 rounded-2xl border transition-all ${
                      isDup
                        ? 'bg-amber-50/60 border-amber-200'
                        : 'bg-white border-slate-200 hover:border-[#23C45E]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-black text-slate-900 text-sm truncate">
                            {place.businessName}
                          </h4>
                          {place.category && (
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                              {place.category}
                            </span>
                          )}
                          {isDup && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[10px] font-black flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> Already In Leads ({dupInfo.matchReason})
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{place.address || 'Address on file'}</span>
                        </p>

                        <div className="flex items-center gap-4 text-xs font-bold pt-1 flex-wrap">
                          {place.phone && place.phone !== 'N/A' && (
                            <span className="text-slate-700 flex items-center gap-1">
                              <Phone className="w-3 h-3 text-[#23C45E]" /> {place.phone}
                            </span>
                          )}
                          {place.rating && (
                            <span className="text-amber-600 flex items-center gap-1">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              {place.rating} ({place.reviewCount || 0})
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0">
                        {isDup ? (
                          <Link
                            href={`/leads/${dupInfo.existingLead?.id}`}
                            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs rounded-xl inline-block transition-all shadow-xs"
                          >
                            View Lead
                          </Link>
                        ) : (
                          <button
                            onClick={() => handleSelectPlaceAsLead(place)}
                            className="px-3.5 py-1.5 bg-[#23C45E] hover:bg-[#1AA14D] text-slate-950 font-black text-xs rounded-xl transition-all shadow-xs cursor-pointer active:scale-95 flex items-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add as Lead</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs font-bold">
                No Google Places search results found.
              </div>
            )}
          </div>
        </div>
      </AdminFormDrawer>

      {/* =========================================================================
          6. ADD / EDIT LEAD DRAWER (STRUCTURED)
          ========================================================================= */}
      <AdminFormDrawer
        isOpen={isAddDrawerOpen}
        onClose={() => setIsAddDrawerOpen(false)}
        title={leadForm.id ? 'Edit CRM Lead' : 'Create New Lead'}
        subtitle="Capture complete prospective client, location, deal value, and pipeline details"
        size="lg"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveLeadMutation.mutate();
          }}
          className="space-y-6"
        >
          {/* SECTION 1: BASIC INFORMATION */}
          <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-[#23C45E]" /> Basic Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Business / Company Name *
                </label>
                <input
                  type="text"
                  required
                  value={leadForm.businessName}
                  onChange={(e) => setLeadForm({ ...leadForm, businessName: e.target.value })}
                  placeholder="e.g. Acme Enterprises"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Opportunity Title
                </label>
                <input
                  type="text"
                  value={leadForm.title}
                  onChange={(e) => setLeadForm({ ...leadForm, title: e.target.value })}
                  placeholder="e.g. Cloud ERP Deployment"
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
                  placeholder="e.g. IT, Healthcare, Retail"
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
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
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
            </div>
          </div>

          {/* SECTION 2: CONTACT INFORMATION */}
          <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-blue-600" /> Contact Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  value={leadForm.firstName}
                  onChange={(e) => setLeadForm({ ...leadForm, firstName: e.target.value })}
                  placeholder="e.g. Rajesh"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  value={leadForm.lastName}
                  onChange={(e) => setLeadForm({ ...leadForm, lastName: e.target.value })}
                  placeholder="e.g. Sharma"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={leadForm.phone}
                  onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                  placeholder="e.g. +91 98200 12345"
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
                  placeholder="e.g. contact@acme.com"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Website URL
                </label>
                <input
                  type="text"
                  value={leadForm.website}
                  onChange={(e) => setLeadForm({ ...leadForm, website: e.target.value })}
                  placeholder="e.g. https://acme.com"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: LOCATION & GOOGLE PLACES */}
          <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-amber-600" /> Location & Google Places
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Full Street Address
                </label>
                <input
                  type="text"
                  value={leadForm.address}
                  onChange={(e) => setLeadForm({ ...leadForm, address: e.target.value })}
                  placeholder="e.g. 101 Corporate Towers, Bandra Kurla Complex"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={leadForm.city}
                  onChange={(e) => setLeadForm({ ...leadForm, city: e.target.value })}
                  placeholder="e.g. Mumbai"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  State
                </label>
                <input
                  type="text"
                  value={leadForm.state}
                  onChange={(e) => setLeadForm({ ...leadForm, state: e.target.value })}
                  placeholder="e.g. Maharashtra"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>

              {leadForm.googlePlaceId && (
                <div className="sm:col-span-2 p-2.5 bg-blue-50/80 rounded-xl border border-blue-200 text-xs font-mono text-blue-900 flex items-center justify-between">
                  <span>Google Place ID: {leadForm.googlePlaceId}</span>
                  {leadForm.rating && <span>Rating: ★ {leadForm.rating}</span>}
                </div>
              )}
            </div>
          </div>

          {/* SECTION 4: CRM PIPELINE & ASSIGNMENT */}
          <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-[#23C45E]" /> CRM & Assignment
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Assigned Sales Rep
                </label>
                <select
                  value={leadForm.assignedToId}
                  onChange={(e) => setLeadForm({ ...leadForm, assignedToId: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                >
                  <option value="">-- Unassigned --</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={String(emp.id)}>
                      {emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`} ({emp.employeeCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Pipeline Stage
                </label>
                <select
                  value={leadForm.status}
                  onChange={(e) => setLeadForm({ ...leadForm, status: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                >
                  <option value="NEW">NEW</option>
                  <option value="CONTACTED">CONTACTED</option>
                  <option value="FOLLOW_UP">FOLLOW_UP</option>
                  <option value="QUALIFIED">QUALIFIED</option>
                  <option value="PROPOSAL">PROPOSAL</option>
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
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="URGENT">URGENT</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Expected Deal Value (₹)
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
                  Follow-up Date
                </label>
                <input
                  type="date"
                  value={leadForm.nextFollowUpDate}
                  onChange={(e) => setLeadForm({ ...leadForm, nextFollowUpDate: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Follow-up Time
                </label>
                <input
                  type="time"
                  value={leadForm.nextFollowUpTime}
                  onChange={(e) => setLeadForm({ ...leadForm, nextFollowUpTime: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsAddDrawerOpen(false)}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saveLeadMutation.isPending}
              className="px-6 py-2.5 bg-[#23C45E] hover:bg-[#1AA14D] text-slate-950 font-black rounded-xl text-xs shadow-md shadow-[#23C45E]/20 cursor-pointer transition-all disabled:opacity-50"
            >
              {saveLeadMutation.isPending ? 'Saving...' : leadForm.id ? 'Save Changes' : 'Create CRM Lead'}
            </button>
          </div>
        </form>
      </AdminFormDrawer>

      {/* =========================================================================
          7. LOG FOLLOW-UP MODAL
          ========================================================================= */}
      <AdminFormDrawer
        isOpen={isFollowUpModalOpen}
        onClose={() => setIsFollowUpModalOpen(false)}
        title="Log Follow-up Call & Schedule Next"
        subtitle={selectedLead ? `Lead: ${selectedLead.companyName || selectedLead.title}` : ''}
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
              Call Outcome *
            </label>
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
              Interaction Notes
            </label>
            <textarea
              rows={3}
              value={followUpNotes}
              onChange={(e) => setFollowUpNotes(e.target.value)}
              placeholder="Spoke with decision maker regarding features and pricing..."
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
          8. CONVERT LEAD TO CUSTOMER MODAL
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
