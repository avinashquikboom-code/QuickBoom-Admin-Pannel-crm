'use client';

import * as React from 'react';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { Button } from '@/components/common/Button';
import { faTrashCan } from '@fortawesome/free-solid-svg-icons';
import { toast } from '@/hooks/use-toast';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { CrmScreen } from '@/modules/crm/CrmScreen';
import { crmError, loadDealStages, loadDeals, loadEmployees, moveDealStage, personName, removeDeal, removeDeals, saveDeal, sessionCan } from '@/modules/crm/crm-api';
import { sessionCanAction } from '@/modules/hrm/hrm-api';

const blank = { title: '', amount: '', leadId: '', contactId: '', companyId: '', assignedToId: '', expectedClosing: '', probability: '', currency: 'INR', description: '', notes: '', stageId: '', pipelineId: '' };

function orderedStages(stages = [], rows = []) {
  const map = new Map();
  stages.forEach((stage) => { if (stage?.id) map.set(stage.id, stage); });
  rows.forEach((row) => { if (row.stage?.id && !map.has(row.stage.id)) map.set(row.stage.id, row.stage); });
  return [...map.values()].sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.id - b.id);
}

function assignableStages(stages, currentId) {
  return stages.filter((stage) => stage.isActive !== false || String(stage.id) === String(currentId));
}
const inr = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value) || 0);

function leadName(lead) {
  if (!lead?.id) return 'Not Linked';
  const person = `${lead.firstName || ''} ${lead.lastName || ''}`.trim();
  return person || lead.name || lead.title || lead.companyName || `Lead #${lead.id}`;
}

function LeadLink({ lead, onOpen }) {
  if (!lead?.id) return <span className="text-[#718078]">Not Linked</span>;
  return <button type="button" className="font-semibold text-[#163A2E] underline-offset-2 hover:underline" onClick={() => onOpen?.({ lead })}>{leadName(lead)}</button>;
}

function dateLabel(value) {
  if (!value) return 'Not Scheduled';
  const day = String(value).slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);
  if (day < today) return `${day} · Overdue`;
  return day;
}

function StageBadge({ name, color, won, lost }) {
  if (won || name === 'Won') return <StatusBadge status="won" />;
  if (lost || name === 'Lost') return <StatusBadge status="lost" />;
  return <span className="inline-flex rounded-full border border-[#E2E8E5] bg-[#F7F9F8] px-2.5 py-0.5 text-xs font-medium text-[#172B24]" style={color ? { color, borderColor: color } : undefined}>{name || '—'}</span>;
}

