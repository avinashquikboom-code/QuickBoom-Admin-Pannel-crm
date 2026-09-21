'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Plus,
  Edit,
  Check,
  X,
  Video,
  Image as ImageIcon,
  Camera,
  Layers,
  Save,
  RotateCw,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sparkles,
  User,
  Users,
  Search,
  Filter,
  Sliders,
  CheckCheck,
  Ban,
} from 'lucide-react';
import api from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { AdminFormDrawer } from '@/components/admin';

interface UiPermissionItem {
  key: string;
  module: string;
  action: string;
  label: string;
  category: "screens" | "actions" | "tabs" | "dashboard" | "settings";
  description: string;
}

const ALL_UI_PERMISSIONS: { group: string; category: "screens" | "actions" | "tabs" | "dashboard" | "settings"; items: UiPermissionItem[] }[] = [
  {
    group: "Screens & Navigation Access",
    category: "screens",
    items: [
      { key: "DASHBOARD:VIEW", module: "DASHBOARD", action: "VIEW", label: "Dashboard Screen", category: "screens", description: "Display Dashboard in menu & allow screen view" },
      { key: "LEADS:VIEW", module: "LEADS", action: "VIEW", label: "Leads Screen", category: "screens", description: "Display Leads in menu & allow viewing lead list" },
      { key: "CUSTOMERS:VIEW", module: "CUSTOMERS", action: "VIEW", label: "Customers Screen", category: "screens", description: "Display Customers in menu & allow directory view" },
      { key: "FOLLOW_UP:VIEW", module: "FOLLOW_UP", action: "VIEW", label: "Follow-ups Screen", category: "screens", description: "Display Follow-ups in navigation & allow viewing" },
      { key: "VISITS:VIEW", module: "VISITS", action: "VIEW", label: "Visits Screen", category: "screens", description: "Display Visits in menu & view client field visits" },
      { key: "PROPOSALS:VIEW", module: "PROPOSALS", action: "VIEW", label: "Proposals Screen", category: "screens", description: "Display Proposals in menu & view quotes" },
      { key: "PAYMENTS:VIEW", module: "PAYMENTS", action: "VIEW", label: "Payments Screen", category: "screens", description: "Display Payments in menu & view payments list" },
      { key: "NOTIFICATIONS:VIEW", module: "NOTIFICATIONS", action: "VIEW", label: "Notifications Screen", category: "screens", description: "Display Notification center" },
      { key: "REPORTS:VIEW", module: "REPORTS", action: "VIEW", label: "Reports & Analytics Screen", category: "screens", description: "Display Reports in menu & view reports" },
      { key: "SETTINGS:VIEW", module: "SETTINGS", action: "VIEW", label: "Settings Screen", category: "screens", description: "Display Settings in menu & allow settings view" },
      { key: "TASKS:VIEW", module: "TASKS", action: "VIEW", label: "Tasks Screen", category: "screens", description: "Display Tasks in menu & view assigned tasks" },
      { key: "ATTENDANCE:VIEW", module: "ATTENDANCE", action: "VIEW", label: "Attendance Screen", category: "screens", description: "Display Attendance in menu & view log" },
      { key: "LEAVE:VIEW", module: "LEAVE", action: "VIEW", label: "Leave Screen", category: "screens", description: "Display Leave in menu & view requests" },
      { key: "SALARY:VIEW", module: "SALARY", action: "VIEW", label: "Salary & Payroll Screen", category: "screens", description: "Display Salary & slips in menu" },
      { key: "LOAN:VIEW", module: "LOAN", action: "VIEW", label: "Loan Advances Screen", category: "screens", description: "Display Loan in menu" },
    ],
  },
  {
    group: "Screen Actions & Buttons",
    category: "actions",
    items: [
      { key: "LEADS:CREATE", module: "LEADS", action: "CREATE", label: "Add Lead Button", category: "actions", description: "Show 'Add Lead' button and enable lead creation sheet" },
      { key: "LEADS:EDIT", module: "LEADS", action: "EDIT", label: "Edit Lead Button", category: "actions", description: "Show 'Edit Lead' button & allow updating lead details" },
      { key: "LEADS:DELETE", module: "LEADS", action: "DELETE", label: "Delete Lead Button", category: "actions", description: "Show 'Delete Lead' button" },
      { key: "LEADS:CHANGE_STATUS", module: "LEADS", action: "CHANGE_STATUS", label: "Change Lead Status", category: "actions", description: "Allow changing lead pipeline stages and statuses" },
      { key: "LEADS:EXPORT", module: "LEADS", action: "EXPORT", label: "Export Leads", category: "actions", description: "Show export CSV / Excel action for leads" },

      { key: "CUSTOMERS:CREATE", module: "CUSTOMERS", action: "CREATE", label: "Add Customer Button", category: "actions", description: "Show 'Add Customer' button and client creation sheet" },
      { key: "CUSTOMERS:EDIT", module: "CUSTOMERS", action: "EDIT", label: "Edit Customer Button", category: "actions", description: "Show 'Edit Customer' button & profile edit" },
      { key: "CUSTOMERS:DELETE", module: "CUSTOMERS", action: "DELETE", label: "Delete Customer Button", category: "actions", description: "Show 'Delete Customer' action" },
      { key: "CUSTOMERS:EXPORT", module: "CUSTOMERS", action: "EXPORT", label: "Export Customers", category: "actions", description: "Export customer records" },

      { key: "FOLLOW_UP:CREATE", module: "FOLLOW_UP", action: "CREATE", label: "Add Follow-up Button", category: "actions", description: "Log and schedule new follow-ups" },
      { key: "FOLLOW_UP:EDIT", module: "FOLLOW_UP", action: "EDIT", label: "Edit Follow-up Button", category: "actions", description: "Update follow-up outcome and status" },
      { key: "FOLLOW_UP:DELETE", module: "FOLLOW_UP", action: "DELETE", label: "Delete Follow-up", category: "actions", description: "Delete scheduled follow-ups" },

      { key: "VISITS:CREATE", module: "VISITS", action: "CREATE", label: "Schedule Visit Button", category: "actions", description: "Schedule new client visits" },
      { key: "VISITS:EDIT", module: "VISITS", action: "EDIT", label: "Complete/Update Visit", category: "actions", description: "Start, check-in, or complete visits" },
      { key: "VISITS:DELETE", module: "VISITS", action: "DELETE", label: "Cancel Visit", category: "actions", description: "Cancel or delete visits" },

      { key: "PROPOSALS:CREATE", module: "PROPOSALS", action: "CREATE", label: "Create Proposal Button", category: "actions", description: "Create new commercial proposal" },
      { key: "PROPOSALS:EDIT", module: "PROPOSALS", action: "EDIT", label: "Edit Proposal", category: "actions", description: "Edit proposal details and items" },
      { key: "PROPOSALS:DELETE", module: "PROPOSALS", action: "DELETE", label: "Delete Proposal", category: "actions", description: "Delete proposal" },
      { key: "PROPOSALS:SEND", module: "PROPOSALS", action: "SEND", label: "Send Proposal (Email/WhatsApp)", category: "actions", description: "Send proposals to clients" },
      { key: "PROPOSALS:DOWNLOAD", module: "PROPOSALS", action: "DOWNLOAD", label: "Download Proposal PDF", category: "actions", description: "Download proposal document" },

      { key: "PAYMENTS:CREATE", module: "PAYMENTS", action: "CREATE", label: "Record Payment Button", category: "actions", description: "Record incoming client payment" },
      { key: "PAYMENTS:EDIT", module: "PAYMENTS", action: "EDIT", label: "Edit Payment", category: "actions", description: "Update payment entry" },
      { key: "PAYMENTS:DELETE", module: "PAYMENTS", action: "DELETE", label: "Delete Payment", category: "actions", description: "Delete payment entry" },
      { key: "PAYMENTS:EXPORT", module: "PAYMENTS", action: "EXPORT", label: "Export Payments", category: "actions", description: "Export payment records and statements" },

      { key: "ATTENDANCE:CREATE", module: "ATTENDANCE", action: "CREATE", label: "Punch In/Out Attendance", category: "actions", description: "Allow biometric and GPS attendance punch in/out" },
      { key: "ATTENDANCE:EDIT", module: "ATTENDANCE", action: "EDIT", label: "Regularize Attendance", category: "actions", description: "Allow submitting attendance regularization requests" },

      { key: "LEAVE:CREATE", module: "LEAVE", action: "CREATE", label: "Apply Leave Button", category: "actions", description: "Show 'Apply for Leave' and WFH request button" },
      { key: "LEAVE:DELETE", module: "LEAVE", action: "DELETE", label: "Cancel Leave Request", category: "actions", description: "Allow cancelling submitted leave requests" },
      { key: "LEAVE:APPROVE", module: "LEAVE", action: "APPROVE", label: "Approve Leave Button", category: "actions", description: "Approve team leave requests" },
      { key: "LEAVE:REJECT", module: "LEAVE", action: "REJECT", label: "Reject Leave Button", category: "actions", description: "Reject team leave requests" },

      { key: "TASKS:CREATE", module: "TASKS", action: "CREATE", label: "Create Task Button", category: "actions", description: "Allow creating new assigned tasks" },
      { key: "TASKS:EDIT", module: "TASKS", action: "EDIT", label: "Start / Complete Task", category: "actions", description: "Allow starting tasks and uploading photo proof" },

      { key: "SALARY:DOWNLOAD", module: "SALARY", action: "DOWNLOAD", label: "Download Payslips", category: "actions", description: "Allow downloading salary slip PDF files" },

      { key: "LOAN:CREATE", module: "LOAN", action: "CREATE", label: "Request Loan Button", category: "actions", description: "Show 'Request Loan' application button" },
      { key: "LOAN:APPROVE", module: "LOAN", action: "APPROVE", label: "Approve Loan Button", category: "actions", description: "Approve employee loan requests" },
      { key: "LOAN:REJECT", module: "LOAN", action: "REJECT", label: "Reject Loan Button", category: "actions", description: "Reject employee loan requests" },

      { key: "NOTIFICATIONS:SEND", module: "NOTIFICATIONS", action: "SEND", label: "Send Notifications Button", category: "actions", description: "Send push and in-app alerts" },

      { key: "REPORTS:EXPORT", module: "REPORTS", action: "EXPORT", label: "Export Reports", category: "actions", description: "Export analytical reports" },
      { key: "REPORTS:DOWNLOAD", module: "REPORTS", action: "DOWNLOAD", label: "Download Reports", category: "actions", description: "Download report files" },
    ],
  },
  {
    group: "Tabs & Detail Sections",
    category: "tabs",
    items: [
      { key: "LEADS:TAB_OVERVIEW", module: "LEADS", action: "TAB_OVERVIEW", label: "Lead Overview Tab", category: "tabs", description: "Display Lead basic information & overview" },
      { key: "LEADS:TAB_ACTIVITY", module: "LEADS", action: "TAB_ACTIVITY", label: "Lead Activity & Comms Tab", category: "tabs", description: "Display communication logs, calls and follow-ups" },
      { key: "LEADS:TAB_TIMELINE", module: "LEADS", action: "TAB_TIMELINE", label: "Lead Timeline Tab", category: "tabs", description: "Display milestone timeline" },
      { key: "LEADS:TAB_HISTORY", module: "LEADS", action: "TAB_HISTORY", label: "Lead Status History Tab", category: "tabs", description: "Display audit history and status changes" },

      { key: "CUSTOMERS:TAB_OVERVIEW", module: "CUSTOMERS", action: "TAB_OVERVIEW", label: "Customer Overview Tab", category: "tabs", description: "Display Customer details & contact info" },
      { key: "CUSTOMERS:TAB_PLANS", module: "CUSTOMERS", action: "TAB_PLANS", label: "Customer Active Plans Tab", category: "tabs", description: "Display active plan and quota balance" },
      { key: "CUSTOMERS:TAB_SCHEDULE", module: "CUSTOMERS", action: "TAB_SCHEDULE", label: "Customer Schedule Tab", category: "tabs", description: "Display deliverable calendar schedule" },
    ],
  },
  {
    group: "Dashboard Cards & Widgets",
    category: "dashboard",
    items: [
      { key: "DASHBOARD:CARD_STATS", module: "DASHBOARD", action: "CARD_STATS", label: "Statistics Overview Card", category: "dashboard", description: "Show general performance stats card" },
      { key: "DASHBOARD:CARD_LEADS", module: "DASHBOARD", action: "CARD_LEADS", label: "Open Leads Widget", category: "dashboard", description: "Show open leads count and priority follow-ups" },
      { key: "DASHBOARD:CARD_VISITS", module: "DASHBOARD", action: "CARD_VISITS", label: "Today's Visits Widget", category: "dashboard", description: "Show today's field visits count and card" },
      { key: "DASHBOARD:CARD_WORK", module: "DASHBOARD", action: "CARD_WORK", label: "Active SSM Work Widget", category: "dashboard", description: "Show active SSM work deliverables card" },
      { key: "DASHBOARD:CARD_PROPOSALS", module: "DASHBOARD", action: "CARD_PROPOSALS", label: "Pending Proposals Widget", category: "dashboard", description: "Show pending proposals card" },
      { key: "DASHBOARD:CARD_EMPLOYEES", module: "DASHBOARD", action: "CARD_EMPLOYEES", label: "Total Employees Widget", category: "dashboard", description: "Show team size and active staff card" },
    ],
  },
  {
    group: "Settings UI Items",
    category: "settings",
    items: [
      { key: "SETTINGS:SETTING_PROFILE", module: "SETTINGS", action: "SETTING_PROFILE", label: "Company / User Profile", category: "settings", description: "Show Company Profile in Settings" },
      { key: "SETTINGS:SETTING_NOTIFICATIONS", module: "SETTINGS", action: "SETTING_NOTIFICATIONS", label: "Push Notification Settings", category: "settings", description: "Show Notifications preferences tile" },
      { key: "SETTINGS:SETTING_INTEGRATIONS", module: "SETTINGS", action: "SETTING_INTEGRATIONS", label: "Integrations Settings", category: "settings", description: "Show third-party integrations tile" },
      { key: "SETTINGS:SETTING_USERS", module: "SETTINGS", action: "SETTING_USERS", label: "User & Role Management", category: "settings", description: "Show Team and Role management in settings" },
    ],
  },
];

