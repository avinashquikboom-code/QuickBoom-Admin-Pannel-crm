'use client';

import React, { useState } from 'react';
import { Building2, Plus, Edit2, Users } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { AdminFormDrawer } from '@/components/admin';

interface Department {
  id: string;
  name: string;
  code: string;
  head: string;
  employees: number;
  status: string;
}

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([
    { id: 'dept-1', name: 'Engineering & IT', code: 'ENG', head: 'Super Admin', employees: 32, status: 'ACTIVE' },
    { id: 'dept-2', name: 'Sales & Business Development', code: 'SALES', head: 'Rahul Sharma', employees: 45, status: 'ACTIVE' },
    { id: 'dept-3', name: 'Human Resources & Operations', code: 'HR', head: 'Priya Singh', employees: 12, status: 'ACTIVE' },
    { id: 'dept-4', name: 'Finance & Accounts', code: 'FIN', head: 'Vikram Mehta', employees: 18, status: 'ACTIVE' },
  ]);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formState, setFormState] = useState({
    name: '',
    code: '',
    head: '',
    status: 'ACTIVE',
  });

  const handleOpenCreate = () => {
    setSelectedDept(null);
    setFormState({
      name: '',
      code: '',
      head: '',
      status: 'ACTIVE',
    });
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (dept: Department) => {
    setSelectedDept(dept);
    setFormState({
      name: dept.name,
      code: dept.code,
      head: dept.head,
      status: dept.status,
    });
    setIsDrawerOpen(true);
  };

  const handleSave = async () => {
    if (!formState.name.trim() || !formState.code.trim()) {
      toast.error('Please enter department name and code');
      return;
    }
    setIsSubmitting(true);
    try {
      if (selectedDept) {
        setDepartments((prev) =>
          prev.map((d) => (d.id === selectedDept.id ? { ...d, ...formState } : d))
        );
        toast.success(`Department ${formState.name} updated!`);
      } else {
        const newDept: Department = {
          id: `dept-${Date.now()}`,
          name: formState.name,
          code: formState.code.toUpperCase(),
          head: formState.head || 'Super Admin',
          employees: 0,
          status: formState.status,
        };
        setDepartments((prev) => [...prev, newDept]);
        toast.success(`Department ${formState.name} added!`);
      }
      setIsDrawerOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-[#1AA14D] font-extrabold text-xs uppercase tracking-wider mb-1">
            <Building2 className="w-4 h-4 text-[#23C45E]" /> HRM DEPARTMENT MANAGEMENT
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
            Custom Departments
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-medium">
            Configure customer organizational departments, assign department heads, and manage workforce structures.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#23C45E] hover:bg-[#1AA14D] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Department
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-50 text-slate-400 font-black uppercase text-[10px] tracking-wider border-b border-slate-100">
            <tr>
              <th className="p-4">Department Name</th>
              <th className="p-4">Code</th>
              <th className="p-4">Department Head</th>
              <th className="p-4">Assigned Staff</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
            {departments.map((d) => (
              <tr key={d.id} className="hover:bg-slate-50/70 transition-colors">
                <td className="p-4 font-black text-slate-900">{d.name}</td>
                <td className="p-4 font-bold text-[#1AA14D]">{d.code}</td>
                <td className="p-4 text-slate-800">{d.head}</td>
                <td className="p-4 text-slate-600">{d.employees} Employees</td>
                <td className="p-4">
                  <span className="px-2.5 py-0.5 bg-[#E8F9EE] text-[#1AA14D] font-bold rounded-md text-[10px] border border-[#23C45E]/30 uppercase">
                    {d.status}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(d)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-[#E8F9EE] text-slate-700 hover:text-[#1AA14D] border border-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Right-Side Admin Form Drawer */}
      <AdminFormDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={selectedDept ? `Edit Department: ${selectedDept.name}` : 'Add New Department'}
        description="Configure organizational department parameters"
        size="md"
        onSave={handleSave}
        saveLabel={selectedDept ? 'Update Department' : 'Save Department'}
        isSubmitting={isSubmitting}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
              Department Name *
            </label>
            <input
              type="text"
              value={formState.name}
              onChange={(e) => setFormState({ ...formState, name: e.target.value })}
              placeholder="e.g. Finance & Accounts"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#23C45E] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                Department Code *
              </label>
              <input
                type="text"
                value={formState.code}
                onChange={(e) => setFormState({ ...formState, code: e.target.value.toUpperCase() })}
                placeholder="FIN"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#23C45E] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                Status
              </label>
              <select
                value={formState.status}
                onChange={(e) => setFormState({ ...formState, status: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#23C45E] focus:outline-none"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
              Department Head
            </label>
            <input
              type="text"
              value={formState.head}
              onChange={(e) => setFormState({ ...formState, head: e.target.value })}
              placeholder="e.g. Super Admin"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#23C45E] focus:outline-none"
            />
          </div>
        </div>
      </AdminFormDrawer>
    </div>
  );
}
