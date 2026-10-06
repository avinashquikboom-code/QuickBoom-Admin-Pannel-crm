'use client';
import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useEmployeeAuthStore } from '@/lib/employee-store';

export default function AttendancePage() {
  const token = useEmployeeAuthStore((state) => state.token);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    if (!token) return;
    const fetchData = async () => {
      try {
        const [meRes, histRes] = await Promise.all([
          api.get('/attendance/me', { headers: { Authorization: `Bearer ${token}` } }),
          api.get('/employees/hrm/attendance?limit=10', { headers: { Authorization: `Bearer ${token}` } })
        ]);
        setData(meRes.data?.data || meRes.data);
        setHistory(histRes.data?.data || histRes.data?.items || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  if (loading) return <div className="p-8">Loading Attendance...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-black text-slate-900 mb-6">Attendance</h1>
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6">
        <h2 className="text-lg font-bold mb-4">Current Status</h2>
        <div className="text-xl">{data?.status || 'UNKNOWN'}</div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Punch In</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Punch Out</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {history.length > 0 ? history.map((row, i) => (
              <tr key={i} className="hover:bg-slate-50">
                <td className="px-6 py-4 text-sm font-medium">{row.date || 'N/A'}</td>
                <td className="px-6 py-4 text-sm">{row.status || 'N/A'}</td>
                <td className="px-6 py-4 text-sm text-slate-500">{row.punchIn || 'N/A'}</td>
                <td className="px-6 py-4 text-sm text-slate-500">{row.punchOut || 'N/A'}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-slate-500">No attendance history found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}