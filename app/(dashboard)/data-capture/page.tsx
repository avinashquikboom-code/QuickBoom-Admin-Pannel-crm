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
  Zap,
  Activity,
  History,
  Loader2,
  Building2,
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
  createdFrom?: 'MOBILE_APP' | 'ADMIN_PANEL' | string;
  notes?: string;
  rawData?: any;
  isImported?: boolean;
  importedLeadId?: number;
  capturedAt: string;
  updatedAt?: string;
  customerId?: string;
  extractionJobId?: string;
  duplicateMatches?: DuplicateMatch[];
  socialMedia?: {
    website?: string;
    facebook?: string;
    instagram?: string;
    linkedin?: string;
    twitter?: string;
    youtube?: string;
    tiktok?: string;
    pinterest?: string;
    [key: string]: any;
  };
}

interface SocialItem {
  platform: 'Instagram' | 'Facebook' | 'YouTube' | 'LinkedIn' | 'X' | 'TikTok' | 'Website' | 'Pinterest';
  url: string;
}

function getDiscoveredSocialList(place: CapturedPlace): SocialItem[] {
  const sm = place.socialMedia || (place.rawData as any)?.socialMedia;
  const list: SocialItem[] = [];

  const rawInstagram = sm?.instagram;
  if (rawInstagram && typeof rawInstagram === 'string' && rawInstagram.trim()) {
    list.push({ platform: 'Instagram', url: rawInstagram.trim() });
  }

  const rawFacebook = sm?.facebook;
  if (rawFacebook && typeof rawFacebook === 'string' && rawFacebook.trim()) {
    list.push({ platform: 'Facebook', url: rawFacebook.trim() });
  }

  const rawYoutube = sm?.youtube;
  if (rawYoutube && typeof rawYoutube === 'string' && rawYoutube.trim()) {
    list.push({ platform: 'YouTube', url: rawYoutube.trim() });
  }

  const rawLinkedin = sm?.linkedin;
  if (rawLinkedin && typeof rawLinkedin === 'string' && rawLinkedin.trim()) {
    list.push({ platform: 'LinkedIn', url: rawLinkedin.trim() });
  }

  const rawTwitter = sm?.twitter || sm?.x;
  if (rawTwitter && typeof rawTwitter === 'string' && rawTwitter.trim()) {
    list.push({ platform: 'X', url: rawTwitter.trim() });
  }

  const rawTiktok = sm?.tiktok;
  if (rawTiktok && typeof rawTiktok === 'string' && rawTiktok.trim()) {
    list.push({ platform: 'TikTok', url: rawTiktok.trim() });
  }

  const rawPinterest = sm?.pinterest;
  if (rawPinterest && typeof rawPinterest === 'string' && rawPinterest.trim()) {
    list.push({ platform: 'Pinterest', url: rawPinterest.trim() });
  }

  return list;
}

function parseAddressDetails(place: CapturedPlace) {
  let city = '';
  let state = '';
  let country = '';
  let pincode = '';

  const components = (place.rawData as any)?.addressComponents;
  if (Array.isArray(components)) {
    for (const c of components) {
      const types: string[] = c.types || [];
      if (types.includes('locality') || types.includes('administrative_area_level_2')) {
        city = city || c.longText || c.shortText || '';
      }
      if (types.includes('administrative_area_level_1')) {
        state = c.longText || c.shortText || '';
      }
      if (types.includes('country')) {
        country = c.longText || c.shortText || '';
      }
      if (types.includes('postal_code')) {
        pincode = c.longText || c.shortText || '';
      }
    }
  }

  // Fallback parsing from address string if components missing
  if (!pincode && place.address) {
    const pinMatch = place.address.match(/\b\d{6}\b/) || place.address.match(/\b\d{5}(-\d{4})?\b/);
    if (pinMatch) pincode = pinMatch[0];
  }

  return {
    fullAddress: place.address || 'N/A',
    city: city || 'N/A',
    state: state || 'N/A',
    country: country || 'N/A',
    pincode: pincode || 'N/A',
    latitude: place.latitude,
    longitude: place.longitude,
    googleMapsUrl: place.googleMapsUrl,
  };
}

