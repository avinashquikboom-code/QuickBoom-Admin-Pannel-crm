'use client';

import * as React from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { DataTable } from '@/components/common/DataTable';
import { HrmGap, HrmNotice, HrmStats } from '@/modules/hrm/HrmNotice';
import { REPORT_TYPES, exportReport, loadReportData, loadReportSummary, suiteError, suiteGaps } from '@/modules/suite/suite-api';

export default function ReportsPage() {
  const [type, setType] = React.useState('ATTENDANCE');
  const [dateFrom, setDateFrom] = React.useState('');
  const [dateTo, setDateTo] = React.useState('');
  const [summary, setSummary] = React.useState(null);
  const [rows, setRows] = React.useState([]);
  const [page, setPage] = React.useState(1);
  const [pages, setPages] = React.useState(1);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [refresh, setRefresh] = React.useState(0);

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    const params = { type, dateFrom: dateFrom || undefined, dateTo: dateTo || undefined, page, limit: 20 };
    Promise.all([loadReportSummary(params), loadReportData(params)])
      .then(([totals, table]) => { if (!active) return; setSummary(totals?.data || totals); setRows(table.rows); setPages(table.pagination?.totalPages || 1); setError(''); })
      .catch((err) => { if (active) setError(suiteError(err)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [type, dateFrom, dateTo, page, refresh]);

  const body = summary || {};
  const columns = rows[0] ? Object.keys(rows[0]).filter((key) => typeof rows[0][key] !== 'object').slice(0, 6).map((key) => ({ header: key, cell: (row) => String(row[key] ?? '—') })) : [{ header: 'Record', cell: () => '—' }];

  return <div className="mx-auto max-w-7xl space-y-6">
    <PageHeader title="Reports" description="Summary and row data from the reports API." actions={<Button variant="outline" onClick={download}>Export CSV</Button>} />
    <HrmGap title="Available reports" detail={suiteGaps.reports} />
    <div className="grid gap-2 sm:grid-cols-4">
      <select className="h-9 rounded-md border bg-white px-2 text-sm" value={type} onChange={(event) => { setType(event.target.value); setPage(1); }}>{REPORT_TYPES.map((item) => <option key={item}>{item}</option>)}</select>
      <Input type="date" value={dateFrom} onChange={(event) => { setDateFrom(event.target.value); setPage(1); }} />
      <Input type="date" value={dateTo} onChange={(event) => { setDateTo(event.target.value); setPage(1); }} />
      <Button variant="outline" onClick={() => setRefresh((value) => value + 1)}>Refresh</Button>
    </div>
    <HrmNotice loading={loading} error={error} empty={!loading && !error && rows.length === 0 ? 'No rows for this report.' : ''} onRetry={() => setRefresh((value) => value + 1)}>
      <HrmStats items={[
        { label: 'Employees', value: body.workforce?.total },
        { label: 'Active employees', value: body.workforce?.active },
        { label: 'Attendance records', value: body.attendance?.totalRecords },
        { label: 'Present rate', value: body.attendance?.presentRate },
        { label: 'Leave requests', value: body.leaves?.total },
        { label: 'Payroll slips', value: body.payroll?.slipsGenerated },
        { label: 'Net payroll', value: body.payroll?.netDisbursed },
        { label: 'Visits', value: body.visits?.total },
        { label: 'Revenue', value: body.revenue?.totalRevenue },
      ]} />
      <div className="mt-4 overflow-x-auto"><DataTable label={`${type} report`} data={rows} columns={columns} /></div>
      <div className="mt-3 flex justify-end gap-2"><Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</Button><span className="self-center text-xs">Page {page} of {pages}</span><Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage((value) => value + 1)}>Next</Button></div>
    </HrmNotice>
  </div>;

  async function download() {
    try {
      const result = await exportReport({ reportType: type, format: 'CSV', dateFrom: dateFrom || undefined, dateTo: dateTo || undefined });
      const csv = typeof result?.data === 'string' ? result.data : '';
      if (!csv) throw new Error('The export API did not return a file');
      const blob = new Blob([csv], { type: 'text/csv' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = result.filename || `${type}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (err) { toastError(err); }
  }
}
function toastError(error) { import('@/hooks/use-toast').then(({ toast }) => toast.error(suiteError(error))); }
