'use client';

import * as React from 'react';
import { CrmScreen } from '@/modules/crm/CrmScreen';
import { crmGaps, loadActivities } from '@/modules/crm/crm-api';

export default function ActivitiesRoute() {
  const load = React.useCallback((query) => loadActivities({ page: query.page, limit: 20, search: query.search || undefined, module: query.module || undefined, status: query.status || undefined }), []);
  return <CrmScreen title="Activities" description="Activity history from the audit log. New sales work is recorded as leads, follow-ups, visits, or tasks." canCreate={false} load={load}
    gap={{ title: 'Creating an activity', detail: crmGaps.activities }}
    stats={(result) => [{ label: 'Total', value: result.metrics?.total }, { label: 'Admin', value: result.metrics?.adminCount }, { label: 'Mobile', value: result.metrics?.mobileCount }, { label: 'Failed', value: result.metrics?.failedCount }]}
    filters={[{ key: 'status', label: 'All results', options: [{ value: 'SUCCESS', label: 'Success' }, { value: 'FAILED', label: 'Failed' }] }]}
    columns={[{ header: 'When', cell: (row) => row.createdAt ? new Date(row.createdAt).toLocaleString() : '—' }, { header: 'Module', cell: (row) => row.module || '—' }, { header: 'Action', cell: (row) => row.action || '—' }, { header: 'User', cell: (row) => row.userName || row.user?.name || row.email || '—' }, { header: 'Description', cell: (row) => row.description || row.entity || '—' }, { header: 'Status', cell: (row) => row.status || '—' }]}
    detail={(row) => <pre className="whitespace-pre-wrap text-xs">{JSON.stringify({ module: row.module, action: row.action, description: row.description, status: row.status, createdAt: row.createdAt, entityId: row.entityId }, null, 2)}</pre>}
  />;
}
