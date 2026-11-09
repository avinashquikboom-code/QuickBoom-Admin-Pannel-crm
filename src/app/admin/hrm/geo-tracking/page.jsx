'use client';

import * as React from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { FormDrawer } from '@/components/common/drawers/FormDrawer';
import { toast } from '@/hooks/use-toast';
import { HrmGap, HrmNotice, HrmStats } from '@/modules/hrm/HrmNotice';
import { hrmError, loadGeofences, loadLiveLocations, loadLocationHistory, missingHrmApis, saveGeofence, sessionCan } from '@/modules/hrm/hrm-api';

export default function GeoTrackingPage() {
  const [allowed, setAllowed] = React.useState(null);
  const [rows, setRows] = React.useState([]);
  const [geofences, setGeofences] = React.useState([]);
  const [history, setHistory] = React.useState([]);
  const [selected, setSelected] = React.useState(null);
  const [date, setDate] = React.useState(new Date().toISOString().slice(0, 10));
  const [search, setSearch] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [refresh, setRefresh] = React.useState(0);
  const [formOpen, setFormOpen] = React.useState(false);
  const [form, setForm] = React.useState({ name: '', city: '', latitude: '', longitude: '', radiusMeters: 200 });
  const mapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  React.useEffect(() => { setAllowed(sessionCan('LOCATION') || sessionCan('HRM')); }, []);
  React.useEffect(() => {
    if (!allowed) return undefined;
    let active = true;
    setLoading(true);
    Promise.all([loadLiveLocations(), loadGeofences()])
      .then(([locations, fences]) => { if (!active) return; setRows(locations); setGeofences(fences); setError(''); })
      .catch((err) => { if (active) setError(hrmError(err)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [allowed, refresh]);

  const tracked = rows.filter((row) => row.locationPermission === 'GRANTED' && Number.isFinite(Number(row.lat)) && Number.isFinite(Number(row.lng)));
  const visible = tracked.filter((row) => `${row.name} ${row.employeeId} ${row.department}`.toLowerCase().includes(search.toLowerCase()));
  const openHistory = async (row) => {
    setSelected(row);
    try {
      setHistory(await loadLocationHistory(row.dbEmployeeId, date));
    } catch (err) {
      setHistory([]);
      toast.error(hrmError(err));
    }
  };
  const saveFence = async (event) => {
    event.preventDefault();
    try {
      await saveGeofence(form);
      setFormOpen(false);
      setRefresh((value) => value + 1);
      toast.success('Geofence saved');
    } catch (err) {
      toast.error(hrmError(err));
    }
  };

  if (allowed === false) {
    return <div className="mx-auto max-w-3xl"><HrmGap title="Location access is restricted" detail="Employee location is available to authorized HR administrators. The location API remains the authority if this session is not permitted." /></div>;
  }

  const columns = [
    { header: 'Employee', cell: (row) => <div><p className="font-medium">{row.name}</p><p className="text-xs text-slate-500">{row.employeeId} · {row.department}</p></div> },
    { header: 'Coordinates', cell: (row) => `${Number(row.lat).toFixed(5)}, ${Number(row.lng).toFixed(5)}` },
    { header: 'Accuracy', cell: (row) => row.accuracy ? `${row.accuracy} m` : '—' },
    { header: 'Check-in', cell: (row) => row.todayAttendance?.punchIn || '—' },
    { header: 'Check-out', cell: (row) => row.todayAttendance?.punchOut || '—' },
    { header: 'Updated', cell: (row) => row.lastUpdated ? new Date(row.lastUpdated).toLocaleString() : '—' },
    { header: 'Status', cell: (row) => <StatusBadge status={String(row.status || '').toLowerCase()} /> },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader title="Geo Tracking" description="Live coordinates are shown only when the location API has a recorded GPS point." actions={<Button onClick={() => setFormOpen(true)}>Add geofence</Button>} />
      <HrmStats items={[
        { label: 'Employees returned', value: rows.length },
        { label: 'With GPS', value: tracked.length },
        { label: 'GPS unavailable', value: rows.length - tracked.length },
        { label: 'Geofences', value: geofences.length },
      ]} />
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search employee" className="sm:max-w-xs" />
        <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="sm:w-44" aria-label="History date" />
        <Button variant="outline" onClick={() => setRefresh((value) => value + 1)}>Refresh</Button>
      </div>
      {!mapsKey && <HrmGap title="Map provider" detail={missingHrmApis.geoMap} />}
      {mapsKey && <LocationMap apiKey={mapsKey} points={visible} />}
      <HrmNotice loading={allowed === null || loading} error={error} empty={!loading && visible.length === 0 ? 'No recorded GPS points match this search.' : ''} onRetry={() => setRefresh((value) => value + 1)}>
        <DataTable columns={columns} data={visible} label="Tracked employees" rowActions={[{ label: 'Location history', onSelect: openHistory }]} />
      </HrmNotice>
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold">Geofences</h2>
        <div className="mt-3 grid gap-2">{geofences.map((fence) => <p key={fence.id} className="text-sm">{fence.name} · {fence.city || '—'} · {fence.latitude}, {fence.longitude} · {fence.radiusMeters} m</p>)}</div>
      </div>
      <FormDrawer open={Boolean(selected)} onOpenChange={(open) => { if (!open) setSelected(null); }} title={selected?.name || 'Location history'} description={date} showFooter={false}>
        <div className="space-y-2 text-sm">{history.length === 0 && <p>No GPS history for this employee on the selected date.</p>}{history.map((point) => <p key={point.id}>{new Date(point.timestamp).toLocaleString()} · {point.latitude}, {point.longitude} · {point.trackingType || 'LOCATION'} · {point.address || 'Address unavailable'}</p>)}</div>
      </FormDrawer>
      <FormDrawer open={formOpen} onOpenChange={setFormOpen} title="Add geofence" description="Save a branch geofence through the location API." onSubmit={saveFence}>
        <div className="grid gap-3"><Label className="grid gap-1 text-xs">Name<Input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></Label><Label className="grid gap-1 text-xs">City<Input value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} /></Label><Label className="grid gap-1 text-xs">Latitude<Input required type="number" step="any" value={form.latitude} onChange={(event) => setForm({ ...form, latitude: event.target.value })} /></Label><Label className="grid gap-1 text-xs">Longitude<Input required type="number" step="any" value={form.longitude} onChange={(event) => setForm({ ...form, longitude: event.target.value })} /></Label><Label className="grid gap-1 text-xs">Radius meters<Input type="number" value={form.radiusMeters} onChange={(event) => setForm({ ...form, radiusMeters: event.target.value })} /></Label></div>
      </FormDrawer>
    </div>
  );
}

function LocationMap({ apiKey, points }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!points.length || !ref.current) return undefined;
    let cancelled = false;
    const draw = () => {
      if (cancelled || !window.google?.maps || !ref.current) return;
      const map = new window.google.maps.Map(ref.current, { center: { lat: Number(points[0].lat), lng: Number(points[0].lng) }, zoom: 12 });
      points.forEach((point) => new window.google.maps.Marker({ map, position: { lat: Number(point.lat), lng: Number(point.lng) }, title: point.name }));
    };
    if (window.google?.maps) draw();
    else if (!document.getElementById('qb-hrm-maps')) {
      const script = document.createElement('script');
      script.id = 'qb-hrm-maps';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
      script.onload = draw;
      document.body.appendChild(script);
    }
    return () => { cancelled = true; };
  }, [apiKey, points]);
  return <div ref={ref} className="h-80 w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100" />;
}
