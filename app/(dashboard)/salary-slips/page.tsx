'use client';

import React, { useState } from 'react';
import { FileSpreadsheet, Printer, Download, Eye, Zap, DollarSign, Calendar, Building2 } from 'lucide-react';

interface SalarySlip {
  id: string;
  employeeName: string;
  employeeId: string;
  department: string;
  designation: string;
  monthYear: string;
  basicSalary: number;
  hra: number;
  allowances: number;
  pfDeduction: number;
  taxDeduction: number;
  grossSalary: number;
  netSalary: number;
  status: 'GENERATED' | 'PAID';
}

const mockSlips: SalarySlip[] = [
  {
    id: 'SLIP-2026-08-01',
    employeeName: 'Rahul Sharma',
    employeeId: 'EMP001',
    department: 'Sales',
    designation: 'Sales Manager',
    monthYear: 'August 2026',
    basicSalary: 45000,
    hra: 18000,
    allowances: 7000,
    pfDeduction: 5400,
    taxDeduction: 3600,
    grossSalary: 70000,
    netSalary: 61000,
    status: 'PAID',
  },
  {
    id: 'SLIP-2026-08-02',
    employeeName: 'Priya Singh',
    employeeId: 'EMP002',
    department: 'Engineering',
    designation: 'Senior Fullstack Lead',
    monthYear: 'August 2026',
    basicSalary: 65000,
    hra: 26000,
    allowances: 9000,
    pfDeduction: 7800,
    taxDeduction: 7200,
    grossSalary: 100000,
    netSalary: 85000,
    status: 'GENERATED',
  },
];

export default function SalarySlipsPage() {
  const [selectedSlip, setSelectedSlip] = useState<SalarySlip | null>(mockSlips[0]);

  return (
    <div className="space-y-8">
      {/* Top Title Card Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-900 via-emerald-800 to-slate-900 p-6 sm:p-8 rounded-3xl text-white shadow-lg border border-emerald-800">
        <div>
          <div className="flex items-center gap-2 text-emerald-300 font-extrabold text-xs uppercase tracking-wider mb-1">
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> PAYROLL & SALARY DISPERSAL
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
            Payroll & Salary Slips
          </h1>
          <p className="text-xs md:text-sm text-slate-200 mt-1 font-medium">
            Generate monthly payroll slips, calculate tax & PF deductions, and preview printable PDF payslips.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold transition-all shadow-md cursor-pointer">
            <Zap className="w-4 h-4" /> Bulk Generate Slips
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Slips List */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Employee Slips</h2>
          <div className="space-y-3">
            {mockSlips.map((slip) => (
              <div
                key={slip.id}
                onClick={() => setSelectedSlip(slip)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  selectedSlip?.id === slip.id
                    ? 'border-indigo-600 bg-indigo-50/50 shadow-md'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-indigo-600 font-mono">{slip.employeeId}</span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                    {slip.status}
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-sm mt-1">{slip.employeeName}</h3>
                <p className="text-xs text-slate-500 font-medium">{slip.designation} • {slip.department}</p>
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-400">Net Pay:</span>
                  <span className="text-slate-900">₹{slip.netSalary.toLocaleString('en-IN')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Printable Slip Preview Card */}
        {selectedSlip && (
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/90 shadow-lg p-8 space-y-6">
            {/* Header / Brand */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black">
                  QB
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 tracking-tight">QUIKBOOM TECHNOLOGIES PVT LTD</h2>
                  <p className="text-xs text-slate-500 font-medium">Payslip for the month of {selectedSlip.monthYear}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs"
                >
                  <Printer className="w-4 h-4" /> Print / Save PDF
                </button>
              </div>
            </div>

            {/* Employee Metadata */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Employee Name</span>
                <p className="font-bold text-slate-900 mt-0.5">{selectedSlip.employeeName}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Employee ID</span>
                <p className="font-bold text-indigo-600 mt-0.5">{selectedSlip.employeeId}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Department</span>
                <p className="font-bold text-slate-900 mt-0.5">{selectedSlip.department}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Designation</span>
                <p className="font-bold text-slate-900 mt-0.5">{selectedSlip.designation}</p>
              </div>
            </div>

            {/* Salary Components Breakdown Table */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Earnings */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <div className="bg-emerald-50 px-4 py-2.5 border-b border-slate-200 font-bold text-emerald-800 text-xs uppercase tracking-wider">
                  Earnings (+)
                </div>
                <div className="p-4 space-y-3 text-xs">
                  <div className="flex justify-between font-medium">
                    <span className="text-slate-600">Basic Salary</span>
                    <span className="font-bold text-slate-900">₹{selectedSlip.basicSalary.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span className="text-slate-600">House Rent Allowance (HRA)</span>
                    <span className="font-bold text-slate-900">₹{selectedSlip.hra.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span className="text-slate-600">Special Allowances</span>
                    <span className="font-bold text-slate-900">₹{selectedSlip.allowances.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="pt-3 border-t border-slate-100 flex justify-between font-extrabold text-emerald-700">
                    <span>Gross Earnings</span>
                    <span>₹{selectedSlip.grossSalary.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Deductions */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <div className="bg-rose-50 px-4 py-2.5 border-b border-slate-200 font-bold text-rose-800 text-xs uppercase tracking-wider">
                  Deductions (-)
                </div>
                <div className="p-4 space-y-3 text-xs">
                  <div className="flex justify-between font-medium">
                    <span className="text-slate-600">Provident Fund (PF)</span>
                    <span className="font-bold text-slate-900">₹{selectedSlip.pfDeduction.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span className="text-slate-600">Income Tax (TDS)</span>
                    <span className="font-bold text-slate-900">₹{selectedSlip.taxDeduction.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="pt-3 border-t border-slate-100 flex justify-between font-extrabold text-rose-700">
                    <span>Total Deductions</span>
                    <span>₹{(selectedSlip.pfDeduction + selectedSlip.taxDeduction).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Net Payable Highlight */}
            <div className="p-5 bg-gradient-to-r from-indigo-900 to-slate-900 rounded-2xl text-white flex items-center justify-between shadow-md">
              <div>
                <p className="text-xs font-bold text-indigo-300 uppercase tracking-wider">Total Net Payable</p>
                <p className="text-2xl font-black mt-0.5">₹{selectedSlip.netSalary.toLocaleString('en-IN')}</p>
              </div>
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 font-bold text-xs rounded-full border border-emerald-500/30">
                Direct Deposit Verified
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
