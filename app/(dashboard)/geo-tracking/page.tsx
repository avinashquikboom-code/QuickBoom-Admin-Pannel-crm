'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  MapPin,
  Navigation,
  Search,
  Users,
  Clock,
  Briefcase,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Radio,
  Building2,
  RefreshCw,
  User,
  ShieldAlert,
  Sliders,
  Map,
  History,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { io, Socket } from 'socket.io-client';
import api, { getPersistedAuthSession } from '@/lib/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface EmployeeLocationData {
  id: string;
  employeeId: string;
  dbEmployeeId?: number;
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
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  address: string;
  lastUpdated: string;
  lastSeenAt?: string;
  todayAttendance?: {
    punchIn?: string;
    punchOut?: string;
    workingHours?: number;
    status?: string;
  };
  currentVisit?: {
    id: string;
    title: string;
    client: string;
    startedAt: string;
  };
  assignedBranch?: {
    name: string;
    radiusMeters: number;
    distanceMeters: number;
    isInsideRadius: boolean;
  };
  trackingMode?: string;
  locationPermission?: string;
}

interface GeofenceBranch {
  id: string | number;
  name: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  lat?: number;
  lng?: number;
  radiusMeters: number;
  status?: string;
  isActive?: boolean;
  activeEmployeesCount?: number;
}

const mockHistoryPoints = [
  { time: '09:02 AM', event: 'Biometric Punch In at BKC HQ', address: 'BKC HQ Main Entrance, Mumbai', type: 'PUNCH_IN', status: 'WORKING' },
  { time: '10:15 AM', event: 'Departed Office for Client Visit', address: 'BKC Flyover Road', type: 'EN_ROUTE', status: 'WORKING' },
  { time: '10:45 AM', event: 'Arrived & Started Visit: Apex Tech', address: 'Lower Parel Commercial Complex', type: 'VISIT_START', status: 'ON_VISIT' },
  { time: '12:30 PM', event: 'Completed Client Meeting & Logged Notes', address: 'Lower Parel Commercial Complex', type: 'VISIT_END', status: 'ON_VISIT' },
  { time: '01:15 PM', event: 'Returned to BKC Office Branch', address: 'BKC HQ Floor 4', type: 'BRANCH_ENTER', status: 'WORKING' },
];

