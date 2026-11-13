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
import api from '../../../lib/api';
import { bulkDealStages, crmError, loadDealStage, loadDealStages, loadLeadStage, loadLeadStages, reassignDealStage, reassignLeadStage, removeDealStage, removeLeadStage, saveDealStage, saveLeadStage } from '@/modules/crm/crm-api';
import { envelope, rowsOf } from '@/modules/templates/template-shared';

const STAGE_EMAIL_SAMPLE_VARS = {
  customerName: 'Sample Lead',
  leadName: 'Sample Lead',
  companyName: 'Sample Company Pvt Ltd',
  customerEmail: 'lead@example.com',
  leadPhone: '919876543210',
  oldStage: 'New',
  newStage: 'Current stage',
  salesOwner: 'CRM Executive',
  currentDate: new Date().toLocaleDateString('en-IN'),
  currentTime: new Date().toLocaleTimeString('en-IN'),
};

const STAGE_WHATSAPP_SAMPLE_VARS = {
  leadName: 'Sample Lead',
  name: 'Sample Lead',
  customerName: 'Sample Lead',
  companyName: 'Sample Company Pvt Ltd',
  businessName: 'Sample Company Pvt Ltd',
  phone: '919876543210',
  userName: 'CRM Executive',
  stage: 'Current stage',
};

const emptyForm = {
  type: 'Lead',
  name: '',
  order: '',
  probability: '',
  description: '',
  color: '#163A2E',
  bgColor: '#E8F1EC',
  borderColor: '#E2E8E5',
  isActive: true,
  emailEnabled: true,
  emailTemplateId: '',
  emailVariableMappingJson: '',
  emailTestAddress: '',
  whatsappEnabled: true,
  whatsappTemplateId: '',
  whatsappVariableMappingJson: '',
  whatsappTestPhone: '',
};
const keyOf = (stage) => `${stage.type}:${stage.id}`;
const usageOf = (stage) => (stage?.type === 'Lead'
  ? Number(stage.leadsCount || stage._count?.leads || 0)
  : Number(stage?.dealsCount ?? stage?._count?.deals ?? 0));
const usageInMessage = (message) => {
  const match = String(message || '').match(/used by (\d+)/i);
  return match ? Number(match[1]) : 0;
};

