'use client';

import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import * as React from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { EmployeeTable } from '@/modules/hrm/components/employees/EmployeeTable';
import { EmployeeDetail } from '@/modules/hrm/components/employees/EmployeeDetail';
import { EmployeeRegistrationWizard } from '@/modules/hrm/components/employees/wizard';
import { Button } from '@/components/common/Button';
import { toast } from '@/hooks/use-toast';
import { faUserPlus } from '@fortawesome/free-solid-svg-icons';
import { createEmployee, deactivateEmployee, hrmError, loadEmployees, sessionCanAction, updateEmployee } from '@/modules/hrm/hrm-api';
import { FormDrawer } from '@/components/common/drawers/FormDrawer';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { HrmNotice } from '@/modules/hrm/HrmNotice';
export default function EmployeesPage() {
    const [employees, setEmployees] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState('');
    const [refresh, setRefresh] = React.useState(0);
    React.useEffect(() => {
        const controller = new AbortController();
        setLoading(true);
        setError('');
        loadEmployees().then(setEmployees).catch((err) => { if (!controller.signal.aborted) setError(hrmError(err)); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
        return () => controller.abort();
    }, [refresh]);
    const [selectedEmployee, setSelectedEmployee] = React.useState(null);
    const [detailOpen, setDetailOpen] = React.useState(false);
    const [wizardOpen, setWizardOpen] = React.useState(false);
    const [editEmployee, setEditEmployee] = React.useState(null);
    const [editForm, setEditForm] = React.useState({});
    const [saving, setSaving] = React.useState(false);
    const [canEdit, setCanEdit] = React.useState(false);
    const [canDelete, setCanDelete] = React.useState(false);
    React.useEffect(() => {
        setCanEdit(sessionCanAction('EMPLOYEE', 'EDIT'));
        setCanDelete(sessionCanAction('EMPLOYEE', 'DELETE'));
    }, []);

    const handleSelectEmployee = (emp) => {
        setSelectedEmployee(emp);
        setDetailOpen(true);
    };

    const handleWizardSuccess = async (wizardData) => {
        try {
            const salary = wizardData.organization?.salary || {};
            await createEmployee({
                firstName: wizardData.personal.firstName,
                lastName: wizardData.personal.lastName,
                email: wizardData.personal.corporateEmail,
                phone: wizardData.personal.phone,
                departmentName: wizardData.employment.department,
                designationName: wizardData.employment.jobTitle,
                branch: wizardData.employment.workLocation,
                monthlySalary: Number(salary.basic || 0),
                basicSalary: Number(salary.basic || 0),
                hra: Number(salary.hra || 0),
                allowances: Number(salary.allowances || 0),
                otherEarnings: Number(salary.otherEarnings || 0),
            });
            setRefresh((value) => value + 1);
        } catch (err) {
            throw new Error(hrmError(err));
        }
    };
    const activeCount = employees.filter((e) => e.status === 'active').length;
    const onLeaveCount = employees.filter((e) => e.status === 'on_leave').length;
    const inactiveCount = employees.filter((e) => e.status === 'inactive').length;
    return (<div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader title="Employee Directory" description="Manage company personnel, designations, salary packages, and employment status." actions={<Button onClick={() => setWizardOpen(true)} className="bg-brand hover:bg-primary-hover text-primary-foreground font-medium text-xs h-9">
            <FontAwesomeIcon icon={faUserPlus} className="size-4 mr-1.5"/>
            Add Employee
          </Button>}/>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
          <p className="text-[11px] font-semibold text-slate-400 uppercase">
            Total Headcount
          </p>
          <p className="text-xl font-bold text-slate-900 mt-0.5">
            {employees.length}
          </p>
        </div>
        <div className="p-3.5 rounded-xl border border-brand-light bg-brand-light/50">
          <p className="text-[11px] font-semibold text-brand-dark uppercase">
            Active Status
          </p>
          <p className="text-xl font-bold text-brand-dark mt-0.5">
            {activeCount}
          </p>
        </div>
        <div className="p-3.5 rounded-xl border border-brand-light bg-brand-light/50">
          <p className="text-[11px] font-semibold text-brand-dark uppercase">
            On Leave
          </p>
          <p className="text-xl font-bold text-brand-dark mt-0.5">
            {onLeaveCount}
          </p>
        </div>
        <div className="p-3.5 rounded-xl border border-rose-100 bg-rose-50/50">
          <p className="text-[11px] font-semibold text-rose-700 uppercase">
            Inactive / Suspended
          </p>
          <p className="text-xl font-bold text-rose-800 mt-0.5">
            {inactiveCount}
          </p>
        </div>
      </div>

      {/* Employee Listing Table */}
      <HrmNotice loading={loading} error={error} onRetry={() => setRefresh((value) => value + 1)} empty={!loading && employees.length === 0 ? 'No employees were returned for this company.' : ''} />
      {!loading && !error && <EmployeeTable employees={employees} onSelectEmployee={handleSelectEmployee} onEditEmployee={(employee) => { setEditEmployee(employee); setEditForm({ firstName: employee.firstName || '', lastName: employee.lastName || '', email: employee.email === '—' ? '' : employee.email || '', phone: employee.phone === '—' ? '' : employee.phone || '', departmentName: employee.department || '', designationName: employee.designation === '—' ? '' : employee.designation || '', employmentType: employee.employmentType === '—' ? '' : employee.employmentType || '', status: String(employee.status || 'active').toUpperCase() === 'ON_LEAVE' ? 'ACTIVE' : String(employee.status || 'ACTIVE').toUpperCase(), monthlySalary: employee.registeredSalary ?? '' }); }} onDeleteEmployee={async (employee) => { try { await deactivateEmployee(employee.recordId); toast.success(`${employee.name} deactivated`); setRefresh((value) => value + 1); } catch (err) { toast.error(hrmError(err)); } }} canEdit={canEdit} canDelete={canDelete}/>}

      {/* Employee Detail Slide-Out */}
      <EmployeeDetail employee={selectedEmployee} open={detailOpen} onOpenChange={setDetailOpen}/>

      {/* Employee Registration Wizard */}
      <FormDrawer open={Boolean(editEmployee)} onOpenChange={(open) => { if (!open) setEditEmployee(null); }} title="Edit Employee" description={editEmployee ? `${editEmployee.name} · ${editEmployee.id}` : ''} submitLabel="Save changes" loading={saving} onSubmit={async (event) => { event.preventDefault(); setSaving(true); try { await updateEmployee(editEmployee.recordId, { firstName: editForm.firstName, lastName: editForm.lastName, email: editForm.email || undefined, phone: editForm.phone || undefined, departmentName: editForm.departmentName || undefined, designationName: editForm.designationName || undefined, employmentType: editForm.employmentType || undefined, status: editForm.status || undefined, monthlySalary: editForm.monthlySalary === '' ? undefined : Number(editForm.monthlySalary), basicSalary: editForm.monthlySalary === '' ? undefined : Number(editForm.monthlySalary) }); toast.success('Employee updated'); setEditEmployee(null); setRefresh((value) => value + 1); } catch (err) { toast.error(hrmError(err)); } finally { setSaving(false); } }}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Label className="grid gap-1 text-xs">First name<Input value={editForm.firstName || ''} onChange={(event) => setEditForm({ ...editForm, firstName: event.target.value })} /></Label>
          <Label className="grid gap-1 text-xs">Last name<Input value={editForm.lastName || ''} onChange={(event) => setEditForm({ ...editForm, lastName: event.target.value })} /></Label>
          <Label className="grid gap-1 text-xs">Email<Input value={editForm.email || ''} onChange={(event) => setEditForm({ ...editForm, email: event.target.value })} /></Label>
          <Label className="grid gap-1 text-xs">Phone<Input value={editForm.phone || ''} onChange={(event) => setEditForm({ ...editForm, phone: event.target.value })} /></Label>
          <Label className="grid gap-1 text-xs">Department<Input value={editForm.departmentName || ''} onChange={(event) => setEditForm({ ...editForm, departmentName: event.target.value })} /></Label>
          <Label className="grid gap-1 text-xs">Designation<Input value={editForm.designationName || ''} onChange={(event) => setEditForm({ ...editForm, designationName: event.target.value })} /></Label>
          <Label className="grid gap-1 text-xs">Employment type<Input value={editForm.employmentType || ''} onChange={(event) => setEditForm({ ...editForm, employmentType: event.target.value })} /></Label>
          <Label className="grid gap-1 text-xs">Status<select className="h-9 rounded-md border px-2 text-sm" value={editForm.status || 'ACTIVE'} onChange={(event) => setEditForm({ ...editForm, status: event.target.value })}><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></Label>
          <Label className="grid gap-1 text-xs">Monthly salary (₹)<Input type="number" min="0" value={editForm.monthlySalary ?? ''} onChange={(event) => setEditForm({ ...editForm, monthlySalary: event.target.value })} /></Label>
        </div>
      </FormDrawer>

      <EmployeeRegistrationWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        onSuccess={handleWizardSuccess}
      />
    </div>);
}
