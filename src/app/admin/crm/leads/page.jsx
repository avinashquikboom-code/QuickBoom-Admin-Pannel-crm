'use client';

import * as React from 'react';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { Button } from '@/components/common/Button';
import { FormDrawer } from '@/components/common/drawers/FormDrawer';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { AdminBulkActions, AdminBulkSelectionToolbar, AdminSelectCheckbox, AdminSelectionSummary } from '@/components/admin/bulk-selection';
import { toast } from '@/hooks/use-toast';
import { CrmScreen } from '@/modules/crm/CrmScreen';
import { addLeadNote, archiveLeads, bulkAssignLeads, bulkLeadPriority, bulkLeadStatus, checkLeadDuplicate, convertLead, crmError, importGooglePlaces, listLeadPage, loadCapturedPlace, loadEmployees, loadLeadNotes, loadLeads, personName, removeLead, resolveGoogleLocation, saveLead, searchGooglePlaces, sessionCan, suggestGoogleLocations } from '@/modules/crm/crm-api';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import { faEnvelope, faGlobe, faLocationDot, faPhone, faXmark } from '@fortawesome/free-solid-svg-icons';
import { loadDepartments } from '@/modules/master/master-api';

const STATUSES = ['NEW', 'CONTACTED', 'QUALIFIED', 'FOLLOW_UP', 'NEGOTIATION', 'WON', 'LOST', 'CONVERTED'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
const SOURCE_OPTIONS = ['Manual', 'Google Places', 'Website', 'WhatsApp', 'Facebook', 'Instagram', 'Referral', 'Other'];
const blank = { leadName: '', companyName: '', phone: '', whatsapp: '', email: '', website: '', address: '', city: '', state: '', country: '', pincode: '', source: 'Manual', category: '', priority: 'MEDIUM', status: 'NEW', assignedToId: '', assignedTeam: '', value: '', notes: '' };

function unwrap(payload) {
  if (payload?.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) return payload.data;
  return payload || {};
}

function filtersFrom(query) {
  return {
    search: query.search || undefined,
    status: query.status || undefined,
    priority: query.priority || undefined,
    source: query.source || undefined,
    assignedToId: query.assignedToId || undefined,
    from: query.from ? new Date(query.from).toISOString() : undefined,
    to: query.to ? new Date(`${query.to}T23:59:59`).toISOString() : undefined,
  };
}

function validEmail(value) {
  return !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validPhone(value) {
  const digits = String(value || '').replace(/\D/g, '');
  return !value || (digits.length >= 8 && digits.length <= 15);
}

function splitName(value) {
  const parts = String(value || '').trim().split(/\s+/).filter(Boolean);
  return { firstName: parts[0] || '', lastName: parts.slice(1).join(' ') };
}

async function matchingIds(query) {
  const ids = [];
  for (let page = 1; page <= 20; page += 1) {
    const result = await listLeadPage({ ...filtersFrom(query), page, limit: 100 });
    ids.push(...result.rows.map((row) => row.id).filter(Boolean));
    if (page >= Number(result.pagination?.totalPages || 1)) break;
  }
  return [...new Set(ids)];
}

function downloadCsv(rows) {
  const headers = ['Name', 'Company', 'Phone', 'Email', 'Source', 'Priority', 'Assigned', 'Status', 'Created'];
  const lines = rows.map((row) => [personName(row), row.companyName, row.phone, row.email, row.source, row.priority, personName(row.assignedTo || row.employee), row.status, String(row.createdAt || '').slice(0, 10)].map((value) => `"${String(value || '').replace(/"/g, '""')}"`).join(','));
  const blob = new Blob([[headers.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'leads.csv';
  link.click();
  URL.revokeObjectURL(url);
}

export default function LeadsRoute() {
  const [allowed, setAllowed] = React.useState(false);
  const [canCapture, setCanCapture] = React.useState(false);
  const [canDelete, setCanDelete] = React.useState(false);
  const [sources, setSources] = React.useState([]);
  const [employees, setEmployees] = React.useState([]);
  const [departments, setDepartments] = React.useState([]);
  const [googleOpen, setGoogleOpen] = React.useState(false);
  const [importOpen, setImportOpen] = React.useState(false);
  const [reloadKey, setReloadKey] = React.useState(0);
  React.useEffect(() => {
    setAllowed(sessionCan('LEADS') || sessionCan('CRM'));
    setCanCapture(sessionCan('DATA_CAPTURE') || sessionCan('LEADS') || sessionCan('CRM'));
    setCanDelete(sessionCan('LEADS') || sessionCan('CRM'));
    loadEmployees({ bpoOnly: true }).then(setEmployees).catch(() => setEmployees([]));
    loadDepartments().then(setDepartments).catch(() => setDepartments([]));
  }, []);
  const load = React.useCallback(async (query) => {
    const result = await loadLeads({ page: query.page, limit: 20, ...filtersFrom(query) });
    setSources(result.sources);
    return result;
  }, []);
  const sourceOptions = React.useMemo(() => {
    const names = sources.map((source) => source.name || source.code).filter(Boolean);
    return [...new Set([...SOURCE_OPTIONS, ...names])];
  }, [sources]);

  return (
    <>
      <CrmScreen
        title="Leads"
        description="Create leads manually, discover businesses with Google Places, and update selected leads in bulk."
        actionLabel="Add lead"
        canCreate={allowed}
        load={load}
        blank={blank}
        enableSelection
        refreshToken={reloadKey}
        toForm={(row) => ({ leadName: personName(row) === '—' ? '' : personName(row), assignedToId: row.employeeId || row.assignedToId || '' })}
        extraHeaderActions={<>
          <Button variant="outline" disabled={!canCapture} onClick={() => setGoogleOpen(true)}>Find leads from Google</Button>
        </>}
        stats={(result) => [
          { label: 'Total leads', value: result.metrics?.total },
          { label: 'New', value: result.metrics?.new },
          { label: 'Contacted', value: result.metrics?.contacted },
          { label: 'Qualified', value: result.metrics?.qualified },
          { label: 'Converted', value: result.metrics?.converted },
          { label: 'Lost', value: result.metrics?.lost },
        ]}
        filters={[
          { key: 'status', label: 'All statuses', options: STATUSES.map((status) => ({ value: status, label: status })) },
          { key: 'priority', label: 'All priorities', options: PRIORITIES.map((item) => ({ value: item, label: item })) },
          { key: 'source', label: 'All sources', options: sourceOptions.map((item) => ({ value: item, label: item })) },
          { key: 'assignedToId', label: 'All BPO employees', options: employees.map((employee) => ({ value: String(employee.recordId), label: employee.name })) },
          { key: 'from', label: 'From', type: 'date' },
          { key: 'to', label: 'To', type: 'date' },
        ]}
        columns={[
          { header: 'Lead', cell: (row) => personName(row) },
          { header: 'Company', cell: (row) => row.companyName || '—' },
          { header: 'Phone', cell: (row) => row.phone || '—' },
          { header: 'Email', cell: (row) => row.email || '—' },
          { header: 'Source', cell: (row) => row.source || '—' },
          { header: 'Priority', cell: (row) => row.priority || '—' },
          { header: 'Assigned', cell: (row) => personName(row.assignedTo || row.employee) },
          { header: 'Created', cell: (row) => String(row.createdAt || '').slice(0, 10) },
          { header: 'Status', cell: (row) => <StatusBadge status={String(row.status || 'new').toLowerCase()} /> },
        ]}
        renderForm={(form, setForm) => <LeadForm form={form} setForm={setForm} sources={sourceOptions} employees={employees} departments={departments} />}
        onSave={async (form, id) => { await persistLead(form, id); toast.success(id ? 'Lead updated' : 'Lead created'); }}
        detail={(row) => <div className="space-y-2 text-sm"><p>{personName(row)} · {row.companyName || 'No company'}</p><p>{row.phone || '—'} · {row.email || '—'}</p><p>{[row.address, row.city, row.state, row.country, row.pincode].filter(Boolean).join(', ') || 'No address'}</p><p>Status {row.status} · Priority {row.priority || '—'} · Source {row.source || '—'} · Value {row.value ?? '—'}</p><p>Department {row.assignedTeam || '—'} · Google Place ID {row.googlePlaceId || '—'}</p><LeadNotes id={row.id} /></div>}
        toolbar={({ query, selected, reload, payload }) => <BulkBar query={query} selected={selected} total={payload.pagination?.total} reload={reload} employees={employees} departments={departments} canDelete={canDelete} />}
        rowActions={(reload) => allowed ? [
          { label: 'Convert', onSelect: async (row) => { try { await convertLead(row.id, { companyName: row.companyName, dealTitle: row.title || row.companyName }); reload((value) => value + 1); toast.success('Lead conversion requested'); } catch (err) { toast.error(crmError(err)); } } },
          { label: 'Delete', onSelect: async (row) => { try { await removeLead(row.id); reload((value) => value + 1); toast.success('Lead archived'); } catch (err) { toast.error(crmError(err)); } } },
        ] : []}
        below={() => <p className="text-xs text-[#718078]">Tags are not stored on the lead record. Department is saved as the assigned team name.</p>}
      />
      <GooglePlacesPanel open={googleOpen} onOpenChange={setGoogleOpen} onImported={() => setReloadKey((value) => value + 1)} />
      <CsvImportPanel open={importOpen} onOpenChange={setImportOpen} onImported={() => setReloadKey((value) => value + 1)} />
    </>
  );
}

async function persistLead(form, id) {
  const name = splitName(form.leadName || `${form.firstName || ''} ${form.lastName || ''}`);
  if (!name.firstName) throw new Error('Lead name is required.');
  if (!validEmail(form.email)) throw new Error('Enter a valid email address.');
  if (!validPhone(form.phone) || !validPhone(form.whatsapp)) throw new Error('Enter a valid phone number.');
  if (form.value !== '' && form.value != null && Number.isNaN(Number(form.value))) throw new Error('Estimated deal value must be a number.');
  const values = { ...form, ...name, source: form.source === 'Google Places' ? 'GOOGLE_PLACES' : form.source };
  if (!id) {
    const duplicate = unwrap(await checkLeadDuplicate(values));
    if (duplicate.isDuplicate) throw new Error(duplicate.matchReason || 'A matching lead already exists.');
  }
  const saved = unwrap(await saveLead(values, id));
  const leadId = id || saved.id;
  if (leadId && form.notes) await addLeadNote(leadId, form.notes);
  if (leadId && form.whatsapp && form.whatsapp !== form.phone) await addLeadNote(leadId, `WhatsApp: ${form.whatsapp}`);
}

function LeadForm({ form, setForm, sources, employees, departments }) {
  const set = (key) => (event) => setForm({ ...form, [key]: event.target.value });
  return <div className="grid gap-3 sm:grid-cols-2">
    <Field label="Lead name"><Input required value={form.leadName || ''} onChange={set('leadName')} /></Field>
    <Field label="Company name"><Input value={form.companyName || ''} onChange={set('companyName')} /></Field>
    <Field label="Mobile number"><Input value={form.phone || ''} onChange={set('phone')} /></Field>
    <Field label="WhatsApp number"><Input value={form.whatsapp || ''} onChange={set('whatsapp')} /></Field>
    <Field label="Email"><Input type="email" value={form.email || ''} onChange={set('email')} /></Field>
    <Field label="Website"><Input value={form.website || ''} onChange={set('website')} /></Field>
    <Field label="Business address" className="sm:col-span-2"><Input value={form.address || ''} onChange={set('address')} /></Field>
    <Field label="City"><Input value={form.city || ''} onChange={set('city')} /></Field>
    <Field label="State"><Input value={form.state || ''} onChange={set('state')} /></Field>
    <Field label="Country"><Input value={form.country || ''} onChange={set('country')} /></Field>
    <Field label="Pincode"><Input value={form.pincode || ''} onChange={set('pincode')} /></Field>
    <Field label="Lead source"><select className="h-9 rounded-md border px-2 text-sm" value={form.source || 'Manual'} onChange={set('source')}>{sources.map((source) => <option key={source}>{source}</option>)}</select></Field>
    <Field label="Lead category"><Input value={form.category || ''} onChange={set('category')} /></Field>
    <Field label="Priority"><select className="h-9 rounded-md border px-2 text-sm" value={form.priority || 'MEDIUM'} onChange={set('priority')}>{PRIORITIES.map((item) => <option key={item}>{item}</option>)}</select></Field>
    <Field label="Lead status"><select className="h-9 rounded-md border px-2 text-sm" value={form.status || 'NEW'} onChange={set('status')}>{STATUSES.map((status) => <option key={status}>{status}</option>)}</select></Field>
    <Field label="Assigned employee"><select className="h-9 rounded-md border px-2 text-sm" value={form.assignedToId || ''} onChange={set('assignedToId')}><option value="">Unassigned</option>{employees.map((employee) => <option key={employee.recordId} value={employee.recordId}>{employee.name}</option>)}</select></Field>
    <Field label="Estimated deal value"><Input type="number" min="0" value={form.value ?? ''} onChange={set('value')} /></Field>
    <Field label="Notes" className="sm:col-span-2"><Input value={form.notes || ''} onChange={set('notes')} /></Field>
  </div>;
}

function BulkBar({ query, selected, total, reload, employees, departments, canDelete }) {
  const [selectAll, setSelectAll] = React.useState(false);
  const [assignedToId, setAssignedToId] = React.useState('');
  const [assignedTeam, setAssignedTeam] = React.useState('');
  const [status, setStatus] = React.useState('NEW');
  const [priority, setPriority] = React.useState('MEDIUM');
  const [confirm, setConfirm] = React.useState(null);
  const count = selectAll ? Number(total || 0) : selected.length;
  const target = async () => {
    if (selectAll) return { selectAll: true, filters: filtersFrom(query) };
    return { ids: selected.map((row) => row.id) };
  };
  const run = async (action) => {
    try {
      const body = await target();
      const result = unwrap(await action(body));
      toast.success(`${result.success ?? result.count ?? 0} updated, ${result.failed ?? 0} failed.`);
      if (result.failures?.length) toast.error(result.failures[0].message);
      reload();
    } catch (err) {
      toast.error(crmError(err));
    }
  };
  const archive = async () => {
    try {
      const ids = selectAll ? await matchingIds(query) : selected.map((row) => row.id);
      const result = unwrap(await archiveLeads(ids));
      toast.success(result.message || `${result.count ?? ids.length} leads archived.`);
      reload();
    } catch (err) {
      toast.error(crmError(err));
    }
  };
  if (!count) return null;
  return <div className="space-y-2">
    <AdminBulkSelectionToolbar count={count} onClear={() => setSelectAll(false)}>
      <AdminBulkActions>
        <label className="flex items-center gap-2 text-xs"><AdminSelectCheckbox checked={selectAll} onChange={setSelectAll} label="Select all matching leads" /> All matching</label>
        <select aria-label="Assign employee" className="h-8 rounded-md border bg-white px-2 text-xs" value={assignedToId} onChange={(event) => setAssignedToId(event.target.value)}><option value="">Employee</option>{employees.map((employee) => <option key={employee.recordId} value={employee.recordId}>{employee.name}</option>)}</select>
        <select aria-label="Assign department" className="h-8 rounded-md border bg-white px-2 text-xs" value={assignedTeam} onChange={(event) => setAssignedTeam(event.target.value)}><option value="">Department</option>{departments.map((department) => <option key={department.id} value={department.name}>{department.name}</option>)}</select>
        <Button size="sm" variant="outline" onClick={() => assignedToId ? run((body) => bulkAssignLeads({ ...body, assignedToId: Number(assignedToId), assignedTeam: assignedTeam || undefined })) : toast.error('Choose an employee.')}>Assign</Button>
        <select aria-label="Lead status" className="h-8 rounded-md border bg-white px-2 text-xs" value={status} onChange={(event) => setStatus(event.target.value)}>{STATUSES.map((item) => <option key={item}>{item}</option>)}</select>
        <Button size="sm" variant="outline" onClick={() => run((body) => bulkLeadStatus({ ...body, status }))}>Update status</Button>
        <select aria-label="Lead priority" className="h-8 rounded-md border bg-white px-2 text-xs" value={priority} onChange={(event) => setPriority(event.target.value)}>{PRIORITIES.map((item) => <option key={item}>{item}</option>)}</select>
        <Button size="sm" variant="outline" onClick={() => run((body) => bulkLeadPriority({ ...body, priority }))}>Update priority</Button>
        <Button size="sm" variant="outline" onClick={async () => {
          if (!selectAll) { downloadCsv(selected); return; }
          const rows = [];
          let total = 0;
          for (let page = 1; page <= 20; page += 1) {
            const result = await listLeadPage({ ...filtersFrom(query), page, limit: 100 });
            rows.push(...result.rows);
            total = Number(result.pagination?.total || rows.length);
            if (page >= Number(result.pagination?.totalPages || 1)) break;
          }
          downloadCsv(rows);
          if (total > rows.length) toast.error(`Exported ${rows.length} of ${total} matching leads.`);
        }}>Export</Button>
        {canDelete && <Button size="sm" variant="destructive" onClick={() => setConfirm('archive')}>Archive</Button>}
        {canDelete && <Button size="sm" variant="destructive" onClick={() => setConfirm('delete')}>Delete</Button>}
      </AdminBulkActions>
    </AdminBulkSelectionToolbar>
    <ConfirmDialog open={Boolean(confirm)} onOpenChange={() => setConfirm(null)} variant="destructive" title={confirm === 'delete' ? 'Delete selected leads' : 'Archive selected leads'} description={`${count} leads will be soft-deleted. This uses the existing lead archive API.`} confirmLabel="Continue" onConfirm={() => { setConfirm(null); archive(); }} />
  </div>;
}

const PLACE_CATEGORIES = ['Restaurant', 'Cafe', 'Hotel', 'Hospital', 'Pharmacy', 'Clinic', 'School', 'College', 'Gym', 'Salon', 'Grocery store', 'Supermarket', 'Clothing store', 'Electronics store', 'Bank', 'Real estate agency', 'Car repair', 'Dentist', 'Doctor', 'Lawyer', 'Accounting', 'Software company', 'Marketing agency', 'Construction company', 'Bakery', 'Pet store', 'Jewelry store', 'Furniture store', 'Travel agency', 'Insurance agency', 'Logistics', 'Manufacturing', 'IT services'];

function distanceKm(origin, place) {
  const lat1 = Number(origin?.latitude);
  const lon1 = Number(origin?.longitude);
  const lat2 = Number(place?.latitude);
  const lon2 = Number(place?.longitude);
  if (![lat1, lon1, lat2, lon2].every(Number.isFinite)) return null;
  const toRad = (value) => value * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return Math.round(6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
}

function GooglePlacesPanel({ open, onOpenChange, onImported }) {
  const [categories, setCategories] = React.useState([]);
  const [categoryQuery, setCategoryQuery] = React.useState('');
  const [categoryOpen, setCategoryOpen] = React.useState(false);
  const [locationQuery, setLocationQuery] = React.useState('');
  const [location, setLocation] = React.useState(null);
  const [suggestions, setSuggestions] = React.useState([]);
  const [places, setPlaces] = React.useState([]);
  const [jobId, setJobId] = React.useState('');
  const [selected, setSelected] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [importing, setImporting] = React.useState(false);
  const [error, setError] = React.useState('');
  const [searched, setSearched] = React.useState(false);
  const [detail, setDetail] = React.useState(null);
  const [outcomes, setOutcomes] = React.useState({});
  const [limit, setLimit] = React.useState(20);
  const categorySuggestions = PLACE_CATEGORIES.filter((item) => item.toLowerCase().includes(categoryQuery.trim().toLowerCase()) && !categories.includes(item)).slice(0, 8);
  React.useEffect(() => {
    if (!open) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [open]);
  React.useEffect(() => {
    if (location || locationQuery.trim().length < 2) { setSuggestions([]); return undefined; }
    const timer = setTimeout(async () => {
      try {
        const result = unwrap(await suggestGoogleLocations(locationQuery.trim()));
        setSuggestions(result.suggestions || []);
      } catch (err) {
        setSuggestions([]);
        setError(crmError(err));
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [location, locationQuery]);
  const search = async () => {
    if (!categories.length) { setError('Select at least one business category.'); return; }
    if (!location?.address || location.latitude == null || location.longitude == null) { setError('Select a location from the suggestions.'); return; }
    setLoading(true);
    setError('');
    setSearched(true);
    try {
      const result = unwrap(await searchGooglePlaces({ categories, location: location.address, latitude: location.latitude, longitude: location.longitude, maxResults: limit }));
      const rows = result.places || result.records || [];
      const unique = [];
      const seen = new Set();
      rows.forEach((place) => {
        const id = place.googlePlaceId || place.id;
        if (!id || seen.has(id)) return;
        seen.add(id);
        unique.push(place);
      });
      setPlaces(unique.slice(0, limit));
      setJobId(result.jobId || '');
      setSelected([]);
      setOutcomes({});
      setDetail(null);
    } catch (err) {
      setPlaces([]);
      setError(crmError(err));
    } finally {
      setLoading(false);
    }
  };
  const toggle = (place) => {
    const id = place.googlePlaceId;
    if (!id) return;
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };
  const selectable = places.filter((place) => place.googlePlaceId).map((place) => place.googlePlaceId);
  const allSelected = selectable.length > 0 && selectable.every((id) => selected.includes(id));
  const importSelected = async (ids) => {
    const pending = [...new Set(ids)].filter((id) => outcomes[id]?.status !== 'imported' && outcomes[id]?.status !== 'duplicate');
    if (!pending.length) return;
    setImporting(true);
    try {
      const result = unwrap(await importGooglePlaces(pending, jobId));
      const records = result.records || [];
      const next = { ...outcomes };
      records.forEach((record) => {
        const id = record.googlePlaceId;
        if (!id) return;
        next[id] = record.imported ? { status: 'imported' } : record.duplicate ? { status: 'duplicate', message: 'Already in CRM' } : { status: 'failed', message: record.message || 'Import failed' };
      });
      pending.forEach((id) => {
        if (!next[id] || next[id] === outcomes[id]) next[id] = { status: 'failed', message: 'Import failed' };
      });
      setOutcomes(next);
      const imported = Object.values(next).filter((item) => item.status === 'imported').length;
      const duplicates = Object.values(next).filter((item) => item.status === 'duplicate').length;
      const failed = pending.filter((id) => next[id]?.status === 'failed').length;
      toast.success(`Imported ${result.imported ?? imported}. Already existing ${result.skippedDuplicates ?? duplicates}. Failed ${result.failed ?? failed}.`);
      if ((result.imported ?? imported) > 0) onImported?.();
    } catch (err) {
      const next = { ...outcomes };
      pending.forEach((id) => { next[id] = { status: 'failed', message: crmError(err) }; });
      setOutcomes(next);
      toast.error(crmError(err));
    } finally {
      setImporting(false);
    }
  };
  const failedIds = selected.filter((id) => outcomes[id]?.status === 'failed');
  return <FormDrawer open={open} onOpenChange={onOpenChange} title="Find Leads from Google" description="Discovery results stay out of the CRM until you import them. Data from Google Maps Platform." size="xl" showFooter={false} bodyClassName="!flex !min-h-0 !flex-1 !flex-col !overflow-hidden !space-y-0 !p-0" contentClassName="w-full sm:max-w-[760px]">
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
        <div className="relative">
          <Label className="mb-1 block text-xs">Category</Label>
          <div className="flex min-h-10 flex-wrap items-center gap-1 rounded-lg border border-[#E2E8E5] bg-white px-2 py-1">
            {categories.map((item) => <button key={item} type="button" className="inline-flex items-center gap-1 rounded-full bg-[#E8F1EC] px-2 py-1 text-xs text-[#163A2E]" onClick={() => setCategories(categories.filter((value) => value !== item))}>{item} <FontAwesomeIcon icon={faXmark} className="size-3" /></button>)}
            <input aria-label="Search business categories" className="h-8 min-w-40 flex-1 bg-transparent text-sm outline-none" placeholder="Search business categories..." value={categoryQuery} onFocus={() => setCategoryOpen(true)} onChange={(event) => { setCategoryQuery(event.target.value); setCategoryOpen(true); }} />
            {categories.length > 0 && <button type="button" className="text-xs text-[#718078]" onClick={() => setCategories([])}>Clear</button>}
          </div>
          {categoryOpen && <div className="absolute z-30 mt-1 max-h-52 w-full overflow-auto rounded-lg border border-[#E2E8E5] bg-white shadow-lg">{categorySuggestions.map((item) => <button key={item} type="button" className="block w-full px-3 py-2 text-left text-sm hover:bg-[#E8F1EC]" onClick={() => { setCategories([...categories, item]); setCategoryQuery(''); setCategoryOpen(false); }}>{item}</button>)}{!categorySuggestions.length && <p className="px-3 py-2 text-sm text-[#718078]">No matching categories</p>}</div>}
        </div>
        <div className="relative">
          <Label className="mb-1 block text-xs">Location</Label>
          <div className="flex items-center gap-2 rounded-lg border border-[#E2E8E5] bg-white px-3">
            <FontAwesomeIcon icon={faLocationDot} className="text-[#163A2E]" />
            <input aria-label="Search area, locality or address" className="h-10 w-full bg-transparent text-sm outline-none" placeholder="Search area, locality or address" value={location ? location.address : locationQuery} onChange={(event) => { setLocation(null); setLocationQuery(event.target.value); }} />
            {(location || locationQuery) && <button type="button" aria-label="Clear location" onClick={() => { setLocation(null); setLocationQuery(''); setSuggestions([]); }}><FontAwesomeIcon icon={faXmark} className="text-[#718078]" /></button>}
          </div>
          {suggestions.length > 0 && <div className="absolute z-30 mt-1 max-h-52 w-full overflow-auto rounded-lg border border-[#E2E8E5] bg-white shadow-lg">{suggestions.map((item) => <button key={item.placeId} type="button" className="block w-full px-3 py-2 text-left text-sm hover:bg-[#E8F1EC]" onClick={async () => { try { const resolved = unwrap(await resolveGoogleLocation(item.placeId)); setLocation(resolved); setLocationQuery(''); setSuggestions([]); setError(''); } catch (err) { setError(crmError(err)); } }}>{item.label}</button>)}</div>}
        </div>
        <section className="rounded-xl border border-[#163A2E]/20 bg-[#E8F1EC] p-3">
          <h3 className="text-sm font-semibold text-[#172B24]">Capture Leads</h3>
          <p className="text-xs text-[#718078]">Fetch and capture top results from Google Maps.</p>
          <div className="mt-2 flex gap-2">{[10, 20, 50].map((count) => <button key={count} type="button" className={`h-9 min-w-14 rounded-lg border text-sm font-medium ${limit === count ? 'border-[#163A2E] bg-[#163A2E] text-white' : 'border-[#E2E8E5] bg-white text-[#172B24]'}`} onClick={() => setLimit(count)}>{count}</button>)}</div>
        </section>
        <Button className="bg-[#163A2E] hover:bg-[#204C3D]" onClick={search} disabled={loading}>{loading ? 'Searching…' : 'Search'}</Button>
        {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        {searched && !loading && <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-[#172B24]">Found Leads ({places.length})</p>
          <p className="text-xs text-[#718078]">{places.length} Found Leads | {selected.length} Selected</p>
        </div>}
        {searched && !loading && places.length > 0 && <label className="flex items-center gap-2 text-xs"><AdminSelectCheckbox checked={allSelected} onChange={() => setSelected(allSelected ? [] : selectable)} label="Select all businesses" /> {allSelected ? 'Deselect all' : 'Select all'}</label>}
        {loading && <p className="text-sm text-[#718078]">Searching Google Maps…</p>}
        {searched && !loading && !places.length && !error && <p className="rounded-xl border border-dashed border-[#E2E8E5] p-6 text-center text-sm text-[#718078]">No businesses found for this category and location.</p>}
        <div className="grid gap-3">
          {places.map((place) => {
            const outcome = outcomes[place.googlePlaceId];
            const km = distanceKm(location, place);
            return <article key={place.googlePlaceId || place.id} className={`rounded-xl border bg-white p-3 text-sm shadow-sm ${selected.includes(place.googlePlaceId) ? 'border-[#163A2E]' : 'border-[#E2E8E5]'}`}>
              <div className="flex items-start gap-3">
                <AdminSelectCheckbox checked={selected.includes(place.googlePlaceId)} disabled={!place.googlePlaceId} onChange={() => toggle(place)} label={`Select ${place.businessName}`} />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-[#172B24]">{place.businessName}</p>
                  <p className="text-[#718078]">{place.category || 'Not available'}{km != null ? ` · ${km} km` : ''}</p>
                  <p className="mt-1 flex items-start gap-2"><FontAwesomeIcon icon={faLocationDot} className="mt-0.5 text-[#163A2E]" /> {place.address && place.address !== 'N/A' ? place.address : 'Not available'}</p>
                  <p className="flex items-center gap-2"><FontAwesomeIcon icon={faPhone} className="text-[#163A2E]" /> {place.phone || 'Not available'}</p>
                  {place.email && <p className="flex items-center gap-2"><FontAwesomeIcon icon={faEnvelope} className="text-[#163A2E]" /> {place.email}</p>}
                  <p className="flex items-center gap-2"><FontAwesomeIcon icon={faGlobe} className="text-[#163A2E]" /> {place.website ? <a className="truncate text-[#163A2E] underline" href={place.website} target="_blank" rel="noreferrer">{place.website}</a> : 'Not available'}</p>
                  {place.googleMapsUrl && <a className="text-xs text-[#163A2E] underline" href={place.googleMapsUrl} target="_blank" rel="noreferrer">Google Maps profile</a>}
                  {outcome && <p className={`mt-1 text-xs ${outcome.status === 'failed' ? 'text-red-700' : 'text-[#163A2E]'}`}>{outcome.status === 'imported' ? 'Imported' : outcome.status === 'duplicate' ? 'Already in CRM' : outcome.message}</p>}
                  <Button className="mt-2" size="sm" variant="outline" onClick={async () => { try { setDetail(unwrap(await loadCapturedPlace(place.id))); } catch (err) { toast.error(crmError(err)); } }}>View Details</Button>
                </div>
              </div>
            </article>;
          })}
        </div>
        {detail && <div className="rounded-xl border bg-white p-3 text-sm"><p className="font-medium">{detail.businessName}</p><p>{detail.address || 'Not available'}</p><p>{detail.phone || 'Not available'}</p><p>{detail.email || 'Email not available'}</p><p>{detail.website || 'Not available'}</p></div>}
      </div>
      <div className="flex shrink-0 items-center justify-between gap-3 border-t border-[#E2E8E5] bg-white px-6 py-4">
        <p className="text-sm text-[#172B24]">{places.length} leads ready to import</p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          {failedIds.length > 0 && <Button variant="outline" disabled={importing} onClick={() => importSelected(failedIds)}>{importing ? 'Importing…' : `Retry failed (${failedIds.length})`}</Button>}
          <Button className="bg-[#163A2E] hover:bg-[#204C3D]" disabled={!selected.length || importing} onClick={() => importSelected(selected)}>{importing ? 'Importing…' : `Import Selected (${selected.length})`}</Button>
        </div>
      </div>
    </div>
  </FormDrawer>;
}

function CsvImportPanel({ open, onOpenChange, onImported }) {
  const [text, setText] = React.useState('');
  const [summary, setSummary] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    if (lines.length < 2) { toast.error('Paste a header row and at least one lead.'); return; }
    const headers = lines[0].split(',').map((item) => item.trim().toLowerCase());
    setLoading(true);
    let imported = 0;
    let existing = 0;
    let failed = 0;
    for (const line of lines.slice(1)) {
      const cells = line.split(',').map((item) => item.trim());
      const row = Object.fromEntries(headers.map((header, index) => [header, cells[index] || '']));
      const form = {
        leadName: row.name || row['lead name'] || row.lead || '',
        companyName: row.company || row['company name'] || '',
        phone: row.phone || row.mobile || '',
        email: row.email || '',
        website: row.website || '',
        address: row.address || '',
        city: row.city || '',
        state: row.state || '',
        country: row.country || '',
        pincode: row.pincode || '',
        source: row.source || 'Manual',
        category: row.category || '',
        priority: (row.priority || 'MEDIUM').toUpperCase(),
        status: (row.status || 'NEW').toUpperCase(),
        value: row.value || '',
        notes: row.notes || '',
      };
      try {
        await persistLead(form);
        imported += 1;
      } catch (err) {
        if (/already exists|duplicate|match/i.test(err.message || '')) existing += 1;
        else failed += 1;
      }
    }
    setSummary({ imported, existing, failed, total: lines.length - 1 });
    setLoading(false);
    onImported?.();
  };
  return <FormDrawer open={open} onOpenChange={onOpenChange} title="Bulk import" description="Creates leads through the existing lead API. Columns: name, company, phone, email, website, address, city, state, country, pincode, source, category, priority, status, value, notes." showFooter={false}>
    <div className="space-y-3">
      <textarea aria-label="CSV leads" className="min-h-40 w-full rounded-md border p-2 text-sm" value={text} onChange={(event) => setText(event.target.value)} placeholder="name,company,phone,email&#10;Asha Rao,Northwind,9820012345,asha@northwind.example" />
      <Button onClick={run} disabled={loading}>{loading ? 'Importing' : 'Import rows'}</Button>
      {summary && <p className="text-sm">Selected {summary.total}. Imported {summary.imported}. Already existing {summary.existing}. Failed {summary.failed}.</p>}
    </div>
  </FormDrawer>;
}

function LeadNotes({ id }) {
  const [notes, setNotes] = React.useState([]);
  const [content, setContent] = React.useState('');
  const refresh = React.useCallback(() => { loadLeadNotes(id).then(setNotes).catch(() => setNotes([])); }, [id]);
  React.useEffect(() => { refresh(); }, [refresh]);
  return <div className="space-y-2"><p className="font-medium">Notes</p>{notes.map((note) => <p key={note.id}>{note.content || note.note || note.text}</p>)}{notes.length === 0 && <p className="text-slate-500">No notes returned.</p>}<form className="flex gap-2" onSubmit={async (event) => { event.preventDefault(); await addLeadNote(id, content); setContent(''); refresh(); }}><Input value={content} onChange={(event) => setContent(event.target.value)} placeholder="Add note" /><button className="rounded-md bg-brand px-3 text-xs text-white" type="submit">Save</button></form></div>;
}

function Field({ label, children, className = '' }) { return <Label className={`grid gap-1 text-xs ${className}`}>{label}{children}</Label>; }
