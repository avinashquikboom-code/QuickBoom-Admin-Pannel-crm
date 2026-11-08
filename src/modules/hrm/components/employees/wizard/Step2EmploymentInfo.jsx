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
const DEPARTMENTS = ['Engineering', 'Product & Design', 'Human Resources', 'Finance', 'Sales', 'Marketing', 'Operations', 'Other'];
const MANAGERS = ['Select a Manager', 'Sarah Jenkins', 'Alexander Vance', 'Priya Sharma', 'James Wilson', 'Emily Chen'];

export function Step2EmploymentInfo({ onValidationChange }) {
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
            <InputField
              label="Job Title / Designation"
              required
              placeholder="e.g. Senior Engineer"
              value={store.jobTitle}
              onChange={(e) => store.updateField('jobTitle', e.target.value)}
              error={errors.jobTitle}
            />

            <FormField label="Department" required error={errors.department}>
              <Select value={store.department} onValueChange={(value) => store.updateField('department', value)}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((dept) => (
                    <SelectItem key={dept} value={dept} className="text-xs">
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>

          <FormField label="Reporting Manager">
            <Select value={store.reportingManager} onValueChange={(value) => store.updateField('reportingManager', value)}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Select manager" />
              </SelectTrigger>
              <SelectContent>
                {MANAGERS.map((manager) => (
                  <SelectItem key={manager} value={manager} className="text-xs">
                    {manager}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <InputField
              label="Work Location"
              placeholder="e.g. San Francisco, CA"
              value={store.workLocation}
              onChange={(e) => store.updateField('workLocation', e.target.value)}
            />

            <InputField
              label="Office / Branch"
              placeholder="e.g. HQ Building A"
              value={store.officeBranch}
              onChange={(e) => store.updateField('officeBranch', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Contract Details */}
      <div>
        <h3 className="text-sm font-semibold text-slate-800 mb-3">Contract Details</h3>
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <InputField
              label="Probation Period (days)"
              type="number"
              placeholder="90"
              value={store.probationPeriod}
              onChange={(e) => store.updateField('probationPeriod', e.target.value)}
            />

            <InputField
              label="Employment Confirmation Date"
              type="date"
              value={store.employmentConfirmationDate}
              onChange={(e) => store.updateField('employmentConfirmationDate', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <InputField
              label="Contract Start Date"
              type="date"
              value={store.contractStartDate}
              onChange={(e) => store.updateField('contractStartDate', e.target.value)}
            />

            <InputField
              label="Contract End Date"
              type="date"
              value={store.contractEndDate}
              onChange={(e) => store.updateField('contractEndDate', e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
