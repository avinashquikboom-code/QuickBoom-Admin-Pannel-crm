'use client';

import React, { useState } from 'react';
import {
  Laptop,
  CheckCircle,
  XCircle,
  Clock,
  Check,
  X,
  Search,
  Building2,
  Calendar,
  User,
  Users,
  Eye,
  RefreshCw,
  AlertCircle,
  FileText,
  Briefcase,
  Sliders,
  CalendarDays,
  Coffee,
  ShieldCheck,
  MapPin,
  TrendingUp,
} from 'lucide-react';
import api from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { AdminFormDrawer, AdminPagination } from '@/components/admin';
import { getErrorMessage, formatTimeIST } from '@/lib/utils';

type RequestTab = 'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL';
type DateRangeFilter = 'ALL' | 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH';

interface RemoteRequestItem {
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
    phone?: string;
    department: string;
    designation: string;
    office: string;
    officeCity?: string;
  } | null;
  office: string;
  department: string;
  designation: string;
  remoteWorkDate: string;
  fromDate: string;
  toDate: string;
  days: number;
  duration: string;
  reason: string;
  attachmentUrl?: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  rejectionReason?: string | null;
  approvedByName?: string | null;
  approvedAt?: string | null;
  rejectedByName?: string | null;
  rejectedAt?: string | null;
  appliedOn: string;
  createdAt: string;
}

interface TodayRemoteWorkerItem {
  id: number;
  employeeId: number;
  employeeCode: string;
  name: string;
  office: string;
  department: string;
  designation: string;
  remoteWorkDate: string;
  attendanceStatus: string;
  punchIn: string;
  break: string;
  punchOut: string;
  workingHours: number;
}

