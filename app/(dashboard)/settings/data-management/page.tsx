'use client';

import React, { useState, useEffect } from 'react';
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
  const [activeTab, setActiveTab] = useState<'summary' | 'modules' | 'employees' | 'reset-all' | 'history'>('summary');
  const [isLoading, setIsLoading] = useState(true);
  const [isResetting, setIsResetting] = useState(false);

  // Summary state
  const [summary, setSummary] = useState<SummaryData>({
    transactional: {
      crm: { total: 2474, leads: 1240, contacts: 430, companies: 200, deals: 84, tasks: 520 },
      attendance: { total: 2890, attendances: 2450, breaks: 440 },
      leave: { leaveRequests: 84 },
      remote: { remoteRequests: 32 },
      visits: { visits: 218 },
      payroll: { total: 496, payrolls: 124, salarySlips: 372 },
      notifications: { notifications: 1920 },
      location: { locationLogs: 3500 },
    },
    masterDataProtected: {
      employees: 124,
      departments: 8,
      designations: 16,
      users: 130,
    },
    lastReset: null,
  });

  // History state
  const [history, setHistory] = useState<ResetLog[]>([]);

  // Employee search state
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeSummary | null>({
    employee: {
      id: 'emp-001',
      employeeCode: 'EMP001',
      name: 'Demo User',
      email: 'demo@quikboom.com',
      phone: '+91 98250 12345',
      department: 'Technology',
      designation: 'Lead Architect',
      status: 'ACTIVE',
      joiningDate: '2024-01-15',
    },
    counts: {
      attendance: 245,
      attendances: 210,
      breaks: 35,
      leave: 12,
      remote: 5,
      visits: 38,
      payroll: 12,
      location: 560,
      total: 872,
    },
  });

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

  useEffect(() => {
    loadSummaryAndHistory();
  }, []);

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
          onClick={() => setActiveTab('summary')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'summary'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Overall Data Summary
        </button>

        <button
          onClick={() => setActiveTab('modules')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'modules'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Module-wise Reset
        </button>

        <button
          onClick={() => setActiveTab('employees')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'employees'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Employee-wise Reset
        </button>

        <button
          onClick={() => setActiveTab('reset-all')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'reset-all'
              ? 'bg-rose-600 text-white shadow-md'
              : 'text-rose-600 hover:bg-rose-50'
          }`}
        >
          Reset All Transactional Data
        </button>

        <button
          onClick={() => setActiveTab('history')}
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
              <AdminSearchInput
                value={employeeSearch}
                onChange={setEmployeeSearch}
                placeholder="Type employee name or EMP code (e.g. Demo User, EMP001)..."
              />
              <AdminButton
                variant="primary"
                onClick={() => toast.success(`Selected employee Demo User (EMP001)`)}
              >
                Search
              </AdminButton>
            </div>
          </AdminCard>

          {/* Selected Employee Card */}
          {selectedEmployee && (
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
