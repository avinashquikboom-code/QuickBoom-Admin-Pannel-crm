'use client';

import React, { useState } from 'react';
import {
  Clock,
  Calendar,
  Filter,
  Download,
  CheckCircle,
  AlertCircle,
  MapPin,
  Search,
  Check,
  X,
  FileCheck,
} from 'lucide-react';

interface AttendanceRecord {
  id: string;
  employeeName: string;
  employeeId: string;
  department: string;
  date: string;
  checkIn: string;
  checkOut: string;
  workingHours: number;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'REMOTE' | 'HALF_DAY';
  location: string;
}

const mockAttendance: AttendanceRecord[] = [
  {
    id: '1',
    employeeName: 'Rahul Sharma',
    employeeId: 'EMP001',
    department: 'Sales',
    date: '2026-08-15',
    checkIn: '09:00 AM',
    checkOut: '06:00 PM',
    workingHours: 9.0,
    status: 'PRESENT',
    location: 'Bandra HQ (GPS Verified)',
  },
  {
    id: '2',
    employeeName: 'Priya Singh',
    employeeId: 'EMP002',
    department: 'Engineering',
    date: '2026-08-15',
    checkIn: '09:42 AM',
    checkOut: '06:15 PM',
    workingHours: 8.5,
    status: 'LATE',
    location: 'Remote / WFH',
  },
  {
    id: '3',
    employeeName: 'Amit Verma',
    employeeId: 'EMP003',
    department: 'Marketing',
    date: '2026-08-15',
    checkIn: '09:05 AM',
    checkOut: '05:30 PM',
    workingHours: 8.4,
    status: 'REMOTE',
    location: 'Client Site (Andheri)',
  },
  {
    id: '4',
    employeeName: 'Sneha Gupta',
    employeeId: 'EMP004',
    department: 'Operations',
    date: '2026-08-15',
    checkIn: '-',
    checkOut: '-',
    workingHours: 0,
    status: 'ABSENT',
    location: 'N/A',
  },
];

export default function AttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>(mockAttendance);
  const [selectedDate, setSelectedDate] = useState('2026-08-15');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);

  const filtered = records.filter((r) => {
    return statusFilter === 'ALL' || r.status === statusFilter;
  });

  return (
    <div className="space-y-8">
      {/* Top Title Card Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-900 via-emerald-800 to-slate-900 p-6 sm:p-8 rounded-3xl text-white shadow-lg border border-emerald-800">
        <div>
          <div className="flex items-center gap-2 text-emerald-300 font-extrabold text-xs uppercase tracking-wider mb-1">
            <Clock className="w-4 h-4 text-emerald-400" /> TIME & GPS PUNCH TRACKING
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
            Attendance & Time Logs
          </h1>
          <p className="text-xs md:text-sm text-slate-200 mt-1 font-medium">
            Monitor daily check-ins, GPS-verified punch times, late arrivals, and attendance corrections.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCorrectionModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold transition-all shadow-md cursor-pointer"
          >
            <FileCheck className="w-4 h-4" /> Correction Requests (2)
          </button>
        </div>
      </div>

      {/* Date & Status Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-bold text-slate-700">Date:</span>
          </div>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <span className="text-xs font-semibold text-slate-500">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="PRESENT">Present</option>
            <option value="LATE">Late</option>
            <option value="REMOTE">Remote</option>
            <option value="ABSENT">Absent</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase">Present</p>
          <p className="text-xl font-black text-emerald-600 mt-1">210 Employees</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase">Late Check-ins</p>
          <p className="text-xl font-black text-amber-600 mt-1">15 Employees</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase">Remote Work</p>
          <p className="text-xl font-black text-indigo-600 mt-1">14 Employees</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase">Absent</p>
          <p className="text-xl font-black text-rose-600 mt-1">8 Employees</p>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Employee</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4">Check In</th>
                <th className="py-3.5 px-4">Check Out</th>
                <th className="py-3.5 px-4">Total Hours</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Punch Location</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4">
                    <p className="font-bold text-slate-900">{r.employeeName}</p>
                    <p className="text-[11px] font-semibold text-indigo-600">{r.employeeId}</p>
                  </td>

                  <td className="py-3.5 px-4 font-semibold text-slate-700">{r.department}</td>

                  <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{r.checkIn}</td>

                  <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{r.checkOut}</td>

                  <td className="py-3.5 px-4 font-bold text-slate-900">{r.workingHours} hrs</td>

                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        r.status === 'PRESENT'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : r.status === 'LATE'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : r.status === 'REMOTE'
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-slate-500 font-medium flex items-center gap-1.5 pt-4">
                    <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{r.location}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Corrections Modal */}
      {showCorrectionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-black text-slate-900">Attendance Correction Requests</h2>
              <button
                onClick={() => setShowCorrectionModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                <div className="flex justify-between font-bold text-slate-900">
                  <span>Vikram Mehta (EMP005)</span>
                  <span className="text-amber-600">Pending</span>
                </div>
                <p className="text-slate-600">Requested Check In: 09:00 AM (Reason: Network issue at entrance)</p>
                <div className="flex justify-end gap-2 pt-2">
                  <button className="px-3 py-1 bg-rose-100 text-rose-700 font-bold rounded-lg flex items-center gap-1">
                    <X className="w-3 h-3" /> Reject
                  </button>
                  <button className="px-3 py-1 bg-emerald-600 text-white font-bold rounded-lg flex items-center gap-1 shadow-2xs">
                    <Check className="w-3 h-3" /> Approve
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
