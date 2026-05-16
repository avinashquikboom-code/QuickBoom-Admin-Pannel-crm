import React from 'react';
import { 
  Plus, 
  MoreHorizontal,
  Users,
  Calendar,
  MessageSquare,
  Paperclip,
  BarChart2
} from 'lucide-react';
import { motion } from 'framer-motion';

const projects = [
  { 
    id: 'PRJ001', 
    name: 'Quik Boom CRM Revamp', 
    client: 'Internal', 
    status: 'In Progress', 
    progress: 75, 
    deadline: '25 May 2026', 
    team: 5, 
    tasks: 42,
    priority: 'Critical',
    color: 'bg-primary-500'
  },
  { 
    id: 'PRJ002', 
    name: 'X ONE Mobile App', 
    client: 'X Corp', 
    status: 'Planning', 
    progress: 15, 
    deadline: '10 Jun 2026', 
    team: 3, 
    tasks: 12,
    priority: 'High',
    color: 'bg-blue-500'
  },
  { 
    id: 'PRJ003', 
    name: 'Astrobless Backend', 
    client: 'Astrobless', 
    status: 'On Hold', 
    progress: 45, 
    deadline: '15 Jul 2026', 
    team: 2, 
    tasks: 28,
    priority: 'Medium',
    color: 'bg-orange-500'
  },
  { 
    id: 'PRJ004', 
    name: 'Finance Dashboard', 
    client: 'QuickPay', 
    status: 'Completed', 
    progress: 100, 
    deadline: '12 May 2026', 
    team: 4, 
    tasks: 56,
    priority: 'Low',
    color: 'bg-emerald-500'
  },
];

const Projects: React.FC = () => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Projects & Tasks</h1>
          <p className="text-sm text-slate-500 font-medium">Manage project timelines and team collaboration</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all flex items-center gap-2 text-sm shadow-sm">
            <BarChart2 className="w-4 h-4" />
            Project Reports
          </button>
          <button className="btn-primary py-2 px-4 shadow-lg shadow-primary-500/20">
            <Plus className="w-5 h-5" />
            Create Project
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-4 border-b border-slate-200">
        {['All Projects', 'In Progress', 'Completed', 'Planning', 'On Hold'].map((tab, idx) => (
          <button 
            key={tab} 
            className={`pb-4 px-2 text-sm font-bold transition-all relative ${idx === 0 ? 'text-primary-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            {tab}
            {idx === 0 && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-primary-500 rounded-t-full" />}
          </button>
        ))}
      </div>

      {/* Project Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {projects.map((prj, idx) => (
          <motion.div 
            key={prj.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
            className="card-premium group"
          >
            <div className="flex justify-between items-start mb-6">
              <div className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                prj.priority === 'Critical' ? 'bg-rose-100 text-rose-700' : 
                prj.priority === 'High' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {prj.priority}
              </div>
              <button className="p-1 hover:bg-slate-100 rounded-lg text-slate-400"><MoreHorizontal className="w-5 h-5" /></button>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-primary-600 transition-colors">{prj.name}</h3>
              <p className="text-xs text-slate-500 font-medium">Client: <span className="text-slate-900">{prj.client}</span></p>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm font-bold">
                <span className="text-slate-500">Progress</span>
                <span className="text-slate-900">{prj.progress}%</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${prj.progress}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className={`h-full rounded-full ${prj.color}`}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-8">
              <div className="flex items-center gap-2 text-slate-500">
                <Calendar className="w-4 h-4" />
                <span className="text-xs font-bold">{prj.deadline}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-500 justify-end">
                <Users className="w-4 h-4" />
                <span className="text-xs font-bold">{prj.team} Members</span>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
              <div className="flex -space-x-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-white overflow-hidden bg-slate-200">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${prj.id + i}`} alt="" />
                  </div>
                ))}
                {prj.team > 3 && (
                  <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">+{prj.team - 3}</div>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-slate-400">
                  <MessageSquare className="w-4 h-4" />
                  <span className="text-[10px] font-bold">12</span>
                </div>
                <div className="flex items-center gap-1 text-slate-400">
                  <Paperclip className="w-4 h-4" />
                  <span className="text-[10px] font-bold">5</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}

        {/* Create New Project Placeholder */}
        <button className="h-full min-h-[300px] border-2 border-dashed border-slate-200 rounded-2xl hover:border-primary-300 hover:bg-primary-50/20 transition-all flex flex-col items-center justify-center gap-3 group">
          <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 group-hover:scale-110 group-hover:bg-primary-100 group-hover:text-primary-600 transition-all">
            <Plus className="w-6 h-6" />
          </div>
          <p className="font-bold text-slate-400 group-hover:text-primary-600">Start New Project</p>
        </button>
      </div>
    </div>
  );
};

export default Projects;
