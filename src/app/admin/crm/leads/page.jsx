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
import { addLeadNote, archiveLeads, bulkAssignLeads, bulkLeadPriority, bulkLeadStatus, checkLeadDuplicate, convertLead, crmError, listLeadPage, loadEmployees, loadLeadNotes, loadLeads, personName, removeLead, saveLead, sessionCan, uploadLeadImage } from '@/modules/crm/crm-api';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import { faBuilding, faEnvelope, faGlobe, faLink, faLocationDot, faPhone, faXmark } from '@fortawesome/free-solid-svg-icons';
import { faFacebook, faInstagram, faLinkedin, faPinterest, faTiktok, faWhatsapp, faXTwitter, faYoutube } from '@fortawesome/free-brands-svg-icons';
import { loadDepartments } from '@/modules/master/master-api';

const LEAD_STAGES = [
  ['NEW', 'New'],
  ['CONTACTED', 'Contacted'],
  ['CALL_BACK', 'Call Back'],
  ['DETAILS_SENT', 'Details Sent'],
  ['FOLLOW_UP', 'Follow-Up'],
  ['VISIT_SCHEDULED', 'Visit Scheduled'],
  ['VISIT_DONE', 'Visit Done'],
  ['PROPOSAL_SENT', 'Proposal Sent'],
  ['NEGOTIATION', 'Negotiation'],
  ['FINAL_CALL', 'Final Call'],
  ['WON', 'Won'],
  ['LOST', 'Lost'],
];
function stageLabel(value) {
  const key = String(value || '').toUpperCase();
  return LEAD_STAGES.find(([stage]) => stage === key)?.[1] || value || '—';
}
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
const SOURCE_OPTIONS = ['Manual', 'Google Maps', 'Google Places', 'Website', 'WhatsApp', 'Facebook', 'Instagram', 'Referral', 'Other'];
const SOCIAL_FIELDS = [
  ['instagram', 'Instagram URL', faInstagram, '#E1306C'],
  ['facebook', 'Facebook URL', faFacebook, '#1877F2'],
  ['linkedin', 'LinkedIn URL', faLinkedin, '#0A66C2'],
  ['youtube', 'YouTube URL', faYoutube, '#FF0000'],
  ['twitter', 'X / Twitter URL', faXTwitter, '#172B24'],
  ['whatsapp', 'WhatsApp Business URL', faWhatsapp, '#25D366'],
  ['tiktok', 'TikTok URL', faTiktok, '#111111'],
  ['pinterest', 'Pinterest URL', faPinterest, '#E60023'],
  ['other', 'Other social URL', faLink, '#163A2E'],
];
const blank = { leadName: '', companyName: '', phone: '', whatsapp: '', email: '', website: '', address: '', city: '', state: '', country: '', pincode: '', source: 'Manual', category: '', priority: 'MEDIUM', status: 'NEW', assignedToId: '', assignedTeam: '', value: '', notes: '', instagram: '', facebook: '', linkedin: '', youtube: '', twitter: '', whatsappUrl: '', tiktok: '', pinterest: '', other: '' };

function unwrap(payload) {
  if (payload?.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) return payload.data;
  return payload || {};
}

