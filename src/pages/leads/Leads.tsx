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
  UserPlus,
  Settings,
  Tag,
  MessageSquare,
  Paperclip,
  CheckSquare
} from 'lucide-react';
import { motion } from 'framer-motion';

const columns = [
  { id: 'new', title: 'New Leads', color: 'bg-blue-500' },
  { id: 'contacted', title: 'Contacted', color: 'bg-orange-500' },
  { id: 'proposal', title: 'Proposal Sent', color: 'bg-purple-500' },
  { id: 'won', title: 'Won', color: 'bg-emerald-500' },
];

const initialLeads = [
  { 
    id: 'L001', 
    name: 'John Smith', 
    company: 'Tech Solutions Inc.', 
    value: '₹50,000', 
    stage: 'new', 
    priority: 'High', 
    source: 'Website', 
    date: '2 hours ago',
    tasks: { completed: 2, total: 5 },
    tags: ['Software', 'Enterprise'],
    comments: 4,
    attachments: 2
  },
  { 
    id: 'L002', 
    name: 'Sarah Wilson', 
    company: 'Sarah Bakery', 
    value: '₹12,000', 
    stage: 'contacted', 
    priority: 'Medium', 
    source: 'Referral', 
    date: '5 hours ago',
    tasks: { completed: 3, total: 3 },
    tags: ['Retail', 'F&B'],
    comments: 1,
    attachments: 0
  },
  { 
    id: 'L003', 
    name: 'Michael Brown', 
    company: 'Global Logistics', 
    value: '₹1,20,000', 
    stage: 'proposal', 
    priority: 'High', 
    source: 'LinkedIn', 
    date: '1 day ago',
    tasks: { completed: 8, total: 10 },
    tags: ['Logistics', 'Import'],
    comments: 12,
    attachments: 5
  },
  { 
    id: 'L004', 
    name: 'Emma Davis', 
    company: 'Emma Boutique', 
    value: '₹25,000', 
    stage: 'won', 
    priority: 'Low', 
    source: 'Facebook', 
    date: '2 days ago',
    tasks: { completed: 5, total: 5 },
    tags: ['Fashion'],
    comments: 2,
    attachments: 1
  },
  { 
    id: 'L005', 
    name: 'David Lee', 
    company: 'Lee & Associates', 
    value: '₹45,000', 
    stage: 'new', 
    priority: 'Medium', 
    source: 'Website', 
    date: '4 hours ago',
    tasks: { completed: 0, total: 2 },
    tags: ['Legal'],
    comments: 0,
    attachments: 0
  },
];

