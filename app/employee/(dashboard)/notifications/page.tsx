'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '@/lib/api';
import { hasPermission } from '@/lib/access-control';
import { getErrorMessage } from '@/lib/utils';
import { useEmployeeAuthStore } from '@/lib/employee-store';

type Filter = 'all' | 'unread';

interface EmployeeNotification {
  id: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

function asList(payload: any): any[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  return [];
}

function mapNotification(raw: any): EmployeeNotification | null {
  const id = Number(raw?.id);
  if (!id) return null;
  return {
    id,
    title: String(raw.title || 'Notification'),
    message: String(raw.message || raw.body || ''),
    type: String(raw.type || 'GENERAL'),
    isRead: Boolean(raw.isRead),
    createdAt: String(raw.createdAt || ''),
  };
}

function formatWhen(value: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function typeLabel(type: string) {
  return type.replace(/_/g, ' ').toLowerCase();
}

export default function NotificationsPage() {
  const user = useEmployeeAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<Filter>('all');

  const canRead = hasPermission(user, ['employee.notifications.read', 'notifications.read']);
  const canMarkAll = hasPermission(user, ['employee.notifications.mark_all_read', 'notifications.mark_all_read']);

  const notificationsQuery = useQuery({
    queryKey: ['employee-notifications', 'list', filter],
    enabled: Boolean(user),
    queryFn: async () => {
      const response: any = await api.get('/notifications', {
        params: {
          limit: 50,
          ...(filter === 'unread' ? { unreadOnly: 'true' } : {}),
        },
      });
      return asList(response).map(mapNotification).filter((item): item is EmployeeNotification => Boolean(item));
    },
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['employee-notifications'] });
  };

  const markOne = useMutation({
    mutationFn: (id: number) => api.patch(`/notifications/${id}/read`),
    onSuccess: refresh,
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const markAll = useMutation({
    mutationFn: () => api.patch('/notifications/read-all'),
    onSuccess: () => {
      toast.success('All notifications marked as read');
      refresh();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const items = notificationsQuery.data ?? [];
  const unreadOnPage = items.filter((item) => !item.isRead).length;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Notifications</h1>
          <p className="mt-1 text-sm text-slate-500">Alerts for leave, attendance, and workspace updates.</p>
        </div>
        {canMarkAll && unreadOnPage > 0 && (
          <button
            type="button"
            onClick={() => markAll.mutate()}
            disabled={markAll.isPending}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            <CheckCheck className="h-4 w-4 text-[#16A34A]" />
            Mark all as read
          </button>
        )}
      </div>

      <div className="flex gap-6 border-b border-slate-200">
        {(
          [
            ['all', 'All'],
            ['unread', 'Unread'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`-mb-px border-b-2 pb-2.5 text-sm font-semibold ${
              filter === key ? 'border-[#16A34A] text-[#16A34A]' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {notificationsQuery.isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-20 animate-pulse rounded-2xl border border-slate-200 bg-white" />
          ))}
        </div>
      ) : notificationsQuery.isError ? (
        <div className="rounded-2xl border border-red-100 bg-white p-5 text-sm text-red-700">
          Unable to load notifications.
          <button type="button" onClick={() => notificationsQuery.refetch()} className="ml-3 font-semibold underline">
            Try again
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center">
          <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <Bell className="h-5 w-5" />
          </span>
          <p className="mt-3 text-sm font-semibold text-slate-800">
            {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
          </p>
          <p className="mt-1 text-sm text-slate-500">New alerts will show up here.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (!item.isRead && canRead && !markOne.isPending) markOne.mutate(item.id);
              }}
              className={`flex w-full items-start gap-3 border-b border-slate-100 px-4 py-4 text-left last:border-b-0 sm:px-5 ${
                item.isRead ? 'bg-white' : 'bg-emerald-50/40'
              } ${canRead && !item.isRead ? 'hover:bg-emerald-50' : ''}`}
            >
              <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${item.isRead ? 'bg-slate-100 text-slate-400' : 'bg-emerald-50 text-emerald-600'}`}>
                <Bell className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-start justify-between gap-3">
                  <span className="text-sm font-semibold text-slate-900">{item.title}</span>
                  {!item.isRead && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#16A34A]" />}
                </span>
                {item.message && <span className="mt-1 block text-sm text-slate-500">{item.message}</span>}
                <span className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                  <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-medium capitalize text-slate-500">{typeLabel(item.type)}</span>
                  <span>{formatWhen(item.createdAt)}</span>
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
