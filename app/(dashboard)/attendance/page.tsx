'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Clock,
  Calendar,
  Filter,
  Download,
  CheckCircle,
  AlertCircle,
  MapPin,
  Search,
  Check,
  X,
  FileCheck,
  Building2,
  Coffee,
  RefreshCw,
  Eye,
  Users,
} from 'lucide-react';
import api from '@/lib/api';
import { formatTimeIST, formatDurationHoursMinutes } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { AdminPagination } from '@/components/admin';

interface BreakSession {
  id: number;
  sessionNumber: number;
  breakStart: string | null;
  breakEnd: string | null;
  breakStartFormatted: string;
  breakEndFormatted: string;
  durationMinutes: number;
  durationFormatted: string;
  isOngoing: boolean;
}

interface AttendanceRecord {
  id: string;
  employeeName: string;
  employeeId: string;
  branch: string;
  office: string;
  date: string;
  punchIn: string;
  punchOut: string;
  punchInAt: string | null;
  punchOutAt: string | null;
  grossWorkingHours: string;
  workingHours: string;
  breaksCount: number;
  totalBreak: string;
  breakSessions: BreakSession[];
  status: string;
  location: string;
  isAutoCheckout?: boolean;
  isLate?: boolean;
  lateMinutes?: number;
  locationOut?: string | null;
}

