'use client';

import * as React from 'react';
import Link from 'next/link';
import api from '../../../../lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import {
  faBullhorn,
  faPlus,
  faRotateLeft,
  faRotate,
  faSearch,
  faFilter,
  faPlay,
  faBan,
  faClock,
  faCircleCheck,
  faCircleXmark,
  faUsers,
  faPaperPlane,
  faChevronRight,
  faChevronLeft,
  faCheck,
  faXmark,
  faDownload,
  faFileLines,
} from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { toast } from '@/hooks/use-toast';
import { envelope, Field, pageOf, Pager, rowsOf, downloadCsv } from '../template-shared';
import { WhatsAppPreview } from './meta-shared';
import { loadLeadStages } from '@/modules/crm/crm-api';
import { AdminRowActions } from '@/components/common/AdminRowActions';

const WIZARD_STEPS = [
  { id: 'details', label: 'Details', short: 'Details', step: 1 },
  { id: 'template', label: 'Template', short: 'Template', step: 2 },
  { id: 'variables', label: 'Variables', short: 'Variables', step: 3 },
  { id: 'audience', label: 'Audience', short: 'Audience', step: 4 },
  { id: 'schedule', label: 'Schedule', short: 'Schedule', step: 5 },
  { id: 'confirm', label: 'Confirm', short: 'Confirm', step: 6 },
];

const STATUS_TABS = [
  { key: 'ALL', label: 'All Campaigns' },
  { key: 'RUNNING', label: 'Running' },
  { key: 'SCHEDULED', label: 'Scheduled' },
  { key: 'COMPLETED', label: 'Completed' },
  { key: 'FAILED', label: 'Failed' },
];

const LEAD_STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'NEW', label: 'New' },
  { value: 'CONTACTED', label: 'Contacted' },
  { value: 'CALL_BACK', label: 'Call Back' },
  { value: 'DETAILS_SENT', label: 'Details Sent' },
  { value: 'FOLLOW_UP', label: 'Follow Up' },
  { value: 'VISIT_SCHEDULED', label: 'Visit Scheduled' },
  { value: 'VISIT_DONE', label: 'Visit Done' },
  { value: 'PROPOSAL_SENT', label: 'Proposal Sent' },
  { value: 'NEGOTIATION', label: 'Negotiation' },
  { value: 'FINAL_CALL', label: 'Final Call' },
  { value: 'WON', label: 'Won' },
  { value: 'LOST', label: 'Lost' },
];

const STATUS_CONFIG = {
  DRAFT: {
    bg: 'bg-slate-100 text-slate-700 border-slate-200',
    icon: faFileLines,
    dot: 'bg-slate-400',
    label: 'Draft',
  },
  SCHEDULED: {
    bg: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: faClock,
    dot: 'bg-blue-500',
    label: 'Scheduled',
  },
  RUNNING: {
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: faPaperPlane,
    dot: 'bg-emerald-500 animate-pulse',
    label: 'Running',
  },
  COMPLETED: {
    bg: 'bg-teal-50 text-teal-700 border-teal-200',
    icon: faCircleCheck,
    dot: 'bg-teal-600',
    label: 'Completed',
  },
  FAILED: {
    bg: 'bg-rose-50 text-rose-700 border-rose-200',
    icon: faCircleXmark,
    dot: 'bg-rose-500',
    label: 'Failed',
  },
  CANCELLED: {
    bg: 'bg-zinc-100 text-zinc-600 border-zinc-200',
    icon: faBan,
    dot: 'bg-zinc-400',
    label: 'Cancelled',
  },
};

