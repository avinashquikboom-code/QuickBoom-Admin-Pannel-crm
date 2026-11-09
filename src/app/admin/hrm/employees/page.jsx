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
import { createEmployee, hrmError, loadEmployees } from '@/modules/hrm/hrm-api';
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

    const handleSelectEmployee = (emp) => {
        setSelectedEmployee(emp);
        setDetailOpen(true);
    };

    const handleWizardSuccess = async (wizardData) => {
        try {
            await createEmployee({
                firstName: wizardData.personal.firstName,
                lastName: wizardData.personal.lastName,
                email: wizardData.personal.corporateEmail,
                phone: wizardData.personal.phone,
                departmentName: wizardData.employment.department,
                designationName: wizardData.employment.jobTitle,
                branch: wizardData.employment.workLocation,
            });
            toast.success('Employee registered');
            setRefresh((value) => value + 1);
        } catch (err) {
            toast.error(hrmError(err));
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
      {!loading && !error && <EmployeeTable employees={employees} onSelectEmployee={handleSelectEmployee}/>}

      {/* Employee Detail Slide-Out */}
      <EmployeeDetail employee={selectedEmployee} open={detailOpen} onOpenChange={setDetailOpen}/>

      {/* Employee Registration Wizard */}
      <EmployeeRegistrationWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        onSuccess={handleWizardSuccess}
      />
    </div>);
}
