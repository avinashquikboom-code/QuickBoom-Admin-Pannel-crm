'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Layers, ShieldCheck, Clock } from 'lucide-react';
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

export default function CreateLeavePolicyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    quotaDays: '12',
    carryForward: 'YES',
    maxCarryForward: '6',
    requiresApproval: 'YES',
    paidType: 'PAID',
    status: 'ACTIVE',
    description: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success('Leave policy configured successfully!');
      router.push('/leaves');
    }, 600);
  };

  return (
    <AdminFormPage
      title="Add Leave Policy"
      description="Define an annual leave policy category, allocation quotas, and carry-forward rules."
      backHref="/leaves"
      backLabel="Back to Leave Policies"
      badge="HRM Leave Rule"
      maxWidthClass="max-w-4xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <AdminFormSection title="Leave Policy Category" description="Policy title, code, and compensation type" icon={Calendar} columns={2}>
          <AdminFormField label="Policy Name / Title" required fullWidth>
            <AdminInput
              type="text"
              required
              placeholder="e.g. Annual Privilege Leave (PL)"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </AdminFormField>

          <AdminFormField label="Policy Short Code" required hint="Short code (e.g. PL, CL, SL)">
            <AdminInput
              type="text"
              required
              placeholder="PL"
              className="uppercase font-bold"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            />
          </AdminFormField>

          <AdminFormField label="Compensation Classification" required>
            <AdminSelect
              value={formData.paidType}
              onChange={(e) => setFormData({ ...formData, paidType: e.target.value })}
              options={[
                { value: 'PAID', label: 'Paid Leave (Full Pay)' },
                { value: 'HALF_PAY', label: 'Half Pay Leave' },
                { value: 'UNPAID', label: 'Unpaid Leave (Loss of Pay)' },
              ]}
            />
          </AdminFormField>

          <AdminFormField label="Annual Quota Allocation (Days)" required>
            <AdminInput
              type="number"
              required
              value={formData.quotaDays}
              onChange={(e) => setFormData({ ...formData, quotaDays: e.target.value })}
            />
          </AdminFormField>

          <AdminFormField label="Status" required>
            <AdminSelect
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              options={[
                { value: 'ACTIVE', label: 'Active Policy' },
                { value: 'INACTIVE', label: 'Inactive / Draft' },
              ]}
            />
          </AdminFormField>
        </AdminFormSection>

        <AdminFormSection title="Carry-Forward & Approvals" description="Year-end rollover rules and manager workflow" icon={ShieldCheck} columns={2}>
          <AdminFormField label="Allow Year-End Carry Forward" required>
            <AdminSelect
              value={formData.carryForward}
              onChange={(e) => setFormData({ ...formData, carryForward: e.target.value })}
              options={[
                { value: 'YES', label: 'Yes - Allow Carry Forward' },
                { value: 'NO', label: 'No - Lapse at Year End' },
              ]}
            />
          </AdminFormField>

          <AdminFormField label="Max Carry-Forward Days">
            <AdminInput
              type="number"
              value={formData.maxCarryForward}
              onChange={(e) => setFormData({ ...formData, maxCarryForward: e.target.value })}
            />
          </AdminFormField>

          <AdminFormField label="Manager Approval Required" required fullWidth>
            <AdminSelect
              value={formData.requiresApproval}
              onChange={(e) => setFormData({ ...formData, requiresApproval: e.target.value })}
              options={[
                { value: 'YES', label: 'Yes - Manager/HR Approval Required' },
                { value: 'AUTO_APPROVE', label: 'Auto-Approve Immediately' },
              ]}
            />
          </AdminFormField>

          <AdminFormField label="Policy Terms & Guidelines" fullWidth>
            <AdminTextarea
              rows={3}
              placeholder="Eligibility criteria, minimum notice period, consecutive day limits..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </AdminFormField>
        </AdminFormSection>

        <AdminFormActions
          backHref="/leaves"
          cancelLabel="Cancel"
          submitLabel="Save Policy"
          loading={loading}
          sticky
        />
      </form>
    </AdminFormPage>
  );
}
