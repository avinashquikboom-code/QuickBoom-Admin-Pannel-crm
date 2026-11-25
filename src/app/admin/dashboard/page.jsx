'use client';

import * as React from 'react';
import api from '../../../../lib/api';
import { rowsOf, suiteError } from '@/modules/suite/suite-api';
import { HrmNotice } from '@/modules/hrm/HrmNotice';

// Dashboard Components
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { GlobalDashboardFilters, resolvePresetRange } from '@/components/dashboard/GlobalDashboardFilters';
import { KpiCards } from '@/components/dashboard/KpiCards';
import { LeadsOverviewCard } from '@/components/dashboard/LeadsOverviewCard';
import { LeadsBySourceCard } from '@/components/dashboard/LeadsBySourceCard';
import { UpcomingActivitiesCard } from '@/components/dashboard/UpcomingActivitiesCard';
import { RevenueChartCard } from '@/components/dashboard/RevenueChartCard';
import { LeadsByStageCard } from '@/components/dashboard/LeadsByStageCard';
import { AttendanceCard } from '@/components/dashboard/AttendanceCard';
import { TasksOverviewCard } from '@/components/dashboard/TasksOverviewCard';
import { PayrollSummaryCard } from '@/components/dashboard/PayrollSummaryCard';
import { RecentLeadsCard } from '@/components/dashboard/RecentLeadsCard';
import { RecentActivityCard } from '@/components/dashboard/RecentActivityCard';
import { QuickActionsCard } from '@/components/dashboard/QuickActionsCard';
import { DataCaptureCard } from '@/components/dashboard/DataCaptureCard';
import { WhatsAppCampaignCard } from '@/components/dashboard/WhatsAppCampaignCard';
import { EmailCampaignCard } from '@/components/dashboard/EmailCampaignCard';
import { loadCaptures, loadCaptureUsage, loadCaptureSessions } from '@/modules/data-capture/capture-api';

function objectOf(payload) {
  if (!payload || typeof payload !== 'object') return {};
  if (payload.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) {
    return payload.data.summary && payload.data.workforce == null && payload.data.present == null
      ? payload.data
      : payload.data;
  }
  return payload;
}

