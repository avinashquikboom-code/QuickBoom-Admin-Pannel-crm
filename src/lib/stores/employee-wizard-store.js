import { create } from 'zustand';

const INITIAL_STATE = {
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
  // Address
  residentialAddress: '',
  city: '',
  state: '',
  country: '',
  pinCode: '',

  // Step 2: Employment Information
  dateOfJoining: '',
  employmentType: 'Full-Time',
  employeeStatus: 'Active',
  jobTitle: '',
  department: 'Engineering',
  reportingManager: '',
  workLocation: '',
  officeBranch: '',
  shiftAssignment: '',
  probationPeriod: '',
  employmentConfirmationDate: '',
  contractStartDate: '',
  contractEndDate: '',
  workMode: 'Office',

  // Step 3: Organization & Salary
  company: '',
  branch: '',
  designation: '',
  team: '',
  roleAccessLevel: '',
  employeeCategory: '',
  costCenter: '',
  salaryStructure: '',
  basicSalary: '',
  hra: '',
  allowances: '',
  otherEarnings: '',
  pfApplicable: 'Yes',
  esicApplicable: 'Yes',
  professionalTaxApplicable: 'Yes',
  tdsApplicable: 'Yes',
  bankName: '',
  accountHolderName: '',
  accountNumber: '',
  ifscCode: '',
  uanNumber: '',
  esicNumber: '',

  // Step 4: Emergency Contacts
  emergencyContacts: [
    {
      id: 1,
      name: '',
      relationship: '',
      primaryContact: '',
      alternateContact: '',
      address: '',
      bloodGroup: '',
      medicalNotes: '',
    },
  ],

  // Step 5: Mobile Login & Access
  enableMobileAccess: false,
  loginEmail: '',
  username: '',
  applicationRole: '',
  permissions: [],
  enableAttendanceAccess: false,
  enableLocationTracking: false,
  enablePushNotifications: false,
  enableEmployeeSelfService: false,
  accountStatus: 'Active',

  // Wizard state
  currentStep: 1,
  completedSteps: [],
  stepErrors: {},
};

export const useEmployeeWizardStore = create((set, get) => ({
  ...INITIAL_STATE,

  setCurrentStep: (step) => set({ currentStep: step }),

  updateField: (field, value) => set({ [field]: value }),

  updateFields: (fields) => set(fields),

  markStepCompleted: (step) => set((state) => ({
    completedSteps: Array.from(new Set([...state.completedSteps, step])),
  })),

  setStepErrors: (step, errors) => set((state) => ({
    stepErrors: {
      ...state.stepErrors,
      [step]: errors,
    },
  })),

  addEmergencyContact: () => set((state) => {
    const newId = Math.max(...state.emergencyContacts.map(c => c.id), 0) + 1;
    return {
      emergencyContacts: [
        ...state.emergencyContacts,
        {
          id: newId,
          name: '',
          relationship: '',
          primaryContact: '',
          alternateContact: '',
          address: '',
          bloodGroup: '',
          medicalNotes: '',
        },
      ],
    };
  }),

  removeEmergencyContact: (id) => set((state) => ({
    emergencyContacts: state.emergencyContacts.filter(c => c.id !== id),
  })),

  updateEmergencyContact: (id, field, value) => set((state) => ({
    emergencyContacts: state.emergencyContacts.map(c =>
      c.id === id ? { ...c, [field]: value } : c
    ),
  })),

  addPermission: (permission) => set((state) => ({
    permissions: Array.from(new Set([...state.permissions, permission])),
  })),

  removePermission: (permission) => set((state) => ({
    permissions: state.permissions.filter(p => p !== permission),
  })),

  getAllData: () => {
    const state = get();
    return {
      personal: {
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
        profilePhoto: state.profilePhoto,
        address: {
          residential: state.residentialAddress,
          city: state.city,
          state: state.state,
          country: state.country,
          pinCode: state.pinCode,
        },
      },
      employment: {
        dateOfJoining: state.dateOfJoining,
        employmentType: state.employmentType,
        employeeStatus: state.employeeStatus,
        jobTitle: state.jobTitle,
        department: state.department,
        reportingManager: state.reportingManager,
        workLocation: state.workLocation,
        officeBranch: state.officeBranch,
        shiftAssignment: state.shiftAssignment,
        probationPeriod: state.probationPeriod,
        employmentConfirmationDate: state.employmentConfirmationDate,
        contractStartDate: state.contractStartDate,
        contractEndDate: state.contractEndDate,
        workMode: state.workMode,
      },
      organization: {
        company: state.company,
        branch: state.branch,
        designation: state.designation,
        team: state.team,
        roleAccessLevel: state.roleAccessLevel,
        employeeCategory: state.employeeCategory,
        costCenter: state.costCenter,
        salaryStructure: state.salaryStructure,
        salary: {
          basic: state.basicSalary,
          hra: state.hra,
          allowances: state.allowances,
          otherEarnings: state.otherEarnings,
        },
        deductions: {
          pf: state.pfApplicable,
          esic: state.esicApplicable,
          professionalTax: state.professionalTaxApplicable,
          tds: state.tdsApplicable,
        },
        bankDetails: {
          bankName: state.bankName,
          accountHolderName: state.accountHolderName,
          accountNumber: state.accountNumber,
          ifscCode: state.ifscCode,
          uanNumber: state.uanNumber,
          esicNumber: state.esicNumber,
        },
      },
      emergency: {
        contacts: state.emergencyContacts,
      },
      mobileAccess: {
        enabled: state.enableMobileAccess,
        loginEmail: state.loginEmail,
        username: state.username,
        applicationRole: state.applicationRole,
        permissions: state.permissions,
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
