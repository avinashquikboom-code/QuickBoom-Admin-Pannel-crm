'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Mail, Phone, Building2, Calendar, DollarSign, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '@/lib/api';
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
  const [autoGenerateId, setAutoGenerateId] = useState(true);
  const [isFetchingNextId, setIsFetchingNextId] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    employeeCode: 'QB0001',
    email: '',
    phone: '',
    department: 'Engineering',
    designation: 'Software Engineer',
    joiningDate: new Date().toISOString().split('T')[0],
    officeLocation: 'Head Office',
    employmentType: 'Full-Time',
    monthlySalary: '75000',
    panNumber: '',
    address: '',
  });

  const fetchNextId = async () => {
    setIsFetchingNextId(true);
    try {
      const res: any = await api.get('/employees/next-id');
      const nextId = res?.nextEmployeeId || res?.data?.nextEmployeeId || 'QB0001';
      setFormData((prev) => ({ ...prev, employeeCode: nextId }));
    } catch {
      // Fallback
    } finally {
      setIsFetchingNextId(false);
    }
  };

  useEffect(() => {
    fetchNextId();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName.trim() || !formData.email.trim()) {
      toast.error('First name and corporate email are required');
      return;
    }

    setLoading(true);
    try {
      await api.post('/employees', {
        firstName: formData.firstName,
        lastName: formData.lastName,
        employeeCode: autoGenerateId ? undefined : formData.employeeCode,
        autoGenerateCode: autoGenerateId,
        email: formData.email,
        phone: formData.phone,
        departmentName: formData.department,
        designationName: formData.designation,
        branch: formData.officeLocation,
        joiningDate: formData.joiningDate,
        employmentType: formData.employmentType === 'Full-Time' ? 'FULL_TIME' : (formData.employmentType === 'Contract' ? 'CONTRACT' : 'INTERN'),
        address: formData.address,
        documents: {
          panNumber: formData.panNumber || undefined,
        },
        bankDetails: {
          basicSalary: formData.monthlySalary || undefined,
        },
      });

      toast.success('Employee profile created successfully in database!');
      router.push('/employees');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to create employee profile';
      toast.error(typeof msg === 'string' ? msg : 'Validation error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminFormPage
      title="Add Employee"
      description="Create a new employee record with employment details, contact information, and payroll settings."
      backHref="/employees"
      backLabel="Back to Employee Directory"
      badge="Master Record"
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

          <div className="col-span-2 p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <label className="text-[11px] font-extrabold text-slate-700 uppercase">
                  Employee ID *
                </label>
                {autoGenerateId && (
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-black uppercase">
                    Auto-generated
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={fetchNextId}
                disabled={isFetchingNextId}
                className="flex items-center gap-1 text-[11px] font-extrabold text-[#1AA14D] hover:text-emerald-800 transition-colors cursor-pointer disabled:opacity-50"
                title="Generate Next ID"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isFetchingNextId ? 'animate-spin' : ''}`} />
                <span>Generate Next ID</span>
              </button>
            </div>

            <AdminInput
              type="text"
              required
              disabled={autoGenerateId}
              value={formData.employeeCode}
              onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value })}
              className="font-mono"
            />

            <label className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer pt-1 select-none">
              <input
                type="checkbox"
                checked={autoGenerateId}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setAutoGenerateId(checked);
                  if (checked) {
                    fetchNextId();
                  }
                }}
                className="w-4 h-4 rounded text-[#23C45E] focus:ring-[#23C45E] border-slate-300 cursor-pointer accent-[#23C45E]"
              />
              <span>Auto Generate Employee ID</span>
            </label>
          </div>

          <AdminFormField label="PAN / National ID">
            <AdminInput
              type="text"
              placeholder="ABCDE1234F"
              value={formData.panNumber}
              onChange={(e) => setFormData({ ...formData, panNumber: e.target.value.toUpperCase() })}
            />
          </AdminFormField>
        </AdminFormSection>

        {/* Section 2: Employment Information */}
        <AdminFormSection title="Employment Details" description="Department, designation, and joining date" icon={Building2} columns={2}>
          <AdminFormField label="Department" required>
            <AdminInput
              type="text"
              required
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
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

          <AdminFormField label="Mobile Phone Number">
            <AdminInput
              type="tel"
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
          <AdminFormField label="Monthly Base Salary (₹)">
            <AdminInput
              type="number"
              placeholder="75000"
              value={formData.monthlySalary}
              onChange={(e) => setFormData({ ...formData, monthlySalary: e.target.value })}
            />
          </AdminFormField>

          <AdminFormField label="Office / Work Location" required>
            <AdminInput
              type="text"
              required
              value={formData.officeLocation}
              onChange={(e) => setFormData({ ...formData, officeLocation: e.target.value })}
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
