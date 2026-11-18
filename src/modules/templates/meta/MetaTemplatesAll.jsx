'use client';

import * as React from 'react';
import Link from 'next/link';
import api from '../../../../lib/api';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import {
  faBullhorn,
  faPlus,
  faRotate,
  faSearch,
  faDownload,
  faMessage,
  faClock,
  faCircleCheck,
  faCircleXmark,
  faBan,
  faPause,
  faEye,
  faPaperPlane,
  faCopy,
  faCheck,
  faXmark,
  faGlobe,
  faSliders,
  faMobileScreen,
  faCircleExclamation,
  faCheckDouble,
  faCode,
} from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import {
  RotateCw,
  Eye,
  Send,
  Pencil,
  Copy,
  Power,
  History,
  MoreHorizontal,
  AlertCircle,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { downloadCsv, envelope, pageOf, Pager, rowsOf } from '../template-shared';
import { MetaTemplateDetails, WhatsAppPreview } from './meta-shared';
import { MetaTemplateEdit } from './MetaTemplateEdit';

const LIST_TABS = [
  { label: 'All Templates', value: 'ALL' },
  { label: 'Single Templates', value: 'SINGLE' },
  { label: 'Campaigns', value: 'CAMPAIGN' },
];

const STATUS_CONFIG = {
  APPROVED: {
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
    label: 'Approved',
    icon: faCircleCheck,
  },
  PENDING: {
    bg: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-500 animate-pulse',
    label: 'Pending',
    icon: faClock,
  },
  REJECTED: {
    bg: 'bg-rose-50 text-rose-700 border-rose-200',
    dot: 'bg-rose-500',
    label: 'Rejected',
    icon: faCircleXmark,
  },
  PAUSED: {
    bg: 'bg-blue-50 text-blue-700 border-blue-200',
    dot: 'bg-blue-500',
    label: 'Paused',
    icon: faPause,
  },
  DISABLED: {
    bg: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-400',
    label: 'Disabled',
    icon: faBan,
  },
  DISABLED_BY_META: {
    bg: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-400',
    label: 'Disabled',
    icon: faBan,
  },
};

function metaStatusInfo(row) {
  if (!row) {
    return { bg: 'bg-slate-100 text-slate-700 border-slate-200', dot: 'bg-slate-400', label: 'Unknown' };
  }
  if (row.syncStatus === 'SYNC_FAILED') {
    return { bg: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500', label: 'Sync Failed' };
  }
  if (row.syncStatus === 'NOT_SYNCED' || !row.metaTemplateId || String(row.metaTemplateId).startsWith('seed_')) {
    return { bg: 'bg-slate-100 text-slate-700 border-slate-200', dot: 'bg-slate-400', label: 'Not Synced' };
  }
  return STATUS_CONFIG[String(row.status || '').toUpperCase()] || {
    bg: 'bg-slate-100 text-slate-700 border-slate-200', dot: 'bg-slate-400', label: row.status || 'Unknown',
  };
}

function TemplateRowActions({
  row,
  statusInfo,
  syncingId,
  openPreview,
  syncTemplate,
  toggleTemplate,
  setEditing,
  setDeletingTemplate,
}) {
  const isSyncing = syncingId === row?.id;
  const isLocalActive = row?.isLocalActive !== false;
  const statusKey = String(row?.status || '').toUpperCase();
  const syncStatus = String(row?.syncStatus || '').toUpperCase();
  const notLinked =
    syncStatus === 'NOT_SYNCED' || !row?.metaTemplateId || String(row?.metaTemplateId).startsWith('seed_');

  // Determine status classification
  let statusMode = 'APPROVED';
  if (!isLocalActive) {
    statusMode = 'INACTIVE';
  } else if (syncStatus === 'SYNC_FAILED') {
    statusMode = 'SYNC_FAILED';
  } else if (notLinked) {
    statusMode = 'NOT_SYNCED';
  } else if (statusKey === 'REJECTED') {
    statusMode = 'REJECTED';
  } else if (statusKey === 'PENDING') {
    statusMode = 'PENDING';
  } else if (statusKey === 'APPROVED') {
    statusMode = 'APPROVED';
  } else {
    statusMode = 'APPROVED';
  }

  // Primary & Secondary actions based on specification
  let primary = {
    label: 'Sync',
    icon: RotateCw,
    onClick: () => syncTemplate(row),
    title: 'Sync status with Meta',
  };
  let secondary = {
    label: 'View',
    icon: Eye,
    onClick: () => openPreview(row, 'preview'),
    title: 'View template preview and details',
  };

  switch (statusMode) {
    case 'INACTIVE':
      primary = {
        label: 'Activate',
        icon: Power,
        onClick: () => toggleTemplate(row),
        title: 'Activate template in CRM',
      };
      secondary = {
        label: 'View',
        icon: Eye,
        onClick: () => openPreview(row, 'preview'),
        title: 'View template preview and details',
      };
      break;

    case 'NOT_SYNCED':
      primary = {
        label: 'Submit to Meta',
        icon: UploadCloud,
        onClick: () => syncTemplate(row),
        title: 'Submit this template to Meta for review',
      };
      secondary = {
        label: 'View',
        icon: Eye,
        onClick: () => openPreview(row, 'preview'),
        title: 'View template preview and details',
      };
      break;

    case 'PENDING':
      primary = {
        label: 'Refresh Status',
        icon: RotateCw,
        onClick: () => syncTemplate(row),
        title: 'Refresh approval status from Meta',
      };
      secondary = {
        label: 'View',
        icon: Eye,
        onClick: () => openPreview(row, 'preview'),
        title: 'View template preview and details',
      };
      break;

    case 'REJECTED':
      primary = {
        label: 'View Rejection',
        icon: AlertCircle,
        onClick: () => openPreview(row, 'preview'),
        title: row?.rejectionReason ? `Meta rejection reason: ${row.rejectionReason}` : 'View rejection reason',
      };
      secondary = {
        label: 'Retry Submission',
        icon: RotateCw,
        onClick: () => syncTemplate(row),
        title: 'Retry template submission to Meta',
      };
      break;

    case 'SYNC_FAILED':
      primary = {
        label: 'Retry Sync',
        icon: RotateCw,
        onClick: () => syncTemplate(row),
        title: 'Retry synchronization with Meta',
      };
      secondary = {
        label: 'View Error',
        icon: AlertCircle,
        onClick: () => {
          if (row?.syncError) toast.error(row.syncError);
          openPreview(row, 'preview');
        },
        title: row?.syncError || 'View sync error details',
      };
      break;

    case 'APPROVED':
    default:
      primary = {
        label: 'Sync',
        icon: RotateCw,
        onClick: () => syncTemplate(row),
        title: 'Sync status with Meta',
      };
      secondary = {
        label: 'View',
        icon: Eye,
        onClick: () => openPreview(row, 'preview'),
        title: 'View template preview and details',
      };
      break;
  }

  const PrimaryIcon = primary.icon;
  const SecondaryIcon = secondary.icon;

  return (
    <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
      {/* Primary Action Button */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isSyncing}
            onClick={primary.onClick}
            className="h-8 px-2.5 text-xs font-semibold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 hover:text-emerald-900 border-emerald-200 transition-colors shadow-2xs rounded-lg whitespace-nowrap"
          >
            <PrimaryIcon className={`mr-1.5 h-3.5 w-3.5 shrink-0 ${isSyncing ? 'animate-spin text-emerald-700' : 'text-emerald-600'}`} />
            {isSyncing ? 'Syncing…' : primary.label}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>{primary.title}</p>
        </TooltipContent>
      </Tooltip>

      {/* Secondary Action Button */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isSyncing}
            onClick={secondary.onClick}
            className="h-8 px-2 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 rounded-lg whitespace-nowrap"
          >
            <SecondaryIcon className="mr-1 h-3.5 w-3.5 text-slate-400 shrink-0" />
            {secondary.label}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>{secondary.title}</p>
        </TooltipContent>
      </Tooltip>

      {/* More Actions Dropdown */}
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-slate-500 hover:bg-slate-100 hover:text-slate-800 rounded-lg shrink-0"
                aria-label={`More actions for ${row?.name || 'template'}`}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>More actions</p>
          </TooltipContent>
        </Tooltip>

        <DropdownMenuContent align="end" side="bottom" className="w-52 bg-white shadow-lg border border-slate-200 rounded-xl">
          <DropdownMenuItem onClick={() => openPreview(row, 'test')}>
            <Send className="mr-2 h-4 w-4 text-emerald-600" />
            Test Template
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setEditing({ row, duplicate: false })}>
            <Pencil className="mr-2 h-4 w-4 text-slate-500" />
            Edit Template
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setEditing({ row, duplicate: true })}>
            <Copy className="mr-2 h-4 w-4 text-slate-500" />
            Duplicate Template
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => toggleTemplate(row)}>
            <Power className="mr-2 h-4 w-4 text-slate-500" />
            {isLocalActive ? 'Deactivate' : 'Activate'}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              if (row?.lastSyncedAt) {
                toast.info(`Last synced with Meta: ${new Date(row.lastSyncedAt).toLocaleString()}`);
              } else {
                toast.info('This template has never been synced with Meta.');
              }
              openPreview(row, 'details');
            }}
          >
            <History className="mr-2 h-4 w-4 text-slate-500" />
            View Sync History
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setDeletingTemplate(row)}
            className="text-rose-600 focus:bg-rose-50 focus:text-rose-700"
          >
            <Trash2 className="mr-2 h-4 w-4 text-rose-500" />
            Delete Template
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

