'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Lock, CheckSquare, Layers } from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  AdminFormPage,
  AdminFormSection,
  AdminFormField,
  AdminFormActions,
  AdminInput,
  AdminSelect,
  AdminTextarea,
} from '@/components/admin';

export default function CreateRolePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    roleCategory: 'HRM',
    status: 'ACTIVE',
  });

  const [permissions, setPermissions] = useState<Record<string, boolean>>({
    'employees.read': true,
    'employees.create': false,
    'employees.edit': false,
    'employees.delete': false,
    'attendance.read': true,
    'attendance.approve': false,
    'leads.read': false,
    'leads.create': false,
    'deals.read': false,
    'deals.manage': false,
    'visits.read': true,
    'visits.create': true,
    'reports.view': false,
  });

  const togglePermission = (key: string) => {
    setPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success('Custom security role created successfully!');
      router.push('/roles-permissions');
    }, 600);
  };

  return (
    <AdminFormPage
      title="Create Custom Security Role"
      description="Define a granular RBAC role with customized functional permissions across HRM, CRM, and system modules."
      backHref="/roles-permissions"
      backLabel="Back to Roles & Permissions"
      badge="RBAC Security"
      maxWidthClass="max-w-4xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <AdminFormSection title="Role Definition" description="Role name, code, and functional scope" icon={ShieldCheck} columns={2}>
          <AdminFormField label="Role Name" required fullWidth>
            <AdminInput
              type="text"
              required
              placeholder="e.g. Regional Field Operations Manager"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </AdminFormField>

          <AdminFormField label="Role Code Identifier" required hint="Short code (e.g. FIELD_OPS_MGR)">
            <AdminInput
              type="text"
              required
              placeholder="FIELD_OPS_MGR"
              className="uppercase font-bold"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            />
          </AdminFormField>

          <AdminFormField label="Functional Domain" required>
            <AdminSelect
              value={formData.roleCategory}
              onChange={(e) => setFormData({ ...formData, roleCategory: e.target.value })}
              options={[
                { value: 'HRM', label: 'HRM & Workforce Management' },
                { value: 'CRM', label: 'CRM & Sales Operations' },
                { value: 'OPERATIONS', label: 'Field Operations & Logistics' },
                { value: 'EXECUTIVE', label: 'Executive Management' },
              ]}
            />
          </AdminFormField>

          <AdminFormField label="Role Scope & Description" fullWidth>
            <AdminTextarea
              rows={3}
              placeholder="Summary of responsibilities and authorization privileges granted under this role..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </AdminFormField>
        </AdminFormSection>

        <AdminFormSection title="Granular Permission Matrix" description="Toggle access rights granted to this role" icon={Lock} columns={1}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(permissions).map(([key, enabled]) => (
              <label
                key={key}
                className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-emerald-50/60 rounded-xl border border-slate-200 cursor-pointer transition-colors"
              >
                <div>
                  <span className="font-mono text-xs font-bold text-slate-800">{key}</span>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {key.includes('read') ? 'Read & view records' : key.includes('create') ? 'Create new records' : key.includes('edit') ? 'Edit existing records' : 'Execute action'}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={() => togglePermission(key)}
                  className="w-4 h-4 text-emerald-600 rounded-md focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
                />
              </label>
            ))}
          </div>
        </AdminFormSection>

        <AdminFormActions
          backHref="/roles-permissions"
          cancelLabel="Cancel"
          submitLabel="Create Security Role"
          loading={loading}
          sticky
        />
      </form>
    </AdminFormPage>
  );
}
