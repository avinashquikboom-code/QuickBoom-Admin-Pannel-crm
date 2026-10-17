'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Pencil, Users } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { AdminButton, AdminCard, AdminFormDrawer } from '@/components/admin';
import { CreateLeadInput, Lead, LeadStage, UpdateLeadInput, leadsApi } from '@/lib/leads-api';
import { getErrorMessage } from '@/lib/utils';
import { emptyLeadForm, LeadFormFields } from './LeadFormFields';

export function LeadDetailsDrawer({ id, onClose, initialAction = 'view' }: {
  id: number; onClose: () => void; initialAction?: 'view' | 'edit' | 'stage';
}) {
  const client = useQueryClient();
  const root = useRef<HTMLDivElement>(null);
  const formElement = useRef<HTMLFormElement>(null);
  const stageSection = useRef<HTMLDivElement>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<CreateLeadInput>(emptyLeadForm);
  const detail = useQuery({ queryKey: ['lead', id], queryFn: () => leadsApi.detail(id), staleTime: 30_000, retry: false });
  const stagesQuery = useQuery({ queryKey: ['lead-stages'], queryFn: leadsApi.stages, staleTime: 60_000 });
  const configuredStages = stagesQuery.data || [];
  const lead = detail.data;
  const stage = lead?.stage || configuredStages.find(item => item.key === lead?.status);
  const beginEdit = (record: Lead) => {
    setForm(Object.fromEntries(Object.keys(emptyLeadForm).map(key => [key, record[key as keyof Lead] ?? ''])) as unknown as CreateLeadInput);
    setEditing(true);
  };
  const initialized = useRef(false);
  useEffect(() => {
    if (!lead || initialized.current) return;
    initialized.current = true;
    if (initialAction === 'edit') beginEdit(lead);
    if (initialAction === 'stage') stageSection.current?.scrollIntoView({ block: 'start' });
  }, [lead, initialAction]);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    root.current?.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true });
    const trap = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const nodes = Array.from(root.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"]') || []).filter(node => node.getClientRects().length);
      const first = nodes[0], last = nodes[nodes.length - 1];
      if (event.shiftKey && (document.activeElement === first || !root.current?.contains(document.activeElement))) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || !root.current?.contains(document.activeElement))) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', trap);
    return () => { document.removeEventListener('keydown', trap); previous?.focus({ preventScroll: true }); };
  }, []);
  const saved = async (updated: Lead) => {
    client.setQueryData(['lead', id], updated);
    await Promise.all([
      client.invalidateQueries({ queryKey: ['leads'] }),
      client.invalidateQueries({ queryKey: ['lead', id], exact: true }),
    ]);
  };
  const edit = useMutation({
    mutationFn: (data: UpdateLeadInput) => leadsApi.update(id, data),
    onSuccess: async updated => { setEditing(false); await saved(updated); toast.success('Lead updated successfully'); },
    onError: error => toast.error(getErrorMessage(error)),
  });
  const changeStage = useMutation({
    mutationFn: (target: LeadStage) => leadsApi.updateStage(id, { status: target.key, stageId: target.id }),
    onSuccess: async updated => { await saved(updated); toast.success(`Pipeline stage updated to ${updated.stage?.name || updated.status}`); },
    onError: error => toast.error(getErrorMessage(error)),
  });
  const busy = edit.isPending || changeStage.isPending;
  const fields = (values: Record<string, unknown>) => <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
    {Object.entries(values).map(([label, value]) => <div key={label} className="min-w-0">
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm text-slate-900 break-words whitespace-pre-wrap">{String(value ?? '').trim() || '—'}</dd>
    </div>)}
  </dl>;
  return <div ref={root} role="dialog" aria-modal="true" aria-label={lead?.companyName ? `Lead Details: ${lead.companyName}` : 'Lead Details'}>
    <AdminFormDrawer isOpen onClose={onClose} title={lead?.companyName || 'Lead Details'} icon={Users}
      description={lead ? `${stage?.name || lead.status || '—'} • ${lead.source?.replace(/_/g, ' ') || '—'}` : 'Lead information and pipeline'}
      maxWidth="sm:max-w-[680px]" isSubmitting={busy}
      hideFooter={!editing} onSave={() => formElement.current?.requestSubmit()} saveLabel="Save Lead">
      {detail.isLoading ? <p role="status" className="py-12 text-center text-sm text-slate-500">Loading Lead details…</p>
        : detail.isError ? <div role="alert" className="space-y-3 py-6"><p className="text-sm text-rose-700">{getErrorMessage(detail.error)}</p><AdminButton variant="outline" onClick={() => detail.refetch()}>Retry</AdminButton></div>
        : !lead ? <p role="status">Lead details are unavailable.</p>
        : editing ? <form ref={formElement} onSubmit={event => {
          event.preventDefault();
          if (busy) return;
          if (!form.companyName.trim()) { toast.error('Business name is required'); return; }
          // Keep empty strings in PATCH so clearing an existing field is persisted.
          const data = Object.fromEntries(Object.entries(form).map(([key, value]) => [key, value?.trim() || ''])) as unknown as UpdateLeadInput;
          if (!data.email) data.email = null;
          edit.mutate(data);
        }} className="space-y-4">
          <div className="flex items-center justify-between"><h3 className="font-semibold">Edit Lead</h3><AdminButton type="button" variant="ghost" size="sm" disabled={busy} onClick={() => setEditing(false)}>Cancel editing</AdminButton></div>
          <LeadFormFields value={form} onChange={setForm} disabled={busy} />
          {edit.isError && <p role="alert" className="text-sm text-rose-700">{getErrorMessage(edit.error)}</p>}
        </form> : <>
          <div className="flex flex-wrap gap-2">
            <AdminButton size="sm" icon={Pencil} disabled={busy} onClick={() => beginEdit(lead)}>Edit Lead</AdminButton>
            <AdminButton size="sm" variant="outline" disabled={busy} onClick={() => stageSection.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>Change Pipeline Stage</AdminButton>
          </div>
          <AdminCard title="Contact Details">{fields({ Name: [lead.firstName, lead.lastName].filter(Boolean).join(' '), Phone: lead.phone, Email: lead.email })}</AdminCard>
          <AdminCard title="Company Details">{fields({ Company: lead.companyName, Category: lead.category, Website: lead.website, Address: lead.address, City: lead.city, State: lead.state, Country: lead.country, Pincode: lead.pincode })}</AdminCard>
          <div ref={stageSection} className="scroll-mt-4">
            <AdminCard title="CRM Pipeline Stage" description="Choose a stage to update this Lead.">
              {stagesQuery.isLoading && <p role="status">Loading pipeline stages…</p>}
              {stagesQuery.isError && <div role="alert"><p>Unable to load pipeline stages.</p><AdminButton size="sm" onClick={() => stagesQuery.refetch()}>Retry</AdminButton></div>}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {configuredStages.filter(target => target.isActive).map(target => {
                  const current = stage?.key === target.key;
                  return <button key={target.key} type="button" disabled={busy || current} aria-pressed={current}
                    onClick={() => changeStage.mutate(target)}
                    className="flex items-center justify-between gap-2 rounded-xl border p-3 text-left text-xs font-medium disabled:cursor-default hover:shadow-sm focus-visible:ring-2 focus-visible:ring-emerald-500"
                    style={{ color: target.color, backgroundColor: current ? target.bgColor : 'white', borderColor: current ? target.borderColor : '#e2e8f0' }}>
                    {target.name}{current && <Check className="h-4 w-4" />}
                  </button>;
                })}
              </div>
              {changeStage.isPending && <p role="status" className="mt-3 text-xs text-slate-500">Updating pipeline stage…</p>}
              {changeStage.isError && <p role="alert" className="mt-3 text-sm text-rose-700">{getErrorMessage(changeStage.error)}</p>}
            </AdminCard>
          </div>
          <AdminCard title="Lead Information">{fields({ 'Lead ID': lead.id, Status: stage?.name || lead.status, Source: lead.source, 'Created from': lead.createdFrom, 'Created on': lead.createdAt ? new Date(lead.createdAt).toLocaleString() : null, 'Google Place ID': lead.googlePlaceId, Latitude: lead.latitude, Longitude: lead.longitude, Notes: lead.notes })}</AdminCard>
        </>}
    </AdminFormDrawer>
  </div>;
}
