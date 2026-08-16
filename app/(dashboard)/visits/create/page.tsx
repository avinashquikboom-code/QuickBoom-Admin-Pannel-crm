'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Navigation, Building2, User, Calendar, Clock, FileText } from 'lucide-react';
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

export default function CreateVisitPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    employeeName: 'Rahul Sharma',
    clientCompany: '',
    clientContact: '',
    location: '',
    purpose: 'Product Demonstration & Technical Scope',
    visitDate: new Date().toISOString().split('T')[0],
    scheduledTime: '11:00',
    status: 'SCHEDULED',
    agendaNotes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success('Field visit scheduled successfully!');
      router.push('/visits');
    }, 600);
  };

  return (
    <AdminFormPage
      title="Schedule Field Visit"
      description="Assign a field client visit, specify meeting location and agenda, and schedule calendar slot."
      backHref="/visits"
      backLabel="Back to Field Visits"
      badge="Field Operations"
      maxWidthClass="max-w-4xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <AdminFormSection title="Client & Assigned Representative" description="Meeting attendee and company details" icon={Building2} columns={2}>
          <AdminFormField label="Assigned Field Representative" required>
            <AdminSelect
              value={formData.employeeName}
              onChange={(e) => setFormData({ ...formData, employeeName: e.target.value })}
              options={[
                { value: 'Rahul Sharma', label: 'Rahul Sharma (Sales Executive)' },
                { value: 'Sneha Gupta', label: 'Sneha Gupta (Field Supervisor)' },
                { value: 'Amit Verma', label: 'Amit Verma (BD Lead)' },
                { value: 'Priya Singh', label: 'Priya Singh (Customer Success)' },
              ]}
            />
          </AdminFormField>

          <AdminFormField label="Client Company Name" required>
            <AdminInput
              type="text"
              required
              placeholder="e.g. Acme Global Enterprises"
              icon={Building2}
              value={formData.clientCompany}
              onChange={(e) => setFormData({ ...formData, clientCompany: e.target.value })}
            />
          </AdminFormField>

          <AdminFormField label="Client Contact Person" required>
            <AdminInput
              type="text"
              required
              placeholder="e.g. Ramesh Kothari (Director)"
              icon={User}
              value={formData.clientContact}
              onChange={(e) => setFormData({ ...formData, clientContact: e.target.value })}
            />
          </AdminFormField>

          <AdminFormField label="Meeting Purpose / Category" required>
            <AdminSelect
              value={formData.purpose}
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
              options={[
                { value: 'Product Demonstration & Technical Scope', label: 'Product Demo & Presentation' },
                { value: 'Quarterly Account Review', label: 'Quarterly Account Review' },
                { value: 'Commercial & Pricing Negotiation', label: 'Commercial & Pricing Negotiation' },
                { value: 'Contract Signing & Onboarding', label: 'Contract Signing & Onboarding' },
                { value: 'Service & Maintenance Inspection', label: 'Service / Maintenance Inspection' },
              ]}
            />
          </AdminFormField>
        </AdminFormSection>

        <AdminFormSection title="Location & Schedule" description="Meeting site address and target time slot" icon={MapPin} columns={2}>
          <AdminFormField label="Visit Site Location / Address" required fullWidth>
            <AdminInput
              type="text"
              required
              placeholder="e.g. 5th Floor, Tower 2, BKC Complex, Bandra East, Mumbai"
              icon={Navigation}
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
          </AdminFormField>

          <AdminFormField label="Scheduled Date" required>
            <AdminInput
              type="date"
              required
              value={formData.visitDate}
              onChange={(e) => setFormData({ ...formData, visitDate: e.target.value })}
            />
          </AdminFormField>

          <AdminFormField label="Scheduled Time" required>
            <AdminInput
              type="time"
              required
              value={formData.scheduledTime}
              onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
            />
          </AdminFormField>

          <AdminFormField label="Meeting Agenda & Discussion Notes" fullWidth>
            <AdminTextarea
              rows={3}
              placeholder="Key objectives, demo checklist, sample collateral needed..."
              value={formData.agendaNotes}
              onChange={(e) => setFormData({ ...formData, agendaNotes: e.target.value })}
            />
          </AdminFormField>
        </AdminFormSection>

        <AdminFormActions
          backHref="/visits"
          cancelLabel="Cancel"
          submitLabel="Schedule Visit"
          loading={loading}
          sticky
        />
      </form>
    </AdminFormPage>
  );
}
