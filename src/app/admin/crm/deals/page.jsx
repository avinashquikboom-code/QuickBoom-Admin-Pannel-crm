'use client';

import * as React from 'react';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { Button } from '@/components/common/Button';
import { toast } from '@/hooks/use-toast';
import { CrmScreen } from '@/modules/crm/CrmScreen';
import { crmError, loadDeals, loadEmployees, moveDealStage, personName, removeDeal, saveDeal, sessionCan } from '@/modules/crm/crm-api';

const blank = { title: '', amount: '', leadId: '', contactId: '', companyId: '', assignedToId: '', expectedClosing: '', probability: '', currency: 'INR', description: '', notes: '' };
const STAGE_ORDER = ['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Final Call', 'Won', 'Lost'];
const inr = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value) || 0);

function leadName(lead) {
  if (!lead) return '—';
  const name = `${lead.firstName || ''} ${lead.lastName || ''}`.trim();
  return name || lead.title || '—';
}

function dateLabel(value) {
  if (!value) return 'Not Scheduled';
  const day = String(value).slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);
  if (day < today) return `${day} · Overdue`;
  return day;
}

function StageBadge({ name, won, lost }) {
  if (won || name === 'Won') return <StatusBadge status="won" />;
  if (lost || name === 'Lost') return <StatusBadge status="lost" />;
  if (name === 'Final Call') return <span className="inline-flex rounded-full border border-[#C2410C] bg-[#FFF7ED] px-2.5 py-0.5 text-xs font-medium text-[#C2410C]">Final Call</span>;
  return <span className="inline-flex rounded-full border border-[#E2E8E5] bg-[#F7F9F8] px-2.5 py-0.5 text-xs font-medium text-[#172B24]">{name || '—'}</span>;
}

export default function DealsRoute() {
  const [allowed, setAllowed] = React.useState(false);
  const [employees, setEmployees] = React.useState([]);
  React.useEffect(() => {
    setAllowed(sessionCan('DEAL') || sessionCan('CRM'));
    loadEmployees({ bpoOnly: true }).then(setEmployees).catch(() => setEmployees([]));
  }, []);
  const load = React.useCallback((query) => loadDeals({
    page: query.page,
    limit: 100,
    search: query.search || undefined,
    status: query.status || undefined,
    stage: query.stage || undefined,
    assignedToId: query.assignedToId || undefined,
    closeFrom: query.closeFrom || undefined,
    closeTo: query.closeTo || undefined,
  }), []);
  return <CrmScreen title="Deals" description="Sales pipeline, including deals waiting on a final customer decision." actionLabel="Add deal" canCreate={allowed} load={load} blank={blank}
    stats={(result) => [{ label: 'Total', value: result.metrics?.total }, { label: 'Open', value: result.metrics?.open }, { label: 'Won value', value: result.metrics?.wonValue == null ? '—' : inr(result.metrics.wonValue) }, { label: 'Pipeline value', value: result.metrics?.pipelineValue == null ? '—' : inr(result.metrics.pipelineValue) }]}
    filters={[
      { key: 'stage', label: 'All stages', options: STAGE_ORDER.map((value) => ({ value, label: value })) },
      { key: 'status', label: 'All statuses', options: [{ value: 'FINAL_CALL', label: 'Final Call' }, { value: 'WON', label: 'Won' }, { value: 'LOST', label: 'Lost' }, { value: 'OPEN', label: 'Open' }] },
      { key: 'assignedToId', label: 'All employees', options: employees.filter((employee) => employee.userId).map((employee) => ({ value: String(employee.userId), label: employee.name })) },
      { key: 'closeFrom', label: 'Expected close from', type: 'date' },
      { key: 'closeTo', label: 'Expected close to', type: 'date' },
    ]}
    below={(rows) => <Pipeline rows={rows} />}
    columns={[
      { header: 'Deal Name', accessorKey: 'title' },
      { header: 'Deal Value', cell: (row) => inr(row.amount) },
      { header: 'Customer / Company', cell: (row) => row.company?.name || row.lead?.companyName || row.contact?.firstName || '—' },
      { header: 'Lead Name', cell: (row) => leadName(row.lead) },
      { header: 'Deal Stage', cell: (row) => <StageBadge name={row.stage?.name} won={row.isWon} lost={row.isLost} /> },
      { header: 'Probability', cell: (row) => row.probability == null ? '—' : `${row.probability}%` },
      { header: 'Expected Close Date', cell: (row) => String(row.expectedClosing || '').slice(0, 10) || '—' },
      { header: 'Assigned Employee', cell: (row) => personName(row.assignedTo) },
      { header: 'Next Follow-up Date', cell: (row) => dateLabel(row.nextFollowUpDate) },
      { header: 'Deal Status', cell: (row) => <StatusBadge status={row.isWon ? 'won' : row.isLost ? 'lost' : 'open'} /> },
    ]}
    renderForm={(form, setForm) => <div className="grid gap-3 sm:grid-cols-2"><Field label="Title"><Input required value={form.title || ''} onChange={(event) => setForm({ ...form, title: event.target.value })} /></Field><Field label="Amount"><Input required type="number" value={form.amount || ''} onChange={(event) => setForm({ ...form, amount: event.target.value })} /></Field><Field label="Lead id"><Input value={form.leadId || ''} onChange={(event) => setForm({ ...form, leadId: event.target.value })} /></Field><Field label="Contact id"><Input value={form.contactId || ''} onChange={(event) => setForm({ ...form, contactId: event.target.value })} /></Field><Field label="Company id"><Input value={form.companyId || ''} onChange={(event) => setForm({ ...form, companyId: event.target.value })} /></Field><Field label="Assigned user id"><Input value={form.assignedToId || ''} onChange={(event) => setForm({ ...form, assignedToId: event.target.value })} /></Field><Field label="Expected closing"><Input type="date" value={String(form.expectedClosing || '').slice(0, 10)} onChange={(event) => setForm({ ...form, expectedClosing: event.target.value })} /></Field><Field label="Probability"><Input type="number" value={form.probability || ''} onChange={(event) => setForm({ ...form, probability: event.target.value })} /></Field></div>}
    onSave={async (form, id) => { await saveDeal(form, id); toast.success(id ? 'Deal updated' : 'Deal created'); }}
    detail={(row) => <DealDetail row={row} />}
    rowActions={(reload) => allowed ? [{ label: 'Delete', onSelect: async (row) => { try { await removeDeal(row.id); reload((value) => value + 1); } catch (error) { toast.error(crmError(error)); } } }] : []}
  />;
}

