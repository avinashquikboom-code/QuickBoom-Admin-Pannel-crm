'use client';

import React, { useState } from 'react';
import {
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  Check,
  Plus,
  Search,
  RefreshCw,
  AlertCircle,
  FileText,
  DollarSign,
  TrendingUp,
  Tag,
  ExternalLink,
  Trash2,
  Receipt,
} from 'lucide-react';
import api from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { AdminFormDrawer, AdminPagination } from '@/components/admin';
import { getErrorMessage } from '@/lib/utils';

type ClaimTab = 'ALL' | 'PENDING' | 'APPROVED' | 'PAID' | 'REJECTED';

interface ClaimRecord {
  id: number;
  customerId: number;
  employeeId: number;
  employeeName: string;
  department: string;
  designation: string;
  category: string;
  amount: number;
  approvedAmount?: number;
  description: string;
  receiptUrl?: string;
  claimDate: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID' | 'CANCELLED';
  paymentStatus: string;
  rejectionReason?: string;
  reviewedByName?: string;
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

export default function ClaimsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<ClaimTab>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selectedClaim, setSelectedClaim] = useState<ClaimRecord | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);

  // Form states
  const [formEmployeeId, setFormEmployeeId] = useState<string>('');
  const [formCategory, setFormCategory] = useState<string>('TRAVEL');
  const [formAmount, setFormAmount] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formReceiptUrl, setFormReceiptUrl] = useState<string>('');
  const [formClaimDate, setFormClaimDate] = useState<string>('');

  // Review states
  const [reviewApprovedAmount, setReviewApprovedAmount] = useState<string>('');
  const [reviewNotes, setReviewNotes] = useState<string>('');
  const [rejectReason, setRejectReason] = useState<string>('');

  // Queries
  const { data: metrics, isLoading: isMetricsLoading, refetch: refetchMetrics } = useQuery({
    queryKey: ['claims-metrics'],
    queryFn: async () => {
      const res = await api.get('/claims/metrics');
      return res.data?.data || res.data;
    },
  });

  const { data: claimsResponse, isLoading: isClaimsLoading, refetch: refetchClaims } = useQuery({
    queryKey: ['claims-list', activeTab, selectedCategory, searchQuery, page, pageSize],
    queryFn: async () => {
      const params: any = { page, limit: pageSize };
      if (activeTab !== 'ALL') params.status = activeTab;
      if (selectedCategory !== 'ALL') params.category = selectedCategory;
      if (searchQuery) params.search = searchQuery;
      const res: any = await api.get('/claims', { params });
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

  const claimsList: ClaimRecord[] = claimsResponse?.items || [];
  const claimsPagination = claimsResponse?.pagination || { page: 1, pageSize: 20, total: 0, totalPages: 1 };

  const { data: employeesList = [] } = useQuery({
    queryKey: ['employees-simple-list'],
    queryFn: async () => {
      const res = await api.get('/employees');
      const data = res.data?.data || res.data;
      return Array.isArray(data) ? data : data?.employees || [];
    },
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post('/claims', payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Expense claim submitted successfully');
      setIsCreateOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['claims-list'] });
      queryClient.invalidateQueries({ queryKey: ['claims-metrics'] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  const approveMutation = useMutation({
    mutationFn: async ({ id, approvedAmount, notes }: { id: number; approvedAmount: number; notes?: string }) => {
      const res = await api.patch(`/claims/${id}/approve`, { approvedAmount, notes });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Expense claim approved for reimbursement');
      setIsReviewOpen(false);
      setSelectedClaim(null);
      queryClient.invalidateQueries({ queryKey: ['claims-list'] });
      queryClient.invalidateQueries({ queryKey: ['claims-metrics'] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, rejectionReason }: { id: number; rejectionReason: string }) => {
      const res = await api.patch(`/claims/${id}/reject`, { rejectionReason });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Expense claim rejected');
      setIsRejectOpen(false);
      setSelectedClaim(null);
      queryClient.invalidateQueries({ queryKey: ['claims-list'] });
      queryClient.invalidateQueries({ queryKey: ['claims-metrics'] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  const payMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await api.patch(`/claims/${id}/pay`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Claim marked as paid and reimbursed');
      queryClient.invalidateQueries({ queryKey: ['claims-list'] });
      queryClient.invalidateQueries({ queryKey: ['claims-metrics'] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await api.delete(`/claims/${id}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Claim record deleted');
      queryClient.invalidateQueries({ queryKey: ['claims-list'] });
      queryClient.invalidateQueries({ queryKey: ['claims-metrics'] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  const resetForm = () => {
    setFormEmployeeId('');
    setFormCategory('TRAVEL');
    setFormAmount('');
    setFormDescription('');
    setFormReceiptUrl('');
    setFormClaimDate('');
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEmployeeId || !formAmount || !formDescription) {
      toast.error('Please fill in all required fields');
      return;
    }
    createMutation.mutate({
      employeeId: Number(formEmployeeId),
      category: formCategory,
      amount: Number(formAmount),
      description: formDescription,
      claimDate: formClaimDate || new Date().toISOString(),
      receiptUrl: formReceiptUrl || undefined,
    });
  };

  const handleApproveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClaim) return;
    approveMutation.mutate({
      id: selectedClaim.id,
      approvedAmount: Number(reviewApprovedAmount || selectedClaim.amount),
      notes: reviewNotes || undefined,
    });
  };

  const handleRejectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClaim || !rejectReason) {
      toast.error('Please enter a rejection reason');
      return;
    }
    rejectMutation.mutate({
      id: selectedClaim.id,
      rejectionReason: rejectReason,
    });
  };

  const formatCurrency = (val?: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"><Check className="w-3.5 h-3.5" /> Reimbursed</span>;
      case 'APPROVED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 border border-blue-500/20"><CheckCircle className="w-3.5 h-3.5" /> Approved</span>;
      case 'PENDING':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20"><Clock className="w-3.5 h-3.5" /> Pending Review</span>;
      case 'REJECTED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-600 border border-red-500/20"><XCircle className="w-3.5 h-3.5" /> Rejected</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-600">{status}</span>;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Receipt className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            Claims & Expense Reimbursements
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track employee business expenses, receipts, policy allowances, and reimbursement payouts.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              refetchClaims();
              refetchMetrics();
            }}
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 transition"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            Submit Expense Claim
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Claimed</span>
            <span className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg">
              <DollarSign className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(metrics?.totalClaimed)}</h3>
            <p className="text-xs text-slate-500 mt-1">{metrics?.totalClaims || 0} submitted claims</p>
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Pending Review</span>
            <span className="p-2 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-lg">
              <Clock className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{metrics?.pendingClaims || 0}</h3>
            <p className="text-xs text-slate-500 mt-1">Awaiting approval</p>
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Approved Amount</span>
            <span className="p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-lg">
              <CheckCircle className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(metrics?.totalApproved)}</h3>
            <p className="text-xs text-slate-500 mt-1">{metrics?.approvedClaims || 0} claims approved</p>
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Reimbursed</span>
            <span className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(metrics?.totalPaid)}</h3>
            <p className="text-xs text-slate-500 mt-1">{metrics?.paidClaims || 0} paid out</p>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        {/* Filters */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto">
            {/* Status Tabs */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900/60 rounded-lg">
              {(['ALL', 'PENDING', 'APPROVED', 'PAID', 'REJECTED'] as ClaimTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition ${
                    activeTab === tab
                      ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {tab === 'ALL' ? 'All Claims' : tab.charAt(0) + tab.slice(1).toLowerCase()}
                </button>
              ))}
            </div>

            {/* Category Dropdown */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="ALL">All Categories</option>
              <option value="TRAVEL">Travel</option>
              <option value="FOOD">Food & Meals</option>
              <option value="FUEL">Fuel & Commute</option>
              <option value="ACCOMMODATION">Accommodation</option>
              <option value="MEDICAL">Medical</option>
              <option value="COMMUNICATION">Communication</option>
              <option value="OFFICE_SUPPLIES">Office Supplies</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          {/* Search */}
          <div className="relative w-full lg:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search description or staff..."
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
                <th className="px-6 py-3.5">Category</th>
                <th className="px-6 py-3.5">Description</th>
                <th className="px-6 py-3.5">Amount</th>
                <th className="px-6 py-3.5">Receipt</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Date</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {isClaimsLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                    Loading expense claims...
                  </td>
                </tr>
              ) : claimsList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    No expense claims match current filters.
                  </td>
                </tr>
              ) : (
                claimsList.map((claim: ClaimRecord) => (
                  <tr key={claim.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs uppercase">
                          {claim.employeeName?.slice(0, 2) || 'EM'}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white">{claim.employeeName}</div>
                          <div className="text-xs text-slate-400">
                            {claim.employee?.employeeCode} • {claim.department}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        <Tag className="w-3 h-3 text-indigo-500" />
                        {claim.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-xs truncate font-medium text-slate-800 dark:text-slate-200">
                        {claim.description}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900 dark:text-white">{formatCurrency(claim.amount)}</div>
                      {claim.approvedAmount && claim.approvedAmount !== claim.amount && (
                        <div className="text-xs text-emerald-600">Approved: {formatCurrency(claim.approvedAmount)}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {claim.receiptUrl ? (
                        <a
                          href={claim.receiptUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          <FileText className="w-3.5 h-3.5" /> View Receipt
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400">No receipt</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(claim.status)}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {new Date(claim.claimDate || claim.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {claim.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedClaim(claim);
                                setReviewApprovedAmount(String(claim.amount));
                                setReviewNotes('');
                                setIsReviewOpen(true);
                              }}
                              className="px-2.5 py-1 text-xs font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 rounded-md border border-emerald-500/20 transition"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                setSelectedClaim(claim);
                                setRejectReason('');
                                setIsRejectOpen(true);
                              }}
                              className="px-2.5 py-1 text-xs font-medium bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 rounded-md border border-red-500/20 transition"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {claim.status === 'APPROVED' && (
                          <button
                            onClick={() => payMutation.mutate(claim.id)}
                            disabled={payMutation.isPending}
                            className="px-2.5 py-1 text-xs font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 rounded-md border border-blue-500/20 transition"
                          >
                            Mark Paid
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (confirm('Delete this claim record?')) {
                              deleteMutation.mutate(claim.id);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-red-600 rounded transition"
                          title="Delete claim"
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
          total={claimsPagination.total}
          totalPages={claimsPagination.totalPages}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
          disabled={isClaimsLoading}
        />
      </div>

      {/* New Claim Drawer */}
      <AdminFormDrawer
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          resetForm();
        }}
        title="Submit New Expense Claim"
        subtitle="Submit a business reimbursement with receipt proof"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Select Employee <span className="text-red-500">*</span>
            </label>
            <select
              value={formEmployeeId}
              onChange={(e) => setFormEmployeeId(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">-- Choose Employee --</option>
              {employeesList.map((emp: any) => (
                <option key={emp.id} value={emp.id}>
                  {emp.firstName} {emp.lastName} ({emp.employeeCode})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="TRAVEL">Travel</option>
                <option value="FOOD">Food & Meals</option>
                <option value="FUEL">Fuel & Commute</option>
                <option value="ACCOMMODATION">Accommodation</option>
                <option value="MEDICAL">Medical</option>
                <option value="COMMUNICATION">Communication / Internet</option>
                <option value="OFFICE_SUPPLIES">Office Supplies</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Amount (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                required
                placeholder="e.g. 2400"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Expense Date
            </label>
            <input
              type="date"
              value={formClaimDate}
              onChange={(e) => setFormClaimDate(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Receipt Document URL
            </label>
            <input
              type="url"
              placeholder="https://storage... or receipt file link"
              value={formReceiptUrl}
              onChange={(e) => setFormReceiptUrl(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Expense Description & Business Justification <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              placeholder="e.g. Client site visit travel fare, team project lunch..."
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500"
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
              className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm disabled:opacity-50"
            >
              {createMutation.isPending ? 'Submitting...' : 'Submit Claim'}
            </button>
          </div>
        </form>
      </AdminFormDrawer>

      {/* Review / Approve Drawer */}
      <AdminFormDrawer
        isOpen={isReviewOpen}
        onClose={() => {
          setIsReviewOpen(false);
          setSelectedClaim(null);
        }}
        title="Approve Reimbursement Claim"
        subtitle={`Approve amount for ${selectedClaim?.employeeName}`}
      >
        <form onSubmit={handleApproveSubmit} className="space-y-4">
          <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 text-xs space-y-1">
            <div className="font-semibold text-slate-700 dark:text-slate-300">Claimed Amount: {formatCurrency(selectedClaim?.amount)}</div>
            <div className="text-slate-500">Category: {selectedClaim?.category}</div>
            <div className="text-slate-500">Description: {selectedClaim?.description}</div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Sanctioned / Approved Amount (₹) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              required
              value={reviewApprovedAmount}
              onChange={(e) => setReviewApprovedAmount(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Reviewer Notes
            </label>
            <textarea
              rows={3}
              placeholder="Optional notes or approval breakdown"
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
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
              {approveMutation.isPending ? 'Approving...' : 'Confirm Approval'}
            </button>
          </div>
        </form>
      </AdminFormDrawer>

      {/* Reject Drawer */}
      <AdminFormDrawer
        isOpen={isRejectOpen}
        onClose={() => {
          setIsRejectOpen(false);
          setSelectedClaim(null);
        }}
        title="Reject Expense Claim"
        subtitle={`Specify why ${selectedClaim?.employeeName}'s claim was rejected`}
      >
        <form onSubmit={handleRejectSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Rejection Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              required
              placeholder="e.g. Missing valid receipt, expense not policy compliant, submitted beyond deadline..."
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
