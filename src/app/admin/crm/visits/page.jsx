'use client';

import * as React from 'react';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { Button } from '@/components/common/Button';
import { toast } from '@/hooks/use-toast';
import { CrmScreen } from '@/modules/crm/CrmScreen';
import {
  loadCompanies,
  loadEmployees,
  loadVisits,
  personName,
  removeVisit,
  saveVisit,
  sessionCan,
  crmError,
} from '@/modules/crm/crm-api';
import { PermanentDeleteDialog } from '@/components/common/PermanentDeleteDialog';
import {
  Building2,
  Calendar,
  CalendarDays,
  CheckCircle2,
  Clock,
  Compass,
  Download,
  ExternalLink,
  MapPin,
  User,
  UsersRound,
  XCircle,
} from 'lucide-react';

const VISIT_STATUSES = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
const VISIT_TYPES = ['CLIENT_MEETING', 'SITE_INSPECTION', 'FOLLOW_UP', 'DEMO', 'SERVICE'];

const blank = {
  employeeId: '',
  companyId: '',
  leadId: '',
  dealId: '',
  customerName: '',
  purpose: '',
  date: '',
  time: '',
  location: '',
  visitType: 'CLIENT_MEETING',
  status: 'SCHEDULED',
  notes: '',
  latitude: '',
  longitude: '',
};

