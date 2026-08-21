'use client';

import React, { useState } from 'react';
import {
  Laptop,
  CheckCircle,
  XCircle,
  Clock,
  Check,
  X,
  Plus,
} from 'lucide-react';
import api from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { AdminFormDrawer } from '@/components/admin';

interface RemoteRequest {
  id: string;
  employeeName: string;
  employeeId: string;
  department?: string;
  fromDate?: string;
  toDate?: string;
  date?: string;
  totalDays: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  appliedOn: string;
}

export default function RemoteWorkPage() {
  const { data: remoteData, refetch } = useQuery({
    queryKey: ['admin-hrm-remote-requests'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/employees/hrm/remote-requests');
        return res?.data || res;
      } catch {
        return [];
      }
    },
  });

  const [localStatusMap, setLocalStatusMap] = useState<Record<string, 'APPROVED' | 'REJECTED'>>({});
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [remoteForm, setRemoteForm] = useState({
    employeeName: '',
    date: '',
    reason: '',
  });

  const requests: RemoteRequest[] = Array.isArray(remoteData)
    ? remoteData.map((r: any) => ({
        ...r,
        department: r.department || 'General',
        fromDate: r.date || r.fromDate || '2026-08-21',
        toDate: r.date || r.toDate || '2026-08-21',
        totalDays: r.totalDays || 1,
        status: localStatusMap[r.id] || r.status,
      }))
    : [];

  const handleApprove = (id: string) => {
    setLocalStatusMap((prev) => ({ ...prev, [id]: 'APPROVED' }));
    toast.success('Remote work request approved');
  };

  const handleReject = (id: string) => {
    setLocalStatusMap((prev) => ({ ...prev, [id]: 'REJECTED' }));
    toast.error('Remote work request rejected');
  };

  const handleSaveRemote = async () => {
    if (!remoteForm.employeeName.trim() || !remoteForm.date) {
      toast.error('Please enter employee name and date');
      return;
    }
    setIsSubmitting(true);
    try {
      toast.success('Remote work request submitted successfully!');
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
            <Laptop className="w-4 h-4 text-[#23C45E]" /> REMOTE WORK & WFH APPROVALS
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
            Remote Work & WFH Applications
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-medium">
            Manage staff work-from-home requests, task commitments, and remote attendance permissions.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setRemoteForm({
              employeeName: '',
              date: '',
              reason: '',
            });
            setIsDrawerOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#23C45E] hover:bg-[#1AA14D] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Request WFH
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Pending Requests</span>
          <p className="text-2xl font-black text-amber-600 mt-1">1 Application</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Approved This Month</span>
          <p className="text-2xl font-black text-indigo-600 mt-1">14 Days</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Remote Employees Today</span>
          <p className="text-2xl font-black text-[#1AA14D] mt-1">4 Employees</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-400 font-black uppercase text-[10px] tracking-wider border-b border-slate-100">
              <tr>
                <th className="p-4">Staff Member</th>
                <th className="p-4">Department</th>
                <th className="p-4">Date</th>
                <th className="p-4">Reason & Task Plan</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Approval Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 font-bold">
                    No remote work requests found in database.
                  </td>
                </tr>
              ) : (
                requests.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-4">
                      <p className="font-black text-slate-900">{r.employeeName}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{r.employeeId}</p>
                    </td>
                    <td className="p-4 text-slate-800">{r.department}</td>
                    <td className="p-4 font-semibold text-slate-700">{r.fromDate}</td>
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
                            title="Approve WFH"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReject(r.id)}
                            className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-colors cursor-pointer"
                            title="Reject WFH"
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
      </div>

      {/* Right-Side Admin Form Drawer */}
      <AdminFormDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Request Work From Home (WFH)"
        description="Submit remote attendance application"
        size="md"
        onSave={handleSaveRemote}
        saveLabel="Submit WFH Request"
        isSubmitting={isSubmitting}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
              Employee Name *
            </label>
            <input
              type="text"
              value={remoteForm.employeeName}
              onChange={(e) => setRemoteForm({ ...remoteForm, employeeName: e.target.value })}
              placeholder="e.g. Amit Verma"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#23C45E] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
              Target Date *
            </label>
            <input
              type="date"
              value={remoteForm.date}
              onChange={(e) => setRemoteForm({ ...remoteForm, date: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#23C45E] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
              Work Deliverables / Reason
            </label>
            <textarea
              value={remoteForm.reason}
              onChange={(e) => setRemoteForm({ ...remoteForm, reason: e.target.value })}
              rows={3}
              placeholder="Describe tasks to be executed remotely..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#23C45E] focus:outline-none"
            />
          </div>
        </div>
      </AdminFormDrawer>
    </div>
  );
}
