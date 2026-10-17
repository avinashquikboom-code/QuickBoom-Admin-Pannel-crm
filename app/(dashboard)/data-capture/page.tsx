'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Database, Search, Download, Plus, Globe, Layers, MapPin, Tag, Star, Phone, Mail, ExternalLink, ShieldCheck, RefreshCw, Trash2, Check, X, AlertTriangle, Copy, Activity, Building2, Pencil, Loader2, UserPlus } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { dataCaptureApi } from '@/lib/data-capture-api';
import { getDataCaptureWorkflow } from '@/lib/data-capture-workflow';
import { useAuthStore } from '@/lib/store';
import { isAuthenticatedUser } from '@/lib/access-control';
import { AdminPageHeader, AdminStatCard, AdminCard, AdminButton, AdminFormDrawer, AdminConfirmDialog, AdminPagination, AdminDataTable } from '@/components/admin';
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
  photos?: string[];
  googlePhotos?: { url?: string; name?: string }[];
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
  LEAD_CREATED: { label: 'Lead Imported', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
};

export default function DataCapturePage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  // Button-level permissions
  const canCreate = isAuthenticatedUser(user);
  const canEdit = isAuthenticatedUser(user);
  const canDelete = isAuthenticatedUser(user);

  // Filters & Pagination State
  const [activeTab, setActiveTab] = useState<StatusTab>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => { setDebouncedSearch(searchQuery); setPage(1); }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);
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
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, label: string) => {
    if (!text || text === 'N/A') return;
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    toast.success(`${label} copied to clipboard`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Google Places Extraction Modal State
  const [extractModalOpen, setExtractModalOpen] = useState(false);
  const [extractKeyword, setExtractKeyword] = useState('');
  const [extractLocation, setExtractLocation] = useState('');
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

  // 1. Fetch Usage Metrics with graceful fallback
  const { data: usage, isError: usageError, refetch: refetchUsage } = useQuery<UsageSummary>({
    queryKey: ['data-capture-usage'],
    queryFn: async () => {
      const res = await dataCaptureApi.usage();
      return res.data;
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
    queryKey: ['data-capture-list', page, limit, activeTab, sourceFilter, createdFromFilter, debouncedSearch],
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
      if (debouncedSearch.trim()) {
        params.search = debouncedSearch.trim();
      }
      const res: any = await dataCaptureApi.list(params);

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

  const drawerRecordId = React.useRef<number | undefined>(undefined);
  const workflow = getDataCaptureWorkflow(selectedRecord);
  const { isRejected: isRejectedRecord, isImported: isLeadAdded,
    isValidated: isValidatedRecord, canDecide: canDecideRecord } = workflow;
  const workflowLabel = isLeadAdded ? 'LEAD IMPORTED' : workflow.displayStatus;
  const workflowStyle = STATUS_CONFIG[workflow.displayStatus] || STATUS_CONFIG.CAPTURED;
  const rejectionNotes = isRejectedRecord ? selectedRecord?.notes?.trim() : '';
  const rejectionMarker = '[REJECTION REASON]:';
  const rejectionReason = rejectionNotes?.includes(rejectionMarker)
    ? rejectionNotes.slice(rejectionNotes.lastIndexOf(rejectionMarker) + rejectionMarker.length).trim()
    : '';

  const logWorkflowRecord = (record: CapturedPlace) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug('[DATA_CAPTURE_DETAIL_WORKFLOW]', {
        recordId: record.id, status: record.status,
        businessStatus: record.businessStatus, isImported: record.isImported,
      });
    }
  };

  const refreshDrawerAfterDecision = async (id: number, response: any) => {
    const updated: CapturedPlace = response?.data || response;
    if (updated?.id === id && updated.status) {
      setSelectedRecord((current) => current?.id === id ? updated : current);
      if (drawerRecordId.current === id) {
        setEditForm((current) => ({ ...current, status: updated.status, notes: updated.notes || '' }));
      }
    }
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['data-capture-list'] }),
      queryClient.invalidateQueries({ queryKey: ['data-capture-usage'] }),
      queryClient.invalidateQueries({ queryKey: ['data-capture-detail', id] }),
    ]);
    try {
      const detailed: any = await queryClient.fetchQuery({
        queryKey: ['data-capture-detail', id],
        queryFn: () => dataCaptureApi.detail(id),
        staleTime: 0,
      });
      const record: CapturedPlace = detailed?.data || detailed;
      logWorkflowRecord(record);
      setSelectedRecord((current) => current?.id === id ? record : current);
      if (drawerRecordId.current === id) {
        setEditForm((current) => ({ ...current, status: record.status, notes: record.notes || '' }));
      }
    } catch (error) {
      if (drawerRecordId.current === id) {
        setDetailError(`Changes saved, but details could not be refreshed. ${getErrorMessage(error)}`);
      }
    }
  };

  // Single Record Query for Drawer
  const openDetailDrawer = async (record: CapturedPlace) => {
    drawerRecordId.current = record.id;
    setDetailError('');
    setDetailLoading(true);
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
        const detailed: any = await dataCaptureApi.detail(record.id);
        const data = detailed?.data || detailed;
        if (data && drawerRecordId.current === record.id) {
          logWorkflowRecord(data);
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
      } catch (error) {
        if (drawerRecordId.current === record.id) setDetailError(getErrorMessage(error));
      } finally { if (drawerRecordId.current === record.id) setDetailLoading(false); }
    }
  };

  // Mutations
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<CapturedPlace> }) => {
      return dataCaptureApi.update(id, data);
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

  const validateMutation = useMutation({
    mutationFn: async (id: number) => {
      return dataCaptureApi.validate(id);
    },
    onSuccess: async (res: any, id: number) => {
      toast.success('Prospect marked as VALIDATED!');
      await refreshDrawerAfterDecision(id, res);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason?: string }) => {
      return dataCaptureApi.reject(id, reason);
    },
    onSuccess: async (res: any, { id }: { id: number; reason?: string }) => {
      toast.success('Prospect marked as REJECTED');
      setRejectModalOpen(false);
      setRejectReason('');
      await refreshDrawerAfterDecision(id, res);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return dataCaptureApi.remove(id);
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
      return dataCaptureApi.bulk(ids, action, reason);
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
      return dataCaptureApi.create(data);
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

  const importInFlight = React.useRef(false);
  const importLeadMutation = useMutation({
    mutationFn: async (id: number) => {
      const response: any = await dataCaptureApi.importLead(id);
      const result = response?.data || response;
      if (!result?.lead?.id || result.record?.importedLeadId !== result.lead.id) {
        throw new Error('Import response is missing its Lead link. Refresh the record before retrying.');
      }
      return result;
    },
    onSuccess: async (result: any, id: number) => {
      await Promise.all([
        refreshDrawerAfterDecision(id, { data: result.record }),
        queryClient.invalidateQueries({ queryKey: ['leads'] }),
        queryClient.invalidateQueries({ queryKey: ['lead', result.lead.id] }),
      ]);
      toast.success(result.alreadyImported ? 'Existing Lead linked successfully' : 'Lead imported successfully');
    },
    onError: async (error, id) => {
      toast.error(getErrorMessage(error));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['data-capture-list'] }),
        queryClient.invalidateQueries({ queryKey: ['data-capture-detail', id] }),
      ]);
    },
    onSettled: () => { importInFlight.current = false; },
  });
  const importRecord = (record: CapturedPlace) => {
    if (importInFlight.current || !record.id || !getDataCaptureWorkflow(record).isValidated) return;
    importInFlight.current = true;
    importLeadMutation.mutate(record.id);
  };
  const renderImportButton = (record: CapturedPlace) => {
    const importing = importLeadMutation.isPending && importLeadMutation.variables === record.id;
    return <button type="button" disabled={isAnyMutating} onClick={() => importRecord(record)}
      className="h-[34px] px-3 rounded-lg bg-brand-800 hover:bg-brand-900 text-white text-[13px] font-semibold inline-flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed">
      {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
      {importing ? 'Importing...' : 'Import Lead'}
    </button>;
  };

  const isAnyMutating =
    validateMutation.isPending ||
    rejectMutation.isPending ||
    deleteMutation.isPending ||
    updateMutation.isPending || importLeadMutation.isPending;

  // Lock body scroll and handle Escape key for Detail Drawer
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (
          e.key === 'Escape' &&
          !validateMutation.isPending &&
          !rejectMutation.isPending &&
          !deleteMutation.isPending &&
          !updateMutation.isPending && !importLeadMutation.isPending
        ) {
          setDrawerOpen(false);
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = 'unset';
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [
    drawerOpen,
    validateMutation.isPending,
    rejectMutation.isPending,
    deleteMutation.isPending,
    updateMutation.isPending,
    importLeadMutation.isPending,
  ]);

  // Handlers
  const handleSelectRow = (id: number | string) => {
    const numId = Number(id);
    if (!Number.isFinite(numId)) return;
    setSelectedIds((prev) =>
      prev.includes(numId) ? prev.filter((item) => item !== numId) : [...prev, numId]
    );
  };

  const handleSelectAllOnPage = () => {
    const pageIds = places
      .map((p) => (p.id != null ? Number(p.id) : null))
      .filter((id): id is number => id !== null && Number.isFinite(id));

    if (pageIds.length === 0) return;

    setSelectedIds((prev) => {
      const allSelected = pageIds.every((id) => prev.includes(id));
      if (allSelected) {
        return prev.filter((id) => !pageIds.includes(id));
      } else {
        return Array.from(new Set([...prev, ...pageIds]));
      }
    });
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
      const res: any = await dataCaptureApi.extract({
        keyword: extractKeyword.trim(),
        location: extractLocation.trim(),
        maxResults: requestedNum,
      });

      toast.dismiss(toastId);
      setIsExtracting(false);
      setExtractModalOpen(false);

      const capturedCount = res.data.captured;
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

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-16 text-slate-800 animate-in fade-in-50 duration-200">
      {/* 1. STANDARD PAGE HEADER */}
      <AdminPageHeader
        title="Data Capture"
        description="Extract and verify business prospects with Google Places API integration."
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <AdminStatCard
          title="Total Captured"
          value={usage?.totalLeadsCaptured ?? totalCount}
          description="Verified business records"
          icon={Database}
          iconBg="primary"
        />
        <AdminStatCard
          title="Validated Prospects"
          value={usage?.validatedCount ?? places.filter((p) => p.status === 'VALIDATED').length}
          description="Reviewed business records"
          icon={ShieldCheck}
          iconBg="primary"
        />

        <AdminStatCard
          title="API Quota Remaining"
          value={`${usage?.quotaRemaining ?? '—'} / ${usage?.quotaLimit ?? '—'}`}
          description={`${usage?.totalGoogleApiCalls || 0} API requests made`}
          icon={Layers}
          iconBg="blue"
        />
      </div>

      {/* 3. STATUS TABS & SEARCH / FILTER BAR */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-xs space-y-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
          {(['ALL', 'CAPTURED', 'VALIDATED', 'DUPLICATE', 'REJECTED'] as StatusTab[]).map((tab) => {
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
                    ? places.filter((p) => p.id != null && selectedIds.includes(Number(p.id)))
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
            {places.length > 0 && (
              <button
                type="button"
                onClick={handleSelectAllOnPage}
                className="ml-2 text-xs text-emerald-400 hover:text-emerald-300 underline font-semibold cursor-pointer"
              >
                {places.filter((p) => p.id != null).length > 0 &&
                places
                  .filter((p) => p.id != null)
                  .every((p) => selectedIds.includes(Number(p.id)))
                  ? 'Deselect page'
                  : 'Select all on page'}
              </button>
            )}
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


        {isError ? (
          <div role="alert" className="p-8 text-center space-y-3">
            <p className="text-sm text-rose-600">{getErrorMessage(error)}</p>
            <AdminButton onClick={() => refetchList()}>Retry</AdminButton>
          </div>
        ) : (
          <AdminDataTable<CapturedPlace>
            data={places}
            loading={isLoading}
            emptyTitle="No captured records found"
            emptyDescription="Try changing your search or filters, or start a new capture."
            keyExtractor={(record, index) => String(record.id ?? index)}
            onRowClick={openDetailDrawer}
            minWidth="min-w-[1000px]"
            columns={[
              {
                key: 'selection',
                headerClassName: 'w-12 text-center',
                className: 'w-12 text-center',
                header: (
                  <div
                    className="flex items-center justify-center p-1 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectAllOnPage();
                    }}
                    title="Select all on this page"
                  >
                    <input
                      type="checkbox"
                      aria-label="Select all on this page"
                      checked={
                        places.length > 0 &&
                        places.filter((p) => p.id != null).length > 0 &&
                        places
                          .filter((p) => p.id != null)
                          .every((p) => selectedIds.includes(Number(p.id)))
                      }
                      ref={(input) => {
                        if (input) {
                          const validPlaces = places.filter((p) => p.id != null);
                          const selectedCountOnPage = validPlaces.filter((p) =>
                            selectedIds.includes(Number(p.id))
                          ).length;
                          input.indeterminate =
                            selectedCountOnPage > 0 && selectedCountOnPage < validPlaces.length;
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                      onChange={handleSelectAllOnPage}
                      className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                    />
                  </div>
                ),
                render: (record) => {
                  const recId = record.id != null ? Number(record.id) : null;
                  const isChecked = recId != null && selectedIds.includes(recId);
                  return (
                    <div
                      className="flex items-center justify-center p-1 cursor-pointer"
                      onClick={(event) => {
                        event.stopPropagation();
                        if (recId != null) handleSelectRow(recId);
                      }}
                    >
                      <input
                        type="checkbox"
                        aria-label={`Select ${record.businessName}`}
                        checked={isChecked}
                        disabled={recId == null}
                        onClick={(event) => event.stopPropagation()}
                        onChange={() => {
                          if (recId != null) handleSelectRow(recId);
                        }}
                        className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                      />
                    </div>
                  );
                },
              },
              { key: 'businessName', header: 'Business', render: (record) => (
                <div><p className="font-bold text-slate-900">{record.businessName}</p>
                  <p className="text-slate-500 mt-1">{record.category || '—'}</p></div>
              ) },
              { key: 'phone', header: 'Contact', render: (record) => (
                <div><p>{record.phone || '—'}</p><p className="text-slate-500 mt-1">{record.email || '—'}</p></div>
              ) },
              { key: 'address', header: 'Location', className: 'max-w-xs' },
              { key: 'status', header: 'Status', render: (record) => {
                const recordWorkflow = getDataCaptureWorkflow(record);
                const status = STATUS_CONFIG[recordWorkflow.displayStatus];
                return <span className={`inline-flex rounded-full border px-2.5 py-1 ${status?.bg || 'bg-slate-50'} ${status?.text || 'text-slate-700'} ${status?.border || 'border-slate-200'}`}>
                  {status?.label || recordWorkflow.displayStatus}
                </span>;
              } },
              { key: 'source', header: 'Source' },
              { key: 'capturedAt', header: 'Captured', render: (record) => {
                const date = new Date(record.capturedAt);
                return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString();
              } },
              { key: 'actions', header: 'Actions', render: (record) => {
                const recordWorkflow = getDataCaptureWorkflow(record);
                if (recordWorkflow.isImported) {
                  return recordWorkflow.leadId
                    ? <Link href={`/leads/${recordWorkflow.leadId}`} onClick={(event) => event.stopPropagation()} className="text-brand-900 font-bold hover:underline">View Lead</Link>
                    : <span role="status" className="inline-flex items-center gap-1.5 text-brand-900 font-semibold"><Check className="w-4 h-4" />Lead Imported</span>;
                }
                return <div className="flex flex-wrap items-center gap-2" onClick={(event) => event.stopPropagation()}>
                  <button type="button" className="text-emerald-700 font-bold hover:underline"
                    onClick={() => openDetailDrawer(record)}>View details</button>
                  {recordWorkflow.isValidated && canEdit && renderImportButton(record)}
                </div>;
              } },
            ]}
          />
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

      {usageError && <p role="alert" className="text-rose-600">Usage could not be loaded. Refresh to retry.</p>}
      {/* 6. RIGHT-SIDE DETAIL DRAWER (DO NOT NAVIGATE TO NEW PAGE) */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-50 overflow-hidden select-none"
          role="dialog"
          aria-modal="true"
          aria-labelledby="data-capture-drawer-title"
        >
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
            onClick={() => {
              if (!isAnyMutating) setDrawerOpen(false);
            }}
            aria-hidden="true"
          />

          {/* Sliding Drawer Container */}
          <div className="fixed inset-y-0 right-0 flex max-w-full pointer-events-none">
            <div
              className="pointer-events-auto w-full sm:w-[75vw] md:w-[70vw] lg:w-[650px] lg:max-w-[45vw] lg:min-w-[580px] xl:w-[680px] h-screen bg-white shadow-2xl flex flex-col justify-between transform transition-transform ease-out duration-300 animate-in slide-in-from-right border-l border-slate-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 1. STICKY HEADER */}
              <div className="px-5 py-4 sm:px-6 sm:py-4 border-b border-slate-100 bg-white shrink-0 sticky top-0 z-20 flex items-start justify-between gap-3 shadow-2xs">
                {/* Left: Data Capture icon inside soft green circle */}
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-[#1AA14D] border border-emerald-200/80 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  <Database className="w-5 h-5 text-[#23C45E]" />
                </div>

                {/* Center: Business Name, Source, Category & Operational status */}
                <div className="flex-1 min-w-0 pr-2">
                  <h2
                    id="data-capture-drawer-title"
                    className="text-base sm:text-lg font-black text-slate-900 leading-snug line-clamp-2 sm:line-clamp-3"
                    style={{ overflowWrap: 'anywhere' }}
                    title={selectedRecord?.businessName}
                  >
                    {selectedRecord?.businessName || 'Prospect Details'}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5 truncate">
                    Captured via {selectedRecord?.source || 'GOOGLE_PLACES'}
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200/70">
                      <Tag className="w-3 h-3 text-slate-500 shrink-0" />
                      <span className="truncate max-w-[150px]">{selectedRecord?.category || 'General Business'}</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      <span>Business: {selectedRecord?.businessStatus || 'Unknown'}</span>
                    </span>
                    {selectedRecord && !detailLoading && !detailError && (
                      <span aria-label="Data Capture workflow status" className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${workflowStyle.bg} ${workflowStyle.text} ${workflowStyle.border}`}>
                        Data Capture: {workflowLabel}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: Clean close button inside a square rounded container */}
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  disabled={isAnyMutating}
                  className="w-9 h-9 rounded-xl border border-slate-200/80 bg-white text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center shrink-0 shadow-2xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#23C45E] disabled:opacity-50"
                  aria-label="Close drawer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 2. SCROLLABLE CONTENT */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 pb-6 space-y-4 text-slate-800">
                {detailLoading && (
                  <div className="py-16 flex flex-col items-center justify-center space-y-3">
                    <Loader2 className="w-8 h-8 text-[#23C45E] animate-spin" />
                    <p className="text-xs font-bold text-slate-400">Loading record details…</p>
                  </div>
                )}

                {detailError && (
                  <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium" role="alert">
                    {detailError}
                  </div>
                )}

                {selectedRecord && !detailLoading && !detailError && (
                  <div className="space-y-4">
                    {isRejectedRecord && rejectionNotes && (
                      <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
                        <p className="font-bold mb-1">{rejectionReason ? 'Rejection reason' : 'Rejection notes'}</p>
                        <p className="whitespace-pre-wrap">{rejectionReason || rejectionNotes}</p>
                      </div>
                    )}
                    {/* Photos */}
                    {(selectedRecord.googlePhotos?.[0]?.url || selectedRecord.photos?.[0]) && (
                      <div className="overflow-hidden rounded-2xl border border-slate-200/80 shadow-2xs bg-slate-100">
                        <img
                          src={selectedRecord.googlePhotos?.[0]?.url || selectedRecord.photos?.[0]}
                          alt={selectedRecord.businessName}
                          className="w-full max-h-56 object-cover"
                          onError={(event) => { event.currentTarget.style.display = 'none'; }}
                        />
                      </div>
                    )}

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
                      <div className="space-y-4">
                        {/* 1. BUSINESS DETAILS CARD */}
                        <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-3.5">
                          <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
                            <Building2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <h3 className="text-xs sm:text-sm font-bold text-slate-900 tracking-wide uppercase">
                              Business Details
                            </h3>
                          </div>

                          <div className="space-y-3 text-xs sm:text-sm">
                            <div className="flex items-start justify-between gap-4">
                              <span className="text-xs text-slate-500 font-medium shrink-0 pt-0.5">Business Name</span>
                              <span className="font-bold text-slate-900 text-right min-w-0" style={{ overflowWrap: 'anywhere' }}>
                                {selectedRecord.businessName || '—'}
                              </span>
                            </div>

                            <div className="flex items-center justify-between gap-4">
                              <span className="text-xs text-slate-500 font-medium shrink-0">Category</span>
                              <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-800 text-xs font-semibold border border-slate-200/60">
                                {selectedRecord.category || 'General Business'}
                              </span>
                            </div>

                            <div className="flex items-center justify-between gap-4">
                              <span className="text-xs text-slate-500 font-medium shrink-0">Business status</span>
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                <span>{selectedRecord.businessStatus || 'Unknown'}</span>
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* 2. CONTACT INFORMATION CARD */}
                        <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-3.5">
                          <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
                            <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                            <h3 className="text-xs sm:text-sm font-bold text-slate-900 tracking-wide uppercase">
                              Contact Information
                            </h3>
                          </div>

                          <div className="space-y-3 text-xs sm:text-sm">
                            <div className="flex items-center justify-between gap-3">
                              <span className="flex items-center gap-2 text-xs text-slate-500 font-medium shrink-0">
                                <Phone className="w-3.5 h-3.5 text-slate-400" />
                                Phone
                              </span>
                              {selectedRecord.phone && selectedRecord.phone !== 'N/A' ? (
                                <div className="flex items-center gap-2 min-w-0">
                                  <a
                                    href={`tel:${selectedRecord.phone}`}
                                    className="font-bold text-slate-900 hover:text-emerald-600 transition-colors truncate"
                                  >
                                    {selectedRecord.phone}
                                  </a>
                                  <button
                                    type="button"
                                    onClick={() => handleCopy(selectedRecord.phone!, 'Phone number')}
                                    aria-label="Copy phone number"
                                    className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                                    title="Copy phone"
                                  >
                                    {copiedField === 'Phone number' ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                </div>
                              ) : (
                                <span className="text-slate-400 font-medium">N/A</span>
                              )}
                            </div>

                            <div className="flex items-center justify-between gap-3">
                              <span className="flex items-center gap-2 text-xs text-slate-500 font-medium shrink-0">
                                <Mail className="w-3.5 h-3.5 text-slate-400" />
                                Email
                              </span>
                              {selectedRecord.email && selectedRecord.email !== 'N/A' ? (
                                <div className="flex items-center gap-2 min-w-0">
                                  <a
                                    href={`mailto:${selectedRecord.email}`}
                                    className="font-bold text-sky-600 hover:underline truncate"
                                  >
                                    {selectedRecord.email}
                                  </a>
                                  <button
                                    type="button"
                                    onClick={() => handleCopy(selectedRecord.email!, 'Email address')}
                                    aria-label="Copy email address"
                                    className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                                    title="Copy email"
                                  >
                                    {copiedField === 'Email address' ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                </div>
                              ) : (
                                <span className="text-slate-400 font-medium">N/A</span>
                              )}
                            </div>

                            <div className="flex items-center justify-between gap-3">
                              <span className="flex items-center gap-2 text-xs text-slate-500 font-medium shrink-0">
                                <Globe className="w-3.5 h-3.5 text-slate-400" />
                                Website
                              </span>
                              {selectedRecord.website && selectedRecord.website !== 'N/A' ? (
                                <div className="flex items-center gap-1.5 min-w-0 max-w-[65%] justify-end">
                                  <a
                                    href={selectedRecord.website.startsWith('http') ? selectedRecord.website : `https://${selectedRecord.website}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label="Visit website in new tab"
                                    className="font-bold text-blue-600 hover:underline truncate flex items-center gap-1"
                                    title={selectedRecord.website}
                                  >
                                    <span className="truncate">{selectedRecord.website.replace(/^https?:\/\/(www\.)?/, '')}</span>
                                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                                  </a>
                                </div>
                              ) : (
                                <span className="text-slate-400 font-medium">N/A</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* 3. LOCATION & ADDRESS CARD */}
                        {(() => {
                          const loc = parseAddressDetails(selectedRecord);
                          const coordsText = (loc.latitude !== undefined && loc.longitude !== undefined)
                            ? `${loc.latitude.toFixed(6)}, ${loc.longitude.toFixed(6)}`
                            : null;

                          return (
                            <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-3.5">
                              <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
                                <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                                <h3 className="text-xs sm:text-sm font-bold text-slate-900 tracking-wide uppercase">
                                  Location & Address
                                </h3>
                              </div>

                              <div className="space-y-3">
                                {/* Full address highlighted in soft background row */}
                                <div className="p-3.5 rounded-xl bg-slate-50/90 border border-slate-200/60 text-slate-800 text-xs sm:text-sm leading-relaxed flex items-start gap-2.5">
                                  <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                                  <span className="font-medium min-w-0" style={{ overflowWrap: 'anywhere' }}>
                                    {loc.fullAddress}
                                  </span>
                                </div>

                                {/* Responsive 2-column cards: City, State / Country, Pincode */}
                                <div className="grid grid-cols-2 gap-2.5">
                                  <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100">
                                    <span className="text-[11px] font-medium text-slate-400 block mb-0.5">City</span>
                                    <span className="text-xs sm:text-sm font-bold text-slate-800 truncate block">
                                      {loc.city || 'N/A'}
                                    </span>
                                  </div>
                                  <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100">
                                    <span className="text-[11px] font-medium text-slate-400 block mb-0.5">State</span>
                                    <span className="text-xs sm:text-sm font-bold text-slate-800 truncate block">
                                      {loc.state || 'N/A'}
                                    </span>
                                  </div>
                                  <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100">
                                    <span className="text-[11px] font-medium text-slate-400 block mb-0.5">Country</span>
                                    <span className="text-xs sm:text-sm font-bold text-slate-800 truncate block">
                                      {loc.country || 'N/A'}
                                    </span>
                                  </div>
                                  <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100">
                                    <span className="text-[11px] font-medium text-slate-400 block mb-0.5">Pincode</span>
                                    <span className="text-xs sm:text-sm font-bold text-slate-800 truncate block">
                                      {loc.pincode || 'N/A'}
                                    </span>
                                  </div>
                                </div>

                                {/* Coordinates */}
                                {coordsText && (
                                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 border border-slate-100 text-xs sm:text-sm">
                                    <div>
                                      <span className="text-[11px] font-medium text-slate-400 block mb-0.5">Coordinates</span>
                                      <span className="font-mono font-bold text-slate-700">{coordsText}</span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleCopy(coordsText, 'Coordinates')}
                                      aria-label="Copy coordinates"
                                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer shrink-0"
                                      title="Copy coordinates"
                                    >
                                      {copiedField === 'Coordinates' ? (
                                        <Check className="w-4 h-4 text-emerald-600" />
                                      ) : (
                                        <Copy className="w-4 h-4" />
                                      )}
                                    </button>
                                  </div>
                                )}

                                {/* Full width Open in Google Maps */}
                                {loc.googleMapsUrl && (
                                  <a
                                    href={loc.googleMapsUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label="Open in Google Maps"
                                    className="flex items-center justify-center gap-2 w-full h-10 sm:h-11 rounded-xl bg-emerald-50 hover:bg-emerald-100/80 text-emerald-700 border border-emerald-200 text-xs sm:text-sm font-bold transition-colors shadow-2xs cursor-pointer"
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                    <span>Open in Google Maps ↗</span>
                                  </a>
                                )}
                              </div>
                            </div>
                          );
                        })()}

                        {/* 4. RATING SECTION */}
                        <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
                          <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
                            <Star className="w-4 h-4 text-amber-500 shrink-0" />
                            <h3 className="text-xs sm:text-sm font-bold text-slate-900 tracking-wide uppercase">
                              Rating & Reviews
                            </h3>
                          </div>

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
                            <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
                              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                                <div className="flex items-center gap-2">
                                  <Globe className="w-4 h-4 text-blue-500 shrink-0" />
                                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 tracking-wide uppercase">
                                    Discovered Social Media Handles
                                  </h3>
                                </div>
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
                                      className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/60"
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

                        {/* 6. SOURCE & METADATA SECTION */}
                        <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
                          <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
                            <Layers className="w-4 h-4 text-purple-600 shrink-0" />
                            <h3 className="text-xs sm:text-sm font-bold text-slate-900 tracking-wide uppercase">
                              Source & Metadata
                            </h3>
                          </div>

                          <div className="space-y-2.5 text-xs sm:text-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-500 font-medium">Provider:</span>
                              <span className="font-bold text-slate-800">{selectedRecord.provider || 'GOOGLE_PLACES'}</span>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-slate-500 font-medium">Google Place ID:</span>
                              <div className="flex items-center gap-1">
                                <span className="font-mono text-xs text-slate-700 max-w-[140px] truncate" title={selectedRecord.googlePlaceId}>
                                  {selectedRecord.googlePlaceId || 'N/A'}
                                </span>
                                {selectedRecord.googlePlaceId && (
                                  <button
                                    type="button"
                                    onClick={() => handleCopy(selectedRecord.googlePlaceId!, 'Google Place ID')}
                                    className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors cursor-pointer"
                                    title="Copy Place ID"
                                    aria-label="Copy Google Place ID"
                                  >
                                    {copiedField === 'Google Place ID' ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-slate-500 font-medium">Source:</span>
                              <span className="font-bold text-slate-800 uppercase px-2 py-0.5 bg-slate-100 rounded text-[10px]">
                                {selectedRecord.source || 'GOOGLE_PLACES'}
                              </span>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-slate-500 font-medium">Created From:</span>
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
                              <span className="text-slate-500 font-medium">Captured At:</span>
                              <span className="font-medium text-slate-700">
                                {selectedRecord.capturedAt ? new Date(selectedRecord.capturedAt).toLocaleString() : 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* 7. Notes Section */}
                        {selectedRecord.notes && (
                          <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
                            <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Notes & History</span>
                            <p className="text-xs text-slate-700 font-medium whitespace-pre-wrap">{selectedRecord.notes}</p>
                          </div>
                        )}

                        {/* 8. Raw API Data Inspection Toggle */}
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
              </div>

              {/* 3. STICKY ACTION FOOTER */}
              {(() => {
                // Rejected state: hide the entire footer action area completely
                if (isRejectedRecord) return null;

                // Editing mode: Cancel & Save Changes
                if (isEditing) {
                  return (
                    <div className="sticky bottom-0 z-20 px-4 py-3 bg-white border-t border-slate-200/80 shrink-0">
                      <div className="flex items-center justify-end gap-2 w-full">
                        <button
                          type="button"
                          disabled={isAnyMutating}
                          onClick={() => setIsEditing(false)}
                          className="h-10 px-4 rounded-[10px] border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm inline-flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={isAnyMutating}
                          onClick={() => {
                            if (!editForm.businessName?.trim()) {
                              toast.error('Business name is required');
                              return;
                            }
                            const changes = Object.fromEntries(
                              Object.entries(editForm).filter(([key, value]) =>
                                value !== (selectedRecord as any)[key] && !(value === '' && (selectedRecord as any)[key] == null)
                              )
                            );
                            updateMutation.mutate({ id: selectedRecord?.id!, data: changes });
                          }}
                          className="h-10 px-4.5 rounded-[10px] bg-[#1AA14D] hover:bg-[#15803d] text-white font-semibold text-sm inline-flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
                        >
                          {updateMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                          ) : (
                            <Check className="w-4 h-4 shrink-0" />
                          )}
                          <span>{updateMutation.isPending ? 'Saving…' : 'Save Changes'}</span>
                        </button>
                      </div>
                    </div>
                  );
                }

                // Captured / Pending State: [ Delete ] on left, [ Edit ] [ ✓ Validate ] [ × Reject ] on right
                if (canDecideRecord) {
                  return (
                    <div className="sticky bottom-0 z-20 px-4 py-3 bg-white border-t border-slate-200/80 shrink-0">
                      <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:justify-between sm:gap-2.5 w-full">
                        {canDelete && selectedRecord?.id && (
                          <button
                            type="button"
                            disabled={isAnyMutating}
                            onClick={() => {
                              setRecordToDelete(selectedRecord.id!);
                              setDeleteConfirmOpen(true);
                            }}
                            className="h-10 px-4 rounded-[10px] border border-rose-200 bg-white hover:bg-rose-50 hover:border-rose-300 text-rose-600 font-semibold text-sm inline-flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
                          >
                            {deleteMutation.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                            ) : (
                              <Trash2 className="w-4 h-4 shrink-0" />
                            )}
                            <span>{deleteMutation.isPending ? 'Deleting...' : 'Delete'}</span>
                          </button>
                        )}

                        <div className="contents sm:flex sm:items-center sm:gap-2">
                          {canEdit && selectedRecord?.id && !detailLoading && !detailError && (
                            <button
                              type="button"
                              disabled={isAnyMutating}
                              onClick={() => setIsEditing(true)}
                              className="h-10 px-4 rounded-[10px] border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700 font-semibold text-sm inline-flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
                            >
                              <Pencil className="w-4 h-4 shrink-0" />
                              <span>Edit</span>
                            </button>
                          )}

                          <button
                            type="button"
                            disabled={isAnyMutating}
                            onClick={() => validateMutation.mutate(selectedRecord!.id!)}
                            className="h-10 px-4 rounded-[10px] bg-[#1AA14D] hover:bg-[#15803d] text-white font-semibold text-sm inline-flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                          >
                            {validateMutation.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                            ) : (
                              <Check className="w-4 h-4 shrink-0" />
                            )}
                            <span>{validateMutation.isPending ? 'Validating...' : 'Validate'}</span>
                          </button>

                          <button
                            type="button"
                            disabled={isAnyMutating}
                            onClick={() => setRejectModalOpen(true)}
                            className="h-10 px-4 rounded-[10px] bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm inline-flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                          >
                            {rejectMutation.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                            ) : (
                              <X className="w-4 h-4 shrink-0" />
                            )}
                            <span>{rejectMutation.isPending ? 'Rejecting...' : 'Reject'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }

                if (isValidatedRecord && selectedRecord) {
                  return <div className="sticky bottom-0 z-20 px-4 py-3 bg-white border-t border-slate-200/80 shrink-0 flex justify-end">
                    {renderImportButton(selectedRecord)}
                  </div>;
                }

                // Imported State: [ View Lead → ] or [ ✓ Lead Imported ] aligned to right
                if (isLeadAdded) {
                  return (
                    <div className="sticky bottom-0 z-20 px-4 py-3 bg-white border-t border-slate-200/80 shrink-0">
                      <div className="flex items-center justify-end w-full">
                        {workflow.leadId ? <Link href={`/leads/${workflow.leadId}`} className="h-10 px-4 rounded-lg border border-slate-200 text-brand-900 font-semibold text-sm inline-flex items-center gap-2 hover:bg-brand-50">View Lead</Link> :
                          <span className="h-10 px-4 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-semibold text-sm inline-flex items-center gap-2" role="status">
                            <Check className="w-4 h-4 shrink-0" />Lead Imported
                          </span>}

                      </div>
                    </div>
                  );
                }

                return null;
              })()}
            </div>
          </div>
        </div>
      )}

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
