'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Award, Plus, Edit, Trash2 } from 'lucide-react';

interface Designation {
  id: string;
  name: string;
  code: string;
  department: string;
  level: number;
}

const mockDesignations: Designation[] = [
  { id: '1', name: 'Sales Manager', code: 'SM', department: 'Sales', level: 3 },
  { id: '2', name: 'Senior Fullstack Lead', code: 'SFL', department: 'Engineering', level: 4 },
  { id: '3', name: 'Digital Marketing Executive', code: 'DME', department: 'Marketing', level: 2 },
  { id: '4', name: 'Field Visit Supervisor', code: 'FVS', department: 'Operations', level: 3 },
  { id: '5', name: 'Payroll Accountant', code: 'PA', department: 'Finance', level: 2 },
];

export default function DesignationsPage() {
  const [items, setItems] = useState<Designation[]>(mockDesignations);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Designations & Job Titles</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">Manage organization job levels and role titles.</p>
        </div>

        <Link
          href="/designations/create"
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md"
        >
          <Plus className="w-4 h-4" /> Add Designation
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Job Title</th>
                <th className="py-3.5 px-4">Code</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4">Job Level</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {items.map((desig) => (
                <tr key={desig.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900">{desig.name}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-indigo-600">{desig.code}</td>
                  <td className="py-3.5 px-4 font-medium text-slate-700">{desig.department}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">Level {desig.level}</td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/designations/${desig.id}/edit`} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-indigo-600">
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button onClick={() => setItems(items.filter((i) => i.id !== desig.id))} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-rose-600">
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
    </div>
  );
}
