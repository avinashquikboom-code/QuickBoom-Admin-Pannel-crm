'use client';

import * as React from 'react';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import { faBan, faCheck, faEye, faPen, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import { PageHeader } from '@/components/common/PageHeader';
import { KpiGrid } from '@/components/common/KpiCard';
import { Button } from '@/components/common/Button';
import { FormDrawer } from '@/components/common/drawers/FormDrawer';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { Textarea } from '@/components/common/Textarea';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { toast } from '@/hooks/use-toast';
import { bulkDealStages, crmError, loadDealStages, removeDealStage, saveDealStage } from '@/modules/crm/crm-api';

const emptyForm = { name: '', order: '', probability: '50', description: '', color: '#163A2E', isActive: true };

export function StageManagement() {
  const [stages, setStages] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [selected, setSelected] = React.useState([]);
  const [drawer, setDrawer] = React.useState(null);
  const [form, setForm] = React.useState(emptyForm);
  const [saving, setSaving] = React.useState(false);
  const [confirm, setConfirm] = React.useState(null);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    try {
      const result = await loadDealStages(false);
      setStages(result.stages);
      setSelected((current) => current.filter((id) => result.stages.some((stage) => stage.id === id)));
    } catch (error) {
      toast.error(crmError(error));
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { refresh(); }, [refresh]);

  const open = (mode, stage) => {
    setDrawer({ mode, stage });
    setForm(stage ? {
      name: stage.name || '',
      order: stage.order ?? '',
      probability: stage.probability ?? 50,
      description: stage.description || '',
      color: stage.color || '#163A2E',
      isActive: stage.isActive !== false,
    } : emptyForm);
  };

  const save = async () => {
    if (!form.name.trim()) {
      toast.error('Stage name is required.');
      return;
    }
    setSaving(true);
    try {
      await saveDealStage(form, drawer?.mode === 'edit' ? drawer.stage.id : undefined);
      toast.success(drawer?.mode === 'edit' ? 'Stage updated.' : 'Stage created.');
      setDrawer(null);
      await refresh();
    } catch (error) {
      toast.error(crmError(error));
    } finally {
      setSaving(false);
    }
  };

  const runDelete = async (ids) => {
    const result = ids.length === 1 ? await removeDealStage(ids[0]).then(() => ({ failed: 0, failures: [] })).catch((error) => ({ failed: 1, failures: [{ message: crmError(error) }] })) : await bulkDealStages(ids, 'delete');
    const failures = result?.failures || result?.data?.failures || [];
    if (failures.length) toast.error(failures[0].message || 'Some stages could not be deleted.');
    else toast.success(ids.length === 1 ? 'Stage deleted.' : 'Selected unused stages deleted.');
    await refresh();
  };

  const setStatus = async (ids, isActive) => {
    try {
      if (ids.length === 1) await saveDealStage({ isActive, name: stages.find((stage) => stage.id === ids[0])?.name }, ids[0]);
      else await bulkDealStages(ids, isActive ? 'activate' : 'deactivate');
      toast.success(isActive ? 'Stage activated.' : 'Stage deactivated.');
      await refresh();
    } catch (error) {
      toast.error(crmError(error));
    }
  };

  const allSelected = stages.length > 0 && selected.length === stages.length;
  const active = stages.filter((stage) => stage.isActive !== false).length;
  const viewing = drawer?.mode === 'view';

  return (
    <div className="space-y-5">
      <PageHeader
        title="Stage Management"
        description="Manage CRM and deal pipeline stages."
        actions={<Button type="button" onClick={() => open('create')}><FontAwesomeIcon icon={faPlus} className="mr-2 size-3.5" />Add Stage</Button>}
      />
      <KpiGrid cards={[
        { title: 'Total Stages', value: stages.length, description: 'Configured for this company' },
        { title: 'Active Stages', value: active, description: 'Available for new deals' },
        { title: 'Inactive Stages', value: stages.length - active, description: 'Hidden from new assignments' },
      ]} />
      <div className="overflow-hidden rounded-lg border border-[#E2E8E5] bg-white">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E2E8E5] px-4 py-3">
          <p className="text-sm font-semibold text-[#172B24]">{loading ? 'Loading stages…' : `${stages.length} stages`}</p>
          {selected.length > 0 && (
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setStatus(selected, true)}>Activate</Button>
              <Button type="button" variant="outline" onClick={() => setStatus(selected, false)}>Deactivate</Button>
              <Button type="button" variant="outline" className="text-rose-700" onClick={() => setConfirm({ ids: selected })}>Delete</Button>
            </div>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#F7F9F8] text-xs uppercase tracking-wide text-[#718078]">
              <tr>
                <th className="px-4 py-3"><input aria-label="Select all stages" type="checkbox" checked={allSelected} onChange={(event) => setSelected(event.target.checked ? stages.map((stage) => stage.id) : [])} /></th>
                {['Stage Name', 'Order', 'Description', 'Color', 'Probability', 'Status', 'Created', 'Actions'].map((label) => <th key={label} className="px-4 py-3 font-semibold">{label}</th>)}
              </tr>
            </thead>
            <tbody>
              {stages.map((stage) => (
                <tr key={stage.id} className="border-t border-[#E2E8E5]">
                  <td className="px-4 py-3"><input aria-label={`Select ${stage.name}`} type="checkbox" checked={selected.includes(stage.id)} onChange={(event) => setSelected((current) => event.target.checked ? [...current, stage.id] : current.filter((id) => id !== stage.id))} /></td>
                  <td className="px-4 py-3 font-medium text-[#172B24]">{stage.name}</td>
                  <td className="px-4 py-3">{stage.order}</td>
                  <td className="max-w-[240px] truncate px-4 py-3 text-[#64748B]">{stage.description || '—'}</td>
                  <td className="px-4 py-3"><span className="inline-flex items-center gap-2"><span className="size-3 rounded-full border border-[#E2E8E5]" style={{ background: stage.color || '#163A2E' }} />{stage.color || '—'}</span></td>
                  <td className="px-4 py-3">{stage.probability ?? 0}%</td>
                  <td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-xs font-semibold ${stage.isActive === false ? 'bg-slate-100 text-slate-600' : 'bg-[#E8F1EC] text-[#163A2E]'}`}>{stage.isActive === false ? 'Inactive' : 'Active'}</span></td>
                  <td className="px-4 py-3 text-[#64748B]">{stage.createdAt ? new Date(stage.createdAt).toLocaleDateString('en-IN') : '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <Button type="button" size="icon" variant="ghost" aria-label={`View ${stage.name}`} onClick={() => open('view', stage)}><FontAwesomeIcon icon={faEye} /></Button>
                      <Button type="button" size="icon" variant="ghost" aria-label={`Edit ${stage.name}`} onClick={() => open('edit', stage)}><FontAwesomeIcon icon={faPen} /></Button>
                      <Button type="button" size="icon" variant="ghost" aria-label={stage.isActive === false ? `Activate ${stage.name}` : `Deactivate ${stage.name}`} onClick={() => setStatus([stage.id], stage.isActive === false)}><FontAwesomeIcon icon={stage.isActive === false ? faCheck : faBan} /></Button>
                      <Button type="button" size="icon" variant="ghost" aria-label={`Delete ${stage.name}`} onClick={() => setConfirm({ ids: [stage.id], name: stage.name, deals: stage._count?.deals || 0 })}><FontAwesomeIcon icon={faTrash} /></Button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && stages.length === 0 && <tr><td colSpan={9} className="px-4 py-10 text-center text-[#718078]">No stages configured yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      <FormDrawer open={Boolean(drawer)} onOpenChange={(open) => !open && setDrawer(null)} title={drawer?.mode === 'edit' ? 'Edit Stage' : drawer?.mode === 'view' ? 'Stage Details' : 'Add Stage'} description="Stage name is required. Order, probability, description, and color are optional." showFooter={!viewing} submitLabel={drawer?.mode === 'edit' ? 'Save Stage' : 'Create Stage'} loading={saving} onSubmit={save}>
        <div className="space-y-4">
          <div><Label htmlFor="stage-name">Stage Name</Label><Input id="stage-name" value={form.name} disabled={viewing} onChange={(event) => setForm({ ...form, name: event.target.value })} /></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label htmlFor="stage-order">Order</Label><Input id="stage-order" type="number" value={form.order} disabled={viewing} onChange={(event) => setForm({ ...form, order: event.target.value })} /></div>
            <div><Label htmlFor="stage-probability">Probability (%)</Label><Input id="stage-probability" type="number" min="0" max="100" value={form.probability} disabled={viewing} onChange={(event) => setForm({ ...form, probability: event.target.value })} /></div>
          </div>
          <div><Label htmlFor="stage-description">Description</Label><Textarea id="stage-description" value={form.description} disabled={viewing} onChange={(event) => setForm({ ...form, description: event.target.value })} /></div>
          <div><Label htmlFor="stage-color">Color</Label><Input id="stage-color" type="color" value={form.color} disabled={viewing} onChange={(event) => setForm({ ...form, color: event.target.value })} /></div>
          <label className="flex items-center gap-2 text-sm text-[#172B24]"><input type="checkbox" checked={form.isActive} disabled={viewing} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} />Active</label>
        </div>
      </FormDrawer>
      <ConfirmDialog
        open={Boolean(confirm)}
        onOpenChange={(open) => !open && setConfirm(null)}
        variant="destructive"
        title={confirm?.deals > 0 ? 'Stage is in use' : 'Delete stage?'}
        description={confirm?.deals > 0 ? `"${confirm.name}" is assigned to ${confirm.deals} deal${confirm.deals === 1 ? '' : 's'}. Deletion is blocked so those deals keep their stage. Deactivate it instead.` : 'This removes the stage only when no deals use it.'}
        confirmLabel={confirm?.deals > 0 ? 'Deactivate' : 'Delete'}
        onConfirm={() => (confirm?.deals > 0 ? setStatus(confirm.ids, false) : runDelete(confirm.ids))}
      />
    </div>
  );
}
