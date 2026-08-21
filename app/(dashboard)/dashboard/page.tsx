'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Activity,
  RefreshCw,
  Bell,
  Users,
  UserCheck,
  UserX,
  Clock,
  Calendar,
  Laptop,
  Briefcase,
  Coffee,
  LogOut,
  MapPin,
  Building2,
  ChevronRight,
  Filter,
  Search,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Play,
  CheckSquare,
  ShieldCheck,
  CreditCard,
  Plus,
  FileText,
  DollarSign,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '@/lib/store';
import { getUserRole } from '@/lib/access-control';
import api from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

interface OfficeSummary {
  id: string;
  name: string;
  totalEmployees: number;
  present: number;
  absent: number;
  late: number;
  onLeave: number;
  remote: number;
  working: number;
  checkedOut: number;
}

interface EmployeeAttendanceRow {
  id: string;
  name: string;
  employeeId: string;
  department: string;
  designation: string;
  office: string;
  status: 'Working' | 'On Break' | 'On Visit' | 'Remote' | 'On Leave' | 'Late' | 'Checked Out' | 'Absent';
  punchIn: string;
  breakTime: string;
  punchOut: string;
  workingHours: string;
  lastActivity: string;
  location: string;
}

const mockOffices: OfficeSummary[] = [
  { id: 'off-1', name: 'Head Office (Bandra)', totalEmployees: 52, present: 41, absent: 5, late: 3, onLeave: 2, remote: 1, working: 38, checkedOut: 3 },
  { id: 'off-2', name: 'Navi Mumbai Branch', totalEmployees: 38, present: 31, absent: 3, late: 2, onLeave: 1, remote: 1, working: 28, checkedOut: 3 },
  { id: 'off-3', name: 'Mumbai Central Branch', totalEmployees: 27, present: 22, absent: 2, late: 1, onLeave: 1, remote: 1, working: 20, checkedOut: 2 },
];

const mockEmployeeRows: EmployeeAttendanceRow[] = [
  { id: 'emp-1', name: 'Demo User', employeeId: 'EMP001', department: 'Engineering & IT', designation: 'Senior Developer', office: 'Head Office (Bandra)', status: 'Working', punchIn: '09:12 AM', breakTime: '12:45 PM', punchOut: '—', workingHours: '7h 20m', lastActivity: '2 min ago', location: 'Office GPS' },
  { id: 'emp-2', name: 'Rahul Sharma', employeeId: 'EMP002', department: 'Sales & BD', designation: 'Sales Manager', office: 'Navi Mumbai Branch', status: 'On Break', punchIn: '09:04 AM', breakTime: '01:10 PM', punchOut: '—', workingHours: '5h 42m', lastActivity: '1 min ago', location: 'Client Visit' },
  { id: 'emp-3', name: 'Priya Singh', employeeId: 'EMP003', department: 'HR & Ops', designation: 'HR Executive', office: 'Head Office (Bandra)', status: 'Checked Out', punchIn: '09:21 AM', breakTime: '01:05 PM', punchOut: '06:18 PM', workingHours: '8h 02m', lastActivity: '20 min ago', location: 'Office' },
  { id: 'emp-4', name: 'Sneha Gupta', employeeId: 'EMP004', department: 'Sales & BD', designation: 'Account Manager', office: 'Mumbai Central Branch', status: 'On Visit', punchIn: '09:30 AM', breakTime: '—', punchOut: '—', workingHours: '4h 15m', lastActivity: '5 min ago', location: 'Acme Corp' },
  { id: 'emp-5', name: 'Amit Verma', employeeId: 'EMP005', department: 'Engineering & IT', designation: 'DevOps Engineer', office: 'Head Office (Bandra)', status: 'Remote', punchIn: '09:00 AM', breakTime: '01:30 PM', punchOut: '—', workingHours: '6h 50m', lastActivity: 'Just now', location: 'Home WFH' },
];

const mockPunchIns = [
  { name: 'Demo User', office: 'Head Office', time: '09:12 AM', location: 'Office GPS', status: 'On Time' },
  { name: 'Rahul Sharma', office: 'Navi Mumbai', time: '09:26 AM', location: 'Office GPS', status: 'Late by 26m' },
  { name: 'Sneha Gupta', office: 'Mumbai Central', time: '09:05 AM', location: 'Office GPS', status: 'On Time' },
];

