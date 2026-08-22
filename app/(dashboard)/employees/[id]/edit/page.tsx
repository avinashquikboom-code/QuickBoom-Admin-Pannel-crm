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
    departmentId: '' as string | number,
    departmentName: 'Engineering & IT',
    designationId: '' as string | number,
    designationName: 'Software Engineer',
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

  // Dynamic Departments query
  const { data: departmentsRes } = useQuery({
    queryKey: ['active-departments'],
    queryFn: async () => {
      const res: any = await api.get('/departments', { params: { isActive: true } });
      return Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
    },
  });

  const departments: any[] = Array.isArray(departmentsRes) ? departmentsRes : [];

  // Dynamic Designations query filtered by selected department
  const { data: designationsRes } = useQuery({
    queryKey: ['active-designations', formData.departmentId],
    queryFn: async () => {
      const params: any = { isActive: true };
      if (formData.departmentId) {
        params.departmentId = formData.departmentId;
      }
      const res: any = await api.get('/designations', { params });
      return Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
    },
  });

  const designations: any[] = Array.isArray(designationsRes) ? designationsRes : [];

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
        departmentId: employeeData.departmentId || employeeData.department?.id || '',
        departmentName: employeeData.department?.name || employeeData.department || 'Engineering & IT',
        designationId: employeeData.designationId || employeeData.designation?.id || '',
        designationName: employeeData.designation?.name || employeeData.designation || 'Software Engineer',
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
        departmentId: formData.departmentId ? Number(formData.departmentId) : undefined,
        departmentName: formData.departmentName || undefined,
        designationId: formData.designationId ? Number(formData.designationId) : undefined,
        designationName: formData.designationName || undefined,
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
      toast.success('Employee profile updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['admin-employees'] });
      queryClient.invalidateQueries({ queryKey: ['admin-employee-edit-detail', id] });
      router.push('/employees');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Failed to update employee profile';
      toast.error(typeof msg === 'string' ? msg : 'Validation error');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName.trim() || !formData.email.trim()) {
      toast.error('First name and corporate email are required');
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
      <div className="p-12 text-center text-slate-400 space-y-2">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#23C45E]" />
        <p className="text-sm font-bold">Loading employee record from database...</p>
      </div>
    );
  }

  return (
    <AdminFormPage
      title={`Edit Employee: ${formData.firstName} ${formData.lastName}`}
      description="Update employee organizational details, credentials, and profile settings."
      backHref="/employees"
      backLabel="Back to Employee Directory"
      badge={`ID: ${formData.employeeCode}`}
    >
      <form onSubmit={handleSubmit}>
        {/* Section 1: Personal & Contact Information */}
        <AdminFormSection title="Personal Information" description="Identity and contact details" icon={User} columns={2}>
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

          <AdminFormField label="Corporate Email" required>
            <AdminInput
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </AdminFormField>

          <AdminFormField label="Phone Number">
            <AdminInput
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </AdminFormField>

          <AdminFormField label="Employee ID">
            <AdminInput
              type="text"
              disabled
              value={formData.employeeCode}
              onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value })}
            />
          </AdminFormField>

          <AdminFormField label="Account Status" required>
            <AdminSelect
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              options={[
                { value: 'ACTIVE', label: 'Active (Enabled)' },
                { value: 'INACTIVE', label: 'Inactive (Disabled)' },
              ]}
            />
          </AdminFormField>
        </AdminFormSection>

        {/* Section 2: Employment Information */}
        <AdminFormSection title="Employment Details" description="Department, designation, and employment status" icon={Building2} columns={2}>
          <AdminFormField label="Department" required>
            <select
              required
              value={formData.departmentId}
              onChange={(e) => {
                const id = e.target.value;
                const found = departments.find((d) => String(d.id) === String(id));
                setFormData({
                  ...formData,
                  departmentId: id,
                  departmentName: found ? found.name : '',
                });
              }}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
            >
              <option value="">-- Select Department --</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name} ({dept.code})
                </option>
              ))}
            </select>
          </AdminFormField>

          <AdminFormField label="Designation" required>
            <select
              required
              value={formData.designationId}
              onChange={(e) => {
                const id = e.target.value;
                const found = designations.find((d) => String(d.id) === String(id));
                setFormData({
                  ...formData,
                  designationId: id,
                  designationName: found ? found.name : '',
                });
              }}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
            >
              <option value="">-- Select Designation --</option>
              {designations.map((desig) => (
                <option key={desig.id} value={desig.id}>
                  {desig.name} ({desig.code})
                </option>
              ))}
            </select>
          </AdminFormField>

          <AdminFormField label="Employment Type" required>
            <AdminSelect
              value={formData.employmentType}
              onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
              options={[
                { value: 'FULL_TIME', label: 'Full-Time (Permanent)' },
                { value: 'CONTRACT', label: 'Contract / Consultant' },
                { value: 'PROBATION', label: 'Probation Period' },
                { value: 'INTERN', label: 'Intern' },
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

          <div className="col-span-2 p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-3 mt-2">
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
                  onChange={(e) => setFormData({ ...formData, mobileLoginEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#23C45E]"></div>
              </label>
            </div>

            {formData.mobileLoginEnabled && (
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200/60">
                <AdminFormField label="Reset App Password (Optional)">
                  <AdminInput
                    type="password"
                    placeholder="Leave blank to keep existing"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </AdminFormField>

                <AdminFormField label="Confirm New Password">
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

        {/* Section 3: Compensation & Location */}
        <AdminFormSection title="Compensation & Location" description="Salary and office location" icon={DollarSign} columns={2}>
          <AdminFormField label="Monthly Basic Salary (₹)">
            <AdminInput
              type="number"
              value={formData.monthlySalary}
              onChange={(e) => setFormData({ ...formData, monthlySalary: e.target.value })}
            />
          </AdminFormField>

          <AdminFormField label="Office Location" required>
            <AdminSelect
              value={formData.officeLocation}
              onChange={(e) => setFormData({ ...formData, officeLocation: e.target.value })}
              options={[
                { value: 'Head Office', label: 'Head Office - Mumbai' },
                { value: 'Pune Tech Park', label: 'Pune Tech Park' },
                { value: 'Bangalore Office', label: 'Bangalore Office' },
                { value: 'Delhi Hub', label: 'Delhi NCR Hub' },
                { value: 'Remote / WFH', label: 'Remote / Work From Home' },
              ]}
            />
          </AdminFormField>

          <div className="col-span-2">
            <AdminFormField label="Residential Address">
              <AdminTextarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </AdminFormField>
          </div>
        </AdminFormSection>

        <AdminFormActions
          backHref="/employees"
          submitLabel={updateMutation.isPending ? 'Updating...' : 'Update Employee Profile'}
          loading={updateMutation.isPending}
        />
      </form>
    </AdminFormPage>
  );
}
