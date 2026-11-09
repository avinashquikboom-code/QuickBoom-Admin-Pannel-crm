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
import { assignShift, hrmError, loadEmployees, loadShift, loadShifts, missingHrmApis, removeShift, saveShift, sessionCan } from '@/modules/hrm/hrm-api';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const emptyForm = { name: '', code: '', startTime: '09:30 AM', endTime: '06:30 PM', durationHours: 9, breakDurationMinutes: 60, gracePeriodMinutes: 15, status: 'ACTIVE', isNightShift: false, isRotational: false, workingDays: DAYS.slice(0, 6), notes: '' };

export default function ShiftsPage() {
  const [rows, setRows] = React.useState([]);
  const [metrics, setMetrics] = React.useState({});
  const [employees, setEmployees] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [status, setStatus] = React.useState('ALL');
  const [type, setType] = React.useState('ALL');
  const [refresh, setRefresh] = React.useState(0);
  const [formOpen, setFormOpen] = React.useState(false);
  const [form, setForm] = React.useState(emptyForm);
  const [editingId, setEditingId] = React.useState(null);
  const [detail, setDetail] = React.useState(null);
  const [selectedEmployees, setSelectedEmployees] = React.useState([]);
  const [saving, setSaving] = React.useState(false);
  const [canManage, setCanManage] = React.useState(false);
  React.useEffect(() => { setCanManage(sessionCan('SHIFT') || sessionCan('HRM')); }, []);

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([loadShifts({ search: search || undefined, status, type }), loadEmployees()])
      .then(([shifts, people]) => {
        if (!active) return;
        setRows(shifts.rows);
        setMetrics(shifts.metrics);
        setEmployees(people);
        setError('');
      })
      .catch((err) => { if (active) setError(hrmError(err)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [refresh, search, status, type]);

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setFormOpen(true); };
  const openEdit = (row) => {
    setEditingId(row.id);
    setForm({ ...emptyForm, ...row, workingDays: row.workingDays?.length ? row.workingDays : emptyForm.workingDays });
    setFormOpen(true);
  };
  const openDetail = async (row) => {
    try {
      const shift = await loadShift(row.id);
      setDetail(shift);
      setSelectedEmployees((shift.employees || []).map((employee) => employee.id));
    } catch (err) {
      toast.error(hrmError(err));
    }
  };
  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await saveShift(form, editingId);
      setFormOpen(false);
      setRefresh((value) => value + 1);
      toast.success(editingId ? 'Shift updated' : 'Shift created');
    } catch (err) {
      toast.error(hrmError(err));
    } finally {
      setSaving(false);
    }
  };
  const deactivate = async (row) => {
    try {
      await removeShift(row.id);
      setRefresh((value) => value + 1);
      toast.success('Shift deactivated');
    } catch (err) {
      toast.error(hrmError(err));
    }
  };
  const assign = async () => {
    if (!detail) return;
    setSaving(true);
    try {
      await assignShift(detail.id, selectedEmployees);
      setDetail(await loadShift(detail.id));
      setRefresh((value) => value + 1);
      toast.success('Employees assigned to this shift');
    } catch (err) {
      toast.error(hrmError(err));
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { header: 'Shift', cell: (row) => <div><p className="font-medium">{row.name}</p><p className="text-xs text-slate-500">{row.code}</p></div> },
    { header: 'Timing', cell: (row) => `${row.startTime || '—'} – ${row.endTime || '—'}` },
    { header: 'Hours', accessorKey: 'durationHours' },
    { header: 'Break', cell: (row) => `${row.breakDurationMinutes ?? 0} min` },
    { header: 'Assigned', cell: (row) => row.employeeCount ?? 0 },
    { header: 'Status', cell: (row) => <StatusBadge status={String(row.status || '').toLowerCase()} /> },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-4 sm:space-y-6 w-full min-w-0 overflow-x-hidden">
      <PageHeader title="Shifts" description="Company shifts, working hours, break duration, and employee assignment." actions={canManage ? <Button onClick={openCreate}>Add shift</Button> : null} />
      <HrmStats items={[
        { label: 'Total shifts', value: metrics.total },
        { label: 'Active', value: metrics.active },
        { label: 'Night shifts', value: metrics.nightShifts },
        { label: 'Assigned employees', value: metrics.assignedEmployees },
      ]} />
      <div className="flex flex-col gap-2.5 rounded-xl border border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:flex-wrap w-full min-w-0">
        <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search shift name or code" className="w-full sm:max-w-xs" />
        <Select value={status} onValueChange={setStatus}><SelectTrigger className="w-full sm:w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">All statuses</SelectItem><SelectItem value="ACTIVE">Active</SelectItem><SelectItem value="INACTIVE">Inactive</SelectItem></SelectContent></Select>
        <Select value={type} onValueChange={setType}><SelectTrigger className="w-full sm:w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">All types</SelectItem><SelectItem value="NIGHT">Night</SelectItem><SelectItem value="ROTATIONAL">Rotational</SelectItem></SelectContent></Select>
        <Button variant="outline" onClick={() => setRefresh((value) => value + 1)} className="w-full sm:w-auto">Refresh</Button>
      </div>
      <HrmGap title="Shift history" detail={missingHrmApis.shiftHistory} />
      <HrmNotice loading={loading} error={error} empty={!loading && !error && rows.length === 0 ? 'No shifts match these filters.' : ''} onRetry={() => setRefresh((value) => value + 1)}>
        <DataTable columns={columns} data={rows} label="Shifts" rowActions={[{ label: 'View', onSelect: openDetail }, ...(canManage ? [{ label: 'Edit', onSelect: openEdit }, { label: 'Deactivate', onSelect: deactivate }] : [])]} />
      </HrmNotice>
      <FormDrawer open={formOpen} onOpenChange={setFormOpen} title={editingId ? 'Edit shift' : 'Create shift'} description="Times are stored exactly as entered." onSubmit={submit} loading={saving} submitLabel="Save shift">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Name"><Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></Field>
          <Field label="Code"><Input value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} required /></Field>
          <Field label="Start time"><Input value={form.startTime} onChange={(event) => setForm({ ...form, startTime: event.target.value })} required /></Field>
          <Field label="End time"><Input value={form.endTime} onChange={(event) => setForm({ ...form, endTime: event.target.value })} required /></Field>
          <Field label="Working hours"><Input type="number" step="0.5" value={form.durationHours} onChange={(event) => setForm({ ...form, durationHours: event.target.value })} /></Field>
          <Field label="Break minutes"><Input type="number" value={form.breakDurationMinutes} onChange={(event) => setForm({ ...form, breakDurationMinutes: event.target.value })} /></Field>
        </div>
        <Field label="Working days">
          <div className="flex flex-wrap gap-2">{DAYS.map((day) => <label key={day} className="flex items-center gap-1 text-xs"><input type="checkbox" checked={form.workingDays.includes(day)} onChange={(event) => setForm({ ...form, workingDays: event.target.checked ? [...form.workingDays, day] : form.workingDays.filter((item) => item !== day) })} />{day}</label>)}</div>
        </Field>
        <div className="flex gap-4 text-sm"><label><input type="checkbox" checked={form.isNightShift} onChange={(event) => setForm({ ...form, isNightShift: event.target.checked })} /> Night shift</label><label><input type="checkbox" checked={form.isRotational} onChange={(event) => setForm({ ...form, isRotational: event.target.checked })} /> Rotational</label></div>
      </FormDrawer>
      <FormDrawer open={Boolean(detail)} onOpenChange={(open) => { if (!open) setDetail(null); }} title={detail?.name || 'Shift'} description={detail ? `${detail.code} · ${detail.startTime} – ${detail.endTime}` : ''} showFooter={false}>
        {detail && <div className="space-y-4 text-sm">
          <p>Break {detail.breakDurationMinutes ?? 0} min · Working hours {detail.durationHours ?? '—'} · Status {detail.status}</p>
          <p className="text-slate-500">Created {String(detail.createdAt || '').slice(0, 10)} · Updated {String(detail.updatedAt || '').slice(0, 10)}</p>
          <div className="max-h-64 space-y-1 overflow-auto rounded-lg border p-2">
            {employees.map((employee) => <label key={employee.recordId} className="flex items-center gap-2"><input type="checkbox" disabled={!canManage} checked={selectedEmployees.includes(employee.recordId)} onChange={(event) => setSelectedEmployees(event.target.checked ? [...selectedEmployees, employee.recordId] : selectedEmployees.filter((id) => id !== employee.recordId))} />{employee.name} · {employee.id}</label>)}
          </div>
          {canManage && <Button onClick={assign} disabled={saving}>Save assignment</Button>}
        </div>}
      </FormDrawer>
    </div>
  );
}

function Field({ label, children }) {
  return <Label className="grid gap-1 text-xs">{label}{children}</Label>;
}
