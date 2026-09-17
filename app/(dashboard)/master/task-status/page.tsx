'use client';

import React, { useState } from 'react';
import {
  CheckSquare,
  RefreshCw,
  Smartphone,
  Laptop,
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

interface TaskStatusItem {
  id: number;
  code: string;
  name: string;
  type: string;
  category?: string;
  color: string;
  count: number;
  description: string;
  isActive?: boolean;
}

export default function MasterTaskStatusPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');

  // Drawers & Modals
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TaskStatusItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<TaskStatusItem | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category: 'Task & Work',
    color: '#3B82F6',
    description: '',
  });

  const { data: resData, isLoading, refetch } = useQuery({
    queryKey: ['master-task-statuses'],
    queryFn: async () => {
      const res: any = await api.get('/master/task-statuses');
      return res?.data || res || [];
    },
  });

  const statuses: TaskStatusItem[] = Array.isArray(resData) ? resData : [];

  const filtered = statuses.filter((st) => {
    return (
      st.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      st.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (st.description && st.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
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
          color: formData.color,
          description: formData.description.trim(),
        });
      } else {
        return api.post('/master/items', {
          type: 'TASK_STATUS',
          code: formData.code.trim().toUpperCase(),
          name: formData.name.trim(),
          category: formData.category,
          color: formData.color,
          description: formData.description.trim(),
        });
      }
    },
    onSuccess: () => {
      toast.success(editingItem ? 'Status updated successfully' : 'Status created successfully');
      queryClient.invalidateQueries({ queryKey: ['master-task-statuses'] });
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
      toast.success('Status deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['master-task-statuses'] });
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
      category: 'Task & Work',
      color: '#3B82F6',
      description: '',
    });
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (item: TaskStatusItem) => {
    setEditingItem(item);
    setFormData({
      code: item.code,
      name: item.name,
      category: item.type || item.category || 'Task & Work',
      color: item.color || '#3B82F6',
      description: item.description || '',
    });
    setIsDrawerOpen(true);
  };

  return (
    <div className="space-y-6">
      <AdminPageHero
        title="Task & Work Status Master"
        description="Lifecycle statuses controlling task progression and live synchronization between Employee and Customer Mobile applications."
        badge={{ text: 'Sync & Lifecycle', icon: CheckSquare, variant: 'indigo' }}
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
              <span>Add Status</span>
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
            placeholder="Search status..."
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
          />
        </div>

        <span className="text-xs text-slate-500 font-medium">
          Showing <strong>{filtered.length}</strong> statuses
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((st) => (
          <div
            key={st.id || st.code}
            className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-sm transition-all"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span
                  className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase text-white tracking-wider"
                  style={{ backgroundColor: st.color }}
                >
                  {st.code}
                </span>

                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                    {st.type}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(st)}
                    className="p-1 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingItem(st)}
                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <h3 className="text-base font-black text-slate-900 mt-2">{st.name}</h3>
              <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                {st.description || 'Lifecycle status indicator.'}
              </p>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Active In System</span>
                <span className="text-base font-black text-slate-900">{st.count} Items</span>
              </div>

              <div className="flex items-center gap-1.5 text-slate-400">
                <span title="Synced to Mobile App"><Smartphone className="w-3.5 h-3.5" /></span>
                <span title="Synced to Admin Panel"><Laptop className="w-3.5 h-3.5" /></span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CREATE / EDIT DRAWER */}
      <AdminFormDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={editingItem ? 'Edit Task Status' : 'Add New Status'}
        description="Configure workflow status code, sync mapping, and visual badge color."
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
              {saveMutation.isPending ? 'Saving...' : editingItem ? 'Update Status' : 'Create Status'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <AdminFormField label="Code" required hint="Uppercase status key (e.g. READY_FOR_QA, BLOCKED)">
            <AdminInput
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="e.g. BLOCKED"
            />
          </AdminFormField>

          <AdminFormField label="Status Label" required hint="Display name in kanban boards and filters">
            <AdminInput
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Blocked / Pending Inputs"
            />
          </AdminFormField>

          <AdminFormField label="Applicable To" required>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
            >
              <option value="Task & Work">Task & Work (Unified)</option>
              <option value="Task">Task Only</option>
              <option value="Work">Work Only</option>
            </select>
          </AdminFormField>

          <AdminFormField label="Color Badge (Hex)" required>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-10 h-10 rounded-xl cursor-pointer border border-slate-200"
              />
              <AdminInput
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                placeholder="#3B82F6"
              />
            </div>
          </AdminFormField>

          <AdminFormField label="Description">
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Explanation of what this status represents in the pipeline..."
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
        title="Delete Status?"
        message={`Are you sure you want to delete "${deletingItem?.name}" (${deletingItem?.code})?`}
        confirmText="Delete Record"
        variant="danger"
      />
    </div>
  );
}
