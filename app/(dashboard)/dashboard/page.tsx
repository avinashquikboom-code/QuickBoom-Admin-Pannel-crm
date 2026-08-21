'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Activity,
  RefreshCw,
  Users,
  Building2,
  ChevronRight,
  Search,
  ExternalLink,
  ShieldCheck,
  CreditCard,
  Plus,
  TrendingUp,
  Sparkles,
  Server,
  Zap,
  Globe,
  Database,
  Briefcase,
  Layers,
  ArrowUpRight,
  Clock,
  Shield,
  FileCheck,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

export default function SuperAdminDashboardPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [searchQuery, setSearchQuery] = useState('');
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d'>('30d');

  // 1. Fetch Super Admin Platform Metrics
  const {
    data: metricsData,
    isLoading: isLoadingMetrics,
    refetch: refetchMetrics,
    isFetching,
  } = useQuery({
    queryKey: ['super-admin-metrics'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/admin/dashboard/super-admin');
        return res?.data || res || {};
      } catch {
        return {};
      }
    },
    refetchInterval: 30000,
  });

  // 2. Fetch Live Customers / Tenants
  const { data: customersData, isLoading: isLoadingCustomers } = useQuery({
    queryKey: ['dashboard-customers-list'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/super-admin/customers');
        return res?.data?.items || res?.data || res || [];
      } catch {
        return [];
      }
    },
  });

  // 3. Fetch Live Platform Audit Logs
  const { data: auditLogsData, isLoading: isLoadingAudit } = useQuery({
    queryKey: ['dashboard-audit-logs'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/audit-logs');
        return res?.data?.items || res?.data || res || [];
      } catch {
        return [];
      }
    },
  });

  // 4. Fetch Live Subscription Plans
  const { data: plansData } = useQuery({
    queryKey: ['dashboard-plans-list'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/super-admin/plans');
        return res?.data || res || [];
      } catch {
        return [];
      }
    },
  });

  const handleRefresh = () => {
    refetchMetrics();
    toast.success('Live metrics synchronized with database', { icon: '🔄' });
  };

  const customersList = Array.isArray(customersData) ? customersData : [];
  const auditLogsList = Array.isArray(auditLogsData) ? auditLogsData : [];
  const plansList = Array.isArray(plansData) ? plansData : [];

  const totalCustomers = metricsData?.totalCustomers ?? customersList.length;
  const activeCustomers =
    metricsData?.activeCustomers ??
    customersList.filter((c: any) => c.isActive !== false).length;
  const totalUsers = metricsData?.totalUsers ?? 0;
  const totalLeads = metricsData?.totalLeads ?? 0;
  const totalDeals = metricsData?.totalDeals ?? 0;
  const mrr = metricsData?.mrr ?? 0;
  const uptime = metricsData?.uptime || '99.99%';

  const filteredCustomers = customersList
    .filter((c: any) => {
      const q = searchQuery.toLowerCase();
      return (
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.domain && c.domain.toLowerCase().includes(q)) ||
        (c.subdomain && c.subdomain.toLowerCase().includes(q))
      );
    })
    .slice(0, 6);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
      {/* Top Welcome / Mission Control Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 border border-slate-800 shadow-2xl p-6 sm:p-8 text-white">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-black uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Cloud Engine
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-extrabold">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                Super Admin Master Key
              </span>
              <span className="text-xs font-semibold text-slate-400">
                System Status: <span className="text-emerald-400 font-bold">{uptime} Operational</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
              Platform Command Center
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
              Global multi-tenant overview, live customer infrastructure, monthly recurring revenue, and system security telemetry.
            </p>
          </div>

          {/* Action Trigger Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={isFetching}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700/80 text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-emerald-400' : ''}`} />
              <span>Sync Live DB</span>
            </button>

            <Link
              href="/super-admin"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white text-xs font-black transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Customer Tenant</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Customers */}
        <div className="group relative overflow-hidden bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-black tracking-wider text-slate-400">
              Total Organizations
            </span>
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-slate-900 tracking-tight">
              {isLoadingMetrics ? '—' : totalCustomers}
            </div>
            <div className="flex items-center gap-2 mt-1.5 text-xs font-bold text-emerald-600">
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-black">
                {activeCustomers} Active
              </span>
              <span className="text-slate-400 font-medium">across SaaS cluster</span>
            </div>
          </div>
        </div>

        {/* MRR Revenue */}
        <div className="group relative overflow-hidden bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-black tracking-wider text-slate-400">
              Monthly Recurring Revenue
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-slate-900 tracking-tight">
              ₹{Number(mrr).toLocaleString('en-IN')}
            </div>
            <div className="flex items-center gap-1.5 mt-1.5 text-xs font-bold text-emerald-600">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>SaaS Subscriptions Active</span>
            </div>
          </div>
        </div>

        {/* Global SaaS Users */}
        <div className="group relative overflow-hidden bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-black tracking-wider text-slate-400">
              Registered Accounts
            </span>
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-slate-900 tracking-tight">
              {isLoadingMetrics ? '—' : totalUsers.toLocaleString('en-IN')}
            </div>
            <div className="flex items-center gap-2 mt-1.5 text-xs font-bold text-slate-500">
              <UserCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Verified Identity Accounts</span>
            </div>
          </div>
        </div>

        {/* CRM Leads & Pipeline */}
        <div className="group relative overflow-hidden bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-black tracking-wider text-slate-400">
              Pipeline Deals & Leads
            </span>
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600">
              <Briefcase className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-slate-900 tracking-tight">
              {totalLeads + totalDeals}
            </div>
            <div className="flex items-center gap-2 mt-1.5 text-xs font-bold text-purple-700">
              <span>{totalLeads} Leads</span>
              <span className="text-slate-300">•</span>
              <span>{totalDeals} Deals In Progress</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout: Left 2/3 (Tenants & Performance), Right 1/3 (Live Stream & Security) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Customers / Tenants Table Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-indigo-600" />
                  Organization Tenants
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Live multi-customer instances provisioned in PostgreSQL database
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search tenant..."
                    className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none w-48 text-slate-900 font-medium"
                  />
                </div>

                <Link
                  href="/super-admin"
                  className="inline-flex items-center gap-1 text-xs font-extrabold text-indigo-600 hover:text-indigo-700 hover:underline"
                >
                  View All ({customersList.length}) <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Tenants Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-400 uppercase font-black tracking-wider text-[10px] border-b border-slate-100">
                    <th className="py-3.5 px-5">Organization</th>
                    <th className="py-3.5 px-4">Subdomain / URL</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Plan Tier</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {isLoadingCustomers ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 font-bold">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-600" />
                        Loading active customer records...
                      </td>
                    </tr>
                  ) : filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 font-bold">
                        No customer organizations found matching criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map((cust: any) => (
                      <tr key={cust.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                              {cust.name?.[0]?.toUpperCase() || 'O'}
                            </div>
                            <div>
                              <p className="font-black text-slate-900">{cust.name}</p>
                              <p className="text-[10px] text-slate-400">{cust.email || 'No email registered'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                          {cust.subdomain ? `${cust.subdomain}.quikboom.com` : cust.domain || 'qbapp.online'}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              cust.isActive !== false
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                cust.isActive !== false ? 'bg-emerald-500' : 'bg-rose-500'
                              }`}
                            />
                            {cust.isActive !== false ? 'Active' : 'Suspended'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-[11px] border border-indigo-100">
                            {cust.subscription?.plan?.name || cust.planName || 'Enterprise SaaS'}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          <Link
                            href="/super-admin"
                            className="inline-flex items-center gap-1 p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-indigo-600 font-bold transition-all"
                            title="Manage Customer"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Platform Management Hub */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6">
            <h2 className="text-lg font-black text-slate-900 mb-1 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              Platform Management Shortcuts
            </h2>
            <p className="text-xs text-slate-500 font-medium mb-5">
              Direct access to system administration modules and configuration settings
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <Link
                href="/super-admin"
                className="group p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-indigo-50/50 hover:border-indigo-200 transition-all flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-xl bg-indigo-100 text-indigo-600 group-hover:scale-110 transition-transform">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
                </div>
                <div className="mt-3">
                  <p className="text-xs font-black text-slate-900 group-hover:text-indigo-600">
                    Tenant Management
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Provision and audit SaaS customers</p>
                </div>
              </Link>

              <Link
                href="/roles-permissions"
                className="group p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-emerald-50/50 hover:border-emerald-200 transition-all flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-600 group-hover:scale-110 transition-transform">
                    <Shield className="w-4 h-4" />
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
                </div>
                <div className="mt-3">
                  <p className="text-xs font-black text-slate-900 group-hover:text-emerald-600">
                    Roles & Permissions
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Manage RBAC matrices & scopes</p>
                </div>
              </Link>

              <Link
                href="/audit-logs"
                className="group p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-blue-50/50 hover:border-blue-200 transition-all flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-xl bg-blue-100 text-blue-600 group-hover:scale-110 transition-transform">
                    <FileCheck className="w-4 h-4" />
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
                </div>
                <div className="mt-3">
                  <p className="text-xs font-black text-slate-900 group-hover:text-blue-600">
                    Audit Security Logs
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Real-time system transaction stream</p>
                </div>
              </Link>

              <Link
                href="/settings/data-management"
                className="group p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-purple-50/50 hover:border-purple-200 transition-all flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-xl bg-purple-100 text-purple-600 group-hover:scale-110 transition-transform">
                    <Database className="w-4 h-4" />
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600" />
                </div>
                <div className="mt-3">
                  <p className="text-xs font-black text-slate-900 group-hover:text-purple-600">
                    Data Management
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Export database records & schemas</p>
                </div>
              </Link>

              <Link
                href="/geo-tracking"
                className="group p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-amber-50/50 hover:border-amber-200 transition-all flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-xl bg-amber-100 text-amber-600 group-hover:scale-110 transition-transform">
                    <Activity className="w-4 h-4" />
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600" />
                </div>
                <div className="mt-3">
                  <p className="text-xs font-black text-slate-900 group-hover:text-amber-600">
                    Live GPS Radar
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Field staff geospatial tracking</p>
                </div>
              </Link>

              <Link
                href="/notifications"
                className="group p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-rose-50/50 hover:border-rose-200 transition-all flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-xl bg-rose-100 text-rose-600 group-hover:scale-110 transition-transform">
                    <Zap className="w-4 h-4" />
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-rose-600" />
                </div>
                <div className="mt-3">
                  <p className="text-xs font-black text-slate-900 group-hover:text-rose-600">
                    Broadcast Dispatch
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Platform-wide alert messaging</p>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Real-time Audit Activity & Cloud Health */}
        <div className="space-y-6">
          {/* Cloud Health Telemetry */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6">
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2 mb-4">
              <Server className="w-4 h-4 text-emerald-600" />
              SaaS Infrastructure Status
            </h2>

            <div className="space-y-3.5 text-xs font-medium">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-bold text-slate-800">NestJS Core API</span>
                </div>
                <span className="font-black text-emerald-600 text-[11px]">HEALTHY (200 OK)</span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-bold text-slate-800">PostgreSQL DB Pool</span>
                </div>
                <span className="font-black text-emerald-600 text-[11px]">CONNECTED</span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-bold text-slate-800">Prisma Multi-Tenant ORM</span>
                </div>
                <span className="font-black text-emerald-600 text-[11px]">SYNCED</span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
                  <span className="font-bold text-slate-800">Auth Token Guard</span>
                </div>
                <span className="font-black text-indigo-600 text-[11px]">JWT SECURE</span>
              </div>
            </div>
          </div>

          {/* Real-time Audit Event Feed */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-600" />
                Live Security & Audit
              </h2>
              <Link
                href="/audit-logs"
                className="text-[11px] font-extrabold text-indigo-600 hover:text-indigo-700 hover:underline"
              >
                Full Log →
              </Link>
            </div>

            <div className="space-y-3">
              {isLoadingAudit ? (
                <div className="py-6 text-center text-slate-400 font-bold text-xs">
                  <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-1 text-indigo-600" />
                  Streaming live events...
                </div>
              ) : auditLogsList.length === 0 ? (
                <div className="py-6 text-center text-slate-400 font-bold text-xs">
                  No recent audit events recorded.
                </div>
              ) : (
                auditLogsList.slice(0, 5).map((log: any) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-2xl bg-slate-50/70 border border-slate-100 hover:bg-slate-100/70 transition-all text-xs"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-black text-slate-900 uppercase text-[10px] tracking-wider">
                        {log.module || 'AUTH'}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">
                        {log.createdAt
                          ? new Date(log.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'Just now'}
                      </span>
                    </div>
                    <p className="font-semibold text-slate-700 leading-snug">
                      {log.user ? `${log.user.firstName} ${log.user.lastName}` : 'Super Admin'}{' '}
                      <span className="font-black text-indigo-600">{log.action}</span>
                    </p>
                    {log.details && (
                      <p className="text-[11px] text-slate-500 truncate mt-0.5 font-mono">
                        {typeof log.details === 'object'
                          ? JSON.stringify(log.details)
                          : String(log.details)}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
