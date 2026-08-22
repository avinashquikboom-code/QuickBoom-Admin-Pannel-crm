'use client';

import React, { useState, useMemo } from 'react';
import {
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Plus,
  Check,
  X,
  User,
  Users,
  Search,
  Filter,
  Building2,
  Briefcase,
  Coffee,
  UserCheck,
  UserX,
  RefreshCw,
  Eye,
  AlertCircle,
  CalendarDays,
  FileText,
  MapPin,
  ChevronRight,
  Shield,
  Trash2,
  Edit2,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import api from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { AdminFormDrawer } from '@/components/admin';

type RequestTab = 'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL';
type AvailabilityFilter = 'ALL' | 'AVAILABLE' | 'ON_LEAVE' | 'ABSENT' | 'ON_BREAK';

interface LeaveRequestItem {
  id: number | string;
  customerId: number;
  employeeId: number;
  employeeCode: string;
  employeeName: string;
  employee: {
    id: number;
    employeeCode: string;
    name: string;
    email: string;
    phone: string;
    department: string;
    designation: string;
    office: string;
    officeCity?: string;
  } | null;
  department: string;
  office: string;
  leaveTypeId: number;
  leaveType: string;
  fromDate: string;
  toDate: string;
  days: number;
  totalDays: number;
  reason: string;
  attachmentUrl?: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  rejectionReason?: string | null;
  appliedOn: string;
  createdAt: string;
}

interface PublicHolidayItem {
  id: number;
  name: string;
  date: string;
  rawDate: string;
  description: string;
  officeId: number | null;
  officeName: string;
  officeCity?: string;
  scope: string;
  isActive: boolean;
  status: 'ACTIVE' | 'INACTIVE';
}

export default function LeaveManagementPage() {
  const queryClient = useQueryClient();

  // Search & Filter state for Employee Availability
  const [availSearch, setAvailSearch] = useState('');
  const [availOffice, setAvailOffice] = useState('ALL');
  const [availDept, setAvailDept] = useState('ALL');
  const [availStatus, setAvailStatus] = useState<AvailabilityFilter>('ALL');

  // Leave Requests state
  const [requestTab, setRequestTab] = useState<RequestTab>('PENDING');
  const [requestSearch, setRequestSearch] = useState('');

  // Drawers & Modals state
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequestItem | null>(null);
  const [isLeaveDetailsDrawerOpen, setIsLeaveDetailsDrawerOpen] = useState(false);

  // Approval & Rejection dialogs
  const [confirmApproveLeave, setConfirmApproveLeave] = useState<LeaveRequestItem | null>(null);
  const [rejectLeaveModal, setRejectLeaveModal] = useState<LeaveRequestItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Public Holiday state
  const [isHolidayDrawerOpen, setIsHolidayDrawerOpen] = useState(false);
  const [holidayDrawerMode, setHolidayDrawerMode] = useState<'create' | 'edit'>('create');
  const [editingHolidayId, setEditingHolidayId] = useState<number | null>(null);
  const [deleteHolidayConfirm, setDeleteHolidayConfirm] = useState<PublicHolidayItem | null>(null);
  const [holidayForm, setHolidayForm] = useState({
    name: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    officeId: '' as string | number,
    isActive: true,
  });

  // ==========================================
  // 1. DATA QUERIES
  // ==========================================

  // Query 1: Today's Workforce Availability
  const {
    data: availabilityData,
    isLoading: isLoadingAvail,
    refetch: refetchAvail,
    isFetching: isFetchingAvail,
  } = useQuery({
    queryKey: ['admin-leave-availability', availOffice, availDept, availStatus, availSearch],
    queryFn: async () => {
      try {
        const res: any = await api.get('/leaves/availability', {
          params: {
            officeId: availOffice !== 'ALL' ? availOffice : undefined,
            departmentId: availDept !== 'ALL' ? availDept : undefined,
            status: availStatus !== 'ALL' ? availStatus : undefined,
            search: availSearch.trim() || undefined,
          },
        });
        return res?.data || res || { summary: {}, records: [] };
      } catch {
        return { summary: {}, records: [] };
      }
    },
    refetchInterval: 30000,
  });

  // Query 2: Leave Requests
  const {
    data: leaveRequestsData,
    isLoading: isLoadingRequests,
    refetch: refetchRequests,
    isFetching: isFetchingRequests,
  } = useQuery({
    queryKey: ['admin-leave-requests', requestTab, requestSearch],
    queryFn: async () => {
      try {
        const res: any = await api.get('/leaves/requests', {
          params: {
            status: requestTab !== 'ALL' ? requestTab : undefined,
            search: requestSearch.trim() || undefined,
          },
        });
        return res?.data || res || { data: [], counts: {} };
      } catch {
        return { data: [], counts: {} };
      }
    },
  });

  // Query 3: Public Holidays
  const {
    data: holidaysData,
    isLoading: isLoadingHolidays,
    refetch: refetchHolidays,
  } = useQuery({
    queryKey: ['admin-public-holidays'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/leaves/holidays');
        return Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      } catch {
        return [];
      }
    },
  });

  // Query 4: Real Active Offices
  const { data: officesData } = useQuery({
    queryKey: ['active-offices-leaves'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/offices', { params: { isActive: true } });
        return Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      } catch {
        return [];
      }
    },
  });

  // Query 5: Active Departments
  const { data: departmentsData } = useQuery({
    queryKey: ['active-departments-leaves'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/departments', { params: { isActive: true } });
        return Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      } catch {
        return [];
      }
    },
  });

  const offices = Array.isArray(officesData) ? officesData : [];
  const departments = Array.isArray(departmentsData) ? departmentsData : [];
  const holidays: PublicHolidayItem[] = Array.isArray(holidaysData) ? holidaysData : [];

  const availSummary = availabilityData?.summary || {};
  const availRecords: any[] = Array.isArray(availabilityData?.records) ? availabilityData.records : [];

  const leaveRequests: LeaveRequestItem[] = Array.isArray(leaveRequestsData?.data)
    ? leaveRequestsData.data
    : Array.isArray(leaveRequestsData)
    ? leaveRequestsData
    : [];

  const requestCounts = leaveRequestsData?.counts || {
    all: leaveRequests.length,
    pending: leaveRequests.filter((r) => r.status === 'PENDING').length,
    approved: leaveRequests.filter((r) => r.status === 'APPROVED').length,
    rejected: leaveRequests.filter((r) => r.status === 'REJECTED').length,
  };

  const handleManualRefreshAll = () => {
    refetchAvail();
    refetchRequests();
    refetchHolidays();
    toast.success('Live leave & availability data refreshed');
  };

  // ==========================================
  // 2. MUTATIONS (APPROVE / REJECT / HOLIDAY)
  // ==========================================

  // Approve Leave Mutation
  const approveMutation = useMutation({
    mutationFn: async (id: number | string) => {
      return api.patch(`/leaves/requests/${id}/approve`, {});
    },
    onSuccess: (res: any) => {
      toast.success('Leave request approved successfully');
      setConfirmApproveLeave(null);
      setIsLeaveDetailsDrawerOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-leave-requests'] });
      queryClient.invalidateQueries({ queryKey: ['admin-leave-availability'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-live-attendance'] });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || 'Failed to approve leave request';
      toast.error(typeof msg === 'string' ? msg : 'Error occurred');
    },
  });

  // Reject Leave Mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: number | string; reason?: string }) => {
      return api.patch(`/leaves/requests/${id}/reject`, {
        rejectionReason: reason || undefined,
      });
    },
    onSuccess: () => {
      toast.success('Leave request rejected');
      setRejectLeaveModal(null);
      setRejectionReason('');
      setIsLeaveDetailsDrawerOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-leave-requests'] });
      queryClient.invalidateQueries({ queryKey: ['admin-leave-availability'] });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || 'Failed to reject leave request';
      toast.error(typeof msg === 'string' ? msg : 'Error occurred');
    },
  });

  // Create or Update Holiday Mutation
  const saveHolidayMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (holidayDrawerMode === 'create') {
        return api.post('/leaves/holidays', payload);
      } else {
        return api.patch(`/leaves/holidays/${editingHolidayId}`, payload);
      }
    },
    onSuccess: () => {
      toast.success(
        holidayDrawerMode === 'create'
          ? 'Public holiday declared successfully'
          : 'Public holiday updated successfully'
      );
      setIsHolidayDrawerOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-public-holidays'] });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || 'Failed to save public holiday';
      toast.error(typeof msg === 'string' ? msg : 'Validation error');
    },
  });

  // Delete Holiday Mutation
  const deleteHolidayMutation = useMutation({
    mutationFn: async (id: number) => {
      return api.delete(`/leaves/holidays/${id}`);
    },
    onSuccess: () => {
      toast.success('Public holiday deleted');
      setDeleteHolidayConfirm(null);
      queryClient.invalidateQueries({ queryKey: ['admin-public-holidays'] });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || 'Failed to delete holiday';
      toast.error(typeof msg === 'string' ? msg : 'Error occurred');
    },
  });

  const handleOpenDeclareHoliday = () => {
    setHolidayDrawerMode('create');
    setEditingHolidayId(null);
    setHolidayForm({
      name: '',
      date: new Date().toISOString().split('T')[0],
      description: '',
      officeId: '',
      isActive: true,
    });
    setIsHolidayDrawerOpen(true);
  };

  const handleOpenEditHoliday = (h: PublicHolidayItem) => {
    setHolidayDrawerMode('edit');
    setEditingHolidayId(h.id);
    setHolidayForm({
      name: h.name,
      date: h.date,
      description: h.description,
      officeId: h.officeId || '',
      isActive: h.isActive,
    });
    setIsHolidayDrawerOpen(true);
  };

  const handleSaveHolidaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!holidayForm.name.trim() || !holidayForm.date) {
      toast.error('Holiday name and date are required');
      return;
    }

    saveHolidayMutation.mutate({
      name: holidayForm.name.trim(),
      date: holidayForm.date,
      description: holidayForm.description.trim() || undefined,
      officeId: holidayForm.officeId ? Number(holidayForm.officeId) : null,
      isActive: holidayForm.isActive,
    });
  };

  const isAnyFetching = isFetchingAvail || isFetchingRequests;

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-16 text-slate-800 animate-in fade-in-50 duration-200">
      {/* =========================================================================
          1. HEADER & PRIMARY ACTIONS
          ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Leave Management
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#1AA14D] text-[11px] font-black uppercase tracking-wider border border-emerald-200/60">
              Workforce Intelligence
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Manage employee leave requests, holidays and workforce availability.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleManualRefreshAll}
            disabled={isAnyFetching}
            className="p-2.5 bg-white hover:bg-slate-50 text-slate-700 rounded-2xl border border-slate-200/80 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
            title="Refresh availability and leave requests"
          >
            <RefreshCw className={`w-4 h-4 ${isAnyFetching ? 'animate-spin text-[#23C45E]' : ''}`} />
          </button>

          <button
            onClick={handleOpenDeclareHoliday}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#23C45E] hover:bg-[#1AA14D] text-white rounded-2xl text-xs font-black shadow-md shadow-[#23C45E]/20 transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Declare Public Holiday</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          2. TODAY'S AVAILABILITY SUMMARY (5 KPI CARDS)
          ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Employees */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] uppercase font-black tracking-wider text-slate-400">
              Total Employees
            </span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {availSummary.totalEmployees ?? availRecords.length}
            </span>
            <span className="text-[11px] font-bold text-slate-400 block mt-0.5">Active Workforce</span>
          </div>
        </div>

        {/* Available */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-emerald-200/80 shadow-xs hover:border-emerald-300 transition-all flex flex-col justify-between bg-gradient-to-b from-white to-emerald-50/30">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] uppercase font-black tracking-wider text-emerald-800">
              Available
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#1AA14D] flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-emerald-950 tracking-tight">
              {availSummary.availableCount ?? 0}
            </span>
            <span className="text-[11px] font-bold text-emerald-700 block mt-0.5">On-Duty / Ready</span>
          </div>
        </div>

        {/* On Leave */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-blue-200/80 shadow-xs hover:border-blue-300 transition-all flex flex-col justify-between bg-gradient-to-b from-white to-blue-50/30">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] uppercase font-black tracking-wider text-blue-800">
              On Leave
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-blue-950 tracking-tight">
              {availSummary.onLeaveCount ?? 0}
            </span>
            <span className="text-[11px] font-bold text-blue-700 block mt-0.5">Approved Absence</span>
          </div>
        </div>

        {/* Absent */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-rose-200/80 shadow-xs hover:border-rose-300 transition-all flex flex-col justify-between bg-gradient-to-b from-white to-rose-50/30">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] uppercase font-black tracking-wider text-rose-800">
              Absent
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
              <UserX className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-rose-950 tracking-tight">
              {availSummary.absentCount ?? 0}
            </span>
            <span className="text-[11px] font-bold text-rose-700 block mt-0.5">Unexcused / Pending</span>
          </div>
        </div>

        {/* On Break */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-amber-200/80 shadow-xs hover:border-amber-300 transition-all flex flex-col justify-between bg-gradient-to-b from-white to-amber-50/30 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] uppercase font-black tracking-wider text-amber-800">
              On Break
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Coffee className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-amber-950 tracking-tight">
              {availSummary.onBreakCount ?? 0}
            </span>
            <span className="text-[11px] font-bold text-amber-700 block mt-0.5">Active Duty Paused</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          3. TODAY'S EMPLOYEE AVAILABILITY ROSTER
          ========================================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden space-y-4">
        {/* Availability Controls */}
        <div className="p-5 sm:p-6 border-b border-slate-100 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#23C45E]" />
                Today's Employee Availability
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Live duty tracking, active shift presence, and real-time status across assigned office geofences.
              </p>
            </div>
          </div>

          {/* Search and Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={availSearch}
                onChange={(e) => setAvailSearch(e.target.value)}
                placeholder="Search staff name or ID..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
              />
            </div>

            {/* Office Filter */}
            <select
              value={availOffice}
              onChange={(e) => setAvailOffice(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
            >
              <option value="ALL">All Assigned Offices</option>
              {offices.map((o: any) => (
                <option key={o.id} value={o.id}>
                  {o.name} {o.city ? `(${o.city})` : ''}
                </option>
              ))}
            </select>

            {/* Department Filter */}
            <select
              value={availDept}
              onChange={(e) => setAvailDept(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
            >
              <option value="ALL">All Departments</option>
              {departments.map((d: any) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={availStatus}
              onChange={(e) => setAvailStatus(e.target.value as AvailabilityFilter)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
            >
              <option value="ALL">All Availability Statuses</option>
              <option value="AVAILABLE">Available (On-Duty)</option>
              <option value="ON_LEAVE">On Leave</option>
              <option value="ABSENT">Absent</option>
              <option value="ON_BREAK">On Break</option>
            </select>
          </div>
        </div>

        {/* Availability Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-400 uppercase font-black tracking-wider text-[10px] border-b border-slate-100">
                <th className="py-3 px-6">Employee</th>
                <th className="py-3 px-6">Employee ID</th>
                <th className="py-3 px-6">Office</th>
                <th className="py-3 px-6">Department</th>
                <th className="py-3 px-6">Designation</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6">Check-In</th>
                <th className="py-3 px-6">Break</th>
                <th className="py-3 px-6">Last Activity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {isLoadingAvail ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#23C45E]" />
                    <p className="mt-2 text-xs font-bold">Querying live workforce availability...</p>
                  </td>
                </tr>
              ) : availRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <AlertCircle className="w-8 h-8 mx-auto text-slate-300" />
                    <p className="mt-2 text-xs font-bold text-slate-600">
                      No employee availability data found.
                    </p>
                  </td>
                </tr>
              ) : (
                availRecords.map((r: any) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 font-black text-xs flex items-center justify-center border border-slate-200">
                          {r.name?.charAt(0) || 'E'}
                        </div>
                        <span className="font-extrabold text-slate-900">{r.name}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-6 font-mono font-bold text-slate-600">
                      {r.employeeCode}
                    </td>

                    <td className="py-3.5 px-6">
                      <span className="font-bold text-slate-800 block">{r.office}</span>
                      {r.officeCity && (
                        <span className="text-[10px] text-slate-400 block">{r.officeCity}</span>
                      )}
                    </td>

                    <td className="py-3.5 px-6 font-bold text-slate-700">{r.department}</td>

                    <td className="py-3.5 px-6 text-slate-600">{r.designation}</td>

                    <td className="py-3.5 px-6">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider ${
                          r.status === 'AVAILABLE'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : r.status === 'ON_LEAVE'
                            ? 'bg-blue-50 text-blue-800 border border-blue-200'
                            : r.status === 'ON_BREAK'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            r.status === 'AVAILABLE'
                              ? 'bg-[#23C45E] animate-pulse'
                              : r.status === 'ON_LEAVE'
                              ? 'bg-blue-500'
                              : r.status === 'ON_BREAK'
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                        />
                        {r.status?.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="py-3.5 px-6 font-mono text-xs font-bold text-slate-800">
                      {r.checkIn}
                    </td>

                    <td className="py-3.5 px-6 font-mono text-xs text-slate-600">{r.break}</td>

                    <td className="py-3.5 px-6 text-xs text-slate-500 font-medium">
                      {r.lastActivity}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================================================
          4. LEAVE REQUEST MANAGEMENT SECTION
          ========================================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden space-y-4">
        <div className="p-5 sm:p-6 border-b border-slate-100 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-[#23C45E]" />
                Leave Requests Management
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Review submitted leave applications, approve staff absences, and track leave histories.
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={requestSearch}
                onChange={(e) => setRequestSearch(e.target.value)}
                placeholder="Search requests..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
              />
            </div>
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            {[
              { key: 'PENDING' as RequestTab, label: 'Pending', count: requestCounts.pending },
              { key: 'APPROVED' as RequestTab, label: 'Approved', count: requestCounts.approved },
              { key: 'REJECTED' as RequestTab, label: 'Rejected', count: requestCounts.rejected },
              { key: 'ALL' as RequestTab, label: 'All Requests', count: requestCounts.all },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setRequestTab(tab.key)}
                className={`px-4 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                  requestTab === tab.key
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    requestTab === tab.key
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Leave Requests Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-400 uppercase font-black tracking-wider text-[10px] border-b border-slate-100">
                <th className="py-3 px-6">Employee</th>
                <th className="py-3 px-6">Employee ID</th>
                <th className="py-3 px-6">Department</th>
                <th className="py-3 px-6">Office</th>
                <th className="py-3 px-6">Leave Type</th>
                <th className="py-3 px-6">From Date</th>
                <th className="py-3 px-6">To Date</th>
                <th className="py-3 px-6">Days</th>
                <th className="py-3 px-6">Reason</th>
                <th className="py-3 px-6">Applied On</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {isLoadingRequests ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#23C45E]" />
                    <p className="mt-2 text-xs font-bold">Loading leave applications...</p>
                  </td>
                </tr>
              ) : leaveRequests.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-slate-400">
                    <FileText className="w-8 h-8 mx-auto text-slate-300" />
                    <p className="mt-2 text-xs font-bold text-slate-600">No leave requests found.</p>
                  </td>
                </tr>
              ) : (
                leaveRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-6 font-extrabold text-slate-900">
                      {req.employeeName}
                    </td>

                    <td className="py-3.5 px-6 font-mono font-bold text-slate-600">
                      {req.employeeCode}
                    </td>

                    <td className="py-3.5 px-6 text-slate-700 font-bold">{req.department}</td>

                    <td className="py-3.5 px-6 text-slate-700">{req.office}</td>

                    <td className="py-3.5 px-6">
                      <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-800 font-extrabold text-[11px]">
                        {req.leaveType}
                      </span>
                    </td>

                    <td className="py-3.5 px-6 font-mono font-bold text-slate-800">
                      {req.fromDate}
                    </td>

                    <td className="py-3.5 px-6 font-mono font-bold text-slate-800">{req.toDate}</td>

                    <td className="py-3.5 px-6 font-black text-[#1AA14D]">
                      {req.totalDays} {req.totalDays === 1 ? 'Day' : 'Days'}
                    </td>

                    <td className="py-3.5 px-6 text-slate-600 max-w-[180px] truncate" title={req.reason}>
                      {req.reason || '—'}
                    </td>

                    <td className="py-3.5 px-6 font-mono text-[11px] text-slate-500">
                      {req.appliedOn}
                    </td>

                    <td className="py-3.5 px-6">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider ${
                          req.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : req.status === 'PENDING'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {req.status === 'APPROVED' && <CheckCircle className="w-3 h-3" />}
                        {req.status === 'PENDING' && <Clock className="w-3 h-3" />}
                        {req.status === 'REJECTED' && <XCircle className="w-3 h-3" />}
                        {req.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedLeave(req);
                            setIsLeaveDetailsDrawerOpen(true);
                          }}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {req.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => setConfirmApproveLeave(req)}
                              className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#1AA14D] rounded-xl transition-colors cursor-pointer border border-emerald-200/60"
                              title="Approve Leave"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setRejectLeaveModal(req);
                                setRejectionReason('');
                              }}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-colors cursor-pointer border border-rose-200/60"
                              title="Reject Leave"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================================================
          5. PUBLIC HOLIDAY MANAGEMENT SECTION
          ========================================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden space-y-4">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#23C45E]" />
              Public Holidays
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Declare official company and regional office holidays recognized across the workforce schedule.
            </p>
          </div>

          <button
            onClick={handleOpenDeclareHoliday}
            className="flex items-center gap-2 px-4 py-2 bg-[#23C45E] hover:bg-[#1AA14D] text-white rounded-2xl text-xs font-black shadow-md shadow-[#23C45E]/20 transition-all cursor-pointer w-fit active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Declare Public Holiday</span>
          </button>
        </div>

        {/* Public Holidays Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-400 uppercase font-black tracking-wider text-[10px] border-b border-slate-100">
                <th className="py-3 px-6">Holiday Name</th>
                <th className="py-3 px-6">Date</th>
                <th className="py-3 px-6">Applicable Office</th>
                <th className="py-3 px-6">Description</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {isLoadingHolidays ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#23C45E]" />
                    <p className="mt-2 text-xs font-bold">Loading public holidays...</p>
                  </td>
                </tr>
              ) : holidays.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Calendar className="w-8 h-8 mx-auto text-slate-300" />
                    <p className="mt-2 text-xs font-bold text-slate-600">No public holidays declared.</p>
                  </td>
                </tr>
              ) : (
                holidays.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-6 font-extrabold text-slate-900">{h.name}</td>

                    <td className="py-3.5 px-6 font-mono font-bold text-slate-800">{h.date}</td>

                    <td className="py-3.5 px-6">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 text-slate-800 font-bold text-[11px]">
                        <Building2 className="w-3.5 h-3.5 text-slate-500" />
                        {h.scope}
                      </span>
                    </td>

                    <td className="py-3.5 px-6 text-slate-500">{h.description || '—'}</td>

                    <td className="py-3.5 px-6">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider ${
                          h.isActive
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {h.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEditHoliday(h)}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer"
                          title="Edit Holiday"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteHolidayConfirm(h)}
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-colors cursor-pointer"
                          title="Delete Holiday"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================================================
          6. RIGHT-SIDE DRAWER: LEAVE REQUEST DETAILS
          ========================================================================= */}
      <AdminFormDrawer
        isOpen={isLeaveDetailsDrawerOpen}
        onClose={() => setIsLeaveDetailsDrawerOpen(false)}
        title={selectedLeave ? `Leave Application #${selectedLeave.id}` : 'Leave Details'}
        subtitle="Review employee leave request details and take approval actions"
        icon={CalendarDays}
        maxWidth="max-w-xl"
        footer={
          selectedLeave && selectedLeave.status === 'PENDING' ? (
            <div className="flex items-center justify-end gap-3 w-full">
              <button
                type="button"
                onClick={() => {
                  setRejectLeaveModal(selectedLeave);
                  setRejectionReason('');
                }}
                className="px-5 py-2.5 rounded-2xl border border-rose-200 text-rose-600 hover:bg-rose-50 font-black text-xs transition-colors cursor-pointer"
              >
                Reject Request
              </button>
              <button
                type="button"
                onClick={() => setConfirmApproveLeave(selectedLeave)}
                className="px-6 py-2.5 bg-[#23C45E] hover:bg-[#1AA14D] text-white rounded-2xl font-black text-xs shadow-md shadow-[#23C45E]/20 transition-all cursor-pointer"
              >
                Approve Leave
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsLeaveDetailsDrawerOpen(false)}
              className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl font-black text-xs transition-colors cursor-pointer"
            >
              Close
            </button>
          )
        }
      >
        {selectedLeave && (
          <div className="space-y-6">
            {/* Status Banner */}
            <div
              className={`p-4 rounded-2xl flex items-center justify-between border ${
                selectedLeave.status === 'APPROVED'
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                  : selectedLeave.status === 'PENDING'
                  ? 'bg-amber-50 text-amber-900 border-amber-200'
                  : 'bg-rose-50 text-rose-900 border-rose-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {selectedLeave.status === 'APPROVED' && <CheckCircle className="w-5 h-5 text-[#23C45E]" />}
                {selectedLeave.status === 'PENDING' && <Clock className="w-5 h-5 text-amber-600" />}
                {selectedLeave.status === 'REJECTED' && <XCircle className="w-5 h-5 text-rose-600" />}
                <div>
                  <span className="text-xs font-black uppercase tracking-wider block">
                    Application Status: {selectedLeave.status}
                  </span>
                  <span className="text-[11px] font-medium opacity-80">
                    Applied on {selectedLeave.appliedOn}
                  </span>
                </div>
              </div>

              <span className="text-xs font-mono font-black px-2.5 py-1 rounded-xl bg-white/70 shadow-2xs">
                {selectedLeave.totalDays} {selectedLeave.totalDays === 1 ? 'Day' : 'Days'}
              </span>
            </div>

            {/* Section 1: Employee Information */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60">
                <User className="w-4 h-4 text-[#23C45E]" />
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wide">
                  Employee Information
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase block">Name</span>
                  <span className="font-extrabold text-slate-900 text-sm">
                    {selectedLeave.employeeName}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase block">
                    Employee ID
                  </span>
                  <span className="font-mono font-bold text-slate-800">
                    {selectedLeave.employeeCode}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase block">
                    Department
                  </span>
                  <span className="font-bold text-slate-800">{selectedLeave.department}</span>
                </div>

                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase block">
                    Designation
                  </span>
                  <span className="font-bold text-slate-800">
                    {selectedLeave.employee?.designation || 'Staff'}
                  </span>
                </div>

                <div className="col-span-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase block">
                    Assigned Office Location
                  </span>
                  <span className="font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    {selectedLeave.office}
                  </span>
                </div>
              </div>
            </div>

            {/* Section 2: Leave Details */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60">
                <CalendarDays className="w-4 h-4 text-[#23C45E]" />
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wide">
                  Leave Details & Dates
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase block">
                    Leave Type
                  </span>
                  <span className="font-black text-slate-900">{selectedLeave.leaveType}</span>
                </div>

                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase block">
                    Total Duration
                  </span>
                  <span className="font-black text-[#1AA14D]">
                    {selectedLeave.totalDays} {selectedLeave.totalDays === 1 ? 'Day' : 'Days'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase block">
                    From Date
                  </span>
                  <span className="font-mono font-bold text-slate-800">
                    {selectedLeave.fromDate}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase block">
                    To Date
                  </span>
                  <span className="font-mono font-bold text-slate-800">{selectedLeave.toDate}</span>
                </div>

                <div className="col-span-2 pt-1 border-t border-slate-200/50">
                  <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">
                    Employee Reason
                  </span>
                  <p className="text-xs font-medium text-slate-700 bg-white p-3 rounded-xl border border-slate-200/70 leading-relaxed">
                    {selectedLeave.reason || 'No specific reason provided by employee.'}
                  </p>
                </div>

                {selectedLeave.rejectionReason && (
                  <div className="col-span-2 pt-1">
                    <span className="text-[10px] font-black text-rose-600 uppercase block mb-1">
                      Rejection Remarks
                    </span>
                    <p className="text-xs font-bold text-rose-900 bg-rose-50 p-3 rounded-xl border border-rose-200 leading-relaxed">
                      {selectedLeave.rejectionReason}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </AdminFormDrawer>

      {/* =========================================================================
          7. RIGHT-SIDE DRAWER: DECLARE / EDIT PUBLIC HOLIDAY
          ========================================================================= */}
      <AdminFormDrawer
        isOpen={isHolidayDrawerOpen}
        onClose={() => setIsHolidayDrawerOpen(false)}
        title={holidayDrawerMode === 'create' ? 'Declare Public Holiday' : 'Edit Public Holiday'}
        subtitle="Configure official company holidays and regional office dates"
        icon={Calendar}
        maxWidth="max-w-md"
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <button
              type="button"
              disabled={saveHolidayMutation.isPending}
              onClick={() => setIsHolidayDrawerOpen(false)}
              className="px-4 py-2.5 rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={saveHolidayMutation.isPending}
              onClick={handleSaveHolidaySubmit}
              className="px-6 py-2.5 bg-[#23C45E] hover:bg-[#1AA14D] text-white rounded-2xl font-black text-xs shadow-md shadow-[#23C45E]/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {saveHolidayMutation.isPending
                ? 'Saving...'
                : holidayDrawerMode === 'create'
                ? 'Declare Holiday'
                : 'Save Changes'}
            </button>
          </div>
        }
      >
        <form onSubmit={handleSaveHolidaySubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-black text-slate-700 uppercase mb-1">
              Holiday Name *
            </label>
            <input
              type="text"
              required
              value={holidayForm.name}
              onChange={(e) => setHolidayForm({ ...holidayForm, name: e.target.value })}
              placeholder="e.g. Independence Day, Diwali"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-black text-slate-700 uppercase mb-1">
              Holiday Date *
            </label>
            <input
              type="date"
              required
              value={holidayForm.date}
              onChange={(e) => setHolidayForm({ ...holidayForm, date: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-black text-slate-700 uppercase mb-1">
              Applicable Office / Location Scope
            </label>
            <select
              value={holidayForm.officeId}
              onChange={(e) => setHolidayForm({ ...holidayForm, officeId: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
            >
              <option value="">All Offices (Company-wide)</option>
              {offices.map((o: any) => (
                <option key={o.id} value={o.id}>
                  {o.name} {o.city ? `(${o.city})` : ''} (Branch Specific)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-black text-slate-700 uppercase mb-1">
              Description (Optional)
            </label>
            <textarea
              rows={3}
              value={holidayForm.description}
              onChange={(e) => setHolidayForm({ ...holidayForm, description: e.target.value })}
              placeholder="Add description or notes regarding this holiday..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
            />
          </div>

          <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
            <div>
              <span className="text-xs font-black text-slate-800 block">Holiday Status</span>
              <span className="text-[11px] text-slate-500 font-medium">
                Active holidays are recognized in workforce availability
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={holidayForm.isActive}
                onChange={(e) => setHolidayForm({ ...holidayForm, isActive: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#23C45E]" />
            </label>
          </div>
        </form>
      </AdminFormDrawer>

      {/* =========================================================================
          8. CONFIRMATION MODALS (APPROVE / REJECT / DELETE HOLIDAY)
          ========================================================================= */}
      {/* Approve Confirmation Modal */}
      {confirmApproveLeave && (
        <div className="fixed inset-0 z-60 overflow-hidden flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => !approveMutation.isPending && setConfirmApproveLeave(null)}
          />
          <div className="relative bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl z-10 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#1AA14D] flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-[#23C45E]" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Approve Leave Request</h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  Confirm approval for {confirmApproveLeave.employeeName}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Are you sure you want to approve <strong>{confirmApproveLeave.leaveType}</strong> for{' '}
              <strong>{confirmApproveLeave.employeeName}</strong> from{' '}
              <strong>{confirmApproveLeave.fromDate}</strong> to{' '}
              <strong>{confirmApproveLeave.toDate}</strong> ({confirmApproveLeave.totalDays} Days)?
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={approveMutation.isPending}
                onClick={() => setConfirmApproveLeave(null)}
                className="px-4 py-2 rounded-2xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={approveMutation.isPending}
                onClick={() => approveMutation.mutate(confirmApproveLeave.id)}
                className="px-6 py-2 bg-[#23C45E] hover:bg-[#1AA14D] text-white rounded-2xl font-black text-xs transition-all shadow-md shadow-[#23C45E]/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {approveMutation.isPending ? (
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>Confirm Approve</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectLeaveModal && (
        <div className="fixed inset-0 z-60 overflow-hidden flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => !rejectMutation.isPending && setRejectLeaveModal(null)}
          />
          <div className="relative bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl z-10 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Reject Leave Request</h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  Provide reason for declining {rejectLeaveModal.employeeName}'s application
                </p>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-700 uppercase mb-1">
                Rejection Reason
              </label>
              <textarea
                rows={3}
                required
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter rejection reason to inform employee..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={rejectMutation.isPending}
                onClick={() => setRejectLeaveModal(null)}
                className="px-4 py-2 rounded-2xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={rejectMutation.isPending}
                onClick={() =>
                  rejectMutation.mutate({
                    id: rejectLeaveModal.id,
                    reason: rejectionReason,
                  })
                }
                className="px-6 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black text-xs transition-all shadow-md shadow-rose-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {rejectMutation.isPending ? (
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <X className="w-3.5 h-3.5" />
                )}
                <span>Reject Application</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Holiday Confirm Modal */}
      {deleteHolidayConfirm && (
        <div className="fixed inset-0 z-60 overflow-hidden flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => !deleteHolidayMutation.isPending && setDeleteHolidayConfirm(null)}
          />
          <div className="relative bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl z-10 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Delete Public Holiday</h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  {deleteHolidayConfirm.name} ({deleteHolidayConfirm.date})
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 font-medium">
              Are you sure you want to remove this public holiday? It will no longer be considered in workforce availability calculations.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={deleteHolidayMutation.isPending}
                onClick={() => setDeleteHolidayConfirm(null)}
                className="px-4 py-2 rounded-2xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={deleteHolidayMutation.isPending}
                onClick={() => deleteHolidayMutation.mutate(deleteHolidayConfirm.id)}
                className="px-6 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black text-xs transition-all shadow-md shadow-rose-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {deleteHolidayMutation.isPending ? (
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
