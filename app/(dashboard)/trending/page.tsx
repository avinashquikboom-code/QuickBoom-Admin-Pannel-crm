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

  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState<TrendingCategory>('REEL');
  const [formThumbnailUrl, setFormThumbnailUrl] = useState('');
  const [formMediaUrl, setFormMediaUrl] = useState('');
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
    setFormThumbnailUrl('');
    setFormMediaUrl('');
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

  const openCreateDrawer = () => {
    resetForm();
    setIsDrawerOpen(true);
  };

  const openEditDrawer = (item: TrendingContentItem) => {
    setEditingItem(item);
    setFormTitle(item.title);
    setFormDescription(item.description || '');
    setFormCategory(item.category);
    setFormThumbnailUrl(item.thumbnailUrl || '');
    setFormMediaUrl(item.mediaUrl || '');
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

      const payload: CreateTrendingPayload = {
        title: formTitle.trim(),
        description: formDescription.trim() || undefined,
        category: formCategory,
        thumbnailUrl: formThumbnailUrl.trim() || undefined,
        mediaUrl: formMediaUrl.trim() || undefined,
        ctaText: formCtaText.trim() || undefined,
        ctaUrl: formCtaUrl.trim() || undefined,
        platform: formPlatform.trim() || 'INSTAGRAM',
        objective: formObjective.trim() || 'ENGAGEMENT',
        priority: Number(formPriority) || 0,
        isPublished: formIsPublished,
        isActive: formIsActive,
        startAt: formStartAt ? new Date(formStartAt).toISOString() : null,
        endAt: formEndAt ? new Date(formEndAt).toISOString() : null,
      };

      if (editingItem) {
        return TrendingService.updateTrending(editingItem.id, payload);
      } else {
        return TrendingService.createTrending(payload);
      }
    },
    onSuccess: () => {
      toast.success(editingItem ? 'Trending content updated' : 'Trending content published');
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
      toast.success(variables.isActive ? 'Content marked Active' : 'Content marked Inactive');
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
      toast.success('Trending content deleted');
      setIsDeleteOpen(false);
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ['admin-trending'] });
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err));
    },
  });

  // Category Badges helper
  const getCategoryBadge = (category: TrendingCategory) => {
    switch (category) {
      case 'REEL':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <Video className="w-3 h-3" />
            Viral Reel
          </span>
        );
      case 'STORY':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Sparkles className="w-3 h-3" />
            Story Ad
          </span>
        );
      case 'OFFER':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Percent className="w-3 h-3" />
            Promo Offer
          </span>
        );
      case 'HIGH_ROI_AD':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Flame className="w-3 h-3" />
            High ROI Ad
          </span>
        );
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* 1. Hero / Header */}
      <AdminPageHero
        title="Trending Content Management"
        description="Curate and publish high-converting reels, stories, offers, and high-ROI ads directly to the Customer Mobile App."
        badge={{ text: 'Live Campaign Feed', icon: TrendingUp, variant: 'emerald' }}
        actions={
          <button
            onClick={openCreateDrawer}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#23C45E] text-white text-xs font-bold hover:bg-[#1fa951] transition-all cursor-pointer shadow-md shadow-emerald-900/20 shrink-0"
          >
            <Plus className="w-4 h-4" />
            Add Trending Content
          </button>
        }
      />

      {/* 2. Top Metric Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <AdminStatCard
          title="Total Content"
          value={statsAll}
          icon={Layers}
          iconBg="slate"
        />
        <AdminStatCard
          title="Viral Reels"
          value={statsReels}
          icon={Video}
          iconBg="purple"
        />
        <AdminStatCard
          title="Story Ads"
          value={statsStories}
          icon={Sparkles}
          iconBg="blue"
        />
        <AdminStatCard
          title="High-ROI Ads"
          value={statsHighRoi}
          icon={Flame}
          iconBg="amber"
        />
        <AdminStatCard
          title="Live Offers"
          value={statsOffers}
          icon={Percent}
          iconBg="primary"
        />
      </div>

      {/* 3. Category Filter Tabs & Search Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-4">
        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'ALL', label: 'All Content', icon: Layers },
            { id: 'REEL', label: 'Viral Reels', icon: Video },
            { id: 'STORY', label: 'Story Ads', icon: Sparkles },
            { id: 'OFFER', label: 'Promo Offers', icon: Percent },
            { id: 'HIGH_ROI_AD', label: 'High ROI Ads', icon: Flame },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = selectedCategory === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setSelectedCategory(tab.id as any);
                  setPage(1);
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#23C45E] text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search & Publish Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search title, platform, objective..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#23C45E] focus:outline-none text-slate-900 font-medium"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <select
              value={publishFilter}
              onChange={(e) => {
                setPublishFilter(e.target.value as any);
                setPage(1);
              }}
              className="px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
            >
              <option value="ALL">All Publish Status</option>
              <option value="PUBLISHED">Published Only</option>
              <option value="UNPUBLISHED">Unpublished Only</option>
            </select>

            <button
              onClick={() => refetch()}
              className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all"
              title="Refresh List"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Table / Content List */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-[#23C45E]" />
            <p className="text-sm font-semibold">Loading trending content...</p>
          </div>
        ) : trendingItems.length === 0 ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
              <TrendingUp className="w-6 h-6" />
            </div>
            <p className="text-base font-bold text-slate-800">No trending content found</p>
            <p className="text-xs text-slate-400 max-w-sm">
              Create your first trending reel, story ad, or promotional offer to display it on the Customer Mobile App.
            </p>
            <button
              onClick={openCreateDrawer}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#23C45E] text-white text-xs font-bold hover:bg-[#1fa951] transition-all cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              Add Trending Content
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Content</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Platform & Objective</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4">Schedule</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {trendingItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Content / Title */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {item.thumbnailUrl ? (
                          <img
                            src={item.thumbnailUrl}
                            alt={item.title}
                            className="w-11 h-11 rounded-xl object-cover border border-slate-200 shrink-0"
                            onError={(e) => {
                              (e.target as any).src = 'https://placehold.co/100x100?text=Ad';
                            }}
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-slate-400">
                            <Video className="w-5 h-5" />
                          </div>
                        )}
                        <div className="min-w-0 max-w-xs">
                          <p className="font-bold text-slate-900 truncate">{item.title}</p>
                          {item.description && (
                            <p className="text-xs text-slate-500 truncate">{item.description}</p>
                          )}
                          {item.ctaUrl && (
                            <a
                              href={item.ctaUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-[#23C45E] hover:underline inline-flex items-center gap-1 mt-0.5"
                            >
                              {item.ctaText || 'Link'}
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4">{getCategoryBadge(item.category)}</td>

                    {/* Platform & Objective */}
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                          {item.platform || 'INSTAGRAM'}
                        </span>
                        <div>
                          <span className="inline-block text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                            {item.objective || 'ENGAGEMENT'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Priority */}
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md font-extrabold text-xs bg-slate-100 text-slate-700 border border-slate-200">
                        ⭐ {item.priority}
                      </span>
                    </td>

                    {/* Schedule */}
                    <td className="py-3 px-4">
                      <div className="text-xs text-slate-600 space-y-0.5">
                        {item.startAt ? (
                          <p className="flex items-center gap-1">
                            <span className="text-[10px] text-slate-400 font-bold">Start:</span>
                            {new Date(item.startAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                          </p>
                        ) : (
                          <p className="text-slate-400 text-[11px]">Immediate</p>
                        )}
                        {item.endAt && (
                          <p className="flex items-center gap-1 text-slate-500">
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
                          className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                            item.isPublished
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                          }`}
                          title={item.isPublished ? 'Live on Customer App (Click to unpublish)' : 'Unpublished (Click to publish)'}
                        >
                          {item.isPublished ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          {item.isPublished ? 'Published' : 'Draft'}
                        </button>

                        {/* Active Toggle Button */}
                        <button
                          type="button"
                          onClick={() => toggleStatusMutation.mutate({ id: item.id, isActive: !item.isActive })}
                          className={`p-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            item.isActive
                              ? 'text-emerald-600 hover:bg-emerald-50'
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
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Edit Content"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setDeleteTarget(item);
                            setIsDeleteOpen(true);
                          }}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Content"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
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
        title={editingItem ? 'Edit Trending Content' : 'Create Trending Content'}
        description="Publish engaging reels, hooks, story ads or flash offers to all active customers."
        onSave={() => saveMutation.mutate()}
        isSubmitting={saveMutation.isPending}
        saveLabel={editingItem ? 'Save Changes' : 'Publish Content'}
      >
        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-1">
              Content Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 90-Day Transformation Reel / Monsoon Flash Offer"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#23C45E] focus:outline-none text-slate-900 font-medium"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-1">
              Trending Category *
            </label>
            <select
              value={formCategory}
              onChange={(e) => setFormCategory(e.target.value as TrendingCategory)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
            >
              <option value="REEL">🔥 Viral Reel</option>
              <option value="STORY">⚡ Story Ad / Hook</option>
              <option value="OFFER">🎟️ Promo Offer</option>
              <option value="HIGH_ROI_AD">🚀 High ROI Ad</option>
            </select>
          </div>

          {/* Description / Hook */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-1">
              Description / Hook Line
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Stop doing regular cardio in 2026! Try this 15-min metabolic circuit instead..."
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#23C45E] focus:outline-none text-slate-900 font-medium resize-none"
            />
          </div>

          {/* Thumbnail URL */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-1">
              Thumbnail Image URL
            </label>
            <input
              type="url"
              placeholder="https://images.unsplash.com/photo-... or CDN URL"
              value={formThumbnailUrl}
              onChange={(e) => setFormThumbnailUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#23C45E] focus:outline-none text-slate-900 font-medium"
            />
          </div>

          {/* Media / Video Link */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-1">
              Media / Video / Post URL
            </label>
            <input
              type="url"
              placeholder="https://instagram.com/reel/... or https://youtube.com/..."
              value={formMediaUrl}
              onChange={(e) => setFormMediaUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#23C45E] focus:outline-none text-slate-900 font-medium"
            />
          </div>

          {/* Platform & Objective */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                Platform
              </label>
              <select
                value={formPlatform}
                onChange={(e) => setFormPlatform(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
              >
                <option value="INSTAGRAM">Instagram</option>
                <option value="FACEBOOK">Facebook</option>
                <option value="YOUTUBE">YouTube</option>
                <option value="ALL">All Platforms</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                Objective
              </label>
              <select
                value={formObjective}
                onChange={(e) => setFormObjective(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
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
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-1">
              Priority Ranking (Higher numbers appear first)
            </label>
            <input
              type="number"
              min={0}
              max={1000}
              value={formPriority}
              onChange={(e) => setFormPriority(parseInt(e.target.value, 10) || 0)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
            />
          </div>

          {/* CTA Text & CTA URL */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                CTA Button Text
              </label>
              <input
                type="text"
                placeholder="View Idea / Claim Offer"
                value={formCtaText}
                onChange={(e) => setFormCtaText(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                CTA Target URL
              </label>
              <input
                type="url"
                placeholder="https://..."
                value={formCtaUrl}
                onChange={(e) => setFormCtaUrl(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
              />
            </div>
          </div>

          {/* Start & End Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-1">
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
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-1">
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
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formIsPublished}
                onChange={(e) => setFormIsPublished(e.target.checked)}
                className="w-4 h-4 text-[#23C45E] rounded border-slate-300 focus:ring-[#23C45E]"
              />
              <span className="text-xs font-extrabold text-slate-800">
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
              <span className="text-xs font-extrabold text-slate-800">Active</span>
            </label>
          </div>
        </div>
      </AdminFormDrawer>

      {/* 6. Delete Confirmation Dialog */}
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
