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
import { activateEmployee, bulkDeleteEmployees, createEmployee, deactivateEmployee, deleteEmployee, hrmError, loadEmployees, loadOffices, loadShifts, loadTeams, sessionCanAction, updateEmployee } from '@/modules/hrm/hrm-api';
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
    const [offices, setOffices] = React.useState([]);
    const [shifts, setShifts] = React.useState([]);
    const [departments, setDepartments] = React.useState([]);
    const [organizationError, setOrganizationError] = React.useState('');
    const [organizationLoading, setOrganizationLoading] = React.useState(false);
    const [teams, setTeams] = React.useState([]);
    React.useEffect(() => {
        let active = true;
        setOrganizationLoading(true);
        setOrganizationError('');
        Promise.all([loadDepartments(), loadTeams({ limit: 100 })]).then(([departmentRows, teamResult]) => {
            if (active) {
                setDepartments(departmentRows);
                setTeams(teamResult?.items || teamResult || []);
            }
        }).catch((err) => {
            if (active) {
                setDepartments([]);
                setOrganizationError(hrmError(err));
            }
        }).finally(() => {
            if (active) setOrganizationLoading(false);
        });
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
        setAssignmentError('');
        Promise.all([loadOffices(), loadShifts()]).then(([officeRows, shiftResult]) => {
            if (active) { setOffices(officeRows); setShifts(shiftResult.rows); }
        }).catch((err) => { if (active) setAssignmentError(hrmError(err)); });
        return () => { active = false; };
    }, [refresh]);
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
            const bankDetails = wizardData.organization?.bankDetails || {};
            const emergencyContacts = wizardData.emergency?.contacts || [];
            const fullAddress = [
                wizardData.personal.address?.residential,
                wizardData.personal.address?.city,
                wizardData.personal.address?.state,
                wizardData.personal.address?.pinCode,
            ].filter(Boolean).join(', ');

            const payload = {
                firstName: wizardData.personal.firstName,
                lastName: wizardData.personal.lastName,
                email: wizardData.personal.corporateEmail,
                phone: wizardData.personal.phone || undefined,
                gender: wizardData.personal.gender || undefined,
                dob: wizardData.personal.dateOfBirth || undefined,
                city: wizardData.personal.address?.city || undefined,
                address: fullAddress || undefined,
                dateOfJoining: wizardData.employment.dateOfJoining || undefined,
                joiningDate: wizardData.employment.dateOfJoining || undefined,
                employeeType: wizardData.employment.employeeType || undefined,
                employmentType: wizardData.employment.employmentType || undefined,
                status: wizardData.employment.employeeStatus || undefined,
                branch: wizardData.employment.workLocation || undefined,
                officeId: wizardData.employment.officeBranch ? Number(wizardData.employment.officeBranch) : undefined,
                shiftId: wizardData.employment.shiftAssignment ? Number(wizardData.employment.shiftAssignment) : undefined,
                departmentId: wizardData.organization.departmentId ? Number(wizardData.organization.departmentId) : undefined,
                departmentName: wizardData.organization.departmentName || undefined,
                designationId: wizardData.organization.designation ? Number(wizardData.organization.designation) : undefined,
                designationName: wizardData.organization.designationName || undefined,
                monthlySalary: salary.monthly !== '' && salary.monthly !== undefined ? Number(salary.monthly) : undefined,
                basicSalary: salary.basic !== '' && salary.basic !== undefined ? Number(salary.basic) : undefined,
                hra: salary.hra !== '' && salary.hra !== undefined ? Number(salary.hra) : undefined,
                allowances: salary.allowances !== '' && salary.allowances !== undefined ? Number(salary.allowances) : undefined,
                otherEarnings: salary.otherEarnings !== '' && salary.otherEarnings !== undefined ? Number(salary.otherEarnings) : undefined,
                bankDetails: Object.values(bankDetails).some(Boolean) ? bankDetails : undefined,
                emergencyContact: emergencyContacts.length > 0 ? emergencyContacts : undefined,
                mobileLoginEnabled: wizardData.mobileAccess.enabled,
                password: wizardData.mobileAccess.password ? wizardData.mobileAccess.password.trim() : undefined,
            };

            if (wizardData.mode === 'edit' && editEmployee) {
                await updateEmployee(editEmployee.recordId, payload, editEmployee.customerId);
                toast.success('Employee updated successfully');
            } else {
                await createEmployee(payload);
                toast.success('Employee registered successfully');
            }
            setRefresh((value) => value + 1);
            setEditEmployee(null);
            setWizardOpen(false);
        } catch (err) {
            throw new Error(hrmError(err));
        }
    };
    const activeCount = employees.filter((e) => e.status === 'active').length;
    const onLeaveCount = employees.filter((e) => e.status === 'on_leave').length;
    const inactiveCount = employees.filter((e) => e.status === 'inactive').length;
    return (<div className="max-w-none min-w-0 w-full space-y-6">
      <PageHeader title="Employee Directory" description="Manage company personnel, designations, salary packages, and employment status." actions={<Button onClick={() => { setEditEmployee(null); setWizardOpen(true); }} className="bg-brand hover:bg-primary-hover text-primary-foreground font-medium text-xs h-9">
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
          shifts={shifts}
          onSelectEmployee={handleSelectEmployee}
          onEditEmployee={(employee) => {
            setEditEmployee(employee);
            setWizardOpen(true);
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

      {/* Employee Registration / Edit Wizard */}
      <EmployeeRegistrationWizard
        open={wizardOpen}
        onOpenChange={(nextOpen) => {
          setWizardOpen(nextOpen);
          if (!nextOpen) setEditEmployee(null);
        }}
        onSuccess={handleWizardSuccess}
        editEmployee={editEmployee}
        offices={offices}
        shifts={shifts}
        assignmentError={assignmentError}
        designations={designations}
        designationError={designationError}
        designationLoading={designationLoading}
        departments={departments}
        organizationError={organizationError}
        organizationLoading={organizationLoading}
        employees={employees}
        teams={teams}
      />
    </div>);
}
