import { create } from 'zustand';

export const DRAFT_STORAGE_KEY = 'quikboom_employee_draft_v2';

const INITIAL_STATE = {
  // Mode
  mode: 'create', // 'create' | 'edit'
  editEmployeeId: null,
  editEmployeeRecordId: null,

  // Step 1: Personal Information
  firstName: '',
  middleName: '',
  lastName: '',
  corporateEmail: '',
  personalEmail: '',
  phone: '',
  alternatePhone: '',
  gender: '',
  dateOfBirth: '',
  bloodGroup: '',
  maritalStatus: '',
  profilePhoto: null,
  profilePhotoPreview: null,
  // Current Address
  residentialAddress: '',
  city: '',
  state: '',
  country: 'India',
  pinCode: '',
  // Permanent Address
  sameAsCurrentAddress: true,
  permanentAddress: '',
  permanentCity: '',
  permanentState: '',
  permanentCountry: 'India',
  permanentPinCode: '',

  // Step 2: Employment Information
  employeeCode: '', // read-only preview in create, actual code in edit
  employeeType: 'COMPANY', // 'COMPANY' | 'FREELANCER'
  employeeStatus: 'ACTIVE', // 'ACTIVE' | 'PROBATION' | 'NOTICE_PERIOD' | 'ON_LEAVE' | 'INACTIVE'
  employmentType: 'FULL_TIME', // 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN'
  dateOfJoining: '',
  probationPeriod: '3 Months',
  employmentConfirmationDate: '',
  workMode: 'Office', // 'Office' | 'Hybrid' | 'Remote'
  workLocation: 'Head Office',
  officeBranch: '', // Office ID
  shiftAssignment: '', // Shift ID
  weeklyOff: 'Sunday Only',
  attendancePolicy: 'Standard Geo-fence Policy',

  // Step 3: Organization & Salary
  company: 'QuikBoom',
  branch: 'Head Office',
  departmentId: '',
  departmentName: '',
  designation: '', // Designation ID
  designationName: '',
  reportingManagerId: '',
  reportingManagerName: '',
  team: '',
  roleAccessLevel: 'Staff',
  salaryStructure: 'Standard',
  monthlySalary: '',
  basicSalary: '',
  hra: '',
  allowances: '',
  otherEarnings: '',
  bankName: '',
  accountHolderName: '',
  accountNumber: '',
  ifscCode: '',

  // Step 4: Emergency Contacts
  emergencyContacts: [
    {
      id: 1,
      name: '',
      relationship: 'Parent',
      primaryContact: '',
      alternateContact: '',
      address: '',
    },
  ],

  // Step 5: Mobile Login & Access
  enableMobileAccess: true,
  password: '',
  enableAttendanceAccess: true,
  enableLocationTracking: true,
  enablePushNotifications: true,
  enableEmployeeSelfService: true,
  accountStatus: 'ACTIVE',

  // Wizard Navigation & Validation State
  currentStep: 1,
  completedSteps: [],
  stepErrors: {},
  touchedFields: {},
  stepAttempted: {},
  isSubmitting: false,
};

