'use client';

import * as React from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { StatusBadge } from '@/components/common/StatusBadge';
import { DataTable } from '@/components/common/DataTable';
import { HrmGap, HrmNotice } from '@/modules/hrm/HrmNotice';
import { rowsOf, suiteError } from '@/modules/suite/suite-api';
import api from '../../../../lib/api';

const links = [
  ['Add employee', '/admin/hrm/employees'],
  ['Add lead', '/admin/crm/leads'],
  ['Create task', '/admin/crm/tasks'],
  ['Review leave', '/admin/hrm/leaves'],
  ['Salary slips', '/admin/hrm/salary-slips'],
];

export default function AdminDashboardPage() {
  const [dateFrom, setDateFrom] = React.useState('');
  const [dateTo, setDateTo] = React.useState('');
  const [data, setData] = React.useState(null);
  const [failed, setFailed] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [refresh, setRefresh] = React.useState(0);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    const params = { dateFrom: dateFrom || undefined, dateTo: dateTo || undefined };
    const calls = {
      summary: () => api.get('/reports/summary', { params }),
      leads: () => api.get('/leads/metrics'),
      customers: () => api.get('/customers/metrics'),
      deals: () => api.get('/deals/metrics'),
      tasks: () => api.get('/tasks/metrics'),
      claims: () => api.get('/claims/metrics'),
      invoices: () => api.get('/invoices', { params: { page: 1, limit: 1 } }),
      attendance: () => api.get('/admin/hrms/live-dashboard'),
      recentLeads: () => api.get('/leads', { params: { page: 1, limit: 5 } }),
      attendanceRows: () => api.get('/reports/data', { params: { ...params, type: 'ATTENDANCE', page: 1, limit: 5 } }),
      leaves: () => api.get('/leaves/requests', { params: { status: 'PENDING', page: 1, limit: 5 } }),
      activity: () => api.get('/audit-logs', { params: { page: 1, limit: 8 } }),
    };
    Promise.all(Object.entries(calls).map(async ([key, load]) => {
      try { return [key, await load(), null]; } catch (error) { return [key, null, suiteError(error)]; }
    })).then((results) => {
      if (!active) return;
      const next = {};
      const errors = [];
      results.forEach(([key, payload, error]) => { next[key] = payload; if (error) errors.push({ key, error }); });
      setData(next);
      setFailed(errors);
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [dateFrom, dateTo, refresh]);

  const summary = objectOf(data?.summary);
  const leads = objectOf(data?.leads);
  const customers = objectOf(data?.customers);
  const deals = objectOf(data?.deals);
  const tasks = objectOf(data?.tasks);
  const claims = objectOf(data?.claims);
  const invoices = data?.invoices?.summary || data?.invoices?.data?.summary || {};
  const live = objectOf(data?.attendance)?.summary || objectOf(data?.attendance);
  const recentLeads = rowsOf(data?.recentLeads);
  const punches = rowsOf(data?.attendanceRows);
  const pendingLeaves = rowsOf(data?.leaves);
  const leaveCounts = data?.leaves?.counts || {};
  const activity = rowsOf(data?.activity);
  const failedNames = failed.map((item) => item.key).join(', ');

  return <div className="max-w-none w-full min-w-0 space-y-4 sm:space-y-6">
    <PageHeader
      title={`${greeting}`}
      description={`${new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}. Workforce, payroll, and revenue use the selected dates. Lead, customer, deal, and task counts are current totals.`}
      actions={<Button variant="outline" className="h-9 px-4 text-xs font-medium w-full sm:w-auto" onClick={() => setRefresh((value) => value + 1)}>Refresh</Button>}
    />
    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3 w-full max-w-full sm:max-w-md lg:max-w-lg">
      <div className="flex flex-col gap-1 min-w-0 w-full">
        <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">From Date</label>
        <Input type="date" aria-label="From date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="h-9 w-full min-w-0 text-xs sm:text-sm bg-white border-slate-200" />
      </div>
      <div className="flex flex-col gap-1 min-w-0 w-full">
        <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">To Date</label>
        <Input type="date" aria-label="To date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className="h-9 w-full min-w-0 text-xs sm:text-sm bg-white border-slate-200" />
      </div>
    </div>
    {failed.length > 0 && <HrmNotice error={`These requests failed: ${failedNames}. ${failed[0].error}`} onRetry={() => setRefresh((value) => value + 1)} />}
    <HrmGap title="Charts without a time series" detail="There is no monthly revenue series, sales-target comparison, employee performance ranking, production overview, or customer-growth series. Those sections are omitted. Counts below are the fields each API returned." />
    <HrmNotice loading={loading} empty={!loading && !data ? 'Dashboard data has not loaded.' : ''}>
      <div className="grid grid-cols-1 min-[440px]:grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full">
        <Kpi title="Total employees" value={summary.workforce?.total} failed={has(failed, 'summary')} />
        <Kpi title="Active leads" value={numberOr(leads.total, leads.new)} failed={has(failed, 'leads')} note={`${leads.new ?? '—'} new`} />
        <Kpi title="Total customers" value={customers.totalCustomers} failed={has(failed, 'customers')} note={`${customers.activeCustomers ?? '—'} active`} />
        <Kpi title="Revenue in range" value={summary.revenue?.totalRevenue} failed={has(failed, 'summary')} />
      </div>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4 w-full min-w-0">
        <Panel title="Attendance in range" failed={has(failed, 'summary')}><Bars items={[['Present', summary.attendance?.present], ['Absent', summary.attendance?.absent], ['Late', summary.attendance?.late], ['On leave', summary.attendance?.onLeave]]} /></Panel>
        <Panel title="Today's live attendance" failed={has(failed, 'attendance')}><Bars items={[['Present', live.present], ['Absent', live.absent], ['Late', live.late], ['On break', live.onBreak]]} /></Panel>
        <Panel title="Leads by stage" failed={has(failed, 'leads')}><Bars items={(Array.isArray(leads.stages) ? leads.stages : []).map((stage) => [stage.name, stage.count])} /></Panel>
        <Panel title="Deal pipeline" failed={has(failed, 'deals')}><Bars items={[['Open', deals.open], ['Won', deals.won], ['Lost', deals.lost]]} /><p className="mt-2.5 truncate text-xs text-slate-500">Open value {deals.pipelineValue ?? '—'} · Won value {deals.wonValue ?? '—'}</p></Panel>
        <Panel title="Tasks" failed={has(failed, 'tasks')}><Bars items={[['Pending', tasks.pending], ['In progress', tasks.inProgress], ['Completed', tasks.completed], ['Overdue', tasks.overdue]]} /></Panel>
        <Panel title="Payroll in range" failed={has(failed, 'summary')}><Bars items={[['Gross', summary.payroll?.grossSalary], ['Deductions', summary.payroll?.totalDeductions], ['Net', summary.payroll?.netDisbursed]]} /><p className="mt-2.5 truncate text-xs text-slate-500">{summary.payroll?.slipsGenerated ?? '—'} slips</p></Panel>
        <Panel title="Customers" failed={has(failed, 'customers')}><Bars items={[['Total', customers.totalCustomers], ['Active', customers.activeCustomers], ['New', customers.newCustomers], ['Inactive', customers.inactiveCustomers]]} /></Panel>
        <Panel title="Collections and claims" failed={has(failed, 'invoices') || has(failed, 'claims')}><Bars items={[['Pending invoices', invoices.pendingPayments ?? invoices.pendingInvoices], ['Paid invoices', invoices.paidInvoices], ['Pending claims', claims.pendingClaims], ['Claimed amount', claims.totalClaimed]]} /></Panel>
      </div>
      <div className="mt-4 rounded-xl border border-slate-200/80 bg-white p-3.5 sm:p-5 shadow-xs min-w-0 overflow-hidden w-full">
        <h2 className="mb-3 text-sm sm:text-base font-semibold text-slate-900">Recent leads</h2>
        {has(failed, 'recentLeads') ? (
          <p className="text-xs sm:text-sm text-rose-700">Recent leads could not be loaded.</p>
        ) : (
          <div className="w-full overflow-x-auto -mx-3.5 px-3.5 sm:mx-0 sm:px-0">
            <DataTable
              label="Recent leads"
              data={recentLeads}
              columns={[
                { header: 'Lead', cell: (row) => row.title || [row.firstName, row.lastName].filter(Boolean).join(' ') || '—' },
                { header: 'Company', cell: (row) => row.companyName || row.company?.name || '—' },
                { header: 'Source', cell: (row) => row.source || '—' },
                { header: 'Status', cell: (row) => <StatusBadge status={String(row.status || '').toLowerCase()} /> },
                { header: 'Assigned', cell: (row) => row.assignedEmployee?.name || row.employeeName || row.assignedTo?.name || '—' },
                { header: 'Created', cell: (row) => String(row.createdAt || '').slice(0, 10) },
              ]}
            />
          </div>
        )}
      </div>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4 w-full min-w-0">
        <Panel title="Recent attendance" failed={has(failed, 'attendanceRows')}>
          <List rows={punches} render={(row) => `${row.date || ''} · ${row.employeeName || 'Employee'} · ${row.status || ''}`} />
        </Panel>
        <Panel title="Recent activity" failed={has(failed, 'activity')}>
          <List rows={activity} render={(row) => `${String(row.createdAt || '').slice(0, 16).replace('T', ' ')} · ${row.action || 'Action'} · ${row.module || ''}`} />
        </Panel>
        <Panel title="Pending leave" failed={has(failed, 'leaves')}>
          <p className="mb-2 text-xs text-slate-500 font-medium">{leaveCounts.pending ?? pendingLeaves.length} pending</p>
          <List rows={pendingLeaves} render={(row) => `${row.employee?.name || row.employeeCode || 'Employee'} · ${row.leaveType || ''} · ${row.fromDate || ''}`} />
        </Panel>
        <Panel title="Quick actions">
          <div className="flex flex-wrap gap-2">
            {links.map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className="inline-flex items-center justify-center rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-white shadow-2xs transition-colors hover:bg-primary-hover active:scale-95"
              >
                {label}
              </Link>
            ))}
          </div>
        </Panel>
      </div>
    </HrmNotice>
  </div>;
}

