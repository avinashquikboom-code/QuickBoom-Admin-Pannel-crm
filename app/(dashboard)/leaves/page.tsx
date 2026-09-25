'use client';

import React, { useState } from 'react';
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
  Trash2,
  Edit2,
  Sliders,
  ShieldCheck,
  DollarSign,
  Receipt,
  Scale,
  ArrowRight,
  History,
  TrendingUp,
  Settings2,
} from 'lucide-react';
import api from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { AdminPageHeader, AdminButton, AdminFormDrawer, AdminPagination, AdminStatusTabs } from '@/components/admin';
import { getErrorMessage } from '@/lib/utils';

type MainSectionTab = 'requests' | 'balances' | 'holidays' | 'policies';
type RequestTab = 'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL';
type AvailabilityFilter = 'ALL' | 'AVAILABLE' | 'ON_LEAVE' | 'ABSENT' | 'ON_BREAK';
type PolicyCategory = 'attendance' | 'leave' | 'salary' | 'claims';

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
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  rejectionReason?: string | null;
  appliedOn: string;
}

interface PublicHolidayItem {
  id: number;
  name: string;
  date: string;
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

  // Active Main Navigation Tab
  const [mainTab, setMainTab] = useState<MainSectionTab>('requests');

  // Search & Filter state for Employee Availability
  const [availSearch, setAvailSearch] = useState('');
  const [availOffice, setAvailOffice] = useState('ALL');
  const [availDept, setAvailDept] = useState('ALL');
  const [availStatus, setAvailStatus] = useState<AvailabilityFilter>('ALL');

  // Leave Requests state
  const [requestTab, setRequestTab] = useState<RequestTab>('PENDING');
  const [requestSearch, setRequestSearch] = useState('');
  const [requestPage, setRequestPage] = useState(1);
  const [requestPageSize, setRequestPageSize] = useState(20);

  // Leave Balances state
  const [balanceSearch, setBalanceSearch] = useState('');
  const [balanceOffice, setBalanceOffice] = useState('ALL');
  const [balanceDept, setBalanceDept] = useState('ALL');

  // Drawers & Modals state
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequestItem | null>(null);
  const [isLeaveDetailsDrawerOpen, setIsLeaveDetailsDrawerOpen] = useState(false);

  // Approval & Rejection dialogs
  const [confirmApproveLeave, setConfirmApproveLeave] = useState<LeaveRequestItem | null>(null);
  const [rejectLeaveModal, setRejectLeaveModal] = useState<LeaveRequestItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Leave Balance Drawers
  const [selectedBalanceEmployeeId, setSelectedBalanceEmployeeId] = useState<number | null>(null);
  const [isViewBalanceDrawerOpen, setIsViewBalanceDrawerOpen] = useState(false);
  const [isAdjustBalanceDrawerOpen, setIsAdjustBalanceDrawerOpen] = useState(false);
  const [adjustBalanceEmployee, setAdjustBalanceEmployee] = useState<any | null>(null);
  const [adjustForm, setAdjustForm] = useState({
    leaveTypeId: '',
    adjustmentType: 'ADD' as 'ADD' | 'DEDUCT' | 'SET_BALANCE',
    amount: 1,
    reason: '',
  });

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

