'use client';

import * as React from 'react';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { toast } from '@/hooks/use-toast';
import { CrmScreen } from '@/modules/crm/CrmScreen';
import { addLeadNote, convertLead, crmError, crmGaps, loadLeadNotes, loadLeads, personName, removeLead, saveLead, sessionCan } from '@/modules/crm/crm-api';

const blank = { firstName: '', lastName: '', email: '', phone: '', companyName: '', source: '', status: 'NEW', priority: 'MEDIUM', assignedToId: '' };
const STATUSES = ['NEW', 'CONTACTED', 'QUALIFIED', 'FOLLOW_UP', 'NEGOTIATION', 'WON', 'LOST', 'CONVERTED'];

export default function LeadsRoute() {
  const [allowed, setAllowed] = React.useState(false);
  const [sources, setSources] = React.useState([]);
  React.useEffect(() => { setAllowed(sessionCan('LEADS') || sessionCan('CRM')); }, []);
  const load = React.useCallback(async (query) => {
    const result = await loadLeads({ page: query.page, limit: 20, search: query.search || undefined, status: query.status || undefined });
    setSources(result.sources);
    return result;
  }, []);
  return (
    <CrmScreen
      title="Leads"
      description="Leads from the tenant lead API, including assignment, status, and conversion."
      actionLabel="Add lead"
      canCreate={allowed}
      load={load}
      blank={blank}
      gap={{ title: 'Import and export', detail: crmGaps.leadImport }}
      stats={(result) => [
        { label: 'Total', value: result.metrics?.total },
        { label: 'New', value: result.metrics?.new },
        { label: 'Converted', value: result.metrics?.converted },
        { label: 'Lost', value: result.metrics?.lost },
      ]}
      filters={[{ key: 'status', label: 'All statuses', options: STATUSES.map((status) => ({ value: status, label: status })) }]}
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
      renderForm={(form, setForm) => <div className="grid gap-3 sm:grid-cols-2">
        <Field label="First name"><Input required value={form.firstName || ''} onChange={(event) => setForm({ ...form, firstName: event.target.value })} /></Field>
        <Field label="Last name"><Input value={form.lastName || ''} onChange={(event) => setForm({ ...form, lastName: event.target.value })} /></Field>
        <Field label="Phone"><Input value={form.phone || ''} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></Field>
        <Field label="Email"><Input type="email" value={form.email || ''} onChange={(event) => setForm({ ...form, email: event.target.value })} /></Field>
        <Field label="Company"><Input value={form.companyName || ''} onChange={(event) => setForm({ ...form, companyName: event.target.value })} /></Field>
        <Field label="Source"><Input list="lead-sources" value={form.source || ''} onChange={(event) => setForm({ ...form, source: event.target.value })} /><datalist id="lead-sources">{sources.map((source) => <option key={source.id || source.code} value={source.name || source.code} />)}</datalist></Field>
        <Field label="Status"><select className="h-9 rounded-md border px-2 text-sm" value={form.status || 'NEW'} onChange={(event) => setForm({ ...form, status: event.target.value })}>{STATUSES.map((status) => <option key={status}>{status}</option>)}</select></Field>
        <Field label="Priority"><select className="h-9 rounded-md border px-2 text-sm" value={form.priority || 'MEDIUM'} onChange={(event) => setForm({ ...form, priority: event.target.value })}>{['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map((item) => <option key={item}>{item}</option>)}</select></Field>
        <Field label="Assigned user id"><Input value={form.assignedToId || ''} onChange={(event) => setForm({ ...form, assignedToId: event.target.value })} placeholder="User id from the lead API" /></Field>
      </div>}
      onSave={async (form, id) => { await saveLead(form, id); toast.success(id ? 'Lead updated' : 'Lead created'); }}
      detail={(row) => <div className="space-y-2 text-sm"><p>{personName(row)} · {row.companyName || 'No company'}</p><p>{row.phone || '—'} · {row.email || '—'}</p><p>Status {row.status} · Priority {row.priority || '—'} · Source {row.source || '—'}</p><p>Next follow-up {String(row.nextFollowUpDate || '—').slice(0, 10)} {row.nextFollowUpTime || ''}</p><LeadNotes id={row.id} /></div>}
      rowActions={(reload) => allowed ? [
        { label: 'Convert', onSelect: async (row) => { try { await convertLead(row.id, { companyName: row.companyName, dealTitle: row.title || row.companyName }); reload((value) => value + 1); toast.success('Lead conversion requested'); } catch (err) { toast.error(crmError(err)); } } },
        { label: 'Delete', onSelect: async (row) => { try { await removeLead(row.id); reload((value) => value + 1); } catch (err) { toast.error(crmError(err)); } } },
      ] : []}
    />
  );
}

function LeadNotes({ id }) {
  const [notes, setNotes] = React.useState([]);
  const [content, setContent] = React.useState('');
  const refresh = React.useCallback(() => { loadLeadNotes(id).then(setNotes).catch(() => setNotes([])); }, [id]);
  React.useEffect(() => { refresh(); }, [refresh]);
  return <div className="space-y-2"><p className="font-medium">Notes</p>{notes.map((note) => <p key={note.id}>{note.content || note.note || note.text}</p>)}{notes.length === 0 && <p className="text-slate-500">No notes returned.</p>}<form className="flex gap-2" onSubmit={async (event) => { event.preventDefault(); await addLeadNote(id, content); setContent(''); refresh(); }}><Input value={content} onChange={(event) => setContent(event.target.value)} placeholder="Add note" /><button className="rounded-md bg-brand px-3 text-xs text-white" type="submit">Save</button></form></div>;
}

function Field({ label, children }) { return <Label className="grid gap-1 text-xs">{label}{children}</Label>; }
