'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Edit,
  Mail,
  Phone,
  Building2,
  Calendar,
  ShieldCheck,
  CheckCircle,
  Banknote,
  FileSpreadsheet,
  Download,
  Clock,
  Laptop,
  Activity,
  FileText,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

type EmployeeTab = 'overview' | 'attendance' | 'leave' | 'remote' | 'visits' | 'payroll' | 'documents' | 'activity';

export default function EmployeeDetailPage() {
  const params = useParams();
  const id = (params?.id as string) || 'EMP001';
  const [activeTab, setActiveTab] = useState<EmployeeTab>('overview');

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/employees" className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Employee Profile</h1>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">Employee Code: {id}</p>
          </div>
        </div>

        <Link
          href={`/employees/${id}/edit`}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md"
        >
          <Edit className="w-4 h-4" /> Edit Profile
        </Link>
      </div>

      {/* Header Profile Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-bold text-xl flex items-center justify-center shadow-md">
            DU
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">Demo User</h2>
            <p className="text-xs text-emerald-700 font-bold">EMP001 • Senior Software Engineer</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle className="w-3 h-3 text-emerald-600" /> ACTIVE
              </span>
              <span className="text-xs text-slate-500 font-medium">Head Office (Bandra)</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-2xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Department</span>
            <p className="font-bold text-slate-900">Engineering & IT</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-2xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Manager</span>
            <p className="font-bold text-slate-900">Rahul Sharma</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-2xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Joining Date</span>
            <p className="font-bold text-slate-900">15 Jan 2024</p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1 border-b border-slate-200 pb-2 overflow-x-auto">
        {(['overview', 'attendance', 'leave', 'remote', 'visits', 'payroll', 'documents', 'activity'] as EmployeeTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-4 py-2 text-xs font-bold rounded-xl capitalize transition-all ${
              activeTab === t ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 space-y-4 text-xs">
          <h3 className="font-extrabold text-slate-900 text-sm">Personal & Contact Details</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div><span className="text-slate-400">Email:</span> <p className="font-bold text-slate-800">demo.user@quikboom.com</p></div>
            <div><span className="text-slate-400">Mobile:</span> <p className="font-bold text-slate-800">+91 98765 43210</p></div>
            <div><span className="text-slate-400">Employment Type:</span> <p className="font-bold text-slate-800">Full-Time Permanent</p></div>
            <div><span className="text-slate-400">Emergency Contact:</span> <p className="font-bold text-slate-800">+91 98765 00000</p></div>
          </div>
        </div>
      )}

      {/* Payroll Tab */}
      {activeTab === 'payroll' && (
        <div className="space-y-6 text-xs">
          {/* Current Salary Structure */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <Banknote className="w-4 h-4 text-emerald-600" /> Current Configured Salary Structure
              </h3>
              <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 font-extrabold rounded-md text-[10px]">
                ACTIVE
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3 bg-slate-50 rounded-xl"><span className="text-[10px] text-slate-400 uppercase font-bold">Basic Salary</span><p className="font-bold text-slate-900 text-sm">₹45,000</p></div>
              <div className="p-3 bg-slate-50 rounded-xl"><span className="text-[10px] text-slate-400 uppercase font-bold">HRA</span><p className="font-bold text-slate-900 text-sm">₹18,000</p></div>
              <div className="p-3 bg-slate-50 rounded-xl"><span className="text-[10px] text-slate-400 uppercase font-bold">Allowances</span><p className="font-bold text-slate-900 text-sm">₹12,000</p></div>
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl"><span className="text-[10px] text-emerald-800 uppercase font-bold">Gross Salary</span><p className="font-black text-emerald-800 text-sm">₹75,000</p></div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3 bg-slate-50 rounded-xl"><span className="text-[10px] text-slate-400 uppercase font-bold">PF Deduction</span><p className="font-bold text-rose-600">₹5,400</p></div>
              <div className="p-3 bg-slate-50 rounded-xl"><span className="text-[10px] text-slate-400 uppercase font-bold">TDS Tax</span><p className="font-bold text-rose-600">₹2,600</p></div>
              <div className="p-3 bg-slate-50 rounded-xl"><span className="text-[10px] text-slate-400 uppercase font-bold">Total Deductions</span><p className="font-bold text-rose-600">₹8,000</p></div>
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl"><span className="text-[10px] text-indigo-800 uppercase font-bold">Net Payout</span><p className="font-black text-indigo-800 text-sm">₹67,000</p></div>
            </div>
          </div>

          {/* Salary Slips & History */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="font-extrabold text-slate-900 text-sm">Salary Slips & Disbursement History</h3>
            <div className="space-y-2">
              {[
                { month: 'August 2026', slip: 'SLIP-202608-EMP001', net: '₹67,000', status: 'PAID' },
                { month: 'July 2026', slip: 'SLIP-202607-EMP001', net: '₹67,000', status: 'PAID' },
                { month: 'June 2026', slip: 'SLIP-202606-EMP001', net: '₹67,000', status: 'PAID' },
              ].map((s, idx) => (
                <div key={idx} className="p-3.5 bg-slate-50 rounded-2xl flex items-center justify-between border border-slate-100">
                  <div>
                    <p className="font-bold text-slate-900">{s.month}</p>
                    <p className="text-[10px] text-slate-400">{s.slip} • Net Payout: {s.net}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 font-bold text-[10px] rounded-md">{s.status}</span>
                    <button onClick={() => toast.success(`Downloading PDF for ${s.month}...`)} className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl flex items-center gap-1">
                      <Download className="w-3.5 h-3.5 text-emerald-600" /> PDF Slip
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
