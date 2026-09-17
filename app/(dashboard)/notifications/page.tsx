'use client';

import React, { useState } from 'react';
import { Bell, CheckCircle2, Clock, Check, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminPageHero, AdminStatCard, AdminPagination, AdminStatusTabs } from '@/components/admin';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  type: 'LEAVE' | 'ATTENDANCE' | 'CRM' | 'PAYROLL';
}

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'ALL' | 'UNREAD' | 'READ'>('ALL');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const { data: notificationsResponse, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['admin-notifications', activeTab, page, pageSize],
    queryFn: async () => {
      try {
        const res: any = await api.get('/notifications', {
          params: { page, limit: pageSize },
        });
        const items = res?.data?.items || res?.data?.data || res?.items || res?.data || (Array.isArray(res) ? res : []);
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

  const notificationsData = notificationsResponse?.items || [];
  const pagination = notificationsResponse?.pagination || { page: 1, pageSize: 20, total: 0, totalPages: 1 };

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      return api.patch('/notifications/read-all', {});
    },
    onSuccess: () => {
      toast.success('All notifications marked as read');
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
    },
  });

  const markSingleReadMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.patch(`/notifications/${id}/read`, {});
    },
    onSuccess: () => {
      toast.success('Notification marked as read');
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
    },
  });

  const items: NotificationItem[] =
    Array.isArray(notificationsData) && notificationsData.length > 0
      ? notificationsData.map((n: any) => ({
          id: String(n.id),
          title: typeof n.title === 'string' ? n.title : (n.title?.message || 'System Notification'),
          message: typeof n.message === 'string' ? n.message : (n.message?.text || 'Notification update received'),
          time: n.createdAt && !isNaN(new Date(n.createdAt).getTime())
            ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : 'Recent',
          isRead: Boolean(n.isRead),
          type: n.type === 'PAYMENT_RECEIVED' ? 'PAYROLL' : 'CRM',
        }))
      : [];

  const unreadCount = items.filter((n) => !n.isRead).length;
  const readCount = items.filter((n) => n.isRead).length;

  const filteredItems = items.filter((n) => {
    if (activeTab === 'UNREAD') return !n.isRead;
    if (activeTab === 'READ') return n.isRead;
    return true;
  });

  const markAllRead = () => {
    markAllReadMutation.mutate();
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-16 text-slate-800 animate-in fade-in-50 duration-200">
      <AdminPageHero
        badge={{
          text: 'NOTIFICATION CENTER',
          icon: Bell,
          variant: 'emerald',
        }}
        title="Notifications"
        description="Manage and monitor system, employee and operational notifications."
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="p-2.5 bg-white/10 hover:bg-white/15 text-white rounded-2xl border border-white/10 text-xs font-black transition-all cursor-pointer backdrop-blur-xs disabled:opacity-50 active:scale-95"
              title="Refresh notifications"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin text-[#23C45E]' : ''}`} />
            </button>

            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                disabled={markAllReadMutation.isPending}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#23C45E] hover:bg-[#1AA14D] text-slate-950 font-black rounded-2xl text-xs shadow-md shadow-[#23C45E]/20 transition-all cursor-pointer active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>Mark All Read</span>
              </button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <AdminStatCard
          title="Total Notifications"
          value={isLoading ? '...' : items.length}
          description="In-app alerts and notifications"
          icon={Bell}
          iconBg="primary"
        />
        <AdminStatCard
          title="Unread Alerts"
          value={isLoading ? '...' : unreadCount}
          description="Requiring review or action"
          icon={Clock}
          iconBg="amber"
        />
        <AdminStatCard
          title="Read History"
          value={isLoading ? '...' : readCount}
          description="Acknowledged notifications"
          icon={CheckCircle2}
          iconBg="blue"
        />
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50/70 border-b border-slate-200/80 flex items-center justify-between flex-wrap gap-3">
          <AdminStatusTabs<any>
            activeTab={activeTab}
            onChange={(tab) => setActiveTab(tab)}
            tabs={[
              { key: 'ALL', label: 'All', count: items.length },
              { key: 'READ', label: 'Read', count: readCount },
              { key: 'UNREAD', label: 'Unread', count: unreadCount },
            ]}
          />
        </div>

        <div className="divide-y divide-slate-100">
          {isLoading ? (
            <div className="p-12 text-center text-slate-400 text-xs font-bold animate-pulse">
              Loading notification feed...
            </div>
          ) : filteredItems.length > 0 ? (
            filteredItems.map((n) => (
              <div
                key={n.id}
                className={`p-5 flex items-start justify-between gap-4 transition-colors ${
                  !n.isRead ? 'bg-emerald-50/30 hover:bg-emerald-50/50' : 'hover:bg-slate-50/60'
                }`}
              >
                <div className="flex items-start gap-4 text-xs min-w-0">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold shrink-0 ${
                      !n.isRead
                        ? 'bg-emerald-100 text-[#1AA14D] border border-emerald-200'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    <Bell className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-extrabold text-slate-900 text-sm">{n.title}</h3>
                      {!n.isRead && (
                        <span className="w-2 h-2 rounded-full bg-[#23C45E] inline-block" />
                      )}
                    </div>
                    <p className="text-slate-600 font-medium mt-1 leading-relaxed">
                      {n.message}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[11px] font-mono text-slate-400 font-medium">
                    {n.time}
                  </span>
                  {!n.isRead && (
                    <button
                      onClick={() => markSingleReadMutation.mutate(n.id)}
                      className="p-1.5 hover:bg-white text-slate-400 hover:text-[#1AA14D] rounded-xl border border-transparent hover:border-slate-200 transition-all cursor-pointer"
                      title="Mark as read"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-slate-400 text-xs font-bold">
              No notifications in this view.
            </div>
          )}
        </div>

        {/* Server-Side Pagination */}
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
    </div>
  );
}