export default function AttendancePage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [officeFilter, setOfficeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);

  // Fetch real offices
  const { data: officesData } = useQuery({
    queryKey: ['admin-attendance-offices'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/employees/hrm/offices');
        return Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      } catch {
        return [];
      }
    },
  });

  // Fetch real live attendance summary & office-wise breakdown
  const { data: liveData, isFetching: isLiveFetching, refetch: refetchLive } = useQuery({
    queryKey: ['admin-live-attendance-summary', officeFilter, selectedDate],
    queryFn: async () => {
      try {
        const params: Record<string, string> = {};
        if (officeFilter !== 'ALL') params.branch = officeFilter;
        if (selectedDate) params.date = selectedDate;
        const res: any = await api.get('/employees/hrm/live-attendance', { params });
        return res?.data || res;
      } catch {
        return null;
      }
    },
  });

  // Fetch real attendance logs
  const { data: attendanceResponse, isLoading, refetch: refetchLogs } = useQuery({
    queryKey: ['admin-hrm-attendance-logs', selectedDate, officeFilter, page, pageSize],
    queryFn: async () => {
      try {
        const params: Record<string, any> = { page, limit: pageSize };
        if (selectedDate) params.date = selectedDate;
        if (officeFilter !== 'ALL') params.branch = officeFilter;
        const res: any = await api.get('/employees/hrm/attendance', { params });
        const items = res?.data?.items || res?.data?.data || res?.items || res?.data || (Array.isArray(res) ? res : []);
        const pagination = res?.pagination || res?.meta || res?.data?.pagination || res?.data?.meta || {
          page,
          pageSize,
          total: Array.isArray(items) ? items.length : 0,
          totalPages: 1,
        };
        return {
          items: Array.isArray(items) ? items : [],
          pagination: {
            page: Number(pagination.page) || page,
            pageSize: Number(pagination.pageSize || pagination.limit) || pageSize,
            total: Number(pagination.total) || (Array.isArray(items) ? items.length : 0),
            totalPages: Number(pagination.totalPages) || 1,
          },
        };
      } catch {
        return { items: [], pagination: { page: 1, pageSize, total: 0, totalPages: 1 } };
      }
    },
  });

  const attendanceData = attendanceResponse?.items || [];
  const pagination = attendanceResponse?.pagination || { page: 1, pageSize: 20, total: 0, totalPages: 1 };

  const officesList: string[] = Array.isArray(officesData)
    ? Array.from(new Set(officesData.map((o: any) => (o.name || o.branch || String(o)).trim()).filter(Boolean) as string[]))
    : ['Head Office'];

  const summary = liveData?.summary || {
    totalEmployees: 0,
    presentCount: 0,
    onBreakCount: 0,
    onLeaveCount: 0,
    absentCount: 0,
    lateCount: 0,
    currentlyWorking: 0,
  };

  const rawOfficeBreakdown = Array.isArray(liveData?.offices) ? liveData.offices : [];
  // Group by canonical officeId or canonical name to ensure single card per office
  const officeBreakdownMap = new Map<string, any>();
  for (const off of rawOfficeBreakdown) {
    const key = off.officeId ? `id_${off.officeId}` : `name_${(off.officeName || off.name || '').trim().toLowerCase()}`;
    if (!officeBreakdownMap.has(key)) {
      officeBreakdownMap.set(key, { ...off });
    } else {
      const existing = officeBreakdownMap.get(key);
      existing.totalEmployees = (existing.totalEmployees || 0) + (off.totalEmployees || 0);
      existing.present = (existing.present || 0) + (off.present || 0);
      existing.onBreak = (existing.onBreak || 0) + (off.onBreak || 0);
      existing.onLeave = (existing.onLeave || 0) + (off.onLeave || 0);
      existing.absent = (existing.absent || 0) + (off.absent || 0);
    }
  }
  const officeBreakdown = Array.from(officeBreakdownMap.values());

  const records: AttendanceRecord[] = Array.isArray(attendanceData)
    ? attendanceData.map((a: any) => {
        const punchInFormatted = a.punchInFormatted || formatTimeIST(a.punchInAt || a.punchIn || a.punchInTime || a.checkIn, '—');
        const punchOutFormatted = a.punchOutFormatted || formatTimeIST(a.punchOutAt || a.punchOut || a.punchOutTime || a.checkOut, '—');
        const breakMins = a.totalBreakMinutes ?? (a.breaks ? a.breaks.reduce((acc: number, b: any) => acc + (b.duration || 0), 0) : 0);
        const netWorking = a.workingHours || a.netWorkingHours || formatDurationHoursMinutes(a.workingMinutes);
        const grossWorking = a.grossWorkingHours || formatDurationHoursMinutes(a.grossWorkingMinutes ?? (a.workingMinutes ? a.workingMinutes + breakMins : 0));

        const breakSessions: BreakSession[] = Array.isArray(a.breakSessions)
          ? a.breakSessions.map((b: any, idx: number) => ({
              id: b.id || idx + 1,
              sessionNumber: b.sessionNumber || idx + 1,
              breakStart: b.breakStart || null,
              breakEnd: b.breakEnd || null,
              breakStartFormatted: b.breakStartFormatted || formatTimeIST(b.breakStart, '—'),
              breakEndFormatted: b.breakEndFormatted || (b.breakEnd ? formatTimeIST(b.breakEnd, '—') : 'Active Break'),
              durationMinutes: b.durationMinutes ?? b.duration ?? 0,
              durationFormatted: b.durationFormatted || formatDurationHoursMinutes(b.durationMinutes ?? b.duration ?? 0),
              isOngoing: !b.breakEnd,
            }))
          : Array.isArray(a.breaks)
          ? a.breaks.map((b: any, idx: number) => ({
              id: b.id || idx + 1,
              sessionNumber: idx + 1,
              breakStart: b.breakStart || null,
              breakEnd: b.breakEnd || null,
              breakStartFormatted: formatTimeIST(b.breakStart, '—'),
              breakEndFormatted: b.breakEnd ? formatTimeIST(b.breakEnd, '—') : 'Active Break',
              durationMinutes: b.duration || 0,
              durationFormatted: formatDurationHoursMinutes(b.duration || 0),
              isOngoing: !b.breakEnd,
            }))
          : [];

        return {
          id: String(a.id),
          employeeName: a.employeeName || 'Employee',
          employeeId: a.employeeId || 'EMP-001',
          branch: a.branch || a.office || 'Head Office',
          office: a.branch || a.office || 'Head Office',
          date: a.attendanceDate || a.date || selectedDate,
          punchIn: punchInFormatted,
          punchOut: punchOutFormatted,
          punchInAt: a.punchInAt || null,
          punchOutAt: a.punchOutAt || null,
          grossWorkingHours: grossWorking,
          workingHours: netWorking,
          breaksCount: a.breaksCount ?? breakSessions.length,
          totalBreak: a.totalBreak || a.breakDuration || formatDurationHoursMinutes(breakMins),
          breakSessions,
          status: a.status || 'PRESENT',
          location: a.location || 'Office GPS',
          locationOut: a.locationOut || null,
          isAutoCheckout: Boolean(a.isAutoCheckout || (a.locationOut && a.locationOut.includes('Auto Check-out'))),
          isLate: Boolean(a.isLate),
          lateMinutes: a.lateMinutes || 0,
        };
      })
    : [];

  const filteredRecords = records.filter((r) => {
    const matchesSearch =
      r.employeeName.toLowerCase().includes(search.toLowerCase()) ||
      r.employeeId.toLowerCase().includes(search.toLowerCase()) ||
      r.branch.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === 'ALL' || r.status.toUpperCase() === statusFilter.toUpperCase();
    return matchesSearch && matchesStatus;
  });

  const handleRefresh = () => {
    refetchLive();
    refetchLogs();
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-16 text-slate-800 animate-in fade-in-50 duration-200">
      {/* 1. Top Hero Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-slate-700/60 shadow-xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-[#23C45E]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-[#23C45E] border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-[#23C45E] animate-pulse" />
                Live GPS & Punch Tracking
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Workforce Attendance
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-2xl leading-relaxed">
              Monitor real-time employee check-ins, active break sessions, branch movement, and daily timesheets.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white rounded-2xl border border-white/10 text-xs font-black transition-all cursor-pointer backdrop-blur-xs disabled:opacity-50 active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLiveFetching ? 'animate-spin text-[#23C45E]' : ''}`} />
              <span>Sync Live</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-extrabold text-slate-400 uppercase">Total Workforce</p>
            <p className="text-xl font-black text-slate-900">{summary.totalEmployees}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-100 bg-emerald-50/20 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-[10px] font-extrabold text-emerald-700 uppercase">Present / Working</p>
            <p className="text-xl font-black text-emerald-800">{summary.presentCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-100 bg-amber-50/20 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
            <Coffee className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-[10px] font-extrabold text-amber-700 uppercase">On Break (Active)</p>
            <p className="text-xl font-black text-amber-800">{summary.onBreakCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-purple-100 bg-purple-50/20 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
            <Calendar className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="text-[10px] font-extrabold text-purple-700 uppercase">On Leave</p>
            <p className="text-xl font-black text-purple-800">{summary.onLeaveCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-rose-100 bg-rose-50/20 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
            <AlertCircle className="w-5 h-5 text-rose-600" />
          </div>
          <div>
            <p className="text-[10px] font-extrabold text-rose-700 uppercase">Absent</p>
            <p className="text-xl font-black text-rose-800">{summary.absentCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-orange-100 bg-orange-50/20 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <p className="text-[10px] font-extrabold text-orange-700 uppercase">Late Check-ins</p>
            <p className="text-xl font-black text-orange-800">{summary.lateCount}</p>
          </div>
        </div>
      </div>

      {/* 3. Office-wise Attendance Breakdown */}
      {officeBreakdown.length > 0 && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-600" /> Office & Branch Attendance Distribution
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {officeBreakdown.map((off: any) => (
              <div
                key={off.officeId ? `off-${off.officeId}` : `off-${off.officeName}`}
                className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center justify-between"
              >
                <div>
                  <p className="font-bold text-slate-900 text-xs">{off.officeName}</p>
                  <p className="text-[11px] text-slate-500">{off.totalEmployees} total staff</p>
                </div>
                <div className="flex items-center gap-2 text-[11px] font-bold">
                  <span className="text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-md">
                    {off.present} Present
                  </span>
                  {off.onBreak > 0 && (
                    <span className="text-amber-700 bg-amber-100/60 px-2 py-0.5 rounded-md">
                      {off.onBreak} Break
                    </span>
                  )}
                  {off.onLeave > 0 && (
                    <span className="text-purple-700 bg-purple-100/60 px-2 py-0.5 rounded-md">
                      {off.onLeave} Leave
                    </span>
                  )}
                  {off.absent > 0 && (
                    <span className="text-rose-700 bg-rose-100/60 px-2 py-0.5 rounded-md">
                      {off.absent} Absent
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search employee name, ID, branch..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Office Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 border border-slate-200 rounded-xl">
            <Building2 className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={officeFilter}
              onChange={(e) => setOfficeFilter(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Offices</option>
              {officesList.map((off) => (
                <option key={off} value={off}>
                  {off}
                </option>
              ))}
            </select>
          </div>

          {/* Date Picker */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 border border-slate-200 rounded-xl">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 border border-slate-200 rounded-xl">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="PRESENT">Present</option>
              <option value="LATE">Late</option>
              <option value="HALF_DAY">Half Day</option>
              <option value="ON_BREAK">On Break</option>
              <option value="ON_LEAVE">On Leave</option>
              <option value="ABSENT">Absent</option>
            </select>
          </div>
        </div>
      </div>

      {/* 5. Authoritative Attendance Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4">Employee</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Punch In</th>
                <th className="py-3.5 px-4">Punch Out</th>
                <th className="py-3.5 px-4">Break</th>
                <th className="py-3.5 px-4">Working Hours</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-center">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-bold">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
                      <span>Loading attendance logs...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-bold">
                    No attendance records found for this date and filters.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900">{r.employeeName}</p>
                      <p className="text-[10px] font-mono text-slate-400">{r.employeeId}</p>
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-700">
                      {r.date}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                      {r.punchIn}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span>{r.punchOut}</span>
                        {r.isAutoCheckout && (
                          <span
                            title="Auto Check-out (Forgot Punch-Out)"
                            className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold bg-blue-50 text-blue-700 border border-blue-200"
                          >
                            Auto
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-amber-700">
                      {r.totalBreak}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">
                      {r.workingHours}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          r.status === 'PRESENT'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : r.status === 'LATE'
                            ? 'bg-orange-50 text-orange-700 border border-orange-200'
                            : r.status === 'ON_BREAK'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : r.status === 'ON_LEAVE'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => setSelectedRecord(r)}
                        className="inline-flex items-center justify-center p-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 transition-colors cursor-pointer"
                        title="View Detailed Timesheet & Breaks"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Server-Side Pagination */}
        <AdminPagination
          page={page}
          pageSize={pageSize}
          total={pagination.total}
          totalPages={pagination.totalPages}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
          disabled={isLoading}
        />
      </div>

      {/* 6. Detailed Timesheet Drawer / Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in-50">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Attendance Timesheet</h3>
                <p className="text-xs text-slate-500">{selectedRecord.employeeName} ({selectedRecord.employeeId})</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Attendance Date</p>
                <p className="font-extrabold text-slate-900 mt-0.5">{selectedRecord.date}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Status</p>
                <p className="font-extrabold text-emerald-700 mt-0.5">{selectedRecord.status}</p>
              </div>

              <div className="p-3 bg-emerald-50/40 rounded-xl border border-emerald-100">
                <p className="text-[10px] font-bold text-emerald-700 uppercase">Punch In</p>
                <p className="font-mono font-extrabold text-emerald-900 text-sm mt-0.5">{selectedRecord.punchIn}</p>
              </div>
              <div className="p-3 bg-blue-50/40 rounded-xl border border-blue-100">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold text-blue-700 uppercase">Punch Out</p>
                  {selectedRecord.isAutoCheckout && (
                    <span className="text-[9px] font-semibold bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">Auto</span>
                  )}
                </div>
                <p className="font-mono font-extrabold text-blue-900 text-sm mt-0.5">{selectedRecord.punchOut}</p>
                {selectedRecord.isAutoCheckout && (
                  <p className="text-[10px] text-blue-600 font-medium mt-0.5">Auto Check-out (Forgot Punch-Out)</p>
                )}
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Gross Working</p>
                <p className="font-mono font-extrabold text-slate-800 mt-0.5">{selectedRecord.grossWorkingHours}</p>
              </div>
              <div className="p-3 bg-amber-50/40 rounded-xl border border-amber-100">
                <p className="text-[10px] font-bold text-amber-700 uppercase">Total Break</p>
                <p className="font-mono font-extrabold text-amber-800 mt-0.5">{selectedRecord.totalBreak}</p>
              </div>
            </div>

            <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-emerald-700 uppercase">Net Working Duration</p>
                <p className="text-xs text-emerald-600 font-medium">Gross Working − Total Break</p>
              </div>
              <span className="text-lg font-black font-mono text-emerald-900">{selectedRecord.workingHours}</span>
            </div>

            {/* Break Sessions Breakdown */}
            <div className="space-y-2">
              <h4 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                <Coffee className="w-4 h-4 text-amber-600" /> Break Sessions
              </h4>
              {selectedRecord.breakSessions.length === 0 ? (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center text-xs text-slate-400 font-medium">
                  No break sessions recorded for this day (0h 0m).
                </div>
              ) : (
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {selectedRecord.breakSessions.map((b) => (
                    <div
                      key={b.id}
                      className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-black flex items-center justify-center">
                          {b.sessionNumber}
                        </span>
                        <span className="font-semibold text-slate-800 font-mono">
                          {b.breakStartFormatted} → {b.breakEndFormatted}
                        </span>
                      </div>
                      <span className="font-bold text-amber-800 font-mono bg-amber-50 px-2 py-0.5 rounded-md">
                        {b.durationFormatted}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
