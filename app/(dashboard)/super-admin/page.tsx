'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  Building2,
  CreditCard,
  Zap,
  CheckCircle,
  AlertCircle,
  Plus,
  Users,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function SuperAdminPage() {
  const [activeTab, setActiveTab] = useState<'tenants' | 'plans' | 'billing'>('tenants');

  const mockTenants = [
    { id: 't-1', name: 'Acme Enterprise India', plan: 'Professional Plan', status: 'ACTIVE', users: 52, storage: '2.4 GB', mrr: '₹14,999' },
    { id: 't-2', name: 'TechCorp Solutions', plan: 'Enterprise Plan', status: 'ACTIVE', users: 180, storage: '12.8 GB', mrr: '₹49,999' },
    { id: 't-3', name: 'Reliance Logistics Hub', plan: 'Starter Plan', status: 'TRIAL', users: 12, storage: '450 MB', mrr: '₹4,999' },
  ];

  const mockPlans = [
    { id: 'p-1', name: 'Starter Plan', price: '₹4,999/mo', userLimit: 15, features: ['CRM', 'Attendance', 'Leave'] },
    { id: 'p-2', name: 'Professional Plan', price: '₹14,999/mo', userLimit: 60, features: ['CRM', 'HRM', 'Attendance', 'Payroll', 'Visits'] },
    { id: 'p-3', name: 'Enterprise Plan', price: '₹49,999/mo', userLimit: 250, features: ['CRM', 'HRM', 'Payroll', 'Geo Tracking', 'Advanced Reports'] },
  ];

  return (
    <div className="space-y-8">
      {/* Super Admin Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 rounded-3xl text-white shadow-lg border border-indigo-900">
        <div>
          <div className="flex items-center gap-2 text-indigo-300 font-extrabold text-xs uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4 text-indigo-400" /> PLATFORM SUPER ADMIN CONTROLS
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
            QuikBoom SaaS Super Admin Portal
          </h1>
          <p className="text-xs md:text-sm text-slate-200 mt-1 font-medium">
            Manage multi-tenant subscriptions, platform billing, SaaS feature flags, and tenant provisioning.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => toast.success('Tenant provisioning modal opened')}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-extrabold transition-all shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Provision New Tenant
          </button>
        </div>
      </div>

      {/* Top SaaS KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-extrabold uppercase text-slate-400">Total Tenants</span>
          <p className="text-2xl font-black text-slate-900 mt-1">42</p>
          <span className="text-[11px] font-bold text-emerald-600">38 Active • 4 Trial</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-extrabold uppercase text-slate-400">Monthly Recurring Revenue</span>
          <p className="text-2xl font-black text-indigo-700 mt-1">₹8,45,000</p>
          <span className="text-[11px] font-bold text-indigo-600">+14% Growth MoM</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-extrabold uppercase text-slate-400">Total SaaS Users</span>
          <p className="text-2xl font-black text-slate-900 mt-1">3,420</p>
          <span className="text-[11px] font-bold text-slate-500">Employees & Admins</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-extrabold uppercase text-slate-400">SaaS Platform Health</span>
          <p className="text-2xl font-black text-emerald-600 mt-1">99.98%</p>
          <span className="text-[11px] font-bold text-emerald-600">All Systems Operational</span>
        </div>
      </div>

      {/* Submodule Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('tenants')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'tenants' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Tenant Management
        </button>
        <button
          onClick={() => setActiveTab('plans')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'plans' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Subscription Plans
        </button>
      </div>

      {/* Tenants Table */}
      {activeTab === 'tenants' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 text-sm">Active Tenant Organizations</h3>
          </div>
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 font-extrabold uppercase border-b border-slate-100">
              <tr>
                <th className="p-3">Company Name</th>
                <th className="p-3">Plan</th>
                <th className="p-3">Status</th>
                <th className="p-3">Users</th>
                <th className="p-3">Storage</th>
                <th className="p-3">MRR</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {mockTenants.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/50">
                  <td className="p-3 font-bold text-slate-900">{t.name}</td>
                  <td className="p-3 text-indigo-700 font-bold">{t.plan}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded-md text-[10px]">
                      {t.status}
                    </span>
                  </td>
                  <td className="p-3 text-slate-700">{t.users} Staff</td>
                  <td className="p-3 text-slate-500">{t.storage}</td>
                  <td className="p-3 font-bold text-slate-900">{t.mrr}</td>
                  <td className="p-3">
                    <button className="text-indigo-600 font-bold hover:underline">Manage Subscription</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Plans Grid */}
      {activeTab === 'plans' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {mockPlans.map((p) => (
            <div key={p.id} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div>
                <h3 className="font-black text-slate-900 text-lg">{p.name}</h3>
                <p className="text-2xl font-black text-indigo-600 mt-1">{p.price}</p>
              </div>
              <p className="text-xs font-bold text-slate-500">Up to {p.userLimit} Users included</p>
              <div className="space-y-1.5 text-xs text-slate-700">
                {p.features.map((f, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => toast.success(`Editing ${p.name}`)}
                className="w-full py-2 bg-slate-900 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Configure Plan Features
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
