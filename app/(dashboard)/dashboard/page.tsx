'use client';

import React, { useState } from 'react';
import {
  TrendingUp,
  Users,
  DollarSign,
  Briefcase,
  CheckCircle,
  Clock,
  Calendar,
  Laptop,
  MapPin,
  Plus,
  Filter,
  Download,
  Building2,
  AlertCircle,
  Activity,
  ArrowUpRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';

const revenueData = [
  { month: 'Jan', revenue: 450000, leads: 120 },
  { month: 'Feb', revenue: 520000, leads: 140 },
  { month: 'Mar', revenue: 610000, leads: 175 },
  { month: 'Apr', revenue: 580000, leads: 160 },
  { month: 'May', revenue: 740000, leads: 210 },
  { month: 'Jun', revenue: 890000, leads: 260 },
];

const attendancePie = [
  { name: 'Present', value: 210, color: '#10B981' },
  { name: 'On Leave', value: 18, color: '#F59E0B' },
  { name: 'Remote', value: 14, color: '#6366F1' },
  { name: 'Absent', value: 8, color: '#EF4444' },
];

const recentActivities = [
  { id: 1, user: 'Rahul Sharma', action: 'Punched In (Office - Bandra)', time: '09:02 AM', category: 'Attendance', status: 'success' },
  { id: 2, user: 'Priya Singh', action: 'Applied 3 days Casual Leave', time: '09:35 AM', category: 'Leave', status: 'warning' },
  { id: 3, user: 'Amit Verma', action: 'Created Lead: Apex Tech Solutions (₹4,50,000)', time: '10:15 AM', category: 'CRM', status: 'info' },
  { id: 4, user: 'Sneha Gupta', action: 'Completed Field Visit to Acme Corp', time: '11:30 AM', category: 'Visit', status: 'success' },
  { id: 5, user: 'Vikram Mehta', action: 'Generated January Salary Slips (250 employees)', time: '12:10 PM', category: 'Payroll', status: 'info' },
];

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'hrm' | 'crm'>('overview');

  return (
    <div className="space-y-8">
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-900 via-emerald-800 to-slate-900 p-6 sm:p-8 rounded-3xl text-white shadow-lg border border-emerald-800">
        <div>
          <div className="flex items-center gap-2 text-emerald-300 font-extrabold text-xs uppercase tracking-wider mb-1">
            <Activity className="w-4 h-4 text-emerald-400 animate-pulse" /> Live Enterprise Executive Dashboard
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
            QUIKBOOM CRM + HRM Overview
          </h1>
          <p className="text-xs md:text-sm text-slate-200 mt-1 font-medium">
            Monitor real-time employee attendance, sales performance, field visits, and payroll KPIs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold transition-all shadow-md cursor-pointer">
            <Plus className="w-4 h-4" /> Add Employee / Lead
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/90 hover:bg-slate-800 text-slate-100 border border-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer">
            <Download className="w-4 h-4" /> Export Summary
          </button>
        </div>
      </div>

      {/* Tabs Filter */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'overview'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Executive Overview
        </button>
        <button
          onClick={() => setActiveTab('hrm')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'hrm'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          HRM & Attendance
        </button>
        <button
          onClick={() => setActiveTab('crm')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'crm'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Sales & CRM
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Employees */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Workforce</span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-extrabold text-slate-900">250 Employees</p>
            <p className="text-xs text-emerald-600 flex items-center gap-1 font-semibold mt-1">
              <ArrowUpRight className="w-3.5 h-3.5" /> +12 hired this month
            </p>
          </div>
        </div>

        {/* Present Today */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Present Today</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-extrabold text-slate-900">210 / 250</p>
            <p className="text-xs text-emerald-600 flex items-center gap-1 font-semibold mt-1">
              84% Attendance rate today
            </p>
          </div>
        </div>

        {/* Active Pipeline Value */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Pipeline</span>
            <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-extrabold text-slate-900">₹38,70,000</p>
            <p className="text-xs text-indigo-600 flex items-center gap-1 font-semibold mt-1">
              42 Deals in negotiation
            </p>
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Approvals</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-extrabold text-slate-900">10 Requests</p>
            <p className="text-xs text-amber-600 flex items-center gap-1 font-semibold mt-1">
              5 Leaves, 3 Remote, 2 Visits
            </p>
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue & Lead Growth Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-slate-900">Revenue & Lead Conversion Trend</h2>
              <p className="text-xs text-slate-500">Monthly revenue (₹) vs new leads generated</p>
            </div>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
              H1 2026
            </span>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} />
                <YAxis stroke="#94A3B8" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#1E293B',
                    borderRadius: '12px',
                    color: '#FFFFFF',
                    fontSize: '12px',
                  }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#4F46E5" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Today's Attendance Distribution Pie */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Workforce Status Today</h2>
            <p className="text-xs text-slate-500">Breakdown of 250 registered staff</p>
          </div>

          <div className="h-52 w-full my-4 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={attendancePie}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {attendancePie.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs pt-3 border-t border-slate-100">
            {attendancePie.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-slate-600 font-medium">{item.name}:</span>
                <span className="font-bold text-slate-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity Log */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-900">Recent Operational Activity</h2>
          <span className="text-xs text-slate-500">Real-time system events</span>
        </div>

        <div className="divide-y divide-slate-100">
          {recentActivities.map((act) => (
            <div key={act.id} className="py-3 flex items-center justify-between hover:bg-slate-50/80 px-2 rounded-xl transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                  {act.user[0]}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">{act.user}</p>
                  <p className="text-xs text-slate-600">{act.action}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                  {act.category}
                </span>
                <span className="text-[11px] text-slate-400 font-medium">{act.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
