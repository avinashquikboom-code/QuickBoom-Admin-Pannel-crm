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
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { AdminPageHero, AdminStatCard, AdminPagination, CustomerDetailsDrawer } from '@/components/admin';
import { toast } from 'react-hot-toast';
import { getErrorMessage } from '@/lib/utils';

export default function CustomerSubscriptionsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [viewingCustomerId, setViewingCustomerId] = useState<number | string | null>(null);

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

  const subscriptions: any[] = subResponse?.items || [];
  const pagination = subResponse?.pagination || { page: 1, pageSize: 20, total: 0, totalPages: 1 };

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

  const expiring10Count = subscriptions.filter((s) => s.daysRemaining <= 10 && s.daysRemaining > 5).length;
  const expiring5Count = subscriptions.filter((s) => s.daysRemaining <= 5 && s.daysRemaining > 0).length;
  const expiringTodayCount = subscriptions.filter((s) => s.daysRemaining === 0).length;
  const expiredCount = subscriptions.filter((s) => s.daysRemaining < 0 || s.status === 'EXPIRED').length;

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
      {/* 1. HERO HEADER */}
      <AdminPageHero
        badge={{
          text: 'CONTRACT & LIFECYCLE',
          icon: CreditCard,
          variant: 'emerald',
        }}
        title="Active Tenant Subscriptions & Expiry Track"
        description="Live anchor-date expiry tracking, automatic 10-day/5-day/1-day reminder dispatchers, and renewals."
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/customers"
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-slate-900 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-white/20"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Customers</span>
            </Link>
            <button
              onClick={() => scanMutation.mutate()}
              disabled={scanMutation.isPending}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{scanMutation.isPending ? 'Scanning...' : 'Run Expiry Scan'}</span>
            </button>
          </div>
        }
      />

      {/* 2. KPI STATS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <AdminStatCard
          title="Total Active"
          value={pagination.total}
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
                  <td colSpan={7} className="py-16 text-center text-slate-400 font-bold">
                    No subscriptions matching the selected criteria.
                  </td>
                </tr>
              ) : (
                subscriptions.map((s: any) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
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
                      <button
                        type="button"
                        onClick={() => setViewingCustomerId(s.customerId)}
                        className="inline-block px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg text-xs transition-all cursor-pointer"
                      >
                        Manage
                      </button>
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
    </div>
  );
}
