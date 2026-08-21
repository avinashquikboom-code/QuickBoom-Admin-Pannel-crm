'use client';

import React, { useState } from 'react';
import { Award, Plus, Edit2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { AdminFormDrawer } from '@/components/admin';

interface Designation {
  id: string;
  title: string;
  code: string;
  department: string;
  level: string;
  status: string;
}

export default function DesignationsPage() {
  const [designations, setDesignations] = useState<Designation[]>([
    { id: 'des-1', title: 'Senior Software Engineer', code: 'SR-ENG', department: 'Engineering & IT', level: 'Level 4', status: 'ACTIVE' },
    { id: 'des-2', title: 'DevOps & Cloud Specialist', code: 'DEVOPS', department: 'Engineering & IT', level: 'Level 4', status: 'ACTIVE' },
    { id: 'des-3', title: 'Regional Sales Manager', code: 'RSM', department: 'Sales & BD', level: 'Level 5', status: 'ACTIVE' },
    { id: 'des-4', title: 'HR Operations Lead', code: 'HR-LEAD', department: 'Human Resources & Operations', level: 'Level 4', status: 'ACTIVE' },
  ]);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedDesig, setSelectedDesig] = useState<Designation | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formState, setFormState] = useState({
    title: '',
    code: '',
    department: 'Engineering & IT',
    level: 'Level 4',
    status: 'ACTIVE',
  });

  const handleOpenCreate = () => {
    setSelectedDesig(null);
    setFormState({
      title: '',
      code: '',
      department: 'Engineering & IT',
      level: 'Level 4',
      status: 'ACTIVE',
    });
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (d: Designation) => {
    setSelectedDesig(d);
    setFormState({
      title: d.title,
      code: d.code,
      department: d.department,
      level: d.level,
      status: d.status,
    });
    setIsDrawerOpen(true);
  };

  const handleSave = async () => {
    if (!formState.title.trim() || !formState.code.trim()) {
      toast.error('Please enter designation title and code');
      return;
    }
    setIsSubmitting(true);
    try {
      if (selectedDesig) {
        setDesignations((prev) =>
          prev.map((d) => (d.id === selectedDesig.id ? { ...d, ...formState } : d))
        );
        toast.success(`Designation ${formState.title} updated!`);
      } else {
        const newDes: Designation = {
          id: `des-${Date.now()}`,
          title: formState.title,
          code: formState.code.toUpperCase(),
          department: formState.department,
          level: formState.level,
          status: formState.status,
        };
        setDesignations((prev) => [...prev, newDes]);
        toast.success(`Designation ${formState.title} added!`);
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
            <Award className="w-4 h-4 text-[#23C45E]" /> HRM DESIGNATION MANAGEMENT
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
            Custom Designations & Job Titles
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-medium">
            Define role hierarchy levels, job designations, and department linkage.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#23C45E] hover:bg-[#1AA14D] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Designation
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-50 text-slate-400 font-black uppercase text-[10px] tracking-wider border-b border-slate-100">
            <tr>
              <th className="p-4">Designation Title</th>
              <th className="p-4">Code</th>
              <th className="p-4">Department</th>
              <th className="p-4">Level</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
            {designations.map((d) => (
              <tr key={d.id} className="hover:bg-slate-50/70 transition-colors">
                <td className="p-4 font-black text-slate-900">{d.title}</td>
                <td className="p-4 font-bold text-[#1AA14D]">{d.code}</td>
                <td className="p-4 text-slate-800">{d.department}</td>
                <td className="p-4 text-slate-600">{d.level}</td>
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
        title={selectedDesig ? `Edit Designation: ${selectedDesig.title}` : 'Add New Designation'}
        description="Configure role title and level hierarchy"
        size="md"
        onSave={handleSave}
        saveLabel={selectedDesig ? 'Update Designation' : 'Save Designation'}
        isSubmitting={isSubmitting}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
              Designation Title *
            </label>
            <input
              type="text"
              value={formState.title}
              onChange={(e) => setFormState({ ...formState, title: e.target.value })}
              placeholder="e.g. Senior Software Engineer"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#23C45E] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                Designation Code *
              </label>
              <input
                type="text"
                value={formState.code}
                onChange={(e) => setFormState({ ...formState, code: e.target.value.toUpperCase() })}
                placeholder="SR-ENG"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#23C45E] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                Level
              </label>
              <select
                value={formState.level}
                onChange={(e) => setFormState({ ...formState, level: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#23C45E] focus:outline-none"
              >
                <option value="Level 1">Level 1 (Entry / Trainee)</option>
                <option value="Level 2">Level 2 (Associate)</option>
                <option value="Level 3">Level 3 (Mid-Level)</option>
                <option value="Level 4">Level 4 (Senior)</option>
                <option value="Level 5">Level 5 (Lead / Manager)</option>
                <option value="Level 6">Level 6 (Director / Executive)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
              Department
            </label>
            <select
              value={formState.department}
              onChange={(e) => setFormState({ ...formState, department: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#23C45E] focus:outline-none"
            >
              <option value="Engineering & IT">Engineering & IT</option>
              <option value="Sales & BD">Sales & BD</option>
              <option value="Human Resources & Operations">Human Resources & Operations</option>
              <option value="Finance & Accounts">Finance & Accounts</option>
            </select>
          </div>
        </div>
      </AdminFormDrawer>
    </div>
  );
}
