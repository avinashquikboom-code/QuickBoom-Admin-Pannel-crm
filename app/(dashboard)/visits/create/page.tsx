'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Navigation, Building, User, Calendar, Clock, FileText } from 'lucide-react';
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

export default function CreateVisitPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    customerName: '',
    purpose: 'Product Demonstration & Technical Review',
    visitType: 'CLIENT_MEETING',
    companyId: '',
    contactId: '',
    employeeId: '',
    location: 'BKC, Mumbai',
    date: new Date().toISOString().split('T')[0],
    time: '11:00 AM',
    status: 'SCHEDULED',
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
        customerName: formData.customerName.trim() || 'Client Meeting',
        purpose: formData.purpose.trim() || 'On-site Client Visit',
        visitType: formData.visitType || 'CLIENT_MEETING',
        companyId: formData.companyId || undefined,
        contactId: formData.contactId || undefined,
        employeeId: formData.employeeId || undefined,
        location: formData.location.trim() || 'Client Office',
        date: new Date(formData.date).toISOString(),
        time: formData.time || '11:00 AM',
        status: formData.status || 'SCHEDULED',
        notes: formData.notes.trim() || undefined,
      };

      await api.post('/visits', payload);
      toast.success('Field visit scheduled successfully!');
      router.push('/visits');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminFormPage
      title="Schedule Field Visit"
      description="Assign a field client visit, specify meeting location and agenda, and schedule calendar slot."
      backHref="/visits"
      backLabel="Back to Visits"
      badge="Field Operations"
      maxWidthClass="max-w-4xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <AdminFormSection title="Client & Assigned Representative" description="Meeting attendee and company details" icon={Building} columns={2}>
          <AdminFormField label="Meeting / Client Name" required fullWidth>
            <AdminInput
              type="text"
              required
              placeholder="e.g. Apex Tech Solutions HQ Meeting"
              value={formData.customerName}
              onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
            />
          </AdminFormField>

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

          <AdminFormField label="Assigned Field Representative" fullWidth>
            <AdminSelect
              value={formData.employeeId}
              onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
              options={[
                { value: '', label: '-- Select Field Rep --' },
                ...employees.map((emp) => ({
                  value: String(emp.id),
                  label: `${emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`} (${emp.employeeCode})`,
                })),
              ]}
            />
          </AdminFormField>
        </AdminFormSection>

        <AdminFormSection title="Schedule & Location" description="Date, time slot, and meeting venue" icon={Calendar} columns={2}>
          <AdminFormField label="Visit Date" required>
            <AdminInput
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </AdminFormField>

          <AdminFormField label="Visit Time" required>
            <AdminInput
              type="text"
              required
              placeholder="e.g. 11:00 AM"
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
            />
          </AdminFormField>

          <AdminFormField label="Meeting Purpose" fullWidth required>
            <AdminInput
              type="text"
              required
              placeholder="e.g. On-site Product Demonstration & Technical Scope"
              value={formData.purpose}
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
            />
          </AdminFormField>

          <AdminFormField label="Meeting Location / Venue" fullWidth required>
            <AdminInput
              type="text"
              required
              placeholder="e.g. Bandra Kurla Complex, Tower 2, Mumbai"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
          </AdminFormField>

          <AdminFormField label="Internal Notes & Deliverables" fullWidth>
            <AdminTextarea
              rows={3}
              placeholder="Meeting agenda, special client requests..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </AdminFormField>
        </AdminFormSection>

        <AdminFormActions
          backHref="/visits"
          submitLabel={loading ? 'Scheduling...' : 'Schedule Visit'}
          onCancel={() => router.push('/visits')}
          loading={loading}
        />
      </form>
    </AdminFormPage>
  );
}
