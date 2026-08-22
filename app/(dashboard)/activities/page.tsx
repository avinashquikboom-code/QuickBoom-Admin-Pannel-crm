'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Activity, PhoneCall, Mail, Calendar, MessageSquare, Plus, RefreshCw, Layers, CheckCircle2, Clock } from 'lucide-react';
import api from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { AdminPageHero, AdminStatCard } from '@/components/admin';

interface ActivityItem {
  id: string;
  type: 'CALL' | 'EMAIL' | 'MEETING' | 'NOTE';
  subject: string;
  performedBy: string;
  relatedTo: string;
  timestamp: string;
}

export default function ActivitiesPage() {
  const [filterType, setFilterType] = useState<string>('ALL');

  const { data: auditData, isLoading, isFetching, refetch } = useQuery({
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

  const rawActivities = Array.isArray(auditData) ? auditData : [];

  const activities: ActivityItem[] = rawActivities.map((a: any) => {
    const detailMsg =
      typeof a.details === 'string'
        ? a.details
        : a.details && typeof a.details === 'object'
        ? a.details.message || a.details.action || a.details.description || ''
        : '';

    return {
      id: String(a.id),
      type: 'NOTE',
      subject: `${a.action || 'ACTIVITY'} ${detailMsg || a.entity || ''}`.trim(),
      performedBy:
        a.user && typeof a.user === 'object'
          ? `${a.user.firstName || ''} ${a.user.lastName || ''}`.trim()
          : typeof a.actor === 'string'
          ? a.actor
          : 'System Administrator',
      relatedTo: typeof a.module === 'string' ? a.module : 'Platform Operation',
      timestamp: a.createdAt && !isNaN(new Date(a.createdAt).getTime())
        ? new Date(a.createdAt).toLocaleString([], {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
        : 'Recent',
    };
  });

  const totalCount = activities.length;
  const authEventsCount = activities.filter((a) => a.relatedTo.includes('AUTH') || a.subject.includes('LOGIN')).length;
  const crmEventsCount = activities.filter((a) => a.relatedTo.includes('CRM') || a.relatedTo.includes('LEAD') || a.relatedTo.includes('DEAL')).length;

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-16 text-slate-800 animate-in fade-in-50 duration-200">
      {/* 1. Top Hero Card */}
      <AdminPageHero
        badge={{
          text: 'ACTIVITY CENTER',
          icon: Activity,
          variant: 'emerald',
        }}
        title="Activities"
        description="Monitor employee and system activities across the organization."
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="p-2.5 bg-white/10 hover:bg-white/15 text-white rounded-2xl border border-white/10 text-xs font-black transition-all cursor-pointer backdrop-blur-xs disabled:opacity-50 active:scale-95"
              title="Refresh activities"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin text-[#23C45E]' : ''}`} />
            </button>

            <Link
              href="/activities/create"
              className="flex items-center gap-2 px-5 py-2.5 bg-[#23C45E] hover:bg-[#1AA14D] text-slate-950 font-black rounded-2xl text-xs shadow-md shadow-[#23C45E]/20 transition-all cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Log Activity</span>
            </Link>
          </div>
        }
      />

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <AdminStatCard
          title="Total Logged Activities"
          value={isLoading ? '...' : totalCount}
          description="System events and interactions"
          icon={Activity}
          iconBg="primary"
        />
        <AdminStatCard
          title="Security & Auth Actions"
          value={isLoading ? '...' : authEventsCount}
          description="Authentication & user security"
          icon={CheckCircle2}
          iconBg="blue"
        />
        <AdminStatCard
          title="CRM & Pipeline Events"
          value={isLoading ? '...' : crmEventsCount}
          description="Client and sales mutations"
          icon={Layers}
          iconBg="purple"
        />
      </div>

      {/* 3. Activity Logs Stream Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
        <div className="p-5 bg-slate-50/70 border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#23C45E]" />
            <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Recent Interaction Log Stream
            </span>
          </div>
          <span className="text-[11px] font-bold text-slate-500">
            {activities.length} Recorded Entries
          </span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-xs font-bold animate-pulse">
            Loading activity stream...
          </div>
        ) : activities.length > 0 ? (
          activities.map((act) => (
            <div
              key={act.id}
              className="p-5 flex items-center justify-between hover:bg-slate-50/60 transition-colors gap-4"
            >
              <div className="flex items-center gap-4 text-xs min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#1AA14D] border border-emerald-200/60 flex items-center justify-center font-bold shrink-0">
                  <Activity className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-extrabold text-slate-900 text-sm truncate">
                    {act.subject}
                  </h3>
                  <p className="text-slate-500 font-medium truncate mt-0.5">
                    {act.performedBy} • Module: <span className="font-bold text-slate-700">{act.relatedTo}</span>
                  </p>
                </div>
              </div>
              <span className="text-slate-400 font-mono font-medium text-[11px] shrink-0">
                {act.timestamp}
              </span>
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
