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
  Loader2,
  Building2,
  Maximize2,
  Camera,
  Image as ImageIcon,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { hasPermission } from '@/lib/access-control';
import {
  AdminPageHeader,
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
  googlePhotos?: { name: string; url: string; width?: number; height?: number }[];
  photos?: string[];
  socialMedia?: {
    website?: string;
    facebook?: string;
    instagram?: string;
    linkedin?: string;
    twitter?: string;
    youtube?: string;
    [key: string]: any;
  };
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

  // Photo Gallery Lightbox / Modal State
  const [galleryModal, setGalleryModal] = useState<{
    isOpen: boolean;
    businessName: string;
    photos: { name?: string; url: string; width?: number; height?: number }[];
    currentIndex: number;
  }>({
    isOpen: false,
    businessName: '',
    photos: [],
    currentIndex: 0,
  });

  const openGalleryModal = (
    e: React.MouseEvent,
    businessName: string,
    photos: { name?: string; url: string; width?: number; height?: number }[] | string[] | undefined,
    startIndex = 0,
  ) => {
    e.stopPropagation();
    if (!photos || photos.length === 0) return;
    const normalizedList = photos.map((p) => (typeof p === 'string' ? { url: p } : p));
    setGalleryModal({
      isOpen: true,
      businessName,
      photos: normalizedList,
      currentIndex: startIndex,
    });
  };

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

  const [capturingId, setCapturingId] = useState<number | null>(null);

  const createLeadMutation = useMutation({
    mutationFn: async ({ id, captureRequestId }: { id: number; captureRequestId?: string }) => {
      setCapturingId(id);
      return api.post(`/data-capture/${id}/create-lead`, { captureRequestId });
    },
    onSuccess: (res: any) => {
      setCapturingId(null);
      const data = res?.data || res;
      toast.success(data?.message || 'Lead created successfully in CRM!', { icon: '🎯' });
      setDrawerOpen(false);
      setLeadDuplicateConfirmOpen(false);
      queryClient.invalidateQueries({ queryKey: ['data-capture-list'] });
      queryClient.invalidateQueries({ queryKey: ['data-capture-usage'] });
    },
    onError: (err) => {
      setCapturingId(null);
      toast.error(getErrorMessage(err));
    },
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
      'Primary Photo URL',
      'Phone',
      'Email',
      'Website',
      'Facebook',
      'Instagram',
      'LinkedIn',
      'Twitter / X',
      'YouTube',
      'Address',
      'Rating',
      'Review Count',
      'Google Place ID',
      'Google Maps URL',
      'Captured Date',
    ];

    const rows = exportPlaces.map((p) => {
      const photos = p.googlePhotos && p.googlePhotos.length > 0
        ? p.googlePhotos
        : (p.photos && p.photos.length > 0 ? p.photos.map((u) => ({ url: u })) : []);
      const primaryPhoto = photos[0]?.url || '';
      const sm = p.socialMedia || (p.rawData as any)?.socialMedia || {};

      return [
        p.id || '',
        `"${(p.businessName || '').replace(/"/g, '""')}"`,
        `"${(p.category || '').replace(/"/g, '""')}"`,
        p.status || 'CAPTURED',
        p.source || 'GOOGLE_PLACES',
        `"${primaryPhoto.replace(/"/g, '""')}"`,
        `"${p.phone || ''}"`,
        `"${p.email || ''}"`,
        `"${p.website || sm.website || ''}"`,
        `"${sm.facebook || ''}"`,
        `"${sm.instagram || ''}"`,
        `"${sm.linkedin || ''}"`,
        `"${sm.twitter || ''}"`,
        `"${sm.youtube || ''}"`,
        `"${(p.address || '').replace(/"/g, '""')}"`,
        p.rating || '',
        p.reviewCount || '',
        `"${p.googlePlaceId || ''}"`,
        `"${p.googleMapsUrl || ''}"`,
        `"${p.capturedAt || ''}"`,
      ];
    });

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

  const handleCaptureLead = (place: CapturedPlace) => {
    if (!place?.id) return;
    const captureRequestId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    console.log(
      `[DATA CAPTURE REQUEST]\n` +
      `captureRequestId: ${captureRequestId}\n` +
      `source: ${place.source || 'GOOGLE_PLACES'}\n` +
      `sourceResultId: ${place.googlePlaceId || place.id}\n` +
      `companyName: ${place.businessName}\n` +
      `website: ${place.website || 'N/A'}\n` +
      `phone: ${place.phone || 'none'}\n` +
      `email: ${place.email || 'none'}`
    );

    setSelectedRecord(place);
    const hasLeadDuplicates = (place.duplicateMatches || []).some((m) => m.type === 'LEAD');
    if (hasLeadDuplicates) {
      setLeadDuplicateConfirmOpen(true);
    } else {
      createLeadMutation.mutate({ id: place.id, captureRequestId });
    }
  };

  const handleCreateLeadClick = () => {
    if (!selectedRecord) return;
    handleCaptureLead(selectedRecord);
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-16 text-slate-800 animate-in fade-in-50 duration-200">
      {/* 1. STANDARD PAGE HEADER */}
      <AdminPageHeader
        title="Data Capture"
        description="Extract, verify, and convert business prospects into active CRM Leads with Google Places API integration."
        icon={Globe}
        iconColor="text-[#1AA14D]"
        badge={{
          text: 'DATA CAPTURE & PROSPECTION',
          icon: Globe,
          variant: 'emerald',
        }}
        breadcrumbs={[
          { label: 'CRM', href: '/crm' },
          { label: 'Data Capture' },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <AdminButton
              variant="outline"
              size="md"
              icon={RefreshCw}
              onClick={() => {
                refetchList();
                refetchUsage();
              }}
              title="Refresh capture list and quota"
            >
              Sync
            </AdminButton>

            <Link href="/data-capture/history">
              <AdminButton
                variant="outline"
                size="md"
                icon={History}
              >
                Job History
              </AdminButton>
            </Link>

            <Link href="/data-capture/usage">
              <AdminButton
                variant="outline"
                size="md"
                icon={Activity}
              >
                Usage & Quota
              </AdminButton>
            </Link>

            {canCreate && (
              <>
                <AdminButton
                  variant="outline"
                  size="md"
                  icon={Plus}
                  onClick={() => setCreateModalOpen(true)}
                >
                  Add Record
                </AdminButton>

                <AdminButton
                  variant="primary"
                  size="md"
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
            <table className="w-full text-xs text-left min-w-[1050px]">
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
                  <th className="p-3.5 w-14 text-center">Photo</th>
                  <th className="p-3.5">Business Name & Category</th>
                  <th className="p-3.5">Contact Info</th>
                  <th className="p-3.5">Address</th>
                  <th className="p-3.5">Rating & Reviews</th>
                  <th className="p-3.5">Social Media</th>
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

                      {/* PHOTO COLUMN */}
                      <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                        {(() => {
                          const placePhotos = place.googlePhotos && place.googlePhotos.length > 0
                            ? place.googlePhotos
                            : (place.photos && place.photos.length > 0 ? place.photos.map((u) => ({ url: u })) : []);
                          const primary = placePhotos[0];
                          const photoCount = placePhotos.length;

                          if (primary?.url) {
                            return (
                              <div
                                onClick={(e) => openGalleryModal(e, place.businessName, placePhotos, 0)}
                                className="relative inline-block group cursor-pointer"
                                title={`Click to view ${photoCount} Google Places ${photoCount === 1 ? 'photo' : 'photos'}`}
                              >
                                <div className="w-11 h-11 rounded-xl overflow-hidden border border-slate-200 shadow-2xs group-hover:border-[#23C45E] group-hover:shadow-md transition-all bg-slate-100 flex items-center justify-center">
                                  <img
                                    src={primary.url}
                                    alt={place.businessName}
                                    loading="lazy"
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                                    onError={(e) => {
                                      (e.target as HTMLElement).style.display = 'none';
                                      const next = (e.target as HTMLElement).nextElementSibling as HTMLElement;
                                      if (next) next.classList.remove('hidden');
                                    }}
                                  />
                                  <div className="hidden w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">
                                    <Building2 className="w-5 h-5 text-slate-400" />
                                  </div>
                                </div>
                                {photoCount > 1 && (
                                  <span className="absolute -bottom-1 -right-1 bg-slate-900/90 text-white text-[9px] font-black px-1 py-0.2 rounded-full border border-white shadow-xs">
                                    +{photoCount - 1}
                                  </span>
                                )}
                                <span className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center text-white">
                                  <Maximize2 className="w-3.5 h-3.5" />
                                </span>
                              </div>
                            );
                          }

                          return (
                            <div
                              className="w-11 h-11 rounded-xl bg-slate-100/90 border border-slate-200/80 flex items-center justify-center mx-auto text-slate-400"
                              title="No Google photo available"
                            >
                              <Building2 className="w-5 h-5 text-slate-400" />
                            </div>
                          );
                        })()}
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
                            <span className="text-slate-400 text-[11px]">Not found</span>
                          )}
                          {place.email && place.email !== 'N/A' ? (
                            <span className="flex items-center gap-1.5 text-slate-600 text-[11px]">
                              <Mail className="w-3 h-3 text-slate-400" />
                              {place.email}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[10px] block">No email</span>
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

                      {/* SOCIAL MEDIA / LINKS COLUMN */}
                      <td className="p-3.5" onClick={(e) => e.stopPropagation()}>
                        {(() => {
                          const sm = place.socialMedia || (place.rawData as any)?.socialMedia;
                          const hasWeb = place.website && place.website !== 'N/A';
                          const hasFb = sm?.facebook;
                          const hasIg = sm?.instagram;
                          const hasLi = sm?.linkedin;
                          const hasTw = sm?.twitter;
                          const hasYt = sm?.youtube;

                          if (!hasWeb && !hasFb && !hasIg && !hasLi && !hasTw && !hasYt) {
                            return <span className="text-slate-400 text-xs font-bold">—</span>;
                          }

                          return (
                            <div className="flex flex-wrap items-center gap-1 max-w-[170px]">
                              {hasWeb && (
                                <a
                                  href={place.website}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/80 hover:bg-blue-100 text-[10px] font-black transition-colors"
                                  title={`Website: ${place.website}`}
                                >
                                  <Globe className="w-2.5 h-2.5" />
                                  <span>WEB</span>
                                </a>
                              )}
                              {hasFb && (
                                <a
                                  href={sm.facebook}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-[#1877F2]/10 text-[#1877F2] border border-[#1877F2]/25 hover:bg-[#1877F2]/20 text-[10px] font-black transition-colors"
                                  title={`Facebook: ${sm.facebook}`}
                                >
                                  FB
                                </a>
                              )}
                              {hasIg && (
                                <a
                                  href={sm.instagram}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-gradient-to-r from-[#F58529]/15 to-[#DD2A7B]/15 text-[#DD2A7B] border border-[#DD2A7B]/30 hover:opacity-90 text-[10px] font-black transition-opacity"
                                  title={`Instagram: ${sm.instagram}`}
                                >
                                  IG
                                </a>
                              )}
                              {hasLi && (
                                <a
                                  href={sm.linkedin}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-[#0A66C2]/10 text-[#0A66C2] border border-[#0A66C2]/25 hover:bg-[#0A66C2]/20 text-[10px] font-black transition-colors"
                                  title={`LinkedIn: ${sm.linkedin}`}
                                >
                                  IN
                                </a>
                              )}
                              {hasTw && (
                                <a
                                  href={sm.twitter}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-slate-900/10 text-slate-900 border border-slate-900/20 hover:bg-slate-900/20 text-[10px] font-black transition-colors"
                                  title={`X (Twitter): ${sm.twitter}`}
                                >
                                  X
                                </a>
                              )}
                              {hasYt && (
                                <a
                                  href={sm.youtube}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 text-[10px] font-black transition-colors"
                                  title={`YouTube: ${sm.youtube}`}
                                >
                                  YT
                                </a>
                              )}
                            </div>
                          );
                        })()}
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
                              onClick={() => handleCaptureLead(place)}
                              disabled={capturingId === place.id || createLeadMutation.isPending}
                              className="p-1.5 text-slate-500 hover:text-[#1AA14D] hover:bg-[#E8F9EE] rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                              title="Convert directly to CRM Lead"
                            >
                              {capturingId === place.id ? (
                                <Loader2 className="w-4 h-4 animate-spin text-[#1AA14D]" />
                              ) : (
                                <UserPlus className="w-4 h-4 text-[#1AA14D]" />
                              )}
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
                        loading={capturingId === selectedRecord?.id || createLeadMutation.isPending}
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

                {/* Google Photos Hero Banner / Gallery */}
                {(() => {
                  const drawerPhotos = selectedRecord.googlePhotos && selectedRecord.googlePhotos.length > 0
                    ? selectedRecord.googlePhotos
                    : (selectedRecord.photos && selectedRecord.photos.length > 0
                        ? selectedRecord.photos.map((u) => ({ url: u }))
                        : []);
                  const hasPhotos = drawerPhotos.length > 0;

                  if (hasPhotos) {
                    return (
                      <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 shadow-sm relative group">
                        <div className="relative h-44 sm:h-52 w-full overflow-hidden bg-slate-950">
                          <img
                            src={drawerPhotos[0].url}
                            alt={selectedRecord.businessName}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/20" />
                          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
                            <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-xs text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 border border-white/20">
                              <Camera className="w-3 h-3 text-[#23C45E]" />
                              Google Places Photo ({drawerPhotos.length})
                            </span>
                            <button
                              type="button"
                              onClick={(e) => openGalleryModal(e, selectedRecord.businessName, drawerPhotos, 0)}
                              className="px-2.5 py-1 rounded-xl bg-white/90 hover:bg-white text-slate-900 text-[11px] font-black flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                            >
                              <Maximize2 className="w-3.5 h-3.5" />
                              <span>View Gallery</span>
                            </button>
                          </div>
                        </div>

                        {/* Thumbnail Strip if multiple photos */}
                        {drawerPhotos.length > 1 && (
                          <div className="p-2.5 bg-slate-900/90 border-t border-white/10 flex items-center gap-2 overflow-x-auto custom-scrollbar">
                            {drawerPhotos.map((photo, pIdx) => (
                              <button
                                key={photo.url || pIdx}
                                type="button"
                                onClick={(e) => openGalleryModal(e, selectedRecord.businessName, drawerPhotos, pIdx)}
                                className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-white/20 hover:border-[#23C45E] transition-all cursor-pointer"
                              >
                                <img src={photo.url} alt={`Photo ${pIdx + 1}`} className="w-full h-full object-cover" />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  }

                  return (
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                        <Building2 className="w-5 h-5 text-slate-400" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-700 block">No Google Photos</span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          Google Places API did not return photo references for this location.
                        </span>
                      </div>
                    </div>
                  );
                })()}

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

                {/* Social Media & Online Handles Card */}
                {(() => {
                  const sm = selectedRecord.socialMedia || (selectedRecord.rawData as any)?.socialMedia;
                  const hasWeb = selectedRecord.website && selectedRecord.website !== 'N/A';
                  const hasFb = sm?.facebook;
                  const hasIg = sm?.instagram;
                  const hasLi = sm?.linkedin;
                  const hasTw = sm?.twitter;
                  const hasYt = sm?.youtube;
                  const hasAny = hasWeb || hasFb || hasIg || hasLi || hasTw || hasYt;

                  return (
                    <div className="p-4 bg-white rounded-2xl border border-slate-200/80 space-y-3 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                          Discovered Social Media & Handles
                        </span>
                        {hasAny && (
                          <span className="px-2 py-0.5 rounded-full bg-[#23C45E]/10 text-[#1AA14D] font-black text-[10px]">
                            Verified
                          </span>
                        )}
                      </div>

                      {hasAny ? (
                        <div className="space-y-2 pt-1">
                          {hasWeb && (
                            <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200/60">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-black">
                                  WEB
                                </span>
                                <span className="text-xs font-bold text-slate-800 truncate">
                                  {selectedRecord.website}
                                </span>
                              </div>
                              <a
                                href={selectedRecord.website}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black shrink-0 transition-colors"
                              >
                                Visit
                              </a>
                            </div>
                          )}

                          {hasFb && (
                            <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200/60">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="px-1.5 py-0.5 rounded bg-[#1877F2]/10 text-[#1877F2] border border-[#1877F2]/30 text-[10px] font-black">
                                  FB
                                </span>
                                <span className="text-xs font-bold text-slate-800 truncate">
                                  {sm.facebook}
                                </span>
                              </div>
                              <a
                                href={sm.facebook}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2 py-1 rounded-lg bg-[#1877F2] hover:bg-[#1567d3] text-white text-[10px] font-black shrink-0 transition-colors"
                              >
                                Open
                              </a>
                            </div>
                          )}

                          {hasIg && (
                            <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200/60">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="px-1.5 py-0.5 rounded bg-gradient-to-r from-[#F58529]/15 to-[#DD2A7B]/15 text-[#DD2A7B] border border-[#DD2A7B]/30 text-[10px] font-black">
                                  IG
                                </span>
                                <span className="text-xs font-bold text-slate-800 truncate">
                                  {sm.instagram}
                                </span>
                              </div>
                              <a
                                href={sm.instagram}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2 py-1 rounded-lg bg-gradient-to-r from-[#F58529] to-[#DD2A7B] text-white text-[10px] font-black shrink-0 transition-opacity hover:opacity-90"
                              >
                                Open
                              </a>
                            </div>
                          )}

                          {hasLi && (
                            <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200/60">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="px-1.5 py-0.5 rounded bg-[#0A66C2]/10 text-[#0A66C2] border border-[#0A66C2]/30 text-[10px] font-black">
                                  IN
                                </span>
                                <span className="text-xs font-bold text-slate-800 truncate">
                                  {sm.linkedin}
                                </span>
                              </div>
                              <a
                                href={sm.linkedin}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2 py-1 rounded-lg bg-[#0A66C2] hover:bg-[#084e96] text-white text-[10px] font-black shrink-0 transition-colors"
                              >
                                Open
                              </a>
                            </div>
                          )}

                          {hasTw && (
                            <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200/60">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="px-1.5 py-0.5 rounded bg-slate-900/10 text-slate-900 border border-slate-900/20 text-[10px] font-black">
                                  X
                                </span>
                                <span className="text-xs font-bold text-slate-800 truncate">
                                  {sm.twitter}
                                </span>
                              </div>
                              <a
                                href={sm.twitter}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-black text-white text-[10px] font-black shrink-0 transition-colors"
                              >
                                Open
                              </a>
                            </div>
                          )}

                          {hasYt && (
                            <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200/60">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 border border-rose-200 text-[10px] font-black">
                                  YT
                                </span>
                                <span className="text-xs font-bold text-slate-800 truncate">
                                  {sm.youtube}
                                </span>
                              </div>
                              <a
                                href={sm.youtube}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black shrink-0 transition-colors"
                              >
                                Open
                              </a>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 font-medium py-1">
                          No social media handles discovered for this business.
                        </p>
                      )}
                    </div>
                  );
                })()}

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
            const captureRequestId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
            createLeadMutation.mutate({ id: selectedRecord.id, captureRequestId });
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

      {/* 12. PHOTO GALLERY LIGHTBOX MODAL */}
      {galleryModal.isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in-50 duration-150"
          onClick={() => setGalleryModal((prev) => ({ ...prev, isOpen: false }))}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl relative flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="w-full flex items-center justify-between pb-4 border-b border-slate-800 text-white">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#23C45E]" />
                <h3 className="font-black text-sm sm:text-base text-white truncate max-w-md">
                  {galleryModal.businessName}
                </h3>
                <span className="text-xs text-slate-400 font-bold ml-2">
                  Photo {galleryModal.currentIndex + 1} of {galleryModal.photos.length}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setGalleryModal((prev) => ({ ...prev, isOpen: false }))}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Main Active Photo */}
            <div className="relative my-4 w-full flex items-center justify-center max-h-[65vh] overflow-hidden rounded-2xl bg-black">
              {galleryModal.photos[galleryModal.currentIndex]?.url ? (
                <img
                  src={galleryModal.photos[galleryModal.currentIndex].url}
                  alt={`${galleryModal.businessName} photo ${galleryModal.currentIndex + 1}`}
                  className="max-h-[65vh] w-auto object-contain rounded-2xl select-none"
                />
              ) : (
                <div className="h-64 flex items-center justify-center text-slate-500">
                  <span>Photo unavailable</span>
                </div>
              )}

              {/* Prev / Next controls if multiple photos */}
              {galleryModal.photos.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setGalleryModal((prev) => ({
                        ...prev,
                        currentIndex:
                          prev.currentIndex === 0 ? prev.photos.length - 1 : prev.currentIndex - 1,
                      }))
                    }
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white border border-white/20 shadow-lg cursor-pointer transition-transform hover:scale-110"
                    title="Previous photo"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setGalleryModal((prev) => ({
                        ...prev,
                        currentIndex:
                          prev.currentIndex === prev.photos.length - 1 ? 0 : prev.currentIndex + 1,
                      }))
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white border border-white/20 shadow-lg cursor-pointer transition-transform hover:scale-110"
                    title="Next photo"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail Strip */}
            {galleryModal.photos.length > 1 && (
              <div className="w-full flex items-center justify-center gap-2 overflow-x-auto py-2 px-1 custom-scrollbar">
                {galleryModal.photos.map((p, idx) => (
                  <button
                    key={p.url || idx}
                    type="button"
                    onClick={() => setGalleryModal((prev) => ({ ...prev, currentIndex: idx }))}
                    className={`relative w-14 h-14 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                      galleryModal.currentIndex === idx
                        ? 'border-[#23C45E] scale-105 shadow-md shadow-[#23C45E]/20'
                        : 'border-slate-800 opacity-60 hover:opacity-100 hover:border-slate-600'
                    }`}
                  >
                    <img src={p.url} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
