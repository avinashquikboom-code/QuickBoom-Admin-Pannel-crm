'use client';

import React, { useEffect, useState } from 'react';
import { GooglePlacesDrawer } from '@/components/admin/drawers/GooglePlacesDrawer';
import { LeadDetailsDrawer } from '@/components/admin/drawers/LeadDetailsDrawer';
import { emptyLeadForm, LeadFormFields } from '@/components/admin/drawers/LeadFormFields';
import { AdminRowActions } from '@/components/admin/tables/AdminRowActions';
import {
  Building2,
  CheckCircle2,
  Download,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  AdminButton,
  AdminCard,
  AdminConfirmDialog,
  AdminDataTable,
  AdminFormDrawer,
  AdminPagination,
  AdminSelect,
  AdminStatCard,
  AdminStatusBadge,
} from '@/components/admin';
import { CreateLeadInput, Lead, leadsApi } from '@/lib/leads-api';
import { getErrorMessage } from '@/lib/utils';

const emptyForm = emptyLeadForm;

const SOURCE_OPTIONS = [
  { value: 'ALL', label: 'All Sources' },
  { value: 'GOOGLE_PLACES', label: 'Google Places' },
  { value: 'DATA_CAPTURE', label: 'Data Capture' },
  { value: 'MANUAL', label: 'Manual' },
  { value: 'WEBSITE', label: 'Website' },
  { value: 'IMPORT', label: 'Import' },
];

