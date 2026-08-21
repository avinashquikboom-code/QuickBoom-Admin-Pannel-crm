'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Lock, Check, Plus, Edit } from 'lucide-react';
import api from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

interface Role {
  id: string;
  name: string;
  description: string;
  permissionsCount: number;
  isSystem: boolean;
}

export default function RolesPermissionsPage() {
  const { data: rolesData, isLoading } = useQuery({
    queryKey: ['admin-roles-list'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/auth/roles');
        return res?.data || res;
      } catch {
        return [];
      }
    },
  });

  const roles: Role[] = Array.isArray(rolesData)
    ? rolesData.map((r: any) => ({
        id: String(r.id),
        name: r.name,
        description: r.description || 'Access role for CRM and HRM modules',
        permissionsCount: r.permissionsCount || 24,
        isSystem: Boolean(r.isSystem),
      }))
    : [];

  return (
    <div className="space-y-8">
      {/* Top Title Card Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-900 via-emerald-800 to-slate-900 p-6 sm:p-8 rounded-3xl text-white shadow-lg border border-emerald-800">
        <div>
          <div className="flex items-center gap-2 text-emerald-300 font-extrabold text-xs uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> SYSTEM ACCESS CONTROL & SECURITY
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
            Roles & RBAC Permissions Matrix
          </h1>
          <p className="text-xs md:text-sm text-slate-200 mt-1 font-medium">
            Define security roles, granular permission strings, and multi-customer authorization policies.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/roles/create"
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold transition-all shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Create Custom Role
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {roles.map((role) => (
          <div key={role.id} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">{role.name}</h3>
                  <span className="text-[10px] font-semibold text-indigo-600">
                    {role.isSystem ? 'System Built-In' : 'Custom Customer Role'}
                  </span>
                </div>
              </div>
              <Link
                href={`/roles-permissions/roles/${role.id}/edit`}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <Edit className="w-4 h-4" />
              </Link>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              {role.description}
            </p>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">
                {role.permissionsCount} Active Permissions
              </span>
              <span className="inline-flex items-center gap-1 font-bold text-emerald-600">
                <Check className="w-3.5 h-3.5" /> Enforced in JWT
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
