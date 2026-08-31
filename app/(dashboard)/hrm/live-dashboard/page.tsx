'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Clock,
  Briefcase,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Coffee,
  Laptop,
  MapPin,
  Navigation,
  RefreshCw,
  Search,
  Building2,
  Eye,
  X,
  Radio,
  SlidersHorizontal,
  ChevronRight,
  ShieldCheck,
  Calendar,
  AlertCircle,
  Phone,
  Mail,
  Compass,
} from 'lucide-react';
import api from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

interface EmployeeLiveRecord {
  id: number;
  employeeCode: string;
  name: string;
  email: string;
  phone: string | null;
  department: string;
  departmentId: number | null;
  designation: string;
  office: {
    id: number;
    name: string;
    city: string;
    latitude: number;
    longitude: number;
    radiusMeters: number;
  } | null;
  shift: {
    id: number;
    name: string;
    code: string;
    startTime: string;
    endTime: string;
    gracePeriodMinutes: number;
    durationHours: number;
  } | null;
  punchIn: string | null;
  punchOut: string | null;
  workingMinutes: number;
  currentStatus: 'WORKING' | 'ON_BREAK' | 'PUNCHED_OUT' | 'ABSENT' | 'NOT_CHECKED_IN' | string;
  breakStatus: 'ON_BREAK' | 'NO_ACTIVE_BREAK';
  activeBreakStart: string | null;
  currentBreakMinutes: number;
  totalBreakMinutesToday: number;
  attendanceStatus: string;
  locationStatus: 'INSIDE_RADIUS' | 'OUTSIDE_RADIUS' | 'UNAVAILABLE' | string;
  workMode: 'OFFICE' | 'REMOTE' | string;
  distanceFromOffice: number | null;
  latitude: number | null;
  longitude: number | null;
  lastLocationUpdate: string | null;
  isLate: boolean;
  lateMinutes: number;
  breaks: Array<{
    id: number;
    breakStart: string;
    breakEnd: string | null;
    duration: number;
  }>;
}

interface LiveDashboardData {
  summary: {
    totalEmployees: number;
    present: number;
    absent: number;
    late: number;
    working: number;
    onBreak: number;
    punchedOut: number;
    remote: number;
    insideRadius: number;
    outsideRadius: number;
  };
  employees: EmployeeLiveRecord[];
  offices: Array<{
    id: number;
    name: string;
    city: string;
    latitude: number;
    longitude: number;
    radiusMeters: number;
  }>;
  timestamp: string;
}

