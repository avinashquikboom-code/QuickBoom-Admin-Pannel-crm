'use client';

import * as React from 'react';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { toast } from '@/hooks/use-toast';
import { CrmScreen } from '@/modules/crm/CrmScreen';
import { crmError, crmGaps, loadDeals, moveDealStage, personName, removeDeal, saveDeal, sessionCan } from '@/modules/crm/crm-api';

const blank = { title: '', amount: '', leadId: '', contactId: '', companyId: '', assignedToId: '', expectedClosing: '', probability: '', currency: 'INR', description: '', notes: '' };
const inr = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value) || 0);

export default function DealsRoute() {
  const [allowed, setAllowed] = React.useState(false);
  React.useEffect(() => setAllowed(sessionCan('DEAL') || sessionCan('CRM')), []);
  const load = React.useCallback((query) => loadDeals({ page: query.page, limit: 100, search: query.search || undefined, status: query.status || undefined, assignedToId: query.assignedToId || undefined }), []);
  return <CrmScreen title="Deals" description="Pipeline deals from the deals API. Stage totals below use the deals loaded for the current filters." actionLabel="Add deal" canCreate={allowed} load={load} blank={blank}
    gap={{ title: 'Deal history', detail: crmGaps.dealHistory }}
    stats={(result) => [{ label: 'Total', value: result.metrics?.total }, { label: 'Open', value: result.metrics?.open }, { label: 'Won value', value: result.metrics?.wonValue == null ? '—' : inr(result.metrics.wonValue) }, { label: 'Pipeline value', value: result.metrics?.pipelineValue == null ? '—' : inr(result.metrics.pipelineValue) }]}
    filters={[{ key: 'status', label: 'All statuses', options: ['OPEN', 'WON', 'LOST'].map((value) => ({ value, label: value })) }]}
    below={(rows) => <Pipeline rows={rows} />}
    columns={[{ header: 'Deal', accessorKey: 'title' }, { header: 'Value', cell: (row) => inr(row.amount) }, { header: 'Customer / company', cell: (row) => row.company?.name || row.contact?.firstName || '—' }, { header: 'Lead', cell: (row) => row.leadId || '—' }, { header: 'Stage', cell: (row) => row.stage?.name || '—' }, { header: 'Probability', cell: (row) => row.probability == null ? '—' : `${row.probability}%` }, { header: 'Close date', cell: (row) => String(row.expectedClosing || '').slice(0, 10) || '—' }, { header: 'Assigned', cell: (row) => personName(row.assignedTo) }, { header: 'Status', cell: (row) => <StatusBadge status={row.isWon ? 'won' : row.isLost ? 'lost' : 'open'} /> }]}
    renderForm={(form, setForm) => <div className="grid gap-3 sm:grid-cols-2"><Field label="Title"><Input required value={form.title || ''} onChange={(event) => setForm({ ...form, title: event.target.value })} /></Field><Field label="Amount"><Input required type="number" value={form.amount || ''} onChange={(event) => setForm({ ...form, amount: event.target.value })} /></Field><Field label="Lead id"><Input value={form.leadId || ''} onChange={(event) => setForm({ ...form, leadId: event.target.value })} /></Field><Field label="Contact id"><Input value={form.contactId || ''} onChange={(event) => setForm({ ...form, contactId: event.target.value })} /></Field><Field label="Company id"><Input value={form.companyId || ''} onChange={(event) => setForm({ ...form, companyId: event.target.value })} /></Field><Field label="Assigned user id"><Input value={form.assignedToId || ''} onChange={(event) => setForm({ ...form, assignedToId: event.target.value })} /></Field><Field label="Expected closing"><Input type="date" value={String(form.expectedClosing || '').slice(0, 10)} onChange={(event) => setForm({ ...form, expectedClosing: event.target.value })} /></Field><Field label="Probability"><Input type="number" value={form.probability || ''} onChange={(event) => setForm({ ...form, probability: event.target.value })} /></Field></div>}
    onSave={async (form, id) => { await saveDeal(form, id); toast.success(id ? 'Deal updated' : 'Deal created'); }}
    rowActions={(reload) => allowed ? [{ label: 'Move stage', onSelect: async (row) => { const stageId = window.prompt('Stage id', String(row.stageId || '')); if (!stageId) return; try { await moveDealStage(row.id, stageId); reload((value) => value + 1); } catch (error) { toast.error(crmError(error)); } } }, { label: 'Delete', onSelect: async (row) => { try { await removeDeal(row.id); reload((value) => value + 1); } catch (error) { toast.error(crmError(error)); } } }] : []}
  />;
}

function Pipeline({ rows }) {
  const stages = rows.reduce((groups, row) => { const name = row.stage?.name || 'Unstaged'; groups[name] = groups[name] || { count: 0, value: 0 }; groups[name].count += 1; groups[name].value += Number(row.amount) || 0; return groups; }, {});
  const entries = Object.entries(stages);
  if (!entries.length) return null;
  return <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">{entries.map(([name, stage]) => <div key={name} className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-xs text-slate-500">{name}</p><p className="text-lg font-semibold">{stage.count}</p><p className="text-xs">{inr(stage.value)}</p></div>)}</div>;
}

function Field({ label, children }) { return <Label className="grid gap-1 text-xs">{label}{children}</Label>; }
