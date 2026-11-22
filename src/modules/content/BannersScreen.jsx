'use client';

import * as React from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/common/Badge';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import {
  faImage,
  faPlus,
  faDownload,
  faRotate,
  faSearch,
  faFilter,
  faCheckCircle,
  faBan,
  faClock,
  faEye,
  faPenToSquare,
  faTrashCan,
  faChevronLeft,
  faChevronRight,
  faXmark,
  faPowerOff,
  faArrowUpRightFromSquare,
  faUpload,
  faLink,
  faSliders,
  faCalendarCheck,
  faCircleExclamation,
} from '@fortawesome/free-solid-svg-icons';
import { toast } from '@/hooks/use-toast';
import {
  loadBanners,
  loadBannerStats,
  getBanner,
  saveBanner,
  setBannerStatus,
  removeBanner,
  sessionCan,
  suiteError,
} from '@/modules/suite/suite-api';

const DEFAULT_COLUMNS = {
  checkbox: true,
  image: true,
  title: true,
  targetUrl: true,
  priority: true,
  validity: true,
  status: true,
  updatedAt: true,
  actions: true,
};

const initialFormData = {
  title: '',
  subtitle: '',
  description: '',
  imageUrl: '',
  ctaText: '',
  ctaUrl: '',
  actionType: 'NAVIGATE_URL',
  priority: 0,
  isActive: true,
  isPublished: true,
  startDate: '',
  endDate: '',
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

function formatRelativeTime(val) {
  if (!val) return 'Never';
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return 'Never';
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHr / 24);

    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  } catch {
    return 'Recently';
  }
}

