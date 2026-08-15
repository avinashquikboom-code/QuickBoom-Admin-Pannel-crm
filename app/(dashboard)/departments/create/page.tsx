'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Building2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function CreateDepartmentPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    headName: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Department created successfully');
    router.push('/departments');
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <div className="flex items-center gap-4">
        <Link href="/departments" className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Create Department</h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">Define a new department unit.</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-8">
        <form onSubmit={handleSubmit} className="space-y-6 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">Department Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-3 border border-slate-200 rounded-xl"
              placeholder="Engineering & IT"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">Department Code</label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full p-3 border border-slate-200 rounded-xl font-bold uppercase"
                placeholder="ENG"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">Department Head</label>
              <input
                type="text"
                required
                value={formData.headName}
                onChange={(e) => setFormData({ ...formData, headName: e.target.value })}
                className="w-full p-3 border border-slate-200 rounded-xl"
                placeholder="Rahul Sharma"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
            <Link href="/departments" className="px-5 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl">
              Cancel
            </Link>
            <button type="submit" className="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl shadow-md flex items-center gap-2">
              <Save className="w-4 h-4" /> Save Department
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
