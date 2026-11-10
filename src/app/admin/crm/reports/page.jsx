'use client';

import * as React from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { DataTable } from '@/components/common/DataTable';
import { HrmGap, HrmNotice, HrmStats } from '@/modules/hrm/HrmNotice';
import { crmError, crmGaps, loadSalesReports } from '@/modules/crm/crm-api';

const inr = (value) => value == null ? '—' : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value) || 0);

export default function SalesReportsRoute() {
  const [report, setReport] = React.useState(null);
  const [range, setRange] = React.useState({ dateFrom: '', dateTo: '' });
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [refresh, setRefresh] = React.useState(0);
  React.useEffect(() => {
    let active = true;
    setLoading(true);
    loadSalesReports({ dateFrom: range.dateFrom || undefined, dateTo: range.dateTo || undefined }).then((result) => { if (active) { setReport(result); setError(''); } }).catch((err) => { if (active) setError(crmError(err)); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [range.dateFrom, range.dateTo, refresh]);
  const leads = report?.leads || {};
  const deals = report?.deals || {};
  const conversion = leads.total ? `${Math.round(((leads.converted || 0) / leads.total) * 1000) / 10}%` : '—';
  const exportRows = () => {
    const rows = report?.revenueRows || [];
    const keys = rows[0] ? Object.keys(rows[0]).filter((key) => ['string', 'number', 'boolean'].includes(typeof rows[0][key])) : [];
    const csv = [keys.join(','), ...rows.map((row) => keys.map((key) => JSON.stringify(row[key] ?? '')).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'revenue-report.csv';
    link.click();
  };
  return <div className="max-w-none min-w-0 w-full space-y-6">
    <PageHeader title="Sales Reports" description="Counts and revenue returned by the lead, deal, customer, and report APIs." actions={<Button variant="outline" onClick={exportRows} disabled={!report?.revenueRows?.length}>Export revenue CSV</Button>} />
    <div className="flex flex-col gap-2 sm:flex-row"><Input type="date" value={range.dateFrom} onChange={(event) => setRange({ ...range, dateFrom: event.target.value })} aria-label="From" /><Input type="date" value={range.dateTo} onChange={(event) => setRange({ ...range, dateTo: event.target.value })} aria-label="To" /><Button variant="outline" onClick={() => setRefresh((value) => value + 1)}>Refresh</Button></div>
    <HrmGap title="Employee and source performance" detail={crmGaps.salesEmployee} />
    <HrmNotice loading={loading} error={error} onRetry={() => setRefresh((value) => value + 1)}>
      {report && <>
        <HrmStats items={[{ label: 'Leads', value: leads.total }, { label: 'Converted', value: leads.converted }, { label: 'Conversion', value: conversion }, { label: 'Active customers', value: report.customers.activeCustomers }, { label: 'Deals', value: deals.total }, { label: 'Won', value: deals.won }, { label: 'Lost', value: deals.lost }, { label: 'Revenue', value: inr(report.summary.revenue?.totalRevenue) }]} />
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <section className="rounded-xl border bg-white p-4"><h2 className="text-sm font-semibold">Deal pipeline</h2><p className="mt-2 text-sm">Open {deals.open ?? '—'} · Won value {inr(deals.wonValue)} · Pipeline {inr(deals.pipelineValue)}</p></section>
          <section className="rounded-xl border bg-white p-4"><h2 className="text-sm font-semibold">Visits in range</h2><p className="mt-2 text-sm">{report.summary.visits?.total ?? '—'} visits · {report.visitRows.length} report rows</p></section>
        </div>
        <div className="mt-4 overflow-x-auto"><DataTable label="Revenue rows" data={report.revenueRows} columns={[{ header: 'Record', cell: (row) => row.invoiceNumber || row.orderNumber || row.id || '—' }, { header: 'Amount', cell: (row) => inr(row.totalAmount || row.amount) }, { header: 'Status', cell: (row) => row.status || '—' }, { header: 'Date', cell: (row) => String(row.createdAt || row.date || '').slice(0, 10) }]} /></div>
      </>}
    </HrmNotice>
  </div>;
}
