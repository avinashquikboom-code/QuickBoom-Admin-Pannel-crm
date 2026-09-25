'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Coins,
  Sparkles,
  Search,
  PlusCircle,
  MinusCircle,
  TrendingUp,
  TrendingDown,
  History,
  Building2,
  Mail,
  Phone,
  CheckCircle2,
  RefreshCw,
  X,
  ExternalLink,
  ChevronRight,
  User,
  Users,
  CreditCard,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { AdminPageHeader, AdminButton } from '@/components/admin';
import api from '@/lib/api';
import { AiSocialAdminService, AiServiceConfigItem } from '@/lib/services/ai-social.service';

interface CustomerListItem {
  id: number;
  customerId?: string;
  name: string;
  companyName?: string;
  email?: string;
  phone?: string;
  isActive?: boolean;
  aiCredits?: number;
  aiWallet?: {
    balance: number;
    totalEarned: number;
    totalSpent: number;
  };
}

interface AiCreditTransaction {
  id: number;
  walletId: number;
  customerId: number;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  type: string;
  serviceCode?: string | null;
  generationId?: number | null;
  notes?: string | null;
  reason?: string;
  adminId?: number | null;
  createdAt: string;
}

interface CustomerAiCreditsData {
  customer: {
    id: number;
    name: string;
    email?: string;
    phone?: string;
    companyName?: string;
  };
  wallet: {
    id: number;
    customerId: number;
    balance: number;
    totalEarned: number;
    totalSpent: number;
  };
  balance: number;
  transactions: AiCreditTransaction[];
}

