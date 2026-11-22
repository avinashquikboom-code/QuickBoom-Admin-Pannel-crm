'use client';

import * as React from 'react';
import { ManualLeadDrawer } from '@/modules/crm/ManualLeadDrawer';
import { GooglePlacesPanel } from '@/modules/data-capture/GooglePlacesPanel';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { Button } from '@/components/common/Button';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import {
  faGlobe,
  faArrowUpRightFromSquare,
  faCheck,
  faBan,
  faTrashCan,
  faPlus,
  faFileImport,
  faMagnifyingGlass,
  faBuilding,
} from '@fortawesome/free-solid-svg-icons';
import {
  faInstagram,
  faFacebook,
  faYoutube,
  faPinterest,
  faLinkedin,
  faWhatsapp,
  faXTwitter,
  faTiktok,
} from '@fortawesome/free-brands-svg-icons';
import {
  Building2,
  Check,
  CheckCircle2,
  Copy,
  Database,
  ExternalLink,
  Layers,
  Mail,
  MapPin,
  Phone,
  Sparkles,
  Upload,
  UserCheck,
  UsersRound,
  XCircle,
} from 'lucide-react';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { AdminBulkSelectionToolbar } from '@/components/admin/bulk-selection';
import { sessionCanAction } from '@/modules/hrm/hrm-api';
import { toast } from '@/hooks/use-toast';
import { CrmScreen } from '@/modules/crm/CrmScreen';
import {
  captureError,
  createCapture,
  createLeadFromCapture,
  deleteCaptures,
  loadCaptureUsage,
  loadCaptures,
  rejectCapture,
  removeCapture,
  sessionCan,
  updateCapture,
  validateCapture,
} from '@/modules/data-capture/capture-api';
import { CsvLeadImportDialog } from '@/modules/data-capture/CsvLeadImportDialog';

const STATUS_OPTIONS = [
  { value: 'CAPTURED', label: 'Pending / Captured' },
  { value: 'VALIDATED', label: 'Validated' },
  { value: 'LEAD_CREATED', label: 'Converted to Lead' },
  { value: 'DUPLICATE', label: 'Duplicate' },
  { value: 'IMPORT_FAILED', label: 'Failed' },
  { value: 'REJECTED', label: 'Rejected' },
];

