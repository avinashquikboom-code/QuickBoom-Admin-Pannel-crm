'use client';

import * as React from 'react';
import {
  Sparkles,
  Bot,
  Layers,
  Image as ImageIcon,
  Video,
  FileText,
  Hash,
  Coins,
  Send,
  Calendar,
  RefreshCw,
  Download,
  Plus,
  Search,
  X,
  Filter,
  Eye,
  Copy,
  Check,
  ExternalLink,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Share2,
  Building2,
  User,
  SlidersHorizontal,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { FormDrawer } from '@/components/common/drawers/FormDrawer';
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
import { toast } from '@/hooks/use-toast';
import {
  loadGenerations,
  loadPublishes,
  generateContent,
  sessionCan,
  socialError,
} from '@/modules/social/social-api';
import { TruncatedText } from '@/components/common/TruncatedText';

const CONTENT_TYPES = [
  { id: 'ALL', label: 'All Content', icon: Layers },
  { id: 'CAPTION', label: 'Captions', icon: FileText, color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { id: 'POST', label: 'Social Posts', icon: ImageIcon, color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { id: 'POSTER', label: 'Posters', icon: Layers, color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { id: 'VIDEO', label: 'Video Scripts', icon: Video, color: 'bg-rose-50 text-rose-700 border-rose-200' },
  { id: 'HASHTAGS', label: 'Hashtags', icon: Hash, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
];

const PLATFORMS = [
  { id: 'INSTAGRAM', name: 'Instagram', color: 'bg-pink-50 text-pink-700 border-pink-200' },
  { id: 'FACEBOOK', name: 'Facebook', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { id: 'YOUTUBE', name: 'YouTube', color: 'bg-rose-50 text-rose-700 border-rose-200' },
  { id: 'LINKEDIN', name: 'LinkedIn', color: 'bg-sky-50 text-sky-700 border-sky-200' },
  { id: 'TIKTOK', name: 'TikTok', color: 'bg-slate-100 text-slate-800 border-slate-200' },
];

const STATUS_CONFIG = {
  COMPLETED: { label: 'Completed', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  PROCESSING: { label: 'Processing', color: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500 animate-pulse' },
  PENDING: { label: 'Pending', color: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  FAILED: { label: 'Failed', color: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
};

export function AiStudioScreen() {
  const [allowed, setAllowed] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('generations'); // 'generations' | 'publishes'

  // Generations State
  const [generations, setGenerations] = React.useState([]);
  const [genLoading, setGenLoading] = React.useState(true);
  const [genRefreshing, setGenRefreshing] = React.useState(false);
  const [genPagination, setGenPagination] = React.useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [typeFilter, setTypeFilter] = React.useState('ALL');
  const [platformFilter, setPlatformFilter] = React.useState('ALL');
  const [statusFilter, setStatusFilter] = React.useState('ALL');
  const [searchQuery, setSearchQuery] = React.useState('');

  // Publishes State
  const [publishes, setPublishes] = React.useState([]);
  const [pubLoading, setPubLoading] = React.useState(false);
  const [pubSearch, setPubSearch] = React.useState('');

  // Modals & Drawers
  const [generateDrawerOpen, setGenerateDrawerOpen] = React.useState(false);
  const [generating, setGenerating] = React.useState(false);
  const [detailItem, setDetailItem] = React.useState(null);
  const [copiedKey, setCopiedKey] = React.useState(null);

  // Form State for Generator
  const [genForm, setGenForm] = React.useState({
    type: 'CAPTION',
    platform: 'INSTAGRAM',
    prompt: '',
    objective: '',
    tone: 'Professional & Engaging',
    customerId: '',
  });

  // Check permissions
  React.useEffect(() => {
    setAllowed(sessionCan('AI') || sessionCan('SOCIAL'));
  }, []);

  // Fetch Generations
  const fetchGenerations = React.useCallback(async (page = 1, isRefresh = false) => {
    if (isRefresh) setGenRefreshing(true);
    else setGenLoading(true);

    try {
      const res = await loadGenerations({
        page,
        limit: 20,
        type: typeFilter !== 'ALL' ? typeFilter : undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        search: searchQuery.trim() || undefined,
      });

      const rows = res?.rows || [];
      setGenerations(rows);
      if (res?.pagination) {
        setGenPagination({
          page: res.pagination.page || page,
          limit: res.pagination.limit || 20,
          total: res.pagination.total || rows.length,
          totalPages: res.pagination.totalPages || Math.ceil((res.pagination.total || rows.length) / 20) || 1,
        });
      } else {
        setGenPagination({
          page,
          limit: 20,
          total: res?.total || rows.length,
          totalPages: Math.max(1, Math.ceil((res?.total || rows.length) / 20)),
        });
      }
    } catch (err) {
      console.error('Failed to load AI generations:', err);
      toast.error(socialError(err) || 'Failed to load generations');
      setGenerations([]);
    } finally {
      setGenLoading(false);
      setGenRefreshing(false);
    }
  }, [typeFilter, statusFilter, searchQuery]);

  // Fetch Publishes
  const fetchPublishes = React.useCallback(async () => {
    setPubLoading(true);
    try {
      const res = await loadPublishes({ limit: 50 });
      const rows = Array.isArray(res) ? res : (res?.rows || []);
      setPublishes(rows);
    } catch (err) {
      console.error('Failed to load publishes:', err);
      setPublishes([]);
    } finally {
      setPubLoading(false);
    }
  }, []);

  // Initial load
  React.useEffect(() => {
    fetchGenerations(1);
    fetchPublishes();
  }, [fetchGenerations, fetchPublishes]);

  // Combined Refresh
  const handleRefresh = async () => {
    await Promise.all([fetchGenerations(genPagination.page, true), fetchPublishes()]);
    toast.success('AI Studio refreshed');
  };

  // Filtered Generations (client-side search fallback)
  const filteredGenerations = React.useMemo(() => {
    let result = generations;
    if (typeFilter !== 'ALL') {
      result = result.filter((g) => (g.type || '').toUpperCase() === typeFilter);
    }
    if (platformFilter !== 'ALL') {
      result = result.filter((g) => (g.platform || '').toUpperCase() === platformFilter);
    }
    if (statusFilter !== 'ALL') {
      result = result.filter((g) => (g.status || '').toUpperCase() === statusFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((g) => {
        const id = String(g.generationId || g.id || '').toLowerCase();
        const cust = String(g.customer?.companyName || g.customer?.name || g.customerId || '').toLowerCase();
        const prompt = String(g.prompt || '').toLowerCase();
        const caption = String(g.caption || '').toLowerCase();
        const type = String(g.type || '').toLowerCase();
        return id.includes(q) || cust.includes(q) || prompt.includes(q) || caption.includes(q) || type.includes(q);
      });
    }
    return result;
  }, [generations, typeFilter, platformFilter, statusFilter, searchQuery]);

  // Filtered Publishes
  const filteredPublishes = React.useMemo(() => {
    if (!pubSearch.trim()) return publishes;
    const q = pubSearch.toLowerCase();
    return publishes.filter((p) => {
      const id = String(p.publishId || p.id || '').toLowerCase();
      const cust = String(p.customer?.companyName || p.customer?.name || '').toLowerCase();
      const acc = String(p.socialAccount?.accountName || '').toLowerCase();
      const platform = String(p.platform || '').toLowerCase();
      return id.includes(q) || cust.includes(q) || acc.includes(q) || platform.includes(q);
    });
  }, [publishes, pubSearch]);

  // KPI Calculations
  const stats = React.useMemo(() => {
    const totalCount = genPagination.total || generations.length;
    const completedCount = generations.filter((g) => (g.status || '').toUpperCase() === 'COMPLETED').length;
    const totalCredits = generations.reduce((sum, g) => sum + (Number(g.creditsSpent) || 0), 0);
    const publishCount = publishes.length;

    const completedRate = generations.length > 0
      ? Math.round((completedCount / generations.length) * 100)
      : 100;

    return {
      totalGenerations: totalCount,
      completedCount,
      completedRate,
      totalCredits,
      publishCount,
    };
  }, [generations, genPagination.total, publishes]);

  // Copy to clipboard helper
  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success('Copied to clipboard');
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  // Export CSV
  const handleExportCSV = () => {
    if (activeTab === 'generations') {
      if (filteredGenerations.length === 0) {
        toast.error('No generation records to export');
        return;
      }
      const headers = ['Generation ID', 'Customer', 'Type', 'Platform', 'Credits', 'Status', 'Prompt', 'Caption', 'Date'];
      const rows = filteredGenerations.map((g) => [
        `"${g.generationId || g.id || ''}"`,
        `"${g.customer?.companyName || g.customer?.name || g.customerId || ''}"`,
        `"${g.type || ''}"`,
        `"${g.platform || ''}"`,
        g.creditsSpent ?? 0,
        `"${g.status || ''}"`,
        `"${(g.prompt || '').replace(/"/g, '""')}"`,
        `"${(g.caption || '').replace(/"/g, '""')}"`,
        `"${g.createdAt ? new Date(g.createdAt).toLocaleString() : ''}"`,
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `ai_generations_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Generations exported to CSV');
    } else {
      if (filteredPublishes.length === 0) {
        toast.error('No publish records to export');
        return;
      }
      const headers = ['Publish ID', 'Customer', 'Account', 'Platform', 'Scheduled For', 'Status', 'Error'];
      const rows = filteredPublishes.map((p) => [
        `"${p.publishId || p.id || ''}"`,
        `"${p.customer?.companyName || p.customer?.name || ''}"`,
        `"${p.socialAccount?.accountName || ''}"`,
        `"${p.platform || ''}"`,
        `"${p.scheduledFor || ''}"`,
        `"${p.status || ''}"`,
        `"${(p.errorMessage || '').replace(/"/g, '""')}"`,
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `social_publishes_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Publish logs exported to CSV');
    }
  };

  // Submit Generation Form
  const handleGenerateSubmit = async (e) => {
    e.preventDefault();
    if (!genForm.prompt.trim()) {
      toast.error('Please enter a prompt or product topic');
      return;
    }

    setGenerating(true);
    try {
      const payload = {
        type: genForm.type,
        platform: genForm.platform,
        prompt: genForm.prompt.trim(),
        product: genForm.prompt.trim(),
        objective: genForm.objective.trim() || undefined,
        tone: genForm.tone,
      };

      const result = await generateContent(payload, genForm.customerId ? Number(genForm.customerId) : undefined);
      toast.success(result?.message || 'Content generation initiated successfully!');
      setGenerateDrawerOpen(false);
      setGenForm({
        type: 'CAPTION',
        platform: 'INSTAGRAM',
        prompt: '',
        objective: '',
        tone: 'Professional & Engaging',
        customerId: '',
      });
      // Refresh list
      fetchGenerations(1, true);
    } catch (err) {
      console.error('Generation error:', err);
      toast.error(socialError(err) || 'Failed to generate content. Check your credit balance.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="w-full space-y-6 pb-20">
      {/* ── 1. Page Header ────────────────────────────────────────────── */}
      <PageHeader
        title="AI Studio & Social"
        category="AI & SOCIAL STUDIO"
        description="Generate AI marketing copy, viral video scripts, social media creatives, and track multi-channel publishing."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="h-9 gap-1.5 rounded-xl border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50"
            >
              <Download className="size-3.5 text-slate-500" />
              <span>Export CSV</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={genRefreshing}
              className="h-9 gap-1.5 rounded-xl border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50"
            >
              <RefreshCw className={`size-3.5 text-slate-500 ${genRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
            {allowed && (
              <Button
                size="sm"
                onClick={() => setGenerateDrawerOpen(true)}
                className="h-9 gap-1.5 rounded-xl bg-[#16A34A] px-3.5 text-xs font-semibold text-white shadow-xs hover:bg-[#15803D]"
              >
                <Plus className="size-3.5" />
                <span>Generate Content</span>
              </Button>
            )}
          </div>
        }
      />

      {/* ── 2. Compact KPI Statistics Cards ──────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Total Generations */}
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-xs transition-all hover:border-emerald-300 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total AI Generations
            </span>
            <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-50 text-[#16A34A] ring-1 ring-emerald-200/60">
              <Sparkles className="size-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black tracking-tight text-slate-900">
              {stats.totalGenerations}
            </span>
            <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">
              Prompts Run
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Across all AI content engines</p>
        </div>

        {/* Card 2: Completed Assets */}
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-xs transition-all hover:border-emerald-300 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Completed Outputs
            </span>
            <div className="flex size-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-200/60">
              <CheckCircle2 className="size-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black tracking-tight text-slate-900">
              {stats.completedCount}
            </span>
            <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded-md">
              {stats.completedRate}% Ready
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Verified and ready for publishing</p>
        </div>

        {/* Card 3: Credits Consumed */}
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-xs transition-all hover:border-emerald-300 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              AI Credits Used
            </span>
            <div className="flex size-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600 ring-1 ring-amber-200/60">
              <Coins className="size-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black tracking-tight text-slate-900">
              {stats.totalCredits}
            </span>
            <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md">
              Credits Spent
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Deducted from customer wallets</p>
        </div>

        {/* Card 4: Social Publishes */}
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-xs transition-all hover:border-emerald-300 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Social Publishes
            </span>
            <div className="flex size-8 items-center justify-center rounded-xl bg-purple-50 text-purple-600 ring-1 ring-purple-200/60">
              <Share2 className="size-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black tracking-tight text-slate-900">
              {stats.publishCount}
            </span>
            <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded-md">
              Multi-channel
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Instagram, FB & linked accounts</p>
        </div>
      </div>

      {/* ── 3. Tab Switcher ───────────────────────────────────────────── */}
      <div className="flex items-center border-b border-slate-200 pb-px">
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={() => setActiveTab('generations')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition-all ${
              activeTab === 'generations'
                ? 'border-[#16A34A] text-[#16A34A]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Sparkles className="size-3.5" />
            <span>AI Generations</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                activeTab === 'generations'
                  ? 'bg-emerald-100 text-[#16A34A]'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {stats.totalGenerations}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('publishes')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition-all ${
              activeTab === 'publishes'
                ? 'border-[#16A34A] text-[#16A34A]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Share2 className="size-3.5" />
            <span>Publishing History & Queue</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                activeTab === 'publishes'
                  ? 'bg-emerald-100 text-[#16A34A]'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {stats.publishCount}
            </span>
          </button>
        </div>
      </div>

      {/* ── 4. Main Tab Content ───────────────────────────────────────── */}
      {activeTab === 'generations' ? (
        <div className="space-y-4">
          {/* Content Type Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {CONTENT_TYPES.map((t) => {
              const Icon = t.icon;
              const isSelected = typeFilter === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTypeFilter(t.id)}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${
                    isSelected
                      ? 'border-[#16A34A] bg-emerald-50 text-[#16A34A] shadow-xs ring-1 ring-[#16A34A]'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="size-3.5" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 bg-white p-3 shadow-xs">
            {/* Search Input */}
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search AI generations by ID, customer name, prompt or caption..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-9 text-xs text-slate-800 placeholder-slate-400 transition-all focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {/* Platform & Status Dropdowns */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                aria-label="Filter by Platform"
                value={platformFilter}
                onChange={(e) => setPlatformFilter(e.target.value)}
                className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-xs hover:border-slate-300 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="ALL">All Platforms</option>
                {PLATFORMS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>

              <select
                aria-label="Filter by Status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-xs hover:border-slate-300 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="COMPLETED">Completed</option>
                <option value="PROCESSING">Processing</option>
                <option value="PENDING">Pending</option>
                <option value="FAILED">Failed</option>
              </select>

              {(typeFilter !== 'ALL' || platformFilter !== 'ALL' || statusFilter !== 'ALL' || searchQuery) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setTypeFilter('ALL');
                    setPlatformFilter('ALL');
                    setStatusFilter('ALL');
                    setSearchQuery('');
                  }}
                  className="h-9 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                >
                  Reset
                </Button>
              )}
            </div>
          </div>

          {/* Compact AI Generations Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="border-b border-slate-200 bg-slate-50/80 font-bold uppercase tracking-wider text-slate-600">
                  <tr>
                    <th className="px-4 py-3">Generation ID & Date</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Platform</th>
                    <th className="px-4 py-3">Preview / Prompt</th>
                    <th className="px-4 py-3 text-center">Credits</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {genLoading ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-xs text-slate-400">
                        <RefreshCw className="mx-auto mb-2 size-5 animate-spin text-emerald-600" />
                        Loading AI generations…
                      </td>
                    </tr>
                  ) : filteredGenerations.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-14 text-center">
                        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-3">
                          <Bot className="size-6" />
                        </div>
                        <p className="text-sm font-semibold text-slate-800">No AI generations found</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {searchQuery || typeFilter !== 'ALL' || platformFilter !== 'ALL' || statusFilter !== 'ALL'
                            ? 'Try adjusting your search filters.'
                            : 'Generate your first AI copy or image creative.'}
                        </p>
                        {allowed && (
                          <Button
                            size="sm"
                            onClick={() => setGenerateDrawerOpen(true)}
                            className="mt-4 h-8 gap-1 rounded-xl bg-[#16A34A] px-3 text-xs text-white hover:bg-[#15803D]"
                          >
                            <Plus className="size-3" />
                            <span>Generate Now</span>
                          </Button>
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredGenerations.map((row) => {
                      const id = row.generationId || row.id || '—';
                      const customerName = row.customer?.companyName || row.customer?.name || (row.customerId ? `Customer #${row.customerId}` : '—');
                      const type = (row.type || 'POST').toUpperCase();
                      const platform = (row.platform || 'INSTAGRAM').toUpperCase();
                      const statusKey = (row.status || 'COMPLETED').toUpperCase();
                      const statusObj = STATUS_CONFIG[statusKey] || STATUS_CONFIG.COMPLETED;
                      const dateStr = row.createdAt ? new Date(row.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
                      const promptOrCaption = row.caption || row.prompt || 'No output text';

                      return (
                        <tr
                          key={id}
                          className="transition-colors hover:bg-slate-50/70 cursor-pointer"
                          onClick={() => setDetailItem(row)}
                        >
                          {/* ID & Date */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="font-mono text-xs font-bold text-slate-900 group-hover:text-emerald-700">
                              {id}
                            </span>
                            <div className="text-[11px] text-slate-400 mt-0.5">{dateStr}</div>
                          </td>

                          {/* Customer */}
                          <td className="px-4 py-3 max-w-[180px]" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-1.5">
                              <Building2 className="size-3.5 text-slate-400 shrink-0" />
                              <TruncatedText
                                value={customerName}
                                maxWidth="max-w-[150px]"
                                label="Customer"
                                className="font-semibold text-slate-800"
                              />
                            </div>
                            {row.customerId && (
                              <span className="text-[10px] text-slate-400 font-mono">ID: #{row.customerId}</span>
                            )}
                          </td>

                          {/* Type */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                              {type}
                            </span>
                          </td>

                          {/* Platform */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 rounded-md bg-pink-50 text-pink-700 border border-pink-200/60 px-2 py-0.5 text-[11px] font-semibold">
                              {platform}
                            </span>
                          </td>

                          {/* Preview / Prompt */}
                          <td className="px-4 py-3 max-w-[220px]" onClick={(e) => e.stopPropagation()}>
                            <TruncatedText
                              value={promptOrCaption}
                              maxWidth="max-w-[200px]"
                              label="Generated Content"
                              className="text-slate-600"
                            />
                            {row.mediaUrl && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-semibold mt-0.5">
                                <ImageIcon className="size-3" /> Includes Media
                              </span>
                            )}
                          </td>

                          {/* Credits */}
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            <span className="font-mono text-xs font-bold text-slate-700 bg-amber-50 border border-amber-200/60 rounded px-1.5 py-0.5">
                              {row.creditsSpent ?? 1}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${statusObj.color}`}>
                              <span className={`size-1.5 rounded-full ${statusObj.dot}`} />
                              {statusObj.label}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDetailItem(row)}
                                className="h-8 gap-1 rounded-lg px-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                              >
                                <Eye className="size-3.5" />
                                <span>View</span>
                              </Button>

                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-slate-400 hover:text-slate-700"
                                  >
                                    <span className="sr-only">Actions</span>
                                    •••
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-44 rounded-xl bg-white shadow-xl">
                                  <DropdownMenuItem
                                    onClick={() => setDetailItem(row)}
                                    className="cursor-pointer text-xs font-medium text-slate-700"
                                  >
                                    <Eye className="mr-2 size-3.5 text-slate-500" />
                                    Inspect Output
                                  </DropdownMenuItem>

                                  {row.caption && (
                                    <DropdownMenuItem
                                      onClick={() => handleCopy(row.caption, `menu_${id}`)}
                                      className="cursor-pointer text-xs font-medium text-slate-700"
                                    >
                                      <Copy className="mr-2 size-3.5 text-slate-500" />
                                      Copy Caption
                                    </DropdownMenuItem>
                                  )}

                                  {row.mediaUrl && (
                                    <DropdownMenuItem
                                      onClick={() => window.open(row.mediaUrl, '_blank')}
                                      className="cursor-pointer text-xs font-medium text-slate-700"
                                    >
                                      <ExternalLink className="mr-2 size-3.5 text-slate-500" />
                                      Open Image URL
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {!genLoading && filteredGenerations.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 bg-slate-50/50 text-xs text-slate-500">
                <div>
                  Showing <span className="font-semibold text-slate-800">{filteredGenerations.length}</span> of{' '}
                  <span className="font-semibold text-slate-800">{genPagination.total || filteredGenerations.length}</span> generations
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={genPagination.page <= 1}
                    onClick={() => fetchGenerations(genPagination.page - 1)}
                    className="h-8 rounded-xl px-2.5 text-xs font-semibold"
                  >
                    Previous
                  </Button>
                  <span className="font-semibold text-slate-700 px-2">
                    Page {genPagination.page} of {genPagination.totalPages || 1}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={genPagination.page >= genPagination.totalPages}
                    onClick={() => fetchGenerations(genPagination.page + 1)}
                    className="h-8 rounded-xl px-2.5 text-xs font-semibold"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ── 5. Publishing History Tab ─────────────────────────────────── */
        <div className="space-y-4">
          {/* Publishes Search Bar */}
          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3 shadow-xs">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search publish logs by ID, account, or customer..."
                value={pubSearch}
                onChange={(e) => setPubSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-9 text-xs text-slate-800 placeholder-slate-400 transition-all focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              {pubSearch && (
                <button
                  type="button"
                  onClick={() => setPubSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
            <span className="text-xs font-semibold text-slate-500">
              {filteredPublishes.length} record{filteredPublishes.length === 1 ? '' : 's'}
            </span>
          </div>

          {/* Publishes Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="border-b border-slate-200 bg-slate-50/80 font-bold uppercase tracking-wider text-slate-600">
                  <tr>
                    <th className="px-4 py-3">Publish ID</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Connected Account</th>
                    <th className="px-4 py-3">Platform</th>
                    <th className="px-4 py-3">Scheduled / Published</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Error / Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pubLoading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-xs text-slate-400">
                        <RefreshCw className="mx-auto mb-2 size-5 animate-spin text-emerald-600" />
                        Loading social publishes…
                      </td>
                    </tr>
                  ) : filteredPublishes.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-xs text-slate-400">
                        No publishing events recorded yet.
                      </td>
                    </tr>
                  ) : (
                    filteredPublishes.map((row) => {
                      const id = row.publishId || row.id || '—';
                      const customerName = row.customer?.companyName || row.customer?.name || '—';
                      const accountName = row.socialAccount?.accountName || '—';
                      const platform = row.platform || 'INSTAGRAM';
                      const scheduledTime = String(row.scheduledFor || '').slice(0, 16).replace('T', ' ') || 'Immediate';
                      const status = String(row.status || '').toLowerCase();
                      const isSuccess = status === 'completed' || status === 'published' || status === 'success';

                      return (
                        <tr key={id} className="transition-colors hover:bg-slate-50/70">
                          <td className="px-4 py-3 font-mono font-bold text-slate-900">{id}</td>
                          <td className="px-4 py-3 font-semibold text-slate-800">{customerName}</td>
                          <td className="px-4 py-3 text-slate-600">{accountName}</td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 text-blue-700 px-2 py-0.5 text-[11px] font-semibold">
                              {platform}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-600 font-mono text-[11px]">{scheduledTime}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${
                                isSuccess
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border-rose-200'
                              }`}
                            >
                              <span
                                className={`size-1.5 rounded-full ${isSuccess ? 'bg-emerald-500' : 'bg-rose-500'}`}
                              />
                              {status || 'Unknown'}
                            </span>
                          </td>
                          <td className="px-4 py-3 max-w-[200px]">
                            {row.errorMessage ? (
                              <span className="text-rose-600 font-medium truncate block" title={row.errorMessage}>
                                {row.errorMessage}
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── 6. Detail Preview Modal ───────────────────────────────────── */}
      <Dialog open={Boolean(detailItem)} onOpenChange={(open) => !open && setDetailItem(null)}>
        <DialogContent className="max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center justify-between pr-4">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-50 text-[#16A34A] ring-1 ring-emerald-200/60">
                  <Sparkles className="size-4" />
                </div>
                <div>
                  <div className="font-mono text-sm font-bold text-slate-900">
                    {detailItem?.generationId || detailItem?.id}
                  </div>
                  <div className="text-[11px] font-normal text-slate-500">
                    {detailItem?.createdAt ? new Date(detailItem.createdAt).toLocaleString() : ''}
                  </div>
                </div>
              </div>
              <span className="rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-xs font-bold">
                {detailItem?.type || 'POST'}
              </span>
            </DialogTitle>
          </DialogHeader>

          {detailItem && (
            <div className="space-y-4 pt-2 text-xs">
              {/* Media viewer if exists */}
              {detailItem.mediaUrl && (
                <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-950 flex flex-col items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={detailItem.mediaUrl}
                    alt="AI Generated Output"
                    className="max-h-72 w-full object-contain"
                  />
                  <div className="w-full bg-slate-900/90 px-3 py-2 flex items-center justify-between text-slate-300">
                    <span className="text-[11px] font-semibold text-emerald-400">Generated Creative</span>
                    <a
                      href={detailItem.mediaUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-white hover:text-emerald-300 font-semibold"
                    >
                      <span>Full Resolution</span>
                      <ExternalLink className="size-3" />
                    </a>
                  </div>
                </div>
              )}

              {/* Meta tags row */}
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200/70">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Customer</span>
                  <span className="font-semibold text-slate-800">
                    {detailItem.customer?.companyName || detailItem.customer?.name || (detailItem.customerId ? `Customer #${detailItem.customerId}` : '—')}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Platform & Credits</span>
                  <span className="font-semibold text-slate-800">
                    {detailItem.platform || 'INSTAGRAM'} • {detailItem.creditsSpent ?? 1} Credit(s)
                  </span>
                </div>
              </div>

              {/* Generated Caption Section */}
              {detailItem.caption && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Generated Copy / Caption
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(detailItem.caption, 'caption')}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#16A34A] hover:text-[#15803D]"
                    >
                      {copiedKey === 'caption' ? (
                        <>
                          <Check className="size-3" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="size-3" />
                          <span>Copy Caption</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 p-3 leading-relaxed text-slate-800 font-sans max-h-48 overflow-y-auto">
                    {detailItem.caption}
                  </div>
                </div>
              )}

              {/* Hashtags Section */}
              {(detailItem.hashtags?.length > 0 || typeof detailItem.hashtags === 'string') && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Suggested Hashtags
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy(
                          Array.isArray(detailItem.hashtags)
                            ? detailItem.hashtags.join(' ')
                            : detailItem.hashtags,
                          'hashtags'
                        )
                      }
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#16A34A] hover:text-[#15803D]"
                    >
                      {copiedKey === 'hashtags' ? (
                        <>
                          <Check className="size-3" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="size-3" />
                          <span>Copy Hashtags</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                    {(Array.isArray(detailItem.hashtags)
                      ? detailItem.hashtags
                      : String(detailItem.hashtags).split(/\s+/)
                    )
                      .filter(Boolean)
                      .map((tag, idx) => (
                        <span
                          key={idx}
                          className="rounded-md bg-emerald-100/70 text-emerald-800 px-2 py-0.5 text-[11px] font-medium"
                        >
                          {tag.startsWith('#') ? tag : `#${tag}`}
                        </span>
                      ))}
                  </div>
                </div>
              )}

              {/* Original Prompt */}
              {detailItem.prompt && (
                <div className="space-y-1 pt-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Input Prompt
                  </span>
                  <p className="text-slate-600 bg-slate-50 rounded-lg p-2 text-[11px] border border-slate-200/60 leading-normal">
                    {detailItem.prompt}
                  </p>
                </div>
              )}

              {/* Error Message if Failed */}
              {detailItem.errorMessage && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-800">
                  <div className="font-bold flex items-center gap-1.5 text-xs text-rose-900 mb-0.5">
                    <AlertCircle className="size-4 text-rose-600" />
                    Generation Failure
                  </div>
                  <p className="text-[11px] leading-relaxed">{detailItem.errorMessage}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── 7. Generate Content Form Drawer ───────────────────────────── */}
      <FormDrawer
        open={generateDrawerOpen}
        onOpenChange={setGenerateDrawerOpen}
        title="Generate AI Content"
        description="Select content format, target platform, and enter prompt guidelines. AI credits are automatically calculated and deducted."
        onSubmit={handleGenerateSubmit}
        submitLabel={generating ? 'Generating Content…' : 'Generate Asset'}
        loading={generating}
        disabled={generating}
        size="standard"
      >
        <div className="space-y-4">
          {/* Content Type */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-800">Content Format</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {[
                { id: 'CAPTION', label: 'Caption Only' },
                { id: 'POST', label: 'Social Post' },
                { id: 'POSTER', label: 'Poster Copy' },
                { id: 'VIDEO', label: 'Video Script' },
                { id: 'HASHTAGS', label: 'Hashtags Only' },
              ].map((fmt) => (
                <button
                  key={fmt.id}
                  type="button"
                  onClick={() => setGenForm({ ...genForm, type: fmt.id })}
                  className={`rounded-xl border p-2 text-center text-xs font-bold transition-all ${
                    genForm.type === fmt.id
                      ? 'border-[#16A34A] bg-emerald-50 text-[#16A34A] ring-1 ring-[#16A34A]'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {fmt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Platform */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-800">Target Social Platform</Label>
            <select
              value={genForm.platform}
              onChange={(e) => setGenForm({ ...genForm, platform: e.target.value })}
              className="w-full h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {PLATFORMS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Prompt */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-800">
              Prompt / Product / Campaign Description <span className="text-rose-500">*</span>
            </Label>
            <Textarea
              required
              rows={4}
              placeholder="e.g. Introduce our new organic summer skincare range with 20% discount code SUMMER20. Highlight natural botanical extracts and glowing skin."
              value={genForm.prompt}
              onChange={(e) => setGenForm({ ...genForm, prompt: e.target.value })}
              className="rounded-xl border-slate-200 text-xs focus:border-emerald-500 focus:ring-emerald-500"
            />
          </div>

          {/* Tone */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-800">Tone of Voice</Label>
            <select
              value={genForm.tone}
              onChange={(e) => setGenForm({ ...genForm, tone: e.target.value })}
              className="w-full h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="Professional & Engaging">Professional & Engaging</option>
              <option value="Premium & Luxury">Premium & Luxury</option>
              <option value="Casual & Friendly">Casual & Friendly</option>
              <option value="Urgent & Promotional">Urgent & Promotional</option>
              <option value="Inspirational & Motivational">Inspirational & Motivational</option>
              <option value="Humorous & Viral">Humorous & Viral</option>
            </select>
          </div>

          {/* Objective */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-800">Campaign Objective (Optional)</Label>
            <Input
              placeholder="e.g. Lead Generation, Black Friday Sales, Brand Awareness"
              value={genForm.objective}
              onChange={(e) => setGenForm({ ...genForm, objective: e.target.value })}
              className="h-9 rounded-xl border-slate-200 text-xs focus:border-emerald-500 focus:ring-emerald-500"
            />
          </div>

          {/* Customer ID (Optional) */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-800">Customer ID (Optional)</Label>
            <Input
              placeholder="Leave blank for tenant admin, or enter Customer ID e.g. 1"
              value={genForm.customerId}
              onChange={(e) => setGenForm({ ...genForm, customerId: e.target.value })}
              className="h-9 rounded-xl border-slate-200 text-xs focus:border-emerald-500 focus:ring-emerald-500"
            />
            <p className="text-[11px] text-slate-400">
              When provided, generation credits will be billed to this customer wallet.
            </p>
          </div>
        </div>
      </FormDrawer>
    </div>
  );
}

export default AiStudioScreen;