export function MetaWhatsAppCampaigns() {
  const [stats, setStats] = React.useState({
    total: 0,
    draft: 0,
    scheduled: 0,
    running: 0,
    completed: 0,
    failed: 0,
  });
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [status, setStatus] = React.useState('ALL');
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(10);
  const [pages, setPages] = React.useState(1);
  const [total, setTotal] = React.useState(0);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [wizardStep, setWizardStep] = React.useState(0);
  const [approvedTemplates, setApprovedTemplates] = React.useState([]);
  const [loadingTemplates, setLoadingTemplates] = React.useState(false);
  const [leadStages, setLeadStages] = React.useState([]);
  const [selectedIds, setSelectedIds] = React.useState(new Set());
  const [saving, setSaving] = React.useState(false);
  const [actionLoadingId, setActionLoadingId] = React.useState(null);

  const [form, setForm] = React.useState({
    name: '',
    description: '',
    metaTemplateId: '',
    variableMapping: {},
    audienceType: 'MANUAL',
    manualRecipients: '',
    leadFilterStatus: '',
    leadFilterStageId: '',
    scheduledAt: '',
    launchNow: false,
  });

  const selectedTemplate = React.useMemo(() => {
    return approvedTemplates.find((item) => String(item.id) === String(form.metaTemplateId));
  }, [approvedTemplates, form.metaTemplateId]);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
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
      setRows(rowsOf(payload));
      if (payload?.stats) setStats(payload.stats);
      const pagination = pageOf(payload, { page, totalPages: 1, total: 0 });
      setPages(Math.max(1, Number(pagination.totalPages) || 1));
      setTotal(Number(pagination.total) || 0);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not load campaigns.');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, status]);

  React.useEffect(() => {
    load();
  }, [load]);

  React.useEffect(() => {
    loadLeadStages().then(setLeadStages).catch(() => setLeadStages([]));
  }, []);

  async function loadApprovedTemplates() {
    setLoadingTemplates(true);
    try {
      const payload = envelope(
        await api.get('/templates/meta', { params: { status: 'APPROVED', limit: 100, page: 1 } }),
      );
      setApprovedTemplates(
        rowsOf(payload).filter((row) => row.status === 'APPROVED' && row.isLocalActive !== false),
      );
    } catch {
      setApprovedTemplates([]);
    } finally {
      setLoadingTemplates(false);
    }
  }

  function openCreate() {
    setWizardStep(0);
    setForm({
      name: '',
      description: '',
      metaTemplateId: '',
      variableMapping: {},
      audienceType: 'MANUAL',
      manualRecipients: '',
      leadFilterStatus: '',
      leadFilterStageId: '',
      scheduledAt: '',
      launchNow: false,
    });
    loadApprovedTemplates();
    setCreateOpen(true);
  }

  function closeCreate() {
    setCreateOpen(false);
  }

  // Parse manual recipients
  const parsedRecipients = React.useMemo(() => {
    return form.manualRecipients
      .split(/[\n,;]+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }, [form.manualRecipients]);

  // Extract variables from selected template body
  const templateVars = React.useMemo(() => {
    const body = selectedTemplate?.body || selectedTemplate?.bodyText || '';
    const matches = [...String(body).matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]);
    return [...new Set(matches)];
  }, [selectedTemplate]);

  // Interpolated preview for WhatsApp
  const previewBody = React.useMemo(() => {
    const raw = selectedTemplate?.body || selectedTemplate?.bodyText || '';
    return raw.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      return form.variableMapping[key] ? `*${form.variableMapping[key]}*` : `[${key}]`;
    });
  }, [selectedTemplate, form.variableMapping]);

  // Validation per step
  function validateStep(stepIndex) {
    if (stepIndex === 0) {
      if (!form.name.trim()) {
        toast.error('Campaign name is required.');
        return false;
      }
      if (form.name.trim().length > 100) {
        toast.error('Campaign name cannot exceed 100 characters.');
        return false;
      }
    }
    if (stepIndex === 1) {
      if (!form.metaTemplateId) {
        toast.error('Please select an approved Meta template.');
        return false;
      }
    }
    if (stepIndex === 2) {
      for (const v of templateVars) {
        if (!form.variableMapping[v]?.trim()) {
          toast.error(`Please provide a value for variable {{${v}}}.`);
          return false;
        }
      }
    }
    if (stepIndex === 3) {
      if (form.audienceType === 'MANUAL') {
        if (!parsedRecipients.length) {
          toast.error('Please enter at least one recipient phone number.');
          return false;
        }
      } else if (form.audienceType === 'LEAD_FILTER') {
        if (!form.leadFilterStatus && !form.leadFilterStageId) {
          toast.error('Please select at least one filter criterion (Status or Stage).');
          return false;
        }
      }
    }
    if (stepIndex === 4) {
      if (!form.launchNow && form.scheduledAt) {
        const sched = new Date(form.scheduledAt);
        if (Number.isNaN(sched.getTime())) {
          toast.error('Invalid schedule date/time format.');
          return false;
        }
        if (sched.getTime() <= Date.now() + 60000) {
          toast.error('Scheduled time must be at least 1 minute in the future.');
          return false;
        }
      }
    }
    return true;
  }

  function handleNext() {
    if (!validateStep(wizardStep)) return;
    setWizardStep((prev) => Math.min(WIZARD_STEPS.length - 1, prev + 1));
  }

  function handleBack() {
    setWizardStep((prev) => Math.max(0, prev - 1));
  }

  async function createCampaign() {
    if (!validateStep(0)) return;
    if (!validateStep(1)) return;
    if (!validateStep(2)) return;
    if (!validateStep(3)) return;
    if (!validateStep(4)) return;

    setSaving(true);
    try {
      const audienceFilter = {};
      if (form.audienceType === 'LEAD_FILTER') {
        if (form.leadFilterStatus) audienceFilter.status = form.leadFilterStatus;
        if (form.leadFilterStageId) audienceFilter.stageId = Number(form.leadFilterStageId);
      }

      const body = {
        name: form.name.trim(),
        metaTemplateId: Number(form.metaTemplateId),
        variableMapping: form.variableMapping,
        audienceType: form.audienceType,
        audienceFilter: form.audienceType === 'LEAD_FILTER' ? audienceFilter : undefined,
        manualRecipients: form.audienceType === 'MANUAL' ? parsedRecipients : undefined,
        scheduledAt: form.launchNow ? undefined : form.scheduledAt || undefined,
      };

      const created = envelope(await api.post('/templates/meta/campaigns', body));
      const id = created?.id || created?.data?.id;

      if (form.launchNow && id) {
        await api.post(`/templates/meta/campaigns/${id}/launch`, {});
        toast.success('Campaign created and launch started!');
      } else if (form.scheduledAt) {
        toast.success('Campaign created and scheduled successfully!');
      } else {
        toast.success('Campaign saved as draft.');
      }

      setCreateOpen(false);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Could not create campaign.');
    } finally {
      setSaving(false);
    }
  }

  async function launch(id) {
    setActionLoadingId(id);
    try {
      await api.post(`/templates/meta/campaigns/${id}/launch`, {});
      toast.success('Campaign launch started.');
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Launch failed.');
    } finally {
      setActionLoadingId(null);
    }
  }

  async function cancel(id) {
    if (!confirm('Are you sure you want to cancel this campaign?')) return;
    setActionLoadingId(id);
    try {
      await api.post(`/templates/meta/campaigns/${id}/cancel`, {});
      toast.success('Campaign cancelled.');
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Cancel failed.');
    } finally {
      setActionLoadingId(null);
    }
  }

  // Bulk selection handling
  const allIds = React.useMemo(() => rows.map((r) => r.id).filter(Boolean), [rows]);
  const isAllSelected = allIds.length > 0 && allIds.every((id) => selectedIds.has(id));

  function toggleSelectAll() {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allIds));
    }
  }

  function toggleSelectOne(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function exportCampaignsCsv() {
    downloadCsv(
      'whatsapp-campaigns.csv',
      [
        { key: 'name', label: 'Campaign Name' },
        { key: 'templateName', label: 'Template' },
        { key: 'recipientCount', label: 'Audience' },
        { key: 'status', label: 'Status' },
        { key: 'sentCount', label: 'Sent' },
        { key: 'scheduledAt', label: 'Scheduled At' },
      ],
      rows.map((r) => ({
        ...r,
        templateName: r.metaTemplate?.name || r.metaTemplate?.templateName || '—',
      })),
    );
  }

  return (
    <div className="min-w-0 w-full max-w-full space-y-6 pb-[max(2rem,env(safe-area-inset-bottom))]">
      {/* ── Top Header (WhatsApp Campaigns Dashboard Hero Banner) ── */}
      <section
        aria-label="WhatsApp Campaigns Dashboard"
        className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-[#0B3323] via-[#0F442F] to-[#0D3B29] p-5 sm:p-7 md:p-8 text-white shadow-md border border-emerald-900/40"
      >
        {/* Subtle decorative glow highlights */}
        <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 size-72 rounded-full bg-emerald-500/10 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute right-1/4 -bottom-16 size-60 rounded-full bg-emerald-400/10 blur-2xl" />

        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          {/* Left: Pill Badge + Title + Description */}
          <div className="space-y-2.5 max-w-2xl">
            {/* Meta Cloud API Broadcasts Pill */}
            <div className="inline-flex items-center gap-2 rounded-full bg-[#08291c]/90 border border-[#14593b] px-3 py-1 text-xs font-medium text-emerald-300 shadow-xs">
              <FontAwesomeIcon icon={faWhatsapp} className="text-[#25D366] text-sm" />
              <span>Meta Cloud API Broadcasts</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
              WhatsApp Campaigns Dashboard
            </h1>

            {/* Description Subtitle */}
            <p className="text-xs sm:text-sm text-emerald-100/80 leading-relaxed">
              Target your CRM leads or custom phone lists with personalized variables, scheduled delivery, and real-time send tracking via approved WhatsApp business templates.
            </p>
          </div>

          {/* Right: Actions */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
            <Button
              type="button"
              className="bg-[#059669] hover:bg-[#047857] text-white font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all inline-flex items-center gap-2 text-sm border-0"
              onClick={openCreate}
            >
              <FontAwesomeIcon icon={faPlus} className="text-xs" />
              <span>New Campaign</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={exportCampaignsCsv}
              disabled={!rows.length}
              className="bg-white/10 hover:bg-white/15 border-white/20 hover:border-white/30 text-white font-medium px-4 py-2.5 rounded-xl transition-all inline-flex items-center gap-2 text-sm disabled:opacity-40"
            >
              <FontAwesomeIcon icon={faDownload} className="text-xs text-emerald-200" />
              <span>Export CSV</span>
            </Button>
            <Button
              asChild
              variant="outline"
              className="bg-white/10 hover:bg-white/15 border-white/20 hover:border-white/30 text-white font-medium px-3.5 py-2.5 rounded-xl transition-all inline-flex items-center gap-2 text-sm"
            >
              <Link href="/admin/sections/meta-templates">
                <FontAwesomeIcon icon={faRotateLeft} className="text-xs" />
                <span className="hidden sm:inline">All Templates</span>
              </Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="bg-white/10 hover:bg-white/15 border-white/20 hover:border-white/30 text-white rounded-xl transition-all"
              onClick={load}
              disabled={loading}
              title="Refresh"
            >
              <FontAwesomeIcon icon={faRotate} className={loading ? 'animate-spin' : ''} />
            </Button>
          </div>
        </div>
      </section>

      {/* ── KPI Cards Grid ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 sm:gap-4">
        {[
          {
            title: 'Total Campaigns',
            value: stats.total ?? 0,
            icon: faBullhorn,
            color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
          },
          {
            title: 'Draft',
            value: stats.draft ?? 0,
            icon: faFileLines,
            color: 'text-slate-600 bg-slate-50 border-slate-100',
          },
          {
            title: 'Scheduled',
            value: stats.scheduled ?? 0,
            icon: faClock,
            color: 'text-blue-600 bg-blue-50 border-blue-100',
          },
          {
            title: 'Running',
            value: stats.running ?? 0,
            icon: faPaperPlane,
            color: 'text-amber-600 bg-amber-50 border-amber-100',
          },
          {
            title: 'Completed',
            value: stats.completed ?? 0,
            icon: faCircleCheck,
            color: 'text-teal-600 bg-teal-50 border-teal-100',
          },
          {
            title: 'Failed',
            value: stats.failed ?? 0,
            icon: faCircleXmark,
            color: 'text-rose-600 bg-rose-50 border-rose-100',
          },
        ].map((kpi) => (
          <div
            key={kpi.title}
            className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-sm transition-all hover:shadow-md"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] sm:text-xs font-medium text-slate-500 uppercase tracking-wider truncate">
                {kpi.title}
              </span>
              <span
                className={`inline-flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg border text-xs sm:text-sm ${kpi.color}`}
              >
                <FontAwesomeIcon icon={kpi.icon} />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                {loading ? '—' : kpi.value}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Status Tabs & Search/Filter Bar ────────────────────────── */}
      <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
        {/* Status Pills / Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-sm no-scrollbar">
          {STATUS_TABS.map((tab) => {
            const count =
              tab.key === 'ALL'
                ? stats.total
                : stats[tab.key.toLowerCase()] ?? 0;
            const isActive = status === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setStatus(tab.key);
                  setPage(1);
                }}
                className={`flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-[#16A34A] text-white shadow-sm'
                    : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] sm:text-xs font-bold ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-white text-slate-600 border border-slate-200'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search, Filter & Bulk selection toolbar */}
        <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:items-center sm:justify-between border-t border-slate-100">
          <div className="relative flex-1 sm:max-w-md">
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
              placeholder="Search campaigns by name..."
              className="h-9.5 pl-8 text-xs sm:text-sm border-slate-200 rounded-lg focus-visible:ring-emerald-500"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {(status !== 'ALL' || search) && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStatus('ALL');
                  setSearch('');
                  setPage(1);
                }}
                className="text-xs text-slate-500 hover:text-slate-800"
              >
                Clear Filters
              </Button>
            )}
            {selectedIds.size > 0 && (
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                {selectedIds.size} selected
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Desktop & Tablet Table Presentation ────────────────────── */}
      <div className="hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm md:block overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-600">
              <tr>
                <th className="w-10 px-4 py-3.5">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={toggleSelectAll}
                    aria-label="Select all"
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                </th>
                <th className="px-4 py-3.5">Campaign</th>
                <th className="px-4 py-3.5">Template</th>
                <th className="px-4 py-3.5">Audience</th>
                <th className="px-4 py-3.5">Scheduled</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Sent</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-4"><div className="h-4 w-4 rounded bg-slate-200" /></td>
                    <td className="px-4 py-4"><div className="h-4 w-36 rounded bg-slate-200" /></td>
                    <td className="px-4 py-4"><div className="h-4 w-28 rounded bg-slate-200" /></td>
                    <td className="px-4 py-4"><div className="h-4 w-12 rounded bg-slate-200" /></td>
                    <td className="px-4 py-4"><div className="h-4 w-24 rounded bg-slate-200" /></td>
                    <td className="px-4 py-4"><div className="h-6 w-20 rounded-full bg-slate-200" /></td>
                    <td className="px-4 py-4"><div className="h-4 w-8 rounded bg-slate-200" /></td>
                    <td className="px-4 py-4 text-right"><div className="h-8 w-16 ml-auto rounded bg-slate-200" /></td>
                  </tr>
                ))
              ) : rows.length ? (
                rows.map((row) => {
                  const cfg = STATUS_CONFIG[row.status] || STATUS_CONFIG.DRAFT;
                  const isSelected = selectedIds.has(row.id);
                  const isActionLoading = actionLoadingId === row.id;

                  return (
                    <tr
                      key={row.id}
                      className={`transition-colors hover:bg-slate-50/70 ${
                        isSelected ? 'bg-emerald-50/40' : ''
                      }`}
                    >
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOne(row.id)}
                          aria-label={`Select campaign ${row.name}`}
                          className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-semibold text-slate-900 line-clamp-1">{row.name}</div>
                        <div className="text-[11px] text-slate-500">ID: #{row.id}</div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                          <FontAwesomeIcon icon={faWhatsapp} className="text-emerald-600 text-xs" />
                          <span className="truncate max-w-[180px]">
                            {row.metaTemplate?.name || row.metaTemplate?.templateName || '—'}
                          </span>
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="inline-flex items-center gap-1 text-slate-700 font-medium">
                          <FontAwesomeIcon icon={faUsers} className="text-slate-400 text-xs" />
                          <span>{row.recipientCount ?? 0}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-xs text-slate-600">
                        {row.scheduledAt ? (
                          <div className="flex items-center gap-1.5">
                            <FontAwesomeIcon icon={faClock} className="text-slate-400 text-xs" />
                            <span>{new Date(row.scheduledAt).toLocaleString()}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${cfg.bg}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="font-semibold text-slate-900">{row.sentCount ?? 0}</span>
                        <span className="text-xs text-slate-400"> / {row.recipientCount ?? 0}</span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <AdminRowActions
                          record={row}
                          recordName={row.name}
                          disabled={isActionLoading}
                          actions={[
                            ...(['DRAFT', 'SCHEDULED'].includes(row.status)
                              ? [
                                  {
                                    id: 'launch',
                                    label: 'Launch Campaign',
                                    icon: faPlay,
                                    onClick: () => launch(row.id),
                                  },
                                ]
                              : []),
                            ...(!['COMPLETED', 'FAILED', 'CANCELLED'].includes(row.status)
                              ? [
                                  {
                                    id: 'cancel',
                                    label: 'Cancel Campaign',
                                    icon: faBan,
                                    variant: 'destructive',
                                    onClick: () => cancel(row.id),
                                  },
                                ]
                              : []),
                          ]}
                        />
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-3">
                      <FontAwesomeIcon icon={faBullhorn} className="text-lg" />
                    </div>
                    <p className="text-sm font-semibold text-slate-800">No campaigns found</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {search || status !== 'ALL'
                        ? 'Try clearing your filters or search term.'
                        : 'Create your first WhatsApp messaging campaign to get started.'}
                    </p>
                    <div className="mt-4">
                      <Button
                        type="button"
                        size="sm"
                        onClick={openCreate}
                        className="bg-[#16A34A] hover:bg-[#15803D] text-white"
                      >
                        <FontAwesomeIcon icon={faPlus} className="mr-2" />
                        Create Campaign
                      </Button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Mobile Responsive Campaign Cards ──────────────────────── */}
      <div className="space-y-3 md:hidden">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
              <div className="h-5 w-3/4 bg-slate-200 rounded" />
              <div className="h-4 w-1/2 bg-slate-200 rounded" />
              <div className="h-8 bg-slate-100 rounded" />
            </div>
          ))
        ) : rows.length ? (
          rows.map((row) => {
            const cfg = STATUS_CONFIG[row.status] || STATUS_CONFIG.DRAFT;
            const isSelected = selectedIds.has(row.id);
            const isActionLoading = actionLoadingId === row.id;

            return (
              <article
                key={row.id}
                className={`rounded-2xl border bg-white p-4 shadow-sm transition-all ${
                  isSelected ? 'border-emerald-500 bg-emerald-50/20' : 'border-slate-200/80'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectOne(row.id)}
                      aria-label={`Select campaign ${row.name}`}
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-slate-900 text-sm truncate">{row.name}</h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">ID: #{row.id}</p>
                    </div>
                  </div>
                  <span
                    className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${cfg.bg}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                    {cfg.label}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs border-y border-slate-100 py-2.5">
                  <div>
                    <span className="text-[11px] text-slate-400 block font-medium">TEMPLATE</span>
                    <span className="font-medium text-slate-700 truncate block mt-0.5">
                      {row.metaTemplate?.name || row.metaTemplate?.templateName || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block font-medium">AUDIENCE / SENT</span>
                    <span className="font-semibold text-slate-800 block mt-0.5">
                      {row.sentCount ?? 0} <span className="text-slate-400 font-normal">/ {row.recipientCount ?? 0}</span>
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[11px] text-slate-400 block font-medium">SCHEDULED</span>
                    <span className="text-slate-600 block mt-0.5">
                      {row.scheduledAt ? new Date(row.scheduledAt).toLocaleString() : 'Immediate / Draft'}
                    </span>
                  </div>
                </div>

                {/* Actions row */}
                <div className="mt-3 flex gap-2">
                  {['DRAFT', 'SCHEDULED'].includes(row.status) && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isActionLoading}
                      onClick={() => launch(row.id)}
                      className="flex-1 text-xs font-semibold text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                    >
                      <FontAwesomeIcon icon={faPlay} className="mr-1.5 text-[10px]" />
                      Launch
                    </Button>
                  )}
                  {!['COMPLETED', 'FAILED', 'CANCELLED'].includes(row.status) && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isActionLoading}
                      onClick={() => cancel(row.id)}
                      className="flex-1 text-xs font-semibold text-rose-600 border-rose-200 hover:bg-rose-50"
                    >
                      <FontAwesomeIcon icon={faBan} className="mr-1.5 text-[10px]" />
                      Cancel
                    </Button>
                  )}
                </div>
              </article>
            );
          })
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
            <FontAwesomeIcon icon={faBullhorn} className="text-2xl text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-800">No campaigns found</p>
            <p className="mt-1 text-xs text-slate-500">Create a new WhatsApp campaign to get started.</p>
          </div>
        )}
      </div>

      {/* ── Pagination ────────────────────────────────────────────── */}
      <div className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-sm">
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

      {/* ── Campaign Creation Wizard (6 Steps, Fully Responsive) ────── */}
      {createOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4 backdrop-blur-xs transition-opacity"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !saving) closeCreate();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="wizard-title"
            className="flex max-h-[96dvh] sm:max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl transition-all"
          >
            {/* Wizard Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3.5 sm:px-6">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <FontAwesomeIcon icon={faWhatsapp} className="text-lg" />
                </div>
                <div>
                  <h2 id="wizard-title" className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                    Create WhatsApp Campaign
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Step {wizardStep + 1} of {WIZARD_STEPS.length}: {WIZARD_STEPS[wizardStep].label}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                onClick={closeCreate}
                disabled={saving}
                aria-label="Close"
              >
                <FontAwesomeIcon icon={faXmark} className="text-sm" />
              </button>
            </div>

            {/* Stepper Navigation */}
            <div className="border-b border-slate-200 bg-slate-50/75 px-3 py-2.5 sm:px-6">
              <div className="flex items-center justify-between gap-1 overflow-x-auto no-scrollbar">
                {WIZARD_STEPS.map((s, idx) => {
                  const isCurrent = idx === wizardStep;
                  const isDone = idx < wizardStep;

                  return (
                    <div key={s.id} className="flex items-center shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          if (idx < wizardStep) setWizardStep(idx);
                        }}
                        disabled={idx > wizardStep || saving}
                        className={`group flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold transition-all ${
                          isCurrent
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : isDone
                            ? 'text-emerald-700 hover:bg-emerald-50'
                            : 'text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        <span
                          className={`flex h-4.5 w-4.5 items-center justify-center rounded-full text-[10px] font-bold ${
                            isCurrent
                              ? 'bg-white text-emerald-700'
                              : isDone
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-slate-200 text-slate-500'
                          }`}
                        >
                          {isDone ? <FontAwesomeIcon icon={faCheck} className="text-[9px]" /> : s.step}
                        </span>
                        <span className="hidden sm:inline">{s.label}</span>
                        <span className="sm:hidden">{s.short}</span>
                      </button>
                      {idx < WIZARD_STEPS.length - 1 && (
                        <div className="mx-1 h-0.5 w-3 sm:w-4 bg-slate-200 shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Wizard Body (Scrollable) */}
            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
              {/* ── STEP 1: Details ── */}
              {wizardStep === 0 && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3.5 text-xs text-emerald-800">
                    <p className="font-semibold text-emerald-900">Campaign Basic Information</p>
                    <p className="mt-0.5 text-emerald-700">
                      Give your broadcast an identifiable name to track delivery metrics and audience performance.
                    </p>
                  </div>

                  <Field label="Campaign Name" required hint="Max 100 characters">
                    <Input
                      value={form.name}
                      onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g. Diwali Offer Lead Broadcast 2026"
                      maxLength={100}
                      className="border-slate-300 focus-visible:ring-emerald-500"
                    />
                  </Field>

                  <Field label="Optional Description / Notes">
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                      placeholder="Internal remarks about target group or goal..."
                      rows={3}
                      className="w-full rounded-md border border-slate-300 p-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </Field>
                </div>
              )}

              {/* ── STEP 2: Template Selection ── */}
              {wizardStep === 1 && (
                <div className="space-y-4">
                  <Field label="Select Approved Meta Template" required>
                    {loadingTemplates ? (
                      <p className="text-xs text-slate-500">Loading templates...</p>
                    ) : (
                      <select
                        value={form.metaTemplateId}
                        onChange={(e) => {
                          const id = e.target.value;
                          setForm((prev) => ({
                            ...prev,
                            metaTemplateId: id,
                            variableMapping: {}, // Reset variable mapping on template change
                          }));
                        }}
                        className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      >
                        <option value="">— Choose an approved template —</option>
                        {approvedTemplates.map((tpl) => (
                          <option key={tpl.id} value={tpl.id}>
                            {tpl.name} ({tpl.templateName || tpl.key}) — {tpl.category || 'MARKETING'} [{tpl.language || 'en'}]
                          </option>
                        ))}
                      </select>
                    )}
                    {!approvedTemplates.length && !loadingTemplates && (
                      <p className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 p-2.5 rounded-lg">
                        No approved templates found. Please sync from Meta or submit a template for Meta approval first.
                      </p>
                    )}
                  </Field>

                  {selectedTemplate && (
                    <div className="mt-4 space-y-3">
                      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 text-xs text-slate-700 space-y-1">
                        <p><strong className="text-slate-900">Template Code:</strong> {selectedTemplate.templateName || selectedTemplate.key}</p>
                        <p><strong className="text-slate-900">Category:</strong> {selectedTemplate.category} · <strong className="text-slate-900">Language:</strong> {selectedTemplate.language}</p>
                        <p><strong className="text-slate-900">Approval Status:</strong> <span className="text-emerald-700 font-semibold">{selectedTemplate.status}</span></p>
                      </div>

                      <div>
                        <span className="text-xs font-semibold text-slate-700 block mb-2">Live Template Preview:</span>
                        <WhatsAppPreview
                          header={selectedTemplate.headerContent || (selectedTemplate.headerType !== 'NONE' ? `[${selectedTemplate.headerType}]` : '')}
                          body={selectedTemplate.body || selectedTemplate.bodyText || ''}
                          footer={selectedTemplate.footer || selectedTemplate.footerText}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── STEP 3: Variables Mapping ── */}
              {wizardStep === 2 && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3.5 text-xs text-blue-900">
                    <p className="font-semibold text-blue-950">Map Template Variables</p>
                    <p className="mt-0.5 text-blue-700">
                      Provide replacement text for variables found in this Meta template. Each recipient will receive these personalized values.
                    </p>
                  </div>

                  {templateVars.length ? (
                    <div className="space-y-3">
                      {templateVars.map((key) => (
                        <Field key={key} label={`Variable {{${key}}}`} required>
                          <Input
                            value={form.variableMapping[key] || ''}
                            onChange={(e) =>
                              setForm((prev) => ({
                                ...prev,
                                variableMapping: { ...prev.variableMapping, [key]: e.target.value },
                              }))
                            }
                            placeholder={`Enter value for {{${key}}}`}
                            className="border-slate-300 focus-visible:ring-emerald-500"
                          />
                        </Field>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                      This template has no dynamic variable tags. No variable mapping is needed.
                    </div>
                  )}

                  {selectedTemplate && (
                    <div className="pt-2">
                      <span className="text-xs font-semibold text-slate-700 block mb-2">Resulting Message Preview:</span>
                      <WhatsAppPreview
                        header={selectedTemplate.headerContent}
                        body={previewBody}
                        footer={selectedTemplate.footer || selectedTemplate.footerText}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* ── STEP 4: Audience Selection ── */}
              {wizardStep === 3 && (
                <div className="space-y-4">
                  <Field label="Audience Source">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label
                        className={`flex items-start gap-3 rounded-xl border p-3.5 cursor-pointer transition-all ${
                          form.audienceType === 'MANUAL'
                            ? 'border-emerald-500 bg-emerald-50/30 ring-1 ring-emerald-500'
                            : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="audienceType"
                          value="MANUAL"
                          checked={form.audienceType === 'MANUAL'}
                          onChange={() => setForm((prev) => ({ ...prev, audienceType: 'MANUAL' }))}
                          className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                        />
                        <div className="text-xs">
                          <p className="font-semibold text-slate-900">Manual Phone List</p>
                          <p className="text-slate-500 mt-0.5">Paste or type specific numbers directly.</p>
                        </div>
                      </label>

                      <label
                        className={`flex items-start gap-3 rounded-xl border p-3.5 cursor-pointer transition-all ${
                          form.audienceType === 'LEAD_FILTER'
                            ? 'border-emerald-500 bg-emerald-50/30 ring-1 ring-emerald-500'
                            : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="audienceType"
                          value="LEAD_FILTER"
                          checked={form.audienceType === 'LEAD_FILTER'}
                          onChange={() => setForm((prev) => ({ ...prev, audienceType: 'LEAD_FILTER' }))}
                          className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                        />
                        <div className="text-xs">
                          <p className="font-semibold text-slate-900">CRM Lead Filter</p>
                          <p className="text-slate-500 mt-0.5">Target leads by Stage or Status from database.</p>
                        </div>
                      </label>
                    </div>
                  </Field>

                  {form.audienceType === 'MANUAL' ? (
                    <Field
                      label="Recipients (Phone Numbers)"
                      hint="One number per line or comma-separated. Include country code (e.g., +919876543210 or 919876543210)."
                      required
                    >
                      <textarea
                        value={form.manualRecipients}
                        onChange={(e) => setForm((prev) => ({ ...prev, manualRecipients: e.target.value }))}
                        rows={6}
                        placeholder="+919876543210&#10;+919876543211&#10;+919876543212"
                        className="w-full rounded-md border border-slate-300 p-2.5 font-mono text-xs sm:text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                      <div className="mt-1 flex justify-between text-xs text-slate-500">
                        <span>Valid format: digits with country code</span>
                        <span className="font-semibold text-emerald-700">
                          {parsedRecipients.length} recipients detected
                        </span>
                      </div>
                    </Field>
                  ) : (
                    <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                      <p className="text-xs font-semibold text-slate-800">CRM Audience Targeting Filters:</p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Field label="Filter by Lead Status">
                          <select
                            value={form.leadFilterStatus}
                            onChange={(e) => setForm((prev) => ({ ...prev, leadFilterStatus: e.target.value }))}
                            className="h-9.5 w-full rounded-md border border-slate-300 bg-white px-2.5 text-xs sm:text-sm focus:border-emerald-500"
                          >
                            {LEAD_STATUS_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </Field>

                        <Field label="Filter by Lead Stage">
                          <select
                            value={form.leadFilterStageId}
                            onChange={(e) => setForm((prev) => ({ ...prev, leadFilterStageId: e.target.value }))}
                            className="h-9.5 w-full rounded-md border border-slate-300 bg-white px-2.5 text-xs sm:text-sm focus:border-emerald-500"
                          >
                            <option value="">All Stages</option>
                            {leadStages.map((stg) => (
                              <option key={stg.id} value={stg.id}>
                                {stg.name}
                              </option>
                            ))}
                          </select>
                        </Field>
                      </div>

                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        The backend queries active leads matching your selection with valid phone numbers (up to 500 leads per campaign broadcast).
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* ── STEP 5: Schedule ── */}
              {wizardStep === 4 && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-slate-200 p-4 space-y-3 bg-white">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.launchNow}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            launchNow: e.target.checked,
                            scheduledAt: e.target.checked ? '' : prev.scheduledAt,
                          }))
                        }
                        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <div className="text-xs sm:text-sm">
                        <span className="font-semibold text-slate-900 block">
                          Launch immediately upon confirmation
                        </span>
                        <span className="text-slate-500 text-xs block mt-0.5">
                          Sending will commence right after saving.
                        </span>
                      </div>
                    </label>

                    {!form.launchNow && (
                      <div className="pt-3 border-t border-slate-100 space-y-3">
                        <Field label="Or Schedule for Later Date & Time" hint="Leave blank to save as Draft">
                          <Input
                            type="datetime-local"
                            value={form.scheduledAt}
                            onChange={(e) => setForm((prev) => ({ ...prev, scheduledAt: e.target.value }))}
                            className="border-slate-300 focus-visible:ring-emerald-500"
                          />
                        </Field>
                        <p className="text-[11px] text-slate-500">
                          Scheduled time operates in your current local timezone.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── STEP 6: Confirm ── */}
              {wizardStep === 5 && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4">
                    <h3 className="font-bold text-slate-900 text-sm mb-3">Review Campaign Summary</h3>

                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5 text-xs">
                      <div>
                        <dt className="text-slate-500 font-medium">Campaign Name</dt>
                        <dd className="font-semibold text-slate-900 mt-0.5">{form.name}</dd>
                      </div>

                      <div>
                        <dt className="text-slate-500 font-medium">Selected Template</dt>
                        <dd className="font-semibold text-slate-900 mt-0.5">
                          {selectedTemplate?.name || selectedTemplate?.templateName || '—'}
                        </dd>
                      </div>

                      <div>
                        <dt className="text-slate-500 font-medium">Audience</dt>
                        <dd className="font-semibold text-emerald-700 mt-0.5">
                          {form.audienceType === 'MANUAL'
                            ? `${parsedRecipients.length} manual recipients`
                            : `CRM Lead Filter (${form.leadFilterStatus || 'Any status'}, ${form.leadFilterStageId ? `Stage #${form.leadFilterStageId}` : 'Any stage'})`}
                        </dd>
                      </div>

                      <div>
                        <dt className="text-slate-500 font-medium">Delivery Mode</dt>
                        <dd className="font-semibold text-slate-900 mt-0.5">
                          {form.launchNow
                            ? '🚀 Immediate Launch'
                            : form.scheduledAt
                            ? `📅 Scheduled: ${new Date(form.scheduledAt).toLocaleString()}`
                            : '📝 Save as Draft'}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div>
                    <span className="text-xs font-semibold text-slate-700 block mb-2">Final WhatsApp Message Preview:</span>
                    <WhatsAppPreview
                      header={selectedTemplate?.headerContent}
                      body={previewBody}
                      footer={selectedTemplate?.footer || selectedTemplate?.footerText}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Wizard Footer Actions */}
            <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-2 border-t border-slate-200 bg-slate-50/50 p-4 sm:px-6">
              <Button
                type="button"
                variant="outline"
                disabled={wizardStep === 0 || saving}
                onClick={handleBack}
                className="w-full sm:w-auto border-slate-300 text-slate-700"
              >
                <FontAwesomeIcon icon={faChevronLeft} className="mr-2 text-xs" />
                Back
              </Button>

              <div className="flex w-full sm:w-auto items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={closeCreate}
                  disabled={saving}
                  className="w-full sm:w-auto text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </Button>

                {wizardStep < WIZARD_STEPS.length - 1 ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="w-full sm:w-auto bg-[#16A34A] hover:bg-[#15803D] text-white font-semibold"
                  >
                    Next
                    <FontAwesomeIcon icon={faChevronRight} className="ml-2 text-xs" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    disabled={saving}
                    onClick={createCampaign}
                    className="w-full sm:w-auto bg-[#16A34A] hover:bg-[#15803D] text-white font-semibold shadow-md"
                  >
                    {saving ? (
                      'Creating…'
                    ) : (
                      <>
                        <FontAwesomeIcon icon={form.launchNow ? faPaperPlane : faCheck} className="mr-2" />
                        {form.launchNow ? 'Launch Campaign' : 'Confirm & Create'}
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
