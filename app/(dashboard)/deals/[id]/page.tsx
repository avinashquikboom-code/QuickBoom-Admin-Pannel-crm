'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  DollarSign,
  Briefcase,
  Building,
  User,
  Calendar,
  Clock,
  TrendingUp,
  Award,
  CheckCircle2,
  XCircle,
  Trash2,
  Edit,
  ExternalLink,
  Plus,
  AlertCircle,
  FileText,
  Navigation,
} from 'lucide-react';
import api from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { AdminFormDrawer } from '@/components/admin';
import { getErrorMessage } from '@/lib/utils';

export default function DealDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = (params?.id as string) || '';

  const [isScheduleVisitOpen, setIsScheduleVisitOpen] = useState(false);
  const [visitForm, setVisitForm] = useState({
    purpose: 'Deal Closing & Contract Finalization',
    visitType: 'CLOSING',
    date: new Date().toISOString().split('T')[0],
    time: '11:00 AM',
    location: '',
    notes: '',
  });

  const { data: deal, isLoading, isError } = useQuery({
    queryKey: ['deal-detail', id],
    queryFn: async () => {
      const res: any = await api.get(`/deals/${id}`);
      return res?.data || res;
    },
    enabled: Boolean(id),
  });

  const updateStageMutation = useMutation({
    mutationFn: async ({ stageId, isWon, isLost }: { stageId: string; isWon?: boolean; isLost?: boolean }) => {
      return api.patch(`/deals/${id}/stage`, { stageId, isWon, isLost });
    },
    onSuccess: () => {
      toast.success('Stage updated successfully');
      queryClient.invalidateQueries({ queryKey: ['deal-detail', id] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  const scheduleVisitMutation = useMutation({
    mutationFn: async () => {
      return api.post('/visits', {
        customerName: deal?.company?.name || deal?.title || 'Deal Meeting',
        purpose: visitForm.purpose,
        visitType: visitForm.visitType,
        date: new Date(visitForm.date).toISOString(),
        time: visitForm.time,
        location: visitForm.location || deal?.company?.address || 'Client Office',
        companyId: deal?.companyId ? String(deal?.companyId) : undefined,
        contactId: deal?.contactId ? String(deal?.contactId) : undefined,
        dealId: String(id),
        notes: visitForm.notes || undefined,
      });
    },
    onSuccess: () => {
      toast.success('Visit scheduled for deal');
      setIsScheduleVisitOpen(false);
      queryClient.invalidateQueries({ queryKey: ['deal-detail', id] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return api.delete(`/deals/${id}`);
    },
    onSuccess: () => {
      toast.success('Deal archived');
      router.push('/deals');
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto py-24 text-center">
        <div className="w-10 h-10 border-4 border-[#23C45E] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-500 font-bold text-sm">Loading deal details...</p>
      </div>
    );
  }

  if (isError || !deal) {
    return (
      <div className="max-w-xl mx-auto py-24 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-black text-slate-900">Deal Not Found</h2>
        <p className="text-xs text-slate-500">This opportunity does not exist or has been deleted.</p>
        <Link
          href="/deals"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-2xl text-xs font-black"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Deals
        </Link>
      </div>
    );
  }

  const stages = [
    { id: '1', name: 'Qualified' },
    { id: '2', name: 'Proposal' },
    { id: '3', name: 'Negotiation' },
    { id: '4', name: 'Won' },
  ];

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-16 text-slate-800 animate-in fade-in-50 duration-200">
      {/* Top Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-slate-700/60 shadow-xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Link
                href="/deals"
                className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-slate-300 hover:text-white transition-all backdrop-blur-xs"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-black uppercase tracking-wider">
                Deal #{deal.id}
              </span>
              <span
                className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  deal.isWon
                    ? 'bg-emerald-500/20 text-[#23C45E] border border-emerald-500/30'
                    : deal.isLost
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                }`}
              >
                {deal.isWon ? 'WON' : deal.isLost ? 'LOST' : 'IN PIPELINE'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">{deal.title}</h1>
            <p className="text-xs sm:text-sm text-slate-300 font-medium flex items-center gap-2">
              <span className="text-[#23C45E] font-black text-lg">₹{Number(deal.amount || 0).toLocaleString('en-IN')}</span>
              {deal.company && <span>• {deal.company.name}</span>}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {!deal.isWon && (
              <button
                onClick={() => updateStageMutation.mutate({ stageId: '4', isWon: true, isLost: false })}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#23C45E] hover:bg-[#1AA14D] text-slate-950 font-black rounded-2xl text-xs shadow-md shadow-[#23C45E]/20 transition-all cursor-pointer active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Mark Won</span>
              </button>
            )}

            <button
              onClick={() => {
                setVisitForm({
                  purpose: 'Deal Closing & Contract Finalization',
                  visitType: 'CLOSING',
                  date: new Date().toISOString().split('T')[0],
                  time: '11:00 AM',
                  location: deal.company?.address || 'Client HQ',
                  notes: '',
                });
                setIsScheduleVisitOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600/30 hover:bg-blue-600/40 text-blue-200 border border-blue-500/40 rounded-2xl text-xs font-black transition-all cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-blue-400" />
              <span>Schedule Visit</span>
            </button>

            <button
              onClick={() => {
                if (confirm(`Archive deal "${deal.title}"?`)) {
                  deleteMutation.mutate();
                }
              }}
              className="p-2.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded-2xl text-xs font-black transition-all cursor-pointer"
              title="Archive Deal"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stage Progression Stepper */}
        <div className="mt-8 pt-6 border-t border-slate-700/60">
          <div className="grid grid-cols-4 gap-2 sm:gap-4">
            {stages.map((stg, idx) => {
              const currentStageId = deal.stageId || 1;
              const isPassed = Number(stg.id) <= Number(currentStageId) || deal.isWon;
              const isCurrent = Number(stg.id) === Number(currentStageId);

              return (
                <button
                  key={stg.id}
                  onClick={() => updateStageMutation.mutate({ stageId: stg.id, isWon: stg.id === '4', isLost: false })}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-[#23C45E]/20 border-[#23C45E] text-white shadow-xs'
                      : isPassed
                      ? 'bg-white/10 border-white/20 text-slate-200'
                      : 'bg-white/5 border-white/5 text-slate-500 hover:bg-white/10'
                  }`}
                >
                  <span className="text-[10px] font-black uppercase tracking-wider block opacity-75">
                    Step {idx + 1}
                  </span>
                  <span className="font-extrabold text-xs block truncate mt-0.5">{stg.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Deal Overview */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-[#23C45E]" /> Financial & Stage Parameters
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] font-bold uppercase block">Deal Value</span>
                <p className="font-black text-slate-900 text-base mt-0.5">
                  ₹{Number(deal.amount || 0).toLocaleString('en-IN')}
                </p>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] font-bold uppercase block">Win Probability</span>
                <p className="font-extrabold text-[#1AA14D] mt-0.5">{deal.probability}%</p>
              </div>

              {deal.expectedClosing && (
                <div>
                  <span className="text-slate-400 text-[10px] font-bold uppercase block">Expected Closing Date</span>
                  <p className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" /> {new Date(deal.expectedClosing).toLocaleDateString()}
                  </p>
                </div>
              )}

              <div>
                <span className="text-slate-400 text-[10px] font-bold uppercase block">Deal Source</span>
                <p className="font-bold text-slate-800 mt-0.5">{deal.source || 'CRM Pipeline'}</p>
              </div>
            </div>
          </div>

          {/* Associated Company Card */}
          {deal.company && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-3 text-xs">
              <span className="text-slate-400 text-[10px] font-bold uppercase block">Associated Organization</span>
              <Link
                href={`/companies/${deal.company.id}`}
                className="font-extrabold text-purple-900 text-sm hover:underline flex items-center justify-between"
              >
                <span>{deal.company.name}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
              {deal.company.city && <p className="text-slate-500 font-medium">{deal.company.city}</p>}
            </div>
          )}

          {/* Associated Contact Card */}
          {deal.contact && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-3 text-xs">
              <span className="text-slate-400 text-[10px] font-bold uppercase block">Primary Contact Person</span>
              <Link
                href={`/contacts/${deal.contact.id}`}
                className="font-extrabold text-emerald-900 text-sm hover:underline flex items-center justify-between"
              >
                <span>{deal.contact.firstName} {deal.contact.lastName}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
              {deal.contact.designation && <p className="text-slate-500 font-medium">{deal.contact.designation}</p>}
            </div>
          )}

          {/* Deal Owner Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-2 text-xs">
            <span className="text-slate-400 text-[10px] font-bold uppercase block">Assigned Deal Owner</span>
            <p className="font-extrabold text-slate-900 text-sm">
              {deal.assignedTo ? `${deal.assignedTo.firstName} ${deal.assignedTo.lastName}` : 'Unassigned'}
            </p>
          </div>
        </div>

        {/* Right Column: Visits & Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Notes & Description */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" /> Deal Scope & Notes
            </h3>

            {deal.description && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
                <span className="font-black text-slate-700 uppercase text-[10px] tracking-wider block">Description</span>
                <p className="text-slate-800 font-medium leading-relaxed">{deal.description}</p>
              </div>
            )}

            {deal.notes && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
                <span className="font-black text-slate-700 uppercase text-[10px] tracking-wider block">Internal Notes</span>
                <p className="text-slate-800 font-medium leading-relaxed">{deal.notes}</p>
              </div>
            )}
          </div>

          {/* Field Visits Related to this Deal */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <Navigation className="w-4 h-4 text-[#23C45E]" /> Associated Field Meetings
              </h3>
              <button
                onClick={() => setIsScheduleVisitOpen(true)}
                className="text-xs font-black text-[#1AA14D] hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Schedule Meeting
              </button>
            </div>

            {deal.visits && deal.visits.length > 0 ? (
              <div className="space-y-3">
                {deal.visits.map((visit: any) => (
                  <div
                    key={visit.id}
                    className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div className="space-y-1">
                      <p className="font-black text-slate-900 text-sm">{visit.purpose || 'Meeting'}</p>
                      <p className="text-slate-500 font-medium">{visit.location}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-700">{new Date(visit.date).toLocaleDateString()}</p>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                        {visit.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center font-bold">No field visits scheduled for this deal yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* SCHEDULE VISIT DRAWER */}
      <AdminFormDrawer
        isOpen={isScheduleVisitOpen}
        onClose={() => setIsScheduleVisitOpen(false)}
        title="Schedule Meeting for Deal"
        subtitle={`Deal: ${deal.title}`}
        size="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            scheduleVisitMutation.mutate();
          }}
          className="space-y-4"
        >
          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">Meeting Purpose *</label>
            <input
              type="text"
              required
              value={visitForm.purpose}
              onChange={(e) => setVisitForm({ ...visitForm, purpose: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Date *</label>
              <input
                type="date"
                required
                value={visitForm.date}
                onChange={(e) => setVisitForm({ ...visitForm, date: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Time *</label>
              <input
                type="text"
                required
                value={visitForm.time}
                onChange={(e) => setVisitForm({ ...visitForm, time: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">Location *</label>
            <input
              type="text"
              required
              value={visitForm.location}
              onChange={(e) => setVisitForm({ ...visitForm, location: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsScheduleVisitOpen(false)}
              className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={scheduleVisitMutation.isPending}
              className="px-5 py-2 bg-[#23C45E] hover:bg-[#1AA14D] text-slate-950 font-black rounded-xl text-xs cursor-pointer shadow-md shadow-[#23C45E]/20"
            >
              {scheduleVisitMutation.isPending ? 'Scheduling...' : 'Schedule Visit'}
            </button>
          </div>
        </form>
      </AdminFormDrawer>
    </div>
  );
}
