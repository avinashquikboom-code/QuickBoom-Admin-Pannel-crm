'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
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

export default function EditLeadPage() {
  const params = useParams();
  const id = (params?.id as string) || '';
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

  // Fetch Existing Lead
  const { data: lead, isLoading: isLoadingLead } = useQuery({
    queryKey: ['lead-detail-edit', id],
    queryFn: async () => {
      const res: any = await api.get(`/leads/${id}`);
      return res?.data || res;
    },
    enabled: Boolean(id),
  });

  // Fetch BPO Employees
  const { data: employeesData } = useQuery({
    queryKey: ['admin-active-bpo-employees'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/employees', { params: { bpoOnly: true } });
        return Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      } catch {
        return [];
      }
    },
  });

  const employees: any[] = Array.isArray(employeesData) ? employeesData : [];

  // Fetch Lead Stages
  const { data: stagesData } = useQuery({
    queryKey: ['admin-lead-stages'],
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

  useEffect(() => {
    if (lead) {
      setFormData({
        title: lead.title || '',
        firstName: lead.firstName || '',
        lastName: lead.lastName || '',
        companyName: lead.companyName || lead.title || '',
        category: lead.category || '',
        email: lead.email || '',
        phone: lead.phone || '',
        website: lead.website || '',
        address: lead.address || '',
        city: lead.city || '',
        state: lead.state || '',
        country: lead.country || 'India',
        source: lead.source || 'WEBSITE',
        status: lead.status || 'NEW',
        stageId: lead.stageId ? String(lead.stageId) : '',
        priority: lead.priority || 'MEDIUM',
        leadValue: String(lead.value || 50000),
        assignedToId: lead.assignedToId ? String(lead.assignedToId) : '',
        notes: '',
      });
    }
  }, [lead]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const cleanVal = (v?: string) => {
        if (!v) return undefined;
        const t = v.trim();
        if (!t || ['N/A', 'NA', 'NONE', 'NULL', '-'].includes(t.toUpperCase())) return undefined;
        return t;
      };

      const payload = {
        title: formData.title.trim() || formData.companyName.trim() || `${formData.firstName} ${formData.lastName}`.trim(),
        firstName: formData.firstName.trim() || 'Prospect',
        lastName: formData.lastName.trim() || 'Client',
        companyName: cleanVal(formData.companyName),
        category: cleanVal(formData.category),
        email: cleanVal(formData.email),
        phone: cleanVal(formData.phone),
        website: cleanVal(formData.website),
        address: cleanVal(formData.address),
        city: cleanVal(formData.city),
        state: cleanVal(formData.state),
        country: cleanVal(formData.country) || 'India',
        source: formData.source,
        status: formData.status,
        stageId: formData.stageId ? Number(formData.stageId) : undefined,
        priority: formData.priority,
        value: formData.leadValue ? Number(formData.leadValue) : 0,
        assignedToId: cleanVal(formData.assignedToId) ? Number(formData.assignedToId) : undefined,
      };

      await api.patch(`/leads/${id}`, payload);
      toast.success(`Lead #${id} updated successfully!`);
      router.push(`/leads/${id}`);
    } catch (err: any) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminFormPage
      title={`Edit CRM Lead (#${id})`}
      description={`Update sales qualification status, deal value, and contact coordinates for ${formData.firstName} ${formData.lastName}.`}
      backHref={`/leads/${id}`}
      backLabel="Back to Lead"
      badge="Edit Lead"
      maxWidthClass="max-w-4xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <AdminFormSection title="Lead Contact & Company" description="Prospective client details" icon={UserCheck} columns={2}>
          <AdminFormField label="Client Company / Business Name *" required fullWidth>
            <AdminInput
              type="text"
              required
              icon={Building2}
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
            />
          </AdminFormField>

          <AdminFormField label="First Name" required>
            <AdminInput
              type="text"
              required
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            />
          </AdminFormField>

          <AdminFormField label="Last Name" required>
            <AdminInput
              type="text"
              required
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            />
          </AdminFormField>

          <AdminFormField label="Email Address">
            <AdminInput
              type="email"
              icon={Mail}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </AdminFormField>

          <AdminFormField label="Phone Number">
            <AdminInput
              type="tel"
              icon={Phone}
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </AdminFormField>

          <AdminFormField label="Industry / Category">
            <AdminInput
              type="text"
              icon={Tag}
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            />
          </AdminFormField>

          <AdminFormField label="Website URL">
            <AdminInput
              type="text"
              icon={Globe}
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            />
          </AdminFormField>
        </AdminFormSection>

        <AdminFormSection title="Location" description="Office address and geographic details" icon={MapPin} columns={2}>
          <AdminFormField label="Street Address" fullWidth>
            <AdminInput
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </AdminFormField>

          <AdminFormField label="City">
            <AdminInput
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            />
          </AdminFormField>

          <AdminFormField label="State">
            <AdminInput
              type="text"
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

          <AdminFormField label="Pipeline Stage / Status">
            <AdminSelect
              value={formData.stageId || formData.status}
              onChange={(e) => {
                const val = e.target.value;
                const matchedStage = stages.find((s) => String(s.id) === val || s.key === val);
                if (matchedStage) {
                  setFormData({
                    ...formData,
                    stageId: String(matchedStage.id),
                    status: matchedStage.key || formData.status,
                  });
                } else {
                  setFormData({ ...formData, status: val });
                }
              }}
              options={
                stages.length > 0
                  ? stages.map((s) => ({ label: s.name || s.label || s.key, value: String(s.id) }))
                  : [
                      { label: 'NEW', value: 'NEW' },
                      { label: 'CONTACTED', value: 'CONTACTED' },
                      { label: 'FOLLOW_UP', value: 'FOLLOW_UP' },
                      { label: 'QUALIFIED', value: 'QUALIFIED' },
                      { label: 'PROPOSAL', value: 'PROPOSAL' },
                      { label: 'CONVERTED', value: 'CONVERTED' },
                      { label: 'LOST', value: 'LOST' },
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
        </AdminFormSection>

        <AdminFormActions
          backHref={`/leads/${id}`}
          submitLabel={loading ? 'Updating...' : 'Update Lead'}
          isSubmitting={loading}
        />
      </form>
    </AdminFormPage>
  );
}
