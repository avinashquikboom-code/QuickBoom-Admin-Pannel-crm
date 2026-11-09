'use client';

import * as React from 'react';
import { CrmScreen } from '@/modules/crm/CrmScreen';
import { loadAuditLogs } from '@/modules/suite/suite-api';

export default function ActivityLogsPage() {
  const load = React.useCallback((query) => loadAuditLogs(query), []);
  return <CrmScreen title="Activity Logs" description="Audit records for administrative actions." canCreate={false} load={load} columns={[
    { header: 'When', cell: (row) => String(row.createdAt || '').slice(0, 16).replace('T', ' ') },
    { header: 'Action', cell: (row) => row.action || '—' },
    { header: 'Module', cell: (row) => row.module || '—' },
    { header: 'User', cell: (row) => row.userName || row.user?.email || row.userId || '—' },
    { header: 'Description', cell: (row) => row.description || '—' },
  ]} />;
}