export default function VisitsRoute() {
  const [allowed, setAllowed] = React.useState(false);
  const [employees, setEmployees] = React.useState([]);
  const [companies, setCompanies] = React.useState([]);
  const [pendingDelete, setPendingDelete] = React.useState(null);
  const [deleting, setDeleting] = React.useState(false);
  const [refreshToken, setRefreshToken] = React.useState(0);
  const [currentRows, setCurrentRows] = React.useState([]);
  const [currentQuery, setCurrentQuery] = React.useState({});

  React.useEffect(() => {
    setAllowed(sessionCan('VISIT') || sessionCan('CRM'));
    loadEmployees()
      .then(setEmployees)
      .catch(() => setEmployees([]));
    loadCompanies({ page: 1, limit: 100 })
      .then((res) => setCompanies(res.rows || []))
      .catch(() => setCompanies([]));
  }, []);

  const load = React.useCallback(async (query) => {
    setCurrentQuery(query);
    const result = await loadVisits({
      page: query.page,
      limit: 20,
      search: query.search || undefined,
      status: query.status || undefined,
      employeeId: query.employeeId || undefined,
      companyId: query.companyId || undefined,
      date: query.date || undefined,
    });
    setCurrentRows(result.rows || []);
    return result;
  }, []);

  const confirmDelete = async () => {
    if (!pendingDelete || deleting) return;
    setDeleting(true);
    try {
      await removeVisit(pendingDelete.id);
      toast.success(`Visit for "${pendingDelete.customerName}" permanently deleted`);
      setPendingDelete(null);
      setRefreshToken((value) => value + 1);
    } catch (err) {
      toast.error(crmError(err));
    } finally {
      setDeleting(false);
    }
  };

  const handleExport = () => {
    exportVisitsToCsv(currentRows, currentQuery);
  };

  return (
    <>
      <CrmScreen
        appearance="visits"
        collapsibleFilters
        title="Visits"
        description="Scheduled and completed visits, including location text and coordinates when the visit API returns them."
        actionLabel="Add Visit"
        canCreate={allowed}
        extraHeaderActions={
          <Button
            type="button"
            variant="outline"
            className="h-9 rounded-xl border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:border-emerald-200 hover:bg-emerald-50"
            onClick={handleExport}
          >
            <Download className="mr-2 size-4" />
            Export Visits
          </Button>
        }
        load={load}
        blank={blank}
        refreshToken={refreshToken}
        emptyState={({ onAdd }) => (
          <VisitEmptyState onAdd={onAdd} onExport={handleExport} allowed={allowed} />
        )}
        stats={(result) => [
          {
            label: 'Today',
            value: result.metrics?.today ?? 0,
            icon: Calendar,
            iconTone: 'bg-[#EAF7EF] text-[#173D30]',
          },
          {
            label: 'Upcoming',
            value: result.metrics?.upcoming ?? 0,
            icon: Clock,
            iconTone: 'bg-blue-50 text-blue-700',
          },
          {
            label: 'Completed',
            value: result.metrics?.completed ?? 0,
            icon: CheckCircle2,
            iconTone: 'bg-emerald-50 text-emerald-700',
          },
          {
            label: 'Cancelled',
            value: result.metrics?.cancelled ?? 0,
            icon: XCircle,
            iconTone: 'bg-rose-50 text-rose-700',
          },
        ]}
        filters={[
          { key: 'date', type: 'date', label: 'Filter by date' },
          {
            key: 'status',
            label: 'All statuses',
            options: VISIT_STATUSES.map((value) => ({
              value,
              label: titleCase(value),
            })),
          },
        ]}
        columns={[
          {
            header: 'Customer / Lead',
            accessorKey: 'customerName',
            className: 'min-w-[210px]',
            cell: (row) => <CustomerIdentity row={row} />,
          },
          {
            header: 'Company',
            className: 'min-w-[170px]',
            cell: (row) =>
              row.company?.name ? (
                <span className="inline-flex max-w-[200px] items-center gap-2 text-sm text-slate-700">
                  <Building2 className="size-3.5 shrink-0 text-slate-400" />
                  <span className="truncate">{row.company.name}</span>
                </span>
              ) : (
                <span className="text-slate-400">—</span>
              ),
          },
          {
            header: 'Assigned Employee',
            className: 'min-w-[170px]',
            cell: (row) => {
              const name = row.assignedVisitor?.name || personName(row.employee);
              return name ? (
                <span className="inline-flex items-center gap-2 text-sm text-slate-700">
                  <User className="size-3.5 shrink-0 text-slate-400" />
                  <span className="truncate">{name}</span>
                </span>
              ) : (
                <span className="text-slate-400">Unassigned</span>
              );
            },
          },
          {
            header: 'Visit Date',
            accessorKey: 'date',
            className: 'min-w-[130px]',
            cell: (row) => <span className="text-sm text-slate-600">{formatVisitDate(row.date)}</span>,
          },
          {
            header: 'Visit Time',
            className: 'min-w-[110px]',
            cell: (row) => (
              <span className="inline-flex items-center gap-1.5 text-sm text-slate-600">
                <Clock className="size-3 text-slate-400" />
                {formatVisitTime(row.date, row.time)}
              </span>
            ),
          },
          {
            header: 'Location',
            className: 'min-w-[200px]',
            cell: (row) => {
              const mapsUrl = getGoogleMapsUrl(row);
              if (!row.location && !mapsUrl) return <span className="text-slate-400">—</span>;
              if (mapsUrl) {
                return (
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex max-w-[220px] items-center gap-1.5 text-sm text-[#173D30] underline-offset-4 hover:underline"
                    title="Open in Google Maps"
                  >
                    <MapPin className="size-3.5 shrink-0 text-emerald-600" />
                    <span className="truncate">{row.location || 'View coordinates'}</span>
                    <ExternalLink className="size-3 shrink-0 opacity-60" />
                  </a>
                );
              }
              return (
                <span className="inline-flex max-w-[220px] items-center gap-1.5 text-sm text-slate-600">
                  <MapPin className="size-3.5 shrink-0 text-slate-400" />
                  <span className="truncate">{row.location}</span>
                </span>
              );
            },
          },
          {
            header: 'Status',
            accessorKey: 'status',
            className: 'min-w-[120px]',
            cell: (row) => <StatusBadge status={String(row.status || '').toLowerCase()} />,
          },
          {
            header: 'Notes',
            className: 'min-w-[180px]',
            cell: (row) =>
              row.notes ? (
                <span className="block max-w-[220px] truncate text-xs text-slate-500" title={row.notes}>
                  {row.notes}
                </span>
              ) : (
                <span className="text-slate-400">—</span>
              ),
          },
        ]}
        renderForm={(form, setForm) => (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Customer / Contact Name">
              <Input
                required
                placeholder="e.g. Acme Retail or Jane Doe"
                value={form.customerName || ''}
                onChange={(event) => setForm({ ...form, customerName: event.target.value })}
              />
            </Field>
            <Field label="Purpose">
              <Input
                required
                placeholder="e.g. Product Demo, Contract Signing"
                value={form.purpose || ''}
                onChange={(event) => setForm({ ...form, purpose: event.target.value })}
              />
            </Field>
            <Field label="Company">
              <select
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                value={form.companyId || ''}
                onChange={(event) => setForm({ ...form, companyId: event.target.value })}
              >
                <option value="">No company</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Assigned Employee">
              <select
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                value={form.employeeId || ''}
                onChange={(event) => setForm({ ...form, employeeId: event.target.value })}
              >
                <option value="">Unassigned</option>
                {employees.map((employee) => (
                  <option key={employee.recordId} value={employee.recordId}>
                    {employee.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Visit Date">
              <Input
                required
                type="date"
                value={form.date ? String(form.date).slice(0, 10) : ''}
                onChange={(event) => setForm({ ...form, date: event.target.value })}
              />
            </Field>
            <Field label="Visit Time">
              <Input
                type="time"
                value={form.time || ''}
                onChange={(event) => setForm({ ...form, time: event.target.value })}
              />
            </Field>
            <Field label="Location / Address">
              <Input
                required
                placeholder="Office or site address"
                value={form.location || ''}
                onChange={(event) => setForm({ ...form, location: event.target.value })}
              />
            </Field>
            <Field label="Visit Type">
              <select
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                value={form.visitType || 'CLIENT_MEETING'}
                onChange={(event) => setForm({ ...form, visitType: event.target.value })}
              >
                {VISIT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {titleCase(type)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Status">
              <select
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                value={form.status || 'SCHEDULED'}
                onChange={(event) => setForm({ ...form, status: event.target.value })}
              >
                {VISIT_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {titleCase(status)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Lead ID (Optional)">
              <Input
                type="number"
                min="1"
                placeholder="Link to CRM Lead"
                value={form.leadId || ''}
                onChange={(event) => setForm({ ...form, leadId: event.target.value })}
              />
            </Field>
            <Field label="Latitude (Optional)">
              <Input
                type="number"
                step="any"
                placeholder="e.g. 19.0760"
                value={form.latitude ?? ''}
                onChange={(event) => setForm({ ...form, latitude: event.target.value })}
              />
            </Field>
            <Field label="Longitude (Optional)">
              <Input
                type="number"
                step="any"
                placeholder="e.g. 72.8777"
                value={form.longitude ?? ''}
                onChange={(event) => setForm({ ...form, longitude: event.target.value })}
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Notes">
                <Input
                  placeholder="Meeting agenda, special instructions, or key discussion points"
                  value={form.notes || ''}
                  onChange={(event) => setForm({ ...form, notes: event.target.value })}
                />
              </Field>
            </div>
          </div>
        )}
        onSave={async (form, id) => {
          const res = await saveVisit(
            {
              ...form,
              companyId: form.companyId ? Number(form.companyId) : undefined,
              leadId: form.leadId ? Number(form.leadId) : undefined,
              date: form.date ? new Date(form.date).toISOString() : form.date,
            },
            id
          );
          const payload = res?.data ?? res;
          const leadSynced = payload?.leadStageSynced === true || payload?.data?.leadStageSynced === true;
          toast.success(
            id
              ? 'Visit updated.'
              : leadSynced
              ? 'Visit created and linked lead moved to Visit Scheduled.'
              : 'Visit created.'
          );
        }}
        rowActions={() =>
          allowed ? [{ label: 'Delete', onSelect: (row) => setPendingDelete(row) }] : []
        }
        detail={(row) => <VisitDetail row={row} />}
      />

      <PermanentDeleteDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        recordName={`Visit for ${pendingDelete?.customerName}`}
        noun="visit"
        warningNote="Associated visit check-in records and attachments will be removed."
        loading={deleting}
        onConfirm={confirmDelete}
      />
    </>
  );
}

function CustomerIdentity({ row }) {
  const name = row.customerName || 'Customer Visit';
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  return (
    <span className="flex min-w-0 items-center gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#EAF7EF] text-xs font-bold text-[#173D30]">
        {initials || 'V'}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-[#172033]">{name}</span>
        {row.purpose && <span className="block truncate text-xs text-slate-400">{row.purpose}</span>}
      </span>
    </span>
  );
}

function VisitDetail({ row }) {
  const mapsUrl = getGoogleMapsUrl(row);
  const employeeName = row.assignedVisitor?.name || personName(row.employee);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-[#F5FAF7] p-4">
        <CustomerIdentity row={row} />
        <StatusBadge status={String(row.status || '').toLowerCase()} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Detail
          icon={Calendar}
          label="Visit Date & Time"
          value={`${formatVisitDate(row.date)} at ${formatVisitTime(row.date, row.time)}`}
        />
        <Detail icon={User} label="Assigned Visitor" value={employeeName || 'Unassigned'} />
        <Detail icon={Building2} label="Company" value={row.company?.name} />
        <Detail
          icon={MapPin}
          label="Location"
          value={
            mapsUrl ? (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[#173D30] hover:underline"
              >
                {row.location || 'View on Google Maps'}
                <ExternalLink className="size-3" />
              </a>
            ) : (
              row.location
            )
          }
        />
        {row.latitude && row.longitude && (
          <Detail
            icon={Compass}
            label="Coordinates"
            value={`${row.latitude}, ${row.longitude}`}
          />
        )}
        <Detail
          icon={Clock}
          label="Check-In"
          value={row.startedAt ? new Date(row.startedAt).toLocaleString() : 'Not recorded'}
        />
      </div>

      {row.completedBy && (
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <p className="text-xs font-medium text-slate-500">Completed By</p>
          <p className="mt-1 text-sm font-medium text-slate-800">{row.completedBy}</p>
        </div>
      )}

      {row.notes && (
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <p className="text-xs font-medium text-slate-500">Notes & Instructions</p>
          <p className="mt-1 text-sm text-slate-700">{row.notes}</p>
        </div>
      )}

      <VisitPhotos photos={row.photos} />
    </div>
  );
}

function Detail({ icon: Icon, label, value }) {
  return (
    <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-3">
      <p className="flex items-center gap-2 text-xs font-medium text-slate-500">
        <Icon className="size-3.5" />
        {label}
      </p>
      <div className="mt-1.5 truncate text-sm font-medium text-slate-800">{value || '—'}</div>
    </div>
  );
}

function VisitPhotos({ photos }) {
  const items = Array.isArray(photos) ? photos : [];
  const [open, setOpen] = React.useState(null);
  if (!items.length) return null;

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        Visit Photos ({items.length})
      </h4>
      <div className="flex flex-wrap gap-2">
        {items.map((photo) => (
          <button
            key={photo.id}
            type="button"
            className="group relative overflow-hidden rounded-xl border border-slate-200 text-left transition hover:border-emerald-300"
            onClick={() => setOpen(photo)}
          >
            <img
              src={photo.url}
              alt={photo.fileName || 'Visit photo'}
              className="size-20 object-cover transition group-hover:scale-105"
            />
            {photo.createdAt && (
              <span className="block max-w-20 truncate bg-slate-900/70 px-1 py-0.5 text-[9px] text-white">
                {new Date(photo.createdAt).toLocaleDateString()}
              </span>
            )}
          </button>
        ))}
      </div>
      {open && (
        <div
          className="fixed inset-0 z-[100] grid place-items-center bg-black/75 p-6 backdrop-blur-[2px]"
          onClick={() => setOpen(null)}
        >
          <div className="relative max-h-[85vh] max-w-3xl overflow-hidden rounded-2xl bg-black">
            <img src={open.url} alt="" className="max-h-[80vh] w-auto object-contain" />
          </div>
        </div>
      )}
    </div>
  );
}

function VisitEmptyState({ onAdd, onExport, allowed }) {
  return (
    <div className="rounded-2xl border border-dashed border-[#DCE8E0] bg-white px-5 py-12 text-center shadow-sm sm:py-16">
      <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-[#EAF7EF] text-[#173D30]">
        <MapPin className="size-8" aria-hidden="true" />
      </div>
      <h2 className="mt-5 text-lg font-bold text-[#172033]">No visits found.</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
        There are no visits matching your current filters.
      </p>
      <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
        {allowed && (
          <Button
            onClick={onAdd}
            className="h-10 rounded-xl bg-[#173D30] px-4 font-semibold text-white hover:bg-[#205541]"
          >
            Add Visit
          </Button>
        )}
        <Button
          variant="outline"
          onClick={onExport}
          className="h-10 rounded-xl border-slate-200 px-4 font-semibold"
        >
          <Download className="mr-2 size-4" />
          Export Visits
        </Button>
      </div>
    </div>
  );
}

function exportVisitsToCsv(rows, query) {
  if (!rows || rows.length === 0) {
    toast.error('No visit records available to export.');
    return;
  }

  const headers = [
    'ID',
    'Customer Name',
    'Company',
    'Purpose',
    'Visit Date',
    'Visit Time',
    'Location',
    'Latitude',
    'Longitude',
    'Assigned Employee',
    'Status',
    'Notes',
    'Completed By',
  ];

  const escapeCell = (val) => {
    const s = String(val ?? '').replace(/"/g, '""');
    return `"${s}"`;
  };

  const csvRows = [
    headers.join(','),
    ...rows.map((row) =>
      [
        escapeCell(row.id),
        escapeCell(row.customerName),
        escapeCell(row.company?.name || ''),
        escapeCell(row.purpose),
        escapeCell(row.date ? String(row.date).slice(0, 10) : ''),
        escapeCell(row.time || ''),
        escapeCell(row.location || ''),
        escapeCell(row.latitude ?? ''),
        escapeCell(row.longitude ?? ''),
        escapeCell(row.assignedVisitor?.name || personName(row.employee) || ''),
        escapeCell(row.status),
        escapeCell(row.notes || ''),
        escapeCell(row.completedBy || ''),
      ].join(',')
    ),
  ];

  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const filterPart = query?.status ? `-${query.status.toLowerCase()}` : '';
  a.download = `crm-visits${filterPart}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast.success(`Exported ${rows.length} visit record${rows.length === 1 ? '' : 's'}`);
}

function getGoogleMapsUrl(row) {
  if (
    row.latitude &&
    row.longitude &&
    !isNaN(Number(row.latitude)) &&
    !isNaN(Number(row.longitude))
  ) {
    return `https://www.google.com/maps?q=${row.latitude},${row.longitude}`;
  }
  if (row.location && row.location.trim()) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(row.location.trim())}`;
  }
  return null;
}

function formatVisitDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return String(dateStr).slice(0, 10);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatVisitTime(dateStr, timeStr) {
  if (timeStr && timeStr.trim()) return timeStr;
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '—';
  const hours = d.getHours();
  const minutes = d.getMinutes();
  if (hours === 0 && minutes === 0) return '—';
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function titleCase(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function Field({ label, children }) {
  return <Label className="grid gap-1 text-xs">{label}{children}</Label>;
}
