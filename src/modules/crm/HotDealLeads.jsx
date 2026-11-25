'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  ArrowUpRight,
  Building2,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Flame,
  Handshake,
  LayoutGrid,
  List,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  PhoneCall,
  RefreshCw,
  Search,
  UserCheck,
  X,
  Zap,
  AlertCircle,
} from 'lucide-react';
import { PageTitleCard } from '@/components/common/PageTitleCard';
import { KpiCard } from '@/components/common/KpiCard';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Label } from '@/components/common/Label';
import { FormDrawer } from '@/components/common/drawers/FormDrawer';
import { GlobalExport } from '@/components/export/GlobalExport';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { crmError, listLeadPage, logFollowUp, personName } from './crm-api';
import { HotDealIndicator } from './HotDealIndicator';

const PRIORITY_STYLES = {
  URGENT: 'border-rose-200 bg-rose-50 text-rose-700',
  HIGH: 'border-orange-200 bg-orange-50 text-orange-700',
  MEDIUM: 'border-amber-200 bg-amber-50 text-amber-700',
  LOW: 'border-slate-200 bg-slate-50 text-slate-600',
};

function formatDate(value) {
  if (!value) return 'Not scheduled';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value).slice(0, 10);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function isOverdue(value) {
  if (!value) return false;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d < today;
}

