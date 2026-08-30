'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  User,
  Mail,
  Phone,
  Building,
  MapPin,
  Calendar,
  DollarSign,
  Clock,
  ExternalLink,
  Plus,
  AlertCircle,
  RefreshCw,
  MessageSquare,
  CheckCircle2,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { AdminFormDrawer } from '../dialogs/AdminFormDrawer';

export interface ContactDetailsDrawerProps {
  contactId: number | string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ContactDetailsDrawer({
  contactId,
  isOpen,
  onClose,
}: ContactDetailsDrawerProps) {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'DEALS' | 'VISITS'>('OVERVIEW');

  const {
    data: contact,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['admin-contact-details-drawer', contactId],
    enabled: isOpen && !!contactId,
    queryFn: async () => {
      if (!contactId) return null;
      const res: any = await api.get(`/contacts/${contactId}`);
      return res?.data || res;
    },
  });

  if (!isOpen) return null;

  return (
    <AdminFormDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={contact ? `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || 'Contact Details' : 'Contact Details'}
      description={contact ? `${contact.designation || 'Stakeholder'} • ${contact.company?.name || 'Independent'}` : 'Loading contact details...'}
      icon={User}
      maxWidth="sm:max-w-[580px]"
      footer={
        <div className="flex items-center justify-between w-full">
          <Link
            href={`/contacts/${contactId}`}
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
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-slate-400">Loading contact information...</p>
        </div>
      ) : isError || !contact ? (
        <div className="py-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-slate-800">Failed to load contact details</p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {(error as any)?.message || 'Record not found or network connection error.'}
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
          {/* Top Contact Summary Card */}
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 font-black text-lg flex items-center justify-center border border-blue-200 shrink-0">
                  {contact.firstName?.charAt(0) || 'U'}
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 leading-tight">
                    {contact.firstName} {contact.lastName || ''}
                  </h3>
                  <p className="text-xs text-blue-700 font-bold">{contact.designation || 'Stakeholder'}</p>
                  <p className="text-xs text-slate-500 font-medium">{contact.company?.name || 'Independent Contact'}</p>
                </div>
              </div>

              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-black text-[10px] inline-flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> ACTIVE
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-200 gap-4 text-xs font-black">
            <button
              type="button"
              onClick={() => setActiveTab('OVERVIEW')}
              className={`pb-2.5 transition-colors cursor-pointer border-b-2 ${
                activeTab === 'OVERVIEW'
                  ? 'border-blue-600 text-slate-900'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              Overview
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('DEALS')}
              className={`pb-2.5 transition-colors cursor-pointer border-b-2 ${
                activeTab === 'DEALS'
                  ? 'border-blue-600 text-slate-900'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              Deals ({contact.deals?.length ?? 0})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('VISITS')}
              className={`pb-2.5 transition-colors cursor-pointer border-b-2 ${
                activeTab === 'VISITS'
                  ? 'border-blue-600 text-slate-900'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              Visits ({contact.visits?.length ?? 0})
            </button>
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-white rounded-2xl border border-slate-200/80 space-y-3">
                <h4 className="text-xs font-black uppercase text-slate-900 tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-600" /> Direct Communications
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Primary Phone</span>
                    <p className="font-bold text-slate-900 mt-0.5 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" /> {contact.phone || '—'}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Mobile Phone</span>
                    <p className="font-bold text-slate-900 mt-0.5 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" /> {contact.mobile || '—'}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl col-span-2">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Email Address</span>
                    <p className="font-bold text-slate-900 mt-0.5 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" /> {contact.email || '—'}
                    </p>
                  </div>
                </div>
              </div>

              {contact.company && (
                <div className="p-4 bg-white rounded-2xl border border-slate-200/80 space-y-2">
                  <h4 className="text-xs font-black uppercase text-slate-900 tracking-wider flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-blue-600" /> Associated Company
                  </h4>
                  <p className="font-extrabold text-slate-900">{contact.company.name}</p>
                  <p className="text-slate-500 font-medium">
                    {contact.company.industry || 'Commercial Enterprise'} • {contact.company.city || 'India'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DEALS */}
          {activeTab === 'DEALS' && (
            <div className="space-y-3 text-xs">
              {contact.deals && contact.deals.length > 0 ? (
                <div className="p-4 bg-white rounded-2xl border border-slate-200/80 divide-y divide-slate-100">
                  {contact.deals.map((d: any) => (
                    <div key={d.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-900">{d.title}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">{d.stage?.name || 'Pipeline'}</p>
                      </div>
                      <span className="text-sm font-black text-slate-900">
                        ₹{Number(d.amount || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 bg-slate-50 rounded-2xl border border-slate-200 text-center text-slate-400 font-medium">
                  No deals linked directly to this contact.
                </div>
              )}
            </div>
          )}

          {/* TAB 3: VISITS */}
          {activeTab === 'VISITS' && (
            <div className="space-y-3 text-xs">
              {contact.visits && contact.visits.length > 0 ? (
                <div className="p-4 bg-white rounded-2xl border border-slate-200/80 divide-y divide-slate-100">
                  {contact.visits.map((v: any) => (
                    <div key={v.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-900">{v.purpose}</p>
                        <p className="text-[10px] text-slate-400">{v.date} at {v.time}</p>
                      </div>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-bold rounded text-[10px]">
                        {v.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 bg-slate-50 rounded-2xl border border-slate-200 text-center text-slate-400 font-medium">
                  No recorded visits or consultations for this contact.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </AdminFormDrawer>
  );
}
