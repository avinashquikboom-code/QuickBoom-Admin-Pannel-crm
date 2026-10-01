'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Banknote, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { AdminPageHeader } from '@/components/admin';
import api from '@/lib/api';

export default function EditSalaryStructurePage() {
  const params = useParams();
  const id = params?.id || '1';
  const router = useRouter();

  const [baseSalary, setBaseSalary] = useState(35000);
  const [hra, setHra] = useState(14000);
  const [allowances, setAllowances] = useState(6000);
  const [employeeId, setEmployeeId] = useState<number | null>(null);
  const [employeeName, setEmployeeName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const res: any = await api.get('/admin/payroll/structures');
        const items = res.data?.items || res.data?.data || (Array.isArray(res.data) ? res.data : []);
        const found = items.find((s: any) => String(s.id) === String(id));
        if (found) {
          setEmployeeId(found.employeeId);
          setBaseSalary(found.basicSalary || 35000);
          setHra(found.hra || 14000);
          setAllowances(found.allowances || 0);
          if (found.employee) {
            setEmployeeName(`${found.employee.firstName || ''} ${found.employee.lastName || ''}`.trim());
          }
        }
      } catch (err) {
        console.error('Failed to load salary structure:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId) {
      toast.error('Associated employee not found');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.post('/admin/payroll/structures', {
        id: Number(id),
        employeeId,
        basicSalary: Number(baseSalary),
        hra: Number(hra),
        allowances: Number(allowances),
      });
      toast.success('Salary structure updated successfully');
      router.push('/payroll?tab=structures');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update salary structure');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <AdminPageHeader
        title={`Edit Salary Structure (${employeeName || `#${id}`})`}
        description="Update earnings and deduction allocations."
        icon={Banknote}
        breadcrumbs={[
          { label: 'Payroll', href: '/payroll' },
          { label: 'Structures', href: '/payroll?tab=structures' },
          { label: `Structure #${id}` },
        ]}
      />

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-8">
        {isLoading ? (
          <div className="text-center py-8 text-xs text-slate-500 font-bold">Loading structure...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Base Salary (₹)</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={baseSalary}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setBaseSalary(val);
                    setHra(Math.round(val * 0.4));
                  }}
                  className="w-full p-3 border border-slate-200 rounded-xl font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">HRA (₹)</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={hra}
                  onChange={(e) => setHra(Number(e.target.value))}
                  className="w-full p-3 border border-slate-200 rounded-xl font-bold"
                />
              </div>
              <div className="col-span-2">
                <label className="block font-bold text-slate-700 mb-1.5">Allowances (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={allowances}
                  onChange={(e) => setAllowances(Number(e.target.value))}
                  className="w-full p-3 border border-slate-200 rounded-xl font-bold"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
              <Link href="/payroll?tab=structures" className="px-5 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl">
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Save className="w-4 h-4" /> {isSubmitting ? 'Saving...' : 'Save Structure'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
