'use client';

import * as React from 'react';
import api from '../../../../lib/api';
import { rowsOf, suiteError } from '@/modules/suite/suite-api';
import { HrmNotice } from '@/modules/hrm/HrmNotice';

// Dashboard Components
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { KpiCards } from '@/components/dashboard/KpiCards';
import { RevenueChartCard } from '@/components/dashboard/RevenueChartCard';
import { LeadsByStageCard } from '@/components/dashboard/LeadsByStageCard';
import { AttendanceCard } from '@/components/dashboard/AttendanceCard';
import { TasksOverviewCard } from '@/components/dashboard/TasksOverviewCard';
import { PayrollSummaryCard } from '@/components/dashboard/PayrollSummaryCard';
import { RecentLeadsCard } from '@/components/dashboard/RecentLeadsCard';
import { RecentActivityCard } from '@/components/dashboard/RecentActivityCard';
import { QuickActionsCard } from '@/components/dashboard/QuickActionsCard';
import { DataCaptureCard, CampaignMetricsCard } from '@/components/dashboard/DataCaptureCard';
import { loadCaptures, loadCaptureUsage } from '@/modules/data-capture/capture-api';

export default function AdminDashboardPage() {
  const [dateFrom, setDateFrom] = React.useState('');
  const [dateTo, setDateTo] = React.useState('');
  const [data, setData] = React.useState(null);
  const [failed, setFailed] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshCount, setRefreshCount] = React.useState(0);
  const [captureData, setCaptureData] = React.useState(null);
  const [lastUpdated, setLastUpdated] = React.useState(null);
  const [liveState, setLiveState] = React.useState('connecting');
  const hasLoadedRef = React.useRef(false);

  const fetchDashboardData = React.useCallback(async () => {
    if (!hasLoadedRef.current) setLoading(true);
    const params = {
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    };

    const endpoints = {
      summary: () => api.get('/reports/summary', { params }),
      leads: () => api.get('/leads/metrics'),
      customers: () => api.get('/customers/metrics'),
      deals: () => api.get('/deals/metrics'),
      tasks: () => api.get('/tasks/metrics'),
      liveAttendance: () => api.get('/admin/hrms/live-dashboard'),
      recentLeads: () => api.get('/leads', { params: { page: 1, limit: 10 } }),
      invoices: () => api.get('/invoices', { params: { page: 1, limit: 10 } }),
      activity: () => api.get('/audit-logs', { params: { page: 1, limit: 10 } }),
      captureUsage: () => loadCaptureUsage(),
      capturePending: () => loadCaptures({ page: 1, limit: 1, status: 'CAPTURED' }),
      captureRejected: () => loadCaptures({ page: 1, limit: 1, status: 'REJECTED' }),
      whatsappStats: () => api.get('/whatsapp/campaigns/stats'),
    };

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

    const nextData = {};
    const errorList = [];
    results.forEach(([key, payload, error]) => {
      if (error) errorList.push({ key, error });
      else nextData[key] = payload;
    });

    setData((previous) => ({ ...previous, ...nextData }));
    setCaptureData((previous) => ({
      usage: Object.hasOwn(nextData, 'captureUsage') ? nextData.captureUsage : previous?.usage,
      pending: Object.hasOwn(nextData, 'capturePending') ? nextData.capturePending?.total ?? nextData.capturePending?.pagination?.total : previous?.pending,
      rejected: Object.hasOwn(nextData, 'captureRejected') ? nextData.captureRejected?.total ?? nextData.captureRejected?.pagination?.total : previous?.rejected,
    }));
    setFailed(errorList);
    setLoading(false);
    hasLoadedRef.current = true;
    setLastUpdated(new Date());
    setLiveState(errorList.length ? 'reconnecting' : 'live');
  }, [dateFrom, dateTo]);

  React.useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData, refreshCount]);

  React.useEffect(() => {
    let timer;
    let stopped = false;
    const schedule = () => {
      clearTimeout(timer);
      if (document.visibilityState === 'visible' && !stopped) {
        timer = setTimeout(async () => {
          if (!stopped) await fetchDashboardData();
          schedule();
        }, 45000);
      }
    };
    const onVisibility = () => schedule();
    document.addEventListener('visibilitychange', onVisibility);
    schedule();
    return () => { stopped = true; clearTimeout(timer); document.removeEventListener('visibilitychange', onVisibility); };
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
    setDateFrom(from);
    setDateTo(to);
  };

  const handleRefresh = () => {
    setRefreshCount((prev) => prev + 1);
  };

  return (
    <div className="w-full min-w-0 max-w-none space-y-5 sm:space-y-6 pb-8">
      {/* 1. Welcome & Date Filter Section */}
      <DashboardHeader
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateChange={handleDateChange}
        onRefresh={handleRefresh}
        loading={loading}
      />
      <div className="flex items-center gap-2 text-xs text-slate-500" role="status" aria-live="polite">
        <span className={`size-2 rounded-full ${liveState === 'live' ? 'bg-emerald-500' : liveState === 'reconnecting' ? 'bg-amber-500' : 'bg-slate-400'}`} />
        {liveState === 'live' ? 'Live · refreshes every 45 seconds' : liveState === 'reconnecting' ? 'Reconnecting · showing last successful update' : 'Connecting to dashboard data'}
        {lastUpdated && <span>· Updated {lastUpdated.toLocaleTimeString()}</span>}
      </div>

      {/* Error Notice if any background endpoint failed */}
      {failed.length > 0 && (
        <HrmNotice
          error={`Notice: Some metrics could not be fetched (${failed.map((f) => f.key).join(', ')}). Retrying available data.`}
          onRetry={handleRefresh}
        />
      )}

      {/* 2. Responsive KPI Cards (5 Cards) */}
      <KpiCards
        summary={summary}
        leads={leads}
        customers={customers}
        deals={deals}
        loading={loading}
      />

      {/* 3. Main Analytics Section: Revenue Overview (2/3) & Leads by Stage Donut (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 w-full min-w-0">
        <div className="lg:col-span-7 xl:col-span-8 min-w-0">
          <RevenueChartCard
            summary={summary}
            invoices={recentInvoices}
            loading={loading}
          />
        </div>
        <div className="lg:col-span-5 xl:col-span-4 min-w-0">
          <LeadsByStageCard leads={leads} loading={loading} />
        </div>
      </div>

      {/* 4. Three-Column Summary Cards: Attendance, Tasks, Payroll */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 w-full min-w-0">
        <AttendanceCard
          summary={summary}
          liveAttendance={liveAttendance}
          loading={loading}
        />
        <TasksOverviewCard tasks={tasks} loading={loading} />
        <PayrollSummaryCard summary={summary} loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 w-full min-w-0">
        <DataCaptureCard data={captureData} loading={loading && !captureData} />
        <CampaignMetricsCard whatsappStats={data?.whatsappStats} />
      </div>

      {/* 5. Recent Leads Table & Responsive Cards */}
      <div className="w-full min-w-0">
        <RecentLeadsCard recentLeads={recentLeads} loading={loading} />
      </div>

      {/* 6. Recent Activity & Quick Actions (2-Col Layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 w-full min-w-0">
        <div className="lg:col-span-2 min-w-0">
          <RecentActivityCard activity={activity} loading={loading} />
        </div>
        <div className="lg:col-span-1 min-w-0">
          <QuickActionsCard />
        </div>
      </div>
    </div>
  );
}

function objectOf(payload) {
  if (!payload || typeof payload !== 'object') return {};
  if (payload.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) {
    return payload.data.summary && payload.data.workforce == null && payload.data.present == null
      ? payload.data
      : payload.data;
  }
  return payload;
}
