'use client';
import React from 'react';
import { useEmployeeWizardStore } from '@/lib/stores/employee-wizard-store';
import { Button } from '@/components/common/Button';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import { faEdit, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/common/Avatar';
import { Checkbox } from '@/components/common/Checkbox';
import { Label } from '@/components/common/Label';
import { cn } from '@/lib/utils';

const SECTIONS = [
  { id: 1, title: 'Personal Information' },
  { id: 2, title: 'Employment Information' },
  { id: 3, title: 'Organization & Salary' },
  { id: 4, title: 'Emergency Contacts' },
  { id: 5, title: 'Mobile Access & Permissions' },
];

function ReviewSection({ title, step, data, onEdit, isValid, hasError }) {
  return (
    <div className="border-2 border-slate-200 rounded-lg overflow-hidden hover:border-slate-300 transition-colors">
      <div className="bg-slate-50/50 px-4 py-3 flex items-center justify-between border-b border-slate-200">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
          {isValid ? (
            <FontAwesomeIcon icon={faCheckCircle} className="size-4 text-brand" />
          ) : hasError ? (
            <div className="w-4 h-4 rounded-full bg-red-500" />
          ) : null}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onEdit(step)}
          className="h-7 px-2.5 text-xs border-slate-200 hover:bg-brand-light"
        >
          <FontAwesomeIcon icon={faEdit} className="size-3 mr-1" />
          Edit
        </Button>
      </div>
      <div className="p-4 space-y-3">
        {data}
      </div>
    </div>
  );
}

function DetailRow({ label, value, emphasis = false }) {
  if (!value) return null;
  return (
    <div className="flex items-start justify-between py-1.5 border-b border-slate-100 last:border-0">
      <span className="text-xs text-slate-600 font-medium">{label}</span>
      <span className={cn('text-xs font-semibold text-right', emphasis ? 'text-brand' : 'text-slate-900')}>
        {value}
      </span>
    </div>
  );
}

