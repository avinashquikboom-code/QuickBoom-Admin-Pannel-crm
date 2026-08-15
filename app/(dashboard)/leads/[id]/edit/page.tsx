'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function EditLeadPage() {
  const params = useParams();
  const id = params?.id || '1';
  const router = useRouter();

  const [formData, setFormData] = useState({
    firstName: 'Ankit',
    lastName: 'Kulkarni',
    company: 'Apex Tech Solutions',
    email: 'ankit@apextech.com',
    leadValue: 450000,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(`Lead ${id} updated successfully`);
    router.push('/leads');
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <div className="flex items-center gap-4">
        <Link href="/leads" className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Edit Lead (#{id})</h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">Update lead information.</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-8">
        <form onSubmit={handleSubmit} className="space-y-6 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">First Name</label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full p-3 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">Last Name</label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full p-3 border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1.5">Company</label>
            <input
              type="text"
              required
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              className="w-full p-3 border border-slate-200 rounded-xl"
            />
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
            <Link href="/leads" className="px-5 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl">
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
