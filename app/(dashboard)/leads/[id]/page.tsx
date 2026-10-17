'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { AdminButton, AdminCard, AdminPageHeader } from '@/components/admin';
import { leadsApi } from '@/lib/leads-api';
import { getErrorMessage } from '@/lib/utils';

export default function LeadDetailsPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const validId = Number.isInteger(id) && id > 0;
  const detail = useQuery({ queryKey: ['lead', id], queryFn: () => leadsApi.detail(id), enabled: validId });
  const lead = detail.data;
  return <div className="space-y-6 max-w-5xl mx-auto pb-16">
    <AdminPageHeader title={lead?.companyName || 'Lead Details'} description="Lead contact information and capture origin." icon={Users}
      breadcrumbs={[{ label: 'Leads', href: '/leads' }, { label: lead ? String(lead.id) : 'Details' }]} />
    {!validId ? <p role="alert" className="text-rose-700">Invalid Lead ID.</p> : detail.isError ?
      <div role="alert" className="space-y-3 text-rose-700"><p>{getErrorMessage(detail.error)}</p><AdminButton variant="outline" onClick={() => detail.refetch()}>Retry</AdminButton></div> :
      detail.isLoading ? <p role="status">Loading Lead...</p> : lead && <AdminCard title="Lead Information">
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {Object.entries({ 'Lead ID': lead.id, Status: lead.status, Source: lead.source, 'Created from': lead.createdFrom,
            Name: [lead.firstName, lead.lastName].filter(Boolean).join(' '), Phone: lead.phone, Email: lead.email, Website: lead.website,
            Address: lead.address, City: lead.city, State: lead.state, Country: lead.country, Pincode: lead.pincode,
            Category: lead.category, 'Google Place ID': lead.googlePlaceId, Latitude: lead.latitude, Longitude: lead.longitude,
            Created: new Date(lead.createdAt).toLocaleString(), Notes: lead.notes,
          }).map(([label, value]) => <div key={label} className="min-w-0"><dt className="text-xs font-bold text-slate-500 uppercase">{label}</dt><dd className="mt-1 text-sm text-slate-900 break-words whitespace-pre-wrap">{value ?? '—'}</dd></div>)}
        </dl>
      </AdminCard>}
  </div>;
}
