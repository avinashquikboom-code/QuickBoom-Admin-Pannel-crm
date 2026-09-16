'use client';

import React, { useState, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Mail,
  Phone,
  Building2,
  CheckCircle,
  XCircle,
  Calendar,
  RefreshCw,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Briefcase,
  Award,
  MoreVertical,
  X,
  UserCheck,
  UserX,
  MapPin,
  Clock,
  Shield,
  CreditCard,
  FileText,
  HeartHandshake,
  Settings,
  ChevronRight,
  ChevronLeft,
  Filter,
  Lock,
  DollarSign,
  FileCheck,
  Plus,
  ShieldCheck,
  Save,
  AlertCircle,
  Check,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminPagination } from '@/components/admin';

export interface EmployeeMaster {
  id: string;
  employeeId: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone: string;
  gender: string | null;
  dob: string | null;
  joiningDate: string;
  departmentId?: number | null;
  designationId?: number | null;
  officeId?: number | null;
  shiftId?: number | null;
  shift?: string | any | null;
  shiftName?: string | null;
  shiftObj?: any;
  officeObj?: any;
  department: string;
  designation: string;
  branch: string;
  office: string;
  employmentType: string;
  employeeType?: 'COMPANY' | 'FREELANCER';
  city?: string | null;
  address: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  mobileLoginEnabled?: boolean;
  managerId: number | null;
  documents?: {
    panNumber?: string;
    aadhaarNumber?: string;
    passportNumber?: string;
  } | null;
  bankDetails?: {
    bankName?: string;
    accountHolderName?: string;
    accountNumber?: string;
    ifscCode?: string;
    branchName?: string;
    basicSalary?: number | string;
  } | null;
  emergencyContact?: {
    name?: string;
    relationship?: string;
    phone?: string;
  } | string | null;
  createdAt: string;
  updatedAt: string;
}

type FormTab = 'personal' | 'employment' | 'identity' | 'emergency' | 'bank' | 'work';

