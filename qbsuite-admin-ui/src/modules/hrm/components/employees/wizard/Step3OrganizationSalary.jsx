'use client';
/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect } from 'react';
import { useEmployeeWizardStore } from '@/lib/stores/employee-wizard-store';
import { validateStep } from '@/lib/validations/employee-wizard-validation';
import { InputField, FormField } from './FormField';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/common/Select';
import { Checkbox } from '@/components/common/Checkbox';
import { Label } from '@/components/common/Label';

const COMPANIES = ['QB Suite Inc.', 'QB Solutions', 'QB Technologies'];
const BRANCHES = ['San Francisco HQ', 'Austin Office', 'New York Office', 'London Office'];
const DESIGNATIONS = ['Intern', 'Junior Engineer', 'Senior Engineer', 'Staff Engineer', 'Engineering Manager', 'Director', 'VP', 'Other'];
const TEAMS = ['Backend', 'Frontend', 'Mobile', 'DevOps', 'QA', 'Product', 'Design', 'Management'];
const ROLES = ['Admin', 'Manager', 'Supervisor', 'Employee', 'Viewer'];
const CATEGORIES = ['Salaried', 'Hourly', 'Contract', 'Intern', 'Consultant'];
const SALARY_STRUCTURES = ['Standard', 'CTC-Based', 'Commission-Based', 'Custom'];
const BANKS = ['HDFC Bank', 'ICICI Bank', 'Axis Bank', 'SBI', 'Kotak Bank', 'IndusInd Bank', 'Other'];

