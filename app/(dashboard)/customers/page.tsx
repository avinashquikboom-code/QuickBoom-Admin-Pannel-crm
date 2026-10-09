'use client';

import React, { useState, useRef, useMemo, useEffect } from 'react';

/** Positive Customer.id from the API. Display codes such as LEAD-0904 are not primary keys. */
function persistedCustomerId(value: unknown): number | null {
  const num = typeof value === 'number' ? value : Number(String(value ?? '').trim());
  if (!Number.isInteger(num) || num <= 0) return null;
  return num;
}

/**
 * Unconverted lead cards from mapLeadToCustomerItem.
 * They use customerId "LEAD-####" and customerType "LEAD". Their `id` is a list key, not Customer.id.
 * A converted customer keeps a positive Customer.id and a CUST- code even when leadId is present.
 */
function isUnconvertedLeadDirectoryRow(row?: {
  customerId?: unknown;
  customerType?: unknown;
  id?: unknown;
}): boolean {
  if (persistedCustomerId(row?.id) != null) return false;
  const displayCode = String(row?.customerId ?? '').trim().toUpperCase();
  if (displayCode.startsWith('LEAD-')) return true;
  const type = String(row?.customerType ?? '').trim().toUpperCase();
  return type === 'LEAD';
}

function savedCustomerPrimaryKey(row?: { customerId?: unknown; customerType?: unknown; id?: unknown }): number | null {
  if (!row || isUnconvertedLeadDirectoryRow(row)) return null;
  return persistedCustomerId(row.id);
}
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
  Check,
  User,
  AlertTriangle,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';
import { getErrorMessage } from '@/lib/utils';
import {
  AdminPageHeader,
  AdminButton,
  AdminPagination,
  AdminFormDrawer,
  CustomerDetailsDrawer,
  ResetCustomerDataModal,
} from '@/components/admin';

