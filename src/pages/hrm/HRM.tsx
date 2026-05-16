import React, { useState } from 'react';
import { 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Users, 
  DollarSign,
  ChevronRight,
  UserCheck,
  UserX,
  TrendingUp,
  Download,
  AlertCircle,
  FileText,
  CreditCard
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';

const leaveRequests = [
  { id: 'LR-001', name: 'Priya Sharma', type: 'Medical Leave', duration: '3 Days', date: '18-20 May', status: 'Pending' },
  { id: 'LR-002', name: 'Rahul Verma', type: 'Casual Leave', duration: '1 Day', date: '22 May', status: 'Approved' },
  { id: 'LR-003', name: 'Anjali Gupta', type: 'Annual Leave', duration: '5 Days', date: '01-05 Jun', status: 'Rejected' },
];

const payrollStats = [
  { name: 'Engineering', amount: 850000, color: '#3b82f6' },
  { name: 'Marketing', amount: 240000, color: '#10b981' },
  { name: 'Sales', amount: 310000, color: '#f59e0b' },
  { name: 'HR', amount: 125000, color: '#8b5cf6' },
];

const HRM: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'payroll'>('overview');

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">HR Management</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Personnel operations, attendance tracking, and payroll</p>
        </div>
        <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'overview' ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            Team Overview
          </button>
          <button 
            onClick={() => setActiveTab('payroll')}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'payroll' ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            Payroll Hub
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'overview' ? (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* Left Content */}
            <div className="lg:col-span-2 space-y-8">
              <div className="card-premium">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Pending Leave Requests</h3>
                    <p className="text-xs text-slate-500 font-medium mt-1">Review and approve employee absences</p>
                  </div>
                  <button className="text-xs font-bold text-primary-600 hover:underline px-4 py-2 bg-primary-50 rounded-lg">View History</button>
                </div>
                
                <div className="space-y-4">
                  {leaveRequests.map((request, idx) => (
                    <motion.div 
                      key={request.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex flex-col md:flex-row md:items-center justify-between p-5 bg-slate-50 hover:bg-white hover:shadow-md border border-slate-100 rounded-3xl transition-all gap-4 group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-sm group-hover:scale-105 transition-transform">
                          <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${request.name}`} alt="" />
                        </div>
                        <div>
                          <p className="text-base font-bold text-slate-900">{request.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="px-2 py-0.5 bg-slate-200 text-slate-600 text-[10px] font-bold rounded-md uppercase">{request.type}</span>
                            <span className="text-xs text-slate-400 font-medium">{request.duration}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-8">
                        <div className="text-right hidden sm:block">
                          <p className="text-sm font-bold text-slate-900">{request.date}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Requested on 12 May</p>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <button className="p-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/10"><CheckCircle2 className="w-5 h-5" /></button>
                          <button className="p-2.5 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all border border-rose-100"><XCircle className="w-5 h-5" /></button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="card-premium">
                  <div className="flex items-center gap-3 mb-6">
                    <Calendar className="w-5 h-5 text-primary-500" />
                    <h3 className="text-lg font-bold text-slate-900">Upcoming Holidays</h3>
                  </div>
                  <div className="space-y-4">
                    {[
                      { name: 'Buddha Purnima', date: '23 May 2026', day: 'Saturday', type: 'Public' },
                      { name: 'Eid al-Adha', date: '17 Jun 2026', day: 'Wednesday', type: 'Religious' },
                    ].map((holiday, idx) => (
                      <div key={idx} className="flex items-center gap-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100 hover:border-primary-200 transition-colors">
                        <div className="w-12 h-14 bg-white rounded-xl border border-slate-200 flex flex-col items-center justify-center shadow-sm">
                          <span className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">{holiday.date.split(' ')[1]}</span>
                          <span className="text-base font-extrabold text-slate-900">{holiday.date.split(' ')[0]}</span>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{holiday.name}</p>
                          <p className="text-xs text-slate-500 font-medium">{holiday.day} • <span className="text-primary-600">{holiday.type}</span></p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card-premium">
                  <div className="flex items-center gap-3 mb-6">
                    <Users className="w-5 h-5 text-primary-500" />
                    <h3 className="text-lg font-bold text-slate-900">New Onboarding</h3>
                  </div>
                  <div className="space-y-5">
                    {[
                      { name: 'Sameer Khan', role: 'Full Stack Dev', status: 'In Training' },
                      { name: 'Nisha Gupta', role: 'Product Manager', status: 'Pre-boarding' },
                    ].map((hire, idx) => (
                      <div key={idx} className="flex items-center gap-4 group cursor-pointer">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden shadow-sm group-hover:scale-105 transition-transform">
                          <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${hire.name}`} alt="" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-900 truncate">{hire.name}</p>
                          <p className="text-xs text-slate-500 font-medium truncate">{hire.role}</p>
                        </div>
                        <div className="px-3 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-lg uppercase whitespace-nowrap">
                          {hire.status}
                        </div>
                      </div>
                    ))}
                    <button className="w-full py-3 bg-slate-50 hover:bg-slate-100 text-slate-500 text-xs font-bold rounded-xl transition-all border border-dashed border-slate-300">
                      View All New Members
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-8">
              <div className="card-premium bg-slate-900 text-white border-none shadow-2xl shadow-slate-900/20 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-40 h-40 bg-primary-500/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full -ml-16 -mb-16 blur-3xl"></div>
                
                <h3 className="text-lg font-bold mb-8 flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary-500/20 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-primary-400" />
                  </div>
                  Payroll Status
                </h3>
                
                <div className="space-y-8">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Salary Payout</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold text-white">₹14.25L</span>
                      <span className="text-xs font-bold text-emerald-400">+4.2%</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                      <span>Processing Progress</span>
                      <span>90%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: '90%' }}
                        className="h-full bg-primary-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]"
                      ></motion.div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 py-4 border-t border-slate-800">
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase">Employees</p>
                      <p className="text-xl font-bold">42 <span className="text-xs text-slate-500">Total</span></p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase">Paid Date</p>
                      <p className="text-xl font-bold text-primary-400">01 Jun</p>
                    </div>
                  </div>

                  <button 
                    onClick={() => setActiveTab('payroll')}
                    className="w-full bg-primary-500 hover:bg-primary-600 text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-primary-500/20 active:scale-95 flex items-center justify-center gap-2"
                  >
                    Manage Payroll Hub
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="card-premium">
                <h3 className="text-lg font-bold text-slate-900 mb-8">Attendance Today</h3>
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center">
                        <UserCheck className="w-6 h-6 text-emerald-500" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-emerald-900">38 Present</p>
                        <p className="text-xs text-emerald-600 font-medium">92% Attendance</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-rose-50 rounded-2xl border border-rose-100">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center">
                        <UserX className="w-6 h-6 text-rose-500" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-rose-900">4 Absent</p>
                        <p className="text-xs text-rose-600 font-medium">Without leave</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="payroll"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="space-y-8"
          >
            {/* Payroll Analytics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Gross Salary', value: '₹12,45,000', icon: DollarSign, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'Total Deductions', value: '₹1,20,500', icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
                { label: 'Bonuses Paid', value: '₹45,000', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { label: 'Net Payout', value: '₹11,69,500', icon: CreditCard, color: 'text-primary-600', bg: 'bg-primary-50' },
              ].map((stat, idx) => (
                <div key={idx} className="card-premium flex items-start justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                    <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
                  </div>
                  <div className={`p-3 rounded-xl ${stat.bg}`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Payout Distribution Chart */}
              <div className="lg:col-span-2 card-premium">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Department-wise Payout</h3>
                    <p className="text-xs text-slate-500 font-medium mt-1">Salary distribution across departments</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold rounded-xl text-xs border border-slate-100 transition-all">Download Report</button>
                    <button className="px-4 py-2 bg-primary-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-primary-500/20 transition-all">Run May Payroll</button>
                  </div>
                </div>
                
                <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={payrollStats} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                      <XAxis type="number" hide />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        axisLine={false} 
                        tickLine={false}
                        tick={{ fill: '#64748b', fontSize: 13, fontWeight: 600 }}
                        width={100}
                      />
                      <Tooltip 
                        cursor={{ fill: '#f8fafc' }}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                      />
                      <Bar dataKey="amount" radius={[0, 8, 8, 0]} barSize={40}>
                        {payrollStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Salary Breakdown */}
              <div className="card-premium">
                <h3 className="text-xl font-bold text-slate-900 mb-8">Average Salary Components</h3>
                <div className="space-y-8">
                  <div className="h-[200px] w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Basic', value: 60 },
                            { name: 'HRA', value: 20 },
                            { name: 'Allowances', value: 15 },
                            { name: 'PF', value: 5 },
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={8}
                          dataKey="value"
                        >
                          <Cell fill="#3b82f6" />
                          <Cell fill="#10b981" />
                          <Cell fill="#f59e0b" />
                          <Cell fill="#ef4444" />
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                      <p className="text-3xl font-extrabold text-slate-900">₹45k</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Avg CTC</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {[
                      { label: 'Basic Salary', percentage: '60%', color: 'bg-blue-500' },
                      { label: 'House Rent Allowance', percentage: '20%', color: 'bg-emerald-500' },
                      { label: 'Special Allowances', percentage: '15%', color: 'bg-amber-500' },
                      { label: 'Statutory Deductions', percentage: '5%', color: 'bg-rose-500' },
                    ].map((comp, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-2.5 h-2.5 rounded-full ${comp.color}`}></div>
                          <span className="text-sm font-semibold text-slate-600">{comp.label}</span>
                        </div>
                        <span className="text-sm font-bold text-slate-900">{comp.percentage}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Payroll Transactions */}
            <div className="card-premium overflow-hidden">
              <div className="flex items-center justify-between mb-8 px-2">
                <h3 className="text-xl font-bold text-slate-900">Transaction History</h3>
                <div className="flex gap-3">
                  <button className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-400 rounded-xl transition-all border border-slate-100"><Download className="w-5 h-5" /></button>
                  <button className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-400 rounded-xl transition-all border border-slate-100"><FileText className="w-5 h-5" /></button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left py-4 px-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Transaction ID</th>
                      <th className="text-left py-4 px-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Description</th>
                      <th className="text-left py-4 px-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Date</th>
                      <th className="text-left py-4 px-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Amount</th>
                      <th className="text-left py-4 px-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {[
                      { id: 'TXN-4920', desc: 'April 2026 Salary Payout', date: '01 May 2026', amount: '₹14,25,000', status: 'Completed' },
                      { id: 'TXN-4918', desc: 'Bonus Payout Q1', date: '15 Apr 2026', amount: '₹4,50,000', status: 'Completed' },
                      { id: 'TXN-4902', desc: 'March 2026 Salary Payout', date: '01 Apr 2026', amount: '₹13,90,000', status: 'Completed' },
                    ].map((txn, idx) => (
                      <tr key={idx} className="group hover:bg-slate-50 transition-colors">
                        <td className="py-4 px-4 text-sm font-bold text-slate-900">{txn.id}</td>
                        <td className="py-4 px-4 text-sm text-slate-600 font-medium">{txn.desc}</td>
                        <td className="py-4 px-4 text-sm text-slate-500 font-medium">{txn.date}</td>
                        <td className="py-4 px-4 text-sm font-extrabold text-slate-900">{txn.amount}</td>
                        <td className="py-4 px-4">
                          <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-extrabold uppercase tracking-wider">
                            {txn.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HRM;
