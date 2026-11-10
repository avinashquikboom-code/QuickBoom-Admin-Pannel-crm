'use client';

import * as React from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { FormDrawer } from '@/components/common/drawers/FormDrawer';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { HrmNotice, HrmStats } from '@/modules/hrm/HrmNotice';
import { cancelCampaign, loadCampaigns, loadCampaignSummary, loadIntegrations, loadNotificationHistory, removeCampaign, resendCampaign, saveCampaign, suiteError, uploadCampaignImage } from '@/modules/suite/suite-api';
import { loadCustomers, personName } from '@/modules/crm/crm-api';
import { loadEmployees } from '@/modules/hrm/hrm-api';
import { toast } from '@/hooks/use-toast';

const TABS = [
  ['campaigns', 'Campaigns'],
  ['delivery', 'Delivery settings'],
  ['history', 'History'],
];
const CHANNELS = [
  ['IN_APP', 'In-app notifications', 'Stored for each recipient and shown in the mobile notification list, including the image and button.'],
  ['PUSH', 'Mobile push (FCM)', 'Sent with the image URL through Firebase. The sent count is the number of device tokens Firebase accepted, not a later delivery receipt.'],
  ['EMAIL', 'Email (SMTP)', 'Credentials stay in Integrations. This campaign sender does not dispatch email.'],
  ['SMS', 'SMS (MSG91)', 'Credentials stay in Integrations. SMS is not sent by this campaign API.'],
  ['WHATSAPP', 'WhatsApp Business', 'Credentials stay in Integrations. WhatsApp template delivery is not sent by this campaign API.'],
];

const blank = { title: '', message: '', targetType: 'EMPLOYEES', audience: 'ALL', targetIds: [], imageUrl: '', previewUrl: '', showCta: true, ctaText: '', ctaActionType: 'WEB_URL', ctaActionValue: '', scheduledAt: '', mode: 'NOW' };

