'use client';

import * as React from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/common/Badge';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { SlideOverDrawer } from '@/components/common/Drawer';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import {
  faVideo,
  faPlus,
  faRotate,
  faDownload,
  faSearch,
  faPlay,
  faEye,
  faPenToSquare,
  faTrashCan,
  faChevronLeft,
  faChevronRight,
  faXmark,
  faStar,
  faLink,
  faUpload,
  faCheckCircle,
  faArrowUpRightFromSquare,
  faCopy,
  faCircleCheck,
  faClock,
  faSliders,
  faChartLine,
} from '@fortawesome/free-solid-svg-icons';
import { toast } from '@/hooks/use-toast';
import {
  loadVideos,
  saveVideo,
  removeVideo,
  publishVideo,
  updateVideoStatus,
  sessionCan,
  suiteError,
} from '@/modules/suite/suite-api';

const initialFormData = {
  title: '',
  subtitle: '',
  description: '',
  videoUrl: '',
  thumbnailUrl: '',
  priority: 0,
  status: 'ACTIVE',
  isActive: true,
  isPublished: true,
};

function formatDate(val) {
  if (!val) return '—';
  try {
    const d = new Date(val);
    return isNaN(d.getTime())
      ? '—'
      : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return '—';
  }
}

export function MarketingVideosScreen() {
  const [canManage, setCanManage] = React.useState(true);

  // Filters & Tabs
  const [activeTab, setActiveTab] = React.useState('ALL'); // 'ALL' | 'ACTIVE' | 'DRAFT'
  const [search, setSearch] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('ALL');
  const [sortBy, setSortBy] = React.useState('PRIORITY'); // 'PRIORITY' | 'NEWEST' | 'VIEWS'

  // Listing & Pagination
  const [videos, setVideos] = React.useState([]);
  const [pagination, setPagination] = React.useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(10);
  const [loading, setLoading] = React.useState(true);
  const [refreshKey, setRefreshKey] = React.useState(0);

  // SlideOver Form state
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingVideo, setEditingVideo] = React.useState(null);
  const [form, setForm] = React.useState(initialFormData);
  const [videoMode, setVideoMode] = React.useState('URL'); // 'FILE' | 'URL'
  const [thumbMode, setThumbMode] = React.useState('URL'); // 'FILE' | 'URL'
  const [videoFile, setVideoFile] = React.useState(null);
  const [thumbFile, setThumbFile] = React.useState(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = React.useState('');
  const [thumbPreviewUrl, setThumbPreviewUrl] = React.useState('');
  const [formBusy, setFormBusy] = React.useState(false);

  // Video Player Preview Modal
  const [previewVideo, setPreviewVideo] = React.useState(null);

  // Delete Dialog state
  const [deletingVideo, setDeletingVideo] = React.useState(null);
  const [deleteBusy, setDeleteBusy] = React.useState(false);

  // Permission check
  React.useEffect(() => {
    setCanManage(sessionCan('MARKETING') || sessionCan('CONTENT'));
  }, []);

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Load videos from backend
  const fetchVideos = React.useCallback(async () => {
    setLoading(true);
    try {
      let queryStatus = statusFilter !== 'ALL' ? statusFilter : undefined;
      if (activeTab === 'ACTIVE') queryStatus = 'ACTIVE';
      else if (activeTab === 'DRAFT') queryStatus = 'DRAFT';

      const res = await loadVideos({
        search: debouncedSearch,
        status: queryStatus,
        page,
        limit,
      });

      setVideos(res.rows || []);
      setPagination(
        res.pagination || {
          page,
          limit,
          total: res.rows?.length || 0,
          totalPages: 1,
        }
      );
    } catch (err) {
      toast.error(suiteError(err) || 'Failed to load marketing videos.');
    } finally {
      setLoading(false);
    }
  }, [activeTab, debouncedSearch, statusFilter, page, limit]);

  React.useEffect(() => {
    fetchVideos();
  }, [fetchVideos, refreshKey]);

  // Client-side sorting for display
  const sortedVideos = React.useMemo(() => {
    const list = [...videos];
    if (sortBy === 'PRIORITY') {
      return list.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
    }
    if (sortBy === 'NEWEST') {
      return list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }
    if (sortBy === 'VIEWS') {
      return list.sort((a, b) => (b.views ?? b.viewCount ?? 0) - (a.views ?? a.viewCount ?? 0));
    }
    return list;
  }, [videos, sortBy]);

  // KPI Summary calculations
  const stats = React.useMemo(() => {
    const total = pagination.total || videos.length;
    const activeCount = videos.filter((v) => v.isActive && (v.status === 'ACTIVE' || !v.status)).length;
    const totalViews = videos.reduce((acc, v) => acc + (Number(v.views || v.viewCount) || 0), 0);
    const highPriorityCount = videos.filter((v) => Number(v.priority) > 0).length;
    return {
      total,
      active: activeCount,
      totalViews,
      highPriority: highPriorityCount,
    };
  }, [videos, pagination.total]);

  // Handlers
  const handleOpenCreate = () => {
    setEditingVideo(null);
    setForm(initialFormData);
    setVideoFile(null);
    setThumbFile(null);
    setVideoPreviewUrl('');
    setThumbPreviewUrl('');
    setVideoMode('URL');
    setThumbMode('URL');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (v) => {
    setEditingVideo(v);
    setForm({
      title: v.title || '',
      subtitle: v.subtitle || '',
      description: v.description || '',
      videoUrl: v.videoUrl || '',
      thumbnailUrl: v.thumbnailUrl || '',
      priority: v.priority ?? 0,
      status: v.status || 'ACTIVE',
      isActive: v.isActive !== false,
      isPublished: v.isPublished !== false,
    });
    setVideoFile(null);
    setThumbFile(null);
    setVideoPreviewUrl(v.videoUrl || '');
    setThumbPreviewUrl(v.thumbnailUrl || '');
    setVideoMode('URL');
    setThumbMode('URL');
    setIsFormOpen(true);
  };

  const handleTogglePublish = async (video) => {
    if (!canManage) {
      toast.error('You do not have permission to modify videos.');
      return;
    }
    const nextState = !video.isPublished;
    // Optimistic UI update
    setVideos((prev) =>
      prev.map((item) => (item.id === video.id ? { ...item, isPublished: nextState } : item))
    );
    try {
      await publishVideo(video.id, nextState);
      toast.success(`Video ${nextState ? 'published to' : 'unpublished from'} app.`);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(suiteError(err) || 'Failed to update video publish state.');
      setRefreshKey((k) => k + 1);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingVideo) return;
    setDeleteBusy(true);
    try {
      await removeVideo(deletingVideo.id);
      toast.success('Video deleted successfully.');
      setDeletingVideo(null);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(suiteError(err) || 'Failed to delete video.');
    } finally {
      setDeleteBusy(false);
    }
  };

  const handleSaveVideo = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    if (!form.title.trim()) {
      toast.error('Please enter a video title.');
      return;
    }
    if (videoMode === 'URL' && !form.videoUrl.trim()) {
      toast.error('Please enter a valid video media URL or upload a video file.');
      return;
    }
    if (videoMode === 'FILE' && !videoFile && !editingVideo?.videoUrl) {
      toast.error('Please select a video file to upload.');
      return;
    }

    setFormBusy(true);
    try {
      await saveVideo(form, editingVideo?.id, { video: videoFile, thumbnail: thumbFile });
      toast.success(editingVideo ? 'Video updated successfully.' : 'Video created successfully.');
      setIsFormOpen(false);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(suiteError(err) || 'Failed to save video.');
    } finally {
      setFormBusy(false);
    }
  };

  const handleExportCsv = () => {
    if (!sortedVideos.length) {
      toast.error('No videos available to export.');
      return;
    }
    const headers = ['Video ID', 'Title', 'Subtitle', 'Priority', 'Status', 'Published', 'Views', 'Video URL', 'Thumbnail URL', 'Created At'];
    const rows = sortedVideos.map((v) => [
      `"${v.id}"`,
      `"${(v.title || '').replace(/"/g, '""')}"`,
      `"${(v.subtitle || '').replace(/"/g, '""')}"`,
      v.priority ?? 0,
      v.status || (v.isActive ? 'ACTIVE' : 'INACTIVE'),
      v.isPublished ? 'YES' : 'NO',
      v.views ?? v.viewCount ?? 0,
      `"${v.videoUrl || ''}"`,
      `"${v.thumbnailUrl || ''}"`,
      `"${v.createdAt || ''}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `marketing_videos_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Marketing videos exported as CSV.');
  };

  const copyToClipboard = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  return (
    <div className="w-full min-w-0 max-w-none space-y-6 overflow-x-hidden pb-16 font-sans text-slate-800">
      {/* ── 1. Top PageHeader ────────────────────────────────────────────────── */}
      <PageHeader
        category="IN APP AD'S"
        title="Marketing Videos"
        description="Manage promotional and educational videos displayed in the mobile and web apps with custom priority, thumbnail previews, and publishing controls."
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRefreshKey((k) => k + 1)}
              disabled={loading}
              className="rounded-xl border-slate-200 text-xs font-semibold text-slate-700 hover:text-[#107569]"
            >
              <FontAwesomeIcon icon={faRotate} className={`size-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              disabled={!sortedVideos.length}
              className="rounded-xl border-slate-200 text-xs font-semibold text-slate-700 hover:text-[#107569]"
            >
              <FontAwesomeIcon icon={faDownload} className="size-3.5 mr-1.5" />
              <span>Export CSV</span>
            </Button>
            {canManage && (
              <Button
                size="sm"
                onClick={handleOpenCreate}
                className="rounded-xl bg-[#107569] px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#0e6359]"
              >
                <FontAwesomeIcon icon={faPlus} className="size-3.5 mr-1.5" />
                <span>Add Video</span>
              </Button>
            )}
          </div>
        }
      />

      {/* ── 2. Top Segmented Status Filter Tabs ──────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveTab('ALL');
              setPage(1);
            }}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
              activeTab === 'ALL'
                ? 'bg-[#107569] text-white shadow-xs'
                : 'border border-slate-200/90 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            <FontAwesomeIcon icon={faVideo} className="size-3.5" />
            <span>All Videos</span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                activeTab === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {stats.total}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('ACTIVE');
              setPage(1);
            }}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
              activeTab === 'ACTIVE'
                ? 'bg-[#107569] text-white shadow-xs'
                : 'border border-slate-200/90 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            <FontAwesomeIcon icon={faCheckCircle} className="size-3.5 text-emerald-500" />
            <span>Active</span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                activeTab === 'ACTIVE' ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-700'
              }`}
            >
              {stats.active}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('DRAFT');
              setPage(1);
            }}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
              activeTab === 'DRAFT'
                ? 'bg-[#107569] text-white shadow-xs'
                : 'border border-slate-200/90 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            <FontAwesomeIcon icon={faClock} className="size-3.5 text-amber-500" />
            <span>Draft / Inactive</span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                activeTab === 'DRAFT' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {Math.max(0, stats.total - stats.active)}
            </span>
          </button>
        </div>
      </div>

      {/* ── 3. Four Dashboard KPI Cards ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Videos */}
        <div className="group relative flex items-center justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md">
          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Videos</p>
            <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#163A2E]">{stats.total}</p>
            <p className="text-xs text-slate-400">All registered video items</p>
          </div>
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-[#107569] ring-1 ring-emerald-200/60">
            <FontAwesomeIcon icon={faVideo} className="size-5" />
          </div>
        </div>

        {/* Active & Published */}
        <div className="group relative flex items-center justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md">
          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Active & Published</p>
            <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-emerald-700">{stats.active}</p>
            <p className="text-xs text-emerald-600 font-medium">Visible to mobile app users</p>
          </div>
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60">
            <FontAwesomeIcon icon={faCircleCheck} className="size-5" />
          </div>
        </div>

        {/* Total Views */}
        <div className="group relative flex items-center justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md">
          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Views</p>
            <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#163A2E]">
              {Number(stats.totalViews).toLocaleString()}
            </p>
            <p className="text-xs text-slate-400">Combined video plays recorded</p>
          </div>
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-[#107569] ring-1 ring-emerald-200/60">
            <FontAwesomeIcon icon={faEye} className="size-5" />
          </div>
        </div>

        {/* High Priority */}
        <div className="group relative flex items-center justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md">
          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">High Priority (&gt;0)</p>
            <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-amber-700">{stats.highPriority}</p>
            <p className="text-xs text-amber-600 font-medium">Featured at top of app feed</p>
          </div>
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 ring-1 ring-amber-200/60">
            <FontAwesomeIcon icon={faStar} className="size-5" />
          </div>
        </div>
      </div>

      {/* ── 4. Search & Filter Bar ─────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="relative min-w-[240px] flex-1">
          <FontAwesomeIcon icon={faSearch} className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search marketing videos by title or description..."
            className="h-10 w-full rounded-xl border-slate-200 bg-slate-50/50 pl-9 pr-8 text-sm focus:bg-white"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <FontAwesomeIcon icon={faXmark} className="size-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="w-full sm:w-44">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-2xs focus:border-[#107569] focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="DRAFT">DRAFT</option>
              <option value="INACTIVE">INACTIVE</option>
              <option value="EXPIRED">EXPIRED</option>
            </select>
          </div>

          <div className="w-full sm:w-44">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-2xs focus:border-[#107569] focus:outline-none"
            >
              <option value="PRIORITY">Sort: Highest Priority</option>
              <option value="NEWEST">Sort: Newest First</option>
              <option value="VIEWS">Sort: Most Views</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── 5. Main Content: Responsive Video List (Table + Cards) ─────────── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
        {loading ? (
          <div className="py-20 text-center">
            <FontAwesomeIcon icon={faRotate} className="mx-auto size-8 animate-spin text-[#107569]" />
            <p className="mt-3 text-sm font-semibold text-slate-600">Loading marketing videos...</p>
          </div>
        ) : sortedVideos.length === 0 ? (
          <div className="py-20 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-emerald-50 text-[#107569]">
              <FontAwesomeIcon icon={faVideo} className="size-7" />
            </div>
            <h3 className="mt-4 text-base font-bold text-slate-800">No marketing videos found</h3>
            <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
              {search || statusFilter !== 'ALL'
                ? 'No videos match your active filter criteria. Try clearing search or status filters.'
                : 'Marketing videos will appear here. Add promotional videos for users in the mobile app.'}
            </p>
            {canManage && (
              <Button
                onClick={handleOpenCreate}
                className="mt-5 rounded-xl bg-[#107569] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#0e6359]"
              >
                <FontAwesomeIcon icon={faPlus} className="size-3.5 mr-1.5" />
                <span>Add First Video</span>
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-[#E2E8E5] bg-[#F4F9F6] text-xs font-bold uppercase tracking-wider text-[#163A2E]">
                    <th className="py-3.5 pl-6 pr-4">Video & Preview</th>
                    <th className="py-3.5 px-4">Priority</th>
                    <th className="py-3.5 px-4">Views</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Published</th>
                    <th className="py-3.5 pl-4 pr-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedVideos.map((v) => (
                    <tr key={v.id} className="transition hover:bg-slate-50/70">
                      {/* Video Thumbnail & Title */}
                      <td className="py-3.5 pl-6 pr-4">
                        <div className="flex items-center gap-3.5">
                          {/* Thumbnail / Play Preview Box */}
                          <div
                            onClick={() => setPreviewVideo(v)}
                            className="group relative flex size-14 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xl bg-slate-900 border border-slate-200"
                            title="Click to play video preview"
                          >
                            {v.thumbnailUrl ? (
                              <img src={v.thumbnailUrl} alt={v.title} className="size-full object-cover" />
                            ) : (
                              <FontAwesomeIcon icon={faVideo} className="size-5 text-slate-400" />
                            )}
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-80 group-hover:opacity-100 transition">
                              <div className="flex size-7 items-center justify-center rounded-full bg-white/90 text-[#107569] shadow-xs group-hover:scale-110 transition">
                                <FontAwesomeIcon icon={faPlay} className="size-3 ml-0.5" />
                              </div>
                            </div>
                          </div>

                          {/* Info */}
                          <div className="min-w-0 max-w-md">
                            <p className="font-bold text-slate-900 truncate">{v.title || 'Untitled Video'}</p>
                            {v.subtitle && <p className="text-xs text-slate-500 truncate">{v.subtitle}</p>}
                            {v.description && (
                              <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{v.description}</p>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              {v.videoUrl && (
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(v.videoUrl, 'Video URL')}
                                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#107569] hover:underline"
                                >
                                  <FontAwesomeIcon icon={faLink} className="size-2.5" />
                                  <span>Media URL</span>
                                </button>
                              )}
                              <span className="text-[10px] text-slate-400">• Added {formatDate(v.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Priority */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold border ${
                            Number(v.priority) > 0
                              ? 'bg-amber-50 text-amber-800 border-amber-200/80'
                              : 'bg-slate-50 text-slate-600 border-slate-200'
                          }`}
                        >
                          <FontAwesomeIcon icon={faStar} className="size-2.5 text-amber-500" />
                          <span>P-{v.priority ?? 0}</span>
                        </span>
                      </td>

                      {/* Views */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-medium text-slate-700">
                        <div className="flex items-center gap-1.5">
                          <FontAwesomeIcon icon={faEye} className="size-3 text-slate-400" />
                          <span>{Number(v.views ?? v.viewCount ?? 0).toLocaleString()}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <StatusBadge
                          status={String(v.status || (v.isActive ? 'active' : 'inactive')).toLowerCase()}
                        />
                      </td>

                      {/* Published Toggle */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleTogglePublish(v)}
                          disabled={!canManage}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            v.isPublished ? 'bg-[#107569]' : 'bg-slate-200'
                          }`}
                          title={v.isPublished ? 'Published to App (Click to unpublish)' : 'Unpublished (Click to publish)'}
                        >
                          <span
                            className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              v.isPublished ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 pl-4 pr-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setPreviewVideo(v)}
                            className="size-8 p-0 text-slate-500 hover:bg-emerald-50 hover:text-[#107569] rounded-lg"
                            title="Watch Preview"
                          >
                            <FontAwesomeIcon icon={faPlay} className="size-3.5" />
                          </Button>
                          {canManage && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenEdit(v)}
                                className="size-8 p-0 text-slate-500 hover:bg-slate-100 hover:text-slate-900 rounded-lg"
                                title="Edit Video"
                              >
                                <FontAwesomeIcon icon={faPenToSquare} className="size-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeletingVideo(v)}
                                className="size-8 p-0 text-rose-500 hover:bg-rose-50 hover:text-rose-700 rounded-lg"
                                title="Delete Video"
                              >
                                <FontAwesomeIcon icon={faTrashCan} className="size-3.5" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile & Tablet Card View */}
            <div className="block lg:hidden divide-y divide-slate-100 p-3 sm:p-4 space-y-3">
              {sortedVideos.map((v) => (
                <div
                  key={v.id}
                  className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-2xs space-y-3 transition hover:border-emerald-200"
                >
                  <div className="flex items-start gap-3">
                    {/* Thumbnail preview button */}
                    <div
                      onClick={() => setPreviewVideo(v)}
                      className="group relative size-16 shrink-0 cursor-pointer overflow-hidden rounded-xl bg-slate-900 border border-slate-200"
                    >
                      {v.thumbnailUrl ? (
                        <img src={v.thumbnailUrl} alt="" className="size-full object-cover" />
                      ) : (
                        <FontAwesomeIcon icon={faVideo} className="size-5 text-slate-400 m-auto" />
                      )}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <div className="flex size-6 items-center justify-center rounded-full bg-white text-[#107569]">
                          <FontAwesomeIcon icon={faPlay} className="size-2.5 ml-0.5" />
                        </div>
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-bold text-slate-900 text-sm leading-tight">{v.title || 'Untitled Video'}</h4>
                        <span
                          className={`shrink-0 inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold border ${
                            Number(v.priority) > 0
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-slate-50 text-slate-600 border-slate-200'
                          }`}
                        >
                          P-{v.priority ?? 0}
                        </span>
                      </div>
                      {v.subtitle && <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{v.subtitle}</p>}
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-2">
                        <span className="flex items-center gap-1 font-medium">
                          <FontAwesomeIcon icon={faEye} className="size-3 text-slate-400" />
                          {Number(v.views ?? v.viewCount ?? 0).toLocaleString()} views
                        </span>
                        <span>•</span>
                        <StatusBadge
                          status={String(v.status || (v.isActive ? 'active' : 'inactive')).toLowerCase()}
                        />
                      </div>
                    </div>
                  </div>

                  {v.description && <p className="text-xs text-slate-600 line-clamp-2">{v.description}</p>}

                  {/* Actions & Published toggle footer */}
                  <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-600">App Visibility:</span>
                      <button
                        type="button"
                        onClick={() => handleTogglePublish(v)}
                        disabled={!canManage}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                          v.isPublished ? 'bg-[#107569]' : 'bg-slate-200'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block size-4 transform rounded-full bg-white shadow ring-0 transition ${
                            v.isPublished ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPreviewVideo(v)}
                        className="h-8 rounded-lg text-xs font-semibold text-[#107569] border-emerald-200 hover:bg-emerald-50"
                      >
                        <FontAwesomeIcon icon={faPlay} className="size-3 mr-1" />
                        <span>Watch</span>
                      </Button>
                      {canManage && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(v)}
                            className="size-8 p-0 text-slate-600 hover:bg-slate-100 rounded-lg"
                          >
                            <FontAwesomeIcon icon={faPenToSquare} className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingVideo(v)}
                            className="size-8 p-0 text-rose-500 hover:bg-rose-50 rounded-lg"
                          >
                            <FontAwesomeIcon icon={faTrashCan} className="size-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            <div className="flex flex-col gap-3 border-t border-slate-200 px-6 py-4 bg-slate-50/50 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs font-medium text-slate-500">
                Showing{' '}
                <span className="font-bold text-slate-700">
                  {pagination.total > 0 ? (page - 1) * limit + 1 : 0}
                </span>{' '}
                to{' '}
                <span className="font-bold text-slate-700">
                  {Math.min(page * limit, pagination.total || sortedVideos.length)}
                </span>{' '}
                of <span className="font-bold text-slate-700">{pagination.total || sortedVideos.length}</span> marketing
                videos
              </p>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <span>Rows:</span>
                  <select
                    value={limit}
                    onChange={(e) => {
                      setLimit(Number(e.target.value));
                      setPage(1);
                    }}
                    className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700 focus:outline-none"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1 || loading}
                    className="size-8 p-0 rounded-lg border-slate-200 text-slate-600 disabled:opacity-40"
                  >
                    <FontAwesomeIcon icon={faChevronLeft} className="size-3" />
                  </Button>
                  <span className="px-2 text-xs font-bold text-slate-700">
                    {page} / {pagination.totalPages || 1}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(pagination.totalPages || 1, p + 1))}
                    disabled={page >= (pagination.totalPages || 1) || loading}
                    className="size-8 p-0 rounded-lg border-slate-200 text-slate-600 disabled:opacity-40"
                  >
                    <FontAwesomeIcon icon={faChevronRight} className="size-3" />
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── 6. Interactive Video Player Modal ───────────────────────────────── */}
      <Dialog open={Boolean(previewVideo)} onOpenChange={(open) => !open && setPreviewVideo(null)}>
        <DialogContent className="max-w-3xl bg-white p-6 rounded-2xl border border-slate-200 shadow-2xl">
          <DialogHeader className="text-left space-y-1">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-extrabold text-[#107569] border border-emerald-200">
                <FontAwesomeIcon icon={faVideo} className="size-3 mr-1" />
                Video Preview
              </span>
              <span className="text-xs text-slate-400 font-mono">ID: {previewVideo?.id}</span>
            </div>
            <DialogTitle className="text-lg font-bold text-slate-900">
              {previewVideo?.title || 'Marketing Video'}
            </DialogTitle>
            {previewVideo?.subtitle && (
              <DialogDescription className="text-xs text-slate-500">
                {previewVideo.subtitle}
              </DialogDescription>
            )}
          </DialogHeader>

          <div className="mt-3 space-y-4">
            {/* HTML5 Video Player */}
            <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black border border-slate-200 flex items-center justify-center">
              {previewVideo?.videoUrl ? (
                <video
                  src={previewVideo.videoUrl}
                  poster={previewVideo.thumbnailUrl}
                  controls
                  autoPlay
                  className="size-full object-contain"
                >
                  Your browser does not support HTML5 video playback.
                </video>
              ) : (
                <div className="text-center p-6 text-slate-400">
                  <FontAwesomeIcon icon={faVideo} className="size-10 mb-2 opacity-50" />
                  <p className="text-sm">No valid video playback URL available.</p>
                </div>
              )}
            </div>

            {/* Video Metadata Box */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-xs">
              <div>
                <p className="text-slate-400 font-medium">Priority</p>
                <p className="font-bold text-slate-800 mt-0.5">Level {previewVideo?.priority ?? 0}</p>
              </div>
              <div>
                <p className="text-slate-400 font-medium">View Count</p>
                <p className="font-bold text-slate-800 mt-0.5">
                  {Number(previewVideo?.views ?? previewVideo?.viewCount ?? 0).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-slate-400 font-medium">Status</p>
                <p className="font-bold text-slate-800 mt-0.5">{previewVideo?.status || 'ACTIVE'}</p>
              </div>
              <div>
                <p className="text-slate-400 font-medium">Published</p>
                <p className="font-bold text-emerald-700 mt-0.5">
                  {previewVideo?.isPublished ? 'Yes (Visible in App)' : 'No (Draft)'}
                </p>
              </div>
            </div>

            {previewVideo?.description && (
              <div className="rounded-xl border border-slate-100 p-3 bg-white text-xs text-slate-600">
                <p className="font-semibold text-slate-800 mb-1">Description</p>
                <p className="leading-relaxed whitespace-pre-wrap">{previewVideo.description}</p>
              </div>
            )}

            {previewVideo?.videoUrl && (
              <div className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs">
                <span className="truncate text-slate-500 font-mono text-[11px]">{previewVideo.videoUrl}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(previewVideo.videoUrl, 'Video link')}
                  className="shrink-0 h-7 text-xs font-semibold text-[#107569] border-emerald-200 hover:bg-emerald-50 rounded-lg"
                >
                  <FontAwesomeIcon icon={faCopy} className="size-3 mr-1" />
                  <span>Copy Link</span>
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── 7. Add / Edit SlideOver Drawer ─────────────────────────────────── */}
      <SlideOverDrawer
        open={isFormOpen}
        onClose={() => !formBusy && setIsFormOpen(false)}
        title={editingVideo ? 'Edit Marketing Video' : 'Add Marketing Video'}
        description="Configure video details, thumbnail media, priority hierarchy, and app publication status."
        size="lg"
        footer={
          <div className="flex items-center justify-end gap-2.5">
            <Button
              variant="outline"
              type="button"
              disabled={formBusy}
              onClick={() => setIsFormOpen(false)}
              className="rounded-xl border-slate-200 text-xs font-semibold text-slate-700"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={formBusy}
              onClick={handleSaveVideo}
              className="rounded-xl bg-[#107569] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#0e6359]"
            >
              {formBusy ? (
                <>
                  <FontAwesomeIcon icon={faRotate} className="size-3 mr-1.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{editingVideo ? 'Save Changes' : 'Create Video'}</span>
              )}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSaveVideo} className="space-y-5 text-sm">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Video Title <span className="text-rose-500">*</span>
            </label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g., QuickBoom Enterprise Overview 2026"
              className="mt-1 h-10 rounded-xl border-slate-200 text-sm focus:border-[#107569]"
              required
            />
          </div>

          {/* Subtitle */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Subtitle / Tagline (Optional)
            </label>
            <Input
              value={form.subtitle}
              onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
              placeholder="e.g., Discover modern CRM and automated pipeline management"
              className="mt-1 h-10 rounded-xl border-slate-200 text-sm focus:border-[#107569]"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Description (Optional)
            </label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe the marketing campaign, target customer segment, or featured capabilities..."
              className="mt-1 min-h-[90px] rounded-xl border-slate-200 text-sm focus:border-[#107569]"
            />
          </div>

          {/* Video Source Switcher */}
          <div className="rounded-2xl border border-slate-200/90 bg-slate-50/60 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-[#163A2E]">
                Video Media Source <span className="text-rose-500">*</span>
              </label>
              <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setVideoMode('URL')}
                  className={`rounded-md px-2.5 py-1 font-semibold transition ${
                    videoMode === 'URL' ? 'bg-[#107569] text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FontAwesomeIcon icon={faLink} className="size-2.5 mr-1" />
                  URL
                </button>
                <button
                  type="button"
                  onClick={() => setVideoMode('FILE')}
                  className={`rounded-md px-2.5 py-1 font-semibold transition ${
                    videoMode === 'FILE' ? 'bg-[#107569] text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FontAwesomeIcon icon={faUpload} className="size-2.5 mr-1" />
                  File Upload
                </button>
              </div>
            </div>

            {videoMode === 'URL' ? (
              <div>
                <Input
                  value={form.videoUrl}
                  onChange={(e) => {
                    setForm({ ...form, videoUrl: e.target.value });
                    setVideoPreviewUrl(e.target.value);
                  }}
                  placeholder="https://cdn.example.com/videos/promo-hd.mp4"
                  className="h-10 rounded-xl border-slate-200 bg-white text-sm"
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  Accepts direct MP4, WebM, or HLS stream links, or S3 presigned URLs.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-white p-4 text-center transition hover:border-[#107569]">
                  <FontAwesomeIcon icon={faUpload} className="size-6 text-[#107569] mb-1" />
                  <span className="text-xs font-semibold text-slate-700">
                    {videoFile ? videoFile.name : 'Click to select or drag video file'}
                  </span>
                  <span className="text-[11px] text-slate-400 mt-0.5">MP4, MOV, WebM up to 100MB</span>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setVideoFile(file);
                        setVideoPreviewUrl(URL.createObjectURL(file));
                      }
                    }}
                    className="hidden"
                  />
                </label>
              </div>
            )}

            {/* Video preview player inside drawer */}
            {videoPreviewUrl && (
              <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black border border-slate-200">
                <video src={videoPreviewUrl} controls className="size-full object-contain" />
              </div>
            )}
          </div>

          {/* Thumbnail Source Switcher */}
          <div className="rounded-2xl border border-slate-200/90 bg-slate-50/60 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-[#163A2E]">
                Thumbnail Poster Media (Optional)
              </label>
              <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setThumbMode('URL')}
                  className={`rounded-md px-2.5 py-1 font-semibold transition ${
                    thumbMode === 'URL' ? 'bg-[#107569] text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FontAwesomeIcon icon={faLink} className="size-2.5 mr-1" />
                  URL
                </button>
                <button
                  type="button"
                  onClick={() => setThumbMode('FILE')}
                  className={`rounded-md px-2.5 py-1 font-semibold transition ${
                    thumbMode === 'FILE' ? 'bg-[#107569] text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FontAwesomeIcon icon={faUpload} className="size-2.5 mr-1" />
                  Upload
                </button>
              </div>
            </div>

            {thumbMode === 'URL' ? (
              <div>
                <Input
                  value={form.thumbnailUrl}
                  onChange={(e) => {
                    setForm({ ...form, thumbnailUrl: e.target.value });
                    setThumbPreviewUrl(e.target.value);
                  }}
                  placeholder="https://cdn.example.com/thumbnails/promo-cover.jpg"
                  className="h-10 rounded-xl border-slate-200 bg-white text-sm"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-white p-4 text-center transition hover:border-[#107569]">
                  <FontAwesomeIcon icon={faUpload} className="size-6 text-[#107569] mb-1" />
                  <span className="text-xs font-semibold text-slate-700">
                    {thumbFile ? thumbFile.name : 'Click to select or drag thumbnail image'}
                  </span>
                  <span className="text-[11px] text-slate-400 mt-0.5">JPG, PNG, WebP up to 10MB</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setThumbFile(file);
                        setThumbPreviewUrl(URL.createObjectURL(file));
                      }
                    }}
                    className="hidden"
                  />
                </label>
              </div>
            )}

            {/* Thumbnail Preview */}
            {thumbPreviewUrl && (
              <div className="relative h-28 w-48 overflow-hidden rounded-xl border border-slate-200 bg-slate-900">
                <img src={thumbPreviewUrl} alt="Thumbnail preview" className="size-full object-cover" />
              </div>
            )}
          </div>

          {/* Priority & Status Row */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Display Priority
              </label>
              <Input
                type="number"
                min="0"
                max="1000"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="mt-1 h-10 rounded-xl border-slate-200 text-sm focus:border-[#107569]"
              />
              <p className="mt-1 text-[11px] text-slate-400">Higher numbers appear earlier in feeds.</p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Status
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 focus:border-[#107569] focus:outline-none"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="DRAFT">DRAFT</option>
                <option value="INACTIVE">INACTIVE</option>
                <option value="EXPIRED">EXPIRED</option>
              </select>
            </div>
          </div>

          {/* Published Toggle */}
          <div className="flex items-center justify-between rounded-xl border border-slate-200 p-3.5 bg-slate-50/50">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#163A2E]">Publish to App Feed</p>
              <p className="text-xs text-slate-500">When enabled, this video is immediately visible to mobile users.</p>
            </div>
            <button
              type="button"
              onClick={() => setForm({ ...form, isPublished: !form.isPublished })}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                form.isPublished ? 'bg-[#107569]' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow ring-0 transition ${
                  form.isPublished ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </form>
      </SlideOverDrawer>

      {/* ── 8. Delete Confirmation Dialog (No window.confirm!) ─────────────── */}
      <ConfirmDialog
        open={Boolean(deletingVideo)}
        onOpenChange={(open) => !open && setDeletingVideo(null)}
        title="Delete Marketing Video"
        description={`Are you sure you want to permanently delete "${deletingVideo?.title || 'this video'}"? This action cannot be undone.`}
        confirmLabel={deleteBusy ? 'Deleting...' : 'Delete Video'}
        variant="destructive"
        loading={deleteBusy}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
