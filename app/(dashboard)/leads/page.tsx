'use client';

import React, { useEffect, useState } from 'react';
import { LeadDetailsDrawer } from '@/components/admin/drawers/LeadDetailsDrawer';
import { emptyLeadForm, LeadFormFields } from '@/components/admin/drawers/LeadFormFields';
import { AdminRowActions } from '@/components/admin/tables/AdminRowActions';
import { Download, Mail, Pencil, Phone, Plus, RefreshCw, Trash2, Users } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { AdminButton, AdminCard, AdminConfirmDialog, AdminDataTable, AdminFormDrawer, AdminPageHeader, AdminPagination, AdminSearchInput, AdminSelect, AdminStatusBadge } from '@/components/admin';
import { CreateLeadInput, Lead, leadsApi } from '@/lib/leads-api';
import { getErrorMessage } from '@/lib/utils';

const emptyForm = emptyLeadForm;

export default function LeadsPage() {
  const client = useQueryClient();
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
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CreateLeadInput>(emptyForm);
  const stageQuery = useQuery({ queryKey: ['lead-stages'], queryFn: leadsApi.stages, staleTime: 60_000 });
  const configuredStages = stageQuery.data || [];
  const list = useQuery({
    queryKey: ['leads', { page, limit, search, status }],
    queryFn: () => leadsApi.list({ page, limit, search: search.trim() || undefined, status: status === 'ALL' ? undefined : status }),
  });
  const create = useMutation({
    mutationFn: async (input: CreateLeadInput) => {
      const lead = await leadsApi.create(input);
      if (!lead?.id) throw new Error('The create response did not return a Lead ID');
      return lead;
    },
    onSuccess: async (lead) => {
      if (process.env.NODE_ENV !== 'production') console.debug('[MANUAL_LEAD_CREATE_DEBUG]', {
        createdLeadId: lead.id, assignedToId: lead.assignedToId, createdById: lead.createdById,
        status: lead.status, source: lead.source, createdFrom: lead.createdFrom, deletedAt: lead.deletedAt, createdAt: lead.createdAt,
      });
      setOpen(false);
      setForm(emptyForm);
      setPage(1);
      await client.invalidateQueries({ queryKey: ['leads'] });
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
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const leads = list.data?.data || [];
  const total = list.data?.total || 0;
  const totalPages = list.data?.totalPages || 1;
  const selectedOnPage = leads.filter(lead => selectedIds.includes(lead.id));
  useEffect(() => { setSelectedIds([]); }, [page, limit, search, status]);
  const toggleSelection = (id: number) => setSelectedIds(current => current.includes(id) ? current.filter(value => value !== id) : [...current, id]);
  const togglePage = () => setSelectedIds(selectedOnPage.length === leads.length ? [] : leads.map(lead => lead.id));
  const exportPage = () => {
    const rows = selectedOnPage.length ? selectedOnPage : leads;
    const escape = (value: unknown) => {
      const text = String(value ?? '');
      return `"${(/^[=+@-]/.test(text) ? "'" + text : text).replace(/"/g, '""')}"`;
    };
    const csv = [
      ['Lead Name', 'Phone', 'Email', 'Company', 'Stage', 'Source', 'Created On'],
      ...rows.map(lead => [[lead.firstName, lead.lastName].filter(Boolean).join(' ') || lead.companyName, lead.phone, lead.email,
        lead.companyName, lead.stage?.name || configuredStages.find(stage => stage.key === lead.status)?.name || lead.status,
        lead.source, lead.createdAt]),
    ].map(row => row.map(escape).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8;' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `leads-page-${page}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${rows.length} Leads${selectedOnPage.length ? '' : ' from the current page'}`);
  };

  return <div className="space-y-5 min-w-0 max-w-[1600px] mx-auto pb-16">
    <AdminPageHeader title="Leads" description="Manage your business leads and opportunities." icon={Users}
      actions={<div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
        <AdminButton variant="outline" icon={Download} onClick={exportPage} disabled={!leads.length || list.isLoading}
          title={selectedOnPage.length ? 'Export selected Leads on this page' : 'Export Leads on the current page'}>Export</AdminButton>
        <AdminButton icon={Plus} onClick={() => setOpen(true)}>Add Lead</AdminButton>
      </div>} />
    <AdminCard title="All Leads" description={`Showing ${total ? (page - 1) * limit + 1 : 0} - ${Math.min(page * limit, total)} of ${total} records • Page ${page} of ${totalPages}`}
      bodyClassName="p-0"
      className="[&>div:first-child]:flex-wrap [&>div:first-child]:items-start [&>div:first-child>div:last-child]:min-w-0 [&>div:first-child>div:last-child]:max-w-full [&>div:first-child>div:last-child]:shrink"
      headerActions={<div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 xl:flex xl:flex-wrap xl:items-center xl:justify-end">
        <AdminSearchInput value={search} onChange={(value) => { setSearch(value); setPage(1); }}
          placeholder="Search leads by name, phone, email, company..." className="w-full min-w-0 sm:col-span-2 xl:w-[320px]" />
        <AdminSelect aria-label="Filter Leads by stage" value={status} className="!rounded-xl !py-2.5 !text-xs"
          onChange={(event) => { setStatus(event.target.value); setPage(1); }}
          options={[{ value: 'ALL', label: 'All Stages' }, ...configuredStages.map(stage => ({ value: stage.key, label: stage.name }))]} />
        <label className="flex items-center gap-2 text-xs text-slate-500 whitespace-nowrap">Per page:
          <AdminSelect aria-label="Leads per page" value={limit} className="!rounded-xl !py-2.5 !text-xs"
            onChange={(event) => { setLimit(Number(event.target.value)); setPage(1); }}
            options={[10, 20, 50, 100].map(size => ({ value: String(size), label: String(size) }))} />
        </label>
      </div>}>
      {stageQuery.isError && <div role="alert" className="flex items-center gap-3 px-5 py-2 text-sm text-rose-700">Unable to load pipeline stages.<AdminButton size="sm" variant="ghost" onClick={() => stageQuery.refetch()}>Retry</AdminButton></div>}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-2">
        <span className="text-xs text-slate-500">{selectedOnPage.length ? `${selectedOnPage.length} selected on this page` : 'All sources • Newest first'}</span>
        <div className="flex items-center gap-2">
          {selectedOnPage.length > 0 && (
            <>
              <AdminButton
                variant="outline"
                size="sm"
                icon={Trash2}
                className="!text-rose-600 hover:!bg-rose-50 border-rose-200"
                onClick={() => setConfirmDelete({ open: true, type: 'bulk', ids: selectedOnPage.map(l => l.id), count: selectedOnPage.length })}
                disabled={bulkDeleteMutation.isPending || deleteMutation.isPending}
              >
                Delete Selected ({selectedOnPage.length})
              </AdminButton>
              <AdminButton variant="ghost" size="sm" onClick={() => setSelectedIds([])}>Deselect</AdminButton>
            </>
          )}
          <AdminButton variant="ghost" size="sm" icon={RefreshCw} onClick={() => list.refetch()} disabled={list.isFetching}>Refresh</AdminButton>
        </div>
      </div>
      {list.isError ? <div role="alert" className="p-6 text-rose-700 space-y-3"><p>{getErrorMessage(list.error)}</p><AdminButton variant="outline" onClick={() => list.refetch()}>Retry</AdminButton></div> : <>
        <AdminDataTable<Lead> data={leads} loading={list.isLoading} onRowClick={lead => setSelectedLead({ id: lead.id, action: 'view' })} keyExtractor={(lead) => String(lead.id)}
          emptyTitle="No leads found" emptyDescription="Add a Lead or import a validated Data Capture record."
          minWidth="min-w-[1280px] table-fixed"
          className="!rounded-none !border-0 !shadow-none [&_td]:!px-4 [&_td]:!py-4 [&_th]:!px-4 [&_th]:!py-3.5 [&_th]:!font-semibold [&_th]:!text-[10px] [&_th]:!tracking-wider [&_td]:align-middle"
          rowClassName={(lead) => selectedIds.includes(lead.id) ? 'bg-emerald-50/50 hover:!bg-emerald-50/70' : ''}
          columns={[
            { key: 'selection', headerClassName: 'w-12 text-center', className: 'text-center',
              header: <input type="checkbox" aria-label="Select all Leads on this page" className="h-4 w-4 rounded accent-emerald-600"
                checked={leads.length > 0 && selectedOnPage.length === leads.length}
                ref={(input) => { if (input) input.indeterminate = selectedOnPage.length > 0 && selectedOnPage.length < leads.length; }}
                onChange={togglePage} />,
              render: lead => <input type="checkbox" aria-label={`Select ${lead.companyName}`} className="h-4 w-4 rounded accent-emerald-600"
                checked={selectedIds.includes(lead.id)} onChange={() => toggleSelection(lead.id)} /> },
            { key: 'name', header: 'Lead Name', headerClassName: 'w-[17%]', render: lead => <div className="min-w-0">
              <button type="button" onClick={event => { event.stopPropagation(); setSelectedLead({ id: lead.id, action: 'view' }); }} className="text-left line-clamp-2 break-words font-semibold leading-snug text-slate-900 hover:text-emerald-700">
                {[lead.firstName, lead.lastName].filter(Boolean).join(' ').trim() || lead.companyName || '—'}</button>
              {lead.category && <p className="mt-1 truncate text-[11px] font-normal text-slate-500">{lead.category}</p>}
            </div> },
            { key: 'phone', header: 'Contact', headerClassName: 'w-[17%]', render: lead => <div className="space-y-1 break-words font-normal">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-800"><Phone className="h-3 w-3 shrink-0 text-slate-400" />{lead.phone || '—'}</p><p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-slate-500"><Mail className="mt-0.5 h-3 w-3 shrink-0 text-slate-400" /><span className="break-all">{lead.email || '—'}</span></p></div> },
            { key: 'companyName', header: 'Company', headerClassName: 'w-[17%]', render: lead => <button type="button" onClick={event => { event.stopPropagation(); setSelectedLead({ id: lead.id, action: 'view' }); }} className="text-left line-clamp-3 break-words font-medium leading-snug hover:text-emerald-700">{lead.companyName || '—'}</button> },
            { key: 'status', header: 'Stage', headerClassName: 'w-[13%]', render: lead => {
              const stage = lead.stage || configuredStages.find(item => item.key === lead.status);
              return <span style={{ '--stage-bg': stage?.bgColor || '#f1f5f9', '--stage-text': stage?.color || '#475569', '--stage-border': stage?.borderColor || '#e2e8f0' } as React.CSSProperties}><AdminStatusBadge status={stage?.key || lead.status || 'UNKNOWN'} label={stage?.name || lead.status || '—'}
                className="!normal-case !tracking-normal !font-medium !text-[11px] !bg-[var(--stage-bg)] !text-[var(--stage-text)] !border-[var(--stage-border)]" /></span>;
            } },
            { key: 'source', header: 'Source', headerClassName: 'w-[11%]', render: lead => <span className="font-medium break-words">
              {({ GOOGLE_PLACES: 'Google Places', DATA_CAPTURE: 'Data Capture', MANUAL: 'Manual', WEBSITE: 'Website', IMPORT: 'Import' } as Record<string, string>)[lead.source] || lead.source?.replace(/_/g, ' ') || '—'}
            </span> },
            { key: 'createdAt', header: 'Created On', headerClassName: 'w-[11%]', render: lead => {
              const date = new Date(lead.createdAt);
              return Number.isNaN(date.getTime()) ? '—' : <div className="space-y-1 whitespace-nowrap font-normal">
                <p>{date.toLocaleDateString('en-GB')}</p><p className="text-[11px] text-slate-500">{date.toLocaleTimeString('en-GB')}</p></div>;
            } },
            { key: 'actions', header: 'Actions', headerClassName: 'w-[220px]', render: lead => <div className="flex items-center gap-1.5" onClick={event => event.stopPropagation()}>
              <AdminButton variant="outline" size="sm" onClick={() => setSelectedLead({ id: lead.id, action: 'view' })}>View Details</AdminButton>
              <AdminButton variant="ghost" size="sm" icon={Pencil} aria-label={`Edit Lead ${lead.companyName}`} title="Edit Lead"
                className="!px-2 !text-emerald-700 hover:!bg-emerald-50" onClick={() => setSelectedLead({ id: lead.id, action: 'edit' })} />
              <AdminRowActions label={`More actions for ${lead.companyName}`} items={[
                { label: 'Edit Lead', onSelect: () => setSelectedLead({ id: lead.id, action: 'edit' }) },
                { label: 'Change Stage', onSelect: () => setSelectedLead({ id: lead.id, action: 'stage' }) },
                {
                  label: 'Delete Lead',
                  danger: true,
                  onSelect: () => setConfirmDelete({
                    open: true,
                    type: 'single',
                    id: lead.id,
                    name: [lead.firstName, lead.lastName].filter(Boolean).join(' ').trim() || lead.companyName || `Lead #${lead.id}`,
                  }),
                },
              ]} />
            </div> },
          ]} />
        {!list.isLoading && leads.length === 0 && <div className="flex justify-center pb-6"><AdminButton icon={Plus} size="sm" onClick={() => setOpen(true)}>Add Lead</AdminButton></div>}
      </>}
      <AdminPagination page={page} pageSize={limit} total={total} totalPages={totalPages} onPageChange={setPage}
        onPageSizeChange={(value) => { setLimit(value); setPage(1); }} disabled={list.isFetching} />
    </AdminCard>
    {selectedLead && <LeadDetailsDrawer key={selectedLead.id} id={selectedLead.id} initialAction={selectedLead.action} onClose={() => setSelectedLead(null)} />}
    <AdminFormDrawer isOpen={open} onClose={() => { if (!create.isPending) setOpen(false); }} title="Add Lead" icon={Users}
      onSave={() => {
        if (!form.companyName.trim()) { toast.error('Business name is required'); return; }
        const input = Object.fromEntries(Object.entries(form).map(([key, value]) => [key, value?.trim() || undefined])) as CreateLeadInput;
        create.mutate(input);
      }} saveLabel={create.isPending ? 'Creating...' : 'Create Lead'} isSubmitting={create.isPending}>
      <LeadFormFields value={form} onChange={setForm} disabled={create.isPending} />
    </AdminFormDrawer>
    <AdminConfirmDialog
      isOpen={confirmDelete.open}
      title={confirmDelete.open && confirmDelete.type === 'bulk' ? `Delete ${confirmDelete.count} Leads` : 'Delete Lead'}
      message={confirmDelete.open && confirmDelete.type === 'bulk'
        ? `Are you sure you want to delete ${confirmDelete.count} selected leads? This action cannot be undone.`
        : `Are you sure you want to delete "${confirmDelete.open && confirmDelete.type === 'single' ? confirmDelete.name : ''}"? This action cannot be undone.`}
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
  </div>;
}
