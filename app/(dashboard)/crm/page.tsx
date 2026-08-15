'use client';

import React, { useState } from 'react';
import { Plus, DollarSign, Building, MoreHorizontal, User } from 'lucide-react';

interface KanbanColumn {
  id: string;
  title: string;
  deals: Array<{
    id: string;
    title: string;
    company: string;
    value: number;
    contact: string;
  }>;
}

const initialStages: KanbanColumn[] = [
  {
    id: 'NEW',
    title: 'New Opportunities',
    deals: [
      { id: '1', title: 'Enterprise Cloud Migration', company: 'TechCorp Solutions', value: 150000, contact: 'Alice Smith' },
      { id: '2', title: 'Security Suite Renewal', company: 'FinTech Dynamics', value: 85000, contact: 'Bob Johnson' },
    ],
  },
  {
    id: 'QUALIFIED',
    title: 'Qualified',
    deals: [
      { id: '3', title: 'Q3 CRM Subscription Expansion', company: 'Global Retailers', value: 210000, contact: 'Carol White' },
    ],
  },
  {
    id: 'PROPOSAL',
    title: 'Proposal Sent',
    deals: [
      { id: '4', title: 'Custom AI Integration', company: 'HealthCare Systems', value: 340000, contact: 'David Brown' },
    ],
  },
  {
    id: 'WON',
    title: 'Closed Won',
    deals: [
      { id: '5', title: 'Annual SaaS Enterprise Plan', company: 'EduLearn Inc', value: 120000, contact: 'Eva Green' },
    ],
  },
];

export default function SalesPipelinePage() {
  const [stages] = useState<KanbanColumn[]>(initialStages);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Sales Pipeline Kanban</h1>
          <p className="text-sm text-slate-500">Manage pipeline stages, deal probabilities, and revenue metrics.</p>
        </div>
        <button className="inline-flex items-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-xl shadow-xs transition-all gap-2 cursor-pointer">
          <Plus className="w-4 h-4" />
          Create Deal
        </button>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
        {stages.map((stage) => {
          const totalColumnValue = stage.deals.reduce((sum, d) => sum + d.value, 0);
          return (
            <div
              key={stage.id}
              className="bg-slate-100 dark:bg-slate-900/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white text-sm">{stage.title}</h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">₹{totalColumnValue.toLocaleString()}</p>
                </div>
                <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 text-xs font-bold flex items-center justify-center text-slate-700 dark:text-slate-300">
                  {stage.deals.length}
                </span>
              </div>

              {/* Deal Cards */}
              <div className="space-y-3">
                {stage.deals.map((deal) => (
                  <div
                    key={deal.id}
                    className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 hover:border-blue-500 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-semibold text-slate-900 dark:text-white text-sm line-clamp-1">{deal.title}</h4>
                      <button className="text-slate-400 hover:text-slate-200">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-slate-400" />
                        <span>{deal.company}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{deal.contact}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                      <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                        ₹{deal.value.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
