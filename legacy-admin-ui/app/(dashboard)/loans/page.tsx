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
  Plus,
} from 'lucide-react';
import api from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { AdminPageHeader, AdminButton, AdminFormDrawer, AdminPagination, AdminStatusTabs } from '@/components/admin';
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
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Create form state
  const [createForm, setCreateForm] = useState({
    employeeId: '',
    loanAmount: '',
    termMonths: 12,
    interestRate: 0,
    reason: '',
    notes: '',
  });

  // Review states
  const [reviewApprovedAmount, setReviewApprovedAmount] = useState<string>('');
  const [reviewTermMonths, setReviewTermMonths] = useState<number>(12);
  const [reviewStartDate, setReviewStartDate] = useState<string>('');
  const [rejectReason, setRejectReason] = useState<string>('');

  // Queries
  const { data: employeesData } = useQuery({
    queryKey: ['admin-employees-list-loans-dropdown'],
    queryFn: async () => {
      const res: any = await api.get('/employees?limit=200');
      const items = res.data?.data || res.data?.items || (Array.isArray(res.data) ? res.data : []);
      return Array.isArray(items) ? items : [];
    },
  });

  const employeesList = Array.isArray(employeesData) ? employeesData : [];

  const { data: metrics, isLoading: isMetricsLoading, refetch: refetchMetrics } = useQuery({
    queryKey: ['loans-metrics'],
    queryFn: async () => {
      const res = await api.get('/loans/metrics');
      return res.data?.data || res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post('/loans', payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Loan issued successfully');
      setIsCreateOpen(false);
      setCreateForm({
        employeeId: '',
        loanAmount: '',
        termMonths: 12,
        interestRate: 0,
        reason: '',
        notes: '',
      });
      queryClient.invalidateQueries({ queryKey: ['loans-list'] });
      queryClient.invalidateQueries({ queryKey: ['loans-metrics'] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
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
      {/* 1. STANDARD PAGE HEADER */}
      <AdminPageHeader
        title="Loan & Advance Management"
        description="Manage company loans, employee advances, monthly salary deductions, and repayments."
        icon={Banknote}
        iconColor="text-[#1AA14D]"
        badge={{
          text: 'HRM • FINANCIAL BENEFITS & LOANS',
          icon: Banknote,
          variant: 'emerald',
        }}
        breadcrumbs={[
          { label: 'Workforce', href: '/employees' },
          { label: 'Loans' },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <AdminButton
              variant="outline"
              size="md"
              icon={RefreshCw}
              loading={isLoansLoading || isMetricsLoading}
              onClick={() => {
                refetchLoans();
                refetchMetrics();
              }}
              title="Refresh"
            >
              Refresh
            </AdminButton>

            <AdminButton
              variant="primary"
              size="md"
              icon={Plus}
              onClick={() => setIsCreateOpen(true)}
            >
              Issue Loan
            </AdminButton>
          </div>
        }
      />

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
          <AdminStatusTabs<LoanTab>
            activeTab={activeTab}
            onChange={(tab) => {
              setActiveTab(tab);
              setPage(1);
            }}
            tabs={[
              { key: 'ALL', label: 'All Loans', count: metrics?.totalLoans ?? 0 },
              { key: 'ACTIVE', label: 'Active', count: metrics?.activeLoans ?? 0 },
              { key: 'APPROVED', label: 'Approved', count: metrics?.approvedLoans ?? 0 },
              { key: 'PAID', label: 'Paid', count: metrics?.paidLoans ?? 0 },
              { key: 'PENDING', label: 'Pending', count: metrics?.pendingLoans ?? 0 },
              { key: 'REJECTED', label: 'Rejected', count: metrics?.rejectedLoans ?? 0 },
            ]}
          />

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

      {/* Issue / Create Loan Drawer */}
      <AdminFormDrawer
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Issue Employee Loan"
        subtitle="Grant a company advance or loan with custom EMI schedule"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!createForm.employeeId) {
              toast.error('Please select an employee');
              return;
            }
            const amount = Number(createForm.loanAmount);
            if (!amount || amount <= 0) {
              toast.error('Please enter a valid loan amount');
              return;
            }
            if (createForm.termMonths < 1) {
              toast.error('Term must be at least 1 month');
              return;
            }
            const emi = Math.round((amount / createForm.termMonths) * 100) / 100;
            createMutation.mutate({
              employeeId: Number(createForm.employeeId),
              loanAmount: amount,
              termMonths: Number(createForm.termMonths),
              interestRate: Number(createForm.interestRate || 0),
              monthlyEmi: emi,
              reason: createForm.reason,
              notes: createForm.notes || undefined,
            });
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Employee <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={createForm.employeeId}
              onChange={(e) => setCreateForm({ ...createForm, employeeId: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Select an employee...</option>
              {employeesList.map((emp: any) => (
                <option key={emp.id} value={emp.id}>
                  {emp.user?.name || emp.name || `Employee #${emp.id}`} {emp.employeeCode ? `(${emp.employeeCode})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Principal Loan Amount (₹) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              step="any"
              required
              placeholder="e.g. 50000"
              value={createForm.loanAmount}
              onChange={(e) => setCreateForm({ ...createForm, loanAmount: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Repayment Term (Months) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                max="120"
                required
                value={createForm.termMonths}
                onChange={(e) => setCreateForm({ ...createForm, termMonths: Math.max(1, Number(e.target.value)) })}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Interest Rate (% p.a.)
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                placeholder="0"
                value={createForm.interestRate}
                onChange={(e) => setCreateForm({ ...createForm, interestRate: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* EMI Preview Card */}
          {Number(createForm.loanAmount) > 0 && createForm.termMonths > 0 && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl flex items-center justify-between text-xs">
              <span className="font-semibold text-emerald-800 dark:text-emerald-300">
                Estimated Monthly Deduction (EMI):
              </span>
              <span className="font-black text-sm text-emerald-900 dark:text-emerald-200">
                {formatCurrency(Math.round((Number(createForm.loanAmount) / createForm.termMonths) * 100) / 100)} / mo
              </span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Purpose / Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              placeholder="e.g. Medical emergency, relocation advance, higher education..."
              value={createForm.reason}
              onChange={(e) => setCreateForm({ ...createForm, reason: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              HR / Admin Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Approved under company staff policy scheme"
              value={createForm.notes}
              onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-5 py-2 text-sm bg-[#23C45E] hover:bg-[#1AA14D] text-slate-950 font-black rounded-lg shadow-sm disabled:opacity-50"
            >
              {createMutation.isPending ? 'Issuing...' : 'Issue Loan'}
            </button>
          </div>
        </form>
      </AdminFormDrawer>
    </div>
  );
}
