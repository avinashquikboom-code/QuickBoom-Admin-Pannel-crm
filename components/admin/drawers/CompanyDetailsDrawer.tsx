'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Building,
  Mail,
  Phone,
  MapPin,
  Globe,
  Star,
  Users,
  DollarSign,
  Calendar,
  ExternalLink,
  Plus,
  AlertCircle,
  RefreshCw,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { AdminFormDrawer } from '../dialogs/AdminFormDrawer';

export interface CompanyDetailsDrawerProps {
  companyId: number | string | null;
  isOpen: boolean;
  onClose: () => void;
  onAddContact?: (company: any) => void;
  onAddDeal?: (company: any) => void;
}

export function CompanyDetailsDrawer({
  companyId,
  isOpen,
  onClose,
  onAddContact,
  onAddDeal,
}: CompanyDetailsDrawerProps) {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'CONTACTS' | 'DEALS'>('OVERVIEW');

  const {
    data: company,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['admin-company-details-drawer', companyId],
    enabled: isOpen && !!companyId,
    queryFn: async () => {
      if (!companyId) return null;
      const res: any = await api.get(`/companies/${companyId}`);
      return res?.data || res;
    },
  });

  if (!isOpen) return null;

  return (
    <AdminFormDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={company?.name || 'Company Details'}
      description={company ? `${company.industry || 'Commercial Enterprise'} • ${company.city || 'India'}` : 'Loading organization...'}
      icon={Building}
      maxWidth="sm:max-w-[620px]"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <Link
              href={`/companies/${companyId}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition-all cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Full Page View</span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            {onAddContact && company && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onAddContact(company);
                }}
                className="px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold rounded-xl text-xs transition-all cursor-pointer"
              >
                + Add Contact
              </button>
            )}
            {onAddDeal && company && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onAddDeal(company);
                }}
                className="px-3.5 py-2 bg-[#23C45E] hover:bg-[#1AA14D] text-slate-950 font-black rounded-xl text-xs transition-all cursor-pointer shadow-xs"
              >
                + Add Deal
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
          <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-slate-400">Loading company profile & stakeholders...</p>
        </div>
      ) : isError || !company ? (
        <div className="py-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-slate-800">Failed to load company details</p>
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
          {/* Top Profile Summary Card */}
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 font-black text-lg flex items-center justify-center border border-purple-200 shrink-0">
                  {company.name?.charAt(0) || 'C'}
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 leading-tight">{company.name}</h3>
                  <p className="text-xs text-slate-500 font-medium">{company.industry || 'Commercial Enterprise'}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-[10px] font-bold text-slate-400">
                      ID #{company.id}
                    </span>
                    {company.rating ? (
                      <span className="flex items-center gap-0.5 text-[10px] font-black text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded-md">
                        <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" /> {company.rating}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>

              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-black text-[10px] inline-flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> {company.status || 'ACTIVE'}
              </span>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 text-center">
              <div className="p-2 bg-white rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Key Contacts</span>
                <p className="text-sm font-black text-slate-900 mt-0.5">
                  {company.contacts?.length ?? 0}
                </p>
              </div>
              <div className="p-2 bg-white rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Active Deals</span>
                <p className="text-sm font-black text-slate-900 mt-0.5">
                  {company.deals?.length ?? 0}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-200 gap-4 text-xs font-black">
            <button
              type="button"
              onClick={() => setActiveTab('OVERVIEW')}
              className={`pb-2.5 transition-colors cursor-pointer border-b-2 ${
                activeTab === 'OVERVIEW'
                  ? 'border-purple-600 text-slate-900'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              Overview
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('CONTACTS')}
              className={`pb-2.5 transition-colors cursor-pointer border-b-2 ${
                activeTab === 'CONTACTS'
                  ? 'border-purple-600 text-slate-900'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              Contacts ({company.contacts?.length ?? 0})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('DEALS')}
              className={`pb-2.5 transition-colors cursor-pointer border-b-2 ${
                activeTab === 'DEALS'
                  ? 'border-purple-600 text-slate-900'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              Deals ({company.deals?.length ?? 0})
            </button>
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-white rounded-2xl border border-slate-200/80 space-y-3">
                <h4 className="text-xs font-black uppercase text-slate-900 tracking-wider flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-purple-600" /> Organization Info
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400">Industry</span>
                    <p className="font-bold text-slate-800 mt-0.5">{company.industry || '—'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400">Category</span>
                    <p className="font-bold text-slate-800 mt-0.5">{company.category || '—'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400">Assigned To</span>
                    <p className="font-bold text-slate-800 mt-0.5">
                      {company.assignedTo ? `${company.assignedTo.firstName} ${company.assignedTo.lastName}` : 'Unassigned'}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400">Phone</span>
                    <p className="font-bold text-slate-800 mt-0.5 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" /> {company.phone || '—'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-slate-200/80 space-y-2">
                <h4 className="text-xs font-black uppercase text-slate-900 tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-purple-600" /> Location & Address
                </h4>
                <p className="font-bold text-slate-900">{company.address || 'No street address'}</p>
                <p className="text-slate-600 font-medium">
                  {[company.city, company.state, company.country].filter(Boolean).join(', ') || 'India'}
                </p>
              </div>

              {company.website && (
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/60 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-slate-400" />
                    <span className="font-bold text-slate-800">{company.website}</span>
                  </div>
                  <a
                    href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-purple-600 hover:text-purple-800 font-bold"
                  >
                    Visit <ExternalLink className="w-3 h-3 inline ml-0.5" />
                  </a>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CONTACTS */}
          {activeTab === 'CONTACTS' && (
            <div className="space-y-3 text-xs">
              {company.contacts && company.contacts.length > 0 ? (
                <div className="p-4 bg-white rounded-2xl border border-slate-200/80 divide-y divide-slate-100">
                  {company.contacts.map((c: any) => (
                    <div key={c.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-900">
                          {c.firstName} {c.lastName}
                        </p>
                        <p className="text-[11px] text-purple-700 font-bold">{c.designation || 'Stakeholder'}</p>
                        {c.email && (
                          <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3 text-slate-400" /> {c.email}
                          </p>
                        )}
                      </div>
                      {c.phone && (
                        <span className="font-bold text-slate-700 flex items-center gap-1 text-[11px]">
                          <Phone className="w-3 h-3 text-slate-400" /> {c.phone}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 bg-slate-50 rounded-2xl border border-slate-200 text-center text-slate-400 font-medium">
                  No contact persons recorded for this company.
                </div>
              )}
            </div>
          )}

          {/* TAB 3: DEALS */}
          {activeTab === 'DEALS' && (
            <div className="space-y-3 text-xs">
              {company.deals && company.deals.length > 0 ? (
                <div className="p-4 bg-white rounded-2xl border border-slate-200/80 divide-y divide-slate-100">
                  {company.deals.map((d: any) => (
                    <div key={d.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-900">{d.title}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">{d.stage?.name || 'In Pipeline'}</p>
                      </div>
                      <span className="text-sm font-black text-slate-900">
                        ₹{Number(d.amount || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 bg-slate-50 rounded-2xl border border-slate-200 text-center text-slate-400 font-medium">
                  No active sales opportunities for this account.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </AdminFormDrawer>
  );
}
