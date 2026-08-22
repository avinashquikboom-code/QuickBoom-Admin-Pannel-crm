'use client';

import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Navigation,
  Search,
  Filter,
  Users,
  Clock,
  Briefcase,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Radio,
  Calendar,
  Layers,
  Settings,
  Plus,
  RefreshCw,
  Eye,
  User,
  Building2,
  ChevronRight,
  ShieldAlert,
  Sliders,
  ExternalLink,
  Map,
  Activity,
  History,
  Compass,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

interface EmployeeLocationData {
  id: string;
  employeeId: string;
  name: string;
  department: string;
  designation: string;
  avatar?: string;
  status:
    | 'WORKING'
    | 'ON_BREAK'
    | 'ON_VISIT'
    | 'REMOTE'
    | 'CHECKED_OUT'
    | 'OFFLINE'
    | 'LOCATION_DISABLED'
    | 'PERMISSION_DENIED';
  lat: number;
  lng: number;
  address: string;
  lastUpdated: string;
  todayAttendance: {
    punchIn: string;
    punchOut?: string;
    workingHours: number;
    status: string;
  };
  currentVisit?: {
    id: string;
    title: string;
    client: string;
    startedAt: string;
  };
  assignedBranch: {
    name: string;
    radiusMeters: number;
    distanceMeters: number;
    isInsideRadius: boolean;
  };
  trackingMode: 'ATTENDANCE_ONLY' | 'DURING_VISIT' | 'WORKING_HOURS' | 'ACTIVE_TRACKING';
  locationPermission: 'GRANTED' | 'DENIED' | 'UNAVAILABLE';
}

interface GeofenceBranch {
  id: string;
  name: string;
  city: string;
  lat: number;
  lng: number;
  radiusMeters: number;
  status: 'ACTIVE' | 'INACTIVE';
  activeEmployeesCount: number;
}

const mockBranches: GeofenceBranch[] = [
  {
    id: 'b1',
    name: 'Head Office - Bandra Kurla Complex',
    city: 'Mumbai',
    lat: 19.0596,
    lng: 72.8295,
    radiusMeters: 200,
    status: 'ACTIVE',
    activeEmployeesCount: 28,
  },
  {
    id: 'b2',
    name: 'Tech Park - Cyber City',
    city: 'Gurgaon',
    lat: 28.495,
    lng: 77.0895,
    radiusMeters: 300,
    status: 'ACTIVE',
    activeEmployeesCount: 14,
  },
  {
    id: 'b3',
    name: 'Innovation Hub - Indiranagar',
    city: 'Bengaluru',
    lat: 12.9784,
    lng: 77.6408,
    radiusMeters: 250,
    status: 'ACTIVE',
    activeEmployeesCount: 12,
  },
];

