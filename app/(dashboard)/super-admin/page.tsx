'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  Building2,
  Plus,
  Users,
  DollarSign,
  TrendingUp,
  Activity,
  CheckCircle,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  AdminPageHeader,
  AdminStatCard,
  AdminDataTable,
  AdminButton,
  AdminStatusBadge,
  AdminCard,
  ColumnDef,
} from '@/components/admin';

interface TenantRow {
  id: string;
  name: string;
  plan: string;
  status: string;
  users: number;
  storage: string;
  mrr: string;
}

export default function SuperAdminPage() {
  const [activeTab, setActiveTab] = useState<'tenants' | 'plans' | 'billing'>('tenants');

  const mockTenants: TenantRow[] = [
    { id: 't-1', name: 'Acme Enterprise India', plan: 'Professional Plan', status: 'active', users: 52, storage: '2.4 GB', mrr: '₹14,999' },
    { id: 't-2', name: 'TechCorp Solutions', plan: 'Enterprise Plan', status: 'active', users: 180, storage: '12.8 GB', mrr: '₹49,999' },
    { id: 't-3', name: 'Reliance Logistics Hub', plan: 'Starter Plan', status: 'pending', users: 12, storage: '450 MB', mrr: '₹4,999' },
  ];

  const mockPlans = [
    { id: 'p-1', name: 'Starter Plan', price: '₹4,999/mo', userLimit: 15, features: ['CRM', 'Attendance', 'Leave'] },
    { id: 'p-2', name: 'Professional Plan', price: '₹14,999/mo', userLimit: 60, features: ['CRM', 'HRM', 'Attendance', 'Payroll', 'Visits'] },
    { id: 'p-3', name: 'Enterprise Plan', price: '₹49,999/mo', userLimit: 250, features: ['CRM', 'HRM', 'Payroll', 'Geo Tracking', 'Advanced Reports'] },
  ];

  const tenantColumns: ColumnDef<TenantRow>[] = [
    {
      key: 'name',
      header: 'Company Name',
      render: (t) => <span className="font-extrabold text-slate-900">{t.name}</span>,
    },
    {
      key: 'plan',
      header: 'Plan',
      render: (t) => <span className="text-indigo-700 font-bold">{t.plan}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (t) => <AdminStatusBadge status={t.status} />,
    },
    {
      key: 'users',
      header: 'Users',
      render: (t) => <span className="text-slate-700">{t.users} Staff</span>,
    },
    {
      key: 'storage',
      header: 'Storage',
      render: (t) => <span className="text-slate-500">{t.storage}</span>,
    },
    {
      key: 'mrr',
      header: 'MRR',
      render: (t) => <span className="font-bold text-slate-900">{t.mrr}</span>,
    },
    {
      key: 'actions',
      header: 'Action',
      className: 'text-right',
      headerClassName: 'text-right',
      render: () => (
        <button
          type="button"
          onClick={() => toast.success('Opening subscription configuration...')}
          className="text-indigo-600 font-bold hover:underline cursor-pointer"
        >
          Manage Subscription
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Super Admin Title Header */}
      <AdminPageHeader
        title="QuikBoom SaaS Super Admin Portal"
        description="Manage multi-tenant subscriptions, platform billing, SaaS feature flags, and tenant provisioning."
        badge={{
          text: 'PLATFORM SUPER ADMIN CONTROLS',
          icon: ShieldCheck,
          variant: 'indigo',
        }}
        actions={
          <AdminButton
            variant="primary"
            icon={Plus}
            onClick={() => toast.success('Tenant provisioning modal opened')}
          >
            Provision New Tenant
          </AdminButton>
        }
      />

      {/* Top SaaS KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard
          title="Total Active Tenants"
          value="42"
          description="38 Active • 4 Free Trials"
          icon={Building2}
          iconBg="primary"
          trend="+8.2%"
        />
        <AdminStatCard
          title="Monthly Recurring Revenue"
          value="₹8,45,000"
          description="+14% Growth MoM"
          icon={DollarSign}
          iconBg="purple"
          trend="+14.2%"
        />
        <AdminStatCard
          title="Total SaaS Users"
          value="3,420"
          description="Across 42 Organizations"
          icon={Users}
          iconBg="blue"
        />
        <AdminStatCard
          title="Platform Uptime"
          value="99.98%"
          description="All Systems Operational"
          icon={Activity}
          iconBg="primary"
        />
      </div>

      {/* Submodule Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('tenants')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'tenants'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Tenant Management
        </button>
        <button
          onClick={() => setActiveTab('plans')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'plans'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Subscription Plans
        </button>
      </div>

      {/* Tenants Table */}
      {activeTab === 'tenants' && (
        <AdminCard title="Active Tenant Organizations" description="Overview of provisioned enterprise accounts">
          <AdminDataTable columns={tenantColumns} data={mockTenants} />
        </AdminCard>
      )}

      {/* Plans Grid */}
      {activeTab === 'plans' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {mockPlans.map((p) => (
            <AdminCard key={p.id} className="space-y-4">
              <div>
                <h3 className="font-black text-slate-900 text-lg">{p.name}</h3>
                <p className="text-2xl font-black text-[#23C45E] mt-1">{p.price}</p>
              </div>
              <p className="text-xs font-bold text-slate-500">Up to {p.userLimit} Users included</p>
              <div className="space-y-1.5 text-xs text-slate-700">
                {p.features.map((f, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-[#23C45E]" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
              <AdminButton
                variant="secondary"
                size="sm"
                className="w-full mt-2"
                onClick={() => toast.success(`Editing ${p.name}`)}
              >
                Configure Plan Features
              </AdminButton>
            </AdminCard>
          ))}
        </div>
      )}
    </div>
  );
}