function objectOf(payload) {
  if (!payload || typeof payload !== 'object') return {};
  if (payload.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) return payload.data.summary && payload.data.workforce == null && payload.data.present == null ? payload.data : payload.data;
  return payload;
}
function has(failed, key) { return failed.some((item) => item.key === key); }
function numberOr(value, fallback) { return value ?? fallback; }
function Kpi({ title, value, failed, note }) {
  return (
    <div className="flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-xs min-w-0 h-full">
      <p className="truncate text-xs font-medium text-slate-500">{title}</p>
      <p className="mt-1.5 truncate text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
        {failed ? 'Failed' : value ?? '—'}
      </p>
      <div className="mt-1 min-h-[16px]">
        {note && !failed && <p className="truncate text-[11px] text-slate-400">{note}</p>}
      </div>
    </div>
  );
}
function Panel({ title, failed, children }) {
  return (
    <section className="flex flex-col rounded-xl border border-slate-200/80 bg-white p-3.5 sm:p-5 shadow-xs min-w-0 overflow-hidden w-full">
      <h2 className="truncate text-sm sm:text-base font-semibold text-slate-900">{title}</h2>
      {failed ? <p className="mt-2 text-xs sm:text-sm text-rose-700">This section failed to load.</p> : <div className="mt-3 min-w-0 w-full flex-1">{children}</div>}
    </section>
  );
}
function Bars({ items }) {
  const max = Math.max(1, ...items.map(([, value]) => Number(value) || 0));
  return (
    <div className="space-y-2.5 w-full min-w-0">
      {items.map(([label, value]) => (
        <div key={label} className="min-w-0">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="truncate text-slate-600 font-medium">{label}</span>
            <span className="shrink-0 font-semibold text-slate-900">{value ?? '—'}</span>
          </div>
          <div className="mt-1 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-brand transition-all duration-300"
              style={{ width: `${Math.min(100, Math.round(((Number(value) || 0) / max) * 100))}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
function List({ rows, render }) {
  if (!rows.length) return <p className="text-xs sm:text-sm text-slate-500">No records returned.</p>;
  return (
    <ul className="space-y-2 text-xs sm:text-sm">
      {rows.slice(0, 5).map((row, index) => (
        <li key={row.id || index} className="truncate border-b border-slate-100 pb-2 last:border-0 last:pb-0 text-slate-700">
          {render(row)}
        </li>
      ))}
    </ul>
  );
}
