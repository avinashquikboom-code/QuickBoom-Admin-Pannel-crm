'use client';

import React, { useState } from 'react';
import { Plus, Search, Filter, Mail, Phone, Building, UserCheck, DollarSign, Calendar, Eye, Trash2, Edit } from 'lucide-react';

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
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    company: '',
    email: '',
    phone: '',
    source: 'WEBSITE',
    leadValue: 100000,
    priority: 'MEDIUM' as 'HIGH' | 'MEDIUM' | 'LOW',
  });

  const filtered = leads.filter(
    (l) =>
      `${l.firstName} ${l.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      l.company.toLowerCase().includes(search.toLowerCase()) ||
      l.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const newLead: Lead = {
      id: Date.now().toString(),
      ...formData,
      status: 'NEW',
      createdAt: new Date().toISOString().split('T')[0],
    };
    setLeads([newLead, ...leads]);
    setShowModal(false);
  };

  return (
    <div className="space-y-8">
      {/* Top Title Card Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-900 via-emerald-800 to-slate-900 p-6 sm:p-8 rounded-3xl text-white shadow-lg border border-emerald-800">
        <div>
          <div className="flex items-center gap-2 text-emerald-300 font-extrabold text-xs uppercase tracking-wider mb-1">
            <UserCheck className="w-4 h-4 text-emerald-400" /> CRM SALES OPPORTUNITIES
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
            Lead Management & Prospecting
          </h1>
          <p className="text-xs md:text-sm text-slate-200 mt-1 font-medium">
            Capture, track, score, and convert prospective sales opportunities into active deals.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-extrabold text-xs transition-all shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add New Lead
          </button>
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
                      <button className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-indigo-600">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setLeads(leads.filter((l) => l.id !== lead.id))}
                        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-rose-600"
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

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-black text-slate-900">Add New CRM Lead</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Company Name</label>
                <input
                  type="text"
                  required
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Est. Deal Value (₹)</label>
                  <input
                    type="number"
                    required
                    value={formData.leadValue}
                    onChange={(e) => setFormData({ ...formData, leadValue: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 text-white rounded-xl font-bold shadow-md"
                >
                  Save Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
