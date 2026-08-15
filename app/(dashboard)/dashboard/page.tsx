'use client';

import React from 'react';
import {
  TrendingUp,
  Users,
  DollarSign,
  Briefcase,
  CheckCircle,
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
} from 'recharts';

const data = [
  { month: 'Jan', revenue: 45000, leads: 120 },
  { month: 'Feb', revenue: 52000, leads: 140 },
  { month: 'Mar', revenue: 61000, leads: 175 },
  { month: 'Apr', revenue: 58000, leads: 160 },
  { month: 'May', revenue: 74000, leads: 210 },
  { month: 'Jun', revenue: 89000, leads: 260 },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#0F172A]">Executive CRM Dashboard</h1>
        <p className="text-sm text-[#64748B]">Real-time overview of leads, revenue, and sales pipeline performance.</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B] uppercase">Total Revenue</span>
            <div className="w-10 h-10 rounded-xl bg-[#CCFBF1] text-[#0F766E] flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-[#0F172A]">₹3,79,000</p>
            <p className="text-xs text-[#16A34A] flex items-center gap-1 font-medium mt-1">
              <TrendingUp className="w-3.5 h-3.5" /> +18.4% from last month
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B] uppercase">Active Leads</span>
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#2563EB] flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-[#0F172A]">1,065</p>
            <p className="text-xs text-[#2563EB] flex items-center gap-1 font-medium mt-1">
              <ArrowUpRight className="w-3.5 h-3.5" /> +12.1% new opportunities
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B] uppercase">Deals Won</span>
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
              <Briefcase className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-[#0F172A]">48 Deals</p>
            <p className="text-xs text-purple-600 flex items-center gap-1 font-medium mt-1">
              68.4% Win Rate
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B] uppercase">Tasks Completed</span>
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-[#F59E0B] flex items-center justify-center">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-[#0F172A]">312 / 340</p>
            <p className="text-xs text-[#F59E0B] flex items-center gap-1 font-medium mt-1">
              91.7% Completion rate
            </p>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-xs">
        <h2 className="text-lg font-bold text-[#0F172A] mb-4">Revenue Growth (2026)</h2>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="month" stroke="#64748B" />
              <YAxis stroke="#64748B" />
              <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '12px', color: '#0F172A' }} />
              <Bar dataKey="revenue" fill="#0F766E" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
