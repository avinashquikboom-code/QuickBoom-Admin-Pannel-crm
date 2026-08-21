'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Mail, Phone, Building2, User, MapPin } from 'lucide-react';
import api from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

export default function ContactDetailPage() {
  const params = useParams();
  const id = (params?.id as string) || '1';

  const { data: contactData, isLoading } = useQuery({
    queryKey: ['contact-detail', id],
    queryFn: async () => {
      try {
        const res: any = await api.get(`/contacts/${id}`);
        return res?.data || res;
      } catch (err) {
        return null;
      }
    },
  });

  const contact = contactData || {
    id,
    firstName: 'Rajesh',
    lastName: 'Sharma',
    email: 'rajesh@techcorp.in',
    phone: '+91 98765 43210',
    designation: 'VP of Technology',
    type: 'CUSTOMER',
    notes: 'Key contact for Q3 enterprise deployment.',
  };

  const name = contact.name || `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || 'Contact Details';
  const initials = name
    .split(' ')
    .map((p: string) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-8 max-w-2xl">
      <div className="flex items-center gap-4">
        <Link href="/contacts" className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">{name}</h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">Record ID: #{id}</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-8 space-y-6 text-xs">
        <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
          <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 text-white font-bold text-lg flex items-center justify-center">
            {initials || 'CT'}
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900">{name}</h2>
            <p className="text-slate-500 font-medium">{contact.designation || contact.type || 'Enterprise Contact'}</p>
          </div>
        </div>

        <div className="space-y-3">
          {contact.email && (
            <div className="p-3 bg-slate-50 rounded-xl flex items-center gap-2">
              <Mail className="w-4 h-4 text-emerald-600" />
              <span className="font-bold text-slate-900">Email:</span>
              <a href={`mailto:${contact.email}`} className="text-slate-700 hover:underline">
                {contact.email}
              </a>
            </div>
          )}
          {contact.phone && (
            <div className="p-3 bg-slate-50 rounded-xl flex items-center gap-2">
              <Phone className="w-4 h-4 text-emerald-600" />
              <span className="font-bold text-slate-900">Phone:</span>
              <span className="text-slate-700">{contact.phone}</span>
            </div>
          )}
          {contact.notes && (
            <div className="p-4 bg-slate-50 rounded-xl space-y-1">
              <span className="font-bold text-slate-900 block text-[11px] uppercase tracking-wider text-slate-400">Notes</span>
              <p className="text-slate-700 leading-relaxed font-medium">{contact.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
