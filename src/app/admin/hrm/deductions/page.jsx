'use client';

import * as React from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { Checkbox } from '@/components/common/Checkbox';
import { Textarea } from '@/components/common/Textarea';
import { FormDrawer } from '@/components/common/drawers/FormDrawer';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/common/Select';
import { toast } from '@/hooks/use-toast';
import { HrmNotice, HrmStats } from '@/modules/hrm/HrmNotice';
import {
  approveDeduction,
  createDeduction,
  hrmError,
  loadDeductions,
  loadEmployees,
  rejectDeduction,
  removeDeduction,
  reverseDeduction,
  sessionCan,
} from '@/modules/hrm/hrm-api';
import { loadDepartments, loadDesignations } from '@/modules/master/master-api';

const inr = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(value) || 0);

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const STATUSES = ['PENDING', 'APPROVED', 'APPLIED', 'REJECTED', 'REVERSED'];

const emptyForm = { employeeIds: [], amount: '', reason: '', month: String(new Date().getMonth() + 1), year: String(new Date().getFullYear()) };

export default function DeductionsPage() {
  const [rows, setRows] = React.useState([]);
  const [summary, setSummary] = React.useState({});
  const [employees, setEmployees] = React.useState([]);
  const [departments, setDepartments] = React.useState([]);
  const [designations, setDesignations] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [departmentId, setDepartmentId] = React.useState('');
  const [designationId, setDesignationId] = React.useState('');
  const [month, setMonth] = React.useState('');
  const [from, setFrom] = React.useState('');
  const [to, setTo] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [pagination, setPagination] = React.useState({});
  const [refresh, setRefresh] = React.useState(0);
  const [formOpen, setFormOpen] = React.useState(false);
  const [form, setForm] = React.useState(emptyForm);
  const [reviewing, setReviewing] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [rejectTarget, setRejectTarget] = React.useState(null);
  const [rejectReason, setRejectReason] = React.useState('');
  const [reverseTarget, setReverseTarget] = React.useState(null);
  const [reverseReason, setReverseReason] = React.useState('');
  const [canManage, setCanManage] = React.useState(false);

  React.useEffect(() => { setCanManage(sessionCan('SALARY') || sessionCan('HRM')); }, []);

  React.useEffect(() => {
    let active = true;
    loadEmployees().then((people) => { if (active) setEmployees(people); }).catch(() => {});
    Promise.all([loadDepartments().catch(() => []), loadDesignations({ page: 1, limit: 100 }).catch(() => ({ rows: [] }))]).then(([depts, desigs]) => {
      if (!active) return;
      setDepartments(Array.isArray(depts) ? depts : depts?.rows || []);
      setDesignations(desigs?.rows || (Array.isArray(desigs) ? desigs : []));
    });
    return () => { active = false; };
  }, []);

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    loadDeductions({
      page,
      limit: 20,
      search: search || undefined,
      status: status || undefined,
      month: month || undefined,
      year: month ? String(new Date().getFullYear()) : undefined,
      departmentId: departmentId || undefined,
      designationId: designationId || undefined,
      from: from || undefined,
      to: to || undefined,
    }).then((result) => {
      if (!active) return;
      setRows(result.rows);
      setSummary(result.summary || {});
      setPagination(result.pagination || {});
      setError('');
    }).catch((err) => { if (active) setError(hrmError(err)); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [refresh, page, search, status, month, departmentId, designationId, from, to]);

  const activeEmployees = React.useMemo(() => employees.filter((e) => String(e.status).toLowerCase() === 'active'), [employees]);
  const selectedEmployees = React.useMemo(() => activeEmployees.filter((e) => form.employeeIds.includes(e.recordId)), [activeEmployees, form.employeeIds]);
  const perEmployeeAmount = Number(form.amount) || 0;
  const totalAmount = perEmployeeAmount * selectedEmployees.length;
  const allSelected = activeEmployees.length > 0 && form.employeeIds.length === activeEmployees.length;

  const toggleEmployee = (id) => {
    setForm((value) => ({
      ...value,
      employeeIds: value.employeeIds.includes(id) ? value.employeeIds.filter((item) => item !== id) : [...value.employeeIds, id],
    }));
  };
  const toggleAll = () => {
    setForm((value) => ({ ...value, employeeIds: allSelected ? [] : activeEmployees.map((e) => e.recordId) }));
  };

  const beginSubmit = (event) => {
    event.preventDefault();
    if (!form.employeeIds.length) { toast.error('Select at least one employee.'); return; }
    if (!(perEmployeeAmount > 0)) { toast.error('Enter a deduction amount greater than zero.'); return; }
    if (!form.reason.trim()) { toast.error('A deduction reason is required.'); return; }
    setReviewing(true);
  };

  const confirmSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await createDeduction({
        employeeIds: form.employeeIds,
        amount: perEmployeeAmount,
        reason: form.reason.trim(),
        payrollMonth: Number(form.month),
        payrollYear: Number(form.year),
      });
      toast.success(`Deduction created for ${form.employeeIds.length} employee(s)`);
      setFormOpen(false);
      setReviewing(false);
      setForm(emptyForm);
      setRefresh((value) => value + 1);
    } catch (err) {
      toast.error(hrmError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const approve = async (row) => {
    if (row.status !== 'PENDING') { toast.error('Only pending deductions can be approved.'); return; }
    try {
      await approveDeduction(row.recordId);
      toast.success('Deduction approved');
      setRefresh((value) => value + 1);
    } catch (err) { toast.error(hrmError(err)); }
  };

  const submitReject = async (event) => {
    event.preventDefault();
    try {
      await rejectDeduction(rejectTarget.recordId, rejectReason.trim());
      toast.success('Deduction rejected');
      setRejectTarget(null);
      setRejectReason('');
      setRefresh((value) => value + 1);
    } catch (err) { toast.error(hrmError(err)); }
  };

  const submitReverse = async (event) => {
    event.preventDefault();
    try {
      await reverseDeduction(reverseTarget.recordId, reverseReason.trim());
      toast.success('Deduction reversed');
      setReverseTarget(null);
      setReverseReason('');
      setRefresh((value) => value + 1);
    } catch (err) { toast.error(hrmError(err)); }
  };

  const removeRow = async (row) => {
    if (row.status !== 'PENDING') { toast.error('Only pending deductions can be deleted.'); return; }
    try {
      await removeDeduction(row.recordId);
      toast.success('Pending deduction deleted');
      setRefresh((value) => value + 1);
    } catch (err) { toast.error(hrmError(err)); }
  };

  const rowActions = canManage
    ? [
        { label: 'Approve', onSelect: approve },
        { label: 'Reject', onSelect: (row) => row.status === 'PENDING' ? setRejectTarget(row) : toast.error('Only pending deductions can be rejected.') },
        { label: 'Reverse', onSelect: (row) => ['APPROVED', 'APPLIED'].includes(row.status) ? setReverseTarget(row) : toast.error('Only approved or applied deductions can be reversed.') },
        { label: 'Delete', onSelect: removeRow, confirm: true },
      ]
    : [];

  const columns = [
    { header: 'Employee Name', cell: (row) => <p className="font-medium">{row.employeeName}</p> },
    { header: 'Employee ID', cell: (row) => row.employeeId || '—' },
    { header: 'Department', cell: (row) => row.department },
    { header: 'Amount', cell: (row) => inr(row.amount) },
    { header: 'Reason', cell: (row) => <span className="line-clamp-2 max-w-[220px]">{row.reason}</span> },
    { header: 'Payroll Month', cell: (row) => row.payrollMonthLabel },
    { header: 'Created By', cell: (row) => row.createdByName || '—' },
    { header: 'Created Date', cell: (row) => row.createdOn },
    { header: 'Approval Status', cell: (row) => <StatusBadge status={String(row.status || '').toLowerCase()} /> },
    { header: 'Application Status', cell: (row) => row.status === 'APPLIED' ? <StatusBadge status="applied" /> : row.status === 'APPROVED' ? 'Awaiting payroll' : '—' },
  ];

  return (
    <div className="max-w-none min-w-0 w-full space-y-6">
      <PageHeader
        title="Employee Penalty & Deductions"
        description="Create, approve and track employee penalties and salary deductions applied to payroll."
        actions={canManage ? <Button onClick={() => { setForm(emptyForm); setReviewing(false); setFormOpen(true); }}>New deduction</Button> : null}
      />
      <HrmStats items={[
        { label: 'Total Deductions', value: summary.total },
        { label: 'Pending Approval', value: summary.pending },
        { label: 'Approved Deductions', value: summary.approved },
        { label: 'Applied Deductions', value: summary.applied },
        { label: 'Total Deducted Amount', value: summary.totalDeductedAmount == null ? '—' : inr(summary.totalDeductedAmount) },
      ]} />
      <div className="grid grid-cols-1 gap-2 rounded-xl border border-slate-200 bg-white p-3 sm:grid-cols-2 lg:grid-cols-4">
        <Input value={search} onChange={(event) => { setPage(1); setSearch(event.target.value); }} placeholder="Search employee name or ID" />
        <Select value={departmentId || 'ALL'} onValueChange={(value) => { setPage(1); setDepartmentId(value === 'ALL' ? '' : value); }}>
          <SelectTrigger><SelectValue placeholder="Department" /></SelectTrigger>
          <SelectContent><SelectItem value="ALL">All departments</SelectItem>{departments.map((d) => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={designationId || 'ALL'} onValueChange={(value) => { setPage(1); setDesignationId(value === 'ALL' ? '' : value); }}>
          <SelectTrigger><SelectValue placeholder="Designation" /></SelectTrigger>
          <SelectContent><SelectItem value="ALL">All designations</SelectItem>{designations.map((d) => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={status || 'ALL'} onValueChange={(value) => { setPage(1); setStatus(value === 'ALL' ? '' : value); }}>
          <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent><SelectItem value="ALL">All statuses</SelectItem>{STATUSES.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={month || 'ALL'} onValueChange={(value) => { setPage(1); setMonth(value === 'ALL' ? '' : value); }}>
          <SelectTrigger><SelectValue placeholder="Payroll month" /></SelectTrigger>
          <SelectContent><SelectItem value="ALL">All months</SelectItem>{MONTHS.map((name, index) => <SelectItem key={name} value={String(index + 1)}>{name}</SelectItem>)}</SelectContent>
        </Select>
        <Label className="grid gap-1 text-xs text-slate-500">From<Input type="date" value={from} onChange={(event) => { setPage(1); setFrom(event.target.value); }} /></Label>
        <Label className="grid gap-1 text-xs text-slate-500">To<Input type="date" value={to} onChange={(event) => { setPage(1); setTo(event.target.value); }} /></Label>
        <Button variant="outline" onClick={() => setRefresh((value) => value + 1)}>Refresh</Button>
      </div>
      <HrmNotice loading={loading} error={error} empty={!loading && !error && rows.length === 0 ? 'No deductions match these filters.' : ''} onRetry={() => setRefresh((value) => value + 1)}>
        <DataTable columns={columns} data={rows} label="Deductions" rowActions={rowActions} />
      </HrmNotice>
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</Button>
        <Button variant="outline" size="sm" disabled={page >= (pagination.totalPages || 1)} onClick={() => setPage((value) => value + 1)}>Next</Button>
      </div>

      <FormDrawer
        open={formOpen}
        onOpenChange={(open) => { setFormOpen(open); if (!open) setReviewing(false); }}
        title={reviewing ? 'Review deduction' : 'New deduction'}
        description={reviewing ? 'Confirm the deduction details before submitting. Each selected employee receives the full amount.' : 'Apply the same deduction amount to one or more employees.'}
        onSubmit={reviewing ? confirmSubmit : beginSubmit}
        submitLabel={reviewing ? 'Confirm & Submit' : 'Review'}
        loading={submitting}
      >
        {!reviewing ? (
          <div className="grid gap-4">
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Employees</Label>
                <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
                  <Checkbox checked={allSelected} onCheckedChange={toggleAll} /> Select all eligible
                </label>
              </div>
              <div className="max-h-56 space-y-1 overflow-y-auto rounded-lg border border-slate-200 p-2">
                {activeEmployees.map((employee) => (
                  <label key={employee.recordId} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-slate-50">
                    <Checkbox checked={form.employeeIds.includes(employee.recordId)} onCheckedChange={() => toggleEmployee(employee.recordId)} />
                    <span className="min-w-0 flex-1 truncate">{employee.name}</span>
                    <span className="text-xs text-slate-400">{employee.id} · {employee.department}</span>
                  </label>
                ))}
                {activeEmployees.length === 0 && <p className="p-2 text-xs text-slate-500">No active employees found.</p>}
              </div>
              <p className="text-xs text-slate-500">{form.employeeIds.length} employee(s) selected</p>
            </div>
            <Label className="grid gap-1 text-xs">Deduction amount (per employee)<Input required type="number" min="1" step="0.01" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} /></Label>
            <Label className="grid gap-1 text-xs">Reason (required)<Textarea required rows={3} value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} placeholder="Reason for this deduction" /></Label>
            <div className="grid grid-cols-2 gap-3">
              <Label className="grid gap-1 text-xs">Payroll month
                <Select value={form.month} onValueChange={(value) => setForm({ ...form, month: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{MONTHS.map((name, index) => <SelectItem key={name} value={String(index + 1)}>{name}</SelectItem>)}</SelectContent>
                </Select>
              </Label>
              <Label className="grid gap-1 text-xs">Payroll year<Input required type="number" min="2000" max="2100" value={form.year} onChange={(event) => setForm({ ...form, year: event.target.value })} /></Label>
            </div>
          </div>
        ) : (
          <div className="space-y-4 text-sm">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
              <p><span className="font-semibold">Selected employees:</span> {selectedEmployees.length}</p>
              <p><span className="font-semibold">Deduction per employee:</span> {inr(perEmployeeAmount)}</p>
              <p><span className="font-semibold">Total proposed deduction:</span> {inr(totalAmount)}</p>
              <p><span className="font-semibold">Reason:</span> {form.reason}</p>
              <p><span className="font-semibold">Payroll month:</span> {MONTHS[Number(form.month) - 1]} {form.year}</p>
            </div>
            <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-slate-200 p-2 text-xs">
              {selectedEmployees.map((employee) => (
                <div key={employee.recordId} className="flex justify-between gap-2 px-2 py-1">
                  <span className="truncate">{employee.name} ({employee.id})</span>
                  <span className="font-medium">{inr(perEmployeeAmount)}</span>
                </div>
              ))}
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => setReviewing(false)}>Back to edit</Button>
          </div>
        )}
      </FormDrawer>

      <FormDrawer open={Boolean(rejectTarget)} onOpenChange={(open) => { if (!open) setRejectTarget(null); }} title={`Reject deduction — ${rejectTarget?.employeeName || ''}`} onSubmit={submitReject} submitLabel="Reject deduction">
        <div className="grid gap-3 text-sm">
          <p>{rejectTarget ? `${inr(rejectTarget.amount)} · ${rejectTarget.reason}` : ''}</p>
          <Label className="grid gap-1 text-xs">Rejection reason<Input required value={rejectReason} onChange={(event) => setRejectReason(event.target.value)} /></Label>
        </div>
      </FormDrawer>

      <FormDrawer open={Boolean(reverseTarget)} onOpenChange={(open) => { if (!open) setReverseTarget(null); }} title={`Reverse deduction — ${reverseTarget?.employeeName || ''}`} onSubmit={submitReverse} submitLabel="Reverse deduction">
        <div className="grid gap-3 text-sm">
          <p>{reverseTarget ? `${inr(reverseTarget.amount)} · ${reverseTarget.reason} · ${reverseTarget.payrollMonthLabel}` : ''}</p>
          <p className="text-xs text-slate-500">The record is kept for audit. Deductions already finalized in a paid payroll cannot be reversed here.</p>
          <Label className="grid gap-1 text-xs">Reversal reason (required)<Input required value={reverseReason} onChange={(event) => setReverseReason(event.target.value)} /></Label>
        </div>
      </FormDrawer>
    </div>
  );
}
