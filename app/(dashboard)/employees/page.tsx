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
  Filter,
  Lock,
  DollarSign,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

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
  department: string;
  designation: string;
  branch: string;
  office: string;
  employmentType: string;
  address: string | null;
  status: 'ACTIVE' | 'INACTIVE';
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
  const [activeFormTab, setActiveFormTab] = useState<FormTab>('personal');
  const [activeDetailsTab, setActiveDetailsTab] = useState<FormTab>('personal');

  // Masking toggles for sensitive data
  const [showAadhaar, setShowAadhaar] = useState(false);
  const [showPan, setShowPan] = useState(false);
  const [showAccount, setShowAccount] = useState(false);

  // Form state structured into 6 distinct sections
  const [formData, setFormData] = useState({
    // 1. Personal Details
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    gender: 'Male',
    dob: '',
    address: '',

    // 2. Employment Details
    employeeCode: '',
    joiningDate: new Date().toISOString().split('T')[0],
    employmentType: 'FULL_TIME',
    status: 'ACTIVE',
    managerId: '',

    // 3. Government / Identity Details
    panNumber: '',
    aadhaarNumber: '',

    // 4. Emergency Contact
    emergencyName: '',
    emergencyRelationship: 'Spouse',
    emergencyPhone: '',

    // 5. Bank & Payroll Details
    bankName: '',
    accountHolderName: '',
    accountNumber: '',
    ifscCode: '',
    basicSalary: '',

    // 6. Work Configuration
    branch: 'Head Office',
    departmentName: 'Engineering & IT',
    designationName: 'Software Engineer',
  });

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  // 1. Fetch Real Offices for Filter & Form
  const { data: officesData } = useQuery({
    queryKey: ['admin-hrm-offices'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/employees/hrm/offices');
        return Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      } catch {
        return [];
      }
    },
  });

  // 2. Fetch Employee Master Records with server-side filters & pagination (NO attendance/leave APIs called)
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
        return res?.data || res || {};
      } catch {
        return {};
      }
    },
  });

  const rawList = Array.isArray(employeesRes?.items)
    ? employeesRes.items
    : Array.isArray(employeesRes?.data)
    ? employeesRes.data
    : Array.isArray(employeesRes)
    ? employeesRes
    : [];

  const pagination = employeesRes?.pagination || {
    page: employeesRes?.page || page,
    limit: employeesRes?.limit || limit,
    total: employeesRes?.total || rawList.length,
    totalPages: employeesRes?.totalPages || Math.ceil((employeesRes?.total || rawList.length) / limit) || 1,
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
        employeeId: e.employeeCode || e.employeeId || `EMP-${e.id}`,
        employeeCode: e.employeeCode || e.employeeId || `EMP-${e.id}`,
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
        address: e.address || null,
        status: e.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
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

  // Client-side filtering for department, designation, and employment type
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      if (departmentFilter !== 'ALL' && emp.department !== departmentFilter) return false;
      if (designationFilter !== 'ALL' && emp.designation !== designationFilter) return false;
      if (typeFilter !== 'ALL' && emp.employmentType !== typeFilter) return false;
      return true;
    });
  }, [employees, departmentFilter, designationFilter, typeFilter]);

  // Summary statistics (ONLY Master data counts)
  const totalCount = employees.length;
  const activeCount = employees.filter((e) => e.status === 'ACTIVE').length;
  const inactiveCount = employees.filter((e) => e.status === 'INACTIVE').length;

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

  // Save / Update mutation
  const saveEmployeeMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone || undefined,
        gender: formData.gender,
        dob: formData.dob || undefined,
        address: formData.address || undefined,
        joiningDate: formData.joiningDate || undefined,
        employmentType: formData.employmentType,
        status: formData.status,
        branch: formData.branch,
        departmentName: formData.departmentName,
        designationName: formData.designationName,
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
        const createPayload = {
          ...payload,
          employeeCode: autoGenerateId ? undefined : formData.employeeCode,
          autoGenerateCode: autoGenerateId,
        };
        return api.post('/employees', createPayload);
      } else {
        if (!selectedEmployee) return;
        return api.patch(`/employees/${selectedEmployee.id}`, payload);
      }
    },
    onSuccess: () => {
      toast.success(
        drawerMode === 'create'
          ? 'Employee master profile created successfully'
          : 'Employee master profile updated successfully'
      );
      setIsFormDrawerOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-employees'] });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Failed to save employee profile';
      toast.error(typeof msg === 'string' ? msg : 'Validation error');
    },
  });

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

  // Employee ID Auto-generation state
  const [autoGenerateId, setAutoGenerateId] = useState(true);
  const [isFetchingNextId, setIsFetchingNextId] = useState(false);

  const handleFetchNextId = async () => {
    setIsFetchingNextId(true);
    try {
      const res: any = await api.get('/employees/next-id');
      const nextId = res?.nextEmployeeId || res?.data?.nextEmployeeId || 'QB0001';
      setFormData((prev) => ({ ...prev, employeeCode: nextId }));
    } catch {
      // Fallback
    } finally {
      setIsFetchingNextId(false);
    }
  };

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
    setAutoGenerateId(true);
    setDrawerMode('create');
    setSelectedEmployee(null);
    setActiveFormTab('personal');
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      gender: 'Male',
      dob: '',
      address: '',
      employeeCode: 'QB0001',
      joiningDate: new Date().toISOString().split('T')[0],
      employmentType: 'FULL_TIME',
      status: 'ACTIVE',
      managerId: '',
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
      branch: officesList[0] || 'Head Office',
      departmentName: departmentsList[0] || 'Engineering & IT',
      designationName: designationsList[0] || 'Software Engineer',
    });
    handleFetchNextId();
    setIsDetailsDrawerOpen(false);
    setIsFormDrawerOpen(true);
  };

  const handleOpenEdit = (emp: EmployeeMaster) => {
    setDrawerMode('edit');
    setSelectedEmployee(emp);
    setActiveFormTab('personal');

    const em = typeof emp.emergencyContact === 'object' ? emp.emergencyContact : null;
    const bk = emp.bankDetails || null;
    const docs = emp.documents || null;

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
      status: emp.status,
      managerId: emp.managerId ? String(emp.managerId) : '',
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
      branch: emp.branch || 'Head Office',
      departmentName: emp.department || 'Engineering & IT',
      designationName: emp.designation || 'Software Engineer',
    });
    setIsDetailsDrawerOpen(false);
    setIsFormDrawerOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName.trim() || !formData.email.trim()) {
      toast.error('First name and email are required');
      setActiveFormTab('personal');
      return;
    }
    if (!formData.employeeCode.trim()) {
      toast.error('Employee Code / ID is required');
      setActiveFormTab('employment');
      return;
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

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-16 text-slate-800">
      {/* =========================================================================
          1. PAGE HEADER
          ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Employees
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-extrabold">
              Master Roster
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Manage employee profiles and organizational information.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2.5 bg-white hover:bg-slate-50 text-slate-600 rounded-xl border border-slate-200/80 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh employees"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin text-[#23C45E]' : ''}`} />
          </button>

          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#23C45E] hover:bg-[#1AA14D] text-white rounded-xl text-xs font-extrabold shadow-md shadow-[#23C45E]/20 transition-all cursor-pointer group active:scale-[0.98]"
          >
            <UserPlus className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span>+ Add Employee</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          2. SUMMARY KPI CARDS (Only Employee Master Statistics)
          ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Employees */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase font-extrabold tracking-wider text-slate-400">
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
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase font-extrabold tracking-wider text-slate-400">
              Active Employees
            </span>
            <p className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">
              {isLoading ? '...' : activeCount}
            </p>
            <span className="text-xs font-bold text-emerald-700/80 mt-0.5 block">
              Authorized organizational staff
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Inactive Employees */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase font-extrabold tracking-wider text-slate-400">
              Inactive Employees
            </span>
            <p className="text-2xl sm:text-3xl font-black text-slate-500 mt-1">
              {isLoading ? '...' : inactiveCount}
            </p>
            <span className="text-xs font-bold text-slate-400 mt-0.5 block">
              Deactivated or archived accounts
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center">
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
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Office</th>
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
                              {emp.employeeCode}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 2. Contact */}
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
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-extrabold uppercase tracking-wider">
                          {emp.employmentType.replace('_', ' ')}
                        </span>
                      </td>

                      {/* 7. Joining Date */}
                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        {emp.joiningDate}
                      </td>

                      {/* 8. Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold ${
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

        {/* Table Footer with Pagination Controls */}
        <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-bold">
          <div className="flex items-center gap-2">
            <span>
              Showing {filteredEmployees.length} of {pagination.total} employees
            </span>
            <span className="text-slate-300">•</span>
            <span>Active: {activeCount}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 font-bold">
              Page {pagination.page} of {Math.max(1, pagination.totalPages)}
            </span>

            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={pagination.page <= 1 || isLoading}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-bold hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>

            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={pagination.page >= pagination.totalPages || isLoading}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-bold hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
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
                      {selectedEmployee.employeeCode}
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
                      <p className="font-mono font-black text-slate-900 mt-1">{selectedEmployee.employeeCode}</p>
                    </div>
                    <div className="p-3.5 bg-slate-50 rounded-xl">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Joining Date</span>
                      <p className="font-extrabold text-slate-900 mt-1 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {selectedEmployee.joiningDate}
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
          6. RIGHT-SIDE DRAWER: ADD / EDIT EMPLOYEE MASTER FORM (6 SECTIONS)
          ========================================================================= */}
      {isFormDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsFormDrawerOpen(false)}
          />

          {/* Form Drawer Container */}
          <div className="relative w-full max-w-xl bg-white shadow-2xl z-10 flex flex-col h-full overflow-hidden animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
              <div>
                <h2 className="text-base font-black text-slate-900">
                  {drawerMode === 'create' ? 'Add Employee Master' : 'Edit Employee Master'}
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Complete workforce profile & organizational setup.
                </p>
              </div>

              <button
                onClick={() => setIsFormDrawerOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 6 Section Form Tabs */}
            <div className="flex items-center border-b border-slate-100 bg-white px-4 overflow-x-auto no-scrollbar shrink-0">
              {TAB_ITEMS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeFormTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveFormTab(tab.id)}
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

            {/* Form Fields Body */}
            <form onSubmit={handleFormSubmit} className="flex-1 flex flex-col overflow-hidden">
              <div className="p-6 space-y-5 flex-1 overflow-y-auto text-xs">
                {/* 1. PERSONAL DETAILS */}
                {activeFormTab === 'personal' && (
                  <div className="space-y-4">
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

                {/* 2. EMPLOYMENT DETAILS */}
                {activeFormTab === 'employment' && (
                  <div className="space-y-4">
                    {/* Employee ID Master Block */}
                    <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <label className="text-[11px] font-extrabold text-slate-700 uppercase">
                            Employee ID *
                          </label>
                          {(drawerMode === 'create' && autoGenerateId) && (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-black uppercase">
                              Auto-generated
                            </span>
                          )}
                          {drawerMode === 'edit' && (
                            <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded-full text-[10px] font-black uppercase">
                              Read-only
                            </span>
                          )}
                        </div>

                        {drawerMode === 'create' && (
                          <button
                            type="button"
                            onClick={handleFetchNextId}
                            disabled={isFetchingNextId}
                            className="flex items-center gap-1 text-[11px] font-extrabold text-[#1AA14D] hover:text-emerald-800 transition-colors cursor-pointer disabled:opacity-50"
                            title="Preview next sequential Employee ID from backend"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${isFetchingNextId ? 'animate-spin' : ''}`} />
                            <span>Generate Next ID</span>
                          </button>
                        )}
                      </div>

                      <input
                        type="text"
                        required
                        disabled={drawerMode === 'edit' || (drawerMode === 'create' && autoGenerateId)}
                        value={formData.employeeCode}
                        onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value })}
                        placeholder="e.g. QB0001"
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#23C45E] disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                      />

                      {drawerMode === 'create' && (
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer pt-1 select-none">
                          <input
                            type="checkbox"
                            checked={autoGenerateId}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setAutoGenerateId(checked);
                              if (checked) {
                                handleFetchNextId();
                              }
                            }}
                            className="w-4 h-4 rounded text-[#23C45E] focus:ring-[#23C45E] border-slate-300 cursor-pointer accent-[#23C45E]"
                          />
                          <span>Auto Generate Employee ID</span>
                        </label>
                      )}
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

                {/* 3. GOVERNMENT / IDENTITY DETAILS */}
                {activeFormTab === 'identity' && (
                  <div className="space-y-4">
                    <div className="p-3 bg-amber-50/60 border border-amber-200/60 rounded-xl flex items-center gap-2 text-amber-800 text-[11px] font-bold">
                      <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Confidential compliance data. Stored securely.</span>
                    </div>

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
                        onChange={(e) => setFormData({ ...formData, panNumber: e.target.value.toUpperCase() })}
                        placeholder="10-character PAN (e.g. ABCDE1234F)"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#23C45E] focus:bg-white"
                      />
                    </div>
                  </div>
                )}

                {/* 4. EMERGENCY CONTACT */}
                {activeFormTab === 'emergency' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-extrabold text-slate-700 uppercase mb-1">
                        Emergency Contact Person
                      </label>
                      <input
                        type="text"
                        value={formData.emergencyName}
                        onChange={(e) => setFormData({ ...formData, emergencyName: e.target.value })}
                        placeholder="Full name of emergency contact"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#23C45E] focus:bg-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-extrabold text-slate-700 uppercase mb-1">
                          Relationship
                        </label>
                        <select
                          value={formData.emergencyRelationship}
                          onChange={(e) => setFormData({ ...formData, emergencyRelationship: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
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
                        <label className="block text-[11px] font-extrabold text-slate-700 uppercase mb-1">
                          Emergency Phone
                        </label>
                        <input
                          type="tel"
                          value={formData.emergencyPhone}
                          onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                          placeholder="e.g. +91 98765 00000"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#23C45E] focus:bg-white"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. BANK & PAYROLL DETAILS */}
                {activeFormTab === 'bank' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-extrabold text-slate-700 uppercase mb-1">
                          Bank Name
                        </label>
                        <input
                          type="text"
                          value={formData.bankName}
                          onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                          placeholder="e.g. HDFC Bank"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#23C45E] focus:bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-extrabold text-slate-700 uppercase mb-1">
                          Account Holder Name
                        </label>
                        <input
                          type="text"
                          value={formData.accountHolderName}
                          onChange={(e) => setFormData({ ...formData, accountHolderName: e.target.value })}
                          placeholder="As per bank passbook"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#23C45E] focus:bg-white"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="block text-[11px] font-extrabold text-slate-700 uppercase mb-1">
                          Bank Account Number
                        </label>
                        <input
                          type="text"
                          value={formData.accountNumber}
                          onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                          placeholder="Account number"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#23C45E] focus:bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-extrabold text-slate-700 uppercase mb-1">
                          IFSC Code
                        </label>
                        <input
                          type="text"
                          value={formData.ifscCode}
                          onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value.toUpperCase() })}
                          placeholder="e.g. HDFC0001234"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#23C45E] focus:bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-extrabold text-slate-700 uppercase mb-1">
                          Base Salary (₹ / Mo)
                        </label>
                        <input
                          type="number"
                          value={formData.basicSalary}
                          onChange={(e) => setFormData({ ...formData, basicSalary: e.target.value })}
                          placeholder="e.g. 50000"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#23C45E] focus:bg-white"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 6. WORK CONFIGURATION & ORGANIZATION */}
                {activeFormTab === 'work' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-extrabold text-slate-700 uppercase mb-1">
                        Assigned Office / Branch *
                      </label>
                      <select
                        value={formData.branch}
                        onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
                      >
                        {officesList.map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-extrabold text-slate-700 uppercase mb-1">
                          Department *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.departmentName}
                          onChange={(e) => setFormData({ ...formData, departmentName: e.target.value })}
                          placeholder="e.g. Engineering & IT"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-extrabold text-slate-700 uppercase mb-1">
                          Designation *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.designationName}
                          onChange={(e) =>
                            setFormData({ ...formData, designationName: e.target.value })
                          }
                          placeholder="e.g. Software Engineer"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Drawer Footer Actions */}
              <div className="p-4 border-t border-slate-100 bg-white flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-bold">
                  <span>* Required fields</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsFormDrawerOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saveEmployeeMutation.isPending}
                    className="px-6 py-2.5 bg-[#23C45E] hover:bg-[#1AA14D] text-white rounded-xl font-extrabold text-xs transition-all shadow-md shadow-[#23C45E]/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {saveEmployeeMutation.isPending ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    <span>{drawerMode === 'create' ? 'Save Employee' : 'Update Profile'}</span>
                  </button>
                </div>
              </div>
            </form>
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
                Delete Employee Profile?
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Are you sure you want to delete{' '}
                <strong className="text-slate-800 font-bold">
                  {deleteConfirmEmp.name} ({deleteConfirmEmp.employeeCode})
                </strong>
                ? This will remove the employee profile and unassign linked active directories.
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
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