const mockPunchOuts = [
  { name: 'Priya Singh', office: 'Head Office', time: '06:18 PM', hours: '8h 02m', breakTime: '45m', status: 'Completed' },
  { name: 'Vikram Mehta', office: 'Navi Mumbai', time: '06:30 PM', hours: '8h 30m', breakTime: '30m', status: 'Completed' },
];

const mockActivities = [
  { time: '09:42 AM', text: 'Demo User punched in', office: 'Head Office' },
  { time: '09:45 AM', text: 'Rahul Sharma started break', office: 'Navi Mumbai Branch' },
  { time: '10:02 AM', text: 'Priya Singh started client visit to Acme Corp', office: 'Mumbai Central Branch' },
  { time: '10:15 AM', text: 'Amit Verma requested WFH approval', office: 'Head Office' },
];

const mockDepartments = [
  { name: 'Engineering & IT', total: 32, present: 27, absent: 2, late: 1, remote: 1, onLeave: 1, working: 24 },
  { name: 'Sales & BD', total: 45, present: 36, absent: 4, late: 2, remote: 2, onLeave: 1, working: 31 },
  { name: 'HR & Operations', total: 12, present: 11, absent: 0, late: 0, remote: 0, onLeave: 1, working: 10 },
  { name: 'Finance & Accounts', total: 18, present: 15, absent: 1, late: 1, remote: 0, onLeave: 1, working: 13 },
];

