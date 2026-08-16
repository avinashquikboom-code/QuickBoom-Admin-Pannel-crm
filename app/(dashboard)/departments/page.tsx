'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Building2, Plus, Users, Search, Edit2, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState([
    { id: 'dept-1', name: 'Engineering & IT', code: 'ENG', head: 'Demo User', employees: 32, status: 'ACTIVE' },
    { id: 'dept-2', name: 'Sales & Business Development', code: 'SALES', head: 'Rahul Sharma', employees: 45, status: 'ACTIVE' },
    { id: 'dept-3', name: 'Human Resources & Operations', code: 'HR', head: 'Priya Singh', employees: 12, status: 'ACTIVE' },
    { id: 'dept-4', name: 'Finance & Accounts', code: 'FIN', head: 'Vikram Mehta', employees: 18, status: 'ACTIVE' },
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-900 via-emerald-800 to-slate-900 p-6 sm:p-8 rounded-3xl text-white shadow-lg border border-emerald-800">
        <div>
          <div className="flex items-center gap-2 text-emerald-300 font-extrabold text-xs uppercase tracking-wider mb-1">
            <Building2 className="w-4 h-4 text-emerald-400" /> HRM DEPARTMENT MANAGEMENT
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
            Custom Departments
          </h1>
          <p className="text-xs md:text-sm text-slate-200 mt-1 font-medium">
            Configure tenant organizational departments, assign department heads, and manage workforce structures.
          </p>
        </div>

        <Link
          href="/departments/create"
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold transition-all shadow-md cursor-pointer self-start md:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Department
        </Link>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-50 text-slate-500 font-extrabold uppercase border-b border-slate-100">
            <tr>
              <th className="p-4">Department Name</th>
              <th className="p-4">Code</th>
              <th className="p-4">Department Head</th>
              <th className="p-4">Assigned Staff</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {departments.map((d) => (
              <tr key={d.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="p-4 font-bold text-slate-900">{d.name}</td>
                <td className="p-4 font-bold text-emerald-700">{d.code}</td>
                <td className="p-4 text-slate-800">{d.head}</td>
                <td className="p-4 text-slate-600">{d.employees} Employees</td>
                <td className="p-4">
                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold rounded-lg text-[10px] border border-emerald-200">
                    {d.status}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <Link
                    href={`/departments/${d.id}/edit`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 rounded-xl text-xs font-bold transition-all"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
