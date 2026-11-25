// @ts-nocheck
'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Share2,
  Users,
  ShieldCheck,
  ShieldAlert,
  Key,
  Globe,
  ExternalLink,
  MoreVertical,
  Edit3,
  Trash2,
  Eye,
  Plus,
  RefreshCw,
  Download,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  Building2,
  User,
  SlidersHorizontal,
  Video,
  Radio,
  Lock,
} from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faInstagram,
  faFacebook,
  faYoutube,
  faLinkedin,
  faXTwitter,
  faTiktok,
} from '@fortawesome/free-brands-svg-icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from '@/hooks/use-toast';
import {
  loadHandlers,
  loadSocialAccounts,
  removeHandler,
  sessionCan,
  socialError,
  socialGaps,
} from '@/modules/social/social-api';
import { SsmHandlerDrawer } from './SsmHandlerDrawer';
import { SsmDeleteDialog } from './SsmDeleteDialog';
import { GlobalExport } from '@/components/export/GlobalExport';

export function SsmAccessScreen() {
  const [allowed, setAllowed] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  // Data states
  const [handlers, setHandlers] = React.useState<any[]>([]);
  const [accounts, setAccounts] = React.useState<any[]>([]);

  // Active view tab: 'handlers' | 'accounts'
  const [activeTab, setActiveTab] = React.useState<'handlers' | 'accounts'>('handlers');

  // Filters
  const [searchQuery, setSearchQuery] = React.useState('');
  const [platformFilter, setPlatformFilter] = React.useState('ALL');
  const [statusFilter, setStatusFilter] = React.useState('ALL');

  // Drawer & Dialog states
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [drawerMode, setDrawerMode] = React.useState<'create' | 'edit' | 'view'>('create');
  const [selectedHandler, setSelectedHandler] = React.useState<any | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [handlerToDelete, setHandlerToDelete] = React.useState<any | null>(null);
  const [deleteLoading, setDeleteLoading] = React.useState(false);

  // Check permissions
  React.useEffect(() => {
    setAllowed(sessionCan('SOCIAL'));
  }, []);

  // Fetch data
  const fetchData = React.useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [handlersRes, accountsRes] = await Promise.all([
        loadHandlers({}),
        loadSocialAccounts().catch(() => []),
      ]);

      const handlerRows = Array.isArray(handlersRes)
        ? handlersRes
        : (handlersRes?.rows || handlersRes?.items || []);
      setHandlers(handlerRows);

      const accountRows = Array.isArray(accountsRes)
        ? accountsRes
        : (accountsRes?.rows || accountsRes?.items || accountsRes?.accounts || []);
      setAccounts(accountRows);
    } catch (err: any) {
      toast.error(socialError(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle delete
  const handleDeleteConfirm = async () => {
    if (!handlerToDelete) return;
    setDeleteLoading(true);
    try {
      await removeHandler(handlerToDelete.id);
      toast.success('Handler record deleted');
      setDeleteDialogOpen(false);
      setHandlerToDelete(null);
      fetchData(true);
    } catch (err: any) {
      toast.error(socialError(err));
    } finally {
      setDeleteLoading(false);
    }
  };

  // Filtered handlers
  const filteredHandlers = React.useMemo(() => {
    return handlers.filter((h) => {
      // Platform filter
      if (platformFilter !== 'ALL' && h.platform !== platformFilter) {
        return false;
      }
      // Status filter
      if (statusFilter !== 'ALL' && h.status !== statusFilter) {
        return false;
      }
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const handlerName = (h.handlerName || '').toLowerCase();
        const handlerEmail = (h.handlerEmail || '').toLowerCase();
        const accountName = (h.accountName || '').toLowerCase();
        const customerName = (
          h.customer?.companyName ||
          h.customer?.name ||
          String(h.customerId || '')
        ).toLowerCase();
        const platform = (h.platform || '').toLowerCase();
        const socialMediaId = (h.socialMediaId || '').toLowerCase();

        return (
          handlerName.includes(q) ||
          handlerEmail.includes(q) ||
          accountName.includes(q) ||
          customerName.includes(q) ||
          platform.includes(q) ||
          socialMediaId.includes(q)
        );
      }
      return true;
    });
  }, [handlers, platformFilter, statusFilter, searchQuery]);

  // Filtered accounts
  const filteredAccounts = React.useMemo(() => {
    return accounts.filter((acc) => {
      if (platformFilter !== 'ALL' && acc.platform !== platformFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const name = (acc.accountName || '').toLowerCase();
        const username = (acc.username || acc.externalAccountId || '').toLowerCase();
        const cust = (acc.customer?.companyName || acc.customer?.name || '').toLowerCase();
        return name.includes(q) || username.includes(q) || cust.includes(q);
      }
      return true;
    });
  }, [accounts, platformFilter, searchQuery]);

  // KPI Calculations
  const totalHandlersCount = handlers.length;
  const connectedAccountsCount = accounts.filter((a) => a.isConnected !== false).length;
  const activeHandlersCount = handlers.filter((h) => h.status === 'ACTIVE').length;

  // CSV Export
  const handleExportCsv = () => {
    if (activeTab === 'handlers') {
      if (filteredHandlers.length === 0) {
        toast.info('No handler records to export.');
        return;
      }

      const headers = [
        'ID',
        'Account Name',
        'Platform',
        'Account URL',
        'Account ID',
        'Customer Name',
        'Customer ID',
        'Handler Name',
        'Handler Email',
        'Work Type',
        'Credential Stored',
        'Status',
        'Created At',
      ];

      const rows = filteredHandlers.map((h) => [
        `"${h.id || ''}"`,
        `"${(h.accountName || '').replace(/"/g, '""')}"`,
        `"${h.platform || ''}"`,
        `"${(h.accountUrl || '').replace(/"/g, '""')}"`,
        `"${(h.socialMediaId || '').replace(/"/g, '""')}"`,
        `"${(h.customer?.companyName || h.customer?.name || '').replace(/"/g, '""')}"`,
        `"${h.customerId || ''}"`,
        `"${(h.handlerName || '').replace(/"/g, '""')}"`,
        `"${(h.handlerEmail || '').replace(/"/g, '""')}"`,
        `"${h.workType || ''}"`,
        `"${h.passwordOnFile ? 'YES' : 'NO'}"`,
        `"${h.status || ''}"`,
        `"${h.createdAt ? String(h.createdAt).slice(0, 19).replace('T', ' ') : ''}"`,
      ]);

      const csvContent =
        'data:text/csv;charset=utf-8,' +
        [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `ssm-handlers-export-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Handler records CSV downloaded successfully');
    } else {
      if (filteredAccounts.length === 0) {
        toast.info('No connected accounts to export.');
        return;
      }

      const headers = [
        'ID',
        'Account Name',
        'Platform',
        'Username / ID',
        'Customer Name',
        'Connected',
        'Token Expires At',
      ];

      const rows = filteredAccounts.map((a) => [
        `"${a.id || ''}"`,
        `"${(a.accountName || '').replace(/"/g, '""')}"`,
        `"${a.platform || ''}"`,
        `"${(a.username || a.externalAccountId || '').replace(/"/g, '""')}"`,
        `"${(a.customer?.companyName || a.customer?.name || '').replace(/"/g, '""')}"`,
        `"${a.isConnected ? 'CONNECTED' : 'DISCONNECTED'}"`,
        `"${a.tokenExpiresAt ? String(a.tokenExpiresAt).slice(0, 10) : 'N/A'}"`,
      ]);

      const csvContent =
        'data:text/csv;charset=utf-8,' +
        [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `ssm-connected-accounts-export-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Connected accounts CSV downloaded');
    }
  };

  return (
    <div className="w-full max-w-none min-w-0 space-y-6 pb-28">
      {/* 1. HERO HEADER */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-50/70 via-white to-slate-50 border border-emerald-100/70 p-5 md:p-7 shadow-sm">
        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100/80 text-emerald-800 tracking-wide uppercase">
                <Share2 className="size-3" />
                AI & Social Studio
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded-full">
                <Lock className="size-2.5 text-slate-400" />
                Zero-Knowledge Secrets
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
              SSM Account Access Details
            </h1>
            <p className="text-xs md:text-sm text-slate-600 max-w-2xl leading-relaxed">
              Manage social media handlers, assigned client channels, and OAuth account integrations.
              Sensitive passwords and access tokens remain encrypted and masked at all times.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 pt-2 md:pt-0">
            <GlobalExport
              module="ssm_access"
              title="SSM Account Access Report"
              filters={{ platform: platformFilter !== 'ALL' ? platformFilter : undefined, status: statusFilter !== 'ALL' ? statusFilter : undefined, search: searchQuery || undefined }}
              currentPageRows={filteredHandlers}
            />

            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="h-9 gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 border-slate-200"
            >
              <RefreshCw className={`size-3.5 ${refreshing ? 'animate-spin text-emerald-600' : ''}`} />
              Refresh
            </Button>

            {allowed && (
              <Button
                size="sm"
                onClick={() => {
                  setSelectedHandler(null);
                  setDrawerMode('create');
                  setDrawerOpen(true);
                }}
                className="h-9 gap-1.5 text-xs font-semibold bg-[#123D32] hover:bg-[#176B50] text-white shadow-sm transition-all"
              >
                <Plus className="size-3.5" />
                Add Handler
              </Button>
            )}
          </div>
        </div>

        {/* Decorative corner accent */}
        <div className="pointer-events-none absolute -bottom-10 -right-10 size-44 rounded-full bg-emerald-200/20 blur-2xl" />
      </div>

      {/* 2. SUMMARY KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Total Handlers */}
        <button
          type="button"
          onClick={() => { setActiveTab('handlers'); setStatusFilter('ALL'); }}
          className="text-left rounded-2xl border border-[#E2E8E5] bg-white p-5 shadow-xs hover:border-[#123D32]/40 hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                Total Handlers
              </span>
              <p className="text-2xl md:text-3xl font-bold text-[#142D25] tracking-tight">
                {loading ? '—' : totalHandlersCount}
              </p>
            </div>
            <div className="size-11 rounded-xl bg-[#E8F1EC] text-[#123D32] flex items-center justify-center border border-[#CDE2D6] shadow-xs">
              <Users className="size-5.5" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-[#64748B]">
            <span className="inline-block size-1.5 rounded-full bg-[#22C55E]" />
            <span>Staff &amp; agency accounts on record</span>
          </div>
        </button>

        {/* Connected Social Accounts */}
        <button
          type="button"
          onClick={() => setActiveTab('accounts')}
          className="text-left rounded-2xl border border-[#E2E8E5] bg-white p-5 shadow-xs hover:border-[#123D32]/40 hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                Connected Accounts
              </span>
              <p className="text-2xl md:text-3xl font-bold text-[#142D25] tracking-tight">
                {loading ? '—' : connectedAccountsCount}
              </p>
            </div>
            <div className="size-11 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-100/60 shadow-xs">
              <Share2 className="size-5.5" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-[#64748B]">
            <span className="inline-block size-1.5 rounded-full bg-blue-500" />
            <span>Live OAuth connections linked to customers</span>
          </div>
        </button>

        {/* Active Assignments */}
        <button
          type="button"
          onClick={() => { setActiveTab('handlers'); setStatusFilter((prev) => (prev === 'ACTIVE' ? 'ALL' : 'ACTIVE')); }}
          className="text-left rounded-2xl border border-[#E2E8E5] bg-white p-5 shadow-xs hover:border-[#123D32]/40 hover:shadow-md transition-all sm:col-span-2 lg:col-span-1"
        >
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                Active Assignments
              </span>
              <p className="text-2xl md:text-3xl font-bold text-[#142D25] tracking-tight">
                {loading ? '—' : activeHandlersCount}
              </p>
            </div>
            <div className="size-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200/70 shadow-xs">
              <ShieldCheck className="size-5.5" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-[#64748B]">
            <span className="inline-block size-1.5 rounded-full bg-emerald-500" />
            <span>Operational handlers with active status</span>
          </div>
        </button>
      </div>

      {/* 3. VIEW TOGGLE BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60 w-fit">
          <button
            type="button"
            onClick={() => setActiveTab('handlers')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'handlers'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="size-3.5" />
            Handlers List
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === 'handlers'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {handlers.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('accounts')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'accounts'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Share2 className="size-3.5" />
            Connected Accounts
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === 'accounts'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {accounts.length}
            </span>
          </button>
        </div>

        {/* Security / Audit gap notice */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/80">
          <ShieldAlert className="size-3.5 text-amber-500 shrink-0" />
          <span>{socialGaps.tokens}</span>
        </div>
      </div>

      {/* 4. FILTER TOOLBAR */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <Input
              type="text"
              placeholder={
                activeTab === 'handlers'
                  ? 'Search by handler, account name, customer, email...'
                  : 'Search connected accounts by name, username...'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 text-xs border-slate-200 bg-slate-50/50 focus:bg-white rounded-xl"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Platform Select */}
            <select
              aria-label="Filter by platform"
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="h-10 min-w-[155px] rounded-xl border border-[#E2E8E5] bg-white px-3 text-xs font-medium text-[#142D25] outline-none focus:border-[#123D32]"
            >
              <option value="ALL">All Platforms</option>
              <option value="INSTAGRAM">Instagram</option>
              <option value="FACEBOOK">Facebook</option>
              <option value="YOUTUBE">YouTube</option>
              <option value="LINKEDIN">LinkedIn</option>
              <option value="TIKTOK">TikTok</option>
              <option value="TWITTER">Twitter / X</option>
            </select>

            {/* Status Select (handlers tab only) */}
            {activeTab === 'handlers' && (
              <select
                aria-label="Filter by status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 min-w-[140px] rounded-xl border border-[#E2E8E5] bg-white px-3 text-xs font-medium text-[#142D25] outline-none focus:border-[#123D32]"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="PAUSED">Paused</option>
              </select>
            )}

            {/* Clear All Filters */}
            {(searchQuery || platformFilter !== 'ALL' || statusFilter !== 'ALL') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setPlatformFilter('ALL');
                  setStatusFilter('ALL');
                }}
                className="h-10 text-xs text-slate-500 hover:text-slate-800"
              >
                Reset
              </Button>
            )}
          </div>
        </div>

        {/* Filter feedback chips */}
        {(searchQuery || platformFilter !== 'ALL' || (activeTab === 'handlers' && statusFilter !== 'ALL')) && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-slate-500">
            <span>Filtering by:</span>
            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                Query: &quot;{searchQuery}&quot;
              </span>
            )}
            {platformFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-medium">
                Platform: {platformFilter}
              </span>
            )}
            {activeTab === 'handlers' && statusFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-medium">
                Status: {statusFilter}
              </span>
            )}
            <span className="text-slate-400">
              ({activeTab === 'handlers' ? filteredHandlers.length : filteredAccounts.length} match)
            </span>
          </div>
        )}
      </div>

      {/* 5. CONTENT: TAB 1 HANDLERS */}
      {activeTab === 'handlers' && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-center">
              <RefreshCw className="size-8 animate-spin text-emerald-600 mb-2" />
              <p className="text-sm font-medium text-slate-700">Loading social media handlers...</p>
              <p className="text-xs text-slate-400">Fetching records from CRM backend</p>
            </div>
          ) : filteredHandlers.length === 0 ? (
            <div className="py-16 text-center space-y-3 px-4">
              <div className="mx-auto size-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
                <Users className="size-6" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900">No handlers found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {searchQuery || platformFilter !== 'ALL' || statusFilter !== 'ALL'
                  ? 'No records match your active search and filter criteria.'
                  : 'No social media handlers have been created yet. Click "+ Add Handler" to register your first.'}
              </p>
              {allowed && (
                <Button
                  size="sm"
                  onClick={() => {
                    setSelectedHandler(null);
                    setDrawerMode('create');
                    setDrawerOpen(true);
                  }}
                  className="bg-[#20C466] hover:bg-[#1bb05b] text-white text-xs h-8"
                >
                  <Plus className="size-3.5 mr-1" />
                  Add New Handler
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Desktop Table View (>= lg) */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full min-w-[960px] table-fixed text-left text-xs text-slate-600 border-collapse">
                  <thead>
                    <tr className="bg-[#F8FAF9] border-b border-[#E2E8E5] text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                      <th className="w-[19%] py-3 px-4">Handler</th>
                      <th className="w-[24%] py-3 px-4">Account &amp; Channel</th>
                      <th className="w-[12%] py-3 px-4">Platform</th>
                      <th className="w-[15%] py-3 px-4">Client / Company</th>
                      <th className="w-[14%] py-3 px-4">Credential Status</th>
                      <th className="w-[9%] py-3 px-4">Status</th>
                      <th className="w-[110px] py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredHandlers.map((h) => {
                      return (
                        <tr
                          key={h.id}
                          className="hover:bg-[#F3F8F5]/70 transition-colors group cursor-pointer"
                          onClick={() => {
                            setSelectedHandler(h);
                            setDrawerMode('view');
                            setDrawerOpen(true);
                          }}
                        >
                          {/* Handler details */}
                          <td className="py-3.5 px-4 align-middle">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="size-8 rounded-full bg-[#E8F1EC] text-[#123D32] flex items-center justify-center font-bold text-xs border border-[#CDE2D6] shrink-0">
                                {(h.handlerName || 'H').charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold text-[#142D25] truncate">
                                  {h.handlerName || 'Unassigned'}
                                </p>
                                <p className="text-[11px] text-[#64748B] truncate">
                                  {h.handlerEmail || h.handlerPhone || 'No contact on file'}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Account & URL (strict truncation, zero overflow) */}
                          <td className="py-3.5 px-4 align-middle">
                            <div className="min-w-0 max-w-full space-y-0.5 overflow-hidden">
                              <p className="font-semibold text-[#142D25] truncate">
                                {h.accountName || '—'}
                              </p>
                              {h.accountUrl ? (
                                <a
                                  href={h.accountUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  title={h.accountUrl}
                                  className="flex max-w-full min-w-0 items-center gap-1 text-[11px] text-[#176B50] hover:text-[#123D32] hover:underline"
                                >
                                  <Globe className="size-2.5 shrink-0" />
                                  <span className="min-w-0 flex-1 truncate">
                                    {h.accountUrl.replace(/^https?:\/\//, '')}
                                  </span>
                                  <ExternalLink className="size-2.5 shrink-0" />
                                </a>
                              ) : (
                                <p className="text-[11px] text-[#64748B] truncate">
                                  {h.socialMediaId ? `@${h.socialMediaId}` : 'No URL / ID'}
                                </p>
                              )}
                            </div>
                          </td>

                          {/* Platform badge */}
                          <td className="py-3.5 px-4">
                            <PlatformBadge platform={h.platform} />
                          </td>

                          {/* Client / Customer */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5 text-slate-700">
                              <Building2 className="size-3.5 text-slate-400 shrink-0" />
                              <span className="font-medium truncate max-w-[150px]">
                                {h.customer?.companyName ||
                                  h.customer?.name ||
                                  (h.customerId ? `Customer #${h.customerId}` : 'All Customers')}
                              </span>
                            </div>
                          </td>

                          {/* Credential Status */}
                          <td className="py-3.5 px-4">
                            {h.passwordOnFile ? (
                              <Badge
                                variant="outline"
                                className="bg-emerald-50 text-emerald-700 border-emerald-200 font-medium text-[11px] gap-1"
                              >
                                <Lock className="size-2.5" />
                                Credential Stored
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="bg-slate-50 text-slate-500 border-slate-200 font-normal text-[11px] gap-1"
                              >
                                <Key className="size-2.5 text-slate-400" />
                                No Credential Flag
                              </Badge>
                            )}
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4">
                            <StatusBadge status={h.status} />
                          </td>

                          {/* Action Dropdown */}
                          <td
                            className="py-3.5 px-4 text-right"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="size-8 p-0 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
                                >
                                  <MoreVertical className="size-4" />
                                  <span className="sr-only">Open menu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-40">
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedHandler(h);
                                    setDrawerMode('view');
                                    setDrawerOpen(true);
                                  }}
                                  className="text-xs gap-2"
                                >
                                  <Eye className="size-3.5 text-slate-500" />
                                  View Details
                                </DropdownMenuItem>

                                {allowed && (
                                  <>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setSelectedHandler(h);
                                        setDrawerMode('edit');
                                        setDrawerOpen(true);
                                      }}
                                      className="text-xs gap-2"
                                    >
                                      <Edit3 className="size-3.5 text-blue-500" />
                                      Edit Handler
                                    </DropdownMenuItem>

                                    <DropdownMenuSeparator />

                                    <DropdownMenuItem
                                      onClick={() => {
                                        setHandlerToDelete(h);
                                        setDeleteDialogOpen(true);
                                      }}
                                      className="text-xs gap-2 text-rose-600 focus:text-rose-700 focus:bg-rose-50"
                                    >
                                      <Trash2 className="size-3.5" />
                                      Delete Handler
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile / Tablet Cards View (< lg) */}
              <div className="block lg:hidden divide-y divide-slate-100">
                {filteredHandlers.map((h) => {
                  return (
                    <div
                      key={h.id}
                      className="p-4 space-y-3 hover:bg-slate-50/50 transition-colors"
                      onClick={() => {
                        setSelectedHandler(h);
                        setDrawerMode('view');
                        setDrawerOpen(true);
                      }}
                    >
                      {/* Top row: Platform & Status */}
                      <div className="flex items-center justify-between gap-2">
                        <PlatformBadge platform={h.platform} />
                        <StatusBadge status={h.status} />
                      </div>

                      {/* Middle row: Handler name & Account */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-slate-900 text-sm">
                            {h.accountName || 'Unnamed Account'}
                          </h4>
                          {h.passwordOnFile && (
                            <Badge
                              variant="outline"
                              className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-medium"
                            >
                              <Lock className="size-2 mr-1" />
                              Encrypted
                            </Badge>
                          )}
                        </div>

                        {h.accountUrl && (
                          <a
                            href={h.accountUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:underline"
                          >
                            <Globe className="size-3" />
                            <span className="truncate max-w-[260px]">
                              {h.accountUrl.replace(/^https?:\/\//, '')}
                            </span>
                            <ExternalLink className="size-2.5" />
                          </a>
                        )}
                      </div>

                      {/* Bottom info row */}
                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 pt-2 border-t border-slate-100">
                        <div className="flex items-center gap-1.5 truncate">
                          <User className="size-3 text-slate-400 shrink-0" />
                          <span className="truncate">{h.handlerName || 'No handler'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 truncate">
                          <Building2 className="size-3 text-slate-400 shrink-0" />
                          <span className="truncate">
                            {h.customer?.companyName ||
                              h.customer?.name ||
                              (h.customerId ? `Customer #${h.customerId}` : 'All')}
                          </span>
                        </div>
                      </div>

                      {/* Card Action Row */}
                      <div
                        className="flex items-center justify-end gap-2 pt-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedHandler(h);
                            setDrawerMode('view');
                            setDrawerOpen(true);
                          }}
                          className="h-8 text-xs text-slate-600"
                        >
                          <Eye className="size-3 mr-1" />
                          Details
                        </Button>

                        {allowed && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedHandler(h);
                                setDrawerMode('edit');
                                setDrawerOpen(true);
                              }}
                              className="h-8 text-xs text-slate-700"
                            >
                              <Edit3 className="size-3 mr-1" />
                              Edit
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setHandlerToDelete(h);
                                setDeleteDialogOpen(true);
                              }}
                              className="h-8 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                            >
                              <Trash2 className="size-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* 6. CONTENT: TAB 2 CONNECTED ACCOUNTS OVERVIEW */}
      {activeTab === 'accounts' && (
        <div className="space-y-4">
          <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-4 text-xs text-blue-900 flex items-start gap-3">
            <Radio className="size-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-semibold text-blue-950">Customer Connected Social Accounts</p>
              <p className="text-blue-800/90 leading-relaxed">
                These accounts have been linked via OAuth from the customer-facing dashboard.
                Social media posts generated in AI Studio & Social can be published directly to these channels.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white py-16 flex flex-col items-center justify-center text-center">
              <RefreshCw className="size-8 animate-spin text-emerald-600 mb-2" />
              <p className="text-sm font-medium text-slate-700">Loading connected accounts...</p>
            </div>
          ) : filteredAccounts.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center space-y-2 px-4">
              <Share2 className="mx-auto size-10 text-slate-300" />
              <h3 className="text-sm font-semibold text-slate-900">No connected accounts</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No customer social media accounts have been connected yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAccounts.map((account) => {
                const isExpiringSoon =
                  account.tokenExpiresAt &&
                  new Date(account.tokenExpiresAt).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000;

                return (
                  <div
                    key={account.id}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow space-y-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <PlatformBadge platform={account.platform} />
                        <h4 className="font-bold text-slate-900 text-sm pt-1">
                          {account.accountName || 'Unnamed Account'}
                        </h4>
                        <p className="text-xs text-slate-500 font-mono">
                          {account.username || account.externalAccountId || 'No username'}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-[11px] font-semibold ${
                          account.isConnected !== false
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {account.isConnected !== false ? 'Connected' : 'Disconnected'}
                      </Badge>
                    </div>

                    <div className="pt-2 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Owner:</span>
                        <span className="font-medium text-slate-800">
                          {account.customer?.companyName ||
                            account.customer?.name ||
                            `Customer #${account.customerId}`}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Token Status:</span>
                        {account.tokenExpiresAt ? (
                          <span
                            className={`font-medium ${
                              isExpiringSoon ? 'text-amber-600' : 'text-slate-700'
                            }`}
                          >
                            Exp {String(account.tokenExpiresAt).slice(0, 10)}
                          </span>
                        ) : (
                          <span className="text-slate-400">Permanent / Not Expiring</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 7. HANDLER DRAWER (CREATE / EDIT / VIEW) */}
      <SsmHandlerDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        handler={selectedHandler}
        mode={drawerMode}
        onSuccess={() => fetchData(true)}
      />

      {/* 8. DELETE CONFIRMATION DIALOG */}
      <SsmDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        handlerName={handlerToDelete?.handlerName || handlerToDelete?.accountName || 'this handler'}
        loading={deleteLoading}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}

// -------------------------------------------------------------------------
// Helper components: PlatformBadge & StatusBadge
// -------------------------------------------------------------------------

function PlatformBadge({ platform }: { platform: string }) {
  const p = (platform || '').toUpperCase();

  switch (p) {
    case 'INSTAGRAM':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-pink-50 text-pink-700 border border-pink-200">
          <FontAwesomeIcon icon={faInstagram} className="size-3 text-pink-600" />
          Instagram
        </span>
      );
    case 'FACEBOOK':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          <FontAwesomeIcon icon={faFacebook} className="size-3 text-blue-600" />
          Facebook
        </span>
      );
    case 'YOUTUBE':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200">
          <FontAwesomeIcon icon={faYoutube} className="size-3 text-red-600" />
          YouTube
        </span>
      );
    case 'LINKEDIN':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
          <FontAwesomeIcon icon={faLinkedin} className="size-3 text-sky-600" />
          LinkedIn
        </span>
      );
    case 'TWITTER':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-800 border border-slate-200">
          <FontAwesomeIcon icon={faXTwitter} className="size-3 text-slate-800" />
          Twitter / X
        </span>
      );
    case 'TIKTOK':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
          <FontAwesomeIcon icon={faTiktok} className="size-3 text-purple-600" />
          TikTok
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-50 text-slate-700 border border-slate-200">
          <Share2 className="size-3 text-slate-500" />
          {platform || 'Other'}
        </span>
      );
  }
}

function StatusBadge({ status }: { status: string }) {
  const s = (status || '').toUpperCase();

  switch (s) {
    case 'ACTIVE':
      return (
        <Badge
          variant="outline"
          className="bg-emerald-50 text-emerald-700 border-emerald-200 font-medium text-[11px] gap-1"
        >
          <span className="size-1.5 rounded-full bg-emerald-500" />
          Active
        </Badge>
      );
    case 'INACTIVE':
      return (
        <Badge
          variant="outline"
          className="bg-slate-50 text-slate-600 border-slate-200 font-medium text-[11px] gap-1"
        >
          <span className="size-1.5 rounded-full bg-slate-400" />
          Inactive
        </Badge>
      );
    case 'PAUSED':
      return (
        <Badge
          variant="outline"
          className="bg-amber-50 text-amber-700 border-amber-200 font-medium text-[11px] gap-1"
        >
          <span className="size-1.5 rounded-full bg-amber-500" />
          Paused
        </Badge>
      );
    default:
      return (
        <Badge
          variant="outline"
          className="bg-slate-50 text-slate-600 border-slate-200 font-medium text-[11px]"
        >
          {status || 'Unknown'}
        </Badge>
      );
  }
}
