'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Download,
  RefreshCw,
  Eye,
  KeyRound,
  RotateCcw,
  CreditCard,
  Mail,
  Phone,
  Calendar,
  ExternalLink,
  ShieldCheck,
  UserCheck,
  Search,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import {
  AdminPageHeader,
  AdminStatCard,
  AdminStatusTabs,
  AdminSearchInput,
  AdminDataTable,
  AdminPagination,
  AdminStatusBadge,
  AdminButton,
  AdminEmptyState,
  CustomerDetailsDrawer,
  ResetCustomerDataModal,
  ColumnDef,
} from '@/components/admin';
import { getErrorMessage } from '@/lib/utils';

type FilterStatus = 'ALL' | 'ACTIVE' | 'PENDING_ACTIVATION' | 'INACTIVE';

interface CustomerRecord {
  id: number;
  companyName: string;
  name?: string;
  email?: string | null;
  phone?: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  customerStatus?: 'ACTIVE' | 'INACTIVE';
  subscriptionStatus?: 'ACTIVE' | 'PENDING_ACTIVATION' | 'INACTIVE';
  planName?: string | null;
  subscriptionStartDate?: string | null;
  subscriptionEndDate?: string | null;
  activationDate?: string | null;
  purchaseDate?: string | null;
  originLeadId?: number | null;
  userId?: number | null;
  city?: string | null;
  state?: string | null;
  createdAt?: string | null;
  subscriptions?: any[];
}

