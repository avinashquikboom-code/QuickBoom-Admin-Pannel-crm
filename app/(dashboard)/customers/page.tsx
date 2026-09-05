'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  Plus,
  Users,
  DollarSign,
  TrendingUp,
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  Edit2,
  Trash2,
  Sparkles,
  RefreshCw,
  Layers,
  ArrowRight,
  Filter,
  Globe,
  Mail,
  Phone,
  Calendar,
  UserCheck,
  UserX,
  Briefcase,
  Sliders,
  ChevronDown,
  X,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Tag,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';
import { getErrorMessage } from '@/lib/utils';
import { AdminPagination, AdminFormDrawer, CustomerDetailsDrawer, ResetCustomerDataModal } from '@/components/admin';

export default function CustomersPage() {
  const queryClient = useQueryClient();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [assignedFilter, setAssignedFilter] = useState('ALL');
  const [companyFilter, setCompanyFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);

  // Drawer / Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<any | null>(null);
  const [resettingCustomer, setResettingCustomer] = useState<any | null>(null);
  const [viewingCustomerId, setViewingCustomerId] = useState<number | string | null>(null);

  // Form State for Add / Edit
  const [customerForm, setCustomerForm] = useState({
    name: '',
    companyName: '',
    email: '',
    phone: '',
    alternatePhone: '',
    address: '',
    city: '',
    state: '',
    country: 'India',
    pincode: '',
    customerType: 'ENTERPRISE',
    industry: 'Information Technology',
    source: 'DIRECT',
    status: 'ACTIVE',
    assignedEmployee: 'Rahul Sharma',
    department: 'Sales & BD',
    notes: '',
  });

  // 1. Fetch KPI Metrics
  const { data: metrics } = useQuery({
    queryKey: ['customers-metrics'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/customers/metrics');
        return res?.data?.data || res?.data || res;
      } catch {
        return {
          totalCustomers: 0,
          activeCustomers: 0,
          newCustomers: 0,
          inactiveCustomers: 0,
          customersWithOpenDeals: 0,
        };
      }
    },
  });

  // 2. Fetch Customers List
  const { data: customerData, isLoading, refetch } = useQuery({
    queryKey: [
      'customers-list',
      searchTerm,
      statusFilter,
      sourceFilter,
      assignedFilter,
      companyFilter,
      dateFrom,
      dateTo,
      sortBy,
      sortOrder,
      page,
      pageSize,
    ],
    queryFn: async () => {
      try {
        const res: any = await api.get('/customers', {
          params: {
            search: searchTerm || undefined,
            status: statusFilter !== 'ALL' ? statusFilter : undefined,
            source: sourceFilter !== 'ALL' ? sourceFilter : undefined,
            assignedEmployee: assignedFilter !== 'ALL' ? assignedFilter : undefined,
            company: companyFilter || undefined,
            dateFrom: dateFrom || undefined,
            dateTo: dateTo || undefined,
            sortBy,
            sortOrder,
            page,
            limit: pageSize,
          },
        });
        const items = res?.data?.data || res?.data?.items || (Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : res?.items || []);
        const pagination = res?.pagination || res?.meta || res?.data?.pagination || res?.data?.meta || {
          page,
          pageSize,
          total: Array.isArray(items) ? items.length : 0,
          totalPages: 1,
        };
        return {
          items: Array.isArray(items) ? items : [],
          pagination: {
            page: Number(pagination.page) || page,
            pageSize: Number(pagination.pageSize || pagination.limit) || pageSize,
            total: Number(pagination.total) || (Array.isArray(items) ? items.length : 0),
            totalPages: Number(pagination.totalPages) || 1,
          },
        };
      } catch {
        return {
          items: [],
          pagination: { page: 1, pageSize, total: 0, totalPages: 1 },
        };
      }
    },
  });

  const customers: any[] = customerData?.items || [];
  const meta = customerData?.pagination || { total: customers.length, page: 1, pageSize: 20, totalPages: 1 };

  // Create Customer Mutation
  const createMutation = useMutation({
    mutationFn: async (payload: typeof customerForm) => {
      return api.post('/customers', payload);
    },
    onSuccess: () => {
      toast.success('Customer profile created successfully!', { icon: '🏢' });
      setIsCreateOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['customers-list'] });
      queryClient.invalidateQueries({ queryKey: ['customers-metrics'] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  // Update Customer Mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: number | string; payload: any }) => {
      return api.patch(`/customers/${id}`, payload);
    },
    onSuccess: () => {
      toast.success('Customer updated successfully!', { icon: '✅' });
      setEditingCustomer(null);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['customers-list'] });
      queryClient.invalidateQueries({ queryKey: ['customers-metrics'] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  // Delete Customer Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number | string) => {
      return api.delete(`/customers/${id}`);
    },
    onSuccess: () => {
      toast.success('Customer archived successfully.', { icon: '🗑️' });
      setDeletingCustomer(null);
      queryClient.invalidateQueries({ queryKey: ['customers-list'] });
      queryClient.invalidateQueries({ queryKey: ['customers-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['billing'] });
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  const resetForm = () => {
    setCustomerForm({
      name: '',
      companyName: '',
      email: '',
      phone: '',
      alternatePhone: '',
      address: '',
      city: '',
      state: '',
      country: 'India',
      pincode: '',
      customerType: 'ENTERPRISE',
      industry: 'Information Technology',
      source: 'DIRECT',
      status: 'ACTIVE',
      assignedEmployee: 'Rahul Sharma',
      department: 'Sales & BD',
      notes: '',
    });
  };

  const handleOpenEdit = (cust: any) => {
    setEditingCustomer(cust);
    setCustomerForm({
      name: cust.name || '',
      companyName: cust.companyName || cust.company || '',
      email: cust.email !== 'N/A' ? cust.email : '',
      phone: cust.phone !== 'N/A' ? cust.phone : '',
      alternatePhone: cust.alternatePhone || '',
      address: cust.address || '',
      city: cust.city !== 'N/A' ? cust.city : '',
      state: cust.state !== 'N/A' ? cust.state : '',
      country: cust.country || 'India',
      pincode: cust.pincode || '',
      customerType: cust.customerType || 'ENTERPRISE',
      industry: cust.industry || 'Information Technology',
      source: cust.source || 'DIRECT',
      status: cust.status || (cust.isActive ? 'ACTIVE' : 'INACTIVE'),
      assignedEmployee: cust.assignedEmployee !== 'Unassigned' ? cust.assignedEmployee : 'Rahul Sharma',
      department: cust.department !== 'General' ? cust.department : 'Sales & BD',
      notes: cust.notes || '',
    });
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerForm.name.trim() || !customerForm.phone.trim()) {
      toast.error('Please enter Customer Name and Phone number');
      return;
    }

    if (editingCustomer) {
      updateMutation.mutate({
        id: editingCustomer.id,
        payload: {
          ...customerForm,
          isActive: customerForm.status === 'ACTIVE',
        },
      });
    } else {
      createMutation.mutate(customerForm);
    }
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-16 text-slate-800 animate-in fade-in-50 duration-200">
      {/* 1. HERO HEADER */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#23C45E]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full bg-[#23C45E]/20 text-[#23C45E] border border-[#23C45E]/30 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                Customer CRM & Account Hub
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Customer Master Management</h1>
            <p className="text-slate-300 text-xs sm:text-sm font-medium max-w-2xl">
              Track client organizations, assign relationship managers, monitor open deals, and manage customer account lifecycle.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                resetForm();
                setIsCreateOpen(true);
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#23C45E] hover:bg-[#1AA14D] text-slate-950 font-black rounded-2xl text-xs transition-all cursor-pointer shadow-lg shadow-[#23C45E]/20"
            >
              <Plus className="w-4 h-4" />
              <span>Add Customer</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. 5 KPI STAT CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">Total Customers</p>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{metrics?.totalCustomers || meta.total}</p>
          <p className="text-[10px] text-slate-400 font-bold mt-0.5">Overall client base</p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">Active Customers</p>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600 mt-2">{metrics?.activeCustomers || meta.total}</p>
          <p className="text-[10px] text-emerald-700 font-bold mt-0.5">Active subscriptions</p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">New Customers</p>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-purple-600 mt-2">{metrics?.newCustomers || 0}</p>
          <p className="text-[10px] text-purple-700 font-bold mt-0.5">Last 30 days</p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">Inactive</p>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <UserX className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-600 mt-2">{metrics?.inactiveCustomers || 0}</p>
          <p className="text-[10px] text-rose-700 font-bold mt-0.5">Paused / Archived</p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">With Open Deals</p>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-600 mt-2">{metrics?.customersWithOpenDeals || 0}</p>
          <p className="text-[10px] text-amber-700 font-bold mt-0.5">In sales pipeline</p>
        </div>
      </div>

      {/* 3. TOOLBAR & ADVANCED FILTER PANEL */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by customer name, company, email, phone, or ID..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-900 focus:outline-none focus:border-[#23C45E]"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <button
              onClick={() => setIsFilterExpanded(!isFilterExpanded)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer border ${
                isFilterExpanded
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Filter className="w-3.5 h-3.5 text-[#23C45E]" />
              <span>Filters</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isFilterExpanded ? 'rotate-180' : ''}`} />
            </button>

            <button
              onClick={() => refetch()}
              className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-2xl transition-all cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Collapsible Filter Bar */}
        {isFilterExpanded && (
          <div className="pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 animate-in fade-in-50 duration-150 text-xs">
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active Only</option>
                <option value="INACTIVE">Inactive Only</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Source</label>
              <select
                value={sourceFilter}
                onChange={(e) => {
                  setSourceFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
              >
                <option value="ALL">All Sources</option>
                <option value="DIRECT">Direct</option>
                <option value="WEBSITE">Website</option>
                <option value="REFERRAL">Referral</option>
                <option value="GOOGLE_PLACES">Google Places</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Assigned Employee</label>
              <select
                value={assignedFilter}
                onChange={(e) => {
                  setAssignedFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
              >
                <option value="ALL">All Employees</option>
                <option value="Rahul Sharma">Rahul Sharma</option>
                <option value="Pooja Verma">Pooja Verma</option>
                <option value="Amit Shah">Amit Shah</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Company Filter</label>
              <input
                type="text"
                placeholder="Filter by company..."
                value={companyFilter}
                onChange={(e) => {
                  setCompanyFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Date From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Date To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
              />
            </div>
          </div>
        )}
      </div>

      {/* 4. CUSTOMER MASTER TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-black text-slate-900 text-base">Customer Directory</h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Showing {customers.length} of {meta.total} records
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
            <span>Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-800"
            >
              <option value="createdAt">Created Date</option>
              <option value="name">Customer Name</option>
              <option value="city">City</option>
              <option value="isActive">Status</option>
            </select>
          </div>
        </div>

        {customers.length === 0 ? (
          <div className="py-16 text-center text-slate-400 font-bold text-xs">
            No customer accounts found matching your query.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 font-black uppercase border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3.5">Customer</th>
                  <th className="px-4 py-3.5">Active Plan & Billing</th>
                  <th className="px-4 py-3.5">Validity Dates</th>
                  <th className="px-4 py-3.5">Contact Details</th>
                  <th className="px-4 py-3.5">Assigned RM</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {customers.map((cust) => {
                  const planName = cust.plan || 'No Active Plan';
                  const hasActiveSub = cust.subscriptionStatus === 'ACTIVE';
                  const isExpiredSub = cust.subscriptionStatus === 'EXPIRED';

                  return (
                    <tr key={cust.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-800 font-black text-xs flex items-center justify-center border border-slate-200 shrink-0">
                            {cust.name?.charAt(0) || 'C'}
                          </div>
                          <div>
                            <button
                              type="button"
                              onClick={() => setViewingCustomerId(cust.id)}
                              className="font-black text-slate-900 text-sm hover:text-[#1AA14D] transition-colors block text-left cursor-pointer"
                            >
                              {cust.name}
                            </button>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-slate-400 font-medium text-[11px]">
                                {cust.companyName || cust.company || 'Direct Client'}
                              </span>
                              <span className="text-slate-300">•</span>
                              <span className="font-mono text-[10px] font-bold text-slate-400">
                                {cust.customerId || `CUST-${String(cust.id).padStart(4, '0')}`}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        {planName !== 'No Active Plan' ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-black text-[11px] border border-emerald-200">
                                {planName}
                              </span>
                            </div>
                            <p className="text-[11px] font-bold text-slate-500 capitalize">
                              {cust.billingCycle || 'Monthly'} Billing {cust.subscriptionAmount ? `• ₹${cust.subscriptionAmount.toLocaleString('en-IN')}` : ''}
                            </p>
                          </div>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 font-bold text-[11px]">
                            No Active Plan
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-4">
                        {cust.subscriptionStartDate && cust.subscriptionEndDate ? (
                          <div className="space-y-0.5 text-[11px]">
                            <p className="font-bold text-slate-800">
                              {new Date(cust.subscriptionStartDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                              {' → '}
                              {new Date(cust.subscriptionEndDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </p>
                            <p className="text-slate-400 font-medium text-[10px]">
                              {isExpiredSub ? (
                                <span className="text-rose-600 font-bold">Expired</span>
                              ) : (
                                <span>Active Cycle</span>
                              )}
                            </p>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px] font-medium">—</span>
                        )}
                      </td>

                      <td className="px-4 py-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1 text-slate-800 font-bold">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span>{cust.email || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-1 text-slate-500 text-[11px]">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{cust.phone || 'N/A'}</span>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-bold text-[11px] inline-flex items-center gap-1">
                          <UserCheck className="w-3 h-3" />
                          {cust.assignedEmployee || 'Unassigned'}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        {hasActiveSub ? (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 font-black text-[10px] inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            ACTIVE
                          </span>
                        ) : isExpiredSub ? (
                          <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 font-black text-[10px] inline-flex items-center gap-1">
                            <XCircle className="w-3 h-3" />
                            EXPIRED
                          </span>
                        ) : cust.isActive ? (
                          <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-black text-[10px] inline-flex items-center gap-1">
                            ACTIVE
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 font-black text-[10px] inline-flex items-center gap-1">
                            <XCircle className="w-3 h-3" />
                            INACTIVE
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(cust)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all cursor-pointer"
                            title="Edit Customer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setDeletingCustomer(cust)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-bold transition-all cursor-pointer"
                            title="Archive Customer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setResettingCustomer(cust)}
                            className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-xs font-bold transition-all cursor-pointer"
                            title="Reset Customer Data"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setViewingCustomerId(cust.id)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-[#23C45E] hover:bg-[#1AA14D] text-slate-950 font-black rounded-lg text-xs transition-all cursor-pointer shadow-2xs"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Details</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Server-Side Pagination */}
        <AdminPagination
          page={page}
          pageSize={pageSize}
          total={meta.total}
          totalPages={meta.totalPages || Math.ceil(meta.total / pageSize) || 1}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
          disabled={isLoading}
        />
      </div>

      {/* 5. ADD / EDIT CUSTOMER RIGHT-SIDE DRAWER */}
      <AdminFormDrawer
        isOpen={isCreateOpen || !!editingCustomer}
        onClose={() => {
          setIsCreateOpen(false);
          setEditingCustomer(null);
        }}
        title={editingCustomer ? 'Edit Customer Profile' : 'Add New Customer'}
        description="Fill in customer profile information, business contact parameters, and employee allocation."
        icon={Building2}
        maxWidth="sm:max-w-[580px]"
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <button
              type="button"
              onClick={() => {
                setIsCreateOpen(false);
                setEditingCustomer(null);
              }}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleFormSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="px-5 py-2.5 bg-[#23C45E] hover:bg-[#1AA14D] text-slate-950 font-black rounded-xl text-xs transition-all cursor-pointer shadow-md disabled:opacity-50"
            >
              {createMutation.isPending || updateMutation.isPending
                ? 'Saving...'
                : editingCustomer
                ? 'Update Customer'
                : 'Create Customer'}
            </button>
          </div>
        }
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black uppercase text-slate-700 mb-1">Customer Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Acme Enterprise"
                value={customerForm.name}
                onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-[#23C45E]"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-slate-700 mb-1">Company / Organization</label>
              <input
                type="text"
                placeholder="e.g. Acme Global Holdings Ltd"
                value={customerForm.companyName}
                onChange={(e) => setCustomerForm({ ...customerForm, companyName: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-[#23C45E]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-black uppercase text-slate-700 mb-1">Email</label>
              <input
                type="email"
                placeholder="contact@company.com"
                value={customerForm.email}
                onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-[#23C45E]"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-slate-700 mb-1">Phone *</label>
              <input
                type="text"
                required
                placeholder="+91 98200 00000"
                value={customerForm.phone}
                onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-[#23C45E]"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-slate-700 mb-1">Alternate Phone</label>
              <input
                type="text"
                placeholder="+91 98200 11111"
                value={customerForm.alternatePhone}
                onChange={(e) => setCustomerForm({ ...customerForm, alternatePhone: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-[#23C45E]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-slate-700 mb-1">Street Address</label>
            <input
              type="text"
              placeholder="Office 402, High Street Towers"
              value={customerForm.address}
              onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-[#23C45E]"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-black uppercase text-slate-700 mb-1">City</label>
              <input
                type="text"
                placeholder="Mumbai"
                value={customerForm.city}
                onChange={(e) => setCustomerForm({ ...customerForm, city: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-slate-700 mb-1">State</label>
              <input
                type="text"
                placeholder="Maharashtra"
                value={customerForm.state}
                onChange={(e) => setCustomerForm({ ...customerForm, state: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-slate-700 mb-1">Country</label>
              <input
                type="text"
                placeholder="India"
                value={customerForm.country}
                onChange={(e) => setCustomerForm({ ...customerForm, country: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-slate-700 mb-1">Pincode</label>
              <input
                type="text"
                placeholder="400001"
                value={customerForm.pincode}
                onChange={(e) => setCustomerForm({ ...customerForm, pincode: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-black uppercase text-slate-700 mb-1">Customer Type</label>
              <select
                value={customerForm.customerType}
                onChange={(e) => setCustomerForm({ ...customerForm, customerType: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
              >
                <option value="ENTERPRISE">Enterprise</option>
                <option value="SME">SME</option>
                <option value="STARTUP">Startup</option>
                <option value="INDIVIDUAL">Individual</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-slate-700 mb-1">Industry</label>
              <input
                type="text"
                placeholder="IT, Real Estate, etc."
                value={customerForm.industry}
                onChange={(e) => setCustomerForm({ ...customerForm, industry: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-slate-700 mb-1">Source</label>
              <select
                value={customerForm.source}
                onChange={(e) => setCustomerForm({ ...customerForm, source: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
              >
                <option value="DIRECT">Direct</option>
                <option value="WEBSITE">Website</option>
                <option value="REFERRAL">Referral</option>
                <option value="GOOGLE_PLACES">Google Places</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-slate-700 mb-1">Status</label>
              <select
                value={customerForm.status}
                onChange={(e) => setCustomerForm({ ...customerForm, status: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black uppercase text-slate-700 mb-1">Assigned Employee</label>
              <input
                type="text"
                placeholder="Rahul Sharma"
                value={customerForm.assignedEmployee}
                onChange={(e) => setCustomerForm({ ...customerForm, assignedEmployee: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-slate-700 mb-1">Department</label>
              <input
                type="text"
                placeholder="Sales & Business Development"
                value={customerForm.department}
                onChange={(e) => setCustomerForm({ ...customerForm, department: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-slate-700 mb-1">Notes & Details</label>
            <textarea
              rows={3}
              placeholder="Enter relationship notes, special SLAs, requirements..."
              value={customerForm.notes}
              onChange={(e) => setCustomerForm({ ...customerForm, notes: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-[#23C45E]"
            />
          </div>
        </form>
      </AdminFormDrawer>

      {/* 6. CUSTOMER DETAILS RIGHT-SIDE DRAWER */}
      <CustomerDetailsDrawer
        customerId={viewingCustomerId}
        isOpen={!!viewingCustomerId}
        onClose={() => setViewingCustomerId(null)}
        onEdit={(cust) => handleOpenEdit(cust)}
      />

      {/* 6. DELETE CONFIRMATION MODAL */}
      {deletingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-50 duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900">Archive Customer?</h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Are you sure you want to archive <strong>{deletingCustomer.name}</strong>? Customer records and historical deals will be preserved.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeletingCustomer(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>

              <button
                onClick={() => deleteMutation.mutate(deletingCustomer.id)}
                disabled={deleteMutation.isPending}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-xs transition-all cursor-pointer shadow-md disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Archiving...' : 'Yes, Archive'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer-Scoped Data Reset Modal */}
      {resettingCustomer && (
        <ResetCustomerDataModal
          isOpen={!!resettingCustomer}
          onClose={() => setResettingCustomer(null)}
          customerId={resettingCustomer.id}
          customerName={resettingCustomer.name}
          companyName={resettingCustomer.companyName || resettingCustomer.company}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['customers-list'] });
            queryClient.invalidateQueries({ queryKey: ['customers-metrics'] });
          }}
        />
      )}
    </div>
  );

}
