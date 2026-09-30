'use client';

import React, { useState } from 'react';
import {
  Bell,
  CheckCircle2,
  Clock,
  Check,
  RefreshCw,
  Megaphone,
  Sparkles,
  Send,
  Calendar,
  Image as ImageIcon,
  ExternalLink,
  Link as LinkIcon,
  Users,
  User,
  Layers,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/store';
import { hasPermission } from '@/lib/access-control';
import {
  AdminPageHeader,
  AdminStatCard,
  AdminPagination,
  AdminStatusTabs,
  AdminButton,
  AdminStatusBadge,
  CreateOfferNotificationDrawer,
} from '@/components/admin';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  type: string;
  imageUrl?: string;
  showCta?: boolean;
  ctaText?: string;
  ctaActionType?: string;
  ctaActionValue?: string;
}

interface CampaignItem {
  id: number;
  title: string;
  message: string;
  notificationType: string;
  targetType: string;
  audience: string;
  targetIds?: number[];
  imageUrl?: string;
  showCta: boolean;
  ctaText?: string;
  ctaActionType?: string;
  ctaActionValue?: string;
  scheduledAt?: string;
  status: 'SENT' | 'SCHEDULED' | 'FAILED';
  recipientCount: number;
  sentCount: number;
  failedCount: number;
  createdAt: string;
}

