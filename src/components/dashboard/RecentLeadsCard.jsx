'use client';

import * as React from 'react';
import {
  Target,
  Search,
  ArrowUpRight,
  User,
  Building,
  Calendar,
  Phone,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';
import Link from 'next/link';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Input } from '@/components/common/Input';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export function RecentLeadsCard({ recentLeads = [], loading }) {
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('ALL');
  const [sortField, setSortField] = React.useState('createdAt');
  const [sortOrder, setSortOrder] = React.useState('desc');
  const [currentPage, setCurrentPage] = React.useState(1);
  const pageSize = 5;

  const filteredLeads = React.useMemo(() => {
    const list = Array.isArray(recentLeads) ? recentLeads : [];
    return list
      .filter((lead) => {
        const name = `${lead.firstName || ''} ${lead.lastName || ''} ${lead.title || ''}`.toLowerCase();
        const company = (lead.companyName || lead.company?.name || '').toLowerCase();
        const source = (lead.source || '').toLowerCase();
        const matchesSearch =
          !search ||
          name.includes(search.toLowerCase()) ||
          company.includes(search.toLowerCase()) ||
          source.includes(search.toLowerCase());

        const status = String(lead.status || '').toUpperCase();
        const matchesStatus = statusFilter === 'ALL' || status === statusFilter;

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];
        if (sortField === 'name') {
          valA = `${a.firstName || ''} ${a.lastName || ''}`;
          valB = `${b.firstName || ''} ${b.lastName || ''}`;
        }
        if (!valA) return 1;
        if (!valB) return -1;
        if (typeof valA === 'string') {
          return sortOrder === 'asc'
            ? valA.localeCompare(valB)
            : valB.localeCompare(valA);
        }
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      });
  }, [recentLeads, search, statusFilter, sortField, sortOrder]);

  const totalPages = Math.ceil(filteredLeads.length / pageSize) || 1;
  const paginatedLeads = filteredLeads.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

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
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs hover:border-emerald-950/20 transition-all duration-300">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-50 text-[#163A2E]">
            <Target className="size-4" />
          </span>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              Recent Leads
            </h2>
            <p className="text-xs text-slate-500">Latest pipeline acquisitions</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search Box */}
          <div className="relative min-w-[200px] flex-1 sm:flex-initial">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search leads..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50/50 pl-8 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#163A2E]"
            />
          </div>

          <Link
            href="/admin/crm/leads"
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-[#163A2E] hover:bg-slate-50 transition-colors"
          >
            View all <ArrowUpRight className="size-3.5" />
          </Link>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {['ALL', 'NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'LOST'].map((status) => (
          <button
            key={status}
            onClick={() => {
              setStatusFilter(status);
              setCurrentPage(1);
            }}
            className={cn(
              'rounded-md px-2.5 py-1 text-[11px] font-semibold transition-all whitespace-nowrap',
              statusFilter === status
                ? 'bg-[#163A2E] text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
            )}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="mt-4 hidden md:block overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <th
                className="pb-3 cursor-pointer hover:text-slate-700"
                onClick={() => toggleSort('name')}
              >
                <div className="flex items-center gap-1">
                  Lead Name <ArrowUpDown className="size-3" />
                </div>
              </th>
              <th className="pb-3">Company</th>
              <th className="pb-3">Source</th>
              <th className="pb-3">Status</th>
              <th className="pb-3">Assigned Staff</th>
              <th
                className="pb-3 text-right cursor-pointer hover:text-slate-700"
                onClick={() => toggleSort('createdAt')}
              >
                <div className="flex items-center justify-end gap-1">
                  Created Date <ArrowUpDown className="size-3" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedLeads.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400">
                  No leads found matching your criteria.
                </td>
              </tr>
            ) : (
              paginatedLeads.map((lead) => {
                const leadName =
                  `${lead.firstName || ''} ${lead.lastName || ''}`.trim() ||
                  lead.title ||
                  'Unnamed Lead';
                const company = lead.companyName || lead.company?.name || '—';
                const assigned =
                  lead.assignedTo?.name ||
                  lead.assignedTo?.fullName ||
                  lead.employee?.firstName ||
                  'Unassigned';
                const createdDate = lead.createdAt
                  ? new Date(lead.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })
                  : '—';

                return (
                  <tr
                    key={lead.id}
                    className="hover:bg-slate-50/70 transition-colors group"
                  >
                    <td className="py-3 font-semibold text-slate-900">
                      <Link
                        href={`/admin/crm/leads`}
                        className="hover:text-[#163A2E] hover:underline"
                      >
                        {leadName}
                      </Link>
                      {lead.phone && (
                        <p className="text-[10px] text-slate-400 font-normal">{lead.phone}</p>
                      )}
                    </td>
                    <td className="py-3 text-slate-600">{company}</td>
                    <td className="py-3">
                      <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                        {lead.source || 'Direct'}
                      </span>
                    </td>
                    <td className="py-3">
                      <StatusBadge status={lead.status || 'NEW'} />
                    </td>
                    <td className="py-3 text-slate-600 flex items-center gap-1.5">
                      <User className="size-3 text-slate-400" />
                      <span className="truncate max-w-[130px]">{assigned}</span>
                    </td>
                    <td className="py-3 text-right text-slate-500 font-medium">
                      {createdDate}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Responsive Cards */}
      <div className="mt-3 block md:hidden space-y-2.5">
        {paginatedLeads.length === 0 ? (
          <p className="py-6 text-center text-xs text-slate-400">
            No leads found matching your criteria.
          </p>
        ) : (
          paginatedLeads.map((lead) => {
            const leadName =
              `${lead.firstName || ''} ${lead.lastName || ''}`.trim() ||
              lead.title ||
              'Unnamed Lead';
            const company = lead.companyName || lead.company?.name || '—';
            const createdDate = lead.createdAt
              ? new Date(lead.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                })
              : '—';

            return (
              <div
                key={lead.id}
                className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-slate-900 text-xs">{leadName}</p>
                    <p className="text-[11px] text-slate-500">{company}</p>
                  </div>
                  <StatusBadge status={lead.status || 'NEW'} />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/50">
                  <span className="rounded bg-white border border-slate-200 px-1.5 py-0.5 text-[10px]">
                    {lead.source || 'Direct'}
                  </span>
                  <span>{createdDate}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination Footer */}
      {filteredLeads.length > pageSize && (
        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
          <span>
            Showing {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, filteredLeads.length)} of{' '}
            {filteredLeads.length} leads
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="rounded-lg border border-slate-200 p-1 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="px-2 font-bold text-slate-800">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="rounded-lg border border-slate-200 p-1 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
