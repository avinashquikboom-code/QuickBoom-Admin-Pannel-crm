'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Mail, Phone, Building2, Calendar, DollarSign, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';
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
    departmentId: '' as string | number,
    departmentName: '',
    designationId: '' as string | number,
    designationName: '',
    joiningDate: new Date().toISOString().split('T')[0],
    officeLocation: 'Head Office',
    employmentType: 'Full-Time',
    monthlySalary: '75000',
    panNumber: '',
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

    if (formData.mobileLoginEnabled && formData.password.trim()) {
      if (formData.password.length < 6) {
        toast.error('Password must be at least 6 characters');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        toast.error('Password and Confirm Password do not match');
        return;
      }
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
        departmentId: formData.departmentId ? Number(formData.departmentId) : undefined,
        departmentName: formData.departmentName || undefined,
        designationId: formData.designationId ? Number(formData.designationId) : undefined,
        designationName: formData.designationName || undefined,
        branch: formData.officeLocation,
        joiningDate: formData.joiningDate,
        employmentType: formData.employmentType === 'Full-Time' ? 'FULL_TIME' : (formData.employmentType === 'Contract' ? 'CONTRACT' : 'INTERN'),
        mobileLoginEnabled: formData.mobileLoginEnabled,
        password: formData.password?.trim() || undefined,
        confirmPassword: formData.confirmPassword?.trim() || undefined,
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
    >
      <form onSubmit={handleSubmit}>
        {/* Section 1: Personal & Contact Information */}
        <AdminFormSection title="Personal Information" description="Basic details, contact and government ID" icon={User} columns={2}>
          <AdminFormField label="First Name" required>
            <AdminInput
              type="text"
              required
              placeholder="John"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            />
          </AdminFormField>

          <AdminFormField label="Last Name" required>
            <AdminInput
              type="text"
              required
              placeholder="Doe"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            />
          </AdminFormField>

          <AdminFormField label="Email Address" required>
            <AdminInput
              type="email"
              required
              placeholder="john.doe@company.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </AdminFormField>

          <AdminFormField label="Phone Number">
            <AdminInput
              type="tel"
              placeholder="+91 98765 43210"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </AdminFormField>

          <div className="space-y-1.5">
            <AdminFormField label="Employee ID" required>
              <div className="relative">
                <AdminInput
                  type="text"
                  required
                  placeholder="QB0001"
                  value={formData.employeeCode}
                  disabled={autoGenerateId}
                  onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value })}
                />
                {autoGenerateId && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase text-[#1AA14D] bg-[#E8F9EE] px-2 py-0.5 rounded">
                    Auto
                  </span>
                )}
              </div>
            </AdminFormField>
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
                <AdminFormField label="Initial App Password">
                  <AdminInput
                    type="password"
                    placeholder="Min. 6 characters"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </AdminFormField>

                <AdminFormField label="Confirm Password">
                  <AdminInput
                    type="password"
                    placeholder="Confirm initial password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  />
                </AdminFormField>
              </div>
            )}
          </div>
        </AdminFormSection>

        {/* Section 3: Compensation & Location */}
        <AdminFormSection title="Compensation & Location" description="Salary and office assignment" icon={DollarSign} columns={2}>
          <AdminFormField label="Monthly Basic Salary (₹)">
            <AdminInput
              type="number"
              placeholder="75000"
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
                placeholder="Full residential address..."
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </AdminFormField>
          </div>
        </AdminFormSection>

        <AdminFormActions
          backHref="/employees"
          submitLabel={loading ? 'Creating Profile...' : 'Save Employee Profile'}
          loading={loading}
        />
      </form>
    </AdminFormPage>
  );
}
