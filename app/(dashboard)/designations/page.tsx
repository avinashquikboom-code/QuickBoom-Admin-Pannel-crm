'use client';

import React, { useState } from 'react';
import { Award, Plus, Building2, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function DesignationsPage() {
  const [designations, setDesignations] = useState([
    { id: 'des-1', title: 'Senior Software Engineer', code: 'SR-ENG', department: 'Engineering & IT', level: 'Level 4', status: 'ACTIVE' },
    { id: 'des-2', title: 'DevOps & Cloud Specialist', code: 'DEVOPS', department: 'Engineering & IT', level: 'Level 4', status: 'ACTIVE' },
    { id: 'des-3', title: 'Regional Sales Manager', code: 'RSM', department: 'Sales & BD', level: 'Level 5', status: 'ACTIVE' },
    { id: 'des-4', title: 'HR Operations Lead', code: 'HR-LEAD', department: 'Human Resources & Operations', level: 'Level 4', status: 'ACTIVE' },
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-900 via-emerald-800 to-slate-900 p-6 sm:p-8 rounded-3xl text-white shadow-lg border border-emerald-800">
        <div>
          <div className="flex items-center gap-2 text-emerald-300 font-extrabold text-xs uppercase tracking-wider mb-1">
            <Award className="w-4 h-4 text-emerald-400" /> HRM DESIGNATION MANAGEMENT
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
            Custom Designations & Job Titles
          </h1>
          <p className="text-xs md:text-sm text-slate-200 mt-1 font-medium">
            Define role hierarchy levels, job designations, and department linkage.
          </p>
        </div>

        <button
          onClick={() => toast.success('Add Designation modal opened')}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold transition-all shadow-md cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Designation
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-50 text-slate-500 font-extrabold uppercase border-b border-slate-100">
            <tr>
              <th className="p-3.5">Designation Title</th>
              <th className="p-3.5">Code</th>
              <th className="p-3.5">Department</th>
              <th className="p-3.5">Level</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {designations.map((d) => (
              <tr key={d.id} className="hover:bg-slate-50/50">
                <td className="p-3.5 font-bold text-slate-900">{d.title}</td>
                <td className="p-3.5 font-bold text-emerald-700">{d.code}</td>
                <td className="p-3.5 text-slate-800">{d.department}</td>
                <td className="p-3.5 text-slate-600">{d.level}</td>
                <td className="p-3.5">
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded-md text-[10px]">
                    {d.status}
                  </span>
                </td>
                <td className="p-3.5">
                  <button onClick={() => toast(`Editing ${d.title}`)} className="text-emerald-700 font-bold hover:underline">
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
