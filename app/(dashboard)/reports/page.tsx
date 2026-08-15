'use client';

import React from 'react';
import { BarChart3, Download, FileSpreadsheet, FileText, Calendar, Users, DollarSign } from 'lucide-react';

export default function ReportsPage() {
  return (
    <div className="space-y-8">
      {/* Top Title Card Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-900 via-emerald-800 to-slate-900 p-6 sm:p-8 rounded-3xl text-white shadow-lg border border-emerald-800">
        <div>
          <div className="flex items-center gap-2 text-emerald-300 font-extrabold text-xs uppercase tracking-wider mb-1">
            <BarChart3 className="w-4 h-4 text-emerald-400" /> SYSTEM ANALYTICS & AUDIT EXPORTS
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
            Reports & Analytics Export
          </h1>
          <p className="text-xs md:text-sm text-slate-200 mt-1 font-medium">
            Generate comprehensive audit, payroll, attendance, field visits, and sales performance reports in CSV or PDF formats.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold transition-all shadow-md cursor-pointer">
            <Download className="w-4 h-4" /> Export All Data
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Monthly Attendance Summary</h3>
            <p className="text-xs text-slate-500 mt-1">Export employee check-in times, working hours, and absent metrics.</p>
          </div>
          <div className="pt-2 flex gap-2">
            <button className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer">
              <Download className="w-3.5 h-3.5" /> CSV
            </button>
            <button className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer">
              <FileText className="w-3.5 h-3.5" /> PDF
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Payroll & Salary Ledger</h3>
            <p className="text-xs text-slate-500 mt-1">Detailed breakdown of gross earnings, PF, TDS deductions, and net salary payouts.</p>
          </div>
          <div className="pt-2 flex gap-2">
            <button className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer">
              <Download className="w-3.5 h-3.5" /> CSV
            </button>
            <button className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer">
              <FileText className="w-3.5 h-3.5" /> PDF
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Sales Lead Conversion Audit</h3>
            <p className="text-xs text-slate-500 mt-1">Pipeline velocity, deal win rate by representative, and revenue forecasts.</p>
          </div>
          <div className="pt-2 flex gap-2">
            <button className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer">
              <Download className="w-3.5 h-3.5" /> CSV
            </button>
            <button className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer">
              <FileText className="w-3.5 h-3.5" /> PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