export function Step3OrganizationSalary({ onValidationChange }) {
  const store = useEmployeeWizardStore();
  const [errors, setErrors] = useState({});

  const fields = {
    basicSalary: store.basicSalary,
    bankName: store.bankName,
    accountNumber: store.accountNumber,
    ifscCode: store.ifscCode,
  };

  useEffect(() => {
    const validation = validateStep(3, fields);
    setErrors(validation.errors);
    onValidationChange?.(validation.isValid);
  }, [
    fields.basicSalary,
    fields.bankName,
    fields.accountNumber,
    fields.ifscCode,
    store.designation,
    store.team,
    store.hra,
    store.allowances,
    onValidationChange,
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-slate-900">Organization & Salary Information</h2>
        <p className="text-xs text-slate-500 mt-1">Configure organization hierarchy and compensation</p>
      </div>

      {/* Organization */}
      <div>
        <h3 className="text-sm font-semibold text-slate-800 mb-3">Organization</h3>
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Company">
              <Select value={store.company} onValueChange={(value) => store.updateField('company', value)}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Select company" />
                </SelectTrigger>
                <SelectContent>
                  {COMPANIES.map((company) => (
                    <SelectItem key={company} value={company} className="text-xs">
                      {company}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Branch">
              <Select value={store.branch} onValueChange={(value) => store.updateField('branch', value)}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent>
                  {BRANCHES.map((branch) => (
                    <SelectItem key={branch} value={branch} className="text-xs">
                      {branch}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Designation">
              <Select value={store.designation} onValueChange={(value) => store.updateField('designation', value)}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Select designation" />
                </SelectTrigger>
                <SelectContent>
                  {DESIGNATIONS.map((designation) => (
                    <SelectItem key={designation} value={designation} className="text-xs">
                      {designation}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Team">
              <Select value={store.team} onValueChange={(value) => store.updateField('team', value)}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Select team" />
                </SelectTrigger>
                <SelectContent>
                  {TEAMS.map((team) => (
                    <SelectItem key={team} value={team} className="text-xs">
                      {team}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Role / Access Level">
              <Select value={store.roleAccessLevel} onValueChange={(value) => store.updateField('roleAccessLevel', value)}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((role) => (
                    <SelectItem key={role} value={role} className="text-xs">
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <div>
              <FormField label="Employee Category">
                <Select value={store.employeeCategory} onValueChange={(value) => store.updateField('employeeCategory', value)}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat} className="text-xs">
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            </div>
          </div>

          <InputField
            label="Cost Center"
            placeholder="e.g. CC-001"
            value={store.costCenter}
            onChange={(e) => store.updateField('costCenter', e.target.value)}
          />
        </div>
      </div>

      {/* Salary Structure */}
      <div>
        <h3 className="text-sm font-semibold text-slate-800 mb-3">Salary Structure</h3>
        <div className="space-y-3">
          <FormField label="Salary Structure Type">
            <Select value={store.salaryStructure} onValueChange={(value) => store.updateField('salaryStructure', value)}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Select structure" />
              </SelectTrigger>
              <SelectContent>
                {SALARY_STRUCTURES.map((struct) => (
                  <SelectItem key={struct} value={struct} className="text-xs">
                    {struct}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <InputField
              label="Basic Salary (₹)"
              required
              type="number"
              placeholder="50000"
              value={store.basicSalary}
              onChange={(e) => store.updateField('basicSalary', e.target.value)}
              error={errors.basicSalary}
            />

            <InputField
              label="HRA (₹)"
              type="number"
              placeholder="15000"
              value={store.hra}
              onChange={(e) => store.updateField('hra', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <InputField
              label="Allowances (₹)"
              type="number"
              placeholder="5000"
              value={store.allowances}
              onChange={(e) => store.updateField('allowances', e.target.value)}
            />

            <InputField
              label="Other Earnings (₹)"
              type="number"
              placeholder="0"
              value={store.otherEarnings}
              onChange={(e) => store.updateField('otherEarnings', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Deductions & Applicability */}
      <div>
        <h3 className="text-sm font-semibold text-slate-800 mb-3">Deductions & Tax</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="pf"
              checked={store.pfApplicable === 'Yes'}
              onCheckedChange={(checked) => store.updateField('pfApplicable', checked ? 'Yes' : 'No')}
            />
            <Label htmlFor="pf" className="text-xs font-medium cursor-pointer">
              PF Applicable
            </Label>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="esic"
              checked={store.esicApplicable === 'Yes'}
              onCheckedChange={(checked) => store.updateField('esicApplicable', checked ? 'Yes' : 'No')}
            />
            <Label htmlFor="esic" className="text-xs font-medium cursor-pointer">
              ESIC Applicable
            </Label>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="pt"
              checked={store.professionalTaxApplicable === 'Yes'}
              onCheckedChange={(checked) => store.updateField('professionalTaxApplicable', checked ? 'Yes' : 'No')}
            />
            <Label htmlFor="pt" className="text-xs font-medium cursor-pointer">
              Professional Tax Applicable
            </Label>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="tds"
              checked={store.tdsApplicable === 'Yes'}
              onCheckedChange={(checked) => store.updateField('tdsApplicable', checked ? 'Yes' : 'No')}
            />
            <Label htmlFor="tds" className="text-xs font-medium cursor-pointer">
              TDS Applicable
            </Label>
          </div>
        </div>
      </div>

      {/* Bank Details */}
      <div>
        <h3 className="text-sm font-semibold text-slate-800 mb-3">Bank & Payment Details</h3>
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Bank Name" required error={errors.bankName}>
              <Select value={store.bankName} onValueChange={(value) => store.updateField('bankName', value)}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Select bank" />
                </SelectTrigger>
                <SelectContent>
                  {BANKS.map((bank) => (
                    <SelectItem key={bank} value={bank} className="text-xs">
                      {bank}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <InputField
              label="Account Holder Name"
              placeholder="Full name as per bank"
              value={store.accountHolderName}
              onChange={(e) => store.updateField('accountHolderName', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <InputField
              label="Account Number"
              required
              placeholder="0000000000"
              value={store.accountNumber}
              onChange={(e) => store.updateField('accountNumber', e.target.value)}
              error={errors.accountNumber}
            />

            <InputField
              label="IFSC Code"
              required
              placeholder="HDFC0000001"
              value={store.ifscCode}
              onChange={(e) => store.updateField('ifscCode', e.target.value.toUpperCase())}
              error={errors.ifscCode}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <InputField
              label="UAN Number"
              placeholder="UAN-XXXXX"
              value={store.uanNumber}
              onChange={(e) => store.updateField('uanNumber', e.target.value)}
            />

            <InputField
              label="ESIC Number"
              placeholder="ESIC-XXXXX"
              value={store.esicNumber}
              onChange={(e) => store.updateField('esicNumber', e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