const CATEGORY_CONFIG = {
  MARKETING: {
    bg: 'bg-purple-50 text-purple-700 border-purple-200',
    label: 'Marketing',
  },
  UTILITY: {
    bg: 'bg-sky-50 text-sky-700 border-sky-200',
    label: 'Utility',
  },
  AUTHENTICATION: {
    bg: 'bg-amber-50 text-amber-700 border-amber-200',
    label: 'Auth',
  },
};

export function MetaTemplatesAll() {
  const [rows, setRows] = React.useState([]);
  const [campaignRows, setCampaignRows] = React.useState([]);
  const [stats, setStats] = React.useState({});
  const [listTab, setListTab] = React.useState('ALL');
  const [search, setSearch] = React.useState('');
  const [status, setStatus] = React.useState('ALL');
  const [language, setLanguage] = React.useState('ALL');
  const [languageChoices, setLanguageChoices] = React.useState(['ALL']);
  const [category, setCategory] = React.useState('ALL');
  const [templateType, setTemplateType] = React.useState('ALL');
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(10);
  const [pages, setPages] = React.useState(1);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [syncing, setSyncing] = React.useState(false);
  const [syncInfo, setSyncInfo] = React.useState(null);
  const [syncingId, setSyncingId] = React.useState(null);
  const [selected, setSelected] = React.useState(null);
  const [editing, setEditing] = React.useState(null);
  const [drawerTab, setDrawerTab] = React.useState('preview'); // 'preview' | 'test' | 'details'
  const [copiedCode, setCopiedCode] = React.useState(null);
  const [deletingTemplate, setDeletingTemplate] = React.useState(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [deleteReason, setDeleteReason] = React.useState('');

  // Test Send state
  const [testPhone, setTestPhone] = React.useState('');
  const [testCountry, setTestCountry] = React.useState('+91');
  const [testVariables, setTestVariables] = React.useState({});
  const [testSending, setTestSending] = React.useState(false);
  const [testResult, setTestResult] = React.useState(null);

  const sourceFilter =
    listTab === 'SINGLE'
      ? 'SINGLE'
      : listTab === 'CAMPAIGN'
      ? 'CAMPAIGN'
      : templateType !== 'ALL'
      ? templateType
      : undefined;

  const load = React.useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      if (listTab === 'CAMPAIGN') {
        const payload = envelope(
          await api.get('/templates/meta/campaigns', {
            params: {
              page,
              limit,
              search: search || undefined,
              status: status === 'ALL' ? undefined : status,
            },
          }),
        );
        const list = rowsOf(payload);
        const pagination = pageOf(payload, { page, totalPages: 1, total: list.length });
        setCampaignRows(list);
        setRows([]);
        setPages(Math.max(1, Number(pagination.totalPages) || 1));
        setTotal(Number(pagination.total) || list.length);
      } else {
        const payload = envelope(
          await api.get('/templates/meta', {
            params: {
              page,
              limit,
              search: search || undefined,
              status: status === 'ALL' ? undefined : status,
              language: language === 'ALL' ? undefined : language,
              category: category === 'ALL' ? undefined : category,
              source: sourceFilter,
            },
          }),
        );
        const list = rowsOf(payload);
        const pagination = pageOf(payload, { page, totalPages: 1, total: list.length });
        setRows(list);
        setCampaignRows([]);
        if (language === 'ALL') {
          setLanguageChoices([
            'ALL',
            ...Array.from(new Set(list.map((row) => row.language).filter(Boolean))),
          ]);
        }
        setPages(Math.max(1, Number(pagination.totalPages) || 1));
        setTotal(Number(pagination.total) || list.length);
        if (payload?.stats) setStats(payload.stats);
      }

      const statsPayload = envelope(await api.get('/templates/meta/stats'));
      if (statsPayload?.total !== undefined) setStats(statsPayload);
      else if (statsPayload?.data) setStats(statsPayload.data);
    } catch (err) {
      setError(err?.response?.data?.message || 'Meta templates could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, status, language, category, sourceFilter, listTab]);

  React.useEffect(() => {
    load();
  }, [load]);

  async function sync() {
    setSyncing(true);
    try {
      const result = envelope(await api.post('/templates/meta/sync', {}));
      setSyncInfo(result);
      if (result?.success === false) {
        toast.error(result?.message || 'Meta sync failed.');
      } else {
        toast.success(result?.message || 'Meta templates synchronized successfully');
      }
      await load();
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || 'Meta sync failed.';
      setSyncInfo({ success: false, message });
      toast.error(message);
    } finally {
      setSyncing(false);
    }
  }

  async function syncTemplate(row) {
    setSyncingId(row.id);
    try {
      const notLinked = row.syncStatus === 'NOT_SYNCED' || !row.metaTemplateId || String(row.metaTemplateId).startsWith('seed_');
      const response = envelope(await api.post(`/templates/meta/${row.id}/${notLinked ? 'submit' : 'sync'}`, {}));
      toast.success(response?.message || `${row.name} status synchronized with Meta.`);
      await load();
      if (selected?.id === row.id) setSelected(response);
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || 'Template synchronization failed.';
      toast.error(message);
      await load();
    } finally {
      setSyncingId(null);
    }
  }

  async function toggleTemplate(template) {
    try {
      await api.patch(`/templates/meta/${template.id}/toggle`, {});
      toast.success(
        template.isLocalActive
          ? `Deactivated "${template.name}"`
          : `Activated "${template.name}"`,
      );
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to toggle template status.');
    }
  }

  async function handleDeleteTemplate() {
    if (!deletingTemplate) return;
    setIsDeleting(true);
    try {
      await api.delete(`/templates/meta/${deletingTemplate.id}`, {
        data: { reason: deleteReason ? deleteReason.trim() : undefined },
      });
      toast.success(`Template "${deletingTemplate.name || deletingTemplate.templateName}" deleted successfully.`);
      setDeletingTemplate(null);
      setDeleteReason('');
      await load();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to delete template.';
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  }

  function copyCode(code) {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success('Template code copied to clipboard');
    setTimeout(() => {
      setCopiedCode((curr) => (curr === code ? null : curr));
    }, 2000);
  }

  function openPreview(template, defaultTab = 'preview') {
    setSelected(template);
    setDrawerTab(defaultTab);
    setTestVariables({});
    setTestResult(null);
  }

  const hasActiveFilters =
    search.trim() !== '' ||
    status !== 'ALL' ||
    category !== 'ALL' ||
    language !== 'ALL' ||
    templateType !== 'ALL';

  function clearAllFilters() {
    setSearch('');
    setStatus('ALL');
    setCategory('ALL');
    setLanguage('ALL');
    setTemplateType('ALL');
    setPage(1);
  }

  const kpis = [
    {
      title: 'All Templates',
      value: stats.total || 0,
      icon: faMessage,
      statusKey: 'ALL',
      color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      description: 'Total synced from Meta & CRM',
    },
    {
      title: 'Approved',
      value: stats.approved || 0,
      icon: faCircleCheck,
      statusKey: 'APPROVED',
      color: 'text-teal-700 bg-teal-50 border-teal-200',
      description: 'Ready to send immediately',
    },
    {
      title: 'In Review',
      value: stats.pending || 0,
      icon: faClock,
      statusKey: 'PENDING',
      color: 'text-amber-700 bg-amber-50 border-amber-200',
      description: 'Awaiting Meta verification',
    },
    {
      title: 'Rejected',
      value: stats.rejected || 0,
      icon: faCircleXmark,
      statusKey: 'REJECTED',
      color: 'text-rose-700 bg-rose-50 border-rose-200',
      description: 'Needs revision & resubmission',
    },
    {
      title: 'Paused',
      value: stats.paused || 0,
      icon: faPause,
      statusKey: 'PAUSED',
      color: 'text-blue-700 bg-blue-50 border-blue-200',
      description: 'Temporarily on hold',
    },
    {
      title: 'Disabled',
      value: stats.disabled || 0,
      icon: faBan,
      statusKey: 'DISABLED',
      color: 'text-slate-700 bg-slate-100 border-slate-200',
      description: 'Inactive / archived in CRM',
    },
  ];

  if (editing) return <MetaTemplateEdit template={editing.row} duplicate={editing.duplicate} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />;

  return (
    <div className="min-w-0 w-full max-w-full space-y-5 pb-[max(2rem,env(safe-area-inset-bottom))]">
      {/* ── Page Header ────────────────────────────────────────────── */}
      <PageHeader
        category="TEMPLATES & ASSETS"
        title="WhatsApp Templates"
        icon={faMessage}
        description="Manage WhatsApp templates used by lead stage notifications and campaigns."
        actions={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <Button
              type="button"
              variant="outline"
              disabled={syncing}
              onClick={sync}
              className="w-full sm:w-auto border-slate-200 hover:bg-slate-50 transition-all font-medium text-slate-700"
            >
              <FontAwesomeIcon icon={faRotate} className={`mr-2 ${syncing ? 'animate-spin text-emerald-600' : 'text-slate-500'}`} />
              {syncing ? 'Syncing with Meta…' : 'Sync with Meta'}
            </Button>
            <Button
              asChild
              className="w-full sm:w-auto bg-[#16A34A] hover:bg-[#15803D] text-white shadow-sm transition-all font-semibold"
            >
              <Link href="/admin/sections/meta-templates/create">
                <FontAwesomeIcon icon={faPlus} className="mr-2" />
                New WhatsApp Template
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="w-full sm:w-auto border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/70 text-emerald-800 font-semibold transition-all"
            >
              <Link href="/admin/sections/meta-templates/campaigns">
                <FontAwesomeIcon icon={faBullhorn} className="mr-2 text-emerald-600" />
                Create Campaign
              </Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="hidden sm:inline-flex border-slate-200 text-slate-500 hover:text-slate-800"
              onClick={load}
              disabled={loading}
              title="Refresh templates"
            >
              <FontAwesomeIcon icon={faRotate} className={loading ? 'animate-spin' : ''} />
            </Button>
          </div>
        }
      />

      {/* ── Sync Feedback Banner (Dismissible) ────────────────────── */}
      {syncInfo && (
        <div
          className={`flex items-start justify-between gap-3 rounded-xl border p-4 text-xs sm:text-sm shadow-xs transition-all ${
            syncInfo.success === false
              ? 'border-rose-200 bg-rose-50 text-rose-800'
              : 'border-emerald-200 bg-emerald-50/70 text-emerald-900'
          }`}
        >
          <div className="flex items-start gap-3">
            <span
              className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                syncInfo.success === false
                  ? 'bg-rose-200 text-rose-700'
                  : 'bg-emerald-200 text-emerald-800'
              }`}
            >
              <FontAwesomeIcon icon={syncInfo.success === false ? faCircleExclamation : faCheck} className="text-xs" />
            </span>
            <div className="space-y-1">
              <p className="font-semibold">
                {syncInfo.success === false ? 'Meta Synchronization Failed' : 'Meta Synchronization Complete'}
              </p>
              <p className="text-slate-600 leading-relaxed">{syncInfo.message}</p>
              {syncInfo.fetched !== undefined && (
                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs font-medium">
                  <span className="rounded-md bg-white/80 px-2 py-0.5 border border-slate-200/60 text-slate-700">
                    Fetched: {syncInfo.fetched ?? 0}
                  </span>
                  <span className="rounded-md bg-white/80 px-2 py-0.5 border border-slate-200/60 text-emerald-700">
                    Added: {syncInfo.created ?? 0}
                  </span>
                  <span className="rounded-md bg-white/80 px-2 py-0.5 border border-slate-200/60 text-blue-700">
                    Updated: {syncInfo.updated ?? 0}
                  </span>
                  <span className="rounded-md bg-white/80 px-2 py-0.5 border border-slate-200/60 text-slate-600">
                    Unchanged: {syncInfo.unchanged ?? 0}
                  </span>
                  {syncInfo.failed?.length > 0 && (
                    <span className="rounded-md bg-white/80 px-2 py-0.5 border border-rose-200 text-rose-700">
                      Failed: {syncInfo.failed.length}
                    </span>
                  )}
                </div>
              )}
              {syncInfo.failed?.length > 0 && <ul className="max-h-24 space-y-1 overflow-auto text-xs text-rose-700">{syncInfo.failed.slice(0, 10).map((item) => <li key={`${item.name}:${item.reason}`}>{item.name}: {item.reason}</li>)}</ul>}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSyncInfo(null)}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
            aria-label="Dismiss message"
          >
            <FontAwesomeIcon icon={faXmark} className="text-sm" />
          </button>
        </div>
      )}

      {/* ── Navigation Tabs & Filter Toolbar ──────────────────────── */}
      <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
        <nav aria-label="Template sections" className="flex flex-wrap gap-2 border-b border-[#E2E8E5] pb-3 text-sm font-medium">
          <Link href="/admin/sections/email-templates" className="rounded-md px-3 py-2 text-[#718078] hover:bg-slate-50">Email Templates</Link>
          <span aria-current="page" className="rounded-md bg-[#163A2E] px-3 py-2 text-white">WhatsApp Templates</span>
          <Link href="/admin/settings/notifications" className="rounded-md px-3 py-2 text-[#718078] hover:bg-slate-50">Notification Settings</Link>
        </nav>
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-sm no-scrollbar">
          {LIST_TABS.map((tab) => {
            const isActive = listTab === tab.value;
            const count =
              tab.value === 'CAMPAIGN'
                ? stats.campaigns ?? campaignRows.length ?? 0
                : tab.value === 'SINGLE'
                ? stats.single ?? 0
                : stats.total ?? total ?? 0;

            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => {
                  setListTab(tab.value);
                  setPage(1);
                }}
                className={`flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-[#16A34A] text-white shadow-sm'
                    : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
                }`}
              >
                <span>{tab.label}</span>
                {count > 0 && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] sm:text-xs font-bold ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-white text-slate-600 border border-slate-200'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col gap-2.5 pt-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between border-t border-slate-100">
          <div className="relative flex-1 min-w-[240px] sm:max-w-md">
            <FontAwesomeIcon
              icon={faSearch}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400"
            />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search WhatsApp templates..."
              className="h-10 pl-8 pr-8 text-xs sm:text-sm border-slate-200 rounded-lg focus-visible:ring-emerald-500"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                aria-label="Clear search"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" className="h-10" onClick={() => { setPage(1); load(); }}><FontAwesomeIcon icon={faSearch} className="mr-2" />Search</Button>
            {/* Status Dropdown */}
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs sm:text-sm font-medium text-slate-700 hover:border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
            >
              {['ALL', 'APPROVED', 'PENDING', 'REJECTED', 'PAUSED', 'DISABLED'].map((item) => (
                <option key={item} value={item}>
                  {item === 'ALL' ? 'All Statuses' : item.charAt(0) + item.slice(1).toLowerCase()}
                </option>
              ))}
            </select>

            {/* Category Dropdown */}
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs sm:text-sm font-medium text-slate-700 hover:border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
            >
              {['ALL', 'UTILITY', 'MARKETING', 'AUTHENTICATION'].map((item) => (
                <option key={item} value={item}>
                  {item === 'ALL' ? 'All Categories' : item.charAt(0) + item.slice(1).toLowerCase()}
                </option>
              ))}
            </select>

            {/* Language Dropdown */}
            <select
              value={language}
              onChange={(e) => {
                setLanguage(e.target.value);
                setPage(1);
              }}
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs sm:text-sm font-medium text-slate-700 hover:border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
            >
              {languageChoices.map((item) => (
                <option key={item} value={item}>
                  {item === 'ALL' ? 'All Languages' : item}
                </option>
              ))}
            </select>

            {/* Origin Dropdown (All Templates tab) */}
            {listTab === 'ALL' && (
              <select
                value={templateType}
                onChange={(e) => {
                  setTemplateType(e.target.value);
                  setPage(1);
                }}
                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs sm:text-sm font-medium text-slate-700 hover:border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
              >
                {['ALL', 'META_SYNC', 'QB_SINGLE', 'QB_CAMPAIGN'].map((item) => (
                  <option key={item} value={item}>
                    {item === 'ALL'
                      ? 'All Origins'
                      : item.replace('QB_', 'QB ').replace('META_', 'Meta ')}
                  </option>
                ))}
              </select>
            )}

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="h-10 text-xs text-slate-500 hover:text-slate-800"
              >
                <FontAwesomeIcon icon={faXmark} className="mr-1.5" />
                Clear
              </Button>
            )}

            {/* Export CSV Button */}
            <Button
              type="button"
              variant="outline"
              className="h-10 border-slate-200 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50"
              onClick={() =>
                downloadCsv(
                  listTab === 'CAMPAIGN' ? 'whatsapp-campaigns.csv' : 'meta-templates.csv',
                  listTab === 'CAMPAIGN'
                    ? [
                        { key: 'name', label: 'Campaign' },
                        { key: 'status', label: 'Status' },
                        { key: 'recipientCount', label: 'Recipients' },
                        { key: 'sentCount', label: 'Sent' },
                      ]
                    : [
                        { key: 'name', label: 'Name' },
                        { key: 'templateName', label: 'Code' },
                        { key: 'language', label: 'Language' },
                        { key: 'category', label: 'Category' },
                        { key: 'status', label: 'Approval' },
                      ],
                  listTab === 'CAMPAIGN' ? campaignRows : rows,
                )
              }
            >
              <FontAwesomeIcon icon={faDownload} className="mr-1.5 text-slate-500" />
              Export CSV
            </Button>
          </div>
        </div>
      </div>

      {/* ── Desktop & Tablet Table (>= 768px) ──────────────────────── */}
      <div className="hidden lg:block">
        <div className="overflow-x-auto rounded-xl border border-slate-200/80 bg-white shadow-xs">
          {listTab === 'CAMPAIGN' ? (
            <table className="min-w-full text-left text-sm text-slate-800">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3.5">Campaign Name</th>
                  <th className="px-4 py-3.5">Template</th>
                  <th className="px-4 py-3.5">Audience</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Sent</th>
                  <th className="px-4 py-3.5">Scheduled</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                      <FontAwesomeIcon icon={faRotate} className="mr-2 animate-spin text-emerald-600" />
                      Loading campaigns…
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-rose-600">
                      <FontAwesomeIcon icon={faCircleExclamation} className="mr-2" />
                      {error}
                    </td>
                  </tr>
                ) : campaignRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center">
                      <div className="mx-auto max-w-sm space-y-3">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                          <FontAwesomeIcon icon={faBullhorn} className="text-xl" />
                        </div>
                        <p className="font-semibold text-slate-800">No WhatsApp campaigns yet</p>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Launch your first broadcast campaign using approved WhatsApp Meta templates.
                        </p>
                        <Button asChild size="sm" className="bg-[#16A34A] hover:bg-[#15803D] text-white">
                          <Link href="/admin/sections/meta-templates/campaigns">
                            <FontAwesomeIcon icon={faPlus} className="mr-1.5" />
                            Create Campaign
                          </Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  campaignRows.map((row) => (
                    <tr key={row.id} className="group transition-colors hover:bg-slate-50/70">
                      <td className="px-4 py-3.5 font-semibold text-slate-900">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
                            <FontAwesomeIcon icon={faBullhorn} className="text-xs" />
                          </div>
                          <span className="truncate">{row.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-600">
                        {row.metaTemplate?.name || row.metaTemplate?.templateName || '—'}
                      </td>
                      <td className="px-4 py-3.5 text-xs font-semibold text-slate-700">
                        {row.recipientCount ?? 0} recipients
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                          {row.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-600">
                        {row.sentCount ?? 0}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-500">
                        {row.scheduledAt ? new Date(row.scheduledAt).toLocaleString() : '—'}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <Button asChild variant="ghost" size="sm" className="h-8 text-xs font-semibold text-emerald-700 hover:bg-emerald-50">
                          <Link href="/admin/sections/meta-templates/campaigns">
                            View Campaigns
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="min-w-full text-left text-sm text-slate-800">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3.5">Template Name</th>
                  <th className="px-4 py-3.5">Meta Template Name</th>
                  <th className="px-4 py-3.5">Language</th>
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-4 py-3.5">Approval Status</th>
                  <th className="px-4 py-3.5">Header / PDF</th>
                  <th className="px-4 py-3.5">Last Synced</th>
                  <th className="sticky right-0 z-20 bg-slate-50/95 backdrop-blur-xs px-4 py-3.5 text-right shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.06)]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                      <FontAwesomeIcon icon={faRotate} className="mr-2 animate-spin text-emerald-600" />
                      Loading WhatsApp templates…
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-rose-600">
                      <FontAwesomeIcon icon={faCircleExclamation} className="mr-2" />
                      {error}
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center">
                      <div className="mx-auto max-w-sm space-y-3">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                          <FontAwesomeIcon icon={faMessage} className="text-xl" />
                        </div>
                        <p className="font-semibold text-slate-800">No WhatsApp templates found</p>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          {hasActiveFilters
                            ? 'No templates match your selected filters. Try clearing filters or search terms.'
                            : 'No WhatsApp templates are currently available. Sync directly from Meta or create a new template.'}
                        </p>
                        {hasActiveFilters ? (
                          <Button type="button" variant="outline" size="sm" onClick={clearAllFilters}>
                            Clear Filters
                          </Button>
                        ) : (
                          <Button type="button" size="sm" onClick={sync} className="bg-[#16A34A] hover:bg-[#15803D] text-white">
                            <FontAwesomeIcon icon={faRotate} className="mr-1.5" />
                            Sync from Meta
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => {
                    const statusInfo = metaStatusInfo(row);
                    const catInfo = CATEGORY_CONFIG[row.category] || {
                      bg: 'bg-slate-100 text-slate-700 border-slate-200',
                      label: row.category,
                    };
                    const isCopied = copiedCode === (row.templateName || row.key);

                    return (
                      <tr
                        key={row.id}
                        className="group transition-colors hover:bg-slate-50/70"
                      >
                        {/* Name Column */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                              <FontAwesomeIcon icon={faWhatsapp} className="text-base" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors">
                                {row.name}
                              </p>
                              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                                <span className="break-all font-mono">{row.key || '—'}</span>
                                {row.headerType && row.headerType !== 'NONE' && (
                                  <>
                                    <span>•</span>
                                    <span>Header: {row.headerType}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Code / Key Column */}
                        <td className="px-4 py-3.5">
                          <div className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50/80 px-2 py-1 font-mono text-xs text-slate-700">
                            <FontAwesomeIcon icon={faCode} className="text-[10px] text-slate-400" />
                            <span>{row.templateName || row.key}</span>
                            <button
                              type="button"
                              onClick={() => copyCode(row.templateName || row.key)}
                              className="ml-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                              title="Copy code"
                            >
                              <FontAwesomeIcon icon={isCopied ? faCheck : faCopy} className={`text-[11px] ${isCopied ? 'text-emerald-600' : ''}`} />
                            </button>
                          </div>
                        </td>

                        {/* Language Column */}
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 border border-slate-200">
                            <FontAwesomeIcon icon={faGlobe} className="text-[10px] text-slate-400" />
                            {row.language}
                          </span>
                        </td>

                        {/* Category Column */}
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${catInfo.bg}`}>
                            {catInfo.label}
                          </span>
                        </td>

                        {/* Status Column */}
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${statusInfo.bg}`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${statusInfo.dot}`} />
                            {statusInfo.label}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 text-xs text-slate-600">{row.headerType === 'DOCUMENT' ? 'Document / PDF' : row.headerType || 'None'}</td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-xs text-slate-600" title={row.syncError || ''}>
                          {row.lastSyncedAt ? new Date(row.lastSyncedAt).toLocaleString() : '—'}
                          {row.syncError && <span className="mt-1 block max-w-48 whitespace-normal text-rose-600">{row.syncError}</span>}
                        </td>
                        {/* Actions Column */}
                        <td className="sticky right-0 z-10 bg-white group-hover:bg-slate-50/80 px-4 py-3.5 text-right whitespace-nowrap shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.06)]">
                          <TemplateRowActions
                            row={row}
                            statusInfo={statusInfo}
                            syncingId={syncingId}
                            openPreview={openPreview}
                            syncTemplate={syncTemplate}
                            toggleTemplate={toggleTemplate}
                            setEditing={setEditing}
                            setDeletingTemplate={setDeletingTemplate}
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Responsive Mobile Card List (< 768px) ──────────────────── */}
      <div className="space-y-3 lg:hidden">
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500 shadow-xs">
            <FontAwesomeIcon icon={faRotate} className="mr-2 animate-spin text-emerald-600" />
            Loading…
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {error}
          </div>
        ) : listTab === 'CAMPAIGN' ? (
          campaignRows.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500 shadow-xs">
              No campaigns found.
            </div>
          ) : (
            campaignRows.map((row) => (
              <article key={row.id} className="space-y-2 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-slate-900 truncate">{row.name}</h3>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                    {row.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  {row.metaTemplate?.name || row.metaTemplate?.templateName || '—'}
                </p>
                <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-100">
                  <span>{row.recipientCount ?? 0} recipients</span>
                  <span>{row.sentCount ?? 0} sent</span>
                </div>
              </article>
            ))
          )
        ) : rows.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500 shadow-xs">
            No templates found.
          </div>
        ) : (
          rows.map((row) => {
            const statusInfo = metaStatusInfo(row);
            const catInfo = CATEGORY_CONFIG[row.category] || {
              bg: 'bg-slate-100 text-slate-700 border-slate-200',
              label: row.category,
            };
            const isCopied = copiedCode === (row.templateName || row.key);

            return (
              <article
                key={row.id}
                className="space-y-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                      <FontAwesomeIcon icon={faWhatsapp} className="text-base" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-slate-900 truncate">{row.name}</h3>
                      <p className="text-[11px] text-slate-400">
                        {row.category} • {row.language}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${statusInfo.bg}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${statusInfo.dot}`} />
                    {statusInfo.label}
                  </span>
                </div>

                <p className="break-all text-xs text-slate-500">Key: {row.key || '—'} · Header: {row.headerType === 'DOCUMENT' ? 'Document / PDF' : row.headerType || 'None'} · Last synced: {row.lastSyncedAt ? new Date(row.lastSyncedAt).toLocaleString() : '—'}</p>
                {row.syncError && <p className="break-words text-xs text-rose-600">{row.syncError}</p>}
                <div className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-2.5 py-1.5 border border-slate-100">
                  <span className="font-mono text-xs text-slate-600 truncate">
                    {row.templateName || row.key}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyCode(row.templateName || row.key)}
                    className="text-xs text-slate-400 hover:text-slate-700 shrink-0"
                  >
                    <FontAwesomeIcon icon={isCopied ? faCheck : faCopy} className={isCopied ? 'text-emerald-600' : ''} />
                  </button>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
                  <TemplateRowActions
                    row={row}
                    statusInfo={statusInfo}
                    syncingId={syncingId}
                    openPreview={openPreview}
                    syncTemplate={syncTemplate}
                    toggleTemplate={toggleTemplate}
                    setEditing={setEditing}
                    setDeletingTemplate={setDeletingTemplate}
                  />
                </div>
              </article>
            );
          })
        )}
      </div>

      {/* ── Pagination ────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-xs">
        <Pager
          page={page}
          pages={pages}
          limit={limit}
          total={total}
          onPage={setPage}
          onLimit={(value) => {
            setLimit(value);
            setPage(1);
          }}
        />
      </div>

      {/* ── Slide-Over Drawer with Live WhatsApp Preview & Test Send ── */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs transition-opacity"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelected(null);
          }}
        >
          <aside
            className="flex h-[100dvh] w-full max-w-xl flex-col overflow-hidden bg-white shadow-2xl animate-in slide-in-from-right duration-200"
            role="dialog"
            aria-modal="true"
            aria-labelledby="template-preview-title"
          >
            {/* Drawer Header */}
            <div className="flex items-start justify-between border-b border-slate-200 bg-slate-50/60 p-5">
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                    <FontAwesomeIcon icon={faWhatsapp} className="text-xs" />
                    WhatsApp Template
                  </span>
                  {(() => { const status = metaStatusInfo(selected); return <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold border ${status.bg}`}><span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />{status.label}</span>; })()}
                </div>
                <h2 id="template-preview-title" className="text-lg font-bold text-slate-900 break-words">
                  {selected.name}
                </h2>
                <p className="font-mono text-xs text-slate-500 break-all">
                  {selected.templateName || selected.key}
                </p>
                <p className="text-xs text-slate-500">Last synced: {selected.lastSyncedAt ? new Date(selected.lastSyncedAt).toLocaleString() : 'Never'}</p>
                {selected.syncError && <p className="break-words text-xs text-rose-700">Sync error: {selected.syncError}</p>}
                {String(selected.status || '').toUpperCase() === 'REJECTED' && selected.rejectionReason && <p className="break-words text-xs text-rose-700">Meta rejection reason: {selected.rejectionReason}</p>}
                <Button type="button" size="sm" variant="outline" className="mt-2" disabled={syncingId === selected.id} onClick={() => syncTemplate(selected)}>
                  <FontAwesomeIcon icon={faRotate} className={`mr-1.5 ${syncingId === selected.id ? 'animate-spin' : ''}`} />
                  {syncingId === selected.id ? 'Syncing…' : metaStatusInfo(selected).label === 'Not Synced' ? 'Submit to Meta' : metaStatusInfo(selected).label === 'Sync Failed' ? 'Retry Sync' : 'Sync Status'}
                </Button>
              </div>

              <button
                type="button"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                aria-label="Close preview"
                onClick={() => setSelected(null)}
              >
                <FontAwesomeIcon icon={faXmark} className="text-sm" />
              </button>
            </div>

            {/* Drawer Tabs */}
            <div className="flex border-b border-slate-200 bg-white px-5 text-sm">
              <button
                type="button"
                onClick={() => setDrawerTab('preview')}
                className={`flex items-center gap-2 border-b-2 py-3 px-3 text-xs sm:text-sm font-semibold transition-colors ${
                  drawerTab === 'preview'
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <FontAwesomeIcon icon={faMobileScreen} className="text-xs" />
                Live Preview
              </button>
              <button
                type="button"
                onClick={() => setDrawerTab('test')}
                className={`flex items-center gap-2 border-b-2 py-3 px-3 text-xs sm:text-sm font-semibold transition-colors ${
                  drawerTab === 'test'
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <FontAwesomeIcon icon={faPaperPlane} className="text-xs" />
                Live Test Send
              </button>
              <button
                type="button"
                onClick={() => setDrawerTab('details')}
                className={`flex items-center gap-2 border-b-2 py-3 px-3 text-xs sm:text-sm font-semibold transition-colors ${
                  drawerTab === 'details'
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <FontAwesomeIcon icon={faSliders} className="text-xs" />
                Template Details
              </button>
            </div>

            {/* Drawer Content */}
            <div className="min-h-0 flex-1 overflow-y-auto p-5 space-y-5">
              {drawerTab === 'preview' && (
                <div className="space-y-4">
                  <div className="rounded-xl bg-slate-50 p-3 text-center text-xs text-slate-500">
                    Live simulation of recipient WhatsApp chat interface.
                  </div>
                  <WhatsAppPreview
                    body={selected.body || selected.bodyText}
                    header={selected.headerContent}
                    headerType={selected.headerType}
                    footer={selected.footer || selected.footerText}
                    buttons={selected.buttons}
                  />
                  <div className="flex justify-center pt-2">
                    <Button
                      type="button"
                      onClick={() => setDrawerTab('test')}
                      className="bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-semibold shadow-sm"
                    >
                      <FontAwesomeIcon icon={faPaperPlane} className="mr-1.5" />
                      Test Send this Template
                    </Button>
                  </div>
                </div>
              )}

              {drawerTab === 'test' && (
                <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                  <div className="space-y-1">
                    <h3 className="font-bold text-slate-900 text-sm">Send a Live Test Message</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Deliver a real WhatsApp message to an active phone number to verify template rendering and variable replacement.
                    </p>
                  </div>

                  {/* Phone input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Recipient Phone Number</label>
                    <div className="grid grid-cols-[90px_1fr] gap-2">
                      <select
                        value={testCountry}
                        onChange={(e) => setTestCountry(e.target.value)}
                        className="h-10 rounded-lg border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700"
                      >
                        <option value="+91">+91 (IN)</option>
                        <option value="+1">+1 (US)</option>
                        <option value="+44">+44 (UK)</option>
                        <option value="+971">+971 (AE)</option>
                      </select>
                      <input
                        value={testPhone}
                        onChange={(e) => setTestPhone(e.target.value)}
                        placeholder="10-digit mobile number"
                        className="h-10 rounded-lg border border-slate-200 px-3 text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                  </div>

                  {/* Variables inputs if template contains {{1}}, {{2}} */}
                  {Array.isArray(selected.variables) && selected.variables.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <label className="text-xs font-semibold text-slate-700">Sample Variable Values</label>
                      <div className="space-y-2">
                        {selected.variables.map((variable) => (
                          <div key={variable} className="grid grid-cols-[100px_1fr] items-center gap-2">
                            <span className="font-mono text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded">
                              {`{{${variable}}}`}
                            </span>
                            <input
                              value={testVariables[variable] || ''}
                              onChange={(e) =>
                                setTestVariables((prev) => ({
                                  ...prev,
                                  [variable]: e.target.value,
                                }))
                              }
                              placeholder={`Sample value for {{${variable}}}`}
                              className="h-9 rounded-lg border border-slate-200 px-2.5 text-xs text-slate-800"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <Button
                    type="button"
                    disabled={testSending || !testPhone.trim()}
                    onClick={async () => {
                      setTestSending(true);
                      setTestResult(null);
                      try {
                        const result = envelope(
                          await api.post('/templates/meta/test-send', {
                            templateId: selected.id,
                            to: `${testCountry}${testPhone.replace(/\D/g, '')}`,
                            variables: testVariables,
                          }),
                        );
                        setTestResult({
                          ok: true,
                          text: `Message accepted by Meta • ID: ${result.messageId || result.status || 'Delivered'}`,
                        });
                        toast.success('Test message sent via WhatsApp Cloud API');
                      } catch (err) {
                        const errMsg =
                          err?.response?.data?.message || err?.message || 'Test send failed';
                        setTestResult({ ok: false, text: errMsg });
                        toast.error(errMsg);
                      } finally {
                        setTestSending(false);
                      }
                    }}
                    className="w-full bg-[#16A34A] hover:bg-[#15803D] text-white font-semibold shadow-sm transition-all text-xs sm:text-sm"
                  >
                    <FontAwesomeIcon icon={testSending ? faRotate : faPaperPlane} className={`mr-2 ${testSending ? 'animate-spin' : ''}`} />
                    {testSending ? 'Sending Test Message…' : 'Send WhatsApp Test'}
                  </Button>

                  {testResult && (
                    <div
                      className={`rounded-xl p-3 text-xs flex items-center gap-2 ${
                        testResult.ok
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}
                    >
                      <FontAwesomeIcon icon={testResult.ok ? faCircleCheck : faCircleExclamation} />
                      <span>{testResult.text}</span>
                    </div>
                  )}
                </section>
              )}

              {drawerTab === 'details' && (
                <div className="space-y-4">
                  <MetaTemplateDetails template={selected} />
                </div>
              )}
            </div>
          </aside>
        </div>
      )}

      {/* ── Delete Confirmation Dialog ──────────────────────── */}
      {deletingTemplate && (
        <ConfirmDialog
          open={Boolean(deletingTemplate)}
          onOpenChange={(open) => {
            if (!open) {
              setDeletingTemplate(null);
              setDeleteReason('');
            }
          }}
          title={`Delete "${deletingTemplate.name || deletingTemplate.templateName}"?`}
          description="Are you sure you want to delete this template from Meta and archive the local CRM record? This action cannot be undone."
          confirmLabel={isDeleting ? 'Deleting…' : 'Delete Template'}
          variant="destructive"
          loading={isDeleting}
          onConfirm={handleDeleteTemplate}
          note={{
            label: 'Deletion reason (optional for audit log)',
            value: deleteReason,
            onChange: setDeleteReason,
            placeholder: 'e.g., Obsolete or replaced with new promotional template',
          }}
        />
      )}
    </div>
  );
}
