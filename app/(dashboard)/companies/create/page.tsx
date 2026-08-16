'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Globe, MapPin, Users, DollarSign } from 'lucide-react';
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

export default function CreateCompanyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    industry: 'Technology & SaaS',
    location: 'Mumbai, Maharashtra',
    website: '',
    annualRevenue: '50000000',
    tier: 'ENTERPRISE',
    address: '',
    gstNumber: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success('Company account registered successfully!');
      router.push('/companies');
    }, 600);
  };

  return (
    <AdminFormPage
      title="Add Client Company Account"
      description="Register a corporate client account, financial profile, and enterprise tier classification."
      backHref="/companies"
      backLabel="Back to Companies"
      badge="Accounts"
      maxWidthClass="max-w-4xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <AdminFormSection title="Company Profile & Identity" description="Corporate name, industry, and registration" icon={Building2} columns={2}>
          <AdminFormField label="Company Legal Name" required fullWidth>
            <AdminInput
              type="text"
              required
              placeholder="e.g. Acme Global Technologies Private Limited"
              icon={Building2}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </AdminFormField>

          <AdminFormField label="Industry Sector" required>
            <AdminSelect
              value={formData.industry}
              onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
              options={[
                { value: 'Technology & SaaS', label: 'Technology & Software' },
                { value: 'Finance & Banking', label: 'Banking & FinTech' },
                { value: 'Healthcare & Pharma', label: 'Healthcare & Pharmaceuticals' },
                { value: 'Retail & E-Commerce', label: 'Retail & E-Commerce' },
                { value: 'Manufacturing & Logistics', label: 'Manufacturing & Supply Chain' },
              ]}
            />
          </AdminFormField>

          <AdminFormField label="Account Tier" required>
            <AdminSelect
              value={formData.tier}
              onChange={(e) => setFormData({ ...formData, tier: e.target.value })}
              options={[
                { value: 'ENTERPRISE', label: 'Enterprise Key Account' },
                { value: 'MID_MARKET', label: 'Mid-Market Account' },
                { value: 'SMB', label: 'Small / Medium Business' },
                { value: 'STRATEGIC_PARTNER', label: 'Strategic Partner' },
              ]}
            />
          </AdminFormField>

          <AdminFormField label="Headquarters Location" required>
            <AdminInput
              type="text"
              required
              placeholder="Mumbai, Maharashtra"
              icon={MapPin}
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
          </AdminFormField>

          <AdminFormField label="Corporate Website URL">
            <AdminInput
              type="url"
              placeholder="https://www.acmetech.com"
              icon={Globe}
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            />
          </AdminFormField>
        </AdminFormSection>

        <AdminFormSection title="Financial & Tax Compliance" description="Annual turnover and GST details" icon={DollarSign} columns={2}>
          <AdminFormField label="Estimated Annual Turnover (₹)">
            <AdminInput
              type="number"
              placeholder="50000000"
              value={formData.annualRevenue}
              onChange={(e) => setFormData({ ...formData, annualRevenue: e.target.value })}
            />
          </AdminFormField>

          <AdminFormField label="GSTIN / Corporate Tax ID">
            <AdminInput
              type="text"
              placeholder="27AABCU9603R1ZM"
              className="uppercase font-bold"
              value={formData.gstNumber}
              onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value.toUpperCase() })}
            />
          </AdminFormField>

          <AdminFormField label="Registered Corporate Office Address" fullWidth>
            <AdminTextarea
              rows={3}
              placeholder="Complete registered corporate billing address..."
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </AdminFormField>
        </AdminFormSection>

        <AdminFormActions
          backHref="/companies"
          cancelLabel="Cancel"
          submitLabel="Save Company Account"
          loading={loading}
          sticky
        />
      </form>
    </AdminFormPage>
  );
}
