'use client';

import * as React from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/common/Button';
import { hrmError, loadReport, loadReportSummary } from '@/modules/hrm/hrm-api';
import { HrmNotice } from '@/modules/hrm/HrmNotice';

const types = ['ATTENDANCE', 'EMPLOYEES', 'LEAVES', 'PAYROLL'];

export default function HrmReportsPage() {
  const [summary, setSummary] = React.useState(null);
  const [type, setType] = React.useState('ATTENDANCE');
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  const load = React.useCallback((nextType) => {
    setLoading(true);
    setError('');
    Promise.all([loadReportSummary(), loadReport(nextType)])
      .then(([nextSummary, nextRows]) => { setSummary(nextSummary); setRows(nextRows); })
      .catch((err) => setError(hrmError(err)))
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(() => { load(type); }, [load, type]);

  const exportCsv = () => {
    if (!rows.length) return;
    const keys = Object.keys(rows[0]).filter((key) => typeof rows[0][key] !== 'object');
    const csv = [keys.join(','), ...rows.map((row) => keys.map((key) => `"${String(row[key] ?? '').replaceAll('"', '""')}"`).join(','))].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${type.toLowerCase()}-report.csv`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader title="HRM Reports" description="Attendance, employee, leave, and payroll reports from the reports API." actions={<Button size="sm" className="h-9 bg-brand text-xs text-primary-foreground" onClick={exportCsv} disabled={!rows.length}>Export CSV</Button>} />
      <div className="grid grid-cols-1 min-[440px]:grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">Employees</p><p className="text-xl font-semibold">{summary?.workforce?.total ?? '—'}</p></div>
        <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">Active</p><p className="text-xl font-semibold">{summary?.workforce?.active ?? '—'}</p></div>
        <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">Attendance rate</p><p className="text-xl font-semibold">{summary?.attendance?.presentRate ?? '—'}</p></div>
        <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">Pending leave</p><p className="text-xl font-semibold">{summary?.leaves?.pending ?? '—'}</p></div>
      </div>
      <div className="flex flex-wrap gap-2">
        {types.map((item) => (
          <button key={item} type="button" onClick={() => setType(item)} className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${type === item ? 'border-[#16A34A] bg-[#16A34A] text-white' : 'border-slate-200 bg-white text-slate-600'}`}>{item}</button>
        ))}
      </div>
      <HrmNotice loading={loading} error={error} onRetry={() => load(type)} empty={!loading && !rows.length ? 'This report returned no rows for the current period.' : ''} />
      {!loading && !error && rows.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500">
              <tr>{Object.keys(rows[0]).filter((key) => typeof rows[0][key] !== 'object').slice(0, 6).map((key) => <th key={key} className="px-3 py-2 font-semibold">{key}</th>)}</tr>
            </thead>
            <tbody>
              {rows.slice(0, 50).map((row, index) => (
                <tr key={row.id || index} className="border-t border-slate-100">
                  {Object.keys(rows[0]).filter((key) => typeof rows[0][key] !== 'object').slice(0, 6).map((key) => <td key={key} className="px-3 py-2 text-slate-700">{String(row[key] ?? '—')}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
