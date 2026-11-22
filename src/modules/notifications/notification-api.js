import api from '../../../lib/api';
import {
  faBell,
  faBullhorn,
  faClock,
  faCalendarDay,
  faListCheck,
  faCreditCard,
  faMoneyBillWave,
  faUserPlus,
  faHandshake,
  faFingerprint,
} from '@fortawesome/free-solid-svg-icons';

/**
 * Format timestamp into user-friendly relative time string.
 */
export function formatRelativeTime(dateInput) {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return '';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay === 1) return 'Yesterday';
  if (diffDay < 7) return `${diffDay}d ago`;

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Map notification type to appropriate FontAwesome icon and navigation route.
 */
export function resolveNotificationMetadata(type = '', data = {}) {
  const normType = String(type || '').toUpperCase();

  if (normType.includes('ANNOUNCEMENT')) {
    return {
      icon: faBullhorn,
      href: '/admin/hrm/announcements',
      category: 'Announcement',
      color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    };
  }

  if (normType.includes('OVERTIME')) {
    return {
      icon: faClock,
      href: '/admin/hrm/overtime',
      category: 'Overtime',
      color: 'bg-amber-50 text-amber-800 border-amber-200',
    };
  }

  if (normType.includes('LEAVE')) {
    return {
      icon: faCalendarDay,
      href: '/admin/hrm/leaves',
      category: 'Leave',
      color: 'bg-blue-50 text-blue-800 border-blue-200',
    };
  }

  if (normType.includes('ATTENDANCE')) {
    return {
      icon: faFingerprint,
      href: '/admin/hrm/attendance',
      category: 'Attendance',
      color: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    };
  }

  if (normType.includes('TASK') || normType.includes('WORK')) {
    return {
      icon: faListCheck,
      href: '/admin/crm/tasks',
      category: 'Task',
      color: 'bg-purple-50 text-purple-800 border-purple-200',
    };
  }

  if (normType.includes('LEAD')) {
    const leadId = data?.leadId;
    return {
      icon: faUserPlus,
      href: leadId ? `/admin/crm/leads?id=${leadId}` : '/admin/crm/leads',
      category: 'Lead',
      color: 'bg-teal-50 text-teal-800 border-teal-200',
    };
  }

  if (normType.includes('DEAL')) {
    return {
      icon: faHandshake,
      href: '/admin/crm/deals',
      category: 'Deal',
      color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    };
  }

  if (normType.includes('PAYROLL') || normType.includes('SALARY')) {
    return {
      icon: faMoneyBillWave,
      href: '/admin/hrm/payroll',
      category: 'Payroll',
      color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    };
  }

  if (normType.includes('EXPENSE') || normType.includes('CLAIM')) {
    return {
      icon: faCreditCard,
      href: '/admin/hrm/expense-claims',
      category: 'Expense',
      color: 'bg-rose-50 text-rose-800 border-rose-200',
    };
  }

  return {
    icon: faBell,
    href: '/admin/settings/notifications',
    category: 'System',
    color: 'bg-slate-50 text-slate-700 border-slate-200',
  };
}

/**
 * Fetch paginated notifications for the authenticated user.
 */
export async function loadUserNotifications(query = {}) {
  const params = {
    page: query.page || 1,
    limit: query.limit || 20,
    ...(query.unreadOnly ? { unreadOnly: 'true' } : {}),
    ...(query.search ? { search: query.search } : {}),
  };

  const response = await api.get('/notifications', { params });
  const rawItems = Array.isArray(response)
    ? response
    : response?.items || response?.data || [];

  const items = rawItems.map((n) => {
    const meta = resolveNotificationMetadata(n.type, n.data);
    return {
      id: n.id,
      title: n.title || 'Notification',
      desc: n.message || n.body || '',
      type: n.type || 'GENERAL',
      isRead: Boolean(n.isRead),
      time: formatRelativeTime(n.createdAt),
      createdAt: n.createdAt,
      href: n.data?.link || n.data?.href || meta.href,
      icon: meta.icon,
      color: meta.color,
      category: meta.category,
      raw: n,
    };
  });

  const unreadCount =
    typeof response?.unreadCount === 'number'
      ? response.unreadCount
      : items.filter((i) => !i.isRead).length;

  return {
    items,
    unreadCount,
    pagination: response?.pagination || response?.meta || { total: items.length },
  };
}

/**
 * Fetch unread notification count.
 */
export async function loadUnreadCount() {
  try {
    const response = await api.get('/notifications/unread-count');
    return Number(response?.unreadCount ?? response?.count ?? 0);
  } catch {
    // Graceful fallback to unread list count
    const list = await loadUserNotifications({ unreadOnly: true, limit: 1 });
    return Number(list.unreadCount ?? 0);
  }
}

/**
 * Mark a single notification as read.
 */
export async function markNotificationAsRead(id) {
  if (!id) return null;
  return api.patch(`/notifications/${id}/read`);
}

/**
 * Mark all notifications as read.
 */
export async function markAllNotificationsAsRead() {
  return api.patch('/notifications/read-all');
}

/**
 * Fetch company announcements to surface in notification center when available.
 */
export async function loadCompanyAnnouncements(params = {}) {
  try {
    const response = await api.get('/admin/hrm/announcements', {
      params: {
        status: 'PUBLISHED',
        limit: params.limit || 5,
        page: params.page || 1,
      },
    });

    const rows = Array.isArray(response)
      ? response
      : response?.items || response?.data || response?.rows || [];

    return rows.map((a) => ({
      id: `announcement-${a.id}`,
      title: a.title || 'Company Announcement',
      desc: a.description || a.content || 'A new company announcement is available.',
      type: 'ANNOUNCEMENT',
      isRead: false,
      time: formatRelativeTime(a.publishAt || a.createdAt),
      createdAt: a.publishAt || a.createdAt,
      href: '/admin/hrm/announcements',
      icon: faBullhorn,
      color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      category: 'Announcement',
      raw: a,
    }));
  } catch {
    return [];
  }
}
