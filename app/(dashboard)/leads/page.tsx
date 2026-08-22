'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Filter, Mail, Phone, Building, UserCheck, DollarSign, Calendar, Eye, Trash2, Edit } from 'lucide-react';
import api from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  company: string;
  email: string;
  phone: string;
  source: string;
  status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'PROPOSAL' | 'WON' | 'LOST';
  leadValue: number;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  createdAt: string;
}

const initialLeads: Lead[] = [
  {
    id: '1',
    firstName: 'Ankit',
    lastName: 'Kulkarni',
    company: 'Apex Tech Solutions',
    email: 'ankit@apextech.com',
    phone: '9876543210',
    source: 'WEBSITE',
    status: 'QUALIFIED',
    leadValue: 450000,
    priority: 'HIGH',
    createdAt: '2026-08-10',
  },
  {
    id: '2',
    firstName: 'Meera',
    lastName: 'Deshmukh',
    company: 'Innovate Digital Services',
    email: 'meera@innovate.io',
    phone: '9876543211',
    source: 'REFERRAL',
    status: 'PROPOSAL',
    leadValue: 820000,
    priority: 'HIGH',
    createdAt: '2026-08-12',
  },
  {
    id: '3',
    firstName: 'Siddharth',
    lastName: 'Patel',
    company: 'Nexus Global Logistics',
    email: 'siddharth@nexuslogistics.com',
    phone: '9876543212',
    source: 'LINKEDIN',
    status: 'NEW',
    leadValue: 300000,
    priority: 'MEDIUM',
    createdAt: '2026-08-14',
  },
];

export default function LeadsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const queryClient = useQueryClient();

  const { data: leadsResponse, isLoading, isError } = useQuery({
    queryKey: ['leads', search, statusFilter],
    queryFn: async () => {
      try {
        const res: any = await api.get('/leads', {
          params: {
            search: search || undefined,
            status: statusFilter !== 'ALL' ? statusFilter : undefined,
          },
        });
        return res?.data || res;
      } catch (err) {
        return null;
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/leads/${id}`);
    },
    onSuccess: () => {
      toast.success('Lead deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to delete lead');
    },
  });

  const rawLeads = Array.isArray(leadsResponse)
    ? leadsResponse
    : Array.isArray(leadsResponse?.data)
    ? leadsResponse.data
    : null;

  const leads: any[] = rawLeads !== null ? rawLeads : initialLeads;

  const filtered = leads.filter((l) => {
    const fullName = `${l.firstName || ''} ${l.lastName || ''}`.toLowerCase();
    const company = (l.company || l.companyName || '').toLowerCase();
    const email = (l.email || '').toLowerCase();
    const q = search.toLowerCase();
    return fullName.includes(q) || company.includes(q) || email.includes(q);
  });

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-16 text-slate-800 animate-in fade-in-50 duration-200">
      {/* Top Hero Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-slate-700/60 shadow-xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-[#23C45E]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-[#23C45E] border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-[#23C45E] animate-pulse" />
                CRM Sales Opportunities
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Lead Management & Pipeline
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-2xl leading-relaxed">
              Capture, track, score, and convert prospective sales opportunities into active deals.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/leads/create"
              className="inline-flex items-center justify-center gap-2 bg-[#23C45E] hover:bg-[#1AA14D] text-slate-950 px-5 py-2.5 rounded-2xl font-black text-xs transition-all shadow-md shadow-[#23C45E]/20 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add New Lead</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap gap-4 items-center justify-between">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search leads by name, email, or company..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600 text-slate-900"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Lead Contact</th>
                <th className="py-3.5 px-4">Company</th>
                <th className="py-3.5 px-4">Est. Deal Value</th>
                <th className="py-3.5 px-4">Source</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Priority</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filtered.map((lead) => (
                <tr key={lead.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4">
                    <p className="font-bold text-slate-900">
                      {lead.firstName} {lead.lastName}
                    </p>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1 font-medium mt-0.5">
                      <Mail className="w-3 h-3 text-slate-400" /> {lead.email}
                    </p>
                  </td>

                  <td className="py-3.5 px-4 font-bold text-slate-800 flex items-center gap-1.5 pt-4">
                    <Building className="w-3.5 h-3.5 text-slate-400" />
                    <span>{lead.company}</span>
                  </td>

                  <td className="py-3.5 px-4 font-extrabold text-indigo-600">
                    ₹{lead.leadValue.toLocaleString('en-IN')}
                  </td>

                  <td className="py-3.5 px-4 font-semibold text-slate-600">{lead.source}</td>

                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        lead.status === 'PROPOSAL'
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          : lead.status === 'QUALIFIED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {lead.status}
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                        lead.priority === 'HIGH'
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {lead.priority}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/leads/${lead.id}`}
                        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-indigo-600 transition-colors"
                        title="View Lead Details"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete lead ${lead.firstName || ''} ${lead.lastName || ''}?`)) {
                            deleteMutation.mutate(lead.id);
                          }
                        }}
                        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Delete Lead"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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
}
