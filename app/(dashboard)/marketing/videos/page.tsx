'use client';

import React, { useState, useRef } from 'react';
import {
  Plus,
  Search,
  Video,
  Play,
  PlayCircle,
  Edit2,
  Trash2,
  ExternalLink,
  Eye,
  CheckCircle2,
  XCircle,
  Calendar,
  RefreshCw,
  Clock,
  Layers,
  Sparkles,
  UploadCloud,
  X,
  FileVideo,
  Image as ImageIcon,
  Check,
  RotateCcw,
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
  MarketingVideoService,
  MarketingVideoItem,
} from '@/lib/services/marketing-video.service';
import { toast } from 'react-hot-toast';
import { getErrorMessage } from '@/lib/utils';

export default function MarketingVideosPage() {
  const queryClient = useQueryClient();
  const videoFileInputRef = useRef<HTMLInputElement>(null);
  const thumbFileInputRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE' | 'DRAFT' | 'EXPIRED'>('ALL');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Drawer & Modal states
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<MarketingVideoItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MarketingVideoItem | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [previewVideo, setPreviewVideo] = useState<MarketingVideoItem | null>(null);
  const [previewLoading, setPreviewLoading] = useState<number | null>(null); // holds the loading video id

  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formSubtitle, setFormSubtitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formVideoUrl, setFormVideoUrl] = useState('');
  const [formVideoFile, setFormVideoFile] = useState<File | null>(null);
  const [formThumbnailUrl, setFormThumbnailUrl] = useState('');
  const [formThumbnailFile, setFormThumbnailFile] = useState<File | null>(null);
  const [formThumbnailPreview, setFormThumbnailPreview] = useState<string | null>(null);
  const [formCtaText, setFormCtaText] = useState('Watch Now');
  const [formCtaUrl, setFormCtaUrl] = useState('');
  const [formStatus, setFormStatus] = useState<'ACTIVE' | 'DRAFT' | 'INACTIVE'>('ACTIVE');
  const [formPriority, setFormPriority] = useState<number>(0);
  const [formStartAt, setFormStartAt] = useState('');
  const [formEndAt, setFormEndAt] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [formIsPublished, setFormIsPublished] = useState(true);
  const [formShowOnHome, setFormShowOnHome] = useState(true);
  const [formShowInIntroduction, setFormShowInIntroduction] = useState(false);

  // Query Videos list
  const {
    data: videosResponse,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['marketing-videos', page, pageSize, search, statusFilter],
    queryFn: () =>
      MarketingVideoService.getVideos({
        page,
        limit: pageSize,
        search: search.trim() || undefined,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
      }),
  });

  const videoItems: MarketingVideoItem[] = videosResponse?.data || [];
  const totalVideos = videosResponse?.total || videoItems.length;
  const totalPages = videosResponse?.totalPages || 1;

  // Stats calculation
  const now = new Date();
  const activeCount = videoItems.filter((v) => v.isActive && v.status === 'ACTIVE').length;
  const scheduledCount = videoItems.filter((v) => {
    if (!v.isActive) return false;
    if (v.startAt && new Date(v.startAt) > now) return true;
    if (v.endAt && new Date(v.endAt) >= now) return true;
    return false;
  }).length;
  const inactiveCount = videoItems.filter((v) => !v.isActive || v.status === 'INACTIVE' || v.status === 'DRAFT').length;

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: FormData | any) => MarketingVideoService.createVideo(payload),
    onSuccess: () => {
      toast.success('Marketing video created successfully');
      queryClient.invalidateQueries({ queryKey: ['marketing-videos'] });
      closeDrawer();
    },
    onError: (err) => {
      toast.error(getErrorMessage(err) || 'Failed to create marketing video');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: FormData | any }) =>
      MarketingVideoService.updateVideo(id, payload),
    onSuccess: () => {
      toast.success('Marketing video updated successfully');
      queryClient.invalidateQueries({ queryKey: ['marketing-videos'] });
      closeDrawer();
    },
    onError: (err) => {
      toast.error(getErrorMessage(err) || 'Failed to update marketing video');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => MarketingVideoService.deleteVideo(id),
    onSuccess: () => {
      toast.success('Marketing video deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['marketing-videos'] });
      setIsDeleteOpen(false);
      setDeleteTarget(null);
    },
    onError: (err) => {
      toast.error(getErrorMessage(err) || 'Failed to delete marketing video');
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      MarketingVideoService.setStatus(id, isActive),
    onSuccess: (data) => {
      toast.success(`Video ${data.isActive ? 'activated' : 'deactivated'}`);
      queryClient.invalidateQueries({ queryKey: ['marketing-videos'] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err) || 'Failed to update video status');
    },
  });

  const resetViewsMutation = useMutation({
    mutationFn: (id: number) => MarketingVideoService.resetViews(id),
    onSuccess: (res) => {
      toast.success(res?.message || 'Introduction views reset successfully');
    },
    onError: (err) => {
      toast.error(getErrorMessage(err) || 'Failed to reset views');
    },
  });

  // Fetch a fresh presigned playback URL before opening the preview modal
  const openPreview = async (video: MarketingVideoItem) => {
    setPreviewLoading(video.id);
    try {
      const fresh = await MarketingVideoService.getPlaybackUrl(video.id);
      setPreviewVideo({
        ...video,
        videoUrl: fresh.videoUrl ?? video.videoUrl,
        thumbnailUrl: fresh.thumbnailUrl ?? video.thumbnailUrl,
      });
    } catch {
      // Fallback to cached list URL if endpoint fails
      setPreviewVideo(video);
    } finally {
      setPreviewLoading(null);
    }
  };

  // Drawer handlers
  const openCreateDrawer = () => {
    setEditingVideo(null);
    setFormTitle('');
    setFormSubtitle('');
    setFormDescription('');
    setFormVideoUrl('');
    setFormVideoFile(null);
    setFormThumbnailUrl('');
    setFormThumbnailFile(null);
    setFormThumbnailPreview(null);
    setFormCtaText('Watch Now');
    setFormCtaUrl('');
    setFormStatus('ACTIVE');
    setFormPriority(0);
    setFormStartAt('');
    setFormEndAt('');
    setFormIsActive(true);
    setFormIsPublished(true);
    setFormShowOnHome(true);
    setFormShowInIntroduction(false);
    setIsDrawerOpen(true);
  };

  const openEditDrawer = (video: MarketingVideoItem) => {
    setEditingVideo(video);
    setFormTitle(video.title || '');
    setFormSubtitle(video.subtitle || '');
    setFormDescription(video.description || '');
    setFormVideoUrl(video.videoUrl || '');
    setFormVideoFile(null);
    setFormThumbnailUrl(video.thumbnailUrl || '');
    setFormThumbnailFile(null);
    setFormThumbnailPreview(video.thumbnailUrl || null);
    setFormCtaText(video.ctaText || 'Watch Now');
    setFormCtaUrl(video.ctaUrl || '');
    setFormStatus((video.status as any) || 'ACTIVE');
    setFormPriority(video.priority || 0);
    setFormStartAt(video.startAt ? new Date(video.startAt).toISOString().slice(0, 16) : '');
    setFormEndAt(video.endAt ? new Date(video.endAt).toISOString().slice(0, 16) : '');
    setFormIsActive(video.isActive);
    setFormIsPublished(video.isPublished);
    setFormShowOnHome(video.showOnHome ?? true);
    setFormShowInIntroduction(video.showInIntroduction ?? false);
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setEditingVideo(null);
    setFormVideoFile(null);
    setFormThumbnailFile(null);
    setFormThumbnailPreview(null);
  };

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 100 * 1024 * 1024) {
        toast.error('Video file size exceeds 100MB limit');
        return;
      }
      setFormVideoFile(file);
    }
  };

  const handleThumbFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Image file size exceeds 10MB limit');
        return;
      }
      setFormThumbnailFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setFormThumbnailPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formTitle.trim()) {
      toast.error('Please provide a video title');
      return;
    }

    if (!editingVideo && !formVideoFile && !formVideoUrl.trim()) {
      toast.error('Please upload a video file or enter a valid Video URL');
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

    // Prepare payload (FormData if files present)
    if (formVideoFile || formThumbnailFile) {
      const formData = new FormData();
      formData.append('title', formTitle.trim());
      if (formSubtitle.trim()) formData.append('subtitle', formSubtitle.trim());
      if (formDescription.trim()) formData.append('description', formDescription.trim());
      if (formVideoUrl.trim()) formData.append('videoUrl', formVideoUrl.trim());
      if (formThumbnailUrl.trim()) formData.append('thumbnailUrl', formThumbnailUrl.trim());
      if (formCtaText.trim()) formData.append('ctaText', formCtaText.trim());
      if (formCtaUrl.trim()) formData.append('ctaUrl', formCtaUrl.trim());
      formData.append('status', formStatus);
      formData.append('priority', String(formPriority));
      formData.append('isActive', String(formIsActive));
      formData.append('isPublished', String(formIsPublished));
      formData.append('showOnHome', String(formShowOnHome));
      formData.append('showInIntroduction', String(formShowInIntroduction));
      if (formStartAt) formData.append('startAt', new Date(formStartAt).toISOString());
      if (formEndAt) formData.append('endAt', new Date(formEndAt).toISOString());

      if (formVideoFile) formData.append('video', formVideoFile);
      if (formThumbnailFile) formData.append('thumbnail', formThumbnailFile);

      if (editingVideo) {
        updateMutation.mutate({ id: editingVideo.id, payload: formData });
      } else {
        createMutation.mutate(formData);
      }
    } else {
      const payload: any = {
        title: formTitle.trim(),
        subtitle: formSubtitle.trim() || undefined,
        description: formDescription.trim() || undefined,
        videoUrl: formVideoUrl.trim() || undefined,
        thumbnailUrl: formThumbnailUrl.trim() || undefined,
        ctaText: formCtaText.trim() || undefined,
        ctaUrl: formCtaUrl.trim() || undefined,
        status: formStatus,
        priority: Number(formPriority),
        isActive: formIsActive,
        isPublished: formIsPublished,
        showOnHome: formShowOnHome,
        showInIntroduction: formShowInIntroduction,
        startAt: formStartAt ? new Date(formStartAt).toISOString() : null,
        endAt: formEndAt ? new Date(formEndAt).toISOString() : null,
      };

      if (editingVideo) {
        updateMutation.mutate({ id: editingVideo.id, payload });
      } else {
        createMutation.mutate(payload);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Page Hero */}
      <AdminPageHero
        title="Marketing Videos"
        description="Manage dynamic video campaigns on the Customer Home Screen (positioned between QB Marketplace and Influencer Hub)."
        badge={{ text: 'Customer Home Screen', icon: Video, variant: 'emerald' }}
        actions={
          <button
            onClick={openCreateDrawer}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#23C45E] text-white text-xs font-bold hover:bg-[#1fa951] transition-all cursor-pointer shadow-md shadow-emerald-900/20 shrink-0"
          >
            <Plus className="w-4 h-4" />
            Add Marketing Video
          </button>
        }
      />

      {/* 2. Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <AdminStatCard
          title="Total Videos"
          value={totalVideos}
          icon={Video}
          iconBg="slate"
        />
        <AdminStatCard
          title="Active on Home"
          value={activeCount}
          icon={PlayCircle}
          iconBg="primary"
        />
        <AdminStatCard
          title="Scheduled Window"
          value={scheduledCount}
          icon={Calendar}
          iconBg="purple"
        />
        <AdminStatCard
          title="Inactive / Draft"
          value={inactiveCount}
          icon={Clock}
          iconBg="amber"
        />
      </div>

      {/* 3. Filter Bar */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search videos by title, description..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-border bg-background focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <div className="flex rounded-lg border border-border bg-muted/30 p-0.5 text-xs font-medium">
              {(['ALL', 'ACTIVE', 'INACTIVE', 'DRAFT'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => {
                    setStatusFilter(st);
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-md transition-colors ${
                    statusFilter === st
                      ? 'bg-background shadow-xs text-foreground font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {st === 'ALL' ? 'All' : st.charAt(0) + st.slice(1).toLowerCase()}
                </button>
              ))}
            </div>

            <button
              onClick={() => refetch()}
              className="p-2 rounded-lg border border-border hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors"
              title="Refresh videos"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Video Table / Cards */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/40 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Video / Thumbnail</th>
                <th className="py-3.5 px-4">Title & Description</th>
                <th className="py-3.5 px-4">Placement</th>
                <th className="py-3.5 px-4">Call to Action</th>
                <th className="py-3.5 px-4 text-center">Display Order</th>
                <th className="py-3.5 px-4">Schedule Period</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Active</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-primary" />
                      <span>Loading marketing videos...</span>
                    </div>
                  </td>
                </tr>
              ) : videoItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                      <div className="w-12 h-12 rounded-full bg-muted/60 flex items-center justify-center mb-3 text-muted-foreground">
                        <Video className="w-6 h-6" />
                      </div>
                      <p className="text-base font-semibold text-foreground">No marketing videos found</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {search
                          ? 'No marketing videos match your search.'
                          : 'Get started by creating your first dynamic marketing video.'}
                      </p>
                      <button
                        onClick={openCreateDrawer}
                        className="mt-4 px-4 py-2 text-xs font-semibold bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                      >
                        + Add Marketing Video
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                videoItems.map((video) => (
                  <tr key={video.id} className="hover:bg-muted/30 transition-colors">
                    {/* Thumbnail & Video Preview Trigger */}
                    <td className="py-3 px-4">
                      <div
                        onClick={() => openPreview(video)}
                        className="relative w-28 h-16 rounded-lg overflow-hidden bg-muted border border-border cursor-pointer group shrink-0 flex items-center justify-center"
                      >
                        {video.thumbnailUrl ? (
                          <img
                            src={video.thumbnailUrl}
                            alt={video.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-full bg-slate-900 flex items-center justify-center text-white/70">
                            <Video className="w-6 h-6" />
                          </div>
                        )}
                        {previewLoading === video.id ? (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white">
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          </div>
                        ) : (
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                            <Play className="w-5 h-5 fill-white" />
                          </div>
                        )}
                        <div className="absolute bottom-1 right-1 px-1 py-0.5 rounded bg-black/70 text-[9px] font-mono text-white flex items-center gap-0.5">
                          <Play className="w-2.5 h-2.5 fill-white" />
                          Video
                        </div>
                      </div>
                    </td>

                    {/* Title & Description */}
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-semibold text-foreground line-clamp-1">{video.title}</div>
                      {video.subtitle && (
                        <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5 font-medium">
                          {video.subtitle}
                        </div>
                      )}
                      {video.description && (
                        <div className="text-xs text-muted-foreground/80 line-clamp-1 mt-0.5">
                          {video.description}
                        </div>
                      )}
                    </td>

                    {/* Placement Badges */}
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-1">
                        <span
                          className={`inline-flex items-center gap-1.5 text-[11px] font-semibold ${
                            video.showOnHome ? 'text-emerald-600' : 'text-muted-foreground/50'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              video.showOnHome ? 'bg-emerald-500' : 'bg-muted-foreground/30'
                            }`}
                          />
                          Home: {video.showOnHome ? 'ON' : 'OFF'}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1.5 text-[11px] font-semibold ${
                            video.showInIntroduction ? 'text-purple-600' : 'text-muted-foreground/50'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              video.showInIntroduction ? 'bg-purple-500' : 'bg-muted-foreground/30'
                            }`}
                          />
                          Intro: {video.showInIntroduction ? 'ON' : 'OFF'}
                        </span>
                      </div>
                    </td>

                    {/* CTA */}
                    <td className="py-3 px-4">
                      {video.ctaText ? (
                        <div className="flex items-center gap-1 text-xs text-primary font-medium">
                          <span>{video.ctaText}</span>
                          {video.ctaUrl && <ExternalLink className="w-3 h-3 shrink-0" />}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground/60">—</span>
                      )}
                    </td>

                    {/* Priority */}
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-semibold bg-muted text-foreground">
                        {video.priority}
                      </span>
                    </td>

                    {/* Schedule */}
                    <td className="py-3 px-4 text-xs text-muted-foreground">
                      {video.startAt || video.endAt ? (
                        <div className="space-y-0.5">
                          {video.startAt && (
                            <div>
                              <span className="text-muted-foreground/60">From: </span>
                              {new Date(video.startAt).toLocaleDateString()}
                            </div>
                          )}
                          {video.endAt && (
                            <div>
                              <span className="text-muted-foreground/60">To: </span>
                              {new Date(video.endAt).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-emerald-600 font-medium">Always Active</span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                          video.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                            : video.status === 'DRAFT'
                            ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                            : 'bg-muted text-muted-foreground border border-border'
                        }`}
                      >
                        {video.status}
                      </span>
                    </td>

                    {/* Active Toggle Switch */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() =>
                          toggleStatusMutation.mutate({
                            id: video.id,
                            isActive: !video.isActive,
                          })
                        }
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-hidden ${
                          video.isActive ? 'bg-primary' : 'bg-muted'
                        }`}
                        title={video.isActive ? 'Deactivate video' : 'Activate video'}
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                            video.isActive ? 'translate-x-4.5' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openPreview(video)}
                          className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                          title="Watch video"
                          disabled={previewLoading === video.id}
                        >
                          {previewLoading === video.id ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Play className="w-4 h-4 fill-current" />
                          )}
                        </button>
                        {video.showInIntroduction && (
                          <button
                            onClick={() => {
                              if (
                                confirm(
                                  `Reset introduction view records for "${video.title}"? This will allow customers who already completed/skipped this video to see it once more.`,
                                )
                              ) {
                                resetViewsMutation.mutate(video.id);
                              }
                            }}
                            className="p-1.5 rounded-md hover:bg-purple-500/10 text-muted-foreground hover:text-purple-600 transition-colors"
                            title="Reset customer views (Re-show in Introduction)"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => openEditDrawer(video)}
                          className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                          title="Edit video"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setDeleteTarget(video);
                            setIsDeleteOpen(true);
                          }}
                          className="p-1.5 rounded-md hover:bg-rose-500/10 text-muted-foreground hover:text-rose-600 transition-colors"
                          title="Delete video"
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
        {totalPages > 1 && (
          <AdminPagination
            page={page}
            pageSize={pageSize}
            total={totalVideos}
            totalPages={totalPages}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        )}
      </div>

      {/* 5. Create / Edit Drawer */}
      <AdminFormDrawer
        isOpen={isDrawerOpen}
        onClose={closeDrawer}
        title={editingVideo ? 'Edit Marketing Video' : 'Add New Marketing Video'}
        subtitle={
          editingVideo
            ? `Editing video ID #${editingVideo.id}`
            : 'Create dynamic marketing video for Customer Home Screen.'
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4 p-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g., Summer Marketing Campaign"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          {/* Subtitle */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Subtitle
            </label>
            <input
              type="text"
              placeholder="e.g., Discover our newest automation tools"
              value={formSubtitle}
              onChange={(e) => setFormSubtitle(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Description
            </label>
            <textarea
              rows={2}
              placeholder="Brief description of the video content or offer..."
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          {/* Video Source */}
          <div className="p-3 bg-muted/30 border border-border rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <FileVideo className="w-4 h-4 text-primary" />
                Video Media <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-muted-foreground">Upload file or enter URL</span>
            </div>

            <div className="flex items-center gap-2">
              <input
                ref={videoFileInputRef}
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                onChange={handleVideoFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => videoFileInputRef.current?.click()}
                className="px-3 py-1.5 text-xs font-medium border border-border rounded-lg bg-background hover:bg-muted flex items-center gap-1.5 transition-colors"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                {formVideoFile ? 'Replace Video File' : 'Upload Video File'}
              </button>
              {formVideoFile && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-500/10 px-2 py-1 rounded">
                  <Check className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[140px]">{formVideoFile.name}</span>
                  <button
                    type="button"
                    onClick={() => setFormVideoFile(null)}
                    className="text-muted-foreground hover:text-rose-500 ml-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-[11px] text-muted-foreground mb-1">
                Or Direct Video URL (MP4 / S3 / WebM):
              </label>
              <input
                type="url"
                placeholder="https://.../video.mp4"
                value={formVideoUrl}
                onChange={(e) => setFormVideoUrl(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>

          {/* Thumbnail Source */}
          <div className="p-3 bg-muted/30 border border-border rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-primary" />
                Cover Thumbnail (Optional)
              </label>
              <span className="text-[11px] text-muted-foreground">JPG, PNG, WebP</span>
            </div>

            <div className="flex items-center gap-2">
              <input
                ref={thumbFileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleThumbFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => thumbFileInputRef.current?.click()}
                className="px-3 py-1.5 text-xs font-medium border border-border rounded-lg bg-background hover:bg-muted flex items-center gap-1.5 transition-colors"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                {formThumbnailFile ? 'Replace Thumbnail' : 'Upload Thumbnail Image'}
              </button>
              {formThumbnailFile && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-500/10 px-2 py-1 rounded">
                  <Check className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[140px]">{formThumbnailFile.name}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setFormThumbnailFile(null);
                      setFormThumbnailPreview(null);
                    }}
                    className="text-muted-foreground hover:text-rose-500 ml-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {formThumbnailPreview && (
              <div className="relative w-32 h-18 rounded-lg overflow-hidden border border-border">
                <img
                  src={formThumbnailPreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div>
              <label className="block text-[11px] text-muted-foreground mb-1">
                Or Thumbnail Image URL:
              </label>
              <input
                type="url"
                placeholder="https://.../thumbnail.jpg"
                value={formThumbnailUrl}
                onChange={(e) => {
                  setFormThumbnailUrl(e.target.value);
                  setFormThumbnailPreview(e.target.value);
                }}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>

          {/* CTA Settings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                CTA Button Text
              </label>
              <input
                type="text"
                placeholder="e.g., Watch Now, Claim Offer"
                value={formCtaText}
                onChange={(e) => setFormCtaText(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                CTA Destination URL
              </label>
              <input
                type="text"
                placeholder="e.g., https://... or /customer/plans"
                value={formCtaUrl}
                onChange={(e) => setFormCtaUrl(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>

          {/* Status & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Video Status
              </label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as any)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="ACTIVE">ACTIVE (Live)</option>
                <option value="DRAFT">DRAFT (Hidden)</option>
                <option value="INACTIVE">INACTIVE (Disabled)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Display Order / Priority
              </label>
              <input
                type="number"
                placeholder="0"
                value={formPriority}
                onChange={(e) => setFormPriority(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Start Date/Time
              </label>
              <input
                type="datetime-local"
                value={formStartAt}
                onChange={(e) => setFormStartAt(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                End Date/Time
              </label>
              <input
                type="datetime-local"
                value={formEndAt}
                onChange={(e) => setFormEndAt(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>

          {/* Visibility & Placement Settings */}
          <div className="p-3 bg-muted/30 border border-border rounded-lg space-y-3">
            <div className="text-xs font-semibold text-foreground">Visibility & Placement</div>
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="showOnHome"
                checked={formShowOnHome}
                onChange={(e) => setFormShowOnHome(e.target.checked)}
                className="mt-0.5 rounded text-primary focus:ring-primary w-4 h-4"
              />
              <label htmlFor="showOnHome" className="text-xs text-foreground cursor-pointer font-medium">
                Show on Customer Home
                <span className="block text-[11px] text-muted-foreground font-normal">
                  Renders in the dynamic Marketing Video section between QB Marketplace and Influencer Hub.
                </span>
              </label>
            </div>
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="showInIntroduction"
                checked={formShowInIntroduction}
                onChange={(e) => setFormShowInIntroduction(e.target.checked)}
                className="mt-0.5 rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
              />
              <label htmlFor="showInIntroduction" className="text-xs text-foreground cursor-pointer font-medium">
                Show in Introduction / Onboarding
                <span className="block text-[11px] text-muted-foreground font-normal">
                  Presented once to each customer during onboarding/launch, then automatically marked as seen.
                </span>
              </label>
            </div>
          </div>

          {/* Active Toggle */}
          <div className="pt-2 flex items-center justify-between border-t border-border">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formIsActive}
                onChange={(e) => setFormIsActive(e.target.checked)}
                className="rounded text-primary focus:ring-primary w-4 h-4"
              />
              <label htmlFor="isActive" className="text-xs font-semibold text-foreground cursor-pointer">
                Campaign Enabled / Active
              </label>
            </div>
          </div>

          {/* Drawer Actions */}
          <div className="pt-4 flex items-center justify-end gap-2 border-t border-border">
            <button
              type="button"
              onClick={closeDrawer}
              className="px-4 py-2 text-xs font-medium rounded-lg border border-border hover:bg-muted transition-colors"
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
                : editingVideo
                ? 'Update Video'
                : 'Create Video'}
            </button>
          </div>
        </form>
      </AdminFormDrawer>

      {/* 6. Video Preview Modal */}
      {previewVideo && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-card border border-border rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl relative">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-foreground">{previewVideo.title}</h3>
                {previewVideo.subtitle && (
                  <p className="text-xs text-muted-foreground">{previewVideo.subtitle}</p>
                )}
              </div>
              <button
                onClick={() => setPreviewVideo(null)}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative aspect-video bg-black flex items-center justify-center">
              {previewVideo.videoUrl?.includes('youtube.com') || previewVideo.videoUrl?.includes('youtu.be') ? (
                <iframe
                  src={
                    previewVideo.videoUrl.includes('watch?v=')
                      ? previewVideo.videoUrl.replace('watch?v=', 'embed/')
                      : previewVideo.videoUrl
                  }
                  title={previewVideo.title}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video
                  src={previewVideo.videoUrl}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                  poster={previewVideo.thumbnailUrl || undefined}
                >
                  Your browser does not support the video tag.
                </video>
              )}
            </div>

            {previewVideo.description && (
              <div className="p-4 bg-muted/20 border-t border-border">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {previewVideo.description}
                </p>
                {previewVideo.ctaText && (
                  <div className="mt-2 text-xs font-semibold text-primary flex items-center gap-1">
                    <span>CTA: {previewVideo.ctaText}</span>
                    {previewVideo.ctaUrl && <span className="text-muted-foreground">({previewVideo.ctaUrl})</span>}
                  </div>
                )}
              </div>
            )}
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
        title="Delete Marketing Video"
        description={`Are you sure you want to delete "${deleteTarget?.title}"? This video will no longer appear on the customer app.`}
        confirmLabel="Delete Video"
        variant="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
