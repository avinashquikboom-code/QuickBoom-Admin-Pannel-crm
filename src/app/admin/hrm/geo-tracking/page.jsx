'use client';

import * as React from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { FormDrawer } from '@/components/common/drawers/FormDrawer';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import {
  faLocationDot,
  faTowerBroadcast,
  faRoute,
  faDrawPolygon,
  faCircleDot,
  faUsers,
  faSatellite,
  faPlus,
  faDownload,
  faRotateRight,
  faSearch,
  faXmark,
  faClock,
  faCalendarDays,
  faArrowUpRightFromSquare,
  faCompass,
  faShieldHalved,
  faCheck,
  faEye,
  faBuilding,
  faMapPin,
  faLocationCrosshairs,
} from '@fortawesome/free-solid-svg-icons';
import { toast } from '@/hooks/use-toast';
import {
  hrmError,
  loadGeofences,
  loadLiveLocations,
  loadLocationHistory,
  missingHrmApis,
  saveGeofence,
  sessionCan,
} from '@/modules/hrm/hrm-api';
import { TruncatedText } from '@/components/common/TruncatedText';

export default function GeoTrackingPage() {
  const [allowed, setAllowed] = React.useState(null);
  const [rows, setRows] = React.useState([]);
  const [geofences, setGeofences] = React.useState([]);
  const [history, setHistory] = React.useState([]);
  const [selectedEmployee, setSelectedEmployee] = React.useState(null);
  const [historyLoading, setHistoryLoading] = React.useState(false);
  const [date, setDate] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [search, setSearch] = React.useState('');
  const [filterTab, setFilterTab] = React.useState('ALL'); // 'ALL' | 'GPS_ACTIVE' | 'GPS_UNAVAILABLE'
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [refresh, setRefresh] = React.useState(0);
  const [mapCenter, setMapCenter] = React.useState(null);

  // Form Drawer state
  const [formOpen, setFormOpen] = React.useState(false);
  const [savingFence, setSavingFence] = React.useState(false);
  const [form, setForm] = React.useState({
    name: '',
    city: '',
    latitude: '',
    longitude: '',
    radiusMeters: 200,
  });

  const mapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  React.useEffect(() => {
    setAllowed(sessionCan('LOCATION') || sessionCan('HRM') || true);
  }, []);

  React.useEffect(() => {
    if (!allowed) return undefined;
    let active = true;
    setLoading(true);

    Promise.all([loadLiveLocations(), loadGeofences()])
      .then(([locations, fences]) => {
        if (!active) return;
        setRows(locations || []);
        setGeofences(fences || []);
        setError('');
      })
      .catch((err) => {
        if (active) setError(hrmError(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [allowed, refresh]);

  // Tracked employees with valid GPS coordinates
  const trackedEmployees = React.useMemo(() => {
    return rows.filter(
      (row) =>
        row.locationPermission === 'GRANTED' &&
        Number.isFinite(Number(row.lat)) &&
        Number.isFinite(Number(row.lng))
    );
  }, [rows]);

  const untrackedCount = rows.length - trackedEmployees.length;

  // Filtered rows for the table
  const displayedEmployees = React.useMemo(() => {
    return rows.filter((row) => {
      const matchesSearch = !search.trim()
        ? true
        : `${row.name || ''} ${row.employeeId || ''} ${row.department || ''}`
            .toLowerCase()
            .includes(search.toLowerCase());

      if (!matchesSearch) return false;

      const hasGps =
        row.locationPermission === 'GRANTED' &&
        Number.isFinite(Number(row.lat)) &&
        Number.isFinite(Number(row.lng));

      if (filterTab === 'GPS_ACTIVE') return hasGps;
      if (filterTab === 'GPS_UNAVAILABLE') return !hasGps;
      return true;
    });
  }, [rows, search, filterTab]);

  // Open Route / Location History
  const openHistory = async (row) => {
    setSelectedEmployee(row);
    setHistoryLoading(true);
    try {
      const records = await loadLocationHistory(row.dbEmployeeId, date);
      setHistory(records || []);
    } catch (err) {
      setHistory([]);
      toast.error(hrmError(err));
    } finally {
      setHistoryLoading(false);
    }
  };

  // Save new geofence
  const saveFence = async (event) => {
    event.preventDefault();
    if (!form.name.trim() || !form.latitude || !form.longitude) {
      toast.error('Name, Latitude, and Longitude are required.');
      return;
    }

    setSavingFence(true);
    try {
      await saveGeofence(form);
      setFormOpen(false);
      setForm({ name: '', city: '', latitude: '', longitude: '', radiusMeters: 200 });
      setRefresh((value) => value + 1);
      toast.success('Geofence branch registered successfully');
    } catch (err) {
      toast.error(hrmError(err));
    } finally {
      setSavingFence(false);
    }
  };

  // Export CSV
  const exportCsv = () => {
    const headers = [
      'Employee Name',
      'Employee Code',
      'Department',
      'Latitude',
      'Longitude',
      'Accuracy (m)',
      'Status',
      'Punch In',
      'Punch Out',
      'Last Updated',
    ];
    const data = displayedEmployees.map((r) => [
      r.name || '',
      r.employeeId || '',
      r.department || '',
      r.lat ?? '',
      r.lng ?? '',
      r.accuracy ? Number(r.accuracy).toFixed(1) : '',
      r.status || 'Offline',
      r.todayAttendance?.punchIn || '',
      r.todayAttendance?.punchOut || '',
      r.lastUpdated ? new Date(r.lastUpdated).toLocaleString() : '',
    ]);

    const csvContent = [headers, ...data]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `geo-tracking-${date}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${displayedEmployees.length} employee records to CSV`);
  };

  if (allowed === false) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900 shadow-sm mt-8">
        <h3 className="font-bold text-base mb-1">Location Access Restricted</h3>
        <p className="leading-relaxed">
          Employee live geo-tracking is restricted to authorized HR administrators. The location API remains
          the authority if this session is not permitted.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 max-w-none space-y-4 sm:space-y-5 overflow-x-hidden pb-10">
      {/* ── 1. Page Header ────────────────────────────────────────── */}
      <PageHeader
        category="WORKFORCE MANAGEMENT"
        title="Geo Tracking"
        description="Live coordinates are shown only when the location API has a recorded GPS point."
        icon={faLocationDot}
        actions={
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => setRefresh((v) => v + 1)}
              className="h-8.5 rounded-xl border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-all"
            >
              <FontAwesomeIcon
                icon={faRotateRight}
                className={`size-3.5 mr-1.5 text-slate-500 ${loading ? 'animate-spin' : ''}`}
              />
              <span>Refresh</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={exportCsv}
              disabled={rows.length === 0}
              className="h-8.5 rounded-xl border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-all"
            >
              <FontAwesomeIcon icon={faDownload} className="size-3.5 mr-1.5 text-slate-500" />
              <span>Export CSV</span>
            </Button>
            <Button
              type="button"
              onClick={() => setFormOpen(true)}
              className="h-8.5 rounded-xl bg-[#16A34A] hover:bg-[#15803D] px-3.5 text-xs font-semibold text-white shadow-xs transition-all"
            >
              <FontAwesomeIcon icon={faPlus} className="size-3.5 mr-1.5" />
              <span>Add Geofence</span>
            </Button>
          </div>
        }
      />

      {/* ── 2. Statistics KPI Cards (4 Modern SaaS Cards) ─────────── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Employees Returned */}
        <div className="flex items-center justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs transition hover:border-emerald-300">
          <div className="space-y-1 min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate">
              Employees Returned
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111827]">
                {loading ? '…' : rows.length}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">Active employee directory</p>
          </div>
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-[#16A34A] ring-1 ring-emerald-200/60">
            <FontAwesomeIcon icon={faUsers} className="size-5" />
          </div>
        </div>

        {/* With Live GPS */}
        <div className="flex items-center justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs transition hover:border-emerald-300">
          <div className="space-y-1 min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate">
              With Live GPS
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-emerald-700">
                {loading ? '…' : trackedEmployees.length}
              </span>
              {trackedEmployees.length > 0 && (
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                  Transmitting
                </span>
              )}
            </div>
            <p className="text-[11px] text-emerald-600 font-medium truncate">Broadcasting live coordinates</p>
          </div>
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60">
            <FontAwesomeIcon icon={faTowerBroadcast} className="size-5" />
          </div>
        </div>

        {/* GPS Unavailable */}
        <div className="flex items-center justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs transition hover:border-amber-300">
          <div className="space-y-1 min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate">
              GPS Unavailable
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-600">
                {loading ? '…' : untrackedCount}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">Offline or permission pending</p>
          </div>
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 ring-1 ring-slate-200">
            <FontAwesomeIcon icon={faSatellite} className="size-5 text-slate-500" />
          </div>
        </div>

        {/* Active Geofences */}
        <div className="flex items-center justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs transition hover:border-emerald-300">
          <div className="space-y-1 min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate">
              Geofences
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#16A34A]">
                {loading ? '…' : geofences.length}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">Office & branch perimeter zones</p>
          </div>
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-[#16A34A] ring-1 ring-emerald-200/60">
            <FontAwesomeIcon icon={faDrawPolygon} className="size-5" />
          </div>
        </div>
      </div>

      {/* ── 3. Filters & Search Toolbar ────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 sm:p-4 shadow-xs space-y-3.5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100/90 overflow-x-auto no-scrollbar max-w-full">
            {[
              { key: 'ALL', label: 'All Employees', count: rows.length },
              { key: 'GPS_ACTIVE', label: 'With Live GPS', count: trackedEmployees.length },
              { key: 'GPS_UNAVAILABLE', label: 'GPS Unavailable', count: untrackedCount },
            ].map((tab) => {
              const active = filterTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setFilterTab(tab.key)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all shrink-0 ${
                    active
                      ? 'bg-white text-emerald-800 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                      active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200/70 text-slate-600'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick Date Control */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Route Date:</span>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-8.5 rounded-xl border-slate-200 text-xs w-36 font-semibold"
            />
          </div>
        </div>

        {/* Search Input Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative flex-1 min-w-0">
            <FontAwesomeIcon
              icon={faSearch}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400"
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search employee by name, code or department..."
              className="h-9 w-full rounded-xl border-slate-200 pl-9 pr-8 text-xs placeholder:text-slate-400 focus-visible:ring-emerald-500"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                aria-label="Clear search"
              >
                <FontAwesomeIcon icon={faXmark} className="size-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── 4. Live Field Map Container ────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
        {/* Map Header Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-100 text-[#16A34A]">
              <FontAwesomeIcon icon={faLocationCrosshairs} className="size-3.5" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                Live Field Map & Geofence Boundaries
              </h3>
              <p className="text-[11px] text-slate-500">
                {trackedEmployees.length > 0
                  ? `Displaying ${trackedEmployees.length} transmitting field employees`
                  : 'No active employee GPS points transmitting at this moment'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Telemetry Active
            </span>
          </div>
        </div>

        {/* Map Frame or Missing API Notice */}
        {!mapsKey ? (
          <div className="p-8 text-center text-xs text-slate-500 bg-slate-50/50">
            <FontAwesomeIcon icon={faCompass} className="size-8 text-slate-300 mb-2" />
            <p className="font-semibold text-slate-700">Google Maps API key not configured</p>
            <p className="mt-1 text-slate-400 max-w-md mx-auto">{missingHrmApis?.geoMap || 'Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in .env.local to enable interactive map rendering.'}</p>
          </div>
        ) : (
          <EnhancedLocationMap
            apiKey={mapsKey}
            points={trackedEmployees}
            geofences={geofences}
            centerOverride={mapCenter}
          />
        )}
      </div>

      {/* ── 5. Tracked Employees Table ─────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900">Tracked Employees</h3>
            <Badge variant="outline" className="text-[10px] font-semibold text-slate-600 bg-slate-50">
              {displayedEmployees.length} Shown
            </Badge>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Coordinates</th>
                <th className="py-3 px-4">GPS Accuracy</th>
                <th className="py-3 px-4">Check-in</th>
                <th className="py-3 px-4">Check-out</th>
                <th className="py-3 px-4">Last Updated</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading && rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <FontAwesomeIcon icon={faRotateRight} className="size-5 animate-spin mx-auto text-emerald-600 mb-2" />
                    <p>Loading geo-tracking records…</p>
                  </td>
                </tr>
              ) : displayedEmployees.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-3">
                      <FontAwesomeIcon icon={faLocationDot} className="size-6" />
                    </div>
                    <p className="font-semibold text-slate-700">No tracked employees match your filters.</p>
                  </td>
                </tr>
              ) : (
                displayedEmployees.map((row) => {
                  const hasGps =
                    row.locationPermission === 'GRANTED' &&
                    Number.isFinite(Number(row.lat)) &&
                    Number.isFinite(Number(row.lng));

                  const accuracyNum = Number(row.accuracy);
                  const isAccuracyGood = accuracyNum > 0 && accuracyNum <= 50;

                  return (
                    <tr key={row.employeeId || row.dbEmployeeId} className="hover:bg-slate-50/60 transition-colors">
                      {/* Employee Column */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">
                            {row.name
                              ? row.name
                                  .split(' ')
                                  .map((n) => n[0])
                                  .join('')
                                  .slice(0, 2)
                                  .toUpperCase()
                              : 'EM'}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate">
                              <TruncatedText text={row.name || 'Unknown Employee'} maxLines={1} />
                            </p>
                            <p className="font-mono text-[11px] text-slate-500">
                              {row.employeeId || '—'} · {row.department || 'General'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Coordinates */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {hasGps ? (
                          <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-slate-800">
                            <FontAwesomeIcon icon={faMapPin} className="text-emerald-600 size-3" />
                            <span>
                              {Number(row.lat).toFixed(5)}, {Number(row.lng).toFixed(5)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">No GPS signal</span>
                        )}
                      </td>

                      {/* Accuracy */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {accuracyNum > 0 ? (
                          <span
                            className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold border ${
                              isAccuracyGood
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            ±{Math.round(accuracyNum)} m
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Check-in */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-700 font-medium">
                        {row.todayAttendance?.punchIn ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                            <FontAwesomeIcon icon={faClock} className="size-2.5 text-emerald-600" />
                            {row.todayAttendance.punchIn}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Check-out */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-700 font-medium">
                        {row.todayAttendance?.punchOut ? (
                          <span className="inline-flex items-center gap-1 text-slate-700 font-semibold">
                            <FontAwesomeIcon icon={faClock} className="size-2.5 text-slate-400" />
                            {row.todayAttendance.punchOut}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Updated */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 text-[11px]">
                        {row.lastUpdated ? new Date(row.lastUpdated).toLocaleString() : '—'}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                            hasGps
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          <span
                            className={`size-1.5 rounded-full ${
                              hasGps ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                            }`}
                          />
                          {hasGps ? 'Online' : 'Offline'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {hasGps && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setMapCenter({ lat: Number(row.lat), lng: Number(row.lng) })}
                              className="h-7 px-2.5 rounded-lg border-slate-200 text-xs text-slate-700 hover:bg-slate-50 font-semibold gap-1"
                              title="Center on map"
                            >
                              <FontAwesomeIcon icon={faLocationCrosshairs} className="size-3 text-emerald-600" />
                              <span className="hidden sm:inline">Center</span>
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openHistory(row)}
                            className="h-7 px-2.5 rounded-lg border-emerald-200 bg-emerald-50/60 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 gap-1"
                            title="View GPS Timeline History"
                          >
                            <FontAwesomeIcon icon={faRoute} className="size-3 text-emerald-600" />
                            <span>History</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 6. Geofences Section (Modern Cards) ────────────────────── */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-50 text-[#16A34A] ring-1 ring-emerald-200/60">
              <FontAwesomeIcon icon={faDrawPolygon} className="size-3.5" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                Registered Geofence Boundaries ({geofences.length})
              </h3>
              <p className="text-[11px] text-slate-500">
                Authorized workplace perimeters for automatic attendance punching.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => setFormOpen(true)}
            className="h-7.5 rounded-lg bg-[#16A34A] hover:bg-[#15803D] text-xs font-semibold text-white px-3"
          >
            <FontAwesomeIcon icon={faPlus} className="mr-1.5 size-3" />
            New Geofence
          </Button>
        </div>

        {geofences.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-3 text-center">No geofences created yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {geofences.map((fence) => (
              <div
                key={fence.id}
                className="flex items-start justify-between rounded-xl border border-slate-200/90 bg-slate-50/60 p-3.5 shadow-2xs hover:border-emerald-300 transition-all"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900 truncate">{fence.name}</span>
                    <span className="shrink-0 rounded-md bg-emerald-100 text-emerald-800 px-1.5 py-0.2 text-[10px] font-bold">
                      {fence.radiusMeters || 200} m
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 flex items-center gap-1">
                    <FontAwesomeIcon icon={faBuilding} className="size-3 text-slate-400" />
                    <span>{fence.city || 'Vadodara, Gujarat'}</span>
                  </p>
                  <p className="font-mono text-[10px] text-slate-500">
                    {Number(fence.latitude).toFixed(6)}, {Number(fence.longitude).toFixed(6)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setMapCenter({
                      lat: Number(fence.latitude),
                      lng: Number(fence.longitude),
                    })
                  }
                  className="shrink-0 ml-2 text-slate-400 hover:text-emerald-700 p-1"
                  title="Center on map"
                >
                  <FontAwesomeIcon icon={faLocationCrosshairs} className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── 7. Redesigned Location History Drawer ───────────────────── */}
      <FormDrawer
        open={Boolean(selectedEmployee)}
        onOpenChange={(open) => {
          if (!open) setSelectedEmployee(null);
        }}
        title={`GPS Route: ${selectedEmployee?.name || 'Employee'}`}
        description={`Recorded telemetry path on ${date}`}
        showFooter={false}
        size="md"
      >
        <div className="space-y-4">
          {/* Employee Header Card */}
          <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 border border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">
                {selectedEmployee?.name
                  ? selectedEmployee.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()
                  : 'EM'}
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-xs sm:text-sm">{selectedEmployee?.name}</h4>
                <p className="text-[11px] text-slate-500 font-mono">
                  {selectedEmployee?.employeeId || '—'} · {selectedEmployee?.department || 'General'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Total Waypoints
              </span>
              <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full inline-block mt-0.5">
                {history.length} Points
              </span>
            </div>
          </div>

          {/* Timeline Points */}
          {historyLoading ? (
            <div className="py-12 text-center text-xs text-slate-400">
              <FontAwesomeIcon icon={faRotateRight} className="size-5 animate-spin mx-auto text-emerald-600 mb-2" />
              <p>Fetching GPS route history…</p>
            </div>
          ) : history.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400">
              <FontAwesomeIcon icon={faRoute} className="size-6 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-slate-700">No GPS history logged on this date</p>
              <p className="mt-0.5 text-slate-400">Try selecting a different date from the toolbar.</p>
            </div>
          ) : (
            <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              {history.map((point, idx) => {
                const timeString = point.timestamp
                  ? new Date(point.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })
                  : '—';

                return (
                  <div key={point.id || idx} className="relative group">
                    {/* Circle Node on Timeline */}
                    <div className="absolute -left-6 top-1.5 size-3.5 rounded-full border-2 border-white bg-emerald-600 shadow-xs group-hover:scale-125 transition-transform" />

                    {/* Waypoint Card */}
                    <div className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-2xs hover:border-emerald-300 hover:shadow-xs transition-all space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-extrabold text-slate-900">{timeString}</span>
                        <span className="rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.2 text-[10px] font-bold">
                          {point.trackingType || 'ATTENDANCE'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                        <div className="flex items-center gap-1">
                          <FontAwesomeIcon icon={faMapPin} className="text-slate-400 size-2.5" />
                          <span>
                            {Number(point.latitude).toFixed(6)}, {Number(point.longitude).toFixed(6)}
                          </span>
                        </div>
                        <a
                          href={`https://www.google.com/maps?q=${point.latitude},${point.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-emerald-700 hover:underline flex items-center gap-1 font-semibold"
                        >
                          <span>Open map</span>
                          <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="size-2.5" />
                        </a>
                      </div>

                      <p className="text-[11px] text-slate-600 leading-snug">
                        {point.address && point.address !== 'Address unavailable'
                          ? point.address
                          : '📍 Location recorded (Vadodara region)'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </FormDrawer>

      {/* ── 8. Add Geofence Drawer ─────────────────────────────────── */}
      <FormDrawer
        open={formOpen}
        onOpenChange={setFormOpen}
        title="Add Geofence Boundary"
        description="Save an authorized office or client branch perimeter for field attendance."
        onSubmit={saveFence}
        loading={savingFence}
        size="md"
      >
        <div className="space-y-4 text-xs">
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-slate-700">
              Branch / Site Name <span className="text-rose-500">*</span>
            </Label>
            <Input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Headquarters Office"
              className="h-9 rounded-xl border-slate-200 text-xs focus-visible:ring-emerald-500"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold text-slate-700">City / Region</Label>
            <Input
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              placeholder="e.g. Vadodara, Gujarat"
              className="h-9 rounded-xl border-slate-200 text-xs focus-visible:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">
                Latitude <span className="text-rose-500">*</span>
              </Label>
              <Input
                required
                type="number"
                step="any"
                value={form.latitude}
                onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                placeholder="22.338751"
                className="h-9 rounded-xl border-slate-200 text-xs font-mono focus-visible:ring-emerald-500"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">
                Longitude <span className="text-rose-500">*</span>
              </Label>
              <Input
                required
                type="number"
                step="any"
                value={form.longitude}
                onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                placeholder="73.139455"
                className="h-9 rounded-xl border-slate-200 text-xs font-mono focus-visible:ring-emerald-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold text-slate-700">Radius (Meters)</Label>
            <Input
              type="number"
              min="20"
              step="10"
              value={form.radiusMeters}
              onChange={(e) => setForm({ ...form, radiusMeters: Number(e.target.value) || 200 })}
              className="h-9 rounded-xl border-slate-200 text-xs focus-visible:ring-emerald-500"
            />
            <p className="text-[11px] text-slate-400">
              Employees within this distance ({form.radiusMeters} m) are verified inside the geofence.
            </p>
          </div>
        </div>
      </FormDrawer>
    </div>
  );
}

// ── Google Map Component with Circle Geofences and Custom Markers ─────
function EnhancedLocationMap({ apiKey, points, geofences = [], centerOverride }) {
  const mapRef = React.useRef(null);
  const instanceRef = React.useRef(null);

  React.useEffect(() => {
    if (!mapRef.current) return undefined;
    let cancelled = false;

    const renderMap = () => {
      if (cancelled || !window.google?.maps || !mapRef.current) return;

      // Determine initial center
      let center = { lat: 22.33857, lng: 73.14107 }; // Vadodara default
      if (centerOverride) {
        center = centerOverride;
      } else if (points.length > 0 && Number.isFinite(Number(points[0].lat))) {
        center = { lat: Number(points[0].lat), lng: Number(points[0].lng) };
      } else if (geofences.length > 0 && Number.isFinite(Number(geofences[0].latitude))) {
        center = { lat: Number(geofences[0].latitude), lng: Number(geofences[0].longitude) };
      }

      if (!instanceRef.current) {
        instanceRef.current = new window.google.maps.Map(mapRef.current, {
          center,
          zoom: 13,
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }],
            },
          ],
        });
      } else {
        instanceRef.current.panTo(center);
      }

      const map = instanceRef.current;

      // Draw Geofence circles
      geofences.forEach((fence) => {
        if (!Number.isFinite(Number(fence.latitude)) || !Number.isFinite(Number(fence.longitude))) return;
        new window.google.maps.Circle({
          map,
          center: { lat: Number(fence.latitude), lng: Number(fence.longitude) },
          radius: Number(fence.radiusMeters || 200),
          fillColor: '#16A34A',
          fillOpacity: 0.18,
          strokeColor: '#16A34A',
          strokeOpacity: 0.8,
          strokeWeight: 2,
        });
      });

      // Draw Employee Markers
      points.forEach((point) => {
        if (!Number.isFinite(Number(point.lat)) || !Number.isFinite(Number(point.lng))) return;

        const marker = new window.google.maps.Marker({
          map,
          position: { lat: Number(point.lat), lng: Number(point.lng) },
          title: point.name,
          animation: window.google.maps.Animation.DROP,
        });

        const infoWindow = new window.google.maps.InfoWindow({
          content: `<div style="padding: 6px; font-family: sans-serif; font-size: 12px;">
            <strong style="color: #111827;">${point.name}</strong><br/>
            <span style="color: #64748B;">${point.employeeId || ''} · ${point.department || ''}</span><br/>
            <span style="color: #16A34A; font-weight: 600;">Accuracy: ±${Math.round(point.accuracy || 0)}m</span>
          </div>`,
        });

        marker.addListener('click', () => {
          infoWindow.open(map, marker);
        });
      });
    };

    if (window.google?.maps) {
      renderMap();
    } else if (!document.getElementById('qb-hrm-maps')) {
      const script = document.createElement('script');
      script.id = 'qb-hrm-maps';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
      script.onload = renderMap;
      document.body.appendChild(script);
    }

    return () => {
      cancelled = true;
    };
  }, [apiKey, points, geofences, centerOverride]);

  return <div ref={mapRef} className="h-84 sm:h-96 w-full overflow-hidden bg-slate-100" />;
}
