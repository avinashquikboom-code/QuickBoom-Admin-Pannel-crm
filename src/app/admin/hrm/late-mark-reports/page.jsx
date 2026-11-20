'use client';
import * as React from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/common/Button';
import { HrmNotice } from '@/modules/hrm/HrmNotice';
import { AdminRowActions } from '@/components/common/AdminRowActions';
import {
  exportLateReport,
  hrmError,
  loadLateReport,
  loadLateReportHistory,
  loadLateReportSettings,
  retryLateReport,
  saveLateReportSettings,
} from '@/modules/hrm/hrm-api';

const money = (value) => `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

export default function LateMarkReportsPage() {
  const [tab, setTab] = React.useState('daily');
  const [date, setDate] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [month, setMonth] = React.useState(() => new Date().toISOString().slice(0, 7));
  const [search, setSearch] = React.useState('');
  const [department, setDepartment] = React.useState('');
  const [report, setReport] = React.useState(null);
  const [settings, setSettings] = React.useState(null);
  const [history, setHistory] = React.useState([]);
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = tab === 'monthly'
        ? { year: month.slice(0, 4), month: Number(month.slice(5, 7)), search, department }
        : { date, search, department };
      const [data, mail, deliveries] = await Promise.all([
        loadLateReport(tab, params),
        loadLateReportSettings(),
        loadLateReportHistory(),
      ]);
      setReport(data?.data || data);
      setSettings(mail?.data || mail);
      setHistory(Array.isArray(deliveries) ? deliveries : deliveries?.data || []);
    } catch (err) {
      setError(hrmError(err));
    } finally {
      setLoading(false);
    }
  }, [tab, date, month, search, department]);

  React.useEffect(() => { load(); }, [load]);

  const download = async () => {
    const params = tab === 'monthly'
      ? { kind: 'MONTHLY', year: month.slice(0, 4), month: Number(month.slice(5, 7)) }
      : { kind: tab.toUpperCase(), date };
    const file = await exportLateReport(params);
    const payload = file?.data || file;
    const blob = new Blob([payload.csv || ''], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = payload.filename || 'late-marks.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const summary = report || {};
  const rows = tab === 'daily' ? summary.rows || [] : summary.byEmployee || [];
  const departments = [...new Set((summary.rows || []).map((row) => row.department).filter(Boolean))];

  return (
    <div className="space-y-5">
      <PageHeader title="Late Mark Reports" description="Daily, weekly and monthly late minutes and stored deductions." />
      {error ? <HrmNotice tone="error" message={error} /> : null}
      <div className="flex flex-wrap gap-2">
        {['daily', 'weekly', 'monthly'].map((item) => (
          <Button key={item} variant={tab === item ? 'default' : 'outline'} onClick={() => setTab(item)}>{item[0].toUpperCase() + item.slice(1)}</Button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {tab !== 'monthly' ? <input className="h-10 rounded-xl border px-3 text-sm" type="date" value={date} onChange={(event) => setDate(event.target.value)} /> : <input className="h-10 rounded-xl border px-3 text-sm" type="month" value={month} onChange={(event) => setMonth(event.target.value)} />}
        <input className="h-10 rounded-xl border px-3 text-sm" placeholder="Search employee" value={search} onChange={(event) => setSearch(event.target.value)} />
        <select className="h-10 rounded-xl border px-3 text-sm" value={department} onChange={(event) => setDepartment(event.target.value)}>
          <option value="">All departments</option>
          {departments.map((item) => <option key={item}>{item}</option>)}
        </select>
        <Button variant="outline" onClick={download}>Export CSV</Button>
        <Button variant="outline" onClick={() => window.print()}>Print</Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card label="Total Late Marks" value={summary.totalLateMarks || 0} />
        <Card label="Total Late Minutes" value={`${summary.totalLateMinutes || 0} minutes`} />
        <Card label="Total Deduction" value={money(summary.totalDeduction)} />
        <Card label="Employees Affected" value={summary.employeesAffected || 0} />
      </div>
      {tab === 'daily' ? <p className="text-sm text-slate-600">Scheduled {summary.scheduledEmployees || 0} · Present {summary.presentEmployees || 0} · Rate {summary.configuredRate ? money(summary.configuredRate) : 'stored per row'}/min</p> : null}
      {tab !== 'daily' ? <p className="text-sm text-slate-600">Average {summary.averageLateMinutes || 0} minutes and {money(summary.averageDeduction)} per affected employee.</p> : null}
      {loading ? <p className="text-sm text-slate-500">Loading late-mark records…</p> : (
        <div className="overflow-x-auto rounded-2xl border bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-emerald-50 text-emerald-950">
              {tab === 'daily' ? (
                <tr>{['Employee', 'Shift', 'Punch in', 'Late minutes', 'Rate', 'Deduction'].map((heading) => <th key={heading} className="px-3 py-2">{heading}</th>)}</tr>
              ) : (
                <tr>{['Employee', 'Late days', 'Total late minutes', 'Rate', 'Total deduction'].map((heading) => <th key={heading} className="px-3 py-2">{heading}</th>)}</tr>
              )}
            </thead>
            <tbody>
              {rows.length === 0 ? <tr><td className="px-3 py-4 text-slate-500" colSpan={6}>No eligible late marks for this period.</td></tr> : rows.map((row) => tab === 'daily' ? (
                <tr key={row.id} className="border-t">
                  <td className="px-3 py-2">{row.employeeName}<div className="text-xs text-slate-500">{row.employeeCode} · {row.department}</div></td>
                  <td className="px-3 py-2">{row.shiftStart}–{row.shiftEnd}</td>
                  <td className="px-3 py-2">{row.punchIn || '—'}</td>
                  <td className="px-3 py-2">{row.lateMinutes}</td>
                  <td className="px-3 py-2">{money(row.rate)}</td>
                  <td className="px-3 py-2">{money(row.deduction)}</td>
                </tr>
              ) : (
                <tr key={row.employeeId} className="border-t">
                  <td className="px-3 py-2">{row.employeeName}<div className="text-xs text-slate-500">{row.employeeCode} · {row.department}</div></td>
                  <td className="px-3 py-2">{row.lateDays}</td>
                  <td className="px-3 py-2">{row.totalLateMinutes}</td>
                  <td className="px-3 py-2">{row.rateLabel}</td>
                  <td className="px-3 py-2">{money(row.totalDeduction)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {tab !== 'daily' && (summary.byDate || []).length > 0 ? (
        <div className="rounded-2xl border bg-white p-4">
          <h3 className="mb-3 font-semibold">Daily trend</h3>
          <div className="space-y-2">
            {summary.byDate.map((day) => (
              <div key={day.date} className="grid grid-cols-[110px_1fr_auto] items-center gap-2 text-xs">
                <span>{day.date}</span>
                <div className="h-2 rounded-full bg-emerald-100"><div className="h-2 rounded-full bg-emerald-600" style={{ width: `${Math.min(100, day.totalLateMinutes)}%` }} /></div>
                <span>{day.totalLateMinutes} min · {money(day.totalDeduction)}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      {settings ? <EmailSettings initial={settings} onSaved={load} /> : null}
      <div className="overflow-x-auto rounded-2xl border bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50"><tr>{['Report', 'Period', 'Recipient', 'Status', 'Sent at', ''].map((heading) => <th key={heading} className="px-3 py-2">{heading}</th>)}</tr></thead>
          <tbody>
            {history.length === 0 ? <tr><td className="px-3 py-4 text-slate-500" colSpan={6}>No report emails yet.</td></tr> : history.map((item) => (
              <tr key={item.id} className="border-t">
                <td className="px-3 py-2">{item.kind}</td>
                <td className="px-3 py-2">{item.periodLabel}</td>
                <td className="px-3 py-2">{item.recipients || '—'}</td>
                <td className="px-3 py-2">{item.status}{item.failureReason ? <div className="text-xs text-rose-700">{item.failureReason}</div> : null}</td>
                <td className="px-3 py-2">{item.sentAt ? new Date(item.sentAt).toLocaleString() : '—'}</td>
                <td className="px-3 py-2 text-right">
                  {item.status !== 'SENT' ? (
                    <AdminRowActions
                      record={item}
                      recordName={`${item.kind} report`}
                      actions={[
                        {
                          id: 'retry',
                          label: 'Retry Report Delivery',
                          onClick: () => retryLateReport(item.id).then(load),
                        },
                      ]}
                    />
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Card({ label, value }) {
  return <div className="rounded-2xl border border-emerald-100 bg-white p-4"><div className="text-xs text-slate-500">{label}</div><div className="mt-1 text-2xl font-semibold text-emerald-950">{value}</div></div>;
}

function EmailSettings({ initial, onSaved }) {
  const [form, setForm] = React.useState(initial);
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  return (
    <form className="space-y-3 rounded-2xl border bg-white p-4" onSubmit={async (event) => { event.preventDefault(); await saveLateReportSettings(form); onSaved(); }}>
      <h3 className="font-semibold">Email settings</h3>
      <div className="flex flex-wrap gap-4 text-sm">
        <label><input type="checkbox" checked={!!form.dailyEnabled} onChange={(event) => set('dailyEnabled', event.target.checked)} /> Daily</label>
        <label><input type="checkbox" checked={!!form.weeklyEnabled} onChange={(event) => set('weeklyEnabled', event.target.checked)} /> Weekly</label>
        <label><input type="checkbox" checked={!!form.monthlyEnabled} onChange={(event) => set('monthlyEnabled', event.target.checked)} /> Monthly</label>
        <label><input type="checkbox" checked={form.includeEmployeeDetails !== false} onChange={(event) => set('includeEmployeeDetails', event.target.checked)} /> Employee details</label>
        <label><input type="checkbox" checked={form.includeCsv !== false} onChange={(event) => set('includeCsv', event.target.checked)} /> CSV attachment</label>
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        <input className="h-10 rounded-xl border px-3 text-sm" placeholder="HR and payroll emails, comma separated" value={form.recipients || ''} onChange={(event) => set('recipients', event.target.value)} />
        <input className="h-10 rounded-xl border px-3 text-sm" placeholder="CC emails" value={form.cc || ''} onChange={(event) => set('cc', event.target.value)} />
        <input className="h-10 rounded-xl border px-3 text-sm" placeholder="Timezone" value={form.timezone || 'Asia/Kolkata'} onChange={(event) => set('timezone', event.target.value)} />
        <input className="h-10 rounded-xl border px-3 text-sm" type="number" min="0" max="6" value={form.weekStartsOn ?? 1} onChange={(event) => set('weekStartsOn', Number(event.target.value))} />
      </div>
      <Button type="submit">Save email settings</Button>
    </form>
  );
}
