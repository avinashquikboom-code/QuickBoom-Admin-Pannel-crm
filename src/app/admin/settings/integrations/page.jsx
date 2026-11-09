'use client';

import * as React from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { StatusBadge } from '@/components/common/StatusBadge';
import { FormDrawer } from '@/components/common/drawers/FormDrawer';
import { HrmNotice, HrmStats } from '@/modules/hrm/HrmNotice';
import { disconnectIntegration, loadIntegrations, saveIntegration, setIntegrationEnabled, suiteError, testIntegration } from '@/modules/suite/suite-api';
import { toast } from '@/hooks/use-toast';

const PRESENTATION = {
  AWS: ['AWS S3', 'Storage'],
  MSG91: ['MSG91', 'Messaging'],
  GOOGLE_MAPS: ['Google Maps', 'Maps'],
  WHATSAPP: ['WhatsApp Business', 'Messaging'],
  SMTP: ['SMTP Email', 'Email'],
  GEMINI: ['Google Gemini', 'AI'],
  OPENAI: ['OpenAI', 'AI'],
  FIREBASE: ['Firebase', 'Messaging'],
  RAZORPAY: ['Razorpay', 'Payments'],
};

const FIELDS = {
  AWS: [
    ['accessKeyId', 'Access key ID'],
    ['secretAccessKey', 'Secret access key', true],
    ['bucket', 'Bucket name'],
    ['region', 'Region'],
    ['customDomain', 'Custom domain'],
  ],
  MSG91: [
    ['authKey', 'Authentication key', true],
    ['senderId', 'Sender ID'],
    ['templateId', 'Template ID'],
    ['otpExpiry', 'OTP expiry seconds', false, 'config'],
  ],
  GOOGLE_MAPS: [['apiKey', 'API key', true]],
  WHATSAPP: [
    ['accessToken', 'Access token', true],
    ['phoneNumberId', 'Phone number ID'],
    ['businessAccountId', 'Business account ID'],
    ['appId', 'App ID'],
    ['verifyToken', 'Verify token'],
    ['apiVersion', 'API version'],
  ],
  SMTP: [
    ['host', 'SMTP host', false, 'config'],
    ['port', 'Port', false, 'config'],
    ['security', 'Encryption', false, 'config', ['TLS', 'SSL', 'NONE']],
    ['username', 'Username', true],
    ['password', 'Password', true],
    ['fromEmail', 'From email', false, 'config'],
    ['fromName', 'From name', false, 'config'],
  ],
  GEMINI: [['apiKey', 'API key', true]],
  OPENAI: [['apiKey', 'API key', true], ['imageModel', 'Image model']],
  FIREBASE: [
    ['projectId', 'Project ID'],
    ['clientEmail', 'Client email'],
    ['privateKey', 'Private key', true],
    ['apiKey', 'API key', true],
    ['appId', 'App ID'],
    ['messagingSenderId', 'Sender ID'],
  ],
  RAZORPAY: [
    ['keyId', 'Key ID'],
    ['keySecret', 'Key secret', true],
    ['webhookSecret', 'Webhook secret', true],
  ],
};

