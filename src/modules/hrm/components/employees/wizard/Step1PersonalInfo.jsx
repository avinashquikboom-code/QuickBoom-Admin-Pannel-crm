'use client';

import * as React from 'react';
import { useEmployeeWizardStore } from '@/lib/stores/employee-wizard-store';
import { validateStep } from '@/lib/validations/employee-wizard-validation';
import { FormField, InputField, SectionHeader } from './FormField';
import { Camera, Upload, Trash2, Mail, Phone, MapPin, User, Home, ShieldCheck } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const GENDERS = ['Male', 'Female', 'Other', 'Prefer not to say'];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const MARITAL_STATUSES = ['Single', 'Married', 'Divorced', 'Widowed'];

export function Step1PersonalInfo({ onValidationChange }) {
  const store = useEmployeeWizardStore();
  const fileInputRef = React.useRef(null);
  const [dragOver, setDragOver] = React.useState(false);

  // Compute validation
  const validation = React.useMemo(() => {
    return validateStep(
      1,
      {
        firstName: store.firstName,
        lastName: store.lastName,
        corporateEmail: store.corporateEmail,
        personalEmail: store.personalEmail,
        phone: store.phone,
        alternatePhone: store.alternatePhone,
        dateOfBirth: store.dateOfBirth,
      },
      store.mode
    );
  }, [
    store.firstName,
    store.lastName,
    store.corporateEmail,
    store.personalEmail,
    store.phone,
    store.alternatePhone,
    store.dateOfBirth,
    store.mode,
  ]);

  // Sync validation state with parent
  React.useEffect(() => {
    useEmployeeWizardStore.getState().setStepErrors(1, validation.errors);
    onValidationChange?.(validation.isValid);
  }, [validation.isValid, validation.errors, onValidationChange]);

  // Helper to determine if an error should be visible
  const isErrorVisible = (fieldName) => {
    const hasError = Boolean(validation.errors[fieldName]);
    const isTouched = Boolean(store.touchedFields[fieldName]);
    const isAttempted = Boolean(store.stepAttempted[1]);
    return hasError && (isTouched || isAttempted);
  };

  // Profile Photo File Validation & Processing
  const handleFileProcess = (file) => {
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload a JPEG or PNG image.');
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error('File size exceeds 5MB limit. Please choose a smaller image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      store.updateFields({
        profilePhoto: file,
        profilePhotoPreview: e.target.result,
      });
      toast.success('Profile photo uploaded');
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleRemovePhoto = () => {
    store.updateFields({
      profilePhoto: null,
      profilePhotoPreview: null,
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
    toast.info('Profile photo removed');
  };

  const initials = [store.firstName?.[0], store.lastName?.[0]].filter(Boolean).join('').toUpperCase() || 'EMP';

  return (
    <div className="space-y-6">
      {/* ── SECTION 1: PROFILE PHOTO ───────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
        <SectionHeader
          title="Profile Photo"
          description="Upload an official employee avatar for HRMS identification and mobile profile."
          icon={Camera}
          badge="Max 5MB"
        />

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          {/* Circular Photo Preview */}
          <div className="relative group shrink-0">
            <div
              className={cn(
                'size-24 rounded-full border-2 overflow-hidden shadow-sm flex items-center justify-center transition-all bg-slate-50',
                store.profilePhotoPreview
                  ? 'border-emerald-500 ring-4 ring-emerald-50'
                  : 'border-slate-200 text-slate-400'
              )}
            >
              {store.profilePhotoPreview ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={store.profilePhotoPreview}
                  alt="Profile Preview"
                  className="size-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center">
                  <span className="text-xl font-black text-slate-400">{initials}</span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Change Photo"
              className="absolute -bottom-1 -right-1 flex size-7 items-center justify-center rounded-full bg-[#16A34A] text-white shadow-md hover:bg-[#15803D] transition-colors"
            >
              <Camera className="size-3.5" />
            </button>
          </div>

          {/* Drag & Drop Upload Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={cn(
              'flex-1 w-full rounded-xl border-2 border-dashed p-4 text-center transition-colors flex flex-col items-center justify-center gap-2 cursor-pointer',
              dragOver
                ? 'border-[#16A34A] bg-emerald-50/50'
                : 'border-slate-200 hover:border-slate-300 bg-slate-50/40'
            )}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/jpg,image/webp"
              onChange={(e) => {
                if (e.target.files?.[0]) handleFileProcess(e.target.files[0]);
              }}
              className="hidden"
            />
            <div className="flex size-9 items-center justify-center rounded-full bg-emerald-50 text-[#16A34A]">
              <Upload className="size-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-800">
                <span className="text-[#16A34A] hover:underline">Click to browse</span> or drag and drop image
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Supported formats: PNG, JPG, or WEBP up to 5MB
              </p>
            </div>

            {store.profilePhotoPreview && (
              <div className="flex items-center gap-2 mt-1" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 shadow-xs"
                >
                  Replace Photo
                </button>
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-100 shadow-xs"
                >
                  <Trash2 className="size-3 inline mr-1" />
                  Remove
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── SECTION 2: PERSONAL DETAILS ────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
        <SectionHeader
          title="Personal Details"
          description="Enter legal identity information according to government identification."
          icon={User}
        />

        {/* 3-Column First Name, Middle Name, Last Name */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-4">
          <InputField
            label="First Name"
            required
            placeholder="e.g. Rahul"
            value={store.firstName}
            onChange={(e) => store.updateField('firstName', e.target.value)}
            onBlur={() => store.touchField('firstName')}
            error={validation.errors.firstName}
            touched={isErrorVisible('firstName')}
          />
          <InputField
            label="Middle Name"
            optional
            placeholder="e.g. Kumar"
            value={store.middleName}
            onChange={(e) => store.updateField('middleName', e.target.value)}
          />
          <InputField
            label="Last Name"
            required
            placeholder="e.g. Sharma"
            value={store.lastName}
            onChange={(e) => store.updateField('lastName', e.target.value)}
            onBlur={() => store.touchField('lastName')}
            error={validation.errors.lastName}
            touched={isErrorVisible('lastName')}
          />
        </div>

        {/* DOB, Gender, Marital Status, Blood Group */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <InputField
            label="Date of Birth"
            optional
            type="date"
            value={store.dateOfBirth}
            onChange={(e) => store.updateField('dateOfBirth', e.target.value)}
            onBlur={() => store.touchField('dateOfBirth')}
            error={validation.errors.dateOfBirth}
            touched={isErrorVisible('dateOfBirth')}
          />

          <FormField label="Gender" optional>
            <select
              value={store.gender}
              onChange={(e) => store.updateField('gender', e.target.value)}
              className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs sm:text-[13px] font-medium text-slate-800 focus:border-[#16A34A] focus:outline-none focus:ring-1 focus:ring-[#16A34A]"
            >
              <option value="">Select Gender</option>
              {GENDERS.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Marital Status" optional>
            <select
              value={store.maritalStatus}
              onChange={(e) => store.updateField('maritalStatus', e.target.value)}
              className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs sm:text-[13px] font-medium text-slate-800 focus:border-[#16A34A] focus:outline-none focus:ring-1 focus:ring-[#16A34A]"
            >
              <option value="">Select Status</option>
              {MARITAL_STATUSES.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Blood Group" optional>
            <select
              value={store.bloodGroup}
              onChange={(e) => store.updateField('bloodGroup', e.target.value)}
              className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs sm:text-[13px] font-medium text-slate-800 focus:border-[#16A34A] focus:outline-none focus:ring-1 focus:ring-[#16A34A]"
            >
              <option value="">Select Blood Group</option>
              {BLOOD_GROUPS.map((bg) => (
                <option key={bg} value={bg}>{bg}</option>
              ))}
            </select>
          </FormField>
        </div>
      </div>

      {/* ── SECTION 3: CONTACT & ADDRESS DETAILS ───────────────────── */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
        <SectionHeader
          title="Contact & Residential Addresses"
          description="Communication emails, phone numbers, and physical residence details."
          icon={Phone}
        />

        {/* Corporate & Personal Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-4">
          <InputField
            label="Corporate / Work Email"
            required
            type="email"
            icon={Mail}
            placeholder="e.g. rahul.sharma@quikboom.com"
            value={store.corporateEmail}
            onChange={(e) => store.updateField('corporateEmail', e.target.value)}
            onBlur={() => store.touchField('corporateEmail')}
            error={validation.errors.corporateEmail}
            touched={isErrorVisible('corporateEmail')}
            hint="Used as primary mobile app login ID"
          />
          <InputField
            label="Personal Email"
            optional
            type="email"
            icon={Mail}
            placeholder="e.g. rahul.personal@gmail.com"
            value={store.personalEmail}
            onChange={(e) => store.updateField('personalEmail', e.target.value)}
            onBlur={() => store.touchField('personalEmail')}
            error={validation.errors.personalEmail}
            touched={isErrorVisible('personalEmail')}
          />
        </div>

        {/* Primary Phone & Alternate Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-5">
          <InputField
            label="Primary Mobile Phone"
            required
            type="tel"
            icon={Phone}
            placeholder="e.g. +91 98765 43210"
            value={store.phone}
            onChange={(e) => store.updateField('phone', e.target.value)}
            onBlur={() => store.touchField('phone')}
            error={validation.errors.phone}
            touched={isErrorVisible('phone')}
          />
          <InputField
            label="Alternate Phone / Landline"
            optional
            type="tel"
            icon={Phone}
            placeholder="e.g. +91 98765 00000"
            value={store.alternatePhone}
            onChange={(e) => store.updateField('alternatePhone', e.target.value)}
            onBlur={() => store.touchField('alternatePhone')}
            error={validation.errors.alternatePhone}
            touched={isErrorVisible('alternatePhone')}
          />
        </div>

        {/* Current Residential Address */}
        <div className="border-t border-slate-100 pt-4">
          <div className="flex items-center gap-2 mb-3">
            <Home className="size-4 text-[#16A34A]" />
            <h5 className="text-xs font-bold text-slate-800">Current Residential Address</h5>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mb-4">
            <div className="sm:col-span-12">
              <InputField
                label="Street Address / House No. / Flat"
                optional
                placeholder="e.g. Flat 402, Green Acres Apt, Andheri East"
                value={store.residentialAddress}
                onChange={(e) => store.updateField('residentialAddress', e.target.value)}
              />
            </div>
            <div className="sm:col-span-4">
              <InputField
                label="City"
                optional
                placeholder="e.g. Mumbai"
                value={store.city}
                onChange={(e) => store.updateField('city', e.target.value)}
              />
            </div>
            <div className="sm:col-span-3">
              <InputField
                label="State / Province"
                optional
                placeholder="e.g. Maharashtra"
                value={store.state}
                onChange={(e) => store.updateField('state', e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <InputField
                label="PIN Code"
                optional
                placeholder="e.g. 400069"
                value={store.pinCode}
                onChange={(e) => store.updateField('pinCode', e.target.value)}
              />
            </div>
            <div className="sm:col-span-3">
              <InputField
                label="Country"
                optional
                placeholder="e.g. India"
                value={store.country}
                onChange={(e) => store.updateField('country', e.target.value)}
              />
            </div>
          </div>

          {/* Same as current address checkbox */}
          <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <input
              type="checkbox"
              id="sameAddress"
              checked={store.sameAsCurrentAddress}
              onChange={(e) => store.updateField('sameAsCurrentAddress', e.target.checked)}
              className="size-4 rounded text-[#16A34A] focus:ring-[#16A34A] border-slate-300"
            />
            <label htmlFor="sameAddress" className="text-xs font-semibold text-slate-700 cursor-pointer select-none">
              Permanent address is same as current residential address
            </label>
          </div>

          {/* Permanent Address (Conditional) */}
          {!store.sameAsCurrentAddress && (
            <div className="mt-4 p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3 animate-fadeIn">
              <div className="flex items-center gap-2">
                <MapPin className="size-4 text-slate-500" />
                <h6 className="text-xs font-bold text-slate-700">Permanent Address</h6>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-12">
                  <InputField
                    label="Permanent Street Address"
                    optional
                    placeholder="e.g. Permanent family house address"
                    value={store.permanentAddress}
                    onChange={(e) => store.updateField('permanentAddress', e.target.value)}
                  />
                </div>
                <div className="sm:col-span-4">
                  <InputField
                    label="Permanent City"
                    optional
                    placeholder="e.g. Pune"
                    value={store.permanentCity}
                    onChange={(e) => store.updateField('permanentCity', e.target.value)}
                  />
                </div>
                <div className="sm:col-span-3">
                  <InputField
                    label="Permanent State"
                    optional
                    placeholder="e.g. Maharashtra"
                    value={store.permanentState}
                    onChange={(e) => store.updateField('permanentState', e.target.value)}
                  />
                </div>
                <div className="sm:col-span-2">
                  <InputField
                    label="PIN Code"
                    optional
                    placeholder="e.g. 411001"
                    value={store.permanentPinCode}
                    onChange={(e) => store.updateField('permanentPinCode', e.target.value)}
                  />
                </div>
                <div className="sm:col-span-3">
                  <InputField
                    label="Country"
                    optional
                    placeholder="e.g. India"
                    value={store.permanentCountry}
                    onChange={(e) => store.updateField('permanentCountry', e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
