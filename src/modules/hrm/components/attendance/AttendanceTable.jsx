'use client';

import * as React from 'react';
import {
  CalendarCheck,
  Clock,
  Coffee,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  User,
} from 'lucide-react';
import { StatusBadge } from '@/components/common/StatusBadge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/common/Select';
import { Button } from '@/components/common/Button';

function getInitials(name) {
  if (!name) return 'EM';
  const parts = String(name).trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return String(name).slice(0, 2).toUpperCase();
}

export function AttendanceTable({ records = [] }) {
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);

  // Reset to page 1 if records change
  React.useEffect(() => {
    setPage(1);
  }, [records.length]);

  const totalPages = Math.max(1, Math.ceil(records.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, records.length);
  const currentRows = records.slice(startIndex, endIndex);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
      {records.length === 0 ? (
        <div className="p-16 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-emerald-50 text-[#107569] ring-1 ring-emerald-200/60">
            <CalendarCheck className="size-7" />
          </div>
          <h3 className="mt-4 text-base font-bold text-slate-800">
            No attendance records found
          </h3>
          <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
            No employee records match the selected date or search filters.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#E2E8E5] bg-[#F4F9F6] text-xs font-bold uppercase tracking-wider text-[#163A2E]">
                  <th className="py-3.5 pl-6 pr-4">Employee</th>
                  <th className="py-3.5 px-4">Punch In</th>
                  <th className="py-3.5 px-4">Punch Out</th>
                  <th className="py-3.5 px-4">Break Time</th>
                  <th className="py-3.5 px-4">Working Hours</th>
                  <th className="py-3.5 px-4">Late / Delay</th>
                  <th className="py-3.5 pl-4 pr-6 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentRows.map((rec, index) => {
                  const initials = getInitials(rec.employeeName);
                  const isPresent = rec.status === 'present';
                  return (
                    <tr
                      key={rec.employeeId || `emp-${index}`}
                      className="transition-colors hover:bg-slate-50/70"
                    >
                      {/* Employee Info */}
                      <td className="py-3.5 pl-6 pr-4">
                        <div className="flex items-center gap-3">
                          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100/70 text-xs font-bold text-[#107569] ring-1 ring-emerald-200/60">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 truncate">
                              {rec.employeeName}
                            </p>
                            <p className="text-[11px] font-mono text-slate-400">
                              {rec.employeeId} {rec.department ? `• ${rec.department}` : ''}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Punch In */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {rec.punchIn ? (
                          <div className="flex items-center gap-1.5 font-mono text-xs font-medium text-slate-800">
                            <span className="size-1.5 rounded-full bg-emerald-500 shrink-0" />
                            <span>{rec.punchIn}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 font-mono italic">—</span>
                        )}
                      </td>

                      {/* Punch Out */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {rec.punchOut ? (
                          <span className="font-mono text-xs font-medium text-slate-800">
                            {rec.punchOut}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 font-mono italic">—</span>
                        )}
                      </td>

                      {/* Break Time */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-xs text-slate-600 font-medium">
                          <Coffee className="size-3 text-slate-400" />
                          {rec.breakDuration || '0h 0m'}
                        </span>
                      </td>

                      {/* Working Hours */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="text-xs font-bold text-[#163A2E]">
                          {rec.workingHours || '0h 0m'}
                        </span>
                      </td>

                      {/* Late / Delay */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {rec.lateDuration ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            <AlertCircle className="size-3 text-amber-600" />
                            {rec.lateDuration}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 font-mono">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 pl-4 pr-6 text-right whitespace-nowrap">
                        <StatusBadge status={rec.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Footer with Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200/90 px-6 py-3.5 bg-slate-50/50 text-xs text-slate-500">
            <div>
              Showing <span className="font-semibold text-slate-700">{records.length > 0 ? startIndex + 1 : 0}</span> to{' '}
              <span className="font-semibold text-slate-700">{endIndex}</span> of{' '}
              <span className="font-semibold text-slate-700">{records.length}</span> records
            </div>

            <div className="flex items-center gap-3">
              {/* Rows per page */}
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">Rows per page:</span>
                <Select
                  value={String(pageSize)}
                  onValueChange={(val) => {
                    setPageSize(Number(val));
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="h-8 w-16 text-xs rounded-lg border-slate-200 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Prev / Next buttons */}
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="h-8 px-2 rounded-lg border-slate-200 text-slate-600 hover:text-[#107569] disabled:opacity-40"
                >
                  <ChevronLeft className="size-3.5" />
                  <span className="sr-only">Previous</span>
                </Button>

                <div className="flex items-center px-2 font-medium text-slate-700">
                  <span className="flex size-7 items-center justify-center rounded-lg bg-[#107569] text-white text-xs font-bold">
                    {currentPage}
                  </span>
                  <span className="mx-1 text-slate-400">/</span>
                  <span className="text-slate-600 font-semibold">{totalPages}</span>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="h-8 px-2 rounded-lg border-slate-200 text-slate-600 hover:text-[#107569] disabled:opacity-40"
                >
                  <ChevronRight className="size-3.5" />
                  <span className="sr-only">Next</span>
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
