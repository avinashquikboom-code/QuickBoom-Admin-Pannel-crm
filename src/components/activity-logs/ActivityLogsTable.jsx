'use client';

import * as React from 'react';
import {
  Clock,
  RotateCw,
  FileSpreadsheet,
  Eye,
  Building,
  User,
  Shield,
  Layers,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { AdminRowActions } from '@/components/common/AdminRowActions';

function getActionBadgeStyle(action = '') {
  const act = String(action || '').toUpperCase();
  if (act.includes('CREATE') || act.includes('ADD') || act.includes('INSERT')) {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200/90';
  }
  if (act.includes('UPDATE') || act.includes('EDIT') || act.includes('PATCH') || act.includes('MODIFY')) {
    return 'bg-blue-50 text-blue-700 border-blue-200/90';
  }
  if (act.includes('DELETE') || act.includes('REMOVE') || act.includes('PURGE')) {
    return 'bg-rose-50 text-rose-700 border-rose-200/90';
  }
  return 'bg-slate-100 text-slate-700 border-slate-200/90';
}

function formatDate(val) {
  if (!val) return '—';
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return String(val).slice(0, 16).replace('T', ' ');
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return String(val).slice(0, 10);
  }
}

function formatTime(val) {
  if (!val) return '';
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '';
  }
}

export function ActivityLogsTable({
  logs = [],
  loading = false,
  error = '',
  onRetry,
  onViewDetail,
  className = '',
}) {
  return (
    <div className={`space-y-4 ${className}`}>
      {/* 1. Desktop & Tablet Contained Table */}
      <div className="hidden sm:block w-full overflow-x-auto min-w-0 rounded-t-2xl border border-slate-200/90 bg-white shadow-2xs">
        <table className="w-full text-left text-xs divide-y divide-slate-100">
          <thead className="bg-[#F7F9F8] text-[#527063] font-bold uppercase tracking-wider text-[11px]">
            <tr>
              <th className="px-5 py-3.5 whitespace-nowrap">When</th>
              <th className="px-5 py-3.5 whitespace-nowrap">Action</th>
              <th className="px-5 py-3.5 whitespace-nowrap">Module</th>
              <th className="px-5 py-3.5 whitespace-nowrap">User</th>
              <th className="px-5 py-3.5">Description</th>
              <th className="px-5 py-3.5 text-right whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-16 text-center text-slate-500">
                  <div className="flex items-center justify-center gap-2">
                    <RotateCw className="size-4 animate-spin text-[#163A2E]" />
                    <span>Loading audit records…</span>
                  </div>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-rose-600">
                  <div className="max-w-xs mx-auto space-y-2">
                    <p className="font-semibold">{error}</p>
                    {onRetry && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={onRetry}
                        className="h-8 text-xs border-rose-300"
                      >
                        Retry Loading
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-16 text-center text-slate-500">
                  <div className="max-w-xs mx-auto space-y-2">
                    <FileSpreadsheet className="size-8 mx-auto text-slate-300" />
                    <p className="font-semibold text-slate-700">No activity logs found</p>
                    <p className="text-xs text-slate-400">
                      No administrative actions match your current search and filters.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              logs.map((row) => {
                const dateStr = formatDate(row.createdAt || row.timestamp);
                const timeStr = formatTime(row.createdAt || row.timestamp);
                const userDisplay =
                  row.userName ||
                  row.user?.name ||
                  row.user?.email ||
                  (row.userId ? `User #${row.userId}` : 'System');

                return (
                  <tr
                    key={row.id || `${row.action}-${row.createdAt}`}
                    className="hover:bg-[#F8FBF9] transition-colors cursor-pointer"
                    onClick={() => onViewDetail && onViewDetail(row)}
                  >
                    {/* When Column */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900">{dateStr}</span>
                        {timeStr && (
                          <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                            <Clock className="size-3 text-slate-300" />
                            {timeStr}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Action Column */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getActionBadgeStyle(
                          row.action
                        )}`}
                      >
                        {row.action || 'MUTATION'}
                      </span>
                    </td>

                    {/* Module Column */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        {row.module || 'System'}
                      </span>
                    </td>

                    {/* User Column */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="flex size-6 items-center justify-center rounded-full bg-slate-100 text-slate-600 font-bold text-[10px] shrink-0">
                          {userDisplay.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-medium text-slate-800 truncate max-w-[150px]" title={userDisplay}>
                          {userDisplay}
                        </span>
                      </div>
                    </td>

                    {/* Description Column */}
                    <td className="px-5 py-3.5">
                      <p
                        className="text-slate-600 line-clamp-1 max-w-[280px] lg:max-w-[420px] truncate"
                        title={row.description}
                      >
                        {row.description || '—'}
                      </p>
                    </td>

                    {/* Actions Menu */}
                    <td
                      className="px-5 py-3.5 text-right whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <AdminRowActions
                        title={`Log #${row.id}`}
                        onView={() => onViewDetail && onViewDetail(row)}
                        viewLabel="View log details"
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 2. Mobile Responsive Cards View (sm:hidden) */}
      <div className="block sm:hidden space-y-3">
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-500">
            <RotateCw className="size-4 animate-spin text-[#163A2E] mx-auto mb-2" />
            <span>Loading activity records…</span>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-xs text-rose-700 space-y-2">
            <p className="font-semibold">{error}</p>
            {onRetry && (
              <Button size="sm" variant="outline" onClick={onRetry} className="h-7 text-xs border-rose-300">
                Retry
              </Button>
            )}
          </div>
        ) : logs.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-500 space-y-2">
            <FileSpreadsheet className="size-6 mx-auto text-slate-300" />
            <p className="font-semibold text-slate-700">No logs found</p>
          </div>
        ) : (
          logs.map((row) => {
            const dateStr = formatDate(row.createdAt || row.timestamp);
            const timeStr = formatTime(row.createdAt || row.timestamp);
            const userDisplay =
              row.userName ||
              row.user?.name ||
              row.user?.email ||
              (row.userId ? `User #${row.userId}` : 'System');

            return (
              <div
                key={row.id || `${row.action}-${row.createdAt}`}
                onClick={() => onViewDetail && onViewDetail(row)}
                className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs space-y-2.5 cursor-pointer active:bg-slate-50 transition-colors"
              >
                {/* Header: Action & Module */}
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${getActionBadgeStyle(
                      row.action
                    )}`}
                  >
                    {row.action || 'MUTATION'}
                  </span>
                  <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                    {row.module || 'System'}
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-800 line-clamp-2 leading-relaxed">
                  {row.description || '—'}
                </p>

                {/* Footer: User & Time */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="font-medium text-slate-700 truncate max-w-[140px]">
                    {userDisplay}
                  </span>
                  <div className="flex items-center gap-1 font-mono text-slate-400">
                    <Clock className="size-3" />
                    <span>{dateStr} {timeStr}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