  // HR Policy state
  const [policyCategory, setPolicyCategory] = useState<PolicyCategory>('attendance');
  const [isPolicyEditDrawerOpen, setIsPolicyEditDrawerOpen] = useState(false);
  const [editingPolicyCategory, setEditingPolicyCategory] = useState<PolicyCategory>('attendance');
  const [policyFormData, setPolicyFormData] = useState<any>({});

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
    queryKey: ['admin-leave-requests', requestTab, requestSearch, requestPage, requestPageSize],
    queryFn: async () => {
      try {
        const res: any = await api.get('/leaves/requests', {
          params: {
            status: requestTab !== 'ALL' ? requestTab : undefined,
            search: requestSearch.trim() || undefined,
            page: requestPage,
            limit: requestPageSize,
          },
        });
        const items = res?.data?.items || res?.data?.data || res?.items || res?.data || (Array.isArray(res) ? res : []);
        const pagination = res?.pagination || res?.meta || res?.data?.pagination || res?.data?.meta || {
          page: requestPage,
          pageSize: requestPageSize,
          total: Array.isArray(items) ? items.length : 0,
          totalPages: 1,
        };
        return {
          data: Array.isArray(items) ? items : [],
          counts: res?.counts || res?.data?.counts || {},
          pagination: {
            page: Number(pagination.page) || requestPage,
            pageSize: Number(pagination.pageSize || pagination.limit) || requestPageSize,
            total: Number(pagination.total) || (Array.isArray(items) ? items.length : 0),
            totalPages: Number(pagination.totalPages) || 1,
          },
        };
      } catch {
        return { data: [], counts: {}, pagination: { page: 1, pageSize: requestPageSize, total: 0, totalPages: 1 } };
      }
    },
  });

  // Query 3: Employee Leave Balances
  const {
    data: leaveBalancesData,
    isLoading: isLoadingBalances,
    refetch: refetchBalances,
  } = useQuery({
    queryKey: ['admin-leave-balances', balanceOffice, balanceDept, balanceSearch],
    queryFn: async () => {
      try {
        const res: any = await api.get('/leaves/balances', {
          params: {
            officeId: balanceOffice !== 'ALL' ? balanceOffice : undefined,
            departmentId: balanceDept !== 'ALL' ? balanceDept : undefined,
            search: balanceSearch.trim() || undefined,
          },
        });
        return res?.data || res || { leaveTypes: [], summary: {}, records: [] };
      } catch {
        return { leaveTypes: [], summary: {}, records: [] };
      }
    },
  });

  // Query 4: Single Employee Balance Profile (Drawer)
  const { data: employeeBalanceProfile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['admin-employee-balance-profile', selectedBalanceEmployeeId],
    queryFn: async () => {
      if (!selectedBalanceEmployeeId) return null;
      try {
        const res: any = await api.get(`/leaves/balances/${selectedBalanceEmployeeId}`);
        return res?.data || res || null;
      } catch {
        return null;
      }
    },
    enabled: !!selectedBalanceEmployeeId && isViewBalanceDrawerOpen,
  });

  // Query 5: Public Holidays
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

  // Query 6: HR Policies Overview
  const {
    data: policiesData,
    isLoading: isLoadingPolicies,
    refetch: refetchPolicies,
  } = useQuery({
    queryKey: ['admin-hr-policies-overview'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/leaves/policies');
        return res?.data || res || {};
      } catch {
        return {};
      }
    },
  });

  // Query 7: Active Offices & Departments
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

  const balanceSummary = leaveBalancesData?.summary || {};
  const balanceLeaveTypes: any[] = Array.isArray(leaveBalancesData?.leaveTypes)
    ? leaveBalancesData.leaveTypes
    : [];
  const balanceRecords: any[] = Array.isArray(leaveBalancesData?.records)
    ? leaveBalancesData.records
    : [];

  const handleManualRefreshAll = () => {
    refetchAvail();
    refetchRequests();
    refetchBalances();
    refetchHolidays();
    refetchPolicies();
    toast.success('Live leave, balance & policy data refreshed');
  };

  // ==========================================
  // 2. MUTATIONS
  // ==========================================

  // Approve Leave Mutation
  const approveMutation = useMutation({
    mutationFn: async (id: number | string) => {
      return api.patch(`/leaves/requests/${id}/approve`, {});
    },
    onSuccess: () => {
      toast.success('Leave request approved successfully');
      setConfirmApproveLeave(null);
      setIsLeaveDetailsDrawerOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-leave-requests'] });
      queryClient.invalidateQueries({ queryKey: ['admin-leave-availability'] });
      queryClient.invalidateQueries({ queryKey: ['admin-leave-balances'] });
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err));
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
      toast.error(getErrorMessage(err));
    },
  });

  // Adjust Leave Balance Mutation
  const adjustBalanceMutation = useMutation({
    mutationFn: async ({ employeeId, payload }: { employeeId: number; payload: any }) => {
      return api.post(`/leaves/balances/${employeeId}/adjust`, payload);
    },
    onSuccess: (res: any) => {
      toast.success(res?.data?.message || 'Leave balance adjusted successfully');
      setIsAdjustBalanceDrawerOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-leave-balances'] });
      if (selectedBalanceEmployeeId) {
        queryClient.invalidateQueries({
          queryKey: ['admin-employee-balance-profile', selectedBalanceEmployeeId],
        });
      }
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err));
    },
  });

  // Save Public Holiday Mutation
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
      toast.error(getErrorMessage(err));
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
      toast.error(getErrorMessage(err));
    },
  });

  // Save Policy Mutation
  const savePolicyMutation = useMutation({
    mutationFn: async ({ category, payload }: { category: PolicyCategory; payload: any }) => {
      return api.post(`/leaves/policies/${category}`, payload);
    },
    onSuccess: () => {
      toast.success('HR policy saved and applied successfully');
      setIsPolicyEditDrawerOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-hr-policies-overview'] });
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err));
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

  const handleOpenAdjustBalance = (emp: any) => {
    setAdjustBalanceEmployee(emp);
    const firstTypeId = balanceLeaveTypes.length > 0 ? String(balanceLeaveTypes[0].id) : '';
    setAdjustForm({
      leaveTypeId: firstTypeId,
      adjustmentType: 'ADD',
      amount: 1,
      reason: '',
    });
    setIsAdjustBalanceDrawerOpen(true);
  };

  const handleSaveAdjustBalanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustBalanceEmployee) return;
    if (!adjustForm.leaveTypeId) {
      toast.error('Please select a leave type');
      return;
    }
    if (!adjustForm.reason.trim()) {
      toast.error('Mandatory reason is required for balance adjustment');
      return;
    }

    adjustBalanceMutation.mutate({
      employeeId: adjustBalanceEmployee.id,
      payload: {
        leaveTypeId: Number(adjustForm.leaveTypeId),
        adjustmentType: adjustForm.adjustmentType,
        amount: Number(adjustForm.amount),
        reason: adjustForm.reason.trim(),
      },
    });
  };

  const handleOpenEditPolicy = (cat: PolicyCategory) => {
    setEditingPolicyCategory(cat);
    const current = policiesData[cat] || {};
    setPolicyFormData({ ...current });
    setIsPolicyEditDrawerOpen(true);
  };

  const handleSavePolicySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    savePolicyMutation.mutate({
      category: editingPolicyCategory,
      payload: policyFormData,
    });
  };

  const isAnyFetching = isFetchingAvail || isFetchingRequests;

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-16 text-slate-800 animate-in fade-in-50 duration-200">
      {/* 1. STANDARD PAGE HEADER */}
      <AdminPageHeader
        title="Leave Management"
        description="Manage employee leave requests, public holidays, quota balances, and HR company policies."
        icon={CalendarDays}
        iconColor="text-[#1AA14D]"
        badge={{
          text: 'HR OPERATIONS',
          icon: CalendarDays,
          variant: 'emerald',
        }}
        breadcrumbs={[
          { label: 'Workforce', href: '/employees' },
          { label: 'Leaves' },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <AdminButton
              variant="outline"
              size="md"
              icon={RefreshCw}
              loading={isAnyFetching}
              onClick={handleManualRefreshAll}
              title="Refresh all data"
            >
              Refresh
            </AdminButton>

            <AdminButton
              variant="primary"
              size="md"
              icon={Plus}
              onClick={handleOpenDeclareHoliday}
            >
              Declare Public Holiday
            </AdminButton>
          </div>
        }
      />

      {/* =========================================================================
          2. MAIN SECTION TABS
          ========================================================================= */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setMainTab('requests')}
          className={`px-4 py-2.5 text-xs font-black rounded-2xl transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            mainTab === 'requests'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          <span>Leave Requests & Availability</span>
          {requestCounts.pending > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white">
              {requestCounts.pending}
            </span>
          )}
        </button>

        <button
          onClick={() => setMainTab('balances')}
          className={`px-4 py-2.5 text-xs font-black rounded-2xl transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            mainTab === 'balances'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>Employee Leave Balance</span>
        </button>

        <button
          onClick={() => setMainTab('holidays')}
          className={`px-4 py-2.5 text-xs font-black rounded-2xl transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            mainTab === 'holidays'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Public Holidays</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-200 text-slate-700">
            {holidays.length}
          </span>
        </button>

        <button
          onClick={() => setMainTab('policies')}
          className={`px-4 py-2.5 text-xs font-black rounded-2xl transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            mainTab === 'policies'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Policies</span>
        </button>
      </div>

      {/* =========================================================================
          TAB 1: LEAVE REQUESTS & TODAY'S WORKFORCE AVAILABILITY
          ========================================================================= */}
      {mainTab === 'requests' && (
        <div className="space-y-6 animate-in fade-in-50 duration-150">
          {/* Today's Availability 5 KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
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
                <span className="text-[11px] font-bold text-slate-400 block mt-0.5">
                  Active Workforce
                </span>
              </div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-3xl border border-emerald-200/80 shadow-xs flex flex-col justify-between bg-gradient-to-b from-white to-emerald-50/30">
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
                <span className="text-[11px] font-bold text-emerald-700 block mt-0.5">
                  On-Duty / Ready
                </span>
              </div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-3xl border border-blue-200/80 shadow-xs flex flex-col justify-between bg-gradient-to-b from-white to-blue-50/30">
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
                <span className="text-[11px] font-bold text-blue-700 block mt-0.5">
                  Approved Absence
                </span>
              </div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-3xl border border-rose-200/80 shadow-xs flex flex-col justify-between bg-gradient-to-b from-white to-rose-50/30">
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
                <span className="text-[11px] font-bold text-rose-700 block mt-0.5">
                  Unexcused / Pending
                </span>
              </div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-3xl border border-amber-200/80 shadow-xs flex flex-col justify-between bg-gradient-to-b from-white to-amber-50/30 col-span-2 sm:col-span-1">
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
                <span className="text-[11px] font-bold text-amber-700 block mt-0.5">
                  Active Duty Paused
                </span>
              </div>
            </div>
          </div>

          {/* Today's Employee Availability Roster */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden space-y-4">
            <div className="p-5 sm:p-6 border-b border-slate-100 space-y-4">
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#23C45E]" />
                Today's Employee Availability
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={availSearch}
                    onChange={(e) => setAvailSearch(e.target.value)}
                    placeholder="Search staff name or ID..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
                  />
                </div>

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
                        <td className="py-3.5 px-6 font-extrabold text-slate-900">{r.name}</td>
                        <td className="py-3.5 px-6 font-mono font-bold text-slate-600">
                          {r.employeeCode}
                        </td>
                        <td className="py-3.5 px-6 font-bold text-slate-800">{r.office}</td>
                        <td className="py-3.5 px-6 text-slate-700">{r.department}</td>
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
                        <td className="py-3.5 px-6 font-mono font-bold text-slate-800">
                          {r.checkIn}
                        </td>
                        <td className="py-3.5 px-6 font-mono text-slate-600">{r.break}</td>
                        <td className="py-3.5 px-6 text-slate-500">{r.lastActivity}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Leave Requests Management */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden space-y-4">
            <div className="p-5 sm:p-6 border-b border-slate-100 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <CalendarDays className="w-5 h-5 text-[#23C45E]" />
                    Leave Requests
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Review submitted leave applications and authorize staff absences.
                  </p>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={requestSearch}
                    onChange={(e) => {
                      setRequestSearch(e.target.value);
                      setRequestPage(1);
                    }}
                    placeholder="Search by employee name, code, or reason..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
                  />
                </div>
              </div>

              {/* Status Tabs */}
              <div className="border-b border-slate-100 pb-2">
                <AdminStatusTabs<RequestTab>
                  activeTab={requestTab}
                  onChange={(tab) => {
                    setRequestTab(tab);
                    setRequestPage(1);
                  }}
                  tabs={[
                    { key: 'ALL', label: 'All Requests', count: requestCounts.all },
                    { key: 'APPROVED', label: 'Approved', count: requestCounts.approved },
                    { key: 'PENDING', label: 'Pending', count: requestCounts.pending },
                    { key: 'REJECTED', label: 'Rejected', count: requestCounts.rejected },
                  ]}
                />
              </div>
            </div>

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
                        <td className="py-3.5 px-6 font-bold text-slate-700">{req.department}</td>
                        <td className="py-3.5 px-6 text-slate-700">{req.office}</td>
                        <td className="py-3.5 px-6">
                          <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-800 font-extrabold text-[11px]">
                            {req.leaveType}
                          </span>
                        </td>
                        <td className="py-3.5 px-6 font-mono font-bold text-slate-800">
                          {req.fromDate}
                        </td>
                        <td className="py-3.5 px-6 font-mono font-bold text-slate-800">
                          {req.toDate}
                        </td>
                        <td className="py-3.5 px-6 font-black text-[#1AA14D]">
                          {req.totalDays} {req.totalDays === 1 ? 'Day' : 'Days'}
                        </td>
                        <td
                          className="py-3.5 px-6 text-slate-600 max-w-[180px] truncate"
                          title={req.reason}
                        >
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

            {/* Server-Side Pagination for Leave Requests */}
            <AdminPagination
              page={requestPage}
              pageSize={requestPageSize}
              total={leaveRequestsData?.pagination?.total || 0}
              totalPages={leaveRequestsData?.pagination?.totalPages || 1}
              onPageChange={setRequestPage}
              onPageSizeChange={(size) => {
                setRequestPageSize(size);
                setRequestPage(1);
              }}
              disabled={isLoadingRequests}
            />
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: EMPLOYEE LEAVE BALANCE & MANUAL ADJUSTMENT
          ========================================================================= */}
      {mainTab === 'balances' && (
        <div className="space-y-6 animate-in fade-in-50 duration-150">
          {/* Leave Balance KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs">
              <span className="text-[10px] sm:text-[11px] uppercase font-black tracking-wider text-slate-400 block">
                Total Workforce
              </span>
              <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-2 block">
                {balanceSummary.totalEmployees ?? 0}
              </span>
              <span className="text-[11px] font-bold text-slate-400 block mt-0.5">Enrolled Staff</span>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-3xl border border-emerald-200/80 shadow-xs bg-emerald-50/20">
              <span className="text-[10px] sm:text-[11px] uppercase font-black tracking-wider text-emerald-800 block">
                Staff With Balance
              </span>
              <span className="text-2xl sm:text-3xl font-black text-emerald-950 tracking-tight mt-2 block">
                {balanceSummary.employeesWithRemaining ?? 0}
              </span>
              <span className="text-[11px] font-bold text-emerald-700 block mt-0.5">
                Leave Remaining
              </span>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-3xl border border-blue-200/80 shadow-xs bg-blue-50/20">
              <span className="text-[10px] sm:text-[11px] uppercase font-black tracking-wider text-blue-800 block">
                Total Quota Allocated
              </span>
              <span className="text-2xl sm:text-3xl font-black text-blue-950 tracking-tight mt-2 block">
                {balanceSummary.totalAllocated ?? 0} <span className="text-sm font-bold">Days</span>
              </span>
              <span className="text-[11px] font-bold text-blue-700 block mt-0.5">Company-wide</span>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-3xl border border-amber-200/80 shadow-xs bg-amber-50/20">
              <span className="text-[10px] sm:text-[11px] uppercase font-black tracking-wider text-amber-800 block">
                Total Quota Used
              </span>
              <span className="text-2xl sm:text-3xl font-black text-amber-950 tracking-tight mt-2 block">
                {balanceSummary.totalUsed ?? 0} <span className="text-sm font-bold">Days</span>
              </span>
              <span className="text-[11px] font-bold text-amber-700 block mt-0.5">Approved Taken</span>
            </div>
          </div>

          {/* Employee Leave Balance Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden space-y-4">
            <div className="p-5 sm:p-6 border-b border-slate-100 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <Scale className="w-5 h-5 text-[#23C45E]" />
                    Employee Leave Balance
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Annual quota allocations, consumption tracking, and HR balance adjustments.
                  </p>
                </div>
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={balanceSearch}
                    onChange={(e) => setBalanceSearch(e.target.value)}
                    placeholder="Search staff name or code..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
                  />
                </div>

                <select
                  value={balanceOffice}
                  onChange={(e) => setBalanceOffice(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
                >
                  <option value="ALL">All Assigned Offices</option>
                  {offices.map((o: any) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>

                <select
                  value={balanceDept}
                  onChange={(e) => setBalanceDept(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
                >
                  <option value="ALL">All Departments</option>
                  {departments.map((d: any) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 uppercase font-black tracking-wider text-[10px] border-b border-slate-100">
                    <th className="py-3 px-6">Employee</th>
                    <th className="py-3 px-6">Employee ID</th>
                    <th className="py-3 px-6">Office</th>
                    <th className="py-3 px-6">Department</th>
                    <th className="py-3 px-6">Designation</th>
                    {balanceLeaveTypes.map((lt) => (
                      <th key={lt.id} className="py-3 px-6 text-center">
                        {lt.name}
                      </th>
                    ))}
                    <th className="py-3 px-6 text-center">Used</th>
                    <th className="py-3 px-6 text-center">Remaining</th>
                    <th className="py-3 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {isLoadingBalances ? (
                    <tr>
                      <td
                        colSpan={8 + balanceLeaveTypes.length}
                        className="py-12 text-center text-slate-400"
                      >
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#23C45E]" />
                        <p className="mt-2 text-xs font-bold">Calculating employee leave balances...</p>
                      </td>
                    </tr>
                  ) : balanceRecords.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8 + balanceLeaveTypes.length}
                        className="py-12 text-center text-slate-400"
                      >
                        <Scale className="w-8 h-8 mx-auto text-slate-300" />
                        <p className="mt-2 text-xs font-bold text-slate-600">
                          No employee leave balance records found.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    balanceRecords.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-6 font-extrabold text-slate-900">{r.name}</td>
                        <td className="py-3.5 px-6 font-mono font-bold text-slate-600">
                          {r.employeeCode}
                        </td>
                        <td className="py-3.5 px-6 font-bold text-slate-800">{r.office}</td>
                        <td className="py-3.5 px-6 text-slate-700">{r.department}</td>
                        <td className="py-3.5 px-6 text-slate-600">{r.designation}</td>

                        {/* Dynamic Leave Types */}
                        {balanceLeaveTypes.map((lt) => {
                          const b = r.balances?.[lt.name];
                          return (
                            <td key={lt.id} className="py-3.5 px-6 text-center">
                              {b ? (
                                b.isUnlimited ? (
                                  <span className="text-[11px] font-bold text-slate-500">
                                    Unlimited
                                  </span>
                                ) : (
                                  <span className="font-mono text-xs font-bold text-slate-900">
                                    <span className="text-[#1AA14D] font-black">{b.remaining}</span>
                                    <span className="text-slate-400 font-normal"> / {b.allocated}</span>
                                  </span>
                                )
                              ) : (
                                '—'
                              )}
                            </td>
                          );
                        })}

                        <td className="py-3.5 px-6 text-center font-mono font-bold text-rose-600">
                          {r.totalUsed} Days
                        </td>

                        <td className="py-3.5 px-6 text-center font-mono font-black text-[#1AA14D]">
                          {r.totalRemaining} Days
                        </td>

                        <td className="py-3.5 px-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setSelectedBalanceEmployeeId(r.id);
                                setIsViewBalanceDrawerOpen(true);
                              }}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-[11px] transition-colors cursor-pointer"
                            >
                              View Balance
                            </button>
                            <button
                              onClick={() => handleOpenAdjustBalance(r)}
                              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#1AA14D] border border-emerald-200/60 rounded-xl font-black text-[11px] transition-colors cursor-pointer"
                            >
                              Adjust
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
        </div>
      )}

      {/* =========================================================================
          TAB 3: PUBLIC HOLIDAYS MANAGEMENT
          ========================================================================= */}
      {mainTab === 'holidays' && (
        <div className="space-y-6 animate-in fade-in-50 duration-150">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden space-y-4">
            <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[#23C45E]" />
                  Public Holidays
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Declare official company and regional office holidays recognized across the workforce.
                </p>
              </div>

              <button
                onClick={handleOpenDeclareHoliday}
                className="flex items-center gap-2 px-4 py-2 bg-[#23C45E] hover:bg-[#1AA14D] text-white rounded-2xl text-xs font-black shadow-md shadow-[#23C45E]/20 transition-all cursor-pointer w-fit"
              >
                <Plus className="w-4 h-4" />
                <span>+ Declare Public Holiday</span>
              </button>
            </div>

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
                        <p className="mt-2 text-xs font-bold text-slate-600">
                          No public holidays declared.
                        </p>
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
        </div>
      )}

      {/* =========================================================================
          TAB 4: HR POLICIES MANAGEMENT
          ========================================================================= */}
      {mainTab === 'policies' && (
        <div className="space-y-6 animate-in fade-in-50 duration-150">
          {/* Policy Category Switcher Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            {[
              { key: 'attendance' as PolicyCategory, label: 'Attendance Policy', icon: Clock },
              { key: 'leave' as PolicyCategory, label: 'Leave Policy', icon: CalendarDays },
              { key: 'salary' as PolicyCategory, label: 'Salary Policy', icon: DollarSign },
              { key: 'claims' as PolicyCategory, label: 'Claim Policy', icon: Receipt },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setPolicyCategory(tab.key)}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                    policyCategory === tab.key
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Active Policy Card */}
          {isLoadingPolicies ? (
            <div className="bg-white p-12 rounded-3xl border border-slate-200/80 text-center">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#23C45E]" />
              <p className="mt-2 text-xs font-bold text-slate-500">Loading policy configurations...</p>
            </div>
          ) : (
            <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
              {/* Header with Edit Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black text-slate-900">
                      {policyCategory === 'attendance' && 'Attendance & Time Tracking Policy'}
                      {policyCategory === 'leave' && 'Leave Entitlement & Approval Policy'}
                      {policyCategory === 'salary' && 'Salary, Deduction & Overtime Policy'}
                      {policyCategory === 'claims' && 'Employee Expense & Claim Policy'}
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                      ACTIVE
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    Last updated by{' '}
                    <strong className="text-slate-700">
                      {policiesData[policyCategory]?.updatedByName || 'HR Administrator'}
                    </strong>
                  </p>
                </div>

                <button
                  onClick={() => handleOpenEditPolicy(policyCategory)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#23C45E] hover:bg-[#1AA14D] text-white rounded-2xl text-xs font-black shadow-md shadow-[#23C45E]/20 transition-all cursor-pointer w-fit"
                >
                  <Edit2 className="w-4 h-4" />
                  <span>Edit Policy</span>
                </button>
              </div>

              {/* Attendance Policy Display */}
              {policyCategory === 'attendance' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-2">
                    <span className="font-black text-slate-900 block uppercase text-[10px] tracking-wider text-slate-400">
                      Working Schedule
                    </span>
                    <div className="space-y-1 font-medium text-slate-700">
                      <p>
                        Working Days: <strong>{policiesData.attendance?.workingDaysPerWeek} Days/Week</strong>
                      </p>
                      <p>
                        Daily Requirement: <strong>{policiesData.attendance?.workingHoursPerDay} Hours</strong>
                      </p>
                      <p>
                        Grace Period: <strong>{policiesData.attendance?.gracePeriodMinutes} Minutes</strong>
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-2">
                    <span className="font-black text-slate-900 block uppercase text-[10px] tracking-wider text-slate-400">
                      Deduction & Penalties
                    </span>
                    <div className="space-y-1 font-medium text-slate-700">
                      <p>
                        Full-Day Absence: <strong>{policiesData.attendance?.fullDayAbsenceDeductionPct}% Pay</strong>
                      </p>
                      <p>
                        Half-Day Rule: <strong>{policiesData.attendance?.halfDayDeductionPct}% Pay</strong>
                      </p>
                      <p>
                        Late Arrival Deduction: <strong>{policiesData.attendance?.lateArrivalDeductionPct}%</strong>
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-2">
                    <span className="font-black text-slate-900 block uppercase text-[10px] tracking-wider text-slate-400">
                      Breaks & Geofencing
                    </span>
                    <div className="space-y-1 font-medium text-slate-700">
                      <p>
                        Breaks Allowed: <strong>{policiesData.attendance?.breakAllowed ? 'Yes' : 'No'} ({policiesData.attendance?.maxBreaksPerDay} Max)</strong>
                      </p>
                      <p>
                        Max Break Time: <strong>{policiesData.attendance?.maxBreakDurationMins} Mins</strong>
                      </p>
                      <p>
                        Office & GPS Required: <strong>{policiesData.attendance?.gpsRequired ? 'Enforced' : 'Optional'}</strong>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Leave Policy Display */}
              {policyCategory === 'leave' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-2">
                    <span className="font-black text-slate-900 block uppercase text-[10px] tracking-wider text-slate-400">
                      Application Rules
                    </span>
                    <div className="space-y-1 font-medium text-slate-700">
                      <p>
                        Half-Day Leaves: <strong>{policiesData.leave?.allowHalfDay ? 'Allowed' : 'Disabled'}</strong>
                      </p>
                      <p>
                        Backdated Leave: <strong>{policiesData.leave?.allowBackdatedLeave ? `Allowed (Max ${policiesData.leave?.maxBackdatedDays} Days)` : 'Disabled'}</strong>
                      </p>
                      <p>
                        Future Leave Horizon: <strong>Up to {policiesData.leave?.maxFutureDays} Days</strong>
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-2">
                    <span className="font-black text-slate-900 block uppercase text-[10px] tracking-wider text-slate-400">
                      Consecutive & Notice Rules
                    </span>
                    <div className="space-y-1 font-medium text-slate-700">
                      <p>
                        Minimum Notice: <strong>{policiesData.leave?.minNoticePeriodDays} Days Prior</strong>
                      </p>
                      <p>
                        Max Consecutive Days: <strong>{policiesData.leave?.maxConsecutiveDays} Days</strong>
                      </p>
                      <p>
                        Probation Leave: <strong>{policiesData.leave?.allowProbationLeave ? 'Allowed' : 'Not Allowed'}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-2">
                    <span className="font-black text-slate-900 block uppercase text-[10px] tracking-wider text-slate-400">
                      Approvals & Attachments
                    </span>
                    <div className="space-y-1 font-medium text-slate-700">
                      <p>
                        Manager Approval: <strong>{policiesData.leave?.requiresManagerApproval ? 'Required' : 'Optional'}</strong>
                      </p>
                      <p>
                        HR Approval: <strong>{policiesData.leave?.requiresHrApproval ? 'Required' : 'Optional'}</strong>
                      </p>
                      <p>
                        Doc Attachment: <strong>Above {policiesData.leave?.requiresAttachmentAboveDays} Days</strong>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Salary Policy Display */}
              {policyCategory === 'salary' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-2">
                    <span className="font-black text-slate-900 block uppercase text-[10px] tracking-wider text-slate-400">
                      Payroll Cycle
                    </span>
                    <div className="space-y-1 font-medium text-slate-700">
                      <p>
                        Cycle Frequency: <strong>{policiesData.salary?.salaryCycle}</strong>
                      </p>
                      <p>
                        Cycle Start Day: <strong>Day {policiesData.salary?.payrollCycleStartDay} of Month</strong>
                      </p>
                      <p>
                        Standard Working Days: <strong>{policiesData.salary?.workingDaysPerMonth} Days/Mo</strong>
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-2">
                    <span className="font-black text-slate-900 block uppercase text-[10px] tracking-wider text-slate-400">
                      Overtime & Multiplier
                    </span>
                    <div className="space-y-1 font-medium text-slate-700">
                      <p>
                        Overtime Calculation: <strong>{policiesData.salary?.overtimeEnabled ? 'Enabled' : 'Disabled'}</strong>
                      </p>
                      <p>
                        Multiplier Rate: <strong>{policiesData.salary?.overtimeMultiplier}x Base Rate</strong>
                      </p>
                      <p>
                        Formula: <strong>{policiesData.salary?.overtimeCalculationMethod}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-2">
                    <span className="font-black text-slate-900 block uppercase text-[10px] tracking-wider text-slate-400">
                      Statutory Contributions
                    </span>
                    <div className="space-y-1 font-medium text-slate-700">
                      <p>
                        Provident Fund (PF): <strong>{policiesData.salary?.pfPercent}%</strong>
                      </p>
                      <p>
                        ESI Rate: <strong>{policiesData.salary?.esiPercent}%</strong>
                      </p>
                      <p>
                        Sales Commission: <strong>{policiesData.salary?.commissionEnabled ? `${policiesData.salary?.commissionPercentage}%` : 'Disabled'}</strong>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Claim Policy Display */}
              {policyCategory === 'claims' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-2">
                    <span className="font-black text-slate-900 block uppercase text-[10px] tracking-wider text-slate-400">
                      Claim Limits
                    </span>
                    <div className="space-y-1 font-medium text-slate-700">
                      <p>
                        Max per Receipt: <strong>₹{Number(policiesData?.claim?.maxClaimAmountPerReceipt || 0).toLocaleString('en-IN')}</strong>
                      </p>
                      <p>
                        Monthly Limit: <strong>₹{Number(policiesData?.claim?.monthlyClaimLimit || 0).toLocaleString('en-IN')}</strong>
                      </p>
                      <p>
                        Annual Cap: <strong>₹{Number(policiesData?.claim?.annualClaimLimit || 0).toLocaleString('en-IN')}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-2">
                    <span className="font-black text-slate-900 block uppercase text-[10px] tracking-wider text-slate-400">
                      Receipt & Approval
                    </span>
                    <div className="space-y-1 font-medium text-slate-700">
                      <p>
                        Receipt Mandatory: <strong>Above ₹{policiesData.claim?.receiptRequiredAboveAmount}</strong>
                      </p>
                      <p>
                        Manager Approval: <strong>{policiesData.claim?.approvalRequired ? 'Mandatory' : 'Auto'}</strong>
                      </p>
                      <p>
                        Auto-Approve Threshold: <strong>₹{policiesData.claim?.autoApprovalThreshold || 0}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-2">
                    <span className="font-black text-slate-900 block uppercase text-[10px] tracking-wider text-slate-400">
                      Approved Categories
                    </span>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {(policiesData.claim?.allowedCategories || []).map((cat: string) => (
                        <span key={cat} className="px-2 py-0.5 rounded-lg bg-slate-200 text-slate-800 text-[10px] font-bold">
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          DRAWER 1: VIEW EMPLOYEE LEAVE BALANCE & AUDIT HISTORY
          ========================================================================= */}
      <AdminFormDrawer
        isOpen={isViewBalanceDrawerOpen}
        onClose={() => setIsViewBalanceDrawerOpen(false)}
        title={employeeBalanceProfile ? `${employeeBalanceProfile.employee?.name}'s Balance` : 'Employee Balance'}
        subtitle="Annual quota allocation, used days, and full adjustment history"
        icon={Scale}
        maxWidth="max-w-xl"
        footer={
          <div className="flex items-center justify-between w-full">
            <button
              type="button"
              onClick={() => {
                setIsViewBalanceDrawerOpen(false);
                if (employeeBalanceProfile?.employee) {
                  handleOpenAdjustBalance(employeeBalanceProfile.employee);
                }
              }}
              className="px-5 py-2.5 bg-emerald-50 text-[#1AA14D] border border-emerald-200/60 rounded-2xl font-black text-xs hover:bg-emerald-100 transition-colors cursor-pointer"
            >
              Adjust This Balance
            </button>
            <button
              type="button"
              onClick={() => setIsViewBalanceDrawerOpen(false)}
              className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl font-black text-xs transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        }
      >
        {isLoadingProfile ? (
          <div className="py-12 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#23C45E]" />
            <p className="mt-2 text-xs font-bold">Loading balance profile...</p>
          </div>
        ) : employeeBalanceProfile ? (
          <div className="space-y-6">
            {/* Employee Profile Header */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {employeeBalanceProfile.employee?.name}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {employeeBalanceProfile.employee?.department} • {employeeBalanceProfile.employee?.designation}
                  </p>
                </div>
                <span className="font-mono text-xs font-bold px-2.5 py-1 bg-white rounded-xl border border-slate-200">
                  {employeeBalanceProfile.employee?.employeeCode}
                </span>
              </div>
            </div>

            {/* Balances Table */}
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                Annual Quotas & Consumption
              </h4>
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-400 font-black uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-4">Leave Type</th>
                      <th className="py-2.5 px-4 text-center">Allocated</th>
                      <th className="py-2.5 px-4 text-center">Used</th>
                      <th className="py-2.5 px-4 text-center">Remaining</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {employeeBalanceProfile.balances.map((b: any) => (
                      <tr key={b.leaveTypeId} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-4 font-bold text-slate-900">{b.leaveTypeName}</td>
                        <td className="py-2.5 px-4 text-center font-mono">{b.isUnlimited ? '∞' : b.allocated}</td>
                        <td className="py-2.5 px-4 text-center font-mono text-rose-600 font-bold">{b.used}</td>
                        <td className="py-2.5 px-4 text-center font-mono font-black text-[#1AA14D]">
                          {b.isUnlimited ? 'Unlimited' : b.remaining}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Adjustment History Audit Feed */}
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-[#23C45E]" />
                Adjustment History Audit Log
              </h4>
              {employeeBalanceProfile.adjustments.length === 0 ? (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 text-center text-xs text-slate-400 font-medium">
                  No manual adjustments recorded for this employee.
                </div>
              ) : (
                <div className="space-y-2">
                  {employeeBalanceProfile.adjustments.map((a: any) => (
                    <div key={a.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/70 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-slate-900">{a.leaveTypeName}</span>
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase ${
                          a.action === 'ADD' ? 'bg-emerald-100 text-emerald-800' : a.action === 'DEDUCT' ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {a.action} ({a.action === 'ADD' ? `+${a.amount}` : a.action === 'DEDUCT' ? `-${a.amount}` : `=${a.amount}`})
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 font-medium">
                        Change: <strong className="font-mono">{a.previousBalance} → {a.newBalance} Days</strong>
                      </p>
                      <p className="text-[11px] text-slate-500 italic">"{a.reason}"</p>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200/50">
                        <span>By {a.adjustedBy}</span>
                        <span>{a.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </AdminFormDrawer>

      {/* =========================================================================
          DRAWER 2: MANUAL LEAVE BALANCE ADJUSTMENT
          ========================================================================= */}
      <AdminFormDrawer
        isOpen={isAdjustBalanceDrawerOpen}
        onClose={() => setIsAdjustBalanceDrawerOpen(false)}
        title="Adjust Leave Balance"
        subtitle={adjustBalanceEmployee ? `Modify quota for ${adjustBalanceEmployee.name}` : 'Adjust Quota'}
        icon={Sliders}
        maxWidth="max-w-md"
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <button
              type="button"
              disabled={adjustBalanceMutation.isPending}
              onClick={() => setIsAdjustBalanceDrawerOpen(false)}
              className="px-4 py-2.5 rounded-2xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={adjustBalanceMutation.isPending}
              onClick={handleSaveAdjustBalanceSubmit}
              className="px-6 py-2.5 bg-[#23C45E] hover:bg-[#1AA14D] text-white rounded-2xl font-black text-xs shadow-md shadow-[#23C45E]/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {adjustBalanceMutation.isPending ? 'Saving...' : 'Save Adjustment'}
            </button>
          </div>
        }
      >
        {adjustBalanceEmployee && (
          <form onSubmit={handleSaveAdjustBalanceSubmit} className="space-y-4">
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
              <span className="text-[10px] font-black uppercase text-slate-400 block">Employee</span>
              <span className="font-extrabold text-slate-900 text-sm">{adjustBalanceEmployee.name}</span>
              <span className="text-slate-500 font-mono block text-[11px]">{adjustBalanceEmployee.employeeCode}</span>
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-700 uppercase mb-1">
                Leave Type *
              </label>
              <select
                required
                value={adjustForm.leaveTypeId}
                onChange={(e) => setAdjustForm({ ...adjustForm, leaveTypeId: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
              >
                {balanceLeaveTypes.map((lt) => (
                  <option key={lt.id} value={lt.id}>
                    {lt.name} (Base Quota: {lt.daysAllowedPerYear} Days)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-700 uppercase mb-1">
                Adjustment Action *
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'ADD', label: 'ADD (+)' },
                  { key: 'DEDUCT', label: 'DEDUCT (-)' },
                  { key: 'SET_BALANCE', label: 'SET (=)' },
                ].map((action) => (
                  <button
                    key={action.key}
                    type="button"
                    onClick={() => setAdjustForm({ ...adjustForm, adjustmentType: action.key as any })}
                    className={`py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
                      adjustForm.adjustmentType === action.key
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-700 uppercase mb-1">
                Adjustment Days / Amount *
              </label>
              <input
                type="number"
                min={1}
                required
                value={adjustForm.amount}
                onChange={(e) => setAdjustForm({ ...adjustForm, amount: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-700 uppercase mb-1">
                Mandatory Reason / Notes *
              </label>
              <textarea
                rows={3}
                required
                value={adjustForm.reason}
                onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                placeholder="Reason for manual balance adjustment (e.g. Approved extra quota, probation adjustment)..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
              />
            </div>
          </form>
        )}
      </AdminFormDrawer>

      {/* =========================================================================
          DRAWER 3: EDIT HR POLICY DRAWER
          ========================================================================= */}
      <AdminFormDrawer
        isOpen={isPolicyEditDrawerOpen}
        onClose={() => setIsPolicyEditDrawerOpen(false)}
        title={`Edit ${editingPolicyCategory.toUpperCase()} Policy`}
        subtitle="Configure company-wide rules, deductions, and thresholds"
        icon={Sliders}
        maxWidth="max-w-xl"
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <button
              type="button"
              disabled={savePolicyMutation.isPending}
              onClick={() => setIsPolicyEditDrawerOpen(false)}
              className="px-4 py-2.5 rounded-2xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={savePolicyMutation.isPending}
              onClick={handleSavePolicySubmit}
              className="px-6 py-2.5 bg-[#23C45E] hover:bg-[#1AA14D] text-white rounded-2xl font-black text-xs shadow-md shadow-[#23C45E]/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {savePolicyMutation.isPending ? 'Saving...' : 'Save Policy'}
            </button>
          </div>
        }
      >
        <form onSubmit={handleSavePolicySubmit} className="space-y-4 text-xs">
          {/* Attendance Policy Fields Organized into 6 Sections */}
          {editingPolicyCategory === 'attendance' && (
            <div className="space-y-5">
              {/* SECTION 1: WORKING HOURS */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                <span className="text-[11px] font-black text-slate-900 uppercase tracking-wider block border-b border-slate-200 pb-1">
                  1. Working Hours & Schedule
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black text-slate-600 uppercase mb-1">
                      Office Start Time
                    </label>
                    <input
                      type="time"
                      value={policyFormData.officeStartTime || '09:30'}
                      onChange={(e) =>
                        setPolicyFormData({ ...policyFormData, officeStartTime: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-600 uppercase mb-1">
                      Office End Time
                    </label>
                    <input
                      type="time"
                      value={policyFormData.officeEndTime || '18:30'}
                      onChange={(e) =>
                        setPolicyFormData({ ...policyFormData, officeEndTime: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black text-slate-600 uppercase mb-1">
                      Working Days / Week
                    </label>
                    <input
                      type="number"
                      value={policyFormData.workingDaysPerWeek || 5}
                      onChange={(e) =>
                        setPolicyFormData({
                          ...policyFormData,
                          workingDaysPerWeek: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-600 uppercase mb-1">
                      Working Hours / Day
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={policyFormData.workingHoursPerDay || 8.0}
                      onChange={(e) =>
                        setPolicyFormData({
                          ...policyFormData,
                          workingHoursPerDay: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: PUNCH IN */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                <span className="text-[11px] font-black text-slate-900 uppercase tracking-wider block border-b border-slate-200 pb-1">
                  2. Punch In Rules
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black text-slate-600 uppercase mb-1">
                      Grace Period (Minutes)
                    </label>
                    <input
                      type="number"
                      value={policyFormData.gracePeriodMinutes ?? 15}
                      onChange={(e) =>
                        setPolicyFormData({
                          ...policyFormData,
                          gracePeriodMinutes: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-600 uppercase mb-1">
                      Late Arrival Rule
                    </label>
                    <select
                      value={policyFormData.lateRuleAction || 'MARK_LATE'}
                      onChange={(e) =>
                        setPolicyFormData({ ...policyFormData, lateRuleAction: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-xs"
                    >
                      <option value="MARK_LATE">Mark Late</option>
                      <option value="DEDUCT_PAY">Deduct Pay</option>
                      <option value="HALF_DAY">Mark Half Day</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={policyFormData.punchInRequired ?? true}
                      onChange={(e) =>
                        setPolicyFormData({ ...policyFormData, punchInRequired: e.target.checked })
                      }
                      className="rounded text-[#23C45E]"
                    />
                    <span className="text-xs font-bold text-slate-700">Punch In Required</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={policyFormData.earlyPunchInAllowed ?? true}
                      onChange={(e) =>
                        setPolicyFormData({
                          ...policyFormData,
                          earlyPunchInAllowed: e.target.checked,
                        })
                      }
                      className="rounded text-[#23C45E]"
                    />
                    <span className="text-xs font-bold text-slate-700">Early Punch-In Allowed</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={policyFormData.multiplePunchInAllowed ?? false}
                      onChange={(e) =>
                        setPolicyFormData({
                          ...policyFormData,
                          multiplePunchInAllowed: e.target.checked,
                        })
                      }
                      className="rounded text-[#23C45E]"
                    />
                    <span className="text-xs font-bold text-slate-700">Multiple Punch-In Allowed</span>
                  </label>
                </div>
              </div>

              {/* SECTION 3: PUNCH OUT */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                <span className="text-[11px] font-black text-slate-900 uppercase tracking-wider block border-b border-slate-200 pb-1">
                  3. Punch Out Rules
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black text-slate-600 uppercase mb-1">
                      Min Working Hours
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={policyFormData.minWorkingHours || 8.0}
                      onChange={(e) =>
                        setPolicyFormData({
                          ...policyFormData,
                          minWorkingHours: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-600 uppercase mb-1">
                      Early Checkout Grace (Mins)
                    </label>
                    <input
                      type="number"
                      value={policyFormData.earlyCheckoutGraceMinutes ?? 15}
                      onChange={(e) =>
                        setPolicyFormData({
                          ...policyFormData,
                          earlyCheckoutGraceMinutes: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-600 uppercase mb-1">
                    Early Checkout Action
                  </label>
                  <select
                    value={policyFormData.earlyCheckoutAction || 'MARK_EARLY'}
                    onChange={(e) =>
                      setPolicyFormData({
                        ...policyFormData,
                        earlyCheckoutAction: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-xs"
                  >
                    <option value="MARK_EARLY">Mark Early Checkout</option>
                    <option value="DEDUCT_PAY">Deduct Proportionate Pay</option>
                    <option value="HALF_DAY">Convert to Half Day</option>
                  </select>
                </div>
              </div>

              {/* SECTION 4: LOCATION & GEOFENCING */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                <span className="text-[11px] font-black text-slate-900 uppercase tracking-wider block border-b border-slate-200 pb-1">
                  4. Location & Geofencing Policy
                </span>
                <div className="flex flex-wrap gap-4 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={policyFormData.officeAttendanceRequired ?? true}
                      onChange={(e) =>
                        setPolicyFormData({
                          ...policyFormData,
                          officeAttendanceRequired: e.target.checked,
                        })
                      }
                      className="rounded text-[#23C45E]"
                    />
                    <span className="text-xs font-bold text-slate-700">Office Location Required</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={policyFormData.gpsRequired ?? true}
                      onChange={(e) =>
                        setPolicyFormData({ ...policyFormData, gpsRequired: e.target.checked })
                      }
                      className="rounded text-[#23C45E]"
                    />
                    <span className="text-xs font-bold text-slate-700">GPS Validation Enforced</span>
                  </label>
                </div>
              </div>

              {/* SECTION 5: BREAK POLICY */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                <span className="text-[11px] font-black text-slate-900 uppercase tracking-wider block border-b border-slate-200 pb-1">
                  5. Break Policy
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-black text-slate-600 uppercase mb-1">
                      Max Duration (Mins)
                    </label>
                    <input
                      type="number"
                      value={policyFormData.maxBreakDurationMins || 60}
                      onChange={(e) =>
                        setPolicyFormData({
                          ...policyFormData,
                          maxBreakDurationMins: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-600 uppercase mb-1">
                      Max Breaks / Day
                    </label>
                    <input
                      type="number"
                      value={policyFormData.maxBreaksPerDay || 2}
                      onChange={(e) =>
                        setPolicyFormData({
                          ...policyFormData,
                          maxBreaksPerDay: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-600 uppercase mb-1">
                      Break Type
                    </label>
                    <select
                      value={policyFormData.breakType || 'UNPAID'}
                      onChange={(e) =>
                        setPolicyFormData({ ...policyFormData, breakType: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-xs"
                    >
                      <option value="UNPAID">Unpaid</option>
                      <option value="PAID">Paid</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-600 uppercase mb-1">
                    Break Excess Action
                  </label>
                  <select
                    value={policyFormData.breakExcessAction || 'DEDUCT_EXCESS'}
                    onChange={(e) =>
                      setPolicyFormData({
                        ...policyFormData,
                        breakExcessAction: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-xs"
                  >
                    <option value="DEDUCT_EXCESS">Deduct Excess Time</option>
                    <option value="MARK_EXCEPTION">Mark Attendance Exception</option>
                    <option value="HR_REVIEW">Flag for HR Review</option>
                    <option value="NONE">None</option>
                  </select>
                </div>
              </div>

              {/* SECTION 6: DEDUCTIONS */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                <span className="text-[11px] font-black text-slate-900 uppercase tracking-wider block border-b border-slate-200 pb-1">
                  6. Attendance Deductions & Penalties
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black text-slate-600 uppercase mb-1">
                      Late Arrival Deduction (%)
                    </label>
                    <input
                      type="number"
                      value={policyFormData.lateArrivalDeductionPct ?? 25}
                      onChange={(e) =>
                        setPolicyFormData({
                          ...policyFormData,
                          lateArrivalDeductionPct: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-600 uppercase mb-1">
                      Early Checkout Deduction (%)
                    </label>
                    <input
                      type="number"
                      value={policyFormData.earlyCheckoutDeductionPct ?? 25}
                      onChange={(e) =>
                        setPolicyFormData({
                          ...policyFormData,
                          earlyCheckoutDeductionPct: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black text-slate-600 uppercase mb-1">
                      Full Day Absence (%)
                    </label>
                    <input
                      type="number"
                      value={policyFormData.fullDayAbsenceDeductionPct ?? 100}
                      onChange={(e) =>
                        setPolicyFormData({
                          ...policyFormData,
                          fullDayAbsenceDeductionPct: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-600 uppercase mb-1">
                      Half Day Deduction (%)
                    </label>
                    <input
                      type="number"
                      value={policyFormData.halfDayDeductionPct ?? 50}
                      onChange={(e) =>
                        setPolicyFormData({
                          ...policyFormData,
                          halfDayDeductionPct: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Leave Policy Fields */}
          {editingPolicyCategory === 'leave' && (
            <>
              <div>
                <label className="block text-[11px] font-black text-slate-700 uppercase mb-1">
                  Policy Name
                </label>
                <input
                  type="text"
                  value={policyFormData.name || ''}
                  onChange={(e) => setPolicyFormData({ ...policyFormData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black text-slate-700 uppercase mb-1">
                    Min Notice (Days)
                  </label>
                  <input
                    type="number"
                    value={policyFormData.minNoticePeriodDays || 2}
                    onChange={(e) =>
                      setPolicyFormData({ ...policyFormData, minNoticePeriodDays: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-700 uppercase mb-1">
                    Max Consecutive (Days)
                  </label>
                  <input
                    type="number"
                    value={policyFormData.maxConsecutiveDays || 10}
                    onChange={(e) =>
                      setPolicyFormData({ ...policyFormData, maxConsecutiveDays: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold"
                  />
                </div>
              </div>
            </>
          )}

          {/* Salary Policy Fields */}
          {editingPolicyCategory === 'salary' && (
            <>
              <div>
                <label className="block text-[11px] font-black text-slate-700 uppercase mb-1">
                  Policy Name
                </label>
                <input
                  type="text"
                  value={policyFormData.name || ''}
                  onChange={(e) => setPolicyFormData({ ...policyFormData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black text-slate-700 uppercase mb-1">
                    Overtime Multiplier
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={policyFormData.overtimeMultiplier || 1.5}
                    onChange={(e) =>
                      setPolicyFormData({ ...policyFormData, overtimeMultiplier: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-700 uppercase mb-1">
                    PF Contribution (%)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={policyFormData.pfPercent || 12.0}
                    onChange={(e) =>
                      setPolicyFormData({ ...policyFormData, pfPercent: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold"
                  />
                </div>
              </div>
            </>
          )}

          {/* Claim Policy Fields */}
          {editingPolicyCategory === 'claims' && (
            <>
              <div>
                <label className="block text-[11px] font-black text-slate-700 uppercase mb-1">
                  Max per Receipt (₹)
                </label>
                <input
                  type="number"
                  value={policyFormData.maxClaimAmountPerReceipt || 25000}
                  onChange={(e) =>
                    setPolicyFormData({ ...policyFormData, maxClaimAmountPerReceipt: Number(e.target.value) })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-700 uppercase mb-1">
                  Monthly Claim Limit (₹)
                </label>
                <input
                  type="number"
                  value={policyFormData.monthlyClaimLimit || 100000}
                  onChange={(e) =>
                    setPolicyFormData({ ...policyFormData, monthlyClaimLimit: Number(e.target.value) })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold"
                />
              </div>
            </>
          )}
        </form>
      </AdminFormDrawer>

      {/* =========================================================================
          DRAWER 4: LEAVE REQUEST DETAILS DRAWER
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
              </div>
            </div>
          </div>
        )}
      </AdminFormDrawer>

      {/* =========================================================================
          DRAWER 5: DECLARE / EDIT PUBLIC HOLIDAY
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
              className="px-4 py-2.5 rounded-2xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
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
              Applicable Office Scope
            </label>
            <select
              value={holidayForm.officeId}
              onChange={(e) => setHolidayForm({ ...holidayForm, officeId: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
            >
              <option value="">All Offices (Company-wide)</option>
              {offices.map((o: any) => (
                <option key={o.id} value={o.id}>
                  {o.name} {o.city ? `(${o.city})` : ''}
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
        </form>
      </AdminFormDrawer>

      {/* =========================================================================
          CONFIRMATION MODALS (APPROVE / REJECT / DELETE HOLIDAY)
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
                placeholder="Enter rejection reason..."
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
              Are you sure you want to remove this public holiday?
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
