'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Clock,
  Users,
  ArrowLeft,
  Calendar,
  Zap,
  Coffee,
  Moon,
  RotateCcw,
  MapPin,
  Sparkles,
  ShieldCheck,
  Building2,
  Mail,
  Phone,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { AdminPageHeader, AdminButton } from '@/components/admin';

export default function ShiftDetailPage() {
  const { id } = useParams();

  const { data: shift, isLoading } = useQuery({
    queryKey: ['shift-detail', id],
    queryFn: async () => {
      try {
        const res = await api.get(`/shifts/${id}`);
        return res.data;
      } catch {
        return null;
      }
    },
  });

  if (isLoading) {
    return (
      <div className="py-20 text-center text-slate-400 font-bold animate-pulse">
        Loading shift #{id}...
      </div>
    );
  }

  if (!shift) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-slate-200">
        <p className="font-bold text-slate-700">Shift #{id} not found</p>
        <Link href="/shifts" className="text-xs text-[#23C45E] font-bold mt-2 inline-block">
          Return to Shifts
        </Link>
      </div>
    );
  }

  const isNight = shift.isNightShift;
  const isRotational = shift.isRotational;
  const guidance = shift.guidance;
  const employees = Array.isArray(shift.employees) ? shift.employees : [];

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-16 text-slate-800 animate-in fade-in-50 duration-200">
      {/* 1. PAGE HEADER */}
      <AdminPageHeader
        title={shift?.name || 'Shift Details'}
        description={`${shift?.startTime || '09:30 AM'} – ${shift?.endTime || '06:30 PM'} • ${shift?.durationHours ?? 9} Hours • ${shift?.gracePeriodMinutes ?? 15}m Grace`}
        icon={Clock}
        iconColor="text-emerald-600"
        badge={{
          text: `${shift?.code || 'SHIFT'} • ${shift?.status || 'ACTIVE'}`,
          icon: Clock,
          variant: shift?.status === 'ACTIVE' ? 'emerald' : 'slate',
        }}
        breadcrumbs={[
          { label: 'HRMS', href: '/shifts' },
          { label: 'Shifts', href: '/shifts' },
          { label: shift?.name || 'Shift Details' },
        ]}
        actions={
          <div className="flex items-center gap-2.5">
            <Link href="/shifts">
              <AdminButton
                variant="outline"
                size="md"
                icon={ArrowLeft}
              >
                Back to Shifts
              </AdminButton>
            </Link>
            <div className="bg-emerald-50 text-emerald-800 px-3.5 py-1.5 rounded-xl border border-emerald-200 text-xs font-black">
              {employees.length} Employees Allocated
            </div>
          </div>
        }
      />

      {/* 2. SHIFT GUIDANCE RULES GRID */}
      {guidance && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#23C45E]" />
              Shift Guidance & Roster Regulations
            </h3>
            <span className="text-xs font-bold text-slate-400">Roster Compliance Standard</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <h4 className="font-black text-slate-900 flex items-center gap-1.5 mb-1">
                <Zap className="w-4 h-4 text-amber-500" />
                Overtime Calculation
              </h4>
              <p className="text-slate-600 font-medium">{guidance.overtimeRule}</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <h4 className="font-black text-slate-900 flex items-center gap-1.5 mb-1">
                <Clock className="w-4 h-4 text-blue-500" />
                Punch-in & Grace Period
              </h4>
              <p className="text-slate-600 font-medium">{guidance.punchInRule}</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <h4 className="font-black text-slate-900 flex items-center gap-1.5 mb-1">
                <Coffee className="w-4 h-4 text-emerald-500" />
                Break & Meal Timing
              </h4>
              <p className="text-slate-600 font-medium">{guidance.breakPolicy}</p>
            </div>

            {isNight && (
              <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100">
                <h4 className="font-black text-purple-900 flex items-center gap-1.5 mb-1">
                  <Moon className="w-4 h-4 text-purple-600" />
                  Night Shift Allowance
                </h4>
                <p className="text-purple-800 font-medium">{guidance.nightShiftAllowance}</p>
              </div>
            )}

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <h4 className="font-black text-slate-900 flex items-center gap-1.5 mb-1">
                <RotateCcw className="w-4 h-4 text-indigo-500" />
                Shift Swap Policy
              </h4>
              <p className="text-slate-600 font-medium">{guidance.swapPolicy}</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <h4 className="font-black text-slate-900 flex items-center gap-1.5 mb-1">
                <MapPin className="w-4 h-4 text-rose-500" />
                Geofence Radius
              </h4>
              <p className="text-slate-600 font-medium">{guidance.geofenceRequirement}</p>
            </div>
          </div>
        </div>
      )}

      {/* 3. ASSIGNED EMPLOYEES ROSTER TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600" />
            Allocated Workforce Roster ({employees.length})
          </h3>
        </div>

        {employees.length === 0 ? (
          <div className="py-12 text-center text-slate-400 font-bold text-xs">
            No employees currently allocated to this shift.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 font-black uppercase border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Designation</th>
                  <th className="px-4 py-3">Contact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {employees.map((emp: any) => (
                  <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-bold text-slate-900">
                      {emp.firstName} {emp.lastName}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-500">{emp.employeeCode}</td>
                    <td className="px-4 py-3">{emp.department?.name || 'General'}</td>
                    <td className="px-4 py-3">{emp.designation?.name || 'Staff'}</td>
                    <td className="px-4 py-3 text-slate-500">
                      {emp.email} {emp.phone ? `• ${emp.phone}` : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