const Leads: React.FC = () => {
  const [view, setView] = useState<'kanban' | 'list'>('kanban');

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Lead Management</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Nurture and convert your business opportunities</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
            <button 
              onClick={() => setView('kanban')}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${view === 'kanban' ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              Kanban
            </button>
            <button 
              onClick={() => setView('list')}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${view === 'list' ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              List View
            </button>
          </div>
          <button className="btn-primary py-2.5 px-6 shadow-lg shadow-primary-500/20 text-sm">
            <UserPlus className="w-5 h-5" />
            Add New Lead
          </button>
          <button className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all shadow-sm">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { label: 'Total Leads', value: '1,248', icon: Target, color: 'text-blue-600', bg: 'bg-blue-50', trend: '+12%' },
          { label: 'Pipeline Value', value: '₹24.5L', icon: Layers, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: '+8%' },
          { label: 'Conv. Rate', value: '18.4%', icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50', trend: '+2.1%' },
        ].map((stat, idx) => (
          <div key={idx} className="card-premium flex items-center gap-6">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${stat.bg}`}>
              <stat.icon className={`w-7 h-7 ${stat.color}`} />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-extrabold text-slate-900">{stat.value}</p>
                <span className="text-xs font-bold text-emerald-500">{stat.trend}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Search leads by name, company, email..." 
            className="w-full pl-14 pr-4 py-4 bg-white border border-slate-200 rounded-3xl focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all shadow-sm font-medium text-slate-700"
          />
        </div>
        <button className="px-8 py-4 bg-white border border-slate-200 text-slate-600 font-bold rounded-3xl hover:bg-slate-50 transition-all flex items-center gap-3 shadow-sm">
          <Filter className="w-5 h-5" />
          More Filters
        </button>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-8 overflow-x-auto pb-10 -mx-6 px-6 scrollbar-hide">
        {columns.map(col => (
          <div key={col.id} className="min-w-[340px] flex-shrink-0">
            <div className="flex items-center justify-between mb-6 px-3">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${col.color} shadow-sm`}></div>
                <h3 className="font-extrabold text-slate-800 uppercase text-xs tracking-widest">{col.title}</h3>
                <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-[10px] font-extrabold">
                  {initialLeads.filter(l => l.stage === col.id).length}
                </span>
              </div>
              <button className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors"><Plus className="w-5 h-5" /></button>
            </div>
            
            <div className="space-y-6">
              {initialLeads.filter(l => l.stage === col.id).map((lead, idx) => (
                <motion.div 
                  key={lead.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all cursor-grab active:cursor-grabbing group"
                >
                  <div className="flex justify-between items-start mb-5">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-lg text-[9px] font-extrabold uppercase tracking-tighter ${
                        lead.priority === 'High' ? 'bg-rose-500 text-white' : 
                        lead.priority === 'Medium' ? 'bg-amber-500 text-white' : 'bg-slate-500 text-white'
                      }`}>
                        {lead.priority} Priority
                      </span>
                      <span className="px-2.5 py-1 bg-primary-50 text-primary-600 text-[9px] font-extrabold uppercase rounded-lg">
                        {lead.source}
                      </span>
                    </div>
                    <button className="p-1 text-slate-300 hover:text-slate-500 transition-colors">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center p-2 shadow-inner">
                      {/* Logo usage here */}
                      <img src="https://api.dicebear.com/7.x/initials/svg?seed=QB" alt="QuikBoom" className="w-full h-full object-contain opacity-80" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-slate-900 group-hover:text-primary-600 transition-colors leading-tight">{lead.name}</h4>
                      <p className="text-xs text-slate-500 font-bold mt-0.5">{lead.company}</p>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {lead.tags.map(tag => (
                      <span key={tag} className="flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md">
                        <Tag className="w-3 h-3" />
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Progress */}
                  <div className="space-y-2 mb-6">
                    <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      <div className="flex items-center gap-1">
                        <CheckSquare className="w-3 h-3" />
                        Tasks
                      </div>
                      <span>{lead.tasks.completed}/{lead.tasks.total} Done</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(lead.tasks.completed / lead.tasks.total) * 100}%` }}
                        className="h-full bg-primary-500 rounded-full"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-5 border-t border-slate-50">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Value</p>
                      <p className="text-base font-extrabold text-slate-900">{lead.value}</p>
                    </div>
                    <div className="flex items-center -space-x-2">
                      <img className="w-8 h-8 rounded-full border-2 border-white" src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="" />
                      <img className="w-8 h-8 rounded-full border-2 border-white" src="https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka" alt="" />
                      <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">+2</div>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center gap-4 text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4" />
                      <span className="text-[11px] font-bold">{lead.comments}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Paperclip className="w-4 h-4" />
                      <span className="text-[11px] font-bold">{lead.attachments}</span>
                    </div>
                    <div className="ml-auto flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      <span className="text-[11px] font-bold">{lead.date}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
              
              <button className="w-full py-5 border-2 border-dashed border-slate-200 rounded-[2rem] text-slate-400 text-sm font-bold hover:border-primary-300 hover:text-primary-500 hover:bg-primary-50/30 transition-all flex items-center justify-center gap-3 group">
                <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                Add New Card
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Leads;
