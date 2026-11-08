'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  Smartphone,
  Monitor,
  Shield,
  Search,
  Filter,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Eye,
  Calendar,
  AlertTriangle,
  Globe,
  Layers,
  Copy,
  Check,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import api from '@/lib/api';
import {
  AdminPageHeader,
  AdminButton,
  AdminPagination,
  AdminStatCard,
  AdminFormDrawer,
} from '@/components/admin';

export interface ActivityLogItem {
  id: number;
  timestamp: string;
  createdAt: string;
  userId: number | null;
  userName: string;
  userEmail: string | null;
  role: string;
  userRole: string;
  source: 'ADMIN_PANEL' | 'MOBILE_APP' | string;
  module: string;
  action: string;
  description: string;
  entityType: string | null;
  entityId: string | null;
  endpoint: string | null;
  method: string | null;
  ipAddress: string;
  device: string | null;
  status: 'SUCCESS' | 'FAILED' | string;
  errorMessage: string | null;
  details: any;
  customerId: number | null;
  companyName: string | null;
}

export default function ActivityLogsPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Filters State
  const [search, setSearch] = useState('');
  const [selectedSource, setSelectedSource] = useState<'ALL' | 'ADMIN_PANEL' | 'MOBILE_APP'>('ALL');
  const [selectedRole, setSelectedRole] = useState<'ALL' | 'CUSTOMER' | 'EMPLOYEE' | 'ADMIN' | 'SUPER_ADMIN'>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'SUCCESS' | 'FAILED'>('ALL');
  const [selectedModule, setSelectedModule] = useState<string>('ALL');
  const [selectedAction, setSelectedAction] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Selected Log Drawer
  const [selectedLog, setSelectedLog] = useState<ActivityLogItem | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Fetch Stats & Filter Options
  const { data: statsData, refetch: refetchStats } = useQuery({
    queryKey: ['admin-activity-logs-stats'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/audit-logs/stats');
        return res?.data?.data || res?.data || {
          total: 0,
          adminCount: 0,
          mobileCount: 0,
          successCount: 0,
          failedCount: 0,
          modules: [],
          actions: [],
        };
      } catch {
        return {
          total: 0,
          adminCount: 0,
          mobileCount: 0,
          successCount: 0,
          failedCount: 0,
          modules: [],
          actions: [],
        };
      }
    },
  });

  // Fetch Filtered Logs
  const { data: logsResponse, isLoading, refetch, isFetching } = useQuery({
    queryKey: [
      'admin-activity-logs',
      page,
      pageSize,
      search,
      selectedSource,
      selectedRole,
      selectedStatus,
      selectedModule,
      selectedAction,
      startDate,
      endDate,
    ],
    queryFn: async () => {
      const params: Record<string, any> = {
        page,
        limit: pageSize,
      };

      if (search.trim()) params.search = search.trim();
      if (selectedSource !== 'ALL') params.source = selectedSource;
      if (selectedRole !== 'ALL') params.role = selectedRole;
      if (selectedStatus !== 'ALL') params.status = selectedStatus;
      if (selectedModule !== 'ALL') params.module = selectedModule;
      if (selectedAction !== 'ALL') params.action = selectedAction;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res: any = await api.get('/audit-logs', { params });
      const items = res?.data?.items || res?.data?.data || res?.items || res?.data || [];
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
          total: Number(pagination.total) || 0,
          totalPages: Number(pagination.totalPages) || 1,
        },
      };
    },
  });

  const logs: ActivityLogItem[] = logsResponse?.items || [];
  const pagination = logsResponse?.pagination || { page: 1, pageSize: 20, total: 0, totalPages: 1 };

  const handleResetFilters = () => {
    setSearch('');
    setSelectedSource('ALL');
    setSelectedRole('ALL');
    setSelectedStatus('ALL');
    setSelectedModule('ALL');
    setSelectedAction('ALL');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const handleCopyJson = (obj: any) => {
    try {
      navigator.clipboard.writeText(JSON.stringify(obj, null, 2));
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (_) {}
  };

  const getRoleBadge = (role: string) => {
    const norm = (role || '').toUpperCase();
    if (norm === 'SUPER_ADMIN') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-50 text-purple-700 border border-purple-200">
          <Shield className="w-2.5 h-2.5" />
          Super Admin
        </span>
      );
    }
    if (norm.includes('ADMIN')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
          <Shield className="w-2.5 h-2.5" />
          Admin
        </span>
      );
    }
    if (norm === 'EMPLOYEE') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <User className="w-2.5 h-2.5" />
          Employee
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
        <User className="w-2.5 h-2.5" />
        Customer
      </span>
    );
  };

  const getSourceBadge = (source: string) => {
    const norm = (source || '').toUpperCase();
    if (norm === 'MOBILE_APP') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
          <Smartphone className="w-3 h-3 text-indigo-600" />
          Mobile App
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
        <Monitor className="w-3 h-3 text-slate-500" />
        Admin Panel
      </span>
    );
  };

  const getActionBadge = (action: string) => {
    const act = (action || '').toUpperCase();
    let bg = 'bg-slate-100 text-slate-700 border-slate-200';
    if (['CREATE', 'SUBMIT', 'REGISTER'].includes(act)) {
      bg = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    } else if (['UPDATE', 'EDIT', 'CHANGE'].includes(act)) {
      bg = 'bg-blue-50 text-blue-700 border-blue-200';
    } else if (['DELETE', 'REMOVE', 'REJECT', 'CANCEL'].includes(act)) {
      bg = 'bg-rose-50 text-rose-700 border-rose-200';
    } else if (['APPROVE', 'VERIFY'].includes(act)) {
      bg = 'bg-teal-50 text-teal-700 border-teal-200';
    } else if (['LOGIN', 'LOGOUT'].includes(act)) {
      bg = 'bg-purple-50 text-purple-700 border-purple-200';
    } else if (['CHECK_IN', 'CHECK_OUT'].includes(act)) {
      bg = 'bg-cyan-50 text-cyan-700 border-cyan-200';
    }

    return (
      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold border font-mono tracking-wider ${bg}`}>
        {act}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const isSuccess = (status || '').toUpperCase() === 'SUCCESS';
    if (isSuccess) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          Success
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
        <XCircle className="w-3 h-3 text-rose-600" />
        Failed
      </span>
    );
  };

  const formatDate = (iso: string) => {
    if (!iso) return '—';
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return iso;
      return d.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  // Module filter options
  const defaultModules = [
    'Attendance',
    'Leave',
    'Remote Work',
    'Influencers',
    'CRM',
    'HRM',
    'Payroll',
    'Settings',
    'Billing',
    'Authentication',
  ];
  const allModules = Array.from(new Set([...(statsData?.modules || []), ...defaultModules]));

  // Action filter options
  const defaultActions = [
    'LOGIN',
    'LOGOUT',
    'CREATE',
    'UPDATE',
    'DELETE',
    'APPROVE',
    'REJECT',
    'SUBMIT',
    'CHECK_IN',
    'CHECK_OUT',
  ];
  const allActions = Array.from(new Set([...(statsData?.actions || []), ...defaultActions]));

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-16 text-slate-800 animate-in fade-in-50 duration-200">
      {/* 1. STANDARD PAGE HEADER */}
      <AdminPageHeader
        badge={{
          text: 'CENTRALIZED ACTIVITY LOGS',
          icon: Activity,
          variant: 'indigo',
        }}
        title="Activity Logs"
        description="Single centralized view of all actions performed from Customer Mobile App, Employee Mobile App, and Admin Panel."
        icon={Activity}
        iconColor="text-indigo-600"
        breadcrumbs={[
          { label: 'Settings', href: '/settings' },
          { label: 'Activity Logs' },
        ]}
        actions={
          <AdminButton
            variant="outline"
            size="md"
            icon={RefreshCw}
            loading={isFetching}
            onClick={() => {
              refetch();
              refetchStats();
            }}
          >
            Refresh
          </AdminButton>
        }
      />

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <AdminStatCard
          title="Total Activity Events"
          value={statsData?.total ?? pagination.total}
          description="All captured platform logs"
          icon={Layers}
          iconBg="primary"
        />
        <AdminStatCard
          title="Admin Panel Actions"
          value={statsData?.adminCount ?? 0}
          description="Administrative management"
          icon={Monitor}
          iconBg="blue"
        />
        <AdminStatCard
          title="Mobile App Actions"
          value={statsData?.mobileCount ?? 0}
          description="Customer & Employee apps"
          icon={Smartphone}
          iconBg="purple"
        />
        <AdminStatCard
          title="Failed Events"
          value={statsData?.failedCount ?? 0}
          description="Exceptions & validation errors"
          icon={AlertTriangle}
          iconBg="rose"
        />
      </div>

      {/* Main Table Container with Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Source Segmented Tabs */}
        <div className="px-6 pt-5 pb-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <div className="inline-flex p-1 bg-slate-100/90 rounded-xl text-xs font-semibold text-slate-600">
            <button
              onClick={() => {
                setSelectedSource('ALL');
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedSource === 'ALL'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'hover:text-slate-900'
              }`}
            >
              All Logs
            </button>
            <button
              onClick={() => {
                setSelectedSource('ADMIN_PANEL');
                setPage(1);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                selectedSource === 'ADMIN_PANEL'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'hover:text-slate-900'
              }`}
            >
              <Monitor className="w-3.5 h-3.5 text-slate-500" />
              Admin Panel
            </button>
            <button
              onClick={() => {
                setSelectedSource('MOBILE_APP');
                setPage(1);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                selectedSource === 'MOBILE_APP'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'hover:text-slate-900'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 text-indigo-500" />
              Mobile App
            </button>
          </div>

          {/* Quick Active Filter Count & Clear */}
          {(search ||
            selectedSource !== 'ALL' ||
            selectedRole !== 'ALL' ||
            selectedStatus !== 'ALL' ||
            selectedModule !== 'ALL' ||
            selectedAction !== 'ALL' ||
            startDate ||
            endDate) && (
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 font-semibold transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Reset All Filters
            </button>
          )}
        </div>

        {/* Detailed Filter Grid */}
        <div className="p-4 bg-slate-50/60 border-b border-slate-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3 text-xs">
          {/* Search Input */}
          <div className="lg:col-span-2 relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search user, action, module, IP..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* User Role Filter */}
          <div>
            <select
              value={selectedRole}
              onChange={(e) => {
                setSelectedRole(e.target.value as any);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium"
            >
              <option value="ALL">All Roles</option>
              <option value="CUSTOMER">Customer</option>
              <option value="EMPLOYEE">Employee</option>
              <option value="ADMIN">Admin</option>
              <option value="SUPER_ADMIN">Super Admin</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value as any);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium"
            >
              <option value="ALL">All Status</option>
              <option value="SUCCESS">Success Only</option>
              <option value="FAILED">Failed Only</option>
            </select>
          </div>

          {/* Module Filter */}
          <div>
            <select
              value={selectedModule}
              onChange={(e) => {
                setSelectedModule(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium"
            >
              <option value="ALL">All Modules</option>
              {allModules.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Action Filter */}
          <div>
            <select
              value={selectedAction}
              onChange={(e) => {
                setSelectedAction(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium"
            >
              <option value="ALL">All Actions</option>
              {allActions.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Picker */}
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              title="From Date"
              className="w-full px-2 py-2 bg-white border border-slate-200 rounded-xl text-[11px] focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            <span className="text-slate-400 text-xs">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              title="To Date"
              className="w-full px-2 py-2 bg-white border border-slate-200 rounded-xl text-[11px] focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1050px]">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Source</th>
                <th className="py-3.5 px-4">Module</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Description</th>
                <th className="py-3.5 px-4">Target Entity</th>
                <th className="py-3.5 px-4">IP Address</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={11} className="py-16 text-center text-slate-400">
                    <div className="inline-flex items-center gap-2 font-semibold">
                      <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
                      Loading activity logs...
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto text-slate-500">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                        <Activity className="w-6 h-6" />
                      </div>
                      <p className="font-bold text-slate-800 text-sm">No activity logs found</p>
                      <p className="text-xs text-slate-400 text-center">
                        {search || selectedSource !== 'ALL' || selectedRole !== 'ALL'
                          ? 'No logs matched the selected filters. Try broadening your filter parameters.'
                          : 'As actions are performed across Mobile Apps and Admin Panel, they will appear here in real time.'}
                      </p>
                      {(search || selectedSource !== 'ALL' || selectedRole !== 'ALL') && (
                        <button
                          onClick={handleResetFilters}
                          className="mt-2 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-semibold hover:bg-indigo-100"
                        >
                          Clear Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                  >
                    {/* Timestamp */}
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                      {formatDate(log.timestamp || log.createdAt)}
                    </td>

                    {/* User */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {log.userName || 'System'}
                      </div>
                      {log.userEmail && (
                        <div className="text-[10px] text-slate-400 truncate max-w-[140px]">
                          {log.userEmail}
                        </div>
                      )}
                    </td>

                    {/* Role */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getRoleBadge(log.role || log.userRole)}
                    </td>

                    {/* Source */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getSourceBadge(log.source)}
                    </td>

                    {/* Module */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[11px] font-semibold">
                        {log.module}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getActionBadge(log.action)}
                    </td>

                    {/* Description */}
                    <td className="py-3.5 px-4 max-w-[240px]">
                      <p className="truncate text-slate-700 font-medium" title={log.description}>
                        {log.description}
                      </p>
                    </td>

                    {/* Entity */}
                    <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                      {log.entityType ? (
                        <span className="font-medium text-slate-800">
                          {log.entityType} {log.entityId ? `#${log.entityId}` : ''}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    {/* IP Address */}
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {log.ipAddress || '—'}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getStatusBadge(log.status)}
                    </td>

                    {/* Action button */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLog(log);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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

      {/* Log Details Drawer */}
      <AdminFormDrawer
        isOpen={Boolean(selectedLog)}
        onClose={() => setSelectedLog(null)}
        title="Activity Log Details"
        subtitle={selectedLog ? `Event ID #${selectedLog.id} • ${formatDate(selectedLog.timestamp)}` : ''}
        size="lg"
        hideFooter={true}
      >
        {selectedLog && (
          <div className="space-y-6 text-xs text-slate-700">
            {/* Summary Banner */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900">
                    {selectedLog.description}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {getStatusBadge(selectedLog.status)}
                  {getSourceBadge(selectedLog.source)}
                  {getRoleBadge(selectedLog.role || selectedLog.userRole)}
                  <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px] font-mono">
                    {selectedLog.module} • {selectedLog.action}
                  </span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[10px] text-slate-400 font-mono block">LOG ID</span>
                <span className="font-mono font-bold text-slate-800 text-sm">#{selectedLog.id}</span>
              </div>
            </div>

            {/* Error Banner if Failed */}
            {selectedLog.status === 'FAILED' && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-rose-900">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  Failure Reason
                </div>
                <p className="text-xs text-rose-700 pl-5">
                  {selectedLog.errorMessage || 'Action execution resulted in an error'}
                </p>
              </div>
            )}

            {/* User & Actor Info */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider">
                User / Actor Identity
              </h4>
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">NAME / ACTOR</span>
                  <p className="font-bold text-slate-800 text-xs mt-0.5">{selectedLog.userName || '—'}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">EMAIL</span>
                  <p className="font-medium text-slate-800 text-xs mt-0.5">{selectedLog.userEmail || '—'}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">USER ID</span>
                  <p className="font-mono text-slate-800 text-xs mt-0.5">
                    {selectedLog.userId ? `#${selectedLog.userId}` : '—'}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">TENANT / CUSTOMER</span>
                  <p className="font-medium text-slate-800 text-xs mt-0.5">
                    {selectedLog.companyName || (selectedLog.customerId ? `Customer #${selectedLog.customerId}` : 'Global')}
                  </p>
                </div>
              </div>
            </div>

            {/* Request & Network Info */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider">
                Request & Client Metadata
              </h4>
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">HTTP METHOD & ENDPOINT</span>
                  <p className="font-mono text-xs text-indigo-700 mt-0.5 break-all">
                    <span className="font-bold">{selectedLog.method || 'POST'}</span> {selectedLog.endpoint || '—'}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">IP ADDRESS</span>
                  <p className="font-mono text-xs text-slate-800 mt-0.5">{selectedLog.ipAddress || '—'}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">TARGET ENTITY</span>
                  <p className="font-medium text-slate-800 text-xs mt-0.5">
                    {selectedLog.entityType ? `${selectedLog.entityType} ${selectedLog.entityId ? `(#${selectedLog.entityId})` : ''}` : '—'}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">DEVICE / USER-AGENT</span>
                  <p className="font-medium text-slate-700 text-xs mt-0.5 truncate" title={selectedLog.device || ''}>
                    {selectedLog.device || (selectedLog.source === 'MOBILE_APP' ? 'Mobile Client' : 'Web Browser')}
                  </p>
                </div>
              </div>
            </div>

            {/* Sanitized Payload Metadata */}
            {selectedLog.details && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider">
                    Sanitized Payload Metadata
                  </h4>
                  <button
                    onClick={() => handleCopyJson(selectedLog.details)}
                    className="inline-flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-700 font-semibold"
                  >
                    {isCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    {isCopied ? 'Copied' : 'Copy JSON'}
                  </button>
                </div>
                <div className="rounded-xl bg-slate-900 text-slate-100 p-3.5 font-mono text-[11px] overflow-x-auto max-h-60 border border-slate-800">
                  <pre>{JSON.stringify(selectedLog.details, null, 2)}</pre>
                </div>
                <p className="text-[10px] text-slate-400 italic">
                  * Passwords, authorization tokens, secrets, and OTPs are automatically redacted.
                </p>
              </div>
            )}
          </div>
        )}
      </AdminFormDrawer>
    </div>
  );
}
