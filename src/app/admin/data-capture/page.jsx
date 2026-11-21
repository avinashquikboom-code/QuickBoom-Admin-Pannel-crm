'use client';

import * as React from 'react';
import { ManualLeadDrawer } from '@/modules/crm/ManualLeadDrawer';
import { GooglePlacesPanel } from '@/modules/data-capture/GooglePlacesPanel';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { Button } from '@/components/common/Button';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import {
  faMagnifyingGlass,
  faTrashCan,
  faPlus,
  faFileImport,
  faGlobe,
  faArrowUpRightFromSquare,
  faCheck,
  faBan,
  faBuilding,
} from '@fortawesome/free-solid-svg-icons';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { AdminBulkSelectionToolbar } from '@/components/admin/bulk-selection';
import { sessionCanAction } from '@/modules/hrm/hrm-api';
import { toast } from '@/hooks/use-toast';
import { CrmScreen } from '@/modules/crm/CrmScreen';
import {
  captureError,
  createCapture,
  loadCaptureUsage,
  loadCaptures,
  rejectCapture,
  removeCapture,
  deleteCaptures,
  sessionCan,
  updateCapture,
  validateCapture,
} from '@/modules/data-capture/capture-api';
import { CsvLeadImportDialog } from '@/modules/data-capture/CsvLeadImportDialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const STATUS_OPTIONS = [
  { value: 'CAPTURED', label: 'Captured' },
  { value: 'VALIDATED', label: 'Validated' },
  { value: 'LEAD_CREATED', label: 'Converted to Lead' },
  { value: 'DUPLICATE', label: 'Duplicate' },
  { value: 'REJECTED', label: 'Rejected' },
];

const blank = {
  businessName: '',
  category: '',
  phone: '',
  email: '',
  website: '',
  address: '',
  source: 'GOOGLE_PLACES',
  notes: '',
};

