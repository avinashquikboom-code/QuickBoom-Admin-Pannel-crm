'use client';

import * as React from 'react';
import Link from 'next/link';
import api from '../../../../lib/api';
import { PageHeader } from '@/components/layout/PageHeader';
import { KpiGrid } from '@/components/common/KpiCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import { faBullhorn, faPlus, faRotateLeft } from '@fortawesome/free-solid-svg-icons';
import { toast } from '@/hooks/use-toast';
import { envelope, Field, pageOf, Pager, rowsOf } from '../template-shared';
import { WhatsAppPreview } from './meta-shared';

const WIZARD_STEPS = ['Details', 'Template', 'Variables', 'Audience', 'Schedule', 'Confirm'];

export function MetaWhatsAppCampaigns() {
  const [stats, setStats] = React.useState({});
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [status, setStatus] = React.useState('ALL');
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(10);
  const [pages, setPages] = React.useState(1);
  const [total, setTotal] = React.useState(0);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [wizardStep, setWizardStep] = React.useState(0);
  const [approvedTemplates, setApprovedTemplates] = React.useState([]);
  const [form, setForm] = React.useState({
    name: '',
    metaTemplateId: '',
    variableMapping: {},
    audienceType: 'MANUAL',
    manualRecipients: '',
    scheduledAt: '',
    launchNow: false,
  });
  const [saving, setSaving] = React.useState(false);

  const selectedTemplate = approvedTemplates.find((item) => String(item.id) === String(form.metaTemplateId));

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const payload = envelope(
        await api.get('/templates/meta/campaigns', {
          params: { page, limit, search: search || undefined, status: status === 'ALL' ? undefined : status },
        }),
      );
      setRows(rowsOf(payload));
      if (payload?.stats) setStats(payload.stats);
      const pagination = pageOf(payload, { page, totalPages: 1, total: 0 });
      setPages(Math.max(1, Number(pagination.totalPages) || 1));
      setTotal(Number(pagination.total) || 0);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not load campaigns.');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, status]);

  React.useEffect(() => {
    load();
  }, [load]);

  async function loadApprovedTemplates() {
    try {
      const payload = envelope(
        await api.get('/templates/meta', { params: { status: 'APPROVED', limit: 100, page: 1 } }),
      );
      setApprovedTemplates(rowsOf(payload).filter((row) => row.status === 'APPROVED' && row.isLocalActive !== false));
    } catch {
      setApprovedTemplates([]);
    }
  }

  function openCreate() {
    setWizardStep(0);
    setForm({
      name: '',
      metaTemplateId: '',
      variableMapping: {},
      audienceType: 'MANUAL',
      manualRecipients: '',
      scheduledAt: '',
      launchNow: false,
    });
    loadApprovedTemplates();
    setCreateOpen(true);
  }

  async function createCampaign() {
    if (!form.name.trim()) return toast.error('Campaign name is required.');
    if (!form.metaTemplateId) return toast.error('Select an approved template.');
    const phones = form.manualRecipients
      .split(/[\n,;]+/)
      .map((item) => item.trim())
      .filter(Boolean);
    if (form.audienceType === 'MANUAL' && !phones.length) return toast.error('Enter at least one recipient phone number.');

    setSaving(true);
    try {
      const body = {
        name: form.name.trim(),
        metaTemplateId: Number(form.metaTemplateId),
        variableMapping: form.variableMapping,
        audienceType: form.audienceType,
        manualRecipients: form.audienceType === 'MANUAL' ? phones : undefined,
        scheduledAt: form.launchNow ? undefined : form.scheduledAt || undefined,
      };
      const created = envelope(await api.post('/templates/meta/campaigns', body));
      const id = created?.id || created?.data?.id;
      if (form.launchNow && id) {
        await api.post(`/templates/meta/campaigns/${id}/launch`, {});
        toast.success('Campaign created and launch started.');
      } else {
        toast.success(form.scheduledAt ? 'Campaign scheduled.' : 'Campaign saved as draft.');
      }
      setCreateOpen(false);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Could not create campaign.');
    } finally {
      setSaving(false);
    }
  }

  async function launch(id) {
    try {
      await api.post(`/templates/meta/campaigns/${id}/launch`, {});
      toast.success('Campaign launch started.');
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Launch failed.');
    }
  }

  async function cancel(id) {
    try {
      await api.post(`/templates/meta/campaigns/${id}/cancel`, {});
      toast.success('Campaign cancelled.');
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Cancel failed.');
    }
  }

  const templateVars = React.useMemo(() => {
    const body = selectedTemplate?.body || selectedTemplate?.bodyText || '';
    return [...String(body).matchAll(/\{\{(\w+)\}\}/g)].map((match) => match[1]);
  }, [selectedTemplate]);

  return (
    <div className="min-w-0 w-full max-w-full space-y-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <PageHeader
        category="TEMPLATES & ASSETS"
        title="WhatsApp Campaigns"
        icon={faBullhorn}
        description="Create, manage and track WhatsApp messaging campaigns."
        actions={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Button type="button" className="w-full sm:w-auto" onClick={openCreate}>
              <FontAwesomeIcon icon={faPlus} className="mr-2" />
              Create Campaign
            </Button>
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link href="/admin/sections/meta-templates">
                <FontAwesomeIcon icon={faRotateLeft} className="mr-2" />
                All Templates
              </Link>
            </Button>
          </div>
        }
      />

      <KpiGrid
        className="grid-cols-1 min-[440px]:grid-cols-2 xl:grid-cols-6"
        cards={[
          { title: 'Total Campaigns', value: stats.total ?? 0, icon: faBullhorn },
          { title: 'Draft', value: stats.draft ?? 0, icon: faBullhorn },
          { title: 'Scheduled', value: stats.scheduled ?? 0, icon: faBullhorn },
          { title: 'Running', value: stats.running ?? 0, icon: faBullhorn },
          { title: 'Completed', value: stats.completed ?? 0, icon: faBullhorn },
          { title: 'Failed', value: stats.failed ?? 0, icon: faBullhorn },
        ]}
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search campaigns" className="h-10 w-full sm:max-w-xs" />
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="h-10 rounded-md border px-3 text-sm">
          {['ALL', 'DRAFT', 'SCHEDULED', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED'].map((item) => (
            <option key={item} value={item}>{item === 'ALL' ? 'All statuses' : item}</option>
          ))}
        </select>
      </div>

      <div className="hidden overflow-x-auto rounded-xl border md:block">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-[#F8FAF9] text-xs uppercase text-[#718078]">
            <tr>
              <th className="px-3 py-3">Campaign</th>
              <th className="px-3 py-3">Template</th>
              <th className="px-3 py-3">Audience</th>
              <th className="px-3 py-3">Scheduled</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Sent</th>
              <th className="px-3 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-3 py-8 text-center text-[#718078]">Loading…</td></tr>
            ) : rows.length ? rows.map((row) => (
              <tr key={row.id} className="border-t border-[#E2E8E5]">
                <td className="px-3 py-3 font-medium">{row.name}</td>
                <td className="px-3 py-3">{row.metaTemplate?.name || row.metaTemplate?.templateName || '—'}</td>
                <td className="px-3 py-3">{row.recipientCount ?? 0}</td>
                <td className="px-3 py-3">{row.scheduledAt ? new Date(row.scheduledAt).toLocaleString() : '—'}</td>
                <td className="px-3 py-3"><span className="rounded-full bg-[#E8F1EC] px-2 py-1 text-xs font-semibold">{row.status}</span></td>
                <td className="px-3 py-3">{row.sentCount ?? 0}</td>
                <td className="whitespace-nowrap px-3 py-3">
                  {['DRAFT', 'SCHEDULED'].includes(row.status) ? (
                    <button type="button" className="mr-3 text-[#163A2E]" onClick={() => launch(row.id)}>Launch</button>
                  ) : null}
                  {!['COMPLETED', 'FAILED', 'CANCELLED'].includes(row.status) ? (
                    <button type="button" className="text-red-700" onClick={() => cancel(row.id)}>Cancel</button>
                  ) : null}
                </td>
              </tr>
            )) : (
              <tr><td colSpan={7} className="px-3 py-8 text-center text-[#718078]">No campaigns yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {loading ? <p className="rounded-xl border p-4 text-sm">Loading…</p> : rows.map((row) => (
          <article key={row.id} className="rounded-xl border bg-white p-4">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold">{row.name}</h3>
              <span className="text-xs font-semibold text-[#163A2E]">{row.status}</span>
            </div>
            <p className="mt-1 text-xs text-[#718078]">{row.metaTemplate?.name} · {row.recipientCount} recipients · sent {row.sentCount ?? 0}</p>
            <div className="mt-3 flex gap-2">
              {['DRAFT', 'SCHEDULED'].includes(row.status) ? <Button type="button" variant="outline" className="flex-1" onClick={() => launch(row.id)}>Launch</Button> : null}
              {!['COMPLETED', 'FAILED', 'CANCELLED'].includes(row.status) ? <Button type="button" variant="outline" className="flex-1" onClick={() => cancel(row.id)}>Cancel</Button> : null}
            </div>
          </article>
        ))}
      </div>

      <Pager page={page} pages={pages} limit={limit} total={total} onPage={setPage} onLimit={(value) => { setLimit(value); setPage(1); }} />

      {createOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-0 sm:items-center sm:p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) setCreateOpen(false); }}>
          <motionDialog className="flex max-h-[96dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:rounded-2xl">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h2 className="text-lg font-semibold">Create campaign</h2>
              <button type="button" className="min-h-11 min-w-11 rounded-lg border" onClick={() => setCreateOpen(false)} aria-label="Close">×</button>
            </div>
            <div className="flex gap-1 overflow-x-auto border-b px-4 py-2 text-xs">
              {WIZARD_STEPS.map((label, index) => (
                <span key={label} className={`shrink-0 rounded-full px-2 py-1 ${index === wizardStep ? 'bg-[#163A2E] text-white' : 'text-[#718078]'}`}>{label}</span>
              ))}
            </div>
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
              {wizardStep === 0 ? (
                <Field label="Campaign name" required>
                  <Input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
                </Field>
              ) : null}
              {wizardStep === 1 ? (
                <Field label="Approved template" required>
                  <select value={form.metaTemplateId} onChange={(e) => setForm((prev) => ({ ...prev, metaTemplateId: e.target.value }))} className="h-10 w-full rounded-md border px-3 text-sm">
                    <option value="">Select template</option>
                    {approvedTemplates.map((tpl) => (
                      <option key={tpl.id} value={tpl.id}>{tpl.name} ({tpl.templateName || tpl.key})</option>
                    ))}
                  </select>
                  {!approvedTemplates.length ? <p className="mt-2 text-sm text-amber-700">No approved templates. Sync from Meta or wait for approval.</p> : null}
                  {selectedTemplate ? (
                    <div className="mt-4">
                      <WhatsAppPreview body={(selectedTemplate.body || selectedTemplate.bodyText || '').replace(/\{\{(\w+)\}\}/g, '[$1]')} footer={selectedTemplate.footer || selectedTemplate.footerText} />
                    </div>
                  ) : null}
                </Field>
              ) : null}
              {wizardStep === 2 ? (
                <div className="space-y-3">
                  {templateVars.length ? templateVars.map((key) => (
                    <Field key={key} label={`{{${key}}}`}>
                      <Input
                        value={form.variableMapping[key] || ''}
                        onChange={(e) => setForm((prev) => ({ ...prev, variableMapping: { ...prev.variableMapping, [key]: e.target.value } }))}
                        placeholder={`Value for ${key}`}
                      />
                    </Field>
                  )) : <p className="text-sm text-[#718078]">This template has no variables.</p>}
                </div>
              ) : null}
              {wizardStep === 3 ? (
                <>
                  <Field label="Audience">
                    <select value={form.audienceType} onChange={(e) => setForm((prev) => ({ ...prev, audienceType: e.target.value }))} className="h-10 w-full rounded-md border px-3 text-sm">
                      <option value="MANUAL">Manual phone list</option>
                      <option value="LEAD_FILTER">CRM lead filter (backend)</option>
                    </select>
                  </Field>
                  {form.audienceType === 'MANUAL' ? (
                    <Field label="Recipients" hint="One number per line or comma-separated (with country code)">
                      <textarea value={form.manualRecipients} onChange={(e) => setForm((prev) => ({ ...prev, manualRecipients: e.target.value }))} rows={6} className="w-full rounded-md border px-3 py-2 text-sm" />
                    </Field>
                  ) : (
                    <p className="text-sm text-[#718078]">Lead filter campaigns use your existing CRM audience rules on the server when you save.</p>
                  )}
                </>
              ) : null}
              {wizardStep === 4 ? (
                <>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={form.launchNow} onChange={(e) => setForm((prev) => ({ ...prev, launchNow: e.target.checked, scheduledAt: e.target.checked ? '' : prev.scheduledAt }))} />
                    Send immediately after confirmation (launch on create)
                  </label>
                  {!form.launchNow ? (
                    <Field label="Schedule (optional)">
                      <Input type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm((prev) => ({ ...prev, scheduledAt: e.target.value }))} />
                    </Field>
                  ) : null}
                </>
              ) : null}
              {wizardStep === 5 ? (
                <dl className="space-y-2 text-sm">
                  <p><strong>Name:</strong> {form.name}</p>
                  <p><strong>Template:</strong> {selectedTemplate?.name || '—'}</p>
                  <p><strong>Audience:</strong> {form.audienceType === 'MANUAL' ? `${form.manualRecipients.split(/[\n,;]+/).filter(Boolean).length} numbers` : 'Lead filter'}</p>
                  <p><strong>Schedule:</strong> {form.launchNow ? 'Launch immediately' : form.scheduledAt || 'Save as draft'}</p>
                </dl>
              ) : null}
            </div>
            <div className="flex flex-col-reverse gap-2 border-t p-4 sm:flex-row sm:justify-between">
              <Button type="button" variant="outline" disabled={wizardStep === 0 || saving} onClick={() => setWizardStep((v) => Math.max(0, v - 1))}>Back</Button>
              {wizardStep < WIZARD_STEPS.length - 1 ? (
                <Button type="button" onClick={() => setWizardStep((v) => Math.min(WIZARD_STEPS.length - 1, v + 1))}>Next</Button>
              ) : (
                <Button type="button" disabled={saving} onClick={createCampaign}>{saving ? 'Saving…' : 'Confirm & create'}</Button>
              )}
            </div>
          </motionDialog>
        </div>
      ) : null}
    </div>
  );
}

function motionDialog({ children, className }) {
  return <div className={className}>{children}</div>;
}
