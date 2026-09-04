'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Building2,
  ArrowLeft,
  ShieldCheck,
  Users,
  DollarSign,
  Calendar,
  Mail,
  Phone,
  MapPin,
  CheckCircle2,
  XCircle,
  Sliders,
  Layers,
  Activity,
  UserPlus,
  RefreshCw,
  Clock,
  Sparkles,
  CreditCard,
  Key,
  CheckSquare,
  Briefcase,
  FileText,
  History,
  Tag,
  Globe,
  UserCheck,
  RotateCw,
  Plus,
  PlayCircle,
  PowerOff,
  Trash2,
  AlertTriangle,
  ChevronRight,
  Info,
  Check,
  Download,
  Share2,
  Instagram,
  Facebook,
  Youtube,
  Linkedin,
  ExternalLink,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { SocialMediaService, SocialMediaHandlerItem } from '@/lib/services/social-media.service';
import { toast } from 'react-hot-toast';
import { getErrorMessage } from '@/lib/utils';
import { downloadPdfFromEndpoint } from '@/lib/pdf-download.util';

function getCustomerDisplayName(customer: any): string {
  if (!customer) return 'Customer';
  return (
    customer.companyName ||
    customer.legalCompanyName ||
    customer.businessName ||
    customer.company ||
    customer.name ||
    'Customer'
  );
}

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const customerId = params.id as string;

  const [activeTab, setActiveTab] = useState<
    'OVERVIEW' | 'SUBSCRIPTIONS' | 'INVOICES' | 'ACTIVITIES' | 'TASKS' | 'VISITS' | 'DEALS' | 'NOTES' | 'HISTORY' | 'SOCIAL_MEDIA'
  >('OVERVIEW');

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'ACTIVATE' | 'DEACTIVATE' | 'DELETE';
    subscriptionId: number;
    planName: string;
  } | null>(null);

  // 1. Fetch Customer Profile Details
  const { data: customer, isLoading: isCustomerLoading, refetch: refetchCustomer } = useQuery({
    queryKey: ['customer-detail', customerId],
    refetchInterval: 10000,
    queryFn: async () => {
      try {
        const res: any = await api.get(`/customers/${customerId}`);
        return res?.data || res;
      } catch {
        return null;
      }
    },
  });

  // 2. Fetch Customer Subscriptions (Current & History)
  const { data: subData, isLoading: isSubLoading, refetch: refetchSubscriptions } = useQuery({
    queryKey: ['customer-subscriptions', customerId],
    refetchInterval: 10000,
    queryFn: async () => {
      try {
        const res: any = await api.get(`/admin/customers/${customerId}/subscriptions`);
        return res?.data || res;
      } catch {
        return { currentSubscription: null, subscriptionHistory: [], previousSubscriptions: [] };
      }
    },
  });

  // 2b. Fetch Customer Invoices & Billing
  const {
    data: invoices = [],
    isLoading: isInvoicesLoading,
    isError: isInvoicesError,
    error: invoicesError,
    refetch: refetchInvoices,
  } = useQuery({
    queryKey: ['customer-invoices', customerId],
    refetchInterval: 10000,
    queryFn: async () => {
      // Use dedicated admin endpoint to avoid CustomerGuard cross-customer 403
      const res: any = await api.get(`/invoices/customers/${customerId}/invoices`);
      // api interceptor already unwraps response.data → res is the JSON body
      const items =
        res?.items ||
        res?.data ||
        (Array.isArray(res) ? res : []);
      return Array.isArray(items) ? items : [];
    },
    enabled: Boolean(customerId),
  });

  // 2c. Fetch Customer Installments & Buffer Summary
  const {
    data: installmentSummary,
    isLoading: isInstallmentsLoading,
    refetch: refetchInstallments,
  } = useQuery({
    queryKey: ['customer-installments', customerId],
    refetchInterval: 10000,
    queryFn: async () => {
      try {
        const res: any = await api.get(`/admin/customers/${customerId}/installments`);
        return res?.data?.data || res?.data || res;
      } catch {
        return null;
      }
    },
    enabled: Boolean(customerId),
  });

  // Record Manual Installment Payment Mutation
  const recordInstallmentPaymentMutation = useMutation({
    mutationFn: async (instId: number | string) => {
      const res: any = await api.post(`/admin/customers/${customerId}/installments/${instId}/pay`, {
        paymentMethod: 'CASH',
        notes: 'Admin manual installment payment confirmation',
      });
      return res.data;
    },
    onSuccess: (data: any) => {
      toast.success(data?.message || 'Installment payment recorded & plan extended!');
      handleInvalidateAll();
      refetchInstallments();
      refetchSubscriptions();
      refetchInvoices();
      refetchCustomer();
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err) || 'Failed to record installment payment');
    },
  });

  // Start New Plan Mutation (When Prior Plan Renewal Failed)
  const startNewPlanMutation = useMutation({
    mutationFn: async () => {
      const res: any = await api.post(`/admin/customers/${customerId}/start-new-plan`, {
        paymentMethod: 'CASH',
        totalInstallments: 2,
      });
      return res.data;
    },
    onSuccess: (data: any) => {
      toast.success(data?.message || 'New plan created and initial installment settled!');
      handleInvalidateAll();
      refetchInstallments();
      refetchSubscriptions();
      refetchInvoices();
      refetchCustomer();
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err) || 'Failed to start new plan');
    },
  });

  // 2c. Fetch Social Media Handlers
  const {
    data: socialMediaHandlers = [],
    isLoading: isSocialMediaLoading,
    refetch: refetchSocialMedia,
  } = useQuery({
    queryKey: ['customer-social-media', customerId],
    refetchInterval: 10000,
    queryFn: async () => {
      try {
        return await SocialMediaService.getCustomerHandlers(customerId);
      } catch {
        return [];
      }
    },
  });

  // 3. Fetch Customer Activities & Schedules
  const { data: activities = [] } = useQuery({
    queryKey: ['customer-activities', customerId],
    queryFn: async () => {
      try {
        const res: any = await api.get(`/customers/${customerId}/activities`);
        const items = res?.data || res;
        return Array.isArray(items) ? items : [];
      } catch {
        return [];
      }
    },
  });

  // 4. Fetch Customer Tasks
  const { data: tasks = [] } = useQuery({
    queryKey: ['customer-tasks', customerId],
    queryFn: async () => {
      try {
        const res: any = await api.get(`/customers/${customerId}/tasks`);
        const items = res?.data || res;
        return Array.isArray(items) ? items : [];
      } catch {
        return [];
      }
    },
  });

  // 5. Fetch Customer Visits
  const { data: visits = [] } = useQuery({
    queryKey: ['customer-visits', customerId],
    queryFn: async () => {
      try {
        const res: any = await api.get(`/customers/${customerId}/visits`);
        const items = res?.data || res;
        return Array.isArray(items) ? items : [];
      } catch {
        return [];
      }
    },
  });

  // 6. Fetch Customer Deals
  const { data: deals = [] } = useQuery({
    queryKey: ['customer-deals', customerId],
    queryFn: async () => {
      try {
        const res: any = await api.get(`/customers/${customerId}/deals`);
        const items = res?.data || res;
        return Array.isArray(items) ? items : [];
      } catch {
        return [];
      }
    },
  });

  // Invalidate all related caches after state modifications
  const handleInvalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['customer-subscriptions', customerId] });
    queryClient.invalidateQueries({ queryKey: ['customer-invoices', customerId] });
    queryClient.invalidateQueries({ queryKey: ['customer-detail', customerId] });
    queryClient.invalidateQueries({ queryKey: ['customers-list'] });
    queryClient.invalidateQueries({ queryKey: ['invoices'] });
    queryClient.invalidateQueries({ queryKey: ['admin-subscriptions-list'] });
    queryClient.invalidateQueries({ queryKey: ['customers-metrics'] });
  };

  // Plans Query (for manual activation & plan change)
  const { data: plansList = [] } = useQuery({
    queryKey: ['admin-plans-list'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/admin/plans');
        const items = res?.data || res;
        return Array.isArray(items) ? items : [];
      } catch {
        return [];
      }
    },
  });

  // Modal States
  const [manualPlanModal, setManualPlanModal] = useState<{
    isOpen: boolean;
    planId: number | string;
    billingCycle: 'MONTHLY' | 'YEARLY';
    startDate: string;
  }>({
    isOpen: false,
    planId: '',
    billingCycle: 'MONTHLY',
    startDate: new Date().toISOString().split('T')[0],
  });

  const [changePlanModal, setChangePlanModal] = useState<{
    isOpen: boolean;
    subscriptionId: number;
    currentPlanName: string;
    newPlanId: number | string;
    billingCycle: 'MONTHLY' | 'YEARLY';
  }>({
    isOpen: false,
    subscriptionId: 0,
    currentPlanName: '',
    newPlanId: '',
    billingCycle: 'MONTHLY',
  });

  const [renewModal, setRenewModal] = useState<{
    isOpen: boolean;
    subscriptionId: number;
    planName: string;
    billingCycle: 'MONTHLY' | 'YEARLY';
  }>({
    isOpen: false,
    subscriptionId: 0,
    planName: '',
    billingCycle: 'MONTHLY',
  });

  // Manual Activate Plan Mutation
  const createSubMutation = useMutation({
    mutationFn: async (payload: any) => {
      return api.post(`/admin/customers/${customerId}/subscriptions`, payload);
    },
    onSuccess: () => {
      toast.success('Customer plan activated successfully! Calendar & entitlements generated.');
      handleInvalidateAll();
      setManualPlanModal({ isOpen: false, planId: '', billingCycle: 'MONTHLY', startDate: new Date().toISOString().split('T')[0] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to activate plan');
    },
  });

  // Change Plan Mutation
  const changePlanMutation = useMutation({
    mutationFn: async ({ subscriptionId, payload }: { subscriptionId: number; payload: any }) => {
      return api.post(`/admin/subscriptions/${subscriptionId}/change-plan`, payload);
    },
    onSuccess: () => {
      toast.success('Subscription plan changed successfully! Calendar quotas updated.');
      handleInvalidateAll();
      setChangePlanModal({ isOpen: false, subscriptionId: 0, currentPlanName: '', newPlanId: '', billingCycle: 'MONTHLY' });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to change plan');
    },
  });

  // Renew Mutation
  const renewMutation = useMutation({
    mutationFn: async ({ subscriptionId, payload }: { subscriptionId: number; payload: any }) => {
      return api.post(`/admin/subscriptions/${subscriptionId}/renew`, payload);
    },
    onSuccess: () => {
      toast.success('Subscription renewed successfully! Validity extended.');
      handleInvalidateAll();
      setRenewModal({ isOpen: false, subscriptionId: 0, planName: '', billingCycle: 'MONTHLY' });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to renew subscription');
    },
  });

  // Activate Mutation
  const activateMutation = useMutation({
    mutationFn: async (subscriptionId: number) => {
      return api.patch(`/admin/subscriptions/${subscriptionId}/activate`);
    },
    onSuccess: () => {
      toast.success('Subscription activated successfully! Customer entitlements refreshed.');
      handleInvalidateAll();
      setConfirmModal(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to activate subscription');
    },
  });

  // Deactivate Mutation
  const deactivateMutation = useMutation({
    mutationFn: async (subscriptionId: number) => {
      return api.patch(`/admin/subscriptions/${subscriptionId}/deactivate`);
    },
    onSuccess: () => {
      toast.success('Subscription deactivated. Historical records preserved.');
      handleInvalidateAll();
      setConfirmModal(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to deactivate subscription');
    },
  });

  // Delete Mutation (Soft delete)
  const deleteMutation = useMutation({
    mutationFn: async (subscriptionId: number) => {
      return api.delete(`/admin/subscriptions/${subscriptionId}`);
    },
    onSuccess: () => {
      toast.success('Subscription deleted. Audit logs updated.');
      handleInvalidateAll();
      setConfirmModal(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to delete subscription');
    },
  });

  const currentSub = subData?.currentSubscription;
  const historySubs: any[] = subData?.subscriptionHistory || [];

  const handleRefresh = () => {
    refetchCustomer();
    refetchSubscriptions();
    refetchInvoices();
    refetchInstallments();
    toast.success('Data refreshed from server');
  };

  const handleDownloadInvoice = async (inv: any) => {
    const invNo = inv.invoiceNumber || inv.invoiceNo || inv.id;
    await downloadPdfFromEndpoint(
      `/invoices/${inv.id}/download`,
      `invoice_${invNo}.pdf`,
      {
        loadingMessage: `Preparing PDF for #${invNo}...`,
        successMessage: 'Invoice PDF downloaded',
        toastId: 'inv-dl',
      }
    );
  };

  const getStatusBadge = (status: string) => {
    const norm = (status || '').toUpperCase();
    if (norm === 'UPCOMING') {
      return (
        <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-300 text-xs font-black flex items-center gap-1.5 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          UPCOMING
        </span>
      );
    }
    if (norm === 'ACTIVE') {
      return (
        <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-black flex items-center gap-1.5 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          ACTIVE
        </span>
      );
    }
    if (norm === 'PENDING') {
      return (
        <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-300 text-xs font-black flex items-center gap-1.5 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
          PENDING APPROVAL
        </span>
      );
    }
    if (norm === 'DEACTIVATED' || norm === 'CANCELED' || norm === 'CANCELLED') {
      return (
        <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-black flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          DEACTIVATED
        </span>
      );
    }
    if (norm === 'EXPIRED') {
      return (
        <span className="px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-black flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-rose-500" />
          EXPIRED
        </span>
      );
    }
    if (norm === 'TRIAL') {
      return (
        <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-black flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-500" />
          TRIAL
        </span>
      );
    }
    return (
      <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-xs font-black">
        {status || 'INACTIVE'}
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-16 text-slate-800 animate-in fade-in-50 duration-200">
      {/* 1. HERO HEADER */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#23C45E]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Link
                href="/customers"
                className="p-2 bg-white/10 hover:bg-white/15 rounded-xl text-white transition-colors cursor-pointer"
                title="Back to Customers"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <span className="px-3 py-1 rounded-full bg-[#23C45E]/20 text-[#23C45E] border border-[#23C45E]/30 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                {customer?.customerId || `CUST-${String(customerId).padStart(4, '0')}`}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{getCustomerDisplayName(customer)}</h1>
              {customer?.isActive || customer?.status === 'ACTIVE' ? (
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-black">
                  Active
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-black">
                  Inactive
                </span>
              )}
            </div>

            <p className="text-slate-300 text-xs sm:text-sm font-medium">
              Company: <strong className="text-white">{customer?.companyName || customer?.legalCompanyName || customer?.company || customer?.name || '—'}</strong> • Active Plan:{' '}
              <strong className="text-[#23C45E]">{currentSub?.planName || customer?.plan || 'No Active Plan'}</strong>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white font-bold rounded-2xl text-xs transition-all cursor-pointer border border-white/10"
            >
              <RefreshCw className="w-4 h-4 text-[#23C45E]" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. STAT CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">Current Plan</p>
            <p className="text-xl font-black text-slate-900 mt-1 truncate max-w-[150px]">
              {currentSub?.planName || 'None'}
            </p>
            <p className="text-[10px] text-emerald-600 font-bold mt-0.5">
              {currentSub?.subscriptionStatus === 'ACTIVE' ? 'Active Subscription' : 'No Active Sub'}
            </p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#23C45E] flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">Allocated Tasks</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">{tasks.length}</p>
            <p className="text-[10px] text-emerald-700 font-bold mt-0.5">Action items</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckSquare className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">Field Visits</p>
            <p className="text-2xl font-black text-indigo-600 mt-1">{visits.length}</p>
            <p className="text-[10px] text-indigo-700 font-bold mt-0.5">Logged meetings</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <MapPin className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">Deals in Pipeline</p>
            <p className="text-2xl font-black text-blue-600 mt-1">{deals.length}</p>
            <p className="text-[10px] text-blue-700 font-bold mt-0.5">CRM opportunities</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Briefcase className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. TABS HEADER */}
      <div className="flex border-b border-slate-200 bg-white rounded-2xl p-1.5 shadow-xs gap-1.5 overflow-x-auto">
        {[
          { id: 'OVERVIEW', label: 'Overview', icon: Building2 },
          { id: 'SUBSCRIPTIONS', label: `Subscriptions (${historySubs.length})`, icon: CreditCard },
          { id: 'SOCIAL_MEDIA', label: `Social Media (${socialMediaHandlers.length})`, icon: Share2 },
          { id: 'INVOICES', label: `Billing & Invoices (${invoices.length})`, icon: FileText },
          { id: 'ACTIVITIES', label: `Activities (${activities.length})`, icon: Activity },
          { id: 'TASKS', label: `Tasks (${tasks.length})`, icon: CheckSquare },
          { id: 'VISITS', label: `Visits (${visits.length})`, icon: MapPin },
          { id: 'DEALS', label: `Deals (${deals.length})`, icon: Briefcase },
          { id: 'NOTES', label: 'Notes', icon: FileText },
          { id: 'HISTORY', label: 'Audit History', icon: History },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-[#23C45E] text-slate-950 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3b. SOCIAL MEDIA HANDLERS TAB */}
      {activeTab === 'SOCIAL_MEDIA' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <h3 className="text-lg font-black text-slate-900">Social Media Accounts & Handlers</h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                    {socialMediaHandlers.length} Linked Accounts
                  </span>
                </div>
                <p className="text-slate-500 text-xs font-medium">
                  Configured social media handles, assigned executive handlers, and active work campaigns for this customer.
                </p>
              </div>

              <Link
                href="/marketing/social-media"
                className="flex items-center gap-1.5 px-3.5 py-2 bg-[#23C45E] hover:bg-[#1AA14D] text-slate-950 rounded-xl text-xs font-black shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Manage Handlers Hub</span>
              </Link>
            </div>

            {isSocialMediaLoading ? (
              <div className="py-12 text-center text-slate-400 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-500" />
                <span className="text-xs font-bold">Loading social media handlers...</span>
              </div>
            ) : socialMediaHandlers.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <Share2 className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-sm font-black text-slate-800">No Social Media Handlers linked</p>
                <p className="text-xs text-slate-500">
                  No accounts or handlers have been assigned to this customer yet.
                </p>
                <div className="pt-2">
                  <Link
                    href="/marketing/social-media"
                    className="inline-flex items-center gap-1 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add First Handler</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {socialMediaHandlers.map((handler: SocialMediaHandlerItem) => (
                  <div
                    key={handler.id}
                    className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:shadow-xs transition-all space-y-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-2xs">
                          {handler.platform === 'INSTAGRAM' ? (
                            <Instagram className="w-5 h-5 text-pink-600" />
                          ) : handler.platform === 'FACEBOOK' ? (
                            <Facebook className="w-5 h-5 text-blue-600" />
                          ) : handler.platform === 'YOUTUBE' ? (
                            <Youtube className="w-5 h-5 text-red-600" />
                          ) : handler.platform === 'LINKEDIN' ? (
                            <Linkedin className="w-5 h-5 text-sky-600" />
                          ) : (
                            <Globe className="w-5 h-5 text-slate-600" />
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                            {handler.platform}
                          </p>
                          <h4 className="text-sm font-black text-slate-900 flex items-center gap-1">
                            {handler.accountName}
                            {handler.accountUrl && (
                              <a
                                href={handler.accountUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-slate-400 hover:text-emerald-600 transition-colors"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </h4>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          handler.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : handler.status === 'PAUSED'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {handler.status}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="text-slate-400 font-medium">Work Type:</span>
                        <span className="font-bold text-slate-800">{handler.workType || 'Content Posting'}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="text-slate-400 font-medium">Assigned Handler:</span>
                        <span className="font-bold text-slate-800">{handler.handlerName || 'Unassigned'}</span>
                      </div>
                      {handler.handlerPhone && (
                        <div className="flex items-center justify-between text-slate-600">
                          <span className="text-slate-400 font-medium">Handler Phone:</span>
                          <span className="font-bold text-slate-800">{handler.handlerPhone}</span>
                        </div>
                      )}
                      {handler.startDate && (
                        <div className="flex items-center justify-between text-slate-600">
                          <span className="text-slate-400 font-medium">Schedule:</span>
                          <span className="font-bold text-slate-800">
                            {new Date(handler.startDate).toLocaleDateString()}
                            {handler.endDate && ` → ${new Date(handler.endDate).toLocaleDateString()}`}
                          </span>
                        </div>
                      )}
                    </div>

                    {handler.notes && (
                      <p className="text-[11px] text-slate-500 bg-white p-2.5 rounded-xl border border-slate-200/60 line-clamp-2">
                        {handler.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. CURRENT SUBSCRIPTION CARD & LIFECYCLE MANAGEMENT */}
      {activeTab === 'SUBSCRIPTIONS' && (
        <div className="space-y-6">
          {/* CURRENT SUBSCRIPTION SECTION */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <h3 className="text-lg font-black text-slate-900">Current Subscription</h3>
                  {currentSub && getStatusBadge(currentSub.subscriptionStatus)}
                </div>
                <p className="text-slate-500 text-xs font-medium">
                  Active plan deliverables, validity cycle, pricing breakdown and admin controls
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() =>
                    setManualPlanModal({
                      isOpen: true,
                      planId: plansList[0]?.id || 1,
                      billingCycle: 'MONTHLY',
                      startDate: new Date().toISOString().split('T')[0],
                    })
                  }
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-[#23C45E] hover:bg-[#1AA14D] text-slate-950 rounded-xl text-xs font-black shadow-xs transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{currentSub ? 'Assign New Plan' : 'Activate Plan'}</span>
                </button>

                {currentSub && (
                  <>
                    <button
                      onClick={() =>
                        setChangePlanModal({
                          isOpen: true,
                          subscriptionId: currentSub.id,
                          currentPlanName: currentSub.planName,
                          newPlanId: plansList.find((p: any) => p.id !== currentSub.planId)?.id || plansList[0]?.id || 1,
                          billingCycle: currentSub.billingCycle || 'MONTHLY',
                        })
                      }
                      className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black transition-all cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Change Plan</span>
                    </button>

                    <button
                      onClick={() =>
                        setRenewModal({
                          isOpen: true,
                          subscriptionId: currentSub.id,
                          planName: currentSub.planName,
                          billingCycle: currentSub.billingCycle || 'MONTHLY',
                        })
                      }
                      className="flex items-center gap-1.5 px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-black transition-all cursor-pointer"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      <span>Renew</span>
                    </button>

                    {currentSub.subscriptionStatus !== 'ACTIVE' ? (
                      <button
                        onClick={() =>
                          setConfirmModal({
                            isOpen: true,
                            type: 'ACTIVATE',
                            subscriptionId: currentSub.id,
                            planName: currentSub.planName,
                          })
                        }
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-xs transition-all cursor-pointer"
                      >
                        <PlayCircle className="w-3.5 h-3.5" />
                        <span>{currentSub.subscriptionStatus === 'PENDING' ? 'Approve & Activate' : 'Activate'}</span>
                      </button>
                    ) : (
                      <button
                        onClick={() =>
                          setConfirmModal({
                            isOpen: true,
                            type: 'DEACTIVATE',
                            subscriptionId: currentSub.id,
                            planName: currentSub.planName,
                          })
                        }
                        className="flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black shadow-xs transition-all cursor-pointer"
                      >
                        <PowerOff className="w-3.5 h-3.5" />
                        <span>Deactivate</span>
                      </button>
                    )}

                    <button
                      onClick={() =>
                        setConfirmModal({
                          isOpen: true,
                          type: 'DELETE',
                          subscriptionId: currentSub.id,
                          planName: currentSub.planName,
                        })
                      }
                      className="flex items-center gap-1.5 px-2.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl text-xs font-black transition-all cursor-pointer"
                      title="Soft delete subscription"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {currentSub ? (
              <div className="space-y-6">
                {/* Top Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Plan & ID</span>
                    <p className="text-sm font-black text-slate-900 truncate">{currentSub.planName}</p>
                    <p className="text-[11px] font-medium text-slate-500">
                      ID: <span className="font-mono font-bold text-slate-700">{currentSub.subscriptionId}</span> •{' '}
                      <span className="font-bold text-emerald-600">{currentSub.planType}</span>
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Billing Period</span>
                    <p className="text-sm font-black text-slate-900">{currentSub.billingCycle}</p>
                    <p className="text-[11px] font-medium text-slate-500">
                      {currentSub.startDate ? new Date(currentSub.startDate).toLocaleDateString() : 'N/A'} →{' '}
                      <strong className="text-slate-800">
                        {currentSub.expiryDate ? new Date(currentSub.expiryDate).toLocaleDateString() : 'N/A'}
                      </strong>
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Financial Breakdown</span>
                    <p className="text-sm font-black text-slate-900">
                      ₹{Number(currentSub.totalAmount || 0).toLocaleString('en-IN')}{' '}
                      <span className="text-[11px] font-bold text-slate-400">(incl. 18% GST)</span>
                    </p>
                    <p className="text-[11px] font-medium text-slate-500">
                      Base: ₹{Number(currentSub.baseAmount || 0).toLocaleString('en-IN')} + GST: ₹
                      {Number(currentSub.gst || 0).toLocaleString('en-IN')}
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Payment & Gateway</span>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          currentSub.paymentStatus === 'PAID' || currentSub.paymentStatus === 'SUCCESS'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {currentSub.paymentStatus || 'PAID'}
                      </span>
                      <span className="text-xs font-bold text-slate-700">{currentSub.paymentMethod || 'RAZORPAY'}</span>
                    </div>
                    <p className="text-[10px] font-mono text-slate-500 truncate">
                      {currentSub.orderId ? `Order: ${currentSub.orderId}` : `ID: ${currentSub.paymentId || 'TXN-DIRECT'}`}
                    </p>
                  </div>
                </div>

                {/* Plan Quotas & Deliverables Snapshot */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                      Plan Deliverables & Quotas (Purchased Snapshot)
                    </h4>
                    <span className="text-xs font-bold text-slate-500">Included Users: {currentSub.includedUsers}</span>
                  </div>

                  {currentSub.quotas && currentSub.quotas.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {currentSub.quotas.map((q: any, idx: number) => (
                        <div key={idx} className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/60 space-y-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-slate-800">{q.name}</span>
                            <span className="font-black text-[#23C45E]">{q.total} Total</span>
                          </div>
                          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-[#23C45E] h-full rounded-full transition-all"
                              style={{ width: `${Math.min(100, Math.max(15, (q.remaining / (q.total || 1)) * 100))}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                            <span>Used: {q.used || 0}</span>
                            <span>Remaining: {q.remaining || q.total}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-50 rounded-2xl text-xs text-slate-500 font-medium">
                      Standard entitlement features: Leads ({currentSub.leadLimit}), Users ({currentSub.userLimit}), Storage (
                      {(currentSub.storageLimit / (1024 * 1024 * 1024)).toFixed(1)} GB).
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                <ShieldCheck className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-sm font-bold text-slate-700">No Active Subscription Found</p>
                <p className="text-xs text-slate-400">
                  This customer does not currently have an active plan. Previous or assigned plans will appear in Subscription History below.
                </p>
              </div>
            )}
          </div>

          {/* SUBSCRIPTION HISTORY SECTION */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="space-y-0.5">
                <h3 className="text-base font-black text-slate-900">Subscription History</h3>
                <p className="text-slate-500 text-xs font-medium">Chronological record of all customer subscriptions (newest first)</p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 bg-slate-100 rounded-lg text-slate-600">
                {historySubs.length} Records
              </span>
            </div>

            {historySubs.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center font-bold">No previous subscriptions recorded.</p>
            ) : (
              <div className="space-y-3">
                {historySubs.map((sub: any) => (
                  <div
                    key={sub.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      sub.isCurrent && sub.subscriptionStatus === 'ACTIVE'
                        ? 'bg-emerald-50/40 border-emerald-200'
                        : 'bg-slate-50 border-slate-100 hover:border-slate-200'
                    } flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-black text-slate-900 text-sm">{sub.planName}</h4>
                        {sub.isCurrent && sub.subscriptionStatus === 'ACTIVE' && (
                          <span className="px-2 py-0.5 bg-[#23C45E] text-slate-950 text-[10px] font-black rounded">
                            CURRENT
                          </span>
                        )}
                        {getStatusBadge(sub.subscriptionStatus)}
                      </div>
                      <p className="text-slate-500 text-[11px] font-medium">
                        ID: <strong className="text-slate-700">{sub.subscriptionId}</strong> •{' '}
                        {sub.startDate ? new Date(sub.startDate).toLocaleDateString() : 'N/A'} →{' '}
                        <strong className="text-slate-700">
                          {sub.expiryDate ? new Date(sub.expiryDate).toLocaleDateString() : 'N/A'}
                        </strong>{' '}
                        • {sub.billingCycle}
                      </p>
                      {sub.quotas && sub.quotas.length > 0 && (
                        <p className="text-[11px] text-slate-400">
                          Quotas: {sub.quotas.map((q: any) => `${q.name} (${q.total})`).join(', ')}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <p className="font-black text-slate-900 text-sm">
                          ₹{Number(sub.totalAmount || 0).toLocaleString('en-IN')}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {sub.paymentStatus || 'PAID'} • {sub.paymentMethod || 'RAZORPAY'}
                        </p>
                      </div>

                      {/* Admin Quick Action in History */}
                      {sub.subscriptionStatus !== 'ACTIVE' && (
                        <button
                          onClick={() =>
                            setConfirmModal({
                              isOpen: true,
                              type: 'ACTIVATE',
                              subscriptionId: sub.id,
                              planName: sub.planName,
                            })
                          }
                          className="px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold rounded-xl text-[11px] transition-colors cursor-pointer"
                        >
                          Activate
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4b. BILLING & INVOICES TAB */}
      {activeTab === 'INVOICES' && (
        <div className="space-y-6">
          {/* 1. ADVANCE PAYMENT & INSTALLMENT SCHEDULE CARD */}
          {installmentSummary && (
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-lg font-black text-slate-900">Advance Payment & Installment Renewal Schedule</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                      installmentSummary.isFullyPaid
                        ? 'bg-emerald-100 text-emerald-800'
                        : (installmentSummary.isRenewalFailed
                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                        : (installmentSummary.isInBuffer
                        ? 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse'
                        : (installmentSummary.isAccessAllowed
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-rose-100 text-rose-800')))
                    }`}>
                      {installmentSummary.isFullyPaid
                        ? 'FULLY PAID'
                        : (installmentSummary.isRenewalFailed
                        ? 'RENEWAL FAILED'
                        : (installmentSummary.isInBuffer
                        ? 'IN BUFFER PERIOD'
                        : (installmentSummary.isAccessAllowed ? 'ACTIVE' : 'OVERDUE')))}
                    </span>
                  </div>
                  <p className="text-slate-500 text-xs font-medium">
                    {installmentSummary.statusMessage || 'Multi-installment plan tracking with 3-day grace buffer.'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {installmentSummary.isRenewalFailed && (
                    <button
                      onClick={() => {
                        if (confirm(`Start a new plan for this client at full plan price (₹${installmentSummary.amountRequiredToRestart.toLocaleString('en-IN')})?`)) {
                          startNewPlanMutation.mutate();
                        }
                      }}
                      disabled={startNewPlanMutation.isPending}
                      className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Start New Plan (₹{installmentSummary.amountRequiredToRestart.toLocaleString('en-IN')})</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      refetchInstallments();
                      refetchInvoices();
                    }}
                    disabled={isInstallmentsLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isInstallmentsLoading ? 'animate-spin' : ''}`} />
                    <span>Refresh Schedule</span>
                  </button>
                </div>
              </div>

              {/* RENEWAL FAILED NOTICE BANNER */}
              {installmentSummary.isRenewalFailed && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-rose-900 font-black text-sm">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Renewal Failed — Previous Installment Plan Expired</span>
                  </div>
                  <p className="text-rose-800 text-xs font-medium leading-relaxed">
                    {installmentSummary.failureMessage ||
                      'Your installment plan renewal period has expired. You failed to renew your plan within the allowed buffer period. To continue using our services, you must start a new plan.'}
                  </p>
                  <p className="text-rose-700 text-[11px] font-semibold bg-white/70 p-2.5 rounded-xl border border-rose-200/60">
                    <span className="font-bold">Terms & Conditions: </span>
                    {installmentSummary.termsMessage ||
                      'Under our Terms & Conditions, after the renewal period expires, the previous installment plan cannot be continued and a new plan must be purchased at the applicable full plan price.'}
                  </p>
                </div>
              )}

              {/* BUFFER PERIOD WARNING BANNER */}
              {installmentSummary.isInBuffer && !installmentSummary.isRenewalFailed && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-amber-900 font-black text-sm">
                    <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Plan Renewal Due — Buffer Period Active ({installmentSummary.bufferRemainingDays} {installmentSummary.bufferRemainingDays === 1 ? 'Day' : 'Days'} Left)</span>
                  </div>
                  <p className="text-amber-800 text-xs font-medium leading-relaxed">
                    {installmentSummary.bufferMessage ||
                      'Your plan renewal is pending. You have 3 days to renew your plan. If you do not renew within the buffer period, your installment plan will expire and you will need to start a new plan at the applicable full plan price.'}
                  </p>
                </div>
              )}

              {/* Installment Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                  <span className="text-xs font-bold text-slate-400">
                    {installmentSummary.isRenewalFailed ? 'Original Plan Value' : 'Total Plan Value'}
                  </span>
                  <div className="text-xl font-black text-slate-900">
                    ₹{(installmentSummary.originalPlanValue || installmentSummary.totalPlanAmount || 0).toLocaleString('en-IN')}
                  </div>
                  <div className="text-[11px] text-slate-500 font-semibold">{installmentSummary.planName}</div>
                </div>

                <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-xs font-bold text-slate-600">
                    {installmentSummary.isRenewalFailed ? 'Previous Payment (Historical)' : 'Total Paid Amount'}
                  </span>
                  <div className="text-xl font-black text-slate-800">
                    ₹{(installmentSummary.historicalPaidAmount || installmentSummary.totalPaidAmount || 0).toLocaleString('en-IN')}
                  </div>
                  <div className="text-[11px] text-slate-500 font-semibold">
                    {installmentSummary.isRenewalFailed
                      ? 'Historical audit record only'
                      : `${installmentSummary.installments?.filter((i: any) => i.status === 'PAID').length} of ${installmentSummary.installments?.length || 3} Paid`}
                  </div>
                </div>

                <div className={`p-4 rounded-2xl border space-y-1 ${
                  installmentSummary.isRenewalFailed
                    ? 'bg-emerald-50 border-emerald-200'
                    : 'bg-rose-50/60 border-rose-100'
                }`}>
                  <span className={`text-xs font-bold ${installmentSummary.isRenewalFailed ? 'text-emerald-700' : 'text-rose-600'}`}>
                    {installmentSummary.isRenewalFailed ? 'Required to Start Again' : 'Total Outstanding'}
                  </span>
                  <div className={`text-xl font-black ${installmentSummary.isRenewalFailed ? 'text-emerald-950' : 'text-rose-950'}`}>
                    ₹{(installmentSummary.isRenewalFailed ? installmentSummary.amountRequiredToRestart : installmentSummary.outstandingAmount || 0).toLocaleString('en-IN')}
                  </div>
                  <div className={`text-[11px] font-semibold ${installmentSummary.isRenewalFailed ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {installmentSummary.isRenewalFailed ? 'Full Plan Price (New Plan)' : (installmentSummary.outstandingAmount === 0 ? 'Fully Settled' : 'Balance to settle')}
                  </div>
                </div>

                <div className={`p-4 rounded-2xl border space-y-1 ${
                  installmentSummary.isRenewalFailed
                    ? 'bg-rose-50 border-rose-200'
                    : (installmentSummary.isInBuffer
                    ? 'bg-amber-50 border-amber-200'
                    : 'bg-slate-50 border-slate-100')
                }`}>
                  <span className={`text-xs font-bold ${
                    installmentSummary.isRenewalFailed
                      ? 'text-rose-700'
                      : (installmentSummary.isInBuffer ? 'text-amber-700' : 'text-slate-400')
                  }`}>
                    {installmentSummary.isRenewalFailed
                      ? 'Plan Status'
                      : `Buffer Period (${installmentSummary.bufferDays || 3} Days)`}
                  </span>
                  <div className="text-xl font-black text-slate-900">
                    {installmentSummary.isRenewalFailed
                      ? 'Renewal Failed'
                      : (installmentSummary.isInBuffer
                      ? `${installmentSummary.bufferRemainingDays} ${installmentSummary.bufferRemainingDays === 1 ? 'Day' : 'Days'} Left`
                      : `${installmentSummary.bufferDays || 3} Days`)}
                  </div>
                  <div className={`text-[11px] font-semibold ${
                    installmentSummary.isRenewalFailed
                      ? 'text-rose-700'
                      : (installmentSummary.isInBuffer ? 'text-amber-700' : 'text-slate-500')
                  }`}>
                    {installmentSummary.isRenewalFailed
                      ? 'Old installment plan closed'
                      : (installmentSummary.isInBuffer ? 'Plan active during buffer' : 'Standard renewal grace period')}
                  </div>
                </div>
              </div>

              {/* Installments Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-100">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-black uppercase tracking-wider text-slate-500">
                      <th className="py-3 px-4">Installment #</th>
                      <th className="py-3 px-4">Title / Terms</th>
                      <th className="py-3 px-4 text-right">Base Amount</th>
                      <th className="py-3 px-4 text-right">GST (18%)</th>
                      <th className="py-3 px-4 text-right">Total (₹)</th>
                      <th className="py-3 px-4">Due Date</th>
                      <th className="py-3 px-4">Expiry Date</th>
                      <th className="py-3 px-4">Buffer End Date</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-medium">
                    {installmentSummary.installments?.map((inst: any) => {
                      const isPaid = inst.status === 'PAID';
                      const isBuffer = inst.displayStatus === 'IN_BUFFER' || inst.isInBuffer;
                      const isDue = inst.status === 'DUE' || isBuffer;
                      const isOverdue = inst.displayStatus === 'OVERDUE';

                      return (
                        <tr key={inst.id} className={`hover:bg-slate-50/80 transition-colors ${
                          isBuffer ? 'bg-amber-50/30' : (isDue ? 'bg-blue-50/20' : '')
                        }`}>
                          <td className="py-3 px-4 font-mono font-bold text-slate-900">
                            #{inst.installmentNumber}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">{inst.title}</div>
                            {inst.notes && (
                              <div className="text-[10px] text-slate-400 truncate max-w-[200px]" title={inst.notes}>
                                {inst.notes}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right text-slate-600 font-semibold">
                            ₹{Number(inst.amount || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-4 text-right text-slate-500 font-semibold">
                            ₹{Number(inst.taxAmount || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-4 text-right font-black text-slate-900">
                            ₹{Number(inst.totalAmount || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                            {inst.dueDate ? new Date(inst.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                          </td>
                          <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                            {inst.expiryDate ? new Date(inst.expiryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap font-bold text-amber-900">
                            {inst.bufferEndDate ? new Date(inst.bufferEndDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black inline-flex items-center gap-1 ${
                              isPaid
                                ? 'bg-emerald-100 text-emerald-800'
                                : (isBuffer
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : (isOverdue
                                ? 'bg-rose-100 text-rose-800'
                                : (inst.status === 'DUE'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-slate-100 text-slate-600')))
                            }`}>
                              {isPaid && <CheckCircle2 className="w-3 h-3" />}
                              {isBuffer ? 'IN BUFFER (DUE)' : (isPaid ? 'PAID' : (isOverdue ? 'OVERDUE' : (inst.status === 'DUE' ? 'DUE' : 'UPCOMING')))}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            {isPaid ? (
                              <span className="text-[11px] text-slate-400 font-semibold">
                                Settled {inst.paidAt ? new Date(inst.paidAt).toLocaleDateString('en-IN') : ''}
                              </span>
                            ) : (
                              <button
                                onClick={() => {
                                  if (confirm(`Confirm manual payment of ₹${Number(inst.totalAmount).toLocaleString('en-IN')} for Installment #${inst.installmentNumber}?`)) {
                                    recordInstallmentPaymentMutation.mutate(inst.id);
                                  }
                                }}
                                disabled={recordInstallmentPaymentMutation.isPending}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Check className="w-3 h-3" />
                                <span>Confirm Payment</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 2. OFFICIAL TAX INVOICES TABLE CARD */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <h3 className="text-lg font-black text-slate-900">Client Invoices & Receipts</h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-black">
                    {invoices.length} {invoices.length === 1 ? 'Record' : 'Records'}
                  </span>
                </div>
                <p className="text-slate-500 text-xs font-medium">
                  Official GST tax invoices, payment breakdowns, and downloadable invoice PDFs.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => refetchInvoices()}
                  disabled={isInvoicesLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isInvoicesLoading ? 'animate-spin' : ''}`} />
                  <span>Refresh Invoices</span>
                </button>
              </div>
            </div>

            {/* Error State */}
            {isInvoicesError && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-rose-800 text-xs">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>
                    Failed to load client invoices:{' '}
                    {getErrorMessage(invoicesError) || 'Network/Server connection error'}
                  </span>
                </div>
                <button
                  onClick={() => refetchInvoices()}
                  className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Loading State */}
            {isInvoicesLoading && !isInvoicesError && (
              <div className="py-16 text-center text-slate-400 space-y-2">
                <RefreshCw className="w-7 h-7 animate-spin mx-auto text-[#23C45E]" />
                <p className="text-xs font-bold">Loading client invoice & billing records...</p>
              </div>
            )}

            {/* Invoices Table */}
            {!isInvoicesLoading && !isInvoicesError && (
              <div className="overflow-x-auto rounded-2xl border border-slate-100">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-black uppercase tracking-wider text-slate-500">
                      <th className="py-3 px-4">Invoice #</th>
                      <th className="py-3 px-4">Invoice Date</th>
                      <th className="py-3 px-4">Plan / Order</th>
                      <th className="py-3 px-4 text-right">Base Amount</th>
                      <th className="py-3 px-4 text-right">GST (18%)</th>
                      <th className="py-3 px-4 text-right">Total Amount</th>
                      <th className="py-3 px-4 text-center">Payment Status</th>
                      <th className="py-3 px-4 text-center">Payment Mode</th>
                      <th className="py-3 px-4">Due Date</th>
                      <th className="py-3 px-4">Payment Date</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {invoices.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="py-12 text-center text-slate-400">
                          <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                          <p className="font-bold text-slate-600">No invoices found for this client</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            When subscriptions are activated or payments are processed, tax invoices will appear here.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      invoices.map((inv: any) => {
                        const invNumber = inv.invoiceNumber || inv.invoiceNo || `INV-${inv.id}`;
                        const baseAmt = Number(inv.subTotal || 0);
                        const taxAmt = Number(inv.taxAmount || inv.tax || 0);
                        const totalAmt = Number(inv.totalAmount || inv.total || 0);
                        const isPaid = (inv.status || inv.paymentStatus) === 'PAID';

                        return (
                          <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-4">
                              <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-xs">
                                {invNumber}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-600 font-medium whitespace-nowrap">
                              {inv.issueDate || inv.invoiceDate
                                ? new Date(inv.issueDate || inv.invoiceDate).toLocaleDateString('en-IN', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                  })
                                : 'N/A'}
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-900 max-w-[200px] truncate" title={inv.planName || inv.notes}>
                                {inv.planName || 'Subscription Order'}
                              </div>
                              {inv.notes && (
                                <div className="text-[10px] text-slate-400 truncate max-w-[200px]" title={inv.notes}>
                                  {inv.notes}
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right font-semibold text-slate-700">
                              ₹{baseAmt.toLocaleString('en-IN')}
                            </td>
                            <td className="py-3 px-4 text-right font-semibold text-slate-500">
                              ₹{taxAmt.toLocaleString('en-IN')}
                            </td>
                            <td className="py-3 px-4 text-right font-black text-slate-900">
                              ₹{totalAmt.toLocaleString('en-IN')}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span
                                className={`px-2.5 py-1 rounded-full text-[10px] font-black inline-flex items-center gap-1 ${
                                  isPaid
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : (inv.status === 'PENDING'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-slate-100 text-slate-700')
                                }`}
                              >
                                {isPaid && <CheckCircle2 className="w-3 h-3" />}
                                {inv.status || inv.paymentStatus || 'PAID'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[10px] uppercase">
                                {inv.paymentMode || 'RAZORPAY'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                              {inv.dueDate
                                ? new Date(inv.dueDate).toLocaleDateString('en-IN', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                  })
                                : 'N/A'}
                            </td>
                            <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                              {inv.paymentDate || (isPaid && inv.issueDate)
                                ? new Date(inv.paymentDate || inv.issueDate).toLocaleDateString('en-IN', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                  })
                                : '-'}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => handleDownloadInvoice(inv)}
                                className="p-1.5 text-slate-600 hover:text-slate-950 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1 text-xs font-bold"
                                title="Download Invoice PDF"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">PDF</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. OTHER TABS (OVERVIEW, ACTIVITIES, TASKS, VISITS, DEALS, NOTES, HISTORY) */}
      {activeTab === 'OVERVIEW' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-base font-black text-slate-900">Customer & Contact Information</h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-400 font-bold">Customer Name</span>
                <span className="text-slate-900 font-black">{customer?.name}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-400 font-bold">Company Legal Name</span>
                <span className="text-slate-900 font-bold">{customer?.companyName || customer?.company}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-400 font-bold">Email Address</span>
                <span className="text-slate-900 font-bold">{customer?.email || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-400 font-bold">Phone</span>
                <span className="text-slate-900 font-bold">{customer?.phone || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-400 font-bold">Alternate Phone</span>
                <span className="text-slate-900 font-bold">{customer?.alternatePhone || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-400 font-bold">Address</span>
                <span className="text-slate-900 font-bold">
                  {customer?.address || 'N/A'}, {customer?.city || ''} {customer?.pincode ? `- ${customer.pincode}` : ''}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-400 font-bold">State & Country</span>
                <span className="text-slate-900 font-bold">
                  {customer?.state || 'Maharashtra'}, {customer?.country || 'India'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-base font-black text-slate-900">Account Classification & Assignment</h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-400 font-bold">Customer Type</span>
                <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 rounded-md font-bold text-[10px]">
                  {customer?.customerType || 'ENTERPRISE'}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-400 font-bold">Industry Sector</span>
                <span className="text-slate-900 font-bold">{customer?.industry || 'Information Technology'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-400 font-bold">Lead Source</span>
                <span className="text-slate-900 font-bold">{customer?.source || 'APP_REGISTRATION'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-400 font-bold">Assigned Relationship Manager</span>
                <span className="text-emerald-600 font-black">{customer?.assignedEmployee || 'Rahul Sharma'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-400 font-bold">Department</span>
                <span className="text-slate-900 font-bold">{customer?.department || 'Sales & BD'}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-400 font-bold">Account Created Date</span>
                <span className="text-slate-900 font-bold">
                  {customer?.createdAt ? new Date(customer.createdAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'ACTIVITIES' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="font-black text-slate-900 text-base">Activity Timeline & Audit History</h3>
          {activities.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center font-bold">No recorded activity history.</p>
          ) : (
            <div className="space-y-3">
              {activities.map((act: any) => (
                <div key={act.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3 text-xs">
                  <Activity className="w-4 h-4 text-[#23C45E] mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-900">{act.action}</span>
                      <span className="text-slate-400 text-[11px]">
                        {act.createdAt ? new Date(act.createdAt).toLocaleString() : 'Recent'}
                      </span>
                    </div>
                    <p className="text-slate-600 font-medium mt-1">{act.description || act.summary || 'Logged action.'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'TASKS' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="font-black text-slate-900 text-base">Allocated Tasks</h3>
          {tasks.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center font-bold">No tasks assigned for this customer.</p>
          ) : (
            <div className="space-y-3">
              {tasks.map((t: any) => (
                <div key={t.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-900 text-sm">{t.title}</h4>
                    <p className="text-slate-400 text-[11px]">
                      Due: {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'N/A'} • Assigned to:{' '}
                      {t.assignedTo?.firstName || 'Unassigned'}
                    </p>
                  </div>

                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                    {t.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'VISITS' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="font-black text-slate-900 text-base">Logged Client Visits</h3>
          {visits.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center font-bold">No visits recorded for this customer.</p>
          ) : (
            <div className="space-y-3">
              {visits.map((v: any) => (
                <div key={v.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-900 text-sm">{v.purpose}</h4>
                    <p className="text-slate-400 text-[11px]">
                      Location: {v.location} • Representative: {v.employee?.firstName || 'Employee'}
                    </p>
                  </div>

                  <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-bold text-[10px]">
                    {v.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'DEALS' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="font-black text-slate-900 text-base">Sales Pipeline Deals</h3>
          {deals.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center font-bold">No deals in pipeline for this customer.</p>
          ) : (
            <div className="space-y-3">
              {deals.map((d: any) => (
                <div key={d.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-900 text-sm">{d.title}</h4>
                    <p className="text-slate-400 text-[11px]">
                      Probability: {d.probability}% • Owner: {d.assignedTo?.firstName || 'Sales Rep'}
                    </p>
                  </div>

                  <span className="font-black text-slate-900 text-sm">₹{Number(d.amount).toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'NOTES' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="font-black text-slate-900 text-base">Customer Notes & Instructions</h3>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs leading-relaxed text-slate-700 font-medium">
            {customer?.notes || 'No custom notes provided for this customer.'}
          </div>
        </div>
      )}

      {activeTab === 'HISTORY' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="font-black text-slate-900 text-base">Customer Account Audit Trail</h3>
          <div className="space-y-2 text-xs text-slate-600">
            <div className="p-3 bg-slate-50 rounded-xl flex justify-between">
              <span>Account Created:</span>
              <span className="font-bold text-slate-900">
                {customer?.createdAt ? new Date(customer.createdAt).toLocaleString() : 'N/A'}
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl flex justify-between">
              <span>Last Modified:</span>
              <span className="font-bold text-slate-900">
                {customer?.updatedAt ? new Date(customer.updatedAt).toLocaleString() : 'Recent'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 6. CONFIRMATION MODAL DIALOG */}
      {confirmModal && confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in-0 duration-150">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                  confirmModal.type === 'ACTIVATE'
                    ? 'bg-emerald-50 text-emerald-600'
                    : confirmModal.type === 'DEACTIVATE'
                    ? 'bg-amber-50 text-amber-600'
                    : 'bg-rose-50 text-rose-600'
                }`}
              >
                {confirmModal.type === 'ACTIVATE' ? (
                  <PlayCircle className="w-6 h-6" />
                ) : confirmModal.type === 'DEACTIVATE' ? (
                  <PowerOff className="w-6 h-6" />
                ) : (
                  <AlertTriangle className="w-6 h-6" />
                )}
              </div>

              <div>
                <h3 className="text-base font-black text-slate-900">
                  {confirmModal.type === 'ACTIVATE' && 'Activate Subscription?'}
                  {confirmModal.type === 'DEACTIVATE' && 'Deactivate Subscription?'}
                  {confirmModal.type === 'DELETE' && 'Delete Subscription?'}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {confirmModal.type === 'ACTIVATE' &&
                    `This will set ${confirmModal.planName} to ACTIVE and configure validity. Any other active plan will be transitioned.`}
                  {confirmModal.type === 'DEACTIVATE' &&
                    `This will deactivate the customer's current subscription (${confirmModal.planName}). Historical data remains safe.`}
                  {confirmModal.type === 'DELETE' &&
                    `This action will soft-delete the subscription record. Payment histories will remain preserved for audit.`}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => {
                  if (confirmModal.type === 'ACTIVATE') {
                    activateMutation.mutate(confirmModal.subscriptionId);
                  } else if (confirmModal.type === 'DEACTIVATE') {
                    deactivateMutation.mutate(confirmModal.subscriptionId);
                  } else if (confirmModal.type === 'DELETE') {
                    deleteMutation.mutate(confirmModal.subscriptionId);
                  }
                }}
                disabled={
                  activateMutation.isPending || deactivateMutation.isPending || deleteMutation.isPending
                }
                className={`px-5 py-2.5 rounded-xl text-xs font-black text-white transition-all shadow-xs cursor-pointer flex items-center gap-2 ${
                  confirmModal.type === 'ACTIVATE'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : confirmModal.type === 'DEACTIVATE'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {(activateMutation.isPending || deactivateMutation.isPending || deleteMutation.isPending) && (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                )}
                <span>
                  {confirmModal.type === 'ACTIVATE' && 'Confirm Activation'}
                  {confirmModal.type === 'DEACTIVATE' && 'Confirm Deactivation'}
                  {confirmModal.type === 'DELETE' && 'Confirm Delete'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. MANUAL ACTIVATE PLAN MODAL */}
      {manualPlanModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in-0 duration-150">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Activate Plan</h3>
                  <p className="text-xs text-slate-500 font-medium">Assign a new active subscription</p>
                </div>
              </div>
              <button
                onClick={() => setManualPlanModal((p) => ({ ...p, isOpen: false }))}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Select Plan */}
              <div>
                <label className="block font-black text-slate-700 uppercase tracking-wider text-[10px] mb-1.5">
                  Select Plan *
                </label>
                <select
                  value={manualPlanModal.planId}
                  onChange={(e) => setManualPlanModal((p) => ({ ...p, planId: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {plansList.map((plan: any) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} ({plan.code}) — ₹{Number(plan.monthlyPrice).toLocaleString('en-IN')}/mo
                    </option>
                  ))}
                </select>
              </div>

              {/* Billing Cycle */}
              <div>
                <label className="block font-black text-slate-700 uppercase tracking-wider text-[10px] mb-1.5">
                  Billing Cycle *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setManualPlanModal((p) => ({ ...p, billingCycle: 'MONTHLY' }))}
                    className={`py-2 px-3 rounded-xl font-black text-center transition-all cursor-pointer border ${
                      manualPlanModal.billingCycle === 'MONTHLY'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-2xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    Monthly (1 Mo)
                  </button>
                  <button
                    type="button"
                    onClick={() => setManualPlanModal((p) => ({ ...p, billingCycle: 'YEARLY' }))}
                    className={`py-2 px-3 rounded-xl font-black text-center transition-all cursor-pointer border ${
                      manualPlanModal.billingCycle === 'YEARLY'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-2xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    Yearly (12 Mos)
                  </button>
                </div>
              </div>

              {/* Start Date */}
              <div>
                <label className="block font-black text-slate-700 uppercase tracking-wider text-[10px] mb-1.5">
                  Start Date *
                </label>
                <input
                  type="date"
                  value={manualPlanModal.startDate}
                  onChange={(e) => setManualPlanModal((p) => ({ ...p, startDate: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Price Calculation Summary */}
              {(() => {
                const selectedPlan = plansList.find((p: any) => String(p.id) === String(manualPlanModal.planId)) || plansList[0];
                const base = selectedPlan
                  ? manualPlanModal.billingCycle === 'YEARLY'
                    ? Number(selectedPlan.yearlyPrice)
                    : Number(selectedPlan.monthlyPrice)
                  : 0;
                const gst = Math.round(base * 0.18);
                const total = base + gst;

                return (
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5">
                    <div className="flex justify-between text-slate-600 font-medium">
                      <span>Base Plan Price:</span>
                      <span className="font-bold text-slate-900">₹{base.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-slate-600 font-medium">
                      <span>GST (18%):</span>
                      <span className="font-bold text-slate-900">₹{gst.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between pt-1.5 border-t border-slate-200 text-sm font-black text-slate-900">
                      <span>Total Amount:</span>
                      <span className="text-[#23C45E]">₹{total.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setManualPlanModal((p) => ({ ...p, isOpen: false }))}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const pid = manualPlanModal.planId || plansList[0]?.id;
                  if (!pid) {
                    toast.error('Please select a plan');
                    return;
                  }
                  createSubMutation.mutate({
                    planId: pid,
                    billingCycle: manualPlanModal.billingCycle,
                    startDate: manualPlanModal.startDate,
                  });
                }}
                disabled={createSubMutation.isPending}
                className="px-5 py-2.5 bg-[#23C45E] hover:bg-[#1AA14D] text-slate-950 rounded-xl text-xs font-black transition-all shadow-xs cursor-pointer flex items-center gap-2"
              >
                {createSubMutation.isPending && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Activate Plan</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. CHANGE PLAN MODAL */}
      {changePlanModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in-0 duration-150">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">
                  <RefreshCw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Change Plan</h3>
                  <p className="text-xs text-slate-500 font-medium">Switch {changePlanModal.currentPlanName} to a new tier</p>
                </div>
              </div>
              <button
                onClick={() => setChangePlanModal((p) => ({ ...p, isOpen: false }))}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-black text-slate-700 uppercase tracking-wider text-[10px] mb-1.5">
                  Select New Plan *
                </label>
                <select
                  value={changePlanModal.newPlanId}
                  onChange={(e) => setChangePlanModal((p) => ({ ...p, newPlanId: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {plansList.map((plan: any) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} ({plan.code}) — ₹{Number(plan.monthlyPrice).toLocaleString('en-IN')}/mo
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-black text-slate-700 uppercase tracking-wider text-[10px] mb-1.5">
                  Billing Cycle *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setChangePlanModal((p) => ({ ...p, billingCycle: 'MONTHLY' }))}
                    className={`py-2 px-3 rounded-xl font-black text-center transition-all cursor-pointer border ${
                      changePlanModal.billingCycle === 'MONTHLY'
                        ? 'bg-blue-50 border-blue-300 text-blue-800 shadow-2xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    type="button"
                    onClick={() => setChangePlanModal((p) => ({ ...p, billingCycle: 'YEARLY' }))}
                    className={`py-2 px-3 rounded-xl font-black text-center transition-all cursor-pointer border ${
                      changePlanModal.billingCycle === 'YEARLY'
                        ? 'bg-blue-50 border-blue-300 text-blue-800 shadow-2xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    Yearly
                  </button>
                </div>
              </div>

              {/* Price Calculation Summary */}
              {(() => {
                const selectedPlan = plansList.find((p: any) => String(p.id) === String(changePlanModal.newPlanId)) || plansList[0];
                const base = selectedPlan
                  ? changePlanModal.billingCycle === 'YEARLY'
                    ? Number(selectedPlan.yearlyPrice)
                    : Number(selectedPlan.monthlyPrice)
                  : 0;
                const gst = Math.round(base * 0.18);
                const total = base + gst;

                return (
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5">
                    <div className="flex justify-between text-slate-600 font-medium">
                      <span>New Base Price:</span>
                      <span className="font-bold text-slate-900">₹{base.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-slate-600 font-medium">
                      <span>GST (18%):</span>
                      <span className="font-bold text-slate-900">₹{gst.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between pt-1.5 border-t border-slate-200 text-sm font-black text-slate-900">
                      <span>Total Amount:</span>
                      <span className="text-blue-600">₹{total.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setChangePlanModal((p) => ({ ...p, isOpen: false }))}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const pid = changePlanModal.newPlanId || plansList[0]?.id;
                  if (!pid) {
                    toast.error('Please select a plan');
                    return;
                  }
                  changePlanMutation.mutate({
                    subscriptionId: changePlanModal.subscriptionId,
                    payload: {
                      newPlanId: pid,
                      billingCycle: changePlanModal.billingCycle,
                    },
                  });
                }}
                disabled={changePlanMutation.isPending}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition-all shadow-xs cursor-pointer flex items-center gap-2"
              >
                {changePlanMutation.isPending && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirm Plan Change</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. RENEW SUBSCRIPTION MODAL */}
      {renewModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in-0 duration-150">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-black">
                  <RotateCw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Renew Subscription</h3>
                  <p className="text-xs text-slate-500 font-medium">Extend validity for {renewModal.planName}</p>
                </div>
              </div>
              <button
                onClick={() => setRenewModal((p) => ({ ...p, isOpen: false }))}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-black text-slate-700 uppercase tracking-wider text-[10px] mb-1.5">
                  Renewal Billing Cycle *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRenewModal((p) => ({ ...p, billingCycle: 'MONTHLY' }))}
                    className={`py-2 px-3 rounded-xl font-black text-center transition-all cursor-pointer border ${
                      renewModal.billingCycle === 'MONTHLY'
                        ? 'bg-purple-50 border-purple-300 text-purple-800 shadow-2xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    Monthly (+1 Month)
                  </button>
                  <button
                    type="button"
                    onClick={() => setRenewModal((p) => ({ ...p, billingCycle: 'YEARLY' }))}
                    className={`py-2 px-3 rounded-xl font-black text-center transition-all cursor-pointer border ${
                      renewModal.billingCycle === 'YEARLY'
                        ? 'bg-purple-50 border-purple-300 text-purple-800 shadow-2xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    Yearly (+12 Months)
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setRenewModal((p) => ({ ...p, isOpen: false }))}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  renewMutation.mutate({
                    subscriptionId: renewModal.subscriptionId,
                    payload: {
                      billingCycle: renewModal.billingCycle,
                    },
                  });
                }}
                disabled={renewMutation.isPending}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black transition-all shadow-xs cursor-pointer flex items-center gap-2"
              >
                {renewMutation.isPending && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirm Renewal</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
