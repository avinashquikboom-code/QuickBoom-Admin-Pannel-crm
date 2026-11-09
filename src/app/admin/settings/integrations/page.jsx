'use client';

import * as React from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { FormDrawer } from '@/components/common/drawers/FormDrawer';
import { HrmNotice, HrmStats } from '@/modules/hrm/HrmNotice';
import { disconnectIntegration, loadIntegrations, saveIntegration, setIntegrationEnabled, suiteError, testIntegration } from '@/modules/suite/suite-api';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import { faEllipsisVertical } from '@fortawesome/free-solid-svg-icons';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
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
    const name = labelOf(row).toLowerCase();
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
    fieldsFor(row).forEach((field) => {
      if (field.secret) return;
      const source = field.group === 'config' ? row.config : field.group === 'environment' ? { environment: row.environment } : row.credentials;
      const value = field.group === 'environment' ? row.environment : source?.[field.key];
      if (typeof value === 'boolean') next[field.key] = value;
      else if (value != null && typeof value !== 'object') next[field.key] = String(value);
    });
    setForm(next);
    setReveal({});
    setActive(row);
  };

  const save = async (event) => {
    event.preventDefault();
    const payload = collect(active, form);
    try {
      const result = await testIntegration(active.provider, payload);
      const body = result?.data && typeof result.data === 'object' && !Array.isArray(result.data) ? result.data : result;
      const ok = body?.success !== false && !/fail|error/i.test(String(body?.status || ''));
      if (!ok) {
        toast.error(body?.message || 'Connection test failed. The integration was not enabled.');
        setRefresh((value) => value + 1);
        return;
      }
      await saveIntegration(active.provider, { ...payload, isEnabled: true });
      setActive(null);
      setRefresh((value) => value + 1);
      toast.success('Connection successful. Integration saved and enabled.');
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
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {visible.map((row) => {
          const result = tests[row.provider];
          const testedAt = result?.at || formatTested(row.config?.lastTestedAt);
          const busy = testing === row.provider;
          return <article key={row.provider} className="flex min-w-0 flex-col rounded-xl border border-[#E2E8E5] bg-white p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-[#172B24]">{labelOf(row)}</h3>
                <p className="text-xs text-[#718078]">{categoryOf(row)}</p>
              </div>
              <div className="flex items-center gap-1">
                <ConnectionBadge status={busy ? 'TESTING' : row.status} />
                <DropdownMenu>
                  <DropdownMenuTrigger className="inline-flex size-8 items-center justify-center rounded-md text-[#172B24] hover:bg-[#E8F1EC]" aria-label={`${labelOf(row)} actions`}>
                    <FontAwesomeIcon icon={faEllipsisVertical} className="size-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => run(() => setIntegrationEnabled(row.provider, !row.isEnabled))}>{row.isEnabled ? 'Disable' : 'Enable'}</DropdownMenuItem>
                    {row.status !== 'NOT_CONFIGURED' && <DropdownMenuItem variant="destructive" onClick={() => disconnect(row)}>Disconnect</DropdownMenuItem>}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <p className="mt-3 text-xs text-[#718078]">Last tested: {testedAt || '—'}</p>
            {result?.message && <p className={`mt-1 text-xs ${result.ok ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>{result.message}</p>}
            {!result?.message && row.config?.lastTestError && row.status === 'ERROR' && <p className="mt-1 text-xs text-[#DC2626]">{row.config.lastTestError}</p>}
            <div className="mt-4 grid grid-cols-1 gap-2 min-[480px]:grid-cols-2">
              <Button type="button" onClick={() => open(row)}>Configure</Button>
              <Button type="button" variant="outline" disabled={busy} onClick={() => runTest(row)}>
                {busy ? <span className="inline-flex items-center gap-2"><span className="size-3 animate-spin rounded-full border-2 border-current border-r-transparent" />Testing...</span> : 'Test Connection'}
              </Button>
            </div>
          </article>;
        })}
      </div>
    </HrmNotice>
    <FormDrawer open={Boolean(active)} onOpenChange={(next) => { if (!next) setActive(null); }} title={active ? labelOf(active) : 'Integration'} description="Blank secret fields keep the saved value. Save & Enable tests the connection before turning the integration on." submitLabel="Save & Enable" onSubmit={save}>
      {active && <div className="grid gap-3">{fieldsFor(active).map((field) => <Label key={field.key} className="grid gap-1 text-xs">{field.label}{field.type === 'boolean' ? <input type="checkbox" className="size-4" checked={Boolean(form[field.key])} onChange={(event) => setForm({ ...form, [field.key]: event.target.checked })} /> : field.options ? <select className="h-9 rounded-md border px-2 text-sm" value={form[field.key] || field.options[0]} onChange={(event) => setForm({ ...form, [field.key]: event.target.value })}>{field.options.map((option) => <option key={option}>{option}</option>)}</select> : <div className="flex gap-2"><Input type={field.secret && !reveal[field.key] ? 'password' : field.type === 'number' ? 'number' : 'text'} autoComplete="new-password" value={form[field.key] || ''} placeholder={field.secret ? 'Leave blank to keep the saved value' : field.placeholder || ''} onChange={(event) => setForm({ ...form, [field.key]: event.target.value })} />{field.secret && <Button type="button" variant="outline" onClick={() => setReveal({ ...reveal, [field.key]: !reveal[field.key] })}>{reveal[field.key] ? 'Hide' : 'Show'}</Button>}</div>}</Label>)}{active.provider === 'WHATSAPP' && active.config?.webhookUrl && <p className="text-xs text-slate-500">Webhook URL from the server: {active.config.webhookUrl}</p>}</div>}
    </FormDrawer>
  </div>;

  function run(action) {
    action().then(() => setRefresh((value) => value + 1)).catch((err) => toast.error(suiteError(err)));
  }
  async function runTest(row) {
    if (testing) return;
    if (!row.configured || row.source === 'NONE' || row.status === 'NOT_CONFIGURED') {
      toast.error('Configure this integration before testing.');
      return;
    }
    setTesting(row.provider);
    try {
      const result = await testIntegration(row.provider);
      const body = result?.data && typeof result.data === 'object' && !Array.isArray(result.data) ? result.data : result;
      const ok = body?.success !== false && !/fail|error/i.test(String(body?.status || ''));
      const at = formatTested(body?.lastTestedAt) || new Date().toLocaleString();
      if (!ok) {
        const message = body?.message || 'Connection test failed';
        setTests((current) => ({ ...current, [row.provider]: { ok: false, message, at } }));
        toast.error(message);
        setRefresh((value) => value + 1);
        return;
      }
      setTests((current) => ({ ...current, [row.provider]: { ok: true, message: 'Connection successful.', at } }));
      toast.success('Connection successful.');
      setRefresh((value) => value + 1);
    } catch (err) {
      const message = suiteError(err);
      setTests((current) => ({ ...current, [row.provider]: { ok: false, message, at: new Date().toLocaleString() } }));
      toast.error(message);
    } finally {
      setTesting('');
    }
  }
  function disconnect(row) {
    if (!window.confirm(`Disconnect ${labelOf(row)}? Saved credentials for this provider will be removed.`)) return;
    run(() => disconnectIntegration(row.provider));
  }
}

function fieldsFor(row) {
  if (Array.isArray(row.fields) && row.fields.length) return row.fields;
  const fallback = FIELDS[row.provider] || Object.keys(row.credentials || {}).filter((key) => !key.startsWith('has') && !key.startsWith('is')).map((key) => [key, key, /secret|password|token|apikey|privatekey/i.test(key)]);
  return fallback.map((field) => ({ key: field[0], label: field[1], secret: Boolean(field[2]), group: field[3] || 'credentials', options: field[4], type: field[4] ? 'select' : 'text' }));
}
function labelOf(row) { return row?.displayName || PRESENTATION[row?.provider]?.[0] || row?.provider || 'Integration'; }
function categoryOf(row) { return row?.category || PRESENTATION[row?.provider]?.[1] || '—'; }
function collect(row, form) {
  const credentials = {};
  const config = {};
  let environment;
  fieldsFor(row).forEach((field) => {
    const value = form[field.key];
    if (typeof value === 'boolean') {
      if (field.group === 'config') config[field.key] = value;
      return;
    }
    if (value == null || String(value).trim() === '') return;
    if (field.group === 'environment') environment = String(value).trim();
    else if (field.group === 'config') config[field.key] = field.type === 'number' ? Number(value) : String(value).trim();
    else credentials[field.key] = String(value).trim();
  });
  return { credentials, config, environment };
}
function statusOf(row, test) {
  if (!row.configured || row.source === 'NONE') return 'NOT_CONFIGURED';
  if (row.isEnabled === false) return 'DISABLED';
  if (test && test.ok === false) return 'ERROR';
  if (test && test.ok === true) return 'CONNECTED';
  if (row.config?.lastTestResult === 'FAILED') return 'ERROR';
  if (row.config?.lastTestResult === 'SUCCESS') return 'CONNECTED';
  return 'NOT_TESTED';
}
function formatTested(value) {
  if (!value || value === '—') return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
}
function ConnectionBadge({ status }) {
  const styles = {
    CONNECTED: 'bg-[#DCFCE7] text-[#16A34A]',
    ERROR: 'bg-[#FEE2E2] text-[#DC2626]',
    NOT_CONFIGURED: 'bg-slate-100 text-slate-600',
    DISABLED: 'bg-slate-100 text-slate-500',
    TESTING: 'bg-[#FEF3C7] text-[#D97706]',
    NOT_TESTED: 'bg-[#E8F1EC] text-[#163A2E]',
  };
  const labels = { CONNECTED: 'Connected', ERROR: 'Connection Error', NOT_CONFIGURED: 'Not configured', DISABLED: 'Disabled', TESTING: 'Testing...', NOT_TESTED: 'Not tested' };
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${styles[status] || styles.NOT_TESTED}`}>{labels[status] || status}</span>;
}
function filterLabel(status) {
  return { ALL: 'All', CONNECTED: 'Connected', NOT_CONFIGURED: 'Not configured', ERROR: 'Error', DISABLED: 'Disabled' }[status];
}
