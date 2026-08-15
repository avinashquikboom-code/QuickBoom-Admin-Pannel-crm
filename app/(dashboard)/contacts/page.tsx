'use client';

import React, { useState } from 'react';
import { Plus, Search, Filter, Mail, Phone, Building2, MapPin, Tag, Contact } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

const demoContacts = [
  {
    id: '1',
    name: 'Rajesh Sharma',
    email: 'rajesh@techcorp.in',
    phone: '+91 98765 43210',
    company: 'TechCorp India Ltd',
    designation: 'VP of Technology',
    city: 'Mumbai, Maharashtra',
    type: 'CUSTOMER',
  },
  {
    id: '2',
    name: 'Ananya Verma',
    email: 'ananya@acmesolutions.com',
    phone: '+91 91234 56789',
    company: 'Acme Global Solutions',
    designation: 'Procurement Manager',
    city: 'Bengaluru, Karnataka',
    type: 'PROSPECT',
  },
  {
    id: '3',
    name: 'Vikram Patel',
    email: 'vikram@innovatelabs.co',
    phone: '+91 99887 76655',
    company: 'Innovate Labs',
    designation: 'CEO & Founder',
    city: 'Gurugram, Haryana',
    type: 'PARTNER',
  },
];

export default function ContactsPage() {
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');

  const { data: contactsData } = useQuery({
    queryKey: ['contacts', search],
    queryFn: async () => {
      try {
        const res: any = await api.get(`/contacts?search=${search}`);
        return res?.data || res;
      } catch (e) {
        return null;
      }
    },
    retry: false,
  });

  const contactsList = contactsData && contactsData.length > 0 ? contactsData : demoContacts;

  const filteredContacts = contactsList.filter((c: any) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.company.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase());
    const matchesType = selectedType === 'ALL' || c.type === selectedType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Top Title Card Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-900 via-emerald-800 to-slate-900 p-6 sm:p-8 rounded-3xl text-white shadow-lg border border-emerald-800">
        <div>
          <div className="flex items-center gap-2 text-emerald-300 font-extrabold text-xs uppercase tracking-wider mb-1">
            <Contact className="w-4 h-4 text-emerald-400" /> CLIENT & PARTNER DIRECTORY
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
            Contacts & Account Directory
          </h1>
          <p className="text-xs md:text-sm text-slate-200 mt-1 font-medium">
            Centralized directory of client contacts, key stakeholders, and partner accounts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-extrabold text-xs transition-all shadow-md cursor-pointer">
            <Plus className="w-4 h-4" /> Add New Contact
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-xs flex flex-wrap gap-4 items-center justify-between">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-3 text-[#64748B]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search contacts by name, email, company..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#23C45E] text-[#111827]"
          />
        </div>

        <div className="flex items-center gap-2">
          {['ALL', 'CUSTOMER', 'PROSPECT', 'PARTNER'].map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedType === type
                  ? 'bg-[#23C45E] text-white shadow-xs'
                  : 'bg-slate-50 text-[#64748B] hover:bg-[#E5E7EB]'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Contacts Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredContacts.map((contact: any) => (
          <div
            key={contact.id}
            className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-xs hover:border-[#23C45E] transition-all space-y-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#E8F9EE] text-[#23C45E] font-bold text-base flex items-center justify-center">
                  {contact.name[0]}
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#111827]">{contact.name}</h3>
                  <p className="text-xs text-[#64748B]">{contact.designation}</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-50 text-[#23C45E] border border-[#E5E7EB]">
                {contact.type || 'CONTACT'}
              </span>
            </div>

            <div className="space-y-2 pt-2 border-t border-[#E5E7EB] text-xs text-[#64748B]">
              <div className="flex items-center gap-2 text-[#111827] font-medium">
                <Building2 className="w-4 h-4 text-[#23C45E]" />
                <span>{contact.company}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#64748B]" />
                <a href={`mailto:${contact.email}`} className="hover:underline text-[#23C45E]">
                  {contact.email}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#64748B]" />
                <span>{contact.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#64748B]" />
                <span>{contact.city}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-between">
              <button className="text-xs font-semibold text-[#23C45E] hover:underline cursor-pointer">
                View Timeline
              </button>
              <button className="px-3 py-1.5 bg-slate-50 border border-[#E5E7EB] text-[#111827] hover:bg-[#E5E7EB] rounded-lg text-xs font-medium cursor-pointer">
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
