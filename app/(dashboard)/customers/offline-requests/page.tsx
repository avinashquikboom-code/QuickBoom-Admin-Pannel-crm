'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Clock,
  Building2,
  Calendar,
  DollarSign,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  Users,
  XCircle,
  Eye,
  Check,
  X,
  FileText,
  CreditCard,
  Banknote,
  Receipt,
  Download,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { AdminPageHero, AdminStatCard, AdminPagination, AdminFormDrawer, CustomerDetailsDrawer } from '@/components/admin';
import { toast } from 'react-hot-toast';
import { getErrorMessage } from '@/lib/utils';

export default function OfflinePaymentRequestsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Modal / Drawer states
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [viewingCustomerId, setViewingCustomerId] = useState<number | string | null>(null);

  // 1. Fetch Offline Requests from backend
  const { data: reqResponse, isLoading, refetch } = useQuery({
    queryKey: ['admin-offline-requests', statusFilter, searchTerm, page, pageSize],
    refetchInterval: 10000,
    queryFn: async () => {
      try {
        const params: any = { page, limit: pageSize };
        if (statusFilter !== 'ALL') params.status = statusFilter;
        if (searchTerm.trim()) params.search = searchTerm.trim();
        const res: any = await api.get('/admin/subscriptions/offline-requests', { params });
        const items = res?.data?.items || res?.data?.data || res?.items || res?.data || (Array.isArray(res) ? res : []);
        const pagination = res?.pagination || res?.meta || res?.data?.pagination || {
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

  const requests: any[] = reqResponse?.items || [];
  const pagination = reqResponse?.pagination || { page: 1, pageSize: 20, total: 0, totalPages: 1 };

  // Approve Mutation
  const approveMutation = useMutation({
    mutationFn: async (id: number | string) => {
      const res: any = await api.post(`/admin/subscriptions/offline-requests/${id}/approve`);
      return res.data;
    },
    onSuccess: (data: any) => {
      toast.success(data?.message || 'Offline payment approved & subscription activated!');
      queryClient.invalidateQueries({ queryKey: ['admin-offline-requests'] });
      queryClient.invalidateQueries({ queryKey: ['admin-subscriptions-list'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['customer-subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['customers-list'] });
      queryClient.invalidateQueries({ queryKey: ['customer-detail'] });
      queryClient.invalidateQueries({ queryKey: ['customer-invoices'] });
      setIsViewModalOpen(false);
      setSelectedRequest(null);
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  // Reject Mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: number | string; reason?: string }) => {
      const res: any = await api.post(`/admin/subscriptions/offline-requests/${id}/reject`, { reason });
      return res.data;
    },
    onSuccess: (data: any) => {
      toast.success(data?.message || 'Offline payment request rejected.');
      queryClient.invalidateQueries({ queryKey: ['admin-offline-requests'] });
      queryClient.invalidateQueries({ queryKey: ['admin-subscriptions-list'] });
      queryClient.invalidateQueries({ queryKey: ['customer-subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['customer-detail'] });
      setIsRejectModalOpen(false);
      setIsViewModalOpen(false);
      setSelectedRequest(null);
      setRejectReason('');
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  const handleDownloadReceipt = async (req: any) => {
    try {
      const receiptNo = req.invoiceUrl || `REC-${new Date(req.requestDate || Date.now()).getFullYear()}-${String(req.id).padStart(6, '0')}`;
      toast.loading(`Preparing Receipt PDF for ${receiptNo}...`, { id: 'rec-dl' });
      const res = await api.get(`/receipts/${receiptNo}/download`, {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt_${receiptNo}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Payment Receipt PDF downloaded', { id: 'rec-dl' });
    } catch (err) {
      toast.error(getErrorMessage(err) || 'Failed to download receipt PDF', { id: 'rec-dl' });
    }
  };

  const totalCount = pagination.total || requests.length;
  const pendingCount = requests.filter((r) => r.paymentStatus === 'PENDING').length;
  const approvedCount = requests.filter((r) => r.paymentStatus === 'SUCCESS' || r.paymentStatus === 'PAID').length;
  const rejectedCount = requests.filter((r) => r.paymentStatus === 'REJECTED' || r.paymentStatus === 'FAILED').length;

  const getStatusBadge = (status: string) => {
    const s = (status || '').toUpperCase();
    if (s === 'SUCCESS' || s === 'PAID' || s === 'ACTIVE') {
      return (
        <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] inline-flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" />
          PAID
        </span>
      );
    }
    if (s === 'REJECTED' || s === 'FAILED' || s === 'CANCELED') {
      return (
        <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 font-bold text-[10px] inline-flex items-center gap-1">
          <XCircle className="w-3 h-3" />
          REJECTED
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px] inline-flex items-center gap-1">
        <Clock className="w-3 h-3" />
        PENDING APPROVAL
      </span>
    );
  };

  const getSubStatusBadge = (status: string) => {
    const s = (status || '').toUpperCase();
    if (s === 'ACTIVE') {
      return (
        <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
          ACTIVE
        </span>
      );
    }
    if (s === 'REJECTED' || s === 'CANCELED') {
      return (
        <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 font-bold text-[10px]">
          REJECTED
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 font-bold text-[10px]">
        PENDING
      </span>
    );
  };

  return (
    <div className="space-y-6 pb-12 max-w-[1600px] mx-auto">
      {/* 1. Header Hero */}
      <AdminPageHero
        title="Offline Payment Requests"
        description="Review, verify, and approve customer bank transfers, cash payments, and offline subscription orders."
        actions={
          <button
            onClick={() => refetch()}
            disabled={isLoading}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl font-semibold text-sm transition-all flex items-center gap-2 shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        }
      />

      {/* 2. Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard
          title="Total Requests"
          value={totalCount}
          icon={Receipt}
          iconBg="primary"
        />
        <AdminStatCard
          title="Pending Approval"
          value={pendingCount}
          icon={Clock}
          iconBg="amber"
        />
        <AdminStatCard
          title="Approved / Paid"
          value={approvedCount}
          icon={CheckCircle2}
          iconBg="primary"
        />
        <AdminStatCard
          title="Rejected"
          value={rejectedCount}
          icon={XCircle}
          iconBg="rose"
        />
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by customer, plan, order #..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          {[
            { label: 'All Requests', value: 'ALL' },
            { label: 'Pending', value: 'PENDING' },
            { label: 'Approved', value: 'SUCCESS' },
            { label: 'Rejected', value: 'REJECTED' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => {
                setStatusFilter(tab.value);
                setPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                statusFilter === tab.value
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Requests Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-black uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4">Customer & Business</th>
                <th className="py-3.5 px-4">Plan & Cycle</th>
                <th className="py-3.5 px-4">Amount Breakdown</th>
                <th className="py-3.5 px-4">Payment Method</th>
                <th className="py-3.5 px-4">Request Date</th>
                <th className="py-3.5 px-4">Payment Status</th>
                <th className="py-3.5 px-4">Subscription</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                    Loading offline payment requests...
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Clock className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    No offline payment requests found matching your filters.
                  </td>
                </tr>
              ) : (
                requests.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{r.customerName}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3 h-3 text-slate-400" />
                        {r.businessName}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-emerald-950">{r.planName}</div>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        {r.billingCycle}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-black text-slate-900">₹{(r.totalAmount || 0).toLocaleString('en-IN')}</div>
                      <div className="text-[11px] text-slate-500">
                        Base: ₹{(r.baseAmount || 0).toLocaleString('en-IN')} + GST: ₹{(r.gst || 0).toLocaleString('en-IN')}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded-md">
                        <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                        {r.paymentMethodDetail === 'CASH' || r.paymentMethod === 'CASH' ? 'Cash' : (r.paymentMethodDetail || 'Offline')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600">
                      {new Date(r.requestDate).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(r.paymentStatus)}</td>
                    <td className="py-3 px-4">{getSubStatusBadge(r.subscriptionStatus)}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedRequest(r);
                            setIsViewModalOpen(true);
                          }}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {r.paymentStatus === 'PENDING' && (
                          <>
                            <button
                              onClick={() => approveMutation.mutate(r.id)}
                              disabled={approveMutation.isPending}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1"
                              title="Confirm Cash Payment"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Confirm
                            </button>
                            <button
                              onClick={() => {
                                setSelectedRequest(r);
                                setIsRejectModalOpen(true);
                              }}
                              disabled={rejectMutation.isPending}
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                              title="Reject Payment"
                            >
                              <X className="w-3.5 h-3.5" />
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

        {/* Pagination */}
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

      {/* 5. View Details Right-Side Drawer */}
      <AdminFormDrawer
        isOpen={isViewModalOpen && !!selectedRequest}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedRequest(null);
        }}
        title="Offline Payment Details"
        description={selectedRequest ? `Order Number: ${selectedRequest.orderNumber}` : ''}
        icon={Receipt}
        maxWidth="sm:max-w-[500px]"
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <button
              type="button"
              onClick={() => {
                setIsViewModalOpen(false);
                setSelectedRequest(null);
              }}
              className="px-4 py-2 border border-slate-200 rounded-xl text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
            >
              Close
            </button>
            {(selectedRequest?.paymentStatus === 'PAID' || selectedRequest?.paymentStatus === 'SUCCESS') && (
              <button
                type="button"
                onClick={() => handleDownloadReceipt(selectedRequest)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Download Receipt
              </button>
            )}
            {selectedRequest?.paymentStatus === 'PENDING' && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setIsViewModalOpen(false);
                    setIsRejectModalOpen(true);
                  }}
                  className="px-4 py-2 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold hover:bg-rose-100 cursor-pointer"
                >
                  Reject
                </button>
                <button
                  type="button"
                  onClick={() => approveMutation.mutate(selectedRequest.id)}
                  disabled={approveMutation.isPending}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-black hover:bg-emerald-700 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {approveMutation.isPending ? 'Confirming...' : 'Confirm Cash Payment'}
                </button>
              </>
            )}
          </div>
        }
      >
        {selectedRequest && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/60">
              <div>
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Customer</span>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedRequest.customerId) {
                      setViewingCustomerId(selectedRequest.customerId);
                    }
                  }}
                  className="font-bold text-slate-900 text-left hover:text-[#1AA14D] transition-colors cursor-pointer block"
                >
                  {selectedRequest.customerName}
                </button>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Business Name</span>
                <span className="font-bold text-slate-900">{selectedRequest.businessName}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Plan Name</span>
                <span className="font-bold text-emerald-800">{selectedRequest.planName}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Billing Cycle</span>
                <span className="font-bold text-slate-900 uppercase">{selectedRequest.billingCycle}</span>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/60 space-y-2">
              <div className="flex justify-between text-slate-600 font-medium">
                <span>Base Plan Amount:</span>
                <span>₹{(selectedRequest.baseAmount || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-600 font-medium">
                <span>GST (18%):</span>
                <span>₹{(selectedRequest.gst || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between font-black text-sm text-slate-900 pt-1.5 border-t border-slate-200">
                <span>Total Payable:</span>
                <span className="text-emerald-700">₹{(selectedRequest.totalAmount || 0).toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/60 space-y-2 text-slate-600">
              <div>
                <span className="font-medium text-slate-500">Transaction Reference: </span>
                <span className="font-mono font-bold text-slate-900">{selectedRequest.transactionId || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium text-slate-500">Payment Status: </span>
                <span className="font-bold text-slate-900">{selectedRequest.paymentStatus}</span>
              </div>
              {selectedRequest.invoiceNumber && (
                <div>
                  <span className="font-medium text-slate-500">Invoice Number: </span>
                  <span className="font-bold text-emerald-700">{selectedRequest.invoiceNumber}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </AdminFormDrawer>

      {/* 6. Reject Reason Right-Side Drawer */}
      <AdminFormDrawer
        isOpen={isRejectModalOpen && !!selectedRequest}
        onClose={() => {
          setIsRejectModalOpen(false);
          setRejectReason('');
        }}
        title="Reject Offline Payment"
        description={selectedRequest ? `Customer: ${selectedRequest.customerName}` : ''}
        icon={XCircle}
        maxWidth="sm:max-w-[460px]"
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <button
              type="button"
              onClick={() => {
                setIsRejectModalOpen(false);
                setRejectReason('');
              }}
              className="px-4 py-2 border border-slate-200 rounded-xl text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() =>
                rejectMutation.mutate({
                  id: selectedRequest?.id,
                  reason: rejectReason.trim(),
                })
              }
              disabled={rejectMutation.isPending}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black shadow-sm cursor-pointer disabled:opacity-50"
            >
              {rejectMutation.isPending ? 'Rejecting...' : 'Confirm Rejection'}
            </button>
          </div>
        }
      >
        <div className="space-y-3 text-xs">
          <p className="text-slate-500 font-medium">
            Provide an optional reason for rejecting the offline payment request for <strong>{selectedRequest?.customerName}</strong>.
          </p>

          <textarea
            rows={4}
            placeholder="e.g. Bank transfer reference could not be verified with accounts team..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-rose-500"
          />
        </div>
      </AdminFormDrawer>

      {/* 7. Customer Details Right-Side Drawer */}
      <CustomerDetailsDrawer
        customerId={viewingCustomerId}
        isOpen={!!viewingCustomerId}
        onClose={() => setViewingCustomerId(null)}
      />
    </div>
  );
}