const SOURCE_OPTIONS = [
  { value: 'GOOGLE_PLACES', label: 'Google Places' },
  { value: 'CSV_IMPORT', label: 'CSV Import' },
  { value: 'MANUAL', label: 'Manual' },
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

  const eligible = (row) =>
    !row.isImported && !row.importedLeadId && !['LEAD_CREATED', 'DUPLICATE', 'REJECTED'].includes(row.status);

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

  const handleBulkValidate = async (selected) => {
    const unvalidated = selected.filter((r) => r.status !== 'VALIDATED' && eligible(r));
    if (!unvalidated.length) {
      toast.info('No eligible unvalidated records selected.');
      return;
    }
    let count = 0;
    for (const record of unvalidated) {
      try {
        await validateCapture(record.id);
        count += 1;
      } catch {
        // continue
      }
    }
    setRefresh((v) => v + 1);
    toast.success(`Validated ${count} captured record${count === 1 ? '' : 's'}`);
  };

  return (
    <>
      <CrmScreen
        appearance="data-capture"
        collapsibleFilters
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
            {allowed && selected.some((r) => r.status !== 'VALIDATED' && eligible(r)) && (
              <Button
                variant="outline"
                size="sm"
                disabled={deleting}
                onClick={() => handleBulkValidate(selected)}
                className="h-8 gap-1.5 border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:border-emerald-200 hover:bg-emerald-50"
              >
                <Check className="size-3.5 text-emerald-600" />
                <span>Validate Selected</span>
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
                <Plus className="size-3.5" />
                <span>Add Lead</span>
              </Button>
            )}
            {canImportCsv && (
              <Button
                variant="outline"
                onClick={() => setCsvImportOpen(true)}
                className="h-9 px-3.5 rounded-xl border-slate-200 bg-white hover:bg-[#EAF7EF]/50 hover:border-emerald-200 text-[#173D30] text-xs font-semibold gap-1.5 transition-colors"
              >
                <Upload className="size-3.5 text-slate-500" />
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
                <Sparkles className="size-3.5" />
                <span>Find Leads from Google</span>
              </Button>
            )}
          </div>
        }
        emptyState={({ onAdd }) => (
          <CaptureEmptyState
            onFindPlaces={() => {
              setSelectedPlaces(null);
              setExtractOpen(true);
            }}
            onImportCsv={() => setCsvImportOpen(true)}
            onAddLead={() => setLeadOpen(true)}
            allowed={allowed}
          />
        )}
        stats={() => [
          {
            label: 'Captured Records',
            value: usage.totalLeadsCaptured ?? 0,
            icon: Database,
            iconTone: 'bg-[#EAF7EF] text-[#173D30]',
          },
          {
            label: 'Validated',
            value: usage.validatedCount ?? 0,
            icon: CheckCircle2,
            iconTone: 'bg-emerald-50 text-emerald-700',
          },
          {
            label: 'Converted to Leads',
            value: usage.convertedCount ?? 0,
            icon: UserCheck,
            iconTone: 'bg-sky-50 text-sky-700',
          },
          {
            label: 'Extractions',
            value: usage.totalExtractions ?? 0,
            icon: Sparkles,
            iconTone: 'bg-violet-50 text-violet-700',
          },
        ]}
        filters={[
          { key: 'status', label: 'All statuses', options: STATUS_OPTIONS },
          { key: 'source', label: 'All sources', options: SOURCE_OPTIONS },
        ]}
        columns={[
          {
            header: 'Business',
            className: 'min-w-[220px] max-w-[300px]',
            cell: (row) => (
              <div className="flex min-w-0 items-center gap-3">
                <BusinessAvatar name={row.businessName} src={businessImage(row)} />
                <div className="min-w-0 flex-1">
                  <p
                    className="truncate text-sm font-semibold text-[#172B24]"
                    title={row.businessName || 'Incomplete record'}
                  >
                    {row.businessName || 'Incomplete record'}
                  </p>
                  <GooglePlaceIdBadge placeId={row.googlePlaceId} />
                </div>
              </div>
            ),
          },
          {
            header: 'Category',
            className: 'min-w-[130px]',
            cell: (row) =>
              row.category ? (
                <span className="inline-flex max-w-[160px] truncate items-center rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700">
                  {row.category}
                </span>
              ) : (
                <span className="text-slate-400 font-medium">—</span>
              ),
          },
          {
            header: 'Phone',
            className: 'min-w-[130px]',
            cell: (row) =>
              row.phone ? (
                <a
                  href={`tel:${row.phone}`}
                  onClick={(e) => e.stopPropagation()}
                  className="font-mono text-xs text-slate-700 hover:text-[#173D30] hover:underline transition-colors"
                >
                  {row.phone}
                </a>
              ) : (
                <span className="text-slate-400 font-medium">—</span>
              ),
          },
          {
            header: 'Location',
            className: 'min-w-[190px] max-w-[260px]',
            cell: (row) => <LocationCell row={row} />,
          },
          {
            header: 'Website & Socials',
            className: 'min-w-[160px]',
            cell: (row) => <SocialAndWebsiteCell row={row} />,
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
            cell: (row) => <ImportStatusBadge row={row} />,
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
                  label: 'Convert to Lead',
                  icon: faArrowUpRightFromSquare,
                  disabled: (r) => !eligible(r),
                  onSelect: (row) => {
                    setSelectedPlaces([row]);
                    setExtractOpen(true);
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
          <div className="space-y-4 text-sm">
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-[#F5FAF7] p-4">
              <BusinessAvatar name={row.businessName} src={businessImage(row)} />
              <div>
                <p className="font-bold text-base text-[#172B24]">{row.businessName}</p>
                <p className="text-xs text-slate-500">
                  {row.category || 'No category'} · {row.source || 'GOOGLE_PLACES'}
                </p>
                {row.googlePlaceId && (
                  <p className="mt-1 font-mono text-[11px] text-slate-400">
                    Place ID: {row.googlePlaceId}
                  </p>
                )}
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="flex items-center gap-2 text-xs font-medium text-slate-500">
                  <Phone className="size-3.5" />
                  Phone
                </p>
                <p className="mt-1 font-medium text-slate-800">{row.phone || '—'}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="flex items-center gap-2 text-xs font-medium text-slate-500">
                  <Mail className="size-3.5" />
                  Email
                </p>
                <p className="mt-1 font-medium text-slate-800">{row.email || '—'}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3 sm:col-span-2">
                <p className="flex items-center gap-2 text-xs font-medium text-slate-500">
                  <MapPin className="size-3.5" />
                  Address
                </p>
                <p className="mt-1 font-medium text-slate-800">{row.address || '—'}</p>
                {row.googleMapsUrl && (
                  <a
                    href={row.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1.5 inline-flex items-center gap-1 text-xs text-[#173D30] underline hover:text-emerald-700"
                  >
                    View on Google Maps <ExternalLink className="size-3" />
                  </a>
                )}
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3 sm:col-span-2">
                <p className="flex items-center gap-2 text-xs font-medium text-slate-500">
                  <Globe className="size-3.5" />
                  Website & Social Presence
                </p>
                <div className="mt-2">
                  <SocialAndWebsiteCell row={row} />
                </div>
              </div>
            </div>
            {row.importedLeadId && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-xs text-emerald-900">
                <strong>Imported as CRM Lead #{row.importedLeadId}</strong>
              </div>
            )}
            {row.notes && (
              <div className="rounded-xl border border-slate-200 bg-white p-3 text-xs">
                <p className="font-semibold text-slate-700">Notes</p>
                <p className="mt-1 text-slate-600">{row.notes}</p>
              </div>
            )}
          </div>
        )}
      />
      {deletionResult && (
        <div
          role="status"
          className="max-w-none min-w-0 w-full mt-3 rounded-xl border border-slate-200 bg-white p-3 text-sm shadow-xs"
        >
          <p className="font-semibold text-slate-800">
            Selected: {deletionResult.totalSelected} · Deleted: {deletionResult.deleted} · Skipped:{' '}
            {deletionResult.skipped} · Failed: {deletionResult.failed}
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
        title={
          confirmation?.single
            ? 'Delete captured record?'
            : `Delete ${confirmation?.rows.length || 0} selected captured records?`
        }
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

function GooglePlaceIdBadge({ placeId }) {
  const [copied, setCopied] = React.useState(false);
  if (!placeId) return null;

  const copy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(placeId);
    setCopied(true);
    toast.success('Place ID copied');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-1.5 mt-0.5">
      <span className="font-mono text-[11px] text-[#718078]" title={`Place ID: ${placeId}`}>
        {placeId.slice(0, 16)}...
      </span>
      <button
        type="button"
        onClick={copy}
        title="Copy Place ID"
        aria-label="Copy Google Place ID"
        className="text-slate-400 hover:text-[#173D30] transition p-0.5 rounded cursor-pointer"
      >
        {copied ? (
          <Check className="size-3 text-emerald-600" />
        ) : (
          <Copy className="size-3" />
        )}
      </button>
    </div>
  );
}

function LocationCell({ row }) {
  const hasCoords =
    row.latitude && row.longitude && !isNaN(Number(row.latitude)) && !isNaN(Number(row.longitude));
  const mapsUrl =
    row.googleMapsUrl ||
    (hasCoords ? `https://www.google.com/maps?q=${row.latitude},${row.longitude}` : null);

  if (!row.address && !mapsUrl) return <span className="text-slate-400 font-medium">—</span>;

  return (
    <div className="flex items-center gap-1.5 max-w-[240px]">
      <span className="truncate text-xs text-slate-600" title={row.address || '—'}>
        {row.address || 'View location on map'}
      </span>
      {mapsUrl && (
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-emerald-600 hover:text-emerald-800 shrink-0 p-0.5"
          title="Open in Google Maps"
          aria-label="Open in Google Maps"
        >
          <ExternalLink className="size-3" />
        </a>
      )}
    </div>
  );
}

function SocialAndWebsiteCell({ row }) {
  const social =
    row?.socialMedia && typeof row.socialMedia === 'object' && !Array.isArray(row.socialMedia)
      ? Object.fromEntries(
          Object.entries(row.socialMedia).map(([k, v]) => [k.trim().toLowerCase(), v])
        )
      : {};

  const platforms = [
    {
      key: 'website',
      label: 'Website',
      icon: faGlobe,
      color: '#163A2E',
      bg: '#ECFDF5',
      val: row?.website || social.website,
    },
    {
      key: 'instagram',
      label: 'Instagram',
      icon: faInstagram,
      color: '#E1306C',
      bg: '#FDF2F8',
      val: social.instagram,
    },
    {
      key: 'facebook',
      label: 'Facebook',
      icon: faFacebook,
      color: '#1877F2',
      bg: '#EFF6FF',
      val: social.facebook,
    },
    {
      key: 'youtube',
      label: 'YouTube',
      icon: faYoutube,
      color: '#FF0000',
      bg: '#FEF2F2',
      val: social.youtube,
    },
    {
      key: 'pinterest',
      label: 'Pinterest',
      icon: faPinterest,
      color: '#E60023',
      bg: '#FEF2F2',
      val: social.pinterest,
    },
    {
      key: 'linkedin',
      label: 'LinkedIn',
      icon: faLinkedin,
      color: '#0A66C2',
      bg: '#F0F9FF',
      val: social.linkedin,
    },
    {
      key: 'whatsapp',
      label: 'WhatsApp',
      icon: faWhatsapp,
      color: '#25D366',
      bg: '#F0FDF4',
      val:
        social.whatsapp ||
        social.whatsappurl ||
        (row?.whatsapp && row.whatsapp !== row.phone
          ? `https://wa.me/${String(row.whatsapp).replace(/\D/g, '')}`
          : null),
    },
    {
      key: 'twitter',
      label: 'Twitter / X',
      icon: faXTwitter,
      color: '#111111',
      bg: '#F8FAFC',
      val: social.twitter || social.x || social.twitter_x,
    },
    {
      key: 'tiktok',
      label: 'TikTok',
      icon: faTiktok,
      color: '#000000',
      bg: '#F8FAFC',
      val: social.tiktok,
    },
  ];

  const links = platforms.flatMap((p) => {
    const raw = p.val;
    if (!raw) return [];
    let href = String(raw).trim();
    if (!/^https?:\/\//i.test(href)) {
      if (p.key === 'whatsapp' && /^\d+$/.test(href.replace(/\D/g, ''))) {
        href = `https://wa.me/${href.replace(/\D/g, '')}`;
      } else if (/^[\w.-]+\.[a-z]{2,}/i.test(href)) {
        href = `https://${href}`;
      } else {
        return [];
      }
    }
    return [{ ...p, href }];
  });

  if (links.length === 0) {
    return <span className="text-slate-300 text-xs">—</span>;
  }

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {links.map((link) => (
        <a
          key={link.key}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          title={`${link.label}: ${link.href}`}
          aria-label={`${link.label}: ${link.href}`}
          onClick={(e) => e.stopPropagation()}
          className="size-6 rounded-md flex items-center justify-center transition-transform hover:scale-110 shadow-2xs border border-slate-200/60"
          style={{ color: link.color, backgroundColor: link.bg }}
        >
          <FontAwesomeIcon icon={link.icon} className="size-3" />
        </a>
      ))}
    </div>
  );
}

function ImportStatusBadge({ row }) {
  if (row.status === 'IMPORT_FAILED') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-[11px] font-semibold text-rose-700">
        <span className="size-1.5 rounded-full bg-rose-500" />
        Failed
      </span>
    );
  }
  if (row.status === 'DUPLICATE') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800">
        <span className="size-1.5 rounded-full bg-amber-500" />
        Duplicate
      </span>
    );
  }
  if (row.isImported || row.importedLeadId || row.status === 'LEAD_CREATED') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-[#EAF7EF] px-2.5 py-0.5 text-[11px] font-semibold text-[#173D30]">
        <span className="size-1.5 rounded-full bg-[#20C466]" />
        Imported
      </span>
    );
  }
  if (row.status === 'VALIDATED') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-0.5 text-[11px] font-semibold text-sky-700">
        <span className="size-1.5 rounded-full bg-sky-500" />
        Validated
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
      <span className="size-1.5 rounded-full bg-slate-400" />
      Pending
    </span>
  );
}

