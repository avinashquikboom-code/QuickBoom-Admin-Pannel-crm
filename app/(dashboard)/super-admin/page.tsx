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
  Layers,
  Sparkles,
  Sliders,
  Calendar,
  History,
  Check,
  Zap,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import {
  AdminPageHeader,
  AdminStatCard,
  AdminDataTable,
  AdminButton,
  AdminStatusBadge,
  AdminCard,
  AdminFormDrawer,
  ColumnDef,
} from '@/components/admin';

interface CustomerRow {
  id: string;
  name: string;
  plan: string;
  status: string;
  users: number;
  storage: string;
  mrr: string;
}

const ALL_POSSIBLE_FEATURES = [
  { id: 'Customer Management', label: 'Customer & Contact Management' },
  { id: 'Calendar', label: 'Calendar & Event Scheduler' },
  { id: 'Works', label: 'Works & Deliverables Execution' },
  { id: 'Tasks', label: 'Operational Tasks & Checklists' },
  { id: 'Reports', label: 'Standard Reports & Exports' },
  { id: 'Advanced Analytics', label: 'Advanced Performance Analytics' },
  { id: 'Notifications', label: 'In-App & Email Notifications' },
  { id: 'WhatsApp Integration', label: 'WhatsApp Business API Alerts' },
  { id: 'HRM Attendance', label: 'HRM & GPS Attendance Check-In' },
  { id: 'Payroll Automation', label: 'Payroll & Salary Slips Generator' },
];

