'use client';

import React from 'react';
import Link from 'next/link';
import { Activity, PhoneCall, Mail, Calendar, MessageSquare, Plus } from 'lucide-react';
import { toast } from 'react-hot-toast';

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
  { id: '4', type: 'NOTE', subject: 'Client requested follow-up meeting after board review', performedBy: 'Priya Singh', relatedTo: 'Reliance Hub', timestamp: 'Yesterday, 06:10 PM' },
];

export default function ActivitiesPage() {
  return (
    <div className="space-y-8">
      {/* Header Title Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-900 via-emerald-800 to-slate-900 p-6 sm:p-8 rounded-3xl text-white shadow-lg border border-emerald-800">
        <div>
          <div className="flex items-center gap-2 text-emerald-300 font-extrabold text-xs uppercase tracking-wider mb-1">
            <Activity className="w-4 h-4 text-emerald-400" /> CRM ACTIVITY LOG STREAM
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
            Activities & Interaction Stream
          </h1>
          <p className="text-xs md:text-sm text-slate-200 mt-1 font-medium">
            Complete audit stream of client phone calls, emails, product demos, and meeting notes.
          </p>
        </div>

        <Link
          href="/activities/create"
          className="flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-extrabold transition-all shadow-md cursor-pointer self-start md:self-auto"
        >
          <Plus className="w-4 h-4" /> Log Activity
        </Link>
      </div>

      {/* Activity Logs Stream Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
        {mockActivities.map((act) => (
          <div key={act.id} className="p-5 flex items-center justify-between hover:bg-slate-50/60 transition-colors">
            <div className="flex items-center gap-4 text-xs">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold border border-emerald-100">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">{act.subject}</h3>
                <p className="text-slate-500 font-medium">{act.performedBy} • Related to {act.relatedTo}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="font-bold text-slate-400">{act.timestamp}</span>
              <Link href={`/activities/${act.id}`} className="px-3.5 py-1.5 bg-slate-50 text-emerald-800 font-bold rounded-xl hover:bg-emerald-50 border border-slate-200 transition-all">
                View Log
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
