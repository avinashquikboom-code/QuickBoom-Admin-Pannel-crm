'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ShieldCheck, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { AdminPageHeader } from '@/components/admin';

export default function EditRolePage() {
  const params = useParams();
  const id = params?.id || '1';
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: 'HR Manager',
    description: 'Employee management, attendance, leave approval & payroll',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Role updated successfully');
    router.push('/roles-permissions');
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <AdminPageHeader
        title={`Edit Role (#${id})`}
        description="Update role parameters and privileges."
        icon={ShieldCheck}
        breadcrumbs={[
          { label: 'Roles & Permissions', href: '/roles-permissions' },
          { label: `Role #${id}` },
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
            />
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
            <Link href="/roles-permissions" className="px-5 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl">
              Cancel
            </Link>
            <button type="submit" className="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl shadow-md flex items-center gap-2">
              <Save className="w-4 h-4" /> Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
