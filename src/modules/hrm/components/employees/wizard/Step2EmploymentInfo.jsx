'use client';

import * as React from 'react';
import { useEmployeeWizardStore } from '@/lib/stores/employee-wizard-store';
import { validateStep } from '@/lib/validations/employee-wizard-validation';
import { FormField, InputField, SearchableSelect, SectionHeader } from './FormField';
import {
  Briefcase,
  Calendar,
  Clock,
  MapPin,
  Shield,
  Coffee,
  CheckCircle,
  Building,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const EMPLOYEE_TYPES = [
  { value: 'COMPANY', label: 'Company Payroll (Full-time / In-house)', subtext: 'Standard statutory deductions & benefits' },
  { value: 'FREELANCER', label: 'Freelancer / Contractor', subtext: 'Milestone or retainer basis without benefits' },
];

const EMPLOYEE_STATUSES = [
  { value: 'ACTIVE', label: 'Active', badge: 'Active' },
  { value: 'PROBATION', label: 'Under Probation', badge: 'Probation' },
  { value: 'NOTICE_PERIOD', label: 'Serving Notice Period', badge: 'Notice' },
  { value: 'ON_LEAVE', label: 'On Extended Leave', badge: 'Leave' },
  { value: 'INACTIVE', label: 'Inactive / Suspended', badge: 'Inactive' },
];

const EMPLOYMENT_TYPES = [
  { value: 'FULL_TIME', label: 'Full-Time Employment' },
  { value: 'PART_TIME', label: 'Part-Time Employment' },
  { value: 'CONTRACT', label: 'Fixed-Term Contract' },
  { value: 'INTERN', label: 'Internship / Trainee' },
];

const PROBATION_PERIODS = [
  { value: 'None', label: 'No Probation (Immediate Confirmation)' },
  { value: '1 Month', label: '1 Month' },
  { value: '3 Months', label: '3 Months (Standard)' },
  { value: '6 Months', label: '6 Months' },
];

const WORK_MODES = [
  { value: 'Office', label: 'In-Office (Geo-fenced attendance mandatory)' },
  { value: 'Hybrid', label: 'Hybrid (Split office & remote schedule)' },
  { value: 'Remote', label: 'Fully Remote (Work from anywhere)' },
];

const WEEKLY_OFFS = [
  { value: 'Sunday Only', label: 'Sunday Only (6-Day Working Week)' },
  { value: 'Saturday & Sunday', label: 'Saturday & Sunday (5-Day Working Week)' },
  { value: 'Rotational Off', label: 'Rotational Weekly Off (Roster Based)' },
  { value: 'Friday & Saturday', label: 'Friday & Saturday' },
];

export function Step2EmploymentInfo({
  onValidationChange,
  offices = [],
  shifts = [],
  assignmentError,
}) {
  const store = useEmployeeWizardStore();

  // Compute validation
  const validation = React.useMemo(() => {
    return validateStep(
      2,
      {
        dateOfJoining: store.dateOfJoining,
        employmentType: store.employmentType,
        employeeType: store.employeeType,
        officeBranch: store.officeBranch,
        shiftAssignment: store.shiftAssignment,
      },
      store.mode
    );
  }, [
    store.dateOfJoining,
    store.employmentType,
    store.employeeType,
    store.officeBranch,
    store.shiftAssignment,
    store.mode,
  ]);

  // Sync validation state with parent
  React.useEffect(() => {
    useEmployeeWizardStore.getState().setStepErrors(2, validation.errors);
    onValidationChange?.(validation.isValid);
  }, [validation.isValid, validation.errors, onValidationChange]);

  const isErrorVisible = (fieldName) => {
    const hasError = Boolean(validation.errors[fieldName]);
    const isTouched = Boolean(store.touchedFields[fieldName]);
    const isAttempted = Boolean(store.stepAttempted[2]);
    return hasError && (isTouched || isAttempted);
  };

  // Prepare Office Select Options
  const officeOptions = React.useMemo(() => {
    return (offices || []).map((o) => ({
      value: String(o.id),
      label: o.name || 'Branch Office',
      subtext: `${o.city || 'India'} · Geo-fence radius ${o.radiusMeters || 200}m`,
      badge: o.status === 'Active' ? 'Active' : undefined,
    }));
  }, [offices]);

  // Prepare Shift Select Options
  const shiftOptions = React.useMemo(() => {
    return (shifts || []).map((s) => ({
      value: String(s.id),
      label: s.name,
      subtext: `${s.startTime || '09:30'} – ${s.endTime || '18:30'} (${s.durationHours || 9} hrs)`,
      badge: s.isNightShift ? 'Night Shift' : 'Day Shift',
    }));
  }, [shifts]);

  // Find currently selected shift object for detailed preview
  const selectedShiftObj = React.useMemo(() => {
    if (!store.shiftAssignment) return null;
    return (shifts || []).find((s) => String(s.id) === String(store.shiftAssignment)) || null;
  }, [shifts, store.shiftAssignment]);

  // Find currently selected office object
  const selectedOfficeObj = React.useMemo(() => {
    if (!store.officeBranch) return null;
    return (offices || []).find((o) => String(o.id) === String(store.officeBranch)) || null;
  }, [offices, store.officeBranch]);

  return (
    <div className="space-y-6">
      {assignmentError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
          Could not load offices and shifts: {assignmentError}
        </div>
      )}

      {/* ── SECTION 1: CLASSIFICATION & IDENTIFICATION ─────────────── */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
        <SectionHeader
          title="Employment Classification"
          description="Define statutory employee category, contract status, and company code."
          icon={Briefcase}
        />

        {/* Employee Code & Category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-4">
          <FormField
            label="Employee ID / Code"
            hint={
              store.mode === 'edit'
                ? 'System employee code (immutable)'
                : 'Sequential code generated automatically by QuikBoom upon save'
            }
          >
            <div className="flex h-10 w-full items-center rounded-xl border border-slate-200 bg-slate-50/80 px-3 text-xs sm:text-[13px] font-semibold text-slate-700">
              {store.mode === 'edit' && store.employeeCode ? (
                <span className="font-mono text-emerald-700">{store.employeeCode}</span>
              ) : (
                <div className="flex items-center gap-1.5 text-slate-500">
                  <span className="rounded-md bg-emerald-100/80 px-1.5 py-0.2 font-mono text-[10px] font-bold text-[#16A34A]">
                    AUTO-GEN
                  </span>
                  <span>System assigned upon registration</span>
                </div>
              )}
            </div>
          </FormField>

          <SearchableSelect
            label="Employee Type"
            required
            options={EMPLOYEE_TYPES}
            value={store.employeeType}
            onChange={(val) => store.updateField('employeeType', val)}
            placeholder="Select classification..."
          />
        </div>

        {/* Employment Status & Employment Type */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <SearchableSelect
            label="Employment Status"
            required
            options={EMPLOYEE_STATUSES}
            value={store.employeeStatus}
            onChange={(val) => store.updateField('employeeStatus', val)}
            placeholder="Select status..."
          />

          <SearchableSelect
            label="Employment Nature"
            required
            options={EMPLOYMENT_TYPES}
            value={store.employmentType}
            onChange={(val) => store.updateField('employmentType', val)}
            placeholder="Select nature..."
          />
        </div>
      </div>

      {/* ── SECTION 2: DATES & MILESTONES ───────────────────────────── */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
        <SectionHeader
          title="Milestones & Work Arrangement"
          description="Onboarding dates, probation schedule, and attendance model."
          icon={Calendar}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-4">
          <InputField
            label="Date of Joining"
            required
            type="date"
            value={store.dateOfJoining}
            onChange={(e) => store.updateField('dateOfJoining', e.target.value)}
            onBlur={() => store.touchField('dateOfJoining')}
            error={validation.errors.dateOfJoining}
            touched={isErrorVisible('dateOfJoining')}
          />

          <SearchableSelect
            label="Probation Period"
            optional
            options={PROBATION_PERIODS}
            value={store.probationPeriod}
            onChange={(val) => store.updateField('probationPeriod', val)}
            placeholder="Select probation..."
          />

          <InputField
            label="Confirmation Date"
            optional
            type="date"
            value={store.employmentConfirmationDate}
            onChange={(e) => store.updateField('employmentConfirmationDate', e.target.value)}
            hint="Expected appraisal date"
          />

          <SearchableSelect
            label="Work Mode"
            required
            options={WORK_MODES}
            value={store.workMode}
            onChange={(val) => store.updateField('workMode', val)}
            placeholder="Select work mode..."
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <SearchableSelect
            label="Weekly Off Policy"
            optional
            options={WEEKLY_OFFS}
            value={store.weeklyOff}
            onChange={(val) => store.updateField('weeklyOff', val)}
            placeholder="Select weekly off..."
          />

          <InputField
            label="Work Location / Base Branch"
            optional
            placeholder="e.g. Mumbai Head Office"
            value={store.workLocation}
            onChange={(e) => store.updateField('workLocation', e.target.value)}
          />
        </div>
      </div>

      {/* ── SECTION 3: SHIFT & OFFICE GEOFENCE ASSIGNMENT ───────────── */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
        <SectionHeader
          title="Shift & Branch Attendance Geo-fence"
          description="Assign working schedule and geo-fence parameters required for mobile punch-in."
          icon={Clock}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-4">
          <SearchableSelect
            label="Branch / Geo-fence Office"
            required
            options={officeOptions}
            value={store.officeBranch}
            onChange={(val) => store.updateField('officeBranch', val)}
            onBlur={() => store.touchField('officeBranch')}
            placeholder="Select physical branch..."
            error={validation.errors.officeBranch}
            touched={isErrorVisible('officeBranch')}
            emptyText="No offices available. Please configure branches in Settings."
          />

          <SearchableSelect
            label="Shift Schedule"
            required
            options={shiftOptions}
            value={store.shiftAssignment}
            onChange={(val) => store.updateField('shiftAssignment', val)}
            onBlur={() => store.touchField('shiftAssignment')}
            placeholder="Select work shift..."
            error={validation.errors.shiftAssignment}
            touched={isErrorVisible('shiftAssignment')}
            emptyText="No active shifts available. Please configure shifts in HRM."
          />
        </div>

        {/* Live Shift Summary Card */}
        {selectedShiftObj ? (
          <div className="rounded-xl border border-emerald-200/80 bg-gradient-to-r from-emerald-50/80 via-white to-emerald-50/40 p-4 shadow-2xs animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="flex size-9 items-center justify-center rounded-xl bg-[#16A34A] text-white shadow-xs shrink-0 mt-0.5">
                  <Clock className="size-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">
                      {selectedShiftObj.name}
                    </span>
                    <span className="rounded-full bg-emerald-100 px-2 py-0.2 text-[10px] font-bold text-[#16A34A]">
                      {selectedShiftObj.isNightShift ? 'Night Shift' : 'Standard Shift'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span>
                      <strong className="text-slate-800">Timing:</strong> {selectedShiftObj.startTime || '09:30'} – {selectedShiftObj.endTime || '18:30'}
                    </span>
                    <span>•</span>
                    <span>
                      <strong className="text-slate-800">Duration:</strong> {selectedShiftObj.durationHours || 9} hrs
                    </span>
                    <span>•</span>
                    <span>
                      <strong className="text-slate-800">Break:</strong> {selectedShiftObj.breakDurationMinutes || 60} mins
                    </span>
                  </p>
                </div>
              </div>

              {selectedOfficeObj && (
                <div className="rounded-lg bg-white/90 border border-emerald-100 px-3 py-1.5 text-right shrink-0">
                  <p className="text-[10px] font-semibold text-slate-400">PUNCH-IN GEOFENCE</p>
                  <p className="text-xs font-bold text-emerald-800">
                    {selectedOfficeObj.name} ({selectedOfficeObj.radiusMeters || 200}m radius)
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-xs text-slate-500">
            <Info className="size-4 text-slate-400 shrink-0" />
            <span>Select an active shift above to preview the work schedule and daily punch-in window.</span>
          </div>
        )}
      </div>
    </div>
  );
}
