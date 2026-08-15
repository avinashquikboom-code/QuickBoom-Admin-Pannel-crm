'use client';

import React from 'react';
import { History, Shield, Terminal, User } from 'lucide-react';

interface AuditLog {
  id: string;
  action: string;
  user: string;
  ipAddress: string;
  entity: string;
  timestamp: string;
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
}

const mockLogs: AuditLog[] = [
  { id: '1', action: 'EMPLOYEE_CREATED', user: 'Admin User', ipAddress: '192.168.1.100', entity: 'Employee (EMP005)', timestamp: '2026-08-15 09:12:00', status: 'SUCCESS' },
  { id: '2', action: 'SALARY_SLIP_GENERATED', user: 'Vikram Mehta', ipAddress: '192.168.1.104', entity: 'Payroll Batch (Aug 2026)', timestamp: '2026-08-15 11:30:15', status: 'SUCCESS' },
  { id: '3', action: 'LEAVE_APPROVED', user: 'Rahul Sharma', ipAddress: '192.168.1.102', entity: 'LeaveRequest (#849)', timestamp: '2026-08-15 12:05:44', status: 'SUCCESS' },
];

export default function AuditLogsPage() {
  return (
    <div className="space-y-8">
      {/* Top Title Card Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-900 via-emerald-800 to-slate-900 p-6 sm:p-8 rounded-3xl text-white shadow-lg border border-emerald-800">
        <div>
          <div className="flex items-center gap-2 text-emerald-300 font-extrabold text-xs uppercase tracking-wider mb-1">
            <History className="w-4 h-4 text-emerald-400" /> IMMUTABLE SYSTEM AUDIT TRAIL
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
            Audit Trail & Security Event Logs
          </h1>
          <p className="text-xs md:text-sm text-slate-200 mt-1 font-medium">
            Immutably track system data mutations, administrative authentication events, and client IP signatures.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Action Event</th>
                <th className="py-3.5 px-4">Performed By</th>
                <th className="py-3.5 px-4">Target Entity</th>
                <th className="py-3.5 px-4">IP Address</th>
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {mockLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-indigo-600">{log.action}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">{log.user}</td>
                  <td className="py-3.5 px-4 text-slate-700 font-medium">{log.entity}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-500">{log.ipAddress}</td>
                  <td className="py-3.5 px-4 text-slate-500 font-medium">{log.timestamp}</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {log.status}
                    </span>
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
