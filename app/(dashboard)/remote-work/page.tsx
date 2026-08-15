'use client';

import React, { useState } from 'react';
import {
  Laptop,
  CheckCircle,
  XCircle,
  Clock,
  Check,
  X,
  MapPin,
} from 'lucide-react';

interface RemoteRequest {
  id: string;
  employeeName: string;
  employeeId: string;
  department: string;
  fromDate: string;
  toDate: string;
  totalDays: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  appliedOn: string;
}

const mockRemoteRequests: RemoteRequest[] = [
  {
    id: '1',
    employeeName: 'Priya Singh',
    employeeId: 'EMP002',
    department: 'Engineering',
    fromDate: '2026-08-18',
    toDate: '2026-08-19',
    totalDays: 2,
    reason: 'Deep focus work on sprint release release build',
    status: 'PENDING',
    appliedOn: '2026-08-14',
  },
  {
    id: '2',
    employeeName: 'Amit Verma',
    employeeId: 'EMP003',
    department: 'Marketing',
    fromDate: '2026-08-15',
    toDate: '2026-08-15',
    totalDays: 1,
    reason: 'Working from home due to apartment maintenance',
    status: 'APPROVED',
    appliedOn: '2026-08-13',
  },
];

export default function RemoteWorkPage() {
  const [requests, setRequests] = useState<RemoteRequest[]>(mockRemoteRequests);

  const handleApprove = (id: string) => {
    setRequests(requests.map((r) => (r.id === id ? { ...r, status: 'APPROVED' } : r)));
  };

  const handleReject = (id: string) => {
    setRequests(requests.map((r) => (r.id === id ? { ...r, status: 'REJECTED' } : r)));
  };

  return (
    <div className="space-y-8">
      {/* Top Title Card Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-900 via-emerald-800 to-slate-900 p-6 sm:p-8 rounded-3xl text-white shadow-lg border border-emerald-800">
        <div>
          <div className="flex items-center gap-2 text-emerald-300 font-extrabold text-xs uppercase tracking-wider mb-1">
            <Laptop className="w-4 h-4 text-emerald-400" /> REMOTE WORK & WFH APPROVALS
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
            Remote Work & WFH Applications
          </h1>
          <p className="text-xs md:text-sm text-slate-200 mt-1 font-medium">
            Manage staff work-from-home requests, task commitments, and remote attendance permissions.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase">Pending Requests</span>
          <p className="text-2xl font-black text-amber-600 mt-1">1 Application</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase">Approved This Month</span>
          <p className="text-2xl font-black text-indigo-600 mt-1">14 Days</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase">Remote Employees Today</span>
          <p className="text-2xl font-black text-emerald-600 mt-1">4 Employees</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Employee</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4">Dates & Duration</th>
                <th className="py-3.5 px-4">Work Objective / Reason</th>
                <th className="py-3.5 px-4">Applied On</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {requests.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4">
                    <p className="font-bold text-slate-900">{req.employeeName}</p>
                    <p className="text-[11px] font-semibold text-indigo-600">{req.employeeId}</p>
                  </td>

                  <td className="py-3.5 px-4 font-bold text-slate-800">{req.department}</td>

                  <td className="py-3.5 px-4">
                    <p className="font-bold text-slate-900">{req.totalDays} Day(s)</p>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {req.fromDate} to {req.toDate}
                    </p>
                  </td>

                  <td className="py-3.5 px-4 max-w-xs truncate text-slate-600 font-medium">
                    {req.reason}
                  </td>

                  <td className="py-3.5 px-4 text-slate-500 font-medium">{req.appliedOn}</td>

                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        req.status === 'APPROVED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : req.status === 'PENDING'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {req.status}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    {req.status === 'PENDING' ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleReject(req.id)}
                          className="px-2.5 py-1 bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold rounded-lg transition-colors text-[11px] flex items-center gap-1"
                        >
                          <X className="w-3.5 h-3.5" /> Reject
                        </button>
                        <button
                          onClick={() => handleApprove(req.id)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors text-[11px] flex items-center gap-1 shadow-2xs"
                        >
                          <Check className="w-3.5 h-3.5" /> Approve
                        </button>
                      </div>
                    ) : (
                      <span className="text-[11px] font-semibold text-slate-400">Processed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