export default function DealsRoute() {
  const [allowed, setAllowed] = React.useState(false);
  const [canDelete, setCanDelete] = React.useState(false);
  const [pendingDelete, setPendingDelete] = React.useState(null);
  const [employees, setEmployees] = React.useState([]);
  const [stages, setStages] = React.useState([]);
  React.useEffect(() => {
    setAllowed(sessionCan('DEAL') || sessionCan('CRM'));
    setCanDelete(sessionCanAction('DEALS', 'DELETE') || sessionCanAction('DEAL', 'DELETE') || sessionCanAction('CRM', 'DELETE'));
    loadEmployees({ bpoOnly: true }).then(setEmployees).catch(() => setEmployees([]));
    loadDealStages(false).then((result) => setStages(result.stages || [])).catch(() => setStages([]));
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
  return <>
    <CrmScreen title="Deals" description="Sales pipeline, including deals waiting on a final customer decision." actionLabel="Add deal" canCreate={allowed} load={load} blank={blank}
    enableSelection
    toolbar={({ selected, clearSelection, reload }) => <DealSelectionBar selected={selected} clearSelection={clearSelection} canDelete={canDelete} onDelete={() => setPendingDelete({ rows: selected, single: false, reload })} />}
    stats={(result) => [{ label: 'Total', value: result.metrics?.total }, { label: 'Open', value: result.metrics?.open }, { label: 'Won value', value: result.metrics?.wonValue == null ? '—' : inr(result.metrics.wonValue) }, { label: 'Pipeline value', value: result.metrics?.pipelineValue == null ? '—' : inr(result.metrics.pipelineValue) }]}
    filters={[
      { key: 'stage', label: 'All stages', options: orderedStages(stages).map((stage) => ({ value: stage.name, label: stage.isActive === false ? `${stage.name} (inactive)` : stage.name })) },
      { key: 'status', label: 'All statuses', options: [{ value: 'FINAL_CALL', label: 'Final Call' }, { value: 'WON', label: 'Won' }, { value: 'LOST', label: 'Lost' }, { value: 'OPEN', label: 'Open' }] },
      { key: 'assignedToId', label: 'All employees', options: employees.filter((employee) => employee.userId).map((employee) => ({ value: String(employee.userId), label: employee.name })) },
      { key: 'closeFrom', label: 'Expected close from', type: 'date' },
      { key: 'closeTo', label: 'Expected close to', type: 'date' },
    ]}
      below={(rows) => <Pipeline rows={rows} stages={orderedStages(stages, rows)} />}
    columns={({ open }) => [
      { header: 'Deal Name', accessorKey: 'title' },
      { header: 'Deal Value', cell: (row) => inr(row.amount) },
      { header: 'Customer / Company', cell: (row) => row.company?.name || row.lead?.companyName || row.contact?.firstName || '—' },
      { header: 'Lead Name', cell: (row) => <LeadLink lead={row.lead} onOpen={() => open(row)} /> },
      { header: 'Lead Mobile Number', cell: (row) => row.lead?.phone || row.lead?.mobileNumber || 'Not Linked' },
      { header: 'Lead Email', cell: (row) => row.lead?.email || 'Not Linked' },
      { header: 'Deal Stage', cell: (row) => <StageBadge name={row.stage?.name} color={row.stage?.color} won={row.isWon} lost={row.isLost} /> },
      { header: 'Probability', cell: (row) => row.probability == null ? '—' : `${row.probability}%` },
      { header: 'Expected Close Date', cell: (row) => String(row.expectedClosing || '').slice(0, 10) || '—' },
      { header: 'Assigned Employee', cell: (row) => personName(row.assignedTo) },
      { header: 'Next Follow-up Date', cell: (row) => row.lead ? dateLabel(row.nextFollowUpDate) : 'Not Linked' },
      { header: 'Deal Status', cell: (row) => <StatusBadge status={row.isWon ? 'won' : row.isLost ? 'lost' : 'open'} /> },
    ]}
    gap={(rows) => {
      const missing = (rows || []).filter((row) => !row.lead?.id);
      return missing.length ? { title: 'Deals without a lead link', detail: `${missing.length} deal${missing.length === 1 ? '' : 's'} on this page have no lead id, converted deal, or converted contact: ${missing.map((row) => row.title).join(', ')}. They are not linked automatically by name.` } : null;
    }}
    renderForm={(form, setForm) => <div className="grid gap-3 sm:grid-cols-2"><Field label="Title"><Input required value={form.title || ''} onChange={(event) => setForm({ ...form, title: event.target.value })} /></Field><Field label="Amount"><Input required type="number" value={form.amount || ''} onChange={(event) => setForm({ ...form, amount: event.target.value })} /></Field><Field label="Stage"><select className="h-9 rounded-md border px-2 text-sm" value={form.stageId || ''} onChange={(event) => setForm({ ...form, stageId: event.target.value })}><option value="">First active stage</option>{assignableStages(stages, form.stageId).map((stage) => <option key={stage.id} value={stage.id}>{stage.name}{stage.isActive === false ? ' (inactive)' : ''}</option>)}</select></Field><Field label="Lead id"><Input value={form.leadId || ''} onChange={(event) => setForm({ ...form, leadId: event.target.value })} /></Field><Field label="Contact id"><Input value={form.contactId || ''} onChange={(event) => setForm({ ...form, contactId: event.target.value })} /></Field><Field label="Company id"><Input value={form.companyId || ''} onChange={(event) => setForm({ ...form, companyId: event.target.value })} /></Field><Field label="Assigned user id"><Input value={form.assignedToId || ''} onChange={(event) => setForm({ ...form, assignedToId: event.target.value })} /></Field><Field label="Expected closing"><Input type="date" value={String(form.expectedClosing || '').slice(0, 10)} onChange={(event) => setForm({ ...form, expectedClosing: event.target.value })} /></Field><Field label="Probability"><Input type="number" value={form.probability || ''} onChange={(event) => setForm({ ...form, probability: event.target.value })} /></Field></div>}
    onSave={async (form, id) => { await saveDeal(form, id); toast.success(id ? 'Deal updated' : 'Deal created'); }}
    detail={(row) => <DealDetail row={row} stages={orderedStages(stages, [row])} />}
    rowActions={(reload) => canDelete ? [{ label: 'Delete', icon: faTrashCan, confirm: false, onSelect: (row) => setPendingDelete({ rows: [row], single: true, reload }) }] : []}
    />
    <DealDeleteDialog pending={pendingDelete} setPending={setPendingDelete} />
  </>;
}

function DealSelectionBar({ selected, clearSelection, canDelete, onDelete }) {
  if (!canDelete || !selected.length) return null;
  return <div className="flex flex-col gap-3 rounded-xl border border-[#E2E8E5] bg-[#E8F1EC] p-3 md:flex-row md:items-center md:justify-between">
    <p className="text-sm font-medium text-[#172B24]">Selected: {selected.length} deal{selected.length === 1 ? '' : 's'}</p>
    <div className="flex flex-wrap gap-2">
      <Button size="sm" variant="destructive" onClick={onDelete}>Delete Selected</Button>
      <Button size="sm" variant="outline" onClick={clearSelection}>Clear Selection</Button>
    </div>
  </div>;
}

function DealDeleteDialog({ pending, setPending }) {
  const [deleting, setDeleting] = React.useState(false);
  const busy = React.useRef(false);
  const rows = pending?.rows || [];
  const run = async () => {
    if (busy.current || !rows.length) return;
    busy.current = true;
    setDeleting(true);
    try {
      if (pending.single) {
        await removeDeal(rows[0].id);
        toast.success('Deal deleted');
      } else {
        const result = await removeDeals(rows.map((row) => row.id));
        const body = result?.data && typeof result.data === 'object' && !Array.isArray(result.data) ? result.data : result;
        const success = Number(body?.success ?? 0);
        const failed = Number(body?.failed ?? body?.failures?.length ?? 0);
        toast.success(body?.message || `${success} deal${success === 1 ? '' : 's'} deleted${failed ? `, ${failed} failed` : ''}.`);
        if (failed && body?.failures?.[0]?.message) toast.error(body.failures[0].message);
      }
      setPending(null);
      pending.reload?.((value) => value + 1);
    } catch (error) {
      toast.error(crmError(error));
    } finally {
      busy.current = false;
      setDeleting(false);
    }
  };
  const dealFacts = (row) => [inr(row.amount), row.stage?.name || 'No stage', row.company?.name || row.lead?.companyName || 'No company', personName(row.assignedTo)].join(' · ');
  return <ConfirmDialog
    open={rows.length > 0}
    loading={deleting}
    closeOnConfirm={false}
    onOpenChange={(open) => { if (!open && !deleting) setPending(null); }}
    variant="destructive"
    title={pending?.single ? 'Delete this deal?' : 'Delete selected deals?'}
    description={pending?.single ? 'Are you sure you want to delete this deal?' : 'Are you sure you want to delete the selected deals?'}
    confirmLabel={pending?.single ? 'Delete' : 'Delete Selected'}
    cancelLabel="Cancel"
    details={!rows.length ? null : pending?.single ? <div className="space-y-1"><p className="font-semibold text-[#172B24]">{rows[0].title || `Deal #${rows[0].id}`}</p><p>{dealFacts(rows[0])}</p><p>Linked leads, customers, and employees stay in place.</p></div> : <div className="space-y-2"><p>{rows.length} deal{rows.length === 1 ? '' : 's'} selected.</p><ul className="max-h-40 overflow-y-auto rounded-md border border-[#E2E8E5] bg-[#F7F9F8] p-2 text-[#172B24]">{rows.map((row) => <li key={row.id} className="truncate">{row.title || `Deal #${row.id}`} · {inr(row.amount)}</li>)}</ul></div>}
    onConfirm={run}
  />;
}

function DealDetail({ row, stages = [] }) {
  const [stageId, setStageId] = React.useState(String(row.stageId || ''));
  const [saving, setSaving] = React.useState(false);
  const choices = assignableStages(stages.length ? stages : [...(row.pipeline?.stages || [])].sort((a, b) => a.order - b.order), row.stageId);
  const lead = row.lead;
  return <div className="space-y-3 text-sm text-[#172B24]">
    <p className="text-base font-semibold">{row.title}</p>
    <div className="grid gap-2 sm:grid-cols-2">
      <p>Lead name: {leadName(lead)}</p>
      <p>Mobile: {lead?.phone || lead?.mobileNumber || 'Not Linked'}</p>
      <p>Email: {lead?.email || 'Not Linked'}</p>
      <p>Company: {lead?.companyName || row.company?.name || '—'}</p>
      <p>Lead source: {lead?.source || '—'}</p>
      <p>Lead status: {lead?.stage?.name || lead?.status || '—'}</p>
      <p>Assigned employee: {personName(row.assignedTo || lead?.assignedTo)}</p>
      <p>Deal stage: <StageBadge name={row.stage?.name} color={row.stage?.color} won={row.isWon} lost={row.isLost} /></p>
      <p>Deal value: {inr(row.amount)}</p>
      <p>Next follow-up: {dateLabel(row.nextFollowUpDate)}</p>
      <p>Latest outcome: {row.latestFollowUp?.outcome || '—'}</p>
    </div>
    {choices.length > 0 && <div className="flex flex-wrap items-end gap-2"><Field label="Move stage"><select className="h-9 rounded-md border px-2 text-sm" value={stageId} onChange={(event) => setStageId(event.target.value)}>{choices.map((stage) => <option key={stage.id} value={stage.id}>{stage.name}{stage.isActive === false ? ' (inactive)' : ''}</option>)}</select></Field><Button className="bg-[#163A2E] hover:bg-[#204C3D]" disabled={saving} onClick={async () => { setSaving(true); try { await moveDealStage(row.id, stageId); toast.success('Deal stage updated'); } catch (error) { toast.error(crmError(error)); } finally { setSaving(false); } }}>{saving ? 'Saving' : 'Save stage'}</Button></div>}
  </div>;
}

function Pipeline({ rows, stages = [] }) {
  const totals = (stages.length ? stages : orderedStages([], rows)).map((stage) => {
    const matches = rows.filter((row) => row.stage?.id === stage.id || (row.stage?.name || '') === stage.name);
    return { ...stage, count: matches.length, value: matches.reduce((sum, row) => sum + (Number(row.amount) || 0), 0) };
  });
  return <div className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-8">{totals.map((stage) => <div key={stage.id || stage.name} className="rounded-xl border bg-white p-3" style={{ borderColor: stage.color || '#E2E8E5' }}><p className="text-xs text-[#718078]">{stage.name}{stage.isActive === false ? ' · Inactive' : ''}</p><p className="text-lg font-semibold text-[#172B24]">{stage.count}</p><p className="truncate text-xs">{inr(stage.value)}</p></div>)}</div>;
}

function Field({ label, children }) { return <Label className="grid gap-1 text-xs">{label}{children}</Label>; }
