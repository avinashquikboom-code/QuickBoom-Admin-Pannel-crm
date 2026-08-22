'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Mail, Phone, Building2, Award, Calendar, DollarSign, Shield, FileText } from 'lucide-react';
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

export default function CreateEmployeePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    employeeCode: 'EMP-' + Math.floor(1000 + Math.random() * 9000),
    email: '',
    phone: '',
    emergencyPhone: '',
    department: 'Sales',
    designation: 'Sales Executive',
    joiningDate: new Date().toISOString().split('T')[0],
    officeLocation: 'Headquarters (Mumbai)',
    employmentType: 'Full-Time',
    monthlySalary: '75000',
    panNumber: '',
    address: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success('Employee profile created successfully!');
      router.push('/employees');
    }, 600);
  };

  return (
    <AdminFormPage
      title="Add Employee"
      description="Create a new employee record with employment details, contact information, and payroll settings."
      backHref="/employees"
      backLabel="Back to Employee Directory"
      badge="HRM Management"
      maxWidthClass="max-w-4xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Basic Information */}
        <AdminFormSection title="Basic Information" description="Personal details and identity" icon={User} columns={2}>
          <AdminFormField label="First Name" required>
            <AdminInput
              type="text"
              required
              placeholder="e.g. Rahul"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            />
          </AdminFormField>

          <AdminFormField label="Last Name" required>
            <AdminInput
              type="text"
              required
              placeholder="e.g. Sharma"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            />
          </AdminFormField>

          <AdminFormField label="Employee Code / ID" required hint="Auto-generated unique code">
            <AdminInput
              type="text"
              required
              value={formData.employeeCode}
              onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value })}
            />
          </AdminFormField>

          <AdminFormField label="PAN / National ID">
            <AdminInput
              type="text"
              placeholder="ABCDE1234F"
              value={formData.panNumber}
              onChange={(e) => setFormData({ ...formData, panNumber: e.target.value })}
            />
          </AdminFormField>
        </AdminFormSection>

        {/* Section 2: Employment Information */}
        <AdminFormSection title="Employment Details" description="Department, designation, and joining date" icon={Building2} columns={2}>
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
              placeholder="e.g. Senior Sales Executive"
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
                { value: 'Internship', label: 'Intern' },
              ]}
            />
          </AdminFormField>

          <AdminFormField label="Joining Date" required>
            <AdminInput
              type="date"
              required
              value={formData.joiningDate}
              onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
            />
          </AdminFormField>
        </AdminFormSection>

        {/* Section 3: Contact & Communication */}
        <AdminFormSection title="Contact Information" description="Official email, phone, and residential address" icon={Mail} columns={2}>
          <AdminFormField label="Corporate Email Address" required>
            <AdminInput
              type="email"
              required
              placeholder="Enter corporate email address"
              icon={Mail}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </AdminFormField>

          <AdminFormField label="Mobile Phone Number" required>
            <AdminInput
              type="tel"
              required
              placeholder="+91 98765 43210"
              icon={Phone}
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </AdminFormField>

          <AdminFormField label="Residential Address" fullWidth>
            <AdminTextarea
              rows={3}
              placeholder="Full postal residential address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </AdminFormField>
        </AdminFormSection>

        {/* Section 4: Compensation & Salary */}
        <AdminFormSection title="Compensation & Payroll" description="Base monthly compensation" icon={DollarSign} columns={2}>
          <AdminFormField label="Monthly Base Salary (₹)" required>
            <AdminInput
              type="number"
              required
              placeholder="75000"
              value={formData.monthlySalary}
              onChange={(e) => setFormData({ ...formData, monthlySalary: e.target.value })}
            />
          </AdminFormField>

          <AdminFormField label="Office / Work Location" required>
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

        {/* Action Bar */}
        <AdminFormActions
          backHref="/employees"
          cancelLabel="Cancel"
          submitLabel="Create Employee Profile"
          loading={loading}
          sticky
        />
      </form>
    </AdminFormPage>
  );
}
