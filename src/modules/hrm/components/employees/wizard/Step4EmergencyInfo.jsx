'use client';
/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect } from 'react';
import { useEmployeeWizardStore } from '@/lib/stores/employee-wizard-store';
import { validateStep, validateEmergencyContact } from '@/lib/validations/employee-wizard-validation';
import { InputField, FormField } from './FormField';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/common/Select';
import { Button } from '@/components/common/Button';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import { faTrash, faPlus, faCheckCircle } from '@fortawesome/free-solid-svg-icons';

const RELATIONSHIPS = ['Spouse', 'Parent', 'Sibling', 'Child', 'Relative', 'Friend', 'Other'];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

export function Step4EmergencyInfo({ onValidationChange }) {
  const store = useEmployeeWizardStore();
  const [errors, setErrors] = useState({});
  const [contactErrors, setContactErrors] = useState({});

  useEffect(() => {
    const validation = validateStep(4, { emergencyContacts: store.emergencyContacts });
    setErrors(validation.errors);
    onValidationChange?.(validation.isValid);
  }, [store.emergencyContacts, onValidationChange]);

  const validateContact = (contact) => {
    return validateEmergencyContact(contact);
  };

  const handleContactChange = (id, field, value) => {
    store.updateEmergencyContact(id, field, value);
    const contact = store.emergencyContacts.find(c => c.id === id);
    if (contact) {
      const validation = validateContact({ ...contact, [field]: value });
      setContactErrors(prev => ({
        ...prev,
        [id]: validation.errors,
      }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-slate-900">Emergency Contact Information</h2>
        <p className="text-xs text-slate-500 mt-1">Add emergency contacts for this employee</p>
      </div>

      {/* Validation Error */}
      {errors.emergencyContacts && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-xs text-red-700 font-medium">{errors.emergencyContacts}</p>
        </div>
      )}

      {/* Emergency Contacts List */}
      <div className="space-y-4">
        {store.emergencyContacts.map((contact, index) => {
          const contactError = contactErrors[contact.id];
          const isValid = validateContact(contact).isValid;

          return (
            <div key={contact.id} className="p-4 border-2 border-slate-200 rounded-lg space-y-4 relative">
              {/* Card Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-800">
                    Emergency Contact #{index + 1}
                  </span>
                  {isValid && (
                    <FontAwesomeIcon icon={faCheckCircle} className="size-4 text-brand" />
                  )}
                </div>
                {store.emergencyContacts.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => store.removeEmergencyContact(contact.id)}
                    className="h-7 px-2 text-xs text-rose-600 hover:bg-rose-50"
                  >
                    <FontAwesomeIcon icon={faTrash} className="size-3 mr-1" />
                    Remove
                  </Button>
                )}
              </div>

              {/* Contact Fields */}
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <InputField
                    label="Contact Name"
                    required
                    placeholder="Full name"
                    value={contact.name}
                    onChange={(e) => handleContactChange(contact.id, 'name', e.target.value)}
                    error={contactError?.name}
                  />

                  <FormField label="Relationship" required error={contactError?.relationship}>
                    <Select
                      value={contact.relationship}
                      onValueChange={(value) => handleContactChange(contact.id, 'relationship', value)}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Select relationship" />
                      </SelectTrigger>
                      <SelectContent>
                        {RELATIONSHIPS.map((rel) => (
                          <SelectItem key={rel} value={rel} className="text-xs">
                            {rel}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <InputField
                    label="Primary Contact Number"
                    required
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={contact.primaryContact}
                    onChange={(e) => handleContactChange(contact.id, 'primaryContact', e.target.value)}
                    error={contactError?.primaryContact}
                  />

                  <InputField
                    label="Alternate Contact Number"
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={contact.alternateContact}
                    onChange={(e) => handleContactChange(contact.id, 'alternateContact', e.target.value)}
                  />
                </div>

                <InputField
                  label="Address"
                  placeholder="Residential address"
                  value={contact.address}
                  onChange={(e) => handleContactChange(contact.id, 'address', e.target.value)}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField label="Blood Group">
                    <Select
                      value={contact.bloodGroup}
                      onValueChange={(value) => handleContactChange(contact.id, 'bloodGroup', value)}
                    >
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

                  <div className="flex-1" />
                </div>

                <div>
                  <FormField label="Medical Notes / Special Instructions">
                    <textarea
                      placeholder="Any medical conditions or special notes"
                      value={contact.medicalNotes}
                      onChange={(e) => handleContactChange(contact.id, 'medicalNotes', e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                      rows="3"
                    />
                  </FormField>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add More Button */}
      <Button
        type="button"
        onClick={() => store.addEmergencyContact()}
        variant="outline"
        className="w-full h-9 text-xs border-brand text-brand hover:bg-brand-light"
      >
        <FontAwesomeIcon icon={faPlus} className="size-3 mr-2" />
        Add Another Emergency Contact
      </Button>

      {/* Info Box */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-700">
          <strong>Note:</strong> At least one emergency contact with name, relationship, and phone number is required.
        </p>
      </div>
    </div>
  );
}
