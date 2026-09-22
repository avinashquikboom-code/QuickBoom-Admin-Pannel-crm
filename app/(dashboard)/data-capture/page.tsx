'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Database,
  Search,
  Download,
  Sparkles,
  CheckCircle2,
  Clock,
  Plus,
  Globe,
  Layers,
  MapPin,
  Tag,
  Star,
  Phone,
  Mail,
  ExternalLink,
  ShieldCheck,
  UserPlus,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  Check,
  X,
  AlertTriangle,
  FileText,
  Building,
  Filter,
  ArrowRight,
  HelpCircle,
  Copy,
  ChevronLeft,
  ChevronRight,
  Zap,
  Activity,
  History,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { hasPermission } from '@/lib/access-control';
import {
  AdminPageHero,
  AdminStatCard,
  AdminCard,
  AdminButton,
  AdminStatusBadge,
  AdminFormDrawer,
  AdminConfirmDialog,
  AdminSearchInput,
  AdminPagination,
} from '@/components/admin';
import { getErrorMessage } from '@/lib/utils';

interface DuplicateMatch {
  type: 'LEAD' | 'COMPANY' | 'CONTACT' | 'DATA_CAPTURE';
  id: number;
  title: string;
  matchField: 'googlePlaceId' | 'phone' | 'email' | 'website' | 'businessName';
  matchValue: string;
  status?: string;
}

interface CapturedPlace {
  id?: number;
  provider: string;
  googlePlaceId?: string;
  businessName: string;
  category?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  rating?: number;
  reviewCount?: number;
  latitude?: number;
  longitude?: number;
  googleMapsUrl?: string;
  businessStatus?: string;
  source?: string;
  status?: string;
  notes?: string;
  rawData?: any;
  isImported?: boolean;
  importedLeadId?: number;
  capturedAt: string;
  updatedAt?: string;
  customerId?: string;
  extractionJobId?: string;
  duplicateMatches?: DuplicateMatch[];
}

interface UsageSummary {
  totalExtractions: number;
  totalLeadsCaptured: number;
  totalGoogleApiCalls: number;
  quotaLimit: number;
  quotaRemaining: number;
  validatedCount?: number;
  convertedCount?: number;
}

type StatusTab = 'ALL' | 'CAPTURED' | 'VALIDATED' | 'REJECTED' | 'DUPLICATE' | 'LEAD_CREATED';

