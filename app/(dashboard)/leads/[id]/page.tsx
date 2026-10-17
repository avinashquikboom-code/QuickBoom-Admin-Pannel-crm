'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { Check, ChevronRight, GitCommit, Users } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { AdminButton, AdminCard, AdminPageHeader } from '@/components/admin';
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
                {stagesQuery.isLoading && <p role="status">Loading pipeline stages…</p>}
                {stagesQuery.isError && <div role="alert">Unable to load pipeline stages. <AdminButton size="sm" onClick={() => stagesQuery.refetch()}>Retry</AdminButton></div>}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {configuredStages.filter(stage => stage.isActive).map((stage) => {
                    const isCurrent = (lead.stageId === stage.id) || (lead.status === stage.key);
                    return (
                      <button
                        key={stage.id}
                        type="button"
                        disabled={updateStage.isPending}
                        onClick={() => {
                          if (!isCurrent) updateStage.mutate(stage);
                        }}
                        className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                          isCurrent
                            ? 'ring-2 font-bold'
                            : 'hover:border-slate-300 bg-white hover:bg-slate-50/50'
                        }`}
                        style={{
                          backgroundColor: isCurrent ? stage.bgColor : undefined,
                          borderColor: isCurrent ? stage.borderColor : '#E2E8F0',
                          color: isCurrent ? stage.color : '#1E293B',
                          boxShadow: isCurrent ? `0 0 0 2px ${stage.color}25` : undefined,
                        }}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                            style={{ backgroundColor: stage.color }}
                          >
                            {stage.sortOrder}
                          </span>
                          <div className="min-w-0 truncate">
                            <span className="text-sm truncate block">{stage.name}</span>
                            <span className="text-[10px] text-slate-400 block font-mono truncate">{stage.key}</span>
                          </div>
                        </div>
                        {isCurrent ? (
                          <span
                            className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white shrink-0"
                            style={{ backgroundColor: stage.color }}
                          >
                            Current
                          </span>
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
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