function initialsOf(name) {
  const parts = String(name || 'HL')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return 'HL';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function whatsappHref(phone) {
  const digits = String(phone || '').replace(/[^\d]/g, '');
  if (!digits) return '';
  const normalized = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${normalized}`;
}

export function HotDealLeads() {
  const [search, setSearch] = React.useState('');
  const [priorityFilter, setPriorityFilter] = React.useState('ALL');
  const [viewMode, setViewMode] = React.useState('table');
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(20);
  const [data, setData] = React.useState({ rows: [], pagination: {} });
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  // Quick follow-up drawer state
  const [followUpLead, setFollowUpLead] = React.useState(null);
  const [followUpForm, setFollowUpForm] = React.useState({
    notes: '',
    outcome: 'INTERESTED',
    nextFollowUpDate: '',
  });
  const [savingFollowUp, setSavingFollowUp] = React.useState(false);

  const refresh = React.useCallback(
    async (signal, isManual = false) => {
      if (isManual) setRefreshing(true);
      try {
        const result = await listLeadPage({
          stageKey: 'HOT_LEAD,HOT_DEAL',
          search: search.trim() || undefined,
          priority: priorityFilter !== 'ALL' ? priorityFilter : undefined,
          page,
          limit,
        });
        if (signal?.cancelled) return;
        setData(result);
        setError('');
      } catch (err) {
        if (!signal?.cancelled) {
          setError(crmError(err));
          setData({ rows: [], pagination: {} });
        }
      } finally {
        if (!signal?.cancelled) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [search, priorityFilter, page, limit]
  );

  React.useEffect(() => {
    const signal = { cancelled: false };
    setLoading(true);
    const initial = setTimeout(() => refresh(signal), 250);
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') refresh(signal);
    }, 30000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh(signal);
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      signal.cancelled = true;
      clearTimeout(initial);
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [refresh]);

  const rows = Array.isArray(data.rows) ? data.rows : [];
  const totalCount = Number(data.pagination?.total ?? rows.length);
  const totalPages = Math.max(1, Number(data.pagination?.totalPages || 1));

  const urgentOrHighCount = rows.filter((r) =>
    ['URGENT', 'HIGH'].includes(String(r.priority || '').toUpperCase())
  ).length;
  const scheduledFollowUpsCount = rows.filter((r) => Boolean(r.nextFollowUpDate)).length;
  const activeExecutivesCount = new Set(
    rows
      .map((r) => personName(r.assignedTo || r.employee))
      .filter((name) => name && name !== '—')
  ).size;

  const openFollowUpDrawer = (lead) => {
    setFollowUpLead(lead);
    setFollowUpForm({
      notes: '',
      outcome: 'INTERESTED',
      nextFollowUpDate: lead.nextFollowUpDate
        ? String(lead.nextFollowUpDate).slice(0, 10)
        : '',
    });
  };

  const handleFollowUpSubmit = async (e) => {
    e?.preventDefault?.();
    if (!followUpLead?.id) return;
    setSavingFollowUp(true);
    try {
      await logFollowUp(followUpLead.id, {
        notes: followUpForm.notes.trim() || 'Hot Lead follow-up logged',
        outcome: followUpForm.outcome,
        nextFollowUpDate: followUpForm.nextFollowUpDate || undefined,
      });
      toast({
        title: 'Follow-up logged',
        description: `Updated follow-up for ${followUpLead.companyName || personName(followUpLead)}.`,
      });
      setFollowUpLead(null);
      await refresh({ cancelled: false }, true);
    } catch (err) {
      toast({
        title: 'Failed to log follow-up',
        description: crmError(err),
        variant: 'destructive',
      });
    } finally {
      setSavingFollowUp(false);
    }
  };

  const startItem = totalCount === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, totalCount);

  return (
    <div className="space-y-5">
      <PageTitleCard
        moduleName="CRM"
        breadcrumb="Hot Leads"
        title="Hot Leads"
        badge={
          <span className="inline-flex items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-2.5 py-0.5 text-xs font-semibold text-orange-700">
            <Flame className="size-3.5 text-orange-500" />
            {totalCount} Active
          </span>
        }
        description="High-intent prospects ready for focused follow-up, rapid outreach, and conversion."
        icon={Handshake}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refresh({ cancelled: false }, true)}
              disabled={refreshing || loading}
              className="h-10 gap-1.5 rounded-xl border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:border-emerald-200 hover:text-[#173D30] shadow-2xs"
            >
              <RefreshCw className={cn('size-3.5 text-slate-500', refreshing && 'animate-spin')} />
              <span>Refresh</span>
            </Button>

            <GlobalExport
              module="leads"
              title="Hot Leads Report"
              filters={{
                stageKey: 'HOT_LEAD,HOT_DEAL',
                search: search.trim() || undefined,
                priority: priorityFilter !== 'ALL' ? priorityFilter : undefined,
              }}
              currentPageRows={rows}
              page={page}
              limit={limit}
            />

            <Link
              href="/admin/crm/leads"
              className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-[#173D30] px-4 text-xs font-semibold text-white shadow-xs transition hover:bg-[#123026]"
            >
              <span>All Leads Pipeline</span>
              <ArrowUpRight className="size-3.5 text-[#20C466]" />
            </Link>
          </>
        }
      />

      {/* KPI Summary Strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Total Hot Leads"
          value={loading ? '—' : totalCount}
          description="Prospects currently in Hot Lead stage"
          icon={Flame}
          iconColor="text-orange-600"
          iconBg="bg-orange-50 border-orange-200/80"
        />
        <KpiCard
          title="High / Urgent Priority"
          value={loading ? '—' : urgentOrHighCount}
          description="Immediate attention leads on this page"
          icon={Zap}
          iconColor="text-rose-600"
          iconBg="bg-rose-50 border-rose-200/80"
        />
        <KpiCard
          title="Follow-Ups Scheduled"
          value={loading ? '—' : scheduledFollowUpsCount}
          description="Leads with a planned next touchpoint"
          icon={CalendarClock}
          iconColor="text-emerald-700"
          iconBg="bg-emerald-50 border-emerald-200/80"
        />
        <KpiCard
          title="Assigned Executives"
          value={loading ? '—' : activeExecutivesCount}
          description="Team members actively handling Hot Leads"
          icon={UserCheck}
          iconColor="text-indigo-600"
          iconBg="bg-indigo-50 border-indigo-200/80"
        />
      </div>

      {/* Main Content Container */}
      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              aria-label="Search Hot Leads"
              type="text"
              placeholder="Search by company, contact, phone, email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-9 pr-9 text-sm text-slate-800 placeholder:text-slate-400 transition focus:border-[#173D30] focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
            {search && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => {
                  setSearch('');
                  setPage(1);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-200/70 hover:text-slate-600"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Priority Filter Pills */}
            <div className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1">
              {['ALL', 'URGENT', 'HIGH', 'MEDIUM', 'LOW'].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    setPriorityFilter(p);
                    setPage(1);
                  }}
                  className={cn(
                    'rounded-lg px-2.5 py-1 text-xs font-semibold transition',
                    priorityFilter === p
                      ? 'bg-white text-[#173D30] shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  )}
                >
                  {p === 'ALL' ? 'All' : p.charAt(0) + p.slice(1).toLowerCase()}
                </button>
              ))}
            </div>

            {/* View Mode Toggle */}
            <div className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                aria-label="Table view"
                className={cn(
                  'inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition',
                  viewMode === 'table'
                    ? 'bg-white text-[#173D30] shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                )}
              >
                <List className="size-3.5" />
                <span className="hidden sm:inline">Table</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                aria-label="Card view"
                className={cn(
                  'inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition',
                  viewMode === 'cards'
                    ? 'bg-white text-[#173D30] shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                )}
              >
                <LayoutGrid className="size-3.5" />
                <span className="hidden sm:inline">Cards</span>
              </button>
            </div>
          </div>
        </div>

        {/* Body States */}
        {error ? (
          <div className="p-6">
            <div
              role="alert"
              className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-rose-200 bg-rose-50/70 p-4 sm:flex-row sm:items-center"
            >
              <div className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
                  <AlertCircle className="size-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-rose-900">
                    Unable to load Hot Leads
                  </h3>
                  <p className="mt-0.5 text-xs text-rose-700">{error}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refresh({ cancelled: false }, true)}
                className="shrink-0 rounded-xl border-rose-200 bg-white text-xs font-semibold text-rose-700 hover:bg-rose-100"
              >
                <RefreshCw className="mr-1.5 size-3.5" />
                Try Again
              </Button>
            </div>
          </div>
        ) : loading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50/60 p-4 animate-pulse"
              >
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-slate-200" />
                  <div className="space-y-2">
                    <div className="h-4 w-44 rounded bg-slate-200" />
                    <div className="h-3 w-28 rounded bg-slate-200" />
                  </div>
                </div>
                <div className="hidden sm:block h-4 w-32 rounded bg-slate-200" />
                <div className="h-8 w-24 rounded-lg bg-slate-200" />
              </div>
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="flex size-16 items-center justify-center rounded-2xl border border-orange-100 bg-orange-50 text-orange-500 shadow-2xs">
              <Flame className="size-8" />
            </div>
            <h3 className="mt-4 text-base font-bold text-slate-900">
              {search || priorityFilter !== 'ALL'
                ? 'No matching Hot Leads found'
                : 'No Hot Leads right now'}
            </h3>
            <p className="mt-1.5 max-w-md text-xs leading-relaxed text-slate-500">
              {search || priorityFilter !== 'ALL'
                ? 'Try clearing your search query or switching the priority filter to see more prospects.'
                : 'Leads moved to the Hot Lead stage will automatically appear here for focused follow-up and fast conversion.'}
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
              {(search || priorityFilter !== 'ALL') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearch('');
                    setPriorityFilter('ALL');
                    setPage(1);
                  }}
                  className="rounded-xl text-xs font-semibold"
                >
                  Clear Filters
                </Button>
              )}
              <Link
                href="/admin/crm/leads"
                className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#173D30] px-4 text-xs font-semibold text-white transition hover:bg-[#123026]"
              >
                <span>Browse All Leads</span>
                <ArrowUpRight className="size-3.5 text-[#20C466]" />
              </Link>
            </div>
          </div>
        ) : viewMode === 'table' ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3">Lead / Business</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Priority &amp; Source</th>
                  <th className="px-4 py-3">Assigned To</th>
                  <th className="px-4 py-3">Next Follow-Up</th>
                  <th className="px-4 py-3 text-right">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((lead) => {
                  const displayName = lead.companyName || personName(lead);
                  const contactPerson = lead.companyName ? personName(lead) : '';
                  const assignee = personName(lead.assignedTo || lead.employee);
                  const priorityKey = String(lead.priority || 'MEDIUM').toUpperCase();
                  const overdue = isOverdue(lead.nextFollowUpDate);
                  const waUrl = whatsappHref(lead.phone);

                  return (
                    <tr
                      key={lead.id}
                      className="group transition-colors hover:bg-emerald-50/30"
                    >
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-orange-200/80 bg-gradient-to-br from-orange-50 to-amber-50 text-xs font-bold text-orange-700">
                            {initialsOf(displayName)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <Link
                                href={`/admin/crm/leads?leadId=${encodeURIComponent(lead.id)}`}
                                className="truncate font-semibold text-slate-900 hover:text-[#173D30] hover:underline"
                              >
                                {displayName}
                              </Link>
                              <HotDealIndicator lead={lead} />
                            </div>
                            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                              {contactPerson && contactPerson !== '—' && (
                                <span className="truncate">{contactPerson}</span>
                              )}
                              {lead.city && (
                                <span className="inline-flex items-center gap-1 text-slate-400">
                                  <MapPin className="size-3" />
                                  {lead.city}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="space-y-1 text-xs">
                          {lead.phone ? (
                            <a
                              href={`tel:${lead.phone}`}
                              className="inline-flex items-center gap-1.5 font-medium text-slate-700 hover:text-[#173D30]"
                            >
                              <Phone className="size-3.5 text-emerald-600" />
                              {lead.phone}
                            </a>
                          ) : (
                            <span className="text-slate-400">No phone</span>
                          )}
                          {lead.email && (
                            <div className="flex items-center gap-1.5 text-slate-500">
                              <Mail className="size-3 text-slate-400" />
                              <span className="max-w-[180px] truncate">{lead.email}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge
                            className={cn(
                              'rounded-full border px-2.5 py-0.5 text-[11px] font-semibold',
                              PRIORITY_STYLES[priorityKey] || PRIORITY_STYLES.MEDIUM
                            )}
                          >
                            {priorityKey}
                          </Badge>
                          {lead.source && (
                            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                              {lead.source}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-700">
                            {assignee !== '—' ? initialsOf(assignee) : '—'}
                          </span>
                          <span className="text-xs font-medium text-slate-700">
                            {assignee}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium',
                            overdue
                              ? 'bg-rose-50 text-rose-700'
                              : lead.nextFollowUpDate
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-slate-50 text-slate-500'
                          )}
                        >
                          <CalendarClock className="size-3.5" />
                          {formatDate(lead.nextFollowUpDate)}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          {lead.phone && (
                            <a
                              href={`tel:${lead.phone}`}
                              title="Call Lead"
                              className="inline-flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                            >
                              <PhoneCall className="size-3.5" />
                            </a>
                          )}
                          {waUrl && (
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noreferrer"
                              title="Message on WhatsApp"
                              className="inline-flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                            >
                              <MessageSquare className="size-3.5" />
                            </a>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openFollowUpDrawer(lead)}
                            className="h-8 rounded-lg border-slate-200 px-2.5 text-xs font-semibold text-slate-700 hover:border-emerald-200 hover:bg-emerald-50 hover:text-[#173D30]"
                          >
                            Follow-up
                          </Button>
                          <Link
                            href={`/admin/crm/leads?leadId=${encodeURIComponent(lead.id)}`}
                            title="Open Lead Details"
                            className="inline-flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
                          >
                            <ExternalLink className="size-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 xl:grid-cols-3">
            {rows.map((lead) => {
              const displayName = lead.companyName || personName(lead);
              const contactPerson = lead.companyName ? personName(lead) : '';
              const assignee = personName(lead.assignedTo || lead.employee);
              const priorityKey = String(lead.priority || 'MEDIUM').toUpperCase();
              const overdue = isOverdue(lead.nextFollowUpDate);
              const waUrl = whatsappHref(lead.phone);

              return (
                <div
                  key={lead.id}
                  className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs transition hover:border-orange-200 hover:shadow-md"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-orange-200 bg-orange-50 text-xs font-bold text-orange-700">
                          {initialsOf(displayName)}
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/admin/crm/leads?leadId=${encodeURIComponent(lead.id)}`}
                            className="block truncate text-sm font-bold text-slate-900 hover:text-[#173D30] hover:underline"
                          >
                            {displayName}
                          </Link>
                          <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            <HotDealIndicator lead={lead} />
                            <Badge
                              className={cn(
                                'rounded-full border px-2 py-0 text-[10px] font-semibold',
                                PRIORITY_STYLES[priorityKey] || PRIORITY_STYLES.MEDIUM
                              )}
                            >
                              {priorityKey}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2 border-t border-slate-100 pt-3 text-xs text-slate-600">
                      {contactPerson && contactPerson !== '—' && (
                        <div className="flex items-center gap-2">
                          <Building2 className="size-3.5 text-slate-400" />
                          <span className="truncate">{contactPerson}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Phone className="size-3.5 text-emerald-600" />
                        <span>{lead.phone || 'No phone on record'}</span>
                      </div>
                      {lead.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="size-3.5 text-slate-400" />
                          <span className="truncate">{lead.email}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-slate-500">
                          Exec: <strong className="font-semibold text-slate-700">{assignee}</strong>
                        </span>
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium',
                            overdue
                              ? 'bg-rose-50 text-rose-700'
                              : 'bg-slate-100 text-slate-600'
                          )}
                        >
                          <CalendarClock className="size-3" />
                          {formatDate(lead.nextFollowUpDate)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openFollowUpDrawer(lead)}
                      className="h-8 flex-1 rounded-xl border-slate-200 text-xs font-semibold text-slate-700 hover:border-emerald-200 hover:bg-emerald-50 hover:text-[#173D30]"
                    >
                      Log Follow-up
                    </Button>
                    {waUrl && (
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-8 items-center justify-center rounded-xl border border-slate-200 px-2.5 text-xs font-semibold text-slate-700 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                      >
                        <MessageSquare className="size-3.5" />
                      </a>
                    )}
                    <Link
                      href={`/admin/crm/leads?leadId=${encodeURIComponent(lead.id)}`}
                      className="inline-flex h-8 items-center justify-center rounded-xl bg-[#173D30] px-3 text-xs font-semibold text-white hover:bg-[#123026]"
                    >
                      Open
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Footer */}
        <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/50 px-4 py-3 text-xs text-slate-600 sm:flex-row">
          <div className="flex items-center gap-3">
            <span>
              Showing <strong className="text-slate-900">{startItem}</strong>–
              <strong className="text-slate-900">{endItem}</strong> of{' '}
              <strong className="text-slate-900">{totalCount}</strong> Hot Leads
            </span>
            <select
              aria-label="Rows per page"
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 focus:border-[#173D30] focus:outline-none"
            >
              <option value={10}>10 / page</option>
              <option value={20}>20 / page</option>
              <option value={50}>50 / page</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((v) => Math.max(1, v - 1))}
              className="h-8 gap-1 rounded-xl border-slate-200 bg-white px-3 text-xs font-semibold disabled:opacity-40"
            >
              <ChevronLeft className="size-3.5" />
              Previous
            </Button>
            <span className="px-2 font-medium text-slate-700">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((v) => Math.min(totalPages, v + 1))}
              className="h-8 gap-1 rounded-xl border-slate-200 bg-white px-3 text-xs font-semibold disabled:opacity-40"
            >
              Next
              <ChevronRight className="size-3.5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Quick Follow-Up Drawer */}
      <FormDrawer
        open={Boolean(followUpLead)}
        onOpenChange={(open) => {
          if (!open) setFollowUpLead(null);
        }}
        title="Log Hot Lead Follow-up"
        description={
          followUpLead
            ? `Record an interaction for ${followUpLead.companyName || personName(followUpLead)}`
            : ''
        }
        onSubmit={handleFollowUpSubmit}
        submitLabel="Save Follow-up"
        loading={savingFollowUp}
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="hl-outcome">Call / Meeting Outcome</Label>
            <select
              id="hl-outcome"
              value={followUpForm.outcome}
              onChange={(e) =>
                setFollowUpForm((prev) => ({ ...prev, outcome: e.target.value }))
              }
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:border-[#173D30] focus:outline-none"
            >
              <option value="INTERESTED">Interested / Moving Forward</option>
              <option value="CALLBACK_REQUESTED">Callback Requested</option>
              <option value="PROPOSAL_REQUESTED">Proposal Requested</option>
              <option value="NO_ANSWER">No Answer</option>
              <option value="NOT_INTERESTED">Not Interested</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="hl-next-date">Next Follow-Up Date</Label>
            <input
              id="hl-next-date"
              type="date"
              value={followUpForm.nextFollowUpDate}
              onChange={(e) =>
                setFollowUpForm((prev) => ({
                  ...prev,
                  nextFollowUpDate: e.target.value,
                }))
              }
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:border-[#173D30] focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="hl-notes">Follow-up Notes</Label>
            <textarea
              id="hl-notes"
              rows={4}
              placeholder="Summarize client feedback, pricing discussion, or next steps..."
              value={followUpForm.notes}
              onChange={(e) =>
                setFollowUpForm((prev) => ({ ...prev, notes: e.target.value }))
              }
              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#173D30] focus:outline-none"
            />
          </div>
        </div>
      </FormDrawer>
    </div>
  );
}
