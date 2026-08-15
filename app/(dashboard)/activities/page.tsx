'use client';

import React from 'react';
import Link from 'next/link';
import { Activity, PhoneCall, Mail, Calendar, MessageSquare } from 'lucide-react';

interface ActivityItem {
  id: string;
  type: 'CALL' | 'EMAIL' | 'MEETING' | 'NOTE';
  subject: string;
  performedBy: string;
  relatedTo: string;
  timestamp: string;
}

const mockActivities: ActivityItem[] = [
  { id: '1', type: 'CALL', subject: 'Discovery call with Apex Tech CTO', performedBy: 'Rahul Sharma', relatedTo: 'Apex Tech Solutions', timestamp: 'Today, 10:30 AM' },
  { id: '2', type: 'MEETING', subject: 'Product Demo & Proposal Review', performedBy: 'Sneha Gupta', relatedTo: 'Acme Enterprises', timestamp: 'Today, 11:45 AM' },
  { id: '3', type: 'EMAIL', subject: 'Sent updated Q3 enterprise contract terms', performedBy: 'Amit Verma', relatedTo: 'Innovate Digital', timestamp: 'Yesterday, 04:20 PM' },
];

export default function ActivitiesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">CRM Activities & Log Stream</h1>
        <p className="text-xs text-slate-500 mt-1 font-medium">Record of all client calls, emails, demos, and meeting notes.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
        {mockActivities.map((act) => (
          <div key={act.id} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-4 text-xs">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">{act.subject}</h3>
                <p className="text-slate-500 font-medium">{act.performedBy} • Related to {act.relatedTo}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="font-semibold text-slate-400">{act.timestamp}</span>
              <Link href={`/activities/${act.id}`} className="px-3 py-1 bg-slate-100 text-slate-700 font-bold rounded-lg hover:bg-slate-200">
                View Log
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
