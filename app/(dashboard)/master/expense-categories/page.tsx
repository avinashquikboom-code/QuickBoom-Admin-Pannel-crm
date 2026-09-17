'use client';

import React, { useState } from 'react';
import {
  CreditCard,
  CheckCircle,
  RefreshCw,
  Plus,
  Edit2,
  Trash2,
  Search,
  XCircle,
} from 'lucide-react';
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

interface ExpenseCategoryItem {
  id: number;
  code: string;
  name: string;
  description: string;
  count: number;
  isAllowed: boolean;
  isActive: boolean;
}

export default function MasterExpenseCategoriesPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');

  // Drawers & Modals
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ExpenseCategoryItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<ExpenseCategoryItem | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    isAllowed: true,
  });

  const { data: resData, isLoading, refetch } = useQuery({
    queryKey: ['master-expense-categories'],
    queryFn: async () => {
      const res: any = await api.get('/master/expense-categories');
      return res?.data || res || {};
    },
  });

  const categories: ExpenseCategoryItem[] = Array.isArray(resData?.data)
    ? resData.data
    : Array.isArray(resData)
    ? resData
    : [];
  const monthlyCeiling = resData?.policyLimit || 100000;

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.description && c.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Save Mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!formData.code.trim() || !formData.name.trim()) {
        throw new Error('Code and Name are required');
      }

      if (editingItem) {
        return api.patch(`/master/items/${editingItem.id}`, {
          code: formData.code.trim().toUpperCase(),
          name: formData.name.trim(),
          description: formData.description.trim(),
          meta: { isAllowed: formData.isAllowed },
        });
      } else {
        return api.post('/master/items', {
          type: 'EXPENSE_CATEGORY',
          code: formData.code.trim().toUpperCase(),
          name: formData.name.trim(),
          description: formData.description.trim(),
          meta: { isAllowed: formData.isAllowed },
        });
      }
    },
    onSuccess: () => {
      toast.success(editingItem ? 'Category updated successfully' : 'Category created successfully');
      queryClient.invalidateQueries({ queryKey: ['master-expense-categories'] });
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
      toast.success('Category deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['master-expense-categories'] });
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
      description: '',
      isAllowed: true,
    });
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (item: ExpenseCategoryItem) => {
    setEditingItem(item);
    setFormData({
      code: item.code,
      name: item.name,
      description: item.description || '',
      isAllowed: item.isAllowed ?? true,
    });
    setIsDrawerOpen(true);
  };

  return (
    <div className="space-y-6">
      <AdminPageHero
        title="Expense Categories Master"
        description="Eligible reimbursement categories configured under HRM claim policies for travel, fuel, and business supplies."
        badge={{ text: 'HRM & Claims', icon: CreditCard, variant: 'indigo' }}
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
              <span>Add Category</span>
            </button>
          </div>
        }
      />

      <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search categories..."
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
          />
        </div>

        <span className="text-xs text-slate-500 font-medium">
          Monthly reimbursement ceiling: <strong>₹{monthlyCeiling.toLocaleString()}</strong>
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filtered.map((cat) => (
          <div
            key={cat.id || cat.code}
            className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-sm transition-all"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-wider border border-emerald-100">
                  {cat.code}
                </span>

                <div className="flex items-center gap-1">
                  {cat.isAllowed ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 mr-1">
                      <CheckCircle className="w-3 h-3" /> Allowed
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 mr-1">
                      <XCircle className="w-3 h-3" /> Disallowed
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => handleOpenEdit(cat)}
                    className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingItem(cat)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <h3 className="text-sm font-black text-slate-900 mt-2.5">{cat.name}</h3>
              <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                {cat.description || 'Eligible claim reimbursement expense category.'}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400">Total Claims</span>
              <span className="font-black text-slate-900">{cat.count || 0} Processed</span>
            </div>
          </div>
        ))}
      </div>

      {/* CREATE / EDIT DRAWER */}
      <AdminFormDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={editingItem ? 'Edit Expense Category' : 'Add Expense Category'}
        description="Configure claim reimbursement category eligibility."
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
              {saveMutation.isPending ? 'Saving...' : editingItem ? 'Update Category' : 'Create Category'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <AdminFormField label="Category Code" required hint="Uppercase identifier (e.g. CLIENT_GIFT, CERTIFICATION)">
            <AdminInput
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="e.g. CERTIFICATION"
            />
          </AdminFormField>

          <AdminFormField label="Category Name" required hint="Display name for employee claim submissions">
            <AdminInput
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Professional Certification"
            />
          </AdminFormField>

          <AdminFormField label="Policy Status">
            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={formData.isAllowed}
                onChange={(e) => setFormData({ ...formData, isAllowed: e.target.checked })}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-xs font-bold text-slate-700">Eligible for Employee Reimbursement</span>
            </label>
          </AdminFormField>

          <AdminFormField label="Description">
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Specify allowable costs, receipt guidelines, and review rules..."
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
        title="Delete Category?"
        message={`Are you sure you want to delete "${deletingItem?.name}" (${deletingItem?.code})?`}
        confirmText="Delete Record"
        variant="danger"
      />
    </div>
  );
}
