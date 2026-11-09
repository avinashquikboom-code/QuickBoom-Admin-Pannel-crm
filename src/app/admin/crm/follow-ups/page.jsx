'use client';

import * as React from 'react';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { toast } from '@/hooks/use-toast';
import { CrmScreen } from '@/modules/crm/CrmScreen';
import { crmGaps, loadLeads, logFollowUp, personName, sessionCan } from '@/modules/crm/crm-api';

export default function FollowUpsRoute() {
  const [allowed, setAllowed] = React.useState(false);
  const [leads, setLeads] = React.useState([]);
  React.useEffect(() => setAllowed(sessionCan('LEADS') || sessionCan('CRM')), []);
  const load = React.useCallback(async (query) => {
    const result = await loadLeads({ page: query.page, limit: 100, search: query.search || undefined, status: query.status || undefined });
    setLeads(result.rows);
    const today = new Date().toISOString().slice(0, 10);
    const rows = result.rows.filter((lead) => lead.nextFollowUpDate).filter((lead) => {
      const date = String(lead.nextFollowUpDate).slice(0, 10);
      if (query.bucket === 'overdue') return date < today;
      if (query.bucket === 'pending') return date >= today;
      return true;
    });
    return { ...result, rows };
  }, []);
  return <CrmScreen title="Follow-ups" description="Next follow-up dates stored on leads." actionLabel="Log follow-up" canCreate={allowed} load={load} blank={{ leadId: '', outcome: 'Follow-up Required', notes: '', nextFollowUpDate: '', nextFollowUpTime: '' }}
    gap={{ title: 'Follow-up records', detail: crmGaps.followUps }}
    filters={[{ key: 'bucket', label: 'All dates', options: [{ value: 'pending', label: 'Pending' }, { value: 'overdue', label: 'Overdue' }] }]}
    below={(rows) => <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">{rows.slice(0, 14).map((row) => <div key={row.id} className="rounded-lg border bg-white p-2 text-xs"><p>{String(row.nextFollowUpDate).slice(0, 10)}</p><p className="font-medium">{personName(row)}</p></div>)}</div>}
    columns={[{ header: 'Lead', cell: (row) => personName(row) }, { header: 'Company', cell: (row) => row.companyName || '—' }, { header: 'Date', cell: (row) => String(row.nextFollowUpDate || '').slice(0, 10) }, { header: 'Time', cell: (row) => row.nextFollowUpTime || '—' }, { header: 'Assigned', cell: (row) => personName(row.assignedTo || row.employee) }, { header: 'Status', cell: (row) => <StatusBadge status={String(row.status || '').toLowerCase()} /> }]}
    renderForm={(form, setForm) => <div className="grid gap-3"><Field label="Lead"><select className="h-9 rounded-md border px-2 text-sm" value={form.leadId || ''} onChange={(event) => setForm({ ...form, leadId: event.target.value })}>{leads.map((lead) => <option key={lead.id} value={lead.id}>{personName(lead)}</option>)}</select></Field><Field label="Outcome"><Input required value={form.outcome || ''} onChange={(event) => setForm({ ...form, outcome: event.target.value })} /></Field><Field label="Date"><Input type="date" value={form.nextFollowUpDate || ''} onChange={(event) => setForm({ ...form, nextFollowUpDate: event.target.value })} /></Field><Field label="Time"><Input value={form.nextFollowUpTime || ''} onChange={(event) => setForm({ ...form, nextFollowUpTime: event.target.value })} /></Field><Field label="Notes"><Input value={form.notes || ''} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></Field></div>}
    onSave={async (form) => { await logFollowUp(form.leadId, { outcome: form.outcome, notes: form.notes, nextFollowUpDate: form.nextFollowUpDate, nextFollowUpTime: form.nextFollowUpTime }); toast.success('Follow-up logged'); }}
  />;
}

function Field({ label, children }) { return <Label className="grid gap-1 text-xs">{label}{children}</Label>; }
