'use client';

import React from 'react';
import { User, Mail, Phone, Building2, Shield, Calendar, MapPin, Key } from 'lucide-react';
import { useAuthStore } from '@/lib/store';

export default function ProfilePage() {
  const user = useAuthStore((state) => state.user);

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
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-600 to-teal-400 text-white font-black text-2xl flex items-center justify-center shadow-lg">
            {user?.firstName?.[0] || 'A'}
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">
              {user ? `${user.firstName} ${user.lastName}` : 'Administrator'}
            </h2>
            <p className="text-xs text-indigo-600 font-bold mt-0.5">{user?.roles?.[0] || 'Super Admin'}</p>
            <p className="text-xs text-slate-500 font-medium">{user?.tenantName || 'QuikBoom Enterprise'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Email Address</span>
            <p className="font-bold text-slate-900 flex items-center gap-2">
              <Mail className="w-4 h-4 text-indigo-500" />
              {user?.email || 'admin@quikboom.com'}
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Phone Number</span>
            <p className="font-bold text-slate-900 flex items-center gap-2">
              <Phone className="w-4 h-4 text-emerald-500" />
              +91 9876543210
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Tenant ID</span>
            <p className="font-mono font-bold text-indigo-600 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-500" />
              {user?.tenantId || 't-001'}
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
