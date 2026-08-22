'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { User, Mail, Phone, Building2, DollarSign, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  const id = (params?.id as string) || '1';
  const router = useRouter();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    employeeCode: '',
    email: '',
    phone: '',
    department: 'Engineering & IT',
    designation: 'Software Engineer',
    joiningDate: new Date().toISOString().split('T')[0],
    employmentType: 'FULL_TIME',
    monthlySalary: '',
    officeLocation: 'Head Office',
    status: 'ACTIVE',
    address: '',
    mobileLoginEnabled: true,
    password: '',
    confirmPassword: '',
  });

  // Fetch real employee profile from database
  const { data: employeeData, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-employee-edit-detail', id],
    queryFn: async () => {
      try {
        const res: any = await api.get(`/employees/${id}`);
        return res?.data || res;
      } catch {
        return null;
      }
    },
  });

  useEffect(() => {
    if (employeeData) {
      setFormData({
        firstName: employeeData.firstName || '',
        lastName: employeeData.lastName || '',
        employeeCode: employeeData.employeeCode || employeeData.employeeId || `EMP-${id}`,
        email: employeeData.email || '',
        phone: employeeData.phone || '',
        department: employeeData.department || 'Engineering & IT',
        designation: employeeData.designation || 'Software Engineer',
        joiningDate: employeeData.joiningDate ? new Date(employeeData.joiningDate).toISOString().split('T')[0] : '',
        employmentType: employeeData.employmentType || 'FULL_TIME',
        monthlySalary: employeeData.bankDetails?.basicSalary ? String(employeeData.bankDetails.basicSalary) : '',
        officeLocation: employeeData.branch || employeeData.office || 'Head Office',
        status: employeeData.status || 'ACTIVE',
        address: employeeData.address || '',
        mobileLoginEnabled: employeeData.mobileLoginEnabled !== false,
        password: '',
        confirmPassword: '',
      });
    }
  }, [employeeData, id]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      return api.patch(`/employees/${id}`, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        departmentName: formData.department,
        designationName: formData.designation,
        branch: formData.officeLocation,
        employmentType: formData.employmentType,
        status: formData.status,
        address: formData.address,
        mobileLoginEnabled: formData.mobileLoginEnabled,
        password: formData.password?.trim() || undefined,
        confirmPassword: formData.confirmPassword?.trim() || undefined,
        bankDetails: {
          basicSalary: formData.monthlySalary || undefined,
        },
      });
    },
    onSuccess: () => {
      toast.success('Employee profile updated successfully in database!');
      queryClient.invalidateQueries({ queryKey: ['admin-employees'] });
      queryClient.invalidateQueries({ queryKey: ['admin-employee-edit-detail', id] });
      router.push('/employees');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Failed to update employee';
      toast.error(typeof msg === 'string' ? msg : 'Validation error');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName.trim() || !formData.email.trim()) {
      toast.error('First name and email are required');
      return;
    }
    if (formData.password.trim()) {
      if (formData.password.length < 6) {
        toast.error('Password must be at least 6 characters');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        toast.error('Password and Confirm Password do not match');
        return;
      }
    }
    updateMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="p-16 text-center space-y-3">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#23C45E]" />
        <p className="text-xs font-bold text-slate-500">Loading employee master record...</p>
      </div>
    );
  }

  if (isError || !employeeData) {
    return (
      <div className="p-16 text-center space-y-3">
        <p className="text-sm font-bold text-slate-800">Unable to load employee profile.</p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <AdminFormPage
      title={`Edit Employee (${formData.employeeCode})`}
      description={`Update employment status, contact coordinates, and department assignment for ${formData.firstName} ${formData.lastName}.`}
      backHref="/employees"
      backLabel="Back to Employee Directory"
      badge="Master Record"
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
                { value: 'ACTIVE', label: 'Active' },
                { value: 'INACTIVE', label: 'Inactive' },
              ]}
            />
          </AdminFormField>
        </AdminFormSection>

        <AdminFormSection title="Employment & Department" description="Job assignment and office location" icon={Building2} columns={2}>
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
              value={formData.designation}
              onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
            />
          </AdminFormField>

          <AdminFormField label="Employment Type" required>
            <AdminSelect
              value={formData.employmentType}
              onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
              options={[
                { value: 'FULL_TIME', label: 'Full Time' },
                { value: 'PART_TIME', label: 'Part Time' },
                { value: 'CONTRACT', label: 'Contract' },
                { value: 'INTERN', label: 'Intern' },
              ]}
            />
          </AdminFormField>

          <AdminFormField label="Assigned Office / Work Location" required>
            <AdminInput
              type="text"
              required
              value={formData.officeLocation}
              onChange={(e) => setFormData({ ...formData, officeLocation: e.target.value })}
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

          <AdminFormField label="Mobile Phone Number">
            <AdminInput
              type="tel"
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
          <AdminFormField label="Monthly Base Compensation (₹)">
            <AdminInput
              type="number"
              value={formData.monthlySalary}
              onChange={(e) => setFormData({ ...formData, monthlySalary: e.target.value })}
            />
          </AdminFormField>
        </AdminFormSection>

        <AdminFormSection title="Mobile App Access & Security" description="QuickBoom Mobile App authentication and password credentials" icon={Phone} columns={2}>
          <div className="col-span-2 p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-extrabold text-slate-800 uppercase block">
                  Mobile App Login Access
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  Allow employee to authenticate into the QuickBoom mobile application
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.mobileLoginEnabled}
                  onChange={(e) =>
                    setFormData({ ...formData, mobileLoginEnabled: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-[#23C45E] focus:ring-[#23C45E] border-slate-300 cursor-pointer accent-[#23C45E]"
                />
                <span className="ml-2 text-xs font-bold text-slate-700">
                  {formData.mobileLoginEnabled ? 'Allowed' : 'Disabled'}
                </span>
              </label>
            </div>

            {formData.mobileLoginEnabled && (
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200/50">
                <AdminFormField label="Reset Password (Optional, Leave blank to keep)">
                  <AdminInput
                    type="password"
                    placeholder="Enter new password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </AdminFormField>
                <AdminFormField label="Confirm Reset Password">
                  <AdminInput
                    type="password"
                    placeholder="Confirm new password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  />
                </AdminFormField>
              </div>
            )}
          </div>
        </AdminFormSection>

        <AdminFormActions
          backHref="/employees"
          cancelLabel="Cancel"
          submitLabel="Save Changes"
          loading={updateMutation.isPending}
          sticky
        />
      </form>
    </AdminFormPage>
  );
}