function formatMinutes(minutes: number): string {
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hrs.toString().padStart(2, '0')}h ${mins.toString().padStart(2, '0')}m`;
}

function formatTime(isoString: string | null): string {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '—';
  }
}

export default function HrmsLiveDashboardPage() {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [officeFilter, setOfficeFilter] = useState<string>('ALL');
  const [departmentFilter, setDepartmentFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');
  const [autoRefreshSec, setAutoRefreshSec] = useState<number>(15);
  const [activeTab, setActiveTab] = useState<
    'all' | 'breaks' | 'late' | 'radius' | 'remote' | 'map'
  >('all');
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeLiveRecord | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [liveClock, setLiveClock] = useState<string>('');

  useEffect(() => {
    const updateTime = () => setLiveClock(new Date().toLocaleTimeString());
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch Live Dashboard Data from Real Backend
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery<LiveDashboardData>({
    queryKey: ['hrms-live-dashboard', selectedDate],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (selectedDate) params.date = selectedDate;
      const res: any = await api.get('/admin/hrms/live-dashboard', { params });
      return res?.data?.data || res?.data || res;
    },
    refetchInterval: autoRefreshSec > 0 ? autoRefreshSec * 1000 : false,
    staleTime: 5000,
  });

  const employees = useMemo(() => data?.employees || [], [data]);
  const summary = useMemo(
    () =>
      data?.summary || {
        totalEmployees: 0,
        present: 0,
        absent: 0,
        late: 0,
        working: 0,
        onBreak: 0,
        punchedOut: 0,
        remote: 0,
        insideRadius: 0,
        outsideRadius: 0,
      },
    [data]
  );

  const departments = useMemo(() => {
    const set = new Set<string>();
    employees.forEach((e) => {
      if (e.department) set.add(e.department);
    });
    return Array.from(set).sort();
  }, [employees]);

  const offices = useMemo(() => data?.offices || [], [data]);

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      // Office filter
      if (officeFilter !== 'ALL') {
        const empOfficeName = emp.office?.name || '';
        if (empOfficeName !== officeFilter) return false;
      }

      // Department filter
      if (departmentFilter !== 'ALL' && emp.department !== departmentFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'ALL' && emp.currentStatus !== statusFilter) {
        return false;
      }

      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchName = emp.name.toLowerCase().includes(q);
        const matchCode = emp.employeeCode.toLowerCase().includes(q);
        const matchDept = emp.department.toLowerCase().includes(q);
        const matchDesig = emp.designation.toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchDept && !matchDesig) return false;
      }

      return true;
    });
  }, [employees, officeFilter, departmentFilter, statusFilter, search]);

  const onBreakEmployees = useMemo(
    () => filteredEmployees.filter((e) => e.breakStatus === 'ON_BREAK'),
    [filteredEmployees]
  );

  const lateEmployees = useMemo(
    () => filteredEmployees.filter((e) => e.isLate),
    [filteredEmployees]
  );

  const remoteEmployees = useMemo(
    () => filteredEmployees.filter((e) => e.workMode.toUpperCase() === 'REMOTE'),
    [filteredEmployees]
  );

  const handleRowClick = (emp: EmployeeLiveRecord) => {
    setSelectedEmployee(emp);
    setIsDrawerOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'WORKING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Working
          </span>
        );
      case 'ON_BREAK':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            On Break
          </span>
        );
      case 'PUNCHED_OUT':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <span className="w-2 h-2 rounded-full bg-slate-400"></span>
            Punched Out
          </span>
        );
      case 'ABSENT':
      case 'NOT_CHECKED_IN':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <span className="w-2 h-2 rounded-full bg-rose-400"></span>
            Not Checked In
          </span>
        );
    }
  };

  const getLocationBadge = (locStatus: string, dist: number | null) => {
    switch (locStatus) {
      case 'INSIDE_RADIUS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Inside Radius {dist !== null ? `(${dist}m)` : ''}
          </span>
        );
      case 'OUTSIDE_RADIUS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle className="w-3 h-3 text-rose-600" />
            Outside Radius {dist !== null ? `(${dist}m)` : ''}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-50 text-slate-500 border border-slate-200">
            Unavailable
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">HRMS Live Dashboard</h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              Live
            </span>
          </div>
          <p className="text-xs font-medium text-slate-500 flex items-center gap-2">
            <span>Real-time attendance, break telemetry, and office geofencing</span>
            <span>•</span>
            <span className="text-slate-700 font-bold">Local Time: {liveClock}</span>
            <span>•</span>
            <span className="text-slate-400">
              Last updated: {data?.timestamp ? new Date(data.timestamp).toLocaleTimeString() : '—'}
            </span>
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Date Picker */}
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-2xl border border-slate-200">
            <Calendar className="w-4 h-4 text-slate-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-hidden"
            />
          </div>

          {/* Auto-refresh interval */}
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-2xl border border-slate-200">
            <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
            <select
              value={autoRefreshSec}
              onChange={(e) => setAutoRefreshSec(Number(e.target.value))}
              className="bg-transparent text-xs font-bold text-slate-700 focus:outline-hidden cursor-pointer"
            >
              <option value={15}>Sync: 15s</option>
              <option value={30}>Sync: 30s</option>
              <option value={60}>Sync: 60s</option>
              <option value={0}>Manual only</option>
            </select>
          </div>

          {/* Manual Refresh Button */}
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#23C45E] hover:bg-[#1fa851] text-white text-xs font-black rounded-2xl shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            <span>{isFetching ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {isError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <p className="text-xs font-bold text-rose-800">
              Failed to load live HRMS telemetry: {(error as any)?.message || 'Server error'}
            </p>
          </div>
          <button
            onClick={() => refetch()}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* 10 TOP KPI SUMMARY CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
        {/* Total Employees */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Total</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-slate-900">{summary.totalEmployees}</p>
            <p className="text-[10px] font-bold text-slate-400">Total active staff</p>
          </div>
        </div>

        {/* Present */}
        <div className="bg-white p-4 rounded-3xl border border-emerald-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-emerald-700 uppercase tracking-wider">Present</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-emerald-700">{summary.present}</p>
            <p className="text-[10px] font-bold text-emerald-600/80">Marked today</p>
          </div>
        </div>

        {/* Absent */}
        <div className="bg-white p-4 rounded-3xl border border-rose-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-rose-700 uppercase tracking-wider">Absent</span>
            <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center text-rose-700">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-rose-700">{summary.absent}</p>
            <p className="text-[10px] font-bold text-rose-600/80">Not checked in</p>
          </div>
        </div>

        {/* Late */}
        <div className="bg-white p-4 rounded-3xl border border-amber-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-amber-700 uppercase tracking-wider">Late</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-amber-700">{summary.late}</p>
            <p className="text-[10px] font-bold text-amber-600/80">After grace period</p>
          </div>
        </div>

        {/* Currently Working */}
        <div className="bg-white p-4 rounded-3xl border border-emerald-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-emerald-800 uppercase tracking-wider">Working</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-emerald-800">{summary.working}</p>
            <p className="text-[10px] font-bold text-emerald-600/80">Active on shift</p>
          </div>
        </div>

        {/* On Break */}
        <div className="bg-white p-4 rounded-3xl border border-amber-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-amber-800 uppercase tracking-wider">On Break</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800">
              <Coffee className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-amber-800">{summary.onBreak}</p>
            <p className="text-[10px] font-bold text-amber-600/80">Break in progress</p>
          </div>
        </div>

        {/* Punched Out */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">Punched Out</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-slate-700">{summary.punchedOut}</p>
            <p className="text-[10px] font-bold text-slate-400">Completed shifts</p>
          </div>
        </div>

        {/* Remote Work */}
        <div className="bg-white p-4 rounded-3xl border border-sky-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-sky-700 uppercase tracking-wider">Remote</span>
            <div className="w-8 h-8 rounded-xl bg-sky-100 flex items-center justify-center text-sky-700">
              <Laptop className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-sky-700">{summary.remote}</p>
            <p className="text-[10px] font-bold text-sky-600/80">Work from home/field</p>
          </div>
        </div>

        {/* Inside Radius */}
        <div className="bg-white p-4 rounded-3xl border border-emerald-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-emerald-700 uppercase tracking-wider">In Radius</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-emerald-700">{summary.insideRadius}</p>
            <p className="text-[10px] font-bold text-emerald-600/80">Within office geofence</p>
          </div>
        </div>

        {/* Outside Radius */}
        <div className="bg-white p-4 rounded-3xl border border-rose-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-rose-700 uppercase tracking-wider">Out Radius</span>
            <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center text-rose-700">
              <Navigation className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-rose-700">{summary.outsideRadius}</p>
            <p className="text-[10px] font-bold text-rose-600/80">Outside office perimeter</p>
          </div>
        </div>
      </div>

      {/* Main Section: Filters + Tabs + Content */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Navigation Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-6 pt-5 pb-3 border-b border-slate-100 gap-4">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'all'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              All Employees ({filteredEmployees.length})
            </button>
            <button
              onClick={() => setActiveTab('breaks')}
              className={`px-4 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'breaks'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Coffee className="w-3.5 h-3.5" />
              On Break ({onBreakEmployees.length})
            </button>
            <button
              onClick={() => setActiveTab('late')}
              className={`px-4 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'late'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Late Employees ({lateEmployees.length})
            </button>
            <button
              onClick={() => setActiveTab('radius')}
              className={`px-4 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'radius'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              Office Radius
            </button>
            <button
              onClick={() => setActiveTab('remote')}
              className={`px-4 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'remote'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Laptop className="w-3.5 h-3.5" />
              Remote ({remoteEmployees.length})
            </button>
            <button
              onClick={() => setActiveTab('map')}
              className={`px-4 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'map'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              Live Map
            </button>
          </div>

          <span className="text-xs font-bold text-slate-400 whitespace-nowrap">
            Showing <span className="text-slate-900 font-extrabold">{filteredEmployees.length}</span> of{' '}
            {employees.length} employees
          </span>
        </div>

        {/* Filter Bar */}
        <div className="p-4 bg-slate-50/70 border-b border-slate-100 flex flex-wrap items-center gap-3">
          {/* Search Box */}
          <div className="flex-1 min-w-[220px] relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, ID, department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9.5 pr-4 py-2 bg-white rounded-2xl border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Office Filter */}
          <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-2xl border border-slate-200">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={officeFilter}
              onChange={(e) => setOfficeFilter(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-700 focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">All Offices</option>
              {offices.map((o) => (
                <option key={o.id} value={o.name}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>

          {/* Department Filter */}
          <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-2xl border border-slate-200">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-700 focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">All Departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-2xl border border-slate-200">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-700 focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">All Status</option>
              <option value="WORKING">Working</option>
              <option value="ON_BREAK">On Break</option>
              <option value="PUNCHED_OUT">Punched Out</option>
              <option value="NOT_CHECKED_IN">Not Checked In</option>
            </select>
          </div>
        </div>

        {/* Content Area */}
        {isLoading ? (
          <div className="p-12 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-500">Connecting to HRM live telemetry feed...</p>
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <Users className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-black text-slate-900">No Employees Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No employee records matched your active filter criteria for this date.
            </p>
          </div>
        ) : (
          <div>
            {/* VIEW 1: ALL EMPLOYEES LIVE TABLE */}
            {activeTab === 'all' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-100">
                      <th className="py-3.5 px-4">Employee</th>
                      <th className="py-3.5 px-4">Department & Office</th>
                      <th className="py-3.5 px-4">Assigned Shift</th>
                      <th className="py-3.5 px-4">Punch In / Out</th>
                      <th className="py-3.5 px-4">Working Duration</th>
                      <th className="py-3.5 px-4">Current Status</th>
                      <th className="py-3.5 px-4">Break Status</th>
                      <th className="py-3.5 px-4">Location Status</th>
                      <th className="py-3.5 px-4">Work Mode</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredEmployees.map((emp) => (
                      <tr
                        key={emp.id}
                        onClick={() => handleRowClick(emp)}
                        className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                      >
                        {/* Employee */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-2xl bg-emerald-700 text-white font-black text-xs flex items-center justify-center shadow-xs shrink-0">
                              {emp.name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')}
                            </div>
                            <div>
                              <p className="font-extrabold text-slate-900 group-hover:text-emerald-700 transition-colors">
                                {emp.name}
                              </p>
                              <p className="text-[10px] text-slate-400 font-bold">{emp.employeeCode}</p>
                            </div>
                          </div>
                        </td>

                        {/* Department & Office */}
                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-800">{emp.department}</p>
                          <p className="text-[10px] text-slate-400">{emp.office?.name || 'Head Office'}</p>
                        </td>

                        {/* Shift */}
                        <td className="py-3 px-4">
                          {emp.shift ? (
                            <div>
                              <p className="font-bold text-slate-800">{emp.shift.name}</p>
                              <p className="text-[10px] text-slate-400 font-mono">
                                {emp.shift.startTime} – {emp.shift.endTime}
                              </p>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">General Shift</span>
                          )}
                        </td>

                        {/* Punch In / Out */}
                        <td className="py-3 px-4">
                          <div className="space-y-0.5 font-mono">
                            <p className="text-slate-800 font-bold">In: {formatTime(emp.punchIn)}</p>
                            <p className="text-[10px] text-slate-400">Out: {formatTime(emp.punchOut)}</p>
                          </div>
                        </td>

                        {/* Working Duration */}
                        <td className="py-3 px-4">
                          <span className="font-black text-slate-900 font-mono">
                            {formatMinutes(emp.workingMinutes)}
                          </span>
                        </td>

                        {/* Current Status */}
                        <td className="py-3 px-4">{getStatusBadge(emp.currentStatus)}</td>

                        {/* Break Status */}
                        <td className="py-3 px-4">
                          {emp.breakStatus === 'ON_BREAK' ? (
                            <span className="inline-flex items-center gap-1 font-bold text-amber-700 font-mono">
                              <Coffee className="w-3 h-3 text-amber-600 animate-pulse" />
                              {formatMinutes(emp.currentBreakMinutes)} live
                            </span>
                          ) : emp.totalBreakMinutesToday > 0 ? (
                            <span className="text-slate-500 font-mono text-[11px]">
                              {formatMinutes(emp.totalBreakMinutesToday)} total
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        {/* Location Status */}
                        <td className="py-3 px-4">
                          {getLocationBadge(emp.locationStatus, emp.distanceFromOffice)}
                        </td>

                        {/* Work Mode */}
                        <td className="py-3 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              emp.workMode.toUpperCase() === 'REMOTE'
                                ? 'bg-sky-100 text-sky-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {emp.workMode}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRowClick(emp);
                            }}
                            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-emerald-700 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* VIEW 2: BREAK MONITORING */}
            {activeTab === 'breaks' && (
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <Coffee className="w-4 h-4 text-amber-600" />
                    Employees Currently On Break ({onBreakEmployees.length})
                  </h3>
                  <span className="text-xs text-slate-400 font-medium">
                    Live break timer updates without page reload
                  </span>
                </div>

                {onBreakEmployees.length === 0 ? (
                  <div className="p-12 text-center bg-slate-50 rounded-3xl border border-slate-200/60">
                    <Coffee className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-600">No employees are currently on break.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {onBreakEmployees.map((emp) => (
                      <div
                        key={emp.id}
                        onClick={() => handleRowClick(emp)}
                        className="p-5 bg-amber-50/50 rounded-3xl border border-amber-200/80 shadow-xs space-y-4 cursor-pointer hover:border-amber-400 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-amber-600 text-white font-black text-xs flex items-center justify-center">
                              {emp.name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')}
                            </div>
                            <div>
                              <h4 className="font-black text-slate-900 text-sm">{emp.name}</h4>
                              <p className="text-[10px] text-slate-500">
                                {emp.employeeCode} • {emp.department}
                              </p>
                            </div>
                          </div>
                          <span className="px-2.5 py-1 rounded-full bg-amber-200 text-amber-900 text-[10px] font-black uppercase tracking-wider animate-pulse">
                            On Break
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs bg-white/80 p-3 rounded-2xl border border-amber-100">
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase">Break Start</span>
                            <p className="font-mono font-bold text-slate-800">
                              {formatTime(emp.activeBreakStart)}
                            </p>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase">Current Duration</span>
                            <p className="font-mono font-black text-amber-700">
                              {formatMinutes(emp.currentBreakMinutes)}
                            </p>
                          </div>
                        </div>

                        <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1">
                          <span>Total Break Today:</span>
                          <span className="font-bold text-slate-800">
                            {formatMinutes(emp.totalBreakMinutesToday)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* VIEW 3: LATE EMPLOYEES */}
            {activeTab === 'late' && (
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    Late Arrivals Today ({lateEmployees.length})
                  </h3>
                  <span className="text-xs text-slate-400 font-medium">
                    Evaluated dynamically against assigned shift start + grace period
                  </span>
                </div>

                {lateEmployees.length === 0 ? (
                  <div className="p-12 text-center bg-slate-50 rounded-3xl border border-slate-200/60">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-700">All employees arrived on time today!</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-100">
                          <th className="py-3 px-4">Employee</th>
                          <th className="py-3 px-4">Assigned Shift</th>
                          <th className="py-3 px-4">Shift Start Time</th>
                          <th className="py-3 px-4">Actual Punch In</th>
                          <th className="py-3 px-4">Late Duration</th>
                          <th className="py-3 px-4">Current Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {lateEmployees.map((emp) => (
                          <tr
                            key={emp.id}
                            onClick={() => handleRowClick(emp)}
                            className="hover:bg-slate-50 cursor-pointer"
                          >
                            <td className="py-3 px-4">
                              <p className="font-bold text-slate-900">{emp.name}</p>
                              <p className="text-[10px] text-slate-400">{emp.employeeCode}</p>
                            </td>
                            <td className="py-3 px-4 font-bold text-slate-700">
                              {emp.shift?.name || 'General Shift'}
                            </td>
                            <td className="py-3 px-4 font-mono font-bold text-slate-800">
                              {emp.shift?.startTime || '09:30 AM'}
                            </td>
                            <td className="py-3 px-4 font-mono font-bold text-rose-600">
                              {formatTime(emp.punchIn)}
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 text-[11px] font-black">
                                +{emp.lateMinutes} mins late
                              </span>
                            </td>
                            <td className="py-3 px-4">{getStatusBadge(emp.currentStatus)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* VIEW 4: OFFICE RADIUS & GEOFENCE */}
            {activeTab === 'radius' && (
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-700" />
                    Office Geofence & Proximity Tracking
                  </h3>
                  <span className="text-xs text-slate-400 font-medium">
                    Calculated via Haversine GPS formula relative to assigned branch
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-100">
                        <th className="py-3 px-4">Employee</th>
                        <th className="py-3 px-4">Assigned Office</th>
                        <th className="py-3 px-4">Office Coordinates</th>
                        <th className="py-3 px-4">Employee Coordinates</th>
                        <th className="py-3 px-4">Calculated Distance</th>
                        <th className="py-3 px-4">Allowed Radius</th>
                        <th className="py-3 px-4">Geofence Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredEmployees.map((emp) => (
                        <tr
                          key={emp.id}
                          onClick={() => handleRowClick(emp)}
                          className="hover:bg-slate-50 cursor-pointer"
                        >
                          <td className="py-3 px-4 font-bold text-slate-900">{emp.name}</td>
                          <td className="py-3 px-4 font-bold text-slate-700">
                            {emp.office?.name || 'Head Office'}
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                            {emp.office?.latitude ? `${emp.office.latitude.toFixed(4)}, ${emp.office.longitude.toFixed(4)}` : '—'}
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                            {emp.latitude ? `${emp.latitude.toFixed(4)}, ${emp.longitude?.toFixed(4)}` : '—'}
                          </td>
                          <td className="py-3 px-4 font-mono font-black text-slate-900">
                            {emp.distanceFromOffice !== null ? `${emp.distanceFromOffice} meters` : '—'}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-600">
                            {emp.office?.radiusMeters || 200} m
                          </td>
                          <td className="py-3 px-4">
                            {getLocationBadge(emp.locationStatus, emp.distanceFromOffice)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* VIEW 5: REMOTE WORK */}
            {activeTab === 'remote' && (
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <Laptop className="w-4 h-4 text-sky-600" />
                    Remote Employees Today ({remoteEmployees.length})
                  </h3>
                  <span className="text-xs text-slate-400 font-medium">
                    Filtered by active remote work policy approval
                  </span>
                </div>

                {remoteEmployees.length === 0 ? (
                  <div className="p-12 text-center bg-slate-50 rounded-3xl border border-slate-200/60">
                    <Laptop className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-600">No employees are on remote work mode today.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {remoteEmployees.map((emp) => (
                      <div
                        key={emp.id}
                        onClick={() => handleRowClick(emp)}
                        className="p-5 bg-sky-50/40 rounded-3xl border border-sky-200 shadow-xs space-y-3 cursor-pointer hover:border-sky-400 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="font-black text-slate-900 text-sm">{emp.name}</h4>
                          <span className="px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 text-[10px] font-black uppercase">
                            Remote
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium">
                          {emp.department} • {emp.designation}
                        </p>
                        <div className="text-xs space-y-1 font-mono pt-2 border-t border-sky-100">
                          <p className="text-slate-700">Punch In: {formatTime(emp.punchIn)}</p>
                          <p className="text-slate-700">Working: {formatMinutes(emp.workingMinutes)}</p>
                          <p className="text-[10px] text-slate-400">
                            Last Telemetry: {emp.lastLocationUpdate ? formatTime(emp.lastLocationUpdate) : '—'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* VIEW 6: LIVE INTERACTIVE MAP */}
            {activeTab === 'map' && (
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Map Visual Canvas */}
                  <div className="lg:col-span-8 bg-slate-950 rounded-3xl overflow-hidden border border-slate-800 shadow-xl min-h-[520px] relative flex flex-col justify-between p-6">
                    {/* Map Header Overlay */}
                    <div className="flex items-center justify-between bg-slate-900/90 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-slate-800 z-10">
                      <div className="flex items-center gap-2 text-xs font-bold text-white">
                        <Navigation className="w-4 h-4 text-emerald-400" />
                        <span>Live GPS & Branch Radius Radar</span>
                      </div>
                      <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                        {offices.length} Office Geofences Active
                      </span>
                    </div>

                    {/* Geofence Radar Background */}
                    <div className="relative w-full h-[380px] flex items-center justify-center my-auto">
                      {/* Office Geofence Circle */}
                      <div className="absolute w-72 h-72 rounded-full border-2 border-dashed border-emerald-500/40 bg-emerald-500/10 flex items-center justify-center animate-pulse">
                        <div className="w-48 h-48 rounded-full border border-emerald-500/30 bg-emerald-500/5"></div>
                      </div>

                      {/* Office Center Marker */}
                      <div className="absolute z-20 flex flex-col items-center">
                        <div className="w-10 h-10 rounded-2xl bg-[#23C45E] text-white flex items-center justify-center shadow-lg border-2 border-white">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <span className="mt-1 text-[10px] font-black text-white bg-slate-900/90 px-2 py-0.5 rounded-md border border-slate-700 whitespace-nowrap">
                          {offices[0]?.name || 'Head Office'} (200m)
                        </span>
                      </div>

                      {/* Employee Pins on Radar */}
                      {filteredEmployees.map((emp, index) => {
                        const isSelected = selectedEmployee?.id === emp.id;
                        const angle = (index * (360 / Math.max(1, filteredEmployees.length)) * Math.PI) / 180;
                        const distanceOffset = emp.locationStatus === 'INSIDE_RADIUS' ? 80 : 160;
                        const x = Math.cos(angle) * distanceOffset;
                        const y = Math.sin(angle) * distanceOffset;

                        return (
                          <div
                            key={emp.id}
                            onClick={() => setSelectedEmployee(emp)}
                            style={{
                              transform: `translate(${x}px, ${y}px)`,
                            }}
                            className={`absolute z-30 cursor-pointer transition-all duration-300 group ${
                              isSelected ? 'scale-125 z-40' : 'hover:scale-110'
                            }`}
                          >
                            <div
                              className={`px-2.5 py-1 rounded-full shadow-md flex items-center gap-1.5 border text-[11px] font-bold ${
                                isSelected
                                  ? 'bg-emerald-600 text-white border-white ring-4 ring-emerald-500/40'
                                  : emp.locationStatus === 'INSIDE_RADIUS'
                                  ? 'bg-slate-900/90 text-white border-emerald-500'
                                  : 'bg-slate-900/90 text-rose-300 border-rose-500'
                              }`}
                            >
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  emp.locationStatus === 'INSIDE_RADIUS' ? 'bg-emerald-400' : 'bg-rose-500'
                                }`}
                              ></span>
                              <span>{emp.name.split(' ')[0]}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Map Footer Legend */}
                    <div className="flex items-center justify-between text-[11px] text-slate-400 z-10 bg-slate-900/80 backdrop-blur-xs p-3 rounded-2xl border border-slate-800">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                          Inside Radius ({summary.insideRadius})
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                          Outside Radius ({summary.outsideRadius})
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Click pin to inspect employee
                      </span>
                    </div>
                  </div>

                  {/* Right: Selected Employee Details Card */}
                  <div className="lg:col-span-4 space-y-4">
                    {selectedEmployee ? (
                      <div className="bg-slate-50 rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-2xl bg-emerald-700 text-white font-black text-sm flex items-center justify-center">
                              {selectedEmployee.name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')}
                            </div>
                            <div>
                              <h4 className="font-black text-slate-900 text-sm">
                                {selectedEmployee.name}
                              </h4>
                              <p className="text-[10px] text-slate-500 font-bold">
                                {selectedEmployee.employeeCode} • {selectedEmployee.department}
                              </p>
                            </div>
                          </div>
                          {getStatusBadge(selectedEmployee.currentStatus)}
                        </div>

                        <div className="space-y-2.5 text-xs">
                          <div className="bg-white p-3 rounded-2xl border border-slate-200/80 space-y-1">
                            <span className="text-[10px] text-slate-400 font-bold uppercase">
                              Geofence Proximity
                            </span>
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-800">
                                {selectedEmployee.office?.name || 'Head Office'}
                              </span>
                              {getLocationBadge(
                                selectedEmployee.locationStatus,
                                selectedEmployee.distanceFromOffice
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500">
                              Allowed Radius: {selectedEmployee.office?.radiusMeters || 200}m
                            </p>
                          </div>

                          <div className="bg-white p-3 rounded-2xl border border-slate-200/80 space-y-1 font-mono">
                            <span className="text-[10px] text-slate-400 font-bold uppercase">
                              Shift & Timings
                            </span>
                            <p className="text-slate-800 font-bold">
                              Punch In: {formatTime(selectedEmployee.punchIn)}
                            </p>
                            <p className="text-slate-800 font-bold">
                              Punch Out: {formatTime(selectedEmployee.punchOut)}
                            </p>
                            <p className="text-emerald-700 font-black">
                              Working: {formatMinutes(selectedEmployee.workingMinutes)}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => setIsDrawerOpen(true)}
                          className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-black transition-all cursor-pointer"
                        >
                          View Full Telemetry Profile
                        </button>
                      </div>
                    ) : (
                      <div className="p-8 text-center bg-slate-50 rounded-3xl border border-slate-200 text-slate-400 space-y-2">
                        <MapPin className="w-8 h-8 text-slate-300 mx-auto" />
                        <p className="text-xs font-bold text-slate-600">
                          Click any employee pin on the radar map to view telemetry
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* SLIDE-OVER EMPLOYEE DETAIL DRAWER */}
      {isDrawerOpen && selectedEmployee && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsDrawerOpen(false)}
          ></div>

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between">
              {/* Drawer Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-700 text-white font-black text-sm flex items-center justify-center shadow-xs">
                    {selectedEmployee.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-base">{selectedEmployee.name}</h3>
                    <p className="text-xs text-slate-500 font-bold">
                      {selectedEmployee.employeeCode} • {selectedEmployee.designation}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-2 rounded-2xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Drawer Scrollable Content */}
              <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
                {/* Status & Work Mode Overview */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Current Status</span>
                    <div>{getStatusBadge(selectedEmployee.currentStatus)}</div>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Work Mode</span>
                    <div>
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-100 text-sky-800">
                        {selectedEmployee.workMode}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Shift & Timings */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-600" />
                      Shift & Working Hours
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">
                      {selectedEmployee.shift?.name || 'General Shift'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 font-mono text-center">
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Punch In</span>
                      <span className="font-bold text-slate-900">{formatTime(selectedEmployee.punchIn)}</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Punch Out</span>
                      <span className="font-bold text-slate-900">{formatTime(selectedEmployee.punchOut)}</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Working</span>
                      <span className="font-black text-emerald-700">
                        {formatMinutes(selectedEmployee.workingMinutes)}
                      </span>
                    </div>
                  </div>

                  {selectedEmployee.isLate && (
                    <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-200 text-rose-800 flex items-center justify-between">
                      <span className="font-bold flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" /> Late by
                      </span>
                      <span className="font-black">+{selectedEmployee.lateMinutes} minutes</span>
                    </div>
                  )}
                </div>

                {/* Geofence & Office Location */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                      Assigned Office & Radius
                    </span>
                    {getLocationBadge(selectedEmployee.locationStatus, selectedEmployee.distanceFromOffice)}
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Assigned Office:</span>
                      <span className="font-bold text-slate-900">
                        {selectedEmployee.office?.name || 'Head Office'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Distance from Office:</span>
                      <span className="font-bold text-slate-900">
                        {selectedEmployee.distanceFromOffice !== null
                          ? `${selectedEmployee.distanceFromOffice} m`
                          : '—'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Allowed Geofence Radius:</span>
                      <span className="font-bold text-slate-900">
                        {selectedEmployee.office?.radiusMeters || 200} m
                      </span>
                    </div>
                    <div className="flex justify-between font-mono text-[11px] pt-1 border-t border-slate-200">
                      <span className="text-slate-500">Last Telemetry:</span>
                      <span className="text-slate-700">
                        {selectedEmployee.lastLocationUpdate ? formatTime(selectedEmployee.lastLocationUpdate) : '—'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Breaks Today */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                      <Coffee className="w-3.5 h-3.5 text-amber-600" />
                      Breaks Taken Today ({selectedEmployee.breaks.length})
                    </span>
                    <span className="font-bold text-slate-700 font-mono">
                      {formatMinutes(selectedEmployee.totalBreakMinutesToday)} total
                    </span>
                  </div>

                  {selectedEmployee.breaks.length === 0 ? (
                    <p className="text-slate-400 italic">No breaks recorded today.</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedEmployee.breaks.map((b, i) => (
                        <div
                          key={b.id || i}
                          className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between font-mono"
                        >
                          <span className="font-bold text-slate-700">
                            Break #{i + 1}: {formatTime(b.breakStart)} – {b.breakEnd ? formatTime(b.breakEnd) : 'In Progress'}
                          </span>
                          <span className="font-black text-amber-700">
                            {b.duration ? `${b.duration}m` : 'Active'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Contact Info */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <span className="font-black text-slate-900 text-xs block mb-2">Contact Details</span>
                  <div className="flex items-center gap-2 text-slate-700">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{selectedEmployee.email}</span>
                  </div>
                  {selectedEmployee.phone && (
                    <div className="flex items-center gap-2 text-slate-700">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{selectedEmployee.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-slate-100 bg-slate-50">
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-black transition-all cursor-pointer"
                >
                  Close Drawer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