function AiCreditsManagementContent() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const queryCustomerId = searchParams.get('customerId');
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(
    queryCustomerId ? parseInt(queryCustomerId, 10) : null
  );

  // Mobile View Switch: 'list' | 'details'
  const [mobileView, setMobileView] = useState<'list' | 'details'>('list');

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isReduceModalOpen, setIsReduceModalOpen] = useState(false);

  // Form Inputs
  const [creditsAmount, setCreditsAmount] = useState<number | ''>(10);
  const [reason, setReason] = useState('');

  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
    }, 350);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Update selectedCustomerId if query param changes
  useEffect(() => {
    if (queryCustomerId) {
      const parsed = parseInt(queryCustomerId, 10);
      if (!isNaN(parsed) && parsed > 0) {
        setSelectedCustomerId(parsed);
        setMobileView('details');
      }
    }
  }, [queryCustomerId]);

  // 1. Fetch Customers List
  const {
    data: customersData,
    isLoading: isLoadingCustomers,
    refetch: refetchCustomers,
    isRefetching: isRefetchingCustomers,
  } = useQuery({
    queryKey: ['admin-customers-credit-list', debouncedSearch],
    queryFn: async () => {
      const params: any = { limit: 50 };
      if (debouncedSearch) {
        params.search = debouncedSearch;
      }
      const res: any = await api.get('/customers', { params });
      const items = res?.data?.items || res?.data?.data || res?.items || res?.data || [];
      return Array.isArray(items) ? (items as CustomerListItem[]) : [];
    },
  });

  const customers = useMemo(() => customersData || [], [customersData]);

  // Auto-select first customer if none selected
  useEffect(() => {
    if (!selectedCustomerId && customers.length > 0) {
      setSelectedCustomerId(customers[0].id);
    }
  }, [customers, selectedCustomerId]);

  // 2. Fetch Selected Customer's AI Credits Wallet & Ledger
  const {
    data: creditDetails,
    isLoading: isLoadingDetails,
    refetch: refetchDetails,
    isRefetching: isRefetchingDetails,
  } = useQuery<CustomerAiCreditsData | null>({
    queryKey: ['admin-customer-ai-credits', selectedCustomerId],
    enabled: !!selectedCustomerId,
    queryFn: async () => {
      try {
        const res: any = await api.get(`/customers/${selectedCustomerId}/ai-credits`);
        return (res?.data?.data || res?.data || res) as CustomerAiCreditsData;
      } catch (err) {
        console.error('Failed to load customer AI credits', err);
        return null;
      }
    },
  });

  // 3. Fetch AI Services for Dynamic Average Price KPI
  const { data: services = [] } = useQuery<AiServiceConfigItem[]>({
    queryKey: ['admin-ai-services'],
    queryFn: () => AiSocialAdminService.getAiServices(),
  });

  // Dynamic KPI Metrics across customers
  const totalCustomersCount = useMemo(() => customers.length, [customers]);

  const totalCreditsIssued = useMemo(() => {
    return customers.reduce((sum, c) => sum + (c.aiWallet?.totalEarned ?? (c.aiCredits ?? 0)), 0);
  }, [customers]);

  const totalCreditsConsumed = useMemo(() => {
    return customers.reduce((sum, c) => sum + (c.aiWallet?.totalSpent ?? 0), 0);
  }, [customers]);

  const avgCreditPrice = useMemo(() => {
    if (!services.length) return 10;
    const total = services.reduce((acc, s) => acc + (s.pricePerCredit || 0), 0);
    return Math.round(total / services.length);
  }, [services]);

  const selectedCustomerFromList = useMemo(() => {
    return customers.find((c) => c.id === selectedCustomerId) || null;
  }, [customers, selectedCustomerId]);

  const currentBalance =
    creditDetails?.balance ??
    selectedCustomerFromList?.aiCredits ??
    selectedCustomerFromList?.aiWallet?.balance ??
    0;
  const totalEarned =
    creditDetails?.wallet?.totalEarned ??
    selectedCustomerFromList?.aiWallet?.totalEarned ??
    currentBalance;
  const totalSpent =
    creditDetails?.wallet?.totalSpent ??
    selectedCustomerFromList?.aiWallet?.totalSpent ??
    0;
  const transactions = creditDetails?.transactions || [];

  const selectedCustomerInfo = useMemo(() => {
    if (creditDetails?.customer) {
      return {
        ...selectedCustomerFromList,
        ...creditDetails.customer,
        customerId:
          selectedCustomerFromList?.customerId ||
          (selectedCustomerId ? `CUST-${String(selectedCustomerId).padStart(4, '0')}` : undefined),
      };
    }
    return selectedCustomerFromList;
  }, [creditDetails, selectedCustomerFromList, selectedCustomerId]);

  // Add Credits Mutation
  const addCreditsMutation = useMutation({
    mutationFn: async (payload: { amount: number; reason: string }) => {
      const targetId = Number(selectedCustomerId);
      if (!targetId || isNaN(targetId)) throw new Error('No customer selected');
      const res: any = await api.post(`/customers/${targetId}/ai-credits/add`, {
        amount: Math.floor(Number(payload.amount)),
        reason: payload.reason.trim(),
      });
      return res?.data || res;
    },
    onSuccess: async (data, variables) => {
      const successMsg = data?.message || `Successfully added ${variables.amount} AI credits!`;
      toast.success(successMsg);
      setIsAddModalOpen(false);
      setCreditsAmount(10);
      setReason('');

      // Instantly synchronize React Query cache with returned authoritative balance
      const newBalance = data?.wallet?.balance ?? data?.balanceAfter;
      if (newBalance !== undefined) {
        queryClient.setQueryData(['admin-customer-ai-credits', selectedCustomerId], (old: any) => {
          if (!old) return old;
          return {
            ...old,
            balance: newBalance,
            wallet: data?.wallet ? { ...old.wallet, ...data.wallet } : { ...old.wallet, balance: newBalance },
            transactions: data?.transaction ? [data.transaction, ...(old.transactions || [])] : old.transactions,
          };
        });
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin-customer-ai-credits', selectedCustomerId] }),
        queryClient.invalidateQueries({ queryKey: ['admin-customers-credit-list'] }),
        refetchDetails(),
        refetchCustomers(),
      ]);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || 'Failed to add credits';
      toast.error(msg);
    },
  });

  // Reduce Credits Mutation
  const reduceCreditsMutation = useMutation({
    mutationFn: async (payload: { amount: number; reason: string }) => {
      const targetId = Number(selectedCustomerId);
      if (!targetId || isNaN(targetId)) throw new Error('No customer selected');
      const res: any = await api.post(`/customers/${targetId}/ai-credits/reduce`, {
        amount: Math.floor(Number(payload.amount)),
        reason: payload.reason.trim(),
      });
      return res?.data || res;
    },
    onSuccess: async (data, variables) => {
      const successMsg = data?.message || `Successfully reduced ${variables.amount} AI credits!`;
      toast.success(successMsg);
      setIsReduceModalOpen(false);
      setCreditsAmount(5);
      setReason('');

      const newBalance = data?.wallet?.balance ?? data?.balanceAfter;
      if (newBalance !== undefined) {
        queryClient.setQueryData(['admin-customer-ai-credits', selectedCustomerId], (old: any) => {
          if (!old) return old;
          return {
            ...old,
            balance: newBalance,
            wallet: data?.wallet ? { ...old.wallet, ...data.wallet } : { ...old.wallet, balance: newBalance },
            transactions: data?.transaction ? [data.transaction, ...(old.transactions || [])] : old.transactions,
          };
        });
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin-customer-ai-credits', selectedCustomerId] }),
        queryClient.invalidateQueries({ queryKey: ['admin-customers-credit-list'] }),
        refetchDetails(),
        refetchCustomers(),
      ]);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || 'Failed to reduce credits';
      toast.error(msg);
    },
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(creditsAmount);
    if (!amount || isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid credit amount greater than 0');
      return;
    }
    if (!reason.trim()) {
      toast.error('Please provide a reason for manual credit addition');
      return;
    }
    addCreditsMutation.mutate({ amount, reason: reason.trim() });
  };

  const handleReduceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(creditsAmount);
    if (!amount || isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid credit amount greater than 0');
      return;
    }
    if (amount > currentBalance) {
      toast.error(`Cannot reduce ${amount} credits. Current balance is only ${currentBalance}.`);
      return;
    }
    if (!reason.trim()) {
      toast.error('Please provide a reason for manual credit reduction');
      return;
    }
    reduceCreditsMutation.mutate({ amount, reason: reason.trim() });
  };

  const openAddModal = () => {
    setCreditsAmount(10);
    setReason('');
    setIsAddModalOpen(true);
  };

  const openReduceModal = () => {
    setCreditsAmount(Math.min(5, currentBalance > 0 ? currentBalance : 1));
    setReason('');
    setIsReduceModalOpen(true);
  };

  const handleSelectCustomer = (id: number) => {
    setSelectedCustomerId(id);
    setMobileView('details');
  };

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* ── Page Header ────────────────────────────────────────── */}
      <AdminPageHeader
        title="AI Credit Management"
        description="Inspect customer wallets, allocate complimentary credits, make adjustments, and track ledger history."
        icon={Coins}
        iconColor="text-emerald-600"
        badge={{ text: 'Customer-Wise Control', icon: Coins, variant: 'emerald' }}
        breadcrumbs={[
          { label: 'Marketing', href: '/marketing/banners' },
          { label: 'AI Credit Management' },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <Link href="/marketing/ai-studio">
              <AdminButton
                variant="outline"
                size="md"
                icon={Sparkles}
              >
                AI Studio &amp; Pricing
              </AdminButton>
            </Link>

            <AdminButton
              variant="outline"
              size="md"
              icon={RefreshCw}
              onClick={() => {
                refetchCustomers();
                if (selectedCustomerId) refetchDetails();
                toast.success('Synchronized AI credit wallets with server');
              }}
              disabled={isRefetchingCustomers || isRefetchingDetails}
            >
              {isRefetchingCustomers || isRefetchingDetails ? 'Syncing...' : 'Sync'}
            </AdminButton>
          </div>
        }
      />

      {/* ── Top Dynamic KPI Cards ──────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Customers */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-sm transition-all duration-200">
          <div className="flex items-start justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
              Total Customers
            </span>
            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {isLoadingCustomers ? '...' : totalCustomersCount}
            </p>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span>Registered Workspaces</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Total Credits Issued */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-sm transition-all duration-200">
          <div className="flex items-start justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
              Total Credits Issued
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {isLoadingCustomers ? '...' : `${totalCreditsIssued} cr`}
            </p>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              <Coins className="w-3.5 h-3.5 text-emerald-500" />
              <span>Grants &amp; Wallet Purchases</span>
            </div>
          </div>
        </div>

        {/* KPI 3: Credits Consumed */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-sm transition-all duration-200">
          <div className="flex items-start justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
              Credits Consumed
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {isLoadingCustomers ? '...' : `${totalCreditsConsumed} cr`}
            </p>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Used in AI Content Studio</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Average Credit Price */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-sm transition-all duration-200">
          <div className="flex items-start justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
              Average Credit Price
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              ₹{avgCreditPrice} / credit
            </p>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span>Standard Billing Tariff</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile View Selector (<1024px) ─────────────────────── */}
      <div className="lg:hidden flex items-center justify-between p-1 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs">
        <button
          type="button"
          onClick={() => setMobileView('list')}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
            mobileView === 'list'
              ? 'bg-emerald-500 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          Customer List ({customers.length})
        </button>
        <button
          type="button"
          onClick={() => setMobileView('details')}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
            mobileView === 'details'
              ? 'bg-emerald-500 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          Wallet Details {selectedCustomerInfo ? `(${selectedCustomerInfo.name.split(' ')[0]})` : ''}
        </button>
      </div>

      {/* ── Main Responsive Layout ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ── Left Column: Customer List Panel ─────────────────── */}
        <div
          className={`lg:col-span-4 xl:col-span-4 flex flex-col space-y-4 ${
            mobileView === 'details' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col max-h-[820px]">
            {/* Panel Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h2 className="font-bold text-slate-900 dark:text-white text-sm">
                  Customers ({customers.length})
                </h2>
              </div>
              <span className="text-[11px] font-medium text-slate-400">Select to inspect</span>
            </div>

            {/* Search Input */}
            <div className="mt-3.5 relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search name, company, email..."
                className="w-full pl-10 pr-9 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Customer List Items */}
            <div className="mt-3.5 flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar min-h-[300px]">
              {isLoadingCustomers ? (
                <div className="py-16 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-emerald-500" />
                  <span>Loading customer workspaces...</span>
                </div>
              ) : customers.length === 0 ? (
                <div className="py-16 text-center text-slate-400 text-xs">
                  No customers found matching &quot;{debouncedSearch}&quot;
                </div>
              ) : (
                customers.map((c) => {
                  const isSelected = c.id === selectedCustomerId;
                  const balance =
                    isSelected && creditDetails?.balance !== undefined
                      ? creditDetails.balance
                      : (c.aiCredits ?? c.aiWallet?.balance ?? 0);
                  const custCode = c.customerId || `CUST-${String(c.id).padStart(4, '0')}`;

                  return (
                    <div
                      key={c.id}
                      onClick={() => handleSelectCustomer(c.id)}
                      className={`p-3 sm:p-3.5 rounded-2xl border transition-all duration-150 cursor-pointer flex items-center justify-between gap-2.5 ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/30 shadow-xs ring-1 ring-emerald-500/30'
                          : 'border-slate-200/70 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/70 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                        <div
                          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs ${
                            isSelected
                              ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-emerald-600/20'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {c.name?.slice(0, 2).toUpperCase() || 'CU'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                            {c.name}
                          </p>
                          {c.companyName && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate font-medium">
                              {c.companyName}
                            </p>
                          )}
                          <p className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500 mt-0.5">
                            {custCode}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0 flex items-center gap-1.5 sm:gap-2">
                        <div className="flex flex-col items-end">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black shadow-2xs ${
                              balance > 10
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800'
                                : balance > 0
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800'
                            }`}
                          >
                            <Coins className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span>{balance} Credits</span>
                          </span>
                          <span className="text-[9px] uppercase tracking-wider font-semibold text-slate-400 mt-0.5">
                            Remaining
                          </span>
                        </div>

                        <ChevronRight className="w-3.5 h-3.5 text-slate-300 lg:hidden shrink-0" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* ── Right Column: Selected Customer Details Panel ───── */}
        <div
          className={`lg:col-span-8 xl:col-span-8 flex flex-col space-y-6 ${
            mobileView === 'list' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {/* Mobile Back Button */}
          <div className="lg:hidden flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileView('list')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 shadow-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Customer List</span>
            </button>
          </div>

          {!selectedCustomerId ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-12 text-center text-slate-400">
              <Coins className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700 mb-3" />
              <p className="text-base font-bold text-slate-700 dark:text-slate-300">
                No Customer Workspace Selected
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Please select a customer from the left list to view AI wallet balance and allocate credits.
              </p>
            </div>
          ) : isLoadingDetails ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-16 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
              <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
              <p className="text-xs sm:text-sm font-semibold">Loading customer AI wallet &amp; transaction ledger...</p>
            </div>
          ) : (
            <>
              {/* ── Customer Details Header & Wallet Balance Card ──── */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
                  {/* Customer Info */}
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white text-lg font-black shadow-md shadow-emerald-500/20 shrink-0">
                      {selectedCustomerInfo?.name?.slice(0, 2).toUpperCase() || 'CU'}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                          {selectedCustomerInfo?.name || `Customer #${selectedCustomerId}`}
                        </h2>
                        <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          CUST-{String(selectedCustomerId).padStart(4, '0')}
                        </span>
                        <Link
                          href={`/customers/${selectedCustomerId}`}
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 transition-colors"
                          title="Open Customer Profile in CRM"
                        >
                          <span>Profile</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                        {selectedCustomerInfo?.companyName && (
                          <span className="flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            {selectedCustomerInfo.companyName}
                          </span>
                        )}
                        {selectedCustomerInfo?.email && (
                          <span className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            {selectedCustomerInfo.email}
                          </span>
                        )}
                        {selectedCustomerInfo?.phone && (
                          <span className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            {selectedCustomerInfo.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-3 shrink-0 flex-wrap sm:flex-nowrap">
                    <button
                      type="button"
                      onClick={openAddModal}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/25 hover:shadow-lg transition-all active:scale-95"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Add Credits</span>
                    </button>

                    <button
                      type="button"
                      onClick={openReduceModal}
                      disabled={currentBalance <= 0}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl border border-rose-300 dark:border-rose-900 bg-rose-50/60 hover:bg-rose-100/80 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-bold text-xs sm:text-sm transition-all disabled:opacity-40 disabled:pointer-events-none active:scale-95"
                    >
                      <MinusCircle className="w-4 h-4" />
                      <span>Reduce Credits</span>
                    </button>
                  </div>
                </div>

                {/* ── Wallet Metric Breakdown Cards ────────────────── */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  {/* Current Available Balance */}
                  <div className="bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent border-2 border-emerald-500/30 dark:border-emerald-500/40 rounded-2xl p-4 sm:p-5 shadow-xs relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                        CURRENT AVAILABLE BALANCE
                      </span>
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                        <Coins className="w-4.5 h-4.5" />
                      </div>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-3xl sm:text-4xl font-black text-emerald-950 dark:text-emerald-50 tracking-tight">
                        {currentBalance}
                      </span>
                      <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                        Credits
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 mt-1 font-medium flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Authoritative Real-Time Wallet Balance
                    </p>
                  </div>

                  {/* Total Granted / Earned */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                        TOTAL GRANTED / EARNED
                      </span>
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                        {totalEarned}
                      </span>
                      <span className="text-xs font-bold text-slate-400">Credits</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 font-medium">
                      Cumulative top-ups, grants &amp; bonuses
                    </p>
                  </div>

                  {/* Total Consumed */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                        TOTAL CONSUMED
                      </span>
                      <TrendingDown className="w-4 h-4 text-amber-500" />
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                        {totalSpent}
                      </span>
                      <span className="text-xs font-bold text-slate-400">Credits</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 font-medium">
                      Spent on AI post/poster/video jobs
                    </p>
                  </div>
                </div>
              </div>

              {/* ── Transaction History Ledger Table ───────────────── */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                      Transaction Ledger History ({transactions.length})
                    </h3>
                  </div>
                  <span className="text-[11px] font-medium text-slate-400 hidden sm:inline">
                    Immutable audit records
                  </span>
                </div>

                {transactions.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                    <Coins className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                    <p className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-400">
                      No transaction history recorded yet
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Credit grants, admin reductions, and AI generation deductions will be listed here.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800">
                    <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                      <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="py-3 px-3.5 whitespace-nowrap">Date &amp; Time</th>
                          <th className="py-3 px-3.5 whitespace-nowrap">Type</th>
                          <th className="py-3 px-3.5 whitespace-nowrap">Credits</th>
                          <th className="py-3 px-3.5 whitespace-nowrap">Before</th>
                          <th className="py-3 px-3.5 whitespace-nowrap">After</th>
                          <th className="py-3 px-3.5 min-w-[180px]">Reason / Details</th>
                          <th className="py-3 px-3.5 whitespace-nowrap">Admin</th>
                          <th className="py-3 px-3.5 text-right whitespace-nowrap">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {transactions.map((tx) => {
                          const isPositive = tx.amount > 0;
                          const formattedDate = new Date(tx.createdAt).toLocaleString('en-IN', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          });

                          let typeBadge = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
                          if (tx.type === 'CREDIT_GRANT' || tx.type === 'GRANT' || tx.type === 'BONUS') {
                            typeBadge = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800';
                          } else if (tx.type === 'ADMIN_ADJUSTMENT') {
                            typeBadge = 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800';
                          } else if (tx.type === 'USAGE' || tx.type === 'CONSUMED') {
                            typeBadge = 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800';
                          } else if (tx.type === 'PURCHASE') {
                            typeBadge = 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800';
                          }

                          return (
                            <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                              <td className="py-3 px-3.5 whitespace-nowrap font-medium text-slate-800 dark:text-slate-200">
                                {formattedDate}
                              </td>
                              <td className="py-3 px-3.5 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${typeBadge}`}>
                                  {tx.type}
                                </span>
                              </td>
                              <td className="py-3 px-3.5 whitespace-nowrap">
                                <span
                                  className={`inline-flex items-center font-bold text-xs sm:text-sm ${
                                    isPositive
                                      ? 'text-emerald-600 dark:text-emerald-400'
                                      : 'text-rose-600 dark:text-rose-400'
                                  }`}
                                >
                                  {isPositive ? `+${tx.amount}` : tx.amount} cr
                                </span>
                              </td>
                              <td className="py-3 px-3.5 whitespace-nowrap text-slate-400 font-mono">
                                {tx.balanceBefore}
                              </td>
                              <td className="py-3 px-3.5 whitespace-nowrap font-bold text-slate-900 dark:text-white font-mono">
                                {tx.balanceAfter}
                              </td>
                              <td className="py-3 px-3.5 max-w-[240px] truncate text-slate-600 dark:text-slate-300" title={tx.reason || tx.notes || ''}>
                                {tx.reason || tx.notes || '—'}
                              </td>
                              <td className="py-3 px-3.5 whitespace-nowrap text-slate-400 text-[11px]">
                                {tx.adminId ? `Admin #${tx.adminId}` : 'System / Auto'}
                              </td>
                              <td className="py-3 px-3.5 whitespace-nowrap text-right">
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>COMPLETED</span>
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Modal: Add Credits ─────────────────────────────────── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Add AI Credits
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-3.5 text-xs space-y-1.5 border border-slate-200/60 dark:border-slate-800">
              <div className="flex justify-between">
                <span className="text-slate-500">Customer:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {selectedCustomerInfo?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Current Balance:</span>
                <span className="font-black text-emerald-600 dark:text-emerald-400">
                  {currentBalance} Credits
                </span>
              </div>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Credits to Add <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  required
                  value={creditsAmount}
                  onChange={(e) =>
                    setCreditsAmount(e.target.value === '' ? '' : parseInt(e.target.value, 10))
                  }
                  placeholder="e.g. 10"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />

                {/* Quick Add Pills */}
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  {[5, 10, 25, 50, 100].map((num) => (
                    <button
                      type="button"
                      key={num}
                      onClick={() => setCreditsAmount(num)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all ${
                        creditsAmount === num
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-500'
                      }`}
                    >
                      +{num}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Reason / Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Promotional onboarding grant, VIP customer bonus, compensation..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none font-medium"
                />
              </div>

              {/* Preview */}
              {typeof creditsAmount === 'number' && creditsAmount > 0 && (
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs">
                  <span className="text-emerald-800 dark:text-emerald-300 font-medium">
                    New Balance Preview:
                  </span>
                  <span className="font-black text-emerald-700 dark:text-emerald-200 text-sm">
                    {currentBalance} + {creditsAmount} = {currentBalance + creditsAmount} Credits
                  </span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={addCreditsMutation.isPending}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addCreditsMutation.isPending}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-600/25 disabled:opacity-50 transition-all"
                >
                  {addCreditsMutation.isPending ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Allocating...
                    </>
                  ) : (
                    'Confirm & Add Credits'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Reduce Credits ──────────────────────────────── */}
      {isReduceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 flex items-center justify-center">
                  <MinusCircle className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Reduce AI Credits
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsReduceModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-3.5 text-xs space-y-1.5 border border-slate-200/60 dark:border-slate-800">
              <div className="flex justify-between">
                <span className="text-slate-500">Customer:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {selectedCustomerInfo?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Current Balance:</span>
                <span className="font-black text-slate-800 dark:text-slate-200">
                  {currentBalance} Credits
                </span>
              </div>
            </div>

            <form onSubmit={handleReduceSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Credits to Deduct <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max={currentBalance}
                  step="1"
                  required
                  value={creditsAmount}
                  onChange={(e) =>
                    setCreditsAmount(e.target.value === '' ? '' : parseInt(e.target.value, 10))
                  }
                  placeholder={`Max ${currentBalance}`}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />

                {/* Quick Reduce Pills */}
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  {[1, 5, 10, 20].map((num) => {
                    if (num > currentBalance) return null;
                    return (
                      <button
                        type="button"
                        key={num}
                        onClick={() => setCreditsAmount(num)}
                        className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all ${
                          creditsAmount === num
                            ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-rose-500'
                        }`}
                      >
                        -{num}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Reason / Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Correction of mistaken grant, customer requested refund..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 resize-none font-medium"
                />
              </div>

              {/* Preview */}
              {typeof creditsAmount === 'number' && creditsAmount > 0 && (
                <div
                  className={`flex items-center justify-between p-3.5 rounded-2xl border text-xs ${
                    creditsAmount > currentBalance
                      ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300'
                      : 'bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span className="font-medium">
                    {creditsAmount > currentBalance
                      ? 'Error: Insufficient balance!'
                      : 'New Balance Preview:'}
                  </span>
                  <span className="font-black text-sm">
                    {creditsAmount > currentBalance
                      ? `Cannot deduct ${creditsAmount}`
                      : `${currentBalance} - ${creditsAmount} = ${currentBalance - creditsAmount} Credits`}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsReduceModalOpen(false)}
                  disabled={reduceCreditsMutation.isPending}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    reduceCreditsMutation.isPending ||
                    typeof creditsAmount !== 'number' ||
                    creditsAmount <= 0 ||
                    creditsAmount > currentBalance
                  }
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs shadow-md shadow-rose-600/25 disabled:opacity-50 transition-all"
                >
                  {reduceCreditsMutation.isPending ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Deducting...
                    </>
                  ) : (
                    'Confirm & Reduce Credits'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AiCreditsManagementPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
          <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
        </div>
      }
    >
      <AiCreditsManagementContent />
    </Suspense>
  );
}
