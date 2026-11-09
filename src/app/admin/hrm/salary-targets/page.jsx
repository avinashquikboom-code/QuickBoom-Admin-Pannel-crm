'use client';

import * as React from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormDrawer } from '@/components/common/drawers/FormDrawer';
import { Badge } from '@/components/common/Badge';
import { toast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/currency';
import { HrmNotice, HrmStats } from '@/modules/hrm/HrmNotice';
import { approveSalaryTarget, hrmError, loadSalaryTargets, saveSalaryTarget } from '@/modules/hrm/hrm-api';

const now = new Date();

export default function SalaryTargetsPage() {
  const [month, setMonth] = React.useState(now.getMonth() + 1);
  const [year, setYear] = React.useState(now.getFullYear());
  const [payload, setPayload] = React.useState({ rows: [], employees: [], teams: [] });
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({ scope: 'employee', employeeId: '', teamId: '', monthlyTarget: '', fullSalary: '', belowTargetSalary: '' });

  const load = React.useCallback(() => {
    setLoading(true);
    loadSalaryTargets(month, year)
      .then((data) => { setPayload(data); setError(''); })
      .catch((err) => setError(hrmError(err)))
      .finally(() => setLoading(false));
  }, [month, year]);

  React.useEffect(() => { load(); }, [load]);

  const rows = payload.rows || [];
  const achieved = rows.filter((row) => row.targetStatus === 'ACHIEVED').length;

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await saveSalaryTarget({
        employeeId: form.scope === 'employee' ? Number(form.employeeId) : undefined,
        teamId: form.scope === 'team' ? Number(form.teamId) : undefined,
        monthlyTarget: Number(form.monthlyTarget),
        fullSalary: form.fullSalary === '' ? undefined : Number(form.fullSalary),
        belowTargetSalary: Number(form.belowTargetSalary),
      });
      toast.success('Target salary saved');
      setOpen(false);
      load();
    } catch (err) {
      toast.error(hrmError(err));
    } finally {
      setSaving(false);
    }
  };

  const approve = async (row) => {
    try {
      await approveSalaryTarget({ employeeId: row.employeeId, month, year });
      toast.success(`${row.employeeName} performance approved`);
      load();
    } catch (err) {
      toast.error(hrmError(err));
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader title="Target-Based Salary" description="BPO employees on this policy earn the full registered salary when the monthly target is met, and the lower salary when it is not." actions={<Button onClick={() => setOpen(true)}>Assign target</Button>} />
      <div className="flex gap-2">
        <Input type="number" min="1" max="12" value={month} onChange={(event) => setMonth(Number(event.target.value))} className="h-9 w-24" />
        <Input type="number" min="2000" value={year} onChange={(event) => setYear(Number(event.target.value))} className="h-9 w-28" />
      </div>
      <HrmStats items={[
        { label: 'Assigned employees', value: rows.length },
        { label: 'Target achieved', value: achieved },
        { label: 'Below target', value: rows.length - achieved },
        { label: 'Approved', value: rows.filter((row) => row.reviewStatus === 'APPROVED').length },
      ]} />
      <HrmNotice loading={loading} error={error} onRetry={load} empty={!loading && !error && rows.length === 0 ? 'No employees are on a target-based salary yet.' : ''} />
      {!loading && !error && rows.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs text-slate-500">
              <tr>
                {['Employee', 'Target', 'Achieved', 'Progress', 'Status', 'Eligible salary', 'Review', ''].map((heading) => <th key={heading} className="px-3 py-3 font-medium">{heading}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.employeeId} className="border-b border-slate-100">
                  <td className="px-3 py-3"><div className="font-medium text-slate-900">{row.employeeName}</div><div className="text-xs text-slate-500">{row.employeeCode} · {row.department || 'No department'}</div></td>
                  <td className="px-3 py-3">{formatCurrency(row.monthlyTarget)}</td>
                  <td className="px-3 py-3">{formatCurrency(row.achievedAmount)}<div className="text-xs text-slate-500">Remaining {formatCurrency(row.remainingAmount)}</div></td>
                  <td className="px-3 py-3">{row.achievementPercent}%</td>
                  <td className="px-3 py-3"><Badge className={row.targetStatus === 'ACHIEVED' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}>{row.targetStatus === 'ACHIEVED' ? 'Achieved' : 'Not achieved'}</Badge></td>
                  <td className="px-3 py-3">{formatCurrency(row.eligibleSalary)}<div className="text-xs text-slate-500">Full {formatCurrency(row.fullSalary)} · Below {formatCurrency(row.belowTargetSalary)}</div></td>
                  <td className="px-3 py-3">{row.payrollLocked ? 'Payroll paid' : row.reviewStatus}</td>
                  <td className="px-3 py-3">{row.reviewStatus !== 'APPROVED' && !row.payrollLocked && <Button size="sm" variant="outline" onClick={() => approve(row)}>Approve</Button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <FormDrawer open={open} onOpenChange={setOpen} title="Assign target salary" description="Achievement is the collected value of leads won by the employee in the selected month." submitLabel="Save policy" loading={saving} onSubmit={submit}>
          <div className="space-y-1.5">
            <Label>Assign to</Label>
            <Select value={form.scope} onValueChange={(scope) => setForm({ ...form, scope })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="employee">One employee</SelectItem>
                <SelectItem value="team">Whole team</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {form.scope === 'employee' ? (
            <div className="space-y-1.5">
              <Label>Employee</Label>
              <Select value={form.employeeId} onValueChange={(employeeId) => setForm({ ...form, employeeId })}>
                <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                <SelectContent>
                  {(payload.employees || []).map((employee) => <SelectItem key={employee.id} value={String(employee.id)}>{employee.name} · {employee.code}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label>Team</Label>
              <Select value={form.teamId} onValueChange={(teamId) => setForm({ ...form, teamId })}>
                <SelectTrigger><SelectValue placeholder="Select team" /></SelectTrigger>
                <SelectContent>
                  {(payload.teams || []).map((team) => <SelectItem key={team.id} value={String(team.id)}>{team.name} ({team.memberCount})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-1.5"><Label>Monthly target (₹)</Label><Input type="number" min="1" required value={form.monthlyTarget} onChange={(event) => setForm({ ...form, monthlyTarget: event.target.value })} /></div>
          <div className="space-y-1.5"><Label>Full-target salary (₹)</Label><Input type="number" min="0" placeholder="Uses registered salary when empty" value={form.fullSalary} onChange={(event) => setForm({ ...form, fullSalary: event.target.value })} /></div>
          <div className="space-y-1.5"><Label>Below-target salary (₹)</Label><Input type="number" min="0" required value={form.belowTargetSalary} onChange={(event) => setForm({ ...form, belowTargetSalary: event.target.value })} /></div>
      </FormDrawer>
    </div>
  );
}
