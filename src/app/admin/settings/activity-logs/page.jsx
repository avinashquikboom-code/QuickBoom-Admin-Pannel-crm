'use client';

import * as React from 'react';
import { PageTitleCard } from '@/components/common/PageTitleCard';
import { History } from 'lucide-react';
import {
  ActivitySummaryCards,
  ActivityFilterToolbar,
  ActivityLogsTable,
  ActivityPagination,
  ActivityDetailDrawer,
} from '@/components/activity-logs';
import { loadActivities, loadEmployees, crmError } from '@/modules/crm/crm-api';
import { toast } from '@/hooks/use-toast';

export default function ActivityLogsPage() {
  const [activities, setActivities] = React.useState([]);
  const [metrics, setMetrics] = React.useState({
    total: 0,
    creates: 0,
    updates: 0,
    deletes: 0,
    modules: [],
    actions: [],
  });
  const [pagination, setPagination] = React.useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });
  const [employees, setEmployees] = React.useState([]);

  // States for filters & pagination
  const [search, setSearch] = React.useState('');
  const [selectedAction, setSelectedAction] = React.useState('');
  const [selectedModule, setSelectedModule] = React.useState('');
  const [selectedUserId, setSelectedUserId] = React.useState('');
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(20);

  // Status & modal states
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState('');
  const [selectedActivity, setSelectedActivity] = React.useState(null);
  const [isDetailOpen, setIsDetailOpen] = React.useState(false);

  // Load employee directory for the user filter
  React.useEffect(() => {
    let isMounted = true;
    loadEmployees()
      .then((data) => {
        if (isMounted && Array.isArray(data)) setEmployees(data);
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch audit records & metrics from API
  const fetchData = React.useCallback(
    async (isBackground = false) => {
      if (isBackground) {
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
          action: selectedAction || undefined,
          module: selectedModule || undefined,
          userId: selectedUserId ? Number(selectedUserId) : undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        };

        const result = await loadActivities(queryParams);
        const rows = result.rows || [];
        setActivities(rows);

        // Derive KPI counts from metrics or row calculations
        const totalCount =
          Number(result.pagination?.total ?? result.metrics?.total ?? rows.length) || 0;

        let createsCount = result.metrics?.creates ?? result.metrics?.createCount;
        let updatesCount = result.metrics?.updates ?? result.metrics?.updateCount;
        let deletesCount = result.metrics?.deletes ?? result.metrics?.deleteCount;

        if (createsCount == null) {
          createsCount = rows.filter((r) =>
            String(r.action || '').toUpperCase().includes('CREATE')
          ).length;
        }
        if (updatesCount == null) {
          updatesCount = rows.filter((r) =>
            String(r.action || '').toUpperCase().includes('UPDATE')
          ).length;
        }
        if (deletesCount == null) {
          deletesCount = rows.filter((r) =>
            String(r.action || '').toUpperCase().includes('DELETE')
          ).length;
        }

        setMetrics((prev) => ({
          ...prev,
          ...(result.metrics || {}),
          total: totalCount,
          creates: createsCount,
          updates: updatesCount,
          deletes: deletesCount,
        }));

        if (result.pagination) {
          const resLimit = Number(result.pagination.limit || limit);
          const resTotal = Number(result.pagination.total || rows.length);
          const calcPages = Math.ceil(resTotal / resLimit) || 1;
          setPagination({
            page: Number(result.pagination.page || page),
            limit: resLimit,
            total: resTotal,
            totalPages: Number(result.pagination.totalPages || calcPages),
          });
        }
      } catch (err) {
        setError(crmError(err));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [page, limit, search, selectedAction, selectedModule, selectedUserId, startDate, endDate]
  );

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle filter resets
  const handleClearFilters = () => {
    setSearch('');
    setSelectedAction('');
    setSelectedModule('');
    setSelectedUserId('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  // Dynamic modules list
  const modulesList = React.useMemo(() => {
    const standardModules = [
      'Webhooks',
      'Admin',
      'HRM',
      'CRM',
      'Attendance',
      'Payroll',
      'Employees',
      'Settings',
      'Data Management',
      'Data Capture',
      'Integrations',
      'Notifications',
    ];
    const backendModules = Array.isArray(metrics.modules) ? metrics.modules : [];
    return Array.from(new Set([...standardModules, ...backendModules])).sort();
  }, [metrics.modules]);

  // Dynamic actions list
  const actionsList = React.useMemo(() => {
    const standardActions = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT'];
    const backendActions = Array.isArray(metrics.actions) ? metrics.actions : [];
    return Array.from(new Set([...standardActions, ...backendActions])).sort();
  }, [metrics.actions]);

  // Open detail view
  const handleOpenDetail = (activity) => {
    setSelectedActivity(activity);
    setIsDetailOpen(true);
  };

  return (
    <div className="max-w-none w-full min-w-0 space-y-5 sm:space-y-6 pb-28 overflow-x-hidden">
      {/* 1. Page Header (SYSTEM GOVERNANCE · Activity Logs) */}
      <PageTitleCard
        category="SYSTEM GOVERNANCE"
        title="Activity Logs"
        description="Audit records for administrative actions."
        icon={History}
      />

      {/* 2. Summary KPI Cards (Total Logs, Creates, Updates, Deletes) */}
      <ActivitySummaryCards
        total={metrics.total}
        creates={metrics.creates}
        updates={metrics.updates}
        deletes={metrics.deletes}
        loading={loading}
      />

      {/* 3. Search and Filters Toolbar */}
      <ActivityFilterToolbar
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        action={selectedAction}
        onActionChange={(val) => {
          setSelectedAction(val);
          setPage(1);
        }}
        module={selectedModule}
        onModuleChange={(val) => {
          setSelectedModule(val);
          setPage(1);
        }}
        userId={selectedUserId}
        onUserIdChange={(val) => {
          setSelectedUserId(val);
          setPage(1);
        }}
        startDate={startDate}
        onStartDateChange={(val) => {
          setStartDate(val);
          setPage(1);
        }}
        endDate={endDate}
        onEndDateChange={(val) => {
          setEndDate(val);
          setPage(1);
        }}
        onRefresh={() => fetchData(true)}
        onClearFilters={handleClearFilters}
        loading={refreshing || loading}
        modulesList={modulesList}
        actionsList={actionsList}
        usersList={employees}
      />

      {/* 4. Activity Logs Table & Pagination Card Container */}
      <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
        <ActivityLogsTable
          logs={activities}
          loading={loading}
          error={error}
          onRetry={() => fetchData(false)}
          onViewDetail={handleOpenDetail}
        />

        {!loading && !error && activities.length > 0 && (
          <ActivityPagination
            page={pagination.page}
            limit={pagination.limit}
            total={pagination.total}
            totalPages={pagination.totalPages}
            onPageChange={(p) => setPage(p)}
            onLimitChange={(l) => {
              setLimit(l);
              setPage(1);
            }}
          />
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
