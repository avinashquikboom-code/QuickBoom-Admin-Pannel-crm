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
import { hrmError, loadCommissionConfigs, loadCommissions, loadEmployees, saveDesignationCommission, saveEmployeeCommission, sessionCan, updateCommissionStatus } from '@/modules/hrm/hrm-api';

const inr = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(value) || 0);

export default function CommissionsPage() {
  const [rows, setRows] = React.useState([]);
  const [summary, setSummary] = React.useState({});
  const [configs, setConfigs] = React.useState({ designations: [], employees: [] });
  const [employees, setEmployees] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [employeeId, setEmployeeId] = React.useState('');
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [pagination, setPagination] = React.useState({});
  const [refresh, setRefresh] = React.useState(0);
  const [configOpen, setConfigOpen] = React.useState(false);
  const [config, setConfig] = React.useState({ employeeId: '', commissionType: 'PERCENTAGE', commissionValue: '', status: 'ACTIVE' });
  const [canManage, setCanManage] = React.useState(false);
  React.useEffect(() => { setCanManage(sessionCan('COMMISSION')); }, []);

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([
      loadCommissions({ page, limit: 20, search: search || undefined, status: status || undefined, employeeId: employeeId || undefined, startDate: startDate || undefined, endDate: endDate || undefined }),
      loadCommissionConfigs(),
      loadEmployees(),
    ]).then(([result, settings, people]) => {
      if (!active) return;
      setRows(result.rows);
      setSummary(result.summary);
      setPagination(result.pagination);
      setConfigs(settings);
      setEmployees(people);
      setError('');
    }).catch((err) => { if (active) setError(hrmError(err)); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [refresh, page, search, status, employeeId, startDate, endDate]);

  const setStatusFor = async (row, next) => {
    try {
      await updateCommissionStatus(row.id, next);
      setRefresh((value) => value + 1);
      toast.success(`Commission marked ${next}`);
    } catch (err) {
      toast.error(hrmError(err));
    }
  };
  const saveOverride = async (event) => {
    event.preventDefault();
    try {
      await saveEmployeeCommission(config);
      setConfigOpen(false);
      setRefresh((value) => value + 1);
      toast.success('Employee commission override saved');
    } catch (err) {
      toast.error(hrmError(err));
    }
  };

  const columns = [
    { header: 'Employee', cell: (row) => `${row.employee?.firstName || ''} ${row.employee?.lastName || ''}`.trim() || '—' },
    { header: 'Type', accessorKey: 'commissionType' },
    { header: 'Rate', cell: (row) => row.commissionRate ?? '—' },
    { header: 'Purchase', cell: (row) => inr(row.purchaseAmount) },
    { header: 'Commission', cell: (row) => inr(row.commissionAmount) },
    { header: 'Order', cell: (row) => row.orderId || row.purchase?.orderNumber || '—' },
    { header: 'Status', cell: (row) => <StatusBadge status={String(row.status || '').toLowerCase()} /> },
    { header: 'Date', cell: (row) => String(row.createdAt || '').slice(0, 10) },
  ];

  return (
    <div className="max-w-none min-w-0 w-full space-y-6">
      <PageHeader title="Commissions" description="Commission records and rates are read from the commission service. Amounts are not calculated in the browser." actions={canManage ? <Button onClick={() => setConfigOpen(true)}>Employee rate</Button> : null} />
      <HrmStats items={[
        { label: 'Total', value: inr(summary.totalCommission) },
        { label: 'Pending', value: inr(summary.pendingCommission) },
        { label: 'Approved', value: inr(summary.approvedCommission) },
        { label: 'Paid', value: inr(summary.paidCommission) },
      ]} />
      <div className="grid grid-cols-1 gap-2 rounded-xl border border-slate-200 bg-white p-3 sm:grid-cols-2 lg:grid-cols-6">
        <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search employee, lead, or order" />
        <Select value={status || 'ALL'} onValueChange={(value) => setStatus(value === 'ALL' ? '' : value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{['ALL', 'PENDING', 'APPROVED', 'PAID', 'CANCELLED'].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select>
        <Select value={employeeId || 'ALL'} onValueChange={(value) => setEmployeeId(value === 'ALL' ? '' : value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">All employees</SelectItem>{employees.map((employee) => <SelectItem key={employee.recordId} value={String(employee.recordId)}>{employee.name}</SelectItem>)}</SelectContent></Select>
        <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} aria-label="From date" />
        <Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} aria-label="To date" />
        <Button variant="outline" onClick={() => setRefresh((value) => value + 1)}>Refresh</Button>
      </div>
      <HrmNotice loading={loading} error={error} empty={!loading && !error && rows.length === 0 ? 'No commission records match these filters.' : ''} onRetry={() => setRefresh((value) => value + 1)}>
        <DataTable columns={columns} data={rows} label="Commissions" rowActions={canManage ? [{ label: 'Approve', onSelect: (row) => setStatusFor(row, 'APPROVED') }, { label: 'Mark paid', onSelect: (row) => setStatusFor(row, 'PAID') }, { label: 'Cancel', onSelect: (row) => setStatusFor(row, 'CANCELLED') }] : []} />
      </HrmNotice>
      <div className="flex justify-end gap-2 text-xs"><Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</Button><Button variant="outline" size="sm" disabled={page >= (pagination.totalPages || 1)} onClick={() => setPage((value) => value + 1)}>Next</Button></div>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-4"><h2 className="text-sm font-semibold">Designation rates</h2><div className="mt-3 space-y-2 text-sm">{configs.designations.map((item) => <form key={item.id} className="flex flex-wrap items-center justify-between gap-2" onSubmit={async (event) => { event.preventDefault(); const rate = new FormData(event.currentTarget).get('rate'); try { await saveDesignationCommission({ designationId: item.id, commissionEnabled: event.currentTarget.elements.enabled.checked, commissionType: item.commissionType || 'PERCENTAGE', commissionRate: rate }); setRefresh((value) => value + 1); toast.success('Designation commission rate saved'); } catch (err) { toast.error(hrmError(err)); } }}><span>{item.name} · {item.commissionType}</span>{canManage ? <><label className="text-xs"><input name="enabled" type="checkbox" defaultChecked={item.commissionEnabled !== false} /> Enabled</label><Input name="rate" type="number" min="0" step="0.01" defaultValue={item.commissionRate ?? 0} className="h-8 w-24" /><Button size="sm" type="submit">Save</Button></> : <span>{item.commissionRate}</span>}</form>)}</div></section>
        <section className="rounded-xl border border-slate-200 bg-white p-4"><h2 className="text-sm font-semibold">Employee overrides</h2><div className="mt-3 space-y-2 text-sm">{configs.employees.map((item) => <p key={item.id}>{item.employee?.firstName} {item.employee?.lastName} · {item.commissionType} {item.commissionValue} · {item.status}</p>)}{configs.employees.length === 0 && <p className="text-slate-500">No employee-specific overrides.</p>}</div></section>
      </div>
      <FormDrawer open={configOpen} onOpenChange={setConfigOpen} title="Employee commission override" description="This stores the rate. It does not rewrite existing commission amounts." onSubmit={saveOverride}>
        <div className="grid gap-3">
          <Label className="grid gap-1 text-xs">Employee<Select value={String(config.employeeId)} onValueChange={(value) => setConfig({ ...config, employeeId: value })}><SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger><SelectContent>{employees.map((employee) => <SelectItem key={employee.recordId} value={String(employee.recordId)}>{employee.name}</SelectItem>)}</SelectContent></Select></Label>
          <Label className="grid gap-1 text-xs">Type<Select value={config.commissionType} onValueChange={(value) => setConfig({ ...config, commissionType: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="PERCENTAGE">Percentage</SelectItem><SelectItem value="FIXED">Fixed</SelectItem></SelectContent></Select></Label>
          <Label className="grid gap-1 text-xs">Value<Input required type="number" min="0" step="0.01" value={config.commissionValue} onChange={(event) => setConfig({ ...config, commissionValue: event.target.value })} /></Label>
        </div>
      </FormDrawer>
    </div>
  );
}
