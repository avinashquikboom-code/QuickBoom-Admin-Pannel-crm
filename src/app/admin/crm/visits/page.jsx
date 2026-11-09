'use client';

import * as React from 'react';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { toast } from '@/hooks/use-toast';
import { CrmScreen } from '@/modules/crm/CrmScreen';
import { loadEmployees, loadVisits, personName, removeVisit, saveVisit, sessionCan } from '@/modules/crm/crm-api';

const blank = { employeeId: '', customerName: '', purpose: '', date: '', time: '', location: '', visitType: 'CLIENT_MEETING', status: 'SCHEDULED', notes: '', latitude: '', longitude: '' };

export default function VisitsRoute() {
  const [allowed, setAllowed] = React.useState(false);
  const [employees, setEmployees] = React.useState([]);
  React.useEffect(() => { setAllowed(sessionCan('VISIT') || sessionCan('CRM')); loadEmployees().then(setEmployees).catch(() => setEmployees([])); }, []);
  const load = React.useCallback((query) => loadVisits({ page: query.page, limit: 20, search: query.search || undefined, status: query.status || undefined, employeeId: query.employeeId || undefined }), []);
  return <CrmScreen title="Visits" description="Scheduled and completed visits, including location text and coordinates when the visit API returns them." actionLabel="Add visit" canCreate={allowed} load={load} blank={blank}
    stats={(result) => [{ label: 'Today', value: result.metrics?.today }, { label: 'Upcoming', value: result.metrics?.upcoming }, { label: 'Completed', value: result.metrics?.completed }, { label: 'Cancelled', value: result.metrics?.cancelled }]}
    filters={[{ key: 'status', label: 'All statuses', options: ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map((value) => ({ value, label: value })) }]}
    below={(rows) => <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{rows.slice(0, 8).map((row) => <div key={row.id} className="rounded-lg border bg-white p-2 text-xs"><p>{String(row.date || '').slice(0, 10)} {row.time || ''}</p><p className="font-medium">{row.customerName}</p></div>)}</div>}
    columns={[{ header: 'Customer', accessorKey: 'customerName' }, { header: 'Purpose', accessorKey: 'purpose' }, { header: 'When', cell: (row) => `${String(row.date || '').slice(0, 10)} ${row.time || ''}` }, { header: 'Location', cell: (row) => row.location || '—' }, { header: 'Employee', cell: (row) => row.assignedVisitor?.name || personName(row.employee) }, { header: 'Status', cell: (row) => <StatusBadge status={String(row.status || '').toLowerCase()} /> }]}
    renderForm={(form, setForm) => <div className="grid gap-3 sm:grid-cols-2"><Field label="Customer"><Input required value={form.customerName || ''} onChange={(event) => setForm({ ...form, customerName: event.target.value })} /></Field><Field label="Purpose"><Input required value={form.purpose || ''} onChange={(event) => setForm({ ...form, purpose: event.target.value })} /></Field><Field label="Date"><Input required type="datetime-local" value={form.date || ''} onChange={(event) => setForm({ ...form, date: event.target.value })} /></Field><Field label="Time"><Input value={form.time || ''} onChange={(event) => setForm({ ...form, time: event.target.value })} /></Field><Field label="Location"><Input required value={form.location || ''} onChange={(event) => setForm({ ...form, location: event.target.value })} /></Field><Field label="Employee"><select className="h-9 rounded-md border px-2 text-sm" value={form.employeeId || ''} onChange={(event) => setForm({ ...form, employeeId: event.target.value })}><option value="">Unassigned</option>{employees.map((employee) => <option key={employee.recordId} value={employee.recordId}>{employee.name}</option>)}</select></Field><Field label="Status"><select className="h-9 rounded-md border px-2 text-sm" value={form.status || 'SCHEDULED'} onChange={(event) => setForm({ ...form, status: event.target.value })}>{['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map((status) => <option key={status}>{status}</option>)}</select></Field><Field label="Notes"><Input value={form.notes || ''} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></Field></div>}
    onSave={async (form, id) => { await saveVisit({ ...form, date: form.date ? new Date(form.date).toISOString() : form.date }, id); toast.success(id ? 'Visit updated' : 'Visit created'); }}
    rowActions={(reload) => allowed ? [{ label: 'Delete', onSelect: async (row) => { await removeVisit(row.id); reload((value) => value + 1); } }] : []}
    detail={(row) => <div className="space-y-1 text-sm"><p>{row.customerName} · {row.purpose}</p><p>{row.location}</p><p>Coordinates {row.latitude ?? '—'}, {row.longitude ?? '—'}</p><p>Check-in {row.startedAt ? new Date(row.startedAt).toLocaleString() : 'Not recorded'} · Completed by {row.completedBy || '—'}</p><p>{row.notes || 'No notes'}</p></div>}
  />;
}
function Field({ label, children }) { return <Label className="grid gap-1 text-xs">{label}{children}</Label>; }
