'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Save, RefreshCw, CheckCircle, ShieldAlert } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { AdminPageHeader, AdminButton } from '@/components/admin';

export default function MasterLeavePoliciesPage() {
  const queryClient = useQueryClient();

  const [policy, setPolicy] = useState({
    name: 'Standard Leave Policy',
    allowHalfDay: true,
    allowBackdatedLeave: false,
    maxBackdatedDays: 3,
    allowFutureLeave: true,
    maxFutureDays: 90,
    allowProbationLeave: false,
    includeHolidaysInLeave: false,
    includeWeekendsInLeave: false,
    minNoticePeriodDays: 2,
    maxConsecutiveDays: 10,
    requiresManagerApproval: true,
    requiresHrApproval: true,
    requiresAttachmentAboveDays: 3,
    isActive: true,
  });

  const { data: resData, isLoading, refetch } = useQuery({
    queryKey: ['master-leave-policy'],
    queryFn: async () => {
      const res: any = await api.get('/leaves/policies');
      return res?.data?.leavePolicy || res?.data || res || {};
    },
  });

  useEffect(() => {
    if (resData && typeof resData === 'object' && Object.keys(resData).length > 0) {
      setPolicy((prev) => ({
        ...prev,
        ...resData,
      }));
    }
  }, [resData]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const cleanPolicy: any = { ...policy };
      delete cleanPolicy.customer;
      delete cleanPolicy.office;
      delete cleanPolicy.createdAt;
      delete cleanPolicy.updatedAt;
      delete cleanPolicy.createdById;
      delete cleanPolicy.updatedById;
      delete cleanPolicy.updatedByName;
      return api.post('/leaves/policies/leave', cleanPolicy);
    },
    onSuccess: () => {
      toast.success('Leave policy rules saved successfully!');
      queryClient.invalidateQueries({ queryKey: ['master-leave-policy'] });
    },
    onError: (err: any) => {
      const data = err?.response?.data;
      let msg = 'Failed to update leave policy';
      if (Array.isArray(data?.message) && data.message.length > 0) {
        msg = data.message.join(', ');
      } else if (typeof data?.message === 'string') {
        msg = data.message;
      }
      toast.error(msg);
    },
  });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Leave Policies Master"
        description="Configure workforce leave application rules, maximum limits, notices, and approval chains."
        icon={FileText}
        iconColor="text-emerald-600"
        badge={{ text: 'Leave Policy Master', icon: FileText, variant: 'emerald' }}
        breadcrumbs={[
          { label: 'Master Data', href: '/master' },
          { label: 'Leave Policies' },
        ]}
        actions={
          <div className="flex items-center gap-2.5">
            <AdminButton
              variant="outline"
              size="md"
              icon={RefreshCw}
              onClick={() => refetch()}
              disabled={isLoading}
            >
              Refresh
            </AdminButton>
            <AdminButton
              variant="primary"
              size="md"
              icon={Save}
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? 'Saving...' : 'Save Policy Changes'}
            </AdminButton>
          </div>
        }
      />

      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        {/* Policy Identification */}
        <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
              Leave Policy Ruleset
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Applied automatically across all active employee mobile leave applications.
            </p>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            className="p-2 text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Section 1: Approval Workflow */}
        <div className="space-y-3">
          <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">
            1. Approval Workflow & Permissions
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between cursor-pointer hover:bg-slate-100/50 transition-colors">
              <div>
                <span className="text-xs font-bold text-slate-900 block">Require Manager Approval</span>
                <span className="text-[11px] text-slate-500">Route leave requests to the direct reporting manager</span>
              </div>
              <input
                type="checkbox"
                checked={policy.requiresManagerApproval}
                onChange={(e) => setPolicy({ ...policy, requiresManagerApproval: e.target.checked })}
                className="w-4 h-4 text-emerald-600 rounded"
              />
            </label>

            <label className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between cursor-pointer hover:bg-slate-100/50 transition-colors">
              <div>
                <span className="text-xs font-bold text-slate-900 block">Require HR Final Approval</span>
                <span className="text-[11px] text-slate-500">Require Super Admin / HR sign-off before status is active</span>
              </div>
              <input
                type="checkbox"
                checked={policy.requiresHrApproval}
                onChange={(e) => setPolicy({ ...policy, requiresHrApproval: e.target.checked })}
                className="w-4 h-4 text-emerald-600 rounded"
              />
            </label>
          </div>
        </div>

        {/* Section 2: Application Limits & Durations */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">
            2. Duration & Application Boundaries
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Minimum Advance Notice (Days)
              </label>
              <input
                type="number"
                min="0"
                value={policy.minNoticePeriodDays}
                onChange={(e) => setPolicy({ ...policy, minNoticePeriodDays: Number(e.target.value) })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Max Consecutive Days per Application
              </label>
              <input
                type="number"
                min="1"
                value={policy.maxConsecutiveDays}
                onChange={(e) => setPolicy({ ...policy, maxConsecutiveDays: Number(e.target.value) })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Medical Doc Required Above (Days)
              </label>
              <input
                type="number"
                min="1"
                value={policy.requiresAttachmentAboveDays}
                onChange={(e) => setPolicy({ ...policy, requiresAttachmentAboveDays: Number(e.target.value) })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Advance & Backdated Rules */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">
            3. Flexibility & Schedule Rules
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between cursor-pointer hover:bg-slate-100/50 transition-colors">
              <div>
                <span className="text-xs font-bold text-slate-900 block">Allow Half-Day Applications</span>
                <span className="text-[11px] text-slate-500">Permit employees to apply for morning or afternoon half-days</span>
              </div>
              <input
                type="checkbox"
                checked={policy.allowHalfDay}
                onChange={(e) => setPolicy({ ...policy, allowHalfDay: e.target.checked })}
                className="w-4 h-4 text-emerald-600 rounded"
              />
            </label>

            <label className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between cursor-pointer hover:bg-slate-100/50 transition-colors">
              <div>
                <span className="text-xs font-bold text-slate-900 block">Allow Backdated Applications</span>
                <span className="text-[11px] text-slate-500">Permit employees to submit retrospective sick leaves</span>
              </div>
              <input
                type="checkbox"
                checked={policy.allowBackdatedLeave}
                onChange={(e) => setPolicy({ ...policy, allowBackdatedLeave: e.target.checked })}
                className="w-4 h-4 text-emerald-600 rounded"
              />
            </label>

            <label className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between cursor-pointer hover:bg-slate-100/50 transition-colors">
              <div>
                <span className="text-xs font-bold text-slate-900 block">Include Weekends in Leave Count</span>
                <span className="text-[11px] text-slate-500">Saturdays and Sundays count towards annual leave deductions</span>
              </div>
              <input
                type="checkbox"
                checked={policy.includeWeekendsInLeave}
                onChange={(e) => setPolicy({ ...policy, includeWeekendsInLeave: e.target.checked })}
                className="w-4 h-4 text-emerald-600 rounded"
              />
            </label>

            <label className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between cursor-pointer hover:bg-slate-100/50 transition-colors">
              <div>
                <span className="text-xs font-bold text-slate-900 block">Include Public Holidays</span>
                <span className="text-[11px] text-slate-500">Official company holidays are deducted from quota</span>
              </div>
              <input
                type="checkbox"
                checked={policy.includeHolidaysInLeave}
                onChange={(e) => setPolicy({ ...policy, includeHolidaysInLeave: e.target.checked })}
                className="w-4 h-4 text-emerald-600 rounded"
              />
            </label>
          </div>
        </div>

        {/* Action Button Footer */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="flex items-center gap-2 px-6 py-3 bg-[#23C45E] hover:bg-[#1AA14D] text-slate-950 font-black rounded-2xl text-xs shadow-md shadow-[#23C45E]/20 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <Save className="w-4 h-4 stroke-[2.5]" />
            <span>{saveMutation.isPending ? 'Saving Rules...' : 'Save Policy Configuration'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
