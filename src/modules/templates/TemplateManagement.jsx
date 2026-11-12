'use client';

import * as React from 'react';
import api from '../../../lib/api';
import { PageHeader } from '@/components/layout/PageHeader';
import { KpiGrid } from '@/components/common/KpiCard';
import { FormDrawer } from '@/components/common/drawers/FormDrawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import { faEnvelope, faDownload, faDiagramProject } from '@fortawesome/free-solid-svg-icons';
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

