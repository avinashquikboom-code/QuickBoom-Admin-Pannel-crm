'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function CreateRolePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Custom role created successfully');
    router.push('/roles-permissions');
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <div className="flex items-center gap-4">
        <Link href="/roles-permissions" className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Create Custom Security Role</h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">Define role name and access rules.</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-8">
        <form onSubmit={handleSubmit} className="space-y-6 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">Role Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-3 border border-slate-200 rounded-xl"
              placeholder="Finance Lead"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1.5">Description</label>
            <textarea
              required
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-3 border border-slate-200 rounded-xl"
              placeholder="Oversight of financial ledgers and payroll dispersal"
            />
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
            <Link href="/roles-permissions" className="px-5 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl">
              Cancel
            </Link>
            <button type="submit" className="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl shadow-md flex items-center gap-2">
              <Save className="w-4 h-4" /> Save Role
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