function SocialMediaBadgeButton({
  item,
  size = 'sm',
}: {
  item: SocialItem;
  size?: 'sm' | 'md';
}) {
  const getIcon = () => {
    switch (item.platform) {
      case 'Instagram':
        return (
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
          </svg>
        );
      case 'Facebook':
        return (
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
        );
      case 'YouTube':
        return (
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
          </svg>
        );
      case 'LinkedIn':
        return (
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.64a1.66 1.66 0 1 0-.01 3.32 1.66 1.66 0 0 0 .01-3.32z" />
          </svg>
        );
      case 'X':
        return (
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        );
      case 'TikTok':
        return (
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 2.89 3.5 2.75 1.57-.04 2.89-1.2 3.12-2.74.07-.5.08-1.01.08-1.51V.02z" />
          </svg>
        );
      case 'Pinterest':
        return (
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146 1.124.347 2.317.535 3.554.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z" />
          </svg>
        );
      case 'Website':
      default:
        return <Globe className="w-3.5 h-3.5" />;
    }
  };

  const getStyle = () => {
    switch (item.platform) {
      case 'Instagram':
        return 'bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF] text-white hover:opacity-90';
      case 'Facebook':
        return 'bg-[#1877F2] text-white hover:bg-[#166fe5]';
      case 'YouTube':
        return 'bg-[#FF0000] text-white hover:bg-[#e60000]';
      case 'LinkedIn':
        return 'bg-[#0A66C2] text-white hover:bg-[#084e96]';
      case 'X':
        return 'bg-slate-900 text-white hover:bg-black';
      case 'TikTok':
        return 'bg-[#010101] text-white hover:bg-black';
      case 'Pinterest':
        return 'bg-[#E60023] text-white hover:bg-[#c9001f]';
      case 'Website':
      default:
        return 'bg-sky-600 text-white hover:bg-sky-700';
    }
  };

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        window.open(item.url, '_blank', 'noopener,noreferrer');
      }}
      title={item.platform}
      className={`${size === 'sm' ? 'w-7 h-7' : 'w-8 h-8'} rounded-full flex items-center justify-center shrink-0 shadow-2xs transition-all hover:scale-110 active:scale-95 cursor-pointer ${getStyle()}`}
    >
      {getIcon()}
    </button>
  );
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
  const [createdFromFilter, setCreatedFromFilter] = useState('ALL');
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
    queryKey: ['data-capture-list', page, limit, activeTab, sourceFilter, createdFromFilter, searchQuery],
    queryFn: async () => {
      const params: any = {
        page,
        limit,
        status: activeTab,
        source: sourceFilter,
      };
      if (createdFromFilter !== 'ALL') {
        params.createdFrom = createdFromFilter;
      }
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
      queryClient.invalidateQueries({ queryKey: ['leads'] });
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
      'Created From',
      'Phone',
      'Email',
      'Website',
      'Facebook',
      'Instagram',
      'LinkedIn',
      'Twitter / X',
      'YouTube',
      'TikTok',
      'Pinterest',
      'Address',
      'Rating',
      'Review Count',
      'Google Place ID',
      'Google Maps URL',
      'Captured Date',
    ];

    const rows = exportPlaces.map((p) => {
      const sm = p.socialMedia || (p.rawData as any)?.socialMedia || {};

      return [
        p.id || '',
        `"${(p.businessName || '').replace(/"/g, '""')}"`,
        `"${(p.category || '').replace(/"/g, '""')}"`,
        p.status || 'CAPTURED',
        p.source || 'GOOGLE_PLACES',
        p.createdFrom === 'MOBILE_APP' ? 'Mobile App' : p.createdFrom === 'ADMIN_PANEL' ? 'Admin Panel' : '',
        `"${p.phone || ''}"`,
        `"${p.email || ''}"`,
        `"${p.website || sm.website || ''}"`,
        `"${sm.facebook || ''}"`,
        `"${sm.instagram || ''}"`,
        `"${sm.linkedin || ''}"`,
        `"${sm.twitter || ''}"`,
        `"${sm.youtube || ''}"`,
        `"${sm.tiktok || ''}"`,
        `"${sm.pinterest || ''}"`,
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

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 hidden md:inline">Created From:</span>
              <select
                value={createdFromFilter}
                onChange={(e) => {
                  setCreatedFromFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
              >
                <option value="ALL">All Platforms</option>
                <option value="MOBILE_APP">📱 Mobile App</option>
                <option value="ADMIN_PANEL">🖥 Admin Panel</option>
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
                  <th className="p-3.5">BUSINESS NAME & CATEGORY</th>
                  <th className="p-3.5">CONTACT INFO</th>
                  <th className="p-3.5">ADDRESS</th>
                  <th className="p-3.5">RATING & REVIEWS</th>
                  <th className="p-3.5">SOCIAL</th>
                  <th className="p-3.5">STATUS</th>
                  <th className="p-3.5">SOURCE</th>
                  <th className="p-3.5">CREATED FROM</th>
                  <th className="p-3.5 text-right">ACTIONS</th>
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

                      {/* SOCIAL COLUMN */}
                      <td className="p-3.5" onClick={(e) => e.stopPropagation()}>
                        {(() => {
                          const socialList = getDiscoveredSocialList(place);

                          if (socialList.length === 0) {
                            return <span className="text-slate-400 text-xs font-bold">—</span>;
                          }

                          const visibleItems = socialList.slice(0, 3);
                          const remainingCount = socialList.length - 3;

                          return (
                            <div className="flex items-center gap-1.5">
                              {visibleItems.map((item) => (
                                <SocialMediaBadgeButton key={item.platform} item={item} size="sm" />
                              ))}
                              {remainingCount > 0 && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openDetailDrawer(place);
                                  }}
                                  className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-black flex items-center justify-center border border-slate-200 transition-colors cursor-pointer"
                                  title={`+${remainingCount} more: Click to view all social platforms`}
                                >
                                  +{remainingCount}
                                </button>
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
                      <td className="p-3.5">
                        {place.createdFrom === 'MOBILE_APP' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs whitespace-nowrap">
                            <span>📱</span>
                            <span>Mobile App</span>
                          </span>
                        ) : place.createdFrom === 'ADMIN_PANEL' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-purple-50 text-purple-700 border border-purple-200 shadow-2xs whitespace-nowrap">
                            <span>🖥</span>
                            <span>Admin Panel</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 font-bold text-xs">—</span>
                        )}
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
                {/* 1. BUSINESS SECTION */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Business Details
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                        STATUS_CONFIG[selectedRecord.status || 'CAPTURED']?.bg || 'bg-slate-100'
                      } ${STATUS_CONFIG[selectedRecord.status || 'CAPTURED']?.text || 'text-slate-700'} ${
                        STATUS_CONFIG[selectedRecord.status || 'CAPTURED']?.border || 'border-slate-200'
                      }`}
                    >
                      {selectedRecord.businessStatus || selectedRecord.status || 'OPERATIONAL'}
                    </span>
                  </div>

                  <div>
                    <div className="min-w-0">
                      <h3 className="text-base font-black text-slate-900 leading-tight">
                        {selectedRecord.businessName}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold">
                          {selectedRecord.category || 'General Business'}
                        </span>
                        {selectedRecord.businessStatus && (
                          <span className="text-[10px] font-bold text-slate-400 uppercase">
                            Status: {selectedRecord.businessStatus}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. CONTACT SECTION */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-2.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                    Contact Information
                  </span>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-slate-700">
                      <span className="flex items-center gap-2 font-bold text-slate-500 text-xs">
                        <Phone className="w-4 h-4 text-[#23C45E]" />
                        Phone
                      </span>
                      {selectedRecord.phone && selectedRecord.phone !== 'N/A' ? (
                        <a href={`tel:${selectedRecord.phone}`} className="font-bold text-slate-900 hover:text-[#1AA14D]">
                          {selectedRecord.phone}
                        </a>
                      ) : (
                        <span className="text-slate-400">N/A</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-slate-700">
                      <span className="flex items-center gap-2 font-bold text-slate-500 text-xs">
                        <Mail className="w-4 h-4 text-sky-500" />
                        Email
                      </span>
                      {selectedRecord.email && selectedRecord.email !== 'N/A' ? (
                        <a href={`mailto:${selectedRecord.email}`} className="font-bold text-sky-600 hover:underline">
                          {selectedRecord.email}
                        </a>
                      ) : (
                        <span className="text-slate-400">N/A</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-slate-700">
                      <span className="flex items-center gap-2 font-bold text-slate-500 text-xs">
                        <Globe className="w-4 h-4 text-blue-500" />
                        Website
                      </span>
                      {selectedRecord.website && selectedRecord.website !== 'N/A' ? (
                        <a
                          href={selectedRecord.website}
                          target="_blank"
                          rel="noreferrer"
                          className="font-bold text-blue-600 hover:underline max-w-[200px] truncate"
                        >
                          {selectedRecord.website}
                        </a>
                      ) : (
                        <span className="text-slate-400">N/A</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. LOCATION SECTION */}
                {(() => {
                  const loc = parseAddressDetails(selectedRecord);
                  return (
                    <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                        Location & Address
                      </span>

                      <div className="space-y-2.5">
                        <div className="flex items-start gap-2 text-slate-700">
                          <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                          <span className="font-medium text-xs leading-relaxed text-slate-800">
                            {loc.fullAddress}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                          <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                            <span className="text-[9px] uppercase font-bold text-slate-400 block">City</span>
                            <span className="font-bold text-slate-800">{loc.city}</span>
                          </div>
                          <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                            <span className="text-[9px] uppercase font-bold text-slate-400 block">State</span>
                            <span className="font-bold text-slate-800">{loc.state}</span>
                          </div>
                          <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                            <span className="text-[9px] uppercase font-bold text-slate-400 block">Country</span>
                            <span className="font-bold text-slate-800">{loc.country}</span>
                          </div>
                          <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                            <span className="text-[9px] uppercase font-bold text-slate-400 block">Pincode</span>
                            <span className="font-bold text-slate-800">{loc.pincode}</span>
                          </div>
                        </div>

                        {(loc.latitude !== undefined || loc.longitude !== undefined) && (
                          <div className="flex items-center justify-between text-[11px] px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-600 font-mono">
                            <span>Coordinates:</span>
                            <span>{loc.latitude?.toFixed(6) ?? '—'}, {loc.longitude?.toFixed(6) ?? '—'}</span>
                          </div>
                        )}

                        {loc.googleMapsUrl && (
                          <a
                            href={loc.googleMapsUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-black transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Open in Google Maps</span>
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* 4. RATING SECTION */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                    Rating & Reviews
                  </span>

                  {selectedRecord.rating ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl font-black text-sm flex items-center gap-1">
                          <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                          {selectedRecord.rating}
                        </div>
                        <span className="text-xs font-bold text-slate-600">
                          based on {selectedRecord.reviewCount || 0} reviews
                        </span>
                      </div>
                      <span className="text-[11px] font-black text-amber-600 uppercase">
                        {selectedRecord.rating >= 4.5 ? 'Excellent' : selectedRecord.rating >= 4.0 ? 'Very Good' : 'Good'}
                      </span>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 font-medium">No ratings recorded on Google Places.</p>
                  )}
                </div>

                {/* 5. SOCIAL MEDIA SECTION */}
                {(() => {
                  const socialList = getDiscoveredSocialList(selectedRecord);
                  return (
                    <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                          Discovered Social Media Handles
                        </span>
                        {socialList.length > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-[#23C45E]/10 text-[#1AA14D] font-black text-[10px]">
                            {socialList.length} Discovered
                          </span>
                        )}
                      </div>

                      {socialList.length > 0 ? (
                        <div className="space-y-2">
                          {socialList.map((item) => (
                            <div
                              key={item.platform}
                              className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200/60"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <SocialMediaBadgeButton item={item} size="sm" />
                                <div className="min-w-0">
                                  <span className="text-xs font-black text-slate-800 block">
                                    {item.platform}
                                  </span>
                                  <span className="text-[11px] text-slate-500 font-medium truncate block max-w-[200px]" title={item.url}>
                                    {item.url}
                                  </span>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => window.open(item.url, '_blank', 'noopener,noreferrer')}
                                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-black text-white text-[10px] font-black shrink-0 transition-colors cursor-pointer"
                              >
                                Open
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 font-medium py-1">
                          No social media handles discovered for this business.
                        </p>
                      )}
                    </div>
                  );
                })()}

                {/* 7. SOURCE & METADATA SECTION */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-2.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                    Source & Metadata
                  </span>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-bold">Provider:</span>
                      <span className="font-bold text-slate-800">{selectedRecord.provider || 'GOOGLE_PLACES'}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-bold">Google Place ID:</span>
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-[11px] text-slate-700 max-w-[140px] truncate" title={selectedRecord.googlePlaceId}>
                          {selectedRecord.googlePlaceId || 'N/A'}
                        </span>
                        {selectedRecord.googlePlaceId && (
                          <button
                            type="button"
                            onClick={() => {
                              if (selectedRecord.googlePlaceId) {
                                navigator.clipboard.writeText(selectedRecord.googlePlaceId);
                                toast.success('Google Place ID copied');
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors cursor-pointer"
                            title="Copy Place ID"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-bold">Source:</span>
                      <span className="font-bold text-slate-800 uppercase px-2 py-0.5 bg-slate-100 rounded text-[10px]">
                        {selectedRecord.source || 'GOOGLE_PLACES'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-bold">Created From:</span>
                      <div>
                        {selectedRecord.createdFrom === 'MOBILE_APP' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
                            <span>📱</span>
                            <span>Mobile App</span>
                          </span>
                        ) : selectedRecord.createdFrom === 'ADMIN_PANEL' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-purple-50 text-purple-700 border border-purple-200 shadow-2xs">
                            <span>🖥</span>
                            <span>Admin Panel</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 font-bold text-xs">—</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-bold">Captured At:</span>
                      <span className="font-medium text-slate-700">
                        {selectedRecord.capturedAt ? new Date(selectedRecord.capturedAt).toLocaleString() : 'N/A'}
                      </span>
                    </div>
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
        subtitle="Manually create a new business record in Data Capture"
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

    </div>
  );
}
