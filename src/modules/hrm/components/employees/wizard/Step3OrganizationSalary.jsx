'use client';

import * as React from 'react';
import { useEmployeeWizardStore } from '@/lib/stores/employee-wizard-store';
import { validateStep } from '@/lib/validations/employee-wizard-validation';
import { FormField, InputField, SearchableSelect, SectionHeader } from './FormField';
import {
  Building2,
  Users,
  IndianRupee,
  CreditCard,
  UserCheck,
  Shield,
  Layers,
} from 'lucide-react';

const ROLE_ACCESS_LEVELS = [
  { value: 'Staff', label: 'Standard Staff', subtext: 'Basic employee self-service access' },
  { value: 'Team Lead', label: 'Team Lead', subtext: 'Can view team attendance & tasks' },
  { value: 'Manager', label: 'Department Manager', subtext: 'Approval authority for leaves & advances' },
  { value: 'Sales Specialist', label: 'Sales / Telecaller Specialist', subtext: 'CRM lead assignment & communications' },
];

const DEFAULT_TEAMS = [
  { value: 'Sales', label: 'Sales & Client Acquisition' },
  { value: 'BPO', label: 'BPO & Telecalling Operations' },
  { value: 'Engineering', label: 'Engineering & Tech' },
  { value: 'Design', label: 'Design & Creative Media' },
  { value: 'Operations', label: 'Operations & Logistics' },
  { value: 'HR', label: 'Human Resources & People' },
  { value: 'Finance', label: 'Finance & Accounts' },
  { value: 'Marketing', label: 'Performance & Brand Marketing' },
];

const COMMON_BANKS = [
  { value: 'HDFC Bank', label: 'HDFC Bank' },
  { value: 'State Bank of India', label: 'State Bank of India (SBI)' },
  { value: 'ICICI Bank', label: 'ICICI Bank' },
  { value: 'Axis Bank', label: 'Axis Bank' },
  { value: 'Kotak Mahindra Bank', label: 'Kotak Mahindra Bank' },
  { value: 'IndusInd Bank', label: 'IndusInd Bank' },
  { value: 'Bank of Baroda', label: 'Bank of Baroda' },
  { value: 'Punjab National Bank', label: 'Punjab National Bank' },
  { value: 'Other', label: 'Other Commercial Bank' },
];

