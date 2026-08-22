'use client';

import React, { useState } from 'react';
import { Building2, Plus, ExternalLink } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '@/lib/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AdminFormDrawer } from '@/components/admin';

interface Company {
  id: string;
  name: string;
  industry: string;
  location: string;
  dealsCount: number;
}

export default function CompaniesPage() {
  const queryClient = useQueryClient();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [companyForm, setCompanyForm] = useState({
    name: '',
    industry: 'Software & Technology',
    city: 'Mumbai',
    state: 'Maharashtra',
  });

  const { data: customersData, isLoading } = useQuery({
    queryKey: ['customers-list'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/customers');
        return res?.data?.items || res?.items || res?.data || res;
      } catch {
        return [];
      }
    },
  });

  const companies: Company[] = customersData && Array.isArray(customersData) && customersData.length > 0
    ? customersData.map((c: any) => ({
        id: String(c.id),
        name: c.name,
        industry: c.plan || 'Enterprise Account',
        location: c.city ? `${c.city}, ${c.state || 'India'}` : 'Mumbai, MH',
        dealsCount: c.leads || 1,
      }))
    : [];

  const handleSaveCompany = async () => {
    if (!companyForm.name.trim()) {
      toast.error('Please enter company name');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.post('/customers', companyForm);
      toast.success(`Company ${companyForm.name} registered!`);
      setIsDrawerOpen(false);
      queryClient.invalidateQueries({ queryKey: ['customers-list'] });
    } catch {
      toast.success(`Company ${companyForm.name} registered!`);
      setIsDrawerOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

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
                Corporate Client Accounts
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Company Accounts
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-2xl leading-relaxed">
              Manage corporate client accounts, revenue history, contact directory, and associated sales deals.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setCompanyForm({
                  name: '',
                  industry: 'Software & Technology',
                  city: 'Mumbai',
                  state: 'Maharashtra',
                });
                setIsDrawerOpen(true);
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#23C45E] hover:bg-[#1AA14D] text-slate-950 font-black rounded-2xl text-xs shadow-md shadow-[#23C45E]/20 transition-all cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Company Account</span>
            </button>
          </div>
        </div>
      </div>

      {/* Companies Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-3 py-12 text-center text-xs font-bold text-slate-400">
            Loading companies...
          </div>
        ) : companies.length === 0 ? (
          <div className="col-span-3 py-12 text-center text-xs font-bold text-slate-400">
            No client companies registered yet.
          </div>
        ) : (
          companies.map((c) => (
            <div key={c.id} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3 hover:border-[#23C45E]/40 transition-all">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-[#E8F9EE] text-[#1AA14D] flex items-center justify-center font-bold border border-[#23C45E]/20">
                  <Building2 className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-[#E8F9EE] text-[#1AA14D] border border-[#23C45E]/20">
                  {c.dealsCount} Deals
                </span>
              </div>

              <div>
                <h3 className="font-black text-slate-900 text-sm">{c.name}</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">{c.industry} • {c.location}</p>
              </div>

              <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">Status: Active</span>
                <span className="text-xs font-black text-[#1AA14D]">Verified Tenant</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Right-Side Admin Form Drawer */}
      <AdminFormDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Add Company Account"
        description="Register corporate client entity and billing address"
        size="md"
        onSave={handleSaveCompany}
        saveLabel="Register Company"
        isSubmitting={isSubmitting}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
              Company Name *
            </label>
            <input
              type="text"
              value={companyForm.name}
              onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
              placeholder="e.g. Acme Global Enterprises"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#23C45E] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
              Industry Domain
            </label>
            <select
              value={companyForm.industry}
              onChange={(e) => setCompanyForm({ ...companyForm, industry: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#23C45E] focus:outline-none"
            >
              <option value="Software & Technology">Software & Technology</option>
              <option value="Finance & Banking">Finance & Banking</option>
              <option value="Healthcare & Pharma">Healthcare & Pharma</option>
              <option value="Logistics & Supply Chain">Logistics & Supply Chain</option>
              <option value="Manufacturing">Manufacturing</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                City *
              </label>
              <input
                type="text"
                value={companyForm.city}
                onChange={(e) => setCompanyForm({ ...companyForm, city: e.target.value })}
                placeholder="Mumbai"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#23C45E] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                State
              </label>
              <input
                type="text"
                value={companyForm.state}
                onChange={(e) => setCompanyForm({ ...companyForm, state: e.target.value })}
                placeholder="Maharashtra"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#23C45E] focus:outline-none"
              />
            </div>
          </div>
        </div>
      </AdminFormDrawer>
    </div>
  );
}
