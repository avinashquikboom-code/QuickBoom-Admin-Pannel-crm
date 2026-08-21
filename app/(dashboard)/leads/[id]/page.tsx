'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Edit, Building, Mail, Phone, DollarSign, Calendar, MapPin, Tag } from 'lucide-react';
import api from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

export default function LeadDetailPage() {
  const params = useParams();
  const id = (params?.id as string) || '1';

  const { data: leadData, isLoading } = useQuery({
    queryKey: ['lead-detail', id],
    queryFn: async () => {
      try {
        const res: any = await api.get(`/leads/${id}`);
        return res?.data || res;
      } catch (err) {
        return null;
      }
    },
  });

  const lead = leadData || {
    id,
    firstName: 'Ankit',
    lastName: 'Kulkarni',
    companyName: 'Apex Tech Solutions',
    email: 'ankit@apextech.com',
    phone: '+91 98765 43210',
    status: 'QUALIFIED',
    value: 450000,
    source: 'WEBSITE',
    city: 'Mumbai',
    notes: 'Interested in enterprise deployment and automated attendance tracking.',
  };

  const name = `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || 'Lead Details';
  const company = lead.companyName || lead.company || 'Direct Prospect';
  const val = lead.value || lead.leadValue || 0;

  return (
    <div className="space-y-8 max-w-3xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/leads" className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">{name}</h1>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">Record ID: #{id}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-8 space-y-6 text-xs">
        <div className="flex justify-between items-center pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">{name}</h2>
            <p className="text-slate-500 font-medium">{company}</p>
          </div>
          <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 font-bold text-xs border border-indigo-200 uppercase">
            {lead.status || 'NEW'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-3.5 bg-slate-50 rounded-xl space-y-1">
            <span className="text-slate-400 font-bold uppercase text-[10px]">Estimated Deal Value</span>
            <p className="font-extrabold text-emerald-600 text-base">₹{Number(val).toLocaleString('en-IN')}</p>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-xl space-y-1">
            <span className="text-slate-400 font-bold uppercase text-[10px]">Lead Source</span>
            <p className="font-bold text-slate-900 text-sm">{lead.source || 'Direct'}</p>
          </div>
          {lead.email && (
            <div className="p-3.5 bg-slate-50 rounded-xl space-y-1">
              <span className="text-slate-400 font-bold uppercase text-[10px]">Email Address</span>
              <p className="font-bold text-slate-800 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-slate-400" />{lead.email}</p>
            </div>
          )}
          {lead.phone && (
            <div className="p-3.5 bg-slate-50 rounded-xl space-y-1">
              <span className="text-slate-400 font-bold uppercase text-[10px]">Contact Phone</span>
              <p className="font-bold text-slate-800 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-400" />{lead.phone}</p>
            </div>
          )}
        </div>

        {lead.notes && (
          <div className="p-4 bg-slate-50 rounded-2xl space-y-1">
            <span className="text-slate-400 font-bold uppercase text-[10px]">Prospect Notes</span>
            <p className="text-slate-700 leading-relaxed font-medium">{lead.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
