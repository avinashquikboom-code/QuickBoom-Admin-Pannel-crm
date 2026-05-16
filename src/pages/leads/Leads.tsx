import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Target, 
  Phone, 
  Mail, 
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp,
  Clock,
  UserPlus
} from 'lucide-react';
import { motion } from 'framer-motion';

const columns = [
  { id: 'new', title: 'New Leads', color: 'bg-blue-500' },
  { id: 'contacted', title: 'Contacted', color: 'bg-orange-500' },
  { id: 'proposal', title: 'Proposal Sent', color: 'bg-purple-500' },
  { id: 'won', title: 'Won', color: 'bg-emerald-500' },
];

const initialLeads = [
  { id: 'L001', name: 'John Smith', company: 'Tech Solutions Inc.', value: '₹50,000', stage: 'new', priority: 'High', source: 'Website', date: '2 hours ago' },
  { id: 'L002', name: 'Sarah Wilson', company: 'Sarah Bakery', value: '₹12,000', stage: 'contacted', priority: 'Medium', source: 'Referral', date: '5 hours ago' },
  { id: 'L003', name: 'Michael Brown', company: 'Global Logistics', value: '₹1,20,000', stage: 'proposal', priority: 'High', source: 'LinkedIn', date: '1 day ago' },
  { id: 'L004', name: 'Emma Davis', company: 'Emma Boutique', value: '₹25,000', stage: 'won', priority: 'Low', source: 'Facebook', date: '2 days ago' },
  { id: 'L005', name: 'David Lee', company: 'Lee & Associates', value: '₹45,000', stage: 'new', priority: 'Medium', source: 'Website', date: '4 hours ago' },
];

const Leads: React.FC = () => {
  const [view, setView] = useState<'kanban' | 'list'>('kanban');

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Lead Management</h1>
          <p className="text-sm text-slate-500 font-medium">Track and convert your potential customers</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
            <button 
              onClick={() => setView('kanban')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${view === 'kanban' ? 'bg-primary-500 text-white shadow-md shadow-primary-500/20' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              Kanban
            </button>
            <button 
              onClick={() => setView('list')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${view === 'list' ? 'bg-primary-500 text-white shadow-md shadow-primary-500/20' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              List View
            </button>
          </div>
          <button className="btn-primary py-2 px-4 shadow-lg shadow-primary-500/20">
            <UserPlus className="w-5 h-5" />
            Add New Lead
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card-premium flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Leads</p>
            <p className="text-2xl font-bold text-slate-900">1,248</p>
          </div>
          <div className="ml-auto text-emerald-500 flex items-center gap-1 font-bold text-sm">
            <TrendingUp className="w-4 h-4" />
            +12%
          </div>
        </div>
        <div className="card-premium flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pipeline Value</p>
            <p className="text-2xl font-bold text-slate-900">₹24,50,000</p>
          </div>
        </div>
        <div className="card-premium flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Conversion Rate</p>
            <p className="text-2xl font-bold text-slate-900">18.4%</p>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Search leads by name, company, email..." 
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all shadow-sm font-medium"
          />
        </div>
        <button className="px-6 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm">
          <Filter className="w-5 h-5" />
          Filter Leads
        </button>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 overflow-x-auto pb-8">
        {columns.map(col => (
          <div key={col.id} className="min-w-[280px]">
            <div className="flex items-center justify-between mb-4 px-2">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${col.color}`}></div>
                <h3 className="font-bold text-slate-700 uppercase text-xs tracking-wider">{col.title}</h3>
                <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full text-[10px] font-bold">
                  {initialLeads.filter(l => l.stage === col.id).length}
                </span>
              </div>
              <button className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"><MoreHorizontal className="w-4 h-4" /></button>
            </div>
            
            <div className="space-y-4">
              {initialLeads.filter(l => l.stage === col.id).map((lead, idx) => (
                <motion.div 
                  key={lead.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing group border-l-4 border-l-transparent hover:border-l-primary-500"
                >
                  <div className="flex justify-between items-start mb-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                      lead.priority === 'High' ? 'bg-rose-50 text-rose-600' : 
                      lead.priority === 'Medium' ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-500'
                    }`}>
                      {lead.priority}
                    </span>
                    <p className="text-xs font-bold text-slate-400">{lead.date}</p>
                  </div>
                  
                  <h4 className="font-bold text-slate-900 mb-1 group-hover:text-primary-600 transition-colors">{lead.name}</h4>
                  <p className="text-xs text-slate-500 font-medium mb-4">{lead.company}</p>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                    <p className="text-sm font-bold text-slate-900">{lead.value}</p>
                    <div className="flex items-center gap-1">
                      <button className="p-1.5 hover:bg-primary-50 hover:text-primary-600 rounded-lg text-slate-400 transition-colors"><Phone className="w-4 h-4" /></button>
                      <button className="p-1.5 hover:bg-primary-50 hover:text-primary-600 rounded-lg text-slate-400 transition-colors"><Mail className="w-4 h-4" /></button>
                    </div>
                  </div>
                </motion.div>
              ))}
              
              <button className="w-full py-3 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs font-bold hover:border-primary-300 hover:text-primary-500 hover:bg-primary-50/30 transition-all flex items-center justify-center gap-2 group">
                <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                Add Lead
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Leads;