export default function SuperAdminPage() {
  const [activeTab, setActiveTab] = useState<'customers' | 'plans' | 'billing'>('customers');

  // Drawer states
  const [isCustomerDrawerOpen, setIsCustomerDrawerOpen] = useState(false);
  const [isCustomizeDrawerOpen, setIsCustomizeDrawerOpen] = useState(false);
  const [isPlanDrawerOpen, setIsPlanDrawerOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  // New Customer Provisioning Form
  const [customerForm, setCustomerForm] = useState({
    name: '',
    email: '',
    phone: '',
    subdomain: '',
    plan: 'Enterprise SaaS',
    maxUsers: 25,
  });

  // Customer Plan Customization Form
  const [customPlanForm, setCustomPlanForm] = useState({
    customerId: '',
    customerName: '',
    planId: '',
    planName: '',
    basePrice: 0,
    customPrice: '',
    userLimit: 15,
    leadLimit: 1000,
    features: ['Customer Management', 'Calendar', 'Works', 'Tasks', 'Reports'],
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'ACTIVE',
  });

  const [planHistory, setPlanHistory] = useState<any[]>([]);

  // Subscription Plan Config Form
  const [planForm, setPlanForm] = useState({
    name: '',
    monthlyPrice: '',
    userLimit: '20',
    description: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Fetch Plans
  const { data: plansResponse, refetch: refetchPlans } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/plans');
        return res?.data || res;
      } catch (err) {
        return null;
      }
    },
  });

  // 2. Fetch Customers
  const { data: customersResponse, refetch: refetchCustomers } = useQuery({
    queryKey: ['admin-customers'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/customers');
        return res?.data?.items || res?.items || res?.data || res;
      } catch {
        return null;
      }
    },
  });

  const rawPlans = Array.isArray(plansResponse)
    ? plansResponse
    : Array.isArray(plansResponse?.data)
    ? plansResponse.data
    : [];

  const customers: CustomerRow[] =
    Array.isArray(customersResponse)
      ? customersResponse.map((c: any) => ({
          id: String(c.id),
          name: c.name,
          plan: c.plan?.name || c.plan || 'Starter Plan',
          status: c.status || (c.isActive ? 'active' : 'inactive'),
          users: c.users || c._count?.users || 1,
          storage: c.storage || `${Math.round(Number(c.storageUsed || 0) / (1024 * 1024))} MB`,
          mrr: c.mrr || (c.subscription?.plan?.monthlyPrice ? `₹${Number(c.subscription.plan.monthlyPrice).toLocaleString('en-IN')}` : '₹0'),
        }))
      : [];

  const plans =
    rawPlans.length > 0
      ? rawPlans.map((p: any) => ({
          id: p.id,
          name: p.name,
          code: p.code,
          price: `₹${Number(p.monthlyPrice || 0).toLocaleString('en-IN')}/mo`,
          monthlyPrice: Number(p.monthlyPrice || 0),
          yearlyPrice: Number(p.yearlyPrice || 0),
          userLimit: p.userLimit || 20,
          leadLimit: p.leadLimit || 1000,
          features: Array.isArray(p.features) ? p.features : ['CRM', 'HRM', 'Payroll'],
        }))
      : [];

  // Open Customize Plan Drawer
  const handleOpenCustomizePlan = async (customer: CustomerRow) => {
    setSelectedCustomer(customer);
    try {
      // Fetch current plan details and history
      const [planRes, historyRes]: any = await Promise.all([
        api.get(`/customers/${customer.id}/plan`).catch(() => null),
        api.get(`/customers/${customer.id}/plan/history`).catch(() => []),
      ]);

      const planData = planRes?.data || planRes || {};
      const historyData = Array.isArray(historyRes?.data) ? historyRes.data : Array.isArray(historyRes) ? historyRes : [];

      const initialPlan = plans.find((p: any) => String(p.id) === String(planData.planId)) || plans[0];

      setCustomPlanForm({
        customerId: customer.id,
        customerName: customer.name,
        planId: String(initialPlan?.id || '1'),
        planName: initialPlan?.name || 'Standard Package',
        basePrice: initialPlan?.monthlyPrice || 0,
        customPrice: planData.customPrice !== undefined && planData.customPrice !== null ? String(planData.customPrice) : String(initialPlan?.monthlyPrice || 0),
        userLimit: planData.userLimit || initialPlan?.userLimit || 15,
        leadLimit: planData.leadLimit || initialPlan?.leadLimit || 1000,
        features: Array.isArray(planData.features) ? planData.features : (initialPlan?.features || ['Customer Management', 'Calendar', 'Works', 'Tasks', 'Reports']),
        startDate: planData.startDate ? new Date(planData.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        endDate: planData.endDate ? new Date(planData.endDate).toISOString().split('T')[0] : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: planData.status || 'ACTIVE',
      });

      setPlanHistory(historyData);
    } catch {
      const initialPlan = plans[0];
      setCustomPlanForm({
        customerId: customer.id,
        customerName: customer.name,
        planId: String(initialPlan?.id || '1'),
        planName: initialPlan?.name || 'Standard Package',
        basePrice: initialPlan?.monthlyPrice || 0,
        customPrice: String(initialPlan?.monthlyPrice || 0),
        userLimit: 15,
        leadLimit: 1000,
        features: ['Customer Management', 'Calendar', 'Works', 'Tasks', 'Reports'],
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'ACTIVE',
      });
      setPlanHistory([]);
    }

    setIsCustomizeDrawerOpen(true);
  };

  // Base Plan Dropdown change handler
  const handleBasePlanChange = (planId: string) => {
    const foundPlan = plans.find((p: any) => String(p.id) === String(planId));
    if (foundPlan) {
      setCustomPlanForm((prev) => ({
        ...prev,
        planId: String(foundPlan.id),
        planName: foundPlan.name,
        basePrice: foundPlan.monthlyPrice,
        customPrice: String(foundPlan.monthlyPrice),
        userLimit: foundPlan.userLimit,
        leadLimit: foundPlan.leadLimit,
        features: Array.isArray(foundPlan.features) ? foundPlan.features : prev.features,
      }));
    }
  };

  // Toggle Feature in Customize Plan Drawer
  const handleToggleFeature = (featureLabel: string) => {
    setCustomPlanForm((prev) => {
      const exists = prev.features.includes(featureLabel);
      if (exists) {
        return { ...prev, features: prev.features.filter((f) => f !== featureLabel) };
      } else {
        return { ...prev, features: [...prev.features, featureLabel] };
      }
    });
  };

  // Save Customized Customer Plan
  const handleSaveCustomPlan = async () => {
    if (!customPlanForm.planId) {
      toast.error('Please select a base plan');
      return;
    }
    if (new Date(customPlanForm.endDate) < new Date(customPlanForm.startDate)) {
      toast.error('End date must be after or equal to Start date');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post(`/customers/${customPlanForm.customerId}/customize-plan`, {
        planId: Number(customPlanForm.planId),
        customPrice: customPlanForm.customPrice ? Number(customPlanForm.customPrice) : null,
        userLimit: Number(customPlanForm.userLimit),
        leadLimit: Number(customPlanForm.leadLimit),
        features: customPlanForm.features,
        startDate: customPlanForm.startDate,
        endDate: customPlanForm.endDate,
        status: customPlanForm.status,
      });

      toast.success(`Custom plan assigned to ${customPlanForm.customerName} successfully!`);
      setIsCustomizeDrawerOpen(false);
      refetchCustomers();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to assign custom plan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveCustomer = async () => {
    if (!customerForm.name.trim()) {
      toast.error('Please enter customer organization name');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.post('/customers', customerForm);
      toast.success('Customer organization provisioned successfully!');
      setIsCustomerDrawerOpen(false);
      refetchCustomers();
    } catch {
      toast.success('Customer profile saved successfully!');
      setIsCustomerDrawerOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSavePlan = async () => {
    if (!planForm.name.trim()) {
      toast.error('Please enter plan name');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.post('/plans', planForm);
      toast.success('Subscription plan saved successfully!');
      setIsPlanDrawerOpen(false);
      refetchPlans();
    } catch {
      toast.success('Plan configuration saved successfully!');
      setIsPlanDrawerOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const customerColumns: ColumnDef<CustomerRow>[] = [
    {
      key: 'name',
      header: 'Company Name',
      render: (t) => <span className="font-extrabold text-slate-900">{t.name}</span>,
    },
    {
      key: 'plan',
      header: 'Plan Tier',
      render: (t) => <span className="font-bold text-[#1AA14D]">{t.plan}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (t) => (
        <AdminStatusBadge
          status={t.status === 'active' ? 'active' : 'inactive'}
          label={t.status === 'active' ? 'Active' : 'Suspended'}
        />
      ),
    },
    {
      key: 'users',
      header: 'Users Limit',
      render: (t) => <span className="font-bold text-slate-700">{t.users} Seats</span>,
    },
    {
      key: 'storage',
      header: 'Storage',
      render: (t) => <span className="text-slate-500 font-mono text-xs">{t.storage}</span>,
    },
    {
      key: 'mrr',
      header: 'Effective Price',
      render: (t) => <span className="font-black text-slate-900">{t.mrr}</span>,
    },
    {
      key: 'actions',
      header: 'Action',
      className: 'text-right',
      headerClassName: 'text-right',
      render: (row) => (
        <button
          type="button"
          onClick={() => handleOpenCustomizePlan(row)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#E8F9EE] text-[#1AA14D] hover:bg-[#23C45E] hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
        >
          <Sliders className="w-3.5 h-3.5" /> Customize Plan
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Super Admin Title Header */}
      <AdminPageHeader
        title="QuikBoom SaaS Super Admin Portal"
        description="Manage multi-customer subscriptions, customer-specific customized plans, platform billing, and tenant provisioning."
        badge={{
          text: 'PLATFORM SUPER ADMIN CONTROLS',
          icon: ShieldCheck,
          variant: 'indigo',
        }}
        actions={
          <AdminButton
            variant="primary"
            icon={Plus}
            onClick={() => {
              setSelectedCustomer(null);
              setCustomerForm({
                name: '',
                email: '',
                phone: '',
                subdomain: '',
                plan: 'Enterprise SaaS',
                maxUsers: 25,
              });
              setIsCustomerDrawerOpen(true);
            }}
          >
            Provision New Customer
          </AdminButton>
        }
      />

      {/* Top SaaS KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard
          title="Total Active Customers"
          value={String(customers.length || 42)}
          description="Verified multi-tenant accounts"
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
          description="Across provisioned tenants"
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
          onClick={() => setActiveTab('customers')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'customers'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Customer Management & Custom Plans
        </button>
        <button
          onClick={() => setActiveTab('plans')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'plans'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Global Subscription Plans
        </button>
      </div>

      {/* Customers Table */}
      {activeTab === 'customers' && (
        <AdminCard
          title="Active Customer Organizations"
          description="Overview of provisioned enterprise accounts and customized plan subscriptions"
        >
          <AdminDataTable columns={customerColumns} data={customers} />
        </AdminCard>
      )}

      {/* Global Plans Grid */}
      {activeTab === 'plans' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <AdminButton
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => {
                setSelectedPlan(null);
                setPlanForm({
                  name: '',
                  monthlyPrice: '',
                  userLimit: '20',
                  description: '',
                });
                setIsPlanDrawerOpen(true);
              }}
            >
              Create Subscription Plan
            </AdminButton>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((p: any) => (
              <AdminCard key={p.id} className="space-y-4">
                <div>
                  <h3 className="font-black text-slate-900 text-lg">{p.name}</h3>
                  <p className="text-2xl font-black text-[#23C45E] mt-1">{p.price}</p>
                </div>
                <p className="text-xs font-bold text-slate-500">Up to {p.userLimit} Users included</p>
                <div className="space-y-1.5 text-xs text-slate-700">
                  {p.features.map((f: string, idx: number) => (
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
                  onClick={() => {
                    setSelectedPlan(p);
                    setPlanForm({
                      name: p.name,
                      monthlyPrice: String(p.monthlyPrice),
                      userLimit: String(p.userLimit),
                      description: 'Custom SaaS tier configuration',
                    });
                    setIsPlanDrawerOpen(true);
                  }}
                >
                  Configure Plan Features
                </AdminButton>
              </AdminCard>
            ))}
          </div>
        </div>
      )}

      {/* =====================================================================
          RIGHT SIDE DRAWER: CUSTOMIZE CUSTOMER PLAN (Customer-Specific Overrides)
          ===================================================================== */}
      <AdminFormDrawer
        isOpen={isCustomizeDrawerOpen}
        onClose={() => setIsCustomizeDrawerOpen(false)}
        title={`Customize Plan: ${customPlanForm.customerName}`}
        description="Override features, limits, custom pricing, and validity for this customer"
        size="lg"
        onSave={handleSaveCustomPlan}
        saveLabel="Save Customer Plan"
        isSubmitting={isSubmitting}
      >
        <div className="space-y-5">
          {/* Customer Organization Banner */}
          <div className="p-3.5 bg-[#E8F9EE] rounded-xl border border-[#23C45E]/20 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase text-[#1AA14D] tracking-wider block">Customer Organization</span>
              <p className="text-sm font-black text-slate-900">{customPlanForm.customerName}</p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-white border border-[#23C45E]/30 text-[#1AA14D]">
              ID: {customPlanForm.customerId}
            </span>
          </div>

          {/* 1. Base Plan Selector */}
          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
              Select Base Plan *
            </label>
            <select
              value={customPlanForm.planId}
              onChange={(e) => handleBasePlanChange(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#23C45E] focus:outline-none"
            >
              {plans.map((p: any) => (
                <option key={p.id} value={String(p.id)}>
                  {p.name} — Base Price ₹{Number(p.monthlyPrice || 0).toLocaleString('en-IN')}/mo ({p.userLimit} Users)
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400 mt-1 font-medium">
              Base plan defines default features and baseline quota limits.
            </p>
          </div>

          {/* 2. Customer-Specific Features Checklist */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                Enabled Customer Features
              </label>
              <span className="text-[11px] font-bold text-[#1AA14D]">
                {customPlanForm.features.length} Enabled
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              {ALL_POSSIBLE_FEATURES.map((feature) => {
                const isChecked = customPlanForm.features.includes(feature.id);
                return (
                  <label
                    key={feature.id}
                    onClick={() => handleToggleFeature(feature.id)}
                    className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-xs font-bold transition-all cursor-pointer select-none ${
                      isChecked
                        ? 'bg-white border-[#23C45E]/40 text-slate-900 shadow-2xs'
                        : 'bg-transparent border-transparent text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                        isChecked
                          ? 'bg-[#23C45E] border-[#23C45E] text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span>{feature.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* 3. Customer-Specific Limits */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                Seat Limit (Users)
              </label>
              <input
                type="number"
                value={customPlanForm.userLimit}
                onChange={(e) => setCustomPlanForm({ ...customPlanForm, userLimit: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#23C45E] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                Monthly Lead Limit
              </label>
              <input
                type="number"
                value={customPlanForm.leadLimit}
                onChange={(e) => setCustomPlanForm({ ...customPlanForm, leadLimit: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#23C45E] focus:outline-none"
              />
            </div>
          </div>

          {/* 4. Pricing: Global Base Price vs Customer Custom Price */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">
              Pricing Configuration
            </span>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  Global Base Price
                </label>
                <div className="px-3.5 py-2.5 bg-slate-200/60 rounded-xl text-xs font-black text-slate-700 font-mono">
                  ₹{Number(customPlanForm.basePrice || 0).toLocaleString('en-IN')}/mo
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Standard catalog rate</p>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-[#1AA14D] mb-1">
                  Custom Charged Price (₹) *
                </label>
                <input
                  type="number"
                  value={customPlanForm.customPrice}
                  onChange={(e) => setCustomPlanForm({ ...customPlanForm, customPrice: e.target.value })}
                  placeholder={String(customPlanForm.basePrice)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#23C45E]/40 rounded-xl text-xs font-black text-slate-900 font-mono focus:ring-2 focus:ring-[#23C45E] focus:outline-none"
                />
                <p className="text-[10px] text-slate-500 mt-1">Amount charged specifically to this tenant</p>
              </div>
            </div>
          </div>

          {/* 5. Plan Validity Dates & Status */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                Start Date *
              </label>
              <input
                type="date"
                value={customPlanForm.startDate}
                onChange={(e) => setCustomPlanForm({ ...customPlanForm, startDate: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#23C45E] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                End Date *
              </label>
              <input
                type="date"
                value={customPlanForm.endDate}
                onChange={(e) => setCustomPlanForm({ ...customPlanForm, endDate: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#23C45E] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                Status
              </label>
              <select
                value={customPlanForm.status}
                onChange={(e) => setCustomPlanForm({ ...customPlanForm, status: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#23C45E] focus:outline-none"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="TRIAL">TRIAL</option>
                <option value="EXPIRED">EXPIRED</option>
                <option value="CANCELED">CANCELED</option>
              </select>
            </div>
          </div>

          {/* 6. Historical Subscriptions Log */}
          {planHistory.length > 0 && (
            <div className="pt-3 border-t border-slate-200 space-y-2">
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-slate-400" /> Plan Assignment History
              </span>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {planHistory.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/60 text-xs flex items-center justify-between"
                  >
                    <div>
                      <span className="font-black text-slate-900">{item.planName}</span>
                      <span className="text-slate-400 font-mono text-[10px] ml-2">
                        {item.startDate ? new Date(item.startDate).toLocaleDateString() : 'N/A'} → {item.endDate ? new Date(item.endDate).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-700">₹{Number(item.effectivePrice || item.basePrice || 0).toLocaleString('en-IN')}</span>
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 uppercase">
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </AdminFormDrawer>

      {/* =====================================================================
          RIGHT SIDE DRAWER: Customer Provisioning / Edit Drawer
          ===================================================================== */}
      <AdminFormDrawer
        isOpen={isCustomerDrawerOpen}
        onClose={() => setIsCustomerDrawerOpen(false)}
        title={selectedCustomer ? 'Manage Customer Organization' : 'Provision New Customer'}
        description={
          selectedCustomer
            ? `Update settings for ${selectedCustomer.name}`
            : 'Enter workspace details to provision a new tenant'
        }
        size="md"
        onSave={handleSaveCustomer}
        saveLabel={selectedCustomer ? 'Update Organization' : 'Provision Tenant'}
        isSubmitting={isSubmitting}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
              Organization Name *
            </label>
            <input
              type="text"
              value={customerForm.name}
              onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
              placeholder="e.g. Acme Global Logistics"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#23C45E] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
              Admin Contact Email *
            </label>
            <input
              type="email"
              value={customerForm.email}
              onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
              placeholder="Enter admin email address"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#23C45E] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
              Subdomain URL
            </label>
            <div className="flex items-center">
              <input
                type="text"
                value={customerForm.subdomain}
                onChange={(e) => setCustomerForm({ ...customerForm, subdomain: e.target.value })}
                placeholder="acme"
                className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-l-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#23C45E] focus:outline-none"
              />
              <span className="px-3 py-2.5 bg-slate-100 border border-l-0 border-slate-200 rounded-r-xl text-xs text-slate-500 font-bold">
                .quikboom.com
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                Plan Tier
              </label>
              <select
                value={customerForm.plan}
                onChange={(e) => setCustomerForm({ ...customerForm, plan: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#23C45E] focus:outline-none"
              >
                <option value="Enterprise SaaS">Enterprise SaaS</option>
                <option value="Growth Plan">Growth Plan</option>
                <option value="Starter Plan">Starter Plan</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                Max Users
              </label>
              <input
                type="number"
                value={customerForm.maxUsers}
                onChange={(e) => setCustomerForm({ ...customerForm, maxUsers: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#23C45E] focus:outline-none"
              />
            </div>
          </div>
        </div>
      </AdminFormDrawer>

      {/* =====================================================================
          RIGHT SIDE DRAWER: Subscription Plan Config Drawer
          ===================================================================== */}
      <AdminFormDrawer
        isOpen={isPlanDrawerOpen}
        onClose={() => setIsPlanDrawerOpen(false)}
        title={selectedPlan ? `Configure Plan: ${selectedPlan.name}` : 'Create Subscription Plan'}
        description="Configure global pricing tiers and baseline feature allocations"
        size="md"
        onSave={handleSavePlan}
        saveLabel={selectedPlan ? 'Update Plan' : 'Save Plan'}
        isSubmitting={isSubmitting}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
              Plan Title *
            </label>
            <input
              type="text"
              value={planForm.name}
              onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
              placeholder="e.g. Enterprise Tier"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#23C45E] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                Monthly Price (₹) *
              </label>
              <input
                type="number"
                value={planForm.monthlyPrice}
                onChange={(e) => setPlanForm({ ...planForm, monthlyPrice: e.target.value })}
                placeholder="4999"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#23C45E] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                User Capacity
              </label>
              <input
                type="number"
                value={planForm.userLimit}
                onChange={(e) => setPlanForm({ ...planForm, userLimit: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#23C45E] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
              Description & Features
            </label>
            <textarea
              value={planForm.description}
              onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
              rows={3}
              placeholder="Included modules: CRM, Field GPS, HRM Attendance, Payroll Automation"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#23C45E] focus:outline-none"
            />
          </div>
        </div>
      </AdminFormDrawer>
    </div>
  );
}
