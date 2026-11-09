'use client';

import * as React from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormDrawer } from '@/components/common/drawers/FormDrawer';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { DataTable, DataTableColumnHeader, AdminRowActions } from '@/components/data-table';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import { faCheck, faDownload, faRotateRight, faXmark } from '@fortawesome/free-solid-svg-icons';
import { toast } from '@/hooks/use-toast';
import { HrmNotice, HrmStats } from '@/modules/hrm/HrmNotice';
import {
  approveOvertime,
  cancelOvertime,
  createOvertime,
  hrmError,
  loadEmployees,
  loadOvertime,
  loadOvertimeRequest,
  previewOvertime,
  rejectOvertime,
} from '@/modules/hrm/hrm-api';
import { downloadCsv, loadDepartments } from '@/modules/master/master-api';

const TYPES = ['REGULAR', 'WEEKEND', 'HOLIDAY', 'NIGHT_SHIFT'];
const STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'];
const inr = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(value) || 0);
const hours = (value) => `${Number(value || 0).toFixed(2)} h`;

export default function OvertimePage() {
  const [rows, setRows] = React.useState([]);
  const [summary, setSummary] = React.useState({});
  const [pagination, setPagination] = React.useState({ page: 1, totalPages: 1, total: 0 });
  const [employees, setEmployees] = React.useState([]);
  const [departments, setDepartments] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [departmentId, setDepartmentId] = React.useState('');
  const [overtimeType, setOvertimeType] = React.useState('');
  const [dateFrom, setDateFrom] = React.useState('');
  const [dateTo, setDateTo] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [refresh, setRefresh] = React.useState(0);
  const [detail, setDetail] = React.useState(null);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [decision, setDecision] = React.useState(null);
  const [saving, setSaving] = React.useState(false);
  const [preview, setPreview] = React.useState(null);
  const debouncedSearch = useDebounced(search);

  React.useEffect(() => { setPage(1); }, [debouncedSearch, status, departmentId, overtimeType, dateFrom, dateTo]);

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    const params = {
      page,
      limit: 20,
      search: debouncedSearch || undefined,
      status: status || undefined,
      departmentId: departmentId || undefined,
      overtimeType: overtimeType || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      sortBy: 'overtimeDate',
      sortOrder: 'desc',
    };
    Promise.all([loadOvertime(params), loadEmployees(), loadDepartments()])
      .then(([result, people, departmentRows]) => {
        if (!active) return;
        setRows(result.rows);
        setSummary(result.summary || {});
        setPagination(result.pagination || {});
        setEmployees(people);
        setDepartments(departmentRows);
        setError('');
      })
      .catch((err) => { if (active) setError(hrmError(err)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [dateFrom, dateTo, debouncedSearch, departmentId, overtimeType, page, refresh, status]);

  const openDetail = async (row) => {
    setDetail(row);
    try { setDetail(await loadOvertimeRequest(row.id)); } catch (err) { toast.error(hrmError(err)); }
  };

  const openApprove = async (row) => {
    setDecision({ mode: 'approve', row, approvedMinutes: row.totalMinutes, managerNotes: '' });
    try { setPreview(await previewOvertime(row.id, row.totalMinutes)); } catch (err) { toast.error(hrmError(err)); }
  };

  const changeApprovedMinutes = async (value) => {
    setDecision((current) => ({ ...current, approvedMinutes: value }));
    if (!decision?.row || !value) return;
    try { setPreview(await previewOvertime(decision.row.id, value)); } catch { setPreview(null); }
  };

  const confirmDecision = async () => {
    if (!decision || saving) return;
    setSaving(true);
    try {
      if (decision.mode === 'approve') {
        await approveOvertime(decision.row.id, { approvedMinutes: Number(decision.approvedMinutes), managerNotes: decision.managerNotes || undefined });
        toast.success('Overtime approved');
      } else if (decision.mode === 'reject') {
        if (!decision.rejectionReason?.trim()) {
          toast.error('A rejection reason is required');
          setSaving(false);
          return;
        }
        await rejectOvertime(decision.row.id, { rejectionReason: decision.rejectionReason.trim(), managerNotes: decision.managerNotes || undefined });
        toast.success('Overtime rejected');
      } else {
        await cancelOvertime(decision.row.id, { managerNotes: decision.managerNotes || undefined });
        toast.success('Overtime cancelled');
      }
      setDecision(null);
      setPreview(null);
      setRefresh((value) => value + 1);
    } catch (err) {
      toast.error(hrmError(err));
    } finally {
      setSaving(false);
    }
  };

  const columns = React.useMemo(() => [
    { accessorKey: 'employeeName', header: ({ column }) => <DataTableColumnHeader column={column} title="Employee" />, cell: ({ row }) => <div><p className="font-semibold text-slate-900">{row.original.employeeName}</p><p className="text-[11px] text-slate-500">{row.original.designation || '—'}</p></div> },
    { accessorKey: 'employeeCode', header: ({ column }) => <DataTableColumnHeader column={column} title="Employee ID" /> },
    { accessorKey: 'department', header: ({ column }) => <DataTableColumnHeader column={column} title="Department" /> },
    { accessorKey: 'overtimeDate', header: ({ column }) => <DataTableColumnHeader column={column} title="Overtime date" />, cell: ({ row }) => String(row.original.overtimeDate).slice(0, 10) },
    { id: 'shift', header: 'Shift', cell: ({ row }) => row.original.shift?.name || '—' },
    { accessorKey: 'overtimeType', header: ({ column }) => <DataTableColumnHeader column={column} title="Type" /> },
    { accessorKey: 'requestedHours', header: ({ column }) => <DataTableColumnHeader column={column} title="Requested" />, cell: ({ row }) => hours(row.original.requestedHours) },
    { accessorKey: 'approvedHours', header: ({ column }) => <DataTableColumnHeader column={column} title="Approved" />, cell: ({ row }) => row.original.approvedHours == null ? '—' : hours(row.original.approvedHours) },
    { accessorKey: 'estimatedAmount', header: ({ column }) => <DataTableColumnHeader column={column} title="Amount" />, cell: ({ row }) => inr(row.original.estimatedAmount) },
    { accessorKey: 'approvalStatus', header: ({ column }) => <DataTableColumnHeader column={column} title="Approval" /> },
    { accessorKey: 'payrollStatus', header: ({ column }) => <DataTableColumnHeader column={column} title="Payroll" /> },
    { id: 'actions', cell: ({ row }) => <RowActions row={row.original} onView={openDetail} onApprove={openApprove} onReject={(item) => setDecision({ mode: 'reject', row: item, rejectionReason: '', managerNotes: '' })} onCancel={(item) => setDecision({ mode: 'cancel', row: item, managerNotes: '' })} /> },
  ], []);

  return (
    <div className="mx-auto max-w-7xl space-y-6 overflow-x-hidden">
      <PageHeader
        title="Overtime Approvals"
        description="Review overtime requests, approve payable time, and send approved amounts to payroll."
        actions={<div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row"><Button type="button" variant="outline" className="h-9 text-xs" onClick={() => setRefresh((value) => value + 1)}><FontAwesomeIcon icon={faRotateRight} className="size-3.5" /> Refresh</Button><Button type="button" variant="outline" className="h-9 text-xs" onClick={() => rows.length ? downloadCsv('overtime-requests.csv', rows.map(csvRow)) : toast.error('There are no overtime requests to export')}><FontAwesomeIcon icon={faDownload} className="size-3.5" /> Export CSV</Button></div>}
      />
      <HrmStats items={[
        { label: 'Total requests', value: summary.totalRequests ?? 0 },
        { label: 'Pending approvals', value: summary.pending ?? 0 },
        { label: 'Approved', value: summary.approved ?? 0 },
        { label: 'Rejected', value: summary.rejected ?? 0 },
      ]} />
      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-6">
        <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search employee or ID" className="h-9 text-xs xl:col-span-2" />
        <Filter value={status} onChange={setStatus} placeholder="Status" options={STATUSES} />
        <Filter value={departmentId} onChange={setDepartmentId} placeholder="Department" options={departments.map((item) => ({ value: String(item.id), label: item.name }))} />
        <Filter value={overtimeType} onChange={setOvertimeType} placeholder="Type" options={TYPES} />
        <div className="grid grid-cols-2 gap-2">
          <Input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="h-9 text-xs" />
          <Input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className="h-9 text-xs" />
        </div>
      </div>
      <HrmNotice loading={loading} error={error} onRetry={() => setRefresh((value) => value + 1)} empty={!loading && !error && rows.length === 0 ? 'No overtime requests match these filters.' : ''} />
      {rows.length ? <RequestCards rows={rows} onView={openDetail} onApprove={openApprove} onReject={(item) => setDecision({ mode: 'reject', row: item, rejectionReason: '', managerNotes: '' })} onCancel={(item) => setDecision({ mode: 'cancel', row: item, managerNotes: '' })} /> : null}
      {rows.length ? <div className="hidden md:block"><DataTable columns={columns} data={rows} hideSearch isLoading={loading} pageSize={20} emptyState="" /></div> : null}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
        <span>{summary.totalApprovedHours ?? 0} approved hours · {inr(summary.compensationAmount)} compensation · {inr(summary.payrollPendingAmount)} waiting for payroll</span>
        <div className="flex gap-2">
          <Button type="button" variant="outline" className="h-9" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</Button>
          <Button type="button" variant="outline" className="h-9" disabled={page >= (pagination.totalPages || 1)} onClick={() => setPage((value) => value + 1)}>Next</Button>
        </div>
      </div>
      <CreateDrawer open={createOpen} employees={employees} saving={saving} onOpenChange={setCreateOpen} onSubmit={async (values) => {
        setSaving(true);
        try {
          await createOvertime(values);
          toast.success('Overtime request submitted');
          setCreateOpen(false);
          setRefresh((value) => value + 1);
        } catch (err) { toast.error(hrmError(err)); } finally { setSaving(false); }
      }} />
      <FormDrawer open={Boolean(detail)} onOpenChange={(open) => { if (!open) setDetail(null); }} showFooter={false} title={detail?.employeeName || 'Overtime request'} description={detail?.employeeCode || ''}>
        {detail ? <DetailBody detail={detail} /> : null}
      </FormDrawer>
      <FormDrawer open={decision?.mode === 'approve' || decision?.mode === 'reject'} onOpenChange={(open) => { if (!open) { setDecision(null); setPreview(null); } }} title={decision?.mode === 'approve' ? 'Approve overtime' : 'Reject overtime'} description={decision?.row?.employeeName || ''} submitLabel={decision?.mode === 'approve' ? 'Confirm approval' : 'Confirm rejection'} loading={saving} onSubmit={(event) => { event.preventDefault(); confirmDecision(); }}>
        {decision?.row ? <div className="space-y-3 text-xs">
          <p>{decision.row.employeeName} · {String(decision.row.overtimeDate).slice(0, 10)} · requested {hours(decision.row.requestedHours)}</p>
          {decision.mode === 'approve' ? <div className="space-y-1.5"><Label>Approved minutes</Label><Input type="number" min="1" max={decision.row.totalMinutes} value={decision.approvedMinutes} onChange={(event) => changeApprovedMinutes(event.target.value)} className="h-9" /><p className="text-slate-500">Preview {inr(preview?.amount)} at {preview?.multiplier || decision.row.compensation?.multiplier}x · {inr(preview?.hourlyRate)} / hour</p></div> : <div className="space-y-1.5"><Label>Rejection reason</Label><Textarea value={decision.rejectionReason || ''} onChange={(event) => setDecision({ ...decision, rejectionReason: event.target.value })} required /></div>}
          <div className="space-y-1.5"><Label>Manager notes</Label><Textarea value={decision.managerNotes || ''} onChange={(event) => setDecision({ ...decision, managerNotes: event.target.value })} /></div>
        </div> : null}
      </FormDrawer>
      <ConfirmDialog open={decision?.mode === 'cancel'} onOpenChange={(open) => { if (!open) setDecision(null); }} title="Cancel overtime request?" description={`Cancel the request for ${decision?.row?.employeeName || 'this employee'}? Processed payroll amounts stay unchanged.`} confirmLabel="Cancel request" variant="destructive" onConfirm={confirmDecision} />
    </div>
  );
}

function RowActions({ row, onView, onApprove, onReject, onCancel }) {
  const pending = row.approvalStatus === 'PENDING';
  const cancellable = ['PENDING', 'APPROVED'].includes(row.approvalStatus) && !['PROCESSED', 'PAID'].includes(row.payrollStatus);

  const actions = [];
  if (pending) {
    actions.push({
      label: 'Approve Request',
      icon: faCheck,
      onClick: () => onApprove(row),
    });
    actions.push({
      label: 'Reject Request',
      icon: faXmark,
      variant: 'destructive',
      onClick: () => onReject(row),
    });
  }
  if (cancellable) {
    actions.push({
      label: 'Cancel Request',
      icon: faXmark,
      variant: 'destructive',
      onClick: () => onCancel(row),
    });
  }

  return (
    <div className="flex justify-end">
      <AdminRowActions
        record={row}
        recordName={row.employeeName ? `${row.employeeName}'s overtime` : 'Overtime request'}
        onView={() => onView(row)}
        viewLabel="View Request"
        actions={actions}
      />
    </div>
  );
}

function RequestCards({ rows, onView, onApprove, onReject, onCancel }) {
  return <div className="grid gap-3 md:hidden">{rows.map((row) => <article key={row.id} className="rounded-2xl border border-slate-200 bg-white p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{row.employeeName}</p><p className="text-xs text-slate-500">{row.employeeCode} · {row.department || 'No department'}</p></div><span className="text-xs font-semibold text-brand-dark">{row.approvalStatus}</span></div><p className="mt-2 text-xs text-slate-600">{String(row.overtimeDate).slice(0, 10)} · {row.overtimeType} · {hours(row.requestedHours)} · {inr(row.estimatedAmount)}</p><p className="mt-1 text-xs text-slate-500">Payroll {row.payrollStatus}</p><div className="mt-3"><RowActions row={row} onView={onView} onApprove={onApprove} onReject={onReject} onCancel={onCancel} /></div></article>)}</div>;
}

function DetailBody({ detail }) {
  const lines = [
    ['Department', detail.department || '—'],
    ['Designation', detail.designation || '—'],
    ['Date', String(detail.overtimeDate).slice(0, 10)],
    ['Time', `${detail.startTime} – ${detail.endTime}`],
    ['Shift', detail.shift?.name || '—'],
    ['Attendance', detail.attendance ? `${detail.attendance.status} · ${detail.attendance.workingHours || 0} h` : '—'],
    ['Requested', hours(detail.requestedHours)],
    ['Approved', detail.approvedHours == null ? '—' : hours(detail.approvedHours)],
    ['Amount', inr(detail.estimatedAmount)],
    ['Rate', detail.compensation ? `${inr(detail.compensation.hourlyRate)} × ${detail.compensation.multiplier}` : '—'],
    ['Reason', detail.reason],
    ['Employee notes', detail.employeeNotes || '—'],
    ['Manager notes', detail.managerNotes || '—'],
    ['Payroll', `${detail.payrollStatus}${detail.payroll ? ` · ${detail.payroll.month}/${detail.payroll.year} ${detail.payroll.status}` : ''}`],
  ];
  return <div className="space-y-4 text-xs"><dl className="space-y-2">{lines.map(([label, value]) => <div key={label} className="flex justify-between gap-3"><dt className="text-slate-500">{label}</dt><dd className="text-right font-medium text-slate-800">{value}</dd></div>)}</dl><div><h3 className="font-semibold text-slate-800">Approval history</h3><ul className="mt-2 space-y-2">{(detail.history || []).map((item) => <li key={item.id} className="rounded-lg border border-slate-200 p-2">{item.action} · {item.fromStatus} to {item.toStatus} · {item.actorName || 'System'}{item.notes ? ` · ${item.notes}` : ''}</li>)}</ul></div></div>;
}

function CreateDrawer({ open, onOpenChange, employees, onSubmit, saving }) {
  const [form, setForm] = React.useState({ employeeId: '', overtimeDate: '', startTime: '', endTime: '', overtimeType: 'REGULAR', reason: '', employeeNotes: '' });
  return <FormDrawer open={open} onOpenChange={onOpenChange} title="New overtime request" description="The request is saved as pending unless company settings auto-approve it." submitLabel="Submit request" loading={saving} onSubmit={(event) => { event.preventDefault(); onSubmit({ ...form, employeeId: Number(form.employeeId) }); }}>
    <div className="grid gap-3">
      <Label>Employee</Label>
      <Select value={form.employeeId} onValueChange={(value) => setForm({ ...form, employeeId: value })}><SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select employee" /></SelectTrigger><SelectContent>{employees.map((employee) => <SelectItem key={employee.recordId || employee.id} value={String(employee.recordId || employee.id)}>{employee.name || `${employee.firstName || ''} ${employee.lastName || ''}`}</SelectItem>)}</SelectContent></Select>
      <Label>Date</Label><Input type="date" value={form.overtimeDate} onChange={(event) => setForm({ ...form, overtimeDate: event.target.value })} required className="h-9 text-xs" />
      <div className="grid grid-cols-2 gap-2"><Input type="time" value={form.startTime} onChange={(event) => setForm({ ...form, startTime: event.target.value })} required className="h-9 text-xs" /><Input type="time" value={form.endTime} onChange={(event) => setForm({ ...form, endTime: event.target.value })} required className="h-9 text-xs" /></div>
      <Select value={form.overtimeType} onValueChange={(value) => setForm({ ...form, overtimeType: value })}><SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger><SelectContent>{TYPES.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent></Select>
      <Textarea value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} placeholder="Reason" required />
      <Textarea value={form.employeeNotes} onChange={(event) => setForm({ ...form, employeeNotes: event.target.value })} placeholder="Employee notes" />
    </div>
  </FormDrawer>;
}

function Filter({ value, onChange, placeholder, options }) {
  return <Select value={value || 'all'} onValueChange={(next) => onChange(next === 'all' ? '' : next)}><SelectTrigger className="h-9 text-xs"><SelectValue placeholder={placeholder} /></SelectTrigger><SelectContent><SelectItem value="all">{placeholder}</SelectItem>{options.map((option) => { const item = typeof option === 'string' ? { value: option, label: option } : option; return <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>; })}</SelectContent></Select>;
}

function csvRow(row) {
  return { employee: row.employeeName, employeeId: row.employeeCode, department: row.department, date: String(row.overtimeDate).slice(0, 10), type: row.overtimeType, requestedHours: row.requestedHours, approvedHours: row.approvedHours, amount: row.estimatedAmount, approvalStatus: row.approvalStatus, payrollStatus: row.payrollStatus };
}

function useDebounced(value) {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => { const timer = setTimeout(() => setDebounced(value), 300); return () => clearTimeout(timer); }, [value]);
  return debounced;
}
