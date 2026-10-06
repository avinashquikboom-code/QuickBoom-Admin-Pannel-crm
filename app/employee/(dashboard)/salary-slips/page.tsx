'use client';
import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useEmployeeAuthStore } from '@/lib/employee-store';

export default function SalarySlipsPage() {
  const token = useEmployeeAuthStore((state) => state.token);
  const [loading, setLoading] = useState(true);
  const [slips, setSlips] = useState<any[]>([]);

  useEffect(() => {
    if (!token) return;
    const fetchData = async () => {
      try {
        const res = await api.get('/admin/payroll/slips/me', {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => api.get('/employees/payroll/slips', {
          headers: { Authorization: `Bearer ${token}` }
        }));
        setSlips(res?.data?.data || res?.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  if (loading) return <div className="p-8">Loading Salary Slips...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-black text-slate-900 mb-6">Salary Slips</h1>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Month</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Net Payable</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {slips.length > 0 ? slips.map((slip, i) => (
              <tr key={i} className="hover:bg-slate-50">
                <td className="px-6 py-4 text-sm font-medium">{slip.month || 'N/A'}</td>
                <td className="px-6 py-4 text-sm">{slip.status || 'N/A'}</td>
                <td className="px-6 py-4 text-sm font-bold">{slip.netPayable || 0}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-slate-500">No salary slips available.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}