const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string }
> = {
  ALL: { label: 'All Records', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
  CAPTURED: { label: 'Captured', bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
  VALIDATED: { label: 'Validated', bg: 'bg-emerald-50', text: 'text-[#1AA14D]', border: 'border-emerald-200' },
  REJECTED: { label: 'Rejected', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  DUPLICATE: { label: 'Duplicate', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  LEAD_CREATED: { label: 'Lead Created', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
};

export default function DataCapturePage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  // Button-level permissions
  const canCreate = hasPermission(user, ['data_capture.create', 'DATA_CAPTURE:CREATE', 'employee.data_capture.create', 'data_capture.manage']);
  const canEdit = hasPermission(user, ['data_capture.edit', 'DATA_CAPTURE:EDIT', 'employee.data_capture.edit', 'data_capture.manage']);
  const canDelete = hasPermission(user, ['data_capture.delete', 'DATA_CAPTURE:DELETE', 'employee.data_capture.delete', 'data_capture.manage']);

  // Filters & Pagination State
  const [activeTab, setActiveTab] = useState<StatusTab>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  // Selection State
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Right-side Detail Drawer State
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<CapturedPlace | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<CapturedPlace>>({});
  const [showRawData, setShowRawData] = useState(false);

  // Google Places Extraction Modal State
  const [extractModalOpen, setExtractModalOpen] = useState(false);
  const [extractKeyword, setExtractKeyword] = useState('Gyms');
  const [extractLocation, setExtractLocation] = useState('Vadodara');
  const [extractMaxResults, setExtractMaxResults] = useState('20');
  const [isExtracting, setIsExtracting] = useState(false);

  // Manual Add Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newRecordForm, setNewRecordForm] = useState({
    businessName: '',
    firstName: '',
    lastName: '',
    mobile: '',
    category: '',
    phone: '',
    email: '',
    website: '',
    address: '',
    notes: '',
  });

  // Action Dialogs
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<number | null>(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [leadDuplicateConfirmOpen, setLeadDuplicateConfirmOpen] = useState(false);

  // 1. Fetch Usage Metrics with graceful fallback
  const { data: usage, refetch: refetchUsage } = useQuery<UsageSummary>({
    queryKey: ['data-capture-usage'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/data-capture/usage');
        return res?.data || res || {
          totalExtractions: 0,
          totalLeadsCaptured: 0,
          totalGoogleApiCalls: 0,
          quotaLimit: 1000,
          quotaRemaining: 1000,
        };
      } catch {
        return {
          totalExtractions: 0,
          totalLeadsCaptured: 0,
          totalGoogleApiCalls: 0,
          quotaLimit: 1000,
          quotaRemaining: 1000,
        };
      }
    },
  });

  // 2. Fetch Data Capture Places List
  const {
    data: listResponse,
    isLoading,
    isError,
    error,
    refetch: refetchList,
  } = useQuery({
    queryKey: ['data-capture-list', page, limit, activeTab, sourceFilter, searchQuery],
    queryFn: async () => {
      const params: any = {
        page,
        limit,
        status: activeTab,
        source: sourceFilter,
      };
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }
      const res: any = await api.get('/data-capture', { params });

      // Robustly extract items array from various API response shapes
      let items: CapturedPlace[] = [];
      if (Array.isArray(res)) {
        items = res;
      } else if (Array.isArray(res?.data)) {
        items = res.data;
      } else if (Array.isArray(res?.items)) {
        items = res.items;
      } else if (Array.isArray(res?.data?.data)) {
        items = res.data.data;
      } else if (Array.isArray(res?.data?.items)) {
        items = res.data.items;
      }

      const pagination = res?.pagination || res?.meta || res?.data?.pagination || res?.data?.meta || {};
      const total = Number(
        pagination?.total ??
        res?.total ??
        res?.data?.total ??
        items.length
      );
      const totalPages = Number(
        pagination?.totalPages ??
        res?.totalPages ??
        res?.data?.totalPages ??
        Math.max(1, Math.ceil(total / limit))
      );

      return {
        data: items,
        total,
        totalPages,
        page: Number(pagination?.page ?? res?.page ?? page),
        limit: Number(pagination?.limit ?? pagination?.pageSize ?? res?.limit ?? limit),
      };
    },
  });

  const places: CapturedPlace[] = listResponse?.data || [];
  const totalCount = listResponse?.total || 0;
  const totalPages = listResponse?.totalPages || 1;

  // Single Record Query for Drawer
  const openDetailDrawer = async (record: CapturedPlace) => {
    setSelectedRecord(record);
    setEditForm({
      businessName: record.businessName,
      category: record.category || '',
      phone: record.phone || '',
      email: record.email || '',
      website: record.website || '',
      address: record.address || '',
      notes: record.notes || '',
      status: record.status || 'CAPTURED',
    });
    setIsEditing(false);
    setShowRawData(false);
    setDrawerOpen(true);

    if (record.id) {
      try {
        const detailed: any = await api.get(`/data-capture/${record.id}`);
        const data = detailed?.data || detailed;
        if (data) {
          setSelectedRecord(data);
          setEditForm({
            businessName: data.businessName,
            category: data.category || '',
            phone: data.phone || '',
            email: data.email || '',
            website: data.website || '',
            address: data.address || '',
            notes: data.notes || '',
            status: data.status || 'CAPTURED',
          });
        }
      } catch {
        // use initial record state
      }
    }
  };

  // Mutations
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<CapturedPlace> }) => {
      return api.patch(`/data-capture/${id}`, data);
    },
    onSuccess: (res: any) => {
      const updated = res?.data || res;
      toast.success('Record updated successfully!');
      setIsEditing(false);
      if (updated) setSelectedRecord(updated);
      queryClient.invalidateQueries({ queryKey: ['data-capture-list'] });
      queryClient.invalidateQueries({ queryKey: ['data-capture-usage'] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const createLeadMutation = useMutation({
    mutationFn: async (id: number) => {
      return api.post(`/data-capture/${id}/create-lead`);
    },
    onSuccess: (res: any) => {
      const data = res?.data || res;
      toast.success(data?.message || 'Lead created successfully in CRM!', { icon: '🎯' });
      setDrawerOpen(false);
      setLeadDuplicateConfirmOpen(false);
      queryClient.invalidateQueries({ queryKey: ['data-capture-list'] });
      queryClient.invalidateQueries({ queryKey: ['data-capture-usage'] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const validateMutation = useMutation({
    mutationFn: async (id: number) => {
      return api.post(`/data-capture/${id}/validate`);
    },
    onSuccess: (res: any) => {
      const data = res?.data || res;
      toast.success('Prospect marked as VALIDATED!');
      if (selectedRecord && data) setSelectedRecord({ ...selectedRecord, status: 'VALIDATED' });
      queryClient.invalidateQueries({ queryKey: ['data-capture-list'] });
      queryClient.invalidateQueries({ queryKey: ['data-capture-usage'] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason?: string }) => {
      return api.post(`/data-capture/${id}/reject`, { reason });
    },
    onSuccess: (res: any) => {
      const data = res?.data || res;
      toast.success('Prospect marked as REJECTED');
      setRejectModalOpen(false);
      setRejectReason('');
      if (selectedRecord && data) setSelectedRecord({ ...selectedRecord, status: 'REJECTED' });
      queryClient.invalidateQueries({ queryKey: ['data-capture-list'] });
      queryClient.invalidateQueries({ queryKey: ['data-capture-usage'] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return api.delete(`/data-capture/${id}`);
    },
    onSuccess: () => {
      toast.success('Record deleted successfully');
      setDeleteConfirmOpen(false);
      setRecordToDelete(null);
      setDrawerOpen(false);
      queryClient.invalidateQueries({ queryKey: ['data-capture-list'] });
      queryClient.invalidateQueries({ queryKey: ['data-capture-usage'] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const bulkActionMutation = useMutation({
    mutationFn: async ({ ids, action, reason }: { ids: number[]; action: any; reason?: string }) => {
      return api.post('/data-capture/bulk', { ids, action, reason });
    },
    onSuccess: (res: any) => {
      const data = res?.data || res;
      toast.success(data?.message || 'Bulk operation completed successfully!');
      setSelectedIds([]);
      queryClient.invalidateQueries({ queryKey: ['data-capture-list'] });
      queryClient.invalidateQueries({ queryKey: ['data-capture-usage'] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const manualCreateMutation = useMutation({
    mutationFn: async (data: any) => {
      return api.post('/data-capture', data);
    },
    onSuccess: () => {
      toast.success('New Data Capture record added successfully!');
      setCreateModalOpen(false);
      setNewRecordForm({
        businessName: '',
        firstName: '',
        lastName: '',
        mobile: '',
        category: '',
        phone: '',
        email: '',
        website: '',
        address: '',
        notes: '',
      });
      queryClient.invalidateQueries({ queryKey: ['data-capture-list'] });
      queryClient.invalidateQueries({ queryKey: ['data-capture-usage'] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  // Handlers
  const handleSelectRow = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleSelectAllOnPage = () => {
    const pageIds = places.map((p) => p.id).filter(Boolean) as number[];
    if (selectedIds.length === pageIds.length && pageIds.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(pageIds);
    }
  };

  const handleStartGoogleExtraction = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!extractKeyword.trim() || !extractLocation.trim()) {
      toast.error('Please enter both search keyword and location');
      return;
    }

    const requestedNum = parseInt(extractMaxResults, 10) || 20;
    setIsExtracting(true);
    const toastId = toast.loading(
      `Querying Google Places API (New) for "${extractKeyword.trim()} in ${extractLocation.trim()}"...`
    );

    try {
      const res: any = await api.post('/data-capture/extract', {
        keyword: extractKeyword.trim(),
        location: extractLocation.trim(),
        maxResults: requestedNum,
      });

      toast.dismiss(toastId);
      setIsExtracting(false);
      setExtractModalOpen(false);

      const capturedCount = res?.captured || res?.places?.length || requestedNum;
      toast.success(`Google Places: Extracted & saved ${capturedCount} verified businesses!`);
      queryClient.invalidateQueries({ queryKey: ['data-capture-list'] });
      queryClient.invalidateQueries({ queryKey: ['data-capture-usage'] });
    } catch (err: any) {
      toast.dismiss(toastId);
      setIsExtracting(false);
      toast.error(getErrorMessage(err));
    }
  };

  const handleExportCSV = (exportPlaces: CapturedPlace[]) => {
    if (exportPlaces.length === 0) {
      toast.error('No places available to export');
      return;
    }

    const headers = [
      'ID',
      'Business Name',
      'Category',
      'Status',
      'Source',
      'Phone',
      'Email',
      'Website',
      'Address',
      'Rating',
      'Review Count',
      'Google Place ID',
      'Google Maps URL',
      'Captured Date',
    ];

    const rows = exportPlaces.map((p) => [
      p.id || '',
      `"${(p.businessName || '').replace(/"/g, '""')}"`,
      `"${(p.category || '').replace(/"/g, '""')}"`,
      p.status || 'CAPTURED',
      p.source || 'GOOGLE_PLACES',
      `"${p.phone || ''}"`,
      `"${p.email || ''}"`,
      `"${p.website || ''}"`,
      `"${(p.address || '').replace(/"/g, '""')}"`,
      p.rating || '',
      p.reviewCount || '',
      `"${p.googlePlaceId || ''}"`,
      `"${p.googleMapsUrl || ''}"`,
      `"${p.capturedAt || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `data_capture_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${exportPlaces.length} records to CSV!`);
  };

  const handleCreateLeadClick = () => {
    if (!selectedRecord?.id) return;
    const hasLeadDuplicates = (selectedRecord.duplicateMatches || []).some((m) => m.type === 'LEAD');
    if (hasLeadDuplicates) {
      setLeadDuplicateConfirmOpen(true);
    } else {
      createLeadMutation.mutate(selectedRecord.id);
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-16 text-slate-800 animate-in fade-in-50 duration-200">
      {/* 1. HERO HEADER */}
      <AdminPageHero
        title="Data Capture"
        description="Extract, verify, and convert business prospects into active CRM Leads with Google Places API integration."
        badge={{
          text: 'DATA CAPTURE & PROSPECTION',
          icon: Globe,
          variant: 'emerald',
        }}
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => {
                refetchList();
                refetchUsage();
              }}
              className="p-2.5 bg-white/10 hover:bg-white/15 text-white rounded-2xl border border-white/10 text-xs font-black transition-all cursor-pointer backdrop-blur-xs active:scale-95 flex items-center gap-1.5"
              title="Refresh capture list and quota"
            >
              <RefreshCw className="w-4 h-4 text-[#23C45E]" />
              <span className="hidden sm:inline text-xs">Sync</span>
            </button>

            <Link
              href="/data-capture/history"
              className="px-3.5 py-2.5 bg-white/10 hover:bg-white/15 text-white rounded-2xl border border-white/10 text-xs font-bold transition-all cursor-pointer backdrop-blur-xs flex items-center gap-1.5"
            >
              <History className="w-4 h-4 text-sky-400" />
              <span>Job History</span>
            </Link>

            <Link
              href="/data-capture/usage"
              className="px-3.5 py-2.5 bg-white/10 hover:bg-white/15 text-white rounded-2xl border border-white/10 text-xs font-bold transition-all cursor-pointer backdrop-blur-xs flex items-center gap-1.5"
            >
              <Activity className="w-4 h-4 text-purple-400" />
              <span>Usage & Quota</span>
            </Link>

            {canCreate && (
              <>
                <AdminButton
                  variant="outline"
                  size="sm"
                  icon={Plus}
                  onClick={() => setCreateModalOpen(true)}
                  className="bg-white text-slate-900 border-white hover:bg-slate-50"
                >
                  Add Record
                </AdminButton>

                <AdminButton
                  variant="primary"
                  size="sm"
                  icon={Search}
                  onClick={() => setExtractModalOpen(true)}
                >
                  Extract Places
                </AdminButton>
              </>
            )}
          </div>
        }
      />

      {/* 2. KPI STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard
          title="Total Captured"
          value={usage?.totalLeadsCaptured || totalCount}
          description="Verified business records"
          icon={Database}
          iconBg="primary"
        />
        <AdminStatCard
          title="Validated Prospects"
          value={usage?.validatedCount || places.filter((p) => p.status === 'VALIDATED').length}
          description="Reviewed & ready for lead creation"
          icon={ShieldCheck}
          iconBg="primary"
        />
        <AdminStatCard
          title="Converted to Leads"
          value={usage?.convertedCount || places.filter((p) => p.isImported || p.status === 'LEAD_CREATED').length}
          description="Active in CRM Pipeline"
          icon={UserPlus}
          iconBg="purple"
        />
        <AdminStatCard
          title="API Quota Remaining"
          value={`${usage?.quotaRemaining || 1000} / ${usage?.quotaLimit || 1000}`}
          description={`${usage?.totalGoogleApiCalls || 0} API requests made`}
          icon={Layers}
          iconBg="blue"
        />
      </div>

      {/* 3. STATUS TABS & SEARCH / FILTER BAR */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-xs space-y-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
          {(['ALL', 'CAPTURED', 'VALIDATED', 'LEAD_CREATED', 'DUPLICATE', 'REJECTED'] as StatusTab[]).map((tab) => {
            const conf = STATUS_CONFIG[tab];
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setPage(1);
                }}
                className={`px-4 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer shrink-0 flex items-center gap-2 border ${
                  isActive
                    ? 'bg-[#1AA14D] text-white border-[#1AA14D] shadow-sm shadow-emerald-600/20'
                    : 'bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span>{conf.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search, Source Filter & Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-3 w-full sm:w-auto flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search business name, phone, email, category..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-[#23C45E] focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 hidden md:inline">Source:</span>
              <select
                value={sourceFilter}
                onChange={(e) => {
                  setSourceFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
              >
                <option value="ALL">All Sources</option>
                <option value="GOOGLE_PLACES">Google Places</option>
                <option value="MANUAL">Manual Entry</option>
              </select>
            </div>

            <AdminButton
              variant="outline"
              size="sm"
              icon={Download}
              onClick={() =>
                handleExportCSV(
                  selectedIds.length > 0
                    ? places.filter((p) => p.id && selectedIds.includes(p.id))
                    : places
                )
              }
              disabled={places.length === 0}
            >
              Export CSV
            </AdminButton>
          </div>
        </div>
      </div>

      {/* 4. BULK ACTIONS BAR (When records selected) */}
      {selectedIds.length > 0 && (
        <div className="bg-[#1B2533] text-white rounded-2xl px-5 py-3 shadow-lg flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5 text-xs font-bold">
            <span className="w-6 h-6 rounded-full bg-[#23C45E] text-slate-950 flex items-center justify-center font-black text-[11px]">
              {selectedIds.length}
            </span>
            <span>records selected</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {canEdit && (
              <>
                <button
                  onClick={() => bulkActionMutation.mutate({ ids: selectedIds, action: 'validate' })}
                  disabled={bulkActionMutation.isPending}
                  className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Validate All</span>
                </button>

                <button
                  onClick={() => bulkActionMutation.mutate({ ids: selectedIds, action: 'import_leads' })}
                  disabled={bulkActionMutation.isPending}
                  className="px-3 py-1.5 bg-[#23C45E] hover:bg-[#1AA14D] text-slate-950 font-black rounded-xl text-xs transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Import to CRM Leads</span>
                </button>

                <button
                  onClick={() => bulkActionMutation.mutate({ ids: selectedIds, action: 'mark_duplicate' })}
                  disabled={bulkActionMutation.isPending}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                >
                  <span>Mark Duplicate</span>
                </button>
              </>
            )}

            {canDelete && (
              <button
                onClick={() => bulkActionMutation.mutate({ ids: selectedIds, action: 'delete' })}
                disabled={bulkActionMutation.isPending}
                className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            )}

            <button
              onClick={() => setSelectedIds([])}
              className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Deselect
            </button>
          </div>
        </div>
      )}

      {/* 5. DATA TABLE & LISTING */}
      <AdminCard
        title="Captured Business Prospects"
        description={`Showing ${places.length} of ${totalCount} records • Page ${page} of ${totalPages}`}
        headerActions={
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-bold hidden sm:inline">Per page:</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700"
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
        }
      >
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-3 border-[#23C45E] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-bold text-slate-500">Loading captured records from database...</p>
          </div>
        ) : isError ? (
          <div className="py-16 text-center space-y-3">
            <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
            <p className="text-sm font-bold text-slate-800">Failed to load data capture records.</p>
            <p className="text-xs text-slate-500">{getErrorMessage(error)}</p>
            <AdminButton variant="outline" size="sm" onClick={() => refetchList()}>
              Retry
            </AdminButton>
          </div>
        ) : places.length === 0 ? (
          <div className="py-20 text-center space-y-4">
            <div className="w-14 h-14 rounded-3xl bg-emerald-50 text-[#1AA14D] flex items-center justify-center mx-auto border border-emerald-200">
              <Database className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-900">No Captured Records Found</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No prospect records match your current status or search filter. Extract prospects from Google Places or create a manual entry.
              </p>
            </div>
            {canCreate && (
              <div className="flex items-center justify-center gap-3 pt-2">
                <AdminButton
                  variant="primary"
                  size="sm"
                  icon={Search}
                  onClick={() => setExtractModalOpen(true)}
                >
                  Extract from Google Places
                </AdminButton>
                <AdminButton
                  variant="outline"
                  size="sm"
                  icon={Plus}
                  onClick={() => setCreateModalOpen(true)}
                >
                  Manual Entry
                </AdminButton>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-xs text-left min-w-[850px]">
              <thead className="bg-slate-50 text-slate-500 font-black uppercase text-[10px] tracking-wider border-b border-slate-100">
                <tr>
                  <th className="p-3.5 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === places.length && places.length > 0}
                      onChange={handleSelectAllOnPage}
                      className="rounded text-[#23C45E] focus:ring-[#23C45E] cursor-pointer"
                    />
                  </th>
                  <th className="p-3.5">Business Name & Category</th>
                  <th className="p-3.5">Contact Info</th>
                  <th className="p-3.5">Address</th>
                  <th className="p-3.5">Rating & Reviews</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Source</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {places.map((place) => {
                  const isSelected = place.id ? selectedIds.includes(place.id) : false;
                  const statusConf = STATUS_CONFIG[place.status || 'CAPTURED'] || STATUS_CONFIG.CAPTURED;

                  return (
                    <tr
                      key={place.id || place.googlePlaceId}
                      onClick={() => openDetailDrawer(place)}
                      className={`hover:bg-slate-50/80 transition-colors cursor-pointer ${
                        isSelected ? 'bg-[#E8F9EE]/30' : ''
                      }`}
                    >
                      <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => place.id && handleSelectRow(place.id)}
                          className="rounded text-[#23C45E] focus:ring-[#23C45E] cursor-pointer"
                        />
                      </td>
                      <td className="p-3.5">
                        <p className="font-black text-slate-900 hover:text-emerald-700 transition-colors">
                          {place.businessName}
                        </p>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mt-0.5">
                          {place.category || 'General Business'}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <div className="space-y-0.5">
                          {place.phone && place.phone !== 'N/A' ? (
                            <span className="flex items-center gap-1.5 text-slate-800 font-bold">
                              <Phone className="w-3 h-3 text-[#23C45E]" />
                              {place.phone}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">No phone</span>
                          )}
                          {place.email && (
                            <span className="flex items-center gap-1.5 text-slate-600 text-[11px]">
                              <Mail className="w-3 h-3 text-slate-400" />
                              {place.email}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3.5 max-w-xs">
                        <span className="text-slate-600 truncate block text-[11px]" title={place.address}>
                          {place.address || 'N/A'}
                        </span>
                      </td>
                      <td className="p-3.5">
                        {place.rating ? (
                          <div className="flex items-center gap-1.5">
                            <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-black flex items-center gap-0.5">
                              <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                              {place.rating}
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold">
                              ({place.reviewCount || 0})
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[10px]">No ratings</span>
                        )}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase border ${statusConf.bg} ${statusConf.text} ${statusConf.border}`}
                        >
                          {statusConf.label}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className="text-[10px] font-bold text-slate-500 uppercase px-2 py-0.5 bg-slate-100 rounded-md">
                          {place.source || 'GOOGLE_PLACES'}
                        </span>
                      </td>
                      <td className="p-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openDetailDrawer(place)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Inspect details in drawer"
                          >
                            <Eye className="w-4 h-4 text-emerald-600" />
                          </button>

                          {canEdit && place.status !== 'LEAD_CREATED' && !place.isImported && (
                            <button
                              onClick={() => {
                                setSelectedRecord(place);
                                if (place.id) {
                                  createLeadMutation.mutate(place.id);
                                }
                              }}
                              disabled={createLeadMutation.isPending}
                              className="p-1.5 text-slate-500 hover:text-[#1AA14D] hover:bg-[#E8F9EE] rounded-lg transition-colors cursor-pointer"
                              title="Convert directly to CRM Lead"
                            >
                              <UserPlus className="w-4 h-4 text-[#1AA14D]" />
                            </button>
                          )}

                          {canDelete && (
                            <button
                              onClick={() => {
                                if (place.id) {
                                  setRecordToDelete(place.id);
                                  setDeleteConfirmOpen(true);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Server-Side Pagination */}
        <AdminPagination
          page={page}
          pageSize={limit}
          total={totalCount}
          totalPages={totalPages}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setLimit(size);
            setPage(1);
          }}
          disabled={isLoading}
        />
      </AdminCard>

      {/* 6. RIGHT-SIDE DETAIL DRAWER (DO NOT NAVIGATE TO NEW PAGE) */}
      <AdminFormDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={selectedRecord?.businessName || 'Prospect Details'}
        subtitle={`Captured via ${selectedRecord?.source || 'GOOGLE_PLACES'}`}
        icon={Database}
        size="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              {canDelete && selectedRecord?.id && (
                <button
                  type="button"
                  onClick={() => {
                    setRecordToDelete(selectedRecord.id!);
                    setDeleteConfirmOpen(true);
                  }}
                  className="px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              {isEditing ? (
                <>
                  <AdminButton variant="secondary" size="sm" onClick={() => setIsEditing(false)}>
                    Cancel
                  </AdminButton>
                  <AdminButton
                    variant="primary"
                    size="sm"
                    loading={updateMutation.isPending}
                    onClick={() => {
                      if (selectedRecord?.id) {
                        updateMutation.mutate({ id: selectedRecord.id, data: editForm });
                      }
                    }}
                  >
                    Save Changes
                  </AdminButton>
                </>
              ) : (
                <>
                  {canEdit && (
                    <AdminButton variant="secondary" size="sm" icon={Edit} onClick={() => setIsEditing(true)}>
                      Edit
                    </AdminButton>
                  )}

                  {canEdit && selectedRecord?.status !== 'VALIDATED' && (
                    <AdminButton
                      variant="outline"
                      size="sm"
                      icon={Check}
                      loading={validateMutation.isPending}
                      onClick={() => {
                        if (selectedRecord?.id) validateMutation.mutate(selectedRecord.id);
                      }}
                    >
                      Validate
                    </AdminButton>
                  )}

                  {canEdit && selectedRecord?.status !== 'REJECTED' && (
                    <AdminButton
                      variant="outline"
                      size="sm"
                      icon={X}
                      onClick={() => setRejectModalOpen(true)}
                    >
                      Reject
                    </AdminButton>
                  )}

                  {selectedRecord?.status !== 'LEAD_CREATED' && !selectedRecord?.isImported ? (
                    canEdit && (
                      <AdminButton
                        variant="primary"
                        size="sm"
                        icon={UserPlus}
                        loading={createLeadMutation.isPending}
                        onClick={handleCreateLeadClick}
                      >
                        Create Lead
                      </AdminButton>
                    )
                  ) : (
                    <span className="px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 font-extrabold text-xs border border-purple-200 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
                      Lead Created (#{selectedRecord?.importedLeadId || 'Active'})
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
        }
      >
        {selectedRecord && (
          <div className="space-y-5">
            {/* Duplicate Matches Alert Banner */}
            {selectedRecord.duplicateMatches && selectedRecord.duplicateMatches.length > 0 && (
              <div className="p-4 bg-amber-50 border border-amber-300/80 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-amber-900 font-black text-xs">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Possible Duplicates Detected in CRM:</span>
                </div>
                <div className="space-y-1.5 pl-6">
                  {selectedRecord.duplicateMatches.map((dup, idx) => (
                    <div key={idx} className="text-xs text-amber-800 flex items-center justify-between">
                      <span className="font-bold">
                        {dup.title} ({dup.type})
                      </span>
                      <span className="text-[10px] px-2 py-0.5 bg-amber-100/80 rounded-md font-mono">
                        Matched on: {dup.matchField} ({dup.matchValue})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* View / Edit Mode Form */}
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-500 mb-1">
                    Business Name
                  </label>
                  <input
                    type="text"
                    value={editForm.businessName || ''}
                    onChange={(e) => setEditForm({ ...editForm, businessName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#23C45E] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-500 mb-1">
                      Category
                    </label>
                    <input
                      type="text"
                      value={editForm.category || ''}
                      onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#23C45E] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-500 mb-1">
                      Status
                    </label>
                    <select
                      value={editForm.status || 'CAPTURED'}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#23C45E] focus:outline-none"
                    >
                      <option value="CAPTURED">CAPTURED</option>
                      <option value="VALIDATED">VALIDATED</option>
                      <option value="REJECTED">REJECTED</option>
                      <option value="DUPLICATE">DUPLICATE</option>
                      <option value="LEAD_CREATED">LEAD_CREATED</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-500 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={editForm.phone || ''}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#23C45E] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-500 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={editForm.email || ''}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#23C45E] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-500 mb-1">
                    Website URL
                  </label>
                  <input
                    type="url"
                    value={editForm.website || ''}
                    onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#23C45E] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-500 mb-1">
                    Address
                  </label>
                  <textarea
                    rows={2}
                    value={editForm.address || ''}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#23C45E] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-500 mb-1">
                    Notes & Rejection Comments
                  </label>
                  <textarea
                    rows={2}
                    value={editForm.notes || ''}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#23C45E] focus:outline-none"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                {/* Status & ID Badge */}
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-black text-slate-400 block">Record Status</span>
                    <span className="text-xs font-black text-slate-900">
                      {STATUS_CONFIG[selectedRecord.status || 'CAPTURED']?.label || selectedRecord.status}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-black text-slate-400 block">Google Place ID</span>
                    <span className="text-[10px] font-mono font-bold text-slate-600 block max-w-[140px] truncate" title={selectedRecord.googlePlaceId}>
                      {selectedRecord.googlePlaceId || 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Key Details Card */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200/80 space-y-3 shadow-2xs">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-black text-slate-900">{selectedRecord.businessName}</h4>
                      <p className="text-slate-500 font-bold mt-0.5">{selectedRecord.category || 'General Business'}</p>
                    </div>

                    {selectedRecord.rating && (
                      <span className="px-2 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl font-black text-xs flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        {selectedRecord.rating} ({selectedRecord.reviewCount || 0})
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-2 text-slate-700">
                      <Phone className="w-4 h-4 text-[#23C45E] shrink-0" />
                      <span className="font-bold">{selectedRecord.phone || 'N/A'}</span>
                    </div>

                    {selectedRecord.email && (
                      <div className="flex items-center gap-2 text-slate-700">
                        <Mail className="w-4 h-4 text-sky-500 shrink-0" />
                        <span className="font-bold">{selectedRecord.email}</span>
                      </div>
                    )}

                    <div className="flex items-start gap-2 text-slate-700">
                      <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      <span className="font-medium leading-relaxed">{selectedRecord.address || 'N/A'}</span>
                    </div>

                    {selectedRecord.website && (
                      <div className="flex items-center gap-2 pt-1">
                        <Globe className="w-4 h-4 text-blue-500 shrink-0" />
                        <a
                          href={selectedRecord.website}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:underline font-bold truncate"
                        >
                          {selectedRecord.website}
                        </a>
                      </div>
                    )}

                    {selectedRecord.googleMapsUrl && (
                      <div className="flex items-center gap-2 pt-1">
                        <ExternalLink className="w-4 h-4 text-emerald-600 shrink-0" />
                        <a
                          href={selectedRecord.googleMapsUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-700 hover:underline font-bold truncate"
                        >
                          View in Google Maps
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes Section */}
                {selectedRecord.notes && (
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                    <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">Notes & History</span>
                    <p className="text-xs text-slate-700 font-medium whitespace-pre-wrap">{selectedRecord.notes}</p>
                  </div>
                )}

                {/* Raw API Data Inspection Toggle */}
                {selectedRecord.rawData && (
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setShowRawData(!showRawData)}
                      className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
                    >
                      <span>{showRawData ? 'Hide Raw API JSON' : 'Show Raw API JSON'}</span>
                    </button>

                    {showRawData && (
                      <pre className="p-3 bg-slate-950 text-emerald-400 font-mono text-[10px] rounded-xl overflow-x-auto max-h-48">
                        {JSON.stringify(selectedRecord.rawData, null, 2)}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </AdminFormDrawer>

      {/* 7. GOOGLE PLACES TEXT SEARCH MODAL */}
      <AdminFormDrawer
        isOpen={extractModalOpen}
        onClose={() => setExtractModalOpen(false)}
        title="Google Places Text Search"
        subtitle="Extract verified business prospects into Data Capture"
        icon={Search}
        size="md"
        onSave={handleStartGoogleExtraction}
        saveLabel={isExtracting ? 'Extracting...' : 'Search Google Places'}
        isSubmitting={isExtracting}
      >
        <form onSubmit={handleStartGoogleExtraction} className="space-y-4 text-xs">
          <div>
            <label className="block text-[11px] font-black uppercase text-slate-500 mb-1.5">
              Search Keyword / Business Type
            </label>
            <div className="relative">
              <Tag className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={extractKeyword}
                onChange={(e) => setExtractKeyword(e.target.value)}
                placeholder="e.g. Gyms, Clinics, Restaurants, IT Companies"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#23C45E] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-black uppercase text-slate-500 mb-1.5">
              Target Location / City / Area
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={extractLocation}
                onChange={(e) => setExtractLocation(e.target.value)}
                placeholder="e.g. Vadodara, Ahmedabad, Mumbai, Pune"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#23C45E] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-black uppercase text-slate-500 mb-1.5">
              Results Limit (Google Places API Pagination)
            </label>
            <select
              value={extractMaxResults}
              onChange={(e) => setExtractMaxResults(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#23C45E] focus:outline-none"
            >
              <option value="20">20 Prospects (1 API Request)</option>
              <option value="40">40 Prospects (2 API Requests with nextPageToken)</option>
              <option value="60">60 Prospects (3 API Requests - Maximum)</option>
            </select>
          </div>

          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-1">
            <span className="text-[11px] font-black text-emerald-900 block">Verified Extraction Protocol</span>
            <p className="text-[10px] text-emerald-800 font-medium">
              Uses server-side authenticated Google Places API (New) Text Search with FieldMask filtering. Extracted records are saved to Data Capture table for review.
            </p>
          </div>
        </form>
      </AdminFormDrawer>

      {/* 8. MANUAL ENTRY CREATE MODAL */}
      <AdminFormDrawer
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Add Manual Prospect"
        subtitle="Manually create a new business lead in Data Capture"
        icon={Plus}
        size="md"
        onSave={() => {
          if (!newRecordForm.businessName.trim()) {
            toast.error('Business Name is required');
            return;
          }
          const finalPhone = newRecordForm.mobile.trim() || newRecordForm.phone.trim();
          manualCreateMutation.mutate({
            ...newRecordForm,
            firstName: newRecordForm.firstName.trim() || undefined,
            first_name: newRecordForm.firstName.trim() || undefined,
            lastName: newRecordForm.lastName.trim() || undefined,
            last_name: newRecordForm.lastName.trim() || undefined,
            phone: finalPhone || undefined,
            mobile: finalPhone || undefined,
            mobileNumber: finalPhone || undefined,
            email: newRecordForm.email.trim() || undefined,
            emailAddress: newRecordForm.email.trim() || undefined,
            source: 'MANUAL',
            status: 'CAPTURED',
          });
        }}
        saveLabel={manualCreateMutation.isPending ? 'Saving...' : 'Create Record'}
        isSubmitting={manualCreateMutation.isPending}
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-[11px] font-black uppercase text-slate-500 mb-1.5">
              Business Name *
            </label>
            <input
              type="text"
              value={newRecordForm.businessName}
              onChange={(e) => setNewRecordForm({ ...newRecordForm, businessName: e.target.value })}
              placeholder="e.g. Apex Engineering Works"
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#23C45E] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-black uppercase text-slate-500 mb-1.5">
                Contact First Name
              </label>
              <input
                type="text"
                value={newRecordForm.firstName}
                onChange={(e) => setNewRecordForm({ ...newRecordForm, firstName: e.target.value })}
                placeholder="e.g. John"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#23C45E] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase text-slate-500 mb-1.5">
                Contact Last Name
              </label>
              <input
                type="text"
                value={newRecordForm.lastName}
                onChange={(e) => setNewRecordForm({ ...newRecordForm, lastName: e.target.value })}
                placeholder="e.g. Doe"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#23C45E] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-black uppercase text-slate-500 mb-1.5">
                Mobile Number
              </label>
              <input
                type="text"
                value={newRecordForm.mobile}
                onChange={(e) => setNewRecordForm({ ...newRecordForm, mobile: e.target.value, phone: e.target.value || newRecordForm.phone })}
                placeholder="+91 98765 43210"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#23C45E] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase text-slate-500 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={newRecordForm.email}
                onChange={(e) => setNewRecordForm({ ...newRecordForm, email: e.target.value })}
                placeholder="contact@example.com"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#23C45E] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-black uppercase text-slate-500 mb-1.5">
                Category
              </label>
              <input
                type="text"
                value={newRecordForm.category}
                onChange={(e) => setNewRecordForm({ ...newRecordForm, category: e.target.value })}
                placeholder="e.g. Manufacturing"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#23C45E] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase text-slate-500 mb-1.5">
                Landline / Alternate Phone
              </label>
              <input
                type="text"
                value={newRecordForm.phone}
                onChange={(e) => setNewRecordForm({ ...newRecordForm, phone: e.target.value })}
                placeholder="+91 98250 12345"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#23C45E] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-black uppercase text-slate-500 mb-1.5">
              Website
            </label>
            <input
              type="url"
              value={newRecordForm.website}
              onChange={(e) => setNewRecordForm({ ...newRecordForm, website: e.target.value })}
              placeholder="https://example.com"
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#23C45E] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-black uppercase text-slate-500 mb-1.5">
              Address
            </label>
            <textarea
              rows={2}
              value={newRecordForm.address}
              onChange={(e) => setNewRecordForm({ ...newRecordForm, address: e.target.value })}
              placeholder="Full address / location"
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#23C45E] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-black uppercase text-slate-500 mb-1.5">
              Notes
            </label>
            <textarea
              rows={2}
              value={newRecordForm.notes}
              onChange={(e) => setNewRecordForm({ ...newRecordForm, notes: e.target.value })}
              placeholder="Internal notes or context"
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#23C45E] focus:outline-none"
            />
          </div>
        </div>
      </AdminFormDrawer>

      {/* 9. REJECT REASON MODAL */}
      <AdminFormDrawer
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Reject Prospect"
        subtitle="Provide reason for rejecting this captured record"
        icon={X}
        size="sm"
        onSave={() => {
          if (selectedRecord?.id) {
            rejectMutation.mutate({ id: selectedRecord.id, reason: rejectReason });
          }
        }}
        saveLabel={rejectMutation.isPending ? 'Rejecting...' : 'Confirm Rejection'}
        isSubmitting={rejectMutation.isPending}
      >
        <div className="space-y-3 text-xs">
          <p className="text-slate-600 font-medium">
            Marking this record as <strong>REJECTED</strong> will exclude it from active CRM conversions.
          </p>
          <div>
            <label className="block text-[11px] font-black uppercase text-slate-500 mb-1">
              Rejection Reason (Optional)
            </label>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Permanently closed, out of service area, duplicate phone..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#23C45E] focus:outline-none"
            />
          </div>
        </div>
      </AdminFormDrawer>

      {/* 10. DUPLICATE CONFIRMATION DIALOG */}
      <AdminConfirmDialog
        isOpen={leadDuplicateConfirmOpen}
        onClose={() => setLeadDuplicateConfirmOpen(false)}
        onConfirm={() => {
          if (selectedRecord?.id) {
            createLeadMutation.mutate(selectedRecord.id);
          }
        }}
        title="Possible Duplicate Detected"
        description="A lead or company with similar business name, phone, or Google Place ID already exists in your CRM. Do you still want to create a new Lead record?"
        confirmLabel="Yes, Create Lead Anyway"
        variant="warning"
        loading={createLeadMutation.isPending}
      />

      {/* 11. DELETE CONFIRMATION DIALOG */}
      <AdminConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setRecordToDelete(null);
        }}
        onConfirm={() => {
          if (recordToDelete) {
            deleteMutation.mutate(recordToDelete);
          }
        }}
        title="Delete Data Capture Record"
        description="Are you sure you want to delete this captured prospect record? This action will remove it from the table."
        confirmLabel="Delete Record"
        variant="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
