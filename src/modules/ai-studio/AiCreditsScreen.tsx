// @ts-nocheck
'use client';

import * as React from 'react';
import Link from 'next/link';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import {
  loadCreditTransactions,
  loadCustomerCredits,
  sessionCan,
  socialError,
} from '@/modules/social/social-api';
import { AdjustCreditsDialog } from './AdjustCreditsDialog';
import { TransactionDetailDrawer } from './TransactionDetailDrawer';

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
        setPagination(res.pagination);
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
    if (transactions.length === 0) {
      toast.error('No transactions available to export');
      return;
    }
    const headers = ['Transaction ID', 'Customer ID', 'Customer Name', 'Type', 'Service Code', 'Credits Amount', 'Balance After', 'Notes', 'Date Time'];
    const rows = transactions.map((t) => [
      t.id,
      t.customerId,
      `"${t.customer?.companyName || t.customer?.name || ''}"`,
      t.type,
      t.serviceCode || '',
      t.amount,
      t.balanceAfter,
      `"${t.notes || ''}"`,
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
    if (!searchQuery.trim()) return transactions;
    const q = searchQuery.toLowerCase();
    return transactions.filter((t) => {
      const cust = `${t.customer?.name || ''} ${t.customer?.companyName || ''} ${t.customerId}`.toLowerCase();
      const code = `${t.serviceCode || ''}`.toLowerCase();
      const notes = `${t.notes || ''}`.toLowerCase();
      const id = `${t.id}`;
      return cust.includes(q) || code.includes(q) || notes.includes(q) || id.includes(q);
    });
  }, [transactions, searchQuery]);

  // Aggregate stats
  const totalSpentAcrossTransactions = React.useMemo(() => {
    return transactions
      .filter((t) => (t.amount || 0) < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount || 0), 0);
  }, [transactions]);

  const totalGrantsAcrossTransactions = React.useMemo(() => {
    return transactions
      .filter((t) => (t.amount || 0) > 0)
      .reduce((sum, t) => sum + (t.amount || 0), 0);
  }, [transactions]);

  const activeWalletRecord = loadedWallet?.wallet || loadedWallet?.data?.wallet || loadedWallet?.data;
  const activeCustomer = loadedWallet?.customer || loadedWallet?.data?.customer;
  const activeBalance = activeWalletRecord?.balance ?? loadedWallet?.balance;

  return (
    <div className="min-h-screen bg-slate-50/60 pb-28 space-y-6">
      {/* Top Banner */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="size-12 rounded-2xl bg-[#E8F1EC] text-[#163A2E] flex items-center justify-center shadow-xs shrink-0">
                <Coins className="size-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold tracking-wider text-[#20C466] uppercase">
                    AI & SOCIAL STUDIO
                  </span>
                  <Badge variant="outline" className="text-[10px] py-0 border-emerald-200 bg-emerald-50 text-emerald-800">
                    Live Wallets
                  </Badge>
                </div>
                <h1 className="text-2xl font-bold text-[#163A2E] mt-0.5">
                  AI Credits Management
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                  Manage customer AI credit wallets, grant or deduct credits, and audit the credit transaction ledger.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start md:self-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                className="border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs"
              >
                <Download className="size-4 mr-1.5 text-slate-500" />
                Export CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchLedger(pagination.page, true)}
                disabled={refreshing}
                className="border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs"
              >
                <RefreshCw className={`size-4 mr-1.5 text-slate-500 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              {allowed && (
                <Button
                  size="sm"
                  onClick={() => {
                    setAdjustModal({
                      open: true,
                      customerId: customerIdInput || '1',
                      customerName: activeCustomer?.companyName || activeCustomer?.name || '',
                      currentBalance: activeBalance || 0,
                      initialMode: 'add',
                    });
                  }}
                  className="bg-[#163A2E] hover:bg-[#163A2E]/90 text-white shadow-xs"
                >
                  <Plus className="size-4 mr-1.5" />
                  Adjust Credits
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Summary KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs relative overflow-hidden flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Total Credits Granted
              </p>
              <h3 className="text-2xl font-bold text-[#163A2E]">
                {loading ? '—' : totalGrantsAcrossTransactions}
              </h3>
              <p className="text-xs text-slate-400">Promotions, purchases & grants</p>
            </div>
            <div className="size-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <ArrowUpRight className="size-6" />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs relative overflow-hidden flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Total Credits Used
              </p>
              <h3 className="text-2xl font-bold text-slate-900">
                {loading ? '—' : totalSpentAcrossTransactions}
              </h3>
              <p className="text-xs text-slate-400">Post & media generations</p>
            </div>
            <div className="size-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <ArrowDownRight className="size-6" />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs relative overflow-hidden flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Audited Transactions
              </p>
              <h3 className="text-2xl font-bold text-[#163A2E]">
                {loading ? '—' : pagination.total || transactions.length}
              </h3>
              <p className="text-xs text-slate-400">Ledger entries on record</p>
            </div>
            <div className="size-12 rounded-xl bg-[#E8F1EC] text-[#163A2E] flex items-center justify-center">
              <CreditCard className="size-6" />
            </div>
          </div>
        </div>

        {/* Customer Wallet Lookup Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
          <div>
            <h3 className="text-base font-bold text-[#163A2E] flex items-center gap-2">
              <Wallet className="size-5 text-[#20C466]" />
              Customer Wallet Lookup & Manual Adjustment
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Search by customer ID to inspect real-time wallet balances, grant promotional credits, or adjust usage.
            </p>
          </div>

          <form onSubmit={handleLoadWallet} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <User className="size-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Enter Customer ID (e.g. 1, 2, 5...)"
                value={customerIdInput}
                onChange={(e) => setCustomerIdInput(e.target.value)}
                className="pl-9 h-10 text-sm rounded-xl border-slate-200"
              />
            </div>
            <Button
              type="submit"
              disabled={lookupLoading}
              className="bg-[#163A2E] hover:bg-[#163A2E]/90 text-white h-10 px-5 rounded-xl shadow-xs"
            >
              {lookupLoading ? 'Loading Wallet...' : 'Load Wallet'}
            </Button>
          </form>

          {/* Active Wallet Display */}
          {activeWalletRecord && (
            <div className="rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50/20 via-white to-emerald-50/40 p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-emerald-100">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-emerald-100 text-[#163A2E] flex items-center justify-center font-bold text-sm">
                    {activeCustomer?.companyName?.charAt(0) || activeCustomer?.name?.charAt(0) || 'C'}
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900">
                      {activeCustomer?.companyName || activeCustomer?.name || `Customer #${customerIdInput}`}
                    </h4>
                    <p className="text-xs text-slate-500">
                      Customer ID: #{activeCustomer?.id || customerIdInput}
                      {activeCustomer?.email && ` · ${activeCustomer.email}`}
                    </p>
                  </div>
                </div>

                {allowed && (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        setAdjustModal({
                          open: true,
                          customerId: activeCustomer?.id || customerIdInput,
                          customerName: activeCustomer?.companyName || activeCustomer?.name || '',
                          currentBalance: activeBalance || 0,
                          initialMode: 'add',
                        });
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 px-3 rounded-lg"
                    >
                      <Plus className="size-3.5 mr-1" />
                      Add Credits
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setAdjustModal({
                          open: true,
                          customerId: activeCustomer?.id || customerIdInput,
                          customerName: activeCustomer?.companyName || activeCustomer?.name || '',
                          currentBalance: activeBalance || 0,
                          initialMode: 'reduce',
                        });
                      }}
                      className="border-rose-200 text-rose-700 hover:bg-rose-50 text-xs h-8 px-3 rounded-lg"
                    >
                      <Minus className="size-3.5 mr-1" />
                      Reduce Credits
                    </Button>
                  </div>
                )}
              </div>

              {/* 3 Metric Cards for Wallet */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white rounded-xl border border-slate-200/80 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                      Available Balance
                    </span>
                    <Badge
                      variant="outline"
                      className={
                        activeBalance === 0
                          ? 'border-rose-200 bg-rose-50 text-rose-700 text-[10px]'
                          : activeBalance <= 5
                          ? 'border-amber-200 bg-amber-50 text-amber-700 text-[10px]'
                          : 'border-emerald-200 bg-emerald-50 text-emerald-700 text-[10px]'
                      }
                    >
                      {activeBalance === 0
                        ? 'Zero Balance'
                        : activeBalance <= 5
                        ? 'Low Credit'
                        : 'Healthy'}
                    </Badge>
                  </div>
                  <p className="text-2xl font-bold text-[#163A2E] mt-1">
                    {activeBalance ?? '0'} <span className="text-xs font-normal text-slate-400">credits</span>
                  </p>
                </div>

                <div className="bg-white rounded-xl border border-slate-200/80 p-4">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                    Total Earned
                  </span>
                  <p className="text-2xl font-bold text-slate-800 mt-1">
                    {activeWalletRecord?.totalEarned ?? '0'}{' '}
                    <span className="text-xs font-normal text-slate-400">credits</span>
                  </p>
                </div>

                <div className="bg-white rounded-xl border border-slate-200/80 p-4">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                    Total Spent
                  </span>
                  <p className="text-2xl font-bold text-slate-800 mt-1">
                    {activeWalletRecord?.totalSpent ?? '0'}{' '}
                    <span className="text-xs font-normal text-slate-400">credits</span>
                  </p>
                </div>
              </div>

              {/* Notifications */}
              {activeBalance === 0 && (
                <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-3 flex items-center gap-2.5 text-xs text-rose-800">
                  <AlertCircle className="size-4 shrink-0 text-rose-600" />
                  <span>This customer has depleted all AI credits. They cannot generate new content until credits are replenished.</span>
                </div>
              )}
              {activeBalance > 0 && activeBalance <= 5 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3 flex items-center gap-2.5 text-xs text-amber-800">
                  <AlertTriangle className="size-4 shrink-0 text-amber-600" />
                  <span>Low balance warning: Customer has only {activeBalance} credits remaining.</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Credit Transaction Ledger Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-[#163A2E]">
                Credit Transaction Ledger
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Audit trail of AI credit purchases, promotional grants, usage deductions, and refunds.
              </p>
            </div>

            {/* Filter toolbar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <div className="relative flex-1 sm:w-64">
                <Search className="size-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  placeholder="Search ledger..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-xs rounded-lg border-slate-200"
                />
              </div>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="h-9 w-full sm:w-[150px] text-xs rounded-lg border-slate-200">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Types</SelectItem>
                  <SelectItem value="PURCHASE">Purchase</SelectItem>
                  <SelectItem value="USAGE">Usage</SelectItem>
                  <SelectItem value="GRANT">Grant</SelectItem>
                  <SelectItem value="REFUND">Refund</SelectItem>
                  <SelectItem value="ADJUSTMENT">Adjustment</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            {loading ? (
              <div className="p-12 text-center space-y-3">
                <div className="size-8 mx-auto border-2 border-[#20C466] border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-slate-500">Loading transaction ledger...</p>
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="size-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                  <Coins className="size-6" />
                </div>
                <h4 className="text-sm font-semibold text-slate-800">No Transactions Found</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {searchQuery || typeFilter !== 'ALL'
                    ? 'No transactions match the selected filter criteria.'
                    : 'No credit transactions have been recorded yet.'}
                </p>
              </div>
            ) : (
              <>
                {/* Desktop View */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50/80 border-b border-slate-200 font-semibold text-slate-500 uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="py-3 px-4">Tx ID & Date</th>
                        <th className="py-3 px-4">Customer</th>
                        <th className="py-3 px-4">Type</th>
                        <th className="py-3 px-4">Service</th>
                        <th className="py-3 px-4">Credits</th>
                        <th className="py-3 px-4">Balance After</th>
                        <th className="py-3 px-4">Notes</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredTransactions.map((tx) => {
                        const isPositive = (tx.amount || 0) > 0 || tx.type === 'PURCHASE' || tx.type === 'GRANT';

                        return (
                          <tr key={tx.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-3 px-4">
                              <span className="font-semibold text-slate-900">#{tx.id}</span>
                              <p className="text-[11px] text-slate-400">
                                {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : '—'}
                              </p>
                            </td>

                            <td className="py-3 px-4">
                              <p className="font-medium text-slate-900">
                                {tx.customer?.companyName || tx.customer?.name || `Customer #${tx.customerId}`}
                              </p>
                              <span className="text-[11px] text-slate-400">ID: #{tx.customerId}</span>
                            </td>

                            <td className="py-3 px-4">
                              <Badge
                                variant="outline"
                                className={
                                  isPositive
                                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800 text-[10px]'
                                    : 'border-slate-200 bg-slate-100 text-slate-800 text-[10px]'
                                }
                              >
                                {tx.type}
                              </Badge>
                            </td>

                            <td className="py-3 px-4 font-mono text-[11px] text-slate-700">
                              {tx.serviceCode || 'MANUAL'}
                            </td>

                            <td className="py-3 px-4">
                              <span className={`font-bold ${isPositive ? 'text-emerald-700' : 'text-slate-800'}`}>
                                {isPositive ? `+${Math.abs(tx.amount || 0)}` : `-${Math.abs(tx.amount || 0)}`}
                              </span>
                            </td>

                            <td className="py-3 px-4 font-medium text-slate-900">
                              {tx.balanceAfter ?? '—'}
                            </td>

                            <td className="py-3 px-4 max-w-xs truncate text-slate-500" title={tx.notes}>
                              {tx.notes || '—'}
                            </td>

                            <td className="py-3 px-4 text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedTx(tx)}
                                className="h-7 px-2 text-xs text-slate-600 hover:text-[#163A2E]"
                              >
                                <Eye className="size-3.5 mr-1" />
                                Details
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile / Tablet Cards */}
                <div className="lg:hidden divide-y divide-slate-100">
                  {filteredTransactions.map((tx) => {
                    const isPositive = (tx.amount || 0) > 0 || tx.type === 'PURCHASE' || tx.type === 'GRANT';

                    return (
                      <div key={tx.id} className="p-4 space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-bold text-slate-900 text-xs">Tx #{tx.id}</span>
                            <p className="text-[11px] text-slate-400">
                              {tx.createdAt ? new Date(tx.createdAt).toLocaleString() : '—'}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className={
                              isPositive
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-800 text-[10px]'
                                : 'border-slate-200 bg-slate-100 text-slate-800 text-[10px]'
                            }
                          >
                            {tx.type}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <div>
                            <p className="font-semibold text-slate-800">
                              {tx.customer?.companyName || tx.customer?.name || `Customer #${tx.customerId}`}
                            </p>
                            <span className="text-[11px] text-slate-400">ID: #{tx.customerId}</span>
                          </div>
                          <div className="text-right">
                            <span className={`font-bold text-sm ${isPositive ? 'text-emerald-700' : 'text-slate-800'}`}>
                              {isPositive ? `+${Math.abs(tx.amount || 0)}` : `-${Math.abs(tx.amount || 0)}`}
                            </span>
                            <p className="text-[10px] text-slate-400">After: {tx.balanceAfter}</p>
                          </div>
                        </div>

                        {tx.notes && (
                          <p className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded border border-slate-100">
                            {tx.notes}
                          </p>
                        )}

                        <div className="flex justify-end pt-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedTx(tx)}
                            className="h-7 text-xs"
                          >
                            <Eye className="size-3.5 mr-1" />
                            View Audit
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2 text-xs text-slate-500">
              <span>
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => fetchLedger(pagination.page - 1)}
                  className="h-8 text-xs"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => fetchLedger(pagination.page + 1)}
                  className="h-8 text-xs"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Adjust Credits Dialog */}
      <AdjustCreditsDialog
        open={adjustModal.open}
        onOpenChange={(open) => setAdjustModal((prev) => ({ ...prev, open }))}
        customerId={adjustModal.customerId}
        customerName={adjustModal.customerName}
        currentBalance={adjustModal.currentBalance}
        initialMode={adjustModal.initialMode}
        onSuccess={handleRefreshActiveWallet}
      />

      {/* Transaction Details Drawer */}
      <TransactionDetailDrawer
        transaction={selectedTx}
        open={Boolean(selectedTx)}
        onClose={() => setSelectedTx(null)}
      />
    </div>
  );
}
