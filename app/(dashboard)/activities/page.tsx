'use client';

import React from 'react';
import Link from 'next/link';
import { Activity, PhoneCall, Mail, Calendar, MessageSquare, Plus } from 'lucide-react';
import api from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

interface ActivityItem {
  id: string;
  type: 'CALL' | 'EMAIL' | 'MEETING' | 'NOTE';
  subject: string;
  performedBy: string;
  relatedTo: string;
  timestamp: string;
}

export default function ActivitiesPage() {
  const { data: auditData } = useQuery({
    queryKey: ['admin-activities-audit'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/audit-logs');
        return res?.data?.items || res?.items || res?.data || res;
      } catch {
        return [];
      }
    },
  });

  const activities: ActivityItem[] = Array.isArray(auditData) && auditData.length > 0
    ? auditData.map((a: any) => ({
        id: String(a.id),
        type: 'NOTE',
        subject: `${a.action} ${a.entity || ''}`,
        performedBy: a.actor || 'System',
        relatedTo: a.module || 'Platform',
        timestamp: a.createdAt ? new Date(a.createdAt).toLocaleString() : 'Recent',
      }))
    : [];

  return (
    <div className="space-y-8">
      {/* Header Title Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-900 via-emerald-800 to-slate-900 p-6 sm:p-8 rounded-3xl text-white shadow-lg border border-emerald-800">
        <div>
          <div className="flex items-center gap-2 text-emerald-300 font-extrabold text-xs uppercase tracking-wider mb-1">
            <Activity className="w-4 h-4 text-emerald-400" /> CRM ACTIVITY LOG STREAM
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
            Activities & Interaction Stream
          </h1>
          <p className="text-xs md:text-sm text-slate-200 mt-1 font-medium">
            Complete audit stream of client phone calls, emails, product demos, and meeting notes.
          </p>
        </div>

        <Link
          href="/activities/create"
          className="flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-extrabold transition-all shadow-md cursor-pointer self-start md:self-auto"
        >
          <Plus className="w-4 h-4" /> Log Activity
        </Link>
      </div>

      {/* Activity Logs Stream Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
        {activities.length > 0 ? (
          activities.map((act) => (
            <div key={act.id} className="p-5 flex items-center justify-between hover:bg-slate-50/60 transition-colors">
              <div className="flex items-center gap-4 text-xs">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold border border-emerald-100">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">{act.subject}</h3>
                  <p className="text-slate-500 font-medium">{act.performedBy} • Related to {act.relatedTo}</p>
                </div>
              </div>
              <span className="text-slate-400 font-medium text-xs">{act.timestamp}</span>
            </div>
          ))
        ) : (
          <div className="p-12 text-center text-slate-400 text-sm font-medium">
            No logged activities found in database.
          </div>
        )}
      </div>
    </div>
  );
}
