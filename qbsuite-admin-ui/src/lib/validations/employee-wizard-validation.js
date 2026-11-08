const STEP_VALIDATIONS = {
  1: {
    firstName: {
      required: true,
      message: 'First name is required',
    },
    lastName: {
      required: true,
      message: 'Last name is required',
    },
    corporateEmail: {
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: 'Valid corporate email is required',
    },
    phone: {
      required: true,
      pattern: /^\+?[\d\s\-()]+$/,
      message: 'Valid phone number is required',
    },
    dateOfBirth: {
      required: true,
      pattern: /^\d{4}-\d{2}-\d{2}$/,
      message: 'Valid date of birth is required',
    },
  },
  2: {
    dateOfJoining: {
      required: true,
      message: 'Date of joining is required',
    },
    employmentType: {
      required: true,
      message: 'Employment type is required',
    },
    jobTitle: {
      required: true,
      message: 'Job title is required',
    },
    department: {
      required: true,
      message: 'Department is required',
    },
  },
  3: {
    basicSalary: {
      required: true,
      pattern: /^\d+\.?\d*$/,
      message: 'Valid basic salary is required',
    },
    bankName: {
      required: true,
      message: 'Bank name is required',
    },
    accountNumber: {
      required: true,
      message: 'Account number is required',
    },
    ifscCode: {
      required: true,
      pattern: /^[A-Z]{4}0[A-Z0-9]{6}$/,
      message: 'Valid IFSC code is required',
    },
  },
  4: {
    // Step 4 validations - at least one emergency contact
    emergencyContacts: {
      required: true,
      custom: (contacts) => {
        if (!Array.isArray(contacts) || contacts.length === 0) {
          return { valid: false, message: 'At least one emergency contact is required' };
        }
        const hasValidContact = contacts.some(c =>
          c.name && c.relationship && c.primaryContact
        );
        return {
          valid: hasValidContact,
          message: hasValidContact ? '' : 'Emergency contact must have name, relationship, and phone number',
        };
      },
    },
  },
  5: {
    // Step 5 - conditional validations based on enableMobileAccess
  },
};

export function validateStep(step, formData) {
  const errors = {};
  const stepValidations = STEP_VALIDATIONS[step] || {};

  Object.entries(stepValidations).forEach(([field, rules]) => {
    const value = formData[field];

    if (rules.required && (!value || (Array.isArray(value) && value.length === 0) || (typeof value === 'string' && !value.trim()))) {
      errors[field] = rules.message;
      return;
    }

    if (rules.pattern && value && !rules.pattern.test(String(value))) {
      errors[field] = rules.message;
      return;
    }

    if (rules.custom && value) {
      const result = rules.custom(value);
      if (!result.valid) {
        errors[field] = result.message;
      }
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateEmergencyContact(contact) {
  const errors = {};

  if (!contact.name?.trim()) {
    errors.name = 'Name is required';
  }

  if (!contact.relationship?.trim()) {
    errors.relationship = 'Relationship is required';
  }

  if (!contact.primaryContact?.trim()) {
    errors.primaryContact = 'Primary contact number is required';
  } else if (!/^\+?[\d\s\-()]+$/.test(contact.primaryContact)) {
    errors.primaryContact = 'Valid phone number is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePhone(phone) {
  return /^\+?[\d\s\-()]+$/.test(phone);
}

export function validateDate(date) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && !isNaN(new Date(date).getTime());
}

export function validateIFSC(ifsc) {
  return /^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc);
}

export function isValidDateOfBirth(dateString) {
  const date = new Date(dateString);
  const today = new Date();
  const age = today.getFullYear() - date.getFullYear();
  return age >= 18 && age <= 70;
}
