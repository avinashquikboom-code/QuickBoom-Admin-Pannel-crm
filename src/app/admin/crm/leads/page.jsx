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
import { addLeadNote, archiveLeads, bulkAssignLeads, bulkLeadPriority, bulkLeadStatus, checkLeadDuplicate, convertLead, crmError, importGooglePlaces, listLeadPage, loadCapturedPlace, loadEmployees, loadLeadNotes, loadLeads, personName, removeLead, saveLead, searchGooglePlaces, sessionCan } from '@/modules/crm/crm-api';
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
    loadEmployees().then(setEmployees).catch(() => setEmployees([]));
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
          <Button variant="outline" onClick={() => setImportOpen(true)}>Bulk import</Button>
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
          { key: 'assignedToId', label: 'All employees', options: employees.map((employee) => ({ value: String(employee.recordId), label: employee.name })) },
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
    <Field label="Assigned department"><select className="h-9 rounded-md border px-2 text-sm" value={form.assignedTeam || ''} onChange={set('assignedTeam')}><option value="">None</option>{departments.map((department) => <option key={department.id} value={department.name}>{department.name}</option>)}</select></Field>
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

function GooglePlacesPanel({ open, onOpenChange, onImported }) {
  const [form, setForm] = React.useState({ category: '', location: '', city: '', state: '', country: '', radius: '5000' });
  const [places, setPlaces] = React.useState([]);
  const [jobId, setJobId] = React.useState('');
  const [selected, setSelected] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [detail, setDetail] = React.useState(null);
  const [preview, setPreview] = React.useState(false);
  const [limit, setLimit] = React.useState(20);
  const search = async (nextLimit = limit) => {
    if (!form.category && !form.location && !form.city) { toast.error('Enter a category or a location.'); return; }
    setLoading(true);
    try {
      const location = [form.location, form.city, form.radius ? `within ${Number(form.radius) / 1000} km` : ''].filter(Boolean).join(', ');
      const result = unwrap(await searchGooglePlaces({ ...form, keyword: form.category, location, maxResults: nextLimit }));
      setPlaces(result.places || result.records || []);
      setJobId(result.jobId || '');
      setLimit(nextLimit);
      setSelected([]);
    } catch (err) {
      toast.error(crmError(err));
    } finally {
      setLoading(false);
    }
  };
  const toggle = (place) => {
    const id = place.googlePlaceId;
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };
  const importSelected = async (ids) => {
    try {
      const result = unwrap(await importGooglePlaces(ids, jobId));
      toast.success(`Imported ${result.imported ?? 0}. Already existing ${result.skippedDuplicates ?? 0}. Failed ${result.failed ?? 0}.`);
      setPreview(false);
      onImported?.();
    } catch (err) {
      toast.error(crmError(err));
    }
  };
  return <FormDrawer open={open} onOpenChange={onOpenChange} title="Find leads from Google" description="Discovery results stay out of the CRM until you import them. Data from Google Maps Platform." size="xl" showFooter={false}>
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Input aria-label="Business category" placeholder="Category or keyword" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} />
        <Input aria-label="Location" placeholder="Location" value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} />
        <Input aria-label="City" placeholder="City" value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} />
        <select aria-label="Radius" className="h-9 rounded-md border px-2 text-sm" value={form.radius} onChange={(event) => setForm({ ...form, radius: event.target.value })}>{[1000, 5000, 10000, 20000, 50000].map((radius) => <option key={radius} value={radius}>{radius / 1000} km</option>)}</select>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <Input aria-label="State" placeholder="State" value={form.state} onChange={(event) => setForm({ ...form, state: event.target.value })} />
        <Input aria-label="Country" placeholder="Country" value={form.country} onChange={(event) => setForm({ ...form, country: event.target.value })} />
      </div>
      <Button onClick={() => search(20)} disabled={loading}>{loading ? 'Searching' : 'Search'}</Button>
      <AdminSelectionSummary count={selected.length} noun="businesses" onClear={() => setSelected([])} />
      <div className="grid gap-3">
        {places.map((place) => <article key={place.id || place.googlePlaceId} className="rounded-xl border border-[#E2E8E5] p-3 text-sm">
          <div className="flex items-start gap-3">
            <AdminSelectCheckbox checked={selected.includes(place.googlePlaceId)} disabled={!place.googlePlaceId || place.isImported} onChange={() => toggle(place)} label={`Select ${place.businessName}`} />
            <div className="min-w-0 flex-1">
              <p className="font-medium text-[#172B24]">{place.businessName}</p>
              <p className="text-[#718078]">{place.category || '—'} · {place.phone || 'No phone'} · {place.website || 'No website'}</p>
              <p>{place.address || 'No address'} · Rating {place.rating ?? '—'} ({place.reviewCount ?? 0})</p>
              <p className="truncate text-xs text-[#718078]">Place ID {place.googlePlaceId || '—'} {place.isImported ? '· Already in CRM' : ''}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={async () => { try { setDetail(unwrap(await loadCapturedPlace(place.id))); } catch (err) { toast.error(crmError(err)); } }}>Details</Button>
                <Button size="sm" disabled={!place.googlePlaceId || place.isImported} onClick={() => importSelected([place.googlePlaceId])}>Add to CRM</Button>
              </div>
            </div>
          </div>
        </article>)}
      </div>
      {places.length > 0 && limit < 60 && <Button variant="outline" onClick={() => search(Math.min(limit + 20, 60))}>Load more</Button>}
      {selected.length > 0 && <div className="flex gap-2"><Button onClick={() => setPreview(true)}>Import selected</Button><Button variant="outline" onClick={() => setSelected([])}>Clear selection</Button></div>}
      <p className="text-xs text-[#718078]">Powered by Google. Phone, website, and email are saved as CRM contact fields only when Google returns them.</p>
      {detail && <div className="rounded-xl border p-3 text-sm"><p className="font-medium">{detail.businessName}</p><p>{detail.address}</p><p>{detail.phone || 'No phone'} · {detail.website || 'No website'}</p><p>{detail.googleMapsUrl ? <a className="text-[#163A2E] underline" href={detail.googleMapsUrl} target="_blank" rel="noreferrer">Open in Google Maps</a> : 'No map link'}</p></div>}
      <ConfirmDialog open={preview} onOpenChange={setPreview} title="Import selected businesses" description={`${selected.length} businesses will be checked against existing leads by Google Place ID, phone, and contact details.`} confirmLabel="Import" onConfirm={() => importSelected(selected)} />
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
