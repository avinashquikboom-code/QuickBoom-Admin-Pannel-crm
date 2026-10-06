'use client';
import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useEmployeeAuthStore } from '@/lib/employee-store';

export default function NotificationsPage() {
  const token = useEmployeeAuthStore((state) => state.token);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (!token) return;
    const fetchData = async () => {
      try {
        const res = await api.get('/notifications', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setNotifications(res.data?.data || res.data?.items || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  if (loading) return <div className="p-8">Loading Notifications...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-black text-slate-900 mb-6">Notifications</h1>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 divide-y divide-slate-100">
        {notifications.length > 0 ? notifications.map((n, i) => (
          <div key={i} className="p-6 hover:bg-slate-50 transition-colors">
            <h3 className="font-bold text-slate-900">{n.title || 'Notification'}</h3>
            <p className="text-slate-500 mt-1">{n.body || n.message || ''}</p>
          </div>
        )) : (
          <div className="p-8 text-center text-slate-500">No new notifications.</div>
        )}
      </div>
    </div>
  );
}