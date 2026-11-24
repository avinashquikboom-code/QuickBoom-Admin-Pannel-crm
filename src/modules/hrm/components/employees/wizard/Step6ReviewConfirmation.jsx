'use client';

import * as React from 'react';
import { useEmployeeWizardStore } from '@/lib/stores/employee-wizard-store';
import { validateStep } from '@/lib/validations/employee-wizard-validation';
import {
  User,
  Phone,
  Briefcase,
  Building2,
  Clock,
  CreditCard,
  PhoneCall,
  Smartphone,
  Pencil,
  AlertCircle,
  CheckCircle2,
  MapPin,
  Mail,
  Shield,
  HeartHandshake,
} from 'lucide-react';
import { cn } from '@/lib/utils';

function ReviewCard({ title, icon: Icon, step, onEdit, children, hasError = false }) {
  return (
    <div
      className={cn(
        'rounded-2xl border bg-white p-5 shadow-xs transition-colors',
        hasError ? 'border-rose-200 ring-1 ring-rose-200' : 'border-slate-200/80 hover:border-slate-300'
      )}
    >
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3.5">
        <div className="flex items-center gap-2.5">
          {Icon && (
            <div
              className={cn(
                'flex size-7 items-center justify-center rounded-lg ring-1',
                hasError
                  ? 'bg-rose-50 text-rose-600 ring-rose-200'
                  : 'bg-emerald-50 text-[#16A34A] ring-emerald-200/50'
              )}
            >
              <Icon className="size-4" />
            </div>
          )}
          <h4 className="text-xs sm:text-[13px] font-bold text-slate-900">{title}</h4>
        </div>

        <button
          type="button"
          onClick={() => onEdit(step)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-emerald-50 hover:text-[#16A34A] hover:border-emerald-200 transition-colors"
        >
          <Pencil className="size-3" />
          <span>Edit</span>
        </button>
      </div>

      <div className="space-y-2">{children}</div>
    </div>
  );
}

function ReviewRow({ label, value, isMissing = false, highlight = false }) {
  return (
    <div className="flex items-start justify-between py-1 border-b border-slate-50 last:border-0 text-xs">
      <span className="text-slate-500 font-medium">{label}</span>
      <span
        className={cn(
          'text-right font-semibold max-w-[60%] truncate',
          isMissing
            ? 'text-rose-600 italic font-normal'
            : highlight
              ? 'text-[#16A34A] font-bold'
              : 'text-slate-800'
        )}
      >
        {value || (isMissing ? 'Not specified (Required)' : '—')}
      </span>
    </div>
  );
}

export function Step6ReviewConfirmation({
  onEdit,
  offices = [],
  shifts = [],
  departments = [],
  designations = [],
  employees = [],
}) {
  const store = useEmployeeWizardStore();

  // Validate entire form for review summary
  const validationResult = React.useMemo(() => {
    return validateStep(6, store.getAllData(), store.mode);
  }, [store]);

  const missingFields = Object.entries(validationResult.errors || {});
  const isValid = missingFields.length === 0;

  // Resolve Names for Display
  const officeName =
    offices.find((o) => String(o.id) === String(store.officeBranch))?.name ||
    store.workLocation ||
    'Head Office';

  const shiftObj = shifts.find((s) => String(s.id) === String(store.shiftAssignment));
  const shiftText = shiftObj
    ? `${shiftObj.name} (${shiftObj.startTime} – ${shiftObj.endTime})`
    : null;

  const departmentName =
    departments.find((d) => String(d.id) === String(store.departmentId))?.name ||
    store.departmentName ||
    '';

  const designationName =
    designations.find((d) => String(d.id) === String(store.designation))?.name ||
    store.designationName ||
    '';

  const managerName =
    employees.find((e) => String(e.recordId || e.id) === String(store.reportingManagerId))?.name ||
    store.reportingManagerName ||
    '';

  const fullName = [store.firstName, store.middleName, store.lastName].filter(Boolean).join(' ');

  return (
    <div className="space-y-6">
      {/* ── HEADER SUMMARY BANNER ───────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Avatar Preview */}
            <div className="size-16 rounded-full border-2 border-emerald-500 overflow-hidden bg-slate-50 flex items-center justify-center shrink-0 shadow-sm">
              {store.profilePhotoPreview ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={store.profilePhotoPreview}
                  alt={fullName}
                  className="size-full object-cover"
                />
              ) : (
                <span className="text-lg font-black text-[#16A34A]">
                  {[store.firstName?.[0], store.lastName?.[0]].filter(Boolean).join('') || 'EMP'}
                </span>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-slate-900">{fullName || 'Unnamed Employee'}</h3>
                <span className="rounded-full bg-emerald-100 px-2 py-0.2 text-[10px] font-bold text-[#16A34A]">
                  {store.employeeType === 'FREELANCER' ? 'Contractor' : 'Company Payroll'}
                </span>
                <span className="rounded-full bg-slate-100 px-2 py-0.2 text-[10px] font-semibold text-slate-600">
                  {store.employmentType?.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {designationName || 'Role not selected'} • {departmentName || 'Department not selected'}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {store.corporateEmail || 'No corporate email'} • {store.phone || 'No phone'}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-right shrink-0">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">STATUS</p>
            <p className="text-xs font-bold text-slate-900 mt-0.5">
              {store.mode === 'edit' ? 'Updating Record' : 'Ready to Onboard'}
            </p>
            <p className="text-[11px] text-emerald-700 font-medium mt-0.5">
              {isValid ? 'All required fields valid' : `${missingFields.length} issue(s) require attention`}
            </p>
          </div>
        </div>
      </div>

      {/* ── VALIDATION WARNINGS IF ANY MISSING FIELDS ──────────────── */}
      {!isValid && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-xs text-amber-900 animate-fadeIn">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="size-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold">Missing Required Information</p>
              <p className="text-amber-700 text-[11px] mt-0.5">
                Please review and complete the following required fields before submitting:
              </p>
              <ul className="mt-2 space-y-1 list-disc list-inside text-amber-800 font-medium">
                {missingFields.map(([field, msg]) => (
                  <li key={field} className="text-[11px]">
                    {msg}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ── 2-COLUMN REVIEW GRIDS ───────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Card 1: Personal & Contact */}
        <ReviewCard title="Personal Information & Contact" icon={User} step={1} onEdit={onEdit}>
          <ReviewRow label="Full Name" value={fullName} isMissing={!store.firstName || !store.lastName} />
          <ReviewRow label="Date of Birth" value={store.dateOfBirth} />
          <ReviewRow label="Gender" value={store.gender} />
          <ReviewRow label="Corporate Email" value={store.corporateEmail} isMissing={!store.corporateEmail} />
          <ReviewRow label="Personal Email" value={store.personalEmail} />
          <ReviewRow label="Primary Phone" value={store.phone} isMissing={!store.phone} />
          <ReviewRow label="Current City" value={store.city} />
          <ReviewRow label="Residential Address" value={store.residentialAddress} />
        </ReviewCard>

        {/* Card 2: Employment Details */}
        <ReviewCard title="Employment & Work Schedule" icon={Briefcase} step={2} onEdit={onEdit}>
          <ReviewRow
            label="Employee Code"
            value={store.mode === 'edit' ? store.employeeCode : 'Auto-generated on Save'}
          />
          <ReviewRow label="Employee Classification" value={store.employeeType} isMissing={!store.employeeType} />
          <ReviewRow label="Employment Status" value={store.employeeStatus} />
          <ReviewRow label="Date of Joining" value={store.dateOfJoining} isMissing={!store.dateOfJoining} />
          <ReviewRow label="Work Mode" value={store.workMode} />
          <ReviewRow label="Geo-fence Office" value={officeName} isMissing={!store.officeBranch} />
          <ReviewRow label="Shift Schedule" value={shiftText} isMissing={!store.shiftAssignment} />
          <ReviewRow label="Weekly Off Policy" value={store.weeklyOff} />
        </ReviewCard>

        {/* Card 3: Organization & Role */}
        <ReviewCard title="Organization & Role Assignment" icon={Building2} step={3} onEdit={onEdit}>
          <ReviewRow label="Department" value={departmentName} isMissing={!store.departmentId} />
          <ReviewRow label="Designation" value={designationName} isMissing={!store.designation} />
          <ReviewRow label="Reporting Manager" value={managerName || 'Direct to Management'} />
          <ReviewRow label="Assigned Team / Squad" value={store.team || 'General Staff'} />
          <ReviewRow label="Access Role Authority" value={store.roleAccessLevel} />
          <ReviewRow
            label="Monthly Gross Salary"
            value={store.monthlySalary ? `₹ ${Number(store.monthlySalary).toLocaleString('en-IN')}` : 'Not Specified'}
            highlight={Boolean(store.monthlySalary)}
          />
          <ReviewRow label="Disbursement Bank" value={store.bankName} />
          <ReviewRow label="Account Number" value={store.accountNumber ? `••••${store.accountNumber.slice(-4)}` : '—'} />
        </ReviewCard>

        {/* Card 4: Emergency Contacts & Mobile Access */}
        <ReviewCard title="Emergency Contacts & Mobile Access" icon={Smartphone} step={5} onEdit={onEdit}>
          {store.emergencyContacts?.[0] && (
            <>
              <ReviewRow
                label="Primary Contact Person"
                value={`${store.emergencyContacts[0].name} (${store.emergencyContacts[0].relationship || 'Contact'})`}
                isMissing={!store.emergencyContacts[0].name}
              />
              <ReviewRow
                label="Emergency Phone"
                value={store.emergencyContacts[0].primaryContact}
                isMissing={!store.emergencyContacts[0].primaryContact}
              />
            </>
          )}
          <ReviewRow
            label="Mobile App Login Status"
            value={store.enableMobileAccess ? 'Authorized (Enabled)' : 'Disabled'}
            highlight={store.enableMobileAccess}
          />
          <ReviewRow label="Mobile Sign-in Identifier" value={store.corporateEmail || store.phone} />
          <ReviewRow
            label="Mobile Password"
            value={
              store.mode === 'edit'
                ? store.password ? 'Reset with new password' : 'Preserved existing encrypted password'
                : store.password ? 'Custom initial password set' : 'Default temporary password (123456)'
            }
          />
        </ReviewCard>
      </div>
    </div>
  );
}