interface Role {
  id: string;
  name: string;
  description: string;
  permissionsCount: number;
  isSystem: boolean;
}

interface WorkModuleMeta {
  key: string;
  name: string;
  description: string;
  icon: string;
  isRoleSpecific?: boolean;
}

interface RoleWorkPermissionItem {
  id?: string;
  roleId?: string;
  designationId?: number | null;
  roleName: string;
  name?: string;
  code?: string;
  activeEmployeesCount?: number;
  totalEmployeesCount?: number;
  modules: {
    module: string;
    name: string;
    isEnabled: boolean;
  }[];
}

interface WorkAccessRequest {
  id: number;
  customerId: number;
  employeeId: number;
  workModule: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reason?: string;
  rejectionReason?: string;
  reviewedAt?: string;
  createdAt: string;
  employee?: {
    id: number;
    employeeCode: string;
    firstName: string;
    lastName: string;
    email: string;
    designation?: { name: string };
  };
}

interface EmployeeOverrideItem {
  id: number;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  defaultRolePermissions: string[];
  overrides: Record<string, 'DEFAULT' | 'ALLOW' | 'DENY'>;
}

export default function RolesPermissionsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<
    'work-permissions' | 'employee-overrides' | 'access-requests' | 'rbac-roles'
  >('work-permissions');

  // Custom RBAC Role Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [roleForm, setRoleForm] = useState({
    name: '',
    description: '',
    permissions: ['crm.read', 'hrm.attendance.view', 'reports.view'],
  });

  // Selected Role for Work Permission Matrix — tracked by unique backend ID
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [localWorkPerms, setLocalWorkPerms] = useState<Record<string, Record<string, boolean>>>({});
  const [isSavingPerms, setIsSavingPerms] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Employee Overrides State
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [rolePermissionsSet, setRolePermissionsSet] = useState<Set<string>>(new Set());
  const [isLoadingRolePerms, setIsLoadingRolePerms] = useState(false);
  const [rbacSectionTab, setRbacSectionTab] = useState<"screens" | "actions" | "tabs" | "dashboard" | "settings">("screens");
  const [localEmployeeOverrides, setLocalEmployeeOverrides] = useState<
    Record<number, Record<string, 'DEFAULT' | 'ALLOW' | 'DENY'>>
  >({});
  const [savingEmployeeId, setSavingEmployeeId] = useState<number | null>(null);

  // Access Request Filter & Reject Modal
  const [requestFilter, setRequestFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [rejectingRequestId, setRejectingRequestId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');

  // 1. Fetch RBAC Roles
  const { data: rolesData, isLoading: isRolesLoading, refetch: refetchRoles } = useQuery({
    queryKey: ['admin-roles-list'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/auth/roles');
        return res?.data || res;
      } catch {
        return [];
      }
    },
  });

  const roles: Role[] = Array.isArray(rolesData)
    ? rolesData.map((r: any) => ({
        id: String(r.id),
        name: r.name,
        description: r.description || 'Access role for CRM and HRM modules',
        permissionsCount: r.permissionsCount || 24,
        isSystem: Boolean(r.isSystem),
      }))
    : [];

  // 2. Fetch Role Work Permissions from Database API
  const {
    data: workRolesData,
    isLoading: isWorkRolesLoading,
    isError: isWorkRolesError,
    error: workRolesError,
    refetch: refetchWorkRoles,
  } = useQuery({
    queryKey: ['role-work-permissions'],
    queryFn: async () => {
      const res: any = await api.get('/works/permissions/roles');
      return res?.data || res;
    },
  });

  const roleWorkList: RoleWorkPermissionItem[] = workRolesData?.roles || [];
  // availableModules comes exclusively from the API — no hardcoded fallback
  const availableModules: WorkModuleMeta[] = workRolesData?.availableModules || [];

  // Find currently selected role item by ID or name
  const selectedRoleItem =
    roleWorkList.find(
      (r) =>
        (r.roleId && r.roleId === selectedRoleId) ||
        (r.id && r.id === selectedRoleId) ||
        r.roleName === selectedRoleId,
    ) || null;
  const selectedWorkRoleName = selectedRoleItem?.roleName || '';

  // Auto-select first role on initial load; re-validate selection after every refresh
  useEffect(() => {
    if (roleWorkList.length === 0) {
      if (selectedRoleId) setSelectedRoleId('');
      return;
    }
    // If nothing is selected yet, pick the first role's unique ID
    if (!selectedRoleId) {
      setSelectedRoleId(roleWorkList[0].roleId || roleWorkList[0].id || roleWorkList[0].roleName);
      return;
    }
    // If the previously selected role no longer exists in the refreshed list, fall back to first
    const stillExists = roleWorkList.some(
      (r) =>
        (r.roleId && r.roleId === selectedRoleId) ||
        (r.id && r.id === selectedRoleId) ||
        r.roleName === selectedRoleId,
    );
    if (!stillExists) {
      setSelectedRoleId(roleWorkList[0].roleId || roleWorkList[0].id || roleWorkList[0].roleName);
    }
  }, [roleWorkList]); // intentionally omit selectedRoleId — only run on data change

  // 3. Fetch Employees with Overrides
  const {
    data: employeesData,
    isLoading: isEmployeesLoading,
    refetch: refetchEmployees,
  } = useQuery({
    queryKey: ['employee-module-overrides'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/works/permissions/overrides/employees');
        return Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      } catch {
        return [];
      }
    },
  });

  const employeeList: EmployeeOverrideItem[] = Array.isArray(employeesData) ? employeesData : [];

  // 4. Fetch Access Requests
  const {
    data: accessRequestsData,
    isLoading: isRequestsLoading,
    refetch: refetchRequests,
  } = useQuery({
    queryKey: ['admin-access-requests'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/works/access-requests');
        return Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      } catch {
        return [];
      }
    },
  });

  const accessRequests: WorkAccessRequest[] = Array.isArray(accessRequestsData) ? accessRequestsData : [];
  const pendingCount = accessRequests.filter((r) => r.status === 'PENDING').length;

  // Helpers for Role Permissions
  const getRoleModuleStatus = (roleName: string, moduleKey: string): boolean => {
    if (localWorkPerms[roleName] && localWorkPerms[roleName][moduleKey] !== undefined) {
      return localWorkPerms[roleName][moduleKey];
    }
    const roleItem = roleWorkList.find((r) => r.roleName === roleName);
    const mod = roleItem?.modules.find((m) => m.module === moduleKey);
    return mod ? mod.isEnabled : false;
  };

  const handleToggleModule = (roleName: string, moduleKey: string) => {
    const currentVal = getRoleModuleStatus(roleName, moduleKey);
    setLocalWorkPerms((prev) => ({
      ...prev,
      [roleName]: {
        ...(prev[roleName] || {}),
        [moduleKey]: !currentVal,
      },
    }));
  };

  const handleSaveRoleWorkPermissions = async (roleIdentifier: string, roleName: string) => {
    setIsSavingPerms(true);
    try {
      const moduleMap: Record<string, boolean> = {};
      availableModules.forEach((m) => {
        moduleMap[m.key] = getRoleModuleStatus(roleName, m.key);
      });

      await api.put(`/works/permissions/roles/${encodeURIComponent(roleIdentifier)}`, {
        permissions: moduleMap,
      });

      toast.success(`Role permissions saved for ${roleName}!`);
      // Clear local optimistic state for this role so UI re-reads from server
      setLocalWorkPerms((prev) => {
        const next = { ...prev };
        delete next[roleName];
        return next;
      });
      await refetchWorkRoles();
      await refetchEmployees();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save permissions');
    } finally {
      setIsSavingPerms(false);
    }
  };

  // Refresh handler — invalidates React Query cache and re-fetches all role data
  const handleRefresh = async () => {
    if (isRefreshing) return; // prevent double-click
    setIsRefreshing(true);
    try {
      // Invalidate cache so React Query fetches fresh data from the server
      await queryClient.invalidateQueries({ queryKey: ['role-work-permissions'] });
      await queryClient.invalidateQueries({ queryKey: ['employee-module-overrides'] });
      // Run all refetches in parallel
      await Promise.all([refetchWorkRoles(), refetchEmployees()]);
      // Clear any unsaved local permission toggles so the UI reflects server state
      setLocalWorkPerms({});
      toast.success('Roles and permissions refreshed successfully.');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Unable to refresh roles. Please try again.');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Helpers for Employee Overrides
  const getEmployeeModuleOverride = (
    employeeId: number,
    moduleKey: string,
    initialOverrides: Record<string, 'DEFAULT' | 'ALLOW' | 'DENY'>,
  ): 'DEFAULT' | 'ALLOW' | 'DENY' => {
    if (localEmployeeOverrides[employeeId] && localEmployeeOverrides[employeeId][moduleKey] !== undefined) {
      return localEmployeeOverrides[employeeId][moduleKey];
    }
    return initialOverrides[moduleKey] || 'DEFAULT';
  };

  const handleSetEmployeeOverride = (
    employeeId: number,
    moduleKey: string,
    val: 'DEFAULT' | 'ALLOW' | 'DENY',
  ) => {
    setLocalEmployeeOverrides((prev) => ({
      ...prev,
      [employeeId]: {
        ...(prev[employeeId] || {}),
        [moduleKey]: val,
      },
    }));
  };

  const handleSaveEmployeeOverrides = async (emp: EmployeeOverrideItem) => {
    setSavingEmployeeId(emp.id);
    try {
      const currentOverrides: Record<string, 'DEFAULT' | 'ALLOW' | 'DENY'> = {};
      availableModules.forEach((m) => {
        currentOverrides[m.key] = getEmployeeModuleOverride(emp.id, m.key, emp.overrides);
      });

      await api.put(`/works/permissions/overrides/employee/${emp.id}`, {
        overrides: currentOverrides,
      });

      toast.success(`Overrides saved for ${emp.firstName} (${emp.employeeCode})!`);
      await refetchEmployees();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save employee overrides');
    } finally {
      setSavingEmployeeId(null);
    }
  };

  const handleApproveRequest = async (id: number) => {
    try {
      await api.patch(`/works/access-requests/${id}/approve`);
      toast.success('Access request approved successfully!');
      refetchRequests();
      queryClient.invalidateQueries({ queryKey: ['role-work-permissions'] });
      queryClient.invalidateQueries({ queryKey: ['employee-module-overrides'] });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to approve request');
    }
  };

  const handleRejectRequest = async () => {
    if (!rejectingRequestId) return;
    try {
      await api.patch(`/works/access-requests/${rejectingRequestId}/reject`, {
        reason: rejectionReason || 'Access request was rejected by admin.',
      });
      toast.success('Access request rejected');
      setRejectingRequestId(null);
      setRejectionReason('');
      refetchRequests();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to reject request');
    }
  };

  const getModuleIcon = (key: string) => {
    switch (key) {
      case 'leads':
        return <Users className="w-4 h-4" />;
      case 'video_edit':
        return <Video className="w-4 h-4" />;
      case 'post_design':
        return <ImageIcon className="w-4 h-4" />;
      case 'story_design':
        return <Layers className="w-4 h-4" />;
      case 'reel_shoot':
        return <Camera className="w-4 h-4" />;
      default:
        return <ShieldCheck className="w-4 h-4" />;
    }
  };

  // RBAC Custom Role Handlers
  const handleOpenCreate = () => {
    setSelectedRole(null);
    setRoleForm({
      name: "",
      description: "",
      permissions: [],
    });
    setRolePermissionsSet(new Set([
      "DASHBOARD:VIEW",
      "LEADS:VIEW",
      "CUSTOMERS:VIEW",
      "FOLLOW_UP:VIEW",
      "SETTINGS:VIEW",
    ]));
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = async (role: Role) => {
    setSelectedRole(role);
    setRoleForm({
      name: role.name,
      description: role.description || "",
      permissions: [],
    });
    setIsDrawerOpen(true);
    setIsLoadingRolePerms(true);
    try {
      const res = await api.get(`/auth/roles/${role.id}/permissions`);
      const list = res.data?.permissions || res.data?.data?.permissions || [];
      const newSet = new Set<string>();
      list.forEach((p: any) => {
        if (p.module && p.action) {
          newSet.add(`${p.module.toUpperCase()}:${p.action.toUpperCase()}`);
        }
      });
      setRolePermissionsSet(newSet);
    } catch {
      setRolePermissionsSet(new Set());
    } finally {
      setIsLoadingRolePerms(false);
    }
  };

  const handleTogglePermKey = (key: string) => {
    setRolePermissionsSet((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleSelectAllPerms = () => {
    const all = new Set<string>();
    ALL_UI_PERMISSIONS.forEach((g) => {
      g.items.forEach((item) => {
        all.add(`${item.module}:${item.action}`);
      });
    });
    setRolePermissionsSet(all);
    toast.success("All permissions selected");
  };

  const handleSelectReadOnlyPerms = () => {
    const readOnly = new Set<string>();
    ALL_UI_PERMISSIONS.forEach((g) => {
      g.items.forEach((item) => {
        if (item.action === "VIEW") {
          readOnly.add(`${item.module}:${item.action}`);
        }
      });
    });
    setRolePermissionsSet(readOnly);
    toast.success("Read-only preset selected");
  };

  const handleClearAllPerms = () => {
    setRolePermissionsSet(new Set());
    toast.success("All permissions cleared");
  };

  const handleSaveRole = async () => {
    if (!roleForm.name.trim()) {
      toast.error("Please enter a role title");
      return;
    }
    setIsSubmitting(true);
    try {
      let targetId = selectedRole?.id;
      if (selectedRole) {
        await api.patch(`/auth/roles/${selectedRole.id}`, {
          name: roleForm.name,
          description: roleForm.description,
        });
      } else {
        const res = await api.post("/auth/roles", {
          name: roleForm.name,
          description: roleForm.description,
        });
        targetId = res.data?.id || res.data?.data?.id;
      }

      if (targetId) {
        const permArray = Array.from(rolePermissionsSet).map((k) => {
          const [module, action] = k.split(":");
          return { module, action };
        });
        await api.put(`/auth/roles/${targetId}/permissions`, {
          permissions: permArray,
        });
      }

      toast.success(`Role ${roleForm.name} saved with ${rolePermissionsSet.size} permissions!`);
      setIsDrawerOpen(false);
      refetchRoles();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to save role");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredRequests = accessRequests.filter((r) => {
    if (requestFilter === 'ALL') return true;
    return r.status === requestFilter;
  });

  const filteredEmployees = employeeList.filter((e) => {
    if (!employeeSearch.trim()) return true;
    const q = employeeSearch.toLowerCase();
    return (
      e.firstName.toLowerCase().includes(q) ||
      e.lastName.toLowerCase().includes(q) ||
      e.employeeCode.toLowerCase().includes(q) ||
      e.role.toLowerCase().includes(q) ||
      e.email.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-16 text-slate-800 animate-in fade-in-50 duration-200">
      {/* Top Hero Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-slate-700/60 shadow-xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-[#23C45E]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-[#23C45E] border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-[#23C45E] animate-pulse" />
                Module Visibility & Access Control
              </span>
              {pendingCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-extrabold flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {pendingCount} Pending Access Request{pendingCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Module Access & Permissions Management
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-2xl leading-relaxed">
              Configure role-specific module visibility (Leads, Video Edit, Post Design, Story Design, Reel Shoot), individual employee overrides, and access requests for mobile app users.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {activeTab === 'rbac-roles' && (
              <button
                type="button"
                onClick={handleOpenCreate}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#23C45E] hover:bg-[#1AA14D] text-slate-950 font-black rounded-2xl text-xs shadow-md shadow-[#23C45E]/20 transition-all cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>+ Create Custom Role</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-6 pt-6 border-t border-slate-700/60 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('work-permissions')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'work-permissions'
                ? 'bg-[#23C45E] text-slate-950 shadow-md shadow-[#23C45E]/20'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Role Permissions Matrix</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('employee-overrides')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'employee-overrides'
                ? 'bg-[#23C45E] text-slate-950 shadow-md shadow-[#23C45E]/20'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Employee Overrides</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('access-requests')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'access-requests'
                ? 'bg-[#23C45E] text-slate-950 shadow-md shadow-[#23C45E]/20'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Access Requests</span>
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('rbac-roles')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'rbac-roles'
                ? 'bg-[#23C45E] text-slate-950 shadow-md shadow-[#23C45E]/20'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>RBAC System Roles</span>
          </button>
        </div>
      </div>

      {/* MODULE ARCHITECTURE NOTICE */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-black shrink-0">
            i
          </div>
          <div>
            <h4 className="font-extrabold text-slate-900">Module Access Architecture</h4>
            <p className="text-slate-600 mt-0.5">
              <strong className="text-slate-900">Common Modules</strong> (Dashboard, Attendance, Leaves, Calendar, Profile) remain visible according to application structure.
              <strong className="text-slate-900"> Role-Specific Modules</strong> (Leads, Video Edit, Post Design, Story Design, Reel Shoot) are rendered strictly when effectively enabled for that role or employee.
            </p>
          </div>
        </div>
      </div>

      {/* TAB 1: WORK MODULE PERMISSION MANAGEMENT */}
      {activeTab === 'work-permissions' && (
        <div className="space-y-6">
          {/* Quick Role Selector Cards */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-sm font-black text-slate-900">Select Employee Role</h2>
                <p className="text-xs text-slate-500 font-medium">
                  Choose a role to inspect and configure which role-specific modules its employees can access on mobile.
                </p>
              </div>

              <button
                type="button"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
              </button>
            </div>

            {isWorkRolesLoading ? (
              <div className="py-8 text-center text-xs font-bold text-slate-400 animate-pulse">
                Loading roles from database...
              </div>
            ) : isWorkRolesError ? (
              <div className="py-8 flex flex-col items-center justify-center gap-3">
                <AlertCircle className="w-8 h-8 text-rose-500" />
                <p className="text-xs font-bold text-slate-700">Failed to load roles from database.</p>
                <p className="text-[11px] text-slate-500 font-medium">
                  {(workRolesError as any)?.response?.data?.message ||
                    (workRolesError as any)?.message ||
                    'Please check your connection and try again.'}
                </p>
                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-200 transition-colors disabled:opacity-60"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span>{isRefreshing ? 'Refreshing...' : 'Retry'}</span>
                </button>
              </div>
            ) : roleWorkList.length === 0 ? (
              <div className="py-8 flex flex-col items-center justify-center gap-3">
                <p className="text-xs font-bold text-slate-400">No roles found in the database.</p>
                <p className="text-[11px] text-slate-400 font-medium">
                  Create designations or custom roles to manage module access.
                </p>
                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-200 transition-colors disabled:opacity-60"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span>{isRefreshing ? 'Refreshing...' : 'Retry'}</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {roleWorkList.map((r) => {
                  const roleKey = String(r.roleId || r.id || r.roleName);
                  const isSelected =
                    selectedRoleId === roleKey || selectedWorkRoleName === r.roleName;
                  const activeText = `${r.activeEmployeesCount ?? 0} of ${r.totalEmployeesCount ?? 0} Active`;

                  return (
                    <button
                      key={roleKey}
                      type="button"
                      onClick={() => setSelectedRoleId(roleKey)}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#23C45E] bg-[#E8F9EE]/60 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 bg-slate-50/50 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-extrabold text-slate-900 truncate">
                          {r.roleName}
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#1AA14D]" />}
                      </div>
                      <span className="text-[11px] font-bold text-slate-500">
                        {activeText}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Active Role Module Toggles & Save Section */}
          {!selectedRoleItem || !selectedWorkRoleName ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs flex flex-col items-center justify-center gap-2">
              <ShieldCheck className="w-8 h-8 text-slate-300" />
              <p className="text-xs font-bold text-slate-400">Select a role above to configure its module access.</p>
            </div>
          ) : (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-slate-900">
                    Module Access for Role:
                  </h3>
                  <span className="px-3 py-0.5 rounded-full bg-[#E8F9EE] text-[#1AA14D] border border-[#23C45E]/30 text-xs font-black">
                    {selectedWorkRoleName}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Toggle modules ON or OFF. All employees with this role will inherit these settings unless overridden.
                </p>
              </div>

              <button
                type="button"
                disabled={isSavingPerms}
                onClick={() =>
                  handleSaveRoleWorkPermissions(
                    selectedRoleItem.roleId || selectedRoleItem.id || selectedWorkRoleName,
                    selectedWorkRoleName,
                  )
                }
                className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#23C45E] hover:bg-[#1AA14D] text-slate-950 font-black rounded-xl text-xs shadow-md shadow-[#23C45E]/20 transition-all cursor-pointer disabled:opacity-50 active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingPerms ? 'Saving...' : 'Save Role Permissions'}</span>
              </button>
            </div>

            {/* Modules Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableModules.map((mod) => {
                const isEnabled = getRoleModuleStatus(selectedWorkRoleName, mod.key);

                return (
                  <div
                    key={mod.key}
                    className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                      isEnabled
                        ? 'border-emerald-200 bg-emerald-50/30'
                        : 'border-slate-200 bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                          isEnabled
                            ? 'bg-[#E8F9EE] text-[#1AA14D] border border-[#23C45E]/30'
                            : 'bg-slate-100 text-slate-400 border border-slate-200'
                        }`}
                      >
                        {getModuleIcon(mod.key)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-slate-900 text-sm">{mod.name}</h4>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                              isEnabled
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {isEnabled ? 'VISIBLE' : 'HIDDEN'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          {mod.description}
                        </p>
                      </div>
                    </div>

                    {/* Toggle Switch */}
                    <button
                      type="button"
                      onClick={() => handleToggleModule(selectedWorkRoleName, mod.key)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        isEnabled ? 'bg-[#23C45E]' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          isEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
          )}
        </div>
      )}

      {/* TAB 2: EMPLOYEE-SPECIFIC OVERRIDES */}
      {activeTab === 'employee-overrides' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-black text-slate-900">Individual Employee Access Overrides</h2>
              <p className="text-xs text-slate-500 font-medium">
                Override module visibility for specific employees (e.g. Set Post Design = OFF for EMP-002, or ALLOW Leads for a specific Designer).
              </p>
            </div>

            <div className="relative min-w-[280px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={employeeSearch}
                onChange={(e) => setEmployeeSearch(e.target.value)}
                placeholder="Search by name, code, role..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#23C45E]"
              />
            </div>
          </div>

          {isEmployeesLoading ? (
            <div className="py-12 text-center text-xs font-bold text-slate-400">
              Loading employee override list...
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="py-12 text-center text-xs font-bold text-slate-400">
              No employees found matching your search.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEmployees.map((emp) => {
                const isSaving = savingEmployeeId === emp.id;

                return (
                  <div
                    key={emp.id}
                    className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-all shadow-2xs space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-black text-sm">
                          {emp.firstName.charAt(0)}
                          {emp.lastName?.charAt(0) || ''}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-extrabold text-slate-900 text-sm">
                              {emp.firstName} {emp.lastName}
                            </h4>
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold">
                              {emp.employeeCode}
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold">
                              {emp.role}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">{emp.email}</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={() => handleSaveEmployeeOverrides(emp)}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-[#23C45E] hover:bg-[#1AA14D] text-slate-950 font-black rounded-xl text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50 active:scale-95 self-end sm:self-auto"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>{isSaving ? 'Saving...' : 'Save Overrides'}</span>
                      </button>
                    </div>

                    {/* Module Override Grid for this Employee */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2 border-t border-slate-100">
                      {availableModules.map((mod) => {
                        const overrideVal = getEmployeeModuleOverride(emp.id, mod.key, emp.overrides);
                        const roleDefault = emp.defaultRolePermissions.includes(mod.key);
                        let effective = roleDefault;
                        if (overrideVal === 'ALLOW') effective = true;
                        if (overrideVal === 'DENY') effective = false;

                        return (
                          <div
                            key={mod.key}
                            className={`p-3 rounded-xl border flex flex-col justify-between gap-2 ${
                              effective ? 'bg-emerald-50/40 border-emerald-200' : 'bg-slate-50 border-slate-200'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                {getModuleIcon(mod.key)}
                                {mod.name}
                              </span>
                              <span
                                className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                                  effective ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                                }`}
                              >
                                {effective ? 'VISIBLE' : 'HIDDEN'}
                              </span>
                            </div>

                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-slate-400 font-medium">Override:</span>
                              <select
                                value={overrideVal}
                                onChange={(e) =>
                                  handleSetEmployeeOverride(
                                    emp.id,
                                    mod.key,
                                    e.target.value as 'DEFAULT' | 'ALLOW' | 'DENY',
                                  )
                                }
                                className={`w-full text-xs font-bold py-1 px-2 rounded-lg border bg-white focus:outline-none ${
                                  overrideVal === 'ALLOW'
                                    ? 'border-emerald-500 text-emerald-700'
                                    : overrideVal === 'DENY'
                                    ? 'border-red-400 text-red-700'
                                    : 'border-slate-300 text-slate-700'
                                }`}
                              >
                                <option value="DEFAULT">
                                  DEFAULT ({roleDefault ? 'Role ON' : 'Role OFF'})
                                </option>
                                <option value="ALLOW">ALLOW (Force ON)</option>
                                <option value="DENY">DENY (Force OFF)</option>
                              </select>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: EMPLOYEE ACCESS REQUESTS */}
      {activeTab === 'access-requests' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-black text-slate-900">Employee Module Access Requests</h2>
              <p className="text-xs text-slate-500 font-medium">
                Employees can request access to modules currently disabled for their role. Approve or reject requests below.
              </p>
            </div>

            {/* Filter Chips */}
            <div className="flex items-center gap-2">
              {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setRequestFilter(filter)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    requestFilter === filter
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          {isRequestsLoading ? (
            <div className="py-12 text-center text-xs font-bold text-slate-400">
              Loading employee access requests...
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="py-12 text-center text-xs font-bold text-slate-400">
              No access requests found in this filter.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-black text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Requested Module</th>
                    <th className="py-3 px-4">Reason</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Requested Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium">
                  {filteredRequests.map((req) => {
                    const empName = req.employee
                      ? `${req.employee.firstName} ${req.employee.lastName || ''}`.trim()
                      : `Employee #${req.employeeId}`;
                    const empCode = req.employee?.employeeCode || `ID-${req.employeeId}`;
                    const desig = req.employee?.designation?.name || 'Employee';

                    return (
                      <tr key={req.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-xs">
                              {empName.charAt(0)}
                            </div>
                            <div>
                              <div className="font-extrabold text-slate-900">{empName}</div>
                              <div className="text-[10px] text-slate-400 font-bold">
                                {empCode} • {desig}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 text-xs font-black">
                            {getModuleIcon(req.workModule)}
                            {availableModules.find((m) => m.key === req.workModule)?.name || req.workModule}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 max-w-xs truncate text-slate-600">
                          {req.reason || <span className="text-slate-400 italic">No reason provided</span>}
                        </td>
                        <td className="py-3.5 px-4">
                          {req.status === 'APPROVED' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
                              <CheckCircle2 className="w-3 h-3" />
                              Approved
                            </span>
                          )}
                          {req.status === 'REJECTED' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-800 text-[10px] font-black">
                              <XCircle className="w-3 h-3" />
                              Rejected
                            </span>
                          )}
                          {req.status === 'PENDING' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black">
                              <Clock className="w-3 h-3" />
                              Pending Approval
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                          {new Date(req.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {req.status === 'PENDING' ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleApproveRequest(req.id)}
                                className="px-3 py-1 bg-[#23C45E] hover:bg-[#1AA14D] text-slate-950 font-black rounded-lg text-xs shadow-xs transition-colors cursor-pointer"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setRejectingRequestId(req.id);
                                  setRejectionReason('');
                                }}
                                className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-black rounded-lg text-xs transition-colors cursor-pointer"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-bold">Processed</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: RBAC SECURITY ROLES */}
      {activeTab === 'rbac-roles' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-black text-slate-900">RBAC System Roles & Permissions</h2>
              <p className="text-xs text-slate-500 font-medium">
                Configure higher-level administrative system permissions (CRM access, attendance verification, payroll).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roles.map((role) => (
              <div
                key={role.id}
                className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-extrabold text-slate-900 text-sm">{role.name}</span>
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        role.isSystem
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {role.isSystem ? 'System' : 'Custom'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium line-clamp-2">{role.description}</p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500">
                    {role.permissionsCount} RBAC Permissions
                  </span>
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(role)}
                    className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectingRequestId !== null && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">Reject Access Request</h3>
                <p className="text-xs text-slate-500">Provide an optional reason for the employee.</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Reason for Rejection</label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                placeholder="e.g. Camera gear / tool licenses are not allocated for this role..."
                className="w-full p-3 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectingRequestId(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectRequest}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/20"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RBAC Role Drawer with Granular UI Permissions */}
      <AdminFormDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={selectedRole ? `Edit Security Role: ${roleForm.name || selectedRole.name}` : "Create Security Role"}
        subtitle="Manage granular UI elements, screens, buttons, tabs, and widgets for this role"
        isSubmitting={isSubmitting}
        isLoading={isLoadingRolePerms}
        maxWidth="sm:max-w-[760px]"
        showFooter={true}
        onSave={handleSaveRole}
      >
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Role Title</label>
              <input
                type="text"
                value={roleForm.name}
                onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                placeholder="e.g. Telecaller / Sales Lead"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-[#23C45E]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Role Description</label>
              <input
                type="text"
                value={roleForm.description}
                onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                placeholder="Scope and purpose of this role..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-[#23C45E]"
              />
            </div>
          </div>

          {/* Quick Presets & Stats */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-slate-800">
                Selected: <span className="text-[#1AA14D] font-black">{rolePermissionsSet.size}</span> permissions
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAllPerms}
                className="px-2.5 py-1 text-[11px] font-bold bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg transition-colors cursor-pointer"
              >
                Select All
              </button>
              <button
                type="button"
                onClick={handleSelectReadOnlyPerms}
                className="px-2.5 py-1 text-[11px] font-bold bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg transition-colors cursor-pointer"
              >
                Read-Only
              </button>
              <button
                type="button"
                onClick={handleClearAllPerms}
                className="px-2.5 py-1 text-[11px] font-bold bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                Clear All
              </button>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2 overflow-x-auto">
            {(
              [
                { key: "screens", label: "1. Screens & Navigation" },
                { key: "actions", label: "2. Action Buttons" },
                { key: "tabs", label: "3. Tabs & Sections" },
                { key: "dashboard", label: "4. Dashboard Cards" },
                { key: "settings", label: "5. Settings Items" },
              ] as const
            ).map((t) => {
              const active = rbacSectionTab === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setRbacSectionTab(t.key)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                    active
                      ? "bg-[#23C45E] text-slate-950 shadow-xs"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Permissions List for Active Category */}
          <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
            {ALL_UI_PERMISSIONS.filter((g) => g.category === rbacSectionTab).map((group) => (
              <div key={group.group} className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {group.items.map((item) => {
                    const isChecked = rolePermissionsSet.has(item.key);
                    return (
                      <div
                        key={item.key}
                        onClick={() => handleTogglePermKey(item.key)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                          isChecked
                            ? "bg-[#E8F9EE] border-[#23C45E]/40 shadow-xs"
                            : "bg-white border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-extrabold text-slate-900">{item.label}</span>
                            <span className="text-[10px] font-mono font-bold text-slate-400">
                              {item.action}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 font-medium line-clamp-1 mt-0.5">
                            {item.description}
                          </p>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition-colors ${
                            isChecked
                              ? "bg-[#23C45E] border-[#23C45E] text-slate-950"
                              : "border-slate-300 bg-white"
                          }`}
                        >
                          {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </AdminFormDrawer>
    </div>
  );
}
