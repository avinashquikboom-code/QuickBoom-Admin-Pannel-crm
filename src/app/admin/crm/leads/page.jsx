'use client';

import * as React from 'react';
import { stageLabel, PRIORITIES, SOURCE_OPTIONS, blank, unwrap, persistLead, LeadForm, Field, socialFormValues, SocialLinks, LeadAvatar } from '@/modules/crm/ManualLeadDrawer';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { Button } from '@/components/common/Button';
import { FormDrawer } from '@/components/common/drawers/FormDrawer';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { AdminBulkActions, AdminBulkSelectionToolbar, AdminSelectCheckbox, AdminSelectionSummary } from '@/components/admin/bulk-selection';
import { toast } from '@/hooks/use-toast';
import { CrmScreen } from '@/modules/crm/CrmScreen';
import { addLeadNote, archiveLeads, bulkAssignLeads, bulkLeadPriority, bulkLeadStatus, checkLeadDuplicate, convertLead, crmError, listLeadPage, loadEmployees, loadLeadNotes, loadLeadStages, loadLeads, personName, removeLead, saveLead, sessionCan, uploadLeadImage } from '@/modules/crm/crm-api';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import { faBuilding, faEnvelope, faGlobe, faLink, faLocationDot, faPhone, faXmark } from '@fortawesome/free-solid-svg-icons';
import { faFacebook, faInstagram, faLinkedin, faPinterest, faTiktok, faWhatsapp, faXTwitter, faYoutube } from '@fortawesome/free-brands-svg-icons';
import { loadDepartments } from '@/modules/master/master-api';

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
  const [stages, setStages] = React.useState([]);
  const [importOpen, setImportOpen] = React.useState(false);
  const [reloadKey, setReloadKey] = React.useState(0);
  React.useEffect(() => {
    setAllowed(sessionCan('LEADS') || sessionCan('CRM'));
    setCanDelete(sessionCan('LEADS') || sessionCan('CRM'));
    loadEmployees({ bpoOnly: true }).then(setEmployees).catch(() => setEmployees([]));
    loadDepartments().then(setDepartments).catch(() => setDepartments([]));
    loadLeadStages().then(setStages).catch(() => setStages([]));
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
        canCreate={false}
        load={load}
        blank={blank}
        enableSelection
        refreshToken={reloadKey}
        toForm={(row) => ({ leadName: personName(row) === '—' ? '' : personName(row), assignedToId: row.employeeId || row.assignedToId || '', imageUrl: row.imageUrl || '', ...socialFormValues(row) })}
        stats={(result) => [
          { label: 'Total leads', value: result.metrics?.total },
          ...stages.filter((stage) => stage.isActive !== false).map((stage) => ({ label: stage.name, value: stage.leadsCount ?? 0 })),
        ]}
        filters={[
          { key: 'status', label: 'All stages', options: stages.filter((stage) => stage.isActive !== false).map((stage) => ({ value: stage.key, label: stage.name })) },
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
          { header: 'Stage', cell: (row) => { const match = stages.find((stage) => String(stage.id) === String(row.stageId) || stage.key === row.status || stage.name === row.stage?.name); const name = row.stage?.name || match?.name || stageLabel(row.status, stages); const color = row.stage?.color || match?.color; return <span className="inline-flex rounded-full border border-[#E2E8E5] bg-[#F7F9F8] px-2 py-0.5 text-xs font-medium" style={color ? { color, borderColor: color } : undefined}>{name}</span>; } },
        ]}
        renderForm={(form, setForm) => <LeadForm form={form} setForm={setForm} sources={sourceOptions} employees={employees} departments={departments} stages={stages} />}
        onSave={async (form, id) => { await persistLead(form, id); toast.success(id ? 'Lead updated' : 'Lead created'); }}
        detail={(row) => <div className="space-y-2 text-sm"><p className="flex items-center gap-2"><LeadAvatar lead={row} /><span className="min-w-0">{personName(row)} · {row.companyName || 'No company'}</span></p><p>{row.phone || '—'} · {row.email || '—'}</p><p>{[row.address, row.city, row.state, row.country, row.pincode].filter(Boolean).join(', ') || 'No address'}</p><p>Stage {stageLabel(row.stage?.name || row.status, stages)} · Priority {row.priority || '—'} · Source {row.source || '—'} · Value {row.value ?? '—'}</p><p>Category {row.category || '—'} · Website {row.website || '—'}</p><div className="flex items-center gap-2">Social media <SocialLinks lead={row} /></div><p>Department {row.assignedTeam || '—'} · Google Place ID {row.googlePlaceId || '—'}</p><LeadNotes id={row.id} /></div>}
        toolbar={({ query, selected, reload, payload }) => <BulkBar query={query} selected={selected} total={payload.pagination?.total} reload={reload} employees={employees} departments={departments} stages={stages} canDelete={canDelete} />}
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

function BulkBar({ query, selected, total, reload, employees, departments, stages = [], canDelete }) {
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
        <select aria-label="Lead stage" className="h-8 rounded-md border bg-white px-2 text-xs" value={status} onChange={(event) => setStatus(event.target.value)}>{stages.filter((stage) => stage.isActive !== false).map((stage) => <option key={stage.id || stage.key} value={stage.key}>{stage.name}</option>)}</select>
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
