'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Banknote,
  FileSpreadsheet,
  Zap,
  Download,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Play,
  CheckCircle,
  Send,
  Building2,
  Filter,
  Plus,
  Sliders,
  FileText,
  Printer,
  Share2,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { toast } from 'react-hot-toast';

type PayrollSubmodule = 'dashboard' | 'processing' | 'structures' | 'history' | 'slips' | 'settings';

interface SalaryStructureItem {
  id: string;
  employeeCode: string;
  employeeName: string;
  department: string;
  basic: number;
  hra: number;
  allowances: number;
  gross: number;
  pf: number;
  tax: number;
  net: number;
  status: 'ACTIVE' | 'INACTIVE';
}

const mockStructures: SalaryStructureItem[] = [
  { id: 'st-1', employeeCode: 'EMP001', employeeName: 'Avinash Magar', department: 'Engineering', basic: 45000, hra: 18000, allowances: 12000, gross: 75000, pf: 5400, tax: 2600, net: 67000, status: 'ACTIVE' },
  { id: 'st-2', employeeCode: 'EMP002', employeeName: 'Rahul Sharma', department: 'Sales', basic: 35000, hra: 14000, allowances: 11000, gross: 60000, pf: 4200, tax: 1800, net: 54000, status: 'ACTIVE' },
  { id: 'st-3', employeeCode: 'EMP003', employeeName: 'Priya Singh', employeeName2: 'Priya Singh', department: 'HR', basic: 40000, hra: 16000, allowances: 9000, gross: 65000, pf: 4800, tax: 2200, net: 58000, status: 'ACTIVE' } as any,
];

const mockHistory = [
  { id: 'pr-1', month: 'August 2026', totalEmp: 250, gross: 17500000, deductions: 2250000, net: 15250000, status: 'PAID', date: '15 Aug 2026' },
  { id: 'pr-2', month: 'July 2026', totalEmp: 248, gross: 17360000, deductions: 2210000, net: 15150000, status: 'PAID', date: '31 Jul 2026' },
  { id: 'pr-3', month: 'June 2026', totalEmp: 245, gross: 17150000, deductions: 2180000, net: 14970000, status: 'PAID', date: '30 Jun 2026' },
];

const payrollBreakdownData = [
  { name: 'Basic Salary', value: 9500000, color: '#0F766E' },
  { name: 'HRA & Allowances', value: 5500000, color: '#14B8A6' },
  { name: 'PF & ESI', value: 1200000, color: '#F59E0B' },
  { name: 'TDS Tax', value: 1050000, color: '#EF4444' },
];

