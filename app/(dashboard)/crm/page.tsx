'use client';

import React from 'react';
import { Plus, MoreHorizontal, DollarSign } from 'lucide-react';

const stages = [
  { id: 'QUALIFICATION', title: 'Qualification', count: 4, value: '₹1,20,000' },
  { id: 'PROPOSAL', title: 'Proposal Sent', count: 3, value: '₹2,40,000' },
  { id: 'NEGOTIATION', title: 'Negotiation', count: 2, value: '₹1,80,000' },
  { id: 'WON', title: 'Closed Won', count: 5, value: '₹4,50,000' },
];

export default function PipelinePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Sales Pipeline</h1>
          <p className="text-sm text-[#64748B]">Visual Kanban board of active deal stages.</p>
        </div>
        <button className="inline-flex items-center gap-2 bg-[#0F766E] hover:bg-[#115E59] text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-all shadow-xs cursor-pointer">
          <Plus className="w-4 h-4" /> Add New Deal
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stages.map((stage) => (
          <div key={stage.id} className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-4 flex flex-col min-h-[500px]">
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-[#E2E8F0]">
              <div>
                <h3 className="font-bold text-sm text-[#0F172A]">{stage.title}</h3>
                <p className="text-xs text-[#64748B]">{stage.value}</p>
              </div>
              <span className="w-6 h-6 rounded-full bg-[#E2E8F0] text-[#0F172A] text-xs font-bold flex items-center justify-center">
                {stage.count}
              </span>
            </div>

            <div className="space-y-3 flex-1">
              <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs space-y-2 hover:border-[#0F766E] transition-all cursor-pointer">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#0F766E] bg-[#CCFBF1] px-2 py-0.5 rounded">High Priority</span>
                  <button className="text-[#64748B] hover:text-[#0F172A]"><MoreHorizontal className="w-4 h-4" /></button>
                </div>
                <h4 className="font-semibold text-sm text-[#0F172A]">Acme Corp Enterprise License</h4>
                <p className="text-xs text-[#64748B]">Acme Technologies Inc.</p>
                <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between text-xs text-[#0F172A] font-bold">
                  <span className="flex items-center text-[#16A34A]"><DollarSign className="w-3.5 h-3.5" /> ₹65,000</span>
                  <span className="text-[10px] text-[#64748B]">Closing in 4 days</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
