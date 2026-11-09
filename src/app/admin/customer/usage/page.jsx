'use client';

import * as React from 'react';
import { CrmScreen } from '@/modules/crm/CrmScreen';
import { billingGaps, loadResourceUsage } from '@/modules/customer/billing-api';

export default function ResourceUsagePage() {
  const load = React.useCallback((query) => loadResourceUsage({ page: query.page, limit: 20, search: query.search || undefined, status: query.status || undefined, dateFrom: query.dateFrom || undefined, dateTo: query.dateTo || undefined }), []);
  return <CrmScreen title="Resource Usage" description="Employee, lead, and storage usage against the limits returned for each customer." canCreate={false} load={load}
    gap={{ title: 'Usage coverage', detail: billingGaps.usageApi }}
    stats={(result) => [{ label: 'Customers', value: result.summary?.totalCustomers }, { label: 'Active', value: result.summary?.activeCustomers }, { label: 'Seat use', value: result.summary?.overallSeatUtilization }, { label: 'Storage', value: result.summary?.totalStorage }]}
    filters={[{ key: 'status', label: 'All statuses', options: ['ACTIVE', 'INACTIVE', 'UPCOMING', 'COMPLETED'].map((value) => ({ value, label: value })) }]}
    below={(rows) => <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{rows.slice(0, 6).map((row) => <UsageCard key={row.id} row={row} />)}</div>}
    columns={[
      { header: 'Customer', cell: (row) => row.name || row.companyName },
      { header: 'Plan', cell: (row) => row.planName || '—' },
      { header: 'Employees', cell: (row) => `${row.users ?? 0} / ${row.maxUsers ?? '—'}` },
      { header: 'Leads', cell: (row) => `${row.leads ?? 0} / ${row.maxLeads ?? '—'}` },
      { header: 'Storage', cell: (row) => `${row.storage || '—'} / ${row.maxStorage || '—'}` },
      { header: 'Seat %', cell: (row) => row.seatUtilization == null ? '—' : `${row.seatUtilization}%` },
      { header: 'Status', cell: (row) => row.customerStatus || row.status },
    ]}
    detail={(row) => <UsageCard row={row} />}
  />;
}

function UsageCard({ row }) {
  const bars = [
    { label: 'Employees', used: row.users, limit: row.maxUsers, percent: row.seatUtilization },
    { label: 'Leads', used: row.leads, limit: row.maxLeads, percent: row.leadUtilization },
  ];
  return <div className="rounded-xl border bg-white p-3 text-sm"><p className="font-medium">{row.name}</p><p className="text-xs text-slate-500">{row.planName}</p>{bars.map((bar) => <div key={bar.label} className="mt-2"><div className="flex justify-between text-xs"><span>{bar.label}</span><span>{bar.used ?? 0} / {bar.limit ?? '—'}</span></div><div className="mt-1 h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-brand" style={{ width: `${Math.min(100, Number(bar.percent) || 0)}%` }} /></div>{Number(bar.percent) >= 100 ? <p className="text-xs text-rose-600">Limit reached</p> : Number(bar.percent) >= 80 ? <p className="text-xs text-amber-700">Near limit</p> : null}</div>)}<p className="mt-2 text-xs">Storage {row.storage || '—'} of {row.maxStorage || '—'}</p></div>;
}
