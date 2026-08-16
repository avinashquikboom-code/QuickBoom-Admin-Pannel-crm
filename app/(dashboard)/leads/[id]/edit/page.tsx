'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { UserCheck, Mail, Phone, Building2, DollarSign } from 'lucide-react';
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

export default function EditLeadPage() {
  const params = useParams();
  const id = (params?.id as string) || '1';
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    firstName: 'Ankit',
    lastName: 'Kulkarni',
    company: 'Apex Tech Solutions',
    email: 'ankit@apextech.com',
    phone: '+91 98765 11111',
    source: 'WEBSITE',
    status: 'QUALIFIED',
    leadValue: '450000',
    assignedTo: 'Rahul Sharma',
    notes: 'Requested product demo for multi-branch HRM and GPS workforce tracking solution.',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success(`Lead #${id} updated successfully!`);
      router.push('/leads');
    }, 600);
  };

  return (
    <AdminFormPage
      title={`Edit CRM Lead (#${id})`}
      description={`Update sales qualification status, deal value, and contact coordinates for ${formData.firstName} ${formData.lastName}.`}
      backHref="/leads"
      backLabel="Back to Leads"
      badge="Edit Lead"
      maxWidthClass="max-w-4xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <AdminFormSection title="Lead Contact & Company" description="Prospective client details" icon={UserCheck} columns={2}>
          <AdminFormField label="First Name" required>
            <AdminInput
              type="text"
              required
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            />
          </AdminFormField>

          <AdminFormField label="Last Name" required>
            <AdminInput
              type="text"
              required
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            />
          </AdminFormField>

          <AdminFormField label="Client Company Name" required fullWidth>
            <AdminInput
              type="text"
              required
              icon={Building2}
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            />
          </AdminFormField>

          <AdminFormField label="Email Address" required>
            <AdminInput
              type="email"
              required
              icon={Mail}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </AdminFormField>

          <AdminFormField label="Phone Number" required>
            <AdminInput
              type="tel"
              required
              icon={Phone}
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </AdminFormField>
        </AdminFormSection>

        <AdminFormSection title="Pipeline & Valuation" description="Estimated deal size and stage" icon={DollarSign} columns={2}>
          <AdminFormField label="Estimated Deal Value (₹)" required>
            <AdminInput
              type="number"
              required
              value={formData.leadValue}
              onChange={(e) => setFormData({ ...formData, leadValue: e.target.value })}
            />
          </AdminFormField>

          <AdminFormField label="Pipeline Status" required>
            <AdminSelect
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              options={[
                { value: 'NEW', label: 'New Uncontacted' },
                { value: 'CONTACTED', label: 'Contacted' },
                { value: 'QUALIFIED', label: 'Qualified Opportunity' },
                { value: 'PROPOSAL_SENT', label: 'Proposal Sent' },
                { value: 'NEGOTIATION', label: 'In Negotiation' },
                { value: 'CLOSED_WON', label: 'Closed Won' },
                { value: 'CLOSED_LOST', label: 'Closed Lost' },
              ]}
            />
          </AdminFormField>

          <AdminFormField label="Assigned Rep" required>
            <AdminSelect
              value={formData.assignedTo}
              onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
              options={[
                { value: 'Rahul Sharma', label: 'Rahul Sharma (Senior BD)' },
                { value: 'Sneha Gupta', label: 'Sneha Gupta (Account Lead)' },
                { value: 'Amit Verma', label: 'Amit Verma (Enterprise Rep)' },
              ]}
            />
          </AdminFormField>

          <AdminFormField label="Lead Source" required>
            <AdminSelect
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              options={[
                { value: 'WEBSITE', label: 'Inbound Website Form' },
                { value: 'LINKEDIN', label: 'LinkedIn Outbound' },
                { value: 'REFERRAL', label: 'Client Referral' },
                { value: 'EVENT', label: 'Conference / Event' },
              ]}
            />
          </AdminFormField>

          <AdminFormField label="Notes & Updates" fullWidth>
            <AdminTextarea
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </AdminFormField>
        </AdminFormSection>

        <AdminFormActions
          backHref="/leads"
          cancelLabel="Cancel"
          submitLabel="Save Changes"
          loading={loading}
          sticky
        />
      </form>
    </AdminFormPage>
  );
}
