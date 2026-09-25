'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Banknote, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { AdminPageHeader } from '@/components/admin';

export default function EditSalaryStructurePage() {
  const params = useParams();
  const id = params?.id || '1';
  const router = useRouter();

  const [baseSalary, setBaseSalary] = useState(50000);
  const [hra, setHra] = useState(20000);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Salary structure updated successfully');
    router.push('/salary');
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <AdminPageHeader
        title={`Edit Salary Structure (#${id})`}
        description="Update earnings and deduction allocations."
        icon={Banknote}
        breadcrumbs={[
          { label: 'Payroll', href: '/payroll' },
          { label: `Structure #${id}` },
        ]}
      />

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-8">
        <form onSubmit={handleSubmit} className="space-y-6 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">Base Salary (₹)</label>
              <input
                type="number"
                required
                value={baseSalary}
                onChange={(e) => setBaseSalary(Number(e.target.value))}
                className="w-full p-3 border border-slate-200 rounded-xl font-bold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">HRA (₹)</label>
              <input
                type="number"
                required
                value={hra}
                onChange={(e) => setHra(Number(e.target.value))}
                className="w-full p-3 border border-slate-200 rounded-xl font-bold"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
            <Link href="/salary" className="px-5 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl">
              Cancel
            </Link>
            <button type="submit" className="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl shadow-md flex items-center gap-2">
              <Save className="w-4 h-4" /> Save Structure
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
