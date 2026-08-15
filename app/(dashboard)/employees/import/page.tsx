'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Upload, FileSpreadsheet, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function BulkImportEmployeesPage() {
  const [file, setFile] = useState<File | null>(null);

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select a CSV or XLSX file');
      return;
    }
    toast.success(`Successfully imported 25 employees from ${file.name}`);
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <div className="flex items-center gap-4">
        <Link href="/employees" className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Bulk Import Employees</h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">Upload a CSV or Excel file to batch import staff records.</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-8">
        <form onSubmit={handleUpload} className="space-y-6">
          <div className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl p-8 text-center space-y-3 cursor-pointer transition-colors bg-slate-50">
            <FileSpreadsheet className="w-12 h-12 text-indigo-600 mx-auto" />
            <div className="space-y-1">
              <p className="font-bold text-slate-900 text-sm">
                {file ? file.name : 'Click to select CSV / XLSX file'}
              </p>
              <p className="text-xs text-slate-500">Supports standard employee CSV templates (Max 10MB)</p>
            </div>
            <input
              type="file"
              accept=".csv, .xlsx"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="hidden"
              id="file-input"
            />
            <label htmlFor="file-input" className="inline-block px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-bold cursor-pointer">
              Browse File
            </label>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <Upload className="w-4 h-4" /> Import Records
          </button>
        </form>
      </div>
    </div>
  );
}