export default function PayrollPage() {
  const [activeTab, setActiveTab] = useState<PayrollSubmodule>('dashboard');
  const [selectedMonth, setSelectedMonth] = useState('August');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedDept, setSelectedDept] = useState('All');
  const [processingStatus, setProcessingStatus] = useState<string>('DRAFT');

  // Client-side mount flag for Recharts & browser safety
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Policy Settings State
  const [workingDays, setWorkingDays] = useState(30);
  const [overtimeRate, setOvertimeRate] = useState(1.5);
  const [pfRate, setPfRate] = useState(12);

  const handleCalculatePayroll = () => {
    setProcessingStatus('CALCULATED');
    toast.success('Payroll calculated successfully for active employees!');
  };

  const handleApprovePayroll = () => {
    setProcessingStatus('APPROVED');
    toast.success('Payroll approved by HR Finance Admin.');
  };

  const handleGeneratePayroll = () => {
    setProcessingStatus('GENERATED');
    toast.success('Salary slips batch generated successfully!');
  };

  const handleDisbursePayroll = () => {
    setProcessingStatus('PAID');
    toast.success('Salary disbursed to employee bank accounts!');
  };

  return (
    <div className="space-y-8">
      {/* Title Header Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-900 via-emerald-800 to-slate-900 p-6 sm:p-8 rounded-3xl text-white shadow-lg border border-emerald-800">
        <div>
          <div className="flex items-center gap-2 text-emerald-300 font-extrabold text-xs uppercase tracking-wider mb-1">
            <Banknote className="w-4 h-4 text-emerald-400" /> CONSOLIDATED PAYROLL MANAGEMENT SYSTEM
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
            Enterprise Payroll Module
          </h1>
          <p className="text-xs md:text-sm text-slate-200 mt-1 font-medium">
            Manage employee salary structures, monthly payroll processing, tax deductions, and salary slips.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('processing')}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold transition-all shadow-md cursor-pointer"
          >
            <Zap className="w-4 h-4" /> Run Payroll Processing
          </button>
        </div>
      </div>

      {/* Submodule Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'dashboard' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Payroll Dashboard
        </button>
        <button
          onClick={() => setActiveTab('processing')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'processing' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Payroll Processing
        </button>
        <button
          onClick={() => setActiveTab('structures')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'structures' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Salary Structures
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'history' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Payroll History
        </button>
        <button
          onClick={() => setActiveTab('slips')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'slips' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Salary Slips
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'settings' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Payroll Settings
        </button>
      </div>

      {/* Submodule 1: Payroll Dashboard */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Top Metrics Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[10px] font-extrabold uppercase text-slate-400">Total Employees</span>
              <p className="text-2xl font-black text-slate-900 mt-1">250</p>
              <span className="text-[11px] font-bold text-emerald-600">Active Workforce</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[10px] font-extrabold uppercase text-slate-400">Gross Salary Payout</span>
              <p className="text-xl font-black text-slate-900 mt-1">₹1,75,00,000</p>
              <span className="text-[11px] font-bold text-slate-500">August 2026</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[10px] font-extrabold uppercase text-slate-400">Total Deductions</span>
              <p className="text-xl font-black text-rose-600 mt-1">₹22,50,000</p>
              <span className="text-[11px] font-bold text-slate-500">PF, ESI, TDS Tax</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[10px] font-extrabold uppercase text-slate-400">Net Payroll Disbursed</span>
              <p className="text-xl font-black text-emerald-700 mt-1">₹1,52,50,000</p>
              <span className="text-[11px] font-bold text-emerald-600">Net Payout</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[10px] font-extrabold uppercase text-slate-400">Current Status</span>
              <p className="text-lg font-black text-emerald-600 mt-1">{processingStatus}</p>
              <span className="text-[11px] font-bold text-slate-500">August 2026 Run</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[10px] font-extrabold uppercase text-slate-400">Pending Approvals</span>
              <p className="text-2xl font-black text-amber-600 mt-1">0</p>
              <span className="text-[11px] font-bold text-emerald-600">All Approved</span>
            </div>
          </div>

          {/* Payroll Visual Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
              <h3 className="text-sm font-extrabold text-slate-900 mb-4">Gross vs Net Monthly Trend</h3>
              <div className="h-64">
                {isMounted ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={mockHistory}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="gross" fill="#0F766E" radius={[6, 6, 0, 0]} name="Gross Salary" />
                      <Bar dataKey="net" fill="#14B8A6" radius={[6, 6, 0, 0]} name="Net Salary" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full bg-slate-50 animate-pulse rounded-xl" />
                )}
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
              <h3 className="text-sm font-extrabold text-slate-900 mb-4">Earnings & Deductions Distribution</h3>
              <div className="h-64 flex items-center justify-center">
                {isMounted ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={payrollBreakdownData} innerRadius={60} outerRadius={85} paddingAngle={4} dataKey="value">
                        {payrollBreakdownData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full w-full bg-slate-50 animate-pulse rounded-xl" />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Submodule 2: Payroll Processing */}
      {activeTab === 'processing' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Payroll Cycle Processing Engine</h3>
                <p className="text-xs text-slate-500">Filter, preview, calculate, approve, generate, and disburse payroll batch.</p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                >
                  <option value="August">August</option>
                  <option value="July">July</option>
                  <option value="June">June</option>
                </select>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                >
                  <option value="2026">2026</option>
                  <option value="2025">2025</option>
                </select>
              </div>
            </div>

            {/* Workflow Action Steps */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
              <button
                onClick={handleCalculatePayroll}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer"
              >
                <Play className="w-4 h-4" /> 1. Calculate Payroll
              </button>
              <button
                onClick={handleApprovePayroll}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-indigo-700 hover:bg-indigo-800 text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer"
              >
                <CheckCircle className="w-4 h-4" /> 2. Approve Batch
              </button>
              <button
                onClick={handleGeneratePayroll}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer"
              >
                <FileText className="w-4 h-4" /> 3. Generate Slips
              </button>
              <button
                onClick={handleDisbursePayroll}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer"
              >
                <Send className="w-4 h-4" /> 4. Disburse Payout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submodule 3: Salary Structures */}
      {activeTab === 'structures' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 text-sm">Active Salary Structures</h3>
            <button className="px-3 py-1.5 bg-emerald-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Configure New Structure
            </button>
          </div>
          <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 font-extrabold uppercase border-b border-slate-100">
              <tr>
                <th className="p-3">Employee</th>
                <th className="p-3">Department</th>
                <th className="p-3">Basic</th>
                <th className="p-3">HRA</th>
                <th className="p-3">Allowances</th>
                <th className="p-3">Gross</th>
                <th className="p-3">PF</th>
                <th className="p-3">TDS</th>
                <th className="p-3">Net Salary</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {mockStructures.map((st) => (
                <tr key={st.id} className="hover:bg-slate-50/50">
                  <td className="p-3 font-bold text-slate-900">{st.employeeName} ({st.employeeCode})</td>
                  <td className="p-3 text-slate-600">{st.department}</td>
                  <td className="p-3 text-slate-800">₹{st.basic.toLocaleString('en-IN')}</td>
                  <td className="p-3 text-slate-800">₹{st.hra.toLocaleString('en-IN')}</td>
                  <td className="p-3 text-slate-800">₹{st.allowances.toLocaleString('en-IN')}</td>
                  <td className="p-3 font-bold text-slate-900">₹{st.gross.toLocaleString('en-IN')}</td>
                  <td className="p-3 text-rose-600">₹{st.pf.toLocaleString('en-IN')}</td>
                  <td className="p-3 text-rose-600">₹{st.tax.toLocaleString('en-IN')}</td>
                  <td className="p-3 font-black text-emerald-700">₹{st.net.toLocaleString('en-IN')}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-extrabold rounded-md text-[10px]">
                      {st.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* Submodule 4: Payroll History */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-900 text-sm">Monthly Payroll Audit History</h3>
          </div>
          <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 font-extrabold uppercase border-b border-slate-100">
              <tr>
                <th className="p-3">Pay Period</th>
                <th className="p-3">Employees</th>
                <th className="p-3">Gross Payout</th>
                <th className="p-3">Total Deductions</th>
                <th className="p-3">Net Disbursed</th>
                <th className="p-3">Status</th>
                <th className="p-3">Disbursed Date</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {mockHistory.map((h) => (
                <tr key={h.id} className="hover:bg-slate-50/50">
                  <td className="p-3 font-bold text-slate-900">{h.month}</td>
                  <td className="p-3 text-slate-600">{h.totalEmp} Staff</td>
                  <td className="p-3 font-bold text-slate-900">₹{h.gross.toLocaleString('en-IN')}</td>
                  <td className="p-3 text-rose-600">₹{h.deductions.toLocaleString('en-IN')}</td>
                  <td className="p-3 font-black text-emerald-700">₹{h.net.toLocaleString('en-IN')}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-extrabold rounded-md text-[10px]">
                      {h.status}
                    </span>
                  </td>
                  <td className="p-3 text-slate-500">{h.date}</td>
                  <td className="p-3">
                    <button className="text-emerald-700 font-bold hover:underline">View Audit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* Submodule 5: Salary Slips */}
      {activeTab === 'slips' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">Salary Slips & PDF Dispersal</h3>
              <p className="text-xs text-slate-500">Generate, print, download, and share monthly employee salary slips.</p>
            </div>

            <div className="flex gap-3">
              <Link href="/salary-slips/bulk-generate" className="px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl flex items-center gap-2">
                <Zap className="w-3.5 h-3.5" /> Batch Generate Slips
              </Link>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800">August 2026 Salary Slips (250 Slips Ready)</span>
            <div className="flex gap-2">
              <button onClick={() => toast.success('Printing PDF batch...')} className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-lg flex items-center gap-1">
                <Printer className="w-3.5 h-3.5" /> Print All
              </button>
              <button onClick={() => toast.success('Downloading ZIP bundle...')} className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-lg flex items-center gap-1">
                <Download className="w-3.5 h-3.5" /> Download ZIP
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submodule 6: Payroll Settings */}
      {activeTab === 'settings' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
          <h3 className="font-extrabold text-slate-900 text-sm">Tenant Payroll Policy Parameters</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Working Days per Month</label>
              <input
                type="number"
                value={workingDays}
                onChange={(e) => setWorkingDays(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Overtime Multiplier</label>
              <input
                type="number"
                step="0.1"
                value={overtimeRate}
                onChange={(e) => setOvertimeRate(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Provident Fund (PF %)</label>
              <input
                type="number"
                value={pfRate}
                onChange={(e) => setPfRate(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={() => toast.success('Payroll policy parameters updated successfully!')}
              className="px-5 py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl cursor-pointer"
            >
              Save Policy Configuration
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
