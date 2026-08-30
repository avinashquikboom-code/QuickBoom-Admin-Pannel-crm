'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  Users,
  CreditCard,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ShieldCheck,
  Tag,
  Clock,
  Layers,
  Sparkles,
  RefreshCw,
  Eye,
  AlertCircle,
  Check,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { AdminFormDrawer } from '../dialogs/AdminFormDrawer';

export interface CustomerDetailsDrawerProps {
  customerId: number | string | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (customer: any) => void;
}

export function CustomerDetailsDrawer({
  customerId,
  isOpen,
  onClose,
  onEdit,
}: CustomerDetailsDrawerProps) {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'SUBSCRIPTION' | 'USERS' | 'CONTACT'>('OVERVIEW');

  // Fetch real customer data from existing API
  const {
    data: customer,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['admin-customer-details-drawer', customerId],
    enabled: isOpen && !!customerId,
    queryFn: async () => {
      if (!customerId) return null;
      const res: any = await api.get(`/customers/${customerId}`);
      return res?.data || res;
    },
  });

  if (!isOpen) return null;

  const planName = customer?.plan || customer?.currentSubscription?.planName || 'No Active Plan';
  const subStatus = customer?.subscriptionStatus || (customer?.currentSubscription ? 'ACTIVE' : 'INACTIVE');
  const isSubActive = subStatus === 'ACTIVE';

  return (
    <AdminFormDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={customer?.name || 'Customer Details'}
      description={customer ? `${customer.companyName || customer.company || 'Direct Client'} • ${customer.customerId || `CUST-${String(customerId).padStart(4, '0')}`}` : 'Loading customer account...'}
      icon={Building2}
      maxWidth="sm:max-w-[620px]"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <Link
              href={`/customers/${customerId}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition-all cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Full Page View</span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            {onEdit && customer && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(customer);
                }}
                className="px-4 py-2 bg-[#23C45E] hover:bg-[#1AA14D] text-slate-950 font-black rounded-xl text-xs transition-all cursor-pointer shadow-md"
              >
                Edit Customer
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
          <div className="w-8 h-8 border-3 border-[#23C45E] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-slate-400">Loading customer profile & subscription...</p>
        </div>
      ) : isError || !customer ? (
        <div className="py-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-slate-800">Failed to load customer details</p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {(error as any)?.message || 'Customer record not found or network connection error.'}
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
          {/* Top Customer Summary Card */}
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#E8F9EE] text-[#1AA14D] font-black text-lg flex items-center justify-center border border-emerald-200 shrink-0">
                  {customer.name?.charAt(0) || 'C'}
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 leading-tight">{customer.name}</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {customer.companyName || customer.company || 'Direct Organization'}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-[10px] font-bold text-slate-400">
                      {customer.customerId || `CUST-${String(customerId).padStart(4, '0')}`}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">
                      {customer.customerType || 'ENTERPRISE'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1">
                {customer.isActive ? (
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-black text-[10px] inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> ACTIVE
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 font-black text-[10px] inline-flex items-center gap-1">
                    <XCircle className="w-3 h-3" /> INACTIVE
                  </span>
                )}
                <span className="text-[10px] text-slate-400 font-medium">
                  Joined {new Date(customer.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/60 text-center">
              <div className="p-2 bg-white rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Users</span>
                <p className="text-sm font-black text-slate-900 mt-0.5">
                  {customer._count?.users ?? customer.users?.length ?? 0}
                </p>
              </div>
              <div className="p-2 bg-white rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Deals</span>
                <p className="text-sm font-black text-slate-900 mt-0.5">
                  {customer._count?.deals ?? 0}
                </p>
              </div>
              <div className="p-2 bg-white rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Tasks</span>
                <p className="text-sm font-black text-slate-900 mt-0.5">
                  {customer._count?.tasks ?? 0}
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
                  ? 'border-[#23C45E] text-slate-900'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              Overview
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('SUBSCRIPTION')}
              className={`pb-2.5 transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 ${
                activeTab === 'SUBSCRIPTION'
                  ? 'border-[#23C45E] text-slate-900'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              <span>Subscription</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[9px] ${isSubActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                {planName}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('USERS')}
              className={`pb-2.5 transition-colors cursor-pointer border-b-2 ${
                activeTab === 'USERS'
                  ? 'border-[#23C45E] text-slate-900'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              Users ({customer.users?.length ?? customer._count?.users ?? 0})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('CONTACT')}
              className={`pb-2.5 transition-colors cursor-pointer border-b-2 ${
                activeTab === 'CONTACT'
                  ? 'border-[#23C45E] text-slate-900'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              Contact & Address
            </button>
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-white rounded-2xl border border-slate-200/80 space-y-3">
                <h4 className="text-xs font-black uppercase text-slate-900 tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-[#23C45E]" /> Organization Information
                </h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400">Industry</span>
                    <p className="font-bold text-slate-800 mt-0.5">{customer.industry || 'Information Technology'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400">Acquisition Source</span>
                    <p className="font-bold text-slate-800 mt-0.5">{customer.source || 'DIRECT'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400">Assigned RM</span>
                    <p className="font-bold text-slate-800 mt-0.5">{customer.assignedEmployee || 'Unassigned'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400">Department</span>
                    <p className="font-bold text-slate-800 mt-0.5">{customer.department || 'Sales & BD'}</p>
                  </div>
                </div>
              </div>

              {customer.notes && (
                <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200/60 text-xs">
                  <span className="text-[10px] font-black uppercase text-amber-800 tracking-wider">Internal Account Notes</span>
                  <p className="font-medium text-slate-700 mt-1">{customer.notes}</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SUBSCRIPTION */}
          {activeTab === 'SUBSCRIPTION' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-white rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-[#23C45E]" />
                    <h4 className="text-xs font-black uppercase text-slate-900 tracking-wider">Active Subscription Tier</h4>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                    isSubActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {subStatus}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-black text-slate-900">{planName}</p>
                    <p className="text-[11px] font-bold text-slate-500 capitalize">
                      {customer.billingCycle || 'Monthly'} Billing Cycle
                    </p>
                  </div>
                  {customer.subscriptionAmount && (
                    <p className="text-base font-black text-slate-900">
                      ₹{Number(customer.subscriptionAmount).toLocaleString('en-IN')}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 text-xs">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400">Purchase Date</span>
                    <p className="font-bold text-slate-800 mt-0.5">
                      {customer.subscriptionCreatedAt || customer.createdAt
                        ? new Date(customer.subscriptionCreatedAt || customer.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                        : '—'}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400">Start Date</span>
                    <p className="font-bold text-slate-800 mt-0.5">
                      {customer.subscriptionStartDate
                        ? new Date(customer.subscriptionStartDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                        : '—'}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400">End Date</span>
                    <p className="font-bold text-slate-800 mt-0.5">
                      {customer.subscriptionEndDate
                        ? new Date(customer.subscriptionEndDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                        : '—'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Subscriptions History */}
              {customer.subscriptions && customer.subscriptions.length > 0 && (
                <div className="p-4 bg-white rounded-2xl border border-slate-200/80 space-y-3">
                  <h4 className="text-xs font-black uppercase text-slate-900 tracking-wider">Subscription History</h4>
                  <div className="divide-y divide-slate-100">
                    {customer.subscriptions.map((s: any) => {
                      const isUpcoming = s.startDate && new Date(s.startDate) > new Date();
                      const isExpired = s.endDate && new Date(s.endDate) < new Date();
                      const statusText = isUpcoming ? 'UPCOMING' : isExpired ? 'EXPIRED' : (s.status || 'ACTIVE');

                      return (
                        <div key={s.id} className="py-2.5 flex items-center justify-between">
                          <div>
                            <p className="font-bold text-slate-800">{s.plan?.name || `Plan #${s.planId}`}</p>
                            <p className="text-[10px] text-slate-400">
                              {s.createdAt ? `Purchased: ${new Date(s.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} • ` : ''}
                              {s.startDate ? new Date(s.startDate).toLocaleDateString() : 'N/A'} → {s.endDate ? new Date(s.endDate).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            statusText === 'UPCOMING'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : statusText === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {statusText}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: USERS */}
          {activeTab === 'USERS' && (
            <div className="space-y-3 text-xs">
              {customer.users && customer.users.length > 0 ? (
                <div className="p-4 bg-white rounded-2xl border border-slate-200/80 divide-y divide-slate-100">
                  {customer.users.map((u: any) => (
                    <div key={u.id} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 font-extrabold flex items-center justify-center text-xs">
                          {u.firstName?.[0] || u.email?.[0] || 'U'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">
                            {u.firstName} {u.lastName || ''}
                          </p>
                          <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400" /> {u.email}
                          </p>
                          {u.phone && (
                            <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <Phone className="w-2.5 h-2.5" /> {u.phone}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        u.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                      }`}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 bg-slate-50 rounded-2xl border border-slate-200 text-center text-slate-400 font-medium">
                  No dedicated user logins linked to this customer account.
                </div>
              )}
            </div>
          )}

          {/* TAB 4: CONTACT & ADDRESS */}
          {activeTab === 'CONTACT' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-white rounded-2xl border border-slate-200/80 space-y-3">
                <h4 className="text-xs font-black uppercase text-slate-900 tracking-wider flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#23C45E]" /> Direct Communications
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Primary Phone</span>
                    <p className="font-bold text-slate-900 mt-0.5 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      {customer.phone || '—'}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Alternate Phone</span>
                    <p className="font-bold text-slate-900 mt-0.5 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      {customer.alternatePhone || '—'}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl col-span-2">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Official Email</span>
                    <p className="font-bold text-slate-900 mt-0.5 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      {customer.email || '—'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-slate-200/80 space-y-3">
                <h4 className="text-xs font-black uppercase text-slate-900 tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#23C45E]" /> Registered Address
                </h4>
                <div className="space-y-2">
                  <p className="font-bold text-slate-900">{customer.address || 'No street address registered'}</p>
                  <p className="text-slate-600 font-medium">
                    {[customer.city, customer.state, customer.country, customer.pincode].filter(Boolean).join(', ') || '—'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </AdminFormDrawer>
  );
}
