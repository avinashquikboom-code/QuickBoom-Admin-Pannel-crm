'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Building2, Plus, Mail, Phone, ExternalLink } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

interface Company {
  id: string;
  name: string;
  industry: string;
  location: string;
  dealsCount: number;
}

const mockCompanies: Company[] = [
  { id: '1', name: 'Acme Enterprises', industry: 'Software & Technology', location: 'Mumbai, MH', dealsCount: 3 },
  { id: '2', name: 'Apex Tech Solutions', industry: 'Cloud & Infrastructure', location: 'Pune, MH', dealsCount: 2 },
  { id: '3', name: 'Innovate Digital Services', industry: 'Digital Agency', location: 'Bengaluru, KA', dealsCount: 4 },
];

export default function CompaniesPage() {
  const { data: customersData, isLoading } = useQuery({
    queryKey: ['customers-list'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/customers');
        return res?.data?.items || res?.items || res?.data || res;
      } catch {
        return null;
      }
    },
  });

  const companies: Company[] = customersData && Array.isArray(customersData) && customersData.length > 0
    ? customersData.map((c: any) => ({
        id: c.id,
        name: c.name,
        industry: c.plan || 'Enterprise Account',
        location: c.city ? `${c.city}, ${c.state || 'India'}` : 'Mumbai, MH',
        dealsCount: c.leads || 1,
      }))
    : mockCompanies;

  return (
    <div className="space-y-8">
      {/* Companies Header Title Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-900 via-emerald-800 to-slate-900 p-6 sm:p-8 rounded-3xl text-white shadow-lg border border-emerald-800">
        <div>
          <div className="flex items-center gap-2 text-emerald-300 font-extrabold text-xs uppercase tracking-wider mb-1">
            <Building2 className="w-4 h-4 text-emerald-400" /> CLIENT COMPANY ACCOUNTS
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
            Client Companies & Accounts
          </h1>
          <p className="text-xs md:text-sm text-slate-200 mt-1 font-medium">
            Manage corporate client accounts, revenue history, contact directory, and associated sales deals.
          </p>
        </div>

        <Link
          href="/companies/create"
          className="flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-extrabold transition-all shadow-md cursor-pointer self-start md:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Company Account
        </Link>
      </div>

      {/* Companies Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {companies.map((c) => (
          <div key={c.id} className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4 hover:border-emerald-500 transition-all">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold border border-emerald-100">
                <Building2 className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                {c.dealsCount} Active Deals
              </span>
            </div>

            <div>
              <h3 className="font-extrabold text-slate-900 text-base">{c.name}</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">{c.industry} • {c.location}</p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">Status: Active</span>
              <Link href={`/companies/${c.id}`} className="text-xs font-bold text-emerald-700 hover:underline inline-flex items-center gap-1">
                View Account <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
