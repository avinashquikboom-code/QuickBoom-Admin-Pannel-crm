'use client';
/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect } from 'react';
import { useEmployeeWizardStore } from '@/lib/stores/employee-wizard-store';
import { validateStep } from '@/lib/validations/employee-wizard-validation';
import { InputField, FormField } from './FormField';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/common/Select';

const EMPLOYMENT_TYPES = ['Full-Time', 'Part-Time', 'Contract', 'Intern', 'Temporary'];
const EMPLOYEE_STATUSES = ['Active', 'Probation', 'Notice Period', 'On Leave', 'Inactive'];
const WORK_MODES = ['Office', 'Hybrid', 'Remote'];

export function Step2EmploymentInfo({ onValidationChange, offices = [], shifts = [], assignmentError, designations = [], designationError, designationLoading, departments = [], managers = [], organizationError, organizationLoading }) {
  const store = useEmployeeWizardStore();
  const [errors, setErrors] = useState({});

  const fields = {
    dateOfJoining: store.dateOfJoining,
    employmentType: store.employmentType,
    jobTitle: store.jobTitle,
    department: store.department,
  };

  useEffect(() => {
    const validation = validateStep(2, fields);
    setErrors(validation.errors);
    onValidationChange?.(validation.isValid);
  }, [
    fields.dateOfJoining,
    fields.employmentType,
    fields.jobTitle,
    fields.department,
    store.employeeStatus,
    store.reportingManager,
    store.workLocation,
    store.officeBranch,
    store.workMode,
    onValidationChange,
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-slate-900">Employment Information</h2>
        <p className="text-xs text-slate-500 mt-1">Enter employment and job role details</p>
      </div>

      {/* Basic Employment Info */}
      <div>
        <h3 className="text-sm font-semibold text-slate-800 mb-3">Employment Details</h3>
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <InputField
              label="Date of Joining"
              required
              type="date"
              value={store.dateOfJoining}
              onChange={(e) => store.updateField('dateOfJoining', e.target.value)}
              error={errors.dateOfJoining}
            />

            <FormField label="Employment Type" required error={errors.employmentType}>
              <Select value={store.employmentType} onValueChange={(value) => store.updateField('employmentType', value)}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EMPLOYMENT_TYPES.map((type) => (
                    <SelectItem key={type} value={type} className="text-xs">
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Employee Status">
              <Select value={store.employeeStatus} onValueChange={(value) => store.updateField('employeeStatus', value)}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EMPLOYEE_STATUSES.map((status) => (
                    <SelectItem key={status} value={status} className="text-xs">
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Work Mode">
              <Select value={store.workMode} onValueChange={(value) => store.updateField('workMode', value)}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WORK_MODES.map((mode) => (
                    <SelectItem key={mode} value={mode} className="text-xs">
                      {mode}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>
        </div>
      </div>

      {/* Job Role */}
      <div>
        <h3 className="text-sm font-semibold text-slate-800 mb-3">Job Role & Organization</h3>
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Designation" required error={designationError || errors.jobTitle}>
              <select className="h-9 w-full rounded-md border px-2 text-xs" value={store.designation} disabled={designationLoading || Boolean(designationError)} onChange={(e) => { const item = designations.find((row) => String(row.id) === e.target.value); store.updateFields({ designation: e.target.value, jobTitle: item?.name || '' }); }}>
                <option value="">{designationLoading ? 'Loading designations...' : 'Select designation'}</option>
                {designations.filter((item) => item.status === 'Active').map((item) => <option key={item.id} value={String(item.id)}>{item.name}</option>)}
              </select>
            </FormField>

            <FormField label="Department" required error={organizationError || errors.department}>
              <select className="h-9 w-full rounded-md border px-2 text-xs" value={store.departmentId} disabled={organizationLoading || Boolean(organizationError)} onChange={(e) => { const item = departments.find((row) => String(row.id) === e.target.value); store.updateFields({ departmentId: e.target.value, department: item?.name || '' }); }}><option value="">{organizationLoading ? 'Loading departments...' : departments.length ? 'Select department' : 'No departments available'}</option>{departments.map((row) => <option key={row.id} value={String(row.id)}>{row.name}</option>)}</select>
            </FormField>
          </div>
          <FormField label="Reporting Manager" error={organizationError}>
            <select className="h-9 w-full rounded-md border px-2 text-xs" value={store.reportingManagerId} disabled={organizationLoading || Boolean(organizationError)} onChange={(e) => { const item = managers.find((row) => String(row.recordId) === e.target.value); store.updateFields({ reportingManagerId: e.target.value, reportingManager: item ? `${item.name} · ${item.id}` : '' }); }}><option value="">{organizationLoading ? 'Loading employees...' : 'Unassigned'}</option>{managers.filter((row) => row.status === 'active').map((row) => <option key={row.recordId} value={String(row.recordId)}>{row.name} · {row.id}</option>)}</select>
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <InputField
              label="Work Location"
              placeholder="e.g. San Francisco, CA"
              value={store.workLocation}
              onChange={(e) => store.updateField('workLocation', e.target.value)}
            />

            <FormField label="Office / Branch">
              <select className="h-9 w-full rounded-md border px-2 text-xs" value={store.officeBranch} onChange={(e) => store.updateField('officeBranch', e.target.value)}><option value="">Select office</option>{offices.filter((office) => office.status === 'Active').map((office) => <option key={office.id} value={String(office.id)}>{office.name}</option>)}</select>
            </FormField>
            <FormField label="Shift">
              <select className="h-9 w-full rounded-md border px-2 text-xs" value={store.shiftAssignment} onChange={(e) => store.updateField('shiftAssignment', e.target.value)}><option value="">Select shift</option>{shifts.filter((shift) => shift.status === 'ACTIVE').map((shift) => <option key={shift.id} value={String(shift.id)}>{shift.name}</option>)}</select>
            </FormField>
            {assignmentError && <p className="text-xs text-red-600 sm:col-span-2">Could not load offices and shifts: {assignmentError}</p>}
          </div>
        </div>
      </div>

    </div>
  );
}
