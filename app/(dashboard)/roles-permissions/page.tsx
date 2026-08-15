'use client';

import React, { useState } from 'react';
import { ShieldCheck, Lock, Check, Plus, Edit } from 'lucide-react';

interface Role {
  id: string;
  name: string;
  description: string;
  permissionsCount: number;
  isSystem: boolean;
}

const mockRoles: Role[] = [
  { id: '1', name: 'Tenant Super Admin', description: 'Full system control across HRM & CRM', permissionsCount: 48, isSystem: true },
  { id: '2', name: 'HR Manager', description: 'Employee management, attendance, leave approval & payroll', permissionsCount: 32, isSystem: false },
  { id: '3', name: 'Sales Manager', description: 'CRM leads, deal pipeline, contacts, and field visit oversight', permissionsCount: 26, isSystem: false },
  { id: '4', name: 'Employee', description: 'Self check-in, leave application, remote request & profile view', permissionsCount: 12, isSystem: true },
];

export default function RolesPermissionsPage() {
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
            Define security roles, granular permission strings, and multi-tenant authorization policies.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold transition-all shadow-md cursor-pointer">
            <Plus className="w-4 h-4" /> Create Custom Role
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {mockRoles.map((role) => (
          <div key={role.id} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">{role.name}</h3>
                  <span className="text-[10px] font-semibold text-indigo-600">
                    {role.isSystem ? 'System Built-In' : 'Custom Tenant Role'}
                  </span>
                </div>
              </div>
              <button className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500">
                <Edit className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 font-medium">{role.description}</p>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
              <span className="text-slate-500">{role.permissionsCount} Active Permissions</span>
              <span className="text-indigo-600 hover:underline cursor-pointer">Edit Matrix →</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
