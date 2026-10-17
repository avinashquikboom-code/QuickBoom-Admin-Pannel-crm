'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Plus, RefreshCw, Search, Users } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { AdminButton, AdminCard, AdminDataTable, AdminFormDrawer, AdminPageHeader, AdminPagination } from '@/components/admin';
import { CreateLeadInput, Lead, LEAD_STATUSES, leadsApi } from '@/lib/leads-api';
import { getErrorMessage } from '@/lib/utils';

const emptyForm: CreateLeadInput = { companyName: '', firstName: '', lastName: '', phone: '', email: '', website: '', address: '', city: '', state: '', country: '', pincode: '', category: '', notes: '' };

export default function LeadsPage() {
  const client = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CreateLeadInput>(emptyForm);
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

  return <div className="space-y-6 max-w-[1600px] mx-auto pb-16">
    <AdminPageHeader title="Leads" description="Manage manually added and imported business prospects." icon={Users}
      breadcrumbs={[{ label: 'CRM' }, { label: 'Leads' }]}
      actions={<><AdminButton variant="outline" icon={RefreshCw} onClick={() => list.refetch()} disabled={list.isFetching}>Refresh</AdminButton>
        <AdminButton icon={Plus} onClick={() => setOpen(true)}>Add Lead</AdminButton></>} />
    <AdminCard title="All Leads" description="Newest first. Manual and Data Capture sources are included.">
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 flex-1">
          <Search className="w-4 h-4 text-slate-500" />
          <input aria-label="Search Leads" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search company, name, phone or email" className="w-full outline-none text-sm" />
        </label>
        <select aria-label="Lead status" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className="border border-slate-200 rounded-xl px-3 py-2 text-sm">
          <option value="ALL">All statuses</option>{LEAD_STATUSES.map((value) => <option key={value} value={value}>{value.replace(/_/g, ' ')}</option>)}
        </select>
      </div>
      {list.isError ? <div role="alert" className="p-6 text-rose-700 space-y-3"><p>{getErrorMessage(list.error)}</p><AdminButton variant="outline" onClick={() => list.refetch()}>Retry</AdminButton></div> :
        <AdminDataTable<Lead> data={list.data?.data || []} loading={list.isLoading} keyExtractor={(lead) => String(lead.id)} emptyTitle="No Leads found" emptyDescription="Add a Lead or import a validated Data Capture record. Check active search and status filters."
          columns={[
            { key: 'companyName', header: 'Business', render: (lead) => <Link className="font-bold text-brand-900 hover:underline" href={`/leads/${lead.id}`}>{lead.companyName}</Link> },
            { key: 'phone', header: 'Contact', render: (lead) => <div>{lead.phone || '—'}<p className="text-slate-500">{lead.email || '—'}</p></div> },
            { key: 'status', header: 'Status' }, { key: 'source', header: 'Source' },
            { key: 'createdFrom', header: 'Created from' },
            { key: 'createdAt', header: 'Created', render: (lead) => new Date(lead.createdAt).toLocaleString() },
            { key: 'actions', header: 'Actions', render: (lead) => <Link href={`/leads/${lead.id}`} className="text-brand-900 font-bold hover:underline">View Lead</Link> },
          ]} />}
      <AdminPagination page={page} pageSize={limit} total={list.data?.total || 0} totalPages={list.data?.totalPages || 1} onPageChange={setPage}
        onPageSizeChange={(value) => { setLimit(value); setPage(1); }} disabled={list.isFetching} />
    </AdminCard>
    <AdminFormDrawer isOpen={open} onClose={() => { if (!create.isPending) setOpen(false); }} title="Add Lead" icon={Users}
      onSave={() => {
        if (!form.companyName.trim()) { toast.error('Business name is required'); return; }
        const input = Object.fromEntries(Object.entries(form).map(([key, value]) => [key, value?.trim() || undefined])) as CreateLeadInput;
        create.mutate(input);
      }} saveLabel={create.isPending ? 'Creating...' : 'Create Lead'} isSubmitting={create.isPending}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {(Object.keys(emptyForm) as Array<keyof CreateLeadInput>).map((key) => <label key={key} className={`text-sm font-semibold text-slate-700 ${key === 'notes' || key === 'address' ? 'sm:col-span-2' : ''}`}>
          {key.replace(/([A-Z])/g, ' $1').replace(/^./, (letter) => letter.toUpperCase())}{key === 'companyName' ? ' *' : ''}
          <input value={form[key] || ''} required={key === 'companyName'} type={key === 'email' ? 'email' : key === 'phone' ? 'tel' : 'text'}
            onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))} className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 font-normal" />
        </label>)}
      </div>
    </AdminFormDrawer>
  </div>;
}
