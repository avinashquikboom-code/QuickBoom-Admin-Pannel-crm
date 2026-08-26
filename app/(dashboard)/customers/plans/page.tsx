'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  Layers,
  Plus,
  Edit2,
  Check,
  ArrowLeft,
  Sliders,
  Settings2,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { AdminPageHero } from '@/components/admin/layout/AdminPageHeader';
import { getErrorMessage } from '@/lib/utils';

export default function CustomerPlansPage() {
  const queryClient = useQueryClient();

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

  // Custom Plan Option Modal State
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
    minQuantity: 0,
    maxQuantity: 50,
    defaultQuantity: 1,
    isActive: true,
  });

  // 1. Fetch Standard Plans from Single Database Source of Truth
  const { data: plans = [], isLoading: isPlansLoading } = useQuery({
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
  const { data: customOptions = [], isLoading: isOptionsLoading } = useQuery({
    queryKey: ['custom-plan-options'],
    queryFn: async () => {
      try {
        const res = await api.get('/admin/custom-plan/options');
        return Array.isArray(res.data) ? res.data : [];
      } catch {
        try {
          const res = await api.get('/custom-plan/services');
          return Array.isArray(res.data) ? res.data : [];
        } catch {
          return [];
        }
      }
    },
  });

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

  // Custom Option Save Mutation
  const saveOptionMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (editingOption) {
        return api.patch(`/admin/custom-plan/options/${editingOption.id}`, payload);
      } else {
        return api.post('/admin/custom-plan/options', payload);
      }
    },
    onSuccess: () => {
      toast.success(editingOption ? 'Custom service updated successfully' : 'Custom service created successfully');
      setShowOptionModal(false);
      setEditingOption(null);
      queryClient.invalidateQueries({ queryKey: ['custom-plan-options'] });
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
      minQuantity: 0,
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
      minQuantity: Number(opt.minQuantity) || 0,
      maxQuantity: Number(opt.maxQuantity) || 50,
      defaultQuantity: Number(opt.defaultQuantity) || 1,
      isActive: opt.isActive !== false,
    });
    setShowOptionModal(true);
  };

  const addFeatureItem = () => {
    if (!featureInput.trim()) return;
    setPackageForm({
      ...packageForm,
      features: [...packageForm.features, featureInput.trim()],
    });
    setFeatureInput('');
  };

  const removeFeatureItem = (idx: number) => {
    const next = [...packageForm.features];
    next.splice(idx, 1);
    setPackageForm({ ...packageForm, features: next });
  };

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto pb-16 text-slate-800 animate-in fade-in-50 duration-200">
      {/* 1. HERO HEADER */}
      <AdminPageHero
        badge={{
          text: 'SINGLE SOURCE OF TRUTH',
          icon: Layers,
          variant: 'emerald',
        }}
        title="Subscription Plans & Pricing Engine"
        description="Unified database source of truth for standard packages and custom plan builder services displayed live on the Mobile App."
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/customers"
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-slate-900 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-white/20"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Customers</span>
            </Link>
            <button
              onClick={openCreatePackage}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Package</span>
            </button>
          </div>
        }
      />

      {/* 2. STANDARD PLANS GRID */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-black text-slate-900">Standard Subscription Plans</h2>
            <p className="text-xs text-slate-500 font-medium">Pre-configured curated tiers available on mobile and web.</p>
          </div>
        </div>

        {isPlansLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-3xl border border-slate-200 p-6 h-80 animate-pulse" />
            ))}
          </div>
        ) : plans.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center text-slate-400 font-bold">
            No subscription plans found in database. Click &quot;Create Package&quot; to add one.
          </div>
        ) : (
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
                          ACTIVE
                        </span>
                      )}
                      <button
                        onClick={() => openEditPackage(p)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title="Edit Plan"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-black text-slate-900">{p.name}</h3>
                    <p className="text-xs font-semibold text-emerald-600 mt-0.5">{p.description || 'Curated Growth Tier'}</p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-baseline justify-between">
                    <div>
                      <div className="text-2xl font-black text-slate-900">
                        ₹{Number(p.monthlyPrice).toLocaleString('en-IN')}
                        <span className="text-xs font-medium text-slate-400">/mo</span>
                      </div>
                      <div className="text-xs font-bold text-slate-500 mt-0.5">
                        ₹{Number(p.yearlyPrice).toLocaleString('en-IN')} /year
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="text-[10px] font-black tracking-wider text-slate-400 uppercase">Deliverables & Quotas</div>
                    <div className="space-y-1.5 text-xs font-medium text-slate-600">
                      {Array.isArray(p.features) &&
                        p.features.map((feat: string, idx: number) => (
                          <div key={idx} className="flex items-start gap-2">
                            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span className="line-clamp-2">{feat}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-400">
                  <span>Users: {p.userLimit || 'Unlimited'}</span>
                  <span>Leads: {p.leadLimit || 'Unlimited'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. CUSTOM PLAN SERVICES & PRICING ENGINE */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg font-black text-slate-900">Custom Plan Services & Unit Pricing</h2>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Configure per-unit prices used by the Mobile App &quot;Build Your Own Plan&quot; builder.
            </p>
          </div>
          <button
            onClick={openCreateOption}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Custom Service</span>
          </button>
        </div>

        {isOptionsLoading ? (
          <div className="p-8 text-center text-slate-400 font-medium">Loading custom plan options...</div>
        ) : customOptions.length === 0 ? (
          <div className="p-8 text-center text-slate-400 font-medium">No custom plan options configured. Click &quot;Add Custom Service&quot; to seed options.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-black uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Service Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Unit Pricing (Monthly)</th>
                  <th className="py-3 px-4">Unit Name</th>
                  <th className="py-3 px-4">Min / Max Qty</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {customOptions.map((opt: any) => (
                  <tr key={opt.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-black text-slate-900">{opt.name}</div>
                      <div className="text-[11px] text-slate-400">{opt.code}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-black uppercase">
                        {opt.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-black text-slate-900">₹{Number(opt.monthlyPrice).toLocaleString('en-IN')}</span>
                      <span className="text-slate-400"> / {opt.unitName || 'unit'}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-semibold">{opt.unitName || 'unit'}</td>
                    <td className="py-3.5 px-4 text-slate-700">{opt.minQuantity} – {opt.maxQuantity}</td>
                    <td className="py-3.5 px-4">
                      {opt.isActive !== false ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black">
                          ACTIVE
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-black">
                          INACTIVE
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => openEditOption(opt)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg transition-colors cursor-pointer text-xs"
                      >
                        Edit Price
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. PACKAGE MODAL (CREATE / EDIT STANDARD PLAN) */}
      {showPackageModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-base">
                {editingPackage ? `Edit ${editingPackage.name}` : 'Create Subscription Package'}
              </h3>
              <button
                onClick={() => setShowPackageModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-sm cursor-pointer"
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
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Package Code</label>
                  <input
                    type="text"
                    value={packageForm.code}
                    onChange={(e) => setPackageForm({ ...packageForm, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. STANDARD"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 uppercase"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Monthly Price (₹)</label>
                  <input
                    type="number"
                    value={packageForm.monthlyPrice}
                    onChange={(e) => setPackageForm({ ...packageForm, monthlyPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Yearly Price (₹)</label>
                <input
                  type="number"
                  value={packageForm.yearlyPrice}
                  onChange={(e) => setPackageForm({ ...packageForm, yearlyPrice: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description / Subtitle</label>
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

      {/* 5. CUSTOM OPTION MODAL (CREATE / EDIT CUSTOM SERVICE) */}
      {showOptionModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-base">
                {editingOption ? `Edit Service: ${editingOption.name}` : 'Add Custom Plan Service'}
              </h3>
              <button
                onClick={() => setShowOptionModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Service Name</label>
                <input
                  type="text"
                  value={optionForm.name}
                  onChange={(e) => setOptionForm({ ...optionForm, name: e.target.value })}
                  placeholder="e.g. Social Media Reels"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Service Code</label>
                  <input
                    type="text"
                    value={optionForm.code}
                    onChange={(e) => setOptionForm({ ...optionForm, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. OPT_REELS"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 uppercase"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Monthly Unit Price (₹)</label>
                  <input
                    type="number"
                    value={optionForm.monthlyPrice}
                    onChange={(e) => setOptionForm({ ...optionForm, monthlyPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Unit Name</label>
                  <input
                    type="text"
                    value={optionForm.unitName}
                    onChange={(e) => setOptionForm({ ...optionForm, unitName: e.target.value })}
                    placeholder="e.g. Reel, Post, Campaign"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={optionForm.category}
                    onChange={(e) => setOptionForm({ ...optionForm, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  >
                    <option value="CONTENT">CONTENT</option>
                    <option value="CREATIVES">CREATIVES</option>
                    <option value="ADS">ADS</option>
                    <option value="SUPPORT">SUPPORT</option>
                    <option value="CRM">CRM</option>
                    <option value="STORAGE">STORAGE</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="optActive"
                  checked={optionForm.isActive}
                  onChange={(e) => setOptionForm({ ...optionForm, isActive: e.target.checked })}
                  className="w-4 h-4 rounded text-emerald-600"
                />
                <label htmlFor="optActive" className="font-bold text-slate-700">
                  Active in Custom Plan Builder
                </label>
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
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl cursor-pointer shadow-sm"
              >
                {saveOptionMutation.isPending ? 'Saving...' : 'Save Service'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
