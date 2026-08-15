'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Banknote, Plus, Edit, DollarSign } from 'lucide-react';

interface SalaryStructure {
  id: string;
  employeeName: string;
  employeeId: string;
  baseSalary: number;
  grossSalary: number;
  netSalary: number;
  effectiveDate: string;
  status: 'ACTIVE';
}

const mockStructures: SalaryStructure[] = [
  { id: '1', employeeName: 'Rahul Sharma', employeeId: 'EMP001', baseSalary: 45000, grossSalary: 70000, netSalary: 61000, effectiveDate: '2026-01-01', status: 'ACTIVE' },
  { id: '2', employeeName: 'Priya Singh', employeeId: 'EMP002', baseSalary: 65000, grossSalary: 100000, netSalary: 85000, effectiveDate: '2026-01-01', status: 'ACTIVE' },
];

export default function SalaryStructuresPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Salary Structures & CTC Profiles</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">Configure employee compensation packages, basic salary, HRA, and tax deductions.</p>
        </div>

        <div className="flex gap-3">
          <Link href="/salary/components" className="px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs">
            Manage Components
          </Link>
          <Link href="/salary/1/edit" className="px-4 py-2.5 bg-indigo-600 text-white font-bold rounded-xl text-xs shadow-md">
            + New Structure
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Employee</th>
                <th className="py-3.5 px-4">Base Salary</th>
                <th className="py-3.5 px-4">Gross CTC</th>
                <th className="py-3.5 px-4">Net Take-Home</th>
                <th className="py-3.5 px-4">Effective Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {mockStructures.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4">
                    <p className="font-bold text-slate-900">{s.employeeName}</p>
                    <p className="text-[11px] text-indigo-600 font-bold">{s.employeeId}</p>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-800">₹{s.baseSalary.toLocaleString('en-IN')}</td>
                  <td className="py-3.5 px-4 font-extrabold text-emerald-600">₹{s.grossSalary.toLocaleString('en-IN')}</td>
                  <td className="py-3.5 px-4 font-extrabold text-indigo-600">₹{s.netSalary.toLocaleString('en-IN')}</td>
                  <td className="py-3.5 px-4 text-slate-500 font-medium">{s.effectiveDate}</td>
                  <td className="py-3.5 px-4 text-right">
                    <Link href={`/salary/${s.id}/edit`} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-indigo-600 inline-block">
                      <Edit className="w-4 h-4" />
                    </Link>
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
