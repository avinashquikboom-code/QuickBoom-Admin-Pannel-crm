'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
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

export default function EditDepartmentPage() {
  const params = useParams();
  const id = (params?.id as string) || 'dept-1';
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: 'Engineering & IT',
    code: 'ENG',
    headName: 'Demo User',
    status: 'ACTIVE',
    description: 'Core software engineering, platform architecture, and IT operations unit.',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success(`Department ${id} updated successfully!`);
      router.push('/departments');
    }, 600);
  };

  return (
    <AdminFormPage
      title={`Edit Department (${formData.code})`}
      description={`Update department configuration, leadership assignment, and status for ${formData.name}.`}
      backHref="/departments"
      backLabel="Back to Departments"
      badge="Edit Department"
      maxWidthClass="max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <AdminFormSection title="Department Information" description="Name, short code, and assigned head" icon={Building2} columns={2}>
          <AdminFormField label="Department Name" required fullWidth>
            <AdminInput
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </AdminFormField>

          <AdminFormField label="Department Code" required>
            <AdminInput
              type="text"
              required
              className="uppercase font-bold"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            />
          </AdminFormField>

          <AdminFormField label="Department Head (Manager)" required>
            <AdminInput
              type="text"
              required
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
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </AdminFormField>
        </AdminFormSection>

        <AdminFormActions
          backHref="/departments"
          cancelLabel="Cancel"
          submitLabel="Save Changes"
          loading={loading}
          sticky
        />
      </form>
    </AdminFormPage>
  );
}
