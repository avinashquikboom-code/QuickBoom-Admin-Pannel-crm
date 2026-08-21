'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Plus,
  Check,
  X,
  User,
} from 'lucide-react';

import api from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

interface LeaveRequest {
  id: string;
  employeeName: string;
  employeeId: string;
  leaveType: string;
  fromDate: string;
  toDate: string;
  totalDays: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  appliedOn: string;
}

export default function LeavesPage() {
  const { data: leavesData } = useQuery({
    queryKey: ['admin-hrm-leaves'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/employees/hrm/leaves');
        return res?.data || res;
      } catch {
        return [];
      }
    },
  });

  const [localStatusMap, setLocalStatusMap] = useState<Record<string, 'APPROVED' | 'REJECTED'>>({});
  const [tab, setTab] = useState<'requests' | 'types'>('requests');

  const requests: LeaveRequest[] = Array.isArray(leavesData)
    ? leavesData.map((l: any) => ({
        ...l,
        status: localStatusMap[l.id] || l.status,
      }))
    : [];

  const handleApprove = (id: string) => {
    setLocalStatusMap((prev) => ({ ...prev, [id]: 'APPROVED' }));
  };

  const handleReject = (id: string) => {
    setLocalStatusMap((prev) => ({ ...prev, [id]: 'REJECTED' }));
  };

  return (
    <div className="space-y-8">
      {/* Top Title Card Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-900 via-emerald-800 to-slate-900 p-6 sm:p-8 rounded-3xl text-white shadow-lg border border-emerald-800">
        <div>
          <div className="flex items-center gap-2 text-emerald-300 font-extrabold text-xs uppercase tracking-wider mb-1">
            <Calendar className="w-4 h-4 text-emerald-400" /> HRM LEAVE MANAGEMENT
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
            Leave Applications & Policies
          </h1>
          <p className="text-xs md:text-sm text-slate-200 mt-1 font-medium">
            Review staff leave applications, approve requests, and manage annual leave quotas.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/leaves/create"
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold transition-all shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Leave Policy
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setTab('requests')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            tab === 'requests' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Leave Applications
        </button>
        <button
          onClick={() => setTab('types')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            tab === 'types' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Leave Types & Quotas
        </button>
      </div>

      {tab === 'requests' ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Employee</th>
                  <th className="py-3.5 px-4">Leave Type</th>
                  <th className="py-3.5 px-4">Duration & Dates</th>
                  <th className="py-3.5 px-4">Reason</th>
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

                    <td className="py-3.5 px-4 font-bold text-slate-800">{req.leaveType}</td>

                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900">{req.totalDays} Days</p>
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <h3 className="font-bold text-slate-900 text-base">Casual Leave (CL)</h3>
            <p className="text-2xl font-black text-indigo-600 mt-2">12 Days / Year</p>
            <p className="text-xs text-slate-500 mt-1">Paid leave for personal matters. Max 3 consecutive days.</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <h3 className="font-bold text-slate-900 text-base">Sick Leave (SL)</h3>
            <p className="text-2xl font-black text-emerald-600 mt-2">10 Days / Year</p>
            <p className="text-xs text-slate-500 mt-1">Medical leave requiring doctor certificate for &gt; 2 days.</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <h3 className="font-bold text-slate-900 text-base">Earned Leave (EL)</h3>
            <p className="text-2xl font-black text-amber-600 mt-2">15 Days / Year</p>
            <p className="text-xs text-slate-500 mt-1">Accumulated paid annual vacation leave. Carry-forward supported.</p>
          </div>
        </div>
      )}
    </div>
  );
}
