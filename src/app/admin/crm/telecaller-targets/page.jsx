'use client';

import * as React from 'react';
import api from '../../../../../lib/api';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { Badge } from '@/components/common/Badge';
import { FormDrawer, DrawerFormField } from '@/components/common/drawers/FormDrawer';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/common/Select';
import { toast } from '@/hooks/use-toast';

const METRICS = [
  { key: 'OUTGOING_CALLS', label: 'Total Outgoing Calls' },
  { key: 'CONNECTED_CALLS', label: 'Connected Calls' },
  { key: 'FOLLOW_UPS_COMPLETED', label: 'Follow-ups Completed' },
  { key: 'NEW_LEADS_CREATED', label: 'New Leads Created' },
  { key: 'VISITS_SCHEDULED', label: 'Visits Scheduled' },
  { key: 'VISITS_COMPLETED', label: 'Visits Completed' },
  { key: 'PROPOSALS_SENT', label: 'Proposals Sent' },
  { key: 'LEADS_WON', label: 'Leads Converted / Won' },
];

export default function TelecallerTargetsPage() {
  const [assignments, setAssignments] = React.useState([]);
  const [history, setHistory] = React.useState([]);
  const [employees, setEmployees] = React.useState([]);
  const [departments, setDepartments] = React.useState([]);
  const [policy, setPolicy] = React.useState({
    adjustForHalfDayLeave: true,
    excludeFullDayLeave: true,
    excludeHolidays: true,
    excludeWeeklyOff: true,
    autoSendOnFinalPunchOut: true,
    emailSubjectTemplate: 'Daily Performance Report - {{employeeName}} ({{reportDate}})',
    whatsappTemplateName: '',
    whatsappLanguageCode: 'en_US',
    maxRetryAttempts: 3,
  });
  const [loading, setLoading] = React.useState(true);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [policySaving, setPolicySaving] = React.useState(false);
  const [assignScope, setAssignScope] = React.useState('INDIVIDUAL'); // INDIVIDUAL | BULK | DEPARTMENT
  const [form, setForm] = React.useState({
    employeeId: '',
    employeeIds: [],
    departmentId: '',
    metricKey: 'OUTGOING_CALLS',
    customMetricKey: '',
    customMetricLabel: '',
    periodType: 'DAILY',
    targetValue: 30,
    weightage: '',
    effectiveDate: new Date().toISOString().slice(0, 10),
    expiryDate: '',
    recurrence: 'RECURRING',
    isOverride: false,
    notes: '',
  });

  const loadAll = React.useCallback(async () => {
    setLoading(true);
    try {
      const [assignRes, histRes, polRes, empRes, deptRes] = await Promise.all([
        api.get('/telecaller-targets/assignments', { params: { activeOnly: 'false' } }),
        api.get('/telecaller-targets/history'),
        api.get('/telecaller-targets/policy'),
        api.get('/employees', { params: { limit: 200 } }),
        api.get('/departments', { params: { limit: 100 } }).catch(() => ({ data: [] })),
      ]);
      setAssignments(assignRes?.data || assignRes || []);
      setHistory(histRes?.data || histRes || []);
      if (polRes && typeof polRes === 'object') {
        setPolicy((prev) => ({ ...prev, ...polRes }));
      }
      const empList = Array.isArray(empRes?.data) ? empRes.data : Array.isArray(empRes) ? empRes : [];
      setEmployees(empList);
      const deptList = Array.isArray(deptRes?.data) ? deptRes.data : Array.isArray(deptRes) ? deptRes : [];
      setDepartments(deptList);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load telecaller targets');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    try {
      const metricKey = form.metricKey === 'CUSTOM' ? form.customMetricKey.trim().toUpperCase() : form.metricKey;
      if (!metricKey) {
        toast.error('Please select or enter a metric key');
        return;
      }
      const payload = {
        metricKey,
        metricLabel: form.metricKey === 'CUSTOM' ? form.customMetricLabel.trim() || metricKey : undefined,
        periodType: form.periodType,
        targetValue: Number(form.targetValue),
        weightage: form.weightage !== '' ? Number(form.weightage) : undefined,
        effectiveDate: form.effectiveDate,
        expiryDate: form.expiryDate || undefined,
        recurrence: form.recurrence,
        isOverride: form.isOverride,
        notes: form.notes || undefined,
      };
      if (assignScope === 'INDIVIDUAL') {
        payload.employeeId = Number(form.employeeId);
      } else if (assignScope === 'BULK') {
        payload.employeeIds = form.employeeIds.map(Number);
      } else {
        payload.departmentId = Number(form.departmentId);
      }
      await api.post('/telecaller-targets/assignments', payload);
      toast.success('Target assigned successfully');
      setDrawerOpen(false);
      loadAll();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to assign target');
    }
  };

  const handleDeactivate = async (row) => {
    try {
      await api.patch(`/telecaller-targets/assignments/${row.id}`, {
        isActive: !row.isActive,
        reason: row.isActive ? 'Deactivated by admin' : 'Reactivated by admin',
      });
      toast.success(row.isActive ? 'Target deactivated' : 'Target reactivated');
      loadAll();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Update failed');
    }
  };

  const handleSavePolicy = async (e) => {
    e.preventDefault();
    setPolicySaving(true);
    try {
      await api.put('/telecaller-targets/policy', policy);
      toast.success('Target & report automation policy saved');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save policy');
    } finally {
      setPolicySaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Telecaller Target Management"
        description="Assign daily, weekly, and monthly targets individually, in bulk, or department-wise with weightage and shift/leave rules."
        actions={
          <Button size="sm" onClick={() => setDrawerOpen(true)} className="bg-brand hover:bg-primary-hover text-primary-foreground text-xs h-9">
            Assign Target
          </Button>
        }
      />

      {/* Policy & Automation Settings */}
      <form onSubmit={handleSavePolicy} className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Shift, Leave & Daily Report Automation Policy</h3>
            <p className="text-xs text-slate-500">Configure half-day proportional adjustment, holiday exclusions, and Email/WhatsApp report templates.</p>
          </div>
          <Button type="submit" size="sm" disabled={policySaving} className="bg-brand text-white text-xs h-8">
            {policySaving ? 'Saving...' : 'Save Policy'}
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          {[
            ['adjustForHalfDayLeave', 'Adjust for Half-Day Leave'],
            ['excludeFullDayLeave', 'Exclude Full-Day Leave'],
            ['excludeHolidays', 'Exclude Public Holidays'],
            ['excludeWeeklyOff', 'Exclude Weekly Offs'],
            ['autoSendOnFinalPunchOut', 'Auto-Send on Final Punch-Out'],
          ].map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 rounded-lg border border-slate-200 p-2.5 cursor-pointer bg-slate-50/50">
              <input
                type="checkbox"
                checked={Boolean(policy[key])}
                onChange={(e) => setPolicy((p) => ({ ...p, [key]: e.target.checked }))}
                className="size-4 accent-[#107569]"
              />
              <span className="font-medium text-slate-700">{label}</span>
            </label>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-slate-600">Email Subject Template</Label>
            <Input
              value={policy.emailSubjectTemplate || ''}
              onChange={(e) => setPolicy((p) => ({ ...p, emailSubjectTemplate: e.target.value }))}
              className="h-9 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-slate-600">Approved WhatsApp Template Name</Label>
            <Input
              placeholder="e.g. daily_telecaller_report"
              value={policy.whatsappTemplateName || ''}
              onChange={(e) => setPolicy((p) => ({ ...p, whatsappTemplateName: e.target.value }))}
              className="h-9 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-slate-600">Max Auto-Retry Attempts</Label>
            <Input
              type="number"
              min={1}
              max={10}
              value={policy.maxRetryAttempts ?? 3}
              onChange={(e) => setPolicy((p) => ({ ...p, maxRetryAttempts: Number(e.target.value) }))}
              className="h-9 text-xs"
            />
          </div>
        </div>
      </form>

      {/* Active & Historical Target Assignments */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Target Assignments ({assignments.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Scope</th>
                <th className="px-4 py-3">Metric</th>
                <th className="px-4 py-3">Period</th>
                <th className="px-4 py-3">Target</th>
                <th className="px-4 py-3">Weightage</th>
                <th className="px-4 py-3">Effective</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-500">Loading targets...</td></tr>
              ) : assignments.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-500">No targets configured yet.</td></tr>
              ) : (
                assignments.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {row.employee
                        ? `${row.employee.firstName} ${row.employee.lastName} (${row.employee.employeeCode})`
                        : `Department #${row.departmentId}`}
                      {row.isOverride && <Badge className="ml-2 bg-amber-100 text-amber-800 text-[10px]">Override</Badge>}
                    </td>
                    <td className="px-4 py-3">{row.metricLabel}</td>
                    <td className="px-4 py-3">{row.periodType} ({row.recurrence})</td>
                    <td className="px-4 py-3 font-bold">{row.targetValue}</td>
                    <td className="px-4 py-3">{row.weightage != null ? `${row.weightage}%` : 'Equal'}</td>
                    <td className="px-4 py-3">
                      {String(row.effectiveDate).slice(0, 10)}
                      {row.expiryDate ? ` → ${String(row.expiryDate).slice(0, 10)}` : ''}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={row.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}>
                        {row.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleDeactivate(row)}>
                        {row.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modification History */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200">
          <h3 className="text-sm font-bold text-slate-900">Target Modification Audit History</h3>
        </div>
        <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
          {history.length === 0 ? (
            <div className="p-4 text-xs text-slate-500 text-center">No history recorded yet.</div>
          ) : (
            history.slice(0, 20).map((h) => (
              <div key={h.id} className="px-4 py-2.5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-slate-800">Assignment #{h.assignmentId}</span>{' '}
                  <Badge className="ml-1 bg-slate-100 text-slate-700 text-[10px]">{h.action}</Badge>
                  <span className="ml-2 text-slate-500">{h.reason}</span>
                </div>
                <span className="text-slate-400">{String(h.createdAt).slice(0, 19).replace('T', ' ')}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <FormDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title="Assign Telecaller Target"
        description="Assign targets individually, in bulk, or to a department."
        onSubmit={handleAssignSubmit}
        submitLabel="Save Target"
        size="standard"
      >
        <DrawerFormField label="Assignment Scope" required>
          <Select value={assignScope} onValueChange={setAssignScope}>
            <SelectTrigger className="h-9 text-xs w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="INDIVIDUAL" className="text-xs">Individual Employee</SelectItem>
              <SelectItem value="BULK" className="text-xs">Bulk Employees</SelectItem>
              <SelectItem value="DEPARTMENT" className="text-xs">Department-wise</SelectItem>
            </SelectContent>
          </Select>
        </DrawerFormField>

        {assignScope === 'INDIVIDUAL' && (
          <DrawerFormField label="Employee" required>
            <Select value={form.employeeId} onValueChange={(v) => setForm((f) => ({ ...f, employeeId: v }))}>
              <SelectTrigger className="h-9 text-xs w-full"><SelectValue placeholder="Select employee" /></SelectTrigger>
              <SelectContent>
                {employees.map((e) => (
                  <SelectItem key={e.id} value={String(e.id)} className="text-xs">
                    {e.firstName} {e.lastName} ({e.employeeCode})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </DrawerFormField>
        )}

        {assignScope === 'BULK' && (
          <DrawerFormField label="Select Employees (Ctrl/Cmd + Click)" required>
            <select
              multiple
              className="w-full rounded-md border border-slate-200 p-2 text-xs h-28"
              value={form.employeeIds}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  employeeIds: Array.from(e.target.selectedOptions).map((o) => o.value),
                }))
              }
            >
              {employees.map((e) => (
                <option key={e.id} value={String(e.id)}>
                  {e.firstName} {e.lastName} ({e.employeeCode})
                </option>
              ))}
            </select>
          </DrawerFormField>
        )}

        {assignScope === 'DEPARTMENT' && (
          <DrawerFormField label="Department" required>
            <Select value={form.departmentId} onValueChange={(v) => setForm((f) => ({ ...f, departmentId: v }))}>
              <SelectTrigger className="h-9 text-xs w-full"><SelectValue placeholder="Select department" /></SelectTrigger>
              <SelectContent>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={String(d.id)} className="text-xs">{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </DrawerFormField>
        )}

        <DrawerFormField label="Target Metric" required>
          <Select value={form.metricKey} onValueChange={(v) => setForm((f) => ({ ...f, metricKey: v }))}>
            <SelectTrigger className="h-9 text-xs w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {METRICS.map((m) => (
                <SelectItem key={m.key} value={m.key} className="text-xs">{m.label}</SelectItem>
              ))}
              <SelectItem value="CUSTOM" className="text-xs">Custom CRM Metric</SelectItem>
            </SelectContent>
          </Select>
        </DrawerFormField>

        {form.metricKey === 'CUSTOM' && (
          <div className="grid grid-cols-2 gap-3">
            <DrawerFormField label="Metric Key" required>
              <Input value={form.customMetricKey} onChange={(e) => setForm((f) => ({ ...f, customMetricKey: e.target.value }))} placeholder="DEMO_BOOKED" className="h-9 text-xs" />
            </DrawerFormField>
            <DrawerFormField label="Metric Label" required>
              <Input value={form.customMetricLabel} onChange={(e) => setForm((f) => ({ ...f, customMetricLabel: e.target.value }))} placeholder="Demos Booked" className="h-9 text-xs" />
            </DrawerFormField>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <DrawerFormField label="Period" required>
            <Select value={form.periodType} onValueChange={(v) => setForm((f) => ({ ...f, periodType: v }))}>
              <SelectTrigger className="h-9 text-xs w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="DAILY" className="text-xs">Daily</SelectItem>
                <SelectItem value="WEEKLY" className="text-xs">Weekly</SelectItem>
                <SelectItem value="MONTHLY" className="text-xs">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </DrawerFormField>
          <DrawerFormField label="Recurrence" required>
            <Select value={form.recurrence} onValueChange={(v) => setForm((f) => ({ ...f, recurrence: v }))}>
              <SelectTrigger className="h-9 text-xs w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="RECURRING" className="text-xs">Recurring</SelectItem>
                <SelectItem value="ONE_TIME" className="text-xs">One-Time</SelectItem>
              </SelectContent>
            </Select>
          </DrawerFormField>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <DrawerFormField label="Target Quantity" required>
            <Input type="number" min={1} value={form.targetValue} onChange={(e) => setForm((f) => ({ ...f, targetValue: Number(e.target.value) }))} className="h-9 text-xs" />
          </DrawerFormField>
          <DrawerFormField label="Weightage % (Optional)">
            <Input type="number" min={0} max={100} placeholder="Equal if empty" value={form.weightage} onChange={(e) => setForm((f) => ({ ...f, weightage: e.target.value }))} className="h-9 text-xs" />
          </DrawerFormField>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <DrawerFormField label="Effective Date" required>
            <Input type="date" value={form.effectiveDate} onChange={(e) => setForm((f) => ({ ...f, effectiveDate: e.target.value }))} className="h-9 text-xs" />
          </DrawerFormField>
          <DrawerFormField label="Expiry Date (Optional)">
            <Input type="date" value={form.expiryDate} onChange={(e) => setForm((f) => ({ ...f, expiryDate: e.target.value }))} className="h-9 text-xs" />
          </DrawerFormField>
        </div>

        <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
          <input type="checkbox" checked={form.isOverride} onChange={(e) => setForm((f) => ({ ...f, isOverride: e.target.checked }))} className="size-4 accent-[#107569]" />
          <span>Employee-Specific Override (takes precedence over department target)</span>
        </label>

        <DrawerFormField label="Notes">
          <Input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} className="h-9 text-xs" />
        </DrawerFormField>
      </FormDrawer>
    </div>
  );
}
