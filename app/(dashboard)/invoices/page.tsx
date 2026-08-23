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
import { AdminPageHero, AdminStatCard, AdminFormDrawer } from '@/components/admin';
import { toast } from 'react-hot-toast';
import { getErrorMessage } from '@/lib/utils';

export default function InvoicesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form states
  const [formInvoiceNo, setFormInvoiceNo] = useState(`INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
  const [formContactId, setFormContactId] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formDueDate, setFormDueDate] = useState('');
  const [formNotes, setFormNotes] = useState('');

  const { data: invoicesData, isLoading, refetch } = useQuery({
    queryKey: ['invoices', selectedStatus],
    queryFn: async () => {
      const params: any = {};
      if (selectedStatus !== 'ALL') params.status = selectedStatus;
      const res: any = await api.get('/invoices', { params });
      return res?.data?.items || res?.items || res?.data || [];
    },
  });

  const { data: contactsList = [] } = useQuery({
    queryKey: ['contacts-for-invoice'],
    queryFn: async () => {
      const res = await api.get('/contacts');
      const d = res.data?.data || res.data;
      return Array.isArray(d) ? d : d?.items || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post('/invoices', payload);
      return res.data;
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
      const res = await api.delete(`/invoices/${id}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Invoice deleted');
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  const resetForm = () => {
    setFormInvoiceNo(`INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
    setFormContactId('');
    setFormAmount('');
    setFormDueDate('');
    setFormNotes('');
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAmount) {
      toast.error('Please enter the total invoice amount');
      return;
    }
    createMutation.mutate({
      invoiceNo: formInvoiceNo,
      contactId: formContactId ? Number(formContactId) : undefined,
      totalAmount: Number(formAmount),
      dueDate: formDueDate || undefined,
      notes: formNotes || undefined,
      status: 'PENDING',
    });
  };

  const invoicesList = Array.isArray(invoicesData) ? invoicesData : [];

  const filteredInvoices = invoicesList.filter((inv: any) => {
    const invIdStr = String(inv.invoiceNumber || inv.id || '');
    const clientStr = String(inv.clientName || '');
    const matchesSearch =
      invIdStr.toLowerCase().includes(search.toLowerCase()) ||
      clientStr.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

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
          value={invoicesList.length}
          description="All generated client invoices"
          icon={FileText}
          iconBg="slate"
        />
        <AdminStatCard
          title="Pending Payments"
          value={invoicesList.filter((i: any) => i.status === 'PENDING').length}
          description="Awaiting client settlement"
          icon={Clock}
          iconBg="amber"
        />
        <AdminStatCard
          title="Paid Invoices"
          value={invoicesList.filter((i: any) => i.status === 'PAID').length}
          description="Successfully reconciled"
          icon={CheckCircle2}
          iconBg="primary"
        />
      </div>

      {/* Filter and Table Card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto">
            {['ALL', 'PAID', 'PENDING', 'OVERDUE', 'DRAFT'].map((status) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
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
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-900/40 text-slate-500 dark:text-slate-400 font-extrabold uppercase border-b border-slate-100 dark:border-slate-700">
              <tr>
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
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                    Loading live invoices...
                  </td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    No invoices found. Click "Create New Invoice" to generate one.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv: any) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition">
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
                          onClick={() => toast.success(`Downloading invoice #${inv.invoiceNumber || inv.id}`)}
                          className="p-1 text-slate-400 hover:text-emerald-600 transition"
                          title="Download PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Delete this invoice record?')) {
                              deleteMutation.mutate(inv.id);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-red-600 transition"
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
    </div>
  );
}
