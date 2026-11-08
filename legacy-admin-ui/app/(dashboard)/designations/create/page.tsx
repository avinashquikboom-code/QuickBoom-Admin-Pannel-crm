'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Award, Building2, Layers } from 'lucide-react';
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

export default function CreateDesignationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    code: '',
    department: 'Sales & BD',
    level: 'Level 3',
    status: 'ACTIVE',
    description: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success('Designation created successfully!');
      router.push('/designations');
    }, 600);
  };

  return (
    <AdminFormPage
      title="Add Designation"
      description="Create a new job title, assign corporate hierarchy band/level, and link to a department."
      backHref="/designations"
      backLabel="Back to Designations"
      badge="HRM Hierarchy"
      maxWidthClass="max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <AdminFormSection title="Designation Details" description="Job title, code, and hierarchy band" icon={Award} columns={2}>
          <AdminFormField label="Job Designation Title" required fullWidth>
            <AdminInput
              type="text"
              required
              placeholder="e.g. Senior Fullstack Lead"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </AdminFormField>

          <AdminFormField label="Designation Code" required hint="Short code (e.g. SR-ENG, RSM)">
            <AdminInput
              type="text"
              required
              placeholder="SR-ENG"
              className="uppercase font-bold"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            />
          </AdminFormField>

          <AdminFormField label="Hierarchy Level" required>
            <AdminSelect
              value={formData.level}
              onChange={(e) => setFormData({ ...formData, level: e.target.value })}
              options={[
                { value: 'Level 1', label: 'Level 1 (Entry / Trainee)' },
                { value: 'Level 2', label: 'Level 2 (Associate)' },
                { value: 'Level 3', label: 'Level 3 (Mid-Senior)' },
                { value: 'Level 4', label: 'Level 4 (Lead / Specialist)' },
                { value: 'Level 5', label: 'Level 5 (Managerial)' },
                { value: 'Level 6', label: 'Level 6 (Director / Executive)' },
              ]}
            />
          </AdminFormField>

          <AdminFormField label="Linked Department" required>
            <AdminSelect
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              options={[
                { value: 'Engineering & IT', label: 'Engineering & IT' },
                { value: 'Sales & BD', label: 'Sales & BD' },
                { value: 'Human Resources & Operations', label: 'Human Resources & Operations' },
                { value: 'Finance & Accounts', label: 'Finance & Accounts' },
                { value: 'Marketing', label: 'Marketing' },
              ]}
            />
          </AdminFormField>

          <AdminFormField label="Status" required>
            <AdminSelect
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              options={[
                { value: 'ACTIVE', label: 'Active Designation' },
                { value: 'INACTIVE', label: 'Inactive / Deprecated' },
              ]}
            />
          </AdminFormField>

          <AdminFormField label="Job Scope & Responsibilities" fullWidth>
            <AdminTextarea
              rows={3}
              placeholder="Summary of core competencies, qualifications, and responsibilities expected for this role..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </AdminFormField>
        </AdminFormSection>

        <AdminFormActions
          backHref="/designations"
          cancelLabel="Cancel"
          submitLabel="Create Designation"
          loading={loading}
          sticky
        />
      </form>
    </AdminFormPage>
  );
}
