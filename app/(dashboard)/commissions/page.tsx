'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Coins,
  Search,
  Filter,
  CheckCircle,
  Clock,
  XCircle,
  Check,
  Calendar,
  User,
  Building2,
  Award,
  DollarSign,
  TrendingUp,
  RefreshCw,
  Sliders,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CreditCard,
  Percent,
  Layers,
} from 'lucide-react';
import api from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

interface CommissionRecord {
  id: number;
  customerId: number;
  employeeId: number;
  leadId?: number | null;
  planId?: number | null;
  purchaseId?: number | null;
  orderId?: string | null;
  commissionType: 'PERCENTAGE' | 'FIXED';
  commissionRate: number;
  purchaseAmount: number;
  commissionAmount: number;
  status: 'PENDING' | 'APPROVED' | 'PAID' | 'CANCELLED';
  paidAt?: string | null;
  createdAt: string;
  updatedAt: string;
  employee?: {
    id: number;
    firstName: string;
    lastName: string;
    employeeCode: string;
    email: string;
    designation?: {
      id: number;
      name: string;
      code: string;
    };
  };
  lead?: {
    id: number;
    firstName: string;
    lastName: string;
    companyName?: string;
    title?: string;
    phone?: string;
    email?: string;
  };
  customer?: {
    id: number;
    name: string;
    companyName?: string;
    email?: string;
    phone?: string;
  };
  plan?: {
    id: number;
    name: string;
    monthlyPrice?: number;
    yearlyPrice?: number;
  };
  purchase?: {
    id: number;
    orderNumber?: string;
    paymentId?: string;
    amount?: number;
    totalAmount?: number;
    status?: string;
  };
}

interface DesignationConfig {
  id: number;
  name: string;
  code: string;
  description?: string;
  commissionEnabled: boolean;
  commissionType: 'PERCENTAGE' | 'FIXED';
  commissionRate: number;
  employeeCount: number;
  crmMobileAccess: boolean;
}

function CommissionManagementContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'records' | 'settings'>(
    tabParam === 'settings' ? 'settings' : 'records'
  );

  // Filters state
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [employeeFilter, setEmployeeFilter] = useState<string>('ALL');
  const [designationFilter, setDesignationFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const limit = 15;

  // Selected commission for "Mark as Paid" modal
  const [payingCommission, setPayingCommission] = useState<CommissionRecord | null>(null);
  const [payNotes, setPayNotes] = useState('');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Sync tab with URL
  const handleTabChange = (newTab: 'records' | 'settings') => {
    setActiveTab(newTab);
    const params = new URLSearchParams(searchParams.toString());
    if (newTab === 'settings') {
      params.set('tab', 'settings');
    } else {
      params.delete('tab');
    }
    router.replace(`/commissions?${params.toString()}`);
  };

  // 1. Fetch Commission Records
  const {
    data: commissionsRes,
    isLoading: isCommissionsLoading,
    isRefetching: isCommissionsRefetching,
    refetch: refetchCommissions,
  } = useQuery({
    queryKey: [
      'admin-commissions',
      page,
      limit,
      debouncedSearch,
      statusFilter,
      employeeFilter,
      designationFilter,
    ],
    queryFn: async () => {
      const params: any = { page, limit };
      if (debouncedSearch) params.search = debouncedSearch;
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (employeeFilter !== 'ALL') params.employeeId = Number(employeeFilter);
      if (designationFilter !== 'ALL') params.designationId = Number(designationFilter);

      const res = await api.get('/commissions/admin', { params });
      return res.data;
    },
    enabled: activeTab === 'records',
  });

  // 2. Fetch Designations Config
  const {
    data: designationsRes,
    isLoading: isDesignationsLoading,
    refetch: refetchDesignations,
  } = useQuery({
    queryKey: ['admin-designation-commissions'],
    queryFn: async () => {
      const res = await api.get('/commissions/configs/designations');
      return res.data;
    },
  });

  // 3. Fetch Employees for Filter
  const { data: employeesRes } = useQuery({
    queryKey: ['active-employees-filter'],
    queryFn: async () => {
      const res = await api.get('/employees', { params: { limit: 200, status: 'ACTIVE' } });
      return Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
    },
  });

  // Local state for designation changes
  const [desigConfigs, setDesigConfigs] = useState<DesignationConfig[]>([]);

  useEffect(() => {
    if (Array.isArray(designationsRes)) {
      setDesigConfigs(designationsRes);
    }
  }, [designationsRes]);

  // Mutation: Mark Commission as Paid / Update Status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: number; status: string; notes?: string }) => {
      const res = await api.patch(`/commissions/${id}/status`, { status, notes });
      return res.data;
    },
    onSuccess: (_, vars) => {
      toast.success(
        vars.status === 'PAID' ? 'Commission marked as PAID successfully!' : 'Commission status updated!'
      );
      setPayingCommission(null);
      setPayNotes('');
      queryClient.invalidateQueries({ queryKey: ['admin-commissions'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to update commission status');
    },
  });

  // Mutation: Save Designation Commission Config
  const updateDesignationMutation = useMutation({
    mutationFn: async (config: DesignationConfig) => {
      const res = await api.patch(`/commissions/configs/designations/${config.id}`, {
        designationId: config.id,
        commissionEnabled: config.commissionEnabled,
        commissionType: config.commissionType,
        commissionRate: Number(config.commissionRate) || 0,
      });
      return res.data;
    },
    onSuccess: (updated) => {
      toast.success(`Updated commission configuration for ${updated.name || 'Designation'}`);
      queryClient.invalidateQueries({ queryKey: ['admin-designation-commissions'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to update designation config');
    },
  });

  const commissions: CommissionRecord[] = commissionsRes?.data || [];
  const meta = commissionsRes?.meta || { total: 0, page: 1, limit: 15, totalPages: 1 };
  const summary = commissionsRes?.summary || {
    totalCommission: 0,
    pendingCommission: 0,
    approvedCommission: 0,
    paidCommission: 0,
    totalCount: 0,
    pendingCount: 0,
    approvedCount: 0,
    paidCount: 0,
  };

  const employeesList = Array.isArray(employeesRes) ? employeesRes : [];
  const designationsList = Array.isArray(designationsRes) ? designationsRes : [];

  const handleDesignationToggle = (id: number) => {
    setDesigConfigs((prev) =>
      prev.map((d) => (d.id === id ? { ...d, commissionEnabled: !d.commissionEnabled } : d))
    );
  };

  const handleDesignationRateChange = (id: number, rate: number) => {
    setDesigConfigs((prev) =>
      prev.map((d) => (d.id === id ? { ...d, commissionRate: rate } : d))
    );
  };

  const handleDesignationTypeChange = (id: number, type: 'PERCENTAGE' | 'FIXED') => {
    setDesigConfigs((prev) =>
      prev.map((d) => (d.id === id ? { ...d, commissionType: type } : d))
    );
  };

  const handleSaveDesignation = (config: DesignationConfig) => {
    updateDesignationMutation.mutate(config);
  };

  const formatCurrency = (amt: number = 0) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amt);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl shadow-xs">
              <Coins className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Commission Management
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                BPO, Telecaller & Telesales Performance & Conversion Commissions
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl self-start md:self-auto border border-slate-200/80">
          <button
            onClick={() => handleTabChange('records')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'records'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Coins className="w-4 h-4 text-emerald-600" />
            <span>Commission Records</span>
            {meta.total > 0 && (
              <span className="ml-1 px-2 py-0.5 text-xs font-bold bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
                {meta.total}
              </span>
            )}
          </button>
          <button
            onClick={() => handleTabChange('settings')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'settings'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-4 h-4 text-indigo-600" />
            <span>Eligibility & Rates</span>
          </button>
        </div>
      </div>

      {activeTab === 'records' ? (
        <>
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Commission */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Total Generated
                </p>
                <p className="text-2xl font-black text-slate-900 mt-1">
                  {formatCurrency(summary.totalCommission)}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {summary.totalCount} total conversions
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                <Coins className="w-6 h-6" />
              </div>
            </div>

            {/* Approved / Earned */}
            <div className="bg-white rounded-2xl p-5 border border-emerald-200/80 bg-emerald-50/20 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                  Earned / Approved
                </p>
                <p className="text-2xl font-black text-emerald-600 mt-1">
                  {formatCurrency(summary.approvedCommission)}
                </p>
                <p className="text-xs text-emerald-600 mt-0.5">
                  {summary.approvedCount} payable to staff
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>

            {/* Paid */}
            <div className="bg-white rounded-2xl p-5 border border-blue-200/80 bg-blue-50/20 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">
                  Paid to Employees
                </p>
                <p className="text-2xl font-black text-blue-600 mt-1">
                  {formatCurrency(summary.paidCommission)}
                </p>
                <p className="text-xs text-blue-600 mt-0.5">
                  {summary.paidCount} payouts settled
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700">
                <CheckCircle className="w-6 h-6" />
              </div>
            </div>

            {/* Pending */}
            <div className="bg-white rounded-2xl p-5 border border-amber-200/80 bg-amber-50/20 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
                  Pending Verification
                </p>
                <p className="text-2xl font-black text-amber-600 mt-1">
                  {formatCurrency(summary.pendingCommission)}
                </p>
                <p className="text-xs text-amber-600 mt-0.5">
                  {summary.pendingCount} awaiting approval
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
                <Clock className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Search */}
              <div className="relative lg:col-span-2">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search employee, customer, lead, order ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>

              {/* Status Filter */}
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="APPROVED">Earned / Approved</option>
                  <option value="PAID">Paid</option>
                  <option value="PENDING">Pending</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              {/* Designation Filter */}
              <div>
                <select
                  value={designationFilter}
                  onChange={(e) => {
                    setDesignationFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  <option value="ALL">All Designations</option>
                  {designationsList.map((d: any) => (
                    <option key={d.id} value={d.id}>
                      {d.name} {d.commissionEnabled ? '✓' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Employee Filter */}
              <div>
                <select
                  value={employeeFilter}
                  onChange={(e) => {
                    setEmployeeFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  <option value="ALL">All Staff</option>
                  {employeesList.map((emp: any) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName || ''} ({emp.employeeCode || emp.id})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Active Filters / Reset */}
            {(search || statusFilter !== 'ALL' || employeeFilter !== 'ALL' || designationFilter !== 'ALL') && (
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                <span>Filters active</span>
                <button
                  onClick={() => {
                    setSearch('');
                    setStatusFilter('ALL');
                    setEmployeeFilter('ALL');
                    setDesignationFilter('ALL');
                    setPage(1);
                  }}
                  className="font-semibold text-emerald-600 hover:text-emerald-700 cursor-pointer"
                >
                  Reset all filters
                </button>
              </div>
            )}
          </div>

          {/* Commission Records Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Employee</th>
                    <th className="py-3.5 px-4">Converted Customer</th>
                    <th className="py-3.5 px-4">Plan / Purchase</th>
                    <th className="py-3.5 px-4">Rate</th>
                    <th className="py-3.5 px-4">Commission</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Earned Date</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {isCommissionsLoading ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                        <span>Loading commission records...</span>
                      </td>
                    </tr>
                  ) : commissions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-500">
                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
                          <Coins className="w-6 h-6" />
                        </div>
                        <p className="font-semibold text-slate-700">No commission records found</p>
                        <p className="text-xs text-slate-400 mt-1">
                          When eligible BPO/telecaller staff convert leads into paying customers, commissions will appear here.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    commissions.map((c) => {
                      const empName = c.employee
                        ? `${c.employee.firstName} ${c.employee.lastName || ''}`.trim()
                        : 'Unknown Employee';
                      const desigName = c.employee?.designation?.name || 'Staff';
                      const custName = c.customer?.companyName || c.customer?.name || 'Customer';
                      const leadTitle = c.lead?.companyName || c.lead?.title || `${c.lead?.firstName || ''} ${c.lead?.lastName || ''}`.trim() || 'Direct';
                      const planName = c.plan?.name || 'Plan Purchase';

                      return (
                        <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                          {/* Employee */}
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-900">{empName}</div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-xs font-mono text-slate-400">{c.employee?.employeeCode || `#${c.employeeId}`}</span>
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                                {desigName}
                              </span>
                            </div>
                          </td>

                          {/* Customer & Lead */}
                          <td className="py-3.5 px-4">
                            <div className="font-medium text-slate-900">{custName}</div>
                            <div className="text-xs text-slate-400 mt-0.5">
                              Lead: <span className="text-slate-600">{leadTitle}</span>
                            </div>
                          </td>

                          {/* Plan & Purchase */}
                          <td className="py-3.5 px-4">
                            <div className="font-medium text-slate-800">{planName}</div>
                            <div className="text-xs text-slate-500 font-mono mt-0.5">
                              Paid: {formatCurrency(c.purchaseAmount)}
                            </div>
                          </td>

                          {/* Rate */}
                          <td className="py-3.5 px-4 font-mono font-medium text-slate-700">
                            {c.commissionRate}
                            {c.commissionType === 'PERCENTAGE' ? '%' : ' ₹'}
                          </td>

                          {/* Commission Amount */}
                          <td className="py-3.5 px-4">
                            <span className="font-black text-emerald-600 text-base">
                              {formatCurrency(c.commissionAmount)}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4">
                            {c.status === 'APPROVED' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                Earned
                              </span>
                            )}
                            {c.status === 'PAID' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                <Check className="w-3 h-3 text-blue-600" />
                                Paid
                              </span>
                            )}
                            {c.status === 'PENDING' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                <Clock className="w-3 h-3 text-amber-600" />
                                Pending
                              </span>
                            )}
                            {c.status === 'CANCELLED' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                <XCircle className="w-3 h-3 text-rose-600" />
                                Cancelled
                              </span>
                            )}
                          </td>

                          {/* Earned Date */}
                          <td className="py-3.5 px-4 text-xs text-slate-500">
                            <div>{new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                            {c.paidAt && (
                              <div className="text-[11px] text-blue-600 mt-0.5">
                                Paid: {new Date(c.paidAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                              </div>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right">
                            {c.status !== 'PAID' && c.status !== 'CANCELLED' ? (
                              <button
                                onClick={() => setPayingCommission(c)}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer"
                              >
                                Mark as Paid
                              </button>
                            ) : c.status === 'PAID' ? (
                              <span className="text-xs font-semibold text-blue-600">Settled</span>
                            ) : (
                              <span className="text-xs text-slate-400">Void</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {meta.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 bg-slate-50/60 border-t border-slate-200 text-sm text-slate-600">
                <span className="text-xs">
                  Showing <strong className="text-slate-900">{(meta.page - 1) * meta.limit + 1}</strong> to{' '}
                  <strong className="text-slate-900">{Math.min(meta.page * meta.limit, meta.total)}</strong> of{' '}
                  <strong className="text-slate-900">{meta.total}</strong> records
                </span>

                <div className="flex items-center gap-2">
                  <button
                    disabled={meta.page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="p-1.5 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed text-slate-600"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-semibold px-2">
                    Page {meta.page} of {meta.totalPages}
                  </span>
                  <button
                    disabled={meta.page >= meta.totalPages}
                    onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                    className="p-1.5 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed text-slate-600"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        /* Settings Tab: Designation Commission Eligibility & Rates */
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Designation Commission Rates & Eligibility
                </h2>
                <p className="text-sm text-slate-500 mt-1 max-w-3xl">
                  Configure which employee designations (e.g. Telecaller, Telesales Executive) are eligible for conversion commission.
                  When an employee converts a Lead into a Customer and that Customer purchases a plan, commission will be automatically awarded using their designation rate.
                </p>
              </div>
              <button
                onClick={() => refetchDesignations()}
                className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600"
                title="Refresh Designations"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    <th className="py-3 px-4">Designation</th>
                    <th className="py-3 px-4">Staff Count</th>
                    <th className="py-3 px-4">Commission Status</th>
                    <th className="py-3 px-4">Calculation Type</th>
                    <th className="py-3 px-4">Commission Rate</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {isDesignationsLoading ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-600" />
                        Loading designation configurations...
                      </td>
                    </tr>
                  ) : desigConfigs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        No designations configured yet.
                      </td>
                    </tr>
                  ) : (
                    desigConfigs.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-50/50 transition-colors">
                        {/* Name & Code */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900">{d.name}</div>
                          <div className="text-xs text-slate-400 font-mono mt-0.5">{d.code}</div>
                        </td>

                        {/* Staff count */}
                        <td className="py-3.5 px-4 text-slate-600">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                            {d.employeeCount} active
                          </span>
                        </td>

                        {/* Enabled Toggle */}
                        <td className="py-3.5 px-4">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={d.commissionEnabled}
                              onChange={() => handleDesignationToggle(d.id)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                            <span className="ml-2.5 text-xs font-semibold text-slate-700">
                              {d.commissionEnabled ? 'Eligible' : 'Disabled'}
                            </span>
                          </label>
                        </td>

                        {/* Calculation Type */}
                        <td className="py-3.5 px-4">
                          <select
                            disabled={!d.commissionEnabled}
                            value={d.commissionType}
                            onChange={(e) =>
                              handleDesignationTypeChange(d.id, e.target.value as 'PERCENTAGE' | 'FIXED')
                            }
                            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          >
                            <option value="PERCENTAGE">Percentage (%)</option>
                            <option value="FIXED">Fixed Amount (₹)</option>
                          </select>
                        </td>

                        {/* Rate input */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 w-32">
                            <input
                              type="number"
                              disabled={!d.commissionEnabled}
                              value={d.commissionRate}
                              onChange={(e) =>
                                handleDesignationRateChange(d.id, Number(e.target.value) || 0)
                              }
                              min={0}
                              step={0.5}
                              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                            <span className="text-xs font-bold text-slate-500">
                              {d.commissionType === 'PERCENTAGE' ? '%' : '₹'}
                            </span>
                          </div>
                        </td>

                        {/* Action */}
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleSaveDesignation(d)}
                            disabled={updateDesignationMutation.isPending}
                            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                          >
                            Save
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200/80 text-xs text-emerald-800 flex items-start gap-2.5">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Automatic Commission Execution</p>
                <p className="text-emerald-700 mt-0.5">
                  Whenever a Telecaller or Telesales representative marks a Lead as WON and that customer completes a plan purchase, the system automatically logs a commission transaction at the configured percentage. Historical commissions remain protected and will never recalculate if you change these rates later.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* "Mark as Paid" Confirmation Modal */}
      {payingCommission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xl max-w-md w-full space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Mark Commission as Paid</h3>
                <p className="text-xs text-slate-500">Confirm payment payout to employee</p>
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Employee:</span>
                <span className="font-semibold text-slate-900">
                  {payingCommission.employee?.firstName} {payingCommission.employee?.lastName} (
                  {payingCommission.employee?.employeeCode || `#${payingCommission.employeeId}`})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Customer:</span>
                <span className="font-medium text-slate-800">{payingCommission.customer?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Purchase Amount:</span>
                <span className="font-medium text-slate-800">{formatCurrency(payingCommission.purchaseAmount)}</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-slate-200">
                <span className="font-bold text-slate-700">Commission Amount:</span>
                <span className="font-black text-emerald-600 text-base">
                  {formatCurrency(payingCommission.commissionAmount)}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Payment Reference / Note (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Bank Ref #1234, UPI, Payroll batch"
                value={payNotes}
                onChange={(e) => setPayNotes(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setPayingCommission(null);
                  setPayNotes('');
                }}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={updateStatusMutation.isPending}
                onClick={() =>
                  updateStatusMutation.mutate({
                    id: payingCommission.id,
                    status: 'PAID',
                    notes: payNotes,
                  })
                }
                className="px-4 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                {updateStatusMutation.isPending ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                Confirm Payout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CommissionPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading commission portal...</div>}>
      <CommissionManagementContent />
    </Suspense>
  );
}