export function StageManagement() {
  const [stages, setStages] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [selected, setSelected] = React.useState([]);
  const [drawer, setDrawer] = React.useState(null);
  const [form, setForm] = React.useState(emptyForm);
  const [saving, setSaving] = React.useState(false);
  const [confirm, setConfirm] = React.useState(null);
  const [targetStageId, setTargetStageId] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [status, setStatus] = React.useState('ALL');
  const [sort, setSort] = React.useState('order');
  const [page, setPage] = React.useState(1);
  const [emailTemplates, setEmailTemplates] = React.useState([]);
  const [metaTemplates, setMetaTemplates] = React.useState([]);
  const [emailPreview, setEmailPreview] = React.useState(null);
  const [emailPreviewLoading, setEmailPreviewLoading] = React.useState(false);
  const [emailTestSending, setEmailTestSending] = React.useState(false);
  const [waPreview, setWaPreview] = React.useState(null);
  const [waPreviewLoading, setWaPreviewLoading] = React.useState(false);
  const [waTestSending, setWaTestSending] = React.useState(false);

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
      if (status === 'ACTIVE' && stage.isActive === false) return false;
      if (status === 'INACTIVE' && stage.isActive !== false) return false;
      if (!query) return true;
      return [stage.name, stage.description, stage.key].some((value) => String(value || '').toLowerCase().includes(query));
    });
    const valueOf = (stage) => {
      if (sort === 'name') return stage.name || '';
      if (sort === 'status') return stage.isActive === false ? 'Inactive' : 'Active';
      if (sort === 'created') return stage.createdAt || '';
      return stage.order ?? stage.sortOrder ?? 0;
    };
    return [...rows].sort((a, b) => String(valueOf(a)).localeCompare(String(valueOf(b)), undefined, { numeric: true }));
  }, [stages, search, status, sort]);

  const pageSize = 20;
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);
  React.useEffect(() => { if (page > pageCount) setPage(pageCount); }, [page, pageCount]);

  const fillForm = (stage) => setForm(stage ? {
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
      emailTemplateId: stage.emailTemplateId || stage.emailTemplate?.id || '',
      emailVariableMappingJson: stage.emailVariableMapping ? JSON.stringify(stage.emailVariableMapping, null, 2) : '',
      emailTestAddress: '',
      whatsappEnabled: stage.whatsappEnabled !== false,
      whatsappTemplateId: stage.whatsappTemplateId || stage.whatsappTemplate?.id || '',
      whatsappVariableMappingJson: stage.whatsappVariableMapping ? JSON.stringify(stage.whatsappVariableMapping, null, 2) : '',
      whatsappTestPhone: '',
    } : emptyForm);

  const stageEmailVariables = React.useCallback(() => {
    const vars = {
      ...STAGE_EMAIL_SAMPLE_VARS,
      newStage: form.name || STAGE_EMAIL_SAMPLE_VARS.newStage,
      stage: form.name || STAGE_EMAIL_SAMPLE_VARS.newStage,
    };
    if (!form.emailVariableMappingJson?.trim()) return vars;
    try {
      const mapping = JSON.parse(form.emailVariableMappingJson);
      Object.entries(mapping).forEach(([key, source]) => {
        const src = String(source || '').trim();
        vars[key] = vars[src] ?? src;
      });
    } catch {
      /* ignore */
    }
    return vars;
  }, [form.name, form.emailVariableMappingJson]);

  const selectedEmailTemplate = React.useMemo(
    () => emailTemplates.find((item) => String(item.id) === String(form.emailTemplateId)),
    [emailTemplates, form.emailTemplateId],
  );

  const runEmailPreview = async () => {
    if (!form.emailTemplateId) {
      toast.error('Select an active email template first.');
      return;
    }
    setEmailPreviewLoading(true);
    try {
      const tpl = selectedEmailTemplate;
      const payload = await api.post('/email/templates/preview', {
        subject: tpl?.subject || 'Stage update',
        body: tpl?.body || '',
        variables: stageEmailVariables(),
      });
      const body = payload?.data || payload;
      setEmailPreview(body);
      toast.success('Email preview generated.');
    } catch (error) {
      toast.error(crmError(error));
    } finally {
      setEmailPreviewLoading(false);
    }
  };

  const runEmailTestSend = async () => {
    if (!form.emailTemplateId) {
      toast.error('Select an active email template first.');
      return;
    }
    const to = String(form.emailTestAddress || '').trim();
    if (!to) {
      toast.error('Enter a test email address.');
      return;
    }
    setEmailTestSending(true);
    try {
      await api.post('/email/templates/test-send', {
        templateId: Number(form.emailTemplateId),
        to,
        variables: stageEmailVariables(),
      });
      toast.success('Test email sent.');
    } catch (error) {
      toast.error(crmError(error));
    } finally {
      setEmailTestSending(false);
    }
  };

  const stageWhatsAppVariables = React.useCallback(() => {
    const vars = { ...STAGE_WHATSAPP_SAMPLE_VARS, stage: form.name || STAGE_WHATSAPP_SAMPLE_VARS.stage };
    if (!form.whatsappVariableMappingJson?.trim()) return vars;
    try {
      const mapping = JSON.parse(form.whatsappVariableMappingJson);
      Object.entries(mapping).forEach(([key, source]) => {
        const src = String(source || '').trim();
        vars[key] = vars[src] ?? src;
      });
    } catch {
      /* ignore until save validates JSON */
    }
    return vars;
  }, [form.name, form.whatsappVariableMappingJson]);

  const selectedMetaTemplate = React.useMemo(
    () => metaTemplates.find((item) => String(item.id) === String(form.whatsappTemplateId)),
    [metaTemplates, form.whatsappTemplateId],
  );

  const runWhatsappPreview = async () => {
    if (!form.whatsappTemplateId) {
      toast.error('Select an approved Meta template first.');
      return;
    }
    setWaPreviewLoading(true);
    try {
      const payload = envelope(await api.post('/templates/meta/preview', {
        templateId: Number(form.whatsappTemplateId),
        body: selectedMetaTemplate?.body,
        headerContent: selectedMetaTemplate?.headerContent,
        variables: stageWhatsAppVariables(),
      }));
      setWaPreview(payload?.preview || payload?.body || payload);
      toast.success('Preview generated.');
    } catch (error) {
      toast.error(crmError(error));
    } finally {
      setWaPreviewLoading(false);
    }
  };

  const runWhatsappTestSend = async () => {
    if (!form.whatsappTemplateId) {
      toast.error('Select an approved Meta template first.');
      return;
    }
    const phone = String(form.whatsappTestPhone || '').trim();
    if (!phone) {
      toast.error('Enter a test mobile number.');
      return;
    }
    setWaTestSending(true);
    try {
      await api.post('/templates/meta/test-send', {
        templateId: Number(form.whatsappTemplateId),
        templateName: selectedMetaTemplate?.templateName,
        language: selectedMetaTemplate?.language || 'en_US',
        to: phone,
        variables: stageWhatsAppVariables(),
      });
      toast.success('Test WhatsApp sent.');
    } catch (error) {
      toast.error(crmError(error));
    } finally {
      setWaTestSending(false);
    }
  };

  const open = async (mode, stage) => {
    setDrawer({ mode, stage });
    fillForm(stage);
    if (stage?.type === 'Lead') {
      try {
        const [emailPayload, metaPayload] = await Promise.all([
          api.get('/email/templates', { params: { page: 1, limit: 100, status: 'ACTIVE' } }),
          api.get('/templates/meta', { params: { page: 1, limit: 100, status: 'APPROVED' } }),
        ]);
        setEmailTemplates(rowsOf(emailPayload).filter((row) => row.isActive !== false));
        setMetaTemplates(rowsOf(envelope(metaPayload)).filter((row) => {
          const metaId = String(row.metaTemplateId || '');
          return row.status === 'APPROVED' && row.isLocalActive !== false && metaId && !metaId.startsWith('seed_');
        }));
      } catch {
        setEmailTemplates([]);
        setMetaTemplates([]);
      }
    }
    if (!stage?.id) return;
    try {
      const detail = stage.type === 'Deal' ? await loadDealStage(stage.id) : await loadLeadStage(stage.id);
      fillForm({ ...stage, ...detail, type: stage.type });
    } catch (error) {
      toast.error(crmError(error));
    }
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
      else {
        let emailVariableMapping;
        let whatsappVariableMapping;
        if (form.emailVariableMappingJson?.trim()) {
          try {
            emailVariableMapping = JSON.parse(form.emailVariableMappingJson);
          } catch {
            toast.error('Email variable mapping must be valid JSON.');
            setSaving(false);
            return;
          }
        }
        if (form.whatsappVariableMappingJson?.trim()) {
          try {
            whatsappVariableMapping = JSON.parse(form.whatsappVariableMappingJson);
          } catch {
            toast.error('WhatsApp variable mapping must be valid JSON.');
            setSaving(false);
            return;
          }
        }
        await saveLeadStage({
          ...form,
          emailTemplateId: form.emailTemplateId ? Number(form.emailTemplateId) : null,
          emailVariableMapping,
          whatsappTemplateId: form.whatsappTemplateId ? Number(form.whatsappTemplateId) : null,
          whatsappVariableMapping,
        }, id);
      }
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
      try { await removeDealStage(deals[0].id); } catch (error) {
        const message = crmError(error);
        const used = usageInMessage(message);
        if (used > 0) {
          setTargetStageId('');
          setConfirm({ ids: [keyOf(deals[0])], key: keyOf(deals[0]), stageId: deals[0].id, name: deals[0].name, used, type: 'Deal' });
          return;
        }
        failures.push(message);
      }
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

  const reassignAndDelete = async () => {
    if (!confirm?.stageId || !targetStageId) {
      toast.error(`Choose another ${confirm?.type === 'Deal' ? 'deal' : 'lead'} stage first.`);
      return;
    }
    try {
      if (confirm.type === 'Deal') await reassignDealStage(confirm.stageId, targetStageId);
      else await reassignLeadStage(confirm.stageId, targetStageId);
      toast.success('Records were moved and the stage was deleted.');
      setSelected((current) => current.filter((key) => key !== confirm.key));
      await refresh();
    } catch (error) {
      toast.error(crmError(error));
    }
  };

  const replacementStages = confirm?.used > 0
    ? stages.filter((stage) => stage.type === confirm.type && String(stage.id) !== String(confirm.stageId))
    : [];

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
          <select aria-label="Stage status" className="h-8 rounded-md border border-[#E2E8E5] bg-white px-2 text-sm" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}><option value="ALL">All statuses</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select>
          <select aria-label="Sort stages" className="h-8 rounded-md border border-[#E2E8E5] bg-white px-2 text-sm" value={sort} onChange={(event) => setSort(event.target.value)}><option value="order">Display order</option><option value="name">Name</option><option value="status">Status</option><option value="created">Created date</option></select>
          {selected.length > 0 && <div className="ml-auto flex flex-wrap gap-2"><Button type="button" variant="outline" onClick={() => setActive(selected, true)}>Activate</Button><Button type="button" variant="outline" onClick={() => setActive(selected, false)}>Deactivate</Button><Button type="button" variant="outline" className="text-rose-700" onClick={() => setConfirm({ ids: selected })}>Delete</Button></div>}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[980px] w-full text-left text-sm">
            <thead className="bg-[#F7F9F8] text-xs uppercase tracking-wide text-[#718078]">
              <tr>
                <th className="px-4 py-3"><input aria-label="Select visible stages" type="checkbox" checked={allVisibleSelected} onChange={(event) => setSelected(event.target.checked ? [...new Set([...selected, ...visible.map(keyOf)])] : selected.filter((key) => !visible.some((stage) => keyOf(stage) === key)))} /></th>
                {['Stage Name', 'Description', 'Color', 'Probability', 'Order', 'Status', 'Created', 'Actions'].map((label) => <th key={label} className="px-4 py-3 font-semibold">{label}</th>)}
              </tr>
            </thead>
            <tbody>
              {visible.map((stage) => (
                <tr key={keyOf(stage)} className="border-t border-[#E2E8E5]">
                  <td className="px-4 py-3"><input aria-label={`Select ${stage.name}`} type="checkbox" checked={selected.includes(keyOf(stage))} onChange={(event) => setSelected((current) => event.target.checked ? [...current, keyOf(stage)] : current.filter((key) => key !== keyOf(stage)))} /></td>
                  <td className="px-4 py-3 font-medium text-[#172B24]">{stage.name}</td>
                  <td className="max-w-[220px] truncate px-4 py-3 text-[#64748B]">{stage.description || '—'}</td>
                  <td className="px-4 py-3"><span className="inline-flex items-center gap-2"><span className="size-3 rounded-full border border-[#E2E8E5]" style={{ background: stage.color || '#163A2E' }} />{stage.color || '—'}</span></td>
                  <td className="px-4 py-3">{stage.type === 'Deal' ? `${stage.probability ?? 0}%` : '—'}</td>
                  <td className="px-4 py-3">{stage.order ?? stage.sortOrder ?? '—'}</td>
                  <td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-xs font-semibold ${stage.isActive === false ? 'bg-slate-100 text-slate-600' : 'bg-[#E8F1EC] text-[#163A2E]'}`}>{stage.isActive === false ? 'Inactive' : 'Active'}</span></td>
                  <td className="px-4 py-3 text-[#64748B]">{stage.createdAt ? new Date(stage.createdAt).toLocaleDateString('en-IN') : '—'}</td>
                  <td className="px-4 py-3"><div className="flex flex-wrap gap-1"><Button type="button" size="sm" variant="outline" onClick={() => open('view', stage)}>View</Button><Button type="button" size="sm" variant="outline" onClick={() => open('edit', stage)}>Edit</Button><Button type="button" size="sm" variant="outline" onClick={() => setActive([keyOf(stage)], stage.isActive === false)}>{stage.isActive === false ? 'Activate' : 'Deactivate'}</Button><Button type="button" size="sm" variant="outline" className="text-rose-700" onClick={() => { setTargetStageId(''); setConfirm({ ids: [keyOf(stage)], key: keyOf(stage), stageId: stage.id, name: stage.name, used: usageOf(stage), type: stage.type }); }}>Delete</Button></div></td>
                </tr>
              ))}
              {!loading && visible.length === 0 && <tr><td colSpan={9} className="px-4 py-10 text-center text-[#718078]">{search || status !== 'ALL' ? 'No stages match these filters.' : 'No stages configured yet.'}</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-[#E2E8E5] px-4 py-3 text-sm text-[#64748B]">
          <span>{loading ? 'Loading stages…' : `${filtered.length} stages`}</span>
          <div className="flex items-center gap-2"><Button type="button" size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button><span>Page {page} of {pageCount}</span><Button type="button" size="sm" variant="outline" disabled={page >= pageCount} onClick={() => setPage(page + 1)}>Next</Button></div>
        </div>
      </div>
      <FormDrawer open={Boolean(drawer)} onOpenChange={(open) => !open && setDrawer(null)} title={drawer?.mode === 'edit' ? 'Edit Stage' : drawer?.mode === 'view' ? 'Stage Details' : 'Add Stage'} description="Stage name is required." showFooter={!viewing} submitLabel={drawer?.mode === 'edit' ? 'Update Stage' : 'Save Stage'} loading={saving} onSubmit={save}>
        <div className="space-y-4">
          <div><Label htmlFor="stage-name">Stage Name</Label><Input id="stage-name" value={form.name} disabled={viewing} onChange={(event) => setForm({ ...form, name: event.target.value })} /></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label htmlFor="stage-order">Display Order</Label><Input id="stage-order" type="number" value={form.order} disabled={viewing} onChange={(event) => setForm({ ...form, order: event.target.value })} /></div>
            {dealForm && <div><Label htmlFor="stage-probability">Probability (%)</Label><Input id="stage-probability" type="number" min="0" max="100" value={form.probability} disabled={viewing} onChange={(event) => setForm({ ...form, probability: event.target.value })} /></div>}
          </div>
          {dealForm && <div><Label htmlFor="stage-description">Description</Label><Textarea id="stage-description" value={form.description} disabled={viewing} onChange={(event) => setForm({ ...form, description: event.target.value })} /></div>}
          <div><Label htmlFor="stage-color">Color</Label><Input id="stage-color" type="color" value={form.color} disabled={viewing} onChange={(event) => setForm({ ...form, color: event.target.value })} /></div>
          <label className="flex items-center gap-2 text-sm text-[#172B24]"><input type="checkbox" checked={form.isActive} disabled={viewing} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} />Active</label>
          {!dealForm ? (
            <h3 className="mt-2 border-t border-[#E2E8E5] pt-4 text-sm font-bold text-[#172B24]">Email stage automation</h3>
          ) : null}
          {!dealForm && <label className="flex items-center gap-2 text-sm text-[#172B24]"><input type="checkbox" checked={form.emailEnabled} disabled={viewing} onChange={(event) => setForm({ ...form, emailEnabled: event.target.checked })} />Enable automatic email on stage entry</label>}
          {!dealForm && (
            <>
              <Label>Email template</Label>
              <select value={form.emailTemplateId || ''} disabled={viewing} onChange={(event) => setForm({ ...form, emailTemplateId: event.target.value })} className="h-10 w-full rounded-md border border-[#E2E8E5] bg-white px-3 text-sm">
                <option value="">No template</option>
                {emailTemplates.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}{item.key ? ` · ${item.key}` : ''}</option>
                ))}
              </select>
              <Label>Variable mapping (JSON)</Label>
              <Textarea value={form.emailVariableMappingJson} disabled={viewing} onChange={(event) => setForm({ ...form, emailVariableMappingJson: event.target.value })} placeholder='{"customerName":"leadName","companyName":"companyName"}' rows={4} className="font-mono text-xs" />
              {!viewing && (
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button type="button" size="sm" variant="outline" disabled={emailPreviewLoading} onClick={runEmailPreview}>
                    {emailPreviewLoading ? 'Preview…' : 'Preview email'}
                  </Button>
                </div>
              )}
              {emailPreview ? (
                <div className="rounded-md border border-[#E2E8E5] bg-[#F7F9F8] p-3 text-sm text-[#172B24] space-y-2">
                  {emailPreview.subject ? <p className="font-semibold">Subject: {emailPreview.subject}</p> : null}
                  <div className="whitespace-pre-wrap">{emailPreview.body || JSON.stringify(emailPreview, null, 2)}</div>
                </div>
              ) : null}
              {!viewing && (
                <>
                  <Label htmlFor="stage-email-test">Test email address</Label>
                  <Input id="stage-email-test" value={form.emailTestAddress} onChange={(event) => setForm({ ...form, emailTestAddress: event.target.value })} placeholder="you@company.com" />
                  <Button type="button" size="sm" variant="outline" disabled={emailTestSending} onClick={runEmailTestSend}>
                    {emailTestSending ? 'Sending…' : 'Send test email'}
                  </Button>
                </>
              )}
            </>
          )}
          {!dealForm ? (
            <h3 className="mt-2 border-t border-[#E2E8E5] pt-4 text-sm font-bold text-[#172B24]">WhatsApp stage automation</h3>
          ) : null}
          {!dealForm && <label className="flex items-center gap-2 text-sm text-[#172B24]"><input type="checkbox" checked={form.whatsappEnabled} disabled={viewing} onChange={(event) => setForm({ ...form, whatsappEnabled: event.target.checked })} />Enable automatic WhatsApp on stage entry</label>}
          {!dealForm && (
            <>
              <Label>Approved Meta template</Label>
              <select value={form.whatsappTemplateId || ''} disabled={viewing} onChange={(event) => setForm({ ...form, whatsappTemplateId: event.target.value })} className="h-10 w-full rounded-md border border-[#E2E8E5] bg-white px-3 text-sm">
                <option value="">WhatsApp: Not configured</option>
                {metaTemplates.map((item) => (
                  <option key={item.id} value={item.id}>{item.name} · {item.templateName} · {item.language}</option>
                ))}
              </select>
              <Label>Variable mapping (JSON)</Label>
              <Textarea value={form.whatsappVariableMappingJson} disabled={viewing} onChange={(event) => setForm({ ...form, whatsappVariableMappingJson: event.target.value })} placeholder='{"leadName":"{{leadName}}","companyName":"{{companyName}}"}' rows={4} className="font-mono text-xs" />
              <p className="text-xs text-[#718078]">When a lead enters this stage, the approved template is sent with mapped lead fields. Details Send also triggers the Send Details package when configured.</p>
              {!viewing && (
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button type="button" size="sm" variant="outline" disabled={waPreviewLoading} onClick={runWhatsappPreview}>
                    {waPreviewLoading ? 'Preview…' : 'Preview message'}
                  </Button>
                </div>
              )}
              {waPreview ? (
                <div className="rounded-md border border-[#E2E8E5] bg-[#F7F9F8] p-3 text-sm text-[#172B24] whitespace-pre-wrap">
                  {typeof waPreview === 'string' ? waPreview : (waPreview.body || JSON.stringify(waPreview, null, 2))}
                </div>
              ) : null}
              {!viewing && (
                <>
                  <Label htmlFor="stage-wa-test-phone">Test mobile number</Label>
                  <Input
                    id="stage-wa-test-phone"
                    value={form.whatsappTestPhone}
                    onChange={(event) => setForm({ ...form, whatsappTestPhone: event.target.value })}
                    placeholder="e.g. 919876543210"
                  />
                  <Button type="button" size="sm" variant="outline" disabled={waTestSending} onClick={runWhatsappTestSend}>
                    {waTestSending ? 'Sending…' : 'Send test WhatsApp'}
                  </Button>
                </>
              )}
            </>
          )}
        </div>
      </FormDrawer>
      <ConfirmDialog open={Boolean(confirm)} onOpenChange={(open) => !open && setConfirm(null)} variant="destructive" title={confirm?.used > 0 ? 'Stage is in use' : 'Delete stage?'} description={confirm?.used > 0 ? (
        <span className="block space-y-3">
          <span className="block">{`"${confirm.name}" is used by ${confirm.used} ${confirm.type === 'Lead' ? 'lead' : 'deal'} record${confirm.used === 1 ? '' : 's'}. Those records are not deleted. Move them to another ${confirm.type === 'Lead' ? 'lead' : 'deal'} stage, or deactivate this stage.`}</span>
          {replacementStages.length > 0 ? (
            <select aria-label="Replacement stage" className="h-9 w-full rounded-md border border-[#E2E8E5] bg-white px-2 text-sm text-[#172B24]" value={targetStageId} onChange={(event) => setTargetStageId(event.target.value)}>
              <option value="">Select a {confirm.type === 'Lead' ? 'lead' : 'deal'} stage</option>
              {replacementStages.map((stage) => <option key={keyOf(stage)} value={stage.id}>{stage.name}{stage.isActive === false ? ' (inactive)' : ''}</option>)}
            </select>
          ) : <span className="block">No other active {confirm.type === 'Lead' ? 'lead' : 'deal'} stage is available. Deactivate this stage instead.</span>}
        </span>
      ) : 'This stage is not used by any records. It will be removed from the list and from mobile filters.'} confirmLabel={confirm?.used > 0 ? (replacementStages.length && targetStageId ? 'Move and delete' : 'Deactivate') : 'Delete'} onConfirm={() => (confirm?.used > 0 ? (replacementStages.length && targetStageId ? reassignAndDelete() : setActive(confirm.ids, false)) : runDelete(confirm.ids))} />
    </div>
  );
}
