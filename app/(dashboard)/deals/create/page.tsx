'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Kanban, Building2, DollarSign, Calendar, User, Percent } from 'lucide-react';
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

export default function CreateDealPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    company: '',
    value: '750000',
    stage: 'PROPOSAL',
    probability: '60',
    expectedCloseDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    assignedTo: 'Rahul Sharma',
    dealType: 'NEW_BUSINESS',
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success('Deal opportunity registered successfully!');
      router.push('/crm');
    }, 600);
  };

  return (
    <AdminFormPage
      title="Add New Sales Deal"
      description="Register a deal opportunity in the visual CRM pipeline, define contract value, and assign account executive."
      backHref="/crm"
      backLabel="Back to Deals Pipeline"
      badge="CRM Pipeline"
      maxWidthClass="max-w-4xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <AdminFormSection title="Deal Overview & Client" description="Opportunity title and account linkage" icon={Kanban} columns={2}>
          <AdminFormField label="Deal Opportunity Title" required fullWidth>
            <AdminInput
              type="text"
              required
              placeholder="e.g. Enterprise Cloud License (1000 Seats)"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </AdminFormField>

          <AdminFormField label="Client Company Account" required>
            <AdminInput
              type="text"
              required
              placeholder="e.g. Apex Tech Solutions"
              icon={Building2}
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            />
          </AdminFormField>

          <AdminFormField label="Deal Opportunity Type" required>
            <AdminSelect
              value={formData.dealType}
              onChange={(e) => setFormData({ ...formData, dealType: e.target.value })}
              options={[
                { value: 'NEW_BUSINESS', label: 'New Business / Net New Client' },
                { value: 'UPSELL', label: 'Upsell / Expansion' },
                { value: 'RENEWAL', label: 'Annual Contract Renewal' },
              ]}
            />
          </AdminFormField>
        </AdminFormSection>

        <AdminFormSection title="Valuation & Stage Forecast" description="Contract size, win probability, and timeline" icon={DollarSign} columns={2}>
          <AdminFormField label="Contract Deal Value (₹)" required>
            <AdminInput
              type="number"
              required
              placeholder="750000"
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
            />
          </AdminFormField>

          <AdminFormField label="Pipeline Stage" required>
            <AdminSelect
              value={formData.stage}
              onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
              options={[
                { value: 'DISCOVERY', label: 'Discovery & Needs Analysis' },
                { value: 'PROPOSAL', label: 'Proposal & Scope Presentation' },
                { value: 'NEGOTIATION', label: 'Commercial Negotiation' },
                { value: 'CLOSING', label: 'Contract Signing & Closing' },
                { value: 'WON', label: 'Closed Won' },
              ]}
            />
          </AdminFormField>

          <AdminFormField label="Estimated Win Probability (%)" required>
            <AdminInput
              type="number"
              min="0"
              max="100"
              required
              value={formData.probability}
              onChange={(e) => setFormData({ ...formData, probability: e.target.value })}
            />
          </AdminFormField>

          <AdminFormField label="Target Expected Close Date" required>
            <AdminInput
              type="date"
              required
              value={formData.expectedCloseDate}
              onChange={(e) => setFormData({ ...formData, expectedCloseDate: e.target.value })}
            />
          </AdminFormField>

          <AdminFormField label="Assigned Account Owner" required fullWidth>
            <AdminSelect
              value={formData.assignedTo}
              onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
              options={[
                { value: 'Rahul Sharma', label: 'Rahul Sharma (Enterprise Lead)' },
                { value: 'Sneha Gupta', label: 'Sneha Gupta (Account Exec)' },
                { value: 'Amit Verma', label: 'Amit Verma (Regional Manager)' },
              ]}
            />
          </AdminFormField>

          <AdminFormField label="Commercial Notes & Milestones" fullWidth>
            <AdminTextarea
              rows={3}
              placeholder="Pricing tiers, discount approvals, delivery milestones..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </AdminFormField>
        </AdminFormSection>

        <AdminFormActions
          backHref="/crm"
          cancelLabel="Cancel"
          submitLabel="Create Sales Deal"
          loading={loading}
          sticky
        />
      </form>
    </AdminFormPage>
  );
}
