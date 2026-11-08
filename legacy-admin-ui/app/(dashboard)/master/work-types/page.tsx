'use client';

import React, { useState } from 'react';
import {
  Briefcase,
  Search,
  CheckCircle,
  RefreshCw,
  Plus,
  Edit2,
  Trash2,
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

interface WorkTypeItem {
  id: number;
  code: string;
  name: string;
  category: string;
  description: string;
  itemCount: number;
  isActive: boolean;
  isSystem: boolean;
}

export default function MasterWorkTypesPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Drawers & Modals
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WorkTypeItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<WorkTypeItem | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category: 'Production',
    description: '',
    isActive: true,
  });

  const { data: resData, isLoading, refetch } = useQuery({
    queryKey: ['master-work-types'],
    queryFn: async () => {
      const res: any = await api.get('/master/work-types');
      return res?.data || res || [];
    },
  });

  const workTypes: WorkTypeItem[] = Array.isArray(resData) ? resData : [];

  const filtered = workTypes.filter((wt) => {
    const matchesSearch =
      wt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      wt.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = categoryFilter === 'ALL' || wt.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

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
          category: formData.category,
          description: formData.description.trim(),
          isActive: formData.isActive,
        });
      } else {
        return api.post('/master/items', {
          type: 'WORK_TYPE',
          code: formData.code.trim().toUpperCase(),
          name: formData.name.trim(),
          category: formData.category,
          description: formData.description.trim(),
          isActive: formData.isActive,
        });
      }
    },
    onSuccess: () => {
      toast.success(editingItem ? 'Work type updated successfully' : 'Work type created successfully');
      queryClient.invalidateQueries({ queryKey: ['master-work-types'] });
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
      toast.success('Work type deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['master-work-types'] });
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
      category: 'Production',
      description: '',
      isActive: true,
    });
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (item: WorkTypeItem) => {
    setEditingItem(item);
    setFormData({
      code: item.code,
      name: item.name,
      category: item.category || 'Production',
      description: item.description || '',
      isActive: item.isActive ?? true,
    });
    setIsDrawerOpen(true);
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Work Types Master"
        description="Deliverable and task categories utilized across Employee My Work, creative production, and client delivery."
        icon={Briefcase}
        iconColor="text-indigo-600"
        badge={{ text: 'Creative & Operations', icon: Briefcase, variant: 'indigo' }}
        breadcrumbs={[
          { label: 'Master Data', href: '/master' },
          { label: 'Work Types' },
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
              Add Work Type
            </AdminButton>
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
            placeholder="Search work types..."
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
          >
            <option value="ALL">All Categories</option>
            <option value="Production">Production</option>
            <option value="Design">Design</option>
            <option value="Marketing">Marketing</option>
            <option value="Management">Management</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((wt) => (
          <div
            key={wt.id || wt.code}
            className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-sm transition-all"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-wider border border-blue-100">
                  {wt.category}
                </span>

                <div className="flex items-center gap-1">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 mr-1">
                    <CheckCircle className="w-3 h-3" /> Active
                  </span>
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(wt)}
                    className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingItem(wt)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <h3 className="text-sm font-black text-slate-900 mt-2">{wt.name}</h3>
              <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                {wt.description || 'No deliverable description provided.'}
              </p>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Active Works</span>
                <span className="text-base font-black text-slate-900">{wt.itemCount || 0} Items</span>
              </div>
              <span className="text-[10px] font-mono font-bold text-slate-400 px-2 py-0.5 bg-slate-100 rounded-md">
                {wt.code}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* CREATE / EDIT DRAWER */}
      <AdminFormDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={editingItem ? 'Edit Work Type' : 'Add New Work Type'}
        description="Define deliverable types for creative production and assignment tracking."
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
          <AdminFormField label="Code" required hint="Unique uppercase key (e.g. PODCAST_EDIT, 3D_ANIMATION)">
            <AdminInput
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="e.g. PODCAST_EDIT"
            />
          </AdminFormField>

          <AdminFormField label="Name" required hint="Display title for work items">
            <AdminInput
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Podcast Audio / Video Edit"
            />
          </AdminFormField>

          <AdminFormField label="Category" required>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
            >
              <option value="Production">Production</option>
              <option value="Design">Design</option>
              <option value="Marketing">Marketing</option>
              <option value="Management">Management</option>
            </select>
          </AdminFormField>

          <AdminFormField label="Description">
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Scope of work, deliverable expectations, and tool requirements..."
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
        title="Delete Work Type?"
        message={`Are you sure you want to delete "${deletingItem?.name}" (${deletingItem?.code})? This will not remove completed works.`}
        confirmText="Delete Record"
        variant="danger"
      />
    </div>
  );
}
