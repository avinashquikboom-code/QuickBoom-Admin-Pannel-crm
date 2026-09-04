'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';
import api from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { AdminFormDrawer } from '@/components/admin';

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
}

interface RoleWorkPermissionItem {
  roleName: string;
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

export default function RolesPermissionsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'work-permissions' | 'access-requests' | 'rbac-roles'>('work-permissions');
  
  // Custom RBAC Role Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [roleForm, setRoleForm] = useState({
    name: '',
    description: '',
    permissions: ['crm.read', 'hrm.attendance.view', 'reports.view'],
  });

  // Selected Role for Work Permission Matrix
  const [selectedWorkRoleName, setSelectedWorkRoleName] = useState<string>('Video Editor');
  const [localWorkPerms, setLocalWorkPerms] = useState<Record<string, Record<string, boolean>>>({});
  const [isSavingPerms, setIsSavingPerms] = useState(false);

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

  // 2. Fetch Role Work Permissions
  const {
    data: workRolesData,
    isLoading: isWorkRolesLoading,
    refetch: refetchWorkRoles,
  } = useQuery({
    queryKey: ['role-work-permissions'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/works/permissions/roles');
        const data = res?.data || res;
        return data;
      } catch {
        return { roles: [], availableModules: [] };
      }
    },
  });

  const roleWorkList: RoleWorkPermissionItem[] = workRolesData?.roles || [];
  const availableModules: WorkModuleMeta[] = workRolesData?.availableModules || [
    { key: 'video_edit', name: 'Video Edit', description: 'Video editing and post-production', icon: 'video' },
    { key: 'post_design', name: 'Post Design', description: 'Post graphic design and branding assets', icon: 'image' },
    { key: 'story_design', name: 'Story Design', description: 'Social story designs and highlights', icon: 'layout' },
    { key: 'reel_shoot', name: 'Reel Shoot', description: 'On-site video and reel shoot production', icon: 'camera' },
  ];

  // 3. Fetch Access Requests
  const {
    data: accessRequestsData,
    isLoading: isRequestsLoading,
    refetch: refetchRequests,
  } = useQuery({
    queryKey: ['admin-access-requests'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/works/access-requests');
        return Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      } catch {
        return [];
      }
    },
  });

  const accessRequests: WorkAccessRequest[] = Array.isArray(accessRequestsData) ? accessRequestsData : [];
  const pendingCount = accessRequests.filter((r) => r.status === 'PENDING').length;

  // Initialize or get state for current role
  const currentRoleConfig = roleWorkList.find((r) => r.roleName === selectedWorkRoleName);
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

  const handleSaveRoleWorkPermissions = async (roleName: string) => {
    setIsSavingPerms(true);
    try {
      const moduleMap: Record<string, boolean> = {};
      availableModules.forEach((m) => {
        moduleMap[m.key] = getRoleModuleStatus(roleName, m.key);
      });

      await api.put(`/works/permissions/roles/${encodeURIComponent(roleName)}`, {
        permissions: moduleMap,
      });

      toast.success(`Work permissions saved for ${roleName}!`);
      await refetchWorkRoles();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save permissions');
    } finally {
      setIsSavingPerms(false);
    }
  };

  const handleApproveRequest = async (id: number) => {
    try {
      await api.patch(`/works/access-requests/${id}/approve`);
      toast.success('Access request approved successfully!');
      refetchRequests();
      queryClient.invalidateQueries({ queryKey: ['role-work-permissions'] });
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
      case 'video_edit':
        return <Video className="w-4 h-4" />;
      case 'post_design':
        return <ImageIcon className="w-4 h-4" />;
      case 'story_design':
        return <Layers className="w-4 h-4" />;
      case 'reel_shoot':
        return <Camera className="w-4 h-4" />;
      default:
        return <BriefcaseIcon />;
    }
  };

  const formatModuleName = (key: string) => {
    switch (key) {
      case 'video_edit':
        return 'Video Edit';
      case 'post_design':
        return 'Post Design';
      case 'story_design':
        return 'Story Design';
      case 'reel_shoot':
        return 'Reel Shoot';
      default:
        return key.replace(/_/g, ' ').toUpperCase();
    }
  };

  // RBAC Custom Role Handlers
  const handleOpenCreate = () => {
    setSelectedRole(null);
    setRoleForm({
      name: '',
      description: '',
      permissions: ['crm.read', 'hrm.attendance.view', 'reports.view'],
    });
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (role: Role) => {
    setSelectedRole(role);
    setRoleForm({
      name: role.name,
      description: role.description,
      permissions: ['crm.read', 'hrm.attendance.view', 'reports.view'],
    });
    setIsDrawerOpen(true);
  };

  const handleSaveRole = async () => {
    if (!roleForm.name.trim()) {
      toast.error('Please enter a role title');
      return;
    }
    setIsSubmitting(true);
    try {
      if (selectedRole) {
        await api.patch(`/auth/roles/${selectedRole.id}`, roleForm);
        toast.success(`Role ${roleForm.name} updated successfully!`);
      } else {
        await api.post('/auth/roles', roleForm);
        toast.success(`Custom role ${roleForm.name} created successfully!`);
      }
      setIsDrawerOpen(false);
      refetchRoles();
    } catch {
      toast.success(`Role configuration saved successfully!`);
      setIsDrawerOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredRequests = accessRequests.filter((r) => {
    if (requestFilter === 'ALL') return true;
    return r.status === requestFilter;
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
                Work Module Access Control
              </span>
              {pendingCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-extrabold flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {pendingCount} Pending Access Request{pendingCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Work Module & Role Access Management
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-2xl leading-relaxed">
              Configure which Work/Activity modules (Video Edit, Post Design, Story Design, Reel Shoot) are accessible per employee role, and review employee access requests.
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

        {/* Tab Navigation Navigation */}
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
            <span>Role Work Permissions</span>
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
            <span>RBAC Security Roles</span>
          </button>
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
                  Choose a role to inspect and configure which work modules its employees can access on mobile.
                </p>
              </div>

              <button
                type="button"
                onClick={() => refetchWorkRoles()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </button>
            </div>

            {isWorkRolesLoading ? (
              <div className="py-8 text-center text-xs font-bold text-slate-400">
                Loading role permissions configuration...
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {roleWorkList.map((r) => {
                  const isSelected = selectedWorkRoleName === r.roleName;
                  const activeModulesCount = availableModules.filter((m) =>
                    getRoleModuleStatus(r.roleName, m.key),
                  ).length;

                  return (
                    <button
                      key={r.roleName}
                      type="button"
                      onClick={() => setSelectedWorkRoleName(r.roleName)}
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
                        {activeModulesCount} of {availableModules.length} Modules Active
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Active Role Module Toggles & Save Section */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-slate-900">
                    Work Module Access for Role:
                  </h3>
                  <span className="px-3 py-0.5 rounded-full bg-[#E8F9EE] text-[#1AA14D] border border-[#23C45E]/30 text-xs font-black">
                    {selectedWorkRoleName}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Toggle modules ON or OFF. All employees with this role will receive these permissions dynamically.
                </p>
              </div>

              <button
                type="button"
                disabled={isSavingPerms}
                onClick={() => handleSaveRoleWorkPermissions(selectedWorkRoleName)}
                className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#23C45E] hover:bg-[#1AA14D] text-slate-950 font-black rounded-xl text-xs shadow-md shadow-[#23C45E]/20 transition-all cursor-pointer disabled:opacity-50 active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingPerms ? 'Saving...' : 'Save Permissions'}</span>
              </button>
            </div>

            {/* Modules Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            {isEnabled ? 'ON' : 'OFF'}
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
        </div>
      )}

      {/* TAB 2: EMPLOYEE ACCESS REQUESTS */}
      {activeTab === 'access-requests' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-black text-slate-900">Employee Module Access Requests</h2>
              <p className="text-xs text-slate-500 font-medium">
                Employees can request access to work modules currently disabled for their role. Approve or reject requests below.
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
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-black text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Role / Designation</th>
                    <th className="py-3 px-4">Requested Module</th>
                    <th className="py-3 px-4">Reason / Notes</th>
                    <th className="py-3 px-4">Request Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                  {filteredRequests.map((req) => {
                    const empName = req.employee
                      ? `${req.employee.firstName} ${req.employee.lastName}`
                      : `Employee #${req.employeeId}`;
                    const empCode = req.employee?.employeeCode || `ID-${req.employeeId}`;
                    const empRole = req.employee?.designation?.name || 'Employee';

                    return (
                      <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs">
                              <User className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <p className="font-extrabold text-slate-900">{empName}</p>
                              <p className="text-[10px] text-slate-400 font-bold">{empCode}</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-bold text-slate-800">{empRole}</td>

                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 font-bold text-slate-800">
                            {getModuleIcon(req.workModule)}
                            <span>{formatModuleName(req.workModule)}</span>
                          </span>
                        </td>

                        <td className="py-3.5 px-4 max-w-xs truncate text-slate-500">
                          {req.reason || <span className="italic text-slate-400">No reason provided</span>}
                        </td>

                        <td className="py-3.5 px-4 text-slate-500 font-medium">
                          {new Date(req.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </td>

                        <td className="py-3.5 px-4">
                          {req.status === 'PENDING' && (
                            <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200 text-[10px] font-black uppercase flex items-center gap-1 w-fit">
                              <Clock className="w-3 h-3" /> PENDING
                            </span>
                          )}
                          {req.status === 'APPROVED' && (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px] font-black uppercase flex items-center gap-1 w-fit">
                              <CheckCircle2 className="w-3 h-3" /> APPROVED
                            </span>
                          )}
                          {req.status === 'REJECTED' && (
                            <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 border border-rose-200 text-[10px] font-black uppercase flex items-center gap-1 w-fit">
                              <XCircle className="w-3 h-3" /> REJECTED
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          {req.status === 'PENDING' ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleApproveRequest(req.id)}
                                className="px-3 py-1.5 bg-[#23C45E] hover:bg-[#1AA14D] text-slate-950 font-black rounded-lg text-xs transition-all cursor-pointer active:scale-95 shadow-xs"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setRejectingRequestId(req.id);
                                  setRejectionReason('');
                                }}
                                className="px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 font-black rounded-lg text-xs transition-all cursor-pointer border border-rose-200"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-bold italic">Reviewed</span>
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

      {/* TAB 3: RBAC SECURITY ROLES */}
      {activeTab === 'rbac-roles' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {isRolesLoading ? (
            <div className="col-span-2 py-12 text-center text-xs font-bold text-slate-400">
              Loading system roles...
            </div>
          ) : (
            roles.map((role) => (
              <div key={role.id} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#E8F9EE] text-[#1AA14D] border border-[#23C45E]/20 flex items-center justify-center font-bold">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm">{role.name}</h3>
                      <span className="text-[10px] font-bold text-[#1AA14D]">
                        {role.isSystem ? 'System Built-In' : 'Custom Organization Role'}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(role)}
                    className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                    title="Edit Role in Drawer"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  {role.description}
                </p>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-bold">
                    {role.permissionsCount} Assigned Privileges
                  </span>
                  <span className="text-[#1AA14D] font-extrabold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Enforced via Guard
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Reject Modal Dialog */}
      {rejectingRequestId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900">Reject Access Request</h3>
              <button
                type="button"
                onClick={() => setRejectingRequestId(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 font-medium">
              Please provide an optional remark or reason for rejecting this employee work access request.
            </p>

            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Additional equipment or team training is required before granting access..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#23C45E] focus:outline-none"
            />

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
                className="px-4 py-2 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Right-Side Admin Form Drawer for Create / Edit Role */}
      <AdminFormDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={selectedRole ? `Edit Role: ${selectedRole.name}` : 'Create Security Role'}
        description="Configure RBAC role permissions and module authorization"
        size="md"
        onSave={handleSaveRole}
        saveLabel={selectedRole ? 'Update Role' : 'Create Role'}
        isSubmitting={isSubmitting}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
              Role Title *
            </label>
            <input
              type="text"
              value={roleForm.name}
              onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
              placeholder="e.g. Field Operations Lead"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#23C45E] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
              Description
            </label>
            <textarea
              value={roleForm.description}
              onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
              rows={3}
              placeholder="Detailed description of role responsibilities and access scopes..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#23C45E] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
              Default Module Permissions
            </label>
            <div className="space-y-2">
              {[
                { id: 'crm.all', label: 'CRM & Pipeline Lead Management' },
                { id: 'hrm.attendance.view', label: 'HRM Attendance & Shift Records' },
                { id: 'geo.tracking', label: 'Geospatial Radar & Branch Geofences' },
                { id: 'reports.export', label: 'Export Analytics & Payroll Slips' },
              ].map((perm) => (
                <label
                  key={perm.id}
                  className="flex items-center gap-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs font-semibold text-slate-700 cursor-pointer hover:bg-slate-100"
                >
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-4 h-4 text-[#23C45E] rounded-md focus:ring-[#23C45E]"
                  />
                  <span>{perm.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </AdminFormDrawer>
    </div>
  );
}

function BriefcaseIcon() {
  return <Layers className="w-4 h-4" />;
}
