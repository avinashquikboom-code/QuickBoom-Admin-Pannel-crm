'use client';

import * as React from 'react';
import api from '../../../lib/api';
import { PageHeader } from '@/components/layout/PageHeader';
import { KpiGrid } from '@/components/common/KpiCard';
import { FormDrawer } from '@/components/common/drawers/FormDrawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import { faEnvelope, faMessage, faDownload, faRotate, faDiagramProject } from '@fortawesome/free-solid-svg-icons';
import { toast } from '@/hooks/use-toast';
import { loadLeadStages, saveLeadStage } from '@/modules/crm/crm-api';
import { EmailTemplates } from './EmailTemplates';
import {
  downloadCsv,
  rowsOf,
  pageOf,
  envelope,
  Pager,
  Field,
  TemplateTable,
} from './template-shared';

export function TemplateManagement({ slug }) {
  if (slug === 'stage-notifications') return <StageNotifications />;
  if (slug === 'meta-templates') return <MetaTemplates />;
  return <EmailTemplates />;
}

function Shell({ title, icon, description, children }) {
  return (
    <div className="space-y-4">
      <PageHeader title={title} icon={icon} description={description} />
      {children}
    </div>
  );
}

function Toolbar({ search, setSearch, status, setStatus, statuses, extra, onExport }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, code, or status" className="max-w-xs" />
      <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-10 rounded-md border border-[#E2E8E5] bg-white px-3 text-sm text-[#172B24]">
        {statuses.map((item) => <option key={item} value={item}>{item}</option>)}
      </select>
      {extra}
      <Button type="button" variant="outline" onClick={onExport}><FontAwesomeIcon icon={faDownload} className="mr-2" />Export CSV</Button>
    </div>
  );
}

