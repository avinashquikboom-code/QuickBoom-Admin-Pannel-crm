'use client';
import React, { useEffect, useState } from 'react';

export default function RemoteWorkPage() {
  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-black text-slate-900 mb-6">Remote Work</h1>
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <p className="text-slate-500">No active remote work requests.</p>
      </div>
    </div>
  );
}