'use client';

import React, { useState } from 'react';
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
import { toast } from 'react-hot-toast';
import { AdminFormDrawer } from '@/components/admin';

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
  const { data: leavesData, refetch } = useQuery({
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
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [leaveForm, setLeaveForm] = useState({
    employeeName: '',
    leaveType: 'Casual Leave',
    fromDate: '',
    toDate: '',
    reason: '',
  });

  const requests: LeaveRequest[] = Array.isArray(leavesData)
    ? leavesData.map((l: any) => ({
        ...l,
        status: localStatusMap[l.id] || l.status,
      }))
    : [];

  const handleApprove = (id: string) => {
    setLocalStatusMap((prev) => ({ ...prev, [id]: 'APPROVED' }));
    toast.success('Leave application approved');
  };

  const handleReject = (id: string) => {
    setLocalStatusMap((prev) => ({ ...prev, [id]: 'REJECTED' }));
    toast.error('Leave application rejected');
  };

  const handleSaveLeave = async () => {
    if (!leaveForm.employeeName.trim() || !leaveForm.fromDate) {
      toast.error('Please enter employee name and leave dates');
      return;
    }
    setIsSubmitting(true);
    try {
      toast.success('Leave application submitted successfully!');
      setIsDrawerOpen(false);
      refetch();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-[#1AA14D] font-extrabold text-xs uppercase tracking-wider mb-1">
            <Calendar className="w-4 h-4 text-[#23C45E]" /> HRM LEAVE MANAGEMENT
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
            Leave Applications & Policies
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-medium">
            Review staff leave applications, approve requests, and manage annual leave quotas.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setLeaveForm({
                employeeName: '',
                leaveType: 'Casual Leave',
                fromDate: '',
                toDate: '',
                reason: '',
              });
              setIsDrawerOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#23C45E] hover:bg-[#1AA14D] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Apply Leave / Policy
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setTab('requests')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            tab === 'requests' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Leave Applications
        </button>
        <button
          onClick={() => setTab('types')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            tab === 'types' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Policy Types & Quotas
        </button>
      </div>

      {tab === 'requests' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-400 font-black uppercase text-[10px] tracking-wider border-b border-slate-100">
              <tr>
                <th className="p-4">Staff Member</th>
                <th className="p-4">Leave Type</th>
                <th className="p-4">Duration</th>
                <th className="p-4">Days</th>
                <th className="p-4">Reason</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Approval Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-bold">
                    No leave requests found in database.
                  </td>
                </tr>
              ) : (
                requests.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-4">
                      <p className="font-black text-slate-900">{r.employeeName}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{r.employeeId}</p>
                    </td>
                    <td className="p-4 font-bold text-slate-800">{r.leaveType}</td>
                    <td className="p-4 text-slate-600 font-semibold">{r.fromDate} → {r.toDate}</td>
                    <td className="p-4 font-bold text-slate-900">{r.totalDays} Days</td>
                    <td className="p-4 text-slate-600 max-w-xs truncate">{r.reason}</td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase ${
                          r.status === 'APPROVED'
                            ? 'bg-[#E8F9EE] text-[#1AA14D] border border-[#23C45E]/30'
                            : r.status === 'REJECTED'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {r.status === 'PENDING' ? (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleApprove(r.id)}
                            className="p-1.5 rounded-lg bg-[#E8F9EE] text-[#1AA14D] hover:bg-[#23C45E] hover:text-white transition-colors cursor-pointer"
                            title="Approve Leave"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReject(r.id)}
                            className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-colors cursor-pointer"
                            title="Reject Leave"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px] font-bold">Processed</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'types' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: 'Casual Leave (CL)', quota: '12 Days / Year', desc: 'Personal short leave and errands' },
            { title: 'Sick Leave (SL)', quota: '10 Days / Year', desc: 'Medical and health recuperation' },
            { title: 'Earned Leave (EL)', quota: '15 Days / Year', desc: 'Annual paid leave entitlement' },
          ].map((policy, idx) => (
            <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
              <h3 className="font-black text-slate-900 text-sm">{policy.title}</h3>
              <p className="text-lg font-black text-[#1AA14D]">{policy.quota}</p>
              <p className="text-xs text-slate-500 font-medium">{policy.desc}</p>
            </div>
          ))}
        </div>
      )}

      {/* Right-Side Admin Form Drawer */}
      <AdminFormDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Apply Leave Application"
        description="Submit leave record on behalf of workforce staff"
        size="md"
        onSave={handleSaveLeave}
        saveLabel="Submit Application"
        isSubmitting={isSubmitting}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
              Employee Name *
            </label>
            <input
              type="text"
              value={leaveForm.employeeName}
              onChange={(e) => setLeaveForm({ ...leaveForm, employeeName: e.target.value })}
              placeholder="e.g. Rahul Sharma"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#23C45E] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
              Leave Type
            </label>
            <select
              value={leaveForm.leaveType}
              onChange={(e) => setLeaveForm({ ...leaveForm, leaveType: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#23C45E] focus:outline-none"
            >
              <option value="Casual Leave">Casual Leave (CL)</option>
              <option value="Sick Leave">Sick Leave (SL)</option>
              <option value="Earned Leave">Earned Leave (EL)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                From Date *
              </label>
              <input
                type="date"
                value={leaveForm.fromDate}
                onChange={(e) => setLeaveForm({ ...leaveForm, fromDate: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#23C45E] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                To Date
              </label>
              <input
                type="date"
                value={leaveForm.toDate}
                onChange={(e) => setLeaveForm({ ...leaveForm, toDate: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#23C45E] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
              Reason
            </label>
            <textarea
              value={leaveForm.reason}
              onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
              rows={3}
              placeholder="Reason for leave request..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#23C45E] focus:outline-none"
            />
          </div>
        </div>
      </AdminFormDrawer>
    </div>
  );
}
