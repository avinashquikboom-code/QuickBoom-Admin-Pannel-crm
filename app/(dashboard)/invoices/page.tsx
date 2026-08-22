'use client';

import React, { useState } from 'react';
import { Plus, Search, Download, DollarSign, Clock, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

const demoInvoices = [
  {
    id: 'INV-2026-001',
    clientName: 'TechCorp India Ltd',
    amount: '₹1,50,000',
    issueDate: '01 Aug 2026',
    dueDate: '15 Aug 2026',
    status: 'PAID',
    paymentGateway: 'Razorpay',
  },
  {
    id: 'INV-2026-002',
    clientName: 'Acme Global Solutions',
    amount: '₹85,000',
    issueDate: '05 Aug 2026',
    dueDate: '20 Aug 2026',
    status: 'PENDING',
    paymentGateway: 'Razorpay',
  },
  {
    id: 'INV-2026-003',
    clientName: 'Innovate Labs',
    amount: '₹2,10,000',
    issueDate: '10 Jul 2026',
    dueDate: '25 Jul 2026',
    status: 'OVERDUE',
    paymentGateway: 'Bank Transfer',
  },
];

import { AdminPageHero, AdminStatCard } from '@/components/admin';

export default function InvoicesPage() {
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  const { data: invoicesData } = useQuery({
    queryKey: ['invoices', search],
    queryFn: async () => {
      try {
        const res: any = await api.get(`/invoices`);
        return res?.data?.items || res?.items || res?.data || res;
      } catch (e) {
        return null;
      }
    },
  });

  const invoicesList = Array.isArray(invoicesData) && invoicesData.length > 0 ? invoicesData : demoInvoices;

  const filteredInvoices = invoicesList.filter((inv: any) => {
    const matchesSearch =
      inv.id.toLowerCase().includes(search.toLowerCase()) ||
      inv.clientName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = selectedStatus === 'ALL' || inv.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-[#16A34A] border border-green-200">PAID</span>;
      case 'PENDING':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-[#F59E0B] border border-amber-200">PENDING</span>;
      case 'OVERDUE':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-[#DC2626] border border-red-200">OVERDUE</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-[#64748B]">DRAFT</span>;
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
        description="Generate, manage, and track client invoice payments via Razorpay."
        actions={
          <button className="flex items-center gap-2 px-5 py-2.5 bg-[#23C45E] hover:bg-[#1AA14D] text-slate-950 font-black rounded-2xl text-xs shadow-md shadow-[#23C45E]/20 transition-all cursor-pointer active:scale-95">
            <Plus className="w-4 h-4" /> Create New Invoice
          </button>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <AdminStatCard
          title="Total Billed"
          value="₹4,45,000"
          description="3 total active invoices"
          icon={DollarSign}
          iconBg="primary"
        />
        <AdminStatCard
          title="Paid Revenue"
          value="₹1,50,000"
          description="Settled via Razorpay"
          icon={CheckCircle2}
          iconBg="blue"
        />
        <AdminStatCard
          title="Pending Collection"
          value="₹2,95,000"
          description="1 overdue, 1 pending"
          icon={Clock}
          iconBg="amber"
        />
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-xs flex flex-wrap gap-4 items-center justify-between">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-3 text-[#64748B]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by invoice ID or client name..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#23C45E] text-[#111827]"
          />
        </div>

        <div className="flex items-center gap-2">
          {['ALL', 'PAID', 'PENDING', 'OVERDUE'].map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedStatus === st
                  ? 'bg-[#23C45E] text-white shadow-xs'
                  : 'bg-slate-50 text-[#64748B] hover:bg-[#E5E7EB]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-50 border-b border-[#E5E7EB] text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                <th className="py-3.5 px-6">Invoice ID</th>
                <th className="py-3.5 px-6">Client Name</th>
                <th className="py-3.5 px-6">Amount</th>
                <th className="py-3.5 px-6">Issue Date</th>
                <th className="py-3.5 px-6">Due Date</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB] text-sm">
              {filteredInvoices.map((inv: any) => (
                <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-6 font-bold text-[#23C45E]">{inv.id}</td>
                  <td className="py-4 px-6 font-medium text-[#111827]">{inv.clientName}</td>
                  <td className="py-4 px-6 font-bold text-[#111827]">{inv.amount}</td>
                  <td className="py-4 px-6 text-[#64748B] text-xs">{inv.issueDate}</td>
                  <td className="py-4 px-6 text-[#64748B] text-xs">{inv.dueDate}</td>
                  <td className="py-4 px-6">{getStatusBadge(inv.status)}</td>
                  <td className="py-4 px-6 text-right">
                    <button className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#E5E7EB] bg-slate-50 hover:bg-[#E5E7EB] text-[#111827] rounded-lg text-xs font-medium cursor-pointer">
                      <Download className="w-3.5 h-3.5 text-[#23C45E]" /> PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
