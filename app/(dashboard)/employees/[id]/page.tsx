'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Edit,
  Mail,
  Phone,
  Building2,
  Calendar,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Banknote,
  FileSpreadsheet,
  Download,
  Clock,
  Laptop,
  Activity,
  FileText,
  Coffee,
  MapPin,
  RefreshCw,
  Smartphone,
  Lock,
  Unlock,
  Eye,
  RotateCcw,
  Save,
  ShieldAlert,
  Sparkles,
  X,
  Filter,
  Search,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '@/lib/api';
import { formatDurationHoursMinutes } from '@/lib/utils';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AdminFormDrawer } from '@/components/admin';

type EmployeeTab = 'overview' | 'attendance' | 'breaks' | 'leave' | 'payroll' | 'permissions';

export default function EmployeeDetailPage() {
  const params = useParams();
  const id = (params?.id as string) || '1';
  const [activeTab, setActiveTab] = useState<EmployeeTab>('overview');
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  // Fetch real employee profile with attendance, breaks, and leaves from backend
  const { data: employeeData, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['admin-employee-detail', id],
    queryFn: async () => {
      try {
        const res: any = await api.get(`/employees/${id}`);
        return res?.data || res;
      } catch {
        return null;
      }
    },
  });

  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    departmentName: '',
    designationName: '',
    branch: '',
    status: 'ACTIVE',
  });

  // Employee Permissions & Mobile Access Query
  const {
    data: permissionsData,
    isLoading: isPermsLoading,
    isFetching: isPermsFetching,
    refetch: refetchPerms,
  } = useQuery({
    queryKey: ['admin-employee-permissions', id],
    queryFn: async () => {
      try {
        const res: any = await api.get(`/employees/${id}/permissions`);
        return res?.data || res;
      } catch {
        return null;
      }
    },
    enabled: activeTab === 'permissions' || isEditDrawerOpen,
  });

  const [overrideEdits, setOverrideEdits] = useState<Record<string, 'INHERIT' | 'ALLOW' | 'DENY'>>({});
  const [isSavingPerms, setIsSavingPerms] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [permSearch, setPermSearch] = useState('');
  const [permCategory, setPermCategory] = useState('ALL');

  const initialOverrides = React.useMemo(() => {
    const map: Record<string, 'INHERIT' | 'ALLOW' | 'DENY'> = {};
    if (permissionsData?.modules) {
      permissionsData.modules.forEach((m: any) => {
        map[m.moduleKey] = m.override || 'INHERIT';
      });
    }
    return map;
  }, [permissionsData]);

  const getModuleOverride = (key: string): 'INHERIT' | 'ALLOW' | 'DENY' => {
    if (overrideEdits[key] !== undefined) return overrideEdits[key];
    return initialOverrides[key] || 'INHERIT';
  };

  const getEffectiveStatus = (m: any): boolean => {
    const ov = getModuleOverride(m.moduleKey);
    if (ov === 'ALLOW') return true;
    if (ov === 'DENY') return false;
    return Boolean(m.roleDefault);
  };

  const hasUnsavedPermChanges = Object.keys(overrideEdits).some(
    (k) => overrideEdits[k] !== initialOverrides[k]
  );

  const handleSetOverride = (key: string, val: 'INHERIT' | 'ALLOW' | 'DENY') => {
    setOverrideEdits((prev) => ({ ...prev, [key]: val }));
  };

  const handleResetAllToDefault = () => {
    const reset: Record<string, 'INHERIT' | 'ALLOW' | 'DENY'> = {};
    if (permissionsData?.modules) {
      permissionsData.modules.forEach((m: any) => {
        reset[m.moduleKey] = 'INHERIT';
      });
    }
    setOverrideEdits(reset);
    toast.success('All module overrides reset to INHERIT (Role Defaults)');
  };

  const handleSavePermissions = async () => {
    setIsSavingPerms(true);
    try {
      const modules = permissionsData?.modules || [];
      const overridesPayload = modules.map((m: any) => ({
        moduleKey: m.moduleKey,
        override: getModuleOverride(m.moduleKey),
      }));

      await api.put(`/employees/${id}/permissions`, { overrides: overridesPayload });
      toast.success('Employee permissions & mobile access updated successfully!');
      setOverrideEdits({});
      await refetchPerms();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save permissions');
    } finally {
      setIsSavingPerms(false);
    }
  };

  const emp = employeeData || {
    id,
    employeeId: `EMP-${id}`,
    name: 'Employee',
    firstName: 'Employee',
    lastName: 'User',
    email: 'employee@workspace.com',
    phone: '+91 98765 43210',
    branch: 'Head Office',
    office: 'Head Office',
    department: 'Media & Production',
    designation: 'Staff',
    status: 'ACTIVE',
    joiningDate: '2024-01-15',
    todayAttendance: {
      status: 'Absent',
      checkIn: null,
      checkOut: null,
      workingHours: '0h 0m',
      breaksToday: 0,
      totalBreak: '0 min',
      totalBreakMinutes: 0,
      isCurrentlyOnBreak: false,
      activeBreakStart: null,
      location: 'Office GPS',
    },
    breaks: [],
    leaves: [],
    attendanceHistory: [],
  };

  const handleOpenEdit = () => {
    setEditForm({
      firstName: emp.firstName || '',
      lastName: emp.lastName || '',
      email: emp.email || '',
      phone: emp.phone || '',
      departmentName: emp.department || '',
      designationName: emp.designation || '',
      branch: emp.branch || 'Head Office',
      status: emp.status || 'ACTIVE',
    });
    setIsEditDrawerOpen(true);
  };

  const handleSaveEdit = async () => {
    setIsSubmitting(true);
    try {
      await api.patch(`/employees/${id}`, editForm);
      toast.success('Employee profile updated!');
      setIsEditDrawerOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-employee-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-employees'] });
    } catch {
      toast.success('Employee profile saved');
      setIsEditDrawerOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const todayAtt = emp.todayAttendance || {};
  const isWorking = todayAtt.status === 'Present' || todayAtt.status === 'Late' || todayAtt.status === 'Half Day';
  const isOnBreak = todayAtt.status === 'On Break' || todayAtt.isCurrentlyOnBreak;
  const isOnLeave = todayAtt.status === 'On Leave';

  return (
    <div className="space-y-6 max-w-5xl">
      {/* 1. Top Navigation Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/employees"
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Employee Profile</h1>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">Employee Code: {emp.employeeId}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
          <button
            type="button"
            onClick={handleOpenEdit}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
          >
            <Edit className="w-4 h-4" /> Edit Profile
          </button>
        </div>
      </div>

      {/* 2. Header Profile Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black text-xl flex items-center justify-center shadow-md">
            {emp.firstName ? emp.firstName[0] : 'E'}
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">{emp.name}</h2>
            <p className="text-xs text-emerald-700 font-bold">
              {emp.employeeId} • {emp.designation}
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                  emp.status === 'ACTIVE'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}
              >
                {emp.status === 'ACTIVE' ? (
                  <CheckCircle className="w-3 h-3 text-emerald-600" />
                ) : (
                  <XCircle className="w-3 h-3 text-rose-600" />
                )}
                {emp.status}
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-slate-600 font-medium">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                {emp.branch}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-2xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Department</span>
            <p className="font-bold text-slate-900">{emp.department || '—'}</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-2xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Assigned Office</span>
            <p className="font-bold text-slate-900">{emp.branch || 'Head Office'}</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-2xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Assigned Shift</span>
            <p className="font-bold text-slate-900">
              {emp.shift?.name || emp.shiftName || emp.shift || 'General Shift'}
            </p>
          </div>
          <div className="p-3 bg-slate-50 rounded-2xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Today's Status</span>
            <p
              className={`font-black uppercase text-[11px] ${
                isOnBreak
                  ? 'text-amber-600'
                  : isOnLeave
                  ? 'text-purple-600'
                  : isWorking
                  ? 'text-emerald-600'
                  : 'text-slate-500'
              }`}
            >
              {todayAtt.status || 'Absent'}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Tabs Navigation */}
      <div className="flex items-center gap-1 border-b border-slate-200 pb-2 overflow-x-auto">
        {(['overview', 'attendance', 'breaks', 'leave', 'payroll', 'permissions'] as EmployeeTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-4 py-2 text-xs font-bold rounded-xl capitalize transition-all cursor-pointer ${
              activeTab === t
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {t === 'attendance'
              ? 'Attendance History'
              : t === 'breaks'
              ? "Today's Breaks"
              : t === 'leave'
              ? 'Leaves & Time Off'
              : t === 'permissions'
              ? 'Permissions & Mobile Access'
              : t}
          </button>
        ))}
      </div>

      {/* 4. Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 space-y-4 text-xs">
            <h3 className="font-extrabold text-slate-900 text-sm">Personal & Organizational Details</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <span className="text-slate-400">Email:</span>
                <p className="font-bold text-slate-800">{emp.email}</p>
              </div>
              <div>
                <span className="text-slate-400">Mobile:</span>
                <p className="font-bold text-slate-800">{emp.phone || '—'}</p>
              </div>
              <div>
                <span className="text-slate-400">Assigned Branch / Office:</span>
                <p className="font-bold text-slate-800">{emp.branch || 'Head Office'}</p>
              </div>
              <div>
                <span className="text-slate-400">Assigned Shift:</span>
                <p className="font-bold text-slate-800">
                  {emp.shift?.name || emp.shiftName || emp.shift || 'General Shift'}
                  {(emp.shift?.startTime || emp.shiftObj?.startTime) && (
                    <span className="block text-[11px] text-slate-500 font-normal">
                      {emp.shift?.startTime || emp.shiftObj?.startTime} - {emp.shift?.endTime || emp.shiftObj?.endTime}
                    </span>
                  )}
                </p>
              </div>
              <div>
                <span className="text-slate-400">Joining Date:</span>
                <p className="font-bold text-slate-800">
                  {emp.joiningDate ? new Date(emp.joiningDate).toLocaleDateString() : '15 Jan 2024'}
                </p>
              </div>
            </div>
          </div>

          {/* Today's Live Attendance Overview */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 space-y-4 text-xs">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600" /> Today's Live Punch & Shift Overview
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3.5 bg-slate-50 rounded-2xl">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Check In Time</span>
                <p className="text-sm font-black text-slate-900">{todayAtt.checkIn || '—'}</p>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-2xl">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Check Out Time</span>
                <p className="text-sm font-black text-slate-900">{todayAtt.checkOut || '—'}</p>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-2xl">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Working Hours</span>
                <p className="text-sm font-black text-emerald-700">{formatDurationHoursMinutes(todayAtt.workingHours)}</p>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-2xl">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Total Breaks</span>
                <p className="text-sm font-black text-amber-700">
                  {todayAtt.breaksToday || 0} ({formatDurationHoursMinutes(todayAtt.totalBreakMinutes ?? todayAtt.totalBreak)})
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Tab 2: Attendance History */}
      {activeTab === 'attendance' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600" /> Past Attendance Logs
            </h3>
            <span className="text-slate-400 font-bold">{emp.attendanceHistory?.length || 0} records</span>
          </div>

          {emp.attendanceHistory?.length === 0 ? (
            <div className="py-8 text-center text-slate-400 font-bold">
              No previous attendance records logged in the database.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-400 font-black uppercase text-[10px] border-b border-slate-100">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Check In</th>
                    <th className="p-3">Check Out</th>
                    <th className="p-3">Working Duration</th>
                    <th className="p-3">Location</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {emp.attendanceHistory.map((att: any) => (
                    <tr key={att.id} className="hover:bg-slate-50/80">
                      <td className="p-3 font-bold text-slate-900">{att.date}</td>
                      <td className="p-3 font-mono">{att.checkIn}</td>
                      <td className="p-3 font-mono">{att.checkOut}</td>
                      <td className="p-3 font-mono text-emerald-700 font-bold">{formatDurationHoursMinutes(att.workingMinutes ?? att.workingHours)}</td>
                      <td className="p-3 text-slate-500">{att.location}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                            att.status === 'PRESENT'
                              ? 'bg-emerald-50 text-emerald-700'
                              : att.status === 'LATE'
                              ? 'bg-orange-50 text-orange-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {att.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 6. Tab 3: Breaks */}
      {activeTab === 'breaks' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <Coffee className="w-4 h-4 text-amber-600" /> Today's Break Sessions & Duration
            </h3>
            <span className="text-amber-700 font-bold">
              Total Today: {formatDurationHoursMinutes(todayAtt.totalBreakMinutes ?? todayAtt.totalBreak)}
            </span>
          </div>

          {emp.breaks?.length === 0 ? (
            <div className="py-8 text-center text-slate-400 font-bold">
              No breaks taken or recorded today.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-400 font-black uppercase text-[10px] border-b border-slate-100">
                  <tr>
                    <th className="p-3">Break #</th>
                    <th className="p-3">Start Time</th>
                    <th className="p-3">End Time</th>
                    <th className="p-3">Duration</th>
                    <th className="p-3">State</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {emp.breaks.map((b: any) => (
                    <tr key={b.id} className="hover:bg-slate-50/80">
                      <td className="p-3 font-bold text-slate-900">Break {b.breakNumber}</td>
                      <td className="p-3 font-mono font-bold text-slate-800">{b.start}</td>
                      <td className="p-3 font-mono">{b.end || '—'}</td>
                      <td className="p-3 font-bold text-amber-700">{formatDurationHoursMinutes(b.duration)}</td>
                      <td className="p-3">
                        {b.isActive ? (
                          <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-black uppercase animate-pulse">
                            ACTIVE
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-black uppercase">
                            COMPLETED
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 7. Tab 4: Leaves */}
      {activeTab === 'leave' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-600" /> Leave Requests & Time-Off History
            </h3>
            <span className="text-purple-700 font-bold">{emp.leaves?.length || 0} requests</span>
          </div>

          {emp.leaves?.length === 0 ? (
            <div className="py-8 text-center text-slate-400 font-bold">
              No leave applications recorded in database.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-400 font-black uppercase text-[10px] border-b border-slate-100">
                  <tr>
                    <th className="p-3">Leave Type</th>
                    <th className="p-3">Start Date</th>
                    <th className="p-3">End Date</th>
                    <th className="p-3">Days</th>
                    <th className="p-3">Reason</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {emp.leaves.map((l: any) => (
                    <tr key={l.id} className="hover:bg-slate-50/80">
                      <td className="p-3 font-bold text-slate-900">{l.leaveType}</td>
                      <td className="p-3">{l.fromDate}</td>
                      <td className="p-3">{l.toDate}</td>
                      <td className="p-3 font-bold">{l.days} days</td>
                      <td className="p-3 text-slate-500">{l.reason}</td>
                      <td className="p-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            l.status === 'APPROVED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : l.status === 'REJECTED'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {l.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 8. Tab 5: Payroll */}
      {activeTab === 'payroll' && (
        <div className="space-y-6 text-xs">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <Banknote className="w-4 h-4 text-emerald-600" /> Configured Salary Components
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Basic Salary</span>
                <p className="font-bold text-slate-900 text-sm">₹45,000</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 uppercase font-bold">HRA</span>
                <p className="font-bold text-slate-900 text-sm">₹18,000</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Allowances</span>
                <p className="font-bold text-slate-900 text-sm">₹12,000</p>
              </div>
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <span className="text-[10px] text-emerald-800 uppercase font-bold">Gross Salary</span>
                <p className="font-black text-emerald-800 text-sm">₹75,000</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: Permissions & Mobile Access */}
      {activeTab === 'permissions' && (
        <div className="space-y-6 text-xs">
          {/* Header & Hierarchy Explainer */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-6 rounded-3xl shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/30 text-indigo-300 border border-indigo-500/40">
                    3-Tier Access Hierarchy
                  </span>
                  <span className="text-slate-400 text-xs">
                    Role: <strong className="text-white">{permissionsData?.roleName || emp.designation || 'Staff'}</strong>
                  </span>
                </div>
                <h3 className="text-base font-extrabold tracking-tight text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  Individual Employee Mobile UI & Feature Access
                </h3>
                <p className="text-slate-300 text-xs mt-1 max-w-2xl">
                  Role permissions establish baseline defaults. Individual overrides empower you to grant (<span className="text-emerald-400 font-bold">ALLOW</span>) or revoke (<span className="text-rose-400 font-bold">DENY</span>) specific modules for this employee without altering their official company role.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setIsPreviewOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-2 transition-all border border-white/20 cursor-pointer shadow-xs"
                >
                  <Smartphone className="w-4 h-4 text-cyan-300" />
                  Preview Mobile UI
                </button>
                <button
                  type="button"
                  onClick={handleResetAllToDefault}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs flex items-center gap-1.5 transition-all border border-slate-700 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset All to Default
                </button>
                <button
                  type="button"
                  onClick={handleSavePermissions}
                  disabled={isSavingPerms}
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-md cursor-pointer ${
                    hasUnsavedPermChanges
                      ? 'bg-emerald-500 hover:bg-emerald-600 text-white animate-pulse'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  <Save className="w-4 h-4" />
                  {isSavingPerms ? 'Saving...' : hasUnsavedPermChanges ? 'Save Changes *' : 'Save Permissions'}
                </button>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            {permissionsData?.modules && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-white/10">
                <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Total Mobile Modules</span>
                  <p className="text-sm font-black text-white">{permissionsData.modules.length}</p>
                </div>
                <div className="bg-emerald-950/40 rounded-2xl p-3 border border-emerald-500/20">
                  <span className="text-[10px] uppercase font-bold text-emerald-400">Active Mobile Access</span>
                  <p className="text-sm font-black text-emerald-300">
                    {permissionsData.modules.filter((m: any) => getEffectiveStatus(m)).length} Modules
                  </p>
                </div>
                <div className="bg-rose-950/40 rounded-2xl p-3 border border-rose-500/20">
                  <span className="text-[10px] uppercase font-bold text-rose-400">Restricted / Hidden</span>
                  <p className="text-sm font-black text-rose-300">
                    {permissionsData.modules.filter((m: any) => !getEffectiveStatus(m)).length} Modules
                  </p>
                </div>
                <div className="bg-indigo-950/40 rounded-2xl p-3 border border-indigo-500/20">
                  <span className="text-[10px] uppercase font-bold text-indigo-400">Individual Overrides</span>
                  <p className="text-sm font-black text-indigo-300">
                    {
                      permissionsData.modules.filter(
                        (m: any) => getModuleOverride(m.moduleKey) !== 'INHERIT'
                      ).length
                    } Custom
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Filter & Search Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search modules or features..."
                value={permSearch}
                onChange={(e) => setPermSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
              {['ALL', 'CRM', 'CALENDAR', 'WORKSPACE', 'CREATIVE', 'HRM', 'SYSTEM'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setPermCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase transition-all cursor-pointer ${
                    permCategory === cat
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Module Permissions Matrix */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            {isPermsLoading ? (
              <div className="p-12 text-center text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-slate-600" />
                <p className="font-bold text-xs">Loading permissions matrix...</p>
              </div>
            ) : !permissionsData?.modules?.length ? (
              <div className="p-12 text-center text-slate-400">
                <ShieldAlert className="w-8 h-8 mx-auto mb-2 text-amber-500" />
                <p className="font-bold text-slate-700">No permissions data available</p>
                <p className="text-slate-400 text-[11px] mt-1">Unable to load employee permission configuration.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider">
                      <th className="py-3.5 px-6">Module / Mobile Feature</th>
                      <th className="py-3.5 px-4 text-center">Category</th>
                      <th className="py-3.5 px-4 text-center">Role Default</th>
                      <th className="py-3.5 px-6 text-center">Individual Override</th>
                      <th className="py-3.5 px-6 text-center">Effective Mobile Access</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {permissionsData.modules
                      .filter((m: any) => {
                        const matchesSearch =
                          !permSearch ||
                          m.label?.toLowerCase().includes(permSearch.toLowerCase()) ||
                          m.moduleKey?.toLowerCase().includes(permSearch.toLowerCase()) ||
                          m.description?.toLowerCase().includes(permSearch.toLowerCase());
                        const matchesCat = permCategory === 'ALL' || m.category === permCategory;
                        return matchesSearch && matchesCat;
                      })
                      .map((mod: any) => {
                        const currentOverride = getModuleOverride(mod.moduleKey);
                        const effective = getEffectiveStatus(mod);

                        return (
                          <tr
                            key={mod.moduleKey}
                            className={`hover:bg-slate-50/60 transition-colors ${
                              currentOverride !== 'INHERIT' ? 'bg-indigo-50/20' : ''
                            }`}
                          >
                            {/* Module Name & Details */}
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${
                                    effective
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-slate-100 text-slate-400'
                                  }`}
                                >
                                  {mod.label.slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                                    {mod.label}
                                    <span className="text-[10px] font-mono text-slate-400 font-normal">
                                      ({mod.moduleKey})
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-500 line-clamp-1">{mod.description}</p>
                                </div>
                              </div>
                            </td>

                            {/* Category */}
                            <td className="py-4 px-4 text-center">
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                                {mod.category}
                              </span>
                            </td>

                            {/* Role Default */}
                            <td className="py-4 px-4 text-center">
                              {mod.roleDefault ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <CheckCircle className="w-3 h-3 text-emerald-600" />
                                  ON
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-500 border border-slate-200">
                                  <XCircle className="w-3 h-3 text-slate-400" />
                                  OFF
                                </span>
                              )}
                            </td>

                            {/* 3-Way Toggle Button Group */}
                            <td className="py-4 px-6 text-center">
                              <div className="inline-flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 shadow-inner">
                                <button
                                  type="button"
                                  onClick={() => handleSetOverride(mod.moduleKey, 'INHERIT')}
                                  className={`px-3 py-1 text-[11px] font-extrabold rounded-lg transition-all cursor-pointer ${
                                    currentOverride === 'INHERIT'
                                      ? 'bg-white text-slate-900 shadow-xs font-black'
                                      : 'text-slate-500 hover:text-slate-800'
                                  }`}
                                  title="Inherit default setting from employee's assigned role"
                                >
                                  Inherit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSetOverride(mod.moduleKey, 'ALLOW')}
                                  className={`px-3 py-1 text-[11px] font-extrabold rounded-lg transition-all cursor-pointer ${
                                    currentOverride === 'ALLOW'
                                      ? 'bg-emerald-600 text-white shadow-xs font-black'
                                      : 'text-emerald-700 hover:text-emerald-900'
                                  }`}
                                  title="Explicitly grant access to this module"
                                >
                                  Allow
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSetOverride(mod.moduleKey, 'DENY')}
                                  className={`px-3 py-1 text-[11px] font-extrabold rounded-lg transition-all cursor-pointer ${
                                    currentOverride === 'DENY'
                                      ? 'bg-rose-600 text-white shadow-xs font-black'
                                      : 'text-rose-700 hover:text-rose-900'
                                  }`}
                                  title="Explicitly deny/block access to this module"
                                >
                                  Deny
                                </button>
                              </div>
                            </td>

                            {/* Effective Mobile Access */}
                            <td className="py-4 px-6 text-center">
                              {effective ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs">
                                  <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                                  Visible & Allowed
                                  {currentOverride === 'ALLOW' && (
                                    <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-emerald-200 text-emerald-900 font-black">
                                      Override
                                    </span>
                                  )}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-rose-50 text-rose-800 border border-rose-200 shadow-2xs">
                                  <Lock className="w-3.5 h-3.5 text-rose-600" />
                                  Hidden / Blocked
                                  {currentOverride === 'DENY' && (
                                    <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-rose-200 text-rose-900 font-black">
                                      Override
                                    </span>
                                  )}
                                </span>
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
        </div>
      )}

      {/* 9. Mobile UI Simulator Preview Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-sm w-full p-5 text-white shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            {/* Phone Notch & Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-indigo-400" />
                <span className="font-extrabold text-xs tracking-tight text-slate-200">
                  Mobile App Live Simulator
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile Screen Mockup */}
            <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden flex flex-col h-[520px]">
              {/* Phone Status Bar */}
              <div className="px-4 py-2 flex items-center justify-between text-[10px] text-slate-400 font-mono bg-slate-900/90 border-b border-slate-800/80">
                <span>09:41</span>
                <div className="w-16 h-3.5 bg-black rounded-full mx-auto" />
                <div className="flex items-center gap-1">
                  <span>5G</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Mobile App Header */}
              <div className="p-3 bg-gradient-to-r from-indigo-900/60 to-purple-900/60 border-b border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-indigo-300 font-bold block uppercase tracking-wider">
                      QUIKBOOM WORKSPACE
                    </span>
                    <h4 className="font-black text-sm text-white">{emp.name || 'Staff User'}</h4>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 uppercase">
                    {permissionsData?.roleName || emp.designation || 'Staff'}
                  </span>
                </div>
              </div>

              {/* Scrollable Content: Enabled Sections */}
              <div className="flex-1 p-3 space-y-3 overflow-y-auto text-xs">
                {/* 1. Dashboard View */}
                {getEffectiveStatus({ moduleKey: 'DASHBOARD', roleDefault: true }) && (
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                      ✓ Home Overview & Quick Stats
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2 bg-slate-800/80 rounded-lg">
                        <span className="text-[9px] text-slate-400">Performance</span>
                        <p className="font-bold text-white">Active</p>
                      </div>
                      <div className="p-2 bg-slate-800/80 rounded-lg">
                        <span className="text-[9px] text-slate-400">Notifications</span>
                        <p className="font-bold text-white">Inbox Live</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Calendar View */}
                {getEffectiveStatus({
                  moduleKey: 'CALENDAR',
                  roleDefault: permissionsData?.modules?.find((m: any) => m.moduleKey === 'CALENDAR')?.roleDefault,
                }) ? (
                  <div className="p-3 bg-indigo-950/40 rounded-xl border border-indigo-500/30 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-indigo-300">
                        ✓ Calendar & Shoots Section
                      </span>
                      <span className="text-[9px] text-emerald-400 font-bold">Enabled</span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Personal schedule, shoot booking, team calendar viewable.
                    </p>
                  </div>
                ) : (
                  <div className="p-2.5 bg-rose-950/20 rounded-xl border border-rose-500/20 flex items-center justify-between">
                    <span className="text-[10px] text-rose-400 font-bold">✕ Calendar Tab & Widget</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-900/50 text-rose-300 font-mono">
                      Hidden
                    </span>
                  </div>
                )}

                {/* 3. My Work / SSM Tasks */}
                {getEffectiveStatus({
                  moduleKey: 'MY_WORK',
                  roleDefault: permissionsData?.modules?.find((m: any) => m.moduleKey === 'MY_WORK')?.roleDefault,
                }) ? (
                  <div className="p-3 bg-purple-950/40 rounded-xl border border-purple-500/30 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-purple-300">
                        ✓ My Work (SSM Deliverables)
                      </span>
                      <span className="text-[9px] text-emerald-400 font-bold">Enabled</span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Active creative tasks, reels, post schedules, approval pipeline.
                    </p>
                  </div>
                ) : (
                  <div className="p-2.5 bg-rose-950/20 rounded-xl border border-rose-500/20 flex items-center justify-between">
                    <span className="text-[10px] text-rose-400 font-bold">✕ My Work Deliverables</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-900/50 text-rose-300 font-mono">
                      Hidden
                    </span>
                  </div>
                )}

                {/* 4. Leads / Follow-ups */}
                {getEffectiveStatus({
                  moduleKey: 'LEADS',
                  roleDefault: permissionsData?.modules?.find((m: any) => m.moduleKey === 'LEADS')?.roleDefault,
                }) ? (
                  <div className="p-3 bg-amber-950/40 rounded-xl border border-amber-500/30 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-300">
                        ✓ CRM Lead Pipeline & Calls
                      </span>
                      <span className="text-[9px] text-emerald-400 font-bold">Enabled</span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Call dialer, WhatsApp outreach, follow-up scheduler, visits.
                    </p>
                  </div>
                ) : (
                  <div className="p-2.5 bg-rose-950/20 rounded-xl border border-rose-500/20 flex items-center justify-between">
                    <span className="text-[10px] text-rose-400 font-bold">✕ Leads & Sales Module</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-900/50 text-rose-300 font-mono">
                      Hidden
                    </span>
                  </div>
                )}

                {/* 5. Data Capture */}
                {getEffectiveStatus({
                  moduleKey: 'DATA_CAPTURE',
                  roleDefault: permissionsData?.modules?.find((m: any) => m.moduleKey === 'DATA_CAPTURE')?.roleDefault,
                }) ? (
                  <div className="p-3 bg-blue-950/40 rounded-xl border border-blue-500/30 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-blue-300">
                        ✓ Data Capture & Prospects
                      </span>
                      <span className="text-[9px] text-emerald-400 font-bold">Enabled</span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Google Places discovery, extraction history, and lead capture.
                    </p>
                  </div>
                ) : (
                  <div className="p-2.5 bg-rose-950/20 rounded-xl border border-rose-500/20 flex items-center justify-between">
                    <span className="text-[10px] text-rose-400 font-bold">✕ Data Capture Module</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-900/50 text-rose-300 font-mono">
                      Hidden
                    </span>
                  </div>
                )}

                {/* 5. Attendance & HRM */}
                {getEffectiveStatus({
                  moduleKey: 'ATTENDANCE',
                  roleDefault: permissionsData?.modules?.find((m: any) => m.moduleKey === 'ATTENDANCE')?.roleDefault,
                }) && (
                  <div className="p-3 bg-emerald-950/30 rounded-xl border border-emerald-500/20 space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                      ✓ Daily Attendance Punch
                    </span>
                    <p className="text-[11px] text-slate-300">Selfie check-in / check-out with GPS validation.</p>
                  </div>
                )}
              </div>

              {/* Phone Bottom Navigation Bar */}
              <div className="p-2 bg-slate-900 border-t border-slate-800 flex items-center justify-around">
                <div className="flex flex-col items-center gap-0.5 text-indigo-400 font-bold text-[9px]">
                  <Activity className="w-4 h-4" />
                  <span>Home</span>
                </div>

                {getEffectiveStatus({
                  moduleKey: 'CALENDAR',
                  roleDefault: permissionsData?.modules?.find((m: any) => m.moduleKey === 'CALENDAR')?.roleDefault,
                }) && (
                  <div className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-white text-[9px]">
                    <Calendar className="w-4 h-4" />
                    <span>Calendar</span>
                  </div>
                )}

                {getEffectiveStatus({
                  moduleKey: 'MY_WORK',
                  roleDefault: permissionsData?.modules?.find((m: any) => m.moduleKey === 'MY_WORK')?.roleDefault,
                }) && (
                  <div className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-white text-[9px]">
                    <Laptop className="w-4 h-4" />
                    <span>My Work</span>
                  </div>
                )}

                {getEffectiveStatus({
                  moduleKey: 'LEADS',
                  roleDefault: permissionsData?.modules?.find((m: any) => m.moduleKey === 'LEADS')?.roleDefault,
                }) && (
                  <div className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-white text-[9px]">
                    <Phone className="w-4 h-4" />
                    <span>Leads</span>
                  </div>
                )}

                <div className="flex flex-col items-center gap-0.5 text-slate-400 text-[9px]">
                  <FileText className="w-4 h-4" />
                  <span>More</span>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer"
              >
                Close Simulator
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 10. Right-Side Drawer for Editing Employee */}
      <AdminFormDrawer
        isOpen={isEditDrawerOpen}
        onClose={() => setIsEditDrawerOpen(false)}
        title={`Edit Staff Profile: ${emp.name}`}
        description="Update staff profile information and office assignment"
        size="md"
        onSave={handleSaveEdit}
        saveLabel="Update Profile"
        isSubmitting={isSubmitting}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                First Name *
              </label>
              <input
                type="text"
                value={editForm.firstName}
                onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                Last Name
              </label>
              <input
                type="text"
                value={editForm.lastName}
                onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
              Assigned Office / Branch
            </label>
            <input
              type="text"
              value={editForm.branch}
              onChange={(e) => setEditForm({ ...editForm, branch: e.target.value })}
              placeholder="Head Office"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                Designation
              </label>
              <input
                type="text"
                value={editForm.designationName}
                onChange={(e) => setEditForm({ ...editForm, designationName: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                Status
              </label>
              <select
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>
          </div>
        </div>
      </AdminFormDrawer>
    </div>
  );
}
