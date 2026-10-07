'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  Clock,
  Clock3,
  Calendar,
  CalendarDays,
  MapPin,
  Compass,
  Coffee,
  Play,
  Square,
  Sparkles,
  Users,
  UserPlus,
  Building2,
  TrendingUp,
  Award,
  ChevronRight,
  RefreshCw,
  Phone,
  CheckCircle2,
  AlertCircle,
  Zap,
  Target,
  Layers,
  ArrowRight,
  ShieldCheck,
  Check,
} from 'lucide-react';
import api from '@/lib/api';
import { useEmployeeAuthStore } from '@/lib/employee-store';
import { toast } from 'react-hot-toast';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDuration(minutes: number): string {
  if (isNaN(minutes) || minutes <= 0) return '0h 0m';
  const h = Math.floor(minutes / 60);
  const m = Math.floor(minutes % 60);
  return `${h}h ${m}m`;
}

function formatTime(isoString?: string | null): string {
  if (!isoString) return '--:--';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '--:--';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  } catch {
    return '--:--';
  }
}

function getStatusBadgeStyle(status: string) {
  const s = (status || '').toUpperCase();
  if (s === 'WORKING' || s === 'PUNCHED_IN' || s === 'PRESENT') {
    return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'WORKING' };
  }
  if (s === 'ON_BREAK' || s === 'BREAK') {
    return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'ON BREAK' };
  }
  if (s === 'PUNCHED_OUT' || s === 'CHECKED_OUT') {
    return { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200', label: 'PUNCHED OUT' };
  }
  return { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200', label: 'NOT PUNCHED IN' };
}

function getLeadStageColor(status: string) {
  const s = (status || '').toUpperCase();
  if (s === 'NEW') return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' };
  if (s === 'CONTACTED') return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' };
  if (s === 'QUALIFIED' || s === 'FOLLOW_UP' || s === 'FOLLOW-UP')
    return { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', dot: 'bg-purple-500' };
  if (s === 'CONVERTED' || s === 'WON')
    return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' };
  if (s === 'LOST')
    return { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500' };
  return { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', dot: 'bg-slate-400' };
}

export default function EmployeeDashboardPage() {
  const user = useEmployeeAuthStore((state) => state.user);
  const token = useEmployeeAuthStore((state) => state.token);

  // Data States
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [attendance, setAttendance] = useState<any>(null);
  const [quota, setQuota] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [commissions, setCommissions] = useState<any>(null);
  const [recentLeads, setRecentLeads] = useState<any[]>([]);

  // Action States
  const [punchLoading, setPunchLoading] = useState(false);
  const [breakLoading, setBreakLoading] = useState(false);
  const [gpsRefreshing, setGpsRefreshing] = useState(false);
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Real-time Working Seconds / Break Seconds Counter
  const [liveElapsedSeconds, setLiveElapsedSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // ── Fetch All Dashboard Data ───────────────────────────────────────────────
  const fetchDashboardData = useCallback(async (isRefresh = false) => {
    if (!token) return;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const authHeader = { headers: { Authorization: `Bearer ${token}` } };

      const [profRes, attRes, quotaRes, metricsRes, commRes, leadsRes] = await Promise.allSettled([
        api.get('/employees/profile/me', authHeader),
        api.get('/attendance/me', authHeader),
        api.get('/lead-generation-limits/me', authHeader),
        api.get('/leads/metrics', authHeader),
        api.get('/commissions/me', authHeader),
        api.get('/leads', { ...authHeader, params: { limit: 5 } }),
      ]);

      if (profRes.status === 'fulfilled') {
        const val = profRes.value as any;
        setProfile(val?.data?.data || val?.data || val);
      }
      if (attRes.status === 'fulfilled') {
        const val = attRes.value as any;
        setAttendance(val?.data?.data || val?.data || val);
      }
      if (quotaRes.status === 'fulfilled') {
        const val = quotaRes.value as any;
        setQuota(val?.data?.data || val?.data || val);
      }
      if (metricsRes.status === 'fulfilled') {
        const val = metricsRes.value as any;
        setMetrics(val?.data?.data || val?.data || val);
      }
      if (commRes.status === 'fulfilled') {
        const val = commRes.value as any;
        setCommissions(val?.data?.data || val?.data || val);
      }
      if (leadsRes.status === 'fulfilled') {
        const val = leadsRes.value as any;
        const items = val?.data?.data || val?.data?.items || val?.data || val?.items || [];
        setRecentLeads(Array.isArray(items) ? items : []);
      }
    } catch (err) {
      console.error('[EMPLOYEE_DASHBOARD] Fetch failed:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // ── Live Clock Tick ────────────────────────────────────────────────────────
  useEffect(() => {
    const isPunchedIn = attendance?.status?.isPunchedIn;
    const isPunchedOut = Boolean(attendance?.status?.punchOutTime);
    const isOnBreak = attendance?.status?.isOnBreak;

    if (isPunchedIn && !isPunchedOut && attendance?.status?.punchInTime) {
      const punchInMs = new Date(attendance.status.punchInTime).getTime();
      const totalBreakMins = Number(attendance?.status?.totalBreakMinutes || 0);

      const updateTicker = () => {
        const nowMs = Date.now();
        const grossSecs = Math.max(0, Math.floor((nowMs - punchInMs) / 1000));
        const netSecs = Math.max(0, grossSecs - totalBreakMins * 60);
        setLiveElapsedSeconds(netSecs);
      };

      updateTicker();
      timerRef.current = setInterval(updateTicker, 1000);

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    } else {
      setLiveElapsedSeconds((attendance?.status?.workingMinutes || 0) * 60);
    }
  }, [attendance]);

  // ── Geolocation Helper ─────────────────────────────────────────────────────
  const getCurrentLocation = useCallback(async (): Promise<{ latitude: number; longitude: number }> => {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && 'geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
            setCurrentCoords({ lat: coords.latitude, lng: coords.longitude });
            resolve(coords);
          },
          () => {
            // Fallback to office coordinates or default Mumbai coords
            const officeLat = Number(attendance?.office?.latitude) || 19.076;
            const officeLng = Number(attendance?.office?.longitude) || 72.8777;
            resolve({ latitude: officeLat, longitude: officeLng });
          },
          { timeout: 8000, enableHighAccuracy: true }
        );
      } else {
        const officeLat = Number(attendance?.office?.latitude) || 19.076;
        const officeLng = Number(attendance?.office?.longitude) || 72.8777;
        resolve({ latitude: officeLat, longitude: officeLng });
      }
    });
  }, [attendance?.office]);

  // ── Refresh GPS Button ─────────────────────────────────────────────────────
  const handleRefreshGps = async () => {
    setGpsRefreshing(true);
    try {
      const coords = await getCurrentLocation();
      toast.success(`GPS Acquired: ${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`, {
        icon: '📍',
      });
    } catch {
      toast.error('Unable to retrieve GPS position.');
    } finally {
      setGpsRefreshing(false);
    }
  };

  // ── Punch In / Punch Out Action ────────────────────────────────────────────
  const handlePunchToggle = async () => {
    if (!token) return;
    const isPunchedIn = attendance?.status?.isPunchedIn;
    const isPunchedOut = Boolean(attendance?.status?.punchOutTime);

    if (isPunchedOut) {
      toast('Shift already completed for today.', { icon: 'ℹ️' });
      return;
    }

    setPunchLoading(true);
    try {
      const coords = await getCurrentLocation();
      const endpoint = isPunchedIn ? '/attendance/punch-out' : '/attendance/punch-in';

      await api.post(
        endpoint,
        {
          latitude: coords.latitude,
          longitude: coords.longitude,
          notes: 'Web Employee Workspace',
          biometricVerified: true,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(isPunchedIn ? 'Checked out successfully!' : 'Checked in successfully!', {
        icon: isPunchedIn ? '👋' : '✅',
      });

      await fetchDashboardData(true);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Attendance action failed';
      toast.error(typeof msg === 'string' ? msg : 'Action failed');
    } finally {
      setPunchLoading(false);
    }
  };

  // ── Break Start / End Action ───────────────────────────────────────────────
  const handleBreakToggle = async () => {
    if (!token) return;
    const isOnBreak = attendance?.status?.isOnBreak;

    setBreakLoading(true);
    try {
      const endpoint = isOnBreak ? '/attendance/break/end' : '/attendance/break/start';

      await api.post(endpoint, {}, { headers: { Authorization: `Bearer ${token}` } });

      toast.success(isOnBreak ? 'Break ended. Welcome back!' : 'Break started. Enjoy your break!', {
        icon: isOnBreak ? '💼' : '☕',
      });

      await fetchDashboardData(true);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Break action failed';
      toast.error(typeof msg === 'string' ? msg : 'Action failed');
    } finally {
      setBreakLoading(false);
    }
  };

  // ── Resolved Dynamic Employee Details ──────────────────────────────────────
  const employeeName =
    [profile?.firstName || user?.firstName, profile?.lastName || user?.lastName].filter(Boolean).join(' ') ||
    'Employee';
  const employeeCode = profile?.employeeCode || profile?.employeeId || (user as any)?.employeeCode || 'EMP';
  const designationName =
    profile?.designation?.name ||
    profile?.designation?.title ||
    quota?.roleName ||
    (user as any)?.designation ||
    'TELESALES EXECUTIVE';
  const departmentName = profile?.department?.name || 'BPO Call Center';
  const officeName = attendance?.office?.name || profile?.office?.name || 'QuikBoom Headquarters';
  const officeAddress = attendance?.office?.address || profile?.office?.address || 'Vadodara, Gujarat';

  // Attendance Status Resolution
  const isPunchedIn = Boolean(attendance?.status?.isPunchedIn);
  const isPunchedOut = Boolean(attendance?.status?.punchOutTime);
  const isOnBreak = Boolean(attendance?.status?.isOnBreak);

  let currentStatusString = 'NOT_PUNCHED_IN';
  if (isPunchedOut) currentStatusString = 'PUNCHED_OUT';
  else if (isOnBreak) currentStatusString = 'ON_BREAK';
  else if (isPunchedIn) currentStatusString = 'WORKING';

  const badgeStyle = getStatusBadgeStyle(currentStatusString);

  // Live Working Time Format
  const workingHours = Math.floor(liveElapsedSeconds / 3600);
  const workingMins = Math.floor((liveElapsedSeconds % 3600) / 60);
  const liveWorkingDurationStr = `${workingHours}h ${workingMins}m`;

  const breakDurationStr = formatDuration(Number(attendance?.status?.totalBreakMinutes || 0));

  // Today Date Formatting
  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  // Quota Metrics
  const dailyUsed = quota?.daily?.used ?? 0;
  const dailyLimit = quota?.daily?.limit ?? 100;
  const dailyPercent = Math.min(100, Math.round((dailyUsed / Math.max(1, dailyLimit)) * 100));

  const monthlyUsed = quota?.monthly?.used ?? 0;
  const monthlyLimit = quota?.monthly?.limit ?? 2000;
  const monthlyPercent = Math.min(100, Math.round((monthlyUsed / Math.max(1, monthlyLimit)) * 100));

  // Lead Pipeline Metrics
  const pipelineTotal = Number(metrics?.total || 0);
  const countNew = Number(metrics?.new || 0);
  const countContacted = Number(metrics?.contacted || 0);
  const countQualified = Number(metrics?.qualified || 0);
  const countConverted = Number(metrics?.converted || 0);
  const countLost = Number(metrics?.lost || 0);

  // Commission Metrics
  const totalCommission =
    commissions?.summary?.totalCommission ??
    (Array.isArray(commissions?.data)
      ? commissions.data.reduce((sum: number, c: any) => sum + Number(c.commissionAmount || 0), 0)
      : 0);

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6 animate-pulse">
        <div className="h-20 bg-white rounded-2xl border border-slate-200" />
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="xl:col-span-7 space-y-6">
            <div className="h-72 bg-white rounded-2xl border border-slate-200" />
            <div className="h-64 bg-white rounded-2xl border border-slate-200" />
          </div>
          <div className="xl:col-span-5 space-y-6">
            <div className="h-56 bg-white rounded-2xl border border-slate-200" />
            <div className="h-48 bg-white rounded-2xl border border-slate-200" />
            <div className="h-48 bg-white rounded-2xl border border-slate-200" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* ── HEADER / GREETING BAR ─────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Welcome back, {employeeName}!
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200 tracking-wide uppercase">
              {designationName}
            </span>
            <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-slate-100 text-slate-600 border border-slate-200">
              {employeeCode}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium flex items-center gap-2">
            <span className="font-semibold text-slate-600">{departmentName}</span>
            <span>•</span>
            <span>{todayFormatted}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchDashboardData(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-emerald-600' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* ── MAIN DASHBOARD GRID ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* ── LEFT COLUMN (7 COLS): Attendance, Pipeline, Recent Leads ────── */}
        <div className="xl:col-span-7 space-y-6">
          {/* 1. TODAY'S ATTENDANCE CARD */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-5">
            {/* Card Header */}
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shadow-xs">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                    Today&apos;s Attendance
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">Shift tracking & biometric punch</p>
                </div>
              </div>

              {/* Status Badge */}
              <div
                className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black border ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isPunchedIn && !isPunchedOut ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                  }`}
                />
                {badgeStyle.label}
              </div>
            </div>

            {/* Metrics 4-Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-100">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Check In
                </span>
                <span className="text-base sm:text-lg font-black text-slate-900">
                  {formatTime(attendance?.status?.punchInTime)}
                </span>
              </div>

              <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-100">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Check Out
                </span>
                <span className="text-base sm:text-lg font-black text-slate-900">
                  {formatTime(attendance?.status?.punchOutTime)}
                </span>
              </div>

              <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-100">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Working Time
                </span>
                <span className="text-base sm:text-lg font-black text-emerald-600">
                  {isPunchedIn && !isPunchedOut ? liveWorkingDurationStr : formatDuration(attendance?.status?.workingMinutes || 0)}
                </span>
              </div>

              <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-100">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Break Time
                </span>
                <span className="text-base sm:text-lg font-black text-amber-600">
                  {breakDurationStr}
                </span>
              </div>
            </div>

            {/* Office Location & GPS Indicator */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-800 block leading-tight">{officeName}</span>
                  <span className="text-[11px] text-slate-500 font-medium">{officeAddress}</span>
                </div>
              </div>

              <button
                onClick={handleRefreshGps}
                disabled={gpsRefreshing}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 hover:bg-slate-100 transition-colors self-start sm:self-auto cursor-pointer"
              >
                <Compass className={`w-3.5 h-3.5 text-blue-600 ${gpsRefreshing ? 'animate-spin' : ''}`} />
                <span>{gpsRefreshing ? 'Locating...' : 'Refresh GPS'}</span>
              </button>
            </div>

            {/* Attendance Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Break Button */}
              <button
                onClick={handleBreakToggle}
                disabled={!isPunchedIn || isPunchedOut || breakLoading}
                className={`py-3 px-4 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  isOnBreak
                    ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/20'
                    : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
              >
                <Coffee className="w-4 h-4" />
                <span>{breakLoading ? 'Processing...' : isOnBreak ? 'Resume Work' : 'Start Break'}</span>
              </button>

              {/* Punch Button */}
              <button
                onClick={handlePunchToggle}
                disabled={isPunchedOut || punchLoading}
                className={`py-3 px-4 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  isPunchedOut
                    ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                    : isPunchedIn
                    ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20'
                    : 'bg-[#23C45E] hover:bg-[#1AA14D] text-white shadow-md shadow-[#23C45E]/20'
                }`}
              >
                {punchLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : isPunchedOut ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Zap className="w-4 h-4" />
                )}
                <span>
                  {punchLoading
                    ? 'Recording...'
                    : isPunchedOut
                    ? 'Completed Today'
                    : isPunchedIn
                    ? 'PUNCH OUT'
                    : 'PUNCH IN'}
                </span>
              </button>
            </div>
          </div>

          {/* 2. LEAD PIPELINE CARD */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-5">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shadow-xs">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                    Lead Pipeline
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">Manage & track your leads</p>
                </div>
              </div>

              <span className="text-xs font-black text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                {pipelineTotal} Total
              </span>
            </div>

            {/* Stages Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-center">
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block mb-0.5">
                  New
                </span>
                <span className="text-lg font-black text-blue-900">{countNew}</span>
              </div>

              <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100 text-center">
                <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block mb-0.5">
                  Contacted
                </span>
                <span className="text-lg font-black text-amber-900">{countContacted}</span>
              </div>

              <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100 text-center">
                <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider block mb-0.5">
                  Follow-up
                </span>
                <span className="text-lg font-black text-purple-900">{countQualified}</span>
              </div>

              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 text-center">
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block mb-0.5">
                  Won / Converted
                </span>
                <span className="text-lg font-black text-emerald-900">{countConverted}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center col-span-2 sm:col-span-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                  Lost
                </span>
                <span className="text-lg font-black text-slate-700">{countLost}</span>
              </div>
            </div>

            {/* Pipeline Distribution Bar */}
            <div className="space-y-1.5">
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
                <div
                  style={{ width: `${(countNew / Math.max(1, pipelineTotal)) * 100}%` }}
                  className="bg-blue-500 h-full"
                />
                <div
                  style={{ width: `${(countContacted / Math.max(1, pipelineTotal)) * 100}%` }}
                  className="bg-amber-500 h-full"
                />
                <div
                  style={{ width: `${(countQualified / Math.max(1, pipelineTotal)) * 100}%` }}
                  className="bg-purple-500 h-full"
                />
                <div
                  style={{ width: `${(countConverted / Math.max(1, pipelineTotal)) * 100}%` }}
                  className="bg-emerald-500 h-full"
                />
                <div
                  style={{ width: `${(countLost / Math.max(1, pipelineTotal)) * 100}%` }}
                  className="bg-slate-300 h-full"
                />
              </div>
            </div>

            {/* View All Leads Link */}
            <Link
              href="/employee/leads"
              className="w-full py-2.5 px-4 rounded-xl border-2 border-emerald-500/30 text-emerald-700 hover:bg-emerald-50 text-xs font-bold transition-all flex items-center justify-center gap-2 group"
            >
              <span>View All Leads</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* 3. RECENT LEADS CARD */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center shadow-xs">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                    Recent Leads
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">Latest leads assigned to you</p>
                </div>
              </div>

              <Link
                href="/employee/leads"
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                See all
              </Link>
            </div>

            {recentLeads.length === 0 ? (
              <div className="p-8 text-center bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
                <p className="text-xs font-semibold text-slate-500">No leads found.</p>
                <Link
                  href="/employee/data-capture"
                  className="inline-flex items-center gap-1.5 mt-2 text-xs font-bold text-emerald-600 hover:underline"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Discover leads via Data Capture</span>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentLeads.map((lead: any, idx: number) => {
                  const leadName =
                    lead.companyName ||
                    [lead.firstName, lead.lastName].filter(Boolean).join(' ') ||
                    lead.title ||
                    'Lead Record';
                  const leadPhone = lead.phone || lead.mobile || 'No Phone';
                  const stageStyle = getLeadStageColor(lead.status || 'NEW');

                  return (
                    <div
                      key={lead.id || idx}
                      className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/60 rounded-lg px-2 transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                          {leadName}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{leadPhone}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${stageStyle.bg} ${stageStyle.text} ${stageStyle.border}`}
                        >
                          {lead.status || 'NEW'}
                        </span>
                        <Link
                          href={`/employee/leads`}
                          className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT COLUMN (5 COLS): Quota, Quick Actions, Performance ────── */}
        <div className="xl:col-span-5 space-y-6">
          {/* 4. LEAD GENERATION QUOTA CARD */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-5">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shadow-xs">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                    Lead Generation Quota
                  </h2>
                  <p className="text-[11px] font-black text-emerald-600 uppercase tracking-wider mt-0.5">
                    {designationName}
                  </p>
                </div>
              </div>
            </div>

            {/* Daily Quota Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">Today</span>
                <span className="font-mono font-black text-slate-900">
                  {dailyUsed} / {dailyLimit}
                </span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  style={{ width: `${dailyPercent}%` }}
                  className={`h-full rounded-full transition-all duration-500 ${
                    dailyPercent >= 100 ? 'bg-rose-500' : 'bg-emerald-500'
                  }`}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>{dailyPercent}% Used</span>
                <span>{Math.max(0, dailyLimit - dailyUsed)} Remaining</span>
              </div>
            </div>

            {/* Monthly Quota Progress */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">This Month</span>
                <span className="font-mono font-black text-slate-900">
                  {monthlyUsed} / {monthlyLimit}
                </span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  style={{ width: `${monthlyPercent}%` }}
                  className={`h-full rounded-full transition-all duration-500 ${
                    monthlyPercent >= 100 ? 'bg-rose-500' : 'bg-blue-500'
                  }`}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>{monthlyPercent}% Used</span>
                <span>{Math.max(0, monthlyLimit - monthlyUsed)} Remaining</span>
              </div>
            </div>
          </div>

          {/* 5. QUICK ACTIONS CARD */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center shadow-xs">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                  Quick Actions
                </h2>
                <p className="text-xs text-slate-500 font-medium">Workflows & common shortcuts</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Link
                href="/employee/data-capture"
                className="p-3.5 bg-blue-50/70 hover:bg-blue-100/70 border border-blue-100 rounded-xl text-left transition-colors flex flex-col justify-between gap-3 group"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-500 text-white flex items-center justify-center shadow-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-black text-xs text-slate-900 group-hover:text-blue-700 transition-colors">
                    Data Capture
                  </div>
                  <div className="text-[10px] text-slate-500">Google Places lead hunt</div>
                </div>
              </Link>

              <Link
                href="/employee/leads"
                className="p-3.5 bg-emerald-50/70 hover:bg-emerald-100/70 border border-emerald-100 rounded-xl text-left transition-colors flex flex-col justify-between gap-3 group"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-black text-xs text-slate-900 group-hover:text-emerald-700 transition-colors">
                    Add Lead
                  </div>
                  <div className="text-[10px] text-slate-500">Create new prospect</div>
                </div>
              </Link>

              <Link
                href="/employee/customers"
                className="p-3.5 bg-purple-50/70 hover:bg-purple-100/70 border border-purple-100 rounded-xl text-left transition-colors flex flex-col justify-between gap-3 group"
              >
                <div className="w-8 h-8 rounded-lg bg-purple-500 text-white flex items-center justify-center shadow-xs">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-black text-xs text-slate-900 group-hover:text-purple-700 transition-colors">
                    Customers
                  </div>
                  <div className="text-[10px] text-slate-500">View customer base</div>
                </div>
              </Link>

              <Link
                href="/employee/calendar"
                className="p-3.5 bg-amber-50/70 hover:bg-amber-100/70 border border-amber-100 rounded-xl text-left transition-colors flex flex-col justify-between gap-3 group"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-xs">
                  <CalendarDays className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-black text-xs text-slate-900 group-hover:text-amber-700 transition-colors">
                    Calendar
                  </div>
                  <div className="text-[10px] text-slate-500">Schedules & tasks</div>
                </div>
              </Link>
            </div>
          </div>

          {/* 6. YOUR PERFORMANCE CARD */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shadow-xs">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                  Your Performance
                </h2>
                <p className="text-xs text-slate-500 font-medium">Monthly milestones & earnings</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Total Leads
                </span>
                <span className="text-lg font-black text-slate-900">{pipelineTotal}</span>
              </div>

              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Customers
                </span>
                <span className="text-lg font-black text-slate-900">{countConverted}</span>
              </div>

              <div className="bg-emerald-50/60 rounded-xl p-3 border border-emerald-100 text-center">
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block mb-1">
                  Commission
                </span>
                <span className="text-lg font-black text-emerald-800">
                  ₹{Number(totalCommission).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}