import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { 
  Users, 
  Target, 
  TrendingUp, 
  DollarSign, 
  Clock, 
  Calendar,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  AlertCircle,
  Settings
} from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie
} from 'recharts';

const kpiData = [
  { label: 'Total Revenue', value: '₹4,25,000', change: '+12.5%', isPositive: true, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { label: 'New Leads', value: '148', change: '+8.2%', isPositive: true, icon: Target, color: 'text-blue-600', bg: 'bg-blue-50' },
  { label: 'Active Employees', value: '42', change: '0%', isPositive: true, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
  { label: 'Pending Tasks', value: '24', change: '-5.4%', isPositive: false, icon: AlertCircle, color: 'text-orange-600', bg: 'bg-orange-50' },
];

const revenueData = [
  { name: 'Jan', revenue: 4000 },
  { name: 'Feb', revenue: 3000 },
  { name: 'Mar', revenue: 5000 },
  { name: 'Apr', revenue: 4500 },
  { name: 'May', revenue: 6000 },
  { name: 'Jun', revenue: 5500 },
];

const pieData = [
  { name: 'Hot Leads', value: 400 },
  { name: 'Warm Leads', value: 300 },
  { name: 'Cold Leads', value: 300 },
];

const COLORS = ['#10b981', '#3b82f6', '#f59e0b'];

const Dashboard: React.FC = () => {
  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard Overview</h1>
          <p className="text-slate-500 mt-1">Welcome back, Avinash! Here's what's happening today.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Attendance Status</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-sm font-bold text-slate-900 uppercase">Punched In (09:42 AM)</span>
            </div>
          </div>
          <button className="bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-lg shadow-red-500/20 active:scale-95">
            Punch Out
          </button>
          <button className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all shadow-sm">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiData.map((kpi, idx) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="card-premium flex items-start justify-between group"
          >
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">{kpi.label}</p>
              <h3 className="text-2xl font-bold text-slate-900">{kpi.value}</h3>
              <div className={cn(
                "flex items-center gap-1 mt-2 text-xs font-bold px-2 py-0.5 rounded-full inline-flex",
                kpi.isPositive ? "text-emerald-600 bg-emerald-50" : "text-rose-600 bg-rose-50"
              )}>
                {kpi.isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {kpi.change}
              </div>
            </div>
            <div className={cn("p-3 rounded-xl transition-transform group-hover:scale-110 duration-300", kpi.bg)}>
              <kpi.icon className={cn("w-6 h-6", kpi.color)} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Analytics */}
        <div className="lg:col-span-2 card-premium">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Revenue Analytics</h3>
              <p className="text-xs text-slate-500">Monthly revenue collection trends</p>
            </div>
            <select className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-primary-500">
              <option>Last 6 Months</option>
              <option>Last 12 Months</option>
              <option>This Year</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12 }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12 }} 
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#22c55e" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lead Statistics */}
        <div className="card-premium">
          <h3 className="text-lg font-bold text-slate-900 mb-2">Lead Conversion</h3>
          <p className="text-xs text-slate-500 mb-8">Current pipeline distribution</p>
          <div className="h-[250px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
              <p className="text-2xl font-bold text-slate-900">1,000</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Leads</p>
            </div>
          </div>
          <div className="mt-8 space-y-3">
            {pieData.map((entry, idx) => (
              <div key={entry.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-slate-600">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx] }}></span>
                  {entry.name}
                </div>
                <span className="font-bold text-slate-900">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activities & Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card-premium">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-900">Recent Activities</h3>
            <button className="text-xs font-bold text-primary-600 hover:underline">View All</button>
          </div>
          <div className="space-y-6">
            {[
              { user: 'Sanjay Kumar', action: 'converted a lead to customer', time: '2 mins ago', type: 'lead' },
              { user: 'Priya Sharma', action: 'submitted a leave request', time: '45 mins ago', type: 'leave' },
              { user: 'Rahul Verma', action: 'completed task "API Integration"', time: '2 hours ago', type: 'task' },
              { user: 'Anjali Gupta', action: 'uploaded new document for Project X', time: '5 hours ago', type: 'doc' },
            ].map((activity, idx) => (
              <div key={idx} className="flex gap-4 group cursor-pointer">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border-2 border-white overflow-hidden group-hover:scale-110 transition-transform">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${activity.user}`} alt="" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-primary-500 rounded-full border-2 border-white flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-slate-900">
                    <span className="font-bold">{activity.user}</span> {activity.action}
                  </p>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card-premium">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-900">Team Presence</h3>
            <div className="flex -space-x-2">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-white overflow-hidden bg-slate-200">
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`} alt="" />
                </div>
              ))}
              <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">+12</div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <div>
                  <p className="text-sm font-bold text-emerald-900">38 Employees Present</p>
                  <p className="text-xs text-emerald-600 font-medium">92% attendance today</p>
                </div>
              </div>
              <button className="text-xs font-bold text-emerald-700 hover:underline">Details</button>
            </div>
            <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-rose-500" />
                <div>
                  <p className="text-sm font-bold text-rose-900">4 Employees Absent</p>
                  <p className="text-xs text-rose-600 font-medium">Without prior notice</p>
                </div>
              </div>
              <button className="text-xs font-bold text-rose-700 hover:underline">Details</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default Dashboard;
