'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { User, Mail, Phone, Building2, DollarSign } from 'lucide-react';
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

export default function EditEmployeePage() {
  const params = useParams();
  const id = (params?.id as string) || 'EMP001';
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    firstName: 'Rahul',
    lastName: 'Sharma',
    employeeCode: id,
    email: 'rahul.sharma@quikboom.com',
    phone: '9876543210',
    department: 'Sales',
    designation: 'Sales Executive',
    joiningDate: '2024-01-15',
    employmentType: 'Full-Time',
    monthlySalary: '75000',
    officeLocation: 'Headquarters (Mumbai)',
    status: 'ACTIVE',
    address: 'Flat 402, Green Meadows, Andheri East, Mumbai, Maharashtra 400069',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success(`Employee profile ${id} updated successfully!`);
      router.push('/employees');
    }, 600);
  };

  return (
    <AdminFormPage
      title={`Edit Employee (${id})`}
      description={`Update employment status, contact coordinates, and department assignment for ${formData.firstName} ${formData.lastName}.`}
      backHref="/employees"
      backLabel="Back to Employee Directory"
      badge="Edit Profile"
      maxWidthClass="max-w-4xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <AdminFormSection title="Identity & Personal Details" description="Basic personal information" icon={User} columns={2}>
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

          <AdminFormField label="Employee ID / Code" required>
            <AdminInput
              type="text"
              disabled
              className="bg-slate-100 cursor-not-allowed font-mono text-slate-500"
              value={formData.employeeCode}
            />
          </AdminFormField>

          <AdminFormField label="Employment Status" required>
            <AdminSelect
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              options={[
                { value: 'ACTIVE', label: 'Active Staff' },
                { value: 'ON_LEAVE', label: 'On Extended Leave' },
                { value: 'SUSPENDED', label: 'Suspended' },
                { value: 'TERMINATED', label: 'Terminated / Resigned' },
              ]}
            />
          </AdminFormField>
        </AdminFormSection>

        <AdminFormSection title="Employment & Department" description="Job assignment and office location" icon={Building2} columns={2}>
          <AdminFormField label="Department" required>
            <AdminSelect
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              options={[
                { value: 'Sales', label: 'Sales & BD' },
                { value: 'Engineering', label: 'Engineering' },
                { value: 'Marketing', label: 'Marketing' },
                { value: 'Operations', label: 'Operations' },
                { value: 'Finance', label: 'Finance' },
                { value: 'HR', label: 'Human Resources' },
              ]}
            />
          </AdminFormField>

          <AdminFormField label="Designation" required>
            <AdminInput
              type="text"
              required
              value={formData.designation}
              onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
            />
          </AdminFormField>

          <AdminFormField label="Employment Type" required>
            <AdminSelect
              value={formData.employmentType}
              onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
              options={[
                { value: 'Full-Time', label: 'Full-Time (Permanent)' },
                { value: 'Contract', label: 'Contract / Consultant' },
                { value: 'Probation', label: 'Probation Period' },
              ]}
            />
          </AdminFormField>

          <AdminFormField label="Work Location" required>
            <AdminSelect
              value={formData.officeLocation}
              onChange={(e) => setFormData({ ...formData, officeLocation: e.target.value })}
              options={[
                { value: 'Headquarters (Mumbai)', label: 'Headquarters (Mumbai)' },
                { value: 'Tech Hub (Bengaluru)', label: 'Tech Hub (Bengaluru)' },
                { value: 'Regional Office (Delhi)', label: 'Regional Office (Delhi)' },
                { value: 'Remote / Field', label: 'Remote / Field Workforce' },
              ]}
            />
          </AdminFormField>
        </AdminFormSection>

        <AdminFormSection title="Contact Information" description="Official email, phone, and address" icon={Mail} columns={2}>
          <AdminFormField label="Corporate Email Address" required>
            <AdminInput
              type="email"
              required
              icon={Mail}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </AdminFormField>

          <AdminFormField label="Mobile Phone Number" required>
            <AdminInput
              type="tel"
              required
              icon={Phone}
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </AdminFormField>

          <AdminFormField label="Residential Address" fullWidth>
            <AdminTextarea
              rows={3}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </AdminFormField>
        </AdminFormSection>

        <AdminFormSection title="Payroll & Compensation" description="Base salary structure" icon={DollarSign} columns={2}>
          <AdminFormField label="Monthly Base Compensation (₹)" required>
            <AdminInput
              type="number"
              required
              value={formData.monthlySalary}
              onChange={(e) => setFormData({ ...formData, monthlySalary: e.target.value })}
            />
          </AdminFormField>
        </AdminFormSection>

        <AdminFormActions
          backHref="/employees"
          cancelLabel="Cancel"
          submitLabel="Save Changes"
          loading={loading}
          sticky
        />
      </form>
    </AdminFormPage>
  );
}
