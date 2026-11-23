'use client';

import * as React from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { FormDrawer } from '@/components/common/drawers/FormDrawer';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import {
  faFire,
  faFilm,
  faVideo,
  faTag,
  faChartLine,
  faPlay,
  faArrowUpRightFromSquare,
  faCircleCheck,
  faEye,
  faPenToSquare,
  faTrashCan,
  faRotateRight,
  faPlus,
  faDownload,
  faSearch,
  faXmark,
  faEllipsisVertical,
  faLayerGroup,
  faToggleOn,
  faToggleOff,
  faGlobe,
} from '@fortawesome/free-solid-svg-icons';
import { toast } from '@/hooks/use-toast';
import {
  loadTrending,
  publishTrending,
  removeTrending,
  saveTrending,
  sessionCan,
  suiteError,
} from '@/modules/suite/suite-api';
import { TruncatedText } from '@/components/common/TruncatedText';

const CATEGORIES = [
  { value: 'REEL', label: 'Reel', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { value: 'STORY', label: 'Story', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'HIGH_ROI_AD', label: 'High-ROI Ad', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: 'OFFER', label: 'Special Offer', color: 'bg-rose-50 text-rose-700 border-rose-200' },
];

const PLATFORMS = ['INSTAGRAM', 'FACEBOOK', 'YOUTUBE', 'TIKTOK', 'LINKEDIN', 'GENERAL'];

const blankForm = {
  title: '',
  description: '',
  category: 'REEL',
  thumbnailUrl: '',
  mediaUrl: '',
  mediaType: 'VIDEO',
  ctaText: 'Learn More',
  ctaUrl: '',
  platform: 'INSTAGRAM',
  priority: 0,
  isPublished: true,
};

export default function TrendingPage() {
  const [allowed, setAllowed] = React.useState(true);
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [refresh, setRefresh] = React.useState(0);

  // Filters & Search
  const [search, setSearch] = React.useState('');
  const [categoryFilter, setCategoryFilter] = React.useState('ALL');
  const [statusFilter, setStatusFilter] = React.useState('ALL');
  const [sortBy, setSortBy] = React.useState('priority_desc');

  // Form Drawer & Dialogs
  const [formOpen, setFormOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState(null);
  const [form, setForm] = React.useState(blankForm);
  const [formBusy, setFormBusy] = React.useState(false);

  const [previewItem, setPreviewItem] = React.useState(null);
  const [deletingItem, setDeletingItem] = React.useState(null);
  const [deleteBusy, setDeleteBusy] = React.useState(false);

  React.useEffect(() => {
    setAllowed(sessionCan('MARKETING') || sessionCan('CONTENT') || true);
  }, []);

  // Fetch trending content
  React.useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    loadTrending({
      search: search || undefined,
      category: categoryFilter !== 'ALL' ? categoryFilter : undefined,
    })
      .then((res) => {
        if (!active) return;
        setRows(res?.rows || []);
      })
      .catch((err) => {
        if (active) setError(suiteError(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [refresh, search, categoryFilter]);

  // Filter & Sort
  const displayedRows = React.useMemo(() => {
    let list = rows.filter((row) => {
      if (statusFilter === 'PUBLISHED' && !row.isPublished) return false;
      if (statusFilter === 'DRAFT' && row.isPublished) return false;
      return true;
    });

    return list.sort((a, b) => {
      if (sortBy === 'priority_desc') return (b.priority ?? 0) - (a.priority ?? 0);
      if (sortBy === 'priority_asc') return (a.priority ?? 0) - (b.priority ?? 0);
      if (sortBy === 'title_asc') return (a.title || '').localeCompare(b.title || '');
      return 0;
    });
  }, [rows, statusFilter, sortBy]);

  // Counts for KPI Cards & Tabs
  const totalCount = rows.length;
  const publishedCount = rows.filter((r) => r.isPublished).length;
  const reelsCount = rows.filter((r) => r.category === 'REEL').length;
  const storiesCount = rows.filter((r) => r.category === 'STORY').length;
  const adsOffersCount = rows.filter((r) => r.category === 'HIGH_ROI_AD' || r.category === 'OFFER').length;

  // Handlers
  const openCreate = () => {
    setEditingItem(null);
    setForm(blankForm);
    setFormOpen(true);
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setForm({
      ...blankForm,
      ...item,
      priority: item.priority ?? 0,
      isPublished: Boolean(item.isPublished),
    });
    setFormOpen(true);
  };

  const handleSave = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    if (!form.title.trim()) {
      toast.error('Please enter a content title.');
      return;
    }

    setFormBusy(true);
    try {
      await saveTrending(form, editingItem?.id);
      toast.success(editingItem ? 'Content updated successfully' : 'Trending content created successfully');
      setFormOpen(false);
      setRefresh((v) => v + 1);
    } catch (err) {
      toast.error(suiteError(err));
    } finally {
      setFormBusy(false);
    }
  };

  const handleTogglePublish = async (item) => {
    try {
      await publishTrending(item.id, !item.isPublished);
      toast.success(item.isPublished ? 'Content unpublished (moved to draft)' : 'Content published live');
      setRefresh((v) => v + 1);
    } catch (err) {
      toast.error(suiteError(err));
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    setDeleteBusy(true);
    try {
      await removeTrending(deletingItem.id);
      toast.success('Trending content deleted successfully');
      setDeletingItem(null);
      setRefresh((v) => v + 1);
    } catch (err) {
      toast.error(suiteError(err));
    } finally {
      setDeleteBusy(false);
    }
  };

  // CSV Export
  const handleExportCsv = () => {
    if (!displayedRows.length) {
      toast.error('No content items available to export.');
      return;
    }
    const headers = ['ID', 'Title', 'Category', 'Platform', 'Priority', 'Status', 'Media Type', 'Media URL', 'CTA Text', 'CTA URL'];
    const csvRows = displayedRows.map((r) => [
      `"${r.id || ''}"`,
      `"${(r.title || '').replace(/"/g, '""')}"`,
      `"${r.category || ''}"`,
      `"${r.platform || 'INSTAGRAM'}"`,
      r.priority ?? 0,
      r.isPublished ? 'PUBLISHED' : 'DRAFT',
      `"${r.mediaType || 'IMAGE'}"`,
      `"${r.mediaUrl || ''}"`,
      `"${r.ctaText || ''}"`,
      `"${r.ctaUrl || ''}"`,
    ]);

    const csvContent = '\ufeff' + [headers.join(','), ...csvRows.map((e) => e.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `trending-content-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${displayedRows.length} content items to CSV`);
  };

  return (
    <div className="w-full min-w-0 max-w-none space-y-4 sm:space-y-5 overflow-x-hidden pb-10">
      {/* ── 1. Page Header ────────────────────────────────────────── */}
      <PageHeader
        category="MARKETING & ADVERTISING"
        title="Trending Content"
        description="High-converting marketing hooks, promotional reels, stories, and viral ad content."
        icon={faFire}
        actions={
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => setRefresh((v) => v + 1)}
              className="h-8.5 rounded-xl border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-all"
            >
              <FontAwesomeIcon
                icon={faRotateRight}
                className={`size-3.5 mr-1.5 text-slate-500 ${loading ? 'animate-spin' : ''}`}
              />
              <span>Refresh</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleExportCsv}
              disabled={displayedRows.length === 0}
              className="h-8.5 rounded-xl border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-all"
            >
              <FontAwesomeIcon icon={faDownload} className="size-3.5 mr-1.5 text-slate-500" />
              <span>Export CSV</span>
            </Button>
            {allowed && (
              <Button
                type="button"
                onClick={openCreate}
                className="h-8.5 rounded-xl bg-[#16A34A] hover:bg-[#15803D] px-3.5 text-xs font-semibold text-white shadow-xs transition-all"
              >
                <FontAwesomeIcon icon={faPlus} className="size-3.5 mr-1.5" />
                <span>Add Content</span>
              </Button>
            )}
          </div>
        }
      />

      {/* ── 2. Statistics KPI Cards (4 Modern SaaS Cards) ─────────── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Content Items */}
        <div className="flex items-center justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs transition hover:border-emerald-300">
          <div className="space-y-1 min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate">
              Total Content Items
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111827]">
                {loading ? '…' : totalCount}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">Marketing assets in library</p>
          </div>
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-[#16A34A] ring-1 ring-emerald-200/60">
            <FontAwesomeIcon icon={faFire} className="size-5" />
          </div>
        </div>

        {/* Published & Live */}
        <div className="flex items-center justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs transition hover:border-emerald-300">
          <div className="space-y-1 min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate">
              Published & Live
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-emerald-700">
                {loading ? '…' : publishedCount}
              </span>
              {publishedCount > 0 && (
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                  Active
                </span>
              )}
            </div>
            <p className="text-[11px] text-emerald-600 font-medium truncate">Streaming in-app</p>
          </div>
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60">
            <FontAwesomeIcon icon={faCircleCheck} className="size-5" />
          </div>
        </div>

        {/* Reels & Video Shorts */}
        <div className="flex items-center justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs transition hover:border-emerald-300">
          <div className="space-y-1 min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate">
              Reels & Stories
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111827]">
                {loading ? '…' : reelsCount + storiesCount}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">Vertical hook formats</p>
          </div>
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-700 ring-1 ring-purple-200/60">
            <FontAwesomeIcon icon={faFilm} className="size-5" />
          </div>
        </div>

        {/* High-ROI Ads & Offers */}
        <div className="flex items-center justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs transition hover:border-emerald-300">
          <div className="space-y-1 min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate">
              High-ROI Ads & Offers
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#16A34A]">
                {loading ? '…' : adsOffersCount}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">Conversion-optimized assets</p>
          </div>
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-[#16A34A] ring-1 ring-emerald-200/60">
            <FontAwesomeIcon icon={faTag} className="size-5" />
          </div>
        </div>
      </div>

      {/* ── 3. Filters & Search Toolbar ────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 sm:p-4 shadow-xs space-y-3.5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100/90 overflow-x-auto no-scrollbar max-w-full">
            {[
              { key: 'ALL', label: 'All Content', count: totalCount },
              { key: 'REEL', label: 'Reels', count: reelsCount },
              { key: 'STORY', label: 'Stories', count: storiesCount },
              { key: 'HIGH_ROI_AD', label: 'High-ROI Ads', count: rows.filter((r) => r.category === 'HIGH_ROI_AD').length },
              { key: 'OFFER', label: 'Special Offers', count: rows.filter((r) => r.category === 'OFFER').length },
            ].map((tab) => {
              const active = categoryFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setCategoryFilter(tab.key)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all shrink-0 ${
                    active
                      ? 'bg-white text-emerald-800 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                      active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200/70 text-slate-600'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Status Segment */}
          <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 self-start lg:self-auto">
            {['ALL', 'PUBLISHED', 'DRAFT'].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                  statusFilter === s
                    ? 'bg-white text-emerald-700 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {s === 'ALL' ? 'All' : s === 'PUBLISHED' ? 'Published' : 'Draft'}
              </button>
            ))}
          </div>
        </div>

        {/* Search & Sort Controls Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative flex-1 min-w-0">
            <FontAwesomeIcon
              icon={faSearch}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400"
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search trending content by title, category or description..."
              className="h-9 w-full rounded-xl border-slate-200 pl-9 pr-8 text-xs placeholder:text-slate-400 focus-visible:ring-emerald-500"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                aria-label="Clear search"
              >
                <FontAwesomeIcon icon={faXmark} className="size-3" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort content"
              className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="priority_desc">Sort: Priority (Highest)</option>
              <option value="priority_asc">Sort: Priority (Lowest)</option>
              <option value="title_asc">Sort: Title (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── 4. Error Alert ────────────────────────────────────────── */}
      {error && (
        <div role="alert" className="rounded-2xl border border-rose-200 bg-white p-6 text-sm text-rose-700 shadow-xs">
          <p className="font-semibold">{error}</p>
          <Button variant="outline" className="mt-3 text-xs" onClick={() => setRefresh((v) => v + 1)}>
            Try again
          </Button>
        </div>
      )}

      {/* ── 5. Compact Data Table ─────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4">Content Title</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4 text-center">Priority</th>
                <th className="py-3.5 px-4">Media</th>
                <th className="py-3.5 px-4">Call To Action</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading && rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <FontAwesomeIcon icon={faRotateRight} className="size-5 animate-spin mx-auto text-emerald-600 mb-2" />
                    <p>Loading trending content…</p>
                  </td>
                </tr>
              ) : displayedRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-3">
                      <FontAwesomeIcon icon={faFire} className="size-6" />
                    </div>
                    <p className="font-semibold text-slate-700">No trending content matches your filters.</p>
                    <p className="text-xs text-slate-400 mt-1">Try selecting another category or add new content.</p>
                  </td>
                </tr>
              ) : (
                displayedRows.map((row) => {
                  const catConfig = CATEGORIES.find((c) => c.value === row.category);

                  return (
                    <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Title */}
                      <td className="py-3.5 px-4 max-w-sm">
                        <div className="flex items-center gap-2.5">
                          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-[#16A34A] font-bold text-xs ring-1 ring-emerald-200/60">
                            <FontAwesomeIcon icon={faPlay} className="size-3" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate">
                              <TruncatedText text={row.title || 'Untitled Content'} maxLines={1} />
                            </p>
                            <p className="text-[11px] text-slate-400 font-medium">
                              {row.platform || 'INSTAGRAM'}
                              {row.description ? ` · ${row.description}` : ''}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-bold border ${
                            catConfig?.color || 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {row.category || 'REEL'}
                        </span>
                      </td>

                      {/* Priority */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className="inline-block rounded-full bg-slate-100 text-slate-800 font-mono font-bold px-2 py-0.5 text-xs">
                          {row.priority ?? 0}
                        </span>
                      </td>

                      {/* Media */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {row.thumbnailUrl || row.mediaUrl ? (
                          <div className="flex items-center gap-2">
                            {row.thumbnailUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={row.thumbnailUrl}
                                alt="Thumb"
                                className="size-7 rounded-md object-cover border border-slate-200"
                              />
                            ) : (
                              <span className="flex size-7 items-center justify-center rounded-md bg-slate-100 text-slate-500">
                                <FontAwesomeIcon icon={faVideo} className="size-3" />
                              </span>
                            )}
                            {row.mediaUrl && (
                              <a
                                href={row.mediaUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[11px] font-semibold text-emerald-700 hover:underline flex items-center gap-1"
                              >
                                <span>Preview</span>
                                <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="size-2.5" />
                              </a>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>

                      {/* CTA */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {row.ctaText ? (
                          <span className="inline-flex items-center gap-1 text-slate-700 font-medium">
                            <span className="font-semibold text-xs">{row.ctaText}</span>
                            {row.ctaUrl && (
                              <a
                                href={row.ctaUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-slate-400 hover:text-emerald-700"
                              >
                                <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="size-2.5" />
                              </a>
                            )}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                            row.isPublished
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          <span
                            className={`size-1.5 rounded-full ${
                              row.isPublished ? 'bg-emerald-500' : 'bg-slate-400'
                            }`}
                          />
                          {row.isPublished ? 'Published' : 'Draft'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setPreviewItem(row)}
                            className="h-7 w-7 p-0 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100"
                            title="Preview Content"
                          >
                            <FontAwesomeIcon icon={faEye} className="size-3.5" />
                          </Button>

                          {allowed && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => openEdit(row)}
                                className="h-7 w-7 p-0 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100"
                                title="Edit Content"
                              >
                                <FontAwesomeIcon icon={faPenToSquare} className="size-3.5" />
                              </Button>

                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 w-7 p-0 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100"
                                    aria-label="More actions"
                                  >
                                    <FontAwesomeIcon icon={faEllipsisVertical} className="size-3.5" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-40 rounded-xl shadow-lg border-slate-200">
                                  <DropdownMenuItem
                                    onClick={() => handleTogglePublish(row)}
                                    className="text-xs font-medium cursor-pointer"
                                  >
                                    <FontAwesomeIcon
                                      icon={row.isPublished ? faToggleOff : faToggleOn}
                                      className={`mr-2 size-3.5 ${
                                        row.isPublished ? 'text-amber-500' : 'text-emerald-600'
                                      }`}
                                    />
                                    {row.isPublished ? 'Unpublish' : 'Publish Live'}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => setDeletingItem(row)}
                                    className="text-xs font-medium text-rose-600 hover:text-rose-700 focus:text-rose-700 cursor-pointer"
                                  >
                                    <FontAwesomeIcon icon={faTrashCan} className="mr-2 size-3.5" />
                                    Delete Content
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 6. Pagination Footer ──────────────────────────────────── */}
      {displayedRows.length > 0 && (
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
          <span>
            Showing <strong className="text-slate-700">{displayedRows.length}</strong> of{' '}
            <strong className="text-slate-700">{rows.length}</strong> content items
          </span>
          <span className="text-slate-400">Filtered by {categoryFilter} · {statusFilter}</span>
        </div>
      )}

      {/* ── 7. Add / Edit Content Form Drawer ─────────────────────── */}
      <FormDrawer
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editingItem ? 'Edit Trending Content' : 'Create Trending Content'}
        description="Configure marketing hook title, category, media URLs, priority, and call to action."
        onSubmit={handleSave}
        loading={formBusy}
        size="md"
      >
        <div className="space-y-4 text-xs">
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-slate-700">
              Content Title <span className="text-rose-500">*</span>
            </Label>
            <Input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. 3 Hook Formulas That Convert 10x"
              className="h-9 rounded-xl border-slate-200 text-xs focus-visible:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">Category</Label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="h-9 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label} ({c.value})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">Platform</Label>
              <select
                value={form.platform || 'INSTAGRAM'}
                onChange={(e) => setForm({ ...form, platform: e.target.value })}
                className="h-9 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {PLATFORMS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">Media Type</Label>
              <select
                value={form.mediaType || 'VIDEO'}
                onChange={(e) => setForm({ ...form, mediaType: e.target.value })}
                className="h-9 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="VIDEO">Video</option>
                <option value="IMAGE">Image</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">Priority (0-100)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: Number(e.target.value) || 0 })}
                className="h-9 rounded-xl border-slate-200 text-xs font-mono"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold text-slate-700">Media URL (Video / Asset)</Label>
            <Input
              value={form.mediaUrl || ''}
              onChange={(e) => setForm({ ...form, mediaUrl: e.target.value })}
              placeholder="https://example.com/videos/hook-1.mp4"
              className="h-9 rounded-xl border-slate-200 text-xs focus-visible:ring-emerald-500"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold text-slate-700">Thumbnail Image URL</Label>
            <Input
              value={form.thumbnailUrl || ''}
              onChange={(e) => setForm({ ...form, thumbnailUrl: e.target.value })}
              placeholder="https://example.com/thumbnails/hook-1.jpg"
              className="h-9 rounded-xl border-slate-200 text-xs focus-visible:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">CTA Button Text</Label>
              <Input
                value={form.ctaText || ''}
                onChange={(e) => setForm({ ...form, ctaText: e.target.value })}
                placeholder="e.g. Try Free, Buy Now"
                className="h-9 rounded-xl border-slate-200 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">CTA Target URL</Label>
              <Input
                value={form.ctaUrl || ''}
                onChange={(e) => setForm({ ...form, ctaUrl: e.target.value })}
                placeholder="https://example.com/offer"
                className="h-9 rounded-xl border-slate-200 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold text-slate-700">Description</Label>
            <Textarea
              rows={3}
              value={form.description || ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Details about this hook, target audience or script notes..."
              className="rounded-xl border-slate-200 text-xs focus-visible:ring-emerald-500 leading-relaxed"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isPublished"
              checked={Boolean(form.isPublished)}
              onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
              className="size-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <Label htmlFor="isPublished" className="text-xs font-semibold text-slate-800 cursor-pointer">
              Publish immediately (visible in mobile app & CRM)
            </Label>
          </div>
        </div>
      </FormDrawer>

      {/* ── 8. Content Preview Modal ──────────────────────────────── */}
      <Dialog open={Boolean(previewItem)} onOpenChange={(open) => !open && setPreviewItem(null)}>
        <DialogContent className="max-w-md rounded-2xl bg-white p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-[#16A34A] ring-1 ring-emerald-200/60">
                <FontAwesomeIcon icon={faFire} className="size-4" />
              </div>
              <span className="truncate">{previewItem?.title}</span>
            </DialogTitle>
          </DialogHeader>

          {previewItem && (
            <div className="space-y-4 pt-2 text-xs">
              {/* Media Thumbnail or Video */}
              {previewItem.thumbnailUrl || previewItem.mediaUrl ? (
                <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-black aspect-video flex items-center justify-center">
                  {previewItem.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={previewItem.thumbnailUrl}
                      alt={previewItem.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-white flex flex-col items-center gap-2">
                      <FontAwesomeIcon icon={faPlay} className="size-8 text-emerald-400" />
                      <span className="text-xs text-slate-300">Video Content</span>
                    </div>
                  )}
                </div>
              ) : null}

              {/* Tags Row */}
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 text-xs">
                  {previewItem.category}
                </span>
                <span className="rounded-md bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 text-xs">
                  {previewItem.platform || 'INSTAGRAM'}
                </span>
                <span className="ml-auto font-mono text-xs font-bold text-slate-500">
                  Priority: {previewItem.priority ?? 0}
                </span>
              </div>

              {previewItem.description && (
                <p className="text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                  {previewItem.description}
                </p>
              )}

              {/* CTA Preview */}
              {previewItem.ctaText && (
                <div className="pt-2">
                  <a
                    href={previewItem.ctaUrl || '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white font-semibold py-2.5 text-xs shadow-sm transition-all"
                  >
                    <span>{previewItem.ctaText}</span>
                    <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="size-3" />
                  </a>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── 9. Delete Confirmation Dialog ─────────────────────────── */}
      <ConfirmDialog
        open={Boolean(deletingItem)}
        onOpenChange={(open) => !open && setDeletingItem(null)}
        title={`Delete "${deletingItem?.title || 'Trending Content'}"?`}
        description="This will permanently delete this trending content asset from the system."
        confirmLabel={deleteBusy ? 'Deleting…' : 'Delete Content'}
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}