function DealDetail({ row }) {
  const [stageId, setStageId] = React.useState(String(row.stageId || ''));
  const [saving, setSaving] = React.useState(false);
  const stages = [...(row.pipeline?.stages || [])].sort((a, b) => a.order - b.order);
  const lead = row.lead;
  return <div className="space-y-3 text-sm text-[#172B24]">
    <p className="text-base font-semibold">{row.title}</p>
    <div className="grid gap-2 sm:grid-cols-2">
      <p>Lead name: {leadName(lead)}</p>
      <p>Mobile: {lead?.phone || '—'}</p>
      <p>Email: {lead?.email || '—'}</p>
      <p>Company: {lead?.companyName || row.company?.name || '—'}</p>
      <p>Lead source: {lead?.source || '—'}</p>
      <p>Lead status: {lead?.stage?.name || lead?.status || '—'}</p>
      <p>Assigned employee: {personName(row.assignedTo || lead?.assignedTo)}</p>
      <p>Deal stage: <StageBadge name={row.stage?.name} won={row.isWon} lost={row.isLost} /></p>
      <p>Deal value: {inr(row.amount)}</p>
      <p>Next follow-up: {dateLabel(row.nextFollowUpDate)}</p>
      <p>Latest outcome: {row.latestFollowUp?.outcome || '—'}</p>
    </div>
    {stages.length > 0 && <div className="flex flex-wrap items-end gap-2"><Field label="Move stage"><select className="h-9 rounded-md border px-2 text-sm" value={stageId} onChange={(event) => setStageId(event.target.value)}>{stages.map((stage) => <option key={stage.id} value={stage.id}>{stage.name}</option>)}</select></Field><Button className="bg-[#163A2E] hover:bg-[#204C3D]" disabled={saving} onClick={async () => { setSaving(true); try { await moveDealStage(row.id, stageId); toast.success('Deal stage updated'); } catch (error) { toast.error(crmError(error)); } finally { setSaving(false); } }}>{saving ? 'Saving' : 'Save stage'}</Button></div>}
  </div>;
}

function Pipeline({ rows }) {
  const totals = STAGE_ORDER.map((name) => {
    const matches = rows.filter((row) => (row.stage?.name || '') === name);
    return { name, count: matches.length, value: matches.reduce((sum, row) => sum + (Number(row.amount) || 0), 0) };
  });
  return <div className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-8">{totals.map((stage) => <div key={stage.name} className={`rounded-xl border bg-white p-3 ${stage.name === 'Final Call' ? 'border-[#C2410C]' : 'border-[#E2E8E5]'}`}><p className="text-xs text-[#718078]">{stage.name}</p><p className="text-lg font-semibold text-[#172B24]">{stage.count}</p><p className="truncate text-xs">{inr(stage.value)}</p></div>)}</div>;
}

function Field({ label, children }) { return <Label className="grid gap-1 text-xs">{label}{children}</Label>; }
