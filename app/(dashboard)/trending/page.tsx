'use client';

import React, { useState } from 'react';
import {
  Plus,
  Search,
  TrendingUp,
  Video,
  Flame,
  Sparkles,
  Percent,
  Layers,
  Edit2,
  Trash2,
  ExternalLink,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Calendar,
  Instagram,
  RefreshCw,
  SlidersHorizontal,
  Upload,
  Link as LinkIcon,
  Image as ImageIcon,
  Play,
  Maximize2,
  X,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AdminPageHero,
  AdminStatCard,
  AdminFormDrawer,
  AdminPagination,
  AdminConfirmDialog,
} from '@/components/admin';
import {
  TrendingService,
  TrendingCategory,
  TrendingContentItem,
  CreateTrendingPayload,
  UpdateTrendingPayload,
} from '@/lib/services/trending.service';
import { toast } from 'react-hot-toast';
import { getErrorMessage } from '@/lib/utils';

export default function TrendingManagementPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TrendingCategory | 'ALL'>('ALL');
  const [publishFilter, setPublishFilter] = useState<'ALL' | 'PUBLISHED' | 'UNPUBLISHED'>('ALL');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Drawer / Modal states
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TrendingContentItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TrendingContentItem | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Full-Screen Media Lightbox Modal
  const [previewMedia, setPreviewMedia] = useState<{
    url: string;
    type: 'IMAGE' | 'VIDEO';
    title?: string;
  } | null>(null);

  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState<TrendingCategory>('REEL');

  // Media configuration states
  const [mediaType, setMediaType] = useState<'IMAGE' | 'VIDEO'>('IMAGE');
  const [mediaSource, setMediaSource] = useState<'UPLOAD' | 'URL'>('UPLOAD');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [formMediaUrl, setFormMediaUrl] = useState('');
  const [formThumbnailUrl, setFormThumbnailUrl] = useState('');

  const [formCtaText, setFormCtaText] = useState('View Idea');
  const [formCtaUrl, setFormCtaUrl] = useState('');
  const [formPlatform, setFormPlatform] = useState('INSTAGRAM');
  const [formObjective, setFormObjective] = useState('ENGAGEMENT');
  const [formPriority, setFormPriority] = useState(10);
  const [formIsPublished, setFormIsPublished] = useState(true);
  const [formIsActive, setFormIsActive] = useState(true);
  const [formStartAt, setFormStartAt] = useState('');
  const [formEndAt, setFormEndAt] = useState('');

  const resetForm = () => {
    setEditingItem(null);
    setFormTitle('');
    setFormDescription('');
    setFormCategory('REEL');
    setMediaType('IMAGE');
    setMediaSource('UPLOAD');
    setSelectedFile(null);
    setFilePreview(null);
    setFormMediaUrl('');
    setFormThumbnailUrl('');
    setFormCtaText('View Idea');
    setFormCtaUrl('');
    setFormPlatform('INSTAGRAM');
    setFormObjective('ENGAGEMENT');
    setFormPriority(10);
    setFormIsPublished(true);
    setFormIsActive(true);
    setFormStartAt('');
    setFormEndAt('');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (mediaType === 'IMAGE') {
      const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedImageTypes.includes(file.type.toLowerCase())) {
        toast.error('Invalid image format. Supported formats: JPG, JPEG, PNG, WEBP');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Image exceeds 10MB limit.');
        return;
      }
    } else {
      const allowedVideoTypes = ['video/mp4', 'video/quicktime', 'video/webm'];
      if (!allowedVideoTypes.includes(file.type.toLowerCase()) && !file.name.match(/\.(mp4|mov|webm)$/i)) {
        toast.error('Invalid video format. Supported formats: MP4, MOV, WEBM');
        return;
      }
      if (file.size > 100 * 1024 * 1024) {
        toast.error('Video exceeds 100MB limit.');
        return;
      }
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setFilePreview(objectUrl);
  };

  const openCreateDrawer = () => {
    resetForm();
    setIsDrawerOpen(true);
  };

  const openEditDrawer = (item: TrendingContentItem) => {
    resetForm();
    setEditingItem(item);
    setFormTitle(item.title);
    setFormDescription(item.description || '');
    setFormCategory(item.category);

    const isVideo =
      item.metadata?.mediaType === 'VIDEO' ||
      item.category === 'REEL' ||
      Boolean(item.mediaUrl?.match(/\.(mp4|mov|webm)(\?.*)?$/i));

    const detectedType: 'IMAGE' | 'VIDEO' = isVideo ? 'VIDEO' : 'IMAGE';
    const detectedSource: 'UPLOAD' | 'URL' = item.metadata?.mediaSource || 'URL';

    setMediaType(detectedType);
    setMediaSource(detectedSource);
    setFormThumbnailUrl(item.thumbnailUrl || '');
    setFormMediaUrl(item.mediaUrl || item.thumbnailUrl || '');
    setFormCtaText(item.ctaText || '');
    setFormCtaUrl(item.ctaUrl || '');
    setFormPlatform(item.platform || 'INSTAGRAM');
    setFormObjective(item.objective || 'ENGAGEMENT');
    setFormPriority(item.priority || 0);
    setFormIsPublished(item.isPublished);
    setFormIsActive(item.isActive);
    setFormStartAt(item.startAt ? new Date(item.startAt).toISOString().slice(0, 16) : '');
    setFormEndAt(item.endAt ? new Date(item.endAt).toISOString().slice(0, 16) : '');
    setIsDrawerOpen(true);
  };

  // ── Queries & Mutations ───────────────────────────────────────────────────

  const { data: trendingResponse, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin-trending', selectedCategory, publishFilter, search, page, pageSize],
    queryFn: async () => {
      const params: any = { page, limit: pageSize };
      if (selectedCategory !== 'ALL') params.category = selectedCategory;
      if (publishFilter === 'PUBLISHED') params.isPublished = true;
      if (publishFilter === 'UNPUBLISHED') params.isPublished = false;
      if (search.trim()) params.search = search.trim();
      return TrendingService.getTrendingList(params);
    },
  });

  const trendingItems = trendingResponse?.data || [];
  const pagination = trendingResponse?.pagination || trendingResponse?.meta || {
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  };

  // Stats calculation
  const statsAll = trendingItems.length;
  const statsReels = trendingItems.filter((i) => i.category === 'REEL').length;
  const statsStories = trendingItems.filter((i) => i.category === 'STORY').length;
  const statsOffers = trendingItems.filter((i) => i.category === 'OFFER').length;
  const statsHighRoi = trendingItems.filter((i) => i.category === 'HIGH_ROI_AD').length;

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!formTitle.trim()) {
        throw new Error('Please enter a content title');
      }

      // Validation for media
      if (mediaSource === 'UPLOAD' && !selectedFile && (!editingItem || !editingItem.mediaUrl)) {
        throw new Error(`Please select a ${mediaType.toLowerCase()} file to upload.`);
      }

      if (mediaSource === 'URL') {
        const urlToValidate = formMediaUrl.trim();
        if (!urlToValidate) {
          throw new Error(`Please enter a valid ${mediaType.toLowerCase()} URL.`);
        }
        if (!urlToValidate.startsWith('http://') && !urlToValidate.startsWith('https://')) {
          throw new Error('Media URL must start with http:// or https://');
        }
      }

      const payload: CreateTrendingPayload = {
        title: formTitle.trim(),
        description: formDescription.trim() || undefined,
        category: formCategory,
        mediaType,
        mediaSource,
        thumbnailUrl: formThumbnailUrl.trim() || undefined,
        mediaUrl: mediaSource === 'URL' ? formMediaUrl.trim() : (editingItem && !selectedFile ? editingItem.mediaUrl || undefined : undefined),
        file: selectedFile || undefined,
        ctaText: formCtaText.trim() || undefined,
        ctaUrl: formCtaUrl.trim() || undefined,
        platform: formPlatform.trim() || 'INSTAGRAM',
        objective: formObjective.trim() || 'ENGAGEMENT',
        priority: Number(formPriority) || 0,
        isPublished: formIsPublished,
        isActive: formIsActive,
        startAt: formStartAt ? new Date(formStartAt).toISOString() : null,
        endAt: formEndAt ? new Date(formEndAt).toISOString() : null,
        metadata: {
          mediaType,
          mediaSource,
        },
      };

      if (editingItem) {
        return TrendingService.updateTrending(editingItem.id, payload);
      } else {
        return TrendingService.createTrending(payload);
      }
    },
    onSuccess: () => {
      toast.success(editingItem ? 'Trending content updated successfully' : 'Trending content published successfully');
      setIsDrawerOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['admin-trending'] });
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err));
    },
  });

  const togglePublishMutation = useMutation({
    mutationFn: async ({ id, isPublished }: { id: number; isPublished: boolean }) => {
      return TrendingService.setPublished(id, isPublished);
    },
    onSuccess: (_, variables) => {
      toast.success(variables.isPublished ? 'Content published to Customer App' : 'Content unpublished');
      queryClient.invalidateQueries({ queryKey: ['admin-trending'] });
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err));
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      return TrendingService.setActiveStatus(id, isActive);
    },
    onSuccess: (_, variables) => {
      toast.success(variables.isActive ? 'Content marked active' : 'Content disabled');
      queryClient.invalidateQueries({ queryKey: ['admin-trending'] });
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return TrendingService.deleteTrending(id);
    },
    onSuccess: () => {
      toast.success('Trending content removed from database');
      setIsDeleteOpen(false);
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ['admin-trending'] });
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err));
    },
  });

  const getCategoryBadge = (category: TrendingCategory) => {
    switch (category) {
      case 'REEL':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-black text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full">
            <Flame className="w-3 h-3 text-rose-500" />
            Viral Reel
          </span>
        );
      case 'STORY':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-black text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
            <Sparkles className="w-3 h-3 text-amber-500" />
            Story Hook
          </span>
        );
      case 'OFFER':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
            <Percent className="w-3 h-3 text-emerald-500" />
            Promo Offer
          </span>
        );
      case 'HIGH_ROI_AD':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-black text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
            <Layers className="w-3 h-3 text-blue-500" />
            High ROI Ad
          </span>
        );
      default:
        return (
          <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
            {category}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-16 text-slate-800 animate-in fade-in-50 duration-200">
      {/* 1. Top Hero Card */}
      <AdminPageHero
        badge={{
          text: 'MARKETING ENGINE',
          icon: TrendingUp,
          variant: 'emerald',
        }}
        title="Trending Media & Campaigns"
        description="Publish and manage high-converting reels, promotional offers, story hooks, and video creatives with file uploads or public media links."
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="p-2.5 bg-white/10 hover:bg-white/15 text-white rounded-2xl border border-white/10 text-xs font-black transition-all cursor-pointer backdrop-blur-xs disabled:opacity-50 active:scale-95"
              title="Refresh database records"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin text-[#23C45E]' : ''}`} />
            </button>

            <button
              onClick={openCreateDrawer}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#23C45E] hover:bg-[#1AA14D] text-slate-950 font-black rounded-2xl text-xs shadow-md shadow-[#23C45E]/20 transition-all cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add Trending Media</span>
            </button>
          </div>
        }
      />

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <AdminStatCard
          title="All Content"
          value={isLoading ? '...' : statsAll}
          description="Total active campaigns"
          icon={Layers}
        />
        <AdminStatCard
          title="Viral Reels"
          value={isLoading ? '...' : statsReels}
          description="Short-form video assets"
          icon={Flame}
        />
        <AdminStatCard
          title="Story Ads"
          value={isLoading ? '...' : statsStories}
          description="Engaging hook templates"
          icon={Sparkles}
        />
        <AdminStatCard
          title="Offers"
          value={isLoading ? '...' : statsOffers}
          description="Flash deals & discounts"
          icon={Percent}
        />
        <AdminStatCard
          title="High ROI Ads"
          value={isLoading ? '...' : statsHighRoi}
          description="Performance ad concepts"
          icon={TrendingUp}
        />
      </div>

      {/* 3. Filter Bar & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Category Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl">
          {(['ALL', 'REEL', 'STORY', 'OFFER', 'HIGH_ROI_AD'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-white text-slate-950 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              {cat === 'ALL'
                ? 'All Content'
                : cat === 'REEL'
                ? '🔥 Reels'
                : cat === 'STORY'
                ? '⚡ Stories'
                : cat === 'OFFER'
                ? '🎟️ Offers'
                : '🚀 High ROI'}
            </button>
          ))}
        </div>

        {/* Search & Publish Status Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search title, platform..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9 pr-3.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#23C45E] text-slate-900 font-medium w-52"
            />
          </div>

          {/* Published Filter */}
          <select
            value={publishFilter}
            onChange={(e) => {
              setPublishFilter(e.target.value as any);
              setPage(1);
            }}
            className="px-3 py-1.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#23C45E] cursor-pointer"
          >
            <option value="ALL">Status: All</option>
            <option value="PUBLISHED">Published Only</option>
            <option value="UNPUBLISHED">Drafts / Unpublished</option>
          </select>
        </div>
      </div>

      {/* 4. Real Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-slate-400 font-bold flex flex-col items-center gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-[#23C45E]" />
            <span>Fetching trending media from database...</span>
          </div>
        ) : trendingItems.length === 0 ? (
          <div className="py-20 text-center text-slate-400 font-bold space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <TrendingUp className="w-7 h-7" />
            </div>
            <p className="text-sm text-slate-600 font-extrabold">No trending media records found.</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Click &quot;Add Trending Media&quot; above to upload your first image or video creative.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Creative / Media</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Platform & Format</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4">Schedule</th>
                  <th className="py-3.5 px-4">Customer App Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {trendingItems.map((item) => {
                  const isVideo =
                    item.metadata?.mediaType === 'VIDEO' ||
                    item.category === 'REEL' ||
                    Boolean(item.mediaUrl?.match(/\.(mp4|mov|webm)(\?.*)?$/i));

                  const mediaDisplayUrl = item.mediaUrl || item.thumbnailUrl || '';

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Content / Title / Media Thumbnail */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {/* Media Thumbnail with Lightbox click */}
                          <div
                            className="relative w-12 h-12 rounded-xl bg-slate-900 border border-slate-200 shrink-0 overflow-hidden group cursor-pointer"
                            onClick={() => {
                              if (mediaDisplayUrl) {
                                setPreviewMedia({
                                  url: mediaDisplayUrl,
                                  type: isVideo ? 'VIDEO' : 'IMAGE',
                                  title: item.title,
                                });
                              }
                            }}
                          >
                            {isVideo ? (
                              <div className="w-full h-full flex items-center justify-center bg-slate-950 text-white relative">
                                {item.thumbnailUrl ? (
                                  <img
                                    src={item.thumbnailUrl}
                                    alt={item.title}
                                    className="w-full h-full object-cover opacity-80"
                                  />
                                ) : (
                                  <Video className="w-5 h-5 text-emerald-400" />
                                )}
                                <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/50 transition-colors">
                                  <Play className="w-4 h-4 text-white fill-white" />
                                </div>
                              </div>
                            ) : mediaDisplayUrl ? (
                              <img
                                src={mediaDisplayUrl}
                                alt={item.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                onError={(e) => {
                                  (e.target as any).src = 'https://placehold.co/100x100?text=Image';
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">
                                <ImageIcon className="w-5 h-5" />
                              </div>
                            )}

                            {/* Hover overlay hint */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                              <Maximize2 className="w-3.5 h-3.5" />
                            </div>
                          </div>

                          <div className="min-w-0 max-w-xs">
                            <p className="font-extrabold text-slate-900 truncate">{item.title}</p>
                            {item.description && (
                              <p className="text-xs text-slate-500 truncate mt-0.5">{item.description}</p>
                            )}
                            {item.ctaUrl && (
                              <a
                                href={item.ctaUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[11px] text-[#1AA14D] hover:underline inline-flex items-center gap-1 mt-0.5 font-bold"
                              >
                                {item.ctaText || 'Target Link'}
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4">{getCategoryBadge(item.category)}</td>

                      {/* Platform & Media Type */}
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md uppercase">
                              {item.platform || 'INSTAGRAM'}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-md uppercase ${
                                isVideo
                                  ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                  : 'bg-blue-100 text-blue-800 border border-blue-200'
                              }`}
                            >
                              {isVideo ? '🎥 VIDEO' : '🖼️ IMAGE'}
                            </span>
                          </div>
                          <div>
                            <span className="inline-block text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                              {item.objective || 'ENGAGEMENT'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Priority */}
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-md font-extrabold text-xs bg-slate-100 text-slate-700 border border-slate-200">
                          ⭐ {item.priority}
                        </span>
                      </td>

                      {/* Schedule */}
                      <td className="py-3 px-4">
                        <div className="text-xs text-slate-600 space-y-0.5">
                          {item.startAt ? (
                            <p className="flex items-center gap-1 font-medium">
                              <span className="text-[10px] text-slate-400 font-bold">Start:</span>
                              {new Date(item.startAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                            </p>
                          ) : (
                            <p className="text-slate-400 text-[11px] font-medium">Immediate</p>
                          )}
                          {item.endAt && (
                            <p className="flex items-center gap-1 text-slate-500 font-medium">
                              <span className="text-[10px] text-slate-400 font-bold">End:</span>
                              {new Date(item.endAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Status & Live Toggles */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {/* Publish Toggle Button */}
                          <button
                            type="button"
                            onClick={() => togglePublishMutation.mutate({ id: item.id, isPublished: !item.isPublished })}
                            className={`px-2.5 py-1 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1 shadow-2xs ${
                              item.isPublished
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                            }`}
                            title={item.isPublished ? 'Live on Customer App (Click to unpublish)' : 'Unpublished (Click to publish)'}
                          >
                            {item.isPublished ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                            {item.isPublished ? 'Published' : 'Draft'}
                          </button>

                          {/* Active Toggle Button */}
                          <button
                            type="button"
                            onClick={() => toggleStatusMutation.mutate({ id: item.id, isActive: !item.isActive })}
                            className={`p-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              item.isActive
                                ? 'text-[#1AA14D] hover:bg-emerald-50'
                                : 'text-slate-400 hover:bg-slate-100'
                            }`}
                            title={item.isActive ? 'Active (Click to disable)' : 'Inactive (Click to activate)'}
                          >
                            {item.isActive ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditDrawer(item)}
                            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                            title="Edit Content"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setDeleteTarget(item);
                              setIsDeleteOpen(true);
                            }}
                            className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                            title="Delete Content"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="p-3 border-t border-slate-200">
            <AdminPagination
              page={pagination.page}
              pageSize={pageSize}
              total={pagination.total}
              totalPages={pagination.totalPages}
              onPageChange={(p) => setPage(p)}
              onPageSizeChange={(s) => setPageSize(s)}
            />
          </div>
        )}
      </div>

      {/* 5. Create / Edit Form Drawer */}
      <AdminFormDrawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          resetForm();
        }}
        title={editingItem ? 'Edit Trending Creative' : 'Create Trending Creative'}
        description="Publish engaging reels, hooks, story ads or flash offers to all active customers."
        onSave={() => saveMutation.mutate()}
        isSubmitting={saveMutation.isPending}
        saveLabel={editingItem ? 'Save Changes' : 'Publish to Customers'}
      >
        <div className="space-y-4 text-xs">
          {/* Content Title */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
              Content Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 90-Day Transformation Reel / Monsoon Flash Offer"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#23C45E] focus:outline-none text-slate-900 font-bold"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
              Trending Category *
            </label>
            <select
              value={formCategory}
              onChange={(e) => setFormCategory(e.target.value as TrendingCategory)}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
            >
              <option value="REEL">🔥 Viral Reel</option>
              <option value="STORY">⚡ Story Ad / Hook</option>
              <option value="OFFER">🎟️ Promo Offer</option>
              <option value="HIGH_ROI_AD">🚀 High ROI Ad</option>
            </select>
          </div>

          {/* ── Dynamic Media Configuration (Image / Video + Upload / URL) ── */}
          <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-3.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#23C45E]" />
                Media Configuration *
              </label>
              <span className="text-[10px] font-bold text-slate-400">
                Supports Image & Video (Upload or URL)
              </span>
            </div>

            {/* 1. Media Type Selector: Image vs Video */}
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                Media Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMediaType('IMAGE');
                    if (selectedFile && !selectedFile.type.startsWith('image/')) {
                      setSelectedFile(null);
                      setFilePreview(null);
                    }
                  }}
                  className={`py-2 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                    mediaType === 'IMAGE'
                      ? 'bg-[#1AA14D] text-white border-[#1AA14D] shadow-sm shadow-[#1AA14D]/20'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>Image Creative</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMediaType('VIDEO');
                    if (selectedFile && !selectedFile.type.startsWith('video/')) {
                      setSelectedFile(null);
                      setFilePreview(null);
                    }
                  }}
                  className={`py-2 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                    mediaType === 'VIDEO'
                      ? 'bg-[#1AA14D] text-white border-[#1AA14D] shadow-sm shadow-[#1AA14D]/20'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Video className="w-4 h-4" />
                  <span>Video / Reel</span>
                </button>
              </div>
            </div>

            {/* 2. Media Source Selector: Upload vs URL */}
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                Media Source
              </label>
              <div className="flex items-center gap-2 p-1 bg-slate-200/60 rounded-xl">
                <button
                  type="button"
                  onClick={() => setMediaSource('UPLOAD')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    mediaSource === 'UPLOAD'
                      ? 'bg-white text-slate-950 shadow-xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload {mediaType === 'IMAGE' ? 'Image' : 'Video'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMediaSource('URL')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    mediaSource === 'URL'
                      ? 'bg-white text-slate-950 shadow-xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                  <span>Enter {mediaType === 'IMAGE' ? 'Image URL' : 'Video URL'}</span>
                </button>
              </div>
            </div>

            {/* 3. Input Controls based on Source */}
            {mediaSource === 'UPLOAD' ? (
              <div className="space-y-2">
                {filePreview || (editingItem && editingItem.mediaUrl && !selectedFile) ? (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-950 p-2 flex items-center justify-center max-h-56 group">
                    {mediaType === 'IMAGE' ? (
                      <img
                        src={filePreview || editingItem?.mediaUrl || ''}
                        alt="Preview"
                        className="max-h-48 object-contain rounded-xl"
                      />
                    ) : (
                      <video
                        src={filePreview || editingItem?.mediaUrl || ''}
                        controls
                        className="max-h-48 rounded-xl"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        setFilePreview(null);
                      }}
                      className="absolute top-3 right-3 p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-full transition-colors shadow-md cursor-pointer"
                      title="Remove / change file"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-slate-300 hover:border-[#23C45E] bg-white rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors group">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#1AA14D] flex items-center justify-center group-hover:scale-110 transition-transform">
                      {mediaType === 'IMAGE' ? <ImageIcon className="w-6 h-6" /> : <Video className="w-6 h-6" />}
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-black text-slate-800">
                        Click to choose {mediaType === 'IMAGE' ? 'an image' : 'a video'} file
                      </p>
                      <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                        {mediaType === 'IMAGE' ? 'JPG, JPEG, PNG, WEBP (Max 10MB)' : 'MP4, MOV, WEBM (Max 100MB)'}
                      </p>
                    </div>
                    <input
                      type="file"
                      accept={mediaType === 'IMAGE' ? 'image/jpeg,image/png,image/webp,image/jpg' : 'video/mp4,video/quicktime,video/webm'}
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            ) : (
              <div className="space-y-2.5">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                    {mediaType === 'IMAGE' ? 'Image Media URL *' : 'Video / Reel Media URL *'}
                  </label>
                  <input
                    type="url"
                    required
                    placeholder={mediaType === 'IMAGE' ? 'https://example.com/banner.jpg' : 'https://example.com/video.mp4'}
                    value={formMediaUrl}
                    onChange={(e) => setFormMediaUrl(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#23C45E] focus:outline-none text-slate-900 font-medium"
                  />
                </div>

                {formMediaUrl.trim() && (
                  <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-950 p-2 flex items-center justify-center max-h-48">
                    {mediaType === 'IMAGE' ? (
                      <img
                        src={formMediaUrl}
                        alt="URL Preview"
                        className="max-h-44 rounded-lg object-contain"
                        onError={(e) => {
                          (e.target as any).src = 'https://placehold.co/400x200?text=Invalid+Image+URL';
                        }}
                      />
                    ) : (
                      <video
                        src={formMediaUrl}
                        controls
                        className="max-h-44 rounded-lg"
                        onError={() => toast.error('Could not preview video stream from this URL')}
                      />
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Optional Thumbnail Image URL (for videos) */}
            {mediaType === 'VIDEO' && (
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                  Video Thumbnail Cover URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/thumbnail.jpg"
                  value={formThumbnailUrl}
                  onChange={(e) => setFormThumbnailUrl(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#23C45E] focus:outline-none text-slate-900 font-medium"
                />
              </div>
            )}
          </div>

          {/* Description / Hook */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
              Description / Hook Line
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Stop doing regular cardio in 2026! Try this 15-min metabolic circuit instead..."
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#23C45E] focus:outline-none text-slate-900 font-medium resize-none"
            />
          </div>

          {/* Platform & Objective */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
                Platform
              </label>
              <select
                value={formPlatform}
                onChange={(e) => setFormPlatform(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
              >
                <option value="INSTAGRAM">Instagram</option>
                <option value="FACEBOOK">Facebook</option>
                <option value="YOUTUBE">YouTube</option>
                <option value="ALL">All Platforms</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
                Objective
              </label>
              <select
                value={formObjective}
                onChange={(e) => setFormObjective(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
              >
                <option value="ENGAGEMENT">Engagement</option>
                <option value="SALES">Sales / Conversions</option>
                <option value="LEAD_GENERATION">Lead Gen</option>
                <option value="BRAND_AWARENESS">Brand Awareness</option>
              </select>
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
              Priority Ranking (Higher appears first)
            </label>
            <input
              type="number"
              min={0}
              max={1000}
              value={formPriority}
              onChange={(e) => setFormPriority(parseInt(e.target.value, 10) || 0)}
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
            />
          </div>

          {/* CTA Text & CTA URL */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
                CTA Button Text
              </label>
              <input
                type="text"
                placeholder="View Idea / Claim Offer"
                value={formCtaText}
                onChange={(e) => setFormCtaText(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
                CTA Target URL
              </label>
              <input
                type="url"
                placeholder="https://..."
                value={formCtaUrl}
                onChange={(e) => setFormCtaUrl(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
              />
            </div>
          </div>

          {/* Start & End Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
                Schedule Start (Optional)
              </label>
              <input
                type="datetime-local"
                value={formStartAt}
                onChange={(e) => setFormStartAt(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
                Schedule End (Optional)
              </label>
              <input
                type="datetime-local"
                value={formEndAt}
                onChange={(e) => setFormEndAt(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
              />
            </div>
          </div>

          {/* Visibility Switches */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formIsPublished}
                onChange={(e) => setFormIsPublished(e.target.checked)}
                className="w-4 h-4 text-[#23C45E] rounded border-slate-300 focus:ring-[#23C45E]"
              />
              <span className="text-xs font-black text-slate-800">
                Publish Immediately to Customers
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formIsActive}
                onChange={(e) => setFormIsActive(e.target.checked)}
                className="w-4 h-4 text-[#23C45E] rounded border-slate-300 focus:ring-[#23C45E]"
              />
              <span className="text-xs font-black text-slate-800">Active</span>
            </label>
          </div>
        </div>
      </AdminFormDrawer>

      {/* 6. Full-Screen Media Lightbox Modal */}
      {previewMedia && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setPreviewMedia(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-slate-950 rounded-3xl overflow-hidden border border-white/20 p-2 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {previewMedia.type === 'IMAGE' ? (
              <img
                src={previewMedia.url}
                alt={previewMedia.title || 'Creative Media'}
                className="max-w-full max-h-[82vh] object-contain rounded-2xl"
              />
            ) : (
              <video
                src={previewMedia.url}
                controls
                autoPlay
                className="max-w-full max-h-[82vh] rounded-2xl"
              />
            )}

            {previewMedia.title && (
              <div className="p-3 text-white text-xs font-extrabold flex items-center justify-between">
                <span className="truncate">{previewMedia.title}</span>
                <span className="text-slate-400 font-mono text-[10px] uppercase">
                  {previewMedia.type}
                </span>
              </div>
            )}

            <button
              onClick={() => setPreviewMedia(null)}
              className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-black text-white rounded-full transition-colors cursor-pointer"
              title="Close Preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* 7. Delete Confirmation Dialog */}
      <AdminConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setDeleteTarget(null);
        }}
        onConfirm={() => {
          if (deleteTarget) {
            deleteMutation.mutate(deleteTarget.id);
          }
        }}
        title="Delete Trending Content?"
        description={`Are you sure you want to delete "${deleteTarget?.title}"? This content will be permanently removed from the Customer Mobile App.`}
        confirmLabel="Delete Content"
        variant="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
