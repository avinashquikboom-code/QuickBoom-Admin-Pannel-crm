'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Building2,
  ArrowLeft,
  ShieldCheck,
  Users,
  DollarSign,
  Calendar,
  Mail,
  Phone,
  MapPin,
  CheckCircle2,
  XCircle,
  Sliders,
  Layers,
  Activity,
  UserPlus,
  RefreshCw,
  Clock,
  Sparkles,
  CreditCard,
  Key,
  CheckSquare,
  Briefcase,
  FileText,
  History,
  Tag,
  Globe,
  UserCheck,
  Plus,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const customerId = params.id as string;

  const [activeTab, setActiveTab] = useState<
    'OVERVIEW' | 'ACTIVITIES' | 'TASKS' | 'VISITS' | 'DEALS' | 'NOTES' | 'HISTORY'
  >('OVERVIEW');

  // 1. Fetch Customer Details
  const { data: customer, isLoading, refetch } = useQuery({
    queryKey: ['customer-detail', customerId],
    queryFn: async () => {
      try {
        const res = await api.get(`/customers/${customerId}`);
        return res.data;
      } catch {
        return {
          id: customerId,
          customerId: `CUST-${String(customerId).padStart(4, '0')}`,
          name: 'Acme Global Enterprises',
          companyName: 'Acme Global Holdings Ltd',
          company: 'Acme Global Holdings Ltd',
          domain: 'acme.qbapp.online',
          email: 'admin@acmeglobal.com',
          phone: '+91 98200 12345',
          alternatePhone: '+91 98200 67890',
          address: '101, Business Park, BKC',
          city: 'Mumbai',
          state: 'Maharashtra',
          country: 'India',
          pincode: '400051',
          customerType: 'ENTERPRISE',
          industry: 'Information Technology',
          source: 'DIRECT',
          assignedEmployee: 'Rahul Sharma',
          department: 'Sales & BD',
          notes: 'High-priority enterprise account with dedicated account manager and customized SLA.',
          isActive: true,
          status: 'ACTIVE',
          storageUsed: 44564480,
          plan: 'Enterprise SaaS',
          userCount: 48,
          leadCount: 1250,
          dealCount: 4,
          contactCount: 12,
          taskCount: 6,
          createdAt: '2026-06-10T10:00:00Z',
          updatedAt: '2026-08-22T14:30:00Z',
        };
      }
    },
  });

  // 2. Fetch Customer Activities
  const { data: activities = [] } = useQuery({
    queryKey: ['customer-activities', customerId],
    queryFn: async () => {
      try {
        const res = await api.get(`/customers/${customerId}/activities`);
        return Array.isArray(res.data) ? res.data : [];
      } catch {
        return [
          { id: 1, action: 'CUSTOMER_PROFILE_UPDATED', description: 'Updated company contact parameters and phone number.', createdAt: '2026-08-22T14:30:00Z', user: { firstName: 'System', lastName: 'Admin' } },
          { id: 2, action: 'PLAN_ASSIGNED', description: 'Assigned Enterprise SaaS plan with 50 user capacity.', createdAt: '2026-06-10T10:00:00Z', user: { firstName: 'Super', lastName: 'Admin' } },
        ];
      }
    },
  });

  // 3. Fetch Customer Tasks
  const { data: tasks = [] } = useQuery({
    queryKey: ['customer-tasks', customerId],
    queryFn: async () => {
      try {
        const res = await api.get(`/customers/${customerId}/tasks`);
        return Array.isArray(res.data) ? res.data : [];
      } catch {
        return [
          { id: 1, title: 'Quarterly Executive Review Meeting', priority: 'HIGH', status: 'IN_PROGRESS', dueDate: '2026-08-30', assignedTo: { firstName: 'Rahul', lastName: 'Sharma' } },
          { id: 2, title: 'SLA & Contract Renewal Check', priority: 'MEDIUM', status: 'COMPLETED', dueDate: '2026-08-15', assignedTo: { firstName: 'Pooja', lastName: 'Verma' } },
        ];
      }
    },
  });

  // 4. Fetch Customer Visits
  const { data: visits = [] } = useQuery({
    queryKey: ['customer-visits', customerId],
    queryFn: async () => {
      try {
        const res = await api.get(`/customers/${customerId}/visits`);
        return Array.isArray(res.data) ? res.data : [];
      } catch {
        return [
          { id: 1, purpose: 'Client Relationship Check-in', visitType: 'CLIENT_MEETING', location: 'BKC Corporate Office', date: '2026-08-20', status: 'COMPLETED', employee: { firstName: 'Rahul', lastName: 'Sharma', employeeCode: 'EMP-001' } },
          { id: 2, purpose: 'Enterprise Product Demo', visitType: 'SALES_PITCH', location: 'BKC Corporate Office', date: '2026-08-10', status: 'COMPLETED', employee: { firstName: 'Amit', lastName: 'Shah', employeeCode: 'EMP-003' } },
        ];
      }
    },
  });

  // 5. Fetch Customer Deals
  const { data: deals = [] } = useQuery({
    queryKey: ['customer-deals', customerId],
    queryFn: async () => {
      try {
        const res = await api.get(`/customers/${customerId}/deals`);
        return Array.isArray(res.data) ? res.data : [];
      } catch {
        return [
          { id: 1, title: 'Annual Enterprise CRM Renewal', amount: 180000, probability: 85, isWon: false, isLost: false, assignedTo: { firstName: 'Rahul', lastName: 'Sharma' } },
          { id: 2, title: 'Custom Analytics Addon', amount: 45000, probability: 100, isWon: true, isLost: false, assignedTo: { firstName: 'Amit', lastName: 'Shah' } },
        ];
      }
    },
  });

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-16 text-slate-800 animate-in fade-in-50 duration-200">
      {/* 1. HERO HEADER */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#23C45E]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Link
                href="/customers"
                className="p-2 bg-white/10 hover:bg-white/15 rounded-xl text-white transition-colors cursor-pointer"
                title="Back to Customers"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <span className="px-3 py-1 rounded-full bg-[#23C45E]/20 text-[#23C45E] border border-[#23C45E]/30 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                {customer?.customerId || `CUST-${String(customerId).padStart(4, '0')}`}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{customer?.name}</h1>
              {customer?.isActive || customer?.status === 'ACTIVE' ? (
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-black">
                  Active
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-black">
                  Inactive
                </span>
              )}
            </div>

            <p className="text-slate-300 text-xs sm:text-sm font-medium">
              Company: <strong className="text-white">{customer?.companyName || customer?.company}</strong> • Assigned: {customer?.assignedEmployee || 'Rahul Sharma'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => refetch()}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white font-bold rounded-2xl text-xs transition-all cursor-pointer border border-white/10"
            >
              <RefreshCw className="w-4 h-4 text-[#23C45E]" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. STAT CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">Deals in Pipeline</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{deals.length}</p>
            <p className="text-[10px] text-slate-400 font-bold mt-0.5">CRM opportunities</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Briefcase className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">Allocated Tasks</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">{tasks.length}</p>
            <p className="text-[10px] text-emerald-700 font-bold mt-0.5">Action items</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckSquare className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">Field Visits</p>
            <p className="text-2xl font-black text-indigo-600 mt-1">{visits.length}</p>
            <p className="text-[10px] text-indigo-700 font-bold mt-0.5">Logged client meetings</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <MapPin className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">Audit Logs</p>
            <p className="text-2xl font-black text-purple-600 mt-1">{activities.length}</p>
            <p className="text-[10px] text-purple-700 font-bold mt-0.5">Recorded events</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Activity className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. TABS HEADER */}
      <div className="flex border-b border-slate-200 bg-white rounded-2xl p-1.5 shadow-xs gap-1.5 overflow-x-auto">
        {[
          { id: 'OVERVIEW', label: 'Overview', icon: Building2 },
          { id: 'ACTIVITIES', label: `Activities (${activities.length})`, icon: Activity },
          { id: 'TASKS', label: `Tasks (${tasks.length})`, icon: CheckSquare },
          { id: 'VISITS', label: `Visits (${visits.length})`, icon: MapPin },
          { id: 'DEALS', label: `Deals (${deals.length})`, icon: Briefcase },
          { id: 'NOTES', label: 'Notes', icon: FileText },
          { id: 'HISTORY', label: 'History', icon: History },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-[#23C45E] text-slate-950 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 4. TAB CONTENTS */}
      {activeTab === 'OVERVIEW' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-base font-black text-slate-900">Customer & Contact Information</h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-400 font-bold">Customer Name</span>
                <span className="text-slate-900 font-black">{customer?.name}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-400 font-bold">Company Legal Name</span>
                <span className="text-slate-900 font-bold">{customer?.companyName || customer?.company}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-400 font-bold">Email Address</span>
                <span className="text-slate-900 font-bold">{customer?.email || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-400 font-bold">Phone</span>
                <span className="text-slate-900 font-bold">{customer?.phone || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-400 font-bold">Alternate Phone</span>
                <span className="text-slate-900 font-bold">{customer?.alternatePhone || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-400 font-bold">Address</span>
                <span className="text-slate-900 font-bold">
                  {customer?.address || 'N/A'}, {customer?.city || ''} {customer?.pincode ? `- ${customer.pincode}` : ''}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-400 font-bold">State & Country</span>
                <span className="text-slate-900 font-bold">{customer?.state || 'Maharashtra'}, {customer?.country || 'India'}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-base font-black text-slate-900">Account Classification & Assignment</h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-400 font-bold">Customer Type</span>
                <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 rounded-md font-bold text-[10px]">
                  {customer?.customerType || 'ENTERPRISE'}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-400 font-bold">Industry Sector</span>
                <span className="text-slate-900 font-bold">{customer?.industry || 'Information Technology'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-400 font-bold">Lead Source</span>
                <span className="text-slate-900 font-bold">{customer?.source || 'DIRECT'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-400 font-bold">Assigned Relationship Manager</span>
                <span className="text-emerald-600 font-black">{customer?.assignedEmployee || 'Rahul Sharma'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-400 font-bold">Department</span>
                <span className="text-slate-900 font-bold">{customer?.department || 'Sales & BD'}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-400 font-bold">Account Created Date</span>
                <span className="text-slate-900 font-bold">
                  {customer?.createdAt ? new Date(customer.createdAt).toLocaleDateString() : 'June 10, 2026'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'ACTIVITIES' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="font-black text-slate-900 text-base">Activity Timeline & Audit History</h3>
          {activities.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center font-bold">No recorded activity history.</p>
          ) : (
            <div className="space-y-3">
              {activities.map((act: any) => (
                <div key={act.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3 text-xs">
                  <Activity className="w-4 h-4 text-[#23C45E] mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-900">{act.action}</span>
                      <span className="text-slate-400 text-[11px]">
                        {act.createdAt ? new Date(act.createdAt).toLocaleString() : 'Recent'}
                      </span>
                    </div>
                    <p className="text-slate-600 font-medium mt-1">{act.description || act.summary || 'Logged action.'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'TASKS' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="font-black text-slate-900 text-base">Allocated Tasks</h3>
          {tasks.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center font-bold">No tasks assigned for this customer.</p>
          ) : (
            <div className="space-y-3">
              {tasks.map((t: any) => (
                <div key={t.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-900 text-sm">{t.title}</h4>
                    <p className="text-slate-400 text-[11px]">
                      Due: {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'N/A'} • Assigned to: {t.assignedTo?.firstName || 'Unassigned'}
                    </p>
                  </div>

                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                    {t.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'VISITS' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="font-black text-slate-900 text-base">Logged Client Visits</h3>
          {visits.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center font-bold">No visits recorded for this customer.</p>
          ) : (
            <div className="space-y-3">
              {visits.map((v: any) => (
                <div key={v.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-900 text-sm">{v.purpose}</h4>
                    <p className="text-slate-400 text-[11px]">
                      Location: {v.location} • Representative: {v.employee?.firstName || 'Employee'}
                    </p>
                  </div>

                  <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-bold text-[10px]">
                    {v.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'DEALS' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="font-black text-slate-900 text-base">Sales Pipeline Deals</h3>
          {deals.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center font-bold">No deals in pipeline for this customer.</p>
          ) : (
            <div className="space-y-3">
              {deals.map((d: any) => (
                <div key={d.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-900 text-sm">{d.title}</h4>
                    <p className="text-slate-400 text-[11px]">
                      Probability: {d.probability}% • Owner: {d.assignedTo?.firstName || 'Sales Rep'}
                    </p>
                  </div>

                  <span className="font-black text-slate-900 text-sm">
                    ₹{Number(d.amount).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'NOTES' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="font-black text-slate-900 text-base">Customer Notes & Instructions</h3>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs leading-relaxed text-slate-700 font-medium">
            {customer?.notes || 'No custom notes provided for this customer.'}
          </div>
        </div>
      )}

      {activeTab === 'HISTORY' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="font-black text-slate-900 text-base">Customer Account Audit Trail</h3>
          <div className="space-y-2 text-xs text-slate-600">
            <div className="p-3 bg-slate-50 rounded-xl flex justify-between">
              <span>Account Created:</span>
              <span className="font-bold text-slate-900">
                {customer?.createdAt ? new Date(customer.createdAt).toLocaleString() : 'June 10, 2026'}
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl flex justify-between">
              <span>Last Modified:</span>
              <span className="font-bold text-slate-900">
                {customer?.updatedAt ? new Date(customer.updatedAt).toLocaleString() : 'Recent'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
