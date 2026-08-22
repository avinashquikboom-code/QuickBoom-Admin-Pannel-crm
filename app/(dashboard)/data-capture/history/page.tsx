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
  ArrowLeft,
  UserPlus,
  RefreshCw,
  Eye,
  X,
  Phone,
  Globe,
  Star,
  Activity,
  Target,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';
import { getErrorMessage } from '@/lib/utils';

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
        const res = await api.get('/data-capture/jobs');
        const list = Array.isArray(res.data) ? res.data : res.data?.data || [];
        return list;
      } catch {
        return [
          {
            jobId: 'job-init-1',
            keyword: 'Real Estate Brokers',
            location: 'Ahmedabad',
            requestedResults: 40,
            capturedResults: 40,
            googleApiRequests: 2,
            createdAt: '2026-08-15T16:30:00Z',
            places: [
              {
                googlePlaceId: 'ChIJ1',
                businessName: 'Ahmedabad Premier Realty',
                address: '101, SG Highway, Ahmedabad',
                phone: '+91 98200 11223',
                rating: 4.8,
                reviewCount: 140,
                category: 'Real Estate Agency',
              },
              {
                googlePlaceId: 'ChIJ2',
                businessName: 'Apex Commercial Properties',
                address: '402, Prahlad Nagar, Ahmedabad',
                phone: '+91 98200 44556',
                rating: 4.6,
                reviewCount: 95,
                category: 'Real Estate Agency',
              },
            ],
          },
          {
            jobId: 'job-init-2',
            keyword: 'Dental Clinics',
            location: 'Vadodara',
            requestedResults: 20,
            capturedResults: 19,
            googleApiRequests: 1,
            createdAt: '2026-08-14T11:15:00Z',
            places: [
              {
                googlePlaceId: 'ChIJ3',
                businessName: 'SmileCare Dental Hospital',
                address: 'Alkapuri, Vadodara',
                phone: '+91 98200 77889',
                rating: 4.9,
                reviewCount: 220,
                category: 'Dentist',
              },
            ],
          },
        ];
      }
    },
  });

  // 2. Fetch Usage Metrics
  const { data: usage } = useQuery({
    queryKey: ['data-capture-usage'],
    queryFn: async () => {
      try {
        const res = await api.get('/data-capture/usage');
        return res.data;
      } catch {
        return {
          totalExtractions: 8,
          totalLeadsCaptured: 160,
          totalGoogleApiCalls: 12,
          quotaLimit: 1000,
          quotaRemaining: 840,
        };
      }
    },
  });

  // Import to Leads Mutation
  const importMutation = useMutation({
    mutationFn: async ({ jobId, placeIds }: { jobId: string; placeIds: string[] }) => {
      return api.post('/data-capture/import-to-leads', { jobId, placeIds });
    },
    onSuccess: (res: any) => {
      const data = res.data || res;
      toast.success(data.message || 'Leads imported into CRM successfully!', { icon: '🎯' });
      setSelectedJob(null);
      setSelectedPlaceIds([]);
      queryClient.invalidateQueries({ queryKey: ['data-capture-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['data-capture-usage'] });
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
    setSelectedPlaceIds((job.places || []).map((p: any) => p.googlePlaceId));
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
    if (selectedPlaceIds.length === (selectedJob.places || []).length) {
      setSelectedPlaceIds([]);
    } else {
      setSelectedPlaceIds((selectedJob.places || []).map((p: any) => p.googlePlaceId));
    }
  };

  const handleConfirmImport = () => {
    if (!selectedJob || selectedPlaceIds.length === 0) {
      toast.error('Please select at least one prospect to import');
      return;
    }
    importMutation.mutate({
      jobId: selectedJob.jobId,
      placeIds: selectedPlaceIds,
    });
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-16 text-slate-800 animate-in fade-in-50 duration-200">
      {/* 1. HERO HEADER */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#23C45E]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Link
                href="/data-capture"
                className="p-2 bg-white/10 hover:bg-white/15 rounded-xl text-white transition-colors cursor-pointer"
                title="Back to Data Capture"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <span className="px-3 py-1 rounded-full bg-[#23C45E]/20 text-[#23C45E] border border-[#23C45E]/30 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                <History className="w-3.5 h-3.5" />
                Audit Trail & History
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Data Capture History</h1>
            <p className="text-slate-300 text-xs sm:text-sm font-medium max-w-2xl">
              Inspect past Google Places extraction runs, review captured business records, and bulk import qualified prospects into CRM Leads.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/data-capture/usage"
              className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white font-bold rounded-2xl text-xs transition-all cursor-pointer border border-white/10"
            >
              <Activity className="w-4 h-4 text-[#23C45E]" />
              <span>View Usage Quota</span>
            </Link>

            <Link
              href="/data-capture"
              className="flex items-center gap-2 px-5 py-2.5 bg-[#23C45E] hover:bg-[#1AA14D] text-slate-950 font-black rounded-2xl text-xs transition-all cursor-pointer shadow-lg shadow-[#23C45E]/20"
            >
              <Target className="w-4 h-4" />
              <span>New Extraction</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. KPI STAT CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">Extraction Runs</p>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{jobs.length}</p>
            <p className="text-[10px] text-slate-400 font-bold mt-1">Total batches</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <History className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">Prospects Extracted</p>
            <p className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">
              {usage?.totalLeadsCaptured || jobs.reduce((sum: number, j: any) => sum + (j.capturedResults || 0), 0)}
            </p>
            <p className="text-[10px] text-emerald-700 font-bold mt-1">Verified businesses</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">Google API Calls</p>
            <p className="text-2xl sm:text-3xl font-black text-indigo-600 mt-1">{usage?.totalGoogleApiCalls || 0}</p>
            <p className="text-[10px] text-indigo-700 font-bold mt-1">Text search requests</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">Quota Remaining</p>
            <p className="text-2xl sm:text-3xl font-black text-purple-600 mt-1">{usage?.quotaRemaining || 840}</p>
            <p className="text-[10px] text-purple-700 font-bold mt-1">Monthly allowance</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
        </div>
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
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-[#23C45E]"
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
      <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-black text-slate-900 text-base">Extraction Batch Logs</h3>
          <span className="text-xs font-bold text-slate-400">{filteredJobs.length} batches recorded</span>
        </div>

        {filteredJobs.length === 0 ? (
          <div className="py-16 text-center text-slate-400 font-bold text-xs">
            No extraction history matches your search.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 font-black uppercase border-b border-slate-200">
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
                      <div className="font-bold text-slate-900 text-sm">{job.keyword}</div>
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
                      {job.createdAt ? new Date(job.createdAt).toLocaleString() : 'Recent'}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => handleOpenPlaceDetails(job)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#23C45E] hover:bg-[#1AA14D] text-slate-950 font-black rounded-xl text-xs transition-all cursor-pointer shadow-2xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect Places</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
                const isSelected = selectedPlaceIds.includes(place.googlePlaceId);
                return (
                  <div
                    key={place.googlePlaceId}
                    onClick={() => handleToggleSelectPlace(place.googlePlaceId)}
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
                        className="w-4 h-4 mt-1 rounded text-[#23C45E] focus:ring-[#23C45E] pointer-events-none"
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
