'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Database,
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Lock,
  UserX,
  History,
  Search,
  CheckCircle2,
  Layers,
  Users,
  Building2,
  Clock,
  Briefcase,
  FileSpreadsheet,
  MapPin,
  Bell,
  X,
  Check,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '@/lib/api';
import {
  AdminPageHeader,
  AdminStatCard,
  AdminCard,
  AdminButton,
  AdminStatusBadge,
  AdminSearchInput,
  AdminDataTable,
  ColumnDef,
} from '@/components/admin';

interface SummaryData {
  transactional: {
    crm: { total: number; leads: number; contacts: number; companies: number; deals: number; tasks: number };
    attendance: { total: number; attendances: number; breaks: number };
    leave: { leaveRequests: number };
    remote: { remoteRequests: number };
    visits: { visits: number };
    payroll: { total: number; payrolls: number; salarySlips: number };
    notifications: { notifications: number };
    location: { locationLogs: number };
  };
  masterDataProtected: {
    employees: number;
    departments: number;
    designations: number;
    users: number;
  };
  lastReset: string | null;
}

interface ResetLog {
  id: string;
  module: string;
  details: any;
  performedBy: string;
  performedByEmail: string;
  timestamp: string;
  ipAddress: string;
}

interface EmployeeSummary {
  employee: {
    id: string;
    employeeCode: string;
    name: string;
    email: string;
    phone: string;
    department: string;
    designation: string;
    status: string;
    joiningDate?: string;
  };
  counts: {
    attendance: number;
    attendances: number;
    breaks: number;
    leave: number;
    remote: number;
    visits: number;
    payroll: number;
    location: number;
    total: number;
  };
}

