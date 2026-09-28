'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Building,
  User,
  CheckCircle2,
  XCircle,
  Phone,
  Mail,
  Navigation,
  Trash2,
  Edit,
  ExternalLink,
  AlertCircle,
  FileText,
} from 'lucide-react';
import api from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { AdminPageHeader, AdminButton } from '@/components/admin';
import { getErrorMessage } from '@/lib/utils';

export default function VisitDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = (params?.id as string) || '';

  const [outcomeText, setOutcomeText] = useState('');

  const { data: visit, isLoading, isError } = useQuery({
    queryKey: ['visit-detail', id],
    queryFn: async () => {
      const res: any = await api.get(`/visits/${id}`);
      return res?.data || res;
    },
    enabled: Boolean(id),
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ status, outcome }: { status: string; outcome?: string }) => {
      return api.patch(`/visits/${id}`, { status, outcome });
    },
    onSuccess: (_, vars) => {
      toast.success(`Visit marked as ${vars.status}`);
      queryClient.invalidateQueries({ queryKey: ['visit-detail', id] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return api.delete(`/visits/${id}`);
    },
    onSuccess: () => {
      toast.success('Visit record removed');
      router.push('/visits');
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto py-24 text-center">
        <div className="w-10 h-10 border-4 border-[#23C45E] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-500 font-bold text-sm">Loading visit details...</p>
      </div>
    );
  }

  if (isError || !visit) {
    return (
      <div className="max-w-xl mx-auto py-24 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-black text-slate-900">Visit Record Not Found</h2>
        <p className="text-xs text-slate-500">This visit does not exist or has been cancelled.</p>
        <Link
          href="/visits"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-2xl text-xs font-black"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Visits
        </Link>
      </div>
    );
  }

  const clientName = visit.customerName || visit.clientName || 'Client Visit';

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-16 text-slate-800 animate-in fade-in-50 duration-200">
      {/* Top Header */}
      <AdminPageHeader
        title={clientName}
        description={`${visit.purpose || 'Client On-site Consultation'}${visit.visitType ? ` • ${visit.visitType}` : ''}`}
        icon={Calendar}
        iconColor="text-emerald-600"
        badge={{
          text: `Visit #${visit.id} • ${visit.status || 'SCHEDULED'}`,
          icon: Calendar,
          variant: visit.status === 'COMPLETED' ? 'emerald' : visit.status === 'CANCELLED' ? 'rose' : 'slate',
        }}
        breadcrumbs={[
          { label: 'Field Operations', href: '/visits' },
          { label: 'Client Visits', href: '/visits' },
          { label: clientName },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            {visit.status !== 'COMPLETED' && (
              <AdminButton
                variant="primary"
                size="md"
                icon={CheckCircle2}
                onClick={() => {
                  const outcome = prompt('Enter meeting outcome summary:', visit.outcome || '');
                  if (outcome !== null) {
                    updateStatusMutation.mutate({ status: 'COMPLETED', outcome });
                  }
                }}
              >
                Mark Completed
              </AdminButton>
            )}

            {visit.status !== 'CANCELLED' && visit.status !== 'COMPLETED' && (
              <AdminButton
                variant="outline"
                size="md"
                icon={XCircle}
                className="text-rose-600 hover:text-rose-700 border-rose-200 hover:bg-rose-50"
                onClick={() => {
                  if (confirm('Cancel this scheduled visit?')) {
                    updateStatusMutation.mutate({ status: 'CANCELLED' });
                  }
                }}
              >
                Cancel Visit
              </AdminButton>
            )}

            <AdminButton
              variant="danger"
              size="md"
              icon={Trash2}
              onClick={() => {
                if (confirm('Delete this visit record permanently?')) {
                  deleteMutation.mutate();
                }
              }}
            >
              Delete
            </AdminButton>
          </div>
        }
      />

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Schedule & Location */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" /> Schedule & Time
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] font-bold uppercase block">Scheduled Date</span>
                <p className="font-extrabold text-slate-900 mt-0.5">
                  {visit.date ? new Date(visit.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Today'}
                </p>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] font-bold uppercase block">Time Slot</span>
                <p className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" /> {visit.time || '10:30 AM'}
                </p>
              </div>

              {visit.startedAt && (
                <div>
                  <span className="text-slate-400 text-[10px] font-bold uppercase block">Started At</span>
                  <p className="font-bold text-slate-800 mt-0.5">
                    {new Date(visit.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              )}

              {visit.completedAt && (
                <div>
                  <span className="text-slate-400 text-[10px] font-bold uppercase block">Completed At</span>
                  <p className="font-bold text-emerald-700 mt-0.5">
                    {new Date(visit.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              )}

              {visit.duration && (
                <div>
                  <span className="text-slate-400 text-[10px] font-bold uppercase block">Duration</span>
                  <p className="font-bold text-slate-800 mt-0.5">{visit.duration} minutes</p>
                </div>
              )}

              {visit.nextFollowUpDate && (
                <div>
                  <span className="text-slate-400 text-[10px] font-bold uppercase block">Next Follow-up</span>
                  <p className="font-extrabold text-[#1AA14D] mt-0.5">
                    {new Date(visit.nextFollowUpDate).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Location & GPS */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-rose-500" /> Meeting Venue
            </h3>

            <div className="space-y-2 text-xs">
              <p className="font-bold text-slate-800 leading-relaxed">{visit.location}</p>
              {visit.latitude && visit.longitude && (
                <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-[11px] font-mono text-slate-600">
                  <span>GPS: {visit.latitude.toFixed(4)}, {visit.longitude.toFixed(4)}</span>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${visit.latitude},${visit.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 font-bold hover:underline"
                  >
                    Open Maps
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Representative & Ownership Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4 text-xs">
            <div>
              <span className="text-slate-400 text-[10px] font-bold uppercase block mb-1.5">Assigned Visitor</span>
              {visit.employee ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#1AA14D] font-black flex items-center justify-center">
                    {visit.employee.firstName?.[0] || 'E'}
                  </div>
                  <div>
                    <p className="font-extrabold text-slate-900 text-sm">
                      {visit.employee.firstName} {visit.employee.lastName}
                    </p>
                    <p className="text-slate-400 font-medium text-[11px]">{visit.employee.employeeCode}</p>
                  </div>
                </div>
              ) : (
                <p className="font-extrabold text-slate-900">Unassigned Field Rep</p>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-slate-400 text-[10px] font-bold uppercase block">Visited By</span>
                <p className="font-extrabold text-[#1AA14D] text-xs mt-0.5">
                  {visit.completedBy || '—'}
                </p>
              </div>

              {visit.scheduledBy && (
                <div>
                  <span className="text-slate-400 text-[10px] font-bold uppercase block">Scheduled By</span>
                  <p className="font-bold text-slate-800 text-xs mt-0.5">{visit.scheduledBy}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Relations & Outcome Notes */}
        <div className="lg:col-span-2 space-y-6">
          {/* Associated Company / Contact Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {visit.company && (
              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-2 text-xs">
                <span className="text-slate-400 text-[10px] font-bold uppercase block">Organization</span>
                <Link
                  href={`/companies/${visit.company.id}`}
                  className="font-extrabold text-purple-900 text-sm hover:underline flex items-center justify-between"
                >
                  <span>{visit.company.name}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
                {visit.company.city && <p className="text-slate-500 font-medium">{visit.company.city}</p>}
              </div>
            )}

            {visit.contact && (
              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-2 text-xs">
                <span className="text-slate-400 text-[10px] font-bold uppercase block">Primary Contact</span>
                <Link
                  href={`/contacts/${visit.contact.id}`}
                  className="font-extrabold text-emerald-900 text-sm hover:underline flex items-center justify-between"
                >
                  <span>{visit.contact.firstName} {visit.contact.lastName}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
                {visit.contact.phone && <p className="text-slate-500 font-medium">{visit.contact.phone}</p>}
              </div>
            )}
          </div>

          {/* Outcome & Minutes of Meeting */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#23C45E]" /> Visit Outcome & Meeting Minutes
            </h3>

            {visit.outcome ? (
              <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 text-xs space-y-1">
                <span className="font-black text-emerald-900 uppercase text-[10px] tracking-wider block">Meeting Outcome</span>
                <p className="text-emerald-950 font-medium leading-relaxed">{visit.outcome}</p>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No formal outcome recorded yet.</p>
            )}

            {visit.notes && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
                <span className="font-black text-slate-700 uppercase text-[10px] tracking-wider block">Internal Notes</span>
                <p className="text-slate-700 font-medium leading-relaxed">{visit.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
