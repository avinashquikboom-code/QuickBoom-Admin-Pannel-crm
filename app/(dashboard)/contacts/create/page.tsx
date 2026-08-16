'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Contact, Mail, Phone, Building2, User, Globe, MapPin } from 'lucide-react';
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

export default function CreateContactPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    designation: '',
    company: '',
    email: '',
    phone: '',
    type: 'CLIENT',
    city: 'Mumbai',
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success('Contact entry created successfully!');
      router.push('/contacts');
    }, 600);
  };

  return (
    <AdminFormPage
      title="Add New Contact"
      description="Create a new client stakeholder, vendor representative, or partner contact entry."
      backHref="/contacts"
      backLabel="Back to Contacts"
      badge="Directory"
      maxWidthClass="max-w-4xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <AdminFormSection title="Personal & Professional Information" description="Contact identity and organizational role" icon={Contact} columns={2}>
          <AdminFormField label="Full Name" required>
            <AdminInput
              type="text"
              required
              placeholder="e.g. Ramesh Kothari"
              icon={User}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </AdminFormField>

          <AdminFormField label="Job Title / Designation" required>
            <AdminInput
              type="text"
              required
              placeholder="e.g. Chief Procurement Officer"
              value={formData.designation}
              onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
            />
          </AdminFormField>

          <AdminFormField label="Organization / Company" required fullWidth>
            <AdminInput
              type="text"
              required
              placeholder="e.g. Reliance Retail Systems Ltd"
              icon={Building2}
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            />
          </AdminFormField>

          <AdminFormField label="Contact Classification" required>
            <AdminSelect
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              options={[
                { value: 'CLIENT', label: 'Enterprise Client' },
                { value: 'PROSPECT', label: 'Sales Prospect' },
                { value: 'PARTNER', label: 'Channel Partner' },
                { value: 'VENDOR', label: 'Supplier / Vendor' },
              ]}
            />
          </AdminFormField>

          <AdminFormField label="City / Region" required>
            <AdminInput
              type="text"
              required
              placeholder="Mumbai, Maharashtra"
              icon={MapPin}
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            />
          </AdminFormField>
        </AdminFormSection>

        <AdminFormSection title="Communication Channels" description="Official email, direct phone, and notes" icon={Mail} columns={2}>
          <AdminFormField label="Corporate Email Address" required>
            <AdminInput
              type="email"
              required
              placeholder="ramesh@relianceretail.com"
              icon={Mail}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </AdminFormField>

          <AdminFormField label="Direct Phone Number" required>
            <AdminInput
              type="tel"
              required
              placeholder="+91 98765 43210"
              icon={Phone}
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </AdminFormField>

          <AdminFormField label="Notes & Background Context" fullWidth>
            <AdminTextarea
              rows={3}
              placeholder="Relationship history, preferred meeting times, key projects..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </AdminFormField>
        </AdminFormSection>

        <AdminFormActions
          backHref="/contacts"
          cancelLabel="Cancel"
          submitLabel="Create Contact"
          loading={loading}
          sticky
        />
      </form>
    </AdminFormPage>
  );
}