export default function LeadsPage() {
  const client = useQueryClient();
  const [placesOpen, setPlacesOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<{ id: number; action: 'view' | 'edit' | 'stage' } | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [confirmDelete, setConfirmDelete] = useState<
    | { open: false }
    | { open: true; type: 'single'; id: number; name: string }
    | { open: true; type: 'bulk'; ids: number[]; count: number }
  >({ open: false });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [source, setSource] = useState('ALL');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CreateLeadInput>(emptyForm);

  const stageQuery = useQuery({
    queryKey: ['lead-stages'],
    queryFn: leadsApi.stages,
    staleTime: 60_000,
  });
  const configuredStages = stageQuery.data || [];

  const list = useQuery({
    queryKey: ['leads', { page, limit, search, status, source }],
    queryFn: () =>
      leadsApi.list({
        page,
        limit,
        search: search.trim() || undefined,
        status: status === 'ALL' ? undefined : status,
        source: source === 'ALL' ? undefined : source,
      }),
  });

  // Summary counts using existing list endpoint
  const statsNewQuery = useQuery({
    queryKey: ['leads-count', 'NEW'],
    queryFn: () => leadsApi.list({ limit: 1, status: 'NEW' }),
    staleTime: 60_000,
  });

  const statsWonQuery = useQuery({
    queryKey: ['leads-count', 'WON'],
    queryFn: () => leadsApi.list({ limit: 1, status: 'WON' }),
    staleTime: 60_000,
  });

  const create = useMutation({
    mutationFn: async (input: CreateLeadInput) => {
      const lead = await leadsApi.create(input);
      if (!lead?.id) throw new Error('The create response did not return a Lead ID');
      return lead;
    },
    onSuccess: async (lead) => {
      if (process.env.NODE_ENV !== 'production') {
        console.debug('[MANUAL_LEAD_CREATE_DEBUG]', {
          createdLeadId: lead.id,
          assignedToId: lead.assignedToId,
          createdById: lead.createdById,
          status: lead.status,
          source: lead.source,
          createdFrom: lead.createdFrom,
          deletedAt: lead.deletedAt,
          createdAt: lead.createdAt,
        });
      }
      setOpen(false);
      setForm(emptyForm);
      setPage(1);
      await client.invalidateQueries({ queryKey: ['leads'] });
      await client.invalidateQueries({ queryKey: ['leads-count'] });
      toast.success('Lead created successfully');
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => leadsApi.delete(id),
    onSuccess: (res, deletedId) => {
      toast.success(res?.message || 'Lead deleted successfully');
      setConfirmDelete({ open: false });
      setSelectedIds(prev => prev.filter(item => item !== deletedId));
      client.invalidateQueries({ queryKey: ['leads'] });
      client.invalidateQueries({ queryKey: ['leads-count'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: number[]) => leadsApi.bulkDelete(ids),
    onSuccess: (res, deletedIds) => {
      toast.success(res?.message || 'Selected leads deleted successfully');
      setConfirmDelete({ open: false });
      setSelectedIds(prev => prev.filter(item => !deletedIds.includes(item)));
      client.invalidateQueries({ queryKey: ['leads'] });
      client.invalidateQueries({ queryKey: ['leads-count'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const leads = list.data?.data || [];
  const total = list.data?.total || 0;
  const totalPages = list.data?.totalPages || 1;
  const selectedOnPage = leads.filter(lead => selectedIds.includes(lead.id));

  useEffect(() => {
    setSelectedIds([]);
  }, [page, limit, search, status, source]);

  const toggleSelection = (id: number) =>
    setSelectedIds(current => (current.includes(id) ? current.filter(value => value !== id) : [...current, id]));

  const togglePage = () =>
    setSelectedIds(selectedOnPage.length === leads.length ? [] : leads.map(lead => lead.id));

  const exportPage = () => {
    const rows = selectedOnPage.length ? selectedOnPage : leads;
    const escape = (value: unknown) => {
      const text = String(value ?? '');
      return `"${(/^[=+@-]/.test(text) ? "'" + text : text).replace(/"/g, '""')}"`;
    };
    const csv = [
      ['Lead Name', 'Phone', 'Email', 'Company', 'Stage', 'Source', 'Location', 'Created On'],
      ...rows.map(lead => [
        [lead.firstName, lead.lastName].filter(Boolean).join(' ') || lead.companyName,
        lead.phone,
        lead.email,
        lead.companyName,
        lead.stage?.name || configuredStages.find(stage => stage.key === lead.status)?.name || lead.status,
        lead.source,
        [lead.city, lead.state].filter(Boolean).join(', ') || lead.address || '',
        lead.createdAt,
      ]),
    ]
      .map(row => row.map(escape).join(','))
      .join('\r\n');
    const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8;' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `leads-page-${page}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${rows.length} Leads${selectedOnPage.length ? '' : ' from the current page'}`);
  };

  const newCount = statsNewQuery.data?.total ?? 0;
  const wonCount = statsWonQuery.data?.total ?? 0;
  const inProgressCount = Math.max(0, total - newCount - wonCount);

  return (
    <div className="space-y-5 min-w-0 max-w-[1600px] mx-auto pb-16">
      {/* 1. Header: Premium Dark Teal / Green Gradient Header Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#05291c] via-[#093c28] to-[#041f15] p-5 sm:p-7 text-white border border-emerald-800/40 shadow-xl shadow-emerald-950/20">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -bottom-16 h-48 w-48 rounded-full bg-teal-500/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Title & Description */}
          <div className="flex items-start sm:items-center gap-4 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 flex items-center justify-center font-bold shadow-inner shrink-0">
              <Users className="w-6 h-6 text-[#23C45E]" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Leads
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  CRM Pipeline
                </span>
              </div>
              <p className="text-xs sm:text-sm text-emerald-100/75 font-normal mt-1 max-w-2xl leading-relaxed">
                Manage your business leads, track pipeline stages, and discover high-value opportunities.
              </p>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={exportPage}
              disabled={!leads.length || list.isLoading}
              title={selectedOnPage.length ? 'Export selected Leads on this page' : 'Export Leads on the current page'}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold text-white bg-white/10 hover:bg-white/15 border border-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xs cursor-pointer active:scale-[0.98]"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>

            <button
              type="button"
              onClick={() => setPlacesOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold text-emerald-300 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 transition-all shadow-xs cursor-pointer active:scale-[0.98]"
            >
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span>Google Places</span>
            </button>

            <button
              type="button"
              onClick={() => setOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[#23C45E] hover:bg-[#1AA14D] transition-all shadow-md shadow-emerald-950/30 cursor-pointer active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>Add Lead</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Summary Cards: Real Pipeline Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <AdminStatCard
          title="Total Leads"
          value={list.isLoading && !list.data ? '—' : total}
          icon={Users}
          iconBg="primary"
          description="Total database records"
          loading={list.isLoading && !list.data}
        />
        <AdminStatCard
          title="New Leads"
          value={statsNewQuery.isLoading && !statsNewQuery.data ? '—' : newCount}
          icon={Sparkles}
          iconBg="blue"
          description="Awaiting initial contact"
          loading={statsNewQuery.isLoading && !statsNewQuery.data}
        />
        <AdminStatCard
          title="In Progress"
          value={
            (statsNewQuery.isLoading || statsWonQuery.isLoading) && !statsNewQuery.data
              ? '—'
              : inProgressCount
          }
          icon={TrendingUp}
          iconBg="amber"
          description="Active in discussion"
          loading={(statsNewQuery.isLoading || statsWonQuery.isLoading) && !statsNewQuery.data}
        />
        <AdminStatCard
          title="Converted"
          value={statsWonQuery.isLoading && !statsWonQuery.data ? '—' : wonCount}
          icon={CheckCircle2}
          iconBg="primary"
          description="Closed / Won deals"
          loading={statsWonQuery.isLoading && !statsWonQuery.data}
        />
      </div>

      {/* 3. Search and Filters Toolbar */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Search Box */}
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={event => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search leads by name, phone, email, or company..."
              className="w-full rounded-xl border border-slate-200/90 bg-slate-50/50 pl-10 pr-9 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filters & Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Stage Filter */}
            <AdminSelect
              aria-label="Filter Leads by stage"
              value={status}
              className="!rounded-xl !py-2.5 !text-xs !bg-slate-50/50 focus:!bg-white min-w-[140px]"
              onChange={event => {
                setStatus(event.target.value);
                setPage(1);
              }}
              options={[
                { value: 'ALL', label: 'All Stages' },
                ...configuredStages.map(s => ({ value: s.key, label: s.name })),
              ]}
            />

            {/* Source Filter */}
            <AdminSelect
              aria-label="Filter Leads by source"
              value={source}
              className="!rounded-xl !py-2.5 !text-xs !bg-slate-50/50 focus:!bg-white min-w-[130px]"
              onChange={event => {
                setSource(event.target.value);
                setPage(1);
              }}
              options={SOURCE_OPTIONS}
            />

            {/* Per Page */}
            <label className="flex items-center gap-1.5 text-xs text-slate-500 whitespace-nowrap">
              <span>Show:</span>
              <AdminSelect
                aria-label="Leads per page"
                value={limit}
                className="!rounded-xl !py-2.5 !text-xs !bg-slate-50/50 focus:!bg-white !w-[75px]"
                onChange={event => {
                  setLimit(Number(event.target.value));
                  setPage(1);
                }}
                options={[10, 20, 50, 100].map(size => ({ value: String(size), label: String(size) }))}
              />
            </label>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={() => list.refetch()}
              disabled={list.isFetching}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-200/90 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors disabled:opacity-50 cursor-pointer"
              title="Refresh list"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${list.isFetching ? 'animate-spin text-emerald-600' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Selection & Bulk Actions Banner */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-500">
              {selectedOnPage.length
                ? `${selectedOnPage.length} of ${leads.length} leads selected on this page`
                : `Showing ${total ? (page - 1) * limit + 1 : 0} - ${Math.min(page * limit, total)} of ${total} leads`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {selectedOnPage.length > 0 && (
              <>
                <AdminButton
                  variant="outline"
                  size="sm"
                  icon={Trash2}
                  className="!text-rose-600 hover:!bg-rose-50 border-rose-200 !py-1 !text-xs"
                  onClick={() =>
                    setConfirmDelete({
                      open: true,
                      type: 'bulk',
                      ids: selectedOnPage.map(l => l.id),
                      count: selectedOnPage.length,
                    })
                  }
                  disabled={bulkDeleteMutation.isPending || deleteMutation.isPending}
                >
                  Delete Selected ({selectedOnPage.length})
                </AdminButton>
                <button
                  type="button"
                  onClick={() => setSelectedIds([])}
                  className="text-xs text-slate-500 hover:text-slate-800 font-medium underline px-1"
                >
                  Deselect All
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stage Loading Error Warning */}
      {stageQuery.isError && (
        <div
          role="alert"
          className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs text-rose-700"
        >
          <span>Unable to load pipeline stages configuration.</span>
          <AdminButton size="sm" variant="ghost" onClick={() => stageQuery.refetch()}>
            Retry
          </AdminButton>
        </div>
      )}

      {/* 4. Leads Table Card */}
      <AdminCard
        title="All Leads Records"
        description={`Page ${page} of ${totalPages} • Total ${total} records`}
        bodyClassName="p-0"
        className="!rounded-3xl border-slate-200/80 shadow-xs overflow-hidden"
      >
        {list.isError ? (
          <div role="alert" className="p-8 text-center space-y-3">
            <p className="text-sm font-semibold text-rose-700">{getErrorMessage(list.error)}</p>
            <AdminButton variant="outline" size="sm" onClick={() => list.refetch()}>
              Retry Loading
            </AdminButton>
          </div>
        ) : (
          <>
            <AdminDataTable<Lead>
              data={leads}
              loading={list.isLoading}
              onRowClick={lead => setSelectedLead({ id: lead.id, action: 'view' })}
              keyExtractor={lead => String(lead.id)}
              emptyTitle="No leads found"
              emptyDescription="No leads match your search criteria. Add a new lead manually or discover verified businesses using Google Places."
              minWidth="min-w-[1300px] table-fixed"
              className="!rounded-none !border-0 !shadow-none [&_td]:!px-4 [&_td]:!py-3.5 [&_th]:!px-4 [&_th]:!py-3.5 [&_th]:!font-bold [&_th]:!text-[11px] [&_th]:!uppercase [&_th]:!tracking-wider [&_th]:!text-slate-400 [&_td]:align-middle"
              rowClassName={lead =>
                selectedIds.includes(lead.id)
                  ? 'bg-emerald-50/60 hover:!bg-emerald-50/80 transition-colors'
                  : 'hover:bg-slate-50/80 transition-colors'
              }
              columns={[
                // 1. Checkbox
                {
                  key: 'selection',
                  headerClassName: 'w-12 text-center',
                  className: 'text-center',
                  header: (
                    <input
                      type="checkbox"
                      aria-label="Select all Leads on this page"
                      className="h-4 w-4 rounded accent-emerald-600 cursor-pointer"
                      checked={leads.length > 0 && selectedOnPage.length === leads.length}
                      ref={input => {
                        if (input) {
                          input.indeterminate = selectedOnPage.length > 0 && selectedOnPage.length < leads.length;
                        }
                      }}
                      onChange={togglePage}
                    />
                  ),
                  render: lead => (
                    <input
                      type="checkbox"
                      aria-label={`Select ${lead.companyName}`}
                      className="h-4 w-4 rounded accent-emerald-600 cursor-pointer"
                      checked={selectedIds.includes(lead.id)}
                      onClick={e => e.stopPropagation()}
                      onChange={() => toggleSelection(lead.id)}
                    />
                  ),
                },

                // 2. Lead Name & Category
                {
                  key: 'name',
                  header: 'Lead Name',
                  headerClassName: 'w-[18%]',
                  render: lead => {
                    const fullName =
                      [lead.firstName, lead.lastName].filter(Boolean).join(' ').trim() ||
                      lead.companyName ||
                      '—';
                    const initials = fullName
                      .split(' ')
                      .map(p => p[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase();

                    return (
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-50 border border-emerald-200/60 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                          {initials || <Users className="w-4 h-4 text-emerald-600" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <button
                            type="button"
                            onClick={event => {
                              event.stopPropagation();
                              setSelectedLead({ id: lead.id, action: 'view' });
                            }}
                            className="text-left font-bold text-slate-900 hover:text-emerald-700 transition-colors line-clamp-1 text-xs"
                          >
                            {fullName}
                          </button>
                          {lead.category && (
                            <span className="inline-block mt-0.5 truncate text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                              {lead.category}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  },
                },

                // 3. Contact (Phone & Email)
                {
                  key: 'phone',
                  header: 'Contact',
                  headerClassName: 'w-[16%]',
                  render: lead => (
                    <div className="space-y-1 font-normal text-xs">
                      {lead.phone ? (
                        <p className="flex items-center gap-1.5 font-semibold text-slate-800">
                          <Phone className="h-3 w-3 shrink-0 text-slate-400" />
                          <span>{lead.phone}</span>
                        </p>
                      ) : (
                        <p className="text-slate-400 text-[11px]">—</p>
                      )}
                      {lead.email && (
                        <p className="flex items-center gap-1.5 text-[11px] text-slate-500">
                          <Mail className="h-3 w-3 shrink-0 text-slate-400" />
                          <span className="truncate max-w-[180px]">{lead.email}</span>
                        </p>
                      )}
                    </div>
                  ),
                },

                // 4. Company
                {
                  key: 'companyName',
                  header: 'Company',
                  headerClassName: 'w-[16%]',
                  render: lead => (
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <button
                        type="button"
                        onClick={event => {
                          event.stopPropagation();
                          setSelectedLead({ id: lead.id, action: 'view' });
                        }}
                        className="text-left truncate font-medium text-slate-800 hover:text-emerald-700 text-xs transition-colors"
                      >
                        {lead.companyName || '—'}
                      </button>
                    </div>
                  ),
                },

                // 5. Location
                {
                  key: 'location',
                  header: 'Location',
                  headerClassName: 'w-[14%]',
                  render: lead => {
                    const loc =
                      [lead.city, lead.state].filter(Boolean).join(', ') ||
                      lead.address ||
                      null;
                    return loc ? (
                      <div className="flex items-start gap-1 text-xs text-slate-600 font-normal">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-2 text-[11px] leading-snug">{loc}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs">—</span>
                    );
                  },
                },

                // 6. Stage
                {
                  key: 'status',
                  header: 'Stage',
                  headerClassName: 'w-[12%]',
                  render: lead => {
                    const stage = lead.stage || configuredStages.find(item => item.key === lead.status);
                    return (
                      <span
                        style={
                          {
                            '--stage-bg': stage?.bgColor || '#f1f5f9',
                            '--stage-text': stage?.color || '#475569',
                            '--stage-border': stage?.borderColor || '#e2e8f0',
                          } as React.CSSProperties
                        }
                      >
                        <AdminStatusBadge
                          status={stage?.key || lead.status || 'UNKNOWN'}
                          label={stage?.name || lead.status || '—'}
                          className="!normal-case !tracking-normal !font-bold !text-[10px] !bg-[var(--stage-bg)] !text-[var(--stage-text)] !border-[var(--stage-border)] !rounded-lg !px-2 !py-0.5"
                        />
                      </span>
                    );
                  },
                },

                // 7. Source
                {
                  key: 'source',
                  header: 'Source',
                  headerClassName: 'w-[11%]',
                  render: lead => {
                    const label =
                      ({
                        GOOGLE_PLACES: 'Google Places',
                        DATA_CAPTURE: 'Data Capture',
                        MANUAL: 'Manual',
                        WEBSITE: 'Website',
                        IMPORT: 'Import',
                      } as Record<string, string>)[lead.source] ||
                      lead.source?.replace(/_/g, ' ') ||
                      '—';

                    return (
                      <span className="inline-block text-[11px] font-medium text-slate-600 bg-slate-100 border border-slate-200/80 px-2 py-0.5 rounded-md truncate max-w-[120px]">
                        {label}
                      </span>
                    );
                  },
                },

                // 8. Created On
                {
                  key: 'createdAt',
                  header: 'Created On',
                  headerClassName: 'w-[11%]',
                  render: lead => {
                    const date = new Date(lead.createdAt);
                    return Number.isNaN(date.getTime()) ? (
                      '—'
                    ) : (
                      <div className="space-y-0.5 whitespace-nowrap font-normal text-xs text-slate-700">
                        <p>{date.toLocaleDateString('en-GB')}</p>
                        <p className="text-[10px] text-slate-400">{date.toLocaleTimeString('en-GB')}</p>
                      </div>
                    );
                  },
                },

                // 9. Actions
                {
                  key: 'actions',
                  header: 'Actions',
                  headerClassName: 'w-[180px]',
                  render: lead => (
                    <div
                      className="flex items-center gap-1.5"
                      onClick={event => event.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedLead({ id: lead.id, action: 'view' })}
                        className="px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:text-emerald-700 bg-white hover:bg-emerald-50/70 border border-slate-200/80 hover:border-emerald-300 rounded-lg transition-colors cursor-pointer"
                      >
                        View
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedLead({ id: lead.id, action: 'edit' })}
                        aria-label={`Edit Lead ${lead.companyName}`}
                        title="Edit Lead"
                        className="p-1 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>

                      <AdminRowActions
                        label={`More actions for ${lead.companyName}`}
                        items={[
                          { label: 'View Details', onSelect: () => setSelectedLead({ id: lead.id, action: 'view' }) },
                          { label: 'Edit Lead', onSelect: () => setSelectedLead({ id: lead.id, action: 'edit' }) },
                          { label: 'Change Stage', onSelect: () => setSelectedLead({ id: lead.id, action: 'stage' }) },
                          {
                            label: 'Delete Lead',
                            danger: true,
                            onSelect: () =>
                              setConfirmDelete({
                                open: true,
                                type: 'single',
                                id: lead.id,
                                name:
                                  [lead.firstName, lead.lastName].filter(Boolean).join(' ').trim() ||
                                  lead.companyName ||
                                  `Lead #${lead.id}`,
                              }),
                          },
                        ]}
                      />
                    </div>
                  ),
                },
              ]}
            />

            {/* 5. Clean Empty State with Both Actions */}
            {!list.isLoading && leads.length === 0 && (
              <div className="py-12 px-4 text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200/60 text-emerald-600 flex items-center justify-center mx-auto shadow-2xs">
                  <Users className="w-7 h-7 text-[#23C45E]" />
                </div>
                <div className="max-w-md mx-auto space-y-1.5">
                  <h4 className="text-base font-bold text-slate-900">No leads found</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {search || status !== 'ALL' || source !== 'ALL'
                      ? 'No leads match the selected filter criteria. Try clearing filters or searching another keyword.'
                      : 'Get started by creating a lead manually or discover and import verified businesses using Google Places.'}
                  </p>
                </div>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <AdminButton icon={Plus} size="sm" onClick={() => setOpen(true)}>
                    Add Lead
                  </AdminButton>
                  <AdminButton
                    variant="outline"
                    icon={MapPin}
                    size="sm"
                    onClick={() => setPlacesOpen(true)}
                  >
                    Import from Google Places
                  </AdminButton>
                </div>
              </div>
            )}
          </>
        )}

        {/* 6. Pagination */}
        <div className="border-t border-slate-100">
          <AdminPagination
            page={page}
            pageSize={limit}
            total={total}
            totalPages={totalPages}
            onPageChange={setPage}
            onPageSizeChange={value => {
              setLimit(value);
              setPage(1);
            }}
            disabled={list.isFetching}
          />
        </div>
      </AdminCard>

      {/* Drawers and Dialogs */}
      {placesOpen && (
        <GooglePlacesDrawer
          onClose={() => setPlacesOpen(false)}
          onImported={() => {
            setPage(1);
            client.invalidateQueries({ queryKey: ['leads'] });
            client.invalidateQueries({ queryKey: ['leads-count'] });
          }}
        />
      )}

      {selectedLead && (
        <LeadDetailsDrawer
          key={selectedLead.id}
          id={selectedLead.id}
          initialAction={selectedLead.action}
          onClose={() => setSelectedLead(null)}
        />
      )}

      <AdminFormDrawer
        isOpen={open}
        onClose={() => {
          if (!create.isPending) setOpen(false);
        }}
        title="Add Lead"
        icon={Users}
        onSave={() => {
          if (!form.companyName.trim()) {
            toast.error('Business name is required');
            return;
          }
          const input = Object.fromEntries(
            Object.entries(form).map(([key, value]) => [key, value?.trim() || undefined])
          ) as CreateLeadInput;
          create.mutate(input);
        }}
        saveLabel={create.isPending ? 'Creating...' : 'Create Lead'}
        isSubmitting={create.isPending}
      >
        <LeadFormFields value={form} onChange={setForm} disabled={create.isPending} />
      </AdminFormDrawer>

      <AdminConfirmDialog
        isOpen={confirmDelete.open}
        title={
          confirmDelete.open && confirmDelete.type === 'bulk'
            ? `Delete ${confirmDelete.count} Leads`
            : 'Delete Lead'
        }
        message={
          confirmDelete.open && confirmDelete.type === 'bulk'
            ? `Are you sure you want to delete ${confirmDelete.count} selected leads? This action cannot be undone.`
            : `Are you sure you want to delete "${
                confirmDelete.open && confirmDelete.type === 'single' ? confirmDelete.name : ''
              }"? This action cannot be undone.`
        }
        confirmLabel={deleteMutation.isPending || bulkDeleteMutation.isPending ? 'Deleting...' : 'Delete'}
        variant="danger"
        loading={deleteMutation.isPending || bulkDeleteMutation.isPending}
        onConfirm={() => {
          if (!confirmDelete.open) return;
          if (confirmDelete.type === 'bulk') {
            bulkDeleteMutation.mutate(confirmDelete.ids);
          } else {
            deleteMutation.mutate(confirmDelete.id);
          }
        }}
        onClose={() => setConfirmDelete({ open: false })}
      />
    </div>
  );
}