export default function NotificationsPage() {
  const [tab, setTab] = React.useState('campaigns');
  const [rows, setRows] = React.useState([]);
  const [summary, setSummary] = React.useState({});
  const [history, setHistory] = React.useState([]);
  const [integrations, setIntegrations] = React.useState([]);
  const [employees, setEmployees] = React.useState([]);
  const [customers, setCustomers] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [query, setQuery] = React.useState({ search: '', status: 'ALL', page: 1 });
  const [historyQuery, setHistoryQuery] = React.useState({ search: '', status: '', page: 1, from: '', to: '' });
  const [refresh, setRefresh] = React.useState(0);
  const [open, setOpen] = React.useState(false);
  const [step, setStep] = React.useState(0);
  const [form, setForm] = React.useState(blank);
  const [confirm, setConfirm] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    let alive = true;
    setLoading(true);
    Promise.all([
      loadCampaigns(query),
      loadCampaignSummary(),
      loadNotificationHistory(historyQuery),
      loadIntegrations(),
    ]).then(([campaigns, counts, deliveries, providers]) => {
      if (!alive) return;
      setRows(campaigns.rows || []);
      setSummary(counts?.data && typeof counts.data === 'object' ? counts.data : counts || {});
      setHistory(deliveries.rows || []);
      setIntegrations(providers || []);
      setError('');
    }).catch((err) => { if (alive) setError(suiteError(err)); }).finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [query, historyQuery, refresh]);

  const openForm = () => {
    setForm(blank);
    setStep(0);
    setOpen(true);
    loadEmployees().then(setEmployees).catch(() => setEmployees([]));
    loadCustomers({ page: 1, limit: 100 }).then((result) => setCustomers(result.rows || [])).catch(() => setCustomers([]));
  };

  return <div className="max-w-none min-w-0 w-full space-y-4">
    <PageHeader title="Notifications & Campaigns" description="Create, manage, schedule and deliver campaigns across the channels this notification API supports." actions={<Button onClick={openForm}>Create campaign</Button>} />
    <div className="flex flex-wrap gap-2">{TABS.map(([key, label]) => <Button key={key} size="sm" variant={tab === key ? 'default' : 'outline'} onClick={() => setTab(key)}>{label}</Button>)}</div>
    {tab === 'campaigns' && <Campaigns rows={rows} summary={summary} loading={loading} error={error} query={query} setQuery={setQuery} onRetry={() => setRefresh((value) => value + 1)} onChanged={() => setRefresh((value) => value + 1)} />}
    {tab === 'delivery' && <Delivery integrations={integrations} />}
    {tab === 'history' && <History rows={history} loading={loading} error={error} query={historyQuery} setQuery={setHistoryQuery} onRetry={() => setRefresh((value) => value + 1)} />}
    <FormDrawer open={open} onOpenChange={setOpen} title="Create campaign" description="Images are uploaded to the existing notification storage. Drafts are not sent." showFooter={false} size="lg">
      <CampaignForm step={step} setStep={setStep} form={form} setForm={setForm} employees={employees} customers={customers} saving={saving} onDraft={() => submit('DRAFT')} onReview={() => setConfirm(true)} />
    </FormDrawer>
    <ConfirmDialog open={confirm} onOpenChange={setConfirm} title={form.mode === 'LATER' ? 'Schedule this campaign?' : 'Send this campaign now?'} description={`${form.audience === 'ALL' ? 'All active' : form.targetIds.length} ${form.targetType === 'EMPLOYEES' ? 'employees' : 'customers'} will receive an in-app notification and a Firebase push when a device token exists. Email, SMS, and WhatsApp are not sent.`} confirmLabel={form.mode === 'LATER' ? 'Schedule' : 'Send'} onConfirm={() => { setConfirm(false); submit(form.mode); }} />
  </div>;

  async function submit(mode) {
    if (!form.title.trim() || !form.message.trim()) { toast.error('Campaign title and message are required.'); return; }
    if (form.audience === 'SPECIFIC' && form.targetIds.length === 0) { toast.error('Select at least one recipient.'); return; }
    if (form.showCta && !form.ctaText.trim()) { toast.error('Button text is required when a button is shown.'); return; }
    setSaving(true);
    try {
      const body = {
        title: form.title.trim(),
        message: form.message.trim(),
        targetType: form.targetType,
        audience: form.audience,
        targetIds: form.audience === 'SPECIFIC' ? form.targetIds.map(Number) : undefined,
        imageUrl: form.imageUrl || undefined,
        showCta: Boolean(form.showCta && form.ctaText),
        ctaText: form.ctaText || undefined,
        ctaActionType: form.ctaActionType,
        ctaActionValue: form.ctaActionValue || undefined,
        saveAsDraft: mode === 'DRAFT',
        scheduledAt: mode === 'LATER' && form.scheduledAt ? new Date(form.scheduledAt).toISOString() : undefined,
      };
      const result = await saveCampaign(body);
      const message = result?.data?.message || result?.message || 'Campaign saved';
      toast.success(message);
      setOpen(false);
      setRefresh((value) => value + 1);
    } catch (err) {
      toast.error(suiteError(err));
    } finally {
      setSaving(false);
    }
  }
}

