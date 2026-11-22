'use client';

import * as React from 'react';
import { PageTitleCard } from '@/components/common/PageTitleCard';
import {
  Users,
  ShieldCheck,
  Clock,
  Calendar,
  Search,
  RotateCcw,
  Plus,
  Edit,
  Trash2,
  Check,
  X,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Layers,
  Sparkles,
  UserCheck,
  Sliders,
  CheckCircle2,
  XCircle,
  Eye,
  Settings,
  HelpCircle,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { FormDrawer } from '@/components/common/drawers/FormDrawer';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { toast } from '@/hooks/use-toast';
import {
  loadLeadLimits,
  saveEmployeeLimit,
  clearEmployeeLimit,
  saveRoleLimit,
  sessionCan,
  crmError,
} from '@/modules/crm/crm-api';
import { cn } from '@/lib/utils';

export default function LeadLimitsRoute() {
  const [employees, setEmployees] = React.useState([]);
  const [roles, setRoles] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [refresh, setRefresh] = React.useState(0);
  const [allowed, setAllowed] = React.useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = React.useState('employees'); // 'employees' | 'roles'

  // Search & Filters
  const [searchTerm, setSearchTerm] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Set Role Form State
  const [roleForm, setRoleForm] = React.useState({
    roleName: '',
    dailyLimit: '',
    monthlyLimit: '',
    isActive: true,
  });
  const [savingRole, setSavingRole] = React.useState(false);

  // Custom Employee Limit Modal State
  const [editingEmployee, setEditingEmployee] = React.useState(null);
  const [customDaily, setCustomDaily] = React.useState('');
  const [customMonthly, setCustomMonthly] = React.useState('');
  const [savingEmployeeLimit, setSavingEmployeeLimit] = React.useState(false);

  // Sorting
  const [sortKey, setSortKey] = React.useState('name');
  const [sortDir, setSortDir] = React.useState('asc');

  // Pagination
  const [currentPage, setCurrentPage] = React.useState(1);
  const [rowsPerPage, setRowsPerPage] = React.useState(20);

  // Load Permissions
  React.useEffect(() => {
    setAllowed(sessionCan('LEAD') || sessionCan('CRM'));
  }, []);

  // Fetch Data
  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const result = await loadLeadLimits();
      const emps = Array.isArray(result?.employees) ? result.employees : [];
      const rls = Array.isArray(result?.roles) ? result.roles : [];
      setEmployees(emps);
      setRoles(rls);
      setError('');

      // Pre-select first role in the form if none selected
      if (!roleForm.roleName && rls.length > 0) {
        const first = rls[0];
        setRoleForm({
          roleName: first.roleName || first.name || '',
          dailyLimit: String(first.dailyLimit ?? 10),
          monthlyLimit: String(first.monthlyLimit ?? 200),
          isActive: first.isActive !== false,
        });
      }
    } catch (err) {
      setError(crmError(err));
    } finally {
      setLoading(false);
    }
  }, [roleForm.roleName]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData, refresh]);

  // KPI Calculations
  const totalEmployees = employees.length;
  const activeRolesCount = roles.filter((r) => r.isActive !== false).length;
  const totalDailyLimit = employees.reduce(
    (sum, emp) => sum + (Number(emp.effectiveDailyLimit) || 0),
    0
  );
  const totalMonthlyLimit = employees.reduce(
    (sum, emp) => sum + (Number(emp.effectiveMonthlyLimit) || 0),
    0
  );

  // Handle Role Selection change in config card
  const handleRoleSelect = (roleName) => {
    const found = roles.find(
      (r) => (r.roleName || r.name)?.toLowerCase() === roleName.toLowerCase()
    );
    if (found) {
      setRoleForm({
        roleName: found.roleName || found.name || roleName,
        dailyLimit: String(found.dailyLimit ?? 10),
        monthlyLimit: String(found.monthlyLimit ?? 200),
        isActive: found.isActive !== false,
      });
    } else {
      setRoleForm({
        roleName,
        dailyLimit: '10',
        monthlyLimit: '200',
        isActive: true,
      });
    }
  };

  // Submit Role Limit Form
  const handleSaveRole = async (e) => {
    e.preventDefault();
    if (!roleForm.roleName.trim()) {
      toast.error('Role name is required.');
      return;
    }
    const daily = Number(roleForm.dailyLimit);
    const monthly = Number(roleForm.monthlyLimit);

    if (Number.isNaN(daily) || daily < 0) {
      toast.error('Daily limit must be 0 or a positive number.');
      return;
    }
    if (Number.isNaN(monthly) || monthly < 0) {
      toast.error('Monthly limit must be 0 or a positive number.');
      return;
    }
    if (monthly < daily) {
      toast.error('Monthly limit should be greater than or equal to Daily limit.');
      return;
    }

    setSavingRole(true);
    try {
      await saveRoleLimit({
        roleName: roleForm.roleName.trim(),
        dailyLimit: daily,
        monthlyLimit: monthly,
        isActive: roleForm.isActive,
      });
      toast.success(`Role limit for "${roleForm.roleName}" saved successfully`);
      setRefresh((v) => v + 1);
    } catch (err) {
      toast.error(crmError(err));
    } finally {
      setSavingRole(false);
    }
  };

  // Open Edit Custom Limit Drawer for Employee
  const handleOpenEmployeeEdit = (emp) => {
    setEditingEmployee(emp);
    setCustomDaily(emp.customDailyLimit !== null && emp.customDailyLimit !== undefined ? String(emp.customDailyLimit) : '');
    setCustomMonthly(emp.customMonthlyLimit !== null && emp.customMonthlyLimit !== undefined ? String(emp.customMonthlyLimit) : '');
  };

  // Save Custom Employee Limit Override
  const handleSaveEmployeeOverride = async (e) => {
    e.preventDefault();
    if (!editingEmployee) return;

    const daily = customDaily === '' ? null : Number(customDaily);
    const monthly = customMonthly === '' ? null : Number(customMonthly);

    if (daily !== null && (Number.isNaN(daily) || daily < 0)) {
      toast.error('Custom daily limit must be a positive number.');
      return;
    }
    if (monthly !== null && (Number.isNaN(monthly) || monthly < 0)) {
      toast.error('Custom monthly limit must be a positive number.');
      return;
    }
    if (daily !== null && monthly !== null && monthly < daily) {
      toast.error('Monthly limit cannot be less than daily limit.');
      return;
    }

    setSavingEmployeeLimit(true);
    try {
      await saveEmployeeLimit(editingEmployee.employeeId, {
        dailyLimit: daily,
        monthlyLimit: monthly,
      });
      toast.success(`Updated custom limits for ${editingEmployee.name}`);
      setEditingEmployee(null);
      setRefresh((v) => v + 1);
    } catch (err) {
      toast.error(crmError(err));
    } finally {
      setSavingEmployeeLimit(false);
    }
  };

  // Clear Custom Employee Limit (Revert to Role Default)
  const handleClearEmployeeOverride = async () => {
    if (!editingEmployee) return;
    setSavingEmployeeLimit(true);
    try {
      await clearEmployeeLimit(editingEmployee.employeeId);
      toast.success(`Reverted ${editingEmployee.name} to role default limits`);
      setEditingEmployee(null);
      setRefresh((v) => v + 1);
    } catch (err) {
      toast.error(crmError(err));
    } finally {
      setSavingEmployeeLimit(false);
    }
  };

  // Filtered & Sorted Employees
  const filteredEmployees = React.useMemo(() => {
    return employees.filter((emp) => {
      if (!debouncedSearch) return true;
      const q = debouncedSearch.toLowerCase();
      const matchName = (emp.name || '').toLowerCase().includes(q);
      const matchCode = (emp.employeeCode || '').toLowerCase().includes(q);
      const matchRole = (emp.role || '').toLowerCase().includes(q);
      return matchName || matchCode || matchRole;
    });
  }, [employees, debouncedSearch]);

  const sortedEmployees = React.useMemo(() => {
    return [...filteredEmployees].sort((a, b) => {
      let valA = a[sortKey];
      let valB = b[sortKey];

      if (sortKey === 'name') {
        valA = String(a.name || '').toLowerCase();
        valB = String(b.name || '').toLowerCase();
      } else if (sortKey === 'role') {
        valA = String(a.role || '').toLowerCase();
        valB = String(b.role || '').toLowerCase();
      } else if (
        [
          'effectiveDailyLimit',
          'usedToday',
          'remainingToday',
          'effectiveMonthlyLimit',
          'usedThisMonth',
          'remainingThisMonth',
        ].includes(sortKey)
      ) {
        valA = Number(a[sortKey]) || 0;
        valB = Number(b[sortKey]) || 0;
        return sortDir === 'asc' ? valA - valB : valB - valA;
      }
      valA = String(valA || '');
      valB = String(valB || '');
      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredEmployees, sortKey, sortDir]);

  // Paginated Employees
  const totalEmployeePages = Math.max(1, Math.ceil(sortedEmployees.length / rowsPerPage));
  const paginatedEmployees = sortedEmployees.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  // Filtered Roles
  const filteredRoles = React.useMemo(() => {
    return roles.filter((r) => {
      if (!debouncedSearch) return true;
      const q = debouncedSearch.toLowerCase();
      return (r.roleName || r.name || '').toLowerCase().includes(q);
    });
  }, [roles, debouncedSearch]);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  return (
    <div className="space-y-6 pb-28 w-full min-w-0">
      {/* 1. Page Title Card */}
      <PageTitleCard
        moduleName="CRM"
        breadcrumb="Lead Limits"
        title="Lead Limits"
        description="Configure role quotas, track real-time daily/monthly usage, and enforce authorized lead-generation capacity."
        icon={ShieldCheck}
        badge={`${totalEmployees} Employees Active`}
        badgeVariant="green"
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRefresh((v) => v + 1)}
            disabled={loading}
            className="h-10 gap-1.5 rounded-xl border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:border-emerald-200 hover:text-[#173D30] shadow-2xs"
          >
            <RotateCcw className={cn('size-3.5 text-slate-500', loading && 'animate-spin')} />
            <span>Refresh</span>
          </Button>
        }
      />

      {/* 2. Four Dashboard KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Total Employees */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-600">Total Employees</span>
            <div className="size-8 rounded-xl bg-emerald-50 text-[#173D30] flex items-center justify-center border border-emerald-200">
              <Users className="size-4 text-[#20C466]" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-[#173D30] tracking-tight">
              {totalEmployees}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Active team members tracked</p>
          </div>
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#20C466]" />
        </div>

        {/* Card 2: Active Roles */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-600">Active Roles</span>
            <div className="size-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200">
              <ShieldCheck className="size-4 text-blue-600" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {activeRolesCount}{' '}
              <span className="text-sm font-semibold text-slate-400">/ {roles.length}</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Role limit quotas defined</p>
          </div>
          <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500" />
        </div>

        {/* Card 3: Total Daily Limit */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-600">Total Daily Limit</span>
            <div className="size-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-200">
              <Clock className="size-4 text-purple-600" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {totalDailyLimit.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Combined daily generation quota</p>
          </div>
          <div className="absolute top-0 left-0 right-0 h-1 bg-purple-500" />
        </div>

        {/* Card 4: Total Monthly Limit */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-600">Total Monthly Limit</span>
            <div className="size-8 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-200">
              <Calendar className="size-4 text-[#16A34A]" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-[#16A34A] tracking-tight">
              {totalMonthlyLimit.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Combined monthly generation quota</p>
          </div>
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#16A34A]" />
        </div>
      </div>

      {/* 3. Set Role Lead Limit Configuration Section */}
      {allowed && (
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-[#173D30] border border-emerald-200">
                <Sliders className="size-4 text-[#20C466]" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Set Role Lead Limit</h2>
                <p className="text-xs text-slate-500">
                  Select a role to configure or update the default daily and monthly lead-generation quotas.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSaveRole} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">Select Role</Label>
              <select
                aria-label="Select Role"
                value={roleForm.roleName}
                onChange={(e) => handleRoleSelect(e.target.value)}
                className="h-9 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#173D30]"
              >
                {roles.map((r) => {
                  const name = r.roleName || r.name;
                  return (
                    <option key={r.id || name} value={name}>
                      {name} {r.isActive === false ? '(Inactive)' : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">Daily Limit</Label>
              <Input
                type="number"
                min="0"
                required
                value={roleForm.dailyLimit}
                onChange={(e) => setRoleForm({ ...roleForm, dailyLimit: e.target.value })}
                placeholder="e.g. 10"
                className="h-9 text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">Monthly Limit</Label>
              <Input
                type="number"
                min="0"
                required
                value={roleForm.monthlyLimit}
                onChange={(e) => setRoleForm({ ...roleForm, monthlyLimit: e.target.value })}
                placeholder="e.g. 200"
                className="h-9 text-xs rounded-xl"
              />
            </div>

            <div>
              <Button
                type="submit"
                disabled={savingRole}
                className="h-9 w-full rounded-xl bg-[#173D30] hover:bg-[#123026] text-white text-xs font-semibold gap-1.5 shadow-xs"
              >
                <Check className="size-3.5 text-[#20C466]" />
                <span>{savingRole ? 'Saving...' : 'Save Role Limit'}</span>
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* 4. Main Section: Two-Column Responsive Layout with Exact Vertical Alignment */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,69fr)_minmax(0,31fr)] gap-5 items-start">
        {/* Left Column (approx 69% width): Employee & Role Limits Tabbed Table Card */}
        <div className="rounded-2xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden flex flex-col">
          {/* Header & Controls: Horizontally Aligned Tabs & Search */}
          <div className="min-h-16 px-4 py-3 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0">
            {/* Tab bar */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('employees');
                  setCurrentPage(1);
                }}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                  activeTab === 'employees'
                    ? 'bg-white text-[#173D30] shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                )}
              >
                <Users className="size-3.5" />
                <span>Employee Limits</span>
                <span className="min-w-4 px-1.5 h-4 rounded-full bg-emerald-50 text-[#173D30] text-[10px] font-bold flex items-center justify-center border border-emerald-200">
                  {employees.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('roles');
                  setCurrentPage(1);
                }}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                  activeTab === 'roles'
                    ? 'bg-white text-[#173D30] shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                )}
              >
                <ShieldCheck className="size-3.5" />
                <span>Role Limits</span>
                <span className="min-w-4 px-1.5 h-4 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center">
                  {roles.length}
                </span>
              </button>
            </div>

            {/* Search input: Vertically centered with tabs */}
            <div className="relative w-full sm:w-64 shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400 pointer-events-none" />
              <Input
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder={
                  activeTab === 'employees'
                    ? 'Search by name, ID or role...'
                    : 'Search by role name...'
                }
                className="pl-8.5 pr-8 h-8.5 text-xs rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setCurrentPage(1);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>
          </div>

          {/* TAB 1: EMPLOYEE LIMITS TABLE */}
          {activeTab === 'employees' && (
            <div>
              {loading ? (
                <div className="w-full overflow-x-auto min-w-0">
                  <table className="w-full text-left text-xs text-slate-700 border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-semibold text-slate-600">
                        <th className="py-3 px-3.5">Employee</th>
                        <th className="py-3 px-3">Role</th>
                        <th className="py-3 px-3">Daily Limit</th>
                        <th className="py-3 px-3">Used Today</th>
                        <th className="py-3 px-3">Remaining Today</th>
                        <th className="py-3 px-3">Monthly Limit</th>
                        <th className="py-3 px-3">Used This Month</th>
                        <th className="py-3 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <tr key={i} className="animate-pulse">
                          <td className="py-3.5 px-3.5">
                            <div className="h-3.5 w-28 bg-slate-200 rounded" />
                          </td>
                          <td className="py-3.5 px-3">
                            <div className="h-3 w-20 bg-slate-200 rounded" />
                          </td>
                          <td className="py-3.5 px-3">
                            <div className="h-4 w-12 bg-slate-200 rounded" />
                          </td>
                          <td className="py-3.5 px-3">
                            <div className="h-4 w-10 bg-slate-200 rounded" />
                          </td>
                          <td className="py-3.5 px-3">
                            <div className="h-4 w-12 bg-slate-200 rounded" />
                          </td>
                          <td className="py-3.5 px-3">
                            <div className="h-4 w-12 bg-slate-200 rounded" />
                          </td>
                          <td className="py-3.5 px-3">
                            <div className="h-4 w-10 bg-slate-200 rounded" />
                          </td>
                          <td className="py-3.5 px-3 text-right">
                            <div className="h-6 w-16 bg-slate-200 rounded ml-auto" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : error ? (
                <div className="p-10 text-center text-xs text-rose-700 bg-rose-50/50 space-y-2">
                  <AlertTriangle className="size-6 text-rose-500 mx-auto" />
                  <p className="font-semibold">{error}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRefresh((v) => v + 1)}
                    className="mt-2 text-xs"
                  >
                    Retry
                  </Button>
                </div>
              ) : paginatedEmployees.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-500 space-y-2">
                  <Users className="size-8 text-slate-300 mx-auto" />
                  <p className="font-semibold text-slate-700">No employees match this search</p>
                  <p className="text-[11px] text-slate-400">
                    Try adjusting the search query to find employees.
                  </p>
                </div>
              ) : (
                <div className="w-full overflow-x-auto min-w-0">
                  <table className="w-full text-left text-xs text-slate-700 border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-semibold text-slate-600 select-none">
                        <th
                          className="py-3 px-3.5 cursor-pointer hover:text-slate-900 transition-colors min-w-[170px]"
                          onClick={() => handleSort('name')}
                        >
                          <span className="flex items-center gap-1.5">
                            <span>Employee</span>
                            {sortKey === 'name' ? (
                              sortDir === 'asc' ? (
                                <ArrowUp className="size-3 text-[#173D30]" />
                              ) : (
                                <ArrowDown className="size-3 text-[#173D30]" />
                              )
                            ) : (
                              <ArrowUpDown className="size-3 text-slate-400" />
                            )}
                          </span>
                        </th>

                        <th
                          className="py-3 px-3 cursor-pointer hover:text-slate-900 transition-colors min-w-[130px]"
                          onClick={() => handleSort('role')}
                        >
                          <span className="flex items-center gap-1.5">
                            <span>Role</span>
                            {sortKey === 'role' ? (
                              sortDir === 'asc' ? (
                                <ArrowUp className="size-3 text-[#173D30]" />
                              ) : (
                                <ArrowDown className="size-3 text-[#173D30]" />
                              )
                            ) : (
                              <ArrowUpDown className="size-3 text-slate-400" />
                            )}
                          </span>
                        </th>

                        <th
                          className="py-3 px-3 cursor-pointer hover:text-slate-900 transition-colors min-w-[95px]"
                          onClick={() => handleSort('effectiveDailyLimit')}
                        >
                          <span className="flex items-center gap-1.5">
                            <span>Daily Limit</span>
                            {sortKey === 'effectiveDailyLimit' ? (
                              sortDir === 'asc' ? (
                                <ArrowUp className="size-3 text-[#173D30]" />
                              ) : (
                                <ArrowDown className="size-3 text-[#173D30]" />
                              )
                            ) : (
                              <ArrowUpDown className="size-3 text-slate-400" />
                            )}
                          </span>
                        </th>

                        <th
                          className="py-3 px-3 cursor-pointer hover:text-slate-900 transition-colors min-w-[95px]"
                          onClick={() => handleSort('usedToday')}
                        >
                          <span className="flex items-center gap-1.5">
                            <span>Used Today</span>
                            {sortKey === 'usedToday' ? (
                              sortDir === 'asc' ? (
                                <ArrowUp className="size-3 text-[#173D30]" />
                              ) : (
                                <ArrowDown className="size-3 text-[#173D30]" />
                              )
                            ) : (
                              <ArrowUpDown className="size-3 text-slate-400" />
                            )}
                          </span>
                        </th>

                        <th
                          className="py-3 px-3 cursor-pointer hover:text-slate-900 transition-colors min-w-[110px]"
                          onClick={() => handleSort('remainingToday')}
                        >
                          <span className="flex items-center gap-1.5">
                            <span>Remaining Today</span>
                            {sortKey === 'remainingToday' ? (
                              sortDir === 'asc' ? (
                                <ArrowUp className="size-3 text-[#173D30]" />
                              ) : (
                                <ArrowDown className="size-3 text-[#173D30]" />
                              )
                            ) : (
                              <ArrowUpDown className="size-3 text-slate-400" />
                            )}
                          </span>
                        </th>

                        <th
                          className="py-3 px-3 cursor-pointer hover:text-slate-900 transition-colors min-w-[100px]"
                          onClick={() => handleSort('effectiveMonthlyLimit')}
                        >
                          <span className="flex items-center gap-1.5">
                            <span>Monthly Limit</span>
                            {sortKey === 'effectiveMonthlyLimit' ? (
                              sortDir === 'asc' ? (
                                <ArrowUp className="size-3 text-[#173D30]" />
                              ) : (
                                <ArrowDown className="size-3 text-[#173D30]" />
                              )
                            ) : (
                              <ArrowUpDown className="size-3 text-slate-400" />
                            )}
                          </span>
                        </th>

                        <th
                          className="py-3 px-3 cursor-pointer hover:text-slate-900 transition-colors min-w-[110px]"
                          onClick={() => handleSort('usedThisMonth')}
                        >
                          <span className="flex items-center gap-1.5">
                            <span>Used This Month</span>
                            {sortKey === 'usedThisMonth' ? (
                              sortDir === 'asc' ? (
                                <ArrowUp className="size-3 text-[#173D30]" />
                              ) : (
                                <ArrowDown className="size-3 text-[#173D30]" />
                              )
                            ) : (
                              <ArrowUpDown className="size-3 text-slate-400" />
                            )}
                          </span>
                        </th>

                        <th className="py-3 px-3 text-right min-w-[95px]">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paginatedEmployees.map((emp) => {
                        const initial = (emp.name || 'E')[0]?.toUpperCase();
                        const isDailyExhausted = emp.remainingToday <= 0;

                        return (
                          <tr
                            key={emp.employeeId}
                            className="hover:bg-slate-50/70 transition-colors"
                          >
                            {/* 1. Employee */}
                            <td className="py-3 px-3.5">
                              <div className="flex items-center gap-2.5">
                                <span className="flex size-7 items-center justify-center rounded-full bg-emerald-50 text-[10px] font-bold text-[#173D30] border border-emerald-200 shrink-0">
                                  {initial}
                                </span>
                                <div className="min-w-0">
                                  <p className="font-bold text-slate-900 text-xs truncate">
                                    {emp.name}
                                  </p>
                                  <p className="text-[10px] text-slate-400 font-mono">
                                    {emp.employeeCode || `ID #${emp.employeeId}`}
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* 2. Role */}
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 whitespace-nowrap">
                                  {emp.role}
                                </span>
                                {emp.isCustom && (
                                  <span
                                    className="inline-flex rounded bg-purple-50 text-purple-700 border border-purple-200 px-1.5 py-0.2 text-[9px] font-bold"
                                    title="Custom quota configured for this employee"
                                  >
                                    Custom
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* 3. Daily Limit */}
                            <td className="py-3 px-3 font-semibold text-slate-800">
                              {emp.effectiveDailyLimit}
                            </td>

                            {/* 4. Used Today */}
                            <td className="py-3 px-3 text-slate-700">
                              <span className="font-medium">{emp.usedToday}</span>
                            </td>

                            {/* 5. Remaining Today */}
                            <td className="py-3 px-3">
                              <span
                                className={cn(
                                  'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border shadow-2xs',
                                  isDailyExhausted
                                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                )}
                              >
                                <span
                                  className={cn(
                                    'size-1.5 rounded-full',
                                    isDailyExhausted ? 'bg-rose-500' : 'bg-emerald-500'
                                  )}
                                />
                                {emp.remainingToday}
                              </span>
                            </td>

                            {/* 6. Monthly Limit */}
                            <td className="py-3 px-3 font-semibold text-slate-800">
                              {emp.effectiveMonthlyLimit}
                            </td>

                            {/* 7. Used This Month */}
                            <td className="py-3 px-3 text-slate-700">
                              <span className="font-medium">{emp.usedThisMonth}</span>
                            </td>

                            {/* 8. Actions */}
                            <td className="py-3 px-3 text-right">
                              {allowed && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleOpenEmployeeEdit(emp)}
                                  className="h-7 text-[11px] px-2 gap-1 border-slate-200 text-slate-700 hover:text-[#173D30] hover:bg-slate-50"
                                >
                                  <Edit className="size-3" />
                                  <span>Set Limit</span>
                                </Button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination Footer inside Employee card */}
              <div className="px-4 py-3 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
                <div className="flex items-center gap-3 flex-wrap">
                  <div>
                    Showing{' '}
                    <span className="font-semibold text-slate-800">
                      {sortedEmployees.length === 0
                        ? 0
                        : (currentPage - 1) * rowsPerPage + 1}
                    </span>{' '}
                    to{' '}
                    <span className="font-semibold text-slate-800">
                      {Math.min(currentPage * rowsPerPage, sortedEmployees.length)}
                    </span>{' '}
                    of{' '}
                    <span className="font-semibold text-slate-800">
                      {sortedEmployees.length}
                    </span>{' '}
                    employees
                  </div>

                  <div className="flex items-center gap-1.5 border-l border-slate-200 pl-3">
                    <span>Rows per page:</span>
                    <select
                      aria-label="Rows per page"
                      value={rowsPerPage}
                      onChange={(e) => {
                        setRowsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="h-7 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#173D30]"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                    className="h-8 gap-1 rounded-lg text-xs border-slate-200 text-slate-700 hover:text-[#173D30]"
                  >
                    <ChevronLeft className="size-3.5" />
                    <span>Previous</span>
                  </Button>

                  <span className="px-2 font-medium text-slate-700">
                    Page {currentPage} of {totalEmployeePages}
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= totalEmployeePages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                    className="h-8 gap-1 rounded-lg text-xs border-slate-200 text-slate-700 hover:text-[#173D30]"
                  >
                    <span>Next</span>
                    <ChevronRight className="size-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ROLE LIMITS TABLE */}
          {activeTab === 'roles' && (
            <div className="w-full overflow-x-auto min-w-0">
              <table className="w-full text-left text-xs text-slate-700 border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-semibold text-slate-600">
                    <th className="py-3 px-3.5 min-w-[160px]">Role Name</th>
                    <th className="py-3 px-3 min-w-[110px]">Daily Limit</th>
                    <th className="py-3 px-3 min-w-[110px]">Monthly Limit</th>
                    <th className="py-3 px-3 min-w-[100px]">Status</th>
                    <th className="py-3 px-3 text-right min-w-[110px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRoles.map((r) => {
                    const name = r.roleName || r.name;
                    const isActive = r.isActive !== false;

                    return (
                      <tr key={r.id || name} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-3.5">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="size-4 text-[#20C466]" />
                            <div>
                              <p className="font-bold text-slate-900 text-xs">{name}</p>
                              {r.isCustom && (
                                <span className="text-[10px] text-slate-400">
                                  Custom configured
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-3 font-semibold text-slate-800">
                          {r.dailyLimit} leads/day
                        </td>

                        <td className="py-3.5 px-3 font-semibold text-slate-800">
                          {r.monthlyLimit} leads/month
                        </td>

                        <td className="py-3.5 px-3">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border shadow-2xs',
                              isActive
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            )}
                          >
                            <span
                              className={cn(
                                'size-1.5 rounded-full',
                                isActive ? 'bg-emerald-500' : 'bg-slate-400'
                              )}
                            />
                            {isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>

                        <td className="py-3.5 px-3 text-right">
                          {allowed && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRoleSelect(name)}
                              className="h-7 text-[11px] px-2.5 gap-1 border-slate-200 text-slate-700 hover:text-[#173D30] hover:bg-slate-50"
                            >
                              <Edit className="size-3" />
                              <span>Edit Quota</span>
                            </Button>
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

        {/* Right Column (approx 31% width): Role Limits Presets Panel */}
        <div className="rounded-2xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden flex flex-col">
          {/* Header: Exact Same Vertical Position, Height & Divider Line as Left Header */}
          <div className="min-h-16 px-4 py-3 border-b border-slate-200/80 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-xl bg-emerald-50 text-[#173D30] flex items-center justify-center border border-emerald-200 shrink-0">
                <Layers className="size-4 text-[#20C466]" />
              </div>
              <div>
                <h3 className="font-bold text-xs text-slate-900 leading-tight">Role Limits Presets</h3>
                <p className="text-[10px] text-slate-400 leading-tight">Default role quotas</p>
              </div>
            </div>
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-[#173D30] border border-emerald-200 shrink-0">
              {roles.length} Roles
            </span>
          </div>

          {/* Independent Scrollable Role Cards List */}
          <div className="p-3.5 space-y-2.5 overflow-y-auto max-h-[580px] scrollbar-thin">
            {roles.map((r) => {
              const name = r.roleName || r.name;
              const isCurrent =
                roleForm.roleName?.toLowerCase() === name?.toLowerCase();
              const isActive = r.isActive !== false;

              return (
                <div
                  key={r.id || name}
                  onClick={() => handleRoleSelect(name)}
                  className={cn(
                    'p-3 rounded-xl border text-xs cursor-pointer transition-all space-y-1.5 select-none',
                    isCurrent
                      ? 'bg-emerald-50/70 border-emerald-300 ring-1 ring-[#20C466]/40 shadow-2xs'
                      : 'bg-slate-50/60 border-slate-200/80 hover:bg-slate-100/70 hover:border-slate-300'
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-900 truncate" title={name}>
                      {name}
                    </span>
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border',
                        isActive
                          ? 'bg-emerald-100/70 text-emerald-800 border-emerald-200'
                          : 'bg-slate-200/70 text-slate-600 border-slate-300'
                      )}
                    >
                      <span
                        className={cn(
                          'size-1.5 rounded-full',
                          isActive ? 'bg-emerald-500' : 'bg-slate-400'
                        )}
                      />
                      {isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-slate-200/50 text-[11px] text-slate-500">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Daily Limit</span>
                      <strong className="text-slate-800 font-semibold">{r.dailyLimit} leads</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Monthly Limit</span>
                      <strong className="text-slate-800 font-semibold">{r.monthlyLimit} leads</strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Fixed Bottom View All Roles Button: Remains inside right panel */}
          <div className="p-3.5 border-t border-slate-100 bg-slate-50/50 mt-auto shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setActiveTab('roles');
              }}
              className="w-full h-8.5 text-xs font-semibold rounded-xl border-slate-200 text-slate-700 hover:text-[#173D30] hover:bg-white shadow-2xs"
            >
              View All Roles
            </Button>
          </div>
        </div>
      </div>

      {/* 5. Custom Employee Limit Override Drawer */}
      <FormDrawer
        open={Boolean(editingEmployee)}
        onOpenChange={(open) => {
          if (!open) setEditingEmployee(null);
        }}
        title={`Custom Limit: ${editingEmployee?.name || ''}`}
        description="Override default role quotas for this specific employee. Leave inputs blank to inherit default role limits."
        onSubmit={handleSaveEmployeeOverride}
        loading={savingEmployeeLimit}
      >
        {editingEmployee && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Employee Code:</span>
                <span className="font-mono font-semibold text-slate-800">
                  {editingEmployee.employeeCode || `ID #${editingEmployee.employeeId}`}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Assigned Role:</span>
                <span className="font-semibold text-slate-800">{editingEmployee.role}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/60">
                <span className="text-slate-500">Role Default Quotas:</span>
                <span className="text-slate-700 font-medium">
                  {editingEmployee.roleDailyLimit ?? 10} daily / {editingEmployee.roleMonthlyLimit ?? 200} monthly
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">Custom Daily Limit</Label>
              <Input
                type="number"
                min="0"
                value={customDaily}
                onChange={(e) => setCustomDaily(e.target.value)}
                placeholder={`Default: ${editingEmployee.roleDailyLimit ?? 10}`}
                className="h-9 text-xs"
              />
              <span className="text-[10px] text-slate-400">
                Leave blank to revert to role default daily quota.
              </span>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">Custom Monthly Limit</Label>
              <Input
                type="number"
                min="0"
                value={customMonthly}
                onChange={(e) => setCustomMonthly(e.target.value)}
                placeholder={`Default: ${editingEmployee.roleMonthlyLimit ?? 200}`}
                className="h-9 text-xs"
              />
              <span className="text-[10px] text-slate-400">
                Leave blank to revert to role default monthly quota.
              </span>
            </div>

            {editingEmployee.isCustom && (
              <div className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClearEmployeeOverride}
                  disabled={savingEmployeeLimit}
                  className="w-full text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
                >
                  Clear Custom Override (Revert to Role Default)
                </Button>
              </div>
            )}
          </div>
        )}
      </FormDrawer>
    </div>
  );
}
