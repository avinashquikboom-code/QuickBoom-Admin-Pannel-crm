'use client';

import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Plus,
  Edit2,
  Trash2,
  Search,
  CheckCircle,
  XCircle,
  Power,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  AdminPageHero,
  AdminFormDrawer,
  AdminConfirmDialog,
  AdminFormField,
  AdminInput,
} from '@/components/admin';

interface LeaveTypeItem {
  id: number;
  leaveTypeId?: number;
  name: string;
  code: string;
  daysAllowedPerYear: number;
  isCarryForward: boolean;
  isActive: boolean;
}

export default function MasterLeaveTypesPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<LeaveTypeItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<LeaveTypeItem | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    daysAllowedPerYear: 12,
    isCarryForward: false,
    isActive: true,
  });

  const { data: resData, isLoading, refetch } = useQuery({
    queryKey: ['master-leave-types'],
    queryFn: async () => {
      const res: any = await api.get('/leaves/types');
      const list = res?.data || res || [];
      return Array.isArray(list) ? list : [];
    },
  });

  const leaveTypes: LeaveTypeItem[] = Array.isArray(resData) ? resData : [];

  const filteredItems = useMemo(() => {
    return leaveTypes.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.code.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && item.isActive) ||
        (statusFilter === 'INACTIVE' && !item.isActive);
      return matchesSearch && matchesStatus;
    });
  }, [leaveTypes, searchTerm, statusFilter]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!formData.name.trim() || !formData.code.trim()) {
        throw new Error('Name and unique code are required');
      }
      if (editingItem) {
        return api.patch(`/leaves/types/${editingItem.id}`, formData);
      } else {
        return api.post('/leaves/types', formData);
      }
    },
    onSuccess: () => {
      toast.success(editingItem ? 'Leave type updated' : 'Leave type created successfully');
      queryClient.invalidateQueries({ queryKey: ['master-leave-types'] });
      setIsDrawerOpen(false);
      setEditingItem(null);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || 'Failed to save leave type';
      toast.error(msg);
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async (item: LeaveTypeItem) => {
      return api.patch(`/leaves/types/${item.id}`, { isActive: !item.isActive });
    },
    onSuccess: () => {
      toast.success('Leave type status updated');
      queryClient.invalidateQueries({ queryKey: ['master-leave-types'] });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Failed to toggle status';
      toast.error(msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return api.delete(`/leaves/types/${id}`);
    },
    onSuccess: () => {
      toast.success('Leave type removed');
      queryClient.invalidateQueries({ queryKey: ['master-leave-types'] });
      setDeletingItem(null);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Failed to delete leave type';
      toast.error(msg);
    },
  });

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      code: '',
      daysAllowedPerYear: 12,
      isCarryForward: false,
      isActive: true,
    });
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (item: LeaveTypeItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      code: item.code,
      daysAllowedPerYear: item.daysAllowedPerYear,
      isCarryForward: item.isCarryForward,
      isActive: item.isActive,
    });
    setIsDrawerOpen(true);
  };

  return (
    <div className="space-y-6">
      <AdminPageHero
        title="Leave Types Master"
        description="Manage official workforce leave categories, annual day allocations, and carry-forward rules."
        badge="HRM Master"
        actions={
          <button
            type="button"
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#23C45E] hover:bg-emerald-600 text-white rounded-xl text-xs font-black shadow-md cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" /> Add Leave Type
          </button>
        }
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search leave name or code..."
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e: any) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Inactive Only</option>
          </select>

          <button
            type="button"
            onClick={() => refetch()}
            className="p-2 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Grid of Leave Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className={`p-5 bg-white rounded-2xl border transition-all ${
              item.isActive ? 'border-slate-200/80 shadow-xs' : 'border-slate-200 bg-slate-50/60 opacity-75'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-black tracking-wider uppercase border border-indigo-100">
                    {item.code}
                  </span>
                  {item.isActive ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                      <CheckCircle className="w-3 h-3" /> Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400">
                      <XCircle className="w-3 h-3" /> Inactive
                    </span>
                  )}
                </div>
                <h3 className="text-base font-black text-slate-900 mt-2">{item.name}</h3>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => toggleStatusMutation.mutate(item)}
                  className={`p-1.5 rounded-lg transition-colors ${
                    item.isActive
                      ? 'text-emerald-600 hover:bg-emerald-50'
                      : 'text-slate-400 hover:bg-slate-200'
                  }`}
                  title={item.isActive ? 'Deactivate' : 'Activate'}
                >
                  <Power className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenEdit(item)}
                  className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  title="Edit"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setDeletingItem(item)}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Annual Quota</span>
                <span className="text-lg font-black text-slate-900">{item.daysAllowedPerYear} Days / Yr</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Carry Forward</span>
                <span className={`font-bold ${item.isCarryForward ? 'text-emerald-600' : 'text-slate-500'}`}>
                  {item.isCarryForward ? 'Yes, allowed' : 'No'}
                </span>
              </div>
            </div>
          </div>
        ))}

        {filteredItems.length === 0 && !isLoading && (
          <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-slate-200/80">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-600">No leave types found</p>
            <p className="text-xs text-slate-400 mt-0.5">Add a new leave type to establish workforce quota.</p>
          </div>
        )}
      </div>

      {/* Add / Edit Drawer */}
      <AdminFormDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={editingItem ? 'Edit Leave Type' : 'Add New Leave Type'}
        subtitle="Configure leave quota and policies"
        isSubmitting={saveMutation.isPending}
        onSave={() => saveMutation.mutate()}
        saveLabel={editingItem ? 'Save Changes' : 'Create Leave Type'}
      >
        <div className="space-y-4">
          <AdminFormField label="Leave Type Name" required>
            <AdminInput
              type="text"
              placeholder="e.g. Casual Leave"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </AdminFormField>

          <AdminFormField label="Leave Code (Unique)" required>
            <AdminInput
              type="text"
              placeholder="e.g. CL, SL, PL"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              required
            />
          </AdminFormField>

          <AdminFormField label="Days Allowed Per Year" required>
            <AdminInput
              type="number"
              min="0"
              value={formData.daysAllowedPerYear}
              onChange={(e) => setFormData({ ...formData, daysAllowedPerYear: Number(e.target.value) })}
              required
            />
          </AdminFormField>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-800 block">Allow Carry Forward</span>
              <span className="text-[11px] text-slate-500">Unused days carry over to the next financial year</span>
            </div>
            <input
              type="checkbox"
              checked={formData.isCarryForward}
              onChange={(e) => setFormData({ ...formData, isCarryForward: e.target.checked })}
              className="w-4 h-4 text-emerald-600 rounded"
            />
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-800 block">Status (Active)</span>
              <span className="text-[11px] text-slate-500">Enable this leave type for employee applications</span>
            </div>
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 text-emerald-600 rounded"
            />
          </div>
        </div>
      </AdminFormDrawer>

      {/* Delete Confirmation Dialog */}
      <AdminConfirmDialog
        isOpen={Boolean(deletingItem)}
        onClose={() => setDeletingItem(null)}
        onConfirm={() => {
          if (deletingItem) deleteMutation.mutate(deletingItem.id);
        }}
        title="Delete Leave Type"
        description={`Are you sure you want to delete '${deletingItem?.name}'? Note: Deletion will be blocked if active leave requests or employee balances reference this leave type.`}
        confirmLabel="Confirm Delete"
        variant="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
