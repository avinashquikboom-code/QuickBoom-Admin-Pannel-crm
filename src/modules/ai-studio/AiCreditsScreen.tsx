// @ts-nocheck
'use client';

import * as React from 'react';
import {
  Coins,
  CreditCard,
  Search,
  Filter,
  RefreshCw,
  Download,
  Plus,
  Minus,
  User,
  Building2,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Eye,
  SlidersHorizontal,
  Wallet,
  AlertTriangle,
  X,
  RotateCcw,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import {
  loadCreditTransactions,
  loadCustomerCredits,
  sessionCan,
  socialError,
} from '@/modules/social/social-api';
import { AdjustCreditsDialog } from './AdjustCreditsDialog';
import { TransactionDetailDrawer } from './TransactionDetailDrawer';
import { TruncatedText } from '@/components/common/TruncatedText';

const TX_TYPES = [
  { id: 'ALL', label: 'All Transactions' },
  { id: 'CONSUMED', label: 'Consumed' },
  { id: 'PURCHASE', label: 'Purchases' },
  { id: 'GRANT', label: 'Grants' },
  { id: 'REFUND', label: 'Refunds' },
];

export function AiCreditsScreen() {
  const [allowed, setAllowed] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  // Customer Wallet Lookup State
  const [customerIdInput, setCustomerIdInput] = React.useState('');
  const [lookupLoading, setLookupLoading] = React.useState(false);
  const [loadedWallet, setLoadedWallet] = React.useState<any | null>(null);

  // Transactions State
  const [transactions, setTransactions] = React.useState<any[]>([]);
  const [pagination, setPagination] = React.useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [typeFilter, setTypeFilter] = React.useState('ALL');
  const [searchQuery, setSearchQuery] = React.useState('');

  // Modals & Drawers
  const [adjustModal, setAdjustModal] = React.useState({
    open: false,
    customerId: '',
    customerName: '',
    currentBalance: 0,
    initialMode: 'add' as 'add' | 'reduce',
  });
  const [selectedTx, setSelectedTx] = React.useState<any | null>(null);

  // Permissions
  React.useEffect(() => {
    setAllowed(sessionCan('AI'));
  }, []);

  // Fetch Transactions Ledger
  const fetchLedger = React.useCallback(async (page = 1, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await loadCreditTransactions({
        page,
        type: typeFilter === 'ALL' ? undefined : typeFilter,
      });

      const rows = Array.isArray(res) ? res : (res?.rows || res?.items || []);
      setTransactions(rows);
      if (res?.pagination) {
        setPagination({
          page: res.pagination.page || page,
          limit: res.pagination.limit || 20,
          total: res.pagination.total || rows.length,
          totalPages: res.pagination.totalPages || Math.max(1, Math.ceil((res.pagination.total || rows.length) / 20)),
        });
      } else {
        setPagination({
          page,
          limit: 20,
          total: rows.length,
          totalPages: Math.max(1, Math.ceil(rows.length / 20)),
        });
      }
    } catch (err: any) {
      console.error('Failed to load credit transactions:', err);
      toast.error('Could not load credit transactions.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [typeFilter]);

  React.useEffect(() => {
    fetchLedger(1);
  }, [fetchLedger]);

  // Handle Load Wallet
  const handleLoadWallet = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const id = customerIdInput.trim();
    if (!id) {
      toast.error('Please enter a Customer ID');
      return;
    }

    setLookupLoading(true);
    try {
      const res = await loadCustomerCredits(id);
      const data = res?.data || res;
      setLoadedWallet(data);
      toast.success(`Wallet loaded for Customer #${id}`);
    } catch (err: any) {
      console.error('Failed to load wallet:', err);
      setLoadedWallet(null);
      toast.error(socialError(err) || `Could not find wallet for customer #${id}`);
    } finally {
      setLookupLoading(false);
    }
  };

  // Re-fetch active wallet after adjustments
  const handleRefreshActiveWallet = async () => {
    if (loadedWallet) {
      const custId = loadedWallet.customer?.id || loadedWallet.wallet?.customerId || customerIdInput;
      if (custId) {
        try {
          const res = await loadCustomerCredits(custId);
          setLoadedWallet(res?.data || res);
        } catch {
          // ignore
        }
      }
    }
    fetchLedger(pagination.page, true);
  };

  // Export CSV
  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) {
      toast.error('No transactions available to export');
      return;
    }
    const headers = ['Transaction ID', 'Customer ID', 'Customer Name', 'Type', 'Service Code', 'Credits Amount', 'Balance After', 'Notes', 'Date Time'];
    const rows = filteredTransactions.map((t) => [
      t.id,
      t.customerId,
      `"${t.customer?.companyName || t.customer?.name || ''}"`,
      t.type,
      t.serviceCode || '',
      t.amount,
      t.balanceAfter,
      `"${(t.notes || '').replace(/"/g, '""')}"`,
      t.createdAt ? new Date(t.createdAt).toLocaleString() : '',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ai_credit_transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Transactions exported to CSV');
  };

  // Filtered transactions by client search query
  const filteredTransactions = React.useMemo(() => {
    let result = transactions;
    if (typeFilter !== 'ALL') {
      result = result.filter((t) => (t.type || '').toUpperCase() === typeFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((t) => {
        const cust = `${t.customer?.name || ''} ${t.customer?.companyName || ''} ${t.customerId}`.toLowerCase();
        const code = `${t.serviceCode || ''}`.toLowerCase();
        const notes = `${t.notes || ''}`.toLowerCase();
        const id = `${t.id}`;
        return cust.includes(q) || code.includes(q) || notes.includes(q) || id.includes(q);
      });
    }
    return result;
  }, [transactions, typeFilter, searchQuery]);

  // Aggregate stats
  const totalSpentAcrossTransactions = React.useMemo(() => {
    return transactions
      .filter((t) => (t.amount || 0) < 0 || t.type === 'CONSUMED')
      .reduce((sum, t) => sum + Math.abs(t.amount || 0), 0);
  }, [transactions]);

  const totalGrantsAcrossTransactions = React.useMemo(() => {
    return transactions
      .filter((t) => (t.amount || 0) > 0 || t.type === 'PURCHASE' || t.type === 'GRANT')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
  }, [transactions]);

  const activeWalletRecord = loadedWallet?.wallet || loadedWallet?.data?.wallet || loadedWallet?.data;
  const activeCustomer = loadedWallet?.customer || loadedWallet?.data?.customer;
  const activeBalance = activeWalletRecord?.balance ?? loadedWallet?.balance;

  return (
    <div className="w-full space-y-6 pb-20">
      {/* ── 1. Page Header ────────────────────────────────────────────── */}
      <PageHeader
        title="AI Credits Management"
        category="AI & SOCIAL STUDIO"
        description="Manage customer AI credit wallets, grant or deduct credits, and audit the credit transaction ledger."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="h-9 gap-1.5 rounded-xl border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50"
            >
              <Download className="size-3.5 text-slate-500" />
              <span>Export CSV</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                fetchLedger(pagination.page, true);
                if (loadedWallet) handleRefreshActiveWallet();
              }}
              disabled={refreshing}
              className="h-9 gap-1.5 rounded-xl border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50"
            >
              <RefreshCw className={`size-3.5 text-slate-500 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
            <Button
              size="sm"
              onClick={() =>
                setAdjustModal({
                  open: true,
                  customerId: loadedWallet ? (activeCustomer?.id || customerIdInput) : '',
                  customerName: activeCustomer?.companyName || activeCustomer?.name || '',
                  currentBalance: activeBalance ?? 0,
                  initialMode: 'add',
                })
              }
              className="h-9 gap-1.5 rounded-xl bg-[#16A34A] px-3.5 text-xs font-semibold text-white shadow-xs hover:bg-[#15803D]"
            >
              <Plus className="size-3.5" />
              <span>Adjust Credits</span>
            </Button>
          </div>
        }
      />

      {/* ── 2. Compact 4 KPI Statistics Cards ────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Total Credits Granted */}
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-xs transition-all hover:border-emerald-300 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Credits Granted
            </span>
            <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-50 text-[#16A34A] ring-1 ring-emerald-200/60">
              <ArrowUpRight className="size-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black tracking-tight text-slate-900">
              {totalGrantsAcrossTransactions}
            </span>
            <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">
              Promotions & Grants
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Credited to customer wallets</p>
        </div>

        {/* Card 2: Total Credits Used */}
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-xs transition-all hover:border-emerald-300 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Credits Used
            </span>
            <div className="flex size-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600 ring-1 ring-amber-200/60">
              <ArrowDownRight className="size-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black tracking-tight text-slate-900">
              {totalSpentAcrossTransactions}
            </span>
            <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md">
              Post & Media Generations
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Consumed by AI engine requests</p>
        </div>

        {/* Card 3: Active Customer Balance */}
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-xs transition-all hover:border-emerald-300 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {loadedWallet ? 'Inspected Balance' : 'Net Credit Flow'}
            </span>
            <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-50 text-[#16A34A] ring-1 ring-emerald-200/60">
              <Coins className="size-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black tracking-tight text-[#16A34A]">
              {loadedWallet ? `${activeBalance ?? 0}` : `${totalGrantsAcrossTransactions - totalSpentAcrossTransactions}`}
            </span>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md">
              {loadedWallet ? 'Active Wallet' : 'Audited Net'}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500 truncate">
            {loadedWallet
              ? (activeCustomer?.companyName || `Customer #${customerIdInput}`)
              : 'Overall balance trend across ledger'}
          </p>
        </div>

        {/* Card 4: Audited Transactions */}
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-xs transition-all hover:border-emerald-300 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Audited Transactions
            </span>
            <div className="flex size-8 items-center justify-center rounded-xl bg-slate-100 text-slate-700 ring-1 ring-slate-200">
              <CreditCard className="size-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black tracking-tight text-slate-900">
              {pagination.total || transactions.length}
            </span>
            <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded-md">
              Ledger Entries
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Immutable credit audit log</p>
        </div>
      </div>

      {/* ── 3. Customer Wallet Lookup & Live Panel ─────────────────────── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex size-6 items-center justify-center rounded-lg bg-emerald-50 text-[#16A34A]">
                <Wallet className="size-3.5" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Customer Wallet Lookup & Live Adjustment
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter a Customer ID to inspect real-time wallet balances, grant promotional credits, or adjust usage.
            </p>
          </div>

          {/* Quick Lookup Form */}
          <form onSubmit={handleLoadWallet} className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Enter Customer ID (e.g. 1, 2, 5...)"
                value={customerIdInput}
                onChange={(e) => setCustomerIdInput(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <Button
              type="submit"
              size="sm"
              disabled={lookupLoading || !customerIdInput.trim()}
              className="h-9 rounded-xl bg-[#064E3B] px-3.5 text-xs font-semibold text-white shadow-xs hover:bg-[#064E3B]/90 shrink-0"
            >
              {lookupLoading ? 'Loading…' : 'Load Wallet'}
            </Button>
          </form>
        </div>

        {/* Loaded Active Customer Wallet Banner */}
        {loadedWallet && (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-xl border border-emerald-200 bg-emerald-50/50 p-3.5">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-white text-[#16A34A] shadow-xs border border-emerald-100">
                <Building2 className="size-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900">
                    {activeCustomer?.companyName || activeCustomer?.name || `Customer #${customerIdInput}`}
                  </span>
                  <Badge variant="outline" className="border-emerald-300 bg-emerald-100 text-emerald-800 text-[10px]">
                    ID: #{activeCustomer?.id || customerIdInput}
                  </Badge>
                </div>
                <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                  <span>Current Available Balance:</span>
                  <span className="font-black text-[#16A34A] text-sm">
                    {activeBalance ?? 0} Credits
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                onClick={() =>
                  setAdjustModal({
                    open: true,
                    customerId: activeCustomer?.id || customerIdInput,
                    customerName: activeCustomer?.companyName || activeCustomer?.name || '',
                    currentBalance: activeBalance ?? 0,
                    initialMode: 'add',
                  })
                }
                className="h-8 gap-1 rounded-lg bg-[#16A34A] px-3 text-xs font-semibold text-white hover:bg-[#15803D]"
              >
                <Plus className="size-3" />
                <span>Add Credits</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setAdjustModal({
                    open: true,
                    customerId: activeCustomer?.id || customerIdInput,
                    customerName: activeCustomer?.companyName || activeCustomer?.name || '',
                    currentBalance: activeBalance ?? 0,
                    initialMode: 'reduce',
                  })
                }
                className="h-8 gap-1 rounded-lg border-rose-200 text-rose-700 bg-white hover:bg-rose-50 text-xs font-semibold"
              >
                <Minus className="size-3" />
                <span>Reduce</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setLoadedWallet(null);
                  setCustomerIdInput('');
                }}
                className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── 4. Credit Transaction Ledger ──────────────────────────────── */}
      <div className="space-y-4">
        {/* Ledger Title & Subtitle */}
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <span>Credit Transaction Ledger</span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
              {filteredTransactions.length}
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit trail of AI credit purchases, promotional grants, usage deductions, and refunds.
          </p>
        </div>

        {/* Filter Bar & Pills */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between rounded-2xl border border-slate-200 bg-white p-3 shadow-xs">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search ledger by TX ID, customer, notes, or service..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-9 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Type Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {TX_TYPES.map((t) => {
              const isSelected = typeFilter === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTypeFilter(t.id)}
                  className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${
                    isSelected
                      ? 'border-[#16A34A] bg-emerald-50 text-[#16A34A] shadow-xs ring-1 ring-[#16A34A]'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {t.label}
                </button>
              );
            })}

            {(typeFilter !== 'ALL' || searchQuery) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setTypeFilter('ALL');
                  setSearchQuery('');
                }}
                className="h-8 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700"
              >
                Reset
              </Button>
            )}
          </div>
        </div>

        {/* Compact Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="border-b border-slate-200 bg-slate-50/80 font-bold uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="px-4 py-3">TX ID & Date</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Service</th>
                  <th className="px-4 py-3 text-center">Credit Impact</th>
                  <th className="px-4 py-3 text-center">Balance After</th>
                  <th className="px-4 py-3">Notes / Reference</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-xs text-slate-400">
                      <RefreshCw className="mx-auto mb-2 size-5 animate-spin text-emerald-600" />
                      Loading credit transactions…
                    </td>
                  </tr>
                ) : filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-14 text-center">
                      <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-3">
                        <CreditCard className="size-6" />
                      </div>
                      <p className="text-sm font-semibold text-slate-800">No credit transactions found</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {searchQuery || typeFilter !== 'ALL'
                          ? 'Try adjusting your search query or filter.'
                          : 'Transactions will appear here as AI features are consumed or granted.'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx) => {
                    const isPositive = (tx.amount || 0) > 0 || tx.type === 'PURCHASE' || tx.type === 'GRANT';
                    const customerName = tx.customer?.companyName || tx.customer?.name || `Customer #${tx.customerId}`;
                    const dateFormatted = tx.createdAt
                      ? new Date(tx.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '—';

                    return (
                      <tr
                        key={tx.id}
                        className="transition-colors hover:bg-slate-50/70 cursor-pointer"
                        onClick={() => setSelectedTx(tx)}
                      >
                        {/* TX ID & Date */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="font-mono text-xs font-bold text-slate-900">
                            #{tx.id}
                          </span>
                          <div className="text-[11px] text-slate-400 mt-0.5">{dateFormatted}</div>
                        </td>

                        {/* Customer */}
                        <td className="px-4 py-3 max-w-[190px]" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1.5">
                            <Building2 className="size-3.5 text-slate-400 shrink-0" />
                            <TruncatedText
                              value={customerName}
                              maxWidth="max-w-[160px]"
                              label="Customer"
                              className="font-semibold text-slate-800"
                            />
                          </div>
                          {tx.customerId && (
                            <span className="text-[10px] text-slate-400 font-mono">ID: #{tx.customerId}</span>
                          )}
                        </td>

                        {/* Type */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold ${
                              isPositive
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {tx.type}
                          </span>
                        </td>

                        {/* Service */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="font-mono text-[11px] text-slate-600 bg-slate-50 border border-slate-200/60 px-2 py-0.5 rounded">
                            {tx.serviceCode || 'AI_ENGINE'}
                          </span>
                        </td>

                        {/* Credit Impact */}
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <span
                            className={`font-mono text-xs font-bold ${
                              isPositive ? 'text-emerald-700' : 'text-slate-800'
                            }`}
                          >
                            {isPositive ? `+${Math.abs(tx.amount || 0)}` : `-${Math.abs(tx.amount || 0)}`}
                          </span>
                        </td>

                        {/* Balance After */}
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <span className="font-mono text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200/60 rounded px-2 py-0.5">
                            {tx.balanceAfter != null ? `${tx.balanceAfter} Credits` : '—'}
                          </span>
                        </td>

                        {/* Notes / Reference with TruncatedText */}
                        <td className="px-4 py-3 max-w-[260px]" onClick={(e) => e.stopPropagation()}>
                          <TruncatedText
                            value={tx.notes || 'No description provided'}
                            maxWidth="max-w-[240px]"
                            label="Transaction Note"
                            className="text-slate-600 text-[11px]"
                          />
                        </td>

                        {/* Action */}
                        <td className="px-4 py-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedTx(tx)}
                            className="h-8 gap-1 rounded-lg px-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                          >
                            <Eye className="size-3.5" />
                            <span>Details</span>
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && filteredTransactions.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 bg-slate-50/50 text-xs text-slate-500">
              <div>
                Showing <span className="font-semibold text-slate-800">{filteredTransactions.length}</span> of{' '}
                <span className="font-semibold text-slate-800">{pagination.total || filteredTransactions.length}</span> transactions
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => fetchLedger(pagination.page - 1)}
                  className="h-8 rounded-xl px-2.5 text-xs font-semibold"
                >
                  Previous
                </Button>
                <span className="font-semibold text-slate-700 px-2">
                  Page {pagination.page} of {pagination.totalPages || 1}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => fetchLedger(pagination.page + 1)}
                  className="h-8 rounded-xl px-2.5 text-xs font-semibold"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── 5. Adjust Credits Dialog ──────────────────────────────────── */}
      <AdjustCreditsDialog
        open={adjustModal.open}
        onOpenChange={(open) => setAdjustModal((prev) => ({ ...prev, open }))}
        customerId={adjustModal.customerId}
        customerName={adjustModal.customerName}
        currentBalance={adjustModal.currentBalance}
        initialMode={adjustModal.initialMode}
        onSuccess={handleRefreshActiveWallet}
      />

      {/* ── 6. Transaction Details Drawer ─────────────────────────────── */}
      <TransactionDetailDrawer
        transaction={selectedTx}
        open={Boolean(selectedTx)}
        onClose={() => setSelectedTx(null)}
      />
    </div>
  );
}

export default AiCreditsScreen;
