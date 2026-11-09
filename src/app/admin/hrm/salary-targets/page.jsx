'use client';

import * as React from 'react';
import api from '../../../../../lib/api';
import { AdminRowActions } from '@/components/common/AdminRowActions';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { AdminSelectCheckbox, AdminBulkSelectionToolbar } from '@/components/admin/bulk-selection';
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
import { approveSalaryTarget, hrmError, loadSalaryTargets, saveSalaryTarget, sessionCanAction } from '@/modules/hrm/hrm-api';

const now = new Date();

export default function SalaryTargetsPage() {
  const [month, setMonth] = React.useState(now.getMonth() + 1);
  const [year, setYear] = React.useState(now.getFullYear());
  const [payload, setPayload] = React.useState({ rows: [], employees: [], teams: [] });
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [permissions, setPermissions] = React.useState({});
  const [editing, setEditing] = React.useState(null);
  const [detail, setDetail] = React.useState(null);
  const [confirmRows, setConfirmRows] = React.useState([]);
  const [selected, setSelected] = React.useState([]);
  const [search, setSearch] = React.useState('');
  const [department, setDepartment] = React.useState('');
  const [achievement, setAchievement] = React.useState('');
  const [approval, setApproval] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [results, setResults] = React.useState(null);
  const [employeeIds, setEmployeeIds] = React.useState([]);
  React.useEffect(() => setPermissions(Object.fromEntries(['VIEW', 'CREATE', 'EDIT', 'DELETE', 'APPROVE'].map((action) => [action, sessionCanAction('SALARY', action)]))), []);
  React.useEffect(() => { setSelected([]); setPage(1); }, [month, year, search, department, achievement, approval]);
  React.useEffect(() => setSelected([]), [page]);
  const request = React.useRef(0);
  const [form, setForm] = React.useState({ scope: 'employee', employeeId: '', teamId: '', monthlyTarget: '', fullSalary: '', belowTargetSalary: '' });

  const load = React.useCallback(() => {
    const version = ++request.current;
    setLoading(true);
    setSelected([]);
    loadSalaryTargets(month, year)
      .then((data) => { if (version === request.current) { setPayload(data); setError(''); } })
      .catch((err) => { if (version === request.current) setError(hrmError(err)); })
      .finally(() => { if (version === request.current) setLoading(false); });
  }, [month, year]);

  React.useEffect(() => { load(); }, [load]);

  const rows = payload.rows || [];
  const filtered = rows.filter((row) => (!search || `${row.employeeName} ${row.employeeCode}`.toLowerCase().includes(search.toLowerCase())) && (!department || row.department === department) && (!achievement || row.targetStatus === achievement) && (!approval || row.reviewStatus === approval));
  const visible = filtered.slice((page - 1) * 20, page * 20);
  const selectedRows = visible.filter((row) => selected.includes(row.assignmentId));
  const canChange = (row) => row.assignmentId && !row.payrollLocked && row.reviewStatus !== 'APPROVED';
  const toggle = (id, checked) => setSelected((current) => checked ? [...new Set([...current, id])] : current.filter((value) => value !== id));
  const openForm = (row = null) => {
    setEditing(row); setResults(null); setEmployeeIds([]);
    setForm({ scope: 'employee', employeeId: row ? String(row.employeeId) : '', teamId: '', monthlyTarget: row?.monthlyTarget ?? '', fullSalary: row?.fullSalary ?? '', belowTargetSalary: row?.belowTargetSalary ?? '', month: row?.month || month, year: row?.year || year });
    setOpen(true);
  };
  const deleteRows = async () => {
    if (saving) return;
    setSaving(true);
    const outcomes = [];
    for (const row of confirmRows) {
      try { await api.delete(`/admin/payroll/targets/${row.assignmentId}`, { params: { month: row.month, year: row.year } }); outcomes.push({ employeeId: row.employeeId, success: true }); }
      catch (err) { outcomes.push({ employeeId: row.employeeId, success: false, error: hrmError(err) }); }
    }
    setResults({ results: outcomes }); setConfirmRows([]); setSaving(false); load();
  };
  const exportRows = async (format) => {
    const headers = ['Assignment ID', 'Employee', 'Employee code', 'Department', 'Month', 'Year', 'Target', 'Achieved', 'Remaining', 'Achievement %', 'Full salary', 'Below salary', 'Eligible salary', 'Approval'];
    const data = selectedRows.map((r) => [r.assignmentId, r.employeeName, r.employeeCode, r.department, r.month, r.year, r.monthlyTarget, r.achievedAmount, r.remainingAmount, r.achievementPercent, r.fullSalary, r.belowTargetSalary, r.eligibleSalary, r.reviewStatus]);
    try {
      if (format === 'pdf') {
        const [{ jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
        const doc = new jsPDF({ orientation: 'landscape', format: 'a3' });
        doc.text(`Target salary — ${month}/${year}`, 14, 15);
        autoTable(doc, { head: [headers], body: data, startY: 22, styles: { fontSize: 8 }, headStyles: { fillColor: [22, 58, 46] } });
        doc.save(`target-salary-${year}-${month}.pdf`);
      } else {
        const escape = (value) => { let text = String(value ?? ''); if (/^[=+@\-\t\r]/.test(text)) text = "'" + text; return `"${text.replace(/"/g, '""')}"`; };
        const blob = new Blob(['\ufeff' + [headers, ...data].map((row) => row.map(escape).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `target-salary-${year}-${month}.csv`; link.click(); URL.revokeObjectURL(url);
      }
    } catch (err) { toast.error(hrmError(err)); }
  };
  const achieved = rows.filter((row) => row.targetStatus === 'ACHIEVED').length;

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const body = {
        employeeId: form.scope === 'employee' ? Number(form.employeeId) : undefined,
        employeeIds: form.scope === 'multiple' ? employeeIds : undefined,
        teamId: form.scope === 'team' ? Number(form.teamId) : undefined,
        monthlyTarget: Number(form.monthlyTarget), fullSalary: form.fullSalary === '' ? null : Number(form.fullSalary),
        belowTargetSalary: Number(form.belowTargetSalary), month: Number(form.month), year: Number(form.year),
      };
      if (editing) {
        await api.patch(`/admin/payroll/targets/${editing.assignmentId}`, body);
        toast.success('Target assignment updated'); setOpen(false);
      } else {
        const response = await saveSalaryTarget(body);
        const result = response?.data || response;
        setResults(result);
        if (!result.failed) setOpen(false);
        toast.success(`Assigned ${result.assigned || 0}; failed ${result.failed || 0}`);
      }
      load();
    } catch (err) {
      toast.error(hrmError(err));
    } finally {
      setSaving(false);
    }
  };

  const approve = async (row) => {
    if (saving) return;
    setSaving(true);
    try {
      await approveSalaryTarget({ employeeId: row.employeeId, month, year });
      toast.success(`${row.employeeName} performance approved`);
      load();
    } catch (err) {
      toast.error(hrmError(err));
    } finally { setSaving(false); }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader title="Target-Based Salary" description="BPO employees on this policy earn the full registered salary when the monthly target is met, and the lower salary when it is not." actions={permissions.CREATE && <Button onClick={() => openForm()}>Assign Target</Button>} />
      <div className="flex flex-wrap gap-2">
        <Input aria-label="Month" type="number" min="1" max="12" value={month} onChange={(event) => setMonth(Number(event.target.value))} className="h-9 w-24" />
        <Input aria-label="Year" type="number" min="2000" value={year} onChange={(event) => setYear(Number(event.target.value))} className="h-9 w-28" />
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Input aria-label="Search employees" placeholder="Search employee name or ID" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select aria-label="Department" className="rounded-md border p-2 text-sm" value={department} onChange={(e) => setDepartment(e.target.value)}><option value="">All departments</option>{[...new Set(rows.map((r) => r.department).filter(Boolean))].map((name) => <option key={name}>{name}</option>)}</select>
        <select aria-label="Achievement status" className="rounded-md border p-2 text-sm" value={achievement} onChange={(e) => setAchievement(e.target.value)}><option value="">All target statuses</option>{[...new Set(rows.map((r) => r.targetStatus))].map((status) => <option key={status}>{status}</option>)}</select>
        <select aria-label="Approval status" className="rounded-md border p-2 text-sm" value={approval} onChange={(e) => setApproval(e.target.value)}><option value="">All approval statuses</option><option>PENDING</option><option>APPROVED</option></select>
      </div>
      {results?.results && <div className="rounded-lg border p-3 text-sm" role="status"><p>Successful: {results.results.filter((r) => r.success).length} · Failed: {results.results.filter((r) => !r.success).length}</p>{results.results.map((r, index) => <p key={index}>{payload.employees.find((e) => e.id === r.employeeId)?.name || `Employee ${r.employeeId}`}: {r.success ? 'Successful' : r.error}</p>)}</div>}
      <AdminBulkSelectionToolbar count={selectedRows.length} onClear={() => setSelected([])}>
        {permissions.DELETE && <Button variant="destructive" disabled={saving || selectedRows.some((row) => !canChange(row))} onClick={() => setConfirmRows(selectedRows)}>Delete Selected</Button>}
        <Button variant="outline" onClick={() => exportRows('pdf')}>Export Selected to PDF</Button>
        <Button variant="outline" onClick={() => exportRows('csv')}>Export Selected to CSV</Button>
      </AdminBulkSelectionToolbar>
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
                <th className="px-3 py-3"><AdminSelectCheckbox label="Select all assignments on this page" checked={visible.length > 0 && selectedRows.length === visible.length} indeterminate={selectedRows.length > 0 && selectedRows.length < visible.length} onChange={(checked) => setSelected(checked ? visible.map((r) => r.assignmentId).filter(Boolean) : [])} /></th>
                {['Employee', 'Target', 'Achieved', 'Progress', 'Status', 'Eligible salary', 'Review', 'Actions'].map((heading) => <th key={heading} className="px-3 py-3 font-medium">{heading}</th>)}
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => (
                <tr key={row.assignmentId || row.reviewId} className="border-b border-slate-100">
                  <td className="px-3 py-3"><AdminSelectCheckbox label={`Select ${row.employeeName} ${row.month}/${row.year}`} checked={selected.includes(row.assignmentId)} disabled={!row.assignmentId} onChange={(checked) => toggle(row.assignmentId, checked)} /></td>
                  <td className="px-3 py-3"><div className="font-medium text-slate-900">{row.employeeName}</div><div className="text-xs text-slate-500">{row.employeeCode} · {row.department || 'No department'}</div></td>
                  <td className="px-3 py-3">{formatCurrency(row.monthlyTarget)}</td>
                  <td className="px-3 py-3">{formatCurrency(row.achievedAmount)}<div className="text-xs text-slate-500">Remaining {formatCurrency(row.remainingAmount)}</div></td>
                  <td className="px-3 py-3">{row.achievementPercent}%</td>
                  <td className="px-3 py-3"><Badge className={row.targetStatus === 'ACHIEVED' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}>{row.targetStatus === 'ACHIEVED' ? 'Achieved' : 'Not achieved'}</Badge></td>
                  <td className="px-3 py-3">{formatCurrency(row.eligibleSalary)}<div className="text-xs text-slate-500">Full {formatCurrency(row.fullSalary)} · Below {formatCurrency(row.belowTargetSalary)}</div></td>
                  <td className="px-3 py-3">{row.payrollLocked ? 'Payroll locked' : row.reviewStatus}</td>
                  <td className="px-3 py-3"><div className="flex items-center gap-2"><AdminRowActions record={row} disabled={saving} onView={permissions.VIEW ? setDetail : undefined} onEdit={permissions.EDIT && canChange(row) ? openForm : undefined} onDelete={permissions.DELETE && canChange(row) ? (item) => setConfirmRows([item]) : undefined} confirmDelete={false} />{permissions.APPROVE && row.reviewStatus !== 'APPROVED' && !row.payrollLocked && <Button size="sm" variant="outline" disabled={saving} onClick={() => approve(row)}>Approve</Button>}</div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="flex items-center justify-between text-sm"><span>{filtered.length} assignments · Page {page} of {Math.max(1, Math.ceil(filtered.length / 20))}</span><div className="flex gap-2"><Button variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button><Button variant="outline" disabled={page * 20 >= filtered.length} onClick={() => setPage(page + 1)}>Next</Button></div></div>
      <ConfirmDialog open={confirmRows.length > 0} onOpenChange={(value) => { if (!value && !saving) setConfirmRows([]); }} title="Delete target assignment?" description={`${confirmRows.map((r) => `${r.employeeName} — ${formatCurrency(r.monthlyTarget)} — ${r.month}/${r.year}`).join('; ')}. Assignments will be deactivated for these periods. Payroll and approval history will be retained.`} confirmLabel={saving ? 'Deleting…' : 'Delete'} variant="destructive" onConfirm={deleteRows} />
      <FormDrawer open={Boolean(detail)} onOpenChange={(value) => { if (!value) setDetail(null); }} title="Target assignment details" showFooter={false}>
        {detail && <dl className="grid gap-3 sm:grid-cols-2">{[['Employee', detail.employeeName], ['Employee ID', detail.employeeCode || detail.employeeId], ['Assignment ID', detail.assignmentId], ['Department', detail.department], ['Designation', detail.designation], ['Month / year', `${detail.month}/${detail.year}`], ['Monthly target', formatCurrency(detail.monthlyTarget)], ['Achieved', formatCurrency(detail.achievedAmount)], ['Remaining', formatCurrency(detail.remainingAmount)], ['Achievement', `${detail.achievementPercent}%`], ['Full salary', formatCurrency(detail.fullSalary)], ['Below-target salary', formatCurrency(detail.belowTargetSalary)], ['Eligible salary', formatCurrency(detail.eligibleSalary)], ['Approval status', detail.reviewStatus], ['Approved at', detail.approvedAt ? new Date(detail.approvedAt).toLocaleString() : 'Not approved'], ['Approved by user ID', detail.approvedById]].map(([label, value]) => <div key={label}><dt className="text-xs text-slate-500">{label}</dt><dd className="text-sm">{value ?? '—'}</dd></div>)}</dl>}
      </FormDrawer>
      <FormDrawer open={open} onOpenChange={setOpen} title={editing ? 'Edit target assignment' : 'Assign target salary'} description="Achievement is the collected value of leads won by the employee in the selected month." submitLabel="Save assignment" loading={saving} onSubmit={submit}>
          {results?.failed > 0 && <div role="status" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm"><p>Assigned {results.assigned} · Failed {results.failed}</p>{results.results?.filter((result) => !result.success).map((result) => <p key={result.employeeId}>{payload.employees.find((employee) => employee.id === result.employeeId)?.name || result.employeeId}: {result.error}</p>)}</div>}
          <div className="space-y-1.5">
            <Label>Assign to</Label>
            <Select disabled={Boolean(editing)} value={form.scope} onValueChange={(scope) => setForm({ ...form, scope })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="employee">One employee</SelectItem>
                <SelectItem value="multiple">Multiple employees</SelectItem>
                <SelectItem value="team">Whole team</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {form.scope === 'multiple' ? <div className="max-h-60 space-y-2 overflow-auto rounded border p-3">{(payload.employees || []).map((employee) => <label key={employee.id} className="flex items-center gap-2 text-sm"><AdminSelectCheckbox checked={employeeIds.includes(employee.id)} onChange={(checked) => setEmployeeIds((current) => checked ? [...current, employee.id] : current.filter((id) => id !== employee.id))} label={`Assign ${employee.name}`} />{employee.name} · {employee.code}</label>)}</div> : form.scope === 'employee' ? (
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
          <div className="grid grid-cols-2 gap-3"><div><Label>Effective month</Label><Input required type="number" min="1" max="12" value={form.month || month} onChange={(e) => setForm({ ...form, month: e.target.value })} /></div><div><Label>Effective year</Label><Input required type="number" min="2000" max="9999" value={form.year || year} onChange={(e) => setForm({ ...form, year: e.target.value })} /></div></div>
          {editing?.legacyPolicy && <p className="text-xs text-slate-500">This creates an override for the selected period; the ongoing legacy policy remains unchanged.</p>}
          <div className="space-y-1.5"><Label>Monthly target (₹)</Label><Input type="number" min="1" required value={form.monthlyTarget} onChange={(event) => setForm({ ...form, monthlyTarget: event.target.value })} /></div>
          <div className="space-y-1.5"><Label>Full-target salary (₹)</Label><Input type="number" min="0" placeholder="Uses registered salary when empty" value={form.fullSalary} onChange={(event) => setForm({ ...form, fullSalary: event.target.value })} /></div>
          <div className="space-y-1.5"><Label>Below-target salary (₹)</Label><Input type="number" min="0" required value={form.belowTargetSalary} onChange={(event) => setForm({ ...form, belowTargetSalary: event.target.value })} /></div>
      </FormDrawer>
    </div>
  );
}