export default function CustomersPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore(state => state.user);
  const canDelete = Boolean(
    user && (
      ['ADMIN', 'SUPER_ADMIN', 'COMPANY_ADMIN'].includes(String(user.accountType || '').toUpperCase().trim()) ||
      ['ADMIN', 'SUPER_ADMIN', 'COMPANY_ADMIN'].includes(String(user.role || '').toUpperCase().trim()) ||
      (Array.isArray(user.roles) && user.roles.some(r => ['ADMIN', 'SUPER_ADMIN', 'COMPANY_ADMIN'].includes(String(r || '').toUpperCase().trim())))
    )
  );
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [deleting, setDeleting] = useState(false);


  // Filters & Search
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('ALL');

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals & Drawers
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [resetModalCustomer, setResetModalCustomer] = useState<{ id: number; name: string } | null>(null);

  // Account creation state
  const [creatingAccountCustomer, setCreatingAccountCustomer] = useState<CustomerRecord | null>(null);
  const [accountPassword, setAccountPassword] = useState('');
  const [isSubmittingAccount, setIsSubmittingAccount] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Fetch customers from backend API
  const {
    data: responseData,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['customers-list', search],
    queryFn: async () => {
      const res: any = await api.get('/customers', {
        params: { search: search || undefined },
      });
      return res?.data ?? res;
    },
    refetchInterval: 20000,
  });

  // Extract list and counts from response
  const rawList: CustomerRecord[] = useMemo(() => {
    if (!responseData) return [];
    if (Array.isArray(responseData)) return responseData;
    if (Array.isArray(responseData.data)) return responseData.data;
    if (Array.isArray(responseData.items)) return responseData.items;
    return [];
  }, [responseData]);

  // Derive counts
  const counts = useMemo(() => {
    const all = rawList.length;
    const active = rawList.filter((c) => c.status === 'ACTIVE').length;
    const pendingActivation = rawList.filter(
      (c) => c.subscriptionStatus === 'PENDING_ACTIVATION' && c.status !== 'ACTIVE'
    ).length;
    const inactive = rawList.filter(
      (c) => c.status === 'INACTIVE' && c.subscriptionStatus !== 'PENDING_ACTIVATION'
    ).length;

    return { all, active, pendingActivation, inactive };
  }, [rawList]);

  // Filter list based on selected status tab
  const filteredList = useMemo(() => {
    if (statusFilter === 'ALL') return rawList;
    if (statusFilter === 'ACTIVE') {
      return rawList.filter((c) => c.status === 'ACTIVE');
    }
    if (statusFilter === 'PENDING_ACTIVATION') {
      return rawList.filter((c) => c.subscriptionStatus === 'PENDING_ACTIVATION');
    }
    if (statusFilter === 'INACTIVE') {
      return rawList.filter((c) => c.status === 'INACTIVE');
    }
    return rawList;
  }, [rawList, statusFilter]);

  // Client-side pagination
  const totalItems = filteredList.length;
  const totalPages = Math.max(Math.ceil(totalItems / pageSize), 1);
  const paginatedList = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    return filteredList.slice(startIndex, startIndex + pageSize);
  }, [filteredList, page, pageSize]);

  useEffect(() => { setSelectedIds([]); }, [page, pageSize, search, statusFilter]);
  useEffect(() => { setSelectedIds(ids => ids.filter(id => rawList.some(c => c.id === id))); }, [rawList]);
  const deleteCustomers = async (ids: number[]) => {
    if (!ids.length || deleting) return;
    const count = ids.length;
    const confirmMessage =
      count === 1
        ? 'Are you sure you want to delete this customer? This will remove the customer profile and cancel active subscriptions.'
        : `Are you sure you want to delete ${count} selected customers? This will remove the customer profiles and cancel active subscriptions.`;
    if (!window.confirm(confirmMessage)) return;
    setDeleting(true);
    try {
      if (count === 1) {
        await api.delete(`/customers/${ids[0]}`, { params: { cancelSubscriptions: true } });
      } else {
        await api.post('/customers/bulk-delete', { ids, cancelSubscriptions: true });
      }
      setSelectedIds([]);
      if (selectedCustomerId && ids.includes(selectedCustomerId)) {
        setIsDrawerOpen(false);
        setSelectedCustomerId(null);
      }
      setPage(1);
      toast.success(count === 1 ? 'Customer deleted successfully' : `${count} customers deleted successfully`);
      await queryClient.invalidateQueries({ queryKey: ['customers-list'] });
      await queryClient.invalidateQueries({ queryKey: ['employee-customers'] });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  // Date formatter
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

  // Export CSV handler
  const handleExportCSV = () => {
    if (filteredList.length === 0) {
      toast.error('No customers to export.');
      return;
    }

    const headers = [
      'Customer ID',
      'Company Name',
      'Email',
      'Phone',
      'Status',
      'Subscription Status',
      'Plan Name',
      'Purchase Date',
      'Activation Date',
      'Origin Lead ID',
      'Has User Account',
    ];

    const rows = filteredList.map((c) => [
      `CUST-${String(c.id).padStart(4, '0')}`,
      `"${(c.companyName || '').replace(/"/g, '""')}"`,
      c.email || '',
      c.phone || '',
      c.status,
      c.subscriptionStatus || '',
      `"${(c.planName || 'No Active Plan').replace(/"/g, '""')}"`,
      formatDate(c.purchaseDate || c.createdAt),
      formatDate(c.activationDate || c.subscriptionStartDate),
      c.originLeadId || '',
      c.userId ? 'Yes' : 'No',
    ]);

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `customers_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Customers exported successfully.');
  };

  // Create initial login account for customer
  const handleCreateAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!creatingAccountCustomer) return;

    if (!accountPassword || accountPassword.length < 10) {
      toast.error('Password must be at least 10 characters long.');
      return;
    }

    setIsSubmittingAccount(true);
    try {
      await api.post(`/customers/${creatingAccountCustomer.id}/account`, {
        password: accountPassword,
      });
      toast.success(
        `Account created for ${creatingAccountCustomer.companyName}. Login credentials can now be shared securely.`
      );
      setCreatingAccountCustomer(null);
      setAccountPassword('');
      await queryClient.invalidateQueries({ queryKey: ['customers-list'] });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsSubmittingAccount(false);
    }
  };

  // Define Table Columns
  const columns: ColumnDef<CustomerRecord>[] = [
    ...(canDelete ? [{
      key: 'selection',
      header: <input aria-label="Select all customers on this page" type="checkbox" disabled={deleting || !paginatedList.length || paginatedList.length > 100} checked={paginatedList.length > 0 && paginatedList.every(c => selectedIds.includes(c.id))} onChange={e => setSelectedIds(e.target.checked ? paginatedList.map(c => c.id) : [])} />,
      render: (c: CustomerRecord) => <input aria-label={`Select ${c.companyName}`} type="checkbox" disabled={deleting || (!selectedIds.includes(c.id) && selectedIds.length >= 100)} checked={selectedIds.includes(c.id)} onClick={e => e.stopPropagation()} onChange={e => setSelectedIds(ids => e.target.checked ? [...ids, c.id] : ids.filter(id => id !== c.id))} />,
    }] : []),
    {
      key: 'customer',
      header: 'Customer / Workspace',
      render: (c) => (
        <div className="flex flex-col gap-1 min-w-[180px]">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-900 hover:text-[#23C45E] transition-colors cursor-pointer"
              onClick={() => {
                setSelectedCustomerId(c.id);
                setIsDrawerOpen(true);
              }}
            >
              {c.companyName}
            </span>
            {c.userId && (
              <span title="Login Account Active" className="inline-flex items-center text-[#1AA14D]">
                <UserCheck className="w-3.5 h-3.5" />
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold">
              CUST-{String(c.id).padStart(4, '0')}
            </span>
            {c.originLeadId && (
              <span className="text-[10px] bg-purple-50 text-purple-700 border border-purple-200 px-1.5 py-0.2 rounded font-bold">
                Won Lead #{c.originLeadId}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Contact Details',
      render: (c) => (
        <div className="flex flex-col gap-0.5 text-xs">
          {c.email ? (
            <div className="flex items-center gap-1.5 text-slate-700">
              <Mail className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="truncate max-w-[180px]">{c.email}</span>
            </div>
          ) : (
            <span className="text-slate-400 text-xs italic">No email</span>
          )}
          {c.phone && (
            <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
              <Phone className="w-3 h-3 text-slate-400 shrink-0" />
              <span>{c.phone}</span>
            </div>
          )}
          {(c.city || c.state) && (
            <span className="text-[10px] text-slate-400">
              {[c.city, c.state].filter(Boolean).join(', ')}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (c) => {
        const isActive = c.status === 'ACTIVE';
        const isPending = c.subscriptionStatus === 'PENDING_ACTIVATION' && !isActive;

        if (isActive) {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black bg-[#E8F9EE] text-[#1AA14D] border border-[#23C45E]/30 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#23C45E]" />
              Active
            </span>
          );
        }

        if (isPending) {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              Pending Activation
            </span>
          );
        }

        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black bg-slate-100 text-slate-600 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Inactive
          </span>
        );
      },
    },
    {
      key: 'plan',
      header: 'Subscription Plan',
      render: (c) => (
        <div className="flex flex-col gap-0.5">
          <span className={`font-bold ${c.planName ? 'text-slate-900' : 'text-slate-400 italic'}`}>
            {c.planName || 'No Active Plan'}
          </span>
          {c.subscriptionStartDate && c.subscriptionEndDate && (
            <span className="text-[10px] text-slate-500 font-medium">
              {formatDate(c.subscriptionStartDate)} - {formatDate(c.subscriptionEndDate)}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'activationSchedule',
      header: 'Activation Schedule',
      render: (c) => {
        const isPending = c.subscriptionStatus === 'PENDING_ACTIVATION';
        return (
          <div className="flex flex-col gap-0.5 text-xs text-slate-600">
            <div className="flex items-center gap-1 text-[11px]">
              <span className="text-slate-400 font-medium">Purchased:</span>
              <span>{formatDate(c.purchaseDate || c.createdAt)}</span>
            </div>
            <div className="flex items-center gap-1 text-[11px]">
              <span className="text-slate-400 font-medium">Activates:</span>
              <span className={isPending ? 'font-bold text-amber-800' : 'text-slate-700'}>
                {formatDate(c.activationDate || c.subscriptionStartDate)}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      headerClassName: 'text-right',
      render: (c) => (
        <div className="flex items-center justify-end gap-1.5">
          {canDelete && (
            <button
              type="button"
              disabled={deleting}
              onClick={(e) => {
                e.stopPropagation();
                deleteCustomers([c.id]);
              }}
              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 disabled:opacity-50 transition-colors cursor-pointer"
              title="Delete customer"
              aria-label={`Delete ${c.companyName}`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setSelectedCustomerId(c.id);
              setIsDrawerOpen(true);
            }}
            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            title="View Customer Overview"
          >
            <Eye className="w-4 h-4" />
          </button>

          <Link
            href={`/subscribe?customerId=${c.id}`}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-[#1AA14D] bg-[#E8F9EE] hover:bg-[#d8f5e1] border border-[#23C45E]/30 rounded-lg transition-colors cursor-pointer"
            title="Choose or change subscription plan"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Plan</span>
          </Link>

          {!c.userId && c.email && (
            <button
              type="button"
              onClick={() => {
                setCreatingAccountCustomer(c);
                setAccountPassword('');
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
              title="Create login credentials for customer"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Login</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setResetModalCustomer({ id: c.id, name: c.companyName })}
            className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
            title="Reset Customer Data"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-full pb-16">
      {/* 1. Header with Title & Action Buttons */}
      <AdminPageHeader
        title="Customers"
        description="Manage customer accounts, subscriptions, activation schedules, and billing status."
        icon={Building2}
        actions={
          <div className="flex items-center gap-2.5 flex-wrap">
            <AdminButton
              variant="outline"
              size="sm"
              icon={RefreshCw}
              loading={isFetching}
              onClick={() => refetch()}
            >
              Refresh
            </AdminButton>

            <AdminButton
              variant="outline"
              size="sm"
              icon={Download}
              onClick={handleExportCSV}
            >
              Export CSV
            </AdminButton>
          </div>
        }
      />

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <AdminStatCard
          title="Total Customers"
          value={counts.all}
          description="Registered organizations"
          icon={Building2}
          iconBg="blue"
          loading={isLoading}
        />
        <AdminStatCard
          title="Active Customers"
          value={counts.active}
          description="Verified active subscriptions"
          icon={CheckCircle2}
          iconBg="primary"
          loading={isLoading}
        />
        <AdminStatCard
          title="Pending Activation"
          value={counts.pendingActivation}
          description="2-day activation delay scheduled"
          icon={Clock}
          iconBg="amber"
          loading={isLoading}
        />
        <AdminStatCard
          title="Inactive / Won Leads"
          value={counts.inactive}
          description="Awaiting subscription purchase"
          icon={AlertCircle}
          iconBg="slate"
          loading={isLoading}
        />
      </div>

      {/* 3. Filter Controls: Tabs & Search */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <AdminStatusTabs
            tabs={[
              { key: 'ALL', label: 'All Customers', count: counts.all },
              { key: 'ACTIVE', label: 'Active', count: counts.active },
              { key: 'PENDING_ACTIVATION', label: 'Pending Activation', count: counts.pendingActivation },
              { key: 'INACTIVE', label: 'Inactive', count: counts.inactive },
            ]}
            activeTab={statusFilter}
            onChange={(key) => {
              setStatusFilter(key as FilterStatus);
              setPage(1);
            }}
            autoSortAlphabetical={false}
          />

          <div className="w-full md:w-72">
            <AdminSearchInput
              value={searchInput}
              onChange={setSearchInput}
              placeholder="Search by name, email, phone..."
            />
          </div>
        </div>

        {/* API Error Alert (Distinguished from 404 Route Error) */}
        {isError && (
          <div
            role="alert"
            className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-rose-800 text-xs font-semibold"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Failed to load customer records: {getErrorMessage(error)}</span>
            </div>
            <button
              onClick={() => refetch()}
              className="px-3 py-1 bg-white border border-rose-200 hover:bg-rose-100 rounded-lg text-rose-900 font-bold transition-colors cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {canDelete && selectedIds.length > 0 && (
          <div className="flex items-center justify-between gap-3 px-4 py-3 bg-rose-50/70 border border-rose-200 rounded-2xl animate-in fade-in duration-150">
            <div className="flex items-center gap-2 text-xs font-bold text-rose-900">
              <span className="w-6 h-6 rounded-lg bg-rose-200 text-rose-800 flex items-center justify-center font-extrabold text-[11px]">
                {selectedIds.length}
              </span>
              <span>
                {selectedIds.length === 1 ? 'customer selected' : 'customers selected'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setSelectedIds([])}
                className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              >
                Clear selection
              </button>
              <AdminButton
                variant="danger"
                size="sm"
                icon={Trash2}
                loading={deleting}
                onClick={() => deleteCustomers(selectedIds)}
              >
                Delete Selected ({selectedIds.length})
              </AdminButton>
            </div>
          </div>
        )}
      {/* 4. Customers Data Table */}
        <AdminDataTable
          columns={columns}
          data={paginatedList}
          loading={isLoading}
          emptyTitle="No customers found"
          emptyDescription={
            search || statusFilter !== 'ALL'
              ? 'No customer records match your active search and filter criteria.'
              : 'No customer workspaces exist in the system yet. Converted Won leads will automatically appear here.'
          }
          onRowClick={(item) => {
            setSelectedCustomerId(item.id);
            setIsDrawerOpen(true);
          }}
        />

        {/* 5. Pagination */}
        {totalItems > 0 && (
          <AdminPagination
            page={page}
            pageSize={pageSize}
            total={totalItems}
            totalPages={totalPages}
            onPageChange={setPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setPage(1);
            }}
          />
        )}
      </div>

      {/* 6. Customer Details Drawer */}
      <CustomerDetailsDrawer
        customerId={selectedCustomerId}
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedCustomerId(null);
        }}
        onDelete={canDelete ? (id) => deleteCustomers([id]) : undefined}
      />

      {/* 7. Reset Customer Data Modal */}
      {resetModalCustomer && (
        <ResetCustomerDataModal
          isOpen={Boolean(resetModalCustomer)}
          onClose={() => setResetModalCustomer(null)}
          customerId={resetModalCustomer.id}
          companyName={resetModalCustomer.name}
          onSuccess={() => {
            setResetModalCustomer(null);
            queryClient.invalidateQueries({ queryKey: ['customers-list'] });
          }}
        />
      )}

      {/* 8. Create Customer Login Account Modal */}
      {creatingAccountCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <KeyRound className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-slate-900 text-sm">
                  Create Customer Login
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCreatingAccountCustomer(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 font-medium">
              Set an initial account password for{' '}
              <strong className="text-slate-800">{creatingAccountCustomer.companyName}</strong> (
              {creatingAccountCustomer.email}). The customer will use this to sign in to the portal.
            </p>

            <form onSubmit={handleCreateAccountSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Initial Password (min 10 characters)
                </label>
                <input
                  type="password"
                  value={accountPassword}
                  onChange={(e) => setAccountPassword(e.target.value)}
                  placeholder="Enter secure initial password..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
                  autoFocus
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <AdminButton
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCreatingAccountCustomer(null)}
                >
                  Cancel
                </AdminButton>
                <AdminButton
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={isSubmittingAccount}
                >
                  Create Account
                </AdminButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
