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

  const removeFeatureItem = (idx: number) => {
    const next = [...packageForm.features];
    next.splice(idx, 1);
    setPackageForm({ ...packageForm, features: next });
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
        description="Unified database source of truth for all customer packages, pricing, features, and limits displayed live on the Mobile App."
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

      {/* 2. PLANS GRID */}
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

      {/* 3. PACKAGE CREATE/EDIT MODAL */}
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
    </div>
  );
}
