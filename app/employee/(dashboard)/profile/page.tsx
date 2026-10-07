'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  User,
  Clock,
  Clock3,
  Calendar,
  CalendarDays,
  FileText,
  Settings,
  Pencil,
  MapPin,
  Mail,
  Phone,
  Building2,
  Briefcase,
  ArrowRight,
  ChevronRight,
  RefreshCw,
  X,
  Check,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import api from '@/lib/api';
import { useEmployeeAuthStore } from '@/lib/employee-store';
import { hasPermission } from '@/lib/access-control';
import { toast } from 'react-hot-toast';
import EmployeeSideSheet from '@/components/EmployeeSideSheet';

// ── Date Formatting Helpers ───────────────────────────────────────────────────

function formatDate(dateInput?: string | null): string {
  if (!dateInput) return '—';
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return '—';
  }
}

function formatTime(isoString?: string | null): string {
  if (!isoString) return '--:--';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '--:--';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  } catch {
    return '--:--';
  }
}

function formatEmploymentType(type?: string): string {
  if (!type) return 'Full Time';
  const clean = type.toUpperCase().replace(/[_-]/g, ' ');
  if (clean.includes('FULL')) return 'Full Time';
  if (clean.includes('PART')) return 'Part Time';
  if (clean.includes('CONTRACT')) return 'Contract';
  if (clean.includes('INTERN')) return 'Internship';
  return type;
}