export default function LiveHRDashboardPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const customerId = useAuthStore((state) => state.customerId);
  const role = getUserRole(user);

  const [selectedOffice, setSelectedOffice] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // Fetch Live Metrics from Backend
  const { data: dashboardData, refetch, isFetching } = useQuery({
    queryKey: ['admin-dashboard-live', customerId, selectedOffice],
    queryFn: async () => {
      try {
        const res: any = await api.get('/admin/dashboard/live', {
          params: {
            customerId: customerId || undefined,
            officeId: selectedOffice !== 'all' ? selectedOffice : undefined,
          },
        });
        return res?.data || res;
      } catch (err) {
        return null;
      }
    },
    refetchInterval: autoRefresh ? 15000 : false,
  });

  // Fetch Offices from Backend
  const { data: officesData } = useQuery({
    queryKey: ['admin-dashboard-offices', customerId],
    queryFn: async () => {
      try {
        const res: any = await api.get('/admin/dashboard/offices', {
          params: { customerId: customerId || undefined },
        });
        return res?.data || res;
      } catch (err) {
        return null;
      }
    },
  });

  useEffect(() => {
    setLastUpdated(new Date().toLocaleTimeString('en-US', { hour12: true }));
  }, [dashboardData]);

  const handleManualRefresh = () => {
    refetch();
    setLastUpdated(new Date().toLocaleTimeString('en-US', { hour12: true }));
    toast.success('Live dashboard metrics refreshed!');
  };

  const offices: OfficeSummary[] = dashboardData?.offices || mockOffices;
  const summary = dashboardData?.summary || {
    totalEmployees: 117,
    present: 94,
    absent: 10,
    late: 6,
    onLeave: 4,
    remote: 3,
    working: 86,
    onBreak: 8,
    checkedOut: 8,
    locationTrackingActive: 94,
  };

  const officeOptions = officesData || [
    { id: 'all', name: 'All Offices & Branches' },
    { id: 'off-1', name: 'Head Office (Bandra)' },
    { id: 'off-2', name: 'Navi Mumbai Branch' },
    { id: 'off-3', name: 'Mumbai Central Branch' },
  ];

  const filteredEmployees = mockEmployeeRows.filter((e) => {
    const matchesOffice = selectedOffice === 'all' || e.office.toLowerCase().includes(selectedOffice.toLowerCase());
    const matchesSearch =
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.department.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesOffice && matchesSearch;
  });

  // =========================================================================
  // 1. SUPER ADMIN DASHBOARD VIEW
  // =========================================================================
  if (role === 'Super Admin') {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 rounded-3xl text-white shadow-lg border border-indigo-900">
          <div>
            <div className="flex items-center gap-2 text-indigo-300 font-extrabold text-xs uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4 text-indigo-400" /> PLATFORM SUPER ADMIN OVERVIEW
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              QuikBoom SaaS Platform Command Center
            </h1>
            <p className="text-xs md:text-sm text-slate-200 mt-1 font-medium">
              Multi-customer architecture health, monthly recurring revenue, and global subscription provisioning.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/super-admin')}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black transition-all shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Customer Management
            </button>
          </div>
        </div>

        {/* Super Admin Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">Total Active Customers</span>
            <p className="text-2xl font-black text-slate-900 mt-2">42</p>
            <span className="text-[11px] font-bold text-[#1AA14D] mt-1">38 Active • 4 Free Trials</span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">Monthly Recurring Revenue</span>
            <p className="text-2xl font-black text-indigo-700 mt-2">₹8,45,000</p>
            <span className="text-[11px] font-bold text-indigo-600 mt-1">+14.2% Growth MoM</span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">Global SaaS Users</span>
            <p className="text-2xl font-black text-slate-900 mt-2">3,420</p>
            <span className="text-[11px] font-bold text-slate-500 mt-1">Across 42 Organizations</span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">SaaS Platform Uptime</span>
            <p className="text-2xl font-black text-[#23C45E] mt-2">99.98%</p>
            <span className="text-[11px] font-bold text-[#1AA14D] mt-1">Zero Outages Recorded</span>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 2. EMPLOYEE DASHBOARD VIEW
  // =========================================================================
  if (role === 'Employee') {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-900 via-emerald-800 to-slate-900 p-6 sm:p-8 rounded-3xl text-white shadow-lg border border-emerald-800">
          <div>
            <div className="flex items-center gap-2 text-emerald-300 font-extrabold text-xs uppercase tracking-wider mb-1">
              <Clock className="w-4 h-4 text-emerald-400" /> EMPLOYEE SELF-SERVICE PORTAL
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              Welcome Back, {user?.firstName || 'Employee'}!
            </h1>
            <p className="text-xs md:text-sm text-slate-200 mt-1 font-medium">
              Today is {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}. Check your shift status, leave balances, and salary slips below.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/attendance')}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#23C45E] hover:bg-[#1AA14D] text-white rounded-xl text-xs font-black transition-all shadow-md cursor-pointer"
            >
              <Clock className="w-4 h-4" /> Punch In / Attendance
            </button>
          </div>
        </div>

        {/* Employee Personal Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">Today's Shift</span>
            <p className="text-xl font-black text-slate-900 mt-2">09:00 AM – 06:00 PM</p>
            <span className="text-[11px] font-bold text-[#1AA14D] mt-1">Punched in at 09:12 AM</span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">Total Hours Today</span>
            <p className="text-2xl font-black text-slate-900 mt-2">7h 20m</p>
            <span className="text-[11px] font-bold text-blue-600 mt-1">Standard: 8h 00m</span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">Leave Balance</span>
            <p className="text-2xl font-black text-purple-700 mt-2">14 Days</p>
            <span className="text-[11px] font-bold text-purple-600 mt-1">Casual: 6 • Sick: 8</span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">Latest Salary Slip</span>
            <p className="text-xl font-black text-[#1AA14D] mt-2">₹78,450</p>
            <Link href="/salary-slips" className="text-[11px] font-bold text-[#23C45E] hover:underline mt-1">
              View Slip (July 2026) →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 3. MANAGER DASHBOARD VIEW
  // =========================================================================
  if (role === 'Manager') {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-900 via-emerald-800 to-slate-900 p-6 sm:p-8 rounded-3xl text-white shadow-lg border border-emerald-800">
          <div>
            <div className="flex items-center gap-2 text-emerald-300 font-extrabold text-xs uppercase tracking-wider mb-1">
              <Users className="w-4 h-4 text-emerald-400" /> TEAM MANAGEMENT DASHBOARD
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              Team Operations & Field Monitoring
            </h1>
            <p className="text-xs md:text-sm text-slate-200 mt-1 font-medium">
              Monitor team attendance, review pending leave requests, and manage task allocations.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/leaves')}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#23C45E] hover:bg-[#1AA14D] text-white rounded-xl text-xs font-black transition-all shadow-md cursor-pointer"
            >
              <Calendar className="w-4 h-4" /> Pending Approvals (3)
            </button>
          </div>
        </div>

        {/* Manager Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">Total Team Members</span>
            <p className="text-2xl font-black text-slate-900 mt-2">18</p>
            <span className="text-[11px] font-bold text-[#1AA14D] mt-1">15 Present • 2 Remote • 1 Leave</span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">On Client Visits</span>
            <p className="text-2xl font-black text-blue-700 mt-2">4 Active</p>
            <span className="text-[11px] font-bold text-blue-600 mt-1">Acme Corp, Reliance Hub</span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">Pending Leave Requests</span>
            <p className="text-2xl font-black text-amber-700 mt-2">3 Requests</p>
            <span className="text-[11px] font-bold text-amber-700 mt-1">Awaiting Approval</span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">Team Tasks Completed</span>
            <p className="text-2xl font-black text-[#23C45E] mt-2">84%</p>
            <span className="text-[11px] font-bold text-[#1AA14D] mt-1">32/38 Tasks Done this Sprint</span>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 4. TENANT OWNER / HR MANAGER / HR EXECUTIVE LIVE WORKFORCE DASHBOARD
  // =========================================================================
  return (
    <div className="space-y-6">
      {/* Dashboard Live Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-900 via-emerald-800 to-slate-900 p-6 rounded-3xl text-white shadow-lg border border-emerald-800">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-black uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" /> ● Live Workforce Stream
            </span>
            <span className="text-xs text-slate-300 font-bold">Auto Refresh: {autoRefresh ? 'ON' : 'OFF'}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
            Good Morning, HR Team
          </h1>
          <p className="text-xs text-slate-200 mt-1 font-medium">
            Real-time operational monitoring of office attendance, field visits, and working shifts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="text-right hidden sm:block mr-2">
            <span className="text-[10px] uppercase font-extrabold text-emerald-300 tracking-wider">Last Updated</span>
            <p className="text-sm font-black text-white">{lastUpdated}</p>
          </div>

          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-2 rounded-xl text-xs font-extrabold transition-all border ${
              autoRefresh ? 'bg-[#23C45E] text-white border-[#1AA14D]' : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            Auto Refresh {autoRefresh ? 'ON' : 'OFF'}
          </button>

          <button
            onClick={handleManualRefresh}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl border border-slate-700 transition-all cursor-pointer"
            title="Manual Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Office Selector Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Building2 className="w-5 h-5 text-[#23C45E]" />
          <span className="text-xs font-black text-slate-800 uppercase tracking-wider">Office Filter:</span>
          <select
            value={selectedOffice}
            onChange={(e) => setSelectedOffice(e.target.value)}
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
          >
            {officeOptions.map((opt: any) => (
              <option key={opt.id} value={opt.id}>
                {opt.name}
              </option>
            ))}
          </select>
        </div>

        <div className="relative flex-1 sm:max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search employee, ID, department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
          />
        </div>
      </div>

      {/* Top Live Summary Cards - Fully Responsive Grid without Overflows */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 xl:grid-cols-10 gap-3">
        <div onClick={() => router.push('/attendance')} className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs cursor-pointer hover:border-[#23C45E] transition-all min-w-0 flex flex-col justify-between">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 truncate">Employees</span>
          <p className="text-xl font-black text-slate-900 mt-1">{summary.totalEmployees}</p>
        </div>
        <div onClick={() => router.push('/attendance?status=present')} className="bg-white p-3.5 rounded-2xl border border-[#23C45E]/30 bg-[#E8F9EE]/30 shadow-xs cursor-pointer hover:border-[#23C45E] transition-all min-w-0 flex flex-col justify-between">
          <span className="text-[10px] font-extrabold uppercase text-[#1AA14D] truncate">Present</span>
          <p className="text-xl font-black text-[#1AA14D] mt-1">{summary.present}</p>
        </div>
        <div onClick={() => router.push('/attendance?status=absent')} className="bg-white p-3.5 rounded-2xl border border-rose-200 bg-rose-50/20 shadow-xs cursor-pointer hover:border-rose-500 transition-all min-w-0 flex flex-col justify-between">
          <span className="text-[10px] font-extrabold uppercase text-rose-700 truncate">Absent</span>
          <p className="text-xl font-black text-rose-700 mt-1">{summary.absent}</p>
        </div>
        <div onClick={() => router.push('/attendance?status=late')} className="bg-white p-3.5 rounded-2xl border border-amber-200 bg-amber-50/20 shadow-xs cursor-pointer hover:border-amber-500 transition-all min-w-0 flex flex-col justify-between">
          <span className="text-[10px] font-extrabold uppercase text-amber-700 truncate">Late</span>
          <p className="text-xl font-black text-amber-700 mt-1">{summary.late}</p>
        </div>
        <div onClick={() => router.push('/leaves')} className="bg-white p-3.5 rounded-2xl border border-purple-200 bg-purple-50/20 shadow-xs cursor-pointer hover:border-purple-500 transition-all min-w-0 flex flex-col justify-between">
          <span className="text-[10px] font-extrabold uppercase text-purple-700 truncate">On Leave</span>
          <p className="text-xl font-black text-purple-700 mt-1">{summary.onLeave}</p>
        </div>
        <div onClick={() => router.push('/remote-work')} className="bg-white p-3.5 rounded-2xl border border-indigo-200 bg-indigo-50/20 shadow-xs cursor-pointer hover:border-indigo-500 transition-all min-w-0 flex flex-col justify-between">
          <span className="text-[10px] font-extrabold uppercase text-indigo-700 truncate">Remote</span>
          <p className="text-xl font-black text-indigo-700 mt-1">{summary.remote}</p>
        </div>
        <div onClick={() => router.push('/attendance?status=working')} className="bg-white p-3.5 rounded-2xl border border-[#23C45E]/30 shadow-xs cursor-pointer hover:border-[#23C45E] transition-all min-w-0 flex flex-col justify-between">
          <span className="text-[10px] font-extrabold uppercase text-[#1AA14D] truncate">Working Now</span>
          <p className="text-xl font-black text-[#1AA14D] mt-1">{summary.working}</p>
        </div>
        <div onClick={() => router.push('/attendance?status=break')} className="bg-white p-3.5 rounded-2xl border border-amber-200 shadow-xs cursor-pointer hover:border-amber-500 transition-all min-w-0 flex flex-col justify-between">
          <span className="text-[10px] font-extrabold uppercase text-amber-800 truncate">On Break</span>
          <p className="text-xl font-black text-amber-800 mt-1">{summary.onBreak}</p>
        </div>
        <div onClick={() => router.push('/attendance?status=checkout')} className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs cursor-pointer hover:border-slate-500 transition-all min-w-0 flex flex-col justify-between">
          <span className="text-[10px] font-extrabold uppercase text-slate-500 truncate">Checked Out</span>
          <p className="text-xl font-black text-slate-700 mt-1">{summary.checkedOut}</p>
        </div>
        <div onClick={() => router.push('/geo-tracking')} className="bg-white p-3.5 rounded-2xl border border-[#23C45E]/30 shadow-xs cursor-pointer hover:border-[#23C45E] transition-all min-w-0 flex flex-col justify-between">
          <span className="text-[10px] font-extrabold uppercase text-[#23C45E] truncate">Geo Active</span>
          <p className="text-xl font-black text-[#23C45E] mt-1">{summary.locationTrackingActive}</p>
        </div>
      </div>

      {/* Office-Wise Cards Grid - Responsive Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {offices.map((off) => (
          <div key={off.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-slate-900 text-sm truncate">{off.name}</h3>
              <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-md bg-[#E8F9EE] text-[#1AA14D]">
                {off.totalEmployees} Staff
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400">Present</span>
                <p className="font-black text-[#1AA14D] text-sm">{off.present}</p>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400">Working</span>
                <p className="font-black text-slate-900 text-sm">{off.working}</p>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400">Absent</span>
                <p className="font-black text-rose-600 text-sm">{off.absent}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Real-Time Live Employee Attendance Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-black text-slate-900 text-sm">Live Attendance Stream</h3>
            <p className="text-xs text-slate-400 font-medium">Real-time GPS status and working duration</p>
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-xs text-left min-w-[700px]">
            <thead className="bg-slate-50 text-slate-500 font-black uppercase text-[10px] tracking-wider border-b border-slate-100">
              <tr>
                <th className="p-4">Staff Member</th>
                <th className="p-4">Department</th>
                <th className="p-4">Office Branch</th>
                <th className="p-4">Status</th>
                <th className="p-4">Punch In</th>
                <th className="p-4">Working Hours</th>
                <th className="p-4">Location GPS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
              {filteredEmployees.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="p-4">
                    <p className="font-extrabold text-slate-900">{e.name}</p>
                    <p className="text-[10px] text-slate-400">{e.employeeId} • {e.designation}</p>
                  </td>
                  <td className="p-4 text-slate-600">{e.department}</td>
                  <td className="p-4 text-slate-500">{e.office}</td>
                  <td className="p-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                        e.status === 'Working'
                          ? 'bg-[#E8F9EE] text-[#1AA14D]'
                          : e.status === 'On Break'
                          ? 'bg-amber-50 text-amber-700'
                          : e.status === 'On Visit'
                          ? 'bg-blue-50 text-blue-700'
                          : e.status === 'Remote'
                          ? 'bg-purple-50 text-purple-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {e.status}
                    </span>
                  </td>
                  <td className="p-4 font-bold text-slate-900">{e.punchIn}</td>
                  <td className="p-4 font-extrabold text-[#1AA14D]">{e.workingHours}</td>
                  <td className="p-4">
                    <span className="flex items-center gap-1 text-slate-500">
                      <MapPin className="w-3.5 h-3.5 text-[#23C45E]" />
                      {e.location}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
