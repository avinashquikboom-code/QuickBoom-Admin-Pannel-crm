'use client';

import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Download,
  Upload,
  MoreVertical,
  Mail,
  Phone,
  Building2,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Eye,
  ShieldAlert,
} from 'lucide-react';

interface Employee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  role: string;
  status: 'ACTIVE' | 'INACTIVE';
  joiningDate: string;
  avatar?: string;
}

const mockEmployees: Employee[] = [
  {
    id: '1',
    employeeId: 'EMP001',
    firstName: 'Rahul',
    lastName: 'Sharma',
    email: 'rahul.sharma@quikboom.com',
    phone: '9876543210',
    department: 'Sales',
    designation: 'Sales Manager',
    role: 'HR Manager',
    status: 'ACTIVE',
    joiningDate: '2024-01-15',
  },
  {
    id: '2',
    employeeId: 'EMP002',
    firstName: 'Priya',
    lastName: 'Singh',
    email: 'priya.singh@quikboom.com',
    phone: '9876543211',
    department: 'Engineering',
    designation: 'Senior Fullstack Lead',
    role: 'Employee',
    status: 'ACTIVE',
    joiningDate: '2024-02-01',
  },
  {
    id: '3',
    employeeId: 'EMP003',
    firstName: 'Amit',
    lastName: 'Verma',
    email: 'amit.verma@quikboom.com',
    phone: '9876543212',
    department: 'Marketing',
    designation: 'Digital Marketing Executive',
    role: 'Employee',
    status: 'ACTIVE',
    joiningDate: '2024-03-10',
  },
  {
    id: '4',
    employeeId: 'EMP004',
    firstName: 'Sneha',
    lastName: 'Gupta',
    email: 'sneha.gupta@quikboom.com',
    phone: '9876543213',
    department: 'Operations',
    designation: 'Field Visit Supervisor',
    role: 'Employee',
    status: 'ACTIVE',
    joiningDate: '2024-04-05',
  },
  {
    id: '5',
    employeeId: 'EMP005',
    firstName: 'Vikram',
    lastName: 'Mehta',
    email: 'vikram.mehta@quikboom.com',
    phone: '9876543214',
    department: 'Finance',
    designation: 'Payroll Accountant',
    role: 'Finance Manager',
    status: 'INACTIVE',
    joiningDate: '2023-11-20',
  },
];

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>(mockEmployees);
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Employee Form State
  const [formData, setFormData] = useState({
    employeeId: `EMP00${employees.length + 1}`,
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: 'Sales',
    designation: 'Executive',
    role: 'Employee',
    joiningDate: new Date().toISOString().split('T')[0],
  });

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      emp.email.toLowerCase().includes(search.toLowerCase()) ||
      emp.employeeId.toLowerCase().includes(search.toLowerCase());
    const matchesDept = departmentFilter === 'ALL' || emp.department === departmentFilter;
    return matchesSearch && matchesDept;
  });

  const handleCreateEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    const newEmp: Employee = {
      id: Date.now().toString(),
      ...formData,
      status: 'ACTIVE',
    };
    setEmployees([newEmp, ...employees]);
    setShowCreateModal(false);
    setFormData({
      employeeId: `EMP00${employees.length + 2}`,
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      department: 'Sales',
      designation: 'Executive',
      role: 'Employee',
      joiningDate: new Date().toISOString().split('T')[0],
    });
  };

  return (
    <div className="space-y-8">
      {/* Top Title Card Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-900 via-emerald-800 to-slate-900 p-6 sm:p-8 rounded-3xl text-white shadow-lg border border-emerald-800">
        <div>
          <div className="flex items-center gap-2 text-emerald-300 font-extrabold text-xs uppercase tracking-wider mb-1">
            <Users className="w-4 h-4 text-emerald-400" /> HRM MANAGEMENT DIRECTORY
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
            Employee Directory & Staff Profiles
          </h1>
          <p className="text-xs md:text-sm text-slate-200 mt-1 font-medium">
            Manage staff accounts, department allocations, joining records, and role access privileges.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold transition-all shadow-md cursor-pointer"
          >
            <UserPlus className="w-4 h-4" /> Add Employee
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, ID, or email..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:outline-none text-slate-900 font-medium"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-semibold text-slate-500">Department:</span>
          </div>
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:outline-none font-semibold text-slate-800"
          >
            <option value="ALL">All Departments</option>
            <option value="Sales">Sales</option>
            <option value="Engineering">Engineering</option>
            <option value="Marketing">Marketing</option>
            <option value="Operations">Operations</option>
            <option value="Finance">Finance</option>
          </select>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Employee</th>
                <th className="py-3.5 px-4">Department & Designation</th>
                <th className="py-3.5 px-4">Contact Info</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Joined On</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredEmployees.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-teal-400 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                        {emp.firstName[0]}
                        {emp.lastName[0]}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">
                          {emp.firstName} {emp.lastName}
                        </p>
                        <p className="text-[11px] font-semibold text-indigo-600">{emp.employeeId}</p>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <p className="font-bold text-slate-800">{emp.department}</p>
                    <p className="text-[11px] text-slate-500">{emp.designation}</p>
                  </td>

                  <td className="py-3.5 px-4 space-y-0.5">
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{emp.email}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{emp.phone}</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 font-semibold text-slate-700">
                    <span className="px-2.5 py-1 bg-slate-100 rounded-md text-[11px]">
                      {emp.role}
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        emp.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {emp.status === 'ACTIVE' ? (
                        <CheckCircle className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <XCircle className="w-3 h-3 text-rose-600" />
                      )}
                      {emp.status}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-slate-600 font-medium">{emp.joiningDate}</td>

                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-indigo-600 transition-colors" title="View Profile">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-emerald-600 transition-colors" title="Edit Employee">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEmployees(employees.filter((e) => e.id !== emp.id))}
                        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-rose-600 transition-colors"
                        title="Delete Employee"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Employee Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg p-6 space-y-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-black text-slate-900">Add New Employee</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateEmployee} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                    placeholder="john.doe@quikboom.com"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                    placeholder="9876543210"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:outline-none font-semibold"
                  >
                    <option value="Sales">Sales</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Operations">Operations</option>
                    <option value="Finance">Finance</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Designation</label>
                  <input
                    type="text"
                    required
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                    placeholder="Sales Manager"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md"
                >
                  Save Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