function filtersFrom(query) {
  return {
    leadId: typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('leadId') || undefined : undefined,
    captureJobId: query.captureJobId || (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('captureJobId') || undefined : undefined),
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
  const [canDelete, setCanDelete] = React.useState(false);
  const [sources, setSources] = React.useState([]);
  const [employees, setEmployees] = React.useState([]);
  const [departments, setDepartments] = React.useState([]);
  const [importOpen, setImportOpen] = React.useState(false);
  const [reloadKey, setReloadKey] = React.useState(0);
  React.useEffect(() => {
    setAllowed(sessionCan('LEADS') || sessionCan('CRM'));
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
        description="Create leads manually and manage existing CRM leads individually or in bulk."
        actionLabel="Add lead"
        canCreate={allowed}
        load={load}
        blank={blank}
        enableSelection
        refreshToken={reloadKey}
        toForm={(row) => ({ leadName: personName(row) === '—' ? '' : personName(row), assignedToId: row.employeeId || row.assignedToId || '', imageUrl: row.imageUrl || '', ...socialFormValues(row) })}
        stats={(result) => [
          { label: 'Total leads', value: result.metrics?.total },
          { label: 'New', value: result.metrics?.new },
          { label: 'Contacted', value: result.metrics?.contacted },
          { label: 'Qualified', value: result.metrics?.qualified },
          { label: 'Converted', value: result.metrics?.converted },
          { label: 'Lost', value: result.metrics?.lost },
        ]}
        filters={[
          { key: 'status', label: 'All stages', options: LEAD_STAGES.map(([value, label]) => ({ value, label })) },
          { key: 'priority', label: 'All priorities', options: PRIORITIES.map((item) => ({ value: item, label: item })) },
          { key: 'source', label: 'All sources', options: sourceOptions.map((item) => ({ value: item, label: item })) },
          { key: 'assignedToId', label: 'All BPO employees', options: employees.map((employee) => ({ value: String(employee.recordId), label: employee.name })) },
          { key: 'from', label: 'From', type: 'date' },
          { key: 'to', label: 'To', type: 'date' },
        ]}
        columns={[
          { header: 'Lead', className: 'min-w-0 max-w-[280px]', cell: (row) => <span className="flex min-w-0 items-center gap-2"><LeadAvatar lead={row} /><span className="min-w-0 truncate">{personName(row)}</span></span> },
          { header: 'Category', cell: (row) => row.category || '—' },
          { header: 'Company', cell: (row) => row.companyName || '—' },
          { header: 'Social Media', className: 'max-w-[190px]', cell: (row) => <SocialLinks lead={row} /> },
          { header: 'Phone', cell: (row) => row.phone || '—' },
          { header: 'Email', cell: (row) => row.email || '—' },
          { header: 'Source', cell: (row) => /google/i.test(row.source || '') ? 'Google Maps' : row.source || '—' },
          { header: 'Priority', cell: (row) => row.priority || '—' },
          { header: 'Assigned', cell: (row) => personName(row.assignedTo || row.employee) },
          { header: 'Created', cell: (row) => String(row.createdAt || '').slice(0, 10) },
          { header: 'Stage', cell: (row) => <StatusBadge status={stageLabel(row.stage?.name || row.status)} /> },
        ]}
        renderForm={(form, setForm) => <LeadForm form={form} setForm={setForm} sources={sourceOptions} employees={employees} departments={departments} />}
        onSave={async (form, id) => { await persistLead(form, id); toast.success(id ? 'Lead updated' : 'Lead created'); }}
        detail={(row) => <div className="space-y-2 text-sm"><p className="flex items-center gap-2"><LeadAvatar lead={row} /><span className="min-w-0">{personName(row)} · {row.companyName || 'No company'}</span></p><p>{row.phone || '—'} · {row.email || '—'}</p><p>{[row.address, row.city, row.state, row.country, row.pincode].filter(Boolean).join(', ') || 'No address'}</p><p>Stage {stageLabel(row.stage?.name || row.status)} · Priority {row.priority || '—'} · Source {row.source || '—'} · Value {row.value ?? '—'}</p><p>Category {row.category || '—'} · Website {row.website || '—'}</p><div className="flex items-center gap-2">Social media <SocialLinks lead={row} /></div><p>Department {row.assignedTeam || '—'} · Google Place ID {row.googlePlaceId || '—'}</p><LeadNotes id={row.id} /></div>}
        toolbar={({ query, selected, reload, payload }) => <BulkBar query={query} selected={selected} total={payload.pagination?.total} reload={reload} employees={employees} departments={departments} canDelete={canDelete} />}
        rowActions={(reload) => allowed ? [
          { label: 'Convert', onSelect: async (row) => { try { await convertLead(row.id, { companyName: row.companyName, dealTitle: row.title || row.companyName }); reload((value) => value + 1); toast.success('Lead conversion requested'); } catch (err) { toast.error(crmError(err)); } } },
          { label: 'Delete', onSelect: async (row) => { try { await removeLead(row.id); reload((value) => value + 1); toast.success('Lead archived'); } catch (err) { toast.error(crmError(err)); } } },
        ] : []}
        below={() => <p className="text-xs text-[#718078]">Tags are not stored on the lead record. Department is saved as the assigned team name.</p>}
      />
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
  const socialMedia = socialPayload(form);
  const { imageFile, imagePreview, instagram, facebook, linkedin, youtube, twitter, whatsappUrl, tiktok, pinterest, other, ...leadValues } = form;
  const values = { ...leadValues, ...name, socialMedia, source: form.source === 'Google Places' ? 'GOOGLE_PLACES' : form.source };
  if (!id) {
    const duplicate = unwrap(await checkLeadDuplicate(values));
    if (duplicate.isDuplicate) throw new Error(duplicate.matchReason || 'A matching lead already exists.');
  }
  const saved = unwrap(await saveLead(values, id));
  const leadId = id || saved.id;
  if (leadId && form.imageFile instanceof File) await uploadLeadImage(leadId, form.imageFile);
  if (leadId && form.notes) await addLeadNote(leadId, form.notes);
  if (leadId && form.whatsapp && form.whatsapp !== form.phone) await addLeadNote(leadId, `WhatsApp: ${form.whatsapp}`);
}

function LeadForm({ form, setForm, sources, employees, departments }) {
  const set = (key) => (event) => setForm({ ...form, [key]: event.target.value });
  return <div className="grid gap-3 sm:grid-cols-2">
    <Field label="Business image" className="sm:col-span-2"><div className="flex items-center gap-3"><LeadAvatar lead={{ ...form, imageUrl: form.imagePreview || form.imageUrl }} /><input type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" onChange={(event) => { const file = event.target.files?.[0]; if (!file) return; if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { toast.error('Use a JPG, PNG, or WebP image.'); event.target.value = ''; return; } if (file.size > 10 * 1024 * 1024) { toast.error('Image must be 10 MB or smaller.'); event.target.value = ''; return; } setForm({ ...form, imageFile: file, imagePreview: URL.createObjectURL(file) }); }} /></div></Field>
    <Field label="Lead name"><Input required value={form.leadName || ''} onChange={set('leadName')} /></Field>
    <Field label="Company name"><Input value={form.companyName || ''} onChange={set('companyName')} /></Field>
    <Field label="Mobile number"><Input value={form.phone || ''} onChange={set('phone')} /></Field>
    <Field label="WhatsApp number"><Input value={form.whatsapp || ''} onChange={set('whatsapp')} /></Field>
    <Field label="Email"><Input type="email" value={form.email || ''} onChange={set('email')} /></Field>
    <Field label="Website"><Input value={form.website || ''} onChange={set('website')} /></Field>
    <p className="sm:col-span-2 pt-1 text-xs font-semibold text-[#163A2E]">Social media</p>
    {SOCIAL_FIELDS.map(([key, label]) => <Field key={key} label={label}><Input type="url" inputMode="url" placeholder="https://" value={form[key === 'whatsapp' ? 'whatsappUrl' : key] || ''} onChange={set(key === 'whatsapp' ? 'whatsappUrl' : key)} /></Field>)}
    <Field label="Business address" className="sm:col-span-2"><Input value={form.address || ''} onChange={set('address')} /></Field>
    <Field label="City"><Input value={form.city || ''} onChange={set('city')} /></Field>
    <Field label="State"><Input value={form.state || ''} onChange={set('state')} /></Field>
    <Field label="Country"><Input value={form.country || ''} onChange={set('country')} /></Field>
    <Field label="Pincode"><Input value={form.pincode || ''} onChange={set('pincode')} /></Field>
    <Field label="Lead source"><select className="h-9 rounded-md border px-2 text-sm" value={form.source || 'Manual'} onChange={set('source')}>{sources.map((source) => <option key={source}>{source}</option>)}</select></Field>
    <Field label="Lead category"><Input value={form.category || ''} onChange={set('category')} /></Field>
    <Field label="Priority"><select className="h-9 rounded-md border px-2 text-sm" value={form.priority || 'MEDIUM'} onChange={set('priority')}>{PRIORITIES.map((item) => <option key={item}>{item}</option>)}</select></Field>
    <Field label="Lead stage"><select className="h-9 rounded-md border px-2 text-sm" value={form.status || 'NEW'} onChange={set('status')}>{LEAD_STAGES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
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
        <select aria-label="Lead stage" className="h-8 rounded-md border bg-white px-2 text-xs" value={status} onChange={(event) => setStatus(event.target.value)}>{LEAD_STAGES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
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

function leadInitials(name) {
  const words = String(name || '').trim().split(/\s+/).flatMap((word) => {
    if (word.endsWith(':')) return [];
    const cleaned = word.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');
    return cleaned ? [cleaned] : [];
  });
  if (!words.length) return '';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

function leadImageUrl(lead) {
  const nested = Array.isArray(lead?.images) ? lead.images.find((image) => /^https?:\/\//i.test(image?.url || ''))?.url : '';
  const candidates = [lead?.imagePreview, lead?.imageUrl, nested];
  return candidates.find((value) => typeof value === 'string' && (/^https?:\/\//i.test(value) || value.startsWith('blob:'))) || '';
}

function safeProfileUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const withScheme = /^https?:\/\//i.test(raw) ? raw : (/^[\w.-]+\.[a-z]{2,}([/:?#].*)?$/i.test(raw) ? `https://${raw}` : '');
  if (!withScheme) return '';
  try {
    const url = new URL(withScheme);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : '';
  } catch {
    return '';
  }
}

function socialFormValues(row) {
  const social = row?.socialMedia && typeof row.socialMedia === 'object' ? row.socialMedia : {};
  return {
    instagram: social.instagram || '',
    facebook: social.facebook || '',
    linkedin: social.linkedin || '',
    youtube: social.youtube || '',
    twitter: social.twitter || '',
    whatsappUrl: social.whatsapp || '',
    tiktok: social.tiktok || '',
    pinterest: social.pinterest || '',
    other: social.other || '',
  };
}

function socialPayload(form) {
  const entries = [
    ['instagram', form.instagram],
    ['facebook', form.facebook],
    ['linkedin', form.linkedin],
    ['youtube', form.youtube],
    ['twitter', form.twitter],
    ['whatsapp', form.whatsappUrl],
    ['tiktok', form.tiktok],
    ['pinterest', form.pinterest],
    ['other', form.other],
  ];
  const payload = {};
  for (const [key, value] of entries) {
    const raw = String(value || '').trim();
    if (!raw) {
      payload[key] = '';
      continue;
    }
    const safe = safeProfileUrl(raw);
    if (!safe) throw new Error(`Enter a valid ${key} URL starting with http:// or https://.`);
    payload[key] = safe;
  }
  return payload;
}

function SocialLinks({ lead }) {
  const social = lead?.socialMedia && typeof lead.socialMedia === 'object' ? lead.socialMedia : {};
  const links = SOCIAL_FIELDS.flatMap(([key, label, icon, color]) => {
    const href = safeProfileUrl(social[key]);
    return href ? [{ key, label: label.replace(' URL', ''), href, icon, color }] : [];
  });
  if (!links.length) return <span className="text-[#718078]">Not Available</span>;
  return <div className="flex max-w-[168px] items-center gap-1 overflow-x-auto">{links.map((link) => <a key={link.key} href={link.href} target="_blank" rel="noopener noreferrer" title={link.label} aria-label={link.label} className="inline-flex size-7 shrink-0 items-center justify-center rounded-md border border-[#E2E8E5] bg-white" style={{ color: link.color }}><FontAwesomeIcon icon={link.icon} className="size-3.5" /></a>)}</div>;
}

function LeadAvatar({ lead }) {
  const [failed, setFailed] = React.useState(false);
  const src = failed ? '' : leadImageUrl(lead);
  const displayName = personName(lead);
  const initials = leadInitials(displayName === '—' ? '' : displayName);
  React.useEffect(() => { setFailed(false); }, [lead?.imageUrl, lead?.imagePreview]);
  const frame = 'inline-flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#E2E8E5] bg-[#E8F1EC] align-middle';
  if (!src) {
    return <span className={`${frame} text-xs font-bold leading-none text-[#163A2E]`} aria-hidden="true">{initials || <FontAwesomeIcon icon={faBuilding} className="size-4" />}</span>;
  }
  return <img src={src} alt="" width={40} height={40} className={`${frame} object-cover`} onError={() => setFailed(true)} />;
}
