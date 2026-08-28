'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  Building2,
  Users,
  Layers,
  Sparkles,
  RefreshCw,
  TrendingUp,
  Search,
  Filter,
  Calendar,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export default function CustomerUsageAnalyticsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  const {
    data: consumptionResponse,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['customers-resource-consumption', searchTerm, statusFilter, dateFrom, dateTo, page],
    queryFn: async () => {
      const params: any = {
        page,
        limit,
      };
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;

      const res: any = await api.get('/customers/resource-consumption', { params });
      return res?.data || res;
    },
    staleTime: 30000,
  });

  const summary = consumptionResponse?.summary || {
    totalAllocatedSeats: 0,
    totalMaxSeats: 0,
    overallSeatUtilization: '0.0%',
    totalLeads: 0,
    totalStorageBytes: 0,
    totalStorage: '0.0 MB',
    totalCustomers: 0,
    activeCustomers: 0,
  };

  const customers: any[] = consumptionResponse?.items || [];
  const pagination = consumptionResponse?.pagination || {
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('ALL');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-16 text-slate-800 animate-in fade-in-50 duration-200">
      {/* 1. HERO HEADER */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#23C45E]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full bg-[#23C45E]/20 text-[#23C45E] border border-[#23C45E]/30 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" />
                Resource & Seat Analytics
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Customer Resource Consumption</h1>
            <p className="text-slate-300 text-xs sm:text-sm font-medium max-w-2xl">
              Monitor multi-tenant seat utilization, storage consumption, CRM lead records, and workload metrics across all organizations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => refetch()}
              disabled={isLoading || isFetching}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white font-bold rounded-2xl text-xs transition-all cursor-pointer border border-white/10 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 text-[#23C45E] ${isFetching ? 'animate-spin' : ''}`} />
              <span>{isFetching ? 'Syncing...' : 'Sync Metrics'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. KPI STAT CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">Allocated Seats</p>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
              {isLoading ? '...' : summary.totalAllocatedSeats.toLocaleString()}
            </p>
            <p className="text-[10px] text-slate-400 font-bold mt-1">
              Across {summary.totalCustomers} total tenant{summary.totalCustomers === 1 ? '' : 's'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">Total Leads</p>
            <p className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">
              {isLoading ? '...' : summary.totalLeads.toLocaleString()}
            </p>
            <p className="text-[10px] text-emerald-700 font-bold mt-1">Customer CRM records</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">Total Storage</p>
            <p className="text-2xl sm:text-3xl font-black text-indigo-600 mt-1">
              {isLoading ? '...' : summary.totalStorage}
            </p>
            <p className="text-[10px] text-indigo-700 font-bold mt-1">Database & Attachments</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">Seat Utilization</p>
            <p className="text-2xl sm:text-3xl font-black text-purple-600 mt-1">
              {isLoading ? '...' : summary.overallSeatUtilization}
            </p>
            <p className="text-[10px] text-purple-700 font-bold mt-1">Active seat ratio ({summary.activeCustomers} active)</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 3. FILTERS & SEARCH BAR */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1 flex flex-wrap items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              placeholder="Search by customer, company, domain, or email..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#23C45E] focus:bg-white transition-all text-slate-900"
            />
          </div>

          {/* Status Dropdown */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-[#23C45E]"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive Only</option>
            </select>
          </div>

          {/* Date From */}
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
              className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-[#23C45E]"
            />
            <span className="text-xs text-slate-400 font-bold">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(1);
              }}
              className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-[#23C45E]"
            />
          </div>
        </div>

        {(searchTerm || statusFilter !== 'ALL' || dateFrom || dateTo) && (
          <button
            onClick={handleResetFilters}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors underline cursor-pointer self-start md:self-auto"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* 4. ERROR STATE */}
      {isError && (
        <div className="bg-red-50 border border-red-200 rounded-3xl p-6 flex items-center justify-between text-red-800">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <div>
              <p className="font-black text-sm">Failed to load resource consumption analytics</p>
              <p className="text-xs text-red-600 mt-0.5">
                {(error as any)?.message || 'Please check your connection and try again.'}
              </p>
            </div>
          </div>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* 5. TENANT CAPACITY & UTILIZATION LIST */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black text-slate-900">Tenant Capacity & Utilization</h3>
          <span className="text-xs font-bold text-slate-400">
            Showing {customers.length} of {pagination.total} tenant{pagination.total === 1 ? '' : 's'}
          </span>
        </div>

        {/* LOADING SKELETON */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3 animate-pulse">
                <div className="flex justify-between items-center">
                  <div className="h-4 bg-slate-200 rounded-md w-48" />
                  <div className="h-4 bg-slate-200 rounded-md w-24" />
                </div>
                <div className="h-2.5 bg-slate-200 rounded-full w-full" />
              </div>
            ))}
          </div>
        )}

        {/* EMPTY STATE */}
        {!isLoading && !isError && customers.length === 0 && (
          <div className="py-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Building2 className="w-6 h-6" />
            </div>
            <p className="text-sm font-black text-slate-700">No customer resource consumption data found</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {searchTerm || statusFilter !== 'ALL' || dateFrom || dateTo
                ? 'Try adjusting your search filters or date range.'
                : 'Customer organizations and their resource usage metrics will appear here.'}
            </p>
          </div>
        )}

        {/* REAL TENANT DATA LIST */}
        {!isLoading && !isError && customers.length > 0 && (
          <div className="space-y-4">
            {customers.map((c) => {
              const maxSeats = c.maxUsers || 50;
              const seatPct = Math.min(100, Math.round(((c.users || 0) / maxSeats) * 100));

              return (
                <div key={c.id} className="p-4 bg-slate-50 hover:bg-slate-100/70 rounded-2xl border border-slate-100 space-y-3 transition-all">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/customers/${c.id}`}
                        className="font-black text-slate-900 text-sm hover:text-[#23C45E] transition-colors"
                      >
                        {c.name}
                      </Link>
                      {c.domain && c.domain !== 'N/A' && (
                        <span className="text-slate-400 font-mono text-[11px]">({c.domain})</span>
                      )}
                      <span className="px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700 text-[10px] font-bold">
                        {c.planName}
                      </span>
                      {c.isActive ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Active
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 text-[10px] font-bold flex items-center gap-1">
                          <XCircle className="w-3 h-3" /> Inactive
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-slate-600 font-semibold text-[11px]">
                      <span title="Active User Seats">
                        <Users className="w-3.5 h-3.5 inline mr-1 text-blue-500" />
                        <strong className="text-slate-900">{c.users || 0}</strong> / {maxSeats} Seats ({seatPct}%)
                      </span>
                      <span title="CRM Leads">
                        <Sparkles className="w-3.5 h-3.5 inline mr-1 text-emerald-500" />
                        <strong className="text-slate-900">{c.leads || 0}</strong> / {c.maxLeads || 500} Leads
                      </span>
                      <span title="Storage Used">
                        <Layers className="w-3.5 h-3.5 inline mr-1 text-indigo-500" />
                        <strong className="text-slate-900">{c.storage}</strong> / {c.maxStorage}
                      </span>
                    </div>
                  </div>

                  {/* CAPACITY PROGRESS BAR */}
                  <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        seatPct >= 90
                          ? 'bg-red-500'
                          : seatPct >= 75
                          ? 'bg-amber-500'
                          : 'bg-[#23C45E]'
                      }`}
                      style={{ width: `${seatPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 6. PAGINATION CONTROLS */}
        {!isLoading && !isError && pagination.totalPages > 1 && (
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500">
              Page {pagination.page} of {pagination.totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page >= pagination.totalPages}
                className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
