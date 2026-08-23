'use client';

import React, { useState } from 'react';
import { BarChart3, Download, FileSpreadsheet, FileText, Calendar, Users, DollarSign, RefreshCw, CheckCircle } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';
import { getErrorMessage } from '@/lib/utils';

export default function ReportsPage() {
  const [downloadingType, setDownloadingType] = useState<string | null>(null);

  const handleExport = async (reportType: string, format: 'CSV' | 'PDF' = 'CSV') => {
    try {
      setDownloadingType(`${reportType}-${format}`);
      const res = await api.post('/reports/export', { reportType, format });
      const data = res.data?.data || res.data;

      if (data?.data) {
        // Trigger browser file download
        const blob = new Blob([data.data], { type: format === 'CSV' ? 'text/csv;charset=utf-8;' : 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', data.filename || `report_${reportType.toLowerCase()}.${format.toLowerCase()}`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success(`${reportType} report exported successfully (${data.rowsCount || 0} rows)`);
      } else {
        toast.success(`${reportType} report exported successfully`);
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDownloadingType(null);
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-16 text-slate-800 animate-in fade-in-50 duration-200">
      {/* Top Hero Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-slate-700/60 shadow-xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-[#23C45E]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-[#23C45E] border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-[#23C45E] animate-pulse" />
                Live Data & Audit Export Engine
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Reports & Data Export Center
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-2xl leading-relaxed">
              Generate structured, audit-ready dataset exports across attendance records, payroll slips, leave requests, and employee rosters.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => handleExport('ATTENDANCE', 'CSV')}
              disabled={downloadingType !== null}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#23C45E] hover:bg-[#1AA14D] text-slate-950 font-black rounded-2xl text-xs shadow-md shadow-[#23C45E]/20 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {downloadingType === 'ATTENDANCE-CSV' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              <span>Export Master Attendance</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Attendance Summary */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Attendance Records</h3>
              <p className="text-xs text-slate-500 mt-1">Export employee punch timestamps, working hours, and location tags.</p>
            </div>
          </div>
          <div className="pt-2 flex gap-2">
            <button
              onClick={() => handleExport('ATTENDANCE', 'CSV')}
              disabled={downloadingType !== null}
              className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {downloadingType === 'ATTENDANCE-CSV' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} CSV Export
            </button>
          </div>
        </div>

        {/* Payroll & Salary Ledger */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Payroll & Salary Ledger</h3>
              <p className="text-xs text-slate-500 mt-1">Detailed breakdown of gross earnings, PF, TDS deductions, and net salary payouts.</p>
            </div>
          </div>
          <div className="pt-2 flex gap-2">
            <button
              onClick={() => handleExport('PAYROLL', 'CSV')}
              disabled={downloadingType !== null}
              className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {downloadingType === 'PAYROLL-CSV' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} CSV Export
            </button>
          </div>
        </div>

        {/* Leave Requests */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Leave & Holiday Audit</h3>
              <p className="text-xs text-slate-500 mt-1">Historical leave requests, approval logs, leave balance adjustments, and dates.</p>
            </div>
          </div>
          <div className="pt-2 flex gap-2">
            <button
              onClick={() => handleExport('LEAVES', 'CSV')}
              disabled={downloadingType !== null}
              className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {downloadingType === 'LEAVES-CSV' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} CSV Export
            </button>
          </div>
        </div>

        {/* Employee Directory */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Employee Master Directory</h3>
              <p className="text-xs text-slate-500 mt-1">Full personnel roster with department, designation, branch, and contact details.</p>
            </div>
          </div>
          <div className="pt-2 flex gap-2">
            <button
              onClick={() => handleExport('EMPLOYEES', 'CSV')}
              disabled={downloadingType !== null}
              className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {downloadingType === 'EMPLOYEES-CSV' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} CSV Export
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
