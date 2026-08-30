'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  DollarSign,
  Building,
  User,
  Calendar,
  Clock,
  ExternalLink,
  Plus,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  XCircle,
  FileText,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { AdminFormDrawer } from '../dialogs/AdminFormDrawer';

export interface DealDetailsDrawerProps {
  dealId: number | string | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (deal: any) => void;
}

export function DealDetailsDrawer({
  dealId,
  isOpen,
  onClose,
  onEdit,
}: DealDetailsDrawerProps) {
  const {
    data: deal,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['admin-deal-details-drawer', dealId],
    enabled: isOpen && !!dealId,
    queryFn: async () => {
      if (!dealId) return null;
      const res: any = await api.get(`/deals/${dealId}`);
      return res?.data || res;
    },
  });

  if (!isOpen) return null;

  return (
    <AdminFormDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={deal?.title || 'Deal Details'}
      description={deal ? `₹${Number(deal.amount || 0).toLocaleString('en-IN')} • ${deal.stage?.name || 'Pipeline'}` : 'Loading opportunity...'}
      icon={Briefcase}
      maxWidth="sm:max-w-[580px]"
      footer={
        <div className="flex items-center justify-between w-full">
          <Link
            href={`/deals/${dealId}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition-all cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Full Page View</span>
          </Link>

          <div className="flex items-center gap-2">
            {onEdit && deal && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(deal);
                }}
                className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl text-xs transition-all cursor-pointer"
              >
                Edit Deal
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      }
    >
      {isLoading ? (
        <div className="py-16 flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-slate-400">Loading opportunity details...</p>
        </div>
      ) : isError || !deal ? (
        <div className="py-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-slate-800">Failed to load deal details</p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {(error as any)?.message || 'Record not found or network error.'}
          </p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Top Deal Summary Card */}
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="font-mono text-[10px] font-bold text-slate-400 uppercase">
                  Opportunity ID #{deal.id}
                </span>
                <h3 className="text-base font-black text-slate-900 leading-tight mt-0.5">{deal.title}</h3>
                <p className="text-xs text-slate-500 font-medium">
                  {deal.company?.name || 'Individual Prospect'}
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs font-bold text-slate-400 block">Deal Value</span>
                <span className="text-base font-black text-slate-900">
                  ₹{Number(deal.amount || 0).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60">
              <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 font-black text-[10px]">
                {deal.stage?.name || 'PROPOSAL'}
              </span>
              {deal.isWon ? (
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-black text-[10px] inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> WON
                </span>
              ) : deal.isLost ? (
                <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 font-black text-[10px] inline-flex items-center gap-1">
                  <XCircle className="w-3 h-3" /> LOST
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full bg-slate-200 text-slate-700 font-bold text-[10px]">
                  IN PROGRESS
                </span>
              )}
            </div>
          </div>

          {/* Details Section */}
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-white rounded-2xl border border-slate-200/80 space-y-3">
              <h4 className="text-xs font-black uppercase text-slate-900 tracking-wider flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-blue-600" /> Account & Opportunity Info
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Company Account</span>
                  <p className="font-bold text-slate-800 mt-0.5">{deal.company?.name || '—'}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Primary Contact</span>
                  <p className="font-bold text-slate-800 mt-0.5">
                    {deal.contact ? `${deal.contact.firstName} ${deal.contact.lastName || ''}` : '—'}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Assigned Deal Owner</span>
                  <p className="font-bold text-slate-800 mt-0.5">
                    {deal.assignedTo ? `${deal.assignedTo.firstName} ${deal.assignedTo.lastName}` : 'Unassigned'}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Expected Closing Date</span>
                  <p className="font-bold text-slate-800 mt-0.5 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    {deal.expectedCloseDate ? new Date(deal.expectedCloseDate).toLocaleDateString() : 'Not Set'}
                  </p>
                </div>
              </div>
            </div>

            {deal.notes && (
              <div className="p-4 bg-white rounded-2xl border border-slate-200/80 space-y-2">
                <h4 className="text-xs font-black uppercase text-slate-900 tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-600" /> Proposal Notes & Strategy
                </h4>
                <p className="text-xs text-slate-700 font-medium whitespace-pre-wrap">{deal.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </AdminFormDrawer>
  );
}
