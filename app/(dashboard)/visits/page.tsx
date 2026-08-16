'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { MapPin, Calendar, Clock, Building2, User, CheckCircle2, Navigation } from 'lucide-react';

interface VisitRecord {
  id: string;
  employeeName: string;
  clientCompany: string;
  location: string;
  purpose: string;
  startTime: string;
  endTime: string;
  duration: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'SCHEDULED';
  date: string;
}

const mockVisits: VisitRecord[] = [
  {
    id: '1',
    employeeName: 'Sneha Gupta',
    clientCompany: 'Acme Enterprises',
    location: 'Bandra Kurla Complex, Mumbai',
    purpose: 'Product Demo & Contract Discussion',
    startTime: '10:15 AM',
    endTime: '11:45 AM',
    duration: '1h 30m',
    status: 'COMPLETED',
    date: '2026-08-15',
  },
  {
    id: '2',
    employeeName: 'Rahul Sharma',
    clientCompany: 'TechCorp Solutions',
    location: 'Lower Parel, Mumbai',
    purpose: 'Quarterly Account Review',
    startTime: '02:00 PM',
    endTime: '-',
    duration: 'In Progress',
    status: 'IN_PROGRESS',
    date: '2026-08-15',
  },
];

export default function FieldVisitsPage() {
  return (
    <div className="space-y-8">
      {/* Top Title Card Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-900 via-emerald-800 to-slate-900 p-6 sm:p-8 rounded-3xl text-white shadow-lg border border-emerald-800">
        <div>
          <div className="flex items-center gap-2 text-emerald-300 font-extrabold text-xs uppercase tracking-wider mb-1">
            <Navigation className="w-4 h-4 text-emerald-400" /> FIELD VISITS & CLIENT MEETINGS
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
            Field Visits & Client Logbook
          </h1>
          <p className="text-xs md:text-sm text-slate-200 mt-1 font-medium">
            Track field representative client meetings, GPS check-in points, visit notes, and meeting durations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/visits/create"
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold transition-all shadow-md cursor-pointer"
          >
            <MapPin className="w-4 h-4" /> Schedule Visit
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase">Total Visits Today</span>
          <p className="text-2xl font-black text-indigo-600 mt-1">12 Client Visits</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase">In Progress Now</span>
          <p className="text-2xl font-black text-amber-600 mt-1">3 Meetings</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase">Completed Today</span>
          <p className="text-2xl font-black text-emerald-600 mt-1">9 Meetings</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Sales Representative</th>
                <th className="py-3.5 px-4">Client / Company</th>
                <th className="py-3.5 px-4">Location (GPS)</th>
                <th className="py-3.5 px-4">Purpose</th>
                <th className="py-3.5 px-4">Time & Duration</th>
                <th className="py-3.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {mockVisits.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900">{v.employeeName}</td>
                  <td className="py-3.5 px-4 font-bold text-indigo-600 flex items-center gap-1.5 pt-4">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>{v.clientCompany}</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 font-medium">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      <span>{v.location}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 font-medium">{v.purpose}</td>
                  <td className="py-3.5 px-4">
                    <p className="font-bold text-slate-900">{v.startTime} - {v.endTime}</p>
                    <p className="text-[11px] text-slate-500 font-semibold">{v.duration}</p>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        v.status === 'COMPLETED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {v.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