export default function RemoteWorkPage() {
  const queryClient = useQueryClient();

  // Primary Tab state (default: PENDING as per requirement)
  const [requestTab, setRequestTab] = useState<RequestTab>('PENDING');

  // Search and Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOffice, setSelectedOffice] = useState('ALL');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedDateRange, setSelectedDateRange] = useState<DateRangeFilter>('ALL');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Drawers and Modals
  const [selectedRequest, setSelectedRequest] = useState<RemoteRequestItem | null>(null);
  const [isViewDrawerOpen, setIsViewDrawerOpen] = useState(false);

  // Approval & Rejection dialogs
  const [confirmApproveReq, setConfirmApproveReq] = useState<RemoteRequestItem | null>(null);
  const [rejectModalReq, setRejectModalReq] = useState<RemoteRequestItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // ==========================================
  // 1. DATA QUERIES
  // ==========================================

  // Query 1: Remote Work Requests List & Summary
  const {
    data: remoteData,
    isLoading: isLoadingRequests,
    refetch: refetchRequests,
    isFetching: isFetchingRequests,
  } = useQuery({
    queryKey: [
      'admin-remote-requests',
      requestTab,
      searchTerm,
      selectedOffice,
      selectedDept,
      selectedDateRange,
      page,
      pageSize,
    ],
    queryFn: async () => {
      try {
        const res: any = await api.get('/remote-requests', {
          params: {
            status: requestTab !== 'ALL' ? requestTab : undefined,
            search: searchTerm.trim() || undefined,
            officeId: selectedOffice !== 'ALL' ? selectedOffice : undefined,
            departmentId: selectedDept !== 'ALL' ? selectedDept : undefined,
            dateRange: selectedDateRange !== 'ALL' ? selectedDateRange : undefined,
            page,
            limit: pageSize,
          },
        });
        const items = res?.data?.requests || res?.data?.items || res?.data?.data || res?.requests || res?.items || (Array.isArray(res) ? res : []);
        const pagination = res?.pagination || res?.meta || res?.data?.pagination || res?.data?.meta || {
          page,
          pageSize,
          total: Array.isArray(items) ? items.length : 0,
          totalPages: 1,
        };
        return {
          summary: res?.data?.summary || res?.summary || {},
          requests: Array.isArray(items) ? items : [],
          pagination: {
            page: Number(pagination.page) || page,
            pageSize: Number(pagination.pageSize || pagination.limit) || pageSize,
            total: Number(pagination.total) || (Array.isArray(items) ? items.length : 0),
            totalPages: Number(pagination.totalPages) || 1,
          },
        };
      } catch (err) {
        toast.error(getErrorMessage(err));
        return { summary: {}, requests: [], pagination: { page: 1, pageSize, total: 0, totalPages: 1 } };
      }
    },
  });

  // Query 2: Today's Remote Workers Roster with Live Attendance
  const {
    data: todayRemoteData,
    isLoading: isLoadingToday,
    refetch: refetchToday,
    isFetching: isFetchingToday,
  } = useQuery({
    queryKey: ['admin-today-remote-workers'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/remote-requests/today');
        return Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      } catch {
        return [];
      }
    },
    refetchInterval: 30000,
  });

  // Query 3: Offices & Departments for Filters & Form
  const { data: officesData } = useQuery({
    queryKey: ['active-offices-remote'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/offices', { params: { isActive: true } });
        return Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      } catch {
        return [];
      }
    },
  });

  const { data: departmentsData } = useQuery({
    queryKey: ['active-departments-remote'],
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

  const summary = remoteData?.summary || {
    totalRequests: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    todayRemoteWork: 0,
  };

  const requests: RemoteRequestItem[] = Array.isArray(remoteData?.requests)
    ? (remoteData.requests as any)
    : [];

  const todayWorkers: TodayRemoteWorkerItem[] = Array.isArray(todayRemoteData)
    ? todayRemoteData
    : [];

  const handleManualRefreshAll = () => {
    refetchRequests();
    refetchToday();
    toast.success('Live remote work requests & attendance refreshed');
  };

  // ==========================================
  // 2. MUTATIONS
  // ==========================================

  // Approve Mutation
  const approveMutation = useMutation({
    mutationFn: async (id: number | string) => {
      return api.patch(`/remote-requests/${id}/approve`, {});
    },
    onSuccess: (res: any) => {
      const msg = res?.data?.message || res?.message || 'Remote work request approved successfully';
      toast.success(typeof msg === 'string' ? msg : 'Approved');
      setConfirmApproveReq(null);
      setIsViewDrawerOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-remote-requests'] });
      queryClient.invalidateQueries({ queryKey: ['admin-today-remote-workers'] });
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err));
    },
  });

  // Reject Mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: number | string; reason: string }) => {
      return api.patch(`/remote-requests/${id}/reject`, {
        rejectionReason: reason,
      });
    },
    onSuccess: (res: any) => {
      const msg = res?.data?.message || res?.message || 'Remote work request rejected';
      toast.success(typeof msg === 'string' ? msg : 'Rejected');
      setRejectModalReq(null);
      setRejectionReason('');
      setIsViewDrawerOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-remote-requests'] });
      queryClient.invalidateQueries({ queryKey: ['admin-today-remote-workers'] });
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err));
    },
  });

  const isAnyFetching = isFetchingRequests || isFetchingToday;

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-16 text-slate-800 animate-in fade-in-50 duration-200">
      {/* =========================================================================
          1. HEADER & PRIMARY ACTIONS HERO CARD
          ========================================================================= */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-slate-700/60 shadow-xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-[#23C45E]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-[#23C45E] border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-[#23C45E] animate-pulse" />
                Remote Work
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Remote Work Management
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-2xl leading-relaxed">
              Review and manage employee remote work requests and approvals.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleManualRefreshAll}
              disabled={isAnyFetching}
              className="p-2.5 bg-white/10 hover:bg-white/15 text-white rounded-2xl border border-white/10 text-xs font-black transition-all cursor-pointer backdrop-blur-xs disabled:opacity-50 active:scale-95"
              title="Refresh all data"
            >
              <RefreshCw className={`w-4 h-4 ${isAnyFetching ? 'animate-spin text-[#23C45E]' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          2. TOP SUMMARY 5 KPI CARDS
          ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* TOTAL REQUESTS */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] uppercase font-black tracking-wider text-slate-400">
              Total Requests
            </span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <Laptop className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {summary.totalRequests ?? 0}
            </span>
            <span className="text-[11px] font-bold text-slate-400 block mt-0.5">All Submissions</span>
          </div>
        </div>

        {/* PENDING */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-amber-200/80 shadow-xs flex flex-col justify-between bg-gradient-to-b from-white to-amber-50/30">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] uppercase font-black tracking-wider text-amber-800">
              Pending
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-amber-950 tracking-tight">
              {summary.pending ?? 0}
            </span>
            <span className="text-[11px] font-bold text-amber-700 block mt-0.5">
              Requires HR Action
            </span>
          </div>
        </div>

        {/* APPROVED */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-emerald-200/80 shadow-xs flex flex-col justify-between bg-gradient-to-b from-white to-emerald-50/30">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] uppercase font-black tracking-wider text-emerald-800">
              Approved
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#1AA14D] flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-emerald-950 tracking-tight">
              {summary.approved ?? 0}
            </span>
            <span className="text-[11px] font-bold text-emerald-700 block mt-0.5">
              Authorized WFH
            </span>
          </div>
        </div>

        {/* REJECTED */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-rose-200/80 shadow-xs flex flex-col justify-between bg-gradient-to-b from-white to-rose-50/30">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] uppercase font-black tracking-wider text-rose-800">
              Rejected
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-rose-950 tracking-tight">
              {summary.rejected ?? 0}
            </span>
            <span className="text-[11px] font-bold text-rose-700 block mt-0.5">Declined / Closed</span>
          </div>
        </div>

        {/* TODAY REMOTE WORK */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-indigo-200/80 shadow-xs flex flex-col justify-between bg-gradient-to-b from-white to-indigo-50/30 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] uppercase font-black tracking-wider text-indigo-800">
              Today Remote Work
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-indigo-950 tracking-tight">
              {summary.todayRemoteWork ?? todayWorkers.length}
            </span>
            <span className="text-[11px] font-bold text-indigo-700 block mt-0.5">
              Active Today Off-Site
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          3. REQUEST TABS & FILTERS
          ========================================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden space-y-4">
        <div className="p-5 sm:p-6 border-b border-slate-100 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Status Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {[
                { key: 'PENDING' as RequestTab, label: 'Pending', count: summary.pending },
                { key: 'APPROVED' as RequestTab, label: 'Approved', count: summary.approved },
                { key: 'REJECTED' as RequestTab, label: 'Rejected', count: summary.rejected },
                { key: 'ALL' as RequestTab, label: 'All', count: summary.totalRequests },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setRequestTab(tab.key)}
                  className={`px-4 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                    requestTab === tab.key
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      requestTab === tab.key ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {tab.count ?? 0}
                  </span>
                </button>
              ))}
            </div>

            {/* Quick Search */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search staff name or ID..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
              />
            </div>
          </div>

          {/* Secondary Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <select
              value={selectedOffice}
              onChange={(e) => setSelectedOffice(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
            >
              <option value="ALL">All Assigned Offices</option>
              {offices.map((o: any) => (
                <option key={o.id} value={o.id}>
                  {o.name} {o.city ? `(${o.city})` : ''}
                </option>
              ))}
            </select>

            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
            >
              <option value="ALL">All Departments</option>
              {departments.map((d: any) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>

            <select
              value={selectedDateRange}
              onChange={(e) => setSelectedDateRange(e.target.value as DateRangeFilter)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
            >
              <option value="ALL">All Dates</option>
              <option value="TODAY">Today</option>
              <option value="THIS_WEEK">This Week</option>
              <option value="THIS_MONTH">This Month</option>
            </select>
          </div>
        </div>

        {/* =========================================================================
            4. REMOTE WORK REQUESTS TABLE
            ========================================================================= */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-400 uppercase font-black tracking-wider text-[10px] border-b border-slate-100">
                <th className="py-3 px-6">Employee</th>
                <th className="py-3 px-6">Employee ID</th>
                <th className="py-3 px-6">Office</th>
                <th className="py-3 px-6">Department</th>
                <th className="py-3 px-6">Designation</th>
                <th className="py-3 px-6">Remote Work Date</th>
                <th className="py-3 px-6">Duration</th>
                <th className="py-3 px-6">Reason</th>
                <th className="py-3 px-6">Applied On</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {isLoadingRequests ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#23C45E]" />
                    <p className="mt-2 text-xs font-bold">Loading remote work requests...</p>
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    <Laptop className="w-8 h-8 mx-auto text-slate-300" />
                    <p className="mt-2 text-xs font-bold text-slate-600">
                      No remote work requests found.
                    </p>
                  </td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-6 font-extrabold text-slate-900">{req.employeeName}</td>
                    <td className="py-3.5 px-6 font-mono font-bold text-slate-600">
                      {req.employeeCode}
                    </td>
                    <td className="py-3.5 px-6 font-bold text-slate-800">{req.office}</td>
                    <td className="py-3.5 px-6 text-slate-700">{req.department}</td>
                    <td className="py-3.5 px-6 text-slate-600">{req.designation}</td>
                    <td className="py-3.5 px-6 font-mono font-bold text-slate-800">
                      {req.remoteWorkDate}
                    </td>
                    <td className="py-3.5 px-6 font-black text-[#1AA14D]">{req.duration}</td>
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
                            setSelectedRequest(req);
                            setIsViewDrawerOpen(true);
                          }}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-[11px] transition-colors cursor-pointer"
                        >
                          View
                        </button>

                        {req.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => setConfirmApproveReq(req)}
                              className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#1AA14D] border border-emerald-200/60 rounded-xl font-black text-[11px] transition-colors cursor-pointer"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                setRejectModalReq(req);
                                setRejectionReason('');
                              }}
                              className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/60 rounded-xl font-black text-[11px] transition-colors cursor-pointer"
                            >
                              Reject
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

        {/* Server-Side Pagination for Remote Work Requests */}
        <AdminPagination
          page={page}
          pageSize={pageSize}
          total={remoteData?.pagination?.total || requests.length}
          totalPages={remoteData?.pagination?.totalPages || 1}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
          disabled={isLoadingRequests}
        />
      </div>

      {/* =========================================================================
          5. TODAY'S REMOTE WORK SECTION (LIVE ATTENDANCE INTEGRATED)
          ========================================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden space-y-4">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-600" />
              Today's Remote Work
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Real-time attendance, check-in time and breaks of employees on authorized remote work today.
            </p>
          </div>
          <span className="px-3 py-1 rounded-2xl bg-indigo-50 text-indigo-800 font-mono font-black text-xs border border-indigo-200/60 w-fit">
            {todayWorkers.length} Active Today
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-400 uppercase font-black tracking-wider text-[10px] border-b border-slate-100">
                <th className="py-3 px-6">Employee</th>
                <th className="py-3 px-6">Employee ID</th>
                <th className="py-3 px-6">Office</th>
                <th className="py-3 px-6">Department</th>
                <th className="py-3 px-6">Remote Work Date</th>
                <th className="py-3 px-6">Attendance Status</th>
                <th className="py-3 px-6">Punch In</th>
                <th className="py-3 px-6">Break</th>
                <th className="py-3 px-6">Punch Out</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {isLoadingToday ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-600" />
                    <p className="mt-2 text-xs font-bold">Querying today's remote workers...</p>
                  </td>
                </tr>
              ) : todayWorkers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <AlertCircle className="w-8 h-8 mx-auto text-slate-300" />
                    <p className="mt-2 text-xs font-bold text-slate-600">
                      No employees scheduled for remote work today.
                    </p>
                  </td>
                </tr>
              ) : (
                todayWorkers.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-6 font-extrabold text-slate-900">{w.name}</td>
                    <td className="py-3.5 px-6 font-mono font-bold text-slate-600">{w.employeeCode}</td>
                    <td className="py-3.5 px-6 font-bold text-slate-800">{w.office}</td>
                    <td className="py-3.5 px-6 text-slate-700">{w.department}</td>
                    <td className="py-3.5 px-6 font-mono font-bold text-slate-800">{w.remoteWorkDate}</td>
                    <td className="py-3.5 px-6">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-indigo-50 text-indigo-800 font-black text-[10px] uppercase tracking-wider border border-indigo-200/60">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
                        REMOTE
                      </span>
                    </td>
                    <td className="py-3.5 px-6 font-mono font-bold text-slate-800">{formatTimeIST(w.punchIn)}</td>
                    <td className="py-3.5 px-6 font-mono text-slate-600">{w.break}</td>
                    <td className="py-3.5 px-6 font-mono text-slate-600">{formatTimeIST(w.punchOut)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================================================
          DRAWER 1: VIEW REMOTE WORK REQUEST DETAILS
          ========================================================================= */}
      <AdminFormDrawer
        isOpen={isViewDrawerOpen}
        onClose={() => setIsViewDrawerOpen(false)}
        title={selectedRequest ? `Remote Work Request #${selectedRequest.id}` : 'Request Details'}
        subtitle="Review employee remote work application & take administrative action"
        icon={Laptop}
        maxWidth="max-w-xl"
        footer={
          selectedRequest && selectedRequest.status === 'PENDING' ? (
            <div className="flex items-center justify-end gap-3 w-full">
              <button
                type="button"
                onClick={() => {
                  setRejectModalReq(selectedRequest);
                  setRejectionReason('');
                }}
                className="px-5 py-2.5 rounded-2xl border border-rose-200 text-rose-600 hover:bg-rose-50 font-black text-xs transition-colors cursor-pointer"
              >
                Reject Request
              </button>
              <button
                type="button"
                onClick={() => setConfirmApproveReq(selectedRequest)}
                className="px-6 py-2.5 bg-[#23C45E] hover:bg-[#1AA14D] text-white rounded-2xl font-black text-xs shadow-md shadow-[#23C45E]/20 transition-all cursor-pointer"
              >
                Approve Request
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsViewDrawerOpen(false)}
              className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl font-black text-xs transition-colors cursor-pointer"
            >
              Close
            </button>
          )
        }
      >
        {selectedRequest && (
          <div className="space-y-6">
            {/* Status Banner */}
            <div
              className={`p-4 rounded-2xl flex items-center justify-between border ${
                selectedRequest.status === 'APPROVED'
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                  : selectedRequest.status === 'PENDING'
                  ? 'bg-amber-50 text-amber-900 border-amber-200'
                  : 'bg-rose-50 text-rose-900 border-rose-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {selectedRequest.status === 'APPROVED' && (
                  <CheckCircle className="w-5 h-5 text-[#23C45E]" />
                )}
                {selectedRequest.status === 'PENDING' && (
                  <Clock className="w-5 h-5 text-amber-600" />
                )}
                {selectedRequest.status === 'REJECTED' && (
                  <XCircle className="w-5 h-5 text-rose-600" />
                )}
                <div>
                  <span className="text-xs font-black uppercase tracking-wider block">
                    Status: {selectedRequest.status}
                  </span>
                  <span className="text-[11px] font-medium opacity-80">
                    Applied on {selectedRequest.appliedOn}
                  </span>
                </div>
              </div>

              <span className="text-xs font-mono font-black px-2.5 py-1 rounded-xl bg-white/70 shadow-2xs">
                {selectedRequest.duration}
              </span>
            </div>

            {/* Employee Information */}
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
                    {selectedRequest.employeeName}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase block">
                    Employee ID
                  </span>
                  <span className="font-mono font-bold text-slate-800">
                    {selectedRequest.employeeCode}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase block">
                    Department
                  </span>
                  <span className="font-bold text-slate-800">{selectedRequest.department}</span>
                </div>

                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase block">
                    Designation
                  </span>
                  <span className="font-bold text-slate-800">{selectedRequest.designation}</span>
                </div>

                <div className="col-span-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase block">
                    Assigned Office
                  </span>
                  <span className="font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    {selectedRequest.office}
                  </span>
                </div>
              </div>
            </div>

            {/* Remote Work Information */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60">
                <CalendarDays className="w-4 h-4 text-[#23C45E]" />
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wide">
                  Remote Work Information
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase block">
                    Start Date
                  </span>
                  <span className="font-mono font-bold text-slate-800">
                    {selectedRequest.fromDate}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase block">
                    End Date
                  </span>
                  <span className="font-mono font-bold text-slate-800">
                    {selectedRequest.toDate}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase block">
                    Total Duration
                  </span>
                  <span className="font-black text-[#1AA14D]">{selectedRequest.duration}</span>
                </div>

                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase block">
                    Applied On
                  </span>
                  <span className="font-mono text-slate-600">{selectedRequest.appliedOn}</span>
                </div>

                <div className="col-span-2 pt-1 border-t border-slate-200/50">
                  <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">
                    Employee Reason
                  </span>
                  <p className="text-xs font-medium text-slate-700 bg-white p-3 rounded-xl border border-slate-200/70 leading-relaxed">
                    {selectedRequest.reason || 'No specific reason provided.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Audit & Resolution Info */}
            {(selectedRequest.approvedByName || selectedRequest.rejectionReason) && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
                <span className="text-[10px] font-black uppercase text-slate-400 block">
                  Administrative Resolution
                </span>
                {selectedRequest.approvedByName && (
                  <p className="text-emerald-800 font-bold">
                    Approved by {selectedRequest.approvedByName}{' '}
                    {selectedRequest.approvedAt ? `on ${selectedRequest.approvedAt.split('T')[0]}` : ''}
                  </p>
                )}
                {selectedRequest.rejectionReason && (
                  <div className="space-y-1">
                    <p className="text-rose-700 font-bold">
                      Rejected by {selectedRequest.rejectedByName || 'HR Administrator'}:
                    </p>
                    <p className="p-2.5 bg-rose-50 rounded-xl border border-rose-200 text-rose-900 italic font-medium">
                      "{selectedRequest.rejectionReason}"
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </AdminFormDrawer>

      {/* =========================================================================
          CONFIRMATION MODALS (APPROVE / REJECT)
          ========================================================================= */}
      {/* Approve Confirmation Modal */}
      {confirmApproveReq && (
        <div className="fixed inset-0 z-60 overflow-hidden flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => !approveMutation.isPending && setConfirmApproveReq(null)}
          />
          <div className="relative bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl z-10 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#1AA14D] flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-[#23C45E]" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Approve Remote Work</h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  Confirm approval for {confirmApproveReq.employeeName}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Approve remote work request for <strong>{confirmApproveReq.employeeName}</strong> on{' '}
              <strong>{confirmApproveReq.remoteWorkDate}</strong> ({confirmApproveReq.duration})?
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={approveMutation.isPending}
                onClick={() => setConfirmApproveReq(null)}
                className="px-4 py-2 rounded-2xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={approveMutation.isPending}
                onClick={() => approveMutation.mutate(confirmApproveReq.id)}
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
      {rejectModalReq && (
        <div className="fixed inset-0 z-60 overflow-hidden flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => !rejectMutation.isPending && setRejectModalReq(null)}
          />
          <div className="relative bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl z-10 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Reject Remote Work</h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  Provide reason for declining {rejectModalReq.employeeName}'s request
                </p>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-700 uppercase mb-1">
                Rejection Reason *
              </label>
              <textarea
                rows={3}
                required
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter mandatory reason for declining request..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={rejectMutation.isPending}
                onClick={() => setRejectModalReq(null)}
                className="px-4 py-2 rounded-2xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={rejectMutation.isPending}
                onClick={() => {
                  if (!rejectionReason.trim()) {
                    toast.error('Rejection reason is required');
                    return;
                  }
                  rejectMutation.mutate({
                    id: rejectModalReq.id,
                    reason: rejectionReason.trim(),
                  });
                }}
                className="px-6 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black text-xs transition-all shadow-md shadow-rose-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {rejectMutation.isPending ? (
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <X className="w-3.5 h-3.5" />
                )}
                <span>Reject Request</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