export function Step6ReviewConfirmation({ onEdit }) {
  const store = useEmployeeWizardStore();
  const data = store.getAllData();
  const [agreedToTerms, setAgreedToTerms] = React.useState(false);

  const fullName = `${store.firstName} ${store.lastName}`.trim();
  const avatarInitial = `${store.firstName?.[0] || ''}${store.lastName?.[0] || ''}`;

  const hasAllRequiredFields = () => {
    return (
      store.firstName &&
      store.lastName &&
      store.corporateEmail &&
      store.phone &&
      store.dateOfBirth &&
      store.dateOfJoining &&
      store.employmentType &&
      store.jobTitle &&
      store.department &&
      store.basicSalary &&
      store.bankName &&
      store.accountNumber &&
      store.ifscCode &&
      store.emergencyContacts.some(c => c.name && c.relationship && c.primaryContact)
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-slate-900">Review & Confirmation</h2>
        <p className="text-xs text-slate-500 mt-1">Please review all the information before submitting</p>
      </div>

      {/* Employee Summary Card */}
      <div className="p-4 border-2 border-brand/20 bg-brand-light/30 rounded-lg">
        <div className="flex items-center gap-4">
          <Avatar className="size-16 border-2 border-brand">
            <AvatarImage src={store.profilePhotoPreview} alt={fullName} />
            <AvatarFallback className="bg-brand text-white font-bold text-lg">
              {avatarInitial}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-lg font-bold text-slate-900">{fullName}</h3>
            <p className="text-xs text-slate-600 mt-1">
              {store.jobTitle} • {store.department}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              {store.corporateEmail}
            </p>
          </div>
        </div>
      </div>

      {/* Review Sections */}
      <div className="space-y-4">
        {/* Section 1: Personal Information */}
        <ReviewSection
          title="Personal Information"
          step={1}
          onEdit={onEdit}
          isValid={store.firstName && store.lastName && store.corporateEmail}
          data={
            <div className="space-y-2">
              <DetailRow label="Full Name" value={fullName} emphasis />
              <DetailRow label="Corporate Email" value={data.personal.corporateEmail} />
              <DetailRow label="Personal Email" value={data.personal.personalEmail} />
              <DetailRow label="Phone" value={data.personal.phone} />
              <DetailRow label="Alternate Phone" value={data.personal.alternatePhone} />
              <DetailRow label="Date of Birth" value={data.personal.dateOfBirth} />
              <DetailRow label="Gender" value={data.personal.gender} />
              <DetailRow label="Blood Group" value={data.personal.bloodGroup} />
              <DetailRow label="Marital Status" value={data.personal.maritalStatus} />
              <DetailRow label="Address" value={`${data.personal.address.residential}, ${data.personal.address.city}, ${data.personal.address.state}`} />
              <DetailRow label="Country" value={data.personal.address.country} />
              <DetailRow label="PIN Code" value={data.personal.address.pinCode} />
            </div>
          }
        />

        {/* Section 2: Employment Information */}
        <ReviewSection
          title="Employment Information"
          step={2}
          onEdit={onEdit}
          isValid={store.dateOfJoining && store.employmentType && store.jobTitle && store.department}
          data={
            <div className="space-y-2">
              <DetailRow label="Date of Joining" value={data.employment.dateOfJoining} emphasis />
              <DetailRow label="Employment Type" value={data.employment.employmentType} />
              <DetailRow label="Job Title" value={data.employment.jobTitle} />
              <DetailRow label="Department" value={data.employment.department} />
              <DetailRow label="Employee Status" value={data.employment.employeeStatus} />
              <DetailRow label="Work Mode" value={data.employment.workMode} />
              <DetailRow label="Reporting Manager" value={data.employment.reportingManager} />
              <DetailRow label="Work Location" value={data.employment.workLocation} />
              <DetailRow label="Office / Branch" value={data.employment.officeBranch} />
              <DetailRow label="Probation Period" value={data.employment.probationPeriod ? `${data.employment.probationPeriod} days` : undefined} />
              <DetailRow label="Confirmation Date" value={data.employment.employmentConfirmationDate} />
            </div>
          }
        />

        {/* Section 3: Organization & Salary */}
        <ReviewSection
          title="Organization & Salary"
          step={3}
          onEdit={onEdit}
          isValid={store.basicSalary && store.bankName && store.accountNumber && store.ifscCode}
          data={
            <div className="space-y-2">
              <DetailRow label="Company" value={data.organization.company} />
              <DetailRow label="Branch" value={data.organization.branch} />
              <DetailRow label="Designation" value={data.organization.designation} />
              <DetailRow label="Team" value={data.organization.team} />
              <DetailRow label="Role / Access Level" value={data.organization.roleAccessLevel} />
              <DetailRow label="Employee Category" value={data.organization.employeeCategory} />
              <DetailRow label="Cost Center" value={data.organization.costCenter} />
              <hr className="my-2 border-slate-200" />
              <DetailRow label="Salary Structure" value={data.organization.salaryStructure} />
              <DetailRow label="Basic Salary" value={`₹ ${data.organization.salary.basic}`} emphasis />
              <DetailRow label="HRA" value={`₹ ${data.organization.salary.hra}`} />
              <DetailRow label="Allowances" value={`₹ ${data.organization.salary.allowances}`} />
              <DetailRow label="Other Earnings" value={`₹ ${data.organization.salary.otherEarnings}`} />
              <hr className="my-2 border-slate-200" />
              <DetailRow label="Bank Name" value={data.organization.bankDetails.bankName} emphasis />
              <DetailRow label="Account Number" value={`••••••••${data.organization.bankDetails.accountNumber?.slice(-4)}`} />
              <DetailRow label="IFSC Code" value={data.organization.bankDetails.ifscCode} />
              <DetailRow label="UAN Number" value={data.organization.bankDetails.uanNumber} />
              <DetailRow label="ESIC Number" value={data.organization.bankDetails.esicNumber} />
            </div>
          }
        />

        {/* Section 4: Emergency Contacts */}
        <ReviewSection
          title="Emergency Contacts"
          step={4}
          onEdit={onEdit}
          isValid={store.emergencyContacts.some(c => c.name && c.relationship && c.primaryContact)}
          data={
            <div className="space-y-3">
              {data.emergency.contacts.map((contact, index) => (
                <div key={contact.id} className="p-3 bg-slate-50 rounded border border-slate-200">
                  <h4 className="text-xs font-semibold text-slate-800 mb-2">
                    Contact #{index + 1}
                  </h4>
                  <div className="space-y-1">
                    <DetailRow label="Name" value={contact.name} emphasis />
                    <DetailRow label="Relationship" value={contact.relationship} />
                    <DetailRow label="Primary Phone" value={contact.primaryContact} />
                    <DetailRow label="Alternate Phone" value={contact.alternateContact} />
                    <DetailRow label="Address" value={contact.address} />
                    <DetailRow label="Blood Group" value={contact.bloodGroup} />
                  </div>
                </div>
              ))}
            </div>
          }
        />

        {/* Section 5: Mobile Access */}
        <ReviewSection
          title="Mobile Access & Permissions"
          step={5}
          onEdit={onEdit}
          isValid={true}
          data={
            <div className="space-y-2">
              <DetailRow label="Mobile Access" value={store.enableMobileAccess ? 'Enabled' : 'Disabled'} emphasis />
              {store.enableMobileAccess && (
                <>
                  <DetailRow label="Login Email" value={store.loginEmail} />
                  <DetailRow label="Username" value={store.username || 'Auto-generated'} />
                  <DetailRow label="Application Role" value={store.applicationRole} />
                  <DetailRow label="Permissions" value={store.permissions.length > 0 ? `${store.permissions.length} permissions assigned` : 'None'} />
                  <DetailRow label="Attendance Access" value={store.enableAttendanceAccess ? 'Enabled' : 'Disabled'} />
                  <DetailRow label="Location Tracking" value={store.enableLocationTracking ? 'Enabled' : 'Disabled'} />
                  <DetailRow label="Push Notifications" value={store.enablePushNotifications ? 'Enabled' : 'Disabled'} />
                  <DetailRow label="Account Status" value={store.accountStatus} />
                </>
              )}
            </div>
          }
        />
      </div>

      {/* Validation Warnings */}
      {!hasAllRequiredFields() && (
        <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg">
          <h4 className="text-sm font-semibold text-red-700 mb-2">Missing Required Fields</h4>
          <p className="text-xs text-red-600">
            Please go back and fill in all required fields marked with * before submitting.
          </p>
        </div>
      )}

      {/* Confirmation Checkbox */}
      <div className="p-4 border-2 border-slate-200 rounded-lg bg-slate-50/50">
        <div className="flex items-start gap-3">
          <Checkbox
            id="confirm"
            checked={agreedToTerms}
            onCheckedChange={setAgreedToTerms}
            className="mt-0.5"
          />
          <div className="flex-1">
            <Label htmlFor="confirm" className="text-xs font-medium text-slate-800 cursor-pointer">
              I confirm that all the above information is accurate and correct
            </Label>
            <p className="text-xs text-slate-500 mt-1">
              By checking this box, you confirm that you have reviewed all the information and it is accurate. This employee will be created in the system once submitted.
            </p>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-700">
          <strong>Next Step:</strong> After submission, the employee record will be created and the employee will receive a welcome email with instructions to set up their mobile app access.
        </p>
      </div>

      {/* Validation Status */}
      {!agreedToTerms && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-xs text-amber-700">
            Please check the confirmation box above to proceed with employee registration.
          </p>
        </div>
      )}
    </div>
  );
}
