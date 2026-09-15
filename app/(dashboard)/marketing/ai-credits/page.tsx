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
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import api from '@/lib/api';

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

  const currentBalance = creditDetails?.balance ?? 0;
  const totalEarned = creditDetails?.wallet?.totalEarned ?? 0;
  const totalSpent = creditDetails?.wallet?.totalSpent ?? 0;
  const transactions = creditDetails?.transactions || [];

  const selectedCustomerInfo = useMemo(() => {
    if (creditDetails?.customer) return creditDetails.customer;
    return customers.find((c) => c.id === selectedCustomerId) || null;
  }, [creditDetails, customers, selectedCustomerId]);

  // 3. Add Credits Mutation
  const addCreditsMutation = useMutation({
    mutationFn: async (payload: { amount: number; reason: string }) => {
      if (!selectedCustomerId) throw new Error('No customer selected');
      const res: any = await api.post(`/customers/${selectedCustomerId}/ai-credits/add`, payload);
      return res?.data || res;
    },
    onSuccess: (data) => {
      toast.success(data?.message || `Successfully added ${creditsAmount} AI credits!`);
      setIsAddModalOpen(false);
      setCreditsAmount(10);
      setReason('');
      queryClient.invalidateQueries({ queryKey: ['admin-customer-ai-credits', selectedCustomerId] });
      queryClient.invalidateQueries({ queryKey: ['admin-customers-credit-list'] });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || 'Failed to add credits';
      toast.error(msg);
    },
  });

  // 4. Reduce Credits Mutation
  const reduceCreditsMutation = useMutation({
    mutationFn: async (payload: { amount: number; reason: string }) => {
      if (!selectedCustomerId) throw new Error('No customer selected');
      const res: any = await api.post(`/customers/${selectedCustomerId}/ai-credits/reduce`, payload);
      return res?.data || res;
    },
    onSuccess: (data) => {
      toast.success(data?.message || `Successfully reduced ${creditsAmount} AI credits!`);
      setIsReduceModalOpen(false);
      setCreditsAmount(5);
      setReason('');
      queryClient.invalidateQueries({ queryKey: ['admin-customer-ai-credits', selectedCustomerId] });
      queryClient.invalidateQueries({ queryKey: ['admin-customers-credit-list'] });
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-6 lg:p-8 space-y-6">
      {/* ── Top Header ─────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
                AI Credit Management
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Customer-Wise Control
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Inspect customer wallets, allocate complimentary credits, make adjustments, and track ledger history.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/marketing/ai-studio"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-purple-500" />
            AI Studio &amp; Pricing
          </Link>

          <button
            onClick={() => {
              refetchCustomers();
              if (selectedCustomerId) refetchDetails();
            }}
            disabled={isRefetchingCustomers || isRefetchingDetails}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm hover:text-slate-900 dark:hover:text-white transition-all shadow-sm disabled:opacity-50"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${isRefetchingCustomers || isRefetchingDetails ? 'animate-spin text-emerald-500' : ''}`} />
            <span className="hidden sm:inline">Sync</span>
          </button>
        </div>
      </div>

      {/* ── Main Two-Column Layout ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ── Left Column: Customer Search & Selection (4 cols) ─── */}
        <div className="lg:col-span-4 xl:col-span-4 flex flex-col space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col h-full max-h-[820px]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h2 className="font-semibold text-slate-900 dark:text-white text-sm">
                  Customers ({customers.length})
                </h2>
              </div>
              <span className="text-xs text-slate-400">Select to manage</span>
            </div>

            {/* Search Input */}
            <div className="mt-3 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search name, company, email..."
                className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Customer List Items */}
            <div className="mt-3 flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {isLoadingCustomers ? (
                <div className="py-12 text-center text-slate-400 text-sm flex flex-col items-center gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-emerald-500" />
                  <span>Loading customers...</span>
                </div>
              ) : customers.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm">
                  No customers found matching &quot;{debouncedSearch}&quot;
                </div>
              ) : (
                customers.map((c) => {
                  const isSelected = c.id === selectedCustomerId;
                  const balance = c.aiCredits ?? c.aiWallet?.balance ?? 20;

                  return (
                    <div
                      key={c.id}
                      onClick={() => setSelectedCustomerId(c.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-sm ring-1 ring-emerald-500/30'
                          : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/60 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                            isSelected
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {c.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                            {c.name}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {c.companyName || c.email || `ID #${c.id}`}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
                            balance > 10
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : balance > 0
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                          }`}
                        >
                          <Coins className="w-3 h-3" />
                          {balance}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* ── Right Column: Selected Customer Wallet & Actions (8 cols) ── */}
        <div className="lg:col-span-8 xl:col-span-8 flex flex-col space-y-6">
          {!selectedCustomerId ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-400">
              <Coins className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700 mb-3" />
              <p className="text-base font-semibold text-slate-700 dark:text-slate-300">
                No Customer Selected
              </p>
              <p className="text-sm text-slate-400 mt-1">
                Please select a customer from the left list to view AI wallet balance and manage credits.
              </p>
            </div>
          ) : isLoadingDetails ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
              <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
              <p className="text-sm font-medium">Loading customer AI wallet &amp; transactions...</p>
            </div>
          ) : (
            <>
              {/* ── Customer Details Header & Wallet Balance Card ──── */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
                  {/* Customer Info */}
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white text-lg font-bold shadow-md shadow-emerald-500/20 shrink-0">
                      {selectedCustomerInfo?.name?.slice(0, 2).toUpperCase() || 'CU'}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">
                          {selectedCustomerInfo?.name || `Customer #${selectedCustomerId}`}
                        </h2>
                        <span className="px-2 py-0.5 rounded-md text-xs font-mono font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          CUST-{String(selectedCustomerId).padStart(4, '0')}
                        </span>
                        <Link
                          href={`/customers/${selectedCustomerId}`}
                          className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 font-medium"
                          title="Open Customer Profile"
                        >
                          Profile <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-slate-500 dark:text-slate-400">
                        {selectedCustomerInfo?.companyName && (
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            {selectedCustomerInfo.companyName}
                          </span>
                        )}
                        {selectedCustomerInfo?.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            {selectedCustomerInfo.email}
                          </span>
                        )}
                        {selectedCustomerInfo?.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            {selectedCustomerInfo.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      onClick={openAddModal}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm shadow-md shadow-emerald-600/25 hover:shadow-lg transition-all active:scale-95"
                    >
                      <PlusCircle className="w-4 h-4" />
                      Add Credits
                    </button>

                    <button
                      onClick={openReduceModal}
                      disabled={currentBalance <= 0}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-rose-300 dark:border-rose-900 bg-rose-50/50 hover:bg-rose-100/70 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-semibold text-sm transition-all disabled:opacity-40 disabled:pointer-events-none active:scale-95"
                    >
                      <MinusCircle className="w-4 h-4" />
                      Reduce Credits
                    </button>
                  </div>
                </div>

                {/* ── Stats Row ─────────────────────────────────────────── */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                  {/* Current Balance */}
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50/40 dark:from-emerald-950/30 dark:to-teal-950/10 border border-emerald-200/70 dark:border-emerald-800/50 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                        Current Available Balance
                      </span>
                      <Coins className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-3xl font-black text-emerald-900 dark:text-emerald-100">
                        {currentBalance}
                      </span>
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                        Credits
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 mt-1">
                      Ready for post, poster, &amp; video generation
                    </p>
                  </div>

                  {/* Total Earned / Granted */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Total Granted / Earned
                      </span>
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-slate-900 dark:text-white">
                        {totalEarned}
                      </span>
                      <span className="text-xs text-slate-500">Credits</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Cumulative top-ups, grants &amp; bonuses
                    </p>
                  </div>

                  {/* Total Spent */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Total Credits Consumed
                      </span>
                      <TrendingDown className="w-4 h-4 text-amber-500" />
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-slate-900 dark:text-white">
                        {totalSpent}
                      </span>
                      <span className="text-xs text-slate-500">Credits</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Used by customer for AI generations
                    </p>
                  </div>
                </div>
              </div>

              {/* ── Credit History / Ledger Table ─────────────────────── */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <History className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">
                      Credit Transaction History ({transactions.length})
                    </h3>
                  </div>
                  <span className="text-xs text-slate-400">
                    Real-time immutable audit ledger
                  </span>
                </div>

                {transactions.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    <Coins className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      No transaction history recorded yet
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Credit grants, deductions, and generation usage will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                      <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 font-semibold border-y border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="py-3 px-3">Date &amp; Time</th>
                          <th className="py-3 px-3">Type</th>
                          <th className="py-3 px-3">Credits</th>
                          <th className="py-3 px-3">Before</th>
                          <th className="py-3 px-3">After</th>
                          <th className="py-3 px-3">Reason / Details</th>
                          <th className="py-3 px-3">Admin</th>
                          <th className="py-3 px-3 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {transactions.map((tx) => {
                          const isPositive = tx.amount > 0;
                          const formattedDate = new Date(tx.createdAt).toLocaleString('en-IN', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          });

                          let typeBadgeColor = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
                          if (tx.type === 'CREDIT_GRANT') {
                            typeBadgeColor = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800';
                          } else if (tx.type === 'ADMIN_ADJUSTMENT') {
                            typeBadgeColor = 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800';
                          } else if (tx.type === 'USAGE') {
                            typeBadgeColor = 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800';
                          } else if (tx.type === 'PURCHASE') {
                            typeBadgeColor = 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800';
                          }

                          return (
                            <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                              <td className="py-3 px-3 whitespace-nowrap font-medium text-slate-800 dark:text-slate-200">
                                {formattedDate}
                              </td>
                              <td className="py-3 px-3 whitespace-nowrap">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${typeBadgeColor}`}>
                                  {tx.type}
                                </span>
                              </td>
                              <td className="py-3 px-3 whitespace-nowrap">
                                <span
                                  className={`inline-flex items-center font-bold text-sm ${
                                    isPositive
                                      ? 'text-emerald-600 dark:text-emerald-400'
                                      : 'text-rose-600 dark:text-rose-400'
                                  }`}
                                >
                                  {isPositive ? `+${tx.amount}` : tx.amount}
                                </span>
                              </td>
                              <td className="py-3 px-3 whitespace-nowrap text-slate-500">
                                {tx.balanceBefore}
                              </td>
                              <td className="py-3 px-3 whitespace-nowrap font-semibold text-slate-800 dark:text-slate-200">
                                {tx.balanceAfter}
                              </td>
                              <td className="py-3 px-3 max-w-[240px] truncate" title={tx.reason || tx.notes || ''}>
                                {tx.reason || tx.notes || '—'}
                              </td>
                              <td className="py-3 px-3 whitespace-nowrap text-slate-500">
                                {tx.adminId ? `Admin #${tx.adminId}` : 'System / User'}
                              </td>
                              <td className="py-3 px-3 whitespace-nowrap text-right">
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  COMPLETED
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

      {/* ── Modal: Add Credits ──────────────────────────────────────── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Add AI Credits
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Customer:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {selectedCustomerInfo?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Current Balance:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {currentBalance} Credits
                </span>
              </div>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
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
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                {/* Quick Add Pills */}
                <div className="flex items-center gap-2 mt-2">
                  {[5, 10, 25, 50, 100].map((num) => (
                    <button
                      type="button"
                      key={num}
                      onClick={() => setCreditsAmount(num)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                        creditsAmount === num
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-500'
                      }`}
                    >
                      +{num}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Reason / Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Promotional onboarding grant, VIP customer compensation, campaign reward..."
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
                />
              </div>

              {/* Preview */}
              {typeof creditsAmount === 'number' && creditsAmount > 0 && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs">
                  <span className="text-emerald-800 dark:text-emerald-300 font-medium">
                    New Balance Preview:
                  </span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-200 text-sm">
                    {currentBalance} + {creditsAmount} = {currentBalance + creditsAmount} Credits
                  </span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={addCreditsMutation.isPending}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addCreditsMutation.isPending}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm shadow-md shadow-emerald-600/25 disabled:opacity-50"
                >
                  {addCreditsMutation.isPending ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Granting...
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

      {/* ── Modal: Reduce Credits ───────────────────────────────────── */}
      {isReduceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 flex items-center justify-center">
                  <MinusCircle className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Reduce AI Credits
                </h3>
              </div>
              <button
                onClick={() => setIsReduceModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Customer:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {selectedCustomerInfo?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Current Balance:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {currentBalance} Credits
                </span>
              </div>
            </div>

            <form onSubmit={handleReduceSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
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
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
                {/* Quick Reduce Pills */}
                <div className="flex items-center gap-2 mt-2">
                  {[1, 5, 10, 20].map((num) => {
                    if (num > currentBalance) return null;
                    return (
                      <button
                        type="button"
                        key={num}
                        onClick={() => setCreditsAmount(num)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                          creditsAmount === num
                            ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
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
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Reason / Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Reversal of mistaken grant, administrative balance correction..."
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 resize-none"
                />
              </div>

              {/* Preview */}
              {typeof creditsAmount === 'number' && creditsAmount > 0 && (
                <div
                  className={`flex items-center justify-between p-3 rounded-xl border text-xs ${
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
                  <span className="font-bold text-sm">
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
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
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
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-semibold text-sm shadow-md shadow-rose-600/25 disabled:opacity-50"
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