function CaptureEmptyState({ onFindPlaces, onImportCsv, onAddLead, allowed }) {
  return (
    <div className="rounded-2xl border border-dashed border-[#DCE8E0] bg-white px-5 py-12 text-center shadow-sm sm:py-16">
      <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-[#EAF7EF] text-[#173D30]">
        <Database className="size-8" aria-hidden="true" />
      </div>
      <h2 className="mt-5 text-lg font-bold text-[#172033]">No captured records found.</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
        There are no captured records matching your current filters.
      </p>
      {allowed && (
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button
            onClick={onFindPlaces}
            className="h-10 rounded-xl bg-[#20C466] hover:bg-[#1BB35B] px-4 font-semibold text-white shadow-xs"
          >
            <Sparkles className="mr-2 size-4" />
            Find Leads from Google
          </Button>
          <Button
            variant="outline"
            onClick={onImportCsv}
            className="h-10 rounded-xl border-slate-200 px-4 font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Upload className="mr-2 size-4" />
            Import CSV
          </Button>
          <Button
            onClick={onAddLead}
            className="h-10 rounded-xl bg-[#173D30] hover:bg-[#123026] px-4 font-semibold text-white shadow-xs"
          >
            <Plus className="mr-2 size-4" />
            Add Lead
          </Button>
        </div>
      )}
    </div>
  );
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
  const photo = Array.isArray(row.photos)
    ? row.photos.find((item) => safeHttp(typeof item === 'string' ? item : item?.url))
    : '';
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
