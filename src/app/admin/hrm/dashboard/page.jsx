'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, RotateCw, Filter, Radio } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { hrmError, loadLiveDashboard, loadReportSummary } from '@/modules/hrm/hrm-api';
import { HrmNotice } from '@/modules/hrm/HrmNotice';
import { resolvePresetRange } from '@/components/dashboard/GlobalDashboardFilters';
import api from '../../../../../lib/api';

import { HrmKpiGrid } from '@/modules/hrm/components/dashboard/HrmKpiGrid';
import { HrmDepartmentCard } from '@/modules/hrm/components/dashboard/HrmDepartmentCard';
import { HrmAttendanceCard } from '@/modules/hrm/components/dashboard/HrmAttendanceCard';
import { HrmBirthdaysCard } from '@/modules/hrm/components/dashboard/HrmBirthdaysCard';
import { HrmOnLeaveCard } from '@/modules/hrm/components/dashboard/HrmOnLeaveCard';
import { HrmRemoteWorkCard } from '@/modules/hrm/components/dashboard/HrmRemoteWorkCard';
import { HrmRecentActivitiesCard } from '@/modules/hrm/components/dashboard/HrmRecentActivitiesCard';
import { HrmQuickActions } from '@/modules/hrm/components/dashboard/HrmQuickActions';

const AUTO_REFRESH_INTERVAL_MS = 30000; // 30 seconds