export default function GeoTrackingPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'map' | 'history' | 'geofence' | 'policy'>('map');
  const [employees, setEmployees] = useState<EmployeeLocationData[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeLocationData | null>(null);
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [historyEmployeeId, setHistoryEmployeeId] = useState('EMP001');
  const [historyDate, setHistoryDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [nowTimestamp, setNowTimestamp] = useState(Date.now());
  const socketRef = useRef<Socket | null>(null);

  // 1-second ticker for live timestamp / staleness calculation
  useEffect(() => {
    const timer = setInterval(() => {
      setNowTimestamp(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Live employee locations from backend (initial load & refresh)
  const { data: initialLiveLocations, refetch: refetchLiveLocations } = useQuery({
    queryKey: ['admin-location-live'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/admin/location/live');
        return res?.data || res;
      } catch (err) {
        console.error('[GEO_TRACKING] Error fetching live locations:', err);
        return [];
      }
    },
    staleTime: 60000,
  });

  // Branch geofences from backend
  const { data: branchesData } = useQuery({
    queryKey: ['admin-branches'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/admin/branches');
        return res?.data || res;
      } catch {
        return [];
      }
    },
  });

  // Populate initial employees on load
  useEffect(() => {
    if (initialLiveLocations && Array.isArray(initialLiveLocations)) {
      setEmployees(initialLiveLocations);
      if (initialLiveLocations.length > 0 && !selectedEmployee) {
        setSelectedEmployee(initialLiveLocations[0]);
      }
    }
  }, [initialLiveLocations]);

  // WebSocket Live Subscription to Backend Gateway (`/ws/location`)
  useEffect(() => {
    const session = getPersistedAuthSession();
    const customerId = session.customerId || 1;

    let wsBaseUrl = 'https://api.qbapp.online';
    if (typeof window !== 'undefined') {
      const apiEnv = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.qbapp.online/api/v1';
      try {
        const parsed = new URL(apiEnv);
        wsBaseUrl = `${parsed.protocol}//${parsed.host}`;
      } catch {
        wsBaseUrl = 'https://api.qbapp.online';
      }
    }

    const socketUrl = `${wsBaseUrl}/ws/location`;
    console.log('[GEO_TRACKING_WS] Connecting to:', socketUrl, 'for customer:', customerId);

    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      query: { customerId: String(customerId) },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[GEO_TRACKING_WS] Connected with ID:', socket.id);
      setIsLiveConnected(true);
      socket.emit('joinCustomerRoom', { customerId: String(customerId) });
    });

    socket.on('disconnect', (reason) => {
      console.warn('[GEO_TRACKING_WS] Disconnected:', reason);
      setIsLiveConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('[GEO_TRACKING_WS] Connection error:', error.message);
      setIsLiveConnected(false);
    });

    socket.on('reconnect', () => {
      console.log('[GEO_TRACKING_WS] Reconnected successfully. Refreshing live map...');
      setIsLiveConnected(true);
      socket.emit('joinCustomerRoom', { customerId: String(customerId) });
      refetchLiveLocations();
    });

    // Real-Time 25-Second Employee Location Update Event
    socket.on('employee.location.updated', (data: any) => {
      if (!data) return;

      console.log(
        `[EMPLOYEE_LOCATION_WS] employeeId: ${data.employeeId || data.id} lat: ${data.latitude || data.lat} lng: ${data.longitude || data.lng} lastSeenAt: ${data.lastSeenAt || new Date().toISOString()}`
      );

      setEmployees((prevList) => {
        const index = prevList.findIndex(
          (e) =>
            String(e.id) === String(data.id) ||
            String(e.employeeId) === String(data.employeeId) ||
            (data.dbEmployeeId && e.dbEmployeeId === data.dbEmployeeId)
        );

        const updatedRecord: EmployeeLocationData = {
          id: String(data.id || data.employeeId),
          employeeId: data.employeeId || `EMP-${data.id}`,
          dbEmployeeId: data.dbEmployeeId,
          name: data.name || `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'Employee',
          department: data.department || 'General',
          designation: data.designation || 'Staff',
          status: data.status || 'WORKING',
          lat: Number(data.latitude || data.lat || 19.076),
          lng: Number(data.longitude || data.lng || 72.8777),
          accuracy: data.accuracy || 15.0,
          address: data.address || 'Live GPS Location',
          lastUpdated: data.lastUpdated || new Date().toISOString(),
          lastSeenAt: data.lastSeenAt || new Date().toISOString(),
          todayAttendance: data.todayAttendance || {
            punchIn: '',
            workingHours: 0.0,
            status: data.status,
          },
          assignedBranch: data.assignedBranch || {
            name: 'Head Office',
            radiusMeters: 200,
            distanceMeters: data.distanceFromOffice || 0,
            isInsideRadius: data.locationStatus === 'INSIDE_RADIUS',
          },
          trackingMode: 'ACTIVE_TRACKING',
          locationPermission: 'GRANTED',
        };

        if (index >= 0) {
          const nextList = [...prevList];
          nextList[index] = { ...nextList[index], ...updatedRecord };
          return nextList;
        } else {
          return [updatedRecord, ...prevList];
        }
      });

      // Update selected employee card if currently active
      setSelectedEmployee((prev) => {
        if (!prev) return null;
        if (
          String(prev.id) === String(data.id) ||
          String(prev.employeeId) === String(data.employeeId) ||
          (data.dbEmployeeId && prev.dbEmployeeId === data.dbEmployeeId)
        ) {
          return {
            ...prev,
            lat: Number(data.latitude || data.lat || prev.lat),
            lng: Number(data.longitude || data.lng || prev.lng),
            accuracy: data.accuracy || prev.accuracy,
            address: data.address || prev.address,
            lastUpdated: data.lastUpdated || new Date().toISOString(),
            lastSeenAt: data.lastSeenAt || new Date().toISOString(),
            status: data.status || prev.status,
            assignedBranch: data.assignedBranch || prev.assignedBranch,
          };
        }
        return prev;
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [refetchLiveLocations]);

  // Helper for computing lastSeen relative time and online/offline status
  const getEmployeeLiveStatus = (emp: EmployeeLocationData) => {
    const rawDate = emp.lastSeenAt || emp.lastUpdated;
    if (!rawDate) return { isLive: false, isStale: true, timeAgo: 'No signal', status: emp.status };

    const diffSec = Math.max(0, Math.floor((nowTimestamp - new Date(rawDate).getTime()) / 1000));
    let timeAgo = 'Just now';
    if (diffSec < 5) {
      timeAgo = 'Just now';
    } else if (diffSec < 60) {
      timeAgo = `${diffSec}s ago`;
    } else if (diffSec < 3600) {
      timeAgo = `${Math.floor(diffSec / 60)}m ago`;
    } else {
      timeAgo = `${Math.floor(diffSec / 3600)}h ago`;
    }

    const isLive = diffSec <= 60; // Received update within 60s
    const isStale = diffSec > 60 && diffSec <= 300; // 1m - 5m
    const isOffline = diffSec > 300; // > 5m

    let derivedStatus = emp.status;
    if (isOffline && derivedStatus === 'WORKING') {
      derivedStatus = 'OFFLINE';
    }

    return {
      isLive,
      isStale,
      isOffline,
      timeAgo,
      diffSec,
      status: derivedStatus,
    };
  };

  const rawBranches = Array.isArray(branchesData) ? branchesData : [];
  const branches: GeofenceBranch[] = rawBranches;

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchesSearch =
        (emp.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (emp.employeeId || '').toLowerCase().includes(search.toLowerCase()) ||
        (emp.department || '').toLowerCase().includes(search.toLowerCase());
      const matchesDept = departmentFilter === 'ALL' || emp.department === departmentFilter;

      const liveInfo = getEmployeeLiveStatus(emp);
      const matchesStatus =
        statusFilter === 'ALL'
          ? true
          : statusFilter === 'LIVE'
          ? liveInfo.isLive
          : statusFilter === 'STALE'
          ? liveInfo.isStale
          : statusFilter === 'OFFLINE'
          ? liveInfo.isOffline
          : emp.status === statusFilter;

      return matchesSearch && matchesDept && matchesStatus;
    });
  }, [employees, search, departmentFilter, statusFilter, nowTimestamp]);

  // Map coordinate normalization for smooth marker rendering
  const mapCenter = useMemo(() => {
    if (employees.length === 0) return { lat: 19.076, lng: 72.8777 };
    const avgLat = employees.reduce((acc, e) => acc + (e.lat || 19.076), 0) / employees.length;
    const avgLng = employees.reduce((acc, e) => acc + (e.lng || 72.8777), 0) / employees.length;
    return { lat: avgLat, lng: avgLng };
  }, [employees]);

  const getStatusBadge = (emp: EmployeeLocationData) => {
    const { isLive, isStale, timeAgo, status } = getEmployeeLiveStatus(emp);

    if (isLive) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> LIVE ({timeAgo})
        </span>
      );
    }
    if (isStale) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold">
          <span className="w-2 h-2 rounded-full bg-amber-500"></span> STALE ({timeAgo})
        </span>
      );
    }
    if (status === 'ON_VISIT') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span> On Visit
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-xs font-bold">
        <span className="w-2 h-2 rounded-full bg-slate-400"></span> Offline ({timeAgo})
      </span>
    );
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
                Live 25-Second GPS Streaming
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Workforce Geo-Tracking & Maps
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-2xl leading-relaxed">
              Real-time employee GPS tracking with 25-second telemetry updates, automatic geofence checks, and live WebSocket telemetry.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-800/80 border border-slate-700 text-xs font-bold text-slate-300 shadow-inner">
              <span className={`w-2.5 h-2.5 rounded-full ${isLiveConnected ? 'bg-[#23C45E] animate-pulse' : 'bg-rose-500'}`} />
              <span>{isLiveConnected ? 'WebSocket Live' : 'Connecting...'}</span>
            </div>
            <button
              onClick={() => {
                refetchLiveLocations();
                toast.success('Refreshing live employee GPS streams...');
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#23C45E] hover:bg-[#1AA14D] text-slate-950 font-black rounded-2xl text-xs shadow-md shadow-[#23C45E]/20 transition-all cursor-pointer active:scale-95"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh Map</span>
            </button>
          </div>
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
          <Map className="w-4 h-4" /> Live Interactive Map ({employees.length})
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
          <Building2 className="w-4 h-4" /> Branch Geofences ({branches.length})
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
                  placeholder="Search employee by name, ID or department..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
              >
                <option value="ALL">All Departments</option>
                <option value="Sales">Sales</option>
                <option value="Operations">Operations</option>
                <option value="Engineering">Engineering</option>
                <option value="General">General</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
              >
                <option value="ALL">All Statuses</option>
                <option value="LIVE">Live Streaming (≤ 60s)</option>
                <option value="STALE">Stale (1m - 5m)</option>
                <option value="OFFLINE">Offline (&gt; 5m)</option>
                <option value="ON_VISIT">On Field Visit</option>
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
                  <Navigation className="w-4 h-4 text-emerald-400" /> Live Workforce GPS Map Canvas
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                    Live Telemetry: 25s Interval
                  </span>
                </div>
              </div>

              {/* Map Canvas Visual */}
              <div className="flex-1 bg-slate-950 relative overflow-hidden flex items-center justify-center p-6 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]">
                {/* Branch Geofence Radius Circles */}
                <div className="absolute w-72 h-72 rounded-full border-2 border-dashed border-emerald-500/40 bg-emerald-500/10 flex items-center justify-center top-1/4 left-1/3 pointer-events-none">
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest bg-slate-900/80 px-2 py-0.5 rounded border border-emerald-800">
                    Office Geofence (200m)
                  </span>
                </div>

                {/* Map Employee Pins / Markers */}
                <div className="relative w-full h-full min-h-[480px]">
                  {filteredEmployees.length === 0 ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-slate-950/60 backdrop-blur-xs rounded-2xl border border-slate-800">
                      <Radio className="w-12 h-12 text-slate-600 animate-pulse mb-3" />
                      <h4 className="text-sm font-bold text-slate-300">No Live GPS Coordinates Available</h4>
                      <p className="text-xs text-slate-500 max-w-sm mt-1">
                        Employees broadcast live location data during active shifts every 25 seconds.
                      </p>
                    </div>
                  ) : (
                    filteredEmployees.map((emp, index) => {
                      const isSelected = selectedEmployee?.id === emp.id;
                      const liveInfo = getEmployeeLiveStatus(emp);

                      // Calculate relative offset from map center
                      const latDiff = (emp.lat - mapCenter.lat) * 1000;
                      const lngDiff = (emp.lng - mapCenter.lng) * 1000;

                      // Bound clamped percentage on the canvas
                      const topPercent = Math.min(85, Math.max(15, 50 - latDiff * 8 + (index % 3) * 6));
                      const leftPercent = Math.min(85, Math.max(15, 50 + lngDiff * 8 + (index % 4) * 8));

                      return (
                        <div
                          key={emp.id}
                          onClick={() => setSelectedEmployee(emp)}
                          style={{
                            top: `${topPercent}%`,
                            left: `${leftPercent}%`,
                          }}
                          className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-700 ease-out z-20 group"
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
                                  liveInfo.isLive
                                    ? 'bg-emerald-500 animate-pulse'
                                    : liveInfo.isStale
                                    ? 'bg-amber-500'
                                    : 'bg-slate-400'
                                }`}
                              ></span>
                            </div>
                            <div className="text-left pr-1">
                              <p className="text-xs font-black leading-tight whitespace-nowrap">{emp.name}</p>
                              <p className="text-[10px] text-emerald-300 font-medium whitespace-nowrap">
                                {liveInfo.isLive ? `● LIVE (${liveInfo.timeAgo})` : `● ${liveInfo.timeAgo}`}
                              </p>
                            </div>
                          </div>

                          {/* Pulse animation ring for live streaming */}
                          {liveInfo.isLive && (
                            <div className="absolute inset-0 rounded-full bg-emerald-500/30 animate-ping pointer-events-none -z-10" />
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Map Legend Overlay */}
                <div className="absolute bottom-4 left-4 z-10 bg-slate-900/90 backdrop-blur-md p-3 rounded-2xl border border-slate-800 text-[11px] text-slate-300 space-y-1 shadow-md">
                  <p className="font-extrabold text-white text-xs mb-1">Status Legend</p>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span> Live (≤ 60s)
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Stale (&gt; 60s)
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span> Offline
                    </span>
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
                    {getStatusBadge(selectedEmployee)}
                  </div>

                  {/* Location & Geofence Status */}
                  <div className="space-y-3">
                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-bold flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600" /> Current Address
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {getEmployeeLiveStatus(selectedEmployee).timeAgo}
                        </span>
                      </div>
                      <p className="text-xs font-extrabold text-slate-800">{selectedEmployee.address}</p>
                      <p className="text-[10px] text-slate-500 font-mono pt-1">
                        GPS: {selectedEmployee.lat.toFixed(6)}, {selectedEmployee.lng.toFixed(6)} (±{selectedEmployee.accuracy?.toFixed(1) || '10.0'}m)
                      </p>
                    </div>

                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-bold">Assigned Branch Radius</span>
                        <span
                          className={`font-extrabold text-[10px] px-2 py-0.5 rounded-full ${
                            selectedEmployee.assignedBranch?.isInsideRadius
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {selectedEmployee.assignedBranch?.isInsideRadius ? 'INSIDE RADIUS' : 'OUTSIDE RADIUS'}
                        </span>
                      </div>
                      <p className="font-extrabold text-slate-800">{selectedEmployee.assignedBranch?.name || 'Head Office'}</p>
                      <p className="text-[11px] text-slate-600">
                        Distance: <span className="font-bold text-slate-900">{selectedEmployee.assignedBranch?.distanceMeters || 0}m</span> (Max Radius: {selectedEmployee.assignedBranch?.radiusMeters || 200}m)
                      </p>
                    </div>

                    {/* Today's Punch Information */}
                    {selectedEmployee.todayAttendance?.punchIn && (
                      <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-200 space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-emerald-800 font-bold flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-emerald-600" /> Today's Shift Punch
                          </span>
                          <span className="text-[10px] font-black text-emerald-700">
                            {selectedEmployee.todayAttendance.status || 'PRESENT'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-700">
                          Punched in at: <span className="font-bold">{selectedEmployee.todayAttendance.punchIn}</span>
                        </p>
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
                      {getStatusBadge(emp)}
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
                  {employees.map((e) => (
                    <option key={e.id} value={e.employeeId}>
                      {e.name} ({e.employeeId})
                    </option>
                  ))}
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
                <Building2 className="w-4 h-4" /> Add Branch Geofence
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {branches.map((branch) => (
                <div key={branch.id} className="bg-slate-50 p-6 rounded-2xl border border-slate-200/80 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                      {branch.isActive !== false ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm">{branch.name}</h4>
                    <p className="text-xs text-slate-500 mt-0.5 font-medium">{branch.city || 'Main Branch'}</p>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-200">
                    <p>Allowed Punch Radius: <span className="font-bold text-slate-900">{branch.radiusMeters || 200} meters</span></p>
                    <p>Coordinates: <span className="font-mono text-slate-800">{branch.latitude || branch.lat || 0}, {branch.longitude || branch.lng || 0}</span></p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: TRACKING RULES & POLICY */}
      {activeTab === 'policy' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
            <div>
              <h3 className="text-lg font-black text-slate-900">Workforce Location Privacy & Tracking Rules</h3>
              <p className="text-xs text-slate-500 font-medium">Enforce organizational consent guidelines, retention boundaries, and customer isolation policies.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-2">
                <h4 className="font-extrabold text-emerald-900 text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> 25-Second Periodic Streaming
                </h4>
                <p className="text-slate-600 leading-relaxed">
                  Employee GPS is acquired with high accuracy and transmitted every 25 seconds during active shift hours.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-blue-50/50 border border-blue-200 space-y-2">
                <h4 className="font-extrabold text-blue-900 text-sm flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-blue-600" /> Shift & Punch Out Lifecycle
                </h4>
                <p className="text-slate-600 leading-relaxed">
                  Tracking is strictly enabled upon Punch In and terminated immediately upon confirmed Punch Out or Logout.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
