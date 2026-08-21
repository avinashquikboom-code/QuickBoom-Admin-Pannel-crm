'use client';

import React from 'react';
import { User, Mail, Phone, Building2, Shield, Calendar, MapPin, Key } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

export default function ProfilePage() {
  const storeUser = useAuthStore((state) => state.user);

  const { data: profileData } = useQuery({
    queryKey: ['auth-profile'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/auth/profile');
        return res?.data || res;
      } catch {
        return null;
      }
    },
  });

  const user = profileData || storeUser;
  const fullName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Administrator';
  const roleName = user?.roles?.[0] || 'Super Admin';
  const customerName = user?.customerName || user?.customer?.name || 'QuikBoom Enterprise Workspace';

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">User Account Profile</h1>
        <p className="text-xs text-slate-500 mt-1 font-medium">
          Personal contact information, assigned organizational role, and security settings.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-8 space-y-8">
        <div className="flex items-center gap-6 pb-6 border-b border-slate-100">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 text-white font-black text-2xl flex items-center justify-center shadow-lg">
            {user?.firstName?.[0] || 'A'}
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">
              {fullName || 'Administrator'}
            </h2>
            <p className="text-xs text-emerald-600 font-bold mt-0.5">{roleName}</p>
            <p className="text-xs text-slate-500 font-medium">{customerName}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Email Address</span>
            <p className="font-bold text-slate-900 flex items-center gap-2">
              <Mail className="w-4 h-4 text-emerald-600" />
              {user?.email || 'admin@quikboom.com'}
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Phone Number</span>
            <p className="font-bold text-slate-900 flex items-center gap-2">
              <Phone className="w-4 h-4 text-emerald-600" />
              {user?.phone || '+91 9876543210'}
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Customer Organization ID</span>
            <p className="font-mono font-bold text-emerald-700 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-600" />
              {user?.customerId || 't-001'}
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Security Level</span>
            <p className="font-bold text-slate-900 flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-500" />
              Full RBAC Administrator
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
