'use client';

import * as React from 'react';
import { Target, Search, ArrowUpRight, User, Building, Calendar, Phone, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Input } from '@/components/common/Input';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export function RecentLeadsCard({ recentLeads = [], loading }) {
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('ALL');
  const [currentPage, setCurrentPage] = React.useState(1);
  const pageSize = 5;

  const filteredLeads = React.useMemo(() => {
    return recentLeads.filter((lead) => {
      const name = `${lead.firstName || ''} ${lead.lastName || ''} ${lead.title || ''}`.toLowerCase();
      const company = (lead.companyName || lead.company?.name || '').toLowerCase();
      const matchesSearch = !search || name.includes(search.toLowerCase()) || company.includes(search.toLowerCase());

      const status = String(lead.status || '').toUpperCase();
      const matchesStatus = statusFilter === 'ALL' || status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [recentLeads, search, statusFilter]);

  const totalPages = Math.ceil(filteredLeads.length / pageSize) || 1;
  const paginatedLeads = filteredLeads.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <Skeleton className="h-6 w-36 rounded-md" />
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>
        <div className="space-y-3 mt-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-12 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs hover:border-slate-300 transition-all duration-300">
      {/* Header with Title and Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
              <Target className="size-4" />
            </span>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              Recent Leads
            </h2>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">
              {filteredLeads.length}
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Latest captured prospects & pipeline statuses
          </p>
        </div>

        {/* Search, Filter & View All */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative min-w-[160px] sm:w-48">
            <Search className="absolute left-2.5 top-2.5 size-3.5 text-slate-400" />
            <Input
              type="text"
              placeholder="Search leads..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="h-8 pl-8 text-xs bg-slate-50 border-slate-200 rounded-lg focus:bg-white"
            />
          </div>

          <Link
            href="/admin/crm/leads"
            className="inline-flex items-center gap-1 rounded-lg bg-brand-light px-3 py-1.5 text-xs font-semibold text-brand-dark hover:bg-brand hover:text-white transition-colors"
          >
            View All Leads
            <ArrowUpRight className="size-3.5" />
          </Link>
        </div>
      </div>

      {/* Leads Content */}
      {paginatedLeads.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-3">
            <Target className="size-6" />
          </div>
          <p className="text-sm font-semibold text-slate-700">No leads found</p>
          <p className="text-xs text-slate-400 mt-1 max-w-xs">
            {search ? 'Try clearing your search query' : 'Leads captured via Data Capture or CRM will appear here'}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop / Tablet Table View */}
          <div className="hidden sm:block overflow-x-auto mt-2">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-3">Lead Name</th>
                  <th className="py-3 px-3">Company</th>
                  <th className="py-3 px-3">Source</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Assigned Staff</th>
                  <th className="py-3 px-3 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {paginatedLeads.map((lead) => {
                  const leadName =
                    lead.title ||
                    [lead.firstName, lead.lastName].filter(Boolean).join(' ') ||
                    'Untitled Lead';
                  const company = lead.companyName || lead.company?.name || '—';
                  const source = lead.source || 'Direct';
                  const assigned =
                    lead.assignedEmployee?.name ||
                    lead.assignedTo?.name ||
                    lead.employeeName ||
                    'Unassigned';
                  const dateStr = lead.createdAt
                    ? new Date(lead.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })
                    : '—';

                  return (
                    <tr
                      key={lead.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      <td className="py-3 px-3 font-semibold text-slate-900 group-hover:text-brand-dark">
                        <div className="flex items-center gap-2">
                          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-light text-[10px] font-bold text-brand-dark">
                            {leadName.charAt(0).toUpperCase()}
                          </span>
                          <span className="truncate max-w-[140px]">{leadName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-600 truncate max-w-[120px]">
                        {company}
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                          {source}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <StatusBadge status={String(lead.status || '').toLowerCase()} />
                      </td>
                      <td className="py-3 px-3 text-slate-600 truncate max-w-[120px]">
                        {assigned}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-400 font-medium">
                        {dateStr}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Layout (<640px) */}
          <div className="sm:hidden space-y-2.5 mt-3">
            {paginatedLeads.map((lead) => {
              const leadName =
                lead.title ||
                [lead.firstName, lead.lastName].filter(Boolean).join(' ') ||
                'Untitled Lead';
              const company = lead.companyName || lead.company?.name || '—';
              const assigned =
                lead.assignedEmployee?.name ||
                lead.assignedTo?.name ||
                lead.employeeName ||
                'Unassigned';

              return (
                <div
                  key={lead.id}
                  className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-slate-900 text-xs truncate">
                      {leadName}
                    </p>
                    <StatusBadge status={String(lead.status || '').toLowerCase()} />
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1 truncate">
                      <Building className="size-3 text-slate-400" />
                      {company}
                    </span>
                    <span className="flex items-center gap-1 truncate">
                      <User className="size-3 text-slate-400" />
                      {assigned}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500 mt-2">
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="rounded-md border border-slate-200 px-2.5 py-1 font-medium disabled:opacity-40 hover:bg-slate-50"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="rounded-md border border-slate-200 px-2.5 py-1 font-medium disabled:opacity-40 hover:bg-slate-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
