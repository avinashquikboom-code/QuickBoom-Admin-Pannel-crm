'use client';

import React from 'react';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  MapPin,
  Building,
  User,
  CheckCircle2,
  XCircle,
  Phone,
  Mail,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { AdminFormDrawer } from '../dialogs/AdminFormDrawer';

export interface VisitDetailsDrawerProps {
  visitId: number | string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function VisitDetailsDrawer({
  visitId,
  isOpen,
  onClose,
}: VisitDetailsDrawerProps) {
  const {
    data: visit,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['admin-visit-details-drawer', visitId],
    enabled: isOpen && !!visitId,
    queryFn: async () => {
      if (!visitId) return null;
      const res: any = await api.get(`/visits/${visitId}`);
      return res?.data || res;
    },
  });

  if (!isOpen) return null;

  return (
    <AdminFormDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={visit?.purpose || 'Visit Consultation'}
      description={visit ? `${visit.date} at ${visit.time} • ${visit.company?.name || 'Client Location'}` : 'Loading visit details...'}
      icon={Calendar}
      maxWidth="sm:max-w-[580px]"
      footer={
        <div className="flex items-center justify-between w-full">
          <Link
            href={`/visits/${visitId}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition-all cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Full Page View</span>
          </Link>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      }
    >
      {isLoading ? (
        <div className="py-16 flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-slate-400">Loading visit details & location...</p>
        </div>
      ) : isError || !visit ? (
        <div className="py-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-slate-800">Failed to load visit</p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {(error as any)?.message || 'Record not found or connection error.'}
          </p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      ) : (
        <div className="space-y-5 text-xs">
          {/* Top Summary Card */}
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="font-mono text-[10px] font-bold text-slate-400 uppercase">
                  VISIT #{visit.id}
                </span>
                <h3 className="text-base font-black text-slate-900 leading-tight mt-0.5">{visit.purpose}</h3>
                <p className="text-xs text-slate-500 font-medium">
                  {visit.company?.name || 'Independent Client'}
                </p>
              </div>

              <span
                className={`px-2.5 py-1 rounded-full font-black text-[10px] inline-flex items-center gap-1 ${
                  visit.status === 'COMPLETED'
                    ? 'bg-emerald-100 text-emerald-800'
                    : visit.status === 'CANCELLED'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                {visit.status || 'SCHEDULED'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200/60">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">Date & Time</span>
                <p className="font-bold text-slate-800 mt-0.5">
                  {visit.date} at {visit.time}
                </p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">
                  {visit.status === 'COMPLETED' ? 'Completed By' : 'Field Officer'}
                </span>
                <p className="font-bold text-slate-800 mt-0.5">
                  {visit.employee
                    ? `${visit.employee.firstName || ''} ${visit.employee.lastName || ''}`.trim()
                    : (visit.completedBy || visit.assignedEmployee || 'Unassigned')}
                </p>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 space-y-2">
            <h4 className="text-xs font-black uppercase text-slate-900 tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" /> Destination & Address
            </h4>
            <p className="font-bold text-slate-800">{visit.location || 'Client Registered Location'}</p>
          </div>

          {/* Stakeholder */}
          {visit.contact && (
            <div className="p-4 bg-white rounded-2xl border border-slate-200/80 space-y-2">
              <h4 className="text-xs font-black uppercase text-slate-900 tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-600" /> Client Stakeholder
              </h4>
              <p className="font-bold text-slate-900">
                {visit.contact.firstName} {visit.contact.lastName || ''}
              </p>
              {visit.contact.phone && (
                <p className="text-slate-600 font-medium flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" /> {visit.contact.phone}
                </p>
              )}
            </div>
          )}

          {/* Outcome Notes */}
          {visit.notes && (
            <div className="p-4 bg-white rounded-2xl border border-slate-200/80 space-y-2">
              <h4 className="text-xs font-black uppercase text-slate-900 tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-emerald-600" /> Visit Discussion Notes
              </h4>
              <p className="text-slate-700 font-medium whitespace-pre-wrap">{visit.notes}</p>
            </div>
          )}
        </div>
      )}
    </AdminFormDrawer>
  );
}