export function BannersScreen() {
  const [canManage, setCanManage] = React.useState(true);

  // Statistics
  const [stats, setStats] = React.useState({ total: 0, active: 0, inactive: 0, lastUpdated: null });
  const [statsLoading, setStatsLoading] = React.useState(true);

  // Filters
  const [activeTab, setActiveTab] = React.useState('ALL'); // ALL, ACTIVE, INACTIVE
  const [search, setSearch] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('ALL');

  // Listing & Pagination
  const [banners, setBanners] = React.useState([]);
  const [pagination, setPagination] = React.useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(10);
  const [loading, setLoading] = React.useState(true);
  const [refreshKey, setRefreshKey] = React.useState(0);

  // Selection
  const [selectedIds, setSelectedIds] = React.useState(new Set());

  // Columns visibility
  const [columns, setColumns] = React.useState(DEFAULT_COLUMNS);
  const [showColPicker, setShowColPicker] = React.useState(false);

  // Form / Modal state
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingBanner, setEditingBanner] = React.useState(null);
  const [form, setForm] = React.useState(initialFormData);
  const [imageMode, setImageMode] = React.useState('FILE'); // 'FILE' | 'URL'
  const [selectedFile, setSelectedFile] = React.useState(null);
  const [previewUrl, setPreviewUrl] = React.useState('');
  const [formBusy, setFormBusy] = React.useState(false);
  const fileInputRef = React.useRef(null);

  // View Details Modal
  const [viewBanner, setViewBanner] = React.useState(null);
  const [viewLoading, setViewLoading] = React.useState(false);

  // Delete Confirmation
  const [deletingBanner, setDeletingBanner] = React.useState(null);
  const [deleteBusy, setDeleteBusy] = React.useState(false);

  // Check permissions on mount
  React.useEffect(() => {
    try {
      const allowed = sessionCan('MARKETING') || sessionCan('CONTENT');
      setCanManage(allowed !== false);
    } catch {
      setCanManage(true);
    }
  }, []);

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Sync tab with statusFilter
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'ALL') setStatusFilter('ALL');
    else if (tab === 'ACTIVE') setStatusFilter('ACTIVE');
    else if (tab === 'INACTIVE') setStatusFilter('INACTIVE');
    setPage(1);
  };

  // Fetch Stats
  const fetchStats = React.useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await loadBannerStats();
      if (res && typeof res.total === 'number') {
        setStats({
          total: res.total || 0,
          active: res.active || 0,
          inactive: res.inactive || 0,
          lastUpdated: res.lastUpdated || null,
        });
      }
    } catch (err) {
      console.warn('Failed to load banner stats from endpoint, using calculated values', err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Fetch Banners
  const fetchBanners = React.useCallback(async () => {
    setLoading(true);
    try {
      const query = {
        page,
        limit,
        search: debouncedSearch.trim() || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
      };

      const res = await loadBanners(query);
      const items = Array.isArray(res?.items)
        ? res.items
        : Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
        ? res
        : [];

      setBanners(items);
      setPagination({
        page: res?.page || res?.currentPage || page,
        limit: res?.limit || limit,
        total: typeof res?.total === 'number' ? res.total : items.length,
        totalPages: res?.totalPages || Math.max(1, Math.ceil((res?.total || items.length) / limit)),
      });

      // Fallback stats computation if needed
      setStats((prev) => {
        if (prev.total === 0 && items.length > 0) {
          const activeCount = items.filter((b) => b.isActive).length;
          return {
            total: items.length,
            active: activeCount,
            inactive: items.length - activeCount,
            lastUpdated: items[0]?.updatedAt || items[0]?.createdAt || null,
          };
        }
        return prev;
      });
    } catch (err) {
      toast.error(suiteError(err) || 'Failed to load banners.');
      setBanners([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, statusFilter]);

  React.useEffect(() => {
    fetchStats();
  }, [fetchStats, refreshKey]);

  React.useEffect(() => {
    fetchBanners();
  }, [fetchBanners, refreshKey]);

  // Clean up object URLs on unmount or file change
  React.useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Selection handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(new Set(banners.map((b) => b.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  // Toggle active status
  const handleToggleStatus = async (banner) => {
    if (!canManage) {
      toast.error('You do not have permission to modify banners.');
      return;
    }
    const newStatus = !banner.isActive;
    try {
      await setBannerStatus(banner.id, newStatus);
      toast.success(`Banner ${newStatus ? 'activated' : 'deactivated'} successfully.`);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(suiteError(err) || 'Failed to update banner status.');
    }
  };

  // Delete banner
  const handleDeleteConfirm = async () => {
    if (!deletingBanner) return;
    setDeleteBusy(true);
    try {
      await removeBanner(deletingBanner.id);
      toast.success('Banner deleted successfully.');
      setDeletingBanner(null);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(deletingBanner.id);
        return next;
      });
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(suiteError(err) || 'Failed to delete banner.');
    } finally {
      setDeleteBusy(false);
    }
  };

  // Open create form
  const handleOpenCreate = () => {
    setEditingBanner(null);
    setForm(initialFormData);
    setSelectedFile(null);
    setPreviewUrl('');
    setImageMode('FILE');
    setIsFormOpen(true);
  };

  // Open edit form
  const handleOpenEdit = (banner) => {
    setEditingBanner(banner);
    setForm({
      title: banner.title || '',
      subtitle: banner.subtitle || '',
      description: banner.description || '',
      imageUrl: banner.imageUrl || banner.image || '',
      ctaText: banner.ctaText || '',
      ctaUrl: banner.ctaUrl || '',
      actionType: banner.actionType || 'NAVIGATE_URL',
      priority: banner.priority ?? 0,
      isActive: banner.isActive !== false,
      isPublished: banner.isPublished !== false,
      startDate: banner.startAt ? String(banner.startAt).slice(0, 10) : '',
      endDate: banner.endAt ? String(banner.endAt).slice(0, 10) : '',
    });
    setSelectedFile(null);
    setPreviewUrl(banner.imageUrl || banner.image || '');
    setImageMode(banner.imageUrl || banner.image ? 'URL' : 'FILE');
    setIsFormOpen(true);
  };

  // Open view details
  const handleOpenView = async (banner) => {
    setViewBanner(banner);
    setViewLoading(true);
    try {
      const details = await getBanner(banner.id);
      if (details) setViewBanner(details);
    } catch {
      // Keep basic info
    } finally {
      setViewLoading(false);
    }
  };

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file (PNG, JPG, WebP, SVG).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image file size must be less than 10MB.');
      return;
    }

    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }

    const objectUrl = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreviewUrl(objectUrl);
  };

  const handleRemoveImage = () => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl('');
    setForm((prev) => ({ ...prev, imageUrl: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Save form
  const handleSaveBanner = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error('Banner title is required.');
      return;
    }

    if (!selectedFile && !form.imageUrl.trim() && !previewUrl) {
      toast.error('Please upload an image file or provide an image URL.');
      return;
    }

    if (form.startDate && form.endDate && new Date(form.startDate) > new Date(form.endDate)) {
      toast.error('End date must be on or after start date.');
      return;
    }

    setFormBusy(true);
    try {
      await saveBanner(form, editingBanner?.id, selectedFile);
      toast.success(editingBanner ? 'Banner updated successfully.' : 'Banner created successfully.');
      setIsFormOpen(false);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(suiteError(err) || 'Failed to save banner.');
    } finally {
      setFormBusy(false);
    }
  };

  // Export CSV
  const handleExportCsv = (selectedOnly = false) => {
    const listToExport = selectedOnly
      ? banners.filter((b) => selectedIds.has(b.id))
      : banners;

    if (!listToExport.length) {
      toast.error('No banners available to export.');
      return;
    }

    const headers = [
      'Banner ID',
      'Title',
      'Subtitle',
      'Image URL',
      'Destination URL',
      'CTA Button Text',
      'Priority',
      'Status',
      'Start Date',
      'End Date',
      'Created At',
      'Updated At',
    ];

    const escapeCsv = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;

    const rows = listToExport.map((b) => [
      b.id,
      b.title || 'Untitled',
      b.subtitle || '',
      b.imageUrl || b.image || '',
      b.ctaUrl || '',
      b.ctaText || '',
      b.priority ?? 0,
      b.isActive ? 'Active' : 'Inactive',
      formatDate(b.startAt || b.startDate),
      formatDate(b.endAt || b.endDate),
      formatDate(b.createdAt),
      formatDate(b.updatedAt),
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\ufeff' +
      [headers.map(escapeCsv).join(','), ...rows.map((r) => r.map(escapeCsv).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `banners_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${listToExport.length} banner(s) to CSV.`);
  };

  return (
    <div className="min-w-0 w-full max-w-full space-y-6 pb-12">
      {/* ── Page Header ────────────────────────────────────────────── */}
      <PageHeader
        category="CONTENT MANAGEMENT"
        title="Home Banners"
        icon={faImage}
        description="Create, manage, and display promotional banners on customer platforms."
        actions={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleExportCsv(false)}
              disabled={loading || !banners.length}
              className="border-slate-200 text-slate-700 hover:bg-slate-50 transition-all font-medium text-sm rounded-xl"
            >
              <FontAwesomeIcon icon={faDownload} className="mr-2 text-xs" />
              Export CSV
            </Button>
            {canManage && (
              <Button
                type="button"
                onClick={handleOpenCreate}
                className="bg-[#16A34A] hover:bg-[#15803D] text-white shadow-sm transition-all font-semibold text-sm rounded-xl"
              >
                <FontAwesomeIcon icon={faPlus} className="mr-2 text-xs" />
                Add Banner
              </Button>
            )}
          </div>
        }
      />

      {/* ── Statistics Cards Grid (4 KPI Cards) ────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Banners */}
        <div className="relative overflow-hidden rounded-2xl border border-[#E2E8E5] bg-white p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Banners
            </span>
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <FontAwesomeIcon icon={faImage} className="text-sm" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              {statsLoading ? '—' : stats.total}
            </span>
            <span className="text-xs text-slate-500 font-medium">banners created</span>
          </div>
        </div>

        {/* Active Banners */}
        <div className="relative overflow-hidden rounded-2xl border border-[#E2E8E5] bg-white p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Active Banners
            </span>
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
              <FontAwesomeIcon icon={faCheckCircle} className="text-sm" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-700 tracking-tight">
              {statsLoading ? '—' : stats.active}
            </span>
            <span className="text-xs text-emerald-600 font-medium">live on apps</span>
          </div>
        </div>

        {/* Inactive Banners */}
        <div className="relative overflow-hidden rounded-2xl border border-[#E2E8E5] bg-white p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Inactive Banners
            </span>
            <div className="flex size-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
              <FontAwesomeIcon icon={faBan} className="text-sm" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-700 tracking-tight">
              {statsLoading ? '—' : stats.inactive}
            </span>
            <span className="text-xs text-slate-500 font-medium">paused / archived</span>
          </div>
        </div>

        {/* Last Updated */}
        <div className="relative overflow-hidden rounded-2xl border border-[#E2E8E5] bg-white p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Last Updated
            </span>
            <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <FontAwesomeIcon icon={faClock} className="text-sm" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-lg font-bold text-slate-900 tracking-tight truncate">
              {statsLoading ? '—' : formatRelativeTime(stats.lastUpdated)}
            </span>
            {stats.lastUpdated && (
              <span className="text-xs text-slate-400 truncate">
                ({formatDate(stats.lastUpdated)})
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Status Tabs ────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => handleTabChange('ALL')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all ${
            activeTab === 'ALL'
              ? 'bg-[#16A34A] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <span>All Banners</span>
          <span
            className={`px-2 py-0.5 text-xs rounded-full ${
              activeTab === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {stats.total}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('ACTIVE')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all ${
            activeTab === 'ACTIVE'
              ? 'bg-[#16A34A] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <span>Active</span>
          <span
            className={`px-2 py-0.5 text-xs rounded-full ${
              activeTab === 'ACTIVE' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
            }`}
          >
            {stats.active}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('INACTIVE')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all ${
            activeTab === 'INACTIVE'
              ? 'bg-[#16A34A] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <span>Inactive</span>
          <span
            className={`px-2 py-0.5 text-xs rounded-full ${
              activeTab === 'INACTIVE' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {stats.inactive}
          </span>
        </button>
      </div>

      {/* ── Search & Filter Toolbar ────────────────────────────────── */}
      <div className="flex flex-col gap-3 rounded-2xl border border-[#E2E8E5] bg-white p-4 shadow-xs lg:flex-row lg:items-center lg:justify-between">
        {/* Left: Search Bar */}
        <div className="relative flex-1 min-w-[240px]">
          <FontAwesomeIcon
            icon={faSearch}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400"
          />
          <Input
            type="text"
            placeholder="Search by title, subtitle, or image URL..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-8 text-sm rounded-xl border-slate-200 focus:border-[#16A34A] focus:ring-[#16A34A]"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
          )}
        </div>

        {/* Right: Status Filter, Column Picker, Refresh */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Dropdown */}
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-xs">
            <FontAwesomeIcon icon={faFilter} className="text-slate-400 text-xs" />
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="bg-transparent text-xs font-semibold text-slate-800 outline-hidden cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive Only</option>
            </select>
          </div>

          {/* Column Visibility Picker */}
          <div className="relative">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowColPicker(!showColPicker)}
              className="border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium rounded-xl h-9 px-3"
            >
              <FontAwesomeIcon icon={faSliders} className="mr-1.5 text-xs" />
              Columns
            </Button>
            {showColPicker && (
              <div className="absolute right-0 top-full z-30 mt-2 w-48 rounded-xl border border-slate-200 bg-white p-2.5 shadow-lg">
                <span className="block px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Visible Columns
                </span>
                <div className="space-y-1.5 pt-1">
                  {Object.entries({
                    image: 'Banner Image',
                    title: 'Title & Subtitle',
                    targetUrl: 'Target URL',
                    priority: 'Priority Order',
                    validity: 'Validity Window',
                    status: 'Status',
                    updatedAt: 'Updated Date',
                  }).map(([key, label]) => (
                    <label
                      key={key}
                      className="flex items-center gap-2 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50 rounded-lg cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={columns[key]}
                        onChange={(e) =>
                          setColumns((prev) => ({ ...prev, [key]: e.target.checked }))
                        }
                        className="rounded border-slate-300 text-[#16A34A] focus:ring-[#16A34A]"
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Refresh Button */}
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setRefreshKey((k) => k + 1)}
            disabled={loading}
            title="Refresh banners"
            className="border-slate-200 text-slate-600 hover:text-slate-900 rounded-xl size-9"
          >
            <FontAwesomeIcon icon={faRotate} className={`text-xs ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* ── Bulk Actions Bar (if any selected) ─────────────────────── */}
      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-sm text-emerald-900 animate-in fade-in duration-150">
          <div className="flex items-center gap-2 font-medium">
            <span className="flex size-5 items-center justify-center rounded-full bg-emerald-600 text-white text-xs font-bold">
              {selectedIds.size}
            </span>
            <span>banner(s) selected</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => handleExportCsv(true)}
              className="border-emerald-300 bg-white hover:bg-emerald-100 text-emerald-900 text-xs font-medium rounded-lg h-8"
            >
              <FontAwesomeIcon icon={faDownload} className="mr-1.5 text-xs" />
              Export Selected
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setSelectedIds(new Set())}
              className="text-emerald-700 hover:text-emerald-900 text-xs h-8"
            >
              Clear Selection
            </Button>
          </div>
        </div>
      )}

      {/* ── Banner Listing Table (Desktop / Tablet) ────────────────── */}
      <div className="hidden md:block overflow-hidden rounded-2xl border border-[#E2E8E5] bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                {columns.checkbox && (
                  <th className="w-10 px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={banners.length > 0 && selectedIds.size === banners.length}
                      onChange={handleSelectAll}
                      className="rounded border-slate-300 text-[#16A34A] focus:ring-[#16A34A]"
                    />
                  </th>
                )}
                {columns.image && <th className="px-4 py-3">Banner Preview</th>}
                {columns.title && <th className="px-4 py-3">Title & Destination</th>}
                {columns.targetUrl && <th className="px-4 py-3">CTA / Target</th>}
                {columns.priority && <th className="px-4 py-3 text-center">Order</th>}
                {columns.validity && <th className="px-4 py-3">Validity Window</th>}
                {columns.status && <th className="px-4 py-3 text-center">Status</th>}
                {columns.updatedAt && <th className="px-4 py-3">Updated</th>}
                {columns.actions && <th className="px-4 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500">
                    <FontAwesomeIcon icon={faRotate} className="animate-spin text-lg text-emerald-600 mb-2" />
                    <p className="text-xs">Loading banners...</p>
                  </td>
                </tr>
              ) : banners.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto text-slate-500">
                      <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mb-3">
                        <FontAwesomeIcon icon={faImage} className="text-2xl" />
                      </div>
                      <h3 className="text-base font-bold text-slate-800">No Banners Found</h3>
                      <p className="text-xs text-slate-500 mt-1 mb-4 leading-relaxed">
                        {search || statusFilter !== 'ALL'
                          ? 'No banners matched your active filters. Try adjusting your search query or status filter.'
                          : 'There are no marketing banners configured yet. Create your first promotional banner to display on customer platforms.'}
                      </p>
                      {canManage && (
                        <Button
                          type="button"
                          onClick={handleOpenCreate}
                          className="bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-semibold rounded-xl"
                        >
                          <FontAwesomeIcon icon={faPlus} className="mr-1.5" />
                          Add Banner
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                banners.map((banner) => {
                  const img = banner.imageUrl || banner.image;
                  const isSelected = selectedIds.has(banner.id);
                  return (
                    <tr
                      key={banner.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isSelected ? 'bg-emerald-50/30' : ''
                      }`}
                    >
                      {columns.checkbox && (
                        <td className="px-4 py-3.5 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectOne(banner.id)}
                            className="rounded border-slate-300 text-[#16A34A] focus:ring-[#16A34A]"
                          />
                        </td>
                      )}

                      {/* Image Thumbnail */}
                      {columns.image && (
                        <td className="px-4 py-3.5">
                          <div
                            onClick={() => handleOpenView(banner)}
                            className="relative size-16 shrink-0 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 cursor-pointer group shadow-2xs"
                            title="Click to view full banner"
                          >
                            {img ? (
                              <img
                                src={img}
                                alt={banner.title || 'Banner'}
                                className="size-full object-cover group-hover:scale-105 transition-transform duration-200"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.parentElement.classList.add('flex', 'items-center', 'justify-center');
                                  e.currentTarget.parentElement.innerHTML = '<span class="text-slate-400 text-xs">No img</span>';
                                }}
                              />
                            ) : (
                              <div className="flex size-full items-center justify-center text-slate-400">
                                <FontAwesomeIcon icon={faImage} />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs">
                              <FontAwesomeIcon icon={faEye} />
                            </div>
                          </div>
                        </td>
                      )}

                      {/* Title & Subtitle */}
                      {columns.title && (
                        <td className="px-4 py-3.5">
                          <div className="max-w-xs">
                            <h4
                              onClick={() => handleOpenView(banner)}
                              className="font-semibold text-slate-900 hover:text-emerald-700 cursor-pointer line-clamp-1"
                              title={banner.title}
                            >
                              {banner.title || 'Untitled Banner'}
                            </h4>
                            {banner.subtitle ? (
                              <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                                {banner.subtitle}
                              </p>
                            ) : banner.description ? (
                              <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                                {banner.description}
                              </p>
                            ) : null}
                          </div>
                        </td>
                      )}

                      {/* CTA & Target URL */}
                      {columns.targetUrl && (
                        <td className="px-4 py-3.5">
                          <div className="max-w-[200px]">
                            {banner.ctaText && (
                              <span className="inline-block text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md mb-1">
                                {banner.ctaText}
                              </span>
                            )}
                            {banner.ctaUrl ? (
                              <a
                                href={banner.ctaUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="block text-xs text-slate-500 hover:text-emerald-600 truncate flex items-center gap-1"
                                title={banner.ctaUrl}
                              >
                                <span className="truncate">{banner.ctaUrl}</span>
                                <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="text-[10px] shrink-0 text-slate-400" />
                              </a>
                            ) : (
                              <span className="text-xs text-slate-400">—</span>
                            )}
                          </div>
                        </td>
                      )}

                      {/* Priority Order */}
                      {columns.priority && (
                        <td className="px-4 py-3.5 text-center">
                          <span className="inline-flex size-7 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-700">
                            {banner.priority ?? 0}
                          </span>
                        </td>
                      )}

                      {/* Validity Window */}
                      {columns.validity && (
                        <td className="px-4 py-3.5 text-xs text-slate-600 whitespace-nowrap">
                          {banner.startAt || banner.endAt || banner.startDate || banner.endDate ? (
                            <div className="space-y-0.5">
                              <div>From: <span className="font-medium text-slate-800">{formatDate(banner.startAt || banner.startDate)}</span></div>
                              <div>To: <span className="font-medium text-slate-800">{formatDate(banner.endAt || banner.endDate)}</span></div>
                            </div>
                          ) : (
                            <span className="text-slate-400">Always active</span>
                          )}
                        </td>
                      )}

                      {/* Status Toggle / Badge */}
                      {columns.status && (
                        <td className="px-4 py-3.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(banner)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all hover:scale-105"
                            title={`Click to ${banner.isActive ? 'deactivate' : 'activate'}`}
                          >
                            <span
                              className={`size-2 rounded-full ${
                                banner.isActive ? 'bg-emerald-600 ring-2 ring-emerald-200' : 'bg-slate-400'
                              }`}
                            />
                            <span className={banner.isActive ? 'text-emerald-700' : 'text-slate-500'}>
                              {banner.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </button>
                        </td>
                      )}

                      {/* Updated At */}
                      {columns.updatedAt && (
                        <td className="px-4 py-3.5 text-xs text-slate-500 whitespace-nowrap">
                          {formatDate(banner.updatedAt || banner.createdAt)}
                        </td>
                      )}

                      {/* Row Actions */}
                      {columns.actions && (
                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            {/* View */}
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenView(banner)}
                              className="size-8 text-slate-500 hover:text-slate-900 rounded-lg"
                              title="View details"
                            >
                              <FontAwesomeIcon icon={faEye} className="text-xs" />
                            </Button>

                            {/* Edit */}
                            {canManage && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenEdit(banner)}
                                className="size-8 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg"
                                title="Edit banner"
                              >
                                <FontAwesomeIcon icon={faPenToSquare} className="text-xs" />
                              </Button>
                            )}

                            {/* Toggle status */}
                            {canManage && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleToggleStatus(banner)}
                                className={`size-8 rounded-lg ${
                                  banner.isActive
                                    ? 'text-amber-600 hover:bg-amber-50 hover:text-amber-800'
                                    : 'text-emerald-600 hover:bg-emerald-50 hover:text-emerald-800'
                                }`}
                                title={banner.isActive ? 'Deactivate' : 'Activate'}
                              >
                                <FontAwesomeIcon icon={faPowerOff} className="text-xs" />
                              </Button>
                            )}

                            {/* Delete */}
                            {canManage && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeletingBanner(banner)}
                                className="size-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg"
                                title="Delete banner"
                              >
                                <FontAwesomeIcon icon={faTrashCan} className="text-xs" />
                              </Button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Responsive Card View for Mobile Screens ─────────────────── */}
      <div className="block md:hidden space-y-3">
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
            <FontAwesomeIcon icon={faRotate} className="animate-spin text-lg text-emerald-600 mb-2" />
            <p className="text-xs">Loading banners...</p>
          </div>
        ) : banners.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
            <div className="flex size-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 mx-auto mb-3">
              <FontAwesomeIcon icon={faImage} />
            </div>
            <h4 className="font-bold text-slate-800 text-sm">No Banners Found</h4>
            <p className="text-xs text-slate-500 mt-1 mb-3">
              No marketing banners available matching your criteria.
            </p>
            {canManage && (
              <Button
                type="button"
                onClick={handleOpenCreate}
                size="sm"
                className="bg-[#16A34A] text-white rounded-xl text-xs"
              >
                <FontAwesomeIcon icon={faPlus} className="mr-1.5" />
                Add Banner
              </Button>
            )}
          </div>
        ) : (
          banners.map((banner) => {
            const img = banner.imageUrl || banner.image;
            return (
              <div
                key={banner.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3"
              >
                {/* Top Row: Thumbnail + Title + Status */}
                <div className="flex items-start gap-3">
                  <div
                    onClick={() => handleOpenView(banner)}
                    className="relative size-16 shrink-0 rounded-xl overflow-hidden bg-slate-100 border border-slate-200"
                  >
                    {img ? (
                      <img
                        src={img}
                        alt={banner.title}
                        className="size-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center text-slate-400">
                        <FontAwesomeIcon icon={faImage} />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4
                        onClick={() => handleOpenView(banner)}
                        className="font-semibold text-slate-900 text-sm truncate"
                      >
                        {banner.title || 'Untitled Banner'}
                      </h4>
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(banner)}
                        className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          banner.isActive
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {banner.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </div>

                    {banner.subtitle && (
                      <p className="text-xs text-slate-500 truncate mt-0.5">{banner.subtitle}</p>
                    )}

                    {banner.ctaUrl && (
                      <p className="text-xs text-emerald-600 truncate mt-1">
                        Target: {banner.ctaUrl}
                      </p>
                    )}
                  </div>
                </div>

                {/* Bottom Row: Priority & Actions */}
                <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs text-slate-500">
                  <span>Priority: <strong className="text-slate-800">{banner.priority ?? 0}</strong></span>

                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenView(banner)}
                      className="size-8 p-0 text-slate-600 rounded-lg"
                    >
                      <FontAwesomeIcon icon={faEye} className="text-xs" />
                    </Button>
                    {canManage && (
                      <>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(banner)}
                          className="size-8 p-0 text-emerald-600 rounded-lg"
                        >
                          <FontAwesomeIcon icon={faPenToSquare} className="text-xs" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeletingBanner(banner)}
                          className="size-8 p-0 text-rose-500 rounded-lg"
                        >
                          <FontAwesomeIcon icon={faTrashCan} className="text-xs" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Pagination ──────────────────────────────────────────────── */}
      {pagination.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 pt-2">
          <span>
            Showing page <strong>{pagination.page}</strong> of{' '}
            <strong>{pagination.totalPages}</strong> ({pagination.total} total banners)
          </span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="border-slate-200 text-slate-700 rounded-lg h-8 px-2.5"
            >
              <FontAwesomeIcon icon={faChevronLeft} className="mr-1 text-[10px]" />
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page >= pagination.totalPages}
              className="border-slate-200 text-slate-700 rounded-lg h-8 px-2.5"
            >
              Next
              <FontAwesomeIcon icon={faChevronRight} className="ml-1 text-[10px]" />
            </Button>
          </div>
        </div>
      )}

      {/* ── Add / Edit Banner Modal ─────────────────────────────────── */}
      {isFormOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150"
        >
          <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingBanner ? 'Edit Promotional Banner' : 'Create New Promotional Banner'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure banner creative, target action, and scheduling.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-slate-600 size-8 flex items-center justify-center rounded-lg hover:bg-slate-100"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSaveBanner} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Image Input Section (Dual Mode) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Banner Creative Image <span className="text-rose-500">*</span>
                  </label>
                  <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs">
                    <button
                      type="button"
                      onClick={() => setImageMode('FILE')}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-all ${
                        imageMode === 'FILE'
                          ? 'bg-white text-emerald-700 shadow-2xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <FontAwesomeIcon icon={faUpload} className="text-[10px]" />
                      <span>Upload File</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageMode('URL')}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-all ${
                        imageMode === 'URL'
                          ? 'bg-white text-emerald-700 shadow-2xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <FontAwesomeIcon icon={faLink} className="text-[10px]" />
                      <span>Image URL</span>
                    </button>
                  </div>
                </div>

                {/* Upload Mode UI */}
                {imageMode === 'FILE' ? (
                  <div className="space-y-2">
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="group relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-emerald-500 p-6 transition-all cursor-pointer text-center"
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <div className="flex size-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 mb-2 group-hover:scale-105 transition-transform">
                        <FontAwesomeIcon icon={faUpload} className="text-base" />
                      </div>
                      <p className="text-xs font-semibold text-slate-700">
                        {selectedFile ? selectedFile.name : 'Click to select or drag and drop image'}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        PNG, JPG, WebP, or SVG up to 10MB
                      </p>
                    </div>
                  </div>
                ) : (
                  /* URL Mode UI */
                  <div className="space-y-1.5">
                    <Input
                      type="url"
                      placeholder="https://example.com/images/banner.webp"
                      value={form.imageUrl}
                      onChange={(e) => {
                        setForm({ ...form, imageUrl: e.target.value });
                        setPreviewUrl(e.target.value);
                      }}
                      className="text-xs rounded-xl"
                    />
                    <p className="text-[11px] text-slate-400">
                      Enter a direct, public HTTPS image URL for this banner.
                    </p>
                  </div>
                )}

                {/* Live Image Preview (if image selected or URL present) */}
                {previewUrl && (
                  <div className="relative mt-2 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 max-h-48 group">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full max-h-48 object-cover"
                      onError={() => {
                        toast.error('Could not preview image. Please check the URL or file.');
                      }}
                    />
                    <div className="absolute top-2 right-2 flex items-center gap-1.5">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={handleRemoveImage}
                        className="size-7 p-0 bg-white/90 hover:bg-white text-rose-600 rounded-lg shadow-sm"
                        title="Remove image"
                      >
                        <FontAwesomeIcon icon={faXmark} className="text-xs" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Title & Subtitle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Banner Title <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    required
                    placeholder="e.g. Summer Mega Sale"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="text-sm rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Subtitle / Tagline
                  </label>
                  <Input
                    placeholder="e.g. Up to 50% off all orders"
                    value={form.subtitle}
                    onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                    className="text-sm rounded-xl"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Description / Promo Details
                </label>
                <Textarea
                  placeholder="Optional explanatory copy or promotional details..."
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="text-xs rounded-xl"
                />
              </div>

              {/* CTA Text & Destination URL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    CTA Button Text
                  </label>
                  <Input
                    placeholder="e.g. Shop Now / Explore"
                    value={form.ctaText}
                    onChange={(e) => setForm({ ...form, ctaText: e.target.value })}
                    className="text-sm rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Destination / Redirect URL
                  </label>
                  <Input
                    placeholder="https://... or /products/summer-sale"
                    value={form.ctaUrl}
                    onChange={(e) => setForm({ ...form, ctaUrl: e.target.value })}
                    className="text-sm rounded-xl"
                  />
                </div>
              </div>

              {/* Priority & Status Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Priority / Display Order
                  </label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="text-sm rounded-xl"
                  />
                  <p className="text-[11px] text-slate-400">Higher numbers display first.</p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Start Date
                  </label>
                  <Input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="text-sm rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    End Date
                  </label>
                  <Input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="text-sm rounded-xl"
                  />
                </div>
              </div>

              {/* Active Toggle Switch */}
              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                <div>
                  <span className="text-xs font-bold text-slate-800">Publish Immediately</span>
                  <p className="text-[11px] text-slate-500">
                    Enable banner visibility on customer applications.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked, isPublished: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#16A34A]" />
                </label>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsFormOpen(false)}
                  disabled={formBusy}
                  className="rounded-xl border-slate-200 text-slate-700"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={formBusy}
                  className="bg-[#16A34A] hover:bg-[#15803D] text-white rounded-xl shadow-xs font-semibold"
                >
                  {formBusy ? (
                    <>
                      <FontAwesomeIcon icon={faRotate} className="animate-spin mr-1.5" />
                      Saving...
                    </>
                  ) : editingBanner ? (
                    'Save Changes'
                  ) : (
                    'Create Banner'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── View Details Modal ───────────────────────────────────────── */}
      {viewBanner && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
              <div>
                <h3 className="text-base font-bold text-slate-900">Banner Details</h3>
                <p className="text-xs text-slate-500">Live preview & configuration specs</p>
              </div>
              <button
                type="button"
                onClick={() => setViewBanner(null)}
                className="text-slate-400 hover:text-slate-600 size-8 flex items-center justify-center rounded-lg hover:bg-slate-100"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Image Preview */}
              {(viewBanner.imageUrl || viewBanner.image) && (
                <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-2xs">
                  <img
                    src={viewBanner.imageUrl || viewBanner.image}
                    alt={viewBanner.title}
                    className="w-full max-h-56 object-cover"
                  />
                </div>
              )}

              <div>
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-black text-slate-900">{viewBanner.title || 'Untitled Banner'}</h4>
                  <Badge
                    variant={viewBanner.isActive ? 'success' : 'outline'}
                    className="text-xs"
                  >
                    {viewBanner.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                {viewBanner.subtitle && (
                  <p className="text-xs text-slate-500 font-medium mt-0.5">{viewBanner.subtitle}</p>
                )}
                {viewBanner.description && (
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {viewBanner.description}
                  </p>
                )}
              </div>

              {/* Spec list */}
              <div className="grid grid-cols-2 gap-3 text-xs border-t border-slate-100 pt-3">
                <div>
                  <span className="text-slate-400 block">CTA Action</span>
                  <span className="font-semibold text-slate-800">
                    {viewBanner.ctaText || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Priority Order</span>
                  <span className="font-semibold text-slate-800">
                    {viewBanner.priority ?? 0}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 block">Destination URL</span>
                  {viewBanner.ctaUrl ? (
                    <a
                      href={viewBanner.ctaUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-emerald-600 hover:underline break-all"
                    >
                      {viewBanner.ctaUrl}
                    </a>
                  ) : (
                    <span className="text-slate-400">None</span>
                  )}
                </div>
                <div>
                  <span className="text-slate-400 block">Valid From</span>
                  <span className="font-medium text-slate-800">
                    {formatDate(viewBanner.startAt || viewBanner.startDate)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Valid Until</span>
                  <span className="font-medium text-slate-800">
                    {formatDate(viewBanner.endAt || viewBanner.endDate)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Created At</span>
                  <span className="text-slate-600">{formatDate(viewBanner.createdAt)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Last Updated</span>
                  <span className="text-slate-600">{formatDate(viewBanner.updatedAt)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-6 py-3 bg-slate-50/50">
              {canManage && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const b = viewBanner;
                    setViewBanner(null);
                    handleOpenEdit(b);
                  }}
                  className="rounded-xl border-slate-200 text-xs"
                >
                  <FontAwesomeIcon icon={faPenToSquare} className="mr-1.5" />
                  Edit Banner
                </Button>
              )}
              <Button
                type="button"
                onClick={() => setViewBanner(null)}
                className="bg-slate-900 text-white rounded-xl text-xs"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Dialog ──────────────────────────────── */}
      <ConfirmDialog
        open={Boolean(deletingBanner)}
        onOpenChange={(open) => !open && setDeletingBanner(null)}
        title="Delete Banner"
        description={`Are you sure you want to permanently delete "${deletingBanner?.title || 'this banner'}"? This action will remove the banner from customer applications.`}
        confirmLabel="Delete Banner"
        variant="destructive"
        loading={deleteBusy}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
