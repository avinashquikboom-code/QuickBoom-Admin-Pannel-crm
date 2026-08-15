'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Activity } from 'lucide-react';

export default function ActivityDetailPage() {
  const params = useParams();
  const id = params?.id || '1';

  return (
    <div className="space-y-8 max-w-2xl">
      <div className="flex items-center gap-4">
        <Link href="/activities" className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Activity Log Record (#{id})</h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">Logged interaction parameters.</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-8 space-y-4 text-xs">
        <h2 className="text-base font-extrabold text-slate-900">Discovery call with Apex Tech CTO</h2>
        <p className="text-slate-500 font-medium">Performed by Rahul Sharma • Related to Apex Tech Solutions</p>
      </div>
    </div>
  );
}
