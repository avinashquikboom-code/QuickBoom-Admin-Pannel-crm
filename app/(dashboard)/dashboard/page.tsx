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
} from 'lucide-react';
import { toast } from 'react-hot-toast';

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
  { id: 'emp-1', name: 'Avinash Magar', employeeId: 'EMP001', department: 'Engineering & IT', designation: 'Senior Developer', office: 'Head Office (Bandra)', status: 'Working', punchIn: '09:12 AM', breakTime: '12:45 PM', punchOut: '—', workingHours: '7h 20m', lastActivity: '2 min ago', location: 'Office GPS' },
  { id: 'emp-2', name: 'Rahul Sharma', employeeId: 'EMP002', department: 'Sales & BD', designation: 'Sales Manager', office: 'Navi Mumbai Branch', status: 'On Break', punchIn: '09:04 AM', breakTime: '01:10 PM', punchOut: '—', workingHours: '5h 42m', lastActivity: '1 min ago', location: 'Client Visit' },
  { id: 'emp-3', name: 'Priya Singh', employeeId: 'EMP003', department: 'HR & Ops', designation: 'HR Executive', office: 'Head Office (Bandra)', status: 'Checked Out', punchIn: '09:21 AM', breakTime: '01:05 PM', punchOut: '06:18 PM', workingHours: '8h 02m', lastActivity: '20 min ago', location: 'Office' },
  { id: 'emp-4', name: 'Sneha Gupta', employeeId: 'EMP004', department: 'Sales & BD', designation: 'Account Manager', office: 'Mumbai Central Branch', status: 'On Visit', punchIn: '09:30 AM', breakTime: '—', punchOut: '—', workingHours: '4h 15m', lastActivity: '5 min ago', location: 'Acme Corp' },
  { id: 'emp-5', name: 'Amit Verma', employeeId: 'EMP005', department: 'Engineering & IT', designation: 'DevOps Engineer', office: 'Head Office (Bandra)', status: 'Remote', punchIn: '09:00 AM', breakTime: '01:30 PM', punchOut: '—', workingHours: '6h 50m', lastActivity: 'Just now', location: 'Home WFH' },
];

const mockPunchIns = [
  { name: 'Avinash Magar', office: 'Head Office', time: '09:12 AM', location: 'Office GPS', status: 'On Time' },
  { name: 'Rahul Sharma', office: 'Navi Mumbai', time: '09:26 AM', location: 'Office GPS', status: 'Late by 26m' },
  { name: 'Sneha Gupta', office: 'Mumbai Central', time: '09:05 AM', location: 'Office GPS', status: 'On Time' },
];

const mockPunchOuts = [
  { name: 'Priya Singh', office: 'Head Office', time: '06:18 PM', hours: '8h 02m', breakTime: '45m', status: 'Completed' },
  { name: 'Vikram Mehta', office: 'Navi Mumbai', time: '06:30 PM', hours: '8h 30m', breakTime: '30m', status: 'Completed' },
];

