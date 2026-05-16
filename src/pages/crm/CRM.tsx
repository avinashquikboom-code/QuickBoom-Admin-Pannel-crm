import React from 'react';
import { 
  FileText, 
  Send, 
  Download, 
  Plus, 
  MoreVertical, 
  DollarSign, 
  PieChart, 
  Users,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';

const invoices = [
  { id: 'INV-2026-001', client: 'Tech Solutions', amount: '₹12,500', status: 'Paid', date: '10 May 2026', due: 'Paid' },
  { id: 'INV-2026-002', client: 'Sarah Bakery', amount: '₹4,200', status: 'Pending', date: '12 May 2026', due: '25 May 2026' },
  { id: 'INV-2026-003', client: 'Global Logistics', amount: '₹45,000', status: 'Overdue', date: '01 May 2026', due: '10 May 2026' },
  { id: 'INV-2026-004', client: 'Emma Boutique', amount: '₹8,900', status: 'Paid', date: '15 May 2026', due: 'Paid' },
];

const CRM: React.FC = () => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">CRM & Billing</h1>
          <p className="text-sm text-slate-500 font-medium">Manage customers, proposals and invoices</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all flex items-center gap-2 text-sm shadow-sm">
            <FileText className="w-4 h-4" />
            New Proposal
          </button>
          <button className="btn-primary py-2 px-4 shadow-lg shadow-primary-500/20">
            <Plus className="w-5 h-5" />
            Create Invoice
          </button>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card-premium">
          <p className="text-xs font-bold text-slate-400 uppercase mb-2">Total Receivables</p>
          <h3 className="text-2xl font-bold text-slate-900">₹8,45,000</h3>
          <div className="mt-4 flex items-center gap-2 text-emerald-500 text-xs font-bold">
            <TrendingUp className="w-4 h-4" />
            +8.2% from last month
          </div>
        </div>
        <div className="card-premium">
          <p className="text-xs font-bold text-slate-400 uppercase mb-2">Pending Invoices</p>
          <h3 className="text-2xl font-bold text-slate-900">12</h3>
          <div className="mt-4 flex items-center gap-2 text-orange-500 text-xs font-bold">
            <Clock className="w-4 h-4" />
            ₹1,24,000 Outstanding
          </div>
        </div>
        <div className="card-premium">
          <p className="text-xs font-bold text-slate-400 uppercase mb-2">Paid This Month</p>
          <h3 className="text-2xl font-bold text-slate-900">₹2,15,000</h3>
          <div className="mt-4 flex items-center gap-2 text-blue-500 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4" />
            18 Invoices cleared
          </div>
        </div>
        <div className="card-premium">
          <p className="text-xs font-bold text-slate-400 uppercase mb-2">Active Customers</p>
          <h3 className="text-2xl font-bold text-slate-900">84</h3>
          <div className="mt-4 flex items-center gap-2 text-purple-500 text-xs font-bold">
            <Users className="w-4 h-4" />
            4 New acquisitions
          </div>
        </div>
      </div>

      {/* Invoice Table */}
      <div className="card-premium p-0 overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="text-lg font-bold text-slate-900">Recent Invoices</h3>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Search invoices..." className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary-500" />
            </div>
            <button className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50"><Filter className="w-4 h-4 text-slate-500" /></button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Invoice ID</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Client</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Amount</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Due Date</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {invoices.map((inv, idx) => (
                <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-slate-900">{inv.id}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-slate-700">{inv.client}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-slate-900">{inv.amount}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                      inv.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 
                      inv.status === 'Pending' ? 'bg-orange-100 text-orange-700' : 'bg-rose-100 text-rose-700'
                    }`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-slate-500">{inv.due}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-2 hover:bg-primary-50 text-slate-400 hover:text-primary-600 rounded-lg"><Download className="w-4 h-4" /></button>
                      <button className="p-2 hover:bg-primary-50 text-slate-400 hover:text-primary-600 rounded-lg"><Send className="w-4 h-4" /></button>
                      <button className="p-2 hover:bg-primary-50 text-slate-400 hover:text-primary-600 rounded-lg"><MoreVertical className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

import { TrendingUp } from 'lucide-react';

export default CRM;
