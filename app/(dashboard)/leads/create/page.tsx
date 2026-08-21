'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserCheck, Mail, Phone, Building2, DollarSign, Globe, Tag } from 'lucide-react';
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

import api from '@/lib/api';

export default function CreateLeadPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    company: '',
    email: '',
    phone: '',
    source: 'WEBSITE',
    status: 'NEW',
    priority: 'HIGH',
    leadValue: '500000',
    assignedTo: 'Rahul Sharma',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        title: formData.company ? `${formData.company} Opportunity` : `${formData.firstName} ${formData.lastName}`,
        firstName: formData.firstName,
        lastName: formData.lastName,
        companyName: formData.company,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        source: formData.source,
        status: formData.status,
        priority: formData.priority,
        value: formData.leadValue ? Number(formData.leadValue) : 0,
        notes: formData.notes || undefined,
      };

      await api.post('/leads', payload);
      toast.success('CRM Lead captured successfully!');
      router.push('/leads');
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Failed to create CRM lead';
      toast.error(typeof errorMsg === 'string' ? errorMsg : 'Failed to create lead');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminFormPage
      title="Add CRM Lead"
      description="Capture a new prospective sales lead, qualify budget value, and assign a pipeline owner."
      backHref="/leads"
      backLabel="Back to Leads"
      badge="CRM & Sales"
      maxWidthClass="max-w-4xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <AdminFormSection title="Lead Contact & Company" description="Prospective client details" icon={UserCheck} columns={2}>
          <AdminFormField label="First Name" required>
            <AdminInput
              type="text"
              required
              placeholder="e.g. Ramesh"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            />
          </AdminFormField>

          <AdminFormField label="Last Name" required>
            <AdminInput
              type="text"
              required
              placeholder="e.g. Kothari"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            />
          </AdminFormField>

          <AdminFormField label="Client Company Name" required fullWidth>
            <AdminInput
              type="text"
              required
              placeholder="e.g. Reliance Retail Systems Ltd"
              icon={Building2}
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            />
          </AdminFormField>

          <AdminFormField label="Email Address" required>
            <AdminInput
              type="email"
              required
              placeholder="ramesh@relianceretail.com"
              icon={Mail}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </AdminFormField>

          <AdminFormField label="Phone Number" required>
            <AdminInput
              type="tel"
              required
              placeholder="+91 98765 00000"
              icon={Phone}
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </AdminFormField>
        </AdminFormSection>

        <AdminFormSection title="Deal Pipeline & Qualification" description="Estimated value, priority, and source" icon={DollarSign} columns={2}>
          <AdminFormField label="Estimated Deal Value (₹)" required>
            <AdminInput
              type="number"
              required
              placeholder="500000"
              value={formData.leadValue}
              onChange={(e) => setFormData({ ...formData, leadValue: e.target.value })}
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
                { value: 'COLD_CALL', label: 'Cold Calling' },
              ]}
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
              ]}
            />
          </AdminFormField>

          <AdminFormField label="Assigned Account Rep" required>
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

          <AdminFormField label="Requirement Notes & Scope" fullWidth>
            <AdminTextarea
              rows={3}
              placeholder="Initial requirements, timeline expectations, decision maker details..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </AdminFormField>
        </AdminFormSection>

        <AdminFormActions
          backHref="/leads"
          cancelLabel="Cancel"
          submitLabel="Create CRM Lead"
          loading={loading}
          sticky
        />
      </form>
    </AdminFormPage>
  );
}
