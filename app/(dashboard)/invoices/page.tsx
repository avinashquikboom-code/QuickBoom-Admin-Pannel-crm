'use client';

import React, { useState } from 'react';
import {
  Plus,
  Search,
  Download,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  RefreshCw,
  AlertCircle,
  Building2,
  Printer,
  Trash2,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { AdminPageHero, AdminStatCard, AdminFormDrawer, AdminPagination } from '@/components/admin';
import { toast } from 'react-hot-toast';
import { getErrorMessage } from '@/lib/utils';
import { downloadPdfFromEndpoint } from '@/lib/pdf-download.util';

export default function InvoicesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Selection & Delete States
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [deleteConfirmInvoice, setDeleteConfirmInvoice] = useState<any | null>(null);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

  // Form states
  const [formInvoiceNo, setFormInvoiceNo] = useState(`INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
  const [formCustomerId, setFormCustomerId] = useState('');
  const [formContactId, setFormContactId] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formDueDate, setFormDueDate] = useState('');
  const [formNotes, setFormNotes] = useState('');

  const { data: invoicesResponse, isLoading, refetch } = useQuery({
    queryKey: ['invoices', selectedStatus, search, page, pageSize],
    queryFn: async () => {
      const params: any = { page, limit: pageSize };
      if (selectedStatus && selectedStatus !== 'ALL') params.status = selectedStatus;
      if (search && search.trim()) params.search = search.trim();
      const res: any = await api.get('/invoices', { params });

      // Unpack response safely across all interceptor unwrapping scenarios
      let items: any[] = [];
      if (Array.isArray(res)) {
        items = res;
      } else if (Array.isArray(res?.data)) {
        items = res.data;
      } else if (Array.isArray(res?.items)) {
        items = res.items;
      } else if (Array.isArray(res?.data?.data)) {
        items = res.data.data;
      } else if (Array.isArray(res?.data?.items)) {
        items = res.data.items;
      }

      const paginationSource =
        res?.pagination ||
        res?.meta ||
        res?.data?.pagination ||
        res?.data?.meta ||
        {};

      const summarySource =
        res?.summary ||
        res?.counts ||
        res?.data?.summary ||
        res?.data?.counts ||
        {};

      const total = Number(paginationSource.total ?? summarySource.totalInvoices ?? items.length) || 0;
      const totalPages = Number(paginationSource.totalPages ?? Math.ceil(total / pageSize)) || 1;

      return {
        items,
        summary: {
          totalInvoices: Number(summarySource.totalInvoices ?? total) || 0,
          pendingPayments: Number(summarySource.pendingPayments ?? summarySource.pending ?? items.filter((i: any) => i.status === 'PENDING').length) || 0,
          paidInvoices: Number(summarySource.paidInvoices ?? summarySource.paid ?? items.filter((i: any) => i.status === 'PAID').length) || 0,
          overdueInvoices: Number(summarySource.overdueInvoices ?? summarySource.overdue ?? 0) || 0,
        },
        pagination: {
          page: Number(paginationSource.page) || page,
          pageSize: Number(paginationSource.pageSize || paginationSource.limit) || pageSize,
          total,
          totalPages,
        },
      };
    },
  });

  const invoicesList = Array.isArray(invoicesResponse?.items) ? invoicesResponse.items : [];
  const invoicesPagination = invoicesResponse?.pagination || { page: 1, pageSize: 20, total: 0, totalPages: 1 };
  const invoicesSummary = invoicesResponse?.summary || {
    totalInvoices: invoicesPagination.total,
    pendingPayments: 0,
    paidInvoices: 0,
  };

  const { data: customersList = [] } = useQuery({
    queryKey: ['customers-for-invoice'],
    queryFn: async () => {
      const res: any = await api.get('/customers');
      const d = res?.data?.data || res?.data || res;
      return Array.isArray(d) ? d : d?.items || [];
    },
  });

  const { data: contactsList = [] } = useQuery({
    queryKey: ['contacts-for-invoice'],
    queryFn: async () => {
      const res: any = await api.get('/contacts');
      const d = res?.data?.data || res?.data || res;
      return Array.isArray(d) ? d : d?.items || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res: any = await api.post('/invoices', payload);
      return res?.data || res;
    },
    onSuccess: () => {
      toast.success('Invoice generated successfully');
      setIsCreateOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number | string) => {
      const res: any = await api.delete(`/invoices/${id}`);
      return res?.data || res;
    },
    onSuccess: (data: any) => {
      toast.success(data?.message || 'Invoice deleted successfully');
      setSelectedIds((prev) => prev.filter((id) => id !== deleteConfirmInvoice?.id));
      setDeleteConfirmInvoice(null);
      if (invoicesList.length === 1 && page > 1) {
        setPage((p) => p - 1);
      }
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      const res: any = await api.post('/invoices/bulk-delete', { ids });
      return res?.data || res;
    },
    onSuccess: (data: any) => {
      const count = selectedIds.length;
      toast.success(data?.message || `${count} ${count === 1 ? 'invoice' : 'invoices'} deleted successfully`);
      setIsBulkDeleteModalOpen(false);
      const remainingOnPage = invoicesList.filter((inv: any) => !selectedIds.includes(inv.id)).length;
      if (remainingOnPage === 0 && page > 1) {
        setPage((p) => p - 1);
      }
      setSelectedIds([]);
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  // Selection helpers
  const visibleIds = invoicesList.map((inv: any) => inv.id);
  const isAllSelected = visibleIds.length > 0 && visibleIds.every((id: any) => selectedIds.includes(id));
  const isSomeSelected = visibleIds.some((id: any) => selectedIds.includes(id)) && !isAllSelected;

  const handleToggleRow = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleToggleAll = () => {
    if (isAllSelected) {
      setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const resetForm = () => {
    setFormInvoiceNo(`INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
    setFormCustomerId('');
    setFormContactId('');
    setFormAmount('');
    setFormDueDate('');
    setFormNotes('');
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAmount || Number(formAmount) <= 0) {
      toast.error('Please enter a valid total invoice amount');
      return;
    }
    if (!formCustomerId && !formContactId) {
      if (customersList && customersList.length > 0) {
        toast.error('Please select a Customer / Business Account');
        return;
      }
    }
    createMutation.mutate({
      invoiceNo: formInvoiceNo,
      customerId: formCustomerId ? Number(formCustomerId) : undefined,
      contactId: formContactId ? Number(formContactId) : undefined,
      totalAmount: Number(formAmount),
      dueDate: formDueDate ? new Date(formDueDate).toISOString() : undefined,
      notes: formNotes || undefined,
      status: 'PENDING',
    });
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

  // Backend query handles search, filtering, and pagination across database
  const filteredInvoices = invoicesList;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800">PAID</span>;
      case 'PENDING':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">PENDING</span>;
      case 'OVERDUE':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800">OVERDUE</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">DRAFT</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-16 text-slate-800 animate-in fade-in-50 duration-200">
      {/* Header Hero Card */}
      <AdminPageHero
        badge={{
          text: 'BILLING & INVOICES',
          icon: DollarSign,
          variant: 'emerald',
        }}
        title="Client Invoices & Billing"
        description="Generate, manage, and track client invoice payments, tax reconciliation, and collections."
        actions={
          <div className="flex items-center gap-3">
            <button
              onClick={() => refetch()}
              className="p-2.5 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 transition"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#23C45E] hover:bg-[#1AA14D] text-slate-950 font-black rounded-2xl text-xs shadow-md shadow-[#23C45E]/20 transition-all cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" /> Create New Invoice
            </button>
          </div>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <AdminStatCard
          title="Total Invoices"
          value={invoicesSummary.totalInvoices}
          description="All generated client invoices"
          icon={FileText}
          iconBg="slate"
        />
        <AdminStatCard
          title="Pending Payments"
          value={invoicesSummary.pendingPayments}
          description="Awaiting client settlement"
          icon={Clock}
          iconBg="amber"
        />
        <AdminStatCard
          title="Paid Invoices"
          value={invoicesSummary.paidInvoices}
          description="Successfully reconciled"
          icon={CheckCircle2}
          iconBg="primary"
        />
      </div>

      {/* BULK ACTIONS BAR (When records selected) */}
      {selectedIds.length > 0 && (
        <div className="bg-[#1B2533] text-white rounded-2xl px-5 py-3 shadow-lg flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5 text-xs font-bold">
            <span className="w-6 h-6 rounded-full bg-[#23C45E] text-slate-950 flex items-center justify-center font-black text-[11px]">
              {selectedIds.length}
            </span>
            <span>{selectedIds.length === 1 ? 'invoice selected' : 'invoices selected'}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsBulkDeleteModalOpen(true)}
              disabled={bulkDeleteMutation.isPending}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Deselect
            </button>
          </div>
        </div>
      )}

      {/* Filter and Table Card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto">
            {['ALL', 'PAID', 'PENDING', 'OVERDUE', 'DRAFT'].map((status) => (
              <button
                key={status}
                onClick={() => {
                  setSelectedStatus(status);
                  setPage(1);
                }}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
                  selectedStatus === status
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {status === 'ALL' ? 'All Invoices' : status}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search invoice or client..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-900/40 text-slate-500 dark:text-slate-400 font-extrabold uppercase border-b border-slate-100 dark:border-slate-700">
              <tr>
                <th className="p-3.5 w-10">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = isSomeSelected;
                    }}
                    onChange={handleToggleAll}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
                    title="Select All"
                  />
                </th>
                <th className="p-3.5">Invoice #</th>
                <th className="p-3.5">Client / Contact</th>
                <th className="p-3.5">Total Amount</th>
                <th className="p-3.5">Issue Date</th>
                <th className="p-3.5">Due Date</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700 font-medium">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                    Loading live invoices...
                  </td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    No invoices found. Click "Create New Invoice" to generate one.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv: any) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition">
                    <td className="p-3.5 w-10">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(inv.id)}
                        onChange={() => handleToggleRow(inv.id)}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
                      />
                    </td>
                    <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                      {inv.invoiceNumber || `INV-${inv.id}`}
                    </td>
                    <td className="p-3.5 text-slate-800 dark:text-slate-200">
                      {inv.clientName || 'General Client'}
                    </td>
                    <td className="p-3.5 font-black text-slate-900 dark:text-white">
                      {typeof inv.amount === 'string' ? inv.amount : `₹${Number(inv.totalAmount || inv.amount || 0).toLocaleString('en-IN')}`}
                    </td>
                    <td className="p-3.5 text-slate-500">
                      {inv.issueDate ? new Date(inv.issueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                    </td>
                    <td className="p-3.5 text-slate-500">
                      {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                    </td>
                    <td className="p-3.5">
                      {getStatusBadge(inv.status)}
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleDownloadInvoice(inv)}
                          className="p-1 text-slate-400 hover:text-emerald-600 transition cursor-pointer"
                          title="Download PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmInvoice(inv)}
                          className="p-1 text-slate-400 hover:text-red-600 transition cursor-pointer"
                          title="Delete Invoice"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Server-Side Pagination */}
        <AdminPagination
          page={page}
          pageSize={pageSize}
          total={invoicesPagination.total}
          totalPages={invoicesPagination.totalPages}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
          disabled={isLoading}
        />
      </div>

      {/* Create Invoice Drawer */}
      <AdminFormDrawer
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          resetForm();
        }}
        title="Create New Invoice"
        subtitle="Generate a client billing invoice with payment terms"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Invoice Reference Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formInvoiceNo}
              onChange={(e) => setFormInvoiceNo(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Customer / Business Account
            </label>
            <select
              value={formCustomerId}
              onChange={(e) => setFormCustomerId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">-- Choose Customer Account (Optional) --</option>
              {customersList.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.companyName || c.name} ({c.email || `ID: ${c.id}`})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Billed Client / Contact
            </label>
            <select
              value={formContactId}
              onChange={(e) => setFormContactId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">-- Choose Client Contact (Optional) --</option>
              {contactsList.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName} ({c.email || 'No email'})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Total Amount (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                required
                placeholder="e.g. 75000"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={formDueDate}
                onChange={(e) => setFormDueDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Invoice Notes & Terms
            </label>
            <textarea
              rows={3}
              placeholder="Payment instructions, bank wire info..."
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg shadow-sm disabled:opacity-50"
            >
              {createMutation.isPending ? 'Generating...' : 'Create Invoice'}
            </button>
          </div>
        </form>
      </AdminFormDrawer>

      {/* Single Delete Confirmation Modal */}
      {deleteConfirmInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => !deleteMutation.isPending && setDeleteConfirmInvoice(null)}
          />
          <div className="relative bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl max-w-md w-full p-6 space-y-4 z-10 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Delete Invoice?
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Invoice: <strong className="text-slate-800 dark:text-slate-200 font-bold">{deleteConfirmInvoice.invoiceNumber || `INV-${deleteConfirmInvoice.id}`}</strong>
                </p>
              </div>
            </div>

            {/* Invoice Breakdown */}
            <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-700 rounded-2xl p-3.5 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Client:</span>
                <span className="font-bold text-slate-900 dark:text-white text-right">{deleteConfirmInvoice.clientName || 'General Client'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Total Amount:</span>
                <span className="font-black text-slate-900 dark:text-white">
                  {typeof deleteConfirmInvoice.amount === 'string' ? deleteConfirmInvoice.amount : `₹${Number(deleteConfirmInvoice.totalAmount || deleteConfirmInvoice.amount || 0).toLocaleString('en-IN')}`}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Issue Date:</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {deleteConfirmInvoice.issueDate ? new Date(deleteConfirmInvoice.issueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Due Date:</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {deleteConfirmInvoice.dueDate ? new Date(deleteConfirmInvoice.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Status:</span>
                <span>{getStatusBadge(deleteConfirmInvoice.status)}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 italic">
              Note: The client profile and associated subscriptions will remain completely intact.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={deleteMutation.isPending}
                onClick={() => setDeleteConfirmInvoice(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(deleteConfirmInvoice.id)}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black text-xs transition-all shadow-md shadow-rose-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {deleteMutation.isPending ? (
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>Delete</span>
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
          <div className="relative bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl max-w-md w-full p-6 space-y-4 z-10 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Delete {selectedIds.length} {selectedIds.length === 1 ? 'Invoice' : 'Invoices'}?
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Selected: <strong className="text-slate-800 dark:text-slate-200 font-bold">{selectedIds.length} {selectedIds.length === 1 ? 'invoice' : 'invoices'}</strong>
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-rose-50/50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900 rounded-2xl text-xs text-rose-800 dark:text-rose-300">
              Are you sure you want to delete the selected <strong>{selectedIds.length} {selectedIds.length === 1 ? 'invoice' : 'invoices'}</strong>? This operation cannot be undone. Customer accounts and contracts will remain safe.
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={bulkDeleteMutation.isPending}
                onClick={() => setIsBulkDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={bulkDeleteMutation.isPending}
                onClick={() => bulkDeleteMutation.mutate(selectedIds)}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black text-xs transition-all shadow-md shadow-rose-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {bulkDeleteMutation.isPending ? (
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>Delete {selectedIds.length} Invoices</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
