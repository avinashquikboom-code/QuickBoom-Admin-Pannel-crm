'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 p-4 font-sans text-slate-800">
      <div className="w-full max-w-md bg-white border border-slate-200/80 rounded-3xl p-8 text-center space-y-6 shadow-sm">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 border border-emerald-200/80 shadow-xs mx-auto">
          <Search className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 font-mono font-bold text-xs rounded-full border border-emerald-200">
            HTTP 404 ERROR
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight pt-2">Page Not Found</h1>
          <p className="text-xs text-slate-500 font-medium">
            The requested screen or resource does not exist or has been relocated.
          </p>
        </div>

        <div className="pt-2">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
