'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Mail, Phone, Building2, Calendar, DollarSign, MapPin } from 'lucide-react';
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
  // Silently fetched on mount — displayed read-only, never sent to backend
  const [previewEmployeeId, setPreviewEmployeeId] = useState<string>('');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    departmentId: '' as string | number,
    departmentName: '',
    designationId: '' as string | number,
    designationName: '',
    officeId: '' as string | number,
    officeLocation: 'Head Office',
    shiftId: '' as string | number,
    joiningDate: new Date().toISOString().split('T')[0],
    employmentType: 'Full-Time',
    employeeType: 'COMPANY',
    city: '',
    monthlySalary: '75000',
    panNumber: '',
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

  // Silently load the next ID on mount for display only.
  // Backend always generates the authoritative ID on save — this is just a preview.
  useEffect(() => {
    api.get('/employees/next-id')
      .then((res: any) => {
        const nextId = res?.nextEmployeeId || res?.data?.nextEmployeeId || '';
        if (nextId) setPreviewEmployeeId(nextId);
      })
      .catch(() => {
        // Silently ignore — backend will generate on save regardless
      });
  }, []);

  // Set default office when offices load
  useEffect(() => {
    if (offices.length > 0 && !formData.officeId) {
      setFormData((prev) => ({
        ...prev,
        officeId: offices[0].id,
        officeLocation: offices[0].name,
      }));
    }
  }, [offices]);

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
      if (formData.confirmPassword && formData.password !== formData.confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }
    }

    // New validation: Employee Type must be selected
    if (!formData.employeeType) {
      toast.error('Employee type is required');
      return;
    }

    setLoading(true);

    try {
      const payload: any = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        // employeeCode intentionally omitted — backend always auto-generates
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim() || undefined,
        departmentId: formData.departmentId ? Number(formData.departmentId) : undefined,
        departmentName: formData.departmentName || undefined,
        designationId: formData.designationId ? Number(formData.designationId) : undefined,
        designationName: formData.designationName || undefined,
        officeId: formData.officeId ? Number(formData.officeId) : undefined,
        shiftId: formData.shiftId ? Number(formData.shiftId) : undefined,
        branch: formData.officeLocation || 'Head Office',
        joiningDate: formData.joiningDate,
        employmentType: formData.employmentType === 'Full-Time' ? 'FULL_TIME' : formData.employmentType.toUpperCase().replace(/\s+/g, '_'),
        employeeType: formData.employeeType,
        city: formData.city.trim() || undefined,
        status: 'ACTIVE',
        address: formData.address.trim() || undefined,
        documents: formData.panNumber.trim() ? { panNumber: formData.panNumber.trim() } : undefined,
        bankDetails: formData.monthlySalary ? { basicSalary: Number(formData.monthlySalary) } : undefined,
        mobileLoginEnabled: formData.mobileLoginEnabled,
        password: formData.password.trim() || undefined,
        confirmPassword: formData.confirmPassword.trim() || undefined,
      };

      await api.post('/employees', payload);
      toast.success('Employee created successfully in Master Registry!');
      router.push('/employees');
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to create employee record';
      toast.error(typeof msg === 'string' ? msg : 'Validation error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminFormPage
      title="Add New Employee"
      description="Register a new workforce member in the centralized master database"
      backHref="/employees"
      icon={User}
      breadcrumbContext="HRM / Employees"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Personal & Identity Information */}
        <AdminFormSection title="Personal Information" description="Basic employee identification details" icon={User} columns={2}>
          <AdminFormField label="First Name" required>
            <AdminInput
              type="text"
              required
              placeholder="e.g. John"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            />
          </AdminFormField>

          <AdminFormField label="Last Name" required>
            <AdminInput
              type="text"
              required
              placeholder="e.g. Doe"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            />
          </AdminFormField>

          <AdminFormField label="Corporate Email" required>
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

          {/* Employee ID — System-generated read-only */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-extrabold text-slate-700 uppercase">
                EMPLOYEE ID
              </label>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-black uppercase tracking-wider">
                AUTO-ASSIGNED
              </span>
            </div>
            <div className="px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl font-mono font-black text-slate-800 text-sm tracking-wider cursor-not-allowed select-none">
              {previewEmployeeId || 'EMP-003'}
            </div>
            <p className="mt-1 text-[10px] text-slate-400 font-medium">
              System-generated permanent identifier.
            </p>
          </div>

          <AdminFormField label="PAN / National ID">
            <AdminInput
              type="text"
              placeholder="ABCDE1234F"
              value={formData.panNumber}
              onChange={(e) => setFormData({ ...formData, panNumber: e.target.value.toUpperCase() })}
            />
          </AdminFormField>

          <AdminFormField label="City / Location">
            <AdminInput
              type="text"
              placeholder="e.g. Mumbai"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            />
          </AdminFormField>

          <AdminFormField label="Residential Address" className="col-span-2">
            <AdminTextarea
              placeholder="Enter full permanent / residential address..."
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              rows={3}
            />
          </AdminFormField>
        </AdminFormSection>

        {/* Section 2: Employment Information */}
        <AdminFormSection title="Employment Information" description="Office geofence, shift, department, designation, and joining date" icon={Building2} columns={2}>
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

          <AdminFormField label="Employee Type" required>
            <AdminSelect
              required
              value={formData.employeeType}
              onChange={(e) => setFormData({ ...formData, employeeType: e.target.value })}
              options={[
                { value: '', label: '-- Select Employee Type --' },
                { value: 'COMPANY', label: 'Company (Corporate Workforce)' },
                { value: 'FREELANCER', label: 'Freelancer (Independent Contractor)' },
              ]}
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

            {formData.mobileLoginEnabled && (
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200/60 animate-in fade-in-50 duration-150">
                <div>
                  <label className="block text-[10px] font-black text-slate-600 uppercase mb-1">
                    Initial Password
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Min 6 chars (default: Password@123)"
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
                    placeholder="Repeat password"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
                  />
                </div>
              </div>
            )}
          </div>
        </AdminFormSection>

        {/* Section 3: Salary Information */}
        <AdminFormSection title="Salary Information" description="Compensation, payroll, and monthly CTC details" icon={DollarSign} columns={2}>
          <AdminFormField label="Monthly Basic Salary (₹)">
            <AdminInput
              type="number"
              placeholder="75000"
              value={formData.monthlySalary}
              onChange={(e) => setFormData({ ...formData, monthlySalary: e.target.value })}
            />
          </AdminFormField>
        </AdminFormSection>

        {/* Form Actions */}
        <AdminFormActions
          backHref="/employees"
          submitLabel={loading ? 'Registering Employee...' : 'Create Employee Master'}
          isSubmitting={loading}
        />
      </form>
    </AdminFormPage>
  );
}