export default function HrmDashboardPage() {
  const router = useRouter();

  // Filters State
  const [dateFilter, setDateFilter] = React.useState('today'); // 'today' | 'week' | 'month' | 'custom'
  const [customDate, setCustomDate] = React.useState(
    () => new Date().toISOString().split('T')[0]
  );
  const [attendancePeriod, setAttendancePeriod] = React.useState('today');

  // Data & Status State
  const [dashboardData, setDashboardData] = React.useState(null);
  const [reports, setReports] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [error, setError] = React.useState('');
  const [lastUpdated, setLastUpdated] = React.useState(null);
  const [isTabActive, setIsTabActive] = React.useState(true);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = React.useState(true);

  // Active fetch abort tracking
  const activeControllerRef = React.useRef(null);

  // Listen to visibilitychange to avoid background polling when tab is inactive
  React.useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabActive(!document.hidden);
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Compute effective query date and period from filters
  const { fromDate, toDate } = React.useMemo(() => {
    if (dateFilter === 'custom') return { fromDate: customDate, toDate: customDate };
    return resolvePresetRange({ today: 'today', week: 'this_week', month: 'this_month' }[dateFilter] || 'today');
  }, [dateFilter, customDate]);

  // Main data fetcher
  const fetchData = React.useCallback(
    async (isBackground = false) => {
      if (activeControllerRef.current) {
        activeControllerRef.current.abort();
      }
      const controller = new AbortController();
      activeControllerRef.current = controller;

      if (!isBackground) {
        setLoading((prev) => (dashboardData ? false : true));
      }
      setIsRefreshing(true);
      setError('');

      try {
        const filterParams = {
          date: toDate || undefined,
          fromDate: fromDate || undefined,
          toDate: toDate || undefined,
          period: attendancePeriod || undefined,
        };
        const [liveRes, reportRes] = await Promise.allSettled([
          api.get('/admin/hrms/live-dashboard', { params: filterParams }).then((r) => r?.data || r),
          loadReportSummary({ dateFrom: fromDate, dateTo: toDate }),
        ]);

        if (controller.signal.aborted) return;

        if (liveRes.status === 'fulfilled') {
          setDashboardData(liveRes.value);
          setLastUpdated(new Date());
        } else {
          setError(hrmError(liveRes.reason));
        }

        if (reportRes.status === 'fulfilled') {
          setReports(reportRes.value);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(hrmError(err));
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [fromDate, toDate, attendancePeriod, dashboardData]
  );

  // Initial and on-filter-change fetch
  React.useEffect(() => {
    fetchData(false);
    return () => {
      if (activeControllerRef.current) {
        activeControllerRef.current.abort();
      }
    };
  }, [fromDate, toDate, attendancePeriod]);

  // Periodic Auto-refresh (30s)
  React.useEffect(() => {
    if (!autoRefreshEnabled || !isTabActive) return;

    const timer = setInterval(() => {
      fetchData(true);
    }, AUTO_REFRESH_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [autoRefreshEnabled, isTabActive, fetchData]);

  // Format last updated text
  const lastUpdatedDisplay = React.useMemo(() => {
    if (!lastUpdated) return 'Syncing...';
    const hours = String(lastUpdated.getHours()).padStart(2, '0');
    const mins = String(lastUpdated.getMinutes()).padStart(2, '0');
    const secs = String(lastUpdated.getSeconds()).padStart(2, '0');
    return `${hours}:${mins}:${secs}`;
  }, [lastUpdated]);

  // Merged summary data (live dashboard + report fallback if needed)
  const summary = React.useMemo(() => {
    const live = dashboardData?.summary || {};
    return {
      ...live,
      totalEmployees: live.totalEmployees ?? reports?.workforce?.total ?? 0,
      payrollNet: live.payrollNet ?? reports?.payroll?.netDisbursed ?? 0,
    };
  }, [dashboardData, reports]);

  return (
    <div className="max-w-none min-w-0 w-full space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Quik HRM Operations Dashboard"
        description="Real-time analytics for workforce, live attendance, department distribution, leave, and payroll."
        badge={
          <Badge className="border-brand-light bg-brand-light px-2.5 py-0.5 text-xs font-semibold text-brand-dark flex items-center gap-1.5">
            <Radio className="size-3 text-emerald-600 animate-pulse" />
            Live Analytics
          </Badge>
        }
      />

      {/* Global Filter & Operational Controls Bar */}
      <section className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:flex-row sm:items-center sm:justify-between shadow-xs">
        {/* Date Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wide mr-1">
            <Filter className="size-3.5 text-slate-400" />
            Period:
          </span>

          {[
            { id: 'today', label: 'Today' },
            { id: 'week', label: 'This Week' },
            { id: 'month', label: 'This Month' },
            { id: 'custom', label: 'Custom' },
          ].map((tab) => {
            const active = dateFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setDateFilter(tab.id)}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                  active
                    ? 'bg-[#163A2E] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                }`}
              >
                {tab.label}
              </button>
            );
          })}

          {/* Custom Date Input */}
          {dateFilter === 'custom' && (
            <div className="flex items-center gap-1.5 ml-1">
              <Calendar className="size-3.5 text-slate-400" />
              <input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 shadow-2xs focus:border-emerald-600 focus:outline-none"
              />
            </div>
          )}
        </div>

        {/* Refresh & Last Sync Status */}
        <div className="flex flex-wrap items-center gap-3 self-end sm:self-auto">
          {/* Auto-Refresh Toggle Pill */}
          <button
            type="button"
            onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all ${
              autoRefreshEnabled
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/80'
                : 'bg-slate-100 text-slate-500 border border-slate-200'
            }`}
            title="Toggle 30-second background auto-refresh"
          >
            <span
              className={`size-1.5 rounded-full ${
                autoRefreshEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
              }`}
            />
            Auto-sync: {autoRefreshEnabled ? '30s' : 'Off'}
          </button>

          {/* Last Updated Timestamp */}
          <span className="text-[11px] font-medium text-slate-400">
            Updated: <span className="font-semibold text-slate-600">{lastUpdatedDisplay}</span>
          </span>

          {/* Manual Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            disabled={isRefreshing}
            onClick={() => fetchData(false)}
            className="h-8 gap-1.5 rounded-xl border-slate-200 text-xs font-bold text-slate-700 hover:border-emerald-950/20 hover:bg-emerald-50/50 hover:text-[#163A2E]"
          >
            <RotateCw
              className={`size-3.5 transition-transform duration-700 ${
                isRefreshing ? 'animate-spin text-emerald-700' : ''
              }`}
            />
            {isRefreshing ? 'Refreshing' : 'Refresh'}
          </Button>
        </div>
      </section>

      {/* Error & Warning Notice */}
      <HrmNotice error={error} onRetry={() => fetchData(false)} />

      {/* 1. 8 KPI Cards Grid */}
      <section aria-label="Key Performance Indicators">
        <HrmKpiGrid
          summary={summary}
          periodLabel={dateFilter === 'today' ? 'Today' : '(latest in period)'}
          loading={loading && !dashboardData}
          onNavigate={(path) => router.push(path)}
        />
      </section>

      {/* 2. Quick Actions Bar */}
      <section aria-label="HRM Quick Actions">
        <HrmQuickActions />
      </section>

      {/* 3. Interactive Donut Charts: Department Distribution & Attendance Overview */}
      <section aria-label="Interactive Operational Charts" className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Department Distribution Donut Card */}
        <HrmDepartmentCard
          departments={dashboardData?.departments || []}
          totalEmployees={summary.totalEmployees}
          loading={loading && !dashboardData}
        />

        {/* Attendance Overview Donut Card with Today/Week/Month toggles */}
        <HrmAttendanceCard
          summary={summary}
          periodAttendance={dashboardData?.periodAttendance}
          selectedPeriod={attendancePeriod}
          onPeriodChange={(p) => setAttendancePeriod(p)}
          loading={loading && !dashboardData}
        />
      </section>

      {/* 4. Three Operational Insight Cards: Today's Birthdays, On Leave Today, Remote Work */}
      <section aria-label="Operational Insights" className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Today's Employee Birthdays */}
        <HrmBirthdaysCard
          birthdays={dashboardData?.birthdays || []}
          loading={loading && !dashboardData}
        />

        {/* On Leave Today */}
        <HrmOnLeaveCard
          leaves={dashboardData?.onLeaveToday || []}
          loading={loading && !dashboardData}
        />

        {/* Remote Work Today */}
        <HrmRemoteWorkCard
          remoteWorkers={dashboardData?.remoteToday || []}
          totalEmployees={summary.totalEmployees}
          loading={loading && !dashboardData}
        />
      </section>

      {/* 5. Recent HR Activities Timeline */}
      <section aria-label="Recent Activities">
        <HrmRecentActivitiesCard
          activities={dashboardData?.recentActivities || []}
          loading={loading && !dashboardData}
        />
      </section>
    </div>
  );
}
