'use client';

import React from 'react';
import { User, Mail, Phone, Building2, Shield, Calendar, MapPin, Key } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

import { AdminPageHero } from '@/components/admin';

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
  const fullName = user
    ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.name || user.fullName || user.email || '-'
    : '-';
  const roleName = Array.isArray(user?.roles) && user.roles.length > 0
    ? user.roles.join(', ')
    : (user?.role || '-');
  const customerName = user?.customerName || user?.customer?.name || user?.organization || user?.companyName || '-';
  const avatarLetter = (user?.firstName?.[0] || user?.name?.[0] || user?.email?.[0] || 'U').toUpperCase();

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16 text-slate-800 animate-in fade-in-50 duration-200">
      {/* Top Hero Card */}
      <AdminPageHero
        badge={{
          text: 'USER ACCOUNT PROFILE',
          icon: User,
          variant: 'emerald',
        }}
        title="User Profile"
        description="Personal contact information, assigned organizational role, and security settings."
      />

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-8 space-y-8">
        <div className="flex items-center gap-6 pb-6 border-b border-slate-100">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 text-white font-black text-2xl flex items-center justify-center shadow-lg">
            {avatarLetter}
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">
              {fullName}
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
              {user?.email || '-'}
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Phone Number</span>
            <p className="font-bold text-slate-900 flex items-center gap-2">
              <Phone className="w-4 h-4 text-emerald-600" />
              {user?.phone || user?.phoneNumber || user?.mobile || '-'}
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Organization ID / Customer ID</span>
            <p className="font-mono font-bold text-emerald-700 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-600" />
              {user?.customerId || user?.tenantId || user?.organizationId || user?.id || '-'}
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Assigned Roles</span>
            <p className="font-bold text-slate-900 flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-500" />
              {roleName}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
