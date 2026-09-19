'use client';

import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  X,
  RotateCcw,
  CheckCircle2,
  ShieldCheck,
  Building2,
  Layers,
  FileText,
  Users,
  MapPin,
  CheckSquare,
  DollarSign,
  Database,
  Loader2,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';
import { getErrorMessage } from '@/lib/utils';

export interface ResetCustomerDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: number | string;
  customerName?: string;
  companyName?: string;
  onSuccess?: () => void;
}

export function ResetCustomerDataModal({
  isOpen,
  onClose,
  customerId,
  customerName = 'Customer',
  companyName,
  onSuccess,
}: ResetCustomerDataModalProps) {
  const [confirmInput, setConfirmInput] = useState('');
  const [reason, setReason] = useState('');
  const queryClient = useQueryClient();

  // Reset confirmation input when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setConfirmInput('');
      setReason('');
    }
  }, [isOpen]);

  // Fetch real database record counts for this customer
  const {
    data: summaryData,
    isLoading: isSummaryLoading,
    refetch: refetchSummary,
  } = useQuery({
    queryKey: ['customer-reset-summary', customerId],
    enabled: isOpen && !!customerId,
    queryFn: async () => {
      try {
        const res: any = await api.get(`/customers/${customerId}/reset-summary`);
        return res?.data || res;
      } catch (err) {
        toast.error('Failed to load customer summary counts');
        return null;
      }
    },
  });

  const displayName =
    summaryData?.customer?.displayName ||
    companyName ||
    customerName ||
    'Customer';

  // Target confirmation text (user can type either the company name or name)
  const requiredConfirmationText = displayName.trim();
  const isConfirmationMatched =
    confirmInput.trim().toLowerCase() === requiredConfirmationText.toLowerCase() ||
    (customerName && confirmInput.trim().toLowerCase() === customerName.trim().toLowerCase()) ||
    (companyName && confirmInput.trim().toLowerCase() === companyName.trim().toLowerCase()) ||
    confirmInput.trim().toUpperCase() === 'RESET ALL DATA';

  // Reset Mutation
  const resetMutation = useMutation({
    mutationFn: async () => {
      // api.ts response interceptor already unwraps response.data — `res` IS the body.
      const res: any = await api.post(`/customers/${customerId}/reset-data`, {
        confirmation: confirmInput.trim(),
        reason: reason.trim() || 'Admin initiated customer data reset from dashboard',
        preserveSubscriptions: false,   // MUST be false — subscriptions are always reset
        preserveInvoices: false,
      });
      return res;
    },
    onSuccess: (data: any) => {
      toast.success(
        data?.message || `Customer data for "${displayName}" has been completely reset!`,
        { icon: '🔄', duration: 6000 }
      );

      // Invalidate ALL subscription/customer related caches so the Admin Panel
      // immediately reflects the reset state without requiring a browser refresh.
      queryClient.invalidateQueries({ queryKey: ['customer-detail'] });
      queryClient.invalidateQueries({ queryKey: ['customer-subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['customer-reset-summary', customerId] });
      queryClient.invalidateQueries({ queryKey: ['admin-subscriptions-list'] });
      queryClient.invalidateQueries({ queryKey: ['admin-offline-requests'] });
      queryClient.invalidateQueries({ queryKey: ['customer-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['customers-list'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['customer-plan'] });
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Failed to reset customer data.';
      toast.error(msg, { id: `reset-err-${String(customerId)}` });
    },
  });

  if (!isOpen) return null;

  const crm = summaryData?.summary?.crm;
  const billing = summaryData?.summary?.billing;
  const dataCapture = summaryData?.summary?.dataCapture;
  const operations = summaryData?.summary?.operations;
  const totalRecords = summaryData?.summary?.totalRecords ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
        onClick={() => !resetMutation.isPending && onClose()}
      />

      {/* Modal Dialog */}
      <div className="relative bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 sm:p-7 space-y-5 z-10 animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0 shadow-2xs">
              <RotateCcw className="w-5 h-5 animate-in spin-in-180 duration-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-black text-[10px] uppercase tracking-wider">
                  Destructive Action
                </span>
                <span className="text-xs text-slate-500 font-mono font-bold">
                  ID: #{customerId}
                </span>
              </div>
              <h3 className="text-lg font-black text-slate-900 mt-0.5">
                Reset Customer Data
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={resetMutation.isPending}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-all cursor-pointer disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Target Customer Callout */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-700 flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                Target Customer
              </p>
              <p className="text-sm font-black text-slate-900 truncate">
                {displayName}
              </p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="text-[11px] font-black px-2.5 py-1 rounded-full bg-slate-200 text-slate-800">
              Isolated Scope
            </span>
          </div>
        </div>

        {/* Live Record Counts / What Will Be Reset */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-rose-500" />
              <span>Data That Will Be Permanently Removed:</span>
            </p>
            {isSummaryLoading && (
              <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Fetching counts...
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            <div className="bg-rose-50/60 border border-rose-100 rounded-xl p-2.5">
              <span className="text-[10px] text-rose-600 font-bold uppercase block">
                Leads & Contacts
              </span>
              <span className="text-base font-black text-rose-900">
                {isSummaryLoading ? '...' : (crm?.leads || 0) + (crm?.contacts || 0)}
              </span>
              <span className="text-[10px] text-rose-500 block">
                {crm?.leads || 0} leads, {crm?.contacts || 0} contacts
              </span>
            </div>

            <div className="bg-rose-50/60 border border-rose-100 rounded-xl p-2.5">
              <span className="text-[10px] text-rose-600 font-bold uppercase block">
                Deals & Companies
              </span>
              <span className="text-base font-black text-rose-900">
                {isSummaryLoading ? '...' : (crm?.deals || 0) + (crm?.companies || 0)}
              </span>
              <span className="text-[10px] text-rose-500 block">
                {crm?.deals || 0} deals, {crm?.companies || 0} cos
              </span>
            </div>

            <div className="bg-rose-50/60 border border-rose-100 rounded-xl p-2.5">
              <span className="text-[10px] text-rose-600 font-bold uppercase block">
                Tasks & Visits
              </span>
              <span className="text-base font-black text-rose-900">
                {isSummaryLoading ? '...' : (crm?.tasks || 0) + (crm?.visits || 0)}
              </span>
              <span className="text-[10px] text-rose-500 block">
                {crm?.tasks || 0} tasks, {crm?.visits || 0} visits
              </span>
            </div>

            <div className="bg-rose-50/60 border border-rose-100 rounded-xl p-2.5">
              <span className="text-[10px] text-rose-600 font-bold uppercase block">
                Invoices & Payments
              </span>
              <span className="text-base font-black text-rose-900">
                {isSummaryLoading ? '...' : (billing?.invoices || 0) + (billing?.payments || 0)}
              </span>
              <span className="text-[10px] text-rose-500 block">
                {billing?.invoices || 0} inv, {billing?.payments || 0} payments
              </span>
            </div>

            <div className="bg-rose-50/60 border border-rose-100 rounded-xl p-2.5">
              <span className="text-[10px] text-rose-600 font-bold uppercase block">
                Data Capture
              </span>
              <span className="text-base font-black text-rose-900">
                {isSummaryLoading ? '...' : dataCapture?.total || 0}
              </span>
              <span className="text-[10px] text-rose-500 block">
                Places & search extractions
              </span>
            </div>

            <div className="bg-rose-50/60 border border-rose-100 rounded-xl p-2.5">
              <span className="text-[10px] text-rose-600 font-bold uppercase block">
                Operations / Logs
              </span>
              <span className="text-base font-black text-rose-900">
                {isSummaryLoading ? '...' : operations?.total || 0}
              </span>
              <span className="text-[10px] text-rose-500 block">
                Attendance, leaves, tickets
              </span>
            </div>
          </div>
        </div>

        {/* Master Data Protected Badge */}
        <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-3.5 space-y-1">
          <div className="flex items-center gap-2 text-emerald-800 font-black text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Master Data Preserved (Will NOT be deleted)</span>
          </div>
          <p className="text-[11px] text-emerald-700 font-medium leading-relaxed">
            Customer Account, User Login credentials, Employees, Roles,
            Departments, Designations, Product catalog, and Subscription Plan
            configuration will remain completely untouched.
          </p>
        </div>

        {/* Warning Notice */}
        <div className="flex items-start gap-2.5 text-xs text-amber-800 bg-amber-50/80 border border-amber-200/80 rounded-2xl p-3">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p>
            <strong>Warning:</strong> This operation is permanent and customer-isolated.
            Customer B, C, and all other tenants will remain completely unaffected.
          </p>
        </div>

        {/* Explicit Confirmation Input */}
        <div className="space-y-2 pt-1 border-t border-slate-100">
          <label className="block text-xs font-black text-slate-700">
            To confirm reset, type customer name:
            <span className="ml-1.5 px-2 py-0.5 rounded bg-slate-100 text-slate-900 font-mono text-[11px] select-all border border-slate-200">
              {requiredConfirmationText}
            </span>
          </label>
          <input
            type="text"
            value={confirmInput}
            onChange={(e) => setConfirmInput(e.target.value)}
            placeholder={`Type "${requiredConfirmationText}" to confirm`}
            disabled={resetMutation.isPending}
            className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 bg-white placeholder:text-slate-400"
          />

          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason for reset (optional, logged to audit trail)"
            disabled={resetMutation.isPending}
            className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-300/40 bg-slate-50 placeholder:text-slate-400"
          />
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={resetMutation.isPending}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => resetMutation.mutate()}
            disabled={!isConfirmationMatched || resetMutation.isPending}
            className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-black rounded-xl text-xs transition-all cursor-pointer shadow-md shadow-rose-600/20"
          >
            {resetMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Resetting Customer Data...</span>
              </>
            ) : (
              <>
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Customer Data</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
