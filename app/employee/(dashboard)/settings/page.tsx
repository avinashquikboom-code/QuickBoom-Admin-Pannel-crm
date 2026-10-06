'use client';
import React from 'react';
import { useEmployeeAuthStore } from '@/lib/employee-store';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const logout = useEmployeeAuthStore((state) => state.logout);
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/employee/login');
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-black text-slate-900 mb-6">Settings</h1>
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
        <h2 className="text-lg font-bold mb-4 border-b pb-2">Account</h2>
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
          <div>
            <div className="font-bold">Logout</div>
            <div className="text-sm text-slate-500">Sign out of your account on this device.</div>
          </div>
          <button 
            onClick={handleLogout}
            className="px-4 py-2 bg-red-100 text-red-600 font-bold rounded-lg hover:bg-red-200 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}