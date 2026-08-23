'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Layers,
  Plus,
  ShieldCheck,
  CheckCircle2,
  Users,
  DollarSign,
  Zap,
  Sparkles,
  ArrowLeft,
  RefreshCw,
  Building2,
  Sliders,
  ShoppingBag,
  Clock,
  Edit2,
  Trash2,
  Eye,
  Check,
  X,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { AdminPageHero, AdminStatCard } from '@/components/admin';
import { toast } from 'react-hot-toast';
import { getErrorMessage } from '@/lib/utils';

export default function CustomerPlansPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'PACKAGES' | 'OPTIONS' | 'ORDERS'>('PACKAGES');

  // Package Modal State (Admin Package Management)
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState<any>(null);
  const [packageForm, setPackageForm] = useState({
    name: '',
    code: '',
    description: '',
    monthlyPrice: 9999,
    yearlyPrice: 95990,
    userLimit: 5,
    leadLimit: 500,
    features: ['4 Reels', '3 Creative Posts', '1 Influencer Promotion', '3 Stories'],
    isActive: true,
  });
  const [featureInput, setFeatureInput] = useState('');

  // Option Modal State
  const [showOptionModal, setShowOptionModal] = useState(false);
  const [editingOption, setEditingOption] = useState<any>(null);
  const [optionForm, setOptionForm] = useState({
    name: '',
    code: '',
    description: '',
    category: 'CONTENT',
    monthlyPrice: 1000,
    pricingType: 'PER_UNIT',
    unitName: 'unit',
    minQuantity: 1,
    maxQuantity: 50,
    defaultQuantity: 1,
    isActive: true,
  });

  // Selected Order Drawer
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  // 1. Fetch Standard Plans from Single Database Source of Truth
  const { data: plans = [], isLoading: isPlansLoading, refetch: refetchPlans } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      try {
        const res = await api.get('/admin/plans');
        return Array.isArray(res.data) ? res.data : [];
      } catch {
        try {
          const res = await api.get('/plans');
          return Array.isArray(res.data) ? res.data : [];
        } catch {
          return [];
        }
      }
    },
  });

  // 2. Fetch Custom Plan Configurable Options
  const { data: options = [], isLoading: isOptionsLoading } = useQuery({
    queryKey: ['admin-custom-plan-options'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/admin/custom-plan/options');
        const items = res?.data?.data || res?.data || (Array.isArray(res) ? res : []);
        return Array.isArray(items) ? items : [];
      } catch {
        return [];
      }
    },
    enabled: activeTab === 'OPTIONS',
  });

  // 3. Fetch Custom Plan Orders
  const { data: ordersResponse, isLoading: isOrdersLoading } = useQuery({
    queryKey: ['admin-custom-plans-list'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/admin/custom-plans');
        const items = res?.data?.data || res?.data?.items || res?.items || res?.data || (Array.isArray(res) ? res : []);
        return Array.isArray(items) ? items : [];
      } catch {
        return [];
      }
    },
    enabled: activeTab === 'ORDERS',
  });

  const customOrders: any[] = ordersResponse || [];

  // Package Save Mutation
  const savePackageMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (editingPackage) {
        return api.patch(`/admin/plans/${editingPackage.id}`, payload);
      } else {
        return api.post('/admin/plans', payload);
      }
    },
    onSuccess: () => {
      toast.success(editingPackage ? 'Package updated successfully' : 'Package created successfully');
      setShowPackageModal(false);
      setEditingPackage(null);
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  // Package Delete / Deactivate Mutation
  const deletePackageMutation = useMutation({
    mutationFn: async (id: number) => {
      return api.delete(`/admin/plans/${id}`);
    },
    onSuccess: () => {
      toast.success('Package deactivated successfully');
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  // Option Create / Update Mutation
  const saveOptionMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (editingOption) {
        return api.patch(`/admin/custom-plan/options/${editingOption.id}`, payload);
      } else {
        return api.post('/admin/custom-plan/options', payload);
      }
    },
    onSuccess: () => {
      toast.success(editingOption ? 'Option updated' : 'Option created');
      setShowOptionModal(false);
      setEditingOption(null);
      queryClient.invalidateQueries({ queryKey: ['admin-custom-plan-options'] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  // Option Delete Mutation
  const deleteOptionMutation = useMutation({
    mutationFn: async (id: number) => {
      return api.delete(`/admin/custom-plan/options/${id}`);
    },
    onSuccess: () => {
      toast.success('Option deactivated');
      queryClient.invalidateQueries({ queryKey: ['admin-custom-plan-options'] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  const openCreatePackage = () => {
    setEditingPackage(null);
    setPackageForm({
      name: '',
      code: '',
      description: '',
      monthlyPrice: 9999,
      yearlyPrice: 95990,
      userLimit: 5,
      leadLimit: 500,
      features: ['4 Reels', '3 Creative Posts', '1 Influencer Promotion', '3 Stories'],
      isActive: true,
    });
    setFeatureInput('');
    setShowPackageModal(true);
  };

  const openEditPackage = (pkg: any) => {
    setEditingPackage(pkg);
    setPackageForm({
      name: pkg.name || '',
      code: pkg.code || '',
      description: pkg.description || '',
      monthlyPrice: Number(pkg.monthlyPrice) || 0,
      yearlyPrice: Number(pkg.yearlyPrice) || 0,
      userLimit: Number(pkg.userLimit) || 5,
      leadLimit: Number(pkg.leadLimit) || 500,
      features: Array.isArray(pkg.features) ? [...pkg.features] : [],
      isActive: pkg.isActive !== false,
    });
    setFeatureInput('');
    setShowPackageModal(true);
  };

  const addFeatureItem = () => {
    if (!featureInput.trim()) return;
    setPackageForm({
      ...packageForm,
      features: [...packageForm.features, featureInput.trim()],
    });
    setFeatureInput('');
  };

  const removeFeatureItem = (index: number) => {
    const updated = [...packageForm.features];
    updated.splice(index, 1);
    setPackageForm({ ...packageForm, features: updated });
  };

  const openCreateOption = () => {
    setEditingOption(null);
    setOptionForm({
      name: '',
      code: '',
      description: '',
      category: 'CONTENT',
      monthlyPrice: 1000,
      pricingType: 'PER_UNIT',
      unitName: 'unit',
      minQuantity: 1,
      maxQuantity: 50,
      defaultQuantity: 1,
      isActive: true,
    });
    setShowOptionModal(true);
  };

  const openEditOption = (opt: any) => {
    setEditingOption(opt);
    setOptionForm({
      name: opt.name || '',
      code: opt.code || '',
      description: opt.description || '',
      category: opt.category || 'CONTENT',
      monthlyPrice: Number(opt.monthlyPrice) || 0,
      pricingType: opt.pricingType || 'PER_UNIT',
      unitName: opt.unitName || 'unit',
      minQuantity: Number(opt.minQuantity) || 1,
      maxQuantity: Number(opt.maxQuantity) || 50,
      defaultQuantity: Number(opt.defaultQuantity) || 1,
      isActive: opt.isActive !== false,
    });
    setShowOptionModal(true);
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-16 text-slate-800 animate-in fade-in-50 duration-200">
      {/* 1. HERO HEADER */}
      <AdminPageHero
        badge={{
          text: 'SINGLE SOURCE OF TRUTH',
          icon: Layers,
          variant: 'emerald',
        }}
        title="Subscription Plans & Pricing Engine"
        description="Unified database source of truth for Mobile App & Admin Panel default plans, custom add-ons, and client subscriptions."
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/customers"
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-slate-900 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-white/20"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Customers</span>
            </Link>
            {activeTab === 'PACKAGES' && (
              <button
                onClick={openCreatePackage}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Package</span>
              </button>
            )}
            {activeTab === 'OPTIONS' && (
              <button
                onClick={openCreateOption}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Custom Option</span>
              </button>
            )}
          </div>
        }
      />

      {/* 2. TAB CONTROLS */}
      <div className="flex bg-white rounded-2xl p-1.5 border border-slate-200 shadow-xs w-fit">
        <button
          onClick={() => setActiveTab('PACKAGES')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeTab === 'PACKAGES'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Default Packages ({plans.length})
        </button>
        <button
          onClick={() => setActiveTab('OPTIONS')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'OPTIONS'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Mobile Custom Options</span>
        </button>
        <button
          onClick={() => setActiveTab('ORDERS')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'ORDERS'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Customer Custom Plans</span>
        </button>
      </div>

      {/* 3. TAB CONTENT */}
      {activeTab === 'PACKAGES' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((p: any) => (
            <div
              key={p.id}
              className={`bg-white rounded-3xl border p-6 flex flex-col justify-between shadow-xs transition-all space-y-6 ${
                p.isActive !== false ? 'border-slate-200 hover:border-emerald-500/50 hover:shadow-md' : 'border-slate-200 bg-slate-50/50 opacity-75'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-black uppercase">
                    {p.code}
                  </span>
                  <div className="flex items-center gap-2">
                    {p.isActive === false ? (
                      <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-black">
                        INACTIVE
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black">
                        LIVE ON MOBILE
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-black text-slate-900 text-xl">{p.name}</h3>
                  <p className="text-xs text-slate-500 font-medium mt-1">{p.description}</p>
                </div>

                <div className="pt-2">
                  <div className="text-2xl font-black text-slate-900">
                    ₹{Number(p.monthlyPrice).toLocaleString()}
                    <span className="text-xs font-bold text-slate-400"> / month</span>
                  </div>
                  <div className="text-xs text-slate-400 font-medium">
                    ₹{Number(p.yearlyPrice).toLocaleString()} billed annually
                  </div>
                </div>

                <div className="pt-2 text-xs font-bold text-slate-500">
                  {p.userLimit} Seats • {p.leadLimit} Leads
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-2">
                  <div className="text-[11px] font-black uppercase text-slate-400">Included Deliverables:</div>
                  <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                    {Array.isArray(p.features) &&
                      p.features.map((f: string, i: number) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-slate-700 font-medium">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{f}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => openEditPackage(p)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Edit Plan</span>
                </button>
                {p.isActive !== false && (
                  <button
                    onClick={() => {
                      if (confirm(`Deactivate ${p.name}? It will no longer appear on Customer Mobile for new purchases.`)) {
                        deletePackageMutation.mutate(p.id);
                      }
                    }}
                    className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs transition-all cursor-pointer"
                  >
                    Deactivate
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'OPTIONS' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-black text-slate-900 text-base">Mobile Custom Plan Add-ons</h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Admin-controlled options exposed in the Customer Mobile App builder.
              </p>
            </div>
            <span className="text-xs font-bold text-slate-400">{options.length} options active</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 font-black uppercase border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Option Name & Code</th>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5">Pricing Type</th>
                  <th className="px-5 py-3.5">Monthly Price</th>
                  <th className="px-5 py-3.5">Min / Max Qty</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {options.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-slate-400 font-bold">
                      No custom plan options configured. Click &quot;Add Custom Option&quot; above.
                    </td>
                  </tr>
                ) : (
                  options.map((opt: any) => (
                    <tr key={opt.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900">{opt.name}</div>
                        <div className="text-slate-400 font-mono text-[10px]">{opt.code}</div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px]">
                          {opt.category}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-bold text-slate-600">
                        {opt.pricingType === 'FLAT' ? 'FLAT (Monthly)' : `PER UNIT (${opt.unitName || 'unit'})`}
                      </td>
                      <td className="px-5 py-4 font-black text-slate-900">
                        ₹{Number(opt.monthlyPrice).toLocaleString()} / mo
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {opt.minQuantity} - {opt.maxQuantity} {opt.unitName}s
                      </td>
                      <td className="px-5 py-4">
                        {opt.isActive ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-black text-[10px]">
                            ACTIVE
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-black text-[10px]">
                            INACTIVE
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right space-x-2">
                        <button
                          onClick={() => openEditOption(opt)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-all cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Deactivate ${opt.name}?`)) {
                              deleteOptionMutation.mutate(opt.id);
                            }
                          }}
                          className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg transition-all cursor-pointer"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'ORDERS' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-black text-slate-900 text-base">Customer Custom Plan Contracts</h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Custom plans configured & purchased by customers from Mobile App.
              </p>
            </div>
            <span className="text-xs font-bold text-slate-400">{customOrders.length} contracts</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 font-black uppercase border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Order Number</th>
                  <th className="px-5 py-3.5">Customer</th>
                  <th className="px-5 py-3.5">Duration</th>
                  <th className="px-5 py-3.5">Subtotal</th>
                  <th className="px-5 py-3.5">Discount</th>
                  <th className="px-5 py-3.5">Final Amount (with GST)</th>
                  <th className="px-5 py-3.5">Activation & Expiry</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {customOrders.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-16 text-center text-slate-400 font-bold">
                      No custom plan purchases yet.
                    </td>
                  </tr>
                ) : (
                  customOrders.map((ord: any) => (
                    <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-4 font-mono font-bold text-slate-600">{ord.orderNumber}</td>
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900">{ord.customer?.name || 'Customer'}</div>
                        <div className="text-slate-400 text-[11px]">{ord.customer?.email}</div>
                      </td>
                      <td className="px-5 py-4 font-bold text-slate-800">{ord.duration} Months</td>
                      <td className="px-5 py-4 text-slate-600">₹{Number(ord.subtotal).toLocaleString()}</td>
                      <td className="px-5 py-4 text-emerald-600 font-bold">-₹{Number(ord.discount).toLocaleString()}</td>
                      <td className="px-5 py-4 font-black text-slate-900">₹{Number(ord.totalAmount).toLocaleString()}</td>
                      <td className="px-5 py-4 text-slate-600">
                        {ord.startDate ? (
                          <span>
                            {new Date(ord.startDate).toLocaleDateString()} - {new Date(ord.expiryDate).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-slate-400">Pending Payment</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-black text-[10px] ${
                            ord.status === 'ACTIVATED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : ord.status === 'PAID'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {ord.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => setSelectedOrder(ord)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg text-xs cursor-pointer"
                        >
                          View Breakdown
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. PACKAGE CREATE/EDIT MODAL */}
      {showPackageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-900 text-lg">
                {editingPackage ? `Edit Plan: ${editingPackage.name}` : 'New Standard Package'}
              </h3>
              <button
                onClick={() => setShowPackageModal(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Package Name</label>
                <input
                  type="text"
                  value={packageForm.name}
                  onChange={(e) => setPackageForm({ ...packageForm, name: e.target.value })}
                  placeholder="e.g. Standard Package"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Code (Unique)</label>
                <input
                  type="text"
                  value={packageForm.code}
                  onChange={(e) => setPackageForm({ ...packageForm, code: e.target.value })}
                  placeholder="STANDARD"
                  disabled={!!editingPackage}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Monthly Price (₹)</label>
                  <input
                    type="number"
                    value={packageForm.monthlyPrice}
                    onChange={(e) => setPackageForm({ ...packageForm, monthlyPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-black text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Yearly Price (₹)</label>
                  <input
                    type="number"
                    value={packageForm.yearlyPrice}
                    onChange={(e) => setPackageForm({ ...packageForm, yearlyPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-black text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">User Limit (Seats)</label>
                  <input
                    type="number"
                    value={packageForm.userLimit}
                    onChange={(e) => setPackageForm({ ...packageForm, userLimit: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Lead Limit</label>
                  <input
                    type="number"
                    value={packageForm.leadLimit}
                    onChange={(e) => setPackageForm({ ...packageForm, leadLimit: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={packageForm.description}
                  onChange={(e) => setPackageForm({ ...packageForm, description: e.target.value })}
                  placeholder="Target audience & description..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Deliverables & Features</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={featureInput}
                    onChange={(e) => setFeatureInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addFeatureItem();
                      }
                    }}
                    placeholder="e.g. 6 Reels or Trending Hashtags"
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={addFeatureItem}
                    className="px-3 py-2 bg-slate-900 text-white font-bold rounded-xl cursor-pointer"
                  >
                    Add
                  </button>
                </div>
                <div className="space-y-1 max-h-36 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
                  {packageForm.features.map((f, idx) => (
                    <div key={idx} className="flex items-center justify-between p-1 text-slate-800">
                      <span>• {f}</span>
                      <button
                        type="button"
                        onClick={() => removeFeatureItem(idx)}
                        className="text-rose-500 hover:text-rose-700 font-bold"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="pkgActive"
                  checked={packageForm.isActive}
                  onChange={(e) => setPackageForm({ ...packageForm, isActive: e.target.checked })}
                  className="w-4 h-4 rounded text-emerald-600"
                />
                <label htmlFor="pkgActive" className="font-bold text-slate-700">
                  Active (Visible on Customer Mobile App)
                </label>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowPackageModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => savePackageMutation.mutate(packageForm)}
                disabled={savePackageMutation.isPending || !packageForm.name || !packageForm.code}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl cursor-pointer shadow-sm"
              >
                {savePackageMutation.isPending ? 'Saving...' : 'Save Plan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. OPTION CREATE/EDIT MODAL */}
      {showOptionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-900 text-lg">
                {editingOption ? 'Edit Plan Option' : 'New Plan Feature Option'}
              </h3>
              <button
                onClick={() => setShowOptionModal(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Feature Name</label>
                <input
                  type="text"
                  value={optionForm.name}
                  onChange={(e) => setOptionForm({ ...optionForm, name: e.target.value })}
                  placeholder="e.g. Influencer Collaboration Reel"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Code (Unique)</label>
                  <input
                    type="text"
                    value={optionForm.code}
                    onChange={(e) => setOptionForm({ ...optionForm, code: e.target.value })}
                    placeholder="OPT_INFLUENCER"
                    disabled={!!editingOption}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={optionForm.category}
                    onChange={(e) => setOptionForm({ ...optionForm, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  >
                    <option value="CONTENT">Content / Reels</option>
                    <option value="CREATIVES">Creatives / Posts</option>
                    <option value="ADS">Ads Management</option>
                    <option value="CRM">CRM & Seats</option>
                    <option value="STORAGE">Cloud Storage</option>
                    <option value="SUPPORT">Account Management</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Monthly Price (₹)</label>
                  <input
                    type="number"
                    value={optionForm.monthlyPrice}
                    onChange={(e) => setOptionForm({ ...optionForm, monthlyPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pricing Type</label>
                  <select
                    value={optionForm.pricingType}
                    onChange={(e) => setOptionForm({ ...optionForm, pricingType: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  >
                    <option value="PER_UNIT">Per Unit</option>
                    <option value="FLAT">Flat Fee</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Unit Name</label>
                  <input
                    type="text"
                    value={optionForm.unitName}
                    onChange={(e) => setOptionForm({ ...optionForm, unitName: e.target.value })}
                    placeholder="Reel, Post, Seat"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Min Qty</label>
                  <input
                    type="number"
                    value={optionForm.minQuantity}
                    onChange={(e) => setOptionForm({ ...optionForm, minQuantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Max Qty</label>
                  <input
                    type="number"
                    value={optionForm.maxQuantity}
                    onChange={(e) => setOptionForm({ ...optionForm, maxQuantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={optionForm.description}
                  onChange={(e) => setOptionForm({ ...optionForm, description: e.target.value })}
                  placeholder="Explain what the customer receives with this option..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowOptionModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => saveOptionMutation.mutate(optionForm)}
                disabled={saveOptionMutation.isPending || !optionForm.name || !optionForm.code}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl cursor-pointer shadow-sm"
              >
                {saveOptionMutation.isPending ? 'Saving...' : 'Save Option'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. ORDER DETAIL MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-slate-900 text-lg">Custom Plan Order Breakdown</h3>
                <p className="text-xs text-slate-400 font-mono">{selectedOrder.orderNumber}</p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-4 rounded-2xl space-y-1.5 border border-slate-100">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold">Customer:</span>
                  <span className="font-bold text-slate-900">{selectedOrder.customer?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold">Duration:</span>
                  <span className="font-bold text-slate-900">{selectedOrder.duration} Months</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold">Status:</span>
                  <span className="font-bold text-emerald-600">{selectedOrder.status}</span>
                </div>
              </div>

              <div className="border border-slate-100 rounded-2xl p-4 space-y-2">
                <div className="font-black text-slate-800 uppercase tracking-wider text-[10px]">
                  Selected Options Snapshot:
                </div>
                <div className="space-y-1">
                  {Array.isArray(selectedOrder.selectedFeatures) &&
                    selectedOrder.selectedFeatures.map((f: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-slate-700">
                        <span>
                          {f.quantity}x {f.name}
                        </span>
                        <span className="font-bold">₹{Number(f.totalPrice || 0).toLocaleString()}</span>
                      </div>
                    ))}
                </div>
                <div className="border-t border-slate-100 pt-2 space-y-1">
                  <div className="flex justify-between text-slate-500">
                    <span>Subtotal:</span>
                    <span>₹{Number(selectedOrder.subtotal).toLocaleString()}</span>
                  </div>
                  {Number(selectedOrder.discount) > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Duration Discount:</span>
                      <span>-₹{Number(selectedOrder.discount).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-500">
                    <span>GST (18%):</span>
                    <span>₹{Number(selectedOrder.tax).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-black text-slate-900 text-sm pt-1 border-t border-slate-200">
                    <span>Final Amount:</span>
                    <span>₹{Number(selectedOrder.totalAmount).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-5 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
