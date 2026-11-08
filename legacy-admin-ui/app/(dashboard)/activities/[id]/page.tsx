'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Activity } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin';

export default function ActivityDetailPage() {
  const params = useParams();
  const id = params?.id || '1';

  return (
    <div className="space-y-6 max-w-2xl">
      <AdminPageHeader
        title={`Activity Log Record (#${id})`}
        description="Logged interaction parameters."
        icon={Activity}
        breadcrumbs={[
          { label: 'Activities', href: '/activities' },
          { label: `Activity #${id}` },
        ]}
      />

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-8 space-y-4 text-xs">
        <h2 className="text-base font-extrabold text-slate-900">Discovery call with Apex Tech CTO</h2>
        <p className="text-slate-500 font-medium">Performed by Rahul Sharma • Related to Apex Tech Solutions</p>
      </div>
    </div>
  );
}
