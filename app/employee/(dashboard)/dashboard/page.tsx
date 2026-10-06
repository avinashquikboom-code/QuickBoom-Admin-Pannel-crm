'use client';
import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useEmployeeAuthStore } from '@/lib/employee-store';

export default function DashboardPage() {
  const user = useEmployeeAuthStore((state) => state.user);
  const token = useEmployeeAuthStore((state) => state.token);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!token) return;
    const fetchData = async () => {
      try {
        const res = await api.get('/attendance/today', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  if (loading) return <div className="p-8">Loading Dashboard...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-black text-slate-900 mb-6">Dashboard</h1>
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-lg font-bold mb-4">Welcome back, {user?.name || 'Employee'}!</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
            <div className="text-sm font-semibold text-slate-500">Today's Status</div>
            <div className="text-xl font-bold">{data?.data?.status || 'NOT PUNCHED IN'}</div>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
            <div className="text-sm font-semibold text-slate-500">Working Hours</div>
            <div className="text-xl font-bold">{data?.data?.hours || '0h 0m'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}