export default function CustomersPage() {
  const queryClient = useQueryClient();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [teamFilter, setTeamFilter] = useState('ALL');
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
  const [assigningTeamCustomer, setAssigningTeamCustomer] = useState<any | null>(null);
  const [quickAssignTeamId, setQuickAssignTeamId] = useState<string>('');

  // Multiple Selection & Bulk Delete state
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<number[]>([]);
  const [isSelectAllPages, setIsSelectAllPages] = useState(false);
  const [isSelectingInactive, setIsSelectingInactive] = useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
  const [deleteAllConfirmationInput, setDeleteAllConfirmationInput] = useState('');

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
    source: 'DIRECT',
    status: 'ACTIVE',
    assignedTeamId: '',
    assignedTeamName: '',
    department: '',
    notes: '',
  });

  // Team Dropdown & Search state
  const [teamSearch, setTeamSearch] = useState('');
  const [isTeamDropdownOpen, setIsTeamDropdownOpen] = useState(false);
  const teamDropdownRef = useRef<HTMLDivElement>(null);

  // Close team dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (teamDropdownRef.current && !teamDropdownRef.current.contains(event.target as Node)) {
        setIsTeamDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch active teams from real backend API
  const {
    data: teamsData,
    isLoading: isLoadingTeams,
    isError: isErrorTeams,
    refetch: refetchTeams,
  } = useQuery({
    queryKey: ['active-teams-for-customer'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/teams', {
          params: { limit: 100, status: 'ACTIVE' },
        });
        const items =
          res?.data?.items ||
          res?.data?.data ||
          res?.data?.teams ||
          (Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []);
        return Array.isArray(items) ? items : [];
      } catch {
        return [];
      }
    },
  });

  const activeTeams: any[] = teamsData || [];

  // Filtered teams for dropdown search
  const filteredTeams = useMemo(() => {
    if (!teamSearch.trim()) return activeTeams;
    const q = teamSearch.toLowerCase().trim();
    return activeTeams.filter((team: any) => {
      const name = (team.name || '').toLowerCase();
      const desc = (team.description || '').toLowerCase();
      const leaderName = (
        team.leader?.name ||
        `${team.leader?.firstName || ''} ${team.leader?.lastName || ''}`
      ).toLowerCase();
      return name.includes(q) || desc.includes(q) || leaderName.includes(q);
    });
  }, [activeTeams, teamSearch]);

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
      teamFilter,
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
            teamId: teamFilter !== 'ALL' ? teamFilter : undefined,
            company: companyFilter || undefined,
            dateFrom: dateFrom || undefined,
            dateTo: dateTo || undefined,
            sortBy,
            sortOrder,
            page,
            limit: pageSize,
            excludeAdmins: 'true',
          },
        });
        const rawItems = res?.data?.data || res?.data?.items || (Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : res?.items || []);
        // Defensive safety check: strictly ensure non-customer system accounts never appear in customer directory
        const items = Array.isArray(rawItems)
          ? rawItems.filter((cust: any) => {
              const custType = (cust.customerType || '').toUpperCase();
              if (['SYSTEM', 'INTERNAL', 'SUPER_ADMIN', 'ADMIN'].includes(custType)) return false;
              const role = (cust.role || cust.roleType || '').toUpperCase();
              if (['SUPER_ADMIN', 'ADMIN'].includes(role)) return false;
              const name = (cust.name || cust.customerName || '').trim().toLowerCase();
              const contactName = (cust.contactFullName || '').trim().toLowerCase();
              const email = (cust.email || '').trim().toLowerCase();
              if (name === 'super admin' || contactName === 'super admin' || email === 'admin@quickboom.com') return false;
              return true;
            })
          : [];
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

  // Clear selection when filters or page change to avoid accidental cross-page/filter deletion
  useEffect(() => {
    setSelectedCustomerIds([]);
    setIsSelectAllPages(false);
  }, [searchTerm, statusFilter, sourceFilter, teamFilter, companyFilter, dateFrom, dateTo, page]);

  // Current page selection helpers
  const pageCustomerIds = useMemo(() => {
    return customers
      .map((c: any) => persistedCustomerId(c?.id))
      .filter((id): id is number => id != null);
  }, [customers]);

  const pageSelectedCount = useMemo(() => {
    return pageCustomerIds.filter((id) => selectedCustomerIds.includes(id)).length;
  }, [pageCustomerIds, selectedCustomerIds]);

  const isAllPageSelected = pageCustomerIds.length > 0 && pageSelectedCount === pageCustomerIds.length;
  const isSomePageSelected = pageSelectedCount > 0 && pageSelectedCount < pageCustomerIds.length;

  const handleToggleSelectAll = () => {
    if (isSelectAllPages) {
      setIsSelectAllPages(false);
      setSelectedCustomerIds([]);
    } else if (isAllPageSelected) {
      setSelectedCustomerIds((prev) => prev.filter((id) => !pageCustomerIds.includes(id)));
    } else {
      setSelectedCustomerIds((prev) => Array.from(new Set([...prev, ...pageCustomerIds])));
    }
  };

  const handleSelectAllInactiveCustomers = async () => {
    setIsSelectingInactive(true);
    try {
      const ids: number[] = [];
      let pageNo = 1;
      let totalPages = 1;
      do {
        const res: any = await api.get('/customers', {
          params: {
            search: searchTerm || undefined,
            status: 'INACTIVE',
            source: sourceFilter !== 'ALL' ? sourceFilter : undefined,
            teamId: teamFilter !== 'ALL' ? teamFilter : undefined,
            company: companyFilter || undefined,
            dateFrom: dateFrom || undefined,
            dateTo: dateTo || undefined,
            sortBy,
            sortOrder,
            page: pageNo,
            limit: 100,
            excludeAdmins: 'true',
          },
        });
        const rawItems = res?.data?.data || res?.data?.items || (Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : res?.items || []);
        for (const row of Array.isArray(rawItems) ? rawItems : []) {
          const customerId = savedCustomerPrimaryKey(row);
          if (customerId != null) ids.push(customerId);
        }
        const pagination = res?.pagination || res?.data?.pagination || {};
        totalPages = Number(pagination.totalPages) || 1;
        pageNo += 1;
      } while (pageNo <= totalPages && pageNo <= 50);

      const uniqueIds = Array.from(new Set(ids));
      setIsSelectAllPages(false);
      setSelectedCustomerIds(uniqueIds);
      if (uniqueIds.length === 0) {
        toast.error('No saved inactive customers to delete. Lead records stay in the directory.');
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsSelectingInactive(false);
    }
  };
  const handleToggleRow = (customerId: number) => {
    setIsSelectAllPages(false);
    setSelectedCustomerIds((prev) =>
      prev.includes(customerId) ? prev.filter((id) => id !== customerId) : [...prev, customerId],
    );
  };

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
      queryClient.invalidateQueries({ queryKey: ['admin-customer-details-drawer'] });
      refetch();
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  // Quick Assign Team Mutation
  const assignTeamMutation = useMutation({
    mutationFn: async ({ id, teamId }: { id: number | string; teamId: number | null }) => {
      return api.patch(`/customers/${id}/assign-team`, { teamId });
    },
    onSuccess: () => {
      toast.success('Customer assigned to team successfully!', { icon: '👥' });
      setAssigningTeamCustomer(null);
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
      const customerId = persistedCustomerId(id);
      if (customerId == null) {
        throw new Error('Customer delete requires a saved customer primary key.');
      }
      return api.delete(`/customers/${customerId}`);
    },
    onSuccess: () => {
      toast.success('Customer permanently deleted successfully.', { icon: '🗑️' });
      setSelectedCustomerIds((prev) => prev.filter((id) => id !== deletingCustomer?.id));
      setDeletingCustomer(null);
      if (customers.length === 1 && page > 1) {
        setPage((p) => p - 1);
      }
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

  // Bulk Delete Customer Mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      const validIds: number[] = [];
      const rejected: Array<{ id: number; error: string }> = [];
      for (const id of ids) {
        const customerId = persistedCustomerId(id);
        if (customerId == null) {
          rejected.push({
            id: Number(id),
            error: 'Not a saved customer. Lead records are not sent to customer delete.',
          });
        } else {
          validIds.push(customerId);
        }
      }

      if (validIds.length === 0) {
        return {
          success: false,
          totalCount: ids.length,
          succeededCount: 0,
          failedCount: rejected.length,
          succeeded: [] as number[],
          failed: rejected,
        };
      }

      const mergeRejected = (data: any) => {
        const apiFailed: any[] = Array.isArray(data?.failed) ? data.failed : [];
        const failed = [...apiFailed, ...rejected];
        const succeeded: number[] = Array.isArray(data?.succeeded) ? data.succeeded : [];
        return {
          ...data,
          success: failed.length === 0,
          totalCount: ids.length,
          succeeded,
          succeededCount: data?.succeededCount ?? succeeded.length,
          failed,
          failedCount: failed.length,
        };
      };

      try {
        const res: any = await api.post('/customers/bulk-delete', { ids: validIds });
        return mergeRejected(res?.data || res);
      } catch (err: any) {
        // Fallback: delete sequentially via single DELETE /customers/:id
        const succeeded: number[] = [];
        const failed: Array<{ id: number; error: string }> = [...rejected];
        for (const id of validIds) {
          try {
            await api.delete(`/customers/${id}`);
            succeeded.push(id);
          } catch (e: any) {
            failed.push({ id, error: e?.response?.data?.message || e?.message || 'Delete failed' });
          }
        }
        return {
          success: failed.length === 0,
          totalCount: ids.length,
          succeededCount: succeeded.length,
          failedCount: failed.length,
          succeeded,
          failed,
        };
      }
    },
    onSuccess: (data: any) => {
      const succeededIds: number[] = data?.succeeded || [];
      const failedList: any[] = data?.failed || [];
      const succeededCount = data?.succeededCount ?? succeededIds.length;
      const failedCount = data?.failedCount ?? failedList.length;

      if (failedCount === 0) {
        toast.success(`Successfully deleted ${succeededCount} ${succeededCount === 1 ? 'customer' : 'customers'}.`, { icon: '🗑️' });
      } else if (succeededCount > 0) {
        toast.error(`Deleted ${succeededCount} customer(s), but ${failedCount} customer(s) could not be deleted.`);
      } else {
        toast.error(failedList[0]?.error || 'Failed to delete selected customer(s).');
      }

      setIsBulkDeleteModalOpen(false);

      if (succeededIds.length > 0) {
        setSelectedCustomerIds((prev) => prev.filter((id) => !succeededIds.includes(id)));
        const remainingOnPage = customers.filter((cust: any) => !succeededIds.includes(cust.id)).length;
        if (remainingOnPage === 0 && page > 1) {
          setPage((p) => p - 1);
        }
      }

      queryClient.invalidateQueries({ queryKey: ['customers-list'] });
      queryClient.invalidateQueries({ queryKey: ['customers-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['billing'] });
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err));
    },
  });

  // Delete All Customers Mutation
  const deleteAllMutation = useMutation({
    mutationFn: async () => {
      const res: any = await api.post('/customers/delete-all', {
        confirmation: 'DELETE ALL CUSTOMERS',
        reason: 'Admin executed Delete All Customers from Customer Directory',
      });
      return res?.data || res;
    },
    onSuccess: (data: any) => {
      toast.success(data?.message || 'Successfully deleted all eligible customers.', { icon: '🗑️' });
      setIsDeleteAllModalOpen(false);
      setDeleteAllConfirmationInput('');
      setSelectedCustomerIds([]);
      setIsSelectAllPages(false);
      setPage(1);
      queryClient.invalidateQueries({ queryKey: ['customers-list'] });
      queryClient.invalidateQueries({ queryKey: ['customers-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['billing'] });
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      refetch();
    },
    onError: (err: any) => {
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
      source: 'DIRECT',
      status: 'ACTIVE',
      assignedTeamId: '',
      assignedTeamName: '',
      department: '',
      notes: '',
    });
    setTeamSearch('');
    setIsTeamDropdownOpen(false);
  };

  const handleOpenEdit = (cust: any) => {
    setEditingCustomer(cust);

    // Resolve assigned team ID and name
    let matchedTeamId =
      cust.assignedTeamId || cust.teamId || cust.team?.id || cust.assignedTeam?.id
        ? String(cust.assignedTeamId || cust.teamId || cust.team?.id || cust.assignedTeam?.id)
        : '';
    let matchedTeamName =
      (typeof cust.team === 'object' && cust.team?.name) ||
      (typeof cust.assignedTeam === 'object' && cust.assignedTeam?.name) ||
      (typeof cust.team === 'string' ? cust.team : '') ||
      '';

    if (!matchedTeamName && matchedTeamId && activeTeams.length > 0) {
      const found = activeTeams.find((t: any) => String(t.id) === String(matchedTeamId));
      if (found) {
        matchedTeamName = found.name;
      }
    } else if (!matchedTeamId && matchedTeamName && activeTeams.length > 0) {
      const found = activeTeams.find((t: any) => t.name?.toLowerCase() === matchedTeamName.toLowerCase());
      if (found) {
        matchedTeamId = String(found.id);
      }
    }

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
      source: cust.source || 'DIRECT',
      status: cust.status || (cust.isActive ? 'ACTIVE' : 'INACTIVE'),
      assignedTeamId: matchedTeamId,
      assignedTeamName: matchedTeamName,
      department: cust.department || '',
      notes: cust.notes || '',
    });
    setTeamSearch('');
    setIsTeamDropdownOpen(false);

    // Fetch fresh assigned team from backend API to ensure 100% up-to-date data
    if (cust.id) {
      api
        .get(`/customers/${cust.id}/assign-team`)
        .then((res: any) => {
          const teamData = res?.data?.team || res?.team || res?.data;
          const apiTeamId = res?.data?.teamId ?? res?.teamId ?? teamData?.id;
          const apiTeamName = teamData?.name;
          if (apiTeamId) {
            const strId = String(apiTeamId);
            setCustomerForm((prev) => {
              const resolvedName =
                apiTeamName ||
                activeTeams.find((t: any) => String(t.id) === strId)?.name ||
                prev.assignedTeamName;
              return {
                ...prev,
                assignedTeamId: strId,
                assignedTeamName: resolvedName,
              };
            });
          }
        })
        .catch(() => {
          // Silently retain matched state from cust row
        });
    }
  };

  useEffect(() => {
    if (customerForm.assignedTeamId && !customerForm.assignedTeamName && activeTeams.length > 0) {
      const found = activeTeams.find((t: any) => String(t.id) === String(customerForm.assignedTeamId));
      if (found) {
        setCustomerForm((prev) => ({ ...prev, assignedTeamName: found.name }));
      }
    }
  }, [customerForm.assignedTeamId, customerForm.assignedTeamName, activeTeams]);

  const handleFormSubmit = (e?: React.FormEvent | React.MouseEvent) => {
    if (e && typeof (e as any).preventDefault === 'function') {
      e.preventDefault();
    }

    if (createMutation.isPending || updateMutation.isPending) {
      return;
    }

    if (!customerForm.name.trim() || !customerForm.phone.trim()) {
      toast.error('Please enter Customer Name and Phone number');
      return;
    }

    if (!customerForm.assignedTeamId) {
      toast.error('Please select an assigned team.');
      return;
    }

    const payload: any = {
      name: customerForm.name.trim(),
      companyName: customerForm.companyName.trim() || undefined,
      email: customerForm.email.trim() || undefined,
      phone: customerForm.phone.trim(),
      alternatePhone: customerForm.alternatePhone.trim() || undefined,
      address: customerForm.address.trim() || undefined,
      city: customerForm.city.trim() || undefined,
      state: customerForm.state.trim() || undefined,
      country: customerForm.country || 'India',
      pincode: customerForm.pincode.trim() || undefined,
      customerType: customerForm.customerType,
      source: customerForm.source,
      status: customerForm.status,
      assignedTeamId: Number(customerForm.assignedTeamId),
      teamId: Number(customerForm.assignedTeamId),
      department: customerForm.department || undefined,
      notes: customerForm.notes.trim() || undefined,
    };

    if (editingCustomer) {
      updateMutation.mutate({
        id: editingCustomer.id,
        payload: {
          ...payload,
          isActive: customerForm.status === 'ACTIVE',
        },
      });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-16 text-slate-800 animate-in fade-in-50 duration-200">
      {/* 1. PAGE HEADER */}
      <AdminPageHeader
        title="Customer Master Management"
        description="Track client organizations, assign relationship managers, monitor open deals, and manage customer account lifecycle."
        icon={Building2}
        iconColor="text-[#1AA14D]"
        badge={{
          text: 'CUSTOMER CRM & ACCOUNT HUB',
          icon: Building2,
          variant: 'emerald',
        }}
        breadcrumbs={[
          { label: 'CRM', href: '/crm' },
          { label: 'Customers' },
        ]}
        actions={
          <div className="flex items-center gap-2.5">
            <AdminButton
              variant="danger"
              size="md"
              icon={Trash2}
              onClick={() => {
                setDeleteAllConfirmationInput('');
                setIsDeleteAllModalOpen(true);
              }}
            >
              Delete All Customers
            </AdminButton>
            <AdminButton
              variant="primary"
              size="md"
              icon={Plus}
              onClick={() => {
                resetForm();
                setIsCreateOpen(true);
              }}
            >
              Add Customer
            </AdminButton>
          </div>
        }
      />

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
          <p className="text-[10px] text-rose-700 font-bold mt-0.5">Paused / Inactive</p>
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
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Assigned Team</label>
              <select
                value={teamFilter}
                onChange={(e) => {
                  setTeamFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 cursor-pointer"
              >
                <option value="ALL">All Teams</option>
                {activeTeams.map((team: any) => (
                  <option key={team.id} value={String(team.id)}>
                    {team.name}
                  </option>
                ))}
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

      {/* BULK ACTIONS BAR (When records selected) */}
      {(selectedCustomerIds.length > 0 || isSelectAllPages) && (
        <div className="bg-[#1B2533] text-white rounded-2xl px-5 py-3 shadow-lg flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5 text-xs font-bold">
            <span className="w-6 h-6 rounded-full bg-[#23C45E] text-slate-950 flex items-center justify-center font-black text-[11px]">
              {isSelectAllPages ? meta.total : selectedCustomerIds.length}
            </span>
            <span>
              {isSelectAllPages
                ? `All ${meta.total} customers selected across all pages`
                : selectedCustomerIds.length === 1
                ? '1 customer selected'
                : `${selectedCustomerIds.length} customers selected`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (isSelectAllPages) {
                  setDeleteAllConfirmationInput('');
                  setIsDeleteAllModalOpen(true);
                } else {
                  setIsBulkDeleteModalOpen(true);
                }
              }}
              disabled={bulkDeleteMutation.isPending || deleteAllMutation.isPending}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isSelectAllPages ? 'Delete All Customers' : statusFilter === 'INACTIVE' ? 'Delete Inactive Customers' : 'Delete Selected'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedCustomerIds([]);
                setIsSelectAllPages(false);
              }}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Deselect
            </button>
          </div>
        </div>
      )}

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

        {/* Cross-page selection banner */}
        {isAllPageSelected && meta.total > pageCustomerIds.length && (
          <div className="bg-emerald-50 border-b border-emerald-100 px-5 py-2.5 text-xs text-emerald-900 flex items-center justify-between">
            <div>
              {isSelectAllPages ? (
                <span>
                  All <strong>{meta.total}</strong> customers across all pages are selected.
                </span>
              ) : (
                <span>
                  All <strong>{pageCustomerIds.length}</strong> customers on this page are selected.
                </span>
              )}
            </div>
            <div>
              {isSelectAllPages ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsSelectAllPages(false);
                    setSelectedCustomerIds([]);
                  }}
                  className="font-bold underline text-emerald-700 hover:text-emerald-900 cursor-pointer"
                >
                  Clear selection
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isSelectingInactive}
                  onClick={() => {
                    if (statusFilter === 'INACTIVE') {
                      handleSelectAllInactiveCustomers();
                      return;
                    }
                    setIsSelectAllPages(true);
                  }}
                  className="font-bold underline text-emerald-700 hover:text-emerald-900 cursor-pointer disabled:opacity-50"
                >
                  {statusFilter === 'INACTIVE'
                    ? 'Select all inactive customers across all pages'
                    : `Select all ${meta.total} customers across all pages`}
                </button>
              )}
            </div>
          </div>
        )}

        {customers.length === 0 ? (
          <div className="py-16 text-center text-slate-400 font-bold text-xs">
            No customer accounts found matching your query.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[1150px]">
              <thead className="bg-slate-50 text-slate-400 font-black uppercase border-b border-slate-200 whitespace-nowrap">
                <tr>
                  <th className="px-4 py-3.5 w-10">
                    <input
                      type="checkbox"
                      checked={isAllPageSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = isSomePageSelected;
                      }}
                      onChange={handleToggleSelectAll}
                      className="w-4 h-4 rounded text-[#23C45E] focus:ring-[#23C45E] border-slate-300 cursor-pointer"
                      title="Select All Current Page"
                    />
                  </th>
                  <th className="px-4 py-3.5 min-w-[280px]">Customer</th>
                  <th className="px-4 py-3.5 min-w-[180px]">Active Plan & Billing</th>
                  <th className="px-4 py-3.5 min-w-[170px]">Validity Dates</th>
                  <th className="px-4 py-3.5 min-w-[180px]">Contact Details</th>
                  <th className="px-4 py-3.5 min-w-[150px]">Assigned Team</th>
                  <th className="px-4 py-3.5 min-w-[150px]">Won By</th>
                  <th className="px-4 py-3.5 min-w-[110px]">Status</th>
                  <th className="px-4 py-3.5 min-w-[120px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {customers.map((cust) => {
                  const planName = cust.plan || 'No Active Plan';
                  const hasActiveSub = cust.subscriptionStatus === 'ACTIVE';
                  const isExpiredSub = cust.subscriptionStatus === 'EXPIRED';

                  // ── Contact person full name (actual person, not workspace) ──
                  const contactName = (
                    cust.contactFullName ||
                    (
                      (cust.contactFirstName || cust.contactLastName)
                        ? `${cust.contactFirstName || ''} ${cust.contactLastName || ''}`.trim()
                        : ''
                    )
                  ).trim();

                  // Primary display: contact person name → workspace name fallback
                  const customerName = (
                    contactName ||
                    cust.name ||
                    cust.customerName ||
                    'Customer'
                  ).trim();

                  // Secondary line: always show workspace/business name
                  const companyOrWorkspaceName = (
                    cust.companyName ||
                    cust.workspaceName ||
                    cust.company ||
                    cust.name ||
                    'Direct Client'
                  ).trim();

                  const customerIdentifier = cust.customerId || (cust.id ? `CUST-${String(cust.id).padStart(4, '0')}` : '');

                  return (
                    <tr key={cust.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-4 w-10">
                        <input
                          type="checkbox"
                          checked={persistedCustomerId(cust.id) != null && selectedCustomerIds.includes(persistedCustomerId(cust.id) as number)}
                      disabled={persistedCustomerId(cust.id) == null}
                      onChange={() => {
                        const customerId = persistedCustomerId(cust.id);
                        if (customerId == null) return;
                        handleToggleRow(customerId);
                      }}
                          className="w-4 h-4 rounded text-[#23C45E] focus:ring-[#23C45E] border-slate-300 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                        />
                      </td>
                      <td className="px-4 py-4 min-w-[280px]">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-900 font-bold text-sm flex items-center justify-center border border-slate-200 shrink-0">
                            {(customerName.charAt(0) || 'C').toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <button
                              type="button"
                              onClick={() => setViewingCustomerId(cust.id)}
                              className="font-bold text-slate-900 text-sm hover:text-[#1AA14D] transition-colors block text-left cursor-pointer max-w-full leading-snug tracking-normal break-words"
                              title={customerName}
                            >
                              {customerName}
                            </button>
                            <div className="flex items-center gap-1.5 mt-0.5 text-slate-500 font-medium text-[11px] leading-tight">
                              <span className="truncate max-w-[160px] sm:max-w-[200px]" title={companyOrWorkspaceName}>
                                {companyOrWorkspaceName}
                              </span>
                              <span className="text-slate-400 shrink-0">•</span>
                              <span className="font-mono text-[10px] font-semibold text-slate-500 shrink-0">
                                {customerIdentifier}
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
                        {(() => {
                          const resolvedTeamName =
                            cust.team?.name ||
                            cust.assignedTeam?.name ||
                            activeTeams.find((t: any) => String(t.id) === String(cust.assignedTeamId || cust.teamId))?.name;
                          const resolvedLeader =
                            cust.team?.leader ||
                            cust.assignedTeam?.leader?.name ||
                            (cust.assignedTeam?.leader
                              ? `${cust.assignedTeam.leader.firstName || ''} ${cust.assignedTeam.leader.lastName || ''}`.trim()
                              : null);

                          return resolvedTeamName ? (
                            <div className="space-y-0.5">
                              <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-[11px] inline-flex items-center gap-1.5 border border-indigo-200/60">
                                <Users className="w-3 h-3 text-indigo-500" />
                                <span>{resolvedTeamName}</span>
                              </span>
                              {resolvedLeader && (
                                <p className="text-[10px] text-slate-400 font-medium pl-1">
                                  Leader: {resolvedLeader}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-400 font-bold text-[11px] inline-flex items-center gap-1">
                              Unassigned
                            </span>
                          );
                        })()}
                      </td>

                      {/* Won By */}
                      <td className="px-4 py-4 min-w-[150px]">
                        {(() => {
                          const wonName = cust.wonByName ||
                            (cust.wonBy ? (typeof cust.wonBy === 'string' ? cust.wonBy : cust.wonBy.name || `${cust.wonBy.firstName || ''} ${cust.wonBy.lastName || ''}`.trim()) : null) ||
                            (cust.originLead?.convertedByEmployee
                              ? `${cust.originLead.convertedByEmployee.firstName || ''} ${cust.originLead.convertedByEmployee.lastName || ''}`.trim()
                              : null);

                          return wonName ? (
                            <div className="flex items-center gap-1.5">
                              <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black flex items-center justify-center shrink-0">
                                {wonName[0] || 'W'}
                              </div>
                              <div className="min-w-0">
                                <span className="font-bold text-emerald-800 text-xs truncate block max-w-[130px]" title={wonName}>
                                  {wonName}
                                </span>
                                {cust.wonAt && (
                                  <span className="text-[10px] text-slate-400 font-medium block">
                                    {new Date(cust.wonAt).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs font-bold">—</span>
                          );
                        })()}
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
                            type="button"
                            onClick={() => {
                              setAssigningTeamCustomer(cust);
                              setQuickAssignTeamId(cust.teamId || cust.team?.id ? String(cust.teamId || cust.team?.id) : '');
                            }}
                            className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition-all cursor-pointer"
                            title="Assign Team"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleOpenEdit(cust)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all cursor-pointer"
                            title="Edit Customer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {savedCustomerPrimaryKey(cust) != null && (
                          <button
                            onClick={() => {
                              const customerId = savedCustomerPrimaryKey(cust);
                              if (customerId == null) return;
                              setDeletingCustomer({ ...cust, id: customerId });
                            }}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-bold transition-all cursor-pointer"
                            title="Delete Customer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          )}

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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
            {/* Real Searchable Team Dropdown */}
            <div className="relative" ref={teamDropdownRef}>
              <label className="block text-xs font-black uppercase text-slate-700 mb-1">
                Assign Team <span className="text-rose-500">*</span>
              </label>

              {/* Trigger Button */}
              {(() => {
                const effectiveTeamName =
                  customerForm.assignedTeamName ||
                  activeTeams.find((t: any) => String(t.id) === String(customerForm.assignedTeamId))?.name ||
                  '';
                return (
                  <button
                    type="button"
                    onClick={() => setIsTeamDropdownOpen((prev) => !prev)}
                    className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs font-medium flex items-center justify-between text-left transition-all cursor-pointer ${
                      isTeamDropdownOpen
                        ? 'border-[#23C45E] ring-2 ring-[#23C45E]/20 bg-white'
                        : customerForm.assignedTeamId
                        ? 'border-slate-200 text-slate-900 bg-white'
                        : 'border-slate-200 text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {effectiveTeamName ? (
                        <span className="font-bold text-slate-900 truncate">{effectiveTeamName}</span>
                      ) : (
                        <span className="text-slate-400">Select team...</span>
                      )}
                    </div>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${
                        isTeamDropdownOpen ? 'rotate-180 text-[#23C45E]' : ''
                      }`}
                    />
                  </button>
                );
              })()}

              {/* Dropdown Menu */}
              {isTeamDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
                  {/* Search Input */}
                  <div className="p-2 border-b border-slate-100 bg-slate-50/70">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search team name, leader, description..."
                        value={teamSearch}
                        onChange={(e) => setTeamSearch(e.target.value)}
                        autoFocus
                        className="w-full pl-8 pr-7 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#23C45E]"
                      />
                      {teamSearch && (
                        <button
                          type="button"
                          onClick={() => setTeamSearch('')}
                          className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* List of Teams */}
                  <div className="max-h-56 overflow-y-auto divide-y divide-slate-100/80">
                    {isLoadingTeams ? (
                      <div className="py-6 flex flex-col items-center justify-center gap-1.5 text-slate-400">
                        <RefreshCw className="w-4 h-4 animate-spin text-[#23C45E]" />
                        <span className="text-[11px] font-semibold">Loading teams from backend...</span>
                      </div>
                    ) : isErrorTeams ? (
                      <div className="p-4 text-center space-y-2">
                        <p className="text-[11px] text-rose-500 font-semibold">Failed to load teams</p>
                        <button
                          type="button"
                          onClick={() => refetchTeams()}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded-md cursor-pointer"
                        >
                          Retry
                        </button>
                      </div>
                    ) : filteredTeams.length === 0 ? (
                      <div className="py-6 text-center text-slate-400 text-xs font-medium">
                        {teamSearch ? 'No matching teams found' : 'No active teams available'}
                      </div>
                    ) : (
                      filteredTeams.map((team: any) => {
                        const isSelected = String(customerForm.assignedTeamId) === String(team.id);
                        const leaderName =
                          team.leader?.name ||
                          `${team.leader?.firstName || ''} ${team.leader?.lastName || ''}`.trim() ||
                          'No Leader Assigned';
                        const count = team.memberCount ?? team.members?.length ?? 0;

                        return (
                          <button
                            key={team.id}
                            type="button"
                            onClick={() => {
                              setCustomerForm((prev) => ({
                                ...prev,
                                assignedTeamId: String(team.id),
                                assignedTeamName: team.name,
                              }));
                              setIsTeamDropdownOpen(false);
                              setTeamSearch('');
                            }}
                            className={`w-full px-3 py-2.5 flex items-center justify-between text-left transition-colors cursor-pointer hover:bg-slate-50 ${
                              isSelected ? 'bg-indigo-50/70' : ''
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div
                                className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                                  isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                <Users className="w-3.5 h-3.5" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className={`text-xs font-bold truncate ${
                                      isSelected ? 'text-indigo-900' : 'text-slate-900'
                                    }`}
                                  >
                                    {team.name}
                                  </span>
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-bold">
                                    {count} {count === 1 ? 'member' : 'members'}
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-400 truncate mt-0.5">
                                  Leader: {leaderName}
                                </p>
                              </div>
                            </div>

                            {isSelected && <Check className="w-4 h-4 text-indigo-600 shrink-0 ml-2" />}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Selected Team Info Card */}
            <div>
              <label className="block text-xs font-black uppercase text-slate-700 mb-1">Team Overview</label>
              {customerForm.assignedTeamId ? (
                (() => {
                  const selTeam = activeTeams.find((t: any) => String(t.id) === String(customerForm.assignedTeamId));
                  const leaderName = selTeam?.leader?.name || `${selTeam?.leader?.firstName || ''} ${selTeam?.leader?.lastName || ''}`.trim() || 'No Leader';
                  const count = selTeam?.memberCount ?? selTeam?.members?.length ?? 0;
                  return (
                    <div className="p-2.5 bg-indigo-50/60 border border-indigo-100 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-indigo-950">{customerForm.assignedTeamName || selTeam?.name}</p>
                        <p className="text-[11px] text-indigo-600 font-medium">Lead: {leaderName}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-indigo-200/70 text-indigo-800 font-black text-[10px]">
                        {count} {count === 1 ? 'Member' : 'Members'}
                      </span>
                    </div>
                  );
                })()
              ) : (
                <div className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-400 font-medium">
                  Select a team on the left to view details
                </div>
              )}
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
              <h3 className="text-lg font-black text-slate-900">Delete Customer</h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Are you sure you want to permanently delete <strong>{deletingCustomer.name}</strong>? All customer data will be permanently deleted and cannot be recovered.
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
                onClick={() => {
                  const customerId = savedCustomerPrimaryKey(deletingCustomer);
                  if (customerId == null) {
                    setDeletingCustomer(null);
                    return;
                  }
                  deleteMutation.mutate(customerId);
                }}
                disabled={deleteMutation.isPending}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-xs transition-all cursor-pointer shadow-md disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Yes, Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => !bulkDeleteMutation.isPending && setIsBulkDeleteModalOpen(false)}
          />
          <div className="relative bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 z-10 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Delete {selectedCustomerIds.length} {selectedCustomerIds.length === 1 ? 'Customer' : 'Customers'}?
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Selected: <strong className="text-slate-800 font-bold">{selectedCustomerIds.length} {selectedCustomerIds.length === 1 ? 'customer' : 'customers'}</strong>
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-rose-50/50 border border-rose-100 rounded-2xl text-xs text-rose-800">
              Are you sure you want to delete the selected <strong>{selectedCustomerIds.length} {selectedCustomerIds.length === 1 ? 'customer' : 'customers'}</strong>?
              {statusFilter === 'INACTIVE'
                ? ' Only these inactive customers are included. Active customers and lead records are not deleted.'
                : ' All associated customer accounts, profiles, and transactional data will be permanently removed.'}{' '}
              This action cannot be undone.
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={bulkDeleteMutation.isPending}
                onClick={() => setIsBulkDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={bulkDeleteMutation.isPending}
                onClick={() => bulkDeleteMutation.mutate(selectedCustomerIds)}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black text-xs transition-all shadow-md shadow-rose-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {bulkDeleteMutation.isPending ? (
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>Delete {selectedCustomerIds.length} Customers</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete All Customers Confirmation Modal */}
      {isDeleteAllModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-50 duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-rose-200 text-left space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-rose-600/30">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-rose-950">Delete All Customers</h3>
                  <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-black uppercase">
                    Extreme Action
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  Permanently delete all eligible client customer accounts and their associated operational records (tasks, works, visits, schedules, customer invoices, and subscriptions). System accounts, organization #1, unconverted leads, and employees are strictly protected.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200/80 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-rose-950">
                <span>Eligible Customers to Delete:</span>
                <span className="font-black text-rose-600 text-sm">{meta.total}</span>
              </div>
              <p className="text-[11px] text-rose-800 leading-normal">
                This action is irreversible. All client customer profiles and customer-owned data will be permanently wiped from the database.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/90 space-y-2">
              <label className="block text-[11px] font-black uppercase text-slate-600">
                To confirm permanent deletion of ALL customers, type:{' '}
                <span className="text-rose-600 font-mono font-black select-all">DELETE ALL CUSTOMERS</span>
              </label>
              <input
                type="text"
                value={deleteAllConfirmationInput}
                onChange={(e) => setDeleteAllConfirmationInput(e.target.value)}
                placeholder="DELETE ALL CUSTOMERS"
                disabled={deleteAllMutation.isPending}
                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono uppercase"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={deleteAllMutation.isPending}
                onClick={() => {
                  setIsDeleteAllModalOpen(false);
                  setDeleteAllConfirmationInput('');
                }}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={
                  deleteAllMutation.isPending ||
                  deleteAllConfirmationInput.trim().toUpperCase() !== 'DELETE ALL CUSTOMERS'
                }
                onClick={() => deleteAllMutation.mutate()}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black text-xs transition-all shadow-md shadow-rose-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {deleteAllMutation.isPending ? (
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>{deleteAllMutation.isPending ? 'Deleting all customers...' : 'Delete All Customers'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Assign Team Modal */}
      {assigningTeamCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in-50 duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200/80 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Assign Team</h3>
                  <p className="text-xs text-slate-400 font-medium">Assign customer to an operating team</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAssigningTeamCustomer(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-1 text-xs">
              <span className="text-[10px] font-black uppercase text-slate-400">Target Customer</span>
              <p className="font-bold text-slate-900 text-sm">{assigningTeamCustomer.name}</p>
              <p className="text-slate-500 font-medium text-[11px]">
                {assigningTeamCustomer.companyName || assigningTeamCustomer.company || 'Direct Client'} • Currently:{' '}
                <span className="font-bold text-slate-800">
                  {assigningTeamCustomer.team?.name || 'Unassigned'}
                </span>
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-black uppercase text-slate-700">
                Select Team <span className="text-rose-500">*</span>
              </label>
              <select
                value={quickAssignTeamId}
                onChange={(e) => setQuickAssignTeamId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
              >
                <option value="">-- Choose a Team --</option>
                {activeTeams.map((team: any) => {
                  const count = team.memberCount ?? team.members?.length ?? 0;
                  const leader = team.leader?.name || `${team.leader?.firstName || ''} ${team.leader?.lastName || ''}`.trim();
                  return (
                    <option key={team.id} value={String(team.id)}>
                      {team.name} ({count} {count === 1 ? 'member' : 'members'}{leader ? ` • Lead: ${leader}` : ''})
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setAssigningTeamCustomer(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!quickAssignTeamId) {
                    toast.error('Please select a team to assign.');
                    return;
                  }
                  assignTeamMutation.mutate({
                    id: assigningTeamCustomer.id,
                    teamId: Number(quickAssignTeamId),
                  });
                }}
                disabled={assignTeamMutation.isPending}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-xs transition-all cursor-pointer shadow-md disabled:opacity-50 flex items-center gap-1.5"
              >
                {assignTeamMutation.isPending && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{assignTeamMutation.isPending ? 'Assigning...' : 'Assign Team'}</span>
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
