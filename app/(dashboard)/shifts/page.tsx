'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Clock,
  Users,
  Plus,
  Search,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Moon,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Building2,
  UserPlus,
  ExternalLink,
  Layers,
  ChevronRight,
  Info,
  Coffee,
  MapPin,
  Flame,
  Zap,
  BookOpen,
  Edit2,
  Trash2,
  X,
  Check,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';
import { getErrorMessage } from '@/lib/utils';
import { AdminFormDrawer } from '@/components/admin';

export default function ShiftsPage() {
  const queryClient = useQueryClient();

  // Filters
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'NIGHT' | 'ROTATIONAL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals / Drawers
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedShiftForGuidance, setSelectedShiftForGuidance] = useState<any | null>(null);
  const [selectedShiftForAssign, setSelectedShiftForAssign] = useState<any | null>(null);
  const [selectedShiftForEdit, setSelectedShiftForEdit] = useState<any | null>(null);

  // Form State for Create/Edit
  const [shiftForm, setShiftForm] = useState({
    name: '',
    code: '',
    startTime: '09:30 AM',
    endTime: '06:30 PM',
    durationHours: 9,
    gracePeriodMinutes: 15,
    halfDayThresholdHours: 4.5,
    breakDurationMinutes: 60,
    isNightShift: false,
    isRotational: false,
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    color: '#3B82F6',
    status: 'ACTIVE',
    notes: '',
    guidance: {
      overtimeRule: 'Overtime commences after 9 hours of active shift work; calculated at 1.5x regular wage.',
      punchInRule: 'Punch-in permitted 30 mins before shift start. 15-minute grace period applies.',
      punchOutRule: 'Early departure before shift completion requires supervisor half-day clearance.',
      breakPolicy: '1-hour lunch break between 01:00 PM and 02:00 PM + two 15-minute relaxation periods.',
      nightShiftAllowance: '₹250 per night shift allowance + complimentary company transport.',
      swapPolicy: 'Shift swap requests must be submitted 24 hours in advance with mutual consent.',
      geofenceRequirement: 'Mandatory GPS check-in within 150m of assigned office geofence.',
      emergencyContactProtocol: 'Notify HR & Shift Supervisor immediately on emergency absence.',
    },
  });

  // Assign form state
  const [assignDepartmentId, setAssignDepartmentId] = useState('');
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<number[]>([]);

  // 1. Fetch Metrics
  const { data: metrics } = useQuery({
    queryKey: ['shifts-metrics'],
    queryFn: async () => {
      try {
        const res = await api.get('/shifts/metrics');
        return res.data;
      } catch {
        return {
          total: 4,
          active: 4,
          assignedEmployees: 28,
          nightShifts: 1,
          rotationalShifts: 1,
        };
      }
    },
  });

  // 2. Fetch Shifts List
  const { data: shifts = [], isLoading } = useQuery({
    queryKey: ['shifts-list', statusFilter, typeFilter, searchTerm],
    queryFn: async () => {
      try {
        const params: any = {};
        if (statusFilter !== 'ALL') params.status = statusFilter;
        if (typeFilter !== 'ALL') params.type = typeFilter;
        if (searchTerm) params.search = searchTerm;

        const res = await api.get('/shifts', { params });
        const list = Array.isArray(res.data) ? res.data : res.data?.data || [];
        return list;
      } catch {
        return [
          {
            id: 1,
            name: 'General Day Shift',
            code: 'GDS-01',
            startTime: '09:30 AM',
            endTime: '06:30 PM',
            durationHours: 9.0,
            gracePeriodMinutes: 15,
            halfDayThresholdHours: 4.5,
            breakDurationMinutes: 60,
            isNightShift: false,
            isRotational: false,
            workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
            color: '#3B82F6',
            status: 'ACTIVE',
            employeeCount: 18,
            guidance: {
              overtimeRule: 'Overtime commences after 9 hours of active shift work; calculated at 1.5x regular wage.',
              punchInRule: 'Punch-in permitted 30 mins before shift start. 15-minute grace period applies.',
              punchOutRule: 'Early departure before shift completion requires supervisor clearance.',
              breakPolicy: '1-hour lunch break + two 15-min tea breaks.',
              nightShiftAllowance: 'N/A',
              swapPolicy: 'Shift swap requests must be submitted 24 hours in advance with mutual consent.',
              geofenceRequirement: 'Mandatory GPS check-in within 150m of assigned office geofence.',
            },
          },
          {
            id: 2,
            name: 'Morning Operations Shift',
            code: 'MOS-02',
            startTime: '07:00 AM',
            endTime: '04:00 PM',
            durationHours: 9.0,
            gracePeriodMinutes: 10,
            halfDayThresholdHours: 4.5,
            breakDurationMinutes: 45,
            isNightShift: false,
            isRotational: true,
            workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
            color: '#10B981',
            status: 'ACTIVE',
            employeeCount: 6,
            guidance: {
              overtimeRule: 'Overtime computed after 9h at 1.5x base hourly.',
              punchInRule: 'Early check-in from 06:30 AM.',
              punchOutRule: 'Auto-checkout safety at 06:00 PM.',
              breakPolicy: '45 mins lunch break.',
              nightShiftAllowance: 'N/A',
              swapPolicy: 'Requires roster supervisor confirmation.',
              geofenceRequirement: 'Mandatory 150m office radius.',
            },
          },
          {
            id: 3,
            name: 'Night Support Shift',
            code: 'NSS-03',
            startTime: '09:00 PM',
            endTime: '06:00 AM',
            durationHours: 9.0,
            gracePeriodMinutes: 15,
            halfDayThresholdHours: 4.5,
            breakDurationMinutes: 60,
            isNightShift: true,
            isRotational: false,
            workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
            color: '#8B5CF6',
            status: 'ACTIVE',
            employeeCount: 4,
            guidance: {
              overtimeRule: 'Overtime computed after 9h at 2.0x base hourly for night hours.',
              punchInRule: 'Punch-in from 08:30 PM.',
              punchOutRule: 'Company transport escort provided at 06:00 AM.',
              breakPolicy: 'Midnight meal break between 01:00 AM and 02:00 AM.',
              nightShiftAllowance: '₹250 per night shift allowance + complimentary cab pickup.',
              swapPolicy: 'Requires 48 hours advance notice.',
              geofenceRequirement: 'Mandatory GPS check-in.',
            },
          },
        ];
      }
    },
  });

  // 3. Fetch Departments & Employees for Assignment
  const { data: departments = [] } = useQuery({
    queryKey: ['departments-list'],
    queryFn: async () => {
      try {
        const res = await api.get('/departments');
        return Array.isArray(res.data) ? res.data : res.data?.data || [];
      } catch {
        return [];
      }
    },
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['employees-list'],
    queryFn: async () => {
      try {
        const res = await api.get('/employees');
        return Array.isArray(res.data) ? res.data : res.data?.data || [];
      } catch {
        return [];
      }
    },
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      return api.post('/shifts', payload);
    },
    onSuccess: () => {
      toast.success('Shift created with guidance rules successfully!', { icon: '⏰' });
      setIsCreateOpen(false);
      queryClient.invalidateQueries({ queryKey: ['shifts-list'] });
      queryClient.invalidateQueries({ queryKey: ['shifts-metrics'] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  const assignMutation = useMutation({
    mutationFn: async ({ shiftId, payload }: { shiftId: number; payload: any }) => {
      return api.post(`/shifts/${shiftId}/assign`, payload);
    },
    onSuccess: () => {
      toast.success('Employees successfully allocated to shift!', { icon: '👥' });
      setSelectedShiftForAssign(null);
      setSelectedEmployeeIds([]);
      setAssignDepartmentId('');
      queryClient.invalidateQueries({ queryKey: ['shifts-list'] });
      queryClient.invalidateQueries({ queryKey: ['shifts-metrics'] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shiftForm.name.trim() || !shiftForm.code.trim()) {
      toast.error('Please enter Shift Name and Code');
      return;
    }
    createMutation.mutate(shiftForm);
  };

  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShiftForAssign) return;
    if (selectedEmployeeIds.length === 0 && !assignDepartmentId) {
      toast.error('Please select at least one employee or a department');
      return;
    }
    assignMutation.mutate({
      shiftId: selectedShiftForAssign.id,
      payload: {
        employeeIds: selectedEmployeeIds,
        departmentId: assignDepartmentId ? Number(assignDepartmentId) : undefined,
      },
    });
  };

  const dayOptions = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const toggleDay = (day: string) => {
    setShiftForm((prev) => ({
      ...prev,
      workingDays: prev.workingDays.includes(day)
        ? prev.workingDays.filter((d) => d !== day)
        : [...prev.workingDays, day],
    }));
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-16 text-slate-800 animate-in fade-in-50 duration-200">
      {/* 1. TOP HERO HEADER */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#23C45E]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full bg-[#23C45E]/20 text-[#23C45E] border border-[#23C45E]/30 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                HRM Workforce Roster
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Shifts & Shift Guidance</h1>
            <p className="text-slate-300 text-xs sm:text-sm font-medium max-w-2xl">
              Configure daily work schedules, grace periods, late-mark rules, break allowances, and overtime guidance for your organization.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/settings/policies"
              className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white font-bold rounded-2xl text-xs transition-all cursor-pointer border border-white/10"
            >
              <BookOpen className="w-4 h-4 text-[#23C45E]" />
              <span>Company Policies</span>
            </Link>

            <button
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#23C45E] hover:bg-[#1AA14D] text-slate-950 font-black rounded-2xl text-xs transition-all cursor-pointer shadow-lg shadow-[#23C45E]/20"
            >
              <Plus className="w-4 h-4" />
              <span>Create Shift</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. KPI STAT CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">Total Shifts</p>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{metrics?.total || 0}</p>
            <p className="text-[10px] text-slate-400 font-bold mt-1">Configured in roster</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">Active Roster</p>
            <p className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">{metrics?.active || 0}</p>
            <p className="text-[10px] text-emerald-700 font-bold mt-1">Operational today</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">Allocated Employees</p>
            <p className="text-2xl sm:text-3xl font-black text-indigo-600 mt-1">{metrics?.assignedEmployees || 0}</p>
            <p className="text-[10px] text-indigo-700 font-bold mt-1">With assigned shifts</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">Night / Rotational</p>
            <p className="text-2xl sm:text-3xl font-black text-purple-600 mt-1">
              {(metrics?.nightShifts || 0) + (metrics?.rotationalShifts || 0)}
            </p>
            <p className="text-[10px] text-purple-700 font-bold mt-1">Special allowance shifts</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Moon className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 3. FILTER TOOLBAR */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === s ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {s === 'ALL' ? 'All Shifts' : s === 'ACTIVE' ? 'Active' : 'Inactive'}
              </button>
            ))}
          </div>

          {/* Type Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            {(['ALL', 'NIGHT', 'ROTATIONAL'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  typeFilter === t ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t === 'ALL' ? 'All Types' : t === 'NIGHT' ? '🌙 Night' : '🔄 Rotational'}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search shift name, code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-[#23C45E]"
          />
        </div>
      </div>

      {/* 4. SHIFTS LISTING & GUIDANCE CARDS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {shifts.map((shift: any) => {
          const isNight = shift.isNightShift;
          const isRotational = shift.isRotational;
          const guidance = shift.guidance;

          return (
            <div
              key={shift.id}
              className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Shift Card Header */}
                <div
                  className="p-5 border-b border-slate-100 flex items-start justify-between gap-3 relative"
                  style={{ borderTop: `4px solid ${shift.color || '#3B82F6'}` }}
                >
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-800 text-[10px] font-black tracking-wider uppercase">
                        {shift.code}
                      </span>
                      {isNight && (
                        <span className="px-2.5 py-0.5 rounded-lg bg-purple-100 text-purple-700 text-[10px] font-black uppercase flex items-center gap-1">
                          <Moon className="w-3 h-3" />
                          Night Shift
                        </span>
                      )}
                      {isRotational && (
                        <span className="px-2.5 py-0.5 rounded-lg bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase flex items-center gap-1">
                          <RotateCcw className="w-3 h-3" />
                          Rotational
                        </span>
                      )}
                    </div>

                    <h3 className="font-black text-slate-900 text-base mt-1.5">{shift.name}</h3>
                    <p className="text-xs font-bold text-slate-500 mt-0.5">
                      {shift.durationHours} Hours / Day • {shift.gracePeriodMinutes}m Grace Period
                    </p>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      shift.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {shift.status}
                  </span>
                </div>

                {/* Timing & Metrics */}
                <div className="p-5 space-y-4">
                  <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                        Shift Timings
                      </span>
                      <span className="text-xs font-black text-slate-900">
                        {shift.startTime} – {shift.endTime}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                        Assigned Staff
                      </span>
                      <span className="text-xs font-black text-indigo-600 flex items-center gap-1 justify-end">
                        <Users className="w-3.5 h-3.5" />
                        {shift.employeeCount || 0} Employees
                      </span>
                    </div>
                  </div>

                  {/* Working Days */}
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">
                      Operational Days
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {(shift.workingDays || []).map((day: string) => (
                        <span
                          key={day}
                          className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] font-bold"
                        >
                          {day.slice(0, 3)}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Shift Guidance Highlights */}
                  {guidance && (
                    <div className="border-t border-slate-100 pt-3 space-y-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-[#23C45E]" />
                        Shift Guidance Rules
                      </span>

                      <div className="text-[11px] space-y-1.5">
                        <div className="flex items-start gap-1.5 text-slate-600">
                          <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                          <span className="line-clamp-1">
                            <strong className="text-slate-800">Overtime:</strong> {guidance.overtimeRule}
                          </span>
                        </div>

                        <div className="flex items-start gap-1.5 text-slate-600">
                          <Coffee className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                          <span className="line-clamp-1">
                            <strong className="text-slate-800">Breaks:</strong> {guidance.breakPolicy}
                          </span>
                        </div>

                        {isNight && guidance.nightShiftAllowance && (
                          <div className="flex items-start gap-1.5 text-purple-700 bg-purple-50 p-1.5 rounded-lg font-bold text-[10px]">
                            <Moon className="w-3 h-3 text-purple-600 shrink-0 mt-0.5" />
                            <span>{guidance.nightShiftAllowance}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => setSelectedShiftForGuidance(shift)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs border border-slate-200 cursor-pointer shadow-2xs"
                >
                  <BookOpen className="w-3.5 h-3.5 text-slate-500" />
                  <span>View Guidance</span>
                </button>

                <button
                  onClick={() => {
                    setSelectedShiftForAssign(shift);
                    setSelectedEmployeeIds([]);
                    setAssignDepartmentId('');
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#23C45E] hover:bg-[#1AA14D] text-slate-950 font-black rounded-xl text-xs transition-all cursor-pointer shadow-2xs"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Assign Staff</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 5. SHIFT GUIDANCE INSPECTION MODAL */}
      {selectedShiftForGuidance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-50 duration-150">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedShiftForGuidance(null)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-[#23C45E]/10 text-[#23C45E] text-xs font-black uppercase">
                {selectedShiftForGuidance.code}
              </span>
              <h3 className="text-xl font-black text-slate-900">{selectedShiftForGuidance.name} Guidance</h3>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Roster guidelines, attendance rules, and statutory allowances for this shift.
            </p>

            <div className="mt-6 space-y-4 text-xs font-medium">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <h4 className="font-black text-slate-900 text-sm flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  Overtime & Extended Hours Rule
                </h4>
                <p className="text-slate-700 mt-1">
                  {selectedShiftForGuidance.guidance?.overtimeRule || 'Standard overtime calculation applies.'}
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <h4 className="font-black text-slate-900 text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-500" />
                  Punch-In & Grace Period Rule
                </h4>
                <p className="text-slate-700 mt-1">
                  {selectedShiftForGuidance.guidance?.punchInRule || '15-minute grace period.'}
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <h4 className="font-black text-slate-900 text-sm flex items-center gap-2">
                  <Coffee className="w-4 h-4 text-emerald-500" />
                  Break & Lunch Schedule
                </h4>
                <p className="text-slate-700 mt-1">
                  {selectedShiftForGuidance.guidance?.breakPolicy || '1 hour lunch break.'}
                </p>
              </div>

              {selectedShiftForGuidance.isNightShift && (
                <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100">
                  <h4 className="font-black text-purple-900 text-sm flex items-center gap-2">
                    <Moon className="w-4 h-4 text-purple-600" />
                    Night Shift Allowance & Transportation Protocol
                  </h4>
                  <p className="text-purple-800 mt-1">
                    {selectedShiftForGuidance.guidance?.nightShiftAllowance || 'Night allowance provided.'}
                  </p>
                </div>
              )}

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <h4 className="font-black text-slate-900 text-sm flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-indigo-500" />
                  Shift Swap & Reassignment Policy
                </h4>
                <p className="text-slate-700 mt-1">
                  {selectedShiftForGuidance.guidance?.swapPolicy || '24 hours advance notice required.'}
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <h4 className="font-black text-slate-900 text-sm flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-rose-500" />
                  GPS Geofence Requirement
                </h4>
                <p className="text-slate-700 mt-1">
                  {selectedShiftForGuidance.guidance?.geofenceRequirement || 'Within 150m office radius.'}
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedShiftForGuidance(null)}
                className="px-5 py-2.5 bg-slate-900 text-white font-black rounded-xl text-xs cursor-pointer hover:bg-slate-800"
              >
                Close Guidance
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. ASSIGN EMPLOYEES TO SHIFT MODAL */}
      {selectedShiftForAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-50 duration-150">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedShiftForAssign(null)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-black text-slate-900">
              Assign Staff to {selectedShiftForAssign.name}
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Select an entire department or check individual employees to allocate to {selectedShiftForAssign.code}.
            </p>

            <form onSubmit={handleAssignSubmit} className="mt-6 space-y-4">
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 block mb-1.5">
                  Allocate Entire Department
                </label>
                <select
                  value={assignDepartmentId}
                  onChange={(e) => setAssignDepartmentId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#23C45E]"
                >
                  <option value="">-- Choose Department (Optional) --</option>
                  {departments.map((dept: any) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 block mb-1.5">
                  Or Select Individual Employees
                </label>
                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-2xl p-2 space-y-1 bg-slate-50">
                  {employees.map((emp: any) => {
                    const isChecked = selectedEmployeeIds.includes(emp.id);
                    return (
                      <label
                        key={emp.id}
                        className="flex items-center justify-between p-2 rounded-xl hover:bg-white transition-colors cursor-pointer text-xs font-bold text-slate-800"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedEmployeeIds([...selectedEmployeeIds, emp.id]);
                              } else {
                                setSelectedEmployeeIds(selectedEmployeeIds.filter((id) => id !== emp.id));
                              }
                            }}
                            className="w-4 h-4 rounded text-[#23C45E] focus:ring-[#23C45E]"
                          />
                          <span>
                            {emp.firstName} {emp.lastName} ({emp.employeeCode})
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {emp.department?.name || 'General'}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedShiftForAssign(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assignMutation.isPending}
                  className="px-5 py-2.5 bg-[#23C45E] hover:bg-[#1AA14D] text-slate-950 font-black rounded-xl text-xs transition-all cursor-pointer shadow-md disabled:opacity-50"
                >
                  {assignMutation.isPending ? 'Assigning...' : 'Confirm Allocation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. CREATE SHIFT DRAWER */}
      <AdminFormDrawer
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create New Shift & Guidance"
        description="Configure shift timings, grace period, operational days, and roster guidance."
      >
        <form onSubmit={handleCreateSubmit} className="space-y-5 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-black text-slate-700 block mb-1">Shift Name *</label>
              <input
                type="text"
                placeholder="e.g. Afternoon Production Shift"
                value={shiftForm.name}
                onChange={(e) => setShiftForm({ ...shiftForm, name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-[#23C45E]"
                required
              />
            </div>
            <div>
              <label className="font-black text-slate-700 block mb-1">Shift Code *</label>
              <input
                type="text"
                placeholder="e.g. APS-02"
                value={shiftForm.code}
                onChange={(e) => setShiftForm({ ...shiftForm, code: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-[#23C45E]"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-black text-slate-700 block mb-1">Start Time *</label>
              <input
                type="text"
                value={shiftForm.startTime}
                onChange={(e) => setShiftForm({ ...shiftForm, startTime: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-[#23C45E]"
              />
            </div>
            <div>
              <label className="font-black text-slate-700 block mb-1">End Time *</label>
              <input
                type="text"
                value={shiftForm.endTime}
                onChange={(e) => setShiftForm({ ...shiftForm, endTime: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-[#23C45E]"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-black text-slate-700 block mb-1">Duration (Hours)</label>
              <input
                type="number"
                step="0.5"
                value={shiftForm.durationHours}
                onChange={(e) => setShiftForm({ ...shiftForm, durationHours: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-[#23C45E]"
              />
            </div>
            <div>
              <label className="font-black text-slate-700 block mb-1">Grace Period (Mins)</label>
              <input
                type="number"
                value={shiftForm.gracePeriodMinutes}
                onChange={(e) => setShiftForm({ ...shiftForm, gracePeriodMinutes: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-[#23C45E]"
              />
            </div>
            <div>
              <label className="font-black text-slate-700 block mb-1">Break (Mins)</label>
              <input
                type="number"
                value={shiftForm.breakDurationMinutes}
                onChange={(e) => setShiftForm({ ...shiftForm, breakDurationMinutes: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-[#23C45E]"
              />
            </div>
          </div>

          {/* Working Days */}
          <div>
            <label className="font-black text-slate-700 block mb-1.5">Operational Days</label>
            <div className="flex flex-wrap gap-1.5">
              {dayOptions.map((day) => {
                const isSelected = shiftForm.workingDays.includes(day);
                return (
                  <button
                    type="button"
                    key={day}
                    onClick={() => toggleDay(day)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isSelected ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {day.slice(0, 3)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Toggles */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <label className="flex items-center gap-2 cursor-pointer font-bold">
              <input
                type="checkbox"
                checked={shiftForm.isNightShift}
                onChange={(e) => setShiftForm({ ...shiftForm, isNightShift: e.target.checked })}
                className="w-4 h-4 rounded text-[#23C45E] focus:ring-[#23C45E]"
              />
              <span>🌙 Night Shift</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer font-bold">
              <input
                type="checkbox"
                checked={shiftForm.isRotational}
                onChange={(e) => setShiftForm({ ...shiftForm, isRotational: e.target.checked })}
                className="w-4 h-4 rounded text-[#23C45E] focus:ring-[#23C45E]"
              />
              <span>🔄 Rotational Roster</span>
            </label>
          </div>

          {/* Shift Guidance Fields */}
          <div className="border-t border-slate-200 pt-4 space-y-3">
            <h4 className="font-black text-slate-900 text-sm flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#23C45E]" />
              Shift Guidance & Roster Rules
            </h4>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Overtime Calculation Rule</label>
              <input
                type="text"
                value={shiftForm.guidance.overtimeRule}
                onChange={(e) =>
                  setShiftForm({
                    ...shiftForm,
                    guidance: { ...shiftForm.guidance, overtimeRule: e.target.value },
                  })
                }
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Punch-In & Grace Period Rule</label>
              <input
                type="text"
                value={shiftForm.guidance.punchInRule}
                onChange={(e) =>
                  setShiftForm({
                    ...shiftForm,
                    guidance: { ...shiftForm.guidance, punchInRule: e.target.value },
                  })
                }
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Break & Meal Policy</label>
              <input
                type="text"
                value={shiftForm.guidance.breakPolicy}
                onChange={(e) =>
                  setShiftForm({
                    ...shiftForm,
                    guidance: { ...shiftForm.guidance, breakPolicy: e.target.value },
                  })
                }
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
              />
            </div>

            {shiftForm.isNightShift && (
              <div>
                <label className="font-bold text-purple-900 block mb-1">Night Allowance & Transport Rule</label>
                <input
                  type="text"
                  value={shiftForm.guidance.nightShiftAllowance}
                  onChange={(e) =>
                    setShiftForm({
                      ...shiftForm,
                      guidance: { ...shiftForm.guidance, nightShiftAllowance: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-purple-50 border border-purple-200 rounded-xl font-bold text-purple-900"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-5 py-2 bg-[#23C45E] hover:bg-[#1AA14D] text-slate-950 font-black rounded-xl shadow-md disabled:opacity-50"
            >
              {createMutation.isPending ? 'Saving Shift...' : 'Save Shift'}
            </button>
          </div>
        </form>
      </AdminFormDrawer>
    </div>
  );
}