export const useEmployeeWizardStore = create((set, get) => ({
  ...INITIAL_STATE,

  setCurrentStep: (step) => set({ currentStep: step }),

  updateField: (field, value) => {
    set((state) => {
      const next = {
        [field]: value,
        touchedFields: { ...state.touchedFields, [field]: true },
      };

      // Auto mirror address if sameAsCurrentAddress is enabled
      if (state.sameAsCurrentAddress) {
        if (field === 'residentialAddress') next.permanentAddress = value;
        if (field === 'city') next.permanentCity = value;
        if (field === 'state') next.permanentState = value;
        if (field === 'country') next.permanentCountry = value;
        if (field === 'pinCode') next.permanentPinCode = value;
      }

      if (field === 'sameAsCurrentAddress' && value === true) {
        next.permanentAddress = state.residentialAddress;
        next.permanentCity = state.city;
        next.permanentState = state.state;
        next.permanentCountry = state.country;
        next.permanentPinCode = state.pinCode;
      }

      return next;
    });
  },

  updateFields: (fields) => {
    set((state) => ({
      ...fields,
      touchedFields: {
        ...state.touchedFields,
        ...Object.keys(fields).reduce((acc, k) => ({ ...acc, [k]: true }), {}),
      },
    }));
  },

  touchField: (field) => set((state) => ({
    touchedFields: { ...state.touchedFields, [field]: true },
  })),

  markStepAttempted: (step) => set((state) => ({
    stepAttempted: { ...state.stepAttempted, [step]: true },
  })),

  markStepCompleted: (step) => set((state) => ({
    completedSteps: Array.from(new Set([...state.completedSteps, step])),
  })),

  setStepErrors: (step, errors) => set((state) => ({
    stepErrors: {
      ...state.stepErrors,
      [step]: errors,
    },
  })),

  clearStepErrors: (step) => set((state) => ({
    stepErrors: {
      ...state.stepErrors,
      [step]: {},
    },
  })),

  // Emergency Contacts Management
  addEmergencyContact: () => set((state) => {
    const newId = Math.max(...state.emergencyContacts.map(c => c.id || 0), 0) + 1;
    return {
      emergencyContacts: [
        ...state.emergencyContacts,
        {
          id: newId,
          name: '',
          relationship: 'Relative',
          primaryContact: '',
          alternateContact: '',
          address: '',
        },
      ],
    };
  }),

  removeEmergencyContact: (id) => set((state) => {
    if (state.emergencyContacts.length <= 1) return state;
    return {
      emergencyContacts: state.emergencyContacts.filter((c) => c.id !== id),
    };
  }),

  updateEmergencyContact: (id, field, value) => set((state) => ({
    emergencyContacts: state.emergencyContacts.map((c) =>
      c.id === id ? { ...c, [field]: value } : c
    ),
  })),

  // Initialize for Edit Mode
  initializeForEdit: (employee) => {
    if (!employee) return;

    let parsedEmergency = [];
    if (employee.emergencyContact) {
      if (typeof employee.emergencyContact === 'string') {
        try {
          const parsed = JSON.parse(employee.emergencyContact);
          parsedEmergency = Array.isArray(parsed) ? parsed : [parsed];
        } catch {
          parsedEmergency = [
            {
              id: 1,
              name: employee.emergencyContact,
              relationship: 'Contact',
              primaryContact: employee.phone || '',
              alternateContact: '',
              address: '',
            },
          ];
        }
      } else if (Array.isArray(employee.emergencyContact)) {
        parsedEmergency = employee.emergencyContact;
      } else if (typeof employee.emergencyContact === 'object') {
        parsedEmergency = [employee.emergencyContact];
      }
    }

    if (parsedEmergency.length === 0) {
      parsedEmergency = [
        {
          id: 1,
          name: '',
          relationship: 'Parent',
          primaryContact: '',
          alternateContact: '',
          address: '',
        },
      ];
    }

    const bank = employee.bankDetails || {};
    const joiningDateStr = employee.joiningDate
      ? new Date(employee.joiningDate).toISOString().split('T')[0]
      : '';
    const dobStr = employee.dob
      ? new Date(employee.dob).toISOString().split('T')[0]
      : '';

    set({
      ...INITIAL_STATE,
      mode: 'edit',
      editEmployeeId: employee.id || employee.recordId,
      editEmployeeRecordId: employee.recordId || employee.id,
      employeeCode: employee.employeeCode || employee.id || '',
      firstName: employee.firstName || employee.name?.split(' ')[0] || '',
      lastName: employee.lastName || employee.name?.split(' ').slice(1).join(' ') || '',
      corporateEmail: employee.email || '',
      phone: employee.phone || '',
      gender: employee.gender || '',
      dateOfBirth: dobStr,
      residentialAddress: employee.address || '',
      city: employee.city || '',
      dateOfJoining: joiningDateStr,
      employeeType: employee.employeeType || 'COMPANY',
      employeeStatus: String(employee.status || 'ACTIVE').toUpperCase(),
      employmentType: employee.employmentType || 'FULL_TIME',
      workLocation: employee.branch || employee.office?.name || 'Head Office',
      officeBranch: employee.officeId ? String(employee.officeId) : '',
      shiftAssignment: employee.shiftId ? String(employee.shiftId) : '',
      departmentId: employee.departmentId ? String(employee.departmentId) : '',
      departmentName: employee.department || employee.departmentName || '',
      designation: employee.designationId ? String(employee.designationId) : '',
      designationName: employee.designation || employee.designationName || '',
      monthlySalary: employee.monthlySalary ?? employee.registeredSalary ?? '',
      basicSalary: employee.basicSalary ?? employee.monthlySalary ?? '',
      hra: employee.hra ?? '',
      allowances: employee.allowances ?? '',
      bankName: bank.bankName || '',
      accountHolderName: bank.accountHolderName || '',
      accountNumber: bank.accountNumber || '',
      ifscCode: bank.ifscCode || '',
      emergencyContacts: parsedEmergency.map((c, i) => ({
        id: c.id || i + 1,
        name: c.name || '',
        relationship: c.relationship || 'Relative',
        primaryContact: c.primaryContact || c.phone || '',
        alternateContact: c.alternateContact || '',
        address: c.address || '',
      })),
      enableMobileAccess: employee.mobileLoginEnabled !== false,
      password: '', // Kept blank to preserve current password
      currentStep: 1,
      completedSteps: [1, 2, 3, 4, 5],
      touchedFields: {},
      stepAttempted: {},
    });
  },

  // Initialize for Create Mode
  initializeForCreate: () => {
    set({
      ...INITIAL_STATE,
      mode: 'create',
      editEmployeeId: null,
      editEmployeeRecordId: null,
      currentStep: 1,
      completedSteps: [],
      touchedFields: {},
      stepAttempted: {},
    });
  },

  // Draft Management (LocalStorage)
  saveDraftToStorage: () => {
    const state = get();
    if (state.mode === 'edit') return false; // Do not save drafts for edit mode
    try {
      const draftData = {
        timestamp: Date.now(),
        data: {
          firstName: state.firstName,
          middleName: state.middleName,
          lastName: state.lastName,
          corporateEmail: state.corporateEmail,
          personalEmail: state.personalEmail,
          phone: state.phone,
          alternatePhone: state.alternatePhone,
          gender: state.gender,
          dateOfBirth: state.dateOfBirth,
          bloodGroup: state.bloodGroup,
          maritalStatus: state.maritalStatus,
          residentialAddress: state.residentialAddress,
          city: state.city,
          state: state.state,
          country: state.country,
          pinCode: state.pinCode,
          sameAsCurrentAddress: state.sameAsCurrentAddress,
          permanentAddress: state.permanentAddress,
          permanentCity: state.permanentCity,
          permanentState: state.permanentState,
          permanentCountry: state.permanentCountry,
          permanentPinCode: state.permanentPinCode,
          employeeType: state.employeeType,
          employeeStatus: state.employeeStatus,
          employmentType: state.employmentType,
          dateOfJoining: state.dateOfJoining,
          probationPeriod: state.probationPeriod,
          employmentConfirmationDate: state.employmentConfirmationDate,
          workMode: state.workMode,
          workLocation: state.workLocation,
          officeBranch: state.officeBranch,
          shiftAssignment: state.shiftAssignment,
          weeklyOff: state.weeklyOff,
          company: state.company,
          branch: state.branch,
          departmentId: state.departmentId,
          designation: state.designation,
          reportingManagerId: state.reportingManagerId,
          team: state.team,
          roleAccessLevel: state.roleAccessLevel,
          monthlySalary: state.monthlySalary,
          basicSalary: state.basicSalary,
          hra: state.hra,
          allowances: state.allowances,
          bankName: state.bankName,
          accountHolderName: state.accountHolderName,
          accountNumber: state.accountNumber,
          ifscCode: state.ifscCode,
          emergencyContacts: state.emergencyContacts,
          enableMobileAccess: state.enableMobileAccess,
          currentStep: state.currentStep,
          completedSteps: state.completedSteps,
        },
      };
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftData));
      return true;
    } catch (e) {
      console.warn('Failed to save employee draft:', e);
      return false;
    }
  },

  loadDraftFromStorage: () => {
    try {
      const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed && parsed.data) {
        set({
          ...parsed.data,
          mode: 'create',
          editEmployeeId: null,
          editEmployeeRecordId: null,
          profilePhoto: null,
          profilePhotoPreview: null,
          touchedFields: {},
          stepAttempted: {},
        });
        return parsed;
      }
    } catch (e) {
      console.warn('Failed to load employee draft:', e);
    }
    return null;
  },

  getSavedDraftMeta: () => {
    try {
      const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed?.timestamp) {
        return {
          timestamp: parsed.timestamp,
          dateFormatted: new Date(parsed.timestamp).toLocaleString(),
          name: [parsed.data?.firstName, parsed.data?.lastName].filter(Boolean).join(' ') || 'Unnamed Draft',
        };
      }
    } catch {
      return null;
    }
    return null;
  },

  clearDraft: () => {
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch {}
  },

  // Calculate overall form completion percentage
  calculateCompletionPercentage: () => {
    const state = get();
    const checks = [
      Boolean(state.firstName?.trim()),
      Boolean(state.lastName?.trim()),
      Boolean(state.corporateEmail?.trim()),
      Boolean(state.phone?.trim()),
      Boolean(state.dateOfJoining),
      Boolean(state.employmentType),
      Boolean(state.officeBranch),
      Boolean(state.shiftAssignment),
      Boolean(state.departmentId),
      Boolean(state.designation),
      Boolean(state.emergencyContacts?.[0]?.name?.trim() && state.emergencyContacts?.[0]?.primaryContact?.trim()),
      Boolean(state.enableMobileAccess !== undefined),
    ];
    const passed = checks.filter(Boolean).length;
    return Math.round((passed / checks.length) * 100);
  },

  // Export structured payload ready for API
  getAllData: () => {
    const state = get();
    return {
      mode: state.mode,
      employeeId: state.editEmployeeId,
      recordId: state.editEmployeeRecordId,
      personal: {
        firstName: state.firstName.trim(),
        middleName: state.middleName.trim(),
        lastName: state.lastName.trim(),
        corporateEmail: state.corporateEmail.trim().toLowerCase(),
        personalEmail: state.personalEmail.trim().toLowerCase(),
        phone: state.phone.trim(),
        alternatePhone: state.alternatePhone.trim(),
        gender: state.gender,
        dateOfBirth: state.dateOfBirth,
        bloodGroup: state.bloodGroup,
        maritalStatus: state.maritalStatus,
        profilePhoto: state.profilePhoto,
        profilePhotoPreview: state.profilePhotoPreview,
        address: {
          residential: state.residentialAddress.trim(),
          city: state.city.trim(),
          state: state.state.trim(),
          country: state.country.trim(),
          pinCode: state.pinCode.trim(),
        },
        permanentAddress: {
          sameAsCurrent: state.sameAsCurrentAddress,
          address: state.permanentAddress.trim(),
          city: state.permanentCity.trim(),
          state: state.permanentState.trim(),
          country: state.permanentCountry.trim(),
          pinCode: state.permanentPinCode.trim(),
        },
      },
      employment: {
        employeeCode: state.employeeCode,
        dateOfJoining: state.dateOfJoining,
        employeeType: state.employeeType,
        employeeStatus: state.employeeStatus,
        employmentType: state.employmentType,
        workLocation: state.workLocation,
        officeBranch: state.officeBranch,
        shiftAssignment: state.shiftAssignment,
        probationPeriod: state.probationPeriod,
        employmentConfirmationDate: state.employmentConfirmationDate,
        workMode: state.workMode,
        weeklyOff: state.weeklyOff,
        attendancePolicy: state.attendancePolicy,
      },
      organization: {
        company: state.company,
        branch: state.branch,
        departmentId: state.departmentId,
        departmentName: state.departmentName,
        designation: state.designation,
        designationName: state.designationName,
        reportingManagerId: state.reportingManagerId,
        reportingManagerName: state.reportingManagerName,
        team: state.team,
        roleAccessLevel: state.roleAccessLevel,
        salaryStructure: state.salaryStructure,
        salary: {
          basic: state.basicSalary || state.monthlySalary || '',
          monthly: state.monthlySalary || state.basicSalary || '',
          hra: state.hra || '',
          allowances: state.allowances || '',
          otherEarnings: state.otherEarnings || '',
        },
        bankDetails: {
          bankName: state.bankName.trim(),
          accountHolderName: state.accountHolderName.trim(),
          accountNumber: state.accountNumber.trim(),
          ifscCode: state.ifscCode.trim().toUpperCase(),
        },
      },
      emergency: {
        contacts: state.emergencyContacts,
      },
      mobileAccess: {
        enabled: state.enableMobileAccess,
        password: state.password,
        enableAttendanceAccess: state.enableAttendanceAccess,
        enableLocationTracking: state.enableLocationTracking,
        enablePushNotifications: state.enablePushNotifications,
        enableEmployeeSelfService: state.enableEmployeeSelfService,
        accountStatus: state.accountStatus,
      },
    };
  },

  reset: () => set(INITIAL_STATE),
}));