const mockActivities = [
  { time: '09:42 AM', text: 'Avinash Magar punched in', office: 'Head Office' },
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
  const [selectedOffice, setSelectedOffice] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  useEffect(() => {
    setLastUpdated(new Date().toLocaleTimeString('en-US', { hour12: true }));
    const interval = setInterval(() => {
      if (autoRefresh) {
        setLastUpdated(new Date().toLocaleTimeString('en-US', { hour12: true }));
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const handleManualRefresh = () => {
    setLastUpdated(new Date().toLocaleTimeString('en-US', { hour12: true }));
    toast.success('Live dashboard metrics refreshed!');
  };

  const filteredEmployees = mockEmployeeRows.filter((e) => {
    const matchesOffice = selectedOffice === 'all' || e.office.toLowerCase().includes(selectedOffice.toLowerCase());
    const matchesSearch =
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.department.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesOffice && matchesSearch;
  });

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
              autoRefresh ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-slate-800 text-slate-300 border-slate-700'
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
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Building2 className="w-5 h-5 text-emerald-600" />
          <span className="text-xs font-black text-slate-800 uppercase tracking-wider">Office Filter:</span>
          <select
            value={selectedOffice}
            onChange={(e) => setSelectedOffice(e.target.value)}
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Offices & Branches (117 Total)</option>
            <option value="Bandra">Head Office — Bandra (52 Staff)</option>
            <option value="Navi Mumbai">Navi Mumbai Branch (38 Staff)</option>
            <option value="Mumbai Central">Mumbai Central Branch (27 Staff)</option>
          </select>
        </div>

        <div className="relative flex-1 sm:max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search employee, ID, department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Top Live Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-3 overflow-x-auto">
        <div onClick={() => router.push('/attendance')} className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs cursor-pointer hover:border-emerald-500 transition-all">
          <span className="text-[10px] font-extrabold uppercase text-slate-400">Employees</span>
          <p className="text-xl font-black text-slate-900 mt-1">117</p>
        </div>
        <div onClick={() => router.push('/attendance?status=present')} className="bg-white p-3.5 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-xs cursor-pointer hover:border-emerald-500 transition-all">
          <span className="text-[10px] font-extrabold uppercase text-emerald-700">Present</span>
          <p className="text-xl font-black text-emerald-700 mt-1">94</p>
        </div>
        <div onClick={() => router.push('/attendance?status=absent')} className="bg-white p-3.5 rounded-2xl border border-rose-200 bg-rose-50/20 shadow-xs cursor-pointer hover:border-rose-500 transition-all">
          <span className="text-[10px] font-extrabold uppercase text-rose-700">Absent</span>
          <p className="text-xl font-black text-rose-700 mt-1">10</p>
        </div>
        <div onClick={() => router.push('/attendance?status=late')} className="bg-white p-3.5 rounded-2xl border border-amber-200 bg-amber-50/20 shadow-xs cursor-pointer hover:border-amber-500 transition-all">
          <span className="text-[10px] font-extrabold uppercase text-amber-700">Late</span>
          <p className="text-xl font-black text-amber-700 mt-1">6</p>
        </div>
        <div onClick={() => router.push('/leaves')} className="bg-white p-3.5 rounded-2xl border border-purple-200 bg-purple-50/20 shadow-xs cursor-pointer hover:border-purple-500 transition-all">
          <span className="text-[10px] font-extrabold uppercase text-purple-700">On Leave</span>
          <p className="text-xl font-black text-purple-700 mt-1">4</p>
        </div>
        <div onClick={() => router.push('/remote-work')} className="bg-white p-3.5 rounded-2xl border border-indigo-200 bg-indigo-50/20 shadow-xs cursor-pointer hover:border-indigo-500 transition-all">
          <span className="text-[10px] font-extrabold uppercase text-indigo-700">Remote</span>
          <p className="text-xl font-black text-indigo-700 mt-1">3</p>
        </div>
        <div onClick={() => router.push('/attendance?status=working')} className="bg-white p-3.5 rounded-2xl border border-emerald-200 shadow-xs cursor-pointer hover:border-emerald-500 transition-all">
          <span className="text-[10px] font-extrabold uppercase text-emerald-800">Working Now</span>
          <p className="text-xl font-black text-emerald-800 mt-1">86</p>
        </div>
        <div onClick={() => router.push('/attendance?status=break')} className="bg-white p-3.5 rounded-2xl border border-amber-200 shadow-xs cursor-pointer hover:border-amber-500 transition-all">
          <span className="text-[10px] font-extrabold uppercase text-amber-800">On Break</span>
          <p className="text-xl font-black text-amber-800 mt-1">8</p>
        </div>
        <div onClick={() => router.push('/attendance?status=checkout')} className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs cursor-pointer hover:border-slate-500 transition-all">
          <span className="text-[10px] font-extrabold uppercase text-slate-500">Checked Out</span>
          <p className="text-xl font-black text-slate-700 mt-1">8</p>
        </div>
        <div onClick={() => router.push('/geo-tracking')} className="bg-white p-3.5 rounded-2xl border border-emerald-200 shadow-xs cursor-pointer hover:border-emerald-500 transition-all">
          <span className="text-[10px] font-extrabold uppercase text-emerald-600">Geo Active</span>
          <p className="text-xl font-black text-emerald-600 mt-1">94</p>
        </div>
      </div>

      {/* Office-Wise Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {mockOffices.map((off) => (
          <div key={off.id} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-sm">{off.name}</h3>
              <span className="text-xs font-bold text-slate-500">{off.totalEmployees} Total Staff</span>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="bg-emerald-50 p-2 rounded-xl">
                <span className="text-[10px] font-bold text-emerald-700 uppercase">Present</span>
                <p className="font-black text-emerald-800">{off.present}</p>
              </div>
              <div className="bg-rose-50 p-2 rounded-xl">
                <span className="text-[10px] font-bold text-rose-700 uppercase">Absent</span>
                <p className="font-black text-rose-800">{off.absent}</p>
              </div>
              <div className="bg-amber-50 p-2 rounded-xl">
                <span className="text-[10px] font-bold text-amber-700 uppercase">Late</span>
                <p className="font-black text-amber-800">{off.late}</p>
              </div>
              <div className="bg-indigo-50 p-2 rounded-xl">
                <span className="text-[10px] font-bold text-indigo-700 uppercase">Working</span>
                <p className="font-black text-indigo-800">{off.working}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Live Employee Attendance Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-600 animate-pulse" />
            <h3 className="font-extrabold text-slate-900 text-sm">Live Employee Attendance Stream</h3>
          </div>
          <span className="text-xs font-bold text-slate-500">{filteredEmployees.length} Records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 font-extrabold uppercase border-b border-slate-100">
              <tr>
                <th className="p-3">Employee</th>
                <th className="p-3">Department & Title</th>
                <th className="p-3">Office</th>
                <th className="p-3">Status</th>
                <th className="p-3">Punch In</th>
                <th className="p-3">Break</th>
                <th className="p-3">Punch Out</th>
                <th className="p-3">Hours</th>
                <th className="p-3">Location</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredEmployees.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="p-3">
                    <div className="font-bold text-slate-900">{e.name}</div>
                    <div className="text-[10px] text-slate-400">{e.employeeId}</div>
                  </td>
                  <td className="p-3">
                    <div className="text-slate-800 font-semibold">{e.department}</div>
                    <div className="text-[10px] text-slate-500">{e.designation}</div>
                  </td>
                  <td className="p-3 text-slate-700">{e.office}</td>
                  <td className="p-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black border ${
                        e.status === 'Working'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : e.status === 'On Break'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : e.status === 'On Visit'
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          : e.status === 'Remote'
                          ? 'bg-cyan-50 text-cyan-700 border-cyan-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {e.status === 'Working' && '● '}
                      {e.status === 'On Break' && '◐ '}
                      {e.status === 'On Visit' && '◉ '}
                      {e.status}
                    </span>
                  </td>
                  <td className="p-3 text-slate-800 font-bold">{e.punchIn}</td>
                  <td className="p-3 text-slate-500">{e.breakTime}</td>
                  <td className="p-3 text-slate-500">{e.punchOut}</td>
                  <td className="p-3 font-bold text-emerald-800">{e.workingHours}</td>
                  <td className="p-3 text-slate-600">{e.location}</td>
                  <td className="p-3">
                    <Link href={`/employees/${e.id}`} className="text-emerald-700 font-bold hover:underline">
                      View Profile
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Streams Grid: Today's Punch In / Out & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Punch In */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-600" /> Today&apos;s Latest Punch In
          </h3>
          <div className="space-y-2 text-xs">
            {mockPunchIns.map((p, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-100">
                <div>
                  <p className="font-bold text-slate-900">{p.name}</p>
                  <p className="text-[10px] text-slate-500">{p.office} • {p.location}</p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-emerald-700">{p.time}</span>
                  <p className="text-[10px] font-bold text-amber-600">{p.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Today's Punch Out */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
            <LogOut className="w-4 h-4 text-rose-600" /> Today&apos;s Latest Punch Out
          </h3>
          <div className="space-y-2 text-xs">
            {mockPunchOuts.map((po, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-100">
                <div>
                  <p className="font-bold text-slate-900">{po.name}</p>
                  <p className="text-[10px] text-slate-500">{po.office} • Shift: {po.hours}</p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-rose-700">{po.time}</span>
                  <p className="text-[10px] font-bold text-slate-500">{po.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Activity Feed */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-600" /> Live Workforce Stream
          </h3>
          <div className="space-y-2.5 text-xs">
            {mockActivities.map((act, idx) => (
              <div key={idx} className="flex items-start gap-2.5 pb-2 border-b border-slate-100 last:border-none">
                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-bold text-[10px] rounded-md">{act.time}</span>
                <div>
                  <p className="font-bold text-slate-800">{act.text}</p>
                  <p className="text-[10px] text-slate-400">{act.office}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Department Breakdown Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h3 className="font-extrabold text-slate-900 text-sm">Department-Wise Attendance Ledger</h3>
        </div>
        <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-xs text-left">
          <thead className="bg-slate-50 text-slate-500 font-extrabold uppercase border-b border-slate-100">
            <tr>
              <th className="p-3">Department</th>
              <th className="p-3">Total Staff</th>
              <th className="p-3">Present</th>
              <th className="p-3">Absent</th>
              <th className="p-3">Late</th>
              <th className="p-3">Remote</th>
              <th className="p-3">On Leave</th>
              <th className="p-3">Working Now</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {mockDepartments.map((d, idx) => (
              <tr key={idx} className="hover:bg-slate-50/50">
                <td className="p-3 font-bold text-slate-900">{d.name}</td>
                <td className="p-3 text-slate-600">{d.total}</td>
                <td className="p-3 font-bold text-emerald-700">{d.present}</td>
                <td className="p-3 text-rose-600">{d.absent}</td>
                <td className="p-3 text-amber-600">{d.late}</td>
                <td className="p-3 text-indigo-600">{d.remote}</td>
                <td className="p-3 text-purple-600">{d.onLeave}</td>
                <td className="p-3 font-black text-emerald-800">{d.working}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {/* Attendance Timeline & Operational Summaries Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Shift Timeline */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-600" /> Today&apos;s Shift Timeline
          </h3>
          <div className="space-y-3 text-xs pl-2 border-l-2 border-slate-200">
            <div className="relative pl-3">
              <span className="w-2 h-2 rounded-full bg-emerald-600 absolute -left-[17px] top-1" />
              <span className="font-bold text-slate-900">08:30 AM</span> — First employee punched in
            </div>
            <div className="relative pl-3">
              <span className="w-2 h-2 rounded-full bg-emerald-600 absolute -left-[17px] top-1" />
              <span className="font-bold text-slate-900">09:00 AM</span> — Office opening shift start
            </div>
            <div className="relative pl-3">
              <span className="w-2 h-2 rounded-full bg-emerald-600 absolute -left-[17px] top-1" />
              <span className="font-bold text-slate-900">09:30 AM</span> — Peak Punch In window
            </div>
            <div className="relative pl-3">
              <span className="w-2 h-2 rounded-full bg-amber-500 absolute -left-[17px] top-1" />
              <span className="font-bold text-slate-900">10:00 AM</span> — Late attendance count logged (6 Late)
            </div>
            <div className="relative pl-3">
              <span className="w-2 h-2 rounded-full bg-indigo-500 absolute -left-[17px] top-1" />
              <span className="font-bold text-slate-900">01:00 PM</span> — Lunch break period begins
            </div>
          </div>
        </div>

        {/* Live Geo & Visits Summaries */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600" /> Geo Tracking Summary
              </h3>
              <Link href="/geo-tracking" className="text-[11px] font-bold text-emerald-600 hover:underline">
                View Live Map →
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
              <div className="p-2 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Tracking Active</span>
                <p className="font-black text-emerald-700 text-sm">94 Staff</p>
              </div>
              <div className="p-2 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 font-bold uppercase">On Field Visit</span>
                <p className="font-black text-indigo-700 text-sm">5 Staff</p>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-600" /> Field Visits Summary
              </h3>
              <Link href="/visits" className="text-[11px] font-bold text-indigo-600 hover:underline">
                View Visits →
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-2 text-xs text-center">
              <div className="p-2 bg-indigo-50 rounded-xl">
                <span className="text-[10px] text-indigo-700 font-bold uppercase">Active</span>
                <p className="font-black text-indigo-800">8</p>
              </div>
              <div className="p-2 bg-emerald-50 rounded-xl">
                <span className="text-[10px] text-emerald-700 font-bold uppercase">Completed</span>
                <p className="font-black text-emerald-800">21</p>
              </div>
              <div className="p-2 bg-amber-50 rounded-xl">
                <span className="text-[10px] text-amber-700 font-bold uppercase">Upcoming</span>
                <p className="font-black text-amber-800">5</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pending HR Actions */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-emerald-600" /> Pending HR Actions
          </h3>
          <div className="space-y-2 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-100">
              <span className="font-bold text-slate-800">Pending Leave Requests</span>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-black rounded-md">4</span>
                <Link href="/leaves/approvals" className="text-emerald-700 font-bold hover:underline">Review</Link>
              </div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-100">
              <span className="font-bold text-slate-800">Pending Remote Work Requests</span>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 font-black rounded-md">2</span>
                <Link href="/remote-work/approvals" className="text-emerald-700 font-bold hover:underline">Review</Link>
              </div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-100">
              <span className="font-bold text-slate-800">Attendance Corrections</span>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-purple-100 text-purple-800 font-black rounded-md">3</span>
                <Link href="/attendance/corrections" className="text-emerald-700 font-bold hover:underline">Review</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