export default function EmployeeProfilePage() {
  const user = useEmployeeAuthStore((state) => state.user);
  const token = useEmployeeAuthStore((state) => state.token);
  const updateUser = useEmployeeAuthStore((state) => state.updateUser);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [attendance, setAttendance] = useState<any>(null);
  const [attendanceHistory, setAttendanceHistory] = useState<any[]>([]);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    emergencyContact: '',
  });

  // ── Fetch Profile & Attendance ─────────────────────────────────────────────
  const fetchProfileData = useCallback(async (isRefresh = false) => {
    if (!token) return;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const authHeader = { headers: { Authorization: `Bearer ${token}` } };

      const [profRes, attMeRes, attHistRes] = await Promise.allSettled([
        api.get('/employees/profile/me', authHeader),
        api.get('/attendance/me', authHeader),
        api.get('/attendance/history', { ...authHeader, params: { limit: 31 } }),
      ]);

      if (profRes.status === 'fulfilled') {
        const val = profRes.value as any;
        const profData = val?.data?.data || val?.data || val;
        setProfile(profData);
        setEditForm({
          firstName: profData.firstName || user?.firstName || '',
          lastName: profData.lastName || user?.lastName || '',
          phone: profData.phone || (user as any)?.phone || (user as any)?.mobile || '',
          address: profData.address || '',
          emergencyContact: profData.emergencyContact || '',
        });
      }

      if (attMeRes.status === 'fulfilled') {
        const val = attMeRes.value as any;
        setAttendance(val?.data?.data || val?.data || val);
      }

      if (attHistRes.status === 'fulfilled') {
        const val = attHistRes.value as any;
        const histItems = val?.data?.data || val?.data?.items || val?.data || val?.items || [];
        setAttendanceHistory(Array.isArray(histItems) ? histItems : []);
      }
    } catch (err) {
      console.error('[EMPLOYEE_PROFILE] Error loading profile:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, user]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  // ── Save Profile Edit ──────────────────────────────────────────────────────
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) {
      toast.error('Employee profile ID not available');
      return;
    }

    if (!editForm.firstName.trim()) {
      toast.error('First name is required');
      return;
    }

    setIsSaving(true);
    try {
      const payload: any = {
        firstName: editForm.firstName.trim(),
        lastName: editForm.lastName.trim(),
        phone: editForm.phone.trim() || undefined,
        address: editForm.address.trim() || undefined,
        emergencyContact: editForm.emergencyContact.trim() || undefined,
      };

      await api.patch(`/employees/${profile.id}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success('Profile updated successfully!', { icon: '✅' });
      setIsEditModalOpen(false);

      // Update in-memory auth store
      updateUser({
        firstName: editForm.firstName.trim(),
        lastName: editForm.lastName.trim(),
      });

      await fetchProfileData(true);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to update profile';
      toast.error(typeof msg === 'string' ? msg : 'Update failed');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Derived Profile Fields ─────────────────────────────────────────────────
  const fullName =
    [profile?.firstName || user?.firstName, profile?.lastName || user?.lastName].filter(Boolean).join(' ') ||
    'Employee';

  const initials =
    fullName
      .split(' ')
      .map((p) => (p ? p[0] : ''))
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'EM';

  const designation =
    profile?.designation?.name ||
    profile?.designation?.title ||
    (typeof profile?.designation === 'string' ? profile.designation : '') ||
    (user as any)?.designation ||
    'TELESALES EXECUTIVE';

  const department =
    profile?.department?.name ||
    (typeof profile?.department === 'string' ? profile.department : '') ||
    'BPO CALL CENTER';

  const employeeCode = profile?.employeeCode || profile?.employeeId || (user as any)?.employeeCode || 'EMP-004';

  const branchName =
    profile?.branch ||
    profile?.office?.name ||
    attendance?.office?.name ||
    'QUICKBOOM MARKETING AGENCY, Gujarat';

  const email = profile?.email || user?.email || 'quikboomsales@gmail.com';
  const phone = profile?.phone || (user as any)?.mobile || '—';

  // ── Derived Attendance Overview Counts ─────────────────────────────────────
  // Count present, absent, and on-leave days from the attendance history
  let presentDays = 0;
  let absentDays = 0;
  let onLeaveDays = 0;

  if (attendanceHistory.length > 0) {
    attendanceHistory.forEach((item: any) => {
      const s = String(item.status || '').toUpperCase();
      if (item.punchIn || s === 'PRESENT' || s === 'PUNCHED_IN' || s === 'PUNCHED_OUT') {
        presentDays++;
      } else if (s === 'LEAVE' || s === 'ON_LEAVE' || s === 'HALF_DAY') {
        onLeaveDays++;
      } else if (s === 'ABSENT') {
        absentDays++;
      }
    });
  } else if (attendance?.status?.isPunchedIn) {
    presentDays = 1;
  }

  // Last check-in / check-out
  const lastPunchIn =
    attendance?.status?.punchInTime ||
    (attendanceHistory.length > 0 && attendanceHistory[0]?.punchIn ? attendanceHistory[0].punchIn : null);

  const lastPunchOut =
    attendance?.status?.punchOutTime ||
    (attendanceHistory.length > 0 && attendanceHistory[0]?.punchOut ? attendanceHistory[0].punchOut : null);

  // ── Derived Work Information ───────────────────────────────────────────────
  const joiningDateStr = formatDate(profile?.joiningDate || profile?.dateOfJoining);
  const employmentType = formatEmploymentType(profile?.employmentType || profile?.employeeType);
  const reportingManager = profile?.manager || profile?.reportingManager?.name || '—';
  const workLocation = branchName;
  const noticePeriod = profile?.noticePeriod || profile?.noticePeriodDays ? `${profile.noticePeriod || profile.noticePeriodDays} Days` : '15 Days';

  // ── Permissions for Profile Actions ────────────────────────────────────────
  const canAttendance = hasPermission(user, ['employee.attendance.view', 'attendance.view_own', 'attendance.view']);
  const canLeaves = hasPermission(user, ['employee.leave.view', 'leave.view_own', 'leave.view']);
  const canSalary = hasPermission(user, ['employee.salary.view', 'salary_slips.view_own', 'salary.view']);
  const canSettings = hasPermission(user, ['employee.settings.view', 'settings.view']);

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6 animate-pulse">
        <div className="h-16 bg-white rounded-2xl border border-slate-200" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="h-80 bg-white rounded-2xl border border-slate-200" />
            <div className="h-64 bg-white rounded-2xl border border-slate-200" />
          </div>
          <div className="space-y-6">
            <div className="h-64 bg-white rounded-2xl border border-slate-200" />
            <div className="h-80 bg-white rounded-2xl border border-slate-200" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* ── 1. PAGE HEADER ──────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Profile</h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Your personal information and account settings
          </p>
        </div>

        <button
          onClick={() => fetchProfileData(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 transition-colors self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-emerald-600' : ''}`} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      {/* ── TWO-COLUMN RESPONSIVE LAYOUT ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* ── LEFT COLUMN: Profile Card + Profile Actions ───────────────────── */}
        <div className="space-y-6">
          {/* 3. EMPLOYEE PROFILE CARD */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-6">
            {/* Top row: Avatar, Name, Badges, Edit button */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                {/* Circular Avatar / Initials */}
                <div className="relative shrink-0">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-emerald-500 to-[#16A34A] flex items-center justify-center text-white font-black text-xl sm:text-2xl shadow-md shadow-emerald-500/20 border-2 border-white ring-2 ring-emerald-500/20">
                    {profile?.profilePhoto || profile?.avatar ? (
                      <img
                        src={profile.profilePhoto || profile.avatar}
                        alt={fullName}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span>{initials}</span>
                    )}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center shadow-xs">
                    <Check className="w-3 h-3 text-white" strokeWidth={3.5} />
                  </div>
                </div>

                <div className="min-w-0">
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 truncate leading-tight">
                    {fullName}
                  </h2>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wide">
                      {designation}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      {employeeCode}
                    </span>
                  </div>
                </div>
              </div>

              {/* Edit Button */}
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors shrink-0 cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            </div>

            {/* Profile Information List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 text-xs">
              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Designation
                </span>
                <span className="font-extrabold text-slate-900 block">{designation}</span>
              </div>

              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Department
                </span>
                <span className="font-extrabold text-slate-900 block">{department}</span>
              </div>

              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Employee Code
                </span>
                <span className="font-mono font-extrabold text-slate-900 block">{employeeCode}</span>
              </div>

              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Phone Number
                </span>
                <span className="font-extrabold text-slate-900 block">{phone}</span>
              </div>

              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 sm:col-span-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Assigned Branch
                </span>
                <div className="flex items-start gap-1.5 text-slate-800 font-bold">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{branchName}</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 sm:col-span-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Email Address
                </span>
                <div className="flex items-center gap-1.5 text-slate-800 font-bold">
                  <Mail className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="truncate">{email}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 5. PROFILE ACTIONS CARD */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-4">
            <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
              Account & Quick Actions
            </h2>

            <div className="divide-y divide-slate-100">
              {/* Row 1: Edit Profile */}
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="w-full py-3.5 flex items-center justify-between gap-3 text-left hover:bg-slate-50/80 rounded-xl px-2 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                    <Pencil className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-black text-xs sm:text-sm text-slate-900 block group-hover:text-emerald-700 transition-colors">
                      Edit Profile
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      Update your personal information
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all" />
              </button>

              {/* Row 2: My Attendance Logs */}
              {canAttendance && (
                <Link
                  href="/employee/attendance"
                  className="w-full py-3.5 flex items-center justify-between gap-3 text-left hover:bg-slate-50/80 rounded-xl px-2 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                      <Clock3 className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-black text-xs sm:text-sm text-slate-900 block group-hover:text-blue-700 transition-colors">
                        My Attendance Logs
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        View your attendance history
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all" />
                </Link>
              )}

              {/* Row 3: Leave & Remote Applications */}
              {canLeaves && (
                <Link
                  href="/employee/leaves"
                  className="w-full py-3.5 flex items-center justify-between gap-3 text-left hover:bg-slate-50/80 rounded-xl px-2 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-black text-xs sm:text-sm text-slate-900 block group-hover:text-purple-700 transition-colors">
                        Leave & Remote Applications
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        Manage your leave and remote work requests
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all" />
                </Link>
              )}

              {/* Row 4: Salary Slips & Payslips */}
              {canSalary && (
                <Link
                  href="/employee/salary-slips"
                  className="w-full py-3.5 flex items-center justify-between gap-3 text-left hover:bg-slate-50/80 rounded-xl px-2 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-black text-xs sm:text-sm text-slate-900 block group-hover:text-amber-700 transition-colors">
                        Salary Slips & Payslips
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        View and download your salary slips
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all" />
                </Link>
              )}

              {/* Row 5: Account Settings */}
              {canSettings && (
                <Link
                  href="/employee/settings"
                  className="w-full py-3.5 flex items-center justify-between gap-3 text-left hover:bg-slate-50/80 rounded-xl px-2 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center shrink-0">
                      <Settings className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-black text-xs sm:text-sm text-slate-900 block group-hover:text-slate-800 transition-colors">
                        Account Settings
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        Manage your account preferences
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all" />
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN: Attendance Overview + Work Information ─────────── */}
        <div className="space-y-6">
          {/* 4. ATTENDANCE OVERVIEW CARD */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shadow-xs">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                    Attendance Overview
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">Monthly attendance summary</p>
                </div>
              </div>

              <Link
                href="/employee/attendance"
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors flex items-center gap-1 group"
              >
                <span>View All Logs</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {/* Attendance Status Summary (Present, Absent, On Leave) */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-100 text-center">
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block mb-1">
                  Present
                </span>
                <span className="text-xl sm:text-2xl font-black text-emerald-900">
                  {presentDays}
                </span>
                <span className="text-[10px] font-bold text-emerald-600 block mt-0.5">Days</span>
              </div>

              <div className="p-3.5 bg-rose-50/70 rounded-xl border border-rose-100 text-center">
                <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block mb-1">
                  Absent
                </span>
                <span className="text-xl sm:text-2xl font-black text-rose-900">
                  {absentDays}
                </span>
                <span className="text-[10px] font-bold text-rose-600 block mt-0.5">Days</span>
              </div>

              <div className="p-3.5 bg-amber-50/70 rounded-xl border border-amber-100 text-center">
                <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block mb-1">
                  On Leave
                </span>
                <span className="text-xl sm:text-2xl font-black text-amber-900">
                  {onLeaveDays}
                </span>
                <span className="text-[10px] font-bold text-amber-600 block mt-0.5">Days</span>
              </div>
            </div>

            {/* Last Check-in / Last Check-out */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 bg-slate-50/90 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Last Check-in
                </span>
                <span className="text-base sm:text-lg font-black text-slate-900 block leading-tight">
                  {formatTime(lastPunchIn)}
                </span>
                <span className="text-[11px] font-medium text-slate-500 block mt-1">
                  {formatDate(lastPunchIn)}
                </span>
              </div>

              <div className="p-3.5 bg-slate-50/90 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Last Check-out
                </span>
                <span className="text-base sm:text-lg font-black text-slate-900 block leading-tight">
                  {formatTime(lastPunchOut)}
                </span>
                <span className="text-[11px] font-medium text-slate-500 block mt-1">
                  {formatDate(lastPunchOut)}
                </span>
              </div>
            </div>
          </div>

          {/* 6. WORK INFORMATION CARD */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shadow-xs">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                  Work Information
                </h2>
                <p className="text-xs text-slate-500 font-medium">Employment and office credentials</p>
              </div>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="flex items-center justify-between p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                <span className="font-bold text-slate-500">Joining Date</span>
                <span className="font-black text-slate-900">{joiningDateStr}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                <span className="font-bold text-slate-500">Employee Type</span>
                <span className="font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  {employmentType}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                <span className="font-bold text-slate-500">Reporting Manager</span>
                <span className="font-black text-slate-900">{reportingManager}</span>
              </div>

              <div className="flex items-start justify-between gap-3 p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                <span className="font-bold text-slate-500 shrink-0">Work Location</span>
                <span className="font-black text-slate-900 text-right">{workLocation}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                <span className="font-bold text-slate-500">Notice Period</span>
                <span className="font-black text-slate-900">{noticePeriod}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 9. EDIT PROFILE DRAWER ───────────────────────────────────────────── */}
      <EmployeeSideSheet
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Personal Information"
        subtitle="Update your contact and residential details"
        icon={<Pencil className="w-4 h-4" />}
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="edit-profile-form"
              disabled={isSaving}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-[#23C45E] hover:bg-[#1AA14D] text-white shadow-md shadow-[#23C45E]/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSaving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </>
        }
      >
        <form id="edit-profile-form" onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">First Name *</label>
              <input
                type="text"
                required
                value={editForm.firstName}
                onChange={(e) => setEditForm((prev) => ({ ...prev, firstName: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-emerald-500 focus:border-emerald-500"
                placeholder="First Name"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Last Name</label>
              <input
                type="text"
                value={editForm.lastName}
                onChange={(e) => setEditForm((prev) => ({ ...prev, lastName: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-emerald-500 focus:border-emerald-500"
                placeholder="Last Name"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Phone Number</label>
            <input
              type="tel"
              value={editForm.phone}
              onChange={(e) => setEditForm((prev) => ({ ...prev, phone: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-emerald-500 focus:border-emerald-500"
              placeholder="+91..."
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Residential Address</label>
            <textarea
              rows={2}
              value={editForm.address}
              onChange={(e) => setEditForm((prev) => ({ ...prev, address: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-emerald-500 focus:border-emerald-500 resize-none"
              placeholder="Street, City, State..."
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Emergency Contact</label>
            <input
              type="text"
              value={editForm.emergencyContact}
              onChange={(e) => setEditForm((prev) => ({ ...prev, emergencyContact: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-emerald-500 focus:border-emerald-500"
              placeholder="Contact Name & Phone"
            />
          </div>
        </form>
      </EmployeeSideSheet>
    </div>
  );
}