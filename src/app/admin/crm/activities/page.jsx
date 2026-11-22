'use client';

import * as React from 'react';
import { PageTitleCard } from '@/components/common/PageTitleCard';
import {
  Activity,
  ShieldCheck,
  Smartphone,
  AlertTriangle,
  Search,
  Filter,
  RotateCw,
  X,
  ChevronLeft,
  ChevronRight,
  Clock,
  Calendar,
  Eye,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  User,
  Users,
  Layers,
  Building2,
  CalendarCheck,
  CalendarX,
  Laptop,
  ListTodo,
  MapPin,
  Database,
  Settings,
  Sparkles,
  Wallet,
  Shield,
  SlidersHorizontal,
  ChevronDown,
  Globe,
  Terminal,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { loadActivities, loadEmployees, crmError } from '@/modules/crm/crm-api';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// Helper: Format Date string cleanly
function formatDisplayDate(value) {
  if (!value) return '—';
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return String(value).slice(0, 10);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return String(value).slice(0, 10);
  }
}

// Helper: Format Time string cleanly
function formatDisplayTime(value) {
  if (!value) return '—';
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '';
  }
}

// Helper: Relative time calculation
function formatRelativeTime(value) {
  if (!value) return '';
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return '';
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    if (diffDay < 30) return `${Math.floor(diffDay / 7)}w ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

// Helper: Extract Initials
function getInitials(name) {
  if (!name || typeof name !== 'string') return 'SY';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'SY';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Helper: Deterministic avatar background
function getAvatarGradient(name) {
  const gradients = [
    'from-emerald-500 to-teal-600',
    'from-blue-500 to-indigo-600',
    'from-violet-500 to-purple-600',
    'from-amber-500 to-orange-600',
    'from-sky-500 to-blue-600',
    'from-rose-500 to-pink-600',
  ];
  if (!name || typeof name !== 'string') return gradients[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
}

// Helper: Return module icon component
function getModuleIcon(moduleName) {
  if (!moduleName) return Layers;
  const lower = String(moduleName).toLowerCase();
  if (lower.includes('crm') || lower.includes('lead') || lower.includes('deal') || lower.includes('customer')) return Users;
  if (lower.includes('attendance')) return CalendarCheck;
  if (lower.includes('leave')) return CalendarX;
  if (lower.includes('remote')) return Laptop;
  if (lower.includes('task')) return ListTodo;
  if (lower.includes('visit')) return MapPin;
  if (lower.includes('capture')) return Database;
  if (lower.includes('hrm') || lower.includes('employee')) return Building2;
  if (lower.includes('setting')) return Settings;
  if (lower.includes('influencer')) return Sparkles;
  if (lower.includes('payroll') || lower.includes('salary') || lower.includes('commission')) return Wallet;
  if (lower.includes('auth') || lower.includes('login') || lower.includes('system') || lower.includes('security')) return Shield;
  return Layers;
}

// Helper: Action Badge styling
function ActionBadge({ action }) {
  const act = String(action || 'MUTATION').toUpperCase();
  let badgeStyle = 'bg-slate-100 text-slate-700 border-slate-200';

  if (act.includes('CREATE') || act.includes('ADD') || act.includes('IMPORT') || act.includes('RESOLVE')) {
    badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
  } else if (act.includes('UPDATE') || act.includes('EDIT') || act.includes('ASSIGN') || act.includes('CONVERT')) {
    badgeStyle = 'bg-blue-50 text-blue-700 border-blue-200/80';
  } else if (act.includes('DELETE') || act.includes('REMOVE') || act.includes('DESTROY')) {
    badgeStyle = 'bg-rose-50 text-rose-700 border-rose-200/80';
  } else if (act.includes('LOGIN')) {
    badgeStyle = 'bg-sky-50 text-sky-700 border-sky-200/80';
  } else if (act.includes('LOGOUT')) {
    badgeStyle = 'bg-slate-100 text-slate-600 border-slate-200/80';
  } else if (act.includes('APPROVE')) {
    badgeStyle = 'bg-teal-50 text-teal-700 border-teal-200/80';
  } else if (act.includes('REJECT')) {
    badgeStyle = 'bg-red-50 text-red-700 border-red-200/80';
  } else if (act.includes('SUBMIT')) {
    badgeStyle = 'bg-indigo-50 text-indigo-700 border-indigo-200/80';
  }

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border tracking-wide uppercase shrink-0',
        badgeStyle
      )}
    >
      {act}
    </span>
  );
}

// Helper: Status Badge styling
function StatusBadgeComponent({ status }) {
  const isSuccess = String(status || '').toUpperCase() === 'SUCCESS';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border shrink-0',
        isSuccess
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
          : 'bg-rose-50 text-rose-700 border-rose-200'
      )}
    >
      {isSuccess ? (
        <CheckCircle2 className="size-3.5 text-emerald-600" />
      ) : (
        <AlertTriangle className="size-3.5 text-rose-600" />
      )}
      <span>{isSuccess ? 'SUCCESS' : 'FAILED'}</span>
    </span>
  );
}

// Activity Detail Drawer Modal
function ActivityDetailDrawer({ activity, open, onClose }) {
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (!open) setCopied(false);
  }, [open]);

  if (!open || !activity) return null;

  const handleCopyJson = () => {
    try {
      navigator.clipboard.writeText(JSON.stringify(activity, null, 2));
      setCopied(true);
      toast.success('Activity payload copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  };

  const ModuleIcon = getModuleIcon(activity.module);
  const isSuccess = String(activity.status || '').toUpperCase() === 'SUCCESS';

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative flex h-full w-full max-w-xl flex-col bg-white shadow-2xl border-l border-slate-200 transition-transform animate-in slide-in-from-right duration-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4.5 bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-[#16A34A]">
              <Activity className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Activity #{activity.id}
                </h3>
                <StatusBadgeComponent status={activity.status} />
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {formatDisplayDate(activity.createdAt || activity.timestamp)} at{' '}
                {formatDisplayTime(activity.createdAt || activity.timestamp)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition"
          >
            <X className="size-4.5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Failure Alert if Failed */}
          {!isSuccess && activity.errorMessage && (
            <div className="rounded-xl border border-rose-200 bg-rose-50/90 p-4 text-xs text-rose-800 space-y-1">
              <div className="flex items-center gap-2 font-bold text-rose-900">
                <AlertTriangle className="size-4 shrink-0 text-rose-600" />
                <span>Error Execution Details</span>
              </div>
              <p className="pl-6 font-mono text-[11px] leading-relaxed break-words">
                {activity.errorMessage}
              </p>
            </div>
          )}

          {/* Core Overview Grid */}
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 space-y-3">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Overview
            </h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-500">Module:</span>
                <div className="mt-1 flex items-center gap-1.5 font-medium text-slate-900">
                  <ModuleIcon className="size-3.5 text-slate-500" />
                  <span>{activity.module || '—'}</span>
                </div>
              </div>
              <div>
                <span className="text-slate-500">Action:</span>
                <div className="mt-1">
                  <ActionBadge action={activity.action} />
                </div>
              </div>
              <div>
                <span className="text-slate-500">Source:</span>
                <div className="mt-1 font-medium text-slate-900">
                  {activity.source === 'MOBILE_APP' ? (
                    <span className="inline-flex items-center gap-1 text-purple-700 bg-purple-50 px-2 py-0.5 rounded text-[11px] font-semibold border border-purple-200">
                      <Smartphone className="size-3" /> Mobile App
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-[11px] font-semibold border border-blue-200">
                      <ShieldCheck className="size-3" /> Admin Panel
                    </span>
                  )}
                </div>
              </div>
              <div>
                <span className="text-slate-500">Relative Time:</span>
                <div className="mt-1 font-medium text-slate-900">
                  {formatRelativeTime(activity.createdAt || activity.timestamp)}
                </div>
              </div>
            </div>
          </div>

          {/* Actor Section */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-4 space-y-3 shadow-xs">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Actor & Identity
            </h4>
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'flex size-11 items-center justify-center rounded-full bg-linear-to-br text-white font-bold text-sm shadow-xs shrink-0',
                  getAvatarGradient(activity.userName)
                )}
              >
                {getInitials(activity.userName)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900 text-sm">
                    {activity.userName || 'System User'}
                  </span>
                  {activity.role && (
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 uppercase border border-slate-200">
                      {activity.role}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 truncate mt-0.5">
                  {activity.userEmail || `User ID #${activity.userId || '—'}`}
                </p>
              </div>
            </div>
            {activity.companyName && (
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Tenant / Customer:</span>
                <span className="font-semibold text-slate-800">
                  {activity.companyName} (#{activity.customerId})
                </span>
              </div>
            )}
          </div>

          {/* Request & Entity Details */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-4 space-y-3 shadow-xs">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Target Entity & Technical Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-500">Entity Type:</span>
                <p className="font-semibold text-slate-900 mt-0.5">
                  {activity.entityType || '—'}
                </p>
              </div>
              <div>
                <span className="text-slate-500">Entity ID:</span>
                <p className="font-mono text-slate-900 mt-0.5">
                  {activity.entityId || '—'}
                </p>
              </div>
              <div>
                <span className="text-slate-500">HTTP Endpoint:</span>
                <p className="font-mono text-[11px] text-slate-800 mt-0.5 truncate" title={activity.endpoint}>
                  {activity.method ? `${activity.method} ` : ''}
                  {activity.endpoint || '—'}
                </p>
              </div>
              <div>
                <span className="text-slate-500">IP Address:</span>
                <p className="font-mono text-slate-800 mt-0.5">
                  {activity.ipAddress || '—'}
                </p>
              </div>
              {activity.device && (
                <div className="sm:col-span-2">
                  <span className="text-slate-500">Device / User Agent:</span>
                  <p className="font-mono text-[11px] text-slate-600 mt-0.5 break-words">
                    {activity.device}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-4 space-y-2 shadow-xs">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Audit Description
            </h4>
            <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200/60 break-words">
              {activity.description || 'No description recorded.'}
            </p>
          </div>

          {/* Full Payload / JSON */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-4 space-y-2 shadow-xs">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Event Payload & Metadata
              </h4>
              <button
                onClick={handleCopyJson}
                className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition"
              >
                {copied ? (
                  <>
                    <Check className="size-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-semibold">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="size-3.5" />
                    <span>Copy JSON</span>
                  </>
                )}
              </button>
            </div>
            <pre className="max-h-60 overflow-y-auto rounded-lg bg-slate-900 p-3.5 text-[11px] font-mono text-emerald-400/90 leading-relaxed shadow-inner">
              {JSON.stringify(activity.details || activity, null, 2)}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 px-6 py-3.5 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Audit logs are immutable.
          </span>
          <Button variant="outline" size="sm" onClick={onClose} className="rounded-xl">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ActivitiesPage() {
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState('');
  const [activities, setActivities] = React.useState([]);
  const [metrics, setMetrics] = React.useState({
    total: 0,
    adminCount: 0,
    mobileCount: 0,
    successCount: 0,
    failedCount: 0,
    modules: [],
    actions: [],
  });
  const [employees, setEmployees] = React.useState([]);
  const [pagination, setPagination] = React.useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });

  // Filters State
  const [search, setSearch] = React.useState('');
  const [selectedModule, setSelectedModule] = React.useState('');
  const [selectedAction, setSelectedAction] = React.useState('');
  const [selectedUserId, setSelectedUserId] = React.useState('');
  const [selectedStatus, setSelectedStatus] = React.useState('');
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(20);

  // UI State
  const [filtersExpanded, setFiltersExpanded] = React.useState(false);
  const [selectedActivity, setSelectedActivity] = React.useState(null);
  const [isDetailOpen, setIsDetailOpen] = React.useState(false);

  // Load employee directory for user filter
  React.useEffect(() => {
    loadEmployees()
      .then((data) => {
        if (Array.isArray(data)) setEmployees(data);
      })
      .catch(() => {
        // Safe fallback
      });
  }, []);

  // Fetch audit activities
  const fetchData = React.useCallback(
    async (isBackgroundRefresh = false) => {
      if (isBackgroundRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError('');

      try {
        const queryParams = {
          page,
          limit,
          search: search.trim() || undefined,
          module: selectedModule || undefined,
          action: selectedAction || undefined,
          userId: selectedUserId ? Number(selectedUserId) : undefined,
          status: selectedStatus || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        };

        const result = await loadActivities(queryParams);
        setActivities(result.rows || []);
        if (result.metrics) {
          setMetrics((prev) => ({
            ...prev,
            ...result.metrics,
          }));
        }
        if (result.pagination) {
          setPagination({
            page: Number(result.pagination.page || page),
            limit: Number(result.pagination.limit || result.pagination.pageSize || limit),
            total: Number(result.pagination.total || 0),
            totalPages: Number(result.pagination.totalPages || Math.ceil((result.pagination.total || 0) / limit) || 1),
          });
        }
      } catch (err) {
        setError(crmError(err));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [page, limit, search, selectedModule, selectedAction, selectedUserId, selectedStatus, startDate, endDate]
  );

  // Trigger fetch when parameters change
  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle filter resets
  const handleClearFilters = () => {
    setSearch('');
    setSelectedModule('');
    setSelectedAction('');
    setSelectedUserId('');
    setSelectedStatus('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const hasActiveFilters = Boolean(
    search.trim() ||
      selectedModule ||
      selectedAction ||
      selectedUserId ||
      selectedStatus ||
      startDate ||
      endDate
  );

  const activeFilterCount = [
    Boolean(search.trim()),
    Boolean(selectedModule),
    Boolean(selectedAction),
    Boolean(selectedUserId),
    Boolean(selectedStatus),
    Boolean(startDate || endDate),
  ].filter(Boolean).length;

  // Compute Module options dynamically from metrics and standards
  const moduleOptions = React.useMemo(() => {
    const standardModules = [
      'CRM',
      'HRM',
      'Attendance',
      'Leave',
      'Remote Work',
      'Tasks',
      'Visits',
      'Data Capture',
      'Settings',
      'Influencers',
      'Payroll',
      'Authentication',
    ];
    const backendModules = Array.isArray(metrics.modules) ? metrics.modules : [];
    const combined = Array.from(new Set([...backendModules, ...standardModules])).filter(Boolean);
    return combined.sort();
  }, [metrics.modules]);

  // Compute Action options dynamically from metrics and standards
  const actionOptions = React.useMemo(() => {
    const standardActions = [
      'CREATE',
      'UPDATE',
      'DELETE',
      'LOGIN',
      'LOGOUT',
      'APPROVE',
      'REJECT',
      'SUBMIT',
    ];
    const backendActions = Array.isArray(metrics.actions) ? metrics.actions : [];
    const combined = Array.from(new Set([...backendActions, ...standardActions])).filter(Boolean);
    return combined.sort();
  }, [metrics.actions]);

  // Open detail drawer
  const handleOpenDetail = (activity) => {
    setSelectedActivity(activity);
    setIsDetailOpen(true);
  };

  // Pagination calculation
  const startRecord = pagination.total === 0 ? 0 : (page - 1) * limit + 1;
  const endRecord = Math.min(page * limit, pagination.total);

  return (
    <div className="w-full min-w-0 max-w-none space-y-5 sm:space-y-6 pb-24 overflow-x-hidden">
      {/* 1. Global Page Title Card */}
      <PageTitleCard
        module="CRM"
        title="Activities"
        description="Activity history from the audit log. New sales work is recorded as leads, follow-ups, visits, or tasks."
        icon={Activity}
      />

      {/* 2. Responsive 4 KPI Cards */}
      <div className="grid grid-cols-1 min-[440px]:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full">
        {/* Total Activities */}
        <div className="relative rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs transition-all duration-200 hover:shadow-md hover:border-slate-300 min-w-0 min-h-[120px] flex flex-col justify-between">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Total Activities
              </p>
              {loading && !refreshing ? (
                <div className="h-7 w-20 bg-slate-100 rounded animate-pulse my-1" />
              ) : (
                <span className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 block">
                  {metrics.total?.toLocaleString() ?? 0}
                </span>
              )}
              <p className="text-xs text-slate-500">All logged audit events</p>
            </div>
            <div className="flex size-10 sm:size-11 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-[#16A34A] shrink-0">
              <Activity className="size-5" />
            </div>
          </div>
        </div>

        {/* Admin Activities */}
        <div className="relative rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs transition-all duration-200 hover:shadow-md hover:border-slate-300 min-w-0 min-h-[120px] flex flex-col justify-between">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Admin Activities
              </p>
              {loading && !refreshing ? (
                <div className="h-7 w-20 bg-slate-100 rounded animate-pulse my-1" />
              ) : (
                <span className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 block">
                  {metrics.adminCount?.toLocaleString() ?? 0}
                </span>
              )}
              <p className="text-xs text-slate-500">Portal & console actions</p>
            </div>
            <div className="flex size-10 sm:size-11 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 text-blue-600 shrink-0">
              <ShieldCheck className="size-5" />
            </div>
          </div>
        </div>

        {/* Mobile Activities */}
        <div className="relative rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs transition-all duration-200 hover:shadow-md hover:border-slate-300 min-w-0 min-h-[120px] flex flex-col justify-between">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Mobile Activities
              </p>
              {loading && !refreshing ? (
                <div className="h-7 w-20 bg-slate-100 rounded animate-pulse my-1" />
              ) : (
                <span className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 block">
                  {metrics.mobileCount?.toLocaleString() ?? 0}
                </span>
              )}
              <p className="text-xs text-slate-500">Field & mobile app events</p>
            </div>
            <div className="flex size-10 sm:size-11 items-center justify-center rounded-xl border border-purple-200 bg-purple-50 text-purple-600 shrink-0">
              <Smartphone className="size-5" />
            </div>
          </div>
        </div>

        {/* Failed Activities */}
        <div className="relative rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs transition-all duration-200 hover:shadow-md hover:border-slate-300 min-w-0 min-h-[120px] flex flex-col justify-between">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Failed Activities
              </p>
              {loading && !refreshing ? (
                <div className="h-7 w-20 bg-slate-100 rounded animate-pulse my-1" />
              ) : (
                <span className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 block">
                  {metrics.failedCount?.toLocaleString() ?? 0}
                </span>
              )}
              <p className="text-xs text-slate-500">Events requiring review</p>
            </div>
            <div className="flex size-10 sm:size-11 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-600 shrink-0">
              <AlertTriangle className="size-5" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Search and Advanced Filters Panel */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs space-y-3.5">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Main Search Input */}
          <div className="relative flex-1 min-w-0">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by user, description, module, action, or record ID..."
              className="h-10 w-full rounded-xl border-slate-200/90 bg-slate-50/70 pl-10 pr-9 text-sm focus-visible:bg-white focus-visible:border-emerald-400 focus-visible:ring-emerald-100"
            />
            {search && (
              <button
                onClick={() => {
                  setSearch('');
                  setPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-md"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Filter Drawer Toggle for Mobile / Tablet */}
            <Button
              type="button"
              variant="outline"
              onClick={() => setFiltersExpanded((prev) => !prev)}
              className={cn(
                'h-10 rounded-xl border-slate-200/90 px-3.5 text-sm font-semibold transition md:hidden',
                hasActiveFilters && 'border-emerald-300 bg-emerald-50 text-emerald-800'
              )}
            >
              <SlidersHorizontal className="mr-2 size-4" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="ml-1.5 flex size-5 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">
                  {activeFilterCount}
                </span>
              )}
            </Button>

            {/* Clear Filters (if active) */}
            {hasActiveFilters && (
              <Button
                type="button"
                variant="ghost"
                onClick={handleClearFilters}
                className="h-10 rounded-xl px-3 text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50"
              >
                <X className="mr-1.5 size-3.5" />
                Clear
              </Button>
            )}

            {/* Refresh Button */}
            <Button
              type="button"
              variant="outline"
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="h-10 rounded-xl border-slate-200/90 px-3.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300"
            >
              <RotateCw className={cn('mr-2 size-4', refreshing && 'animate-spin text-[#16A34A]')} />
              <span>Refresh</span>
            </Button>
          </div>
        </div>

        {/* Filter Controls Row (Expanded on desktop, collapsible on mobile/tablet) */}
        <div
          className={cn(
            'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-2 border-t border-slate-100',
            filtersExpanded ? 'grid' : 'hidden md:grid'
          )}
        >
          {/* Module Selector */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Module
            </label>
            <select
              value={selectedModule}
              onChange={(e) => {
                setSelectedModule(e.target.value);
                setPage(1);
              }}
              className="h-9 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            >
              <option value="">All Modules</option>
              {moduleOptions.map((mod) => (
                <option key={mod} value={mod}>
                  {mod}
                </option>
              ))}
            </select>
          </div>

          {/* Action Selector */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Action
            </label>
            <select
              value={selectedAction}
              onChange={(e) => {
                setSelectedAction(e.target.value);
                setPage(1);
              }}
              className="h-9 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            >
              <option value="">All Actions</option>
              {actionOptions.map((act) => (
                <option key={act} value={act}>
                  {act}
                </option>
              ))}
            </select>
          </div>

          {/* User / Actor Selector */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
              User
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => {
                setSelectedUserId(e.target.value);
                setPage(1);
              }}
              className="h-9 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            >
              <option value="">All Users</option>
              {employees.map((emp) => {
                const displayName =
                  emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.email;
                return (
                  <option key={emp.id} value={emp.id}>
                    {displayName}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Status Selector */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              className="h-9 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            >
              <option value="">All Statuses</option>
              <option value="SUCCESS">Success</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="h-9 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="h-9 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            />
          </div>
        </div>
      </div>

      {/* 4. Activities Table Section */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        {/* Error State */}
        {error && (
          <div className="p-8 text-center space-y-3">
            <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 mb-1">
              <AlertTriangle className="size-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Failed to Load Activities</h3>
            <p className="max-w-md mx-auto text-xs sm:text-sm text-slate-500">{error}</p>
            <Button
              onClick={() => fetchData()}
              className="bg-[#16A34A] hover:bg-[#15803D] text-white rounded-xl text-xs font-semibold px-4 py-2"
            >
              <RotateCw className="mr-2 size-3.5" />
              Try Again
            </Button>
          </div>
        )}

        {/* Loading State */}
        {!error && loading && (
          <div className="p-6 space-y-4">
            <div className="h-10 w-full bg-slate-100 rounded-xl animate-pulse" />
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-3 border-b border-slate-100 last:border-0">
                <div className="size-8 rounded-full bg-slate-100 animate-pulse shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/3 bg-slate-100 rounded animate-pulse" />
                  <div className="h-3 w-1/2 bg-slate-50 rounded animate-pulse" />
                </div>
                <div className="h-6 w-16 bg-slate-100 rounded animate-pulse shrink-0" />
                <div className="h-6 w-20 bg-slate-100 rounded animate-pulse shrink-0" />
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!error && !loading && activities.length === 0 && (
          <div className="p-12 text-center space-y-3">
            <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-emerald-50 text-[#16A34A] border border-emerald-100 mb-1">
              <Activity className="size-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No Activities Found</h3>
            <p className="max-w-md mx-auto text-xs sm:text-sm text-slate-500">
              {hasActiveFilters
                ? 'No activity logs match your current filter criteria. Try adjusting or clearing your filters.'
                : 'There are no audit-log activity records found in the system.'}
            </p>
            {hasActiveFilters && (
              <Button
                variant="outline"
                onClick={handleClearFilters}
                className="rounded-xl border-slate-200 text-xs font-semibold mt-2"
              >
                Clear All Filters
              </Button>
            )}
          </div>
        )}

        {/* Desktop & Tablet Table View (hidden on mobile, visible on md+) */}
        {!error && !loading && activities.length > 0 && (
          <div className="hidden md:block w-full overflow-x-auto min-w-0">
            <table className="w-full text-left border-collapse min-w-[760px]">
              <thead>
                <tr className="border-b border-slate-200 bg-[#F8FBF9] text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  <th className="py-3 px-4 sm:px-5">When</th>
                  <th className="py-3 px-4">Module</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {activities.map((row) => {
                  const ModuleIcon = getModuleIcon(row.module);
                  const dateStr = formatDisplayDate(row.createdAt || row.timestamp);
                  const timeStr = formatDisplayTime(row.createdAt || row.timestamp);
                  const relTime = formatRelativeTime(row.createdAt || row.timestamp);

                  return (
                    <tr
                      key={row.id}
                      onClick={() => handleOpenDetail(row)}
                      className="group cursor-pointer hover:bg-[#F8FBF9] transition-colors"
                    >
                      {/* When */}
                      <td className="py-3.5 px-4 sm:px-5 whitespace-nowrap">
                        <div className="font-semibold text-slate-900">{dateStr}</div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                          <Clock className="size-3 text-slate-400" />
                          <span>{timeStr}</span>
                          {relTime && <span className="text-slate-400">({relTime})</span>}
                        </div>
                      </td>

                      {/* Module */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200/80 bg-slate-50 font-medium text-slate-700">
                          <ModuleIcon className="size-3.5 text-slate-500" />
                          <span>{row.module || '—'}</span>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <ActionBadge action={row.action} />
                      </td>

                      {/* User */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={cn(
                              'flex size-8 items-center justify-center rounded-full bg-linear-to-br text-white font-bold text-[11px] shadow-2xs shrink-0',
                              getAvatarGradient(row.userName)
                            )}
                          >
                            {getInitials(row.userName)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-900 truncate max-w-[150px]">
                              {row.userName || 'System'}
                            </div>
                            <div className="text-[10px] text-slate-500 uppercase tracking-tight">
                              {row.role || row.source || 'Admin'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Description */}
                      <td className="py-3.5 px-4 max-w-[280px]">
                        <div className="truncate text-slate-800 font-medium" title={row.description}>
                          {row.description || '—'}
                        </div>
                        {row.entityId && (
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">
                            {row.entityType ? `${row.entityType} ` : ''}#{row.entityId}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <StatusBadgeComponent status={row.status} />
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDetail(row);
                          }}
                          className="size-8 p-0 rounded-lg text-slate-400 group-hover:text-slate-700 hover:bg-slate-200/60"
                          title="View Details"
                        >
                          <Eye className="size-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Mobile Responsive Cards View (visible on mobile, hidden on md+) */}
        {!error && !loading && activities.length > 0 && (
          <div className="block md:hidden divide-y divide-slate-100">
            {activities.map((row) => {
              const ModuleIcon = getModuleIcon(row.module);
              const dateStr = formatDisplayDate(row.createdAt || row.timestamp);
              const timeStr = formatDisplayTime(row.createdAt || row.timestamp);
              const relTime = formatRelativeTime(row.createdAt || row.timestamp);

              return (
                <div
                  key={row.id}
                  onClick={() => handleOpenDetail(row)}
                  className="p-4 space-y-3 hover:bg-slate-50/80 active:bg-slate-100 transition-colors cursor-pointer"
                >
                  {/* Top Bar: Module, Action, Status */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-slate-200 bg-slate-50 text-[11px] font-medium text-slate-700">
                        <ModuleIcon className="size-3 text-slate-500" />
                        <span>{row.module || 'System'}</span>
                      </div>
                      <ActionBadge action={row.action} />
                    </div>
                    <StatusBadgeComponent status={row.status} />
                  </div>

                  {/* Actor & Description */}
                  <div className="flex items-start gap-2.5">
                    <div
                      className={cn(
                        'flex size-8 items-center justify-center rounded-full bg-linear-to-br text-white font-bold text-[11px] shadow-2xs shrink-0 mt-0.5',
                        getAvatarGradient(row.userName)
                      )}
                    >
                      {getInitials(row.userName)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-900 text-xs">
                          {row.userName || 'System'}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          ({row.role || row.source || 'Admin'})
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 mt-1 line-clamp-2 leading-relaxed">
                        {row.description || '—'}
                      </p>
                      {row.entityId && (
                        <span className="inline-block font-mono text-[10px] text-slate-500 mt-1">
                          {row.entityType ? `${row.entityType} ` : ''}#{row.entityId}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Footer: Date & Details Button */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100/80 text-[11px] text-slate-500">
                    <div className="flex items-center gap-1">
                      <Clock className="size-3 text-slate-400" />
                      <span>{dateStr} {timeStr}</span>
                      {relTime && <span className="text-slate-400">({relTime})</span>}
                    </div>
                    <span className="text-xs font-semibold text-[#16A34A] flex items-center gap-1">
                      View <ChevronRight className="size-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 6. Pagination Footer */}
        {!error && activities.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 px-4 sm:px-6 py-3.5 bg-slate-50/50">
            {/* Range Text */}
            <div className="text-xs text-slate-600 order-2 sm:order-1 text-center sm:text-left">
              Showing <span className="font-semibold text-slate-900">{startRecord}</span> to{' '}
              <span className="font-semibold text-slate-900">{endRecord}</span> of{' '}
              <span className="font-semibold text-slate-900">{pagination.total.toLocaleString()}</span> activities
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3 order-1 sm:order-2">
              {/* Rows per page selector */}
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="hidden min-[480px]:inline">Rows:</span>
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                  className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700 outline-none focus:border-emerald-400"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              {/* Prev / Next Buttons */}
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="h-8 rounded-lg border-slate-200 px-2.5 text-xs font-medium"
                >
                  <ChevronLeft className="size-3.5 mr-1" />
                  Prev
                </Button>
                <div className="px-2 text-xs font-semibold text-slate-700">
                  {page} / {Math.max(1, pagination.totalPages)}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  className="h-8 rounded-lg border-slate-200 px-2.5 text-xs font-medium"
                >
                  Next
                  <ChevronRight className="size-3.5 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 5. Slide-over Activity Detail Drawer */}
      <ActivityDetailDrawer
        activity={selectedActivity}
        open={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
      />
    </div>
  );
}
