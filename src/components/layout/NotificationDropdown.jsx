'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import {
  faBell,
  faCheckDouble,
  faCheckCircle,
  faArrowsRotate,
  faRotateRight,
} from '@fortawesome/free-solid-svg-icons';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import {
  loadUserNotifications,
  loadCompanyAnnouncements,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '@/modules/notifications/notification-api';

export function NotificationDropdown() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [markingAll, setMarkingAll] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const fetchAll = React.useCallback(async () => {
    try {
      setError(null);
      const [notifResult, announcements] = await Promise.all([
        loadUserNotifications({ limit: 15 }).catch(() => ({ items: [], unreadCount: 0 })),
        loadCompanyAnnouncements({ limit: 5 }).catch(() => []),
      ]);

      const notifItems = notifResult.items || [];
      // Combine user notifications with company announcements, ensuring no duplicate IDs
      const seenIds = new Set(notifItems.map((n) => String(n.id)));
      const combined = [...notifItems];

      for (const ann of announcements) {
        if (!seenIds.has(String(ann.id))) {
          seenIds.add(String(ann.id));
          combined.push(ann);
        }
      }

      // Sort by creation date descending
      combined.sort((a, b) => {
        const timeA = new Date(a.createdAt || 0).getTime();
        const timeB = new Date(b.createdAt || 0).getTime();
        return timeB - timeA;
      });

      setNotifications(combined);
      const computedUnread = combined.filter((item) => !item.isRead).length;
      setUnreadCount(Math.max(notifResult.unreadCount ?? 0, computedUnread));
    } catch (err) {
      setError(err?.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load & 45s periodic background polling
  React.useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 45000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  // Mark all unread notifications as read
  const handleMarkAllRead = async () => {
    if (unreadCount === 0 || markingAll) return;
    setMarkingAll(true);
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (err) {
      // Optimistically still update local state if backend update was partial
      setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
      setUnreadCount(0);
      toast.success('Notifications marked as read');
    } finally {
      setMarkingAll(false);
    }
  };

  // Click individual notification
  const handleItemClick = async (item) => {
    if (!item.isRead) {
      // Optimistic mark as read
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));

      // Trigger backend read call if numeric ID
      if (typeof item.id === 'number' || !String(item.id).startsWith('announcement-')) {
        markNotificationAsRead(item.id).catch(() => {});
      }
    }

    setOpen(false);
    if (item.href) {
      router.push(item.href);
    }
  };

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) fetchAll();
      }}
    >
      <PopoverTrigger
        aria-label="Notifications"
        className="relative flex size-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand cursor-pointer"
      >
        <FontAwesomeIcon icon={faBell} className="size-4.5" />
        {mounted && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex min-w-4 h-4 px-1 items-center justify-center rounded-full bg-[#163A2E] text-[10px] font-bold text-white shadow-xs animate-in zoom-in-50">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[min(380px,calc(100vw-2rem))] p-0 bg-white border border-slate-200 shadow-xl rounded-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 bg-[#F7F9F8]">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-bold text-slate-900">Notifications</span>
            {unreadCount > 0 && (
              <Badge className="bg-emerald-100 text-emerald-800 text-[10px] font-bold h-5 px-2 shadow-none border-0 rounded-full">
                {unreadCount} New
              </Badge>
            )}
          </div>
          <button
            type="button"
            disabled={unreadCount === 0 || markingAll}
            onClick={handleMarkAllRead}
            className="text-xs text-[#163A2E] hover:text-[#204C3D] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 font-semibold transition-colors cursor-pointer"
          >
            <FontAwesomeIcon
              icon={markingAll ? faArrowsRotate : faCheckDouble}
              className={`size-3.5 ${markingAll ? 'animate-spin' : ''}`}
            />
            <span>Mark read</span>
          </button>
        </div>

        {/* List Area */}
        <div className="divide-y divide-slate-100 max-h-80 sm:max-h-96 overflow-y-auto scrollbar-thin">
          {/* Loading Skeleton */}
          {loading && notifications.length === 0 && (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((k) => (
                <div key={k} className="flex items-start gap-3 animate-pulse">
                  <div className="size-8 rounded-lg bg-slate-200 shrink-0" />
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="h-3 bg-slate-200 rounded w-3/4" />
                    <div className="h-2.5 bg-slate-100 rounded w-full" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {!loading && error && notifications.length === 0 && (
            <div className="p-6 text-center text-slate-500 space-y-2">
              <p className="text-xs text-rose-600 font-semibold">{error}</p>
              <button
                type="button"
                onClick={fetchAll}
                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-[#163A2E] bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
              >
                <FontAwesomeIcon icon={faRotateRight} className="size-3" />
                <span>Retry</span>
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && notifications.length === 0 && (
            <div className="p-8 text-center text-slate-500 space-y-2">
              <div className="size-10 rounded-full bg-emerald-50 text-[#163A2E] mx-auto flex items-center justify-center border border-emerald-100">
                <FontAwesomeIcon icon={faCheckCircle} className="size-5" />
              </div>
              <p className="text-xs font-bold text-slate-800">No notifications</p>
              <p className="text-[11px] text-slate-400">You're all caught up with your latest updates.</p>
            </div>
          )}

          {/* Notifications List */}
          {notifications.map((item) => {
            const isUnread = !item.isRead;
            return (
              <div
                key={item.id}
                role="button"
                tabIndex={0}
                onClick={() => handleItemClick(item)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleItemClick(item);
                  }
                }}
                className={`w-full text-left p-3.5 flex items-start gap-3 transition-colors cursor-pointer select-none ${
                  isUnread
                    ? 'bg-emerald-50/40 hover:bg-emerald-50/70 border-l-2 border-l-[#20C466]'
                    : 'bg-white hover:bg-slate-50/80 text-slate-700'
                }`}
              >
                {/* Type Icon */}
                <div
                  className={`size-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border shadow-2xs ${
                    item.color || 'bg-white text-[#163A2E] border-slate-200'
                  }`}
                >
                  <FontAwesomeIcon icon={item.icon || faBell} className="size-3.5" />
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center min-w-0 font-bold text-xs text-slate-900 truncate">
                      {isUnread && (
                        <span
                          className="size-2 rounded-full bg-[#20C466] shrink-0 mr-1.5"
                          title="Unread notification"
                        />
                      )}
                      <span className="truncate">{item.title}</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal shrink-0">
                      {item.time}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] sm:text-xs text-slate-500 leading-relaxed line-clamp-2">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-2.5 border-t border-slate-100 text-center bg-[#F7F9F8] flex items-center justify-between px-4">
          <Link
            href="/admin/hrm/announcements"
            onClick={() => setOpen(false)}
            className="text-xs font-semibold text-[#163A2E] hover:text-[#204C3D] hover:underline transition-colors"
          >
            View all company updates →
          </Link>
          <Link
            href="/admin/settings/notifications"
            onClick={() => setOpen(false)}
            className="text-[11px] font-medium text-slate-400 hover:text-slate-600 transition-colors"
          >
            All notifications
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
