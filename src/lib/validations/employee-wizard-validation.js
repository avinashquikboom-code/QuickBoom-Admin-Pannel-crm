export function validateEmail(email) {
  if (!email || typeof email !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function validatePhone(phone) {
  if (!phone || typeof phone !== 'string') return false;
  const cleaned = phone.replace(/[\s\-()]/g, '');
  return /^\+?\d{10,15}$/.test(cleaned);
}

export function validateDate(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  return !isNaN(d.getTime());
}

export function validateIFSC(ifsc) {
  if (!ifsc) return true; // Optional field
  return /^[A-Z]{4}0[A-Z0-9]{6}$/i.test(ifsc.trim());
}

export function validateStep(step, formData = {}, mode = 'create') {
  const errors = {};

  switch (step) {
    case 1: {
      if (!formData.firstName?.trim()) {
        errors.firstName = 'First name is required';
      } else if (formData.firstName.trim().length < 2) {
        errors.firstName = 'First name must be at least 2 characters';
      }

      if (!formData.lastName?.trim()) {
        errors.lastName = 'Last name is required';
      }

      if (!formData.corporateEmail?.trim()) {
        errors.corporateEmail = 'Corporate email is required';
      } else if (!validateEmail(formData.corporateEmail)) {
        errors.corporateEmail = 'Please enter a valid email address';
      }

      if (formData.personalEmail?.trim() && !validateEmail(formData.personalEmail)) {
        errors.personalEmail = 'Please enter a valid personal email address';
      }

      if (!formData.phone?.trim()) {
        errors.phone = 'Phone number is required';
      } else if (!validatePhone(formData.phone)) {
        errors.phone = 'Please enter a valid phone number (10–15 digits)';
      }

      if (formData.alternatePhone?.trim() && !validatePhone(formData.alternatePhone)) {
        errors.alternatePhone = 'Please enter a valid alternate phone number';
      }

      if (formData.dateOfBirth && !validateDate(formData.dateOfBirth)) {
        errors.dateOfBirth = 'Please enter a valid date of birth';
      }
      break;
    }

    case 2: {
      if (!formData.dateOfJoining) {
        errors.dateOfJoining = 'Date of joining is required';
      } else if (!validateDate(formData.dateOfJoining)) {
        errors.dateOfJoining = 'Please enter a valid joining date';
      }

      if (!formData.employmentType) {
        errors.employmentType = 'Employment type is required';
      }

      if (!formData.employeeType) {
        errors.employeeType = 'Employee classification is required';
      }

      if (!formData.officeBranch) {
        errors.officeBranch = 'Please assign a work branch / office';
      }

      if (!formData.shiftAssignment) {
        errors.shiftAssignment = 'Please assign an active work shift';
      }
      break;
    }

    case 3: {
      if (!formData.departmentId) {
        errors.departmentId = 'Department selection is required';
      }

      if (!formData.designation) {
        errors.designation = 'Designation selection is required';
      }

      if (formData.monthlySalary !== undefined && formData.monthlySalary !== '') {
        const num = Number(formData.monthlySalary);
        if (isNaN(num) || num < 0) {
          errors.monthlySalary = 'Monthly salary must be a positive number';
        }
      }

      if (formData.ifscCode?.trim() && !validateIFSC(formData.ifscCode)) {
        errors.ifscCode = 'IFSC must be 11 characters (e.g. HDFC0001234)';
      }
      break;
    }

    case 4: {
      const contacts = formData.emergencyContacts || [];
      if (!Array.isArray(contacts) || contacts.length === 0) {
        errors.emergencyContacts = 'At least one emergency contact is required';
      } else {
        const first = contacts[0] || {};
        if (!first.name?.trim()) {
          errors.contactName = 'Emergency contact person name is required';
        }
        if (!first.primaryContact?.trim()) {
          errors.contactPhone = 'Emergency contact phone is required';
        } else if (!validatePhone(first.primaryContact)) {
          errors.contactPhone = 'Valid emergency contact phone number required';
        }
      }
      break;
    }

    case 5: {
      if (formData.enableMobileAccess) {
        if (formData.password?.trim()) {
          if (formData.password.trim().length < 6) {
            errors.password = 'Password must be at least 6 characters';
          }
        }
      }
      break;
    }

    case 6: {
      // Complete review check: validate all required fields across all steps
      const s1 = validateStep(1, formData.personal || formData, mode);
      const s2 = validateStep(2, formData.employment || formData, mode);
      const s3 = validateStep(3, formData.organization || formData, mode);
      const s4 = validateStep(4, formData.emergency || formData, mode);
      const s5 = validateStep(5, formData.mobileAccess || formData, mode);

      const allErrors = {
        ...s1.errors,
        ...s2.errors,
        ...s3.errors,
        ...s4.errors,
        ...s5.errors,
      };

      return {
        isValid: Object.keys(allErrors).length === 0,
        errors: allErrors,
        stepErrors: {
          1: s1.errors,
          2: s2.errors,
          3: s3.errors,
          4: s4.errors,
          5: s5.errors,
        },
      };
    }

    default:
      break;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
