'use client';

import React, { useState, useRef } from 'react';
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
  UploadCloud,
  X,
  FileImage,
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
} from '@/lib/services/banner.service';
import { toast } from 'react-hot-toast';
import { getErrorMessage } from '@/lib/utils';

export default function HomeBannersPage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
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
  const [formImageFile, setFormImageFile] = useState<File | null>(null);
  const [formImagePreview, setFormImagePreview] = useState<string | null>(null);
  const [formCtaText, setFormCtaText] = useState('View Offer');
  const [formCtaUrl, setFormCtaUrl] = useState('');
  const [formPriority, setFormPriority] = useState<number>(0);
  const [formStartAt, setFormStartAt] = useState('');
  const [formEndAt, setFormEndAt] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [formIsPublished, setFormIsPublished] = useState(true);
  const [isDragging, setIsDragging] = useState(false);

  // Query Banners list
  const {
    data: bannersResponse,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['marketing-banners', page, pageSize, search, publishFilter, activeFilter],
    queryFn: () =>
      BannerService.getBanners({
        page,
        limit: pageSize,
        search: search.trim() || undefined,
        isPublished:
          publishFilter === 'PUBLISHED'
            ? true
            : publishFilter === 'UNPUBLISHED'
            ? false
            : undefined,
        isActive:
          activeFilter === 'ACTIVE'
            ? true
            : activeFilter === 'INACTIVE'
            ? false
            : undefined,
      }),
  });

  const bannerItems: MarketingBannerItem[] = Array.isArray(bannersResponse?.data)
    ? bannersResponse.data
    : (bannersResponse as any)?.data?.items || (bannersResponse as any)?.items || [];

  const totalCount = (bannersResponse as any)?.data && 'meta' in (bannersResponse as any).data
    ? (bannersResponse as any).data.meta.total
    : (bannersResponse as any)?.meta?.total || bannerItems.length;

  // Mutations
  const createMutation = useMutation({
    mutationFn: (formData: FormData) => BannerService.createBanner(formData),
    onSuccess: () => {
      toast.success('Home banner uploaded & created successfully');
      queryClient.invalidateQueries({ queryKey: ['marketing-banners'] });
      closeDrawer();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, formData }: { id: number; formData: FormData }) =>
      BannerService.updateBanner(id, formData),
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

  const handleFileSelect = (file: File) => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      toast.error('Please upload a valid image (JPG, PNG, WEBP)');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be less than 10MB');
      return;
    }
    setFormImageFile(file);
    const objectUrl = URL.createObjectURL(file);
    setFormImagePreview(objectUrl);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // Drawer handlers
  const openCreateDrawer = () => {
    setEditingBanner(null);
    setFormTitle('');
    setFormSubtitle('');
    setFormDescription('');
    setFormImageFile(null);
    setFormImagePreview(null);
    setFormCtaText('Claim Offer');
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
    setFormImageFile(null);
    setFormImagePreview(banner.imageUrl || null);
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
    setFormImageFile(null);
    setFormImagePreview(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBanner && !formImageFile) {
      toast.error('Please upload a banner image file');
      return;
    }

    if (formStartAt && formEndAt) {
      const s = new Date(formStartAt);
      const end = new Date(formEndAt);
      if (end < s) {
        toast.error('End Date cannot be earlier than Start Date');
        return;
      }
    }

    const formData = new FormData();
    formData.append('title', formTitle.trim() || 'Home Banner');
    if (formSubtitle.trim()) formData.append('subtitle', formSubtitle.trim());
    if (formDescription.trim()) formData.append('description', formDescription.trim());
    if (formImageFile) formData.append('image', formImageFile);
    if (formCtaText.trim()) formData.append('ctaText', formCtaText.trim());
    if (formCtaUrl.trim()) formData.append('ctaUrl', formCtaUrl.trim());
    formData.append('priority', String(formPriority));
    if (formStartAt) formData.append('startAt', new Date(formStartAt).toISOString());
    if (formEndAt) formData.append('endAt', new Date(formEndAt).toISOString());
    formData.append('isActive', String(formIsActive));
    formData.append('isPublished', String(formIsPublished));

    if (editingBanner) {
      updateMutation.mutate({ id: editingBanner.id, formData });
    } else {
      createMutation.mutate(formData);
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
          iconBg="primary"
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
              page={page}
              pageSize={pageSize}
              total={totalCount}
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
              Banner Title <span className="text-xs text-muted-foreground font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g., Summer Fitness Challenge 50% Off (Optional)"
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

          {/* Banner Image Upload */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Banner Image {!editingBanner && <span className="text-red-500">*</span>}
            </label>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/jpeg,image/png,image/webp,image/jpg"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileSelect(e.target.files[0]);
                }
              }}
            />

            {formImagePreview ? (
              <div className="space-y-2.5">
                <div className="relative rounded-xl overflow-hidden border border-border bg-slate-950/40 h-44 group">
                  <img
                    src={formImagePreview}
                    alt="Banner preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg bg-white/95 text-slate-900 text-xs font-bold hover:bg-white transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      Change Image
                    </button>
                    {(formImageFile || (!editingBanner && formImagePreview)) && (
                      <button
                        type="button"
                        onClick={() => {
                          setFormImageFile(null);
                          setFormImagePreview(editingBanner ? editingBanner.imageUrl : null);
                        }}
                        className="p-1.5 rounded-lg bg-red-600/90 text-white text-xs font-bold hover:bg-red-600 transition-all shadow-md cursor-pointer"
                        title="Remove selected image"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs px-1">
                  <span className="flex items-center gap-1.5 text-muted-foreground font-medium truncate max-w-[200px]">
                    <FileImage className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="truncate">{formImageFile ? formImageFile.name : 'Current Banner Image'}</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2.5 py-1 rounded-md bg-muted hover:bg-muted/80 text-foreground text-xs font-medium transition-colors cursor-pointer"
                    >
                      Change Image
                    </button>
                    {formImageFile && (
                      <button
                        type="button"
                        onClick={() => {
                          setFormImageFile(null);
                          setFormImagePreview(editingBanner ? editingBanner.imageUrl : null);
                        }}
                        className="px-2.5 py-1 rounded-md bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-medium transition-colors cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                  isDragging
                    ? 'border-primary bg-primary/5 scale-[0.99]'
                    : 'border-border hover:border-primary/50 hover:bg-muted/30 bg-muted/10'
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Supports JPG, JPEG, PNG, WEBP (Max 10MB)
                  </p>
                </div>
                <button
                  type="button"
                  className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-all pointer-events-none"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  Upload Image
                </button>
              </div>
            )}
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

      {/* 6. Preview Right-Side Drawer */}
      <AdminFormDrawer
        isOpen={!!previewBanner}
        onClose={() => setPreviewBanner(null)}
        title={previewBanner?.title || 'Banner Preview'}
        description={previewBanner ? `Priority #${previewBanner.priority} • ${previewBanner.isPublished ? 'Published' : 'Draft'}` : ''}
        icon={ImageIcon}
        maxWidth="sm:max-w-[500px]"
        footer={
          <div className="flex items-center justify-between gap-2 w-full">
            {previewBanner?.ctaText ? (
              <div className="text-xs font-medium text-foreground">
                Action: <span className="font-semibold text-primary">{previewBanner.ctaText}</span>
              </div>
            ) : <div />}
            <button
              type="button"
              onClick={() => setPreviewBanner(null)}
              className="px-4 py-2 text-xs font-bold bg-muted hover:bg-muted/80 rounded-xl text-foreground transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        }
      >
        {previewBanner && (
          <div className="space-y-4 text-xs">
            <div className="relative rounded-2xl overflow-hidden bg-muted aspect-video border border-border shadow-sm">
              <img
                src={previewBanner.imageUrl}
                alt={previewBanner.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-4 text-white">
                <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                  Priority #{previewBanner.priority}
                </div>
                <h3 className="text-base font-bold text-white leading-tight">{previewBanner.title}</h3>
                {previewBanner.subtitle && (
                  <p className="text-xs text-white/80 mt-0.5">{previewBanner.subtitle}</p>
                )}
              </div>
            </div>

            {previewBanner.description && (
              <div className="p-3.5 bg-muted/40 rounded-xl border border-border">
                <span className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Description</span>
                <p className="text-xs text-foreground font-medium">{previewBanner.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 p-3.5 bg-muted/40 rounded-xl border border-border">
              <div>
                <span className="text-[10px] font-bold uppercase text-muted-foreground block mb-0.5">CTA Button</span>
                <p className="font-bold text-foreground">{previewBanner.ctaText || 'None'}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-muted-foreground block mb-0.5">CTA Target Route</span>
                <p className="font-mono text-[11px] text-muted-foreground truncate">{previewBanner.ctaUrl || 'None'}</p>
              </div>
            </div>
          </div>
        )}
      </AdminFormDrawer>

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
        description={`Are you sure you want to delete banner "${deleteTarget?.title}"? It will no longer appear on the customer home screen.`}
        confirmLabel="Delete Banner"
        variant="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
