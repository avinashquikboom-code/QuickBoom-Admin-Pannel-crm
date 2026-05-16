import React, { useState } from 'react';
import { 
  Activity, 
  Search, 
  Filter, 
  Calendar, 
  Download, 
  ChevronRight,
  Clock,
  User,
  Shield,
  FileEdit,
  LogIn,
  LogOut,
  UserPlus,
  Settings,
  MoreVertical
} from 'lucide-react';
import { motion } from 'framer-motion';

interface ActivityItem {
  id: string;
  user: string;
  action: string;
  target: string;
  time: string;
  date: string;
  type: 'auth' | 'update' | 'create' | 'delete' | 'config';
  icon: any;
  color: string;
}

const activities: ActivityItem[] = [
  { id: '1', user: 'Avinash Magar', action: 'Successfully logged in', target: 'Chrome on macOS', time: '10:45 AM', date: 'Today', type: 'auth', icon: LogIn, color: 'text-emerald-500' },
  { id: '2', user: 'Avinash Magar', action: 'Updated Lead Status', target: 'John Smith (Tech Solutions)', time: '09:30 AM', date: 'Today', type: 'update', icon: FileEdit, color: 'text-blue-500' },
  { id: '3', user: 'Avinash Magar', action: 'Changed Workspace Logo', target: 'Company Profile', time: '05:15 PM', date: 'Yesterday', type: 'config', icon: Settings, color: 'text-purple-500' },
  { id: '4', user: 'Avinash Magar', action: 'Created New Employee', target: 'Sameer Khan', time: '02:00 PM', date: 'Yesterday', type: 'create', icon: UserPlus, color: 'text-amber-500' },
  { id: '5', user: 'Avinash Magar', action: 'Modified Security Rules', target: 'Role: Admin', time: '11:20 AM', date: '15 May 2026', type: 'config', icon: Shield, color: 'text-rose-500' },
  { id: '6', user: 'Avinash Magar', action: 'Exported Financial Report', target: 'Q1 Payout Summary', time: '04:45 PM', date: '14 May 2026', type: 'update', icon: Activity, color: 'text-slate-500' },
];

const ActivityLog: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Activity Log</h1>
          <p className="text-sm text-slate-500 font-medium">Track your personal and workspace activity history</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all flex items-center gap-2 text-sm shadow-sm">
            <Calendar className="w-4 h-4" />
            Last 30 Days
          </button>
          <button className="btn-primary py-2 px-6 shadow-lg shadow-primary-500/20 text-sm">
            <Download className="w-4 h-4" />
            Export Log
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Summary Cards */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card-premium">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Activity Summary</h3>
            <div className="space-y-6">
              {[
                { label: 'Total Actions', count: '124', color: 'bg-primary-500' },
                { label: 'Logins', count: '18', color: 'bg-emerald-500' },
                { label: 'System Changes', count: '5', color: 'bg-rose-500' },
              ].map((stat, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${stat.color}`}></div>
                    <span className="text-sm font-bold text-slate-600">{stat.label}</span>
                  </div>
                  <span className="text-sm font-extrabold text-slate-900">{stat.count}</span>
                </div>
              ))}
            </div>
            <div className="mt-8 pt-6 border-t border-slate-50">
              <button className="w-full py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-bold rounded-xl transition-all">Clear History</button>
            </div>
          </div>

          <div className="card-premium bg-slate-900 text-white border-none overflow-hidden relative">
            <div className="relative z-10">
              <h3 className="text-lg font-bold mb-2">Security Score</h3>
              <p className="text-xs text-slate-400 font-medium mb-6">Your account security is optimal</p>
              <div className="flex items-center gap-4">
                <div className="text-3xl font-extrabold text-primary-400">98%</div>
                <div className="flex-1 h-1.5 bg-slate-800 rounded-full">
                  <div className="h-full bg-primary-500 w-[98%] rounded-full shadow-[0_0_10px_rgba(34,197,94,0.3)]"></div>
                </div>
              </div>
            </div>
            <Shield className="absolute -bottom-4 -right-4 w-24 h-24 text-white/5" />
          </div>
        </div>

        {/* Timeline */}
        <div className="lg:col-span-3 space-y-6">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search for specific actions or targets..." 
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all shadow-sm font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="space-y-8">
            {['Today', 'Yesterday', '15 May 2026', '14 May 2026'].map((dateGroup) => (
              <div key={dateGroup} className="space-y-4">
                <div className="flex items-center gap-4 px-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{dateGroup}</span>
                  <div className="flex-1 h-px bg-slate-100"></div>
                </div>
                
                <div className="space-y-3">
                  {activities.filter(a => a.date === dateGroup).map((item, idx) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="group flex items-center gap-5 p-4 bg-white border border-slate-100 rounded-3xl hover:border-primary-200 hover:shadow-md transition-all cursor-pointer"
                    >
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-slate-50 group-hover:bg-white transition-colors ${item.color}`}>
                        <item.icon className="w-5 h-5" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-slate-900">{item.action}</p>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">• {item.time}</span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          Target: <span className="text-slate-700 font-bold">{item.target}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <button className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 opacity-0 group-hover:opacity-100 transition-all">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <button className="w-full py-4 bg-white border border-slate-200 text-slate-500 text-sm font-bold rounded-2xl hover:bg-slate-50 transition-all shadow-sm">
            Load More Activity
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActivityLog;
