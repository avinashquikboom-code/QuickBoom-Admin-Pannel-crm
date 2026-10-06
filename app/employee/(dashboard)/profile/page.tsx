'use client';
import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useEmployeeAuthStore } from '@/lib/employee-store';

export default function ProfilePage() {
  const user = useEmployeeAuthStore((state) => state.user);
  const token = useEmployeeAuthStore((state) => state.token);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (!token) return;
    const fetchData = async () => {
      try {
        const res = await api.get('/employees/profile/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProfile(res.data?.data || res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  if (loading) return <div className="p-8">Loading Profile...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-black text-slate-900 mb-6">Profile</h1>
      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-6 mb-8">
          <div className="w-24 h-24 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-3xl font-bold">
            {profile?.firstName?.charAt(0) || user?.firstName?.charAt(0) || 'U'}
          </div>
          <div>
            <h2 className="text-2xl font-bold">{profile?.firstName || user?.firstName || 'User'} {profile?.lastName || user?.lastName || ''}</h2>
            <p className="text-slate-500">{profile?.email || user?.email || 'No email'}</p>
            <p className="text-slate-500">{profile?.mobile || (user as any)?.mobile || 'No mobile'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}