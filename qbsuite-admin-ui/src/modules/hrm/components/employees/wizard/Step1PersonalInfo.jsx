'use client';
/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect } from 'react';
import { useEmployeeWizardStore } from '@/lib/stores/employee-wizard-store';
import { validateStep } from '@/lib/validations/employee-wizard-validation';
import { InputField, FormField } from './FormField';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/common/Select';
import { Label } from '@/components/common/Label';
import { FileUpload } from '@/components/common/FileUpload';
import { cn } from '@/lib/utils';

const GENDERS = ['Male', 'Female', 'Other', 'Prefer not to say'];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const MARITAL_STATUSES = ['Single', 'Married', 'Divorced', 'Widowed'];
const COUNTRIES = ['United States', 'India', 'United Kingdom', 'Canada', 'Australia', 'Other'];

export function Step1PersonalInfo({ onNext, onValidationChange }) {
  const store = useEmployeeWizardStore();
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const validation = validateStep(1, {
      firstName: store.firstName,
      lastName: store.lastName,
      corporateEmail: store.corporateEmail,
      phone: store.phone,
      dateOfBirth: store.dateOfBirth,
      ...store.getAllData().personal,
    });
    setErrors(validation.errors);
    onValidationChange?.(validation.isValid);
  }, [
    store.firstName,
    store.lastName,
    store.corporateEmail,
    store.phone,
    store.dateOfBirth,
    store.alternatePhone,
    store.gender,
    store.residentialAddress,
    store.city,
    store.state,
    store.country,
    store.pinCode,
    onValidationChange,
  ]);

  const handlePhotoUpload = (files) => {
    if (files.length > 0) {
      const file = files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        store.updateFields({
          profilePhoto: file,
          profilePhotoPreview: reader.result,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-slate-900">Personal Information & Contact Details</h2>
        <p className="text-xs text-slate-500 mt-1">Enter your personal and contact information</p>
      </div>

      {/* Profile Photo */}
      <div>
        <h3 className="text-sm font-semibold text-slate-800 mb-3">Profile Photo</h3>
        <div className="flex items-end gap-4">
          {store.profilePhotoPreview && (
            <div className="w-20 h-20 rounded-lg border-2 border-slate-200 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={store.profilePhotoPreview} alt="Preview" className="w-full h-full object-cover" />
            </div>
          )}
          <FileUpload
            label="Upload Profile Photo"
            accept="image/*"
            onFilesChange={handlePhotoUpload}
            description="JPEG, PNG (Max 5MB)"
            className="text-xs"
          />
        </div>
      </div>

      {/* Personal Information */}
      <div>
        <h3 className="text-sm font-semibold text-slate-800 mb-3">Name & Contact</h3>
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <InputField
              label="First Name"
              required
              placeholder="e.g. John"
              value={store.firstName}
              onChange={(e) => store.updateField('firstName', e.target.value)}
              error={errors.firstName}
            />
            <InputField
              label="Middle Name"
              placeholder="e.g. Michael"
              value={store.middleName}
              onChange={(e) => store.updateField('middleName', e.target.value)}
            />
          </div>

          <InputField
            label="Last Name"
            required
            placeholder="e.g. Doe"
            value={store.lastName}
            onChange={(e) => store.updateField('lastName', e.target.value)}
            error={errors.lastName}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <InputField
              label="Corporate Email"
              required
              type="email"
              placeholder="john.doe@company.com"
              value={store.corporateEmail}
              onChange={(e) => store.updateField('corporateEmail', e.target.value)}
              error={errors.corporateEmail}
            />
            <InputField
              label="Personal Email"
              type="email"
              placeholder="john@example.com"
              value={store.personalEmail}
              onChange={(e) => store.updateField('personalEmail', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <InputField
              label="Phone Number"
              required
              type="tel"
              placeholder="+1 (555) 000-0000"
              value={store.phone}
              onChange={(e) => store.updateField('phone', e.target.value)}
              error={errors.phone}
            />
            <InputField
              label="Alternate Phone"
              type="tel"
              placeholder="+1 (555) 000-0000"
              value={store.alternatePhone}
              onChange={(e) => store.updateField('alternatePhone', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Personal Details */}
      <div>
        <h3 className="text-sm font-semibold text-slate-800 mb-3">Personal Details</h3>
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <FormField label="Gender">
              <Select value={store.gender} onValueChange={(value) => store.updateField('gender', value)}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  {GENDERS.map((g) => (
                    <SelectItem key={g} value={g} className="text-xs">
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <InputField
              label="Date of Birth"
              required
              type="date"
              value={store.dateOfBirth}
              onChange={(e) => store.updateField('dateOfBirth', e.target.value)}
              error={errors.dateOfBirth}
            />

            <FormField label="Blood Group">
              <Select value={store.bloodGroup} onValueChange={(value) => store.updateField('bloodGroup', value)}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Select blood group" />
                </SelectTrigger>
                <SelectContent>
                  {BLOOD_GROUPS.map((bg) => (
                    <SelectItem key={bg} value={bg} className="text-xs">
                      {bg}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>

          <FormField label="Marital Status">
            <Select value={store.maritalStatus} onValueChange={(value) => store.updateField('maritalStatus', value)}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Select marital status" />
              </SelectTrigger>
              <SelectContent>
                {MARITAL_STATUSES.map((ms) => (
                  <SelectItem key={ms} value={ms} className="text-xs">
                    {ms}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        </div>
      </div>

      {/* Address */}
      <div>
        <h3 className="text-sm font-semibold text-slate-800 mb-3">Residential Address</h3>
        <div className="space-y-3">
          <InputField
            label="Street Address"
            placeholder="123 Main Street"
            value={store.residentialAddress}
            onChange={(e) => store.updateField('residentialAddress', e.target.value)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <InputField
              label="City"
              placeholder="San Francisco"
              value={store.city}
              onChange={(e) => store.updateField('city', e.target.value)}
            />
            <InputField
              label="State/Province"
              placeholder="California"
              value={store.state}
              onChange={(e) => store.updateField('state', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Country">
              <Select value={store.country} onValueChange={(value) => store.updateField('country', value)}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c} value={c} className="text-xs">
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <InputField
              label="PIN/Postal Code"
              placeholder="94105"
              value={store.pinCode}
              onChange={(e) => store.updateField('pinCode', e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
