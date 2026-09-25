'use client';

import React, { useState } from 'react';
import {
  DollarSign,
  CheckCircle,
  RefreshCw,
  Plus,
  Edit2,
  Trash2,
  Search,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import api from '@/lib/api';
import {
  AdminPageHeader,
  AdminButton,
  AdminFormDrawer,
  AdminConfirmDialog,
  AdminFormField,
  AdminInput,
} from '@/components/admin';
import { getErrorMessage } from '@/lib/utils';

interface LoanTypeItem {
  id: number;
  code: string;
  name: string;
  maxMonths: number;
  interestRate: number;
  requiresApproval: boolean;
  description: string;
  isActive?: boolean;
}

export default function MasterLoanTypesPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');

  // Drawers & Modals
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<LoanTypeItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<LoanTypeItem | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    maxMonths: 12,
    interestRate: 0.0,
    requiresApproval: true,
    description: '',
  });

  const { data: resData, isLoading, refetch } = useQuery({
    queryKey: ['master-loan-types'],
    queryFn: async () => {
      const res: any = await api.get('/master/loan-types');
      return res?.data || res || {};
    },
  });

  const loanTypes: LoanTypeItem[] = Array.isArray(resData?.data)
    ? resData.data
    : Array.isArray(resData)
    ? resData
    : [];
  const activeLoansCount = resData?.activeLoansCount || 0;

  const filtered = loanTypes.filter((lt) =>
    lt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lt.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (lt.description && lt.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Save Mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!formData.code.trim() || !formData.name.trim()) {
        throw new Error('Code and Name are required');
      }

      const meta = {
        maxMonths: Number(formData.maxMonths) || 12,
        interestRate: Number(formData.interestRate) || 0.0,
        requiresApproval: Boolean(formData.requiresApproval),
      };

      if (editingItem) {
        return api.patch(`/master/items/${editingItem.id}`, {
          code: formData.code.trim().toUpperCase(),
          name: formData.name.trim(),
          description: formData.description.trim(),
          meta,
        });
      } else {
        return api.post('/master/items', {
          type: 'LOAN_TYPE',
          code: formData.code.trim().toUpperCase(),
          name: formData.name.trim(),
          description: formData.description.trim(),
          meta,
        });
      }
    },
    onSuccess: () => {
      toast.success(editingItem ? 'Loan type updated successfully' : 'Loan type created successfully');
      queryClient.invalidateQueries({ queryKey: ['master-loan-types'] });
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
      toast.success('Loan type deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['master-loan-types'] });
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
      maxMonths: 12,
      interestRate: 0.0,
      requiresApproval: true,
      description: '',
    });
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (item: LoanTypeItem) => {
    setEditingItem(item);
    setFormData({
      code: item.code,
      name: item.name,
      maxMonths: item.maxMonths || 12,
      interestRate: item.interestRate || 0.0,
      requiresApproval: item.requiresApproval ?? true,
      description: item.description || '',
    });
    setIsDrawerOpen(true);
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Loan Types Master"
        description="Company-sponsored workforce loan programs, maximum repayment tenures, interest percentages, and automated payroll EMI deductions."
        icon={DollarSign}
        iconColor="text-indigo-600"
        badge={{ text: 'Payroll & Benefits', icon: DollarSign, variant: 'indigo' }}
        breadcrumbs={[
          { label: 'Master Data', href: '/master' },
          { label: 'Loan Types' },
        ]}
        actions={
          <div className="flex items-center gap-2.5">
            <AdminButton
              variant="outline"
              size="md"
              icon={RefreshCw}
              onClick={() => refetch()}
              disabled={isLoading}
            >
              Refresh
            </AdminButton>
            <AdminButton
              variant="primary"
              size="md"
              icon={Plus}
              onClick={handleOpenCreate}
            >
              Add Loan Type
            </AdminButton>
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
            placeholder="Search loan programs..."
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
          />
        </div>

        <span className="text-xs text-slate-500 font-medium">
          Active workforce loans under EMI deduction: <strong>{activeLoansCount}</strong>
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((lt) => (
          <div
            key={lt.id || lt.code}
            className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-sm transition-all"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 text-xs font-black uppercase tracking-wider border border-amber-100">
                  {lt.code}
                </span>

                <div className="flex items-center gap-1">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 mr-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Approved Program
                  </span>
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(lt)}
                    className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingItem(lt)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <h3 className="text-base font-black text-slate-900 mt-3">{lt.name}</h3>
              <p className="text-xs text-slate-500 font-medium mt-1.5 leading-relaxed">
                {lt.description || 'Employee company loan program.'}
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Max Repayment Tenure</span>
                <span className="text-sm font-black text-slate-900">{lt.maxMonths} Months</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Annual Interest</span>
                <span className="text-sm font-black text-emerald-600">
                  {Number(lt.interestRate) === 0 ? '0% (Interest-Free)' : `${lt.interestRate}% p.a.`}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CREATE / EDIT DRAWER */}
      <AdminFormDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={editingItem ? 'Edit Loan Type' : 'Add Loan Type'}
        description="Configure employee loan scheme, tenures, and interest rules."
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
              {saveMutation.isPending ? 'Saving...' : editingItem ? 'Update Program' : 'Create Program'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <AdminFormField label="Program Code" required hint="Uppercase identifier (e.g. EDUCATION, VEHICLE)">
            <AdminInput
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="e.g. VEHICLE"
            />
          </AdminFormField>

          <AdminFormField label="Program Name" required hint="Display title for employee loan requests">
            <AdminInput
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Employee Two-Wheeler / Vehicle Loan"
            />
          </AdminFormField>

          <div className="grid grid-cols-2 gap-3">
            <AdminFormField label="Max Tenure (Months)" required>
              <AdminInput
                type="number"
                min="1"
                max="60"
                value={String(formData.maxMonths)}
                onChange={(e) => setFormData({ ...formData, maxMonths: parseInt(e.target.value) || 12 })}
                placeholder="12"
              />
            </AdminFormField>

            <AdminFormField label="Annual Interest (%)" required>
              <AdminInput
                type="number"
                step="0.1"
                min="0"
                max="50"
                value={String(formData.interestRate)}
                onChange={(e) => setFormData({ ...formData, interestRate: parseFloat(e.target.value) || 0 })}
                placeholder="0.0"
              />
            </AdminFormField>
          </div>

          <AdminFormField label="Requires HR Approval">
            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={formData.requiresApproval}
                onChange={(e) => setFormData({ ...formData, requiresApproval: e.target.checked })}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-xs font-bold text-slate-700">Mandatory HR / Finance Director Review</span>
            </label>
          </AdminFormField>

          <AdminFormField label="Description">
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Eligibility criteria, repayment rules, and payroll deduction guidelines..."
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
        title="Delete Loan Program?"
        message={`Are you sure you want to delete "${deletingItem?.name}" (${deletingItem?.code})?`}
        confirmText="Delete Record"
        variant="danger"
      />
    </div>
  );
}
