'use client';

import * as React from 'react';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { PageHeader } from '@/components/common/PageHeader';
import { KpiGrid } from '@/components/common/KpiCard';
import { Button } from '@/components/common/Button';
import { FormDrawer } from '@/components/common/drawers/FormDrawer';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { Textarea } from '@/components/common/Textarea';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { toast } from '@/hooks/use-toast';
import { bulkDealStages, crmError, loadDealStages, loadLeadStages, removeDealStage, removeLeadStage, saveDealStage, saveLeadStage } from '@/modules/crm/crm-api';

const emptyForm = { type: 'Lead', name: '', order: '', probability: '', description: '', color: '#163A2E', bgColor: '#E8F1EC', borderColor: '#E2E8E5', isActive: true, emailEnabled: true, whatsappEnabled: true };
const keyOf = (stage) => `${stage.type}:${stage.id}`;

export function StageManagement() {
  const [stages, setStages] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [selected, setSelected] = React.useState([]);
  const [drawer, setDrawer] = React.useState(null);
  const [form, setForm] = React.useState(emptyForm);
  const [saving, setSaving] = React.useState(false);
  const [confirm, setConfirm] = React.useState(null);
  const [search, setSearch] = React.useState('');
  const [type, setType] = React.useState('ALL');
  const [status, setStatus] = React.useState('ALL');
  const [sort, setSort] = React.useState('order');
  const [page, setPage] = React.useState(1);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    try {
      const [leadStages, dealStages] = await Promise.all([
        loadLeadStages().catch(() => []),
        loadDealStages(false).then((result) => (result.stages || []).map((stage) => ({ ...stage, type: 'Deal' }))).catch(() => []),
      ]);
      const rows = [...leadStages, ...dealStages];
      setStages(rows);
      setSelected((current) => current.filter((key) => rows.some((stage) => keyOf(stage) === key)));
    } catch (error) {
      toast.error(crmError(error));
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { refresh(); }, [refresh]);

  const filtered = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    const rows = stages.filter((stage) => {
      if (type !== 'ALL' && stage.type !== type) return false;
      if (status === 'ACTIVE' && stage.isActive === false) return false;
      if (status === 'INACTIVE' && stage.isActive !== false) return false;
      if (!query) return true;
      return [stage.name, stage.description, stage.key].some((value) => String(value || '').toLowerCase().includes(query));
    });
    const valueOf = (stage) => {
      if (sort === 'name') return stage.name || '';
      if (sort === 'type') return stage.type;
      if (sort === 'status') return stage.isActive === false ? 'Inactive' : 'Active';
      if (sort === 'created') return stage.createdAt || '';
      return stage.order ?? stage.sortOrder ?? 0;
    };
    return [...rows].sort((a, b) => String(valueOf(a)).localeCompare(String(valueOf(b)), undefined, { numeric: true }));
  }, [stages, search, type, status, sort]);

  const pageSize = 20;
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);
  React.useEffect(() => { if (page > pageCount) setPage(pageCount); }, [page, pageCount]);

  const open = (mode, stage) => {
    setDrawer({ mode, stage });
    setForm(stage ? {
      type: stage.type,
      name: stage.name || '',
      order: stage.order ?? stage.sortOrder ?? '',
      probability: stage.probability ?? '',
      description: stage.description || '',
      color: stage.color || '#163A2E',
      bgColor: stage.bgColor || '#E8F1EC',
      borderColor: stage.borderColor || '#E2E8E5',
      isActive: stage.isActive !== false,
      emailEnabled: stage.emailEnabled !== false,
      whatsappEnabled: stage.whatsappEnabled !== false,
    } : emptyForm);
  };

  const save = async () => {
    if (!form.name.trim()) {
      toast.error('Stage name is required.');
      return;
    }
    setSaving(true);
    try {
      const id = drawer?.mode === 'edit' ? drawer.stage.id : undefined;
      if (form.type === 'Deal') await saveDealStage(form, id);
      else await saveLeadStage(form, id);
      toast.success(id ? 'Stage updated.' : 'Stage created.');
      setDrawer(null);
      await refresh();
    } catch (error) {
      toast.error(crmError(error));
    } finally {
      setSaving(false);
    }
  };

  const recordsFor = (keys) => stages.filter((stage) => keys.includes(keyOf(stage)));

  const setActive = async (keys, isActive) => {
    const records = recordsFor(keys);
    try {
      const deals = records.filter((stage) => stage.type === 'Deal');
      const leads = records.filter((stage) => stage.type === 'Lead');
      if (deals.length === 1) await saveDealStage({ isActive, name: deals[0].name }, deals[0].id);
      else if (deals.length) await bulkDealStages(deals.map((stage) => stage.id), isActive ? 'activate' : 'deactivate');
      await Promise.all(leads.map((stage) => saveLeadStage({ isActive, name: stage.name }, stage.id)));
      toast.success(isActive ? 'Stage activated.' : 'Stage deactivated.');
      await refresh();
    } catch (error) {
      toast.error(crmError(error));
    }
  };

  const runDelete = async (keys) => {
    const records = recordsFor(keys);
    const failures = [];
    const deals = records.filter((stage) => stage.type === 'Deal');
    const leads = records.filter((stage) => stage.type === 'Lead');
    if (deals.length === 1) {
      try { await removeDealStage(deals[0].id); } catch (error) { failures.push(crmError(error)); }
    } else if (deals.length) {
      const result = await bulkDealStages(deals.map((stage) => stage.id), 'delete');
      (result?.failures || result?.data?.failures || []).forEach((failure) => failures.push(failure.message));
    }
    for (const stage of leads) {
      try { await removeLeadStage(stage.id); } catch (error) { failures.push(crmError(error)); }
    }
    if (failures.length) toast.error(failures[0] || 'Some stages could not be deleted.');
    else toast.success(records.length === 1 ? 'Stage deleted.' : 'Selected unused stages deleted.');
    await refresh();
  };

  const viewing = drawer?.mode === 'view';
  const dealForm = form.type === 'Deal';
  const active = stages.filter((stage) => stage.isActive !== false).length;
  const allVisibleSelected = visible.length > 0 && visible.every((stage) => selected.includes(keyOf(stage)));

  return (
    <div className="space-y-5">
      <PageHeader title="Stage Management" description="Manage CRM lead and deal stages." actions={<Button type="button" onClick={() => open('create')}><FontAwesomeIcon icon={faPlus} className="mr-2 size-3.5" />Add Stage</Button>} />
      <KpiGrid cards={[
        { title: 'Total Stages', value: stages.length, description: 'Lead and deal stages' },
        { title: 'Active Stages', value: active, description: 'Available for new records' },
        { title: 'Inactive Stages', value: stages.length - active, description: 'Kept on existing records' },
      ]} />
      <div className="overflow-hidden rounded-lg border border-[#E2E8E5] bg-white">
        <div className="flex flex-wrap items-center gap-2 border-b border-[#E2E8E5] px-4 py-3">
          <Input aria-label="Search stages" value={search} placeholder="Search stages" onChange={(event) => { setSearch(event.target.value); setPage(1); }} className="max-w-xs" />
          <select aria-label="Stage type" className="h-8 rounded-md border border-[#E2E8E5] bg-white px-2 text-sm" value={type} onChange={(event) => { setType(event.target.value); setPage(1); }}><option value="ALL">All types</option><option value="Lead">Lead</option><option value="Deal">Deal</option></select>
          <select aria-label="Stage status" className="h-8 rounded-md border border-[#E2E8E5] bg-white px-2 text-sm" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}><option value="ALL">All statuses</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select>
          <select aria-label="Sort stages" className="h-8 rounded-md border border-[#E2E8E5] bg-white px-2 text-sm" value={sort} onChange={(event) => setSort(event.target.value)}><option value="order">Display order</option><option value="name">Name</option><option value="type">Type</option><option value="status">Status</option><option value="created">Created date</option></select>
          {selected.length > 0 && <div className="ml-auto flex flex-wrap gap-2"><Button type="button" variant="outline" onClick={() => setActive(selected, true)}>Activate</Button><Button type="button" variant="outline" onClick={() => setActive(selected, false)}>Deactivate</Button><Button type="button" variant="outline" className="text-rose-700" onClick={() => setConfirm({ ids: selected })}>Delete</Button></div>}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[980px] w-full text-left text-sm">
            <thead className="bg-[#F7F9F8] text-xs uppercase tracking-wide text-[#718078]">
              <tr>
                <th className="px-4 py-3"><input aria-label="Select visible stages" type="checkbox" checked={allVisibleSelected} onChange={(event) => setSelected(event.target.checked ? [...new Set([...selected, ...visible.map(keyOf)])] : selected.filter((key) => !visible.some((stage) => keyOf(stage) === key)))} /></th>
                {['Stage Name', 'Type', 'Description', 'Color', 'Probability', 'Order', 'Status', 'Created', 'Actions'].map((label) => <th key={label} className="px-4 py-3 font-semibold">{label}</th>)}
              </tr>
            </thead>
            <tbody>
              {visible.map((stage) => (
                <tr key={keyOf(stage)} className="border-t border-[#E2E8E5]">
                  <td className="px-4 py-3"><input aria-label={`Select ${stage.name}`} type="checkbox" checked={selected.includes(keyOf(stage))} onChange={(event) => setSelected((current) => event.target.checked ? [...current, keyOf(stage)] : current.filter((key) => key !== keyOf(stage)))} /></td>
                  <td className="px-4 py-3 font-medium text-[#172B24]">{stage.name}</td>
                  <td className="px-4 py-3">{stage.type}</td>
                  <td className="max-w-[220px] truncate px-4 py-3 text-[#64748B]">{stage.description || '—'}</td>
                  <td className="px-4 py-3"><span className="inline-flex items-center gap-2"><span className="size-3 rounded-full border border-[#E2E8E5]" style={{ background: stage.color || '#163A2E' }} />{stage.color || '—'}</span></td>
                  <td className="px-4 py-3">{stage.type === 'Deal' ? `${stage.probability ?? 0}%` : '—'}</td>
                  <td className="px-4 py-3">{stage.order ?? stage.sortOrder ?? '—'}</td>
                  <td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-xs font-semibold ${stage.isActive === false ? 'bg-slate-100 text-slate-600' : 'bg-[#E8F1EC] text-[#163A2E]'}`}>{stage.isActive === false ? 'Inactive' : 'Active'}</span></td>
                  <td className="px-4 py-3 text-[#64748B]">{stage.createdAt ? new Date(stage.createdAt).toLocaleDateString('en-IN') : '—'}</td>
                  <td className="px-4 py-3"><div className="flex flex-wrap gap-1"><Button type="button" size="sm" variant="outline" onClick={() => open('view', stage)}>View</Button><Button type="button" size="sm" variant="outline" onClick={() => open('edit', stage)}>Edit</Button><Button type="button" size="sm" variant="outline" onClick={() => setActive([keyOf(stage)], stage.isActive === false)}>{stage.isActive === false ? 'Activate' : 'Deactivate'}</Button><Button type="button" size="sm" variant="outline" className="text-rose-700" onClick={() => setConfirm({ ids: [keyOf(stage)], name: stage.name, used: stage.type === 'Lead' ? Number(stage.leadsCount || 0) : Number(stage._count?.deals || 0), type: stage.type })}>Delete</Button></div></td>
                </tr>
              ))}
              {!loading && visible.length === 0 && <tr><td colSpan={10} className="px-4 py-10 text-center text-[#718078]">{search || type !== 'ALL' || status !== 'ALL' ? 'No stages match these filters.' : 'No stages configured yet.'}</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-[#E2E8E5] px-4 py-3 text-sm text-[#64748B]">
          <span>{loading ? 'Loading stages…' : `${filtered.length} stages`}</span>
          <div className="flex items-center gap-2"><Button type="button" size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button><span>Page {page} of {pageCount}</span><Button type="button" size="sm" variant="outline" disabled={page >= pageCount} onClick={() => setPage(page + 1)}>Next</Button></div>
        </div>
      </div>
      <FormDrawer open={Boolean(drawer)} onOpenChange={(open) => !open && setDrawer(null)} title={drawer?.mode === 'edit' ? 'Edit Stage' : drawer?.mode === 'view' ? 'Stage Details' : 'Add Stage'} description="Stage name is required. The other fields follow the existing lead or deal stage record." showFooter={!viewing} submitLabel={drawer?.mode === 'edit' ? 'Update Stage' : 'Save Stage'} loading={saving} onSubmit={save}>
        <div className="space-y-4">
          <div><Label htmlFor="stage-type">Stage Type</Label><select id="stage-type" className="h-9 w-full rounded-md border border-[#E2E8E5] px-2 text-sm" value={form.type} disabled={viewing || drawer?.mode === 'edit'} onChange={(event) => setForm({ ...form, type: event.target.value })}><option value="Lead">Lead</option><option value="Deal">Deal</option></select></div>
          <div><Label htmlFor="stage-name">Stage Name</Label><Input id="stage-name" value={form.name} disabled={viewing} onChange={(event) => setForm({ ...form, name: event.target.value })} /></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label htmlFor="stage-order">Display Order</Label><Input id="stage-order" type="number" value={form.order} disabled={viewing} onChange={(event) => setForm({ ...form, order: event.target.value })} /></div>
            {dealForm && <div><Label htmlFor="stage-probability">Probability (%)</Label><Input id="stage-probability" type="number" min="0" max="100" value={form.probability} disabled={viewing} onChange={(event) => setForm({ ...form, probability: event.target.value })} /></div>}
          </div>
          {dealForm && <div><Label htmlFor="stage-description">Description</Label><Textarea id="stage-description" value={form.description} disabled={viewing} onChange={(event) => setForm({ ...form, description: event.target.value })} /></div>}
          <div className="grid gap-4 sm:grid-cols-3">
            <div><Label htmlFor="stage-color">Color</Label><Input id="stage-color" type="color" value={form.color} disabled={viewing} onChange={(event) => setForm({ ...form, color: event.target.value })} /></div>
            {!dealForm && <div><Label htmlFor="stage-bg">Background</Label><Input id="stage-bg" type="color" value={form.bgColor} disabled={viewing} onChange={(event) => setForm({ ...form, bgColor: event.target.value })} /></div>}
            {!dealForm && <div><Label htmlFor="stage-border">Border</Label><Input id="stage-border" type="color" value={form.borderColor} disabled={viewing} onChange={(event) => setForm({ ...form, borderColor: event.target.value })} /></div>}
          </div>
          <label className="flex items-center gap-2 text-sm text-[#172B24]"><input type="checkbox" checked={form.isActive} disabled={viewing} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} />Active</label>
          {!dealForm && <label className="flex items-center gap-2 text-sm text-[#172B24]"><input type="checkbox" checked={form.emailEnabled} disabled={viewing} onChange={(event) => setForm({ ...form, emailEnabled: event.target.checked })} />Email notification</label>}
          {!dealForm && <label className="flex items-center gap-2 text-sm text-[#172B24]"><input type="checkbox" checked={form.whatsappEnabled} disabled={viewing} onChange={(event) => setForm({ ...form, whatsappEnabled: event.target.checked })} />WhatsApp notification</label>}
        </div>
      </FormDrawer>
      <ConfirmDialog open={Boolean(confirm)} onOpenChange={(open) => !open && setConfirm(null)} variant="destructive" title={confirm?.used > 0 ? 'Stage is in use' : 'Delete stage?'} description={confirm?.used > 0 ? `"${confirm.name}" is already used by ${confirm.used} ${confirm.type === 'Lead' ? 'lead' : 'deal'} record${confirm.used === 1 ? '' : 's'}. Deletion keeps those records intact. Deactivate the stage instead.` : 'Deletion is refused when leads or deals still use the stage. Existing records keep their stage.'} confirmLabel={confirm?.used > 0 ? 'Deactivate' : 'Delete'} onConfirm={() => (confirm?.used > 0 ? setActive(confirm.ids, false) : runDelete(confirm.ids))} />
    </div>
  );
}
