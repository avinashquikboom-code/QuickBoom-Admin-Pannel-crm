'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Activity, PhoneCall, Mail, Calendar, MessageSquare, Plus, RefreshCw, Layers, CheckCircle2, Clock } from 'lucide-react';
import api from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { AdminPageHero, AdminStatCard, AdminPagination, AdminFormDrawer } from '@/components/admin';
import { toast } from 'react-hot-toast';

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
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [isLogDrawerOpen, setIsLogDrawerOpen] = useState(false);
  const [isLogging, setIsLogging] = useState(false);

  const [formData, setFormData] = useState({
    type: 'CALL',
    subject: '',
    performedBy: 'Rahul Sharma',
    relatedTo: 'Acme Enterprises',
    activityDate: new Date().toISOString().split('T')[0],
    activityTime: '14:30',
    outcome: 'POSITIVE',
    details: '',
  });

  const handleLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLogging(true);
    setTimeout(() => {
      setIsLogging(false);
      setIsLogDrawerOpen(false);
      toast.success('Activity logged successfully!');
      setFormData({
        type: 'CALL',
        subject: '',
        performedBy: 'Rahul Sharma',
        relatedTo: 'Acme Enterprises',
        activityDate: new Date().toISOString().split('T')[0],
        activityTime: '14:30',
        outcome: 'POSITIVE',
        details: '',
      });
      refetch();
    }, 600);
  };

  const { data: auditResponse, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['admin-activities-audit', page, pageSize],
    queryFn: async () => {
      try {
        const res: any = await api.get('/audit-logs', {
          params: { page, limit: pageSize },
        });
        const items = res?.data?.items || res?.data?.data || res?.items || res?.data || (Array.isArray(res) ? res : []);
        const pagination = res?.pagination || res?.meta || res?.data?.pagination || res?.data?.meta || {
          page,
          pageSize,
          total: Array.isArray(items) ? items.length : 0,
          totalPages: 1,
        };
        return {
          items: Array.isArray(items) ? items : [],
          pagination: {
            page: Number(pagination.page) || page,
            pageSize: Number(pagination.pageSize || pagination.limit) || pageSize,
            total: Number(pagination.total) || (Array.isArray(items) ? items.length : 0),
            totalPages: Number(pagination.totalPages) || 1,
          },
        };
      } catch {
        return { items: [], pagination: { page: 1, pageSize, total: 0, totalPages: 1 } };
      }
    },
  });

  const rawActivities = auditResponse?.items || [];
  const pagination = auditResponse?.pagination || { page: 1, pageSize: 20, total: 0, totalPages: 1 };

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

            <button
              type="button"
              onClick={() => setIsLogDrawerOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#23C45E] hover:bg-[#1AA14D] text-slate-950 font-black rounded-2xl text-xs shadow-md shadow-[#23C45E]/20 transition-all cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Log Activity</span>
            </button>
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

        {/* Server-Side Pagination */}
        <AdminPagination
          page={page}
          pageSize={pageSize}
          total={pagination.total}
          totalPages={pagination.totalPages}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
          disabled={isLoading}
        />
      </div>

      {/* Log Activity Right-Side Drawer */}
      <AdminFormDrawer
        isOpen={isLogDrawerOpen}
        onClose={() => setIsLogDrawerOpen(false)}
        title="Log Client Activity"
        description="Record an outbound phone call, client meeting, demo, or email communication."
        icon={Activity}
        maxWidth="sm:max-w-[560px]"
      >
        <form onSubmit={handleLogSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
              Activity Channel Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#23C45E]"
            >
              <option value="CALL">Phone Call (Inbound / Outbound)</option>
              <option value="MEETING">Face-to-Face / Online Meeting</option>
              <option value="EMAIL">Email Communication</option>
              <option value="DEMO">Product Demonstration</option>
              <option value="NOTE">Internal Account Note</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
              Subject / Headline *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Discovery call with Chief Technology Officer"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#23C45E]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                Performed By
              </label>
              <input
                type="text"
                value={formData.performedBy}
                onChange={(e) => setFormData({ ...formData, performedBy: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#23C45E]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                Related Account / Lead
              </label>
              <input
                type="text"
                value={formData.relatedTo}
                onChange={(e) => setFormData({ ...formData, relatedTo: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#23C45E]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                Date
              </label>
              <input
                type="date"
                value={formData.activityDate}
                onChange={(e) => setFormData({ ...formData, activityDate: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#23C45E]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                Time
              </label>
              <input
                type="time"
                value={formData.activityTime}
                onChange={(e) => setFormData({ ...formData, activityTime: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#23C45E]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
              Detailed Discussion Notes
            </label>
            <textarea
              rows={3}
              placeholder="Summary of discussion topics, questions asked, next steps..."
              value={formData.details}
              onChange={(e) => setFormData({ ...formData, details: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#23C45E]"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsLogDrawerOpen(false)}
              className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLogging}
              className="px-5 py-2 bg-[#23C45E] hover:bg-[#1AA14D] text-slate-950 font-black rounded-xl text-xs cursor-pointer shadow-md shadow-[#23C45E]/20"
            >
              {isLogging ? 'Logging...' : 'Log Activity'}
            </button>
          </div>
        </form>
      </AdminFormDrawer>
    </div>
  );
}
