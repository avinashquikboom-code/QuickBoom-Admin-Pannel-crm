'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Edit,
  Building,
  Mail,
  Phone,
  DollarSign,
  Calendar,
  MapPin,
  Tag,
  Globe,
  Star,
  CheckCircle2,
  Clock,
  Send,
  UserCheck,
  Award,
  Layers,
  Trash2,
  AlertCircle,
  ExternalLink,
  MessageSquare,
  Plus,
  RefreshCw,
} from 'lucide-react';
import api from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { AdminFormDrawer } from '@/components/admin';
import { getErrorMessage } from '@/lib/utils';

function getStageConfigFromApi(
  lead: { stageId?: number | string | null; status?: string | null; stage?: any | null },
  apiStages: any[]
): { label: string; color?: string; bgColor: string; borderColor: string } {
  // 1. Try to match by stageId
  if (lead.stageId && apiStages.length > 0) {
    const found = apiStages.find((s: any) => String(s.id) === String(lead.stageId));
    if (found) {
      return {
        label: found.name || found.label || 'Stage',
        color: found.color,
        bgColor: found.bgColor || '#F1F5F9',
        borderColor: found.borderColor || '#E2E8F0',
      };
    }
  }
  // 2. Try to match by nested stage relation
  if (lead.stage && (lead.stage.name || lead.stage.label)) {
    return {
      label: lead.stage.name || lead.stage.label || 'Stage',
      color: lead.stage.color,
      bgColor: lead.stage.bgColor || '#F1F5F9',
      borderColor: lead.stage.borderColor || '#E2E8F0',
    };
  }
  // 3. Match by status key in apiStages
  if (lead.status && apiStages.length > 0) {
    const foundByKey = apiStages.find((s: any) => s.key === lead.status);
    if (foundByKey) {
      return {
        label: foundByKey.name || foundByKey.label || foundByKey.key,
        color: foundByKey.color,
        bgColor: foundByKey.bgColor || '#F1F5F9',
        borderColor: foundByKey.borderColor || '#E2E8F0',
      };
    }
  }
  // 4. Generic fallback
  return {
    label: lead.status || 'Unknown',
    bgColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  };
}

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = (params?.id as string) || '';

  const [activeTab, setActiveTab] = useState<'TIMELINE' | 'NOTES' | 'FOLLOW_UPS' | 'VISITS'>('TIMELINE');
  const [newNote, setNewNote] = useState('');
  const [isFollowUpOpen, setIsFollowUpOpen] = useState(false);
  const [isConvertOpen, setIsConvertOpen] = useState(false);

  // Follow-up form
  const [followUpOutcome, setFollowUpOutcome] = useState('Interested');
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpTime, setFollowUpTime] = useState('11:00');
  const [followUpNotes, setFollowUpNotes] = useState('');

  // Conversion form
  const [convertCompanyName, setConvertCompanyName] = useState('');
  const [convertDealTitle, setConvertDealTitle] = useState('');
  const [convertDealValue, setConvertDealValue] = useState('150000');
  const [convertNotes, setConvertNotes] = useState('');

  // Fetch Full Lead Details
  const { data: lead, isLoading, isError, refetch } = useQuery({
    queryKey: ['lead-detail', id],
    queryFn: async () => {
      const res: any = await api.get(`/leads/${id}`);
      return res?.data || res;
    },
    enabled: Boolean(id),
  });

  // Fetch active stages from Stage Management API
  const {
    data: stagesData,
    isLoading: isLoadingStages,
    isError: isStagesError,
    refetch: refetchStages,
  } = useQuery({
    queryKey: ['lead-stages'],
    queryFn: async () => {
      const res: any = await api.get('/leads/stages?includeInactive=false');
      return Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
    },
    retry: 1,
  });

  const allStages = React.useMemo(() => {
    if (!Array.isArray(stagesData)) return [];
    return [...stagesData].sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }, [stagesData]);

  // Update Status / Stage Mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ stageId, status }: { stageId?: number; status?: string }) => {
      return api.patch(`/leads/${id}/status`, { stageId, status });
    },
    onSuccess: () => {
      toast.success('Lead status updated!');
      queryClient.invalidateQueries({ queryKey: ['lead-detail', id] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  // Add Note Mutation
  const addNoteMutation = useMutation({
    mutationFn: async (content: string) => {
      return api.post(`/leads/${id}/notes`, { content });
    },
    onSuccess: () => {
      toast.success('Note added successfully');
      setNewNote('');
      queryClient.invalidateQueries({ queryKey: ['lead-detail', id] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  // Log Follow-up Mutation
  const followUpMutation = useMutation({
    mutationFn: async () => {
      return api.post(`/leads/${id}/follow-ups`, {
        outcome: followUpOutcome,
        notes: followUpNotes || undefined,
        nextFollowUpDate: followUpDate ? new Date(followUpDate) : undefined,
        nextFollowUpTime: followUpTime || undefined,
      });
    },
    onSuccess: () => {
      toast.success('Follow-up recorded successfully');
      setIsFollowUpOpen(false);
      queryClient.invalidateQueries({ queryKey: ['lead-detail', id] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  // Convert Lead Mutation
  const convertMutation = useMutation({
    mutationFn: async () => {
      return api.post(`/leads/${id}/convert`, {
        companyName: convertCompanyName.trim() || lead?.companyName || lead?.title,
        dealTitle: convertDealTitle.trim() || `${lead?.companyName || lead?.title} - Enterprise Deal`,
        dealValue: convertDealValue ? parseFloat(convertDealValue) : (lead?.value || 0),
        notes: convertNotes.trim() || undefined,
      });
    },
    onSuccess: (res: any) => {
      const msg = res?.data?.message || res?.message || 'Lead converted successfully!';
      toast.success(typeof msg === 'string' ? msg : 'Lead converted.');
      setIsConvertOpen(false);
      queryClient.invalidateQueries({ queryKey: ['lead-detail', id] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      return api.delete(`/leads/${id}`);
    },
    onSuccess: () => {
      toast.success('Lead deleted');
      router.push('/leads');
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto py-24 text-center">
        <div className="w-10 h-10 border-4 border-[#23C45E] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-500 font-bold text-sm">Loading lead profile...</p>
      </div>
    );
  }

  if (isError || !lead) {
    return (
      <div className="max-w-xl mx-auto py-24 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-black text-slate-900">Lead Record Not Found</h2>
        <p className="text-xs text-slate-500">The requested CRM lead does not exist or has been deleted.</p>
        <Link
          href="/leads"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-2xl text-xs font-black"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Leads
        </Link>
      </div>
    );
  }

  const name = `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || 'Direct Prospect';
  const company = lead.companyName || lead.title || 'Client Company';
  const isConverted = lead.status === 'CONVERTED' || lead.status === 'WON';

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-16 text-slate-800 animate-in fade-in-50 duration-200">
      {/* Top Navigation & Action Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-slate-700/60 shadow-xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-[#23C45E]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Link
                href="/leads"
                className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-slate-300 hover:text-white transition-all backdrop-blur-xs"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-[#23C45E] border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider">
                Lead Record #{lead.id}
              </span>
              <span
                className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  isConverted
                    ? 'bg-emerald-500 text-slate-950 font-black'
                    : 'bg-white/15 text-white'
                }`}
              >
                {lead.status}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">{company}</h1>
            <p className="text-xs sm:text-sm text-slate-300 font-medium flex items-center gap-2">
              <span>Contact: {name}</span>
              {lead.city && <span>• {lead.city}, {lead.state || lead.country}</span>}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                setFollowUpOutcome('Interested');
                setFollowUpDate('');
                setFollowUpTime('11:00');
                setFollowUpNotes('');
                setIsFollowUpOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600/30 hover:bg-blue-600/40 text-blue-200 border border-blue-500/40 rounded-2xl text-xs font-black transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <Clock className="w-4 h-4 text-blue-400" />
              <span>Log Follow-up</span>
            </button>

            {!isConverted && (
              <button
                onClick={() => {
                  setConvertCompanyName(company);
                  setConvertDealTitle(`${company} - Enterprise Deal`);
                  setConvertDealValue(String(lead.value || 150000));
                  setConvertNotes('Lead qualified and converted from admin profile.');
                  setIsConvertOpen(true);
                }}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#23C45E] hover:bg-[#1AA14D] text-slate-950 font-black rounded-2xl text-xs shadow-md shadow-[#23C45E]/20 transition-all cursor-pointer active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Convert to Customer</span>
              </button>
            )}

            <button
              onClick={() => {
                if (confirm(`Are you sure you want to delete lead "${company}"?`)) {
                  deleteMutation.mutate();
                }
              }}
              className="p-2.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded-2xl text-xs font-black transition-all cursor-pointer"
              title="Delete Lead"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-400">Deal Value</span>
          <p className="text-xl font-black text-slate-900">₹{Number(lead.value || 0).toLocaleString('en-IN')}</p>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-400">Priority Level</span>
          <p className="text-xl font-black text-slate-900">{lead.priority || 'MEDIUM'}</p>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-400">Lead Source</span>
          <p className="text-xl font-black text-slate-900">{lead.source || 'WEBSITE'}</p>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-400">Assigned Rep</span>
          <p className="text-sm font-black text-slate-900 truncate">
            {lead.assignedTo ? `${lead.assignedTo.firstName} ${lead.assignedTo.lastName}` : 'Unassigned'}
          </p>
        </div>
      </div>

      {/* Dynamic Lifecycle Pipeline Progress Bar — 100% from Stage Management API */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between text-xs font-black text-slate-800">
          <span className="text-sm font-black">Lifecycle Pipeline Stage</span>
          <span className="text-xs font-bold text-slate-500">
            {(() => {
              if (isLoadingStages) return 'Loading stages...';
              if (isStagesError) return 'Error loading stages';
              if (!allStages.length) return '—';
              const currentIdx = allStages.findIndex((s: any) =>
                (lead.stageId && String(s.id) === String(lead.stageId)) ||
                (!lead.stageId && s.key === lead.status)
              );
              return currentIdx >= 0
                ? `Stage ${currentIdx + 1} of ${allStages.length}`
                : `— of ${allStages.length}`;
            })()}
          </span>
        </div>

        {/* Loading State Skeleton */}
        {isLoadingStages && (
          <div className="flex items-center gap-2 py-3 overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex-1 space-y-1.5 animate-pulse">
                <div className="h-2 bg-slate-200 rounded-full" />
                <div className="h-2.5 w-12 bg-slate-200 rounded mx-auto" />
              </div>
            ))}
          </div>
        )}

        {/* Error State with Retry */}
        {isStagesError && (
          <div className="flex items-center justify-between p-3 bg-rose-50 rounded-2xl border border-rose-200 text-xs">
            <span className="text-rose-700 font-bold">Failed to load stages from Stage Management.</span>
            <button
              type="button"
              onClick={() => refetchStages()}
              className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoadingStages && !isStagesError && allStages.length === 0 && (
          <div className="text-center py-3 text-xs text-slate-400 font-medium">
            No active pipeline stages configured in Stage Management.
          </div>
        )}

        {/* Dynamic Responsive Pipeline Display */}
        {!isLoadingStages && !isStagesError && allStages.length > 0 && (() => {
          const currentIdx = allStages.findIndex((s: any) =>
            (lead.stageId && String(s.id) === String(lead.stageId)) ||
            (!lead.stageId && s.key === lead.status)
          );

          return (
            <div className="overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin">
              <div className="flex items-start min-w-max gap-3 py-1">
                {allStages.map((st: any, idx: number) => {
                  const isCompleted = currentIdx >= 0 && idx < currentIdx;
                  const isCurrent = currentIdx >= 0 && idx === currentIdx;
                  const stageColor = st.color || '#23C45E';

                  return (
                    <div
                      key={st.id}
                      className="flex flex-col items-center min-w-[80px] sm:min-w-[92px] max-w-[110px] space-y-2"
                    >
                      {/* Progress Segment Bar */}
                      <div className="w-full flex items-center">
                        <div
                          className={`w-full h-2 rounded-full transition-all ${
                            isCurrent
                              ? 'ring-2 ring-offset-1'
                              : isCompleted
                              ? 'opacity-90'
                              : 'bg-slate-200'
                          }`}
                          style={{
                            backgroundColor: isCurrent || isCompleted ? stageColor : undefined,
                            boxShadow: isCurrent ? `0 0 0 2px ${stageColor}` : undefined,
                          }}
                        />
                      </div>

                      {/* Step Circle with Number or Check */}
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black transition-all border ${
                          isCurrent
                            ? 'text-white'
                            : isCompleted
                            ? 'border-transparent'
                            : 'bg-white border-slate-200 text-slate-400'
                        }`}
                        style={{
                          backgroundColor: isCurrent ? stageColor : isCompleted ? (st.bgColor || '#DCFCE7') : undefined,
                          borderColor: isCurrent ? stageColor : isCompleted ? (st.borderColor || stageColor) : undefined,
                          color: isCurrent ? '#FFFFFF' : isCompleted ? stageColor : undefined,
                        }}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <span>{idx + 1}</span>
                        )}
                      </div>

                      {/* Stage Name — Legible with 2-line wrap */}
                      <span
                        className={`text-[11px] text-center leading-tight line-clamp-2 ${
                          isCurrent ? 'font-black' : isCompleted ? 'font-bold' : 'font-medium'
                        }`}
                        style={{
                          color: isCurrent ? stageColor : isCompleted ? '#334155' : '#94A3B8',
                        }}
                        title={st.name || st.label}
                      >
                        {st.name || st.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* Stage Status Switcher Banner */}
        <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200/80 flex flex-wrap items-center justify-between gap-3 mt-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-emerald-800">
              Current Stage Status
            </p>
            {(() => {
              const conf = getStageConfigFromApi(lead, allStages);
              return (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border"
                    style={{
                      backgroundColor: conf.bgColor,
                      borderColor: conf.borderColor,
                      color: conf.color || '#334155',
                    }}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{conf.label}</span>
                  </span>
                </div>
              );
            })()}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={(() => {
                if (lead.stageId) {
                  const found = allStages.find((s: any) => String(s.id) === String(lead.stageId));
                  if (found) return String(found.id);
                  if (lead.stage?.id) return String(lead.stage.id);
                }
                const foundByKey = allStages.find((s: any) => s.key === lead.status);
                return foundByKey ? String(foundByKey.id) : '';
              })()}
              onChange={(e) => {
                const selectedId = e.target.value;
                const matchedStage = allStages.find((s: any) => String(s.id) === String(selectedId));
                if (matchedStage) {
                  updateStatusMutation.mutate({
                    stageId: Number(matchedStage.id),
                  });
                }
              }}
              disabled={updateStatusMutation.isPending || isLoadingStages}
              className="px-3 py-1.5 bg-white border border-emerald-300 rounded-xl text-xs font-bold text-slate-900 shadow-xs focus:ring-2 focus:ring-[#23C45E] disabled:opacity-50 cursor-pointer"
            >
              {isLoadingStages && (
                <option value="" disabled>Loading stages...</option>
              )}
              {isStagesError && (
                <option value="" disabled>Failed to load stages</option>
              )}
              {!isLoadingStages && !isStagesError && allStages.length === 0 && (
                <option value="" disabled>No stages configured</option>
              )}
              {lead.stageId && !allStages.some((s: any) => String(s.id) === String(lead.stageId)) && (
                <option value={String(lead.stageId)} disabled>
                  {lead.stage?.name || lead.status || 'Current Stage'} (Inactive)
                </option>
              )}
              {allStages.map((st: any) => (
                <option key={st.id} value={String(st.id)}>
                  {st.name || st.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Business & Contact Information */}
        <div className="lg:col-span-1 space-y-6">
          {/* Contact Details Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-[#23C45E]" /> Contact Information
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] font-bold uppercase block">Full Name</span>
                <p className="font-extrabold text-slate-900 text-sm mt-0.5">{name}</p>
              </div>

              {lead.phone && (
                <div>
                  <span className="text-slate-400 text-[10px] font-bold uppercase block">Phone</span>
                  <a
                    href={`tel:${lead.phone}`}
                    className="font-bold text-slate-800 hover:text-[#1AA14D] flex items-center gap-1.5 mt-0.5"
                  >
                    <Phone className="w-3.5 h-3.5 text-[#23C45E]" /> {lead.phone}
                  </a>
                </div>
              )}

              {lead.email && (
                <div>
                  <span className="text-slate-400 text-[10px] font-bold uppercase block">Email</span>
                  <a
                    href={`mailto:${lead.email}`}
                    className="font-bold text-slate-800 hover:text-[#1AA14D] flex items-center gap-1.5 mt-0.5"
                  >
                    <Mail className="w-3.5 h-3.5 text-slate-400" /> {lead.email}
                  </a>
                </div>
              )}

              {lead.website && (
                <div>
                  <span className="text-slate-400 text-[10px] font-bold uppercase block">Website</span>
                  <a
                    href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold text-blue-600 hover:underline flex items-center gap-1.5 mt-0.5"
                  >
                    <Globe className="w-3.5 h-3.5 text-blue-500" /> {lead.website}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Location & Google Places Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600" /> Location & Place Data
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] font-bold uppercase block">Address</span>
                <p className="font-bold text-slate-800 mt-0.5">{lead.address || 'Address not specified'}</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400 text-[10px] font-bold uppercase block">City</span>
                  <p className="font-bold text-slate-800">{lead.city || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] font-bold uppercase block">State / Country</span>
                  <p className="font-bold text-slate-800">{lead.state || 'Maharashtra'}, {lead.country || 'India'}</p>
                </div>
              </div>

              {lead.googlePlaceId && (
                <div className="p-3 bg-blue-50/80 rounded-2xl border border-blue-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-blue-900 uppercase">Google Place Verified</span>
                    {lead.rating && (
                      <span className="text-[11px] font-black text-amber-600 flex items-center gap-1">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {lead.rating}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] font-mono text-blue-800 truncate">{lead.googlePlaceId}</p>
                </div>
              )}
            </div>
          </div>

          {/* Customer Conversion Card if Converted */}
          {isConverted && (
            <div className="bg-emerald-50/80 p-6 rounded-3xl border border-emerald-200 shadow-xs space-y-3 text-emerald-950 text-xs">
              <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-2 text-[#1AA14D]">
                <CheckCircle2 className="w-4 h-4" /> Converted Customer Account
              </h3>
              <p className="text-[11px] text-emerald-900/80">
                This lead was successfully converted on{' '}
                <strong>{lead.convertedAt ? new Date(lead.convertedAt).toLocaleDateString() : 'recently'}</strong>.
              </p>
              {lead.convertedToCompanyId && (
                <Link
                  href={`/customers`}
                  className="inline-flex items-center gap-1.5 font-bold text-emerald-800 hover:text-emerald-950 underline"
                >
                  <span>View Customer Record</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Interactive Tabs (Timeline, Notes, Follow-ups, Visits) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tab Navigation Header */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-2 flex items-center gap-2 overflow-x-auto">
            {(
              [
                { key: 'TIMELINE', label: 'Activity Timeline', count: lead.timeline?.length || 0 },
                { key: 'NOTES', label: 'Internal Notes', count: lead.notes?.length || 0 },
                { key: 'FOLLOW_UPS', label: 'Status Audit', count: lead.statusHistory?.length || 0 },
                { key: 'VISITS', label: 'Field Visits', count: lead.visits?.length || 0 },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                  activeTab === tab.key
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                    activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* TAB 1: TIMELINE */}
          {activeTab === 'TIMELINE' && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                Full Lead Engagement History
              </h3>

              {lead.timeline && lead.timeline.length > 0 ? (
                <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {lead.timeline.map((item: any) => (
                    <div key={item.id} className="relative">
                      <div className="absolute -left-6 mt-1 w-4 h-4 rounded-full bg-[#23C45E] border-2 border-white shadow-xs" />
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-black text-slate-900 text-xs">{item.action}</span>
                          <span className="text-[10px] text-slate-400 font-bold">
                            {item.createdAt && !isNaN(new Date(item.createdAt).getTime()) ? new Date(item.createdAt).toLocaleString() : 'Recent'}
                          </span>
                        </div>
                        <p className="text-slate-600 font-medium">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-8 text-center font-bold">No timeline events recorded yet.</p>
              )}
            </div>
          )}

          {/* TAB 2: NOTES */}
          {activeTab === 'NOTES' && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
              {/* Add Note Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newNote.trim()) return;
                  addNoteMutation.mutate(newNote.trim());
                }}
                className="space-y-3"
              >
                <label className="text-xs font-black uppercase tracking-wider text-slate-800 block">
                  Add Internal Note
                </label>
                <textarea
                  rows={3}
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Record customer preferences, deal progress, or special instructions..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={addNoteMutation.isPending || !newNote.trim()}
                    className="px-5 py-2 bg-[#23C45E] hover:bg-[#1AA14D] text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{addNoteMutation.isPending ? 'Posting...' : 'Post Note'}</span>
                  </button>
                </div>
              </form>

              {/* Notes List */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                {lead.notes && lead.notes.length > 0 ? (
                  lead.notes.map((note: any) => (
                    <div key={note.id} className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">
                          {note.user ? `${note.user.firstName} ${note.user.lastName}` : 'CRM User'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold">
                          {note.createdAt && !isNaN(new Date(note.createdAt).getTime()) ? new Date(note.createdAt).toLocaleString() : 'Recent'}
                        </span>
                      </div>
                      <p className="text-slate-700 whitespace-pre-line leading-relaxed font-medium">{note.content}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 py-6 text-center font-bold">No internal notes added yet.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: STATUS AUDIT HISTORY */}
          {activeTab === 'FOLLOW_UPS' && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                Pipeline Stage Transition Log
              </h3>

              {lead.statusHistory && lead.statusHistory.length > 0 ? (
                <div className="space-y-3">
                  {lead.statusHistory.map((hist: any) => (
                    <div key={hist.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-slate-900">
                          {hist.fromStatus || 'START'} → {hist.toStatus}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold">
                          {hist.createdAt && !isNaN(new Date(hist.createdAt).getTime()) ? new Date(hist.createdAt).toLocaleString() : 'Recent'}
                        </span>
                      </div>
                      {hist.notes && <p className="text-slate-600 font-medium">{hist.notes}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-8 text-center font-bold">No stage transitions logged.</p>
              )}
            </div>
          )}

          {/* TAB 4: FIELD VISITS */}
          {activeTab === 'VISITS' && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                Field Visits & Client Demonstrations
              </h3>

              {lead.visits && lead.visits.length > 0 ? (
                <div className="space-y-3">
                  {lead.visits.map((v: any) => (
                    <div key={v.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-slate-900">{v.purpose || 'Client Visit'}</span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          {v.status || 'SCHEDULED'}
                        </span>
                      </div>
                      <p className="text-slate-600 font-medium">
                        Scheduled Date: {v.visitDate ? new Date(v.visitDate).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-8 text-center font-bold">No field visits scheduled yet.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* FOLLOW-UP DRAWER */}
      <AdminFormDrawer
        isOpen={isFollowUpOpen}
        onClose={() => setIsFollowUpOpen(false)}
        title="Log Follow-up Outcome"
        subtitle={`Lead: ${company}`}
        size="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            followUpMutation.mutate();
          }}
          className="space-y-4"
        >
          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">Call Outcome *</label>
            <select
              value={followUpOutcome}
              onChange={(e) => setFollowUpOutcome(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
            >
              <option value="Interested">Interested in Demo</option>
              <option value="Call Later">Busy - Requested Call Later</option>
              <option value="Quotation Requested">Requested Proposal / Quotation</option>
              <option value="Negotiation">Commercial Negotiation</option>
              <option value="Not Interested">Not Interested</option>
              <option value="Wrong Number">Invalid Number</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Next Follow-up Date</label>
              <input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Time</label>
              <input
                type="time"
                value={followUpTime}
                onChange={(e) => setFollowUpTime(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">Interaction Notes</label>
            <textarea
              rows={3}
              value={followUpNotes}
              onChange={(e) => setFollowUpNotes(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsFollowUpOpen(false)}
              className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={followUpMutation.isPending}
              className="px-5 py-2 bg-[#23C45E] hover:bg-[#1AA14D] text-slate-950 font-black rounded-xl text-xs cursor-pointer"
            >
              {followUpMutation.isPending ? 'Saving...' : 'Save Follow-up'}
            </button>
          </div>
        </form>
      </AdminFormDrawer>

      {/* CONVERT TO CUSTOMER DRAWER */}
      <AdminFormDrawer
        isOpen={isConvertOpen}
        onClose={() => setIsConvertOpen(false)}
        title="Convert Lead to Customer Account"
        subtitle={`Creating Customer Company & Deal for ${company}`}
        size="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            convertMutation.mutate();
          }}
          className="space-y-4"
        >
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900">
            <p className="font-extrabold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#1AA14D]" /> Lead Qualification
            </p>
            <p className="mt-1 text-[11px]">
              This action will link a verified Customer Company record, create a primary Contact, and add a Deal into the active Sales Pipeline.
            </p>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">Company Account Name *</label>
            <input
              type="text"
              required
              value={convertCompanyName}
              onChange={(e) => setConvertCompanyName(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">Deal Title *</label>
            <input
              type="text"
              required
              value={convertDealTitle}
              onChange={(e) => setConvertDealTitle(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">Deal Value (₹) *</label>
            <input
              type="number"
              required
              value={convertDealValue}
              onChange={(e) => setConvertDealValue(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsConvertOpen(false)}
              className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={convertMutation.isPending}
              className="px-5 py-2 bg-[#23C45E] hover:bg-[#1AA14D] text-slate-950 font-black rounded-xl text-xs cursor-pointer shadow-md shadow-[#23C45E]/20"
            >
              {convertMutation.isPending ? 'Converting...' : 'Confirm Conversion'}
            </button>
          </div>
        </form>
      </AdminFormDrawer>
    </div>
  );
}
