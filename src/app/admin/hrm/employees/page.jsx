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
import { activateEmployee, bulkDeleteEmployees, createEmployee, deactivateEmployee, deleteEmployee, hrmError, loadEmployees, loadOffices, loadShifts, sessionCanAction, updateEmployee } from '@/modules/hrm/hrm-api';
import { FormDrawer } from '@/components/common/drawers/FormDrawer';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { HrmNotice } from '@/modules/hrm/HrmNotice';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { PermanentDeleteDialog } from '@/components/common/PermanentDeleteDialog';
import { loadDepartments, loadDesignations } from '@/modules/master/master-api';
export default function EmployeesPage() {
    const [employees, setEmployees] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState('');
    const [refresh, setRefresh] = React.useState(0);
    React.useEffect(() => {
        const controller = new AbortController();
        setLoading(true);
        setError('');
        loadEmployees().then((rows) => { setEmployees(rows); setSelectedEmployee((current) => current ? rows.find((row) => row.recordId === current.recordId) || current : current); }).catch((err) => { if (!controller.signal.aborted) setError(hrmError(err)); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
        return () => controller.abort();
    }, [refresh]);
    const [selectedEmployee, setSelectedEmployee] = React.useState(null);
    const [detailOpen, setDetailOpen] = React.useState(false);
    const [wizardOpen, setWizardOpen] = React.useState(false);
    const [editEmployee, setEditEmployee] = React.useState(null);
    const [editForm, setEditForm] = React.useState({});
    const [offices, setOffices] = React.useState([]);
    const [shifts, setShifts] = React.useState([]);
    const [departments, setDepartments] = React.useState([]);
    const [organizationError, setOrganizationError] = React.useState('');
    const [organizationLoading, setOrganizationLoading] = React.useState(false);
    React.useEffect(() => {
        let active = true;
        setOrganizationLoading(true);
        setOrganizationError('');
        (async () => {
            const departmentRows = await loadDepartments();
            if (active) setDepartments(departmentRows);
        })().catch((err) => { if (active) { setDepartments([]); setOrganizationError(hrmError(err)); } }).finally(() => { if (active) setOrganizationLoading(false); });
        return () => { active = false; };
    }, [refresh]);
    const [designations, setDesignations] = React.useState([]);
    const [designationError, setDesignationError] = React.useState('');
    const [designationLoading, setDesignationLoading] = React.useState(false);
    React.useEffect(() => {
        if (!wizardOpen && !editEmployee) return;
        let active = true;
        setDesignationLoading(true);
        setDesignationError('');
        (async () => {
            const rows = [];
            let page = 1;
            let totalPages;
            do {
                const result = await loadDesignations({ page, limit: 100 });
                rows.push(...result.rows);
                totalPages = Number(result.meta.totalPages) || 1;
                page += 1;
            } while (page <= totalPages);
            if (active) setDesignations(rows);
        })().catch((err) => { if (active) { setDesignations([]); setDesignationError(hrmError(err)); } }).finally(() => { if (active) setDesignationLoading(false); });
        return () => { active = false; };
    }, [wizardOpen, editEmployee]);
    const [assignmentError, setAssignmentError] = React.useState('');
    React.useEffect(() => {
        let active = true;
        if (!wizardOpen && !editEmployee) return;
        setAssignmentError('');
        Promise.all([loadOffices(), loadShifts()]).then(([officeRows, shiftResult]) => {
            if (active) { setOffices(officeRows); setShifts(shiftResult.rows); }
        }).catch((err) => { if (active) setAssignmentError(hrmError(err)); });
        return () => { active = false; };
    }, [wizardOpen, editEmployee]);
    const [saving, setSaving] = React.useState(false);
    const [canEdit, setCanEdit] = React.useState(false);
    const [canDelete, setCanDelete] = React.useState(false);
    const [selected, setSelected] = React.useState([]);
    const [selectionReset, setSelectionReset] = React.useState(0);
    const [bulkDeactivateOpen, setBulkDeactivateOpen] = React.useState(false);
    const [bulkDeleteOpen, setBulkDeleteOpen] = React.useState(false);
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
                departmentId: Number(wizardData.employment.departmentId),
                designationId: Number(wizardData.organization.designation),
                branch: wizardData.employment.workLocation,
                officeId: wizardData.employment.officeBranch ? Number(wizardData.employment.officeBranch) : undefined,
                shiftId: wizardData.employment.shiftAssignment ? Number(wizardData.employment.shiftAssignment) : undefined,
                mobileLoginEnabled: wizardData.mobileAccess.enabled,
                password: wizardData.mobileAccess.password || undefined,
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
    return (<div className="max-w-none min-w-0 w-full space-y-6">
      <PageHeader title="Employee Directory" description="Manage company personnel, designations, salary packages, and employment status." actions={<Button onClick={() => setWizardOpen(true)} className="bg-brand hover:bg-primary-hover text-primary-foreground font-medium text-xs h-9">
            <FontAwesomeIcon icon={faUserPlus} className="size-4 mr-1.5"/>
            Add Employee
          </Button>}/>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 min-[440px]:grid-cols-2 sm:grid-cols-2 xl:grid-cols-4 gap-3">
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
      {!loading && !error && (
        <EmployeeTable
          employees={employees}
          onSelectEmployee={handleSelectEmployee}
          onEditEmployee={(employee) => {
            setEditEmployee(employee);
            setEditForm({
              firstName: employee.firstName || '',
              lastName: employee.lastName || '',
              email: employee.email === '—' ? '' : employee.email || '',
              phone: employee.phone === '—' ? '' : employee.phone || '',
              departmentId: employee.departmentId == null ? '' : String(employee.departmentId),
              designationId: employee.designationId == null ? '' : String(employee.designationId),
              employmentType: employee.employmentType === '—' ? '' : employee.employmentType || '',
              status: String(employee.status || 'active').toUpperCase() === 'ON_LEAVE' ? 'ACTIVE' : String(employee.status || 'ACTIVE').toUpperCase(),
              monthlySalary: employee.registeredSalary ?? '',
              employeeType: employee.employeeType || 'COMPANY',
              joiningDate: employee.joinDate === '—' ? '' : employee.joinDate || '',
              address: employee.address || '',
              officeId: employee.officeId ? String(employee.officeId) : '',
              shiftId: employee.shiftId ? String(employee.shiftId) : '',
              mobileLoginEnabled: employee.mobileLoginEnabled !== false,
              password: '',
            });
          }}
          onToggleStatus={async (employee) => {
            try {
              const isCurrentlyActive = employee.status === 'active';
              if (isCurrentlyActive) {
                const res = await deactivateEmployee(employee.recordId);
                toast.success(res?.message || `${employee.name} has been deactivated.`);
              } else {
                const res = await activateEmployee(employee.recordId);
                toast.success(res?.message || `${employee.name} has been activated.`);
              }
              setRefresh((value) => value + 1);
            } catch (err) {
              toast.error(hrmError(err));
            }
          }}
          onDeleteEmployee={async (employee) => {
            try {
              const res = await deleteEmployee(employee.recordId);
              setEmployees((current) => current.filter((row) => row.recordId !== employee.recordId));
              setSelectedEmployee((current) => current?.recordId === employee.recordId ? null : current);
              const action = res?.action;
              const msg = res?.message || (action === 'ARCHIVED'
                ? 'Employee archived successfully. Historical records preserved.'
                : 'Employee permanently deleted.');
              toast.success(msg);
              setRefresh((value) => value + 1);
            } catch (err) {
              toast.error(hrmError(err));
            }
          }}
          canEdit={canEdit}
          canDelete={canDelete}
          onSelectionChange={setSelected}
          selectionResetToken={selectionReset}
        />
      )}
      {selected.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[#E2E8E5] bg-white p-3">
          <span className="text-sm font-medium text-[#172B24]">{selected.length} selected</span>
          <Button variant="outline" size="sm" onClick={() => setSelectionReset((value) => value + 1)}>
            Clear selection
          </Button>
          {canEdit && (
            <Button variant="outline" size="sm" onClick={() => setBulkDeactivateOpen(true)}>
              Deactivate selected
            </Button>
          )}
          {canDelete && (
            <Button variant="destructive" size="sm" onClick={() => setBulkDeleteOpen(true)}>
              Delete selected
            </Button>
          )}
        </div>
      )}

      {/* Employee Detail Slide-Out */}
      <EmployeeDetail employee={selectedEmployee} open={detailOpen} onOpenChange={setDetailOpen}/>

      {/* Employee Registration Wizard */}
      <FormDrawer open={Boolean(editEmployee)} onOpenChange={(open) => { if (!open) { setEditEmployee(null); setEditForm({}); } }} title="Edit Employee" description={editEmployee ? `${editEmployee.name} · ${editEmployee.id}` : ''} submitLabel="Save changes" loading={saving} onSubmit={async (event) => { event.preventDefault(); setSaving(true); try { if (editForm.password && editForm.password.trim().length < 6) throw new Error('Password must be at least 6 characters.'); await updateEmployee(editEmployee.recordId, { officeId: editForm.officeId ? Number(editForm.officeId) : undefined, shiftId: editForm.shiftId ? Number(editForm.shiftId) : undefined, mobileLoginEnabled: editForm.mobileLoginEnabled, password: editForm.password || undefined, firstName: editForm.firstName, lastName: editForm.lastName, email: editForm.email || undefined, phone: editForm.phone || undefined, departmentId: editForm.departmentId && editForm.departmentId !== String(editEmployee.departmentId ?? '') ? Number(editForm.departmentId) : undefined, designationId: editForm.designationId && editForm.designationId !== String(editEmployee.designationId ?? '') ? Number(editForm.designationId) : undefined, employmentType: editForm.employmentType || undefined, status: editForm.status || undefined, employeeType: editForm.employeeType || undefined, joiningDate: editForm.joiningDate || undefined, address: editForm.address || undefined, monthlySalary: editForm.monthlySalary === '' ? undefined : Number(editForm.monthlySalary), basicSalary: editForm.monthlySalary === '' ? undefined : Number(editForm.monthlySalary) }, editEmployee.customerId); toast.success('Employee updated'); setEditEmployee(null); setEditForm({}); setRefresh((value) => value + 1); } catch (err) { toast.error(hrmError(err)); } finally { setSaving(false); } }}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Label className="grid gap-1 text-xs">First name<Input value={editForm.firstName || ''} onChange={(event) => setEditForm({ ...editForm, firstName: event.target.value })} /></Label>
          <Label className="grid gap-1 text-xs">Last name<Input value={editForm.lastName || ''} onChange={(event) => setEditForm({ ...editForm, lastName: event.target.value })} /></Label>
          <Label className="grid gap-1 text-xs">Email<Input value={editForm.email || ''} onChange={(event) => setEditForm({ ...editForm, email: event.target.value })} /></Label>
          <Label className="grid gap-1 text-xs">Phone<Input value={editForm.phone || ''} onChange={(event) => setEditForm({ ...editForm, phone: event.target.value })} /></Label>
          <Label className="grid gap-1 text-xs">Department<select className="h-9 rounded-md border px-2 text-sm" value={editForm.departmentId || ''} disabled={organizationLoading || Boolean(organizationError)} onChange={(event) => setEditForm({ ...editForm, departmentId: event.target.value })}><option value="" disabled={Boolean(editEmployee?.departmentId)}>Select department</option>{editEmployee?.departmentId && !departments.some((row) => String(row.id) === String(editEmployee.departmentId)) && <option value={String(editEmployee.departmentId)}>{editEmployee.department}</option>}{departments.map((row) => <option key={row.id} value={String(row.id)}>{row.name}</option>)}</select></Label>
          <Label className="grid gap-1 text-xs">Designation<select className="h-9 rounded-md border px-2 text-sm" value={editForm.designationId || ''} disabled={designationLoading || Boolean(designationError)} onChange={(event) => setEditForm({ ...editForm, designationId: event.target.value })}><option value="" disabled={Boolean(editEmployee?.designationId)}>Select designation</option>{editEmployee?.designationId && !designations.some((item) => String(item.id) === String(editEmployee.designationId)) && <option value={String(editEmployee.designationId)}>{editEmployee.designation}</option>}{designations.filter((item) => item.status === 'Active' || String(item.id) === String(editEmployee?.designationId)).map((item) => <option key={item.id} value={String(item.id)}>{item.name}{item.status !== 'Active' ? ' (inactive)' : ''}</option>)}</select>{designationError && <span className="text-red-600">Could not load designations: {designationError}</span>}</Label>
          <Label className="grid gap-1 text-xs">Employment type<Input value={editForm.employmentType || ''} onChange={(event) => setEditForm({ ...editForm, employmentType: event.target.value })} /></Label>
          <Label className="grid gap-1 text-xs">Status<select className="h-9 rounded-md border px-2 text-sm" value={editForm.status || 'ACTIVE'} onChange={(event) => setEditForm({ ...editForm, status: event.target.value })}><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></Label>
          <Label className="grid gap-1 text-xs">Employee type<select className="h-9 rounded-md border px-2 text-sm" value={editForm.employeeType || 'COMPANY'} onChange={(event) => setEditForm({ ...editForm, employeeType: event.target.value })}><option value="COMPANY">Company</option><option value="FREELANCER">Freelancer</option></select></Label>
          <Label className="grid gap-1 text-xs">Joining date<Input type="date" value={editForm.joiningDate || ''} onChange={(event) => setEditForm({ ...editForm, joiningDate: event.target.value })} /></Label>
          <Label className="grid gap-1 text-xs sm:col-span-2">Address<Input value={editForm.address || ''} onChange={(event) => setEditForm({ ...editForm, address: event.target.value })} /></Label>
          {assignmentError && <p className="text-sm text-red-600 sm:col-span-2">Could not load offices and shifts: {assignmentError}</p>}
          <Label className="grid gap-1 text-xs">Office<select className="h-9 rounded-md border px-2 text-sm" value={editForm.officeId || ''} onChange={(event) => setEditForm({ ...editForm, officeId: event.target.value })}><option value="" disabled={Boolean(editEmployee?.officeId)}>No office selected</option>{offices.filter((office) => office.status === 'Active' || String(office.id) === editForm.officeId).map((office) => <option key={office.id} value={String(office.id)}>{office.name}</option>)}</select></Label>
          <Label className="grid gap-1 text-xs">Shift<select className="h-9 rounded-md border px-2 text-sm" value={editForm.shiftId || ''} onChange={(event) => setEditForm({ ...editForm, shiftId: event.target.value })}><option value="" disabled={Boolean(editEmployee?.shiftId)}>No shift selected</option>{shifts.filter((shift) => shift.status === 'ACTIVE' || String(shift.id) === editForm.shiftId).map((shift) => <option key={shift.id} value={String(shift.id)}>{shift.name}</option>)}</select></Label>
          <Label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={editForm.mobileLoginEnabled === true} onChange={(event) => setEditForm({ ...editForm, mobileLoginEnabled: event.target.checked })} />Enable mobile login</Label>
          <Label className="grid gap-1 text-xs">New mobile password (optional)<Input type="password" autoComplete="new-password" value={editForm.password || ''} onChange={(event) => setEditForm({ ...editForm, password: event.target.value })} placeholder="Leave blank to keep current password" /></Label>
          <Label className="grid gap-1 text-xs">Monthly salary (₹)<Input type="number" min="0" value={editForm.monthlySalary ?? ''} onChange={(event) => setEditForm({ ...editForm, monthlySalary: event.target.value })} /></Label>
        </div>
      </FormDrawer>

      <ConfirmDialog
        open={bulkDeactivateOpen}
        onOpenChange={setBulkDeactivateOpen}
        title="Deactivate selected employees"
        description={`${selected.length} employees will be marked as inactive. Their mobile access will be revoked, but their profile and records remain intact.`}
        confirmLabel="Deactivate"
        onConfirm={async () => {
          setBulkDeactivateOpen(false);
          const rows = selected;
          let done = 0;
          for (const employee of rows) {
            try {
              await deactivateEmployee(employee.recordId);
              done += 1;
            } catch (err) {
              toast.error(hrmError(err));
            }
          }
          toast.success(`${done} employees deactivated successfully.`);
          setSelectionReset((value) => value + 1);
          setRefresh((value) => value + 1);
        }}
      />
      <PermanentDeleteDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        count={selected.length}
        noun="employee"
        warningNote="Employees with financial, attendance, or payroll history will be archived to protect legal records; employees without history will be permanently deleted."
        loading={saving}
        onConfirm={async () => {
          setSaving(true);
          try {
            const ids = selected.map((e) => e.recordId);
            const res = await bulkDeleteEmployees(ids);
            const count = res?.deletedCount ?? res?.archivedCount ?? ids.length;
            toast.success(`Successfully processed ${count} employee records.`);
            setBulkDeleteOpen(false);
            setSelected([]);
            setSelectionReset((value) => value + 1);
            setRefresh((value) => value + 1);
          } catch (err) {
            toast.error(hrmError(err));
          } finally {
            setSaving(false);
          }
        }}
      />
      <EmployeeRegistrationWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        onSuccess={handleWizardSuccess}
        offices={offices}
        shifts={shifts}
        assignmentError={assignmentError}
        designations={designations}
        designationError={designationError}
        designationLoading={designationLoading}
        departments={departments}
        organizationError={organizationError}
        organizationLoading={organizationLoading}
      />
    </div>);
}
