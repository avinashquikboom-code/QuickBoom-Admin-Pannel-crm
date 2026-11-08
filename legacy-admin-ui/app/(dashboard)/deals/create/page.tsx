'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TrendingUp, Building, DollarSign, Calendar, User, Percent, Briefcase } from 'lucide-react';
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

export default function CreateDealPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    amount: '250000',
    currency: 'INR',
    probability: '50',
    companyId: '',
    contactId: '',
    stageId: '1',
    expectedClosing: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    assignedToId: '',
    source: 'CRM',
    description: '',
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

  // Fetch Contacts
  const { data: contactsData } = useQuery({
    queryKey: ['admin-contacts-dropdown'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/contacts', { params: { limit: 100 } });
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
  const contacts: any[] = Array.isArray(contactsData) ? contactsData : [];
  const employees: any[] = Array.isArray(employeesData) ? employeesData : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        title: formData.title.trim() || 'New Deal Opportunity',
        amount: Number(formData.amount),
        currency: formData.currency || 'INR',
        probability: Number(formData.probability),
        companyId: formData.companyId || undefined,
        contactId: formData.contactId || undefined,
        stageId: formData.stageId || undefined,
        expectedClosing: formData.expectedClosing ? new Date(formData.expectedClosing).toISOString() : undefined,
        assignedToId: formData.assignedToId || undefined,
        source: formData.source || 'CRM',
        description: formData.description.trim() || undefined,
        notes: formData.notes.trim() || undefined,
      };

      await api.post('/deals', payload);
      toast.success('Deal registered successfully in pipeline!');
      router.push('/deals');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminFormPage
      title="Add New Sales Deal"
      description="Register a deal opportunity in the visual CRM pipeline, define contract value, and assign account executive."
      backHref="/deals"
      backLabel="Back to Deals"
      badge="Revenue Pipeline"
      maxWidthClass="max-w-4xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <AdminFormSection title="Deal Overview & Value" description="Opportunity title and financial parameters" icon={TrendingUp} columns={2}>
          <AdminFormField label="Deal Opportunity Title" required fullWidth>
            <AdminInput
              type="text"
              required
              placeholder="e.g. Enterprise Cloud License (500 Seats)"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </AdminFormField>

          <AdminFormField label="Deal Contract Value (₹)" required>
            <AdminInput
              type="number"
              required
              placeholder="e.g. 250000"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            />
          </AdminFormField>

          <AdminFormField label="Win Probability (%)">
            <AdminInput
              type="number"
              min="0"
              max="100"
              value={formData.probability}
              onChange={(e) => setFormData({ ...formData, probability: e.target.value })}
            />
          </AdminFormField>

          <AdminFormField label="Pipeline Stage">
            <AdminSelect
              value={formData.stageId}
              onChange={(e) => setFormData({ ...formData, stageId: e.target.value })}
              options={[
                { value: '1', label: '1. Qualified (25%)' },
                { value: '2', label: '2. Proposal (50%)' },
                { value: '3', label: '3. Negotiation (75%)' },
                { value: '4', label: '4. Won (100%)' },
              ]}
            />
          </AdminFormField>

          <AdminFormField label="Expected Closing Date">
            <AdminInput
              type="date"
              value={formData.expectedClosing}
              onChange={(e) => setFormData({ ...formData, expectedClosing: e.target.value })}
            />
          </AdminFormField>
        </AdminFormSection>

        <AdminFormSection title="Account & Contact Linking" description="Associate with client company and rep" icon={Building} columns={2}>
          <AdminFormField label="Associated Company">
            <AdminSelect
              value={formData.companyId}
              onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
              options={[
                { value: '', label: '-- No Company --' },
                ...companies.map((c) => ({ value: String(c.id), label: c.name })),
              ]}
            />
          </AdminFormField>

          <AdminFormField label="Primary Contact Person">
            <AdminSelect
              value={formData.contactId}
              onChange={(e) => setFormData({ ...formData, contactId: e.target.value })}
              options={[
                { value: '', label: '-- No Contact --' },
                ...contacts.map((c) => ({ value: String(c.id), label: `${c.firstName} ${c.lastName}` })),
              ]}
            />
          </AdminFormField>

          <AdminFormField label="Assigned Deal Owner" fullWidth>
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

          <AdminFormField label="Deal Scope & Deliverables" fullWidth>
            <AdminTextarea
              rows={3}
              placeholder="Contract scope, special pricing terms..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </AdminFormField>
        </AdminFormSection>

        <AdminFormActions
          backHref="/deals"
          submitLabel={loading ? 'Creating...' : 'Create Deal'}
          onCancel={() => router.push('/deals')}
          loading={loading}
        />
      </form>
    </AdminFormPage>
  );
}
