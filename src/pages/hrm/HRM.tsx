import React from 'react';
import { 
  Calendar, 
  Briefcase, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Plus, 
  Users, 
  DollarSign,
  ChevronRight,
  UserCheck,
  UserX
} from 'lucide-react';
import { motion } from 'framer-motion';

const leaveRequests = [
  { id: 'LR-001', name: 'Priya Sharma', type: 'Medical Leave', duration: '3 Days', date: '18-20 May', status: 'Pending' },
  { id: 'LR-002', name: 'Rahul Verma', type: 'Casual Leave', duration: '1 Day', date: '22 May', status: 'Approved' },
  { id: 'LR-003', name: 'Anjali Gupta', type: 'Annual Leave', duration: '5 Days', date: '01-05 Jun', status: 'Rejected' },
];

const HRM: React.FC = () => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">HRM Module</h1>
          <p className="text-sm text-slate-500 font-medium">Manage leaves, payroll and employee performance</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all flex items-center gap-2 text-sm shadow-sm">
            <Calendar className="w-4 h-4" />
            Holiday Calendar
          </button>
          <button className="btn-primary py-2 px-4 shadow-lg shadow-primary-500/20">
            <DollarSign className="w-5 h-5" />
            Run Payroll
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Leave Requests */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card-premium">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900">Pending Leave Requests</h3>
              <button className="text-xs font-bold text-primary-600 hover:underline">View All</button>
            </div>
            
            <div className="space-y-4">
              {leaveRequests.map((request, idx) => (
                <motion.div 
                  key={request.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex flex-col md:flex-row md:items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100 gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 overflow-hidden">
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${request.name}`} alt="" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{request.name}</p>
                      <p className="text-xs text-slate-500 font-medium">{request.type} • {request.duration}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-right hidden md:block">
                      <p className="text-sm font-bold text-slate-900">{request.date}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Requested on 12 May</p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {request.status === 'Pending' ? (
                        <>
                          <button className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors"><CheckCircle2 className="w-5 h-5" /></button>
                          <button className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors"><XCircle className="w-5 h-5" /></button>
                        </>
                      ) : (
                        <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                          request.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                        }`}>
                          {request.status}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card-premium">
              <h3 className="text-lg font-bold text-slate-900 mb-6">Upcoming Holidays</h3>
              <div className="space-y-4">
                {[
                  { name: 'Buddha Purnima', date: '23 May 2026', day: 'Saturday' },
                  { name: 'Eid al-Adha', date: '17 Jun 2026', day: 'Wednesday' },
                ].map((holiday, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                    <div className="w-12 h-12 bg-white rounded-xl border border-slate-200 flex flex-col items-center justify-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase leading-none">{holiday.date.split(' ')[1]}</span>
                      <span className="text-sm font-bold text-slate-900">{holiday.date.split(' ')[0]}</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{holiday.name}</p>
                      <p className="text-xs text-slate-500 font-medium">{holiday.day}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card-premium">
              <h3 className="text-lg font-bold text-slate-900 mb-6">Recent Hires</h3>
              <div className="space-y-4">
                {[
                  { name: 'Sameer Khan', role: 'Full Stack Dev', date: 'Joined 2 days ago' },
                  { name: 'Nisha Gupta', role: 'Product Manager', date: 'Joined 1 week ago' },
                ].map((hire, idx) => (
                  <div key={idx} className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 overflow-hidden">
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${hire.name}`} alt="" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{hire.name}</p>
                      <p className="text-xs text-slate-500 font-medium">{hire.role} • {hire.date}</p>
                    </div>
                    <ChevronRight className="ml-auto w-4 h-4 text-slate-400" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Payroll Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card-premium bg-slate-900 text-white border-none shadow-xl shadow-slate-900/20 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/20 rounded-full -mr-16 -mt-16 blur-2xl"></div>
            
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary-400" />
              Payroll Overview
            </h3>
            
            <div className="space-y-6">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Monthly Payout</p>
                <p className="text-3xl font-extrabold text-white">₹14,25,000</p>
              </div>
              
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-primary-500 w-3/4 rounded-full"></div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Paid Employees</p>
                  <p className="text-lg font-bold">38/42</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Next Pay Date</p>
                  <p className="text-lg font-bold text-primary-400">01 Jun</p>
                </div>
              </div>

              <button className="w-full bg-primary-500 hover:bg-primary-600 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-primary-500/20 active:scale-95">
                Generate Pay Slips
              </button>
            </div>
          </div>

          <div className="card-premium">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Team Presence Stats</h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                    <UserCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Present Today</p>
                    <p className="text-xs text-slate-500 font-medium">38 Employees</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-emerald-600">92%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-slate-400">
                  <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
                    <UserX className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">On Leave</p>
                    <p className="text-xs text-slate-500 font-medium">4 Employees</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-rose-600">8%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HRM;
