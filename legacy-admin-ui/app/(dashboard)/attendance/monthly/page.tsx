'use client';

import React from 'react';
import { Calendar, Download } from 'lucide-react';
import { AdminPageHeader, AdminButton } from '@/components/admin';

export default function MonthlyAttendancePage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Monthly Attendance Matrix"
        description="Monthly working days, leave counts, and overtime summary per employee."
        icon={Calendar}
        breadcrumbs={[
          { label: 'Attendance', href: '/attendance' },
          { label: 'Monthly Matrix' },
        ]}
        actions={
          <AdminButton
            variant="outline"
            size="md"
            icon={Download}
          >
            Export Matrix
          </AdminButton>
        }
      />

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
        <p className="text-xs font-bold text-slate-500">Monthly breakdown matrix view (August 2026)</p>
      </div>
    </div>
  );
}
