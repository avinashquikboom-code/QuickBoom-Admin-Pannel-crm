'use client';

import * as React from 'react';
import { CrmScreen } from '@/modules/crm/CrmScreen';
import { StatusBadge } from '@/components/common/StatusBadge';
import { HrmGap } from '@/modules/hrm/HrmNotice';
import { loadCampaigns, suiteGaps } from '@/modules/suite/suite-api';

export default function NotificationsPage() {
  const load = React.useCallback((query) => loadCampaigns(query.page), []);
  return <div className="space-y-4"><HrmGap title="Delivery settings" detail={suiteGaps.notifications} /><CrmScreen title="Notifications" description="Offer notification campaigns returned by the notifications API." canCreate={false} load={load} columns={[
    { header: 'Title', cell: (row) => row.title || row.name || row.id },
    { header: 'When', cell: (row) => String(row.createdAt || row.sentAt || '').slice(0, 16).replace('T', ' ') },
    { header: 'Status', cell: (row) => <StatusBadge status={String(row.status || 'sent').toLowerCase()} /> },
  ]} detail={(row) => <pre className="whitespace-pre-wrap text-xs">{JSON.stringify(strip(row), null, 2)}</pre>} /></div>;
}
function strip(row) { const { token, accessToken, secret, password, ...safe } = row || {}; return safe; }