export default function EmployeesPage() {
  const queryClient = useQueryClient();

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [officeFilter, setOfficeFilter] = useState('ALL');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [designationFilter, setDesignationFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Drawer states
  const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false);
  const [isFormDrawerOpen, setIsFormDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit'>('create');
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeMaster | null>(null);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  const [activeDetailsTab, setActiveDetailsTab] = useState<FormTab>('personal');

  // Masking toggles for sensitive data
  const [showAadhaar, setShowAadhaar] = useState(false);
  const [showPan, setShowPan] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Quick Add Master dialog states (from inside Step 3 of Employee Wizard)
  const [quickDeptModalOpen, setQuickDeptModalOpen] = useState(false);
  const [quickDeptName, setQuickDeptName] = useState('');
  const [quickDeptCode, setQuickDeptCode] = useState('');
  const [isQuickDeptSubmitting, setIsQuickDeptSubmitting] = useState(false);

  const [quickDesigModalOpen, setQuickDesigModalOpen] = useState(false);
  const [quickDesigName, setQuickDesigName] = useState('');
  const [quickDesigCode, setQuickDesigCode] = useState('');
  const [isQuickDesigSubmitting, setIsQuickDesigSubmitting] = useState(false);

  const [quickOfficeModalOpen, setQuickOfficeModalOpen] = useState(false);
  const [quickOfficeName, setQuickOfficeName] = useState('');
  const [quickOfficeCity, setQuickOfficeCity] = useState('');
  const [quickOfficeLat, setQuickOfficeLat] = useState('19.0760');
  const [quickOfficeLng, setQuickOfficeLng] = useState('72.8777');
  const [quickOfficeRadius, setQuickOfficeRadius] = useState('200');
  const [isQuickOfficeSubmitting, setIsQuickOfficeSubmitting] = useState(false);

  // Module Permissions Modal State (Role & Employee-specific Access Control)
  const [permEmployee, setPermEmployee] = useState<EmployeeMaster | null>(null);
  const [permModules, setPermModules] = useState<any[]>([]);
  const [permOverrides, setPermOverrides] = useState<Record<string, 'DEFAULT' | 'ALLOW' | 'DENY'>>({});
  const [isPermLoading, setIsPermLoading] = useState(false);
  const [isPermSaving, setIsPermSaving] = useState(false);

  const handleOpenPermissionsModal = async (emp: EmployeeMaster) => {
    setPermEmployee(emp);
    setIsPermLoading(true);
    try {
      const res: any = await api.get(`/works/permissions/overrides/employee/${emp.id}`);
      const data = res?.data || res;
      setPermModules(data?.modules || []);
      const initialOverrides: Record<string, 'DEFAULT' | 'ALLOW' | 'DENY'> = {};
      (data?.modules || []).forEach((m: any) => {
        initialOverrides[m.moduleKey] = m.override || 'DEFAULT';
      });
      setPermOverrides(initialOverrides);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to fetch employee module permissions');
    } finally {
      setIsPermLoading(false);
    }
  };

  const handleSaveEmployeePermissions = async () => {
    if (!permEmployee) return;
    setIsPermSaving(true);
    try {
      await api.put(`/works/permissions/overrides/employee/${permEmployee.id}`, {
        overrides: permOverrides,
      });
      toast.success(`Module permissions saved for ${permEmployee.name || permEmployee.firstName}!`);
      setPermEmployee(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save module permissions');
    } finally {
      setIsPermSaving(false);
    }
  };

  // Form state structured into 6 distinct sections (shared state across all steps)
  const [formData, setFormData] = useState({
    // Step 1: Personal Details
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    gender: 'Male',
    dob: '',
    address: '',

    // Step 2: Employment Details
    employeeCode: '',
    joiningDate: new Date().toISOString().split('T')[0],
    employmentType: 'FULL_TIME',
    employeeType: 'COMPANY' as 'COMPANY' | 'FREELANCER',
    status: 'ACTIVE',
    managerId: '',

    // Step 3: Organization / Work Information (Dynamic Master Linkage)
    officeId: '' as string | number,
    shiftId: '' as string | number,
    branch: 'Head Office',
    departmentId: '' as string | number,
    departmentName: '',
    designationId: '' as string | number,
    designationName: '',

    // Step 4: Emergency & Identity Details
    emergencyName: '',
    emergencyRelationship: 'Spouse',
    emergencyPhone: '',
    panNumber: '',
    aadhaarNumber: '',
    bankName: '',
    accountHolderName: '',
    accountNumber: '',
    ifscCode: '',
    basicSalary: '',

    // Step 5: Mobile Login / Account
    mobileLoginEnabled: true,
    password: '',
    confirmPassword: '',
  });

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  // 1. Fetch Real Active Offices dynamically for Filter & Form
  const { data: officesData, isLoading: isLoadingOffices, refetch: refetchOffices } = useQuery({
    queryKey: ['active-offices'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/offices', { params: { isActive: true } });
        return Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      } catch {
        try {
          const res2: any = await api.get('/employees/hrm/offices');
          return Array.isArray(res2?.data) ? res2.data : Array.isArray(res2) ? res2 : [];
        } catch {
          return [];
        }
      }
    },
  });

  const activeOffices: { id: number; name: string; city?: string; latitude?: number; longitude?: number; radiusMeters?: number }[] = useMemo(() => {
    return Array.isArray(officesData) ? officesData : [];
  }, [officesData]);

  // 2. Fetch Active Departments dynamically from Department Master API
  const { data: activeDeptsRes, isLoading: isLoadingDepts, refetch: refetchDepts } = useQuery({
    queryKey: ['active-departments'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/departments', { params: { isActive: true } });
        return Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      } catch {
        return [];
      }
    },
  });

  const activeDepartments: { id: number; name: string; code: string }[] = useMemo(() => {
    return Array.isArray(activeDeptsRes) ? activeDeptsRes : [];
  }, [activeDeptsRes]);

  // 3. Fetch Active Designations dynamically from Designation Master API (filtered by selected department)
  const { data: activeDesigsRes, isLoading: isLoadingDesigs, refetch: refetchDesigs } = useQuery({
    queryKey: ['active-designations', formData.departmentId],
    queryFn: async () => {
      try {
        const params: any = { isActive: true };
        if (formData.departmentId) {
          params.departmentId = formData.departmentId;
        }
        const res: any = await api.get('/designations', { params });
        return Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      } catch {
        return [];
      }
    },
  });

  const activeDesignations: { id: number; name: string; code: string; departmentId?: number }[] = useMemo(() => {
    return Array.isArray(activeDesigsRes) ? activeDesigsRes : [];
  }, [activeDesigsRes]);

  // Dynamic Shifts query
  const { data: activeShiftsRes, isLoading: isLoadingShifts, refetch: refetchShifts } = useQuery({
    queryKey: ['active-shifts'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/shifts', { params: { status: 'ACTIVE' } });
        const items = res?.data?.data || res?.data?.items || res?.data || (Array.isArray(res) ? res : []);
        return Array.isArray(items) ? items : [];
      } catch {
        return [];
      }
    },
  });

  const activeShifts: { id: number; name: string; startTime: string; endTime: string }[] = useMemo(() => {
    return Array.isArray(activeShiftsRes) ? activeShiftsRes : [];
  }, [activeShiftsRes]);

  // 4. Fetch Employee Master Records with server-side filters & pagination
  const {
    data: employeesRes,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['admin-employees', search, officeFilter, departmentFilter, designationFilter, statusFilter, typeFilter, page, limit],
    queryFn: async () => {
      try {
        const params: Record<string, any> = { page, limit };
        if (search) params.search = search;
        if (officeFilter !== 'ALL') params.branch = officeFilter;
        if (departmentFilter !== 'ALL') params.department = departmentFilter;
        if (designationFilter !== 'ALL') params.designation = designationFilter;
        if (statusFilter !== 'ALL') params.status = statusFilter;
        if (typeFilter !== 'ALL') params.employmentType = typeFilter;

        const res: any = await api.get('/employees', { params });
        return res || {};
      } catch {
        return {};
      }
    },
  });

  const rawList = Array.isArray(employeesRes?.data)
    ? employeesRes.data
    : Array.isArray(employeesRes?.employees)
    ? employeesRes.employees
    : Array.isArray(employeesRes?.items)
    ? employeesRes.items
    : Array.isArray(employeesRes?.data?.employees)
    ? employeesRes.data.employees
    : Array.isArray(employeesRes?.data?.items)
    ? employeesRes.data.items
    : Array.isArray(employeesRes)
    ? employeesRes
    : [];

  const pagination = employeesRes?.pagination || {
    page: employeesRes?.page || page,
    limit: employeesRes?.limit || limit,
    total: employeesRes?.counts?.total ?? employeesRes?.total ?? rawList.length,
    totalPages: employeesRes?.totalPages || Math.ceil((employeesRes?.counts?.total ?? employeesRes?.total ?? rawList.length) / limit) || 1,
  };
  const employees: EmployeeMaster[] = useMemo(() => {
    return rawList.map((e: any) => {
      const fName = e.firstName || (e.name ? e.name.split(' ')[0] : 'Employee');
      const lName = e.lastName || (e.name ? e.name.split(' ').slice(1).join(' ') : '');
      const full = e.name || `${fName} ${lName}`.trim() || 'Employee';

      let emergencyParsed = e.emergencyContact;
      if (typeof e.emergencyContact === 'string') {
        try {
          emergencyParsed = JSON.parse(e.emergencyContact);
        } catch {
          emergencyParsed = { phone: e.emergencyContact };
        }
      }

      return {
        id: String(e.id),
        employeeId: e.employeeId || e.employeeCode || `EMP-${e.id}`,
        employeeCode: e.employeeId || e.employeeCode || `EMP-${e.id}`,
        firstName: fName,
        lastName: lName,
        name: full,
        email: e.email || 'employee@workspace.com',
        phone: e.phone || '—',
        gender: e.gender || null,
        dob: e.dob ? new Date(e.dob).toISOString().split('T')[0] : null,
        joiningDate: e.joiningDate ? new Date(e.joiningDate).toISOString().split('T')[0] : '2024-01-15',
        department: e.department?.name || e.department || 'General',
        designation: e.designation?.name || e.designation || 'Staff',
        branch: e.branch || e.office || 'Head Office',
        office: e.branch || e.office || 'Head Office',
        employmentType: e.employmentType || 'FULL_TIME',
        employeeType: e.employeeType || 'COMPANY',
        city: e.city || null,
        address: e.address || null,
        status: e.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
        mobileLoginEnabled: e.mobileLoginEnabled !== false,
        managerId: e.managerId || null,
        documents: e.documents || null,
        bankDetails: e.bankDetails || null,
        emergencyContact: emergencyParsed || null,
        createdAt: e.createdAt || new Date().toISOString(),
        updatedAt: e.updatedAt || new Date().toISOString(),
      };
    });
  }, [rawList]);

  // Extract unique departments & designations for filters
  const departmentsList = useMemo(() => {
    const set = new Set<string>();
    employees.forEach((e) => {
      if (e.department) set.add(e.department);
    });
    return Array.from(set);
  }, [employees]);

  const designationsList = useMemo(() => {
    const set = new Set<string>();
    employees.forEach((e) => {
      if (e.designation) set.add(e.designation);
    });
    return Array.from(set);
  }, [employees]);

  const officesList: string[] = useMemo(() => {
    if (Array.isArray(officesData) && officesData.length > 0) {
      return officesData.map((o: any) => o.name || o.branch || String(o));
    }
    const set = new Set<string>();
    employees.forEach((e) => {
      if (e.branch) set.add(e.branch);
    });
    return set.size > 0 ? Array.from(set) : ['Head Office'];
  }, [officesData, employees]);

  // Server-side filtering handles search, department, designation, status, type;
  // Fallback to employees list directly to ensure all server results are rendered
  const filteredEmployees = useMemo(() => {
    return employees;
  }, [employees]);

  // Summary statistics (ONLY Master data counts)
  const totalCount = employeesRes?.counts?.total ?? pagination.total ?? employees.length;
  const activeCount = employeesRes?.counts?.active ?? employees.filter((e) => e.status === 'ACTIVE').length;
  const inactiveCount = employeesRes?.counts?.inactive ?? employees.filter((e) => e.status === 'INACTIVE').length;

  // Toggle status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, newStatus }: { id: string; newStatus: 'ACTIVE' | 'INACTIVE' }) => {
      return api.patch(`/employees/${id}`, { status: newStatus });
    },
    onSuccess: (_, variables) => {
      toast.success(
        variables.newStatus === 'ACTIVE'
          ? 'Employee profile activated'
          : 'Employee profile deactivated'
      );
      queryClient.invalidateQueries({ queryKey: ['admin-employees'] });
      if (selectedEmployee && selectedEmployee.id === variables.id) {
        setSelectedEmployee({ ...selectedEmployee, status: variables.newStatus });
      }
    },
    onError: () => {
      toast.error('Failed to update employee status');
    },
  });

  // Save / Update mutation (executed ONLY on Final Step review submit)
  const saveEmployeeMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone?.trim() || undefined,
        gender: formData.gender,
        dob: formData.dob || undefined,
        address: formData.address || undefined,
        joiningDate: formData.joiningDate || undefined,
        employmentType: formData.employmentType,
        employeeType: formData.employeeType || 'COMPANY',
        status: formData.status,
        mobileLoginEnabled: formData.mobileLoginEnabled,
        password: formData.password?.trim() || undefined,
        confirmPassword: formData.confirmPassword?.trim() || undefined,
        officeId: formData.officeId ? Number(formData.officeId) : undefined,
        shiftId: formData.shiftId ? Number(formData.shiftId) : (drawerMode === 'edit' ? null : undefined),
        branch: formData.branch || 'Head Office',
        departmentId: formData.departmentId ? Number(formData.departmentId) : undefined,
        departmentName: formData.departmentName || undefined,
        designationId: formData.designationId ? Number(formData.designationId) : undefined,
        designationName: formData.designationName || undefined,
        managerId: formData.managerId ? Number(formData.managerId) : undefined,
        documents: {
          panNumber: formData.panNumber || undefined,
          aadhaarNumber: formData.aadhaarNumber || undefined,
        },
        emergencyContact: {
          name: formData.emergencyName || undefined,
          relationship: formData.emergencyRelationship || undefined,
          phone: formData.emergencyPhone || undefined,
        },
        bankDetails: {
          bankName: formData.bankName || undefined,
          accountHolderName: formData.accountHolderName || undefined,
          accountNumber: formData.accountNumber || undefined,
          ifscCode: formData.ifscCode || undefined,
          basicSalary: formData.basicSalary || undefined,
        },
      };

      if (drawerMode === 'create') {
        // employeeCode intentionally omitted — backend always auto-generates
        return api.post('/employees', payload);
      } else {
        if (!selectedEmployee) return;
        return api.patch(`/employees/${selectedEmployee.id}`, payload);
      }
    },
    onSuccess: (res: any) => {
      const generatedCode =
        res?.employeeCode ||
        res?.data?.employeeCode ||
        res?.data?.data?.employeeCode ||
        formData.employeeCode ||
        '';
      toast.success(
        drawerMode === 'create'
          ? `Employee created successfully (${generatedCode})`
          : 'Employee profile updated successfully'
      );
      setIsFormDrawerOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-employees'] });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Failed to save employee profile';
      toast.error(typeof msg === 'string' ? msg : 'Validation error');
    },
  });

  // Quick Add Department from inside Step 3
  const handleQuickAddDepartment = async () => {
    if (!quickDeptName.trim()) {
      toast.error('Please enter department name');
      return;
    }
    setIsQuickDeptSubmitting(true);
    try {
      const res: any = await api.post('/departments', {
        name: quickDeptName.trim(),
        code: quickDeptCode.trim().toUpperCase() || undefined,
        isActive: true,
      });
      const created = res?.data || res;
      toast.success(`Department "${created.name}" created!`);
      await queryClient.invalidateQueries({ queryKey: ['active-departments'] });
      await queryClient.invalidateQueries({ queryKey: ['admin-departments'] });
      setFormData((prev) => ({
        ...prev,
        departmentId: created.id,
        departmentName: created.name,
      }));
      setQuickDeptName('');
      setQuickDeptCode('');
      setQuickDeptModalOpen(false);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to create department';
      toast.error(typeof msg === 'string' ? msg : 'Error creating department');
    } finally {
      setIsQuickDeptSubmitting(false);
    }
  };

  // Quick Add Designation from inside Step 3
  const handleQuickAddDesignation = async () => {
    if (!quickDesigName.trim()) {
      toast.error('Please enter designation title');
      return;
    }
    setIsQuickDesigSubmitting(true);
    try {
      const res: any = await api.post('/designations', {
        name: quickDesigName.trim(),
        code: quickDesigCode.trim().toUpperCase() || undefined,
        departmentId: formData.departmentId ? Number(formData.departmentId) : undefined,
        level: 1,
        isActive: true,
      });
      const created = res?.data || res;
      toast.success(`Designation "${created.name}" created!`);
      await queryClient.invalidateQueries({ queryKey: ['active-designations'] });
      await queryClient.invalidateQueries({ queryKey: ['admin-designations'] });
      setFormData((prev) => ({
        ...prev,
        designationId: created.id,
        designationName: created.name,
      }));
      setQuickDesigName('');
      setQuickDesigCode('');
      setQuickDesigModalOpen(false);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to create designation';
      toast.error(typeof msg === 'string' ? msg : 'Error creating designation');
    } finally {
      setIsQuickDesigSubmitting(false);
    }
  };

  // Quick Add Office from inside Step 3
  const handleQuickAddOffice = async () => {
    if (!quickOfficeName.trim()) {
      toast.error('Please enter office name');
      return;
    }
    setIsQuickOfficeSubmitting(true);
    try {
      const res: any = await api.post('/offices', {
        name: quickOfficeName.trim(),
        city: quickOfficeCity.trim() || undefined,
        latitude: quickOfficeLat ? parseFloat(quickOfficeLat) : 19.076,
        longitude: quickOfficeLng ? parseFloat(quickOfficeLng) : 72.8777,
        radiusMeters: quickOfficeRadius ? parseFloat(quickOfficeRadius) : 200,
        isActive: true,
      });
      const created = res?.data || res;
      toast.success(`Office "${created.name}" created!`);
      await refetchOffices();
      setFormData((prev) => ({
        ...prev,
        officeId: created.id,
        branch: created.name,
      }));
      setQuickOfficeName('');
      setQuickOfficeCity('');
      setQuickOfficeModalOpen(false);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to create office';
      toast.error(typeof msg === 'string' ? msg : 'Error creating office');
    } finally {
      setIsQuickOfficeSubmitting(false);
    }
  };

  // Delete Employee state & mutation
  const [deleteConfirmEmp, setDeleteConfirmEmp] = useState<EmployeeMaster | null>(null);

  const deleteEmployeeMutation = useMutation({
    mutationFn: async (id: string | number) => {
      return api.delete(`/employees/${id}`);
    },
    onSuccess: () => {
      toast.success('Employee record deleted successfully');
      setDeleteConfirmEmp(null);
      setIsDetailsDrawerOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-employees'] });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Failed to delete employee';
      toast.error(typeof msg === 'string' ? msg : 'Error deleting employee');
    },
  });

  // Employee ID preview state (silently loaded when opening create drawer)
  // Never sent to backend — backend always generates the authoritative ID on save.
  const [previewEmployeeId, setPreviewEmployeeId] = useState<string>('');

  // Handlers for Drawer
  const handleOpenDetails = (emp: EmployeeMaster) => {
    setSelectedEmployee(emp);
    setActiveDetailsTab('personal');
    setShowAadhaar(false);
    setShowPan(false);
    setShowAccount(false);
    setIsDetailsDrawerOpen(true);
  };

  const handleOpenCreate = () => {
    setDrawerMode('create');
    setSelectedEmployee(null);
    setCurrentStep(1);
    setShowPassword(false);
    setShowConfirmPassword(false);

    const defaultDept = activeDepartments[0];
    const defaultDesig = activeDesignations[0];
    const defaultOffice = activeOffices[0];

    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      gender: 'Male',
      dob: '',
      address: '',
      employeeCode: '',  // cleared — backend will assign on save
      joiningDate: new Date().toISOString().split('T')[0],
      employmentType: 'FULL_TIME',
      employeeType: 'COMPANY',
      status: 'ACTIVE',
      managerId: '',
      officeId: defaultOffice ? defaultOffice.id : '',
      shiftId: '',
      branch: defaultOffice ? defaultOffice.name : (officesList[0] || 'Head Office'),
      departmentId: defaultDept ? defaultDept.id : '',
      departmentName: defaultDept ? defaultDept.name : 'Engineering & IT',
      designationId: defaultDesig ? defaultDesig.id : '',
      designationName: defaultDesig ? defaultDesig.name : 'Software Engineer',
      panNumber: '',
      aadhaarNumber: '',
      emergencyName: '',
      emergencyRelationship: 'Spouse',
      emergencyPhone: '',
      bankName: '',
      accountHolderName: '',
      accountNumber: '',
      ifscCode: '',
      basicSalary: '',
      mobileLoginEnabled: true,
      password: '',
      confirmPassword: '',
    });
    setIsDetailsDrawerOpen(false);
    setIsFormDrawerOpen(true);
    // Silently fetch the next ID to show as a read-only preview in the form.
    // The backend generates the real ID on save — this is display-only.
    setPreviewEmployeeId('');
    api.get('/employees/next-id')
      .then((res: any) => {
        const nextId = res?.nextEmployeeId || res?.data?.nextEmployeeId || '';
        if (nextId) setPreviewEmployeeId(nextId);
      })
      .catch(() => { /* silently ignore */ });
  };

  const handleOpenEdit = (emp: EmployeeMaster) => {
    setDrawerMode('edit');
    setSelectedEmployee(emp);
    setCurrentStep(1);
    setShowPassword(false);
    setShowConfirmPassword(false);

    const em = typeof emp.emergencyContact === 'object' ? emp.emergencyContact : null;
    const bk = emp.bankDetails || null;
    const docs = emp.documents || null;

    const matchedDept =
      activeDepartments.find((d) => d.id === emp.departmentId) ||
      activeDepartments.find((d) => d.name.toLowerCase() === emp.department.toLowerCase());

    const matchedDesig =
      activeDesignations.find((d) => d.id === emp.designationId) ||
      activeDesignations.find((d) => d.name.toLowerCase() === emp.designation.toLowerCase());

    const matchedOffice =
      activeOffices.find((o) => o.id === emp.officeId) ||
      activeOffices.find((o) => o.name.toLowerCase() === (emp.office || emp.branch || '').toLowerCase());

    setFormData({
      firstName: emp.firstName,
      lastName: emp.lastName,
      email: emp.email,
      phone: emp.phone === '—' ? '' : emp.phone,
      gender: emp.gender || 'Male',
      dob: emp.dob || '',
      address: emp.address || '',
      employeeCode: emp.employeeCode,
      joiningDate: emp.joiningDate || new Date().toISOString().split('T')[0],
      employmentType: emp.employmentType || 'FULL_TIME',
      employeeType: (emp.employeeType as 'COMPANY' | 'FREELANCER') || 'COMPANY',
      status: emp.status,
      managerId: emp.managerId ? String(emp.managerId) : '',
      officeId: emp.officeId || (matchedOffice ? matchedOffice.id : ''),
      shiftId: emp.shiftId || (emp.shift as any)?.id || '',
      branch: emp.office || emp.branch || (matchedOffice ? matchedOffice.name : 'Head Office'),
      departmentId: emp.departmentId || (matchedDept ? matchedDept.id : ''),
      departmentName: emp.department || (matchedDept ? matchedDept.name : 'Engineering & IT'),
      designationId: emp.designationId || (matchedDesig ? matchedDesig.id : ''),
      designationName: emp.designation || (matchedDesig ? matchedDesig.name : 'Software Engineer'),
      panNumber: docs?.panNumber || '',
      aadhaarNumber: docs?.aadhaarNumber || '',
      emergencyName: em?.name || '',
      emergencyRelationship: em?.relationship || 'Spouse',
      emergencyPhone: em?.phone || '',
      bankName: bk?.bankName || '',
      accountHolderName: bk?.accountHolderName || `${emp.firstName} ${emp.lastName}`.trim(),
      accountNumber: bk?.accountNumber || '',
      ifscCode: bk?.ifscCode || '',
      basicSalary: bk?.basicSalary ? String(bk.basicSalary) : '',
      mobileLoginEnabled: emp.mobileLoginEnabled !== false,
      password: '',
      confirmPassword: '',
    });
    setIsDetailsDrawerOpen(false);
    setIsFormDrawerOpen(true);
  };

  // Step validation and navigation logic (Frontend state only - NO API calls on Next/Previous)
  const validateStep = (stepNumber: number): boolean => {
    if (stepNumber === 1) {
      if (!formData.firstName.trim()) {
        toast.error('First Name is required');
        return false;
      }
      if (!formData.lastName.trim()) {
        toast.error('Last Name is required');
        return false;
      }
      if (!formData.email.trim() || !formData.email.includes('@')) {
        toast.error('Valid corporate email address is required');
        return false;
      }
      return true;
    }

    if (stepNumber === 2) {
      if (!formData.joiningDate) {
        toast.error('Joining Date is required');
        return false;
      }
      // Employee ID is always system-generated — no validation needed
      return true;
    }

    if (stepNumber === 3) {
      if (!formData.branch.trim()) {
        toast.error('Assigned office / branch is required');
        return false;
      }
      if (!formData.departmentName.trim()) {
        toast.error('Department is required');
        return false;
      }
      if (!formData.designationName.trim()) {
        toast.error('Designation is required');
        return false;
      }
      return true;
    }

    if (stepNumber === 4) {
      // Emergency / Identity are optional but if filled, validate phone format
      if (formData.emergencyPhone && formData.emergencyPhone.trim().length > 0 && formData.emergencyPhone.trim().length < 7) {
        toast.error('Please enter a valid emergency phone number');
        return false;
      }
      return true;
    }

    if (stepNumber === 5) {
      if (formData.mobileLoginEnabled) {
        if (drawerMode === 'create' && formData.password.trim().length > 0) {
          if (formData.password.length < 6) {
            toast.error('Password must be at least 6 characters long');
            return false;
          }
          if (formData.password !== formData.confirmPassword) {
            toast.error('Password and Confirm Password do not match');
            return false;
          }
        } else if (drawerMode === 'edit' && formData.password.trim().length > 0) {
          if (formData.password.length < 6) {
            toast.error('New password must be at least 6 characters long');
            return false;
          }
          if (formData.password !== formData.confirmPassword) {
            toast.error('New password and Confirm Password do not match');
            return false;
          }
        }
      }
      return true;
    }

    return true;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 6) {
        setCurrentStep((prev) => (prev + 1) as any);
      }
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as any);
    }
  };

  const handleJumpToStep = (targetStep: 1 | 2 | 3 | 4 | 5 | 6) => {
    // If jumping forward, validate current step first
    if (targetStep > currentStep) {
      for (let s = currentStep; s < targetStep; s++) {
        if (!validateStep(s)) return;
      }
    }
    setCurrentStep(targetStep);
  };

  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validate all steps before submitting
    for (let s = 1; s <= 5; s++) {
      if (!validateStep(s)) {
        setCurrentStep(s as any);
        return;
      }
    }
    saveEmployeeMutation.mutate();
  };

  // Masking helpers
  const maskValue = (val?: string | null, visibleDigits = 4) => {
    if (!val || val.trim().length === 0) return '—';
    if (val.length <= visibleDigits) return val;
    return '•••• '.repeat(Math.max(1, Math.floor((val.length - visibleDigits) / 4))) + val.slice(-visibleDigits);
  };

  const TAB_ITEMS: { id: FormTab; label: string; icon: React.ElementType }[] = [
    { id: 'personal', label: 'Personal', icon: Users },
    { id: 'employment', label: 'Employment', icon: Briefcase },
    { id: 'identity', label: 'Identity / Govt', icon: Shield },
    { id: 'emergency', label: 'Emergency', icon: HeartHandshake },
    { id: 'bank', label: 'Bank & Payroll', icon: CreditCard },
    { id: 'work', label: 'Work & Org', icon: Building2 },
  ];

  const WIZARD_STEPS = [
    { step: 1 as const, title: 'Personal', fullTitle: 'Personal Information', desc: 'Identity & contact', icon: Users },
    { step: 2 as const, title: 'Employment', fullTitle: 'Employment Information', desc: 'ID, joining & status', icon: Briefcase },
    { step: 3 as const, title: 'Organization', fullTitle: 'Work & Organization', desc: 'Branch, dept & role', icon: Building2 },
    { step: 4 as const, title: 'Emergency', fullTitle: 'Emergency & Identity', desc: 'Contacts & documents', icon: HeartHandshake },
    { step: 5 as const, title: 'Mobile Login', fullTitle: 'Mobile Login / Account', desc: 'App access & credentials', icon: Lock },
    { step: 6 as const, title: 'Review', fullTitle: 'Review & Create', desc: 'Verify before save', icon: FileCheck },
  ];

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-16 text-slate-800">
      {/* =========================================================================
          1. PAGE HERO HEADER CARD
          ========================================================================= */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-slate-700/60 shadow-xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-[#23C45E]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-[#23C45E] border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-[#23C45E] animate-pulse" />
                Workforce Directory
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Employee Master
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-2xl leading-relaxed">
              Manage complete employee profiles, assigned branch geofences, and organizational directory.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="p-2.5 bg-white/10 hover:bg-white/15 text-white rounded-2xl border border-white/10 text-xs font-black transition-all cursor-pointer backdrop-blur-xs disabled:opacity-50 active:scale-95"
              title="Refresh employees"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin text-[#23C45E]' : ''}`} />
            </button>

            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#23C45E] hover:bg-[#1AA14D] text-slate-950 font-black rounded-2xl text-xs shadow-md shadow-[#23C45E]/20 transition-all cursor-pointer group active:scale-[0.98]"
            >
              <UserPlus className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span>+ Add Employee</span>
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          2. SUMMARY KPI CARDS (Only Employee Master Statistics)
          ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Employees */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase font-black tracking-wider text-slate-400">
              Total Employees
            </span>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
              {isLoading ? '...' : totalCount}
            </p>
            <span className="text-xs font-bold text-slate-500 mt-0.5 block">
              Registered workforce profiles
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Active Employees */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase font-black tracking-wider text-slate-400">
              Active Employees
            </span>
            <p className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">
              {isLoading ? '...' : activeCount}
            </p>
            <span className="text-xs font-bold text-emerald-700 mt-0.5 block">
              Currently operational
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#1AA14D] border border-emerald-100 flex items-center justify-center">
            <UserCheck className="w-6 h-6 text-[#23C45E]" />
          </div>
        </div>

        {/* Inactive Employees */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase font-black tracking-wider text-slate-400">
              Inactive Employees
            </span>
            <p className="text-2xl sm:text-3xl font-black text-rose-600 mt-1">
              {isLoading ? '...' : inactiveCount}
            </p>
            <span className="text-xs font-bold text-rose-700 mt-0.5 block">
              Deactivated or archived
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center">
            <UserX className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* =========================================================================
          3. SEARCH & MASTER-DATA FILTERS
          ========================================================================= */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, employee ID, email, phone..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#23C45E] focus:bg-white transition-all"
            />
          </div>

          {/* Master Filters */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Office Filter */}
            <select
              value={officeFilter}
              onChange={(e) => setOfficeFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
            >
              <option value="ALL">All Offices / Branches</option>
              {officesList.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>

            {/* Department Filter */}
            {departmentsList.length > 0 && (
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
              >
                <option value="ALL">All Departments</option>
                {departmentsList.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            )}

            {/* Designation Filter */}
            {designationsList.length > 0 && (
              <select
                value={designationFilter}
                onChange={(e) => setDesignationFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
              >
                <option value="ALL">All Designations</option>
                {designationsList.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            )}

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive Only</option>
            </select>

            {/* Employment Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
            >
              <option value="ALL">All Types</option>
              <option value="FULL_TIME">Full Time</option>
              <option value="PART_TIME">Part Time</option>
              <option value="CONTRACT">Contract</option>
              <option value="INTERN">Intern</option>
            </select>
          </div>
        </div>
      </div>

      {/* =========================================================================
          4. COMPACT EMPLOYEE MASTER TABLE
          ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center justify-between gap-4 p-3 bg-slate-50/60 rounded-xl animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-200" />
                    <div className="space-y-1.5">
                      <div className="w-28 h-3.5 bg-slate-200 rounded" />
                      <div className="w-16 h-2.5 bg-slate-200 rounded" />
                    </div>
                  </div>
                  <div className="w-36 h-3 bg-slate-200 rounded hidden md:block" />
                  <div className="w-24 h-3 bg-slate-200 rounded hidden lg:block" />
                  <div className="w-20 h-5 bg-slate-200 rounded-full" />
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
                <XCircle className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-800">Unable to load employees.</p>
              <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto">
                There was a problem connecting to the employee service. Please try again.
              </p>
              <button
                onClick={() => refetch()}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Users className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-800">
                {search || officeFilter !== 'ALL' || departmentFilter !== 'ALL' || statusFilter !== 'ALL'
                  ? 'No employees match your filters.'
                  : 'No employees found in the master roster.'}
              </p>
              <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto">
                {search || officeFilter !== 'ALL' || departmentFilter !== 'ALL' || statusFilter !== 'ALL'
                  ? 'Try adjusting your search criteria or filter options.'
                  : 'Get started by creating your first organizational employee record.'}
              </p>
              <button
                onClick={handleOpenCreate}
                className="px-4 py-2 bg-[#23C45E] hover:bg-[#1AA14D] text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-md shadow-[#23C45E]/20"
              >
                + Add Employee
              </button>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-4">Employee</th>
                  <th className="py-3.5 px-4">Employee ID</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Office</th>
                  <th className="py-3.5 px-4">Shift</th>
                  <th className="py-3.5 px-4">Department</th>
                  <th className="py-3.5 px-4">Designation</th>
                  <th className="py-3.5 px-4">Employment Type</th>
                  <th className="py-3.5 px-4">Joining Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredEmployees.map((emp) => {
                  const avatarLetter = (emp.firstName?.[0] || emp.name?.[0] || 'E').toUpperCase();
                  const isActive = emp.status === 'ACTIVE';

                  return (
                    <tr
                      key={emp.id}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                      onClick={() => handleOpenDetails(emp)}
                    >
                      {/* 1. Employee */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-2xs">
                            {avatarLetter}
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-900 hover:text-[#1AA14D] transition-colors">
                              {emp.name}
                            </p>
                            <span className="text-[11px] font-mono font-bold text-slate-400">
                              {emp.employeeId}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 2. Employee ID */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-mono font-bold text-xs">
                          {emp.employeeId}
                        </span>
                      </td>

                      {/* 3. Contact */}
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-800">{emp.email}</p>
                        <p className="text-[11px] text-slate-500 font-mono">{emp.phone}</p>
                      </td>

                      {/* 3. Office */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-bold">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          {emp.branch}
                        </span>
                      </td>

                      {/* Shift */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200/60">
                          <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          {emp.shift?.name || emp.shiftName || emp.shift || 'General Shift'}
                        </span>
                      </td>

                      {/* 4. Department */}
                      <td className="py-3.5 px-4 font-bold text-slate-800">
                        {emp.department}
                      </td>

                      {/* 5. Designation */}
                      <td className="py-3.5 px-4 text-slate-700 font-semibold">
                        {emp.designation}
                      </td>

                      {/* 6. Employment Type */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1 items-start">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                              emp.employeeType === 'FREELANCER'
                                ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}
                          >
                            {emp.employeeType === 'FREELANCER' ? 'Freelancer' : 'Company'}
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-extrabold uppercase tracking-wider">
                            {emp.employmentType.replace('_', ' ')}
                          </span>
                        </div>
                      </td>

                      {/* 7. Joining Date */}
                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        {emp.joiningDate}
                      </td>

                      {/* 8. Status & Mobile Access */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${
                              isActive
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-500 border border-slate-200'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isActive ? 'bg-emerald-500' : 'bg-slate-400'
                              }`}
                            />
                            {isActive ? 'Active' : 'Inactive'}
                          </span>
                          <span className={`block text-[10px] font-bold ${emp.mobileLoginEnabled !== false ? 'text-emerald-600' : 'text-slate-400'}`}>
                            App: {emp.mobileLoginEnabled !== false ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                      </td>

                      {/* 9. Actions Menu */}
                      <td
                        className="py-3.5 px-4 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenDetails(emp)}
                            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-900 transition-colors"
                            title="View Complete Profile"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleOpenPermissionsModal(emp)}
                            className="p-1.5 hover:bg-emerald-50 rounded-lg text-slate-500 hover:text-emerald-700 transition-colors cursor-pointer"
                            title="Manage Module Permissions"
                          >
                            <ShieldCheck className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleOpenEdit(emp)}
                            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-[#1AA14D] transition-colors"
                            title="Edit Employee"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() =>
                              toggleStatusMutation.mutate({
                                id: emp.id,
                                newStatus: isActive ? 'INACTIVE' : 'ACTIVE',
                              })
                            }
                            className={`p-1.5 hover:bg-slate-100 rounded-lg transition-colors ${
                              isActive
                                ? 'text-slate-400 hover:text-rose-600'
                                : 'text-slate-400 hover:text-emerald-600'
                            }`}
                            title={isActive ? 'Deactivate Employee' : 'Activate Employee'}
                          >
                            {isActive ? (
                              <UserX className="w-4 h-4" />
                            ) : (
                              <UserCheck className="w-4 h-4" />
                            )}
                          </button>

                          <button
                            onClick={() => setDeleteConfirmEmp(emp)}
                            className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                            title="Delete Employee"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Server-Side Pagination Footer */}
        <AdminPagination
          page={page}
          pageSize={limit}
          total={pagination.total}
          totalPages={pagination.totalPages}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setLimit(size);
            setPage(1);
          }}
          disabled={isLoading}
        />
      </div>

      {/* =========================================================================
          5. RIGHT-SIDE DRAWER: EMPLOYEE MASTER DETAILS (VIEW MODE)
          ========================================================================= */}
      {isDetailsDrawerOpen && selectedEmployee && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsDetailsDrawerOpen(false)}
          />

          {/* Drawer Container */}
          <div className="relative w-full max-w-xl bg-white shadow-2xl z-10 flex flex-col h-full overflow-hidden animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 text-white font-black text-base flex items-center justify-center shadow-sm">
                  {(selectedEmployee.firstName?.[0] || 'E').toUpperCase()}
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900 leading-snug">
                    {selectedEmployee.name}
                  </h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] text-slate-500 font-mono font-bold">
                      {selectedEmployee.employeeId || selectedEmployee.employeeCode}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black ${
                        selectedEmployee.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {selectedEmployee.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsDetailsDrawerOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 6 Section Nav Tabs */}
            <div className="flex items-center border-b border-slate-100 bg-white px-4 overflow-x-auto no-scrollbar shrink-0">
              {TAB_ITEMS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeDetailsTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveDetailsTab(tab.id)}
                    className={`flex items-center gap-1.5 px-3.5 py-3 border-b-2 font-extrabold text-xs transition-all whitespace-nowrap cursor-pointer ${
                      isActive
                        ? 'border-[#23C45E] text-[#1AA14D] bg-emerald-50/40'
                        : 'border-transparent text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#23C45E]' : 'text-slate-400'}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab Content Body */}
            <div className="p-6 space-y-6 flex-1 overflow-y-auto text-xs">
              {/* 1. PERSONAL DETAILS */}
              {activeDetailsTab === 'personal' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 bg-slate-50 rounded-xl">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">First Name</span>
                      <p className="font-extrabold text-slate-900 mt-1">{selectedEmployee.firstName}</p>
                    </div>
                    <div className="p-3.5 bg-slate-50 rounded-xl">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Last Name</span>
                      <p className="font-extrabold text-slate-900 mt-1">{selectedEmployee.lastName}</p>
                    </div>
                    <div className="p-3.5 bg-slate-50 rounded-xl col-span-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Corporate Email</span>
                      <p className="font-extrabold text-slate-900 mt-1 flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        {selectedEmployee.email}
                      </p>
                    </div>
                    <div className="p-3.5 bg-slate-50 rounded-xl">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Phone Number</span>
                      <p className="font-extrabold text-slate-900 mt-1 flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {selectedEmployee.phone}
                      </p>
                    </div>
                    <div className="p-3.5 bg-slate-50 rounded-xl">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Gender</span>
                      <p className="font-extrabold text-slate-900 mt-1">{selectedEmployee.gender || '—'}</p>
                    </div>
                    <div className="p-3.5 bg-slate-50 rounded-xl col-span-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Date of Birth</span>
                      <p className="font-extrabold text-slate-900 mt-1">{selectedEmployee.dob || '—'}</p>
                    </div>
                    <div className="p-3.5 bg-slate-50 rounded-xl col-span-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Residential Address</span>
                      <p className="font-extrabold text-slate-900 mt-1">{selectedEmployee.address || '—'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. EMPLOYMENT DETAILS */}
              {activeDetailsTab === 'employment' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 bg-slate-50 rounded-xl">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Employee ID / Code</span>
                      <p className="font-mono font-black text-slate-900 mt-1">{selectedEmployee.employeeId || selectedEmployee.employeeCode}</p>
                    </div>
                    <div className="p-3.5 bg-slate-50 rounded-xl">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Joining Date</span>
                      <p className="font-extrabold text-slate-900 mt-1 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {selectedEmployee.joiningDate}
                      </p>
                    </div>
                    <div className="p-3.5 bg-slate-50 rounded-xl">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Employee Type</span>
                      <p className={`font-extrabold mt-1 uppercase ${selectedEmployee.employeeType === 'FREELANCER' ? 'text-purple-700' : 'text-emerald-700'}`}>
                        {selectedEmployee.employeeType === 'FREELANCER' ? 'Freelancer' : 'Company'}
                      </p>
                    </div>
                    <div className="p-3.5 bg-slate-50 rounded-xl">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Employment Type</span>
                      <p className="font-extrabold text-blue-700 mt-1 uppercase">
                        {selectedEmployee.employmentType.replace('_', ' ')}
                      </p>
                    </div>
                    <div className="p-3.5 bg-slate-50 rounded-xl">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Account Status</span>
                      <p className="font-extrabold text-slate-900 mt-1">{selectedEmployee.status}</p>
                    </div>
                    <div className="p-3.5 bg-slate-50 rounded-xl">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Mobile App Access</span>
                      <p className="font-extrabold mt-1 flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${selectedEmployee.mobileLoginEnabled !== false ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        <span className={selectedEmployee.mobileLoginEnabled !== false ? 'text-emerald-700 font-black' : 'text-slate-500'}>
                          {selectedEmployee.mobileLoginEnabled !== false ? 'Enabled' : 'Disabled'}
                        </span>
                      </p>
                    </div>
                    <div className="p-3.5 bg-slate-50 rounded-xl col-span-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Reporting Manager</span>
                      <p className="font-extrabold text-slate-900 mt-1">
                        {selectedEmployee.managerId ? `Manager ID: ${selectedEmployee.managerId}` : 'Direct Super Admin / Customer Owner'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. GOVERNMENT / IDENTITY DETAILS (Masked) */}
              {activeDetailsTab === 'identity' && (
                <div className="space-y-4">
                  <div className="p-3 bg-amber-50/60 border border-amber-200/60 rounded-xl flex items-center gap-2 text-amber-800 text-[11px] font-bold">
                    <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Identity credentials are encrypted and access-controlled.</span>
                  </div>

                  <div className="space-y-3">
                    <div className="p-4 bg-slate-50 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Aadhaar Card Number</span>
                        <p className="font-mono font-black text-slate-900 mt-1">
                          {showAadhaar
                            ? selectedEmployee.documents?.aadhaarNumber || '—'
                            : maskValue(selectedEmployee.documents?.aadhaarNumber, 4)}
                        </p>
                      </div>
                      <button
                        onClick={() => setShowAadhaar(!showAadhaar)}
                        className="p-2 hover:bg-slate-200/80 rounded-lg text-slate-500 transition-colors"
                        title={showAadhaar ? 'Hide number' : 'Show number'}
                      >
                        {showAadhaar ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">PAN Card Number</span>
                        <p className="font-mono font-black text-slate-900 mt-1">
                          {showPan
                            ? selectedEmployee.documents?.panNumber || '—'
                            : maskValue(selectedEmployee.documents?.panNumber, 3)}
                        </p>
                      </div>
                      <button
                        onClick={() => setShowPan(!showPan)}
                        className="p-2 hover:bg-slate-200/80 rounded-lg text-slate-500 transition-colors"
                        title={showPan ? 'Hide number' : 'Show number'}
                      >
                        {showPan ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 4. EMERGENCY CONTACT */}
              {activeDetailsTab === 'emergency' && (
                <div className="space-y-4">
                  {typeof selectedEmployee.emergencyContact === 'object' && selectedEmployee.emergencyContact ? (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3.5 bg-slate-50 rounded-xl col-span-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Contact Person Name</span>
                        <p className="font-extrabold text-slate-900 mt-1">
                          {selectedEmployee.emergencyContact.name || '—'}
                        </p>
                      </div>
                      <div className="p-3.5 bg-slate-50 rounded-xl">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Relationship</span>
                        <p className="font-extrabold text-slate-900 mt-1">
                          {selectedEmployee.emergencyContact.relationship || '—'}
                        </p>
                      </div>
                      <div className="p-3.5 bg-slate-50 rounded-xl">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Emergency Phone</span>
                        <p className="font-extrabold text-slate-900 mt-1 flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          {selectedEmployee.emergencyContact.phone || '—'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-slate-400 font-bold">
                      No emergency contact details registered yet.
                    </div>
                  )}
                </div>
              )}

              {/* 5. BANK & PAYROLL DETAILS (Masked) */}
              {activeDetailsTab === 'bank' && (
                <div className="space-y-4">
                  <div className="p-3 bg-emerald-50/60 border border-emerald-200/60 rounded-xl flex items-center gap-2 text-emerald-800 text-[11px] font-bold">
                    <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Disbursement details for payroll and salary processing.</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 bg-slate-50 rounded-xl">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Bank Name</span>
                      <p className="font-extrabold text-slate-900 mt-1">
                        {selectedEmployee.bankDetails?.bankName || '—'}
                      </p>
                    </div>
                    <div className="p-3.5 bg-slate-50 rounded-xl">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Account Holder</span>
                      <p className="font-extrabold text-slate-900 mt-1">
                        {selectedEmployee.bankDetails?.accountHolderName || selectedEmployee.name}
                      </p>
                    </div>
                    <div className="p-3.5 bg-slate-50 rounded-xl col-span-2 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Bank Account Number</span>
                        <p className="font-mono font-black text-slate-900 mt-1">
                          {showAccount
                            ? selectedEmployee.bankDetails?.accountNumber || '—'
                            : maskValue(selectedEmployee.bankDetails?.accountNumber, 4)}
                        </p>
                      </div>
                      <button
                        onClick={() => setShowAccount(!showAccount)}
                        className="p-2 hover:bg-slate-200/80 rounded-lg text-slate-500 transition-colors"
                        title={showAccount ? 'Hide account' : 'Show account'}
                      >
                        {showAccount ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <div className="p-3.5 bg-slate-50 rounded-xl">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">IFSC Code</span>
                      <p className="font-mono font-extrabold text-slate-900 mt-1">
                        {selectedEmployee.bankDetails?.ifscCode || '—'}
                      </p>
                    </div>
                    <div className="p-3.5 bg-slate-50 rounded-xl">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Base Monthly Pay / CTC</span>
                      <p className="font-extrabold text-slate-900 mt-1">
                        {selectedEmployee.bankDetails?.basicSalary
                          ? `₹${Number(selectedEmployee.bankDetails.basicSalary).toLocaleString('en-IN')}`
                          : '—'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* 6. WORK CONFIGURATION & ORGANIZATION */}
              {activeDetailsTab === 'work' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 bg-slate-50 rounded-xl">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Assigned Office / Branch</span>
                      <p className="font-extrabold text-slate-900 mt-1 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        {selectedEmployee.branch}
                      </p>
                    </div>
                    <div className="p-3.5 bg-slate-50 rounded-xl">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Assigned Shift</span>
                      <p className="font-extrabold text-slate-900 mt-1 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-emerald-600" />
                        {selectedEmployee.shift?.name || selectedEmployee.shiftName || selectedEmployee.shift || 'General Shift'}
                      </p>
                    </div>
                    <div className="p-3.5 bg-slate-50 rounded-xl">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Department</span>
                      <p className="font-extrabold text-slate-900 mt-1">{selectedEmployee.department}</p>
                    </div>
                    <div className="p-3.5 bg-slate-50 rounded-xl col-span-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Designation / Role Title</span>
                      <p className="font-extrabold text-slate-900 mt-1">{selectedEmployee.designation}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Actions Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center gap-2.5 shrink-0">
              <button
                onClick={() => handleOpenEdit(selectedEmployee)}
                className="flex-1 py-2.5 px-4 bg-[#23C45E] hover:bg-[#1AA14D] text-white rounded-xl font-extrabold text-xs transition-all shadow-md shadow-[#23C45E]/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Edit className="w-4 h-4" />
                Edit Complete Profile
              </button>

              <button
                onClick={() =>
                  toggleStatusMutation.mutate({
                    id: selectedEmployee.id,
                    newStatus: selectedEmployee.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
                  })
                }
                className={`py-2.5 px-3.5 rounded-xl font-extrabold text-xs transition-all border cursor-pointer ${
                  selectedEmployee.status === 'ACTIVE'
                    ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200'
                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                }`}
              >
                {selectedEmployee.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
              </button>

              <button
                onClick={() => setDeleteConfirmEmp(selectedEmployee)}
                className="py-2.5 px-3.5 rounded-xl font-extrabold text-xs transition-all border bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200 cursor-pointer flex items-center gap-1.5"
                title="Delete Employee"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          6. RIGHT-SIDE DRAWER: MULTI-STEP EMPLOYEE MASTER FORM WIZARD (6 STEPS)
          ========================================================================= */}
      {isFormDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => !saveEmployeeMutation.isPending && setIsFormDrawerOpen(false)}
          />

          {/* Form Drawer Container */}
          <div className="relative w-full max-w-2xl bg-white shadow-2xl z-10 flex flex-col h-full overflow-hidden animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black text-slate-900">
                    {drawerMode === 'create' ? 'Add Employee Master' : 'Edit Employee Master'}
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-[#23C45E]/10 text-[#1AA14D] font-extrabold text-[10px] uppercase tracking-wide">
                    Step {currentStep} of 6
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {WIZARD_STEPS[currentStep - 1].fullTitle} — {WIZARD_STEPS[currentStep - 1].desc}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsFormDrawerOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stepper Navigation Bar */}
            <div className="flex items-center border-b border-slate-100 bg-white px-3 py-2.5 overflow-x-auto no-scrollbar shrink-0 gap-1">
              {WIZARD_STEPS.map((s) => {
                const Icon = s.icon;
                const isCurrent = currentStep === s.step;
                const isCompleted = currentStep > s.step;
                return (
                  <button
                    key={s.step}
                    type="button"
                    onClick={() => handleJumpToStep(s.step)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer ${
                      isCurrent
                        ? 'bg-[#23C45E] text-white shadow-xs'
                        : isCompleted
                        ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100/70'
                        : 'text-slate-500 hover:bg-slate-100/70'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black ${
                        isCurrent
                          ? 'bg-white text-[#23C45E]'
                          : isCompleted
                          ? 'bg-emerald-200 text-emerald-800'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {isCompleted ? '✓' : s.step}
                    </span>
                    <span className="hidden sm:inline">{s.title}</span>
                  </button>
                );
              })}
            </div>

            {/* Step Body */}
            <div className="flex-1 overflow-y-auto p-6 text-xs">
              {/* -------------------------------------------------------------
                  STEP 1: PERSONAL INFORMATION
                  ------------------------------------------------------------- */}
              {currentStep === 1 && (
                <div className="space-y-4 animate-in fade-in-50 duration-150">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <Users className="w-4 h-4 text-[#23C45E]" />
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wide">
                      Step 1: Personal & Contact Information
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-extrabold text-slate-700 uppercase mb-1">
                        First Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        placeholder="e.g. Rahul"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#23C45E] focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-extrabold text-slate-700 uppercase mb-1">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        placeholder="e.g. Sharma"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#23C45E] focus:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-700 uppercase mb-1">
                      Corporate Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="e.g. rahul.sharma@company.com"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#23C45E] focus:bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-extrabold text-slate-700 uppercase mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="e.g. +91 98765 43210"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#23C45E] focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-extrabold text-slate-700 uppercase mb-1">
                        Gender
                      </label>
                      <select
                        value={formData.gender}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="col-span-2">
                      <label className="block text-[11px] font-extrabold text-slate-700 uppercase mb-1">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        value={formData.dob}
                        onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-700 uppercase mb-1">
                      Residential Address
                    </label>
                    <textarea
                      rows={2}
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Full residential street address..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#23C45E] focus:bg-white"
                    />
                  </div>
                </div>
              )}

              {/* -------------------------------------------------------------
                  STEP 2: EMPLOYMENT INFORMATION
                  ------------------------------------------------------------- */}
              {currentStep === 2 && (
                <div className="space-y-4 animate-in fade-in-50 duration-150">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <Briefcase className="w-4 h-4 text-[#23C45E]" />
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wide">
                      Step 2: Employment Information
                    </h3>
                  </div>

                  {/* Employee ID — System-generated read-only */}
                  <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[11px] font-extrabold text-slate-700 uppercase">
                        EMPLOYEE ID
                      </label>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-black uppercase tracking-wider">
                        {drawerMode === 'edit' ? 'PERMANENT' : 'AUTO-ASSIGNED'}
                      </span>
                    </div>
                    <div className="px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl flex items-center cursor-not-allowed select-none">
                      <span className="flex-1 font-mono font-black text-slate-800 text-sm tracking-wider">
                        {drawerMode === 'edit' ? formData.employeeCode : (previewEmployeeId || 'EMP-003')}
                      </span>
                    </div>
                    <p className="mt-1.5 text-[10px] text-slate-400 font-medium">
                      {drawerMode === 'create'
                        ? 'Generated by system on save. Cannot be manually modified.'
                        : 'Employee ID is permanent and cannot be modified.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-extrabold text-slate-700 uppercase mb-1">
                        Joining Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.joiningDate}
                        onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-extrabold text-slate-700 uppercase mb-1">
                        Employee Type *
                      </label>
                      <select
                        value={formData.employeeType}
                        onChange={(e) => setFormData({ ...formData, employeeType: e.target.value as 'COMPANY' | 'FREELANCER' })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
                      >
                        <option value="COMPANY">In-House Employee</option>
                        <option value="FREELANCER">Freelancer</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-extrabold text-slate-700 uppercase mb-1">
                        Employment Type
                      </label>
                      <select
                        value={formData.employmentType}
                        onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
                      >
                        <option value="FULL_TIME">Full Time</option>
                        <option value="PART_TIME">Part Time</option>
                        <option value="CONTRACT">Contract</option>
                        <option value="INTERN">Intern</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-extrabold text-slate-700 uppercase mb-1">
                        Account Status
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* -------------------------------------------------------------
                  STEP 3: ORGANIZATION / WORK INFORMATION
                  ------------------------------------------------------------- */}
              {currentStep === 3 && (
                <div className="space-y-4 animate-in fade-in-50 duration-150">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <Building2 className="w-4 h-4 text-[#23C45E]" />
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wide">
                      Step 3: Organization & Work Setup
                    </h3>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-extrabold text-slate-700 uppercase">
                        Assigned Office (Attendance Geofence) *
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setQuickOfficeName('');
                          setQuickOfficeCity('');
                          setQuickOfficeModalOpen(true);
                        }}
                        className="text-[10px] font-bold text-[#1AA14D] hover:underline flex items-center gap-0.5 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" /> New
                      </button>
                    </div>
                    <select
                      required
                      value={formData.officeId || ''}
                      onChange={(e) => {
                        const offId = e.target.value;
                        const found = activeOffices.find((o) => String(o.id) === String(offId));
                        setFormData((prev) => ({
                          ...prev,
                          officeId: offId ? Number(offId) : '',
                          branch: found ? found.name : 'Head Office',
                        }));
                      }}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
                    >
                      <option value="">-- Select Assigned Office --</option>
                      {isLoadingOffices ? (
                        <option value="" disabled>Loading offices...</option>
                      ) : activeOffices.length === 0 ? (
                        <option value="" disabled>No active offices configured</option>
                      ) : (
                        activeOffices.map((off) => (
                          <option key={off.id} value={off.id}>
                            {off.name} {off.city ? `(${off.city})` : ''} • Radius: {off.radiusMeters || 200}m
                          </option>
                        ))
                      )}
                    </select>
                    {formData.branch && !formData.officeId && (
                      <p className="text-[10px] text-amber-600 mt-0.5 font-bold">
                        Assigned: {formData.branch}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-700 uppercase mb-1">
                      Assigned Shift (Work Schedule)
                    </label>
                    <select
                      value={formData.shiftId || ''}
                      onChange={(e) => {
                        const sId = e.target.value;
                        setFormData((prev) => ({
                          ...prev,
                          shiftId: sId ? Number(sId) : '',
                        }));
                      }}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
                    >
                      <option value="">-- Select Shift (Optional) --</option>
                      {isLoadingShifts ? (
                        <option value="" disabled>Loading shifts...</option>
                      ) : activeShifts.length === 0 ? (
                        <option value="" disabled>No active shifts found</option>
                      ) : (
                        activeShifts.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.startTime} - {s.endTime})
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[11px] font-extrabold text-slate-700 uppercase">
                          Department *
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setQuickDeptName('');
                            setQuickDeptCode('');
                            setQuickDeptModalOpen(true);
                          }}
                          className="text-[10px] font-bold text-[#1AA14D] hover:underline flex items-center gap-0.5 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" /> New
                        </button>
                      </div>
                      <select
                        required
                        value={formData.departmentId || ''}
                        onChange={(e) => {
                          const deptId = e.target.value;
                          const found = activeDepartments.find((d) => String(d.id) === String(deptId));
                          setFormData((prev) => ({
                            ...prev,
                            departmentId: deptId ? Number(deptId) : '',
                            departmentName: found ? found.name : '',
                          }));
                        }}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
                      >
                        <option value="">-- Select Department --</option>
                        {isLoadingDepts ? (
                          <option value="" disabled>Loading departments...</option>
                        ) : activeDepartments.length === 0 ? (
                          <option value="" disabled>No active departments found</option>
                        ) : (
                          activeDepartments.map((dept) => (
                            <option key={dept.id} value={dept.id}>
                              {dept.name} ({dept.code})
                            </option>
                          ))
                        )}
                      </select>
                      {formData.departmentName && !formData.departmentId && (
                        <p className="text-[10px] text-amber-600 mt-0.5 font-bold">
                          Current: {formData.departmentName}
                        </p>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[11px] font-extrabold text-slate-700 uppercase">
                          Designation *
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setQuickDesigName('');
                            setQuickDesigCode('');
                            setQuickDesigModalOpen(true);
                          }}
                          className="text-[10px] font-bold text-[#1AA14D] hover:underline flex items-center gap-0.5 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" /> New
                        </button>
                      </div>
                      <select
                        required
                        value={formData.designationId || ''}
                        onChange={(e) => {
                          const desId = e.target.value;
                          const found = activeDesignations.find((d) => String(d.id) === String(desId));
                          setFormData((prev) => ({
                            ...prev,
                            designationId: desId ? Number(desId) : '',
                            designationName: found ? found.name : '',
                          }));
                        }}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
                      >
                        <option value="">-- Select Designation --</option>
                        {isLoadingDesigs ? (
                          <option value="" disabled>Loading designations...</option>
                        ) : activeDesignations.length === 0 ? (
                          <option value="" disabled>No designations found</option>
                        ) : (
                          activeDesignations.map((desig) => (
                            <option key={desig.id} value={desig.id}>
                              {desig.name} ({desig.code})
                            </option>
                          ))
                        )}
                      </select>
                      {formData.designationName && !formData.designationId && (
                        <p className="text-[10px] text-amber-600 mt-0.5 font-bold">
                          Current: {formData.designationName}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-700 uppercase mb-1">
                      Reporting Manager ID (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.managerId}
                      onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                      placeholder="e.g. 1"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
                    />
                  </div>
                </div>
              )}

              {/* -------------------------------------------------------------
                  STEP 4: EMERGENCY & IDENTITY INFORMATION
                  ------------------------------------------------------------- */}
              {currentStep === 4 && (
                <div className="space-y-4 animate-in fade-in-50 duration-150">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <HeartHandshake className="w-4 h-4 text-[#23C45E]" />
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wide">
                      Step 4: Emergency Contacts & Identification
                    </h3>
                  </div>

                  {/* Emergency Contact Block */}
                  <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
                    <span className="text-[11px] font-extrabold text-slate-800 uppercase block">
                      Emergency Contact Person
                    </span>

                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-600 uppercase mb-1">
                        Contact Person Name
                      </label>
                      <input
                        type="text"
                        value={formData.emergencyName}
                        onChange={(e) => setFormData({ ...formData, emergencyName: e.target.value })}
                        placeholder="Full name of emergency contact"
                        className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-600 uppercase mb-1">
                          Relationship
                        </label>
                        <select
                          value={formData.emergencyRelationship}
                          onChange={(e) =>
                            setFormData({ ...formData, emergencyRelationship: e.target.value })
                          }
                          className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
                        >
                          <option value="Spouse">Spouse</option>
                          <option value="Parent">Parent</option>
                          <option value="Sibling">Sibling</option>
                          <option value="Guardian">Guardian</option>
                          <option value="Friend">Friend</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-600 uppercase mb-1">
                          Emergency Phone
                        </label>
                        <input
                          type="tel"
                          value={formData.emergencyPhone}
                          onChange={(e) =>
                            setFormData({ ...formData, emergencyPhone: e.target.value })
                          }
                          placeholder="e.g. +91 98765 00000"
                          className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Government IDs */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-extrabold text-slate-700 uppercase mb-1">
                        Aadhaar Card Number
                      </label>
                      <input
                        type="text"
                        value={formData.aadhaarNumber}
                        onChange={(e) => setFormData({ ...formData, aadhaarNumber: e.target.value })}
                        placeholder="12-digit UIDAI number"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#23C45E] focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-extrabold text-slate-700 uppercase mb-1">
                        PAN Card Number
                      </label>
                      <input
                        type="text"
                        value={formData.panNumber}
                        onChange={(e) =>
                          setFormData({ ...formData, panNumber: e.target.value.toUpperCase() })
                        }
                        placeholder="10-character PAN"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#23C45E] focus:bg-white"
                      />
                    </div>
                  </div>

                  {/* Bank Details */}
                  <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
                    <span className="text-[11px] font-extrabold text-slate-800 uppercase block">
                      Bank & Salary Details
                    </span>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-600 uppercase mb-1">
                          Bank Name
                        </label>
                        <input
                          type="text"
                          value={formData.bankName}
                          onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                          placeholder="e.g. HDFC Bank"
                          className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-600 uppercase mb-1">
                          Account Number
                        </label>
                        <input
                          type="text"
                          value={formData.accountNumber}
                          onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                          placeholder="Account number"
                          className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-600 uppercase mb-1">
                          IFSC Code
                        </label>
                        <input
                          type="text"
                          value={formData.ifscCode}
                          onChange={(e) =>
                            setFormData({ ...formData, ifscCode: e.target.value.toUpperCase() })
                          }
                          placeholder="e.g. HDFC0001234"
                          className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-600 uppercase mb-1">
                          Base Monthly Salary (₹)
                        </label>
                        <input
                          type="number"
                          value={formData.basicSalary}
                          onChange={(e) => setFormData({ ...formData, basicSalary: e.target.value })}
                          placeholder="e.g. 50000"
                          className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* -------------------------------------------------------------
                  STEP 5: MOBILE LOGIN / ACCOUNT
                  ------------------------------------------------------------- */}
              {currentStep === 5 && (
                <div className="space-y-5 animate-in fade-in-50 duration-150">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <Lock className="w-4 h-4 text-[#23C45E]" />
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wide">
                      Step 5: Employee Mobile Login & Account Setup
                    </h3>
                  </div>

                  {/* Role Boundary Notice Banner */}
                  <div className="p-4 bg-emerald-50/70 border border-emerald-200/70 rounded-2xl flex items-start gap-3">
                    <Shield className="w-5 h-5 text-[#23C45E] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-black text-emerald-950 uppercase tracking-wide">
                        Employee Mobile App Isolation
                      </h4>
                      <p className="text-[11px] text-emerald-800 font-medium mt-0.5 leading-relaxed">
                        Employee accounts are strictly provisioned for the <strong>QuickBoom Employee Mobile App</strong>. Direct access to the Company Admin Panel and Customer Portal is prohibited for this role.
                      </p>
                    </div>
                  </div>

                  {/* Allow Mobile Login Toggle */}
                  <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-black text-slate-900 block">
                        Allow Employee Mobile Login
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        Enable employee authentication using Corporate Email or Mobile Number
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.mobileLoginEnabled}
                        onChange={(e) =>
                          setFormData({ ...formData, mobileLoginEnabled: e.target.checked })
                        }
                        className="w-5 h-5 rounded text-[#23C45E] focus:ring-[#23C45E] border-slate-300 cursor-pointer accent-[#23C45E]"
                      />
                      <span className="ml-2.5 text-xs font-extrabold text-slate-800">
                        {formData.mobileLoginEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </label>
                  </div>

                  {/* Password Configuration */}
                  {formData.mobileLoginEnabled && (
                    <div className="space-y-4 p-4 bg-slate-50/60 border border-slate-200/80 rounded-2xl">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-[11px] font-extrabold text-slate-700 uppercase">
                            {drawerMode === 'create'
                              ? 'Password (Mobile App)'
                              : 'New Password'}
                          </label>
                          {drawerMode === 'edit' && (
                            <span className="text-[10px] font-bold text-slate-400">
                              Leave blank to keep existing password
                            </span>
                          )}
                        </div>

                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            placeholder={
                              drawerMode === 'create'
                                ? 'Set password (default: Password@123)'
                                : 'Enter new password or leave blank'
                            }
                            className="w-full pl-3.5 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-extrabold text-slate-700 uppercase mb-1">
                          Confirm Password
                        </label>
                        <div className="relative">
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={formData.confirmPassword}
                            onChange={(e) =>
                              setFormData({ ...formData, confirmPassword: e.target.value })
                            }
                            placeholder="Confirm password"
                            className="w-full pl-3.5 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* -------------------------------------------------------------
                  STEP 6: REVIEW & CREATE / UPDATE
                  ------------------------------------------------------------- */}
              {currentStep === 6 && (
                <div className="space-y-4 animate-in fade-in-50 duration-150">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <FileCheck className="w-4 h-4 text-[#23C45E]" />
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wide">
                      Step 6: Review & Final Confirmation
                    </h3>
                  </div>

                  <p className="text-[11px] text-slate-500 font-medium">
                    Please verify all information before committing. Click <strong>Edit</strong> on any section to make changes.
                  </p>

                  {/* Review Card 1: Personal */}
                  <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-slate-800 uppercase flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-[#23C45E]" />
                        Personal Information
                      </span>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(1)}
                        className="text-[11px] font-extrabold text-[#1AA14D] hover:underline cursor-pointer"
                      >
                        Edit
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-200/50">
                      <div>
                        <span className="text-slate-400 font-bold block text-[10px]">FULL NAME</span>
                        <span className="font-extrabold text-slate-800">
                          {formData.firstName} {formData.lastName}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold block text-[10px]">CORPORATE EMAIL</span>
                        <span className="font-bold text-slate-800">{formData.email}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold block text-[10px]">PHONE</span>
                        <span className="font-bold text-slate-800">{formData.phone || '—'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold block text-[10px]">GENDER / DOB</span>
                        <span className="font-bold text-slate-800">
                          {formData.gender} {formData.dob ? `• ${formData.dob}` : ''}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Review Card 2: Employment */}
                  <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-slate-800 uppercase flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5 text-[#23C45E]" />
                        Employment Details
                      </span>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(2)}
                        className="text-[11px] font-extrabold text-[#1AA14D] hover:underline cursor-pointer"
                      >
                        Edit
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-200/50">
                      <div>
                        <span className="text-slate-400 font-bold block text-[10px]">EMPLOYEE ID</span>
                        <span className="font-mono font-black text-[#1AA14D]">
                          {drawerMode === 'create'
                            ? (previewEmployeeId || '—')
                            : formData.employeeCode}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold block text-[10px]">JOINING DATE</span>
                        <span className="font-bold text-slate-800">{formData.joiningDate}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold block text-[10px]">EMPLOYEE TYPE</span>
                        <span className="font-extrabold text-[#1AA14D]">
                          {formData.employeeType === 'FREELANCER' ? 'Freelancer' : 'In-House Employee'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold block text-[10px]">EMPLOYMENT TYPE</span>
                        <span className="font-bold text-slate-800">{formData.employmentType}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold block text-[10px]">STATUS</span>
                        <span
                          className={`font-black px-2 py-0.5 rounded text-[10px] inline-block ${
                            formData.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {formData.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Review Card 3: Organization */}
                  <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-slate-800 uppercase flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-[#23C45E]" />
                        Organization & Work Setup
                      </span>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(3)}
                        className="text-[11px] font-extrabold text-[#1AA14D] hover:underline cursor-pointer"
                      >
                        Edit
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-200/50">
                      <div>
                        <span className="text-slate-400 font-bold block text-[10px]">OFFICE / BRANCH</span>
                        <span className="font-extrabold text-slate-800">{formData.branch}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold block text-[10px]">DEPARTMENT</span>
                        <span className="font-bold text-slate-800">{formData.departmentName}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold block text-[10px]">DESIGNATION</span>
                        <span className="font-bold text-slate-800">{formData.designationName}</span>
                      </div>
                    </div>
                  </div>

                  {/* Review Card 4: Emergency & Identity */}
                  <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-slate-800 uppercase flex items-center gap-1.5">
                        <HeartHandshake className="w-3.5 h-3.5 text-[#23C45E]" />
                        Emergency & Identification
                      </span>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(4)}
                        className="text-[11px] font-extrabold text-[#1AA14D] hover:underline cursor-pointer"
                      >
                        Edit
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-200/50">
                      <div>
                        <span className="text-slate-400 font-bold block text-[10px]">EMERGENCY CONTACT</span>
                        <span className="font-bold text-slate-800">
                          {formData.emergencyName
                            ? `${formData.emergencyName} (${formData.emergencyRelationship}) - ${formData.emergencyPhone || ''}`
                            : '—'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold block text-[10px]">PAN / AADHAAR</span>
                        <span className="font-mono font-bold text-slate-800">
                          {formData.panNumber || '—'} / {maskValue(formData.aadhaarNumber, 4)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold block text-[10px]">BANK ACCOUNT</span>
                        <span className="font-mono font-bold text-slate-800">
                          {formData.bankName ? `${formData.bankName} • ${maskValue(formData.accountNumber, 4)}` : '—'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Review Card 5: Mobile Login */}
                  <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-slate-800 uppercase flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-[#23C45E]" />
                        Mobile Login & Account
                      </span>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(5)}
                        className="text-[11px] font-extrabold text-[#1AA14D] hover:underline cursor-pointer"
                      >
                        Edit
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-200/50">
                      <div>
                        <span className="text-slate-400 font-bold block text-[10px]">MOBILE LOGIN STATUS</span>
                        <span
                          className={`font-black px-2 py-0.5 rounded text-[10px] inline-block ${
                            formData.mobileLoginEnabled
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {formData.mobileLoginEnabled ? 'Allowed (Enabled)' : 'Disabled'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold block text-[10px]">LOGIN CREDENTIALS</span>
                        <span className="font-bold text-slate-800">
                          Password: <span className="font-mono text-slate-600">••••••••</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Footer Actions (Wizard Navigation) */}
            <div className="p-4 border-t border-slate-100 bg-white flex items-center justify-between gap-3 shrink-0">
              {/* Left actions */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormDrawerOpen(false)}
                  disabled={saveEmployeeMutation.isPending}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>

                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    disabled={saveEmployeeMutation.isPending}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </button>
                )}
              </div>

              {/* Right actions */}
              <div>
                {currentStep < 6 ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="flex items-center gap-2 px-6 py-2.5 bg-[#23C45E] hover:bg-[#1AA14D] text-white rounded-xl font-extrabold text-xs transition-all shadow-md shadow-[#23C45E]/20 cursor-pointer"
                  >
                    <span>Next Step</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleFinalSubmit}
                    disabled={saveEmployeeMutation.isPending}
                    className="flex items-center gap-2 px-6 py-2.5 bg-[#23C45E] hover:bg-[#1AA14D] text-white rounded-xl font-extrabold text-xs transition-all shadow-md shadow-[#23C45E]/20 cursor-pointer disabled:opacity-50"
                  >
                    {saveEmployeeMutation.isPending ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    <span>
                      {drawerMode === 'create' ? 'Create Employee' : 'Update Employee'}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. DELETE CONFIRMATION MODAL */}
      {deleteConfirmEmp && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => !deleteEmployeeMutation.isPending && setDeleteConfirmEmp(null)}
          />
          <div className="relative bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl z-10 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-black text-slate-900">
                Delete Employee?
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Are you sure you want to permanently delete{' '}
                <strong className="text-slate-800 font-bold">
                  {deleteConfirmEmp.name} ({deleteConfirmEmp.employeeCode})
                </strong>
                ? All employee records and assignments will be permanently deleted and cannot be recovered.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={deleteEmployeeMutation.isPending}
                onClick={() => setDeleteConfirmEmp(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={deleteEmployeeMutation.isPending}
                onClick={() => deleteEmployeeMutation.mutate(deleteConfirmEmp.id)}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-extrabold text-xs transition-all shadow-md shadow-rose-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {deleteEmployeeMutation.isPending ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                <span>Delete Permanently</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* 8. QUICK ADD DEPARTMENT MODAL */}
      {quickDeptModalOpen && (
        <div className="fixed inset-0 z-60 overflow-hidden flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => !isQuickDeptSubmitting && setQuickDeptModalOpen(false)}
          />
          <div className="relative bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl z-10 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Building2 className="w-5 h-5 text-[#23C45E]" />
              <div>
                <h3 className="text-base font-black text-slate-900">Add New Department</h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  Directly create a master department and link to this employee
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase mb-1">
                  Department Name *
                </label>
                <input
                  type="text"
                  required
                  value={quickDeptName}
                  onChange={(e) => setQuickDeptName(e.target.value)}
                  placeholder="e.g. Quality Assurance"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase mb-1">
                  Department Code (Optional)
                </label>
                <input
                  type="text"
                  value={quickDeptCode}
                  onChange={(e) => setQuickDeptCode(e.target.value.toUpperCase())}
                  placeholder="QA (Auto-generated if empty)"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isQuickDeptSubmitting}
                onClick={() => setQuickDeptModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isQuickDeptSubmitting}
                onClick={handleQuickAddDepartment}
                className="px-5 py-2 bg-[#23C45E] hover:bg-[#1AA14D] text-white rounded-xl font-extrabold text-xs transition-all shadow-md shadow-[#23C45E]/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isQuickDeptSubmitting ? (
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Plus className="w-3.5 h-3.5" />
                )}
                <span>Save Department</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. QUICK ADD DESIGNATION MODAL */}
      {quickDesigModalOpen && (
        <div className="fixed inset-0 z-60 overflow-hidden flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => !isQuickDesigSubmitting && setQuickDesigModalOpen(false)}
          />
          <div className="relative bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl z-10 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Award className="w-5 h-5 text-[#23C45E]" />
              <div>
                <h3 className="text-base font-black text-slate-900">Add New Designation</h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  Directly create a master designation and link to this employee
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase mb-1">
                  Designation Title *
                </label>
                <input
                  type="text"
                  required
                  value={quickDesigName}
                  onChange={(e) => setQuickDesigName(e.target.value)}
                  placeholder="e.g. QA Automation Specialist"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase mb-1">
                  Designation Code (Optional)
                </label>
                <input
                  type="text"
                  value={quickDesigCode}
                  onChange={(e) => setQuickDesigCode(e.target.value.toUpperCase())}
                  placeholder="QA-AUTO (Auto-generated if empty)"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isQuickDesigSubmitting}
                onClick={() => setQuickDesigModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isQuickDesigSubmitting}
                onClick={handleQuickAddDesignation}
                className="px-5 py-2 bg-[#23C45E] hover:bg-[#1AA14D] text-white rounded-xl font-extrabold text-xs transition-all shadow-md shadow-[#23C45E]/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isQuickDesigSubmitting ? (
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Plus className="w-3.5 h-3.5" />
                )}
                <span>Save Designation</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 10. QUICK ADD OFFICE MODAL */}
      {quickOfficeModalOpen && (
        <div className="fixed inset-0 z-60 overflow-hidden flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => !isQuickOfficeSubmitting && setQuickOfficeModalOpen(false)}
          />
          <div className="relative bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl z-10 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <MapPin className="w-5 h-5 text-[#23C45E]" />
              <div>
                <h3 className="text-base font-black text-slate-900">Add Office Geofence</h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  Create a new physical office location with GPS attendance radius
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase mb-1">
                  Office Name *
                </label>
                <input
                  type="text"
                  required
                  value={quickOfficeName}
                  onChange={(e) => setQuickOfficeName(e.target.value)}
                  placeholder="e.g. Pune Regional Hub"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={quickOfficeCity}
                  onChange={(e) => setQuickOfficeCity(e.target.value)}
                  placeholder="e.g. Pune"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 uppercase mb-1">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={quickOfficeLat}
                    onChange={(e) => setQuickOfficeLat(e.target.value)}
                    placeholder="18.5204"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 uppercase mb-1">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={quickOfficeLng}
                    onChange={(e) => setQuickOfficeLng(e.target.value)}
                    placeholder="73.8567"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase mb-1">
                  Allowed Attendance Radius (Meters)
                </label>
                <input
                  type="number"
                  value={quickOfficeRadius}
                  onChange={(e) => setQuickOfficeRadius(e.target.value)}
                  placeholder="200"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isQuickOfficeSubmitting}
                onClick={() => setQuickOfficeModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isQuickOfficeSubmitting}
                onClick={handleQuickAddOffice}
                className="px-5 py-2 bg-[#23C45E] hover:bg-[#1AA14D] text-white rounded-xl font-extrabold text-xs transition-all shadow-md shadow-[#23C45E]/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isQuickOfficeSubmitting ? (
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Plus className="w-3.5 h-3.5" />
                )}
                <span>Save Office Location</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Employee Module Permissions Override Modal */}
      {permEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-2xl overflow-hidden animate-scale-in">
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shadow-sm">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    Module Access Permissions
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold border border-slate-200">
                      {(permEmployee as any)?.role?.replace(/_/g, ' ') || permEmployee.designation || 'Employee'}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Configure role-override permissions for <strong className="text-slate-800">{permEmployee.name || permEmployee.firstName}</strong> ({permEmployee.employeeId || 'ID'})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPermEmployee(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 max-h-[65vh] overflow-y-auto space-y-4">
              {isPermLoading ? (
                <div className="py-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
                  <div className="w-8 h-8 border-3 border-emerald-500/20 border-t-emerald-600 rounded-full animate-spin" />
                  <p className="text-xs font-semibold text-slate-500">Loading module permissions...</p>
                </div>
              ) : permModules.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No standard work modules found.
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-3.5 bg-amber-50/70 border border-amber-200/60 rounded-2xl flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
                      <strong>Permission Priority:</strong> Employee Override (<code className="font-bold">ALLOW</code> / <code className="font-bold">DENY</code>) overrides the default Role-level permission. Choosing <code className="font-bold">DEFAULT</code> inherits whatever the role currently permits.
                    </p>
                  </div>

                  <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-2xl overflow-hidden bg-white">
                    {permModules.map((mod: any) => {
                      const currentOverride = permOverrides[mod.moduleKey] || 'DEFAULT';
                      const effectiveAllowed =
                        currentOverride === 'ALLOW'
                          ? true
                          : currentOverride === 'DENY'
                          ? false
                          : !!mod.roleAllowed;

                      return (
                        <div key={mod.moduleKey} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-slate-800">{mod.label}</span>
                              <span className="text-[10px] font-semibold text-slate-400 font-mono">({mod.moduleKey})</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[11px] text-slate-500">
                                Base Role: <strong className={mod.roleAllowed ? 'text-emerald-600' : 'text-slate-500'}>{mod.roleAllowed ? 'Allowed' : 'Not Allowed'}</strong>
                              </span>
                              <span className="text-slate-300">•</span>
                              <span className="text-[11px] text-slate-500">
                                Effective: <span className={`inline-flex items-center px-1.5 py-0.2 rounded font-bold text-[10px] ${effectiveAllowed ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                  {effectiveAllowed ? 'ACTIVE ACCESS' : 'BLOCKED'}
                                </span>
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 bg-slate-100 p-1 rounded-xl border border-slate-200">
                            {(['DEFAULT', 'ALLOW', 'DENY'] as const).map((opt) => {
                              const active = currentOverride === opt;
                              let btnClass = 'text-slate-600 hover:text-slate-900';
                              if (active) {
                                if (opt === 'DEFAULT') btnClass = 'bg-white text-slate-800 shadow-sm font-bold border border-slate-200';
                                if (opt === 'ALLOW') btnClass = 'bg-emerald-600 text-white shadow-sm font-bold';
                                if (opt === 'DENY') btnClass = 'bg-rose-600 text-white shadow-sm font-bold';
                              }
                              return (
                                <button
                                  key={opt}
                                  type="button"
                                  onClick={() => setPermOverrides(prev => ({ ...prev, [mod.moduleKey]: opt }))}
                                  className={`px-3 py-1 text-xs rounded-lg transition-all cursor-pointer ${btnClass}`}
                                >
                                  {opt === 'DEFAULT' ? 'Default' : opt === 'ALLOW' ? 'Allow' : 'Deny'}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isPermSaving}
                onClick={() => setPermEmployee(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-100 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isPermSaving || isPermLoading}
                onClick={handleSaveEmployeePermissions}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isPermSaving ? (
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>Save Permissions</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
