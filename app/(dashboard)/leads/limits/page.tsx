'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  UserCheck,
  Users,
  Search,
  RefreshCw,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  Sliders,
  RotateCcw,
  Sparkles,
  BarChart3,
  Calendar,
} from 'lucide-react';
import api from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  AdminPageHeader,
  AdminButton,
  AdminStatCard,
  AdminCard,
  AdminFormDrawer,
  AdminConfirmDialog,
  AdminSearchInput,
} from '@/components/admin';
import { getErrorMessage } from '@/lib/utils';

interface RoleLimitItem {
  id: number | null;
  roleName: string;
  dailyLimit: number;
  monthlyLimit: number;
  isActive: boolean;
  isCustom: boolean;
  updatedAt: string | null;
}

interface EmployeeLimitItem {
  employeeId: number;
  employeeCode: string;
  name: string;
  email: string;
  role: string;
  effectiveDailyLimit: number;
  effectiveMonthlyLimit: number;
  usedToday: number;
  remainingToday: number;
  usedThisMonth: number;
  remainingThisMonth: number;
  customDailyLimit: number | null;
  customMonthlyLimit: number | null;
  isCustom: boolean;
  roleDailyLimit: number;
  roleMonthlyLimit: number;
  roleIsActive: boolean;
}

export default function LeadGenerationLimitsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'roles' | 'employees'>('roles');
  const [searchQuery, setSearchQuery] = useState('');

  // Drawers & Dialogs State
  const [selectedRole, setSelectedRole] = useState<RoleLimitItem | null>(null);
  const [isRoleDrawerOpen, setIsRoleDrawerOpen] = useState(false);
  const [roleFormDaily, setRoleFormDaily] = useState(10);
  const [roleFormMonthly, setRoleFormMonthly] = useState(200);
  const [roleFormActive, setRoleFormActive] = useState(true);

  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeLimitItem | null>(null);
  const [isEmployeeDrawerOpen, setIsEmployeeDrawerOpen] = useState(false);
  const [empFormDaily, setEmpFormDaily] = useState<string>('');
  const [empFormMonthly, setEmpFormMonthly] = useState<string>('');

  const [employeeToReset, setEmployeeToReset] = useState<EmployeeLimitItem | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Queries
  const {
    data: roleLimits = [],
    isLoading: isLoadingRoles,
    refetch: refetchRoles,
  } = useQuery<RoleLimitItem[]>({
    queryKey: ['lead-limits-roles'],
    queryFn: async () => {
      const res = await api.get('/lead-generation-limits/roles');
      return Array.isArray(res.data) ? res.data : res.data?.data || [];
    },
  });

  const {
    data: employeeLimits = [],
    isLoading: isLoadingEmployees,
    refetch: refetchEmployees,
  } = useQuery<EmployeeLimitItem[]>({
    queryKey: ['lead-limits-employees'],
    queryFn: async () => {
      const res = await api.get('/lead-generation-limits/employees');
      return Array.isArray(res.data) ? res.data : res.data?.data || [];
    },
  });

  // Mutations
  const updateRoleMutation = useMutation({
    mutationFn: async (payload: { roleName: string; dailyLimit: number; monthlyLimit: number; isActive: boolean }) => {
      const res = await api.post('/lead-generation-limits/roles', payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Role lead limit updated successfully');
      setIsRoleDrawerOpen(false);
      queryClient.invalidateQueries({ queryKey: ['lead-limits-roles'] });
      queryClient.invalidateQueries({ queryKey: ['lead-limits-employees'] });
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err) || 'Failed to update role limit');
    },
  });

  const updateEmployeeMutation = useMutation({
    mutationFn: async (payload: { employeeId: number; dailyLimit: number | null; monthlyLimit: number | null }) => {
      const res = await api.put(`/lead-generation-limits/employees/${payload.employeeId}`, {
        dailyLimit: payload.dailyLimit,
        monthlyLimit: payload.monthlyLimit,
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Employee custom limit saved successfully');
      setIsEmployeeDrawerOpen(false);
      queryClient.invalidateQueries({ queryKey: ['lead-limits-employees'] });
      queryClient.invalidateQueries({ queryKey: ['lead-limits-roles'] });
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err) || 'Failed to update employee limit');
    },
  });

  const clearEmployeeMutation = useMutation({
    mutationFn: async (employeeId: number) => {
      const res = await api.delete(`/lead-generation-limits/employees/${employeeId}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Custom limits cleared; reverted to role default');
      setIsResetConfirmOpen(false);
      setEmployeeToReset(null);
      queryClient.invalidateQueries({ queryKey: ['lead-limits-employees'] });
      queryClient.invalidateQueries({ queryKey: ['lead-limits-roles'] });
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err) || 'Failed to reset employee limit');
    },
  });

  // Role Drawer Handler
  const handleOpenRoleEdit = (role: RoleLimitItem) => {
    setSelectedRole(role);
    setRoleFormDaily(role.dailyLimit);
    setRoleFormMonthly(role.monthlyLimit);
    setRoleFormActive(role.isActive);
    setIsRoleDrawerOpen(true);
  };

  const handleSaveRole = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!selectedRole) return;
    updateRoleMutation.mutate({
      roleName: selectedRole.roleName,
      dailyLimit: Number(roleFormDaily),
      monthlyLimit: Number(roleFormMonthly),
      isActive: roleFormActive,
    });
  };

  // Employee Drawer Handler
  const handleOpenEmployeeEdit = (emp: EmployeeLimitItem) => {
    setSelectedEmployee(emp);
    setEmpFormDaily(emp.customDailyLimit !== null ? String(emp.customDailyLimit) : '');
    setEmpFormMonthly(emp.customMonthlyLimit !== null ? String(emp.customMonthlyLimit) : '');
    setIsEmployeeDrawerOpen(true);
  };

  const handleSaveEmployee = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!selectedEmployee) return;

    const daily = empFormDaily.trim() === '' ? null : Number(empFormDaily);
    const monthly = empFormMonthly.trim() === '' ? null : Number(empFormMonthly);

    updateEmployeeMutation.mutate({
      employeeId: selectedEmployee.employeeId,
      dailyLimit: daily,
      monthlyLimit: monthly,
    });
  };

  // Filters & Stats
  const filteredRoles = useMemo(() => {
    if (!searchQuery.trim()) return roleLimits;
    const q = searchQuery.toLowerCase();
    return roleLimits.filter((r) => r.roleName.toLowerCase().includes(q));
  }, [roleLimits, searchQuery]);

  const filteredEmployees = useMemo(() => {
    if (!searchQuery.trim()) return employeeLimits;
    const q = searchQuery.toLowerCase();
    return employeeLimits.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.employeeCode.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        e.role.toLowerCase().includes(q),
    );
  }, [employeeLimits, searchQuery]);

  const totalUsedToday = useMemo(() => {
    return employeeLimits.reduce((acc, curr) => acc + (curr.usedToday || 0), 0);
  }, [employeeLimits]);

  const totalUsedThisMonth = useMemo(() => {
    return employeeLimits.reduce((acc, curr) => acc + (curr.usedThisMonth || 0), 0);
  }, [employeeLimits]);

  const customOverridesCount = useMemo(() => {
    return employeeLimits.filter((e) => e.isCustom).length;
  }, [employeeLimits]);

  const atLimitCount = useMemo(() => {
    return employeeLimits.filter((e) => e.remainingToday <= 0 || e.remainingThisMonth <= 0).length;
  }, [employeeLimits]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Standard Header */}
      <AdminPageHeader
        title="Lead Generation Limits"
        description="Manage daily and monthly lead generation quotas role-wise and configure custom employee overrides."
        icon={ShieldCheck}
        iconColor="text-blue-600"
        badge={{ text: 'Quotas & Limits', icon: ShieldCheck, variant: 'blue' }}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Leads & CRM', href: '/leads' },
          { label: 'Lead Limits' },
        ]}
        actions={
          <div className="flex items-center gap-2.5">
            <AdminButton
              variant="outline"
              size="md"
              icon={RefreshCw}
              onClick={() => {
                refetchRoles();
                refetchEmployees();
              }}
            >
              Refresh
            </AdminButton>
            <Link href="/leads">
              <AdminButton
                variant="primary"
                size="md"
                icon={UserCheck}
              >
                Back to Leads
              </AdminButton>
            </Link>
          </div>
        }
      />

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard
          title="Leads Generated Today"
          value={totalUsedToday}
          icon={Calendar}
          iconBg="blue"
          description="Total leads generated today (IST)"
        />
        <AdminStatCard
          title="Leads Generated Month"
          value={totalUsedThisMonth}
          icon={BarChart3}
          iconBg="primary"
          description="Total leads generated this month"
        />
        <AdminStatCard
          title="Custom Employee Overrides"
          value={customOverridesCount}
          icon={Sliders}
          iconBg="purple"
          description="Employees with custom quota"
        />
        <AdminStatCard
          title="Employees at Quota"
          value={atLimitCount}
          icon={AlertCircle}
          iconBg={atLimitCount > 0 ? 'amber' : 'primary'}
          description="Employees who reached daily/monthly limit"
        />
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('roles')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition ${
              activeTab === 'roles'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            Role-wise Limits ({roleLimits.length})
          </button>
          <button
            onClick={() => setActiveTab('employees')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition ${
              activeTab === 'employees'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            Employee-wise Limits & Usage ({employeeLimits.length})
          </button>
        </div>

        {/* Search */}
        <div className="w-full sm:w-72">
          <AdminSearchInput
            placeholder={activeTab === 'roles' ? 'Search roles...' : 'Search employee, code, role...'}
            value={searchQuery}
            onChange={setSearchQuery}
          />
        </div>
      </div>

      {/* TAB A: ROLE-WISE LIMITS */}
      {activeTab === 'roles' && (
        <AdminCard title="Role-wise Lead Generation Quotas" description="Define standard daily and monthly limits by role">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Role Name</th>
                  <th className="px-6 py-3.5">Daily Limit</th>
                  <th className="px-6 py-3.5">Monthly Limit</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Configuration</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {isLoadingRoles ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                      Loading role quotas...
                    </td>
                  </tr>
                ) : filteredRoles.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                      No roles found matching query.
                    </td>
                  </tr>
                ) : (
                  filteredRoles.map((role) => (
                    <tr key={role.roleName} className="hover:bg-slate-50/70 transition">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">{role.roleName}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200">
                          {role.dailyLimit} leads / day
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {role.monthlyLimit} leads / month
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {role.isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            Disabled
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {role.isCustom ? (
                          <span className="text-blue-600 font-semibold">Custom Configured</span>
                        ) : (
                          <span className="text-slate-400">System Default</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleOpenRoleEdit(role)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 transition"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          Configure
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </AdminCard>
      )}

      {/* TAB B: EMPLOYEE-WISE LIMITS & USAGE */}
      {activeTab === 'employees' && (
        <AdminCard
          title="Employee-wise Limits & Real-time Usage"
          description="Monitor current usage counts and configure custom employee quotas"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Employee</th>
                  <th className="px-6 py-3.5">Role</th>
                  <th className="px-6 py-3.5">Daily Quota (Today)</th>
                  <th className="px-6 py-3.5">Monthly Quota</th>
                  <th className="px-6 py-3.5">Quota Source</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {isLoadingEmployees ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                      Loading employee usage...
                    </td>
                  </tr>
                ) : filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                      No employees found.
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((emp) => {
                    const dailyPct =
                      emp.effectiveDailyLimit > 0
                        ? Math.min(100, Math.round((emp.usedToday / emp.effectiveDailyLimit) * 100))
                        : 100;
                    const monthlyPct =
                      emp.effectiveMonthlyLimit > 0
                        ? Math.min(100, Math.round((emp.usedThisMonth / emp.effectiveMonthlyLimit) * 100))
                        : 100;
                    const isDailyExhausted = emp.remainingToday <= 0;
                    const isMonthlyExhausted = emp.remainingThisMonth <= 0;

                    return (
                      <tr key={emp.employeeId} className="hover:bg-slate-50/70 transition">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs uppercase">
                              {emp.name.slice(0, 2)}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900">{emp.name}</div>
                              <div className="text-xs text-slate-400">
                                {emp.employeeCode} • {emp.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            {emp.role}
                          </span>
                        </td>
                        {/* Daily Quota */}
                        <td className="px-6 py-4">
                          <div className="space-y-1.5 w-44">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-500">
                                Used: <strong className="text-slate-900">{emp.usedToday}</strong> /{' '}
                                {emp.effectiveDailyLimit}
                              </span>
                              <span
                                className={`font-bold ${
                                  isDailyExhausted ? 'text-rose-600' : 'text-emerald-600'
                                }`}
                              >
                                {emp.remainingToday} left
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                  isDailyExhausted
                                    ? 'bg-rose-500'
                                    : dailyPct > 80
                                    ? 'bg-amber-500'
                                    : 'bg-emerald-500'
                                }`}
                                style={{ width: `${dailyPct}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        {/* Monthly Quota */}
                        <td className="px-6 py-4">
                          <div className="space-y-1.5 w-44">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-500">
                                Used: <strong className="text-slate-900">{emp.usedThisMonth}</strong> /{' '}
                                {emp.effectiveMonthlyLimit}
                              </span>
                              <span
                                className={`font-bold ${
                                  isMonthlyExhausted ? 'text-rose-600' : 'text-indigo-600'
                                }`}
                              >
                                {emp.remainingThisMonth} left
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                  isMonthlyExhausted
                                    ? 'bg-rose-500'
                                    : monthlyPct > 80
                                    ? 'bg-amber-500'
                                    : 'bg-indigo-500'
                                }`}
                                style={{ width: `${monthlyPct}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        {/* Quota Source */}
                        <td className="px-6 py-4 text-xs">
                          {emp.isCustom ? (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                                Custom Override
                              </span>
                              <div className="text-[10px] text-slate-400">
                                D: {emp.customDailyLimit ?? 'Role'} | M: {emp.customMonthlyLimit ?? 'Role'}
                              </div>
                            </div>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                              Role Default
                            </span>
                          )}
                        </td>
                        {/* Actions */}
                        <td className="px-6 py-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => handleOpenEmployeeEdit(emp)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              Custom Limit
                            </button>
                            {emp.isCustom && (
                              <button
                                onClick={() => {
                                  setEmployeeToReset(emp);
                                  setIsResetConfirmOpen(true);
                                }}
                                title="Reset to Role Default"
                                className="inline-flex items-center p-1.5 rounded-lg text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </AdminCard>
      )}

      {/* DRAWER: CONFIGURE ROLE LIMIT */}
      <AdminFormDrawer
        isOpen={isRoleDrawerOpen}
        onClose={() => setIsRoleDrawerOpen(false)}
        title={`Configure Limits: ${selectedRole?.roleName || ''}`}
        subtitle="Role limits serve as default quotas for all employees with this designation"
        onSave={handleSaveRole}
        saveLabel="Save Role Limit"
        isSubmitting={updateRoleMutation.isPending}
      >
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Daily Lead Generation Limit
            </label>
            <input
              type="number"
              min={0}
              required
              value={roleFormDaily}
              onChange={(e) => setRoleFormDaily(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden"
            />
            <p className="text-xs text-slate-500 mt-1">Maximum number of leads an employee can create per day.</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Monthly Lead Generation Limit
            </label>
            <input
              type="number"
              min={0}
              required
              value={roleFormMonthly}
              onChange={(e) => setRoleFormMonthly(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden"
            />
            <p className="text-xs text-slate-500 mt-1">Maximum number of leads an employee can create per month.</p>
          </div>

          <div className="pt-2 border-t border-slate-200">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <span className="text-sm font-semibold text-slate-900 block">Active Status</span>
                <span className="text-xs text-slate-500 block">
                  When disabled, employees with this role cannot generate new leads unless they have custom override.
                </span>
              </div>
              <input
                type="checkbox"
                checked={roleFormActive}
                onChange={(e) => setRoleFormActive(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
            </label>
          </div>
        </div>
      </AdminFormDrawer>

      {/* DRAWER: CONFIGURE EMPLOYEE OVERRIDE */}
      <AdminFormDrawer
        isOpen={isEmployeeDrawerOpen}
        onClose={() => setIsEmployeeDrawerOpen(false)}
        title={`Custom Limits: ${selectedEmployee?.name || ''}`}
        subtitle={`Role default for ${selectedEmployee?.role}: ${selectedEmployee?.roleDailyLimit} daily / ${selectedEmployee?.roleMonthlyLimit} monthly`}
        onSave={handleSaveEmployee}
        saveLabel="Apply Custom Limits"
        isSubmitting={updateEmployeeMutation.isPending}
      >
        <div className="space-y-5">
          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-xs text-blue-900 space-y-1">
            <div className="font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              Per-Field Override System
            </div>
            <p className="text-blue-700">
              Leave any field blank to automatically inherit that quota from the role default.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Custom Daily Limit
            </label>
            <input
              type="number"
              min={0}
              placeholder={`Inherit role default (${selectedEmployee?.roleDailyLimit ?? 10})`}
              value={empFormDaily}
              onChange={(e) => setEmpFormDaily(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden"
            />
            <p className="text-xs text-slate-500 mt-1">Leave empty to use role limit ({selectedEmployee?.roleDailyLimit}).</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Custom Monthly Limit
            </label>
            <input
              type="number"
              min={0}
              placeholder={`Inherit role default (${selectedEmployee?.roleMonthlyLimit ?? 200})`}
              value={empFormMonthly}
              onChange={(e) => setEmpFormMonthly(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden"
            />
            <p className="text-xs text-slate-500 mt-1">Leave empty to use role limit ({selectedEmployee?.roleMonthlyLimit}).</p>
          </div>
        </div>
      </AdminFormDrawer>

      {/* CONFIRM RESET DIALOG */}
      <AdminConfirmDialog
        isOpen={isResetConfirmOpen}
        title="Reset to Role Default Quota"
        description={`Are you sure you want to remove the custom quota for ${employeeToReset?.name}? This employee will inherit their role (${employeeToReset?.role}) default limit.`}
        confirmLabel="Reset Limits"
        variant="primary"
        onConfirm={() => {
          if (employeeToReset) {
            clearEmployeeMutation.mutate(employeeToReset.employeeId);
          }
        }}
        onClose={() => {
          setIsResetConfirmOpen(false);
          setEmployeeToReset(null);
        }}
        loading={clearEmployeeMutation.isPending}
      />
    </div>
  );
}
