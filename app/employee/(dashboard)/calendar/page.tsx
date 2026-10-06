'use client';
import React from 'react';

export default function CalendarPage() {
  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-black text-slate-900 mb-6">Calendar & Schedule</h1>
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <p className="text-slate-500">No scheduled events found.</p>
      </div>
    </div>
  );
}