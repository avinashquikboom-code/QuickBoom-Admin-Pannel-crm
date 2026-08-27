'use client';

import React, { useState } from 'react';
import {
  Plus,
  Search,
  Image as ImageIcon,
  Flame,
  Sparkles,
  Edit2,
  Trash2,
  ExternalLink,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Calendar,
  RefreshCw,
  SlidersHorizontal,
  Layers,
  ArrowUpRight,
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
  BannerService,
  MarketingBannerItem,
  CreateBannerPayload,
  UpdateBannerPayload,
} from '@/lib/services/banner.service';
import { toast } from 'react-hot-toast';
import { getErrorMessage } from '@/lib/utils';

export default function HomeBannersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [publishFilter, setPublishFilter] = useState<'ALL' | 'PUBLISHED' | 'UNPUBLISHED'>('ALL');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Drawer / Modal states
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<MarketingBannerItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MarketingBannerItem | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [previewBanner, setPreviewBanner] = useState<MarketingBannerItem | null>(null);

  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formSubtitle, setFormSubtitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formMobileImageUrl, setFormMobileImageUrl] = useState('');
  const [formCtaText, setFormCtaText] = useState('');
  const [formCtaUrl, setFormCtaUrl] = useState('');
  const [formPriority, setFormPriority] = useState<number>(0);
  const [formStartAt, setFormStartAt] = useState('');
  const [formEndAt, setFormEndAt] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [formIsPublished, setFormIsPublished] = useState(true);

  // Fetch banners
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['marketing-banners', page, pageSize, search, publishFilter, activeFilter],
    queryFn: async () => {
      const isPub =
        publishFilter === 'PUBLISHED' ? true : publishFilter === 'UNPUBLISHED' ? false : undefined;
      const isAct =
        activeFilter === 'ACTIVE' ? true : activeFilter === 'INACTIVE' ? false : undefined;

      const res = await BannerService.getBanners({
        page,
        limit: pageSize,
        search: search.trim() || undefined,
        isPublished: isPub,
        isActive: isAct,
      });

      let items: MarketingBannerItem[] = [];
      let total = 0;

      if (Array.isArray(res)) {
        items = res;
        total = res.length;
      } else if (res?.data && Array.isArray((res.data as any).items)) {
        items = (res.data as any).items;
        total = (res.data as any).meta?.total ?? items.length;
      } else if (Array.isArray(res?.data)) {
        items = res.data;
        total = res.data.length;
      } else if (Array.isArray(res?.items)) {
        items = res.items;
        total = res.meta?.total ?? items.length;
      }

      return { items, total };
    },
  });

  const bannerItems = data?.items ?? [];
  const totalCount = data?.total ?? 0;

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: CreateBannerPayload) => BannerService.createBanner(payload),
    onSuccess: () => {
      toast.success('Home banner created successfully');
      queryClient.invalidateQueries({ queryKey: ['marketing-banners'] });
      closeDrawer();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateBannerPayload }) =>
      BannerService.updateBanner(id, payload),
    onSuccess: () => {
      toast.success('Banner updated successfully');
      queryClient.invalidateQueries({ queryKey: ['marketing-banners'] });
      closeDrawer();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => BannerService.deleteBanner(id),
    onSuccess: () => {
      toast.success('Banner deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['marketing-banners'] });
      setIsDeleteOpen(false);
      setDeleteTarget(null);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const togglePublishMutation = useMutation({
    mutationFn: ({ id, isPublished }: { id: number; isPublished: boolean }) =>
      BannerService.setPublished(id, isPublished),
    onSuccess: (_, vars) => {
      toast.success(vars.isPublished ? 'Banner published to Mobile App' : 'Banner moved to Draft');
      queryClient.invalidateQueries({ queryKey: ['marketing-banners'] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      BannerService.setActiveStatus(id, isActive),
    onSuccess: (_, vars) => {
      toast.success(vars.isActive ? 'Banner activated' : 'Banner deactivated');
      queryClient.invalidateQueries({ queryKey: ['marketing-banners'] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  // Drawer handlers
  const openCreateDrawer = () => {
    setEditingBanner(null);
    setFormTitle('');
    setFormSubtitle('');
    setFormDescription('');
    setFormImageUrl('');
    setFormMobileImageUrl('');
    setFormCtaText('View Offer');
    setFormCtaUrl('');
    setFormPriority(0);
    setFormStartAt('');
    setFormEndAt('');
    setFormIsActive(true);
    setFormIsPublished(true);
    setIsDrawerOpen(true);
  };

  const openEditDrawer = (banner: MarketingBannerItem) => {
    setEditingBanner(banner);
    setFormTitle(banner.title);
    setFormSubtitle(banner.subtitle || '');
    setFormDescription(banner.description || '');
    setFormImageUrl(banner.imageUrl);
    setFormMobileImageUrl(banner.mobileImageUrl || '');
    setFormCtaText(banner.ctaText || '');
    setFormCtaUrl(banner.ctaUrl || '');
    setFormPriority(banner.priority || 0);
    setFormStartAt(
      banner.startAt ? new Date(banner.startAt).toISOString().slice(0, 16) : '',
    );
    setFormEndAt(
      banner.endAt ? new Date(banner.endAt).toISOString().slice(0, 16) : '',
    );
    setFormIsActive(banner.isActive);
    setFormIsPublished(banner.isPublished);
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setEditingBanner(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!formImageUrl.trim()) {
      toast.error('Banner Image URL is required');
      return;
    }

    if (formStartAt && formEndAt) {
      const s = new Date(formStartAt);
      const end = new Date(formEndAt);
      if (end < s) {
        toast.error('End date cannot be earlier than start date');
        return;
      }
    }

    const payload: CreateBannerPayload = {
      title: formTitle.trim(),
      subtitle: formSubtitle.trim() || undefined,
      description: formDescription.trim() || undefined,
      imageUrl: formImageUrl.trim(),
      mobileImageUrl: formMobileImageUrl.trim() || undefined,
      ctaText: formCtaText.trim() || undefined,
      ctaUrl: formCtaUrl.trim() || undefined,
      priority: Number(formPriority) || 0,
      startAt: formStartAt ? new Date(formStartAt).toISOString() : null,
      endAt: formEndAt ? new Date(formEndAt).toISOString() : null,
      isActive: formIsActive,
      isPublished: formIsPublished,
    };

    if (editingBanner) {
      updateMutation.mutate({ id: editingBanner.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  // Stats calculation
  const activeCount = bannerItems.filter((b) => b.isActive).length;
  const publishedCount = bannerItems.filter((b) => b.isPublished && b.isActive).length;
  const scheduledCount = bannerItems.filter((b) => b.startAt || b.endAt).length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* 1. Hero Header */}
      <AdminPageHero
        title="Home Banners"
        description="Manage dynamic promotional banners, seasonal offers, and campaign carousels for the Customer Mobile App."
        badge={{ text: 'Customer Home Screen', icon: ImageIcon, variant: 'emerald' }}
        actions={
          <button
            onClick={openCreateDrawer}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#23C45E] text-white text-xs font-bold hover:bg-[#1fa951] transition-all cursor-pointer shadow-md shadow-emerald-900/20 shrink-0"
          >
            <Plus className="w-4 h-4" />
            Add Banner
          </button>
        }
      />

      {/* 2. Stat Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <AdminStatCard
          icon={Layers}
          title="Total Banners"
          value={totalCount}
          iconBg="slate"
        />
        <AdminStatCard
          icon={CheckCircle2}
          title="Active Banners"
          value={activeCount}
          iconBg="emerald"
        />
        <AdminStatCard
          icon={Sparkles}
          title="Live Published"
          value={publishedCount}
          iconBg="purple"
        />
        <AdminStatCard
          icon={Calendar}
          title="Scheduled Campaigns"
          value={scheduledCount}
          iconBg="amber"
        />
      </div>

      {/* 3. Toolbar & Filters */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative flex-1 w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by title, subtitle, CTA text..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Publish Filter */}
            <div className="flex items-center bg-muted/40 p-1 rounded-lg border border-border text-xs">
              <button
                onClick={() => {
                  setPublishFilter('ALL');
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                  publishFilter === 'ALL'
                    ? 'bg-background shadow-xs text-foreground font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                All Status
              </button>
              <button
                onClick={() => {
                  setPublishFilter('PUBLISHED');
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                  publishFilter === 'PUBLISHED'
                    ? 'bg-emerald-500/10 text-emerald-600 font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Published
              </button>
              <button
                onClick={() => {
                  setPublishFilter('UNPUBLISHED');
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                  publishFilter === 'UNPUBLISHED'
                    ? 'bg-amber-500/10 text-amber-600 font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Draft
              </button>
            </div>

            <button
              onClick={() => refetch()}
              className="p-2 rounded-lg border border-border hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors"
              title="Refresh banners"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Banner Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/40 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Banner Image</th>
                <th className="py-3.5 px-4">Title & Subtitle</th>
                <th className="py-3.5 px-4">Call to Action</th>
                <th className="py-3.5 px-4 text-center">Priority</th>
                <th className="py-3.5 px-4">Schedule</th>
                <th className="py-3.5 px-4 text-center">Active</th>
                <th className="py-3.5 px-4 text-center">Publish</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-primary" />
                      <span>Loading dynamic home banners...</span>
                    </div>
                  </td>
                </tr>
              ) : bannerItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                      <div className="w-12 h-12 rounded-full bg-muted/60 flex items-center justify-center mb-3 text-muted-foreground">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                      <p className="text-base font-semibold text-foreground">No banners found</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {search
                          ? 'No banners match your search filters.'
                          : 'Get started by creating your first promotional home banner.'}
                      </p>
                      <button
                        onClick={openCreateDrawer}
                        className="mt-4 px-4 py-2 text-xs font-semibold bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                      >
                        + Add New Banner
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                bannerItems.map((banner) => (
                  <tr key={banner.id} className="hover:bg-muted/30 transition-colors">
                    {/* Thumbnail */}
                    <td className="py-3 px-4">
                      <div
                        onClick={() => setPreviewBanner(banner)}
                        className="relative w-28 h-16 rounded-lg overflow-hidden bg-muted border border-border cursor-pointer group shrink-0"
                      >
                        <img
                          src={banner.imageUrl}
                          alt={banner.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                          <Eye className="w-4 h-4" />
                        </div>
                      </div>
                    </td>

                    {/* Title & Subtitle */}
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-semibold text-foreground line-clamp-1">{banner.title}</div>
                      {banner.subtitle && (
                        <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                          {banner.subtitle}
                        </div>
                      )}
                      {banner.description && (
                        <div className="text-xs text-muted-foreground/80 line-clamp-1 mt-0.5 italic">
                          {banner.description}
                        </div>
                      )}
                    </td>

                    {/* CTA */}
                    <td className="py-3 px-4">
                      {banner.ctaText ? (
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                            {banner.ctaText}
                          </span>
                          {banner.ctaUrl && (
                            <a
                              href={banner.ctaUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-muted-foreground hover:text-primary transition-colors"
                              title={banner.ctaUrl}
                            >
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground/60">—</span>
                      )}
                    </td>

                    {/* Priority */}
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-muted text-foreground border border-border">
                        {banner.priority}
                      </span>
                    </td>

                    {/* Schedule */}
                    <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">
                      {banner.startAt || banner.endAt ? (
                        <div className="space-y-0.5">
                          <div>
                            <span className="font-medium text-foreground">Start:</span>{' '}
                            {banner.startAt ? new Date(banner.startAt).toLocaleDateString() : 'Always'}
                          </div>
                          <div>
                            <span className="font-medium text-foreground">End:</span>{' '}
                            {banner.endAt ? new Date(banner.endAt).toLocaleDateString() : 'No expiry'}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-emerald-600 font-medium bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          Always Live
                        </span>
                      )}
                    </td>

                    {/* Active Toggle */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() =>
                          toggleStatusMutation.mutate({ id: banner.id, isActive: !banner.isActive })
                        }
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          banner.isActive ? 'bg-primary' : 'bg-muted'
                        }`}
                        title={banner.isActive ? 'Deactivate banner' : 'Activate banner'}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                            banner.isActive ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </td>

                    {/* Publish Toggle */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() =>
                          togglePublishMutation.mutate({
                            id: banner.id,
                            isPublished: !banner.isPublished,
                          })
                        }
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold border transition-all ${
                          banner.isPublished
                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/20'
                        }`}
                      >
                        {banner.isPublished ? (
                          <>
                            <Eye className="w-3 h-3" /> Live
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3 h-3" /> Draft
                          </>
                        )}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditDrawer(banner)}
                          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                          title="Edit Banner"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setDeleteTarget(banner);
                            setIsDeleteOpen(true);
                          }}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-600 transition-colors"
                          title="Delete Banner"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalCount > pageSize && (
          <div className="p-4 border-t border-border">
            <AdminPagination
              currentPage={page}
              totalItems={totalCount}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={(sz) => {
                setPageSize(sz);
                setPage(1);
              }}
            />
          </div>
        )}
      </div>

      {/* 5. Create / Edit Form Drawer */}
      <AdminFormDrawer
        isOpen={isDrawerOpen}
        onClose={closeDrawer}
        title={editingBanner ? 'Edit Home Banner' : 'Create Home Banner'}
        subtitle={
          editingBanner
            ? `Updating Banner #${editingBanner.id}`
            : 'Configure a new promotional carousel banner for customer mobile home'
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Banner Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g., Summer Fitness Challenge 50% Off"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Subtitle */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">Subtitle</label>
            <input
              type="text"
              placeholder="e.g., Get unlimited access + 3 free personal training sessions"
              value={formSubtitle}
              onChange={(e) => setFormSubtitle(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Description / Promo Details
            </label>
            <textarea
              rows={2}
              placeholder="Optional offer details or terms..."
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Image URL */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Banner Image URL <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              required
              placeholder="https://res.cloudinary.com/... or https://cdn.example.com/banner.jpg"
              value={formImageUrl}
              onChange={(e) => setFormImageUrl(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            {formImageUrl && (
              <div className="mt-2 rounded-lg overflow-hidden border border-border bg-muted/40 h-32 relative">
                <img
                  src={formImageUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as any).src = '';
                  }}
                />
              </div>
            )}
          </div>

          {/* Mobile Image URL */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Mobile Image URL (Optional)
            </label>
            <input
              type="url"
              placeholder="Optional mobile optimized image URL..."
              value={formMobileImageUrl}
              onChange={(e) => setFormMobileImageUrl(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* CTA Text & URL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">CTA Button Text</label>
              <input
                type="text"
                placeholder="e.g., Claim Offer, View Plan"
                value={formCtaText}
                onChange={(e) => setFormCtaText(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">CTA Action Link / URL</label>
              <input
                type="text"
                placeholder="e.g., https://quickboom.com/offer"
                value={formCtaUrl}
                onChange={(e) => setFormCtaUrl(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Display Priority (Higher shows first in carousel)
            </label>
            <input
              type="number"
              min="0"
              value={formPriority}
              onChange={(e) => setFormPriority(parseInt(e.target.value, 10) || 0)}
              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Schedule Date Range */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Start Date & Time</label>
              <input
                type="datetime-local"
                value={formStartAt}
                onChange={(e) => setFormStartAt(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">End Date & Time</label>
              <input
                type="datetime-local"
                value={formEndAt}
                onChange={(e) => setFormEndAt(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Toggles */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
            <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20">
              <div>
                <div className="text-xs font-semibold text-foreground">Active</div>
                <div className="text-[11px] text-muted-foreground">Enabled in database</div>
              </div>
              <input
                type="checkbox"
                checked={formIsActive}
                onChange={(e) => setFormIsActive(e.target.checked)}
                className="h-4 w-4 text-primary rounded border-border"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20">
              <div>
                <div className="text-xs font-semibold text-foreground">Publish to App</div>
                <div className="text-[11px] text-muted-foreground">Visible on Mobile Home</div>
              </div>
              <input
                type="checkbox"
                checked={formIsPublished}
                onChange={(e) => setFormIsPublished(e.target.checked)}
                className="h-4 w-4 text-primary rounded border-border"
              />
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
            <button
              type="button"
              onClick={closeDrawer}
              className="px-4 py-2 text-xs font-semibold border border-border rounded-lg hover:bg-muted/60 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="px-4 py-2 text-xs font-semibold bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {createMutation.isPending || updateMutation.isPending
                ? 'Saving...'
                : editingBanner
                ? 'Update Banner'
                : 'Create Banner'}
            </button>
          </div>
        </form>
      </AdminFormDrawer>

      {/* 6. Preview Modal */}
      {previewBanner && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setPreviewBanner(null)}
        >
          <div
            className="bg-card border border-border rounded-2xl overflow-hidden max-w-lg w-full shadow-2xl space-y-4 p-5 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative rounded-xl overflow-hidden bg-muted aspect-video border border-border">
              <img
                src={previewBanner.imageUrl}
                alt={previewBanner.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-4 text-white">
                <div className="text-xs font-semibold text-primary uppercase tracking-wider">
                  Priority #{previewBanner.priority}
                </div>
                <h3 className="text-lg font-bold">{previewBanner.title}</h3>
                {previewBanner.subtitle && (
                  <p className="text-xs text-white/80">{previewBanner.subtitle}</p>
                )}
              </div>
            </div>

            {previewBanner.description && (
              <p className="text-xs text-muted-foreground">{previewBanner.description}</p>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-border">
              {previewBanner.ctaText ? (
                <div className="text-xs font-medium text-foreground">
                  Button Action:{' '}
                  <span className="font-semibold text-primary">{previewBanner.ctaText}</span>
                  {previewBanner.ctaUrl && (
                    <span className="text-muted-foreground ml-1">({previewBanner.ctaUrl})</span>
                  )}
                </div>
              ) : (
                <span className="text-xs text-muted-foreground">No CTA configured</span>
              )}
              <button
                onClick={() => setPreviewBanner(null)}
                className="px-3 py-1.5 text-xs font-semibold bg-muted hover:bg-muted/80 rounded-lg text-foreground transition-colors"
              >
                Close Preview
              </button>
            </div>
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
        title="Delete Home Banner"
        message={`Are you sure you want to delete banner "${deleteTarget?.title}"? It will no longer appear on the customer home screen.`}
        confirmText="Delete Banner"
        confirmVariant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
