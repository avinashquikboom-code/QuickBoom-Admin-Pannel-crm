'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, PhoneCall, Mail, Calendar, MessageSquare, Building2, User } from 'lucide-react';
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

export default function CreateActivityPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    type: 'CALL',
    subject: '',
    performedBy: 'Rahul Sharma',
    relatedTo: 'Acme Enterprises',
    activityDate: new Date().toISOString().split('T')[0],
    activityTime: '14:30',
    outcome: 'POSITIVE',
    details: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success('Activity logged successfully!');
      router.push('/activities');
    }, 600);
  };

  return (
    <AdminFormPage
      title="Log Client Activity"
      description="Record an outbound phone call, client meeting, demo, or email communication in the CRM history."
      backHref="/activities"
      backLabel="Back to Activities Stream"
      badge="CRM Touchpoint"
      maxWidthClass="max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <AdminFormSection title="Activity Classification" description="Touchpoint type, subject, and company" icon={Activity} columns={2}>
          <AdminFormField label="Activity Channel Type" required>
            <AdminSelect
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              options={[
                { value: 'CALL', label: 'Phone Call (Inbound / Outbound)' },
                { value: 'MEETING', label: 'Face-to-Face / Online Meeting' },
                { value: 'EMAIL', label: 'Email Communication' },
                { value: 'DEMO', label: 'Product Demonstration' },
                { value: 'NOTE', label: 'Internal Account Note' },
              ]}
            />
          </AdminFormField>

          <AdminFormField label="Performed By (Staff)" required>
            <AdminSelect
              value={formData.performedBy}
              onChange={(e) => setFormData({ ...formData, performedBy: e.target.value })}
              options={[
                { value: 'Rahul Sharma', label: 'Rahul Sharma (Sales Lead)' },
                { value: 'Sneha Gupta', label: 'Sneha Gupta (Account Exec)' },
                { value: 'Amit Verma', label: 'Amit Verma (BD Rep)' },
                { value: 'Priya Singh', label: 'Priya Singh (Customer Success)' },
              ]}
            />
          </AdminFormField>

          <AdminFormField label="Subject / Headline" required fullWidth>
            <AdminInput
              type="text"
              required
              placeholder="e.g. Discovery call with Chief Technology Officer"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            />
          </AdminFormField>

          <AdminFormField label="Related Account / Opportunity" required fullWidth>
            <AdminInput
              type="text"
              required
              placeholder="e.g. Acme Global Enterprises"
              icon={Building2}
              value={formData.relatedTo}
              onChange={(e) => setFormData({ ...formData, relatedTo: e.target.value })}
            />
          </AdminFormField>
        </AdminFormSection>

        <AdminFormSection title="Timing & Outcome" description="Timestamp and interaction outcome" icon={Calendar} columns={2}>
          <AdminFormField label="Date" required>
            <AdminInput
              type="date"
              required
              value={formData.activityDate}
              onChange={(e) => setFormData({ ...formData, activityDate: e.target.value })}
            />
          </AdminFormField>

          <AdminFormField label="Time" required>
            <AdminInput
              type="time"
              required
              value={formData.activityTime}
              onChange={(e) => setFormData({ ...formData, activityTime: e.target.value })}
            />
          </AdminFormField>

          <AdminFormField label="Interaction Outcome" required fullWidth>
            <AdminSelect
              value={formData.outcome}
              onChange={(e) => setFormData({ ...formData, outcome: e.target.value })}
              options={[
                { value: 'POSITIVE', label: 'Positive - Client interested, advancing pipeline' },
                { value: 'FOLLOW_UP_NEEDED', label: 'Neutral - Follow-up requested with proposal' },
                { value: 'NO_RESPONSE', label: 'No Answer / Left Voicemail' },
                { value: 'NOT_INTERESTED', label: 'Not Interested / Closed' },
              ]}
            />
          </AdminFormField>

          <AdminFormField label="Detailed Discussion Notes" fullWidth>
            <AdminTextarea
              rows={3}
              placeholder="Summary of key discussion topics, questions asked by client, next action steps agreed..."
              value={formData.details}
              onChange={(e) => setFormData({ ...formData, details: e.target.value })}
            />
          </AdminFormField>
        </AdminFormSection>

        <AdminFormActions
          backHref="/activities"
          cancelLabel="Cancel"
          submitLabel="Log Activity"
          loading={loading}
          sticky
        />
      </form>
    </AdminFormPage>
  );
}
