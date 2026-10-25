'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AlertCircle, ArrowLeft, Check, ChevronRight, GitCommit, Pencil, Trash2, Users } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { AdminButton, AdminCard, AdminConfirmDialog, AdminPageHeader, AdminSelect } from '@/components/admin';
import { LeadStage, leadsApi } from '@/lib/leads-api';
import { getErrorMessage } from '@/lib/utils';
import { LeadDetailsDrawer } from '@/components/admin/drawers/LeadDetailsDrawer';

export default function LeadDetailsPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const client = useQueryClient();
  const rawId = params?.id;
  const id = Number(rawId);
  const validId = Number.isInteger(id) && id > 0;
  const detail = useQuery({ queryKey: ['lead', id], queryFn: () => leadsApi.detail(id), enabled: validId });
  const stagesQuery = useQuery({ queryKey: ['lead-stages'], queryFn: leadsApi.stages, staleTime: 60_000 });
  const configuredStages = stagesQuery.data || [];
  const lead = detail.data;

  const currentStage = lead?.stage || configuredStages.find(stage => stage.key === lead?.status) || { id: 0, key: lead?.status || '', name: lead?.status || 'Unknown', sortOrder: 0, color: '#64748b', bgColor: '#f1f5f9', borderColor: '#e2e8f0' };

  const [selectedStageKey, setSelectedStageKey] = useState<string>('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    if (currentStage?.key) {
      setSelectedStageKey(currentStage.key);
    }
  }, [currentStage?.key]);

  const updateStage = useMutation({
    mutationFn: async (targetStage: LeadStage) => {
      return leadsApi.updateStage(id, { status: targetStage.key, stageId: targetStage.id });
    },
    onSuccess: (updated) => {
      client.setQueryData(['lead', id], updated);
      client.invalidateQueries({ queryKey: ['leads'] });
      toast.success(`Pipeline stage updated to "${updated.stage?.name || updated.status}"`);
    },
    onError: (error) => {
      setSelectedStageKey(currentStage.key || '');
      toast.error(getErrorMessage(error));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => leadsApi.delete(id),
    onSuccess: (res) => {
      toast.success(res?.message || 'Lead deleted successfully');
      client.invalidateQueries({ queryKey: ['leads'] });
      router.push('/leads');
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  if (!validId) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto pb-16">
        <AdminPageHeader
          title="Invalid Lead ID"
          description="The requested lead ID is not valid. Lead IDs must be positive integers."
          icon={AlertCircle}
          breadcrumbs={[{ label: 'Leads', href: '/leads' }, { label: 'Invalid Lead' }]}
        />
        <AdminCard title="Lead Not Found">
          <div className="space-y-4 py-2">
            <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-800 text-sm">
              <p className="font-semibold">
                Invalid Lead ID: <span className="font-mono">{String(rawId || '')}</span>
              </p>
              <p className="mt-1 text-xs text-rose-600">
                A valid lead identifier must be a positive integer. Please navigate from the Leads list.
              </p>
            </div>
            <div>
              <AdminButton
                variant="primary"
                icon={ArrowLeft}
                onClick={() => router.push('/leads')}
              >
                Back to Leads
              </AdminButton>
            </div>
          </div>
        </AdminCard>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      <AdminPageHeader
        title={lead?.companyName || 'Lead Details'}
        description="Lead contact information, capture origin, and CRM pipeline progress."
        icon={Users}
        breadcrumbs={[{ label: 'Leads', href: '/leads' }, { label: lead ? String(lead.id) : 'Details' }]}
        actions={
          lead && (
            <div className="flex items-center gap-2">
            <AdminButton
              icon={Pencil}
              disabled={deleteMutation.isPending || updateStage.isPending}
              onClick={() => setEditOpen(true)}
            >
              Edit Lead
            </AdminButton>
            <AdminButton
              variant="outline"
              icon={Trash2}
              className="!text-rose-600 hover:!bg-rose-50 border-rose-200"
              disabled={deleteMutation.isPending || updateStage.isPending}
              onClick={() => setConfirmDelete(true)}
            >
              Delete Lead
            </AdminButton>
            </div>
          )
        }
      />
      {detail.isError ? (
        <AdminCard title="Unable to Load Lead">
          <div role="alert" className="space-y-3 text-rose-700">
            <p>{getErrorMessage(detail.error)}</p>
            <div className="flex gap-2">
              <AdminButton variant="outline" onClick={() => detail.refetch()}>Retry</AdminButton>
              <AdminButton variant="ghost" onClick={() => router.push('/leads')}>Back to Leads</AdminButton>
            </div>
          </div>
        </AdminCard>
      ) : detail.isLoading ? (
        <p role="status">Loading Lead...</p>
      ) : lead && (
        <>
          {/* CRM Pipeline Stage Card */}
          <AdminCard title="CRM Pipeline Stage" description="Move this lead to any configured CRM stage.">
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                <span
                  className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white shrink-0"
                  style={{ backgroundColor: currentStage.color }}
                >
                  {currentStage.sortOrder}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900 text-base">{currentStage.name}</h4>
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-bold text-white uppercase tracking-wider"
                      style={{ backgroundColor: currentStage.color }}
                    >
                      Current
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">KEY: {currentStage.key}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-600 uppercase mb-2">Change Stage</p>
                {stagesQuery.isLoading && <p role="status" className="text-xs text-slate-500">Loading pipeline stages…</p>}
                {stagesQuery.isError && (
                  <div role="alert" className="space-y-2 py-2">
                    <p className="text-xs text-rose-700">Unable to load pipeline stages.</p>
                    <AdminButton size="sm" variant="outline" onClick={() => stagesQuery.refetch()}>Retry</AdminButton>
                  </div>
                )}
                {!stagesQuery.isLoading && !stagesQuery.isError && (
                  <div className="space-y-3.5">
                    <div className="space-y-1.5">
                      <label htmlFor="lead-details-stage-select" className="block text-xs font-medium text-slate-700">
                        Select Pipeline Stage
                      </label>
                      <AdminSelect
                        id="lead-details-stage-select"
                        value={selectedStageKey || currentStage.key || ''}
                        disabled={updateStage.isPending}
                        onChange={(e) => {
                          const newKey = e.target.value;
                          setSelectedStageKey(newKey);
                          const target = configuredStages.find(s => s.key === newKey);
                          if (target && target.key !== currentStage.key) {
                            updateStage.mutate(target);
                          }
                        }}
                        className="w-full max-w-md"
                      >
                        {configuredStages
                          .filter(stage => stage.isActive)
                          .map(stage => (
                            <option key={stage.key} value={stage.key}>
                              {stage.sortOrder}. {stage.name} {stage.key === currentStage.key ? '(Current)' : ''}
                            </option>
                          ))}
                      </AdminSelect>
                    </div>

                    {updateStage.isPending && (
                      <div className="flex items-center gap-2 pt-1 text-xs text-slate-500" role="status">
                        <div className="w-3.5 h-3.5 border-2 border-slate-300 border-t-[#23C45E] rounded-full animate-spin" />
                        <span>Updating pipeline stage…</span>
                      </div>
                    )}
                  </div>
                )}
                {updateStage.isError && (
                  <p role="alert" className="mt-3 text-xs text-rose-700">
                    {getErrorMessage(updateStage.error)}
                  </p>
                )}
              </div>
            </div>
          </AdminCard>

          {/* Lead Details Card */}
          <AdminCard title="Lead Information">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="min-w-0">
                <dt className="text-xs font-bold text-slate-500 uppercase">Pipeline Stage</dt>
                <dd className="mt-1">
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border"
                    style={{
                      color: currentStage.color,
                      backgroundColor: currentStage.bgColor,
                      borderColor: currentStage.borderColor,
                    }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: currentStage.color }} />
                    {currentStage.name} ({currentStage.key})
                  </span>
                </dd>
              </div>
              {Object.entries({
                'Lead ID': lead.id,
                Source: lead.source,
                'Created from': lead.createdFrom,
                Name: [lead.firstName, lead.lastName].filter(Boolean).join(' ') || '—',
                Phone: lead.phone,
                Email: lead.email,
                Website: lead.website,
                Address: lead.address,
                City: lead.city,
                State: lead.state,
                Country: lead.country,
                Pincode: lead.pincode,
                Category: lead.category,
                'Google Place ID': lead.googlePlaceId,
                Latitude: lead.latitude,
                Longitude: lead.longitude,
                Created: new Date(lead.createdAt).toLocaleString(),
                Notes: lead.notes,
              }).map(([label, value]) => (
                <div key={label} className="min-w-0">
                  <dt className="text-xs font-bold text-slate-500 uppercase">{label}</dt>
                  <dd className="mt-1 text-sm text-slate-900 break-words whitespace-pre-wrap">{value ?? '—'}</dd>
                </div>
              ))}
            </dl>
          </AdminCard>
        </>
      )}

      {editOpen && (
        <LeadDetailsDrawer id={id} initialAction="edit" onClose={() => setEditOpen(false)} />
      )}

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
    </div>
  );
}
