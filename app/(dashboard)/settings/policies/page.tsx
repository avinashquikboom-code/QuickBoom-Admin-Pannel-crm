'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  Calendar,
  Clock,
  Banknote,
  Laptop,
  ShieldCheck,
  Save,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Building2,
  Sparkles,
  ChevronRight,
  Info,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function SettingsPoliciesPage() {
  const [activeTab, setActiveTab] = useState<'LEAVE' | 'ATTENDANCE' | 'SALARY' | 'REMOTE' | 'CONDUCT'>('LEAVE');
  const [isSaving, setIsSaving] = useState(false);

  // Leave Policy State
  const [leavePolicy, setLeavePolicy] = useState({
    name: 'Standard Corporate Leave Policy 2026',
    annualPaidLeaves: 18,
    sickLeaves: 12,
    casualLeaves: 6,
    maternityLeavesDays: 180,
    paternityLeavesDays: 15,
    allowCarryForward: true,
    maxCarryForwardDays: 10,
    minNoticeDays: 2,
    requiresManagerApproval: true,
    requiresHrApproval: true,
    allowProbationLeaves: false,
  });

  // Attendance & Shift Policy State
  const [attendancePolicy, setAttendancePolicy] = useState({
    name: 'Workforce Attendance & Late-Mark Guidelines',
    standardDailyHours: 8.5,
    gracePeriodMinutes: 15,
    lateArrivalAction: '3 Late Marks = 0.5 Day Leave Deduction',
    halfDayThresholdHours: 4.5,
    mandatoryGpsGeofence: true,
    geofenceRadiusMeters: 150,
    autoPunchOutHours: 12,
    breakDurationMinutes: 60,
  });

  // Salary & Overtime Policy State
  const [salaryPolicy, setSalaryPolicy] = useState({
    name: 'Payroll Cycle & Overtime Policy',
    payrollCycleStartDay: 1,
    salaryPayoutDay: 5,
    workingDaysPerMonth: 30,
    overtimeMultiplier: 1.5,
    pfContributionPct: 12,
    esiContributionPct: 0.75,
    tdsApplicable: true,
    reimbursementSubmissionCutoffDay: 25,
  });

  // Remote Work Policy State
  const [remotePolicy, setRemotePolicy] = useState({
    name: 'Hybrid & Remote Work Framework',
    maxMonthlyWfhDays: 4,
    minPriorNoticeHours: 24,
    requiresCameraInMeetings: true,
    mandatoryCheckinTimes: '09:30 AM & 06:30 PM',
    allowClientSiteWork: true,
  });

  // Code of Conduct
  const [conductPolicy, setConductPolicy] = useState({
    dressCode: 'Business Casuals (Monday–Thursday), Smart Casuals (Friday)',
    dataConfidentiality: 'Strict adherence to NDA and customer data protection standards.',
    poshPolicy: 'Zero tolerance for harassment under POSH Act 2013 with dedicated ICC Committee.',
    whistleblowerPolicy: 'Confidential reporting to ethics@quikboom.com with protection from retaliation.',
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      toast.success('Company policies updated successfully!', { icon: '📜' });
    } catch {
      toast.error('Failed to update policies');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-16 text-slate-800 animate-in fade-in-50 duration-200">
      {/* 1. TOP HERO HEADER */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#23C45E]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Link
                href="/settings"
                className="p-2 bg-white/10 hover:bg-white/15 rounded-xl text-white transition-colors cursor-pointer"
                title="Back to Settings"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <span className="px-3 py-1 rounded-full bg-[#23C45E]/20 text-[#23C45E] border border-[#23C45E]/30 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                Governance & Compliance
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Company Policies & Guidelines</h1>
            <p className="text-slate-300 text-xs sm:text-sm font-medium max-w-2xl">
              Configure organizational rules for leaves, shift attendance, payroll overtime, remote work, and statutory compliance.
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-3 bg-[#23C45E] hover:bg-[#1AA14D] text-slate-950 font-black rounded-2xl text-xs sm:text-sm transition-all cursor-pointer shadow-lg shadow-[#23C45E]/20 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving Policies...' : 'Save All Policies'}</span>
          </button>
        </div>
      </div>

      {/* 2. POLICY CATEGORY TABS */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-2 shadow-xs flex items-center gap-2 overflow-x-auto">
        {[
          { id: 'LEAVE', label: 'Leave & Time-Off', icon: Calendar },
          { id: 'ATTENDANCE', label: 'Attendance & Late-Mark', icon: Clock },
          { id: 'SALARY', label: 'Salary & Overtime', icon: Banknote },
          { id: 'REMOTE', label: 'Remote & Hybrid', icon: Laptop },
          { id: 'CONDUCT', label: 'Code of Conduct', icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-[#23C45E]' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. POLICY TAB CONTENTS */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
        {activeTab === 'LEAVE' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-black text-slate-900">Leave Entitlements & Allocation Policy</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Define annual quotas, notice requirements, and carry-forward limits for employees.
                </p>
              </div>
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-black">
                Active Policy v2.6
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 block mb-1.5">
                  Annual Paid Leaves (Days)
                </label>
                <input
                  type="number"
                  value={leavePolicy.annualPaidLeaves}
                  onChange={(e) => setLeavePolicy({ ...leavePolicy, annualPaidLeaves: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#23C45E]"
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 block mb-1.5">
                  Sick Leaves (Days)
                </label>
                <input
                  type="number"
                  value={leavePolicy.sickLeaves}
                  onChange={(e) => setLeavePolicy({ ...leavePolicy, sickLeaves: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#23C45E]"
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 block mb-1.5">
                  Casual Leaves (Days)
                </label>
                <input
                  type="number"
                  value={leavePolicy.casualLeaves}
                  onChange={(e) => setLeavePolicy({ ...leavePolicy, casualLeaves: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#23C45E]"
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 block mb-1.5">
                  Maternity Leave (Days)
                </label>
                <input
                  type="number"
                  value={leavePolicy.maternityLeavesDays}
                  onChange={(e) => setLeavePolicy({ ...leavePolicy, maternityLeavesDays: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#23C45E]"
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 block mb-1.5">
                  Paternity Leave (Days)
                </label>
                <input
                  type="number"
                  value={leavePolicy.paternityLeavesDays}
                  onChange={(e) => setLeavePolicy({ ...leavePolicy, paternityLeavesDays: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#23C45E]"
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 block mb-1.5">
                  Min Advance Notice (Days)
                </label>
                <input
                  type="number"
                  value={leavePolicy.minNoticeDays}
                  onChange={(e) => setLeavePolicy({ ...leavePolicy, minNoticeDays: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#23C45E]"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">Approval & Carry Forward Rules</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-bold">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={leavePolicy.requiresManagerApproval}
                    onChange={(e) => setLeavePolicy({ ...leavePolicy, requiresManagerApproval: e.target.checked })}
                    className="w-4 h-4 rounded text-[#23C45E] focus:ring-[#23C45E]"
                  />
                  <span>Requires Reporting Manager Approval</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={leavePolicy.requiresHrApproval}
                    onChange={(e) => setLeavePolicy({ ...leavePolicy, requiresHrApproval: e.target.checked })}
                    className="w-4 h-4 rounded text-[#23C45E] focus:ring-[#23C45E]"
                  />
                  <span>Requires Final HR Approval</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={leavePolicy.allowCarryForward}
                    onChange={(e) => setLeavePolicy({ ...leavePolicy, allowCarryForward: e.target.checked })}
                    className="w-4 h-4 rounded text-[#23C45E] focus:ring-[#23C45E]"
                  />
                  <span>Allow Carry Forward to Next Year (Max 10 Days)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={leavePolicy.allowProbationLeaves}
                    onChange={(e) => setLeavePolicy({ ...leavePolicy, allowProbationLeaves: e.target.checked })}
                    className="w-4 h-4 rounded text-[#23C45E] focus:ring-[#23C45E]"
                  />
                  <span>Allow Paid Leaves during Probation</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ATTENDANCE' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-black text-slate-900">Workforce Attendance, Shift & Late Rules</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Configure grace periods, half-day thresholds, and geofence verification parameters.
                </p>
              </div>
              <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-black">
                GPS Verified
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 block mb-1.5">
                  Standard Shift Hours (Daily)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={attendancePolicy.standardDailyHours}
                  onChange={(e) => setAttendancePolicy({ ...attendancePolicy, standardDailyHours: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#23C45E]"
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 block mb-1.5">
                  Late Arrival Grace Period (Minutes)
                </label>
                <input
                  type="number"
                  value={attendancePolicy.gracePeriodMinutes}
                  onChange={(e) => setAttendancePolicy({ ...attendancePolicy, gracePeriodMinutes: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#23C45E]"
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 block mb-1.5">
                  Half-Day Threshold (Hours)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={attendancePolicy.halfDayThresholdHours}
                  onChange={(e) => setAttendancePolicy({ ...attendancePolicy, halfDayThresholdHours: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#23C45E]"
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 block mb-1.5">
                  Office Geofence Radius (Meters)
                </label>
                <input
                  type="number"
                  value={attendancePolicy.geofenceRadiusMeters}
                  onChange={(e) => setAttendancePolicy({ ...attendancePolicy, geofenceRadiusMeters: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#23C45E]"
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 block mb-1.5">
                  Auto Check-Out Safety (Hours)
                </label>
                <input
                  type="number"
                  value={attendancePolicy.autoPunchOutHours}
                  onChange={(e) => setAttendancePolicy({ ...attendancePolicy, autoPunchOutHours: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#23C45E]"
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 block mb-1.5">
                  Lunch / Break Duration (Minutes)
                </label>
                <input
                  type="number"
                  value={attendancePolicy.breakDurationMinutes}
                  onChange={(e) => setAttendancePolicy({ ...attendancePolicy, breakDurationMinutes: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#23C45E]"
                />
              </div>
            </div>

            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200/80 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-black text-amber-900">Late Mark Policy Clause</h4>
                <p className="text-xs text-amber-800 mt-0.5 font-medium">
                  {attendancePolicy.lateArrivalAction}. Punch-ins after grace period are automatically flagged on HR dashboard.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'SALARY' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-black text-slate-900">Salary Structure, Deductions & Overtime Policy</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Set up monthly payroll cycles, statutory PF/ESI percentages, and overtime multipliers.
                </p>
              </div>
              <span className="px-3 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-full text-xs font-black">
                Statutory Compliant
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 block mb-1.5">
                  Payroll Cycle Start Day
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={salaryPolicy.payrollCycleStartDay}
                  onChange={(e) => setSalaryPolicy({ ...salaryPolicy, payrollCycleStartDay: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#23C45E]"
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 block mb-1.5">
                  Salary Payout Date (Every Month)
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={salaryPolicy.salaryPayoutDay}
                  onChange={(e) => setSalaryPolicy({ ...salaryPolicy, salaryPayoutDay: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#23C45E]"
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 block mb-1.5">
                  Overtime Multiplier (e.g. 1.5x)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={salaryPolicy.overtimeMultiplier}
                  onChange={(e) => setSalaryPolicy({ ...salaryPolicy, overtimeMultiplier: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#23C45E]"
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 block mb-1.5">
                  PF Contribution (%)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={salaryPolicy.pfContributionPct}
                  onChange={(e) => setSalaryPolicy({ ...salaryPolicy, pfContributionPct: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#23C45E]"
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 block mb-1.5">
                  ESI Contribution (%)
                </label>
                <input
                  type="number"
                  step="0.05"
                  value={salaryPolicy.esiContributionPct}
                  onChange={(e) => setSalaryPolicy({ ...salaryPolicy, esiContributionPct: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#23C45E]"
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 block mb-1.5">
                  Expense Claim Cutoff Day
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={salaryPolicy.reimbursementSubmissionCutoffDay}
                  onChange={(e) => setSalaryPolicy({ ...salaryPolicy, reimbursementSubmissionCutoffDay: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#23C45E]"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'REMOTE' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-black text-slate-900">Remote & Hybrid Work Policy</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Guidelines for work-from-home requests, check-in SLAs, and productivity monitoring.
                </p>
              </div>
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-black">
                Hybrid Enabled
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 block mb-1.5">
                  Max Monthly WFH Days
                </label>
                <input
                  type="number"
                  value={remotePolicy.maxMonthlyWfhDays}
                  onChange={(e) => setRemotePolicy({ ...remotePolicy, maxMonthlyWfhDays: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#23C45E]"
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 block mb-1.5">
                  Min Advance Request Notice (Hours)
                </label>
                <input
                  type="number"
                  value={remotePolicy.minPriorNoticeHours}
                  onChange={(e) => setRemotePolicy({ ...remotePolicy, minPriorNoticeHours: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#23C45E]"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">Remote Verification Protocol</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-bold">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={remotePolicy.requiresCameraInMeetings}
                    onChange={(e) => setRemotePolicy({ ...remotePolicy, requiresCameraInMeetings: e.target.checked })}
                    className="w-4 h-4 rounded text-[#23C45E] focus:ring-[#23C45E]"
                  />
                  <span>Mandatory Camera in Client & Team Calls</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={remotePolicy.allowClientSiteWork}
                    onChange={(e) => setRemotePolicy({ ...remotePolicy, allowClientSiteWork: e.target.checked })}
                    className="w-4 h-4 rounded text-[#23C45E] focus:ring-[#23C45E]"
                  />
                  <span>Allow Direct Client On-site Remote Check-In</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'CONDUCT' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-black text-slate-900">Code of Conduct & Workplace Ethics</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Statutory guidelines, POSH compliance, and data security mandates.
                </p>
              </div>
              <span className="px-3 py-1 bg-slate-900 text-white rounded-full text-xs font-black">
                Statutory Mandate
              </span>
            </div>

            <div className="space-y-4 text-xs font-medium">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                <h4 className="font-black text-slate-900 text-sm mb-1">👔 Workplace Dress Code</h4>
                <input
                  type="text"
                  value={conductPolicy.dressCode}
                  onChange={(e) => setConductPolicy({ ...conductPolicy, dressCode: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 mt-1"
                />
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                <h4 className="font-black text-slate-900 text-sm mb-1">🛡️ POSH Policy (Prevention of Sexual Harassment)</h4>
                <textarea
                  rows={2}
                  value={conductPolicy.poshPolicy}
                  onChange={(e) => setConductPolicy({ ...conductPolicy, poshPolicy: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 mt-1"
                />
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                <h4 className="font-black text-slate-900 text-sm mb-1">🔒 Confidentiality & Data Security</h4>
                <textarea
                  rows={2}
                  value={conductPolicy.dataConfidentiality}
                  onChange={(e) => setConductPolicy({ ...conductPolicy, dataConfidentiality: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 mt-1"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
