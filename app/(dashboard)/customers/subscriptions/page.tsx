'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  Building2,
  Calendar,
  DollarSign,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  RefreshCw,
  Search,
  Users,
  Clock,
  XCircle,
  Play,
  Trash2,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { AdminPageHeader, AdminButton, AdminStatCard, AdminPagination, CustomerDetailsDrawer } from '@/components/admin';
import { toast } from 'react-hot-toast';
import { getErrorMessage } from '@/lib/utils';

export default function CustomerSubscriptionsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [viewingCustomerId, setViewingCustomerId] = useState<number | string | null>(null);

  // Selection & Delete States
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [deleteConfirmSub, setDeleteConfirmSub] = useState<any | null>(null);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

  // 1. Fetch Subscriptions from backend
  const { data: subResponse, isLoading, refetch } = useQuery({
    queryKey: ['admin-subscriptions-list', statusFilter, searchTerm, page, pageSize],
    refetchInterval: 10000,
    queryFn: async () => {
      try {
        const params: any = { page, limit: pageSize };
        if (statusFilter !== 'ALL') params.status = statusFilter;
        if (searchTerm.trim()) params.search = searchTerm.trim();
        const res: any = await api.get('/admin/subscriptions', { params });
        const items = res?.data?.data || res?.data?.items || res?.items || res?.data || (Array.isArray(res) ? res : []);
        const pagination = res?.pagination || res?.meta || res?.data?.pagination || res?.data?.meta || {
          page,
          pageSize,
          total: Array.isArray(items) ? items.length : 0,
          totalPages: 1,
        };
        const counts = res?.counts || res?.data?.counts || {};
        return {
          items: Array.isArray(items) ? items : [],
          counts,
          pagination: {
            page: Number(pagination.page) || page,
            pageSize: Number(pagination.pageSize || pagination.limit) || pageSize,
            total: Number(pagination.total) || (Array.isArray(items) ? items.length : 0),
            totalPages: Number(pagination.totalPages) || 1,
          },
        };
      } catch {
        return { items: [], counts: {}, pagination: { page: 1, pageSize, total: 0, totalPages: 1 } };
      }
    },
  });

  const subscriptions: any[] = subResponse?.items || [];
  const pagination = subResponse?.pagination || { page: 1, pageSize: 20, total: 0, totalPages: 1 };
  const counts = subResponse?.counts || {};

  // Single Delete Mutation
  const singleDeleteMutation = useMutation({
    mutationFn: async (id: number | string) => {
      const res: any = await api.delete(`/admin/subscriptions/${id}`);
      return res?.data || res;
    },
    onSuccess: (data: any) => {
      toast.success(data?.message || 'Subscription deleted successfully');
      setSelectedIds((prev) => prev.filter((id) => id !== deleteConfirmSub?.id));
      setDeleteConfirmSub(null);
      if (subscriptions.length === 1 && page > 1) {
        setPage((p) => p - 1);
      }
      queryClient.invalidateQueries({ queryKey: ['admin-subscriptions-list'] });
      queryClient.invalidateQueries({ queryKey: ['customer-subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['customers-list'] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  // Bulk Delete Mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      const res: any = await api.post('/admin/subscriptions/bulk-delete', { ids });
      return res?.data || res;
    },
    onSuccess: (data: any) => {
      const count = selectedIds.length;
      toast.success(data?.message || `${count} ${count === 1 ? 'subscription' : 'subscriptions'} deleted successfully`);
      setIsBulkDeleteModalOpen(false);
      const remainingOnPage = subscriptions.filter((s: any) => !selectedIds.includes(s.id)).length;
      if (remainingOnPage === 0 && page > 1) {
        setPage((p) => p - 1);
      }
      setSelectedIds([]);
      queryClient.invalidateQueries({ queryKey: ['admin-subscriptions-list'] });
      queryClient.invalidateQueries({ queryKey: ['customer-subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['customers-list'] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  // Selection helpers
  const visibleIds = subscriptions.map((s: any) => s.id);
  const isAllSelected = visibleIds.length > 0 && visibleIds.every((id: any) => selectedIds.includes(id));
  const isSomeSelected = visibleIds.some((id: any) => selectedIds.includes(id)) && !isAllSelected;

  const handleToggleRow = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleToggleAll = () => {
    if (isAllSelected) {
      setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  // Manual Expiry Scan Mutation
  const scanMutation = useMutation({
    mutationFn: async () => {
      const res: any = await api.post('/admin/subscriptions/check-expiry');
      return res.data;
    },
    onSuccess: (data: any) => {
      toast.success(
        `Expiry scan complete: ${data?.remindersDispatched || 0} reminders sent, ${data?.expiredUpdated || 0} expired.`
      );
      queryClient.invalidateQueries({ queryKey: ['admin-subscriptions-list'] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  const totalActiveCount = counts.totalActive ?? pagination.total;
  const expiring10Count = counts.expiring10 ?? subscriptions.filter((s) => s.daysRemaining <= 10 && s.daysRemaining > 5).length;
  const expiring5Count = counts.expiring5 ?? subscriptions.filter((s) => s.daysRemaining <= 5 && s.daysRemaining > 0).length;
  const expiringTodayCount = subscriptions.filter((s) => s.daysRemaining === 0).length;
  const expiredCount = counts.expired ?? subscriptions.filter((s) => s.daysRemaining < 0 || s.status === 'EXPIRED').length;

  const getStatusBadge = (status: string, daysRemaining: number) => {
    if (status === 'EXPIRED' || daysRemaining < 0) {
      return (
        <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 font-black text-[10px] inline-flex items-center gap-1">
          <XCircle className="w-3 h-3" />
          EXPIRED ({Math.abs(daysRemaining)}d ago)
        </span>
      );
    }
    if (daysRemaining === 0 || status === 'EXPIRING_TODAY') {
      return (
        <span className="px-2.5 py-1 rounded-full bg-rose-500 text-white font-black text-[10px] inline-flex items-center gap-1 animate-pulse">
          <AlertCircle className="w-3 h-3" />
          EXPIRES TODAY
        </span>
      );
    }
    if (daysRemaining <= 5 || status === 'EXPIRING_IN_5_DAYS') {
      return (
        <span className="px-2.5 py-1 rounded-full bg-orange-100 text-orange-800 font-black text-[10px] inline-flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          EXPIRES IN {daysRemaining}D
        </span>
      );
    }
    if (daysRemaining <= 10 || status === 'EXPIRING_SOON') {
      return (
        <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-black text-[10px] inline-flex items-center gap-1">
          <Clock className="w-3 h-3" />
          EXPIRES IN {daysRemaining}D
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-black text-[10px] inline-flex items-center gap-1">
        <CheckCircle2 className="w-3 h-3" />
        ACTIVE ({daysRemaining}d left)
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-16 text-slate-800 animate-in fade-in-50 duration-200">
      {/* 1. PAGE HEADER */}
      <AdminPageHeader
        badge={{
          text: 'CONTRACT & LIFECYCLE',
          icon: CreditCard,
          variant: 'emerald',
        }}
        title="Active Tenant Subscriptions & Expiry Track"
        description="Live anchor-date expiry tracking, automatic 10-day/5-day/1-day reminder dispatchers, and renewals."
        icon={CreditCard}
        iconColor="text-emerald-600"
        breadcrumbs={[
          { label: 'Customers', href: '/customers' },
          { label: 'Subscriptions' },
        ]}
        actions={
          <div className="flex items-center gap-2.5">
            <Link href="/customers">
              <AdminButton
                variant="outline"
                size="md"
                icon={ArrowLeft}
              >
                Back to Customers
              </AdminButton>
            </Link>
            <AdminButton
              variant="primary"
              size="md"
              icon={Play}
              onClick={() => scanMutation.mutate()}
              disabled={scanMutation.isPending}
            >
              {scanMutation.isPending ? 'Scanning...' : 'Run Expiry Scan'}
            </AdminButton>
          </div>
        }
      />

      {/* 2. KPI STATS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <AdminStatCard
          title="Total Active"
          value={totalActiveCount}
          icon={CreditCard}
          iconBg="primary"
        />
        <AdminStatCard
          title="Expiring in 10 Days"
          value={expiring10Count}
          icon={Clock}
          iconBg="amber"
        />
        <AdminStatCard
          title="Expiring in 5 Days"
          value={expiring5Count}
          icon={AlertCircle}
          iconBg="rose"
        />
        <AdminStatCard
          title="Expired Plans"
          value={expiredCount}
          icon={XCircle}
          iconBg="slate"
        />
      </div>

      {/* BULK ACTIONS BAR (When records selected) */}
      {selectedIds.length > 0 && (
        <div className="bg-[#1B2533] text-white rounded-2xl px-5 py-3 shadow-lg flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5 text-xs font-bold">
            <span className="w-6 h-6 rounded-full bg-[#23C45E] text-slate-950 flex items-center justify-center font-black text-[11px]">
              {selectedIds.length}
            </span>
            <span>{selectedIds.length === 1 ? 'subscription selected' : 'subscriptions selected'}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsBulkDeleteModalOpen(true)}
              disabled={bulkDeleteMutation.isPending}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Deselect
            </button>
          </div>
        </div>
      )}

      {/* 3. TABLE CONTAINER */}
      <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-72">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by customer or plan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Only</option>
              <option value="EXPIRING_SOON">Expiring in 10 Days</option>
              <option value="EXPIRING_IN_5_DAYS">Expiring in 5 Days</option>
              <option value="EXPIRING_TODAY">Expiring Today</option>
              <option value="EXPIRED">Expired</option>
            </select>
          </div>

          <span className="text-xs font-bold text-slate-400">
            Showing {subscriptions.length} of {pagination.total} subscriptions
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-400 font-black uppercase border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5 w-10">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = isSomeSelected;
                    }}
                    onChange={handleToggleAll}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
                    title="Select All"
                  />
                </th>
                <th className="px-5 py-3.5">Customer & Account</th>
                <th className="px-5 py-3.5">Plan Tier</th>
                <th className="px-5 py-3.5">Activation Date</th>
                <th className="px-5 py-3.5">Anchor Expiry Date</th>
                <th className="px-5 py-3.5">Days Remaining</th>
                <th className="px-5 py-3.5">Lifecycle Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400 font-bold">
                    No subscriptions matching the selected criteria.
                  </td>
                </tr>
              ) : (
                subscriptions.map((s: any) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-4 w-10">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(s.id)}
                        onChange={() => handleToggleRow(s.id)}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
                      />
                    </td>
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() => setViewingCustomerId(s.customerId)}
                        className="font-bold text-slate-900 text-left hover:text-[#1AA14D] transition-colors cursor-pointer block"
                      >
                        {s.customerName}
                      </button>
                      <div className="text-slate-400 text-[11px]">{s.customerEmail}</div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-bold text-[11px]">
                        {s.planName}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-600 font-medium">
                      {s.startDate ? new Date(s.startDate).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-5 py-4 font-bold text-slate-900">
                      {s.expiryDate ? new Date(s.expiryDate).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-5 py-4 font-black text-slate-800">
                      {s.daysRemaining !== undefined ? `${s.daysRemaining} days` : 'N/A'}
                    </td>
                    <td className="px-5 py-4">{getStatusBadge(s.status, s.daysRemaining)}</td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setViewingCustomerId(s.customerId)}
                          className="inline-block px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg text-xs transition-all cursor-pointer"
                        >
                          Manage
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmSub(s)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                          title="Delete Subscription"
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

      {/* Customer Details Right-Side Drawer */}
      <CustomerDetailsDrawer
        customerId={viewingCustomerId}
        isOpen={!!viewingCustomerId}
        onClose={() => setViewingCustomerId(null)}
      />

      {/* Single Delete Confirmation Modal */}
      {deleteConfirmSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => !singleDeleteMutation.isPending && setDeleteConfirmSub(null)}
          />
          <div className="relative bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 z-10 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Delete Tenant Subscription?
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Customer: <strong className="text-slate-800 font-bold">{deleteConfirmSub.customerName}</strong>
                </p>
              </div>
            </div>

            {/* Subscription Breakdown */}
            <div className="bg-slate-50 border border-slate-200/70 rounded-2xl p-3.5 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Customer:</span>
                <span className="font-bold text-slate-900 text-right">{deleteConfirmSub.customerName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Plan Tier:</span>
                <span className="font-bold text-emerald-900">{deleteConfirmSub.planName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Activation Date:</span>
                <span className="font-medium text-slate-700">
                  {deleteConfirmSub.startDate ? new Date(deleteConfirmSub.startDate).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Anchor Expiry:</span>
                <span className="font-medium text-slate-700">
                  {deleteConfirmSub.expiryDate ? new Date(deleteConfirmSub.expiryDate).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Lifecycle Status:</span>
                <span>{getStatusBadge(deleteConfirmSub.status, deleteConfirmSub.daysRemaining)}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 italic">
              Note: The customer profile, account details, and global plan definitions will remain completely intact.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={singleDeleteMutation.isPending}
                onClick={() => setDeleteConfirmSub(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={singleDeleteMutation.isPending}
                onClick={() => singleDeleteMutation.mutate(deleteConfirmSub.id)}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black text-xs transition-all shadow-md shadow-rose-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {singleDeleteMutation.isPending ? (
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => !bulkDeleteMutation.isPending && setIsBulkDeleteModalOpen(false)}
          />
          <div className="relative bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 z-10 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Delete {selectedIds.length} {selectedIds.length === 1 ? 'Subscription' : 'Subscriptions'}?
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Selected: <strong className="text-slate-800 font-bold">{selectedIds.length} {selectedIds.length === 1 ? 'subscription' : 'subscriptions'}</strong>
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-rose-50/50 border border-rose-100 rounded-2xl text-xs text-rose-800">
              Are you sure you want to delete the selected <strong>{selectedIds.length} {selectedIds.length === 1 ? 'subscription' : 'subscriptions'}</strong>? This operation cannot be undone. Customer accounts and global plan definitions will remain safe.
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={bulkDeleteMutation.isPending}
                onClick={() => setIsBulkDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={bulkDeleteMutation.isPending}
                onClick={() => bulkDeleteMutation.mutate(selectedIds)}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black text-xs transition-all shadow-md shadow-rose-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {bulkDeleteMutation.isPending ? (
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>Delete {selectedIds.length} Subscriptions</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
