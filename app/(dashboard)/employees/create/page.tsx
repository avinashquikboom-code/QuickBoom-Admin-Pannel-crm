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
    basicSalary: '',
    hra: '0',
    allowances: '0',
    specialAllowance: '0',
    pf: '0',
    esi: '0',
    professionalTax: '0',
    tds: '0',
    panNumber: '',
    address: '',
    mobileLoginEnabled: true,
    password: '',
    confirmPassword: '',
  });

  const basic = Math.max(0, Number(formData.basicSalary) || 0);
  const hra = Math.max(0, Number(formData.hra) || 0);
  const allowances = Math.max(0, Number(formData.allowances) || 0);
  const specialAllowance = Math.max(0, Number(formData.specialAllowance) || 0);
  const pf = Math.max(0, Number(formData.pf) || 0);
  const esi = Math.max(0, Number(formData.esi) || 0);
  const professionalTax = Math.max(0, Number(formData.professionalTax) || 0);
  const tds = Math.max(0, Number(formData.tds) || 0);

  const grossEarnings = basic + hra + allowances + specialAllowance;
  const totalDeductions = pf + esi + professionalTax + tds;
  const calculatedNetSalary = Math.max(0, grossEarnings - totalDeductions);

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

    // Validation: Basic Salary is required
    if (!formData.basicSalary || Number(formData.basicSalary) <= 0) {
      toast.error('Basic Salary (₹) is required and must be greater than 0');
      return;
    }
    if (
      Number(formData.basicSalary) < 0 ||
      Number(formData.hra) < 0 ||
      Number(formData.allowances) < 0 ||
      Number(formData.specialAllowance) < 0 ||
      Number(formData.pf) < 0 ||
      Number(formData.esi) < 0 ||
      Number(formData.professionalTax) < 0 ||
      Number(formData.tds) < 0
    ) {
      toast.error('Salary and deduction values cannot be negative');
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
        salaryStructure: {
          basicSalary: basic,
          hra,
          allowances,
          specialAllowance,
          pf,
          esi,
          professionalTax,
          tds,
          grossSalary: grossEarnings,
          totalDeductions,
          netSalary: calculatedNetSalary,
        },
        bankDetails: {
          basicSalary: basic,
          hra,
          allowances,
          specialAllowance,
          pf,
          esi,
          professionalTax,
          tds,
          grossSalary: grossEarnings,
          totalDeductions,
          netSalary: calculatedNetSalary,
        },
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

        {/* Section 3: Payroll */}
        <AdminFormSection
          title="Payroll Structure"
          description="Dedicated employee compensation, statutory deductions, and net take-home salary calculation"
          icon={DollarSign}
          columns={1}
        >
          <div className="space-y-6">
            {/* Earnings Components Card */}
            <div className="p-5 sm:p-6 bg-slate-50/80 border border-slate-200/80 rounded-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200/60">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    Earnings Components
                  </h3>
                </div>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 rounded-full">
                  Monthly Additions
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <AdminFormField label="Basic Salary (₹) *" required>
                  <AdminInput
                    type="number"
                    min="0"
                    placeholder="e.g. 15000"
                    value={formData.basicSalary}
                    onChange={(e) => setFormData({ ...formData, basicSalary: e.target.value })}
                  />
                </AdminFormField>

                <AdminFormField label="HRA (₹)">
                  <AdminInput
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.hra}
                    onChange={(e) => setFormData({ ...formData, hra: e.target.value })}
                  />
                </AdminFormField>

                <AdminFormField label="Allowances (₹)">
                  <AdminInput
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.allowances}
                    onChange={(e) => setFormData({ ...formData, allowances: e.target.value })}
                  />
                </AdminFormField>

                <AdminFormField label="Special Allowance (₹)">
                  <AdminInput
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.specialAllowance}
                    onChange={(e) => setFormData({ ...formData, specialAllowance: e.target.value })}
                  />
                </AdminFormField>
              </div>
            </div>

            {/* Deductions Components Card */}
            <div className="p-5 sm:p-6 bg-slate-50/80 border border-slate-200/80 rounded-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200/60">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    Deductions Components
                  </h3>
                </div>
                <span className="text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200/60 px-2.5 py-0.5 rounded-full">
                  Statutory & Taxes
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <AdminFormField label="Provident Fund (PF ₹)">
                  <AdminInput
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.pf}
                    onChange={(e) => setFormData({ ...formData, pf: e.target.value })}
                  />
                </AdminFormField>

                <AdminFormField label="ESI (₹)">
                  <AdminInput
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.esi}
                    onChange={(e) => setFormData({ ...formData, esi: e.target.value })}
                  />
                </AdminFormField>

                <AdminFormField label="Professional Tax (₹)">
                  <AdminInput
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.professionalTax}
                    onChange={(e) => setFormData({ ...formData, professionalTax: e.target.value })}
                  />
                </AdminFormField>

                <AdminFormField label="TDS Tax (₹)">
                  <AdminInput
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.tds}
                    onChange={(e) => setFormData({ ...formData, tds: e.target.value })}
                  />
                </AdminFormField>
              </div>
            </div>

            {/* Salary Summary Card */}
            <div className="p-5 sm:p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl shadow-sm border border-slate-700/50">
              <div className="flex items-center justify-between pb-3 border-b border-slate-700/60 mb-4">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-300">
                  Salary Calculation Summary
                </span>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                  Real-time Calculation
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-3.5 bg-white/5 rounded-xl border border-white/10">
                  <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Gross Earnings
                  </span>
                  <span className="block text-lg sm:text-xl font-black text-white mt-1">
                    ₹{grossEarnings.toLocaleString('en-IN')}
                  </span>
                  <span className="block text-[10px] text-slate-400 mt-0.5">
                    Basic + HRA + Allowances
                  </span>
                </div>

                <div className="p-3.5 bg-white/5 rounded-xl border border-white/10">
                  <span className="block text-[10px] font-extrabold uppercase tracking-wider text-rose-300">
                    Total Deductions
                  </span>
                  <span className="block text-lg sm:text-xl font-black text-rose-400 mt-1">
                    -₹{totalDeductions.toLocaleString('en-IN')}
                  </span>
                  <span className="block text-[10px] text-slate-400 mt-0.5">
                    PF + ESI + PT + TDS
                  </span>
                </div>

                <div className="p-3.5 bg-emerald-500/10 rounded-xl border border-emerald-500/30">
                  <span className="block text-[10px] font-extrabold uppercase tracking-wider text-emerald-300">
                    Calculated Net Salary
                  </span>
                  <span className="block text-xl sm:text-2xl font-black text-emerald-400 mt-0.5">
                    ₹{calculatedNetSalary.toLocaleString('en-IN')}
                  </span>
                  <span className="block text-[10px] text-emerald-200/70 mt-0.5">
                    Take-home payable per month
                  </span>
                </div>
              </div>
            </div>
          </div>
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
