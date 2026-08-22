'use client';

import React, { useState, useMemo } from 'react';
import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  Search,
  Users,
  Calendar,
  Eye,
  CheckCircle,
  XCircle,
  X,
  Power,
  Layers,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { AdminFormDrawer } from '@/components/admin';

interface Department {
  id: number;
  name: string;
  code: string;
  description?: string;
  headId?: number;
  head: string;
  employeesCount: number;
  designationsCount: number;
  status: 'ACTIVE' | 'INACTIVE';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function DepartmentsPage() {
  const queryClient = useQueryClient();

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Drawer & Modal States
  const [isFormDrawerOpen, setIsFormDrawerOpen] = useState(false);
  const [isViewDrawerOpen, setIsViewDrawerOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [deleteConfirmDept, setDeleteConfirmDept] = useState<Department | null>(null);

  // Form State for Add / Edit
  const [formState, setFormState] = useState({
    name: '',
    code: '',
    description: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
  });

  // Fetch departments list from backend API
  const {
    data: departmentsResponse,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['admin-departments', searchTerm, statusFilter],
    queryFn: async () => {
      const params: any = {};
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (statusFilter !== 'ALL') params.status = statusFilter;
      const res: any = await api.get('/departments', { params });
      return res?.data || res || [];
    },
  });

  const departments: Department[] = useMemo(() => {
    return Array.isArray(departmentsResponse)
      ? departmentsResponse
      : departmentsResponse?.data || [];
  }, [departmentsResponse]);

  // Create / Update Department Mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const trimmedName = formState.name.trim();
      if (!trimmedName) {
        throw new Error('Department name is required');
      }

      const payload = {
        name: trimmedName,
        code: formState.code.trim().toUpperCase() || undefined,
        description: formState.description.trim() || undefined,
        isActive: formState.status === 'ACTIVE',
      };

      if (selectedDept && isFormDrawerOpen) {
        return api.patch(`/departments/${selectedDept.id}`, payload);
      } else {
        return api.post('/departments', payload);
      }
    },
    onSuccess: () => {
      toast.success(
        selectedDept && isFormDrawerOpen
          ? 'Department updated successfully!'
          : 'Department created successfully!'
      );
      queryClient.invalidateQueries({ queryKey: ['admin-departments'] });
      queryClient.invalidateQueries({ queryKey: ['active-departments'] });
      setIsFormDrawerOpen(false);
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.message || err?.message || 'Failed to save department';
      toast.error(typeof msg === 'string' ? msg : 'Validation error');
    },
  });

  // Toggle Status Mutation (Activate / Deactivate)
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, newStatus }: { id: number; newStatus: boolean }) => {
      return api.patch(`/departments/${id}`, { isActive: newStatus });
    },
    onSuccess: (_, variables) => {
      toast.success(
        variables.newStatus ? 'Department activated' : 'Department deactivated'
      );
      queryClient.invalidateQueries({ queryKey: ['admin-departments'] });
      queryClient.invalidateQueries({ queryKey: ['active-departments'] });
      if (selectedDept && selectedDept.id === variables.id) {
        setSelectedDept((prev) =>
          prev
            ? {
                ...prev,
                isActive: variables.newStatus,
                status: variables.newStatus ? 'ACTIVE' : 'INACTIVE',
              }
            : null
        );
      }
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Failed to toggle status';
      toast.error(typeof msg === 'string' ? msg : 'Error updating status');
    },
  });

  // Delete Mutation (with safety check)
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return api.delete(`/departments/${id}`);
    },
    onSuccess: (res: any) => {
      const msg =
        res?.data?.message || res?.message || 'Department removed successfully!';
      toast.success(msg);
      queryClient.invalidateQueries({ queryKey: ['admin-departments'] });
      queryClient.invalidateQueries({ queryKey: ['active-departments'] });
      setDeleteConfirmDept(null);
      if (selectedDept && selectedDept.id === deleteConfirmDept?.id) {
        setIsViewDrawerOpen(false);
      }
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Failed to delete department';
      toast.error(typeof msg === 'string' ? msg : 'Error deleting department');
    },
  });

  // Handlers
  const handleOpenCreate = () => {
    setSelectedDept(null);
    setFormState({
      name: '',
      code: '',
      description: '',
      status: 'ACTIVE',
    });
    setIsFormDrawerOpen(true);
  };

  const handleOpenEdit = (dept: Department) => {
    setSelectedDept(dept);
    setFormState({
      name: dept.name,
      code: dept.code,
      description: dept.description || '',
      status: dept.status || (dept.isActive ? 'ACTIVE' : 'INACTIVE'),
    });
    setIsFormDrawerOpen(true);
  };

  const handleOpenView = (dept: Department) => {
    setSelectedDept(dept);
    setIsViewDrawerOpen(true);
  };

  const handleSave = () => {
    if (!formState.name.trim()) {
      toast.error('Department name is required');
      return;
    }
    saveMutation.mutate();
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-[#1AA14D] font-extrabold text-xs uppercase tracking-wider mb-1">
            <Building2 className="w-4 h-4 text-[#23C45E]" /> HRM DEPARTMENT MASTER
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
            Departments
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-medium">
            Manage company departments and their employee assignments.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => refetch()}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
            title="Refresh departments list"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#23C45E] hover:bg-[#1AA14D] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Department
          </button>
        </div>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search departments..."
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
            Status:
          </span>
          <div className="inline-flex p-1 bg-slate-100 rounded-xl">
            {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  statusFilter === st
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {st === 'ALL' ? 'All' : st === 'ACTIVE' ? 'Active' : 'Inactive'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Department List Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-16 text-center text-slate-400 space-y-2">
            <RefreshCw className="w-7 h-7 animate-spin mx-auto text-[#23C45E]" />
            <p className="text-xs font-bold text-slate-600">Loading departments...</p>
          </div>
        ) : departments.length === 0 ? (
          <div className="p-16 text-center text-slate-500 space-y-3">
            <Building2 className="w-12 h-12 mx-auto text-slate-300" />
            <h3 className="font-extrabold text-sm text-slate-800">No departments found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchTerm || statusFilter !== 'ALL'
                ? 'No departments match your search or filter criteria.'
                : 'Get started by creating your first company department.'}
            </p>
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#23C45E] hover:bg-[#1AA14D] text-white font-bold rounded-xl text-xs transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Department
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-400 font-black uppercase text-[10px] tracking-wider border-b border-slate-100">
                <tr>
                  <th className="p-4">Department Name</th>
                  <th className="p-4">Code</th>
                  <th className="p-4">Description</th>
                  <th className="p-4">Employee Count</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Created Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {departments.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Department Name */}
                    <td className="p-4">
                      <div className="font-black text-slate-900 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-[#23C45E] shrink-0" />
                        <span>{d.name}</span>
                      </div>
                    </td>

                    {/* Code */}
                    <td className="p-4 font-mono font-bold text-[#1AA14D]">
                      {d.code}
                    </td>

                    {/* Description */}
                    <td className="p-4 text-slate-500 max-w-xs truncate">
                      {d.description || '—'}
                    </td>

                    {/* Employee Count */}
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-lg text-slate-700 font-bold">
                        <Users className="w-3.5 h-3.5 text-slate-500" />
                        <span>{d.employeesCount ?? 0} Employees</span>
                      </span>
                    </td>

                    {/* Status */}
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 font-extrabold rounded-md text-[10px] border uppercase ${
                          d.status === 'ACTIVE'
                            ? 'bg-[#E8F9EE] text-[#1AA14D] border-[#23C45E]/30'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}
                      >
                        {d.status === 'ACTIVE' ? (
                          <CheckCircle className="w-3 h-3 text-[#23C45E]" />
                        ) : (
                          <XCircle className="w-3 h-3 text-slate-400" />
                        )}
                        <span>{d.status}</span>
                      </span>
                    </td>

                    {/* Created Date */}
                    <td className="p-4 text-slate-500 font-medium">
                      {formatDate(d.createdAt)}
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-right">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        {/* View */}
                        <button
                          type="button"
                          onClick={() => handleOpenView(d)}
                          className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors cursor-pointer"
                          title="View Department Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit */}
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(d)}
                          className="p-1.5 bg-slate-50 hover:bg-[#E8F9EE] text-slate-700 hover:text-[#1AA14D] rounded-lg transition-colors cursor-pointer"
                          title="Edit Department"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Activate / Deactivate Toggle */}
                        <button
                          type="button"
                          onClick={() =>
                            toggleStatusMutation.mutate({
                              id: d.id,
                              newStatus: !d.isActive,
                            })
                          }
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            d.isActive
                              ? 'bg-amber-50 hover:bg-amber-100 text-amber-600'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-[#1AA14D]'
                          }`}
                          title={d.isActive ? 'Deactivate Department' : 'Activate Department'}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmDept(d)}
                          className="p-1.5 bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                          title="Delete Department"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. Right-Side Admin Form Drawer (Add / Edit Department) */}
      <AdminFormDrawer
        isOpen={isFormDrawerOpen}
        onClose={() => setIsFormDrawerOpen(false)}
        title={selectedDept ? `Edit Department: ${selectedDept.name}` : 'Add Department'}
        description="Configure organizational department parameters"
        size="md"
        onSave={handleSave}
        saveLabel={selectedDept ? 'Update Department' : 'Create Department'}
        isSubmitting={saveMutation.isPending}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
              Department Name *
            </label>
            <input
              type="text"
              required
              value={formState.name}
              onChange={(e) => setFormState({ ...formState, name: e.target.value })}
              placeholder="e.g. Sales"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#23C45E] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                Department Code
              </label>
              <input
                type="text"
                value={formState.code}
                onChange={(e) =>
                  setFormState({ ...formState, code: e.target.value.toUpperCase() })
                }
                placeholder="SALES (Auto if blank)"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#23C45E] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                Status
              </label>
              <select
                value={formState.status}
                onChange={(e) =>
                  setFormState({
                    ...formState,
                    status: e.target.value as 'ACTIVE' | 'INACTIVE',
                  })
                }
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#23C45E] focus:outline-none"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
              Description
            </label>
            <textarea
              rows={3}
              value={formState.description}
              onChange={(e) =>
                setFormState({ ...formState, description: e.target.value })
              }
              placeholder="Brief summary of department scope and operations..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#23C45E] focus:outline-none"
            />
          </div>
        </div>
      </AdminFormDrawer>

      {/* 5. View Department Details Drawer */}
      {isViewDrawerOpen && selectedDept && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsViewDrawerOpen(false)}
          />
          <div className="relative w-full max-w-md bg-white shadow-2xl z-10 flex flex-col h-full animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#E8F9EE] flex items-center justify-center text-[#1AA14D]">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900">
                    {selectedDept.name}
                  </h2>
                  <span className="font-mono text-xs font-bold text-[#1AA14D]">
                    {selectedDept.code}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsViewDrawerOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase block">
                    STATUS
                  </span>
                  <span
                    className={`inline-block font-black text-xs mt-1 ${
                      selectedDept.status === 'ACTIVE'
                        ? 'text-[#1AA14D]'
                        : 'text-slate-500'
                    }`}
                  >
                    {selectedDept.status}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase block">
                    EMPLOYEES
                  </span>
                  <span className="font-black text-xs text-slate-800 mt-1 block">
                    {selectedDept.employeesCount ?? 0} Assigned
                  </span>
                </div>
              </div>

              {selectedDept.description && (
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase block">
                    DESCRIPTION
                  </span>
                  <p className="text-slate-700 font-medium leading-relaxed">
                    {selectedDept.description}
                  </p>
                </div>
              )}

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between text-slate-500 font-medium">
                  <span>Created Date:</span>
                  <span className="font-bold text-slate-800">
                    {formatDate(selectedDept.createdAt)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-500 font-medium">
                  <span>Last Updated:</span>
                  <span className="font-bold text-slate-800">
                    {formatDate(selectedDept.updatedAt)}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsViewDrawerOpen(false);
                  handleOpenEdit(selectedDept);
                }}
                className="flex-1 py-2.5 bg-[#23C45E] hover:bg-[#1AA14D] text-white rounded-xl font-bold text-xs transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Edit2 className="w-3.5 h-3.5" /> Edit Department
              </button>

              <button
                type="button"
                onClick={() => setIsViewDrawerOpen(false)}
                className="px-4 py-2.5 border border-slate-200 hover:bg-white text-slate-600 rounded-xl font-bold text-xs transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Delete Confirmation Modal */}
      {deleteConfirmDept && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => !deleteMutation.isPending && setDeleteConfirmDept(null)}
          />
          <div className="relative bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl z-10 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-black text-slate-900">
                Delete Department?
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Are you sure you want to delete{' '}
                <strong className="text-slate-800 font-bold">
                  {deleteConfirmDept.name} ({deleteConfirmDept.code})
                </strong>
                ?
                {deleteConfirmDept.employeesCount > 0 && (
                  <span className="block mt-2 p-2.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs font-bold">
                    Safe Deactivation Note: This department is currently assigned to{' '}
                    {deleteConfirmDept.employeesCount} employee(s). It will be safely
                    deactivated (marked INACTIVE) so employee history and records
                    remain fully preserved.
                  </span>
                )}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={deleteMutation.isPending}
                onClick={() => setDeleteConfirmDept(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(deleteConfirmDept.id)}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-extrabold text-xs transition-all shadow-md shadow-rose-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {deleteMutation.isPending ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                <span>Confirm</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
