'use client';

import * as React from 'react';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { toast } from '@/hooks/use-toast';
import { CrmScreen } from '@/modules/crm/CrmScreen';
import { loadEmployees, loadLeads, logFollowUp, personName, sessionCan } from '@/modules/crm/crm-api';

function dayOf(value) {
  return value ? String(value).slice(0, 10) : '';
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function followUpState(row) {
  const next = dayOf(row.nextFollowUpDate);
  if (!next && row.latestFollowUp) return 'completed';
  if (!next) return 'unscheduled';
  if (next < today()) return 'overdue';
  if (next === today()) return 'today';
  return 'upcoming';
}

function NextDate({ row }) {
  const state = followUpState(row);
  if (state === 'unscheduled' || state === 'completed') return <span className="text-[#718078]">Not Scheduled</span>;
  if (state === 'overdue') return <span className="inline-flex rounded-full border border-[#DC2626] bg-[#FEF2F2] px-2 py-0.5 text-xs font-medium text-[#DC2626]">{dayOf(row.nextFollowUpDate)} · Overdue</span>;
  if (state === 'today') return <span className="inline-flex rounded-full border border-[#163A2E] bg-[#E8F1EC] px-2 py-0.5 text-xs font-medium text-[#163A2E]">{dayOf(row.nextFollowUpDate)} · Today</span>;
  return <span className="inline-flex rounded-full border border-[#BAE6FD] bg-[#E0F2FE] px-2 py-0.5 text-xs text-[#0369A1]">{dayOf(row.nextFollowUpDate)}</span>;
}

export default function FollowUpsRoute() {
  const [allowed, setAllowed] = React.useState(false);
  const [employees, setEmployees] = React.useState([]);
  const [leads, setLeads] = React.useState([]);
  React.useEffect(() => {
    setAllowed(sessionCan('LEADS') || sessionCan('CRM'));
    loadEmployees({ bpoOnly: true }).then(setEmployees).catch(() => setEmployees([]));
  }, []);
  const load = React.useCallback(async (query) => {
    const result = await loadLeads({ page: query.page, limit: 100, search: query.search || undefined, assignedToId: query.assignedToId || undefined, followUps: true });
    setLeads(result.rows);
    const selectedDay = query.followUpDate || '';
    const rows = result.rows.filter((lead) => {
      const state = followUpState(lead);
      if (query.bucket === 'today' && state !== 'today') return false;
      if (query.bucket === 'upcoming' && state !== 'upcoming' && state !== 'today') return false;
      if (query.bucket === 'overdue' && state !== 'overdue') return false;
      if (query.bucket === 'completed' && state !== 'completed') return false;
      if (query.leadId && String(lead.id) !== String(query.leadId)) return false;
      if (selectedDay && dayOf(lead.nextFollowUpDate) !== selectedDay) return false;
      return true;
    });
    return { ...result, rows };
  }, []);
  return <CrmScreen title="Follow-ups" description="Scheduled lead follow-ups. Completed calls stay in history and are not treated as the next follow-up." actionLabel="Log follow-up" canCreate={allowed} load={load} blank={{ leadId: '', outcome: '', notes: '', nextFollowUpDate: '', nextFollowUpTime: '' }}
    filters={[
      { key: 'bucket', label: 'All follow-ups', options: [{ value: 'today', label: 'Today' }, { value: 'upcoming', label: 'Upcoming' }, { value: 'overdue', label: 'Overdue' }, { value: 'completed', label: 'Completed' }] },
      { key: 'leadId', label: 'All leads', options: leads.map((lead) => ({ value: String(lead.id), label: personName(lead) })) },
      { key: 'assignedToId', label: 'All employees', options: employees.filter((employee) => employee.userId).map((employee) => ({ value: String(employee.userId), label: employee.name })) },
      { key: 'followUpDate', label: 'Follow-up date', type: 'date' },
    ]}
    columns={[
      { header: 'Lead Name', cell: (row) => personName(row) },
      { header: 'Company Name', cell: (row) => row.companyName || '—' },
      { header: 'Mobile Number', cell: (row) => row.phone || '—' },
      { header: 'Follow-up Date', cell: (row) => dayOf(row.latestFollowUp?.createdAt) || dayOf(row.nextFollowUpDate) || '—' },
      { header: 'Follow-up Time', cell: (row) => row.nextFollowUpTime || row.latestFollowUp?.nextFollowUpTime || '—' },
      { header: 'Follow-up Type', cell: () => 'Call' },
      { header: 'Follow-up Notes', cell: (row) => row.latestFollowUp?.notes || '—' },
      { header: 'Follow-up Outcome', cell: (row) => row.latestFollowUp?.outcome || '—' },
      { header: 'Assigned Employee', cell: (row) => personName(row.assignedTo || row.employee) },
      { header: 'Lead Status', cell: (row) => <StatusBadge status={row.stage?.name || row.status} /> },
      { header: 'Deal Stage', cell: (row) => row.deal?.stage ? <span className={`inline-flex rounded-full px-2 py-0.5 text-xs ${row.deal.stage === 'Final Call' ? 'border border-[#C2410C] bg-[#FFF7ED] text-[#C2410C]' : 'border border-[#E2E8E5] bg-white'}`}>{row.deal.stage}</span> : '—' },
      { header: 'Next Follow-up Date', cell: (row) => <NextDate row={row} /> },
    ]}
    renderForm={(form, setForm) => <FollowUpForm form={form} setForm={setForm} leads={leads} />}
    onSave={async (form) => { await logFollowUp(form.leadId, { outcome: form.outcome, notes: form.notes, nextFollowUpDate: form.nextFollowUpDate || undefined, nextFollowUpTime: form.nextFollowUpTime || undefined }); toast.success('Follow-up logged'); }}
    detail={(row) => <div className="space-y-2 text-sm"><p className="font-semibold">{personName(row)} · {row.companyName || 'No company'}</p><p>{row.phone || 'No mobile'} · {row.email || 'No email'}</p><p>Outcome: {row.latestFollowUp?.outcome || 'Not recorded'}</p><p>Notes: {row.latestFollowUp?.notes || '—'}</p><p>Next follow-up: {row.nextFollowUpDate ? `${dayOf(row.nextFollowUpDate)} ${row.nextFollowUpTime || ''}` : 'Not Scheduled'}</p><p>Deal: {row.deal?.title || 'No deal'} · {row.deal?.stage || '—'}</p></div>}
  />;
}

function FollowUpForm({ form, setForm, leads }) {
  return <div className="grid gap-3"><Field label="Lead"><select className="h-9 rounded-md border px-2 text-sm" value={form.leadId || ''} onChange={(event) => setForm({ ...form, leadId: event.target.value })}><option value="">Select lead</option>{leads.map((lead) => <option key={lead.id} value={lead.id}>{personName(lead)} · {lead.companyName || 'No company'}</option>)}</select></Field><Field label="Outcome"><Input required value={form.outcome || ''} onChange={(event) => setForm({ ...form, outcome: event.target.value })} /></Field><Field label="Next follow-up date"><Input type="date" value={form.nextFollowUpDate || ''} onChange={(event) => setForm({ ...form, nextFollowUpDate: event.target.value })} /></Field><Field label="Time"><Input value={form.nextFollowUpTime || ''} onChange={(event) => setForm({ ...form, nextFollowUpTime: event.target.value })} /></Field><Field label="Notes"><Input value={form.notes || ''} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></Field></div>;
}

function Field({ label, children }) { return <Label className="grid gap-1 text-xs">{label}{children}</Label>; }
