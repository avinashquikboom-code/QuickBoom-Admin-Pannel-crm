'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock3,
  Database,
  History,
  LoaderCircle,
  MapPin,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '@/lib/api';
import { useEmployeeAuthStore } from '@/lib/employee-store';
import { hasPermission } from '@/lib/access-control';
import { getErrorMessage } from '@/lib/utils';

interface CaptureUsage {
  totalExtractions?: number;
  totalLeadsCaptured?: number;
  totalGoogleApiCalls?: number;
  totalSearches?: number;
  searches?: number;
  quotaLimit?: number;
  quotaRemaining?: number;
}

interface CapturePlace {
  id: number;
}

interface CaptureJob {
  jobId: string;
  keyword: string;
  location: string;
  requestedResults?: number;
  capturedResults?: number;
  createdAt?: string;
  places?: CapturePlace[];
}

export default function EmployeeDataCapturePage() {
  const user = useEmployeeAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const [isCaptureOpen, setIsCaptureOpen] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [location, setLocation] = useState('');
  const [maxResults, setMaxResults] = useState('20');

  const canView = hasPermission(user, [
    'DATA_CAPTURE:VIEW',
    'employee.data_capture.view',
    'data_capture.view',
  ]);
  const canCreate = hasPermission(user, [
    'DATA_CAPTURE:CREATE',
    'employee.data_capture.create',
    'data_capture.create',
  ]);

  const usageQuery = useQuery<CaptureUsage>({
    queryKey: ['data-capture-usage'],
    enabled: canView,
    queryFn: async () => {
      const response: any = await api.get('/data-capture/usage');
      const usage = response?.data ?? response;
      if (!usage || typeof usage !== 'object' || Array.isArray(usage)) {
        throw new Error('The Data Capture usage response was invalid.');
      }
      return usage;
    },
  });

  const jobsQuery = useQuery<CaptureJob[]>({
    queryKey: ['data-capture-jobs'],
    enabled: canView,
    queryFn: async () => {
      const response: any = await api.get('/data-capture/jobs');
      const jobs = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response?.items)
            ? response.items
            : null;
      if (!jobs) {
        throw new Error('The Data Capture history response was invalid.');
      }
      return jobs;
    },
  });

  const captureMutation = useMutation({
    mutationFn: async () => {
      if (!keyword.trim() || !location.trim()) {
        throw new Error('Enter both a search term and location.');
      }

      return api.post('/data-capture/extract', {
        keyword: keyword.trim(),
        location: location.trim(),
        maxResults: Number.parseInt(maxResults, 10) || 20,
      });
    },
    onSuccess: (response: any) => {
      const result = response?.data ?? response;
      toast.success(result?.message || 'Capture completed successfully.');
      setIsCaptureOpen(false);
      setKeyword('');
      setLocation('');
      void queryClient.invalidateQueries({ queryKey: ['data-capture-usage'] });
      void queryClient.invalidateQueries({ queryKey: ['data-capture-jobs'] });
      void queryClient.invalidateQueries({ queryKey: ['data-capture-list'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  if (!canView) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-xl items-center justify-center">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <Database className="mx-auto h-10 w-10 text-slate-400" />
          <h1 className="mt-4 text-lg font-bold text-slate-900">Access unavailable</h1>
          <p className="mt-2 text-sm text-slate-600">
            You do not have permission to view Data Capture.
          </p>
        </div>
      </div>
    );
  }

  const usage = usageQuery.data;
  const jobs = jobsQuery.data ?? [];
  const quotaLimit = Math.max(0, Number(usage?.quotaLimit ?? 0));
  const quotaRemaining = Math.max(0, Number(usage?.quotaRemaining ?? 0));
  const quotaUsed = Math.max(0, quotaLimit - quotaRemaining);
  const usagePercent = quotaLimit > 0 ? Math.min(100, (quotaUsed / quotaLimit) * 100) : 0;
  const searches = Number(usage?.totalSearches ?? usage?.searches ?? 0);
  const dashboardError = usageQuery.error || jobsQuery.error;

  const refreshDashboard = () => {
    void Promise.all([usageQuery.refetch(), jobsQuery.refetch()]);
  };

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 pb-12">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            Data Capture
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Discover businesses and manage your Google Places captures.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/employee/data-capture/history"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:border-emerald-200 hover:text-emerald-700"
          >
            <History className="h-4 w-4" />
            History
          </Link>
          <button
            type="button"
            onClick={refreshDashboard}
            disabled={usageQuery.isFetching || jobsQuery.isFetching}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                usageQuery.isFetching || jobsQuery.isFetching ? 'animate-spin' : ''
              }`}
            />
            Refresh
          </button>
        </div>
      </header>

      {dashboardError && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 sm:flex-row sm:items-center sm:justify-between"
        >
          <span>{getErrorMessage(dashboardError)}</span>
          <button
            type="button"
            onClick={refreshDashboard}
            className="font-bold underline underline-offset-2"
          >
            Try again
          </button>
        </div>
      )}

      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-700 via-emerald-600 to-green-500 p-6 text-white shadow-lg shadow-emerald-900/10 sm:p-9">
        <div className="absolute -right-12 -top-16 h-64 w-64 rounded-full border-[32px] border-white/10" />
        <div className="absolute -bottom-24 right-1/4 h-56 w-56 rounded-full bg-white/5" />
        <div className="relative max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[11px] font-extrabold tracking-[0.16em] text-emerald-50">
            <Search className="h-3.5 w-3.5" />
            GOOGLE PLACES LEAD CAPTURE
          </div>
          <h2 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">
            Find Businesses &amp; Prospects
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-50 sm:text-base">
            Find verified businesses and extract prospective leads directly from Google Places
            into your CRM pipeline.
          </p>
          {canCreate && (
            <button
              type="button"
              onClick={() => setIsCaptureOpen(true)}
              className="mt-7 inline-flex items-center gap-2.5 rounded-xl bg-white px-5 py-3 text-sm font-extrabold text-emerald-800 shadow-md transition hover:bg-emerald-50 focus:outline-none focus:ring-4 focus:ring-white/30"
            >
              <Search className="h-4 w-4" />
              Start New Capture
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="absolute right-8 top-1/2 hidden h-28 w-28 -translate-y-1/2 items-center justify-center rounded-3xl border border-white/20 bg-white/10 shadow-inner lg:flex">
          <Search className="h-12 w-12 text-white/90" strokeWidth={1.5} />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[11px] font-black tracking-[0.14em] text-emerald-700">
              SUBSCRIPTION USAGE
            </p>
            <h2 className="mt-1 text-lg font-extrabold text-slate-900">Data Capture Quota</h2>
          </div>
          <div className="rounded-full border border-emerald-100 bg-emerald-50 px-3.5 py-2 text-sm font-extrabold text-emerald-800">
            {usageQuery.isLoading ? 'Loading quota…' : `${quotaRemaining.toLocaleString()} Leads Left`}
          </div>
        </div>
        <div
          className="mt-6 h-3 overflow-hidden rounded-full bg-slate-100"
          role="progressbar"
          aria-label="Data Capture quota used"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(usagePercent)}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-green-400 transition-all"
            style={{ width: `${usagePercent}%` }}
          />
        </div>
        <div className="mt-3 flex flex-col gap-1 text-xs font-semibold text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>
            Used: {quotaUsed.toLocaleString()} / {quotaLimit.toLocaleString()}
          </span>
          <span>{Math.round(usagePercent)}% consumed</span>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Total Captured"
          value={usage?.totalLeadsCaptured}
          icon={Database}
          tone="emerald"
          loading={usageQuery.isLoading}
        />
        <StatCard
          label="Extractions"
          value={usage?.totalExtractions}
          icon={CheckCircle2}
          tone="blue"
          loading={usageQuery.isLoading}
        />
        <StatCard
          label="Searches"
          value={searches}
          icon={Activity}
          tone="violet"
          loading={usageQuery.isLoading}
        />
      </section>

      <section className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">Recent Captures</h2>
            <p className="text-xs font-medium text-slate-500">
              Latest Google Places extraction batches
            </p>
          </div>
          <Link
            href="/employee/data-capture/history"
            className="inline-flex items-center gap-1.5 text-sm font-extrabold text-emerald-700 transition hover:text-emerald-800"
          >
            View All ({Number(usage?.totalExtractions ?? jobs.length).toLocaleString()})
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {jobsQuery.isLoading ? (
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-10 text-sm font-semibold text-slate-500">
            <LoaderCircle className="h-5 w-5 animate-spin text-emerald-600" />
            Loading recent captures…
          </div>
        ) : jobs.length === 0 && !jobsQuery.isError ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center">
            <Database className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-3 text-sm font-bold text-slate-700">No captures yet</p>
            <p className="mt-1 text-xs text-slate-500">
              Your Google Places extraction batches will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.slice(0, 5).map((job) => (
              <article
                key={job.jobId}
                className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-emerald-200 sm:flex-row sm:items-center sm:justify-between sm:p-5"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate font-extrabold text-slate-900">{job.keyword}</h3>
                    <p className="mt-1 flex items-center gap-1 truncate text-xs font-medium text-slate-500">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      {job.location}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-3 text-xs sm:border-0 sm:pt-0">
                  <span className="font-bold text-slate-600">
                    Captured: {Number(job.capturedResults ?? job.places?.length ?? 0).toLocaleString()}
                  </span>
                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-slate-400">
                    <Clock3 className="h-3.5 w-3.5" />
                    {job.createdAt && !Number.isNaN(new Date(job.createdAt).getTime())
                      ? new Date(job.createdAt).toLocaleDateString()
                      : '—'}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {isCaptureOpen && canCreate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsCaptureOpen(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-capture-title"
            className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl sm:p-7"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="new-capture-title" className="text-xl font-black text-slate-900">
                  Start New Capture
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Search Google Places for businesses and prospects.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCaptureOpen(false)}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close capture form"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              className="mt-6 space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                captureMutation.mutate();
              }}
            >
              <label className="block space-y-1.5">
                <span className="text-xs font-bold text-slate-700">Search term</span>
                <input
                  required
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder="e.g. cafes, accountants"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs font-bold text-slate-700">Location</span>
                <input
                  required
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  placeholder="City, region, or address"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs font-bold text-slate-700">Maximum results</span>
                <input
                  required
                  type="number"
                  min={1}
                  value={maxResults}
                  onChange={(event) => setMaxResults(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </label>
              <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setIsCaptureOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={captureMutation.isPending}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-extrabold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {captureMutation.isPending ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  {captureMutation.isPending ? 'Capturing…' : 'Search Google Places'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
  loading,
}: {
  label: string;
  value: number | undefined;
  icon: LucideIcon;
  tone: 'emerald' | 'blue' | 'violet';
  loading: boolean;
}) {
  const toneStyles = {
    emerald: 'bg-emerald-50 text-emerald-700',
    blue: 'bg-blue-50 text-blue-700',
    violet: 'bg-violet-50 text-violet-700',
  };

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-slate-500">{label}</p>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${toneStyles[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-5 text-3xl font-black tracking-tight text-slate-900">
        {loading ? '—' : Number(value ?? 0).toLocaleString()}
      </p>
    </article>
  );
}