export default function NotificationCenterPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  // Top Section Switch: FEED vs CAMPAIGNS
  const [activeSection, setActiveSection] = useState<'FEED' | 'CAMPAIGNS'>('FEED');

  // In-App Notifications Feed State
  const [activeTab, setActiveTab] = useState<'ALL' | 'UNREAD' | 'READ'>('ALL');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Campaigns History State
  const [campaignPage, setCampaignPage] = useState(1);
  const [campaignPageSize, setCampaignPageSize] = useState(15);
  const [isOfferDrawerOpen, setIsOfferDrawerOpen] = useState(false);

  // Check RBAC permission for sending offer notifications
  const canSendOffer =
    !user ||
    hasPermission(user, [
      'notifications.send',
      'NOTIFICATIONS:SEND',
      'notifications.manage',
      'notifications.view',
      'settings.manage',
    ]);

  // Query 1: Notifications Feed
  const {
    data: notificationsResponse,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['admin-notifications', activeTab, page, pageSize],
    queryFn: async () => {
      try {
        const res: any = await api.get('/notifications', {
          params: { page, limit: pageSize },
        });
        const items =
          res?.data?.items ||
          res?.data?.data ||
          res?.items ||
          res?.data ||
          (Array.isArray(res) ? res : []);
        const pagination =
          res?.pagination ||
          res?.meta ||
          res?.data?.pagination ||
          res?.data?.meta || {
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
      } catch (err) {
        return { items: [], pagination: { page: 1, pageSize, total: 0, totalPages: 1 } };
      }
    },
  });

  // Query 2: Offer Campaigns History
  const {
    data: campaignsResponse,
    isLoading: isLoadingCampaigns,
    isFetching: isFetchingCampaigns,
    refetch: refetchCampaigns,
  } = useQuery({
    queryKey: ['admin-offer-campaigns', campaignPage, campaignPageSize],
    queryFn: async () => {
      try {
        const res: any = await api.get('/notifications/admin/campaigns', {
          params: { page: campaignPage, limit: campaignPageSize },
        });
        const items =
          res?.data?.items ||
          res?.items ||
          res?.data ||
          (Array.isArray(res) ? res : []);
        const pagination =
          res?.data?.pagination ||
          res?.pagination || {
            page: campaignPage,
            pageSize: campaignPageSize,
            total: Array.isArray(items) ? items.length : 0,
            totalPages: 1,
          };
        return {
          items: Array.isArray(items) ? items : [],
          pagination: {
            page: Number(pagination.page) || campaignPage,
            pageSize: Number(pagination.pageSize || pagination.limit) || campaignPageSize,
            total: Number(pagination.total) || (Array.isArray(items) ? items.length : 0),
            totalPages: Number(pagination.totalPages) || 1,
          },
        };
      } catch (err) {
        return { items: [], pagination: { page: 1, pageSize: campaignPageSize, total: 0, totalPages: 1 } };
      }
    },
  });

  const notificationsData = notificationsResponse?.items || [];
  const pagination = notificationsResponse?.pagination || {
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 1,
  };

  const campaignsData: CampaignItem[] = campaignsResponse?.items || [];
  const campaignPagination = campaignsResponse?.pagination || {
    page: 1,
    pageSize: 15,
    total: 0,
    totalPages: 1,
  };

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
      ? notificationsData.map((n: any) => {
          const data = n.data && typeof n.data === 'object' ? n.data : {};
          return {
            id: String(n.id),
            title: typeof n.title === 'string' ? n.title : n.title?.message || 'System Notification',
            message: typeof n.message === 'string' ? n.message : n.message?.text || 'Notification update received',
            time:
              n.createdAt && !isNaN(new Date(n.createdAt).getTime())
                ? new Date(n.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) +
                  ' ' +
                  new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : 'Recent',
            isRead: Boolean(n.isRead),
            type: n.type || 'GENERAL',
            imageUrl: n.imageUrl || data.imageUrl,
            showCta: data.showCta === true || data.showCta === 'true',
            ctaText: data.ctaText,
            ctaActionType: data.ctaActionType,
            ctaActionValue: data.ctaActionValue || data.deepLink || data.route,
          };
        })
      : [];

  const unreadCount = items.filter((n) => !n.isRead).length;
  const readCount = items.filter((n) => n.isRead).length;

  const filteredItems = items.filter((n) => {
    if (activeTab === 'UNREAD') return !n.isRead;
    if (activeTab === 'READ') return n.isRead;
    return true;
  });

  const totalCampaigns = campaignPagination.total || campaignsData.length;
  const scheduledCampaignsCount = campaignsData.filter((c) => c.status === 'SCHEDULED').length;
  const sentCampaignsCount = campaignsData.filter((c) => c.status === 'SENT').length;

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-16 text-slate-800 animate-in fade-in-50 duration-200">
      <AdminPageHeader
        title="Notification Center"
        description="Manage system notifications, monitor recipient deliveries, and broadcast rich offer push notifications."
        icon={Bell}
        iconColor="text-[#1AA14D]"
        badge={{
          text: 'FCM PUSH & ALERTS',
          icon: Megaphone,
          variant: 'emerald',
        }}
        breadcrumbs={[
          { label: 'Settings', href: '/settings' },
          { label: 'Notification Center' },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <AdminButton
              variant="outline"
              size="md"
              icon={RefreshCw}
              loading={isFetching || isFetchingCampaigns}
              onClick={() => {
                refetch();
                refetchCampaigns();
              }}
              title="Refresh feed"
            >
              Refresh
            </AdminButton>

            {canSendOffer && (
              <AdminButton
                variant="primary"
                size="md"
                icon={Megaphone}
                onClick={() => setIsOfferDrawerOpen(true)}
              >
                Create Offer Notification
              </AdminButton>
            )}

            {activeSection === 'FEED' && unreadCount > 0 && (
              <AdminButton
                variant="outline"
                size="md"
                icon={Check}
                loading={markAllReadMutation.isPending}
                onClick={() => markAllReadMutation.mutate()}
              >
                Mark All Read
              </AdminButton>
            )}
          </div>
        }
      />

      {/* Navigation Switch Tabs: IN-APP FEED vs OFFER CAMPAIGNS */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200/80 w-fit">
        <button
          onClick={() => setActiveSection('FEED')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeSection === 'FEED'
              ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Bell className="w-3.5 h-3.5 text-[#1AA14D]" />
          <span>In-App Alerts Feed</span>
          <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-mono">
            {pagination.total || items.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSection('CAMPAIGNS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeSection === 'CAMPAIGNS'
              ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Offer Push Campaigns</span>
          <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold">
            {totalCampaigns}
          </span>
        </button>
      </div>

      {/* VIEW 1: IN-APP ALERTS FEED */}
      {activeSection === 'FEED' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <AdminStatCard
              title="Total Notifications"
              value={isLoading ? '...' : pagination.total || items.length}
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

            {isError && (
              <div className="p-4 bg-rose-50 border-b border-rose-100 flex items-center justify-between gap-3 text-xs text-rose-700 font-bold">
                <span>Failed to load notifications from server. Please retry.</span>
                <AdminButton variant="outline" size="sm" icon={RefreshCw} onClick={() => refetch()}>
                  Retry
                </AdminButton>
              </div>
            )}

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
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-extrabold text-slate-900 text-sm">{n.title}</h3>
                          {!n.isRead && (
                            <span className="w-2 h-2 rounded-full bg-[#23C45E] inline-block" />
                          )}
                          {n.type === 'ADMIN_OFFER' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
                              OFFER
                            </span>
                          )}
                        </div>
                        <p className="text-slate-600 font-medium leading-relaxed whitespace-pre-wrap">
                          {n.message}
                        </p>

                        {/* If promotional image attached */}
                        {n.imageUrl && (
                          <div className="mt-2 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 max-w-sm">
                            <img
                              src={n.imageUrl}
                              alt="Notification Image"
                              className="w-full h-32 object-cover"
                            />
                          </div>
                        )}

                        {/* If custom CTA configured */}
                        {n.showCta && n.ctaText && (
                          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                            <span>CTA: {n.ctaText}</span>
                            <span className="text-slate-400 font-normal">
                              ({n.ctaActionType || 'DEEP_LINK'}: {n.ctaActionValue || 'default'})
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[11px] font-mono text-slate-400 font-medium whitespace-nowrap">
                        {n.time}
                      </span>
                      {!n.isRead && (
                        <button
                          onClick={() => markSingleReadMutation.mutate(n.id)}
                          disabled={markSingleReadMutation.isPending}
                          className="p-1.5 hover:bg-white text-slate-400 hover:text-[#1AA14D] rounded-xl border border-transparent hover:border-slate-200 transition-all cursor-pointer disabled:opacity-50"
                          title="Mark as read"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center text-slate-400 text-xs font-bold flex flex-col items-center justify-center gap-2">
                  <Bell className="w-8 h-8 text-slate-300" />
                  <span>No notifications in this view.</span>
                </div>
              )}
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
        </div>
      )}

      {/* VIEW 2: OFFER PUSH CAMPAIGNS (HISTORY & AUDIENCE DISPATCH LOG) */}
      {activeSection === 'CAMPAIGNS' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <AdminStatCard
              title="Total Broadcasts"
              value={isLoadingCampaigns ? '...' : totalCampaigns}
              description="Rich promotional campaigns"
              icon={Sparkles}
              iconBg="primary"
            />
            <AdminStatCard
              title="Dispatched Offers"
              value={isLoadingCampaigns ? '...' : sentCampaignsCount}
              description="Sent immediately to mobile devices"
              icon={Send}
              iconBg="primary"
            />
            <AdminStatCard
              title="Scheduled Campaigns"
              value={isLoadingCampaigns ? '...' : scheduledCampaignsCount}
              description="Queued for automated sending"
              icon={Clock}
              iconBg="amber"
            />
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between flex-wrap gap-4 bg-slate-50/50">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">
                  Offer Notification Broadcast History
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Track audience targeting, promotional images, CTA labels, and delivery metrics.
                </p>
              </div>

              {canSendOffer && (
                <AdminButton
                  variant="primary"
                  size="sm"
                  icon={Megaphone}
                  onClick={() => setIsOfferDrawerOpen(true)}
                >
                  New Offer Push
                </AdminButton>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-100/70 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Offer / Details</th>
                    <th className="py-3 px-4">Target Audience</th>
                    <th className="py-3 px-4">CTA Configuration</th>
                    <th className="py-3 px-4">Image</th>
                    <th className="py-3 px-4">Status & Delivery</th>
                    <th className="py-3 px-4">Date / Schedule</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoadingCampaigns ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 font-bold animate-pulse">
                        Loading offer campaigns history...
                      </td>
                    </tr>
                  ) : campaignsData.length > 0 ? (
                    campaignsData.map((c) => {
                      const isCustomer = c.targetType === 'CUSTOMERS';
                      return (
                        <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                          {/* Offer Title & Message */}
                          <td className="py-4 px-4 max-w-xs">
                            <div className="font-extrabold text-slate-900 text-sm leading-snug">
                              {c.title}
                            </div>
                            <div className="text-slate-500 font-medium mt-0.5 line-clamp-2">
                              {c.message}
                            </div>
                          </td>

                          {/* Target Audience */}
                          <td className="py-4 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              {isCustomer ? (
                                <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-extrabold text-[10px] border border-blue-200 flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  Customers
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-extrabold text-[10px] border border-purple-200 flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  Employees
                                </span>
                              )}
                              <span className="font-mono text-slate-600 font-bold">
                                {c.audience === 'ALL'
                                  ? 'All'
                                  : `${c.targetIds?.length || c.recipientCount || 'Specific'} Selected`}
                              </span>
                            </div>
                          </td>

                          {/* CTA Configuration */}
                          <td className="py-4 px-4">
                            {c.showCta && c.ctaText ? (
                              <div className="space-y-1">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 font-black text-[11px] shadow-2xs border border-emerald-300">
                                  [{c.ctaText}]
                                </span>
                                <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                                  {c.ctaActionType === 'WEB_URL' ? (
                                    <ExternalLink className="w-3 h-3 text-slate-400" />
                                  ) : (
                                    <LinkIcon className="w-3 h-3 text-slate-400" />
                                  )}
                                  <span className="truncate max-w-[140px]" title={c.ctaActionValue}>
                                    {c.ctaActionValue || 'Default'}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <span className="text-[11px] font-semibold text-slate-400 italic">
                                No CTA Button
                              </span>
                            )}
                          </td>

                          {/* Promotional Image */}
                          <td className="py-4 px-4 whitespace-nowrap">
                            {c.imageUrl ? (
                              <div className="relative group w-14 h-10 rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                                <img
                                  src={c.imageUrl}
                                  alt="Banner"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <span className="text-slate-300 text-xs">—</span>
                            )}
                          </td>

                          {/* Status & Delivery Metrics */}
                          <td className="py-4 px-4 whitespace-nowrap">
                            <div className="space-y-1">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                  c.status === 'SENT'
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    : c.status === 'SCHEDULED'
                                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                    : 'bg-rose-100 text-rose-800 border border-rose-200'
                                }`}
                              >
                                {c.status === 'SENT' && <Check className="w-3 h-3" />}
                                {c.status === 'SCHEDULED' && <Clock className="w-3 h-3" />}
                                {c.status}
                              </span>

                              <div className="text-[11px] text-slate-500 font-medium">
                                Recipient(s): <span className="font-bold text-slate-800">{c.recipientCount}</span>
                                {c.status === 'SENT' && (
                                  <>
                                    {' '}| Delivered:{' '}
                                    <span className="font-bold text-emerald-600">{c.sentCount}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Date / Scheduled Time */}
                          <td className="py-4 px-4 whitespace-nowrap font-mono text-[11px] text-slate-500">
                            {c.scheduledAt ? (
                              <div className="space-y-0.5">
                                <div className="text-amber-800 font-bold flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  Sched: {new Date(c.scheduledAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}{' '}
                                  {new Date(c.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  Created: {new Date(c.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                </div>
                              </div>
                            ) : (
                              <div>
                                {new Date(c.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}{' '}
                                {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 font-bold">
                        <Sparkles className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        No promotional offer notifications sent yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <AdminPagination
              page={campaignPage}
              pageSize={campaignPageSize}
              total={campaignPagination.total}
              totalPages={campaignPagination.totalPages}
              onPageChange={setCampaignPage}
              onPageSizeChange={(size) => {
                setCampaignPageSize(size);
                setCampaignPage(1);
              }}
              disabled={isLoadingCampaigns}
            />
          </div>
        </div>
      )}

      {/* CREATE OFFER NOTIFICATION FORM DRAWER */}
      <CreateOfferNotificationDrawer
        isOpen={isOfferDrawerOpen}
        onClose={() => setIsOfferDrawerOpen(false)}
        onSuccess={() => {
          refetch();
          refetchCampaigns();
        }}
      />
    </div>
  );
}
