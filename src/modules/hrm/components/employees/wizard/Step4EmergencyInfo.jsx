'use client';

import * as React from 'react';
import { useEmployeeWizardStore } from '@/lib/stores/employee-wizard-store';
import { validateStep } from '@/lib/validations/employee-wizard-validation';
import { FormField, InputField, SectionHeader } from './FormField';
import { PhoneCall, Plus, Trash2, ShieldAlert, HeartHandshake } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const RELATIONSHIPS = [
  'Parent',
  'Spouse',
  'Sibling',
  'Child',
  'Relative',
  'Friend',
  'Guardian',
  'Other',
];

export function Step4EmergencyInfo({ onValidationChange }) {
  const store = useEmployeeWizardStore();

  // Compute validation
  const validation = React.useMemo(() => {
    return validateStep(4, { emergencyContacts: store.emergencyContacts }, store.mode);
  }, [store.emergencyContacts, store.mode]);

  // Sync validation state with parent
  React.useEffect(() => {
    useEmployeeWizardStore.getState().setStepErrors(4, validation.errors);
    onValidationChange?.(validation.isValid);
  }, [validation.isValid, validation.errors, onValidationChange]);

  const isErrorVisible = (errorKey) => {
    const hasError = Boolean(validation.errors[errorKey]);
    const isTouched = Boolean(store.touchedFields[errorKey]);
    const isAttempted = Boolean(store.stepAttempted[4]);
    return hasError && (isTouched || isAttempted);
  };

  const handleAddContact = () => {
    if (store.emergencyContacts.length >= 3) {
      toast.info('Maximum 3 emergency contacts can be added.');
      return;
    }
    store.addEmergencyContact();
  };

  const handleRemoveContact = (id) => {
    if (store.emergencyContacts.length <= 1) {
      toast.info('At least one emergency contact is required.');
      return;
    }
    store.removeEmergencyContact(id);
  };

  return (
    <div className="space-y-6">
      {/* ── SECTION: EMERGENCY CONTACTS ────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
        <SectionHeader
          title="Emergency Contact Directory"
          description="Designate primary family or emergency contacts reached in case of urgent workplace or medical incidents."
          icon={PhoneCall}
        />

        {validation.errors.emergencyContacts && store.stepAttempted[4] && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 mb-4 animate-fadeIn">
            <ShieldAlert className="size-4 shrink-0 text-rose-500" />
            <span>{validation.errors.emergencyContacts}</span>
          </div>
        )}

        <div className="space-y-4">
          {store.emergencyContacts.map((contact, index) => {
            const isPrimary = index === 0;

            return (
              <div
                key={contact.id}
                className="rounded-xl border border-slate-200/80 bg-slate-50/40 p-4 transition-all hover:border-slate-300"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3.5">
                  <div className="flex items-center gap-2">
                    <span className="flex size-6 items-center justify-center rounded-full bg-emerald-100 text-[11px] font-bold text-[#16A34A]">
                      {index + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-800">
                      {isPrimary ? 'Primary Emergency Contact' : `Secondary Contact #${index + 1}`}
                    </span>
                    {isPrimary && (
                      <span className="rounded-md bg-emerald-100/70 px-1.5 py-0.2 text-[9px] font-bold text-[#16A34A]">
                        Required
                      </span>
                    )}
                  </div>

                  {!isPrimary && (
                    <button
                      type="button"
                      onClick={() => handleRemoveContact(contact.id)}
                      className="flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-semibold transition-colors"
                    >
                      <Trash2 className="size-3.5" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-3.5">
                  <InputField
                    label="Contact Person Name"
                    required={isPrimary}
                    placeholder="e.g. Ramesh Sharma"
                    value={contact.name}
                    onChange={(e) => {
                      store.updateEmergencyContact(contact.id, 'name', e.target.value);
                      if (isPrimary) store.touchField('contactName');
                    }}
                    onBlur={() => {
                      if (isPrimary) store.touchField('contactName');
                    }}
                    error={isPrimary ? validation.errors.contactName : undefined}
                    touched={isPrimary ? isErrorVisible('contactName') : false}
                  />

                  <FormField label="Relationship" required={isPrimary}>
                    <select
                      value={contact.relationship || 'Parent'}
                      onChange={(e) =>
                        store.updateEmergencyContact(contact.id, 'relationship', e.target.value)
                      }
                      className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs sm:text-[13px] font-medium text-slate-800 focus:border-[#16A34A] focus:outline-none focus:ring-1 focus:ring-[#16A34A]"
                    >
                      {RELATIONSHIPS.map((rel) => (
                        <option key={rel} value={rel}>{rel}</option>
                      ))}
                    </select>
                  </FormField>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-3.5">
                  <InputField
                    label="Primary Phone Number"
                    required={isPrimary}
                    type="tel"
                    placeholder="e.g. +91 98765 11111"
                    value={contact.primaryContact}
                    onChange={(e) => {
                      store.updateEmergencyContact(contact.id, 'primaryContact', e.target.value);
                      if (isPrimary) store.touchField('contactPhone');
                    }}
                    onBlur={() => {
                      if (isPrimary) store.touchField('contactPhone');
                    }}
                    error={isPrimary ? validation.errors.contactPhone : undefined}
                    touched={isPrimary ? isErrorVisible('contactPhone') : false}
                  />

                  <InputField
                    label="Alternate Phone Number"
                    optional
                    type="tel"
                    placeholder="e.g. +91 98765 22222"
                    value={contact.alternateContact}
                    onChange={(e) =>
                      store.updateEmergencyContact(contact.id, 'alternateContact', e.target.value)
                    }
                  />
                </div>

                <InputField
                  label="Contact Address / City"
                  optional
                  placeholder="e.g. 123 Family Villa, Pune, Maharashtra"
                  value={contact.address}
                  onChange={(e) =>
                    store.updateEmergencyContact(contact.id, 'address', e.target.value)
                  }
                />
              </div>
            );
          })}
        </div>

        {/* Add Another Contact Button */}
        {store.emergencyContacts.length < 3 && (
          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              onClick={handleAddContact}
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-white px-3.5 py-2 text-xs font-semibold text-[#16A34A] shadow-2xs hover:bg-emerald-50 transition-colors"
            >
              <Plus className="size-3.5" />
              <span>Add Another Emergency Contact</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