const mockEmployeesLocations: EmployeeLocationData[] = [
  {
    id: '1',
    employeeId: 'EMP001',
    name: 'Rahul Sharma',
    department: 'Sales',
    designation: 'Senior Regional Manager',
    status: 'ON_VISIT',
    lat: 19.076,
    lng: 72.8777,
    address: 'Apex Tech Solutions, Lower Parel, Mumbai',
    lastUpdated: '1 min ago',
    todayAttendance: {
      punchIn: '09:02 AM',
      workingHours: 4.5,
      status: 'PRESENT',
    },
    currentVisit: {
      id: 'v-101',
      title: 'Enterprise CRM Onboarding Review',
      client: 'Apex Tech Solutions',
      startedAt: '10:45 AM',
    },
    assignedBranch: {
      name: 'Head Office - Bandra Kurla Complex',
      radiusMeters: 200,
      distanceMeters: 3800,
      isInsideRadius: false,
    },
    trackingMode: 'DURING_VISIT',
    locationPermission: 'GRANTED',
  },
  {
    id: '2',
    employeeId: 'EMP002',
    name: 'Priya Singh',
    department: 'Engineering',
    designation: 'Lead System Architect',
    status: 'WORKING',
    lat: 19.0598,
    lng: 72.8298,
    address: 'BKC HQ Floor 4, Bandra East, Mumbai',
    lastUpdated: '3 mins ago',
    todayAttendance: {
      punchIn: '09:15 AM',
      workingHours: 4.3,
      status: 'PRESENT',
    },
    assignedBranch: {
      name: 'Head Office - Bandra Kurla Complex',
      radiusMeters: 200,
      distanceMeters: 45,
      isInsideRadius: true,
    },
    trackingMode: 'WORKING_HOURS',
    locationPermission: 'GRANTED',
  },
  {
    id: '3',
    employeeId: 'EMP003',
    name: 'Amit Verma',
    department: 'Marketing',
    designation: 'Growth Lead',
    status: 'ON_BREAK',
    lat: 19.0612,
    lng: 72.8315,
    address: 'Starbucks BKC, Bandra, Mumbai',
    lastUpdated: '5 mins ago',
    todayAttendance: {
      punchIn: '09:30 AM',
      workingHours: 4.0,
      status: 'PRESENT',
    },
    assignedBranch: {
      name: 'Head Office - Bandra Kurla Complex',
      radiusMeters: 200,
      distanceMeters: 180,
      isInsideRadius: true,
    },
    trackingMode: 'WORKING_HOURS',
    locationPermission: 'GRANTED',
  },
  {
    id: '4',
    employeeId: 'EMP004',
    name: 'Sneha Gupta',
    department: 'Operations',
    designation: 'Field Operations Supervisor',
    status: 'ON_VISIT',
    lat: 19.1197,
    lng: 72.8464,
    address: 'Acme Logistics Hub, Andheri East, Mumbai',
    lastUpdated: '2 mins ago',
    todayAttendance: {
      punchIn: '08:55 AM',
      workingHours: 4.6,
      status: 'PRESENT',
    },
    currentVisit: {
      id: 'v-104',
      title: 'Warehouse GPS Audit & Verification',
      client: 'Acme Logistics Ltd',
      startedAt: '11:15 AM',
    },
    assignedBranch: {
      name: 'Head Office - Bandra Kurla Complex',
      radiusMeters: 200,
      distanceMeters: 7400,
      isInsideRadius: false,
    },
    trackingMode: 'ACTIVE_TRACKING',
    locationPermission: 'GRANTED',
  },
  {
    id: '5',
    employeeId: 'EMP005',
    name: 'Vikram Mehta',
    department: 'Finance',
    designation: 'Payroll Accountant',
    status: 'REMOTE',
    lat: 19.176,
    lng: 72.9523,
    address: 'Powai Remote Work Hub, Mumbai',
    lastUpdated: '12 mins ago',
    todayAttendance: {
      punchIn: '09:00 AM',
      workingHours: 4.5,
      status: 'REMOTE_APPROVED',
    },
    assignedBranch: {
      name: 'Head Office - Bandra Kurla Complex',
      radiusMeters: 200,
      distanceMeters: 14200,
      isInsideRadius: false,
    },
    trackingMode: 'ATTENDANCE_ONLY',
    locationPermission: 'GRANTED',
  },
  {
    id: '6',
    employeeId: 'EMP006',
    name: 'Kavita Patel',
    department: 'Sales',
    designation: 'Key Account Executive',
    status: 'LOCATION_DISABLED',
    lat: 19.0596,
    lng: 72.8295,
    address: 'Location Services Disabled on Device',
    lastUpdated: '28 mins ago',
    todayAttendance: {
      punchIn: '09:40 AM',
      workingHours: 3.8,
      status: 'PRESENT',
    },
    assignedBranch: {
      name: 'Head Office - Bandra Kurla Complex',
      radiusMeters: 200,
      distanceMeters: 0,
      isInsideRadius: true,
    },
    trackingMode: 'ATTENDANCE_ONLY',
    locationPermission: 'DENIED',
  },
];

