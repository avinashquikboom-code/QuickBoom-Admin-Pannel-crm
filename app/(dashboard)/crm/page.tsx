'use client';

import React, { useState } from 'react';
import { Plus, MoreHorizontal, DollarSign, Building2, Calendar, CheckCircle2, ArrowRight, Kanban } from 'lucide-react';

interface Deal {
  id: string;
  title: string;
  company: string;
  value: number;
  stage: 'QUALIFICATION' | 'PROPOSAL' | 'NEGOTIATION' | 'WON';
  closingDays: number;
  priority: 'HIGH' | 'MEDIUM';
}

const initialDeals: Deal[] = [
  {
    id: '1',
    title: 'Acme Corp Enterprise Suite',
    company: 'Acme Technologies Inc.',
    value: 650000,
    stage: 'QUALIFICATION',
    closingDays: 14,
    priority: 'HIGH',
  },
  {
    id: '2',
    title: 'Apex Cloud Migration Deal',
    company: 'Apex Tech Solutions',
    value: 450000,
    stage: 'PROPOSAL',
    closingDays: 7,
    priority: 'HIGH',
  },
  {
    id: '3',
    title: 'Innovate Digital Annual Contract',
    company: 'Innovate Digital Services',
    value: 820000,
    stage: 'NEGOTIATION',
    closingDays: 3,
    priority: 'HIGH',
  },
  {
    id: '4',
    title: 'Nexus Logistics Fleet CRM',
    company: 'Nexus Global Logistics',
    value: 300000,
    stage: 'WON',
    closingDays: 0,
    priority: 'MEDIUM',
  },
];

const stages = [
  { id: 'QUALIFICATION', title: 'Qualification', color: 'border-blue-500' },
  { id: 'PROPOSAL', title: 'Proposal Sent', color: 'border-indigo-500' },
  { id: 'NEGOTIATION', title: 'Negotiation', color: 'border-amber-500' },
  { id: 'WON', title: 'Closed Won', color: 'border-emerald-500' },
];

export default function PipelinePage() {
  const [deals, setDeals] = useState<Deal[]>(initialDeals);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    value: 200000,
    stage: 'QUALIFICATION' as Deal['stage'],
    closingDays: 10,
    priority: 'MEDIUM' as 'HIGH' | 'MEDIUM',
  });

  const moveDeal = (id: string, currentStage: Deal['stage']) => {
    const stageOrder: Deal['stage'][] = ['QUALIFICATION', 'PROPOSAL', 'NEGOTIATION', 'WON'];
    const nextIdx = (stageOrder.indexOf(currentStage) + 1) % stageOrder.length;
    setDeals(
      deals.map((d) => (d.id === id ? { ...d, stage: stageOrder[nextIdx] } : d))
    );
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const newDeal: Deal = {
      id: Date.now().toString(),
      ...formData,
    };
    setDeals([...deals, newDeal]);
    setShowModal(false);
  };

  return (
    <div className="space-y-8">
      {/* Top Title Card Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-900 via-emerald-800 to-slate-900 p-6 sm:p-8 rounded-3xl text-white shadow-lg border border-emerald-800">
        <div>
          <div className="flex items-center gap-2 text-emerald-300 font-extrabold text-xs uppercase tracking-wider mb-1">
            <Kanban className="w-4 h-4 text-emerald-400" /> VISUAL SALES PIPELINE KANBAN
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
            Deals Pipeline & Revenue Stage Kanban
          </h1>
          <p className="text-xs md:text-sm text-slate-200 mt-1 font-medium">
            Visual Deal Kanban board with real-time stage transitions, revenue forecasting, and deal advancing.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-extrabold text-xs transition-all shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add New Deal
          </button>
        </div>
      </div>

      {/* Kanban Board Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stages.map((stage) => {
          const stageDeals = deals.filter((d) => d.stage === stage.id);
          const totalVal = stageDeals.reduce((sum, d) => sum + d.value, 0);

          return (
            <div
              key={stage.id}
              className={`bg-slate-50 border-t-4 ${stage.color} border-x border-b border-slate-200/80 rounded-2xl p-4 flex flex-col min-h-[500px] shadow-2xs`}
            >
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
                <div>
                  <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">{stage.title}</h3>
                  <p className="text-xs font-black text-indigo-600 mt-0.5">
                    ₹{totalVal.toLocaleString('en-IN')}
                  </p>
                </div>
                <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-900 text-xs font-bold flex items-center justify-center">
                  {stageDeals.length}
                </span>
              </div>

              {/* Deal Cards */}
              <div className="space-y-3 flex-1">
                {stageDeals.map((deal) => (
                  <div
                    key={deal.id}
                    className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3 hover:shadow-md hover:border-indigo-600 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                        {deal.priority} PRIORITY
                      </span>
                      <button
                        onClick={() => moveDeal(deal.id, deal.stage)}
                        className="text-xs text-slate-400 hover:text-indigo-600 font-bold flex items-center gap-1 cursor-pointer"
                        title="Move to Next Stage"
                      >
                        Advance <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div>
                      <h4 className="font-bold text-xs text-slate-900">{deal.title}</h4>
                      <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1 mt-1">
                        <Building2 className="w-3 h-3 text-slate-400" /> {deal.company}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="font-extrabold text-emerald-600">
                        ₹{deal.value.toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {deal.closingDays === 0 ? 'Closed' : `${deal.closingDays} days left`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-black text-slate-900">Add New Deal Opportunity</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Deal Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-xl"
                  placeholder="Software License Subscription"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Company Name</label>
                <input
                  type="text"
                  required
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-xl"
                  placeholder="Acme Corp"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Deal Value (₹)</label>
                  <input
                    type="number"
                    required
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Stage</label>
                  <select
                    value={formData.stage}
                    onChange={(e) => setFormData({ ...formData, stage: e.target.value as Deal['stage'] })}
                    className="w-full p-2 border border-slate-200 rounded-xl font-bold"
                  >
                    <option value="QUALIFICATION">Qualification</option>
                    <option value="PROPOSAL">Proposal</option>
                    <option value="NEGOTIATION">Negotiation</option>
                    <option value="WON">Closed Won</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 text-white rounded-xl font-bold shadow-md"
                >
                  Save Deal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
