'use client';

import * as React from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/common/DataTable';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { HrmGap, HrmNotice, HrmStats } from '@/modules/hrm/HrmNotice';
import { billingError, billingGaps, loadBillingOverview } from '@/modules/customer/billing-api';

const inr = (value) => value == null ? '—' : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value) || 0);

export default function CustomerDashboardPage() {
  const [data, setData] = React.useState(null);
  const [filters, setFilters] = React.useState({ dateFrom: '', dateTo: '', status: '' });
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [refresh, setRefresh] = React.useState(0);

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    loadBillingOverview({ dateFrom: filters.dateFrom || undefined, dateTo: filters.dateTo || undefined, status: filters.status || undefined })
      .then((result) => { if (active) { setData(result); setError(''); } })
      .catch((err) => { if (active) setError(billingError(err)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [filters.dateFrom, filters.dateTo, filters.status, refresh]);

  const customers = data?.customers || {};
  const invoices = data?.invoices || {};
  const subscriptions = data?.subscriptions || {};

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader title="Customer Dashboard" description="Customer, subscription, invoice, and revenue totals from the existing APIs." />
      <div className="grid grid-cols-1 gap-2 rounded-xl border border-slate-200 bg-white p-3 sm:grid-cols-2 xl:grid-cols-4">
        <Input type="date" aria-label="From date" value={filters.dateFrom} onChange={(event) => setFilters({ ...filters, dateFrom: event.target.value })} />
        <Input type="date" aria-label="To date" value={filters.dateTo} onChange={(event) => setFilters({ ...filters, dateTo: event.target.value })} />
        <select aria-label="Customer status" className="h-9 rounded-md border px-2 text-sm" value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
          <option value="">All customer statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
        <Button variant="outline" onClick={() => setRefresh((value) => value + 1)}>Refresh</Button>
      </div>
      <HrmGap title="Growth and revenue charts" detail={billingGaps.growthChart} />
      <HrmNotice loading={loading} error={error} onRetry={() => setRefresh((value) => value + 1)}>
        {data && <>
          <HrmStats items={[
            { label: 'Total customers', value: customers.totalCustomers },
            { label: 'Active customers', value: customers.activeCustomers },
            { label: 'Inactive customers', value: customers.inactiveCustomers },
            { label: 'New customers', value: customers.newCustomers },
            { label: 'Active subscriptions', value: subscriptions.totalActive },
            { label: 'Expired subscriptions', value: subscriptions.expired },
            { label: 'Pending invoices', value: invoices.pendingPayments ?? invoices.pending },
            { label: 'Revenue', value: inr(data.revenue?.totalRevenue) },
          ]} />
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {['paid', 'pending', 'overdue'].map((key) => <div key={key} className="rounded-xl border bg-white p-4"><p className="text-xs uppercase text-slate-500">{key} invoices</p><p className="text-2xl font-semibold">{invoices[key] ?? invoices[`${key}Invoices`] ?? '—'}</p></div>)}
          </div>
          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            <section className="overflow-x-auto"><h2 className="mb-2 text-sm font-semibold">Recent customers</h2><DataTable label="Recent customers" data={data.recentCustomers} columns={[{ header: 'Customer', cell: (row) => row.name || row.companyName }, { header: 'Email', cell: (row) => row.email || '—' }, { header: 'Status', cell: (row) => row.status || (row.isActive === false ? 'INACTIVE' : 'ACTIVE') }, { header: 'Created', cell: (row) => String(row.createdAt || '').slice(0, 10) }]} /></section>
            <section className="overflow-x-auto"><h2 className="mb-2 text-sm font-semibold">Recent invoices</h2><DataTable label="Recent invoices" data={data.recentInvoices} columns={[{ header: 'Invoice', cell: (row) => row.invoiceNo || row.invoiceNumber }, { header: 'Customer', cell: (row) => row.customerName || row.clientName }, { header: 'Total', cell: (row) => inr(row.totalAmount) }, { header: 'Status', cell: (row) => row.status }]} /></section>
          </div>
        </>}
      </HrmNotice>
    </div>
  );
}
