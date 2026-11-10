'use client';

import * as React from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { FormDrawer } from '@/components/common/drawers/FormDrawer';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/common/Select';
import { toast } from '@/hooks/use-toast';
import { HrmNotice, HrmStats } from '@/modules/hrm/HrmNotice';
import { decideRemoteRequest, hrmError, loadEmployees, loadRemoteRequests, sessionCan, submitRemoteRequest } from '@/modules/hrm/hrm-api';

const emptyForm = { employeeId: '', fromDate: '', toDate: '', startTime: '09:00 AM', endTime: '06:00 PM', days: 1, reason: '' };

export default function RemoteWorkPage() {
  const [rows, setRows] = React.useState([]);
  const [summary, setSummary] = React.useState({});
  const [employees, setEmployees] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [status, setStatus] = React.useState('ALL');
  const [employeeId, setEmployeeId] = React.useState('ALL');
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [pagination, setPagination] = React.useState({});
  const [refresh, setRefresh] = React.useState(0);
  const [formOpen, setFormOpen] = React.useState(false);
  const [form, setForm] = React.useState(emptyForm);
  const [decision, setDecision] = React.useState(null);
  const [reason, setReason] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [canReview, setCanReview] = React.useState(false);
  React.useEffect(() => { setCanReview(sessionCan('REMOTE') || sessionCan('HRM')); }, []);

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([
      loadRemoteRequests({ search: search || undefined, status, employeeId, startDate: startDate || undefined, endDate: endDate || undefined, page, limit: 100 }),
      loadEmployees(),
    ]).then(([result, people]) => {
      if (!active) return;
      setRows(result.rows);
      setSummary(result.summary);
      setPagination(result.pagination);
      setEmployees(people);
      setError('');
    }).catch((err) => { if (active) setError(hrmError(err)); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [refresh, search, status, employeeId, startDate, endDate, page]);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await submitRemoteRequest({ ...form, employeeId: Number(form.employeeId), days: Number(form.days) || 1 });
      setFormOpen(false);
      setRefresh((value) => value + 1);
      toast.success('Remote work request submitted');
    } catch (err) {
      toast.error(hrmError(err));
    } finally {
      setSaving(false);
    }
  };
  const review = async (event) => {
    event.preventDefault();
    if (!decision) return;
    setSaving(true);
    try {
      await decideRemoteRequest(decision.row.id, decision.approve, reason);
      setDecision(null);
      setReason('');
      setRefresh((value) => value + 1);
      toast.success(decision.approve ? 'Remote work approved' : 'Remote work rejected');
    } catch (err) {
      toast.error(hrmError(err));
    } finally {
      setSaving(false);
    }
  };
  const monthDays = React.useMemo(() => {
    const anchor = startDate ? new Date(startDate) : new Date();
    if (Number.isNaN(anchor.getTime())) return [];
    const year = anchor.getFullYear();
    const month = anchor.getMonth();
    const count = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: count }, (_, index) => {
      const day = new Date(year, month, index + 1);
      const key = day.toISOString().slice(0, 10);
      const matches = rows.filter((row) => row.fromDate <= key && row.toDate >= key);
      return { key, count: matches.length };
    });
  }, [rows, startDate]);

  const columns = [
    { header: 'Employee', cell: (row) => <div><p className="font-medium">{row.employeeName}</p><p className="text-xs text-slate-500">{row.employeeCode} · {row.department}</p></div> },
    { header: 'Dates', cell: (row) => row.remoteWorkDate },
    { header: 'Days', accessorKey: 'days' },
    { header: 'Reason', accessorKey: 'reason' },
    { header: 'Status', cell: (row) => <StatusBadge status={String(row.status || '').toLowerCase()} /> },
    { header: 'Decision', cell: (row) => row.approvedByName || row.rejectedByName || '—' },
  ];

  return (
    <div className="max-w-none min-w-0 w-full space-y-6">
      <PageHeader title="Remote Work" description="Remote work requests, approvals, and the dates covered by the current result set." actions={canReview ? <Button onClick={() => { setForm(emptyForm); setFormOpen(true); }}>New request</Button> : null} />
      <HrmStats items={[
        { label: 'Total', value: summary.totalRequests },
        { label: 'Pending', value: summary.pending },
        { label: 'Approved', value: summary.approved },
        { label: 'Remote today', value: summary.todayRemoteWork },
      ]} />
      <div className="grid grid-cols-1 gap-2 rounded-xl border border-slate-200 bg-white p-3 sm:grid-cols-2 lg:grid-cols-6">
        <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search employee or reason" />
        <Select value={status} onValueChange={setStatus}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select>
        <Select value={employeeId} onValueChange={setEmployeeId}><SelectTrigger><SelectValue placeholder="Employee" /></SelectTrigger><SelectContent><SelectItem value="ALL">All employees</SelectItem>{employees.map((employee) => <SelectItem key={employee.recordId} value={String(employee.recordId)}>{employee.name}</SelectItem>)}</SelectContent></Select>
        <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} aria-label="From date" />
        <Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} aria-label="To date" />
        <Button variant="outline" onClick={() => setRefresh((value) => value + 1)}>Refresh</Button>
      </div>
      <div className="grid grid-cols-7 gap-1 overflow-hidden rounded-xl border border-slate-200 bg-white p-3 text-center text-[11px]">
        {monthDays.map((day) => <div key={day.key} className="rounded-md border border-slate-100 p-1"><p>{day.key.slice(8)}</p><p className="font-semibold text-brand-dark">{day.count}</p></div>)}
      </div>
      <HrmNotice loading={loading} error={error} empty={!loading && !error && rows.length === 0 ? 'No remote work requests match these filters.' : ''} onRetry={() => setRefresh((value) => value + 1)}>
        <DataTable columns={columns} data={rows} label="Remote work requests" rowActions={canReview ? [{ label: 'Approve', onSelect: (row) => setDecision({ row, approve: true }) }, { label: 'Reject', onSelect: (row) => setDecision({ row, approve: false }) }] : []} />
      </HrmNotice>
      <div className="flex items-center justify-between text-xs text-slate-500"><span>Page {pagination.page || page} of {pagination.totalPages || 1}</span><span className="space-x-2"><Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</Button><Button variant="outline" size="sm" disabled={page >= (pagination.totalPages || 1)} onClick={() => setPage((value) => value + 1)}>Next</Button></span></div>
      <FormDrawer open={formOpen} onOpenChange={setFormOpen} title="Remote work request" description="Submit a request for a selected employee." onSubmit={submit} loading={saving}>
        <div className="grid gap-3">
          <Label className="grid gap-1 text-xs">Employee<Select value={String(form.employeeId || '')} onValueChange={(value) => setForm({ ...form, employeeId: value })}><SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger><SelectContent>{employees.map((employee) => <SelectItem key={employee.recordId} value={String(employee.recordId)}>{employee.name}</SelectItem>)}</SelectContent></Select></Label>
          <Label className="grid gap-1 text-xs">From<Input type="date" required value={form.fromDate} onChange={(event) => setForm({ ...form, fromDate: event.target.value })} /></Label>
          <Label className="grid gap-1 text-xs">To<Input type="date" required value={form.toDate} onChange={(event) => setForm({ ...form, toDate: event.target.value })} /></Label>
          <Label className="grid gap-1 text-xs">Reason<Input required value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} /></Label>
        </div>
      </FormDrawer>
      <FormDrawer open={Boolean(decision)} onOpenChange={(open) => { if (!open) setDecision(null); }} title={decision?.approve ? 'Approve remote work' : 'Reject remote work'} description={decision?.row?.employeeName || ''} onSubmit={review} loading={saving} submitLabel={decision?.approve ? 'Approve' : 'Reject'}>
        {!decision?.approve && <Label className="grid gap-1 text-xs">Rejection reason<Input required value={reason} onChange={(event) => setReason(event.target.value)} /></Label>}
        {decision?.row?.rejectionReason && <p className="text-sm text-slate-500">Previous reason: {decision.row.rejectionReason}</p>}
      </FormDrawer>
    </div>
  );
}