export default function DataManagementPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Valid tab values — includes 'employee' alias for sidebar backward-compat
  // Valid tab values — includes 'employee' alias for sidebar backward-compat
  type TabValue = 'summary' | 'customers' | 'modules' | 'employees' | 'employee' | 'bin' | 'reset-all' | 'history';

  const getTabFromUrl = (): TabValue => {
    const raw = searchParams.get('tab') || 'summary';
    // Normalize aliases
    if (raw === 'employee') return 'employees';
    const valid: TabValue[] = ['summary', 'customers', 'modules', 'employees', 'bin', 'reset-all', 'history'];
    return valid.includes(raw as TabValue) ? (raw as TabValue) : 'summary';
  };

  const [activeTab, setActiveTab] = useState<TabValue>(getTabFromUrl);

  // Sync tab with URL query param on every navigation (sidebar clicks)
  useEffect(() => {
    const tab = getTabFromUrl();
    setActiveTab(tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Navigate to tab — updates URL so sidebar highlight stays in sync
  const goToTab = (tab: TabValue) => {
    const normalizedTab = tab === 'employee' ? 'employees' : tab;
    if (normalizedTab === 'summary') {
      router.push('/settings/data-management');
    } else {
      router.push(`/settings/data-management?tab=${normalizedTab}`);
    }
  };
  const [isLoading, setIsLoading] = useState(true);
  const [isResetting, setIsResetting] = useState(false);

  // Bin state
  const [binItems, setBinItems] = useState<{ customers: any[]; employees: any[]; totalCount: number; items?: any[] } | null>(null);
  const [isLoadingBin, setIsLoadingBin] = useState(false);
  const [binFilter, setBinFilter] = useState<'ALL' | 'CUSTOMER' | 'EMPLOYEE'>('ALL');
  const [selectedBinKeys, setSelectedBinKeys] = useState<Set<string>>(new Set());
  const [permanentDeleteTarget, setPermanentDeleteTarget] = useState<{ id: string; type: 'CUSTOMER' | 'EMPLOYEE'; name: string } | null>(null);
  const [bulkPermanentDeleteTargets, setBulkPermanentDeleteTargets] = useState<Array<{ id: string; type: 'CUSTOMER' | 'EMPLOYEE'; name: string }> | null>(null);
  const [isPermaDeleting, setIsPermaDeleting] = useState(false);
  const [restoreTarget, setRestoreTarget] = useState<{ id: string; type: 'CUSTOMER' | 'EMPLOYEE'; name: string } | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  // Customer-wise Reset state
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerSearchResults, setCustomerSearchResults] = useState<any[]>([]);
  const [isSearchingCustomers, setIsSearchingCustomers] = useState(false);
  const [isLoadingCustomerSummary, setIsLoadingCustomerSummary] = useState(false);
  const [showCustomerSearchDropdown, setShowCustomerSearchDropdown] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [isResettingCustomer, setIsResettingCustomer] = useState(false);
  const [showCustomerResetModal, setShowCustomerResetModal] = useState(false);
  const customerSearchDropdownRef = useRef<HTMLDivElement>(null);

  // Summary state – starts at zeros; filled by API on mount
  const [summary, setSummary] = useState<SummaryData>({
    transactional: {
      crm: { total: 0, leads: 0, contacts: 0, companies: 0, deals: 0, tasks: 0 },
      attendance: { total: 0, attendances: 0, breaks: 0 },
      leave: { leaveRequests: 0 },
      remote: { remoteRequests: 0 },
      visits: { visits: 0 },
      payroll: { total: 0, payrolls: 0, salarySlips: 0 },
      notifications: { notifications: 0 },
      location: { locationLogs: 0 },
    },
    masterDataProtected: {
      employees: 0,
      departments: 0,
      designations: 0,
      users: 0,
    },
    lastReset: null,
  });

  // History state
  const [history, setHistory] = useState<ResetLog[]>([]);

  // Employee search state
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [employeeSearchResults, setEmployeeSearchResults] = useState<any[]>([]);
  const [isSearchingEmployees, setIsSearchingEmployees] = useState(false);
  const [isLoadingEmployeeSummary, setIsLoadingEmployeeSummary] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeSummary | null>(null);
  const searchDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(e.target as Node)) {
        setShowSearchDropdown(false);
      }
      if (customerSearchDropdownRef.current && !customerSearchDropdownRef.current.contains(e.target as Node)) {
        setShowCustomerSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchEmployees = useCallback(async (query: string) => {
    if (!query.trim() || query.trim().length < 2) {
      setEmployeeSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }
    setIsSearchingEmployees(true);
    try {
      const res: any = await api.get('/admin/data-management/employees', {
        params: { search: query.trim(), limit: 10, page: 1 },
      }).catch(async () => {
        return api.get('/employees', {
          params: { search: query.trim(), limit: 10, page: 1, excludeAdmins: 'true' },
        });
      });
      const data = res?.data || res;
      const rawEmployees = Array.isArray(data) ? data : (data?.data || data?.employees || []);
      // Additional safety check: strictly ensure Super Admin or Admin never appears in employee list
      const employees = rawEmployees.filter((emp: any) => {
        const fullName = `${emp.firstName || ''} ${emp.lastName || ''}`.trim().toLowerCase();
        const designation = (emp.designation?.name || emp.role || '').trim().toLowerCase();
        const isSuperAdmin = fullName.includes('super admin') || designation.includes('super admin') || emp.email?.toLowerCase().includes('superadmin');
        const isAdmin = fullName === 'admin' || designation === 'admin' || emp.email?.toLowerCase() === 'admin@quickboom.com';
        return !isSuperAdmin && !isAdmin;
      });
      setEmployeeSearchResults(employees);
      setShowSearchDropdown(employees.length > 0);
    } catch {
      setEmployeeSearchResults([]);
      setShowSearchDropdown(false);
    } finally {
      setIsSearchingEmployees(false);
    }
  }, []);

  const handleSelectEmployee = async (emp: any) => {
    setShowSearchDropdown(false);
    setEmployeeSearch(`${emp.firstName} ${emp.lastName} (${emp.employeeCode || emp.empCode || ''})`);
    setIsLoadingEmployeeSummary(true);
    try {
      const res: any = await api.get(`/admin/data-management/employees/${emp.id}/summary`);
      const data = res?.data || res;
      setSelectedEmployee(data);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to load employee data';
      toast.error(msg);
      setSelectedEmployee(null);
    } finally {
      setIsLoadingEmployeeSummary(false);
    }
  };

  const handleEmployeeSearchChange = (value: string) => {
    setEmployeeSearch(value);
    if (value.trim().length >= 2) {
      searchEmployees(value);
    } else {
      setEmployeeSearchResults([]);
      setShowSearchDropdown(false);
    }
  };

  // Confirmation Modal state
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    requiredText: string;
    confirmText: string;
    onConfirm: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    description: '',
    requiredText: '',
    confirmText: '',
    onConfirm: async () => {},
  });

  const loadSummaryAndHistory = async () => {
    setIsLoading(true);
    try {
      const [sumRes, histRes]: any = await Promise.all([
        api.get('/admin/data-management/summary').catch(() => null),
        api.get('/admin/data-management/history').catch(() => []),
      ]);

      const s = sumRes?.data || sumRes;
      if (s && s.transactional) {
        setSummary(s);
      }
      const h = histRes?.data || histRes;
      if (Array.isArray(h)) {
        setHistory(h);
      }
    } catch (e) {
      // Fallback state
    } finally {
      setIsLoading(false);
    }
  };

  const searchCustomers = useCallback(async (query: string) => {
    if (!query.trim() || query.trim().length < 2) {
      setCustomerSearchResults([]);
      setShowCustomerSearchDropdown(false);
      return;
    }
    setIsSearchingCustomers(true);
    try {
      const res: any = await api.get('/admin/data-management/customers', {
        params: { search: query.trim(), limit: 10, page: 1 },
      }).catch(async () => {
        return api.get('/customers', {
          params: { search: query.trim(), limit: 10, page: 1, excludeAdmins: 'true' },
        });
      });
      const data = res?.data || res;
      const rawCustomers = Array.isArray(data) ? data : (data?.data || data?.customers || []);
      // Additional safety check: strictly ensure Super Admin or Admin never appears in customer list
      const customers = rawCustomers.filter((cust: any) => {
        const name = (cust.name || '').trim().toLowerCase();
        const company = (cust.companyName || '').trim().toLowerCase();
        const email = (cust.email || '').trim().toLowerCase();
        const isSuperAdmin = name.includes('super admin') || company.includes('super admin') || email.includes('superadmin');
        const isAdmin = name === 'admin' || company === 'admin' || email === 'admin@quickboom.com';
        return !isSuperAdmin && !isAdmin;
      });
      setCustomerSearchResults(customers);
      setShowCustomerSearchDropdown(customers.length > 0);
    } catch {
      setCustomerSearchResults([]);
    } finally {
      setIsSearchingCustomers(false);
    }
  }, []);

  const handleSelectCustomer = async (cust: any) => {
    setShowCustomerSearchDropdown(false);
    setCustomerSearch(cust.companyName || cust.name);
    setIsLoadingCustomerSummary(true);
    try {
      const res: any = await api.get(`/admin/data-management/customers/${cust.id}/summary`);
      const data = res?.data || res;
      setSelectedCustomer(data);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to load customer summary');
      setSelectedCustomer(null);
    } finally {
      setIsLoadingCustomerSummary(false);
    }
  };

  const handleCustomerSearchChange = (value: string) => {
    setCustomerSearch(value);
    if (!value) {
      setSelectedCustomer(null);
    }
    searchCustomers(value);
  };

  const handleExecuteCustomerReset = async () => {
    if (!selectedCustomer) return;
    setIsResettingCustomer(true);
    try {
      const res: any = await api.post(`/admin/data-management/customers/${selectedCustomer.customer.id}/reset`, {
        reason: 'Admin customer data reset console',
      });
      const data = res?.data || res;
      toast.success(data?.message || 'Customer application data reset successfully!');
      setShowCustomerResetModal(false);
      // Reload customer summary (counts should now be 0)
      const refreshed: any = await api.get(`/admin/data-management/customers/${selectedCustomer.customer.id}/summary`);
      setSelectedCustomer(refreshed?.data || refreshed);
      // Reload overview summary & history
      await loadSummaryAndHistory();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to reset customer data');
    } finally {
      setIsResettingCustomer(false);
    }
  };

  const loadBinItems = async () => {
    setIsLoadingBin(true);
    try {
      const res: any = await api.get('/admin/data-management/bin');
      const rawData = res?.data ?? res;
      const itemsList: any[] = Array.isArray(rawData)
        ? rawData
        : Array.isArray(rawData?.data)
        ? rawData.data
        : Array.isArray(rawData?.items)
        ? rawData.items
        : [];

      const customers = Array.isArray(rawData?.customers)
        ? rawData.customers
        : itemsList.filter((i: any) => i.type === 'CUSTOMER');
      const employees = Array.isArray(rawData?.employees)
        ? rawData.employees
        : itemsList.filter((i: any) => i.type === 'EMPLOYEE');
      const totalCount = typeof rawData?.totalCount === 'number'
        ? rawData.totalCount
        : itemsList.length;

      setBinItems({ customers, employees, totalCount, items: itemsList });

      // Synchronize selection: keep only keys that still exist in the fresh items list
      const freshKeys = new Set(itemsList.map((it: any) => `${it.type}-${it.id}`));
      setSelectedBinKeys((prev) => {
        const next = new Set<string>();
        for (const k of prev) {
          if (freshKeys.has(k)) next.add(k);
        }
        return next;
      });
    } catch {
      toast.error('Failed to load Bin items');
    } finally {
      setIsLoadingBin(false);
    }
  };

  // Derived currently displayed Bin items based on active filter
  const displayedBinItems = useMemo(() => {
    if (!binItems) return [];
    return [
      ...(binItems.customers || []).map((c: any) => ({ ...c, type: 'CUSTOMER' as const })),
      ...(binItems.employees || []).map((e: any) => ({ ...e, type: 'EMPLOYEE' as const })),
    ].filter((item) => binFilter === 'ALL' || item.type === binFilter);
  }, [binItems, binFilter]);

  const isAllSelected = displayedBinItems.length > 0 && displayedBinItems.every((item) => selectedBinKeys.has(`${item.type}-${item.id}`));
  const isSomeSelected = displayedBinItems.some((item) => selectedBinKeys.has(`${item.type}-${item.id}`)) && !isAllSelected;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedBinKeys((prev) => {
        const next = new Set(prev);
        for (const it of displayedBinItems) {
          next.delete(`${it.type}-${it.id}`);
        }
        return next;
      });
    } else {
      setSelectedBinKeys((prev) => {
        const next = new Set(prev);
        for (const it of displayedBinItems) {
          next.add(`${it.type}-${it.id}`);
        }
        return next;
      });
    }
  };

  const handleToggleSelectItem = (key: string) => {
    setSelectedBinKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  useEffect(() => {
    loadSummaryAndHistory();
  }, []);

  useEffect(() => {
    if (activeTab === 'bin') {
      loadBinItems();
    }
  }, [activeTab]);

  const openConfirmModal = (
    title: string,
    description: string,
    requiredText: string,
    onConfirmAction: () => Promise<void>
  ) => {
    setModalState({
      isOpen: true,
      title,
      description,
      requiredText,
      confirmText: '',
      onConfirm: onConfirmAction,
    });
  };

  const handleExecuteModalConfirm = async () => {
    if (modalState.confirmText.trim().toUpperCase() !== modalState.requiredText.trim().toUpperCase()) {
      toast.error(`Confirmation mismatch! You must type exactly: ${modalState.requiredText}`);
      return;
    }

    setIsResetting(true);
    const toastId = toast.loading('Executing database transactional reset...');

    try {
      await modalState.onConfirm();
      toast.dismiss(toastId);
      setIsResetting(false);
      setModalState((prev) => ({ ...prev, isOpen: false }));
      loadSummaryAndHistory();
    } catch (err: any) {
      toast.dismiss(toastId);
      setIsResetting(false);
      const msg = err.response?.data?.message || err.message || 'Reset failed';
      toast.error(msg);
    }
  };

  // Module Reset Action
  const handleResetModule = (moduleKey: string, moduleName: string, count: number) => {
    const requiredText = `RESET ${moduleKey.toUpperCase().replace(/-/g, ' ')}`;
    openConfirmModal(
      `Reset ${moduleName} Data`,
      `You are about to permanently delete all ${count.toLocaleString()} ${moduleName} transactional records. Master accounts, settings, and employee records will remain intact.`,
      requiredText,
      async () => {
        const res: any = await api.post('/admin/data-management/reset/module', {
          module: moduleKey,
          confirmation: requiredText,
        });
        toast.success(res?.message || `Successfully reset ${moduleName} data!`);
      }
    );
  };

  // Reset All Transactional Data Action
  const handleResetAllTransactional = () => {
    const totalRecords =
      summary.transactional.crm.total +
      summary.transactional.attendance.total +
      summary.transactional.leave.leaveRequests +
      summary.transactional.remote.remoteRequests +
      summary.transactional.visits.visits +
      summary.transactional.payroll.total +
      summary.transactional.notifications.notifications +
      summary.transactional.location.locationLogs;

    openConfirmModal(
      'Reset All Transactional Application Data',
      `WARNING: This will permanently wipe ${totalRecords.toLocaleString()} application records across CRM, Attendance, Leaves, Remote Work, Visits, Payroll, Locations, and Notifications. Master data (Employees, Roles, Subscription, Departments) is strictly protected.`,
      'RESET ALL DATA',
      async () => {
        const res: any = await api.post('/admin/data-management/reset/all', {
          scope: 'transactional',
          confirmation: 'RESET ALL DATA',
        });
        toast.success(res?.message || 'All transactional data permanently reset.');
      }
    );
  };

  // Employee-wise Module Reset Action
  const handleResetEmployeeModule = (moduleKey: string, moduleName: string, count: number) => {
    if (!selectedEmployee) return;
    const requiredText = `RESET EMPLOYEE ${moduleKey.toUpperCase()}`;
    openConfirmModal(
      `Reset ${moduleName} for ${selectedEmployee.employee.name}`,
      `You are about to permanently delete ${count} ${moduleName} records for employee ${selectedEmployee.employee.name} (${selectedEmployee.employee.employeeCode}). The employee master profile and user account will remain intact.`,
      requiredText,
      async () => {
        const res: any = await api.post(
          `/admin/data-management/employees/${selectedEmployee.employee.id}/reset/module`,
          {
            module: moduleKey,
            confirmation: requiredText,
          }
        );
        toast.success(res?.message || `Reset ${moduleName} for employee!`);
        setSelectedEmployee((prev) =>
          prev
            ? {
                ...prev,
                counts: { ...prev.counts, [moduleKey]: 0, total: prev.counts.total - count },
              }
            : null
        );
      }
    );
  };

  // Employee-wise Reset All Action
  const handleResetEmployeeAll = () => {
    if (!selectedEmployee) return;
    openConfirmModal(
      `Reset All Data for ${selectedEmployee.employee.name}`,
      `You are about to permanently delete all ${selectedEmployee.counts.total} transactional records for employee ${selectedEmployee.employee.name}. Employee profile, account credentials, department, and salary structure will remain untouched.`,
      'RESET ALL DATA FOR EMPLOYEE',
      async () => {
        const res: any = await api.post(
          `/admin/data-management/employees/${selectedEmployee.employee.id}/reset/all`,
          {
            confirmation: 'RESET ALL DATA FOR EMPLOYEE',
          }
        );
        toast.success(res?.message || 'Reset all employee transactional data!');
        setSelectedEmployee((prev) =>
          prev
            ? {
                ...prev,
                counts: {
                  attendance: 0,
                  attendances: 0,
                  breaks: 0,
                  leave: 0,
                  remote: 0,
                  visits: 0,
                  payroll: 0,
                  location: 0,
                  total: 0,
                },
              }
            : null
        );
      }
    );
  };

  const historyColumns: ColumnDef<ResetLog>[] = [
    {
      key: 'module',
      header: 'Scope / Module',
      render: (log) => (
        <div>
          <span className="font-extrabold text-slate-900">{log.module}</span>
          <span className="text-[10px] text-slate-400 block font-semibold">
            {log.details?.scope || 'DATA_RESET'}
          </span>
        </div>
      ),
    },
    {
      key: 'recordsDeleted',
      header: 'Records Deleted',
      render: (log) => (
        <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 font-extrabold text-xs">
          {log.details?.recordsDeleted ?? '0'} records
        </span>
      ),
    },
    {
      key: 'performedBy',
      header: 'Performed By',
      render: (log) => (
        <div>
          <span className="font-bold text-slate-800">{log.performedBy}</span>
          <span className="text-[10px] text-slate-400 block">{log.performedByEmail}</span>
        </div>
      ),
    },
    {
      key: 'timestamp',
      header: 'Timestamp',
      render: (log) => (
        <span className="text-slate-500 font-semibold text-[11px]">
          {new Date(log.timestamp).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      className: 'text-right',
      headerClassName: 'text-right',
      render: (log) => (
        <AdminStatusBadge status="completed" label={log.details?.status || 'SUCCESS'} />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <AdminPageHeader
        title="Data Management & Reset Console"
        description="Safely manage application data, purge transactional records module-wise or employee-wise, and audit destructive operations."
        badge={{
          text: 'ADMIN SECURITY & DATA PURGE',
          icon: Database,
          variant: 'amber',
        }}
        actions={
          <AdminButton
            variant="outline"
            icon={RefreshCw}
            loading={isLoading}
            onClick={loadSummaryAndHistory}
          >
            Refresh Counts
          </AdminButton>
        }
      />

      {/* High-Visibility Warning Banner */}
      <div className="bg-amber-500/10 border border-amber-500/30 p-4 sm:p-5 rounded-2xl flex items-start gap-3 text-amber-900">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm font-semibold space-y-1">
          <p className="font-black text-amber-950">Permanent Deletion Warning</p>
          <p className="text-amber-800/90 text-xs">
            Data reset is a destructive database transaction. Once confirmed, deleted records cannot be recovered. Master data (Employees, Departments, Designations, Users, Roles, and Subscriptions) is strictly protected and never touched by transactional resets.
          </p>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto custom-scrollbar">
        <button
          onClick={() => goToTab('summary')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'summary'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Overall Data Summary
        </button>

        <button
          onClick={() => goToTab('modules')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'modules'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Module-wise Reset
        </button>

        <button
          onClick={() => goToTab('employees')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'employees'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Employee-wise Reset
        </button>

        <button
          onClick={() => goToTab('customers')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'customers'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Customer-wise Reset
        </button>

        <button
          onClick={() => goToTab('bin')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'bin'
              ? 'bg-amber-600 text-white shadow-md'
              : 'text-amber-700 hover:bg-amber-50'
          }`}
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Bin</span>
          {binItems && binItems.totalCount > 0 && (
            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${activeTab === 'bin' ? 'bg-white/25 text-white' : 'bg-amber-100 text-amber-800'}`}>
              {binItems.totalCount}
            </span>
          )}
        </button>

        <button
          onClick={() => goToTab('reset-all')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'reset-all'
              ? 'bg-rose-600 text-white shadow-md'
              : 'text-rose-600 hover:bg-rose-50'
          }`}
        >
          Reset All Transactional Data
        </button>

        <button
          onClick={() => goToTab('history')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'history'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Audit History
        </button>
      </div>

      {/* TAB 1: OVERALL SUMMARY */}
      {activeTab === 'summary' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <AdminStatCard
              title="CRM Records"
              value={summary.transactional.crm.total.toLocaleString()}
              description={`${summary.transactional.crm.leads} Leads • ${summary.transactional.crm.contacts} Contacts`}
              icon={Briefcase}
              iconBg="blue"
            />
            <AdminStatCard
              title="Attendance Records"
              value={summary.transactional.attendance.total.toLocaleString()}
              description={`${summary.transactional.attendance.attendances} Days • ${summary.transactional.attendance.breaks} Breaks`}
              icon={Clock}
              iconBg="primary"
            />
            <AdminStatCard
              title="Leaves & Remote Requests"
              value={(summary.transactional.leave.leaveRequests + summary.transactional.remote.remoteRequests).toLocaleString()}
              description={`${summary.transactional.leave.leaveRequests} Leaves • ${summary.transactional.remote.remoteRequests} WFH`}
              icon={FileSpreadsheet}
              iconBg="purple"
            />
            <AdminStatCard
              title="Client Visits"
              value={summary.transactional.visits.visits.toLocaleString()}
              description="Logged GPS client visits"
              icon={MapPin}
              iconBg="amber"
            />
          </div>

          {/* Master Data Protection Badge */}
          <AdminCard
            title="Master Data Security Shield"
            description="The following core enterprise records are strictly protected and never deleted during transactional resets."
          >
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-[#23C45E]/30 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#23C45E] text-white flex items-center justify-center shrink-0 font-black">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xl font-black text-slate-900">{summary.masterDataProtected.employees}</p>
                  <span className="text-[11px] font-bold text-[#1AA14D] flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Protected Employees
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-[#23C45E]/30 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#23C45E] text-white flex items-center justify-center shrink-0 font-black">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xl font-black text-slate-900">{summary.masterDataProtected.departments}</p>
                  <span className="text-[11px] font-bold text-[#1AA14D] flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Departments & Units
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-[#23C45E]/30 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#23C45E] text-white flex items-center justify-center shrink-0 font-black">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xl font-black text-slate-900">{summary.masterDataProtected.designations}</p>
                  <span className="text-[11px] font-bold text-[#1AA14D] flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Designations
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-[#23C45E]/30 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#23C45E] text-white flex items-center justify-center shrink-0 font-black">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xl font-black text-slate-900">Active</p>
                  <span className="text-[11px] font-bold text-[#1AA14D] flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Subscription & Plans
                  </span>
                </div>
              </div>
            </div>
          </AdminCard>
        </div>
      )}

      {/* TAB 2: MODULE-WISE RESET */}
      {activeTab === 'modules' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* CRM Module Card */}
          <AdminCard
            title="CRM Data"
            description="Leads, Contacts, Companies, Deals, Tasks, Notes, and Reminders."
            footer={
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-900">
                  {summary.transactional.crm.total.toLocaleString()} Records
                </span>
                <AdminButton
                  variant="danger"
                  size="sm"
                  icon={Trash2}
                  disabled={summary.transactional.crm.total === 0}
                  onClick={() => handleResetModule('crm', 'CRM', summary.transactional.crm.total)}
                >
                  Reset CRM
                </AdminButton>
              </div>
            }
          >
            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Leads & Prospects</span>
                <span className="font-extrabold text-slate-900">{summary.transactional.crm.leads}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Contacts & Companies</span>
                <span className="font-extrabold text-slate-900">{summary.transactional.crm.contacts + summary.transactional.crm.companies}</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Deals & Tasks</span>
                <span className="font-extrabold text-slate-900">{summary.transactional.crm.deals + summary.transactional.crm.tasks}</span>
              </div>
            </div>
          </AdminCard>

          {/* Attendance Module Card */}
          <AdminCard
            title="Attendance & Logs"
            description="Daily punch in/out timestamps, GPS punch locations, and break sessions."
            footer={
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-900">
                  {summary.transactional.attendance.total.toLocaleString()} Records
                </span>
                <AdminButton
                  variant="danger"
                  size="sm"
                  icon={Trash2}
                  disabled={summary.transactional.attendance.total === 0}
                  onClick={() => handleResetModule('attendance', 'Attendance', summary.transactional.attendance.total)}
                >
                  Reset Attendance
                </AdminButton>
              </div>
            }
          >
            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Attendance Punches</span>
                <span className="font-extrabold text-slate-900">{summary.transactional.attendance.attendances}</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Break Durations</span>
                <span className="font-extrabold text-slate-900">{summary.transactional.attendance.breaks}</span>
              </div>
            </div>
          </AdminCard>

          {/* Leave Module Card */}
          <AdminCard
            title="Leave Requests"
            description="Employee leave applications, approvals, rejections, and attachments."
            footer={
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-900">
                  {summary.transactional.leave.leaveRequests.toLocaleString()} Records
                </span>
                <AdminButton
                  variant="danger"
                  size="sm"
                  icon={Trash2}
                  disabled={summary.transactional.leave.leaveRequests === 0}
                  onClick={() => handleResetModule('leave', 'Leave', summary.transactional.leave.leaveRequests)}
                >
                  Reset Leave
                </AdminButton>
              </div>
            }
          >
            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between py-1">
                <span>Pending & Approved Requests</span>
                <span className="font-extrabold text-slate-900">{summary.transactional.leave.leaveRequests}</span>
              </div>
            </div>
          </AdminCard>

          {/* Remote Work Card */}
          <AdminCard
            title="Remote Work (WFH)"
            description="Remote work requests, manager approvals, and duration logs."
            footer={
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-900">
                  {summary.transactional.remote.remoteRequests.toLocaleString()} Records
                </span>
                <AdminButton
                  variant="danger"
                  size="sm"
                  icon={Trash2}
                  disabled={summary.transactional.remote.remoteRequests === 0}
                  onClick={() => handleResetModule('remote', 'Remote Work', summary.transactional.remote.remoteRequests)}
                >
                  Reset Remote
                </AdminButton>
              </div>
            }
          >
            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between py-1">
                <span>Work From Home Logs</span>
                <span className="font-extrabold text-slate-900">{summary.transactional.remote.remoteRequests}</span>
              </div>
            </div>
          </AdminCard>

          {/* Client Visits Card */}
          <AdminCard
            title="Client Visits"
            description="Field staff customer visits, GPS arrival coords, and visit notes."
            footer={
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-900">
                  {summary.transactional.visits.visits.toLocaleString()} Records
                </span>
                <AdminButton
                  variant="danger"
                  size="sm"
                  icon={Trash2}
                  disabled={summary.transactional.visits.visits === 0}
                  onClick={() => handleResetModule('visits', 'Visits', summary.transactional.visits.visits)}
                >
                  Reset Visits
                </AdminButton>
              </div>
            }
          >
            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between py-1">
                <span>Completed & Scheduled Visits</span>
                <span className="font-extrabold text-slate-900">{summary.transactional.visits.visits}</span>
              </div>
            </div>
          </AdminCard>

          {/* Payroll Card */}
          <AdminCard
            title="Payroll & Salary Slips"
            description="Generated payroll batches, employee payroll line items, and salary slips."
            footer={
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-900">
                  {summary.transactional.payroll.total.toLocaleString()} Records
                </span>
                <AdminButton
                  variant="danger"
                  size="sm"
                  icon={Trash2}
                  disabled={summary.transactional.payroll.total === 0}
                  onClick={() => handleResetModule('payroll', 'Payroll', summary.transactional.payroll.total)}
                >
                  Reset Payroll
                </AdminButton>
              </div>
            }
          >
            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Monthly Payroll Cycles</span>
                <span className="font-extrabold text-slate-900">{summary.transactional.payroll.payrolls}</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Generated Salary Slips</span>
                <span className="font-extrabold text-slate-900">{summary.transactional.payroll.salarySlips}</span>
              </div>
            </div>
          </AdminCard>
        </div>
      )}

      {/* TAB 3: EMPLOYEE-WISE RESET */}
      {activeTab === 'employees' && (
        <div className="space-y-6">
          {/* Employee Search Box */}
          <AdminCard title="Select Employee for Isolated Data Purge" description="Search employee by Name, Employee Code, or Email">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1" ref={searchDropdownRef}>
                <AdminSearchInput
                  value={employeeSearch}
                  onChange={handleEmployeeSearchChange}
                  placeholder="Type employee name or EMP code (min. 2 chars)..."
                />
                {showSearchDropdown && employeeSearchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl z-30 overflow-hidden max-h-64 overflow-y-auto">
                    {employeeSearchResults.map((emp: any) => (
                      <button
                        key={emp.id}
                        onClick={() => handleSelectEmployee(emp)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left border-b border-slate-100 last:border-0"
                      >
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#23C45E] to-[#1AA14D] text-white flex items-center justify-center font-black text-xs shrink-0">
                          {(emp.firstName?.[0] || '?').toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {emp.firstName} {emp.lastName}
                          </p>
                          <p className="text-[10px] text-slate-400 font-semibold">
                            {emp.employeeCode || emp.empCode || ''} • {emp.department?.name || emp.designation?.name || ''}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <AdminButton
                variant="primary"
                loading={isSearchingEmployees || isLoadingEmployeeSummary}
                onClick={() => searchEmployees(employeeSearch)}
              >
                Search
              </AdminButton>
            </div>
          </AdminCard>

          {/* Loading skeleton while fetching employee summary */}
          {isLoadingEmployeeSummary && (
            <div className="space-y-4 animate-pulse">
              <div className="h-24 bg-slate-100 rounded-3xl" />
              <div className="grid grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => <div key={i} className="h-20 bg-slate-100 rounded-2xl" />)}
              </div>
            </div>
          )}

          {/* Empty state – prompt user to search */}
          {!isLoadingEmployeeSummary && !selectedEmployee && (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-3 text-slate-400">
              <Search className="w-10 h-10 opacity-30" />
              <p className="text-sm font-bold">Search and select an employee above</p>
              <p className="text-xs">Enter at least 2 characters to see matching employees</p>
            </div>
          )}

          {/* Selected Employee Card */}
          {!isLoadingEmployeeSummary && selectedEmployee && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#23C45E] to-[#1AA14D] text-white flex items-center justify-center font-black text-xl shadow-md shadow-[#23C45E]/20">
                    {selectedEmployee.employee.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-black text-slate-900">{selectedEmployee.employee.name}</h3>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 font-mono text-[10px] font-extrabold text-slate-700">
                        {selectedEmployee.employee.employeeCode}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-500 mt-0.5">
                      {selectedEmployee.employee.designation} • {selectedEmployee.employee.department}
                    </p>
                    <span className="text-[11px] text-slate-400 block">{selectedEmployee.employee.email}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <AdminButton
                    variant="danger"
                    size="md"
                    icon={Trash2}
                    onClick={handleResetEmployeeAll}
                  >
                    Reset All Data for Employee
                  </AdminButton>
                </div>
              </div>

              {/* Employee Transactional Data Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-black text-slate-400">Attendance & Breaks</span>
                    <p className="text-xl font-black text-slate-900 mt-0.5">
                      {selectedEmployee.counts.attendance} records
                    </p>
                  </div>
                  <AdminButton
                    variant="danger"
                    size="sm"
                    disabled={selectedEmployee.counts.attendance === 0}
                    onClick={() => handleResetEmployeeModule('attendance', 'Attendance', selectedEmployee.counts.attendance)}
                  >
                    Reset
                  </AdminButton>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-black text-slate-400">Leave Requests</span>
                    <p className="text-xl font-black text-slate-900 mt-0.5">
                      {selectedEmployee.counts.leave} records
                    </p>
                  </div>
                  <AdminButton
                    variant="danger"
                    size="sm"
                    disabled={selectedEmployee.counts.leave === 0}
                    onClick={() => handleResetEmployeeModule('leave', 'Leave', selectedEmployee.counts.leave)}
                  >
                    Reset
                  </AdminButton>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-black text-slate-400">Remote Work Logs</span>
                    <p className="text-xl font-black text-slate-900 mt-0.5">
                      {selectedEmployee.counts.remote} records
                    </p>
                  </div>
                  <AdminButton
                    variant="danger"
                    size="sm"
                    disabled={selectedEmployee.counts.remote === 0}
                    onClick={() => handleResetEmployeeModule('remote', 'Remote Work', selectedEmployee.counts.remote)}
                  >
                    Reset
                  </AdminButton>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-black text-slate-400">Client Visits</span>
                    <p className="text-xl font-black text-slate-900 mt-0.5">
                      {selectedEmployee.counts.visits} records
                    </p>
                  </div>
                  <AdminButton
                    variant="danger"
                    size="sm"
                    disabled={selectedEmployee.counts.visits === 0}
                    onClick={() => handleResetEmployeeModule('visits', 'Visits', selectedEmployee.counts.visits)}
                  >
                    Reset
                  </AdminButton>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-black text-slate-400">Salary Slips</span>
                    <p className="text-xl font-black text-slate-900 mt-0.5">
                      {selectedEmployee.counts.payroll} records
                    </p>
                  </div>
                  <AdminButton
                    variant="danger"
                    size="sm"
                    disabled={selectedEmployee.counts.payroll === 0}
                    onClick={() => handleResetEmployeeModule('payroll', 'Salary Slips', selectedEmployee.counts.payroll)}
                  >
                    Reset
                  </AdminButton>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-black text-slate-400">Location GPS Logs</span>
                    <p className="text-xl font-black text-slate-900 mt-0.5">
                      {selectedEmployee.counts.location} records
                    </p>
                  </div>
                  <AdminButton
                    variant="danger"
                    size="sm"
                    disabled={selectedEmployee.counts.location === 0}
                    onClick={() => handleResetEmployeeModule('location', 'Location Logs', selectedEmployee.counts.location)}
                  >
                    Reset
                  </AdminButton>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: RESET ALL TRANSACTIONAL DATA */}
      {activeTab === 'reset-all' && (
        <div className="bg-rose-500/10 border-2 border-rose-500/40 p-6 sm:p-8 rounded-3xl space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 font-black shadow-lg shadow-rose-600/30">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-rose-950">Purge All Transactional Customer Data</h2>
              <p className="text-xs sm:text-sm text-rose-900/90 font-medium mt-1">
                This operation permanently resets all transactional application records across all modules simultaneously in a single database transaction.
              </p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-rose-200 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-rose-950">Scope of Affected Records:</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-bold text-slate-700">
              <div className="p-3 bg-slate-50 rounded-xl">CRM Leads: {summary.transactional.crm.total}</div>
              <div className="p-3 bg-slate-50 rounded-xl">Attendance: {summary.transactional.attendance.total}</div>
              <div className="p-3 bg-slate-50 rounded-xl">Leaves: {summary.transactional.leave.leaveRequests}</div>
              <div className="p-3 bg-slate-50 rounded-xl">Visits: {summary.transactional.visits.visits}</div>
              <div className="p-3 bg-slate-50 rounded-xl">Payroll Slips: {summary.transactional.payroll.total}</div>
              <div className="p-3 bg-slate-50 rounded-xl">GPS Logs: {summary.transactional.location.locationLogs}</div>
              <div className="p-3 bg-slate-50 rounded-xl">Notifications: {summary.transactional.notifications.notifications}</div>
              <div className="p-3 bg-slate-50 rounded-xl">WFH Requests: {summary.transactional.remote.remoteRequests}</div>
            </div>
          </div>

          <div className="flex justify-end">
            <AdminButton
              variant="danger"
              size="lg"
              icon={Trash2}
              onClick={handleResetAllTransactional}
            >
              Execute Reset All Transactional Data
            </AdminButton>
          </div>
        </div>
      )}

      {/* TAB 5: RESET AUDIT HISTORY */}
      {activeTab === 'history' && (
        <AdminCard
          title="Data Reset Audit Trail"
          description="Immutable log of all data purge operations executed across the customer organization."
        >
          <AdminDataTable
            columns={historyColumns}
            data={history}
            emptyTitle="No Data Resets Executed"
            emptyDescription="All data purge actions will be automatically logged and timestamped here."
          />
        </AdminCard>
      )}

      {/* TAB: CUSTOMER-WISE RESET */}
      {activeTab === 'customers' && (
        <div className="space-y-6">
          {/* Customer Search Box */}
          <AdminCard title="Select Customer for Data Reset" description="Search customer by Company Name, Contact Name, or Email">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1" ref={customerSearchDropdownRef}>
                <AdminSearchInput
                  value={customerSearch}
                  onChange={handleCustomerSearchChange}
                  placeholder="Type customer or company name (min. 2 chars)..."
                />
                {showCustomerSearchDropdown && customerSearchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl z-30 overflow-hidden max-h-64 overflow-y-auto">
                    {customerSearchResults.map((cust: any) => (
                      <button
                        key={cust.id}
                        onClick={() => handleSelectCustomer(cust)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left border-b border-slate-100 last:border-0"
                      >
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center font-black text-xs shrink-0">
                          {(cust.companyName?.[0] || cust.name?.[0] || '?').toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {cust.companyName || cust.name}
                          </p>
                          <p className="text-[10px] text-slate-400 font-semibold truncate">
                            {cust.email || 'No email'} {cust.phone ? `• ${cust.phone}` : ''}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <AdminButton
                variant="primary"
                loading={isSearchingCustomers || isLoadingCustomerSummary}
                onClick={() => searchCustomers(customerSearch)}
              >
                Search
              </AdminButton>
            </div>
          </AdminCard>

          {/* Loading Skeleton */}
          {isLoadingCustomerSummary && (
            <div className="space-y-4 animate-pulse">
              <div className="h-24 bg-slate-100 rounded-3xl" />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-slate-100 rounded-2xl" />)}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isLoadingCustomerSummary && !selectedCustomer && (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-3 text-slate-400">
              <Search className="w-10 h-10 opacity-30" />
              <p className="text-sm font-bold">Search and select a customer above</p>
              <p className="text-xs">Enter at least 2 characters to see matching customer records</p>
            </div>
          )}

          {/* Selected Customer View */}
          {!isLoadingCustomerSummary && selectedCustomer && (
            <div className="space-y-6">
              {/* Customer Header Card */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-white flex items-center justify-center font-black text-xl shadow-md shadow-indigo-600/20">
                    {(selectedCustomer.customer.displayName || 'C').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-black text-slate-900">{selectedCustomer.customer.displayName}</h3>
                      <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-mono text-[10px] font-extrabold border border-indigo-100">
                        ID #{selectedCustomer.customer.id}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${selectedCustomer.customer.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                        {selectedCustomer.customer.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-500 mt-0.5">
                      {selectedCustomer.customer.name} {selectedCustomer.customer.companyName ? `(${selectedCustomer.customer.companyName})` : ''}
                    </p>
                    <span className="text-[11px] text-slate-400 block">
                      {selectedCustomer.customer.email || 'No email provided'} {selectedCustomer.customer.phone ? `• ${selectedCustomer.customer.phone}` : ''}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowCustomerResetModal(true)}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-xs transition-all shadow-md shadow-rose-600/20 flex items-center gap-2 cursor-pointer shrink-0"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Reset Customer Data</span>
                </button>
              </div>

              {/* Data Summary Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <AdminStatCard
                  title="CRM Records"
                  value={(selectedCustomer.transactional?.crm?.total ?? 0).toLocaleString()}
                  description={`${selectedCustomer.transactional?.crm?.leads ?? 0} Leads • ${selectedCustomer.transactional?.crm?.contacts ?? 0} Contacts`}
                  icon={Briefcase}
                  iconBg="blue"
                />
                <AdminStatCard
                  title="Attendance Records"
                  value={(selectedCustomer.transactional?.attendance?.total ?? 0).toLocaleString()}
                  description={`${selectedCustomer.transactional?.attendance?.attendances ?? 0} Shifts • ${selectedCustomer.transactional?.attendance?.breaks ?? 0} Breaks`}
                  icon={Clock}
                  iconBg="primary"
                />
                <AdminStatCard
                  title="Billing & Payroll"
                  value={((selectedCustomer.transactional?.payroll?.total ?? 0)).toLocaleString()}
                  description={`${selectedCustomer.transactional?.payroll?.payrolls ?? 0} Payrolls • ${selectedCustomer.transactional?.payroll?.salarySlips ?? 0} Slips`}
                  icon={FileSpreadsheet}
                  iconBg="purple"
                />
                <AdminStatCard
                  title="Operations & Tasks"
                  value={(selectedCustomer.transactional?.operations?.total ?? 0).toLocaleString()}
                  description={`${selectedCustomer.transactional?.operations?.works ?? 0} Works • ${selectedCustomer.transactional?.operations?.tickets ?? 0} Tickets`}
                  icon={Layers}
                  iconBg="amber"
                />
              </div>

              {/* Protected Master Data Note */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 text-xs text-slate-600">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>
                    <strong>Master Data Protected:</strong> Resetting will wipe all transactional data (CRM, attendance, payroll, tasks). The Customer account, {selectedCustomer.masterDataProtected?.employees ?? 0} employees, departments, designations, and login credentials remain completely preserved.
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB: BIN / TRASH */}
      {activeTab === 'bin' && (
        <div className="space-y-5">
          {/* Header with filter and refresh */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-amber-600" />
                Bin
                {binItems && (
                  <span className="text-xs font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                    {binItems.totalCount} item{binItems.totalCount !== 1 ? 's' : ''}
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Items in Bin can be restored or permanently deleted from the database.
              </p>
            </div>
            <button
              onClick={loadBinItems}
              disabled={isLoadingBin}
              className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingBin ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Controls Bar: Type Filter + Select All Checkbox */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            {/* Type Filter */}
            <div className="flex items-center gap-2">
              {(['ALL', 'CUSTOMER', 'EMPLOYEE'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setBinFilter(f)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    binFilter === f
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {f === 'ALL' ? 'All' : f === 'CUSTOMER' ? 'Customers' : 'Employees'}
                  {binItems && (
                    <span className="ml-1 opacity-70">
                      ({f === 'ALL' ? binItems.totalCount : f === 'CUSTOMER' ? (binItems.customers?.length || 0) : (binItems.employees?.length || 0)})
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Select All Checkbox */}
            {displayedBinItems.length > 0 && (
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer select-none px-2.5 py-1.5 hover:bg-slate-100 rounded-xl transition-colors">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = isSomeSelected;
                  }}
                  onChange={handleToggleSelectAll}
                  className="w-4 h-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer accent-rose-600"
                />
                <span>Select All ({displayedBinItems.length})</span>
              </label>
            )}
          </div>

          {/* Bulk Action Bar when items selected */}
          {selectedBinKeys.size > 0 && (
            <div className="flex items-center justify-between p-3.5 bg-rose-50/80 border border-rose-200/80 rounded-2xl animate-in fade-in-50 duration-150 shadow-2xs">
              <div className="flex items-center gap-3">
                <span className="text-xs font-black text-rose-800 bg-rose-100/90 px-2.5 py-1 rounded-xl">
                  {selectedBinKeys.size} selected
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedBinKeys(new Set())}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                >
                  Deselect all
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  const selectedList = displayedBinItems.filter((it) =>
                    selectedBinKeys.has(`${it.type}-${it.id}`)
                  );
                  if (selectedList.length === 1) {
                    setPermanentDeleteTarget({
                      id: String(selectedList[0].id),
                      type: selectedList[0].type,
                      name: selectedList[0].name,
                    });
                    setBulkPermanentDeleteTargets(null);
                  } else if (selectedList.length > 1) {
                    setBulkPermanentDeleteTargets(
                      selectedList.map((it) => ({
                        id: String(it.id),
                        type: it.type,
                        name: it.name,
                      }))
                    );
                    setPermanentDeleteTarget(null);
                  }
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black transition-all shadow-xs cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Permanently</span>
              </button>
            </div>
          )}

          {/* Loading state */}
          {isLoadingBin && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-slate-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!isLoadingBin && binItems && binItems.totalCount === 0 && (
            <div className="text-center py-16 space-y-3">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6 text-slate-400" />
              </div>
              <h3 className="text-sm font-black text-slate-700">Bin is Empty</h3>
              <p className="text-xs text-slate-400 font-medium">
                No customers or employees have been moved to the Bin.
              </p>
            </div>
          )}

          {/* Bin Records */}
          {!isLoadingBin && displayedBinItems.length > 0 && (
            <div className="space-y-3">
              {displayedBinItems.map((item) => {
                const itemKey = `${item.type}-${item.id}`;
                const isSelected = selectedBinKeys.has(itemKey);

                return (
                  <div
                    key={itemKey}
                    className={`border rounded-2xl p-4 transition-all ${
                      isSelected
                        ? 'bg-rose-50/25 border-rose-300 shadow-2xs'
                        : 'bg-white border-slate-200 hover:shadow-md'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      {/* Left: Checkbox + Identity */}
                      <div className="flex items-start gap-3 min-w-0">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectItem(itemKey)}
                          aria-label={`Select ${item.name}`}
                          className="mt-2.5 w-4 h-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer accent-rose-600 shrink-0"
                        />

                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          item.type === 'CUSTOMER' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'
                        }`}>
                          {item.type === 'CUSTOMER' ? <Building2 className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-black text-slate-900 truncate">{item.name}</span>
                            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                              item.type === 'CUSTOMER' ? 'bg-indigo-50 text-indigo-700' : 'bg-emerald-50 text-emerald-700'
                            }`}>
                              {item.type === 'CUSTOMER' ? 'Customer' : 'Employee'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 font-medium mt-0.5 truncate">{item.email}</p>
                          {item.type === 'EMPLOYEE' && (item as any).department && (
                            <p className="text-[11px] text-slate-400 font-medium">
                              {(item as any).department} {(item as any).designation ? `· ${(item as any).designation}` : ''}
                              {(item as any).employeeCode ? ` · ${(item as any).employeeCode}` : ''}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Middle: Stats */}
                      <div className="flex items-center gap-3 flex-wrap sm:shrink-0">
                        <div className="text-center">
                          <p className="text-xs font-black text-slate-700">{item.dataCounts?.total ?? 0}</p>
                          <p className="text-[10px] text-slate-400 font-medium">Records</p>
                        </div>
                        {item.deletedAt && (
                          <div className="text-center">
                            <p className="text-xs font-black text-slate-700">
                              {new Date(item.deletedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}
                            </p>
                            <p className="text-[10px] text-slate-400 font-medium">Deleted</p>
                          </div>
                        )}
                        <span className="text-[10px] font-black px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
                          In Bin
                        </span>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => setRestoreTarget({ id: item.id, type: item.type, name: item.name })}
                          disabled={isRestoring}
                          className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-black transition-all cursor-pointer disabled:opacity-50"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          Restore
                        </button>
                        <button
                          onClick={() => {
                            setPermanentDeleteTarget({ id: String(item.id), type: item.type, name: item.name });
                            setBulkPermanentDeleteTargets(null);
                          }}
                          disabled={isPermaDeleting}
                          className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-black transition-all cursor-pointer disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete Permanently
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* RESTORE CONFIRMATION MODAL */}
      {restoreTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 z-10 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
              <RefreshCw className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Restore from Bin?</h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                This will restore <strong className="text-slate-800">{restoreTarget.name}</strong> and reactivate all associated data and user accounts.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isRestoring}
                onClick={() => setRestoreTarget(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isRestoring}
                onClick={async () => {
                  setIsRestoring(true);
                  try {
                    if (restoreTarget.type === 'CUSTOMER') {
                      await api.post(`/admin/data-management/bin/customer/${restoreTarget.id}/restore`);
                    } else {
                      await api.post(`/admin/data-management/bin/employee/${restoreTarget.id}/restore`);
                    }
                    toast.success(`${restoreTarget.name} restored successfully!`);
                    setRestoreTarget(null);
                    await loadBinItems();
                    await loadSummaryAndHistory();
                  } catch (err: any) {
                    toast.error(err?.response?.data?.message || 'Failed to restore');
                  } finally {
                    setIsRestoring(false);
                  }
                }}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-extrabold text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isRestoring ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                <span>Yes, Restore</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BULK PERMANENT DELETE MODAL */}
      {bulkPermanentDeleteTargets && bulkPermanentDeleteTargets.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="relative bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-rose-200 z-10 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Permanently Delete Selected Records?</h3>
              <p className="text-xs text-slate-600 font-medium mt-1 leading-relaxed">
                Are you sure you want to permanently delete these <strong className="text-rose-600 font-bold">{bulkPermanentDeleteTargets.length} selected records</strong>? This action cannot be undone.
              </p>
              <p className="text-xs text-rose-600 font-bold mt-1.5">
                This data will be permanently deleted from the database and cannot be recovered.
              </p>
            </div>

            <div className="max-h-36 overflow-y-auto p-3 bg-slate-50 rounded-xl border border-slate-200 text-left text-xs space-y-1.5 divide-y divide-slate-100">
              {bulkPermanentDeleteTargets.map((item) => (
                <div key={`${item.type}-${item.id}`} className="flex items-center justify-between gap-2 pt-1.5 first:pt-0 text-slate-700">
                  <span className="font-bold truncate">{item.name}</span>
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full shrink-0 ${
                    item.type === 'CUSTOMER' ? 'bg-indigo-50 text-indigo-700' : 'bg-emerald-50 text-emerald-700'
                  }`}>
                    {item.type === 'CUSTOMER' ? 'Customer' : 'Employee'}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isPermaDeleting}
                onClick={() => setBulkPermanentDeleteTargets(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isPermaDeleting}
                onClick={async () => {
                  setIsPermaDeleting(true);
                  try {
                    await api.post('/admin/data-management/bin/bulk-delete', {
                      items: bulkPermanentDeleteTargets.map((it) => ({
                        id: it.id,
                        type: it.type,
                      })),
                    });
                    toast.success(`${bulkPermanentDeleteTargets.length} records permanently deleted from database.`);
                    const deletedKeys = new Set(bulkPermanentDeleteTargets.map((it) => `${it.type}-${it.id}`));
                    setSelectedBinKeys((prev) => {
                      const next = new Set(prev);
                      for (const k of deletedKeys) next.delete(k);
                      return next;
                    });
                    setBulkPermanentDeleteTargets(null);
                    await loadBinItems();
                    await loadSummaryAndHistory();
                  } catch (err: any) {
                    toast.error(err?.response?.data?.message || 'Failed to permanently delete');
                  } finally {
                    setIsPermaDeleting(false);
                  }
                }}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-extrabold text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isPermaDeleting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span>Delete Permanently</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SINGLE PERMANENT DELETE MODAL */}
      {permanentDeleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="relative bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-rose-200 z-10 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Permanently Delete?</h3>
              <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                This will permanently delete <strong className="text-slate-800">{permanentDeleteTarget.name}</strong> ({permanentDeleteTarget.type === 'CUSTOMER' ? 'Customer' : 'Employee'}).
              </p>
              <p className="text-xs text-rose-600 font-bold mt-1.5">
                This data will be permanently deleted from the database and cannot be recovered.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isPermaDeleting}
                onClick={() => setPermanentDeleteTarget(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isPermaDeleting}
                onClick={async () => {
                  setIsPermaDeleting(true);
                  try {
                    if (permanentDeleteTarget.type === 'CUSTOMER') {
                      await api.delete(`/admin/data-management/bin/customer/${permanentDeleteTarget.id}`);
                    } else {
                      await api.delete(`/admin/data-management/bin/employee/${permanentDeleteTarget.id}`);
                    }
                    toast.success(`${permanentDeleteTarget.name} permanently deleted from database.`);
                    setSelectedBinKeys((prev) => {
                      const next = new Set(prev);
                      next.delete(`${permanentDeleteTarget.type}-${permanentDeleteTarget.id}`);
                      return next;
                    });
                    setPermanentDeleteTarget(null);
                    await loadBinItems();
                    await loadSummaryAndHistory();
                  } catch (err: any) {
                    toast.error(err?.response?.data?.message || 'Failed to permanently delete');
                  } finally {
                    setIsPermaDeleting(false);
                  }
                }}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-extrabold text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isPermaDeleting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span>Delete Permanently</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOMER RESET CONFIRMATION MODAL */}
      {showCustomerResetModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-50 duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900">Reset Customer Data?</h3>
              <p className="text-xs text-slate-600 font-medium mt-2 leading-relaxed">
                This will permanently delete all application data belonging to this customer. This action cannot be undone.
              </p>
              <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-left text-xs space-y-1">
                <p className="font-bold text-slate-800">
                  Customer: <span className="font-black text-slate-950">{selectedCustomer.customer.displayName}</span>
                </p>
                <p className="text-[11px] text-slate-500">
                  Email: {selectedCustomer.customer.email || 'N/A'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCustomerResetModal(false)}
                disabled={isResettingCustomer}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleExecuteCustomerReset}
                disabled={isResettingCustomer}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-xs transition-all cursor-pointer shadow-md disabled:opacity-50 flex items-center gap-2"
              >
                {isResettingCustomer ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Resetting Data...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    <span>Yes, Reset Customer Data</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {modalState.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setModalState((prev) => ({ ...prev, isOpen: false }))}
          />

          <div className="relative bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-5 z-10 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">{modalState.title}</h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">{modalState.description}</p>
                </div>
              </div>
              <button
                onClick={() => setModalState((prev) => ({ ...prev, isOpen: false }))}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
              <label className="block text-[11px] font-black uppercase text-slate-500">
                To confirm deletion, please type: <span className="text-rose-600 font-mono font-black">{modalState.requiredText}</span>
              </label>
              <input
                type="text"
                value={modalState.confirmText}
                onChange={(e) => setModalState((prev) => ({ ...prev, confirmText: e.target.value }))}
                placeholder={modalState.requiredText}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono uppercase"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <AdminButton
                variant="secondary"
                size="sm"
                onClick={() => setModalState((prev) => ({ ...prev, isOpen: false }))}
                disabled={isResetting}
              >
                Cancel
              </AdminButton>
              <AdminButton
                variant="danger"
                size="sm"
                onClick={handleExecuteModalConfirm}
                loading={isResetting}
                disabled={modalState.confirmText.trim().toUpperCase() !== modalState.requiredText.trim().toUpperCase()}
              >
                Confirm & Permanently Delete
              </AdminButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
