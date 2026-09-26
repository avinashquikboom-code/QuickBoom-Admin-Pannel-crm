'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  History,
  Search,
  Download,
  CheckCircle2,
  ExternalLink,
  MapPin,
  Calendar,
  Sparkles,
  Layers,
  UserPlus,
  RefreshCw,
  Eye,
  X,
  Phone,
  Globe,
  Star,
  Activity,
  Target,
  Database,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';
import { getErrorMessage } from '@/lib/utils';
import { AdminPageHeader, AdminStatCard, AdminCard, AdminButton } from '@/components/admin';

export default function DataCaptureHistoryPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [selectedPlaceIds, setSelectedPlaceIds] = useState<string[]>([]);

  // 1. Fetch Extraction Jobs History
  const { data: jobs = [], isLoading, refetch } = useQuery({
    queryKey: ['data-capture-jobs'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/data-capture/jobs');
        const list = Array.isArray(res) ? res : res?.data || [];
        return list;
      } catch {
        return [];
      }
    },
  });

  // 2. Fetch Usage Metrics
  const { data: usage, refetch: refetchUsage } = useQuery({
    queryKey: ['data-capture-usage'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/data-capture/usage');
        return res?.data || res || {
          totalExtractions: 0,
          totalLeadsCaptured: 0,
          totalGoogleApiCalls: 0,
          quotaLimit: 1000,
          quotaRemaining: 1000,
        };
      } catch {
        return {
          totalExtractions: 0,
          totalLeadsCaptured: 0,
          totalGoogleApiCalls: 0,
          quotaLimit: 1000,
          quotaRemaining: 1000,
        };
      }
    },
  });

  // Import to Leads Mutation
  const importMutation = useMutation({
    mutationFn: async ({ jobId, placeIds, places }: { jobId: string; placeIds: string[]; places?: any[] }) => {
      return api.post('/data-capture/import-to-leads', { jobId, placeIds, places });
    },
    onSuccess: (res: any) => {
      const data = res?.data || res;
      toast.success(data?.message || 'Leads imported into CRM successfully!', { icon: '🎯' });
      setSelectedJob(null);
      setSelectedPlaceIds([]);
      queryClient.invalidateQueries({ queryKey: ['data-capture-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['data-capture-usage'] });
      queryClient.invalidateQueries({ queryKey: ['data-capture-list'] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  const filteredJobs = jobs.filter((j: any) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      j.keyword?.toLowerCase().includes(term) ||
      j.location?.toLowerCase().includes(term) ||
      j.jobId?.toLowerCase().includes(term)
    );
  });

  const handleOpenPlaceDetails = (job: any) => {
    setSelectedJob(job);
    setSelectedPlaceIds((job.places || []).map((p: any) => p.googlePlaceId || String(p.id)));
  };

  const handleToggleSelectPlace = (placeId: string) => {
    if (selectedPlaceIds.includes(placeId)) {
      setSelectedPlaceIds(selectedPlaceIds.filter((id) => id !== placeId));
    } else {
      setSelectedPlaceIds([...selectedPlaceIds, placeId]);
    }
  };

  const handleSelectAllPlaces = () => {
    if (!selectedJob) return;
    const allIds = (selectedJob.places || []).map((p: any) => p.googlePlaceId || String(p.id));
    if (selectedPlaceIds.length === allIds.length) {
      setSelectedPlaceIds([]);
    } else {
      setSelectedPlaceIds(allIds);
    }
  };

  const handleConfirmImport = () => {
    if (!selectedJob || selectedPlaceIds.length === 0) {
      toast.error('Please select at least one prospect to import');
      return;
    }
    const selectedPlaces = (selectedJob.places || []).filter((p: any) =>
      selectedPlaceIds.includes(p.googlePlaceId) || selectedPlaceIds.includes(String(p.id))
    );
    importMutation.mutate({
      jobId: selectedJob.jobId,
      placeIds: selectedPlaceIds,
      places: selectedPlaces,
    });
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-16 text-slate-800 animate-in fade-in-50 duration-200">
      {/* 1. STANDARD PAGE HEADER */}
      <AdminPageHeader
        title="Extraction History & Audit Trail"
        description="Inspect past Google Places extraction batches, review captured records, and import prospects directly into CRM Leads."
        icon={History}
        iconColor="text-[#1AA14D]"
        badge={{
          text: 'EXTRACTION AUDIT LOGS',
          icon: History,
          variant: 'emerald',
        }}
        breadcrumbs={[
          { label: 'CRM', href: '/crm' },
          { label: 'Data Capture', href: '/data-capture' },
          { label: 'Job History' },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <AdminButton
              variant="outline"
              size="md"
              icon={RefreshCw}
              onClick={() => {
                refetch();
                refetchUsage();
              }}
              title="Refresh job history"
            >
              Refresh
            </AdminButton>

            <Link href="/data-capture/usage">
              <AdminButton
                variant="outline"
                size="md"
                icon={Activity}
              >
                Usage Analytics
              </AdminButton>
            </Link>

            <Link href="/data-capture">
              <AdminButton
                variant="primary"
                size="md"
                icon={Target}
              >
                Data Capture Hub
              </AdminButton>
            </Link>
          </div>
        }
      />

      {/* 2. KPI STAT CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <AdminStatCard
          title="Extraction Batches"
          value={jobs.length}
          description="Total extraction runs"
          icon={History}
          iconBg="blue"
        />
        <AdminStatCard
          title="Prospects Extracted"
          value={usage?.totalLeadsCaptured || jobs.reduce((sum: number, j: any) => sum + (j.capturedResults || 0), 0)}
          description="Verified businesses"
          icon={CheckCircle2}
          iconBg="primary"
        />
        <AdminStatCard
          title="Google API Calls"
          value={`${usage?.totalGoogleApiCalls || 0} Requests`}
          description="Text search volume"
          icon={Sparkles}
          iconBg="purple"
        />
        <AdminStatCard
          title="Quota Remaining"
          value={`${usage?.quotaRemaining || 1000} / ${usage?.quotaLimit || 1000}`}
          description="Monthly allowance"
          icon={Layers}
          iconBg="amber"
        />
      </div>

      {/* 3. SEARCH & TOOLBAR */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3 shadow-xs flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by keyword, city, or Job ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
          />
        </div>

        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* 4. HISTORY JOBS TABLE */}
      <AdminCard
        title="Extraction Batch Logs"
        description={`${filteredJobs.length} extraction batches recorded`}
      >
        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-3 border-[#23C45E] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-bold text-slate-500">Loading extraction history...</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="py-16 text-center text-slate-400 font-bold text-xs space-y-2">
            <p>No extraction history matches your search.</p>
            <Link href="/data-capture" className="text-emerald-600 font-black hover:underline inline-block">
              Start a new extraction →
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 font-black uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Batch ID</th>
                  <th className="px-5 py-3.5">Target Query</th>
                  <th className="px-5 py-3.5">Location</th>
                  <th className="px-5 py-3.5">Captured / Requested</th>
                  <th className="px-5 py-3.5">API Calls</th>
                  <th className="px-5 py-3.5">Date & Time</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredJobs.map((job: any) => (
                  <tr key={job.jobId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-4 font-mono font-bold text-slate-500">{job.jobId}</td>
                    <td className="px-5 py-4">
                      <div className="font-extrabold text-slate-900 text-sm">{job.keyword}</div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 text-[11px] font-bold inline-flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-rose-500" />
                        {job.location}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-bold">
                      <span className="text-emerald-600 font-black">{job.capturedResults || (job.places || []).length}</span>
                      <span className="text-slate-400"> / {job.requestedResults || 20} places</span>
                    </td>
                    <td className="px-5 py-4 font-bold text-slate-600">{job.googleApiRequests || 1} requests</td>
                    <td className="px-5 py-4 text-slate-400">
                      {job.createdAt && !isNaN(new Date(job.createdAt).getTime()) ? new Date(job.createdAt).toLocaleString() : 'Recent'}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => handleOpenPlaceDetails(job)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#23C45E] hover:bg-[#1AA14D] text-slate-950 font-black rounded-xl text-xs transition-all cursor-pointer shadow-2xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect ({ (job.places || []).length })</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>

      {/* 5. JOB PLACES INSPECTION MODAL */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-50 duration-150">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative max-h-[90vh] overflow-y-auto flex flex-col">
            <button
              onClick={() => setSelectedJob(null)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-[#23C45E]/10 text-[#23C45E] text-xs font-black uppercase">
                    Batch: {selectedJob.jobId}
                  </span>
                  <h3 className="text-xl font-black text-slate-900">
                    {selectedJob.keyword} in {selectedJob.location}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  {(selectedJob.places || []).length} verified businesses extracted. Select prospects to import into CRM Leads.
                </p>
              </div>

              <button
                onClick={handleSelectAllPlaces}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                {selectedPlaceIds.length === (selectedJob.places || []).length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            {/* Places List */}
            <div className="my-4 space-y-3 max-h-96 overflow-y-auto pr-1">
              {(selectedJob.places || []).map((place: any) => {
                const placeId = place.googlePlaceId || String(place.id);
                const isSelected = selectedPlaceIds.includes(placeId);
                return (
                  <div
                    key={placeId}
                    onClick={() => handleToggleSelectPlace(placeId)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-4 ${
                      isSelected
                        ? 'bg-emerald-50/60 border-emerald-300 shadow-2xs'
                        : 'bg-slate-50 border-slate-200/80 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="w-4 h-4 mt-3 rounded text-[#23C45E] focus:ring-[#23C45E] pointer-events-none"
                      />

                      <div>
                        <h4 className="font-black text-slate-900 text-sm">{place.businessName}</h4>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">{place.address}</p>

                        <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] font-bold text-slate-600">
                          {place.phone && place.phone !== 'N/A' && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {place.phone}
                            </span>
                          )}
                          {place.rating && (
                            <span className="flex items-center gap-1 text-amber-600">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              {place.rating} ({place.reviewCount || 0} reviews)
                            </span>
                          )}
                          {place.website && (
                            <a
                              href={place.website}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-blue-600 hover:underline flex items-center gap-1"
                            >
                              <Globe className="w-3 h-3" />
                              Website
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 text-[10px] font-bold shrink-0">
                      {place.category || 'Business'}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">
                {selectedPlaceIds.length} of {(selectedJob.places || []).length} selected
              </span>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedJob(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  onClick={handleConfirmImport}
                  disabled={importMutation.isPending || selectedPlaceIds.length === 0}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#23C45E] hover:bg-[#1AA14D] text-slate-950 font-black rounded-xl text-xs transition-all cursor-pointer shadow-md disabled:opacity-50"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>
                    {importMutation.isPending ? 'Importing Leads...' : `Import Selected (${selectedPlaceIds.length})`}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
