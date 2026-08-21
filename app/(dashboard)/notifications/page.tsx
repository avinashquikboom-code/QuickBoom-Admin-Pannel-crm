'use client';

import React, { useState } from 'react';
import { Bell, CheckCircle2, Clock, Calendar, Check, Trash2, Mail } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  type: 'LEAVE' | 'ATTENDANCE' | 'CRM' | 'PAYROLL';
}

const mockNotifications: NotificationItem[] = [
  {
    id: '1',
    title: 'Work Scheduled: 2 Reels Production',
    message: 'SSM Team A scheduled on-site shooting for Acme Enterprises at Bandra Studio.',
    time: '10 minutes ago',
    isRead: false,
    type: 'CRM',
  },
  {
    id: '2',
    title: 'Payment Received: ₹49,999',
    message: 'TechCorp Solutions renewed their Enterprise Plan for 1 Year.',
    time: '1 hour ago',
    isRead: false,
    type: 'PAYROLL',
  },
];

export default function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data: notificationsData } = useQuery({
    queryKey: ['admin-notifications'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/notifications');
        return res?.data?.items || res?.items || res?.data || res;
      } catch {
        return null;
      }
    },
  });

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
      toast.success('Notification dismissed');
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
    },
  });

  const items: NotificationItem[] =
    Array.isArray(notificationsData) && notificationsData.length > 0
      ? notificationsData.map((n: any) => ({
          id: n.id,
          title: n.title,
          message: n.message,
          time: n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent',
          isRead: Boolean(n.isRead),
          type: n.type === 'PAYMENT_RECEIVED' ? 'PAYROLL' : 'CRM',
        }))
      : mockNotifications;

  const markAllRead = () => {
    markAllReadMutation.mutate();
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">System Notifications</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Real-time alerts, approval updates, and workflow notifications.
          </p>
        </div>

        <button
          onClick={markAllRead}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-bold transition-all cursor-pointer"
        >
          <Check className="w-4 h-4" /> Mark all as read
        </button>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
              item.isRead
                ? 'bg-white border-slate-200/80 opacity-75'
                : 'bg-indigo-50/40 border-indigo-100'
            }`}
          >
            <div className="flex items-start gap-3.5">
              <div
                className={`p-2.5 rounded-xl ${
                  item.type === 'LEAVE'
                    ? 'bg-emerald-50 text-emerald-600'
                    : item.type === 'CRM'
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'bg-amber-50 text-amber-600'
                }`}
              >
                <Bell className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-sm">{item.title}</h3>
                  {!item.isRead && (
                    <span className="w-2 h-2 rounded-full bg-indigo-600" />
                  )}
                </div>
                <p className="text-xs text-slate-600 font-medium">{item.message}</p>
                <p className="text-[11px] text-slate-400 font-semibold pt-1">{item.time}</p>
              </div>
            </div>

            <button
              onClick={() => markSingleReadMutation.mutate(item.id)}
              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
              title="Dismiss notification"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
