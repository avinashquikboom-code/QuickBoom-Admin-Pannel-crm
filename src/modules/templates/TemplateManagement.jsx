'use client';

import * as React from 'react';
import api from '../../../lib/api';
import { PageHeader } from '@/components/layout/PageHeader';
import { KpiGrid } from '@/components/common/KpiCard';
import { FormDrawer } from '@/components/common/drawers/FormDrawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import { faEnvelope, faMessage, faPlus, faDownload, faRotate, faDiagramProject } from '@fortawesome/free-solid-svg-icons';
import { toast } from '@/hooks/use-toast';
import { listFrom } from '@/modules/hrm/hrm-api';
import { loadLeadStages, saveLeadStage } from '@/modules/crm/crm-api';

const PAGE_SIZES = [10, 25, 50, 100];

function rowsOf(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  return listFrom(payload);
}

function pageOf(payload, fallback) {
  return payload?.pagination || payload?.meta || fallback;
}

function envelope(payload) {
  const nested = payload?.data;
  if (nested && !Array.isArray(nested) && (Array.isArray(nested.items) || nested.stats || nested.meta || nested.fetched !== undefined)) return nested;
  return payload || {};
}

function downloadCsv(name, columns, rows) {
  const header = columns.map((column) => column.label).join(',');
  const body = rows.map((row) => columns.map((column) => `"${String(row[column.key] ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([`${header}\n${body}`], { type: 'text/csv' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = name;
  link.click();
  URL.revokeObjectURL(link.href);
}

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

function Pager({ page, pages, limit, total, onPage, onLimit }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-[#718078]">
      <span>{total} records</span>
      <div className="flex items-center gap-2">
        <select value={limit} onChange={(event) => onLimit(Number(event.target.value))} className="h-9 rounded-md border border-[#E2E8E5] bg-white px-2">
          {PAGE_SIZES.map((size) => <option key={size} value={size}>{size} / page</option>)}
        </select>
        <Button type="button" variant="outline" disabled={page <= 1} onClick={() => onPage(page - 1)}>Previous</Button>
        <span>{page} / {pages}</span>
        <Button type="button" variant="outline" disabled={page >= pages} onClick={() => onPage(page + 1)}>Next</Button>
      </div>
    </div>
  );
}

function EmailTemplates() {
  const [rows, setRows] = React.useState([]);
  const [stats, setStats] = React.useState({ total: 0, active: 0, inactive: 0, archived: 0, sent: 0 });
  const [search, setSearch] = React.useState('');
  const [status, setStatus] = React.useState('ALL');
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(10);
  const [pages, setPages] = React.useState(1);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [drawer, setDrawer] = React.useState(false);
  const [form, setForm] = React.useState({ name: '', key: '', subject: '', body: '', description: '', category: 'GENERAL' });
  const [saving, setSaving] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const payload = await api.get('/email/templates', { params: { page, limit, search: search || undefined, status, sort: 'updatedAt:desc' } });
      const list = rowsOf(payload);
      const pagination = pageOf(payload, { page, totalPages: 1, total: list.length });
      setRows(list);
      setPages(Math.max(1, Number(pagination.totalPages) || 1));
      setTotal(Number(pagination.total) || list.length);
      if (payload?.stats) setStats(payload.stats);
    } catch (err) {
      setError(err?.response?.data?.message || 'Email templates could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, status]);

  React.useEffect(() => { load(); }, [load]);

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    try {
      const body = { name: form.name, key: form.key, subject: form.subject, body: form.body, description: form.description, category: form.category };
      if (form.id) await api.put(`/email/templates/${form.id}`, body);
      else await api.post('/email/templates', body);
      toast.success('Email template saved');
      setDrawer(false);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not save the template');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Shell title="Email Templates" icon={faEnvelope} description="Database-backed email templates used by lead stage notifications.">
      <KpiGrid cards={[
        { title: 'Templates', value: stats.total, icon: faEnvelope },
        { title: 'Active', value: stats.active, icon: faEnvelope },
        { title: 'Inactive', value: stats.inactive, icon: faEnvelope },
        { title: 'Sent', value: stats.sent, icon: faEnvelope },
      ]} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Toolbar search={search} setSearch={(value) => { setSearch(value); setPage(1); }} status={status} setStatus={(value) => { setStatus(value); setPage(1); }} statuses={['ALL', 'ACTIVE', 'INACTIVE', 'ARCHIVED']} onExport={() => downloadCsv('email-templates.csv', [{ key: 'name', label: 'Name' }, { key: 'key', label: 'Code' }, { key: 'subject', label: 'Subject' }], rows)} />
        <Button type="button" onClick={() => { setForm({ name: '', key: '', subject: '', body: '', description: '', category: 'GENERAL' }); setDrawer(true); }}><FontAwesomeIcon icon={faPlus} className="mr-2" />Add Email Template</Button>
      </div>
      <TemplateTable loading={loading} error={error} rows={rows} empty="No email templates match this view." columns={['Name', 'Code', 'Subject', 'Status', 'Actions']} render={(row) => (
        <tr key={row.id} className="border-t border-[#E2E8E5]">
          <td className="px-3 py-3">{row.name}</td>
          <td className="px-3 py-3">{row.key}</td>
          <td className="px-3 py-3">{row.subject}</td>
          <td className="px-3 py-3">{row.deletedAt ? 'Archived' : row.isActive ? 'Active' : 'Inactive'}</td>
          <td className="px-3 py-3">
            <button type="button" className="mr-3 text-[#163A2E]" onClick={() => { setForm(row); setDrawer(true); }}>Edit</button>
            <button type="button" className="text-[#163A2E]" onClick={async () => { await api.patch(`/email/templates/${row.id}/status`, { isActive: row.deletedAt ? true : !row.isActive }); load(); }}>{row.deletedAt ? 'Restore' : row.isActive ? 'Deactivate' : 'Activate'}</button>
          </td>
        </tr>
      )} />
      <Pager page={page} pages={pages} limit={limit} total={total} onPage={setPage} onLimit={(value) => { setLimit(value); setPage(1); }} />
      <FormDrawer open={drawer} onOpenChange={setDrawer} title={form.id ? 'Edit Email Template' : 'Add Email Template'} loading={saving} onSubmit={save}>
        <Field label="Name"><Input value={form.name || ''} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></Field>
        <Field label="Code"><Input value={form.key || ''} onChange={(event) => setForm({ ...form, key: event.target.value })} required /></Field>
        <Field label="Subject"><Input value={form.subject || ''} onChange={(event) => setForm({ ...form, subject: event.target.value })} required /></Field>
        <Field label="Description"><Input value={form.description || ''} onChange={(event) => setForm({ ...form, description: event.target.value })} /></Field>
        <Field label="HTML body"><Textarea value={form.body || ''} onChange={(event) => setForm({ ...form, body: event.target.value })} rows={8} required /></Field>
      </FormDrawer>
    </Shell>
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
      <TemplateTable loading={loading} error={error} rows={rows} empty="No WhatsApp templates are stored for this company. Use Sync from Meta after the WhatsApp account is configured." columns={['Name', 'Code', 'Language', 'Category', 'Approval', 'Actions']} render={(row) => (
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
      )} />
      <Pager page={page} pages={pages} limit={limit} total={total} onPage={setPage} onLimit={(value) => { setLimit(value); setPage(1); }} />
      <FormDrawer open={Boolean(selected)} onOpenChange={(open) => { if (!open) setSelected(null); }} title={selected?.name || 'WhatsApp template'} loading={false} onSubmit={(event) => { event.preventDefault(); setSelected(null); }}>
        {selected ? <TemplateDetails template={selected} /> : null}
      </FormDrawer>
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

function TemplateTable({ loading, error, rows, empty, columns, render }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-[#E2E8E5] bg-white">
      <table className="min-w-full text-left text-sm text-[#172B24]">
        <thead className="bg-[#F7F9F8] text-[#718078]">
          <tr>{columns.map((column) => <th key={column} className="px-3 py-3 font-medium">{column}</th>)}</tr>
        </thead>
        <tbody>
          {loading ? <tr><td className="px-3 py-8 text-[#718078]" colSpan={columns.length}>Loading templates...</td></tr> : null}
          {!loading && error ? <tr><td className="px-3 py-8 text-red-600" colSpan={columns.length}>{error}</td></tr> : null}
          {!loading && !error && rows.length === 0 ? <tr><td className="px-3 py-8 text-[#718078]" colSpan={columns.length}>{empty}</td></tr> : null}
          {!loading && !error ? rows.map(render) : null}
        </tbody>
      </table>
    </div>
  );
}

function Field({ label, children }) {
  return <div className="space-y-1"><Label>{label}</Label>{children}</div>;
}
