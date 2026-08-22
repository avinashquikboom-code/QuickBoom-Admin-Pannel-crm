'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Mail, Phone, Building, User, Globe, MapPin } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';
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

export default function CreateContactPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    designation: '',
    companyId: '',
    email: '',
    phone: '',
    mobile: '',
    website: '',
    assignedToId: '',
    status: 'ACTIVE',
    notes: '',
  });

  // Fetch Companies
  const { data: companiesData } = useQuery({
    queryKey: ['admin-companies-dropdown'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/companies', { params: { limit: 100 } });
        const items = res?.data?.data || res?.data?.items || res?.data || res;
        return Array.isArray(items) ? items : [];
      } catch {
        return [];
      }
    },
  });

  // Fetch Employees
  const { data: employeesData } = useQuery({
    queryKey: ['admin-employees-dropdown'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/employees');
        return Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      } catch {
        return [];
      }
    },
  });

  const companies: any[] = Array.isArray(companiesData) ? companiesData : [];
  const employees: any[] = Array.isArray(employeesData) ? employeesData : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        firstName: formData.firstName.trim() || 'Contact',
        lastName: formData.lastName.trim() || '',
        designation: formData.designation.trim() || undefined,
        companyId: formData.companyId || undefined,
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || formData.mobile.trim() || undefined,
        mobile: formData.mobile.trim() || formData.phone.trim() || undefined,
        website: formData.website.trim() || undefined,
        assignedToId: formData.assignedToId || undefined,
        status: formData.status || 'ACTIVE',
        notes: formData.notes.trim() || undefined,
      };

      await api.post('/contacts', payload);
      toast.success('Contact created successfully!');
      router.push('/contacts');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminFormPage
      title="Add Contact Person"
      description="Create a new client contact, link to corporate entity, and assign an account owner."
      backHref="/contacts"
      backLabel="Back to Contacts"
      badge="Contact Management"
      maxWidthClass="max-w-4xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <AdminFormSection title="Personal Information" description="Name and executive designation" icon={Users} columns={2}>
          <AdminFormField label="First Name" required>
            <AdminInput
              type="text"
              required
              placeholder="e.g. Anand"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            />
          </AdminFormField>

          <AdminFormField label="Last Name">
            <AdminInput
              type="text"
              placeholder="e.g. Mahindra"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            />
          </AdminFormField>

          <AdminFormField label="Designation / Job Title" fullWidth>
            <AdminInput
              type="text"
              placeholder="e.g. Managing Director, Procurement Head"
              value={formData.designation}
              onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
            />
          </AdminFormField>
        </AdminFormSection>

        <AdminFormSection title="Communication Channels" description="Phone numbers, email, and web profiles" icon={Phone} columns={2}>
          <AdminFormField label="Primary Mobile">
            <AdminInput
              type="text"
              placeholder="e.g. +91 98200 12345"
              value={formData.mobile}
              onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
            />
          </AdminFormField>

          <AdminFormField label="Office / Landline Phone">
            <AdminInput
              type="text"
              placeholder="e.g. +91 22 2345 6789"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </AdminFormField>

          <AdminFormField label="Email Address">
            <AdminInput
              type="email"
              placeholder="e.g. anand@company.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </AdminFormField>

          <AdminFormField label="Website URL">
            <AdminInput
              type="text"
              placeholder="e.g. https://company.com"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            />
          </AdminFormField>
        </AdminFormSection>

        <AdminFormSection title="Company Affiliation & Assignment" description="Associate with account and CRM representative" icon={Building} columns={2}>
          <AdminFormField label="Associated Company">
            <AdminSelect
              value={formData.companyId}
              onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
              options={[
                { value: '', label: '-- Independent Contact --' },
                ...companies.map((c) => ({ value: String(c.id), label: c.name })),
              ]}
            />
          </AdminFormField>

          <AdminFormField label="Assigned CRM Owner">
            <AdminSelect
              value={formData.assignedToId}
              onChange={(e) => setFormData({ ...formData, assignedToId: e.target.value })}
              options={[
                { value: '', label: '-- Unassigned --' },
                ...employees.map((emp) => ({
                  value: String(emp.id),
                  label: `${emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`} (${emp.employeeCode})`,
                })),
              ]}
            />
          </AdminFormField>

          <AdminFormField label="Notes & Background" fullWidth>
            <AdminTextarea
              rows={3}
              placeholder="Client relationship details, preferred meeting times..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </AdminFormField>
        </AdminFormSection>

        <AdminFormActions
          backHref="/contacts"
          submitLabel={loading ? 'Creating...' : 'Create Contact'}
          onCancel={() => router.push('/contacts')}
          loading={loading}
        />
      </form>
    </AdminFormPage>
  );
}
