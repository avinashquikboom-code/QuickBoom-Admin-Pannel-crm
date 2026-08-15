'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Building2, Plus, Mail, Phone, ExternalLink } from 'lucide-react';

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
  const [companies, setCompanies] = useState<Company[]>(mockCompanies);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Client Companies & Accounts</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">Manage corporate client accounts and associated deals.</p>
        </div>

        <Link
          href="/companies/create"
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md"
        >
          <Plus className="w-4 h-4" /> Add Company Account
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {companies.map((c) => (
          <div key={c.id} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <Building2 className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                {c.dealsCount} Deals
              </span>
            </div>

            <div>
              <h3 className="font-extrabold text-slate-900 text-base">{c.name}</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">{c.industry} • {c.location}</p>
            </div>

            <div className="pt-3 border-t border-slate-100 text-right">
              <Link href={`/companies/${c.id}`} className="text-xs font-bold text-indigo-600 hover:underline inline-flex items-center gap-1">
                View Account <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
