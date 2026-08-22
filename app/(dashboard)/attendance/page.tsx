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
import { useQuery } from '@tanstack/react-query';

interface AttendanceRecord {
  id: string;
  employeeName: string;
  employeeId: string;
  branch: string;
  office: string;
  date: string;
  punchIn: string;
  punchOut: string;
  workingHours: string;
  breaksCount: number;
  totalBreak: string;
  status: string;
  location: string;
}

export default function AttendancePage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [officeFilter, setOfficeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');

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
  const { data: attendanceData, isLoading, refetch: refetchLogs } = useQuery({
    queryKey: ['admin-hrm-attendance-logs', selectedDate, officeFilter],
    queryFn: async () => {
      try {
        const params: Record<string, string> = {};
        if (selectedDate) params.date = selectedDate;
        if (officeFilter !== 'ALL') params.branch = officeFilter;
        const res: any = await api.get('/employees/hrm/attendance', { params });
        return res?.data || res;
      } catch {
        return [];
      }
    },
  });

  const officesList: string[] = Array.isArray(officesData)
    ? officesData.map((o: any) => o.name || o.branch || String(o))
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

  const officeBreakdown = Array.isArray(liveData?.offices) ? liveData.offices : [];

  const records: AttendanceRecord[] = Array.isArray(attendanceData)
    ? attendanceData.map((a: any) => ({
        id: String(a.id),
        employeeName: a.employeeName || 'Employee',
        employeeId: a.employeeId || 'EMP-001',
        branch: a.branch || a.office || 'Head Office',
        office: a.branch || a.office || 'Head Office',
        date: a.date || selectedDate,
        punchIn: a.punchIn || '—',
        punchOut: a.punchOut || '—',
        workingHours: a.workingHours || '0h 0m',
        breaksCount: a.breaksCount || 0,
        totalBreak: a.totalBreak || '0 min',
        status: a.status || 'PRESENT',
        location: a.location || 'Office GPS',
      }))
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
                key={off.officeName}
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
            placeholder="Search staff, code, branch..."
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
              <option value="ON_LEAVE">On Leave</option>
              <option value="ABSENT">Absent</option>
            </select>
          </div>
        </div>
      </div>

      {/* 5. Real Attendance Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4">Employee</th>
                <th className="py-3.5 px-4">Office / Branch</th>
                <th className="py-3.5 px-4">Check In</th>
                <th className="py-3.5 px-4">Check Out</th>
                <th className="py-3.5 px-4">Working Hours</th>
                <th className="py-3.5 px-4">Breaks</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Location</th>
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
                      <div className="flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-slate-400" />
                        <span>{r.branch}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{r.punchIn}</td>

                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{r.punchOut}</td>

                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">{r.workingHours}</td>

                    <td className="py-3.5 px-4">
                      {r.breaksCount > 0 ? (
                        <div>
                          <p className="font-bold text-slate-800">{r.breaksCount} breaks</p>
                          <p className="text-[10px] text-slate-400">Total: {r.totalBreak}</p>
                        </div>
                      ) : (
                        <span className="text-slate-300 font-bold">—</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          r.status === 'PRESENT'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : r.status === 'LATE'
                            ? 'bg-orange-50 text-orange-700 border border-orange-200'
                            : r.status === 'ON_LEAVE'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 font-medium">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{r.location}</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
