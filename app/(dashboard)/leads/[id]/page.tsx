'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Check, ChevronRight, GitCommit, Users } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { AdminButton, AdminCard, AdminPageHeader, AdminSelect } from '@/components/admin';
import { LeadStage, leadsApi } from '@/lib/leads-api';
import { getErrorMessage } from '@/lib/utils';

export default function LeadDetailsPage() {
  const params = useParams<{ id: string }>();
  const client = useQueryClient();
  const id = Number(params.id);
  const validId = Number.isInteger(id) && id > 0;
  const detail = useQuery({ queryKey: ['lead', id], queryFn: () => leadsApi.detail(id), enabled: validId });
  const stagesQuery = useQuery({ queryKey: ['lead-stages'], queryFn: leadsApi.stages, staleTime: 60_000 });
  const configuredStages = stagesQuery.data || [];
  const lead = detail.data;

  const currentStage = lead?.stage || configuredStages.find(stage => stage.key === lead?.status) || { id: 0, key: lead?.status || '', name: lead?.status || 'Unknown', sortOrder: 0, color: '#64748b', bgColor: '#f1f5f9', borderColor: '#e2e8f0' };

  const [selectedStageKey, setSelectedStageKey] = useState<string>('');

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
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      <AdminPageHeader
        title={lead?.companyName || 'Lead Details'}
        description="Lead contact information, capture origin, and CRM pipeline progress."
        icon={Users}
        breadcrumbs={[{ label: 'Leads', href: '/leads' }, { label: lead ? String(lead.id) : 'Details' }]}
      />
      {!validId ? (
        <p role="alert" className="text-rose-700">Invalid Lead ID.</p>
      ) : detail.isError ? (
        <div role="alert" className="space-y-3 text-rose-700">
          <p>{getErrorMessage(detail.error)}</p>
          <AdminButton variant="outline" onClick={() => detail.refetch()}>Retry</AdminButton>
        </div>
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
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (updateStage.isPending || !selectedStageKey || selectedStageKey === currentStage.key) return;
                      const target = configuredStages.find(s => s.key === selectedStageKey);
                      if (target) updateStage.mutate(target);
                    }}
                    className="space-y-3.5"
                  >
                    <div className="space-y-1.5">
                      <label htmlFor="lead-details-stage-select" className="block text-xs font-medium text-slate-700">
                        Select Pipeline Stage
                      </label>
                      <AdminSelect
                        id="lead-details-stage-select"
                        value={selectedStageKey || currentStage.key || ''}
                        disabled={updateStage.isPending}
                        onChange={(e) => setSelectedStageKey(e.target.value)}
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

                    <div className="flex items-center gap-2">
                      <AdminButton
                        type="submit"
                        size="sm"
                        disabled={updateStage.isPending || !selectedStageKey || selectedStageKey === currentStage.key}
                        className="!text-xs font-semibold"
                      >
                        {updateStage.isPending ? 'Updating Stage…' : 'Update Stage'}
                      </AdminButton>
                      {selectedStageKey && selectedStageKey !== currentStage.key && (
                        <AdminButton
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={updateStage.isPending}
                          onClick={() => setSelectedStageKey(currentStage.key || '')}
                          className="!text-xs"
                        >
                          Reset
                        </AdminButton>
                      )}
                    </div>
                  </form>
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
    </div>
  );
}