export default function AdminDashboardPage() {
  const [filters, setFilters] = React.useState(() => ({
    preset: 'this_month',
    ...resolvePresetRange('this_month'),
    departmentId: '',
    employeeId: '',
    branchId: '',
  }));
  const dateFrom = filters.fromDate || '';
  const dateTo = filters.toDate || '';
  const [data, setData] = React.useState(null);
  const [failed, setFailed] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshCount, setRefreshCount] = React.useState(0);
  const [captureData, setCaptureData] = React.useState(null);
  const [lastUpdated, setLastUpdated] = React.useState(null);
  const [liveState, setLiveState] = React.useState('live');
  const hasLoadedRef = React.useRef(false);
  const requestSeqRef = React.useRef(0);

  const fetchDashboardData = React.useCallback(async () => {
    const seq = ++requestSeqRef.current;
    if (!hasLoadedRef.current) setLoading(true);

    const params = {
      fromDate: dateFrom || undefined,
      toDate: dateTo || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      departmentId: filters.departmentId || undefined,
      employeeId: filters.employeeId || undefined,
      branchId: filters.branchId || undefined,
    };

    const endpoints = {
      unified: () => api.get('/admin/dashboard/summary', { params }),
      summary: () => api.get('/reports/summary', { params: { dateFrom: dateFrom || undefined, dateTo: dateTo || undefined } }),
      leads: () => api.get('/leads/dashboard', { params }),
      customers: () => api.get('/customers/metrics', { params }),
      deals: () => api.get('/deals/metrics', { params }),
      tasks: () => api.get('/tasks/metrics', { params }),
      liveAttendance: () => api.get('/admin/hrms/live-dashboard', { params }),
      recentLeads: () => api.get('/leads', { params: { page: 1, limit: 10, ...params } }),
      invoices: () => api.get('/invoices', { params: { page: 1, limit: 25, ...params } }),
      activity: () => api.get('/audit-logs', { params: { page: 1, limit: 10, startDate: dateFrom || undefined, endDate: dateTo || undefined } }),
      captureUsage: () => loadCaptureUsage(),
      captureSessions: () => loadCaptureSessions({ page: 1, limit: 10 }),
      capturePending: () => loadCaptures({ page: 1, limit: 1, status: 'CAPTURED' }),
      captureRejected: () => loadCaptures({ page: 1, limit: 1, status: 'REJECTED' }),
      whatsappStats: () => api.get('/whatsapp/campaigns/stats'),
      emailStats: async () => {
        try {
          return await api.get('/email/stats');
        } catch {
          const res = await api.get('/email/templates', { params: { page: 1, limit: 1 } });
          const stats = res?.data?.stats || res?.stats || {};
          return {
            totalTemplates: stats.total || 0,
            activeTemplates: stats.active || 0,
            totalSent: stats.sent || 0,
            totalDelivered: stats.sent || 0,
            totalFailed: 0,
          };
        }
      },
    };

    try {
      const results = await Promise.all(
        Object.entries(endpoints).map(async ([key, call]) => {
          try {
            const res = await call();
            return [key, res, null];
          } catch (err) {
            return [key, null, suiteError(err)];
          }
        })
      );

      // Prevent stale out-of-order responses from overwriting newer filters
      if (seq !== requestSeqRef.current) return;

      const nextData = {};
      const errorList = [];
      results.forEach(([key, payload, error]) => {
        if (error) errorList.push({ key, error });
        else nextData[key] = payload;
      });

      setData((previous) => ({ ...previous, ...nextData }));
      setCaptureData((previous) => ({
        usage: Object.hasOwn(nextData, 'captureUsage') ? nextData.captureUsage : previous?.usage,
        sessionsSummary: nextData.captureSessions?.summary || previous?.sessionsSummary,
        sessionsMeta: nextData.captureSessions?.meta || previous?.sessionsMeta,
        pending: Object.hasOwn(nextData, 'capturePending')
          ? nextData.capturePending?.total ?? nextData.capturePending?.pagination?.total
          : previous?.pending,
        rejected: Object.hasOwn(nextData, 'captureRejected')
          ? nextData.captureRejected?.total ?? nextData.captureRejected?.pagination?.total
          : previous?.rejected,
      }));
      setFailed(errorList);
      setLastUpdated(new Date());
      setLiveState(errorList.length ? 'reconnecting' : 'live');
    } catch {
      if (seq === requestSeqRef.current) setLiveState('reconnecting');
    } finally {
      if (seq === requestSeqRef.current) {
        setLoading(false);
        hasLoadedRef.current = true;
      }
    }
  }, [dateFrom, dateTo, filters.departmentId, filters.employeeId, filters.branchId]);

  React.useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData, refreshCount]);

  // Safe polling with tab visibility and online/offline awareness
  React.useEffect(() => {
    let timer;
    let stopped = false;

    const schedule = () => {
      clearTimeout(timer);
      if (document.visibilityState === 'visible' && !stopped) {
        timer = setTimeout(async () => {
          if (!stopped) await fetchDashboardData();
          schedule();
        }, 40000);
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchDashboardData();
        schedule();
      }
    };

    const onOnline = () => {
      setLiveState('live');
      fetchDashboardData();
    };

    const onOffline = () => {
      setLiveState('offline');
    };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    schedule();

    return () => {
      stopped = true;
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [fetchDashboardData]);

  const summary = objectOf(data?.summary);
  const leads = objectOf(data?.leads);
  const customers = objectOf(data?.customers);
  const deals = objectOf(data?.deals);
  const tasks = objectOf(data?.tasks);
  const liveAttendance = objectOf(data?.liveAttendance);
  const recentLeads = rowsOf(data?.recentLeads);
  const recentInvoices = rowsOf(data?.invoices);
  const activity = rowsOf(data?.activity);

  const handleDateChange = (from, to) => {
    setFilters((prev) => ({ ...prev, preset: 'custom', fromDate: from, toDate: to }));
  };

  const handleRefresh = () => {
    setRefreshCount((prev) => prev + 1);
  };

  const handleExportCsv = () => {
    const unified = objectOf(data?.unified);
    const pm = unified?.periodMetrics || {};
    const snap = unified?.snapshot || {};
    const rows = [
      ['Metric', 'Category', 'Value'],
      ['Date From', 'Filter', dateFrom || 'All Time'],
      ['Date To', 'Filter', dateTo || 'All Time'],
      ['Total Leads', 'Period Activity', pm.totalLeads ?? leads?.summary?.totalLeads ?? 0],
      ['Converted Leads', 'Period Activity', pm.convertedLeads ?? leads?.summary?.wonLeads ?? 0],
      ['Total Invoiced Amount', 'Period Financial', pm.totalInvoicedAmount ?? 0],
      ['Actual Revenue Collected', 'Period Financial', pm.actualRevenueCollected ?? 0],
      ['Outstanding Payments', 'Receivables', pm.outstandingPayments ?? 0],
      ['Upcoming Collections', 'Receivables', pm.upcomingCollections ?? 0],
      ['Online Collections', 'Period Financial', pm.onlineCollections ?? 0],
      ['Offline Collections', 'Period Financial', pm.offlineCollections ?? 0],
      ['Total Customers', 'Current Snapshot', snap.totalCustomers ?? customers?.total ?? 0],
      ['Active Employees', 'Current Snapshot', snap.activeEmployees ?? summary?.workforce?.active ?? 0],
      ['Present Employees', 'Attendance', snap.presentEmployees ?? liveAttendance?.summary?.present ?? 0],
      ['Active Subscriptions', 'Current Snapshot', snap.activeSubscriptions ?? 0],
    ];
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qb-admin-dashboard-${dateFrom || 'all'}-to-${dateTo || 'all'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full min-w-0 max-w-none space-y-5 sm:space-y-6 pb-10">
      {/* 1. Header with Greeting, Date Filters & Live Sync State */}
      <DashboardHeader
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateChange={handleDateChange}
        onRefresh={handleRefresh}
        loading={loading}
        liveState={liveState}
        lastUpdated={lastUpdated}
      />

      {/* Global Reusable Dashboard Filters */}
      <GlobalDashboardFilters
        filters={filters}
        onApply={(next) => setFilters(next)}
        onReset={(next) => setFilters(next)}
        onRefresh={handleRefresh}
        onExportCsv={handleExportCsv}
        refreshing={loading}
        lastSyncedAt={lastUpdated}
        storageKey="qb_main_dashboard_filters"
      />

      {/* Network or Endpoint Notice */}
      {failed.length > 0 && (
        <HrmNotice
          error={`Notice: Some metrics could not be fetched (${failed.map((f) => f.key).join(', ')}). Retrying available live data.`}
          onRetry={handleRefresh}
        />
      )}

      {/* 2. Responsive Primary KPI Cards (4 Cards: Total Leads, Converted, Revenue, Active Employees) */}
      <KpiCards
        summary={summary}
        leads={leads}
        loading={loading}
      />

      {/* 3. Main Analytics Section: Leads Overview, Leads by Source, Upcoming Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 w-full min-w-0 items-stretch">
        {/* Leads Overview Area Chart (5/12 on xl, 12/12 on lg) */}
        <div className="lg:col-span-12 xl:col-span-5 min-w-0 flex flex-col h-full">
          <LeadsOverviewCard leads={leads} loading={loading} />
        </div>

        {/* Leads by Source Doughnut Chart (4/12 on xl, 6/12 on lg) */}
        <div className="lg:col-span-6 xl:col-span-4 min-w-0 flex flex-col h-full">
          <LeadsBySourceCard leads={leads} loading={loading} />
        </div>

        {/* Upcoming Activities List (3/12 on xl, 6/12 on lg) */}
        <div className="lg:col-span-6 xl:col-span-3 min-w-0 flex flex-col h-full">
          <UpcomingActivitiesCard tasks={data?.tasks} loading={loading} />
        </div>
      </div>

      {/* 4. Operational Dashboard Cards: Employee Attendance, Task Summary, Recent Leads */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 w-full min-w-0 items-stretch">
        <div className="min-w-0 flex flex-col h-full">
          <AttendanceCard
            summary={summary}
            liveAttendance={liveAttendance}
            loading={loading}
          />
        </div>
        <div className="min-w-0 flex flex-col h-full">
          <TasksOverviewCard tasks={tasks} loading={loading} />
        </div>
        <div className="min-w-0 flex flex-col h-full md:col-span-2 lg:col-span-1">
          <RecentLeadsCard recentLeads={recentLeads} loading={loading} />
        </div>
      </div>

      {/* 5. Extended Revenue & Campaign Performance Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 w-full min-w-0 items-stretch">
        <div className="lg:col-span-7 xl:col-span-8 min-w-0 flex flex-col h-full">
          <RevenueChartCard
            summary={summary}
            invoices={recentInvoices}
            dateFrom={dateFrom}
            dateTo={dateTo}
            loading={loading}
          />
        </div>
        <div className="lg:col-span-5 xl:col-span-4 min-w-0 flex flex-col h-full">
          <LeadsByStageCard leads={leads} loading={loading} />
        </div>
      </div>

      {/* 6. Data Capture & Marketing Broadcast Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 w-full min-w-0 items-stretch">
        <div className="lg:col-span-1 min-w-0 flex flex-col h-full">
          <DataCaptureCard data={captureData} loading={loading && !captureData} />
        </div>
        <div className="lg:col-span-1 min-w-0 flex flex-col h-full">
          <WhatsAppCampaignCard stats={data?.whatsappStats} loading={loading} />
        </div>
        <div className="lg:col-span-1 min-w-0 flex flex-col h-full">
          <EmailCampaignCard stats={data?.emailStats} loading={loading} />
        </div>
      </div>

      {/* 7. Recent Activity & Quick Actions (2-Col Layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 w-full min-w-0 items-stretch">
        <div className="lg:col-span-2 min-w-0 flex flex-col h-full">
          <RecentActivityCard activity={activity} loading={loading} />
        </div>
        <div className="lg:col-span-1 min-w-0 flex flex-col h-full">
          <QuickActionsCard />
        </div>
      </div>
    </div>
  );
}