function MetaTemplates() {
  const [rows, setRows] = React.useState([]);
  const [stats, setStats] = React.useState({});
  const [search, setSearch] = React.useState('');
  const [status, setStatus] = React.useState('ALL');
  const [language, setLanguage] = React.useState('ALL');
  const [languageChoices, setLanguageChoices] = React.useState(['ALL']);
  const [category, setCategory] = React.useState('ALL');
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(10);
  const [pages, setPages] = React.useState(1);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [syncing, setSyncing] = React.useState(false);
  const [syncInfo, setSyncInfo] = React.useState(null);
  const [selected, setSelected] = React.useState(null);
  const [testPhone, setTestPhone] = React.useState('');
  const [testCountry, setTestCountry] = React.useState('+91');
  const [testVariables, setTestVariables] = React.useState({});
  const [testSending, setTestSending] = React.useState(false);
  const [testResult, setTestResult] = React.useState(null);
  const [detailsTab, setDetailsTab] = React.useState('DETAILS');

  const load = React.useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const payload = envelope(await api.get('/templates/meta', { params: { page, limit, search: search || undefined, status: status === 'ALL' ? undefined : status, language: language === 'ALL' ? undefined : language, category: category === 'ALL' ? undefined : category } }));
      const list = rowsOf(payload);
      const pagination = pageOf(payload, { page, totalPages: 1, total: list.length });
      setRows(list);
      if (language === 'ALL') setLanguageChoices(['ALL', ...Array.from(new Set(list.map((row) => row.language).filter(Boolean)))]);
      setPages(Math.max(1, Number(pagination.totalPages) || 1));
      setTotal(Number(pagination.total) || list.length);
      if (payload?.stats) setStats(payload.stats);
    } catch (err) {
      setError(err?.response?.data?.message || 'Meta templates could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, status, language, category]);

  React.useEffect(() => { load(); }, [load]);

  async function sync() {
    setSyncing(true);
    try {
      const result = envelope(await api.post('/templates/meta/sync', {}));
      setSyncInfo(result);
      if (result?.success === false) toast.error(result?.message || 'Meta sync failed.');
      else toast.success(result?.message || 'Meta templates synchronized');
      load();
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || 'Meta sync failed. Check the WhatsApp access token and WABA ID.';
      setSyncInfo({ success: false, message });
      toast.error(message);
    } finally {
      setSyncing(false);
    }
  }

  return (
    <Shell title="Meta Templates" icon={faMessage} description="WhatsApp Business templates stored for this company.">
      <KpiGrid cards={[
        { title: 'Templates', value: stats.total || 0, icon: faMessage },
        { title: 'Approved', value: stats.approved || 0, icon: faMessage },
        { title: 'Pending', value: stats.pending || 0, icon: faMessage },
        { title: 'Rejected', value: stats.rejected || 0, icon: faMessage },
        { title: 'Paused', value: stats.paused || 0, icon: faMessage },
        { title: 'Disabled', value: stats.disabled || 0, icon: faMessage },
      ]} />
      <div className="flex flex-wrap items-center gap-2">
        <Toolbar search={search} setSearch={(value) => { setSearch(value); setPage(1); }} status={status} setStatus={(value) => { setStatus(value); setPage(1); }} statuses={['ALL', 'APPROVED', 'PENDING', 'REJECTED', 'PAUSED', 'DISABLED']} onExport={() => downloadCsv('meta-templates.csv', [{ key: 'name', label: 'Name' }, { key: 'templateName', label: 'Code' }, { key: 'language', label: 'Language' }, { key: 'status', label: 'Status' }], rows)} extra={<Button type="button" variant="outline" disabled={syncing} onClick={sync}><FontAwesomeIcon icon={faRotate} className="mr-2" />{syncing ? 'Syncing' : 'Sync from Meta'}</Button>} />
        <select value={category} onChange={(event) => { setCategory(event.target.value); setPage(1); }} className="h-10 rounded-md border border-[#E2E8E5] bg-white px-3 text-sm text-[#172B24]">
          {['ALL', 'UTILITY', 'MARKETING', 'AUTHENTICATION'].map((item) => <option key={item} value={item}>{item === 'ALL' ? 'All categories' : item}</option>)}
        </select>
        <select value={language} onChange={(event) => { setLanguage(event.target.value); setPage(1); }} className="h-10 rounded-md border border-[#E2E8E5] bg-white px-3 text-sm text-[#172B24]">
          {languageChoices.map((item) => <option key={item} value={item}>{item === 'ALL' ? 'All languages' : item}</option>)}
        </select>
      </div>
      {syncInfo ? <p className={`text-sm ${syncInfo.success === false ? 'text-red-600' : 'text-[#718078]'}`}>Fetched {syncInfo.fetched ?? 0}, added {syncInfo.created ?? 0}, updated {syncInfo.updated ?? 0}, unchanged {syncInfo.unchanged ?? 0}, failed {syncInfo.failed?.length ?? 0}. {syncInfo.message}</p> : null}
      <div className="hidden md:block"><TemplateTable loading={loading} error={error} rows={rows} empty="No WhatsApp templates are stored for this company. Use Sync from Meta after the WhatsApp account is configured." columns={['Name', 'Code', 'Language', 'Category', 'Approval', 'Actions']} render={(row) => (
        <tr key={row.id} className="border-t border-[#E2E8E5]">
          <td className="px-3 py-3">{row.name}</td>
          <td className="px-3 py-3">{row.templateName || row.key}</td>
          <td className="px-3 py-3">{row.language}</td>
          <td className="px-3 py-3">{row.category}</td>
          <td className="px-3 py-3"><span className="rounded-full bg-[#E8F1EC] px-2 py-1 text-xs font-semibold text-[#163A2E]">{row.status}</span></td>
          <td className="px-3 py-3 whitespace-nowrap">
            <button type="button" className="mr-3 text-[#163A2E]" onClick={() => setSelected(row)}>View</button>
            <button type="button" className="text-[#163A2E]" onClick={async () => { await api.patch(`/templates/meta/${row.id}/toggle`, {}); load(); }}>{row.isLocalActive ? 'Deactivate' : 'Activate'}</button>
          </td>
        </tr>
      )} /></div>
      <div className="space-y-3 md:hidden">{loading ? <p className="rounded-xl border p-5 text-sm">Loading templates…</p> : error ? <p className="rounded-xl border border-red-200 p-4 text-sm text-red-700">{error}</p> : rows.length ? rows.map((row) => <article key={row.id} className="space-y-2 rounded-xl border border-[#E2E8E5] bg-white p-4"><div className="flex items-start justify-between gap-3"><h3 className="min-w-0 break-words font-semibold">{row.name}</h3><span className="shrink-0 rounded-full bg-[#E8F1EC] px-2 py-1 text-xs">{row.status}</span></div><p className="break-all text-xs text-[#718078]">{row.templateName || row.key}</p><p className="text-xs text-[#718078]">{row.category} · {row.language}</p><div className="flex gap-2"><Button type="button" variant="outline" onClick={() => { setSelected(row); setDetailsTab('DETAILS'); setTestResult(null); }}>View</Button><Button type="button" variant="outline" onClick={async () => { await api.patch(`/templates/meta/${row.id}/toggle`, {}); load(); }}>{row.isLocalActive ? 'Deactivate' : 'Activate'}</Button></div></article>) : <p className="rounded-xl border p-5 text-sm text-[#718078]">No templates found.</p>}</div>
      <Pager page={page} pages={pages} limit={limit} total={total} onPage={setPage} onLimit={(value) => { setLimit(value); setPage(1); }} />
      {selected ? <div className="fixed inset-0 z-50 bg-black/25" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}><aside role="dialog" aria-modal="true" aria-label="Template Details" className="ml-auto flex h-[100dvh] w-full max-w-[480px] flex-col overflow-hidden border-l bg-white shadow-xl"><div className="flex items-start justify-between border-b p-5"><div><p className="text-xs font-semibold uppercase tracking-wide text-[#718078]">Template Details</p><h2 className="mt-1 break-words text-lg font-bold">{selected.name}</h2><span className="mt-2 inline-flex rounded-full bg-[#E8F1EC] px-2 py-1 text-xs">{selected.status}</span></div><button className="min-h-11 min-w-11 rounded-lg border" aria-label="Close details" onClick={() => setSelected(null)}>×</button></div><div className="flex gap-2 border-b p-3"><Button type="button" variant="outline" onClick={() => { setDetailsTab('DETAILS'); setTestResult(null); }}>Details</Button><Button type="button" variant="outline" onClick={() => setDetailsTab('META')}>Meta Response</Button></div><div className="flex-1 space-y-4 overflow-y-auto p-5">{detailsTab === 'DETAILS' ? <><TemplateDetails template={selected}/><section className="space-y-3 rounded-xl border p-4"><h3 className="font-semibold">Test Send</h3><div className="grid grid-cols-[110px_1fr] gap-2"><select aria-label="Country code" value={testCountry} onChange={(e) => setTestCountry(e.target.value)} className="h-11 min-w-0 rounded-md border px-2">{[['+91','India +91'],['+1','US/Canada +1'],['+44','UK +44'],['+61','Australia +61'],['+971','UAE +971']].map(([code,label])=><option key={code} value={code}>{label}</option>)}</select><input aria-label="Test recipient phone" value={testPhone} onChange={(e)=>setTestPhone(e.target.value)} placeholder="Phone number" className="h-11 min-w-0 rounded-md border px-3"/></div>{Array.from(new Set([...(selected.headerContent || ''), ...(selected.body || '')].join('').match(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g) || [])).map((token, index) => { const key=token.replace(/[{}\s]/g,''); return <label key={key} className="block text-sm">{key}<input className="mt-1 h-11 w-full rounded-md border px-3" value={testVariables[key] || ''} onChange={(e)=>setTestVariables({...testVariables,[key]:e.target.value})} placeholder={`Value for ${key}`}/></label>; })}<Button type="button" disabled={testSending || !/^\+?[0-9 ()-]{7,20}$/.test(`${testCountry}${testPhone}`)} onClick={async()=>{setTestSending(true);setTestResult(null);try{const result=envelope(await api.post('/templates/meta/test-send',{templateId:selected.id,to:`${testCountry}${testPhone.replace(/\D/g,'')}`,variables:testVariables}));setTestResult({ok:true,text:`Accepted by Meta · ${result.messageId || result.status || 'request accepted'}`});}catch(err){setTestResult({ok:false,text:err?.response?.data?.message || err?.message || 'Test send failed'});}finally{setTestSending(false);}}}>{testSending ? 'Sending…' : 'Send Test'}</Button>{testResult ? <p role="status" className={`break-words text-sm ${testResult.ok?'text-emerald-700':'text-red-700'}`}>{testResult.text}</p>:null}</section></> : <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-xl bg-slate-50 p-4 text-xs">{selected.metaResponse ? JSON.stringify(selected.metaResponse,null,2) : selected.rawMetaResponse ? JSON.stringify(selected.rawMetaResponse,null,2) : selected.metaData ? JSON.stringify(selected.metaData,null,2) : 'No Meta response was stored for this template.'}</pre>}</div></aside></div> : null}
    </Shell>
  );
}

function TemplateDetails({ template }) {
  const buttons = Array.isArray(template.buttons) ? template.buttons : [];
  const variables = Array.isArray(template.variables) ? template.variables : [];
  return (
    <div className="space-y-3 text-sm text-[#172B24]">
      <p><span className="text-[#718078]">Code:</span> {template.templateName || template.key || '—'}</p>
      <p><span className="text-[#718078]">Language:</span> {template.language}</p>
      <p><span className="text-[#718078]">Category:</span> {template.category}</p>
      <p><span className="text-[#718078]">Approval:</span> {template.status}</p>
      <p><span className="text-[#718078]">Header:</span> {template.headerContent || template.headerType || 'None'}</p>
      <p className="whitespace-pre-wrap"><span className="text-[#718078]">Body:</span> {template.body}</p>
      <p><span className="text-[#718078]">Footer:</span> {template.footer || '—'}</p>
      <p><span className="text-[#718078]">Buttons:</span> {buttons.length ? buttons.map((button) => button.text || button.type).join(', ') : '—'}</p>
      <p><span className="text-[#718078]">Variables:</span> {variables.length ? variables.join(', ') : '—'}</p>
      {template.rejectionReason ? <p className="text-red-600">Rejection reason: {template.rejectionReason}</p> : null}
    </div>
  );
}

function StageNotifications() {
  const [stages, setStages] = React.useState([]);
  const [emails, setEmails] = React.useState([]);
  const [whatsapp, setWhatsapp] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [form, setForm] = React.useState(null);
  const [saving, setSaving] = React.useState(false);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [stageRows, emailPayload, metaPayload] = await Promise.all([
        loadLeadStages(),
        api.get('/email/templates', { params: { page: 1, limit: 100, status: 'ACTIVE' } }),
        api.get('/templates/meta', { params: { page: 1, limit: 100, status: 'APPROVED' } }),
      ]);
      setStages(stageRows);
      setEmails(rowsOf(emailPayload));
      setWhatsapp(rowsOf(envelope(metaPayload)));
    } catch (err) {
      setError(err?.response?.data?.message || 'Stage notification settings could not be loaded.');
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { load(); }, []);

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    try {
      await saveLeadStage({
        emailEnabled: form.emailEnabled,
        whatsappEnabled: form.whatsappEnabled,
        emailTemplateId: form.emailTemplateId || null,
        whatsappTemplateId: form.whatsappTemplateId || null,
        isActive: form.isActive,
      }, form.id);
      toast.success('Stage notification saved');
      setForm(null);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not save the stage notification');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Shell title="Stage Notifications" icon={faDiagramProject} description="Choose the email and WhatsApp template for each active lead stage. Creation, import, and stage changes use this configuration.">
      <TemplateTable loading={loading} error={error} rows={stages} empty="No lead stages are configured." columns={['Stage', 'Email', 'WhatsApp', 'Status', 'Actions']} render={(stage) => (
        <tr key={stage.id} className="border-t border-[#E2E8E5]">
          <td className="px-3 py-3">{stage.name}</td>
          <td className="px-3 py-3">{stage.emailEnabled ? (stage.emailTemplate?.name || 'Enabled, no template') : 'Off'}</td>
          <td className="px-3 py-3">{stage.whatsappEnabled ? (stage.whatsappTemplate?.name || 'Enabled, no template') : 'Off'}</td>
          <td className="px-3 py-3">{stage.isActive ? 'Active' : 'Inactive'}</td>
          <td className="px-3 py-3"><button type="button" className="text-[#163A2E]" onClick={() => setForm({ ...stage, emailTemplateId: stage.emailTemplateId || stage.emailTemplate?.id || '', whatsappTemplateId: stage.whatsappTemplateId || stage.whatsappTemplate?.id || '' })}>Edit</button></td>
        </tr>
      )} />
      <FormDrawer open={Boolean(form)} onOpenChange={(open) => { if (!open) setForm(null); }} title="Stage notification" loading={saving} onSubmit={save}>
        {form ? (
          <>
            <p className="text-sm font-semibold text-[#172B24]">{form.name}</p>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.emailEnabled !== false} onChange={(event) => setForm({ ...form, emailEnabled: event.target.checked })} />Email enabled</label>
            <Field label="Email template">
              <select value={form.emailTemplateId || ''} onChange={(event) => setForm({ ...form, emailTemplateId: event.target.value })} className="h-10 w-full rounded-md border border-[#E2E8E5] px-3">
                <option value="">No template</option>
                {emails.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </Field>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.whatsappEnabled !== false} onChange={(event) => setForm({ ...form, whatsappEnabled: event.target.checked })} />WhatsApp enabled</label>
            <Field label="WhatsApp template">
              <select value={form.whatsappTemplateId || ''} onChange={(event) => setForm({ ...form, whatsappTemplateId: event.target.value })} className="h-10 w-full rounded-md border border-[#E2E8E5] px-3">
                <option value="">No template</option>
                {whatsapp.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.status})</option>)}
              </select>
            </Field>
          </>
        ) : null}
      </FormDrawer>
    </Shell>
  );
}

