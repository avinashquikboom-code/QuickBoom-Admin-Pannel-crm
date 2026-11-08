'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, User, FileText } from 'lucide-react';
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

export default function CreateDepartmentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    headName: '',
    status: 'ACTIVE',
    description: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success('Department created successfully!');
      router.push('/departments');
    }, 600);
  };

  return (
    <AdminFormPage
      title="Add Department"
      description="Create a new organizational department unit, assign a leadership head, and set operational status."
      backHref="/departments"
      backLabel="Back to Departments"
      badge="HRM Structure"
      maxWidthClass="max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <AdminFormSection title="Department Information" description="Name, short code, and assigned head" icon={Building2} columns={2}>
          <AdminFormField label="Department Name" required fullWidth>
            <AdminInput
              type="text"
              required
              placeholder="e.g. Sales & Business Development"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </AdminFormField>

          <AdminFormField label="Department Code" required hint="Short uppercase code (e.g. SALES, ENG)">
            <AdminInput
              type="text"
              required
              placeholder="SALES"
              className="uppercase font-bold"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            />
          </AdminFormField>

          <AdminFormField label="Department Head (Manager)" required>
            <AdminInput
              type="text"
              required
              placeholder="e.g. Rahul Sharma"
              icon={User}
              value={formData.headName}
              onChange={(e) => setFormData({ ...formData, headName: e.target.value })}
            />
          </AdminFormField>

          <AdminFormField label="Department Status" required>
            <AdminSelect
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              options={[
                { value: 'ACTIVE', label: 'Active Department' },
                { value: 'INACTIVE', label: 'Inactive / Archived' },
              ]}
            />
          </AdminFormField>

          <AdminFormField label="Department Description / Mission" fullWidth>
            <AdminTextarea
              rows={3}
              placeholder="Brief description of department scope and functional responsibilities..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </AdminFormField>
        </AdminFormSection>

        <AdminFormActions
          backHref="/departments"
          cancelLabel="Cancel"
          submitLabel="Create Department"
          loading={loading}
          sticky
        />
      </form>
    </AdminFormPage>
  );
}