function Campaigns({ rows, summary, loading, error, query, setQuery, onRetry, onChanged }) {
  return <div className="space-y-4">
    <HrmStats items={[
      { label: 'Total campaigns', value: summary.total },
      { label: 'Sent', value: summary.sent },
      { label: 'Scheduled', value: summary.scheduled },
      { label: 'Drafts', value: summary.draft },
      { label: 'Failed', value: summary.failed },
    ]} />
    <div className="flex flex-col gap-2 sm:flex-row">
      <Input value={query.search} onChange={(event) => setQuery({ ...query, search: event.target.value, page: 1 })} placeholder="Search campaigns" className="sm:max-w-xs" />
      <select aria-label="Campaign status" className="h-9 rounded-md border px-2 text-sm" value={query.status} onChange={(event) => setQuery({ ...query, status: event.target.value, page: 1 })}>
        {['ALL', 'DRAFT', 'SCHEDULED', 'SENT', 'FAILED', 'CANCELLED'].map((status) => <option key={status}>{status}</option>)}
      </select>
    </div>
    <HrmNotice loading={loading} error={error} empty={!loading && !error && rows.length === 0 ? 'No campaigns match these filters.' : ''} onRetry={onRetry}>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {rows.map((row) => <article key={row.id} className="rounded-xl border border-[#E2E8E5] bg-white p-4">
          <div className="flex gap-3">
            {row.imageUrl ? <img src={row.imageUrl} alt="" className="h-16 w-24 rounded-lg object-cover" /> : <div className="flex h-16 w-24 items-center justify-center rounded-lg bg-[#E8F1EC] text-[10px] text-[#718078]">No image</div>}
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2"><h3 className="truncate text-sm font-semibold text-[#172B24]">{row.title}</h3><span className="rounded-full bg-[#E8F1EC] px-2 py-0.5 text-[10px] font-semibold text-[#163A2E]">{row.status}</span></div>
              <p className="line-clamp-2 text-xs text-[#718078]">{row.message}</p>
              <p className="mt-1 text-xs text-[#718078]">{row.targetType} · {row.audience} · In-app and push</p>
            </div>
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
            <Metric label="Recipients" value={row.recipientCount} />
            <Metric label="Push accepted" value={row.sentCount} />
            <Metric label="Push failed" value={row.failedCount} />
            <Metric label="Scheduled" value={row.scheduledAt ? String(row.scheduledAt).slice(0, 16).replace('T', ' ') : '—'} />
          </dl>
          <p className="mt-2 text-[11px] text-[#718078]">Opens and clicks are not tracked by this campaign API.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {['DRAFT', 'SCHEDULED'].includes(row.status) && <Button size="sm" variant="outline" onClick={() => act(() => cancelCampaign(row.id), 'Campaign cancelled', onChanged)}>Cancel</Button>}
            {row.status === 'SENT' && <Button size="sm" variant="outline" onClick={() => act(() => resendCampaign(row.id), 'Campaign resent', onChanged)}>Resend</Button>}
            <Button size="sm" variant="destructive" onClick={() => act(() => removeCampaign(row.id), 'Campaign deleted', onChanged)}>Delete</Button>
          </div>
        </article>)}
      </div>
    </HrmNotice>
  </div>;
}

function Delivery({ integrations }) {
  const byProvider = Object.fromEntries((integrations || []).map((item) => [item.provider, item]));
  const rows = [
    ['In-app', 'Always available', 'Each campaign stores a notification for every recipient.'],
    ['Firebase push', providerState(byProvider.FIREBASE), 'Used when the campaign is sent. A missing Firebase configuration makes the push portion fail while in-app records can still be stored.'],
    ['SMTP email', providerState(byProvider.SMTP), 'Configured in Integrations. Campaigns do not send email.'],
    ['MSG91 SMS', providerState(byProvider.MSG91), 'Configured in Integrations. Campaigns do not send SMS.'],
    ['WhatsApp', providerState(byProvider.WHATSAPP), 'Configured in Integrations. Campaigns do not send WhatsApp templates.'],
  ];
  return <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
    {rows.map(([name, state, detail]) => <article key={name} className="rounded-xl border border-[#E2E8E5] bg-white p-4"><h3 className="text-sm font-semibold">{name}</h3><p className="mt-1 text-xs font-medium text-[#163A2E]">{state}</p><p className="mt-2 text-xs leading-relaxed text-[#718078]">{detail}</p></article>)}
  </div>;
}

function History({ rows, loading, error, query, setQuery, onRetry }) {
  return <div className="space-y-3">
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
      <Input value={query.search} onChange={(event) => setQuery({ ...query, search: event.target.value, page: 1 })} placeholder="Search history" />
      <select aria-label="Read status" className="h-9 rounded-md border px-2 text-sm" value={query.status === 'ALL' ? '' : query.status} onChange={(event) => setQuery({ ...query, status: event.target.value, page: 1 })}><option value="">All in-app records</option><option value="UNREAD">Unread</option><option value="READ">Read</option></select>
      <Input type="date" aria-label="From" value={query.from || ''} onChange={(event) => setQuery({ ...query, from: event.target.value, page: 1 })} />
      <Input type="date" aria-label="To" value={query.to || ''} onChange={(event) => setQuery({ ...query, to: event.target.value, page: 1 })} />
    </div>
    <HrmNotice loading={loading} error={error} empty={!loading && !error && rows.length === 0 ? 'No in-app campaign notifications match these filters.' : ''} onRetry={onRetry}>
      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b text-xs text-[#718078]"><tr><th className="p-3">Campaign</th><th className="p-3">Recipient</th><th className="p-3">Channel</th><th className="p-3">Status</th><th className="p-3">Stored at</th></tr></thead>
          <tbody>{rows.map((row) => <tr key={row.id} className="border-b border-slate-100"><td className="p-3"><div className="flex items-center gap-2">{row.imageUrl && <img src={row.imageUrl} alt="" className="h-8 w-12 rounded object-cover" />}<span>{row.campaignTitle}</span></div></td><td className="p-3">{row.recipient}</td><td className="p-3">In-app</td><td className="p-3">{row.status === 'READ' ? 'Read' : 'Stored'}</td><td className="p-3">{String(row.sentAt || '').slice(0, 16).replace('T', ' ')}</td></tr>)}</tbody>
        </table>
      </div>
      <p className="text-xs text-[#718078]">This history is the in-app record. Firebase acceptance is reported on the campaign as push accepted and push failed. A provider delivery receipt, open, or click is not stored.</p>
    </HrmNotice>
  </div>;
}

function CampaignForm({ step, setStep, form, setForm, employees, customers, saving, onDraft, onReview }) {
  const set = (key) => (event) => setForm({ ...form, [key]: event.target.type === 'checkbox' ? event.target.checked : event.target.value });
  const people = form.targetType === 'EMPLOYEES' ? employees : customers;
  const upload = async (file) => {
    if (!file) return;
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) { toast.error('Use a JPG, PNG, or WebP image.'); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error('Image must be 10 MB or smaller.'); return; }
    try {
      const prepared = await resizeImage(file);
      const result = await uploadCampaignImage(prepared);
      const uploaded = result?.data?.data || result?.data || result;
      setForm({ ...form, imageUrl: uploaded.imageUrl || '', previewUrl: uploaded.previewUrl || uploaded.imageUrl || '' });
      toast.success('Image uploaded');
    } catch (err) {
      toast.error(suiteError(err));
    }
  };
  return <div className="space-y-4">
    <p className="text-xs font-medium text-[#718078]">Step {step + 1} of 4</p>
    {step === 0 && <div className="grid gap-3">
      <Field label="Campaign title"><Input value={form.title} onChange={set('title')} required /></Field>
      <Field label="Message"><Input value={form.message} onChange={set('message')} required /></Field>
      <Field label="Button text"><Input value={form.ctaText} onChange={set('ctaText')} placeholder="Explore Now" /></Field>
      <Field label="Button link"><Input value={form.ctaActionValue} onChange={set('ctaActionValue')} placeholder="https:// or /app-route" /></Field>
    </div>}
    {step === 1 && <div className="space-y-3">
      <label className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[#E2E8E5] p-4 text-center text-sm" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); upload(event.dataTransfer.files?.[0]); }}>
        Drop a JPG, PNG, or WebP image, or choose a file
        <input className="mt-2 text-xs" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => upload(event.target.files?.[0])} />
      </label>
      {form.previewUrl && <img src={form.previewUrl} alt="Campaign preview" className="max-h-48 w-full rounded-xl object-cover" />}
      {form.imageUrl && <Button type="button" variant="outline" onClick={() => setForm({ ...form, imageUrl: '', previewUrl: '' })}>Remove image</Button>}
      <p className="text-xs text-[#718078]">The image is resized to 1200×630 before upload and stored through the notification image API, not in the database.</p>
    </div>}
    {step === 2 && <div className="space-y-3">
      <Field label="Audience"><select className="h-9 rounded-md border px-2 text-sm" value={form.targetType} onChange={(event) => setForm({ ...form, targetType: event.target.value, targetIds: [] })}><option value="EMPLOYEES">Employees</option><option value="CUSTOMERS">Customers</option></select></Field>
      <Field label="Selection"><select className="h-9 rounded-md border px-2 text-sm" value={form.audience} onChange={set('audience')}><option value="ALL">All active</option><option value="SPECIFIC">Selected people</option></select></Field>
      {form.audience === 'SPECIFIC' && <div className="max-h-48 space-y-1 overflow-auto rounded-lg border p-2">{people.map((person) => {
        const id = Number(person.recordId || person.id);
        const checked = form.targetIds.includes(id);
        return <label key={id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={checked} onChange={() => setForm({ ...form, targetIds: checked ? form.targetIds.filter((item) => item !== id) : [...form.targetIds, id] })} />{person.name || person.companyName || personName(person)}</label>;
      })}{people.length === 0 && <p className="text-xs text-[#718078]">No recipients returned.</p>}</div>}
      <p className="text-xs text-[#718078]">Department, role, and custom audiences are not accepted by the campaign API. Use all active people or selected employee or customer records.</p>
    </div>}
    {step === 3 && <div className="space-y-3">
      {CHANNELS.map(([key, label, detail]) => <article key={key} className="rounded-lg border p-3 text-sm"><p className="font-medium">{label}</p><p className="text-xs text-[#718078]">{detail}</p><p className="mt-1 text-xs font-medium">{key === 'EMAIL' || key === 'SMS' || key === 'WHATSAPP' ? 'Not available for sending' : 'Included when this campaign is sent'}</p></article>)}
      <Field label="When"><select className="h-9 rounded-md border px-2 text-sm" value={form.mode} onChange={set('mode')}><option value="NOW">Send immediately</option><option value="LATER">Schedule</option></select></Field>
      {form.mode === 'LATER' && <Field label="Date and time"><Input type="datetime-local" value={form.scheduledAt} onChange={set('scheduledAt')} /></Field>}
      <Preview form={form} />
    </div>}
    <div className="flex flex-wrap justify-between gap-2">
      <Button type="button" variant="outline" disabled={step === 0} onClick={() => setStep(step - 1)}>Back</Button>
      <div className="flex gap-2">
        <Button type="button" variant="outline" disabled={saving} onClick={onDraft}>Save draft</Button>
        {step < 3 ? <Button type="button" onClick={() => setStep(step + 1)}>Continue</Button> : <Button type="button" disabled={saving} onClick={onReview}>{form.mode === 'LATER' ? 'Review schedule' : 'Review and send'}</Button>}
      </div>
    </div>
  </div>;
}

function Preview({ form }) {
  return <div className="grid gap-3 md:grid-cols-2">
    <div className="rounded-2xl border bg-[#F7F9F8] p-3"><p className="text-[10px] font-semibold uppercase text-[#718078]">Mobile in-app</p>{form.previewUrl && <img src={form.previewUrl} alt="" className="mt-2 h-24 w-full rounded-lg object-cover" />}<p className="mt-2 text-sm font-semibold">{form.title || 'Campaign title'}</p><p className="text-xs">{form.message || 'Message'}</p>{form.ctaText && <span className="mt-2 inline-block rounded-md bg-[#163A2E] px-2 py-1 text-xs text-white">{form.ctaText}</span>}</div>
    <div className="rounded-2xl border p-3"><p className="text-[10px] font-semibold uppercase text-[#718078]">Push notification</p><p className="mt-2 text-sm font-semibold">{form.title || 'Campaign title'}</p><p className="text-xs">{form.message || 'Message'}</p><p className="mt-2 text-[11px] text-[#718078]">Android and iOS use the Firebase image field when the uploaded image URL is public to the device. Email and WhatsApp previews are not sent.</p></div>
  </div>;
}

function Metric({ label, value }) { return <div><dt className="text-[#718078]">{label}</dt><dd className="font-medium text-[#172B24]">{value ?? '—'}</dd></div>; }
function Field({ label, children }) { return <Label className="grid gap-1 text-xs">{label}{children}</Label>; }
function providerState(row) {
  if (!row || row.source === 'NONE' || row.configured === false) return 'Not configured';
  if (row.config?.lastTestResult === 'FAILED') return 'Connection error';
  if (row.config?.lastTestResult === 'SUCCESS') return 'Connection tested';
  return row.isEnabled === false ? 'Disabled' : 'Configured';
}
function act(action, success, done) {
  action().then((result) => { toast.success(result?.data?.message || result?.message || success); done(); }).catch((err) => toast.error(suiteError(err)));
}
function resizeImage(file) {
  return new Promise((resolve) => {
    const image = new Image();
    const url = URL.createObjectURL(file);
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 630;
      const scale = Math.max(1200 / image.width, 630 / image.height);
      const width = image.width * scale;
      const height = image.height * scale;
      canvas.getContext('2d').drawImage(image, (1200 - width) / 2, (630 - height) / 2, width, height);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => resolve(new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' })), 'image/jpeg', 0.86);
    };
    image.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    image.src = url;
  });
}
