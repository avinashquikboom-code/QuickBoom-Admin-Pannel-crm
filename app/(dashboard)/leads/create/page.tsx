'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserCheck, Mail, Phone, Building2, DollarSign, Globe, Tag, MapPin } from 'lucide-react';
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
import { useQuery } from '@tanstack/react-query';
import { getErrorMessage } from '@/lib/utils';

export default function CreateLeadPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    firstName: '',
    lastName: '',
    companyName: '',
    category: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    city: '',
    state: '',
    country: 'India',
    source: 'WEBSITE',
    status: 'NEW',
    stageId: '',
    priority: 'MEDIUM',
    leadValue: '50000',
    assignedToId: '',
    notes: '',
  });

  // Fetch Employees for assignment
  const { data: employeesData } = useQuery({
    queryKey: ['admin-active-employees'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/employees');
        return Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      } catch {
        return [];
      }
    },
  });

  const employees: any[] = Array.isArray(employeesData) ? employeesData : [];

  // Fetch dynamic lead stages from backend API
  const { data: stagesData } = useQuery({
    queryKey: ['lead-stages'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/leads/stages?includeInactive=false');
        return Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      } catch {
        return [];
      }
    },
  });

  const stages: any[] = Array.isArray(stagesData) ? stagesData : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        title: formData.title.trim() || formData.companyName.trim() || `${formData.firstName} ${formData.lastName}`.trim() || 'Lead Opportunity',
        firstName: formData.firstName.trim() || 'Prospect',
        lastName: formData.lastName.trim() || 'Client',
        companyName: formData.companyName.trim() || undefined,
        category: formData.category.trim() || undefined,
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        website: formData.website.trim() || undefined,
        address: formData.address.trim() || undefined,
        city: formData.city.trim() || undefined,
        state: formData.state.trim() || undefined,
        country: formData.country.trim() || 'India',
        source: formData.source,
        status: formData.status,
        stageId: formData.stageId ? Number(formData.stageId) : undefined,
        priority: formData.priority,
        value: formData.leadValue ? Number(formData.leadValue) : 0,
        assignedToId: formData.assignedToId || undefined,
        notes: formData.notes.trim() || undefined,
      };

      await api.post('/leads', payload);
      toast.success('CRM Lead captured successfully!');
      router.push('/leads');
    } catch (err: any) {
      toast.error(getErrorMessage(err));
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
          <AdminFormField label="Client Company / Business Name *" required fullWidth>
            <AdminInput
              type="text"
              required
              icon={Building2}
              placeholder="e.g. Apex Tech Solutions"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
            />
          </AdminFormField>

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

          <AdminFormField label="Email Address">
            <AdminInput
              type="email"
              icon={Mail}
              placeholder="e.g. contact@apextech.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </AdminFormField>

          <AdminFormField label="Phone Number">
            <AdminInput
              type="tel"
              icon={Phone}
              placeholder="e.g. +91 98200 12345"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </AdminFormField>

          <AdminFormField label="Industry / Category">
            <AdminInput
              type="text"
              icon={Tag}
              placeholder="e.g. IT & Cloud Services"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            />
          </AdminFormField>

          <AdminFormField label="Website URL">
            <AdminInput
              type="text"
              icon={Globe}
              placeholder="e.g. https://apextech.com"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            />
          </AdminFormField>
        </AdminFormSection>

        <AdminFormSection title="Location" description="Office address and geographic details" icon={MapPin} columns={2}>
          <AdminFormField label="Street Address" fullWidth>
            <AdminInput
              type="text"
              placeholder="e.g. 101 Corporate Towers, BKC"
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

        <AdminFormSection title="Deal Value & Pipeline" description="Qualification and sales owner" icon={DollarSign} columns={2}>
          <AdminFormField label="Estimated Deal Value (₹)" required>
            <AdminInput
              type="number"
              required
              icon={DollarSign}
              value={formData.leadValue}
              onChange={(e) => setFormData({ ...formData, leadValue: e.target.value })}
            />
          </AdminFormField>

          <AdminFormField label="Lead Source">
            <AdminSelect
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              options={[
                { label: 'Website Form', value: 'WEBSITE' },
                { label: 'Google Places', value: 'GOOGLE_PLACES' },
                { label: 'Client Referral', value: 'REFERRAL' },
                { label: 'LinkedIn Outreach', value: 'LINKEDIN' },
                { label: 'Cold Calling', value: 'COLD_CALL' },
                { label: 'Campaign / Ads', value: 'CAMPAIGN' },
                { label: 'Other', value: 'OTHER' },
              ]}
            />
          </AdminFormField>

          <AdminFormField label="Pipeline Status">
            <AdminSelect
              value={formData.status}
              onChange={(e) => {
                const selectedKey = e.target.value;
                const matchedStage = stages.find((s: any) => s.key === selectedKey);
                setFormData({
                  ...formData,
                  status: selectedKey,
                  stageId: matchedStage ? matchedStage.id : formData.stageId,
                });
              }}
              options={
                stages.length > 0
                  ? stages.map((s: any) => ({
                      label: s.name || s.label || s.key,
                      value: s.key,
                    }))
                  : [
                      { label: 'NEW', value: 'NEW' },
                      { label: 'CONTACTED', value: 'CONTACTED' },
                      { label: 'FOLLOW_UP', value: 'FOLLOW_UP' },
                      { label: 'QUALIFIED', value: 'QUALIFIED' },
                      { label: 'PROPOSAL', value: 'PROPOSAL' },
                    ]
              }
            />
          </AdminFormField>

          <AdminFormField label="Priority Level">
            <AdminSelect
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              options={[
                { label: 'URGENT', value: 'URGENT' },
                { label: 'HIGH', value: 'HIGH' },
                { label: 'MEDIUM', value: 'MEDIUM' },
                { label: 'LOW', value: 'LOW' },
              ]}
            />
          </AdminFormField>

          <AdminFormField label="Assigned Sales Representative" fullWidth>
            <AdminSelect
              value={formData.assignedToId}
              onChange={(e) => setFormData({ ...formData, assignedToId: e.target.value })}
              options={[
                { label: '-- Unassigned --', value: '' },
                ...employees.map((emp) => ({
                  label: `${emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`} (${emp.employeeCode})`,
                  value: String(emp.id),
                })),
              ]}
            />
          </AdminFormField>

          <AdminFormField label="Initial Notes" fullWidth>
            <AdminTextarea
              rows={3}
              placeholder="Enter discovery notes, client requirements..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </AdminFormField>
        </AdminFormSection>

        <AdminFormActions
          backHref="/leads"
          submitLabel={loading ? 'Saving...' : 'Save CRM Lead'}
          isSubmitting={loading}
        />
      </form>
    </AdminFormPage>
  );
}
