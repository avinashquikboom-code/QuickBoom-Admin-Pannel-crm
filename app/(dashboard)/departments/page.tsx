'use client';

import React, { useState } from 'react';
import { Building2, Users, Plus, Edit, Trash2 } from 'lucide-react';

interface Department {
  id: string;
  name: string;
  code: string;
  headName: string;
  employeeCount: number;
  status: 'ACTIVE' | 'INACTIVE';
}

const mockDepts: Department[] = [
  { id: '1', name: 'Sales', code: 'SALES', headName: 'Rahul Sharma', employeeCount: 45, status: 'ACTIVE' },
  { id: '2', name: 'Engineering', code: 'ENG', headName: 'Priya Singh', employeeCount: 80, status: 'ACTIVE' },
  { id: '3', name: 'Marketing', code: 'MKT', headName: 'Amit Verma', employeeCount: 30, status: 'ACTIVE' },
  { id: '4', name: 'Operations', code: 'OPS', headName: 'Sneha Gupta', employeeCount: 60, status: 'ACTIVE' },
  { id: '5', name: 'Finance & Accounts', code: 'FIN', headName: 'Vikram Mehta', employeeCount: 20, status: 'ACTIVE' },
];

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>(mockDepts);

  return (
    <div className="space-y-8">
      {/* Top Title Card Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-900 via-emerald-800 to-slate-900 p-6 sm:p-8 rounded-3xl text-white shadow-lg border border-emerald-800">
        <div>
          <div className="flex items-center gap-2 text-emerald-300 font-extrabold text-xs uppercase tracking-wider mb-1">
            <Building2 className="w-4 h-4 text-emerald-400" /> ORGANIZATIONAL UNITS
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
            Departments & Divisions
          </h1>
          <p className="text-xs md:text-sm text-slate-200 mt-1 font-medium">
            Configure enterprise organizational units, department heads, and headcount allocations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold transition-all shadow-md cursor-pointer">
            <Plus className="w-4 h-4" /> Add Department
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departments.map((dept) => (
          <div key={dept.id} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">
                <Building2 className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {dept.code}
              </span>
            </div>

            <div>
              <h3 className="font-extrabold text-slate-900 text-base">{dept.name}</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Head: {dept.headName}</p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-indigo-500" /> {dept.employeeCount} Staff Members
              </span>
              <div className="flex items-center gap-1">
                <button className="p-1 text-slate-400 hover:text-indigo-600"><Edit className="w-4 h-4" /></button>
                <button className="p-1 text-slate-400 hover:text-rose-600"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
