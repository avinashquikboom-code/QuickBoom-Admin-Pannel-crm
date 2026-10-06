'use client';
import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useEmployeeAuthStore } from '@/lib/employee-store';

export default function LeavesPage() {
  const token = useEmployeeAuthStore((state) => state.token);
  const [loading, setLoading] = useState(true);
  const [balances, setBalances] = useState<any[]>([]);

  useEffect(() => {
    if (!token) return;
    const fetchData = async () => {
      try {
        const res = await api.get('/leaves/balances', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setBalances(res.data?.data || res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  if (loading) return <div className="p-8">Loading Leaves...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-black text-slate-900 mb-6">Requests & Leaves</h1>
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-lg font-bold mb-4">Leave Balances</h2>
        {balances.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {balances.map((b, i) => (
              <div key={i} className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                <div className="text-sm font-semibold text-slate-500">{b.leaveType || 'Leave'}</div>
                <div className="text-xl font-bold">{b.balance || 0} Available</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500">No leave balances found.</p>
        )}
      </div>
    </div>
  );
}