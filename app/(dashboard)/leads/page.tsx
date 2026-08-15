'use client';

import React, { useState } from 'react';
import { Plus, Search, Filter, Mail, Phone, Building } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export default function LeadsPage() {
  const [search, setSearch] = useState('');

  const { data: leads, isLoading } = useQuery({
    queryKey: ['leads', search],
    queryFn: async () => {
      try {
        const res = await api.get(`/leads?search=${search}`);
        return res.data;
      } catch (e) {
        return [];
      }
    },
  });

  return (
    <div className="space-[#F8FAFC] space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Lead Management</h1>
          <p className="text-sm text-[#64748B]">Manage, track, and convert prospective client opportunities.</p>
        </div>
        <button className="inline-flex items-center justify-center gap-2 bg-[#0F766E] hover:bg-[#115E59] text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-all shadow-xs cursor-pointer">
          <Plus className="w-4 h-4" /> Add New Lead
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-xs flex flex-wrap gap-4 items-center justify-between">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-3 text-[#64748B]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search leads by name, email, or company..."
            className="w-full pl-9 pr-4 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E] text-[#0F172A]"
          />
        </div>
        <button className="flex items-center gap-2 border border-[#E2E8F0] px-4 py-2 rounded-xl text-sm font-medium text-[#64748B] hover:bg-[#F8FAFC] cursor-pointer">
          <Filter className="w-4 h-4" /> Filter
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                <th className="py-3.5 px-6">Lead Name</th>
                <th className="py-3.5 px-6">Company</th>
                <th className="py-3.5 px-6">Contact Info</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6">Score</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-[#64748B]">
                    Loading leads...
                  </td>
                </tr>
              ) : !leads || leads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-[#64748B]">
                    No leads found. Create your first lead!
                  </td>
                </tr>
              ) : (
                leads.map((lead: any) => (
                  <tr key={lead.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-4 px-6 font-medium text-[#0F172A]">
                      {lead.firstName} {lead.lastName}
                    </td>
                    <td className="py-4 px-6 text-[#64748B]">
                      <span className="flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-[#64748B]" />
                        {lead.companyName || 'N/A'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-[#64748B] space-y-1">
                      <div className="flex items-center gap-1.5 text-xs">
                        <Mail className="w-3.5 h-3.5 text-[#64748B]" /> {lead.email}
                      </div>
                      {lead.phone && (
                        <div className="flex items-center gap-1.5 text-xs">
                          <Phone className="w-3.5 h-3.5 text-[#64748B]" /> {lead.phone}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#CCFBF1] text-[#0F766E]">
                        {lead.status || 'NEW'}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-semibold text-[#0F172A]">
                      {lead.score || 50}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button className="text-[#0F766E] hover:underline font-medium text-xs cursor-pointer">
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
