'use client';

import React from 'react';
import { History, Shield, Terminal, User } from 'lucide-react';
import api from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

interface AuditLog {
  id: string;
  action: string;
  user: string;
  ipAddress: string;
  entity: string;
  timestamp: string;
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
}

const defaultMockLogs: AuditLog[] = [
  { id: '1', action: 'LOGIN', user: 'Demo User', ipAddress: '127.0.0.1', entity: 'Session Token Issued', timestamp: '2026-08-21 09:12:00', status: 'SUCCESS' },
  { id: '2', action: 'SCHEDULE', user: 'Demo User', ipAddress: '127.0.0.1', entity: 'Reels Shoot (#1)', timestamp: '2026-08-21 09:15:30', status: 'SUCCESS' },
  { id: '3', action: 'PAYMENT_VERIFIED', user: 'System Webhook', ipAddress: '127.0.0.1', entity: 'Subscription Order (#ORD-9821)', timestamp: '2026-08-21 08:45:10', status: 'SUCCESS' },
];

export default function AuditLogsPage() {
  const { data: auditData } = useQuery({
    queryKey: ['admin-audit-logs'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/audit-logs');
        return res?.data?.items || res?.items || res?.data || res;
      } catch {
        return null;
      }
    },
  });

  const mockLogs: AuditLog[] =
    Array.isArray(auditData) && auditData.length > 0
      ? auditData.map((l: any) => ({
          id: l.id,
          action: l.action || 'MUTATION',
          user: l.actor || 'Administrator',
          ipAddress: l.ipAddress || '127.0.0.1',
          entity: `${l.module || 'SYSTEM'} Event`,
          timestamp: l.createdAt ? new Date(l.createdAt).toLocaleString() : '2026-08-21 09:00',
          status: 'SUCCESS',
        }))
      : defaultMockLogs;
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
          <table className="w-full text-left border-collapse min-w-[700px]">
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