export default function DataCapturePage() {
  const [leadOpen, setLeadOpen] = React.useState(false);
  const [canAddLead, setCanAddLead] = React.useState(false);
  const [canDelete, setCanDelete] = React.useState(false);
  const [canImportCsv, setCanImportCsv] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const deleteBusy = React.useRef(false);
  const [confirmation, setConfirmation] = React.useState(null);
  const [deletionResult, setDeletionResult] = React.useState(null);
  const [allowed, setAllowed] = React.useState(false);
  const [usage, setUsage] = React.useState({});
  const [extractOpen, setExtractOpen] = React.useState(false);
  const [csvImportOpen, setCsvImportOpen] = React.useState(false);
  const [selectedPlaces, setSelectedPlaces] = React.useState(null);
  const [refresh, setRefresh] = React.useState(0);

  React.useEffect(() => {
    setAllowed(sessionCan('DATA_CAPTURE'));
    setCanAddLead(sessionCan('LEADS') || sessionCan('CRM'));
    setCanDelete(sessionCanAction('DATA_CAPTURE', 'DELETE'));
    setCanImportCsv(sessionCanAction('DATA_CAPTURE', 'EDIT') && sessionCanAction('LEADS', 'CREATE'));
  }, []);

  React.useEffect(() => {
    loadCaptureUsage().then(setUsage).catch(() => setUsage({}));
  }, [refresh]);

  const load = React.useCallback(
    (query) =>
      loadCaptures({
        page: query.page,
        limit: 20,
        search: query.search || undefined,
        status: query.status || undefined,
        source: query.source || undefined,
        category: query.category || undefined,
      }),
    []
  );

  const eligible = (row) => !row.isImported && !row.importedLeadId && !['LEAD_CREATED', 'DUPLICATE', 'REJECTED'].includes(row.status);

  const confirmDelete = async () => {
    if (deleteBusy.current || !confirmation) return;
    deleteBusy.current = true;
    setDeleting(true);
    try {
      const payload = confirmation.single
        ? await removeCapture(confirmation.rows[0].id)
        : await deleteCaptures(confirmation.rows.map((row) => row.id));
      const result = payload?.data?.records ? payload.data : payload;
      setDeletionResult(result);
      setConfirmation(null);
      setRefresh((value) => value + 1);
      toast.success(result.message || `Deleted ${result.deleted || 0} captured records`);
    } catch (error) {
      toast.error(captureError(error));
    } finally {
      deleteBusy.current = false;
      setDeleting(false);
    }
  };

  return (
    <>
      <CrmScreen
        title="Data Capture"
        description="Captured business records for this tenant, with validation and lead conversion."
        refreshToken={refresh}
        enableSelection
        toolbar={({ selected, clearSelection }) => (
          <AdminBulkSelectionToolbar count={selected.length} onClear={clearSelection}>
            {canDelete && (
              <Button
                variant="destructive"
                size="sm"
                disabled={deleting}
                onClick={() => setConfirmation({ rows: selected, single: false })}
                className="h-8 gap-1.5 text-xs font-semibold"
              >
                <FontAwesomeIcon icon={faTrashCan} className="size-3.5" />
                <span>Delete Selected ({selected.length})</span>
              </Button>
            )}
            {allowed && selected.some(eligible) && (
              <Button
                size="sm"
                disabled={deleting}
                onClick={() => {
                  setSelectedPlaces(selected.filter(eligible));
                  setExtractOpen(true);
                }}
                className="h-8 gap-1.5 bg-[#20C466] hover:bg-[#1BB35B] text-white text-xs font-semibold shadow-xs"
              >
                <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="size-3.5" />
                <span>Import Selected ({selected.filter(eligible).length})</span>
              </Button>
            )}
            <span className="text-xs text-slate-500 hidden sm:inline">
              Selection applies to the current page.
            </span>
          </AdminBulkSelectionToolbar>
        )}
        canCreate={false}
        load={load}
        blank={blank}
        extraHeaderActions={
          <div className="flex flex-wrap items-center gap-2">
            {canAddLead && (
              <Button
                onClick={() => setLeadOpen(true)}
                className="h-9 px-3.5 rounded-xl bg-[#173D30] hover:bg-[#123026] text-white text-xs font-semibold shadow-xs gap-1.5 transition-colors"
              >
                <FontAwesomeIcon icon={faPlus} className="size-3.5" />
                <span>Add Lead</span>
              </Button>
            )}
            {canImportCsv && (
              <Button
                variant="outline"
                onClick={() => setCsvImportOpen(true)}
                className="h-9 px-3.5 rounded-xl border-[#E2E8F0] hover:bg-[#EAF7EF]/50 hover:border-emerald-200 text-[#173D30] text-xs font-semibold gap-1.5 transition-colors"
              >
                <FontAwesomeIcon icon={faFileImport} className="size-3.5 text-slate-500" />
                <span>Import CSV</span>
              </Button>
            )}
            {allowed && (
              <Button
                onClick={() => {
                  setSelectedPlaces(null);
                  setExtractOpen(true);
                }}
                className="h-9 px-3.5 rounded-xl bg-[#20C466] hover:bg-[#1BB35B] text-white text-xs font-semibold shadow-xs gap-1.5 transition-colors"
              >
                <FontAwesomeIcon icon={faMagnifyingGlass} className="size-3.5" />
                <span>Find Leads from Google</span>
              </Button>
            )}
          </div>
        }
        stats={() => [
          { label: 'Captured Records', value: usage.totalLeadsCaptured ?? 0 },
          { label: 'Validated', value: usage.validatedCount ?? 0 },
          { label: 'Converted to Leads', value: usage.convertedCount ?? 0 },
          { label: 'Extractions', value: usage.totalExtractions ?? 0 },
        ]}
        filters={[
          { key: 'status', label: 'All statuses', options: STATUS_OPTIONS },
          { key: 'source', label: 'All sources', options: [{ value: 'GOOGLE_PLACES', label: 'Google Places' }] },
        ]}
        columns={[
          {
            header: 'Business',
            className: 'min-w-[200px] max-w-[280px]',
            cell: (row) => (
              <div className="flex min-w-0 items-center gap-3">
                <BusinessAvatar name={row.businessName} src={businessImage(row)} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-[#172B24]" title={row.businessName || 'Incomplete record'}>
                    {row.businessName || 'Incomplete record'}
                  </p>
                  {row.googlePlaceId ? (
                    <p className="truncate text-[11px] text-[#718078] font-mono mt-0.5" title={`Place ID: ${row.googlePlaceId}`}>
                      {row.googlePlaceId.slice(0, 18)}...
                    </p>
                  ) : null}
                </div>
              </div>
            ),
          },
          {
            header: 'Category',
            className: 'min-w-[120px]',
            cell: (row) =>
              row.category ? (
                <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                  {row.category}
                </span>
              ) : (
                <span className="text-slate-400 font-medium">—</span>
              ),
          },
          {
            header: 'Phone',
            className: 'min-w-[120px]',
            cell: (row) =>
              row.phone ? (
                <a
                  href={`tel:${row.phone}`}
                  onClick={(e) => e.stopPropagation()}
                  className="font-mono text-xs text-slate-700 hover:text-[#169F4D] hover:underline transition-colors"
                >
                  {row.phone}
                </a>
              ) : (
                <span className="text-slate-400 font-medium">—</span>
              ),
          },
          {
            header: 'Location',
            className: 'min-w-[180px] max-w-[240px]',
            cell: (row) => (
              <span className="block truncate text-xs text-slate-600" title={row.address || '—'}>
                {row.address || <span className="text-slate-400 font-medium">—</span>}
              </span>
            ),
          },
          {
            header: 'Website',
            className: 'w-[80px] text-center',
            cell: (row) => <WebsiteFavicon url={row.website} />,
          },
          {
            header: 'Source',
            className: 'min-w-[130px]',
            cell: (row) => (
              <span className="inline-flex items-center rounded-full border border-emerald-200/80 bg-[#EAF7EF]/70 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-[#173D30]">
                {row.source || row.provider || 'GOOGLE_PLACES'}
              </span>
            ),
          },
          {
            header: 'Import Status',
            className: 'min-w-[120px]',
            cell: (row) => <StatusBadge status={importStatus(row)} />,
          },
        ]}
        renderForm={(form, setForm) => (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Business name">
              <Input
                required
                value={form.businessName || ''}
                onChange={(event) => setForm({ ...form, businessName: event.target.value })}
              />
            </Field>
            <Field label="Category">
              <Input
                value={form.category || ''}
                onChange={(event) => setForm({ ...form, category: event.target.value })}
              />
            </Field>
            <Field label="Phone">
              <Input
                value={form.phone || ''}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
              />
            </Field>
            <Field label="Email">
              <Input
                value={form.email || ''}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
              />
            </Field>
            <Field label="Website">
              <Input
                value={form.website || ''}
                onChange={(event) => setForm({ ...form, website: event.target.value })}
              />
            </Field>
            <Field label="Address">
              <Input
                value={form.address || ''}
                onChange={(event) => setForm({ ...form, address: event.target.value })}
              />
            </Field>
            <Field label="Source">
              <Input
                value={form.source || ''}
                onChange={(event) => setForm({ ...form, source: event.target.value })}
              />
            </Field>
          </div>
        )}
        onSave={async (form, id) => {
          if (id) await updateCapture(id, form);
          else await createCapture(form);
          setRefresh((value) => value + 1);
          toast.success(id ? 'Record updated' : 'Record created');
        }}
        rowActions={(reload) => [
          ...(allowed
            ? [
                {
                  label: 'Validate',
                  icon: faCheck,
                  onSelect: async (row) => {
                    try {
                      await validateCapture(row.id);
                      reload((value) => value + 1);
                      toast.success('Capture record validated');
                    } catch (error) {
                      toast.error(captureError(error));
                    }
                  },
                },
                {
                  label: 'Reject',
                  icon: faBan,
                  onSelect: async (row) => {
                    const reason = window.prompt('Rejection reason');
                    if (reason === null) return;
                    try {
                      await rejectCapture(row.id, reason);
                      reload((value) => value + 1);
                      toast.success('Capture record rejected');
                    } catch (error) {
                      toast.error(captureError(error));
                    }
                  },
                },
                {
                  label: 'Import lead',
                  icon: faArrowUpRightFromSquare,
                  onSelect: (row) => {
                    setSelectedPlaces([row]);
                    setExtractOpen(true);
                  },
                },
              ]
            : []),
          ...(canDelete
            ? [
                {
                  label: 'Delete',
                  icon: faTrashCan,
                  variant: 'destructive',
                  confirm: false,
                  disabled: deleting,
                  onSelect: (row) => setConfirmation({ rows: [row], single: true }),
                },
              ]
            : []),
        ]}
        detail={(row) => (
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-3">
              <BusinessAvatar name={row.businessName} src={businessImage(row)} />
              <div>
                <p className="font-semibold text-base text-[#172B24]">{row.businessName}</p>
                <p className="text-xs text-slate-500">{row.category || 'No category'} · {row.source}</p>
              </div>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 space-y-1.5 text-xs text-slate-700">
              <p><strong className="text-slate-900">Phone:</strong> {row.phone || 'No phone'}</p>
              <p><strong className="text-slate-900">Email:</strong> {row.email || 'No email'}</p>
              <p><strong className="text-slate-900">Address:</strong> {row.address || 'No address'}</p>
              <p className="flex items-center gap-2">
                <strong className="text-slate-900">Website:</strong>
                {safeHttp(row.website) ? (
                  <a href={safeHttp(row.website)} target="_blank" rel="noopener noreferrer" className="text-[#163A2E] underline font-medium">
                    {row.website}
                  </a>
                ) : (
                  <span>—</span>
                )}
              </p>
              <p><strong className="text-slate-900">Imported Lead ID:</strong> {row.importedLeadId || 'Not imported'}</p>
              {row.notes && <p><strong className="text-slate-900">Notes:</strong> {row.notes}</p>}
            </div>
          </div>
        )}
      />
      {deletionResult && (
        <div role="status" className="max-w-none min-w-0 w-full mt-3 rounded-xl border border-slate-200 bg-white p-3 text-sm shadow-xs">
          <p className="font-semibold text-slate-800">
            Selected: {deletionResult.totalSelected} · Deleted: {deletionResult.deleted} · Skipped: {deletionResult.skipped} · Failed: {deletionResult.failed}
          </p>
          {deletionResult.records
            ?.filter((record) => record.status !== 'deleted')
            .map((record) => (
              <p key={record.id} className="text-xs text-amber-700 mt-1">
                Capture #{record.id}: {record.message}
              </p>
            ))}
        </div>
      )}
      <ConfirmDialog
        open={Boolean(confirmation)}
        onOpenChange={(open) => {
          if (!open && !deleteBusy.current) setConfirmation(null);
        }}
        title={confirmation?.single ? 'Delete captured record?' : `Delete ${confirmation?.rows.length || 0} selected captured records?`}
        description={`${
          confirmation?.single
            ? confirmation.rows[0].businessName || `Capture #${confirmation.rows[0].id}`
            : `${confirmation?.rows.length || 0} captured records selected`
        }. Imported or protected captures will be skipped. CRM Leads will remain untouched.`}
        variant="destructive"
        confirmLabel={deleting ? 'Deleting…' : 'Delete'}
        onConfirm={confirmDelete}
      />
      <ManualLeadDrawer open={leadOpen} onOpenChange={setLeadOpen} />
      <GooglePlacesPanel
        open={extractOpen}
        onOpenChange={setExtractOpen}
        initialPlaces={selectedPlaces}
        onImported={() => setRefresh((value) => value + 1)}
      />
      <CsvLeadImportDialog
        open={csvImportOpen}
        onOpenChange={setCsvImportOpen}
        onImported={() => setRefresh((value) => value + 1)}
      />
    </>
  );
}

function WebsiteFavicon({ url }) {
  const validUrl = safeHttp(url);
  const [imgFailed, setImgFailed] = React.useState(false);

  if (!validUrl) {
    return <span className="text-slate-400 font-medium">—</span>;
  }

  let domain = '';
  try {
    domain = new URL(validUrl).hostname;
  } catch {
    return <span className="text-slate-400 font-medium">—</span>;
  }

  const faviconUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=32`;

  return (
    <div className="flex items-center justify-center">
      <TooltipProvider delay={100}>
        <Tooltip>
          <TooltipTrigger
            render={
              <a
                href={validUrl}
                target="_blank"
                rel="noopener noreferrer"
                title={validUrl}
                onClick={(e) => e.stopPropagation()}
                aria-label={`Visit website: ${validUrl}`}
                className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-emerald-200/90 bg-[#EAF7EF]/70 text-[#173D30] transition-all hover:bg-emerald-100 hover:border-emerald-300 hover:scale-105 shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#20C466]"
              />
            }
          >
            {!imgFailed ? (
              <img
                src={faviconUrl}
                alt=""
                width={16}
                height={16}
                className="size-4 rounded-xs object-contain"
                onError={() => setImgFailed(true)}
                loading="lazy"
              />
            ) : (
              <FontAwesomeIcon icon={faGlobe} className="size-3.5 text-[#173D30]" />
            )}
          </TooltipTrigger>
          <TooltipContent
            side="top"
            className="max-w-xs break-all bg-[#173D30] text-white px-2.5 py-1.5 text-xs shadow-md rounded-md z-50 font-sans"
          >
            <div className="flex items-center gap-1.5">
              <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="size-3 shrink-0 text-[#20C466]" />
              <span className="truncate">{validUrl}</span>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

function importStatus(row) {
  if (row.status === 'IMPORT_FAILED') return 'failed';
  if (row.status === 'DUPLICATE') return 'duplicate';
  if (row.isImported || row.importedLeadId || row.status === 'LEAD_CREATED') return 'converted';
  return 'pending';
}

function safeHttp(value) {
  try {
    const raw = String(value || '').trim();
    if (!raw) return '';
    const toTest = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    const url = new URL(toTest);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : '';
  } catch {
    return '';
  }
}

function businessImage(row) {
  const photo = Array.isArray(row.photos) ? row.photos.find((item) => safeHttp(typeof item === 'string' ? item : item?.url)) : '';
  return safeHttp(typeof photo === 'string' ? photo : photo?.url);
}

function BusinessAvatar({ name, src }) {
  const [failed, setFailed] = React.useState(false);
  const words = String(name || '').trim().split(/\s+/).filter(Boolean);
  const initials =
    words.length === 0
      ? ''
      : words.length === 1
      ? words[0].slice(0, 2).toUpperCase()
      : `${words[0][0]}${words[1][0]}`.toUpperCase();

  if (src && !failed) {
    return (
      <img
        src={src}
        alt=""
        width={40}
        height={40}
        className="size-10 shrink-0 rounded-xl border border-[#E2E8E5] object-cover shadow-2xs"
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-emerald-100 bg-[#EAF7EF] text-xs font-bold text-[#173D30] shadow-2xs">
      {initials || <FontAwesomeIcon icon={faBuilding} className="size-4 text-[#173D30]/70" />}
    </span>
  );
}

function Field({ label, children }) {
  return <Label className="grid gap-1 text-xs">{label}{children}</Label>;
}
