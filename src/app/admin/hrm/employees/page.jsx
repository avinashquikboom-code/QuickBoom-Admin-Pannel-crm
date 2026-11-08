'use client';
import { CURRENCY_CODE, CURRENCY_SYMBOL } from "@/lib/currency";

import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import * as React from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { EmployeeTable } from '@/modules/hrm/components/employees/EmployeeTable';
import { EmployeeDetail } from '@/modules/hrm/components/employees/EmployeeDetail';
import { EmployeeRegistrationWizard } from '@/modules/hrm/components/employees/wizard';
import { Button } from '@/components/common/Button';
import { mockEmployees } from '@/lib/mock-data';
import { toast } from '@/hooks/use-toast';
import { faUserPlus } from '@fortawesome/free-solid-svg-icons';
export default function EmployeesPage() {
    const [employees, setEmployees] = React.useState(mockEmployees);
    const [selectedEmployee, setSelectedEmployee] = React.useState(null);
    const [detailOpen, setDetailOpen] = React.useState(false);
    const [wizardOpen, setWizardOpen] = React.useState(false);

    const handleSelectEmployee = (emp) => {
        setSelectedEmployee(emp);
        setDetailOpen(true);
    };

    const handleWizardSuccess = (wizardData) => {
        const newEmp = {
            id: `EMP-${1000 + employees.length + 1}`,
            firstName: wizardData.personal.firstName,
            lastName: wizardData.personal.lastName,
            name: `${wizardData.personal.firstName} ${wizardData.personal.lastName}`,
            avatar: wizardData.personal.profilePhoto ? undefined : `https://images.unsplash.com/photo-${1534528741775 + employees.length}?w=150`,
            email: wizardData.personal.corporateEmail,
            phone: wizardData.personal.phone,
            department: wizardData.employment.department,
            designation: wizardData.employment.jobTitle,
            status: 'active',
            joinDate: wizardData.employment.dateOfJoining,
            employmentType: wizardData.employment.employmentType,
            location: wizardData.employment.workLocation,
            salary: {
                basic: Number(wizardData.organization.salary.basic) || 0,
                allowances: Number(wizardData.organization.salary.allowances) || 0,
                hourlyRate: (Number(wizardData.organization.salary.basic) || 0) / 160,
                currency: CURRENCY_CODE,
            },
            bankDetails: {
                accountName: wizardData.organization.bankDetails.accountHolderName,
                accountNumber: '•••• •••• ' + (wizardData.organization.bankDetails.accountNumber?.slice(-4) || '0000'),
                bankName: wizardData.organization.bankDetails.bankName,
                routingNumber: wizardData.organization.bankDetails.ifscCode,
            },
            emergencyContact: wizardData.emergency.contacts[0] || {
                name: 'Contact',
                relationship: 'Emergency',
                phone: '+1 (555) 000-0000',
            },
        };
        setEmployees((prev) => [newEmp, ...prev]);
        toast.success('Employee Registered Successfully', {
            description: `${newEmp.name} (${newEmp.id}) has been added to the system.`,
        });
    };
    const activeCount = employees.filter((e) => e.status === 'active').length;
    const onLeaveCount = employees.filter((e) => e.status === 'on_leave').length;
    const inactiveCount = employees.filter((e) => e.status === 'inactive').length;
    return (<div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader title="Employee Directory" description="Manage company personnel, designations, salary packages, and employment status." actions={<Button onClick={() => setWizardOpen(true)} className="bg-brand hover:bg-primary-hover text-primary-foreground font-medium text-xs h-9">
            <FontAwesomeIcon icon={faUserPlus} className="size-4 mr-1.5"/>
            Add New Employee
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
      <EmployeeTable employees={employees} onSelectEmployee={handleSelectEmployee}/>

      {/* Employee Detail Slide-Out */}
      <EmployeeDetail employee={selectedEmployee} open={detailOpen} onOpenChange={setDetailOpen}/>

      {/* Employee Registration Wizard Modal */}
      <EmployeeRegistrationWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        onSuccess={handleWizardSuccess}
      />
    </div>);
}
