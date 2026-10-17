'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
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
  RotateCcw,
  UserCheck,
} from 'lucide-react';
import api from '@/lib/api';
import { AdminPageHeader, AdminButton } from '@/components/admin';
import { ResetCustomerDataModal } from '@/components/admin/dialogs/ResetCustomerDataModal';
import { getErrorMessage } from '@/lib/utils';

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const customerId = (params?.id as string) || '';

  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'SUBSCRIPTION' | 'USERS' | 'CONTACT'>('OVERVIEW');
  const [isResetOpen, setIsResetOpen] = useState(false);

  const numericCustomerId = customerId ? Number(String(customerId).trim()) : null;
  const isValidCustomerId =
    typeof numericCustomerId === 'number' &&
    Number.isInteger(numericCustomerId) &&
    numericCustomerId > 0;

  const {
    data: customer,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['admin-customer-details-page', customerId],
    enabled: isValidCustomerId,
    queryFn: async () => {
      if (!isValidCustomerId || !numericCustomerId) return null;
      const res: any = await api.get(`/customers/${numericCustomerId}`);
      return res?.data || res;
    },
  });

  const formatDate = (val?: string | null) => {
    if (!val) return '—';
    const d = new Date(val);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  if (!isValidCustomerId) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          title="Customer Details"
          breadcrumbs={[
            { label: 'Customers', href: '/customers' },
            { label: 'Invalid Customer ID' },
          ]}
          icon={Building2}
        />
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
          <h3 className="text-base font-black text-slate-900">Invalid Customer Identifier</h3>
          <p className="text-xs text-slate-500">The customer ID in the URL is invalid or malformed.</p>
          <Link href="/customers">
            <AdminButton variant="primary" size="sm" icon={ArrowLeft}>
              Back to Customers
            </AdminButton>
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          title="Loading Customer Details..."
          breadcrumbs={[
            { label: 'Customers', href: '/customers' },
            { label: `CUST-${String(customerId).padStart(4, '0')}` },
          ]}
          icon={Building2}
        />
        <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-[#23C45E] animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-500">Fetching customer profile and subscriptions...</p>
        </div>
      </div>
    );
  }

  if (isError || !customer) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          title="Customer Not Found"
          breadcrumbs={[
            { label: 'Customers', href: '/customers' },
            { label: `CUST-${String(customerId).padStart(4, '0')}` },
          ]}
          icon={Building2}
        />
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h3 className="text-base font-black text-slate-900">Customer Account Unavailable</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {error ? getErrorMessage(error) : 'The requested customer record does not exist or has been removed.'}
          </p>
          <div className="flex items-center justify-center gap-3">
            <AdminButton variant="outline" size="sm" onClick={() => refetch()}>
              Retry
            </AdminButton>
            <Link href="/customers">
              <AdminButton variant="primary" size="sm" icon={ArrowLeft}>
                Back to Customers
              </AdminButton>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const planName = customer.planName || customer.plan || customer.currentSubscription?.planName || 'No Active Plan';
  const subStatus = customer.subscriptionStatus || (customer.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE');
  const isSubActive = customer.status === 'ACTIVE';
  const isPendingActivation = customer.subscriptionStatus === 'PENDING_ACTIVATION' && !isSubActive;

  return (
    <div className="space-y-6 max-w-full pb-16">
      <AdminPageHeader
        title={customer.companyName || customer.name || 'Customer Account'}
        description={`Organization Workspace: ${customer.companyName || 'Direct Client'} • Customer ID: CUST-${String(customerId).padStart(4, '0')}`}
        breadcrumbs={[
          { label: 'Customers', href: '/customers' },
          { label: customer.companyName || `CUST-${customerId}` },
        ]}
        icon={Building2}
        actions={
          <div className="flex items-center gap-2.5 flex-wrap">
            <Link href="/customers">
              <AdminButton variant="outline" size="sm" icon={ArrowLeft}>
                Back to List
              </AdminButton>
            </Link>
            <Link href={`/subscribe?customerId=${customer.id}`}>
              <AdminButton variant="primary" size="sm" icon={CreditCard}>
                Manage Plan
              </AdminButton>
            </Link>
            <AdminButton
              variant="danger"
              size="sm"
              icon={RotateCcw}
              onClick={() => setIsResetOpen(true)}
            >
              Reset Data
            </AdminButton>
          </div>
        }
      />

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        {[
          { key: 'OVERVIEW', label: 'Account Overview', icon: Building2 },
          { key: 'SUBSCRIPTION', label: 'Subscription & Plans', icon: CreditCard },
          { key: 'USERS', label: 'Users & Roles', icon: Users },
          { key: 'CONTACT', label: 'Contact Info', icon: Mail },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 py-3 px-5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                isActive
                  ? 'border-[#23C45E] text-[#1AA14D]'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content based on Active Tab */}
      {activeTab === 'OVERVIEW' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
              <h3 className="text-sm font-black text-slate-900">Organization Profile</h3>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 font-bold block">Company Name</span>
                  <span className="font-extrabold text-slate-900 text-sm">{customer.companyName}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block">Account Status</span>
                  {isSubActive ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black bg-[#E8F9EE] text-[#1AA14D] border border-[#23C45E]/30 mt-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#23C45E]" /> Active
                    </span>
                  ) : isPendingActivation ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-50 text-amber-800 border border-amber-200 mt-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> Pending Activation
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black bg-slate-100 text-slate-600 border border-slate-200 mt-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" /> Inactive
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-slate-400 font-bold block">Primary Email</span>
                  <span className="font-semibold text-slate-700">{customer.email || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block">Phone</span>
                  <span className="font-semibold text-slate-700">{customer.phone || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block">Origin Lead</span>
                  <span className="font-semibold text-slate-700">
                    {customer.originLeadId ? `Won Lead #${customer.originLeadId}` : 'Direct Client'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block">Registration Date</span>
                  <span className="font-semibold text-slate-700">{formatDate(customer.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
              <h3 className="text-sm font-black text-slate-900">Current Subscription</h3>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-bold">Plan:</span>
                  <span className="font-extrabold text-slate-900">{planName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-bold">Purchased:</span>
                  <span className="font-semibold text-slate-700">
                    {formatDate(customer.purchaseDate || customer.createdAt)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-bold">Activates:</span>
                  <span className="font-semibold text-amber-800">
                    {formatDate(customer.activationDate || customer.subscriptionStartDate)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-bold">Valid Until:</span>
                  <span className="font-semibold text-slate-700">
                    {formatDate(customer.subscriptionEndDate)}
                  </span>
                </div>
              </div>
              <Link href={`/subscribe?customerId=${customer.id}`} className="block">
                <AdminButton variant="outline" size="sm" className="w-full" icon={CreditCard}>
                  Upgrade or Change Plan
                </AdminButton>
              </Link>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'SUBSCRIPTION' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-6 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900">Subscription History</h3>
            <Link href={`/subscribe?customerId=${customer.id}`}>
              <AdminButton variant="primary" size="sm" icon={CreditCard}>
                Purchase Plan
              </AdminButton>
            </Link>
          </div>
          {Array.isArray(customer.subscriptions) && customer.subscriptions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 font-black uppercase text-[10px] tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="p-3">Plan Name</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Start Date</th>
                    <th className="p-3">End Date</th>
                    <th className="p-3">Activation Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customer.subscriptions.map((sub: any) => (
                    <tr key={sub.id}>
                      <td className="p-3 font-bold text-slate-900">{sub.plan?.name || sub.planName || 'Plan'}</td>
                      <td className="p-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase bg-slate-100 text-slate-700">
                          {sub.status}
                        </span>
                      </td>
                      <td className="p-3">{formatDate(sub.startDate)}</td>
                      <td className="p-3">{formatDate(sub.endDate)}</td>
                      <td className="p-3">{formatDate(sub.activationDate || sub.startDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-4 italic text-center">No subscription history recorded yet.</p>
          )}
        </div>
      )}

      {activeTab === 'USERS' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
          <h3 className="text-sm font-black text-slate-900">Linked User Account</h3>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-bold">User Account Linked:</span>
              <span className="font-extrabold text-slate-900">{customer.userId ? `User ID #${customer.userId}` : 'None'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-bold">Customer Portal Access:</span>
              <span className={`font-bold ${customer.userId ? 'text-emerald-700' : 'text-slate-500'}`}>
                {customer.userId ? 'Active' : 'Account Not Created'}
              </span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'CONTACT' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
          <h3 className="text-sm font-black text-slate-900">Contact & Address Details</h3>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-400 font-bold block">Email</span>
              <span className="font-semibold text-slate-800">{customer.email || '—'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold block">Phone</span>
              <span className="font-semibold text-slate-800">{customer.phone || '—'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold block">City</span>
              <span className="font-semibold text-slate-800">{customer.city || '—'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold block">State</span>
              <span className="font-semibold text-slate-800">{customer.state || '—'}</span>
            </div>
            <div className="col-span-2">
              <span className="text-slate-400 font-bold block">Full Address</span>
              <span className="font-semibold text-slate-800">{customer.address || '—'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Reset Modal */}
      {isResetOpen && (
        <ResetCustomerDataModal
          isOpen={isResetOpen}
          onClose={() => setIsResetOpen(false)}
          customerId={customer.id}
          companyName={customer.companyName}
          onSuccess={() => {
            setIsResetOpen(false);
            queryClient.invalidateQueries({ queryKey: ['admin-customer-details-page', customerId] });
            queryClient.invalidateQueries({ queryKey: ['customers-list'] });
          }}
        />
      )}
    </div>
  );
}
