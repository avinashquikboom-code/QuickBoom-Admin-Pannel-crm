'use client';

import React, { useState } from 'react';
import {
  Users,
  CheckCircle,
  Briefcase,
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
  AdminPageHero,
  AdminFormDrawer,
  AdminConfirmDialog,
  AdminFormField,
  AdminInput,
} from '@/components/admin';
import { getErrorMessage } from '@/lib/utils';

interface EmployeeTypeItem {
  id: number;
  code: string;
  name: string;
  description: string;
  employeeCount: number;
  isActive: boolean;
  isSystem: boolean;
}

export default function MasterEmployeeTypesPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');

  // Drawers & Modals
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EmployeeTypeItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<EmployeeTypeItem | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    isActive: true,
  });

  const { data: resData, isLoading, refetch } = useQuery({
    queryKey: ['master-employee-types'],
    queryFn: async () => {
      const res: any = await api.get('/master/employee-types');
      return res?.data || res || [];
    },
  });

  const types: EmployeeTypeItem[] = Array.isArray(resData) ? resData : [];

  const filtered = types.filter((t) => {
    return (
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  // Create / Update Mutation
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
          isActive: formData.isActive,
        });
      } else {
        return api.post('/master/items', {
          type: 'EMPLOYEE_TYPE',
          code: formData.code.trim().toUpperCase(),
          name: formData.name.trim(),
          description: formData.description.trim(),
          isActive: formData.isActive,
        });
      }
    },
    onSuccess: () => {
      toast.success(editingItem ? 'Employee type updated successfully' : 'Employee type created successfully');
      queryClient.invalidateQueries({ queryKey: ['master-employee-types'] });
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
      toast.success('Employee type deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['master-employee-types'] });
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
      isActive: true,
    });
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (item: EmployeeTypeItem) => {
    setEditingItem(item);
    setFormData({
      code: item.code,
      name: item.name,
      description: item.description || '',
      isActive: item.isActive ?? true,
    });
    setIsDrawerOpen(true);
  };

  return (
    <div className="space-y-6">
      <AdminPageHero
        title="Employee Types Master"
        description="Core workforce classifications defining employment relationship, payroll processing, and contract scope."
        badge={{ text: 'HRM Master', icon: Users, variant: 'indigo' }}
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
              <span>Add Employee Type</span>
            </button>
          </div>
        }
      />

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search employee types..."
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
          />
        </div>

        <span className="text-xs text-slate-500 font-medium">
          Showing <strong>{filtered.length}</strong> types
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((t) => (
          <div
            key={t.id}
            className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-xs flex flex-col justify-between hover:shadow-sm transition-all"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-black tracking-wider uppercase border border-emerald-100">
                    {t.code}
                  </span>
                  {t.isSystem ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                      <CheckCircle className="w-3.5 h-3.5" /> System Master
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600">
                      Custom Type
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(t)}
                    className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingItem(t)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <h3 className="text-lg font-black text-slate-900 mt-3">{t.name}</h3>
              <p className="text-xs text-slate-500 font-medium mt-1.5 leading-relaxed">
                {t.description || 'No detailed description specified.'}
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Enrolled Workforce</span>
                <span className="text-xl font-black text-slate-900">{t.employeeCount} Personnel</span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500">
                <Briefcase className="w-4 h-4" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CREATE / EDIT DRAWER */}
      <AdminFormDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={editingItem ? 'Edit Employee Type' : 'Add New Employee Type'}
        description="Configure workforce employment classification and contract scope."
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
              {saveMutation.isPending ? 'Saving...' : editingItem ? 'Update Type' : 'Create Type'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <AdminFormField label="Type Code" required hint="Unique alphanumeric identifier (e.g. CONSULTANT, INTERN)">
            <AdminInput
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="e.g. INTERN"
            />
          </AdminFormField>

          <AdminFormField label="Display Name" required hint="Descriptive workforce label shown in dropdowns and reports">
            <AdminInput
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Graduate Intern / Trainee"
            />
          </AdminFormField>

          <AdminFormField label="Description">
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the employment terms, payroll inclusion, and contract nature..."
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
        title="Delete Employee Type?"
        message={`Are you sure you want to delete "${deletingItem?.name}" (${deletingItem?.code})? This action cannot be undone.`}
        confirmText="Delete Record"
        variant="danger"
      />
    </div>
  );
}
