'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { AdminPageHeader } from '@/components/admin';

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
    <div className="space-y-6 max-w-2xl">
      <AdminPageHeader
        title="Create Custom Security Role"
        description="Define role name and access rules."
        icon={ShieldCheck}
        breadcrumbs={[
          { label: 'Roles & Permissions', href: '/roles-permissions' },
          { label: 'Create Role' },
        ]}
      />

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