export default function IntegrationsPage() {
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [query, setQuery] = React.useState('');
  const [filter, setFilter] = React.useState('ALL');
  const [tests, setTests] = React.useState({});
  const [testing, setTesting] = React.useState('');
  const [active, setActive] = React.useState(null);
  const [form, setForm] = React.useState({});
  const [reveal, setReveal] = React.useState({});
  const [refresh, setRefresh] = React.useState(0);

  React.useEffect(() => {
    let alive = true;
    setLoading(true);
    loadIntegrations()
      .then((items) => { if (alive) { setRows(items); setError(''); } })
      .catch((err) => { if (alive) setError(suiteError(err)); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [refresh]);

  const listed = rows.map((row) => ({ ...row, status: statusOf(row, tests[row.provider]) }));
  const visible = listed.filter((row) => {
    const name = labelOf(row.provider).toLowerCase();
    const matches = !query || name.includes(query.trim().toLowerCase()) || String(row.provider).toLowerCase().includes(query.trim().toLowerCase());
    return matches && (filter === 'ALL' || row.status === filter);
  });
  const counts = {
    total: listed.length,
    connected: listed.filter((row) => row.status === 'CONNECTED').length,
    missing: listed.filter((row) => row.status === 'NOT_CONFIGURED').length,
    issues: listed.filter((row) => row.status === 'ERROR').length,
  };

  const open = (row) => {
    const next = {};
    fieldsFor(row).forEach(([key, , secret, group]) => {
      if (secret) return;
      const source = group === 'config' ? row.config : row.credentials;
      const value = source?.[key];
      if (value != null && typeof value !== 'object') next[key] = String(value);
    });
    setForm(next);
    setReveal({});
    setActive(row);
  };

  const save = async (event) => {
    event.preventDefault();
    const credentials = {};
    const config = {};
    fieldsFor(active).forEach(([key, , , group]) => {
      const value = form[key];
      if (value == null || String(value).trim() === '') return;
      if (group === 'config') config[key] = key === 'port' || key === 'otpExpiry' ? Number(value) : String(value).trim();
      else credentials[key] = String(value).trim();
    });
    try {
      await saveIntegration(active.provider, { credentials, config, isEnabled: active.isEnabled !== false });
      setActive(null);
      setRefresh((value) => value + 1);
      toast.success('Integration saved');
    } catch (err) {
      toast.error(suiteError(err));
    }
  };

  return <div className="mx-auto max-w-7xl space-y-4">
    <PageHeader title="Integrations" description="Manage and configure third-party services connected to QB Suite." actions={<Button variant="outline" onClick={() => setRefresh((value) => value + 1)}>Refresh</Button>} />
    <HrmStats items={[{ label: 'Total integrations', value: counts.total }, { label: 'Connected', value: counts.connected }, { label: 'Not configured', value: counts.missing }, { label: 'Connection issues', value: counts.issues }]} />
    <div className="flex flex-col gap-2 sm:flex-row">
      <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search integrations" className="sm:max-w-xs" />
      <div className="flex flex-wrap gap-1">{['ALL', 'CONNECTED', 'NOT_CONFIGURED', 'ERROR', 'DISABLED'].map((item) => <Button key={item} size="sm" variant={filter === item ? 'default' : 'outline'} onClick={() => setFilter(item)}>{filterLabel(item)}</Button>)}</div>
    </div>
    <HrmNotice loading={loading} error={error} empty={!loading && !error && visible.length === 0 ? 'No integrations match these filters.' : ''} onRetry={() => setRefresh((value) => value + 1)}>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b text-xs text-slate-500"><tr><th className="py-2 pr-3">Integration</th><th className="py-2 pr-3">Category</th><th className="py-2 pr-3">Status</th><th className="py-2 pr-3">Last tested</th><th className="py-2">Actions</th></tr></thead>
          <tbody>{visible.map((row) => <tr key={row.provider} className="border-b border-slate-100"><td className="py-2 pr-3 font-medium">{labelOf(row.provider)}</td><td className="py-2 pr-3">{categoryOf(row.provider)}</td><td className="py-2 pr-3"><StatusBadge status={statusText(row.status)} /></td><td className="py-2 pr-3">{tests[row.provider]?.at || '—'}</td><td className="py-2"><Actions row={row} testing={testing} onOpen={() => open(row)} onTest={() => runTest(row)} onToggle={() => run(() => setIntegrationEnabled(row.provider, !row.isEnabled))} onDisconnect={() => disconnect(row)} /></td></tr>)}</tbody>
        </table>
      </div>
      <div className="grid gap-2 md:hidden">{visible.map((row) => <article key={row.provider} className="rounded-xl border bg-white p-3 text-sm"><div className="flex items-center justify-between"><p className="font-medium">{labelOf(row.provider)}</p><StatusBadge status={statusText(row.status)} /></div><p className="text-xs text-slate-500">{categoryOf(row.provider)} · Tested {tests[row.provider]?.at || '—'}</p>{tests[row.provider]?.message && <p className="mt-1 text-xs">{tests[row.provider].message}</p>}<div className="mt-2"><Actions row={row} testing={testing} onOpen={() => open(row)} onTest={() => runTest(row)} onToggle={() => run(() => setIntegrationEnabled(row.provider, !row.isEnabled))} onDisconnect={() => disconnect(row)} /></div></article>)}</div>
    </HrmNotice>
    <FormDrawer open={Boolean(active)} onOpenChange={(next) => { if (!next) setActive(null); }} title={active ? labelOf(active.provider) : 'Integration'} description="Blank secret fields keep the saved value. Secrets are not written back into this form." onSubmit={save}>
      {active && <div className="grid gap-3">{fieldsFor(active).map(([key, label, secret, , options]) => <Label key={key} className="grid gap-1 text-xs">{label}{options ? <select className="h-9 rounded-md border px-2 text-sm" value={form[key] || options[0]} onChange={(event) => setForm({ ...form, [key]: event.target.value })}>{options.map((option) => <option key={option}>{option}</option>)}</select> : <div className="flex gap-2"><Input type={secret && !reveal[key] ? 'password' : 'text'} autoComplete="new-password" value={form[key] || ''} placeholder={secret ? 'Leave blank to keep the saved value' : ''} onChange={(event) => setForm({ ...form, [key]: event.target.value })} />{secret && <Button type="button" variant="outline" onClick={() => setReveal({ ...reveal, [key]: !reveal[key] })}>{reveal[key] ? 'Hide' : 'Show'}</Button>}</div>}</Label>)}{active.provider === 'WHATSAPP' && active.config?.webhookUrl && <p className="text-xs text-slate-500">Webhook URL from the server: {active.config.webhookUrl}</p>}</div>}
    </FormDrawer>
  </div>;

  function run(action) {
    action().then(() => setRefresh((value) => value + 1)).catch((err) => toast.error(suiteError(err)));
  }
  async function runTest(row) {
    setTesting(row.provider);
    try {
      const result = await testIntegration(row.provider);
      setTests((current) => ({ ...current, [row.provider]: { ok: result?.success !== false && result?.status !== 'FAILED', message: result?.message || 'Connection test finished', at: new Date().toLocaleString() } }));
      toast.success(result?.message || 'Connection test finished');
    } catch (err) {
      const message = suiteError(err);
      setTests((current) => ({ ...current, [row.provider]: { ok: false, message, at: new Date().toLocaleString() } }));
      toast.error(message);
    } finally {
      setTesting('');
    }
  }
  function disconnect(row) {
    if (!window.confirm(`Disconnect ${labelOf(row.provider)}? Saved credentials for this provider will be removed.`)) return;
    run(() => disconnectIntegration(row.provider));
  }
}

function Actions({ row, testing, onOpen, onTest, onToggle, onDisconnect }) {
  const configured = row.status !== 'NOT_CONFIGURED';
  return <div className="flex flex-wrap gap-1">
    <Button size="sm" variant="outline" onClick={onOpen}>{configured ? 'Manage' : 'Configure'}</Button>
    <Button size="sm" variant="outline" disabled={testing === row.provider} onClick={onTest}>{testing === row.provider ? 'Testing' : row.status === 'ERROR' ? 'Retry' : 'Test'}</Button>
    <Button size="sm" variant="outline" onClick={onToggle}>{row.isEnabled ? 'Disable' : 'Enable'}</Button>
    {configured && <Button size="sm" variant="outline" onClick={onDisconnect}>Disconnect</Button>}
  </div>;
}

function fieldsFor(row) {
  if (FIELDS[row.provider]) return FIELDS[row.provider];
  return Object.keys(row.credentials || {}).filter((key) => !key.startsWith('has') && !key.startsWith('is')).map((key) => [key, key, /secret|password|token|apikey|privatekey/i.test(key)]);
}
function labelOf(provider) { return PRESENTATION[provider]?.[0] || provider; }
function categoryOf(provider) { return PRESENTATION[provider]?.[1] || '—'; }
function statusOf(row, test) {
  if (test && test.ok === false) return 'ERROR';
  if (test && test.ok === true) return 'CONNECTED';
  if (!row.configured || row.source === 'NONE') return 'NOT_CONFIGURED';
  if (row.isEnabled === false) return 'DISABLED';
  return 'NOT_TESTED';
}
function statusText(status) {
  return { CONNECTED: 'connected', NOT_CONFIGURED: 'not configured', ERROR: 'error', DISABLED: 'inactive', NOT_TESTED: 'not tested' }[status] || status;
}
function filterLabel(status) {
  return { ALL: 'All', CONNECTED: 'Connected', NOT_CONFIGURED: 'Not configured', ERROR: 'Error', DISABLED: 'Disabled' }[status];
}
