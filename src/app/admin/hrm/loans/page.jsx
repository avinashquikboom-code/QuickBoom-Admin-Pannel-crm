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
import { HrmGap, HrmNotice, HrmStats } from '@/modules/hrm/HrmNotice';
import { approveLoan, hrmError, loadEmployees, loadLoans, missingHrmApis, rejectLoan, removeLoan, sessionCan, submitLoan } from '@/modules/hrm/hrm-api';

const inr = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(value) || 0);
const emptyForm = { employeeId: '', loanTypeId: '', loanAmount: '', reason: '', termMonths: 12, interestRate: 0, monthlyEmi: '' };

export default function LoansPage() {
  const [rows, setRows] = React.useState([]);
  const [metrics, setMetrics] = React.useState({});
  const [types, setTypes] = React.useState([]);
  const [employees, setEmployees] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [employeeId, setEmployeeId] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [pagination, setPagination] = React.useState({});
  const [refresh, setRefresh] = React.useState(0);
  const [formOpen, setFormOpen] = React.useState(false);
  const [form, setForm] = React.useState(emptyForm);
  const [selected, setSelected] = React.useState(null);
  const [rejectReason, setRejectReason] = React.useState('');
  const [canManage, setCanManage] = React.useState(false);
  React.useEffect(() => { setCanManage(sessionCan('LOAN') || sessionCan('HRM')); }, []);

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([
      loadLoans({ page, limit: 20, search: search || undefined, status: status || undefined, employeeId: employeeId || undefined }),
      loadEmployees(),
    ]).then(([result, people]) => {
      if (!active) return;
      setRows(result.rows);
      setMetrics(result.metrics);
      setTypes(result.types);
      setPagination(result.pagination);
      setEmployees(people);
      setError('');
    }).catch((err) => { if (active) setError(hrmError(err)); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [refresh, page, search, status, employeeId]);

  const chooseType = (id) => {
    const type = types.find((item) => String(item.id) === id);
    setForm({ ...form, loanTypeId: id, termMonths: type?.maxMonths || form.termMonths, interestRate: type?.interestRate ?? form.interestRate });
  };
  const submit = async (event) => {
    event.preventDefault();
    const type = types.find((item) => String(item.id) === String(form.loanTypeId));
    try {
      await submitLoan({
        employeeId: Number(form.employeeId),
        loanAmount: Number(form.loanAmount),
        reason: form.reason,
        termMonths: Number(form.termMonths) || undefined,
        interestRate: Number(form.interestRate) || 0,
        monthlyEmi: form.monthlyEmi === '' ? undefined : Number(form.monthlyEmi),
        notes: type ? `Loan type: ${type.code} — ${type.name}` : undefined,
      });
      setFormOpen(false);
      setRefresh((value) => value + 1);
      toast.success('Loan request submitted');
    } catch (err) {
      toast.error(hrmError(err));
    }
  };
  const approve = async (row) => {
    try {
      await approveLoan(row.id, { approvedAmount: row.loanAmount, monthlyEmi: row.monthlyEmi, termMonths: row.termMonths });
      setRefresh((value) => value + 1);
      toast.success('Loan approved');
    } catch (err) {
      toast.error(hrmError(err));
    }
  };
  const reject = async (event) => {
    event.preventDefault();
    try {
      await rejectLoan(selected.id, rejectReason);
      setSelected(null);
      setRejectReason('');
      setRefresh((value) => value + 1);
      toast.success('Loan rejected');
    } catch (err) {
      toast.error(hrmError(err));
    }
  };

  const columns = [
    { header: 'Employee', cell: (row) => <div><p className="font-medium">{row.employeeName}</p><p className="text-xs text-slate-500">{row.employee?.employeeCode} · {row.department}</p></div> },
    { header: 'Requested', cell: (row) => inr(row.loanAmount) },
    { header: 'Approved', cell: (row) => row.approvedAmount == null ? '—' : inr(row.approvedAmount) },
    { header: 'EMI', cell: (row) => inr(row.monthlyEmi) },
    { header: 'Tenure', cell: (row) => `${row.termMonths || 0} months` },
    { header: 'Interest', cell: (row) => `${row.interestRate ?? 0}%` },
    { header: 'Balance', cell: (row) => row.remainingBalance == null ? '—' : inr(row.remainingBalance) },
    { header: 'Status', cell: (row) => <StatusBadge status={String(row.status || '').toLowerCase()} /> },
  ];

  return (
    <div className="max-w-none min-w-0 w-full space-y-6">
      <PageHeader title="Loans" description="Employee loan requests, approvals, EMI, and remaining balance." actions={canManage ? <Button onClick={() => { setForm(emptyForm); setFormOpen(true); }}>New loan</Button> : null} />
      <HrmStats items={[
        { label: 'Total loans', value: metrics.totalLoans },
        { label: 'Pending', value: metrics.pendingLoans },
        { label: 'Active', value: metrics.activeLoans },
        { label: 'Outstanding', value: metrics.totalOutstanding == null ? '—' : inr(metrics.totalOutstanding) },
      ]} />
      <HrmGap title="Repayment history and payroll deduction" detail={`${missingHrmApis.loanRepayment} ${missingHrmApis.loanPayroll}`} />
      <div className="grid grid-cols-1 gap-2 rounded-xl border border-slate-200 bg-white p-3 sm:grid-cols-2 lg:grid-cols-4">
        <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search employee or reason" />
        <Select value={status || 'ALL'} onValueChange={(value) => setStatus(value === 'ALL' ? '' : value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{['ALL', 'PENDING', 'APPROVED', 'ACTIVE', 'REJECTED', 'PAID'].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select>
        <Select value={employeeId || 'ALL'} onValueChange={(value) => setEmployeeId(value === 'ALL' ? '' : value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">All employees</SelectItem>{employees.map((employee) => <SelectItem key={employee.recordId} value={String(employee.recordId)}>{employee.name}</SelectItem>)}</SelectContent></Select>
        <Button variant="outline" onClick={() => setRefresh((value) => value + 1)}>Refresh</Button>
      </div>
      <HrmNotice loading={loading} error={error} empty={!loading && !error && rows.length === 0 ? 'No loans match these filters.' : ''} onRetry={() => setRefresh((value) => value + 1)}>
        <DataTable columns={columns} data={rows} label="Loans" rowActions={[{ label: 'View', onSelect: setSelected }, ...(canManage ? [{ label: 'Approve', onSelect: approve }, { label: 'Delete', onSelect: async (row) => { try { await removeLoan(row.id); setRefresh((value) => value + 1); } catch (err) { toast.error(hrmError(err)); } } }] : [])]} />
      </HrmNotice>
      <div className="flex justify-end gap-2"><Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</Button><Button variant="outline" size="sm" disabled={page >= (pagination.totalPages || 1)} onClick={() => setPage((value) => value + 1)}>Next</Button></div>
      <FormDrawer open={formOpen} onOpenChange={setFormOpen} title="Loan request" description={missingHrmApis.loanTypeField} onSubmit={submit}>
        <div className="grid gap-3">
          <Label className="grid gap-1 text-xs">Employee<Select value={String(form.employeeId)} onValueChange={(value) => setForm({ ...form, employeeId: value })}><SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger><SelectContent>{employees.map((employee) => <SelectItem key={employee.recordId} value={String(employee.recordId)}>{employee.name}</SelectItem>)}</SelectContent></Select></Label>
          <Label className="grid gap-1 text-xs">Loan type<Select value={String(form.loanTypeId)} onValueChange={chooseType}><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger><SelectContent>{types.map((type) => <SelectItem key={type.id} value={String(type.id)}>{type.name}</SelectItem>)}</SelectContent></Select></Label>
          <Label className="grid gap-1 text-xs">Amount<Input required type="number" min="1" value={form.loanAmount} onChange={(event) => setForm({ ...form, loanAmount: event.target.value })} /></Label>
          <Label className="grid gap-1 text-xs">Tenure months<Input type="number" value={form.termMonths} onChange={(event) => setForm({ ...form, termMonths: event.target.value })} /></Label>
          <Label className="grid gap-1 text-xs">Interest rate<Input type="number" step="0.1" value={form.interestRate} onChange={(event) => setForm({ ...form, interestRate: event.target.value })} /></Label>
          <Label className="grid gap-1 text-xs">Reason<Input required value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} /></Label>
        </div>
      </FormDrawer>
      <FormDrawer open={Boolean(selected)} onOpenChange={(open) => { if (!open) setSelected(null); }} title={selected?.employeeName || 'Loan'} description={selected?.reason || ''} onSubmit={reject} submitLabel="Reject" showFooter={canManage && selected?.status === 'PENDING'}>
        {selected && <div className="space-y-2 text-sm"><p>Requested {inr(selected.loanAmount)} · Approved {selected.approvedAmount == null ? '—' : inr(selected.approvedAmount)}</p><p>EMI {inr(selected.monthlyEmi)} · {selected.termMonths} months · Interest {selected.interestRate ?? 0}%</p><p>Remaining balance {selected.remainingBalance == null ? '—' : inr(selected.remainingBalance)}</p><p>Status {selected.status} · {selected.notes || ''}</p>{selected.rejectionReason && <p>Rejection: {selected.rejectionReason}</p>}{canManage && selected.status === 'PENDING' && <Label className="grid gap-1 text-xs">Rejection reason<Input required value={rejectReason} onChange={(event) => setRejectReason(event.target.value)} /></Label>}</div>}
      </FormDrawer>
    </div>
  );
}
