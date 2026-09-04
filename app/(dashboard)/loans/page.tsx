'use client';

import React, { useState } from 'react';
import {
  Banknote,
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
  RefreshCw,
  AlertCircle,
  FileText,
  DollarSign,
  TrendingUp,
  Percent,
  Trash2,
} from 'lucide-react';
import api from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { AdminFormDrawer, AdminPagination } from '@/components/admin';
import { getErrorMessage } from '@/lib/utils';

type LoanTab = 'ALL' | 'PENDING' | 'ACTIVE' | 'APPROVED' | 'PAID' | 'REJECTED';

interface LoanRecord {
  id: number;
  customerId: number;
  employeeId: number;
  employeeName: string;
  department: string;
  designation: string;
  loanAmount: number;
  approvedAmount?: number;
  reason: string;
  termMonths: number;
  monthlyEmi: number;
  interestRate: number;
  startDate?: string;
  remainingBalance?: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ACTIVE' | 'PAID' | 'CANCELLED';
  rejectionReason?: string;
  approvedByName?: string;
  notes?: string;
  createdAt: string;
  employee?: {
    id: number;
    employeeCode: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
}

export default function LoansPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<LoanTab>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selectedLoan, setSelectedLoan] = useState<LoanRecord | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);

  // Review states
  const [reviewApprovedAmount, setReviewApprovedAmount] = useState<string>('');
  const [reviewTermMonths, setReviewTermMonths] = useState<number>(12);
  const [reviewStartDate, setReviewStartDate] = useState<string>('');
  const [rejectReason, setRejectReason] = useState<string>('');

  // Queries
  const { data: metrics, isLoading: isMetricsLoading, refetch: refetchMetrics } = useQuery({
    queryKey: ['loans-metrics'],
    queryFn: async () => {
      const res = await api.get('/loans/metrics');
      return res.data?.data || res.data;
    },
  });

  const { data: loansResponse, isLoading: isLoansLoading, refetch: refetchLoans } = useQuery({
    queryKey: ['loans-list', activeTab, searchQuery, page, pageSize],
    queryFn: async () => {
      const params: any = { page, limit: pageSize };
      if (activeTab !== 'ALL') params.status = activeTab;
      if (searchQuery) params.search = searchQuery;
      const res: any = await api.get('/loans', { params });
      const items = res.data?.data || res.data?.items || (Array.isArray(res.data) ? res.data : []);
      const pagination = res.pagination || res.meta || res.data?.pagination || {
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
    },
  });

  const loansList: LoanRecord[] = loansResponse?.items || [];
  const loansPagination = loansResponse?.pagination || { page: 1, pageSize: 20, total: 0, totalPages: 1 };

  const approveMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: any }) => {
      const res = await api.patch(`/loans/${id}/approve`, payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Loan approved and activated successfully');
      setIsReviewOpen(false);
      setSelectedLoan(null);
      queryClient.invalidateQueries({ queryKey: ['loans-list'] });
      queryClient.invalidateQueries({ queryKey: ['loans-metrics'] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, rejectionReason }: { id: number; rejectionReason: string }) => {
      const res = await api.patch(`/loans/${id}/reject`, { rejectionReason });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Loan request rejected');
      setIsRejectOpen(false);
      setSelectedLoan(null);
      queryClient.invalidateQueries({ queryKey: ['loans-list'] });
      queryClient.invalidateQueries({ queryKey: ['loans-metrics'] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await api.delete(`/loans/${id}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Loan record removed');
      queryClient.invalidateQueries({ queryKey: ['loans-list'] });
      queryClient.invalidateQueries({ queryKey: ['loans-metrics'] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  const handleApproveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoan) return;
    const amount = Number(reviewApprovedAmount || selectedLoan.loanAmount);
    const emi = Math.round((amount / reviewTermMonths) * 100) / 100;
    approveMutation.mutate({
      id: selectedLoan.id,
      payload: {
        approvedAmount: amount,
        termMonths: reviewTermMonths,
        monthlyEmi: emi,
        startDate: reviewStartDate || new Date().toISOString(),
      },
    });
  };

  const handleRejectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoan || !rejectReason) {
      toast.error('Please specify the reason for rejection');
      return;
    }
    rejectMutation.mutate({
      id: selectedLoan.id,
      rejectionReason: rejectReason,
    });
  };

  const formatCurrency = (val?: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
      case 'ACTIVE':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"><CheckCircle className="w-3.5 h-3.5" /> Active</span>;
      case 'PENDING':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20"><Clock className="w-3.5 h-3.5" /> Pending HR Review</span>;
      case 'PAID':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 border border-blue-500/20"><Check className="w-3.5 h-3.5" /> Fully Repaid</span>;
      case 'REJECTED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-600 border border-red-500/20"><XCircle className="w-3.5 h-3.5" /> Rejected</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-600">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-16 text-slate-800 animate-in fade-in-50 duration-200">
      {/* 1. Page Hero Header Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-slate-700/60 shadow-xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-[#23C45E]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-[#23C45E] border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-[#23C45E] animate-pulse" />
                HRM • Financial Benefits & Loans
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              Loan & Advance Management
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-2xl leading-relaxed">
              Manage company loans, employee advances, monthly salary deductions, and repayments.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                refetchLoans();
                refetchMetrics();
              }}
              disabled={isLoansLoading || isMetricsLoading}
              className="p-2.5 bg-white/10 hover:bg-white/15 text-white rounded-2xl border border-white/10 text-xs font-black transition-all cursor-pointer backdrop-blur-xs disabled:opacity-50 active:scale-95"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${isLoansLoading || isMetricsLoading ? 'animate-spin text-[#23C45E]' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Outstanding */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase font-black tracking-wider text-slate-400">
              Total Outstanding
            </span>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
              {isMetricsLoading ? '...' : formatCurrency(metrics?.totalOutstanding || 0)}
            </p>
            <span className="text-xs font-bold text-slate-500 mt-0.5 block">
              Active loan balances
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center">
            <Banknote className="w-6 h-6" />
          </div>
        </div>

        {/* Pending Review */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase font-black tracking-wider text-slate-400">
              Pending Review
            </span>
            <p className="text-2xl sm:text-3xl font-black text-amber-600 mt-1">
              {isMetricsLoading ? '...' : (metrics?.pendingLoans ?? 0)}
            </p>
            <span className="text-xs font-bold text-amber-700 mt-0.5 block">
              Awaiting HR approval
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Active Loans */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase font-black tracking-wider text-slate-400">
              Active Loans
            </span>
            <p className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">
              {isMetricsLoading ? '...' : (metrics?.activeLoans ?? 0)}
            </p>
            <span className="text-xs font-bold text-emerald-700 mt-0.5 block">
              Under EMI deduction
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-[#23C45E]" />
          </div>
        </div>

        {/* Total Disbursed */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase font-black tracking-wider text-slate-400">
              Total Disbursed
            </span>
            <p className="text-2xl sm:text-3xl font-black text-blue-600 mt-1">
              {isMetricsLoading ? '...' : formatCurrency(metrics?.totalDisbursed || 0)}
            </p>
            <span className="text-xs font-bold text-slate-500 mt-0.5 block">
              {metrics?.totalLoans || 0} total applications
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        {/* Controls */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900/60 rounded-lg overflow-x-auto">
            {(['ALL', 'PENDING', 'ACTIVE', 'PAID', 'REJECTED'] as LoanTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition ${
                  activeTab === tab
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab === 'ALL' ? 'All Loans' : tab.charAt(0) + tab.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search employee or reason..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="text-xs uppercase bg-slate-50 dark:bg-slate-900/40 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-3.5">Employee</th>
                <th className="px-6 py-3.5">Amount Requested</th>
                <th className="px-6 py-3.5">Tenure & EMI</th>
                <th className="px-6 py-3.5">Remaining Balance</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Application Date</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {isLoansLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                    Loading loan records...
                  </td>
                </tr>
              ) : loansList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="font-semibold text-slate-600 mb-1">No loan applications found</p>
                    <p className="text-xs text-slate-400">There are currently no employee loan applications in this category.</p>
                  </td>
                </tr>
              ) : (
                loansList.map((loan: LoanRecord) => (
                  <tr key={loan.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs uppercase">
                          {loan.employeeName?.slice(0, 2) || 'EM'}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white">{loan.employeeName}</div>
                          <div className="text-xs text-slate-400">
                            {loan.employee?.employeeCode} • {loan.department}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900 dark:text-white">{formatCurrency(loan.loanAmount)}</div>
                      <div className="text-xs text-slate-400 truncate max-w-xs">{loan.reason}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800 dark:text-slate-200">{formatCurrency(loan.monthlyEmi)} / mo</div>
                      <div className="text-xs text-slate-400">{loan.termMonths} months • {loan.interestRate}% int.</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900 dark:text-white">{formatCurrency(loan.remainingBalance || loan.loanAmount)}</div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(loan.status)}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {new Date(loan.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {loan.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedLoan(loan);
                                setReviewApprovedAmount(String(loan.loanAmount));
                                setReviewTermMonths(loan.termMonths || 12);
                                setIsReviewOpen(true);
                              }}
                              className="px-2.5 py-1 text-xs font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 rounded-md border border-emerald-500/20 transition"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                setSelectedLoan(loan);
                                setRejectReason('');
                                setIsRejectOpen(true);
                              }}
                              className="px-2.5 py-1 text-xs font-medium bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 rounded-md border border-red-500/20 transition"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this loan record?')) {
                              deleteMutation.mutate(loan.id);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-red-600 rounded transition"
                          title="Delete loan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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
          total={loansPagination.total}
          totalPages={loansPagination.totalPages}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
          disabled={isLoansLoading}
        />
      </div>

      {/* Review / Approve Drawer */}
      <AdminFormDrawer
        isOpen={isReviewOpen}
        onClose={() => {
          setIsReviewOpen(false);
          setSelectedLoan(null);
        }}
        title="Approve Loan Application"
        subtitle={`Review terms for ${selectedLoan?.employeeName}`}
      >
        <form onSubmit={handleApproveSubmit} className="space-y-4">
          <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 text-xs space-y-1">
            <div className="font-semibold text-slate-700 dark:text-slate-300">Requested Amount: {formatCurrency(selectedLoan?.loanAmount)}</div>
            <div className="text-slate-500">Reason: {selectedLoan?.reason}</div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Sanctioned / Approved Amount (₹) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="500"
              required
              value={reviewApprovedAmount}
              onChange={(e) => setReviewApprovedAmount(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Tenure (Months)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={reviewTermMonths}
                onChange={(e) => setReviewTermMonths(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                EMI Start Date
              </label>
              <input
                type="date"
                value={reviewStartDate}
                onChange={(e) => setReviewStartDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/50 rounded-lg text-xs text-indigo-700 dark:text-indigo-300">
            Monthly EMI Deduction: <span className="font-bold">{formatCurrency(Math.round((Number(reviewApprovedAmount || selectedLoan?.loanAmount || 0) / (reviewTermMonths || 1)) * 100) / 100)} / month</span>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setIsReviewOpen(false)}
              className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={approveMutation.isPending}
              className="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg shadow-sm disabled:opacity-50"
            >
              {approveMutation.isPending ? 'Activating...' : 'Approve & Disburse'}
            </button>
          </div>
        </form>
      </AdminFormDrawer>

      {/* Reject Drawer */}
      <AdminFormDrawer
        isOpen={isRejectOpen}
        onClose={() => {
          setIsRejectOpen(false);
          setSelectedLoan(null);
        }}
        title="Reject Loan Request"
        subtitle={`Provide reason for rejecting ${selectedLoan?.employeeName}'s loan`}
      >
        <form onSubmit={handleRejectSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Rejection Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              required
              placeholder="e.g. Insufficient service duration, active prior loan, policy limit exceeded..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setIsRejectOpen(false)}
              className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={rejectMutation.isPending}
              className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg shadow-sm disabled:opacity-50"
            >
              {rejectMutation.isPending ? 'Rejecting...' : 'Confirm Rejection'}
            </button>
          </div>
        </form>
      </AdminFormDrawer>
    </div>
  );
}
