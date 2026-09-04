'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { User, Mail, Phone, Building2, DollarSign, RefreshCw, MapPin } from 'lucide-react';
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
    officeId: '' as string | number,
    officeLocation: 'Head Office',
    shiftId: '' as string | number,
    joiningDate: new Date().toISOString().split('T')[0],
    employmentType: 'FULL_TIME',
    monthlySalary: '',
    status: 'ACTIVE',
    address: '',
    mobileLoginEnabled: true,
    password: '',
    confirmPassword: '',
  });

  // Dynamic Offices query
  const { data: officesRes } = useQuery({
    queryKey: ['active-offices'],
    queryFn: async () => {
      const res: any = await api.get('/offices', { params: { isActive: true } });
      return Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
    },
  });

  const offices: any[] = Array.isArray(officesRes) ? officesRes : [];

  // Dynamic Shifts query
  const { data: shiftsRes, isLoading: isShiftsLoading } = useQuery({
    queryKey: ['active-shifts'],
    queryFn: async () => {
      const res: any = await api.get('/shifts', { params: { status: 'ACTIVE' } });
      const items = res?.data?.data || res?.data?.items || res?.data || (Array.isArray(res) ? res : []);
      return Array.isArray(items) ? items : [];
    },
  });

  const shifts: any[] = Array.isArray(shiftsRes) ? shiftsRes : [];

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
        employeeCode: employeeData.employeeId || employeeData.employeeCode || `EMP-${id}`,
        email: employeeData.email || '',
        phone: employeeData.phone || '',
        departmentId: employeeData.departmentId || employeeData.department?.id || '',
        departmentName: employeeData.department?.name || employeeData.department || 'Engineering & IT',
        designationId: employeeData.designationId || employeeData.designation?.id || '',
        designationName: employeeData.designation?.name || employeeData.designation || 'Software Engineer',
        officeId: employeeData.officeId || employeeData.office?.id || '',
        officeLocation: employeeData.office?.name || employeeData.branch || 'Head Office',
        shiftId: employeeData.shiftId || employeeData.shift?.id || '',
        joiningDate: employeeData.joiningDate ? new Date(employeeData.joiningDate).toISOString().split('T')[0] : '',
        employmentType: employeeData.employmentType || 'FULL_TIME',
        monthlySalary: employeeData.bankDetails?.basicSalary ? String(employeeData.bankDetails.basicSalary) : '',
        status: employeeData.status || 'ACTIVE',
        address: employeeData.address || '',
        mobileLoginEnabled: employeeData.mobileLoginEnabled !== false,
        password: '',
        confirmPassword: '',
      });
    }
  }, [employeeData, id]);

  const updateMutation = useMutation({
    mutationFn: async (payload: any) => {
      return api.patch(`/employees/${id}`, payload);
    },
    onSuccess: () => {
      toast.success('Employee updated successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-employees'] });
      queryClient.invalidateQueries({ queryKey: ['admin-employee-edit-detail', id] });
      router.push('/employees');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || 'Failed to update employee';
      toast.error(typeof msg === 'string' ? msg : 'Validation error');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName.trim()) {
      toast.error('First name is required');
      return;
    }

    if (formData.password.trim()) {
      if (formData.password.length < 6) {
        toast.error('Password must be at least 6 characters');
        return;
      }
      if (formData.confirmPassword && formData.password !== formData.confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }
    }

    const payload: any = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      phone: formData.phone.trim() || undefined,
      departmentId: formData.departmentId ? Number(formData.departmentId) : undefined,
      departmentName: formData.departmentName || undefined,
      designationId: formData.designationId ? Number(formData.designationId) : undefined,
      designationName: formData.designationName || undefined,
      officeId: formData.officeId ? Number(formData.officeId) : undefined,
      shiftId: formData.shiftId ? Number(formData.shiftId) : null,
      branch: formData.officeLocation || 'Head Office',
      joiningDate: formData.joiningDate || undefined,
      employmentType: formData.employmentType,
      status: formData.status,
      address: formData.address.trim() || undefined,
      bankDetails: formData.monthlySalary ? { basicSalary: Number(formData.monthlySalary) } : undefined,
      mobileLoginEnabled: formData.mobileLoginEnabled,
      password: formData.password.trim() || undefined,
      confirmPassword: formData.confirmPassword.trim() || undefined,
    };

    updateMutation.mutate(payload);
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-8">
        <div className="text-center space-y-3 text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#23C45E]" />
          <p className="text-xs font-bold text-slate-600">Loading employee master record...</p>
        </div>
      </div>
    );
  }

  return (
    <AdminFormPage
      title={`Edit Employee: ${formData.firstName} ${formData.lastName}`}
      description={`Update official details and assignment for ${formData.employeeCode}`}
      backHref="/employees"
      icon={User}
      breadcrumbContext="HRM / Employees"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Personal Details */}
        <AdminFormSection title="Personal Information" description="Identity and contact information" icon={User} columns={2}>
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

          <AdminFormField label="Corporate Email (Read Only)" hint="Corporate email address cannot be changed">
            <AdminInput
              type="email"
              disabled
              value={formData.email}
              className="bg-slate-100/70 text-slate-500 cursor-not-allowed"
            />
          </AdminFormField>

          <AdminFormField label="Phone Number">
            <AdminInput
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </AdminFormField>

          <AdminFormField label="Employee ID" hint="Unique master system identifier">
            <AdminInput
              type="text"
              disabled
              value={formData.employeeCode}
              className="bg-slate-100/70 text-slate-500 font-mono cursor-not-allowed"
            />
          </AdminFormField>

          <AdminFormField label="Account Status" required>
            <AdminSelect
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              options={[
                { value: 'ACTIVE', label: 'Active (Permitted to work)' },
                { value: 'INACTIVE', label: 'Inactive / Suspended' },
              ]}
            />
          </AdminFormField>
        </AdminFormSection>

        {/* Section 2: Employment Setup */}
        <AdminFormSection title="Employment Setup" description="Assigned office geofence, shift, department, and role" icon={Building2} columns={2}>
          <AdminFormField label="Assigned Office (Attendance Geofence)" required>
            <select
              required
              value={formData.officeId}
              onChange={(e) => {
                const id = e.target.value;
                const found = offices.find((o) => String(o.id) === String(id));
                setFormData({
                  ...formData,
                  officeId: id,
                  officeLocation: found ? found.name : 'Head Office',
                });
              }}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
            >
              <option value="">-- Select Assigned Office --</option>
              {offices.map((off) => (
                <option key={off.id} value={off.id}>
                  {off.name} {off.city ? `(${off.city})` : ''} • Radius: {off.radiusMeters || 200}m
                </option>
              ))}
            </select>
          </AdminFormField>

          <AdminFormField label="Assigned Shift (Work Schedule)">
            <select
              value={formData.shiftId}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  shiftId: e.target.value,
                });
              }}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
            >
              <option value="">-- Select Shift (Optional) --</option>
              {isShiftsLoading && <option disabled>Loading shifts...</option>}
              {shifts.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.startTime} - {s.endTime})
                </option>
              ))}
            </select>
          </AdminFormField>

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
                { value: 'INTERNSHIP', label: 'Intern' },
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
                  onChange={(e) =>
                    setFormData({ ...formData, mobileLoginEnabled: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#23C45E]" />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200/60">
              <div>
                <label className="block text-[10px] font-black text-slate-600 uppercase mb-1">
                  Reset Password (Optional)
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Leave blank to keep existing password"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-600 uppercase mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, confirmPassword: e.target.value })
                  }
                  placeholder="Repeat new password"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
                />
              </div>
            </div>
          </div>
        </AdminFormSection>

        {/* Section 3: Compensation & Address */}
        <AdminFormSection title="Compensation & Address" description="Salary and physical address" icon={DollarSign} columns={2}>
          <AdminFormField label="Monthly Basic Salary (₹)">
            <AdminInput
              type="number"
              value={formData.monthlySalary}
              onChange={(e) => setFormData({ ...formData, monthlySalary: e.target.value })}
            />
          </AdminFormField>

          <AdminFormField label="Permanent Address" className="col-span-2">
            <AdminTextarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              rows={3}
            />
          </AdminFormField>
        </AdminFormSection>

        {/* Actions */}
        <AdminFormActions
          backHref="/employees"
          submitLabel={updateMutation.isPending ? 'Updating...' : 'Save Changes'}
          isSubmitting={updateMutation.isPending}
        />
      </form>
    </AdminFormPage>
  );
}
