'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Pencil, Trash2, Users } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { AdminButton, AdminCard, AdminConfirmDialog, AdminFormDrawer, AdminSelect } from '@/components/admin';
import { CreateLeadInput, Lead, LeadStage, UpdateLeadInput, leadsApi } from '@/lib/leads-api';
import { getErrorMessage } from '@/lib/utils';
import { emptyLeadForm, LeadFormFields } from './LeadFormFields';

export function LeadDetailsDrawer({ id, onClose, initialAction = 'view' }: {
  id: number; onClose: () => void; initialAction?: 'view' | 'edit' | 'stage';
}) {
  const client = useQueryClient();
  const root = useRef<HTMLDivElement>(null);
  const formElement = useRef<HTMLFormElement>(null);
  const submitLock = useRef(false);
  const stageSection = useRef<HTMLDivElement>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<CreateLeadInput>(emptyLeadForm);
  const [selectedStageKey, setSelectedStageKey] = useState<string>('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const detail = useQuery({ queryKey: ['lead', id], queryFn: async () => {
    if (!Number.isSafeInteger(id) || id < 1) throw new Error('A valid Lead ID is required');
    const result = await leadsApi.detail(id);
    if (result?.id !== id) throw new Error('The returned Lead does not match the selected record');
    return result;
  }, staleTime: 30_000, retry: false });
  const stagesQuery = useQuery({ queryKey: ['lead-stages'], queryFn: leadsApi.stages, staleTime: 60_000 });
  const configuredStages = stagesQuery.data || [];
  const lead = detail.data;
  const stage = lead?.stage || configuredStages.find(item => item.key === lead?.status);

  useEffect(() => {
    if (stage?.key) {
      setSelectedStageKey(stage.key);
    }
  }, [stage?.key]);
  const beginEdit = (record: Lead) => {
    setForm(Object.fromEntries(Object.keys(emptyLeadForm).map(key => [key, record[key as keyof Lead] ?? ''])) as unknown as CreateLeadInput);
    setEditing(true);
  };
  const initialized = useRef<string | null>(null);
  useEffect(() => {
    const actionKey = `${id}:${initialAction}`;
    if (!lead || lead.id !== id || initialized.current === actionKey) return;
    initialized.current = actionKey;
    if (initialAction === 'edit') beginEdit(lead);
    if (initialAction === 'stage') stageSection.current?.scrollIntoView({ block: 'start' });
  }, [lead, id, initialAction]);
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
      client.refetchQueries({ queryKey: ['leads'] }),
      client.invalidateQueries({ queryKey: ['lead', id], exact: true }),
    ]);
  };
  const edit = useMutation({
    mutationFn: async (data: UpdateLeadInput) => {
      const result = await leadsApi.update(id, data);
      if (result?.id !== id) throw new Error('The update response does not match the selected Lead');
      return result;
    },
    onSettled: () => { submitLock.current = false; },
    onSuccess: async (updated) => {
      await saved(updated);
      toast.success('Lead updated successfully');
      setEditing(false);
    },
    onError: error => toast.error(getErrorMessage(error)),
  });

  const handleSave = (event?: React.FormEvent) => {
    if (event) event.preventDefault();
    if (busy || submitLock.current || !lead) return;
    if (!formElement.current?.reportValidity()) return;
    const trimmedCompanyName = form.companyName?.trim();
    if (!trimmedCompanyName) {
      toast.error('Business name is required');
      return;
    }
    const trimmedEmail = form.email?.trim() || '';
    if (trimmedEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        toast.error('Please enter a valid email address');
        return;
      }
    }
    // PATCH only changed, supported form fields. Preserve explicit clears while
    // leaving unchanged server values out of the update request.
    const data = Object.fromEntries(
      (Object.keys(emptyLeadForm) as Array<keyof CreateLeadInput>)
        .map(key => [key, form[key]?.trim() || ''] as const)
        .filter(([key, value]) => value !== (lead[key]?.trim() || ''))
        .map(([key, value]) => [key, key === 'email' ? value || null : value])
    ) as unknown as UpdateLeadInput;
    if (!Object.keys(data).length) {
      toast('No changes to save');
      return;
    }
    submitLock.current = true;
    edit.mutate(data);
  };
  const changeStage = useMutation({
    mutationFn: (target: LeadStage) => leadsApi.updateStage(id, { status: target.key, stageId: target.id }),
    onSuccess: async updated => { await saved(updated); toast.success(`Pipeline stage updated to ${updated.stage?.name || updated.status}`); },
    onError: error => {
      setSelectedStageKey(stage?.key || '');
      toast.error(getErrorMessage(error));
    },
  });
  const deleteMutation = useMutation({
    mutationFn: () => leadsApi.delete(id),
    onSuccess: (res) => {
      toast.success(res?.message || 'Lead deleted successfully');
      setConfirmDelete(false);
      onClose();
      client.invalidateQueries({ queryKey: ['leads'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
  const busy = edit.isPending || changeStage.isPending || deleteMutation.isPending;
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
        : editing ? <form ref={formElement} onSubmit={handleSave} className="space-y-4">
          <div className="flex items-center justify-between"><h3 className="font-semibold">Edit Lead</h3><AdminButton type="button" variant="ghost" size="sm" disabled={busy} onClick={() => setEditing(false)}>Cancel editing</AdminButton></div>
          <LeadFormFields value={form} onChange={setForm} disabled={busy} />
          {edit.isError && <p role="alert" className="text-sm text-rose-700">{getErrorMessage(edit.error)}</p>}
        </form> : <>
          <div className="flex flex-wrap items-center gap-2">
            <AdminButton size="sm" icon={Pencil} disabled={busy} onClick={() => beginEdit(lead)}>Edit Lead</AdminButton>
            <AdminButton size="sm" variant="outline" disabled={busy} onClick={() => stageSection.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>Change Pipeline Stage</AdminButton>
            <AdminButton size="sm" variant="outline" icon={Trash2} className="!text-rose-600 hover:!bg-rose-50 border-rose-200 ml-auto" disabled={busy} onClick={() => setConfirmDelete(true)}>Delete Lead</AdminButton>
          </div>
          <AdminCard title="Contact Details">{fields({ Name: [lead.firstName, lead.lastName].filter(Boolean).join(' '), Phone: lead.phone, Email: lead.email })}</AdminCard>
          <AdminCard title="Company Details">{fields({ Company: lead.companyName, Category: lead.category, Website: lead.website, Address: lead.address, City: lead.city, State: lead.state, Country: lead.country, Pincode: lead.pincode })}</AdminCard>
          <div ref={stageSection} className="scroll-mt-4">
            <AdminCard title="CRM Pipeline Stage" description="Choose a stage to update this Lead.">
              {stagesQuery.isLoading && <p role="status" className="text-xs text-slate-500">Loading pipeline stages…</p>}
              {stagesQuery.isError && (
                <div role="alert" className="space-y-2 py-2">
                  <p className="text-xs text-rose-700">Unable to load pipeline stages.</p>
                  <AdminButton size="sm" variant="outline" onClick={() => stagesQuery.refetch()}>Retry</AdminButton>
                </div>
              )}
              {!stagesQuery.isLoading && !stagesQuery.isError && (
                <div className="space-y-3.5">
                  {/* Current Stage Indicator */}
                  <div
                    className="flex items-center justify-between gap-3 p-3 rounded-xl border transition-all"
                    style={{
                      backgroundColor: stage?.bgColor || '#f8fafc',
                      borderColor: stage?.borderColor || '#e2e8f0',
                      color: stage?.color || '#1e293b',
                    }}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                        style={{ backgroundColor: stage?.color || '#0284C7' }}
                      />
                      <span className="text-xs font-semibold truncate">
                        Current: {stage?.name || lead.status || '—'}
                      </span>
                    </div>
                    <span
                      className="px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white shrink-0 uppercase tracking-wider"
                      style={{ backgroundColor: stage?.color || '#0284C7' }}
                    >
                      Stage {stage?.sortOrder ?? 1} of {configuredStages.length}
                    </span>
                  </div>

                  {/* Dropdown Field */}
                  <div className="space-y-1.5">
                    <label htmlFor="crm-pipeline-stage-select" className="block text-xs font-medium text-slate-700">
                      Pipeline Stage
                    </label>
                    <AdminSelect
                      id="crm-pipeline-stage-select"
                      value={selectedStageKey || stage?.key || ''}
                      disabled={busy}
                      onChange={(e) => {
                        const newKey = e.target.value;
                        setSelectedStageKey(newKey);
                        const target = configuredStages.find(item => item.key === newKey);
                        if (target && target.key !== stage?.key) {
                          changeStage.mutate(target);
                        }
                      }}
                      className="w-full"
                    >
                      {configuredStages
                        .filter(target => target.isActive)
                        .map(target => (
                          <option key={target.key} value={target.key}>
                            {target.sortOrder}. {target.name} {target.key === stage?.key ? '(Current)' : ''}
                          </option>
                        ))}
                    </AdminSelect>
                  </div>

                  {changeStage.isPending && (
                    <div className="flex items-center gap-2 pt-1 text-xs text-slate-500" role="status">
                      <div className="w-3.5 h-3.5 border-2 border-slate-300 border-t-[#23C45E] rounded-full animate-spin" />
                      <span>Updating pipeline stage…</span>
                    </div>
                  )}
                </div>
              )}
              {changeStage.isError && (
                <p role="alert" className="mt-3 text-xs text-rose-700">
                  {getErrorMessage(changeStage.error)}
                </p>
              )}
            </AdminCard>
          </div>
          <AdminCard title="Lead Information">{fields({ 'Lead ID': lead.id, Status: stage?.name || lead.status, Source: lead.source, 'Created from': lead.createdFrom, 'Created on': lead.createdAt ? new Date(lead.createdAt).toLocaleString() : null, 'Google Place ID': lead.googlePlaceId, Latitude: lead.latitude, Longitude: lead.longitude, Notes: lead.notes })}</AdminCard>
        </>}
    </AdminFormDrawer>
    <AdminConfirmDialog
      isOpen={confirmDelete}
      title="Delete Lead"
      message={`Are you sure you want to delete "${lead?.companyName || `Lead #${id}`}"? This action cannot be undone.`}
      confirmLabel={deleteMutation.isPending ? 'Deleting...' : 'Delete Lead'}
      variant="danger"
      loading={deleteMutation.isPending}
      onConfirm={() => deleteMutation.mutate()}
      onClose={() => setConfirmDelete(false)}
    />
  </div>;
}
