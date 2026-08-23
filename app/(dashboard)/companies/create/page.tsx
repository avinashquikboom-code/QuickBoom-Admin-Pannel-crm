'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building, MapPin, Phone, Mail } from 'lucide-react';
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
import { getErrorMessage } from '@/lib/utils';

export default function CreateCompanyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    industry: 'Technology & SaaS',
    category: 'Cloud Infrastructure',
    website: '',
    phone: '',
    email: '',
    address: '',
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    postalCode: '',
    status: 'ACTIVE',
    notes: '',
  });


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        name: formData.name.trim() || 'Company Account',
        industry: formData.industry.trim() || undefined,
        category: formData.category.trim() || undefined,
        website: formData.website.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        email: formData.email.trim() || undefined,
        address: formData.address.trim() || undefined,
        city: formData.city.trim() || undefined,
        state: formData.state.trim() || undefined,
        country: formData.country.trim() || 'India',
        postalCode: formData.postalCode.trim() || undefined,
        status: formData.status || 'ACTIVE',
        notes: formData.notes.trim() || undefined,
      };

      await api.post('/companies', payload);
      toast.success('Company account registered successfully!');
      router.push('/companies');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminFormPage
      title="Add Client Company Account"
      description="Register a corporate client account, location profile, and assign CRM representative."
      backHref="/companies"
      backLabel="Back to Companies"
      badge="Account Management"
      maxWidthClass="max-w-4xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <AdminFormSection title="Company Profile & Identity" description="Corporate name, industry, and contact info" icon={Building} columns={2}>
          <AdminFormField label="Company Legal Name" required fullWidth>
            <AdminInput
              type="text"
              required
              placeholder="e.g. Apex Tech Solutions Private Limited"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </AdminFormField>

          <AdminFormField label="Industry">
            <AdminInput
              type="text"
              placeholder="e.g. Technology & SaaS"
              value={formData.industry}
              onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
            />
          </AdminFormField>

          <AdminFormField label="Category / Segment">
            <AdminInput
              type="text"
              placeholder="e.g. Enterprise Cloud ERP"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            />
          </AdminFormField>

          <AdminFormField label="Official Website">
            <AdminInput
              type="text"
              placeholder="e.g. https://apextech.com"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            />
          </AdminFormField>

          <AdminFormField label="Official Phone">
            <AdminInput
              type="text"
              placeholder="e.g. +91 22 6789 0123"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </AdminFormField>

          <AdminFormField label="Official Email" fullWidth>
            <AdminInput
              type="email"
              placeholder="e.g. contact@apextech.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </AdminFormField>
        </AdminFormSection>

        <AdminFormSection title="Location & Address" description="Office headquarters address" icon={MapPin} columns={2}>
          <AdminFormField label="Street Address" fullWidth>
            <AdminInput
              type="text"
              placeholder="e.g. Tower 3, Business Bay, BKC"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </AdminFormField>

          <AdminFormField label="City">
            <AdminInput
              type="text"
              placeholder="e.g. Mumbai"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            />
          </AdminFormField>

          <AdminFormField label="State">
            <AdminInput
              type="text"
              placeholder="e.g. Maharashtra"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
            />
          </AdminFormField>
        </AdminFormSection>

        <AdminFormSection title="Status & Notes" description="Set account status and internal notes" icon={MapPin} columns={2}>
          <AdminFormField label="Account Status">
            <AdminSelect
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              options={[
                { value: 'ACTIVE', label: 'ACTIVE' },
                { value: 'PROSPECT', label: 'PROSPECT' },
                { value: 'INACTIVE', label: 'INACTIVE' },
              ]}
            />
          </AdminFormField>

          <AdminFormField label="Account Notes" fullWidth>
            <AdminTextarea
              rows={3}
              placeholder="Enterprise requirements, key stakeholders..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </AdminFormField>
        </AdminFormSection>

        <AdminFormActions
          backHref="/companies"
          submitLabel={loading ? 'Registering...' : 'Register Company'}
          onCancel={() => router.push('/companies')}
          loading={loading}
        />
      </form>
    </AdminFormPage>
  );
}
