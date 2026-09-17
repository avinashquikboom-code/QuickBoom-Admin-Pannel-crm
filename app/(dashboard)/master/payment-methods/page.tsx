'use client';

import React, { useState } from 'react';
import {
  Banknote,
  CheckCircle,
  RefreshCw,
  CreditCard,
  Shield,
  ExternalLink,
  Plus,
  Edit2,
  Trash2,
  Search,
} from 'lucide-react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import api from '@/lib/api';
import {
  AdminPageHero,
  AdminFormDrawer,
  AdminConfirmDialog,
  AdminFormField,
  AdminInput,
} from '@/components/admin';
import { getErrorMessage } from '@/lib/utils';

interface PaymentMethodItem {
  id: number;
  code: string;
  name: string;
  type: string;
  category?: string;
  isEnabled: boolean;
  mode?: string;
  transactionsCount: number;
  description: string;
  isActive?: boolean;
}

export default function MasterPaymentMethodsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');

  // Drawers & Modals
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PaymentMethodItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<PaymentMethodItem | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category: 'ONLINE',
    mode: 'TEST',
    isEnabled: true,
    description: '',
  });

  const { data: resData, isLoading, refetch } = useQuery({
    queryKey: ['master-payment-methods'],
    queryFn: async () => {
      const res: any = await api.get('/master/payment-methods');
      return res?.data || res || {};
    },
  });

  const methods: PaymentMethodItem[] = Array.isArray(resData?.data)
    ? resData.data
    : Array.isArray(resData)
    ? resData
    : [];
  const gatewayConfig = resData?.gatewayConfig || {};

  const filtered = methods.filter((pm) =>
    pm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pm.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (pm.description && pm.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Save Mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!formData.code.trim() || !formData.name.trim()) {
        throw new Error('Code and Name are required');
      }

      const meta = {
        mode: formData.mode,
        isEnabled: Boolean(formData.isEnabled),
      };

      if (editingItem) {
        return api.patch(`/master/items/${editingItem.id}`, {
          code: formData.code.trim().toUpperCase(),
          name: formData.name.trim(),
          category: formData.category,
          description: formData.description.trim(),
          isActive: formData.isEnabled,
          meta,
        });
      } else {
        return api.post('/master/items', {
          type: 'PAYMENT_METHOD',
          code: formData.code.trim().toUpperCase(),
          name: formData.name.trim(),
          category: formData.category,
          description: formData.description.trim(),
          isActive: formData.isEnabled,
          meta,
        });
      }
    },
    onSuccess: () => {
      toast.success(editingItem ? 'Payment method updated successfully' : 'Payment method created successfully');
      queryClient.invalidateQueries({ queryKey: ['master-payment-methods'] });
      queryClient.invalidateQueries({ queryKey: ['master-summary'] });
      setIsDrawerOpen(false);
      setEditingItem(null);
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return api.delete(`/master/items/${id}`);
    },
    onSuccess: () => {
      toast.success('Payment method deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['master-payment-methods'] });
      queryClient.invalidateQueries({ queryKey: ['master-summary'] });
      setDeletingItem(null);
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData({
      code: '',
      name: '',
      category: 'ONLINE',
      mode: 'TEST',
      isEnabled: true,
      description: '',
    });
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (item: PaymentMethodItem) => {
    setEditingItem(item);
    setFormData({
      code: item.code,
      name: item.name,
      category: item.type || item.category || 'ONLINE',
      mode: item.mode || 'TEST',
      isEnabled: item.isEnabled ?? true,
      description: item.description || '',
    });
    setIsDrawerOpen(true);
  };

  return (
    <div className="space-y-6">
      <AdminPageHero
        title="Payment Methods Master"
        description="Supported client payment channels, gateway integration status, automated Razorpay checkout, and manual offline transfer rules."
        badge={{ text: 'Billing & Gateway', icon: Banknote, variant: 'indigo' }}
        actions={
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => refetch()}
              className="p-2.5 bg-white/10 hover:bg-white/15 text-white rounded-2xl border border-white/10 text-xs font-black transition-all cursor-pointer backdrop-blur-xs active:scale-95"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#23C45E] hover:bg-[#1AA14D] text-slate-950 font-black rounded-2xl text-xs shadow-md shadow-[#23C45E]/20 transition-all cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add Payment Method</span>
            </button>
          </div>
        }
      />

      <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">
              Payment Gateway Mode: {gatewayConfig.mode || 'TEST'}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Live Checkout credentials and gateway webhooks configured in Admin Integrations.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Link
            href="/settings"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
          >
            Manage Keys <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((pm) => (
          <div
            key={pm.id || pm.code}
            className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-sm transition-all"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${
                    pm.type === 'ONLINE'
                      ? 'bg-blue-50 text-blue-700 border-blue-100'
                      : 'bg-amber-50 text-amber-700 border-amber-100'
                  }`}
                >
                  {pm.type}
                </span>

                <div className="flex items-center gap-1">
                  {pm.isEnabled ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 mr-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Active Channel
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-400 mr-1">Disabled</span>
                  )}

                  <button
                    type="button"
                    onClick={() => handleOpenEdit(pm)}
                    className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingItem(pm)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <h3 className="text-base font-black text-slate-900 mt-3">{pm.name}</h3>
              <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                {pm.description || 'Payment acceptance channel.'}
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Captured Transactions</span>
                <span className="text-base font-black text-slate-900">{pm.transactionsCount || 0} Invoices</span>
              </div>
              <span className="text-[10px] font-mono font-bold text-slate-400 px-2 py-0.5 bg-slate-100 rounded-md">
                {pm.code}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* CREATE / EDIT DRAWER */}
      <AdminFormDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={editingItem ? 'Edit Payment Method' : 'Add Payment Method'}
        description="Configure client payment options, online gateway, or offline wire instructions."
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <button
              type="button"
              onClick={() => setIsDrawerOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="px-5 py-2 bg-[#23C45E] hover:bg-[#1AA14D] text-slate-950 font-black rounded-xl text-xs transition-all disabled:opacity-50"
            >
              {saveMutation.isPending ? 'Saving...' : editingItem ? 'Update Method' : 'Create Method'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <AdminFormField label="Method Code" required hint="Uppercase identifier (e.g. STRIPE, CHEQUE)">
            <AdminInput
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="e.g. STRIPE"
            />
          </AdminFormField>

          <AdminFormField label="Method Name" required hint="Display title on invoice payment screens">
            <AdminInput
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Stripe International Cards"
            />
          </AdminFormField>

          <div className="grid grid-cols-2 gap-3">
            <AdminFormField label="Channel Type" required>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
              >
                <option value="ONLINE">ONLINE</option>
                <option value="OFFLINE">OFFLINE</option>
              </select>
            </AdminFormField>

            <AdminFormField label="Mode" required>
              <select
                value={formData.mode}
                onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
              >
                <option value="TEST">TEST</option>
                <option value="LIVE">LIVE</option>
              </select>
            </AdminFormField>
          </div>

          <AdminFormField label="Status">
            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={formData.isEnabled}
                onChange={(e) => setFormData({ ...formData, isEnabled: e.target.checked })}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-xs font-bold text-slate-700">Enable Method for Customer Checkout</span>
            </label>
          </AdminFormField>

          <AdminFormField label="Description">
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Instructions shown to clients upon checkout..."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
            />
          </AdminFormField>
        </div>
      </AdminFormDrawer>

      {/* CONFIRM DELETE DIALOG */}
      <AdminConfirmDialog
        isOpen={Boolean(deletingItem)}
        onClose={() => setDeletingItem(null)}
        onConfirm={() => {
          if (deletingItem) deleteMutation.mutate(deletingItem.id);
        }}
        isLoading={deleteMutation.isPending}
        title="Delete Payment Method?"
        message={`Are you sure you want to delete "${deletingItem?.name}" (${deletingItem?.code})?`}
        confirmText="Delete Record"
        variant="danger"
      />
    </div>
  );
}