export function Step3OrganizationSalary({
  onValidationChange,
  departments = [],
  organizationError,
  organizationLoading = false,
  designations = [],
  designationError,
  designationLoading = false,
  employees = [],
  teams = [],
}) {
  const store = useEmployeeWizardStore();

  // Compute validation
  const validation = React.useMemo(() => {
    return validateStep(
      3,
      {
        departmentId: store.departmentId,
        designation: store.designation,
        monthlySalary: store.monthlySalary,
        ifscCode: store.ifscCode,
      },
      store.mode
    );
  }, [store.departmentId, store.designation, store.monthlySalary, store.ifscCode, store.mode]);

  // Sync validation state with parent
  React.useEffect(() => {
    useEmployeeWizardStore.getState().setStepErrors(3, validation.errors);
    onValidationChange?.(validation.isValid);
  }, [validation.isValid, validation.errors, onValidationChange]);

  const isErrorVisible = (fieldName) => {
    const hasError = Boolean(validation.errors[fieldName]);
    const isTouched = Boolean(store.touchedFields[fieldName]);
    const isAttempted = Boolean(store.stepAttempted[3]);
    return hasError && (isTouched || isAttempted);
  };

  // Prepare Department Select Options
  const departmentOptions = React.useMemo(() => {
    return (departments || []).map((d) => ({
      value: String(d.id),
      label: d.name,
      subtext: d.code ? `Code: ${d.code}` : undefined,
    }));
  }, [departments]);

  // Dependent Dropdown: Filter designations by selected department
  const designationOptions = React.useMemo(() => {
    const activeDesignations = (designations || []).filter(
      (d) => d.status === 'Active' || d.isActive !== false || String(d.id) === String(store.designation)
    );

    if (!store.departmentId) {
      return activeDesignations.map((d) => ({
        value: String(d.id),
        label: d.name,
        subtext: d.department?.name ? `Dept: ${d.department.name}` : undefined,
      }));
    }

    const matching = activeDesignations.filter(
      (d) => String(d.departmentId) === String(store.departmentId) || String(d.department?.id) === String(store.departmentId)
    );

    // If specific matching designations exist, place them first with a badge
    if (matching.length > 0) {
      const others = activeDesignations.filter(
        (d) => String(d.departmentId) !== String(store.departmentId) && String(d.department?.id) !== String(store.departmentId)
      );

      return [
        ...matching.map((d) => ({
          value: String(d.id),
          label: d.name,
          badge: 'Dept Match',
          subtext: d.code ? `Code: ${d.code}` : undefined,
        })),
        ...others.map((d) => ({
          value: String(d.id),
          label: d.name,
          subtext: d.department?.name ? `Other: ${d.department.name}` : 'General',
        })),
      ];
    }

    return activeDesignations.map((d) => ({
      value: String(d.id),
      label: d.name,
      subtext: d.department?.name ? `Dept: ${d.department.name}` : undefined,
    }));
  }, [designations, store.departmentId, store.designation]);

  // Prepare Reporting Manager Options (Active employees, excluding current employee)
  const managerOptions = React.useMemo(() => {
    return (employees || [])
      .filter((e) => {
        if (store.mode === 'edit' && String(e.recordId || e.id) === String(store.editEmployeeRecordId || store.editEmployeeId)) {
          return false;
        }
        return e.status === 'active' || String(e.status).toUpperCase() === 'ACTIVE';
      })
      .map((e) => ({
        value: String(e.recordId || e.id),
        label: e.name || `${e.firstName} ${e.lastName}`,
        subtext: `${e.employeeCode || e.id} · ${e.designation || 'Staff'}`,
      }));
  }, [employees, store.mode, store.editEmployeeRecordId, store.editEmployeeId]);

  // Prepare Teams Options
  const teamOptions = React.useMemo(() => {
    if (teams && teams.length > 0) {
      return teams.map((t) => ({
        value: t.name || t.code,
        label: t.name,
        subtext: t.code ? `Code: ${t.code}` : undefined,
      }));
    }
    return DEFAULT_TEAMS;
  }, [teams]);

  // Auto calculate total salary preview
  const totalSalaryCalculation = React.useMemo(() => {
    const basic = Number(store.basicSalary || store.monthlySalary || 0);
    const hra = Number(store.hra || 0);
    const allowances = Number(store.allowances || 0);
    const other = Number(store.otherEarnings || 0);
    return Math.round((basic + hra + allowances + other) * 100) / 100;
  }, [store.basicSalary, store.monthlySalary, store.hra, store.allowances, store.otherEarnings]);

  return (
    <div className="space-y-6">
      {organizationError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
          Could not load organization departments: {organizationError}
        </div>
      )}
      {designationError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
          Could not load designations: {designationError}
        </div>
      )}

      {/* ── SECTION 1: HIERARCHY & ROLE ASSIGNMENT ─────────────────── */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
        <SectionHeader
          title="Organization & Hierarchy Assignment"
          description="Map employee to their primary department, job designation, reporting manager, and team."
          icon={Building2}
        />

        {/* Department & Dependent Designation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-4">
          <SearchableSelect
            label="Department"
            required
            options={departmentOptions}
            value={store.departmentId}
            onChange={(val, opt) => {
              store.updateFields({
                departmentId: val,
                departmentName: opt?.label || '',
              });
            }}
            onBlur={() => store.touchField('departmentId')}
            placeholder={organizationLoading ? 'Loading departments...' : 'Select department...'}
            error={validation.errors.departmentId}
            touched={isErrorVisible('departmentId')}
            emptyText="No departments found. Add in Master settings."
          />

          <SearchableSelect
            label="Designation / Role"
            required
            options={designationOptions}
            value={store.designation}
            onChange={(val, opt) => {
              store.updateFields({
                designation: val,
                designationName: opt?.label || '',
              });
            }}
            onBlur={() => store.touchField('designation')}
            placeholder={designationLoading ? 'Loading designations...' : 'Select designation...'}
            error={validation.errors.designation}
            touched={isErrorVisible('designation')}
            emptyText="No designations available. Add in Master settings."
          />
        </div>

        {/* Reporting Manager & Team */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-4">
          <SearchableSelect
            label="Reporting Manager"
            optional
            options={managerOptions}
            value={store.reportingManagerId}
            onChange={(val, opt) => {
              store.updateFields({
                reportingManagerId: val,
                reportingManagerName: opt?.label || '',
              });
            }}
            placeholder="Select direct supervisor..."
            searchPlaceholder="Search active employees..."
            emptyText="No supervisor available"
          />

          <SearchableSelect
            label="Assigned Team / Squad"
            optional
            options={teamOptions}
            value={store.team}
            onChange={(val) => store.updateField('team', val)}
            placeholder="Select team pod..."
          />
        </div>

        {/* Company & Access Role Level */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <InputField
            label="Company Entity"
            disabled
            value={store.company || 'QuikBoom Marketing Agency'}
            onChange={(e) => store.updateField('company', e.target.value)}
          />

          <SearchableSelect
            label="Access Level / Role Authority"
            optional
            options={ROLE_ACCESS_LEVELS}
            value={store.roleAccessLevel}
            onChange={(val) => store.updateField('roleAccessLevel', val)}
            placeholder="Select authority..."
          />
        </div>
      </div>

      {/* ── SECTION 2: COMPENSATION & SALARY PACKAGE ──────────────── */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
        <SectionHeader
          title="Compensation & Monthly Salary Package"
          description="Registered monthly compensation used for payroll slips and salary advance limits."
          icon={IndianRupee}
          badge="INR (₹)"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-4">
          <InputField
            label="Monthly Gross Salary"
            optional
            type="number"
            min="0"
            prefixText="₹"
            placeholder="e.g. 25000"
            value={store.monthlySalary}
            onChange={(e) => {
              const val = e.target.value;
              store.updateFields({
                monthlySalary: val,
                basicSalary: store.basicSalary ? store.basicSalary : val,
              });
            }}
            onBlur={() => store.touchField('monthlySalary')}
            error={validation.errors.monthlySalary}
            touched={isErrorVisible('monthlySalary')}
          />

          <InputField
            label="Basic Salary (Component)"
            optional
            type="number"
            min="0"
            prefixText="₹"
            placeholder="e.g. 15000"
            value={store.basicSalary}
            onChange={(e) => store.updateField('basicSalary', e.target.value)}
          />

          <InputField
            label="House Rent Allowance (HRA)"
            optional
            type="number"
            min="0"
            prefixText="₹"
            placeholder="e.g. 5000"
            value={store.hra}
            onChange={(e) => store.updateField('hra', e.target.value)}
          />

          <InputField
            label="Special / Other Allowances"
            optional
            type="number"
            min="0"
            prefixText="₹"
            placeholder="e.g. 5000"
            value={store.allowances}
            onChange={(e) => store.updateField('allowances', e.target.value)}
          />
        </div>

        {/* Live Salary Total Preview */}
        {totalSalaryCalculation > 0 && (
          <div className="flex items-center justify-between rounded-xl border border-emerald-200/80 bg-emerald-50/50 p-3 text-xs">
            <span className="font-semibold text-slate-700">Calculated Monthly CTC Package:</span>
            <span className="text-sm font-bold text-[#16A34A]">
              ₹ {totalSalaryCalculation.toLocaleString('en-IN')} / month
            </span>
          </div>
        )}
      </div>

      {/* ── SECTION 3: BANK DETAILS ─────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
        <SectionHeader
          title="Disbursement Bank Details"
          description="Account information for monthly salary crediting and expense claim reimbursements."
          icon={CreditCard}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-4">
          <SearchableSelect
            label="Bank Name"
            optional
            options={COMMON_BANKS}
            value={store.bankName}
            onChange={(val) => store.updateField('bankName', val)}
            placeholder="Select banking institution..."
          />

          <InputField
            label="Account Holder Name"
            optional
            placeholder="Name as printed on bank passbook"
            value={store.accountHolderName}
            onChange={(e) => store.updateField('accountHolderName', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <InputField
            label="Bank Account Number"
            optional
            placeholder="e.g. 01234567890123"
            value={store.accountNumber}
            onChange={(e) => store.updateField('accountNumber', e.target.value)}
          />

          <InputField
            label="IFSC Code"
            optional
            placeholder="e.g. HDFC0001234"
            value={store.ifscCode}
            onChange={(e) => store.updateField('ifscCode', e.target.value.toUpperCase())}
            onBlur={() => store.touchField('ifscCode')}
            error={validation.errors.ifscCode}
            touched={isErrorVisible('ifscCode')}
            hint="11-character alphanumeric Indian Financial System Code"
          />
        </div>
      </div>
    </div>
  );
}