const mockHistoryPoints = [
  { time: '09:02 AM', event: 'Punch In (Office GPS Verified)', address: 'BKC HQ Main Gate', type: 'ATTENDANCE', status: 'PRESENT' },
  { time: '10:15 AM', event: 'Departed Office for Client Visit', address: 'BKC Flyover Road', type: 'EN_ROUTE', status: 'WORKING' },
  { time: '10:45 AM', event: 'Arrived & Started Visit: Apex Tech', address: 'Lower Parel Commercial Complex', type: 'VISIT_START', status: 'ON_VISIT' },
  { time: '12:30 PM', event: 'Completed Client Meeting & Logged Notes', address: 'Lower Parel Commercial Complex', type: 'VISIT_END', status: 'ON_VISIT' },
  { time: '01:15 PM', event: 'Returned to BKC Office Branch', address: 'BKC HQ Floor 4', type: 'BRANCH_ENTER', status: 'WORKING' },
];

export default function GeoTrackingPage() {
  const [activeTab, setActiveTab] = useState<'map' | 'history' | 'geofence' | 'policy'>('map');
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeLocationData | null>(
    mockEmployeesLocations[0]
  );
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [historyEmployeeId, setHistoryEmployeeId] = useState('EMP001');
  const [historyDate, setHistoryDate] = useState('2026-08-15');
  const [isLiveConnected, setIsLiveConnected] = useState(true);

  // Live employee locations from backend
  const { data: liveLocationsData } = useQuery({
    queryKey: ['admin-location-live'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/admin/location/live');
        return res?.data || res;
      } catch (err) {
        return null;
      }
    },
    refetchInterval: isLiveConnected ? 15000 : false,
  });

  // Branch geofences from backend
  const { data: branchesData } = useQuery({
    queryKey: ['admin-branches'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/admin/branches');
        return res?.data || res;
      } catch (err) {
        return null;
      }
    },
  });

  const rawEmployees = Array.isArray(liveLocationsData)
    ? liveLocationsData
    : Array.isArray(liveLocationsData?.employees)
    ? liveLocationsData.employees
    : null;

  const employees: EmployeeLocationData[] =
    rawEmployees !== null && rawEmployees.length > 0 ? rawEmployees : mockEmployeesLocations;

  const rawBranches = Array.isArray(branchesData) ? branchesData : null;
  const branches: GeofenceBranch[] = rawBranches !== null && rawBranches.length > 0 ? rawBranches : mockBranches;

  // Permission Guard Check (Simulated employee.location.view rule)
  const hasPermission = true;

  if (!hasPermission) {
    return (
      <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-sm max-w-xl mx-auto mt-12 space-y-4">
        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-900">403 Forbidden — Access Denied</h2>
        <p className="text-sm text-slate-600">
          You do not have permission to access the Live Geo Tracking module.
          <br />
          Required Permission: <code className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-mono text-xs">employee.location.view</code>
        </p>
      </div>
    );
  }

  const filteredEmployees = mockEmployeesLocations.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(search.toLowerCase()) ||
      emp.employeeId.toLowerCase().includes(search.toLowerCase()) ||
      emp.department.toLowerCase().includes(search.toLowerCase());
    const matchesDept = departmentFilter === 'ALL' || emp.department === departmentFilter;
    const matchesStatus = statusFilter === 'ALL' || emp.status === statusFilter;
    return matchesSearch && matchesDept && matchesStatus;
  });

  const getStatusBadge = (status: EmployeeLocationData['status']) => {
    switch (status) {
      case 'WORKING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Working
          </span>
        );
      case 'ON_VISIT':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span> On Visit
          </span>
        );
      case 'ON_BREAK':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span> On Break
          </span>
        );
      case 'REMOTE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-indigo-500"></span> Remote
          </span>
        );
      case 'CHECKED_OUT':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-slate-400"></span> Checked Out
          </span>
        );
      case 'LOCATION_DISABLED':
      case 'PERMISSION_DENIED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span> Location Disabled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-slate-400"></span> Offline
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-16 text-slate-800 animate-in fade-in-50 duration-200">
      {/* Top Hero Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-slate-700/60 shadow-xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-[#23C45E]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-[#23C45E] border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-[#23C45E] animate-pulse" />
                Live GPS & Geo-Tracking
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Workforce Geo-Tracking & Maps
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-2xl leading-relaxed">
              Monitor real-time employee locations, GPS punch validation, field visit routes, and branch geofences.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-800/80 border border-slate-700 text-xs font-bold text-slate-300">
              <span className={`w-2.5 h-2.5 rounded-full ${isLiveConnected ? 'bg-[#23C45E] animate-pulse' : 'bg-rose-500'}`} />
              <span>{isLiveConnected ? 'Socket Connected' : 'Disconnected'}</span>
            </div>
            <button
              onClick={() => toast.success('Refreshing live employee GPS streams...')}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#23C45E] hover:bg-[#1AA14D] text-slate-950 font-black rounded-2xl text-xs shadow-md shadow-[#23C45E]/20 transition-all cursor-pointer active:scale-95"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh Map</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Staff</p>
          <p className="text-xl font-black text-slate-900">48</p>
          <p className="text-[10px] text-slate-400 font-medium">Configured Employees</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Online
          </p>
          <p className="text-xl font-black text-slate-900">38</p>
          <p className="text-[10px] text-emerald-600 font-medium">Active App Sessions</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <p className="text-[11px] font-bold text-teal-600 uppercase tracking-wider flex items-center gap-1">
            <Radio className="w-3 h-3 text-teal-600" /> Tracking
          </p>
          <p className="text-xl font-black text-slate-900">32</p>
          <p className="text-[10px] text-teal-600 font-medium">Streaming GPS Updates</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <p className="text-[11px] font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1">
            <Briefcase className="w-3 h-3 text-blue-600" /> On Visit
          </p>
          <p className="text-xl font-black text-slate-900">8</p>
          <p className="text-[10px] text-blue-600 font-medium">Client Field Visits</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-600" /> On Break
          </p>
          <p className="text-xl font-black text-slate-900">4</p>
          <p className="text-[10px] text-amber-600 font-medium">Lunch / Short Break</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Checked In
          </p>
          <p className="text-xl font-black text-slate-900">30</p>
          <p className="text-[10px] text-emerald-700 font-medium">Punched Attendance</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <p className="text-[11px] font-bold text-rose-600 uppercase tracking-wider flex items-center gap-1">
            <XCircle className="w-3 h-3 text-rose-600" /> Disabled
          </p>
          <p className="text-xl font-black text-slate-900">3</p>
          <p className="text-[10px] text-rose-600 font-medium">Permission Denied</p>
        </div>
      </div>

      {/* Main Tab Navigation Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('map')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'map'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Map className="w-4 h-4" /> Live Interactive Map
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'history'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <History className="w-4 h-4" /> Location History & Timeline
        </button>
        <button
          onClick={() => setActiveTab('geofence')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'geofence'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4" /> Branch Geofences
        </button>
        <button
          onClick={() => setActiveTab('policy')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'policy'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Sliders className="w-4 h-4" /> Tracking Rules & Policy
        </button>
      </div>

      {/* TAB 1: LIVE INTERACTIVE MAP & SIDE PANEL */}
      {activeTab === 'map' && (
        <div className="space-y-6">
          {/* Filters Toolbar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search employee by name, ID or dept..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="ALL">All Departments</option>
                <option value="Sales">Sales</option>
                <option value="Engineering">Engineering</option>
                <option value="Operations">Operations</option>
                <option value="Marketing">Marketing</option>
                <option value="Finance">Finance</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="WORKING">Working</option>
                <option value="ON_VISIT">On Visit</option>
                <option value="ON_BREAK">On Break</option>
                <option value="REMOTE">Remote</option>
                <option value="LOCATION_DISABLED">Location Disabled</option>
              </select>
            </div>

            <div className="text-xs font-bold text-slate-500">
              Showing <span className="text-emerald-700 font-extrabold">{filteredEmployees.length}</span> active markers
            </div>
          </div>

          {/* Grid Layout: Map Canvas + Employee Card Sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Area: Map Canvas */}
            <div className="lg:col-span-8 bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-lg relative min-h-[560px] flex flex-col">
              {/* Map Controls Header Overlay */}
              <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between bg-slate-900/90 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-slate-800 shadow-md">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <Navigation className="w-4 h-4 text-emerald-400" /> Mumbai Metropolitan Area GPS Map
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                    Geofence Mode: 200m Strict
                  </span>
                </div>
              </div>

              {/* Simulated Map Canvas Visual */}
              <div className="flex-1 bg-slate-950 relative overflow-hidden flex items-center justify-center p-6 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]">
                {/* Branch Geofence Radius Circles */}
                <div className="absolute w-64 h-64 rounded-full border-2 border-dashed border-emerald-500/40 bg-emerald-500/10 flex items-center justify-center top-1/4 left-1/3">
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest bg-slate-900/80 px-2 py-0.5 rounded border border-emerald-800">
                    BKC Head Office Radius (200m)
                  </span>
                </div>

                {/* Map Employee Pins / Markers */}
                <div className="relative w-full h-full min-h-[480px]">
                  {filteredEmployees.map((emp, index) => {
                    const topPos = `${25 + (index * 14) % 60}%`;
                    const leftPos = `${20 + (index * 16) % 70}%`;
                    const isSelected = selectedEmployee?.id === emp.id;

                    return (
                      <div
                        key={emp.id}
                        onClick={() => setSelectedEmployee(emp)}
                        style={{ top: topPos, left: leftPos }}
                        className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 z-20 group`}
                      >
                        {/* Marker Pin */}
                        <div
                          className={`relative flex items-center gap-2 px-3 py-1.5 rounded-full shadow-xl border transition-all ${
                            isSelected
                              ? 'bg-emerald-600 text-white border-white scale-110 ring-4 ring-emerald-500/40 z-30'
                              : 'bg-slate-900/90 text-slate-100 border-slate-700 hover:border-emerald-500 hover:scale-105'
                          }`}
                        >
                          <div className="relative">
                            <div className="w-7 h-7 rounded-full bg-emerald-800 text-white flex items-center justify-center font-black text-xs border border-emerald-500">
                              {emp.name.split(' ').map((n) => n[0]).join('')}
                            </div>
                            <span
                              className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-slate-900 ${
                                emp.status === 'WORKING'
                                  ? 'bg-emerald-500'
                                  : emp.status === 'ON_VISIT'
                                  ? 'bg-blue-500'
                                  : emp.status === 'ON_BREAK'
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                              }`}
                            ></span>
                          </div>
                          <div className="text-left pr-1">
                            <p className="text-xs font-black leading-tight whitespace-nowrap">{emp.name}</p>
                            <p className="text-[10px] text-emerald-300 font-medium whitespace-nowrap">
                              {emp.status === 'ON_VISIT' ? '● On Visit' : emp.status === 'WORKING' ? '● Working' : '● ' + emp.status}
                            </p>
                          </div>
                        </div>

                        {/* Pulse animation ring for active tracking */}
                        {emp.status === 'WORKING' || emp.status === 'ON_VISIT' ? (
                          <div className="absolute inset-0 rounded-full bg-emerald-500/30 animate-ping pointer-events-none -z-10"></div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>

                {/* Map Legend Overlay */}
                <div className="absolute bottom-4 left-4 z-10 bg-slate-900/90 backdrop-blur-md p-3 rounded-2xl border border-slate-800 text-[11px] text-slate-300 space-y-1">
                  <p className="font-extrabold text-white text-xs mb-1">Status Legend</p>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Working</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> On Visit</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Break</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Disabled</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Area: Selected Employee Location Card / List */}
            <div className="lg:col-span-4 space-y-4">
              {selectedEmployee ? (
                <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-5">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white font-black text-base flex items-center justify-center shadow-md">
                        {selectedEmployee.name.split(' ').map((n) => n[0]).join('')}
                      </div>
                      <div>
                        <h3 className="font-black text-slate-900 text-base">{selectedEmployee.name}</h3>
                        <p className="text-xs text-slate-500 font-medium">
                          {selectedEmployee.employeeId} • {selectedEmployee.designation}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(selectedEmployee.status)}
                  </div>

                  {/* Location & Geofence Status */}
                  <div className="space-y-3">
                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-bold flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600" /> Current Address
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">{selectedEmployee.lastUpdated}</span>
                      </div>
                      <p className="text-xs font-extrabold text-slate-800">{selectedEmployee.address}</p>
                      <p className="text-[10px] text-slate-500 font-mono pt-1">
                        GPS: {selectedEmployee.lat.toFixed(4)}, {selectedEmployee.lng.toFixed(4)}
                      </p>
                    </div>

                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-bold">Assigned Branch Radius</span>
                        <span
                          className={`font-extrabold text-[10px] px-2 py-0.5 rounded-full ${
                            selectedEmployee.assignedBranch.isInsideRadius
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {selectedEmployee.assignedBranch.isInsideRadius ? 'INSIDE RADIUS' : 'OUTSIDE RADIUS'}
                        </span>
                      </div>
                      <p className="font-extrabold text-slate-800">{selectedEmployee.assignedBranch.name}</p>
                      <p className="text-[11px] text-slate-600">
                        Distance: <span className="font-bold text-slate-900">{selectedEmployee.assignedBranch.distanceMeters}m</span> (Max Radius: {selectedEmployee.assignedBranch.radiusMeters}m)
                      </p>
                    </div>

                    {/* Active Visit if any */}
                    {selectedEmployee.currentVisit && (
                      <div className="bg-blue-50 p-3.5 rounded-2xl border border-blue-200 space-y-1 text-xs">
                        <span className="text-blue-700 font-extrabold uppercase tracking-wider text-[10px] flex items-center gap-1">
                          <Briefcase className="w-3 h-3" /> Active Field Visit
                        </span>
                        <p className="font-black text-slate-900">{selectedEmployee.currentVisit.title}</p>
                        <p className="text-slate-600 font-medium">Client: {selectedEmployee.currentVisit.client}</p>
                        <p className="text-[10px] text-blue-700 font-bold">Started at {selectedEmployee.currentVisit.startedAt}</p>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setActiveTab('history')}
                      className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                    >
                      <History className="w-3.5 h-3.5" /> View Route History
                    </button>
                    <button
                      onClick={() => toast(`Viewing profile for ${selectedEmployee.name}`)}
                      className="py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                    >
                      <User className="w-3.5 h-3.5" /> Employee Profile
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center text-slate-500 space-y-2">
                  <MapPin className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold">Click an employee marker on the map to inspect live location.</p>
                </div>
              )}

              {/* Employee List Selector */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-xs space-y-3">
                <p className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                  Employee Locations List ({filteredEmployees.length})
                </p>
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {filteredEmployees.map((emp) => (
                    <div
                      key={emp.id}
                      onClick={() => setSelectedEmployee(emp)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        selectedEmployee?.id === emp.id
                          ? 'bg-emerald-50 border-emerald-300'
                          : 'bg-white border-slate-100 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-slate-800 text-white font-bold text-xs flex items-center justify-center">
                          {emp.name.split(' ').map((n) => n[0]).join('')}
                        </div>
                        <div>
                          <p className="text-xs font-extrabold text-slate-900">{emp.name}</p>
                          <p className="text-[10px] text-slate-500 font-medium">{emp.department}</p>
                        </div>
                      </div>
                      {getStatusBadge(emp.status)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LOCATION HISTORY & ROUTE TIMELINE */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-black text-slate-900">Employee Location History Timeline</h3>
                <p className="text-xs text-slate-500 font-medium">Select an employee and date to inspect chronological GPS checkpoints.</p>
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={historyEmployeeId}
                  onChange={(e) => setHistoryEmployeeId(e.target.value)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="EMP001">Rahul Sharma (EMP001)</option>
                  <option value="EMP002">Priya Singh (EMP002)</option>
                  <option value="EMP004">Sneha Gupta (EMP004)</option>
                </select>

                <input
                  type="date"
                  value={historyDate}
                  onChange={(e) => setHistoryDate(e.target.value)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            {/* Timeline Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-7 space-y-4">
                <p className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-600" /> Daily GPS Event Logs ({historyDate})
                </p>

                <div className="relative pl-6 border-l-2 border-emerald-500/40 space-y-6 ml-3">
                  {mockHistoryPoints.map((pt, idx) => (
                    <div key={idx} className="relative group">
                      <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-emerald-600 border-2 border-white shadow-xs"></div>
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-black text-emerald-700">{pt.time}</span>
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                            {pt.type}
                          </span>
                        </div>
                        <p className="font-extrabold text-slate-900 text-sm">{pt.event}</p>
                        <p className="text-xs text-slate-600 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" /> {pt.address}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Route Map Preview Canvas */}
              <div className="lg:col-span-5 bg-slate-900 p-6 rounded-3xl text-white space-y-4 flex flex-col justify-between">
                <div>
                  <h4 className="font-extrabold text-sm text-emerald-300 flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-emerald-400" /> Daily Route Path Overview
                  </h4>
                  <p className="text-xs text-slate-300 mt-1">GPS points linked via timestamp sequences.</p>
                </div>

                <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 text-center space-y-3">
                  <Map className="w-12 h-12 text-emerald-400 mx-auto animate-pulse" />
                  <p className="text-xs font-bold text-slate-200">5 Valid GPS Checkpoints Recorded</p>
                  <p className="text-[11px] text-slate-400">Total Distance Covered: 24.8 km</p>
                </div>

                <button
                  onClick={() => toast.success('Exporting Route KML/PDF history...')}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold transition-all shadow-md cursor-pointer"
                >
                  Export Route Summary PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BRANCH GEOFENCES CONFIGURATION */}
      {activeTab === 'geofence' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-black text-slate-900">Branch Geofences & Allowed Punch Radius</h3>
                <p className="text-xs text-slate-500 font-medium">Configure GPS coordinates and allowed punch in radial boundaries per office branch.</p>
              </div>

              <button
                onClick={() => toast('Geofence creator modal opened')}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold transition-all shadow-md cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add Branch Geofence
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {mockBranches.map((branch) => (
                <div key={branch.id} className="bg-slate-50 p-6 rounded-2xl border border-slate-200/80 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                      {branch.status}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm">{branch.name}</h4>
                    <p className="text-xs text-slate-500 mt-0.5 font-medium">{branch.city}</p>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-200">
                    <p>Allowed Punch Radius: <span className="font-bold text-slate-900">{branch.radiusMeters} meters</span></p>
                    <p>Coordinates: <span className="font-mono text-slate-800">{branch.lat}, {branch.lng}</span></p>
                    <p>Active Staff in Radius: <span className="font-extrabold text-emerald-700">{branch.activeEmployeesCount} staff</span></p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: TRACKING RULES & POLICY */}
      {activeTab === 'policy' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
          <div>
            <h3 className="text-lg font-black text-slate-900">Workforce Location Privacy & Tracking Rules</h3>
            <p className="text-xs text-slate-500 font-medium">Enforce organizational consent guidelines, retention boundaries, and customer isolation policies.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-2">
              <h4 className="font-extrabold text-emerald-900 text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Attendance-Only Mode (Default)
              </h4>
              <p className="text-slate-600 leading-relaxed">
                Location coordinates are captured exclusively during Punch In and Punch Out to validate branch geofences.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-blue-50/50 border border-blue-200 space-y-2">
              <h4 className="font-extrabold text-blue-900 text-sm flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-blue-600" /> Field Visit Tracking
              </h4>
              <p className="text-slate-600 leading-relaxed">
                Active tracking occurs solely while an employee has an active Field Visit in progress on the mobile app.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
